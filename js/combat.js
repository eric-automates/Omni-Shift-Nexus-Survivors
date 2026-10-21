// FILE: js/combat.js
// PART: 11 of 14
// DETAIL: Run initialization, Innate Force Orb Vacuum setup, 55-Hero weapons & Lv.10 Supercharges, Utility skills, and Alignment/Matchup Rival Invasions.

"use strict";

/* === 1. PLAYER RUN INITIALIZATION & HERO PASSIVES === */
function startRun() {
  purgeRunMemory();
  const c = CHAR_RAW[meta.selChar] || CHAR_RAW[0];
  const stg = STAGES[meta.selStage - 1] || STAGES[0];
  const diff = DIFFICULTIES[meta.diff] || DIFFICULTIES[1];
  const r = meta.ranks;
  const cid = c[0];

  runSeed = (Date.now() & 0xfffffff) ^ (meta.selStage * 997);
  runActive = true;
  runPaused = false;
  runTime = 0;
  if (typeof totalRunTime !== "undefined") totalRunTime = 0;
  if (typeof orbWarpTimer !== "undefined") orbWarpTimer = 0;
  waveNum = 1;
  rivalTimer = 0;

  const innateVac = (typeof hasInnateVacuum === "function" && hasInnateVacuum(cid)) ? 1.0 : 0.0;

  player = {
    x: 256, y: 256, aim: 0, walk: 0,
    hp: 100, maxHp: 100 * (1 + r[2] * 0.15) * diff.plrHp,
    might: 1 + r[0] * 0.10, armor: r[1],
    regen: r[3] * 0.6, cdr: 1 - r[4] * 0.06, area: 1 + r[5] * 0.12,
    spd: 145 * (1 + r[6] * 0.08), mag: 90 * (1 + r[7] * 0.25),
    crit: 0.08 + r[8] * 0.05, cdmg: 1.6,
    greed: (1 + r[9] * 0.20) * diff.xpMul,
    projCnt: 0, projSpd: 1.0, dur: 1.0, pierce: 0,
    kb: 1.0, slow: 0, shred: 0, revives: 0, dodge: 0,
    hover: false, hazImmune: false, bossMul: 1.0,
    adaptTimer: 0, sandTimer: 0, vatsTimer: 0, phaseTimer: 0,
    cqcCD: 0, autoFlameCD: 0,
    sixShotsLeft: 6, sixBurstCD: 0, sixReloadCD: 0,
    fortAnchorX: 256, fortAnchorY: 256, fortTimer: 0, fortFastMul: 1.0,
    inVehicle: false, vehicleHp: 0, vehBoostMul: 1.0, carryingBarricade: false,
    hasRepulsor: false, utilCdrMul: 1.0,
    orbVacuumRate: innateVac,
    maxRelics: ([7, 10, 35].includes(cid)) ? 4 : 3,
    relics: [],
    utils: getHeroUtils(cid),
    xp: 0, nextXp: 10, lvl: 1, kills: 0, dmRun: 0, bossSpawned: false,
    fac: FACTIONS[c[1]], hero: c, cid, stg, diff,
    weapons: [{ id: cid, name: c[4], superName: c[5], style: c[6], lvl: 1, cd: 0, ang: 0 }],
    passives: []
  };

  if (cid === 0) { player.spd *= 1.15; player.mag *= 1.25; }
  if (cid === 1) { player.armor += 4; }
  if (cid === 2) { player.cdr *= 0.74; player.projCnt += 1; }
  if (cid === 3) { player.cdmg += 0.35; }
  if (cid === 4) { player.cdr *= 0.82; }
  if (cid === 5) { player.maxHp *= 1.3; player.area *= 1.2; }
  if (cid === 6) { player.crit += 0.3; player.greed += 0.25; }
  if (cid === 7) { player.might += 0.25; player.revives += 1; }
  if (cid === 8) { player.projSpd += 0.25; player.cdr *= 0.88; }
  if (cid === 9) { player.regen += 2.0; player.maxHp *= 1.2; }
  if (cid === 11) { player.slow += 0.25; }
  if (cid === 12) { player.area *= 1.35; player.dur += 0.25; }
  if (cid === 13) { player.spd *= 1.2; }
  if (cid === 14) { player.dodge += 0.30; player.crit += 0.25; }
  if (cid === 15) { player.might += 0.3; player.armor += 3; }
  if (cid === 16) { player.spd *= 1.35; player.hazImmune = true; }
  if (cid === 18) { player.dodge += 0.25; player.mag *= 1.3; }
  if (cid === 19) { player.cdmg += 0.3; player.pierce += 2; }
  if (cid === 20) { player.hazImmune = true; player.cdr *= 0.85; }
  if (cid === 21) { player.hover = true; player.hazImmune = true; player.greed += 0.4; }
  if (cid === 22) { player.revives += 1; }
  if (cid === 25) { player.spd *= 1.25; player.projCnt += 1; }
  if (cid === 26) { player.revives += 1; player.projSpd += 0.25; }
  if (cid === 27) { player.maxHp *= 1.35; player.kb += 0.25; }
  if (cid === 28) { player.crit += 0.35; player.cdr *= 0.82; }
  if (cid === 29) { player.dodge += 0.25; player.cdmg += 0.4; }
  if (cid === 31) { player.cdr *= 0.82; player.area *= 1.25; }
  if (cid === 32) { player.regen += 2.5; player.area *= 1.3; }
  if (cid === 34) { player.armor += 6; player.might += 0.2; }
  if (cid === 35) { player.projCnt += 2; player.mag *= 1.25; }
  if (cid === 36) { player.regen += 2.5; player.revives += 1; }
  if (cid === 37) { player.projCnt += 2; player.spd *= 1.2; }
  if (cid === 38) { player.crit += 0.25; player.cdmg += 0.3; }
  if (cid === 39) { player.dodge += 0.35; player.cdr *= 0.8; }
  if (cid === 40) { player.maxHp *= 1.5; player.armor += 6; }
  if (cid === 41) { player.bossMul = 1.5; player.crit += 0.2; }
  if (cid === 44) { player.spd *= 1.35; player.area *= 1.25; }
  if (cid === 45) { player.armor += 5; player.hazImmune = true; }
  if (cid === 46) { player.revives += 2; }
  if (cid === 47) { player.spd *= 1.25; }
  if (cid === 48) { player.regen += 2.0; player.crit += 0.25; }
  if (cid === 49) { player.slow += 0.35; player.area *= 1.25; }
  if (cid === 51) { player.crit += 0.30; player.dodge += 0.20; player.spd *= 1.15; }
  if (cid === 52) { player.crit += 0.45; player.cdmg += 0.65; player.projSpd += 0.40; }
  if (cid === 53) { player.maxHp *= 1.35; player.armor += 4; player.might += 0.20; }
  if (cid === 54) { player.armor += 5; player.bossMul = 1.35; player.crit += 0.20; }

  player.hp = player.maxHp;
  showScreen(null);
  document.getElementById("hud").classList.add("active");
  document.getElementById("hud").classList.toggle("flip", opts.hudFlip);
  updateHUD();
  sfx(220, 660, 0.18, "triangle");
}

