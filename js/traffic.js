/* ============================================================================================================
   js/traffic.js — v14.3 NPC TRAFFIC
   Cars drive the real roads (or the Nexus street grid) on the right-hand side of the road, follow each other at a
   safe gap, stop and go, and obey the junction controls:
   • traffic signals run a real-world cycle (56 s: main road 26 s green + 3.5 s amber, 1.5 s all-red, side road 20 s
     green + 3.5 s amber, 1.5 s all-red) and are offset along the main road at 35 mph (a "green wave"), so traffic
     that keeps to the limit meets green after green
   • stop signs (full stop, then go when the junction is clear) and yield-to-the-main-road at the quiet corners
   Cars are light kinematic agents until something real happens — a crash, a shot, a blast — then they become full
   physics vehicles (js/vehicles.js). Police cruisers ride along in the traffic (js/police.js watches through them).
   Units: world metres (1 m = 32 px); on a scaled real map every distance and speed is real-equivalent × RM.S.
   ============================================================================================================ */
const TRF = { on: false, cars: [], net: null, t: 0, id: 1, spr: new Map(), view: null, at: null, pending: false, buildT: -9, lastBuild: 0,
  hornT: 0, onCrash: null, onRed: null, stats: { spawned: 0, promoted: 0, builds: 0 } };
const TRF_C = 56, TRF_GA = 26, TRF_YA = 3.5, TRF_RA = 1.5, TRF_GB = 20, TRF_YB = 3.5;
const TRF_MPH = { 3: 25, 4: 30, 5: 35, 6: 40, 7: 50, 8: 65 };
const TRF_MS = 0.44704;   // 1 mph in m/s

function trfK() { return typeof RG !== "undefined" && RG.real && typeof RM !== "undefined" && RM.S > 0 ? RM.S : 1; }
function trfM(lx, ly) { return [(lx + CITY.orx) / 32, (ly + CITY.ory) / 32]; }
function trfEnabled() {
  if (typeof CITY === "undefined" || !CITY.on || !player) return false;
  if (typeof SCN !== "undefined" && SCN.mode === "apoc") return false;   // the end of the world has no rush hour
  if (typeof opts !== "undefined" && opts.traffic === false) return false;
  return true;
}
// the speed limit (mph) of a road rank
function trfLimitMph(rank) { return TRF_MPH[Math.max(3, Math.min(8, rank | 0))] || 25; }

