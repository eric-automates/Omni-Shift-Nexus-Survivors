// FILE: js/convoy.js
// PART: v14.1 module 2 of 4
// DETAIL: v14.1 followers ride along + convoy driving. When you take a vehicle your squad (fireteams, necro companions,
//         hounds, knights, bone golems) mounts up automatically: gunners take window / bed / hatch positions and lean
//         out to shoot on their side, a missing door shows the whole rider, a sunroof or hatch puts a gunner up top.
//         Whoever doesn't fit splits into nearby vehicles (radius 44 m) and forms a convoy that follows your exact path
//         with real tactical-convoy procedures (FM 55-65 / Tactical Convoy Handbook / FM 4-01.45 TTP):
//           • close column; interval = 2 × speedometer (mph) metres, min 20 m - scaled ×0.3 for the screen (min 8 m town / 14 m open)
//           • catch-up speed above the march rate, the column moves at the speed of its slowest vehicle
//           • lead covers 12 o'clock, vehicles alternate 9 / 3 o'clock, the trail vehicle covers 6 o'clock
//           • under fire the column does not stop in the kill zone (drive through, close up, return fire)
//           • at a halt vehicles pull off alternately (1st right, 2nd left…) at ~45° = herringbone, road kept clear
//           • disabled vehicle: crew dismounts and cross-loads; stuck vehicles back out (3-point recovery)
//         Followers who cannot be seated hold position with an automatic map marker and are picked up later.

"use strict";

/* === 1. STATE ======================================================================================================= */
const CONVOY = { trail: [], s: 0, lastX: 1e9, lastY: 1e9, vehicles: [], halted: false, haltT: 0, contactT: 0, radioT: 0, holdMarks: [], fireT: 0, leaderSp: 0, serial: 0 };
const mSeat = typeof MAX_MINION !== "undefined" ? new Array(MAX_MINION).fill(null) : [];    // {v, s} riding
const mBoard = typeof MAX_MINION !== "undefined" ? new Array(MAX_MINION).fill(null) : [];   // {v, s, t} walking to a door
const mHold = typeof MAX_MINION !== "undefined" ? new Array(MAX_MINION).fill(null) : [];    // {x, y, mark} holding (no seat)
const CV_MOUNT_R = 1400;   // 44 m: followers this close mount up, vehicles this close are taken for the convoy
function mSeatOf(m) { return mSeat[m]; }
function cvSize(m) { const k = mKind[m]; return k === 4 ? 2.5 : k === 1 ? 0.6 : 1; }
function cvCanDrive(m) { const k = mKind[m]; return k === 0 || k === 2 || k === 3 || k >= 5; }
function cvGunner(m) { const k = mKind[m]; return k >= 5 || k === 2; }
function cvSeatOk(v, s, m) {
  if (s.occ || s.type === "d" && v !== VEH.me && !cvCanDrive(m)) return false;
  const sz = cvSize(m);
  if (sz > 2 && !(s.type === "b" || s.type === "t" || (s.type === "m" && v.L >= 72))) return false;
  if (s.type === "r" && !cvGunner(m)) return false;
  return true;
}
function cvSeatScore(s, m) {   // gunners to the gun positions, dogs & melee to the middle, golems to the bed
  const g = cvGunner(m), t = s.type;
  if (mKind[m] === 4) return t === "b" ? 3 : t === "t" ? 2 : 1;
  if (g) return t === "r" ? 5 : t === "w" ? 4 : t === "b" ? 4 : t === "t" ? 3 : 1;
  return t === "m" ? 4 : t === "w" ? 3 : 2;
}
function cvFollowers(x, y, r) {
  const out = [];
  if (typeof MAX_MINION === "undefined") return out;
  for (let m = 0; m < MAX_MINION; m++) {
    if (!mAct[m] || mHP[m] <= 0 || mSeat[m] || mBoard[m]) continue;
    if (Math.hypot(mX[m] - x, mY[m] - y) > r) continue;
    if (typeof squadState !== "undefined" && squadState.order === 1 && !mHold[m] && Math.hypot(mX[m] - squadState.ax, mY[m] - squadState.ay) < 140) continue;   // under a HOLD order
    out.push(m);
  }
  return out;
}

/* === 2. MOUNTING UP ================================================================================================= */
function cvAssign(m, v, s) { mBoard[m] = { v, s, t: 0 }; s.occ = { t: "m", m, boarding: 1 }; if (mHold[m]) cvReleaseHold(m); }
function cvSeatNow(m, v, s) { mBoard[m] = null; mSeat[m] = { v, s }; s.occ = { t: "m", m }; if (s.type === "d") { v.drv = "AI"; v.awake = true; } mVX[m] = mVY[m] = 0; }
function cvUnseat(m, place) {
  const S = mSeat[m] || mBoard[m];
  if (S && S.s.occ && S.s.occ.m === m) { S.s.occ = null; if (S.s.type === "d" && S.v.drv === "AI") { S.v.drv = null; S.v.ctl.thr = 0; S.v.ctl.st = 0; S.v.ctl.hb = 1; } }
  const wasSeated = !!mSeat[m];
  mSeat[m] = null; mBoard[m] = null;
  if (place && wasSeated && S) {   // step out through the door on the seat's side
    const v = S.v, side = S.s.side || (Math.random() < 0.5 ? -1 : 1), [dx, dy] = vehToWorld(v, side * (v.L / 2 + 13), -S.s.w * v.D);
    const q = cityFindWalkable(dx, dy, 160, false); mX[m] = q[0]; mY[m] = q[1];
  }
}
// you took a vehicle: the squad boards it, the overflow takes the nearest vehicles and forms a convoy
function convoyOnEnter(v) {
  CONVOY.trail.length = 0; CONVOY.s = 0; CONVOY.lastX = 1e9; CONVOY.halted = false; CONVOY.haltT = 0;
  for (const u of VEH.list) if (u.convoy && u.convoy.serial !== CONVOY.serial) u.convoy = null;
  CONVOY.serial++;
  // riders already in other vehicles keep their seats and simply join the new column
  const list = cvFollowers(v.x, v.y, CV_MOUNT_R);
  if (!list.length) { cvRebuildColumn(); cvAllyBoard(cvAllyFollowers(v.x, v.y, CV_MOUNT_R), [v].concat(CONVOY.vehicles)); return; }
  cvFill(v, list);
  let left = list.filter(m => !mBoard[m] && !mSeat[m]);
  if (left.length && v15FeatureEnabled("T22.MULTI_VEHICLE_CONVOY")) {
    const cand = vehNearby(v.x, v.y, CV_MOUNT_R, u => u !== v && vehCanDrive(u) && !u.dead && !u.drv && !vehOcc(u) && (u.fuel > 0.04 || u.S.horse)).filter(q => !q.wreck);
    // the convoy is built around the group: closest vehicles to the followers first, more seats break ties
    let gx = 0, gy = 0; for (const m of left) { gx += mX[m]; gy += mY[m]; } gx /= left.length; gy /= left.length;
    // closest to the group first, but a car boxed in front AND back (kerbside row) is a poor pick
    const score = q => { const x = q.v ? q.v.x : q.x, y = q.v ? q.v.y : q.y; let sc = Math.hypot(x - gx, y - gy); const P = q.v ? q.v : (q.p ? vehPropPose(q.p) : null); if (P) { const c = Math.cos(P.ang), sn = Math.sin(P.ang), D = P.D || 144; const fr = cityRay(x + c * (D / 2 + 4), y + sn * (D / 2 + 4), x + c * (D / 2 + 70), y + sn * (D / 2 + 70), F_MOVE, 12), bk = cityRay(x - c * (D / 2 + 4), y - sn * (D / 2 + 4), x - c * (D / 2 + 70), y - sn * (D / 2 + 70), F_MOVE, 12); if (fr.hit && bk.hit && fr.t < 0.7 && bk.t < 0.7) sc += 2500; else if (fr.hit && fr.t < 0.5) sc += 400; } return sc; };
    cand.sort((a, b) => score(a) - score(b));
    for (const q of cand) {
      if (!left.some(cvCanDrive)) break;
      const u = vehMakeLive(q, "convoy");
      if (!u || !vehCanDrive(u) || (u.fuel <= 0.04 && !u.S.horse)) continue;
      // driver first (nearest humanoid), then fill
      left.sort((a, b) => Math.hypot(mX[a] - u.x, mY[a] - u.y) - Math.hypot(mX[b] - u.x, mY[b] - u.y));
      const drv = left.find(cvCanDrive), ds = u.seats.find(s => s.type === "d");
      if (!drv || !ds) continue;
      cvAssign(drv, u, ds);
      u.convoy = { serial: CONVOY.serial, k: 0, st: "board", stuckT: 0, tries: 0, revT: 0, side: 0, idx: 0 };
      cvFill(u, left.filter(m => m !== drv));
      left = left.filter(m => !mBoard[m] && !mSeat[m]);
      if (!left.length) break;
    }
  }
  // nobody left behind silently: the rest hold position, marked on your map
  if (left.length) {
    // Re-entering while overflow is already holding must retire the old
    // shared marker before a replacement is created, not leave stale pins.
    for (const m of left) if (mHold[m]) cvReleaseHold(m);
    cvHold(left);
  }
  cvRebuildColumn();
  cvAllyBoard(cvAllyFollowers(v.x, v.y, CV_MOUNT_R), [v].concat(CONVOY.vehicles));
  const n = list.length - left.length, nv = CONVOY.vehicles.length;
  if (n && !left.length) cvRadio(nv ? "MOUNT UP! " + (nv + 1) + "-VEHICLE CONVOY, CLOSE COLUMN" : "MOUNT UP!", "#c5e1a5");
}
function cvFill(v, list) {
  const seats = v.seats.filter(s => !s.occ);
  // the most constrained riders pick first (a bone golem only fits a bed or a big cabin), then gunners, then the rest
  const rank = m => (cvSize(m) > 2 ? 2 : 0) + (cvGunner(m) ? 1 : 0);
  const order = list.slice().sort((a, b) => rank(b) - rank(a));
  for (const m of order) {
    if (mBoard[m] || mSeat[m]) continue;
    let best = null, bs = -1;
    for (const s of seats) { if (s.occ || s.type === "d" || !cvSeatOk(v, s, m)) continue; const sc = cvSeatScore(s, m); if (sc > bs) { bs = sc; best = s; } }
    if (best) cvAssign(m, v, best);
  }
}
function cvHold(list) {
  let gx = 0, gy = 0; for (const m of list) { gx += mX[m]; gy += mY[m]; } gx /= list.length; gy /= list.length;
  let mark = null;
  if (typeof mapMarkers === "function" && typeof cityWorldM === "function") {
    const [xm, ym] = cityWorldM(gx, gy);
    mark = { x: xm, y: ym, c: 2, s: 3, n: "SQUAD HOLD · NO SEATS (" + list.length + ")", auto: 1 };
    try { mapMarkers().push(mark); } catch (e) { mark = null; }
  }
  for (const m of list) mHold[m] = { x: mX[m], y: mY[m], mark };
  if (mark) CONVOY.holdMarks.push(mark);
  cvRadio(list.length + " HOLDING POSITION — NO SEATS LEFT (MARKED ON MAP)", "#ffd166");
}
function cvReleaseHold(m) {
  const H = mHold[m]; mHold[m] = null;
  if (H && H.mark && !mHold.some(h => h && h.mark === H.mark)) {
    try { const L = mapMarkers(), i = L.indexOf(H.mark); if (i >= 0) L.splice(i, 1); } catch (e) { }
    const i = CONVOY.holdMarks.indexOf(H.mark); if (i >= 0) CONVOY.holdMarks.splice(i, 1);
  }
}
function convoyMountUp(v) {   // horn: anyone within 44 m who isn't riding mounts up (picks up the hold group too)
  const list = cvFollowers(v.x, v.y, CV_MOUNT_R).concat(mHold.map((h, m) => h && mAct[m] && !mSeat[m] && !mBoard[m] && Math.hypot(mX[m] - v.x, mY[m] - v.y) < CV_MOUNT_R * 1.4 ? m : -1).filter(m => m >= 0 && !cvFollowers(v.x, v.y, CV_MOUNT_R).includes(m)));
  if (!list.length) return;
  for (const m of list) if (mHold[m]) cvReleaseHold(m);
  cvFill(v, list);
  const left = list.filter(m => !mBoard[m] && !mSeat[m]);
  for (const u of CONVOY.vehicles) if (left.length) { cvFill(u, left); }
  // With overflow convoys deferred, preserve unseated members and their map
  // marker instead of silently releasing their hold when the horn is used.
  let holding = 0;
  if (!v15FeatureEnabled("T22.MULTI_VEHICLE_CONVOY")) {
    const remaining = list.filter(m => !mBoard[m] && !mSeat[m] && !mHold[m]);
    holding = remaining.length;
    if (holding) cvHold(remaining);
  }
  cvAllyBoard(cvAllyFollowers(v.x, v.y, CV_MOUNT_R), [v].concat(CONVOY.vehicles));
  if (!holding) cvRadio("MOUNTING UP", "#c5e1a5");
}
function convoySwapDriver(v, ds) {
  const m = ds.occ && ds.occ.m;
  ds.occ = null;
  if (m == null) return;
  mSeat[m] = null; mBoard[m] = null;
  const free = v.seats.find(s => !s.occ && s.type !== "d" && cvSeatOk(v, s, m));
  if (free) cvSeatNow(m, v, free); else { const [dx, dy] = vehToWorld(v, (v.L / 2 + 13), 0), q = cityFindWalkable(dx, dy, 160, false); mX[m] = q[0]; mY[m] = q[1]; }
}
// you got out: your car's riders dismount; the column halts in herringbone and its crews dismount for security
function convoyOnExit(v, forced) {
  cvAllyAllOut(null);
  for (const s of v.seats) if (s.occ && s.occ.t === "m") cvUnseat(s.occ.m, true);
  for (let m = 0; m < mBoard.length; m++) if (mBoard[m] && mBoard[m].v === v) cvUnseat(m, false);
  for (const u of CONVOY.vehicles) {
    if (!u.convoy) continue;
    for (const s of u.seats) if (s.occ && s.occ.t === "m") cvUnseat(s.occ.m, true);
    for (let m = 0; m < mBoard.length; m++) if (mBoard[m] && mBoard[m].v === u) cvUnseat(m, false);
    u.convoy = null; u.drv = null; u.ctl.thr = 0; u.ctl.st = 0; u.ctl.hb = 1;
  }
  CONVOY.vehicles.length = 0;
  if (!forced) cvRadio("DISMOUNT — SECURITY 5 AND 25", "#c5e1a5");
}
function convoyEjectAll(v, hurt) {
  if (v === VEH.me) vehExit(true);
  cvAllyAllOut(v);
  for (const s of v.seats) if (s.occ && s.occ.t === "m") { const m = s.occ.m; cvUnseat(m, true); if (hurt) { mHP[m] -= mMax[m] * 0.35; } }
  for (let m = 0; m < mBoard.length; m++) if (mBoard[m] && mBoard[m].v === v) cvUnseat(m, false);
  if (v.convoy) { v.convoy = null; cvRebuildColumn(); }
}
function convoyOnDisabled(v) {
  if (!v.convoy && v !== VEH.me) return;
  if (v === VEH.me) return;   // your call (F) - the column waits
  const crew = v.seats.filter(s => s.occ && s.occ.t === "m").map(s => s.occ.m);
  for (const m of crew) cvUnseat(m, true);
  v.convoy = null; v.drv = null; cvRebuildColumn();
  // cross-load into whatever has seats
  const hosts = [VEH.me].concat(CONVOY.vehicles).filter(u => u && !u.dead);
  let moved = 0;
  for (const u of hosts) { const before = crew.filter(m => mBoard[m] || mSeat[m]).length; cvFill(u, crew); moved += crew.filter(m => mBoard[m] || mSeat[m]).length - before; }
  const left = crew.filter(m => !mBoard[m] && !mSeat[m]);
  if (left.length) cvHold(left);
  cvRadio("V" + ((v.convoyN || 2)) + " DISABLED — " + (moved ? "CROSS-LOADING " + moved : "CREW ON FOOT"), "#ff8a65");
}
// a convoy vehicle that can't go on: its crew gets out and takes free seats in the column (or holds, marked)
function cvAbandon(v) {
  const crew = v.seats.filter(q => q.occ && q.occ.t === "m").map(q => q.occ.m);
  for (const m of crew) cvUnseat(m, true);
  v.convoy = null; v.drv = null; v.ctl.thr = 0; v.ctl.hb = 1; cvRebuildColumn();
  for (const u of [VEH.me].concat(CONVOY.vehicles)) if (u && !u.dead) cvFill(u, crew);
  const left = crew.filter(m => !mBoard[m] && !mSeat[m]);
  if (left.length) cvHold(left);
}
function convoyHitOccupant(v, s, dmg) {
  if (!s.occ) return;
  if (s.occ.t === "P") { if (player && !(player.invulnT > 0)) { const arm = player.armor || 0; player.hp -= Math.max(0.5, dmg * (100 / (100 + arm * 8))); player.combatAlertTimer = 2; if (player.hp <= 0 && typeof resolvePlayerDeath === "function") resolvePlayerDeath(); } return; }
  if (s.occ.t === "a") { const j = s.occ.j; if (eAct[j]) { eHP[j] -= dmg; if (eHP[j] <= 0) { cvAllyUnseat(j, true); if (typeof allyTakeHit === "function") allyTakeHit(j, j, 0); } } return; }
  const m = s.occ.m; if (m == null) return;
  mHP[m] -= dmg;
  if (mHP[m] <= 0) cvUnseat(m, true);
}
function convoyJolt(v, dv) { for (const s of v.seats) if (s.occ && s.occ.t === "m") mHP[s.occ.m] -= (dv - 340) * 0.05; }
function convoyOnBump() { }
function cvRadio(msg, col) {
  if (!player) return;
  if (CONVOY.lastMsg === msg && runTime - CONVOY.radioT < 4) return;
  CONVOY.lastMsg = msg; CONVOY.radioT = runTime;
  spawnSpeech(player.x, player.y - 58, "📻 " + msg, col || "#c5e1a5", 2.2);
  if (typeof sfx === "function") { sfx(1200, 900, 0.05, "square", 0.04); setTimeout(() => sfx(900, 1200, 0.05, "square", 0.04), 90); }
}

