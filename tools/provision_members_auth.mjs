import fs from "node:fs";

const SUPABASE_URL = (process.env.SUPABASE_URL || "").replace(/\/+$/, "");
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const EMAIL_DOMAIN = (process.env.EMAIL_DOMAIN || "rage.local").trim();
const DRY_RUN = String(process.env.DRY_RUN || "").toLowerCase() === "true";
const EXPORT_ALL = String(process.env.EXPORT_ALL || "").toLowerCase() === "true";

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env var");
}
if (typeof fetch !== "function") {
  throw new Error("Node fetch not available. Use Node 18+.");
}

const headers = {
  apikey: SERVICE_ROLE_KEY,
  Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
  "Content-Type": "application/json",
};

function slugFirstName(nama) {
  const raw = String(nama || "").trim();
  const first = raw.split(/\s+/)[0] || "member";
  const slug = first.toLowerCase().replace(/[^a-z0-9]/g, "");
  return slug || "member";
}

function passwordFromFirstName(firstName) {
  let p = `${firstName}123`;
  while (p.length < 6) p += "x";
  return p;
}

async function restGet(path) {
  const url = `${SUPABASE_URL}/rest/v1/${path}`;
  const res = await fetch(url, { headers });
  const text = await res.text();
  if (!res.ok) throw new Error(`${res.status} ${text}`);
  return text ? JSON.parse(text) : null;
}

async function restPatch(path, body) {
  const url = `${SUPABASE_URL}/rest/v1/${path}`;
  const res = await fetch(url, {
    method: "PATCH",
    headers: { ...headers, Prefer: "return=representation" },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`${res.status} ${text}`);
  return text ? JSON.parse(text) : null;
}

async function authAdminCreateUser(email, password, userMetadata) {
  const url = `${SUPABASE_URL}/auth/v1/admin/users`;
  const res = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify({
      email,
      password,
      email_confirm: true,
      user_metadata: userMetadata || {},
    }),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`${res.status} ${text}`);
  return text ? JSON.parse(text) : null;
}

async function authAdminUpdateUser(userId, patchBody) {
  const url = `${SUPABASE_URL}/auth/v1/admin/users/${encodeURIComponent(userId)}`;
  const res = await fetch(url, {
    method: "PUT",
    headers,
    body: JSON.stringify(patchBody || {}),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`${res.status} ${text}`);
  return text ? JSON.parse(text) : null;
}

async function authAdminListUsers(page, perPage) {
  const url = `${SUPABASE_URL}/auth/v1/admin/users?page=${page}&per_page=${perPage}`;
  const res = await fetch(url, { headers });
  const text = await res.text();
  if (!res.ok) throw new Error(`${res.status} ${text}`);
  return text ? JSON.parse(text) : null;
}

async function authAdminFindUserByEmail(email) {
  const target = String(email || "").trim().toLowerCase();
  if (!target) return null;
  for (let page = 1; page <= 20; page += 1) {
    const data = await authAdminListUsers(page, 200);
    const users = (data && data.users) || data || [];
    const found = (users || []).find(
      (u) => String(u.email || "").trim().toLowerCase() === target
    );
    if (found) return found;
    if (!Array.isArray(users) || users.length < 200) break;
  }
  return null;
}

const members = await restGet(
  "members?select=id,nama,role,email,auth_user_id&order=nama.asc"
);

const usedUsernames = new Set();
for (const m of members || []) {
  const email = String(m.email || "");
  if (!email) continue;
  const local = email.split("@")[0] || "";
  if (local) usedUsernames.add(local);
}

function generateUniqueUsername(base) {
  const b = String(base || "member").toLowerCase() || "member";
  if (!usedUsernames.has(b)) {
    usedUsernames.add(b);
    return b;
  }
  let i = 2;
  while (usedUsernames.has(`${b}${i}`)) i += 1;
  const u = `${b}${i}`;
  usedUsernames.add(u);
  return u;
}

const results = [];
for (const m of members || []) {
  const id = m.id;
  const nama = m.nama || "";
  const linked = !!m.auth_user_id;

  const slug = slugFirstName(nama);
  const password = passwordFromFirstName(slug);
  let username = "";
  let email = "";
  if (m.email) {
    const local = String(m.email).split("@")[0] || "";
    if (local) username = local;
    email = String(m.email);
  }
  if (!username) username = generateUniqueUsername(slug);
  if (!email) email = `${username}@${EMAIL_DOMAIN}`;

  if (linked && !EXPORT_ALL) continue;

  if (DRY_RUN) {
    results.push({ member_id: id, nama, username, email, password, auth_user_id: linked ? String(m.auth_user_id || "") : "" });
    continue;
  }

  let userId = "";
  let created = null;
  for (let attempt = 1; attempt <= 10; attempt += 1) {
    try {
      created = await authAdminCreateUser(email, password, {
        must_change_password: true,
        member_id: id,
        member_nama: nama,
      });
      userId =
        (created && created.user && created.user.id) ||
        (created && created.id) ||
        (created && created.user_id) ||
        "";
      if (userId) break;
      const preview = created ? JSON.stringify(created).slice(0, 400) : "";
      throw new Error(`create_user_no_id Response: ${preview}`);
    } catch (e) {
      const msg = String(e && e.message ? e.message : e);
      const isEmailExists = msg.includes("email_exists") || msg.includes("already been registered");
      if (!isEmailExists) throw e;

      const existing = await authAdminFindUserByEmail(email);
      const existingId = existing && existing.id ? String(existing.id) : "";
      const meta = (existing && existing.user_metadata) || {};
      const metaMemberId = meta && meta.member_id != null ? String(meta.member_id) : "";

      if (existingId && (metaMemberId === String(id) || metaMemberId === "")) {
        await authAdminUpdateUser(existingId, {
          password,
          user_metadata: { ...meta, must_change_password: true, member_id: id, member_nama: nama },
        });
        userId = existingId;
        break;
      }

      username = generateUniqueUsername(slug);
      email = `${username}@${EMAIL_DOMAIN}`;
    }
  }

  if (!userId) {
    throw new Error(`Failed to provision member ${id} after retries (last email: ${email})`);
  }

  await restPatch(`members?id=eq.${id}`, {
    auth_user_id: userId,
    email,
  });

  results.push({ member_id: id, nama, username, email, password, auth_user_id: userId });
}

const csvLines = [
  "member_id,nama,username,email,password,auth_user_id",
  ...results.map((r) =>
    [
      r.member_id,
      JSON.stringify(r.nama || ""),
      r.username || "",
      r.email || "",
      r.password || "",
      r.auth_user_id || "",
    ].join(",")
  ),
];

fs.mkdirSync(new URL("./out/", import.meta.url), { recursive: true });
fs.writeFileSync(new URL("./out/provision_members_auth.csv", import.meta.url), csvLines.join("\n"));

console.log(`Done. Created/Prepared: ${results.length}`);
console.log(`Saved: tools/out/provision_members_auth.csv`);
