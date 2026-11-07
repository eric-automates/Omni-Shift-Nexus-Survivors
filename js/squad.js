// FILE: js/squad.js
// PART: v10 module 4 of 8
// DETAIL: v10 Squad Direct Command — quick-access radial order wheel (Hold Position / Focus Fire / Advance / Regroup) for
//         every summoned companion (necro swordsmen, hounds, bowmen, knights, bone golems) plus universe-themed rifle
//         fireteams (Tears of the Sun SEALs, Colonial Marines, 501st Clones, Earth's Defenders...) called in from radio beacons or
//         deployed with military heroes. Includes a vehicle co-gunner: while you drive, a soldier rides along on the gun.

"use strict";

/* === 1. EXTRA MINION STATE (pool = js/state.js mX/mY/...) === */
const mBurst = new Uint8Array(MAX_MINION), mAim = new Float32Array(MAX_MINION), mTeam = new Uint8Array(MAX_MINION),
      mSlot = new Uint8Array(MAX_MINION), mTag = new Float32Array(MAX_MINION);
const mName = new Array(MAX_MINION).fill("");
// Paths are disposable navigation hints, not save state.  A maximum of two
// searches per simulation step keeps a large fireteam from stalling a phone.
const squadNav = Array.from({ length: MAX_MINION }, () => ({ path: null, retry: 0, stuck: 0, lineT: 0, lineOK: true,
  lane: null, tLane: null, curbT: 0, curbD0: 0, forced: 0, laneT: 0, dashed: 0, dashT: 0,
  slotX: 0, slotY: 0, slotOK: 0, fmode: 0, swN: 0, swT: 0, pinT: 0,
  mid: null, midNext: 0 }));
let squadPathBudget = 0;
function squadNavReset(m) {
  const N = squadNav[m]; if (!N) return;
  N.path = null; N.retry = N.stuck = N.lineT = 0; N.warnT = -999;
  N.lane = N.tLane = null; N.curbT = N.curbD0 = N.forced = N.laneT = N.dashed = N.dashT = 0;
  N.slotX = N.slotY = N.slotOK = N.fmode = N.swN = N.swT = N.pinT = 0; N.mid = null; N.midNext = 0;
}
function squadRewindArrays() { return [mBurst, mAim, mTeam, mSlot, mTag]; }

// Soldier kinds 5-8 (0-4 are the original necro / transfiguration minions).
const SOLDIER_SPECS = {
  5: { role: "RIFLEMAN", min: 110, max: 220, cd: 0.62, burst: 3, gap: 0.085, dmg: 1.0, spd: 560, spread: 0.05, prc: 1 },
  6: { role: "MACHINE GUNNER", min: 100, max: 210, cd: 0.105, burst: 1, gap: 0, dmg: 0.42, spd: 520, spread: 0.13, prc: 1 },
  7: { role: "MARKSMAN", min: 200, max: 330, cd: 1.55, burst: 1, gap: 0, dmg: 3.4, spd: 820, spread: 0.008, prc: 4 },
  8: { role: "BREACHER", min: 30, max: 95, cd: 0.95, burst: 1, gap: 0, dmg: 0.55, spd: 380, spread: 0.32, prc: 1, pellets: 6 }
};
const FIRETEAM_THEMES = {
  seal:   { name: "Tears of the Sun SEAL Team", uni: "#3e5c2f", helm: "#2e3b24", accent: "#c5e1a5", names: ["Flea", "Red", "Lake", "Slo", "Zee"] },
  marine: { name: "USCM Colonial Marines", uni: "#556b2f", helm: "#4b5320", accent: "#ffd166", names: ["Hicks", "Vasquez", "Hudson", "Drake", "Apone"] },
  clone:  { name: "501st Clone Troopers", uni: "#eceff1", helm: "#eceff1", accent: "#1e88e5", names: ["Rex", "Fives", "Echo", "Jesse", "Kix"], bolt: true },
  sgc:    { name: "SG-3 Marine Detachment", uni: "#5d6d3a", helm: "#3e4a24", accent: "#00e5ff", names: ["Reynolds", "Ferretti", "Kawalsky", "Siler", "Walter"] },
  rim:    { name: "Browncoat Militia", uni: "#6d4c41", helm: "#4e342e", accent: "#ff9e00", names: ["Zoe", "Jayne", "Tracey", "Bendis", "Monty"] },
  fremen: { name: "Fremen Fedaykin", uni: "#8d6e63", helm: "#5d4037", accent: "#40c4ff", names: ["Stilgar", "Chani", "Jamis", "Korba", "Otheym"] },
  fleet:  { name: "Colonial Fleet Marines", uni: "#455a64", helm: "#263238", accent: "#3a86ff", names: ["Kelly", "Hotdog", "Racetrack", "Gaeta", "Tigh"] },
  mi:     { name: "Roughnecks Mobile Infantry", uni: "#78909c", helm: "#546e7a", accent: "#ffd166", names: ["Rico", "Dizzy", "Ace", "Sugar", "Zim"] },
  ki:     { name: "Earth's Defenders", uni: "#ff9100", helm: "#151515", accent: "#2962ff", names: ["Krillin", "Yamcha", "Tien", "Chiaotzu", "Yajirobe"], bolt: true },
  zion:   { name: "Zion Resistance Cell", uni: "#212121", helm: "#111111", accent: "#4cc9f0", names: ["Trinity", "Switch", "Apoc", "Mouse", "Tank"] },
  lambda: { name: "Lambda Resistance", uni: "#1565c0", helm: "#0d47a1", accent: "#ff6d00", names: ["Barney", "Alyx", "Vance", "Odessa", "Griggs"] },
  blue:   { name: "Blue Stripes Commandos", uni: "#283593", helm: "#1a237e", accent: "#4ea8de", names: ["Roche", "Ves", "Fenn", "Talar", "Varga"], bolt: true },
  order:  { name: "Order of the Phoenix", uni: "#4a148c", helm: "#311b92", accent: "#ffd166", names: ["Kingsley", "Tonks", "Moody", "Arthur", "Molly"], bolt: true }
};
const FACTION_FIRETEAM = ["clone", "sgc", "rim", "fremen", "fleet", "marine", "ki", "zion", "lambda", "blue", "order"];
const HERO_FIRETEAM = { 53: "seal", 28: "marine", 31: "mi", 8: "sgc", 2: "clone" };
const INNATE_SQUAD = { 53: 4, 28: 3, 31: 3, 8: 3, 2: 3 };   // military heroes deploy with a reinforcing fireteam

const SQUAD_ORDERS = [
  { id: 0, label: "REGROUP", icon: "↩", call: "ON ME! REGROUP!", reply: ["Moving to you!", "On your six!", "Falling in!"] },
  { id: 1, label: "HOLD POSITION", icon: "✋", call: "HOLD THIS POSITION!", reply: ["Holding!", "Digging in!", "Not one step back!"] },
  { id: 2, label: "FOCUS FIRE", icon: "🎯", call: "FOCUS FIRE ON THAT TARGET!", reply: ["Target marked!", "Weapons free on it!", "Lighting it up!"] },
  { id: 3, label: "ADVANCE", icon: "⬆", call: "MOVE UP! ADVANCE!", reply: ["Moving up!", "Pushing forward!", "Oorah!"] }
];
const squadState = { order: 0, ax: 0, ay: 0, focusIdx: -1, focusUid: 0, orderT: 0, wheelOpen: false, theme: "marine",
                     innateN: 0, reinforceT: 40, gunSfxT: 0, uiT: 0, alive: 0, soldiers: 0, coGunner: -1, hl: -1, formHeading: 0,
                     audT: 0, compress: 0, reformT: 0, lastOrder: -1 };

/* === 2. CALL-INS === */
function squadThemeKey() {
  if (!player) return "marine";
  return HERO_FIRETEAM[player.cid] || FACTION_FIRETEAM[player.hero ? player.hero[1] : 0] || "marine";
}

function squadSpawnSoldier(x, y, kind, k, life, th) {
  const hp = 150 + waveNum * 14, dmg = (13 + waveNum * 2.4) * (player.might || 1);
  const slot = spawnMinion(x, y, kind, hp, dmg, 128, life, th.uni);
  mTeam[slot] = 1; mSlot[slot] = k; mBurst[slot] = 0; mAim[slot] = player.aim || 0; mTag[slot] = 3.0;
  squadNavReset(slot);
  mName[slot] = th.names[k % th.names.length];
  return slot;
}

