import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm'

const CATALOG = {
  Gun: [
    { name: "PISTOL .50", price: 9100 },
    { name: "CERAMIC PISTOL", price: 26000 },
    { name: "TECH 9", price: 26000 },
    { name: "MINI SMG", price: 29900 },
    { name: "MICRO SMG", price: 29900 },
    { name: "SMG", price: 39000 },
    { name: "SHOTGUN", price: 39000 },
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
    { name: "Extended Rifle Clip", price: 5000 },
    { name: "SMG Drum", price: 10000 },
    { name: "Rifle Drum", price: 20000 },
    { name: "Macro Scope", price: 3000 },
    { name: "Medium Scope", price: 3000 },
  ],
  Others: [
    { name: "VEST", price: 2600 },
    { name: "VEST MEDIUM", price: 1300 },
    { name: "LOCKPICK", price: 3000 },
    { name: "TABLET HEIST", price: 10900 },
  ],
};

const state = { cart: [] };

function fmt(n) {
  return '$' + n.toLocaleString('en-US');
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
  const tbody = document.querySelector("#cartTable tbody");
  tbody.innerHTML = "";
  let total = 0;
  state.cart.forEach((c, idx) => {
    const tr = document.createElement("tr");
    const subtotal = c.price * c.qty;
    total += subtotal;
    tr.innerHTML = `
      <td class="py-2">${c.item}</td>
      <td class="py-2">${c.kategori}</td>
      <td class="py-2">${fmt(c.price)}</td>
      <td class="py-2">${c.qty}</td>
      <td class="py-2">${fmt(subtotal)}</td>
      <td class="py-2"><button class="px-2 py-1 rounded bg-red-600 hover:bg-red-700 text-white" data-idx="${idx}">Hapus</button></td>
    `;
    tbody.appendChild(tr);
  });
  document.getElementById("totalAmount").textContent = fmt(total);
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
    statusEl.textContent = "Nama pemesan wajib diisi";
    return;
  }
  if (!orderanke) {
    statusEl.textContent = "Pilih nomor order";
    return;
  }
  if (state.cart.length === 0) {
    statusEl.textContent = "Keranjang kosong";
    return;
  }
  statusEl.textContent = "Menyimpan...";
  const supabase = createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY);
  const orderId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const rows = state.cart.map((c) => ({
    order_id: orderId,
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
    const { error } = await supabase.from("orders").insert(rows);
    if (error) {
      statusEl.textContent = "Gagal menyimpan";
      return;
    }
    statusEl.textContent = "Berhasil disimpan";
    state.cart = [];
    renderCart();
  } catch (e) {
    statusEl.textContent = "Gagal menyimpan (network error)";
  }
}

document.addEventListener("DOMContentLoaded", init);
