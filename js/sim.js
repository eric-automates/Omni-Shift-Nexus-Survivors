// FILE: js/sim.js
// PART: 12 of 14
// DETAIL: Main simulation tick, Temporal Nexus scaling, solid obstacle projectile blocking, Goa'uld Repulsor shield, and Wave Mutation/Steering AI.

"use strict";

/* === 1. MAIN SIMULATION TICK (Routed Through Temporal Nexus timeScale) === */
function updateSim(rawDt) {
  if (!runActive || runPaused || !player) return;
  const simDt = rawDt * timeScale;
  runTime += simDt;
  waveNum = 1 + Math.floor(runTime / 20);
  rivalTimer += simDt;
  ambTimer += rawDt;

  if (flameVisTimer > 0) flameVisTimer = Math.max(0, flameVisTimer - simDt);
  if (opts.amb && ambTimer > 2.8) {
    ambTimer = 0;
    sfx(65, 52, 0.35, "sine", 0.06);
  }

  // Timed Hero Passives (#42 Sandevistan, #43 VATS, #23 Borg, #10 Othala)
  if (player.adaptTimer > 0) player.adaptTimer -= simDt;
  if (player.phaseTimer > 0) player.phaseTimer -= simDt;
  if (player.cid === 42) player.sandTimer = (player.sandTimer + simDt) % 6;
  if (player.cid === 43) player.vatsTimer = (player.vatsTimer + simDt) % 4;
  updateHeroSpecials(simDt);

  const sandMul = (player.cid === 42 && player.sandTimer < 1.8) ? 1.8 : 1.0;
  const vehMul = player.inVehicle ? (2.1 * player.vehBoostMul) : 1.0;

  player.hp = Math.min(player.maxHp, player.hp + player.regen * simDt);
  player.x += joy.dx * player.spd * sandMul * vehMul * simDt;
  player.y += joy.dy * player.spd * sandMul * vehMul * simDt;
  if (Math.hypot(joy.dx, joy.dy) > 0.1) {
    player.walk += simDt * 12;
    player.aim = Math.atan2(joy.dy, joy.dx);
  }

  // Chunk Props Collision, Loot Pods & Floor Hazards
  const pcx = Math.floor(player.x / 512), pcy = Math.floor(player.y / 512);
  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      const props = getChunkProps(pcx + dx, pcy + dy);
      for (let k = 0; k < props.length; k++) {
        const pr = props[k];
        const dist = Math.hypot(player.x - pr.x, player.y - pr.y);
        if (pr.type === 3 && dist < 28) {
          const prev = runChunkDeltas.get(pr.key) || 0;
          runChunkDeltas.set(pr.key, prev | (1 << pr.i));
          player.hp = Math.min(player.maxHp, player.hp + 20);
          spawnOrb(pr.x, pr.y, 10);
          spawnParticles(pr.x, pr.y, 8);
          sfx(520, 960, 0.1, "sine");
        } else if (pr.type === 4 && dist < 32 && !player.hazImmune && !player.hover && !player.inVehicle) {
          player.hp -= 8 * player.diff.dmgMul * simDt;
        } else if ((pr.type === 0 || pr.type === 1 || pr.type === 5 || pr.type === 7) && dist < pr.rad + 10 && !player.hover) {
          const a = Math.atan2(player.y - pr.y, player.x - pr.x);
          player.x = pr.x + Math.cos(a) * (pr.rad + 10);
          player.y = pr.y + Math.sin(a) * (pr.rad + 10);
        }
      }
    }
  }

  // Enemy, Sector Boss (45s) & Rival Bounty Hunter (75s) Spawners
  if (Math.random() < simDt * (3.8 + waveNum * 0.25)) spawnEnemy(false, false);
  if (runTime >= 45 && !player.bossSpawned) {
    player.bossSpawned = true;
    spawnEnemy(true, false);
  }
  if (rivalTimer >= 75) {
    rivalTimer = 0;
    spawnEnemy(false, true);
  }

  // Weapon Firing & #52 The Man With No Name 6-Shot Blazing Burst + 0.55s Quick-Reload
  const reaverRate = player.cid === 17 ? (1 - 0.5 * (1 - player.hp / player.maxHp)) : 1;
  player.weapons.forEach(w => {
    w.ang += simDt * (w.lvl >= 10 ? 5.5 : 3.2);
    if (w.id === 52) {
      const maxCyl = w.lvl >= 10 ? 8 : 6;
      if (player.sixReloadCD > 0) {
        player.sixReloadCD -= simDt;
        if (player.sixReloadCD <= 0) player.sixShotsLeft = maxCyl;
      } else {
        player.sixBurstCD -= simDt * sandMul;
        if (player.sixBurstCD <= 0) {
          fireWeapon(w);
          player.sixShotsLeft--;
          if (player.sixShotsLeft <= 0) {
            player.sixReloadCD = 0.55 * player.cdr;
            spawnSpeech(player.x, player.y, "QUICK-RELOAD!", "#ffd166", 0.55);
          } else {
            player.sixBurstCD = 0.075;
          }
        }
      }
    } else {
      w.cd -= simDt * sandMul;
      if (w.cd <= 0) {
        w.cd = Math.max(0.12, (0.80 - w.lvl * 0.045) * player.cdr * reaverRate);
        fireWeapon(w);
      }
    }
  });

  updateProjectiles(simDt);
  updateEnemies(simDt);

  // Orbs, Floating Damage/Speech & Particles
  for (let i = 0; i < MAX_O; i++) {
    if (!oAct[i]) continue;
    const d = Math.hypot(player.x - oX[i], player.y - oY[i]);
    if (d < player.mag) {
      const a = Math.atan2(player.y - oY[i], player.x - oX[i]);
      oX[i] += Math.cos(a) * 320 * simDt;
      oY[i] += Math.sin(a) * 320 * simDt;
      if (d < 18) {
        oAct[i] = 0;
        player.xp += oVal[i] * player.greed;
        sfx(500 + player.lvl * 12, 760 + player.lvl * 12, 0.035, "sine", 0.12);
        if (player.xp >= player.nextXp) {
          player.xp -= player.nextXp;
          player.lvl++;
          player.nextXp = Math.floor(player.nextXp * 1.25 + 6);
          triggerLevelUp();
        }
      }
    }
  }
  for (let i = 0; i < MAX_D; i++) {
    if (dAct[i]) { dY[i] -= 24 * simDt; dLife[i] -= simDt; if (dLife[i] <= 0) dAct[i] = 0; }
  }
  for (let i = 0; i < MAX_PT; i++) {
    if (ptAct[i]) { ptX[i] += ptVX[i] * simDt; ptY[i] += ptVY[i] * simDt; ptLife[i] -= simDt; if (ptLife[i] <= 0) ptAct[i] = 0; }
  }
  updateHUD();
}

