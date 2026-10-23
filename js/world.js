// FILE: js/world.js
// PART: 10 of 14
// DETAIL: Organic City Block Complexes vs Natural Biome Clusters, Rideable Combat Mechs & Hovercrafts, Relic Chests, Barricades, and Last-Stand Forts.

"use strict";

/* === 1. DISTANCE SUB-BIOME CALCULATION === */
function getDistBiome(x, y) {
  const d = Math.hypot(x - 256, y - 256);
  for (let i = BIOME_RINGS.length - 1; i >= 0; i--) {
    if (d >= BIOME_RINGS[i].minDist) return BIOME_RINGS[i];
  }
  return BIOME_RINGS[0];
}

// Determines if the current faction/biome supports urban city complexes vs natural formations
function isUrbanBiome(facId, biomeId) {
  if (biomeId === 1 || biomeId === 2) return true;
  return [0, 2, 4, 6, 7, 8].includes(facId) && biomeId > 0;
}

/* === 2. PROCEDURAL CHUNK PROP, CITY BLOCK & MECH GENERATOR ===
   Prop Types:
   0 = PROP_TALL (Spire/Tree - Solid)
   1 = PROP_LOW (Crate/Rock - Solid)
   2 = PROP_DECOR (Flora/Debris - Non-solid)
   3 = LOOT_NODE (Supply Pod - Breakable)
   4 = HAZARD_ZONE (Floor Hazard)
   5 = BUILDING_WING (Multi-Wing City Structure / Outpost Wall - Solid)
   6 = RELIC_CHEST (Interactive Relic Cache)
   7 = BARRICADE (Interactive Movable Cover - Solid)
   8 = HOVERCRAFT (Interactive Fast Skimmer Vehicle)
   9 = COMBAT_MECH (Interactive Heavy Armored Walker Mech) */
function getChunkProps(cx, cy) {
  const key = cx + "," + cy;
  const broken = runChunkDeltas.get(key) || 0;
  const rng = hashChunk(cx, cy);
  const centerBiome = getDistBiome(cx * 512 + 256, cy * 512 + 256).id;
  const facId = player ? player.fac.id : (CHAR_RAW[meta.selChar] ? CHAR_RAW[meta.selChar][1] : 0);
  const urban = isUrbanBiome(facId, centerBiome);
  const list = [];

  // Organic City Block / Street Alleyway Cluster (or Natural Canyon/Hive Ridge in non-urban biomes)
  if (centerBiome >= 1 && rng() < 0.72) {
    const bx = cx * 512 + 150 + rng() * 210;
    const by = cy * 512 + 150 + rng() * 210;
    const bSeed = Math.floor(rng() * 1000000);
    const layout = Math.floor(rng() * 3); // 0=L-Corner Block, 1=Street Corridor, 2=Plaza Courtyard
    const wType = urban ? 5 : 0;
    const wRad = urban ? 30 : 24;

    list.push({ i: 0, key, x: bx, y: by, type: wType, rad: wRad, seed: bSeed, sub: layout });
    list.push({ i: 1, key, x: bx + (urban ? 56 : 46), y: by, type: wType, rad: wRad, seed: bSeed + 17, sub: layout });
    if (layout === 0) {
      list.push({ i: 2, key, x: bx, y: by + 56, type: wType, rad: wRad, seed: bSeed + 31, sub: layout });
    } else if (layout === 1) {
      list.push({ i: 2, key, x: bx, y: by + 108, type: wType, rad: wRad, seed: bSeed + 31, sub: layout });
      list.push({ i: 3, key, x: bx + 56, y: by + 108, type: wType, rad: wRad, seed: bSeed + 47, sub: layout });
    } else {
      list.push({ i: 2, key, x: bx - 52, y: by + 48, type: wType, rad: wRad, seed: bSeed + 31, sub: layout });
    }
  }

  const startIdx = list.length;
  for (let i = startIdx; i < 8; i++) {
    const px = cx * 512 + rng() * 440 + 36;
    const py = cy * 512 + rng() * 440 + 36;
    const r = rng();
    const propSeed = Math.floor(rng() * 1000000);
    let type = 0, rad = 18;

    if (i === 7) {
      // Guaranteed Interactive Special Slot per chunk (Chests, Barricades, Hovercrafts, or Combat Mechs!)
      if (centerBiome === 0) {
        type = r < 0.45 ? 7 : (r < 0.78 ? 6 : (r < 0.92 ? 8 : 9));
      } else if (centerBiome === 1) {
        type = r < 0.38 ? 6 : (r < 0.68 ? 7 : (r < 0.86 ? 8 : 9));
      } else if (centerBiome === 2) {
        type = r < 0.38 ? 8 : (r < 0.72 ? 9 : (r < 0.88 ? 6 : 7));
      } else {
        type = r < 0.45 ? 6 : (r < 0.75 ? 9 : 8);
      }
    } else {
      if (r < 0.24) type = 0;
      else if (r < 0.46) type = 1;
      else if (r < 0.66) type = 2;
      else if (r < 0.84) type = 3;
      else type = 4;
    }

    if (type === 5) rad = 30;
    else if (type === 9) rad = 25;
    else if (type === 8) rad = 22;
    else if (type === 4) rad = 28;
    else if (type === 1 || type === 6 || type === 7) rad = 16;

    if ((type === 0 || type === 3 || type === 6 || type === 7 || type === 8 || type === 9) && (broken & (1 << i))) {
      continue;
    }
    list.push({ i, key, x: px, y: py, type, rad, seed: propSeed, sub: 0 });
  }
  return list;
}

