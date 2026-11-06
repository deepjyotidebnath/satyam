/* Manager dashboard */
const $ = id => document.getElementById(id);
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({"&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"}[c]));
const LABEL = {free: "Free", booked: "Booked", occupied: "Occupied", cleaning: "Needs cleaning"};
const mins = t => Math.max(0, Math.round((Date.now() - t) / 60000));
const since = t => { const m = mins(t); return m < 1 ? "just now" : m < 60 ? m + " min" : Math.floor(m / 60) + " h " + (m % 60) + " min"; };
const fmtDate = d => new Date(d + "T00:00:00").toLocaleDateString("en-IN", {weekday: "short", day: "numeric", month: "short"});
let pin = sessionStorage.getItem("rm-pin") || "", V = null, seenAlerts = null, zones = [], statusBy = {}, lastPreds = [];

function toast(msg) { const t = $("toast"); t.textContent = msg; t.classList.add("show"); clearTimeout(t._h); t._h = setTimeout(() => t.classList.remove("show"), 3500); }
function beep() {
  try {
    const a = new (window.AudioContext || window.webkitAudioContext)(), o = a.createOscillator(), g = a.createGain();
    o.frequency.value = 880; o.connect(g); g.connect(a.destination); g.gain.setValueAtTime(.2, a.currentTime);
    g.gain.exponentialRampToValueAtTime(.001, a.currentTime + .5); o.start(); o.stop(a.currentTime + .5);
  } catch {}
}

/* ===== auth ===== */
async function login(p) {
  try { await RM.login(p); pin = p; sessionStorage.setItem("rm-pin", p); $("login").hidden = true; $("app").hidden = false; await refresh(); return true; }
  catch (e) { $("lerr").textContent = e.status === 401 ? "Wrong PIN" : e.message; return false; }
}
$("lf").addEventListener("submit", e => { e.preventDefault(); $("lerr").textContent = ""; login($("pin").value.trim()); });
$("logout").onclick = () => { sessionStorage.removeItem("rm-pin"); location.reload(); };
RM.detect().then(m => { if (m === "local") $("lhint").textContent = "Demo mode (no server found): PIN is 1234. Data is saved in this browser only."; if (pin) login(pin); });

async function act(a, okMsg) {
  try { V = await RM.action(pin, a); render(); if (okMsg) toast(okMsg); }
  catch (e) { toast(e.message); if (e.status === 401) $("logout").click(); }
}

