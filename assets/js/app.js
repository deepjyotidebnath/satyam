/* ===== CONFIG: edit these ===== */
const CFG = {
  name: "Hotel Satyam Sundaram",
  nameBn: "হোটেল সত্যম সুন্দরম",
  tagline: "Family Restaurant · Cooch Behar — unlimited rice specials, tandoor naan, paneer & chicken curries.",
  whatsapp: "918670165764",           // country code + number, no + or spaces
  phone: "+91 86701 65764",
  phone2: "+91 92051 82984",
  address: "8CGX+JC5, Raj Rajendra Narayan Rd (N.N. Road), Cooch Behar, West Bengal 736101",
  lat: 26.3265048, lng: 89.4486212,
  mapsUrl: "https://www.google.com/maps/place/Satyam+Sundaram+Hotel/@26.3265048,89.4486212,17z/data=!4m6!3m5!1s0x39e2ff24aecf9dd1:0xd4813d292953a45e!8m2!3d26.3265048!4d89.4486212",
  hours: [["Monday – Sunday","10:00 AM – 10:00 PM"]],
  openHour: 10, closeHour: 22,
  currency: "₹"
};

/* ===== MENU: img = file inside assets/images/; price null = confirmed on WhatsApp ===== */
const MENU = {
  "Unlimited Rice Specials": [
    {name:"Chicken Biryani", desc:"Unlimited rice · served with chicken", price:110, veg:false, img:"table-meal.jpg", tag:"Unlimited"},
    {name:"Kashmiri Pulao", desc:"Unlimited pulao with 3 pc chicken", price:120, veg:false, img:"basanti-pulao.jpg", tag:"Unlimited"},
    {name:"Basanti Pulao", desc:"Bengali sweet saffron pulao with 3 pc chicken", price:120, veg:false, img:"basanti-pulao.jpg", tag:"Unlimited"},
    {name:"Bengali Fried Rice", desc:"Unlimited fried rice with 3 pc chicken", price:100, veg:false, img:"fried-rice.jpg", tag:"Unlimited"},
    {name:"Veg Fried Rice", desc:"Unlimited veg fried rice with 3 pc chicken", price:100, veg:false, img:"fried-rice.jpg", tag:"Unlimited"},
    {name:"Jeera Rice", desc:"Unlimited jeera rice with 3 pc chicken", price:100, veg:false, img:"table-meal.jpg", tag:"Unlimited"}
  ],
  "Curries": [
    {name:"Paneer Butter Masala", desc:"Soft paneer in rich, creamy tomato-butter gravy", price:null, veg:true, img:"paneer-butter-masala.jpg"},
    {name:"Chicken Curry", desc:"Home-style chicken curry, best with naan or rice", price:null, veg:false, img:"chicken-curry.jpg"},
    {name:"Chicken Bharta", desc:"Shredded chicken in a rich egg-onion masala", price:null, veg:false, img:"naan-curries.jpg"}
  ],
  "Breads": [
    {name:"Butter Naan", desc:"Fresh from our tandoor, brushed with butter", price:null, veg:true, img:"butter-naan.jpg"},
    {name:"Masala Kulcha", desc:"Stuffed, spiced tandoor bread", price:null, veg:true, img:"naan-curries.jpg"}
  ]
};
const ALSO = ["Chowmein","Egg Roll","Paneer dishes","Tandoori items","Takeaway thalis"];

const GALLERY = [
  ["hero-signboard.jpg","Our signboard & special menu"],
  ["storefront-night.jpg","Front counter at night"],
  ["storefront-day.jpg","On Raj Rajendra Narayan Road"],
  ["tandoor-kitchen.jpg","Our tandoor kitchen"],
  ["table-meal.jpg","Unlimited rice meal"],
  ["basanti-pulao.jpg","Basanti pulao & chicken curry"],
  ["naan-curries.jpg","Naan, kulcha & curries"],
  ["butter-naan.jpg","Butter naan"],
  ["chicken-curry.jpg","Chicken curry"],
  ["storefront-street.jpg","Easy to spot from the street"]
];

/* ===== helpers ===== */
const $ = id => document.getElementById(id);
const IMG_DIR = "assets/images/";
const PLACEHOLDER = IMG_DIR + "placeholder.svg";
const money = n => n == null ? "Price on request" : CFG.currency + n.toLocaleString("en-IN");
const esc = s => String(s).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const dialog = $("dlg");
const params = new URLSearchParams(location.search);
const table = params.get("table");

