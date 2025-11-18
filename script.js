import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";
const supabase =
  window.SUPABASE_URL && window.SUPABASE_ANON_KEY
    ? createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY)
    : null;

const CATALOG = {
  Gun: [
    { name: "PISTOL .50", price: 9100 },
    { name: "CERAMIC PISTOL", price: 26000 },
    { name: "TECH 9", price: 26000 },
    { name: "MINI SMG", price: 29900 },
    { name: "MICRO SMG", price: 29900 },
    { name: "SMG", price: 39000 },
    { name: "SHOTGUN", price: 65000 },
    { name: "NAVY REVOLVER", price: 71500 },
    { name: "PISTOL X17", price: 32500 },
    { name: "BLACK REVOLVER", price: 91000 },
    { name: "KVR", price: 78000 },
  ],
  Ammo: [
    { name: "AMMO 9MM", price: 2730 },
    { name: "AMMO 44 MAGNUM", price: 5200 },
    { name: "AMMO 0.45", price: 5200 },
    { name: "AMMO 12 GAUGE", price: 6500 },
    { name: "AMMO .50", price: 750 },
  ],
  Attachment: [
    { name: "Tactical Flashlight", price: 3000 },
    { name: "Suppressor", price: 10000 },
    { name: "Tactical Suppressor", price: 10000 },
    { name: "Grip", price: 3000 },
    { name: "Extended Pistol Clip", price: 3000 },
    { name: "Extended SMG Clip", price: 5000 },
    { name: "Extended Rifle Clip", price: 15000 },
    { name: "SMG Drum", price: 10000 },
    { name: "Rifle Drum", price: 20000 },
    { name: "Macro Scope", price: 3000 },
    { name: "Medium Scope", price: 3000 },
  ],
  Others: [
    { name: "VEST", price: 2600 },
    { name: "VEST MEDIUM", price: 1300 },
    { name: "LOCKPICK", price: 1300 },
    { name: "TABLET HEIST", price: 4000 },
  ],
};

const state = { cart: [] };
const dashboardCache = { orders: null, lastFetch: 0 };
const DASH_CACHE_KEY = "dashboardOrdersCacheV1";
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
function saveStoredDashboard(data) {
  try {
    localStorage.setItem(DASH_CACHE_KEY, JSON.stringify({ ts: Date.now(), data }));
  } catch (e) {}
}

function fmt(n) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(n);
}