/* === 3. THE COLUMN: march order, trail, doctrine intervals ========================================================== */
function cvRebuildColumn() {
  const L = VEH.list.filter(u => u.convoy && u.convoy.serial === CONVOY.serial && !u.dead && u !== VEH.me);
  const me = VEH.me;
  if (me) L.sort((a, b) => Math.hypot(a.x - me.x, a.y - me.y) - Math.hypot(b.x - me.x, b.y - me.y));
  CONVOY.vehicles = L;
  L.forEach((u, i) => { u.convoy.k = i + 1; u.convoyN = i + 2; u.convoy.sector = i === L.length - 1 && L.length > 1 ? "rear" : (i % 2 === 0 ? "left" : "right"); });
  if (me) { me.convoyN = L.length ? 1 : 0; me.sector = "front"; }
}
function cvTrailRecord() {
  const v = VEH.me; if (!v) return;
  const T = CONVOY.trail, dx = v.x - CONVOY.lastX, dy = v.y - CONVOY.lastY, d = Math.hypot(dx, dy);
  if (!T.length) { T.push({ x: v.x, y: v.y, s: 0 }); CONVOY.lastX = v.x; CONVOY.lastY = v.y; CONVOY.s = 0; return; }
  if (d < 12) return;
  CONVOY.s += d; T.push({ x: v.x, y: v.y, s: CONVOY.s }); CONVOY.lastX = v.x; CONVOY.lastY = v.y;
  if (T.length > 1400) T.splice(0, T.length - 1400);
}
function cvLeadS() { const v = VEH.me; return CONVOY.s + (v ? Math.hypot(v.x - CONVOY.lastX, v.y - CONVOY.lastY) : 0); }
function cvTrailAt(s) {   // point + heading on the trail at arclength s (binary search)
  const T = CONVOY.trail; if (!T.length) return null;
  if (s >= T[T.length - 1].s) { const a = T[T.length - 1], v = VEH.me; return v ? { x: v.x, y: v.y, h: v.ang } : { x: a.x, y: a.y, h: 0 }; }
  if (s <= T[0].s) { const b = T[Math.min(1, T.length - 1)]; return { x: T[0].x, y: T[0].y, h: Math.atan2(b.y - T[0].y, b.x - T[0].x) }; }
  let lo = 0, hi = T.length - 1;
  while (hi - lo > 1) { const mid = (lo + hi) >> 1; if (T[mid].s < s) lo = mid; else hi = mid; }
  const a = T[lo], b = T[hi], f = (s - a.s) / Math.max(1e-6, b.s - a.s);
  return { x: a.x + (b.x - a.x) * f, y: a.y + (b.y - a.y) * f, h: Math.atan2(b.y - a.y, b.x - a.x) };
}
function cvProject(v) {   // nearest trail arclength to the vehicle (windowed search around its last index)
  const T = CONVOY.trail, c = v.convoy; if (!T.length) return { s: 0, d: 1e9 };
  let lo = 0, hi = T.length - 1;
  if (c.lastS != null) { let i = 0, j = T.length - 1; while (j - i > 1) { const mid = (i + j) >> 1; if (T[mid].s < c.lastS) i = mid; else j = mid; } lo = Math.max(0, i - 60); hi = Math.min(T.length - 1, i + 90); }
  let best = 1e18, bi = lo;
  for (let i = lo; i <= hi; i++) { const d = (T[i].x - v.x) ** 2 + (T[i].y - v.y) ** 2; if (d < best) { best = d; bi = i; } }
  c.lastS = T[bi].s;
  return { s: T[bi].s, d: Math.sqrt(best) };
}
// doctrine interval (px between bumpers): 2 × mph metres (min 20 m), ×0.5 for the screen; tighter in town, closer under fire
function cvGap(spdPx) {
  const mph = spdPx / VPX * 2.237;
  const urban = !(typeof cityMacroClass === "function" && player && (() => { const [xm, ym] = cityWorldM(player.x, player.y); const c = cityMacroClass(Math.floor(xm / 1000), Math.floor(ym / 1000)); return c <= 1; })());
  let m = Math.max(urban ? 8 : 14, mph * 0.6);                   // 2 × mph (min 20 m) at 0.3 screen scale
  m = Math.min(30, m) * (CONVOY.contactT > 0 ? 0.8 : 1);
  return m * VPX;
}