/* === 2. PROJECTILE PHYSICS, SOLID WALL BLOCKING & GOA'ULD REPULSOR === */
function updateProjectiles(simDt) {
  for (let i = 0; i < MAX_P; i++) {
    if (!pAct[i]) continue;
    pLife[i] -= simDt;
    if (pLife[i] <= 0) { pAct[i] = 0; continue; }

    // Enemy / Rival Projectiles (pEnemy === 1)
    if (pEnemy[i] === 1) {
      pX[i] += pVX[i] * simDt;
      pY[i] += pVY[i] * simDt;
      // #00 Goa'uld Personal Repulsor stops incoming enemy missiles
      if (player.hasRepulsor && Math.hypot(pX[i] - player.x, pY[i] - player.y) < 58) {
        pAct[i] = 0;
        spawnParticles(pX[i], pY[i], 4);
        sfx(680, 920, 0.04, "sine", 0.1);
        continue;
      }
      if (isPointBlockedByObstacle(pX[i], pY[i], false)) {
        pAct[i] = 0;
        spawnParticles(pX[i], pY[i], 3);
        continue;
      }
      if (Math.hypot(pX[i] - player.x, pY[i] - player.y) < 16) {
        pAct[i] = 0;
        const dmg = Math.max(2, pDmg[i] - player.armor);
        if (player.inVehicle) {
          player.vehicleHp -= dmg;
          if (player.vehicleHp <= 0) player.inVehicle = false;
        } else {
          player.hp -= dmg;
        }
        spawnDmg(player.x, player.y, dmg, false);
      }
      continue;
    }

    // Player Projectiles (pEnemy === 0)
    if (pStyle[i] === 1) {
      pVX[i] += simDt * (pSup[i] ? 6 : 3.5);
      pX[i] = player.x + Math.cos(pVX[i]) * pVY[i];
      pY[i] = player.y + Math.sin(pVX[i]) * pVY[i];
    } else if (pStyle[i] === 2) {
      let bx = 0, by = 0, bd = 260;
      for (let j = 0; j < MAX_E; j++) {
        if (eAct[j]) {
          const d = Math.hypot(eX[j] - pX[i], eY[j] - pY[i]);
          if (d < bd) { bd = d; bx = eX[j]; by = eY[j]; }
        }
      }
      if (bd < 260) {
        const ta = Math.atan2(by - pY[i], bx - pX[i]);
        const spd = Math.hypot(pVX[i], pVY[i]);
        pVX[i] = pVX[i] * 0.88 + Math.cos(ta) * spd * 0.12;
        pVY[i] = pVY[i] * 0.88 + Math.sin(ta) * spd * 0.12;
      }
      pX[i] += pVX[i] * simDt;
      pY[i] += pVY[i] * simDt;
    } else if (pStyle[i] !== 6) {
      pX[i] += pVX[i] * simDt;
      pY[i] += pVY[i] * simDt;
    }

    // Solid obstacles stop projectiles (ignoreForts=true lets player shoot over Last-Stand Forts)
    if (pStyle[i] !== 1 && pStyle[i] !== 6 && isPointBlockedByObstacle(pX[i], pY[i], true)) {
      pAct[i] = 0;
      spawnParticles(pX[i], pY[i], 3);
      continue;
    }

    for (let j = 0; j < MAX_E; j++) {
      if (!eAct[j]) continue;
      const hitR = pRad[i] + (eType[j] >= 98 ? 22 : 13);
      if (Math.hypot(pX[i] - eX[j], pY[i] - eY[j]) < hitR) {
        const isCrit = (player.cid === 43 && player.vatsTimer < 0.8) || (Math.random() < player.crit);
        const bossBoost = eType[j] >= 98 ? player.bossMul : 1;
        const finalDmg = pDmg[i] * (isCrit ? player.cdmg : 1) * bossBoost * (1 + eShred[j]);

        eHP[j] -= finalDmg;
        if (player.slow > 0) eSlow[j] = Math.min(0.65, player.slow);
        if (player.shred > 0) eShred[j] += player.shred * 0.25;

        if (pStyle[i] !== 6 && eGrapple[j] <= 0) {
          const ka = Math.atan2(eY[j] - player.y, eX[j] - player.x);
          eX[j] += Math.cos(ka) * 8 * player.kb;
          eY[j] += Math.sin(ka) * 8 * player.kb;
        }
        spawnDmg(eX[j], eY[j], finalDmg, isCrit);
        spawnParticles(eX[j], eY[j], 3);

        if (pPrc[i] > 0) pPrc[i]--;
        else pAct[i] = 0;

        if (eHP[j] <= 0) handleEnemyDeath(j);
        if (!pAct[i]) break;
      }
    }
  }
}

