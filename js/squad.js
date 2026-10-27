// FILE: js/squad.js
// PART: v10 module 4 of 8
// DETAIL: v10 Squad Direct Command — quick-access radial order wheel (Hold Position / Focus Fire / Advance / Regroup) for
//         every summoned companion (necro swordsmen, hounds, bowmen, knights, bone golems) plus universe-themed rifle
//         fireteams (Tears of the Sun SEALs, Colonial Marines, 501st Clones, Cadians...) called in from radio beacons or
//         deployed with military heroes. Includes a vehicle co-gunner: while you drive, a soldier rides along on the gun.

"use strict";

/* === 1. EXTRA MINION STATE (pool = js/state.js mX/mY/...) === */
const mBurst = new Uint8Array(MAX_MINION), mAim = new Float32Array(MAX_MINION), mTeam = new Uint8Array(MAX_MINION),
      mSlot = new Uint8Array(MAX_MINION), mTag = new Float32Array(MAX_MINION);
const mName = new Array(MAX_MINION).fill("");
function squadRewindArrays() { return [mBurst, mAim, mTeam, mSlot, mTag]; }

// Soldier kinds 5-8 (0-4 are the original necro / transfiguration minions).
const SOLDIER_SPECS = {
  5: { role: "RIFLEMAN", min: 110, max: 220, cd: 0.62, burst: 3, gap: 0.085, dmg: 1.0, spd: 560, spread: 0.05, prc: 1 },
  6: { role: "MACHINE GUNNER", min: 100, max: 210, cd: 0.105, burst: 1, gap: 0, dmg: 0.42, spd: 520, spread: 0.13, prc: 1 },
  7: { role: "MARKSMAN", min: 200, max: 330, cd: 1.55, burst: 1, gap: 0, dmg: 3.4, spd: 820, spread: 0.008, prc: 4 },
  8: { role: "BREACHER", min: 30, max: 95, cd: 0.95, burst: 1, gap: 0, dmg: 0.55, spd: 380, spread: 0.32, prc: 1, pellets: 6 }
};
const FIRETEAM_THEMES = {
  seal:   { name: "Tears of the Sun SEAL Team", uni: "#3e5c2f", helm: "#2e3b24", accent: "#c5e1a5", names: ["Flea", "Red", "Lake", "Slo", "Zee"] },
  marine: { name: "USCM Colonial Marines", uni: "#556b2f", helm: "#4b5320", accent: "#ffd166", names: ["Hicks", "Vasquez", "Hudson", "Drake", "Apone"] },
  clone:  { name: "501st Clone Troopers", uni: "#eceff1", helm: "#eceff1", accent: "#1e88e5", names: ["Rex", "Fives", "Echo", "Jesse", "Kix"], bolt: true },
  sgc:    { name: "SG-3 Marine Detachment", uni: "#5d6d3a", helm: "#3e4a24", accent: "#00e5ff", names: ["Reynolds", "Ferretti", "Kawalsky", "Siler", "Walter"] },
  rim:    { name: "Browncoat Militia", uni: "#6d4c41", helm: "#4e342e", accent: "#ff9e00", names: ["Zoe", "Jayne", "Tracey", "Bendis", "Monty"] },
  fremen: { name: "Fremen Fedaykin", uni: "#8d6e63", helm: "#5d4037", accent: "#40c4ff", names: ["Stilgar", "Chani", "Jamis", "Korba", "Otheym"] },
  fleet:  { name: "Colonial Fleet Marines", uni: "#455a64", helm: "#263238", accent: "#3a86ff", names: ["Kelly", "Hotdog", "Racetrack", "Gaeta", "Tigh"] },
  mi:     { name: "Roughnecks Mobile Infantry", uni: "#78909c", helm: "#546e7a", accent: "#ffd166", names: ["Rico", "Dizzy", "Ace", "Sugar", "Zim"] },
  guard:  { name: "Cadian Shock Troops", uni: "#8d7b5a", helm: "#5d5037", accent: "#ffcc00", names: ["Creed", "Kell", "Straken", "Gaunt", "Larkin"], bolt: true },
  zion:   { name: "Zion Resistance Cell", uni: "#212121", helm: "#111111", accent: "#4cc9f0", names: ["Trinity", "Switch", "Apoc", "Mouse", "Tank"] },
  lambda: { name: "Lambda Resistance", uni: "#1565c0", helm: "#0d47a1", accent: "#ff6d00", names: ["Barney", "Alyx", "Vance", "Odessa", "Griggs"] },
  blue:   { name: "Blue Stripes Commandos", uni: "#283593", helm: "#1a237e", accent: "#4ea8de", names: ["Roche", "Ves", "Fenn", "Talar", "Varga"], bolt: true },
  order:  { name: "Order of the Phoenix", uni: "#4a148c", helm: "#311b92", accent: "#ffd166", names: ["Kingsley", "Tonks", "Moody", "Arthur", "Molly"], bolt: true }
};
const FACTION_FIRETEAM = ["clone", "sgc", "rim", "fremen", "fleet", "marine", "guard", "zion", "lambda", "blue", "order"];
const HERO_FIRETEAM = { 53: "seal", 28: "marine", 31: "mi", 8: "sgc", 2: "clone", 34: "guard" };
const INNATE_SQUAD = { 53: 4, 28: 3, 31: 3, 8: 3, 2: 3, 34: 3 };   // military heroes deploy with a reinforcing fireteam