/* --- 1. THE ROAD NET around the player (rebuilt every ~60 m) --------------------------------------------------- */
function trfRawSegs(xm, ym, R) {
  const out = [], seen = new Set(), x0 = xm - R, x1 = xm + R, y0 = ym - R, y1 = ym + R;
  const add = (ax, ay, bx, by, w, rank, ow, name) => {
    if (Math.max(ax, bx) < x0 || Math.min(ax, bx) > x1 || Math.max(ay, by) < y0 || Math.min(ay, by) > y1) return;
    out.push({ ax, ay, bx, by, w, rank, ow, name });
  };
  const rk = r => r === 0 ? 6 : r === 1 ? 5 : r === 2 ? 4 : 3;
  for (let my = Math.max(0, Math.floor(y0 / 1000)); my <= Math.min(63, Math.floor(y1 / 1000)); my++)
    for (let mx = Math.max(0, Math.floor(x0 / 1000)); mx <= Math.min(63, Math.floor(x1 / 1000)); mx++) {
      if (typeof RG !== "undefined" && RG.real) {
        const L = typeof rmCellSegsAt === "function" ? rmCellSegsAt(mx, my) : null;
        if (!L) { TRF.pending = true; continue; }
        for (const s of L) {
          if (seen.has(s)) continue; seen.add(s);
          const r = s.r;
          if (r.rank < 3 || r.rank > 8 || r.hwy || r.br === "tunnel" || r.constr || r.kind === "busway" || r.kind === "raceway") continue;
          add(s.ax, s.ay, s.bx, s.by, s.w, r.rank, r.ow ? 1 : 0, r.name || "");
        }
      } else {
        let S; try { S = cityCellStreets(mx, my); } catch (e) { continue; }
        if (!S) continue;
        const ys = S.hy.map(h => h.y), xs = S.vx.map(v => v.x);
        for (const v of S.vx) if (!v.hw) for (let j = 0; j + 1 < ys.length; j++) add(v.x, ys[j], v.x, ys[j + 1], v.w, rk(v.r), 0, "");
        for (const h of S.hy) if (!h.hw) for (let i = 0; i + 1 < xs.length; i++) add(xs[i], h.y, xs[i + 1], h.y, h.w, rk(h.r), 0, "");
      }
    }
  return out;
}
function trfBuildNet(xm, ym) {
  const k = trfK(), R = 170;
  TRF.pending = false;
  const raw = trfRawSegs(xm, ym, R), nodes = new Map(), q = v => Math.round(v * 2);
  let nid = 0;
  const node = (x, y) => { const key = q(x) * 1e6 + q(y); let n = nodes.get(key); if (!n) nodes.set(key, n = { id: nid++, key, x, y, e: [], links: [], r: 0, sig: false, stop: false, maxRank: 0, occ: new Set(), off: 0, ax: 1, ay: 0 }); return n; };
  const eseen = new Set(), E = [];
  for (const s of raw) {
    const A = node(s.ax, s.ay), B = node(s.bx, s.by); if (A === B) continue;
    const ek = A.id < B.id ? A.id * 1e6 + B.id : B.id * 1e6 + A.id;
    if (eseen.has(ek)) continue; eseen.add(ek);
    const e = { A, B, w: s.w, rank: s.rank, ow: s.ow, name: s.name, used: false };
    A.e.push(e); B.e.push(e); E.push(e);
  }
  // a node is a junction (or a change of road) unless exactly two compatible pieces meet there
  const major = n => {
    if (n.e.length !== 2) return true;
    const [e1, e2] = n.e;
    if (e1.rank !== e2.rank || e1.ow !== e2.ow) return true;
    if (e1.ow && !((e1.B === n && e2.A === n) || (e2.B === n && e1.A === n))) return true;
    return false;
  };
  for (const n of nodes.values()) { n.major = major(n); for (const e of n.e) n.maxRank = Math.max(n.maxRank, e.rank); n.allEq = n.e.every(e => e.rank === n.maxRank); }
  // links: chains of pieces between major nodes
  const links = [];
  for (const M of nodes.values()) {
    if (!M.major) continue;
    for (const e0 of M.e) {
      if (e0.used) continue;
      const pts = [M.x, M.y]; let cur = e0, at = M, fwd = 0, bwd = 0, w = 0, guard = 0;
      while (cur && guard++ < 4000) {
        cur.used = true; w = Math.max(w, cur.w);
        const nx = cur.A === at ? cur.B : cur.A;
        if (cur.ow) { if (cur.A === at) fwd++; else bwd++; }
        pts.push(nx.x, nx.y); at = nx;
        if (at.major) break;
        cur = at.e[0] === cur ? at.e[1] : at.e[0];
        if (cur && cur.used) break;
      }
      if (pts.length < 4) continue;
      const L = { id: links.length, a: M, b: at, pts, w, rank: e0.rank, name: e0.name, ow: e0.ow ? (fwd >= bwd ? 1 : -1) : 0 };
      trfLinkGeom(L, k);
      if (L.L < 0.5) continue;
      links.push(L); M.links.push(L); if (at !== M) at.links.push(L);
    }
  }
  // junction radius, signals, stop signs
  for (const n of nodes.values()) {
    if (n.links.length >= 3) for (const L of n.links) n.r = Math.max(n.r, L.w / 2 + 0.6 * k);
    else if (n.links.length === 2) n.r = Math.min(...n.links.map(L => L.w)) * 0.35;
  }
  const real = typeof RG !== "undefined" && RG.real;
  if (real && CITY.blockCache) {
    for (const B of CITY.blockCache.values()) {
      if (!B || !B.props || B.rx1 < xm - R || B.rx0 > xm + R || B.ry1 < ym - R || B.ry0 > ym + R) continue;
      for (const p of B.props) {
        if ((p.t !== "trafficlight" && p.t !== "stopsign") || p.jx == null) continue;
        const n = nodes.get(q(p.jx) * 1e6 + q(p.jy)); if (!n || n.links.length < 3) continue;
        if (p.t === "trafficlight") n.sig = true; else n.stop = true;
      }
    }
  }
  for (const n of nodes.values()) {
    if (n.links.length < 3) continue;
    if (!real) { const big = n.links.filter(L => L.rank >= 5).length; if (big >= 3) n.sig = true; else n.stop = true; }
    if (!n.sig) continue;
    // the main road sets the axis; the green wave runs along it at 35 mph
    let best = null; for (const L of n.links) if (!best || L.rank > best.rank || (L.rank === best.rank && L.L > best.L)) best = L;
    const h = trfEndHead(best, n);
    let ax = -h[0], ay = -h[1]; if (ax < -1e-6 || (Math.abs(ax) < 1e-6 && ay < 0)) { ax = -ax; ay = -ay; }
    n.ax = ax; n.ay = ay;
    const vp = 35 * TRF_MS * k;
    n.off = -((n.x * ax + n.y * ay) / vp) % TRF_C;
  }
  // spawn weights: drivable length
  let acc = 0; const cum = [];
  for (const L of links) { acc += L.L * (L.ow ? 1 : 2) * (0.6 + L.rank * 0.15); cum.push(acc); }
  TRF.net = { nodes, links, cum, total: acc, cx: xm, cy: ym, R, k };
  TRF.stats.builds++;
}
// polyline lengths, per-vertex normals (miter, clamped), lanes
function trfLinkGeom(L, k) {
  const p = L.pts, n = p.length / 2, cum = new Float64Array(n), nx = new Float32Array(n), ny = new Float32Array(n);
  let s = 0;
  for (let i = 1; i < n; i++) { s += Math.hypot(p[i * 2] - p[i * 2 - 2], p[i * 2 + 1] - p[i * 2 - 1]); cum[i] = s; }
  for (let i = 0; i < n; i++) {
    let sx = 0, sy = 0, c = 0;
    for (const j of [i - 1, i]) {
      if (j < 0 || j >= n - 1) continue;
      const dx = p[j * 2 + 2] - p[j * 2], dy = p[j * 2 + 3] - p[j * 2 + 1], l = Math.hypot(dx, dy) || 1;
      sx += -dy / l; sy += dx / l; c++;
    }
    const l = Math.hypot(sx, sy) || 1; let ux = sx / l, uy = sy / l;
    if (c === 2) { const j = i - 1, dx = p[j * 2 + 2] - p[j * 2], dy = p[j * 2 + 3] - p[j * 2 + 1], ll = Math.hypot(dx, dy) || 1, d = ux * (-dy / ll) + uy * (dx / ll); const m = 1 / Math.max(0.5, d); ux *= m; uy *= m; }
    nx[i] = ux; ny[i] = uy;
  }
  L.cum = cum; L.nx = nx; L.ny = ny; L.L = s;
  const lw = 3.5 * k;
  L.lanes = Math.max(1, Math.min(3, Math.round((L.ow ? L.w : L.w / 2) / lw)));
  L.lim = trfLimitMph(L.rank);
}
// position on a link: s along the travel direction d (+1 a→b, −1 b→a), lane q → [x, y, heading x, heading y]
function trfAt(L, d, s, q, hint) {
  const sf = d > 0 ? s : L.L - s, p = L.pts, cum = L.cum, n = cum.length;
  let i = hint && hint.i >= 0 && hint.i < n - 1 ? hint.i : 0;
  while (i < n - 2 && cum[i + 1] < sf) i++;
  while (i > 0 && cum[i] > sf) i--;
  if (hint) hint.i = i;
  const seg = (cum[i + 1] - cum[i]) || 1, t = Math.max(0, Math.min(1, (sf - cum[i]) / seg));
  const x = p[i * 2] + (p[i * 2 + 2] - p[i * 2]) * t, y = p[i * 2 + 1] + (p[i * 2 + 3] - p[i * 2 + 1]) * t;
  const nxx = L.nx[i] + (L.nx[i + 1] - L.nx[i]) * t, nyy = L.ny[i] + (L.ny[i + 1] - L.ny[i]) * t;
  let hx = (p[i * 2 + 2] - p[i * 2]) / seg, hy = (p[i * 2 + 3] - p[i * 2 + 1]) / seg;
  const off = trfLaneOff(L, q);
  if (d < 0) { hx = -hx; hy = -hy; }
  // right of travel: forward normal (−hy, hx) for d > 0; the opposite side for d < 0
  const sgn = d > 0 ? 1 : -1;
  return [x + nxx * off * sgn, y + nyy * off * sgn, hx, hy];
}
function trfLaneOff(L, q) { const n = L.lanes; return L.ow ? -L.w / 2 + (q + 0.5) * L.w / n : (q + 0.5) * (L.w / 2) / n; }
// heading of a link where it leaves node n (pointing away from n)
function trfEndHead(L, n) {
  const p = L.pts, m = p.length;
  if (L.a === n) { const dx = p[2] - p[0], dy = p[3] - p[1], l = Math.hypot(dx, dy) || 1; return [dx / l, dy / l]; }
  const dx = p[m - 4] - p[m - 2], dy = p[m - 3] - p[m - 1], l = Math.hypot(dx, dy) || 1; return [dx / l, dy / l];
}
function trfEndNode(L, d) { return d > 0 ? L.b : L.a; }
function trfR(n, L) { return Math.min(n.r, L.L * 0.42); }

