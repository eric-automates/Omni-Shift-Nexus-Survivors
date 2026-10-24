// FILE: js/combat.js
// PART: 11 of 14
// DETAIL: Run Init, Synced Tactical Visor Unlocks, On-Screen Boss Targeting (`isEnemyOnScreen`), All 56 Hero Signature Gear, Complete Utility Handlers (#00-#55), and Secondary Hardware.

"use strict";

/* === 1. ALL 56 HEROES' LV.5 PRIMARY TRANSITIONS, EQUIP CALLOUTS & SECONDARY HARDWARE ===
   [Lv5PrimaryWeaponName, StartOfRunEquipCallout, SecondaryHardwareName, SecStyle, SecDmgMul, SecCD] */
const HERO_SIG_GEAR = [
  ["Bespin Master Lightsaber", "SKYWALKER SABER IGNITED!", "Force Telekinetic Push", 6, 1.3, 7.5],
  ["Pure Beskar Spear & Darts", "BESKAR VISOR & WHISTLING BIRDS ARMED!", "Whistling Bird Micro-Salvo", 2, 1.5, 7.0],
  ["DLT-19 Heavy Repeating Blaster", "IMPERIAL COMLINK & E-11 LOCKED!", "Thermal Detonator Toss", 2, 1.4, 8.0],
  ["Dual Senate Guard Sabers", "DARK SIDE LIGHTNING CHARGED!", "Force Choke & Chain Arc", 5, 1.5, 6.5],
  ["Dual Periscope Arc-Welder", "ASTROMECH SERVOS & THRUSTERS ONLINE!", "Burning Oil Slick & Zap", 6, 1.3, 6.0],
  ["Heavy Twin-Quarrel Bowcaster", "BANDOLIER CHARGED — WOOKIEE ROAR!", "Kashyyyk Satchel Charge", 2, 1.6, 8.0],
  ["Modified Hair-Trigger DL-44", "DL-44 UNHOLSTERED — NEVER TELL ME THE ODDS!", "Lucky Sabacc Detonator", 3, 1.4, 7.5],
  ["Ascended Staff of Ra", "GOA'ULD KARA KESH RIBBON ARMED!", "Solar Orb Bombardment", 6, 1.6, 7.0],
  ["Carter Special Micro-Carbine", "FN-P90 RACKED & C4 DETONATOR SET!", "Remote C4 Blast", 6, 1.5, 8.0],
  ["First-Prime Twin Ma'Tok", "SERPENT HELM LOCKED — JAFFA KREE!", "Zat'nik'tel Triple-Arc", 5, 1.4, 7.0],
  ["Thor's Chariot Ion Array", "ASGARD BEAMING SENSORS ONLINE!", "Asgard Drone Strike", 4, 1.5, 6.5],
  ["Queen's Feeding Hand & Stunner", "HIVE TELEPATHY & BIO-STUNNER ARMED!", "Wraith Culling Beam", 5, 1.4, 7.5],
  ["Staff of the Ori Crusade", "HALLOWED ARE THE ORI — STAFF LIT!", "Prior Plague Shockwave", 6, 1.5, 8.0],
  ["Serenity Bridge Carbine & Pistol", "MOSES BROTHERS SIDEARM DRAWN!", "Browncoat Grenade Toss", 3, 1.4, 7.5],
  ["Tam Twin Miranda Cleavers", "TWO BY TWO, HANDS OF BLUE — BLADES OUT!", "Psychic Precog Slash", 7, 1.6, 6.0],
  ["Vera Custom Sniper-Mod", "VERA CHAMBERED IN SPACE-SUIT!", "Luxan Frag Grenade", 2, 1.5, 7.5],
  ["Crazy-Ivan Thruster Array", "FLIGHT CONTROLS & DINOSAURS SET!", "Shuttle Exhaust Blast", 6, 1.4, 7.0],
  ["Twin Reactor-Core Buzzsaws", "HARPOON CHAINS & SPIKES LOCKED!", "Mutagenic Acid Spit", 3, 1.5, 6.5],
  ["Maker's Tooth & Maula Pistol", "CRYSKNIFE DRAWN — MAY THY KNIFE CHIP!", "Weirding Way Voice Blast", 3, 1.6, 6.5],
  ["Emperor's Lasgun & Slow-Blade", "SALUSA SECUNDUS SHIELD BELT ON!", "Shigawire Garrote Lash", 5, 1.4, 7.0],
  ["Gom Jabbar & Reverend Voice", "LITANY AGAINST FEAR RECITED!", "Mind-Paralyzing Pitch", 6, 1.5, 7.5],
  ["Bald Pale Baron's Mortar", "SUSPENSOR BELT LEVITATING!", "Giedi Mortar Shell", 2, 1.5, 8.0],
  ["Type-III Compression Phaser Rifle", "PHASERS SET TO VAPORIZE!", "Photon Grenade Volley", 2, 1.4, 7.5],
  ["Queen's Assimilation Matrix", "OCULAR IMPLANT & NANOPROBES LOCKED!", "Borg Cutting Laser", 4, 1.5, 7.0],
  ["Sword of Kahless & Mek'leth", "BAT'LETH RAISED FOR STO-VO-KOR!", "Disruptor Pistol Shot", 4, 1.5, 6.5],
  ["Mk-II Viper Twin KEW Cannons", "VIPER THRUSTERS & MAGNUM COCKED!", "Raptor Swallow-Swarm", 2, 1.4, 7.5],
  ["Heavy Dual Centurion Autocannons", "RED EYE SCANNER SWEEPING!", "Basestar Micro-Nuke", 2, 1.5, 8.0],
  ["M-300 Claymore & Biotic Charge", "OMNI-TOOL & BIOTIC AMP GLOWING!", "Biotic Nova Slam", 6, 1.5, 6.5],
  ["Vasquez Overclocked M56 & Pulse", "SMARTGUN SERVO-ARM & TRACKER ON!", "M40 Incendiary Grenade", 2, 1.5, 7.0],
  ["Elder Dual Wrist-Blades & Disc", "BIO-MASK THERMAL & PLASMA CASTER ON!", "Shoulder Plasma Caster", 4, 1.7, 6.0],
  ["Empress Scythe-Tail & Spit", "ROYAL CREST FLARED — HIVE AWAKENED!", "Pressurized Acid Spray", 3, 1.5, 6.5],
  ["Morita MK3 Carbine & Shotgun", "MORITA RACKED — ROUGHNECKS HO!", "Bug-Hole Tactical Nuke", 2, 1.5, 7.5],
  ["BR55 Battle Rifle & Energy Sword", "MJOLNIR SHIELDS & CORTANA ONLINE!", "M9 Frag & Plasma Stick", 2, 1.6, 7.0],
  ["Meathook SSG & Unmaykr", "SUPER SHOTGUN & FLAME BELCHER COCKED!", "Shoulder Flame-Belcher", 3, 1.7, 6.0],
  ["Master-Crafted Bolter & Relic Saw", "CHAINSWORD REVVED FOR THE EMPEROR!", "Backpack Krak Missile", 2, 1.6, 7.5],
  ["Solar Atomizer & Eradication Ray", "MECHADENDRITES & SERVO-SKULLS BLESSED!", "Mechadendrite Arc-Claw", 5, 1.5, 6.5],
  ["Synaptic Disintegrator & Warscythe", "REANIMATION PROTOCOLS & GAUSS LIT!", "Tesseract Scarab Swarm", 2, 1.5, 7.5],
  ["Deffgun & Power Klaw", "POWER KLAW CLAMPED — WAAAGH!", "Stickbomb & Rokkit Salvo", 2, 1.5, 7.0],
  ["Inquisitor Rosette & Force-Staff", "ROSETTE SHOWN — WARP CHANNELING!", "Purging Smite Bolt", 5, 1.5, 6.5],
  ["Lobby Arsenal & Awakened Code", "SHADES ON — BULLET TIME ENGAGED!", "Telekinetic Code Wave", 6, 1.6, 6.5],
  ["Phased-Plasma 40W & Minigun", "HUD TARGET ACQUIRED — TITANIUM ARMED!", "M79 Thumper Grenade", 2, 1.6, 7.0],
  ["Deckard Double-Trigger Blaster", "VOIGHT-KAMPFF CALIBRATED!", "Spinner Flechette Burst", 3, 1.5, 7.5],
  ["Arasaka Mantis Blades & Guts", "SANDEVISTAN SPINE IMPLANT PULSING!", "Wrist Projectile Launcher", 2, 1.6, 6.5],
  ["Gatling Laser & Fat-Man MIRV", "PIP-BOY 3000 & V.A.T.S. LOCKED!", "Nuka-Grenade Toss", 6, 1.6, 8.0],
  ["Quad-Barrel Boomstick & Harpoon", "GUZZOLINE INJECTED — WITNESS ME!", "Explosive Thunderstick", 2, 1.5, 7.0],
  ["Overcharged Blue Grav-Gun & Tau", "HEV SUIT & CROWBAR EQUIPPED!", "Punted Sawblade Ricochet", 4, 1.6, 6.5],
  ["Gallifreyan Moment & Sonic Matrix", "SONIC EMITTER EXTENDED — ALLONS-Y!", "Temporal Stasis Pulse", 6, 1.5, 7.5],
  ["Plasma-Ice-Wave Hyper Cannon", "VARIA SUIT & ARM CANNON CHARGED!", "Super Missile Salvo", 2, 1.6, 6.5],
  ["Grandmaster Aerondight & Crossbow", "SILVER SWORD DRAWN — MEDALLION HUMS!", "Igni Firestream Sign", 3, 1.6, 6.5],
  ["Necronomicon Eldritch Conduit", "ABYSSAL TOME OPENED — STARS ALIGNED!", "Void Tentacle Eruption", 5, 1.6, 7.0],
  ["Meitou Cross-Nodachi & Eagle Cross", "MEITOU BLADE UNSHEATHED IN THE ASH!", "Masterwork Crossbow Bolt", 4, 1.7, 6.0],
  ["Baba Yaga Primary 2011 & Benelli M4", "KEVLAR SUIT BUTTONED & KIMBER CHECKED!", "Continental Throwing Knife", 4, 1.7, 5.5],
  ["Dual Navy Revolvers & Henry Rifle", "PONCHO FLIPPED BACK — IRON READY!", "Lit Dynamite Bundle", 6, 1.7, 8.0],
  ["Dual-Belt M60E3 & Thermite Bow", "RED HEADBAND TIED & BOW STRINGED!", "Thermite Explosive Arrow", 2, 1.7, 7.0],
  ["Modified ESB EE-3 & Concussion Rifle", "WRIST GAUNTLETS & Z-6 JETPACK ARMED!", "Z-6 Jetpack Anti-Armor Missile", 2, 1.8, 7.5],
  ["Quad Jedi Trophy Sabers & Blaster", "CAPE DROPPED — FOUR ARMS UNLOCKED!", "Quad-Claw Grapple Blaster", 4, 1.8, 6.0]
];