/* === 2. RELIC & PASSIVE APPLICATION === */
function grantRelic(forcedId = -1) {
  if (!player) return;
  const avail = RELICS_DB.filter(r => !player.relics.some(pr => pr.id === r[0]));
  if (avail.length === 0) return;
  const rel = forcedId >= 0 ? (RELICS_DB[forcedId] || avail[0]) : avail[Math.floor(Math.random() * avail.length)];

  if (player.relics.length >= player.maxRelics) player.relics.shift();
  player.relics.push({ id: rel[0], name: rel[1], desc: rel[2], key: rel[3], val: rel[4] });

  const k = rel[3], v = rel[4];
  if (k === "repulsor") player.hasRepulsor = true;
  else if (k === "prcArm") { player.pierce += 1; player.armor += 3; }
  else if (k === "critPack") { player.crit += 0.15; player.cdmg += 0.25; }
  else if (k === "fastDraw") { player.cdr *= 0.85; player.projSpd += 0.20; }
  else if (k === "fortFast") { player.fortFastMul += 0.35; player.might += 0.15; }
  else if (k === "jetHover") { player.spd *= 1.18; player.hazImmune = true; }
  else if (k === "cdrAll") { player.cdr *= 0.86; player.utilCdrMul *= 0.86; }
  else if (k === "dmgSpd") { player.might += 0.18; player.spd *= 1.15; }
  else if (k === "magXp") { player.mag *= 1.35; player.greed += 0.15; }
  else if (k === "critArea") { player.crit += 0.20; player.area += 0.18; }
  else if (k === "armReg") { player.armor += 4; player.regen += 1.5; }
  else if (k === "utilCdr") { player.utilCdrMul *= 0.78; }
  else if (k === "pspdDur") { player.projSpd += 0.30; player.dur += 0.20; }
  else if (k === "bossDmg") { player.bossMul += 0.25; }
  else if (k === "dmgKb") { player.might += v; player.kb += 0.22; }
  else if (k === "dmg") { player.might += v; }
  else if (k === "reg") { player.regen += v; }
  else if (k === "hpArm") { player.maxHp *= 1.3; player.hp += 30; player.armor += 2; }
  else if (k === "regSpd") { player.regen += 1.8; player.spd *= 1.12; }
  else if (k === "arm") { player.armor += v; }
  else if (k === "cdmg") { player.cdmg += v; }
  else if (k === "cnt") { player.projCnt += v; }
  else if (k === "greed") { player.greed += v; }
  else if (k === "hp") { player.maxHp *= (1 + v); player.hp += 35; }
  else if (k === "slow") { player.slow += v; }
  else if (k === "area") { player.area += v; }
  else if (k === "cdrMag") { player.cdr *= 0.88; player.mag *= 1.20; }
  else if (k === "crit") { player.crit += v; }
  else if (k === "dm") { player.dmRun += v; }
  else if (k === "shred") { player.shred += v; }
  else if (k === "critCdr") { player.crit += 0.15; player.cdr *= 0.90; }
  else if (k === "dodge") { player.dodge += v; }
  else if (k === "spd") { player.spd *= (1 + v); }
  else if (k === "prc") { player.pierce += v; }
  else if (k === "pspd") { player.projSpd += v; }
  else if (k === "rev") { player.revives += v; }
  else if (k === "vehBoost") { player.vehBoostMul += v; }
  else if (k === "dur") { player.dur += v; }
  else if (k === "kb") { player.kb += v; player.maxHp *= 1.2; }
  else if (k === "omni") { player.might += 0.15; player.area += 0.15; player.cdr *= 0.90; }

  spawnSpeech(player.x, player.y, "RELIC: " + rel[1].toUpperCase(), "#e040fb", 2.4);
  sfx(480, 980, 0.18, "triangle");
  updateHUD();
}