/* === 4. CONVOY DRIVERS ============================================================================================== */
function cvSpotClear(v, x, y, h) {   // would the vehicle fit at this pose (tiles + other vehicles)?
  const c = Math.cos(h), s = Math.sin(h);
  for (let fy = -0.5; fy <= 0.5; fy += 0.25) for (let fx = -0.5; fx <= 0.5; fx += 0.5) {
    const px = x + c * fy * v.D - s * fx * v.L, py = y + s * fy * v.D + c * fx * v.L, f = cityFlagsAt(px, py);
    if ((f & F_MOVE) && !(v.S.hover && (f & (F_LOW | F_WATER)))) return false;
  }
  for (const u of VEH.list) if (u !== v && !u.far && Math.hypot(u.x - x, u.y - y) < (Math.max(u.D, u.L) + Math.max(v.D, v.L)) * 0.5) return false;
  return true;
}
// Lightweight traffic is outside VEH.list until promoted after impact.
function cvTrafficPoseClear(v, x, y, h, horizon = 0) {
  if (typeof TRF === "undefined" || !TRF.on || !Array.isArray(TRF.cars)) return true;
  const box = { cx:x, cy:y, c:Math.cos(h), s:Math.sin(h), hf:v.D * .5 + 12, hw:v.L * .5 + 12 };
  for (const t of TRF.cars) {
    if (!t || t.dead) continue;
    const tx = t.x * 32 - CITY.orx, ty = t.y * 32 - CITY.ory, len = t.lpx, wid = t.wpx;
    if (![tx, ty, len, wid, t.ang].every(Number.isFinite) || len <= 0 || wid <= 0) return false;
    // Parking may request a short straight-line traffic prediction as well as
    // the present footprint. It is a bounded precaution, not a prediction
    // of junction turns or a guarantee against an uncooperative vehicle.
    if (horizon > 0 && t.v != null && (!Number.isFinite(t.v) || t.v < 0)) return false;
    const speed = Number.isFinite(t.v) ? t.v * 32 : 0;
    if (!Number.isFinite(speed)) return false;
    const steps = horizon > 0 && speed > 0 ? 2 : 0;
    for (let j = 0; j <= steps; j++) {
      const d = steps ? speed * horizon * j / steps : 0;
      const ox = tx + Math.cos(t.ang) * d, oy = ty + Math.sin(t.ang) * d;
      if (![ox, oy].every(Number.isFinite)) return false;
      if (Math.hypot(ox - x, oy - y) > Math.hypot(box.hf, box.hw) + Math.hypot(len, wid) * .5 + 8) continue;
      const other = { cx:ox, cy:oy, c:Math.cos(t.ang), s:Math.sin(t.ang), hf:len * .5 + 8, hw:wid * .5 + 8 };
      if (vehSAT(box, other)) return false;
    }
  }
  return true;
}
// Check a conservative swept footprint before and throughout a straight
// reverse; never assume the lane behind remains clear of moving traffic.
function cvBackClear(v, distance) {
  const fx = Math.cos(v.ang), fy = Math.sin(v.ang);
  for (let d = 12; d <= distance; d += 12) {
    const x = v.x - fx * d, y = v.y - fy * d;
    // The normal pose check covers terrain and live rigid bodies. Halt-pose
    // checks add the on-foot player, pedestrians and unseated squad members.
    if (!cvSpotClear(v, x, y, v.ang) || !cvHaltPoseClear(v, x, y, v.ang)) return false;
    // Repeated each reversing frame so newly arriving traffic stops it.
    if (!cvTrafficPoseClear(v, x, y, v.ang)) return false;
  }
  return true;
}
// A stationary rejoining car can be touching a stationary column car whose
// shoulder plan is waiting. Permit a short straight reverse only if sampled
// motion separates both padded footprints monotonically. All other vehicles
// retain the conservative normal clearance, as do terrain, people and traffic.
// Bounded samples cannot guarantee continuous collision-free motion.
function cvYieldBackClear(v, distance, peer) {
  if (!v.convoy || v.convoy.st !== 'rejoin' || !peer || peer.convoy?.st !== 'column' ||
      !(peer.convoy.planRetryAt > runTime) || Math.hypot(peer.vx, peer.vy) > 3 || Math.abs(peer.w) > .05 ||
      ![v.x,v.y,v.ang,v.L,v.D,peer.x,peer.y,peer.ang,peer.L,peer.D,peer.vx,peer.vy,peer.w,distance].every(Number.isFinite)) return false;
  const fx = Math.cos(v.ang), fy = Math.sin(v.ang), other = vehBox(peer, {}), own = vehBox(v, {});
  const physical = vehSAT(own, other);
  if (physical && physical.depth > 1) return false;
  const padded = { cx:v.x, cy:v.y, c:fx, s:fy, hf:v.D * .5 + 12, hw:v.L * .5 + 12 };
  const initial = vehSAT(padded, other), initialDistance = Math.hypot(v.x - peer.x, v.y - peer.y);
  // The old circular check may still be blocked after the padded rectangles
  // have separated. Continue only while this same peer is still nearby.
  if (!initial && initialDistance >= (Math.max(peer.D, peer.L) + Math.max(v.D, v.L)) * .5 + 12) return false;
  let lastDepth = initial ? initial.depth : 0, lastPhysicalDepth = physical ? physical.depth : 0, lastDistance = initialDistance;
  for (let d = 3; d <= distance; d += 3) {
    const x = v.x - fx * d, y = v.y - fy * d;
    const separation = Math.hypot(x - peer.x, y - peer.y);
    if (!(separation > lastDistance) || !cvHaltStaticPoseClear(v, x, y, v.ang) ||
        !cvHaltPoseClear(v, x, y, v.ang) || !cvTrafficPoseClear(v, x, y, v.ang, 1)) return false;
    for (const u of VEH.list) {
      if (u === v || u === peer || u.far) continue;
      if (Math.hypot(u.x - x, u.y - y) < (Math.max(u.D, u.L) + Math.max(v.D, v.L)) * .5) return false;
    }
    const hit = vehSAT({ ...padded, cx:x, cy:y }, other), depth = hit ? hit.depth : 0;
    const real = vehSAT({ ...own, cx:own.cx - fx * d, cy:own.cy - fy * d }, other), realDepth = real ? real.depth : 0;
    if (depth > lastDepth + .02 || realDepth > lastPhysicalDepth + .02) return false;
    lastDepth = depth; lastPhysicalDepth = realDepth; lastDistance = separation;
  }
  return lastDepth === 0;
}
// Never catch up by teleporting a vehicle whose body is in either the last
// painted camera or the current calculated camera. Unknown views fail closed.
function cvOutsideViews(v, x, y) {
  const previous = typeof TRF !== "undefined" ? TRF.view : null; let current;
  try { current = typeof camView === "function" ? camView(140) : null; } catch (_) { return false; }
  if (!v || !previous || !current || ![x,y,v.L,v.D,previous.l,previous.t,previous.w,previous.h,current.left,current.top,current.vw,current.vh].every(Number.isFinite) ||
      v.L <= 0 || v.D <= 0 || previous.w <= 0 || previous.h <= 0 || current.vw <= 0 || current.vh <= 0) return false;
  const margin = Math.hypot(v.L, v.D) / 2 + 60;
  const outside = (l,t,w,h) => x + margin < l || x - margin > l + w || y + margin < t || y - margin > t + h;
  return outside(previous.l,previous.t,previous.w,previous.h) && outside(current.left,current.top,current.vw,current.vh);
}
function convoyStep(dt) {
  if (!VEH.me) { for (const u of CONVOY.vehicles) if (u.convoy) { u.ctl.thr = 0; u.ctl.hb = 1; } }
  else cvTrailRecord();
  const me = VEH.me, lsp = me ? Math.hypot(me.vx, me.vy) : 0;
  CONVOY.leaderSp += (lsp - CONVOY.leaderSp) * Math.min(1, dt * 3);
  if (CONVOY.contactT > 0) CONVOY.contactT -= dt;
  if (me && (runTime - (me.lastHit || -9) < 0.6)) CONVOY.contactT = 4;
  // halt detection (leader stopped ≥ 2.2 s, not under fire) → herringbone
  if (lsp < 25) CONVOY.haltT += dt; else if (lsp > 70) { CONVOY.haltT = 0; if (CONVOY.halted) { CONVOY.halted = false; for (const u of CONVOY.vehicles) if (u.convoy) u.convoy.st = "rejoin"; } }
  if (!CONVOY.halted && CONVOY.haltT > 2.2 && CONVOY.contactT <= 0 && CONVOY.vehicles.length) { CONVOY.halted = true; cvRadio("HALT — HERRINGBONE, SECURITY OUT", "#80deea"); }
  let gapAcc = me ? me.D / 2 : 0;
  const sL = cvLeadS(), gap = cvGap(Math.max(lsp, CONVOY.leaderSp));
  for (let i = 0; i < CONVOY.vehicles.length; i++) {
    const v = CONVOY.vehicles[i];
    if (!v.convoy || v.dead) continue;
    gapAcc += gap + v.D / 2 + (i > 0 ? CONVOY.vehicles[i - 1].D / 2 : 0);
    if (v.convoy.st === "board") { const crewReady = v.seats.every(s => !s.occ || !s.occ.boarding); const drv = v.seats.find(s => s.type === "d"); if (drv && drv.occ && !drv.occ.boarding && (crewReady || runTime - (v.convoy.t0 || (v.convoy.t0 = runTime)) > 6)) v.convoy.st = "join"; else { v.ctl.thr = 0; v.ctl.hb = 1; continue; } }
    if (v.drv !== "AI") { v.ctl.thr = 0; v.ctl.hb = 1; continue; }
    if (v.fuel <= 0 && !v.S.horse) { if (!v.convoy.dry) { v.convoy.dry = 1; cvRadio("V" + v.convoyN + " OUT OF FUEL", "#ffab40"); } }
    cvDrive(v, dt, sL - gapAcc, gap, i);
  }
  if (me) { CONVOY.vehicles = CONVOY.vehicles.filter(u => u.convoy && !u.dead); }
}
// Only let a stopped-leader rejoin move through the spacing cap when its
// predicted slow forward arc consistently increases leader separation.
// These bounded samples fail closed for terrain, vehicles, people and traffic.
function cvRetreatClear(v, a) {
  const leader = VEH.me;
  if (!leader || ![leader.x, leader.y, leader.vx, leader.vy, v.x, v.y, v.vx, v.vy, v.ang, v.w, a].every(Number.isFinite) || Math.hypot(leader.vx, leader.vy) >= 10) return false;
  const steer = Math.max(-1, Math.min(1, a * 2)), wb = Math.max(30 * (v.k || 1), v.D * .62);
  const curv = Math.tan(steer * v.S.st) / wb;
  let last = Math.hypot(v.x - leader.x, v.y - leader.y);
  for (let j = 1; j <= 8; j++) {
    const d = 12 * j, ang = v.ang + curv * d;
    const x = v.x + Math.cos(v.ang + curv * d * .5) * d, y = v.y + Math.sin(v.ang + curv * d * .5) * d;
    const distance = Math.hypot(x - leader.x, y - leader.y);
    if (distance <= last || !cvSpotClear(v, x, y, ang) || !cvHaltPoseClear(v, x, y, ang) || !cvTrafficPoseClear(v, x, y, ang)) return false;
    last = distance;
  }
  return true;
}
// A halted peer's chosen shoulder is reserved ground: two followers must not
// pick the same pose, and a re-plan must not target beside a parked body.
function cvHaltPeerTargetClear(v, x, y) {
  if (typeof CONVOY === 'undefined' || !CONVOY.vehicles) return true;
  for (const u of CONVOY.vehicles) {
    if (u === v || !u.convoy || u.dead) continue;
    const p = u.convoy;
    if (p.st !== 'herring' && !(p.st === 'column' && p.planRetryAt > runTime)) continue;
    if (!Number.isFinite(p.hx) || !Number.isFinite(p.hy)) continue;
    if (Math.hypot(x - p.hx, y - p.hy) < (Math.max(u.L, u.D) + Math.max(v.L, v.D)) * .5 + 14) return false;
  }
  return true;
}
// Do not select a shoulder whose *approach* the halt guard would immediately
// brake against (terrain, peers, people, traffic). Coarse arc samples are a
// planning aid; the per-frame guard stays the safety net.
function cvHaltApproachClear(v, x, y) {
  if (!Number.isFinite(x) || !Number.isFinite(y)) return false;
  const total = Math.hypot(x - v.x, y - v.y);
  if (!(total > 0) || !Number.isFinite(total)) return false;
  const dh = vehAngDiff(Math.atan2(y - v.y, x - v.x), v.ang), steer = Math.max(-1, Math.min(1, dh * 2));
  const wb = Math.max(30 * (v.k || 1), v.D * .62), samples = Math.max(4, Math.min(20, Math.ceil(total / 24)));
  for (const st of [0, steer]) {
    const curv = Math.tan(st * v.S.st) / wb;
    for (let j = 1; j <= samples; j++) {
      const d = total * j / samples, ang = v.ang + curv * d;
      const px = v.x + Math.cos(v.ang + curv * d * .5) * d, py = v.y + Math.sin(v.ang + curv * d * .5) * d;
      if (!cvHaltStaticPoseClear(v, px, py, ang) || !cvHaltPoseClear(v, px, py, ang) || !cvTrafficPoseClear(v, px, py, ang, 1)) return false;
    }
  }
  return true;
}
// Keep a stopped shoulder target out of the known lightweight traffic lanes,
// including lanes with no car currently nearby. The road-link projection is
// bounded/approximate; it does not certify junction turns or unsampled roads.
function cvHaltSpotStripClear(v, x, y, h) {
  // 15.1.3: the relaxed pass may skip the traffic-sensitive approach arc, but
  // terrain never leaves. A spot whose last ~150 px of lane-axis run-in sits
  // in a wall or prop row is NOT endpoint-safe: committing to it under the
  // target lock strands the car reversing forever (the A10 pin-oscillation).
  for (let j = 1; j <= 5; j++) { const px = x - Math.cos(h) * j * 30, py = y - Math.sin(h) * j * 30; if (!cvHaltStaticPoseClear(v, px, py, h)) return false; }
  return cvHaltStaticPoseClear(v, x, y, h);
}
function cvHaltLaneClear(v, x, y) {
  if (typeof TRF === 'undefined' || !TRF.on) return true;
  const net = TRF.net;
  if (!net || TRF.pending || !Array.isArray(net.links) || !Number.isFinite(net.k) || net.k <= 0 || typeof trfAt !== 'function') return false;
  if (![v.D, v.L, x, y, CITY.orx, CITY.ory].every(Number.isFinite) || v.D <= 0 || v.L <= 0) return false;
  const xm = (x + CITY.orx) / 32, ym = (y + CITY.ory) / 32;
  // Match the traffic AI's conservative circular live-vehicle obstacle,
  // plus an extra margin for lateral settling and numerical noise.
  // A parked car may settle up to 18 px short of its target; reserve that
  // tolerance as well as a small additional margin in the planned clearance.
  // 15.1.3-part15 (REV2 Q3): a shoulder-parked car projects its LATERAL
  // half-width at a slight angle onto the lane axis — the old length-based
  // isotropic radius (72 + 40k + 24 = 136 px) rejected every legal shoulder
  // offset in the planner ladder and created the A10 dead band.
  const latHalf = v.L * 0.5 + v.D * 0.12;
  // REV2's lateral projection with the contract the old isotropic ring was
  // actually protecting: run1518 requires EVERY point within ±120 px of a live
  // lane centreline to stay non-clear (curve/junction samples), and the planner
  // ladder needs the extra=64 step (135.6 px) to be feasible for A10. So the
  // clearance must sit inside (120, 135.6]: latHalf(49.3) + 20·k + 52 ≈ 121–125
  // px satisfies both; 136 was a geometry error of composition that only worked
  // by making the whole ladder dead.
  const clearance = (latHalf + 20 * net.k + 52) / 32;
  for (const L of net.links) {
    if (!L || !Array.isArray(L.pts) || L.pts.length < 4 || L.pts.length % 2 || !L.cum || !L.nx || !L.ny ||
        L.cum.length < L.pts.length / 2 || L.nx.length < L.pts.length / 2 || L.ny.length < L.pts.length / 2 ||
        !Number.isFinite(L.L) || L.L <= 0 || !Number.isFinite(L.w) || L.w <= 0 || ![-1,0,1].includes(L.ow) ||
        !Number.isInteger(L.lanes) || L.lanes < 1 || L.lanes > 3) return false;
    // Road normals may be mitered to twice their nominal width at bends.
    const p = L.pts, reach = clearance + L.w + 2 * net.k;
    for (let j = 0; j + 3 < p.length; j += 2) {
      const ax = p[j], ay = p[j+1], bx = p[j+2], by = p[j+3];
      if (![ax, ay, bx, by, L.cum[j/2], L.cum[j/2+1]].every(Number.isFinite)) return false;
      if (xm < Math.min(ax, bx) - reach || xm > Math.max(ax, bx) + reach ||
          ym < Math.min(ay, by) - reach || ym > Math.max(ay, by) + reach) continue;
      const s0 = L.cum[j/2], s1 = L.cum[j/2+1];
      if (!(s1 > s0)) continue;
      for (const dir of (L.ow ? [L.ow] : [1, -1])) for (let q = 0; q < L.lanes; q++) {
        // Project onto the lane segment itself, not its road centreline;
        // changing miter normals can make those projections differ at bends.
        const a = trfAt(L, dir, dir > 0 ? s0 : L.L - s0, q, null);
        const b = trfAt(L, dir, dir > 0 ? s1 : L.L - s1, q, null);
        if (!a || !b || ![a[0], a[1], b[0], b[1]].every(Number.isFinite)) return false;
        const dx = b[0] - a[0], dy = b[1] - a[1], len2 = dx*dx + dy*dy;
        const t = len2 > 0 ? Math.max(0, Math.min(1, ((xm-a[0])*dx + (ym-a[1])*dy) / len2)) : 0;
        if (Math.hypot(xm - (a[0]+dx*t), ym - (a[1]+dy*t)) < clearance) return false;
      }
    }
  }
  return true;
}
function cvDriveNormal(v, dt, sTarget, gap, i) {
  const c = v.convoy, cs = Math.cos(v.ang), sn = Math.sin(v.ang), vf = v.vx * cs + v.vy * sn, top = v.S.top * VPX;
  if (!CONVOY.trail.length || !VEH.me) { v.ctl.thr = vf > 10 ? -1 : 0; v.ctl.hb = 1; return; }
  v.ctl.hb = 0;
  const P = cvProject(v), lead = Math.max(Math.hypot(VEH.me.vx, VEH.me.vy), CONVOY.leaderSp);
  let tx, ty, vDes, haltJoin = false, spacingCap = false;
  const err = P.s - sTarget;                       // > 0: ahead of my slot (too close) · < 0: behind
  // out of your sight, a vehicle that is wedged or has fallen far behind rejoins the column at its slot
  // no progress along the trail for 3 s while we should be catching up = wedged (reversing / see-sawing counts as stuck)
  if (c.progT == null || P.s > c.progS + 40 || CONVOY.halted || err > -120) { c.progS = P.s; c.progT = runTime; }
  c.stuckAcc = runTime - c.progT;
  const unseen = Math.hypot(v.x - player.x, v.y - player.y) > 820 && !(typeof cityVisibleAt === "function" && cityVisibleAt(v.x, v.y) && Math.hypot(v.x - player.x, v.y - player.y) < 1100);
  if (unseen && !CONVOY.halted && (c.stuckAcc > 3 || err < -1100 || (P.d > 320 && runTime - (c.joinT || (c.joinT = runTime)) > 6)) && runTime - (c.snapT || 0) > 3) {
    const pt = cvTrailAt(Math.max(0, sTarget));
    if (pt && cvOutsideViews(v, v.x, v.y) && cvOutsideViews(v, pt.x, pt.y) && cvSpotClear(v, pt.x, pt.y, pt.h)) {
      v.x = pt.x; v.y = pt.y; v.ang = pt.h; v.vx = Math.cos(pt.h) * lead * 0.8; v.vy = Math.sin(pt.h) * lead * 0.8; v.w = 0; v.steerA = 0;
      c.lastS = null; c.stuckAcc = 0; c.progT = null; c.tries = 0; c.revT = 0; c.fwdT = 0; c.snapT = runTime; c.st = "go"; c.unparked = true; c.pinTries = 0; c.pinFails = 0;
      return;
    }
  }
  // A late vehicle must first close up to its slot; stopping immediately while
  // hundreds of pixels behind can strand the column after the leader halts.
  // Keep normal obstacle feelers and the leader-spacing cap active while joining.
  // While the leader is halted the nominal slots trail far behind a stationary
  // car and the real column compresses in front of them (15.1.3 evidence: err
  // -246/-485 with the cars parked beside the leader). Both select windows must
  // span the compressed column or no released car can ever re-plan.
  // A stable halt (not merely the sticky first frames after pulling away) also
  // needs the compressed-column window: the stopped leader cannot pull a late
  // follower back to its nominal slot. Require both a settled halt timer and
  // near-zero leader speed so fresh-drive followers do not park mid-lane.
  const settledHalt = CONVOY.halted && CONVOY.haltT > 3.2 && lead < 25;
  const eligBand = c.pinFails || settledHalt ? 2.4 : 0.8;
  if (CONVOY.halted && c.st !== "herring" && err < -gap * eligBand) c.st = "rejoin";
  // A follower already marked rejoin during the moving-to-stopped transition
  // must be released back into the halt planner once the leader is settled and
  // the compressed column is within this same bounded selection window.
  if (settledHalt && c.st === "rejoin" && Math.abs(err) < gap * eligBand) c.st = "go";
  // halted: herringbone - pull off alternately right / left at ~45°, road kept clear
  if (CONVOY.halted && c.st !== "rejoin") {
    if (c.st !== "herring" && Math.abs(vf) < 30 && Math.abs(err) < gap * eligBand) {
      const preferred = (i % 2 === 0) ? 1 : -1, base = cvTrailAt(Math.min(P.s + 40, cvLeadS() - 60)) || { x: v.x, y: v.y, h: v.ang };
      const off = v.L * 0.9 + 14, trafficK = typeof TRF !== 'undefined' && TRF.on && TRF.net ? TRF.net.k : 1;
      c.st = "column";
      // Prefer alternating shoulders, then farther candidates if necessary
      // to leave known lanes open. No clear shoulder means wait and retry.
      const offsets = typeof TRF !== 'undefined' && TRF.on ? [0,64,128,192,256,320] : [0];
      // First pass demands a clear approach arc; if every candidate fails,
      // a relaxed pass commits the nearest endpoint-safe spot so the car at
      // least starts moving and the per-frame guard can steer or re-time the
      // plan, instead of two retries oscillating on identical strictness.
      let planned = null;
      for (let pass = 0; pass < 2 && !planned; pass++) {
        const strict = pass === 0;
        for (const side of [preferred, -preferred]) {
          for (const extra of offsets) {
            const d = off + extra * trafficK;
            const hx = base.x - Math.sin(base.h) * d * side + Math.cos(base.h) * 36, hy = base.y + Math.cos(base.h) * d * side + Math.sin(base.h) * 36;
            if (cvHaltLaneClear(v, hx, hy) && !cityCircleBlocked(hx, hy, Math.max(v.L, 40) * 0.5, false) && cvSpotClear(v, hx, hy, base.h) && cvHaltPeerTargetClear(v, hx, hy) && (strict ? cvHaltApproachClear(v, hx, hy) : cvHaltSpotStripClear(v, hx, hy, base.h))) { planned = { hx, hy, side }; break; }
          }
          if (planned) break;
        }
      }
      if (planned) { c.st = "herring"; c.hx = planned.hx; c.hy = planned.hy; c.side = planned.side; c.hAng = base.h; c.planT = runTime; c.lastApproachD = null; c.orbitT = 0; c.tries = 0; c.refined = 0; c.pinTries = 0; c.pinFails = 0; }
      if (c.st !== 'herring') { c.planRetryAt = runTime + 2; c.stuckT = 0; }
    }
    if (c.st === "herring") {
      const d = Math.hypot(c.hx - v.x, c.hy - v.y);
      if (d < 18) { c.pinFails = 0; v.ctl.thr = vf > 8 ? -1 : 0; v.ctl.st = 0; v.ctl.hb = vf < 8 ? 1 : 0; return; }
      tx = c.hx; ty = c.hy; vDes = Math.min(110, d * 2);
      // A spot abeam of the nose sits inside the steering-bound turning
      // circle, so direct pursuit can only ever orbit it (this is what the
      // old forward-extension accidentally fixed, at the cost of replacing
      // the endpoint). Pursue a virtual aim point short ahead of the spot
      // along its own heading until the car is close and aligned enough to
      // curl in directly; the final pose remains the validated spot.
      if (c.keepAim && Number.isFinite(c.hAng) && (d > 64 && Math.abs(vehAngDiff(c.hAng, v.ang)) > .35)) {
        // REV2 Q1: the +240 px virtual lead aimed into unvalidated terrain past
        // the spot and drove the halt-guard arc into walls (arcS 6..8 pins).
        // Cap the lead and drop it inside 64 px so the final pose is the spot.
        const leadD = Math.min(48, d * 0.4);
        const ax = c.hx + Math.cos(c.hAng) * leadD, ay = c.hy + Math.sin(c.hAng) * leadD;
        if (Math.hypot(ax - v.x, ay - v.y) > 24) { tx = ax; ty = ay; }
      }
    } else { v.ctl.thr = vf > 8 ? -1 : 0; v.ctl.st = 0; v.ctl.hb = Math.abs(vf) < 8 ? 1 : 0; return; }
  } else {
    if (c.st === "herring" || c.st === "column") { c.st = "rejoin"; c.pinTries = 0; c.terrainWait = 0; }
    // pure pursuit on the leader's breadcrumbs; join the trail first if we are off it
    const Ld = Math.max(70, Math.min(260, Math.abs(vf) * 0.5 + 60));
    // A stopped leader cannot pull an off-trail vehicle back by moving.
    // Aim at the nearest trail point, or the slot behind it if we projected
    // ahead of that slot; do not aim farther toward the stopped leader.
    haltJoin = CONVOY.halted && c.st === "rejoin" && P.d > 90;
    const aim = haltJoin ? cvTrailAt(Math.max(0, Math.min(P.s, sTarget))) : (P.d > 140 ? cvTrailAt(P.s + 160) : cvTrailAt(P.s + Ld));
    if (!aim) return;
    tx = aim.x; ty = aim.y;
    if (P.d < 90 && c.st !== "go" && !(CONVOY.halted && err < -gap * 0.8)) c.st = "go";
    // speed: hold the slot, catch up when behind (catch-up speed above the march rate), never past the leader
    const catchUp = Math.min(top, lead * 1.25 + 110);
    vDes = err < -gap * 0.4 ? catchUp : Math.max(0, lead - err * 1.1);
    // Slot error alone can be positive while the vehicle is safely behind
    // the leader but stranded off the trail. Creep only toward a point no
    // farther forward than the slot. The spacing cap and obstacle feelers
    // below still override this request, including when the leader is close.
    if (haltJoin) vDes = Math.max(vDes, Math.min(90, P.d * .5));
    if (CONVOY.contactT > 0 && err < 0) vDes = Math.min(top, vDes + 80);     // close up and drive through
    spacingCap = P.s + v.D * 0.5 >= cvLeadS() - VEH.me.D * 0.5 - gap * 0.35;
  }
  let a = vehAngDiff(Math.atan2(ty - v.y, tx - v.x), v.ang);
  // Bearing-only pursuit cannot curl into a spot inside its own turning
  // circle (the radius is steering-geometry bound, not speed bound), so a
  // car that keeps driving while the gap grows would orbit forever without
  // ever meeting the near-still stuck test below. Trade a short checked
  // reverse for a sharper angle — the same manoeuvre the stuck timer uses.
  if (c.st === 'herring' && !(c.revT > 0) && !(c.fwdT > 0)) {
    const dHalt = Math.hypot(c.hx - v.x, c.hy - v.y);
    const grow = c.lastApproachD == null ? 0 : dHalt - c.lastApproachD;
    c.lastApproachD = dHalt;
    if (dHalt < 460 && Math.abs(a) > 1.35 && grow > -6 && Math.abs(vf) > 20) {
      c.orbitT = (c.orbitT || 0) + dt;
      if (c.orbitT > 1.1) {
        c.orbitT = 0; c.tries++; c.revSt = Math.sign(a) || 1; c.revT = 1.1; c.orbitRev = true;
        if (c.tries > 12) { cvRadio("V" + v.convoyN + " PARK APPROACH ABANDONED", "#ffab40"); cvAbandon(v); return; }
      }
    } else c.orbitT = 0;
  } else if (c.st === 'herring') c.lastApproachD = null;
  if (Math.abs(a) > 0.6) vDes = Math.min(vDes, 260); if (Math.abs(a) > 1.2) vDes = Math.min(vDes, 140);
  // look ahead (three feelers) for anything solid - walls, fences, parked cars, live vehicles - and steer around it
  const look = Math.max(80, Math.abs(vf) * 0.8 + 60), fx = v.x + cs * (v.D / 2), fy = v.y + sn * (v.D / 2);
  const feel = (da) => {
    const ux = Math.cos(v.ang + da), uy = Math.sin(v.ang + da), ox = -uy * v.L * 0.35, oy = ux * v.L * 0.35;
    let d = look;
    for (const o of [-1, 0, 1]) { const h = cityRay(fx + ox * o, fy + oy * o, fx + ox * o + ux * look, fy + oy * o + uy * look, F_MOVE, 40); if (h.hit) d = Math.min(d, h.t * look); }
    for (const u of VEH.list) { if (u === v || u.far) continue; const dx = u.x - fx, dy = u.y - fy, along = dx * ux + dy * uy, lat = Math.abs(-dx * uy + dy * ux); if (along > -u.D * 0.3 && along < look + u.D * 0.5 && lat < (u.L + v.L) * 0.5 + 4) d = Math.min(d, Math.max(0, along - u.D * 0.5)); }
    return d;
  };
  const dC = feel(0);
  let block = dC < look ? dC : 1e9;
  if (dC < look * 0.9) { const dL = feel(-0.55), dR = feel(0.55); if (Math.max(dL, dR) > dC + 10) a += dL > dR ? -0.6 : 0.6; }
  if (spacingCap) {
    const vr = -v.vx * sn + v.vy * cs;
    // The slow creep allowance beside a halted leader is only for a path that
    // does not close on the leader's body (F04's leaderSafe contract). A car
    // past its slot retreats toward the trail aim; that must never aim INSIDE
    // the leader's collision envelope — holding is the correct response there.
    const retreatAimClear = !VEH.me || Math.hypot(VEH.me.x - tx, VEH.me.y - ty) > (v.D + VEH.me.D) * .5 + gap * .15;
    const retreat = haltJoin && retreatAimClear && vf >= -2 && vf < 60 && Math.abs(vr) < 8 && Math.abs(v.w) < .3 && cvRetreatClear(v, a);
    vDes = Math.min(vDes, retreat ? 60 : lead * 0.6);
  }
  const wantedSpeed = vDes;
  // Do not creep into a vehicle or wall when the available stopping gap is
  // gone. A clear path immediately restores the normal pursuit speed.
  if (block < 1e9) vDes = Math.min(vDes, Math.max(0, (block - 20) * 1.6));
  // 15.1.3-part16: final metres into a validated spot. At short range the forecast
  // projects this car's footprint beyond the spot into ground the planner never
  // validated, freezing the car at d≈26 forever (vDes ≤ 52 also never arms block
  // recovery). When the spot's own pose re-passes both static and full checks this
  // frame, allow a slow crawl — the swept pose at the endpoint is exactly what was
  // certified at commit.
  if (c.st === 'herring' && Number.isFinite(c.hx) && Math.hypot(c.hx - v.x, c.hy - v.y) < 40 && cvHaltPoseClear(v, c.hx, c.hy, v.ang) && cvHaltStaticPoseClear(v, c.hx, c.hy, v.ang)) vDes = Math.min(30, Math.max(vDes, 22));
  // Distinguish an obstruction from deliberately holding formation. After a
  // wait, try a short straight reverse into checked space. If boxed in, keep
  // braking and recheck periodically rather than forcing through traffic.
  // Use the same stop threshold as the handbrake below. Otherwise a small
  // obstruction gap can force vDes below 5 while never starting this timer.
  if (wantedSpeed > 60 && block < 1e9 && vDes < 5 && Math.abs(vf) < 14 && !(c.revT > 0) && !(c.fwdT > 0)) {
    c.blockWait = (c.blockWait || 0) + dt;
    if (c.blockWait >= 4) {
      const clear = cvBackClear(v, 84);
      const peer = !clear && CONVOY.halted ? VEH.list.find(u => u !== v && u.key && cvYieldBackClear(v, 84, u)) : null;
      if (clear || peer) { c.revT = 1.5; c.yieldReverse = true; c.yieldPeerKey = peer ? peer.key : null; c.blockWait = 0; }
      else c.blockWait = 3;
    }
  } else if (!(c.revT > 0)) c.blockWait = 0;
  // leaving a tight parking spot: back up first if the nose is against something
  if (!c.unparked) {
    c.unparked = true;
    const fr = cityRay(fx, fy, fx + cs * 60, fy + sn * 60, F_MOVE, 10);
    let carAhead = false; for (const u of VEH.list) { if (u === v || u.far) continue; const dx = u.x - fx, dy = u.y - fy, along = dx * cs + dy * sn; if (along > -10 && along < 60 + u.D * 0.5 && Math.abs(-dx * sn + dy * cs) < (u.L + v.L) * 0.5) carAhead = true; }
    if ((fr.hit && fr.t < 0.8) || carAhead) { c.revT = 0.9; c.revSt = Math.sign(a) || 1; }
  }
  // stuck recovery: reverse straight into checked space, then steer toward the path;
  // after a few tries the crew cross-loads into the column (or holds) instead of sitting in a wedged car
  if (c.revT > 0) {
    const normalClear = cvBackClear(v, 84);
    const peer = c.yieldPeerKey && VEH.list.find(u => u.key === c.yieldPeerKey);
    if (!normalClear && !(peer && cvYieldBackClear(v, 84, peer))) { c.revT = 0; c.fwdT = 0; c.yieldReverse = false; c.yieldPeerKey = null; v.ctl.thr = 0; v.ctl.st = 0; v.ctl.hb = 1; return; }
    if (normalClear) c.yieldPeerKey = null;
    const yielding = !!c.yieldReverse;
    c.revT -= dt; v.ctl.thr = yielding ? -0.5 : -0.85; v.ctl.st = c.orbitRev ? -c.revSt : 0; v.ctl.hb = 0;
    if (c.revT <= 0) { c.revT = 0; c.fwdT = yielding ? 0 : 0.9; c.yieldReverse = false; c.yieldPeerKey = null; c.orbitRev = false; }
    return;
  }
  if (c.fwdT > 0 && block <= 20) c.fwdT = 0;
  if (c.fwdT > 0) {
    c.fwdT -= dt; v.ctl.thr = Math.max(-1, Math.min(0.9, (vDes - vf) / 90));
    v.ctl.st = c.revSt; v.ctl.hb = vDes < 5 && Math.abs(vf) < 10 ? 1 : 0;
    return;
  }
  if (vDes > 60 && Math.abs(vf) < 14) {
    c.stuckT += dt;
    if (c.stuckT > 1.4) {
      c.stuckT = 0; c.tries++;
      const l = cityRay(fx, fy, fx + Math.cos(v.ang - 0.8) * 70, fy + Math.sin(v.ang - 0.8) * 70, F_MOVE, 12), r = cityRay(fx, fy, fx + Math.cos(v.ang + 0.8) * 70, fy + Math.sin(v.ang + 0.8) * 70, F_MOVE, 12);
      const freer = (l.hit ? l.t : 1) > (r.hit ? r.t : 1) ? -1 : 1;
      c.revSt = c.tries % 2 ? freer : (Math.sign(a) || freer); c.revT = 1.0;
      if (c.tries > 5) { cvRadio("V" + v.convoyN + " STUCK — CREW CROSS-LOADING", "#ffab40"); cvAbandon(v); }
      return;
    }
  } else { c.stuckT = Math.max(0, c.stuckT - dt); if (Math.abs(vf) > 120) c.tries = 0; }
  v.ctl.st = Math.max(-1, Math.min(1, a * 2.0));
  v.ctl.thr = Math.max(-1, Math.min(1, (vDes - vf) / 90));
  if (CONVOY.debug) c.dbg = { err: Math.round(err), Ps: Math.round(P.s), Pd: Math.round(P.d), sT: Math.round(sTarget), vDes: Math.round(vDes), a: +a.toFixed(2), block: block < 1e9 ? Math.round(block) : -1, st: c.st };
  if (vDes < 5 && Math.abs(vf) < 10) { v.ctl.thr = 0; v.ctl.hb = 1; }
}