/* === 3. TACTICAL VISOR SPECS === */
const VISOR_MODES = [
  [0, "Off", "#ffffff", 0.0, "Standard Vision"],
  [1, "Boba Green Rangefinder", "#00e676", 0.10, "Green targeting telemetry + threat lock"],
  [2, "T-800 Cybernetic Red HUD", "#ff1744", 0.10, "Red reticle with Head Life telemetry & weakness info"],
  [3, "Predator Thermal Vision", "#ff9100", 0.10, "Heat-map infrared sensor glow on all enemies"],
  [4, "Matrix Prescience Code", "#00ff88", 0.10, "Cascading green code rain predicting enemy vectors"]
];

/* === 4. PLAYER RUN INITIALIZATION & PASSIVES === */
function startRun() {
  purgeRunMemory();
  const c = CHAR_RAW[meta.selChar] || CHAR_RAW[0];
  const stg = STAGES[meta.selStage - 1] || STAGES[0];
  const diff = DIFFICULTIES[meta.diff] || DIFFICULTIES[1];
  const r = meta.ranks, cid = c[0];
  const sig = HERO_SIG_GEAR[cid] || HERO_SIG_GEAR[0];

  runSeed = (Date.now() & 0xfffffff) ^ (meta.selStage * 997);
  runActive = true; runPaused = false;
  runTime = 0; totalRunTime = 0; orbWarpTimer = 0; waveNum = 1; rivalTimer = 0;

  const innateVac = (typeof hasInnateVacuum === "function" && hasInnateVacuum(cid)) ? 1.0 : 0.0;
  const startsWithSaber = (typeof isSwordWeapon === "function" && isSwordWeapon(cid)) || c[6] === "orbit";
  const armCap = typeof getHeroArmCap === "function" ? getHeroArmCap(cid) : 2;

  let innateVisor = 0;
  if ([1, 54].includes(cid)) innateVisor = 1;
  else if ([40, 23, 26, 36, 55].includes(cid)) innateVisor = 2;
  else if ([28, 29, 31, 32, 33, 34, 47].includes(cid)) innateVisor = 3;
  else if ([0, 3, 7, 10, 14, 18, 20, 38, 39, 46, 48].includes(cid)) innateVisor = 4;

  const startVisors = innateVisor > 0 ? [innateVisor] : [];

  player = {
    x: 256, y: 256, aim: 0, moveDir: 0, walk: 0, vx: 0, vy: 0,
    hp: 100, maxHp: 100 * (1 + r[2] * 0.15) * diff.plrHp,
    might: 1 + r[0] * 0.10, armor: r[1],
    regen: r[3] * 0.6, cdr: 1 - r[4] * 0.06, area: 1 + r[5] * 0.12,
    spd: 145 * (1 + r[6] * 0.08), mag: 90 * (1 + r[7] * 0.25),
    crit: 0.08 + r[8] * 0.05, cdmg: 1.6,
    greed: (1 + r[9] * 0.20) * diff.xpMul,
    projCnt: 0, projSpd: 1.0, dur: 1.0, pierce: 0,
    kb: 1.0, slow: 0, shred: 0, revives: 0, dodge: 0,
    hover: false, hazImmune: false, bossMul: 1.0,
    adaptTimer: 0, sandTimer: 0, sandCD: 6.0, vatsTimer: 0, vatsCD: 4.0, overclockTimer: 0, phaseTimer: 0,
    cqcCD: 0, autoFlameCD: 0, sigGearCD: sig[5], equipAnimTimer: 1.8,
    sixShotsLeft: 6, sixBurstCD: 0, sixReloadCD: 0,
    fortAnchorX: 256, fortAnchorY: 256, fortTimer: 0, fortFastMul: 1.0,
    inVehicle: 0, vehicleHp: 0, vehBoostMul: 1.0, carryingBarricade: false,
    hasRepulsor: false, utilCdrMul: 1.0, orbVacuumRate: innateVac,
    limbs: [100, 100, 100, 100, 100, 100], guardZone: -1,
    hasSaber: startsWithSaber, saberMastery: startsWithSaber ? (cid === 55 ? 45 : 8) : 0,
    swordSwingTimer: 0, swordLungeTimer: 0,
    armCap: armCap, handSlotOffset: 0, swapTimer: 0, swapPause: 0,
    unlockedVisors: startVisors,
    visorsUnlocked: startVisors,
    activeVisor: innateVisor,
    maxRelics: ([7, 10, 35].includes(cid)) ? 4 : 3,
    relics: [], utils: getHeroUtils(cid),
    xp: 0, nextXp: 10, lvl: 1, kills: 0, dmRun: 0, bossSpawned: false,
    fac: FACTIONS[c[1]], hero: c, cid, stg, diff,
    weapons: [{ id: cid, name: c[4], superName: c[5], style: c[6], lvl: 1, cd: 0, ang: 0, enabled: true, evolvedLv5: false }],
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
  if (cid === 10) { player.dodge += 0.22; }
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
  if (cid === 50) { player.maxHp *= 1.2; }
  if (cid === 51) { player.crit += 0.30; player.dodge += 0.20; player.spd *= 1.15; }
  if (cid === 52) { player.crit += 0.45; player.cdmg += 0.65; player.projSpd += 0.40; }
  if (cid === 53) { player.maxHp *= 1.35; player.armor += 4; player.might += 0.20; }
  if (cid === 54) { player.armor += 5; player.bossMul = 1.35; player.crit += 0.20; }
  if (cid === 55) { player.might += 0.35; player.projCnt += 1; player.spd *= 1.2; }

  player.hp = player.maxHp;
  spawnSpeech(256, 256, sig[1], "#00e676", 2.2);
  showScreen(null);
  document.getElementById("hud").classList.add("active");
  document.getElementById("hud").classList.toggle("flip", opts.hudFlip);
  updateHUD();
  sfx(220, 660, 0.18, "triangle");
}

/* === 5. RELIC, PASSIVE & FORMATION SPAWNERS === */
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
  sfx(480, 980, 0.18, "triangle"); updateHUD();
}