const SQUAD_ORDERS = [
  { id: 0, label: "REGROUP", icon: "↩", call: "ON ME! REGROUP!", reply: ["Moving to you!", "On your six!", "Falling in!"] },
  { id: 1, label: "HOLD POSITION", icon: "✋", call: "HOLD THIS POSITION!", reply: ["Holding!", "Digging in!", "Not one step back!"] },
  { id: 2, label: "FOCUS FIRE", icon: "🎯", call: "FOCUS FIRE ON THAT TARGET!", reply: ["Target marked!", "Weapons free on it!", "Lighting it up!"] },
  { id: 3, label: "ADVANCE", icon: "⬆", call: "MOVE UP! ADVANCE!", reply: ["Moving up!", "Pushing forward!", "Oorah!"] }
];
const squadState = { order: 0, ax: 0, ay: 0, focusIdx: -1, focusUid: 0, orderT: 0, wheelOpen: false, theme: "marine",
                     innateN: 0, reinforceT: 40, gunSfxT: 0, uiT: 0, alive: 0, soldiers: 0, coGunner: -1, hl: -1 };

/* === 2. CALL-INS === */
function squadThemeKey() {
  if (!player) return "marine";
  return HERO_FIRETEAM[player.cid] || FACTION_FIRETEAM[player.hero ? player.hero[1] : 0] || "marine";
}

function squadSpawnSoldier(x, y, kind, k, life, th) {
  const hp = 150 + waveNum * 14, dmg = (13 + waveNum * 2.4) * (player.might || 1);
  const slot = spawnMinion(x, y, kind, hp, dmg, 128, life, th.uni);
  mTeam[slot] = 1; mSlot[slot] = k; mBurst[slot] = 0; mAim[slot] = player.aim || 0; mTag[slot] = 3.0;
  mName[slot] = th.names[k % th.names.length];
  return slot;
}

function squadCallFireteam(x, y, source = "beacon", count = 4, life = 75) {
  if (!player) return 0;
  const key = squadThemeKey(), th = FIRETEAM_THEMES[key];
  squadState.theme = key;
  const kinds = [5, 6, 7, 8];
  for (let k = 0; k < count; k++) {
    const ang = (k / count) * Math.PI * 2;
    squadSpawnSoldier(x + Math.cos(ang) * 18, y + Math.sin(ang) * 18, kinds[k % 4], k, life, th);
  }
  if (source !== "innate") {
    spawnSpeech(x, y - 20, "RADIO: " + th.name.toUpperCase() + " INBOUND!", th.accent, 2.6);
    if (typeof fxBanner === "function") fxBanner("FIRETEAM DEPLOYED", th.name + " · tap 📻 (or Q) for orders", th.accent, 2.4);
  }
  sfx(520, 260, 0.12, "square", 0.1);
  setTimeout(() => sfx(660, 990, 0.1, "triangle", 0.1), 140);
  squadState.uiT = 0;
  return count;
}

/* === 3. ORDERS === */
function squadPickFocus() {
  let best = -1, bestScore = -1;
  for (let i = 0; i < MAX_E; i++) {
    if (!eAct[i] || !isEnemyOnScreen(i)) continue;
    const score = (eType[i] === 99 ? 1e7 : (eType[i] === 98 ? 1e6 : 0)) + eHP[i];
    if (score > bestScore) { bestScore = score; best = i; }
  }
  squadState.focusIdx = best; squadState.focusUid = best >= 0 ? eUid[best] : 0;
}

