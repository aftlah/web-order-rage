import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.2";
const supabase =
  window.SUPABASE_URL && window.SUPABASE_ANON_KEY
    ? createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY)
    : null;

let CATALOG = {
  Gun: [
    { name: "PISTOL .50", price: 9500 },
    { name: "CERAMIC PISTOL", price: 26000 },
    { name: "TECH 9", price: 26000 },
    { name: "MINI SMG", price: 30000 },
    { name: "MICRO SMG", price: 30000 },
    { name: "Micro SMG Full Attachment", price: 0 },
    // { name: "SHOTGUN", price: 65000 }, // to BOA
    { name: "NAVY REVOLVER", price: 72000 }, // to BOA
    { name: "PISTOL X17", price: 33000 }, // to BOA
    { name: "X17 + Attachment", price: 65000 }, // to BOA, sebelum markup Gun
    { name: "BLACK REVOLVER", price: 91000 },
    { name: "KVR", price: 78000 },
    { name: "Assault Rifle", price: 195000 }, //max 20
    { name: "Virtus#3", price: 230000 }, //max 20
  ],
  Ammo: [
    { name: "AMMO 9MM", price: 4000, scrap: 3 },
    { name: "AMMO .50", price: 1300, scrap: 2 },
    { name: "AMMO 44 MAGNUM", price: 6500, scrap: 3 },
    { name: "AMMO .45", price: 6500, scrap: 3.4 },
    { name: "AMMO 12 GAUGE", price: 6500, scrap: 7.5 },
    { name: "Ammo 762", price: 7000, scrap: 5 },
    { name: "Ammo 556", price: 7000, scrap: 5 },
  ],
  Attachment: [
    { name: "Tactical Flashlight", price: 4000, scrap: 5 },
    { name: "Suppressor", price: 13000, scrap: 5 },
    { name: "Tactical Suppressor", price: 13000, scrap: 5 },
    { name: "Grip", price: 4000, scrap: 5 },
    { name: "Extended Pistol Clip", price: 4000, scrap: 5 },
    { name: "Extended SMG Clip", price: 7000, scrap: 5 },
    { name: "Extended Rifle Clip", price: 20000, scrap: 5 },
    // { name: "SMG Drum", price: 13000, scrap: 5 }, // 
    { name: "Rifle Drum", price: 26000, scrap: 5 },
    { name: "Macro Scope", price: 4000, scrap: 5 },
    { name: "Medium Scope", price: 4000, scrap: 5 },
    { name: "Modern Extended Drum", price: 19500, scrap: 5 },
    { name: "Modern Suppressor Short", price: 13000, scrap: 5 },
    { name: "Holo Scope", price: 3900, scrap: 5 },
  ],
  Others: [
    { name: "VEST", price: 3000, scrap: 2 },
    { name: "VEST MEDIUM", price: 1500 }, // to PP
    { name: "LOCKPICK", price: 1500 },
  ],
};

async function fetchCatalog() {
  if (!supabase) return;
  try {
    const { data, error } = await supabase
      .from("catalog_items")
      .select("*")
      .eq("is_active", true);
    if (error) throw error;
    if (!data || !data.length) return;

    // Reset CATALOG
    const newCatalog = { Gun: [], Ammo: [], Attachment: [], Others: [] };
    data.forEach((item) => {
      const cat = item.kategori;
      if (newCatalog[cat]) {
        newCatalog[cat].push({
          name: item.name,
          price: item.price,
          scrap: item.scrap,
          metadata: item.metadata,
          max_limit: item.max_limit,
        });
      }
    });
    CATALOG = newCatalog;
  } catch (e) {
    console.error("Gagal mengambil katalog:", e);
  }
}
const MICRO_FULL_ATTACHMENT_BUNDLE_NAME = "Micro SMG Full Attachment";
const MICRO_FULL_ATTACHMENT_COMPONENTS = [
  { name: "MICRO SMG", kategori: "Gun" },
  { name: "Tactical Suppressor", kategori: "Attachment" },
  { name: "Extended SMG Clip", kategori: "Attachment" },
];

function getEffectivePrice(kategori, basePrice) {
  if (kategori === "Gun" || kategori === "Attachment") {
    return Math.round(basePrice * 1.1);
  }
  return basePrice;
}
function getMicroFullAttachmentBundlePrice() {
  return MICRO_FULL_ATTACHMENT_COMPONENTS.reduce((sum, entry) => {
    const found = (CATALOG[entry.kategori] || []).find((i) => i.name === entry.name);
    if (!found) return sum;
    return sum + getEffectivePrice(entry.kategori, found.price);
  }, 0);
}
const ITEM_MAX_LIMITS = {
  "PISTOL .50": 25,
  "CERAMIC PISTOL": 25,
  "TECH 9": 25,
  "MINI SMG": 25,
  "MICRO SMG": 25,
  "AMMO 9MM": 1000,
  "AMMO .50": 300,
  "VEST MEDIUM": 75,
  "PISTOL X17": 25,
  "X17 + Attachment": 25,
  // "SMG": 20, // nonaktif sementara
  SHOTGUN: 15,
  "NAVY REVOLVER": 25,
  KVR: 25,
  "BLACK REVOLVER": 15,
  "AMMO .45": 300,
  "AMMO 12 GAUGE": 150,
  VEST: 350,
  // "VEST MEDIUM": 150,
  LOCKPICK: 60,
  "AMMO 44 MAGNUM": 300,
  "Assault Rifle": 20,
  "Virtus#3": 20,
  "Ammo 762": 400,
  "Ammo 556": 400,
  "Tactical Flashlight": 20,
  Suppressor: 20,
  "Tactical Suppressor": 20,
  Grip: 20,
  "Extended Pistol Clip": 20,
  "Extended SMG Clip": 20,
  "Extended Rifle Clip": 20,
  // "SMG Drum": 20, // nonaktif sementara
  "Rifle Drum": 20,
  "Macro Scope": 20,
  "Medium Scope": 20,
  "Modern Extended Drum": 20,
  "Modern Suppressor Short": 20,
  "Holo Scope": 20,
};

function getItemMax(name) {
  const n = name || "";
  
  // Cari di semua kategori di CATALOG
  for (const kategori in CATALOG) {
    const items = CATALOG[kategori];
    if (!Array.isArray(items)) continue;
    
    const item = items.find((i) => {
      const itemName = i.name || "";
      return itemName.toLowerCase() === n.toLowerCase();
    });
    
    if (item && item.max_limit) {
      return item.max_limit;
    }
  }
  
  // Fallback ke ITEM_MAX_LIMITS jika tidak ada di database
  if (Object.prototype.hasOwnProperty.call(ITEM_MAX_LIMITS, n))
    return ITEM_MAX_LIMITS[n];
  const upper = n.toUpperCase();
  const found = Object.keys(ITEM_MAX_LIMITS).find(
    (k) => k.toUpperCase() === upper
  );
  return typeof found === "string" ? ITEM_MAX_LIMITS[found] : null;
}

const state = { cart: [] };
const dashboardCache = { orders: null, lastFetch: 0 };
const __openAnnounceLock = new Set();
const __closeAnnounceLock = new Set();
const DASH_CACHE_KEY = "dashboardOrdersCacheV2";
function loadStoredDashboard() {
  try {
    const raw = localStorage.getItem(DASH_CACHE_KEY);
    if (!raw) return null;
    const obj = JSON.parse(raw);
    if (!obj || !Array.isArray(obj.data)) return null;
    return obj;
  } catch (e) {
    return null;
  }
}

async function postToDiscord(message, overrideUrl) {
  try {
    const url = overrideUrl || (window && window.DISCORD_WEBHOOK_URL) || "";
    const enabled = window.DISCORD_ENABLED !== false;
    if (!url || !enabled || !message || typeof message !== "string") return;
    let content = message;
    const isStoranHook =
      !!overrideUrl &&
      typeof window !== "undefined" &&
      window.DISCORD_STORAN_WEBHOOK_URL &&
      overrideUrl === window.DISCORD_STORAN_WEBHOOK_URL;
    if (window && window.MAINTENANCE_MODE === true && !isStoranHook) {
      content = `## **MAINTENANCE DULUU**\n${content}`;
    }
    const MAX = 1900;
    const isCode = content.startsWith("```") && content.endsWith("```");
    let bodyText = content;
    if (isCode) bodyText = content.slice(3, -3).trim();
    const parts = [];
    if (bodyText.length <= MAX) {
      parts.push(bodyText);
    } else {
      const lines = bodyText.split("\n");
      let buf = "";
      for (const ln of lines) {
        const tryLine = buf ? buf + "\n" + ln : ln;
        if (tryLine.length > MAX) {
          if (buf) parts.push(buf);
          if (ln.length > MAX) {
            for (let i = 0; i < ln.length; i += MAX) {
              parts.push(ln.slice(i, i + MAX));
            }
            buf = "";
          } else {
            buf = ln;
          }
        } else {
          buf = tryLine;
        }
      }
      if (buf) parts.push(buf);
    }
    for (let i = 0; i < parts.length; i++) {
      const now = Date.now();
      const last = window.__discordLastSent || 0;
      const wait = Math.max(0, 4200 - (now - last));
      if (wait > 0) await new Promise((r) => setTimeout(r, wait));
      window.__discordLastSent = Date.now();
      const payload = isCode ? `\`\`\`\n${parts[i]}\n\`\`\`` : parts[i];
      await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: payload }),
      });
    }
  } catch (e) {}
}

async function postToDiscordEmbed(embed, overrideUrl, contentOverride) {
  try {
    const url = overrideUrl || (window && window.DISCORD_WEBHOOK_URL) || "";
    const enabled = window.DISCORD_ENABLED !== false;
    if (!url || !enabled || !embed || typeof embed !== "object") return;

    let content = typeof contentOverride === "string" ? contentOverride : "";
    const isStoranHook =
      !!overrideUrl &&
      typeof window !== "undefined" &&
      window.DISCORD_STORAN_WEBHOOK_URL &&
      overrideUrl === window.DISCORD_STORAN_WEBHOOK_URL;
    if (window && window.MAINTENANCE_MODE === true && !isStoranHook) {
      content = `## **MAINTENANCE DULUU**\n${content || ""}`.trim();
    }

    const now = Date.now();
    const last = window.__discordLastSent || 0;
    const wait = Math.max(0, 4200 - (now - last));
    if (wait > 0) await new Promise((r) => setTimeout(r, wait));
    window.__discordLastSent = Date.now();

    await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content, embeds: [embed] }),
    });
  } catch (e) {}
}

async function postWeaponPaymentLog(payload) {
  try {
    const hook =
      (window && window.DISCORD_ORDER_PAYMENT_WEBHOOK_URL) ||
      (window && window.DISCORD_WEBHOOK_URL) ||
      "";
    if (!hook) return;
    const batchNum = parseInt(payload && payload.batch, 10);
    const batchText =
      !Number.isNaN(batchNum) && batchNum
        ? (() => {
            const { m, w, raw } = decodeOrderanke(batchNum);
            return `M${m}-W${w} (#${raw})`;
          })()
        : "-";
    const actor =
      (window.__currentMember && window.__currentMember.nama) || "Unknown";
    const totalValue = Number(payload && payload.total ? payload.total : 0);
    const totalQty = Number(payload && payload.qty ? payload.qty : 0);
    const statusText = payload && payload.paid ? "LUNAS ✅" : "BELUM LUNAS ❌";
    const embed = {
      title: "Status Pembayaran Senjata",
      color: payload && payload.paid ? 5763719 : 15548997,
      description:
        "```" +
        `\nNAMA        : ${String((payload && payload.name) || "-")}` +
        `\nPERIODE     : ${batchText}` +
        `\nSTATUS      : ${statusText}` +
        `\nTOTAL ITEM  : ${totalQty || 0}` +
        `\nTOTAL UANG  : ${fmt(totalValue || 0)}` +
        `\nDIUBAH OLEH : ${actor}` +
        "\n```",
      fields: [
        {
          name: "Ringkasan",
          value:
            payload && payload.paid
              ? "Pembayaran order senjata sudah dikonfirmasi lunas."
              : "Status pembayaran order senjata diubah menjadi belum lunas.",
          inline: false,
        },
      ],
      timestamp: new Date().toISOString(),
    };
    await postToDiscordEmbed(embed, hook);
  } catch (e) {}
}

function getOrderPaymentWebhookUrl() {
  return (
    (window && window.DISCORD_ORDER_PAYMENT_WEBHOOK_URL) ||
    (window && window.DISCORD_WEBHOOK_URL) ||
    ""
  );
}
function saveStoredDashboard(data) {
  try {
    localStorage.setItem(
      DASH_CACHE_KEY,
      JSON.stringify({ ts: Date.now(), data })
    );
  } catch (e) {}
}
function getDistinctNamesFromData(data) {
  const set = new Set();
  (data || []).forEach((r) => {
    const n = (r.nama || "").trim();
    if (n) set.add(n);
  });
  return Array.from(set).sort((a, b) => a.localeCompare(b));
}
function updateDashNameSuggestions() {
  const dd = document.getElementById("dashNameDropdown");
  if (!dd) return;
  const data =
    dashboardCache.orders || (loadStoredDashboard() || {}).data || [];
  const names = getDistinctNamesFromData(data);
  dd.dataset.list = JSON.stringify(names);
}
function setupDashNameSearch() {
  const input = document.getElementById("dashNameInput");
  const dd = document.getElementById("dashNameDropdown");
  if (!input || !dd) return;
  let active = -1;
  const render = (term) => {
    let names = [];
    try {
      names = JSON.parse(dd.dataset.list || "[]");
    } catch (e) {}
    const q = (term || "").toLowerCase();
    const items = names
      .filter((n) => n.toLowerCase().includes(q))
      .slice(0, 100);
    dd.innerHTML =
      `<div class=\"px-3 py-2 cursor-pointer\" data-name=\"\">Semua</div>` +
      items
        .map(
          (n, i) =>
            `<div class=\"px-3 py-2 cursor-pointer ${
              i === active ? "bg-yellow-900/30" : ""
            }\" data-name=\"${n}\">${n}</div>`
        )
        .join("");
    dd.classList.toggle("hidden", items.length === 0 && !q);
    dd.querySelectorAll("[data-name]").forEach((el) =>
      el.addEventListener("mousedown", (e) => {
        const v = e.currentTarget.getAttribute("data-name") || "";
        input.value = v;
        dd.classList.add("hidden");
        loadDashboard(false);
      })
    );
  };
  input.addEventListener("input", (e) => render(e.target.value.trim()));
  input.addEventListener("focus", () => render(""));
  input.addEventListener("keydown", (e) => {
    const items = Array.from(dd.querySelectorAll("[data-name]"));
    if (!items.length) return;
    if (e.key === "ArrowDown") {
      active = Math.min(items.length - 1, active + 1);
      e.preventDefault();
    } else if (e.key === "ArrowUp") {
      active = Math.max(0, active - 1);
      e.preventDefault();
    } else if (e.key === "Enter" && active >= 0) {
      const v = items[active].getAttribute("data-name") || "";
      input.value = v;
      dd.classList.add("hidden");
      loadDashboard(false);
    } else if (e.key === "Escape") {
      dd.classList.add("hidden");
    }
    items.forEach((el, i) =>
      el.classList.toggle("bg-yellow-900/30", i === active)
    );
  });
  input.addEventListener("blur", () =>
    setTimeout(() => dd.classList.add("hidden"), 150)
  );
}

function fmt(n) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(n);
}

function fmtNumber(n) {
  const v = typeof n === "number" ? n : parseFloat(n || "0");
  const safe = Number.isFinite(v) ? v : 0;
  return new Intl.NumberFormat("en-US").format(safe);
}
async function getSession() {
  const { data } = await supabase.auth.getSession();
  return data ? data.session : null;
}
async function guardDashboard() {
  const s = await getSession();
  if (!s) {
    location.href = "login.html";
    return false;
  }
  return true;
}

async function guardApp() {
  const s = await getSession();
  if (!s) {
    location.href = "login.html";
    return false;
  }
  await ensureUserPasswordUpdated();
  return true;
}

async function ensureUserPasswordUpdated() {
  if (!supabase) return;
  try {
    const { data: userRes } = await supabase.auth.getUser();
    const user = (userRes || {}).user || null;
    if (!user) return;
    const meta = user.user_metadata || {};
    if (!meta.must_change_password) return;
    if (window.__passwordChangeInProgress) return;
    window.__passwordChangeInProgress = true;
    const res = await Swal.fire({
      title: "Ganti Password",
      html:
        '<div class="flex flex-col gap-3 text-left">' +
        '<label class="text-sm">Password baru</label>' +
        '<input id="pw1" type="password" class="swal2-input" placeholder="Min 6 karakter" />' +
        '<label class="text-sm">Ulangi password</label>' +
        '<input id="pw2" type="password" class="swal2-input" placeholder="Ulangi password" />' +
        "</div>",
      focusConfirm: false,
      allowOutsideClick: false,
      allowEscapeKey: false,
      confirmButtonText: "Simpan",
      customClass: {
        popup: "rage-modal-popup",
        title: "rage-modal-title",
        confirmButton: "rage-modal-confirm",
      },
      preConfirm: () => {
        const pw1 = (document.getElementById("pw1") || {}).value || "";
        const pw2 = (document.getElementById("pw2") || {}).value || "";
        if (pw1.length < 6)
          return Swal.showValidationMessage("Password minimal 6 karakter");
        if (pw1 !== pw2)
          return Swal.showValidationMessage("Password tidak sama");
        return pw1;
      },
    });
    const newPw = res.value;
    if (!newPw) return;
    const { error } = await supabase.auth.updateUser({
      password: newPw,
      data: { ...meta, must_change_password: false },
    });
    if (error) {
      showAlert("Gagal update password: " + error.message, "error");
      return;
    }
    showAlert("Password berhasil diubah", "success");
  } catch (e) {}
}

async function resolveCurrentMember() {
  if (!supabase) return null;
  window.__currentMemberResolveError = null;
  try {
    const { data: userRes } = await supabase.auth.getUser();
    const user = (userRes || {}).user || null;
    if (!user || !user.id) return null;
    const uid = user.id;
    const email = user.email || "";

    let row = null;
    const q1 = await supabase
      .from("members")
      .select("id,nama,role,auth_user_id")
      .eq("auth_user_id", uid)
      .limit(1);
    if (q1 && q1.error) {
      const msg = String(q1.error.message || "").toLowerCase();
      if (!msg.includes("column")) {
        window.__currentMemberResolveError =
          q1.error.message || "Gagal membaca tabel members";
        return null;
      }
    } else {
      row = (q1.data || [])[0] || null;
    }
    if (row && row.id) return row;

    if (email) {
      const q2 = await supabase
        .from("members")
        .select("id,nama,role,email")
        .eq("email", email)
        .limit(1);
      if (q2 && q2.error) {
        const msg = String(q2.error.message || "").toLowerCase();
        if (!msg.includes("column")) {
          window.__currentMemberResolveError =
            q2.error.message || "Gagal membaca tabel members";
          return null;
        }
      }
      if (q2 && !q2.error) {
        row = (q2.data || [])[0] || null;
      }
      if (row && row.id) return row;
    }

    return null;
  } catch (e) {
    return null;
  }
}

function isAdminMember(member) {
  const role = member && member.role ? String(member.role) : "";
  return role.trim().toLowerCase() === "admin";
}

function requireAdminOrRedirect() {
  const m = window.__currentMember || null;
  if (isAdminMember(m)) return true;
  showAlert("Hanya Admin yang bisa mengakses menu ini", "error");
  location.href = "index.html";
  return false;
}

function applyAdminNav(member) {
  const isAdmin = isAdminMember(member);
  const adminOnlyHrefs = [
    "dashboard.html",
    "storan.html",
    "drugs.html",
    "kas.html",
    "admin_users.html",
    "admin_activity.html",
    "admin_catalog.html",
  ];
  adminOnlyHrefs.forEach((href) => {
    document.querySelectorAll(`a[href="${href}"]`).forEach((a) => {
      if (!isAdmin) a.classList.add("hidden");
    });
  });
}

async function showLinkMemberHelpModal() {
  if (!supabase) return;
  if (window.__shownLinkMemberHelp) return;
  window.__shownLinkMemberHelp = true;
  try {
    const { data: userRes } = await supabase.auth.getUser();
    const user = (userRes || {}).user || null;
    const uid = user && user.id ? String(user.id) : "";
    const email = user && user.email ? String(user.email) : "";
    const err = window.__currentMemberResolveError
      ? String(window.__currentMemberResolveError)
      : "";

    const lines = [];
    if (email)
      lines.push(
        `<div class="text-xs text-slate-500 dark:text-slate-400">Email</div><div class="font-mono text-sm break-all">${email}</div>`
      );
    if (uid)
      lines.push(
        `<div class="mt-3 text-xs text-slate-500 dark:text-slate-400">User ID</div><div class="font-mono text-sm break-all">${uid}</div>`
      );
    if (err)
      lines.push(`<div class="mt-3 text-xs text-red-500">Info: ${err}</div>`);

    const html =
      `<div class="text-left">` +
      `<div class="text-sm">Akun login belum terhubung ke data member, jadi sistem tidak bisa mengisi nama otomatis.</div>` +
      `<div class="mt-4 p-3 rounded-xl border border-amber-200/40 dark:border-yellow-900/30 bg-amber-50/40 dark:bg-yellow-900/10">` +
      lines.join("") +
      `</div>` +
      `<div class="mt-4 text-sm">Solusi: di tabel <b>members</b> isi <b>auth_user_id</b> = User ID di atas (atau isi <b>email</b> = Email di atas).</div>` +
      `</div>`;

    const res = await Swal.fire({
      title: "Hubungkan Akun ke Member",
      html,
      showCancelButton: true,
      showDenyButton: true,
      confirmButtonText: "Hubungkan Sekarang",
      denyButtonText: "Copy User ID",
      cancelButtonText: "Tutup",
      customClass: {
        popup: "rage-modal-popup",
        title: "rage-modal-title",
        confirmButton: "rage-modal-confirm",
        denyButton: "rage-modal-confirm",
        cancelButton: "rage-modal-cancel",
      },
    });

    if (res.isDenied && uid) {
      try {
        await navigator.clipboard.writeText(uid);
        showAlert("User ID disalin", "success");
      } catch (e) {
        showAlert("Gagal copy User ID", "error");
      }
    }

    if (res.isConfirmed) {
      const { value: typedName } = await Swal.fire({
        title: "Nama Member",
        input: "text",
        inputPlaceholder: "Ketik nama member (harus sama persis)",
        showCancelButton: true,
        confirmButtonText: "Cari",
        cancelButtonText: "Batal",
        customClass: {
          popup: "rage-modal-popup",
          title: "rage-modal-title",
          confirmButton: "rage-modal-confirm",
          cancelButton: "rage-modal-cancel",
          input: "rage-modal-input",
        },
        inputValidator: (v) => (!v ? "Nama wajib diisi" : undefined),
      });
      if (!typedName) return;

      let matches = [];
      try {
        const { data: found, error: findErr } = await supabase
          .from("members")
          .select("id,nama,auth_user_id")
          .ilike("nama", typedName.trim())
          .limit(5);
        if (findErr) {
          showAlert("Gagal mencari member: " + findErr.message, "error");
          return;
        }
        matches = found || [];
      } catch (e) {
        showAlert("Gagal mencari member", "error");
        return;
      }

      if (!matches.length) {
        showAlert(
          "Member tidak ditemukan. Pastikan nama sama persis di database.",
          "error"
        );
        return;
      }

      let pickedId = matches[0].id;
      if (matches.length > 1) {
        const opts = {};
        matches.forEach((m) => {
          const used = m.auth_user_id ? " (sudah terhubung)" : "";
          opts[String(m.id)] = `${m.nama || "-"}${used}`;
        });
        const { value } = await Swal.fire({
          title: "Pilih Member",
          input: "select",
          inputOptions: opts,
          inputValue: String(matches[0].id),
          showCancelButton: true,
          confirmButtonText: "Pilih",
          cancelButtonText: "Batal",
          customClass: {
            popup: "rage-modal-popup",
            title: "rage-modal-title",
            confirmButton: "rage-modal-confirm",
            cancelButton: "rage-modal-cancel",
            input: "rage-modal-input",
          },
        });
        if (!value) return;
        pickedId = parseInt(String(value), 10);
      }

      const pin = (window && window.ADMIN_DELETE_PIN) || "";
      let ok = true;
      if (pin) {
        const { value: typed } = await Swal.fire({
          title: "Masukkan PIN",
          input: "password",
          inputPlaceholder: "PIN",
          showCancelButton: true,
          confirmButtonText: "Konfirmasi",
          cancelButtonText: "Batal",
          customClass: {
            popup: "rage-modal-popup",
            title: "rage-modal-title",
            confirmButton: "rage-modal-confirm",
            cancelButton: "rage-modal-cancel",
            input: "rage-modal-input",
          },
        });
        ok = !!typed && typed === pin;
      } else {
        const { value: typed } = await Swal.fire({
          title: "Ketik LINK untuk konfirmasi",
          input: "text",
          inputPlaceholder: "LINK",
          showCancelButton: true,
          confirmButtonText: "Konfirmasi",
          cancelButtonText: "Batal",
          customClass: {
            popup: "rage-modal-popup",
            title: "rage-modal-title",
            confirmButton: "rage-modal-confirm",
            cancelButton: "rage-modal-cancel",
            input: "rage-modal-input",
          },
        });
        ok = (typed || "").toUpperCase() === "LINK";
      }
      if (!ok) {
        showAlert("Konfirmasi tidak valid", "error");
        return;
      }

      try {
        let q = supabase
          .from("members")
          .update({ auth_user_id: uid, email: email || null })
          .eq("id", pickedId);
        const { error: upErr } = await q;
        if (upErr) {
          showAlert("Gagal menghubungkan: " + upErr.message, "error");
          return;
        }
        showAlert("Akun berhasil dihubungkan. Reload...", "success");
        setTimeout(() => location.reload(), 600);
      } catch (e) {
        showAlert("Gagal menghubungkan", "error");
      }
    }
  } catch (e) {}
}

function applyCurrentMemberToOrderUI(member) {
  const nameInput = document.getElementById("nama");
  const hidden = document.getElementById("memberId");
  const status = document.getElementById("namaStatus");
  const dd = document.getElementById("namaDropdown");
  const group = document.getElementById("customerNameGroup");
  const identity = document.getElementById("customerIdentity");
  const identityName = document.getElementById("customerIdentityName");
  if (nameInput && member && member.nama) {
    nameInput.value = member.nama;
    nameInput.disabled = true;
  }
  if (hidden && member && member.id) hidden.value = String(member.id);
  if (dd) dd.classList.add("hidden");
  if (member && member.id) {
    if (group) group.classList.add("hidden");
    if (identity) identity.classList.remove("hidden");
    if (identityName) identityName.textContent = String(member.nama || "");
  }
  if (status) {
    status.textContent =
      member && member.id
        ? "Login: Nama valid"
        : "Akun belum terhubung ke member";
    status.classList.toggle("text-green-500", !!(member && member.id));
    status.classList.toggle("text-red-500", !(member && member.id));
  }
  updateNameValidity();
}

function applyCurrentMemberToStoranUI(member) {
  const nameInput = document.getElementById("storanNama");
  const hidden = document.getElementById("storanMemberId");
  const status = document.getElementById("storanNamaStatus");
  const dd = document.getElementById("storanNamaDropdown");
  if (nameInput && member && member.nama) {
    nameInput.value = member.nama;
    nameInput.disabled = true;
  }
  if (hidden && member && member.id) hidden.value = String(member.id);
  if (dd) dd.classList.add("hidden");
  if (status) {
    status.textContent =
      member && member.id
        ? "Login: Nama valid"
        : "Akun belum terhubung ke member";
    status.classList.toggle("text-green-500", !!(member && member.id));
    status.classList.toggle("text-red-500", !(member && member.id));
  }
}

function applyCurrentMemberToDrugsUI(member) {
  const nameInput = document.getElementById("drugsNama");
  const hidden = document.getElementById("drugsMemberId");
  const status = document.getElementById("drugsNamaStatus");
  const dd = document.getElementById("drugsNamaDropdown");
  if (nameInput && member && member.nama) {
    nameInput.value = member.nama;
    nameInput.disabled = true;
  }
  if (hidden && member && member.id) hidden.value = String(member.id);
  if (dd) dd.classList.add("hidden");
  if (typeof updateDrugsNameValidity === "function") updateDrugsNameValidity();
  if (status) {
    status.textContent =
      member && member.id
        ? "Login: Nama valid"
        : "Akun belum terhubung ke member";
    status.classList.toggle("text-green-500", !!(member && member.id));
    status.classList.toggle("text-red-500", !(member && member.id));
  }
}

function ensureProfileNavLinks(member) {
  const isAdmin = isAdminMember(member);
  const path = String(location.pathname || "").toLowerCase();
  const items = [
    { href: "profile.html", label: "Profile", isVisible: true },
    { href: "admin_users.html", label: "Users", isVisible: isAdmin },
    { href: "admin_activity.html", label: "Monitor", isVisible: isAdmin },
    { href: "admin_catalog.html", label: "Katalog", isVisible: isAdmin },
  ].filter((x) => x.isVisible);

  const isActive = items.some((it) =>
    path.endsWith("/" + it.href.toLowerCase())
  );

  const desktopNav = document.getElementById("mainNav");
  const logoutBtn = document.getElementById("logoutBtn");
  if (desktopNav) {
    desktopNav
      .querySelectorAll('a[href="profile.html"]')
      .forEach((a) => a.remove());
    desktopNav
      .querySelectorAll(
        'a[href="admin_users.html"], a[href="admin_activity.html"]'
      )
      .forEach((a) => a.classList.add("hidden"));
    const oldAdmin = desktopNav.querySelector("#adminNavDropdown");
    if (oldAdmin) oldAdmin.remove();

    if (!desktopNav.querySelector("#profileNavDropdown")) {
      const wrap = document.createElement("div");
      wrap.id = "profileNavDropdown";
      wrap.className = "nav-dropdown";
      if (isActive) wrap.classList.add("nav-dropdown-active-page");

      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = `nav-link nav-link-profile nav-dropdown-toggle${isActive ? " nav-active" : ""}`;
      btn.innerHTML =
        '<span class="nav-profile-icon">P</span><span>Profile</span>' +
        '<svg class="nav-dropdown-caret" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" style="width:16px;height:16px;opacity:0.9"><path fill-rule="evenodd" d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 10.94l3.71-3.71a.75.75 0 1 1 1.06 1.06l-4.24 4.25a.75.75 0 0 1-1.06 0L5.21 8.29a.75.75 0 0 1 .02-1.08Z" clip-rule="evenodd"/></svg>';

      const menu = document.createElement("div");
      menu.className = "nav-dropdown-menu";
      menu.innerHTML =
        items
          .map((it) => {
            const active = path.endsWith("/" + it.href.toLowerCase());
            return `<a href="${it.href}" class="nav-dropdown-item${active ? " nav-dropdown-active" : ""}"><span>${it.label}</span></a>`;
          })
          .join("") +
        `<button type="button" class="nav-dropdown-item"><span>Logout</span></button>`;

      btn.addEventListener("click", (e) => {
        e.preventDefault();
        const open = !wrap.classList.contains("open");
        document
          .querySelectorAll(".nav-dropdown")
          .forEach((dd) => dd.classList.remove("open"));
        wrap.classList.toggle("open", open);
        btn.classList.toggle("nav-active", open || isActive);
      });

      menu.querySelectorAll("button.nav-dropdown-item").forEach((b) => {
        b.addEventListener("click", () => {
          if (logoutBtn) logoutBtn.click();
        });
      });

      wrap.appendChild(btn);
      wrap.appendChild(menu);

      if (logoutBtn && logoutBtn.parentElement)
        logoutBtn.insertAdjacentElement("afterend", wrap);
      else desktopNav.appendChild(wrap);

      if (!window.__navDropdownHandlers) {
        window.__navDropdownHandlers = true;
        document.addEventListener("click", (e) => {
          document.querySelectorAll(".nav-dropdown").forEach((dd) => {
            const target = e.target;
            const isInside = target && dd.contains(target);
            if (!isInside) {
              dd.classList.remove("open");
              const b = dd.querySelector(".nav-dropdown-toggle");
              if (b)
                b.classList.toggle(
                  "nav-active",
                  dd.classList.contains("nav-dropdown-active-page")
                );
            }
          });
        });
        document.addEventListener("keydown", (e) => {
          if (e.key !== "Escape") return;
          document.querySelectorAll(".nav-dropdown").forEach((dd) => {
            dd.classList.remove("open");
            const b = dd.querySelector(".nav-dropdown-toggle");
            if (b)
              b.classList.toggle(
                "nav-active",
                dd.classList.contains("nav-dropdown-active-page")
              );
          });
        });
      }
    }
  }

  const mobileMenu = document.getElementById("mobileMenu");
  const mobileContainer = mobileMenu
    ? mobileMenu.querySelector("div.flex.flex-col")
    : null;
  if (mobileContainer) {
    mobileContainer
      .querySelectorAll('a[href="profile.html"]')
      .forEach((a) => a.remove());
    mobileContainer
      .querySelectorAll(
        'a[href="admin_users.html"], a[href="admin_activity.html"]'
      )
      .forEach((a) => a.classList.add("hidden"));

    const existing = mobileContainer.querySelector("#mobileProfileDropdown");
    if (existing) existing.remove();

    const toggle = document.createElement("button");
    toggle.type = "button";
    toggle.className = `mobile-nav-link mobile-nav-profile${isActive ? " mobile-nav-active" : ""}`;
    toggle.innerHTML =
      '<span class="nav-profile-icon">P</span><span style="flex:1">Profile</span>' +
      '<svg class="nav-dropdown-caret" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" style="width:18px;height:18px;opacity:0.9"><path fill-rule="evenodd" d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 10.94l3.71-3.71a.75.75 0 1 1 1.06 1.06l-4.24 4.25a.75.75 0 0 1-1.06 0L5.21 8.29a.75.75 0 0 1 .02-1.08Z" clip-rule="evenodd"/></svg>';

    const submenu = document.createElement("div");
    submenu.id = "mobileProfileDropdown";
    submenu.className = "mobile-admin-submenu hidden";
    submenu.innerHTML = items
      .map((it) => {
        const active = path.endsWith("/" + it.href.toLowerCase());
        return `<a href="${it.href}" class="mobile-nav-link mobile-admin-subitem${active ? " mobile-nav-active" : ""}">${it.label}</a>`;
      })
      .join("");

    toggle.addEventListener("click", () => {
      submenu.classList.toggle("hidden");
    });

    const hr = mobileContainer.querySelector("hr");
    if (hr) {
      mobileContainer.insertBefore(toggle, hr);
      mobileContainer.insertBefore(submenu, hr);
    } else {
      mobileContainer.appendChild(toggle);
      mobileContainer.appendChild(submenu);
    }
  }
}

function getServiceRoleKey() {
  return String((window && window.SUPABASE_SERVICE_ROLE_KEY) || "").trim();
}

function getDeviceId() {
  try {
    const key = "rage_device_id_v1";
    const existing = localStorage.getItem(key);
    if (existing) return existing;
    const id =
      typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : String(Date.now()) + "-" + String(Math.random()).slice(2);
    localStorage.setItem(key, id);
    return id;
  } catch (e) {
    return "unknown";
  }
}

async function upsertSessionHeartbeat(member) {
  if (!supabase) return;
  try {
    const { data: userRes } = await supabase.auth.getUser();
    const user = userRes && userRes.user ? userRes.user : null;
    const uid = user && user.id ? String(user.id) : "";
    if (!uid) return;
    const deviceId = getDeviceId();
    const payload = {
      auth_user_id: uid,
      member_id: member && member.id ? member.id : null,
      device_id: deviceId,
      user_agent: (navigator && navigator.userAgent) || "",
      last_seen_at: new Date().toISOString(),
      logout_time: null,
    };
    await supabase
      .from("user_login_sessions")
      .upsert(payload, { onConflict: "auth_user_id,device_id" });
  } catch (e) {}
}

