// FILE: js/world.js
// PART: 10 of 14
// DETAIL: Procedural 256px Chunk Generator, Faction Spires, Crates, Hazards, Loot Pods, Rideable Hovercrafts & Mechs, and Last-Stand Fort Builder.

"use strict";

const CHUNK_SIZE = 256;
const worldChunkCache = new Map();

function getDistBiome(x, y) {
  const d = Math.hypot(x - 256, y - 256);
  if (typeof BIOME_RINGS !== "undefined") {
    for (let i = 0; i < BIOME_RINGS.length; i++) {
      if (d >= BIOME_RINGS[i].minDist && d < BIOME_RINGS[i].maxDist) return BIOME_RINGS[i];
    }
    return BIOME_RINGS[BIOME_RINGS.length - 1];
  }
  return { id: 0, name: "Outpost Perimeter", minDist: 0, maxDist: 999999, tint: "rgba(0,0,0,0)" };
}

function getChunk(cx, cy) {
  const key = cx + "," + cy;
  if (worldChunkCache.has(key) && worldChunkCache.get(key).seed === runSeed) {
    return worldChunkCache.get(key).objs;
  }

  const rng = typeof hashChunk === "function" ? hashChunk(cx, cy) : () => Math.random();
  const objs = [];
  const baseX = cx * CHUNK_SIZE, baseY = cy * CHUNK_SIZE;
  const distFromStart = Math.hypot(baseX + 128 - 256, baseY + 128 - 256);
  const propCount = 3 + Math.floor(rng() * 4);

  for (let i = 0; i < propCount; i++) {
    const ox = baseX + 28 + rng() * (CHUNK_SIZE - 56);
    const oy = baseY + 28 + rng() * (CHUNK_SIZE - 56);
    // Keep starting spawn area (256, 256) clear so player never spawns trapped
    if (Math.hypot(ox - 256, oy - 256) < 95) continue;

    const roll = rng();
    const objSeed = Math.floor(rng() * 100000);
    let type = 0, rad = 22, tall = true;

    if (roll < 0.28) {
      type = 0; rad = 20 + rng() * 10; tall = true; // Tall Spire / Monolith / Building
    } else if (roll < 0.56) {
      type = 1; rad = 14 + rng() * 6; tall = false; // Low Cargo Crate / Barricade
    } else if (roll < 0.74) {
      type = 2; rad = 12 + rng() * 6; tall = false; // Faction Crystal / Beacon Decor
    } else if (roll < 0.88) {
      type = 3; rad = (22 + rng() * 10) * ((player && player.hazardRadMul) || 1); tall = false; // Thermal / Acid Hazard Zone
    } else if (roll < 0.96) {
      type = 4; rad = 15; tall = false; // Interactive Supply Loot Pod
      // v10: ~1 in 5 pods away from spawn is a squad radio beacon (call in a fireteam, js/squad.js)
      if (distFromStart > 300 && rng() < 0.2) { type = 7; rad = 14; }
    } else {
      type = (distFromStart > 700 && rng() < 0.45) ? 6 : 5; // 5=Hovercraft, 6=Combat Mech
      rad = 18; tall = false;
    }

    const poly = (typeof ChaosMath !== "undefined" && ChaosMath.polyPoints)
      ? ChaosMath.polyPoints(objSeed, rad, type === 0 ? 6 : (type === 2 ? 5 : 7), 0.18, 0)
      : null;

    const objId = key + "_" + i;
    objs.push({
      id: objId,
      x: ox, y: oy, rad, type, tall,
      // FIX: looted pods / boarded vehicles are remembered per run (runChunkDeltas), so they no
      // longer respawn when this chunk is regenerated after a cache eviction.
      used: (typeof runChunkDeltas !== "undefined") && runChunkDeltas.has(objId), seed: objSeed, poly
    });
  }

  // FIX: evict the oldest chunks instead of wiping the whole cache (which also wiped "used" flags).
  if (worldChunkCache.size > 180) {
    let n = worldChunkCache.size - 140;
    for (const k of worldChunkCache.keys()) { if (n-- <= 0) break; worldChunkCache.delete(k); }
  }
  worldChunkCache.set(key, { seed: runSeed, objs });
  return objs;
}