function init() {
  if (!window.SUPABASE_URL || !window.SUPABASE_ANON_KEY) return;
  const isOrder =
    !!document.getElementById("orderSection") ||
    !!document.getElementById("nama") ||
    !!document.getElementById("kategori");
  const isDashboard =
    !!document.getElementById("dashboardSection") ||
    !!document.getElementById("dashboardBody") ||
    !!document.getElementById("dashMonth");
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
    seedCustomers();
    setOrderNoUI();
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
      const active = isIndex ? href.endsWith("index.html") : href.endsWith("dashboard.html");
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

function addToCart() {
  const nama = document.getElementById("nama").value.trim();
  const kategori = document.getElementById("kategori").value;
  const itemName = document.getElementById("item").value;
  const qty = parseInt(document.getElementById("qty").value, 10) || 1;
  if (!itemName || !kategori || qty < 1) return;
  const item = CATALOG[kategori].find((i) => i.name === itemName);
  const existing = state.cart.find(
    (c) => c.item === itemName && c.kategori === kategori
  );
  if (existing) existing.qty += qty;
  else state.cart.push({ item: itemName, kategori, price: item.price, qty });
  renderCart();
}

function renderCart() {
  const tbody = document.getElementById("cartBody");
  const emptyEl = document.getElementById("emptyState");
  tbody.innerHTML = "";
  let total = 0;
  state.cart.forEach((c, idx) => {
    const tr = document.createElement("tr");
    const subtotal = c.price * c.qty;
    total += subtotal;
    tr.innerHTML = `
      <td class="px-4 py-3">${c.item}</td>
      <td class="px-4 py-3">${c.kategori}</td>
      <td class="px-4 py-3 text-right">${fmt(c.price)}</td>
      <td class="px-4 py-3 text-center">${c.qty}</td>
      <td class="px-4 py-3 text-right">${fmt(subtotal)}</td>
      <td class="px-4 py-3 text-center"><button class="px-3 py-1 rounded-lg border-2 border-yellow-600 text-yellow-300 hover:bg-yellow-900/30 transition" data-idx="${idx}">Hapus</button></td>
    `;
    tbody.appendChild(tr);
  });
  document.getElementById("totalAmount").textContent = fmt(total);
  document.getElementById("total-items").textContent = state.cart.reduce(
    (a, c) => a + c.qty,
    0
  );
  if (emptyEl) emptyEl.classList.toggle("hidden", state.cart.length > 0);
  tbody.querySelectorAll("button[data-idx]").forEach((b) =>
    b.addEventListener("click", (e) => {
      const i = parseInt(e.currentTarget.getAttribute("data-idx"), 10);
      state.cart.splice(i, 1);
      renderCart();
    })
  );
}

async function submitOrder() {
  const statusEl = document.getElementById("status");
  const nama = document.getElementById("nama").value.trim();
  const { value: computedOrderNo } = computeOrderNo();
  if (!nama) {
    showAlert("Nama pemesan wajib diisi", "error");
    return;
  }
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
  let member_id =
    !Number.isNaN(memberIdFromHidden) && memberIdFromHidden
      ? memberIdFromHidden
      : await getMemberIdByName(nama);
  if (!member_id) {
    showAlert("Nama tidak ditemukan di database", "error");
    endLoading();
    return;
  }
  const orderId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const rows = buildOrderRows(orderId, member_id, nama, computedOrderNo);
  try {
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
    renderCart();
    endLoading();
  } catch (e) {
    // statusEl.textContent = "Gagal menyimpan (network error)";
    showAlert("Gagal menyimpan (network error)", "error");
    endLoading();
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
function setOrderNoUI() {
  const { value, label } = computeOrderNo();
  const display = document.getElementById("orderNo");
  const hidden = document.getElementById("orderankeHidden");
  if (display) display.value = `${label} (#${value})`;
  if (hidden) hidden.value = String(value);
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
  }));
}
async function insertOrders(rows) {
  return await supabase.from("orders").insert(rows).select("id");
}
async function fetchOrders(limit = 500) {
  return await supabase
    .from("orders")
    .select("order_id,nama,orderanke,waktu,kategori,item,harga,qty,subtotal")
    .order("waktu", { ascending: false })
    .limit(limit);
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
  input.addEventListener("input", (e) => run(e.target.value.trim()));
  input.addEventListener("focus", () => run(""));
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
async function seedCustomers() {
  if (!supabase || !window.SEED_CUSTOMERS) return;
  const done = localStorage.getItem("customersSeeded") === "1";
  if (done) return;
  const names = Array.from(
    new Set(
      (window.SEED_CUSTOMERS || []).map((n) => (n || "").trim()).filter(Boolean)
    )
  );
  if (names.length === 0) return;
  const rows = names.map((n) => ({ nama: n }));
  const { error } = await supabase
    .from("members")
    .upsert(rows, { onConflict: "nama" });
  if (!error) localStorage.setItem("customersSeeded", "1");
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
function renderDashboard(groups) {
  const container = document.getElementById("dashboardBody");
  if (!container) return;
  const keys = Object.keys(groups).sort(
    (a, b) => parseInt(b, 10) - parseInt(a, 10)
  );
  container.innerHTML = keys
    .map((k) => {
      const g = groups[k];
      const month = Math.floor(parseInt(k, 10) / 10);
      const week = parseInt(k, 10) % 10;
      const header = `<div class="mb-4"><h3 class="text-lg font-bold">Batch M${month}-W${week}</h3><p class="text-sm">Orders: ${
        g.count
      } • Total: ${fmt(g.total)}</p></div>`;
      const summaryData = summarizeItems(g.items);
      const summary =
        `<div class=\"rounded-xl border border-[#f3e8d8] dark:border-[#3d342d] p-4 mb-6\"><h4 class=\"text-sm font-semibold mb-2\">Total Qty per Item</h4><div class=\"overflow-x-auto\"><table class=\"w-full text-sm\"><thead><tr><th class=\"text-left px-2 py-2\">Item</th><th class=\"text-right px-2 py-2\">Total Qty</th></tr></thead><tbody>` +
        summaryData
          .map(
            (s) =>
              `<tr class=\"table-row-hover\"><td class=\"px-2 py-2\">${s.item}</td><td class=\"px-2 py-2 text-right\">${s.qty}</td></tr>`
          )
          .join("") +
        `</tbody></table></div></div>`;
      const byName = {};
      g.items.forEach((r) => {
        const key = r.nama || "Unknown";
        (byName[key] ||= []).push(r);
      });
      const nameKeys = Object.keys(byName).sort((a, b) => a.localeCompare(b));
      const rowsHtml = nameKeys
        .map((name) =>
          byName[name]
            .map((r, idx) => {
              const nameCell = idx === 0 ? `<td class="px-2 py-2 align-top" rowspan="${byName[name].length}">${name}</td>` : "";
              return `<tr class=\"table-row-hover\"><td class=\"px-2 py-2\">${r.order_id}</td>${nameCell}<td class=\"px-2 py-2\">${new Date(r.waktu).toLocaleString()}</td><td class=\"px-2 py-2\">${r.item}</td><td class=\"px-2 py-2 text-center\">${r.qty}</td><td class=\"px-2 py-2 text-right\">${fmt(r.subtotal)}</td></tr>`;
            })
            .join("")
        )
        .join("");
      const orderDetails =
        `<div class=\"rounded-xl border border-[#f3e8d8] dark:border-[#3d342d] p-4\"><h4 class=\"text-sm font-semibold mb-2\">Order Details</h4><div class=\"overflow-x-auto\"><table class=\"w-full text-sm\"><thead><tr><th class=\"text-left px-2 py-2\">Order ID</th><th class=\"text-left px-2 py-2\">Nama</th><th class=\"text-left px-2 py-2\">Waktu</th><th class=\"text-left px-2 py-2\">Item</th><th class=\"text-center px-2 py-2\">Qty</th><th class=\"text-right px-2 py-2\">Subtotal</th></tr></thead><tbody>` +
        rowsHtml +
        `</tbody></table></div></div>`;
      return `<div class=\"rounded-xl border border-[#f3e8d8] dark:border-[#3d342d] p-4 mb-4\">${header}</div>${summary}${orderDetails}`;
    })
    .join("");
}
async function loadDashboard(force = false) {
  if (!supabase) return;
  const mSel = document.getElementById("dashMonth");
  const wSel = document.getElementById("dashWeek");
  const nSel = document.getElementById("dashName");
  let data = null;
  if (!force) {
    if (dashboardCache.orders) {
      data = dashboardCache.orders;
    } else {
      const stored = loadStoredDashboard();
      if (stored) {
        data = stored.data;
        dashboardCache.orders = data;
        dashboardCache.lastFetch = stored.ts;
      }
    }
    if (!data) {
      showAlert("Data belum dimuat. Klik Refresh untuk mengambil data.", "info");
      renderDashboard({});
      return;
    }
  } else {
    const { data: fetched, error } = await fetchOrders();
    if (error) {
      showAlert("Gagal memuat dashboard", "error");
      return;
    }
    data = fetched || [];
    dashboardCache.orders = data;
    dashboardCache.lastFetch = Date.now();
    saveStoredDashboard(data);
  }
  const month = mSel ? parseInt(mSel.value, 10) : NaN;
  const weekVal = wSel ? wSel.value : "";
  const nameVal = nSel ? nSel.value.trim() : "";
  const filtered = (data || []).filter((r) => {
    const m = Math.floor((r.orderanke || 0) / 10);
    const w = (r.orderanke || 0) % 10;
    if (month && m !== month) return false;
    if (weekVal && String(w) !== String(weekVal)) return false;
    if (nameVal && String(r.nama || "").toLowerCase() !== nameVal.toLowerCase()) return false;
    return true;
  });
  const groups = groupOrdersByBatch(filtered);
  renderDashboard(groups);
}
function initDashboard() {
  const mSel = document.getElementById("dashMonth");
  const wSel = document.getElementById("dashWeek");
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
  const btn = document.getElementById("refreshDashboard");
  if (btn) btn.addEventListener("click", () => loadDashboard(true));
  if (mSel) mSel.addEventListener("change", () => loadDashboard(false));
  if (wSel) wSel.addEventListener("change", () => loadDashboard(false));
  const nSel = document.getElementById("dashName");
  if (nSel) nSel.addEventListener("change", () => loadDashboard(false));
  loadDashboard(false);
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