async function markSessionLogout() {
  if (!supabase) return;
  try {
    const { data: userRes } = await supabase.auth.getUser();
    const user = userRes && userRes.user ? userRes.user : null;
    const uid = user && user.id ? String(user.id) : "";
    if (!uid) return;
    const deviceId = getDeviceId();
    await supabase
      .from("user_login_sessions")
      .update({
        logout_time: new Date().toISOString(),
        last_seen_at: new Date().toISOString(),
      })
      .eq("auth_user_id", uid)
      .eq("device_id", deviceId);
  } catch (e) {}
}

function recordPageAccess(member) {
  if (!supabase) return;
  const pageUrl =
    String(location.pathname || "") + String(location.search || "");
  const ref = document.referrer || "";
  const now = Date.now();
  const key = "rage_page_access_prev_v1";
  try {
    const prevRaw = sessionStorage.getItem(key);
    if (prevRaw) {
      const prev = JSON.parse(prevRaw);
      if (prev && prev.t && prev.url) {
        const durationMs = Math.max(0, now - Number(prev.t));
        Promise.resolve()
          .then(async () => {
            const { data: userRes } = await supabase.auth.getUser();
            const user = userRes && userRes.user ? userRes.user : null;
            const uid = user && user.id ? String(user.id) : "";
            if (!uid) return;
            await supabase.from("page_access_logs").insert({
              auth_user_id: uid,
              member_id: member && member.id ? member.id : null,
              device_id: getDeviceId(),
              page_url: String(prev.url),
              referrer: String(prev.ref || ""),
              access_time: new Date(Number(prev.t)).toISOString(),
              duration_ms: durationMs,
            });
          })
          .catch(() => {});
      }
    }
  } catch (e) {}
  try {
    sessionStorage.setItem(key, JSON.stringify({ url: pageUrl, ref, t: now }));
  } catch (e) {}
}

async function supabaseAdminUpdateUser(targetAuthUserId, updatePayload) {
  const url = String((window && window.SUPABASE_URL) || "").trim();
  const key = getServiceRoleKey();
  if (!url || !key)
    return { error: { message: "SUPABASE_SERVICE_ROLE_KEY belum diisi" } };
  const uid = String(targetAuthUserId || "").trim();
  if (!uid) return { error: { message: "Target auth_user_id kosong" } };

  const res = await fetch(
    `${url}/auth/v1/admin/users/${encodeURIComponent(uid)}`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        apikey: key,
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify(updatePayload || {}),
    }
  );
  const json = await res.json().catch(() => ({}));
  if (!res.ok)
    return {
      error: {
        message:
          (json && (json.msg || json.message || json.error)) ||
          `HTTP ${res.status}`,
      },
    };
  return { data: json };
}

async function supabaseServiceRoleUpsertAuditLog(payload) {
  const url = String((window && window.SUPABASE_URL) || "").trim();
  const key = getServiceRoleKey();
  if (!url || !key) return;
  try {
    await fetch(`${url}/rest/v1/account_audit_logs`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: key,
        Authorization: `Bearer ${key}`,
        Prefer: "return=minimal",
      },
      body: JSON.stringify(payload || {}),
    });
  } catch (e) {}
}

async function supabaseServiceRoleUpdateMembersById(memberId, patch) {
  const url = String((window && window.SUPABASE_URL) || "").trim();
  const key = getServiceRoleKey();
  if (!url || !key) return;
  const id = String(memberId || "").trim();
  if (!id) return;
  try {
    await fetch(`${url}/rest/v1/members?id=eq.${encodeURIComponent(id)}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        apikey: key,
        Authorization: `Bearer ${key}`,
        Prefer: "return=minimal",
      },
      body: JSON.stringify(patch || {}),
    });
  } catch (e) {}
}

function getUsernameFromEmail(email) {
  const raw = String(email || "").trim();
  if (!raw) return "";
  return raw.split("@")[0] || "";
}

function getPrimaryAuthEmailDomain() {
  return String(
    (window && window.AUTH_EMAIL_DOMAIN) || "rage.example.com"
  ).trim();
}

function getLegacyAuthEmailDomain() {
  return String(
    (window && window.LEGACY_AUTH_EMAIL_DOMAIN) || "rage.local"
  ).trim();
}

function getPreferredAuthEmailDomain(currentEmail) {
  const email = String(currentEmail || "")
    .trim()
    .toLowerCase();
  const primary = getPrimaryAuthEmailDomain();
  if (email && email.includes("@")) {
    const domain = email.split("@")[1] || "";
    if (domain && domain !== getLegacyAuthEmailDomain() && domain.includes("."))
      return domain;
  }
  return primary;
}

function buildUsernameAuthEmail(username, currentEmail) {
  const cleanUsername = normalizeUsernameInput(username);
  const domain = getPreferredAuthEmailDomain(currentEmail);
  return `${cleanUsername}@${domain}`;
}

function normalizeUsernameInput(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]/g, "");
}

async function changeCurrentUserPassword(newPassword) {
  if (!supabase) return { error: { message: "Supabase tidak terhubung" } };
  try {
    const { data: userRes } = await supabase.auth.getUser();
    const user = (userRes || {}).user || null;
    const meta = (user && user.user_metadata) || {};
    return await supabase.auth.updateUser({
      password: newPassword,
      data: { ...meta, must_change_password: false },
    });
  } catch (e) {
    return { error: { message: String((e && e.message) || e || "unknown") } };
  }
}

async function initProfile() {
  if (!supabase) return;
  const nameEl = document.getElementById("profileMemberName");
  const roleEl = document.getElementById("profileMemberRole");
  const currentUsernameEl = document.getElementById("profileCurrentUsername");
  const currentEmailEl = document.getElementById("profileCurrentEmail");
  const savePasswordBtn = document.getElementById("profileSavePassword");
  const newPasswordEl = document.getElementById("profileNewPassword");
  const confirmPasswordEl = document.getElementById("profileConfirmPassword");

  const currentMember = window.__currentMember || null;
  if (nameEl)
    nameEl.textContent =
      currentMember && currentMember.nama ? String(currentMember.nama) : "-";
  if (roleEl)
    roleEl.textContent =
      currentMember && currentMember.role ? String(currentMember.role) : "-";

  try {
    const { data: userRes } = await supabase.auth.getUser();
    const user = (userRes || {}).user || null;
    const email = user && user.email ? String(user.email) : "";
    const username = getUsernameFromEmail(email);
    if (currentUsernameEl) currentUsernameEl.value = username;
    if (currentEmailEl) currentEmailEl.value = email;
  } catch (e) {}

  if (savePasswordBtn) {
    savePasswordBtn.addEventListener("click", async () => {
      const pw1 = (newPasswordEl || {}).value || "";
      const pw2 = (confirmPasswordEl || {}).value || "";
      if (pw1.length < 6) {
        showAlert("Password minimal 6 karakter", "error");
        return;
      }
      if (pw1 !== pw2) {
        showAlert("Konfirmasi password tidak sama", "error");
        return;
      }
      const btn = savePasswordBtn;
      btn.disabled = true;
      try {
        const { error } = await changeCurrentUserPassword(pw1);
        if (error) {
          showAlert("Gagal mengubah password: " + error.message, "error");
          return;
        }
        if (newPasswordEl) newPasswordEl.value = "";
        if (confirmPasswordEl) confirmPasswordEl.value = "";
        showAlert("Password berhasil diubah", "success");
      } finally {
        btn.disabled = false;
      }
    });
  }
}

async function initAdminUsersPage() {
  if (!supabase) return;
  if (!requireAdminOrRedirect()) return;

  const tableBody = document.getElementById("adminUsersTable");
  const searchEl = document.getElementById("adminUsersSearch");
  const reloadBtn = document.getElementById("adminUsersReload");

  const selName = document.getElementById("adminSelectedName");
  const selRole = document.getElementById("adminSelectedRole");
  const selEmail = document.getElementById("adminSelectedEmail");
  const selUid = document.getElementById("adminSelectedAuthUid");
  const selMemberId = document.getElementById("adminSelectedMemberId");

  const newUsernameEl = document.getElementById("adminNewUsername");
  const reqUsernameBtn = document.getElementById("adminRequestUsernameChange");
  const resetUsernameBtn = document.getElementById("adminResetUsernameAuto");
  const adminNewPasswordEl = document.getElementById("adminNewPassword");
  const adminConfirmPasswordEl = document.getElementById(
    "adminConfirmPassword"
  );
  const setPwBtn = document.getElementById("adminSetPasswordDirect");

  const auditBody = document.getElementById("adminAuditTable");
  const auditReload = document.getElementById("adminAuditReload");

  let allUsers = [];
  let selected = null;
  let actorUid = "";
  try {
    const { data: userRes } = await supabase.auth.getUser();
    actorUid =
      userRes && userRes.user && userRes.user.id ? String(userRes.user.id) : "";
  } catch (e) {}

  const renderSelected = () => {
    if (selName)
      selName.textContent =
        selected && selected.nama ? String(selected.nama) : "-";
    if (selRole)
      selRole.textContent =
        selected && selected.role ? String(selected.role) : "-";
    if (selEmail)
      selEmail.textContent =
        selected && selected.email ? String(selected.email) : "-";
    if (selUid)
      selUid.textContent =
        selected && selected.auth_user_id ? String(selected.auth_user_id) : "-";
    if (selMemberId)
      selMemberId.value = selected && selected.id ? String(selected.id) : "";
  };

  const renderTable = (rows) => {
    if (!tableBody) return;
    if (!rows.length) {
      tableBody.innerHTML =
        '<tr><td colspan="3" class="px-3 py-6 text-center text-slate-400">Tidak ada data</td></tr>';
      return;
    }
    tableBody.innerHTML = rows
      .map((u) => {
        const id = String(u.id || "");
        const name = String(u.nama || "-");
        const role = String(u.role || "-");
        return `<tr class="hover:bg-white/5 transition-colors">
  <td class="px-3 py-3 text-amber-900 dark:text-amber-100 font-medium">${name}</td>
  <td class="px-3 py-3 text-slate-600 dark:text-amber-200/80">${role}</td>
  <td class="px-3 py-3 text-right">
    <button class="px-3 py-1 rounded-lg bg-amber-600/20 text-amber-300 border border-amber-600/30 text-[10px] font-bold uppercase hover:bg-amber-600/30 transition" data-admin-user-pick="${id}">
      Pilih
    </button>
  </td>
</tr>`;
      })
      .join("");

    tableBody.querySelectorAll("[data-admin-user-pick]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = String(btn.getAttribute("data-admin-user-pick") || "");
        selected = allUsers.find((u) => String(u.id || "") === id) || null;
        renderSelected();
      });
    });
  };

  const loadUsers = async () => {
    if (!tableBody) return;
    tableBody.innerHTML =
      '<tr><td colspan="3" class="px-3 py-6 text-center text-slate-400">Memuat...</td></tr>';
    const { data, error } = await supabase
      .from("members")
      .select("id,nama,role,email,auth_user_id")
      .order("nama", { ascending: true })
      .limit(500);
    if (error) {
      tableBody.innerHTML = `<tr><td colspan="3" class="px-3 py-6 text-center text-red-400">Gagal memuat: ${error.message}</td></tr>`;
      return;
    }
    allUsers = data || [];
    const term = String((searchEl || {}).value || "")
      .trim()
      .toLowerCase();
    const filtered = term
      ? allUsers.filter((u) => {
          const hay =
            `${u.nama || ""} ${u.email || ""} ${u.role || ""}`.toLowerCase();
          return hay.includes(term);
        })
      : allUsers;
    renderTable(filtered);
  };

  const loadAudit = async () => {
    if (!auditBody) return;
    auditBody.innerHTML =
      '<tr><td colspan="4" class="px-3 py-6 text-center text-slate-400">Memuat...</td></tr>';
    const { data, error } = await supabase
      .from("account_audit_logs")
      .select(
        "created_at,action,actor_auth_user_id,target_auth_user_id,target_member_id"
      )
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) {
      auditBody.innerHTML = `<tr><td colspan="4" class="px-3 py-6 text-center text-slate-400">Audit belum tersedia</td></tr>`;
      return;
    }
    const rows = data || [];
    if (!rows.length) {
      auditBody.innerHTML =
        '<tr><td colspan="4" class="px-3 py-6 text-center text-slate-400">Belum ada audit</td></tr>';
      return;
    }
    auditBody.innerHTML = rows
      .map((r) => {
        return `<tr class="hover:bg-white/5 transition-colors">
  <td class="px-3 py-3 text-xs text-slate-400 whitespace-nowrap">${fmtDateTime(r.created_at)}</td>
  <td class="px-3 py-3 text-amber-900 dark:text-amber-100 font-semibold">${String(r.action || "-")}</td>
  <td class="px-3 py-3 text-xs font-mono text-slate-600 dark:text-amber-200/80 break-all">${String(r.target_auth_user_id || r.target_member_id || "-")}</td>
  <td class="px-3 py-3 text-xs font-mono text-slate-600 dark:text-amber-200/80 break-all">${String(r.actor_auth_user_id || "-")}</td>
</tr>`;
      })
      .join("");
  };

  if (searchEl) {
    searchEl.addEventListener("input", () => loadUsers());
  }
  if (reloadBtn) reloadBtn.addEventListener("click", () => loadUsers());
  if (auditReload) auditReload.addEventListener("click", () => loadAudit());

  if (reqUsernameBtn) {
    reqUsernameBtn.addEventListener("click", async () => {
      if (!selected || !selected.id) {
        showAlert("Pilih user terlebih dahulu", "error");
        return;
      }
      const username = normalizeUsernameInput(
        (newUsernameEl || {}).value || ""
      );
      if (!username || username.length < 3) {
        showAlert("Username minimal 3 karakter", "error");
        return;
      }
      if (!selected.auth_user_id) {
        showAlert("Target belum terhubung ke auth_user_id", "error");
        return;
      }
      const domain = getPrimaryAuthEmailDomain();
      const nextEmail = `${username}@${domain}`;
      const btn = reqUsernameBtn;
      btn.disabled = true;
      try {
        const { error } = await supabaseAdminUpdateUser(
          String(selected.auth_user_id),
          {
            email: nextEmail,
            email_confirm: true,
          }
        );
        if (error) {
          showAlert("Gagal: " + error.message, "error");
          return;
        }
        await supabaseServiceRoleUpdateMembersById(selected.id, {
          email: nextEmail,
          username,
        });
        await supabaseServiceRoleUpsertAuditLog({
          actor_auth_user_id: actorUid,
          target_auth_user_id: String(selected.auth_user_id),
          target_member_id: selected.id,
          action: "set_username_direct",
          meta: { new_email: nextEmail, new_username: username },
        });
        selected.email = nextEmail;
        renderSelected();
        showAlert("Username berhasil diubah", "success");
        loadAudit();
      } finally {
        btn.disabled = false;
      }
    });
  }

  if (resetUsernameBtn) {
    resetUsernameBtn.disabled = true;
    resetUsernameBtn.classList.add("opacity-50", "cursor-not-allowed");
  }

  const isStrongPassword = (pw) => String(pw || "").length >= 6;

  if (setPwBtn) {
    setPwBtn.addEventListener("click", async () => {
      if (!selected || !selected.id) {
        showAlert("Pilih user terlebih dahulu", "error");
        return;
      }
      const pw1 = (adminNewPasswordEl || {}).value || "";
      const pw2 = (adminConfirmPasswordEl || {}).value || "";
      if (pw1 !== pw2) {
        showAlert("Konfirmasi password tidak sama", "error");
        return;
      }
      if (!isStrongPassword(pw1)) {
        showAlert("Password minimal 6 karakter", "error");
        return;
      }
      const confirm = await Swal.fire({
        title: "Ganti password user ini?",
        text: "Password akan langsung diganti oleh Admin. Pastikan ini sudah disetujui.",
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Ganti",
        cancelButtonText: "Batal",
        customClass: {
          popup: "rage-modal-popup",
          title: "rage-modal-title",
          confirmButton: "rage-modal-confirm",
          cancelButton: "rage-modal-cancel",
        },
      });
      if (!confirm.isConfirmed) return;
      const btn = setPwBtn;
      btn.disabled = true;
      try {
        if (!selected.auth_user_id) {
          showAlert("Target belum terhubung ke auth_user_id", "error");
          return;
        }
        const { error } = await supabaseAdminUpdateUser(
          String(selected.auth_user_id),
          {
            password: pw1,
          }
        );
        if (error) {
          showAlert("Gagal: " + error.message, "error");
          return;
        }
        await supabaseServiceRoleUpsertAuditLog({
          actor_auth_user_id: actorUid,
          target_auth_user_id: String(selected.auth_user_id),
          target_member_id: selected.id,
          action: "set_password_direct",
          meta: { by_admin: true },
        });
        if (adminNewPasswordEl) adminNewPasswordEl.value = "";
        if (adminConfirmPasswordEl) adminConfirmPasswordEl.value = "";
        showAlert("Password berhasil diganti", "success");
        loadAudit();
      } finally {
        btn.disabled = false;
      }
    });
  }

  renderSelected();
  await loadUsers();
  await loadAudit();
}

async function initAdminActivityPage() {
  if (!supabase) return;
  if (!requireAdminOrRedirect()) return;

  const typeEl = document.getElementById("actType");
  const userEl = document.getElementById("actUserFilter");
  const reloadBtn = document.getElementById("actReload");
  const autoBtn = document.getElementById("actAuto");
  const titleEl = document.getElementById("actTitle");
  const headEl = document.getElementById("actHead");
  const bodyEl = document.getElementById("actBody");
  const paginationEl = document.getElementById("actPagination");
  const activeCountEl = document.getElementById("activeSessionsCount");
  if (!typeEl || !bodyEl || !headEl) return;

  let auto = true;
  let timer = null;
  const PAGE_SIZE = 10;
  let currentPage = 1;

  const setAutoLabel = () => {
    if (autoBtn) autoBtn.textContent = auto ? "Auto: ON" : "Auto: OFF";
  };

  const render = (headCells, rowsHtml) => {
    headEl.innerHTML = headCells
      .map(
        (h) =>
          `<th class="px-3 py-3 text-left text-[10px] uppercase tracking-wider">${h}</th>`
      )
      .join("");
    bodyEl.innerHTML =
      rowsHtml ||
      `<tr><td colspan="${headCells.length}" class="px-3 py-8 text-center text-slate-400">Tidak ada data</td></tr>`;
  };

  const renderPagination = (totalRows, onPageChange) => {
    if (!paginationEl) return;
    const totalPages = Math.max(1, Math.ceil(totalRows / PAGE_SIZE));
    if (currentPage > totalPages) currentPage = totalPages;
    if (totalRows <= PAGE_SIZE) {
      paginationEl.innerHTML = "";
      return;
    }
    paginationEl.innerHTML = `
      <div>Menampilkan ${Math.min((currentPage - 1) * PAGE_SIZE + 1, totalRows)}-${Math.min(currentPage * PAGE_SIZE, totalRows)} dari ${totalRows} data</div>
      <div class="flex items-center gap-2">
        <button type="button" data-act-page="prev" class="px-3 py-1.5 rounded-lg border border-amber-200/70 dark:border-[#3d342d] text-amber-800 dark:text-amber-100 hover:bg-amber-50 dark:hover:bg-[#2a1b13] transition ${currentPage <= 1 ? "opacity-50 cursor-not-allowed" : ""}" ${currentPage <= 1 ? "disabled" : ""}>Prev</button>
        <span class="text-slate-600 dark:text-amber-200/80">Hal ${currentPage}/${totalPages}</span>
        <button type="button" data-act-page="next" class="px-3 py-1.5 rounded-lg border border-amber-200/70 dark:border-[#3d342d] text-amber-800 dark:text-amber-100 hover:bg-amber-50 dark:hover:bg-[#2a1b13] transition ${currentPage >= totalPages ? "opacity-50 cursor-not-allowed" : ""}" ${currentPage >= totalPages ? "disabled" : ""}>Next</button>
      </div>
    `;
    paginationEl.querySelectorAll("[data-act-page]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const dir = btn.getAttribute("data-act-page");
        if (dir === "prev" && currentPage > 1) currentPage -= 1;
        if (dir === "next" && currentPage < totalPages) currentPage += 1;
        onPageChange();
      });
    });
  };

  const resolveUserNames = async (rows) => {
    const byMemberId = new Map();
    const byAuthId = new Map();
    const memberIds = Array.from(
      new Set(
        (rows || [])
          .map((r) => Number(r.member_id))
          .filter((v) => Number.isFinite(v) && v > 0)
      )
    );
    if (memberIds.length) {
      const { data, error } = await supabase
        .from("members")
        .select("id,nama,auth_user_id")
        .in("id", memberIds);
      if (!error && Array.isArray(data)) {
        data.forEach((m) => {
          if (m && m.id != null) byMemberId.set(String(m.id), String(m.nama || "-"));
          if (m && m.auth_user_id)
            byAuthId.set(String(m.auth_user_id), String(m.nama || "-"));
        });
      }
    }

    const unresolvedAuthIds = Array.from(
      new Set(
        (rows || [])
          .map((r) => String(r.auth_user_id || ""))
          .filter((v) => v && !byAuthId.has(v))
      )
    );
    if (unresolvedAuthIds.length) {
      const { data, error } = await supabase
        .from("members")
        .select("id,nama,auth_user_id")
        .in("auth_user_id", unresolvedAuthIds);
      if (!error && Array.isArray(data)) {
        data.forEach((m) => {
          if (m && m.id != null && !byMemberId.has(String(m.id)))
            byMemberId.set(String(m.id), String(m.nama || "-"));
          if (m && m.auth_user_id)
            byAuthId.set(String(m.auth_user_id), String(m.nama || "-"));
        });
      }
    }

    return (r) => {
      const memberName = r && r.member_id != null ? byMemberId.get(String(r.member_id)) : null;
      if (memberName) return memberName;
      const authName = r && r.auth_user_id ? byAuthId.get(String(r.auth_user_id)) : null;
      if (authName) return authName;
      return "-";
    };
  };

  const refreshActiveCount = async () => {
    if (!activeCountEl) return;
    const cutoff = new Date(Date.now() - 2 * 60 * 1000).toISOString();
    const { data, error } = await supabase
      .from("user_login_sessions")
      .select("id")
      .gt("last_seen_at", cutoff)
      .is("logout_time", null)
      .limit(500);
    if (error) return;
    activeCountEl.textContent = String((data || []).length);
  };

  const load = async () => {
    const t = String(typeEl.value || "sessions");
    const term = String((userEl || {}).value || "")
      .trim()
      .toLowerCase();
    if (titleEl) {
      titleEl.textContent =
        t === "pages"
          ? "Page Access Logs"
          : t === "failed"
            ? "Failed Login Attempts"
            : "Login Sessions";
    }

    if (t === "sessions") {
      const { data, error } = await supabase
        .from("user_login_sessions")
        .select(
          "auth_user_id,member_id,device_id,login_time,last_seen_at,logout_time,user_agent"
        )
        .order("last_seen_at", { ascending: false })
        .limit(80);
      if (error) {
        if (paginationEl) paginationEl.innerHTML = "";
        render(
          ["Waktu", "Nama User", "Auth UID", "Member", "Device", "Status"],
          `<tr><td colspan="6" class="px-3 py-8 text-center text-red-400">${error.message}</td></tr>`
        );
        return;
      }
      const getUserName = await resolveUserNames(data || []);
      const rows = (data || []).filter((r) => {
        if (!term) return true;
        const userName = getUserName(r);
        const hay =
          `${userName} ${r.auth_user_id || ""} ${r.member_id || ""} ${r.device_id || ""}`.toLowerCase();
        return hay.includes(term);
      });
      const start = (currentPage - 1) * PAGE_SIZE;
      const pageRows = rows.slice(start, start + PAGE_SIZE);
      render(
        ["Last Seen", "Nama User", "Auth UID", "Member", "Device", "Status"],
        pageRows
          .map((r) => {
            const userName = getUserName(r);
            const active =
              !r.logout_time &&
              new Date(r.last_seen_at).getTime() > Date.now() - 2 * 60 * 1000;
            return `<tr class="hover:bg-white/5 transition-colors">
  <td class="px-3 py-3 text-xs text-slate-400 whitespace-nowrap">${fmtDateTime(r.last_seen_at)}</td>
  <td class="px-3 py-3 text-xs text-slate-600 dark:text-amber-200/80">${String(userName || "-")}</td>
  <td class="px-3 py-3 text-xs font-mono text-slate-600 dark:text-amber-200/80 break-all">${String(r.auth_user_id || "-")}</td>
  <td class="px-3 py-3 text-xs text-slate-600 dark:text-amber-200/80">${String(r.member_id || "-")}</td>
  <td class="px-3 py-3 text-xs font-mono text-slate-600 dark:text-amber-200/80 break-all">${String(r.device_id || "-")}</td>
  <td class="px-3 py-3 text-xs ${active ? "text-green-500" : "text-slate-400"}">${active ? "ACTIVE" : r.logout_time ? "LOGOUT" : "IDLE"}</td>
</tr>`;
          })
          .join("")
      );
      renderPagination(rows.length, load);
      await refreshActiveCount();
      return;
    }

    if (t === "pages") {
      const { data, error } = await supabase
        .from("page_access_logs")
        .select(
          "auth_user_id,member_id,device_id,page_url,access_time,duration_ms"
        )
        .order("access_time", { ascending: false })
        .limit(120);
      if (error) {
        if (paginationEl) paginationEl.innerHTML = "";
        render(
          ["Waktu", "Nama User", "Auth UID", "Halaman", "Durasi"],
          `<tr><td colspan="5" class="px-3 py-8 text-center text-red-400">${error.message}</td></tr>`
        );
        return;
      }
      const getUserName = await resolveUserNames(data || []);
      const rows = (data || []).filter((r) => {
        if (!term) return true;
        const userName = getUserName(r);
        const hay =
          `${userName} ${r.auth_user_id || ""} ${r.member_id || ""} ${r.page_url || ""}`.toLowerCase();
        return hay.includes(term);
      });
      const start = (currentPage - 1) * PAGE_SIZE;
      const pageRows = rows.slice(start, start + PAGE_SIZE);
      render(
        ["Waktu", "Nama User", "Auth UID", "Halaman", "Durasi"],
        pageRows
          .map((r) => {
            const userName = getUserName(r);
            const d =
              r.duration_ms == null ? "-" : `${fmtNumber(r.duration_ms)} ms`;
            return `<tr class="hover:bg-white/5 transition-colors">
  <td class="px-3 py-3 text-xs text-slate-400 whitespace-nowrap">${fmtDateTime(r.access_time)}</td>
  <td class="px-3 py-3 text-xs text-slate-600 dark:text-amber-200/80">${String(userName || "-")}</td>
  <td class="px-3 py-3 text-xs font-mono text-slate-600 dark:text-amber-200/80 break-all">${String(r.auth_user_id || "-")}</td>
  <td class="px-3 py-3 text-xs text-slate-600 dark:text-amber-200/80 break-all">${String(r.page_url || "-")}</td>
  <td class="px-3 py-3 text-xs text-slate-600 dark:text-amber-200/80 whitespace-nowrap">${d}</td>
</tr>`;
          })
          .join("")
      );
      renderPagination(rows.length, load);
      await refreshActiveCount();
      return;
    }

    const { data, error } = await supabase
      .from("failed_login_attempts")
      .select("username,attempt_time,ip_address,user_agent,failure_reason")
      .order("attempt_time", { ascending: false })
      .limit(120);
    if (error) {
      if (paginationEl) paginationEl.innerHTML = "";
      render(
        ["Waktu", "Username", "Reason"],
        `<tr><td colspan="3" class="px-3 py-8 text-center text-red-400">${error.message}</td></tr>`
      );
      return;
    }
    const rows = (data || []).filter((r) => {
      if (!term) return true;
      const hay = `${r.username || ""} ${r.failure_reason || ""}`.toLowerCase();
      return hay.includes(term);
    });
    const start = (currentPage - 1) * PAGE_SIZE;
    const pageRows = rows.slice(start, start + PAGE_SIZE);
    render(
      ["Waktu", "Username", "Reason"],
      pageRows
        .map((r) => {
          return `<tr class="hover:bg-white/5 transition-colors">
  <td class="px-3 py-3 text-xs text-slate-400 whitespace-nowrap">${fmtDateTime(r.attempt_time)}</td>
  <td class="px-3 py-3 text-xs font-mono text-slate-600 dark:text-amber-200/80 break-all">${String(r.username || "-")}</td>
  <td class="px-3 py-3 text-xs text-slate-600 dark:text-amber-200/80 break-all">${String(r.failure_reason || "-")}</td>
</tr>`;
        })
        .join("")
    );
    renderPagination(rows.length, load);
    await refreshActiveCount();
  };

  if (reloadBtn)
    reloadBtn.addEventListener("click", () => {
      currentPage = 1;
      load();
    });
  if (typeEl)
    typeEl.addEventListener("change", () => {
      currentPage = 1;
      load();
    });
  if (userEl)
    userEl.addEventListener("input", () => {
      currentPage = 1;
    });
  if (autoBtn) {
    autoBtn.addEventListener("click", () => {
      auto = !auto;
      setAutoLabel();
      if (timer) clearInterval(timer);
      timer = auto ? setInterval(load, 5000) : null;
    });
  }
  setAutoLabel();
  await load();
  timer = setInterval(load, 5000);
}

async function initAdminCatalogPage() {
  if (!supabase) return;
  const listEl = document.getElementById("catalogLists");
  const refreshBtn = document.getElementById("refreshCatalog");
  const addBtn = document.getElementById("addNewItem");

  const ensureX17AttachmentItems = async () => {
    if (window.__rageX17AttachmentSeeded) return;
    window.__rageX17AttachmentSeeded = true;
    const seeds = [
      {
        kategori: "Attachment",
        name: "Modern Extended Drum",
        price: 19500,
        scrap: 5,
        is_active: true,
        max_limit: 20,
        metadata: { note: "Attachment X17" },
      },
      {
        kategori: "Attachment",
        name: "Modern Suppressor Short",
        price: 13000,
        scrap: 5,
        is_active: true,
        max_limit: 20,
        metadata: { note: "Attachment X17" },
      },
      {
        kategori: "Attachment",
        name: "Holo Scope",
        price: 3900,
        scrap: 5,
        is_active: true,
        max_limit: 20,
        metadata: { note: "Attachment X17" },
      },
    ];
    try {
      const names = seeds.map((s) => s.name);
      const { data: existing, error } = await supabase
        .from("catalog_items")
        .select("name")
        .eq("kategori", "Attachment")
        .in("name", names)
        .limit(50);
      if (error) return;
      const exists = new Set((existing || []).map((r) => String(r.name || "")));
      const missing = seeds.filter((s) => !exists.has(s.name));
      if (!missing.length) return;
      const res = await supabase.from("catalog_items").insert(missing);
      if (
        res &&
        res.error &&
        String(res.error.message || "")
          .toLowerCase()
          .includes('column "max_limit"')
      ) {
        await supabase.from("catalog_items").insert(
          missing.map((m) => {
            const { max_limit, ...rest } = m;
            return rest;
          })
        );
      }
    } catch (e) {}
  };

  const load = async () => {
    if (listEl)
      listEl.innerHTML = `<div class="flex justify-center py-20"><div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-500"></div></div>`;
    await ensureX17AttachmentItems();
    const { data, error } = await supabase
      .from("catalog_items")
      .select("*")
      .order("kategori", { ascending: true })
      .order("name", { ascending: true });
    if (error) {
      if (listEl)
        listEl.innerHTML = `<div class="p-8 text-center text-red-400">${error.message}</div>`;
      return;
    }

    const byCat = { Gun: [], Ammo: [], Attachment: [], Others: [] };
    data.forEach((r) => {
      if (byCat[r.kategori]) byCat[r.kategori].push(r);
      else {
        if (!byCat[r.kategori]) byCat[r.kategori] = [];
        byCat[r.kategori].push(r);
      }
    });

    if (listEl) {
      listEl.innerHTML = Object.keys(byCat)
        .map((cat) => {
          const items = byCat[cat];
          if (!items.length) return "";
          return `
          <div class="glass-card overflow-hidden" data-category="${cat}">
            <div class="bg-amber-500/10 px-6 py-4 border-b border-amber-500/20 flex items-center justify-between cursor-pointer category-header">
              <h3 class="font-black text-amber-500 uppercase tracking-widest text-sm flex items-center gap-2">
                <div class="w-2 h-2 rounded-full bg-amber-500 animate-pulse shadow-[0_0_8px_rgba(245,158,11,0.8)]"></div>
                ${cat}
              </h3>
              <div class="flex items-center gap-3">
                <span class="text-[10px] text-amber-500/60 font-bold tracking-widest uppercase bg-amber-500/10 border border-amber-500/20 px-2 py-1 rounded-md">${items.length} Items</span>
                <svg class="w-5 h-5 text-amber-500/60 category-toggle-icon transition-transform duration-300" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
            <div class="overflow-x-auto category-content">
              <table class="w-full text-sm">
                <thead class="bg-[#120a06] text-slate-400/80 border-b border-amber-500/10">
                  <tr>
                    <th class="px-6 py-4 text-left font-bold uppercase tracking-wider text-[11px] w-1/4">Nama Item</th>
                    <th class="px-6 py-4 text-left font-bold uppercase tracking-wider text-[11px]">Pajak</th>
                    <th class="px-6 py-4 text-left font-bold uppercase tracking-wider text-[11px]">Harga Dasar</th>
                    <th class="px-6 py-4 text-left font-bold uppercase tracking-wider text-[11px]">Harga Jual</th>
                    <th class="px-6 py-4 text-left font-bold uppercase tracking-wider text-[11px]">Scrap</th>
                    <th class="px-6 py-4 text-left font-bold uppercase tracking-wider text-[11px]">Limit Order</th>
                    <th class="px-6 py-4 text-center font-bold uppercase tracking-wider text-[11px]">Status</th>
                    <th class="px-6 py-4 text-right font-bold uppercase tracking-wider text-[11px]">Aksi</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-white/5 bg-[#0a0604]/30">
                  ${items
                    .map((it) => {
                      let displayPrice = it.price;
                      let afterTax = getEffectivePrice(cat, displayPrice);
                      
                      if (it.name === MICRO_FULL_ATTACHMENT_BUNDLE_NAME) {
                        afterTax = getMicroFullAttachmentBundlePrice();
                        displayPrice = Math.round(afterTax / 1.1);
                      }
                      
                      return `
                    <tr class="hover:bg-amber-500/5 transition-colors group">
                      <td class="px-6 py-4">
                        <div class="font-bold text-amber-50/90 flex items-center gap-2">
                          <div class="w-1.5 h-1.5 rounded-full ${it.is_active ? 'bg-amber-500/80' : 'bg-slate-600'}"></div>
                          ${it.name}
                        </div>
                        ${it.metadata?.note ? `<div class="text-[10px] text-amber-500/50 mt-1.5 ml-3.5 font-medium tracking-wide"><span class="px-1.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/20">${it.metadata.note}</span></div>` : ""}
                      </td>
                      <td class="px-6 py-4">
                        <span class="inline-flex items-center px-2 py-1 rounded text-[10px] font-bold bg-[#1a1410] border border-white/5 text-slate-400">
                          ${cat === "Gun" || cat === "Attachment" ? "10%" : "0%"}
                        </span>
                      </td>
                      <td class="px-6 py-4 font-mono text-slate-400 text-xs">${fmt(displayPrice)}</td>
                      <td class="px-6 py-4 font-mono text-amber-400 font-bold text-xs bg-amber-500/5 group-hover:bg-transparent transition-colors">${fmt(afterTax)}</td>
                      <td class="px-6 py-4">
                        <div class="flex items-center gap-1.5 font-mono text-slate-400 text-xs">
                          ${it.scrap ? `
                          <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5 text-amber-500/70" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                          </svg>
                          ${it.scrap}
                          ` : '<span class="text-slate-600">-</span>'}
                        </div>
                      </td>
                      <td class="px-6 py-4">
                        <span class="inline-flex items-center px-2 py-1 rounded text-[10px] font-bold bg-[#1a1410] border border-white/5 text-amber-400">
                          ${it.max_limit ? fmtNumber(it.max_limit) : '-'}
                        </span>
                      </td>
                      <td class="px-6 py-4 text-center">
                        <span class="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${it.is_active ? "bg-green-500/10 text-green-400 border border-green-500/20" : "bg-red-500/10 text-red-400 border border-red-500/20"}">
                          ${it.is_active ? "AKTIF" : "OFF"}
                        </span>
                      </td>
                      <td class="px-6 py-4">
                        <div class="flex justify-end gap-2 opacity-70 group-hover:opacity-100 transition-opacity">
                          <button class="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-500 hover:bg-amber-500 hover:text-[#1a1410] hover:shadow-[0_0_10px_rgba(245,158,11,0.3)] hover:-translate-y-0.5 transition-all duration-300 edit-item" data-id="${it.id}" title="Edit Item">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-4 h-4">
                              <path stroke-linecap="round" stroke-linejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
                            </svg>
                          </button>
                          <button class="p-2 rounded-xl border transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg ${it.is_active ? "bg-red-500/10 border-red-500/20 text-red-400 hover:bg-red-500 hover:text-white hover:shadow-[0_0_10px_rgba(239,68,68,0.2)]" : "bg-green-500/10 border-green-500/20 text-green-400 hover:bg-green-500 hover:text-white hover:shadow-[0_0_10px_rgba(34,197,94,0.2)]"} toggle-item" data-id="${it.id}" data-active="${it.is_active}" title="${it.is_active ? 'Nonaktifkan' : 'Aktifkan'}">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-4 h-4">
                              <path stroke-linecap="round" stroke-linejoin="round" d="M5.636 5.636a9 9 0 1 0 12.728 0M12 3v9" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>`;
                    })
                    .join("")}
                </tbody>
              </table>
            </div>
          </div>`;
        })
        .join("");

      // Bind category toggle
      listEl.querySelectorAll(".category-header").forEach((header) => {
        header.addEventListener("click", () => {
          const card = header.closest(".glass-card");
          const content = card.querySelector(".category-content");
          const icon = card.querySelector(".category-toggle-icon");
          
          content.classList.toggle("hidden");
          icon.classList.toggle("rotate-180");
        });
      });

      // Bind actions
      listEl.querySelectorAll(".edit-item").forEach((btn) => {
        btn.addEventListener("click", () => {
          const id = btn.getAttribute("data-id");
          const it = data.find((x) => x.id === id);
          if (it) openItemModal(it);
        });
      });

      listEl.querySelectorAll(".toggle-item").forEach((btn) => {
        btn.addEventListener("click", async () => {
          const id = btn.getAttribute("data-id");
          const cur = btn.getAttribute("data-active") === "true";
          const { error } = await supabase
            .from("catalog_items")
            .update({ is_active: !cur })
            .eq("id", id);
          if (error) showAlert(error.message, "error");
          else {
            showAlert(`Item ${!cur ? "diaktifkan" : "dinonaktifkan"}`, "success");
            load();
          }
        });
      });
    }
  };

  const openItemModal = (item = null) => {
    const template = document.getElementById("itemModalTemplate");
    if (!template) return;
    const content = template.innerHTML;

    Swal.fire({
      title: item ? "Edit Item" : "Tambah Item Baru",
      html: content,
      showCancelButton: true,
      confirmButtonText: "Simpan",
      customClass: {
        popup: "rage-modal-popup",
        title: "rage-modal-title",
        confirmButton: "rage-modal-confirm",
        cancelButton: "rage-modal-cancel",
      },
      didOpen: () => {
        if (item) {
          document.getElementById("modalKategori").value = item.kategori;
          document.getElementById("modalName").value = item.name;
          document.getElementById("modalPrice").value = item.price;
          document.getElementById("modalScrap").value = item.scrap || "";
          document.getElementById("modalMaxLimit").value = item.max_limit || "";
          document.getElementById("modalNote").value = item.metadata?.note || "";
        }
      },
      preConfirm: () => {
        const maxLimit = document.getElementById("modalMaxLimit").value;
        if (!maxLimit || parseInt(maxLimit, 10) < 1) {
          Swal.showValidationMessage("Limit Order wajib diisi dan minimal 1");
          return false;
        }
        return {
          kategori: document.getElementById("modalKategori").value,
          name: document.getElementById("modalName").value.trim(),
          price: parseInt(document.getElementById("modalPrice").value || "0", 10),
          scrap: document.getElementById("modalScrap").value
            ? parseFloat(document.getElementById("modalScrap").value)
            : null,
          max_limit: parseInt(maxLimit, 10),
          note: document.getElementById("modalNote").value.trim(),
        };
      },
    }).then(async (result) => {
      if (result.isConfirmed) {
        const payload = {
          kategori: result.value.kategori,
          name: result.value.name,
          price: result.value.price,
          scrap: result.value.scrap,
          max_limit: result.value.max_limit,
          metadata: { note: result.value.note },
        };

        let res;
        if (item) {
          res = await supabase
            .from("catalog_items")
            .update(payload)
            .eq("id", item.id);
        } else {
          res = await supabase.from("catalog_items").insert([payload]);
        }

        if (res.error) showAlert(res.error.message, "error");
        else {
          showAlert("Berhasil disimpan", "success");
          load();
        }
      }
    });
  };

  if (refreshBtn) refreshBtn.addEventListener("click", () => load());
  if (addBtn) addBtn.addEventListener("click", () => openItemModal());

  await load();
}

async function init() {
  console.log("R.A.G.E script initializing...");
  // document.documentElement.classList.add("dark"); // Allow system/user preference

  try {
    setupChatListeners();
    console.log("Chat listeners setup complete");
  } catch (e) {
    console.error("Chat setup failed:", e);
  }

  if (!window.SUPABASE_URL || !window.SUPABASE_ANON_KEY) {
    console.warn("Supabase configuration missing (config.js). Chat only mode.");
    return;
  }
  const isOrder =
    !!document.getElementById("orderSection") ||
    !!document.getElementById("nama") ||
    !!document.getElementById("kategori");
  const isDashboard =
    !!document.getElementById("dashboardSection") ||
    !!document.getElementById("dashboardBody") ||
    !!document.getElementById("dashMonth");
  const isStoran = !!document.getElementById("storanSection");
  const isDrugs = !!document.getElementById("drugsNama");
  const isKas = !!document.getElementById("rageCashSubmit");
  const isRekap = !!document.getElementById("rekapSection");
  const isProfile = !!document.getElementById("profileSection");
  const isAdminUsers = !!document.getElementById("adminUsersSection");
  const isAdminActivity = !!document.getElementById("adminActivitySection");
  const isAdminCatalog = !!document.getElementById("catalogLists");
  const needsAuth =
    isOrder ||
    isDashboard ||
    isStoran ||
    isDrugs ||
    isKas ||
    isRekap ||
    isProfile ||
    isAdminUsers ||
    isAdminActivity ||
    isAdminCatalog;
  if (needsAuth) {
    const ok = await guardApp();
    if (!ok) return;
  }

  // Load dynamic catalog before UI starts populating
  await fetchCatalog();

  let currentMember = null;
  if (
    isOrder ||
    isDashboard ||
    isStoran ||
    isDrugs ||
    isKas ||
    isRekap ||
    isProfile ||
    isAdminUsers ||
    isAdminActivity ||
    isAdminCatalog
  ) {
    currentMember = await resolveCurrentMember();
    window.__currentMember = currentMember;
    if (!currentMember || !currentMember.id) {
      await showLinkMemberHelpModal();
    }
  }
  recordPageAccess(currentMember);
  upsertSessionHeartbeat(currentMember);
  window.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible")
      upsertSessionHeartbeat(window.__currentMember || null);
  });
  ensureProfileNavLinks(currentMember);
  applyAdminNav(currentMember);

  if (
    !isAdminMember(currentMember) &&
    (isDashboard ||
      isStoran ||
      isDrugs ||
      isKas ||
      isAdminUsers ||
      isAdminActivity ||
      isAdminCatalog)
  ) {
    showAlert("Menu ini hanya untuk Admin", "error");
    location.href = "index.html";
    return;
  }

  if (isDashboard) {
    const ok = await guardDashboard();
    if (!ok) return;
    if (!isAdminMember(currentMember)) {
      requireAdminOrRedirect();
      return;
    }
  }
  if (isOrder) {
    const kategoriEl = document.getElementById("kategori");
    const itemEl = document.getElementById("item");
    if (kategoriEl && itemEl) {
      Object.keys(CATALOG).forEach((k) => {
        const o = document.createElement("option");
        o.value = k;
        o.textContent = k;
        kategoriEl.appendChild(o);
      });
      kategoriEl.addEventListener("change", () => populateItems());
      populateItems();
    }
    const addBtn = document.getElementById("addBtn");
    const submitBtn = document.getElementById("submitBtn");
    if (addBtn) addBtn.addEventListener("click", addToCart);
    if (submitBtn) submitBtn.addEventListener("click", submitOrder);
    if (currentMember && currentMember.id) {
      applyCurrentMemberToOrderUI(currentMember);
    } else {
      setupCustomerSearch();
      updateNameValidity();
      const addBtn2 = document.getElementById("addBtn");
      const submitBtn2 = document.getElementById("submitBtn");
      if (addBtn2) addBtn2.disabled = true;
      if (submitBtn2) submitBtn2.disabled = true;
      showAlert(
        "Akun kamu belum terhubung ke data member. Hubungkan dulu di tabel members.",
        "error"
      );
    }
    setOrderNoUI();
    updateOrderWindowUI();
    setInterval(updateOrderWindowUI, 60000);
  }
  if (isDashboard) {
    initDashboard();
  }
  if (isStoran) {
    initStoran(currentMember);
  }
  if (isDrugs) {
    initDrugs(currentMember);
  }
  if (isKas) {
    initRageCash();
  }
  if (isRekap) {
    initRekap();
  }
  if (isProfile) {
    initProfile();
  }
  if (isAdminUsers) {
    initAdminUsersPage();
  }
  if (isAdminActivity) {
    initAdminActivityPage();
  }
  if (isAdminCatalog) {
    initAdminCatalogPage();
  }

  // Global Logout & Mobile Menu
  const handleLogout = async () => {
    await markSessionLogout();
    try {
      await supabase.auth.signOut();
    } catch (e) {}
    try {
      const keys = Object.keys(localStorage || {});
      keys.forEach((k) => {
        if (k.startsWith("sb-") && k.endsWith("-auth-token"))
          localStorage.removeItem(k);
      });
    } catch (e) {}
    location.href = "login.html";
  };

  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) logoutBtn.addEventListener("click", handleLogout);

  const mobileLogoutBtn = document.getElementById("mobileLogoutBtn");
  if (mobileLogoutBtn) mobileLogoutBtn.addEventListener("click", handleLogout);

  window.toggleMobileMenu = function () {
    const menu = document.getElementById("mobileMenu");
    if (menu) menu.classList.toggle("hidden");
  };

  const dateEl = document.getElementById("current-date");
  if (dateEl) {
    const options = {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
    };
    dateEl.textContent = new Date().toLocaleDateString("id-ID", options);
  }

  const updateActiveNav = (navId, activeClass) => {
    const nav = document.getElementById(navId);
    if (nav) {
      const links = Array.from(nav.querySelectorAll("a"));
      const path = (location.pathname || "").toLowerCase();
      let file = path.split("/").pop() || "";
      if (!file || file === "/") file = "index.html";
      links.forEach((a) => {
        const href = (a.getAttribute("href") || "").toLowerCase();
        const active = file && href.endsWith(file);
        a.classList.toggle(activeClass, active);
      });
    }
  };

  updateActiveNav("mainNav", "nav-active");
  updateActiveNav("mobileMenu", "mobile-nav-active");
}