function squadCallFireteam(x, y, source = "beacon", count = 4, life = 75) {
  if (!player) return 0;
  const key = squadThemeKey(), th = FIRETEAM_THEMES[key];
  squadState.theme = key;
  const kinds = [5, 6, 7, 8];
  for (let k = 0; k < count; k++) {
    const ang = (k / count) * Math.PI * 2;
    squadSpawnSoldier(x + Math.cos(ang) * 18, y + Math.sin(ang) * 18, kinds[k % 4], k, life, th);
  }
  if (source !== "innate") {
    spawnSpeech(x, y - 20, "RADIO: " + th.name.toUpperCase() + " INBOUND!", th.accent, 2.6);
    if (typeof fxBanner === "function") fxBanner("FIRETEAM DEPLOYED", th.name + " · tap 📻 (or Q) for orders", th.accent, 2.4);
  }
  sfx(520, 260, 0.12, "square", 0.1);
  setTimeout(() => sfx(660, 990, 0.1, "triangle", 0.1), 140);
  squadState.uiT = 0;
  return count;
}

/* === 3. ORDERS === */
function squadPickFocus() {
  let best = -1, bestScore = -1;
  for (let i = 0; i < MAX_E; i++) {
    if (!eAct[i] || !isEnemyOnScreen(i) || (typeof sdIgnore === "function" && sdIgnore(i))) continue;
    const score = (eType[i] === 99 ? 1e7 : (eType[i] === 98 ? 1e6 : 0)) + eHP[i];
    if (score > bestScore) { bestScore = score; best = i; }
  }
  squadState.focusIdx = best; squadState.focusUid = best >= 0 ? eUid[best] : 0;
}

function squadIssueOrder(id) {
  if (!player) return;
  const S = squadState;
  S.order = id; S.orderT = 0; S.regroupT = id === 0 ? 2 : 0;
  if (id === 1) { S.ax = player.x; S.ay = player.y; }
  if (id === 2) squadPickFocus();
  const o = SQUAD_ORDERS[id];
  spawnSpeech(player.x, player.y - 22, o.call, "#ffd166", 1.6);
  for (let m = 0; m < MAX_MINION; m++) {
    if (mAct[m]) {
      mTag[m] = Math.max(mTag[m], 1.2);
      if (mTeam[m]) { spawnSpeech(mX[m], mY[m] - 14, (mName[m] ? mName[m] + ": " : "") + o.reply[(m + id) % o.reply.length], "#c5e1a5", 1.4); break; }
    }
  }
  sfx(1250, 880, 0.035, "square", 0.08);
  setTimeout(() => sfx(980, 1320, 0.03, "square", 0.06), 60);
  squadWheelClose();
  squadState.uiT = 0;
}

/* === 4. AI (replaces js/sim.js updateMinionsSim) === */
/* === 3b. CURB SENSE (15.4.x part1) — the foot squad reads the road -------------------
   The 15.4 plan asks for deliberate road crossings, no standing in live traffic, and
   above all "do not make followers incapable of following across a roadway". Every rule
   below is gated on TRF.on && CITY.on (a fireteam in arena/classic worlds pays nothing
   but one null check), consumes zero RNG (the pack's determinism is sacred) and never
   writes to the traffic engine. Combat movement passes `nocurb`: curb sense must not
   pause a firefight — the same principle 15.1 established for routine tickets.
   State lives only on squadNav[m] (disposable, cleared by squadNavReset like the paths).
   Fixture: qa/run1541_curb_sense.py · pack C118 · counters on window.SQCURB (QA only). */