/* === 3. SOLID OBSTACLE QUERIES === */
function getNearbySolidObstacles(x, y, searchRad = 180, ignoreForts = false) {
  const obs = [];
  const pcx = Math.floor(x / 512), pcy = Math.floor(y / 512);
  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      const props = getChunkProps(pcx + dx, pcy + dy);
      for (let k = 0; k < props.length; k++) {
        const pr = props[k];
        if (pr.type === 0 || pr.type === 1 || pr.type === 5 || pr.type === 7) {
          if (Math.hypot(x - pr.x, y - pr.y) <= searchRad + pr.rad) {
            obs.push({ x: pr.x, y: pr.y, rad: pr.rad, type: pr.type, isFort: false });
          }
        }
      }
    }
  }
  for (let i = 0; i < movedBarricades.length; i++) {
    const b = movedBarricades[i];
    if (b.type === 7 && Math.hypot(x - b.x, y - b.y) <= searchRad + b.rad) {
      obs.push({ x: b.x, y: b.y, rad: b.rad, type: 7, isFort: false });
    }
  }
  if (!ignoreForts) {
    for (let i = 0; i < activeForts.length; i++) {
      const f = activeForts[i];
      if (Math.hypot(x - f.x, y - f.y) <= searchRad + f.rad) {
        obs.push({ x: f.x, y: f.y, rad: f.rad, type: 9, isFort: true });
      }
    }
  }
  return obs;
}

function isPointBlockedByObstacle(x, y, ignoreForts = false) {
  const pcx = Math.floor(x / 512), pcy = Math.floor(y / 512);
  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      const props = getChunkProps(pcx + dx, pcy + dy);
      for (let k = 0; k < props.length; k++) {
        const pr = props[k];
        if (pr.type === 0 || pr.type === 1 || pr.type === 5 || pr.type === 7) {
          if (Math.hypot(x - pr.x, y - pr.y) < pr.rad) return true;
        }
      }
    }
  }
  for (let i = 0; i < movedBarricades.length; i++) {
    const b = movedBarricades[i];
    if (b.type === 7 && Math.hypot(x - b.x, y - b.y) < b.rad) return true;
  }
  if (!ignoreForts) {
    for (let i = 0; i < activeForts.length; i++) {
      const f = activeForts[i];
      if (Math.hypot(x - f.x, y - f.y) < f.rad) return true;
    }
  }
  return false;
}

/* === 4. CONTEXTUAL WORLD INTERACTION (Chests, Barricades, Hovercrafts & Combat Mechs) === */
function findInteractTarget() {
  if (!player) return null;
  if (player.carryingBarricade) return { action: "placeBarricade", label: "[PLACE BARRICADE]" };

  const pcx = Math.floor(player.x / 512), pcy = Math.floor(player.y / 512);
  let best = null, bestDist = 54;

  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      const props = getChunkProps(pcx + dx, pcy + dy);
      for (let k = 0; k < props.length; k++) {
        const pr = props[k];
        if (pr.type >= 6 && pr.type <= 9) {
          const d = Math.hypot(player.x - pr.x, player.y - pr.y);
          if (d < bestDist) {
            bestDist = d;
            const lbl = pr.type === 6 ? "[OPEN RELIC CHEST]" : (pr.type === 7 ? "[LIFT BARRICADE]" : (pr.type === 9 ? "[PILOT COMBAT MECH]" : "[BOARD HOVERCRAFT]"));
            best = { action: "chunkProp", prop: pr, label: lbl };
          }
        }
      }
    }
  }

  for (let i = 0; i < movedBarricades.length; i++) {
    const b = movedBarricades[i];
    const d = Math.hypot(player.x - b.x, player.y - b.y);
    if (d < bestDist) {
      bestDist = d;
      const lbl = b.type === 6 ? "[OPEN RELIC CHEST]" : (b.type === 9 ? "[PILOT COMBAT MECH]" : (b.type === 8 ? "[BOARD HOVERCRAFT]" : "[LIFT BARRICADE]"));
      best = { action: "movedObj", index: i, obj: b, label: lbl };
    }
  }

  if (!best && player.inVehicle) {
    return { action: "exitVehicle", label: player.inVehicle === 2 ? "[EJECT FROM MECH]" : "[EXIT HOVERCRAFT]" };
  }
  return best;
}