function populateItems() {
  const kategori =
    document.getElementById("kategori").value || Object.keys(CATALOG)[0];
  const itemEl = document.getElementById("item");
  itemEl.innerHTML = "";
  CATALOG[kategori].forEach((it) => {
    const o = document.createElement("option");
    o.value = it.name;
    const displayPrice =
      it.name === MICRO_FULL_ATTACHMENT_BUNDLE_NAME
        ? getMicroFullAttachmentBundlePrice()
        : getEffectivePrice(kategori, it.price);
    o.textContent = `${it.name} (${fmt(displayPrice)})`;
    itemEl.appendChild(o);
  });
}

function getRolePermissions(role) {
  const R = role || "Hoodlum";
  if (String(R).trim().toLowerCase() === "admin") {
    return {
      allowed: "ALL",
      vestType: "BOTH",
      vestLimit: 9999,
    };
  }
  const BASE_GUNS = ["PISTOL .50", "CERAMIC PISTOL", "TECH 9"];
  const BASE_AMMO = ["AMMO .50", "AMMO 9MM"];
  const BASE_ATTACHMENTS = CATALOG.Attachment.map((i) => i.name);
  const HANGAROUND_ADDITIONS = [
    "MINI SMG",
    "MICRO SMG",
    // "SMG", // nonaktif sementara
    "PISTOL X17",
  ];
  const HANGAROUND_AMMO = ["AMMO .45"];

  const HOODLUM_ADDITIONS = [
    "SHOTGUN",
    "NAVY REVOLVER",
    "KVR",
    "BLACK REVOLVER",
  ];
  const HOODLUM_AMMO = ["AMMO 12 GAUGE", "AMMO 44 MAGNUM"];

  // Normalize helper
  const norm = (list) => list.map((x) => x.toUpperCase());

  if (R === "Internship") {
    return {
      allowed: new Set(
        norm([
          ...BASE_GUNS,
          ...BASE_AMMO,
          ...BASE_ATTACHMENTS,
          "VEST MEDIUM",
          "LOCKPICK",
        ])
      ),
      vestType: "VEST MEDIUM", // Merah
      vestLimit: 5,
    };
  }

  if (R === "Hangaround") {
    return {
      allowed: new Set(
        norm([
          ...BASE_GUNS,
          ...BASE_AMMO,
          ...BASE_ATTACHMENTS,
          ...HANGAROUND_ADDITIONS,
          ...HANGAROUND_AMMO,
          "VEST MEDIUM",
          "VEST",
          "LOCKPICK",
        ])
      ),
      vestType: "BOTH",
      vestLimit: 5,
    };
  }

  if (R === "Hoodlum") {
    return {
      allowed: "ALL",
      vestType: "BOTH",
      vestLimit: 10,
    };
  }

  // Highrank
  return {
    allowed: "ALL",
    vestType: "BOTH",
    vestLimit: 10,
  };
}

async function addToCart() {
  const ok = await ensureOrderingOpen();
  if (!ok) {
    showAlert("Order belum dibuka atau sudah ditutup", "error");
    return;
  }
  const hiddenId = parseInt(
    (document.getElementById("memberId") || {}).value || "",
    10
  );
  if (Number.isNaN(hiddenId) || !hiddenId) {
    showAlert("Pilih nama dari database", "error");
    return;
  }
  const role = await getMemberRole(hiddenId);
  const nama = document.getElementById("nama").value.trim();
  const kategori = document.getElementById("kategori").value;
  const itemName = document.getElementById("item").value;
  const qtyInput = document.getElementById("qty");
  const qty = parseInt(qtyInput ? qtyInput.value : "1", 10) || 1;
  if (!itemName || !kategori || qty < 1) return;

  const nItem = itemName.toUpperCase();
  const isLeo = nama.toLowerCase() === "leo";
  const perms = getRolePermissions(role);

  if (itemName === MICRO_FULL_ATTACHMENT_BUNDLE_NAME) {
    const canBuyItem = (name) => {
      if (isLeo || perms.allowed === "ALL") return true;
      return perms.allowed.has(name.toUpperCase());
    };

    for (const entry of MICRO_FULL_ATTACHMENT_COMPONENTS) {
      if (!canBuyItem(entry.name)) {
        showAlert(`${role} tidak diperbolehkan membeli ${entry.name}`, "error");
        return;
      }
    }

    for (const entry of MICRO_FULL_ATTACHMENT_COMPONENTS) {
      const max = getItemMax(entry.name);
      if (typeof max === "number") {
        const norm = normItemName(entry.name);
        const usedDb = (window.__itemTotals || {})[norm] || 0;
        const usedCart = state.cart
          .filter((c) => normItemName(c.item) === norm)
          .reduce((a, c) => a + (c.qty || 0), 0);
        const willBe = usedDb + usedCart + qty;
        if (willBe > max) {
          const remain = Math.max(0, max - usedDb - usedCart);
          showAlert(`Maks ${entry.name} ${max}. Tersisa ${remain}.`, "error");
          return;
        }
      }
    }

    for (const entry of MICRO_FULL_ATTACHMENT_COMPONENTS) {
      const itemInCatalog = (CATALOG[entry.kategori] || []).find(
        (i) => i.name === entry.name
      );
      if (!itemInCatalog) continue;
      const existing = state.cart.find(
        (c) => c.item === entry.name && c.kategori === entry.kategori
      );
      if (existing) existing.qty += qty;
      else
        state.cart.push({
          item: entry.name,
          kategori: entry.kategori,
          price: getEffectivePrice(entry.kategori, itemInCatalog.price),
          qty,
          scrap: itemInCatalog.scrap || 0,
        });
    }

    renderCart();
    return;
  }

  // 1. Check allowed items
  if (!isLeo && perms.allowed !== "ALL") {
    if (!perms.allowed.has(nItem)) {
      // Custom message for VEST mismatch
      if (nItem.includes("VEST")) {
        if (perms.vestType === "VEST" && nItem !== "VEST") {
          showAlert(`${role} hanya boleh beli VEST`, "error");
          return;
        }
        if (perms.vestType === "VEST MEDIUM" && nItem !== "VEST MEDIUM") {
          showAlert(`${role} hanya boleh beli VEST MEDIUM`, "error");
          return;
        }
        showAlert(`${role} tidak diperbolehkan membeli ${itemName}`, "error");
        return;
      }
      showAlert(`${role} tidak diperbolehkan membeli ${itemName}`, "error");
      return;
    }
  }

  // 2. Check Item Max Limit (Global)
  const max = getItemMax(itemName);
  if (typeof max === "number") {
    const norm = normItemName(itemName);
    const usedDb = (window.__itemTotals || {})[norm] || 0;
    const usedCart = state.cart
      .filter((c) => normItemName(c.item) === norm)
      .reduce((a, c) => a + (c.qty || 0), 0);
    const willBe = usedDb + usedCart + qty;
    if (willBe > max) {
      const remain = Math.max(0, max - usedDb - usedCart);
      showAlert(`Maks ${itemName} ${max}. Tersisa ${remain}.`, "error");
      return;
    }
  }

  // 3. Check Vest Personal Limit (Local Cart Check + DB check is done at submit, but good to check cart here)
  if (!isLeo && nItem.includes("VEST")) {
    const currentCartVest = state.cart
      .filter((c) => c.item.toUpperCase().includes("VEST"))
      .reduce((a, c) => a + c.qty, 0);

    if (currentCartVest + qty > perms.vestLimit) {
      showAlert(`Maksimal VEST per orang adalah ${perms.vestLimit}`, "error");
      return;
    }
  }

  const item = CATALOG[kategori].find((i) => i.name === itemName);
  const existing = state.cart.find(
    (c) => c.item === itemName && c.kategori === kategori
  );
  if (existing) existing.qty += qty;
  else
    state.cart.push({
      item: itemName,
      kategori,
      price: getEffectivePrice(kategori, item.price),
      qty,
      scrap: item.scrap || 0,
    });
  renderCart();
}

function renderCart() {
  const tbody = document.getElementById("cartBody");
  const emptyEl = document.getElementById("emptyState");
  tbody.innerHTML = "";
  let total = 0;
  let totalScrap = 0;
  state.cart.forEach((c, idx) => {
    const tr = document.createElement("tr");
    const subtotal = c.price * c.qty;
    total += subtotal;
    totalScrap += (c.scrap || 0) * c.qty;
    tr.innerHTML = `
      <td class="px-4 py-3">
        ${c.item}
        ${
          c.scrap
            ? `<div class="text-xs text-slate-500 dark:text-gray-400">Scrap: ${c.scrap}</div>`
            : ""
        }
      </td>
      <td class="px-4 py-3">${c.kategori}</td>
      <td class="px-4 py-3 text-right">${fmt(c.price)}</td>
      <td class="px-4 py-3 text-center">
        <input type="number" min="1" value="${
          c.qty
        }" data-qty-idx="${idx}" class="w-16 text-center px-2 py-1 rounded bg-[#fffbf0] dark:bg-[#0a0805] border border-[#f3e8d8] dark:border-[#3d342d] text-[#1a1410] dark:text-[#fef3c7] focus:outline-none focus:ring-2 focus:ring-amber-500" />
      </td>
      <td class="px-4 py-3 text-right">${fmt(subtotal)}</td>
      <td class="px-4 py-3 text-center"><button class="px-3 py-1 rounded-lg border-2 border-yellow-600 text-yellow-300 hover:bg-yellow-900/30 transition" data-idx="${idx}">Hapus</button></td>
    `;
    tbody.appendChild(tr);
  });
  document.getElementById("totalAmount").textContent = fmt(total);
  const scrapEl = document.getElementById("totalScrap");
  if (scrapEl) scrapEl.textContent = totalScrap > 0 ? totalScrap : "0";

  document.getElementById("total-items").textContent = state.cart.reduce(
    (a, c) => a + c.qty,
    0
  );
  if (emptyEl) emptyEl.classList.toggle("hidden", state.cart.length > 0);
  tbody.querySelectorAll("input[data-qty-idx]").forEach((inp) => {
    const handler = () => {
      const i = parseInt(inp.getAttribute("data-qty-idx"), 10);
      let v = parseInt(inp.value, 10);
      if (Number.isNaN(v) || v < 1) v = 1;
      state.cart[i].qty = v;
      renderCart();
    };
    inp.addEventListener("change", handler);
    inp.addEventListener("blur", handler);
  });
  tbody.querySelectorAll("button[data-idx]").forEach((b) =>
    b.addEventListener("click", (e) => {
      const i = parseInt(e.currentTarget.getAttribute("data-idx"), 10);
      state.cart.splice(i, 1);
      renderCart();
    })
  );
}

async function loadMyOrdersForSelection() {
  const hidden = document.getElementById("memberId");
  const nameInput = document.getElementById("nama");
  const v = hidden ? parseInt(hidden.value || "", 10) : NaN;
  const hasMemberId = !Number.isNaN(v) && !!v;
  const namaText = nameInput ? nameInput.value.trim() : "";

  if (!supabase) {
    renderMyOrders([]);
    return;
  }

  let query = supabase
    .from("orders")
    .select("id,order_id,item,qty,subtotal,orderanke,kategori,harga,waktu")
    .order("waktu", { ascending: false })
    .limit(500);

  if (hasMemberId) {
    query = query.eq("member_id", v);
  } else if (namaText) {
    query = query.eq("nama", namaText);
  } else {
    renderMyOrders([]);
    return;
  }

  const { data, error } = await query;
  if (error) {
    renderMyOrders([]);
    return;
  }
  const all = data || [];
  const periods = Array.from(
    new Set(all.map((r) => parseInt(r.orderanke || 0, 10)).filter((x) => !!x))
  ).sort((a, b) => b - a);
  const sel = document.getElementById("myOrdersPeriodSelect");
  if (sel) {
    if (!sel.options.length) {
      sel.innerHTML = periods
        .map((v) => {
          const m = Math.floor(v / 10);
          const w = v % 10;
          return `<option value="${v}">M${m}-W${w} (#${v})</option>`;
        })
        .join("");
    }
    sel.onchange = () => renderMyOrders(all, parseInt(sel.value || "", 10));
  }
  const defaultPeriod =
    sel && sel.value ? parseInt(sel.value, 10) : periods[0] || null;
  renderMyOrders(all, defaultPeriod);
}

function renderMyOrders(rows, useOrderanke) {
  const body = document.getElementById("myOrdersBody");
  const empty = document.getElementById("myOrdersEmpty");
  const totalEl = document.getElementById("myOrdersTotal");
  const periodEl = document.getElementById("myOrdersPeriod");
  const editBtn = document.getElementById("myOrdersEditBtn");
  if (!body || !empty || !totalEl || !periodEl) return;
  const items = (rows || []).filter((r) =>
    useOrderanke ? parseInt(r.orderanke || 0, 10) === useOrderanke : true
  );
  window.__myOrdersRows = items;
  if (items.length === 0) {
    body.innerHTML = "";
    empty.classList.remove("hidden");
    totalEl.textContent = fmt(0);
    periodEl.textContent = "";
    if (editBtn) editBtn.classList.add("hidden");
    return;
  }
  const v =
    useOrderanke ||
    (items[0] && items[0].orderanke ? parseInt(items[0].orderanke, 10) : NaN);
  const m = !Number.isNaN(v) ? Math.floor(v / 10) : 0;
  const w = !Number.isNaN(v) ? v % 10 : 0;
  periodEl.textContent = v ? `M${m}-W${w} (#${v})` : "";
  const list = items
    .slice()
    .sort((a, b) => new Date(b.waktu).getTime() - new Date(a.waktu).getTime());
  body.innerHTML = list
    .map(
      (r) =>
        `<tr class="table-row-hover"><td class="px-2 py-2">${
          r.item
        }</td><td class="px-2 py-2 text-center">${
          r.qty
        }</td><td class="px-2 py-2 text-right">${fmt(
          r.subtotal
        )}</td><td class="px-2 py-2 text-right"><button class="px-2 py-1 rounded bg-red-700 text-white" data-del-id="${
          r.id
        }">Hapus</button></td></tr>`
    )
    .join("");
  const total = list.reduce((a, r) => a + (r.subtotal || 0), 0);
  totalEl.textContent = fmt(total);
  empty.classList.add("hidden");
  if (editBtn) {
    editBtn.classList.remove("hidden");
    editBtn.onclick = () => startEditMyOrders();
  }
  body.querySelectorAll("[data-del-id]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const id = parseInt(btn.getAttribute("data-del-id") || "", 10);
      if (!id) return;

      const result = await Swal.fire({
        title: "Hapus baris order ini?",
        text: "Tindakan ini tidak dapat dibatalkan!",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#d33",
        cancelButtonColor: "#3085d6",
        confirmButtonText: "Ya, hapus!",
        cancelButtonText: "Batal",
        background: "#1f1410",
        color: "#fef3c7",
      });
      if (!result.isConfirmed) return;

      try {
        const { error } = await supabase.from("orders").delete().eq("id", id);
        if (error) {
          console.error("Delete error:", error);
          showAlert(
            `Gagal menghapus item: ${error.message || "Unknown error"}`,
            "error"
          );
          return;
        }
        showAlert("Item dihapus", "success");
        await loadMyOrdersForSelection();
      } catch (e) {
        showAlert("Gagal menghapus (network)", "error");
      }
    });
  });
}

function initStoran(member) {
  const btn = document.getElementById("storanSubmit");
  if (btn) btn.addEventListener("click", submitStoran);
  const cancelEditBtn = document.getElementById("storanCancelEdit");
  if (cancelEditBtn) cancelEditBtn.addEventListener("click", resetStoranForm);
  const adminMode = isAdminMember(member);
  if (adminMode) {
    setupStoranNameSearch();
    const nameInput = document.getElementById("storanNama");
    const hidden = document.getElementById("storanMemberId");
    const status = document.getElementById("storanNamaStatus");
    if (nameInput) {
      nameInput.disabled = false;
      nameInput.value = "";
    }
    if (hidden) hidden.value = "";
    if (status) {
      status.textContent = "Pilih nama anggota dari database";
      status.classList.remove("text-green-500");
      status.classList.add("text-red-500");
    }
  } else if (member && member.id) {
    applyCurrentMemberToStoranUI(member);
  } else {
    setupStoranNameSearch();
    if (btn) btn.disabled = true;
    showAlert(
      "Akun kamu belum terhubung ke data member. Hubungkan dulu di tabel members.",
      "error"
    );
  }
  const reload = document.getElementById("storanReloadBtn");
  if (reload) reload.addEventListener("click", () => loadStoranTable());
  loadStoranTable();
}

function setStoranFormMode(isEditing) {
  const submitLabel = document.getElementById("storanSubmitLabel");
  const cancelBtn = document.getElementById("storanCancelEdit");
  if (submitLabel)
    submitLabel.textContent = isEditing ? "Update Storan" : "Kirim Storan";
  if (cancelBtn) cancelBtn.classList.toggle("hidden", !isEditing);
}

function resetStoranForm() {
  const currentMember = window.__currentMember || null;
  const adminMode = isAdminMember(currentMember);
  const editIdEl = document.getElementById("storanEditId");
  const nameEl = document.getElementById("storanNama");
  const memberIdEl = document.getElementById("storanMemberId");
  const statusEl = document.getElementById("storanStatus");
  const receiverEl = document.getElementById("storanPenerima");
  const noteEl = document.getElementById("storanCatatan");
  const statusText = document.getElementById("storanNamaStatus");
  if (editIdEl) editIdEl.value = "";
  if (statusEl) statusEl.value = "SUDAH";
  if (receiverEl) receiverEl.value = "";
  if (noteEl) noteEl.value = "";
  if (adminMode) {
    if (nameEl) {
      nameEl.disabled = false;
      nameEl.value = "";
    }
    if (memberIdEl) memberIdEl.value = "";
    if (statusText) {
      statusText.textContent = "Pilih nama anggota dari database";
      statusText.classList.remove("text-green-500");
      statusText.classList.add("text-red-500");
    }
  } else {
    applyCurrentMemberToStoranUI(currentMember);
  }
  setStoranFormMode(false);
}

function startEditStoran(row) {
  const editIdEl = document.getElementById("storanEditId");
  const nameEl = document.getElementById("storanNama");
  const memberIdEl = document.getElementById("storanMemberId");
  const statusEl = document.getElementById("storanStatus");
  const receiverEl = document.getElementById("storanPenerima");
  const noteEl = document.getElementById("storanCatatan");
  const statusText = document.getElementById("storanNamaStatus");
  if (editIdEl) editIdEl.value = row && row.id ? String(row.id) : "";
  if (nameEl) nameEl.value = row && row.nama ? String(row.nama) : "";
  if (memberIdEl)
    memberIdEl.value = row && row.memberId ? String(row.memberId) : "";
  if (statusEl)
    statusEl.value = row && row.statusRaw ? String(row.statusRaw) : "SUDAH";
  if (receiverEl)
    receiverEl.value = row && row.penerima ? String(row.penerima) : "";
  if (noteEl) noteEl.value = row && row.catatan ? String(row.catatan) : "";
  if (statusText) {
    statusText.textContent = "Mode edit storan";
    statusText.classList.remove("text-red-500");
    statusText.classList.add("text-green-500");
  }
  setStoranFormMode(true);
}

async function submitStoran() {
  const nameEl = document.getElementById("storanNama");
  const statusEl = document.getElementById("storanStatus");
  const receiverEl = document.getElementById("storanPenerima");
  const noteEl = document.getElementById("storanCatatan");
  const memberIdEl = document.getElementById("storanMemberId");
  const editIdEl = document.getElementById("storanEditId");
  if (!nameEl || !statusEl || !receiverEl) return;

  const currentMember = window.__currentMember || null;
  const adminMode = isAdminMember(currentMember);
  const nama =
    !adminMode && currentMember && currentMember.nama
      ? String(currentMember.nama)
      : nameEl.value.trim();
  const statusVal = statusEl.value;
  const penerima = receiverEl.value.trim();
  const catatan = (noteEl && noteEl.value.trim()) || "";

  const memberId =
    !adminMode && currentMember && currentMember.id
      ? parseInt(String(currentMember.id), 10)
      : memberIdEl
        ? parseInt(memberIdEl.value || "", 10)
        : NaN;
  const editingId = editIdEl ? parseInt(editIdEl.value || "", 10) : NaN;
  if (Number.isNaN(memberId) || !memberId) {
    showAlert("Akun belum terhubung ke member", "error");
    return;
  }
  if (memberIdEl && !Number.isNaN(memberId) && memberId)
    memberIdEl.value = String(memberId);
  if (!adminMode && currentMember && currentMember.nama)
    nameEl.value = String(currentMember.nama);

  if (!nama) {
    showAlert("Nama wajib diisi", "error");
    return;
  }
  if (!statusVal) {
    showAlert("Pilih status storan", "error");
    return;
  }
  if (!penerima) {
    showAlert("Penerima wajib diisi", "error");
    return;
  }

  const now = new Date();
  const ts = fmtDateTime(now.toISOString());
  const labelStatus =
    statusVal === "SUDAH"
      ? "Lunas 50k & 50 Metal Scrap"
      : "Belum storan minggu ini";
  let periodeLabel = "";
  let periodeValue = null;
  if (supabase) {
    try {
      const win = await fetchActiveOrderWindow(null);
      const fallbackWin = win || (await fetchLatestOrderWindow("order"));
      if (fallbackWin && fallbackWin.orderanke) {
        const v = parseInt(fallbackWin.orderanke, 10);
        if (!Number.isNaN(v) && v > 0) {
          periodeValue = v;
          const m = Math.floor(v / 10);
          const w = v % 10;
          periodeLabel = `M${m}-W${w} (#${v})`;
        }
      }
    } catch (e) {}
  }

  let msg = "```";
  msg += `\nSTORAN MINGGUAN`;
  if (periodeLabel) msg += `\nPeriode : ${periodeLabel}`;
  msg += `\nNama    : ${nama}`;
  msg += `\nPenerima: ${penerima}`;
  msg += `\nStatus  : ${labelStatus}`;
  if (catatan) msg += `\nNote    : ${catatan}`;
  msg += `\nWaktu   : ${ts}`;
  msg += "\n```";

  try {
    if (supabase) {
      const payload = {
        member_id: memberId,
        nama,
        status: statusVal,
        status_label: labelStatus,
        periode_orderanke: periodeValue,
        penerima,
        catatan,
        waktu: now.toISOString(),
      };
      const { error: logErr } =
        !Number.isNaN(editingId) && editingId
          ? await supabase
              .from("storan_logs")
              .update(payload)
              .eq("id", editingId)
          : await supabase.from("storan_logs").insert(payload);
      if (logErr) {
        console.error("Gagal menyimpan storan_logs:", logErr);
        showAlert("Gagal menyimpan log storan ke database", "error");
      }
    }
    const hook = (window && window.DISCORD_STORAN_WEBHOOK_URL) || "";
    await postToDiscord(msg, hook);
    showAlert(
      !Number.isNaN(editingId) && editingId
        ? "Storan berhasil diupdate"
        : "Storan terkirim ke Discord",
      "success"
    );
    resetStoranForm();
    if (typeof loadStoranTable === "function") {
      try {
        await loadStoranTable();
      } catch (e) {}
    }
  } catch (e) {
    showAlert("Gagal mengirim storan ke Discord", "error");
  }
}

