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

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const webhookUrl = String(body.webhookUrl || "");
    const messageId = String(body.messageId || "").trim();
    const action = String(body.action || "delete_message");
    const method = String(body.method || "DELETE").toUpperCase();
    const emoji = String(body.emoji || "✅");
    const payload = body.body;

    const parsed = parseWebhook(webhookUrl);
    if (!parsed || !messageId) {
      return json({ ok: false, status: 400, detail: "webhook atau message id tidak valid" }, 400);
    }

    let url = `https://discord.com/api/webhooks/${parsed.webhookId}/${parsed.webhookToken}/messages/${encodeURIComponent(messageId)}`;
    if (action === "reaction") {
      url += `/reactions/${encodeURIComponent(emoji)}/@me`;
    }

    const init: RequestInit = { method };
    if (payload != null && (method === "PATCH" || method === "POST" || method === "PUT")) {
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
      { ok: false, status: 0, detail: String(e instanceof Error ? e.message : e) },
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
