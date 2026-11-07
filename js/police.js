/* ============================================================================================================
   js/police.js — v14.3 TRAFFIC POLICE (in the spirit of the old Driver games)
   • Speeding on a road (10+ mph over, or 20 % over on fast roads), running a red light, or hitting something gets
     police attention — but only if a cop sees it: a cruiser in traffic with a line of sight, or an officer on foot.
     Careful driving off the road draws nobody.
   • The cruiser lights up and follows your path. Stop the car and it pulls in behind you; the officer walks up to
     your window, you talk (big touch buttons), and the ticket is paid automatically from your wallet — a bank-style
     notification slides in ("−$185 · Marion County Clerk").
   • Can't pay? You spend the night in jail: fade out, "you couldn't afford the ticket", and the next morning you
     walk out of the police station (the car is impounded). Drive off instead and it becomes a chase (and, where
     the economy runs, a wanted level).
   Only in modern cities (the real maps, the Nexus "Modern Earth" theme): that's where cruisers ride in the traffic.
   ============================================================================================================ */
const PD = { on: false, st: "idle", unit: null, off: null, pend: null, speedT: 0, lastCrash: 0, trail: [], chaseT: 0, stopT: 0, lostT: 0, cool: 0,
  sirenT: 0, nodeIn: null, panel: null, banner: null, why: [], officer: "", agency: "", fine: 0, noticeT: 0, stats: { stops: 0, tickets: 0, jail: 0, chases: 0 } };
const PD_NAMES = ["Officer Reyes", "Officer Miller", "Deputy Brooks", "Officer Nguyen", "Sgt. Patel", "Officer Johnson", "Officer Walsh", "Deputy Carter", "Officer Kim", "Officer Alvarez"];
const PD_COUNTY = { indianapolis: "Marion County", "beech grove": "Marion County", carmel: "Hamilton County", fishers: "Hamilton County", westfield: "Hamilton County",
  noblesville: "Hamilton County", sheridan: "Hamilton County", greenwood: "Johnson County", lebanon: "Boone County", thorntown: "Boone County", kokomo: "Howard County",
  gary: "Lake County", "clay city": "Clay County", brazil: "Clay County", brasil: "Clay County" };

function pdK() { return typeof trfK === "function" ? trfK() : 1; }
function pdEnabled() {
  if (typeof TRF === "undefined" || !TRF.on || typeof VEH === "undefined") return false;
  if (typeof opts !== "undefined" && opts.police === false) return false;
  return typeof trfModern === "function" && trfModern();
}
function pdCity() {
  try { if (typeof RG !== "undefined" && RG.real && typeof RM !== "undefined" && RM.place) return String(RM.place.name || RM.place.city || "").split(",")[0]; } catch (e) {}
  try { if (typeof cityShortName === "function") return cityShortName(); } catch (e) {}
  return "City";
}
function pdAgency() { const c = pdCity(); return (c || "City") + " Police Department"; }
function pdClerk() { const c = pdCity(), co = PD_COUNTY[(c || "").toLowerCase()]; return co ? co + " Clerk" : (c || "City") + " Traffic Court"; }
function pdKmh() { return typeof opts !== "undefined" && opts.vehUnits === "kmh"; }
// a speed in the units on your speedometer (limits round to the nearest 5 km/h)
function pdSpd(mph) { return pdKmh() ? Math.round(mph * 1.609344 / 5) * 5 : Math.round(mph); }
function pdMph(v) { return typeof vehRealMs === "function" ? vehRealMs(v) / 0.44704 : Math.hypot(v.vx, v.vy) / 32 / 0.44704; }
function pdSight(x0, y0, x1, y1) { try { return !cityRay(x0, y0, x1, y1, F_SIGHT, 2400).hit; } catch (e) { return false; } }

/* --- 1. WHAT THE POLICE NOTICE ----------------------------------------------------------------------------------- */
const PD_ROAD = new Set(["sedan", "police", "pickup", "suv", "rusted", "anglia", "bus", "armytruck", "tractor", "firetruck", "forklift", "semi"]);
function pdOnRoadVeh(me) { return !!me && !me.dead && PD_ROAD.has(me.kind) && !(typeof FLY !== "undefined" && FLY.on) && !me.flyAir; }
function pdWatch(dt) {
  const me = VEH.me; if (!pdOnRoadVeh(me)) { PD.speedT = 0; pdLimitSign(null); return; }
  const [xm, ym] = trfM(me.x, me.y), k = pdK();
  // the trail the cruiser follows (your own path is always drivable)
  const T = PD.trail, last = T[T.length - 1];
  if (!last || Math.hypot(last[0] - me.x, last[1] - me.y) > 40 * k) { T.push([me.x, me.y]); if (T.length > 500) T.splice(0, T.length - 500); }
  if (PD.st !== "idle" && PD.st !== "chase") return;
  const mph = pdMph(me), road = typeof trfRoadAt === "function" ? trfRoadAt(xm, ym) : null;
  pdLimitSign(road, mph);
  if (road) {
    const over = mph - road.mph, lim = Math.max(10, road.mph * 0.2);
    if (over > lim) PD.speedT += dt; else PD.speedT = Math.max(0, PD.speedT - dt * 0.5);
    if (PD.speedT > 1.1) { PD.speedT = 0; pdOffense("speed", { mph: Math.round(mph), lim: road.mph, road: road.name }); }
  } else PD.speedT = Math.max(0, PD.speedT - dt);
  // crashes (js/vehicles.js counts them)
  const cr = VEH.stats ? VEH.stats.crashes : 0;
  if (cr > PD.lastCrash) { PD.lastCrash = cr; if (mph > 6 || me.lastImp > 4) pdOffense("crash", { mph: Math.round(mph) }); }
  // red lights
  if (TRF.net) {
    if (PD.nodeIn) { const n = PD.nodeIn; if (Math.hypot(n.x - xm, n.y - ym) > n.r + 3 * k) PD.nodeIn = null; }
    else for (const n of TRF.net.nodes.values()) {
      if (!n.sig || Math.abs(n.x - xm) > n.r || Math.abs(n.y - ym) > n.r || Math.hypot(n.x - xm, n.y - ym) > n.r) continue;
      PD.nodeIn = n;
      const hx = Math.cos(me.ang), hy = Math.sin(me.ang);
      if (mph > 8 && trfSig(n, trfPhase(n, hx, hy)) === 2) pdOffense("red", { road: (n.links.find(L => L.name) || {}).name || "" });
      break;
    }
  }
}
function pdOffense(kind, info) {
  if (runTime < PD.cool) return;
  // Do not record an invisible offense for a later officer to inherit. During
  // a pursuit the actual pursuer can witness a new offense, too; an empty
  // parked cruiser is not a witness when its officer is on foot.
  const w = pdWitness();
  if (!w) return;
  const active = PD.st !== "idle";
  const P = PD.pend && (active || runTime - PD.pend.t < 25) ? PD.pend : (PD.pend = { kinds: new Set(), t: runTime, mph: 0, lim: 0, road: "", what: "" });
  P.kinds.add(kind); P.t = runTime;
  if (info) { if (info.mph && kind === "speed") { P.mph = Math.max(P.mph, info.mph); P.lim = info.lim; } if (info.road) P.road = info.road; if (info.what) P.what = info.what; }
  if (active) { if (!PD.why.includes(kind)) PD.why.push(kind); return; }  // never restart an encounter
  PD.why = [...P.kinds];
  pdStartChase(w);
}
// who saw it: an occupied cruiser (~150 real m) or an officer on foot (~70 real m)
function pdWitness() {
  const me = VEH.me, k = pdK(); if (!me) return null;
  // When an officer is outside their car, only that officer can see from the
  // unit; do not let the unoccupied parked cruiser observe through a wall.
  if (PD.st !== "idle") {
    const p = PD.off || PD.unit;
    const range = (PD.off ? 70 : 150) * k * 32;
    if (p && Math.hypot(p.x - me.x, p.y - me.y) <= range && pdSight(p.x, p.y, me.x, me.y)) return { active: true };
  }
  let best = null, bd = 1e9;
  for (const c of TRF.cars) {
    if (!c.police || c.dead) continue;
    const lx = c.x * 32 - CITY.orx, ly = c.y * 32 - CITY.ory, d = Math.hypot(lx - me.x, ly - me.y);
    if (d > 150 * k * 32 || d > bd || !pdSight(lx, ly, me.x, me.y)) continue;
    best = { car: c }; bd = d;
  }
  if (best) return best;
  if (typeof TF !== "undefined" && TF.walk) for (const p of TF.walk) {
    const W = p.w; if (!W || !p.alive || W.sleep || W.inside) continue;
    const job = p.job && TF.bld && TF.bld.get(p.job.uid); if (!job || job.kind !== "police") continue;
    const d = Math.hypot(W.x - me.x, W.y - me.y); if (d > 70 * k * 32) continue;
    if (pdSight(W.x, W.y, me.x, me.y)) return { foot: p };
  }
  return null;
}

