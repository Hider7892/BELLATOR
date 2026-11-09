/* ====== Configuración ====== */
const WHATSAPP = "573000000000"; // Cambia por el número del club (código de país + número, sin + ni espacios)

const PRODUCTS = [
  { id: 1, nombre: "Camiseta de competencia local", tipo: "competencia", precio: 85000, color: "#1565e0" },
  { id: 2, nombre: "Camiseta de competencia visitante", tipo: "competencia", precio: 85000, color: "#ffffff" },
  { id: 3, nombre: "Camiseta del líbero", tipo: "competencia", precio: 85000, color: "#05080f" },
  { id: 4, nombre: "Camiseta de entrenamiento", tipo: "entrenamiento", precio: 55000, color: "#8ec5ff" },
  { id: 5, nombre: "Camiseta de entrenamiento manga larga", tipo: "entrenamiento", precio: 65000, color: "#0a1f44" },
  { id: 6, nombre: "Sudadera del club", tipo: "entrenamiento", precio: 120000, color: "#2b3a5c" }
];

const $ = (s) => document.querySelector(s);
const money = (n) => "$" + n.toLocaleString("es-CO");
const esc = (t) => String(t).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const load = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } };
const save = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };

function toast(msg) {
  const t = $("#toast");
  t.textContent = msg;
  t.classList.add("show");
  setTimeout(() => t.classList.remove("show"), 2200);
}

/* ====== Menú móvil ====== */
$("#menuBtn").onclick = () => {
  const open = $("#nav").classList.toggle("open");
  $("#menuBtn").setAttribute("aria-expanded", open);
};
$("#nav").onclick = () => $("#nav").classList.remove("open");

/* ====== Tienda ====== */
const jersey = (c) => `<svg viewBox="0 0 100 100" aria-hidden="true"><path d="M32 10 40 6q10 8 20 0l8 4 24 14-10 18-10-5v52H28V37l-10 5L8 24z" fill="${c}" stroke="#8ec5ff" stroke-width="2"/></svg>`;

function renderProducts(filter = "todos") {
  const list = PRODUCTS.filter((p) => filter === "todos" || p.tipo === filter);
  $("#products").innerHTML = list.map((p) => `
    <article class="card">
      ${jersey(p.color)}
      <div class="card-b">
        <span class="tag">${p.tipo === "competencia" ? "Competencia" : "Entrenamiento"}</span>
        <h3>${p.nombre}</h3>
        <span class="price">${money(p.precio)}</span>
        <div class="card-f">
          <select aria-label="Talla" id="size-${p.id}">
            <option>S</option><option selected>M</option><option>L</option><option>XL</option>
          </select>
          <button class="btn" data-add="${p.id}">Agregar</button>
        </div>
      </div>
    </article>`).join("");
}

document.querySelectorAll(".chip").forEach((c) => {
  c.onclick = () => {
    document.querySelectorAll(".chip").forEach((x) => x.classList.remove("on"));
    c.classList.add("on");
    renderProducts(c.dataset.f);
  };
});

$("#products").onclick = (e) => {
  const id = e.target.dataset.add;
  if (!id) return;
  const talla = $("#size-" + id).value;
  const found = cart.find((i) => i.id == id && i.talla === talla);
  found ? found.cant++ : cart.push({ id: +id, talla, cant: 1 });
  saveCart();
  toast("Agregado al carrito");
};

/* ====== Carrito ====== */
let cart = load("bellator_cart", []);
const saveCart = () => { save("bellator_cart", cart); renderCart(); };

function renderCart() {
  const total = cart.reduce((s, i) => s + PRODUCTS.find((p) => p.id === i.id).precio * i.cant, 0);
  $("#cartCount").textContent = cart.reduce((s, i) => s + i.cant, 0);
  $("#cartTotal").textContent = money(total);
  $("#cartItems").innerHTML = cart.length
    ? cart.map((i, n) => {
        const p = PRODUCTS.find((x) => x.id === i.id);
        return `<div class="item">
          <div><strong>${p.nombre}</strong><br><small>Talla ${i.talla} · ${money(p.precio)}</small></div>
          <div class="qty">
            <button data-q="${n}" data-d="-1" aria-label="Quitar uno">&minus;</button>
            <span>${i.cant}</span>
            <button data-q="${n}" data-d="1" aria-label="Agregar uno">+</button>
          </div></div>`;
      }).join("")
    : '<p class="empty">Tu carrito está vacío. Agrega uniformes desde la tienda.</p>';
}

