import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

function parseWebhook(url: string) {
  const m = String(url || "").match(/webhooks\/(\d+)\/([^/?]+)/i);
  if (!m) return null;
  return { webhookId: m[1], webhookToken: m[2] };
}

async function resolveMessageChannelId(
  webhookId: string,
  webhookToken: string,
  messageId: string,
  channelIdHint?: string,
) {
  const hint = String(channelIdHint || "").trim();
  if (hint) {
    return { ok: true as const, channelId: hint, source: "hint" as const };
  }

  const msgRes = await fetch(
    `https://discord.com/api/v10/webhooks/${webhookId}/${webhookToken}/messages/${encodeURIComponent(messageId)}`,
  );
  if (msgRes.ok) {
    const data = await msgRes.json();
    const channelId = data && data.channel_id ? String(data.channel_id) : "";
    if (channelId) {
      return { ok: true as const, channelId, source: "message" as const };
    }
  }

  const whRes = await fetch(
    `https://discord.com/api/v10/webhooks/${webhookId}/${webhookToken}`,
  );
  if (whRes.ok) {
    const data = await whRes.json();
    const channelId = data && data.channel_id ? String(data.channel_id) : "";
    if (channelId) {
      return { ok: true as const, channelId, source: "webhook" as const };
    }
  }

  const detail = msgRes.ok
    ? "channel_id tidak ditemukan dari pesan Discord"
    : (await msgRes.text()).slice(0, 500) ||
      (await whRes.text()).slice(0, 500);

  return {
    ok: false as const,
    status: msgRes.status || whRes.status || 404,
    detail,
  };
}

async function botReaction(
  channelId: string,
  messageId: string,
  emoji: string,
  method: string,
) {
  const botToken = Deno.env.get("DISCORD_BOT_TOKEN") || "";
  if (!botToken) {
    return {
      ok: false,
      status: 503,
      detail:
        "DISCORD_BOT_TOKEN belum di-set. Supabase → Edge Functions → discord-webhook-proxy → Secrets.",
    };
  }

  const enc = encodeURIComponent(emoji);
  const url =
    `https://discord.com/api/v10/channels/${channelId}/messages/${encodeURIComponent(messageId)}/reactions/${enc}/@me`;
  const res = await fetch(url, {
    method,
    headers: { Authorization: `Bot ${botToken}` },
  });
  const text = await res.text();
  const ok =
    res.ok ||
    res.status === 204 ||
    (method === "DELETE" && res.status === 404);
  return {
    ok,
    status: res.status,
    detail: text.slice(0, 500),
    channelId,
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const webhookUrl = String(body.webhookUrl || "");
    const messageId = String(body.messageId || "").trim();
    const channelIdHint = String(body.channelId || "").trim();
    const action = String(body.action || "delete_message");
    const method = String(body.method || "DELETE").toUpperCase();
    const emoji = String(body.emoji || "✅");
    const payload = body.body;

    const parsed = parseWebhook(webhookUrl);
    if (!parsed || !messageId) {
      return json(
        { ok: false, status: 400, detail: "webhook atau message id tidak valid" },
        400,
      );
    }

    if (action === "reaction") {
      const channel = await resolveMessageChannelId(
        parsed.webhookId,
        parsed.webhookToken,
        messageId,
        channelIdHint,
      );
      if (!channel.ok) {
        return json({
          ok: false,
          status: channel.status,
          detail: channel.detail,
        });
      }
      const result = await botReaction(
        channel.channelId,
        messageId,
        emoji,
        method,
      );
      return json({ ...result, channelSource: channel.source });
    }

    let url =
      `https://discord.com/api/webhooks/${parsed.webhookId}/${parsed.webhookToken}/messages/${encodeURIComponent(messageId)}`;

    const init: RequestInit = { method };
    if (
      payload != null &&
      (method === "PATCH" || method === "POST" || method === "PUT")
    ) {
      init.headers = { "Content-Type": "application/json" };
      init.body = JSON.stringify(payload);
    }

    const res = await fetch(url, init);
    const text = await res.text();
    const ok =
      res.ok ||
      res.status === 204 ||
      (method === "DELETE" && res.status === 404);

    return json({ ok, status: res.status, detail: text.slice(0, 500) });
  } catch (e) {
    return json(
      {
        ok: false,
        status: 0,
        detail: String(e instanceof Error ? e.message : e),
      },
      500,
    );
  }
});

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
