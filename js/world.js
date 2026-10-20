// FILE: js/world.js
// PART: 10 of 14
// DETAIL: Distance-based sub-biomes, ChaosMath chunk prop generation, solid obstacle queries, interactive chests/barricades/hovercrafts, and Last-Stand Forts.

"use strict";

/* === 1. DISTANCE SUB-BIOME CALCULATION (From Start 256, 256) === */
function getDistBiome(x, y) {
  const d = Math.hypot(x - 256, y - 256);
  for (let i = BIOME_RINGS.length - 1; i >= 0; i--) {
    if (d >= BIOME_RINGS[i].minDist) return BIOME_RINGS[i];
  }
  return BIOME_RINGS[0];
}

/* === 2. PROCEDURAL CHUNK PROP GENERATOR ===
   Prop Types:
   0 = PROP_TALL (Spire/Tree - Solid)
   1 = PROP_LOW (Crate/Rock - Solid)
   2 = PROP_DECOR (Flora - Non-solid)
   3 = LOOT_NODE (Supply Pod - Breakable on contact)
   4 = HAZARD_ZONE (Periodic Floor Damage)
   5 = SETTLEMENT_HUT (Biome >= 1 Solid Structure)
   6 = RELIC_CHEST (Interactive Relic Cache)
   7 = BARRICADE (Interactive Movable Cover - Solid)
   8 = HOVERCRAFT (Interactive Rideable Vehicle) */
function getChunkProps(cx, cy) {
  const key = cx + "," + cy;
  const broken = runChunkDeltas.get(key) || 0;
  const rng = hashChunk(cx, cy);
  const centerBiome = getDistBiome(cx * 512 + 256, cy * 512 + 256).id;
  const list = [];

  for (let i = 0; i < 8; i++) {
    const px = cx * 512 + rng() * 450 + 31;
    const py = cy * 512 + rng() * 450 + 31;
    const r = rng();
    const propSeed = Math.floor(rng() * 1000000);
    let type = 0;
    let rad = 18;

    if (i === 7) {
      // Special biome slot per chunk
      if (centerBiome === 0) {
        type = r < 0.55 ? 7 : (r < 0.85 ? 6 : 3);
      } else if (centerBiome === 1) {
        type = r < 0.45 ? 5 : (r < 0.78 ? 6 : 7);
      } else if (centerBiome === 2) {
        type = r < 0.45 ? 8 : (r < 0.75 ? 7 : 6);
      } else {
        type = r < 0.55 ? 6 : (r < 0.80 ? 8 : 5);
      }
    } else {
      if (centerBiome === 1 && r < 0.18) type = 5;
      else if (r < 0.27) type = 0;
      else if (r < 0.50) type = 1;
      else if (r < 0.68) type = 2;
      else if (r < 0.84) type = 3;
      else type = 4;
    }

    if (type === 5) rad = 28;
    else if (type === 8) rad = 22;
    else if (type === 4) rad = 28;
    else if (type === 1 || type === 6 || type === 7) rad = 16;

    // Skip broken loot crates, opened chests, picked-up barricades, or boarded vehicles
    if ((type === 0 || type === 3 || type === 6 || type === 7 || type === 8) && (broken & (1 << i))) {
      continue;
    }
    list.push({ i, key, x: px, y: py, type, rad, seed: propSeed });
  }
  return list;
}

