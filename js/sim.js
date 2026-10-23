// FILE: js/sim.js
// PART: 12 of 14
// DETAIL: Continuous Moving Aim, Arm-Cap Holster Rotation, Dismemberment & Arterial Bleed-Out, Crawling Nubs, Supersonic Bullet Snap, and Corpse Fade.

"use strict";

/* === 1. MAIN SIMULATION TICK === */
function updateSim(rawDt) {
  if (typeof updateThemeMusic === "function") updateThemeMusic(rawDt);
  if (!runActive || runPaused || !player) return;
  const simDt = rawDt * timeScale;
  runTime += simDt;
  if (typeof totalRunTime !== "undefined") totalRunTime += simDt;
  if (typeof orbWarpTimer !== "undefined") orbWarpTimer += simDt;
  const elapsedTotal = typeof totalRunTime !== "undefined" ? totalRunTime : runTime;
  waveNum = 1 + Math.floor(elapsedTotal / 24);
  rivalTimer += simDt;
  ambTimer += rawDt;

  if (flameVisTimer > 0) flameVisTimer = Math.max(0, flameVisTimer - simDt);
  if (typeof muzzleFlashTimer !== "undefined" && muzzleFlashTimer > 0) muzzleFlashTimer = Math.max(0, muzzleFlashTimer - simDt);

  if (typeof compressOffscreenOrbsToChest === "function" && orbWarpTimer >= 600) {
    orbWarpTimer = 0; compressOffscreenOrbsToChest();
  }

  if (player.adaptTimer > 0) player.adaptTimer -= simDt;
  if (player.phaseTimer > 0) player.phaseTimer -= simDt;
  if (player.cid === 42) player.sandTimer = (player.sandTimer + simDt) % 6;
  if (player.cid === 43) player.vatsTimer = (player.vatsTimer + simDt) % 4;
  updateHeroSpecials(simDt);

  const sandMul = (player.cid === 42 && player.sandTimer < 1.8) ? 1.8 : 1.0;
  const vehMul = player.inVehicle === 1 ? (2.1 * player.vehBoostMul) : (player.inVehicle === 2 ? 1.25 : 1.0);

  // Player Leg Speed Floor (1% minimum speed even when heavily crippled) & Asymmetric Leg Drift
  const ll = player.limbs ? player.limbs[4] : 100, rl = player.limbs ? player.limbs[5] : 100;
  const legSpdMul = player.inVehicle ? 1.0 : Math.max(0.01, (ll + rl) / 200);
  const driftRad = player.inVehicle ? 0 : ((ll - rl) / 100) * 0.52;

  player.hp = Math.min(player.maxHp, player.hp + player.regen * simDt);
  const joyMag = Math.hypot(joy.dx, joy.dy);
  if (joyMag > 0.05) {
    const moveAng = Math.atan2(joy.dy, joy.dx) + driftRad;
    const effSpd = player.spd * legSpdMul * sandMul * vehMul;
    player.vx = Math.cos(moveAng) * joyMag * effSpd;
    player.vy = Math.sin(moveAng) * joyMag * effSpd;
    player.x += player.vx * simDt;
    player.y += player.vy * simDt;
    player.walk += simDt * 11 * Math.max(0.25, legSpdMul);
    player.moveDir = moveAng;
  } else {
    player.vx *= 0.8; player.vy *= 0.8;
  }

  // Continuous Independent Target Tracking: Guns & Swords always aim at nearest enemy even while moving!
  let nearE = -1, bestEDist = 1e9;
  for (let i = 0; i < MAX_E; i++) {
    if (eAct[i]) {
      const d = Math.hypot(eX[i] - player.x, eY[i] - player.y);
      if (d < bestEDist) { bestEDist = d; nearE = i; }
    }
  }
  if (nearE >= 0) {
    player.aim = Math.atan2(eY[nearE] - player.y, eX[nearE] - player.x);
  } else if (joyMag > 0.05) {
    player.aim = player.moveDir;
  }

  const pcx = Math.floor(player.x / 512), pcy = Math.floor(player.y / 512);
  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      const props = getChunkProps(pcx + dx, pcy + dy);
      for (let k = 0; k < props.length; k++) {
        const pr = props[k], dist = Math.hypot(player.x - pr.x, player.y - pr.y);
        if (pr.type === 3 && dist < 28) {
          runChunkDeltas.set(pr.key, (runChunkDeltas.get(pr.key) || 0) | (1 << pr.i));
          player.hp = Math.min(player.maxHp, player.hp + 25);
          if (player.limbs) { for (let z = 0; z < 6; z++) player.limbs[z] = Math.min(100, player.limbs[z] + 40); }
          spawnOrb(pr.x, pr.y, 24); spawnParticles(pr.x, pr.y, 8); sfx(520, 960, 0.1, "sine");
        } else if (pr.type === 4 && dist < 32 && !player.hazImmune && !player.hover && !player.inVehicle) {
          damagePlayerLimb(8 * player.diff.dmgMul * simDt, 4);
        } else if ((pr.type === 0 || pr.type === 1 || pr.type === 5 || pr.type === 7) && dist < pr.rad + 10 && !player.hover) {
          const a = Math.atan2(player.y - pr.y, player.x - pr.x);
          player.x = pr.x + Math.cos(a) * (pr.rad + 10); player.y = pr.y + Math.sin(a) * (pr.rad + 10);
        }
      }
    }
  }

  // Lower enemy density so dismemberment & formations shine, with proportional XP scaling
  if (Math.random() < simDt * (1.25 + waveNum * 0.09)) spawnEnemy(false, false);
  if (runTime >= 45 && !player.bossSpawned) { player.bossSpawned = true; spawnEnemy(true, false); }
  if (rivalTimer >= 75) { rivalTimer = 0; spawnEnemy(false, true); }

  // v4.4 Arm-Count Simultaneous Firing Cap & Holster Swap Micro-Animation
  const enabledWpns = player.weapons.filter(w => w.enabled !== false);
  const activeCount = Math.min(player.armCap || 2, enabledWpns.length);
  if (enabledWpns.length > activeCount) {
    player.swapTimer += simDt;
    if (player.swapTimer >= 3.2) {
      player.swapTimer = 0;
      player.swapPause = 0.22; // Brief holster/draw micro-animation pause
      player.handSlotOffset = (player.handSlotOffset + 1) % enabledWpns.length;
      sfx(240, 420, 0.04, "triangle", 0.09);
    }
  }
  if (player.swapPause > 0) player.swapPause = Math.max(0, player.swapPause - simDt);

  const reaverRate = player.cid === 17 ? (1 - 0.5 * (1 - player.hp / player.maxHp)) : 1;
  player.weapons.forEach(w => { w.ang += simDt * (w.lvl >= 10 ? 4.8 : 2.8); });

  if (player.swapPause <= 0 && enabledWpns.length > 0) {
    for (let s = 0; s < activeCount; s++) {
      const w = enabledWpns[(player.handSlotOffset + s) % enabledWpns.length];
      if (w.id === 52) {
        const maxCyl = w.lvl >= 10 ? 8 : 6;
        if (player.sixReloadCD > 0) {
          player.sixReloadCD -= simDt;
          if (player.sixReloadCD <= 0) player.sixShotsLeft = maxCyl;
        } else {
          player.sixBurstCD -= simDt * sandMul;
          if (player.sixBurstCD <= 0) {
            fireWeapon(w); player.sixShotsLeft--;
            if (player.sixShotsLeft <= 0) { player.sixReloadCD = 0.65 * player.cdr; spawnSpeech(player.x, player.y, "QUICK-RELOAD!", "#ffd166", 0.55); }
            else player.sixBurstCD = 0.11;
          }
        }
      } else {
        w.cd -= simDt * sandMul;
        if (w.cd <= 0) {
          w.cd = Math.max(0.18, (1.10 - w.lvl * 0.055) * player.cdr * reaverRate);
          fireWeapon(w);
        }
      }
    }
  }

  updateProjectiles(simDt);
  updateEnemies(simDt);
  updateGorePersistence(simDt);

  for (let i = 0; i < MAX_O; i++) {
    if (!oAct[i]) continue;
    const d = Math.hypot(player.x - oX[i], player.y - oY[i]);
    const isHoming = typeof oHome !== "undefined" && oHome[i] === 1;
    if (d < player.mag || isHoming) {
      const a = Math.atan2(player.y - oY[i], player.x - oX[i]), pullSpd = isHoming ? 520 : 320;
      oX[i] += Math.cos(a) * pullSpd * simDt; oY[i] += Math.sin(a) * pullSpd * simDt;
      if (d < 20) {
        oAct[i] = 0; if (typeof oHome !== "undefined") oHome[i] = 0;
        player.xp += oVal[i] * player.greed;
        sfx(500 + player.lvl * 12, 760 + player.lvl * 12, 0.035, "sine", 0.12);
        if (player.xp >= player.nextXp) {
          player.xp -= player.nextXp; player.lvl++;
          player.nextXp = Math.floor(player.nextXp * 1.25 + 6);
          triggerLevelUp();
        }
      }
    }
  }
  for (let i = 0; i < MAX_D; i++) { if (dAct[i]) { dY[i] -= 24 * simDt; dLife[i] -= simDt; if (dLife[i] <= 0) dAct[i] = 0; } }
  for (let i = 0; i < MAX_PT; i++) { if (ptAct[i]) { ptX[i] += ptVX[i] * simDt; ptY[i] += ptVY[i] * simDt; ptLife[i] -= simDt; if (ptLife[i] <= 0) ptAct[i] = 0; } }
  updateHUD();
}

