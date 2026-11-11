/* ============================================================================
   15.6.2 · BOUNDED CITY MATERIAL DAMAGE + FIRE FOUNDATION
   Deterministic, per-tile structural state; no building-collapse simulation.
   The same material/penetration rule is used by live projectiles and the
   optional civilian auto-fire hold-fire check. Save data is capped and keyed
   by generated city seed so streamed chunks can be rebuilt without losing it.
   ============================================================================ */
"use strict";

const CITY_DAMAGE_LIMIT = 256, CITY_FIRE_LIMIT = 24, CITY_FIRE_MAX_AGE = 14;
const CITY_MATERIALS = Object.freeze({
  wood:      Object.freeze({ id:"wood",      maxHp:96,  resistance:10, chip:0.32, flammable:true,  floor:false }),
  brick:     Object.freeze({ id:"brick",     maxHp:180, resistance:22, chip:0.24, flammable:false, floor:false }),
  masonry:   Object.freeze({ id:"masonry",   maxHp:240, resistance:30, chip:0.20, flammable:false, floor:false }),
  metal:     Object.freeze({ id:"metal",     maxHp:280, resistance:42, chip:0.18, flammable:false, floor:false }),
  interior:  Object.freeze({ id:"interior",  maxHp:72,  resistance:9,  chip:0.34, flammable:true,  floor:false }),
  doorWood:  Object.freeze({ id:"doorWood",  maxHp:64,  resistance:8,  chip:0.36, flammable:true,  floor:false }),
  doorMetal: Object.freeze({ id:"doorMetal", maxHp:160, resistance:28, chip:0.22, flammable:false, floor:false }),
  floorWood: Object.freeze({ id:"floorWood", maxHp:80,  resistance:0,  chip:0.24, flammable:true,  floor:true  }),
  floorHard: Object.freeze({ id:"floorHard", maxHp:120, resistance:0,  chip:0.18, flammable:false, floor:true  })
});
const CITYD = { stepT:0, saveT:0, lastWarn:0, dirty:false };

function cityDamageMaterial(tx, ty) {
  if (!CITY.on || tx < 0 || ty < 0 || tx >= CITY.WORLD_T || ty >= CITY.WORLD_T) return null;
  const flags = cityFlagsT(tx, ty), kind = cityKindT(tx, ty), door = cityDoorT(tx, ty);
  if (flags & F_WIN) return null; // the existing glass-shatter path remains authoritative
  if (flags & F_DOOR) return door && (door.mat === "metal" || door.mat === "stone") ? CITY_MATERIALS.doorMetal : CITY_MATERIALS.doorWood;
  if (kind === K_EXT_WOOD) return CITY_MATERIALS.wood;
  if (kind === K_EXT_BRICK) return CITY_MATERIALS.brick;
  if (kind === K_EXT_MASON || kind === K_STONE) return CITY_MATERIALS.masonry;
  if (kind === K_EXT_METAL || kind === K_GDOOR) return CITY_MATERIALS.metal;
  if (kind === K_INT) return CITY_MATERIALS.interior;
  // Floors have no collision flags, but keep an explicit material profile for
  // bounded fire damage and repair. Furniture/props are not floor material.
  if ((flags & F_IN) && !(flags & (F_MOVE | F_SHOT))) {
    const b = cityBldT(tx, ty);
    return b && (b.mat === "wood" || b.mat === "brick") ? CITY_MATERIALS.floorWood : CITY_MATERIALS.floorHard;
  }
  return null;
}
function cityDamageRecord(tx, ty) { return cityRT.damage.get(cityKeyT(tx, ty)) || null; }
function cityDamageIsBreached(tx, ty) { const r = cityDamageRecord(tx, ty); return !!(r && r.breached); }
function cityDamageKeyParts(key) { return [key % 131072, Math.floor(key / 131072)]; }
function cityDamageUID(tx, ty) { const b = cityBldT(tx, ty); return b && b.uid || ""; }
function cityDamageValidTile(tx, ty) { return tx >= 0 && ty >= 0 && tx < CITY.WORLD_T && ty < CITY.WORLD_T; }