/* --- 2. SIGNALS -------------------------------------------------------------------------------------------------- */
// 0 green · 1 amber · 2 red, for phase ph (0 = along the main road, 1 = across)
function trfSig(n, ph) {
  const tau = (((TRF.t + n.off) % TRF_C) + TRF_C) % TRF_C;
  if (ph === 0) return tau < TRF_GA ? 0 : tau < TRF_GA + TRF_YA ? 1 : 2;
  const b0 = TRF_GA + TRF_YA + TRF_RA;
  return tau >= b0 && tau < b0 + TRF_GB ? 0 : tau >= b0 + TRF_GB && tau < b0 + TRF_GB + TRF_YB ? 1 : 2;
}
function trfPhase(n, hx, hy) { return Math.abs(hx * n.ax + hy * n.ay) > 0.7071 ? 0 : 1; }

/* --- 3. CARS ----------------------------------------------------------------------------------------------------- */
function trfModern() { return !CITY.theme || !CITY.theme.car || CITY.theme.car === "sedan"; }
function trfNewCar(L, d, s, q, police) {
  const k = trfK(), modern = trfModern();
  let pv;
  if (police && modern) pv = 8;
  else { const r = Math.random(); pv = r < 0.16 ? 6 : r < 0.34 ? 3 : [0, 1, 2, 4, 5, 7][Math.floor(Math.random() * 6)]; }
  const c = { id: TRF.id++, L, d, s, q, v: 0, v0: 0, k, pv, police: pv === 8, siren: false, h: (Math.random() * 1e9) | 0, hint: { i: 0 }, st: 0, next: null, wait: 0, stopT: 0, blockT: 0, honkT: 0,
    wpx: 64 * k, lpx: 144 * k, W: 2 * k, D: 4.5 * k, brk: false, sig: 0, x: 0, y: 0, ang: 0, mood: 0.92 + Math.random() * 0.14 };
  if (Math.random() < 0.08 && !c.police) c.mood = 1.12 + Math.random() * 0.08;   // the odd driver in a hurry
  c.v0 = L.lim * TRF_MS * k * c.mood; c.v = c.v0 * 0.8;
  trfPlace(c);
  return c;
}
function trfPlace(c) { const P = trfAt(c.L, c.d, c.s, c.q, c.hint), sh = c.sh || 0; c.x = P[0] + P[3] * sh; c.y = P[1] - P[2] * sh; c.ang = Math.atan2(P[3], P[2]); }
function trfPickNext(c) {
  const n = trfEndNode(c.L, c.d), opts = [];
  const hin = trfAt(c.L, c.d, c.L.L - 0.01, c.q, null);
  for (const L of n.links) {
    const d = L.a === n ? 1 : -1;
    if (L === c.L && L.a !== L.b && n.links.length > 1) continue;
    if (L.ow && L.ow !== d) continue;
    const h = trfEndHead(L, n), dot = hin[2] * h[0] + hin[3] * h[1], cr = hin[2] * h[1] - hin[3] * h[0];
    let w = dot > 0.85 ? 3 : dot > -0.5 ? (cr > 0 ? 1.7 : 1.2) : 0.08;
    w *= 0.7 + L.rank * 0.1;
    if (L.b === L.a || L.L < 3 * c.k) w *= 0.3;
    opts.push({ L, d, w, dot, cr });
  }
  if (!opts.length) return null;
  let tot = 0; for (const o of opts) tot += o.w;
  let r = Math.random() * tot; for (const o of opts) { r -= o.w; if (r <= 0) return { L: o.L, d: o.d, q: Math.min(c.q, o.L.lanes - 1), turn: o.dot < 0.85 ? (o.cr > 0 ? 1 : -1) : 0 }; }
  const o = opts[opts.length - 1]; return { L: o.L, d: o.d, q: Math.min(c.q, o.L.lanes - 1), turn: 0 };
}
function trfSpawn(nearOk) {
  const N = TRF.net; if (!N || !N.links.length || !N.total) return;
  const [px, py] = trfM(player.x, player.y), V = trfViewM(), k = N.k;
  for (let tries = 0; tries < 14; tries++) {
    const r = Math.random() * N.total; let lo = 0, hi = N.cum.length - 1;
    while (lo < hi) { const mid = (lo + hi) >> 1; if (N.cum[mid] < r) lo = mid + 1; else hi = mid; }
    const L = N.links[lo], d = L.ow ? L.ow : (Math.random() < 0.5 ? 1 : -1), q = Math.floor(Math.random() * L.lanes);
    const ra = trfR(d > 0 ? L.a : L.b, L), rb = trfR(d > 0 ? L.b : L.a, L), D = 4.5 * k;
    if (L.L - ra - rb < D * 2) continue;
    const s = ra + D + Math.random() * (L.L - ra - rb - D * 2);
    const P = trfAt(L, d, s, q, null), dist = Math.hypot(P[0] - px, P[1] - py);
    if (dist > V.r * 2.4 || dist < (nearOk ? 9 : V.r * 1.05)) continue;
    if (!nearOk && P[0] > V.x0 - 4 && P[0] < V.x1 + 4 && P[1] > V.y0 - 4 && P[1] < V.y1 + 4) continue;
    if (TRF.cars.some(o => Math.hypot(o.x - P[0], o.y - P[1]) < D * 2.6)) continue;
    const c = trfNewCar(L, d, s, q, Math.random() < 0.06);
    TRF.cars.push(c); TRF.stats.spawned++;
    return c;
  }
  return null;
}
// the visible area in metres (from the last frame), with a radius
function trfViewM() {
  const v = TRF.view;
  let x0, y0, x1, y1;
  if (v) { [x0, y0] = trfM(v.l, v.t); [x1, y1] = trfM(v.l + v.w, v.t + v.h); }
  else { const [px, py] = trfM(player.x, player.y); x0 = px - 9; x1 = px + 9; y0 = py - 16; y1 = py + 16; }
  return { x0, y0, x1, y1, r: Math.max(14, Math.hypot(x1 - x0, y1 - y0) / 2) };
}
function trfWant() {
  const N = TRF.net; if (!N) return 0;
  const V = trfViewM();
  // about one car per 55 real m of lane within the ring, capped for phones
  const ring = Math.PI * Math.pow(V.r * 2.4, 2), area = Math.PI * N.R * N.R;
  const lane = N.total * Math.min(1, ring / area);
  return Math.max(0, Math.min(16, Math.round(lane / (55 * N.k) * 0.5)));
}