function updateGorePersistence(simDt) {
  for (let i = 0; i < MAX_DRIP; i++) {
    if (!drAct[i]) continue;
    if (drZ[i] > 0) drZ[i] = Math.max(0, drZ[i] - 18 * simDt);
    else if (drRad[i] < 4.8) drRad[i] = Math.min(4.8, drRad[i] + 0.55 * simDt); // Slowly pools out on ground!
    drLife[i] -= simDt * 0.25;
    if (drLife[i] <= 0) drAct[i] = 0;
  }
  let cCnt = 0;
  for (let i = 0; i < MAX_CORPSE; i++) { if (corpAct[i]) cCnt++; }
  activeCorpseCount = cCnt;
  const overCap = Math.max(0, cCnt - (opts.persistCount || 100));
  for (let i = 0; i < MAX_CORPSE; i++) {
    if (!corpAct[i]) continue;
    const distFromHead = (corpHead - i + MAX_CORPSE) % MAX_CORPSE;
    if (overCap > 0 && distFromHead >= (opts.persistCount || 100)) {
      corpFade[i] -= simDt * 0.08; // Imperceptibly slow fade on oldest corpses beyond persistCount
      if (corpFade[i] <= 0) corpAct[i] = 0;
    }
  }
  for (let i = 0; i < MAX_LIMB; i++) {
    if (!lmbAct[i]) continue;
    const distFromHead = (lmbHead - i + MAX_LIMB) % MAX_LIMB;
    if (distFromHead > Math.min(MAX_LIMB - 10, (opts.persistCount || 100) * 3)) {
      lmbFade[i] -= simDt * 0.08;
      if (lmbFade[i] <= 0) lmbAct[i] = 0;
    }
  }
}