function cityDamageSave() {
  if (typeof meta === "undefined" || !meta || typeof saveMeta !== "function") return false;
  let root = meta.cityDamageV1;
  if (!root || root.v !== 1 || !root.worlds || typeof root.worlds !== "object" || Array.isArray(root.worlds)) root = meta.cityDamageV1 = { v:1, worlds:{} };
  const seed = String(CITY.seed >>> 0), damage = [];
  for (const [key, r] of cityRT.damage) {
    if (!r || !Number.isFinite(r.hp) || !r.mat) continue;
    damage.push([key, r.mat, Math.max(0, Math.min(CITY_MATERIALS[r.mat]?.maxHp || 0, r.hp)), r.uid || ""]);
    if (damage.length >= CITY_DAMAGE_LIMIT) break;
  }
  const fires = [];
  for (const [key, f] of cityRT.fires) {
    if (!f || !Number.isFinite(f.fuel) || !f.uid) continue;
    fires.push([key, Math.max(0, Math.min(CITY_FIRE_MAX_AGE, f.fuel)), f.uid, Number.isSafeInteger(f.origin) ? f.origin : key, Math.max(0, f.age || 0)]);
    if (fires.length >= CITY_FIRE_LIMIT) break;
  }
  root.worlds[seed] = { d:damage, f:fires };
  const seeds = Object.keys(root.worlds);
  while (seeds.length > 4) { const ix = seeds.findIndex(k => k !== seed); if (ix < 0) break; delete root.worlds[seeds.splice(ix, 1)[0]]; }
  meta.cityDamageV1 = root;
  const saved = !!saveMeta();
  CITYD.dirty = !saved;
  return saved;
}
function cityDamageLoad() {
  cityRT.damage.clear(); cityRT.fires.clear();
  if (typeof meta === "undefined" || !meta || !meta.cityDamageV1 || meta.cityDamageV1.v !== 1) return;
  const world = meta.cityDamageV1.worlds && meta.cityDamageV1.worlds[String(CITY.seed >>> 0)];
  if (!world || typeof world !== "object") return;
  if (Array.isArray(world.d)) for (const row of world.d.slice(0, CITY_DAMAGE_LIMIT)) {
    if (!Array.isArray(row) || row.length < 4) continue;
    const [key, mat, hp, uid] = row, parts = Number.isSafeInteger(key) ? cityDamageKeyParts(key) : [-1, -1];
    if (!cityDamageValidTile(parts[0], parts[1]) || !CITY_MATERIALS[mat] || !Number.isFinite(hp) || hp < 0 || typeof uid !== "string") continue;
    cityRT.damage.set(key, { mat, hp:Math.min(CITY_MATERIALS[mat].maxHp, hp), uid, breached:hp <= 0 && !CITY_MATERIALS[mat].floor });
  }
  if (Array.isArray(world.f)) for (const row of world.f.slice(0, CITY_FIRE_LIMIT)) {
    if (!Array.isArray(row) || row.length < 5) continue;
    const [key, fuel, uid, origin, age] = row, parts = Number.isSafeInteger(key) ? cityDamageKeyParts(key) : [-1, -1];
    if (!cityDamageValidTile(parts[0], parts[1]) || !Number.isFinite(fuel) || fuel <= 0 || typeof uid !== "string" || !Number.isSafeInteger(origin) || !Number.isFinite(age)) continue;
    cityRT.fires.set(key, { fuel:Math.min(CITY_FIRE_MAX_AGE, fuel), uid, origin, age:Math.max(0, age), spreadT:0, burnT:0 });
  }
}
function cityDamageRunStart() {
  CITYD.stepT = 0; CITYD.saveT = 0; CITYD.dirty = false;
  cityDamageLoad();
}

// Called after a streamed city chunk is rasterised. A breached tile removes
// collision rather than adding it; no damage state can make a route less open.
function cityDamageApplyChunk(C) {
  if (!C || !cityRT.damage.size) return;
  const x0 = C.x0, y0 = C.y0;
  for (const [key, r] of cityRT.damage) {
    const [tx, ty] = cityDamageKeyParts(key);
    if (tx < x0 || ty < y0 || tx >= x0 + CH || ty >= y0 + CH) continue;
    const i = ((ty - y0) << 7) | (tx - x0), b = C.bid[i] >= 0 ? C.blds[C.bid[i]] : null;
    if (r.uid && (!b || b.uid !== r.uid)) { cityRT.damage.delete(key); CITYD.dirty = true; continue; }
    if (!r.breached) continue;
    const D = C.doors.get(i);
    if (D) { D.broken = true; D.open = D.target = 1; }
    C.flags[i] = b ? F_IN : 0;
    C.kind[i] = K_NONE;
  }
}

