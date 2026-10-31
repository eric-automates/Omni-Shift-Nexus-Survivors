/* =========================================================================
   OMNI-SHIFT v14 — NEXUS CITY · STEALTH, HEARING & THE DIRECTOR
   • Enemies are spread through the city (rooms, guard posts, patrols) instead
     of swarming. Each one idles, patrols, investigates, searches, hunts.
   • Sound is physical: level L = L0 − 20·log10(d) − 0.012·d − walls, where
     every wall / door / window / fence on the straight path costs its own
     transmission loss (sound that only grazes buildings bends around them).
     L ≥ 50 dB notice · ≥ 66 investigate · ≥ 88 urgent · ≥ 115 (< 25 m) combat.
     Unsuppressed gun inside a house: heard ~850 m away. Suppressed: ~19 m
     outside. Suppressed in the inner room of a council hall: inside only.
     Lightsabers & blades: about a metre and a half.
   • Every new shot re-targets listeners. Ricochets & breaking glass make
     their own noise — shoot a wall to pull a guard away.
   • V toggles a suppressor (real firearms only), hold Shift to sneak.
   ========================================================================= */
"use strict";

/* --- 1. HERO WEAPON SOUND PROFILES ------------------------------------------ */
// [L0 dB @1 m, class, suppressible]  class: g firearm · b blaster · e energy · m magic · x blade · v voice
const ST_WPN = {};
(function () {
  const set = (ids, L0, cls, sup) => ids.forEach(i => { ST_WPN[i] = [L0, cls, sup]; });
  set([0, 3, 14, 18, 24, 29, 30, 42, 48, 50, 55, 71, 76, 77, 78, 79], 72, "x", 0);   // sabers, blades, claws
  set([17], 96, "x", 0);                                     // Reaver reactor buzzsaws
  set([1, 5, 6, 54], 140, "b", 0); set([2], 145, "b", 0);    // blasters & bowcaster
  set([7, 9], 136, "e", 0);                                  // Goa'uld staff weapons
  set([10, 19, 22, 23, 35, 36, 43, 47], 122, "e", 0);        // beams, lasguns, phasers, gauss
  set([4, 11, 45], 100, "e", 0); set([46], 88, "e", 0);      // welder / stunner / grav-gun · sonic
  set([16, 21], 150, "e", 0); set([58], 130, "m", 0);        // thrusters & mortar · Weasley fireworks
  set([12, 38, 49, 56, 57, 59, 60, 61, 62, 63, 64, 65, 66, 67, 68, 69, 70, 72, 73, 74, 75], 104, "m", 0);
  set([20], 92, "v", 0);                                     // the Voice
  set([8, 13, 15, 32, 39, 51], 160, "g", 1);                 // firearms that take a suppressor
  set([27, 31], 162, "g", 0); set([25, 41, 52], 165, "g", 0); // magnums, revolvers, Deckard's blaster
  set([26, 28, 33, 40, 44, 53], 170, "g", 0); set([34, 37], 176, "g", 0);   // heavy guns & shotguns · bolters & dakka
})();
const ST_NOSUP_WHY = { 25: "a Viper magnum", 27: "a mass-effect shotgun", 28: "an M56 smartgun", 31: "a Morita", 33: "the Super Shotgun", 34: "a bolter", 37: "a Deffgun", 40: "a minigun", 41: "Deckard's blaster", 44: "a quad-barrel boomstick", 52: "revolvers", 53: "an M60", 26: "Centurion autocannons" };
function stHeroProfile(wpnId) {
  let p = ST_WPN[wpnId];
  if (!p && player && player.cid === CUSTOM_CID && typeof customCityUniverse === "function") { const u = customCityUniverse(); if (u && u.sound) p = u.sound; }
  if (!p) p = (typeof BALLISTIC_IDS !== "undefined" && BALLISTIC_IDS.has(wpnId)) ? [160, "g", 1] : [124, "e", 0];
  return p;
}
const ST_L = { notice: 50, investigate: 66, urgent: 88, combat: 115 };
const ST_TL = { 1: 24, 2: 32, 3: 35, 4: 30, 5: 20, 6: 15, 7: 24, 8: 20, 9: 30, 10: 2, 11: 3, 12: 3, 13: 5, 14: 3, 15: 4, 16: 0, 17: 1, 18: 1, 19: 0, 20: 1, 21: 10, 22: 2 };

/* --- 2. STATE ----------------------------------------------------------------- */
const ST = {
  state: new Uint8Array(MAX_E), city: new Uint8Array(MAX_E), sus: new Float32Array(MAX_E), urg: new Uint8Array(MAX_E),
  tx: new Float32Array(MAX_E), ty: new Float32Array(MAX_E), hx: new Float32Array(MAX_E), hy: new Float32Array(MAX_E),
  face: new Float32Array(MAX_E), t: new Float32Array(MAX_E), lost: new Float32Array(MAX_E), look: new Float32Array(MAX_E),
  icon: new Float32Array(MAX_E), iconK: new Uint8Array(MAX_E), stuck: new Float32Array(MAX_E), fire: new Float32Array(MAX_E),
  ranged: new Uint8Array(MAX_E), wait: new Float32Array(MAX_E), heard: new Float32Array(MAX_E), flash: new Float32Array(MAX_E),
  sid: new Array(MAX_E).fill(null), path: new Array(MAX_E).fill(null), route: new Array(MAX_E).fill(null), rk: new Uint8Array(MAX_E),
  lkx: 0, lky: 0, lkT: -99, frame: 0, pathBudget: 0, dirT: 0, hunterT: 60, respT: 0, noises: [], ring: null,
  suppressed: false, sneak: false, stepT: 0, meleeT: 0, shotT: 0, alerts: 0, susMax: 0, lastShotL: 0, msgT: 0, built: 0
};
const ST_IDLE = 0, ST_PATROL = 1, ST_INVEST = 2, ST_SEARCH = 3, ST_ALERT = 4, ST_RETURN = 5;