/* === 2. PLAYER LIMB TRAUMA, ENEMY DISMEMBERMENT & ARTERIAL BLEEDING === */
function damagePlayerLimb(rawDmg, forcedZone = -1) {
  if (!player) return;
  let z = forcedZone >= 0 ? forcedZone : Math.floor(Math.random() * 6);
  if (player.guardZone >= 0 && Math.random() < 0.75) z = player.guardZone;
  let guardMul = 1.0;
  if (player.guardZone === z) {
    guardMul = ((player.cid === 51 && (z === 0 || z === 1)) || (player.cid === 40 && z === 0)) ? 0.05 : 0.30;
  }
  const finalDmg = rawDmg * guardMul;
  player.hp -= finalDmg;
  if (player.limbs && guardMul > 0.1) player.limbs[z] = Math.max(1, player.limbs[z] - finalDmg * 1.35);
  player.xp += finalDmg * 0.28 * player.greed * (player.cid === 50 ? 1.85 : 1.0);
  if (player.xp >= player.nextXp && player.hp > 0 && !runPaused) {
    player.xp -= player.nextXp; player.lvl++; player.nextXp = Math.floor(player.nextXp * 1.25 + 6); triggerLevelUp();
  }
}

function findNearestEnemyType(x, y, fallbackIdx = 0) {
  let bestD = 1e9, bestType = fallbackIdx % 4;
  for (let j = 0; j < MAX_E; j++) {
    if (eAct[j]) { const d = Math.hypot(eX[j] - x, eY[j] - y); if (d < bestD) { bestD = d; bestType = eType[j]; } }
  }
  return bestType;
}

