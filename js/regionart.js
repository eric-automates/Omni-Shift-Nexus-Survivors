/* =========================================================================
   OMNI-SHIFT v14.2 — WORLD PROFILES · ART (js/regionart.js)
   Paints the organic homeworlds:
   • continuous terrain: base texture + smooth 1 m masks per field (rock,
     dunes, flats, forest, bog…) blended per 16 m render tile — no square
     cell edges anywhere; long dune crests shaded from a warped ridge field
   • curvy tracks with dusty shoulders and tyre ruts, town streets, the ring road
   • polygon rock formations (cliff, plateau, strata, cast shadow), ring walls
     (sunken courtyards, docking bays, town walls with towers, grandstands)
   • round buildings with smooth walls and dome roofs
   • region props (vaporators, hide tents, banthas, krayt bones, the Sarlacc,
     sandcrawlers, freighters, podracers, stalls…) and the organic map tiles
   Plus the chunk side: polygon / ring collision stamping and wild trees.
   ========================================================================= */
"use strict";

/* --- 1. extra ground patterns ------------------------------------------------------- */
Object.assign(CR_PAT, {
  rock(g, S, c, r) { CR_PAT.noise(g, S, c, r, 420, 0.1, 2); g.strokeStyle = crSh(c, -0.3); g.lineWidth = 1; for (let k = 0; k < 7; k++) { let x = r() * S, y = r() * S; g.beginPath(); g.moveTo(x, y); for (let s = 0; s < 4; s++) { x += (r() - 0.5) * 26; y += (r() - 0.3) * 16; g.lineTo(x, y); } g.stroke(); } for (let i = 0; i < 26; i++) { g.fillStyle = crSh(c, (r() - 0.5) * 0.4); g.beginPath(); g.arc(r() * S, r() * S, 0.8 + r() * 2.2, 0, 7); g.fill(); } },
  dune(g, S, c, r) { CR_PAT.noise(g, S, c, r, 160, 0.05, 2); for (let k = 0; k < 9; k++) { const y0 = k * S / 9 + r() * 4; g.strokeStyle = crSh(c, k & 1 ? 0.14 : -0.1); g.lineWidth = 1.2; g.beginPath(); for (let x = 0; x <= S; x += 4) g.lineTo(x, y0 + Math.sin(x * 0.049 + k * 1.7) * 4); g.stroke(); } },
  ash(g, S, c, r) { CR_PAT.noise(g, S, c, r, 520, 0.12, 2); for (let i = 0; i < 40; i++) { g.fillStyle = crSh(c, -0.35 + r() * 0.2); g.fillRect(r() * S, r() * S, 1 + r() * 3, 1); } },
  spice(g, S, c, r) { CR_PAT.sand(g, S, c, r); for (let i = 0; i < 70; i++) { g.fillStyle = r() < 0.5 ? "rgba(255,120,30,0.35)" : "rgba(200,70,20,0.3)"; g.beginPath(); g.arc(r() * S, r() * S, 0.6 + r() * 1.8, 0, 7); g.fill(); } },
  bog(g, S, c, r) { CR_PAT.grass(g, S, c, r); for (let i = 0; i < 7; i++) { g.fillStyle = "rgba(30,40,30,0.32)"; g.beginPath(); g.ellipse(r() * S, r() * S, 4 + r() * 10, 2 + r() * 6, r() * 3, 0, 7); g.fill(); } for (let i = 0; i < 4; i++) { g.fillStyle = "rgba(60,80,70,0.45)"; g.beginPath(); g.ellipse(r() * S, r() * S, 3 + r() * 6, 2 + r() * 3, r() * 3, 0, 7); g.fill(); } },
  heather(g, S, c, r) { CR_PAT.grass(g, S, c, r); for (let i = 0; i < 110; i++) { g.fillStyle = r() < 0.6 ? "rgba(150,90,150,0.45)" : "rgba(90,110,60,0.4)"; g.beginPath(); g.arc(r() * S, r() * S, 0.8 + r() * 1.6, 0, 7); g.fill(); } }
});
Object.assign(CR_PAT_SIZE, { rock: 128, dune: 128, ash: 128, spice: 128, bog: 128, heather: 128 });

/* --- 2. themes added for the new worlds ---------------------------------------------- */
(function rgThemes() {
  const clone = o => JSON.parse(JSON.stringify(o));
  if (!CITY_THEMES.capsule) {
    const T = clone(CITY_THEMES.starship);
    Object.assign(T, { name: "Capsule-Age Earth", era: "future", car: "hover", tree: "oak", lamp: "street", trash: "paper", flag: "#ff7a1a", weather: "none", tint: "rgba(255,240,200,0.03)", dark: 0.12 });
    Object.assign(T.g, { grass: "#5fa048", grass2: "#6aac52", dirt: "#9a8a62", road: "#55585e", road2: "#5e6268", line: "#ffffff", line2: "#f2f2f2", walk: "#d8d4c8", curb: "#bcb8ac", lot: "#5a5d62", plaza: "#e2ddd0", drive: "#c8c4b8", path: "#d8ccae", field: "#6aac52", water: "#3a8ad0", sand: "#e8d8a8", woods: "#3e7a34", park: "#5ca04c", pool: "#4ac8f0" });
    Object.assign(T.w, { wood: "#f4f0e6", brick: "#f0ece2", masonry: "#f6f2ea", metal: "#d8dce2", stone: "#ece6da", int: "#fbf8f2", edge: "#6a6460", glow: "#ffb84a", glass: "#8fd0ff", frame: "#ff8a3a", rounded: true });
    Object.assign(T.r, { pat: "panel", gable: ["#ff9a4a", "#e8843a"], hip: ["#ffa65a", "#e88c42"], flat: "#f2ece0", trim: "#ff7a1a", hvac: "#cfd4da", solar: false });
    Object.assign(T.fu, { style: "clean", accent: "#ff7a1a", glow: "#ffb84a" });
    CITY_THEMES.capsule = T;
  }
  if (!CITY_THEMES.mesa) {
    const T = clone(CITY_THEMES.modern);
    Object.assign(T, { name: "High-Desert Southwest", tree: "cactus", weather: "dust", tint: "rgba(255,150,80,0.05)", dark: 0.18 });
    Object.assign(T.g, { grass: "#b88a5c", grass2: "#c09264", dirt: "#a87a50", field: "#a88a58", woods: "#8a7a4a", park: "#9a9a5a", sand: "#d4b48a", water: "#3a7a9a" });
    Object.assign(T.r, { pat: "flatstone", flat: "#b89a7a" });
    CITY_THEMES.mesa = T;
  }
  const S = typeof CITY_SIGNS !== "undefined" ? CITY_SIGNS : null;
  if (S) {
    const add = (k, map) => { S[k] = Object.assign(S[k] || {}, map); };
    add("office", { capsule: "CAPSULE CORP.", mesa: "BLACK MESA ANNEX" });
    add("store", { capsule: "CAPSULE MART" }); add("diner", { capsule: "NOODLE HOUSE", mesa: "ROUTE 66 DINER" });
    add("gasstore", { capsule: "HOVER FUEL", mesa: "GAS · FOOD · LODGING" }); add("bar", { capsule: "KARAOKE BAR", mesa: "ROADHOUSE" });
    add("police", { capsule: "CITY POLICE" }); add("clinic", { capsule: "HOSPITAL" });
  }
  if (typeof CITY_THEME_CITIES !== "undefined") { CITY_THEME_CITIES.capsule = CITY_THEME_CITIES.capsule || ["West City"]; CITY_THEME_CITIES.mesa = CITY_THEME_CITIES.mesa || ["Santego"]; }
})();

/* --- 3. class names per world --------------------------------------------------------- */
const RG_CL_DEFAULT = typeof CL_NAMES !== "undefined" ? CL_NAMES.slice() : [];
function rgApplyClassNames() {
  if (typeof CL_NAMES === "undefined") return;
  const L = (RG.P && (RG.P.cl || RG.P.gcl)) || RG_CL_DEFAULT;
  for (let i = 0; i < CL_NAMES.length; i++) CL_NAMES[i] = L[i] || RG_CL_DEFAULT[i];
}

