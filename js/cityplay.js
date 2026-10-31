/* =========================================================================
   OMNI-SHIFT v14 — NEXUS CITY · GAME INTEGRATION
   Turns every regular run into a drop into a 64 × 64 km generated region
   (Proving Ground and the classic arena — Options → World — stay as they were).
   • run start: generate (seeded, instant), dress for the hero's universe,
     pick the drop zone (yours from the map, or a random suburban street near
     Nexus City) and map it to local (256, 256) so every system keeps working
   • engine patches: obstacle & sight queries, enemy visibility, spawn points
   • projectiles vs. walls: ricochets off hard surfaces at grazing angles,
     glass shatters, rockets detonate, bullet holes & scorch marks stay
   • supply caches in buildings, district / street banner
   ========================================================================= */
"use strict";

const CITYP = { empty: [], visR: 56, lastPT: -1, banner: "", bannerT: 0, street: "", district: "", city: "", cacheT: 0, started: false, fps: 60 };

function cityWorldWanted() {
  if (window.PROVING_ACTIVE) return false;
  const q = typeof location !== "undefined" ? new URLSearchParams(location.search).get("world") : null;   // ?world=classic | ?world=city
  if (q === "classic") return false;
  if (q === "city") return true;
  return typeof meta === "undefined" || meta.world !== "classic";
}
// world px of the drop zone
function cityPickDrop() {
  if (typeof meta !== "undefined" && Array.isArray(meta.cityDrop) && meta.cityDrop.length === 2 && meta.cityDrop.every(v => typeof v === "number" && v > 64 && v < CITY.WORLD_T - 64)) {
    return [meta.cityDrop[0] * 16 + 8, meta.cityDrop[1] * 16 + 8];
  }
  const cap = CITY.cities[CITY.capital], cand = [];
  for (let my = 0; my < 64; my++) for (let mx = 0; mx < 64; mx++) {
    if (cityMacroClass(mx, my) !== CL_SUBURB) continue;
    const d = Math.hypot(mx * 1000 + 500 - cap.x, my * 1000 + 500 - cap.y);
    if (d < 7500) cand.push([mx, my]);
  }
  const c = cand.length ? cand[Math.floor(Math.random() * cand.length)] : [Math.floor(cap.x / 1000), Math.floor(cap.y / 1000)];
  const S = cityCell(c[0], c[1]), i = Math.floor(Math.random() * (S.vx.length - 1)), l = S.vx[i];
  // stand on the sidewalk of a north-south street, somewhere along the cell
  const xm = l.x + l.w / 2 - Math.max(1, l.sw) * 0.5, ym = c[1] * 1000 + 120 + Math.random() * 760;
  return [xm * 32, ym * 32];
}
function cityRunStart(p) {
  CITY.on = cityWorldWanted();
  const hud = document.getElementById("cityHud");
  if (!CITY.on) { if (hud) hud.style.display = "none"; return; }
  const seed = (typeof meta !== "undefined" && meta.citySeed >>> 0) || 1979;
  if (!CITY.ready || CITY.seed !== seed) cityGenInit(seed);
  cityApplyTheme(cityThemeKeyForHero(p.cid));
  cityRT.chunks.clear(); cityRT.last = null; cityRT.lastKey = -1; cityRT.doors.clear(); cityRT.broken.clear();
  cityRT.used.clear(); cityRT.dyn.length = 0; cityRT.spawnState.clear(); cityRT.nearDoors = []; cityRT.visGen++;
  if (cityRT.gopen) cityRT.gopen.clear(); if (cityRT.fenceBroken) cityRT.fenceBroken.clear();
  // find a walkable outdoor spot at the drop zone and make it local (256, 256)
  const d = cityPickDrop();
  CITY.orx = d[0] - 256; CITY.ory = d[1] - 256;
  const q = cityFindWalkable(256, 256, 900, true);
  CITY.orx += q[0] - 256; CITY.ory += q[1] - 256;
  p.x = 256; p.y = 256;
  cityRenderReset();
  cityVis.grid = null; cityVis.pBid = null; cityVis.roof.clear(); CITYP.lastPT = -1;
  CITYP.visR = typeof visionRadiusTiles === "function" ? visionRadiusTiles(p.cid) : 56;
  cityComputeVis(CITYP.visR);
  try { cityRenderPrewarm(256, 256, 620); } catch (e) { if (window.trackProgress) window.trackProgress("city prewarm: " + e.message, true); }
  if (typeof stealthRunStart === "function") stealthRunStart(p);
  CITYP.banner = ""; CITYP.street = ""; CITYP.started = true;
  cityUpdateBanner(true);
  cityTips(p);
}
// first three city deploys: four short tips, the last one explains your hero's own sense
function cityTips(p) {
  if (typeof meta === "undefined" || (meta.cityTips | 0) >= 3) return;
  meta.cityTips = (meta.cityTips | 0) + 1; if (typeof saveMeta === "function") saveMeta();
  let el = document.getElementById("cityTip");
  if (!el) { el = document.createElement("div"); el.id = "cityTip"; document.body.appendChild(el); }
  const vp = typeof visionProfile === "function" ? visionProfile(p.cid) : null;
  const tips = [
    "🌆 <b>NEXUS CITY</b> — enemies hide in buildings and patrol the streets. Every gunshot is heard.",
    "🥷 Hold <b>Shift</b> to sneak (and hold fire) · <b>V</b> fits a suppressor on real firearms · blades are nearly silent.",
    "🗺 <b>M</b> map & markers · <b>[ ]</b> zoom the minimap · <b>F</b> drive ANY vehicle (even army trucks), climb ladders 🪜 to the roof · ⛽ refuel at gas stations.",
    vp ? "👁 <b>" + vp[3] + "</b> — " + (typeof VIS_DESC !== "undefined" ? VIS_DESC[vp[0]] || "" : "") : ""
  ].filter(Boolean);
  let k = 0;
  const next = () => {
    if (!runActive || player !== p) { el.style.opacity = 0; return; }
    if (k >= tips.length) { el.style.opacity = 0; return; }
    el.innerHTML = tips[k++]; el.style.opacity = 1;
    setTimeout(() => { el.style.opacity = 0; setTimeout(next, 450); }, 4300);
  };
  setTimeout(next, 3200);
}