function applyPassive(idx) {
  const p = PASSIVES[idx];
  const existing = player.passives.find(x => x.id === idx);
  if (existing) existing.lvl = Math.min(5, existing.lvl + 1);
  else player.passives.push({ id: idx, name: p[0], desc: p[1], lvl: 1 });

  const k = p[2], v = p[3];
  if (k === "dmg") player.might += v;
  else if (k === "cdr") player.cdr *= (1 - v);
  else if (k === "area") player.area += v;
  else if (k === "arm") player.armor += v;
  else if (k === "reg") player.regen += v;
  else if (k === "mag") player.mag *= (1 + v);
  else if (k === "spd") player.spd *= (1 + v);
  else if (k === "cnt") player.projCnt += v;
  else if (k === "dur") player.dur += v;
  else if (k === "pspd") player.projSpd += v;
  else if (k === "crit") player.crit += v;
  else if (k === "cdmg") player.cdmg += v;
  else if (k === "prc") player.pierce += v;
  else if (k === "hp") { player.maxHp *= (1 + v); player.hp = Math.min(player.maxHp, player.hp + player.maxHp * v); }
  else if (k === "xp") player.greed += v;
  else if (k === "dm") player.dmRun += v;
  else if (k === "kb") player.kb += v;
  else if (k === "slow") player.slow += v;
  else if (k === "shred") player.shred += v;
  else if (k === "rev") player.revives += v;
}