/* --- 4. organic ground ---------------------------------------------------------------- */
const RG_ART = {};
let RG_SCR = null, RG_MASK = null;
function rgScratch() {
  if (!RG_SCR) { RG_SCR = crCanvas(CR.TS, CR.TS); RG_SCR.g = RG_SCR.getContext("2d"); RG_MASK = crCanvas(18, 18); RG_MASK.g = RG_MASK.getContext("2d"); RG_MASK.img = RG_MASK.g.createImageData(18, 18); }
  return RG_SCR;
}
// paint fill (pattern or colour) over the tile through an 18×18 alpha mask sampled at 1 m
function rgMaskFill(g, wx0, wy0, fill, alphaAt) {
  const S = CR.TS, sc = rgScratch(), M = RG_MASK, d = M.img.data, m0x = wx0 / 32, m0y = wy0 / 32;
  let any = 0, full = 1;
  for (let j = 0; j < 18; j++) for (let i = 0; i < 18; i++) {
    const a = alphaAt(m0x + i - 0.5, m0y + j - 0.5), v = Math.max(0, Math.min(255, Math.round(a * 255))), o = (j * 18 + i) * 4;
    d[o] = d[o + 1] = d[o + 2] = 255; d[o + 3] = v;
    if (v > 2) any = 1; if (v < 250) full = 0;
  }
  if (!any) return;
  if (full) { g.fillStyle = fill; g.fillRect(wx0, wy0, S, S); return; }
  M.g.putImageData(M.img, 0, 0);
  const s = sc.g;
  s.setTransform(1, 0, 0, 1, -wx0, -wy0); s.globalCompositeOperation = "source-over"; s.clearRect(wx0, wy0, S, S);
  s.fillStyle = fill; s.fillRect(wx0, wy0, S, S);
  s.globalCompositeOperation = "destination-in"; s.imageSmoothingEnabled = true; s.drawImage(M, wx0 - 32, wy0 - 32, 576, 576);
  s.globalCompositeOperation = "source-over"; s.setTransform(1, 0, 0, 1, 0, 0);
  g.drawImage(sc, wx0, wy0);
}
function rgDuneShade(xm, ym, light) {
  const v = rgF("dune", xm, ym);
  if (v < 0.05) return 0;
  const th = 0.62, u = xm * Math.cos(th) + ym * Math.sin(th) + (cNoise(xm / 900, ym / 900, 611) - 0.5) * 420 + (cNoise(xm / 260, ym / 260, 613) - 0.5) * 60;
  const f = ((u / 95) % 1 + 1) % 1;
  if (light) return f < 0.8 ? v * 0.24 * Math.pow(f / 0.8, 1.6) : 0;          // windward slope brightens up to the crest
  return f >= 0.8 ? v * 0.4 * (f < 0.84 ? (f - 0.8) / 0.04 : 1 - (f - 0.84) / 0.16) : 0;   // slip face: dark right behind it
}
function rgGround(g, wx0, wy0) {
  const P = RG.P, G = P.ground || { base: ["sand", "#c8a870"], layers: [] }, S = CR.TS;
  g.fillStyle = crPat(G.base[0], G.base[1]); g.fillRect(wx0, wy0, S, S);
  for (const L of G.layers) rgMaskFill(g, wx0, wy0, crPat(L.pat, L.col), (x, y) => { const v = rgF(L.f, x, y); return (L.lo !== undefined ? rgSm(L.lo, L.hi, v) : v) * (L.a === undefined ? 1 : L.a); });
  // broad tonal variation + dune crests in ONE soft-light pass of a grey 1 m map (grey 50 % = unchanged)
  {
    const sc = rgScratch(), M = RG_MASK, d = M.img.data, m0x = wx0 / 32, m0y = wy0 / 32, dunes = !!(P.fields && P.fields.dune);
    for (let j = 0; j < 18; j++) for (let i = 0; i < 18; i++) {
      const x = m0x + i - 0.5, y = m0y + j - 0.5;
      let v = 0.5 + (cFbm(x / 420, y / 420, 631) - 0.5) * 0.55 + (cFbm(x / 120, y / 120, 633) - 0.5) * 0.18;
      if (dunes) v += rgDuneShade(x, y, true) * 1.1 - rgDuneShade(x, y, false) * 1.25;
      const o = (j * 18 + i) * 4, q = Math.max(0, Math.min(255, Math.round(v * 255)));
      d[o] = d[o + 1] = d[o + 2] = q; d[o + 3] = 255;
    }
    void sc; M.g.putImageData(M.img, 0, 0);
    g.save(); g.globalCompositeOperation = "soft-light"; g.imageSmoothingEnabled = true; g.drawImage(M, wx0 - 32, wy0 - 32, 576, 576); g.restore();
  }
  // packed ground in towns
  const m0x = wx0 / 32, m0y = wy0 / 32, tw = G.town;
  if (tw) for (const T of RG.towns) {
    if (Math.hypot(T.x - (m0x + 8), T.y - (m0y + 8)) > T.r * 1.1 + 12) continue;
    rgMaskFill(g, wx0, wy0, crPat(tw[0], tw[1]), (x, y) => (1 - rgSm(0.55, 1.05, Math.hypot(x - T.x, y - T.y) / T.r + (cNoise(x / 60, y / 60, 621) - 0.5) * 0.25)) * 0.7);
  }
}
/* --- 5. tracks ---------------------------------------------------------------------------- */
function rgRoadCols() {
  const T = CITY.theme, k = CITY.themeKey, paved = k === "starship" || k === "capsule" || k === "colony" || k === "mesa" || k === "neon" || k === "modern" || k === "coruscant";
  const P = RG.P || {}, base = (P.ground && P.ground.base && P.ground.base[1]) || T.g.road;
  const road = P.road || (paved ? T.g.road : crSh(base, -0.16)), road2 = P.road2 || (paved ? T.g.road2 : crSh(base, -0.1));
  return { paved, road, road2, edge: paved ? crSh(road, -0.25) : crSh(base, -0.05), line: T.g.line, rut: crSh(road, -0.2) };
}
function rgRoadsIn(m0x, m0y, m1x, m1y) {
  const out = [], seen = new Set();
  for (let my = Math.max(0, Math.floor((m0y - 20) / 1000)); my <= Math.min(63, Math.floor((m1y + 20) / 1000)); my++) for (let mx = Math.max(0, Math.floor((m0x - 20) / 1000)); mx <= Math.min(63, Math.floor((m1x + 20) / 1000)); mx++) {
    for (const s of rgSegsIn(mx, my)) {
      if (seen.has(s.k)) continue; seen.add(s.k);
      const pad = s.w / 2 + 3;
      if (Math.max(s.ax, s.bx) < m0x - pad || Math.min(s.ax, s.bx) > m1x + pad || Math.max(s.ay, s.by) < m0y - pad || Math.min(s.ay, s.by) > m1y + pad) continue;
      out.push(s);
    }
  }
  return out;
}
function rgRoadPass(g, segs, pass) {
  if (!segs.length) return;
  const C = rgRoadCols();
  g.save(); g.lineCap = "round"; g.lineJoin = "round";
  const stroke = (w, col, filter) => { g.strokeStyle = col; g.lineWidth = w; g.beginPath(); for (const s of segs) { if (filter && !filter(s)) continue; g.moveTo(s.ax * 32, s.ay * 32); g.lineTo(s.bx * 32, s.by * 32); } g.stroke(); };
  if (pass === 0) {
    // soft dusty shoulders (two widths)
    for (const s of segs) { g.strokeStyle = crA(C.edge, 0.35); g.lineWidth = (s.w + 4) * 32; g.beginPath(); g.moveTo(s.ax * 32, s.ay * 32); g.lineTo(s.bx * 32, s.by * 32); g.stroke(); }
  } else if (pass === 1) {
    for (const s of segs) { g.strokeStyle = s.r.kind === "street" && !C.paved ? C.road2 : C.road; g.lineWidth = s.w * 32; g.beginPath(); g.moveTo(s.ax * 32, s.ay * 32); g.lineTo(s.bx * 32, s.by * 32); g.stroke(); }
  } else {
    if (C.paved) {
      g.setLineDash([3 * 32, 3 * 32]); stroke(5, crA(C.line, 0.85), s => s.w >= 8); g.setLineDash([]);
      stroke(3, crA("#ffffff", 0.18), s => s.w >= 10);
    } else {
      // tyre ruts: two darker lines a lane apart, on tracks and lanes
      for (const s of segs) {
        if (s.r.kind === "street" && s.w > 7) continue;
        const L = Math.hypot(s.bx - s.ax, s.by - s.ay) || 1, nx = -(s.by - s.ay) / L, ny = (s.bx - s.ax) / L, o = Math.min(1.1, s.w * 0.2);
        g.strokeStyle = crA(C.rut, 0.45); g.lineWidth = 9;
        for (const k of [-1, 1]) { g.beginPath(); g.moveTo((s.ax + nx * o * k) * 32, (s.ay + ny * o * k) * 32); g.lineTo((s.bx + nx * o * k) * 32, (s.by + ny * o * k) * 32); g.stroke(); }
      }
    }
  }
  g.restore();
}
/* --- 6. rings --------------------------------------------------------------------------- */
function rgRingsIn(blocks, m0x, m0y, m1x, m1y) {
  const out = [];
  const take = R => { const pad = R.r + R.th + 8; if (R.cx + pad < m0x || R.cx - pad > m1x || R.cy + pad < m0y || R.cy - pad > m1y) return; out.push(R); };
  for (const B of blocks) if (B.rings) B.rings.forEach(take);
  RG.rings.forEach(take);
  return out;
}
function rgInGap(R, ang) {
  for (const gp of R.gaps) { let d = Math.abs(((ang - gp.a) % (Math.PI * 2) + Math.PI * 3) % (Math.PI * 2) - Math.PI); if (d * R.r < gp.w / 2) return true; }
  return false;
}
function rgArcRuns(R) {   // [a0, a1] runs of wall between gaps
  if (!R.gaps.length) return [[0, Math.PI * 2]];
  const n = Math.max(48, Math.ceil(R.r * 1.5)), runs = [];
  let start = null;
  for (let i = 0; i <= n; i++) { const a = i / n * Math.PI * 2, g = rgInGap(R, a); if (!g && start === null) start = a; if ((g || i === n) && start !== null) { runs.push([start, a]); start = null; } }
  return runs;
}
function rgDrawRing(g, R) {
  const T = CITY.theme, X = R.cx * 32, Y = R.cy * 32, rad = R.r * 32, th = R.th * 32, runs = rgArcRuns(R);
  const wall = R.kind === "wall" ? crSh(T.w.stone || T.w.masonry, -0.05) : R.kind === "stand" ? crSh(T.w.masonry, -0.1) : T.w.masonry;
  g.save(); g.lineCap = "butt";
  // shadow
  g.strokeStyle = "rgba(0,0,0,0.25)"; g.lineWidth = th;
  for (const [a0, a1] of runs) { g.beginPath(); g.arc(X + 6, Y + 8, rad, a0, a1); g.stroke(); }
  g.strokeStyle = crSh(wall, -0.3); g.lineWidth = th + 4;
  for (const [a0, a1] of runs) { g.beginPath(); g.arc(X, Y, rad, a0, a1); g.stroke(); }
  g.strokeStyle = wall; g.lineWidth = th;
  for (const [a0, a1] of runs) { g.beginPath(); g.arc(X, Y, rad, a0, a1); g.stroke(); }
  g.strokeStyle = crSh(wall, 0.18); g.lineWidth = Math.max(2, th * 0.18);
  for (const [a0, a1] of runs) { g.beginPath(); g.arc(X, Y, rad - th * 0.3, a0, a1); g.stroke(); }
  if (R.kind === "stand") {   // seat rows
    g.strokeStyle = crA("#000000", 0.18); g.lineWidth = 2;
    for (let k = 1; k < 6; k++) for (const [a0, a1] of runs) { g.beginPath(); g.arc(X, Y, rad - th / 2 + k * th / 6, a0, a1); g.stroke(); }
    const C = ["#c0582c", "#3a6ab0", "#d8c25a", "#8a3a8a"];
    for (const [a0, a1] of runs) for (let a = a0; a < a1; a += 0.09) { g.fillStyle = C[Math.floor(a * 7) & 3]; g.fillRect(X + Math.cos(a) * (rad + th * 0.38) - 3, Y + Math.sin(a) * (rad + th * 0.38) - 3, 6, 6); }
  }
  if (R.kind === "wall") {   // crenellations + towers + gate towers
    g.fillStyle = crSh(wall, -0.35);
    for (const [a0, a1] of runs) for (let a = a0; a < a1; a += 2.4 / R.r) g.fillRect(X + Math.cos(a) * (rad + th * 0.42) - 4, Y + Math.sin(a) * (rad + th * 0.42) - 4, 8, 8);
    const towers = [];
    for (let a = 0; a < Math.PI * 2; a += 110 / R.r) if (!rgInGap(R, a)) towers.push(a);
    for (const gp of R.gaps) towers.push(gp.a - (gp.w / 2 + 3) / R.r, gp.a + (gp.w / 2 + 3) / R.r);
    for (const a of towers) { const tx = X + Math.cos(a) * rad, ty = Y + Math.sin(a) * rad, tr = th * 1.5; g.fillStyle = "rgba(0,0,0,0.3)"; g.beginPath(); g.arc(tx + 8, ty + 10, tr, 0, 7); g.fill(); g.fillStyle = crSh(wall, -0.12); g.beginPath(); g.arc(tx, ty, tr, 0, 7); g.fill(); g.fillStyle = crSh(T.r.hip ? T.r.hip[0] : wall, 0); g.beginPath(); g.arc(tx, ty, tr * 0.72, 0, 7); g.fill(); g.strokeStyle = crSh(wall, -0.4); g.lineWidth = 2; g.stroke(); }
  }
  if (R.label) { g.fillStyle = crA("#2a2016", 0.55); g.font = "900 " + Math.round(Math.min(46, rad * 0.11)) + "px 'Segoe UI', sans-serif"; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText(R.label, X, Y + rad * 0.62); }
  g.restore();
}
function rgStampRing(C, R) {
  const x0 = C.x0, y0 = C.y0, CHs = 128, cxT = R.cx * 2, cyT = R.cy * 2, ro = (R.r + R.th / 2) * 2, ri = (R.r - R.th / 2) * 2;
  const xa = Math.max(x0, Math.floor(cxT - ro - 1)), xb = Math.min(x0 + CHs, Math.ceil(cxT + ro + 1)), ya = Math.max(y0, Math.floor(cyT - ro - 1)), yb = Math.min(y0 + CHs, Math.ceil(cyT + ro + 1));
  if (xa >= xb || ya >= yb) return;
  const fl = R.kind === "low" ? F_MOVE | F_LOW : F_MOVE | F_SIGHT | F_SHOT;
  const towerR = R.kind === "wall" ? R.th * 1.5 * 2 : 0, towers = [];
  if (towerR) { for (let a = 0; a < Math.PI * 2; a += 110 / R.r) if (!rgInGap(R, a)) towers.push([cxT + Math.cos(a) * R.r * 2, cyT + Math.sin(a) * R.r * 2]); for (const gp of R.gaps) for (const s of [-1, 1]) { const a = gp.a + s * (gp.w / 2 + 3) / R.r; towers.push([cxT + Math.cos(a) * R.r * 2, cyT + Math.sin(a) * R.r * 2]); } }
  for (let yy = ya; yy < yb; yy++) for (let xx = xa; xx < xb; xx++) {
    const dx = xx + 0.5 - cxT, dy = yy + 0.5 - cyT, d = Math.hypot(dx, dy);
    let hit = d >= ri && d <= ro && !rgInGap(R, Math.atan2(dy, dx));
    if (!hit && towerR) for (const t of towers) if ((xx + 0.5 - t[0]) ** 2 + (yy + 0.5 - t[1]) ** 2 <= towerR * towerR) { hit = true; break; }
    if (!hit) continue;
    const i = ((yy - y0) << 7) | (xx - x0);
    if (C.flags[i] & (F_MOVE | F_IN)) continue;
    C.flags[i] |= fl; C.kind[i] = K_STONE;
  }
}
function rgPip(px, py, pts) { let c = false; for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) { const a = pts[i], b = pts[j]; if ((a[1] > py) !== (b[1] > py) && px < (b[0] - a[0]) * (py - a[1]) / (b[1] - a[1]) + a[0]) c = !c; } return c; }
function rgStampPoly(C, p) {
  const x0 = C.x0, y0 = C.y0, xa = Math.max(x0, Math.floor(p.x)), xb = Math.min(x0 + 128, Math.ceil(p.x + p.w)), ya = Math.max(y0, Math.floor(p.y)), yb = Math.min(y0 + 128, Math.ceil(p.y + p.h));
  if (xa >= xb || ya >= yb) return;
  const fl = p.es === FS_TALL ? F_MOVE | F_SIGHT | F_SHOT : p.es === FS_COVER ? F_MOVE | F_SHOT : F_MOVE | F_LOW;
  const kd = p.t === "rgship" ? K_CAR : p.t === "rgrock" ? K_STONE : K_POLE;
  const H = p.hole, hc = H ? Math.cos(p.gate || 0) : 0, hs = H ? Math.sin(p.gate || 0) : 0;
  for (let yy = ya; yy < yb; yy++) for (let xx = xa; xx < xb; xx++) {
    if (!rgPip(xx + 0.5, yy + 0.5, p.pg)) continue;
    if (H) {   // carved: the hall inside and the cleft that reaches it stay open
      const dx = (xx + 0.5) / 2 - H[0], dy = (yy + 0.5) / 2 - H[1];
      if (Math.abs(dx) < H[2] + 1 && Math.abs(dy) < H[3] + 1) continue;
      if (dx * hc + dy * hs > 0 && Math.abs(-dx * hs + dy * hc) < (p.cleft || 4)) continue;
    }
    const i = ((yy - y0) << 7) | (xx - x0);
    if (C.flags[i] & F_IN) continue;
    C.flags[i] |= fl; C.kind[i] = kd;
  }
}
// wild trees in organic forests (deterministic per chunk), like the classic woods scatter
function rgChunkTrees(C) {
  const P = RG.P, TR = P.trees;
  if (!TR || !(P.fields && P.fields.forest)) return;
  const x0 = C.x0, y0 = C.y0, xm = (x0 + 64) / 2, ym = (y0 + 64) / 2;
  if (rgF("forest", xm, ym) < 0.02 && rgF("forest", xm - 32, ym - 32) < 0.02 && rgF("forest", xm + 32, ym + 32) < 0.02) return;
  const r = cRng(cH(CITY.seed, C.cx, C.cy, 515)), n = Math.round(150 * (TR.dens || 1));
  // keep sites (castles, farms, camps…) and towns clear of the wild wood
  const near = []; for (let my = Math.floor(ym / 1000) - 1; my <= Math.floor(ym / 1000) + 1; my++) for (let mx = Math.floor(xm / 1000) - 1; mx <= Math.floor(xm / 1000) + 1; mx++) { const st = RG.siteCell.get(rgCK(mx, my)); if (st && Math.hypot(st.x - xm, st.y - ym) < st.rad + 140) near.push(st); }
  const towns = RG.towns.filter(t => Math.hypot(t.x - xm, t.y - ym) < t.r + 120);
  for (let k = 0; k < n; k++) {
    const x = x0 + r() * 128, y = y0 + r() * 128, v = rgF("forest", x / 2, y / 2);
    if (r() > v * 1.15) continue;
    if (near.length && near.some(st => Math.hypot(st.x - x / 2, st.y - y / 2) < st.rad * (st.k === "lair" || st.k === "nest" || st.k === "hagrid" || st.k === "gokuhouse" ? 0.35 : 0.85))) continue;
    if (towns.length && towns.some(t => Math.hypot(t.x - x / 2, t.y - y / 2) < t.r * 0.95)) continue;
    const i = ((Math.floor(y) - y0) << 7) | (Math.floor(x) - x0);
    if (C.flags[i] & (F_MOVE | F_IN)) continue;
    if (RG.org) { const nr = rgNearestRoad(x / 2, y / 2, 4); if (nr) continue; }
    const t = { t: "tree", x, y, w: 1, h: 1, s: FS_COVER, v: Math.floor(r() * 4), sz: 0.9 + r() * 0.9, wild: 1, dark: TR.dark ? 1 : 0 };
    C.trees.push(t); C.props.push(t);
    C.flags[i] |= F_MOVE | F_SHOT; C.kind[i] = K_TREE;
  }
}
(function rgChunkWire() {
  if (typeof cityBuildChunk !== "function") return;
  const _b = cityBuildChunk;
  window.cityBuildChunk = cityBuildChunk = function (cx, cy) {
    const C = _b(cx, cy);
    if (RG.key === "nexus" || cx < 0 || cy < 0 || C.x0 >= CITY.WORLD_T || C.y0 >= CITY.WORLD_T) return C;
    try {
      const blocks = cityBlocksInRect(C.x0 / 2, C.y0 / 2, (C.x0 + 128) / 2, (C.y0 + 128) / 2);
      for (const B of blocks) for (const p of B.props) if (p.pg && p.x < C.x0 + 128 && p.y < C.y0 + 128 && p.x + p.w > C.x0 && p.y + p.h > C.y0) rgStampPoly(C, p);
      for (const R of rgRingsIn(blocks, C.x0 / 2, C.y0 / 2, (C.x0 + 128) / 2, (C.y0 + 128) / 2)) rgStampRing(C, R);
      if (RG.org) rgChunkTrees(C);
    } catch (e) { if (window.trackProgress) window.trackProgress("rgChunk " + cx + "," + cy + ": " + e.message, true); }
    return C;
  };
})();
// EOF part 1 (regionart.js continues)