/* === 3. SOLID OBSTACLE QUERIES (For Projectiles, Movement & Steering AI) === */
function getNearbySolidObstacles(x, y, searchRad = 180, ignoreForts = false) {
  const obs = [];
  const pcx = Math.floor(x / 512);
  const pcy = Math.floor(y / 512);

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
  const pcx = Math.floor(x / 512);
  const pcy = Math.floor(y / 512);
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

/* === 4. CONTEXTUAL WORLD INTERACTION (Chests, Barricades & Hovercrafts) === */
function findInteractTarget() {
  if (!player) return null;
  if (player.carryingBarricade) {
    return { action: "placeBarricade", label: "[PLACE BARRICADE]" };
  }

  const pcx = Math.floor(player.x / 512);
  const pcy = Math.floor(player.y / 512);
  let best = null;
  let bestDist = 52;

  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      const props = getChunkProps(pcx + dx, pcy + dy);
      for (let k = 0; k < props.length; k++) {
        const pr = props[k];
        if (pr.type === 6 || pr.type === 7 || pr.type === 8) {
          const d = Math.hypot(player.x - pr.x, player.y - pr.y);
          if (d < bestDist) {
            bestDist = d;
            const lbl = pr.type === 6 ? "[OPEN RELIC CHEST]" : (pr.type === 7 ? "[LIFT BARRICADE]" : "[BOARD HOVERCRAFT]");
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
      const lbl = b.type === 8 ? "[BOARD HOVERCRAFT]" : "[LIFT BARRICADE]";
      best = { action: "movedObj", index: i, obj: b, label: lbl };
    }
  }

  if (!best && player.inVehicle) {
    return { action: "exitVehicle", label: "[EXIT HOVERCRAFT]" };
  }
  return best;
}

function triggerWorldInteract() {
  if (!player) return;
  const tgt = findInteractTarget();
  if (!tgt) return;

  if (tgt.action === "placeBarricade") {
    player.carryingBarricade = false;
    const bx = player.x + Math.cos(player.aim) * 32;
    const by = player.y + Math.sin(player.aim) * 32;
    movedBarricades.push({ x: bx, y: by, rad: 18, type: 7, seed: Math.floor(Math.random() * 99999) });
    spawnSpeech(player.x, player.y, "BARRICADE DEPLOYED", "#00e5ff", 1.4);
    sfx(240, 140, 0.09, "square");
    return;
  }

  if (tgt.action === "exitVehicle") {
    player.inVehicle = false;
    movedBarricades.push({ x: player.x - Math.cos(player.aim) * 28, y: player.y - Math.sin(player.aim) * 28, rad: 22, type: 8, seed: 777 });
    spawnSpeech(player.x, player.y, "DISMOUNTED", "#cfd8dc", 1.2);
    sfx(320, 180, 0.1, "sawtooth");
    return;
  }

  if (tgt.action === "chunkProp") {
    const pr = tgt.prop;
    const prev = runChunkDeltas.get(pr.key) || 0;
    runChunkDeltas.set(pr.key, prev | (1 << pr.i));

    if (pr.type === 6) {
      grantRelic();
      spawnOrb(pr.x, pr.y, 25);
      spawnParticles(pr.x, pr.y, 12);
    } else if (pr.type === 7) {
      player.carryingBarricade = true;
      spawnSpeech(player.x, player.y, "CARRYING BARRICADE", "#ffd166", 1.4);
      sfx(200, 380, 0.08, "triangle");
    } else if (pr.type === 8) {
      player.inVehicle = true;
      player.vehicleHp = 120;
      spawnSpeech(player.x, player.y, "HOVERCRAFT ONLINE (+110% SPD)", "#00f0ff", 2.0);
      sfx(150, 620, 0.22, "sawtooth");
    }
  } else if (tgt.action === "movedObj") {
    const obj = tgt.obj;
    movedBarricades.splice(tgt.index, 1);
    if (obj.type === 8) {
      player.inVehicle = true;
      player.vehicleHp = 120;
      spawnSpeech(player.x, player.y, "HOVERCRAFT ONLINE", "#00f0ff", 1.8);
      sfx(150, 620, 0.2, "sawtooth");
    } else {
      player.carryingBarricade = true;
      spawnSpeech(player.x, player.y, "CARRYING BARRICADE", "#ffd166", 1.4);
      sfx(200, 380, 0.08, "triangle");
    }
  }
}

/* === 5. LAST-STAND FORTIFICATION & CLAYMORE MINE DEPLOYER === */
function deployLastStandFort(cx, cy) {
  // Prevent duplicate overlapping forts at exact spot
  for (let i = 0; i < activeForts.length; i++) {
    if (Math.hypot(activeForts[i].x - cx, activeForts[i].y - cy) < 90) return;
  }
  const posts = 8;
  const fortRad = 68;
  for (let i = 0; i < posts; i++) {
    const a = (Math.PI * 2 * i) / posts;
    activeForts.push({
      x: cx + Math.cos(a) * fortRad,
      y: cy + Math.sin(a) * fortRad,
      rad: 15
    });
  }
  const mineCnt = 6;
  for (let i = 0; i < mineCnt; i++) {
    const a = (Math.PI * 2 * i) / mineCnt + 0.35;
    activeMines.push({
      x: cx + Math.cos(a) * (fortRad + 38),
      y: cy + Math.sin(a) * (fortRad + 38),
      dmg: 220 * (player ? player.might : 1)
    });
  }
  spawnParticles(cx, cy, 16);
  spawnSpeech(cx, cy, "LAST-STAND FORT & MINES DEPLOYED!", "#00e676", 2.5);
  sfx(140, 520, 0.28, "square");
}