/* === 3. ENEMY, BOSS & ALIGNMENT-BASED RIVAL CHALLENGER SPAWNER === */
function spawnEnemy(isBoss = false, isRival = false) {
  for (let i = 0; i < MAX_E; i++) {
    if (!eAct[i]) {
      const ang = Math.random() * Math.PI * 2;
      const dist = (isBoss || isRival ? 235 : 305) / Math.min(1.2, opts.zoom);
      eX[i] = player.x + Math.cos(ang) * dist;
      eY[i] = player.y + Math.sin(ang) * dist;
      eVX[i] = 0; eVY[i] = 0;

      const waveScale = 1 + (waveNum - 1) * 0.18 + ChaosMath.range(i + waveNum * 31, -0.05, 0.12);
      const base = isBoss ? 520 : (isRival ? 390 : (15 + runTime * 0.45));
      eHP[i] = eMax[i] = base * player.stg.hpMul * player.diff.hpMul * waveScale;
      eSpd[i] = (isBoss ? 64 : (isRival ? 88 : (46 + (i % 4) * 11 + Math.min(35, waveNum * 2.2)))) * player.diff.spdMul;
      eSlow[i] = 0; eShred[i] = 0; eStun[i] = 0; eGrapple[i] = 0;
      eFireCD[i] = 1.5 + Math.random() * 1.5;
      eSeed[i] = Math.floor(Math.random() * 1000000);
      eWave[i] = waveNum;
      eMoveStyle[i] = isBoss ? 0 : (eSeed[i] % 4);

      if (isRival) {
        eType[i] = 98;
        let rCid = Math.floor(Math.random() * CHAR_RAW.length);
        if (rCid === player.cid) rCid = (rCid + 1) % CHAR_RAW.length;
        eRivalCid[i] = rCid;
        const rName = CHAR_RAW[rCid][3];
        const callout = typeof getRivalCallout === "function"
          ? getRivalCallout(rCid, player.cid)
          : "You have a bounty on your head, and I've come to collect!";
        spawnSpeech(player.x, player.y - 24, `${rName.toUpperCase()}: "${callout}"`, "#ff5252", 3.8);
        sfx(140, 420, 0.4, "sawtooth", 0.35);
      } else {
        eType[i] = isBoss ? 99 : (i % 4);
        eRivalCid[i] = -1;
        if (isBoss) sfx(110, 165, 0.45, "sawtooth", 0.35);
      }
      eAct[i] = 1;
      return;
    }
  }
}