/* --- 7. round buildings & dome roofs ----------------------------------------------------------- */
function rgRoundLayer(g, b, layer) {
  const G = cityInterior(b), T = CITY.theme, W = G.w, H = G.h, X = b.x * 16, Y = b.y * 16, cx = X + W * 8, cy = Y + H * 8, rx = W * 8, ry = H * 8;
  const ext = T.w[b.mat] || T.w.masonry, intC = crSh(T.w.int, -0.32), edge = T.w.edge;
  if (layer === 0) {
    g.fillStyle = "rgba(0,0,0,0.24)"; g.beginPath(); g.ellipse(cx + 7, cy + 9, rx, ry, 0, 0, 7); g.fill();
    g.save(); g.beginPath(); g.ellipse(cx, cy, rx - 4, ry - 4, 0, 0, 7); g.clip();
    const [fp, fc] = crRoomFloor("hall", b); g.fillStyle = crPat(fp, fc); g.fillRect(X, Y, W * 16, H * 16);
    for (const rm of G.rooms) { const [p, c] = crRoomFloor(rm.type, b); g.fillStyle = crPat(p, c, T.w.glow || null); g.fillRect(X + rm.x * 16, Y + rm.y * 16, rm.w * 16, rm.h * 16); }
    g.restore();
    return;
  }
  // smooth wall ring over the cell ring
  g.save();
  g.strokeStyle = edge; g.lineWidth = 27; g.beginPath(); g.ellipse(cx, cy, rx - 11, ry - 11, 0, 0, 7); g.stroke();
  g.strokeStyle = ext; g.lineWidth = 22; g.beginPath(); g.ellipse(cx, cy, rx - 12, ry - 12, 0, 0, 7); g.stroke();
  g.strokeStyle = crSh(ext, 0.16); g.lineWidth = 3; g.beginPath(); g.ellipse(cx, cy, rx - 19, ry - 19, 0, 0, 7); g.stroke();
  g.restore();
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const v = G.c[y * W + x], Xc = X + x * 16, Yc = Y + y * 16;
    if (v === IC_INT) { g.fillStyle = intC; g.fillRect(Xc, Yc, 16, 16); }
    else if (v === IC_WIN) { const hx = crCellAxis(G, x, y), br = cityRT.broken.has(cityKeyT(b.x + x, b.y + y)); g.fillStyle = T.w.frame; if (hx) g.fillRect(Xc - 2, Yc + 4, 20, 8); else g.fillRect(Xc + 4, Yc - 2, 8, 20); g.fillStyle = br ? "rgba(10,12,16,0.85)" : T.w.glass; if (hx) g.fillRect(Xc - 1, Yc + 6, 18, 4); else g.fillRect(Xc + 6, Yc - 1, 4, 18); }
    else if (v === IC_DOOR || v === IC_EDOOR) { const hx = crCellAxis(G, x, y); g.fillStyle = v === IC_EDOOR ? crSh(ext, -0.4) : "rgba(0,0,0,0.18)"; if (hx) g.fillRect(Xc, Yc + 3, 16, 10); else g.fillRect(Xc + 3, Yc, 10, 16); }
    else if (v === IC_COUNTER) { g.fillStyle = crSh(T.fu.white, -0.2); g.fillRect(Xc, Yc, 16, 16); g.fillStyle = T.fu.white; g.fillRect(Xc + 1, Yc + 1, 14, 14); }
  }
}
function rgDomeRoof(b) {
  const G = cityInterior(b), T = CITY.theme, r = T.r, pad = 4, W = G.w * 16 + pad * 2, H = G.h * 16 + pad * 2, sc = Math.min(1, Math.sqrt(380000 / (W * H)));
  const c = crCanvas(Math.ceil(W * sc), Math.ceil(H * sc)), g = c.getContext("2d");
  g.scale(sc, sc);
  const cx = W / 2, cy = H / 2, rx = W / 2 - 1, ry = H / 2 - 1, base = CITY.themeKey === "capsule" ? "#f6f2ea" : (r.flat || "#c8ae86");
  g.save(); g.beginPath(); g.ellipse(cx, cy, rx, ry, 0, 0, 7); g.clip();
  g.fillStyle = crPat(CITY.themeKey === "capsule" ? "polished" : "sandstone", base); g.fillRect(0, 0, W, H);
  const gr = g.createRadialGradient(cx - rx * 0.35, cy - ry * 0.4, Math.min(rx, ry) * 0.05, cx, cy, Math.max(rx, ry) * 1.05);
  gr.addColorStop(0, "rgba(255,255,255,0.42)"); gr.addColorStop(0.45, "rgba(255,255,255,0.05)"); gr.addColorStop(0.8, "rgba(0,0,0,0.14)"); gr.addColorStop(1, "rgba(0,0,0,0.34)");
  g.fillStyle = gr; g.fillRect(0, 0, W, H);
  g.strokeStyle = crA("#000000", 0.12); g.lineWidth = 2;
  for (const k of [0.62, 0.82]) { g.beginPath(); g.ellipse(cx, cy, rx * k, ry * k, 0, 0, 7); g.stroke(); }
  if (CITY.themeKey === "capsule") { g.fillStyle = "#ff7a1a"; g.beginPath(); g.ellipse(cx, cy, rx * 0.9, ry * 0.9, 0, 0.15, 0.95); g.lineTo(cx, cy); g.fill(); g.fillStyle = "#2a5ad8"; g.font = "900 " + Math.round(Math.min(rx, ry) * 0.32) + "px sans-serif"; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText(b.kind === "office" ? "CC" : "", cx, cy); }
  else if (T.w.glow && (b.seed & 3) === 0) { g.fillStyle = crA(T.w.glow, 0.7); g.beginPath(); g.arc(cx + rx * 0.3, cy - ry * 0.2, 3, 0, 7); g.fill(); }
  // a vent dome or two (Tatooine)
  if (CITY.themeKey === "galactic" || CITY.themeKey === "desert" || CITY.themeKey === "pharaoh") { const n = G.w > 22 ? 2 : 1; for (let k = 0; k < n; k++) { const vx = cx + (k ? -rx * 0.3 : rx * 0.25), vy = cy + (k ? ry * 0.25 : -ry * 0.2), vr = Math.min(rx, ry) * 0.16; g.fillStyle = crSh(base, -0.2); g.beginPath(); g.arc(vx + 2, vy + 2, vr, 0, 7); g.fill(); g.fillStyle = crSh(base, 0.1); g.beginPath(); g.arc(vx, vy, vr, 0, 7); g.fill(); g.fillStyle = "#2a2018"; g.fillRect(vx - vr * 0.5, vy - 1, vr, 2); } }
  g.restore();
  g.strokeStyle = crSh(base, -0.35); g.lineWidth = 3; g.beginPath(); g.ellipse(cx, cy, rx - 1, ry - 1, 0, 0, 7); g.stroke();
  return { c, x0: b.x * 16 - pad, y0: b.y * 16 - pad, w: W, h: H, used: CR.frame, x1: b.x * 16 + W, y1: b.y * 16 + H };
}
// landmark roofs
const RG_ROOF = {
  palace(b) {   // Jabba's palace: a squat sandstone mass crowned with domes and drum towers, the great gate on the front
    const G = cityInterior(b), pad = 6, W = G.w * 16 + pad * 2, H = G.h * 16 + pad * 2, sc = Math.min(1, Math.sqrt(420000 / (W * H)));
    const c = crCanvas(Math.ceil(W * sc), Math.ceil(H * sc)), g = c.getContext("2d"), base = "#c8b08a";
    g.scale(sc, sc);
    g.fillStyle = crPat("sandstone", base); crRR(g, 2, 2, W - 4, H - 4, 60); g.fill();
    const gr = g.createLinearGradient(0, 0, W, H); gr.addColorStop(0, "rgba(255,250,235,0.25)"); gr.addColorStop(1, "rgba(40,24,10,0.3)"); g.fillStyle = gr; crRR(g, 2, 2, W - 4, H - 4, 60); g.fill();
    g.strokeStyle = crSh(base, -0.4); g.lineWidth = 5; crRR(g, 2, 2, W - 4, H - 4, 60); g.stroke();
    const dome = (x, y, r, k) => { g.fillStyle = "rgba(30,16,4,0.3)"; g.beginPath(); g.arc(x + r * 0.18, y + r * 0.22, r, 0, 7); g.fill(); const q = g.createRadialGradient(x - r * 0.35, y - r * 0.4, r * 0.08, x, y, r); q.addColorStop(0, crSh(base, 0.3)); q.addColorStop(1, crSh(base, -0.3 - (k || 0))); g.fillStyle = q; g.beginPath(); g.arc(x, y, r, 0, 7); g.fill(); g.strokeStyle = crSh(base, -0.45); g.lineWidth = 3; g.stroke(); };
    dome(W * 0.5, H * 0.45, Math.min(W, H) * 0.24);
    dome(W * 0.2, H * 0.3, Math.min(W, H) * 0.13, 0.05); dome(W * 0.8, H * 0.32, Math.min(W, H) * 0.15, 0.05);
    for (const [x, y] of [[0.12, 0.78], [0.88, 0.78], [0.33, 0.18], [0.67, 0.2]]) { g.fillStyle = crSh(base, -0.2); g.beginPath(); g.arc(W * x, H * y, Math.min(W, H) * 0.07, 0, 7); g.fill(); g.fillStyle = crSh(base, 0.12); g.beginPath(); g.arc(W * x - 3, H * y - 3, Math.min(W, H) * 0.05, 0, 7); g.fill(); }
    // the gate faces the front
    const f = b.front || "S", gw = Math.min(W, H) * 0.22, gd = 26; g.fillStyle = "#3a2a1a";
    if (f === "S") g.fillRect(W / 2 - gw / 2, H - gd, gw, gd - 4); else if (f === "N") g.fillRect(W / 2 - gw / 2, 4, gw, gd); else if (f === "E") g.fillRect(W - gd, H / 2 - gw / 2, gd - 4, gw); else g.fillRect(4, H / 2 - gw / 2, gd, gw);
    return { c, x0: b.x * 16 - pad, y0: b.y * 16 - pad, w: W, h: H, used: CR.frame, x1: b.x * 16 + W, y1: b.y * 16 + H };
  }
};
(function rgBuildingWire() {
  if (typeof crBuilding === "function") {
    const _cb = crBuilding;
    window.crBuilding = crBuilding = function (g, b, tx0, ty0, tx1, ty1, layer) { if (b.round) return rgRoundLayer(g, b, layer); return _cb(g, b, tx0, ty0, tx1, ty1, layer); };
  }
  if (typeof crRoofCanvas === "function") {
    const _rc = crRoofCanvas;
    window.crRoofCanvas = crRoofCanvas = function (b) {
      if (b.rgRoof && RG_ROOF[b.rgRoof]) { let R = CR.roofs.get(b.uid); if (R) { R.used = CR.frame; return R; } R = RG_ROOF[b.rgRoof](b); CR.roofs.set(b.uid, R); return R; }
      if (!b.round) return _rc(b);
      let R = CR.roofs.get(b.uid);
      if (R) { R.used = CR.frame; return R; }
      R = rgDomeRoof(b); CR.roofs.set(b.uid, R);
      if (CR.roofs.size > 70) { const arr = [...CR.roofs.entries()].sort((a, q) => a[1].used - q[1].used); for (let i = 0; i < 16; i++) CR.roofs.delete(arr[i][0]); }
      return R;
    };
  }
})();
// EOF part 2 (regionart.js continues)