// Halt manoeuvres use the ordinary vehicle physics and collision resolution.
// These samples are planning/early-braking aids, not a certified swept path.
// If a suitable shoulder cannot be found, wait instead of forcing a placement.
function cvHaltStaticPoseClear(v, x, y, h) {
  const c = Math.cos(h), s = Math.sin(h);
  for (let fy = -.5; fy <= .5; fy += .25) for (let fx = -.5; fx <= .5; fx += .5) {
    const f = cityFlagsAt(x + c * fy * v.D - s * fx * v.L, y + s * fy * v.D + c * fx * v.L);
    if ((f & F_MOVE) && !(v.S.hover && (f & (F_LOW | F_WATER)))) return false;
  }
  return true;
}
function cvHaltPoseClear(v, x, y, h) {
  const c = Math.cos(h), s = Math.sin(h);
  const box = { cx: x, cy: y, c, s, hf: v.D * .5 + 12, hw: v.L * .5 + 12 };
  for (const u of VEH.list) {
    if (u === v || u.far) continue;
    const radius = Math.hypot(box.hf, box.hw) + Math.hypot(u.D, u.L) * .5;
    if ((x - u.x) ** 2 + (y - u.y) ** 2 > radius * radius) continue;
    // Following traffic yields to a parking car; parking cars yield to all cars.
    if (v.convoy?.st !== 'herring' && u.convoy?.st !== 'herring') continue;
    if (vehSAT(box, vehBox(u, {}))) return false;
  }
  const near = (xx, yy, r) => {
    const dx = xx - x, dy = yy - y;
    return Math.abs(dx * c + dy * s) < box.hf + r && Math.abs(-dx * s + dy * c) < box.hw + r;
  };
  if (player.inVehicle !== 3 && !player.roof && (player.flyAlt || 0) <= 3 && near(player.x, player.y, 10)) return false;
  if (typeof TF !== 'undefined' && TF.on) for (const p of TF.walk) {
    const w = p.w; if (p.alive && w && !w.inside && near(w.x, w.y, 10)) return false;
  }
  for (let m = 0; m < MAX_MINION; m++) {
    if (mAct[m] && !(typeof mSeatOf === 'function' && mSeatOf(m)) && near(mX[m], mY[m], 10)) return false;
  }
  return true;
}
// Halted followers can approach the same crossing from different headings.
// Check nearby live-vehicle footprints at short, matching future times. The
// other car's current velocity/yaw and our present steering are only an
// approximation: this is an early-braking aid, not continuous collision proof.
function cvHaltVehicleForecastClear(v, steer, vf) {
  if (![v.x, v.y, v.ang, v.vx, v.vy, v.L, v.D, steer, vf, v.S.st].every(Number.isFinite)) return false;
  const cs = Math.cos(v.ang), sn = Math.sin(v.ang), side = -v.vx * sn + v.vy * cs;
  const wb = Math.max(30 * (v.k || 1), v.D * .62), turn = Math.tan(steer * v.S.st) / wb;
  for (const u of VEH.list) {
    if (u === v || u.far) continue;
    if (![u.x, u.y, u.ang, u.vx, u.vy, u.w, u.L, u.D].every(Number.isFinite)) return false;
    // Broad phase follows the sampled 1.5-second horizon rather than a fixed
    // radius, so a fast closing car is not silently excluded just for range.
    const reach = Math.hypot(v.D, v.L) * .5 + Math.hypot(u.D, u.L) * .5 + 12 +
      (Math.hypot(v.vx, v.vy) + Math.hypot(u.vx, u.vy) + 24) * 1.5;
    if (Math.hypot(u.x - v.x, u.y - v.y) > reach) continue;
    for (let j = 1; j <= 6; j++) {
      const t = j * .25, half = u.w * t * .5;
      const scale = Math.abs(half) < 1e-6 ? 1 : Math.sin(half) / half;
      const ux = u.x + (u.vx * Math.cos(half) - u.vy * Math.sin(half)) * t * scale;
      const uy = u.y + (u.vx * Math.sin(half) + u.vy * Math.cos(half)) * t * scale;
      const ua = u.ang + u.w * t, other = {cx:ux, cy:uy, c:Math.cos(ua), s:Math.sin(ua), hf:u.D*.5, hw:u.L*.5};
      const d = Math.max(24, vf) * t;
      for (const curv of [0, turn]) {
        const mid = v.ang + curv * d * .5, ang = v.ang + curv * d;
        const own = {cx:v.x + Math.cos(mid)*d - sn*side*t, cy:v.y + Math.sin(mid)*d + cs*side*t,
          c:Math.cos(ang), s:Math.sin(ang), hf:v.D*.5+8, hw:v.L*.5+8};
        if (vehSAT(own, other)) return false;
      }
    }
  }
  return true;
}
function cvDrive(v, dt, target, gap, i) {
  const prior = v.convoy;
  // A failed shoulder plan is a deliberate wait, not a stuck driving
  // attempt. Do not rerun pursuit or accumulate stuck time during retries.
  if (CONVOY.halted && prior?.st === 'column' && prior.planRetryAt) {
    if (runTime < prior.planRetryAt) {
      const vf = v.vx * Math.cos(v.ang) + v.vy * Math.sin(v.ang);
      v.ctl.thr = vf > 8 ? -1 : vf < -8 ? 1 : 0;
      v.ctl.hb = Math.abs(vf) < 8 ? 1 : 0; v.ctl.st = 0;
      return;
    }
    prior.planRetryAt = 0; prior.stuckT = 0;
  }
  const was = prior?.st;
  // Traffic networks rebuild as the player moves or streamed data arrives.
  // Revalidate a selected target when that network changes or becomes pending.
  if (was === 'herring') {
    const active = typeof TRF !== 'undefined' && TRF.on, epoch = active ? TRF.stats?.builds : null;
    if (prior.laneTraffic !== !!active || (active && (prior.laneBuild !== epoch || TRF.pending || !TRF.net))) {
      if (!cvHaltLaneClear(v, prior.hx, prior.hy)) {
        const vf = v.vx * Math.cos(v.ang) + v.vy * Math.sin(v.ang);
        prior.st = 'column'; prior.planRetryAt = runTime + 2; prior.stuckT = 0;
        v.ctl.thr = vf > 8 ? -1 : vf < -8 ? 1 : 0; v.ctl.hb = Math.abs(vf) < 8 ? 1 : 0; v.ctl.st = 0;
        return;
      }
      prior.laneTraffic = !!active; prior.laneBuild = epoch;
    }
  }
  cvDriveNormal(v, dt, target, gap, i);
  const c = v.convoy;
  if (!c || !CONVOY.halted) return;
  if (was === 'herring' || c.st !== 'herring') {
    const vf = v.vx * Math.cos(v.ang) + v.vy * Math.sin(v.ang);
    if (vf > 0 || v.ctl.thr > 0) {
      const steer = Math.max(-1, Math.min(1, v.ctl.st));
      const wb = Math.max(30 * (v.k || 1), v.D * .62), curv = Math.tan(steer * v.S.st) / wb;
      let look = Math.max(96, Math.min(200, vf * vf / 100 + 64));
      // A herringbone car stops AT its spot; never brake for what lies beyond
      // it, and weight the collision forecast by the distance actually left.
      let vfHalt = vf;
      if (c.st === 'herring' && Number.isFinite(c.hx) && Number.isFinite(c.hy)) {
        const dSpot = Math.hypot(c.hx - v.x, c.hy - v.y);
        look = Math.max(12, Math.min(look, dSpot - 12));
        vfHalt = Math.min(Math.max(0, vf), dSpot / 1.5);
      }
      let blocked = vf >= -2 && !cvHaltVehicleForecastClear(v, steer, vfHalt), terrainBlocked = false;
      for (let j = 1; !blocked && j <= 8; j++) {
        const d = look * j / 8, ang = v.ang + curv * d;
        const x = v.x + Math.cos(v.ang + curv * d * .5) * d;
        const y = v.y + Math.sin(v.ang + curv * d * .5) * d;
        if (!cvHaltStaticPoseClear(v, x, y, ang)) { blocked = true; terrainBlocked = true; break; }
        if (!cvHaltPoseClear(v, x, y, ang) || !cvTrafficPoseClear(v, x, y, ang, 1)) { blocked = true; break; }
      }
      if (blocked) {
        // A shoulder can be valid in its planned orientation but blocked for
        // the actual steering arc. A car frozen against such an arc is not
        // failing to park — it lacks room to begin the curl, and buildings do
        // not depart. Work the steering (15.1.3): up to three steered back-outs
        // through the checked reverse chain before the spot is treated as truly
        // unreachable and handed to the avoid/re-plan path.
        if (terrainBlocked && c.st === 'herring' && Math.hypot(v.vx, v.vy) < 8 &&
            Number.isFinite(c.hx) && Number.isFinite(c.hy)) {
          const dPin = Math.hypot(c.hx - v.x, c.hy - v.y);
          c.terrainWait = (c.terrainWait || 0) + dt;
          if (c.terrainWait >= 2) {
            // 15.1.3 lock: the committed spot survives arc-terrain stalls. The old
            // avoid+12 s + re-plan cycle let every stall hand the planner a fresh
            // spot near the nose, whose +240 refinement landed in the same blocked
            // geometry — the target walked and A10 never completed. Now the car
            // works the stall with alternating steered back-outs, and a genuinely
            // unreachable approach ends in the standard cross-load abandon.
            if ((c.pinTries | 0) >= 1) {
              // Try one steered back-out, then release — kill the lock (a stale
              // re-arm would just pin the same unreachable pose), require strict
              // re-selection, and cap the cycles: after two releases the crew
              // cross-loads (A10 fail-closed) instead of cycling forever.
              if ((c.pinFails | 0) >= 2) { cvRadio("V" + v.convoyN + " PARK APPROACH ABANDONED", "#ffab40"); cvAbandon(v); }
              else {
                c.pinFails = (c.pinFails | 0) + 1; c.pinTries = 0; c.terrainWait = 0;
                c.avoidHX = c.hx; c.avoidHY = c.hy; c.avoidUntil = runTime + 12;
                c.hx = NaN; c.hy = NaN; c.keepAim = false; c.hAng = null;
                c.st = 'column'; c.planRetryAt = runTime + 2;
              }
            } else if (dPin > 40 && !(c.revT > 0) && !(c.fwdT > 0)) {
              c.pinTries = (c.pinTries | 0) + 1; c.terrainWait = 0; c.tries = (c.tries || 0) + 1;
              if (c.tries > 12) { cvRadio("V" + v.convoyN + " PARK APPROACH ABANDONED", "#ffab40"); cvAbandon(v); }
              else { c.revSt = (c.pinTries % 2 ? 1 : -1); c.revT = Math.min(2.0, 1.1 + 0.25 * (c.pinTries % 4)); c.orbitRev = true; }
            } else if (dPin <= 40) c.terrainWait = 0;
          }
        } else c.terrainWait = 0;
        // A deliberate safety stop is not a failed driving attempt. Otherwise
        // normal pursuit can increment the stuck counter before this guard
        // brakes, eventually abandoning a car that is correctly yielding.
        c.stuckT = 0;
        v.ctl.thr = vf > 5 ? -1 : 0; v.ctl.hb = vf < 5 ? 1 : 0; v.ctl.st = 0;
        if (!terrainBlocked) { c.stopWait = (c.stopWait || 0) + dt; c.stopTerrain = false; }
      } else {
        c.terrainWait = 0;
        // Deliberate yield stops are not plan failures: the re-arm gets its one
        // fresh refinement pass as before (15.1.5 controls depend on it). Spot
        // *durability* is what 15.1.3 added — a degraded column car whose old
        // committed spot is still valid re-arms it via the resume gate in
        // cvDriveNormal even when slot eligibility for a NEW selection fails.
        if ((c.stopWait || 0) >= 1 && !c.stopTerrain && c.st === 'herring' && Math.abs(vf) < 30) {
          c.st = 'column'; c.planRetryAt = runTime; c.keepAim = false; c.hAng = null;
        }
        c.stopWait = 0;
      }
    } else c.terrainWait = 0;
    return;
  }
  if (c.planRetryAt && runTime < c.planRetryAt) {
    c.st = 'column'; v.ctl.thr = 0; v.ctl.hb = 1; return;
  }
  const base = cvTrailAt(cvProject(v).s), h = base ? base.h : v.ang;
  const fx = Math.cos(h), fy = Math.sin(h), orig = { x: c.hx, y: c.hy };
  // Only a plan-commit frame reaches here (later herring frames return via
  // the was === 'herring' guard). Forward refinement is deliberate: the
  // turning circle is steering-bound, so a spot abeam of the nose is only
  // reachable from a tangent. The historic bug was not the refinement but
  // discarding a VALIDATED spot when no extended candidate passed — that
  // made commit -> reject -> 2 s retry loops never terminate. Refine if a
  // better-aligned forward spot passes every gate; otherwise keep the plan.
  let found = false;
  if (c.refined) found = false; else
  for (const forward of [240, 180, 300, 120, 360]) {
    const x = orig.x + fx * forward, y = orig.y + fy * forward, leader = VEH.me;
    if (c.avoidUntil > runTime && Number.isFinite(c.avoidHX) && Number.isFinite(c.avoidHY) && Math.hypot(x - c.avoidHX, y - c.avoidHY) < 48) continue;
    if (!leader || (x - leader.x) * Math.cos(leader.ang) + (y - leader.y) * Math.sin(leader.ang) > -(v.D + leader.D) * .5 - gap * .35) continue;
    const dh = vehAngDiff(h + Math.sign(c.side || 1) * .5, v.ang);
    let clear = true;
    // Do not skip a close neighbor when the target is several hundred
    // pixels away; check at least as densely as the halt guard's first step.
    const samples = Math.max(10, Math.ceil(Math.hypot(x - v.x, y - v.y) / 12));
    for (let j = 1; j <= samples; j++) {
      const t = j / samples, ang = v.ang + dh * t, px = v.x + (x - v.x) * t, py = v.y + (y - v.y) * t;
      if (!cvHaltStaticPoseClear(v, px, py, ang) || !cvHaltPoseClear(v, px, py, ang) || !cvTrafficPoseClear(v, px, py, ang, 1)) {
        clear = false; break;
      }
    }
    // The line-to-target samples above are not the actual early steering
    // arc. Check both the initial straight movement and the desired turn so
    // a neighbor close to the starting pose cannot be skipped by the plan.
    if (clear) {
      const da = vehAngDiff(Math.atan2(y - v.y, x - v.x), v.ang), steer = Math.max(-1, Math.min(1, da * 2));
      const wb = Math.max(30 * (v.k || 1), v.D * .62);
      for (const st of [0, steer]) {
        const curv = Math.tan(st * v.S.st) / wb;
        for (let j = 1; j <= 8; j++) {
          const d = 12 * j, ang = v.ang + curv * d;
          const px = v.x + Math.cos(v.ang + curv * d * .5) * d, py = v.y + Math.sin(v.ang + curv * d * .5) * d;
          if (!cvHaltStaticPoseClear(v, px, py, ang) || !cvHaltPoseClear(v, px, py, ang) || !cvTrafficPoseClear(v, px, py, ang, 1)) { clear = false; break; }
        }
        if (!clear) break;
      }
    }
    if (clear && cvHaltLaneClear(v, x, y) && !cityCircleBlocked(x, y, Math.max(v.L, 40) * .5, false) && cvHaltPeerTargetClear(v, x, y) && cvHaltApproachClear(v, x, y)) {
      c.hx = x; c.hy = y; c.refined = 1; c.laneTraffic = typeof TRF !== 'undefined' && !!TRF.on;
      c.laneBuild = c.laneTraffic ? TRF.stats?.builds : null; found = true; break;
    }
  }
  if (found) c.keepAim = false;
  else if (c.st === 'herring') {
    // Keep the committed spot (already validated at plan time) and switch on
    // the tangent aim point; reset the approach memory for the new pose.
    c.keepAim = true; c.hAng = h; c.lastApproachD = null; c.orbitT = 0;
  }
}
/* === 5. RIDERS: boarding, gunners on their side, holding groups ===================================================== */
const mAimT = typeof MAX_MINION !== "undefined" ? new Float32Array(MAX_MINION) : [];