async function loadStoranTable() {
  if (!supabase) return;
  const body = document.getElementById("storanTableBody");
  const empty = document.getElementById("storanTableEmpty");
  const labelEl = document.getElementById("storanPeriodeLabel");
  if (!body || !empty || !labelEl) return;

  body.innerHTML = "";
  empty.textContent = "Memuat data storan...";
  empty.classList.remove("hidden");

  let periodeLabel = "";
  let periodeValue = null;
  let isFallbackPeriod = false;
  try {
    const win = await fetchActiveOrderWindow(null);
    const fallbackWin = win || (await fetchLatestOrderWindow("order"));
    if (fallbackWin && fallbackWin.orderanke) {
      const v = parseInt(fallbackWin.orderanke, 10);
      if (!Number.isNaN(v) && v > 0) {
        periodeValue = v;
        const m = Math.floor(v / 10);
        const w = v % 10;
        isFallbackPeriod = !win;
        periodeLabel = `${isFallbackPeriod ? "TERAKHIR • " : ""}M${m}-W${w} (#${v})`;
      }
    }
  } catch (e) {}

  labelEl.textContent = periodeLabel || "Periode tidak tersedia";
  if (!periodeValue) {
    empty.textContent = "Belum ada data periode storan";
    return;
  }

  const [{ data: logs, error: logErr }, { data: members, error: memErr }] =
    await Promise.all([
      supabase
        .from("storan_logs")
        .select(
          "id,member_id,nama,penerima,status,status_label,catatan,waktu,periode_orderanke"
        )
        .eq("periode_orderanke", periodeValue)
        .order("waktu", { ascending: true }),
      supabase
        .from("members")
        .select("id,nama")
        .order("nama", { ascending: true }),
    ]);

  if (logErr || memErr) {
    empty.textContent = "Gagal memuat data storan / member";
    return;
  }

  const allMembers = members || [];
  if (!allMembers.length) {
    empty.textContent = "Belum ada member di database";
    return;
  }

  const latestByMember = {};
  (logs || []).forEach((r) => {
    const key = r.member_id || null;
    if (!key) return;
    const prev = latestByMember[key];
    if (!prev) {
      latestByMember[key] = r;
      return;
    }
    const tPrev = new Date(prev.waktu || 0).getTime();
    const tCur = new Date(r.waktu || 0).getTime();
    if (tCur >= tPrev) latestByMember[key] = r;
  });

  const rows = allMembers.map((m) => {
    const log = latestByMember[m.id] || null;
    const statusLabel = log
      ? log.status_label || "Sudah storan"
      : "Belum storan minggu ini";
    const t = log && log.waktu ? fmtDateTime(log.waktu) : "";
    const note = (log && log.catatan) || "";
    const penerima = (log && log.penerima) || "";
    return {
      id: (log && log.id) || "",
      memberId: m.id,
      nama: m.nama || "",
      penerima,
      status: statusLabel,
      statusRaw: (log && log.status) || "BELUM",
      catatan: note,
      waktu: t,
      isBelum: !log,
    };
  });

  const html = rows
    .map(
      (r, idx) => `<tr class="transition-colors hover:bg-amber-900/15 ${
        r.isBelum
          ? "bg-red-50/60 dark:bg-red-900/10 dark:hover:bg-red-900/20"
          : idx % 2 === 0
            ? "bg-transparent dark:hover:bg-[#241913]"
            : "bg-amber-50/40 dark:bg-[#1b120d] dark:hover:bg-[#241913]"
      }">
  <td class="px-3 py-2 whitespace-nowrap">${r.nama}</td>
  <td class="px-3 py-2 whitespace-nowrap">${r.penerima}</td>
  <td class="px-3 py-2">
    <span class="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] ${
      r.isBelum
        ? "bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-200"
        : "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-200"
    }">
      ${r.status}
    </span>
  </td>
  <td class="px-3 py-2 text-xs sm:text-sm">${r.catatan}</td>
  <td class="px-3 py-2 whitespace-nowrap text-xs sm:text-sm">${r.waktu}</td>
  <td class="px-3 py-2 text-center">
    <button class="px-3 py-1 rounded-lg bg-yellow-600/20 text-yellow-300 border border-yellow-600/30 text-[10px] font-bold uppercase hover:bg-yellow-600/30 transition" data-edit-storan-idx="${idx}">
      Edit
    </button>
  </td>
</tr>`
    )
    .join("");
  body.innerHTML = html;
  empty.classList.add("hidden");
  body.querySelectorAll("[data-edit-storan-idx]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const idx = parseInt(btn.getAttribute("data-edit-storan-idx") || "", 10);
      const row = rows[idx];
      if (!row) return;
      startEditStoran(row);
      const formName = document.getElementById("storanNama");
      if (formName)
        formName.scrollIntoView({ behavior: "smooth", block: "center" });
    });
  });
}

function setupStoranNameSearch() {
  const input = document.getElementById("storanNama");
  const dd = document.getElementById("storanNamaDropdown");
  const hidden = document.getElementById("storanMemberId");
  const status = document.getElementById("storanNamaStatus");
  if (!input || !dd || !hidden) return;

  let active = -1;
  const render = (items) => {
    dd.innerHTML = items
      .map(
        (r, i) =>
          `<div class="px-3 py-2 cursor-pointer ${
            i === active ? "bg-yellow-900/30" : ""
          }" data-id="${r.id}" data-name="${r.nama}">${r.nama}</div>`
      )
      .join("");
    dd.classList.toggle("hidden", items.length === 0);
    dd.querySelectorAll("[data-id]").forEach((el) =>
      el.addEventListener("mousedown", (e) => {
        input.value = e.currentTarget.getAttribute("data-name");
        hidden.value = e.currentTarget.getAttribute("data-id");
        dd.classList.add("hidden");
        if (status) {
          status.textContent = "Nama valid";
          status.classList.remove("text-red-500");
          status.classList.add("text-green-500");
        }
      })
    );
  };

  const run = debounce(async (term) => {
    if (!supabase) return;
    let q;
    if (term)
      q = supabase
        .from("members")
        .select("id,nama")
        .ilike("nama", `%${term}%`)
        .order("nama", { ascending: true })
        .limit(20);
    else
      q = supabase
        .from("members")
        .select("id,nama")
        .order("nama", { ascending: true })
        .limit(20);
    const { data, error } = await q;
    if (error) return;
    active = -1;
    render(data || []);
  }, 200);

  input.addEventListener("input", (e) => {
    hidden.value = "";
    if (status) {
      status.textContent = "Pilih nama dari database";
      status.classList.remove("text-green-500");
      status.classList.add("text-red-500");
    }
    run(e.target.value.trim());
  });
  input.addEventListener("focus", () => run(""));
  input.addEventListener("click", () => run(input.value.trim()));
  input.addEventListener("keydown", (e) => {
    const items = Array.from(dd.querySelectorAll("[data-id]"));
    if (!items.length) return;
    if (e.key === "ArrowDown") {
      active = Math.min(items.length - 1, active + 1);
      e.preventDefault();
    } else if (e.key === "ArrowUp") {
      active = Math.max(0, active - 1);
      e.preventDefault();
    } else if (e.key === "Enter" && active >= 0) {
      input.value = items[active].getAttribute("data-name");
      hidden.value = items[active].getAttribute("data-id");
      dd.classList.add("hidden");
      if (status) {
        status.textContent = "Nama valid";
        status.classList.remove("text-red-500");
        status.classList.add("text-green-500");
      }
    } else if (e.key === "Escape") {
      dd.classList.add("hidden");
    }
    items.forEach((el, i) =>
      el.classList.toggle("bg-yellow-900/30", i === active)
    );
  });
  input.addEventListener("blur", () =>
    setTimeout(() => dd.classList.add("hidden"), 150)
  );
}

function startEditMyOrders() {
  const rows = window.__myOrdersRows || [];
  if (!rows.length) return;
  const orderId = rows[0].order_id || null;
  const byItem = {};
  rows.forEach((r) => {
    const k = r.item;
    if (!byItem[k])
      byItem[k] = {
        kategori: r.kategori,
        item: r.item,
        price: r.harga,
        qty: 0,
      };
    byItem[k].qty += r.qty || 0;
  });
  state.cart = Object.values(byItem);
  window.__editingOrderId = orderId;
  renderCart();
  showAlert(
    "Keranjang diisi dari order periode aktif. Silakan edit lalu Submit.",
    "info"
  );
}

async function submitOrder() {
  const statusEl = document.getElementById("status");
  const currentMember = window.__currentMember || null;
  const nama =
    currentMember && currentMember.nama
      ? String(currentMember.nama)
      : document.getElementById("nama").value.trim();
  const winCurrent = supabase ? await fetchActiveOrderWindow(null) : null;
  const effectiveOrderanke =
    winCurrent && winCurrent.orderanke
      ? parseInt(winCurrent.orderanke, 10)
      : NaN;
  const isMaint = !!(window && window.MAINTENANCE_MODE);
  if (isMaint && !["leo", "melky"].includes(nama.toLowerCase())) {
    showAlert("Sedang maintenance: Sebentar yaa kawan", "error");
    return;
  }
  if (!nama) {
    showAlert("Nama pemesan wajib diisi", "error");
    return;
  }
  // console.log(effectiveOrderanke);
  if (state.cart.length === 0) {
    //  statusEl.textContent = "Keranjang kosong";
    showAlert("Keranjang kosong", "error");
    return;
  }
  const totalQty = (state.cart || []).reduce((a, c) => a + (c.qty || 0), 0);
  if (totalQty < 2) {
    showAlert("Jumlah total item minimal 2", "error");
    return;
  }
  //   statusEl.textContent = "Menyimpan...";
  showAlert("Menyimpan...", "info");
  if (!supabase) {
    //  statusEl.textContent = "Koneksi Supabase belum dikonfigurasi";
    showAlert("Koneksi Supabase belum dikonfigurasi", "error");
    return;
  }
  const submitBtn = document.getElementById("submitBtn");
  const originalBtnHtml = submitBtn ? submitBtn.innerHTML : "";
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.classList.add("opacity-60", "cursor-not-allowed");
    submitBtn.innerHTML = `<span class=\"inline-flex items-center gap-2\"><svg class=\"animate-spin h-4 w-4\" viewBox=\"0 0 24 24\" fill=\"none\"><circle class=\"opacity-25\" cx=\"12\" cy=\"12\" r=\"10\" stroke=\"currentColor\" stroke-width=\"4\"></circle><path class=\"opacity-75\" fill=\"currentColor\" d=\"M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z\"></path></svg> Saving...</span>`;
  }
  const endLoading = () => {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.classList.remove("opacity-60", "cursor-not-allowed");
      submitBtn.innerHTML = originalBtnHtml;
    }
  };
  const member_id =
    currentMember && currentMember.id
      ? parseInt(String(currentMember.id), 10)
      : parseInt((document.getElementById("memberId") || {}).value || "", 10);
  if (Number.isNaN(member_id) || !member_id) {
    showAlert("Akun belum terhubung ke member", "error");
    endLoading();
    return;
  }
  const open = await ensureOrderingOpen();
  if (!open) {
    showAlert("Order belum dibuka atau sudah ditutup", "error");
    endLoading();
    return;
  }
  if (Number.isNaN(effectiveOrderanke) || !effectiveOrderanke) {
    showAlert("Periode order aktif tidak ditemukan", "error");
    endLoading();
    return;
  }
  const editingId = window.__editingOrderId || null;
  const orderId =
    editingId || `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const role = await getMemberRole(member_id);
  const perms = getRolePermissions(role);
  const isLeo = String(nama || "").toLowerCase() === "leo";

  // 1. Validate Items in Cart against Role
  if (!isLeo && perms.allowed !== "ALL") {
    for (const c of state.cart) {
      const n = normItemName(c.item);
      if (!perms.allowed.has(n)) {
        if (n.includes("VEST")) {
          if (perms.vestType === "VEST" && n !== "VEST") {
            showAlert(`${role} hanya boleh beli VEST`, "error");
            endLoading();
            return;
          }
          if (perms.vestType === "VEST MEDIUM" && n !== "VEST MEDIUM") {
            showAlert(`${role} hanya boleh beli VEST MEDIUM`, "error");
            endLoading();
            return;
          }
        }
        showAlert(`${role} tidak diperbolehkan membeli ${c.item}`, "error");
        endLoading();
        return;
      }
    }
  }

  // 2. Validate Vest Limit (Database + Cart)
  if (!isLeo) {
    const isVestItem = (name) =>
      String(name || "")
        .toUpperCase()
        .includes("VEST");
    const cartVestCount = state.cart
      .filter((c) => isVestItem(c.item))
      .reduce((a, c) => a + (c.qty || 0), 0);

    let existingVest = 0;
    try {
      let q = supabase
        .from("orders")
        .select("qty,item,order_id")
        .eq("nama", nama)
        .eq("orderanke", effectiveOrderanke)
        .ilike("item", "%VEST%");
      if (editingId) q = q.neq("order_id", editingId);
      const { data } = await q;
      existingVest = (data || []).reduce((a, r) => a + (r.qty || 0), 0);
    } catch (e) {}

    const totalVest = existingVest + cartVestCount;
    if (totalVest > perms.vestLimit) {
      const remaining = Math.max(0, perms.vestLimit - existingVest);
      showAlert(
        `Maksimal VEST per orang ${perms.vestLimit}. Tersisa ${remaining}.`,
        "error"
      );
      endLoading();
      return;
    }
  }
  for (const c of state.cart) {
    const max = getItemMax(c.item);
    if (typeof max !== "number") continue;
    const norm = normItemName(c.item);
    const usedDb = (window.__itemTotals || {})[norm] || 0;
    const usedCart = state.cart
      .filter((x) => normItemName(x.item) === norm)
      .reduce((a, x) => a + (x.qty || 0), 0);
    if (usedDb + usedCart > max) {
      const remain = Math.max(0, max - usedDb);
      showAlert(`Maks ${c.item} ${max}. Tersisa ${remain}.`, "error");
      endLoading();
      return;
    }
  }
  const rows = buildOrderRows(orderId, member_id, nama, effectiveOrderanke);
  try {
    if (editingId) {
      const { error: delErr } = await supabase
        .from("orders")
        .delete()
        .eq("order_id", editingId);
      if (delErr) {
        showAlert(
          `Gagal menghapus order lama: ${delErr.message || "unknown"}`,
          "error"
        );
        endLoading();
        return;
      }
    }
    const { error } = await insertOrders(rows);
    if (error) {
      const hint = (error.hint || "").includes("apikey")
        ? ". Periksa SUPABASE_ANON_KEY di config.js"
        : "";
      showAlert(
        `Gagal menyimpan: ${error.message || "unknown"}${hint}`,
        "error"
      );
      endLoading();
      return;
    }
    //   statusEl.textContent = "Berhasil disimpan";
    showAlert("Berhasil disimpan", "success");
    state.cart = [];
    window.__editingOrderId = null;
    renderCart();
    await refreshItemTotals(effectiveOrderanke);
    await loadMyOrdersForSelection();
    try {
      let fetched = null;
      let qError = null;
      {
        const res = await supabase
          .from("orders")
          .select(
            "id,order_id,order_no,nama,orderanke,waktu,kategori,item,harga,qty,subtotal,delivered"
          )
          .eq("member_id", member_id)
          .eq("orderanke", effectiveOrderanke)
          .order("waktu", { ascending: false })
          .limit(100);
        fetched = res.data || null;
        qError = res.error || null;
      }
      if (qError && String(qError.message || "").includes("delivered")) {
        const res2 = await supabase
          .from("orders")
          .select(
            "id,order_id,order_no,nama,orderanke,waktu,kategori,item,harga,qty,subtotal"
          )
          .eq("member_id", member_id)
          .eq("orderanke", effectiveOrderanke)
          .order("waktu", { ascending: false })
          .limit(100);
        fetched = res2.data || null;
        qError = res2.error || null;
      }
      if (qError) throw qError;
      const items = fetched || [];
      const orderIds = Array.from(new Set(items.map((r) => r.order_id))).filter(
        Boolean
      );
      const count = orderIds.length;
      const total = items.reduce((a, r) => a + (r.subtotal || 0), 0);
      let totalScrap = 0;
      items.forEach((r) => {
        let scrap = 0;
        for (const cat in CATALOG) {
          const found = CATALOG[cat].find((i) => i.name === r.item);
          if (found) {
            scrap = found.scrap || 0;
            break;
          }
        }
        totalScrap += scrap * (r.qty || 0);
      });
      const m = Math.floor(effectiveOrderanke / 10);
      const w = effectiveOrderanke % 10;
      const itemList = items.map((r) => `• ${r.qty}x ${r.item}`).join("\n");

      const grouped = {};
      items.forEach((r) => {
        const key = r.item;
        if (!grouped[key]) grouped[key] = { ...r, qty: 0 };
        grouped[key].qty += r.qty;
      });

      const maxLen = Math.max(
        ...Object.values(grouped).map((r) => r.item.length)
      );
      const details = Object.values(grouped)
        .sort((a, b) => a.item.localeCompare(b.item))
        .map(
          (r) =>
            `• ${String(r.qty).padStart(2)}x ${r.item.padEnd(maxLen)} : ${fmt(
              (r.harga || 0) * (r.qty || 0)
            )}`
        )
        .join("\n");

      const msg =
        "```\n" +
        `Periode: M${m}-W${w} (#${effectiveOrderanke})\n` +
        `Nama  : ${nama}\n` +
        `Order : ${count}\n` +
        `Total : ${fmt(total)}\n` +
        (totalScrap > 0 ? `Total Scrap : ${totalScrap}\n` : "") +
        `\n` +
        `Detail Orderan :\n` +
        details +
        "```";

      await postToDiscord(msg);
    } catch (e) {}
    endLoading();
  } catch (e) {
    showAlert("Gagal menyimpan (network error)", "error");
    endLoading();
  }
}
async function getMemberRole(id) {
  if (!supabase || !id) return "Hoodlum";
  const cache = (window.__memberRoleCache ||= {});
  if (typeof cache[id] !== "undefined") return cache[id];
  try {
    const { data } = await supabase
      .from("members")
      .select("role")
      .eq("id", id)
      .limit(1);

    const row = data && data[0];
    const val = (row && row.role) || "Hoodlum";

    cache[id] = val;
    return val;
  } catch (e) {
    return "Hoodlum";
  }
}

document.addEventListener("DOMContentLoaded", init);
function debounce(fn, ms) {
  let t;
  return (...a) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...a), ms);
  };
}
function computeOrderNo(d = new Date()) {
  const month = d.getMonth() + 1;
  const first = new Date(d.getFullYear(), d.getMonth(), 1);
  const offset = first.getDay();
  const week = Math.ceil((d.getDate() + offset) / 7);
  const value = month * 10 + week;
  const label = `M${month}-W${week}`;
  return { month, week, value, label };
}

async function setOrderNoUI() {
  const display = document.getElementById("orderNoUI");
  const hidden = document.getElementById("orderankeHidden");
  let value, label;
  const win = supabase ? await fetchActiveOrderWindow(null) : null;
  if (win && win.orderanke) {
    const { m, w, raw } = decodeOrderanke(win.orderanke);
    value = raw;
    label = `M${m}-W${w}`;
  } else {
    const c = computeOrderNo();
    value = c.value;
    label = c.label;
  }
  if (display) {
    if (display.tagName === "INPUT") {
      display.value = `${label} (#${value})`;
    } else {
      display.textContent = `${label} (#${value})`;
    }
  }
  if (hidden) hidden.value = String(value);
}

function getNowIso() {
  return new Date().toISOString();
}

function decodeOrderanke(val) {
  if (!val) return { isDrugs: false, m: 0, w: 0, raw: 0 };
  const isDrugs = val >= 1000;
  const v = isDrugs ? val - 1000 : val;
  const m = Math.floor(v / 10);
  const w = v % 10;
  return { isDrugs, m, w, raw: v };
}

async function fetchActiveOrderWindow(orderanke, type = "order") {
  const now = getNowIso();
  let q = supabase
    .from("order_windows")
    .select("id,orderanke,start_time,end_time,is_active")
    .eq("is_active", true)
    .lte("start_time", now)
    .gte("end_time", now);

  if (type === "drugs") {
    q = q.gte("orderanke", 1000);
  } else {
    q = q.lt("orderanke", 1000);
  }

  q = q.order("orderanke", { ascending: false }).limit(1);

  if (orderanke) q = q.eq("orderanke", orderanke);
  const { data, error } = await q;
  if (error) return null;
  return (data || [])[0] || null;
}

async function fetchLatestOrderWindow(type = "order") {
  let q = supabase
    .from("order_windows")
    .select("id,orderanke,start_time,end_time,is_active")
    .not("orderanke", "is", null);

  if (type === "drugs") {
    q = q.gte("orderanke", 1000);
  } else {
    q = q.lt("orderanke", 1000);
  }

  const { data, error } = await q
    .order("end_time", { ascending: false })
    .order("orderanke", { ascending: false })
    .limit(1);
  if (error) return null;
  return (data || [])[0] || null;
}

async function ensureOrderingOpen() {
  const win = await fetchActiveOrderWindow(null);
  return !!win;
}
function setOrderControlsEnabled(enabled) {
  const ids = [
    "nama",
    "kategori",
    "item",
    "qty",
    "addBtn",
    "submitBtn",
    "resetBtn",
  ];
  ids.forEach((id) => {
    const el = document.getElementById(id);
    if (!el) return;
    const isControl = ["INPUT", "SELECT", "BUTTON"].includes(el.tagName);
    if (isControl) el.disabled = !enabled;
    el.classList.toggle("opacity-60", !enabled);
    el.classList.toggle("cursor-not-allowed", !enabled);
  });
}
async function refreshItemTotals(orderanke) {
  if (!supabase || !orderanke) return;
  const { data, error } = await supabase
    .from("orders")
    .select("item,qty,orderanke")
    .eq("orderanke", orderanke);
  if (error) return;
  const map = {};
  (data || []).forEach((r) => {
    const k = normItemName(r.item);
    map[k] = (map[k] || 0) + (r.qty || 0);
  });
  window.__itemTotals = map;
  populateItems();
}
async function updateOrderWindowUI() {
  await announceOpenedWindows();
  await expireOrderWindows();
  const container = document.getElementById("orderWindowStatus");
  const statusBox = document.getElementById("orderStatusBox");
  const detailEl = document.getElementById("orderWindowDetail");

  const ok = await ensureOrderingOpen();

  if (container) {
    container.classList.toggle("hidden", false); // Selalu tampilkan info
  }

  if (statusBox) {
    statusBox.textContent = ok ? "Order sedang dibuka" : "Order ditutup";
    statusBox.classList.toggle("bg-red-600", !ok);
    statusBox.classList.toggle("bg-green-600", ok);
  }

  const win = await fetchActiveOrderWindow(null);
  const vNow = win && win.orderanke ? parseInt(win.orderanke, 10) : null;
  if (vNow) await refreshItemTotals(vNow);

  if (detailEl) {
    if (win) {
      const { m, w, raw } = decodeOrderanke(win.orderanke);
      const options = {
        year: "numeric",
        month: "numeric",
        day: "numeric",
        hour: "numeric",
        minute: "numeric",
        second: "numeric",
        hour12: true,
      };
      const open = new Date(win.start_time).toLocaleString("en-US", options);
      const close = new Date(win.end_time).toLocaleString("en-US", options);
      detailEl.textContent = `Buka: ${open} • Tutup: ${close} • Periode: M${m}-W${w} (#${raw})`;
    } else {
      detailEl.textContent = `Tidak ada Periode Order Aktif`;
    }
  }
  setOrderControlsEnabled(ok);
  setOrderNoUI();
  const mem = document.getElementById("memberId");
  const mv = mem ? parseInt(mem.value || "", 10) : NaN;
  if (!Number.isNaN(mv) && !!mv) loadMyOrdersForSelection();
}
function showSection(name) {
  const order = document.getElementById("orderSection");
  const dash = document.getElementById("dashboardSection");
  const navOrder = document.getElementById("navOrder");
  const navDashboard = document.getElementById("navDashboard");
  const showOrder = name === "order";
  if (order) order.classList.toggle("hidden", !showOrder);
  if (dash) dash.classList.toggle("hidden", showOrder);
  if (navOrder) navOrder.classList.toggle("btn-success", showOrder);
  if (navDashboard) navDashboard.classList.toggle("btn-success", !showOrder);
  if (!showOrder) loadDashboard();
}
async function getMemberIdByName(nama) {
  const { data, error } = await supabase
    .from("members")
    .select("id")
    .eq("nama", nama)
    .limit(1);
  if (error || !data || !data.length) return null;
  return data[0].id;
}
function buildOrderRows(orderId, member_id, nama, orderanke) {
  return state.cart.map((c) => ({
    order_id: orderId,
    member_id,
    nama,
    orderanke,
    waktu: new Date().toISOString(),
    kategori: c.kategori,
    item: c.item,
    harga: c.price,
    qty: c.qty,
    subtotal: c.price * c.qty,
    delivered: false,
  }));
}
async function insertOrders(rows) {
  return await supabase.from("orders").insert(rows).select("id");
}
async function fetchOrders(limit = 500) {
  return await supabase
    .from("orders")
    .select(
      "id,order_id,order_no,nama,orderanke,waktu,kategori,item,harga,qty,subtotal,delivered,paid,scrap_given"
    )
    .order("waktu", { ascending: false })
    .limit(limit);
}
async function fetchOrdersSafe(limit = 500) {
  let { data, error } = await supabase
    .from("orders")
    .select(
      "id,order_id,order_no,nama,orderanke,waktu,kategori,item,harga,qty,subtotal,delivered,paid,scrap_given"
    )
    .lt("orderanke", 1000) // Hanya ambil orderan reguler
    .order("waktu", { ascending: false })
    .limit(limit);
  if (
    error &&
    (String(error.message || "").includes("delivered") ||
      String(error.message || "").includes("paid") ||
      String(error.message || "").includes("scrap_given"))
  ) {
    const res = await supabase
      .from("orders")
      .select(
        "id,order_id,order_no,nama,orderanke,waktu,kategori,item,harga,qty,subtotal"
      )
      .lt("orderanke", 1000) // Hanya ambil orderan reguler
      .order("waktu", { ascending: false })
      .limit(limit);
    return { data: res.data || [], error: res.error || null };
  }
  return { data: data || [], error: error || null };
}