function applyEnemyHitAndLimbs(j, finalDmg, isCrit, hitX = eX[j], hitY = eY[j], atkType = 0) {
  eHP[j] -= finalDmg;
  if (player.slow > 0) eSlow[j] = Math.min(0.65, player.slow);
  if (player.shred > 0) eShred[j] += player.shred * 0.25;

  const maxH = Math.max(1, eMax[j]), et = eType[j], r = et >= 98 ? 22 : 14;
  const focus = Math.max(0.25, 1.0 - Math.min(0.65, player.crit * 0.75));
  const rx = ((hitX - eX[j]) / r) * focus + (Math.random() - 0.5) * 0.16 * focus;
  const ry = ((hitY - eY[j]) / r) * focus + (Math.random() - 0.5) * 0.16 * focus;
  const side = rx < 0 ? -1 : 1;
  const col = et === 99 ? "#ffd166" : (et === 98 ? "#cfd8dc" : player.fac.c2);

  if (isCrit) {
    // Vitals / Arterial Strike: Heavy blood spray + rapid arterial bleed-out over time!
    const isHead = (Math.random() < 0.52) || (ry < -0.15);
    eBleed[j] = 1;
    eBleedRate[j] = Math.max(eBleedRate[j], maxH * 0.14);
    for (let b = 0; b < 3; b++) spawnDrip(eX[j] + (Math.random() - 0.5) * 10, eY[j] + (Math.random() - 0.5) * 8, j, 3.2);
    let nx = (Math.random() - 0.5) * 0.14, ny = isHead ? -0.64 : -0.12;
    if (et === 1) { nx = isHead ? 0.48 : 0.08; ny = isHead ? -0.26 : -0.10; }
    if (typeof recordShotImpact === "function") recordShotImpact(nx, ny, atkType, et, isHead ? 3 : 2);
    spawnDmg(eX[j], eY[j], Math.min(100, Math.max(1, Math.round((finalDmg / maxH) * 100))), true, false);
  } else {
    // Limb Strike: Severs arms and legs onto the ground while enemy keeps advancing!
    const limbPool = maxH * 0.28, pctDelta = Math.min(95, Math.max(8, Math.round((finalDmg / limbPool) * 100)));
    eBleed[j] = 1;
    eBleedRate[j] = Math.max(eBleedRate[j], maxH * 0.06);
    spawnDrip(eX[j], eY[j] + 6, j, 2.5);

    let nx = rx, ny = ry;
    const hitArm = (ry < 0.05 && et !== 1 && et !== 2);
    if (et === 1 && (eSeed[j] + Math.floor(runTime * 10)) % 3 === 0) {
      const prevTail = eTailDmg[j];
      eTailDmg[j] = Math.min(100, eTailDmg[j] + pctDelta);
      if (prevTail < 45 && eTailDmg[j] >= 45) spawnGroundLimb(eX[j], eY[j], col, 2);
      nx = -0.64; ny = -0.22;
    } else if (hitArm && eArmsLost[j] < (et === 99 ? 4 : 2)) {
      eArmsLost[j]++;
      spawnGroundLimb(eX[j], eY[j], col, 1); // Drops severed arm on ground; enemy walks right past it!
      nx = side * (0.38 + Math.random() * 0.14); ny = -0.18 + (Math.random() - 0.5) * 0.24;
    } else {
      const prevLegs = eLegsLost[j];
      eLegDmg[j] = Math.min(100, eLegDmg[j] + pctDelta);
      const maxL = et === 1 ? 4 : 2;
      eLegsLost[j] = Math.min(maxL, Math.floor(eLegDmg[j] / (et === 1 ? 25 : 42)));
      if (eLegsLost[j] > prevLegs) spawnGroundLimb(eX[j], eY[j] + 6, col, 0); // Drops severed leg on ground!
      nx = side * (0.16 + Math.random() * 0.16); ny = 0.34 + Math.random() * 0.36;
    }
    if (typeof recordShotImpact === "function") recordShotImpact(nx, ny, atkType, et, 1);
    spawnDmg(eX[j], eY[j], pctDelta, false, true);
  }
}

function canEnemyDeflect(j, projStyle, curBounces = 0) {
  if (projStyle === 1 || projStyle === 6 || projStyle === 7 || eStun[j] > 0 || eGrapple[j] > 0 || eArmsLost[j] >= 2) return false;
  const isDeflector = eType[j] >= 98 || ((eType[j] === 0 || eType[j] === 3) && eWave[j] >= 2 && (eSeed[j] % 5 === 0));
  if (!isDeflector) return false;
  return Math.random() < Math.min(0.96, (eType[j] >= 98 ? 0.25 : 0.32) + eWave[j] * 0.06 + (curBounces > 0 ? 0.35 : 0));
}