function cvSeatWorld(v, s) { return vehToWorld(v, s.u * v.L, -s.w * v.D); }
// the door to walk to: the seat's own side if it is clear, else the other side, else the back (a parked car may be against a wall)
function cvDoorWorld(v, s, fx, fy) {
  const side = s.side || (s.type === "t" ? 0 : 1);
  const cand = s.type === "t" ? [[0, v.D / 2 + 14]] : [[side * (v.L / 2 + 14), -s.w * v.D], [-side * (v.L / 2 + 14), -s.w * v.D], [0, v.D / 2 + 16], [0, -v.D / 2 - 16]];
  let best = null, bd = 1e12;
  for (const [lx, ly] of cand) {
    const p = vehToWorld(v, lx, ly); if (cityCircleBlocked(p[0], p[1], 7, false)) continue;
    const d = fx == null ? 0 : (p[0] - fx) ** 2 + (p[1] - fy) ** 2;   // the side you come from (you slide across inside)
    if (d < bd) { bd = d; best = p; if (fx == null) break; }
  }
  return best || vehToWorld(v, cand[0][0], cand[0][1]);
}
// firing arc of a seat (relative angle to the vehicle heading, + = right side)
function cvArcOk(v, s, rel) {
  const open = vehDoorOpen(v, s.side, s.w) ? 0.3 : 0;
  switch (s.type) {
    case "r": return true;
    case "w": return s.side > 0 ? rel > 0.18 - open && rel < Math.PI - 0.18 + open : rel < -0.18 + open && rel > -Math.PI + 0.18 - open;
    case "b": return s.side > 0 ? rel > -0.2 && rel <= Math.PI : s.side < 0 ? rel < 0.2 && rel >= -Math.PI : true;
    case "t": return Math.abs(rel) > 2.0;
    default: return false;
  }
}
function cvSectorRel(v) { const sec = v === VEH.me ? "front" : v.convoy && v.convoy.sector; return sec === "left" ? -Math.PI / 2 : sec === "right" ? Math.PI / 2 : sec === "rear" ? Math.PI : 0; }
// called from js/squad.js for every live minion; true = handled here (riding / boarding / holding)
function convoyMinionStep(m, dt) {
  if (!CITY.on) return false;
  const B = mBoard[m];
  if (B) {
    const v = B.v;
    if (!VEH.list.includes(v) || v.dead || v.burnt || (v !== VEH.me && !v.convoy)) { cvUnseat(m, false); return false; }
    B.t += dt;
    const [dx, dy] = cvDoorWorld(v, B.s, mX[m], mY[m]), d = Math.hypot(dx - mX[m], dy - mY[m]);
    if (d < 22 || (B.t > 1.2 && Math.hypot(mX[m] - v.x, mY[m] - v.y) < Math.max(v.L, v.D) * 0.6 + 16)) { cvSeatNow(m, v, B.s); return true; }
    // the car left without them: find room in the column or hold
    if (B.t > 14 || (v === VEH.me && Math.hypot(v.vx, v.vy) > 160 * (v.sv || 1) && d > 700)) {
      B.s.occ = null; mBoard[m] = null;
      for (const u of CONVOY.vehicles) { cvFill(u, [m]); if (mBoard[m]) break; }
      if (!mBoard[m]) cvHold([m]);
      return true;
    }
    const sp = (mSpd[m] || 120) * 1.35, k = Math.min(1, sp * dt / Math.max(1, d));
    const q = cityResolve(mX[m] + (dx - mX[m]) * k, mY[m] + (dy - mY[m]) * k, 7, false);
    mVX[m] = (q[0] - mX[m]) / Math.max(1e-4, dt); mVY[m] = (q[1] - mY[m]) / Math.max(1e-4, dt); mX[m] = q[0]; mY[m] = q[1];
    mWalk[m] += dt * 9; mAim[m] = Math.atan2(dy - mY[m], dx - mX[m]);
    return true;
  }
  const S = mSeat[m];
  if (S) {
    const v = S.v, s = S.s;
    if (!VEH.list.includes(v) || v.burnt) { cvUnseat(m, true); return false; }
    const [sx, sy] = cvSeatWorld(v, s); mX[m] = sx; mY[m] = sy; mVX[m] = v.vx; mVY[m] = v.vy;
    if (s.type === "d" || s.type === "m") return true;
    const sp = Math.hypot(v.vx, v.vy), kind = mKind[m];
    // melee riders reach out at anyone right next to their window when crawling
    if (!cvGunner(m)) {
      if (sp < 90 && mAtkCD[m] <= 0) for (let j = 0; j < MAX_E; j++) {
        if (!eAct[j] || (typeof allyIs === "function" && allyCount > 0 && allyIs(j)) || (typeof sdIgnore === "function" && sdIgnore(j))) continue;
        if (Math.abs(eX[j] - sx) > 40 || Math.abs(eY[j] - sy) > 40 || Math.hypot(eX[j] - sx, eY[j] - sy) > 38) continue;
        const rel = vehAngDiff(Math.atan2(eY[j] - sy, eX[j] - sx), v.ang); if (!cvArcOk(v, s, rel)) continue;
        mAtkCD[m] = kind === 1 ? 0.45 : 0.6; mAim[m] = Math.atan2(eY[j] - sy, eX[j] - sx); mAimT[m] = runTime;
        eHP[j] -= mDmg[m]; spawnDmg(eX[j], eY[j], mDmg[m], false); if (eHP[j] <= 0) killEnemy(j, false, null, "#00f0ff", "squad");
        break;
      }
      return true;
    }
    // gunners: nearest visible hostile inside the seat's arc, preferring the vehicle's convoy sector
    const spec = kind >= 5 && typeof SOLDIER_SPECS !== "undefined" ? SOLDIER_SPECS[kind] : { max: 300 };
    const range = spec.max * 1.35, sec = cvSectorRel(v);
    let best = -1, bs = 1e9;
    if (((m + (CONVOY.frame | 0)) & 3) === 0 || mAimT[m] > runTime - 0.3) {
      for (let j = 0; j < MAX_E; j++) {
        if (!eAct[j] || eDummy[j] || (typeof allyIs === "function" && allyCount > 0 && allyIs(j)) || (typeof sdIgnore === "function" && sdIgnore(j))) continue;
        const dx = eX[j] - sx, dy = eY[j] - sy; if (dx > range || dx < -range || dy > range || dy < -range) continue;
        const d = Math.hypot(dx, dy); if (d > range) continue;
        const rel = vehAngDiff(Math.atan2(dy, dx), v.ang); if (!cvArcOk(v, s, rel)) continue;
        const score = d * (Math.abs(vehAngDiff(rel, sec)) < 1.0 ? 0.7 : 1);
        if (score < bs && cityLOS(sx, sy, eX[j], eY[j])) { bs = score; best = j; }
      }
      S.tgt = best;
    } else best = S.tgt != null && S.tgt >= 0 && eAct[S.tgt] ? S.tgt : -1;
    if (best >= 0) {
      const a = Math.atan2(eY[best] - sy, eX[best] - sx);
      mAim[m] = typeof lerpAng === "function" ? lerpAng(mAim[m], a, Math.min(1, dt * 12)) : a; mAimT[m] = runTime;
      const steady = sp > 200 ? 0.7 : sp > 90 ? 0.85 : 1;
      if (kind >= 5 && typeof squadFireSoldier === "function") squadFireSoldier(m, kind, mAim[m], dt, steady);
      else if (kind === 2 && mAtkCD[m] <= 0) { mAtkCD[m] = 0.9 / steady; spawnProj(sx, sy, Math.cos(mAim[m]) * 380, Math.sin(mAim[m]) * 380, mDmg[m], 0.85, 5, 1, 4, 0, 0, 75); }
      CONVOY.fireT = runTime;
      if (v.convoy || v === VEH.me) CONVOY.contactT = Math.max(CONVOY.contactT, 3);
    } else mAim[m] = typeof lerpAng === "function" ? lerpAng(mAim[m], v.ang + sec + (s.side || 0) * 0.3, Math.min(1, dt * 3)) : mAim[m];
    return true;
  }
  const H = mHold[m];
  if (H) {
    // picked up when you come back: on foot within 22 m, or stopped nearby in a vehicle with room
    if (player && player.inVehicle !== 3 && Math.hypot(player.x - mX[m], player.y - mY[m]) < 700) { cvReleaseHold(m); return false; }
    if (VEH.me && Math.hypot(VEH.me.vx, VEH.me.vy) < 40 && Math.hypot(VEH.me.x - mX[m], VEH.me.y - mY[m]) < 900) { cvFill(VEH.me, [m]); if (!mBoard[m]) for (const u of CONVOY.vehicles) { cvFill(u, [m]); if (mBoard[m]) break; } if (mBoard[m]) { cvReleaseHold(m); cvRadio("PICKING UP THE HOLD GROUP", "#c5e1a5"); return true; } }
    // otherwise: stay put, defend the spot
    if (Math.hypot(H.x - mX[m], H.y - mY[m]) > 50) { const d = Math.hypot(H.x - mX[m], H.y - mY[m]), k = Math.min(1, (mSpd[m] || 110) * dt / d), q = cityResolve(mX[m] + (H.x - mX[m]) * k, mY[m] + (H.y - mY[m]) * k, 7, false); mX[m] = q[0]; mY[m] = q[1]; mWalk[m] += dt * 7; }
    return false;   // squad AI still handles shooting (order-aware); it is kept home by the hold point below
  }
  return false;
}
// squad AI home point for holding riders (js/squad.js asks before choosing the formation spot)
function convoyHoldPoint(m) { const H = mHold[m]; return H ? H : null; }