/* --- 4. STEP ----------------------------------------------------------------------------------------------------- */
function trfStep(dt) {
  TRF.on = trfEnabled();
  if (!TRF.on) { if (TRF.cars.length) trfClear(); return; }
  TRF.t = runTime;
  const [px, py] = trfM(player.x, player.y);
  const N = TRF.net;
  if (!N || Math.hypot(px - N.cx, py - N.cy) > 60 || (TRF.pending && runTime - TRF.buildT > 1.2) || N.k !== trfK()) {
    TRF.buildT = runTime;
    const old = TRF.cars.map(c => ({ c, x: c.x, y: c.y, hx: Math.cos(c.ang), hy: Math.sin(c.ang) }));
    trfBuildNet(px, py);
    TRF.cars = [];
    for (const o of old) { const c = trfRemap(o); if (c) TRF.cars.push(c); }
  }
  const V = trfViewM(), want = trfWant();
  if (TRF.cars.length < want) trfSpawn(runTime < (TRF.startT || 0) + 2);
  const k = TRF.net.k;
  // lanes: cars by (link, direction, lane)
  const lanes = new Map();
  for (const c of TRF.cars) if (c.st === 0) { const key = c.L.id * 16 + (c.d > 0 ? 0 : 8) + c.q; let a = lanes.get(key); if (!a) lanes.set(key, a = []); a.push(c); }
  const a0 = 1.7 * k, b0 = 2.8 * k, s0 = 2.0 * k, T = 1.2, bmax = 8 * k;
  const pm = typeof VEH !== "undefined" && VEH.me ? VEH.me : null;
  const obst = trfObstacles();
  const keep = [];
  for (const c of TRF.cars) {
    if (c.dead) continue;
    const far = Math.hypot(c.x - px, c.y - py) > V.r * 3.2 && !(c.x > V.x0 - 6 && c.x < V.x1 + 6 && c.y > V.y0 - 6 && c.y < V.y1 + 6);
    if (far && !c.keep) { trfDrop(c); continue; }
    let acc;
    if (c.st === 1) acc = trfTurnStep(c, dt, a0, b0, s0, T, lanes, obst);
    else acc = trfDriveStep(c, dt, a0, b0, s0, T, lanes, obst, V);
    if (c.dead) continue;
    c.brk = acc < -0.6 * k || c.v < 0.15 * k;
    keep.push(c);
  }
  TRF.cars = keep;
  // the player's car hits a car → it becomes a real vehicle (and the police may have seen)
  if (pm && !pm.dead) trfPlayerCarHits(pm);
  // the player on foot can't walk through cars
  if (!player.inVehicle) trfPushPlayer();
}
function trfIdm(v, v0, gap, dv, a0, b0, s0, T) {
  const ss = s0 + Math.max(0, v * T + v * dv / (2 * Math.sqrt(a0 * b0)));
  const free = 1 - Math.pow(v / Math.max(0.05, v0), 4);
  return a0 * (free - (gap < 1e8 ? Math.pow(ss / Math.max(0.05, gap), 2) : 0));
}
// people and live vehicles in front of a car: [x, y, radius, vx, vy] in metres
function trfObstacles() {
  const out = [];
  if (!player.inVehicle) { const [x, y] = trfM(player.x, player.y); out.push([x, y, 0.45, 0, 0, 1]); }
  // drivers brake for anyone in the road: townsfolk, and whoever's out there (a few dozen nearest)
  const [pxm, pym] = trfM(player.x, player.y);
  if (typeof TF !== "undefined" && TF.walk) { let n = 0; for (const p of TF.walk) { const W = p.w; if (!W || W.inside || !p.alive) continue; const [x, y] = trfM(W.x, W.y); if (Math.abs(x - pxm) > 70 || Math.abs(y - pym) > 70) continue; out.push([x, y, 0.4, 0, 0, 1]); if (++n > 40) break; } }
  if (typeof eAct !== "undefined") { let n = 0; for (let j = 0; j < MAX_E; j++) { if (!eAct[j]) continue; const [x, y] = trfM(eX[j], eY[j]); if (Math.abs(x - pxm) > 60 || Math.abs(y - pym) > 60) continue; out.push([x, y, 0.45, 0, 0, 3]); if (++n > 30) break; } }
  if (typeof VEH !== "undefined") for (const v of VEH.list) {
    if (v.dead && !v.wreck) continue;
    const [x, y] = trfM(v.x, v.y); out.push([x, y, Math.max(v.L, v.D) / 64, (v.vx || 0) / 32, (v.vy || 0) / 32, v === VEH.me ? 2 : 0, v]);
  }
  return out;
}
// the nearest obstacle in a car's path: distance from its front bumper (or 1e9)
function trfAhead(c, obst, reach) {
  const hx = Math.cos(c.ang), hy = Math.sin(c.ang);
  let best = 1e9, who = null;
  for (const o of obst) {
    const dx = o[0] - c.x, dy = o[1] - c.y, fwd = dx * hx + dy * hy;
    if (fwd < 0 || fwd > reach + c.D) continue;
    if (o[6] && o[6].vehObs) continue;
    const lat = Math.abs(-dx * hy + dy * hx);
    if (lat > c.W / 2 + o[2] + 0.25 * c.k) continue;
    const d = fwd - c.D / 2 - o[2];
    if (d < best) { best = d; who = o; }
  }
  return { d: best, o: who };
}
function trfDriveStep(c, dt, a0, b0, s0, T, lanes, obst, V) {
  const L = c.L, k = c.k, endN = trfEndNode(L, c.d), rIn = trfR(endN, L);
  let v0 = c.v0;
  if (c.siren && c.police) v0 *= 1.5;
  // leader on the same lane
  let gap = 1e9, dv = 0;
  const lane = lanes.get(L.id * 16 + (c.d > 0 ? 0 : 8) + c.q) || [];
  for (const o of lane) { if (o === c || o.s <= c.s) continue; const g = o.s - c.s - (o.D + c.D) / 2; if (g < gap) { gap = g; dv = c.v - o.v; } }
  // the junction ahead
  const toEnd = L.L - rIn - c.s;   // centre to the junction mouth
  const deg = endN.links.length;
  if (!c.next && toEnd < 40 * k + c.v * 3) c.next = deg >= 2 ? trfPickNext(c) : null;
  let stopAt = 1e9;   // distance from the front bumper to where it must stop
  const line = toEnd - c.D / 2 - 0.3 * k;
  if (deg === 1 || !c.next) {
    // dead end (or the edge of the net): stop, then turn around — or quietly leave if nobody's looking
    stopAt = L.L - c.s - c.D / 2 - 0.4 * k;
    if (stopAt < 0.6 * k && c.v < 0.4 * k) {
      const vis = c.x > V.x0 - 5 && c.x < V.x1 + 5 && c.y > V.y0 - 5 && c.y < V.y1 + 5;
      if (!vis || !L.ow) { if (!vis) { trfDrop(c); return 0; } c.d = -c.d; c.s = L.L - c.s; c.q = Math.min(c.q, L.lanes - 1); c.next = null; trfPlace(c); return 0; }
      trfDrop(c); return 0;
    }
  } else {
    const hin = trfAt(L, c.d, Math.max(0, L.L - rIn - 0.01), c.q, null);
    let go = true;
    if (endN.sig) {
      const ph = trfPhase(endN, hin[2], hin[3]), st = trfSig(endN, ph);
      c.sig = st;
      if (st === 2) go = false;
      else if (st === 1) go = line < c.v * c.v / (2 * b0) + 0.5 * k;   // too close to stop → go through on amber
    } else if (deg >= 3) {
      const minor = L.rank < endN.maxRank || (endN.stop && endN.allEq);   // side roads give way; equal roads with a sign: all-way stop
      if (minor) {
        if (c.wait < 0.7) { go = false; if (line < 1.2 * k && c.v < 0.35 * k) c.wait += dt; }
        else go = trfBoxFree(endN, c) && trfMajorClear(endN, c);
      } else go = trfBoxFree(endN, c, true);
    }
    // don't block the box: room on the far side
    if (go && c.next) { const sp = trfEntrySpace(c.next); if (sp < c.D + s0) go = false; }
    if (!go) stopAt = line;
    else if (c.next && c.next.turn) {   // slow for the turn
      const vt = (c.next.turn ? 6.5 : 12) * k;
      if (c.v > vt && line > 0) { const need = (c.v * c.v - vt * vt) / (2 * Math.max(0.5, line)); if (need > 0.4 * b0) v0 = Math.min(v0, Math.max(vt, c.v - need * dt * 2)); }
    }
  }
  if (stopAt + s0 < gap) { gap = Math.max(0.01, stopAt + s0 * 0.92); dv = c.v; }   // the IDM keeps s0 to an obstacle: put the bumper on the line
  // people, the player's car, wrecks in the lane
  const A = trfAhead(c, obst, Math.max(8 * k, c.v * 2.5 + 6 * k));
  if (A.d < gap) { gap = Math.max(0.01, A.d); dv = c.v - (A.o ? Math.hypot(A.o[3], A.o[4]) * 0.5 : 0); }
  if (A.o && A.d < 3 * k && c.v < 0.3 * k) { c.blockT += dt; if (c.blockT > 2.2 && runTime > c.honkT) { c.honkT = runTime + 3.5 + Math.random() * 2; trfHonk(c); } } else c.blockT = Math.max(0, c.blockT - dt);
  // someone standing in the road: after a honk, ease around them (left if they're on the right, else right)
  if (A.o && A.o[5] === 1 && c.blockT > 2.6 && !c.shT) {
    const hx = Math.cos(c.ang), hy = Math.sin(c.ang), lat = (A.o[0] - c.x) * -hy + (A.o[1] - c.y) * hx, room = L.w / 2 + (L.ow ? 0 : L.w / 2) * 0.9;
    c.shT = Math.min(room, c.W + 0.7 + Math.abs(lat) * 0.2) * (lat >= 0 ? 1 : -1);
  } else if (c.shT && (!A.o || A.o[5] !== 1) && c.blockT <= 0) c.shT = 0;
  if ((c.sh || 0) !== (c.shT || 0)) { const st = 1.4 * k * dt, d = (c.shT || 0) - (c.sh || 0); c.sh = (c.sh || 0) + Math.max(-st, Math.min(st, d)); }
  let acc = trfIdm(c.v, v0, gap, dv, a0, b0, s0, T);
  acc = Math.max(-8 * k, Math.min(a0, acc));
  c.v = Math.max(0, c.v + acc * dt);
  if (gap < 0.05 && c.v > 0) c.v = Math.min(c.v, gap / Math.max(dt, 1e-3));
  c.s += c.v * dt;
  // into the junction
  if (c.next && deg >= 2 && c.s >= L.L - rIn - 0.01) { trfStartTurn(c, endN, rIn); return acc; }
  if (c.s > L.L) c.s = L.L;
  trfPlace(c);
  return acc;
}
function trfBoxFree(n, c, majorOnly) {
  for (const o of n.occ) { if (o === c || o.dead) continue; if (!majorOnly) return false; if (o.L.rank < n.maxRank || Math.abs(Math.cos(o.ang - c.ang)) < 0.7) return false; }
  return true;
}
// no main-road car about to arrive (gap acceptance for the side road)
function trfMajorClear(n, c) {
  if (n.stop && n.allEq) return true;   // all-way stop: first come, first served (the box decides)
  for (const o of TRF.cars) {
    if (o === c || o.st !== 0 || trfEndNode(o.L, o.d) !== n || o.L.rank < n.maxRank) continue;
    if (o.wait > 0) continue;   // they stop too
    const d = o.L.L - trfR(n, o.L) - o.s;
    if (d < 4 * c.k + o.v * 3.2) return false;
  }
  return true;
}
// free length at the start of the next lane
function trfEntrySpace(nx) {
  let m = 1e9;
  for (const o of TRF.cars) {
    if (o.st === 1 && o.turn && o.turn.next.L === nx.L && o.turn.next.d === nx.d) { m = Math.min(m, 0); continue; }
    if (o.st !== 0 || o.L !== nx.L || o.d !== nx.d || o.q !== nx.q) continue;
    m = Math.min(m, o.s - o.D / 2 - trfR(trfEndNode(nx.L, -nx.d), nx.L));
  }
  return m;
}
function trfStartTurn(c, n, rIn) {
  const nx = c.next, rOut = trfR(n, nx.L);
  const P0 = trfAt(c.L, c.d, c.L.L - rIn, c.q, null), P2 = trfAt(nx.L, nx.d, rOut, nx.q, null);
  let P1x = (P0[0] + P2[0]) / 2, P1y = (P0[1] + P2[1]) / 2;
  const cr = P0[2] * P2[3] - P0[3] * P2[2];
  if (Math.abs(cr) > 0.12) {
    const dx = P2[0] - P0[0], dy = P2[1] - P0[1], a = (dx * P2[3] - dy * P2[2]) / cr;
    const ix = P0[0] + P0[2] * a, iy = P0[1] + P0[3] * a;
    if (a > 0 && Math.hypot(ix - P0[0], iy - P0[1]) < rIn * 3 + 6 * c.k) { P1x = ix; P1y = iy; }
  }
  const len = (Math.hypot(P2[0] - P0[0], P2[1] - P0[1]) + Math.hypot(P1x - P0[0], P1y - P0[1]) + Math.hypot(P2[0] - P1x, P2[1] - P1y)) / 2;
  c.turn = { p0: [P0[0], P0[1]], p1: [P1x, P1y], p2: [P2[0], P2[1]], len: Math.max(0.3, len), u: 0, node: n, next: nx, rOut };
  c.st = 1; c.wait = 0; n.occ.add(c);
}
function trfTurnStep(c, dt, a0, b0, s0, T, lanes, obst) {
  const t = c.turn, k = c.k;
  let gap = 1e9, dv = 0;
  // whoever is in front: cars on the next lane near its start, others turning into it ahead of us
  for (const o of TRF.cars) {
    if (o === c) continue;
    if (o.st === 0 && o.L === t.next.L && o.d === t.next.d && o.q === t.next.q) { const g = (1 - t.u) * t.len + (o.s - t.rOut) - (o.D + c.D) / 2; if (g < gap) { gap = g; dv = c.v - o.v; } }
    else if (o.st === 1 && o.turn.next.L === t.next.L && o.turn.next.d === t.next.d && o.turn.u > t.u) { const g = (o.turn.u - t.u) * t.len - (o.D + c.D) / 2; if (g < gap) { gap = g; dv = c.v - o.v; } }
  }
  const A = trfAhead(c, obst, Math.max(6 * k, c.v * 2 + 4 * k));
  // someone standing on the corner of the turn: wait, honk, then creep through at walking pace (they step aside —
  // a car parked in the box would otherwise lock the whole junction)
  const person = A.o && A.o[5] === 1;
  if (person && c.v < 0.3 * k) { c.blockT = (c.blockT || 0) + dt; if (c.blockT > 2.2 && runTime > (c.honkT || 0)) { c.honkT = runTime + 3.5 + Math.random() * 2; trfHonk(c); } }
  else if (!person) c.blockT = Math.max(0, (c.blockT || 0) - dt);
  const creep = person && c.blockT > 4;
  if (A.d < gap && !creep) { gap = Math.max(0.01, A.d); dv = c.v; }
  const vt = (Math.abs(c.next && c.next.turn) ? 6.5 : 12) * k;
  let acc = trfIdm(c.v, Math.min(c.v0, vt, creep ? 1.2 * k : 1e9), gap, dv, a0, b0, s0, T);
  acc = Math.max(-8 * k, Math.min(a0, acc));
  c.v = Math.max(0, c.v + acc * dt);
  t.u = Math.min(1, t.u + c.v * dt / t.len);
  const u = t.u, iu = 1 - u;
  c.x = iu * iu * t.p0[0] + 2 * iu * u * t.p1[0] + u * u * t.p2[0];
  c.y = iu * iu * t.p0[1] + 2 * iu * u * t.p1[1] + u * u * t.p2[1];
  const dx = 2 * iu * (t.p1[0] - t.p0[0]) + 2 * u * (t.p2[0] - t.p1[0]), dy = 2 * iu * (t.p1[1] - t.p0[1]) + 2 * u * (t.p2[1] - t.p1[1]);
  if (dx * dx + dy * dy > 1e-8) c.ang = Math.atan2(dy, dx);
  if (u >= 1) {
    t.node.occ.delete(c);
    c.L = t.next.L; c.d = t.next.d; c.q = t.next.q; c.s = t.rOut; c.st = 0; c.next = null; c.turn = null; c.hint.i = 0; c.wait = 0; c.blockT = 0;
    c.v0 = c.L.lim * TRF_MS * k * c.mood;
    trfPlace(c);
  }
  return acc;
}
// after a rebuild: find each car's lane again (or let it go)
function trfRemap(o) {
  const N = TRF.net, c = o.c; if (!N) return null;
  if (c.st === 1 && c.turn) { c.x = c.turn.p2[0]; c.y = c.turn.p2[1]; }
  let best = null, bd = 1.2 * N.k + c.W;
  for (const L of N.links) {
    const p = L.pts;
    for (let i = 0; i + 3 < p.length; i += 2) {
      const ax = p[i], ay = p[i + 1], bx = p[i + 2], by = p[i + 3];
      if (Math.min(ax, bx) - 12 > c.x || Math.max(ax, bx) + 12 < c.x || Math.min(ay, by) - 12 > c.y || Math.max(ay, by) + 12 < c.y) continue;
      const dx = bx - ax, dy = by - ay, l2 = dx * dx + dy * dy || 1, t = Math.max(0, Math.min(1, ((c.x - ax) * dx + (c.y - ay) * dy) / l2));
      const d = Math.hypot(ax + dx * t - c.x, ay + dy * t - c.y) - L.w / 2;
      const dot = (dx * o.hx + dy * o.hy) / Math.sqrt(l2);
      if (d < bd && Math.abs(dot) > 0.6) { bd = d; best = { L, d: dot > 0 ? 1 : -1, sf: L.cum[i / 2] + t * Math.sqrt(l2) }; }
    }
  }
  if (!best || (best.L.ow && best.L.ow !== best.d)) return null;
  c.L = best.L; c.d = best.d; c.s = best.d > 0 ? best.sf : best.L.L - best.sf; c.q = Math.min(c.q, best.L.lanes - 1);
  c.st = 0; c.turn = null; c.next = null; c.hint = { i: 0 }; c.wait = 0; c.k = N.k;
  c.v0 = c.L.lim * TRF_MS * c.k * c.mood;
  trfPlace(c);
  return c;
}
function trfDrop(c) { c.dead = true; if (c.turn && c.turn.node) c.turn.node.occ.delete(c); }
function trfClear() { for (const c of TRF.cars) trfDrop(c); TRF.cars = []; }
function trfHonk(c) {
  if (typeof sfx !== "function" || runTime < TRF.hornT) return;
  TRF.hornT = runTime + 1.2;
  sfx(415, 405, 0.32, "square", 0.05); setTimeout(() => sfx(415, 405, 0.18, "square", 0.04), 380);
}