function updateProjectiles(simDt) {
  for (let i = 0; i < MAX_P; i++) {
    if (!pAct[i]) continue;
    pLife[i] -= simDt;
    if (pLife[i] <= 0) {
      if (pEnemy[i] === 0 && pHit[i] === 0 && pStyle[i] !== 1 && pStyle[i] !== 6 && pStyle[i] !== 7 && typeof recordShotImpact === "function") {
        const ma = Math.atan2(pVY[i], pVX[i]);
        recordShotImpact(Math.cos(ma) * 0.86, Math.sin(ma) * 0.86, 0, findNearestEnemyType(pX[i], pY[i], i), 0);
      }
      pAct[i] = 0; continue;
    }

    if (pEnemy[i] >= 1) {
      pX[i] += pVX[i] * simDt; pY[i] += pVY[i] * simDt;
      const dPlr = Math.hypot(pX[i] - player.x, pY[i] - player.y);
      // Supersonic Bullet Pass-By Snap/Pop Sound when enemy shot whizzes past player!
      if (pSnap[i] === 0 && dPlr < 44 && dPlr > 18) {
        pSnap[i] = 1;
        if (typeof sfxSnap === "function") sfxSnap();
      }
      if (player.hasRepulsor && dPlr < 58) {
        pAct[i] = 0; spawnParticles(pX[i], pY[i], 4); sfx(680, 920, 0.04, "sine", 0.1); continue;
      }
      if (isPointBlockedByObstacle(pX[i], pY[i], false)) {
        pAct[i] = 0; spawnParticles(pX[i], pY[i], 3); if (typeof sfxRicochet === "function") sfxRicochet(); continue;
      }
      if (pEnemy[i] === 2) {
        let hitFoe = false;
        for (let j = 0; j < MAX_E; j++) {
          if (eAct[j] && Math.hypot(pX[i] - eX[j], pY[i] - eY[j]) < (eType[j] >= 98 ? 22 : 14)) {
            applyEnemyHitAndLimbs(j, pDmg[i], true, pX[i], pY[i], 0);
            if (eHP[j] <= 0) handleEnemyDeath(j);
            pAct[i] = 0; hitFoe = true; break;
          }
        }
        if (hitFoe) continue;
      }
      if (player.hasSaber && dPlr < 32 && Math.random() < (player.saberMastery / 100)) {
        player.saberMastery = Math.min(100, player.saberMastery + 1.4);
        pBounce[i] = Math.min(250, pBounce[i] + 1);
        player.swordSwingTimer = 0.18;
        let tx = pX[i] - pVX[i], ty = pY[i] - pVY[i], bd = 1e9;
        for (let j = 0; j < MAX_E; j++) {
          if (eAct[j]) { const ed = Math.hypot(eX[j] - player.x, eY[j] - player.y); if (ed < bd) { bd = ed; tx = eX[j]; ty = eY[j]; } }
        }
        const scatter = (1 - player.saberMastery / 100) * 1.35;
        const refAng = Math.atan2(ty - player.y, tx - player.x) + (Math.random() - 0.5) * scatter;
        const spd = Math.min(620, Math.hypot(pVX[i], pVY[i]) * 1.06 + 30);
        pVX[i] = Math.cos(refAng) * spd; pVY[i] = Math.sin(refAng) * spd;
        pX[i] = player.x + Math.cos(refAng) * 24; pY[i] = player.y + Math.sin(refAng) * 24;
        pEnemy[i] = 0; pLife[i] = 1.6;
        if (typeof sfxRicochet === "function") sfxRicochet();
        continue;
      }
      if (dPlr < 16) {
        pAct[i] = 0;
        if (Math.random() < player.dodge) { spawnSpeech(player.x, player.y, "DODGED!", "#00e5ff", 0.7); continue; }
        const raw = pEnemy[i] === 2 ? Math.min(26, pDmg[i] * 0.25) * player.diff.dmgMul : pDmg[i];
        const effArm = player.armor + (player.adaptTimer > 0 ? 5 : 0);
        const dmg = Math.max(1, raw - effArm) * (player.cid === 1 ? 0.8 : 1);
        if (player.inVehicle) { player.vehicleHp -= dmg; if (player.vehicleHp <= 0) player.inVehicle = 0; }
        else { damagePlayerLimb(dmg); if (player.cid === 23) player.adaptTimer = 5; }
        spawnDmg(player.x, player.y, dmg, false, false);
      }
      continue;
    }

    if (pStyle[i] === 1) {
      pVX[i] += simDt * (pSup[i] ? 6 : 3.5);
      pX[i] = player.x + Math.cos(pVX[i]) * pVY[i]; pY[i] = player.y + Math.sin(pVX[i]) * pVY[i];
    } else if (pStyle[i] === 2) {
      let bx = 0, by = 0, bd = 260;
      for (let j = 0; j < MAX_E; j++) {
        if (eAct[j]) { const d = Math.hypot(eX[j] - pX[i], eY[j] - pY[i]); if (d < bd) { bd = d; bx = eX[j]; by = eY[j]; } }
      }
      if (bd < 260) {
        const ta = Math.atan2(by - pY[i], bx - pX[i]), spd = Math.hypot(pVX[i], pVY[i]);
        pVX[i] = pVX[i] * 0.88 + Math.cos(ta) * spd * 0.12; pVY[i] = pVY[i] * 0.88 + Math.sin(ta) * spd * 0.12;
      }
      pX[i] += pVX[i] * simDt; pY[i] += pVY[i] * simDt;
    } else if (pStyle[i] !== 6) {
      pX[i] += pVX[i] * simDt; pY[i] += pVY[i] * simDt;
    }

    if (pStyle[i] !== 1 && pStyle[i] !== 6 && pStyle[i] !== 7 && isPointBlockedByObstacle(pX[i], pY[i], true)) {
      if (pHit[i] === 0 && typeof recordShotImpact === "function") {
        const ma = Math.atan2(pVY[i], pVX[i]);
        recordShotImpact(Math.cos(ma) * 0.86, Math.sin(ma) * 0.86, 0, findNearestEnemyType(pX[i], pY[i], i), 0);
      }
      pAct[i] = 0; spawnParticles(pX[i], pY[i], 3); if (typeof sfxRicochet === "function") sfxRicochet(); continue;
    }

    for (let j = 0; j < MAX_E; j++) {
      if (!eAct[j]) continue;
      const hitR = pRad[i] + (eType[j] >= 98 ? 22 : 13);
      if (Math.hypot(pX[i] - eX[j], pY[i] - eY[j]) < hitR) {
        pHit[i] = 1;
        if (canEnemyDeflect(j, pStyle[i], pBounce[i])) {
          pBounce[i] = Math.min(250, pBounce[i] + 1);
          const toPlr = Math.atan2(player.y - eY[j], player.x - eX[j]);
          const acc = Math.min(1.0, eWave[j] / 12);
          const defAng = toPlr + (Math.random() - 0.5) * (2.6 * (1 - acc) + 0.06);
          const defSpd = Math.min(620, Math.max(260, Math.hypot(pVX[i], pVY[i]) * 1.04));
          pVX[i] = Math.cos(defAng) * defSpd; pVY[i] = Math.sin(defAng) * defSpd;
          pX[i] = eX[j] + Math.cos(defAng) * (hitR + 9); pY[i] = eY[j] + Math.sin(defAng) * (hitR + 9);
          pEnemy[i] = 2; pStyle[i] = 4; pLife[i] = 1.6;
          spawnParticles(eX[j], eY[j], 5); if (typeof sfxRicochet === "function") sfxRicochet(); break;
        }
        const isCrit = (player.cid === 43 && player.vatsTimer < 0.8) || (Math.random() < player.crit);
        const finalDmg = pDmg[i] * (isCrit ? player.cdmg : 1) * (eType[j] >= 98 ? player.bossMul : 1) * (1 + eShred[j]);
        applyEnemyHitAndLimbs(j, finalDmg, isCrit, pX[i], pY[i], (pStyle[i] === 1 || pStyle[i] === 6 || pStyle[i] === 7) ? 1 : 0);

        if (pStyle[i] !== 6 && eGrapple[j] <= 0) {
          const ka = Math.atan2(eY[j] - player.y, eX[j] - player.x);
          eX[j] += Math.cos(ka) * 8 * player.kb; eY[j] += Math.sin(ka) * 8 * player.kb;
        }
        spawnParticles(eX[j], eY[j], 3);
        if (pPrc[i] > 0) pPrc[i]--; else pAct[i] = 0;
        if (eHP[j] <= 0) handleEnemyDeath(j);
        if (!pAct[i]) break;
      }
    }
  }
}