/* === 6. DRAWING RIDERS (vehicle-local frame: x right, y toward the rear) ============================================ */
function cvTheme() { return typeof FIRETEAM_THEMES !== "undefined" ? (FIRETEAM_THEMES[squadState.theme] || FIRETEAM_THEMES.marine) : { uni: "#556b2f", helm: "#4b5320", accent: "#ffd166" }; }
function cvDrawFigure(g, m, x, y, aimL, pose, th) {
  const kind = mKind[m], col = mCol[m] || th.uni;
  g.save(); g.translate(x, y);
  if (kind === 1) {   // hound: head out the window, ears flapping
    g.fillStyle = col || "#6d4c41"; g.beginPath(); g.ellipse(0, 0, 4.5, 3.6, aimL, 0, 7); g.fill();
    g.fillStyle = "#3e2723"; g.beginPath(); g.ellipse(Math.cos(aimL) * 4, Math.sin(aimL) * 4, 2.2, 1.6, aimL, 0, 7); g.fill();
    g.restore(); return;
  }
  if (kind === 4) { g.fillStyle = col || "#e0e0e0"; g.fillRect(-8, -7, 16, 14); g.beginPath(); g.arc(0, -9, 5, 0, 7); g.fill(); g.fillStyle = "#00ff88"; g.fillRect(-2, -5, 4, 2); g.restore(); return; }
  if (pose === "seated") { g.fillStyle = "rgba(0,0,0,0.35)"; g.fillRect(-4, 1, 8, 6); }
  g.fillStyle = col; g.fillRect(-3.8, -3.6, 7.6, 7.2);
  g.fillStyle = "rgba(0,0,0,0.25)"; g.fillRect(-3.8, -0.8, 7.6, 1.8);
  if (kind >= 5 || kind === 2) {   // weapon toward the target
    g.save(); g.rotate(aimL);
    g.fillStyle = "#151515"; const len = kind === 7 ? 14 : kind === 6 ? 11 : kind === 2 ? 9 : 10; g.fillRect(2, kind === 6 ? -1.5 : -1, len, kind === 6 ? 3 : 2);
    if (runTime - (mAimT[m] || 0) < 0.12 && kind !== 2) { g.fillStyle = th.bolt ? (th.accent || "#4fc3ff") : "#fff59d"; g.beginPath(); g.arc(2 + len + 2, 0, 2.2, 0, 7); g.fill(); }
    g.restore();
  } else if (kind === 0 || kind === 3) { g.save(); g.rotate(aimL); g.fillStyle = "#cfd8dc"; g.fillRect(3, -0.8, 10, 1.6); g.restore(); }
  if (th.helm === th.uni && th.uni === "#eceff1") { g.fillStyle = "#eceff1"; g.beginPath(); g.arc(0, -5.5, 3.3, 0, 7); g.fill(); g.fillStyle = "#111"; g.fillRect(-2.2, -6.2, 4.4, 1.1); }
  else { g.fillStyle = "#e0ac69"; g.beginPath(); g.arc(0, -5.5, 2.9, 0, 7); g.fill(); g.fillStyle = th.helm || "#4b5320"; g.beginPath(); g.arc(0, -6, 3.3, Math.PI, 0); g.fill(); }
  g.restore();
}
function convoyDrawOccupants(g, v, t) {
  if (!v.seats) return;
  const th = cvTheme(), rot = v.ang + Math.PI / 2;
  for (const s of v.seats) {
    const o = s.occ; if (!o || o.boarding) continue;
    if (o.t === "a") { if (s.side && (vehDoorOpen(v, s.side, s.w) || vehGlassGone(v, s.side))) { const col = typeof forceAllyColor === "function" ? forceAllyColor() : "#69f0ae"; g.fillStyle = col; g.globalAlpha = 0.85; g.beginPath(); g.arc(s.side * (v.L / 2 - 6), -s.w * v.D, 3.4, 0, 7); g.fill(); g.globalAlpha = 1; } continue; }
    if (o.t !== "m") continue;
    const m = o.m; if (!mAct[m]) continue;
    const sx = s.u * v.L, sy = -s.w * v.D, aimL = (mAim[m] || 0) - rot, aiming = runTime - (mAimT[m] || -9) < 0.9;
    const doorGone = s.side && vehDoorOpen(v, s.side, s.w), glassGone = s.side ? vehGlassGone(v, s.side) : false;
    switch (s.type) {
      case "r": cvDrawFigure(g, m, sx, sy, aimL, "stand", th); break;
      case "b": case "t": cvDrawFigure(g, m, s.type === "t" ? sx : s.side * (v.L / 2 - 6), sy, aiming ? aimL : (s.type === "t" ? Math.PI / 2 : s.side > 0 ? 0 : Math.PI), aiming ? "stand" : "seated", th); break;
      case "w":
        if (doorGone) cvDrawFigure(g, m, s.side * (v.L / 2 - 4), sy, aiming ? aimL : (s.side > 0 ? 0 : Math.PI), "seated", th);           // whole rider in the open door frame
        else if (aiming || (mKind[m] === 1 && Math.hypot(v.vx, v.vy) > 60 * (v.sv || 1))) cvDrawFigure(g, m, s.side * (v.L / 2 + 2.5), sy, aimL, "lean", th);   // leaning out of the window
        else if (glassGone) { g.fillStyle = "#e0ac69"; g.beginPath(); g.arc(s.side * (v.L / 2 - 7), sy, 2.6, 0, 7); g.fill(); }
        break;
      default:
        if (doorGone) cvDrawFigure(g, m, s.side * (v.L / 2 - 5), sy, s.side > 0 ? 0 : Math.PI, "seated", th);
        break;
    }
  }
}