function sqProbe(k, n) { const P = typeof window !== "undefined" ? window.SQCURB : null; if (P) P[k] = (P[k] | 0) + (n || 1); }
// nearest live link within `rad` px of a world-px point: band data in px units.
function sqLaneAt(wx, wy) {
  if (typeof TRF === "undefined" || !TRF.on || !TRF.net || !TRF.net.links) return null;
  const gx = (wx + CITY.orx) / 32, gy = (wy + CITY.ory) / 32, R = 170 / 32;
  let bL = null, bd = 1e9, bpx = 0, bpy = 0, bsx = 1, bsy = 0;
  for (const L of TRF.net.links) {
    let bb = L._sqbb;
    if (!bb) { const q = L.pts; let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9;
      for (let i = 0; i < q.length; i += 2) { if (q[i] < x0) x0 = q[i]; if (q[i] > x1) x1 = q[i]; if (q[i + 1] < y0) y0 = q[i + 1]; if (q[i + 1] > y1) y1 = q[i + 1]; }
      L._sqbb = bb = [x0, y0, x1, y1]; }
    if (gx < bb[0] - R || gx > bb[2] + R || gy < bb[1] - R || gy > bb[3] + R) continue;
    const q = L.pts;
    for (let i = 0; i + 3 < q.length; i += 2) {
      const ax = q[i], ay = q[i + 1], dx = q[i + 2] - ax, dy = q[i + 3] - ay, ll = dx * dx + dy * dy;
      let t = ll > 1e-9 ? ((gx - ax) * dx + (gy - ay) * dy) / ll : 0; t = t < 0 ? 0 : t > 1 ? 1 : t;
      const px = ax + dx * t, py = ay + dy * t, d = Math.hypot(gx - px, gy - py);
      if (d < bd) { bd = d; bL = L; bpx = px; bpy = py; const sl = Math.hypot(dx, dy) || 1; bsx = dx / sl; bsy = dy / sl; }
    }
  }
  if (!bL) return null;
  const hw = (bL.ow ? bL.w * 0.5 : bL.w * 0.25) * 32;   // drivable half-width in px (both carriageways share L.w)
  const d = bd * 32;
  return { t: runTime, L: bL, d: d, hw: hw, inside: d < hw + 6, cx: bpx * 32 - CITY.orx, cy: bpy * 32 - CITY.ory, sx: bsx, sy: bsy };
}
// any live car whose swept footprint would cover (wx,wy) within leadT seconds
function sqThreat(wx, wy, leadT) {
  const cars = (typeof TRF !== "undefined" && TRF.cars) || [];
  for (const c of cars) {
    if (!c || c.dead || !c.L) continue;
    const cx0 = c.x * 32 - CITY.orx, cy0 = c.y * 32 - CITY.ory;
    const spd = c.v * 32;
    if (spd < 6 && Math.hypot(cx0 - wx, cy0 - wy) > c.lpx * 0.7 + 30) continue;   // parked and remote: no sweep needed
    const vx = Math.cos(c.ang) * spd, vy = Math.sin(c.ang) * spd;
    const co = Math.cos(c.ang), si = Math.sin(c.ang);
    const reach = Math.abs(vx) * leadT + Math.abs(vy) * leadT + c.lpx + 90;
    if (Math.abs(cx0 - wx) + Math.abs(cy0 - wy) > reach) continue;
    const steps = spd > 8 ? 4 : 1;
    for (let j = 0; j <= steps; j++) {
      const t = leadT * j / steps;
      const dx = cx0 + vx * t - wx, dy = cy0 + vy * t - wy;
      if (Math.abs(dx * co + dy * si) < c.lpx * 0.5 + 10 && Math.abs(-dx * si + dy * co) < c.wpx * 0.5 + 10) return true;
    }
  }
  return false;
}
// nearest out-of-band standing spot (perpendicular first, then diagonals): never teleports
function sqCurbOut(wx, wy, ln) {
  const r = ln.hw + 26, nx = -ln.sy, ny = ln.sx, K = 0.7071;
  const dirs = [[nx, ny], [-nx, -ny],
    [nx * K + ln.sx * K, ny * K + ln.sy * K], [nx * K - ln.sx * K, ny * K - ln.sy * K],
    [-nx * K + ln.sx * K, -ny * K + ln.sy * K], [-nx * K - ln.sx * K, -ny * K - ln.sy * K],
    [ln.sx, ln.sy], [-ln.sx, -ln.sy]];
  for (const m2 of [1, 1.6]) for (const q of dirs) {
    const px2 = wx + q[0] * r * m2, py2 = wy + q[1] * r * m2;
    const rr = typeof cityResolve === "function" ? cityResolve(px2, py2, 7, false) : [px2, py2];
    if (Math.hypot(rr[0] - px2, rr[1] - py2) > 3) continue;                     // would be shoved into a wall: not standable
    const l2 = sqLaneAt(rr[0], rr[1]);
    if (l2 && l2.inside) continue;
    return [rr[0], rr[1]];
  }
  return null;
}
// how far along (dx,dy) from a world-px point before geometry would shove you back
function sqWallDist(px, py, dx, dy) {
  for (let r = 14; r <= 84; r += 14) {
    const x2 = px + dx * r, y2 = py + dy * r;
    const q = typeof cityResolve === "function" ? cityResolve(x2, y2, 7, false) : [x2, y2];
    if (Math.hypot(q[0] - x2, q[1] - y2) > 1) return r;
  }
  return 99;
}
function sqSideProbe(k) { const P = typeof window !== "undefined" ? window.SQSIDE : null; if (P) P[k] = (P[k] | 0) + 1; }
// Curb point on a chosen side of a band, for march routing. Projects the sample onto the
// LANE CENTERLINE, then out to the curb ring (hw+26) on the anchor's side, keeping the
// along-road station — measuring the radius from the off-center sample itself overshoots
// the facade by that offset and answers null everywhere (measured: 22 evals, 22 refusals).
function sqCurbSide(wx, wy, ln, ax, ay) {
  const nx = -ln.sy, ny = ln.sx, r = ln.hw + 26;
  const sg = ((ax - ln.cx) * nx + (ay - ln.cy) * ny) >= 0 ? 1 : -1;
  const along = (wx - ln.cx) * ln.sx + (wy - ln.cy) * ln.sy;
  for (const k of [1, 0.86, 1.14]) for (const toff of [0, 42, -42]) {   // walk the strip for width, like a pedestrian
    const px2 = ln.cx + ln.sx * (along + toff) + nx * sg * r * k, py2 = ln.cy + ln.sy * (along + toff) + ny * sg * r * k;
    const rr = typeof cityResolve === "function" ? cityResolve(px2, py2, 7, false) : [px2, py2];
    if (Math.hypot(rr[0] - px2, rr[1] - py2) > 3) continue;
    const l2 = sqLaneAt(rr[0], rr[1]);
    if (l2 && l2.inside) continue;
    return [rr[0], rr[1]];
  }
  return null;
}
function squadMove(m, dx, dy, simDt, mul) {
  if (!dx && !dy) { mVX[m] = 0; mVY[m] = 0; return; }
  const vx = dx * mSpd[m] * mul, vy = dy * mSpd[m] * mul;
  const ox = mX[m], oy = mY[m];
  if (typeof CITY !== "undefined" && CITY.on && typeof cityResolve === "function") {
    // Small substeps prevent a fast follower crossing a thin wall between frames.
    const n = Math.max(1, Math.min(16, Math.ceil(Math.hypot(vx, vy) * simDt / 6)));
    for (let k = 0; k < n; k++) {
      const nx = mX[m] + vx * simDt / n, ny = mY[m] + vy * simDt / n;
      if (typeof cityFlagsAt === "function" && typeof cityDoorRequest === "function" &&
          (cityFlagsAt(nx + dx * 10, ny + dy * 10) & F_DOOR)) cityDoorRequest(nx + dx * 10, ny + dy * 10);
      const q = cityResolve(nx, ny, mKind[m] === 4 ? 10 : 7, false);
      mX[m] = q[0]; mY[m] = q[1];
    }
  } else { mX[m] += vx * simDt; mY[m] += vy * simDt; }
  const moved = Math.hypot(mX[m] - ox, mY[m] - oy), planned = Math.hypot(vx, vy) * simDt;
  const N = squadNav[m];
  N.stuck = planned > .5 && moved < planned * .25 ? N.stuck + simDt : Math.max(0, N.stuck - simDt);
  mVX[m] = (mX[m] - ox) / Math.max(.0001, simDt); mVY[m] = (mY[m] - oy) / Math.max(.0001, simDt);
  if (moved > .1) mWalk[m] += simDt * (mKind[m] === 1 ? 11 : 7.5);
}
function squadMoveTo(m, tx, ty, simDt, mul, stopR, nocurb) {
  let dx = tx - mX[m], dy = ty - mY[m], d = Math.hypot(dx, dy), N = squadNav[m];
  N.retry = Math.max(0, N.retry - simDt);
  N.lineT = Math.max(0, (N.lineT || 0) - simDt);
  // --- march routing consumer (15.4.3 part1): the 4 Hz audit decides strip routes toward
  //     the LEADER anchor (slot targets jitter and defeat caching); this only steers the
  //     active waypoint and hands the final leg back. Targets move, never positions.
  if (!nocurb && N.mid && typeof TRF !== "undefined" && TRF.on) {
    const A = N.mid;
    if (d < 150 || Math.hypot(A.px - player.x, A.py - player.y) > 70 || runTime - A.born > 2.5) N.mid = null;
    else if (Math.hypot(A.a[0] - mX[m], A.a[1] - mY[m]) < 26) { if (A.hop > 1) { A.a = A.b; A.hop = 1; sqSideProbe("hops"); } else N.mid = null; }
    else { tx = A.a[0]; ty = A.a[1]; dx = tx - mX[m]; dy = ty - mY[m]; d = Math.hypot(dx, dy); }
  }
  // --- curb sense (see 3b): mid-lane halts retarget to the curb, a pin gets one dash,
  //     and stepping into a band with traffic closing holds the person at the curb edge —
  //     bounded at 6 s so a follower can NEVER refuse the roadway permanently.
  if (!nocurb && typeof CITY !== "undefined" && CITY.on && typeof TRF !== "undefined" && TRF.on) {
    if (!N.lane || runTime - N.lane.t > 0.25) N.lane = sqLaneAt(mX[m], mY[m]);
    const ln = N.lane;
    if (ln) {
      if (!ln.inside && d > stopR + 2) {
        // the ordered stop point itself sits in a live band: take the curb beside it instead —
        // persistently, or the member oscillates (arrive, snap, walk back, snap, ...)
        if (!N.tLane || runTime - N.tLane.t > 0.25) N.tLane = sqLaneAt(tx, ty);
        const lt = N.tLane;
        if (lt && lt.inside) {
          const out2 = sqCurbOut(tx, ty, lt);
          if (out2) { tx = out2[0]; ty = out2[1]; dx = tx - mX[m]; dy = ty - mY[m]; d = Math.hypot(dx, dy); sqProbe("snaps"); }
        }
      }
      if (ln.inside) {
        N.laneT += simDt;
        if (N.laneT > 2.5 && !N.dashed && N.stuck > 1.2) { N.dashed = 1; N.dashT = runTime + 1.2; sqProbe("dashes"); }
        if (d <= stopR || (N.dashed && N.dashT > runTime) || (N.laneT > 2.5 && N.stuck > 1.2)) {
          const out = sqCurbOut(mX[m], mY[m], ln);
          if (out) {
            if (d <= stopR) sqProbe("snaps");
            tx = out[0]; ty = out[1]; dx = tx - mX[m]; dy = ty - mY[m]; d = Math.hypot(dx, dy);
            if (N.dashT > runTime) mul *= 1.6;
          }
        }
        if (typeof window !== "undefined" && window.SQCURB && sqThreat(mX[m], mY[m], 0.5)) sqProbe("hazards");
      } else {
        N.laneT = 0; N.dashed = 0;
        if (ln.d > ln.hw + 40) N.curbT = 0;
        if (!(N.forced && runTime - N.forced < 3) && d > stopR + 2) {
          const gd = d || 1, step = Math.max(24, mSpd[m] * mul * simDt * 3);
          const nxv = -ln.sy, nyv = ln.sx;
          const px2 = mX[m] + dx / gd * step, py2 = mY[m] + dy / gd * step;
          const pd = Math.abs((px2 - ln.cx) * nxv + (py2 - ln.cy) * nyv);
          if (pd < ln.hw + 4 && (ln.d > pd || ln.d < ln.hw + 30)) {
            if (sqThreat(px2, py2, 1.5)) {
              if (!N.curbT) { N.curbT = runTime; N.curbD0 = d; sqProbe("holds"); }
              if (runTime - N.curbT > 6 || d > N.curbD0 + 150) { N.forced = runTime; N.curbT = 0; sqProbe("forced"); }
              else { mVX[m] = 0; mVY[m] = 0; return d; }
            } else N.curbT = 0;
          } else N.curbT = 0;
        }
      }
    }
  }
  if (d <= stopR) { N.path = null; mVX[m] = mVY[m] = 0; return d; }
  let gx = tx, gy = ty;
  let blocked = false;
  if (typeof CITY !== "undefined" && CITY.on && typeof stClearLine === "function" && typeof stFindPath === "function" && d > 25) {
    // Cache a clear-line query briefly; actual movement still checks collision.
    if (!N.lineT || Math.hypot(tx - N.lineTX, ty - N.lineTY) > 50 || Math.hypot(mX[m] - N.lineX, mY[m] - N.lineY) > 48) {
      N.lineOK = stClearLine(mX[m], mY[m], tx, ty, 7); N.lineT = .25;
      N.lineX = mX[m]; N.lineY = mY[m]; N.lineTX = tx; N.lineTY = ty;
    }
    blocked = !N.lineOK;
  }
  if (blocked) {
    let P = N.path;
    const changed = P && Math.hypot(P.tx - tx, P.ty - ty) > 70;
    if ((!P || changed || P.k >= P.pts.length || N.stuck > 1) && !N.retry && squadPathBudget > 0) {
      squadPathBudget--; P = N.path = stFindPath(mX[m], mY[m], tx, ty); N.retry = 1.2; N.stuck = 0;
    }
    if (P && P.k < P.pts.length) {
      while (P.k < P.pts.length && Math.hypot(P.pts[P.k][0] - mX[m], P.pts[P.k][1] - mY[m]) < 12) P.k++;
      if (P.k < P.pts.length) { gx = P.pts[P.k][0]; gy = P.pts[P.k][1]; }
    }
  } else N.path = null;
  const mx = gx - mX[m], my = gy - mY[m], md = Math.hypot(mx, my);
  if (md > .1) squadMove(m, mx / md, my / md, simDt, mul);
  return d;
}