function squadIssueOrder(id) {
  if (!player) return;
  const S = squadState;
  S.order = id; S.orderT = 0;
  if (id === 1) { S.ax = player.x; S.ay = player.y; }
  if (id === 2) squadPickFocus();
  const o = SQUAD_ORDERS[id];
  spawnSpeech(player.x, player.y - 22, o.call, "#ffd166", 1.6);
  for (let m = 0; m < MAX_MINION; m++) {
    if (mAct[m]) {
      mTag[m] = Math.max(mTag[m], 1.2);
      if (mTeam[m]) { spawnSpeech(mX[m], mY[m] - 14, (mName[m] ? mName[m] + ": " : "") + o.reply[(m + id) % o.reply.length], "#c5e1a5", 1.4); break; }
    }
  }
  sfx(1250, 880, 0.035, "square", 0.08);
  setTimeout(() => sfx(980, 1320, 0.03, "square", 0.06), 60);
  squadWheelClose();
  squadState.uiT = 0;
}

/* === 4. AI (replaces js/sim.js updateMinionsSim) === */
function squadMove(m, dx, dy, simDt, mul) {
  if (!dx && !dy) return;
  mVX[m] = dx * mSpd[m] * mul; mVY[m] = dy * mSpd[m] * mul;
  mX[m] += mVX[m] * simDt; mY[m] += mVY[m] * simDt;
  mWalk[m] += simDt * (mKind[m] === 1 ? 11 : 7.5);
}
function squadMoveTo(m, tx, ty, simDt, mul, stopR) {
  const dx = tx - mX[m], dy = ty - mY[m], d = Math.hypot(dx, dy);
  if (d > stopR) squadMove(m, dx / d, dy / d, simDt, mul);
  return d;
}

function squadFireSoldier(m, kind, ang, simDt, rateMul) {
  if (mAtkCD[m] > 0) return;
  const sp = SOLDIER_SPECS[kind], th = FIRETEAM_THEMES[squadState.theme] || FIRETEAM_THEMES.marine;
  if (mBurst[m] === 0) mBurst[m] = sp.burst;
  const pellets = sp.pellets || 1;
  for (let k = 0; k < pellets; k++) {
    const a = ang + (Math.random() - 0.5) * sp.spread * 2;
    spawnProj(mX[m], mY[m], Math.cos(a) * sp.spd, Math.sin(a) * sp.spd, mDmg[m] * sp.dmg, (sp.max / sp.spd) * 1.35 + 0.1,
              kind === 7 ? 4 : 3, sp.prc, th.bolt ? 4 : 9, 0, 0, 200);
  }
  const mx = mX[m] + Math.cos(ang) * 11, my = mY[m] + Math.sin(ang) * 11;
  spawnPt(mx, my, Math.cos(ang) * 30, Math.sin(ang) * 30, 0.06, 3.2, th.bolt ? 9 : 2, 0);                        // muzzle flash
  if (!th.bolt) spawnPt(mX[m], mY[m], Math.cos(ang + 1.6) * 50, Math.sin(ang + 1.6) * 50, 0.6, 2, 8, 3);        // brass
  const now = performance.now();
  if (now - squadState.gunSfxT > 70) { squadState.gunSfxT = now; sfx(kind === 7 ? 260 : 420, 90, kind === 7 ? 0.09 : 0.035, "sawtooth", kind === 7 ? 0.09 : 0.05); }
  mBurst[m]--;
  mAtkCD[m] = (mBurst[m] > 0 ? sp.gap : sp.cd * (0.9 + Math.random() * 0.2)) / (rateMul || 1);
}