function setupCustomerSearch() {
  const input = document.getElementById("nama");
  const dd = document.getElementById("namaDropdown");
  const hidden = document.getElementById("memberId");
  let active = -1;
  const render = (items) => {
    dd.innerHTML = items
      .map(
        (r, i) =>
          `<div class="px-3 py-2 cursor-pointer ${
            i === active ? "bg-yellow-900/30" : ""
          }" data-id="${r.id}" data-name="${r.nama}">${r.nama}</div>`
      )
      .join("");
    dd.classList.toggle("hidden", items.length === 0);
    dd.querySelectorAll("[data-id]").forEach((el) =>
      el.addEventListener("mousedown", (e) => {
        input.value = e.currentTarget.getAttribute("data-name");
        hidden.value = e.currentTarget.getAttribute("data-id");
        dd.classList.add("hidden");
        updateNameValidity();
      })
    );
  };
  const run = debounce(async (term) => {
    if (!supabase) return;
    let q;
    if (term)
      q = supabase
        .from("members")
        .select("id,nama")
        .ilike("nama", `%${term}%`)
        .order("nama", { ascending: true })
        .limit(20);
    else
      q = supabase
        .from("members")
        .select("id,nama")
        .order("nama", { ascending: true })
        .limit(20);
    const { data, error } = await q;
    if (error) return;
    active = -1;
    render(data || []);
  }, 200);
  input.addEventListener("input", (e) => {
    hidden.value = "";
    updateNameValidity();
    run(e.target.value.trim());
  });
  input.addEventListener("focus", () => run(""));
  input.addEventListener("click", () => run(input.value.trim()));
  input.addEventListener("keydown", (e) => {
    const items = Array.from(dd.querySelectorAll("[data-id]"));
    if (!items.length) return;
    if (e.key === "ArrowDown") {
      active = Math.min(items.length - 1, active + 1);
      e.preventDefault();
    } else if (e.key === "ArrowUp") {
      active = Math.max(0, active - 1);
      e.preventDefault();
    } else if (e.key === "Enter" && active >= 0) {
      input.value = items[active].getAttribute("data-name");
      hidden.value = items[active].getAttribute("data-id");
      dd.classList.add("hidden");
      updateNameValidity();
    } else if (e.key === "Escape") {
      dd.classList.add("hidden");
    }
    items.forEach((el, i) =>
      el.classList.toggle("bg-yellow-900/30", i === active)
    );
  });
  input.addEventListener("blur", () =>
    setTimeout(() => dd.classList.add("hidden"), 150)
  );
}
function updateNameValidity() {
  const hidden = document.getElementById("memberId");
  const status = document.getElementById("namaStatus");
  const v = hidden ? parseInt(hidden.value || "", 10) : NaN;
  const ok = !Number.isNaN(v) && !!v;
  if (status) {
    status.textContent = ok ? "Nama valid" : "Pilih nama dari database";
    status.classList.toggle("text-green-500", ok);
    status.classList.toggle("text-red-500", !ok);
  }
  if (ok) loadMyOrdersForSelection();
}
function groupOrdersByBatch(rows) {
  const groups = {};
  (rows || []).forEach((r) => {
    const batch = r.orderanke;
    if (!groups[batch]) groups[batch] = { items: [], total: 0, count: 0 };
    groups[batch].items.push(r);
    groups[batch].total += r.subtotal || 0;
    groups[batch].count += 1;
  });
  return groups;
}
function summarizeItems(items) {
  const map = {};
  (items || []).forEach((r) => {
    const key = r.item;
    if (!key) return;
    map[key] = (map[key] || 0) + (r.qty || 0);
  });
  return Object.keys(map)
    .sort()
    .map((item) => ({ item, qty: map[item] }));
}
const DELIVERED_KEY = "ordersDeliveredV1";
function getDeliveredSet() {
  try {
    const raw = localStorage.getItem(DELIVERED_KEY) || "[]";
    const arr = JSON.parse(raw);
    return new Set((arr || []).map(String));
  } catch (e) {
    return new Set();
  }
}
function saveDeliveredSet(set) {
  try {
    localStorage.setItem(DELIVERED_KEY, JSON.stringify(Array.from(set)));
  } catch (e) {}
}
const DELIVERED_ROW_KEY = "ordersDeliveredRowV1";
const PAID_PERSON_KEY = "ordersPaidPersonV1";
const SCRAP_PERSON_KEY = "ordersScrapPersonV1";
function getDeliveredRowSet() {
  try {
    const raw = localStorage.getItem(DELIVERED_ROW_KEY) || "[]";
    const arr = JSON.parse(raw);
    return new Set((arr || []).map(String));
  } catch (e) {
    return new Set();
  }
}
function saveDeliveredRowSet(set) {
  try {
    localStorage.setItem(DELIVERED_ROW_KEY, JSON.stringify(Array.from(set)));
  } catch (e) {}
}
function normalizePersonStatusName(name) {
  return String(name || "")
    .trim()
    .toLowerCase();
}
function makePersonStatusKey(batch, name) {
  return `${String(batch || "")}::${normalizePersonStatusName(name)}`;
}
function getPaidPersonSet() {
  try {
    const raw = localStorage.getItem(PAID_PERSON_KEY) || "[]";
    const arr = JSON.parse(raw);
    return new Set((arr || []).map(String));
  } catch (e) {
    return new Set();
  }
}
function savePaidPersonSet(set) {
  try {
    localStorage.setItem(PAID_PERSON_KEY, JSON.stringify(Array.from(set)));
  } catch (e) {}
}
function getScrapPersonSet() {
  try {
    const raw = localStorage.getItem(SCRAP_PERSON_KEY) || "[]";
    const arr = JSON.parse(raw);
    return new Set((arr || []).map(String));
  } catch (e) {
    return new Set();
  }
}
function saveScrapPersonSet(set) {
  try {
    localStorage.setItem(SCRAP_PERSON_KEY, JSON.stringify(Array.from(set)));
  } catch (e) {}
}
function getCatalogPrice(name) {
  for (const k of Object.keys(CATALOG)) {
    const it = (CATALOG[k] || []).find((x) => x.name === name);
    if (it) return it.price;
  }
  return null;
}
function buildPriceMap(items) {
  const map = {};
  (items || []).forEach((r) => {
    const key = r.item;
    if (!key) return;
    const p = typeof r.harga === "number" ? r.harga : null;
    if (p) map[key] = p;
  });
  return map;
}
const GROUP_ORDER = [
  "ORDER KE HIGH TABEL",
  "ORDER KE ALLSTAR",
  "ORDER KE BOA",
  "ORDER KE BURGENK",
  "ORDER KE PP",
  "LAINNYA",
];
const GROUP_ITEMS = {
  "ORDER KE HIGH TABEL": [
    "BLACK REVOLVER",
    "VEST",
    "Assault Rifle",
    "Ammo 762",
    "Ammo 556",
    "Virtus#3",
  ],

  "ORDER KE ALLSTAR": [
    // "AMMO 44 MAGNUM",
    // "KVR",
    // "AMMO .45",
    // "NAVY REVOLVER",
  ],

  "ORDER KE BOA": [
    "SHOTGUN",
    "AMMO 12 GAUGE",
    "VEST MEDIUM",
    "PISTOL X17",
    "X17 + Attachment",

    "AMMO 44 MAGNUM",
    "KVR",
    "AMMO .45",
    "NAVY REVOLVER",
  ],

  "ORDER KE BURGENK": [
    "Tactical Flashlight",
    "Suppressor",
    "Tactical Suppressor",
    "Grip",
    "Extended Pistol Clip",
    "Extended SMG Clip",
    "Extended Rifle Clip",
    // "SMG Drum", // nonaktif sementara
    "Rifle Drum",
    "Macro Scope",
    "Medium Scope",
  ],

  "ORDER KE PP": [
    "PISTOL KACANG",
    "PISTOL .50",
    "CERAMIC PISTOL",
    "TECH 9",
    "MINI SMG",
    "MICRO SMG",
    // "SMG", // nonaktif sementara
    "AMMO 9MM",
    "AMMO .50",
    "VEST MEDIUM",
  ],

  LAINNYA: ["LOCKPICK"],
};
function normItemName(s) {
  return String(s || "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, " ");
}
function assignGroupForItem(item) {
  const n = normItemName(item);
  for (const grp of GROUP_ORDER) {
    const arr = (GROUP_ITEMS[grp] || []).map(normItemName);
    if (arr.includes(n)) return grp;
  }
  return "LAINNYA";
}
function sortRowsByGroupOrder(rows, grp) {
  const order = (GROUP_ITEMS[grp] || []).map(normItemName);
  return rows.slice().sort((a, b) => {
    const ia = order.indexOf(normItemName(a.item));
    const ib = order.indexOf(normItemName(b.item));
    const sa = ia < 0 ? 9999 : ia;
    const sb = ib < 0 ? 9999 : ib;
    if (sa !== sb) return sa - sb;
    return a.item.localeCompare(b.item);
  });
}
function renderDashboard(groups) {
  const container = document.getElementById("dashboardBody");
  if (!container) return;
  const keys = Object.keys(groups).sort(
    (a, b) => parseInt(b, 10) - parseInt(a, 10)
  );
  const paidPeople = getPaidPersonSet();
  const scrapPeopleLocal = getScrapPersonSet();
  const totalsByUser = {};
  keys.forEach((k) => {
    const g = groups[k];
    (g.items || []).forEach((r) => {
      const name = r.nama || "Unknown";
      totalsByUser[name] ||= {
        count: 0,
        total: 0,
        scrap: 0,
        paidGroups: new Map(),
        scrapGroups: new Map(),
      };
      totalsByUser[name].count += 1;
      totalsByUser[name].total += r.subtotal || 0;
      const personKey = makePersonStatusKey(r.orderanke || 0, name);
      const paidFlag = !!r.paid || paidPeople.has(personKey);
      const scrapFlag = !!r.scrap_given || scrapPeopleLocal.has(personKey);
      totalsByUser[name].paidGroups.set(String(r.orderanke || 0), paidFlag);
      totalsByUser[name].scrapGroups.set(String(r.orderanke || 0), scrapFlag);
      let itemScrap = 0;
      for (const cat in CATALOG) {
        const found = CATALOG[cat].find((i) => i.name === r.item);
        if (found) {
          itemScrap = found.scrap || 0;
          break;
        }
      }
      totalsByUser[name].scrap += itemScrap * (r.qty || 0);
    });
  });
  const userKeys = Object.keys(totalsByUser).sort(
    (a, b) =>
      totalsByUser[b].total - totalsByUser[a].total || a.localeCompare(b)
  );
  const getStatusSummary = (statusMap, labels) => {
    const statuses = Array.from((statusMap || new Map()).values());
    if (!statuses.length) {
      return {
        text: labels.none,
        cls: "bg-slate-700/20 text-slate-300 border border-slate-600/30",
      };
    }
    const doneCount = statuses.filter(Boolean).length;
    if (doneCount === statuses.length) {
      return {
        text: labels.done,
        cls: "bg-emerald-600/20 text-emerald-300 border border-emerald-500/30",
      };
    }
    if (doneCount === 0) {
      return {
        text: labels.none,
        cls: "bg-rose-600/20 text-rose-300 border border-rose-500/30",
      };
    }
    return {
      text: `${doneCount}/${statuses.length} ${labels.done}`,
      cls: "bg-amber-500/20 text-amber-200 border border-amber-400/30",
    };
  };
  const totalsHtml =
    `<div class=\"rounded-xl border border-[#f3e8d8] dark:border-[#3d342d] p-4 mb-6\"><h4 class=\"text-sm font-semibold mb-2\">Total Orders per User</h4><div class=\"overflow-x-auto\"><table class=\"w-full text-sm\"><thead><tr><th class=\"text-left px-2 py-2\">Nama</th><th class=\"text-center px-2 py-2\">Orders</th><th class=\"text-right px-2 py-2\">Total</th><th class=\"text-center px-2 py-2\">Scrap</th><th class=\"text-center px-2 py-2\">Duit</th><th class=\"text-center px-2 py-2\">Metal</th></tr></thead><tbody>` +
    userKeys
      .map((n) => {
        const money = getStatusSummary(totalsByUser[n].paidGroups, {
          done: "Lunas",
          none: "Belum",
        });
        const metal = getStatusSummary(totalsByUser[n].scrapGroups, {
          done: "Sudah",
          none: "Belum",
        });
        return `<tr class=\"table-row-hover border-b border-yellow-900/20\"><td class=\"px-2 py-2\">${n}</td><td class=\"px-2 py-2 text-center\">${
          totalsByUser[n].count
        }</td><td class=\"px-2 py-2 text-right\">${fmt(
          totalsByUser[n].total
        )}</td><td class=\"px-2 py-2 text-center\">${
          totalsByUser[n].scrap > 0
            ? parseFloat(totalsByUser[n].scrap.toFixed(2))
            : "-"
        }</td><td class=\"px-2 py-2 text-center\"><span class=\"inline-flex items-center justify-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide ${money.cls}\">${
          money.text
        }</span></td><td class=\"px-2 py-2 text-center\"><span class=\"inline-flex items-center justify-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide ${metal.cls}\">${
          metal.text
        }</span></td></tr>`;
      })
      .join("") +
    `</tbody></table></div></div>`;
  const batchesHtml = keys
    .map((k) => {
      const g = groups[k];
      let batchTotalScrap = 0;
      (g.items || []).forEach((r) => {
        let s = 0;
        for (const cat in CATALOG) {
          const f = CATALOG[cat].find((i) => i.name === r.item);
          if (f) {
            s = f.scrap || 0;
            break;
          }
        }
        batchTotalScrap += s * (r.qty || 0);
      });

      const month = Math.floor(parseInt(k, 10) / 10);
      const week = parseInt(k, 10) % 10;
      const header = `<div class=\"mb-4\"><h3 class=\"text-lg font-bold\">Batch M${month}-W${week}</h3><p class=\"text-sm\">Orders: ${
        g.count
      } • Total: ${fmt(g.total)} ${
        batchTotalScrap > 0
          ? `• Total Scrap: ${parseFloat(batchTotalScrap.toFixed(2))}`
          : ""
      }</p></div>`;
      const summaryData = summarizeItems(g.items);
      const priceMap = buildPriceMap(g.items);
      const groupedMap = {};
      summaryData.forEach((s) => {
        const grp = assignGroupForItem(s.item);
        (groupedMap[grp] ||= []).push(s);
      });
      const summary =
        `<div class=\"rounded-xl border border-[#f3e8d8] dark:border-[#3d342d] p-4 mb-6\"><h4 class=\"text-sm font-semibold mb-2\">Total Orderan</h4>` +
        GROUP_ORDER.map((grp) => {
          const rows = sortRowsByGroupOrder(groupedMap[grp] || [], grp);
          if (!rows.length) return "";
          let totalGrp = 0;
          const body = rows
            .map((s) => {
              const unit = priceMap[s.item] ?? getCatalogPrice(s.item) ?? 0;
              const sub = unit * s.qty;
              totalGrp += sub;
              return `<tr class=\"table-row-hover border-b border-[#f3e8d8] dark:border-[#3d342d]\"><td class=\"px-2 py-2\">${
                s.item
              }</td><td class=\"px-2 py-2 text-center\">${
                s.qty
              }</td><td class=\"px-2 py-2 text-right\">${fmt(
                unit
              )}</td><td class=\"px-2 py-2 text-right\">${fmt(sub)}</td></tr>`;
            })
            .join("");
          return (
            `<div class=\"mt-2 mb-4\"><h5 class=\"text-xs md:text-sm font-semibold mb-1\">${grp}</h5>` +
            `<div class=\"overflow-x-auto\"><table class=\"w-full text-sm border border-[#f3e8d8] dark:border-[#3d342d] rounded-lg\"><thead class=\"border-b border-[#f3e8d8] dark:border-[#3d342d]\"><tr><th class=\"text-left px-2 py-2\">Item</th><th class=\"text-center px-2 py-2\">Qty</th><th class=\"text-right px-2 py-2\">Harga</th><th class=\"text-right px-2 py-2\">Subtotal</th></tr></thead><tbody>` +
            body +
            `</tbody></table></div><div class=\"flex justify-end mt-2 text-sm font-semibold\">Total ${grp}: ${fmt(
              totalGrp
            )}</div></div>`
          );
        }).join("") +
        `</div>`;
      const byName = {};
      g.items.forEach((r) => {
        const key = r.nama || "Unknown";
        (byName[key] ||= []).push(r);
      });
      const nameKeys = Object.keys(byName).sort((a, b) => a.localeCompare(b));
      const rowsHtml = nameKeys
        .map((name, gIdx) =>
          byName[name]
            .map((r, idx, arr) => {
              const personKey = makePersonStatusKey(k, name);
              const paidOn = arr.every((x) => !!x.paid);
              const scrapOn = arr.every((x) => !!x.scrap_given);
              const nameCell =
                idx === 0
                  ? `<td class=\"px-2 py-2 align-top\" rowspan=\"${byName[name].length}\">${name}</td>`
                  : "";
              const personTotal = arr.reduce(
                (sum, x) => sum + (x.subtotal || 0),
                0
              );
              const personQty = arr.reduce((sum, x) => sum + (x.qty || 0), 0);
              const paidCell =
                idx === 0
                  ? `<td class=\"px-2 py-2 text-center align-top\" rowspan=\"${byName[name].length}\"><button data-paid-person-key=\"${personKey}\" data-paid-batch=\"${k}\" data-paid-name=\"${String(name).replace(/"/g, "&quot;")}\" data-paid-total=\"${personTotal}\" data-paid-qty=\"${personQty}\" class="px-2 py-1 rounded ${
                      paidOn ? "bg-emerald-700" : "bg-slate-700"
                    } text-white">${paidOn ? "Lunas" : "Belum"}</button></td>`
                  : "";
              const scrapCell =
                idx === 0
                  ? `<td class=\"px-2 py-2 text-center align-top\" rowspan=\"${byName[name].length}\"><button data-scrap-person-key=\"${personKey}\" data-scrap-batch=\"${k}\" data-scrap-name=\"${String(name).replace(/"/g, "&quot;")}\" class="px-2 py-1 rounded ${
                      scrapOn ? "bg-cyan-700" : "bg-slate-700"
                    } text-white">${scrapOn ? "Sudah" : "Belum"}</button></td>`
                  : "";
              const rowCls =
                idx === 0 && gIdx > 0
                  ? "table-row-hover border-t border-[#f3e8d8] dark:border-[#3d342d]"
                  : "table-row-hover";
              return `<tr class=\"${rowCls}\"><td class=\"px-2 py-2\">${
                r.order_no || r.order_id
              }</td>${nameCell}<td class=\"px-2 py-2\">${new Date(
                r.waktu
              ).toLocaleString()}</td><td class=\"px-2 py-2\">${
                r.item
              }</td><td class=\"px-2 py-2 text-center\">${
                r.qty
              }</td><td class=\"px-2 py-2 text-right\">${fmt(
                r.subtotal
              )}</td><td class=\"px-2 py-2 text-center\"><button data-row-id=\"${
                r.id
              }" class="px-2 py-1 rounded ${
                r.delivered ? "bg-green-700" : "bg-yellow-700"
              } text-white">${
                r.delivered ? "Sudah" : "Belum"
              }</button></td>${paidCell}${scrapCell}<td class=\"px-2 py-2 text-right\"><button data-del-id=\"${
                r.id
              }\" class=\"px-2 py-1 rounded bg-red-700 text-white\">Hapus</button></td></tr>`;
            })
            .join("")
        )
        .join("");
      const orderDetails =
        `<div class=\"rounded-xl border border-[#f3e8d8] dark:border-[#3d342d] p-4\"><h4 class=\"text-sm font-semibold mb-2\">Order Details</h4><div class=\"overflow-x-auto\"><table class=\"w-full text-sm\"><thead><tr><th class=\"text-left px-2 py-2\">Order No.</th><th class=\"text-left px-2 py-2\">Nama</th><th class=\"text-left px-2 py-2\">Waktu</th><th class=\"text-left px-2 py-2\">Item</th><th class=\"text-center px-2 py-2\">Qty</th><th class=\"text-right px-2 py-2\">Subtotal</th><th class=\"text-center px-2 py-2\">Status</th><th class=\"text-center px-2 py-2\">Bayar</th><th class=\"text-center px-2 py-2\">Metal</th><th class=\"text-right px-2 py-2\">Actions</th></tr></thead><tbody>` +
        rowsHtml +
        `</tbody></table></div></div>`;
      return `<div class=\"rounded-xl border border-[#f3e8d8] dark:border-[#3d342d] p-4 mb-4\">${header}</div>${summary}${orderDetails}`;
    })
    .join("");
  container.innerHTML = totalsHtml + batchesHtml;
  const deliveredRows = getDeliveredRowSet();
  const paidPeopleLocal = getPaidPersonSet();
  const scrapPeople = getScrapPersonSet();
  container.querySelectorAll("[data-row-id]").forEach((btn) => {
    const id = parseInt(btn.getAttribute("data-row-id") || "", 10);
    if (deliveredRows.has(String(id))) {
      btn.textContent = "Sudah";
      btn.className = "px-2 py-1 rounded bg-green-700 text-white";
    }
    btn.addEventListener("click", async () => {
      const nowDelivered = btn.textContent === "Belum";
      try {
        await supabase
          .from("orders")
          .update({ delivered: nowDelivered })
          .eq("id", id);
        btn.textContent = nowDelivered ? "Sudah" : "Belum";
        btn.className = nowDelivered
          ? "px-2 py-1 rounded bg-green-700 text-white"
          : "px-2 py-1 rounded bg-yellow-700 text-white";
        showAlert("Status diperbarui", "success");
      } catch (e) {
        const set = getDeliveredRowSet();
        if (nowDelivered) set.add(String(id));
        else set.delete(String(id));
        saveDeliveredRowSet(set);
        btn.textContent = nowDelivered ? "Sudah" : "Belum";
        btn.className = nowDelivered
          ? "px-2 py-1 rounded bg-green-700 text-white"
          : "px-2 py-1 rounded bg-yellow-700 text-white";
        showAlert("Status diperbarui (lokal)", "success");
      }
    });
  });
  container.querySelectorAll("[data-paid-person-key]").forEach((btn) => {
    const personKey = String(btn.getAttribute("data-paid-person-key") || "");
    const batch = parseInt(btn.getAttribute("data-paid-batch") || "", 10);
    const name = String(btn.getAttribute("data-paid-name") || "");
    const total = parseFloat(btn.getAttribute("data-paid-total") || "0");
    const qty = parseInt(btn.getAttribute("data-paid-qty") || "0", 10);
    if (paidPeople.has(String(personKey))) {
      btn.textContent = "Lunas";
      btn.className = "px-2 py-1 rounded bg-emerald-700 text-white";
    }
    btn.addEventListener("click", async () => {
      const nowPaid = btn.textContent !== "Lunas";
      try {
        const { error } = await supabase
          .from("orders")
          .update({ paid: nowPaid })
          .eq("orderanke", batch)
          .eq("nama", name);
        if (error) throw error;
        btn.textContent = nowPaid ? "Lunas" : "Belum";
        btn.className = nowPaid
          ? "px-2 py-1 rounded bg-emerald-700 text-white"
          : "px-2 py-1 rounded bg-slate-700 text-white";
        await postWeaponPaymentLog({ batch, name, paid: nowPaid, total, qty });
        showAlert("Status bayar diperbarui", "success");
      } catch (e) {
        const set = getPaidPersonSet();
        if (nowPaid) set.add(String(personKey));
        else set.delete(String(personKey));
        savePaidPersonSet(set);
        btn.textContent = nowPaid ? "Lunas" : "Belum";
        btn.className = nowPaid
          ? "px-2 py-1 rounded bg-emerald-700 text-white"
          : "px-2 py-1 rounded bg-slate-700 text-white";
        showAlert("Status bayar diperbarui (lokal)", "success");
      }
    });
  });
  container.querySelectorAll("[data-scrap-person-key]").forEach((btn) => {
    const personKey = String(btn.getAttribute("data-scrap-person-key") || "");
    const batch = parseInt(btn.getAttribute("data-scrap-batch") || "", 10);
    const name = String(btn.getAttribute("data-scrap-name") || "");
    if (scrapPeople.has(String(personKey))) {
      btn.textContent = "Sudah";
      btn.className = "px-2 py-1 rounded bg-cyan-700 text-white";
    }
    btn.addEventListener("click", async () => {
      const nowGiven = btn.textContent !== "Sudah";
      try {
        const { error } = await supabase
          .from("orders")
          .update({ scrap_given: nowGiven })
          .eq("orderanke", batch)
          .eq("nama", name);
        if (error) throw error;
        btn.textContent = nowGiven ? "Sudah" : "Belum";
        btn.className = nowGiven
          ? "px-2 py-1 rounded bg-cyan-700 text-white"
          : "px-2 py-1 rounded bg-slate-700 text-white";
        showAlert("Status metal scrap diperbarui", "success");
      } catch (e) {
        const set = getScrapPersonSet();
        if (nowGiven) set.add(String(personKey));
        else set.delete(String(personKey));
        saveScrapPersonSet(set);
        btn.textContent = nowGiven ? "Sudah" : "Belum";
        btn.className = nowGiven
          ? "px-2 py-1 rounded bg-cyan-700 text-white"
          : "px-2 py-1 rounded bg-slate-700 text-white";
        showAlert("Status metal scrap diperbarui (lokal)", "success");
      }
    });
  });
  container.querySelectorAll("[data-del-id]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const id = parseInt(btn.getAttribute("data-del-id") || "", 10);
      if (!id) return;

      const result = await Swal.fire({
        title: "Hapus item order ini?",
        text: "Tindakan ini tidak dapat dibatalkan!",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#d33",
        cancelButtonColor: "#3085d6",
        confirmButtonText: "Ya, hapus!",
        cancelButtonText: "Batal",
        background: "#1f1410",
        color: "#fef3c7",
      });
      if (!result.isConfirmed) return;

      try {
        const { error } = await supabase.from("orders").delete().eq("id", id);
        if (error) {
          console.error("Dashboard delete error:", error);
          showAlert(
            `Gagal menghapus item: ${error.message || "Unknown error"}`,
            "error"
          );
          return;
        }
        showAlert("Item dihapus", "success");
        loadDashboard(true);
      } catch (e) {
        showAlert("Gagal menghapus (network)", "error");
      }
    });
  });
}

function setupChatListeners() {
  const toggleBtn = document.getElementById("toggleChatBtn");
  const closeBtn = document.getElementById("closeChatBtn");
  const windowEl = document.getElementById("aiChatWindow");

  if (toggleBtn && windowEl) {
    toggleBtn.addEventListener("click", () => {
      const isHidden = windowEl.classList.contains("scale-0");
      if (isHidden) {
        windowEl.classList.remove("scale-0", "opacity-0");
      } else {
        windowEl.classList.add("scale-0", "opacity-0");
      }
    });
  }

  if (closeBtn && windowEl) {
    closeBtn.addEventListener("click", () => {
      windowEl.classList.add("scale-0", "opacity-0");
    });
  }
}

window.handleChatKey = function (e) {
  if (e.key === "Enter") window.sendChatMessage();
};

window.sendChatMessage = async function () {
  const input = document.getElementById("chat-input");
  const msg = input.value.trim();
  if (!msg) return;

  addChatMessage("user", msg);
  input.value = "";

  // Check if AI is configured
  if (window.AI_API_KEY) {
    const tempId = "msg-" + Date.now();
    addChatMessage("bot", "...", false, tempId);

    try {
      const response = await fetchAIResponse(msg);
      const bubble = document.querySelector(`#${tempId} > div`);
      if (bubble) bubble.textContent = response;
    } catch (e) {
      console.error(e);
      const bubble = document.querySelector(`#${tempId} > div`);
      if (bubble) {
        bubble.className += " text-red-500";
        bubble.textContent = `Error: ${e.message}. Cek Console (F12) untuk detail.`;
      }
    }
  } else {
    // Simple Logic-based Response
    setTimeout(() => {
      const response = generateBotResponse(msg);
      addChatMessage("bot", response);
    }, 600);
  }
};

function addChatMessage(role, text, isTemp = false, id = null) {
  const container = document.getElementById("chat-messages");
  const div = document.createElement("div");
  if (id) div.id = id;
  div.className = `flex ${role === "user" ? "justify-end" : "justify-start"}`;

  const bubble = document.createElement("div");
  const baseCls = "p-3 rounded-2xl max-w-[85%] text-[13px] shadow-sm animate-fade-in leading-relaxed";

  if (role === "user") {
    bubble.className = `${baseCls} bg-amber-600 text-white rounded-tr-none`;
    bubble.textContent = text;
  } else {
    bubble.className = `${baseCls} bg-[#1a120c] border border-amber-900/30 text-amber-50/90 rounded-tl-none`;
    // Simple formatter for bold and newlines
    let formatted = text
      .replace(/\*\*(.*?)\*\*/g, '<b class="text-amber-400 font-bold">$1</b>')
      .replace(/\n/g, "<br>");
    bubble.innerHTML = formatted;
  }

  div.appendChild(bubble);
  container.appendChild(div);
  container.scrollTop = container.scrollHeight;
  return div;
}

async function fetchAIResponse(userMsg) {
  const systemPrompt = getSystemPrompt();

  const body = {
    model: window.AI_MODEL || "llama3-8b-8192",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userMsg },
    ],
    temperature: 0.7,
    max_tokens: 200,
  };

  const res = await fetch(window.AI_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${window.AI_API_KEY}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    let errDetail = res.statusText;
    try {
      const errJson = await res.json();
      if (errJson.error && errJson.error.message) {
        errDetail = errJson.error.message;
      }
    } catch (parseErr) {
      // ignore json parse error
    }
    throw new Error(`API Error (${res.status}): ${errDetail}`);
  }
  const data = await res.json();
  return data.choices[0].message.content;
}

function getSystemPrompt() {
  let catalogText = "";
  for (const cat in CATALOG) {
    catalogText += `\n[${cat}]\n`;
    CATALOG[cat].forEach((item) => {
      catalogText += `- ${item.name}: $${item.price}${item.scrap ? ` (Scrap: ${item.scrap})` : ""}\n`;
    });
  }

  const compatibility = `
WEAPON COMPATIBILITY:
- KVR: Attachment (Tactical Suppressor, Grip, Medium Scope), Ammo (AMMO .45)
- PISTOL X17: Attachment (Tactical Flashlight, Modern Extended Drum, Modern Suppressor Short, Holo Scope), Ammo (AMMO 9MM)
- PISTOL .50: Attachment (Tactical Suppressor, Extended Pistol Clip), Ammo (AMMO .50)
- TECH 9: Attachment (SMG Drum, Suppressor), Ammo (AMMO 9MM)
- MINI SMG: Attachment (Extended SMG Clip), Ammo (AMMO 9MM)
- MICRO SMG: Attachment (Tactical Suppressor, Tactical Flashlight, Extended SMG Clip, Macro Scope), Ammo (AMMO 9MM)
- SMG: Attachment (SMG Drum, Suppressor, Tactical Flashlight, Macro Scope), Ammo (AMMO 9MM)
- SHOTGUN: Attachment (Tactical Suppressor, Tactical Flashlight), Ammo (AMMO 12 GAUGE)
- Assault Rifle: Attachment (Tactical Flashlight, Grip, Rifle Drum, Extended Rifle Clip, Macro Scope, Tactical Suppressor), Ammo (Ammo 762)
- CERAMIC PISTOL: Attachment (Extended Pistol Clip, Suppressor), Ammo (AMMO 9MM)
- Virtus#3: Attachment (Tactical Suppressor, Extended Rifle Clip), Ammo (AMMO 9MM)
`;

  return `You are Deri, a professional and helpful arms dealer assistant for R.A.G.E server.
Your goal is to help players find items, prices, ammo info, and attachment compatibility clearly.

You sell items from this catalog:
${catalogText}

${compatibility}

RULES:
1. Answer in polite and clear Indonesian (Bahasa Indonesia yang baik dan benar).
2. Use "Saya" for yourself and "Anda" or "Kak" for the customer. NO slang like "gue/lo".
3. Format prices nicely (e.g., "$10,000").
4. Explain requirements clearly (Scrap, etc.).
5. Be concise (2-3 sentences).
6. IF USER ASKS FOR TOTAL PRICE: Calculate it. (Price x Qty) = Total.
7. Always mention which ammo or attachment fits which gun if asked.
8. Act like a professional shopkeeper.`;
}

function generateBotResponse(msg) {
  const lower = msg.toLowerCase();
  const isAskingPrice = lower.includes("harga") || lower.includes("berapa");

  // 1. Greeting
  if (lower.includes("halo") || lower.includes("hi") || lower.includes("pagi") || lower.includes("malam")) {
    return "Selamat datang di R.A.G.E Order System! Saya Deri, ada yang bisa saya bantu mengenai info senjata, ammo, atau attachment?";
  }

  // 2. Deteksi Item dari Katalog
  const item = findItemInCatalog(lower);
  if (item) {
    let response = `**${item.name}**\n`;
    
    // Jika tanya harga atau jika item bukan kategori "Gun"
    if (isAskingPrice) {
      response += `Harga: **${fmt(item.price)}**\n`;
      if (item.scrap) response += `Metal Scrap: **${item.scrap}**\n`;
    }

    const weaponDetails = {
      "kvr": "Ammo: **AMMO .45**\nAttachment:\n- Tactical Suppressor\n- Grip\n- Medium Scope",
      "x17": "Ammo: **AMMO 9MM**\nAttachment:\n- Tactical Flashlight\n- Modern Extended Drum\n- Modern Suppressor Short\n- Holo Scope",
      "p50": "Ammo: **AMMO .50**\nAttachment:\n- Tactical Suppressor\n- Extended Pistol Clip",
      ".50": "Ammo: **AMMO .50**\nAttachment:\n- Tactical Suppressor\n- Extended Pistol Clip",
      "tech9": "Ammo: **AMMO 9MM**\nAttachment:\n- SMG Drum\n- Suppressor",
      "tech 9": "Ammo: **AMMO 9MM**\nAttachment:\n- SMG Drum\n- Suppressor",
      "mini smg": "Ammo: **AMMO 9MM**\nAttachment:\n- Extended SMG Clip",
      "micro smg": "Ammo: **AMMO 9MM**\nAttachment:\n- Tactical Suppressor\n- Tactical Flash\n- Extended SMG\n- Macro Scope",
      "smg": "Ammo: **AMMO 9MM**\nAttachment:\n- SMG Drum\n- Suppressor\n- Tactical Flash\n- Macro Scope",
      "shotgun": "Ammo: **AMMO 12 GAUGE**\nAttachment:\n- Tactical Suppressor\n- Tactical Flashlight",
      "assault": "Ammo: **Ammo 762**\nAttachment:\n- Tactical Flashlight\n- Grip\n- Rifle Drum\n- Extended Rifle\n- Macro Scope\n- Tactical Suppressor",
      "ak-47": "Ammo: **Ammo 762**\nAttachment:\n- Tactical Flashlight\n- Grip\n- Rifle Drum\n- Extended Rifle\n- Macro Scope\n- Tactical Suppressor",
      "ak47": "Ammo: **Ammo 762**\nAttachment:\n- Tactical Flashlight\n- Grip\n- Rifle Drum\n- Extended Rifle\n- Macro Scope\n- Tactical Suppressor",
      "ceramic": "Ammo: **AMMO 9MM**\nAttachment:\n- Extended Pistol\n- Suppressor",
      "virtus": "Ammo: **AMMO 9MM**\nAttachment:\n- Tactical Suppressor\n- Extended Rifle Clip"
    };

    const weaponKey = Object.keys(weaponDetails).find(k => item.name.toLowerCase().includes(k));
    if (weaponKey) {
      response += weaponDetails[weaponKey];
    } else if (!isAskingPrice) {
      response += `Harga: **${fmt(item.price)}**`;
    }

    return response;
  }

  // 3. General Ammo Questions
  if (lower.includes("ammo") || lower.includes("peluru")) {
    if (lower.includes(".50")) return "Ammo .50 cocok untuk Pistol .50.";
    if (lower.includes("9mm")) return "Ammo 9mm cocok untuk Ceramic, Tech 9, Mini SMG, Micro SMG, SMG, dan Pistol X17.";
    if (lower.includes("44") || lower.includes("magnum")) return "Ammo 44 Magnum cocok untuk Navy Revolver dan Black Revolver.";
    if (lower.includes("45")) return "Ammo .45 cocok untuk KVR.";
    if (lower.includes("762")) return "Peluru 762 digunakan untuk Assault Rifle (AK-47).";
    if (lower.includes("556")) return "Peluru 556 digunakan untuk Virtus#3.";
    return "Kami punya berbagai jenis ammo: 9mm, .50, .45, 44 Magnum, 762, dan 556. Kakak cari untuk senjata apa?";
  }

  // 4. General Attachment Questions
  if (lower.includes("attachment") || lower.includes("pasang") || lower.includes("scope") || lower.includes("clip") || lower.includes("suppressor") || lower.includes("flash") || lower.includes("grip")) {
    return "Tersedia Suppressor, Extended Clip, Scope, Flashlight, dan Grip. Kakak ingin tahu attachment untuk senjata apa? (Contoh: 'attachment kvr')";
  }

  // 5. Stock/Ready Questions
  if (lower.includes("ready") || lower.includes("stok") || lower.includes("ada")) {
    return "Semua barang yang ada di list katalog statusnya **Ready Stock**. Silakan langsung diorder ya Kak.";
  }

  // 6. Scrap/Metal Questions
  if (lower.includes("scrap") || lower.includes("metal")) {
    return "Banyak item kami memerlukan Metal Scrap. Silakan tanya harga item tertentu (misal: 'harga vest') untuk melihat kebutuhan scrap-nya.";
  }

  // Default
  return "Maaf, saya kurang paham. Kakak bisa tanya soal harga senjata, jenis ammo, atau kecocokan attachment (contoh: 'harga mini smg' atau 'attachment kvr').";
}

function findItemInCatalog(text) {
  // Flatten catalog
  let allItems = [];
  for (const cat in CATALOG) {
    allItems = allItems.concat(CATALOG[cat]);
  }

  const lowerText = text.toLowerCase();

  // 1. Exact or Substring Match (Item name inside text)
  for (const item of allItems) {
    const itemName = item.name.toLowerCase();
    if (lowerText.includes(itemName)) return item;
  }

  // 2. Reverse Substring Match (Text inside Item name)
  // Useful for "Virtus" -> "Virtus#3"
  const keywords = ["virtus", "ak", "x17", "tech", "smg", "pistol", "rifle", "vest", "ammo", "clip", "scope", "suppressor"];
  for (const kw of keywords) {
    if (lowerText.includes(kw)) {
      const found = allItems.find(i => i.name.toLowerCase().includes(kw));
      if (found) return found;
    }
  }

  // 3. Manual Overrides / Aliases
  if (lowerText.includes("ak47") || lowerText.includes("ak-47")) return allItems.find(i => i.name === "Assault Rifle");
  if (lowerText.includes("ak")) return allItems.find(i => i.name === "Assault Rifle");
  if (lowerText.includes("p50")) return allItems.find(i => i.name.includes(".50"));
  if (lowerText.includes("vest")) return allItems.find(i => i.name === "VEST");

  return null;
}