/* ===== static content ===== */
document.title = CFG.name + " — Family Restaurant, Cooch Behar";
$("bnName").textContent = CFG.nameBn;
$("brand").textContent = CFG.name;
$("hName").textContent = CFG.name;
$("tag").textContent = CFG.tagline;
$("addr").textContent = CFG.address;
$("mapBtn").href = CFG.mapsUrl;
$("ratingChip").href = CFG.mapsUrl;
$("dirBtn").href = "https://www.google.com/maps/dir/?api=1&destination=" + encodeURIComponent("Satyam Sundaram Hotel, Raj Rajendra Narayan Rd, Cooch Behar");
$("mapFrame").src = "https://maps.google.com/maps?q=" + encodeURIComponent("Satyam Sundaram Hotel, Raj Rajendra Narayan Rd, Cooch Behar") + "&ll=" + CFG.lat + "," + CFG.lng + "&z=17&output=embed";
$("heroCall").href = "tel:" + CFG.phone.replace(/\s/g, "");
$("callBtn2").href = "tel:" + CFG.phone2.replace(/\s/g, "");
$("callBtn2").textContent = "Call " + CFG.phone2;
$("waBtn").href = "https://wa.me/" + CFG.whatsapp;
(function openNow() {
  const ist = new Date(Date.now() + (new Date().getTimezoneOffset() + 330) * 60000), h = ist.getHours();
  $("openChip").textContent = (h >= CFG.openHour && h < CFG.closeHour ? "● Open now" : "● Closed now") + " · Daily 10 AM – 10 PM";
})();
$("callBtn").href = "tel:" + CFG.phone.replace(/\s/g, "");
$("callBtn").textContent = "Call " + CFG.phone;
$("hours").innerHTML = CFG.hours.map(h => `<tr><td>${h[0]}</td><td>${h[1]}</td></tr>`).join("");
$("foot").innerHTML = `© ${new Date().getFullYear()} ${esc(CFG.name)} (${esc(CFG.nameBn)}) · ${esc(CFG.address)} · <a href="tel:${CFG.phone.replace(/\s/g, "")}">${esc(CFG.phone)}</a><br><span class="small">Photos shared by guests on Google Maps.</span>`;
if (table) { $("tableBadge").style.display = "inline-block"; $("tableBadge").textContent = "Table " + table; }

/* image fallback: any <img> that fails to load gets the placeholder */
document.addEventListener("error", e => {
  const t = e.target;
  if (t.tagName === "IMG" && !t.dataset.failed) { t.dataset.failed = "1"; t.src = PLACEHOLDER; }
}, true);

/* ===== menu + cart ===== */
const cart = {};                       // name -> {price, qty}
let activeTab = Object.keys(MENU)[0];

function renderTabs() {
  $("tabs").innerHTML = Object.keys(MENU)
    .map(t => `<button class="${t === activeTab ? "on" : ""}" data-tab="${esc(t)}">${esc(t)}</button>`).join("");
}
function renderItems() {
  $("items").innerHTML = MENU[activeTab].map(i => {
    const q = cart[i.name] ? cart[i.name].qty : 0;
    const ctl = q
      ? `<div class="qty"><button data-act="dec" data-n="${esc(i.name)}">−</button><b>${q}</b><button data-act="inc" data-n="${esc(i.name)}">+</button></div>`
      : `<button class="add" data-act="inc" data-n="${esc(i.name)}">Add</button>`;
    return `<article class="card">
      <img class="dish-img" src="${IMG_DIR + i.img}" alt="${esc(i.name)}" loading="lazy" width="104" height="104">
      <div class="info">
        <h3><span class="dot ${i.veg ? "veg" : "nonveg"}" title="${i.veg ? "Vegetarian" : "Non-vegetarian"}"></span>${esc(i.name)}${i.tag ? `<span class="tag">${esc(i.tag)}</span>` : ""}</h3>
        <p>${esc(i.desc)}</p>
        ${i.price == null ? `<span class="ask">Price on request</span>` : `<span class="price">${money(i.price)}</span>`}
      </div>
      ${ctl}
    </article>`;
  }).join("");
}
function findItem(n) { for (const k in MENU) { const f = MENU[k].find(x => x.name === n); if (f) return f; } }

function updateCart() {
  const lines = Object.entries(cart);
  const count = lines.reduce((s, [, v]) => s + v.qty, 0);
  const total = lines.reduce((s, [, v]) => s + v.qty * (v.price || 0), 0);
  const unpriced = lines.some(([, v]) => v.price == null);
  $("totNote").textContent = unpriced ? "Some items are priced on confirmation — we'll reply with the final bill." : "";
  $("cart").classList.toggle("show", count > 0);
  $("cartTxt").textContent = count + (count === 1 ? " item" : " items") + " · " + money(total);
  $("lines").innerHTML = lines.map(([n, v]) =>
    `<div class="line"><span>${v.qty} × ${esc(n)}</span><span>${v.price == null ? "—" : money(v.qty * v.price)}</span></div>`).join("");
  $("tot").textContent = money(total) + (unpriced ? " +" : "");
  if (!count && dialog.open) dialog.close();
}