/* --- 5. WHEN SOMETHING REAL HAPPENS: the car becomes a physics vehicle ---------------------------------------- */
function trfPromote(c, why) {
  if (!c || c.dead || typeof vehNew !== "function") return null;
  const lx = c.x * 32 - CITY.orx, ly = c.y * 32 - CITY.ory;
  let v = null;
  try {
    const kind = vehKindOf("car", c.pv, true, c.h);
    v = vehNew(kind, lx, ly, c.ang, 64, 144, { key: "trf" + c.id, h: c.h, v: c.pv, themed: true, art: "car", k: c.k });
  } catch (e) { if (window.trackProgress) window.trackProgress("trfPromote: " + e.message, true); }
  trfDrop(c);
  TRF.cars = TRF.cars.filter(o => o !== c);
  if (!v) return null;
  const sp = c.v * 32; v.vx = Math.cos(c.ang) * sp; v.vy = Math.sin(c.ang) * sp;
  v.why = why || ""; v.trf = 1; if (c.police) v.policeCar = 1;
  TRF.stats.promoted++;
  return v;
}
// oriented-box overlap (local px): a = {x, y, c, s, hf, hw}
function trfObb(a, b) {
  const ax = [[a.c, a.s], [-a.s, a.c]], bx = [[b.c, b.s], [-b.s, b.c]], dx = b.x - a.x, dy = b.y - a.y;
  for (const [ux, uy] of ax.concat(bx)) {
    const ra = a.hf * Math.abs(a.c * ux + a.s * uy) + a.hw * Math.abs(-a.s * ux + a.c * uy);
    const rb = b.hf * Math.abs(b.c * ux + b.s * uy) + b.hw * Math.abs(-b.s * ux + b.c * uy);
    if (Math.abs(dx * ux + dy * uy) > ra + rb) return false;
  }
  return true;
}
function trfBoxPx(c) { return { x: c.x * 32 - CITY.orx, y: c.y * 32 - CITY.ory, c: Math.cos(c.ang), s: Math.sin(c.ang), hf: c.lpx / 2, hw: c.wpx / 2 }; }
function trfPlayerCarHits(pm) {
  const B = typeof vehBox === "function" ? vehBox(pm, {}) : { cx: pm.x, cy: pm.y, c: Math.cos(pm.ang), s: Math.sin(pm.ang), hf: pm.D / 2, hw: pm.L / 2 };
  const a = { x: B.cx, y: B.cy, c: B.c, s: B.s, hf: B.hf + 1, hw: B.hw + 1 };
  for (const c of TRF.cars.slice()) {
    const b = trfBoxPx(c);
    if (Math.abs(b.x - a.x) > 400 || Math.abs(b.y - a.y) > 400) continue;
    if (!trfObb(a, b)) continue;
    const v = trfPromote(c, "crash");
    if (v && TRF.onCrash) try { TRF.onCrash(c, v); } catch (e) {}
  }
}
function trfPushPlayer() {
  const r = 7;
  for (const c of TRF.cars) {
    const b = trfBoxPx(c), dx = player.x - b.x, dy = player.y - b.y;
    if (Math.abs(dx) > 200 || Math.abs(dy) > 200) continue;
    const u = dx * b.c + dy * b.s, w = -dx * b.s + dy * b.c, eu = b.hf + r - Math.abs(u), ew = b.hw + r - Math.abs(w);
    if (eu <= 0 || ew <= 0) continue;
    if (eu < ew) { const sg = u < 0 ? -1 : 1; player.x += b.c * eu * sg; player.y += b.s * eu * sg; }
    else { const sg = w < 0 ? -1 : 1; player.x += -b.s * ew * sg; player.y += b.c * ew * sg; }
  }
}