/* --- engine patches ----------------------------------------------------------- */
(function cityPatchEngine() {
  const _gc = window.getChunk;
  if (typeof _gc === "function") window.getChunk = function (cx, cy) { return CITY.on ? CITYP.empty : _gc(cx, cy); };
  const _gno = window.getNearbyObstacles;
  if (typeof _gno === "function") window.getNearbyObstacles = function (x, y, r) { return CITY.on ? CITYP.empty : _gno(x, y, r); };
  const _ipb = window.isPointBlockedByObstacle;
  if (typeof _ipb === "function") window.isPointBlockedByObstacle = function (x, y, ignoreLow) { return CITY.on ? cityCircleBlocked(x, y, player && player.inVehicle === 3 ? 19 : 7, !!ignoreLow) : _ipb(x, y, ignoreLow); };
  const _ieos = window.isEnemyOnScreen;
  if (typeof _ieos === "function") window.isEnemyOnScreen = function (j) { return _ieos(j) && (!CITY.on || cityVisibleAt(eX[j], eY[j])); };
  const _alloc = window.allocEnemySlot;
  if (typeof _alloc === "function") window.allocEnemySlot = function (x, y, type, hpMul, formType, leaderIdx) {
    if (CITY.on && cityCircleBlocked(x, y, 9, false)) { const q = cityFindWalkable(x, y, 480, false); x = q[0]; y = q[1]; }
    const i = _alloc(x, y, type, hpMul, formType, leaderIdx);
    if (i >= 0 && CITY.on && typeof stealthOnAlloc === "function") stealthOnAlloc(i);
    return i;
  };
  const _fx = window.fxOnPlayerShot;
  window.fxOnPlayerShot = function (x, y, vx, vy, style, wpnId) {
    if (typeof _fx === "function") _fx(x, y, vx, vy, style, wpnId);
    if (CITY.on && typeof stealthOnPlayerShot === "function") stealthOnPlayerShot(x, y, vx, vy, style, wpnId);
  };
})();