function handleEnemyDeath(j) {
  spawnCorpse(eX[j], eY[j], eSeed[j], eType[j], eLegsLost[j], eArmsLost[j]);
  eAct[j] = 0; clearEnemyLimbState(j, false); player.kills++;
  if (player.cid === 3 && player.kills % 15 === 0) player.hp = Math.min(player.maxHp, player.hp + 1);
  if (player.cid === 11 && player.kills % 10 === 0) player.hp = Math.min(player.maxHp, player.hp + 3);
  if (player.cid === 33 && Math.hypot(eX[j] - player.x, eY[j] - player.y) < 95) player.hp = Math.min(player.maxHp, player.hp + 1.5);

  // Proportional 3.2x XP per orb so lower enemy count levels just as smoothly!
  spawnOrb(eX[j], eY[j], eType[j] >= 98 ? 140 : 12.5);
  sfx(170, 55, 0.04, "square", 0.12);

  if (eType[j] >= 98) {
    meta.dmEarned += Math.ceil(player.stg.dmDrop * (1 + player.dmRun) * player.diff.dropMul);
    const nxtStg = Math.min(50, player.stg.id + 1);
    if (!meta.stages.includes(nxtStg)) meta.stages.push(nxtStg);
    saveMeta(); grantRelic();
    spawnSpeech(player.x, player.y - 22, '"' + getBossQuote(player.cid, player.fac.id) + '"', "#ffd166", 3.2);
    if (opts.flash) flashAlpha = 0.65;
    sfx(260, 880, 0.35, "triangle", 0.3);
    if (eType[j] === 99) { player.bossSpawned = false; runTime = 0; }
  }
}

