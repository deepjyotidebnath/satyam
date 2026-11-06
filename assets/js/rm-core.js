/* Restaurant monitor core: shared by the Netlify Function (Node) and the browser demo mode. */
(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.RMCore = api;
})(typeof self !== "undefined" ? self : this, function () {
  const TZ_MIN = 330;            // Asia/Kolkata, no DST
  const OPEN_MIN = 10 * 60, LAST_SLOT_MIN = 21 * 60, CLOSE_MIN = 22 * 60;
  const SLOT_MIN = 90;           // a booking holds a table for 90 minutes
  const LEAD_MIN = 60;           // table shows "booked" this long before the booking
  const STATUSES = ["free", "occupied", "cleaning"];

  const fail = (msg, status = 400) => { const e = new Error(msg); e.status = status; throw e; };
  const uid = () => Math.random().toString(36).slice(2, 8).toUpperCase();
  const pad = n => String(n).padStart(2, "0");

  function ist(now) {
    const d = new Date(now + TZ_MIN * 60000);
    return { date: d.toISOString().slice(0, 10), min: d.getUTCHours() * 60 + d.getUTCMinutes(), hour: d.getUTCHours() };
  }
  const toMin = t => { const m = /^(\d{1,2}):(\d{2})$/.exec(t || ""); return m ? +m[1] * 60 + +m[2] : NaN; };
  const fmtTime = t => { const m = toMin(t), h = Math.floor(m / 60); return `${h % 12 || 12}:${pad(m % 60)} ${h >= 12 ? "PM" : "AM"}`; };
  function slots() { const out = []; for (let m = OPEN_MIN; m <= LAST_SLOT_MIN; m += 30) out.push(pad(Math.floor(m / 60)) + ":" + pad(m % 60)); return out; }

  function makeTables(count, seats, old = []) {
    return Array.from({ length: count }, (_, i) => {
      const prev = old.find(t => t.id === i + 1);
      return prev ? { ...prev, seats: seats[i] || prev.seats } : { id: i + 1, seats: seats[i] || 4, status: "free", since: Date.now(), source: "setup" };
    });
  }
  function defaultState() {
    return {
      v: 1,
      settings: { managerWa: "918670165764" },
      tables: makeTables(12, [2, 2, 4, 4, 4, 4, 4, 4, 6, 6, 8, 8]),
      bookings: [], alerts: [], visits: [], zones: [], analyses: [],
      updatedAt: Date.now()
    };
  }

  function prune(s, now) {
    const day = 86400000;
    const cutoff = ist(now - 30 * day).date;
    s.bookings = s.bookings.filter(b => b.date >= cutoff);
    s.visits = s.visits.filter(v => v.at > now - 60 * day);
    s.alerts = s.alerts.slice(-200);
    s.analyses = s.analyses.slice(-10);
  }

  function bookingNow(s, tableId, now) {
    const { date, min } = ist(now);
    return s.bookings.find(b => b.table === tableId && b.status === "confirmed" && b.date === date &&
      min >= toMin(b.time) - LEAD_MIN && min < toMin(b.time) + SLOT_MIN) || null;
  }
  function effective(s, t, now) {
    if (t.status !== "free") return { status: t.status, booking: null };
    const b = bookingNow(s, t.id, now);
    return b ? { status: "booked", booking: b } : { status: "free", booking: null };
  }
  function counts(s, now) {
    const c = { free: 0, booked: 0, occupied: 0, cleaning: 0, total: s.tables.length };
    s.tables.forEach(t => c[effective(s, t, now).status]++);
    return c;
  }
  function isOpen(now) { const { min } = ist(now); return min >= OPEN_MIN && min < CLOSE_MIN; }

  function publicView(s, now) {
    return {
      tables: s.tables.map(t => ({ id: t.id, seats: t.seats, status: effective(s, t, now).status })),
      counts: counts(s, now), open: isOpen(now), today: ist(now).date, slots: slots(), updatedAt: s.updatedAt
    };
  }

  function adminView(s, now) {
    const today = ist(now).date;
    const todays = s.visits.filter(v => v.date === today);
    const hourly = Array(24).fill(0);
    todays.forEach(v => { hourly[v.hour] += v.count; });
    return {
      ...publicView(s, now),
      tables: s.tables.map(t => { const e = effective(s, t, now); return { ...t, status: e.status, rawStatus: t.status, booking: e.booking }; }),
      visitorsToday: todays.reduce((a, v) => a + v.count, 0),
      visitsBySource: todays.reduce((a, v) => (a[v.source] = (a[v.source] || 0) + v.count, a), {}),
      hourly,
      bookings: s.bookings.filter(b => b.date >= today).sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time)),
      alerts: s.alerts.filter(a => !a.resolved).reverse(),
      zones: s.zones, analyses: s.analyses.slice().reverse(), settings: s.settings
    };
  }

  function availability(s, q, now) {
    const { date, min } = ist(now);
    const slot = toMin(q.time), guests = +q.guests || 1;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(q.date || "")) fail("Choose a date");
    if (isNaN(slot) || slot < OPEN_MIN || slot > LAST_SLOT_MIN) fail("Choose a time between 10:00 AM and 9:00 PM");
    const past = q.date < date || (q.date === date && slot < min - 15);
    return s.tables.map(t => {
      let reason = "";
      if (past) reason = "Time has passed";
      else if (guests > t.seats) reason = `Only ${t.seats} seats`;
      else if (s.bookings.some(b => b.table === t.id && b.date === q.date && (b.status === "confirmed" || b.status === "seated") && Math.abs(toMin(b.time) - slot) < SLOT_MIN)) reason = "Booked";
      else if (q.date === date && slot - min < SLOT_MIN && t.status !== "free") reason = t.status === "cleaning" ? "Being cleaned" : "Occupied";
      return { id: t.id, seats: t.seats, available: !reason, reason };
    });
  }

  function book(s, q, now) {
    const name = String(q.name || "").trim().slice(0, 60), phone = String(q.phone || "").replace(/[^\d+ ]/g, "").trim().slice(0, 16);
    if (!name) fail("Enter your name");
    if (phone.replace(/\D/g, "").length < 8) fail("Enter a valid phone number");
    const guests = Math.max(1, Math.min(20, parseInt(q.guests, 10) || 1));
    const table = parseInt(q.table, 10);
    const a = availability(s, { date: q.date, time: q.time, guests }, now).find(t => t.id === table);
    if (!a) fail("Choose a table");
    if (!a.available) fail(`Table ${table} is not available for that time (${a.reason}). Please pick another table.`, 409);
    const b = { id: uid(), table, name, phone, date: q.date, time: q.time, guests, note: String(q.note || "").trim().slice(0, 200), status: "confirmed", createdAt: now };
    s.bookings.push(b);
    s.alerts.push({ id: uid(), type: "booking", table, msg: `New booking: Table ${table} · ${name} · ${guests} guests · ${q.date} ${fmtTime(q.time)}`, at: now, resolved: false });
    return b;
  }

  function addVisit(s, count, source, now) {
    count = Math.max(0, Math.min(500, parseInt(count, 10) || 0));
    if (!count) return;
    const { date, hour } = ist(now);
    s.visits.push({ at: now, date, hour, count, source });
  }

  function setStatus(s, id, status, source, now, note) {
    const t = s.tables.find(x => x.id === +id);
    if (!t) fail("Unknown table " + id);
    if (!STATUSES.includes(status)) fail("Bad status");
    const before = t.status;
    Object.assign(t, { status, since: before === status ? t.since : now, source, note: note || "" });
    if (status === "cleaning" && before !== "cleaning")
      s.alerts.push({ id: uid(), type: "cleaning", table: t.id, msg: `Clean table ${t.id}` + (note ? ` — ${note}` : ""), at: now, resolved: false });
    if (status !== "cleaning") s.alerts.forEach(a => { if (a.type === "cleaning" && a.table === t.id) a.resolved = true; });
    if (status === "occupied" && before !== "occupied") {
      const b = bookingNow(s, t.id, now);
      if (b) b.status = "seated";
    }
    return t;
  }

  function apply(s, act, now) {
    switch (act.type) {
      case "setStatus": setStatus(s, act.table, act.status, act.source || "manager", now, act.note); break;
      case "analysis": {
        const changes = [];
        (act.results || []).forEach(r => {
          const t = s.tables.find(x => x.id === +r.table);
          if (!t || !STATUSES.includes(r.status)) return;
          if (t.status !== r.status) changes.push({ table: t.id, from: t.status, to: r.status });
          setStatus(s, t.id, r.status, "video", now, r.reason);
        });
        if (act.addVisitors) addVisit(s, act.visitors, "video", now);
        s.analyses.push({ at: now, file: String(act.file || "").slice(0, 80), visitors: +act.visitors || 0, results: act.results || [], changes });
        break;
      }
      case "booking": {
        const b = s.bookings.find(x => x.id === act.id);
        if (!b) fail("Booking not found", 404);
        if (!["seated", "cancelled", "noshow", "completed", "confirmed"].includes(act.status)) fail("Bad status");
        const prev = b.status;
        b.status = act.status;
        if (act.status === "seated" && prev !== "seated") { setStatus(s, b.table, "occupied", "booking", now); addVisit(s, b.guests, "booking", now); b.status = "seated"; }
        if (act.status === "completed" && prev === "seated") setStatus(s, b.table, "cleaning", "manager", now, "guests left");
        break;
      }
      case "resolveAlert": s.alerts.forEach(a => { if (a.id === act.id) a.resolved = true; }); break;
      case "clearAlerts": s.alerts.forEach(a => { a.resolved = true; }); break;
      case "visit": addVisit(s, act.count, act.source || "walk-in", now); break;
      case "zones": s.zones = (act.zones || []).slice(0, 60).map(z => ({ table: +z.table, x: +z.x, y: +z.y, w: +z.w, h: +z.h })).filter(z => z.table > 0 && z.w > 0 && z.h > 0); break;
      case "settings": {
        const seats = String(act.seats || "").split(/[\s,]+/).map(n => parseInt(n, 10)).filter(n => n > 0 && n <= 30);
        const count = Math.max(1, Math.min(60, parseInt(act.tableCount, 10) || s.tables.length));
        s.tables = makeTables(count, seats, s.tables);
        if (act.managerWa != null) s.settings.managerWa = String(act.managerWa).replace(/\D/g, "").slice(0, 15);
        break;
      }
      case "resetTables": s.tables.forEach(t => setStatus(s, t.id, "free", "manager", now)); break;
      default: fail("Unknown action");
    }
  }

  function mutate(s, fn, now) {
    const out = fn(s);
    s.updatedAt = now;
    prune(s, now);
    return out;
  }

  return { TZ_MIN, SLOT_MIN, ist, slots, fmtTime, defaultState, publicView, adminView, availability, book, apply, mutate, counts };
});