// district danger replaces the arena's distance rings (Threat Sense, HUD, biome lookups)
const CITY_THREAT = [1.0, 1.05, 1.15, 1.4, 1.85, 1.55, 1.1, 1.0];
function cityDistrictAt(x, y) { const [xm, ym] = cityWorldM(x, y); return cityMacroClass(Math.floor(xm / 1000), Math.floor(ym / 1000)); }
function cityShortName() { const [xm, ym] = cityWorldM(player.x, player.y), ci = cityMacroCityIdx(Math.floor(xm / 1000), Math.floor(ym / 1000)); return ci >= 0 ? cityName(CITY.cities[ci]) : "Open Country"; }
(function cityPatchZones() {
  const _tm = window.threatMult;
  if (typeof _tm === "function") window.threatMult = function () { return (CITY.on && player) ? CITY_THREAT[cityDistrictAt(player.x, player.y)] : _tm(); };
  const _gdb = window.getDistBiome;
  if (typeof _gdb === "function") window.getDistBiome = function (x, y) { if (!CITY.on) return _gdb(x, y); const c = cityDistrictAt(x, y); return { id: c, name: CL_NAMES[c], minDist: 0, maxDist: 1e9, tint: "rgba(0,0,0,0)" }; };
})();
// after the biome module set the hero's look: use the city theme's weather / grade, no arena hazards
V10.onRunStart.push(function cityAfterBiome(p) {
  if (!CITY.on || typeof biomeState === "undefined" || !biomeState.th) return;
  const T = CITY.theme;
  biomeState.th = Object.assign({}, biomeState.th, { weather: T.weather || "none", tint: T.tint || "rgba(0,0,0,0)", dark: T.dark || 0.2, hazard: { name: "None", dps: 0, slow: 0, pull: 0, enemyMul: 0 } });
  biomeState.vigKey = "";
  if (typeof biomeWeatherReset === "function") biomeWeatherReset();
  const c = cityDistrictAt(p.x, p.y);
  if (typeof fxBanner === "function") setTimeout(() => { if (player === p && CITY.on) fxBanner(cityShortName().toUpperCase(), CL_NAMES[c] + " · " + T.name, "#80deea", 2.6, false, "city"); }, 400);
});