function markWorldObjUsed(o) {
  if (!o) return;
  o.used = true;
  if (o.id && typeof runChunkDeltas !== "undefined") runChunkDeltas.set(o.id, true);
}

function getNearbyObstacles(x, y, radius = 320) {
  const res = [];
  const minCX = Math.floor((x - radius) / CHUNK_SIZE);
  const maxCX = Math.floor((x + radius) / CHUNK_SIZE);
  const minCY = Math.floor((y - radius) / CHUNK_SIZE);
  const maxCY = Math.floor((y + radius) / CHUNK_SIZE);

  for (let cy = minCY; cy <= maxCY; cy++) {
    for (let cx = minCX; cx <= maxCX; cx++) {
      const objs = getChunk(cx, cy);
      for (let i = 0; i < objs.length; i++) {
        const o = objs[i];
        if (o.used) continue;
        if ((o.type === 0 || o.type === 1) && Math.hypot(o.x - x, o.y - y) <= radius + o.rad) {
          res.push(o);
        }
      }
    }
  }
  if (typeof movedBarricades !== "undefined") {
    for (let i = 0; i < movedBarricades.length; i++) {
      const b = movedBarricades[i];
      if (!b.used && Math.hypot(b.x - x, b.y - y) <= radius + (b.rad || 16)) res.push(b);
    }
  }
  return res;
}

function isPointBlockedByObstacle(x, y, ignoreLow = false) {
  const cx = Math.floor(x / CHUNK_SIZE), cy = Math.floor(y / CHUNK_SIZE);
  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      const objs = getChunk(cx + dx, cy + dy);
      for (let i = 0; i < objs.length; i++) {
        const o = objs[i];
        if (o.used) continue;
        if (o.type === 0 || (!ignoreLow && o.type === 1)) {
          if (Math.hypot(x - o.x, y - o.y) < o.rad + 8) return true;
        }
      }
    }
  }
  return false;
}

// FIX: forts were pushed into activeForts and never removed (their hp field was unused), so they
// piled up forever (heroes #6, #8, #53). Forts now have a lifetime, take damage from enemies
// pressing on the walls, and at most MAX_FORTS stand at once (oldest collapses first).
const MAX_FORTS = 3, FORT_LIFE = 35, FORT_HP = 400, MAX_MINES = 24, MINE_LIFE = 60;

function deployLastStandFort(x, y) {
  const durMul = player ? Math.max(0.5, player.dur || 1) : 1;
  if (typeof activeForts !== "undefined") {
    while (activeForts.length >= MAX_FORTS) activeForts.shift();
    activeForts.push({ x, y, rad: 64, hp: FORT_HP, maxHp: FORT_HP, fireCD: 0.5, life: FORT_LIFE * durMul, maxLife: FORT_LIFE * durMul });
  }
  if (typeof activeMines !== "undefined") {
    for (let k = 0; k < 6; k++) {
      const a = (Math.PI * 2 * k) / 6;
      activeMines.push({ x: x + Math.cos(a) * 82, y: y + Math.sin(a) * 82, rad: 12, dmg: 180 * (player ? player.might : 1), life: MINE_LIFE * durMul });
    }
    if (activeMines.length > MAX_MINES) activeMines.splice(0, activeMines.length - MAX_MINES);
  }
  spawnSpeech(x, y, "FORTIFIED BUNKER & CLAYMORES DEPLOYED!", "#00e676", 2.2);
  sfx(180, 520, 0.22, "square", 0.22);
}