/* === 4. WEAPON FIRING, HERO SPECIALS & ACTIVE UTILITIES === */
function fireWeapon(w) {
  const sup = w.lvl >= 10 ? 1 : 0;
  const count = 1 + Math.floor(w.lvl / 3) + player.projCnt + (sup ? 2 : 0);
  const lowHpBonus = (player.cid === 13 && player.hp < player.maxHp * 0.5) ? 1.35 : 1;
  const killBonus = player.cid === 24 ? Math.min(2, 1 + Math.floor(player.kills / 15) * 0.01) : 1;
  let baseDmg = (14 + w.lvl * 6.5) * player.might * lowHpBonus * killBonus * (sup ? 2.35 : 1);

  let tx = player.x + Math.cos(player.aim) * 120, ty = player.y + Math.sin(player.aim) * 120, best = 1e9;
  for (let i = 0; i < MAX_E; i++) {
    if (eAct[i]) {
      const d = Math.hypot(eX[i] - player.x, eY[i] - player.y);
      if (d < best) { best = d; tx = eX[i]; ty = eY[i]; }
    }
  }
  const aimAng = Math.atan2(ty - player.y, tx - player.x);
  player.aim = aimAng;

  if (w.id === 52) {
    sfx(720, 190, 0.04, "square", 0.24);
    const spd = 480 * player.projSpd, spread = (Math.random() - 0.5) * 0.08;
    spawnProj(player.x, player.y, Math.cos(aimAng + spread) * spd, Math.sin(aimAng + spread) * spd, baseDmg * 2.1, 0.75 * player.dur, 9 * player.area, 2 + player.pierce + (sup ? 4 : 0), 4, sup, 0);
    return;
  }

  if (w.style === "orbit") {
    sfx(420, 620, 0.06, "sine", 0.14);
    for (let k = 0; k < count; k++) {
      const a = w.ang + (Math.PI * 2 * k) / count, rad = (58 + (sup ? 24 : 0)) * player.area;
      spawnProj(player.x + Math.cos(a) * rad, player.y + Math.sin(a) * rad, a, rad, baseDmg, 0.45 * player.dur, 14 * player.area, 99, 1, sup, 0);
    }
    if (sup) spawnProj(player.x, player.y, 0, 0, baseDmg * 0.85, 0.35, 95 * player.area, 99, 6, 1, 0);
  } else if (w.style === "missile") {
    sfx(580, 240, 0.07, "sawtooth");
    for (let k = 0; k < count; k++) {
      const a = aimAng + (k - (count - 1) / 2) * 0.28, spd = 235 * player.projSpd;
      spawnProj(player.x, player.y, Math.cos(a) * spd, Math.sin(a) * spd, baseDmg, 1.6 * player.dur, 9 * player.area, player.pierce, 2, sup, 0);
    }
  } else if (w.style === "cone") {
    sfx(180, 55, 0.06, "square");
    const pellets = count + 2;
    for (let k = 0; k < pellets; k++) {
      const a = aimAng + (k - (pellets - 1) / 2) * 0.16, spd = 295 * player.projSpd;
      spawnProj(player.x, player.y, Math.cos(a) * spd, Math.sin(a) * spd, baseDmg * 0.88, 0.55 * player.dur, 8 * player.area, player.pierce + 1, 3, sup, 0);
      if (sup) {
        const ra = a + Math.PI;
        spawnProj(player.x, player.y, Math.cos(ra) * spd, Math.sin(ra) * spd, baseDmg * 0.88, 0.55 * player.dur, 8 * player.area, player.pierce + 1, 3, 1, 0);
      }
    }
  } else if (w.style === "beam") {
    sfx(880, 220, 0.08, "sawtooth");
    for (let k = 0; k < count; k++) {
      const a = aimAng + (k - (count - 1) / 2) * 0.12, spd = 450 * player.projSpd;
      spawnProj(player.x, player.y, Math.cos(a) * spd, Math.sin(a) * spd, baseDmg * 1.2, 0.75 * player.dur, 10 * player.area, 4 + player.pierce + (sup ? 6 : 0), 4, sup, 0);
    }
  } else if (w.style === "chain") {
    sfx(660, 320, 0.07, "triangle");
    for (let k = 0; k < count; k++) {
      const a = aimAng + (k - (count - 1) / 2) * 0.22, spd = 330 * player.projSpd;
      spawnProj(player.x, player.y, Math.cos(a) * spd, Math.sin(a) * spd, baseDmg, 0.9 * player.dur, 11 * player.area, 2 + player.pierce + (sup ? 4 : 0), 5, sup, 0);
    }
  } else {
    sfx(310, 740, 0.1, "sine");
    spawnProj(player.x, player.y, 0, 0, baseDmg * 1.2, 0.45 * player.dur, (75 + w.lvl * 5) * player.area * (sup ? 1.45 : 1), 99, 6, sup, 0);
  }
}