function updateEnemies(simDt) {
  const elapsedTotal = typeof totalRunTime !== "undefined" ? totalRunTime : runTime;
  for (let i = 0; i < MAX_E; i++) {
    if (!eAct[i]) continue;
    // Realistic Arterial Bleed-Out & Blood Drip Trail
    if (eBleed[i] === 1) {
      if (Math.random() < simDt * 7.5) spawnDrip(eX[i], eY[i] + 7, i, 2.6);
      if (eBleedRate[i] > 0) {
        eHP[i] -= eBleedRate[i] * simDt;
        if (eHP[i] <= 0) { handleEnemyDeath(i); continue; }
      }
    }

    for (let m = activeMines.length - 1; m >= 0; m--) {
      if (Math.hypot(eX[i] - activeMines[m].x, eY[i] - activeMines[m].y) < 26) {
        const mn = activeMines[m]; activeMines.splice(m, 1);
        applyEnemyHitAndLimbs(i, mn.dmg, true, mn.x, mn.y, 0); eStun[i] = 2.0;
        spawnParticles(mn.x, mn.y, 12); sfx(120, 45, 0.18, "sawtooth");
        if (eHP[i] <= 0) { handleEnemyDeath(i); break; }
      }
    }
    if (!eAct[i]) continue;
    if (eGrapple[i] > 0) {
      eGrapple[i] -= simDt * (eType[i] >= 98 ? 1.4 : 1.0); eHP[i] -= 22 * player.might * simDt;
      if (eHP[i] <= 0) handleEnemyDeath(i); continue;
    }
    if (eStun[i] > 0) { eStun[i] = Math.max(0, eStun[i] - simDt); continue; }

    const isNubCrawler = eLegsLost[i] >= 2 && eArmsLost[i] >= 2;
    let legMul = isNubCrawler ? 0.22 : (eType[i] === 1 ? ([1.0, 0.85, 0.35, 0.18, 0.15][eLegsLost[i]] || 0.15) : Math.max(0.28, 1.0 - (eLegDmg[i] / 100) * 0.68));
    let tx = player.x, ty = player.y;

    // Cohesive Battle Formation Steering (Roman Testudo Phalanx or Beastmaster Wolf Pack)
    const lead = eFormLeader[i];
    if (lead >= 0 && eAct[lead] && !isNubCrawler) {
      const lAng = Math.atan2(player.y - eY[lead], player.x - eX[lead]);
      const side = (i & 1) ? 1 : -1;
      if (eFormType[i] === 1) {
        tx = eX[lead] + Math.cos(lAng + side * 1.45) * 24;
        ty = eY[lead] + Math.sin(lAng + side * 1.45) * 24;
      } else {
        tx = eX[lead] + Math.cos(lAng + side * 0.95) * 34;
        ty = eY[lead] + Math.sin(lAng + side * 0.95) * 34;
      }
    }

    const baseAng = Math.atan2(ty - eY[i], tx - eX[i]);
    let patAng = ChaosMath.movePattern(eMoveStyle[i], baseAng, elapsedTotal, eSeed[i]);
    if (eType[i] === 1 && eTailDmg[i] >= 45) {
      eTurnTimer[i] -= simDt;
      if (eTurnTimer[i] <= 0) { eTurnTimer[i] = 0.45 + (eSeed[i] % 5) * 0.1; eTurnAng[i] = baseAng + (Math.random() - 0.5) * 1.45; }
      patAng = eTurnAng[i];
    }

    const curSpd = eSpd[i] * (eFormType[i] === 1 ? 0.78 : 1.0) * legMul * (1 - eSlow[i]) * (player.cid === 49 ? 0.75 : 1);
    const nearObs = getNearbySolidObstacles(eX[i], eY[i], 70, false);

    if ((eWave[i] >= 3 || eType[i] >= 98) && !(eType[i] === 1 && eTailDmg[i] >= 45)) {
      const st = ChaosMath.steerAround(eX[i], eY[i], tx, ty, nearObs, 1.15, eSeed[i]);
      eX[i] += st.vx * curSpd * simDt; eY[i] += st.vy * curSpd * simDt;
    } else {
      eX[i] += Math.cos(patAng) * curSpd * simDt; eY[i] += Math.sin(patAng) * curSpd * simDt;
    }

    for (let k = 0; k < nearObs.length; k++) {
      const ob = nearObs[k], od = Math.hypot(eX[i] - ob.x, eY[i] - ob.y);
      if (od < ob.rad + 11) {
        const pushA = Math.atan2(eY[i] - ob.y, eX[i] - ob.x);
        eX[i] = ob.x + Math.cos(pushA) * (ob.rad + 13); eY[i] = ob.y + Math.sin(pushA) * (ob.rad + 13);
      }
    }

    if ((eType[i] === 98 || (eWave[i] >= 4 && i % 6 === 0)) && eArmsLost[i] < 2) {
      eFireCD[i] -= simDt;
      if (eFireCD[i] <= 0 && Math.hypot(player.x - eX[i], player.y - eY[i]) < 290) {
        eFireCD[i] = eType[i] === 98 ? 1.35 : 2.8;
        const fa = Math.atan2(player.y - eY[i], player.x - eX[i]);
        spawnProj(eX[i], eY[i], Math.cos(fa) * 210, Math.sin(fa) * 210, 12 * player.diff.dmgMul, 1.8, 6, 0, 2, 0, 1);
      }
    }

    if (Math.hypot(player.x - eX[i], player.y - eY[i]) < (eType[i] >= 98 ? 26 : 18)) {
      if (player.cid === 51 && player.cqcCD <= 0) {
        player.cqcCD = 0.85; const flipA = Math.random() * Math.PI * 2;
        eX[i] = player.x + Math.cos(flipA) * 44; eY[i] = player.y + Math.sin(flipA) * 44; eStun[i] = 2.4;
        const exDmg = eType[i] >= 98 ? Math.max(240 * player.might, eMax[i] * 0.34) : eHP[i] + 999;
        applyEnemyHitAndLimbs(i, exDmg, true, eX[i], eY[i], 1);
        spawnSpeech(player.x, player.y, "CQC FLIP & EXECUTE!", "#ffd166", 1.1); sfx(780, 140, 0.1, "square");
        if (eHP[i] <= 0) handleEnemyDeath(i); continue;
      }
      if (player.inVehicle) {
        eHP[i] -= (player.inVehicle === 2 ? 150 : 95) * player.might * player.vehBoostMul * simDt * 8;
        player.vehicleHp -= 10 * simDt; if (player.vehicleHp <= 0) player.inVehicle = 0;
        if (eHP[i] <= 0) handleEnemyDeath(i); continue;
      }
      if (player.cid === 47 || player.cid === 30) eHP[i] -= (player.cid === 30 ? 80 : 45) * simDt;
      if (Math.random() < player.dodge * simDt * 2) continue;
      if (player.cid === 10 && player.phaseTimer <= 0) {
        player.phaseTimer = 8; player.x += (Math.random() - 0.5) * 160; player.y += (Math.random() - 0.5) * 160; continue;
      }
      const effArm = player.armor + (player.adaptTimer > 0 ? 5 : 0);
      const dmg = Math.max(1, 14 * player.diff.dmgMul - effArm) * (player.cid === 1 ? 0.8 : 1) * simDt;
      damagePlayerLimb(dmg);
      if (player.cid === 23) player.adaptTimer = 5;
      if (player.cid === 50) { player.maxHp += 10 * simDt; player.might += 0.1 * simDt; }

      if (player.hp <= 0) {
        if (player.revives > 0) {
          player.revives--; player.hp = player.maxHp * (player.cid === 46 ? 1.0 : 0.5);
          if (player.limbs) player.limbs.fill(100);
          if (player.cid === 46) { player.might *= 1.2; player.spd *= 1.15; }
          if (opts.flash) flashAlpha = 0.8;
          spawnProj(player.x, player.y, 0, 0, 250 * player.might, 0.5, 160, 99, 6, 1, 0); sfx(220, 880, 0.3, "sawtooth", 0.3);
        } else {
          purgeRunMemory(); document.getElementById("hud").classList.remove("active"); showScreen("scrMain"); break;
        }
      }
    }
  }
}
// EOF:js/sim.js