function cityDamageTouchChunk(tx, ty, breach) {
  const C = cityRT.chunks.get((tx >> 7) * 4096 + (ty >> 7));
  if (!C) return;
  const i = ((ty & CH_MASK) << 7) | (tx & CH_MASK), b = C.bid[i] >= 0 ? C.blds[C.bid[i]] : null;
  if (breach) {
    const D = C.doors.get(i);
    if (D) { D.broken = true; D.open = D.target = 1; }
    C.flags[i] = b ? F_IN : 0; C.kind[i] = K_NONE;
  }
  cityRT.visGen++;
  if (typeof cityRenderRefresh === "function") cityRenderRefresh(tx * 16 - CITY.orx - 24, ty * 16 - CITY.ory - 24, 64, 64);
  else if (typeof cityRenderInvalidate === "function") cityRenderInvalidate(tx * 16 - CITY.orx - 24, ty * 16 - CITY.ory - 24, 64, 64);
}
function cityDamageFloorImpact(tx, ty, energy, persist = true) {
  const mat = cityDamageMaterial(tx, ty);
  if (!mat || !mat.floor || !cityDamageValidTile(tx, ty)) return null;
  const key = cityKeyT(tx, ty), uid = cityDamageUID(tx, ty);
  if (!uid) return null;
  let r = cityRT.damage.get(key);
  if (!r && cityRT.damage.size >= CITY_DAMAGE_LIMIT) return null;
  if (!r) r = { mat:mat.id, hp:mat.maxHp, uid, breached:false };
  r.hp = Math.max(0, r.hp - Math.max(1, Math.min(mat.maxHp * 0.25, (Number.isFinite(energy) ? energy : 1) * mat.chip)));
  cityRT.damage.set(key, r); CITYD.dirty = true;
  if (persist) cityDamageSave();
  return { mat, record:r, breached:false, justBreached:false };
}
function cityDamageImpact(tx, ty, energy, source = "shot", persist = true) {
  const mat = cityDamageMaterial(tx, ty);
  if (!mat || mat.floor || !cityDamageValidTile(tx, ty)) return null;
  const key = cityKeyT(tx, ty), uid = cityDamageUID(tx, ty);
  if (!uid) return null;
  let r = cityRT.damage.get(key);
  if (!r && cityRT.damage.size >= CITY_DAMAGE_LIMIT) {
    if (runTime - CITYD.lastWarn > 5) { CITYD.lastWarn = runTime; if (typeof spawnSpeech === "function") spawnSpeech(player.x, player.y - 18, "DAMAGE LIMIT REACHED", "#ffb74d", 1.1); }
    return null;
  }
  if (!r) r = { mat:mat.id, hp:mat.maxHp, uid, breached:false };
  // A deterministic amount per impact; fire uses its own slower rate below.
  const raw = Number.isFinite(energy) ? Math.max(1, energy) : 1;
  const loss = Math.max(1, Math.min(mat.maxHp * 0.35, raw * mat.chip * (source === "blast" ? 1.6 : 1)));
  r.hp = Math.max(0, r.hp - loss);
  const justBreached = !r.breached && r.hp <= 0;
  r.breached = r.breached || justBreached;
  cityRT.damage.set(key, r); cityDamageTouchChunk(tx, ty, r.breached);
  if (persist) cityDamageSave(); else CITYD.dirty = true;
  return { mat, record:r, breached:r.breached, justBreached };
}