function triggerWorldInteract() {
  if (!player) return;
  const tgt = findInteractTarget();
  if (!tgt) return;

  if (tgt.action === "placeBarricade") {
    player.carryingBarricade = false;
    movedBarricades.push({ x: player.x + Math.cos(player.aim) * 32, y: player.y + Math.sin(player.aim) * 32, rad: 18, type: 7, seed: Math.floor(Math.random() * 99999) });
    spawnSpeech(player.x, player.y, "BARRICADE DEPLOYED", "#00e5ff", 1.4);
    sfx(240, 140, 0.09, "square");
    return;
  }

  if (tgt.action === "exitVehicle") {
    const vType = player.inVehicle === 2 ? 9 : 8;
    player.inVehicle = 0;
    movedBarricades.push({ x: player.x - Math.cos(player.aim) * 30, y: player.y - Math.sin(player.aim) * 30, rad: 22, type: vType, seed: 777 });
    spawnSpeech(player.x, player.y, "DISMOUNTED", "#cfd8dc", 1.2);
    sfx(320, 180, 0.1, "sawtooth");
    return;
  }

  let type = 0, px = player.x, py = player.y;
  if (tgt.action === "chunkProp") {
    const pr = tgt.prop;
    runChunkDeltas.set(pr.key, (runChunkDeltas.get(pr.key) || 0) | (1 << pr.i));
    type = pr.type; px = pr.x; py = pr.y;
  } else if (tgt.action === "movedObj") {
    type = tgt.obj.type; px = tgt.obj.x; py = tgt.obj.y;
    movedBarricades.splice(tgt.index, 1);
  }

  if (type === 6) {
    grantRelic(); spawnOrb(px, py, 35); spawnParticles(px, py, 12);
  } else if (type === 7) {
    player.carryingBarricade = true;
    spawnSpeech(player.x, player.y, "CARRYING BARRICADE", "#ffd166", 1.4); sfx(200, 380, 0.08, "triangle");
  } else if (type === 8) {
    player.inVehicle = 1; player.vehicleHp = 140;
    spawnSpeech(player.x, player.y, "HOVERCRAFT ONLINE (+110% SPD)", "#00f0ff", 2.0); sfx(150, 620, 0.22, "sawtooth");
  } else if (type === 9) {
    player.inVehicle = 2; player.vehicleHp = 320;
    spawnSpeech(player.x, player.y, "COMBAT MECH ONLINE (+60% MIGHT & HULL ARMOR)!", "#ffd166", 2.4); sfx(95, 420, 0.3, "square");
  }
}

function deployLastStandFort(cx, cy) {
  for (let i = 0; i < activeForts.length; i++) {
    if (Math.hypot(activeForts[i].x - cx, activeForts[i].y - cy) < 90) return;
  }
  const fortRad = 68;
  for (let i = 0; i < 8; i++) {
    const a = (Math.PI * 2 * i) / 8;
    activeForts.push({ x: cx + Math.cos(a) * fortRad, y: cy + Math.sin(a) * fortRad, rad: 15 });
  }
  for (let i = 0; i < 6; i++) {
    const a = (Math.PI * 2 * i) / 6 + 0.35;
    activeMines.push({ x: cx + Math.cos(a) * (fortRad + 38), y: cy + Math.sin(a) * (fortRad + 38), dmg: 260 * (player ? player.might : 1) });
  }
  spawnParticles(cx, cy, 16);
  spawnSpeech(cx, cy, "LAST-STAND FORT & MINES DEPLOYED!", "#00e676", 2.5);
  sfx(140, 520, 0.28, "square");
}
// EOF:js/world.js