/* --- 3. NOISE PROPAGATION ------------------------------------------------------ */
// distance (m) at which a source of L0 falls to `thr` in the open
const _stRangeCache = new Map();
function stOpenRange(L0, thr) {
  const k = L0 * 1000 + thr; let d = _stRangeCache.get(k);
  if (d !== undefined) return d;
  let lo = 1, hi = 5000;
  for (let it = 0; it < 40; it++) { const m = (lo + hi) / 2; if (L0 - 20 * Math.log10(m) - 0.012 * m >= thr) lo = m; else hi = m; }
  _stRangeCache.set(k, lo); return lo;
}
// transmission loss (dB) along the straight path between two local points
function cityOcclusionDb(x0, y0, x1, y1) {
  const ax = x0 + CITY.orx, ay = y0 + CITY.ory, bx = x1 + CITY.orx, by = y1 + CITY.ory, dx = bx - ax, dy = by - ay;
  const len = Math.hypot(dx, dy);
  if (len < 8) return 0;
  const srcB = cityBldT(Math.floor(ax / 16), Math.floor(ay / 16)), dstB = cityBldT(Math.floor(bx / 16), Math.floor(by / 16));
  const srcIn = srcB && (cityFlagsT(Math.floor(ax / 16), Math.floor(ay / 16)) & F_IN) ? srcB.uid : null;
  const dstIn = dstB && (cityFlagsT(Math.floor(bx / 16), Math.floor(by / 16)) & F_IN) ? dstB.uid : null;
  const far = len > 5200;   // > 160 m: estimate the shells only, the rest is diffraction
  let tx = Math.floor(ax / 16), ty = Math.floor(ay / 16);
  const ex = Math.floor(bx / 16), ey = Math.floor(by / 16), sx = dx > 0 ? 1 : -1, sy = dy > 0 ? 1 : -1;
  const tdx = dx !== 0 ? Math.abs(16 / dx) : 1e9, tdy = dy !== 0 ? Math.abs(16 / dy) : 1e9;
  let tmx = dx !== 0 ? ((sx > 0 ? (tx + 1) * 16 - ax : ax - tx * 16) / Math.abs(dx)) : 1e9;
  let tmy = dy !== 0 ? ((sy > 0 ? (ty + 1) * 16 - ay : ay - ty * 16) / Math.abs(dy)) : 1e9;
  let own = 0, other = 0, otherB = 0, cur = 0, curK = -1, curBld = null, bldSum = 0, lastBld = null;
  const maxSteps = far ? 90 : 700;
  const flush = () => {
    if (!curBld) return;
    if (curBld === srcIn || curBld === dstIn) own += bldSum; else { other += Math.min(bldSum, otherB === 0 ? 10 : 3); otherB++; }   // sound bends over single-storey roofs
    bldSum = 0;
  };
  for (let s = 0; s < maxSteps; s++) {
    if (s > 0) {
      const f = cityFlagsT(tx, ty);
      let k = 0;
      if (f & (F_SHOT | F_SIGHT | F_WIN | F_DOOR | F_MOVE)) {
        k = cityKindT(tx, ty);
        if (k === K_DOOR || k === K_EDOOR) { const D = cityDoorT(tx, ty); if (D && D.open >= 0.5) k = 0; }
        if (k === K_WIN && !(f & F_WIN)) k = 0;   // broken pane
      }
      if (k !== curK) {
        if (k && ST_TL[k]) {
          const b = (f & F_IN) || k <= K_GDOOR ? cityBldT(tx, ty) : null, uid = b ? b.uid : null;
          if (uid !== curBld) { flush(); curBld = uid; }
          if (uid) bldSum += ST_TL[k]; else cur += ST_TL[k];
          lastBld = uid;
        }
        curK = k;
      }
    }
    if (tx === ex && ty === ey) break;
    if (tmx < tmy) { tmx += tdx; tx += sx; } else { tmy += tdy; ty += sy; }
    if (Math.min(tmx, tmy) > 1.0001) break;
  }
  flush();
  if (far) {   // far field: walls of the source / listener shells + urban clutter
    if (dstIn && dstIn !== srcIn) own += 22;
    other += 10;
  }
  return Math.min(80, own + other + Math.min(cur, 8));
}
// emit a sound. src: 0 hero · 1 enemy · 2 world. data: optional {px, py} payload (shouted contact report)
function noiseEmit(x, y, L0, kind, src = 2, data = null) {
  if (!CITY.on || !player) return;
  const t = runTime;
  ST.noises.push({ x, y, L0, kind, src, t });
  if (ST.noises.length > 24) ST.noises.shift();
  const capM = src === 1 ? 130 : 2400;
  const maxM = Math.min(capM, stOpenRange(L0, ST_L.notice));
  const maxPx = maxM * 32, maxPx2 = maxPx * maxPx;
  let heardBy = 0;
  for (let j = 0; j < MAX_E; j++) {
    if (!eAct[j] || (typeof allyIs === "function" && allyCount > 0 && allyIs(j)) || eDummy[j]) continue;
    const dx = eX[j] - x, dy = eY[j] - y, d2 = dx * dx + dy * dy;
    if (d2 > maxPx2) continue;
    const dm = Math.max(1, Math.sqrt(d2) / 32);
    let L = L0 - 20 * Math.log10(dm) - 0.012 * dm;
    if (L < ST_L.notice) continue;
    L -= cityOcclusionDb(x, y, eX[j], eY[j]);
    if (L < ST_L.notice) continue;
    stHear(j, x, y, L, kind, src, dm, data);
    heardBy++;
  }
  // distant enemies that are not simulated yet answer loud noises too
  if (src === 0 && L0 >= 125) stResponders(x, y, L0);
  return heardBy;
}
function stHear(j, x, y, L, kind, src, dm, data) {
  if (ST.state[j] === ST_ALERT && ST.lost[j] < 2) return;   // busy fighting
  ST.heard[j] = runTime;
  // where they think it came from: error grows with distance
  const err = Math.min(260, dm * 32 * 0.06) * (L > ST_L.urgent ? 0.5 : 1);
  let tx = x + (Math.random() - 0.5) * err * 2, ty = y + (Math.random() - 0.5) * err * 2;
  if (data && typeof data.px === "number") { tx = data.px + (Math.random() - 0.5) * 80; ty = data.py + (Math.random() - 0.5) * 80; }
  if (L >= ST_L.combat && dm < 25 && src === 0) { stAlert(j, x, y, false); return; }
  if (L >= ST_L.investigate || (kind === "voice" && L >= ST_L.notice + 6)) {
    const urgent = L >= ST_L.urgent || kind === "voice";
    ST.state[j] = ST_INVEST; ST.t[j] = 0; ST.tx[j] = tx; ST.ty[j] = ty; ST.urg[j] = urgent ? 1 : 0;
    ST.path[j] = null; ST.sus[j] = Math.max(ST.sus[j], 0.45);
    ST.icon[j] = 1.6; ST.iconK[j] = 1;
    return;
  }
  // notice: turn toward it, grow suspicious
  ST.face[j] = Math.atan2(y - eY[j], x - eX[j]);
  ST.sus[j] = Math.min(0.9, ST.sus[j] + 0.22);
  if (ST.state[j] <= ST_PATROL || ST.state[j] === ST_RETURN) { ST.wait[j] = 1.4; ST.icon[j] = 1.0; ST.iconK[j] = 1; }
  if (ST.sus[j] > 0.6 && ST.state[j] !== ST_INVEST) { ST.state[j] = ST_INVEST; ST.t[j] = 0; ST.tx[j] = tx; ST.ty[j] = ty; ST.urg[j] = 0; ST.path[j] = null; }
}
function stAlert(j, x, y, saw) {
  const was = ST.state[j] === ST_ALERT;
  ST.state[j] = ST_ALERT; ST.sus[j] = 1; ST.t[j] = 0; ST.lost[j] = saw ? 0 : 1.5; ST.path[j] = null;
  ST.tx[j] = x; ST.ty[j] = y;
  if (saw) { ST.lkx = player.x; ST.lky = player.y; ST.lkT = runTime; }
  if (!was) {
    ST.icon[j] = 1.8; ST.iconK[j] = 2; ST.alerts++;
    if (eFireCD[j] < 0.6) eFireCD[j] = 0.6 + Math.random() * 0.5;   // reaction time before the first shot
    // a shout: allies in earshot learn roughly where you are
    noiseEmit(eX[j], eY[j], 92, "voice", 1, { px: player.x, py: player.y });
    if (typeof sfx === "function" && Math.hypot(eX[j] - player.x, eY[j] - player.y) < 600) sfx(520, 760, 0.07, "square", 0.05);
  }
}
// EOF part 1