function cityDamageCanPenetrate(energy, material, kinetic) {
  return !!(kinetic && material && !material.floor && Number.isFinite(energy) && energy > material.resistance);
}
function cityDamageRicochets(hit, ux, uy, kinetic, style, bounce) {
  if (!kinetic || style === 2 || !CITY_HARD || !CITY_HARD.has(hit.k) || (bounce | 0) >= 2) return false;
  return Math.abs(ux * hit.nx + uy * hit.ny) < 0.375;
}
function cityDamageTraceShot(x0, y0, x1, y1, energy, kinetic, style = 4, bounce = 0) {
  if (!CITY.on || !Number.isFinite(energy) || energy <= 0) return { reaches:true, energy };
  const dx = x1 - x0, dy = y1 - y0, total = Math.hypot(dx, dy);
  if (total < 1e-6) return { reaches:true, energy };
  const ux = dx / total, uy = dy / total;
  let t0 = 0, e = energy;
  for (let n = 0; n < 64 && t0 < 1; n++) {
    const ax = x0 + dx * t0, ay = y0 + dy * t0;
    const h = cityRay(ax, ay, x1, y1, F_SHOT, 512);
    if (!h.hit) return { reaches:true, energy:e };
    const hitT = t0 + (1 - t0) * h.t;
    const mat = cityDamageMaterial(h.tx, h.ty);
    if (!mat || cityDamageRicochets(h, ux, uy, kinetic, style, bounce)) return { reaches:false, energy:e, hit:h };
    if (!cityDamageCanPenetrate(e, mat, kinetic)) return { reaches:false, energy:e, hit:h };
    e -= mat.resistance;
    const axw = x0 + CITY.orx, ayw = y0 + CITY.ory;
    const txExit = dx > 0 ? ((h.tx + 1) * 16 - axw) / dx : dx < 0 ? (h.tx * 16 - axw) / dx : Infinity;
    const tyExit = dy > 0 ? ((h.ty + 1) * 16 - ayw) / dy : dy < 0 ? (h.ty * 16 - ayw) / dy : Infinity;
    const exit = Math.min(...[txExit, tyExit].filter(q => q > hitT + 1e-7));
    if (!Number.isFinite(exit)) return { reaches:false, energy:e, hit:h };
    t0 = Math.min(1, exit + 0.0001);
  }
  return { reaches:t0 >= 1, energy:e };
}
function cityDamageKinetic(i) {
  const byHero = !pEnemy[i], wid = pWpnId[i], prof = typeof stHeroProfile === "function" ? stHeroProfile(wid) : [160,"g",1];
  return byHero ? prof[1] === "g" : (typeof enemyIsKinetic === "function" ? enemyIsKinetic(wid) : CITY.theme.era !== "future");
}
function cityDamageExitT(hit, x0, y0, x1, y1) {
  const dx = x1 - x0, dy = y1 - y0, ax = x0 + CITY.orx, ay = y0 + CITY.ory;
  const tx = dx > 0 ? ((hit.tx + 1) * 16 - ax) / dx : dx < 0 ? (hit.tx * 16 - ax) / dx : Infinity;
  const ty = dy > 0 ? ((hit.ty + 1) * 16 - ay) / dy : dy < 0 ? (hit.ty * 16 - ay) / dy : Infinity;
  const exits = [tx, ty].filter(t => t > hit.t + 1e-7);
  return exits.length ? Math.min(...exits) + 0.0001 : 1;
}

// Add material damage/penetration before the legacy impact response. The latter
// still owns ricochets, windows, rockets, decals, sounds and all other hit types.
(function cityDamageProjectileWire() {
  const legacy = window.cityProjWall;
  if (typeof legacy !== "function") return;
  window.cityProjWall = function (i, dt) {
    if (!CITY.on || !pAct[i] || [1,6,8].includes(pStyle[i])) return legacy(i, dt);
    const x1 = pX[i], y1 = pY[i], x0 = x1 - pVX[i] * dt, y0 = y1 - pVY[i] * dt;
    const h = cityRay(x0, y0, x1, y1, F_SHOT | F_WIN, 48);
    if (!h.hit || !(h.f & F_SHOT) || (h.f & F_WIN)) return legacy(i, dt);
    const mat = cityDamageMaterial(h.tx, h.ty);
    if (!mat || mat.floor) return legacy(i, dt);
    const speed = Math.hypot(pVX[i], pVY[i]) || 1, ux = pVX[i] / speed, uy = pVY[i] / speed;
    const kinetic = cityDamageKinetic(i), style = pStyle[i];
    const ricochet = cityDamageRicochets(h, ux, uy, kinetic, style, pBounce[i]);
    const energy = Math.max(0, pDmg[i] || 0);
    const canPass = !ricochet && style !== 2 && cityDamageCanPenetrate(energy, mat, kinetic);
    const impact = cityDamageImpact(h.tx, h.ty, energy || 1, style === 2 ? "blast" : "shot", true);
    if (style === 2 && mat.flammable && typeof cityFireIgniteNear === "function") cityFireIgniteNear(h.tx, h.ty);
    if (!canPass) return legacy(i, dt);
    pDmg[i] = Math.max(0.1, energy - mat.resistance);
    const exT = cityDamageExitT(h, x0, y0, x1, y1);
    if (exT > 1) { pX[i] = x0 + (x1 - x0) * exT; pY[i] = y0 + (y1 - y0) * exT; }
    if (impact && impact.breached) cityDamageTouchChunk(h.tx, h.ty, true);
    return false;
  };
})();