function applyPassive(idx) {
  const p = PASSIVES[idx], existing = player.passives.find(x => x.id === idx);
  if (existing) existing.lvl = Math.min(5, existing.lvl + 1);
  else player.passives.push({ id: idx, name: p[0], desc: p[1], lvl: 1 });
  const k = p[2], v = p[3];
  if (k === "dmg") player.might += v; else if (k === "cdr") player.cdr *= (1 - v); else if (k === "area") player.area += v;
  else if (k === "arm") player.armor += v; else if (k === "reg") player.regen += v; else if (k === "mag") player.mag *= (1 + v);
  else if (k === "spd") player.spd *= (1 + v); else if (k === "cnt") player.projCnt += v; else if (k === "dur") player.dur += v;
  else if (k === "pspd") player.projSpd += v; else if (k === "crit") player.crit += v; else if (k === "cdmg") player.cdmg += v;
  else if (k === "prc") player.pierce += v; else if (k === "hp") { player.maxHp *= (1 + v); player.hp = Math.min(player.maxHp, player.hp + player.maxHp * v); }
  else if (k === "xp") player.greed += v; else if (k === "dm") player.dmRun += v; else if (k === "kb") player.kb += v;
  else if (k === "slow") player.slow += v; else if (k === "shred") player.shred += v; else if (k === "rev") player.revives += v;
}

