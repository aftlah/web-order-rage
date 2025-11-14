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

function fmt(n) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(n);
}

function init() {
  if (!window.SUPABASE_URL || !window.SUPABASE_ANON_KEY) return;
  const kategoriEl = document.getElementById("kategori");
  const itemEl = document.getElementById("item");
  Object.keys(CATALOG).forEach((k) => {
    const o = document.createElement("option");
    o.value = k;
    o.textContent = k;
    kategoriEl.appendChild(o);
  });
  kategoriEl.addEventListener("change", () => populateItems());
  populateItems();
  document.getElementById("addBtn").addEventListener("click", addToCart);
  document.getElementById("submitBtn").addEventListener("click", submitOrder);
  setupCustomerSearch();
  seedCustomers();
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
  const orderanke = (document.getElementById("orderanke") || {}).value || "";
  if (!nama) {
    //  statusEl.textContent = "Nama pemesan wajib diisi";
    showAlert("Nama pemesan wajib diisi", "error");
    return;
  }
  if (!orderanke) {
    //  statusEl.textContent = "Pilih nomor order";
    showAlert("Pilih nomor order", "error");
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
  const hiddenEl = document.getElementById("memberId");
  let member_id = parseInt((hiddenEl && hiddenEl.value) || "", 10);
  if (!member_id || Number.isNaN(member_id)) {
    const { data: found, error: findErr } = await supabase
      .from("members")
      .select("id")
      .eq("nama", nama)
      .limit(1);
    if (!findErr && found && found.length) {
      member_id = found[0].id;
    } else {
      //  statusEl.textContent = "Nama yang diinput tidak ada di database";
      showAlert("Nama tidak ditemukan di database", "error");
      return;
    }
    if (hiddenEl) hiddenEl.value = String(member_id);
  }
  const orderId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const rows = state.cart.map((c) => ({
    order_id: orderId,
    member_id,
    nama,
    orderanke: parseInt(orderanke, 10),
    waktu: new Date().toISOString(),
    kategori: c.kategori,
    item: c.item,
    harga: c.price,
    qty: c.qty,
    subtotal: c.price * c.qty,
  }));
  try {
    const { error } = await supabase.from("orders").insert(rows).select("id");
    if (error) {
      const hint = (error.hint || "").includes("apikey")
        ? ". Periksa SUPABASE_ANON_KEY di config.js"
        : "";
      //  statusEl.textContent = `Gagal menyimpan: ${error.message || "unknown"}${hint}`;
      showAlert(
        `Gagal menyimpan: ${error.message || "unknown"}${hint}`,
        "error"
      );
      return;
    }
    //   statusEl.textContent = "Berhasil disimpan";
    showAlert("Berhasil disimpan", "success");
    state.cart = [];
    renderCart();
  } catch (e) {
    // statusEl.textContent = "Gagal menyimpan (network error)";
    showAlert("Gagal menyimpan (network error)", "error");
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