/* --- projectiles vs. the city -------------------------------------------------- */
const CITY_HARD = new Set([K_EXT_BRICK, K_EXT_MASON, K_EXT_METAL, K_STONE, K_CAR, K_POLE, K_FURN_HARD, K_GDOOR, K_BARS]);
const CITY_DUST = { 1: "#c8b48a", 2: "#b0604a", 3: "#b8b2a6", 4: "#ffd180", 5: "#e8e2d6", 13: "#9aa0a6", 14: "#ffd180", 15: "#9a7a52", 18: "#7a5a32", 21: "#a8a29a" };
function cityProjWall(i, dt) {
  const st = pStyle[i];
  if (st === 1 || st === 6 || st === 8) return false;   // orbit / aura / boomerang styles follow the hero
  const x1 = pX[i], y1 = pY[i], x0 = x1 - pVX[i] * dt, y0 = y1 - pVY[i] * dt;
  const h = cityRay(x0, y0, x1, y1, F_SHOT | F_WIN, 48);
  if (!h.hit) return false;
  const byHero = !pEnemy[i];
  if ((h.f & F_WIN) && !(h.f & F_SHOT)) { cityBreakWindow(h.tx, h.ty, byHero); pDmg[i] *= 0.85; return false; }
  const spd = Math.hypot(pVX[i], pVY[i]) || 1, ux = pVX[i] / spd, uy = pVY[i] / spd;
  const hx = h.x - ux * 2, hy = h.y - uy * 2;
  if (st === 2) { pAct[i] = 0; triggerRocketDetonation(hx, hy, pDmg[i], pRad[i] * 4.8); if (typeof cityDecal === "function") cityDecal(hx, hy, "scorch", 0); return true; }
  const wid = pWpnId[i], prof = typeof stHeroProfile === "function" ? stHeroProfile(wid) : [160, "g", 1];
  const kinetic = byHero ? prof[1] === "g" : (typeof enemyIsKinetic === "function" ? enemyIsKinetic(wid) : CITY.theme.era !== "future");
  const sinGraze = Math.abs(ux * h.nx + uy * h.ny);   // sin of the angle to the surface
  if (kinetic && CITY_HARD.has(h.k) && sinGraze < 0.375 && pBounce[i] < 2) {
    const dot = pVX[i] * h.nx + pVY[i] * h.ny;
    pVX[i] = (pVX[i] - 2 * dot * h.nx) * 0.62; pVY[i] = (pVY[i] - 2 * dot * h.ny) * 0.62;
    pX[i] = h.x + h.nx * 3; pY[i] = h.y + h.ny * 3; pDmg[i] *= 0.55; pBounce[i]++;
    for (let k = 0; k < 4; k++) spawnPt(h.x, h.y, h.nx * 90 + (Math.random() - 0.5) * 120, h.ny * 90 + (Math.random() - 0.5) * 120, 0.18, 1.6, 2, 2);
    if (typeof noiseEmit === "function") noiseEmit(h.x, h.y, 100, "ricochet", byHero ? 0 : 1);
    if (Math.hypot(h.x - player.x, h.y - player.y) < 520 && typeof sfxRicochet === "function" && Math.random() < 0.6) sfxRicochet();
    return true;
  }
  pAct[i] = 0;
  const dust = CITY_DUST[h.k] || "#bdbdbd";
  for (let k = 0; k < 3; k++) spawnPt(hx, hy, h.nx * 50 + (Math.random() - 0.5) * 70, h.ny * 50 + (Math.random() - 0.5) * 70, 0.35, 2.2, 7, 2);
  void dust;
  if (typeof cityDecal === "function" && Math.random() < 0.7) cityDecal(hx, hy, kinetic ? "hole" : (prof[1] === "x" ? "saber" : "scorchs"), Math.atan2(h.ny, h.nx) + Math.PI / 2);
  if (typeof noiseEmit === "function" && byHero) noiseEmit(hx, hy, 68, "impact", 0);
  return true;
}