function allocEnemySlot(x, y, type, hpMul = 1.0, formType = 0, leaderIdx = -1) {
  for (let i = 0; i < MAX_E; i++) {
    if (!eAct[i]) {
      eX[i] = x; eY[i] = y; eVX[i] = 0; eVY[i] = 0;
      const waveScale = 1 + (waveNum - 1) * 0.22 + ChaosMath.range(i + waveNum * 31, -0.04, 0.14);
      const base = type === 99 ? 950 : (type === 98 ? 680 : (42 + runTime * 1.15));
      eHP[i] = eMax[i] = base * hpMul * player.stg.hpMul * player.diff.hpMul * waveScale;
      eSpd[i] = (type === 99 ? 56 : (type === 98 ? 78 : (40 + (type % 4) * 9 + Math.min(28, waveNum * 1.7)))) * (player.diff.spdMul || 1.0);
      eSlow[i] = 0; eShred[i] = 0; eStun[i] = 0; eGrapple[i] = 0;
      eFireCD[i] = 1.6 + Math.random() * 1.5; eSeed[i] = Math.floor(Math.random() * 1000000);
      eWave[i] = waveNum; eMoveStyle[i] = (type >= 98 || formType > 0) ? 0 : (eSeed[i] % 4);
      clearEnemyLimbState(i, false);
      eFormType[i] = formType; eFormLeader[i] = leaderIdx;
      eType[i] = type; eRivalCid[i] = -1; eAct[i] = 1;
      return i;
    }
  }
  return -1;
}