/* --- 2. THE CHASE ------------------------------------------------------------------------------------------------ */
function pdNewUnit(x, y, ang, v) {
  const k = pdK();
  return { x, y, ang, v: v || 0, k, pv: 8, h: (Math.random() * 1e9) | 0, wpx: 64 * k, lpx: 144 * k, siren: true, ti: -1, mode: "join", police: true, parked: false };
}
function pdStartChase(w) {
  const me = VEH.me; if (!me) return;
  PD.officer = PD_NAMES[Math.floor(Math.random() * PD_NAMES.length)]; PD.agency = pdAgency();
  if (w.car) {
    const c = w.car;
    PD.unit = pdNewUnit(c.x * 32 - CITY.orx, c.y * 32 - CITY.ory, c.ang, c.v * 32);
    if (typeof trfDrop === "function") trfDrop(c);
    TRF.cars = TRF.cars.filter(o => o !== c);
  } else PD.unit = null;   // radioed in: a unit arrives along your path
  PD.st = "chase"; PD.chaseT = 0; PD.stopT = 0; PD.lostT = 0; PD.stats.chases++;
  if (!PD.unit) PD.callT = runTime + 3;
  pdBanner("🚨 PULL OVER", "Stop the car — the officer will come to you");
  if (typeof sfx === "function") sfx(700, 1250, 0.45, "sine", 0.05);
}
// A radioed unit may materialize only beyond both the last rendered view and
// the calculated current camera view, with
// enough clearance for the entire cruiser. If there is no current view or no
// suitable trail point, pdUnitStep retries and eventually releases the stop.
function pdUnitOffscreen(x, y, k) {
  const v = TRF.view; let current;
  try { current = typeof camView === "function" ? camView(140) : null; } catch (_) { return false; }
  if (!v || !current || ![v.l, v.t, v.w, v.h, current.left, current.top, current.vw, current.vh, x, y, k].every(Number.isFinite) || v.w <= 0 || v.h <= 0 || current.vw <= 0 || current.vh <= 0 || k <= 0) return false;
  const m = Math.hypot(64 * k, 144 * k) / 2 + 60;
  const outside = (l, t, w, h) => x + m < l || x - m > l + w || y + m < t || y - m > t + h;
  // Rendering can lag simulation while the camera moves. Require separation
  // from both the last painted view and the current calculated view.
  return outside(v.l, v.t, v.w, v.h) && outside(current.left, current.top, current.vw, current.vh);
}
function pdCallUnit() {
  const T = PD.trail, k = pdK(); if (T.length < 2) return;
  let i = T.length - 1, dist = 0, chosen = -1;
  while (i > 0) {
    dist += Math.hypot(T[i][0] - T[i - 1][0], T[i][1] - T[i - 1][1]); i--;
    if (dist >= 45 * k * 32 && pdUnitOffscreen(T[i][0], T[i][1], k)) { chosen = i; break; }
  }
  if (chosen < 0) return;
  const a = T[chosen], b = T[chosen + 1];
  PD.unit = pdNewUnit(a[0], a[1], Math.atan2(b[1] - a[1], b[0] - a[0]), 0);
  PD.unit.ti = chosen + 1; PD.unit.mode = "trail";
}
function pdUnitStep(dt) {
  const u = PD.unit, me = VEH.me, k = pdK();
  if (!u) {
    if (PD.callT && runTime > PD.callT) {
      PD.callT = 0; pdCallUnit();
      // The radioed unit needs at least two trail samples. Retry rather than
      // leaving an eternal banner if the player stopped before one was recorded.
      if (!PD.unit && (PD.st === "chase" || PD.st === "flee")) {
        if (PD.chaseT < 16) PD.callT = runTime + 1;
        else { pdEnd(true); PD.cool = runTime + 30; if (typeof itToast === "function") itToast("🚔 No unit available", "#90caf9"); }
      }
    }
    return;
  }
  const T = PD.trail, VPXK = 32 * k;
  const vmax = (PD.st === "flee" ? 30 : 27) * Math.min(1, 2.24 * k) * 32;   // a cruiser is a little faster than you
  let tx, ty, want = vmax;
  const tgt = me || player, tAng = me ? me.ang : 0;
  const slotD = ((me ? me.D : 0) / 2 + u.lpx / 2 + 1.6 * VPXK);
  const sx = tgt.x - Math.cos(tAng) * slotD + -Math.sin(tAng) * 0.3 * VPXK, sy = tgt.y - Math.sin(tAng) * slotD + Math.cos(tAng) * 0.3 * VPXK;
  const dMe = Math.hypot(tgt.x - u.x, tgt.y - u.y);
  if (u.mode === "join") {
    // drive to the nearest point of your path, then follow it
    let bi = -1, bd = 1e9; for (let i = Math.max(0, T.length - 120); i < T.length; i++) { const d = Math.hypot(T[i][0] - u.x, T[i][1] - u.y); if (d < bd) { bd = d; bi = i; } }
    if (bi >= 0 && bd < 1.2 * VPXK) { u.mode = "trail"; u.ti = bi + 1; }
    else if (bi >= 0) { tx = T[bi][0]; ty = T[bi][1]; }
    else { tx = sx; ty = sy; }
  }
  if (u.mode === "trail") {
    while (u.ti < T.length && Math.hypot(T[u.ti][0] - u.x, T[u.ti][1] - u.y) < 1.1 * VPXK) u.ti++;
    if (u.ti >= T.length - 1 || dMe < slotD * 1.4) u.mode = "direct";
    else { tx = T[u.ti][0]; ty = T[u.ti][1]; }
    // far behind and out of sight: catch up along the path
    if (u.ti < T.length - 6) {
      let rest = 0; for (let i = u.ti; i < T.length - 1; i++) rest += Math.hypot(T[i + 1][0] - T[i][0], T[i + 1][1] - T[i][1]);
      if (rest > 70 * VPXK && pdUnitOffscreen(u.x, u.y, u.k || k)) { let i = T.length - 1, dd = 0; while (i > u.ti && dd < 40 * VPXK) { dd += Math.hypot(T[i][0] - T[i - 1][0], T[i][1] - T[i - 1][1]); i--; } if (pdUnitOffscreen(T[i][0], T[i][1], u.k || k)) { u.x = T[i][0]; u.y = T[i][1]; u.ti = i + 1; } }
    }
  }
  if (u.mode === "direct") {
    tx = sx; ty = sy;
    const ds = Math.hypot(sx - u.x, sy - u.y), vme = me ? Math.hypot(me.vx, me.vy) : 0;
    want = Math.min(vmax, vme + ds * 1.6);
    if (ds < 0.4 * VPXK) want = Math.min(want, vme);
    if (dMe > slotD * 4 && T.length > 2) { u.mode = "join"; }
  }
  if (PD.st === "stop" && !PD.off) {
    tx = sx; ty = sy; const ds = Math.hypot(sx - u.x, sy - u.y); want = Math.min(4 * VPXK, ds * 1.5);
    if (ds < 1.4 * VPXK) {
      // the last metre: ease into the slot square behind you, lined up with your car
      const f = Math.min(1, dt * 2.5); u.x += (sx - u.x) * f; u.y += (sy - u.y) * f; u.v = 0; tx = undefined;
      let d = tAng - u.ang; while (d > Math.PI) d -= Math.PI * 2; while (d < -Math.PI) d += Math.PI * 2; u.ang += Math.max(-2.2 * dt, Math.min(2.2 * dt, d));
      if (ds < 0.3 * VPXK && Math.abs(d) < 0.12) u.parked = true;
      want = 0;
    }
  }
  if (PD.st === "leave") { want = u.parked && PD.off ? 0 : 9 * VPXK * 0.9; tx = u.x + Math.cos(u.ang) * 100; ty = u.y + Math.sin(u.ang) * 100; }
  if (PD.off && (PD.st === "flee" || PD.st === "cover" || PD.st === "walk" || PD.st === "talk")) { want = 0; u.v = 0; tx = undefined; }
  // steer + speed
  if (tx !== undefined) {
    const da = Math.atan2(ty - u.y, tx - u.x), dd = Math.hypot(tx - u.x, ty - u.y);
    if (dd > 0.2 * VPXK) { let d = da - u.ang; while (d > Math.PI) d -= Math.PI * 2; while (d < -Math.PI) d += Math.PI * 2; const rate = 3.2 * dt; u.ang += Math.max(-rate, Math.min(rate, d)); if (Math.abs(d) > 1.2) want = Math.min(want, 5 * VPXK); }
  }
  const acc = 9 * VPXK * dt; u.v += Math.max(-acc * 1.6, Math.min(acc, want - u.v));
  u.x += Math.cos(u.ang) * u.v * dt; u.y += Math.sin(u.ang) * u.v * dt;
  // never inside your car
  if (me) { const dx = u.x - me.x, dy = u.y - me.y, d = Math.hypot(dx, dy), m = (me.D + u.lpx) / 2 * 0.92; if (d < m && d > 0.01) { u.x = me.x + dx / d * m; u.y = me.y + dy / d * m; u.v = Math.min(u.v, Math.hypot(me.vx, me.vy)); } }
  // the siren
  if (PD.st === "chase" || PD.st === "flee") {
    PD.sirenT -= dt;
    if (PD.sirenT <= 0 && typeof sfx === "function") { PD.sirenT = 0.62; const near = Math.max(0, 1 - dMe / (60 * VPXK)); if (near > 0) { const up = (runTime * 1.6) % 2 < 1; sfx(up ? 640 : 1180, up ? 1180 : 640, 0.6, "sine", 0.022 + 0.03 * near); } }
  }
}
function pdOnScreen(x, y) { const v = TRF.view; if (!v) return Math.hypot(x - player.x, y - player.y) < 700; return x > v.l - 60 && x < v.l + v.w + 60 && y > v.t - 60 && y < v.t + v.h + 60; }