// Friendly shooters check the full projectile lane, not just the target.
// Only locally simulated people the shooter can see count as known risks.
function squadSafeShotAt(m, x, y, ang, range, spread) {
  if (typeof CITY === "undefined" || !CITY.on || opts.squadFireSafety === false) return true;
  const c = Math.cos(ang), s = Math.sin(ang), margin = Math.tan(Math.min(.4, spread || 0));
  function risky(px, py, radius) {
    const dx = px - x, dy = py - y, along = dx * c + dy * s;
    if (along < 8 || along > range || Math.abs(-dx * s + dy * c) > radius + 4 + along * margin) return false;
    return typeof cityLOS !== "function" || cityLOS(x, y, px, py);
  }
  if (player && risky(player.x, player.y, 9)) return false;
  for (let j = 0; j < MAX_MINION; j++) if (j !== m && mAct[j] && risky(mX[j], mY[j], Math.min(12, mRad[j] || 7))) return false;
  if (typeof TF !== "undefined" && TF.on && TF.walk) for (const p of TF.walk) {
    if (p && p.alive && p.w && p.w.hp > 0 && risky(p.w.x, p.w.y, 7)) return false;
  }
  return true;
}
function squadFindSafeFlank(m, targetX, targetY, spec, homeD, order) {
  // Hold-position teams do not abandon their post for a cleaner shot.
  if (order === 1 && homeD > 40) return null;
  const a = Math.atan2(targetY - mY[m], targetX - mX[m]), side = (mSlot[m] & 1) ? 1 : -1;
  const range = spec.max * 1.35 + spec.spd * .1;
  for (const sign of [side, -side]) {
    const x = mX[m] - Math.sin(a) * 55 * sign, y = mY[m] + Math.cos(a) * 55 * sign;
    if (typeof cityCircleBlocked === "function" && cityCircleBlocked(x, y, 8, false)) continue;
    if (typeof stClearLine === "function" && !stClearLine(mX[m], mY[m], x, y, 7)) continue;
    if (squadSafeShotAt(m, x, y, Math.atan2(targetY - y, targetX - x), range, spec.spread)) return [x, y];
  }
  return null;
}
function squadHoldFire(m) {
  mAtkCD[m] = .12;
  const N = squadNav[m];
  if (runTime - (N.warnT == null ? -999 : N.warnT) > 3 && typeof spawnSpeech === "function") {
    N.warnT = runTime; spawnSpeech(mX[m], mY[m] - 16, "HOLD FIRE!", "#ffd166", 1.0);
  }
}
function squadFireSoldier(m, kind, ang, simDt, rateMul) {
  if (mAtkCD[m] > 0) return null;
  const sp = SOLDIER_SPECS[kind], th = FIRETEAM_THEMES[squadState.theme] || FIRETEAM_THEMES.marine;
  if (!squadSafeShotAt(m, mX[m], mY[m], ang, sp.max * 1.35 + sp.spd * .1, sp.spread)) {
    squadHoldFire(m); return false;
  }
  if (mBurst[m] === 0) mBurst[m] = sp.burst;
  const pellets = sp.pellets || 1;
  for (let k = 0; k < pellets; k++) {
    const a = ang + (Math.random() - 0.5) * sp.spread * 2;
    spawnProj(mX[m], mY[m], Math.cos(a) * sp.spd, Math.sin(a) * sp.spd, mDmg[m] * sp.dmg, (sp.max / sp.spd) * 1.35 + 0.1,
              kind === 7 ? 4 : 3, sp.prc, th.bolt ? 4 : 9, 0, 0, 200, 2);
  }
  const mx = mX[m] + Math.cos(ang) * 11, my = mY[m] + Math.sin(ang) * 11;
  spawnPt(mx, my, Math.cos(ang) * 30, Math.sin(ang) * 30, 0.06, 3.2, th.bolt ? 9 : 2, 0);                        // muzzle flash
  if (!th.bolt) spawnPt(mX[m], mY[m], Math.cos(ang + 1.6) * 50, Math.sin(ang + 1.6) * 50, 0.6, 2, 8, 3);        // brass
  const now = performance.now();
  if (now - squadState.gunSfxT > 70) { squadState.gunSfxT = now; sfx(kind === 7 ? 260 : 420, 90, kind === 7 ? 0.09 : 0.035, "sawtooth", kind === 7 ? 0.09 : 0.05); }
  mBurst[m]--;
  mAtkCD[m] = (mBurst[m] > 0 ? sp.gap : sp.cd * (0.9 + Math.random() * 0.2)) / (rateMul || 1);
  return true;
}