function findInteractTarget() {
  if (!player) return null;
  if (player.inVehicle > 0) {
    return { kind: "exitVeh", x: player.x, y: player.y - 18, label: "[EXIT VEHICLE]" };
  }
  const cx = Math.floor(player.x / CHUNK_SIZE), cy = Math.floor(player.y / CHUNK_SIZE);
  let best = null, bestD = 54;
  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      const objs = getChunk(cx + dx, cy + dy);
      for (let i = 0; i < objs.length; i++) {
        const o = objs[i];
        if (o.used || o.type < 4) continue;
        const d = Math.hypot(player.x - o.x, player.y - o.y);
        if (d < bestD) {
          bestD = d;
          const lbl = o.type === 4 ? `[OPEN ${(player.fac ? player.fac.loot : "SUPPLY POD").toUpperCase()}]`
            : (o.type === 5 ? "[BOARD HOVERCRAFT]" : (o.type === 7 ? "[RADIO: CALL IN FIRETEAM]" : "[PILOT COMBAT MECH]"));
          best = { kind: "chunkObj", obj: o, x: o.x, y: o.y, label: lbl };
        }
      }
    }
  }
  if (typeof movedBarricades !== "undefined") {
    for (let i = 0; i < movedBarricades.length; i++) {
      const b = movedBarricades[i];
      if (!b.used && b.type === 6 && Math.hypot(player.x - b.x, player.y - b.y) < 52) {
        return { kind: "warpChest", obj: b, x: b.x, y: b.y, label: "[OPEN WARP RELIC CHEST]" };
      }
    }
  }
  return best;
}

function triggerWorldInteract() {
  if (!player) return;
  const tgt = findInteractTarget();
  if (!tgt) return;
  if (tgt.kind === "exitVeh") {
    player.inVehicle = 0;
    spawnSpeech(player.x, player.y, "DISMOUNTED!", "#80deea", 1.2);
    updateHUD();
    return;
  }
  if (tgt.kind === "warpChest") {
    markWorldObjUsed(tgt.obj);
    if (typeof grantRelic === "function") grantRelic();
    player.hp = Math.min(player.maxHp, player.hp + player.maxHp * 0.35);
    updateHUD();
    return;
  }
  if (tgt.kind === "chunkObj") {
    const o = tgt.obj;
    markWorldObjUsed(o);
    if (o.type === 4) {
      player.hp = Math.min(player.maxHp, player.hp + 30);
      for (let k = 0; k < 5; k++) spawnOrb(o.x + (Math.random() - 0.5) * 24, o.y + (Math.random() - 0.5) * 24, 6 + waveNum * 1.5);
      if (Math.random() < 0.35 && typeof grantRelic === "function") grantRelic();
      else spawnSpeech(o.x, o.y, "SUPPLY POD LOOTED (+30 HP & XP)!", "#ffd166", 1.8);
      sfx(440, 880, 0.16, "triangle");
    } else if (o.type === 5) {
      player.inVehicle = 1; player.vehicleHp = 120;
      spawnSpeech(player.x, player.y, "HOVERCRAFT SKIMMER ONLINE!", "#00e5ff", 1.8);
      sfx(220, 640, 0.2, "sawtooth");
    } else if (o.type === 7) {
      if (typeof squadCallFireteam === "function") squadCallFireteam(o.x, o.y, "beacon");
    } else if (o.type === 6) {
      player.inVehicle = 2; player.vehicleHp = 260;
      spawnSpeech(player.x, player.y, "HEAVY COMBAT MECH ENGAGED (+60% DMG)!", "#ffd166", 2.0);
      sfx(140, 420, 0.25, "square");
    }
    updateHUD();
  }
}

