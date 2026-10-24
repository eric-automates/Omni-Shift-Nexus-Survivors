// FILE: js/sim.js
// PART: 12 of 14
// DETAIL: 56-Hero Kinematic Movement & Passives (#03, #11, #17, #23, #30, #33, #42, #43, #46, #47, #50), Goa'uld Repulsor Shield, Verified Spawner, Instant Interact HUD Sync, and Gore Dismemberment.

"use strict";

const keys = {};
window.addEventListener("keydown", e => { keys[e.code] = true; });
window.addEventListener("keyup", e => { keys[e.code] = false; });

const MAX_BLAST = 32;
const blX = new Float32Array(MAX_BLAST), blY = new Float32Array(MAX_BLAST),
      blRad = new Float32Array(MAX_BLAST), blMaxR = new Float32Array(MAX_BLAST),
      blLife = new Float32Array(MAX_BLAST), blAct = new Uint8Array(MAX_BLAST);
const blCol = new Array(MAX_BLAST).fill("#ff6d00");

function spawnBlastWave(x, y, maxRadius = 68, color = "#ff6d00") {
  for (let i = 0; i < MAX_BLAST; i++) {
    if (!blAct[i]) {
      blX[i] = x; blY[i] = y; blRad[i] = 6;
      blMaxR[i] = maxRadius; blLife[i] = 0.38;
      blCol[i] = color; blAct[i] = 1;
      return;
    }
  }
}

function triggerRocketDetonation(x, y, dmg, blastRadius) {
  spawnBlastWave(x, y, blastRadius, "#ff6d00");
  spawnParticles(x, y, 12);
  sfx(120, 45, 0.28, "sawtooth", 0.32);
  for (let j = 0; j < MAX_E; j++) {
    if (!eAct[j]) continue;
    const d = Math.hypot(eX[j] - x, eY[j] - y);
    if (d <= blastRadius) {
      const splash = dmg * 1.35 * (1 - (d / blastRadius) * 0.45);
      eHP[j] -= splash;
      eStun[j] = Math.max(eStun[j], 0.85);
      spawnDmg(eX[j], eY[j], splash, true);
      if (eHP[j] <= 0) killEnemy(j, false);
    }
  }
}

function killEnemy(idx, wasHeadshot = false) {
  if (!eAct[idx]) return;
  const ex = eX[idx], ey = eY[idx], et = eType[idx];
  eAct[idx] = 0;
  player.kills++;

  // Hero #33 Doom Slayer: Kills within 90px heal 1.5 HP
  if (player.cid === 33 && Math.hypot(ex - player.x, ey - player.y) <= 95) {
    player.hp = Math.min(player.maxHp, player.hp + 1.5);
  }
  // Hero #03 Crimson Sith Sovereign: Dark Hate Conduit Kill Heal
  if (player.cid === 3) {
    player.hp = Math.min(player.maxHp, player.hp + 0.8);
  }
  // Hero #11 Pegasus Hive Matron: Heals 3 HP every 10 kills
  if (player.cid === 11 && player.kills % 10 === 0) {
    player.hp = Math.min(player.maxHp, player.hp + 3.0);
  }

  spawnCorpse(ex, ey, eSeed[idx], et, eLegsLost[idx], eArmsLost[idx]);
  if (wasHeadshot) spawnGroundLimb(ex, ey - 8, "#ff1744", 2);
  spawnParticles(ex, ey, 6);
  const xpVal = et === 99 ? 120 : (et === 98 ? 65 : (3.2 + waveNum * 0.55));
  spawnOrb(ex, ey, xpVal);
  if (et >= 98 && typeof grantRelic === "function") grantRelic();
  if (player.kills % 10 === 0 && typeof updateHUD === "function") updateHUD();
}