function handleEnemyDeath(j) {
  eAct[j] = 0;
  player.kills++;
  if (player.cid === 3 && player.kills % 15 === 0) player.hp = Math.min(player.maxHp, player.hp + 1);
  if (player.cid === 11 && player.kills % 10 === 0) player.hp = Math.min(player.maxHp, player.hp + 3);
  if (player.cid === 33 && Math.hypot(eX[j] - player.x, eY[j] - player.y) < 95) player.hp = Math.min(player.maxHp, player.hp + 1.5);

  spawnOrb(eX[j], eY[j], eType[j] >= 98 ? 50 : 3.5);
  sfx(170, 55, 0.04, "square", 0.12);

  if (eType[j] >= 98) {
    const dmGain = Math.ceil(player.stg.dmDrop * (1 + player.dmRun) * player.diff.dropMul);
    meta.dmEarned += dmGain;
    const nxtStg = Math.min(50, player.stg.id + 1);
    if (!meta.stages.includes(nxtStg)) meta.stages.push(nxtStg);
    saveMeta();
    grantRelic();
    spawnSpeech(player.x, player.y - 22, '"' + getBossQuote(player.cid, player.fac.id) + '"', "#ffd166", 3.2);
    if (opts.flash) flashAlpha = 0.65;
    sfx(260, 880, 0.35, "triangle", 0.3);
    if (eType[j] === 99) { player.bossSpawned = false; runTime = 0; }
  }
}