$("#cartItems").onclick = (e) => {
  const n = e.target.dataset.q;
  if (n === undefined) return;
  cart[n].cant += +e.target.dataset.d;
  if (cart[n].cant <= 0) cart.splice(n, 1);
  saveCart();
};

function toggleCart(open) {
  $("#drawer").classList.toggle("open", open);
  $("#drawer").setAttribute("aria-hidden", !open);
  $("#shade").hidden = !open;
}
$("#cartBtn").onclick = () => toggleCart(true);
$("#closeCart").onclick = () => toggleCart(false);
$("#shade").onclick = () => toggleCart(false);
document.addEventListener("keydown", (e) => e.key === "Escape" && toggleCart(false));

$("#orderForm").onsubmit = (e) => {
  e.preventDefault();
  if (!cart.length) return toast("Agrega al menos un producto");
  const f = new FormData(e.target);
  let total = 0;
  const lineas = cart.map((i) => {
    const p = PRODUCTS.find((x) => x.id === i.id);
    total += p.precio * i.cant;
    return `- ${i.cant} x ${p.nombre} (talla ${i.talla}) ${money(p.precio * i.cant)}`;
  });
  const msg = `Hola Bellator, quiero hacer este pedido:\n${lineas.join("\n")}\nTotal: ${money(total)}\n\nNombre: ${f.get("cliente")}\nTeléfono: ${f.get("tel")}\nCorreo: ${f.get("correo")}\nEntrega: ${f.get("direccion")}`;
  window.open(`https://wa.me/${WHATSAPP}?text=${encodeURIComponent(msg)}`, "_blank");
  cart = [];
  saveCart();
  e.target.reset();
  toggleCart(false);
  toast("Pedido enviado por WhatsApp");
};

/* ====== Registro de deportistas ====== */
let athletes = load("bellator_athletes", []);

function renderAthletes() {
  const q = $("#search").value.trim().toLowerCase();
  const list = athletes.filter((a) => (a.nombre + " " + a.categoria + " " + a.posicion).toLowerCase().includes(q));
  $("#total").textContent = athletes.length + (athletes.length === 1 ? " deportista" : " deportistas");
  $("#athletes").innerHTML = list.length
    ? list.map((a) => `
      <div class="ath">
        <span class="num">${esc(a.numero || "–")}</span>
        <div><strong>${esc(a.nombre)}</strong>
        <small>${esc(a.posicion)} · ${esc(a.categoria)} · ${esc(a.telefono)}</small></div>
        <button class="del" data-del="${a.id}" aria-label="Eliminar a ${esc(a.nombre)}">Eliminar</button>
      </div>`).join("")
    : `<p class="empty">${athletes.length ? "No hay resultados para tu búsqueda." : "Aún no hay deportistas registrados. Completa el formulario para inscribir al primero."}</p>`;
}

$("#athleteForm").onsubmit = (e) => {
  e.preventDefault();
  const a = Object.fromEntries(new FormData(e.target));
  a.id = Date.now();
  athletes.push(a);
  save("bellator_athletes", athletes);
  e.target.reset();
  renderAthletes();
  toast("Deportista guardado");
};

$("#athletes").onclick = (e) => {
  const id = e.target.dataset.del;
  if (!id || !confirm("¿Eliminar a este deportista del registro?")) return;
  athletes = athletes.filter((a) => a.id != id);
  save("bellator_athletes", athletes);
  renderAthletes();
};
$("#search").oninput = renderAthletes;

/* ====== Inicio ====== */
renderProducts();
renderCart();
renderAthletes();
