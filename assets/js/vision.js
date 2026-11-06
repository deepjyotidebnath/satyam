/* In-browser restaurant video analysis using TensorFlow.js COCO-SSD. Nothing is uploaded. */
const RMVision = (() => {
  const LIBS = [
    "https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@4.22.0/dist/tf.min.js",
    "https://cdn.jsdelivr.net/npm/@tensorflow-models/coco-ssd@2.2.3/dist/coco-ssd.min.js"
  ];
  const ITEMS = new Set(["cup", "bowl", "bottle", "wine glass", "fork", "knife", "spoon", "sandwich", "pizza", "cake",
    "donut", "banana", "apple", "orange", "broccoli", "carrot", "hot dog"]);
  let model = null, loading = null;

  const loadScript = src => new Promise((ok, bad) => {
    if (document.querySelector(`script[src="${src}"]`)) return ok();
    const s = document.createElement("script"); s.src = src; s.onload = ok; s.onerror = () => bad(new Error("Could not load " + src));
    document.head.appendChild(s);
  });
  function load() {
    if (model) return Promise.resolve(model);
    return loading = loading || (async () => {
      for (const src of LIBS) await loadScript(src);
      model = await cocoSsd.load({ base: "mobilenet_v2" });
      return model;
    })();
  }

  async function detect(video, minScore = 0.3) {
    const W = video.videoWidth, H = video.videoHeight;
    const preds = await model.detect(video, 60, minScore);
    return preds.map(p => ({ cls: p.class, score: p.score, x: p.bbox[0] / W, y: p.bbox[1] / H, w: p.bbox[2] / W, h: p.bbox[3] / H }));
  }

  const seek = (v, t) => new Promise(ok => {
    const done = () => { v.removeEventListener("seeked", done); clearTimeout(to); ok(); };
    const to = setTimeout(done, 3000);
    v.addEventListener("seeked", done); v.currentTime = t;
  });
  const area = b => b.w * b.h;
  function inter(a, b) {
    const w = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x), h = Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y);
    return w > 0 && h > 0 ? w * h : 0;
  }
  const iou = (a, b) => { const i = inter(a, b); return i / (area(a) + area(b) - i || 1); };
  const centerIn = (b, z, pad = 0) => {
    const cx = b.x + b.w / 2, cy = b.y + b.h / 2, px = z.w * pad, py = z.h * pad;
    return cx >= z.x - px && cx <= z.x + z.w + px && cy >= z.y - py && cy <= z.y + z.h + py;
  };
  /* a person "at" a table: their box overlaps the table zone (seated people overlap the table from most camera angles) */
  const personAt = (p, z) => inter(p, z) / area(p) >= 0.18 && centerIn(p, z, 0.35);
  const itemAt = (b, z) => centerIn(b, z, 0.05);

  function times(duration, n) {
    const end = Math.max(0, duration - 0.05);
    return Array.from({ length: n }, (_, i) => n === 1 ? 0 : (end * i) / (n - 1));
  }

  /* merge overlapping boxes (after padding) into groups and return each group's bounding box */
  function group(boxes, pad) {
    const g = boxes.map(b => ({ x: b.x, y: b.y, w: b.w, h: b.h, n: 1 }));
    const near = (a, b) => inter({ x: a.x - a.w * pad, y: a.y - a.h * pad, w: a.w * (1 + 2 * pad), h: a.h * (1 + 2 * pad) }, b) > 0;
    for (let merged = true; merged;) {
      merged = false;
      for (let i = 0; i < g.length && !merged; i++) for (let j = i + 1; j < g.length; j++) {
        if (!near(g[i], g[j]) && !near(g[j], g[i])) continue;
        const a = g[i], b = g[j], x = Math.min(a.x, b.x), y = Math.min(a.y, b.y);
        g[i] = { x, y, w: Math.max(a.x + a.w, b.x + b.w) - x, h: Math.max(a.y + a.h, b.y + b.h) - y, n: a.n + b.n };
        g.splice(j, 1); merged = true; break;
      }
    }
    return g;
  }

  /* find tables: COCO "dining table" boxes; if the camera angle hides them, fall back to clusters of chairs */
  async function autoZones(video, onProgress) {
    await load();
    const tables = [], chairs = [], n = 10;
    const ts = times(video.duration, n);
    for (let i = 0; i < n; i++) {
      await seek(video, ts[i]);
      (await detect(video, 0.15)).forEach(p => {
        if (p.cls === "dining table" && p.score >= 0.2) tables.push(p);
        if (p.cls === "chair" || p.cls === "bench") chairs.push(p);
      });
      onProgress && onProgress((i + 1) / n);
    }
    const clusters = [];
    tables.sort((a, b) => b.score - a.score).forEach(b => {
      const c = clusters.find(c => iou(c.box, b) > 0.3);
      if (c) c.items.push(b); else clusters.push({ box: b, items: [b] });
    });
    let zones = clusters.filter(c => c.items.length >= 2 || c.box.score > 0.45).map(c => {
      const k = c.items.length, avg = f => c.items.reduce((s, b) => s + b[f], 0) / k;
      return { x: avg("x"), y: avg("y"), w: avg("w"), h: avg("h") };
    }).filter(z => z.w < 0.9 && z.h < 0.9);
    if (!zones.length && chairs.length) {
      zones = group(chairs, 0.25).filter(z => z.n >= 2 && z.w < 0.5 && z.h < 0.5)
        .map(z => ({ x: z.x, y: z.y, w: z.w, h: z.h }));
    }
    zones.sort((a, b) => Math.abs(a.y - b.y) > 0.12 ? a.y - b.y : a.x - b.x);
    return zones.slice(0, 30);
  }

  async function analyze(video, zones, { onFrame, maxFrames = 80 } = {}) {
    await load();
    const n = Math.max(8, Math.min(maxFrames, Math.round(video.duration * 2)));
    const ts = times(video.duration, n), frames = [];
    for (let i = 0; i < n; i++) {
      await seek(video, ts[i]);
      const preds = await detect(video);
      frames.push(preds);
      onFrame && onFrame(preds, i, n);
    }

    const tail = Math.max(3, Math.round(n * 0.2));
    const results = zones.map(z => {
      const people = frames.map(f => f.filter(p => p.cls === "person" && personAt(p, z)).length);
      const items = frames.map(f => f.filter(p => ITEMS.has(p.cls) && itemAt(p, z)).map(p => p.cls));
      const last = people.slice(-tail), lastItems = items.slice(-tail);
      const occNow = last.filter(c => c > 0).length / tail >= 0.4;
      const itemFrames = lastItems.filter(x => x.length).length / tail;
      const earlier = people.slice(0, -tail).filter(c => c > 0).length;
      const wasOcc = earlier >= Math.max(2, (n - tail) * 0.15);
      const left = [...new Set(lastItems.flat())];
      const seated = Math.round(last.reduce((a, b) => a + b, 0) / tail);
      let status, reason;
      if (occNow) { status = "occupied"; reason = `${Math.max(1, seated)} customer${seated > 1 ? "s" : ""} seated`; }
      else if (itemFrames >= 0.4) { status = "cleaning"; reason = `${left.join(", ")} left on table`; }
      else if (wasOcc) { status = "cleaning"; reason = "customers left, table not yet cleaned"; }
      else { status = "free"; reason = "empty and clean"; }
      return { table: z.table, status, reason, people: Math.max(...people), items: left };
    });

    /* simple IoU tracker to estimate unique customers seen */
    let tracks = [];
    frames.forEach((f, i) => {
      f.filter(p => p.cls === "person").forEach(p => {
        let best = null, bi = 0.25;
        tracks.forEach(t => { if (i - t.last <= 3 && t.last !== i) { const v = iou(t.box, p); if (v > bi) { bi = v; best = t; } } });
        if (best) { best.box = p; best.last = i; best.hits++; } else tracks.push({ box: p, last: i, hits: 1 });
      });
    });
    const peak = Math.max(0, ...frames.map(f => f.filter(p => p.cls === "person").length));
    const visitors = Math.max(peak, tracks.filter(t => t.hits >= 2).length);
    return { results, visitors, peak, frames: n, lastFrame: frames[frames.length - 1] || [] };
  }

  const COLORS = { free: "#1f9d55", booked: "#2563eb", occupied: "#b5391a", cleaning: "#d97706", none: "#ffffff" };
  function draw(canvas, video, zones, preds = [], statusBy = {}, draft = null) {
    const W = canvas.width = video.videoWidth || 1280, H = canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext("2d"), lw = Math.max(2, W / 400), fs = Math.max(14, W / 50);
    ctx.clearRect(0, 0, W, H);
    try { if (video.readyState >= 2) ctx.drawImage(video, 0, 0, W, H); } catch {}
    ctx.font = `700 ${fs}px system-ui,sans-serif`;
    zones.forEach(z => {
      const c = COLORS[statusBy[z.table]] || COLORS.none;
      ctx.strokeStyle = c; ctx.lineWidth = lw * 1.5; ctx.setLineDash([]);
      ctx.fillStyle = c + "33"; ctx.fillRect(z.x * W, z.y * H, z.w * W, z.h * H);
      ctx.strokeRect(z.x * W, z.y * H, z.w * W, z.h * H);
      const label = "T" + z.table + (statusBy[z.table] ? " · " + statusBy[z.table] : "");
      const tw = ctx.measureText(label).width + 12;
      ctx.fillStyle = c === COLORS.none ? "#2b1d16" : c; ctx.fillRect(z.x * W, z.y * H - fs - 8, tw, fs + 8);
      ctx.fillStyle = "#fff"; ctx.fillText(label, z.x * W + 6, z.y * H - 6);
    });
    ctx.font = `600 ${fs * 0.7}px system-ui,sans-serif`;
    preds.forEach(p => {
      const isP = p.cls === "person", isI = ITEMS.has(p.cls);
      if (!isP && !isI) return;
      ctx.strokeStyle = isP ? "#ff3b6b" : "#ffd34d"; ctx.lineWidth = lw; ctx.setLineDash(isP ? [] : [6, 4]);
      ctx.strokeRect(p.x * W, p.y * H, p.w * W, p.h * H);
      ctx.fillStyle = ctx.strokeStyle; ctx.fillText(p.cls, p.x * W + 4, p.y * H + fs * 0.75);
    });
    if (draft) { ctx.setLineDash([8, 6]); ctx.strokeStyle = "#fff"; ctx.lineWidth = lw * 1.5; ctx.strokeRect(draft.x * W, draft.y * H, draft.w * W, draft.h * H); }
  }

  return { load, detect, autoZones, analyze, draw, seek, get ready() { return !!model; } };
})();