/* === 3. ENEMY WAVE AI: OBSTACLE STUN, TANGENT STEERING & CQC EXECUTE === */
function updateEnemies(simDt) {
  for (let i = 0; i < MAX_E; i++) {
    if (!eAct[i]) continue;

    // Claymore Mine Detonation Check
    for (let m = activeMines.length - 1; m >= 0; m--) {
      if (Math.hypot(eX[i] - activeMines[m].x, eY[i] - activeMines[m].y) < 26) {
        const mn = activeMines[m];
        activeMines.splice(m, 1);
        eHP[i] -= mn.dmg;
        eStun[i] = 2.0;
        spawnDmg(eX[i], eY[i], mn.dmg, true);
        spawnParticles(mn.x, mn.y, 12);
        sfx(120, 45, 0.18, "sawtooth");
        if (eHP[i] <= 0) { handleEnemyDeath(i); break; }
      }
    }
    if (!eAct[i]) continue;

    if (eGrapple[i] > 0) {
      eGrapple[i] -= simDt * (eType[i] >= 98 ? 1.4 : 1.0);
      eHP[i] -= 22 * player.might * simDt;
      if (eHP[i] <= 0) { handleEnemyDeath(i); continue; }
      continue;
    }
    if (eStun[i] > 0) {
      eStun[i] = Math.max(0, eStun[i] - simDt);
      continue;
    }

    const baseAng = Math.atan2(player.y - eY[i], player.x - eX[i]);
    const patAng = ChaosMath.movePattern(eMoveStyle[i], baseAng, runTime, eSeed[i]);
    const patSpd = ChaosMath.moveSpeedMul(eMoveStyle[i], runTime, eSeed[i]);
    const curSpd = eSpd[i] * patSpd * (1 - eSlow[i]) * (player.cid === 49 ? 0.75 : 1);
    const nearObs = getNearbySolidObstacles(eX[i], eY[i], 70, false);

    if (eWave[i] >= 3 || eType[i] >= 98) {
      const st = ChaosMath.steerAround(eX[i], eY[i], player.x, player.y, nearObs, 1.15, eSeed[i]);
      eX[i] += st.vx * curSpd * simDt;
      eY[i] += st.vy * curSpd * simDt;
    } else {
      eX[i] += Math.cos(patAng) * curSpd * simDt;
      eY[i] += Math.sin(patAng) * curSpd * simDt;
    }

    // Obstacle collision: low-wave enemies bounce back & get stunned; forts block all enemies
    for (let k = 0; k < nearObs.length; k++) {
      const ob = nearObs[k];
      const od = Math.hypot(eX[i] - ob.x, eY[i] - ob.y);
      if (od < ob.rad + 11) {
        const pushA = Math.atan2(eY[i] - ob.y, eX[i] - ob.x);
        if (eWave[i] <= 2 && !ob.isFort && eType[i] < 98) {
          eX[i] = ob.x + Math.cos(pushA) * (ob.rad + 22);
          eY[i] = ob.y + Math.sin(pushA) * (ob.rad + 22);
          eStun[i] = 1.25;
        } else {
          eX[i] = ob.x + Math.cos(pushA) * (ob.rad + 12);
          eY[i] = ob.y + Math.sin(pushA) * (ob.rad + 12);
        }
      }
    }

    // Rival Bounty Hunters & Wave 4+ Ranged Mutants fire enemy projectiles
    if (eType[i] === 98 || (eWave[i] >= 4 && i % 6 === 0)) {
      eFireCD[i] -= simDt;
      if (eFireCD[i] <= 0 && Math.hypot(player.x - eX[i], player.y - eY[i]) < 290) {
        eFireCD[i] = eType[i] === 98 ? 1.15 : 2.6;
        const fa = Math.atan2(player.y - eY[i], player.x - eX[i]);
        spawnProj(eX[i], eY[i], Math.cos(fa) * 210, Math.sin(fa) * 210, 12 * player.diff.dmgMul, 1.8, 6, 0, 2, 0, 1);
      }
    }

    // Player Contact: #51 Baba Yaga CQC Grapple-Flip-Execute, Vehicle Ramming & Damage
    if (Math.hypot(player.x - eX[i], player.y - eY[i]) < (eType[i] >= 98 ? 26 : 18)) {
      if (player.cid === 51 && player.cqcCD <= 0) {
        player.cqcCD = 0.85;
        const flipA = Math.random() * Math.PI * 2;
        eX[i] = player.x + Math.cos(flipA) * 44;
        eY[i] = player.y + Math.sin(flipA) * 44;
        eStun[i] = 2.4;
        const exDmg = eType[i] >= 98 ? Math.max(240 * player.might, eMax[i] * 0.34) : eHP[i] + 999;
        eHP[i] -= exDmg;
        spawnDmg(eX[i], eY[i], exDmg, true);
        spawnSpeech(player.x, player.y, "CQC FLIP & EXECUTE!", "#ffd166", 1.1);
        sfx(780, 140, 0.1, "square");
        if (eHP[i] <= 0) handleEnemyDeath(i);
        continue;
      }
      if (player.inVehicle) {
        const ramDmg = 95 * player.might * player.vehBoostMul * simDt * 8;
        eHP[i] -= ramDmg;
        player.vehicleHp -= 10 * simDt;
        if (player.vehicleHp <= 0) player.inVehicle = false;
        if (eHP[i] <= 0) handleEnemyDeath(i);
        continue;
      }
      if (player.cid === 47 || player.cid === 30) eHP[i] -= (player.cid === 30 ? 80 : 45) * simDt;
      if (Math.random() < player.dodge * simDt * 2) continue;
      if (player.cid === 10 && player.phaseTimer <= 0) {
        player.phaseTimer = 8;
        player.x += (Math.random() - 0.5) * 160;
        player.y += (Math.random() - 0.5) * 160;
        continue;
      }
      const effArm = player.armor + (player.adaptTimer > 0 ? 5 : 0);
      const dmg = Math.max(1, 14 * player.diff.dmgMul - effArm) * (player.cid === 1 ? 0.8 : 1) * simDt;
      player.hp -= dmg;
      if (player.cid === 23) player.adaptTimer = 5;
      if (player.cid === 50) { player.maxHp += 10 * simDt; player.might += 0.1 * simDt; }

      if (player.hp <= 0) {
        if (player.revives > 0) {
          player.revives--;
          player.hp = player.maxHp * (player.cid === 46 ? 1.0 : 0.5);
          if (player.cid === 46) { player.might *= 1.2; player.spd *= 1.15; }
          if (opts.flash) flashAlpha = 0.8;
          spawnProj(player.x, player.y, 0, 0, 250 * player.might, 0.5, 160, 99, 6, 1, 0);
          sfx(220, 880, 0.3, "sawtooth", 0.3);
        } else {
          purgeRunMemory();
          document.getElementById("hud").classList.remove("active");
          showScreen("scrMain");
          break;
        }
      }
    }
  }
}