/* --- 4. PERCEPTION ------------------------------------------------------------ */
// how visible is the hero right now (1 = normal)
function stHeroVisMul() {
  let m = 1;
  if (ST.sneak) m *= 0.55;
  if (Math.hypot(player.vx || 0, player.vy || 0) < 8) m *= 0.8;
  if (player.cloakT > 0 || player.invisT > 0) m *= 0.15;                         // Predator cloak, invisibility cloak
  if (typeof visionStealthMul === "function") m *= visionStealthMul();
  if (cityBuildingAt(player.x, player.y)) m *= 0.85;                               // indoors, out of the light
  m *= 1 - (CITY.theme.dark || 0) * 0.35;
  if (runTime - ST.shotT < 1.2 && !ST.suppressed) m *= 1.6;                        // muzzle flash
  return m;
}
function stLook(j, el) {
  const dx = player.x - eX[j], dy = player.y - eY[j], d = Math.hypot(dx, dy), alert = ST.state[j] === ST_ALERT;
  const range = (alert ? 780 : 560) * ST.visMul;
  let sees = false;
  if (d < range) {
    const diff = Math.abs(Math.atan2(Math.sin(Math.atan2(dy, dx) - ST.face[j]), Math.cos(Math.atan2(dy, dx) - ST.face[j])));
    const fov = alert ? Math.PI : (d < 70 ? Math.PI : (ST.state[j] === ST_SEARCH || ST.state[j] === ST_INVEST ? 1.25 : 1.0));
    if (diff <= fov && cityLOS(eX[j], eY[j], player.x, player.y)) sees = true;
  }
  if (sees) {
    if (alert) { ST.lost[j] = 0; ST.tx[j] = player.x; ST.ty[j] = player.y; ST.lkx = player.x; ST.lky = player.y; ST.lkT = runTime; return true; }
    const k = 1 - d / range, rate = 0.3 + 2.6 * k * k + (d < 90 ? 3 : 0);
    ST.sus[j] += rate * el;
    ST.face[j] = Math.atan2(dy, dx) * 0.25 + ST.face[j] * 0.75;
    if (ST.sus[j] >= 1) stAlert(j, player.x, player.y, true);
    else if (ST.sus[j] > 0.38 && ST.state[j] !== ST_INVEST) { ST.state[j] = ST_INVEST; ST.t[j] = 0; ST.tx[j] = player.x; ST.ty[j] = player.y; ST.urg[j] = 0; ST.path[j] = null; ST.icon[j] = 1.4; ST.iconK[j] = 1; }
    return true;
  }
  if (!alert) ST.sus[j] = Math.max(0, ST.sus[j] - el * (ST.state[j] === ST_INVEST || ST.state[j] === ST_SEARCH ? 0.04 : 0.12));
  return false;
}

/* --- 5. PATHFINDING (A* on a walkability snapshot) -------------------------------- */
const PF = { cap: 0, walk: null, g: null, came: null, st: null, heap: null, hf: null };
function pfEnsure(n) {
  if (PF.cap >= n) return;
  PF.cap = n; PF.walk = new Uint8Array(n); PF.g = new Float32Array(n); PF.came = new Int32Array(n); PF.st = new Uint8Array(n); PF.heap = new Int32Array(n); PF.hf = new Float32Array(n);
}
function stFindPath(sx, sy, tx, ty) {
  let s0x = cityTX(sx), s0y = cityTY(sy), t0x = cityTX(tx), t0y = cityTY(ty);
  // long trips: aim at an intermediate point ~110 m along the way
  const dtx = t0x - s0x, dty = t0y - s0y, dl = Math.hypot(dtx, dty);
  if (dl > 220) { t0x = s0x + Math.round(dtx / dl * 220); t0y = s0y + Math.round(dty / dl * 220); }
  const pad = 24, x0 = Math.min(s0x, t0x) - pad, y0 = Math.min(s0y, t0y) - pad, x1 = Math.max(s0x, t0x) + pad, y1 = Math.max(s0y, t0y) + pad;
  const Wd = x1 - x0 + 1, Hd = y1 - y0 + 1, N = Wd * Hd;
  pfEnsure(N);
  const walk = PF.walk, g = PF.g, came = PF.came, st = PF.st, heap = PF.heap, hf = PF.hf;
  // snapshot (read chunk arrays directly)
  for (let yy = 0; yy < Hd; yy++) {
    const wy = y0 + yy;
    for (let xx = 0; xx < Wd; xx++) {
      const wx = x0 + xx;
      const f = (wx < 0 || wy < 0) ? F_MOVE : cityFlagsT(wx, wy);
      walk[yy * Wd + xx] = (f & F_MOVE) ? 0 : 1;
    }
  }
  st.fill(0, 0, N);
  const S = (s0y - y0) * Wd + (s0x - x0), T = (t0y - y0) * Wd + (t0x - x0);
  walk[S] = 1;
  if (!walk[T]) {   // target inside furniture / wall: nearest walkable neighbour
    let best = -1, bd = 1e9;
    for (let r = 1; r < 6 && best < 0; r++) for (let oy = -r; oy <= r; oy++) for (let ox = -r; ox <= r; ox++) { const xx = t0x - x0 + ox, yy = t0y - y0 + oy; if (xx < 0 || yy < 0 || xx >= Wd || yy >= Hd) continue; const k = yy * Wd + xx; if (walk[k] && ox * ox + oy * oy < bd) { bd = ox * ox + oy * oy; best = k; } }
    if (best < 0) return null;
    t0x = x0 + best % Wd; t0y = y0 + Math.floor(best / Wd);
  }
  const Tn = (t0y - y0) * Wd + (t0x - x0);
  const H = k => { const ax = Math.abs(k % Wd - (t0x - x0)), ay = Math.abs(Math.floor(k / Wd) - (t0y - y0)); return (ax + ay) + (1.4142 - 2) * Math.min(ax, ay); };
  let hn = 0;
  const push = (k, f) => { let i = hn++; while (i > 0) { const p = (i - 1) >> 1; if (hf[p] <= f) break; heap[i] = heap[p]; hf[i] = hf[p]; i = p; } heap[i] = k; hf[i] = f; };
  const pop = () => { const top = heap[0]; const lk = heap[--hn], lf = hf[hn]; let i = 0; for (;;) { let c = 2 * i + 1; if (c >= hn) break; if (c + 1 < hn && hf[c + 1] < hf[c]) c++; if (hf[c] >= lf) break; heap[i] = heap[c]; hf[i] = hf[c]; i = c; } heap[i] = lk; hf[i] = lf; return top; };
  g[S] = 0; came[S] = -1; st[S] = 1; push(S, H(S));
  let bestK = S, bestH = H(S), exp = 0, found = false;
  const DX = [1, -1, 0, 0, 1, 1, -1, -1], DY = [0, 0, 1, -1, 1, -1, 1, -1];
  while (hn > 0 && exp < 6500) {
    const k = pop();
    if (st[k] === 2) continue;
    st[k] = 2; exp++;
    if (k === Tn) { found = true; bestK = k; break; }
    const hk = H(k); if (hk < bestH) { bestH = hk; bestK = k; }
    const kx = k % Wd, ky = (k - kx) / Wd;
    for (let d = 0; d < 8; d++) {
      const nx = kx + DX[d], ny = ky + DY[d];
      if (nx < 0 || ny < 0 || nx >= Wd || ny >= Hd) continue;
      const n = ny * Wd + nx;
      if (!walk[n] || st[n] === 2) continue;
      if (d >= 4 && (!walk[ky * Wd + nx] || !walk[ny * Wd + kx])) continue;   // no corner cutting
      // keep a little clearance from walls (prefer tile centres away from walls)
      let pen = 0; if (!walk[n + 1 < N ? n + 1 : n] || !walk[n - 1 >= 0 ? n - 1 : n]) pen += 0.35; if (!walk[n + Wd < N ? n + Wd : n] || !walk[n - Wd >= 0 ? n - Wd : n]) pen += 0.35;
      const ng = g[k] + (d >= 4 ? 1.4142 : 1) + pen;
      if (st[n] === 1 && ng >= g[n]) continue;
      g[n] = ng; came[n] = k; st[n] = 1; push(n, ng + H(n) * 1.05);
    }
  }
  // rebuild
  const out = [];
  for (let k = bestK, guard = 0; k >= 0 && guard < 4000; k = came[k], guard++) out.push(k);
  out.reverse();
  if (out.length < 2) return null;
  const pts = [];
  // string-pulling: keep a point only when the straight walk to the next anchor is blocked
  let a = 0;
  while (a < out.length - 1) {
    let b = Math.min(out.length - 1, a + 14);
    for (; b > a + 1; b--) if (pfClear(out[a], out[b], Wd, walk)) break;
    const k = out[b];
    pts.push([(x0 + k % Wd) * 16 + 8 - CITY.orx, (y0 + Math.floor(k / Wd)) * 16 + 8 - CITY.ory]);
    a = b;
  }
  return { pts, k: 0, tx, ty, found, t: runTime };
}
function pfClear(a, b, Wd, walk) {   // supercover line on the snapshot
  let x0 = a % Wd, y0 = (a - x0) / Wd; const x1 = b % Wd, y1 = (b - x1) / Wd;
  const dx = Math.abs(x1 - x0), dy = Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
  let err = dx - dy;
  for (let n = 0; n < 60; n++) {
    if (!walk[y0 * Wd + x0]) return false;
    if (x0 === x1 && y0 === y1) return true;
    const e2 = 2 * err;
    if (e2 > -dy && e2 < dx) { if (!walk[y0 * Wd + x0 + sx] || !walk[(y0 + sy) * Wd + x0]) return false; }
    if (e2 > -dy) { err -= dy; x0 += sx; }
    if (e2 < dx) { err += dx; y0 += sy; }
  }
  return false;
}
function stClearLine(x0, y0, x1, y1, r) {
  if (cityRay(x0, y0, x1, y1, F_MOVE, 160).hit) return false;
  const a = Math.atan2(y1 - y0, x1 - x0), px = -Math.sin(a) * r, py = Math.cos(a) * r;
  return !cityRay(x0 + px, y0 + py, x1 + px, y1 + py, F_MOVE, 160).hit && !cityRay(x0 - px, y0 - py, x1 - px, y1 - py, F_MOVE, 160).hit;
}