function squadMinionsSim(simDt) {
  const S = squadState;
  S.orderT += simDt;
  if (S.order === 2 && (S.focusIdx < 0 || !eAct[S.focusIdx] || eUid[S.focusIdx] !== S.focusUid)) squadPickFocus();
  const aimX = Math.cos(player.aim || 0), aimY = Math.sin(player.aim || 0);
  let alive = 0, soldiers = 0, coGunner = -1;
  if (player.inVehicle > 0) {
    for (let m = 0; m < MAX_MINION; m++) if (mAct[m] && mKind[m] >= 5 && mKind[m] <= 7) { coGunner = m; break; }
  }
  S.coGunner = coGunner;

  for (let m = 0; m < MAX_MINION; m++) {
    if (!mAct[m]) continue;
    mLife[m] -= simDt;
    if (mTag[m] > 0) mTag[m] -= simDt;
    if (mLife[m] <= 0 || mHP[m] <= 0) {
      if (mTeam[m] && mHP[m] <= 0) spawnSpeech(mX[m], mY[m] - 12, "MAN DOWN! " + (mName[m] || ""), "#ff5252", 1.4);
      mAct[m] = 0; mTeam[m] = 0; spawnParticles(mX[m], mY[m], 4);
      continue;
    }
    alive++;
    if (mAtkCD[m] > 0) mAtkCD[m] = Math.max(0, mAtkCD[m] - simDt);
    const kind = mKind[m], soldier = kind >= 5;
    if (soldier) soldiers++;

    // --- vehicle co-gunner rides with the player and mans the gun
    if (m === coGunner) {
      mX[m] = player.x - 7; mY[m] = player.y - 9;
      let tgt = -1, bd = 300;
      for (let j = 0; j < MAX_E; j++) { if (!eAct[j]) continue; const d = Math.hypot(eX[j] - mX[m], eY[j] - mY[m]); if (d < bd) { bd = d; tgt = j; } }
      if (tgt >= 0) {
        const a = Math.atan2(eY[tgt] - mY[m], eX[tgt] - mX[m]);
        mAim[m] = lerpAng(mAim[m], a, Math.min(1, simDt * 14));
        squadFireSoldier(m, kind === 7 ? 7 : 6, mAim[m], simDt, 1.5);
      }
      continue;
    }

    // --- home point & engagement envelope from the current order
    const formAng = m * 1.15 + (S.order === 0 ? runTime * 0.8 : 0);
    let hx, hy, engageR, leashR;
    if (S.order === 1) { hx = S.ax + Math.cos(formAng) * 34; hy = S.ay + Math.sin(formAng) * 34; engageR = 240; leashR = 95; }
    else if (S.order === 3) {
      const rx = player.x + aimX * 230, ry = player.y + aimY * 230;
      hx = rx + Math.cos(formAng) * 40; hy = ry + Math.sin(formAng) * 40; engageR = 430; leashR = 1e9;
    } else { hx = player.x + Math.cos(formAng) * 44; hy = player.y + Math.sin(formAng) * 44; engageR = 360; leashR = 270; }

    let bestE = -1, bestD = engageR;
    if (S.order === 2 && S.focusIdx >= 0) { bestE = S.focusIdx; bestD = Math.hypot(eX[bestE] - mX[m], eY[bestE] - mY[m]); }
    else {
      const cx = S.order === 1 ? S.ax : mX[m], cy = S.order === 1 ? S.ay : mY[m];
      for (let j = 0; j < MAX_E; j++) {
        if (!eAct[j] || eLevitate[j] > 0) continue;
        const d = Math.hypot(eX[j] - cx, eY[j] - cy);
        if (d < bestD) { bestD = d; bestE = j; }
      }
      if (bestE >= 0) bestD = Math.hypot(eX[bestE] - mX[m], eY[bestE] - mY[m]);
    }
    const homeD = Math.hypot(hx - mX[m], hy - mY[m]);
    const leashBreak = S.order !== 2 && homeD > leashR;

    if (soldier) {
      // contact damage: soldiers can be overrun
      for (let j = 0; j < MAX_E; j++) {
        if (eAct[j] && !eDummy[j] && Math.abs(eX[j] - mX[m]) < 14 && Math.abs(eY[j] - mY[m]) < 14) mHP[m] -= (eType[j] >= 98 ? 40 : 14) * simDt;
      }
      const sp = SOLDIER_SPECS[kind];
      if (bestE >= 0 && !leashBreak) {
        const dx = eX[bestE] - mX[m], dy = eY[bestE] - mY[m], d = Math.hypot(dx, dy) || 1, ang = Math.atan2(dy, dx);
        mAim[m] = lerpAng(mAim[m], ang, Math.min(1, simDt * 12));
        let mvx = 0, mvy = 0;
        if (d > sp.max) { mvx = dx / d; mvy = dy / d; }
        else if (d < sp.min) { mvx = -dx / d * 0.7; mvy = -dy / d * 0.7; }
        if (S.order === 1) {
          if (homeD > 60) { mvx = (hx - mX[m]) / homeD; mvy = (hy - mY[m]) / homeD; }
          else if (d > sp.max) { mvx = 0; mvy = 0; }
        }
        squadMove(m, mvx, mvy, simDt, 1);
        if (d <= sp.max * 1.15) squadFireSoldier(m, kind, mAim[m], simDt, 1);
      } else {
        squadMoveTo(m, hx, hy, simDt, leashBreak ? 1.15 : 0.85, 8);
        mAim[m] = lerpAng(mAim[m], S.order === 3 ? (player.aim || 0) : Math.atan2(mY[m] - player.y, mX[m] - player.x), Math.min(1, simDt * 6));
      }
      continue;
    }

    // --- original companions (0 swordsman, 1 hound, 2 bowman, 3 knight, 4 bone golem), now order-aware
    if (bestE >= 0 && !leashBreak) {
      const dx = eX[bestE] - mX[m], dy = eY[bestE] - mY[m], d = Math.hypot(dx, dy) || 1, ang = Math.atan2(dy, dx);
      mAim[m] = ang;
      if (kind === 2) {
        if (d > 135 && !(S.order === 1 && homeD > 60)) squadMove(m, dx / d, dy / d, simDt, 1);
        else if (d < 75) squadMove(m, -dx / d, -dy / d, simDt, 0.65);
        else if (S.order === 1 && homeD > 60) squadMoveTo(m, hx, hy, simDt, 1, 8);
        if (mAtkCD[m] <= 0 && d < 300) {
          mAtkCD[m] = 0.82;
          spawnProj(mX[m], mY[m], Math.cos(ang) * 380, Math.sin(ang) * 380, mDmg[m], 0.85, 5, 1, 4, 0, 0, 75);
          sfx(640, 280, 0.04, "triangle", 0.09);
        }
      } else {
        const eRad = eType[bestE] === 99 ? 22 : 12;
        const reach = mRad[m] + eRad + 6;
        const mayChase = S.order !== 1 || Math.hypot(eX[bestE] - S.ax, eY[bestE] - S.ay) < leashR + 40;
        if (d > reach * 0.85) {
          if (mayChase) squadMove(m, dx / d, dy / d, simDt, 1);
          else squadMoveTo(m, hx, hy, simDt, 1, 8);
        }
        if (d <= reach && mAtkCD[m] <= 0) {
          mAtkCD[m] = kind === 1 ? 0.34 : (kind === 4 ? 0.92 : 0.52);
          if (kind === 4) {
            spawnBlastWave(mX[m], mY[m], 62, mCol[m]);
            sfx(110, 42, 0.18, "sawtooth", 0.24);
            for (let k = 0; k < MAX_E; k++) {
              if (!eAct[k]) continue;
              if (Math.hypot(eX[k] - mX[m], eY[k] - mY[m]) <= 64) {
                eHP[k] -= mDmg[m]; eStun[k] = Math.max(eStun[k], 0.85);
                spawnDmg(eX[k], eY[k], mDmg[m], true);
                if (eHP[k] <= 0) killEnemy(k, false);
              }
            }
          } else {
            eHP[bestE] -= mDmg[m];
            eScarAng[bestE] = ang + 0.4; eScarHeat[bestE] = 0.85;
            if (kind === 1) { eBleed[bestE] = 1; eBleedRate[bestE] = eMax[bestE] * 0.08; eSlow[bestE] = 1.5; }
            if ((kind === 0 || kind === 3) && Math.random() < 0.28 && eArmsLost[bestE] < 2) {
              eArmsLost[bestE]++;
              spawnGroundLimb(eX[bestE], eY[bestE], "#ff5252", 1);
            }
            spawnDmg(eX[bestE], eY[bestE], mDmg[m], kind === 3);
            sfx(260, 110, 0.045, "triangle", 0.11);
            if (eHP[bestE] <= 0) killEnemy(bestE, false, (kind === 0 || kind === 3) ? ang : null, mCol[m]);
          }
          mHP[m] -= (eType[bestE] >= 98 ? 14 : 5);
        }
      }
    } else {
      squadMoveTo(m, hx, hy, simDt, leashBreak ? 1.1 : 0.8, 8);
    }
  }
  S.alive = alive; S.soldiers = soldiers;
}

