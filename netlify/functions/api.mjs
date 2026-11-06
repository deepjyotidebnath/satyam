import { getStore } from "@netlify/blobs";
import Core from "../../assets/js/rm-core.js";

const KEY = "state";
const PIN = process.env.MANAGER_PIN || "1234";

const json = (body, status = 200) => new Response(JSON.stringify(body), {
  status, headers: { "content-type": "application/json", "cache-control": "no-store" }
});

async function load(store) {
  const r = await store.getWithMetadata(KEY, { type: "json" });
  return r ? { state: r.data, etag: r.etag } : { state: Core.defaultState(), etag: null };
}

async function mutate(store, fn) {
  for (let i = 0; i < 5; i++) {
    const { state, etag } = await load(store);
    const now = Date.now();
    const out = Core.mutate(state, s => fn(s, now), now);
    const res = await store.setJSON(KEY, state, etag ? { onlyIfMatch: etag } : { onlyIfNew: true });
    if (res.modified !== false) return { state, out, now };
  }
  throw Object.assign(new Error("Busy, please retry"), { status: 503 });
}

export default async (req) => {
  const store = getStore({ name: "restaurant-monitor", consistency: "strong" });
  const path = new URL(req.url).pathname.replace(/^\/api\/?/, "").replace(/\/$/, "");
  const url = new URL(req.url);
  try {
    const body = req.method === "POST" ? await req.json().catch(() => ({})) : {};
    if (req.method === "GET" && path === "state") {
      const { state } = await load(store);
      return json(Core.publicView(state, Date.now()));
    }
    if (req.method === "GET" && path === "availability") {
      const { state } = await load(store);
      return json(Core.availability(state, Object.fromEntries(url.searchParams), Date.now()));
    }
    if (req.method === "POST" && path === "book") {
      const { out } = await mutate(store, (s, now) => Core.book(s, body, now));
      return json({ booking: out });
    }
    if (path.startsWith("admin/")) {
      if ((req.headers.get("x-manager-pin") || body.pin) !== PIN) return json({ error: "Wrong PIN" }, 401);
      if (req.method === "POST" && path === "admin/login") return json({ ok: true });
      if (req.method === "GET" && path === "admin/state") {
        const { state } = await load(store);
        return json(Core.adminView(state, Date.now()));
      }
      if (req.method === "POST" && path === "admin/action") {
        const { state, now } = await mutate(store, (s, n) => Core.apply(s, body, n));
        return json(Core.adminView(state, now));
      }
    }
    return json({ error: "Not found" }, 404);
  } catch (e) {
    return json({ error: e.message || "Server error" }, e.status || 500);
  }
};

export const config = { path: "/api/*" };
