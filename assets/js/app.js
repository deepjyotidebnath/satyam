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

/* ===== live tables + booking ===== */
const rf = $("rf");
const STATUS_TXT = {free: "Free", booked: "Booked", occupied: "Occupied", cleaning: "Being cleaned"};
let lastUpdate = 0;
const ago = t => { const s = Math.round((Date.now() - t) / 1000); return s < 60 ? "just now" : s < 3600 ? Math.round(s / 60) + " min ago" : Math.round(s / 3600) + " h ago"; };

async function renderLive() {
  try {
    const v = await RM.getPublic();
    lastUpdate = v.updatedAt;
    const c = v.counts;
    $("liveSum").innerHTML = `<b class="c-free">${c.free}</b> free · <b class="c-booked">${c.booked}</b> booked · <b class="c-occupied">${c.occupied}</b> occupied · <b class="c-cleaning">${c.cleaning}</b> being cleaned` +
      (v.open ? "" : ` <span class="small">· Restaurant is closed now — you can still book for later.</span>`);
    $("liveGrid").innerHTML = v.tables.map(t =>
      `<div class="tile ${t.status}${table && +table === t.id ? " me" : ""}"><b>T${t.id}</b><span>${t.seats} seats</span><em>${STATUS_TXT[t.status]}</em></div>`).join("");
    $("liveUpd").innerHTML = (RM.mode === "local" ? "Demo mode · " : "<span class=\"live-on\">● Live</span> · ") + "updated " + ago(lastUpdate);
  } catch (e) { $("liveUpd").textContent = "Could not load table status."; }
}

async function renderPick() {
  const f = rf.elements;
  f.table.value = "";
  updateBookBtn();
  if (!f.date.value || !f.time.value) { $("pickGrid").innerHTML = ""; $("pickInfo").textContent = "Choose a date and time first"; return; }
  try {
    const list = await RM.availability({date: f.date.value, time: f.time.value, guests: f.guests.value});
    const n = list.filter(t => t.available).length;
    $("pickInfo").textContent = n ? `${n} table${n > 1 ? "s" : ""} free for ${f.guests.value} at ${f.time.selectedOptions[0].text}` : "No table free at this time — try another time.";
    $("pickGrid").innerHTML = list.map(t => t.available
      ? `<button type="button" class="tile free" data-t="${t.id}"><b>T${t.id}</b><span>${t.seats} seats</span><em>Free</em></button>`
      : `<div class="tile off"><b>T${t.id}</b><span>${t.seats} seats</span><em>${esc(t.reason)}</em></div>`).join("");
  } catch (e) { $("pickInfo").textContent = e.message; $("pickGrid").innerHTML = ""; }
}
function updateBookBtn() {
  const t = rf.elements.table.value;
  $("bookBtn").disabled = !t;
  $("bookBtn").textContent = t ? `Book Table ${t}` : "Select a table";
}

(function initForm() {
  const t = rf.elements.time;
  RMCore.slots().forEach(s => t.insertAdjacentHTML("beforeend", `<option value="${s}">${RMCore.fmtTime(s)}</option>`));
  const g = rf.elements.guests;
  for (let i = 1; i <= 12; i++) g.insertAdjacentHTML("beforeend", `<option value="${i}">${i} ${i === 1 ? "guest" : "guests"}</option>`);
  g.value = "2";
  const now = RMCore.ist(Date.now());
  rf.elements.date.min = rf.elements.date.value = now.date;
  const next = RMCore.slots().find(s => +s.slice(0, 2) * 60 + +s.slice(3) >= now.min + 30);
  if (next) t.value = next; else { const d = new Date(Date.now() + (RMCore.TZ_MIN + 1440) * 60000); rf.elements.date.value = d.toISOString().slice(0, 10); }
})();
["date", "time", "guests"].forEach(n => rf.elements[n].addEventListener("change", renderPick));
$("pickGrid").addEventListener("click", e => {
  const b = e.target.closest("button[data-t]"); if (!b) return;
  $("pickGrid").querySelectorAll(".sel").forEach(x => x.classList.remove("sel"));
  b.classList.add("sel"); rf.elements.table.value = b.dataset.t; updateBookBtn();
});
rf.addEventListener("submit", async e => {
  e.preventDefault();
  const f = rf.elements;
  $("rerr").textContent = "";
  if (!f.table.value) { $("rerr").textContent = "Please choose a table."; return; }
  $("bookBtn").disabled = true; $("bookBtn").textContent = "Booking…";
  try {
    const b = await RM.book({name: f.name.value, phone: f.phone.value, date: f.date.value, time: f.time.value, guests: f.guests.value, table: f.table.value, note: f.note.value});
    const when = `${b.date} at ${RMCore.fmtTime(b.time)}`;
    const msg = `*Table booking — ${CFG.name}*\nBooking ID: ${b.id}\nTable: ${b.table}\nName: ${b.name}\nPhone: ${b.phone}\nDate: ${b.date}\nTime: ${RMCore.fmtTime(b.time)}\nGuests: ${b.guests}` + (b.note ? `\nRequest: ${b.note}` : "");
    $("rok").hidden = false;
    $("rok").innerHTML = `<h3>Table ${b.table} is booked!</h3><p class="sans">Booking ID <b>${esc(b.id)}</b> · ${esc(b.name)} · ${b.guests} guests · ${esc(when)}</p>
      <p class="sans small">Please arrive on time — we hold the table for you for 90 minutes. Need to change anything? Call ${esc(CFG.phone)}.</p>
      <a class="btn wa" target="_blank" rel="noopener" href="https://wa.me/${CFG.whatsapp}?text=${encodeURIComponent(msg)}">Send confirmation on WhatsApp</a>
      <button class="btn ghost" type="button" id="another">Book another table</button>`;
    rf.hidden = true;
    $("another").onclick = () => { $("rok").hidden = true; rf.hidden = false; renderPick(); };
    $("rok").scrollIntoView({behavior: "smooth", block: "center"});
    renderLive();
  } catch (err) {
    $("rerr").textContent = err.message;
    renderPick();
  }
});
RM.watch(() => { renderLive(); if (!rf.elements.table.value) renderPick(); });
setInterval(() => { if (lastUpdate) $("liveUpd").innerHTML = (RM.mode === "local" ? "Demo mode · " : "<span class=\"live-on\">● Live</span> · ") + "updated " + ago(lastUpdate); }, 15000);
renderLive(); renderPick();

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