$("tabs").addEventListener("click", e => {
  const b = e.target.closest("button[data-tab]"); if (!b) return;
  activeTab = b.dataset.tab; renderTabs(); renderItems();
});
$("items").addEventListener("click", e => {
  const b = e.target.closest("button[data-act]"); if (!b) return;
  const n = b.dataset.n, it = findItem(n);
  if (b.dataset.act === "inc") { cart[n] = cart[n] || {price: it.price, qty: 0}; cart[n].qty++; }
  else if (cart[n] && --cart[n].qty <= 0) delete cart[n];
  renderItems(); updateCart();
});
$("cartBtn").onclick = () => dialog.showModal();

$("send").onclick = () => {
  const lines = Object.entries(cart);
  if (!lines.length) return;
  const total = lines.reduce((s, [, v]) => s + v.qty * (v.price || 0), 0);
  const unpriced = lines.some(([, v]) => v.price == null);
  let msg = `*New order — ${CFG.name}*\n`;
  if (table) msg += `Table: ${table}\n`;
  msg += `Name: ${$("oname").value || "-"}\nType: ${$("otype").value}\n\n`;
  msg += lines.map(([n, v]) => `${v.qty} x ${n} — ${v.price == null ? "price?" : money(v.qty * v.price)}`).join("\n");
  msg += `\n\n*Total: ${money(total)}${unpriced ? " + items priced on confirmation" : ""}*`;
  if ($("onote").value.trim()) msg += `\nNotes: ${$("onote").value.trim()}`;
  window.open("https://wa.me/" + CFG.whatsapp + "?text=" + encodeURIComponent(msg), "_blank");
};

/* ===== reservation ===== */
const rf = $("rf");
(function initForm() {
  const t = rf.elements.time;
  for (let h = 10; h <= 21; h++) for (const m of ["00", "30"]) {
    if (h === 21 && m === "30") continue;
    const hh = h > 12 ? h - 12 : h, ap = h >= 12 ? "PM" : "AM";
    t.insertAdjacentHTML("beforeend", `<option>${hh}:${m} ${ap}</option>`);
  }
  const g = rf.elements.guests;
  for (let i = 1; i <= 12; i++) g.insertAdjacentHTML("beforeend", `<option value="${i}">${i} ${i === 1 ? "guest" : "guests"}</option>`);
  g.value = "2";
  const today = new Date(); today.setMinutes(today.getMinutes() - today.getTimezoneOffset());
  rf.elements.date.min = today.toISOString().slice(0, 10);
})();
rf.addEventListener("submit", e => {
  e.preventDefault();
  const f = rf.elements;
  const msg = `*Table reservation — ${CFG.name}*\nName: ${f.name.value}\nPhone: ${f.phone.value}\nDate: ${f.date.value}\nTime: ${f.time.value}\nGuests: ${f.guests.value}\nSeating: ${f.seat.value}` +
    (f.note.value.trim() ? `\nRequest: ${f.note.value.trim()}` : "");
  window.open("https://wa.me/" + CFG.whatsapp + "?text=" + encodeURIComponent(msg), "_blank");
  $("rok").textContent = "Opening WhatsApp — send the message to confirm your booking.";
});

/* ===== gallery ===== */
$("gal").innerHTML = GALLERY.map(([f, c]) =>
  `<figure><img src="${IMG_DIR + f}" alt="${esc(c)} — ${esc(CFG.name)}, Cooch Behar" loading="lazy"><figcaption>${esc(c)}</figcaption></figure>`).join("");
$("also").innerHTML = `<h3>Also available</h3>` + ALSO.map(a => `<span class="pill">${esc(a)}</span>`).join("");

/* lightbox for gallery + dish photos */
const lb = document.createElement("div"); lb.className = "lb"; lb.innerHTML = "<img alt=''><p></p>"; document.body.appendChild(lb);
lb.onclick = () => lb.classList.remove("show");
document.addEventListener("keydown", e => { if (e.key === "Escape") lb.classList.remove("show"); });
document.addEventListener("click", e => {
  const im = e.target.closest("#gal img, .dish-img"); if (!im) return;
  lb.querySelector("img").src = im.src; lb.querySelector("p").textContent = im.alt; lb.classList.add("show");
});

/* ===== table QR ===== */
function drawQR() {
  const n = Math.max(1, parseInt($("tnum").value, 10) || 1);
  const url = location.origin + location.pathname + "?table=" + n;
  $("qrUrl").textContent = url;
  $("qr").innerHTML = "";
  if (typeof QRCode === "undefined") { $("qr").textContent = "QR library failed to load (check internet)."; return; }
  new QRCode($("qr"), {text: url, width: 200, height: 200});
}
$("tnum").addEventListener("input", drawQR);
$("dl").onclick = () => {
  const c = $("qr").querySelector("canvas"), im = $("qr").querySelector("img");
  const a = document.createElement("a");
  a.download = "table-" + $("tnum").value + "-qr.png";
  a.href = c ? c.toDataURL("image/png") : (im ? im.src : "");
  if (a.href) a.click();
};

/* ===== init ===== */
renderTabs(); renderItems(); updateCart(); drawQR();