/* --- 6. DRAWING -------------------------------------------------------------------------------------------------- */
function trfSprite(c) {
  const key = c.pv + "|" + c.k.toFixed(3) + "|" + (CITY.themeKey || "");
  let s = TRF.spr.get(key); if (s) return s;
  const RES = 2, Lp = c.wpx, Dp = c.lpx, pad = Math.ceil(10 * c.k) + 3;
  s = crCanvas(Math.ceil((Lp + pad * 2) * RES), Math.ceil((Dp + pad * 2) * RES));
  const g = s.getContext("2d"); g.scale(RES, RES); g.translate(Lp / 2 + pad, Dp / 2 + pad);
  crVehicle.k = c.k;
  try { crVehicle(g, "car", Lp, Dp, c.pv, c.h, true, false); } catch (e) {} finally { crVehicle.k = 0; }
  s.res = RES;
  TRF.spr.set(key, s); if (TRF.spr.size > 60) TRF.spr.delete(TRF.spr.keys().next().value);
  return s;
}
function trfDraw(g, l, t, vw, vh) {
  TRF.view = { l, t, w: vw, h: vh };
  if (!TRF.on || !TRF.net) return;
  const x1 = l + vw, y1 = t + vh, blink = (runTime * 2.2) % 1 < 0.5, k = TRF.net.k;
  // signal heads, one per approach (right-hand side, at the stop line)
  for (const n of TRF.net.nodes.values()) {
    if (!n.sig) continue;
    const nx = n.x * 32 - CITY.orx, ny = n.y * 32 - CITY.ory;
    if (nx < l - 300 || nx > x1 + 300 || ny < t - 300 || ny > y1 + 300) continue;
    for (const L of n.links) {
      const d = L.b === n ? 1 : -1; if (L.ow && L.ow !== d) continue;
      const rIn = trfR(n, L), P = trfAt(L, d, Math.max(0, L.L - rIn), Math.max(0, L.lanes - 1), null), st = trfSig(n, trfPhase(n, P[2], P[3]));
      const off = (L.ow ? L.w / 2 : L.w / 2) - trfLaneOff(L, Math.max(0, L.lanes - 1)) + 0.9 * k;
      const hx = P[0] + -P[3] * off, hy = P[1] + P[2] * off;
      const sx = hx * 32 - CITY.orx, sy = hy * 32 - CITY.ory, S = Math.max(4, 10 * k);
      g.save(); g.translate(sx, sy); g.rotate(Math.atan2(P[3], P[2]) + Math.PI / 2);
      g.fillStyle = "#1b1b1b"; g.fillRect(-S * 0.5, -S * 1.4, S, S * 2.8);
      const cols = ["#00e676", "#ffc400", "#ff1744"], ys = [S * 0.9, 0, -S * 0.9];
      for (let i = 0; i < 3; i++) { g.fillStyle = i === st ? cols[i] : "#333"; g.beginPath(); g.arc(0, ys[i], S * 0.36, 0, Math.PI * 2); g.fill(); }
      if (st >= 0) { g.globalAlpha = 0.28; g.fillStyle = cols[st]; g.beginPath(); g.arc(0, ys[st], S * 0.9, 0, Math.PI * 2); g.fill(); g.globalAlpha = 1; }
      g.restore();
    }
  }
  for (const c of TRF.cars) {
    const cx = c.x * 32 - CITY.orx, cy = c.y * 32 - CITY.ory;
    if (cx < l - 200 || cx > x1 + 200 || cy < t - 200 || cy > y1 + 200) continue;
    const s = trfSprite(c), R = s.res;
    g.save(); g.translate(cx, cy); g.rotate(c.ang + Math.PI / 2);
    g.drawImage(s, -s.width / R / 2, -s.height / R / 2, s.width / R, s.height / R);
    const hw = c.wpx / 2, hl = c.lpx / 2, lr = Math.max(1.2, 3.2 * c.k);
    // brake lights, indicators, the lightbar
    if (c.brk) { g.fillStyle = "rgba(255,30,30,0.95)"; g.fillRect(-hw * 0.8, hl - lr * 1.1, lr * 2, lr); g.fillRect(hw * 0.8 - lr * 2, hl - lr * 1.1, lr * 2, lr); g.globalAlpha = 0.25; g.beginPath(); g.arc(0, hl + lr, hw * 0.9, 0, Math.PI * 2); g.fill(); g.globalAlpha = 1; }
    const turn = c.st === 1 ? (c.turn && c.turn.next.turn) : (c.next && c.next.turn && (c.L.L - c.s) < 30 * c.k ? c.next.turn : 0);
    if (turn && blink) { g.fillStyle = "#ffab00"; const sx = turn > 0 ? hw * 0.75 : -hw * 0.75 - lr; g.fillRect(sx, -hl + lr * 0.4, lr, lr); g.fillRect(sx, hl - lr * 1.4, lr, lr); }
    if (c.siren) { const a = (runTime * 6) % 2 < 1; g.fillStyle = a ? "#ff1744" : "#2979ff"; g.fillRect(-hw * 0.7, -hl * 0.12, hw * 0.7, lr * 1.2); g.fillStyle = a ? "#2979ff" : "#ff1744"; g.fillRect(0, -hl * 0.12, hw * 0.7, lr * 1.2); g.globalAlpha = 0.16; g.beginPath(); g.arc(0, 0, hl * 1.05, 0, Math.PI * 2); g.fill(); g.globalAlpha = 1; }
    g.restore();
  }
}
// headlights after dark
function trfLights(push) {
  if (!TRF.on) return;
  for (const c of TRF.cars) {
    const cx = c.x * 32 - CITY.orx, cy = c.y * 32 - CITY.ory;
    if (Math.abs(cx - player.x) > 1500 || Math.abs(cy - player.y) > 1100) continue;
    const fx = Math.cos(c.ang), fy = Math.sin(c.ang), hk = Math.max(0.5, c.k);
    for (let i = 1; i <= 2; i++) push(cx + fx * (c.lpx * 0.5 + 60 * i * hk), cy + fy * (c.lpx * 0.5 + 60 * i * hk), (60 + 35 * i) * hk, 0.7, "car");
  }
}