function spawnEnemy(isBoss = false, isRival = false) {
  const ang = Math.random() * Math.PI * 2, dist = (isBoss || isRival ? 235 : 305) / Math.min(1.2, opts.zoom);
  const sx = player.x + Math.cos(ang) * dist, sy = player.y + Math.sin(ang) * dist;
  if (isRival) {
    const idx = allocEnemySlot(sx, sy, 98, 1.0, 0, -1);
    if (idx >= 0) {
      let rCid = Math.floor(Math.random() * CHAR_RAW.length);
      if (rCid === player.cid) rCid = (rCid + 1) % CHAR_RAW.length;
      eRivalCid[idx] = rCid;
      const callout = typeof getRivalCallout === "function" ? getRivalCallout(rCid, player.cid) : "Bounty target locked!";
      spawnSpeech(player.x, player.y - 24, `${CHAR_RAW[rCid][3].toUpperCase()}: "${callout}"`, "#ff5252", 3.8);
      sfx(140, 420, 0.4, "sawtooth", 0.35);
    }
    return;
  }
  if (isBoss) { if (allocEnemySlot(sx, sy, 99, 1.0, 0, -1) >= 0) sfx(110, 165, 0.45, "sawtooth", 0.35); return; }
  const r = Math.random();
  if (r < 0.14) {
    const lead = allocEnemySlot(sx, sy, 0, 1.15, 1, -1);
    if (lead >= 0) {
      eSeed[lead] = Math.floor(eSeed[lead] / 5) * 5;
      const perp = ang + Math.PI * 0.5;
      const f1 = allocEnemySlot(sx + Math.cos(perp) * 24, sy + Math.sin(perp) * 24, 0, 1.0, 1, lead);
      const f2 = allocEnemySlot(sx - Math.cos(perp) * 24, sy - Math.sin(perp) * 24, 0, 1.0, 1, lead);
      if (f1 >= 0) eSeed[f1] = Math.floor(eSeed[f1] / 5) * 5;
      if (f2 >= 0) eSeed[f2] = Math.floor(eSeed[f2] / 5) * 5;
    }
  } else if (r < 0.28) {
    const master = allocEnemySlot(sx, sy, 0, 1.1, 2, -1);
    if (master >= 0) { allocEnemySlot(sx + 22, sy - 18, 1, 0.9, 2, master); allocEnemySlot(sx - 22, sy + 18, 1, 0.9, 2, master); }
  } else allocEnemySlot(sx, sy, Math.floor(Math.random() * 4), 1.0, 0, -1);
}