/* --- 3. THE STOP: pull over, the walk, the talk, the ticket ------------------------------------------------------- */
// A routine citation must not freeze an active fight. Nearby foes alone do not make the player guilty.
function pdActiveFight() {
  if (!player || !(player.combatAlertTimer > 0) || typeof eAct === "undefined") return false;
  const R = 420;
  for (let j = 0; j < MAX_E; j++) {
    if (!eAct[j] || (typeof allyIs === "function" && allyIs(j)) || (typeof sdIgnore === "function" && sdIgnore(j))) continue;
    if (Math.hypot(eX[j] - player.x, eY[j] - player.y) < R) return true;
  }
  return false;
}
function pdExitOfficer() {
  const u = PD.unit;
  if (!u || PD.off) return;
  u.parked = true; u.v = 0;
  const c = Math.cos(u.ang), s = Math.sin(u.ang);
  PD.off = { x: u.x + s * (u.wpx / 2 + 10), y: u.y - c * (u.wpx / 2 + 10), face: u.ang, walk: 0 };
}
function pdLeftStop() {
  return !VEH.me && PD.stopX != null && Math.hypot(player.x - PD.stopX, player.y - PD.stopY) > 90;
}
// A dismounted officer must physically reach the driver's door before the car moves.
// Use the existing bounded city pathfinder when a wall blocks the direct route.
function pdWalkOfficer(O, tx, ty, dt, speed, arrive) {
  const distance = Math.hypot(tx - O.x, ty - O.y);
  if (distance <= arrive + .05) { O.walk = 0; return true; }
  let gx = tx, gy = ty;
  O.routeT = Math.max(0, (O.routeT || 0) - dt);
  if (typeof stClearLine === "function" && typeof stFindPath === "function" && !stClearLine(O.x, O.y, tx, ty, 5)) {
    if (!O.routeT && (!O.path || Math.hypot(O.path.tx - tx, O.path.ty - ty) > 56 || O.path.k >= O.path.pts.length || (O.stuck || 0) > 1)) {
      O.path = stFindPath(O.x, O.y, tx, ty); O.routeT = 1.5; O.stuck = 0;
    }
    const P = O.path;
    if (P && P.k < P.pts.length) {
      while (P.k < P.pts.length - 1 && Math.hypot(P.pts[P.k][0] - O.x, P.pts[P.k][1] - O.y) < 12) P.k++;
      gx = P.pts[P.k][0]; gy = P.pts[P.k][1];
    }
  } else O.path = null;
  const dx = gx - O.x, dy = gy - O.y, d = Math.hypot(dx, dy);
  if (d < .01) { O.walk = 0; return false; }
  const step = Math.min(speed * dt, d, distance - arrive), ox = O.x, oy = O.y;
  const q = cityResolve(ox + dx / d * step, oy + dy / d * step, 7, false);
  O.x = q[0]; O.y = q[1]; O.face = Math.atan2(dy, dx);
  const moved = Math.hypot(O.x - ox, O.y - oy);
  O.stuck = step > .5 && moved < step * .3 ? (O.stuck || 0) + dt : Math.max(0, (O.stuck || 0) - dt);
  O.walk = moved > .1 ? O.walk + dt * 9 : 0;
  return false;
}
function pdOfficerDoor(u) {
  const c = Math.cos(u.ang), s = Math.sin(u.ang);
  return [u.x + s * (u.wpx / 2 + 10), u.y - c * (u.wpx / 2 + 10)];
}
function pdStep(dt) {
  PD.on = pdEnabled();
  if (!PD.on) { if (PD.st !== "idle" && PD.st !== "jail") pdEnd(true); return; }
  if (PD.st === "jail") return;
  pdWatch(dt);
  pdUnitStep(dt);
  const me = VEH.me, u = PD.unit, k = pdK(), VPXK = 32 * k;
  if (PD.st === "chase" || PD.st === "flee") {
    PD.chaseT += dt;
    const mph = me ? pdMph(me) : 0, target = me || player;
    const pursuer = PD.off || u;
    const near = pursuer && Math.hypot(pursuer.x - target.x, pursuer.y - target.y) < 22 * VPXK + (me ? me.D : 0);
    // A fleeing suspect does not become a fresh speeding ticket just by stopping.
    if (PD.st === "chase" && near && mph < 3 && me) { PD.stopT += dt; if (PD.stopT > 0.9) pdPullOver(); } else PD.stopT = Math.max(0, PD.stopT - dt);
    if (PD.st === "flee") {
      if (u && !me && near && !PD.off) pdExitOfficer();
      const O = PD.off;
      if (O) {
        // A car fleeing at speed: return to the parked cruiser first; do not teleport aboard.
        if (u && me && mph > 9) O.returning = true;
        // If the suspect gets out close by, an officer can pursue on foot instead.
        if (!me && Math.hypot(O.x - player.x, O.y - player.y) < 10 * VPXK) O.returning = false;
        if (O.returning && u) {
          const door = pdOfficerDoor(u);
          if (pdWalkOfficer(O, door[0], door[1], dt, 70, 3)) {
            PD.off = null; u.parked = false; u.mode = "join"; u.ti = 0;
          }
        } else if (!me) pdWalkOfficer(O, player.x, player.y, dt, 70, 45);
      }
    }
    if (PD.st === "chase" && PD.chaseT > 16 && mph > 15) pdFlee();
    // Losing sight is timed against the actual pursuer, not an empty parked car.
    if (pursuer) {
      const far = Math.hypot(pursuer.x - target.x, pursuer.y - target.y) > 110 * VPXK;
      const seen = !far && pdSight(pursuer.x, pursuer.y, target.x, target.y);
      if (!seen) PD.lostT += dt; else PD.lostT = Math.max(0, PD.lostT - dt * 2);
      if (PD.lostT > (PD.st === "flee" ? 10 : 7)) {
        pdBanner(null); if (typeof itToast === "function") itToast("🚔 You lost the police", "#69f0ae");
        PD.cool = runTime + 30;
        if (PD.off && u) { PD.st = "leave"; PD.returnT = 0; u.siren = false; PD.off.returning = true; }
        else pdEnd(false);
      }
    }
  } else if (PD.st === "stop") {
    if ((me && pdMph(me) > 9) || pdLeftStop()) return pdFlee();
    // a cruiser that can't line up neatly (a tight spot, a curve) just stops where it is after a few seconds
    PD.parkT = (PD.parkT || 0) + dt;
    if (u && !u.parked && PD.parkT > 4 && Math.hypot(u.x - (me || player).x, u.y - (me || player).y) < 14 * VPXK + (me ? me.D : 0)) { u.parked = true; u.v = 0; }
    if (!u && PD.parkT > 1.5) {
      // no cruiser in play (it was lost to a crash): the officer walks up from behind on foot
      const tgt = me || player, c = Math.cos(tgt.ang || 0), s = Math.sin(tgt.ang || 0);
      PD.off = { x: tgt.x - c * 8 * VPXK, y: tgt.y - s * 8 * VPXK, face: tgt.ang || 0, walk: 0 }; PD.st = "walk"; return;
    }
    if (u && u.parked) {
      // The officer actually gets out before walking up or taking cover.
      pdExitOfficer(); PD.st = "walk";
    }
  } else if (PD.st === "walk" || PD.st === "cover") {
    if ((me && pdMph(me) > 9) || pdLeftStop()) return pdFlee();
    if (pdActiveFight()) {
      if (PD.st !== "cover") { PD.st = "cover"; pdBanner("🚔 OFFICER TAKING COVER", "Active fight — the traffic stop can wait"); }
      PD.quietT = 0;
      if (PD.off) { PD.off.face = Math.atan2(player.y - PD.off.y, player.x - PD.off.x); PD.off.walk = 0; }
      return;
    }
    if (PD.st === "cover") {
      PD.quietT = (PD.quietT || 0) + dt;
      if (PD.quietT < 3) return;
      PD.st = "walk"; pdBanner("🚔 PULLED OVER", "The officer is coming to speak with you");
    }
    const O = PD.off, tgt = me || player, c = Math.cos(tgt.ang || 0), s = Math.sin(tgt.ang || 0);
    const tx = me ? me.x + s * (me.L / 2 + 13) + c * me.D * 0.1 : player.x - 26, ty = me ? me.y - c * (me.L / 2 + 13) + s * me.D * 0.1 : player.y;
    // Approach the driver using the same collision-aware walker as pursuit
    // and return-to-car; a routine stop must not walk through a building.
    if (!O) { pdEnd(true); return; }
    const ox = O.x, oy = O.y;
    if (pdWalkOfficer(O, tx, ty, dt, 62, 3)) { O.face = Math.atan2(tgt.y - O.y, tgt.x - O.x); O.walk = 0; pdTalk(); }
    else {
      O.approachStill = Math.hypot(O.x - ox, O.y - oy) < .05 ? (O.approachStill || 0) + dt : Math.max(0, (O.approachStill || 0) - dt * 2);
      if (O.approachStill > 12) {
        // An inaccessible driver's window must not hold the encounter open
        // forever. Cancel without issuing a ticket, then physically return.
        PD.st = "leave"; PD.returnT = 0; PD.cool = runTime + 30; PD.pend = null; PD.why = [];
        if (u) u.siren = false;
        O.returning = true; pdBanner(null);
        if (typeof itToast === "function") itToast("🚔 Officer unable to reach the vehicle — stop ended", "#90caf9");
      }
    }
  } else if (PD.st === "leave") {
    const O = PD.off;
    if (O && u) {
      PD.returnT = (PD.returnT || 0) + dt;
      // An unreachable cruiser must not lock police encounters forever. Clean up
      // only when both officer and parked cruiser are out of view; no car is spawned.
      if (PD.returnT > 30 && !pdOnScreen(O.x, O.y) && !pdOnScreen(u.x, u.y)) { pdEnd(true); return; }
      const door = pdOfficerDoor(u);
      if (pdWalkOfficer(O, door[0], door[1], dt, 62, 3)) { PD.off = null; u.parked = false; u.siren = false; PD.leaveT = runTime; }
    } else if (u && (!pdOnScreen(u.x, u.y) || runTime - (PD.leaveT || runTime) > 12)) pdEnd(false);
    else if (!u) pdEnd(false);
  }
  pdSurrenderControl(PD.st === "flee" && pdCanSurrender());
}
function pdPullOver() {
  PD.st = "stop"; PD.stopT = 0; PD.parkT = 0; PD.stopX = player.x; PD.stopY = player.y; PD.quietT = 0; PD.stats.stops++;
  pdBanner("🚔 PULLED OVER", "Stay in the car — the officer is coming");
  const u = PD.unit; if (u) u.mode = "direct";
}
function pdFlee() {
  if (PD.panel && (PD.st === "talk" || PD.st === "surrender")) runPaused = PD.wasPaused;
  if (PD.panel) pdClosePanel();
  if (PD.st !== "flee") {
    PD.st = "flee"; PD.chaseT = 0; if (PD.unit) { PD.unit.parked = !!PD.off; PD.unit.siren = true; PD.unit.mode = "join"; }
    pdBanner("🚨 EVADING POLICE", "Lose them — or stop and face the music");
    if (!PD.why.includes("evade") && typeof ECO !== "undefined" && ECO.on && typeof ecoSetLevel === "function") { ECO.W.heat = Math.max(ECO.W.heat + 25, (typeof ECO_LVL !== "undefined" ? ECO_LVL[2] : 55) + 1); ECO.W.lastSeen = runTime; ecoSetLevel(); }
    PD.why = [...new Set(PD.why.concat(["evade"]))];
  }
}
function pdEnd(quiet) {
  pdSurrenderControl(false);
  if (PD.panel && (PD.st === "talk" || PD.st === "surrender")) runPaused = PD.wasPaused;
  pdClosePanel(); pdBanner(null);
  if (PD.unit && !PD.off && !quiet && typeof trfRemap === "function" && TRF.net && PD.unit.v >= 0) {
    // back into the traffic as a normal patrol car
    const u = PD.unit, [x, y] = trfM(u.x, u.y);
    const c = { id: TRF.id++, L: null, d: 1, s: 0, q: 0, v: u.v / 32, v0: 0, k: u.k, pv: 8, police: true, siren: false, h: u.h, hint: { i: 0 }, st: 0, next: null, wait: 0, stopT: 0, blockT: 0, honkT: 0,
      wpx: u.wpx, lpx: u.lpx, W: 2 * u.k, D: 4.5 * u.k, brk: false, sig: 0, x, y, ang: u.ang, mood: 1 };
    const r = trfRemap({ c, x, y, hx: Math.cos(u.ang), hy: Math.sin(u.ang) });
    if (r) TRF.cars.push(r);
  }
  PD.unit = null; PD.off = null; PD.st = "idle"; PD.pend = null; PD.why = []; PD.chaseT = 0; PD.stopT = 0; PD.lostT = 0; PD.callT = 0; PD.stopX = null; PD.stopY = null; PD.quietT = 0;
}
// An explicit, optional off-ramp.  The player must actually stop near the
// pursuing officer (or occupied cruiser); no dialogue interrupts a firefight.
function pdCanSurrender() {
  if (PD.st !== "flee" || PD.panel || !player || (player.flyAlt || 0) > 3 || pdActiveFight()) return false;
  const me = VEH.me, pursuer = PD.off || PD.unit;
  if (!pursuer || (me ? pdMph(me) > 3 : Math.hypot(player.vx || 0, player.vy || 0) > 40)) return false;
  const target = me || player;
  return Math.hypot(pursuer.x - target.x, pursuer.y - target.y) < 12 * 32 * pdK() && pdSight(pursuer.x, pursuer.y, target.x, target.y);
}
function pdSurrenderControl(show) {
  let b = PD.surrenderButton;
  if (!b && show) {
    b = document.createElement("button"); b.id = "pdSurrender"; b.type = "button";
    b.textContent = "✋ SURRENDER";
    b.style.cssText = "position:fixed;left:50%;top:calc(max(8px,env(safe-area-inset-top)) + 126px);transform:translateX(-50%);z-index:9601;min-height:48px;padding:8px 20px;border-radius:12px;border:2px solid #90caf9;background:#15243a;color:white;font:700 15px system-ui,sans-serif;touch-action:manipulation";
    b.addEventListener("pointerdown", e => e.stopPropagation());
    b.addEventListener("click", e => { e.stopPropagation(); pdOfferSurrender(); });
    document.body.appendChild(b); PD.surrenderButton = b;
  }
  if (b) b.style.display = show ? "block" : "none";
}
function pdOfferSurrender() {
  if (!pdCanSurrender()) { pdSurrenderControl(false); return; }
  PD.st = "surrender"; PD.wasPaused = runPaused; runPaused = true; pdSurrenderControl(false);
  const carText = VEH.me ? " Your current vehicle will be impounded." : "";
  pdPanel("Turn yourself in?", "You can spend the night in jail and be released in the morning. Your current wanted status will be cleared." + carText,
    [["✋ Surrender · serve time", () => { pdClosePanel(); pdJail(0, true); }],
     ["↩ Keep going", () => { pdClosePanel(); runPaused = PD.wasPaused; PD.st = "flee"; }]]);
}
// fines (dollars): speeding by how far over, crashes, red lights, evading
function pdFine(P, rude) {
  let f = 0;
  const K = new Set(PD.why);
  if (K.has("speed")) { const over = Math.max(0, (P.mph || 0) - (P.lim || 0)); f += 75 + Math.max(0, over - 10) * 10; }
  if (K.has("crash")) f += 150;
  if (K.has("red")) f += 125;
  if (K.has("evade")) f += 300;
  if (rude) f += 25;
  return Math.min(900, Math.round(f / 5) * 5);
}
function pdOpening(P) {
  const K = new Set(PD.why), road = P.road || "this road", out = ["License and registration, please."];
  if (K.has("evade")) out.push("You didn't stop when I lit you up. That's a big problem.");
  if (K.has("speed")) out.push("I clocked you at " + pdSpd(P.mph) + " in a " + pdSpd(P.lim) + (pdKmh() ? " zone" : "") + " on " + road + ".");
  if (K.has("red")) out.push("You ran the red light" + (P.road ? " at " + P.road : "") + " back there.");
  if (K.has("crash")) out.push("And you hit something back there. Anybody hurt?");
  return out.join(" ");
}
function pdTalk() {
  PD.st = "talk";
  const P = PD.pend || { mph: 0, lim: 0, road: "" };
  PD.wasPaused = !!runPaused; runPaused = true;
  pdBanner(null);
  pdPanel(PD.officer + " · " + PD.agency, pdOpening(P), [
    ["🙏 “Sorry, officer.”", () => pdDecide(P, "sorry")],
    ["📄 Hand over your license", () => pdDecide(P, "license")],
    ["😤 “I'm in a hurry.”", () => pdDecide(P, "rude")],
    ["🏁 Floor it", () => { pdClosePanel(); runPaused = PD.wasPaused; pdFlee(); }, "danger"]
  ]);
}
function pdDecide(P, how) {
  const K = new Set(PD.why), over = (P.mph || 0) - (P.lim || 0), minor = K.size === 1 && K.has("speed") && over < 16;
  const warn = !K.has("evade") && ((how === "sorry" && minor && Math.random() < 0.4) || (how === "license" && minor && over < 12 && Math.random() < 0.2));
  if (warn) {
    pdPanel(PD.officer, (how === "sorry" ? "Alright. " : "") + "Slow it down out here. I'm letting you off with a warning this time.", [["👍 Thank you, officer", () => pdRelease()]]);
    return;
  }
  const fine = pdFine(P, how === "rude"), wallet = typeof itWallet === "function" ? itWallet() : 0;
  PD.fine = fine;
  const say = (how === "rude" ? "Then you should've left earlier. " : how === "sorry" ? "I appreciate that. " : "") + "Here's your citation — $" + fine + ". It's charged to your card on file.";
  if (wallet >= fine) {
    pdPanel(PD.officer, say + " Drive safe.", [["✔ OK", () => { pdPay(fine); pdRelease(); }]]);
  } else {
    pdPanel(PD.officer, say + " …Your card was declined. I'm going to have to take you in.", [["😞 Go with the officer", () => { pdClosePanel(); pdJail(fine); }]]);
  }
}
function pdPay(fine) {
  if (typeof itPay === "function") itPay(-fine);
  PD.stats.tickets++;
  const why = PD.why.includes("speed") && PD.pend ? "Speeding " + pdSpd(PD.pend.mph) + " in a " + pdSpd(PD.pend.lim) + (pdKmh() ? " km/h" : "") : PD.why.includes("red") ? "Red-light violation" : PD.why.includes("crash") ? "Unsafe driving · collision" : "Traffic citation";
  pdNotify({ icon: "🏦", app: "BANK", title: pdClerk(), amt: -fine, sub: "Traffic citation · " + why });
}
function pdRelease() {
  pdClosePanel(); runPaused = PD.wasPaused;
  PD.st = "leave"; PD.returnT = 0; PD.cool = runTime + 20; PD.pend = null;
}