/* --- 6. MOVEMENT ---------------------------------------------------------------- */
function stMove(j, tx, ty, spd, dt) {
  const r = eType[j] === 99 ? 13 : (eType[j] === 3 ? 10 : 8);
  let gx = tx, gy = ty;
  const far = Math.abs(tx - eX[j]) + Math.abs(ty - eY[j]);
  if (far > 30 && !stClearLine(eX[j], eY[j], tx, ty, r * 0.8)) {
    let P = ST.path[j];
    if ((!P || Math.hypot(P.tx - tx, P.ty - ty) > 56 || ST.stuck[j] > 1.0 || (P.k >= P.pts.length && !P.found)) && ST.pathBudget > 0) {
      ST.pathBudget--; P = ST.path[j] = stFindPath(eX[j], eY[j], tx, ty); ST.stuck[j] = 0;
    }
    if (P && P.k < P.pts.length) {
      let w = P.pts[P.k];
      if (Math.hypot(w[0] - eX[j], w[1] - eY[j]) < 12 && P.k < P.pts.length - 1) { P.k++; w = P.pts[P.k]; }
      else if (Math.hypot(w[0] - eX[j], w[1] - eY[j]) < 12) P.k++;
      gx = w[0]; gy = w[1];
    }
  } else if (ST.path[j] && far <= 30) ST.path[j] = null;
  const a = Math.atan2(gy - eY[j], gx - eX[j]);
  let diff = a - ST.face[j]; diff = Math.atan2(Math.sin(diff), Math.cos(diff));
  ST.face[j] += diff * Math.min(1, dt * 9);
  const step = Math.min(spd * dt, Math.hypot(gx - eX[j], gy - eY[j]));
  const nx = eX[j] + Math.cos(a) * step, ny = eY[j] + Math.sin(a) * step;
  const q = cityResolve(nx, ny, r, false);
  const mv = Math.hypot(q[0] - eX[j], q[1] - eY[j]);
  ST.stuck[j] = (step > 0.5 && mv < step * 0.3) ? ST.stuck[j] + dt : Math.max(0, ST.stuck[j] - dt);
  if (ST.stuck[j] > 2.2) {   // wedged: hop sideways
    const s = (j & 1 ? 1 : -1) * 10, q2 = cityResolve(eX[j] - Math.sin(a) * s, eY[j] + Math.cos(a) * s, r, false);
    q[0] = q2[0]; q[1] = q2[1]; ST.stuck[j] = 0.8; ST.path[j] = null;
  }
  eVX[j] = (q[0] - eX[j]) / Math.max(1e-4, dt); eVY[j] = (q[1] - eY[j]) / Math.max(1e-4, dt);
  eX[j] = q[0]; eY[j] = q[1];
  if (((j + ST.frame) & 3) === 0) {   // open doors in front
    const fx = eX[j] + Math.cos(a) * 14, fy = eY[j] + Math.sin(a) * 14;
    if (cityFlagsAt(fx, fy) & F_DOOR) cityDoorRequest(fx, fy);
  }
  return mv;
}
function stRandomNear(x, y, rad, indoorOk) {
  for (let k = 0; k < 10; k++) {
    const a = Math.random() * 6.283, d = rad * (0.3 + Math.random() * 0.7), px = x + Math.cos(a) * d, py = y + Math.sin(a) * d;
    const f = cityFlagsAt(px, py);
    if (f & F_MOVE) continue;
    if (!indoorOk && (f & F_IN)) continue;
    if (!cityCircleBlocked(px, py, 8, false)) return [px, py];
  }
  return [x, y];
}

/* --- 7. THE AI STEP (called from sim.js in city mode) ------------------------------
   returns 1 = fully handled (skip classic contact code) · 2 = moved, run contact checks */