function hitTestPlayerProj(i) {
  for (let j = 0; j < MAX_E; j++) {
    if (!eAct[j]) continue;
    const eRad = eType[j] === 99 ? 24 : (eType[j] === 3 ? 17 : 13);
    const dx = pX[i] - eX[j], dy = pY[i] - eY[j];
    if (Math.hypot(dx, dy) > pRad[i] + eRad) continue;

    if (pStyle[i] === 2) {
      triggerRocketDetonation(pX[i], pY[i], pDmg[i], Math.max(58, pRad[i] * 5.2));
      pAct[i] = 0;
      return;
    }

    const nx = Math.max(-0.95, Math.min(0.95, dx / eRad));
    const ny = Math.max(-0.95, Math.min(0.95, dy / eRad));
    const isHead = ny < -0.38 && Math.abs(nx) < 0.48;
    const isLeg = ny > 0.32;
    const isArm = !isHead && !isLeg && Math.abs(nx) > 0.42;
    const atkType = (pStyle[i] === 1 || pStyle[i] === 7) ? 1 : 0;
    recordShotImpact(nx, ny, atkType, eType[j], isHead ? 2 : 1);

    if (eFormType[j] === 1 && !isHead && Math.random() < 0.38) {
      if (typeof sfxRicochet === "function") sfxRicochet();
      pVX[i] = -pVX[i] * 0.7; pVY[i] = -pVY[i] * 0.7;
      pPrc[i]--;
      if (pPrc[i] < 0) pAct[i] = 0;
      return;
    }

    const visorBonus = (player.activeVisor && player.activeVisor > 0) ? 0.10 : 0;
    const vatsGuaranteed = (player.cid === 43 && player.vatsTimer > 0);
    const isCrit = isHead || vatsGuaranteed || (Math.random() < ((player.crit || 0.08) + visorBonus));
    const bossBoost = eType[j] >= 98 ? (player.bossMul || 1.0) : 1.0;
    const finalDmg = pDmg[i] * (isCrit ? (player.cdmg || 1.75) : 1.0) * bossBoost * (1 + eShred[j] * 0.04);

    eHP[j] -= finalDmg;
    if (player.shred > 0) eShred[j] = Math.min(12, eShred[j] + player.shred * 5);
    if (player.slow > 0) eSlow[j] = 2.2;
    spawnDmg(eX[j], eY[j], finalDmg, isCrit, isLeg || isArm);
    sfx(170, 55, 0.045, "triangle", 0.14);

    if (isLeg && eLegsLost[j] < 2) {
      eLegDmg[j] += finalDmg;
      if (eLegDmg[j] > eMax[j] * 0.28) {
        eLegDmg[j] = 0; eLegsLost[j]++;
        eBleed[j] = 1; eBleedRate[j] = eMax[j] * 0.08;
        spawnGroundLimb(eX[j], eY[j] + 8, "#ff1744", 0);
      }
    } else if (isArm && eArmsLost[j] < 2) {
      eTailDmg[j] += finalDmg;
      if (eTailDmg[j] > eMax[j] * 0.26) {
        eTailDmg[j] = 0; eArmsLost[j]++;
        eBleed[j] = 1; eBleedRate[j] = eMax[j] * 0.07;
        spawnGroundLimb(eX[j] + (nx > 0 ? 9 : -9), eY[j], "#ff5252", 1);
      }
    }

    const ka = Math.atan2(eY[j] - player.y, eX[j] - player.x);
    const kbDist = (eType[j] === 99 ? 2 : 7) * (player.kb || 1.0);
    eX[j] += Math.cos(ka) * kbDist;
    eY[j] += Math.sin(ka) * kbDist;

    if (eHP[j] <= 0) killEnemy(j, isHead);

    pPrc[i]--;
    if (pPrc[i] < 0) {
      pAct[i] = 0;
      return;
    }
  }
}