/* === 6. STRICT ON-SCREEN TARGET LOCK FIRING, FULL UTILITIES & SECONDARY HARDWARE === */
function fireWeapon(w) {
  if (w.lvl >= 5 && w.lvl < 10 && !w.evolvedLv5) {
    const sig = HERO_SIG_GEAR[w.id];
    if (sig && sig[0]) {
      w.name = sig[0]; w.evolvedLv5 = true; player.equipAnimTimer = 1.2;
      spawnSpeech(player.x, player.y, "PRIMARY ARSENAL: " + sig[0].toUpperCase() + "!", "#ffd166", 2.0);
    }
  }

  const sup = w.lvl >= 10 ? 1 : 0, lv5Boost = w.lvl >= 5 ? 1.25 : 1.0;
  const count = 1 + Math.floor(w.lvl / 3) + player.projCnt + (sup ? 2 : 0);
  const lowHpBonus = (player.cid === 13 && player.hp < player.maxHp * 0.5) ? 1.35 : 1;
  const killBonus = player.cid === 24 ? Math.min(2, 1 + Math.floor(player.kills / 15) * 0.01) : 1;
  const mechBonus = player.inVehicle === 2 ? 1.6 : 1.0;
  const armFactor = 0.7 + 0.3 * (Math.min(player.limbs[2], player.limbs[3]) / 100);
  let baseDmg = (18 + w.lvl * 8.0) * lv5Boost * player.might * lowHpBonus * killBonus * mechBonus * armFactor * (sup ? 2.35 : 1);

  let tx = player.x + Math.cos(player.aim) * 120, ty = player.y + Math.sin(player.aim) * 120, best = 1e9;
  for (let i = 0; i < MAX_E; i++) {
    if (eAct[i] && isEnemyOnScreen(i)) {
      const d = Math.hypot(eX[i] - player.x, eY[i] - player.y);
      if (d < best) { best = d; tx = eX[i]; ty = eY[i]; }
    }
  }
  const eyeJitter = ((100 - player.limbs[0]) / 100) * 0.42;
  const aimAng = Math.atan2(ty - player.y, tx - player.x) + (Math.random() - 0.5) * eyeJitter;
  player.aim = aimAng;

  if (typeof isSwordWeapon === "function" && isSwordWeapon(w.id) && w.style === "orbit") {
    if (best > 130 * player.area) { w.cd = 0.08; return; }
    if (best > 68 && !isPointBlockedByObstacle(player.x + Math.cos(aimAng) * 14, player.y + Math.sin(aimAng) * 14, true)) {
      player.x += Math.cos(aimAng) * 12; player.y += Math.sin(aimAng) * 12; player.swordLungeTimer = 0.16;
    }
    player.swordSwingTimer = 0.24;
    if (typeof sfxWeapon === "function") sfxWeapon("orbit", w.id, true);
    const slashSpd = 285 * player.projSpd;
    for (let k = 0; k < Math.min(3, count); k++) {
      const a = aimAng + (k - (Math.min(3, count) - 1) / 2) * 0.24;
      spawnProj(player.x, player.y, Math.cos(a) * slashSpd, Math.sin(a) * slashSpd, baseDmg * 1.45, 0.28 * player.dur, 22 * player.area, 99, 7, sup, 0, w.id);
    }
    return;
  }

  if (typeof sfxWeapon === "function") sfxWeapon(w.style, w.id, false);
  if (w.id === 52) {
    const spd = 520 * player.projSpd, spread = (Math.random() - 0.5) * (0.06 + eyeJitter * 0.5);
    spawnProj(player.x, player.y, Math.cos(aimAng + spread) * spd, Math.sin(aimAng + spread) * spd, baseDmg * 2.2, 0.75 * player.dur, 4, 2 + player.pierce + (sup ? 4 : 0), 4, sup, 0, 52);
    return;
  }
  if (w.style === "orbit") {
    for (let k = 0; k < count; k++) {
      const a = w.ang + (Math.PI * 2 * k) / count, rad = (58 + (sup ? 24 : 0)) * player.area;
      spawnProj(player.x + Math.cos(a) * rad, player.y + Math.sin(a) * rad, a, rad, baseDmg, 0.45 * player.dur, 14 * player.area, 99, 1, sup, 0, w.id);
    }
  } else if (w.style === "missile") {
    for (let k = 0; k < count; k++) {
      const a = aimAng + (k - (count - 1) / 2) * 0.28, spd = 245 * player.projSpd;
      spawnProj(player.x, player.y, Math.cos(a) * spd, Math.sin(a) * spd, baseDmg, 1.6 * player.dur, 9 * player.area, player.pierce, 2, sup, 0, w.id);
    }
  } else if (w.style === "cone") {
    const pellets = count + 2;
    for (let k = 0; k < pellets; k++) {
      const a = aimAng + (k - (pellets - 1) / 2) * 0.16, spd = 310 * player.projSpd;
      spawnProj(player.x, player.y, Math.cos(a) * spd, Math.sin(a) * spd, baseDmg * 0.9, 0.55 * player.dur, 7 * player.area, player.pierce + 1, 3, sup, 0, w.id);
    }
  } else if (w.style === "beam") {
    for (let k = 0; k < count; k++) {
      const a = aimAng + (k - (count - 1) / 2) * 0.12, spd = 460 * player.projSpd;
      spawnProj(player.x, player.y, Math.cos(a) * spd, Math.sin(a) * spd, baseDmg * 1.25, 0.75 * player.dur, 9 * player.area, 4 + player.pierce + (sup ? 6 : 0), 4, sup, 0, w.id);
    }
  } else if (w.style === "chain") {
    for (let k = 0; k < count; k++) {
      const a = aimAng + (k - (count - 1) / 2) * 0.22, spd = 340 * player.projSpd;
      spawnProj(player.x, player.y, Math.cos(a) * spd, Math.sin(a) * spd, baseDmg, 0.9 * player.dur, 10 * player.area, 2 + player.pierce + (sup ? 4 : 0), 5, sup, 0, w.id);
    }
  } else {
    spawnProj(player.x, player.y, 0, 0, baseDmg * 1.25, 0.45 * player.dur, (75 + w.lvl * 5) * player.area * (sup ? 1.45 : 1), 99, 6, sup, 0, w.id);
  }
}