/* ===== render ===== */
async function refresh() {
  if (!pin) return;
  try { V = await RM.getAdmin(pin); render(); } catch (e) { if (e.status === 401) $("logout").click(); }
}
function render() {
  if (!V) return;
  const c = V.counts;
  $("mode").textContent = RM.mode === "live" ? "● LIVE" : "DEMO (this browser)";
  $("mode").className = "mode" + (RM.mode === "live" ? "" : " demo");
  const todaysBk = V.bookings.filter(b => b.date === V.today && b.status !== "cancelled");
  const stat = (v, l, col, cls = "") => `<div class="stat ${cls}" style="--c:${col}"><b>${v}</b><span>${l}</span></div>`;
  $("stats").innerHTML =
    stat(V.visitorsToday, "Customers visited today", "#2b1d16") +
    stat(c.free, "Tables free now", "var(--free)") +
    stat(c.booked, "Tables booked now", "var(--booked)") +
    stat(c.occupied, "Tables occupied", "var(--occupied)") +
    stat(c.cleaning, "Need cleaning", "var(--cleaning)", c.cleaning ? "alert" : "") +
    stat(todaysBk.length, "Bookings today", "#6b4fa0");

  $("floor").innerHTML = V.tables.map(t => {
    const b = t.booking;
    let meta = `${t.seats} seats · ${since(t.since)}${t.source && t.source !== "setup" ? " · via " + esc(t.source) : ""}`, btns = "";
    if (t.status === "free") btns = `<button class="go" data-a="occupied" data-t="${t.id}">Seat walk-in</button><button data-a="cleaning" data-t="${t.id}">Needs cleaning</button>`;
    if (t.status === "booked") { meta = `${esc(b.name)} · ${b.guests} guests · ${RMCore.fmtTime(b.time)}`; btns = `<button class="go" data-bk="${b.id}" data-s="seated">Guests arrived</button><button data-bk="${b.id}" data-s="cancelled">Cancel</button>`; }
    if (t.status === "occupied") btns = `<button class="go" data-a="cleaning" data-t="${t.id}">Customers left</button><button data-a="free" data-t="${t.id}">Free</button>`;
    if (t.status === "cleaning") { meta = esc(t.note || "Waiting " + since(t.since)); btns = `<button class="go" data-a="free" data-t="${t.id}">✓ Cleaned</button>`; }
    return `<div class="dt-tile ${t.status}"><div class="top"><b>T${t.id}</b><span class="st-l">${LABEL[t.status]}</span></div><div class="meta">${meta}</div><div class="btnrow">${btns}</div></div>`;
  }).join("");

  const alerts = V.alerts;
  $("alertN").textContent = alerts.length || "";
  $("alerts").innerHTML = alerts.length ? alerts.map(a =>
    `<li class="${a.type}"><span>${esc(a.msg)}<small>${since(a.at)} ago</small></span>${a.type === "cleaning"
      ? `<button data-a="free" data-t="${a.table}">✓ Cleaned</button>` : `<button data-al="${a.id}">OK</button>`}</li>`).join("")
    : `<li class="empty">All clear — no pending alerts.</li>`;
  const ids = alerts.map(a => a.id);
  if (seenAlerts) {
    const fresh = alerts.filter(a => !seenAlerts.has(a.id));
    if (fresh.length) {
      beep();
      fresh.forEach(a => { if (window.Notification && Notification.permission === "granted") new Notification("Satyam Sundaram", {body: a.msg}); });
      toast(fresh.map(a => a.msg).join(" · "));
    }
  }
  seenAlerts = new Set(ids);

  const upcoming = V.bookings.filter(b => b.status === "confirmed" || b.status === "seated" || b.date === V.today);
  $("bkInfo").textContent = `${todaysBk.length} today · ${V.bookings.filter(b => b.date > V.today && b.status === "confirmed").length} upcoming`;
  $("bk").innerHTML = upcoming.length ? `<tr><th>When</th><th>Table</th><th>Guest</th><th>Pax</th><th>Status</th><th></th></tr>` + upcoming.map(b => {
    const btns = b.status === "confirmed"
      ? `<button class="go" data-bk="${b.id}" data-s="seated">Arrived</button><button data-bk="${b.id}" data-s="noshow">No-show</button><button data-bk="${b.id}" data-s="cancelled">Cancel</button>`
      : b.status === "seated" ? `<button class="go" data-bk="${b.id}" data-s="completed">Left</button>` : "";
    return `<tr><td>${b.date === V.today ? "Today" : fmtDate(b.date)} ${RMCore.fmtTime(b.time)}</td><td>T${b.table}</td>
      <td>${esc(b.name)}<br><a class="small" href="tel:${esc(b.phone)}">${esc(b.phone)}</a>${b.note ? `<br><span class="small">${esc(b.note)}</span>` : ""}</td>
      <td>${b.guests}</td><td><span class="badge-s ${b.status}">${b.status}</span></td><td>${btns}</td></tr>`;
  }).join("") : `<tr><td class="small">No bookings yet. Customers book from the website's “Book a Table” section.</td></tr>`;

  const hour = RMCore.ist(Date.now()).hour, hrs = [];
  for (let h = 10; h < 22; h++) hrs.push(h);
  const max = Math.max(1, ...hrs.map(h => V.hourly[h]));
  $("bars").innerHTML = hrs.map(h => `<div class="${h === hour ? "now" : ""}"><i data-v="${V.hourly[h] || ""}" style="height:${(V.hourly[h] / max) * 100}%"></i>${h % 12 || 12}${h < 12 ? "a" : "p"}</div>`).join("");
  const src = V.visitsBySource;
  $("visInfo").textContent = `${V.visitorsToday} total` + (Object.keys(src).length ? " · " + Object.entries(src).map(([k, v]) => `${k}: ${v}`).join(", ") : "");

  $("hist").innerHTML = V.analyses.length ? V.analyses.map(a => `<div class="h"><b>${new Date(a.at).toLocaleTimeString("en-IN", {hour: "numeric", minute: "2-digit"})}</b> · ${esc(a.file || "video")} · ${a.visitors} people ·
     ${a.changes.length ? a.changes.map(c => `T${c.table}: ${c.from} → <b>${c.to}</b>`).join(", ") : "no changes"}</div>`).join("") : "No videos analysed yet.";

  const sf = $("sf").elements;
  if (document.activeElement.form !== $("sf")) {
    sf.tableCount.value = V.tables.length; sf.seats.value = V.tables.map(t => t.seats).join(", "); sf.managerWa.value = V.settings.managerWa || "";
  }
  if (!zonesDirty) { zones = V.zones.slice(); renderZones(); }
}