function updateSim(rawDt) {
  const t0 = performance.now();
  if (typeof updateThemeMusic === "function") updateThemeMusic(rawDt);
  if (!runActive || runPaused || !player) return;

  const simDt = rawDt * timeScale;
  runTime += simDt;
  totalRunTime += rawDt;
  orbWarpTimer += simDt;
  if (orbWarpTimer >= 600) {
    orbWarpTimer = 0;
    if (typeof compressOffscreenOrbsToChest === "function") compressOffscreenOrbsToChest();
  }

  const newWave = 1 + Math.floor(runTime / 30);
  if (newWave > waveNum) { waveNum = newWave; sfx(240, 520, 0.18, "triangle", 0.18); }

  if (flameVisTimer > 0) flameVisTimer = Math.max(0, flameVisTimer - simDt);
  if (muzzleFlashTimer > 0) muzzleFlashTimer = Math.max(0, muzzleFlashTimer - simDt);
  if (player.recoilKick > 0) player.recoilKick = Math.max(0, player.recoilKick - simDt * 6.5);
  if (player.swordSwingTimer > 0) player.swordSwingTimer = Math.max(0, player.swordSwingTimer - simDt);
  if (player.swordLungeTimer > 0) player.swordLungeTimer = Math.max(0, player.swordLungeTimer - simDt);
  if (player.regen > 0 && player.hp < player.maxHp) player.hp = Math.min(player.maxHp, player.hp + player.regen * simDt);

  let mx = joy.act ? joy.dx : 0, my = joy.act ? joy.dy : 0;
  if (keys["KeyW"] || keys["ArrowUp"]) my -= 1;
  if (keys["KeyS"] || keys["ArrowDown"]) my += 1;
  if (keys["KeyA"] || keys["ArrowLeft"]) mx -= 1;
  if (keys["KeyD"] || keys["ArrowRight"]) mx += 1;

  const mag = Math.hypot(mx, my);
  if (mag > 1) { mx /= mag; my /= mag; }

  const legFactor = 0.35 + 0.65 * ((player.limbs[4] + player.limbs[5]) / 200);
  const legImbalance = (player.limbs[4] - player.limbs[5]) / 100;
  const vehBoost = (typeof player.vehBoostMul === "number") ? player.vehBoostMul : 1.0;
  const vehMul = player.inVehicle === 1 ? (1.42 * vehBoost) : (player.inVehicle === 2 ? 0.88 : 1.0);
  const rushSpdMul = (player.overclockTimer > 0 ? 2.0 : 1.0) * (player.sandTimer > 0 ? 1.8 : 1.0);
  const effSpd = (player.spd || 110) * legFactor * vehMul * rushSpdMul * (player.guardZone >= 0 ? 0.82 : 1.0);

  if (mag > 0.04) {
    const moveAng = Math.atan2(my, mx) + legImbalance * 0.28;
    const vx = Math.cos(moveAng) * effSpd * Math.min(1, mag);
    const vy = Math.sin(moveAng) * effSpd * Math.min(1, mag);
    player.vx = vx; player.vy = vy; player.moveDir = moveAng;
    player.walk += simDt * (6.5 + effSpd * 0.025);
    const targetBank = Math.max(-0.32, Math.min(0.32, (vx / Math.max(1, effSpd)) * 0.26));
    player.bankTilt = (player.bankTilt || 0) * 0.82 + targetBank * 0.18;

    const nx = player.x + vx * simDt, ny = player.y + vy * simDt;
    const ignoreLow = player.hover || player.inVehicle > 0 || [1, 16, 21, 25, 47, 54].includes(player.cid);
    if (typeof isPointBlockedByObstacle !== "function" || !isPointBlockedByObstacle(nx, player.y, ignoreLow)) player.x = nx;
    if (typeof isPointBlockedByObstacle !== "function" || !isPointBlockedByObstacle(player.x, ny, ignoreLow)) player.y = ny;

    if ([1, 16, 25, 47, 54].includes(player.cid) && Math.random() < 0.45) {
      spawnParticles(player.x - Math.cos(moveAng) * 10, player.y + 8, 1);
    }
  } else {
    player.vx = 0; player.vy = 0;
    player.bankTilt = (player.bankTilt || 0) * 0.82;
  }

  let aimTarget = -1, bestAimDist = 380;
  for (let j = 0; j < MAX_E; j++) {
    if (eAct[j] && isEnemyOnScreen(j)) {
      const d = Math.hypot(eX[j] - player.x, eY[j] - player.y);
      if (d < bestAimDist) { bestAimDist = d; aimTarget = j; }
    }
  }
  const desiredAim = aimTarget >= 0
    ? Math.atan2(eY[aimTarget] - player.y, eX[aimTarget] - player.x)
    : (typeof player.moveDir === "number" ? player.moveDir : (player.aim || 0));
  let aimDiff = desiredAim - (player.aim || 0);
  while (aimDiff > Math.PI) aimDiff -= Math.PI * 2;
  while (aimDiff < -Math.PI) aimDiff += Math.PI * 2;
  player.aim = (player.aim || 0) + aimDiff * Math.min(1, simDt * 14);

  const enabledWpns = player.weapons.filter(w => w.enabled !== false);
  const armCap = player.armCap || 2;
  if (enabledWpns.length > armCap) {
    player.swapTimer = (player.swapTimer || 0) + simDt;
    if (player.swapTimer >= 2.65) {
      player.swapTimer = 0;
      player.handSlotOffset = ((player.handSlotOffset || 0) + 1) % enabledWpns.length;
      player.swapPause = 0.24;
      sfx(1180, 440, 0.038, "triangle", 0.11);
    }
  } else player.handSlotOffset = 0;

  if (player.swapPause > 0) player.swapPause = Math.max(0, player.swapPause - simDt);

  // Hero #17 Reaver low-HP frenzy, #42 Sandevistan, and #55 Cyborg Overclock haste multipliers
  const reaverCdr = player.cid === 17 ? (1 - 0.38 * (1 - Math.max(0, player.hp / Math.max(1, player.maxHp)))) : 1.0;
  const hasteCdr = (player.overclockTimer > 0 ? 0.5 : 1.0) * (player.sandTimer > 0 ? 0.55 : 1.0) * reaverCdr;

  const activeSlots = Math.min(armCap, enabledWpns.length);
  for (let s = 0; s < activeSlots; s++) {
    const w = enabledWpns[(player.handSlotOffset + s) % enabledWpns.length];

    if (w.style === "orbit") {
      const isSwinging = (aimTarget >= 0 && bestAimDist < 135 && w.cd < 0.16) || (player.swordSwingTimer && player.swordSwingTimer > 0);
      const targetAng = player.aim + (s * 0.55) + (isSwinging ? Math.sin(runTime * 28) * 0.85 : 0);
      const curAng = typeof w.ang === "number" ? w.ang : targetAng;
      let dAng = targetAng - curAng;
      while (dAng > Math.PI) dAng -= Math.PI * 2;
      while (dAng < -Math.PI) dAng += Math.PI * 2;
      w.ang = curAng + dAng * Math.min(1, simDt * 16);
    } else {
      w.ang = player.aim + (s * 0.2);
    }

    if (player.swapPause > 0.05) continue;

    if (w.id === 52) {
      if (player.sixReloadCD > 0) {
        player.sixReloadCD -= simDt;
        if (player.sixReloadCD <= 0) { player.sixShotsLeft = 6; sfx(920, 1480, 0.045, "triangle", 0.14); }
      } else {
        player.sixBurstCD -= simDt;
        if (player.sixBurstCD <= 0) {
          fireWeapon(w); player.recoilKick = 1.0; player.sixShotsLeft--;
          player.sixReloadCD = player.sixShotsLeft <= 0 ? Math.max(0.32, 0.55 * (player.cdr || 1) * hasteCdr) : 0;
          if (player.sixShotsLeft > 0) player.sixBurstCD = Math.max(0.06, 0.12 * (player.cdr || 1) * hasteCdr);
        }
      }
    } else {
      w.cd -= simDt;
      if (w.cd <= 0) {
        const baseCD = w.style === "orbit" ? 0.36 : (w.style === "beam" ? 0.48 : (w.style === "cone" ? 0.62 : 0.52));
        w.cd = Math.max(0.06, baseCD * (player.cdr || 1) * hasteCdr * (w.lvl >= 10 ? 0.78 : 1.0));
        fireWeapon(w); player.recoilKick = 1.0;
        if (w.style === "orbit" && aimTarget >= 0 && bestAimDist < 135) {
          player.swordSwingTimer = 0.20;
          player.swordLungeTimer = 0.14;
        }
      }
    }
  }

  if (typeof updateHeroSpecials === "function") updateHeroSpecials(simDt);
  if (typeof updateWorldObjects === "function") updateWorldObjects(simDt);

  let activeEnemies = 0;
  for (let i = 0; i < MAX_E; i++) if (eAct[i]) activeEnemies++;
  const diffSpawnMul = (player.diff && typeof player.diff.spawnMul === "number")
    ? player.diff.spawnMul
    : ((player.diff && typeof player.diff.hpMul === "number") ? Math.max(0.8, Math.min(1.6, player.diff.hpMul)) : 1.0);
  const targetPop = Math.min(MAX_E - 12, Math.floor((14 + waveNum * 4.5) * diffSpawnMul));

  if (activeEnemies < 5 && runTime < 2.5) {
    spawnEnemy(false, false);
  } else if (activeEnemies < targetPop && Math.random() < (2.6 + waveNum * 0.38) * simDt) {
    spawnEnemy(false, false);
  }

  if (runTime > 120 && !player.bossSpawned) {
    player.bossSpawned = true; spawnEnemy(true, false);
    spawnSpeech(player.x, player.y - 24, "SECTOR TITAN DETECTED!", "#ff1744", 3.2);
  }
  rivalTimer += simDt;
  if (rivalTimer >= 75) { rivalTimer = 0; spawnEnemy(false, true); }

  const nearObs = typeof getNearbyObstacles === "function" ? getNearbyObstacles(player.x, player.y, 340) : [];
  const diffHpMul = (player.diff && typeof player.diff.hpMul === "number") ? player.diff.hpMul : 1.0;

  for (let i = 0; i < MAX_E; i++) {
    if (!eAct[i]) continue;
    if (eBleed[i] > 0) {
      eHP[i] -= eBleedRate[i] * simDt;
      if (Math.random() < 3.5 * simDt) spawnDrip(eX[i], eY[i] + 8, i, 2.5 + Math.random() * 1.8);
      if (eHP[i] <= 0) { killEnemy(i, false); continue; }
    }
    if (eSlow[i] > 0) eSlow[i] = Math.max(0, eSlow[i] - simDt);
    if (eStun[i] > 0) { eStun[i] = Math.max(0, eStun[i] - simDt); continue; }
    if (eGrapple[i] > 0) {
      eGrapple[i] = Math.max(0, eGrapple[i] - simDt);
      const ga = Math.atan2(player.y - eY[i], player.x - eX[i]);
      eX[i] += Math.cos(ga) * 260 * simDt; eY[i] += Math.sin(ga) * 260 * simDt;
      continue;
    }

    let goalX = player.x, goalY = player.y;
    const ldr = eFormLeader[i];
    if (eFormType[i] === 1 && ldr >= 0 && eAct[ldr]) {
      const la = Math.atan2(player.y - eY[ldr], player.x - eX[ldr]) + Math.PI * 0.5;
      goalX = eX[ldr] + Math.cos(la) * ((i & 1) ? 18 : -18);
      goalY = eY[ldr] + Math.sin(la) * ((i & 1) ? 18 : -18);
    } else if (eFormType[i] === 2 && ldr >= 0 && eAct[ldr]) {
      const la = Math.atan2(player.y - eY[ldr], player.x - eX[ldr]) + ((i & 1) ? 0.95 : -0.95);
      goalX = player.x + Math.cos(la) * 42; goalY = player.y + Math.sin(la) * 42;
    }

    const baseAng = Math.atan2(goalY - eY[i], goalX - eX[i]);
    const patAng = ChaosMath.movePattern(eMoveStyle[i], baseAng, runTime, eSeed[i]);
    const steered = ChaosMath.steerAround(eX[i], eY[i], eX[i] + Math.cos(patAng) * 60, eY[i] + Math.sin(patAng) * 60, nearObs, 0.95, eSeed[i]);
    const legPenalty = eLegsLost[i] >= 2 ? 0.28 : (eLegsLost[i] === 1 ? 0.58 : 1.0);
    const spd = eSpd[i] * legPenalty * (eSlow[i] > 0 ? Math.max(0.25, 1 - (player.slow || 0)) : 1.0) * ChaosMath.moveSpeedMul(eMoveStyle[i], runTime, eSeed[i]);

    eVX[i] = steered.vx * spd; eVY[i] = steered.vy * spd;
    eX[i] += eVX[i] * simDt; eY[i] += eVY[i] * simDt;

    const distP = Math.hypot(player.x - eX[i], player.y - eY[i]);
    if ((eType[i] === 3 || eType[i] >= 98) && distP < 275 && eArmsLost[i] < 2) {
      eFireCD[i] -= simDt;
      if (eFireCD[i] <= 0) {
        eFireCD[i] = eType[i] >= 98 ? 1.15 : 2.35;
        const fa = Math.atan2(player.y - eY[i], player.x - eX[i]);
        spawnProj(eX[i], eY[i], Math.cos(fa) * 215, Math.sin(fa) * 215, 11 * diffHpMul, 1.8, 5, 0, 4, 0, 1, eRivalCid[i] >= 0 ? eRivalCid[i] : 2);
      }
    }

    if (distP < (eType[i] === 99 ? 26 : 16)) {
      // Hero #30 Acid-Blood Xeno-Queen: Enemies touching you take 80 Thorns Dmg
      if (player.cid === 30) {
        const acidDmg = 80 * simDt * 3.0;
        eHP[i] -= acidDmg;
        if (Math.random() < 0.25) spawnDmg(eX[i], eY[i], acidDmg, false);
        if (eHP[i] <= 0) { killEnemy(i, false); continue; }
      }
      // Hero #47 Chozo Morph Hunter: Screw-Attack Thrusters Contact Dash Damage
      if (player.cid === 47 && mag > 0.2) {
        const screwDmg = 65 * (player.might || 1) * simDt * 3.0;
        eHP[i] -= screwDmg;
        if (eHP[i] <= 0) { killEnemy(i, false); continue; }
      }

      if (player.dodge > 0 && Math.random() < Math.min(0.65, player.dodge)) {
        spawnSpeech(player.x, player.y - 12, "EVADED!", "#00e5ff", 0.55);
      } else {
        // Hero #23 Hive-Cube Assimilator: Taking damage grants +5 Armor for 5s
        if (player.cid === 23) player.adaptTimer = 5.0;
        // Hero #50 Kenshi-Moon Ronin: Every hit taken grants +Max HP, +Might & bonus Toughness XP
        if (player.cid === 50) {
          player.maxHp += 2.0 * simDt * 3.2;
          player.might += 0.02 * simDt * 3.2;
          player.xp += 1.5 * simDt * (player.greed || 1);
        }

        const hitZone = Math.random() < 0.16 ? 0 : (Math.random() < 0.45 ? 1 : (2 + Math.floor(Math.random() * 4)));
        let rawDmg = (eType[i] === 99 ? 24 : 9) * simDt * 3.2;
        if (player.guardZone === hitZone) rawDmg *= (player.cid === 51 || player.cid === 40) ? 0.05 : 0.25;
        if (player.cid === 1) rawDmg *= 0.80; // Beskar Creed Tracker -20% Damage Taken
        const effArmor = (player.armor || 0) + (player.adaptTimer > 0 ? 5 : 0);
        const netDmg = Math.max(0.4, rawDmg * (100 / (100 + effArmor * 8)));

        if (player.inVehicle > 0) {
          player.vehicleHp -= netDmg;
          if (player.vehicleHp <= 0) { player.inVehicle = 0; spawnBlastWave(player.x, player.y, 75, "#00e5ff"); sfx(120, 45, 0.25); }
        } else {
          player.hp -= netDmg;
          player.limbs[hitZone] = Math.max(15, player.limbs[hitZone] - netDmg * 0.85);
          player.xp += netDmg * 0.18 * (player.greed || 1);
        }
        if (player.hp <= 0) {
          if (player.revives > 0) {
            player.revives--; player.hp = player.maxHp * 0.6; player.limbs.fill(100);
            // Hero #46 Gallifrey Sonic Traveler: Revivals boost all stats +20%
            if (player.cid === 46) {
              player.might *= 1.20; player.spd *= 1.20; player.area *= 1.20;
            }
            spawnBlastWave(player.x, player.y, 130, "#ffd166");
            spawnSpeech(player.x, player.y, "SECOND WIND REVIVAL!", "#ffd166", 2.4);
            sfx(220, 880, 0.35, "triangle");
          } else {
            meta.dmEarned += Math.max(1, Math.floor(player.kills / 18) + (player.dmRun || 0));
            saveMeta(); purgeRunMemory();
            document.getElementById("hud").classList.remove("active");
            showScreen("scrMain"); return;
          }
        }
      }
    }
  }

  for (let i = 0; i < MAX_P; i++) {
    if (!pAct[i]) continue;
    pLife[i] -= simDt;
    if (pLife[i] <= 0) {
      if (pStyle[i] === 2) triggerRocketDetonation(pX[i], pY[i], pDmg[i], pRad[i] * 4.8);
      pAct[i] = 0; continue;
    }

    if (pStyle[i] === 1) {
      pVX[i] += simDt * 5.2;
      pX[i] = player.x + Math.cos(pVX[i]) * pVY[i];
      pY[i] = player.y + Math.sin(pVX[i]) * pVY[i];
    } else if (pStyle[i] === 6) {
      pX[i] = player.x; pY[i] = player.y;
    } else {
      if (pStyle[i] === 2 && !pEnemy[i]) {
        let best = -1, bestScore = -1;
        for (let j = 0; j < MAX_E; j++) {
          if (eAct[j] && isEnemyOnScreen(j)) {
            const d = Math.hypot(eX[j] - pX[i], eY[j] - pY[i]);
            if (d < 340) {
              const score = eHP[j] * (eType[j] >= 98 ? 4 : 1) / (1 + d * 0.01);
              if (score > bestScore) { bestScore = score; best = j; }
            }
          }
        }
        const curSpd = Math.min(440, Math.hypot(pVX[i], pVY[i]) * (1 + 1.85 * simDt));
        let curAng = Math.atan2(pVY[i], pVX[i]);
        if (best >= 0) {
          let diff = Math.atan2(eY[best] - pY[i], eX[best] - pX[i]) - curAng;
          while (diff > Math.PI) diff -= Math.PI * 2;
          while (diff < -Math.PI) diff += Math.PI * 2;
          curAng += Math.max(-4.5 * simDt, Math.min(4.5 * simDt, diff));
        }
        pVX[i] = Math.cos(curAng) * curSpd; pVY[i] = Math.sin(curAng) * curSpd;
        if (Math.random() < 0.75) spawnParticles(pX[i] - Math.cos(curAng) * 8, pY[i] - Math.sin(curAng) * 8, 1);
      }
      pX[i] += pVX[i] * simDt; pY[i] += pVY[i] * simDt;
    }

    if (pEnemy[i]) {
      const dp = Math.hypot(pX[i] - player.x, pY[i] - player.y);
      if (dp < 38 && !pSnap[i]) { pSnap[i] = 1; if (typeof sfxSnap === "function") sfxSnap(); }

      // Relic #00 Goa'uld Personal Repulsor: Kinetic hand-shield stops & vaporizes enemy projectiles
      if (player.hasRepulsor && dp < 30) {
        pAct[i] = 0;
        spawnParticles(pX[i], pY[i], 3);
        sfx(680, 1220, 0.04, "sine", 0.12);
        continue;
      }

      if (player.hasSaber && dp < 28 && Math.random() < (0.25 + (player.saberMastery / 100) * 0.68)) {
        pEnemy[i] = 0; pVX[i] = -pVX[i] * 1.45; pVY[i] = -pVY[i] * 1.45;
        pDmg[i] = (32 + player.lvl * 9) * (player.might || 1); pSup[i] = 2; pLife[i] = 0.95;
        player.swordSwingTimer = 0.18; player.saberMastery = Math.min(100, player.saberMastery + 0.35);
        if (typeof sfxRicochet === "function") sfxRicochet();
        continue;
      }
      if (dp < 14) {
        const effArmor = (player.armor || 0) + (player.adaptTimer > 0 ? 5 : 0);
        player.hp -= Math.max(1, pDmg[i] * (100 / (100 + effArmor * 8)));
        pAct[i] = 0; spawnParticles(player.x, player.y, 3);
      }
      continue;
    }

    hitTestPlayerProj(i);
  }

  let leveledUp = false;
  for (let i = 0; i < MAX_O; i++) {
    if (!oAct[i]) continue;
    const d = Math.hypot(player.x - oX[i], player.y - oY[i]);
    if (d < player.mag || oHome[i]) {
      oHome[i] = 1;
      const pullSpd = 340 + (player.mag * 0.8);
      const a = Math.atan2(player.y - oY[i], player.x - oX[i]);
      oX[i] += Math.cos(a) * pullSpd * simDt; oY[i] += Math.sin(a) * pullSpd * simDt;
      if (d < 18) {
        oAct[i] = 0; player.xp += oVal[i] * (player.greed || 1);
        sfx(580, 880, 0.035, "sine", 0.08);
        if (player.xp >= player.nextXp) {
          player.xp -= player.nextXp; player.lvl++;
          player.nextXp = Math.floor(player.nextXp * 1.24 + 8);
          leveledUp = true;
        }
      }
    }
  }
  if (leveledUp) {
    if (typeof updateHUD === "function") updateHUD();
    if (typeof triggerLevelUp === "function") triggerLevelUp();
  }

  // Real-time Interact Button & HUD Sync
  player.hudSyncTimer = (player.hudSyncTimer || 0) + rawDt;
  const curInteract = (typeof findInteractTarget === "function" && findInteractTarget()) ? 1 : 0;
  if (curInteract !== (player.lastInteractFlag || 0) || player.hudSyncTimer >= 0.18) {
    player.lastInteractFlag = curInteract;
    player.hudSyncTimer = 0;
    if (typeof updateHUD === "function") updateHUD();
  }

  for (let i = 0; i < MAX_D; i++) if (dAct[i]) { dY[i] -= 18 * simDt; dLife[i] -= simDt; if (dLife[i] <= 0) dAct[i] = 0; }
  for (let i = 0; i < MAX_PT; i++) if (ptAct[i]) { ptX[i] += ptVX[i] * simDt; ptY[i] += ptVY[i] * simDt; ptLife[i] -= simDt; if (ptLife[i] <= 0) ptAct[i] = 0; }
  for (let i = 0; i < MAX_DRIP; i++) if (drAct[i]) { if (drZ[i] > 0) drZ[i] = Math.max(0, drZ[i] - 18 * simDt); drLife[i] -= simDt; if (drLife[i] <= 0) drAct[i] = 0; }
  for (let i = 0; i < MAX_BLAST; i++) if (blAct[i]) {
    blLife[i] -= simDt;
    blRad[i] = 6 + (blMaxR[i] - 6) * (1 - Math.max(0, blLife[i] / 0.38));
    if (blLife[i] <= 0) blAct[i] = 0;
  }

  let cCnt = 0;
  for (let i = 0; i < MAX_CORPSE; i++) if (corpAct[i]) cCnt++;
  activeCorpseCount = cCnt;
  const maxPersist = opts.persistCount || 100;
  if (cCnt > maxPersist) {
    let toRemove = cCnt - maxPersist;
    for (let i = 0; i < MAX_CORPSE && toRemove > 0; i++) if (corpAct[i]) { corpAct[i] = 0; toRemove--; }
  }

  frameMs = +(performance.now() - t0).toFixed(1);
}
// EOF:js/sim.js