/* === 6b. FORCE-PERSUADED ALLIES RIDE ALONG (light side heroes) ====================================================== */
const CV_ALLY = new Map();   // enemy slot -> { v, s, uid, board }
function cvAllyFollowers(x, y, r) {
  const out = [];
  if (typeof allyCount === "undefined" || !allyCount || typeof allyIs !== "function") return out;
  for (let j = 0; j < MAX_E; j++) { if (!eAct[j] || !allyIs(j) || CV_ALLY.has(j)) continue; if (Math.hypot(eX[j] - x, eY[j] - y) < r) out.push(j); }
  return out;
}
function cvAllyBoard(list, vehicles) {
  for (const j of list) {
    for (const v of vehicles) {
      if (!v) continue;
      const s = v.seats.find(q => !q.occ && q.type !== "d" && q.type !== "r");
      if (!s) continue;
      s.occ = { t: "a", j, uid: eUid[j], boarding: 1 }; CV_ALLY.set(j, { v, s, uid: eUid[j], board: true, t: 0 });
      break;
    }
  }
}
function cvAllyUnseat(j, place) {
  const A = CV_ALLY.get(j); if (!A) return;
  CV_ALLY.delete(j);
  if (A.s.occ && A.s.occ.j === j) A.s.occ = null;
  if (place && eAct[j]) { const side = A.s.side || 1, [dx, dy] = vehToWorld(A.v, side * (A.v.L / 2 + 13), -A.s.w * A.v.D), q = cityFindWalkable(dx, dy, 160, false); eX[j] = q[0]; eY[j] = q[1]; }
}
function cvAllyAllOut(v) { for (const [j, A] of [...CV_ALLY]) if (!v || A.v === v) cvAllyUnseat(j, true); }
(function cvPatchAllies() {
  const _aes = window.allyEnemyStep;
  if (typeof _aes === "function") window.allyEnemyStep = function (i, dt) {
    const A = CV_ALLY.get(i);
    if (!A) return _aes(i, dt);
    if (eUid[i] !== A.uid || !VEH.list.includes(A.v) || A.v.burnt) { cvAllyUnseat(i, true); return _aes(i, dt); }
    allyT[i] -= dt;
    if (allyT[i] <= 0) { cvAllyUnseat(i, true); if (typeof allyLayDown === "function") allyLayDown(i); return; }
    if (A.board) {   // walk to the door, then climb in
      A.t += dt;
      const [dx, dy] = cvDoorWorld(A.v, A.s, eX[i], eY[i]), d = Math.hypot(dx - eX[i], dy - eY[i]);
      if (d < 24) { A.board = false; if (A.s.occ) A.s.occ.boarding = 0; return; }
      if (A.t > 9) { cvAllyUnseat(i, false); return _aes(i, dt); }   // can't get there (fence, wall): stays on foot
      const spd = Math.max(80, eSpd[i] * 1.3);
      if (typeof stMove === "function" && typeof ST !== "undefined") stMove(i, dx, dy, spd, dt);   // path-finds around walls and fences
      else { const k = Math.min(1, spd * dt / d), q = cityResolve(eX[i] + (dx - eX[i]) * k, eY[i] + (dy - eY[i]) * k, 8, false); eX[i] = q[0]; eY[i] = q[1]; }
      return;
    }
    const [sx, sy] = cvSeatWorld(A.v, A.s); eX[i] = sx; eY[i] = sy; eVX[i] = A.v.vx; eVY[i] = A.v.vy;
  };
  const _ieos = window.isEnemyOnScreen;
  if (typeof _ieos === "function") window.isEnemyOnScreen = function (j) { const A = CV_ALLY.get(j); if (A && !A.board) return false; return _ieos(j); };
})();

