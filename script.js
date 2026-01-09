import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.2";
const supabase =
  window.SUPABASE_URL && window.SUPABASE_ANON_KEY
    ? createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY)
    : null;

const CATALOG = {
  Gun: [
    { name: "PISTOL .50", price: 9500 }, // to BOA
    { name: "CERAMIC PISTOL", price: 26000 }, // to BOA
    { name: "TECH 9", price: 26000 },
    { name: "MINI SMG", price: 30000 },
    { name: "MICRO SMG", price: 30000 }, // to BOA
    { name: "SMG", price: 40000 },
    { name: "SHOTGUN", price: 65000 }, // to BOA
    { name: "NAVY REVOLVER", price: 72000 },
    { name: "PISTOL X17", price: 33000 },
    { name: "BLACK REVOLVER", price: 91000 },
    { name: "KVR", price: 78000 },
    { name: "Assault Rifle", price: 195000 }, //max 20
  ],
  Ammo: [
    { name: "AMMO 9MM", price: 3000, scrap: 3 }, // to BOA
    { name: "AMMO 44 MAGNUM", price: 6500, scrap: 3 },
    { name: "AMMO .45", price: 6500, scrap: 3.4 },
    { name: "AMMO 12 GAUGE", price: 6500, scrap: 7.5 }, // to BOA
    { name: "AMMO .50", price: 1500, scrap: 2 }, // to BOA
    { name: "Ammo 762", price: 7000, scrap: 5 },
  ],
  Attachment: [
    { name: "Tactical Flashlight", price: 4000, scrap: 5 },
    { name: "Suppressor", price: 13000, scrap: 5 },
    { name: "Tactical Suppressor", price: 13000, scrap: 5 },
    { name: "Grip", price: 4000, scrap: 5 },
    { name: "Extended Pistol Clip", price: 4000, scrap: 5 },
    { name: "Extended SMG Clip", price: 7000, scrap: 5 },
    { name: "Extended Rifle Clip", price: 20000, scrap: 5 },
    { name: "SMG Drum", price: 13000, scrap: 5 },
    { name: "Rifle Drum", price: 26000, scrap: 5 },
    { name: "Macro Scope", price: 4000, scrap: 5 },
    { name: "Medium Scope", price: 4000, scrap: 5 },
  ],
  Others: [
    { name: "VEST", price: 3000, scrap: 2 },
    { name: "VEST MEDIUM", price: 1500 }, // to BOA
    { name: "LOCKPICK", price: 1500 },
  ],
};

const ITEM_MAX_LIMITS = {
  "PISTOL X17": 20,
  "TECH 9": 20,
  "PISTOL .50": 60,
  "MINI SMG": 20,
  "MICRO SMG": 50,
  "CERAMIC PISTOL": 60,
  "SMG": 20,
  "SHOTGUN": 20,
  "NAVY REVOLVER": 20,
  "KVR": 20,
  "BLACK REVOLVER": 20,
  "AMMO 9MM": 600,
  "AMMO .50": 600,
  "AMMO .45": 200,
  "AMMO 12 GAUGE": 150,
  "VEST": 200,
  "VEST MEDIUM": 150,
  "LOCKPICK": 60,
  "AMMO 44 MAGNUM": 100,
  "Assault Rifle": 20,
  "Ammo 762": 400,
  "Tactical Flashlight": 20,
  "Suppressor": 20,
  "Tactical Suppressor": 20,
  "Grip": 20,
  "Extended Pistol Clip": 20,
  "Extended SMG Clip": 20,
  "Extended Rifle Clip": 20,
  "SMG Drum": 20,
  "Rifle Drum": 20,
  "Macro Scope": 20,
  "Medium Scope": 20,
};