/* ===== actions ===== */
document.addEventListener("click", e => {
  const b = e.target.closest("button"); if (!b) return;
  if (b.dataset.a) act({type: "setStatus", table: +b.dataset.t, status: b.dataset.a}, `Table ${b.dataset.t} → ${LABEL[b.dataset.a]}`);
  else if (b.dataset.bk) act({type: "booking", id: b.dataset.bk, status: b.dataset.s}, "Booking updated");
  else if (b.dataset.al) act({type: "resolveAlert", id: b.dataset.al});
});
$("clearAlerts").onclick = () => act({type: "clearAlerts"});
$("resetBtn").onclick = () => { if (confirm("Mark every table as free and clean?")) act({type: "resetTables"}, "All tables reset to free"); };
$("walkin").addEventListener("submit", e => { e.preventDefault(); act({type: "visit", count: +$("walkN").value, source: "walk-in"}, "Customers added"); });
$("sf").addEventListener("submit", e => {
  e.preventDefault(); const f = e.target.elements;
  act({type: "settings", tableCount: f.tableCount.value, seats: f.seats.value, managerWa: f.managerWa.value}, "Settings saved");
  document.activeElement.blur();
});
$("notifyBtn").onclick = async () => {
  if (!window.Notification) return toast("This browser does not support notifications");
  const p = await Notification.requestPermission();
  toast(p === "granted" ? "Desktop alerts enabled" : "Alerts blocked in browser settings");
};
function waText(results) {
  const by = s => V.tables.filter(t => t.status === s).map(t => "T" + t.id).join(", ") || "none";
  let msg = `*${"Satyam Sundaram"} — table update* (${new Date().toLocaleTimeString("en-IN", {hour: "numeric", minute: "2-digit"})})\n`;
  if (results) msg += results.filter(r => r.status === "cleaning").map(r => `🧹 Clean table ${r.table}: ${r.reason}`).join("\n") + "\n";
  msg += `\nNeed cleaning: ${by("cleaning")}\nFree: ${by("free")}\nBooked: ${by("booked")}\nOccupied: ${by("occupied")}\nCustomers today: ${V.visitorsToday}`;
  return msg;
}
const openWa = msg => window.open(`https://wa.me/${(V.settings.managerWa || "").replace(/\D/g, "")}?text=${encodeURIComponent(msg)}`, "_blank");
$("waAlerts").onclick = () => openWa(waText());

/* ===== video analysis ===== */
const vid = $("vid"), ov = $("ov");
let zonesDirty = false, drawMode = false, drag = null, fileName = "";
const redraw = (draft) => RMVision.draw(ov, vid, zones, lastPreds, statusBy, draft);
function renderZones() {
  $("zlist").innerHTML = zones.length ? zones.map((z, i) => `<li>T${z.table}<button title="Remove" data-z="${i}">×</button></li>`).join("")
    : `<li class="hint">No zones yet — auto-detect or draw them on the video.</li>`;
  if (vid.videoWidth) redraw();
  $("runA").disabled = !vid.videoWidth || !zones.length;
}
async function saveZones() { zonesDirty = false; await act({type: "zones", zones}); }
$("zlist").addEventListener("click", e => { const b = e.target.closest("button[data-z]"); if (!b) return; zones.splice(+b.dataset.z, 1); saveZones(); renderZones(); });
$("clearZ").onclick = () => { if (zones.length && confirm("Remove all table zones?")) { zones = []; saveZones(); renderZones(); } };

function setProgress(p) { $("prog").hidden = p == null; $("progBar").style.width = ((p || 0) * 100) + "%"; }
async function ensureModel() {
  if (RMVision.ready) return;
  $("vstatus").textContent = "Loading AI model (first time only, ~15 MB)…";
  await RMVision.load();
  $("vstatus").textContent = "AI model ready.";
}
async function openVideo(file) {
  if (!file || !file.type.startsWith("video")) return toast("Please choose a video file");
  fileName = file.name; statusBy = {}; lastPreds = []; $("result").innerHTML = "";
  vid.src = URL.createObjectURL(file);
  $("stage").hidden = false; $("drop").querySelector("b").textContent = "Change video";
  await new Promise(ok => vid.addEventListener("loadeddata", ok, {once: true}));
  await RMVision.seek(vid, Math.min(0.5, vid.duration / 2));
  renderZones();
  try { await ensureModel(); $("autoZ").disabled = $("drawZ").disabled = false; $("vstatus").textContent = `${file.name} · ${Math.round(vid.duration)} s · ready`; }
  catch (e) { $("vstatus").textContent = "Could not load AI model — check your internet connection."; }
  renderZones();
}
$("vfile").addEventListener("change", e => openVideo(e.target.files[0]));
["dragover", "dragleave", "drop"].forEach(ev => $("drop").addEventListener(ev, e => {
  e.preventDefault(); $("drop").classList.toggle("over", ev === "dragover");
  if (ev === "drop") openVideo(e.dataTransfer.files[0]);
}));