/* === 7. HOOKS ======================================================================================================= */
function convoyReset() {
  CONVOY.trail.length = 0; CONVOY.vehicles.length = 0; CONVOY.halted = false; CONVOY.haltT = 0; CONVOY.contactT = 0; CONVOY.s = 0; CONVOY.lastX = 1e9;
  for (let m = 0; m < mSeat.length; m++) { mSeat[m] = null; mBoard[m] = null; mHold[m] = null; }
  try { const L = typeof mapMarkers === "function" ? mapMarkers() : null; if (L) for (let i = L.length - 1; i >= 0; i--) if (L[i] && L[i].auto) L.splice(i, 1); } catch (e) { }
  CONVOY.holdMarks.length = 0;
  CV_ALLY.clear();
}
V10.onRunStart.push(convoyReset);
V10.onRunReset.push(convoyReset);
V10.onStep.push(() => { CONVOY.frame = (CONVOY.frame | 0) + 1; for (let m = 0; m < mSeat.length; m++) { if ((mSeat[m] || mBoard[m]) && (!mAct[m] || mHP[m] <= 0)) cvUnseat(m, false); if (mHold[m] && !mAct[m]) cvReleaseHold(m); } });
// v14.3: a scaled body (1:3 real map) seats its riders at the body's scale
if (typeof convoyDrawOccupants === "function") {
  const _cvdo = convoyDrawOccupants;
  window.convoyDrawOccupants = convoyDrawOccupants = function (g, v, t) {
    const k = v && v.k; if (!k || k === 1) return _cvdo(g, v, t);
    const L = v.L, D = v.D; g.save(); g.scale(k, k); v.L = L / k; v.D = D / k;
    try { return _cvdo(g, v, t); } finally { v.L = L; v.D = D; g.restore(); }
  };
}

// EOF:js/convoy.js