/* === 5. INNATE FIRETEAMS FOR MILITARY HEROES (reinforce every 40 s) === */
function squadStep(simDt) {
  const S = squadState;
  if (!S.innateN || player.noSpawns) return;
  S.reinforceT -= simDt;
  if (S.reinforceT > 0) return;
  S.reinforceT = 40;
  const have = new Set();
  for (let m = 0; m < MAX_MINION; m++) if (mAct[m] && mTeam[m] === 2) have.add(mSlot[m]);
  const th = FIRETEAM_THEMES[S.theme] || FIRETEAM_THEMES.marine, kinds = [5, 6, 7, 8];
  let sent = 0;
  for (let k = 0; k < S.innateN; k++) {
    if (have.has(k)) continue;
    const a = Math.random() * Math.PI * 2;
    const slot = squadSpawnSoldier(player.x + Math.cos(a) * 60, player.y + Math.sin(a) * 60, kinds[k % 4], k, 1e6, th);
    mTeam[slot] = 2; sent++;
  }
  if (sent) spawnSpeech(player.x, player.y - 26, `REINFORCEMENTS: ${sent} x ${th.name.toUpperCase()}`, th.accent, 2.0);
}

/* === 6. RENDERING === */
function squadRenderMinions() {
  const th = FIRETEAM_THEMES[squadState.theme] || FIRETEAM_THEMES.marine;
  for (let i = 0; i < MAX_MINION; i++) {
    if (!mAct[i]) continue;
    const kind = mKind[i], rad = mRad[i] || 10;
    ctx.save();
    ctx.translate(mX[i], mY[i]);
    ctx.fillStyle = mCol[i] || "#b388ff";
    if (kind >= 5) {
      const st = Math.sin(mWalk[i]) * 2;
      ctx.fillStyle = "#263238"; ctx.fillRect(-3.5, 4 + st * 0.3, 2.6, 5); ctx.fillRect(0.9, 4 - st * 0.3, 2.6, 5);
      ctx.fillStyle = mCol[i]; ctx.fillRect(-4.5, -4, 9, 9);
      ctx.fillStyle = "rgba(0,0,0,0.28)"; ctx.fillRect(-4.5, -1, 9, 2.4);
      ctx.save(); ctx.rotate(mAim[i]);
      const len = kind === 7 ? 15 : (kind === 6 ? 12 : (kind === 8 ? 9 : 11));
      ctx.fillStyle = "#1c1c1c"; ctx.fillRect(2, kind === 6 ? -1.6 : -1.1, len, kind === 6 ? 3.2 : 2.2);
      if (kind === 7) { ctx.fillStyle = "#37474f"; ctx.fillRect(6, -2.8, 4, 1.4); }
      ctx.restore();
      if (th.helm === th.uni && th.uni === "#eceff1") {          // full-face clone bucket
        ctx.fillStyle = "#eceff1"; ctx.beginPath(); ctx.arc(0, -7, 3.8, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = "#111"; ctx.fillRect(-2.6, -7.8, 5.2, 1.3); ctx.fillStyle = th.accent; ctx.fillRect(-0.6, -10.4, 1.2, 2.6);
      } else {
        ctx.fillStyle = "#e0ac69"; ctx.beginPath(); ctx.arc(0, -7, 3.3, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = th.helm; ctx.beginPath(); ctx.arc(0, -7.6, 3.8, Math.PI, 0); ctx.fill(); ctx.fillRect(-3.8, -7.9, 7.6, 1.5);
      }
      ctx.fillStyle = th.accent; ctx.fillRect(-1, -2.6, 2, 2);
      if (mTag[i] > 0 && mName[i]) {
        ctx.globalAlpha = Math.min(1, mTag[i]); ctx.fillStyle = th.accent; ctx.font = "bold 6.5px monospace"; ctx.textAlign = "center";
        ctx.fillText(mName[i] + " · " + SOLDIER_SPECS[kind].role, 0, -15); ctx.globalAlpha = 1;
      }
    } else if (kind === 4) {
      ctx.fillRect(-16, -14, 32, 26);
      ctx.beginPath(); ctx.arc(0, -18, 9, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "#00ff88"; ctx.fillRect(-4, -6, 8, 4);
    } else if (kind === 3) {
      ctx.fillRect(-11, -10, 22, 20);
      ctx.beginPath(); ctx.arc(0, -12, 6.5, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = "#ffd166"; ctx.lineWidth = 1.4; ctx.strokeRect(-11, -10, 22, 20);
    } else if (kind === 1) {
      ctx.beginPath(); ctx.ellipse(0, 0, rad + 4, rad, 0, 0, Math.PI * 2); ctx.fill();
    } else {
      ctx.fillRect(-5, -6, 10, 12);
      ctx.beginPath(); ctx.arc(0, -9, 4.8, 0, Math.PI * 2); ctx.fill();
    }
    if (mHP[i] < mMax[i]) {
      ctx.fillStyle = "rgba(0,0,0,0.6)"; ctx.fillRect(-12, -18, 24, 2.5);
      ctx.fillStyle = "#00ff88"; ctx.fillRect(-12, -18, 24 * Math.max(0, mHP[i] / mMax[i]), 2.5);
    }
    ctx.restore();
  }
}

function squadRenderWorld(c) {
  const S = squadState;
  if (!S.alive || !player) return;
  c.save();
  if (S.order === 1) {
    c.strokeStyle = "rgba(255,209,102,0.75)"; c.lineWidth = 1.5; c.setLineDash([4, 4]);
    c.beginPath(); c.arc(S.ax, S.ay, 38, 0, Math.PI * 2); c.stroke(); c.setLineDash([]);
    c.fillStyle = "#ffd166"; c.fillRect(S.ax - 0.8, S.ay - 16, 1.6, 16);
    c.beginPath(); c.moveTo(S.ax + 0.8, S.ay - 16); c.lineTo(S.ax + 9, S.ay - 12.5); c.lineTo(S.ax + 0.8, S.ay - 9); c.fill();
  } else if (S.order === 2 && S.focusIdx >= 0 && eAct[S.focusIdx]) {
    const fx = eX[S.focusIdx], fy = eY[S.focusIdx], r = (eType[S.focusIdx] === 99 ? 28 : 17) + Math.sin(runTime * 8) * 2;
    c.translate(fx, fy); c.rotate(runTime * 2);
    c.strokeStyle = "#ff1744"; c.lineWidth = 1.8;
    c.beginPath(); c.arc(0, 0, r, 0, Math.PI * 2); c.stroke();
    for (let k = 0; k < 4; k++) { c.rotate(Math.PI / 2); c.beginPath(); c.moveTo(r - 5, 0); c.lineTo(r + 6, 0); c.stroke(); }
  } else if (S.order === 3) {
    const a = player.aim || 0, rx = player.x + Math.cos(a) * 230, ry = player.y + Math.sin(a) * 230;
    c.translate(rx, ry); c.rotate(a);
    c.strokeStyle = `rgba(0,230,118,${0.45 + 0.3 * Math.sin(runTime * 6)})`; c.lineWidth = 2.2;
    for (let k = 0; k < 3; k++) { c.beginPath(); c.moveTo(-12 + k * 9, -8); c.lineTo(-4 + k * 9, 0); c.lineTo(-12 + k * 9, 8); c.stroke(); }
  }
  c.restore();
}

/* === 7. RADIAL WHEEL UI (tap, press-drag-release, or keys Q / 1-4) === */
function squadEnsureUI() {
  if (document.getElementById("squadBtn")) return;
  const btn = document.createElement("button");
  btn.id = "squadBtn"; btn.innerHTML = `📻<span id="squadBadge">0</span>`;
  btn.title = "Squad orders (Q) · hold & drag to pick";
  document.body.appendChild(btn);
  const wheel = document.createElement("div");
  wheel.id = "squadWheel";
  const R = 112, r0 = 34;
  const wedges = [{ id: 3, a: -90 }, { id: 2, a: 0 }, { id: 0, a: 90 }, { id: 1, a: 180 }];
  let svg = `<svg viewBox="-130 -130 260 260" width="260" height="260">`;
  wedges.forEach(w => {
    const a0 = (w.a - 45) * Math.PI / 180, a1 = (w.a + 45) * Math.PI / 180;
    const p = (rr, a) => `${(Math.cos(a) * rr).toFixed(1)},${(Math.sin(a) * rr).toFixed(1)}`;
    const o = SQUAD_ORDERS[w.id], am = w.a * Math.PI / 180;
    svg += `<g class="sqw" data-id="${w.id}"><path d="M${p(r0, a0)} L${p(R, a0)} A${R},${R} 0 0 1 ${p(R, a1)} L${p(r0, a1)} A${r0},${r0} 0 0 0 ${p(r0, a0)} Z"/>` +
           `<text x="${(Math.cos(am) * 72).toFixed(1)}" y="${(Math.sin(am) * 72 - 4).toFixed(1)}" class="ico">${o.icon}</text>` +
           `<text x="${(Math.cos(am) * 72).toFixed(1)}" y="${(Math.sin(am) * 72 + 14).toFixed(1)}" class="lbl">${o.label}</text></g>`;
  });
  svg += `<circle r="${r0 - 4}" class="hub"/><text y="4" class="hubtxt" id="squadHubTxt">ORDERS</text></svg>`;
  wheel.innerHTML = svg;
  document.body.appendChild(wheel);

  wheel.querySelectorAll(".sqw").forEach(g => {
    g.addEventListener("pointerup", e => { e.stopPropagation(); squadIssueOrder(+g.dataset.id); });
  });
  wheel.addEventListener("pointerdown", e => { if (e.target === wheel) { e.stopPropagation(); squadWheelClose(); } });

  let drag = null;
  btn.addEventListener("pointerdown", e => {
    e.preventDefault(); e.stopPropagation();
    if (squadState.wheelOpen) { squadWheelClose(); return; }
    squadWheelOpen();
    drag = { id: e.pointerId, x: e.clientX, y: e.clientY, moved: false };
  });
  window.addEventListener("pointermove", e => {
    if (!drag || e.pointerId !== drag.id || !squadState.wheelOpen) return;
    if (Math.hypot(e.clientX - drag.x, e.clientY - drag.y) > 28) drag.moved = true;
    squadHighlight(squadWedgeAt(e.clientX, e.clientY));
  });
  window.addEventListener("pointerup", e => {
    if (!drag || e.pointerId !== drag.id) return;
    const moved = drag.moved; drag = null;
    if (moved && squadState.wheelOpen) {
      const id = squadWedgeAt(e.clientX, e.clientY);
      if (id >= 0) squadIssueOrder(id); else squadWheelClose();
    }
  });
  window.addEventListener("keydown", e => {
    if (!runActive || !player || runPaused) return;
    if (e.code === "KeyQ") { squadState.wheelOpen ? squadWheelClose() : (squadState.alive ? squadWheelOpen() : null); }
    const map = { Digit1: 1, Digit2: 2, Digit3: 3, Digit4: 0 };
    if (e.code in map && squadState.alive) squadIssueOrder(map[e.code]);
  });
}

function squadWedgeAt(x, y) {
  const dx = x - W / 2, dy = y - H / 2, d = Math.hypot(dx, dy);
  if (d < 30 || d > 150) return -1;
  const a = Math.atan2(dy, dx) * 180 / Math.PI;
  if (a >= -135 && a < -45) return 3;
  if (a >= -45 && a < 45) return 2;
  if (a >= 45 && a < 135) return 0;
  return 1;
}
function squadHighlight(id) {
  if (id === squadState.hl) return;
  squadState.hl = id;
  document.querySelectorAll("#squadWheel .sqw").forEach(g => g.classList.toggle("hl", +g.dataset.id === id));
  const t = document.getElementById("squadHubTxt");
  if (t) t.textContent = id >= 0 ? SQUAD_ORDERS[id].icon : "ORDERS";
}
function squadWheelOpen() {
  squadEnsureUI();
  squadState.wheelOpen = true; squadState.hl = -2; squadHighlight(-1);
  document.getElementById("squadWheel").classList.add("open");
  document.querySelectorAll("#squadWheel .sqw").forEach(g => g.classList.toggle("cur", +g.dataset.id === squadState.order));
  if (typeof fxState !== "undefined") fxState.uiSlow = 0.3;
  sfx(700, 1000, 0.05, "sine", 0.06);
}
function squadWheelClose() {
  squadState.wheelOpen = false;
  const w = document.getElementById("squadWheel");
  if (w) w.classList.remove("open");
  if (typeof fxState !== "undefined") fxState.uiSlow = 1;
}

function squadFrame(rawDt) {
  const S = squadState;
  S.uiT -= rawDt;
  if (S.uiT > 0) return;
  S.uiT = 0.2;
  const show = runActive && !!player && S.alive > 0;
  let btn = document.getElementById("squadBtn");
  if (!btn && !show) return;
  squadEnsureUI(); btn = document.getElementById("squadBtn");
  btn.style.display = show ? "flex" : "none";
  btn.classList.toggle("flip", !!opts.hudFlip);
  if (!show) { if (S.wheelOpen) squadWheelClose(); return; }
  const badge = document.getElementById("squadBadge");
  if (badge) badge.textContent = SQUAD_ORDERS[S.order].icon + " " + S.alive;
}

function squadReset() {
  const S = squadState;
  S.order = 0; S.focusIdx = -1; S.focusUid = 0; S.orderT = 0; S.innateN = 0; S.reinforceT = 40; S.alive = 0; S.soldiers = 0; S.coGunner = -1;
  mTeam.fill(0); mTag.fill(0); mBurst.fill(0);
  squadWheelClose();
}

V10.onRunStart.push(function squadRunStart(p) {
  squadReset();
  squadState.theme = squadThemeKey();
  const n = INNATE_SQUAD[p.cid] || 0;
  if (n && !p.noSpawns) {
    squadState.innateN = n;
    const th = FIRETEAM_THEMES[squadState.theme], kinds = [5, 6, 7, 8];
    for (let k = 0; k < n; k++) {
      const a = (k / n) * Math.PI * 2;
      const slot = squadSpawnSoldier(p.x + Math.cos(a) * 30, p.y + Math.sin(a) * 30, kinds[k % 4], k, 1e6, th);
      mTeam[slot] = 2;
    }
    setTimeout(() => { if (player === p) spawnSpeech(p.x, p.y - 30, th.name.toUpperCase() + " DEPLOYED WITH YOU · 📻 FOR ORDERS", th.accent, 2.6); }, 900);
  }
});
V10.onRunReset.push(function squadRunReset() { squadReset(); });
V10.onStep.push(squadStep);
V10.onFrame.push(squadFrame);
V10.onRenderWorld.push(squadRenderWorld);
// EOF:js/squad.js