function squadMinionsSim(simDt) {
  const S = squadState;
  squadPathBudget = 2;
  S.orderT += simDt;
  if (S.regroupT > 0) S.regroupT = Math.max(0, S.regroupT - simDt);
  if (S.order === 2 && (S.focusIdx < 0 || !eAct[S.focusIdx] || eUid[S.focusIdx] !== S.focusUid)) squadPickFocus();
  const aimX = Math.cos(player.aim || 0), aimY = Math.sin(player.aim || 0);
  // Remember the direction of travel at a halt; do not orbit the leader.
  if (Math.hypot(player.vx || 0, player.vy || 0) > 8 && !player.inVehicle) {
    const heading = Math.atan2(player.vy, player.vx);
    S.formHeading = lerpAng(S.formHeading, heading, Math.min(1, simDt * 4));
  }
  // --- formation audit (15.4.2 part1, 4 Hz, ONE pass for the whole team): wedge-slot
  // legality decides per-member mode — 0 wedge, 1 file (tight alley forces everyone; a
  // blocked slot drops that member into file rank), 2 curb-shift beside the slot. Slots
  // are TARGETS, never teleports: positions stay continuous by construction. A member
  // flipping modes >4 times in 6 s pins to file for 12 s: bounded, like everything here.
  S.audT -= simDt;
  if (S.audT <= 0) {
    S.audT = 0.25;
    if (S.order !== S.lastOrder) { S.lastOrder = S.order; S.compress = 0; S.reformT = 0;
      for (let m = 0; m < MAX_MINION; m++) { const N3 = squadNav[m]; N3.fmode = 0; N3.swN = 0; N3.pinT = 0; } }   // orders re-set the formation context wholesale
    for (let m = 0; m < MAX_MINION; m++) squadNav[m].slotOK = 0;
    if (S.order === 0 && typeof CITY !== "undefined" && CITY.on && typeof cityResolve === "function") {
      const live = [];
      for (let m = 0; m < MAX_MINION; m++) if (mAct[m] && mTeam[m] === 1 && mKind[m] >= 5 && mKind[m] <= 8) live.push(m);
      live.sort((a, b) => ((mSlot[a] % 8) - (mSlot[b] % 8)) || a - b);
      if (!live.length) { S.compress = 0; S.reformT = 0; }
      else {
        const c0 = Math.cos(S.formHeading), s0 = Math.sin(S.formHeading);
        // An ALLEY is a walled corridor of its own — not a traffic lane. If the leader stands in
        // a live band, curb sense owns the geometry (slot-level shifts below); mislabelling road
        // facades as an alley parks file ranks in the roadway where no curb-shift can apply.
        const lnP = sqLaneAt(player.x, player.y);
        const alley = !(lnP && lnP.inside) &&
          sqWallDist(player.x, player.y, -s0, c0) < 85 && sqWallDist(player.x, player.y, s0, -c0) < 85;
        const used = [];
        let allWedgeOK = true;
        for (let mi = 0; mi < live.length; mi++) {
          const m = live[mi], N2 = squadNav[m];
          const slot = mSlot[m] % 8, row = Math.floor(slot / 2) + 1, side = slot % 2 ? 1 : -1;
          const forward = -40 - (row - 1) * 45, lateral = side * (38 + (row - 1) * 22);
          let wx2 = player.x + c0 * forward - s0 * lateral, wy2 = player.y + s0 * forward + c0 * lateral;
          const legal = (x2, y2) => {
            const q = cityResolve(x2, y2, 7, false);
            if (Math.hypot(q[0] - x2, q[1] - y2) > 1) return false;
            const ln = sqLaneAt(x2, y2); if (ln && ln.inside) return false;
            for (const u of used) if (Math.hypot(u[0] - x2, u[1] - y2) < 26) return false;
            return true;
          };
          const wedgeOK = legal(wx2, wy2);
          if (!wedgeOK) allWedgeOK = false;
          let mode = wedgeOK ? 0 : 1;
          if (!wedgeOK && !alley) {
            const ln2 = sqLaneAt(wx2, wy2);
            if (ln2 && ln2.inside) { const out = sqCurbOut(wx2, wy2, ln2);
              if (out) { let ox = out[0], oy = out[1]; const gl0 = Math.hypot(ox - wx2, oy - wy2) || 1;
                if (sqWallDist(ox, oy, (ox - wx2) / gl0, (oy - wy2) / gl0) < 40) {   // lip hugs the facade: step off it toward the strip
                  const bx = ox + (wx2 - ox) / gl0 * 12, by = oy + (wy2 - oy) / gl0 * 12;
                  if (legal(bx, by)) { ox = bx; oy = by; sqSideProbe("buffers"); } else sqSideProbe("bufferSkips");
                }
                if (legal(ox, oy)) { wx2 = ox; wy2 = oy; mode = 2; } } }
          }
          if (alley) mode = 1;
          if (S.compress && !alley) mode = 1;   // hold file through the reform countdown — or members flip at audit cadence and it never completes
          if (mode === 1) { const fw = -30 - mi * 30, lat = (mi % 2 ? 14 : -14); wx2 = player.x + c0 * fw - s0 * lat; wy2 = player.y + s0 * fw + c0 * lat; }
          if (N2.pinT > runTime) { mode = 1; const fw = -30 - mi * 30, lat = (mi % 2 ? 14 : -14); wx2 = player.x + c0 * fw - s0 * lat; wy2 = player.y + s0 * fw + c0 * lat; }
          else if (mode !== N2.fmode) {
            if (N2.swT && runTime - N2.swT < 6) { N2.swN++; if (N2.swN > 4) { N2.pinT = runTime + 12; N2.swN = 0; } } else N2.swN = 0;
            N2.swT = runTime; N2.fmode = mode;
          }
          used.push([wx2, wy2]);
          N2.slotX = wx2; N2.slotY = wy2; N2.slotOK = 1;
        }
        for (let ri = 0; ri < live.length; ri++) {   // route decision per member, 4 Hz, toward the leader anchor
          const m = live[ri], NR = squadNav[m];
          const rd = Math.hypot(player.x - mX[m], player.y - mY[m]);
          if (alley || rd < 240) { NR.mid = null; continue; }
          if (NR.mid) continue;
          if (runTime < (NR.midNext || 0)) continue;
          sqSideProbe("evals");
          const rxx = player.x - mX[m], ryy = player.y - mY[m];
          const step = 28, nS = Math.max(3, Math.min(30, Math.floor(rd / step)));
          let first = -1, last = -1, exp = 0; const SL = [];
          for (let i2 = 0; i2 <= nS; i2++) {
            const px = mX[m] + rxx / rd * step * i2, py = mY[m] + ryy / rd * step * i2;
            const l = sqLaneAt(px, py);
            if (l && l.inside) { exp++; if (first < 0) first = i2; last = i2; SL[i2] = [px, py, l]; } else SL[i2] = null;
          }
          if (first < 0) { NR.midNext = runTime + 0.75; continue; }
          let refused = true;
          if (exp >= 2) {
            const cnt = (ax, ay, bx, by) => { let k2 = 0;
              for (let i3 = 1; i3 < 10; i3++) { const l = sqLaneAt(ax + (bx - ax) * i3 / 10, ay + (by - ay) * i3 / 10); if (l && l.inside) k2++; } return k2; };
            const w1 = sqCurbSide(SL[first][0], SL[first][1], SL[first][2], mX[m], mY[m]);
            const w2 = sqCurbSide(SL[last][0], SL[last][1], SL[last][2], mX[m], mY[m]);
            if (w1 && w2) {
              const len = Math.hypot(w1[0] - mX[m], w1[1] - mY[m]) + Math.hypot(w2[0] - w1[0], w2[1] - w1[1]) + Math.hypot(player.x - w2[0], player.y - w2[1]);
              const via = cnt(mX[m], mY[m], w1[0], w1[1]) + cnt(w1[0], w1[1], w2[0], w2[1]) + cnt(w2[0], w2[1], player.x, player.y);
              if (via <= exp * 0.65 && len <= rd * 1.45) {   // a >=35% exposure cut is the win worth walking 45% further for; below that, straight is better
                const nearFirst = Math.hypot(w1[0] - mX[m], w1[1] - mY[m]) <= Math.hypot(w2[0] - mX[m], w2[1] - mY[m]);
                NR.mid = { a: nearFirst ? w1 : w2, b: nearFirst ? w2 : w1, hop: nearFirst ? 2 : 1, px: player.x, py: player.y, born: runTime };
                sqSideProbe("routes"); refused = false;
                const SP = typeof window !== "undefined" ? window.SQSIDE : null;
                if (SP) SP.worstLen = Math.max(SP.worstLen || 0, len / rd);
              }
            }
            if (refused) { NR.midNext = runTime + 1.0; sqSideProbe("refused"); }
          }
        }
        if (alley) { S.compress = 1; S.reformT = 0; }
        else if (S.compress) { S.reformT = allWedgeOK ? S.reformT + 0.25 : 0; if (S.reformT >= 2) { S.compress = 0; S.reformT = 0; } }
      }
    } else { S.compress = 0; S.reformT = 0; }
  }
  let alive = 0, soldiers = 0, coGunner = -1;
  if (player.inVehicle > 0 && !(typeof CITY !== "undefined" && CITY.on)) {   // v14.1: in Nexus City riders take real seats (js/convoy.js)
    for (let m = 0; m < MAX_MINION; m++) if (mAct[m] && mKind[m] >= 5 && mKind[m] <= 7) { coGunner = m; break; }
  }
  S.coGunner = coGunner;

  for (let m = 0; m < MAX_MINION; m++) {
    if (!mAct[m]) continue;
    mLife[m] -= simDt;
    if (mTag[m] > 0) mTag[m] -= simDt;
    if (mLife[m] <= 0 || mHP[m] <= 0) {
      if (mTeam[m] && mHP[m] <= 0) spawnSpeech(mX[m], mY[m] - 12, "MAN DOWN! " + (mName[m] || ""), "#ff5252", 1.4);
      mAct[m] = 0; mTeam[m] = 0; squadNav[m].path = null; squadNav[m].retry = squadNav[m].stuck = 0; spawnParticles(mX[m], mY[m], 4);
      continue;
    }
    alive++;
    if (mAtkCD[m] > 0) mAtkCD[m] = Math.max(0, mAtkCD[m] - simDt);
    const kind = mKind[m], soldier = kind >= 5;
    if (soldier) soldiers++;
    if (typeof convoyMinionStep === "function" && convoyMinionStep(m, simDt)) continue;   // v14.1: riding / boarding a vehicle

    // --- vehicle co-gunner rides with the player and mans the gun
    if (m === coGunner) {
      mX[m] = player.x - 7; mY[m] = player.y - 9;
      let tgt = -1, bd = 300;
      for (let j = 0; j < MAX_E; j++) { if (!eAct[j] || allyIs(j)) continue; const d = Math.hypot(eX[j] - mX[m], eY[j] - mY[m]); if (d < bd) { bd = d; tgt = j; } }
      if (tgt >= 0) {
        const a = Math.atan2(eY[tgt] - mY[m], eX[tgt] - mX[m]);
        mAim[m] = lerpAng(mAim[m], a, Math.min(1, simDt * 14));
        squadFireSoldier(m, kind === 7 ? 7 : 6, mAim[m], simDt, 1.5);
      }
      continue;
    }

    // --- home point & engagement envelope from the current order
    const formAng = m * 1.15;
    let hx, hy, engageR, leashR;
    if (S.order === 1) { hx = S.ax + Math.cos(formAng) * 34; hy = S.ay + Math.sin(formAng) * 34; engageR = 240; leashR = 95; }
    else if (S.order === 3) {
      const rx = player.x + aimX * 230, ry = player.y + aimY * 230;
      hx = rx + Math.cos(formAng) * 40; hy = ry + Math.sin(formAng) * 40; engageR = 430; leashR = 1e9;
    } else if (S.order === 0 && soldier && mTeam[m]) {
      // Compact wedge behind the leader; the 15.4.2 formation audit may have already
      // resolved this member to a file rank or a curb-shifted slot for the current
      // 0.25 s window — that resolved target wins. Different slots remain separate.
      const N2 = squadNav[m];
      if (N2.slotOK) { hx = N2.slotX; hy = N2.slotY; }
      else {
        const slot = mSlot[m] % 8, row = Math.floor(slot / 2) + 1, side = slot % 2 ? 1 : -1;
        const forward = -40 - (row - 1) * 45, lateral = side * (38 + (row - 1) * 22);
        const c = Math.cos(S.formHeading), s = Math.sin(S.formHeading);
        hx = player.x + c * forward - s * lateral; hy = player.y + s * forward + c * lateral;
      }
      engageR = 360; leashR = 270;
    } else { hx = player.x + Math.cos(formAng) * 44; hy = player.y + Math.sin(formAng) * 44; engageR = 360; leashR = 270; }
    const holdP = typeof convoyHoldPoint === "function" ? convoyHoldPoint(m) : null;   // v14.1: no seat left - hold the spot
    if (holdP) { hx = holdP.x + Math.cos(formAng) * 26; hy = holdP.y + Math.sin(formAng) * 26; engageR = 300; leashR = 140; }

    let bestE = -1, bestD = engageR;
    if (S.order === 2 && S.focusIdx >= 0) { bestE = S.focusIdx; bestD = Math.hypot(eX[bestE] - mX[m], eY[bestE] - mY[m]); }
    else if (!(S.order === 0 && S.regroupT > 0)) {
      const cx = S.order === 1 ? S.ax : mX[m], cy = S.order === 1 ? S.ay : mY[m];
      for (let j = 0; j < MAX_E; j++) {
        if (!eAct[j] || eLevitate[j] > 0 || (typeof sdIgnore === "function" && sdIgnore(j))) continue;   // v12: not the crowd
        const d = Math.hypot(eX[j] - cx, eY[j] - cy);
        if (d < bestD) { bestD = d; bestE = j; }
      }
      if (bestE >= 0) bestD = Math.hypot(eX[bestE] - mX[m], eY[bestE] - mY[m]);
    }
    const homeD = Math.hypot(hx - mX[m], hy - mY[m]);
    const leashBreak = S.order !== 2 && homeD > leashR;

    if (soldier) {
      // contact damage: soldiers can be overrun
      for (let j = 0; j < MAX_E; j++) {
        if (eAct[j] && !eDummy[j] && !allyIs(j) && Math.abs(eX[j] - mX[m]) < 14 && Math.abs(eY[j] - mY[m]) < 14) mHP[m] -= (eType[j] >= 98 ? 40 : 14) * simDt;
      }
      const sp = SOLDIER_SPECS[kind];
      if (bestE >= 0 && !leashBreak) {
        const dx = eX[bestE] - mX[m], dy = eY[bestE] - mY[m], d = Math.hypot(dx, dy) || 1, ang = Math.atan2(dy, dx);
        mAim[m] = lerpAng(mAim[m], ang, Math.min(1, simDt * 12));
        let mvx = 0, mvy = 0;
        if (d > sp.max) { mvx = dx / d; mvy = dy / d; }
        else if (d < sp.min) { mvx = -dx / d * 0.7; mvy = -dy / d * 0.7; }
        if (S.order === 1) {
          if (homeD > 60) { mvx = (hx - mX[m]) / homeD; mvy = (hy - mY[m]) / homeD; }
          else if (d > sp.max) { mvx = 0; mvy = 0; }
        }
        if (d > sp.max && S.order !== 1) squadMoveTo(m, eX[bestE], eY[bestE], simDt, 1, sp.max, 1);
        else squadMove(m, mvx, mvy, simDt, 1);
        if (d <= sp.max * 1.15) {
          const fired = squadFireSoldier(m, kind, mAim[m], simDt, 1);
          if (fired === false) {
            const flank = squadFindSafeFlank(m, eX[bestE], eY[bestE], sp, homeD, S.order);
            if (flank) squadMoveTo(m, flank[0], flank[1], simDt, .6, 5, 1);
          }
        }
      } else {
        const leaderSpeed = Math.hypot(player.vx || 0, player.vy || 0);
        const followMul = S.order === 0 && !holdP && !player.inVehicle ? Math.min(2.2, Math.max(0.85, leaderSpeed / Math.max(1, mSpd[m]) * 1.15)) : (leashBreak ? 1.15 : 0.85);
        squadMoveTo(m, hx, hy, simDt, followMul, 8);
        mAim[m] = lerpAng(mAim[m], S.order === 3 ? (player.aim || 0) : Math.atan2(mY[m] - player.y, mX[m] - player.x), Math.min(1, simDt * 6));
      }
      continue;
    }

    // --- original companions (0 swordsman, 1 hound, 2 bowman, 3 knight, 4 bone golem), now order-aware
    if (bestE >= 0 && !leashBreak) {
      const dx = eX[bestE] - mX[m], dy = eY[bestE] - mY[m], d = Math.hypot(dx, dy) || 1, ang = Math.atan2(dy, dx);
      mAim[m] = ang;
      if (kind === 2) {
        if (d > 135 && !(S.order === 1 && homeD > 60)) squadMoveTo(m, eX[bestE], eY[bestE], simDt, 1, 135, 1);
        else if (d < 75) squadMove(m, -dx / d, -dy / d, simDt, 0.65);
        else if (S.order === 1 && homeD > 60) squadMoveTo(m, hx, hy, simDt, 1, 8);
        if (mAtkCD[m] <= 0 && d < 300) {
          if (squadSafeShotAt(m, mX[m], mY[m], ang, 323, 0)) {
            mAtkCD[m] = 0.82;
            spawnProj(mX[m], mY[m], Math.cos(ang) * 380, Math.sin(ang) * 380, mDmg[m], 0.85, 5, 1, 4, 0, 0, 75, 2);
            sfx(640, 280, 0.04, "triangle", 0.09);
          } else {
            squadHoldFire(m);
            const flank = squadFindSafeFlank(m, eX[bestE], eY[bestE], { max: 211, spd: 380, spread: 0 }, homeD, S.order);
            if (flank) squadMoveTo(m, flank[0], flank[1], simDt, .6, 5, 1);
          }
        }
      } else {
        const eRad = eType[bestE] === 99 ? 22 : 12;
        const reach = mRad[m] + eRad + 6;
        const mayChase = S.order !== 1 || Math.hypot(eX[bestE] - S.ax, eY[bestE] - S.ay) < leashR + 40;
        if (d > reach * 0.85) {
          if (mayChase) squadMoveTo(m, eX[bestE], eY[bestE], simDt, 1, reach * 0.85, 1);
          else squadMoveTo(m, hx, hy, simDt, 1, 8);
        }
        if (d <= reach && mAtkCD[m] <= 0) {
          mAtkCD[m] = kind === 1 ? 0.34 : (kind === 4 ? 0.92 : 0.52);
          if (kind === 4) {
            spawnBlastWave(mX[m], mY[m], 62, mCol[m], "squad");
            sfx(110, 42, 0.18, "sawtooth", 0.24);
            for (let k = 0; k < MAX_E; k++) {
              if (!eAct[k]) continue;
              if (Math.hypot(eX[k] - mX[m], eY[k] - mY[m]) <= 64) {
                eHP[k] -= mDmg[m]; eStun[k] = Math.max(eStun[k], 0.85);
                spawnDmg(eX[k], eY[k], mDmg[m], true);
                if (eHP[k] <= 0) killEnemy(k, false, null, "#00f0ff", "squad");
              }
            }
          } else {
            eHP[bestE] -= mDmg[m];
            eScarAng[bestE] = ang + 0.4; eScarHeat[bestE] = 0.85;
            if (kind === 1) { eBleed[bestE] = 1; eBleedRate[bestE] = eMax[bestE] * 0.08; eBleedSource[bestE] = 2; bleedSetOrigin(bestE, null); eSlow[bestE] = 1.5; }
            if ((kind === 0 || kind === 3) && Math.random() < 0.28 && eArmsLost[bestE] < 2) {
              eArmsLost[bestE]++;
              spawnGroundLimb(eX[bestE], eY[bestE], "#ff5252", 1);
            }
            spawnDmg(eX[bestE], eY[bestE], mDmg[m], kind === 3);
            sfx(260, 110, 0.045, "triangle", 0.11);
            if (eHP[bestE] <= 0) killEnemy(bestE, false, (kind === 0 || kind === 3) ? ang : null, mCol[m], "squad");
          }
          mHP[m] -= (eType[bestE] >= 98 ? 14 : 5);
        }
      }
    } else {
      squadMoveTo(m, hx, hy, simDt, leashBreak ? 1.1 : 0.8, 8);
    }
  }
  S.alive = alive; S.soldiers = soldiers;
}