$("autoZ").onclick = async () => {
  $("autoZ").disabled = true; $("vstatus").textContent = "Looking for tables…"; setProgress(0);
  const found = await RMVision.autoZones(vid, setProgress);
  setProgress(null); $("autoZ").disabled = false;
  if (!found.length) { $("vstatus").textContent = "No tables recognised — use “Draw zone” to mark them."; return; }
  zones = found.map((z, i) => ({...z, table: i + 1}));
  $("vstatus").textContent = `Found ${found.length} table${found.length > 1 ? "s" : ""}. Check the numbers match your tables (click × to remove, draw to add).`;
  await saveZones(); renderZones();
};
$("drawZ").onclick = () => {
  drawMode = !drawMode; $("stage").classList.toggle("drawing", drawMode);
  $("drawZ").textContent = drawMode ? "Done drawing" : "Draw zone";
  if (drawMode) $("vstatus").textContent = "Drag a box around a table on the video, then enter its table number.";
};
const pt = e => { const r = ov.getBoundingClientRect(); return {x: Math.min(1, Math.max(0, (e.clientX - r.left) / r.width)), y: Math.min(1, Math.max(0, (e.clientY - r.top) / r.height))}; };
ov.addEventListener("pointerdown", e => { if (!drawMode) return; drag = pt(e); ov.setPointerCapture(e.pointerId); });
ov.addEventListener("pointermove", e => {
  if (!drag) return; const p = pt(e);
  redraw({x: Math.min(drag.x, p.x), y: Math.min(drag.y, p.y), w: Math.abs(p.x - drag.x), h: Math.abs(p.y - drag.y)});
});
ov.addEventListener("pointerup", e => {
  if (!drag) return; const p = pt(e), z = {x: Math.min(drag.x, p.x), y: Math.min(drag.y, p.y), w: Math.abs(p.x - drag.x), h: Math.abs(p.y - drag.y)};
  drag = null;
  if (z.w < 0.02 || z.h < 0.02) return redraw();
  const used = new Set(zones.map(q => q.table));
  let next = 1; while (used.has(next)) next++;
  const n = parseInt(prompt("Table number for this zone?", next), 10);
  if (n > 0) { zones = zones.filter(q => q.table !== n).concat({...z, table: n}); saveZones(); }
  renderZones();
});

$("runA").onclick = async () => {
  const btn = $("runA"); btn.disabled = true; $("autoZ").disabled = $("drawZ").disabled = true;
  if (drawMode) $("drawZ").click();
  statusBy = {}; $("result").innerHTML = "";
  try {
    await ensureModel();
    setProgress(0);
    const res = await RMVision.analyze(vid, zones, {onFrame: (preds, i, n) => {
      lastPreds = preds; redraw(); setProgress((i + 1) / n);
      $("vstatus").textContent = `Analysing frame ${i + 1} of ${n}…`;
    }});
    setProgress(null);
    res.results.forEach(r => statusBy[r.table] = r.status);
    lastPreds = res.lastFrame; redraw();
    const known = new Set(V.tables.map(t => t.id));
    const valid = res.results.filter(r => known.has(r.table));
    $("vstatus").textContent = `Done · ${res.frames} frames analysed · ~${res.visitors} people seen`;
    const cleanN = valid.filter(r => r.status === "cleaning").length;
    $("result").innerHTML = `<table class="dt"><tr><th>Table</th><th>Status</th><th>Why</th></tr>` +
      res.results.map(r => `<tr><td>T${r.table}${known.has(r.table) ? "" : " ⚠"}</td><td><span class="badge-s ${r.status}">${LABEL[r.status]}</span></td><td class="small">${esc(r.reason)}</td></tr>`).join("") +
      `</table><p class="small">~${res.visitors} customers detected (peak ${res.peak} at once).${valid.length < res.results.length ? " ⚠ = zone number not in your table list (see Settings)." : ""}</p>
      <div class="btnrow">${$("autoApply").checked ? "" : `<button class="btn sm" id="applyA">Apply to tables</button>`}<button class="btn wa sm" id="waA">Send to manager on WhatsApp</button></div>`;
    const apply = () => act({type: "analysis", file: fileName, results: valid, visitors: res.visitors, addVisitors: $("addVis").checked},
      `Tables updated${cleanN ? ` · ${cleanN} need cleaning` : ""} — website is live`);
    if ($("autoApply").checked) await apply();
    else $("applyA").onclick = async () => { await apply(); $("applyA").remove(); };
    $("waA").onclick = () => openWa(waText(valid));
  } catch (e) {
    setProgress(null); $("vstatus").textContent = "Analysis failed: " + e.message;
  }
  btn.disabled = false; $("autoZ").disabled = $("drawZ").disabled = false;
};

setInterval(() => { $("clock").textContent = new Date().toLocaleString("en-IN", {timeZone: "Asia/Kolkata", weekday: "short", hour: "numeric", minute: "2-digit"}); }, 1000);
RM.watch(refresh, 6000);