function cityFireFloor(tx, ty, uid) {
  if (!cityDamageValidTile(tx, ty) || cityDamageUID(tx, ty) !== uid) return false;
  const f = cityFlagsT(tx, ty);
  return !!((f & F_IN) && !(f & F_MOVE) && cityDamageMaterial(tx, ty)?.floor);
}
function cityFireIgnite(tx, ty, originKey, persist = true) {
  if (!CITY.on || cityRT.fires.size >= CITY_FIRE_LIMIT) return false;
  const uid = cityDamageUID(tx, ty), key = cityKeyT(tx, ty);
  if (!uid || !cityFireFloor(tx, ty, uid) || cityRT.fires.has(key)) return false;
  const origin = Number.isSafeInteger(originKey) ? originKey : key;
  cityRT.fires.set(key, { fuel:CITY_FIRE_MAX_AGE, uid, origin, age:0, spreadT:0, burnT:0 });
  cityDamageFloorImpact(tx, ty, 2, false);
  CITYD.dirty = true; if (persist) cityDamageSave();
  const x = tx * 16 + 8 - CITY.orx, y = ty * 16 + 8 - CITY.ory;
  if (typeof spawnSpeech === "function") spawnSpeech(x, y - 16, "FIRE", "#ff8a38", 1.0);
  if (typeof noiseEmit === "function") noiseEmit(x, y, 90, "fire", 0);
  return true;
}
function cityFireIgniteNear(tx, ty) {
  const uid = cityDamageUID(tx, ty); if (!uid) return false;
  for (const [dx, dy] of [[0,1],[1,0],[0,-1],[-1,0],[1,1],[-1,1],[1,-1],[-1,-1]]) {
    if (cityFireIgnite(tx + dx, ty + dy)) return true;
  }
  return false;
}
function cityFireStep(dt) {
  if (!CITY.on || !player || !cityRT.fires.size) return;
  CITYD.stepT += Math.max(0, dt || 0);
  if (CITYD.stepT < 0.25) return;
  const step = Math.min(0.5, CITYD.stepT); CITYD.stepT = 0;
  let changed = false;
  for (const [key, fire] of [...cityRT.fires]) {
    fire.fuel -= step; fire.age += step; fire.spreadT += step;
    if (fire.fuel <= 0) { cityRT.fires.delete(key); changed = true; continue; }
    const [tx, ty] = cityDamageKeyParts(key), px = tx * 16 + 8 - CITY.orx, py = ty * 16 + 8 - CITY.ory;
    fire.burnT = (fire.burnT || 0) + step;
    if (fire.burnT >= 1) { fire.burnT -= 1; cityDamageFloorImpact(tx, ty, 4, false); changed = true; }
    const playerKey = player && !player.inVehicle && cityKeyT(cityTX(player.x), cityTY(player.y));
    if (playerKey === key && !(player.invulnT > 0)) {
      player.hp -= Math.min(player.maxHp * 0.12, 8 * step);
      if (player.hp <= 0 && typeof resolvePlayerDeath === "function") resolvePlayerDeath();
    }
    for (let j = 0; j < MAX_E; j++) if (eAct[j] && cityKeyT(cityTX(eX[j]), cityTY(eY[j])) === key) {
      eHP[j] -= 18 * step;
      if (eHP[j] <= 0) { killEnemy(j, false, null, "#ff7043", "unknown"); }
    }
    if (typeof TF !== "undefined" && TF.on && typeof tfHurt === "function") for (const civ of TF.walk) {
      if (!civ || !civ.alive || !civ.w || civ.w.hp <= 0 || cityKeyT(cityTX(civ.w.x), cityTY(civ.w.y)) !== key) continue;
      tfHurt(civ, 8 * step, "fire", "unknown", null, { x:px, y:py });
    }
    if (fire.spreadT >= 1.0) {
      fire.spreadT = 0;
      const origin = fire.origin, [ox, oy] = cityDamageKeyParts(origin);
      if (cityRT.fires.size < CITY_FIRE_LIMIT) for (const [dx, dy, salt] of [[1,0,1],[-1,0,2],[0,1,3],[0,-1,4]]) {
        const nx = tx + dx, ny = ty + dy;
        if (Math.abs(nx - ox) + Math.abs(ny - oy) > 8 || !cityFireFloor(nx, ny, fire.uid) || cityRT.fires.has(cityKeyT(nx, ny))) continue;
        if (cF(cH(CITY.seed, nx, ny, Math.floor(fire.age) + salt)) < 0.28) { cityFireIgnite(nx, ny, origin, false); changed = true; if (cityRT.fires.size >= CITY_FIRE_LIMIT) break; }
      }
    }
  }
  CITYD.saveT += step;
  if (CITYD.saveT >= 1 && (changed || CITYD.dirty)) { CITYD.saveT = 0; cityDamageSave(); }
}