/* --- 8. region props ----------------------------------------------------------------------- */
const RG_FLOOR = new Set(["rgcourt", "rgbayfloor", "rgarena", "rgtrail", "rgkrayt", "rgsarlacc", "rgramp", "rgscrub"]);
function rgShade(pts, f, cx, cy) { return pts.map(p => [cx + (p[0] - cx) * f, cy + (p[1] - cy) * f]); }
function rgPath2(g, pts) { g.beginPath(); g.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) g.lineTo(pts[i][0], pts[i][1]); g.closePath(); }
RG_ART.rgrock = function (g, p) {
  const P = RG.P, cols = (P && P.rocks && P.rocks.col) || ["#9a8a70"], col = cols[(p.v | 0) % cols.length];
  const pts = p.pg.map(q => [q[0] * 16, q[1] * 16]);
  let cx = 0, cy = 0; for (const q of pts) { cx += q[0]; cy += q[1]; } cx /= pts.length; cy /= pts.length;
  const rad = Math.max(p.w, p.h) * 8, tall = p.kind === "mesa" ? 1.3 : p.kind === "spire" ? 1.8 : p.kind === "boulder" ? 0.45 : 1, off = Math.min(90, 8 + rad * 0.3 * tall);
  const r = cRng(p.seed || 7);
  // cast shadow: soft outer + darker inner
  g.fillStyle = "rgba(30,16,4,0.16)"; rgPath2(g, pts.map(q => [q[0] + off * 1.25, q[1] + off * 1.45])); g.fill();
  g.fillStyle = "rgba(30,16,4,0.3)"; rgPath2(g, pts.map(q => [q[0] + off * 0.7, q[1] + off * 0.85])); g.fill();
  // cliff: the full footprint, dark, with vertical strata
  g.fillStyle = crSh(col, -0.42); rgPath2(g, pts); g.fill();
  g.save(); rgPath2(g, pts); g.clip();
  g.strokeStyle = crA("#000000", 0.18); g.lineWidth = 2;
  for (let k = 0; k < 14; k++) { const a = r() * 6.28, d = rad * (0.75 + r() * 0.3); g.beginPath(); g.moveTo(cx + Math.cos(a) * d, cy + Math.sin(a) * d); g.lineTo(cx + Math.cos(a) * rad * 1.2, cy + Math.sin(a) * rad * 1.2); g.stroke(); }
  g.restore();
  // plateau: shrunk and lifted towards the light (top-left)
  const lift = Math.min(26, 3 + rad * 0.09 * tall), shrink = p.kind === "boulder" ? 0.8 : p.kind === "spire" ? 0.6 : 0.86;
  const top = rgShade(pts, shrink, cx, cy).map(q => [q[0] - lift * 0.45, q[1] - lift]);
  g.fillStyle = crPat("rock", crSh(col, 0.08)); rgPath2(g, top); g.fill();
  const gr = g.createLinearGradient(cx - rad, cy - rad, cx + rad * 0.8, cy + rad * 0.8);
  gr.addColorStop(0, "rgba(255,244,226,0.3)"); gr.addColorStop(0.5, "rgba(255,255,255,0.02)"); gr.addColorStop(1, "rgba(40,20,5,0.28)");
  g.fillStyle = gr; rgPath2(g, top); g.fill();
  if (p.kind === "mesa") { g.strokeStyle = crA("#3a2210", 0.16); g.lineWidth = 2.5; for (const k of [0.78, 0.56, 0.34]) { rgPath2(g, rgShade(top, k, cx - lift * 0.45, cy - lift)); g.stroke(); } }
  // rim: lit edges facing up-left, dark lip facing down-right
  g.lineWidth = 2.5;
  for (let i = 0; i < top.length; i++) {
    const a = top[i], b = top[(i + 1) % top.length], nx = b[1] - a[1], ny = a[0] - b[0];
    g.strokeStyle = (nx + ny) < 0 ? crSh(col, 0.32) : crSh(col, -0.5);
    g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); g.stroke();
  }
  // cracks & pebbles on top
  g.strokeStyle = crA("#2a1606", 0.28); g.lineWidth = 1.5;
  for (let k = 0; k < (p.kind === "boulder" ? 1 : 4); k++) { const a = r() * 6.28, d = r() * rad * 0.45; let x = cx + Math.cos(a) * d - lift * 0.45, y = cy + Math.sin(a) * d - lift; g.beginPath(); g.moveTo(x, y); for (let s2 = 0; s2 < 3; s2++) { x += (r() - 0.5) * rad * 0.32; y += (r() - 0.5) * rad * 0.32; g.lineTo(x, y); } g.stroke(); }
};
RG_ART.rgscrub = function (g, p) { const cx = (p.x + p.w / 2) * 16, cy = (p.y + p.h / 2) * 16, c = p.col || "#8a7a4a"; g.strokeStyle = crSh(c, -0.25); g.lineWidth = 1.5; g.beginPath(); for (let k = 0; k < 7; k++) { const a = k * 0.9 + (p.v | 0); g.moveTo(cx, cy); g.lineTo(cx + Math.cos(a) * 9, cy + Math.sin(a) * 7); } g.stroke(); g.fillStyle = crA(c, 0.8); for (let k = 0; k < 5; k++) { g.beginPath(); g.arc(cx + Math.cos(k * 1.3 + p.v) * 6, cy + Math.sin(k * 1.3 + p.v) * 5, 2.5, 0, 7); g.fill(); } };
RG_ART.rgstall = function (g, p) {
  const X = p.x * 16, Y = p.y * 16, W = p.w * 16, H = p.h * 16, C = [["#c0582c", "#e8d8b8"], ["#3a6ab0", "#e8e0d0"], ["#7a8a3a", "#efe2c2"], ["#8a3a6a", "#f0e0d0"]][(p.v | 0) & 3];
  g.fillStyle = "rgba(0,0,0,0.22)"; g.fillRect(X + 5, Y + 6, W, H);
  for (let i = 0; i < 6; i++) { g.fillStyle = C[i & 1]; g.fillRect(X + i * W / 6, Y, W / 6 + 0.5, H); }
  g.fillStyle = "rgba(0,0,0,0.12)"; g.fillRect(X, Y + H * 0.5, W, H * 0.5);
  g.strokeStyle = crSh(C[0], -0.4); g.lineWidth = 2; g.strokeRect(X + 1, Y + 1, W - 2, H - 2);
};
RG_ART.rgwell = function (g, p) { const cx = (p.x + p.w / 2) * 16, cy = (p.y + p.h / 2) * 16, R = p.w * 8; g.fillStyle = "rgba(0,0,0,0.25)"; g.beginPath(); g.arc(cx + 5, cy + 6, R, 0, 7); g.fill(); g.fillStyle = crPat("stone", CITY.theme.w.stone || "#a89a80"); g.beginPath(); g.arc(cx, cy, R, 0, 7); g.fill(); g.fillStyle = "#1c2a30"; g.beginPath(); g.arc(cx, cy, R * 0.58, 0, 7); g.fill(); g.fillStyle = "rgba(90,160,200,0.5)"; g.beginPath(); g.arc(cx - 3, cy - 3, R * 0.3, 0, 7); g.fill(); g.strokeStyle = "#5a4630"; g.lineWidth = 4; g.beginPath(); g.moveTo(cx - R, cy); g.lineTo(cx + R, cy); g.stroke(); };
RG_ART.rgcourt = function (g, p) {
  const cx = (p.x + p.w / 2) * 16, cy = (p.y + p.h / 2) * 16, R = p.r * 32;
  g.fillStyle = crPat("packed", crSh(CITY.theme.g.plaza, -0.1)); g.beginPath(); g.arc(cx, cy, R, 0, 7); g.fill();
  const gr = g.createRadialGradient(cx, cy, R * 0.45, cx, cy, R); gr.addColorStop(0, "rgba(0,0,0,0)"); gr.addColorStop(1, "rgba(40,24,10,0.42)");
  g.fillStyle = gr; g.beginPath(); g.arc(cx, cy, R, 0, 7); g.fill();
  g.strokeStyle = crA("#000000", 0.15); g.lineWidth = 2; g.beginPath(); g.arc(cx, cy, R * 0.4, 0, 7); g.stroke();
};
RG_ART.rgvap = function (g, p) {   // moisture vaporator: a tall slim tower — long shadow, ringed column, condenser fins and cap
  const cx = (p.x + p.w / 2) * 16, cy = (p.y + p.h / 2) * 16;
  g.strokeStyle = "rgba(30,16,4,0.3)"; g.lineCap = "round"; g.lineWidth = 9; g.beginPath(); g.moveTo(cx + 2, cy + 2); g.lineTo(cx + 52, cy + 62); g.stroke();
  g.lineWidth = 15; g.beginPath(); g.moveTo(cx + 44, cy + 52); g.lineTo(cx + 52, cy + 62); g.stroke();
  g.fillStyle = "#5e636a"; g.beginPath(); g.arc(cx, cy, 11, 0, 7); g.fill();
  g.strokeStyle = "#8e949a"; g.lineWidth = 3; for (let k = 0; k < 3; k++) { const a = k * 2.094 + (p.v | 0) * 0.4; g.beginPath(); g.moveTo(cx + Math.cos(a) * 8, cy + Math.sin(a) * 8); g.lineTo(cx + Math.cos(a) * 16, cy + Math.sin(a) * 16); g.stroke(); }
  g.fillStyle = "#c4c8cc"; g.beginPath(); g.arc(cx - 1, cy - 1, 8, 0, 7); g.fill();
  g.strokeStyle = "#7a8086"; g.lineWidth = 1.5; g.beginPath(); g.arc(cx - 1, cy - 1, 5.5, 0, 7); g.stroke();
  g.fillStyle = "#eeeee8"; g.beginPath(); g.arc(cx - 2.5, cy - 2.5, 3, 0, 7); g.fill();
  g.fillStyle = "#c0582c"; g.fillRect(cx + 5, cy - 2, 3, 3);
};
RG_ART.rgjunk = function (g, p) { const X = p.x * 16, Y = p.y * 16, W = p.w * 16, H = p.h * 16, r = cRng((p.x * 73 + p.y * 31) | 0); g.fillStyle = "rgba(0,0,0,0.22)"; g.fillRect(X + 4, Y + 5, W, H); for (let k = 0; k < 9; k++) { g.fillStyle = ["#7a7f86", "#8a6a4a", "#5a5f66", "#a8a49a", "#6a4a3a"][k % 5]; if (k & 1) g.fillRect(X + r() * W * 0.8, Y + r() * H * 0.8, 4 + r() * 9, 3 + r() * 7); else { g.beginPath(); g.arc(X + r() * W, Y + r() * H, 2 + r() * 4, 0, 7); g.fill(); } } };
RG_ART.rgdroidpart = RG_ART.rgjunk;
RG_ART.rgdroid = function (g, p) { const cx = (p.x + p.w / 2) * 16, cy = (p.y + p.h / 2) * 16; g.fillStyle = "rgba(0,0,0,0.25)"; g.beginPath(); g.arc(cx + 3, cy + 4, 8, 0, 7); g.fill(); if ((p.v | 0) & 1) { g.fillStyle = "#e8eaec"; g.beginPath(); g.arc(cx, cy, 7.5, 0, 7); g.fill(); g.fillStyle = (p.v & 2) ? "#2a5ad8" : "#c0392b"; g.beginPath(); g.arc(cx, cy, 4.5, Math.PI, 0); g.fill(); g.fillStyle = "#1a1a1a"; g.beginPath(); g.arc(cx + 2, cy - 2, 1.6, 0, 7); g.fill(); } else { g.fillStyle = "#5a5a52"; g.fillRect(cx - 7, cy - 6, 14, 12); g.fillStyle = "#3a3a34"; g.fillRect(cx - 5, cy - 4, 10, 2); g.fillStyle = "#ffcc33"; g.fillRect(cx - 2, cy + 2, 4, 2); } };
RG_ART.rgfire = function (g, p) { const cx = (p.x + p.w / 2) * 16, cy = (p.y + p.h / 2) * 16; for (let k = 0; k < 8; k++) { const a = k * 0.785; g.fillStyle = "#6a5a4a"; g.beginPath(); g.arc(cx + Math.cos(a) * 15, cy + Math.sin(a) * 15, 4.5, 0, 7); g.fill(); } const gr = g.createRadialGradient(cx, cy, 1, cx, cy, 16); gr.addColorStop(0, "#fff2a0"); gr.addColorStop(0.35, "#ff8a2a"); gr.addColorStop(1, "rgba(120,30,0,0)"); g.fillStyle = gr; g.beginPath(); g.arc(cx, cy, 16, 0, 7); g.fill(); g.strokeStyle = "#3a2414"; g.lineWidth = 3; g.beginPath(); g.moveTo(cx - 8, cy - 5); g.lineTo(cx + 8, cy + 5); g.moveTo(cx - 8, cy + 5); g.lineTo(cx + 8, cy - 5); g.stroke(); };
RG_ART.rgtent = function (g, p) {
  const pts = p.pg.map(q => [q[0] * 16, q[1] * 16]); let cx = 0, cy = 0; for (const q of pts) { cx += q[0]; cy += q[1]; } cx /= pts.length; cy /= pts.length;
  const R = (p.r || 3) * 32, col = p.kind === "hide" ? "#a88e68" : "#b8a888";
  g.fillStyle = "rgba(0,0,0,0.25)"; rgPath2(g, pts.map(q => [q[0] + 8, q[1] + 10])); g.fill();
  g.fillStyle = crSh(col, -0.15); rgPath2(g, pts); g.fill();
  const gr = g.createRadialGradient(cx - R * 0.3, cy - R * 0.35, 2, cx, cy, R); gr.addColorStop(0, crSh(col, 0.2)); gr.addColorStop(1, crSh(col, -0.3)); g.fillStyle = gr; rgPath2(g, rgShade(pts, 0.92, cx, cy)); g.fill();
  g.strokeStyle = crA("#3a2a1a", 0.45); g.lineWidth = 1.5; g.beginPath(); for (const q of pts) { g.moveTo(cx, cy); g.lineTo(q[0], q[1]); } g.stroke();
  g.fillStyle = "#3a2a1a"; const a = (p.ang || 0) + Math.PI; g.beginPath(); g.moveTo(cx + Math.cos(a) * R * 0.95, cy + Math.sin(a) * R * 0.95); g.lineTo(cx + Math.cos(a + 0.35) * R * 0.55, cy + Math.sin(a + 0.35) * R * 0.55); g.lineTo(cx + Math.cos(a - 0.35) * R * 0.55, cy + Math.sin(a - 0.35) * R * 0.55); g.fill();
  g.fillStyle = "#5a4630"; g.beginPath(); g.arc(cx, cy, 3, 0, 7); g.fill();
};
RG_ART.rgbantha = function (g, p) {   // a shaggy bantha: long fur, big head, spiral horns
  const cx = (p.x + p.w / 2) * 16, cy = (p.y + p.h / 2) * 16, fur = (p.v | 0) ? "#5a4632" : "#3e3024";
  g.save(); g.translate(cx, cy); g.rotate(p.ang || 0);
  g.fillStyle = "rgba(20,10,0,0.28)"; g.beginPath(); g.ellipse(10, 12, 34, 21, 0, 0, 7); g.fill();
  g.fillStyle = fur; g.beginPath(); g.ellipse(0, 0, 32, 19, 0, 0, 7); g.fill();
  g.strokeStyle = crSh(fur, 0.18); g.lineWidth = 2; for (let k = -26; k <= 22; k += 4) { g.beginPath(); g.moveTo(k, -15); g.quadraticCurveTo(k + 2, 0, k - 1, 16); g.stroke(); }
  g.fillStyle = crSh(fur, -0.2); g.beginPath(); g.ellipse(33, 0, 11, 10, 0, 0, 7); g.fill();
  g.strokeStyle = "#e0d2ae"; g.lineWidth = 4; g.lineCap = "round";
  for (const sd of [-1, 1]) { g.beginPath(); for (let t = 0; t <= 1.001; t += 0.1) { const a = sd * (0.6 + t * 4.2), rr = 3 + t * 8; g.lineTo(30 + Math.cos(a) * rr, sd * 9 + Math.sin(a) * rr); } g.stroke(); }
  g.restore();
};
RG_ART.rggaffi = function (g, p) { const cx = (p.x + p.w / 2) * 16, cy = (p.y + p.h / 2) * 16; g.strokeStyle = "#5a4630"; g.lineWidth = 3; g.beginPath(); g.moveTo(cx - 14, cy - 6); g.lineTo(cx + 14, cy + 6); g.moveTo(cx - 14, cy + 6); g.lineTo(cx + 14, cy - 6); g.stroke(); g.fillStyle = "#8a8a82"; g.beginPath(); g.arc(cx + 14, cy + 6, 3, 0, 7); g.arc(cx + 14, cy - 6, 3, 0, 7); g.fill(); };
RG_ART.rgramp = function (g, p) { const cx = (p.x + p.w / 2) * 16, cy = (p.y + p.h / 2) * 16; g.save(); g.translate(cx, cy); g.rotate(p.ang || 0); g.fillStyle = "#5a3e2a"; g.fillRect(-36, -26, 72, 52); g.fillStyle = "#6e4e34"; for (let k = -30; k < 36; k += 10) g.fillRect(k, -26, 4, 52); g.restore(); };
RG_ART.rgkrayt = function (g, p) {
  const cx = (p.x + p.w / 2) * 16, cy = (p.y + p.h / 2) * 16, r = cRng(p.seed || 3), bone = "#e8dcc0";
  g.save(); g.translate(cx, cy); g.rotate(p.ang || 0);
  g.fillStyle = "rgba(0,0,0,0.18)"; for (let k = -15; k <= 13; k++) { g.beginPath(); g.ellipse(k * 24 + 10, 12, 10, 7, 0, 0, 7); g.fill(); }
  for (let k = -15; k <= 13; k++) { const x = k * 24, s = 1 - Math.abs(k + 1) / 18; g.fillStyle = crSh(bone, -0.1 + r() * 0.1); g.beginPath(); g.ellipse(x, 0, 9, 6 * s + 3, 0, 0, 7); g.fill(); if (k > -9 && k < 9) { g.strokeStyle = crSh(bone, -0.05); g.lineWidth = 5 * s + 2; for (const sd of [-1, 1]) { g.beginPath(); g.moveTo(x, sd * 4); g.quadraticCurveTo(x - 30, sd * 70 * s, x - 10, sd * (110 * s + 20)); g.stroke(); } } }
  g.fillStyle = bone; g.beginPath(); g.ellipse(360, 0, 70, 38, 0, 0, 7); g.fill(); g.fillStyle = "#3a2a1a"; g.beginPath(); g.ellipse(340, -16, 12, 9, 0, 0, 7); g.ellipse(340, 16, 12, 9, 0, 0, 7); g.fill();
  g.fillStyle = crSh(bone, -0.15); for (let k = 0; k < 8; k++) { g.beginPath(); g.moveTo(400 + k * 4, -30 + k * 8); g.lineTo(430 + k * 2, -26 + k * 8); g.lineTo(404 + k * 4, -22 + k * 8); g.fill(); }
  g.restore();
};
RG_ART.rgsarlacc = function (g, p) {
  const cx = (p.x + p.w / 2) * 16, cy = (p.y + p.h / 2) * 16, R = p.w * 8, r = cRng(p.seed || 5);
  const gr = g.createRadialGradient(cx, cy, 8, cx, cy, R); gr.addColorStop(0, "#120a06"); gr.addColorStop(0.22, "#3a2410"); gr.addColorStop(0.55, crSh(RG.P.ground.base[1], -0.25)); gr.addColorStop(1, "rgba(0,0,0,0)");
  g.fillStyle = gr; g.beginPath(); g.arc(cx, cy, R, 0, 7); g.fill();
  g.strokeStyle = crA("#000000", 0.18); g.lineWidth = 2; for (let k = 1; k < 7; k++) { g.beginPath(); g.arc(cx, cy, R * k / 7, 0, 7); g.stroke(); }
  g.fillStyle = "#c8a878"; for (let k = 0; k < 18; k++) { const a = k / 18 * 6.28; g.beginPath(); g.moveTo(cx + Math.cos(a) * 46, cy + Math.sin(a) * 46); g.lineTo(cx + Math.cos(a + 0.09) * 26, cy + Math.sin(a + 0.09) * 26); g.lineTo(cx + Math.cos(a + 0.18) * 46, cy + Math.sin(a + 0.18) * 46); g.fill(); }
  g.fillStyle = "#7a3a3a"; g.beginPath(); g.arc(cx, cy, 22, 0, 7); g.fill(); g.fillStyle = "#e0b0a0"; g.beginPath(); g.arc(cx - 4, cy - 4, 7, 0, 7); g.fill();
  g.strokeStyle = "#6a4a3a"; g.lineWidth = 6; g.lineCap = "round"; for (let k = 0; k < 7; k++) { const a = r() * 6.28; g.beginPath(); g.moveTo(cx + Math.cos(a) * 40, cy + Math.sin(a) * 40); g.quadraticCurveTo(cx + Math.cos(a + 0.5) * 90, cy + Math.sin(a + 0.5) * 90, cx + Math.cos(a + 0.2) * 130, cy + Math.sin(a + 0.2) * 130); g.stroke(); }
};
RG_ART.rgpit = function () {};
RG_ART.rgbonehit = function () {};
RG_ART.rgskiff = function (g, p) { const cx = (p.x + p.w / 2) * 16, cy = (p.y + p.h / 2) * 16; g.save(); g.translate(cx, cy); g.rotate(p.ang || 0); g.fillStyle = "rgba(0,0,0,0.25)"; g.beginPath(); g.ellipse(8, 10, 26, 64, 0, 0, 7); g.fill(); g.fillStyle = "#8a7a62"; g.beginPath(); g.ellipse(0, 0, 24, 62, 0, 0, 7); g.fill(); g.fillStyle = "#a89478"; g.fillRect(-16, -44, 32, 88); g.fillStyle = "#6a5a46"; for (let k = -40; k < 44; k += 8) g.fillRect(-16, k, 32, 1.5); g.strokeStyle = "#4a3e30"; g.lineWidth = 2; g.strokeRect(-16, -44, 32, 88); g.restore(); };
RG_ART.rgconverter = function (g, p) { const X = p.x * 16, Y = p.y * 16, W = p.w * 16, H = p.h * 16; g.fillStyle = "rgba(0,0,0,0.25)"; g.fillRect(X + 4, Y + 5, W, H); g.fillStyle = "#8a8e94"; g.fillRect(X, Y, W, H); g.fillStyle = "#5a5e64"; for (let k = 0; k < 3; k++) g.fillRect(X + 4 + k * (W - 8) / 3, Y + 4, (W - 8) / 3 - 3, H - 8); g.fillStyle = "#40c4ff"; g.fillRect(X + W / 2 - 2, Y + H / 2 - 2, 4, 4); };
RG_ART.rgtrail = function (g, p) { const cx = (p.x + p.w / 2) * 16, cy = (p.y + p.h / 2) * 16, L = (p.len || 30) * 32; g.save(); g.translate(cx, cy); g.rotate(p.ang || 0); const gr = g.createLinearGradient(-L / 2, 0, L / 2, 0); gr.addColorStop(0, "rgba(60,40,20,0)"); gr.addColorStop(1, "rgba(60,40,20,0.45)"); g.fillStyle = gr; g.beginPath(); g.ellipse(0, 0, L / 2, 30, 0, 0, 7); g.fill(); g.restore(); };
RG_ART.rgarena = function (g, p) { const cx = (p.x + p.w / 2) * 16, cy = (p.y + p.h / 2) * 16, R = p.r * 32; g.fillStyle = crPat("packed", crSh(RG.P.ground.base[1], -0.06)); g.beginPath(); g.arc(cx, cy, R, 0, 7); g.fill(); g.fillStyle = "#e8e0d0"; for (let k = -6; k < 6; k++) for (let q = 0; q < 2; q++) if ((k + q) & 1) g.fillRect(cx + k * 24, cy - 30 + q * 24, 24, 24); g.strokeStyle = crA("#ffffff", 0.35); g.lineWidth = 4; g.beginPath(); g.arc(cx, cy, R * 0.75, 0, 7); g.stroke(); };
RG_ART.rgbayfloor = function (g, p) { const cx = (p.x + p.w / 2) * 16, cy = (p.y + p.h / 2) * 16, R = p.r * 32; g.fillStyle = crPat("sandstone", crSh(CITY.theme.g.plaza, -0.04)); g.beginPath(); g.arc(cx, cy, R, 0, 7); g.fill(); g.strokeStyle = crA("#000000", 0.18); g.lineWidth = 3; g.beginPath(); g.arc(cx, cy, R * 0.55, 0, 7); g.stroke(); g.beginPath(); for (let k = 0; k < 8; k++) { const a = k * 0.785; g.moveTo(cx + Math.cos(a) * R * 0.6, cy + Math.sin(a) * R * 0.6); g.lineTo(cx + Math.cos(a) * R * 0.95, cy + Math.sin(a) * R * 0.95); } g.stroke(); g.fillStyle = "rgba(40,30,20,0.25)"; g.beginPath(); g.ellipse(cx, cy, R * 0.4, R * 0.3, 0.5, 0, 7); g.fill(); };
// ships & big vehicles
const RG_SHIP_ART = {
  freighter(g, v) {   // saucer with front mandibles, cockpit tube on the right, engine band at the back
    const c = ["#cfcfc8", "#c8c4b8", "#d6d2c8", "#bfc4c8"][v & 3];
    g.fillStyle = c; g.beginPath(); g.arc(0, 0, 210, 0, 7); g.fill();
    g.fillRect(150, -130, 150, 70); g.fillRect(150, 60, 150, 70);
    g.fillStyle = crSh(c, -0.18); g.beginPath(); g.arc(0, 0, 150, 0, 7); g.fill(); g.fillStyle = crSh(c, 0.06); g.beginPath(); g.arc(0, 0, 70, 0, 7); g.fill();
    g.strokeStyle = crA("#000000", 0.22); g.lineWidth = 3; for (let k = 0; k < 12; k++) { const a = k * 0.5236; g.beginPath(); g.moveTo(Math.cos(a) * 75, Math.sin(a) * 75); g.lineTo(Math.cos(a) * 205, Math.sin(a) * 205); g.stroke(); }
    g.fillStyle = "#3a3e44"; g.beginPath(); g.arc(-40, 30, 28, 0, 7); g.fill(); g.fillStyle = "#8a2a2a"; g.fillRect(-60, -18, 40, 36);
    g.fillStyle = c; g.fillRect(-20, -250, 120, 60); g.fillStyle = "#2a3a4a"; g.beginPath(); g.arc(110, -220, 34, 0, 7); g.fill(); g.fillStyle = "#6ac8ff"; g.beginPath(); g.arc(114, -224, 14, 0, 7); g.fill();
    g.fillStyle = "#6ac8ff"; g.fillRect(-212, -120, 16, 240); g.fillStyle = "rgba(120,200,255,0.35)"; g.fillRect(-240, -120, 28, 240);
  },
  skyhopper(g, v) { g.fillStyle = "#d8d4c8"; g.beginPath(); g.moveTo(100, 0); g.lineTo(-90, -80); g.lineTo(-60, 0); g.lineTo(-90, 80); g.closePath(); g.fill(); g.fillStyle = "#3a4a5a"; g.beginPath(); g.ellipse(30, 0, 26, 14, 0, 0, 7); g.fill(); g.fillStyle = "#c0582c"; g.fillRect(-80, -78, 30, 12); g.fillRect(-80, 66, 30, 12); },
  podracer(g, v) { const c = ["#c0582c", "#3a6ab0", "#d8c25a", "#7a8a3a", "#8a3a8a"][v % 5]; for (const s of [-1, 1]) { g.fillStyle = "#5a5f66"; g.fillRect(-20, s * 50 - 18, 150, 36); g.fillStyle = c; g.fillRect(40, s * 50 - 18, 90, 36); g.fillStyle = "#ff9a4a"; g.fillRect(-28, s * 50 - 12, 10, 24); } g.strokeStyle = "#40c4ff"; g.lineWidth = 2; g.beginPath(); g.moveTo(20, -32); g.lineTo(20, 32); g.stroke(); g.strokeStyle = "#2a2a2a"; g.lineWidth = 3; g.beginPath(); g.moveTo(-20, -40); g.lineTo(-110, -6); g.moveTo(-20, 40); g.lineTo(-110, 6); g.stroke(); g.fillStyle = c; g.beginPath(); g.ellipse(-120, 0, 26, 18, 0, 0, 7); g.fill(); g.fillStyle = "#2a3a4a"; g.beginPath(); g.ellipse(-112, 0, 10, 8, 0, 0, 7); g.fill(); },
  sandcrawler(g, v) { g.fillStyle = "#2e2a26"; g.fillRect(-470, -240, 940, 70); g.fillRect(-470, 170, 940, 70); g.fillStyle = "#4a4440"; for (let k = -460; k < 470; k += 40) { g.fillRect(k, -236, 20, 62); g.fillRect(k, 174, 20, 62); } g.fillStyle = "#8a5a36"; g.beginPath(); g.moveTo(-440, -170); g.lineTo(380, -170); g.lineTo(480, -60); g.lineTo(480, 60); g.lineTo(380, 170); g.lineTo(-440, 170); g.closePath(); g.fill(); g.fillStyle = "#a0683e"; g.fillRect(-380, -120, 640, 240); g.fillStyle = "#6e4628"; for (let k = -360; k < 260; k += 70) g.fillRect(k, -120, 6, 240); g.fillStyle = "#2a1a10"; g.fillRect(360, -90, 30, 180); g.fillStyle = "#ffcc55"; for (let k = -70; k < 80; k += 40) g.fillRect(366, k, 18, 10); g.fillStyle = "#7a7064"; g.fillRect(-200, -60, 180, 120); g.fillStyle = "rgba(0,0,0,0.2)"; g.fillRect(-200, 40, 180, 20); },
  escapepod(g) { g.fillStyle = "#c8ccd0"; g.beginPath(); g.arc(0, 0, 48, 0, 7); g.fill(); g.fillStyle = "#8a9096"; g.beginPath(); g.arc(0, 0, 32, 0, 7); g.fill(); g.fillStyle = "#3a3e44"; g.fillRect(-12, -48, 24, 20); g.fillStyle = "rgba(30,20,10,0.4)"; g.beginPath(); g.arc(-18, 10, 18, 0, 7); g.fill(); },
  generic(g, v, L, W) { g.fillStyle = "#8a9096"; g.fillRect(-L / 2, -W / 2, L, W); g.fillStyle = "#5a5f66"; g.fillRect(-L / 2 + 10, -W / 2 + 10, L - 20, W - 20); g.fillStyle = "#40c4ff"; g.fillRect(L / 2 - 30, -10, 20, 20); }
};
RG_ART.rgship = function (g, p) {
  const k = p.kind, H = RG_HULL[k] || [10, 6], cx = (p.cxm || (p.x + p.w / 2) / 2) * 32, cy = (p.cym || (p.y + p.h / 2) / 2) * 32;
  const sc = k === "freighter" ? H[0] * 32 / 520 : k === "skyhopper" ? H[0] * 32 / 200 : k === "podracer" ? H[0] * 32 / 300 : k === "sandcrawler" ? H[0] * 32 / 960 : k === "escapepod" ? H[0] * 32 / 100 : 1;
  g.save(); g.translate(cx, cy);
  g.shadowColor = "rgba(20,10,0,0.38)"; g.shadowBlur = 8; g.shadowOffsetX = 14; g.shadowOffsetY = 18;
  g.rotate(p.ang || 0); g.scale(sc, sc);
  (RG_SHIP_ART[k] || ((gg, v) => RG_SHIP_ART.generic(gg, v, H[0] * 32, H[1] * 32)))(g, p.v | 0);
  g.restore();
};
RG_ART.rgshipwing = function () {};
(function rgPropWire() {
  if (typeof crProp !== "function") return;
  const _cp = crProp;
  window.crProp = crProp = function (g, p, h) {
    if (p.rg && RG_ART[p.t]) { if (RG_FLOOR.has(p.t) && !p._floorPass && RG.org) return; try { RG_ART[p.t](g, p, h); } catch (e) { /* never break a bake */ } return; }
    return _cp(g, p, h);
  };
})();
// EOF part 3 (regionart.js continues)