/* --- 7. WIRING --------------------------------------------------------------------------------------------------- */
(function trfWire() {
  if (typeof V10 !== "undefined") {
    V10.onRunStart.push(() => { trfClear(); TRF.net = null; TRF.spr.clear(); TRF.startT = runTime; TRF.stats = { spawned: 0, promoted: 0, builds: 0 }; });
    V10.onStep.push(dt => { try { trfStep(dt); } catch (e) { if (window.trackProgress) window.trackProgress("traffic: " + e.message, true); trfClear(); } });
  }
  if (typeof vehRenderLayer === "function") { const _vr = vehRenderLayer; window.vehRenderLayer = vehRenderLayer = function (g, l, t, vw, vh) { _vr(g, l, t, vw, vh); try { trfDraw(g, l, t, vw, vh); } catch (e) {} }; }
  if (typeof scnLights === "function") { const _sl = scnLights; window.scnLights = scnLights = function (push) { _sl(push); trfLights(push); }; }
  // shots: a bullet that meets a car makes it real first (js/vehicles.js then takes the hit)
  if (typeof cityProjWall === "function") {
    const _cpw = window.cityProjWall;
    window.cityProjWall = function (i, dt) {
      if (TRF.cars.length) {
        const st = pStyle[i];
        if (!(st === 1 || st === 6 || st === 8)) {
          const x1 = pX[i], y1 = pY[i], x0 = x1 - pVX[i] * dt, y0 = y1 - pVY[i] * dt;
          for (const c of TRF.cars) {
            const b = trfBoxPx(c);
            if (Math.abs(b.x - x1) > 260 || Math.abs(b.y - y1) > 260) continue;
            // the segment in the car's frame, against its box (slab test)
            const t0 = trfSegBox(x0 - b.x, y0 - b.y, x1 - b.x, y1 - b.y, b);
            if (t0 >= 0) { trfPromote(c, "shot"); break; }
          }
        }
      }
      return _cpw(i, dt);
    };
  }
  if (typeof triggerRocketDetonation === "function") {
    const _trd = window.triggerRocketDetonation;
    window.triggerRocketDetonation = function (x, y, dmg, rad) {
      if (TRF.cars.length) for (const c of TRF.cars.slice()) { const b = trfBoxPx(c); if (Math.hypot(b.x - x, b.y - y) < (rad || 60) * 1.4 + 40) trfPromote(c, "blast"); }
      return _trd.apply(this, arguments);
    };
  }
})();
function trfSegBox(x0, y0, x1, y1, b) {
  const u0 = x0 * b.c + y0 * b.s, w0 = -x0 * b.s + y0 * b.c, u1 = x1 * b.c + y1 * b.s, w1 = -x1 * b.s + y1 * b.c;
  let tmin = 0, tmax = 1;
  for (const [p0, p1, h] of [[u0, u1, b.hf], [w0, w1, b.hw]]) {
    const d = p1 - p0;
    if (Math.abs(d) < 1e-9) { if (p0 < -h || p0 > h) return -1; continue; }
    let ta = (-h - p0) / d, tb = (h - p0) / d; if (ta > tb) { const q = ta; ta = tb; tb = q; }
    tmin = Math.max(tmin, ta); tmax = Math.min(tmax, tb); if (tmin > tmax) return -1;
  }
  return tmin;
}
// what road is this (for the police: the limit where you are) — null off the road
function trfRoadAt(xm, ym) {
  const N = TRF.net; if (!N) return null;
  let best = null, bd = 1e9;
  for (const L of N.links) {
    const p = L.pts;
    for (let i = 0; i + 3 < p.length; i += 2) {
      const ax = p[i], ay = p[i + 1], bx = p[i + 2], by = p[i + 3], m = L.w / 2 + 1;
      if (Math.min(ax, bx) - m > xm || Math.max(ax, bx) + m < xm || Math.min(ay, by) - m > ym || Math.max(ay, by) + m < ym) continue;
      const dx = bx - ax, dy = by - ay, l2 = dx * dx + dy * dy || 1, t = Math.max(0, Math.min(1, ((xm - ax) * dx + (ym - ay) * dy) / l2));
      const d = Math.hypot(ax + dx * t - xm, ay + dy * t - ym) - L.w / 2;
      if (d < bd) { bd = d; best = L; }
    }
  }
  if (!best || bd > 0.6 * N.k) return null;
  return { mph: best.lim, name: best.name, rank: best.rank, link: best };
}
// EOF:js/traffic.js