function triggerUtility(uIdx) {
  if (!player || !player.utils[uIdx]) return;
  const u = player.utils[uIdx]; if (u.cd > 0) return; u.cd = u.cdMax * player.utilCdrMul;

  if (u.type === "buildFort") {
    deployLastStandFort(player.x, player.y);
  } else if (u.type === "quadSpin") {
    player.swordSwingTimer = 0.5;
    if (typeof sfxWeapon === "function") sfxWeapon("orbit", 55, true);
    for (let k = 0; k < 8; k++) {
      const a = player.aim + (Math.PI * 2 * k) / 8;
      spawnProj(player.x, player.y, Math.cos(a) * 320, Math.sin(a) * 320, 140 * player.might, 0.38, 22, 99, 7, 1, 0, 55);
    }
  } else if (u.type === "grappleHook") {
    let best = -1, bestHP = -1;
    for (let i = 0; i < MAX_E; i++) {
      if (eAct[i] && isEnemyOnScreen(i) && Math.hypot(eX[i] - player.x, eY[i] - player.y) < 320 && eHP[i] > bestHP) {
        bestHP = eHP[i]; best = i;
      }
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
        const fDmg = 160 * player.might;
        eHP[i] -= fDmg;
        spawnDmg(eX[i], eY[i], fDmg, true);
        if (eHP[i] <= 0 && typeof killEnemy === "function") killEnemy(i, false);
      }
    }
  } else if (u.type === "fanHammer" || u.type === "critBurst") {
    for (let k = 0; k < 10; k++) {
      const a = player.aim + (k - 4.5) * (u.type === "fanHammer" ? 0.14 : 0.62);
      spawnProj(player.x, player.y, Math.cos(a) * 480, Math.sin(a) * 480, 110 * player.might, 0.8, 8, 4, 4, 1, 0, player.cid);
    }
    if (typeof sfxWeapon === "function") sfxWeapon("beam", player.cid, false);
  } else if (u.type === "executeDash") {
    for (let i = 0; i < MAX_E; i++) {
      if (eAct[i] && Math.hypot(eX[i] - player.x, eY[i] - player.y) < 140) {
        const flipA = Math.random() * Math.PI * 2;
        eX[i] += Math.cos(flipA) * 42; eY[i] += Math.sin(flipA) * 42; eStun[i] = 2.5;
        const execDmg = eType[i] >= 98 ? Math.max(280 * player.might, eMax[i] * 0.38) : eHP[i] + 50;
        eHP[i] -= execDmg;
        spawnDmg(eX[i], eY[i], execDmg, true);
        if (eHP[i] <= 0 && typeof killEnemy === "function") killEnemy(i, true);
      }
    }
    spawnSpeech(player.x, player.y, "TAKEDOWN EXECUTED!", "#ffd166", 1.5);
    sfx(820, 120, 0.14, "sawtooth");
  } else if (u.type === "stareFreeze") {
    // Hero #52 Squint Showdown: Freezes all on-screen enemies in their tracks for 3.5s
    for (let i = 0; i < MAX_E; i++) {
      if (eAct[i] && (isEnemyOnScreen(i) || Math.hypot(eX[i] - player.x, eY[i] - player.y) < 340)) {
        eStun[i] = Math.max(eStun[i], 3.5);
        eSlow[i] = Math.max(eSlow[i], 5.0);
      }
    }
    spawnSpeech(player.x, player.y, "HIGH NOON SHOWDOWN!", "#ffd166", 2.0);
    sfx(440, 880, 0.25, "triangle");
  } else if (u.type === "explosiveBow") {
    // Hero #53 Explosive Arrow: High-yield thermite warhead arrow that detonates on impact
    for (let k = -1; k <= 1; k++) {
      const a = player.aim + k * 0.12;
      spawnProj(player.x, player.y, Math.cos(a) * 390, Math.sin(a) * 390, 210 * player.might, 1.4, 15 * player.area, 0, 2, 1, 0, 53);
    }
    spawnSpeech(player.x, player.y, "THERMITE EXPLOSIVE ARROW!", "#ff6d00", 1.6);
    sfx(320, 110, 0.18, "sawtooth");
  } else if (u.type === "cyborgRush") {
    // Hero #55 Cyborg Overclock: Doubles attack rate and movement speed for 4.5s
    player.overclockTimer = 4.5;
    spawnSpeech(player.x, player.y, "FOUR-ARM CYBORG OVERCLOCK!", "#00e676", 2.0);
    sfx(280, 960, 0.24, "sawtooth");
  } else {
    spawnProj(player.x, player.y, 0, 0, 150 * player.might, 0.45, 135 * player.area, 99, 6, 1, 0, player.cid);
    sfx(320, 740, 0.16, "triangle");
  }
  updateHUD();
}