/* --- per-step: doors, sight, unsticking, caches, banner --------------------------- */
function cityStep(dt) {
  if (!CITY.on || !player) return;
  cityDoorsStep(dt);
  if (!player.flying && cityCircleBlocked(player.x, player.y, 6, true)) { const q = cityResolve(player.x, player.y, 7, true); player.x = q[0]; player.y = q[1]; }
  // enemies shoved into walls by knockback / force powers / grapples
  if ((CITYP.unstick = (CITYP.unstick || 0) + 1) % 3 === 0) for (let j = 0; j < MAX_E; j++) {
    if (!eAct[j] || eLevitate[j] > 0) continue;
    if (cityCircleBlocked(eX[j], eY[j], 6, false)) { const q = cityResolve(eX[j], eY[j], 8, false); eX[j] = q[0]; eY[j] = q[1]; }
  }
  // fireteam / summoned minions slide along walls too
  if (typeof mAct !== "undefined") for (let m = 0; m < MAX_MINION; m++) {
    if (!mAct[m] || !cityCircleBlocked(mX[m], mY[m], 6, false)) continue;
    const q = cityResolve(mX[m], mY[m], 7, false); mX[m] = q[0]; mY[m] = q[1];
  }
  const ptx = cityTX(player.x), pty = cityTY(player.y), key = ptx * 131072 + pty;
  if (key !== CITYP.lastPT || cityVis.gen !== cityRT.visGen) {
    CITYP.lastPT = key;
    CITYP.visR = typeof visionRadiusTiles === "function" ? visionRadiusTiles(player.cid) : CITYP.visR;
    cityComputeVis(CITYP.visR);
  }
  // supply caches
  const C = cityChunk(ptx >> 7, pty >> 7);
  for (const k of C.caches) {
    if (Math.abs(k.x - ptx) > 1 || Math.abs(k.y - pty) > 1 || cityRT.used.has("cache|" + k.uid)) continue;
    cityRT.used.add("cache|" + k.uid);
    const heal = player.maxHp * 0.3;
    player.hp = Math.min(player.maxHp, player.hp + heal);
    if (typeof spawnOrb === "function") spawnOrb(player.x + 6, player.y, 12 + waveNum * 2.5);
    spawnSpeech(player.x, player.y - 28, cityCacheName() + " · +" + Math.round(heal) + " HP", "#b2ff59", 2.0);
    if (typeof sfx === "function") sfx(520, 1040, 0.12, "triangle", 0.12);
  }
  CITYP.bannerT -= dt;
  if ((CITYP.bT = (CITYP.bT || 0) + dt) > 0.5) { CITYP.bT = 0; cityUpdateBanner(false); }
}
function cityCacheName() {
  const f = crFam(), k = CITY.themeKey;
  return k === "wizard" ? "POTION STASH" : k === "medieval" ? "SUPPLY CHEST" : k === "western" ? "STRONGBOX" : k === "gothic" ? "MUNITORUM CACHE" : k === "wasteland" ? "STASH" : f === "scifi" ? "SUPPLY CRATE" : "SUPPLY CACHE";
}
// "NEXUS CITY · Downtown · Meridian Ave"
function cityUpdateBanner(force) {
  const [xm, ym] = cityWorldM(player.x, player.y), mx = Math.floor(xm / 1000), my = Math.floor(ym / 1000);
  const ci = cityMacroCityIdx(mx, my), cls = cityMacroClass(mx, my), city = ci >= 0 ? cityName(CITY.cities[ci]) : "Open Country";
  // nearest street line
  const S = cityCell(mx, my); let best = null, bd = 1e9, ax = 0;
  for (const l of S.vx) { const d = Math.abs(l.x - xm); if (d < bd) { bd = d; best = l; ax = 0; } }
  for (const l of S.hy) { const d = Math.abs(l.y - ym); if (d < bd) { bd = d; best = l; ax = 1; } }
  const street = best && bd < 60 ? cityStreetName(ax, best, mx, my) : "";
  const onRoof = !!player.roof, b = onRoof ? cityBldT(cityTX(player.x), cityTY(player.y)) : cityBuildingAt(player.x, player.y), inside = b ? (cityBuildingLabel(b) || (b.type === "house" || b.type === "farmhouse" ? "House" : b.type === "apartment" ? "Apartments" : b.type.charAt(0).toUpperCase() + b.type.slice(1))) : "";
  const top = city + " · " + CL_NAMES[cls], sub = inside ? (onRoof ? "On the roof: " : "Inside: ") + inside : street;   // v14.1 roofs
  const el = document.getElementById("cityHud");
  if (!el) return;
  el.style.display = "block";
  if (force || top !== CITYP.banner) {
    if (CITYP.banner && top !== CITYP.banner && typeof fxBanner === "function") fxBanner(city.toUpperCase(), CL_NAMES[cls], "#80deea", 1.6, false, "city");
    CITYP.banner = top;
  }
  el.innerHTML = '<b>' + top + '</b><span>' + sub + '</span>';
}
function cityRenderWorldHook() { if (CITY.on) cityRenderOverlay(); }