async function loadDashboard(force = false) {
  if (!supabase) return;
  const mSel = document.getElementById("dashMonth");
  const wSel = document.getElementById("dashWeek");
  const nameInput = document.getElementById("dashNameInput");
  let data = null;
  if (!force) {
    if (dashboardCache.orders) {
      data = dashboardCache.orders;
    } else {
      const stored = loadStoredDashboard();
      if (stored) {
        // Auto refresh if cache is older than 30 minutes
        const age = Date.now() - (stored.ts || 0);
        if (age < 30 * 60 * 1000) {
          data = stored.data;
          dashboardCache.orders = data;
          dashboardCache.lastFetch = stored.ts;
        }
      }
    }
    if (!data) {
      const { data: fetched, error } = await fetchOrdersSafe();
      if (error) {
        showAlert("Gagal memuat dashboard", "error");
        renderDashboard({});
        return;
      }
      data = fetched || [];
      dashboardCache.orders = data;
      dashboardCache.lastFetch = Date.now();
      saveStoredDashboard(data);
    }
  } else {
    const { data: fetched, error } = await fetchOrdersSafe();
    if (error) {
      showAlert("Gagal memuat dashboard", "error");
      return;
    }
    data = fetched || [];
    dashboardCache.orders = data;
    dashboardCache.lastFetch = Date.now();
    saveStoredDashboard(data);
  }
  updateDashNameSuggestions();
  const month = mSel ? parseInt(mSel.value, 10) : NaN;
  const weekVal = wSel ? wSel.value : "";
  const nameVal = nameInput ? nameInput.value.trim() : "";
  const nameIsAll = nameVal.toLowerCase() === "semua";
  const filtered = (data || []).filter((r) => {
    if ((r.orderanke || 0) >= 1000) return false; // Abaikan periode Drugs di dashboard Order
    const m = Math.floor((r.orderanke || 0) / 10);
    const w = (r.orderanke || 0) % 10;
    if (month && m !== month) return false;
    if (weekVal && String(w) !== String(weekVal)) return false;
    if (
      nameVal &&
      !nameIsAll &&
      String(r.nama || "").toLowerCase() !== nameVal.toLowerCase()
    )
      return false;
    return true;
  });
  let groups = groupOrdersByBatch(filtered);
  try {
    const { data: wins } = await fetchOrderWindows();
    const windows = (wins || []).filter((w) => !!w.orderanke);
    const ensureGroup = (v) => {
      const key = String(v);
      if (!groups[key]) groups[key] = { items: [], total: 0, count: 0 };
    };
    const wInt = weekVal ? parseInt(weekVal, 10) : NaN;
    if (month && !Number.isNaN(month)) {
      if (wSel && weekVal) {
        const target = month * 10 + (Number.isNaN(wInt) ? 0 : wInt);
        const exists = windows.some(
          (w) => parseInt(w.orderanke, 10) === target
        );
        if (exists) ensureGroup(target);
      } else {
        windows
          .map((w) => parseInt(w.orderanke, 10))
          .filter((v) => Math.floor(v / 10) === month)
          .forEach((v) => ensureGroup(v));
      }
    }
  } catch (e) {}
  renderDashboard(groups);
}
function loadWindows() {
  announceOpenedWindows()
    .then(() => expireOrderWindows())
    .then(() => fetchOrderWindows())
    .then(({ data, error }) => {
      if (error) {
        showAlert("Gagal memuat jadwal", "error");
        return;
      }
      renderOrderWindows(data || []);
    });
}
async function fetchOrderWindows() {
  return await supabase
    .from("order_windows")
    .select("id,orderanke,start_time,end_time,is_active")
    .order("start_time", { ascending: false });
}
async function announceOpenedWindows() {
  if (!supabase) return;
  const now = getNowIso();
  let data = null;
  let error = null;
  {
    const res = await supabase
      .from("order_windows")
      .select("id,orderanke,start_time,end_time,is_active,announced_open")
      .eq("is_active", true)
      .lte("start_time", now);
    data = res.data || null;
    error = res.error || null;
  }
  if (error && String(error.message || "").includes("announced_open")) {
    const res2 = await supabase
      .from("order_windows")
      .select("id,orderanke,start_time,end_time,is_active")
      .eq("is_active", true)
      .lte("start_time", now);
    data = res2.data || null;
    error = res2.error || null;
  }
  if (error) return;
  let announced = [];
  try {
    announced = JSON.parse(localStorage.getItem("open_announced") || "[]");
  } catch (e) {}
  const set = new Set(announced);
  for (const r of data || []) {
    if (!r || !r.id) continue;
    if (r.announced_open === true) continue;
    if (set.has(String(r.id))) continue;
    if (__openAnnounceLock.has(String(r.id))) continue;
    __openAnnounceLock.add(String(r.id));
    const v = r.orderanke || null;
    if (v && v >= 1000) {
      // Skip Discord announcement for Drugs periods
      set.add(String(r.id));
      try {
        await supabase
          .from("order_windows")
          .update({ announced_open: true })
          .eq("id", r.id);
      } catch (e) {}
      __openAnnounceLock.delete(String(r.id));
      continue;
    }
    let label = "Periode";
    let typeStr = "Orderan";
    if (v) {
      const isDrugs = v >= 1000;
      const val = isDrugs ? v - 1000 : v;
      label = `M${Math.floor(val / 10)}-W${val % 10}`;
      if (isDrugs) typeStr = "Drugs";
    }
    const start = fmtDateTime(r.start_time);
    const end = fmtDateTime(r.end_time);
    const msg = `# ${typeStr} periode ${label} dibuka dari ${start} sampai ${end}\n@here`;
    await postToDiscord(msg);
    set.add(String(r.id));
    try {
      await supabase
        .from("order_windows")
        .update({ announced_open: true })
        .eq("id", r.id);
    } catch (e) {}
    __openAnnounceLock.delete(String(r.id));
  }
  try {
    localStorage.setItem("open_announced", JSON.stringify(Array.from(set)));
  } catch (e) {}
}
async function expireOrderWindows() {
  if (!supabase) return;
  const now = getNowIso();
  let data = null;
  let error = null;
  {
    const res = await supabase
      .from("order_windows")
      .select("id,orderanke,start_time,end_time,is_active,announced_close")
      .eq("is_active", true)
      .lt("end_time", now);
    data = res.data || null;
    error = res.error || null;
  }
  if (error && String(error.message || "").includes("announced_close")) {
    const res2 = await supabase
      .from("order_windows")
      .select("id,orderanke,start_time,end_time,is_active")
      .eq("is_active", true)
      .lt("end_time", now);
    data = res2.data || null;
    error = res2.error || null;
  }
  if (error) return;
  const rows = data || [];
  const ids = rows.map((r) => r.id).filter(Boolean);
  if (!ids.length) return;
  await supabase
    .from("order_windows")
    .update({ is_active: false })
    .in("id", ids);
  let announced = [];
  try {
    announced = JSON.parse(localStorage.getItem("closed_announced") || "[]");
  } catch (e) {}
  const set = new Set(announced);
  for (const r of rows) {
    if (!r || !r.id) continue;
    if (r.announced_close === true) continue;
    if (set.has(String(r.id))) continue;
    if (__closeAnnounceLock.has(String(r.id))) continue;
    __closeAnnounceLock.add(String(r.id));
    const v = r.orderanke || null;
    if (v && v >= 1000) {
      // Skip Discord announcement for Drugs periods
      set.add(String(r.id));
      try {
        await supabase
          .from("order_windows")
          .update({ announced_close: true })
          .eq("id", r.id);
      } catch (e) {}
      __closeAnnounceLock.delete(String(r.id));
      continue;
    }
    let label = "Periode";
    let typeStr = "Orderan";
    if (v) {
      const isDrugs = v >= 1000;
      const val = isDrugs ? v - 1000 : v;
      label = `M${Math.floor(val / 10)}-W${val % 10}`;
      if (isDrugs) typeStr = "Drugs";
    }
    const start = fmtDateTime(r.start_time);
    const end = fmtDateTime(r.end_time);
    const msg = `# ${typeStr} periode ${label} telah ditutup.\nDibuka dari ${start} sampai ${end}\nDi tunggu open order selanjutnya yaa \n@here`;
    await postToDiscord(msg);
    set.add(String(r.id));
    try {
      await supabase
        .from("order_windows")
        .update({ announced_close: true })
        .eq("id", r.id);
    } catch (e) {}
    __closeAnnounceLock.delete(String(r.id));
  }
  try {
    localStorage.setItem("closed_announced", JSON.stringify(Array.from(set)));
  } catch (e) {}
}
async function hasDuplicateOrderWindow(orderanke, excludeId) {
  if (!supabase || !orderanke) return false;
  let query = supabase
    .from("order_windows")
    .select("id")
    .eq("orderanke", orderanke)
    .limit(1);
  if (excludeId) query = query.neq("id", excludeId);
  const { data, error } = await query;
  if (error) throw error;
  return Array.isArray(data) && data.length > 0;
}
async function createOrderWindow() {
  const s = document.getElementById("winStart");
  const e = document.getElementById("winEnd");
  const wm = document.getElementById("winMonth");
  const ww = document.getElementById("winWeek");
  if (!s || !e) return;
  const m = wm ? parseInt(wm.value, 10) : NaN;
  const w = ww ? parseInt(ww.value, 10) : NaN;
  const orderanke =
    !Number.isNaN(m) && !Number.isNaN(w) && m && w ? m * 10 + w : null;
  if (orderanke) {
    try {
      const duplicated = await hasDuplicateOrderWindow(
        orderanke,
        window.__editingWindowId || null
      );
      if (duplicated) {
        showAlert(
          `Periode M${m}-W${w} sudah pernah dibuat. Pilih periode lain.`,
          "error"
        );
        return;
      }
    } catch (err) {
      showAlert(
        "Gagal memvalidasi periode. Coba lagi sebentar.",
        "error"
      );
      return;
    }
  }

  const row = {
    start_time: new Date(s.value).toISOString(),
    end_time: new Date(e.value).toISOString(),
    orderanke,
    is_active: true,
  };
  if (window.__editingWindowId) {
    const { error } = await supabase
      .from("order_windows")
      .update(row)
      .eq("id", window.__editingWindowId)
      .select("id");
    if (error) {
      showAlert("Gagal mengupdate jadwal", "error");
      return;
    }
    showAlert("Jadwal diupdate", "success");
    window.__editingWindowId = null;
    const btn = document.getElementById("winCreateBtn");
    if (btn) btn.textContent = "Create";
  } else {
    const { error } = await supabase.from("order_windows").insert([row]);
    if (error) {
      showAlert("Gagal membuat jadwal", "error");
      return;
    }
    showAlert("Jadwal dibuat", "success");
  }
  loadWindows();
  if (!window.__windowsTimer) {
    window.__windowsTimer = setInterval(loadWindows, 60000);
  }
}
function renderOrderWindows(rows) {
  const body = document.getElementById("windowsTableBody");
  if (!body) return;
  const displayRows = (rows || []).filter(
    (r) => !(parseInt((r || {}).orderanke || 0, 10) >= 1000)
  );
  body.innerHTML = displayRows
    .map((r) => {
      const val = r.orderanke || null;
      const label = val
        ? `M${Math.floor(val / 10)}-W${val % 10} (#${val})`
        : "-";
      const now = Date.now();
      const st = !r.is_active
        ? "Nonaktif"
        : new Date(r.start_time).getTime() > now
          ? "Belum dimulai"
          : new Date(r.end_time).getTime() < now
            ? "Berakhir"
            : "Aktif sekarang";
      return `<tr class=\"table-row-hover\"><td class=\"px-2 py-2\">${label}</td><td class=\"px-2 py-2\">${fmtDateTime(
        r.start_time
      )}</td><td class=\"px-2 py-2\">${fmtDateTime(
        r.end_time
      )}</td><td class=\"px-2 py-2\">${st}</td><td class=\"px-2 py-2\"><div class=\"flex gap-2\"><button class=\"px-3 py-1 rounded border border-yellow-600 text-yellow-200\" data-edit-id=\"${
        r.id
      }\">Edit</button><button class=\"px-3 py-1 rounded bg-red-600 text-white\" data-del-id=\"${
        r.id
      }\">Delete</button></div></td></tr>`;
    })
    .join("");
  body.querySelectorAll("[data-edit-id]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.getAttribute("data-edit-id");
      const row = displayRows.find((x) => String(x.id) === String(id));
      if (!row) return;
      startEditWindow(row);
    });
  });
  body.querySelectorAll("[data-del-id]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const id = btn.getAttribute("data-del-id");
      await deleteOrderWindow(id);
    });
  });
}
function toLocalInput(dtIso) {
  const d = new Date(dtIso);
  const pad = (n) => String(n).padStart(2, "0");
  const y = d.getFullYear();
  const m = pad(d.getMonth() + 1);
  const day = pad(d.getDate());
  const hh = pad(d.getHours());
  const mm = pad(d.getMinutes());
  return `${y}-${m}-${day}T${hh}:${mm}`;
}
function startEditWindow(row) {
  const s = document.getElementById("winStart");
  const e = document.getElementById("winEnd");
  const wm = document.getElementById("winMonth");
  const ww = document.getElementById("winWeek");
  const btn = document.getElementById("winCreateBtn");
  if (s) s.value = toLocalInput(row.start_time);
  if (e) e.value = toLocalInput(row.end_time);
  const val = row.orderanke || 0;
  const v = val >= 1000 ? val - 1000 : val;
  const m = Math.floor(v / 10);
  const w = v % 10;
  if (wm) wm.value = m ? String(m) : "";
  if (ww) ww.value = w ? String(w) : "";
  window.__editingWindowId = row.id;
  if (btn) btn.textContent = "Update";
}
async function deleteOrderWindow(id) {
  try {
    const { data: sess } = await supabase.auth.getSession();
    const session = (sess || {}).session || null;
    if (!session) {
      showAlert("Harus login untuk menghapus", "error");
      return;
    }
  } catch (e) {
    showAlert("Gagal memeriksa sesi", "error");
    return;
  }
  const proceed = await Swal.fire({
    title: "Hapus jadwal ini?",
    text: "Tindakan tidak dapat dibatalkan.",
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#d33",
    cancelButtonColor: "#3085d6",
    confirmButtonText: "Ya, hapus",
    cancelButtonText: "Batal",
    background: "#1f1410",
    color: "#fef3c7",
  });
  if (!proceed.isConfirmed) return;

  const pin = (window && window.ADMIN_DELETE_PIN) || "";
  let ok = true;
  if (pin) {
    const { value: typed } = await Swal.fire({
      title: "Masukkan PIN delete",
      input: "password",
      inputLabel: "PIN diperlukan",
      inputPlaceholder: "Masukkan PIN",
      showCancelButton: true,
      background: "#1f1410",
      color: "#fef3c7",
    });
    ok = !!typed && typed === pin;
  } else {
    const { value: typed } = await Swal.fire({
      title: "Ketik DELETE untuk konfirmasi",
      input: "text",
      inputPlaceholder: "DELETE",
      showCancelButton: true,
      background: "#1f1410",
      color: "#fef3c7",
    });
    ok = (typed || "").toUpperCase() === "DELETE";
  }
  if (!ok) {
    showAlert("Konfirmasi hapus tidak valid", "error");
    return;
  }
  const { error } = await supabase.from("order_windows").delete().eq("id", id);
  if (error) {
    showAlert("Gagal menghapus jadwal", "error");
    return;
  }
  showAlert("Jadwal dihapus", "success");
  if (window.__editingWindowId === id) {
    window.__editingWindowId = null;
    const btn = document.getElementById("winCreateBtn");
    if (btn) btn.textContent = "Create";
  }
  loadWindows();
}
function initDashboard() {
  const mSel = document.getElementById("dashMonth");
  const wSel = document.getElementById("dashWeek");
  const nameInput = document.getElementById("dashNameInput");
  if (mSel) {
    mSel.innerHTML = Array.from(
      { length: 12 },
      (_, i) => `<option value="${i + 1}">${i + 1}</option>`
    ).join("");
    const now = new Date();
    mSel.value = String(now.getMonth() + 1);
  }
  if (wSel) {
    wSel.innerHTML =
      `<option value="">Semua</option>` +
      Array.from(
        { length: 5 },
        (_, i) => `<option value="${i + 1}">${i + 1}</option>`
      ).join("");
    wSel.value = "";
  }
  const addBtn = document.getElementById("dashAddMember");
  if (addBtn) addBtn.addEventListener("click", showAddMemberForm);
  const modal = document.getElementById("memberModal");
  const cancelBtn = document.getElementById("memberCancelBtn");
  const saveBtn = document.getElementById("memberSaveBtn");
  const modalInput = document.getElementById("memberNameInput");
  if (modal)
    modal.addEventListener("click", (e) => {
      if (e.target === modal) hideMemberModal();
    });
  if (cancelBtn) cancelBtn.addEventListener("click", hideMemberModal);
  if (saveBtn)
    saveBtn.addEventListener("click", async () => {
      const name = modalInput ? modalInput.value.trim() : "";
      if (!name) {
        showAlert("Nama member kosong", "error");
        return;
      }
      const roleEl = document.getElementById("memberRoleInput");
      const role = roleEl ? roleEl.value : "Hoodlum";
      await insertNewMember(name, role);
      hideMemberModal();
    });
  const btn = document.getElementById("refreshDashboard");
  if (btn) btn.addEventListener("click", () => loadDashboard(true));
  const shareBtn = document.getElementById("dashShareDiscord");
  if (shareBtn) shareBtn.addEventListener("click", shareDashboardToDiscord);
  const sharePaymentBtn = document.getElementById("dashSharePaymentDiscord");
  if (sharePaymentBtn)
    sharePaymentBtn.addEventListener("click", sharePaymentStatusToDiscord);
  if (mSel) mSel.addEventListener("change", () => loadDashboard(false));
  if (wSel) wSel.addEventListener("change", () => loadDashboard(false));

  setupDashNameSearch();
  updateDashNameSuggestions();
  const wm = document.getElementById("winMonth");
  const ww = document.getElementById("winWeek");
  const wl = document.getElementById("winOrderNoLabel");
  const updateWinLabel = () => {
    if (!wm || !ww || !wl) return;
    const m = parseInt(wm.value, 10) || 0;
    const w = parseInt(ww.value, 10) || 0;
    wl.value = m && w ? `M${m}-W${w} (#${m * 10 + w})` : "";
  };
  if (wm && ww) {
    const now = new Date();
    wm.value = String(now.getMonth() + 1);
    ww.value = "";
    updateWinLabel();
    wm.addEventListener("change", updateWinLabel);
    ww.addEventListener("change", updateWinLabel);
  }
  const wCreate = document.getElementById("winCreateBtn");
  const wRefresh = document.getElementById("refreshWindows");
  const wCancel = document.getElementById("winCancelBtn");
  const wAnnounce = document.getElementById("winAnnounceBtn");
  if (wCreate) wCreate.addEventListener("click", createOrderWindow);
  if (wRefresh) wRefresh.addEventListener("click", loadWindows);
  if (wCancel)
    wCancel.addEventListener("click", () => {
      window.__editingWindowId = null;
      const btn = document.getElementById("winCreateBtn");
      if (btn) btn.textContent = "Create";
      const s = document.getElementById("winStart");
      const e = document.getElementById("winEnd");
      const wm = document.getElementById("winMonth");
      const ww = document.getElementById("winWeek");
      if (s) s.value = "";
      if (e) e.value = "";
      if (wm) wm.value = "";
      if (ww) ww.value = "";
      const wl = document.getElementById("winOrderNoLabel");
      if (wl) wl.value = "";
    });
  if (wAnnounce) wAnnounce.addEventListener("click", announceOrderWindow);
  const mSel2 = document.getElementById("dashMonth");
  const wSel2 = document.getElementById("dashWeek");
  if (mSel2 && wSel2) {
    fetchActiveOrderWindow(null).then((win) => {
      const v = win && win.orderanke ? parseInt(win.orderanke, 10) : NaN;
      if (!Number.isNaN(v) && v) {
        const m = Math.floor(v / 10);
        const w = v % 10;
        mSel2.value = String(m);
        wSel2.value = String(w);
      }
      loadDashboard(true);
    });
  } else {
    loadDashboard(true);
  }
  loadWindows();
}
async function addMemberFromDashboard() {
  if (!supabase) return;
  const input = document.getElementById("dashNameInput");
  const v = input ? input.value.trim() : "";
  if (!v) {
    showAlert("Nama member kosong", "error");
    return;
  }
  const { data: exists } = await supabase
    .from("members")
    .select("id,nama")
    .eq("nama", v)
    .limit(1);
  if (exists && exists.length) {
    showAlert("Member sudah ada", "error");
    return;
  }
  const { error } = await supabase
    .from("members")
    .insert([{ nama: v }])
    .select("id");
  if (error) {
    showAlert("Gagal menambah member", "error");
    return;
  }
  showAlert("Member berhasil ditambah", "success");
  updateDashNameSuggestions();
  loadDashboard(true);
}

function showAddMemberForm() {
  const modal = document.getElementById("memberModal");
  const input = document.getElementById("memberNameInput");
  const roleEl = document.getElementById("memberRoleInput");
  if (!modal || !input) return;
  input.value = "";
  if (roleEl) roleEl.value = "Hoodlum";
  modal.classList.remove("hidden");
  loadMemberListInModal();
  setTimeout(() => input.focus(), 0);
}

function hideMemberModal() {
  const modal = document.getElementById("memberModal");
  if (modal) modal.classList.add("hidden");
}

async function insertNewMember(name, role) {
  if (!isAdminMember(window.__currentMember || null)) {
    showAlert("Hanya Admin yang bisa menambah member", "error");
    return;
  }
  if (!supabase) return;
  const { data: exists } = await supabase
    .from("members")
    .select("id,nama")
    .eq("nama", name)
    .limit(1);
  if (exists && exists.length) {
    showAlert("Member sudah ada", "error");
    return;
  }
  const { data: inserted, error } = await supabase
    .from("members")
    .insert([{ nama: name, role: role }])
    .select("id");
  if (error) {
    showAlert("Gagal menambah member", "error");
    return;
  }
  const memberId = (inserted || [])[0] ? (inserted || [])[0].id : null;
  // hideMemberModal();
  document.getElementById("memberNameInput").value = "";
  loadMemberListInModal();
  const input = document.getElementById("dashNameInput");
  if (input) input.value = name;
  showAlert("Member berhasil ditambah", "success");
  updateDashNameSuggestions();
  loadDashboard(true);
}
async function announceOrderWindow() {
  try {
    let target = null;
    if (supabase) target = await fetchActiveOrderWindow(null);
    let label = "";
    let start = "";
    let end = "";
    if (target) {
      const v = parseInt(target.orderanke, 10);
      const m = Math.floor(v / 10);
      const w = v % 10;
      label = `M${m}-W${w}`;
      start = fmtDateTime(target.start_time);
      end = fmtDateTime(target.end_time);
    } else {
      const s = document.getElementById("winStart");
      const e = document.getElementById("winEnd");
      const wm = document.getElementById("winMonth");
      const ww = document.getElementById("winWeek");
      const m = wm ? parseInt(wm.value, 10) : NaN;
      const w = ww ? parseInt(ww.value, 10) : NaN;
      if (
        !Number.isNaN(m) &&
        !Number.isNaN(w) &&
        s &&
        e &&
        s.value &&
        e.value
      ) {
        label = `M${m}-W${w}`;
        start = fmtDateTime(new Date(s.value).toISOString());
        end = fmtDateTime(new Date(e.value).toISOString());
      }
    }
    if (!label || !start || !end) {
      showAlert("Data jadwal tidak lengkap", "error");
      return;
    }
    const msg = `# Orderan periode ${label} dibuka dari ${start} sampai ${end} \n@here`;
    await postToDiscord(msg);
    try {
      if (target && target.id) {
        await supabase
          .from("order_windows")
          .update({ announced_open: true })
          .eq("id", target.id);
        const arr = JSON.parse(localStorage.getItem("open_announced") || "[]");
        const s = new Set(arr);
        s.add(String(target.id));
        localStorage.setItem("open_announced", JSON.stringify(Array.from(s)));
      }
    } catch (e) {}
    showAlert("Announcement dikirim ke Discord", "success");
  } catch (e) {
    showAlert("Gagal mengirim announcement", "error");
  }
}
async function shareDashboardToDiscord() {
  if (!supabase) return;
  const mSel = document.getElementById("dashMonth");
  const wSel = document.getElementById("dashWeek");
  const nameInput = document.getElementById("dashNameInput");
  const month = mSel ? parseInt(mSel.value, 10) : NaN;
  const weekVal = wSel ? wSel.value : "";
  const nameVal = nameInput ? nameInput.value.trim() : "";
  const nameIsAll = nameVal.toLowerCase() === "semua";
  let data = dashboardCache.orders;
  if (!data) {
    const { data: fetched, error } = await fetchOrders();
    if (error) {
      showAlert("Gagal memuat data", "error");
      return;
    }
    data = fetched || [];
    dashboardCache.orders = data;
  }
  const filtered = (data || []).filter((r) => {
    const m = Math.floor((r.orderanke || 0) / 10);
    const w = (r.orderanke || 0) % 10;
    if (month && m !== month) return false;
    if (weekVal && String(w) !== String(weekVal)) return false;
    if (
      nameVal &&
      !nameIsAll &&
      String(r.nama || "").toLowerCase() !== nameVal.toLowerCase()
    )
      return false;
    return true;
  });
  if (!filtered.length) {
    showAlert("Tidak ada data untuk dikirim", "error");
    return;
  }
  const groups = groupOrdersByBatch(filtered);
  const keys = Object.keys(groups).sort(
    (a, b) => parseInt(a, 10) - parseInt(b, 10)
  );
  const lines = [];
  lines.push("Total Qty per Item");
  if (month) {
    if (weekVal) {
      lines.push(`Periode: M${month}-W${weekVal}`);
    } else {
      lines.push(`Periode: M${month}`);
    }
  }
  if (nameVal && !nameIsAll) lines.push(`Nama: ${nameVal}`);
  const groupTotals = {
    "ORDER KE HIGH TABEL": 0,
    "ORDER KE ALLSTAR": 0,
    "ORDER KE BOA": 0,
    "ORDER KE BURGENK": 0,
    "ORDER KE PP": 0,
    LAINNYA: 0,
  };
  keys.forEach((k) => {
    const g = groups[k];
    const m = Math.floor(parseInt(k, 10) / 10);
    const w = parseInt(k, 10) % 10;
    lines.push("");
    lines.push(`Batch M${m}-W${w}`);
    const summary = summarizeItems(g.items);
    const priceMap = buildPriceMap(g.items);
    const groupedMap = {};
    summary.forEach((s) => {
      const grp = assignGroupForItem(s.item);
      (groupedMap[grp] ||= []).push(s);
    });
    GROUP_ORDER.forEach((grp) => {
      const rows = sortRowsByGroupOrder(groupedMap[grp] || [], grp);
      if (!rows.length) return;
      lines.push("");
      lines.push(grp);
      const itemsWithPrice = rows.map((r) => {
        const unit = priceMap[r.item] ?? getCatalogPrice(r.item) ?? 0;
        const sub = unit * r.qty;
        return {
          item: r.item,
          qty: r.qty,
          unit,
          unitFmt: fmt(unit),
          sub,
          subFmt: fmt(sub),
        };
      });
      const itemW = Math.max(
        "Item".length,
        ...itemsWithPrice.map((x) => x.item.length)
      );
      const qtyW = Math.max(
        "Qty".length,
        ...itemsWithPrice.map((x) => String(x.qty).length)
      );
      const hargaW = Math.max(
        "Harga".length,
        ...itemsWithPrice.map((x) => x.unitFmt.length)
      );
      const subW = Math.max(
        "Subtotal".length,
        ...itemsWithPrice.map((x) => x.subFmt.length)
      );
      const header =
        "Item".padEnd(itemW) +
        " | " +
        "Qty".padStart(qtyW) +
        " | " +
        "Harga".padStart(hargaW) +
        " | " +
        "Subtotal".padStart(subW);
      const sep =
        "-".repeat(itemW) +
        "-+-" +
        "-".repeat(qtyW) +
        "-+-" +
        "-".repeat(hargaW) +
        "-+-" +
        "-".repeat(subW);
      lines.push(header);
      lines.push(sep);
      let totalGrp = 0;
      itemsWithPrice.forEach((x) => {
        totalGrp += x.sub;
        lines.push(
          x.item.padEnd(itemW) +
            " | " +
            String(x.qty).padStart(qtyW) +
            " | " +
            x.unitFmt.padStart(hargaW) +
            " | " +
            x.subFmt.padStart(subW)
        );
      });
      const label = "Total : ".padEnd(itemW + 3 + qtyW + 3 + hargaW);
      lines.push(label + " | " + fmt(totalGrp).padStart(subW));

      const gKey = Object.keys(groupTotals).find(
        (k) => k.trim().toUpperCase() === grp.trim().toUpperCase()
      );
      if (gKey) {
        groupTotals[gKey] += totalGrp;
      }
    });
  });

  const summaryGroups = [
    "ORDER KE HIGH TABEL",
    "ORDER KE ALLSTAR",
    "ORDER KE BOA",
    "ORDER KE BURGENK",
    "ORDER KE PP",
    "LAINNYA",
  ];

  lines.push("");
  lines.push("Ringkasan Total Orderan");
  summaryGroups.forEach((gname) => {
    lines.push(`${gname}: ${fmt(groupTotals[gname] || 0)}`);
  });
  const msg = "```\n" + lines.join("\n") + "\n```";
  await postToDiscord(msg);
  showAlert("Ringkasan dikirim ke Discord", "success");
}

async function sharePaymentStatusToDiscord() {
  if (!supabase) return;
  const hook = getOrderPaymentWebhookUrl();
  if (!hook) {
    showAlert("Webhook status bayar belum diisi", "error");
    return;
  }

  const mSel = document.getElementById("dashMonth");
  const wSel = document.getElementById("dashWeek");
  const nameInput = document.getElementById("dashNameInput");
  const month = mSel ? parseInt(mSel.value, 10) : NaN;
  const weekVal = wSel ? wSel.value : "";
  const nameVal = nameInput ? nameInput.value.trim() : "";
  const nameIsAll = nameVal.toLowerCase() === "semua";

  let data = dashboardCache.orders;
  if (!data) {
    const { data: fetched, error } = await fetchOrdersSafe(5000);
    if (error) {
      showAlert("Gagal memuat data", "error");
      return;
    }
    data = fetched || [];
    dashboardCache.orders = data;
  }

  const filtered = (data || []).filter((r) => {
    const m = Math.floor((r.orderanke || 0) / 10);
    const w = (r.orderanke || 0) % 10;
    if (month && m !== month) return false;
    if (weekVal && String(w) !== String(weekVal)) return false;
    if (
      nameVal &&
      !nameIsAll &&
      String(r.nama || "").toLowerCase() !== nameVal.toLowerCase()
    ) {
      return false;
    }
    return true;
  });

  if (!filtered.length) {
    showAlert("Tidak ada data pembayaran untuk dikirim", "error");
    return;
  }

  const paidPeople = getPaidPersonSet();
  const grouped = {};
  filtered.forEach((r) => {
    const batch = r.orderanke || 0;
    const name = String(r.nama || "Unknown");
    const key = makePersonStatusKey(batch, name);
    if (!grouped[key]) {
      grouped[key] = {
        batch,
        name,
        qty: 0,
        total: 0,
        rows: [],
      };
    }
    grouped[key].qty += r.qty || 0;
    grouped[key].total += r.subtotal || 0;
    grouped[key].rows.push(r);
  });

  const entries = Object.values(grouped)
    .map((g) => {
      const paidDb = g.rows.length ? g.rows.every((x) => !!x.paid) : false;
      const paid =
        paidDb || paidPeople.has(makePersonStatusKey(g.batch, g.name));
      return { ...g, paid };
    })
    .sort((a, b) => {
      if ((b.batch || 0) !== (a.batch || 0))
        return (b.batch || 0) - (a.batch || 0);
      if (a.paid !== b.paid) return a.paid ? -1 : 1;
      return a.name.localeCompare(b.name);
    });

  const paidEntries = entries.filter((x) => x.paid);
  const unpaidEntries = entries.filter((x) => !x.paid);

  const fmtBatch = (batch) => {
    if (!batch) return "-";
    const { m, w, raw } = decodeOrderanke(parseInt(batch, 10));
    return `M${m}-W${w} (#${raw})`;
  };
  const makeSection = (title, rows) => {
    const totalQty = rows.reduce((sum, r) => sum + (r.qty || 0), 0);
    const totalMoney = rows.reduce((sum, r) => sum + (r.total || 0), 0);
    if (!rows.length) {
      return [
        `### ${title}`,
        `> Orang: 0 • Item: 0 • Total: ${fmt(0)}`,
        "",
        "_Tidak ada data_",
      ].join("\n");
    }
    const entriesText = rows.map((r) => {
      const periodText = singleBatchLabel ? "" : ` • ${fmtBatch(r.batch)}`;
      return {
        label: `${r.name}${periodText}`,
        total: fmt(r.total),
      };
    });
    const maxLabel = entriesText.reduce(
      (max, r) => Math.max(max, r.label.length),
      4
    );
    const maxTotal = entriesText.reduce(
      (max, r) => Math.max(max, r.total.length),
      5
    );
    const allNames = [
      "```yaml",
      ...entriesText.map(
        (r) => `${r.label.padEnd(maxLabel)} : ${r.total.padStart(maxTotal)}`
      ),
      "```",
    ].join("\n");
    return [
      `### ${title}`,
      `> Orang: ${rows.length} • Item: ${fmtNumber(totalQty)} • Total: ${fmt(totalMoney)}`,
      "",
      allNames,
    ]
      .filter(Boolean)
      .join("\n");
  };

  const batchLabels = Array.from(
    new Set(entries.map((x) => fmtBatch(x.batch)))
  );
  const singleBatchLabel = batchLabels.length === 1 ? batchLabels[0] : "";
  const periodText = singleBatchLabel
    ? singleBatchLabel
    : batchLabels.length > 1
      ? batchLabels.join(", ")
      : month
        ? weekVal
          ? `M${month}-W${weekVal}`
          : `M${month}`
        : "-";
  const message = [
    "## Status Pembayaran Order Senjata",
    `> 🗓️ Periode: ${periodText}`,
    nameVal && !nameIsAll ? `> 👤 Nama: ${nameVal}` : "",
    "",
    makeSection("✅ Sudah Bayar", paidEntries),
    "",
    makeSection("❌ Belum Bayar", unpaidEntries),
  ]
    .filter(Boolean)
    .join("\n");

  await postToDiscord(message, hook);
  showAlert("Status bayar dikirim ke Discord", "success");
}
function showAlert(message, type = "info") {
  // SweetAlert2 Implementation
  if (typeof Swal !== "undefined") {
    const icons = {
      success: "success",
      error: "error",
      warning: "warning",
      info: "info",
    };

    Swal.fire({
      text: message,
      icon: icons[type] || "info",
      toast: true,
      position: "top-end",
      showConfirmButton: false,
      timer: 3000,
      timerProgressBar: true,
      background: "#1a0f0a",
      color: "#fef3c7",
      iconColor:
        type === "success"
          ? "#fbbf24"
          : type === "error"
            ? "#ef4444"
            : "#eab308",
      customClass: {
        popup:
          "rage-modal-popup border-amber-500/30 shadow-2xl rounded-2xl p-4",
      },
      didOpen: (toast) => {
        toast.onmouseenter = Swal.stopTimer;
        toast.onmouseleave = Swal.resumeTimer;
      },
    });
    return;
  }

  const box = document.getElementById("appAlertBox");
  if (!box) {
    alert(message);
    return;
  }
  const base = "px-4 py-2 rounded-lg text-white shadow-lg";
  const color =
    type === "success"
      ? "bg-green-600"
      : type === "error"
        ? "bg-red-600"
        : "bg-yellow-600";
  box.className = `${base} ${color}`;
  box.textContent = message;
  box.classList.remove("hidden");
  box.style.opacity = "1";
  setTimeout(() => {
    box.style.opacity = "0";
    box.classList.add("hidden");
  }, 3000);
}
function fmtDateTime(iso) {
  try {
    const d = new Date(iso);
    const pad = (n) => String(n).padStart(2, "0");
    const dd = pad(d.getDate());
    const mm = pad(d.getMonth() + 1);
    const yyyy = d.getFullYear();
    const HH = pad(d.getHours());
    const MM = pad(d.getMinutes());
    return `${dd}/${mm}/${yyyy}, ${HH}:${MM}`;
  } catch (e) {
    return iso;
  }
}

async function loadMemberListInModal() {
  const list = document.getElementById("memberList");
  const countBadge = document.getElementById("memberCountBadge");
  if (!list) return;
  list.innerHTML =
    '<tr><td colspan="3" class="text-center p-8 text-slate-500 animate-pulse">Loading...</td></tr>';

  const { data, error } = await supabase
    .from("members")
    .select("id,nama,role")
    .order("nama", { ascending: true });

  if (error || !data) {
    list.innerHTML =
      '<tr><td colspan="3" class="text-center p-8 text-red-500">Gagal memuat member</td></tr>';
    if (countBadge) countBadge.innerText = "0";
    return;
  }

  if (countBadge) countBadge.innerText = data.length;

  if (data.length === 0) {
    list.innerHTML =
      '<tr><td colspan="3" class="text-center p-8 text-slate-500">Belum ada member</td></tr>';
    return;
  }

  list.innerHTML = data
    .map((m) => {
      // Role logic
      const roles = [
        "Internship",
        "Hangaround",
        "Hoodlum",
        "Highrank",
        "Admin",
      ];
      const currentRole = m.role || "Hoodlum";

      // Style logic
      let btnClass = "";
      let dotClass = "";

      if (currentRole === "Admin") {
        btnClass =
          "bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100 dark:bg-purple-500/10 dark:text-purple-300 dark:border-purple-500/20 dark:hover:bg-purple-500/20";
        dotClass = "bg-purple-500";
      } else if (currentRole === "Highrank") {
        btnClass =
          "bg-red-50 text-red-700 border-red-200 hover:bg-red-100 dark:bg-red-500/10 dark:text-red-300 dark:border-red-500/20 dark:hover:bg-red-500/20";
        dotClass = "bg-red-500";
      } else if (currentRole === "Hoodlum") {
        btnClass =
          "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100 dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-500/20 dark:hover:bg-amber-500/20";
        dotClass = "bg-amber-500";
      } else if (currentRole === "Hangaround") {
        btnClass =
          "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100 dark:bg-blue-500/10 dark:text-blue-300 dark:border-blue-500/20 dark:hover:bg-blue-500/20";
        dotClass = "bg-blue-500";
      } else {
        btnClass =
          "bg-green-50 text-green-700 border-green-200 hover:bg-green-100 dark:bg-green-500/10 dark:text-green-300 dark:border-green-500/20 dark:hover:bg-green-500/20";
        dotClass = "bg-green-500";
      }

      return `
    <tr class="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors group border-b border-transparent last:border-0">
      <td class="px-5 py-3 font-medium text-slate-700 dark:text-slate-200">
        ${m.nama}
      </td>
      <td class="px-5 py-3 relative">
        <div class="relative role-dropdown-container">
            <button data-role-trigger="${m.id}" onclick="toggleRoleDropdown('${m.id}')" 
                class="w-36 px-3 py-1.5 rounded-lg border ${btnClass} text-xs font-bold flex items-center justify-between transition-all shadow-sm group/btn">
                <div class="flex items-center gap-2">
                    <span class="w-2 h-2 rounded-full ${dotClass}"></span>
                    <span>${currentRole}</span>
                </div>
                <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3 opacity-60 group-hover/btn:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                </svg>
            </button>
            
            <div id="dropdown-${m.id}" class="role-dropdown-menu hidden w-40 bg-white dark:bg-[#1a1410] rounded-xl border border-slate-200 dark:border-[#3d342d] shadow-xl overflow-hidden ring-1 ring-black/5 dark:ring-white/10 origin-top-left animate-in fade-in zoom-in-95 duration-100">
                <div class="py-1">
                    ${roles
                      .map((r) => {
                        let dot = "bg-slate-400";
                        if (r === "Admin") dot = "bg-purple-500";
                        if (r === "Highrank") dot = "bg-red-500";
                        if (r === "Hoodlum") dot = "bg-amber-500";
                        if (r === "Hangaround") dot = "bg-blue-500";
                        if (r === "Internship") dot = "bg-green-500";

                        const isActive = r === currentRole;
                        const activeClass = isActive
                          ? "bg-slate-50 dark:bg-white/5"
                          : "";

                        return `
                        <button onclick="selectMemberRole('${m.id}', '${r}')" 
                            class="w-full text-left px-3 py-2 text-xs font-medium hover:bg-slate-50 dark:hover:bg-white/5 transition-colors flex items-center gap-3 ${activeClass} text-slate-700 dark:text-slate-300">
                            <span class="w-2 h-2 rounded-full ${dot} ${isActive ? "ring-2 ring-offset-1 ring-slate-200 dark:ring-offset-black dark:ring-slate-700" : ""}"></span>
                            ${r}
                            ${isActive ? '<svg class="w-3 h-3 ml-auto text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>' : ""}
                        </button>
                        `;
                      })
                      .join("")}
                </div>
            </div>
        </div>
      </td>
      <td class="px-5 py-3 text-right">
        <button class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800 dark:hover:bg-red-900/40 transition-all text-xs font-medium ml-auto shadow-sm" onclick="deleteMember('${m.id}', '${m.nama.replace(/'/g, "\\'")}')" title="Hapus Member">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
          <span>Hapus</span>
        </button>
      </td>
    </tr>
  `;
    })
    .join("");
}

// Global functions for custom dropdown
const ROLE_DROPDOWN_LAYER_ID = "roleDropdownLayer";

function getRoleDropdownLayer() {
  let layer = document.getElementById(ROLE_DROPDOWN_LAYER_ID);
  if (layer) return layer;

  layer = document.createElement("div");
  layer.id = ROLE_DROPDOWN_LAYER_ID;
  layer.className = "fixed inset-0 z-[250] pointer-events-none";
  layer.innerHTML = '<div class="role-dropdown-floating pointer-events-auto hidden"></div>';
  document.body.appendChild(layer);
  return layer;
}

function closeRoleDropdownLayer() {
  const layer = document.getElementById(ROLE_DROPDOWN_LAYER_ID);
  if (!layer) return;
  const floating = layer.querySelector(".role-dropdown-floating");
  if (!floating) return;
  floating.classList.add("hidden");
  floating.innerHTML = "";
}

window.toggleRoleDropdown = function (id) {
  const floatingId = `floating-dropdown-${id}`;
  const layer = getRoleDropdownLayer();
  const floating = layer.querySelector(".role-dropdown-floating");
  if (floating && floating.getAttribute("data-current-id") === id && !floating.classList.contains("hidden")) {
    closeRoleDropdownLayer();
    if (window.event) window.event.stopPropagation();
    return;
  }
  
  document
    .querySelectorAll(".role-dropdown-menu")
    .forEach((d) => d.classList.add("hidden"));
  closeRoleDropdownLayer();

  const trigger = document.querySelector(`[data-role-trigger="${id}"]`);
  const dropdown = document.getElementById(`dropdown-${id}`);
  if (dropdown && trigger && floating) {
    const rect = trigger.getBoundingClientRect();
    const width = Math.max(160, Math.round(rect.width));

    floating.id = floatingId;
    floating.setAttribute("data-current-id", id);
    floating.className =
      "role-dropdown-floating pointer-events-auto absolute bg-white dark:bg-[#1a1410] rounded-xl border border-slate-200 dark:border-[#3d342d] shadow-xl overflow-hidden ring-1 ring-black/5 dark:ring-white/10 origin-top-left animate-in fade-in zoom-in-95 duration-100";
    floating.style.minWidth = `${width}px`;
    floating.style.width = `${width}px`;
    floating.style.maxWidth = "220px";
    floating.style.left = `${Math.max(8, Math.min(rect.left, window.innerWidth - width - 8))}px`;
    floating.style.top = `${Math.min(rect.bottom + 8, window.innerHeight - 8)}px`;
    floating.innerHTML = dropdown.innerHTML;
    floating.classList.remove("hidden");
  }

  // Stop propagation to prevent immediate closing
  if (window.event) window.event.stopPropagation();
};