function updateHeroSpecials(simDt) {
  player.utils.forEach(u => { if (u.cd > 0) u.cd = Math.max(0, u.cd - simDt); });
  if (player.cqcCD > 0) player.cqcCD -= simDt;
  if (player.autoFlameCD > 0) player.autoFlameCD -= simDt;
  if (player.equipAnimTimer > 0) player.equipAnimTimer = Math.max(0, player.equipAnimTimer - simDt);
  if (player.adaptTimer > 0) player.adaptTimer = Math.max(0, player.adaptTimer - simDt);
  if (player.overclockTimer > 0) player.overclockTimer = Math.max(0, player.overclockTimer - simDt);

  // Hero #42 Sandevistan Edgerunner: Bursts to 180% Speed & Rate every 6s
  if (player.cid === 42) {
    if (player.sandTimer > 0) {
      player.sandTimer = Math.max(0, player.sandTimer - simDt);
    } else {
      player.sandCD = (player.sandCD || 6.0) - simDt;
      if (player.sandCD <= 0) {
        player.sandCD = 6.0;
        player.sandTimer = 2.2;
        spawnSpeech(player.x, player.y, "SANDEVISTAN OVERDRIVE!", "#00e676", 1.4);
      }
    }
  }

  // Hero #43 Vault-Tec Wanderer: Guaranteed Crit V.A.T.S. pulse every 4s
  if (player.cid === 43) {
    if (player.vatsTimer > 0) {
      player.vatsTimer = Math.max(0, player.vatsTimer - simDt);
    } else {
      player.vatsCD = (player.vatsCD || 4.0) - simDt;
      if (player.vatsCD <= 0) {
        player.vatsCD = 4.0;
        player.vatsTimer = 1.25;
      }
    }
  }

  if (player.swordSwingTimer > 0) player.swordSwingTimer = Math.max(0, player.swordSwingTimer - simDt);
  if (player.swordLungeTimer > 0) {
    player.swordLungeTimer = Math.max(0, player.swordLungeTimer - simDt);
    if (player.swordLungeTimer <= 0.04) { player.x -= Math.cos(player.aim) * 35 * simDt; player.y -= Math.sin(player.aim) * 35 * simDt; }
  }

  const limbHeal = (0.8 + player.regen * 0.9) * simDt;
  for (let z = 0; z < 6; z++) { if (player.limbs[z] < 100) player.limbs[z] = Math.min(100, player.limbs[z] + limbHeal); }
  if (player.hasSaber && player.saberMastery < 100) player.saberMastery = Math.min(100, player.saberMastery + simDt * 0.45);

  if (player.cid === 53) {
    if (Math.hypot(player.x - player.fortAnchorX, player.y - player.fortAnchorY) <= 180) {
      player.fortTimer += simDt * player.fortFastMul;
      if (player.fortTimer >= 120) { player.fortTimer = 0; deployLastStandFort(player.x, player.y); }
    } else {
      player.fortAnchorX = player.x; player.fortAnchorY = player.y; player.fortTimer = Math.max(0, player.fortTimer - simDt * 0.5);
    }
  }

  const sig = HERO_SIG_GEAR[player.cid] || HERO_SIG_GEAR[0];
  player.sigGearCD -= simDt;
  if (player.sigGearCD <= 0) {
    let best = -1, maxH = 0;
    for (let i = 0; i < MAX_E; i++) {
      if (eAct[i] && isEnemyOnScreen(i) && Math.hypot(eX[i] - player.x, eY[i] - player.y) < 300 && eHP[i] > maxH) {
        maxH = eHP[i]; best = i;
      }
    }
    if (best >= 0) {
      player.sigGearCD = sig[5] * player.cdr;
      const ma = Math.atan2(eY[best] - player.y, eX[best] - player.x);
      const st = sig[3], dmg = 135 * sig[4] * player.might;
      if (st === 6) spawnProj(player.x, player.y, 0, 0, dmg, 0.42, 115 * player.area, 99, 6, 1, 0, player.cid);
      else spawnProj(player.x, player.y - 10, Math.cos(ma) * 320, Math.sin(ma) * 320, dmg, 1.5, 12 * player.area, 3, st, 1, 0, player.cid);
      spawnSpeech(player.x, player.y, sig[2].toUpperCase() + "!", "#ffd166", 1.15);
      sfx(540, 220, 0.09, "sawtooth", 0.2);
    }
  }

  if (player.cid === 54 && player.autoFlameCD <= 0) {
    let nearCnt = 0;
    for (let i = 0; i < MAX_E; i++) { if (eAct[i] && Math.hypot(eX[i] - player.x, eY[i] - player.y) < 115) nearCnt++; }
    if (nearCnt >= 4) {
      player.autoFlameCD = 4.5; flameVisTimer = 0.55;
      spawnSpeech(player.x, player.y, "WRIST FLAMETHROWER!", "#ff6d00", 1.4); sfx(150, 65, 0.22, "sawtooth", 0.25);
      for (let i = 0; i < MAX_E; i++) {
        if (eAct[i] && Math.hypot(eX[i] - player.x, eY[i] - player.y) < 125 * player.area) {
          const flmDmg = 130 * player.might;
          eHP[i] -= flmDmg; eStun[i] = 1.0;
          spawnDmg(eX[i], eY[i], flmDmg, true);
          if (eHP[i] <= 0 && typeof killEnemy === "function") killEnemy(i, false);
        }
      }
    }
  }
}
// EOF:js/combat.js