/* --- drivable city vehicles --------------------------------------------------------- */
const CITY_CAR_NAME = { sedan: "CAR", spinner: "SPINNER", speeder: "LANDSPEEDER", hover: "HOVERCAR", apc: "APC", mule: "MULE", wagon: "WAGON", thopter: "ORNITHOPTER", glider: "DEATH GLIDER", rhino: "RHINO", rusted: "WRECK-RUNNER", cart: "CART", anglia: "FLYING ANGLIA" };
function cityFindCar() {
  const ptx = cityTX(player.x), pty = cityTY(player.y);
  let best = null, bd = 46;
  for (let cy = (pty - 8) >> 7; cy <= (pty + 8) >> 7; cy++) for (let cx = (ptx - 8) >> 7; cx <= (ptx + 8) >> 7; cx++) {
    const C = cityChunk(cx, cy);
    for (const p of C.props) {
      if (p.t !== "car" || p.wreck || (p.key && cityRT.used.has(p.key))) continue;
      const x = (p.x + p.w / 2) * 16 - CITY.orx, y = (p.y + p.h / 2) * 16 - CITY.ory, d = Math.hypot(x - player.x, y - player.y) - Math.max(p.w, p.h) * 4;
      if (d < bd) { bd = d; best = { p, x, y }; }
    }
  }
  return best;
}
function cityEnterCar(t) {
  const p = t.p;
  if (p.dyn) cityRT.dyn.splice(cityRT.dyn.indexOf(p), 1); else cityRT.used.add(p.key);
  cityRebuildAt(Math.floor(p.x + p.w / 2), Math.floor(p.y + p.h / 2));
  player.x = t.x; player.y = t.y; player.inVehicle = 3; player.vehicleHp = 170;
  const o = typeof p.o === "number" ? p.o : 0;
  player.cityCar = { kind: CITY.theme.car || "sedan", v: p.v | 0, ang: o * Math.PI / 2 - Math.PI / 2 + (p.ang || 0), L: Math.min(p.w, p.h) * 16, D: Math.max(p.w, p.h) * 16 };
  spawnSpeech(player.x, player.y - 30, (CITY_CAR_NAME[player.cityCar.kind] || "VEHICLE") + " — DRIVE!  [F] TO EXIT", "#80deea", 1.8);
  if (typeof sfx === "function") sfx(120, 260, 0.35, "sawtooth", 0.12);
  if (typeof updateHUD === "function") updateHUD();
}
function cityExitCar() {
  const car = player.cityCar || { kind: "sedan", v: 0, ang: 0, L: 64, D: 144 };
  const a = car.ang, horiz = Math.abs(Math.cos(a)) > Math.abs(Math.sin(a));
  const w = (horiz ? car.D : car.L) / 16, h = (horiz ? car.L : car.D) / 16, o = horiz ? (Math.cos(a) > 0 ? 1 : 3) : (Math.sin(a) > 0 ? 2 : 0);
  const d = { t: "car", x: (player.x + CITY.orx) / 16 - w / 2, y: (player.y + CITY.ory) / 16 - h / 2, w, h, s: FS_COVER, o, v: car.v, dyn: true, ang: a - (o * Math.PI / 2 - Math.PI / 2), key: "dyn" + Math.random() };
  cityRT.dyn.push(d);
  if (cityRT.dyn.length > 24) cityRT.dyn.shift();
  player.inVehicle = 0; player.cityCar = null;
  cityRebuildAt(Math.floor(d.x + w / 2), Math.floor(d.y + h / 2));
  const q = cityFindWalkable(player.x - Math.sin(a) * 34, player.y + Math.cos(a) * 34, 200, false);
  player.x = q[0]; player.y = q[1];
  spawnSpeech(player.x, player.y - 24, "PARKED", "#80deea", 1.0);
  if (typeof updateHUD === "function") updateHUD();
}
function cityCarStep(dt) {
  if (player.inVehicle !== 3) return;
  const car = player.cityCar || (player.cityCar = { kind: CITY.theme.car, v: 0, ang: 0, L: 64, D: 144 });
  const sp = Math.hypot(player.vx || 0, player.vy || 0);
  if (sp > 20) { let df = Math.atan2(player.vy, player.vx) - car.ang; df = Math.atan2(Math.sin(df), Math.cos(df)); car.ang += df * Math.min(1, dt * 7); }
  // ramming
  if (sp > 220) for (let j = 0; j < MAX_E; j++) {
    if (!eAct[j] || (allyCount > 0 && allyIs(j)) || eType[j] >= 99) continue;
    if (Math.hypot(eX[j] - player.x, eY[j] - player.y) > 26) continue;
    const dmg = sp * 0.6 * (player.might || 1);
    eHP[j] -= dmg; eStun[j] = Math.max(eStun[j], 0.8);
    eX[j] += player.vx / sp * 30; eY[j] += player.vy / sp * 30;
    if (typeof spawnDmg === "function") spawnDmg(eX[j], eY[j], dmg, true);
    if (eHP[j] <= 0) killEnemy(j, false);
    player.vehicleHp -= 6;
  }
  if (player.vehicleHp <= 0) { cityExitCar(); spawnBlastWave(player.x, player.y, 75, "#ff7043"); }
}
function cityRenderCar(g) {
  if (!CITY.on || !player || player.inVehicle !== 3 || !player.cityCar) return;
  const c = player.cityCar;
  g.save(); g.translate(player.x, player.y); g.rotate(c.ang + Math.PI / 2);
  crVehicle(g, c.kind, c.L, c.D, c.v, 7, false, false);
  g.restore();
}
(function cityPatchInteract() {
  const _fit = window.findInteractTarget, _twi = window.triggerWorldInteract;
  if (typeof _fit === "function") window.findInteractTarget = function () {
    if (CITY.on && player) {
      if (player.inVehicle === 3) return { kind: "exitVeh", x: player.x, y: player.y - 18, label: "[EXIT VEHICLE]" };
      const t = cityFindCar();
      if (t) return { kind: "cityCar", car: t, x: t.x, y: t.y, label: "[F] " + (CITY.themeKey === "western" || CITY.themeKey === "medieval" ? "RIDE " : "DRIVE ") + (CITY_CAR_NAME[CITY.theme.car] || "VEHICLE") };
      return null;
    }
    return _fit();
  };
  if (typeof _twi === "function") window.triggerWorldInteract = function () {
    if (CITY.on && player) {
      if (player.inVehicle === 3) { cityExitCar(); return; }
      const t = findInteractTarget();
      if (t && t.kind === "cityCar") { cityEnterCar(t.car); return; }
      if (t && t.kind === "exitVeh") { player.inVehicle = 0; return; }
      return;
    }
    return _twi();
  };
  window.addEventListener("keydown", e => { if (e.code === "KeyF" && !e.repeat && runActive && !runPaused && CITY.on) triggerWorldInteract(); });
})();

/* --- hooks ---------------------------------------------------------------------- */
V10.onRunStart.unshift(cityRunStart);
V10.onStep.push((dt) => { if (CITY.on) { cityStep(dt); cityCarStep(dt); if (typeof stealthStep === "function") stealthStep(dt); } });
V10.onKill.push((idx, x, y, et, echo) => { if (CITY.on && typeof stOnKill === "function") stOnKill(idx, x, y, et, echo); });
V10.onRenderWorld.push(cityRenderWorldHook);
V10.onRenderWorld.push((g) => { if (CITY.on) cityRenderCar(g); });   // your car is never fogged
V10.onRenderWorld.push((g) => { if (CITY.on && typeof stealthRenderWorld === "function") stealthRenderWorld(g); });
V10.onRenderScreen.push((g) => { if (CITY.on && typeof stealthRenderScreen === "function") stealthRenderScreen(g); });
V10.onRunReset.push(() => { CITY.on = false; const el = document.getElementById("cityHud"); if (el) el.style.display = "none"; });
// EOF:js/cityplay.js