// litter: towns get a little, the open wilds almost none (the classic city amounts would read as noise on sand)
function rgLitter(g, rx, ry) {
  const T = CITY.theme, list = CR_LITTER[T.trash] || CR_LITTER.paper;
  const mcx = Math.floor(rx * 16 / 1000), mcy = Math.floor(ry * 16 / 1000), cls = cityMacroClass(mcx, mcy);
  const n = [1, 3, 6, 10, 14, 8, 1, 1][cls] || 1;
  const r = cRng(cH(CITY.seed, rx, ry, 909)), tx0 = rx * 32, ty0 = ry * 32;
  for (let k = 0; k < n; k++) {
    const tx = tx0 + Math.floor(r() * 32), ty = ty0 + Math.floor(r() * 32), fl = cityFlagsT(tx, ty), kind = list[Math.floor(r() * list.length)], a = r() * 6.28, rr = r();
    if (fl & (F_MOVE | F_WATER)) continue;
    crLitterItem(g, (fl & F_IN) && (kind === "tumble" || kind === "drift" || kind === "puddle") ? "paper" : kind, tx * 16 + r() * 16, ty * 16 + r() * 16, a, rr);
  }
}

/* --- 9. the organic bake ------------------------------------------------------------------ */
function rgBake(rx, ry) {
  const t0 = performance.now();
  const S = CR.TS, cv = crCanvas(S, S), g = cv.getContext("2d");
  const wx0 = rx * S, wy0 = ry * S, m0x = wx0 / 32, m0y = wy0 / 32, m1x = m0x + 16, m1y = m0y + 16;
  const tx0 = rx * 32, ty0 = ry * 32, tx1 = tx0 + 32, ty1 = ty0 + 32;
  g.translate(-wx0, -wy0);
  try {
    if (wx0 >= CITY.WORLD_T * 16 || wy0 >= CITY.WORLD_T * 16) { g.fillStyle = "#000"; g.fillRect(wx0, wy0, S, S); return cv; }
    rgGround(g, wx0, wy0);
    const segs = rgRoadsIn(m0x, m0y, m1x, m1y);
    rgRoadPass(g, segs, 0);
    const blocks = cityBlocksInRect(m0x, m0y, m1x, m1y), surfs = [], blds = [], props = [], fences = [];
    for (const B of blocks) {
      for (const s of B.surf) if (s.x1 >= tx0 - 3 && s.x0 <= tx1 + 3 && s.y1 >= ty0 - 3 && s.y0 <= ty1 + 3) surfs.push(s);
      for (const b of B.blds) if (b.x + b.w >= tx0 - 1 && b.x <= tx1 + 1 && b.y + b.h >= ty0 - 1 && b.y <= ty1 + 1) blds.push(b);
      for (let pi = 0; pi < B.props.length; pi++) { const p = B.props[pi]; if (p.t === "tree" || p.x + p.w < tx0 - 6 || p.x > tx1 + 6 || p.y + p.h < ty0 - 6 || p.y > ty1 + 6) continue; if (cityRT.used.has(B.key + "|" + pi)) continue; props.push(p); }
      for (const f of B.fences) if (f.x1 >= tx0 - 1 && f.x0 <= tx1 + 1 && f.y1 >= ty0 - 1 && f.y0 <= ty1 + 1) { f._B = B; fences.push(f); }
    }
    surfs.sort((a, b) => (CR_SURF_ORDER[a.t] || 0) - (CR_SURF_ORDER[b.t] || 0));
    for (const s of surfs) { if (s.t === "rgdisc") { g.fillStyle = crPat(s.pat, s.col); g.beginPath(); g.ellipse((s.x0 + s.x1) * 8, (s.y0 + s.y1) * 8, (s.x1 - s.x0) * 8, (s.y1 - s.y0) * 8, 0, 0, 7); g.fill(); g.strokeStyle = crA("#000000", 0.1); g.lineWidth = 3; g.stroke(); } else crSurface(g, s); }
    for (const p of props) if (RG_FLOOR.has(p.t)) { p._floorPass = 1; crProp(g, p, 0); p._floorPass = 0; }
    rgRoadPass(g, segs, 1); rgRoadPass(g, segs, 2);
    for (const R of rgRingsIn(blocks, m0x, m0y, m1x, m1y)) rgDrawRing(g, R);
    for (const b of blds) crBuilding(g, b, tx0, ty0, tx1, ty1, 0);
    rgLitter(g, rx, ry);
    for (const b of blds) crBuilding(g, b, tx0, ty0, tx1, ty1, 1);
    const P = CITY.theme.fu, fam = crFam(), st = P.style;
    for (const b of blds) {
      const G = b.int;
      for (let fi = 0; fi < G.furn.length; fi++) { const f = G.furn[fi]; if (b.x + f.x + f.w < tx0 - 1 || b.x + f.x > tx1 + 1 || b.y + f.y + f.h < ty0 - 1 || b.y + f.y > ty1 + 1) continue; if (cityRT.used.has(b.uid + ":f" + fi)) continue; crFurn(g, f, b, P, fam, st); }
    }
    for (const f of fences) crFence(g, f);
    for (const p of props) if (!RG_FLOOR.has(p.t) && p.t !== "streetlight" && p.t !== "pole") crProp(g, p, cH(CITY.seed, p.x | 0, p.y | 0, 5));
    const seen = new Set();
    for (let cy = (ty0 - 8) >> 7; cy <= (ty1 + 8) >> 7; cy++) for (let cx = (tx0 - 8) >> 7; cx <= (tx1 + 8) >> 7; cx++) {
      const C = cityChunk(cx, cy);
      for (const t of C.trees) { if (seen.has(t) || t.x < tx0 - 8 || t.x > tx1 + 8 || t.y < ty0 - 8 || t.y > ty1 + 8) continue; seen.add(t); crTree(g, t.x * 16 + 8, t.y * 16 + 8, t, cH(CITY.seed, t.x * 7 | 0, t.y * 7 | 0, 3)); }
    }
    for (const p of props) if (p.t === "streetlight" || p.t === "pole") crProp(g, p, 0);
  } catch (e) { if (window.trackProgress) window.trackProgress("rgBake " + rx + "," + ry + ": " + e.message, true); else console.warn(e); }
  CR.bakeMs = performance.now() - t0; CR.baked++;
  return cv;
}
(function rgGroundWire() {
  if (typeof crClassGround !== "function") return;
  const _cg = crClassGround;
  window.crClassGround = crClassGround = function (cls) { const o = RG.grid && RG.P && RG.P.gnd && RG.P.gnd[cls]; return o || _cg(cls); };
})();
(function rgBakeWire() {
  if (typeof crBake !== "function") return;
  const _bk = crBake;
  window.crBake = crBake = function (rx, ry) { return RG.org ? rgBake(rx, ry) : _bk(rx, ry); };
  // the render cache key must include the world, not just the theme + seed
  if (typeof cityRenderReset === "function") {
    const _rr = cityRenderReset;
    window.cityRenderReset = cityRenderReset = function () { _rr(); CR.key = CITY.themeKey + "|" + CITY.seed; CR.rgKey = RG.key; };
  }
})();
// EOF part 4 (regionart.js continues)