function stealthEnemyStep(j, dt) {
  const s0 = ST.state[j];
  ST.t[j] += dt; if (ST.icon[j] > 0) ST.icon[j] -= dt;
  ST.look[j] += dt;
  const dP = Math.hypot(player.x - eX[j], player.y - eY[j]);
  // far enemies think less often
  const lookEvery = dP < 700 ? 0.12 : 0.4;
  let sees = false;
  if (ST.look[j] >= lookEvery) { sees = stLook(j, ST.look[j]); ST.look[j] = 0; }
  else if (s0 === ST_ALERT) sees = ST.lost[j] < 0.3;
  if (ST.wait[j] > 0) { ST.wait[j] -= dt; if (s0 !== ST_ALERT) return 1; }
  const base = eSpd[j] * (eSlow[j] > 0 ? Math.max(0.25, 1 - (player.slow || 0)) : 1) * (eLegsLost[j] >= 2 ? 0.28 : eLegsLost[j] === 1 ? 0.58 : 1);
  switch (ST.state[j]) {
    case ST_IDLE: {
      ST.face[j] += Math.sin(runTime * 0.7 + j) * dt * 0.6;
      if (ST.t[j] > 7 + (j % 7)) {   // stretch the legs
        ST.t[j] = 0;
        const q = stRandomNear(ST.hx[j], ST.hy[j], 60, true); ST.tx[j] = q[0]; ST.ty[j] = q[1]; ST.state[j] = ST_RETURN;
      }
      return 1;
    }
    case ST_PATROL: {
      const R = ST.route[j];
      if (!R || !R.length) { if (ST.t[j] > 6 || Math.hypot(ST.tx[j] - eX[j], ST.ty[j] - eY[j]) < 14) { ST.t[j] = 0; const q = stRandomNear(ST.hx[j], ST.hy[j], 420, false); ST.tx[j] = q[0]; ST.ty[j] = q[1]; } }
      else { const w = R[ST.rk[j] % R.length]; ST.tx[j] = w[0]; ST.ty[j] = w[1]; if (Math.hypot(w[0] - eX[j], w[1] - eY[j]) < 16) { ST.rk[j]++; ST.wait[j] = 1 + Math.random() * 2; } }
      stMove(j, ST.tx[j], ST.ty[j], base * 0.48, dt);
      return 1;
    }
    case ST_INVEST: {
      const d = Math.hypot(ST.tx[j] - eX[j], ST.ty[j] - eY[j]);
      if (d < 22 || ST.t[j] > 100) { ST.state[j] = ST_SEARCH; ST.t[j] = 0; ST.wait[j] = 0.8; ST.path[j] = null; return 1; }
      stMove(j, ST.tx[j], ST.ty[j], base * (ST.urg[j] ? 1.0 : 0.62), dt);
      return 1;
    }
    case ST_SEARCH: {
      if (ST.t[j] > 9 + (j % 4)) { ST.state[j] = ST_RETURN; ST.t[j] = 0; ST.tx[j] = ST.hx[j]; ST.ty[j] = ST.hy[j]; ST.path[j] = null; ST.sus[j] *= 0.5; return 1; }
      if (!ST.path[j] || Math.hypot(ST.path[j].tx - eX[j], ST.path[j].ty - eY[j]) < 16 || ST.stuck[j] > 0.8) {
        const q = stRandomNear(ST.tx[j], ST.ty[j], 150, true); ST.path[j] = { pts: [q], k: 0, tx: q[0], ty: q[1], found: true, t: runTime };
      }
      const P = ST.path[j]; stMove(j, P.tx, P.ty, base * 0.45, dt);
      ST.face[j] += Math.sin(runTime * 2.1 + j) * dt * 1.2;
      return 1;
    }
    case ST_RETURN: {
      if (Math.hypot(ST.tx[j] - eX[j], ST.ty[j] - eY[j]) < 16 || ST.t[j] > 40) { ST.state[j] = ST.route[j] ? ST_PATROL : ST_IDLE; ST.t[j] = 0; ST.path[j] = null; return 1; }
      stMove(j, ST.tx[j], ST.ty[j], base * 0.45, dt);
      return 1;
    }
    case ST_ALERT: default: {
      if (!sees) ST.lost[j] += dt;
      if (ST.city[j] === 0) { ST.tx[j] = player.x; ST.ty[j] = player.y; ST.lost[j] = 0; }   // rivals / titans / hunters track you
      if (ST.lost[j] > 7) { ST.state[j] = ST_SEARCH; ST.t[j] = 0; ST.tx[j] = ST.lkx; ST.ty[j] = ST.lky; ST.path[j] = null; return 1; }
      const ranged = ST.ranged[j] || eType[j] === 3 || eType[j] >= 98;
      if (ranged && sees && dP < 330 && dP > 70) {
        // hold position, strafe a little, shoot
        const a = Math.atan2(player.y - eY[j], player.x - eX[j]);
        ST.face[j] = a;
        const sx = -Math.sin(a) * Math.sin(runTime * 1.3 + j) * base * 0.35 * dt, sy = Math.cos(a) * Math.sin(runTime * 1.3 + j) * base * 0.35 * dt;
        const q = cityResolve(eX[j] + sx, eY[j] + sy, 8, false); eX[j] = q[0]; eY[j] = q[1]; eVX[j] = sx / dt; eVY[j] = sy / dt;
        stShoot(j, dt, a);
      } else stMove(j, ST.tx[j], ST.ty[j], base, dt);
      return 2;
    }
  }
}
function stShoot(j, dt, a) {
  if (eArmsLost[j] >= 2) return;
  eFireCD[j] -= dt;
  if (eFireCD[j] > 0) return;
  const heavy = eType[j] === 3 || eType[j] >= 98;
  eFireCD[j] = heavy ? (eType[j] >= 98 ? 1.15 : 2.1) : 2.4 + Math.random() * 1.4;
  const dm = (player.diff && typeof player.diff.hpMul === "number") ? player.diff.hpMul : 1;
  const spread = (Math.random() - 0.5) * (ST.sneak ? 0.3 : 0.18);
  const wpn = eRivalCid[j] >= 0 ? eRivalCid[j] : (typeof enemyWeaponId === "function" ? enemyWeaponId(j) : 2);
  ST.flash[j] = 0.09;
  spawnProj(eX[j], eY[j], Math.cos(a + spread) * 225, Math.sin(a + spread) * 225, (heavy ? 11 : 6.5) * dm, 1.8, 5, 0, 4, 0, 1, wpn);
  noiseEmit(eX[j], eY[j], 140, "enemyfire", 1);
}
// EOF part 2