/* --- 4. A NIGHT IN JAIL -------------------------------------------------------------------------------------------- */
function pdCancelJail() {
  PD.jailSeq = (PD.jailSeq || 0) + 1;
  for (const id of PD.jailTimers || []) clearTimeout(id);
  PD.jailTimers = [];
  const old = document.getElementById("pdJail"); if (old) old.remove();
}
function pdJail(fine, voluntary) {
  pdCancelJail(); pdSurrenderControl(false); pdBanner(null);
  const seq = PD.jailSeq, later = (fn, ms) => {
    const id = setTimeout(() => { if (PD.jailSeq === seq) fn(); }, ms); PD.jailTimers.push(id);
  };
  const hadCar = !!VEH.me;
  PD.st = "jail"; PD.stats.jail++;
  runPaused = true;
  const ov = document.createElement("div");
  ov.id = "pdJail";
  ov.style.cssText = "position:fixed;inset:0;z-index:9800;background:#000;opacity:0;transition:opacity .9s;display:flex;flex-direction:column;align-items:center;justify-content:center;color:#eceff1;font:600 20px/1.5 system-ui,sans-serif;text-align:center;padding:24px";
  ov.innerHTML = '<div style="font-size:13px;letter-spacing:4px;color:#90a4ae;margin-bottom:10px">' + tfEscPD(PD.agency.toUpperCase()) + '</div><div id="pdJ1">' + (voluntary ? 'You surrendered to the police.' : 'You couldn\'t afford the $' + fine + ' ticket.') + '</div><div id="pdJ2" style="opacity:0;transition:opacity .8s;margin-top:8px">You spent the night in jail.</div>';
  document.body.appendChild(ov);
  requestAnimationFrame(() => { ov.style.opacity = "1"; });
  later(() => { const e = document.getElementById("pdJ2"); if (e) e.style.opacity = "1"; }, 1700);
  later(() => {
    // the next morning, 7:00 — out the front door of the station, the car impounded
    try { pdMorningAfter(); } catch (e) { if (window.trackProgress) window.trackProgress("pdJail: " + e.message, true); }
    ov.innerHTML = '<div style="font-size:13px;letter-spacing:4px;color:#90a4ae">THE NEXT MORNING</div><div style="font-size:30px;margin-top:6px">7:00 AM</div><div style="font-size:15px;color:#b0bec5;margin-top:6px">Released · ' + tfEscPD(PD.agency) + '</div>';
    later(() => { ov.style.opacity = "0"; later(() => { ov.remove(); runPaused = false; PD.st = "idle"; PD.cool = runTime + 30; PD.jailTimers = []; pdNotify({ icon: "📋", app: "NOTICE", title: PD.agency, sub: "Released · time served" + (hadCar ? " — your car was impounded" : "") }); }, 950); }, 2300);
  }, 4300);
}
function tfEscPD(s) { return String(s || "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c])); }
function pdMorningAfter() {
  const v = VEH.me;
  if (v) {
    try { vehExit(false); } catch (e) {}
    const i = VEH.list.indexOf(v); if (i >= 0) VEH.list.splice(i, 1);
    if (v.key) VEH.byKey.delete(v.key);
    if (VEH.lastMine === v) VEH.lastMine = null;
  }
  if (typeof SCN !== "undefined" && typeof SCN.min === "number") {
    SCN.min = (Math.floor(SCN.min / 1440) + 1) * 1440 + 420; if (typeof SCN.day === "number") SCN.day++;
    if (typeof scnDarkness === "function") SCN.dark = scnDarkness(SCN.min);
    if (typeof scnHud === "function") try { scnHud(); } catch (e) {}
  }
  // the nearest police station we know of
  let best = null, bd = 1e18;
  if (CITY.blockCache) for (const B of CITY.blockCache.values()) for (const b of (B && B.blds) || []) {
    if (b.kind !== "police" && b.type !== "police") continue;
    const bx = (b.x + b.w / 2) * 16 - CITY.orx, by = (b.y + b.h / 2) * 16 - CITY.ory, d = Math.hypot(bx - player.x, by - player.y);
    if (d < bd) { bd = d; best = { b, x: bx, y: by }; }
  }
  if (best) {
    const q = cityFindWalkable(best.x, best.y + best.b.h * 8 + 20, 900, true);
    if (q) { player.x = q[0]; player.y = q[1]; }
    if (best.b.name) PD.agency = best.b.name;
  }
  player.vx = 0; player.vy = 0;
  if (typeof ECO !== "undefined" && ECO.W) { ECO.W.heat = 0; if (typeof ecoSetLevel === "function") ecoSetLevel(); }
  PD.unit = null; PD.off = null; PD.pend = null; PD.why = []; PD.trail.length = 0;
  if (typeof cityRunTick === "function") try { cityRunTick(); } catch (e) {}
}

/* --- Player-operated observational speed radar ---------------------------------
   This is a deliberately limited, stationary cruiser tool, not enforcement or
   a career. The scan selects the nearest moving vehicle in a narrow front/rear
   cone on the SAME traffic-network link, with direct building/terrain sight.
   That conservative association may miss traffic at intersections or on a
   separate representation of the same road; never label a blank as all-clear.
*/
const PD_RADAR = { panel:null, mode:"front", next:0, target:null };
function pdRadarScan(mode) {
  if (!["front","rear","both"].includes(mode)) return {ok:false,why:"Select front, rear or both."};
  const me = typeof VEH !== "undefined" ? VEH.me : null;
  if (!runActive || !CITY.on || !player || !me || player.inVehicle !== 3 || me.kind !== "police" || me.dead || me.flyAir || !TRF.on || !TRF.net)
    return {ok:false,why:"Radar is available in a working police cruiser on an active traffic map."};
  const ownMph=pdMph(me);
  if (!Number.isFinite(ownMph) || !Number.isFinite(me.ang)) return {ok:false,why:"Radar position or speed unavailable."};
  if (ownMph > 3) return {ok:false,why:"Stop the cruiser to use radar."};
  const origin=trfM(me.x,me.y), road=trfRoadAt(origin[0],origin[1]), k=pdK();
  if (!road || !road.link || !Number.isFinite(road.mph) || !(k>0)) return {ok:false,why:"Park on a mapped road to use radar."};
  const cs=Math.cos(me.ang), sn=Math.sin(me.ang), max=120*k*32, min=5*k*32, cosine=Math.cos(Math.PI/9);
  let best=null;
  function consider(id,x,y,mph,vx,vy,link,limit,name) {
    if (![x,y,mph,vx,vy,limit].every(Number.isFinite) || link!==road.link || mph<1) return;
    const dx=x-me.x,dy=y-me.y,dist=Math.hypot(dx,dy); if(dist<min || dist>max) return;
    const forward=(dx*cs+dy*sn)/dist, sector=forward>=cosine?"front":forward<=-cosine?"rear":null;
    if(!sector || (mode!=="both" && mode!==sector) || (best && dist>=best.dist))return;
    if(!pdSight(me.x,me.y,x,y))return;
    const radial=(dx*vx+dy*vy)/dist;
    best={id,sector,mph,limit,name:String(name||"Mapped road"),x,y,metres:dist/(32*k),motion:Math.abs(radial)<0.25?"crossing":radial<0?"approaching":"receding",dist};
  }
  for(const c of TRF.cars) {
    if(!c || c.dead || c.st!==0 || !c.L || !(c.k>0) || !Number.isFinite(c.ang))continue;
    const x=c.x*32-CITY.orx,y=c.y*32-CITY.ory,sp=c.v*32;
    consider("traffic:"+c.id,x,y,c.v/c.k/0.44704,Math.cos(c.ang)*sp,Math.sin(c.ang)*sp,c.L,c.L.lim,c.L.name);
  }
  for(const v of VEH.list) {
    if(!v || v===me || v.dead || v.far || !PD_ROAD.has(v.kind) || v.flyAir)continue;
    const dx=v.x-me.x,dy=v.y-me.y,d=Math.hypot(dx,dy); if(!Number.isFinite(d) || d<min || d>max)continue;
    const forward=(dx*cs+dy*sn)/d; if(Math.abs(forward)<cosine || (mode==="front" && forward<0) || (mode==="rear" && forward>0))continue;
    const px=trfM(v.x,v.y),targetRoad=trfRoadAt(px[0],px[1]); if(!targetRoad)continue;
    consider("vehicle:"+String(v.key||"unidentified"),v.x,v.y,pdMph(v),v.vx||0,v.vy||0,targetRoad.link,targetRoad.mph,targetRoad.name);
  }
  if(best)delete best.dist;
  return {ok:true,target:best};
}
function pdRadarClose() {
  if(PD_RADAR.panel){PD_RADAR.panel.remove();PD_RADAR.panel=null;}
  PD_RADAR.next=0;PD_RADAR.target=null;
}
function pdRadarRefresh() {
  const panel=PD_RADAR.panel; if(!panel)return;
  const result=pdRadarScan(PD_RADAR.mode), out=panel.querySelector(".radar-result");
  PD_RADAR.target=result.ok?result.target:null;
  let text;
  if(!result.ok)text=result.why;
  else if(!result.target)text="No matching moving vehicle in this beam. This is not an all-clear.";
  else {
    const t=result.target,unit=pdKmh()?"km/h":"mph", speed=pdKmh()?Math.round(t.mph*1.609344):Math.round(t.mph), limit=pdSpd(t.limit);
    text=t.id+" · "+t.sector.toUpperCase()+" · "+t.motion+" · "+Math.round(t.metres)+" m\nSpeed "+speed+" "+unit+" · road limit "+limit+" "+unit+"\n"+t.name;
  }
  if(out.textContent!==text)out.textContent=text;
  panel.querySelectorAll("[data-sector]").forEach(b=>b.setAttribute("aria-pressed",b.dataset.sector===PD_RADAR.mode?"true":"false"));
}
function pdRadarOpen() {
  if(PD_RADAR.panel){pdRadarClose();return;}
  const check=pdRadarScan(PD_RADAR.mode);
  if(!check.ok){if(typeof vehToast==="function")vehToast(check.why);return;}
  const panel=document.createElement("section");panel.id="pdRadar";panel.setAttribute("role","region");panel.setAttribute("aria-label","Cruiser speed radar");
  panel.style.cssText="position:fixed;right:max(8px,env(safe-area-inset-right));top:max(8px,env(safe-area-inset-top));z-index:9601;width:min(310px,calc(100vw - 24px));box-sizing:border-box;padding:12px;background:#121f2bf5;color:#edf8ff;border:1px solid #80deea;border-radius:12px;font:14px/1.35 system-ui,sans-serif;box-shadow:0 6px 22px #0009";
  const title=document.createElement("strong");title.textContent="CRUISER RADAR · OBSERVATION ONLY";panel.appendChild(title);
  const help=document.createElement("p");help.textContent="Stationary scan: nearest moving vehicle in the selected narrow beam on this mapped road. Buildings block sight; other cars do not. No automatic ticket or stop.";help.style.margin="6px 0";panel.appendChild(help);
  const result=document.createElement("p");result.className="radar-result";result.setAttribute("aria-live","polite");result.style.cssText="white-space:pre-line;color:#b2f5ff;min-height:3em;margin:6px 0";panel.appendChild(result);
  for(const [mode,label] of [["front","FRONT"],["rear","REAR"],["both","BOTH"]]){
    const b=document.createElement("button");b.type="button";b.className="btn";b.dataset.sector=mode;b.textContent=label;b.style.cssText="min-width:60px;min-height:44px;margin:2px";b.onclick=()=>{PD_RADAR.mode=mode;pdRadarRefresh();};panel.appendChild(b);
  }
  if (typeof pdpPanelRow === "function") pdpPanelRow(panel);
  const close=document.createElement("button");close.type="button";close.className="btn";close.textContent="CLOSE";close.style.cssText="min-width:60px;min-height:44px;margin:2px";close.onclick=pdRadarClose;panel.appendChild(close);
  for(const ev of ["pointerdown","touchstart"])panel.addEventListener(ev,e=>e.stopPropagation(),{passive:true});
  document.body.appendChild(panel);PD_RADAR.panel=panel;PD_RADAR.next=0;pdRadarRefresh();
}
// Both the actual vehicle and its minimap direction are marked; an ID alone
// would not tell the player which of several traffic cars was measured.
function pdRadarWorld(g) {
  const t=PD_RADAR.panel && PD_RADAR.target;if(!t)return;
  g.save();g.strokeStyle="#65f4ff";g.lineWidth=2;g.beginPath();g.arc(t.x,t.y,24,0,Math.PI*2);g.stroke();
  g.font="bold 11px sans-serif";g.textAlign="center";g.fillStyle="#65f4ff";g.fillText("RADAR",t.x,t.y-30);g.restore();
}
function pdRadarMini(g) {
  const t=PD_RADAR.panel && PD_RADAR.target;
  if(!t || !runActive || typeof MAPV==="undefined" || MAPV.open || (typeof HUDL!=="undefined" && HUDL.enabled && HUDL.miniHidden))return;
  const r=miniRect(),mpp=MAPV.miniSizes[MAPV.mini],[px,py]=mapPlayerM();
  let dx=((t.x+CITY.orx)/32-px)/mpp,dy=((t.y+CITY.ory)/32-py)/mpp;
  const lim=r.S/2-10,k=Math.min(1,lim/Math.max(Math.abs(dx),Math.abs(dy),1));dx*=k;dy*=k;
  g.save();g.fillStyle="#65f4ff";g.strokeStyle="#08212a";g.lineWidth=2;g.beginPath();g.arc(r.x+r.S/2+dx,r.y+r.S/2+dy,6,0,Math.PI*2);g.fill();g.stroke();g.fillStyle="#08212a";g.textAlign="center";g.textBaseline="middle";g.font="bold 9px sans-serif";g.fillText("R",r.x+r.S/2+dx,r.y+r.S/2+dy);g.restore();
}
function pdRadarFrame() {
  if(!PD_RADAR.panel)return;
  if(!runActive || !CITY.on || !player || !VEH.me || player.inVehicle!==3 || VEH.me.kind!=="police" || (typeof MAPV!=="undefined" && MAPV.open) || PD.panel){pdRadarClose();return;}
  const now=performance.now(); if(now<PD_RADAR.next)return;PD_RADAR.next=now+350;pdRadarRefresh();
}

/* --- 5. UI: the talk panel, the banner, the bank notification ---------------------------------------------------- */
// the speed limit where you're driving, next to the speedometer (it turns red when you're well over)
function pdLimitSign(road, mph) {
  const hud = document.getElementById("vehHud");
  let el = document.getElementById("pdLimit");
  if (!road || !hud || hud.style.display === "none") { if (el) el.style.display = "none"; return; }
  if (!el) {
    el = document.createElement("div"); el.id = "pdLimit";
    el.style.cssText = "flex-shrink:0;width:38px;border:2px solid #111;border-radius:6px;background:#fafafa;color:#111;text-align:center;font:800 8px/1 system-ui,sans-serif;padding:3px 0 2px;margin-left:2px";
    hud.appendChild(el);
  }
  const over = mph > road.mph + Math.max(10, road.mph * 0.2), key = road.mph + "|" + over;
  if (el.dataset.k !== key) { el.dataset.k = key; el.innerHTML = 'SPEED<br>LIMIT<div style="font:900 17px/1.05 system-ui,sans-serif">' + pdSpd(road.mph) + "</div>" + (pdKmh() ? '<div style="font:700 7px system-ui">km/h</div>' : ""); el.style.boxShadow = over ? "0 0 0 2px #ff1744" : "none"; }
  el.style.display = "block";
}
function pdPanel(title, text, buttons) {
  pdClosePanel();
  const el = document.createElement("div");
  el.id = "pdPanel";
  el.style.cssText = "position:fixed;left:50%;bottom:max(14px,env(safe-area-inset-bottom));transform:translateX(-50%);width:min(94vw,440px);z-index:9700;background:linear-gradient(#1c2331,#121822);border:1px solid #3d5a80;border-radius:16px;box-shadow:0 10px 40px rgba(0,0,0,.6);padding:14px 14px 12px;color:#eceff1;font:15px/1.45 system-ui,sans-serif";
  let h = '<div style="display:flex;align-items:center;gap:10px;margin-bottom:8px"><div style="width:40px;height:40px;border-radius:50%;background:#1a237e;display:flex;align-items:center;justify-content:center;font-size:22px">👮</div><div style="font-weight:700;color:#90caf9">' + tfEscPD(title) + '</div></div>';
  h += '<div style="margin:0 2px 12px">“' + tfEscPD(text) + '”</div><div style="display:flex;flex-direction:column;gap:8px">';
  buttons.forEach((b, i) => { h += '<button data-i="' + i + '" style="min-height:48px;border-radius:12px;border:1px solid ' + (b[2] === "danger" ? "#c62828" : "#3d5a80") + ';background:' + (b[2] === "danger" ? "#3a1414" : "#22314a") + ';color:#fff;font:600 16px system-ui,sans-serif;text-align:left;padding:10px 14px">' + tfEscPD(b[0]) + "</button>"; });
  el.innerHTML = h + "</div>";
  el.querySelectorAll("button").forEach(btn => btn.addEventListener("click", e => { e.stopPropagation(); const f = buttons[+btn.dataset.i][1]; f(); }));
  ["touchstart", "pointerdown"].forEach(t => el.addEventListener(t, e => e.stopPropagation(), { passive: true }));
  document.body.appendChild(el);
  PD.panel = el;
}
function pdClosePanel() { if (PD.panel) { PD.panel.remove(); PD.panel = null; } }
function pdBanner(title, sub) {
  let el = PD.banner;
  if (!title) { if (el) { el.remove(); PD.banner = null; } return; }
  if (!el) {
    el = document.createElement("div"); el.id = "pdBanner";
    el.style.cssText = "position:fixed;left:50%;top:calc(max(8px,env(safe-area-inset-top)) + 64px);transform:translateX(-50%);z-index:9600;pointer-events:none;text-align:center;padding:7px 16px;border-radius:12px;background:rgba(10,14,24,.82);border:1px solid #ff1744;color:#fff;font:700 16px system-ui,sans-serif;box-shadow:0 0 18px rgba(255,23,68,.35)";
    document.body.appendChild(el); PD.banner = el;
  }
  el.innerHTML = tfEscPD(title) + (sub ? '<div style="font:500 12px system-ui,sans-serif;color:#cfd8dc;margin-top:2px">' + tfEscPD(sub) + "</div>" : "");
}
// a watch-style notification card: { icon, app, title, amt (dollars, signed), sub }
function pdNotify(n) {
  const el = document.createElement("div");
  const amt = typeof n.amt === "number" ? (n.amt < 0 ? "−" : "+") + (typeof itMoney === "function" ? itMoney(Math.abs(n.amt)) : "$" + Math.abs(n.amt)) : "";
  const now = typeof scnTime === "function" && typeof SCN !== "undefined" ? scnTime(SCN.min) : "";
  el.style.cssText = "position:fixed;right:10px;top:calc(max(8px,env(safe-area-inset-top)) + 58px);z-index:9900;width:min(78vw,300px);background:rgba(18,20,26,.94);border:1px solid #37474f;border-radius:18px;padding:10px 12px;color:#eceff1;font:13px/1.35 system-ui,sans-serif;box-shadow:0 8px 28px rgba(0,0,0,.55);transform:translateY(-20px) scale(.96);opacity:0;transition:transform .35s cubic-bezier(.2,.9,.3,1.2),opacity .3s";
  el.innerHTML = '<div style="display:flex;align-items:center;gap:8px;font-size:11px;color:#90a4ae;letter-spacing:1px"><span style="font-size:16px">' + (n.icon || "🔔") + "</span><b>" + tfEscPD(n.app || "") + '</b><span style="margin-left:auto">' + tfEscPD(now) + '</span></div><div style="display:flex;align-items:baseline;gap:8px;margin-top:4px"><div style="font-weight:700;flex:1">' + tfEscPD(n.title || "") + "</div>" + (amt ? '<div style="font:800 18px system-ui,sans-serif;color:' + (n.amt < 0 ? "#ff8a80" : "#69f0ae") + '">' + tfEscPD(amt) + "</div>" : "") + "</div>" + (n.sub ? '<div style="color:#b0bec5;margin-top:2px">' + tfEscPD(n.sub) + "</div>" : "");
  el.addEventListener("click", () => el.remove());
  document.body.appendChild(el);
  requestAnimationFrame(() => { el.style.transform = "none"; el.style.opacity = "1"; });
  try { if (navigator.vibrate) navigator.vibrate([40, 60, 40]); } catch (e) {}
  if (typeof sfx === "function") { sfx(1320, 1320, 0.07, "sine", 0.05); setTimeout(() => sfx(1760, 1760, 0.09, "sine", 0.05), 110); }
  setTimeout(() => { el.style.opacity = "0"; el.style.transform = "translateY(-12px)"; setTimeout(() => el.remove(), 400); }, 4800);
  return el;
}

/* --- 6. DRAWING -------------------------------------------------------------------------------------------------- */
const PD_SPEC = { n: "", b: "h", c: ["#1a237e", "#0d1442", "#3a2a1a"], hd: "cap", w: "none", r: 0, k: 0, s: 0.95, x: "" };
function pdDraw(g, l, t, vw, vh) {
  const u = PD.unit;
  if (u && typeof trfSprite === "function") {
    const s = trfSprite(u), R = s.res;
    g.save(); g.translate(u.x, u.y); g.rotate(u.ang + Math.PI / 2);
    g.drawImage(s, -s.width / R / 2, -s.height / R / 2, s.width / R, s.height / R);
    if (u.siren) { const hw = u.wpx / 2, hl = u.lpx / 2, lr = Math.max(1.2, 3.2 * u.k), a = (runTime * 6) % 2 < 1; g.fillStyle = a ? "#ff1744" : "#2979ff"; g.fillRect(-hw * 0.7, -hl * 0.12, hw * 0.7, lr * 1.2); g.fillStyle = a ? "#2979ff" : "#ff1744"; g.fillRect(0, -hl * 0.12, hw * 0.7, lr * 1.2); g.globalAlpha = 0.16; g.fillStyle = a ? "#ff1744" : "#2979ff"; g.beginPath(); g.arc(0, 0, hl * 1.05, 0, Math.PI * 2); g.fill(); g.globalAlpha = 1; }
    g.restore();
  }
  const O = PD.off;
  if (O && typeof erBodyHuman === "function") {
    g.save(); g.translate(O.x, O.y); g.scale(PD_SPEC.s, PD_SPEC.s);
    try { erBodyHuman(g, PD_SPEC, 424242, O.face, O.walk, 0, false, false); } catch (e) { g.fillStyle = "#1a237e"; g.beginPath(); g.arc(0, 0, 6, 0, 7); g.fill(); }
    g.restore();
  }
}
function pdLights(push) {
  const u = PD.unit; if (!u || !u.siren) return;
  push(u.x, u.y, 160, 0.8, "car");
}

/* --- 7. WIRING --------------------------------------------------------------------------------------------------- */
(function pdWire() {
  if (typeof V10 !== "undefined") {
    V10.onRunReset.push(() => { pdRadarClose(); if (typeof TRF !== "undefined") TRF.view = null; pdCancelJail(); pdSurrenderControl(false); pdClosePanel(); pdBanner(null); PD.unit = null; PD.off = null; PD.st = "idle"; });
    V10.onRunStart.push(() => { pdRadarClose(); if (typeof TRF !== "undefined") TRF.view = null; pdCancelJail(); pdSurrenderControl(false); pdClosePanel(); pdBanner(null); PD.st = "idle"; PD.unit = null; PD.off = null; PD.pend = null; PD.trail = []; PD.cool = 0; PD.lastCrash = typeof VEH !== "undefined" && VEH.stats ? VEH.stats.crashes : 0; PD.speedT = 0; PD.why = []; });
    V10.onRenderWorld.push(g => { if(CITY.on && runActive)pdRadarWorld(g); });
    V10.onRenderScreen.push(g => { if(CITY.on && runActive)pdRadarMini(g); });
    V10.onFrame.push(() => { try { pdRadarFrame(); } catch (e) { pdRadarClose(); if (window.trackProgress) window.trackProgress("radar: " + e.message, true); } });
    V10.onStep.push(dt => { try { pdStep(dt); } catch (e) { if (window.trackProgress) window.trackProgress("police: " + e.message, true); pdEnd(true); } });
  }
  window.addEventListener("keydown", e => { if(e.key === "Escape" && PD_RADAR.panel) { e.preventDefault(); e.stopImmediatePropagation(); pdRadarClose(); } }, true);
  if (typeof TRF !== "undefined") TRF.onCrash = (c, v) => { if (PD.on) pdOffense("crash", { what: "a car" }); };
  if (typeof vehRenderLayer === "function") { const _vr = vehRenderLayer; window.vehRenderLayer = vehRenderLayer = function (g, l, t, vw, vh) { _vr(g, l, t, vw, vh); try { pdDraw(g, l, t, vw, vh); } catch (e) {} }; }
  if (typeof scnLights === "function") { const _sl = scnLights; window.scnLights = scnLights = function (push) { _sl(push); pdLights(push); }; }
})();
// EOF:js/police.js
