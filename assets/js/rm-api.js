/* Talks to the Netlify Function at /api. Falls back to a browser-only demo store when the API is unavailable. */
const RM = (() => {
  const LS_KEY = "rm-state-v1", DEMO_PIN = "1234";
  let mode = null;

  async function detect() {
    if (mode) return mode;
    try {
      const r = await fetch(base() + "state", { cache: "no-store" });
      mode = r.ok && (r.headers.get("content-type") || "").includes("json") ? "live" : "local";
    } catch { mode = "local"; }
    return mode;
  }
  const base = () => location.pathname.replace(/[^/]*$/, "") + "api/";

  async function http(path, { method = "GET", body, pin } = {}) {
    const headers = { "content-type": "application/json" };
    if (pin) headers["x-manager-pin"] = pin;
    const r = await fetch(base() + path, { method, headers, body: body ? JSON.stringify(body) : undefined, cache: "no-store" });
    const data = await r.json().catch(() => ({ error: "Server error" }));
    if (!r.ok) throw Object.assign(new Error(data.error || "Request failed"), { status: r.status });
    return data;
  }

  const loadLocal = () => { try { return JSON.parse(localStorage.getItem(LS_KEY)) || RMCore.defaultState(); } catch { return RMCore.defaultState(); } };
  function local(fn, write) {
    const s = loadLocal(), now = Date.now();
    const out = write ? RMCore.mutate(s, x => fn(x, now), now) : fn(s, now);
    if (write) localStorage.setItem(LS_KEY, JSON.stringify(s));
    return out;
  }
  const checkPin = pin => { if (pin !== DEMO_PIN) throw Object.assign(new Error("Wrong PIN"), { status: 401 }); };

  async function call(liveFn, localFn) {
    await detect();
    return mode === "live" ? liveFn() : localFn();
  }

  return {
    detect, get mode() { return mode; },
    getPublic: () => call(() => http("state"), () => local((s, n) => RMCore.publicView(s, n))),
    availability: q => call(() => http("availability?" + new URLSearchParams(q)), () => local((s, n) => RMCore.availability(s, q, n))),
    book: q => call(() => http("book", { method: "POST", body: q }).then(r => r.booking), () => local((s, n) => RMCore.book(s, q, n), true)),
    login: pin => call(() => http("admin/login", { method: "POST", pin }), () => (checkPin(pin), { ok: true })),
    getAdmin: pin => call(() => http("admin/state", { pin }), () => (checkPin(pin), local((s, n) => RMCore.adminView(s, n)))),
    action: (pin, act) => call(() => http("admin/action", { method: "POST", body: act, pin }),
      () => (checkPin(pin), local((s, n) => RMCore.apply(s, act, n), true), local((s, n) => RMCore.adminView(s, n)))),
    /* calls cb whenever data may have changed (poll in live mode, storage events across tabs in demo mode) */
    watch(cb, ms = 8000) {
      window.addEventListener("storage", e => { if (e.key === LS_KEY) cb(); });
      document.addEventListener("visibilitychange", () => { if (!document.hidden) cb(); });
      return setInterval(() => { if (!document.hidden) cb(); }, ms);
    }
  };
})();