/* --- 8. THE DIRECTOR: populate the city around the hero --------------------------- */
const ST_ACT_R = 4200, ST_DESPAWN_R = 6600, ST_CAP = 90;
function stealthOnAlloc(j) {
  ST.state[j] = ST_ALERT; ST.city[j] = 0; ST.sus[j] = 1; ST.urg[j] = 1; ST.lost[j] = 0; ST.look[j] = Math.random() * 0.1;
  ST.icon[j] = 0; ST.stuck[j] = 0; ST.wait[j] = 0; ST.sid[j] = null; ST.path[j] = null; ST.route[j] = null; ST.rk[j] = 0;
  ST.face[j] = Math.random() * 6.28; ST.hx[j] = eX[j]; ST.hy[j] = eY[j]; ST.tx[j] = eX[j]; ST.ty[j] = eY[j]; ST.t[j] = 0;
  ST.ranged[j] = typeof enemyIsRanged === "function" ? (enemyIsRanged(eType[j]) ? 1 : 0) : (eType[j] === 3 ? 1 : 0);
}
function stCityEnemy(lx, ly, type, hpMul, state) {
  const j = allocEnemySlot(lx, ly, type, hpMul, 0, -1);
  if (j < 0) return -1;
  ST.city[j] = 1; ST.state[j] = state; ST.sus[j] = 0; ST.urg[j] = 0; ST.lost[j] = 99; ST.hx[j] = eX[j]; ST.hy[j] = eY[j];
  eFireCD[j] = 1 + Math.random();
  return j;
}
function stPickType(heavyP) {
  const r = Math.random();
  if (r < (heavyP === undefined ? 0.12 : heavyP)) return 3;
  return r < 0.72 ? 0 : (r < 0.87 ? 1 : 2);
}
function stSpawnGroup(s, S) {
  let n = S.left;
  const B = s.B, b = s.bkey ? B.blds.find(q => q.key === s.bkey) : null;
  let G = null, rooms = null;
  if (b) { G = cityInterior(b); rooms = G.spawnRooms.length ? G.spawnRooms.map(i => G.rooms[i]).filter(Boolean) : G.rooms; if (!rooms.length) rooms = G.rooms; }
  for (let k = 0; k < n; k++) {
    let tx = 0, ty = 0, ok = false;
    for (let tries = 0; tries < 12 && !ok; tries++) {
      if (b && rooms.length) { const rm = rooms[Math.floor(Math.random() * rooms.length)]; tx = b.x + rm.x + Math.floor(Math.random() * rm.w); ty = b.y + rm.y + Math.floor(Math.random() * rm.h); }
      else if (s.pts) { const p = s.pts[k % s.pts.length]; tx = Math.round(p[0] + (Math.random() - 0.5) * 6); ty = Math.round(p[1] + (Math.random() - 0.5) * 6); }
      else { tx = Math.round((s.x || s.ax) + (Math.random() - 0.5) * 8); ty = Math.round((s.y || s.ay) + (Math.random() - 0.5) * 8); }
      const f = cityFlagsT(tx, ty);
      ok = !(f & F_MOVE) && !cityCircleBlocked(tx * 16 + 8 - CITY.orx, ty * 16 + 8 - CITY.ory, 8, false);
    }
    if (!ok) continue;
    const lx = tx * 16 + 8 - CITY.orx, ly = ty * 16 + 8 - CITY.ory;
    const j = stCityEnemy(lx, ly, stPickType(s.heavy), s.elite ? 1.35 : 1, s.kind === "patrol" ? ST_PATROL : ST_IDLE);
    if (j < 0) break;
    ST.sid[j] = s.id; S.live++;
    if (s.kind === "patrol") ST.route[j] = s.pts ? s.pts.map(p => [p[0] * 16 + 8 - CITY.orx, p[1] * 16 + 8 - CITY.ory]) : null;
    if (s.kind === "guard") ST.face[j] = Math.atan2(ly - (b ? (b.y + b.h / 2) * 16 - CITY.ory : ly - 1), lx - (b ? (b.x + b.w / 2) * 16 - CITY.orx : lx));
  }
}
function stDirector(dt) {
  ST.dirT -= dt;
  if (ST.dirT > 0) return;
  ST.dirT = 0.4;
  const pwx = player.x + CITY.orx, pwy = player.y + CITY.ory, pcx = Math.floor(pwx / 2048), pcy = Math.floor(pwy / 2048);
  let live = 0;
  for (let j = 0; j < MAX_E; j++) if (eAct[j] && ST.city[j]) live++;
  let built = 0;
  for (let r = 0; r <= 2; r++) for (let cy = pcy - r; cy <= pcy + r; cy++) for (let cx = pcx - r; cx <= pcx + r; cx++) {
    if (Math.max(Math.abs(cx - pcx), Math.abs(cy - pcy)) !== r) continue;
    let C = cityRT.chunks.get(cx * 4096 + cy);
    if (!C) { if (built >= 1) continue; C = cityChunk(cx, cy); built++; }
    for (const s of C.spawns) {
      if (live >= ST_CAP) return;
      const ax = s.ax * 16, ay = s.ay * 16, d = Math.hypot(ax - pwx, ay - pwy);
      if (d > ST_ACT_R) continue;
      let S = cityRT.spawnState.get(s.id);
      if (!S) { S = { left: s.n, live: 0 }; cityRT.spawnState.set(s.id, S); }
      if (S.live > 0 || S.left <= 0) continue;
      if (s.kind !== "room" && d < 1100 && cityVisibleAt(ax - CITY.orx, ay - CITY.ory)) continue;   // never pop into view
      stSpawnGroup(s, S); live += S.live;
    }
  }
  for (let j = 0; j < MAX_E; j++) {
    if (!eAct[j] || !ST.city[j] || ST.state[j] === ST_ALERT) continue;
    if (Math.hypot(eX[j] - player.x, eY[j] - player.y) > ST_DESPAWN_R) stDespawn(j);
  }
}
function stDespawn(j) {
  const S = ST.sid[j] ? cityRT.spawnState.get(ST.sid[j]) : null;
  if (S) S.live = Math.max(0, S.live - 1);
  eAct[j] = 0; ST.sid[j] = null; ST.city[j] = 0;
}
function stOnKill(idx, ex, ey, et, isEcho) {
  if (!CITY.on) return;
  const S = ST.sid[idx] ? cityRT.spawnState.get(ST.sid[idx]) : null;
  if (S) { S.left = Math.max(0, S.left - 1); S.live = Math.max(0, S.live - 1); }
  const quiet = ST.state[idx] !== ST_ALERT;
  ST.sid[idx] = null; ST.city[idx] = 0;
  noiseEmit(ex, ey, quiet ? 56 : 80, "death", 2);
  if (typeof cityDecal === "function") cityDecal(ex, ey, "blood", Math.random() * 6.28, typeof enemyBloodCol === "function" ? enemyBloodCol(idx) : null);
  // fewer, harder fights than the arena: kills are worth more
  if (!isEcho && typeof spawnOrb === "function" && et < 98) spawnOrb(ex + 4, ey - 3, (3.5 + waveNum * 0.55) * 1.3);
}
// distant enemies converge on loud noises (they are not simulated until they enter the active radius)
function stResponders(x, y, L0) {
  if (runTime - ST.respT < 5) return;
  const inside = cityBuildingAt(x, y);
  const Rm = Math.min(1600, stOpenRange(L0 - (inside ? 28 : 0), ST_L.investigate));
  if (Rm < 150) return;
  ST.respT = runTime;
  const [wxm, wym] = cityWorldM(player.x, player.y), cls = cityMacroClass(Math.floor(wxm / 1000), Math.floor(wym / 1000));
  const dens = [0.35, 0.5, 1.0, 1.25, 1.5, 0.9, 0.2, 0.25][cls] || 0.5;
  let live = 0; for (let j = 0; j < MAX_E; j++) if (eAct[j] && ST.city[j]) live++;
  const n = Math.min(ST_CAP + 14 - live, Math.round(Math.min(1, (Rm - 150) / 450) * 4.5 * dens + Math.random()));
  for (let k = 0; k < n; k++) {
    const a = Math.random() * 6.283, d = 3500 + Math.random() * 900;
    const q = cityFindWalkable(player.x + Math.cos(a) * d, player.y + Math.sin(a) * d, 360, true);
    if (Math.hypot(q[0] - player.x, q[1] - player.y) < 2600 || cityVisibleAt(q[0], q[1])) continue;
    const j = stCityEnemy(q[0], q[1], stPickType(0.14), 1, ST_INVEST);
    if (j < 0) break;
    ST.tx[j] = x + (Math.random() - 0.5) * 300; ST.ty[j] = y + (Math.random() - 0.5) * 300; ST.urg[j] = 1; ST.sus[j] = 0.5;
  }
  if (n > 0 && runTime - ST.msgT > 12) { ST.msgT = runTime; if (typeof spawnSpeech === "function") spawnSpeech(player.x, player.y - 30, "THAT WAS LOUD — THEY'RE COMING", "#ffab40", 2.2); }
}
function stHunters(dt) {
  ST.hunterT -= dt * (typeof threatMult === "function" ? threatMult() : 1);
  if (ST.hunterT > 0) return;
  ST.hunterT = Math.max(38, 85 - waveNum * 3) + Math.random() * 25;
  const n = 2 + Math.min(3, Math.floor(waveNum / 3)) + (Math.random() < 0.4 ? 1 : 0);
  const a0 = Math.random() * 6.283;
  for (let k = 0; k < n; k++) {
    const a = a0 + (Math.random() - 0.5) * 0.4, d = 3000 + Math.random() * 700;
    const q = cityFindWalkable(player.x + Math.cos(a) * d, player.y + Math.sin(a) * d, 360, true);
    if (cityVisibleAt(q[0], q[1])) continue;
    const j = stCityEnemy(q[0], q[1], k === 0 && waveNum > 3 ? 3 : stPickType(0.1), 1.1, ST_INVEST);
    if (j < 0) break;
    ST.tx[j] = player.x + (Math.random() - 0.5) * 900; ST.ty[j] = player.y + (Math.random() - 0.5) * 900; ST.urg[j] = 0;
  }
}