/* === 5. INNATE FIRETEAMS FOR MILITARY HEROES (reinforce every 40 s) === */
function squadStep(simDt) {
  const S = squadState;
  if (!S.innateN || player.noSpawns) return;
  S.reinforceT -= simDt;
  if (S.reinforceT > 0) return;
  S.reinforceT = 40;
  const have = new Set();
  for (let m = 0; m < MAX_MINION; m++) if (mAct[m] && mTeam[m] === 2) have.add(mSlot[m]);
  const th = FIRETEAM_THEMES[S.theme] || FIRETEAM_THEMES.marine, kinds = [5, 6, 7, 8];
  let sent = 0;
  for (let k = 0; k < S.innateN; k++) {
    if (have.has(k)) continue;
    const a = Math.random() * Math.PI * 2;
    const slot = squadSpawnSoldier(player.x + Math.cos(a) * 60, player.y + Math.sin(a) * 60, kinds[k % 4], k, 1e6, th);
    mTeam[slot] = 2; sent++;
  }
  if (sent) spawnSpeech(player.x, player.y - 26, `REINFORCEMENTS: ${sent} x ${th.name.toUpperCase()}`, th.accent, 2.0);
}

/* === 6. RENDERING === */
function squadRenderMinions() {
  const th = FIRETEAM_THEMES[squadState.theme] || FIRETEAM_THEMES.marine;
  for (let i = 0; i < MAX_MINION; i++) {
    if (!mAct[i]) continue;
    if (typeof mSeatOf === "function" && mSeatOf(i)) continue;   // v14.1: riders are drawn by their vehicle
    const kind = mKind[i], rad = mRad[i] || 10;
    ctx.save();
    ctx.translate(mX[i], mY[i]);
    ctx.fillStyle = mCol[i] || "#b388ff";
    if (kind >= 5) {
      const st = Math.sin(mWalk[i]) * 2;
      ctx.fillStyle = "#263238"; ctx.fillRect(-3.5, 4 + st * 0.3, 2.6, 5); ctx.fillRect(0.9, 4 - st * 0.3, 2.6, 5);
      ctx.fillStyle = mCol[i]; ctx.fillRect(-4.5, -4, 9, 9);
      ctx.fillStyle = "rgba(0,0,0,0.28)"; ctx.fillRect(-4.5, -1, 9, 2.4);
      ctx.save(); ctx.rotate(mAim[i]);
      const len = kind === 7 ? 15 : (kind === 6 ? 12 : (kind === 8 ? 9 : 11));
      ctx.fillStyle = "#1c1c1c"; ctx.fillRect(2, kind === 6 ? -1.6 : -1.1, len, kind === 6 ? 3.2 : 2.2);
      if (kind === 7) { ctx.fillStyle = "#37474f"; ctx.fillRect(6, -2.8, 4, 1.4); }
      ctx.restore();
      if (th.helm === th.uni && th.uni === "#eceff1") {          // full-face clone bucket
        ctx.fillStyle = "#eceff1"; ctx.beginPath(); ctx.arc(0, -7, 3.8, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = "#111"; ctx.fillRect(-2.6, -7.8, 5.2, 1.3); ctx.fillStyle = th.accent; ctx.fillRect(-0.6, -10.4, 1.2, 2.6);
      } else {
        ctx.fillStyle = "#e0ac69"; ctx.beginPath(); ctx.arc(0, -7, 3.3, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = th.helm; ctx.beginPath(); ctx.arc(0, -7.6, 3.8, Math.PI, 0); ctx.fill(); ctx.fillRect(-3.8, -7.9, 7.6, 1.5);
      }
      ctx.fillStyle = th.accent; ctx.fillRect(-1, -2.6, 2, 2);
      if (mTag[i] > 0 && mName[i]) {
        ctx.globalAlpha = Math.min(1, mTag[i]); ctx.fillStyle = th.accent; ctx.font = "bold 6.5px monospace"; ctx.textAlign = "center";
        ctx.fillText(mName[i] + " · " + SOLDIER_SPECS[kind].role, 0, -15); ctx.globalAlpha = 1;
      }
    } else if (kind === 4) {
      ctx.fillRect(-16, -14, 32, 26);
      ctx.beginPath(); ctx.arc(0, -18, 9, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "#00ff88"; ctx.fillRect(-4, -6, 8, 4);
    } else if (kind === 3) {
      ctx.fillRect(-11, -10, 22, 20);
      ctx.beginPath(); ctx.arc(0, -12, 6.5, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = "#ffd166"; ctx.lineWidth = 1.4; ctx.strokeRect(-11, -10, 22, 20);
    } else if (kind === 1) {
      ctx.beginPath(); ctx.ellipse(0, 0, rad + 4, rad, 0, 0, Math.PI * 2); ctx.fill();
    } else {
      ctx.fillRect(-5, -6, 10, 12);
      ctx.beginPath(); ctx.arc(0, -9, 4.8, 0, Math.PI * 2); ctx.fill();
    }
    if (mHP[i] < mMax[i]) {
      ctx.fillStyle = "rgba(0,0,0,0.6)"; ctx.fillRect(-12, -18, 24, 2.5);
      ctx.fillStyle = "#00ff88"; ctx.fillRect(-12, -18, 24 * Math.max(0, mHP[i] / mMax[i]), 2.5);
    }
    ctx.restore();
  }
}

function squadRenderWorld(c) {
  const S = squadState;
  if (!S.alive || !player) return;
  c.save();
  if (S.order === 1) {
    c.strokeStyle = "rgba(255,209,102,0.75)"; c.lineWidth = 1.5; c.setLineDash([4, 4]);
    c.beginPath(); c.arc(S.ax, S.ay, 38, 0, Math.PI * 2); c.stroke(); c.setLineDash([]);
    c.fillStyle = "#ffd166"; c.fillRect(S.ax - 0.8, S.ay - 16, 1.6, 16);
    c.beginPath(); c.moveTo(S.ax + 0.8, S.ay - 16); c.lineTo(S.ax + 9, S.ay - 12.5); c.lineTo(S.ax + 0.8, S.ay - 9); c.fill();
  } else if (S.order === 2 && S.focusIdx >= 0 && eAct[S.focusIdx]) {
    const fx = eX[S.focusIdx], fy = eY[S.focusIdx], r = (eType[S.focusIdx] === 99 ? 28 : 17) + Math.sin(runTime * 8) * 2;
    c.translate(fx, fy); c.rotate(runTime * 2);
    c.strokeStyle = "#ff1744"; c.lineWidth = 1.8;
    c.beginPath(); c.arc(0, 0, r, 0, Math.PI * 2); c.stroke();
    for (let k = 0; k < 4; k++) { c.rotate(Math.PI / 2); c.beginPath(); c.moveTo(r - 5, 0); c.lineTo(r + 6, 0); c.stroke(); }
  } else if (S.order === 3) {
    const a = player.aim || 0, rx = player.x + Math.cos(a) * 230, ry = player.y + Math.sin(a) * 230;
    c.translate(rx, ry); c.rotate(a);
    c.strokeStyle = `rgba(0,230,118,${0.45 + 0.3 * Math.sin(runTime * 6)})`; c.lineWidth = 2.2;
    for (let k = 0; k < 3; k++) { c.beginPath(); c.moveTo(-12 + k * 9, -8); c.lineTo(-4 + k * 9, 0); c.lineTo(-12 + k * 9, 8); c.stroke(); }
  }
  c.restore();
}

/* === 7. RADIAL WHEEL UI (tap, press-drag-release, or keys Q / 1-4) === */
function squadEnsureUI() {
  if (document.getElementById("squadBtn")) return;
  const btn = document.createElement("button");
  btn.id = "squadBtn"; btn.innerHTML = `📻<span id="squadBadge">0</span>`;
  btn.title = "Squad orders (Q) · hold & drag to pick";
  document.body.appendChild(btn);
  const wheel = document.createElement("div");
  wheel.id = "squadWheel";
  const R = 112, r0 = 34;
  const wedges = [{ id: 3, a: -90 }, { id: 2, a: 0 }, { id: 0, a: 90 }, { id: 1, a: 180 }];
  let svg = `<svg viewBox="-130 -130 260 260" width="260" height="260">`;
  wedges.forEach(w => {
    const a0 = (w.a - 45) * Math.PI / 180, a1 = (w.a + 45) * Math.PI / 180;
    const p = (rr, a) => `${(Math.cos(a) * rr).toFixed(1)},${(Math.sin(a) * rr).toFixed(1)}`;
    const o = SQUAD_ORDERS[w.id], am = w.a * Math.PI / 180;
    svg += `<g class="sqw" data-id="${w.id}"><path d="M${p(r0, a0)} L${p(R, a0)} A${R},${R} 0 0 1 ${p(R, a1)} L${p(r0, a1)} A${r0},${r0} 0 0 0 ${p(r0, a0)} Z"/>` +
           `<text x="${(Math.cos(am) * 72).toFixed(1)}" y="${(Math.sin(am) * 72 - 4).toFixed(1)}" class="ico">${o.icon}</text>` +
           `<text x="${(Math.cos(am) * 72).toFixed(1)}" y="${(Math.sin(am) * 72 + 14).toFixed(1)}" class="lbl">${o.label}</text></g>`;
  });
  svg += `<circle r="${r0 - 4}" class="hub"/><text y="4" class="hubtxt" id="squadHubTxt">ORDERS</text></svg>`;
  wheel.innerHTML = svg;
  document.body.appendChild(wheel);

  wheel.querySelectorAll(".sqw").forEach(g => {
    g.addEventListener("pointerup", e => { e.stopPropagation(); squadIssueOrder(+g.dataset.id); });
  });
  wheel.addEventListener("pointerdown", e => { if (e.target === wheel) { e.stopPropagation(); squadWheelClose(); } });

  let drag = null;
  btn.addEventListener("pointerdown", e => {
    e.preventDefault(); e.stopPropagation();
    if (squadState.wheelOpen) { squadWheelClose(); return; }
    squadWheelOpen();
    drag = { id: e.pointerId, x: e.clientX, y: e.clientY, moved: false };
  });
  window.addEventListener("pointermove", e => {
    if (!drag || e.pointerId !== drag.id || !squadState.wheelOpen) return;
    if (Math.hypot(e.clientX - drag.x, e.clientY - drag.y) > 28) drag.moved = true;
    squadHighlight(squadWedgeAt(e.clientX, e.clientY));
  });
  window.addEventListener("pointerup", e => {
    if (!drag || e.pointerId !== drag.id) return;
    const moved = drag.moved; drag = null;
    if (moved && squadState.wheelOpen) {
      const id = squadWedgeAt(e.clientX, e.clientY);
      if (id >= 0) squadIssueOrder(id); else squadWheelClose();
    }
  });
  window.addEventListener("keydown", e => {
    if (!runActive || !player || runPaused) return;
    if (e.code === "KeyQ") { squadState.wheelOpen ? squadWheelClose() : (squadState.alive ? squadWheelOpen() : null); }
    const map = { Digit1: 1, Digit2: 2, Digit3: 3, Digit4: 0 };
    if (e.code in map && squadState.alive) squadIssueOrder(map[e.code]);
  });
}

function squadWedgeAt(x, y) {
  const dx = x - W / 2, dy = y - H / 2, d = Math.hypot(dx, dy);
  if (d < 30 || d > 150) return -1;
  const a = Math.atan2(dy, dx) * 180 / Math.PI;
  if (a >= -135 && a < -45) return 3;
  if (a >= -45 && a < 45) return 2;
  if (a >= 45 && a < 135) return 0;
  return 1;
}
function squadHighlight(id) {
  if (id === squadState.hl) return;
  squadState.hl = id;
  document.querySelectorAll("#squadWheel .sqw").forEach(g => g.classList.toggle("hl", +g.dataset.id === id));
  const t = document.getElementById("squadHubTxt");
  if (t) t.textContent = id >= 0 ? SQUAD_ORDERS[id].icon : "ORDERS";
}
function squadWheelOpen() {
  squadEnsureUI();
  squadState.wheelOpen = true; squadState.hl = -2; squadHighlight(-1);
  document.getElementById("squadWheel").classList.add("open");
  document.querySelectorAll("#squadWheel .sqw").forEach(g => g.classList.toggle("cur", +g.dataset.id === squadState.order));
  if (typeof fxState !== "undefined") fxState.uiSlow = 0.3;
  sfx(700, 1000, 0.05, "sine", 0.06);
}
function squadWheelClose() {
  squadState.wheelOpen = false;
  const w = document.getElementById("squadWheel");
  if (w) w.classList.remove("open");
  if (typeof fxState !== "undefined") fxState.uiSlow = 1;
}

function squadFrame(rawDt) {
  const S = squadState;
  S.uiT -= rawDt;
  if (S.uiT > 0) return;
  S.uiT = 0.2;
  const show = runActive && !!player && S.alive > 0;
  let btn = document.getElementById("squadBtn");
  if (!btn && !show) return;
  squadEnsureUI(); btn = document.getElementById("squadBtn");
  btn.style.display = show ? "flex" : "none";
  btn.classList.toggle("flip", !!opts.hudFlip);
  if (!show) { if (S.wheelOpen) squadWheelClose(); return; }
  const badge = document.getElementById("squadBadge");
  if (badge) badge.textContent = SQUAD_ORDERS[S.order].icon + " " + S.alive;
}

function squadReset() {
  const S = squadState;
  S.order = 0; S.focusIdx = -1; S.focusUid = 0; S.orderT = 0; S.innateN = 0; S.reinforceT = 40; S.alive = 0; S.soldiers = 0; S.coGunner = -1; S.regroupT = 0; S.formHeading = player ? (player.aim || 0) : 0;
  mTeam.fill(0); mTag.fill(0); mBurst.fill(0);
  for (let m = 0; m < MAX_MINION; m++) squadNavReset(m);
  squadWheelClose();
}

V10.onRunStart.push(function squadRunStart(p) {
  squadReset();
  squadState.theme = squadThemeKey();
  const n = INNATE_SQUAD[p.cid] || 0;
  if (n && !p.noSpawns) {
    squadState.innateN = n;
    const th = FIRETEAM_THEMES[squadState.theme], kinds = [5, 6, 7, 8];
    for (let k = 0; k < n; k++) {
      const a = (k / n) * Math.PI * 2;
      const slot = squadSpawnSoldier(p.x + Math.cos(a) * 30, p.y + Math.sin(a) * 30, kinds[k % 4], k, 1e6, th);
      mTeam[slot] = 2;
    }
    setTimeout(() => { if (player === p) spawnSpeech(p.x, p.y - 30, th.name.toUpperCase() + " DEPLOYED WITH YOU · 📻 FOR ORDERS", th.accent, 2.6); }, 900);
  }
});
V10.onRunReset.push(function squadRunReset() { squadReset(); });
V10.onStep.push(squadStep);
V10.onFrame.push(squadFrame);
V10.onRenderWorld.push(squadRenderWorld);
// EOF:js/squad.js