/* --- 10. organic map tiles ------------------------------------------------------------------ */
function rgMix(a, b, t) { const A = crRGB(a), Bc = crRGB(b); return [A[0] + (Bc[0] - A[0]) * t, A[1] + (Bc[1] - A[1]) * t, A[2] + (Bc[2] - A[2]) * t]; }
function rgMapColor(xm, ym, St) {
  const P = RG.P, G = P.ground;
  let c = crRGB(G.base[1]);
  for (const L of G.layers) { let v = rgF(L.f, xm, ym); if (L.lo !== undefined) v = rgSm(L.lo, L.hi, v); v *= (L.a === undefined ? 1 : L.a); if (v > 0.02) { const d = crRGB(L.col); c = [c[0] + (d[0] - c[0]) * v, c[1] + (d[1] - c[1]) * v, c[2] + (d[2] - c[2]) * v]; } }
  if (St && St.bg === "#06121e") c = [c[0] * 0.25 + 4, c[1] * 0.3 + 14, c[2] * 0.38 + 26];   // sci-fi map style: tinted dark
  return c;
}
function rgMapTile(g, m0x, m0y, mpp, S) {
  const span = 256 * mpp, step = mpp <= 2 ? 8 : 4;
  for (let py = 0; py < 256; py += step) for (let px = 0; px < 256; px += step) {
    const c = rgMapColor(m0x + (px + step / 2) * mpp, m0y + (py + step / 2) * mpp, S);
    g.fillStyle = "rgb(" + (c[0] | 0) + "," + (c[1] | 0) + "," + (c[2] | 0) + ")"; g.fillRect(px, py, step, step);
  }
  const X = m => (m - m0x) / mpp, Y = m => (m - m0y) / mpp;
  // towns
  for (const T of RG.towns) { if (T.x + T.r < m0x || T.x - T.r > m0x + span || T.y + T.r < m0y || T.y - T.r > m0y + span) continue; g.fillStyle = crA(S.bld, mpp > 8 ? 0.55 : 0.3); g.beginPath(); g.arc(X(T.x), Y(T.y), T.r / mpp, 0, 7); g.fill(); }
  if (mpp <= 4) {
    const blocks = cityBlocksInRect(m0x, m0y, m0x + span, m0y + span);
    for (const B of blocks) {
      for (const s of B.surf) if (s.t === "water" || s.t === "rgdisc") { g.fillStyle = s.t === "water" ? S.water : S.lot; g.beginPath(); g.ellipse(X((s.x0 + s.x1) / 4), Y((s.y0 + s.y1) / 4), (s.x1 - s.x0) / 4 / mpp, (s.y1 - s.y0) / 4 / mpp, 0, 0, 7); g.fill(); }
      for (const p of B.props) if (p.pg && (p.t === "rgrock" || p.t === "rgship" || p.t === "rgtent")) { g.fillStyle = p.t === "rgrock" ? crA("#000000", 0.28) : S.bldEdge; g.beginPath(); g.moveTo(X(p.pg[0][0] / 2), Y(p.pg[0][1] / 2)); for (const q of p.pg) g.lineTo(X(q[0] / 2), Y(q[1] / 2)); g.closePath(); g.fill(); }
      if (B.rings) for (const R of B.rings) { g.strokeStyle = S.bldEdge; g.lineWidth = Math.max(1, R.th / mpp); g.beginPath(); g.arc(X(R.cx), Y(R.cy), R.r / mpp, 0, 7); g.stroke(); }
      for (const b of B.blds) {
        const bx = X(b.x / 2), by = Y(b.y / 2), bw = Math.max(1, b.w / 2 / mpp), bh = Math.max(1, b.h / 2 / mpp);
        g.fillStyle = b.type === "civic" || b.type === "church" || b.rgLandmark ? S.civic : S.bld;
        if (b.round) { g.beginPath(); g.ellipse(bx + bw / 2, by + bh / 2, bw / 2, bh / 2, 0, 0, 7); g.fill(); } else g.fillRect(bx, by, bw, bh);
      }
    }
  }
  for (const R of RG.rings) { if (R.cx + R.r < m0x || R.cx - R.r > m0x + span || R.cy + R.r < m0y || R.cy - R.r > m0y + span) continue; g.strokeStyle = S.bldEdge; g.lineWidth = Math.max(1.2, R.th / mpp * 1.5); g.beginPath(); g.arc(X(R.cx), Y(R.cy), R.r / mpp, 0, 7); g.stroke(); }
  // roads
  const segs = rgRoadsIn(m0x, m0y, m0x + span, m0y + span);
  g.lineCap = "round";
  const draw = (edge) => {
    for (const s of segs) {
      const k = s.r.kind;
      if (mpp >= 32 && k !== "main" && k !== "ring") continue;
      if (mpp >= 8 && k === "street" && s.w < 8) continue;
      const w = Math.max(k === "ring" || k === "main" ? 2 : 1, s.w / mpp) + (edge ? 1.6 : 0);
      g.strokeStyle = edge ? S.edge : (k === "ring" ? S.hw : k === "main" ? S.road : S.road2); g.lineWidth = w;
      g.beginPath(); g.moveTo(X(s.ax), Y(s.ay)); g.lineTo(X(s.bx), Y(s.by)); g.stroke();
    }
  };
  if (mpp <= 16) draw(true);
  draw(false);
}
(function rgMapWire() {
  if (typeof mapTile !== "function") return;
  const _mt = mapTile;
  window.mapTile = mapTile = function (mpp, tx, ty, allowBuild) {
    if (!RG.org) return _mt(mpp, tx, ty, allowBuild);
    const k = mapTileKey(mpp, tx, ty) + "|" + RG.key;
    let t = MAPV.tiles.get(k);
    if (t) { t.used = performance.now(); return t.c; }
    if (!allowBuild) return null;
    const c = document.createElement("canvas"); c.width = 256; c.height = 256;
    const g = c.getContext("2d"), S = mapStyle();
    try { rgMapTile(g, tx * 256 * mpp, ty * 256 * mpp, mpp, S); } catch (e) { if (window.trackProgress) window.trackProgress("rgMapTile: " + e.message, true); }
    MAPV.tiles.set(k, { c, used: performance.now() }); MAPV.built++;
    if (MAPV.tiles.size > 120) { const arr = [...MAPV.tiles.entries()].sort((a, b) => a[1].used - b[1].used); for (let i = 0; i < 24; i++) MAPV.tiles.delete(arr[i][0]); }
    return c;
  };
})();
// EOF:js/regionart.js