/* --- 9. RUN HOOKS ---------------------------------------------------------------- */
function stealthRunStart(p) {
  ST.state.fill(0); ST.city.fill(0); ST.sus.fill(0); ST.icon.fill(0); ST.sid.fill(null); ST.path.fill(null); ST.route.fill(null);
  ST.noises.length = 0; ST.lkT = -99; ST.hunterT = 70; ST.respT = -99; ST.alerts = 0; ST.ring = null; ST.shotT = -99; ST.msgT = -99;
  ST.suppressed = false; ST.dirT = 0; ST.frame = 0;
}
function stealthStep(dt) {
  if (!CITY.on || !player) return;
  ST.frame++; ST.pathBudget = 3;
  for (let j = 0; j < MAX_E; j++) if (ST.flash[j] > 0) ST.flash[j] -= dt;
  ST.sneak = !!(keys.ShiftLeft || keys.ShiftRight || ST.touchSneak);
  ST.visMul = stHeroVisMul();
  stDirector(dt);
  stHunters(dt);
  const sp = Math.hypot(player.vx || 0, player.vy || 0);
  if (sp > 12 && !player.flying) {
    ST.stepT -= dt;
    if (ST.stepT <= 0) { ST.stepT = ST.sneak ? 0.62 : 0.36; noiseEmit(player.x, player.y, ST.sneak ? 36 : (player.inVehicle ? 92 : (sp > 150 ? 66 : 58)), "step", 0); }
  }
  if (player.swordSwingTimer > 0 || player.saberAttackT > 0) { ST.meleeT -= dt; if (ST.meleeT <= 0) { ST.meleeT = 0.45; noiseEmit(player.x, player.y, 72, "melee", 0); } }
  let m = 0, al = 0;
  for (let j = 0; j < MAX_E; j++) if (eAct[j]) { if (ST.state[j] === ST_ALERT && (ST.lost[j] < 4 || !ST.city[j])) al++; else if (ST.sus[j] > m) m = ST.sus[j]; }
  ST.susMax = m; ST.hunted = al;
}
// weapons-free only with a hostile in sight & range; sneaking holds fire unless someone is hunting you (or point blank)
function cityHoldFire() {
  if (ST.hfFrame === ST.frame) return ST.hf;
  ST.hfFrame = ST.frame;
  let hold = true;
  for (let j = 0; j < MAX_E && hold; j++) {
    if (!eAct[j] || eDummy[j] || (allyCount > 0 && allyIs(j))) continue;
    const dx = eX[j] - player.x, dy = eY[j] - player.y, d2 = dx * dx + dy * dy;
    if (d2 > 440 * 440) continue;
    if (ST.sneak && ST.state[j] !== ST_ALERT && d2 > 95 * 95) continue;
    if (cityVisibleAt(eX[j], eY[j])) hold = false;
  }
  return (ST.hf = hold);
}
function stealthOnPlayerShot(x, y, vx, vy, style, wpnId) {
  if (runTime - ST.shotT < 0.14) return;
  ST.shotT = runTime;
  const p = stHeroProfile(wpnId);
  let L0 = p[0];
  if (ST.suppressed && p[2]) L0 = 118;
  if (style === 2) L0 = Math.max(L0, 132);   // rocket launch
  ST.lastShotL = L0;
  const inside = cityBuildingAt(x, y);
  ST.ring = { x, y, t: runTime, L0, r: stOpenRange(L0 - (inside ? 26 : 0), ST_L.investigate) };
  noiseEmit(x, y, L0, p[1] === "g" ? "gunshot" : "shot", 0);
}
function stealthToggleSuppressor() {
  if (!CITY.on || !player) return;
  const p = stHeroProfile(player.cid);
  if (p[1] !== "g") { spawnSpeech(player.x, player.y - 26, p[1] === "x" ? "BLADES ARE ALREADY QUIET" : "NOTHING TO SUPPRESS ON THIS WEAPON", "#90a4ae", 1.6); return; }
  if (!p[2]) { spawnSpeech(player.x, player.y - 26, "CAN'T SUPPRESS " + (ST_NOSUP_WHY[player.cid] || "THIS WEAPON").toUpperCase(), "#ff8a65", 1.8); return; }
  ST.suppressed = !ST.suppressed;
  spawnSpeech(player.x, player.y - 26, ST.suppressed ? "SUPPRESSOR ON" : "SUPPRESSOR OFF", ST.suppressed ? "#80cbc4" : "#ffcc80", 1.4);
  if (typeof sfx === "function") sfx(ST.suppressed ? 900 : 600, ST.suppressed ? 1300 : 400, 0.06, "square", 0.06);
}
window.addEventListener("keydown", e => {
  if (e.repeat || !runActive || runPaused) return;
  if (e.code === "KeyV") stealthToggleSuppressor();
});
// melee on an unaware enemy = silent takedown
(function () {
  const _bh = window.bladeHitEnemy;
  if (typeof _bh !== "function") return;
  window.bladeHitEnemy = function (j, cx, cy, w, ang, glow, hm) {
    if (CITY.on && eAct[j] && ST.state[j] !== ST_ALERT && eType[j] < 98 && !(typeof allyIs === "function" && allyCount > 0 && allyIs(j))) {
      eHP[j] = Math.min(eHP[j], 1);
      if (runTime - (ST.tdT || 0) > 1.2) { ST.tdT = runTime; spawnSpeech(eX[j], eY[j] - 22, "SILENT TAKEDOWN", "#b2ff59", 1.0); }
    }
    return _bh(j, cx, cy, w, ang, glow, hm);
  };
})();
// explosions are loud
(function () {
  const _bw = window.spawnBlastWave;
  if (typeof _bw !== "function") return;
  window.spawnBlastWave = function (x, y, maxRadius, color) { const r = _bw(x, y, maxRadius, color); if (CITY.on) noiseEmit(x, y, 150 + Math.min(28, (maxRadius || 68) * 0.2), "explosion", 0); return r; };
})();

