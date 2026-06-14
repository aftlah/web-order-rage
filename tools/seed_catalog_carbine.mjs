import fs from "node:fs";

function readConfigJsValues() {
  try {
    const raw = fs.readFileSync(new URL("../config.js", import.meta.url), "utf8");
    const pick = (re) => {
      const m = raw.match(re);
      return m && m[1] ? String(m[1]).trim() : "";
    };
    return {
      supabaseUrl: pick(/window\.SUPABASE_URL\s*=\s*["']([^"']+)["']/),
      serviceRoleKey: pick(/window\.SUPABASE_SERVICE_ROLE_KEY\s*=\s*["']([^"']+)["']/),
    };
  } catch {
    return { supabaseUrl: "", serviceRoleKey: "" };
  }
}

const cfg = readConfigJsValues();
const SUPABASE_URL = (process.env.SUPABASE_URL || cfg.supabaseUrl || "").replace(/\/+$/, "");
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || cfg.serviceRoleKey || "";

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY (env atau config.js)");
}

const headers = {
  apikey: SERVICE_ROLE_KEY,
  Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
  "Content-Type": "application/json",
  Prefer: "return=representation",
};

const CARBINE_ITEM = {
  kategori: "Gun",
  name: "Carbine Rifle",
  price: 210000,
  scrap: null,
  is_active: true,
  max_limit: 20,
  metadata: {
    note: "Ammo 556 | Attachment: Extended Rifle Clip, Rifle Drum, Medium Scope, Grip, Tactical Suppressor",
  },
};

async function main() {
  const checkUrl = `${SUPABASE_URL}/rest/v1/catalog_items?kategori=eq.Gun&name=eq.Carbine%20Rifle&select=id,name,price,max_limit,is_active`;
  const checkRes = await fetch(checkUrl, { headers });
  if (!checkRes.ok) {
    throw new Error(`Gagal cek item: ${checkRes.status} ${await checkRes.text()}`);
  }

  const existing = await checkRes.json();
  if (existing.length > 0) {
    console.log("Carbine Rifle sudah ada di Supabase:", existing[0]);
    return;
  }

  const insertRes = await fetch(`${SUPABASE_URL}/rest/v1/catalog_items`, {
    method: "POST",
    headers,
    body: JSON.stringify([CARBINE_ITEM]),
  });

  if (!insertRes.ok) {
    const errText = await insertRes.text();
    if (errText.toLowerCase().includes('column "max_limit"')) {
      const { max_limit, ...fallback } = CARBINE_ITEM;
      const retryRes = await fetch(`${SUPABASE_URL}/rest/v1/catalog_items`, {
        method: "POST",
        headers,
        body: JSON.stringify([fallback]),
      });
      if (!retryRes.ok) {
        throw new Error(`Gagal insert (retry): ${retryRes.status} ${await retryRes.text()}`);
      }
      console.log("Carbine Rifle berhasil ditambahkan (tanpa max_limit):", await retryRes.json());
      return;
    }
    throw new Error(`Gagal insert: ${insertRes.status} ${errText}`);
  }

  const inserted = await insertRes.json();
  console.log("Carbine Rifle berhasil ditambahkan ke Supabase:", inserted[0] || inserted);
}

main().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});