window.selectMemberRole = function (id, role) {
  updateMemberRole(id, role);
  const dropdown = document.getElementById(`dropdown-${id}`);
  if (dropdown) dropdown.classList.add("hidden");
  closeRoleDropdownLayer();
  if (window.event) window.event.stopPropagation();
};

// Close dropdowns when clicking outside
window.addEventListener("click", function (e) {
  if (
    !e.target.closest(".role-dropdown-container") &&
    !e.target.closest(".role-dropdown-floating")
  ) {
    document
      .querySelectorAll(".role-dropdown-menu")
      .forEach((d) => d.classList.add("hidden"));
    closeRoleDropdownLayer();
  }
});

window.filterMembers = function () {
  const input = document.getElementById("memberSearchInput");
  const filter = input.value.toUpperCase();
  const list = document.getElementById("memberList");
  const tr = list.getElementsByTagName("tr");

  for (let i = 0; i < tr.length; i++) {
    const td = tr[i].getElementsByTagName("td")[0];
    if (td) {
      const txtValue = td.textContent || td.innerText;
      if (txtValue.toUpperCase().indexOf(filter) > -1) {
        tr[i].style.display = "";
      } else {
        tr[i].style.display = "none";
      }
    }
  }
};

window.updateMemberRole = async function (id, newRole) {
  if (!isAdminMember(window.__currentMember || null)) {
    showAlert("Hanya Admin yang bisa mengubah role", "error");
    loadMemberListInModal();
    return;
  }
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) {
    showAlert("Harus login untuk mengubah role", "error");
    loadMemberListInModal(); // Reset select to previous value
    return;
  }

  const { error } = await supabase
    .from("members")
    .update({ role: newRole })
    .eq("id", id);

  if (error) {
    showAlert("Gagal mengubah role: " + error.message, "error");
    loadMemberListInModal(); // Reset on error
  } else {
    showAlert("Role berhasil diupdate", "success");
    // Clear cache agar perubahan role langsung terdeteksi saat order
    if (window.__memberRoleCache) delete window.__memberRoleCache[id];
  }
};

window.deleteMember = async function (id, name) {
  if (!isAdminMember(window.__currentMember || null)) {
    showAlert("Hanya Admin yang bisa menghapus member", "error");
    return;
  }
  try {
    // 0. Check session
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) {
      showAlert("Harus login untuk menghapus member", "error");
      return;
    }

    const memberId = parseInt(String(id || ""), 10);
    if (Number.isNaN(memberId) || !memberId) {
      showAlert("ID member tidak valid", "error");
      return;
    }

    const [
      { count: orderCount, error: orderCountErr },
      { count: storanCount, error: storanCountErr },
      { count: drugsCount, error: drugsCountErr },
    ] = await Promise.all([
      supabase
        .from("orders")
        .select("*", { count: "exact", head: true })
        .eq("member_id", memberId),
      supabase
        .from("storan_logs")
        .select("*", { count: "exact", head: true })
        .eq("member_id", memberId),
      supabase
        .from("drugs_sales")
        .select("*", { count: "exact", head: true })
        .eq("member_id", memberId),
    ]);

    if (orderCountErr || storanCountErr || drugsCountErr) {
      showAlert("Gagal cek data member (permission/RLS)", "error");
      return;
    }

    const orderCountSafe = orderCount || 0;
    const storanCountSafe = storanCount || 0;
    const drugsCountSafe = drugsCount || 0;

    let confirmMsg = `Yakin ingin menghapus member "${name}"?`;
    const parts = [];
    if (orderCountSafe > 0) parts.push(`${orderCountSafe} history order`);
    if (storanCountSafe > 0) parts.push(`${storanCountSafe} log storan`);
    if (drugsCountSafe > 0) parts.push(`${drugsCountSafe} data drugs`);
    if (parts.length) {
      confirmMsg =
        `Member "${name}" memiliki:\n` +
        parts.map((p) => `- ${p}`).join("\n") +
        `\n\nMenghapus member ini akan MENGHAPUS SEMUA data tersebut.\n\nApakah Anda yakin ingin melanjutkan?`;
    }

    const result = await Swal.fire({
      title: "Konfirmasi Hapus",
      text: confirmMsg,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Ya, hapus",
      cancelButtonText: "Batal",
      background: "#1f1410",
      color: "#fef3c7",
    });

    if (!result.isConfirmed) return;

    const deletions = [
      { table: "orders", label: "history order" },
      { table: "storan_logs", label: "log storan" },
      { table: "drugs_sales", label: "data drugs" },
    ];
    for (const d of deletions) {
      const { error: delErr } = await supabase
        .from(d.table)
        .delete()
        .eq("member_id", memberId);
      if (delErr) {
        showAlert(`Gagal menghapus ${d.label}: ` + delErr.message, "error");
        return;
      }
      const { count: remain, error: remainErr } = await supabase
        .from(d.table)
        .select("*", { count: "exact", head: true })
        .eq("member_id", memberId);
      if (remainErr) {
        showAlert(
          `Gagal verifikasi hapus ${d.label} (permission/RLS)`,
          "error"
        );
        return;
      }
      if ((remain || 0) > 0) {
        let extra = "";
        try {
          const { data: sample } = await supabase
            .from(d.table)
            .select("id,waktu,nama,penerima")
            .eq("member_id", memberId)
            .order("waktu", { ascending: false })
            .limit(1);
          const s = (sample || [])[0] || null;
          if (s && s.id) {
            const w = s.waktu ? fmtDateTime(s.waktu) : "";
            const n = s.nama ? String(s.nama) : "";
            extra = ` (contoh row id: ${s.id}${n ? `, nama: ${n}` : ""}${
              w ? `, waktu: ${w}` : ""
            })`;
          }
        } catch (e) {}
        showAlert(
          `Tidak bisa menghapus ${d.label} (sisa ${remain}). Cek RLS/policy atau hapus manual di Supabase${extra}.`,
          "error"
        );
        return;
      }
    }

    // 3. Delete member
    const { error } = await supabase
      .from("members")
      .delete()
      .eq("id", memberId);

    if (error) {
      showAlert(
        "Gagal menghapus member dari database: " + error.message,
        "error"
      );
    } else {
      // 4. Double check deletion
      const { count: checkCount } = await supabase
        .from("members")
        .select("*", { count: "exact", head: true })
        .eq("id", memberId);

      if (checkCount === 0) {
        showAlert("Member dan datanya berhasil dihapus permanen.", "success");
        loadMemberListInModal();
        updateDashNameSuggestions();
        loadDashboard(true);
      } else {
        showAlert(
          "Gagal: Member masih ada di database. Cek permission/RLS.",
          "error"
        );
      }
    }
  } catch (e) {
    showAlert("Gagal menjalankan hapus member (runtime error)", "error");
  }
};

// --- DRUGS SECTION ---
let currentDrugsBatch = null;
let drugsSalesHasJenisJumlah = null;

async function initDrugs(member) {
  console.log("Initializing Drugs section...");

  try {
    const win = await fetchActiveOrderWindow(null, "drugs");
    if (win && win.orderanke) {
      currentDrugsBatch = parseInt(win.orderanke, 10);
      const display = document.getElementById("currentBatchDisplay");
      if (display) {
        const { m, w, raw } = decodeOrderanke(currentDrugsBatch);
        display.textContent = `Batch Drugs M${m}-W${w} (#${raw})`;
      }
    } else {
      const display = document.getElementById("currentBatchDisplay");
      if (display) display.textContent = "Tidak ada batch aktif";
    }
  } catch (e) {
    console.error("Gagal ambil periode drugs:", e);
  }

  const adminMode = isAdminMember(member);
  if (adminMode) {
    setupDrugsNameSearch();
    updateDrugsNameValidity();
    const nameInput = document.getElementById("drugsNama");
    const hidden = document.getElementById("drugsMemberId");
    const status = document.getElementById("drugsNamaStatus");
    if (nameInput) {
      nameInput.disabled = false;
      nameInput.value = "";
    }
    if (hidden) hidden.value = "";
    if (status) {
      status.textContent = "Pilih nama anggota dari database";
      status.classList.remove("text-green-500");
      status.classList.add("text-red-500");
    }
  } else if (member && member.id) {
    applyCurrentMemberToDrugsUI(member);
  } else {
    setupDrugsNameSearch();
    updateDrugsNameValidity();
    const submitBtn0 = document.getElementById("submitDrugs");
    if (submitBtn0) submitBtn0.disabled = true;
    showAlert(
      "Akun kamu belum terhubung ke data member. Hubungkan dulu di tabel members.",
      "error"
    );
  }
  await checkDrugsSalesJenisJumlahSchema();
  loadDrugsTable();

  const duitMerahInput = document.getElementById("duitMerah");
  const estimasiGajiEl = document.getElementById("estimasiGaji");
  const submitBtn = document.getElementById("submitDrugs");
  const cancelEditBtn = document.getElementById("cancelDrugsEdit");
  const refreshBtn = document.getElementById("refreshDrugs");
  const batchFilter = document.getElementById("drugsBatchFilter");
  const addBatchBtn = document.getElementById("addBatchBtn");
  const sendTotalsBtn = document.getElementById("sendDrugsTotals");
  const setActiveBatchBtn = document.getElementById("setActiveBatchBtn");
  const isAdmin = isAdminMember(window.__currentMember || null);

  if (duitMerahInput && estimasiGajiEl) {
    duitMerahInput.addEventListener("input", () => {
      const val = parseFloat(duitMerahInput.value) || 0;
      const gaji = val * 0.35 * 0.65;
      estimasiGajiEl.textContent = fmt(gaji);
    });
  }

  if (submitBtn) {
    submitBtn.addEventListener("click", submitDrugsData);
  }
  if (cancelEditBtn) {
    cancelEditBtn.addEventListener("click", () =>
      resetDrugsForm(window.__currentMember || null)
    );
  }

  if (refreshBtn) {
    refreshBtn.addEventListener("click", () => loadDrugsTable());
  }

  if (batchFilter) {
    batchFilter.addEventListener("change", () => loadDrugsTable());
  }

  if (addBatchBtn) {
    if (isAdmin) addBatchBtn.addEventListener("click", openCreateBatchModal);
    else addBatchBtn.classList.add("hidden");
  }
  if (sendTotalsBtn) {
    if (isAdmin)
      sendTotalsBtn.addEventListener("click", sendDrugsTotalsToDiscord);
    else sendTotalsBtn.classList.add("hidden");
  }
  if (setActiveBatchBtn) {
    if (isAdmin)
      setActiveBatchBtn.addEventListener(
        "click",
        openSelectActiveDrugsBatchModal
      );
    else setActiveBatchBtn.classList.add("hidden");
  }
}

function setDrugsFormMode(isEditing) {
  const label = document.getElementById("submitDrugsLabel");
  const cancelBtn = document.getElementById("cancelDrugsEdit");
  if (label) label.textContent = isEditing ? "Update Data" : "Simpan Data";
  if (cancelBtn) cancelBtn.classList.toggle("hidden", !isEditing);
}

function resetDrugsForm(member) {
  const currentMember = member || window.__currentMember || null;
  const adminMode = isAdminMember(currentMember);
  const nameEl = document.getElementById("drugsNama");
  const memberIdEl = document.getElementById("drugsMemberId");
  const editIdEl = document.getElementById("drugsEditId");
  const editBatchEl = document.getElementById("drugsEditBatch");
  const statusEl = document.getElementById("drugsNamaStatus");
  const jenisEl = document.getElementById("drugsJenis");
  const jumlahEl = document.getElementById("drugsJumlah");
  const duitEl = document.getElementById("duitMerah");
  const estimasiEl = document.getElementById("estimasiGaji");
  if (editIdEl) editIdEl.value = "";
  if (editBatchEl) editBatchEl.value = "";
  if (jenisEl) jenisEl.value = "Weed";
  if (jumlahEl) jumlahEl.value = "";
  if (duitEl) duitEl.value = "";
  if (estimasiEl) estimasiEl.textContent = "$ 0";
  if (adminMode) {
    if (nameEl) nameEl.value = "";
    if (memberIdEl) memberIdEl.value = "";
    if (statusEl) {
      statusEl.textContent = "Pilih nama anggota dari database";
      statusEl.classList.remove("text-green-500");
      statusEl.classList.add("text-red-500");
    }
  } else {
    applyCurrentMemberToDrugsUI(currentMember);
  }
  setDrugsFormMode(false);
}

function startEditDrugsRow(row) {
  const nameEl = document.getElementById("drugsNama");
  const memberIdEl = document.getElementById("drugsMemberId");
  const editIdEl = document.getElementById("drugsEditId");
  const editBatchEl = document.getElementById("drugsEditBatch");
  const jenisEl = document.getElementById("drugsJenis");
  const jumlahEl = document.getElementById("drugsJumlah");
  const duitEl = document.getElementById("duitMerah");
  const estimasiEl = document.getElementById("estimasiGaji");
  const statusEl = document.getElementById("drugsNamaStatus");
  if (nameEl) nameEl.value = String(row.nama || "");
  if (memberIdEl) memberIdEl.value = row.member_id ? String(row.member_id) : "";
  if (editIdEl) editIdEl.value = row.primaryId ? String(row.primaryId) : "";
  if (editBatchEl)
    editBatchEl.value = row.periode_orderanke
      ? String(row.periode_orderanke)
      : "";
  if (jenisEl) jenisEl.value = String(row.jenis || "Weed");
  if (jumlahEl) jumlahEl.value = String(parseFloat(row.jumlah) || 0);
  if (duitEl) duitEl.value = String(parseFloat(row.uang_merah) || 0);
  if (estimasiEl)
    estimasiEl.textContent = fmt(
      (parseFloat(row.uang_merah) || 0) * 0.35 * 0.65
    );
  if (statusEl) {
    statusEl.textContent = "Mode edit data drugs";
    statusEl.classList.remove("text-red-500");
    statusEl.classList.add("text-green-500");
  }
  setDrugsFormMode(true);
}

async function checkDrugsSalesJenisJumlahSchema() {
  if (drugsSalesHasJenisJumlah !== null) return drugsSalesHasJenisJumlah;
  if (!supabase) {
    drugsSalesHasJenisJumlah = false;
    return drugsSalesHasJenisJumlah;
  }
  const { error } = await supabase
    .from("drugs_sales")
    .select("jenis,jumlah")
    .limit(1);
  if (
    error &&
    String(error.message || "")
      .toLowerCase()
      .includes("column")
  ) {
    drugsSalesHasJenisJumlah = false;
    showAlert(
      "Kolom 'jenis' & 'jumlah' belum ada di database (drugs_sales). Tambahkan dulu di Supabase supaya tampil di riwayat.",
      "warning"
    );
    return drugsSalesHasJenisJumlah;
  }
  drugsSalesHasJenisJumlah = true;
  return drugsSalesHasJenisJumlah;
}

async function openSelectActiveDrugsBatchModal() {
  if (!isAdminMember(window.__currentMember || null)) {
    showAlert("Hanya Admin yang bisa mengatur periode drugs", "error");
    return;
  }
  if (!supabase) {
    showAlert("Supabase tidak terhubung", "error");
    return;
  }

  const { data, error } = await supabase
    .from("order_windows")
    .select("id,orderanke,start_time,end_time,is_active")
    .gte("orderanke", 1000)
    .order("start_time", { ascending: false })
    .limit(50);

  if (error) {
    showAlert("Gagal memuat periode drugs: " + error.message, "error");
    return;
  }

  const rows = (data || []).filter((r) => r && r.id && r.orderanke);
  if (!rows.length) {
    showAlert("Belum ada periode drugs", "error");
    return;
  }

  const inputOptions = {};
  rows.forEach((r) => {
    const { m, w, raw } = decodeOrderanke(parseInt(r.orderanke, 10));
    const active = r.is_active ? " (aktif)" : "";
    inputOptions[String(r.id)] = `M${m}-W${w} (#${raw})${active}`;
  });

  const current = rows.find(
    (r) =>
      parseInt(r.orderanke || 0, 10) === parseInt(currentDrugsBatch || 0, 10)
  );
  const res = await Swal.fire({
    title: "Atur Periode Aktif Drugs",
    input: "select",
    inputOptions,
    inputValue: current ? String(current.id) : String(rows[0].id),
    showCancelButton: true,
    confirmButtonText: "Aktifkan",
    showDenyButton: true,
    denyButtonText: "Hapus",
    cancelButtonText: "Batal",
    customClass: {
      popup: "rage-modal-popup",
      title: "rage-modal-title",
      confirmButton: "rage-modal-confirm",
      denyButton: "rage-modal-confirm !bg-red-600",
      cancelButton: "rage-modal-cancel",
      input: "rage-modal-input",
    },
    inputValidator: (v) => (!v ? "Pilih periode" : undefined),
    preConfirm: () => {
      const el = Swal.getInput();
      return el ? el.value : "";
    },
    preDeny: () => {
      const el = Swal.getInput();
      return el ? el.value : "";
    },
  });

  const pickedId = res.value;
  if (!pickedId) return;

  const picked = rows.find((r) => String(r.id) === String(pickedId));
  if (!picked) {
    showAlert("Periode tidak ditemukan", "error");
    return;
  }

  if (res.isDenied) {
    const confirm = await Swal.fire({
      title: "Hapus periode drugs ini?",
      text: "Data periode dan semua pencatatan drugs di periode ini akan dihapus permanen.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Lanjut",
      cancelButtonText: "Batal",
      customClass: {
        popup: "rage-modal-popup",
        title: "rage-modal-title",
        confirmButton: "rage-modal-confirm !bg-red-600",
        cancelButton: "rage-modal-cancel",
      },
    });
    if (!confirm.isConfirmed) return;

    const pin = (window && window.ADMIN_DELETE_PIN) || "";
    let ok = true;
    if (pin) {
      const { value: typed } = await Swal.fire({
        title: "Masukkan PIN delete",
        input: "password",
        inputLabel: "PIN diperlukan",
        inputPlaceholder: "Masukkan PIN",
        showCancelButton: true,
        confirmButtonText: "Konfirmasi",
        cancelButtonText: "Batal",
        customClass: {
          popup: "rage-modal-popup",
          title: "rage-modal-title",
          confirmButton: "rage-modal-confirm !bg-red-600",
          cancelButton: "rage-modal-cancel",
          input: "rage-modal-input",
        },
      });
      ok = !!typed && typed === pin;
    } else {
      const { value: typed } = await Swal.fire({
        title: "Ketik DELETE untuk konfirmasi",
        input: "text",
        inputPlaceholder: "DELETE",
        showCancelButton: true,
        confirmButtonText: "Konfirmasi",
        cancelButtonText: "Batal",
        customClass: {
          popup: "rage-modal-popup",
          title: "rage-modal-title",
          confirmButton: "rage-modal-confirm !bg-red-600",
          cancelButton: "rage-modal-cancel",
          input: "rage-modal-input",
        },
      });
      ok = (typed || "").toUpperCase() === "DELETE";
    }
    if (!ok) {
      showAlert("Konfirmasi hapus tidak valid", "error");
      return;
    }

    const periodeOrderanke = parseInt(picked.orderanke || 0, 10);
    if (periodeOrderanke) {
      const { error: delSalesErr } = await supabase
        .from("drugs_sales")
        .delete()
        .eq("periode_orderanke", periodeOrderanke);
      if (delSalesErr) {
        showAlert(
          "Gagal menghapus data drugs: " + delSalesErr.message,
          "error"
        );
        return;
      }
    }

    const { error: delWinErr } = await supabase
      .from("order_windows")
      .delete()
      .eq("id", picked.id);
    if (delWinErr) {
      showAlert("Gagal menghapus periode: " + delWinErr.message, "error");
      return;
    }

    if (parseInt(currentDrugsBatch || 0, 10) === periodeOrderanke) {
      currentDrugsBatch = null;
      const display = document.getElementById("currentBatchDisplay");
      if (display) display.textContent = "Tidak ada batch aktif";
    }

    showAlert("Periode drugs berhasil dihapus", "success");
    loadDrugsTable();
    return;
  }

  const now = new Date();
  const startOld = new Date(picked.start_time);
  const endOld = new Date(picked.end_time);
  const startNew = startOld.getTime() > now.getTime() ? now : startOld;
  const endNew =
    endOld.getTime() < now.getTime()
      ? new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
      : endOld;

  await supabase
    .from("order_windows")
    .update({ is_active: false })
    .eq("is_active", true)
    .gte("orderanke", 1000);

  const { error: upErr } = await supabase
    .from("order_windows")
    .update({
      is_active: true,
      start_time: startNew.toISOString(),
      end_time: endNew.toISOString(),
    })
    .eq("id", picked.id);

  if (upErr) {
    showAlert("Gagal mengaktifkan periode: " + upErr.message, "error");
    return;
  }

  currentDrugsBatch = parseInt(picked.orderanke, 10);
  const display = document.getElementById("currentBatchDisplay");
  if (display) {
    const { m, w, raw } = decodeOrderanke(currentDrugsBatch);
    display.textContent = `Batch Drugs M${m}-W${w} (#${raw})`;
  }
  const filter = document.getElementById("drugsBatchFilter");
  if (filter) filter.value = "current";
  showAlert("Periode drugs aktif berhasil diubah", "success");
  loadDrugsTable();
}

async function openCreateBatchModal() {
  if (!isAdminMember(window.__currentMember || null)) {
    showAlert("Hanya Admin yang bisa membuat batch drugs", "error");
    return;
  }
  const currentVal = currentDrugsBatch ? currentDrugsBatch - 1000 : null;
  const { value: formValues } = await Swal.fire({
    title: "Tambah Batch Drugs Baru",
    html:
      '<div class="flex flex-col gap-5 py-2">' +
      '  <div class="flex flex-col text-left gap-2">' +
      '    <label class="text-[10px] font-black text-amber-500/50 uppercase tracking-[0.2em] ml-1">Bulan (M)</label>' +
      '    <input id="swal-month" type="number" class="swal2-input rage-modal-input" placeholder="Contoh: 2" value="' +
      (currentVal ? Math.floor(currentVal / 10) : "") +
      '">' +
      "  </div>" +
      '  <div class="flex flex-col text-left gap-2">' +
      '    <label class="text-[10px] font-black text-amber-500/50 uppercase tracking-[0.2em] ml-1">Minggu (W)</label>' +
      '    <input id="swal-week" type="number" class="swal2-input rage-modal-input" placeholder="Contoh: 4" value="' +
      (currentVal ? (currentVal % 10) + 1 : "") +
      '">' +
      "  </div>" +
      '  <div class="p-4 bg-amber-500/5 border border-amber-500/10 text-amber-200/60 text-[11px] rounded-xl text-left italic leading-relaxed">' +
      "    *Batch Drugs dipisahkan dari sistem Orderan. Membuat batch baru hanya akan menutup batch Drugs aktif sebelumnya." +
      "  </div>" +
      "</div>",
    focusConfirm: false,
    showCancelButton: true,
    confirmButtonText: "Buat Batch",
    cancelButtonText: "Batal",
    reverseButtons: true,
    customClass: {
      popup: "rage-modal-popup",
      title: "rage-modal-title",
      confirmButton: "rage-modal-confirm",
      cancelButton: "rage-modal-cancel",
    },
    preConfirm: () => {
      return [
        document.getElementById("swal-month").value,
        document.getElementById("swal-week").value,
      ];
    },
  });

  if (formValues) {
    const m = parseInt(formValues[0], 10);
    const w = parseInt(formValues[1], 10);

    if (isNaN(m) || isNaN(w) || m < 1 || w < 1) {
      showAlert("Bulan dan Minggu harus diisi angka valid", "error");
      return;
    }

    const orderanke = 1000 + (m * 10 + w);
    try {
      const duplicated = await hasDuplicateOrderWindow(orderanke);
      if (duplicated) {
        showAlert(`Batch Drugs M${m}-W${w} sudah pernah dibuat`, "error");
        return;
      }
    } catch (err) {
      showAlert(
        "Gagal memvalidasi batch drugs. Coba lagi sebentar.",
        "error"
      );
      return;
    }
    const now = new Date();
    const end = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // Default 7 hari

    // 1. Close only active DRUGS windows
    if (supabase) {
      await supabase
        .from("order_windows")
        .update({ is_active: false })
        .eq("is_active", true)
        .gte("orderanke", 1000);

      // 2. Insert new one
      const { error } = await supabase.from("order_windows").insert({
        orderanke,
        start_time: now.toISOString(),
        end_time: end.toISOString(),
        is_active: true,
      });

      if (error) {
        showAlert("Gagal membuat batch: " + error.message, "error");
      } else {
        showAlert(`Batch Drugs M${m}-W${w} berhasil dimulai!`, "success");
        initDrugs(window.__currentMember || null); // Refresh current display
      }
    }
  }
}

function setupDrugsNameSearch() {
  const input = document.getElementById("drugsNama");
  const dd = document.getElementById("drugsNamaDropdown");
  const hidden = document.getElementById("drugsMemberId");
  if (!input || !dd || !hidden) return;

  let active = -1;
  const render = (items) => {
    dd.innerHTML = items
      .map(
        (r, i) =>
          `<div class="px-4 py-2.5 cursor-pointer hover:bg-amber-500/20 border-b border-white/5 last:border-0 transition ${
            i === active ? "bg-amber-500/30" : ""
          }" data-id="${r.id}" data-name="${r.nama}">${r.nama}</div>`
      )
      .join("");
    dd.classList.toggle("hidden", items.length === 0);

    dd.querySelectorAll("[data-id]").forEach((el) =>
      el.addEventListener("mousedown", (e) => {
        input.value = e.currentTarget.getAttribute("data-name");
        hidden.value = e.currentTarget.getAttribute("data-id");
        dd.classList.add("hidden");
        updateDrugsNameValidity();
      })
    );
  };

  const run = debounce(async (term) => {
    if (!supabase) return;
    let q;
    if (term)
      q = supabase
        .from("members")
        .select("id,nama")
        .ilike("nama", `%${term}%`)
        .order("nama", { ascending: true })
        .limit(20);
    else
      q = supabase
        .from("members")
        .select("id,nama")
        .order("nama", { ascending: true })
        .limit(20);

    const { data, error } = await q;
    if (error) return;
    active = -1;
    render(data || []);
  }, 200);

  input.addEventListener("input", (e) => {
    hidden.value = "";
    updateDrugsNameValidity();
    run(e.target.value.trim());
  });
  input.addEventListener("focus", () => run(""));
  input.addEventListener("click", () => run(input.value.trim()));
  input.addEventListener("keydown", (e) => {
    const items = Array.from(dd.querySelectorAll("[data-id]"));
    if (!items.length) return;
    if (e.key === "ArrowDown") {
      active = Math.min(items.length - 1, active + 1);
      e.preventDefault();
    } else if (e.key === "ArrowUp") {
      active = Math.max(0, active - 1);
      e.preventDefault();
    } else if (e.key === "Enter" && active >= 0) {
      input.value = items[active].getAttribute("data-name");
      hidden.value = items[active].getAttribute("data-id");
      dd.classList.add("hidden");
      updateDrugsNameValidity();
    } else if (e.key === "Escape") {
      dd.classList.add("hidden");
    }
    items.forEach((el, i) =>
      el.classList.toggle("bg-amber-500/30", i === active)
    );
  });
  input.addEventListener("blur", () =>
    setTimeout(() => dd.classList.add("hidden"), 200)
  );
}

function updateDrugsNameValidity() {
  const hidden = document.getElementById("drugsMemberId");
  const status = document.getElementById("drugsNamaStatus");
  const v = hidden ? parseInt(hidden.value || "", 10) : NaN;
  const ok = !Number.isNaN(v) && !!v;
  if (status) {
    status.textContent = ok ? "Nama valid" : "Pilih nama dari database";
    status.classList.toggle("text-green-500", ok);
    status.classList.toggle("text-red-500", !ok);
  }
}

async function submitDrugsData() {
  const currentMember = window.__currentMember || null;
  const adminMode = isAdminMember(currentMember);
  const memberIdRaw = document.getElementById("drugsMemberId").value;
  const editIdRaw = (document.getElementById("drugsEditId") || {}).value || "";
  const editBatchRaw =
    (document.getElementById("drugsEditBatch") || {}).value || "";
  const editingId = String(editIdRaw || "").trim();
  const memberId =
    !adminMode && currentMember && currentMember.id
      ? parseInt(String(currentMember.id), 10)
      : parseInt(memberIdRaw || "", 10);
  const nama =
    !adminMode && currentMember && currentMember.nama
      ? String(currentMember.nama)
      : document.getElementById("drugsNama").value.trim();
  const duitMerah = parseFloat(document.getElementById("duitMerah").value) || 0;
  const jenis = (document.getElementById("drugsJenis") || {}).value || "";
  const jumlah =
    parseInt((document.getElementById("drugsJumlah") || {}).value || "0", 10) ||
    0;

  if (!nama) {
    showAlert("Pilih nama anggota terlebih dahulu", "error");
    return;
  }
  if (Number.isNaN(memberId) || !memberId) {
    showAlert("Akun belum terhubung ke member", "error");
    return;
  }
  const memberIdEl = document.getElementById("drugsMemberId");
  if (memberIdEl && !Number.isNaN(memberId) && memberId)
    memberIdEl.value = String(memberId);
  const nameEl = document.getElementById("drugsNama");
  if (!adminMode && nameEl && currentMember && currentMember.nama)
    nameEl.value = String(currentMember.nama);
  if (!jenis) {
    showAlert("Pilih jenis jualan (Weed/Meth/Opium)", "error");
    return;
  }
  if (jumlah <= 0) {
    showAlert("Masukkan jumlah terjual yang valid", "error");
    return;
  }
  const targetBatch =
    parseInt(editBatchRaw || "", 10) || currentDrugsBatch || 0;
  if (!targetBatch) {
    showAlert("Tidak ada batch drugs aktif", "error");
    return;
  }

  if (!supabase) {
    showAlert("Supabase tidak terhubung", "error");
    return;
  }

  await checkDrugsSalesJenisJumlahSchema();

  // Rumus:
  // Gaji Putih = (duit merah * 35%) * 65%
  // Uang RAGE = (duit merah * 65%) * 65%
  const upahPutih = duitMerah > 0 ? duitMerah * 0.35 * 0.65 : 0;
  const uangRage = duitMerah > 0 ? duitMerah * 0.65 * 0.65 : 0;

  const nowIso = new Date().toISOString();
  if (editingId) {
    let updatePayload = {
      member_id: memberId,
      nama,
      uang_merah: duitMerah,
      upah_putih: upahPutih,
      uang_rage: uangRage,
      periode_orderanke: targetBatch,
      waktu: nowIso,
      jenis,
      jumlah,
    };
    let { error } = await supabase
      .from("drugs_sales")
      .update(updatePayload)
      .eq("id", editingId);
    if (
      error &&
      String(error.message || "")
        .toLowerCase()
        .includes("column")
    ) {
      updatePayload = {
        member_id: memberId,
        nama,
        uang_merah: duitMerah,
        upah_putih: upahPutih,
        uang_rage: uangRage,
        periode_orderanke: targetBatch,
        waktu: nowIso,
      };
      const res2 = await supabase
        .from("drugs_sales")
        .update(updatePayload)
        .eq("id", editingId);
      error = res2.error || null;
    }
    if (error) {
      showAlert("Gagal update data: " + error.message, "error");
      return;
    }
    showAlert("Data drugs berhasil diupdate", "success");
    await sendDrugsEntryToDiscord({
      nama,
      periode_orderanke: targetBatch,
      jenis,
      jumlahTotal: jumlah,
      duitMerahDelta: duitMerah,
      upahPutihDelta: upahPutih,
      uangRageDelta: uangRage,
      duitMerahTotal: duitMerah,
      upahPutihTotal: upahPutih,
      uangRageTotal: uangRage,
      waktu: nowIso,
      mode: "edit",
    });
    resetDrugsForm(currentMember);
    loadDrugsTable();
    return;
  }
  let existing = null;
  try {
    const { data: exData, error: exErr } = await supabase
      .from("drugs_sales")
      .select("id,uang_merah,upah_putih,uang_rage,waktu,jenis,jumlah")
      .eq("periode_orderanke", targetBatch)
      .eq("member_id", memberId)
      .eq("jenis", jenis)
      .order("waktu", { ascending: false })
      .limit(1);
    if (
      exErr &&
      String(exErr.message || "")
        .toLowerCase()
        .includes("column")
    ) {
      const { data: exData2 } = await supabase
        .from("drugs_sales")
        .select("id,uang_merah,upah_putih,uang_rage,waktu")
        .eq("periode_orderanke", targetBatch)
        .eq("member_id", memberId)
        .order("waktu", { ascending: false })
        .limit(1);
      existing = (exData2 || [])[0] || null;
    } else {
      existing = (exData || [])[0] || null;
    }
  } catch (e) {}

  if (existing && existing.id) {
    const nextUangMerah = (parseFloat(existing.uang_merah) || 0) + duitMerah;
    const nextUpahPutih = (parseFloat(existing.upah_putih) || 0) + upahPutih;
    const nextUangRage = (parseFloat(existing.uang_rage) || 0) + uangRage;
    const nextJumlah = (parseFloat(existing.jumlah) || 0) + jumlah;
    let updatePayload = {
      uang_merah: nextUangMerah,
      upah_putih: nextUpahPutih,
      uang_rage: nextUangRage,
      waktu: nowIso,
      jumlah: nextJumlah,
      jenis,
    };
    let { error } = await supabase
      .from("drugs_sales")
      .update(updatePayload)
      .eq("id", existing.id);
    if (
      error &&
      String(error.message || "")
        .toLowerCase()
        .includes("column")
    ) {
      updatePayload = {
        uang_merah: nextUangMerah,
        upah_putih: nextUpahPutih,
        uang_rage: nextUangRage,
        waktu: nowIso,
      };
      const res2 = await supabase
        .from("drugs_sales")
        .update(updatePayload)
        .eq("id", existing.id);
      error = res2.error || null;
    }
    if (error) {
      console.error("Gagal update data drugs:", error);
      showAlert("Gagal menyimpan data: " + error.message, "error");
      return;
    }
    showAlert("Data ditambahkan ke total batch (nama sama)", "success");
    await sendDrugsEntryToDiscord({
      nama,
      periode_orderanke: targetBatch,
      jenis,
      jumlahTotal: nextJumlah,
      duitMerahDelta: duitMerah,
      upahPutihDelta: upahPutih,
      uangRageDelta: uangRage,
      duitMerahTotal: nextUangMerah,
      upahPutihTotal: nextUpahPutih,
      uangRageTotal: nextUangRage,
      waktu: nowIso,
      mode: "update",
    });
  } else {
    let insertPayload = {
      member_id: memberId,
      nama: nama,
      uang_merah: duitMerah,
      upah_putih: upahPutih,
      uang_rage: uangRage,
      periode_orderanke: targetBatch,
      waktu: nowIso,
      jenis,
      jumlah,
    };
    let { error } = await supabase.from("drugs_sales").insert(insertPayload);
    if (
      error &&
      String(error.message || "")
        .toLowerCase()
        .includes("column")
    ) {
      insertPayload = {
        member_id: memberId,
        nama: nama,
        uang_merah: duitMerah,
        upah_putih: upahPutih,
        uang_rage: uangRage,
        periode_orderanke: targetBatch,
        waktu: nowIso,
      };
      const res2 = await supabase.from("drugs_sales").insert(insertPayload);
      error = res2.error || null;
    }
    if (error) {
      console.error("Gagal simpan data drugs:", error);
      showAlert("Gagal menyimpan data: " + error.message, "error");
      return;
    }
    showAlert("Data penjualan drugs berhasil disimpan", "success");
    await sendDrugsEntryToDiscord({
      nama,
      periode_orderanke: targetBatch,
      jenis,
      jumlahTotal: jumlah,
      duitMerahDelta: duitMerah,
      upahPutihDelta: upahPutih,
      uangRageDelta: uangRage,
      duitMerahTotal: duitMerah,
      upahPutihTotal: upahPutih,
      uangRageTotal: uangRage,
      waktu: nowIso,
      mode: "insert",
    });
  }

  if (adminMode) {
    resetDrugsForm(currentMember);
  } else {
    resetDrugsForm(currentMember);
  }
  loadDrugsTable();
}