/* --- 10. HUD: cones, ?/! icons, noise ring, edge arrows, status -------------------- */
function stealthRenderWorld(g) {
  if (!CITY.on || !player) return;
  for (let j = 0; j < MAX_E; j++) {
    if (!eAct[j] || eDummy[j] || (allyCount > 0 && allyIs(j))) continue;
    const dx = eX[j] - player.x, dy = eY[j] - player.y;
    if (dx * dx + dy * dy > 700 * 700 || !cityVisibleAt(eX[j], eY[j])) continue;
    const s = ST.state[j];
    if (s !== ST_ALERT && dx * dx + dy * dy < 480 * 480) {   // view-cone hint
      const sus = ST.sus[j], col = sus > 0.38 ? "255,193,7" : "255,255,255", a = 0.05 + sus * 0.14;
      const fov = s === ST_SEARCH || s === ST_INVEST ? 1.25 : 1.0, R = 70;
      const gr = g.createRadialGradient(eX[j], eY[j], 6, eX[j], eY[j], R);
      gr.addColorStop(0, "rgba(" + col + "," + (a * 1.6) + ")"); gr.addColorStop(1, "rgba(" + col + ",0)");
      g.fillStyle = gr; g.beginPath(); g.moveTo(eX[j], eY[j]); g.arc(eX[j], eY[j], R, ST.face[j] - fov, ST.face[j] + fov); g.closePath(); g.fill();
    }
    const showQ = (s === ST_INVEST || s === ST_SEARCH || ST.sus[j] > 0.3) && s !== ST_ALERT;
    if (ST.icon[j] > 0 || showQ) {
      const alertI = ST.iconK[j] === 2 && ST.icon[j] > 0, y = eY[j] - (eType[j] === 3 ? 30 : 24) - Math.sin(runTime * 6) * 1.5;
      g.save(); g.font = "900 15px 'Segoe UI', sans-serif"; g.textAlign = "center"; g.lineWidth = 3; g.strokeStyle = "rgba(0,0,0,0.75)";
      const txt = alertI ? "!" : "?"; g.fillStyle = alertI ? "#ff1744" : "#ffc400";
      if (!alertI && ST.sus[j] < 1) { g.globalAlpha = 0.45 + 0.55 * Math.min(1, ST.sus[j] / 0.6); }
      g.strokeText(txt, eX[j], y); g.fillText(txt, eX[j], y);
      g.restore();
    }
  }
  // noise ring: how far that shot carried
  const R = ST.ring;
  if (R && runTime - R.t < 0.75) {
    const k = (runTime - R.t) / 0.75, rad = Math.min(R.r * 32, 1400) * (0.25 + 0.75 * k);
    g.save(); g.strokeStyle = R.L0 <= 120 ? "rgba(128,203,196," + (0.45 * (1 - k)) + ")" : "rgba(255,138,101," + (0.55 * (1 - k)) + ")";
    g.lineWidth = 2; g.setLineDash([10, 8]); g.beginPath(); g.arc(R.x, R.y, rad, 0, 7); g.stroke(); g.restore();
  }
}
function stealthRenderScreen(g) {
  if (!CITY.on || !player || !runActive) return;
  const z = opts.zoom * ((typeof fxCamera === "function" && fxCamera()) ? fxCamera().zoom : 1);
  // edge arrows for hunters / suspicious enemies you cannot see
  for (let j = 0; j < MAX_E; j++) {
    if (!eAct[j] || eDummy[j] || (allyCount > 0 && allyIs(j))) continue;
    const s = ST.state[j], hot = s === ST_ALERT && ST.lost[j] < 4;
    if (!hot && ST.sus[j] < 0.35) continue;
    const sx = (eX[j] - player.x) * z + W / 2, sy = (eY[j] - player.y) * z + H / 2;
    const onScreen = sx > 20 && sy > 20 && sx < W - 20 && sy < H - 20;
    if (onScreen && cityVisibleAt(eX[j], eY[j])) continue;
    const d = Math.hypot(eX[j] - player.x, eY[j] - player.y);
    if (d > 2400) continue;
    const a = Math.atan2(sy - H / 2, sx - W / 2), mx = W / 2 - 46, my = H / 2 - 46, t = Math.min(mx / Math.abs(Math.cos(a) || 1e-6), my / Math.abs(Math.sin(a) || 1e-6));
    const ex = onScreen ? sx : W / 2 + Math.cos(a) * t, ey = onScreen ? sy : H / 2 + Math.sin(a) * t;
    g.save(); g.translate(ex, ey); g.rotate(a); g.globalAlpha = Math.max(0.35, 1 - d / 2400);
    g.fillStyle = hot ? "#ff1744" : "#ffc400"; g.beginPath(); g.moveTo(10, 0); g.lineTo(-6, -7); g.lineTo(-2, 0); g.lineTo(-6, 7); g.closePath(); g.fill();
    g.restore();
  }
  // status pill
  const hunted = ST.hunted > 0, sus = ST.susMax > 0.3;
  const label = hunted ? "◉ HUNTED · " + ST.hunted : sus ? "◉ SUSPICIOUS" : "◉ HIDDEN";
  const col = hunted ? "#ff5252" : sus ? "#ffc400" : "#69f0ae";
  const p = stHeroProfile(player.cid), tags = [];
  if (ST.sneak) tags.push("SNEAKING");
  if (typeof visionProfile === "function") tags.push("👁 " + visionProfile(player.cid)[3]);
  if (p[1] === "g") tags.push(p[2] ? (ST.suppressed ? "SUPPRESSED [V]" : "LOUD [V]") : "LOUD");
  else if (p[1] === "x") tags.push("BLADE · QUIET");
  const HL = typeof HUDL !== "undefined" && HUDL.enabled ? HUDL : null;   // v14.1: placed / scaled by the HUD layout manager
  if (HL && HL.stealthHidden) return;
  g.save(); const hs = HL ? HL.stealthS || 1 : 1;
  g.font = "800 " + (12 * hs).toFixed(1) + "px 'Segoe UI', sans-serif"; g.textAlign = "center";
  const txt = label + (tags.length ? "   " + tags.join(" · ") : ""), tw = g.measureText(txt).width + 22 * hs, y0 = HL && HL.stealthY != null ? HL.stealthY : H - 64;
  g.fillStyle = "rgba(6,10,16,0.62)"; crRR(g, W / 2 - tw / 2, y0, tw, 22 * hs, 11 * hs); g.fill();
  g.strokeStyle = col; g.lineWidth = 1; g.globalAlpha = 0.7; g.stroke(); g.globalAlpha = 1;
  g.fillStyle = col; g.fillText(txt, W / 2, y0 + 15.5 * hs);
  g.restore();
}
// EOF:js/stealth.js