function cityDamageRepair(tx, ty) {
  if (!CITY.on || !cityDamageValidTile(tx, ty)) return false;
  const key = cityKeyT(tx, ty), r = cityRT.damage.get(key); if (!r) return false;
  const old = { ...r }, C = cityRT.chunks.get((tx >> 7) * 4096 + (ty >> 7)), i = ((ty & CH_MASK) << 7) | (tx & CH_MASK), D = C && C.doors.get(i);
  const oldDoor = D ? { broken:D.broken, open:D.open, target:D.target } : null;
  const oldMeta = meta && meta.cityDamageV1 ? JSON.stringify(meta.cityDamageV1) : null;
  cityRT.damage.delete(key);
  if (D && old.breached) { D.broken = false; D.target = D.open = 0; }
  if (old.breached) cityRebuildAt(tx, ty); else cityDamageTouchChunk(tx, ty, false);
  if (!cityDamageSave()) {
    cityRT.damage.set(key, old);
    if (oldMeta === null) delete meta.cityDamageV1; else { try { meta.cityDamageV1 = JSON.parse(oldMeta); } catch (e) {} }
    if (D && oldDoor) Object.assign(D, oldDoor);
    if (old.breached) cityRebuildAt(tx, ty); else cityDamageTouchChunk(tx, ty, false);
    return false;
  }
  return true;
}
function cityDamageInteractTarget() {
  if (!CITY.on || !runActive || !player || player.inVehicle || player.roof) return null;
  const px = player.x, py = player.y; let best = null, bd = 44;
  for (const [key] of cityRT.fires) {
    const [tx, ty] = cityDamageKeyParts(key), x = tx * 16 + 8 - CITY.orx, y = ty * 16 + 8 - CITY.ory, d = Math.hypot(px - x, py - y);
    if (d < bd && cityLOS(px, py, x, y)) { best = { kind:"cityDamage", mode:"extinguish", tx, ty, key, x, y, label:"[F] EXTINGUISH FIRE" }; bd = d; }
  }
  if (best) return best;
  for (const [key, r] of cityRT.damage) {
    if (!r || r.hp >= (CITY_MATERIALS[r.mat]?.maxHp || Infinity)) continue;
    const [tx, ty] = cityDamageKeyParts(key), x = tx * 16 + 8 - CITY.orx, y = ty * 16 + 8 - CITY.ory, d = Math.hypot(px - x, py - y);
    if (d >= bd) continue;
    const obstruction = cityRay(px, py, x, y, F_MOVE, 16);
    if (obstruction.hit && (obstruction.tx !== tx || obstruction.ty !== ty)) continue;
    best = { kind:"cityDamage", mode:"repair", tx, ty, key, x, y, label:"[F] REPAIR STRUCTURE" }; bd = d;
  }
  return best;
}
function cityDamageInteract(target) {
  if (!target || target.kind !== "cityDamage") return false;
  if (target.mode === "extinguish") {
    const fire = cityRT.fires.get(target.key); if (!fire) return false;
    const oldMeta = meta && meta.cityDamageV1 ? JSON.stringify(meta.cityDamageV1) : null;
    cityRT.fires.delete(target.key); CITYD.dirty = true;
    if (!cityDamageSave()) {
      cityRT.fires.set(target.key, fire);
      if (oldMeta === null) delete meta.cityDamageV1; else { try { meta.cityDamageV1 = JSON.parse(oldMeta); } catch (e) {} }
      return false;
    }
    if (typeof spawnSpeech === "function") spawnSpeech(target.x, target.y - 14, "FIRE OUT", "#80deea", 1.0);
    return true;
  }
  if (target.mode === "repair") return cityDamageRepair(target.tx, target.ty);
  return false;
}
function cityDamageRender(g) {
  if (!CITY.on || !runActive || !g) return;
  const view = typeof camView === "function" ? camView(0) : null;
  const left = view ? view.l : player.x - W / 2, right = view ? view.r : player.x + W / 2;
  const top = view ? view.t : player.y - H / 2, bottom = view ? view.b : player.y + H / 2;
  g.save(); g.globalAlpha = 0.92;
  for (const [key, r] of cityRT.damage) {
    const [tx, ty] = cityDamageKeyParts(key), x = tx * 16 + 8 - CITY.orx, y = ty * 16 + 8 - CITY.ory;
    if (x < left - 24 || x > right + 24 || y < top - 24 || y > bottom + 24) continue;
    if (r.breached) {
      g.fillStyle = "rgba(8,10,12,.94)"; g.fillRect(x - 8, y - 8, 16, 16);
      g.strokeStyle = "#9d8061"; g.lineWidth = 2; g.beginPath(); g.moveTo(x - 7, y + 6); g.lineTo(x - 3, y + 2); g.lineTo(x + 1, y + 6); g.lineTo(x + 5, y + 1); g.stroke();
    } else {
      const max = CITY_MATERIALS[r.mat]?.maxHp || 1, ratio = r.hp / max;
      g.strokeStyle = ratio < 0.55 ? "rgba(255,115,69,.9)" : "rgba(24,22,20,.8)"; g.lineWidth = 1.5;
      g.beginPath(); g.moveTo(x - 6, y - 6); g.lineTo(x - 1, y - 1); g.lineTo(x - 4, y + 2); g.moveTo(x - 1, y - 1); g.lineTo(x + 5, y - 4); g.moveTo(x - 1, y - 1); g.lineTo(x + 4, y + 6); g.stroke();
    }
  }
  for (const [key, fire] of cityRT.fires) {
    const [tx, ty] = cityDamageKeyParts(key), x = tx * 16 + 8 - CITY.orx, y = ty * 16 + 8 - CITY.ory;
    if (x < left - 40 || x > right + 40 || y < top - 40 || y > bottom + 40) continue;
    const pulse = 0.72 + 0.28 * Math.sin(runTime * 9 + tx * 0.7 + ty), r = 6 + pulse * 4;
    g.fillStyle = "rgba(255,70,10,.20)"; g.beginPath(); g.arc(x, y, r + 9, 0, Math.PI * 2); g.fill();
    g.fillStyle = "#ff6b20"; g.beginPath(); g.ellipse(x, y + 2, r * 0.55, r, -0.25, 0, Math.PI * 2); g.fill();
    g.fillStyle = "#ffd166"; g.beginPath(); g.ellipse(x, y + 4, r * 0.24, r * 0.48, 0.15, 0, Math.PI * 2); g.fill();
    g.fillStyle = "rgba(70,70,70,.45)"; g.beginPath(); g.arc(x + 3, y - r - 5, 3 + pulse * 2, 0, Math.PI * 2); g.fill();
  }
  g.restore();
}

V10.onStep.push(cityFireStep);
V10.onRenderWorld.push(cityDamageRender);
// Keep the normal one-action city interaction path; cityaccess may still
// replace this target with a higher-priority roof/climb action.
(function cityDamageInteractWire() {
  const fit = window.findInteractTarget, trigger = window.triggerWorldInteract;
  if (typeof fit === "function") window.findInteractTarget = function () { return cityDamageInteractTarget() || fit(); };
  if (typeof trigger === "function") window.triggerWorldInteract = function () {
    if (CITY.on && player && !player.inVehicle) { const t = findInteractTarget(); if (t && t.kind === "cityDamage") return cityDamageInteract(t); }
    return trigger.apply(this, arguments);
  };
})();
// EOF:js/citydamage.js