async function sendDrugsEntryToDiscord(payload) {
  const hook =
    (window && window.DISCORD_DRUGS_WEBHOOK_URL) ||
    (window && window.DISCORD_WEBHOOK_URL) ||
    "";
  if (!hook) return;

  try {
    const periode =
      payload && payload.periode_orderanke
        ? decodeOrderanke(parseInt(payload.periode_orderanke, 10))
        : null;
    const periodeLabel = periode
      ? `M${periode.m}-W${periode.w} (#${periode.raw})`
      : "-";
    const ts =
      payload && payload.waktu ? payload.waktu : new Date().toISOString();

    const modeLabel =
      payload && payload.mode === "edit"
        ? "UPDATE DATA"
        : payload && payload.mode === "update"
          ? "TAMBAH KE TOTAL"
          : "INPUT BARU";

    let modeColor = 0xfbbf24; // yellow-400 (Input Baru)
    if (payload.mode === "edit")
      modeColor = 0x3b82f6; // blue-500 (Update Data)
    else if (payload.mode === "update") modeColor = 0x8b5cf6; // violet-500 (Tambah Total)

    let modeText = "INPUT BARU";
    if (payload.mode === "edit") modeText = "UPDATE DATA";
    else if (payload.mode === "update") modeText = "TAMBAH TOTAL";

    const desc = `\`Nama   :\` **${payload.nama || "-"}**
\`Jenis  :\` **${payload.jenis || "-"}**
\`Jumlah :\` **${payload.jumlahTotal != null ? fmtNumber(payload.jumlahTotal) : "-"} items**`;

    const embed = {
      author: { name: `Laporan Penjualan Drugs  —  ${modeText}` },
      color: modeColor,
      description: desc,
      fields: [
        {
          name: "🔴  Duit Merah",
          value: `\`\`\`diff\n- ${fmt(payload.duitMerahTotal || 0)}\n\`\`\``,
          inline: false,
        },
        {
          name: "🟢  Gaji Putih",
          value: `\`\`\`diff\n+ ${fmt(payload.upahPutihTotal || 0)}\n\`\`\``,
          inline: false,
        },
      ],
      footer: { text: `Periode: ${periodeLabel}` },
      timestamp: ts,
    };

    await postToDiscordEmbed(embed, hook);
  } catch (e) {
    showAlert("Data tersimpan, tapi gagal kirim ke Discord", "warning");
  }
}

async function sendDrugsTotalsToDiscord() {
  const hook = (window && window.DISCORD_DRUGS_WEBHOOK_URL) || "";
  if (!hook) {
    showAlert("DISCORD_DRUGS_WEBHOOK_URL belum diisi", "error");
    return;
  }
  if (!supabase) {
    showAlert("Supabase tidak terhubung", "error");
    return;
  }
  if (!currentDrugsBatch) {
    showAlert("Tidak ada batch drugs aktif", "error");
    return;
  }

  const confirm = await Swal.fire({
    title: "Kirim total gaji batch ini?",
    text: "Ini akan mengirim rangkuman total per nama untuk batch aktif.",
    icon: "question",
    showCancelButton: true,
    confirmButtonText: "Kirim",
    cancelButtonText: "Batal",
    customClass: {
      popup: "rage-modal-popup",
      title: "rage-modal-title",
      confirmButton: "rage-modal-confirm",
      cancelButton: "rage-modal-cancel",
    },
  });
  if (!confirm.isConfirmed) return;

  const { data, error } = await supabase
    .from("drugs_sales")
    .select("*")
    .eq("periode_orderanke", currentDrugsBatch)
    .order("nama", { ascending: true });
  if (error) {
    showAlert("Gagal memuat data: " + error.message, "error");
    return;
  }

  const map = new Map();
  (data || []).forEach((r) => {
    const key = String(r.member_id || r.nama || "-");
    const prev = map.get(key) || {
      nama: r.nama || "-",
      uang_merah: 0,
      upah_putih: 0,
      uang_rage: 0,
      waktu: null,
    };
    prev.uang_merah += parseFloat(r.uang_merah) || 0;
    prev.upah_putih += parseFloat(r.upah_putih) || 0;
    prev.uang_rage += parseFloat(r.uang_rage) || 0;
    if (
      !prev.waktu ||
      new Date(r.waktu).getTime() > new Date(prev.waktu).getTime()
    ) {
      prev.waktu = r.waktu;
    }
    map.set(key, prev);
  });

  const periode = decodeOrderanke(parseInt(currentDrugsBatch, 10));

  let desc = "Berikut adalah total gaji karyawan untuk batch ini:\n";
  desc += "```yaml\n";
  desc += "NAMA               GAJI PUTIH \n";
  desc += "------------------------------\n";

  Array.from(map.values())
    .sort((a, b) => String(a.nama).localeCompare(String(b.nama)))
    .forEach((r) => {
      const n = String(r.nama).padEnd(16, " ");
      const g = String(fmt(r.upah_putih)).padStart(12, " ");
      desc += `${n} : ${g}\n`;
    });
  desc += "```";

  const embed = {
    author: { name: `R.A.G.E DRUGS PAYROLL  —  M${periode.m}-W${periode.w}` },
    color: 0x10b981, // Emerald-500
    description: desc,
    footer: { text: `ID Periode: #${periode.raw}` },
    timestamp: new Date().toISOString(),
  };

  try {
    await postToDiscordEmbed(embed, hook);
    showAlert("Total batch terkirim ke Discord", "success");
  } catch (e) {
    showAlert("Gagal mengirim ke Discord", "error");
  }
}

async function loadDrugsTable() {
  if (!supabase) return;
  const body = document.getElementById("drugsTableBody");
  const empty = document.getElementById("drugsEmptyState");
  const filter = document.getElementById("drugsBatchFilter");
  if (!body) return;

  body.innerHTML =
    '<tr><td colspan="9" class="px-4 py-8 text-center text-slate-400">Memuat data...</td></tr>';

  let query = supabase
    .from("drugs_sales")
    .select("*")
    .gte("periode_orderanke", 1000) // Hanya ambil data Drugs
    .order("waktu", { ascending: false });

  if (filter && filter.value === "current" && currentDrugsBatch) {
    query = query.eq("periode_orderanke", currentDrugsBatch);
  }

  const { data, error } = await query.limit(50);

  if (error) {
    body.innerHTML = `<tr><td colspan="9" class="px-4 py-8 text-center text-red-400">Gagal memuat data: ${error.message}</td></tr>`;
    return;
  }

  if (!data || data.length === 0) {
    body.innerHTML = "";
    empty.classList.remove("hidden");
    return;
  }

  empty.classList.add("hidden");
  const grouped = new Map();
  (data || []).forEach((r) => {
    const key = `${r.member_id || r.nama || "-"}|${r.periode_orderanke || ""}|${r.jenis || ""}`;
    const prev = grouped.get(key) || {
      ids: [],
      primaryId: r.id || null,
      member_id: r.member_id || null,
      nama: r.nama || "-",
      periode_orderanke: r.periode_orderanke || null,
      jenis: r.jenis || "",
      jumlah: 0,
      uang_merah: 0,
      upah_putih: 0,
      uang_rage: 0,
      waktu: null,
      is_paid: r.is_paid || false,
    };
    prev.ids.push(r.id);
    prev.jumlah += parseFloat(r.jumlah) || 0;
    prev.uang_merah += parseFloat(r.uang_merah) || 0;
    prev.upah_putih += parseFloat(r.upah_putih) || 0;
    prev.uang_rage += parseFloat(r.uang_rage) || 0;
    // If grouped, use the latest is_paid status or handle as needed
    if (r.is_paid) prev.is_paid = true;
    if (
      !prev.waktu ||
      new Date(r.waktu).getTime() > new Date(prev.waktu).getTime()
    ) {
      prev.waktu = r.waktu;
    }
    grouped.set(key, prev);
  });

  const rows = Array.from(grouped.values()).sort(
    (a, b) =>
      new Date(b.waktu || 0).getTime() - new Date(a.waktu || 0).getTime()
  );

  body.innerHTML = rows
    .map((r) => {
      let periodeStr = "";
      if (r.periode_orderanke) {
        const { m, w } = decodeOrderanke(r.periode_orderanke);
        periodeStr = `<span class="block text-[10px] text-slate-500 uppercase">M${m}-W${w}</span>`;
      }
      const ids = (r.ids || []).filter(Boolean).map(String).join(",");
      return `
      <tr class="hover:bg-white/5 transition-colors">
        <td class="px-4 py-3 font-medium text-amber-900 dark:text-amber-100">
          ${r.nama}
          ${periodeStr}
        </td>
        <td class="px-4 py-3">${r.jenis || "-"}</td>
        <td class="px-4 py-3">${r.jumlah ? fmtNumber(r.jumlah) : "-"}</td>
        <td class="px-4 py-3">${fmt(r.uang_merah)}</td>
        <td class="px-4 py-3 text-green-600 dark:text-green-400 font-semibold">${fmt(r.upah_putih)}</td>
        <td class="px-4 py-3 text-blue-600 dark:text-blue-400">${fmt(r.uang_rage)}</td>
        <td class="px-4 py-3 text-xs text-slate-400">${fmtDateTime(r.waktu)}</td>
        <td class="px-4 py-3 text-center">
          <button data-toggle-drugs-paid="${r.primaryId}" data-ids="${ids}" data-current="${r.is_paid}" 
            class="badge ${r.is_paid ? 'badge-green' : 'badge-red'} hover:scale-105 transition-transform cursor-pointer">
            ${r.is_paid ? 'LUNAS' : 'BELUM'}
          </button>
        </td>
        <td class="px-4 py-3 text-center">
          <div class="flex items-center justify-center gap-2">
            <button data-toggle-drugs-paid="${r.primaryId}" data-ids="${ids}" data-current="${r.is_paid}"
              class="px-3 py-1 rounded ${r.is_paid ? "bg-slate-700/20 text-slate-300 border border-slate-700/30 hover:bg-slate-700/30" : "bg-green-700/20 text-green-400 border border-green-700/30 hover:bg-green-700/30"} text-[10px] font-bold uppercase transition">
              ${r.is_paid ? "Batal" : "Bayar"}
            </button>
            <button class="px-3 py-1 rounded bg-amber-600/20 text-amber-300 border border-amber-600/30 text-[10px] font-bold uppercase hover:bg-amber-600/30 transition ${r.ids.length > 1 ? "opacity-50 cursor-not-allowed" : ""}" ${r.ids.length > 1 ? "disabled" : ""} data-edit-drugs-row="${r.primaryId || ""}">
              Edit
            </button>
            <button class="px-3 py-1 rounded bg-red-700/20 text-red-400 border border-red-700/30 text-[10px] font-bold uppercase hover:bg-red-700/40 transition" data-del-drugs-ids="${ids}">
              Hapus
            </button>
          </div>
        </td>
      </tr>
    `;
    })
    .join("");

  body.querySelectorAll("[data-edit-drugs-row]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = String(btn.getAttribute("data-edit-drugs-row") || "").trim();
      const row = rows.find((r) => String(r.primaryId || "").trim() === id);
      if (!row) return;
      if ((row.ids || []).length > 1) {
        showAlert(
          "Data gabungan lama belum bisa diedit langsung. Hapus lalu input ulang jika perlu.",
          "warning"
        );
        return;
      }
      startEditDrugsRow(row);
      const nameInput = document.getElementById("drugsNama");
      if (nameInput)
        nameInput.scrollIntoView({ behavior: "smooth", block: "center" });
    });
  });

  body.querySelectorAll("[data-del-drugs-ids]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const raw = btn.getAttribute("data-del-drugs-ids") || "";
      const ids = raw
        .split(",")
        .map((x) => x.trim())
        .filter(Boolean);
      if (!ids.length) return;

      const result = await Swal.fire({
        title: "Hapus data ini?",
        text: "Data gaji drugs akan dihapus permanen!",
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Ya, hapus!",
        cancelButtonText: "Batal",
        customClass: {
          popup: "rage-modal-popup",
          title: "rage-modal-title",
          confirmButton: "rage-modal-confirm !bg-red-600",
          cancelButton: "rage-modal-cancel",
        },
      });

      if (result.isConfirmed) {
        const { error } = await supabase
          .from("drugs_sales")
          .delete()
          .in("id", ids);
        if (error) {
          showAlert("Gagal menghapus: " + error.message, "error");
        } else {
          showAlert("Data berhasil dihapus", "success");
          loadDrugsTable();
        }
      }
    });
  });

  body.querySelectorAll("[data-toggle-drugs-paid]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const id = btn.getAttribute("data-toggle-drugs-paid");
      const current = btn.getAttribute("data-current") === "true";
      const rawIds = btn.getAttribute("data-ids") || "";
      const ids = rawIds
        .split(",")
        .map((x) => x.trim())
        .filter(Boolean);
      await toggleDrugsPaidStatus(ids.length ? ids : id, !current);
    });
  });
}

async function toggleDrugsPaidStatus(idsOrId, nextStatus) {
  if (!supabase || !idsOrId) return;
  const ids = Array.isArray(idsOrId)
    ? idsOrId.map((x) => String(x).trim()).filter(Boolean)
    : [String(idsOrId).trim()].filter(Boolean);
  if (!ids.length) return;
  try {
    let q = supabase.from("drugs_sales").update({ is_paid: nextStatus });
    q = ids.length > 1 ? q.in("id", ids) : q.eq("id", ids[0]);
    const { error } = await q;

    if (error) {
      if (error.message.includes("column \"is_paid\" does not exist")) {
        showAlert("Kolom 'is_paid' belum ada di database drugs_sales.", "error");
      } else {
        showAlert("Gagal update status: " + error.message, "error");
      }
      return;
    }
    showAlert(nextStatus ? "Ditandai LUNAS" : "Ditandai BELUM LUNAS", "success");
    loadDrugsTable();
  } catch (e) {
    showAlert("Gagal update status (network)", "error");
  }
}

let rageCashTableOk = null;

async function initRageCash() {
  const timeEl = document.getElementById("rageCashTime");
  if (timeEl && !timeEl.value) {
    timeEl.value = toLocalInput(new Date().toISOString());
  }

  const submitBtn = document.getElementById("rageCashSubmit");
  const refreshBtn = document.getElementById("rageCashRefresh");

  if (submitBtn) submitBtn.addEventListener("click", submitRageCash);
  if (refreshBtn)
    refreshBtn.addEventListener("click", () => loadRageCashTable());

  await ensureRageCashTable();
  loadRageCashTable();
}

async function ensureRageCashTable() {
  if (rageCashTableOk !== null) return rageCashTableOk;
  if (!supabase) {
    rageCashTableOk = false;
    return rageCashTableOk;
  }
  const { error } = await supabase.from("rage_cash_logs").select("id").limit(1);
  if (
    error &&
    String(error.message || "")
      .toLowerCase()
      .includes("relation")
  ) {
    rageCashTableOk = false;
    showAlert("Tabel 'rage_cash_logs' belum ada di Supabase", "error");
    return rageCashTableOk;
  }
  rageCashTableOk = !error;
  return rageCashTableOk;
}

async function submitRageCash() {
  if (!supabase) {
    showAlert("Supabase tidak terhubung", "error");
    return;
  }
  const ok = await ensureRageCashTable();
  if (!ok) return;

  const type = (document.getElementById("rageCashType") || {}).value || "";
  const amount =
    parseFloat((document.getElementById("rageCashAmount") || {}).value) || 0;
  const category = String(
    (document.getElementById("rageCashCategory") || {}).value || ""
  ).trim();
  const note = String(
    (document.getElementById("rageCashNote") || {}).value || ""
  ).trim();
  const timeVal = String(
    (document.getElementById("rageCashTime") || {}).value || ""
  ).trim();

  if (!type || (type !== "IN" && type !== "OUT")) {
    showAlert("Pilih tipe transaksi", "error");
    return;
  }
  if (amount <= 0) {
    showAlert("Nominal harus lebih dari 0", "error");
    return;
  }
  if (!category) {
    showAlert("Kategori wajib diisi", "error");
    return;
  }

  const waktu = timeVal
    ? new Date(timeVal).toISOString()
    : new Date().toISOString();
  const row = { type, amount, category, note, waktu };
  const { error } = await supabase.from("rage_cash_logs").insert(row);
  if (error) {
    showAlert("Gagal menyimpan: " + error.message, "error");
    return;
  }

  await sendRageCashToDiscord(row);
  showAlert("Tersimpan & terkirim", "success");

  const amtEl = document.getElementById("rageCashAmount");
  const catEl = document.getElementById("rageCashCategory");
  const noteEl = document.getElementById("rageCashNote");
  if (amtEl) amtEl.value = "";
  if (catEl) catEl.value = "";
  if (noteEl) noteEl.value = "";
  const timeEl = document.getElementById("rageCashTime");
  if (timeEl) timeEl.value = toLocalInput(new Date().toISOString());
  loadRageCashTable();
}

async function sendRageCashToDiscord(payload) {
  const hook = (window && window.DISCORD_RAGE_CASH_WEBHOOK_URL) || "";
  if (!hook) return;

  const currentMember = window.__currentMember || null;
  const isIn = payload.type === "IN";
  const typeLabel = isIn ? "PEMASUKAN" : "PENGELUARAN";
  const tsIso = payload.waktu || new Date().toISOString();
  const amount = parseFloat(payload.amount) || 0;
  const sign = isIn ? "+" : "-";
  const color = isIn ? 0x57f287 : 0xed4245;
  const when = fmtDateTime(tsIso);
  const category = payload.category || "-";
  const note = payload.note ? String(payload.note).trim() : "";
  const amountText = `${sign}${fmt(amount)}`;
  const dot = isIn ? "🟢" : "🔴";
  const balance = await getRageCashBalance();
  const balanceField =
    balance == null
      ? null
      : { name: "SALDO TOTAL", value: `\`${fmt(balance)}\``, inline: false };
  const actor =
    currentMember && currentMember.nama ? String(currentMember.nama) : "";

  const embed = {
    title: `${dot}  ${typeLabel}`,
    color,
    description:
      "```" +
      `\nNOMINAL  : ${amountText}` +
      `\nKATEGORI : ${category}` +
      (note ? `\nCATATAN  : ${note}` : "") +
      (actor ? `\nOLEH    : ${actor}` : "") +
      `\nWAKTU    : ${when}` +
      "\n```",
    ...(balanceField ? { fields: [balanceField] } : {}),
    timestamp: tsIso,
  };

  await postToDiscordEmbed(embed, hook);
}

async function getRageCashBalance() {
  try {
    if (!supabase) return null;
    const ok = await ensureRageCashTable();
    if (!ok) return null;
    const { data, error } = await supabase
      .from("rage_cash_logs")
      .select("type,amount")
      .order("waktu", { ascending: false })
      .limit(2000);
    if (error) return null;
    return (data || []).reduce((acc, r) => {
      const a = parseFloat(r.amount) || 0;
      if (r.type === "IN") return acc + a;
      return acc - a;
    }, 0);
  } catch (e) {
    return null;
  }
}

async function loadRageCashTable() {
  if (!supabase) return;
  const ok = await ensureRageCashTable();
  if (!ok) return;

  const body = document.getElementById("rageCashTableBody");
  const empty = document.getElementById("rageCashEmpty");
  const balEl = document.getElementById("rageCashBalance");
  if (!body || !empty) return;

  body.innerHTML =
    '<tr><td colspan="5" class="px-4 py-8 text-center text-slate-400">Memuat data...</td></tr>';

  const { data, error } = await supabase
    .from("rage_cash_logs")
    .select("id,type,amount,category,note,waktu")
    .order("waktu", { ascending: false })
    .limit(50);

  if (error) {
    body.innerHTML = `<tr><td colspan="5" class="px-4 py-8 text-center text-red-400">Gagal memuat data: ${error.message}</td></tr>`;
    return;
  }

  const rows = data || [];
  if (!rows.length) {
    body.innerHTML = "";
    empty.classList.remove("hidden");
  } else {
    empty.classList.add("hidden");
    body.innerHTML = rows
      .map((r) => {
        const t = r.type === "IN" ? "IN" : "OUT";
        const color =
          t === "IN"
            ? "text-green-600 dark:text-green-400"
            : "text-red-600 dark:text-red-400";
        return `
        <tr class="hover:bg-white/5 transition-colors">
          <td class="px-4 py-3 text-xs text-slate-500 dark:text-amber-200/60">${fmtDateTime(r.waktu)}</td>
          <td class="px-4 py-3 font-bold ${color}">${t}</td>
          <td class="px-4 py-3">${r.category || "-"}</td>
          <td class="px-4 py-3 text-right font-mono font-bold">${fmt(r.amount || 0)}</td>
          <td class="px-4 py-3 text-center">
            <button class="px-3 py-1 rounded bg-red-700/20 text-red-400 border border-red-700/30 text-[10px] font-bold uppercase hover:bg-red-700/40 transition" data-del-cash-id="${r.id}">
              Hapus
            </button>
          </td>
        </tr>
      `;
      })
      .join("");
  }

  body.querySelectorAll("[data-del-cash-id]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const id = btn.getAttribute("data-del-cash-id");
      if (!id) return;
      await deleteRageCashEntry(id);
    });
  });

  const bal = await getRageCashBalance();
  if (balEl && bal != null) balEl.textContent = fmt(bal);
}

function getCatalogScrap(itemName) {
  for (const cat in CATALOG) {
    const found = (CATALOG[cat] || []).find((i) => i && i.name === itemName);
    if (found) return found.scrap || 0;
  }
  return 0;
}

async function initRekap() {
  const btn = document.getElementById("rekapRefresh");
  if (btn) btn.addEventListener("click", () => loadRekapData());
  loadRekapData();
}

async function loadRekapData() {
  if (!supabase) return;
  const currentMember = window.__currentMember || null;
  const memberId =
    currentMember && currentMember.id
      ? parseInt(String(currentMember.id), 10)
      : NaN;

  const periodeEl = document.getElementById("rekapPeriodeLabel");
  const orderLabel = document.getElementById("rekapOrderLabel");
  const orderCount = document.getElementById("rekapOrderCount");
  const orderItems = document.getElementById("rekapOrderItems");
  const orderTotal = document.getElementById("rekapOrderTotal");
  const orderScrap = document.getElementById("rekapOrderScrap");
  const topItemsEl = document.getElementById("rekapTopItems");

  const drugsLabel = document.getElementById("rekapDrugsLabel");
  const drugsMerah = document.getElementById("rekapDrugsMerah");
  const drugsGaji = document.getElementById("rekapDrugsGaji");
  const drugsRage = document.getElementById("rekapDrugsRage");
  const drugsCount = document.getElementById("rekapDrugsCount");

  const storanLabel = document.getElementById("rekapStoranLabel");
  const storanDone = document.getElementById("rekapStoranDone");
  const storanPending = document.getElementById("rekapStoranPending");
  const storanCash = document.getElementById("rekapStoranCash");
  const storanScrap = document.getElementById("rekapStoranScrap");

  const kasSaldo = document.getElementById("rekapKasSaldo");
  const needsStoran = !!(
    storanLabel ||
    storanDone ||
    storanPending ||
    storanCash ||
    storanScrap
  );
  const needsKas = !!kasSaldo;

  const [activeOrderWin, activeDrugsWin] = await Promise.all([
    fetchActiveOrderWindow(null, "order"),
    fetchActiveOrderWindow(null, "drugs"),
  ]);
  const [latestOrderWin, latestDrugsWin] = await Promise.all([
    activeOrderWin
      ? Promise.resolve(activeOrderWin)
      : fetchLatestOrderWindow("order"),
    activeDrugsWin
      ? Promise.resolve(activeDrugsWin)
      : fetchLatestOrderWindow("drugs"),
  ]);
  const orderWin = activeOrderWin || latestOrderWin || null;
  const drugsWin = activeDrugsWin || latestDrugsWin || null;
  const isOrderFallback = !activeOrderWin && !!orderWin;
  const isDrugsFallback = !activeDrugsWin && !!drugsWin;

  if (periodeEl) {
    const orderLabelText =
      orderWin && orderWin.orderanke
        ? (() => {
            const { m, w, raw } = decodeOrderanke(
              parseInt(orderWin.orderanke, 10)
            );
            return `${isOrderFallback ? "Periode Order Terakhir" : "Periode Order"}: M${m}-W${w} (#${raw})`;
          })()
        : "Tidak ada periode order";
    const drugsLabelText =
      drugsWin && drugsWin.orderanke
        ? (() => {
            const { m, w, raw } = decodeOrderanke(
              parseInt(drugsWin.orderanke, 10)
            );
            return `${isDrugsFallback ? "Batch Drugs Terakhir" : "Batch Drugs"}: M${m}-W${w} (#${raw})`;
          })()
        : "Tidak ada batch drugs";
    periodeEl.textContent = `${orderLabelText} • ${drugsLabelText}`;
  }

  if (orderWin && orderWin.orderanke) {
    const v = parseInt(orderWin.orderanke, 10);
    const { m, w, raw } = decodeOrderanke(v);
    if (orderLabel) {
      orderLabel.textContent = `${isOrderFallback ? "Terakhir • " : ""}M${m}-W${w} (#${raw})`;
    }
    if (Number.isNaN(memberId) || !memberId) {
      if (orderCount) orderCount.textContent = "0";
      if (orderItems) orderItems.textContent = "0";
      if (orderTotal) orderTotal.textContent = "$ 0";
      if (orderScrap) orderScrap.textContent = "0";
      if (topItemsEl)
        topItemsEl.innerHTML =
          '<div class="text-slate-500 dark:text-amber-200/60">Akun belum terhubung ke member</div>';
    } else {
      const { data, error } = await supabase
        .from("orders")
        .select("order_id,qty,subtotal,item")
        .eq("orderanke", v)
        .eq("member_id", memberId)
        .order("waktu", { ascending: false })
        .limit(5000);

      if (error) {
        if (orderCount) orderCount.textContent = "0";
        if (orderItems) orderItems.textContent = "0";
        if (orderTotal) orderTotal.textContent = "$ 0";
        if (orderScrap) orderScrap.textContent = "0";
        if (topItemsEl)
          topItemsEl.textContent = "Gagal memuat order: " + error.message;
      } else {
        const rows = data || [];
        const orderIds = new Set(rows.map((r) => r.order_id).filter(Boolean));
        const totalQty = rows.reduce((a, r) => a + (r.qty || 0), 0);
        const totalMoney = rows.reduce((a, r) => a + (r.subtotal || 0), 0);
        const totalScr = rows.reduce(
          (a, r) => a + getCatalogScrap(r.item) * (r.qty || 0),
          0
        );
        if (orderCount) orderCount.textContent = String(orderIds.size);
        if (orderItems) orderItems.textContent = String(totalQty);
        if (orderTotal) orderTotal.textContent = fmt(totalMoney);
        if (orderScrap) orderScrap.textContent = String(totalScr);

        const byItem = {};
        rows.forEach((r) => {
          const k = r.item || "-";
          byItem[k] = (byItem[k] || 0) + (r.qty || 0);
        });
        const top = Object.entries(byItem)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 6);
        if (topItemsEl) {
          topItemsEl.innerHTML = top.length
            ? top
                .map(
                  ([name, qty]) =>
                    `<div class="flex justify-between gap-4"><span class="truncate">${name}</span><span class="font-mono font-bold">${fmtNumber(qty)}</span></div>`
                )
                .join("")
            : '<div class="text-slate-500 dark:text-amber-200/60">Belum ada order</div>';
        }
      }
    }
  } else {
    if (orderLabel) orderLabel.textContent = "Tidak ada data";
    if (orderCount) orderCount.textContent = "0";
    if (orderItems) orderItems.textContent = "0";
    if (orderTotal) orderTotal.textContent = "$ 0";
    if (orderScrap) orderScrap.textContent = "0";
    if (topItemsEl)
      topItemsEl.innerHTML =
        '<div class="text-slate-500 dark:text-amber-200/60">Tidak ada periode</div>';
  }

  if (drugsWin && drugsWin.orderanke) {
    const v = parseInt(drugsWin.orderanke, 10);
    const { m, w, raw } = decodeOrderanke(v);
    if (drugsLabel) {
      drugsLabel.textContent = `${isDrugsFallback ? "Terakhir • " : ""}M${m}-W${w} (#${raw})`;
    }

    if (Number.isNaN(memberId) || !memberId) {
      if (drugsMerah) drugsMerah.textContent = "$ 0";
      if (drugsGaji) drugsGaji.textContent = "$ 0";
      if (drugsRage) drugsRage.textContent = "$ 0";
      if (drugsCount) drugsCount.textContent = "0";
    } else {
      const { data, error } = await supabase
        .from("drugs_sales")
        .select("uang_merah,upah_putih,uang_rage,periode_orderanke")
        .eq("periode_orderanke", v)
        .eq("member_id", memberId)
        .order("waktu", { ascending: false })
        .limit(5000);
      if (error) {
        if (drugsMerah) drugsMerah.textContent = "$ 0";
        if (drugsGaji) drugsGaji.textContent = "$ 0";
        if (drugsRage) drugsRage.textContent = "$ 0";
        if (drugsCount) drugsCount.textContent = "0";
      } else {
        const rows = data || [];
        const totalMerah = rows.reduce(
          (a, r) => a + (parseFloat(r.uang_merah) || 0),
          0
        );
        const totalGaji = rows.reduce(
          (a, r) => a + (parseFloat(r.upah_putih) || 0),
          0
        );
        const totalRage = rows.reduce(
          (a, r) => a + (parseFloat(r.uang_rage) || 0),
          0
        );
        if (drugsMerah) drugsMerah.textContent = fmt(totalMerah);
        if (drugsGaji) drugsGaji.textContent = fmt(totalGaji);
        if (drugsRage) drugsRage.textContent = fmt(totalRage);
        if (drugsCount) drugsCount.textContent = String(rows.length);
      }
    }
  } else {
    if (drugsLabel) drugsLabel.textContent = "Tidak ada data";
    if (drugsMerah) drugsMerah.textContent = "$ 0";
    if (drugsGaji) drugsGaji.textContent = "$ 0";
    if (drugsRage) drugsRage.textContent = "$ 0";
    if (drugsCount) drugsCount.textContent = "0";
  }

  if (needsStoran && orderWin && orderWin.orderanke) {
    const v = parseInt(orderWin.orderanke, 10);
    const { m, w, raw } = decodeOrderanke(v);
    if (storanLabel) storanLabel.textContent = `M${m}-W${w} (#${raw})`;

    const [
      { data: logs, error: logErr },
      { count: memberCount, error: memErr },
    ] = await Promise.all([
      supabase
        .from("storan_logs")
        .select("member_id,status,waktu,periode_orderanke")
        .eq("periode_orderanke", v)
        .order("waktu", { ascending: true })
        .limit(5000),
      supabase.from("members").select("*", { count: "exact", head: true }),
    ]);
    if (logErr || memErr) {
      if (storanDone) storanDone.textContent = "0";
      if (storanPending) storanPending.textContent = "0";
      if (storanCash) storanCash.textContent = "$ 0";
      if (storanScrap) storanScrap.textContent = "0";
    } else {
      const latestByMember = {};
      (logs || []).forEach((r) => {
        const key = r.member_id || null;
        if (!key) return;
        const prev = latestByMember[key];
        if (!prev) {
          latestByMember[key] = r;
          return;
        }
        const tPrev = new Date(prev.waktu || 0).getTime();
        const tCur = new Date(r.waktu || 0).getTime();
        if (tCur >= tPrev) latestByMember[key] = r;
      });
      const done = Object.values(latestByMember).filter(
        (r) => String(r.status || "") === "SUDAH"
      ).length;
      const totalMembers = memberCount || 0;
      const pending = Math.max(0, totalMembers - done);
      if (storanDone) storanDone.textContent = String(done);
      if (storanPending) storanPending.textContent = String(pending);
      if (storanCash) storanCash.textContent = fmt(done * 50000);
      if (storanScrap) storanScrap.textContent = String(done * 50);
    }
  } else if (needsStoran) {
    if (storanLabel) storanLabel.textContent = "Tidak aktif";
    if (storanDone) storanDone.textContent = "0";
    if (storanPending) storanPending.textContent = "0";
    if (storanCash) storanCash.textContent = "$ 0";
    if (storanScrap) storanScrap.textContent = "0";
  }

  if (needsKas) {
    const saldo = await getRageCashBalance();
    if (kasSaldo) kasSaldo.textContent = saldo == null ? "$ 0" : fmt(saldo);
  }
}

async function deleteRageCashEntry(id) {
  if (!supabase) {
    showAlert("Supabase tidak terhubung", "error");
    return;
  }
  if (!isAdminMember(window.__currentMember || null)) {
    showAlert("Hanya Admin yang bisa menghapus catatan", "error");
    return;
  }
  const ok = await ensureRageCashTable();
  if (!ok) return;

  const proceed = await Swal.fire({
    title: "Hapus catatan ini?",
    text: "Tindakan tidak dapat dibatalkan.",
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "Ya, hapus",
    cancelButtonText: "Batal",
    customClass: {
      popup: "rage-modal-popup",
      title: "rage-modal-title",
      confirmButton: "rage-modal-confirm !bg-red-600",
      cancelButton: "rage-modal-cancel",
    },
  });
  if (!proceed.isConfirmed) return;

  const pin = (window && window.ADMIN_DELETE_PIN) || "";
  let pinOk = true;
  if (pin) {
    const { value: typed } = await Swal.fire({
      title: "Masukkan PIN delete",
      input: "password",
      inputPlaceholder: "Masukkan PIN",
      showCancelButton: true,
      confirmButtonText: "Konfirmasi",
      cancelButtonText: "Batal",
      customClass: {
        popup: "rage-modal-popup",
        title: "rage-modal-title",
        confirmButton: "rage-modal-confirm !bg-red-600",
        cancelButton: "rage-modal-cancel",
        input: "rage-modal-input",
      },
    });
    pinOk = !!typed && typed === pin;
  } else {
    const { value: typed } = await Swal.fire({
      title: "Ketik DELETE untuk konfirmasi",
      input: "text",
      inputPlaceholder: "DELETE",
      showCancelButton: true,
      confirmButtonText: "Konfirmasi",
      cancelButtonText: "Batal",
      customClass: {
        popup: "rage-modal-popup",
        title: "rage-modal-title",
        confirmButton: "rage-modal-confirm !bg-red-600",
        cancelButton: "rage-modal-cancel",
        input: "rage-modal-input",
      },
    });
    pinOk = (typed || "").toUpperCase() === "DELETE";
  }
  if (!pinOk) {
    showAlert("Konfirmasi hapus tidak valid", "error");
    return;
  }

  const { data, error } = await supabase
    .from("rage_cash_logs")
    .delete()
    .eq("id", id)
    .select("id");
  if (error) {
    showAlert("Gagal menghapus: " + error.message, "error");
    return;
  }
  if (!data || !data.length) {
    showAlert("Tidak bisa menghapus catatan (RLS/policy menolak)", "error");
    return;
  }
  showAlert("Catatan berhasil dihapus", "success");
  loadRageCashTable();
}