function getItemMax(name) {
  const n = name || "";
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

async function postToDiscord(message) {
  try {
    const url = (window && window.DISCORD_WEBHOOK_URL) || "";
    const enabled = window.DISCORD_ENABLED !== false;
    if (!url || !enabled || !message || typeof message !== "string") return;
    let content = message;
    if (window && window.MAINTENANCE_MODE === true) {
      content = `@everyone\n SEDANG TESTING\n${content}`;
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
  if (isDashboard) {
    const ok = await guardDashboard();
    if (!ok) return;
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
    setupCustomerSearch();
    setOrderNoUI();
    updateOrderWindowUI();
    updateNameValidity();
    setInterval(updateOrderWindowUI, 60000);
  }
  if (isDashboard) {
    initDashboard();
  }
  const nav = document.getElementById("mainNav");
  if (nav) {
    const links = Array.from(nav.querySelectorAll("a"));
    const path = (location.pathname || "").toLowerCase();
    const isIndex = path.endsWith("/index.html") || path === "/" || path === "";
    links.forEach((a) => {
      const href = a.getAttribute("href") || "";
      const active = isIndex
        ? href.endsWith("index.html")
        : href.endsWith("dashboard.html");
      a.classList.toggle("btn-success", active);
    });
  }
}

function populateItems() {
  const kategori =
    document.getElementById("kategori").value || Object.keys(CATALOG)[0];
  const itemEl = document.getElementById("item");
  itemEl.innerHTML = "";
  CATALOG[kategori].forEach((it) => {
    const o = document.createElement("option");
    o.value = it.name;
    o.textContent = `${it.name} (${fmt(it.price)})`;
    itemEl.appendChild(o);
  });
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
  const isHang = await getMemberHangaroundStatus(hiddenId);
  const nama = document.getElementById("nama").value.trim();
  const kategori = document.getElementById("kategori").value;
  const itemName = document.getElementById("item").value;
  const qty = parseInt(document.getElementById("qty").value, 10) || 1;
  if (!itemName || !kategori || qty < 1) return;
  const nItem = normItemName(itemName);

  if (isHang) {
    // 1. Existing VEST check
    if (nItem === "VEST") {
      showAlert("Hangaround tidak boleh beli VEST, hanya VEST MEDIUM", "error");
      return;
    }
    // 2. Existing ASSAULT RIFLE check (redundant if we whitelist, but keeping for clarity/message)
    if (nItem === "ASSAULT RIFLE") {
      showAlert("Hangaround tidak boleh beli ASSAULT RIFLE", "error");
      return;
    }
    // 3. Whitelist check for Gun category
    // We need to know if the item is a Gun.
    // The 'kategori' variable comes from the select input.
    if (kategori === "Gun") {
      const HANGAROUND_ALLOWED_GUNS = [
        "PISTOL .50",
        "CERAMIC PISTOL",
        "TECH 9",
        "PISTOL X17",
        "MINI SMG",
        "MICRO SMG",
        "NAVY REVOLVER",
      ];
      if (!HANGAROUND_ALLOWED_GUNS.includes(itemName)) {
        // itemName is from value, usually matches catalog name
        // Double check with normalized names to be safe
        const allowedNorm = HANGAROUND_ALLOWED_GUNS.map(normItemName);
        if (!allowedNorm.includes(nItem)) {
          showAlert(`Hangaround tidak boleh membeli ${itemName}.`, "error");
          return;
        }
      }
    }
  }

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
  const item = CATALOG[kategori].find((i) => i.name === itemName);
  const existing = state.cart.find(
    (c) => c.item === itemName && c.kategori === kategori
  );
  if (existing) existing.qty += qty;
  else
    state.cart.push({
      item: itemName,
      kategori,
      price: item.price,
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
  const v = hidden ? parseInt(hidden.value || "", 10) : NaN;
  const ok = !Number.isNaN(v) && !!v;
  if (!ok) {
    renderMyOrders([]);
    return;
  }
  const { data, error } = await supabase
    .from("orders")
    .select("id,order_id,item,qty,subtotal,orderanke,kategori,harga,waktu")
    .eq("member_id", v)
    .order("waktu", { ascending: false })
    .limit(500);
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
      const ok = window.confirm("Hapus baris order ini?");
      if (!ok) return;
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
  const nama = document.getElementById("nama").value.trim();
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
  const memberIdFromHidden = parseInt(
    (document.getElementById("memberId") || {}).value || "",
    10
  );
  if (Number.isNaN(memberIdFromHidden) || !memberIdFromHidden) {
    showAlert("Pilih nama dari database", "error");
    endLoading();
    return;
  }
  const member_id = memberIdFromHidden;
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
  const isHang = await getMemberHangaroundStatus(member_id);
  if (isHang) {
    const HANGAROUND_ALLOWED_GUNS = [
      "PISTOL .50",
      "CERAMIC PISTOL",
      "TECH 9",
      "PISTOL X17",
      "MINI SMG",
      "MICRO SMG",
      "NAVY REVOLVER",
    ].map(normItemName);

    // Check Cart
    for (const c of state.cart) {
      const n = normItemName(c.item);
      // VEST check
      if (n === "VEST") {
        showAlert("Hangaround tidak boleh beli VEST", "error");
        endLoading();
        return;
      }
      // Gun check
      // Note: c.kategori might be missing if cart structure changed, but we added it in addToCart.
      // If missing, we can try to look it up, but let's assume it's there or infer from catalog.
      let isGun = c.kategori === "Gun";
      if (!c.kategori) {
        // Fallback check
        isGun = (CATALOG.Gun || []).some((x) => normItemName(x.name) === n);
      }

      if (isGun) {
        if (!HANGAROUND_ALLOWED_GUNS.includes(n)) {
          showAlert(`Hangaround tidak boleh membeli ${c.item}`, "error");
          endLoading();
          return;
        }
      }
    }
  }
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
  if (totalVest > 5) {
    const remaining = Math.max(0, 5 - existingVest);
    showAlert(`Maksimal VEST per orang 5. Tersisa ${remaining}.`, "error");
    endLoading();
    return;
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

      // console.log("Discord message:", msg);
      await postToDiscord(msg);
    } catch (e) {
      // console.error("Discord post error", e);
    }
    endLoading();
  } catch (e) {
    // console.error("Error in submitOrder:", e);
    // statusEl.textContent = "Gagal menyimpan (network error)";
    showAlert("Gagal menyimpan (network error)", "error");
    endLoading();
  }
}
async function getMemberHangaroundStatus(id) {
  if (!supabase || !id) return false;
  const cache = (window.__memberHangCache ||= {});
  if (typeof cache[id] !== "undefined") return !!cache[id];
  try {
    const { data } = await supabase
      .from("members")
      .select("id,is_hangaround")
      .eq("id", id)
      .limit(1);
    const val = !!((data && data[0] && data[0].is_hangaround) || false);
    cache[id] = val;
    return val;
  } catch (e) {
    return false;
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
  const display = document.getElementById("orderNo");
  const hidden = document.getElementById("orderankeHidden");
  let value, label;
  const win = supabase ? await fetchActiveOrderWindow(null) : null;
  if (win && win.orderanke) {
    const v = parseInt(win.orderanke, 10);
    const m = Math.floor(v / 10);
    const w = v % 10;
    value = v;
    label = `M${m}-W${w}`;
  } else {
    const c = computeOrderNo();
    value = c.value;
    label = c.label;
  }
  if (display) display.value = `${label} (#${value})`;
  if (hidden) hidden.value = String(value);
}

function getNowIso() {
  return new Date().toISOString();
}

async function fetchActiveOrderWindow(orderanke) {
  const now = getNowIso();
  let q = supabase
    .from("order_windows")
    .select("id,orderanke,start_time,end_time,is_active")
    .eq("is_active", true)
    .lte("start_time", now)
    .gte("end_time", now)
    .order("orderanke", { ascending: false })
    .limit(1);
  if (orderanke) q = q.eq("orderanke", orderanke);
  const { data, error } = await q;
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
  const el = document.getElementById("orderWindowStatus");
  const detailEl = document.getElementById("orderWindowDetail");
  const ok = await ensureOrderingOpen();
  if (el) {
    el.textContent = ok ? "Order sedang dibuka" : "Order ditutup";
    el.classList.toggle("bg-red-600", !ok);
    el.classList.toggle("bg-green-600", ok);
  }
  const win = await fetchActiveOrderWindow(null);
  const vNow = win && win.orderanke ? parseInt(win.orderanke, 10) : null;
  if (vNow) await refreshItemTotals(vNow);
  if (detailEl) {
    if (win) {
      const v = parseInt(win.orderanke, 10);
      const m = Math.floor(v / 10);
      const w = v % 10;
      const open = new Date(win.start_time).toLocaleString();
      const close = new Date(win.end_time).toLocaleString();
      detailEl.textContent = `Buka: ${open} • Tutup: ${close} • Periode: M${m}-W${w} (#${v})`;
    } else {
      const c = computeOrderNo();
      // detailEl.textContent = `Tidak ada jadwal aktif • Periode default: ${c.label} (#${c.value})`;
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
      "id,order_id,order_no,nama,orderanke,waktu,kategori,item,harga,qty,subtotal,delivered"
    )
    .order("waktu", { ascending: false })
    .limit(limit);
}
async function fetchOrdersSafe(limit = 500) {
  let { data, error } = await supabase
    .from("orders")
    .select(
      "id,order_id,order_no,nama,orderanke,waktu,kategori,item,harga,qty,subtotal,delivered"
    )
    .order("waktu", { ascending: false })
    .limit(limit);
  if (error && String(error.message || "").includes("delivered")) {
    const res = await supabase
      .from("orders")
      .select(
        "id,order_id,order_no,nama,orderanke,waktu,kategori,item,harga,qty,subtotal"
      )
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
  "ORDER KE 4BLOODS",
  "LAINNYA",
];
const GROUP_ITEMS = {
  "ORDER KE HIGH TABEL": [
    "SMG",
    "PISTOL X17",
    "BLACK REVOLVER",
    "TECH 9",
    "MINI SMG",
    "VEST",
    "Assault Rifle",
    "Ammo 762",
  ],

  "ORDER KE ALLSTAR": [
    "AMMO 44 MAGNUM",
    "KVR",
    "AMMO .45",
    "NAVY REVOLVER",
  ],

  "ORDER KE BOA": [
    "PISTOL .50",
    "AMMO .50",
    "SHOTGUN",
    "AMMO 12 GAUGE",
    "MICRO SMG",
    "AMMO 9MM",
    "CERAMIC PISTOL",
    "VEST MEDIUM",
    "LOCKPICK",
  ],

  "ORDER KE 4BLOODS": [
    "Tactical Flashlight",
    "Suppressor",
    "Tactical Suppressor",
    "Grip",
    "Extended Pistol Clip",
    "Extended SMG Clip",
    "Extended Rifle Clip",
    "SMG Drum",
    "Rifle Drum",
    "Macro Scope",
    "Medium Scope",
  ],
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
  const totalsByUser = {};
  keys.forEach((k) => {
    const g = groups[k];
    (g.items || []).forEach((r) => {
      const name = r.nama || "Unknown";
      totalsByUser[name] ||= { count: 0, total: 0, scrap: 0 };
      totalsByUser[name].count += 1;
      totalsByUser[name].total += r.subtotal || 0;
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
  const totalsHtml =
    `<div class=\"rounded-xl border border-[#f3e8d8] dark:border-[#3d342d] p-4 mb-6\"><h4 class=\"text-sm font-semibold mb-2\">Total Orders per User</h4><div class=\"overflow-x-auto\"><table class=\"w-full text-sm\"><thead><tr><th class=\"text-left px-2 py-2\">Nama</th><th class=\"text-center px-2 py-2\">Orders</th><th class=\"text-right px-2 py-2\">Total</th><th class=\"text-center px-2 py-2\">Scrap</th></tr></thead><tbody>` +
    userKeys
      .map(
        (n) =>
          `<tr class=\"table-row-hover border-b border-yellow-900/20\"><td class=\"px-2 py-2\">${n}</td><td class=\"px-2 py-2 text-center\">${
            totalsByUser[n].count
          }</td><td class=\"px-2 py-2 text-right\">${fmt(
            totalsByUser[n].total
          )}</td><td class=\"px-2 py-2 text-center\">${
            totalsByUser[n].scrap > 0
              ? parseFloat(totalsByUser[n].scrap.toFixed(2))
              : "-"
          }</td></tr>`
      )
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
            .map((r, idx) => {
              const nameCell =
                idx === 0
                  ? `<td class=\"px-2 py-2 align-top\" rowspan=\"${byName[name].length}\">${name}</td>`
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
              }</button></td><td class=\"px-2 py-2 text-right\"><button data-del-id=\"${
                r.id
              }\" class=\"px-2 py-1 rounded bg-red-700 text-white\">Hapus</button></td></tr>`;
            })
            .join("")
        )
        .join("");
      const orderDetails =
        `<div class=\"rounded-xl border border-[#f3e8d8] dark:border-[#3d342d] p-4\"><h4 class=\"text-sm font-semibold mb-2\">Order Details</h4><div class=\"overflow-x-auto\"><table class=\"w-full text-sm\"><thead><tr><th class=\"text-left px-2 py-2\">Order No.</th><th class=\"text-left px-2 py-2\">Nama</th><th class=\"text-left px-2 py-2\">Waktu</th><th class=\"text-left px-2 py-2\">Item</th><th class=\"text-center px-2 py-2\">Qty</th><th class=\"text-right px-2 py-2\">Subtotal</th><th class=\"text-center px-2 py-2\">Status</th><th class=\"text-right px-2 py-2\">Actions</th></tr></thead><tbody>` +
        rowsHtml +
        `</tbody></table></div></div>`;
      return `<div class=\"rounded-xl border border-[#f3e8d8] dark:border-[#3d342d] p-4 mb-4\">${header}</div>${summary}${orderDetails}`;
    })
    .join("");
  container.innerHTML = totalsHtml + batchesHtml;
  const deliveredRows = getDeliveredRowSet();
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
  container.querySelectorAll("[data-del-id]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const id = parseInt(btn.getAttribute("data-del-id") || "", 10);
      if (!id) return;
      const ok = window.confirm("Hapus item order ini?");
      if (!ok) return;
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
  // Logic moved to index.html for robustness
  // This function is kept for backward compatibility if needed
  // or to re-attach if DOM changes dynamically
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
  const baseCls =
    "p-3 rounded-2xl max-w-[85%] text-sm shadow-sm animate-fade-in";

  if (role === "user") {
    bubble.className = `${baseCls} bg-amber-600 text-white rounded-tr-none`;
  } else {
    // Always use dark theme for bot bubbles to ensure white text readability
    bubble.className = `${baseCls} bg-[#2a201a] border border-yellow-900/10 text-white rounded-tl-none`;
  }

  bubble.textContent = text;
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
      catalogText += `- ${item.name}: $${item.price} (Scrap: ${
        item.scrap || 0
      })\n`;
    });
  }

  const ammoCompat = `
AMMO COMPATIBILITY (Wajib hapal ini!):
- AMMO .50: PISTOL .50
- AMMO 9MM: CERAMIC PISTOL, TECH 9, MINI SMG, MICRO SMG, SMG, PISTOL X17
- AMMO 12 GAUGE: SHOTGUN
- AMMO 44 MAGNUM: NAVY REVOLVER, BLACK REVOLVER
- AMMO .45: KVR
`;

  return `You are Deri, a professional and helpful arms dealer assistant for R.A.G.E server.
Your goal is to help players find items, prices, and ammo information clearly and politely.
You sell items from this catalog:
${catalogText}
${ammoCompat}

RULES:
1. Answer in polite and clear Indonesian (Bahasa Indonesia yang baik dan benar).
2. Use "Saya" to refer to yourself and "Anda" or "Kak" to refer to the customer. NEVER use slang like "gue", "lo", "lu", "gw".
3. When answering prices, format it nicely (e.g., "$10,000").
4. Explain requirements clearly. If an item needs scrap, mention it.
5. Be concise but helpful. Limit answers to 2-3 sentences.
6. If the item is not found, apologize politely and ask for the correct name.
7. Use the AMMO COMPATIBILITY list for ammo questions.
8. Act like a professional shopkeeper/assistant, not a robot.
9. IF THE USER ASKS FOR TOTAL PRICE: You MUST calculate the total cost.
   - Extract the quantity and item name from the user's request.
   - If no quantity is specified, assume 1.
   - Show the calculation steps: (Price x Qty) + (Price x Qty) = Total.
   - Example: "Total untuk 2 Pistol .50 ($9,100/unit) adalah $18,200."
   - Also calculate total Scrap required if applicable.`;
}

function generateBotResponse(msg) {
  const lower = msg.toLowerCase();

  // 1. Greeting
  if (
    lower.includes("halo") ||
    lower.includes("hi") ||
    lower.includes("pagi") ||
    lower.includes("malam")
  ) {
    return "Selamat datang di website orderan rage! Saya Deri, ada yang bisa saya bantu?";
  }

  // 2. Tanya Harga
  if (lower.includes("harga") || lower.includes("berapa")) {
    const item = findItemInCatalog(lower);
    if (item) {
      return `Harga untuk **${item.name}** adalah **$${fmt(item.price)}**${
        item.scrap ? ` dan memerlukan **${item.scrap} Metal Scrap**` : ""
      }.`;
    }
    return "Maaf, boleh sebutkan nama barangnya lebih spesifik? Contoh: 'harga vest' atau 'harga ammo 9mm'.";
  }

  // 3. Tanya Scrap
  if (lower.includes("scrap") || lower.includes("metal")) {
    const item = findItemInCatalog(lower);
    if (item) {
      return item.scrap
        ? `Untuk membuat **${item.name}**, Anda memerlukan **${item.scrap} Metal Scrap** per unit.`
        : `Item **${item.name}** tidak memerlukan Metal Scrap.`;
    }
    return "Maaf, Anda menanyakan scrap untuk barang apa? Mohon sebutkan nama itemnya.";
  }

  // 4. Tanya Stock/Ready
  if (
    lower.includes("ready") ||
    lower.includes("stok") ||
    lower.includes("ada")
  ) {
    return "Semua barang yang ada di list katalog statusnya **Ready Stock**. Silahkan langsung diorder ya Kak.";
  }

  // 5. Default
  return "Maaf, saya kurang paham. Bisa tolong ulangi pertanyaan Anda? Anda bisa tanya seperti 'harga vest' atau 'ammo smg'.";
}

function findItemInCatalog(text) {
  // Flatten catalog
  let allItems = [];
  for (const cat in CATALOG) {
    allItems = allItems.concat(CATALOG[cat]);
  }

  // Cari yang match
  // Prioritas: Exact match > Partial match
  const words = text.split(" ");

  // Coba cari item yang namanya ada di dalam teks user
  for (const item of allItems) {
    const itemName = item.name.toLowerCase();
    if (text.includes(itemName)) return item;
  }

  // Coba cari per kata kunci spesifik
  if (text.includes("vest")) return allItems.find((i) => i.name === "VEST");
  if (text.includes("9mm")) return allItems.find((i) => i.name === "AMMO 9MM");
  if (text.includes("ak47") || text.includes("ak-47"))
    return allItems.find((i) => i.name === "AK-47");
  if (text.includes(".50")) return allItems.find((i) => i.name === "AMMO .50");

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
    const label = v ? `M${Math.floor(v / 10)}-W${v % 10}` : "Periode";
    const start = fmtDateTime(r.start_time);
    const end = fmtDateTime(r.end_time);
    const msg = `# Orderan periode ${label} dibuka dari ${start} sampai ${end}\n@here`;
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
    const label = v ? `M${Math.floor(v / 10)}-W${v % 10}` : "Periode";
    const start = fmtDateTime(r.start_time);
    const end = fmtDateTime(r.end_time);
    const msg = `# Orderan periode ${label} telah ditutup.\nDibuka dari ${start} sampai ${end}\nDi tunggu open order selanjutnya yaa \n@here`;
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
  body.innerHTML = (rows || [])
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
      const row = (rows || []).find((x) => String(x.id) === String(id));
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
  const m = Math.floor(val / 10);
  const w = val % 10;
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
  const proceed = window.confirm(
    "Hapus jadwal ini? Tindakan tidak dapat dibatalkan."
  );
  if (!proceed) return;
  const pin = (window && window.ADMIN_DELETE_PIN) || "";
  let ok = true;
  if (pin) {
    const typed = window.prompt("Masukkan PIN delete untuk konfirmasi:", "");
    ok = !!typed && typed === pin;
  } else {
    const typed = window.prompt("Ketik DELETE untuk konfirmasi:", "");
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
      const hangEl = document.getElementById("memberHangInput");
      const isHang = !!(hangEl && hangEl.checked);
      await insertNewMember(name, isHang);
      hideMemberModal();
    });
  const btn = document.getElementById("refreshDashboard");
  if (btn) btn.addEventListener("click", () => loadDashboard(true));
  const shareBtn = document.getElementById("dashShareDiscord");
  if (shareBtn) shareBtn.addEventListener("click", shareDashboardToDiscord);
  if (mSel) mSel.addEventListener("change", () => loadDashboard(false));
  if (wSel) wSel.addEventListener("change", () => loadDashboard(false));
  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn)
    logoutBtn.addEventListener("click", async () => {
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
    });
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
  if (!modal || !input) return;
  input.value = "";
  modal.classList.remove("hidden");
  loadMemberListInModal();
  setTimeout(() => input.focus(), 0);
}

function hideMemberModal() {
  const modal = document.getElementById("memberModal");
  if (modal) modal.classList.add("hidden");
}

async function insertNewMember(name, isHang) {
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
  const { error } = await supabase
    .from("members")
    .insert([{ nama: name, is_hangaround: !!isHang }])
    .select("id");
  if (error) {
    showAlert("Gagal menambah member", "error");
    return;
  }
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
    "ORDER KE 4BLOODS": 0,
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
      // const label = ("Total " + grp + ":").padEnd(itemW + 3 + qtyW + 3 + hargaW);
      const label = "Total : ".padEnd(itemW + 3 + qtyW + 3 + hargaW);
      lines.push(label + " | " + fmt(totalGrp).padStart(subW));
      if (groupTotals[grp] !== undefined) groupTotals[grp] += totalGrp;
    });
  });

  const summaryGroups = [
    "ORDER KE HIGH TABEL",
    "ORDER KE ALLSTAR",
    "ORDER KE BOA",
    "ORDER KE 4BLOODS",
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
function showAlert(message, type = "info") {
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
  if (!list) return;
  list.innerHTML = '<div class="text-center p-2">Loading...</div>';
  
  const { data, error } = await supabase
    .from("members")
    .select("id, nama, is_hangaround")
    .order("nama", { ascending: true });

  if (error || !data) {
    list.innerHTML = '<div class="text-center p-2 text-red-500">Gagal memuat member</div>';
    return;
  }

  if (data.length === 0) {
    list.innerHTML = '<div class="text-center p-2 text-gray-500">Belum ada member</div>';
    return;
  }

  list.innerHTML = data.map(m => `
    <div class="flex items-center justify-between p-2 bg-[#fffbf0] dark:bg-[#0a0805] rounded border border-[#f3e8d8] dark:border-[#3d342d]">
      <div>
        <div class="font-semibold text-sm text-[#1a1410] dark:text-[#fef3c7]">${m.nama}</div>
        <div class="text-xs text-slate-500 dark:text-slate-400">${m.is_hangaround ? 'Hangaround' : 'Member'}</div>
      </div>
      <button class="text-red-500 hover:text-red-700 px-2 py-1 text-xs border border-red-500 rounded" onclick="deleteMember('${m.id}', '${m.nama.replace(/'/g, "\\'")}')">
        Hapus
      </button>
    </div>
  `).join("");
}

window.deleteMember = async function(id, name) {
  // 0. Check session
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    showAlert("Harus login untuk menghapus member", "error");
    return;
  }

  // 1. Check for existing orders
  const { count, error: countErr } = await supabase
    .from("orders")
    .select("*", { count: 'exact', head: true })
    .eq("member_id", id);
    
  let confirmMsg = `Yakin ingin menghapus member "${name}"?`;
  if (count && count > 0) {
    confirmMsg = `Member "${name}" memiliki ${count} history order.\n\nMenghapus member ini akan MENGHAPUS SEMUA history ordernya.\n\nApakah Anda yakin ingin melanjutkan?`;
  }

  if (!confirm(confirmMsg)) return;
  
  // 2. Delete orders if any
  if (count && count > 0) {
    const { error: delOrderErr } = await supabase
      .from("orders")
      .delete()
      .eq("member_id", id);
      
    if (delOrderErr) {
      showAlert("Gagal menghapus history order: " + delOrderErr.message, "error");
      return;
    }
  }
  
  // 3. Delete member
  const { error } = await supabase
    .from("members")
    .delete()
    .eq("id", id);

  if (error) {
    showAlert("Gagal menghapus member dari database: " + error.message, "error");
  } else {
    // 4. Double check deletion
    const { count: checkCount } = await supabase
      .from("members")
      .select("*", { count: 'exact', head: true })
      .eq("id", id);
      
    if (checkCount === 0) {
        showAlert("Member dan datanya berhasil dihapus permanen.", "success");
        loadMemberListInModal();
        updateDashNameSuggestions();
        loadDashboard(true);
    } else {
        showAlert("Gagal: Member masih ada di database. Cek permission/RLS.", "error");
    }
  }
}