function updateWorldObjects(simDt) {
  if (!player) return;
  // 1. Update Hazard Zones (FIX: neighbouring chunks too - a hazard near a border used to be ignored
  //    as soon as the player stepped into the next chunk). At most one hazard ticks per frame.
  if (!player.hazImmune && player.inVehicle === 0 && !player.hover) {
    const cx = Math.floor(player.x / CHUNK_SIZE), cy = Math.floor(player.y / CHUNK_SIZE);
    let inHazard = false, hz = null;
    for (let dy = -1; dy <= 1 && !inHazard; dy++) {
      for (let dx = -1; dx <= 1 && !inHazard; dx++) {
        const objs = getChunk(cx + dx, cy + dy);
        for (let i = 0; i < objs.length; i++) {
          const o = objs[i];
          if (o.type === 3 && Math.hypot(player.x - o.x, player.y - o.y) < o.rad) { inHazard = true; hz = o; break; }
        }
      }
    }
    // v10: the hazard's effect comes from the active adaptive biome (lava burns, sand pits slow,
    // electrified puddles shock...). Fallback = the original 4.5 HP/s non-lethal burn.
    if (inHazard) {
      if (typeof biomeHazardTick === "function") biomeHazardTick(hz, simDt);
      else player.hp = Math.max(1, player.hp - 4.5 * simDt);
    }
  }

  // 2. Update Active Forts (Auto-Turret Fire & Enemy Pushback)
  if (typeof activeForts !== "undefined") {
    for (let f = activeForts.length - 1; f >= 0; f--) {
      const ft = activeForts[f];
      if (typeof ft.life !== "number") { ft.life = FORT_LIFE; ft.maxLife = FORT_LIFE; }
      ft.life -= simDt;
      if (ft.life <= 0 || ft.hp <= 0) {
        spawnParticles(ft.x, ft.y, 10);
        spawnSpeech(ft.x, ft.y, ft.hp <= 0 ? "BUNKER DESTROYED!" : "BUNKER DECOMMISSIONED", "#90a4ae", 1.4);
        activeForts.splice(f, 1);
        continue;
      }
      ft.fireCD -= simDt;
      if (ft.fireCD <= 0) {
        ft.fireCD = 0.55;
        let best = -1, bestD = 260;
        for (let j = 0; j < MAX_E; j++) {
          if (eAct[j]) {
            const d = Math.hypot(eX[j] - ft.x, eY[j] - ft.y);
            if (d < bestD) { bestD = d; best = j; }
          }
        }
        if (best >= 0) {
          const a = Math.atan2(eY[best] - ft.y, eX[best] - ft.x);
          spawnProj(ft.x, ft.y, Math.cos(a) * 380, Math.sin(a) * 380, 42 * player.might, 0.7, 6, 2, 4, 0, 0, player.cid);
        }
      }
      for (let j = 0; j < MAX_E; j++) {
        if (!eAct[j]) continue;
        const d = Math.hypot(eX[j] - ft.x, eY[j] - ft.y);
        if (d < ft.rad + 10 && d > 1) {
          eX[j] += ((eX[j] - ft.x) / d) * 85 * simDt;
          eY[j] += ((eY[j] - ft.y) / d) * 85 * simDt;
          ft.hp -= (eType[j] === 99 ? 24 : (eType[j] === 98 ? 14 : 6)) * simDt; // enemies batter the walls
        }
      }
    }
  }

  // 3. Update Claymore Proximity Mines
  if (typeof activeMines !== "undefined") {
    for (let m = activeMines.length - 1; m >= 0; m--) {
      const mn = activeMines[m];
      if (typeof mn.life === "number") {
        mn.life -= simDt;
        if (mn.life <= 0) { activeMines.splice(m, 1); continue; }
      }
      let triggered = false;
      for (let j = 0; j < MAX_E; j++) {
        if (eAct[j] && Math.hypot(eX[j] - mn.x, eY[j] - mn.y) < mn.rad + 14) {
          triggered = true;
          break;
        }
      }
      if (triggered) {
        if (typeof triggerRocketDetonation === "function") {
          triggerRocketDetonation(mn.x, mn.y, mn.dmg || 160, 72);
        }
        activeMines.splice(m, 1);
      }
    }
  }
}
// EOF:js/world.js