function triggerUtility(uIdx) {
  if (!player || !player.utils[uIdx]) return;
  const u = player.utils[uIdx];
  if (u.cd > 0) return;
  u.cd = u.cdMax * player.utilCdrMul;

  if (u.type === "buildFort") deployLastStandFort(player.x, player.y);
  else if (u.type === "grappleHook") {
    let best = -1, bestHP = -1;
    for (let i = 0; i < MAX_E; i++) {
      if (eAct[i] && Math.hypot(eX[i] - player.x, eY[i] - player.y) < 320 && eHP[i] > bestHP) { bestHP = eHP[i]; best = i; }
    }
    if (best >= 0) {
      eGrapple[best] = 5.5; eStun[best] = 5.5;
      spawnSpeech(eX[best], eY[best], "GRAPPLED!", "#00e5ff", 1.8);
      sfx(620, 210, 0.16, "sawtooth");
    }
  } else if (u.type === "flameCone") {
    flameVisTimer = 0.65; sfx(140, 75, 0.25, "sawtooth", 0.28);
    for (let i = 0; i < MAX_E; i++) {
      if (eAct[i] && Math.hypot(eX[i] - player.x, eY[i] - player.y) < 135 * player.area) {
        eHP[i] -= 140 * player.might; spawnDmg(eX[i], eY[i], 140 * player.might, true);
      }
    }
  } else if (u.type === "fanHammer" || u.type === "critBurst") {
    for (let k = 0; k < 10; k++) {
      const a = player.aim + (k - 4.5) * (u.type === "fanHammer" ? 0.14 : 0.62);
      spawnProj(player.x, player.y, Math.cos(a) * 480, Math.sin(a) * 480, 95 * player.might, 0.8, 10, 4, 4, 1, 0);
    }
    sfx(780, 180, 0.15, "square");
  } else if (u.type === "executeDash") {
    for (let i = 0; i < MAX_E; i++) {
      if (eAct[i] && Math.hypot(eX[i] - player.x, eY[i] - player.y) < 140) {
        const flipAng = Math.random() * Math.PI * 2;
        eX[i] += Math.cos(flipAng) * 42; eY[i] += Math.sin(flipAng) * 42; eStun[i] = 2.5;
        const execDmg = eType[i] >= 98 ? Math.max(260 * player.might, eMax[i] * 0.38) : eHP[i] + 50;
        eHP[i] -= execDmg; spawnDmg(eX[i], eY[i], execDmg, true);
      }
    }
    spawnSpeech(player.x, player.y, "BABA YAGA TAKEDOWN!", "#ffd166", 1.5);
    sfx(820, 120, 0.14, "sawtooth");
  } else {
    spawnProj(player.x, player.y, 0, 0, 130 * player.might, 0.45, 135 * player.area, 99, 6, 1, 0);
    sfx(320, 740, 0.16, "triangle");
  }
  updateHUD();
}

function updateHeroSpecials(simDt) {
  player.utils.forEach(u => { if (u.cd > 0) u.cd = Math.max(0, u.cd - simDt); });
  if (player.cqcCD > 0) player.cqcCD -= simDt;
  if (player.autoFlameCD > 0) player.autoFlameCD -= simDt;

  if (player.cid === 53) {
    if (Math.hypot(player.x - player.fortAnchorX, player.y - player.fortAnchorY) <= 180) {
      player.fortTimer += simDt * player.fortFastMul;
      if (player.fortTimer >= 120) { player.fortTimer = 0; deployLastStandFort(player.x, player.y); }
    } else {
      player.fortAnchorX = player.x; player.fortAnchorY = player.y;
      player.fortTimer = Math.max(0, player.fortTimer - simDt * 0.5);
    }
  }

  if (player.cid === 54 && player.autoFlameCD <= 0) {
    let nearCnt = 0;
    for (let i = 0; i < MAX_E; i++) {
      if (eAct[i] && Math.hypot(eX[i] - player.x, eY[i] - player.y) < 115) nearCnt++;
    }
    if (nearCnt >= 4) {
      player.autoFlameCD = 4.5; flameVisTimer = 0.55;
      spawnSpeech(player.x, player.y, "WRIST FLAMETHROWER!", "#ff6d00", 1.4);
      sfx(150, 65, 0.22, "sawtooth", 0.25);
      for (let i = 0; i < MAX_E; i++) {
        if (eAct[i] && Math.hypot(eX[i] - player.x, eY[i] - player.y) < 125 * player.area) {
          eHP[i] -= 110 * player.might; eStun[i] = 1.0; spawnDmg(eX[i], eY[i], 110 * player.might, true);
        }
      }
    }
  }
}
