// FILE: js/saberforms.js
// PART: v11 module 1 of 1
// DETAIL: Lightsaber Form Engine. Replaces the old sinusoidal blade flourish + 360-degree proximity spin with real,
//         strike-based swordplay: every blade runs guard -> wind-up -> strike -> follow-through, aimed at an actual
//         enemy, alternating cut directions, chaining from target to target. The seven canon Forms (Shii-Cho,
//         Makashi, Soresu, Ataru, Shien / Djem So, Niman, Juyo / Vaapad) each have their own guard, moves and
//         signature techniques (Sarlacc Sweep, Makashi lunge, Soresu parry-riposte, Hawk-Bat Swoop + Saber Swarm,
//         Falling Avalanche, Shien redirect, Pushing Slash / Draw Closer, Juyo staccato, saberstaff twirls,
//         Grievous buzzsaw). Every saber hero walks a film-accurate path from an early-career form to their prime
//         form as the weapon levels up (Luke: A New Hope Shii-Cho -> Dagobah Ataru -> Cloud City Djem So ->
//         Return of the Jedi Djem So mastery). Also: swept-arc blade collision (fast strikes can't tunnel), hit modes
//         (touch / cut / heavy / thrust / flurry), ignition & stowed hilts, blade motion trails, procedural hum /
//         swing / sizzle / clash audio and form-unlock banners.
//         Research notes (Wookieepedia / lightsaber-form references): see CHANGELOG_v11.md.

"use strict";

/* === 0. MATH HELPERS === */
const SF_TAU = Math.PI * 2;
function sfWrap(a) { a = (a + Math.PI) % SF_TAU; if (a < 0) a += SF_TAU; return a - Math.PI; }
function sfLerp(a, b, t) { return a + (b - a) * t; }
function sfLerpAng(a, b, t) { return a + sfWrap(b - a) * t; }
function sfClamp(v, lo, hi) { return v < lo ? lo : (v > hi ? hi : v); }
const SF_EASE = {
  lin: t => t,
  out: t => 1 - (1 - t) * (1 - t),
  io: t => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),   // fastest mid-swing = at the target
  snap: t => 1 - Math.pow(1 - t, 3)
};
// Screen-space angle authored for a hero facing right (e.g. "blade raised overhead" = -PI/2), mirrored smoothly
// as the hero turns to face left, so raised / behind-the-head guards read correctly on the front-facing sprites.
function sfAbs(aRight, facing) { return sfLerpAng(aRight, Math.PI - aRight, (1 - Math.cos(facing)) * 0.5); }

/* === 1. GUARD POSES (relative to facing unless *Abs) === */
// arm = where the sword hand sits around the body, blade = blade direction, reach = hand distance (px),
// len = blade foreshortening (raised blades look shorter from above), grip 1 one-handed / 2 two-handed / 3 reverse.
const SF_POSES = {
  mid:    { arm: 0.42, blade: -0.55, reach: 8.0, len: 1.0, grip: 2 },                                        // Shii-Cho / Niman ready
  soresu: { arm: -1.9, armAbs: true, blade: -2.3, bladeAbs: true, reach: 5.5, len: 0.78, grip: 1, off: "front" }, // Obi-Wan: blade high behind the head
  garde:  { arm: 0.16, blade: -0.05, reach: 10.0, len: 1.0, grip: 1, off: "back" },                           // Makashi en garde, point on target
  ataru:  { arm: 0.95, blade: -1.62, bladeAbs: true, reach: 6.0, len: 0.74, grip: 2 },                         // vertical blade by the shoulder
  djemso: { arm: 0.62, blade: -1.2, bladeAbs: true, reach: 7.0, len: 0.82, grip: 2 },                          // two-handed high guard
  vader:  { arm: 0.3, blade: -0.72, reach: 8.5, len: 1.0, grip: 1, off: "fist" },                              // upright, blade angled at the foe
  juyo:   { arm: -1.2, armAbs: true, blade: 3.36, bladeAbs: true, reach: 5.5, len: 0.9, grip: 2 },             // Vaapad high guard, blade over the head
  shien:  { arm: 0.7, blade: 2.7, reach: 7.5, len: 1.0, grip: 3 },                                             // reverse grip, blade along the forearm
  staff:  { arm: 0.1, blade: 1.45, reach: 7.5, len: 1.0, grip: 2 },                                            // saberstaff across the body
  low:    { arm: 0.55, blade: 0.62, reach: 8.0, len: 1.0, grip: 1 }                                            // relaxed low guard (swords)
};
const SF_STOW = { arm: 1.35, blade: 1.9, reach: 5.0, len: 0 };     // hilt lowered to the belt
const SF_SLOT_ARM = [0, -0.62, 0.95, -1.15];                        // Jar'Kai / Grievous: each extra arm guards its own sector

/* === 2. MOVES (seconds at tempo 1.0) === */
// k: slash | quick | diag | overhead | thrust | spin | leap | push(slash + Force push)
const SF_MOVES = {
  F: { k: "slash", side: 1, arc: 2.05, wind: 0.085, strike: 0.12, rec: 0.085, lunge: 5, dmg: 1.0, cut: 0.2 },
  B: { k: "slash", side: -1, arc: 2.05, wind: 0.085, strike: 0.12, rec: 0.085, lunge: 5, dmg: 1.0, cut: 0.2 },
  f: { k: "quick", side: 1, arc: 1.2, wind: 0.04, strike: 0.07, rec: 0.045, lunge: 3, dmg: 0.72, cut: 0.28, hitCD: 0.07 },
  b: { k: "quick", side: -1, arc: 1.2, wind: 0.04, strike: 0.07, rec: 0.045, lunge: 3, dmg: 0.72, cut: 0.28, hitCD: 0.07 },
  D: { k: "diag", side: 1, arc: 2.3, wind: 0.1, strike: 0.11, rec: 0.1, lunge: 6, dmg: 1.15, cut: 0.8 },
  O: { k: "overhead", side: 1, wind: 0.17, strike: 0.085, rec: 0.17, lunge: 9, dmg: 1.9 },
  T: { k: "thrust", side: 1, wind: 0.08, strike: 0.065, rec: 0.13, ext: 13, lunge: 10, dmg: 1.55, crit: 0.15 },
  S: { k: "spin", side: 1, wind: 0.06, strike: 0.36, rec: 0.1, turns: 1.08, lunge: 0, dmg: 1.0, cut: 0.06 },
  L: { k: "leap", side: 1, arc: 2.4, wind: 0.07, strike: 0.13, rec: 0.13, lunge: 22, hop: 50, dmg: 1.3, cut: 0.72 },
  P: { k: "push", side: 1, arc: 1.9, wind: 0.08, strike: 0.11, rec: 0.16, lunge: 5, dmg: 1.0, cut: 0.25 }
};

/* === 3. THE FORMS === */
const SF_BASE_FORMS = {
  shiicho: { num: "I", name: "Shii-Cho", way: "Way of the Sarlacc", pose: "mid", tempo: 0.95, combo: "FBF_", sweep: 4, deflect: 0.0, fin: "D",
             tech: "Sarlacc Sweep" },
  makashi: { num: "II", name: "Makashi", way: "Way of the Ysalamiri", pose: "garde", tempo: 1.05, combo: "TfTb", elite: "T", riposte: "T",
             deflect: 0.03, crit: 0.08, fin: "T", tech: "Lunge & Riposte" },
  soresu:  { num: "III", name: "Soresu", way: "Way of the Mynock", pose: "soresu", tempo: 1.12, combo: "fb_", riposte: "f", deflect: 0.15,
             parryK: 1.4, reachK: 0.94, fin: "D", dmgK: 1.5, tech: "Circle of Shelter" },
  ataru:   { num: "IV", name: "Ataru", way: "Way of the Hawk-Bat", pose: "ataru", tempo: 1.12, combo: "X_", leap: true, deflect: -0.04, fin: "O",
             dmgK: 0.9, tech: "Hawk-Bat Swoop & Saber Swarm" },
  shien:   { num: "V", name: "Shien", way: "Way of the Krayt Dragon", pose: "shien", tempo: 1.0, combo: "fBT_", redirect: true, riposte: "F",
             deflect: 0.12, fin: "D", dmgK: 1.2, tech: "Shien Deflection" },
  djemso:  { num: "V", name: "Djem So", way: "Way of the Krayt Dragon", pose: "djemso", tempo: 1.0, combo: "FBO", elite: "O", riposte: "F",
             redirect: true, deflect: 0.06, fin: "O", dmgK: 1.45, tech: "Falling Avalanche" },
  niman:   { num: "VI", name: "Niman", way: "Way of the Rancor", pose: "mid", tempo: 1.0, combo: "FBP", pull: true, deflect: 0.05, fin: "D",
             dmgK: 1.4, tech: "Pushing Slash & Draw Closer" },
  juyo:    { num: "VII", name: "Juyo", way: "Way of the Vornskr", pose: "juyo", tempo: 1.18, combo: "W_", elite: "T", deflect: -0.04, fin: "S",
             tech: "Staccato Assault & Assured Strike" },
  vaapad:  { num: "VII", name: "Vaapad", way: "Way of the Vornskr", pose: "juyo", tempo: 1.22, combo: "WW_", elite: "T", redirect: true,
             deflect: 0.10, crit: 0.12, fin: "O", tech: "Superconducting Flurry" },
  jarkai:  { num: "VI", name: "Jar'Kai", way: "Multi-blade Niman", pose: "mid", tempo: 1.08, combo: "fbF_", deflect: 0.04, fin: "S",
             dmgK: 1.45, tech: "Relay Strikes" },
  whirl:   { num: "", name: "Whirl", way: "", pose: "low", tempo: 1.0, combo: "FBS", spin: 3, spinCd: 2.4, fin: "S", tech: "Whirl" }
};
function sfVariant(base, extra) { return Object.assign({}, SF_BASE_FORMS[base], { base }, extra); }
const SABER_FORMS = Object.assign({}, SF_BASE_FORMS, {
  djemsoRaw:   sfVariant("djemso", { tag: "Raw", tempo: 0.9, combo: "FOB_", riposte: null, redirect: false, deflect: 0.0 }),
  djemsoVader: sfVariant("djemso", { tag: "Dark Lord", tempo: 0.92, pose: "vader", combo: "FOBP", force: true }),
  vaderHall:   sfVariant("djemso", { tag: "Hallway", tempo: 0.97, pose: "vader", combo: "FOTB", force: true, lethal: true, deflect: 0.12 }),
  ataruSith:   sfVariant("ataru", { tag: "Sith", combo: "XS_", spin: 3 }),
  ataruMaster: sfVariant("ataru", { tag: "Grand Master", tempo: 1.15, combo: "XL_", spin: 3, fin: "S", dmgK: 0.8 }),
  juyoSingle:  sfVariant("juyo", { tag: "Single Blade", tempo: 1.08, dmgK: 1.3 }),
  staffAtaru:  sfVariant("ataru", { tag: "Saberstaff", staff: true, pose: "staff", combo: "FbS", spin: 3 }),
  staffJuyo:   sfVariant("juyo", { tag: "Saberstaff", staff: true, pose: "staff", combo: "WS_", spin: 3 }),
  makashiDual: sfVariant("makashi", { tag: "Twin Blades", dmgK: 0.9 }),
  jarkai4:     sfVariant("jarkai", { tag: "Four Blades" }),
  grievousFan: sfVariant("jarkai", { tag: "Buzzsaw", fan: true })
});

/* === 4. FILM-ACCURATE FORM PROGRESSION (weapon level thresholds) === */
const SABER_PATHS = {
  0: { who: "Luke Skywalker", stages: [
    { lv: 1, form: "shiicho", era: "A New Hope", title: "Tatooine Farmboy", blurb: "Ben's lessons aboard the Falcon: wide Shii-Cho sweeps on raw reflex" },
    { lv: 3, form: "ataru", era: "The Empire Strikes Back", title: "Dagobah Training", blurb: "Yoda's Ataru: leaping strikes, flips, rapid combinations" },
    { lv: 5, form: "djemsoRaw", era: "The Empire Strikes Back", title: "Cloud City Duel", blurb: "Raw Djem So mirrored from Vader: heavy two-handed cuts" },
    { lv: 7, form: "djemso", era: "Return of the Jedi", title: "Jedi Knight", prime: true, blurb: "Mastered Djem So: bolts sent back on the sail barge, Falling Avalanche in the throne room" }] },
  3: { who: "Darth Sidious", stages: [
    { lv: 1, form: "niman", era: "Attack of the Clones", title: "Supreme Chancellor", blurb: "The hidden Sith: balanced Niman laced with Force shoves" },
    { lv: 4, form: "ataruSith", era: "Revenge of the Sith", title: "The Office Ambush", blurb: "Spinning Ataru lunges that cut down three Jedi Masters" },
    { lv: 7, form: "juyo", era: "Revenge of the Sith", title: "Darth Sidious", prime: true, blurb: "Juyo unleashed: erratic, vicious staccato strikes" }] },
  55: { who: "General Grievous", stages: [
    { lv: 1, form: "makashiDual", era: "The Clone Wars", title: "Dooku's Pupil", blurb: "Two-saber Makashi precision drilled by Count Dooku" },
    { lv: 4, form: "jarkai4", era: "The Clone Wars", title: "Jedi Hunter", blurb: "Four arms, four blades: strikes in relay" },
    { lv: 7, form: "grievousFan", era: "Revenge of the Sith", title: "Utapau", prime: true, blurb: "Arms split and spin like buzzsaws as he advances" }] },
  76: { who: "Anakin Skywalker / Darth Vader", stages: [
    { lv: 1, form: "ataru", era: "Attack of the Clones", title: "Padawan Anakin", blurb: "Obi-Wan's acrobatic Ataru: fast and reckless" },
    { lv: 3, form: "djemso", era: "Revenge of the Sith", title: "The Hero With No Fear", blurb: "Djem So power duelist of the Clone Wars and Mustafar" },
    { lv: 5, form: "djemsoVader", era: "The Empire Strikes Back", title: "Darth Vader", blurb: "One-handed swats, crushing blows, Force throws" },
    { lv: 7, form: "vaderHall", era: "Rogue One", title: "The Hallway", prime: true, blurb: "Methodical and merciless: every swing a kill, every bolt swatted back" }] },
  77: { who: "Darth Maul", stages: [
    { lv: 1, form: "juyoSingle", era: "The Phantom Menace", title: "Tatooine Ambush", blurb: "One blade lit: probing Juyo strikes" },
    { lv: 3, form: "staffAtaru", era: "The Phantom Menace", title: "Duel of the Fates", blurb: "The second blade ignites: saberstaff Ataru flips and twirls" },
    { lv: 6, form: "staffJuyo", era: "The Clone Wars", title: "Siege of Mandalore", prime: true, blurb: "Saberstaff Juyo mastery: relentless double-ended staccato" }] },
  78: { who: "Mace Windu", stages: [
    { lv: 1, form: "soresu", era: "The Phantom Menace", title: "Jedi Council Master", blurb: "Soresu discipline: a tight guard nothing gets through" },
    { lv: 4, form: "shien", era: "Attack of the Clones", title: "Battle of Geonosis", blurb: "Shien sends blaster bolts straight back at the droids" },
    { lv: 7, form: "vaapad", era: "Revenge of the Sith", title: "Vaapad Master", prime: true, blurb: "Vaapad: blinding, superconducting strikes" }] },
  79: { who: "Yoda", stages: [
    { lv: 1, form: "soresu", era: "The Phantom Menace", title: "Grand Master", blurb: "Soresu economy: the shoto barely moves" },
    { lv: 4, form: "ataru", era: "Attack of the Clones", title: "Geonosis vs. Dooku", blurb: "Ataru unleashed: ricocheting leaps and flips" },
    { lv: 7, form: "ataruMaster", era: "Revenge of the Sith", title: "The Senate Duel", prime: true, blurb: "Nine centuries of Ataru: whirlwind aerial strikes" }] }
};
// Swords / energy blades that are not Star Wars lightsabers reuse the same move vocabulary, keyed by their
// existing HERO_STANCE_TABLE pattern (stage names come from that table).
const SF_PATTERN_FORM = ["shiicho", "makashi", "soresu", "ataru", "djemso", "niman", "juyo", "whirl"];
const SF_STEEL_IDS = [14, 18, 19, 24, 34, 48, 50, 71];        // drawn as steel, steel sounds
const SF_PLASMA_OFF = [18, 19, 24, 48, 50, 67, 71];           // same list the slicer uses for limb colours

/* === 5. STATE === */
const SF_PH_GUARD = 0, SF_PH_WIND = 1, SF_PH_STRIKE = 2, SF_PH_REC = 3, SF_PH_PARRY = 4, SF_PH_PAUSE = 5;
const SF_TR_N = 16;
const sfGlobal = {
  disabled: false, stepId: 0, nearStep: -1, near: [], nearN: 0, boltNear: false,
  claimed: [-1, -1, -1, -1], fanT: 0, fanCd: 0, lastBannerT: -9, hm: { kind: 0, dmg: 1, crit: 0, hitCD: 0.2, cut: 0, lethal: false },
  maxLunge: 0, lungeX: 0, lungeY: 0, humLit: 0, humSpd: 0, labelStep: -1, ctx: {}
};
for (let i = 0; i < 48; i++) sfGlobal.near.push({ j: -1, d: 0, a: 0, r: 11 });

function saberEngineOwns(w) {
  if (sfGlobal.disabled || !w) return false;
  return (typeof isSwordWeapon === "function" && isSwordWeapon(w.id)) || (w.style === "orbit" && ![12, 16, 29, 35, 44, 73].includes(w.id));
}
function saberEngineActive() { return !sfGlobal.disabled; }
function saberEngineFail(e) {
  if (sfGlobal.disabled) return;
  sfGlobal.disabled = true;
  if (window.trackProgress) window.trackProgress("Saber Form Engine disabled (fallback flourish): " + (e && e.message), true);
}
function sfIsSaberId(id) { return !!SABER_PATHS[id] || ![...SF_STEEL_IDS, 67].includes(id); }

// Which form does this weapon use right now?
function saberFormInfo(w) {
  const path = SABER_PATHS[w.id];
  if (path) {
    let idx = 0;
    for (let i = 0; i < path.stages.length; i++) if (w.lvl >= path.stages[i].lv) idx = i;
    const stg = path.stages[idx];
    return { key: stg.form, form: SABER_FORMS[stg.form], stage: stg, idx, n: path.stages.length, saber: true, who: path.who };
  }
  const tier = w.lvl >= 7 ? 2 : (w.lvl >= 4 ? 1 : 0);
  const spec = typeof getHeroStanceSpec === "function" ? getHeroStanceSpec(w.id, w.lvl, false) : { pattern: 0, stageName: "Blade Stance" };
  const key = SF_PATTERN_FORM[spec.pattern] || "makashi";
  return { key, form: SABER_FORMS[key], stage: { lv: [1, 4, 7][tier], era: "", title: spec.stageName || "Blade Stance", prime: tier === 2 },
           idx: tier, n: 3, saber: false, who: "", tempoK: 1 + 0.5 * ((spec.speedMul || 1) - 1) };
}
function saberFormLabel(info) {
  if (!info) return "";
  const F = info.form;
  if (!info.saber) return info.stage.title;
  return `Form ${F.num} ${F.name}${F.tag && F.tag !== "Raw" ? " (" + F.tag + ")" : ""}`;
}

function sfNewState(w) {
  return {
    ph: SF_PH_GUARD, t: 0, dur: 0, mv: null, q: [], ci: 0, side: 1, tgt: -1, tUid: 0, ta: 0, jit: 0,
    arm: 0, blade: 0, reach: 8, len: 0, a0: { arm: 0, blade: 0, reach: 8, len: 1 }, a1: { arm: 0, blade: 0, reach: 8, len: 1 },
    dArm: 0, dBlade: 0, lunge: 0, lungeTgt: 0, lungeAng: 0, lit: 0, idle: 0, introDone: false,
    cdSweep: 0, cdLeap: 0, cdPull: 0, nMoves: 0, struck: false, stage: -1, key: "", init: false,
    tr: new Float32Array(SF_TR_N * 6), trHead: 0, trN: 0, pv: false, pHX: 0, pHY: 0, pAng: 0, pLen: 0,
    angSpd: 0, side0: 4.5, dbl: false, pull: null, parryAng: 0, riposte: false, grip: 2, off: "",
    spinT: 0, spinRate: 0
  };
}
function saberResetAll() {
  if (!player || !Array.isArray(player.weapons)) return;
  player.weapons.forEach(w => { if (w) w.sf = null; });
  player.sfLX = 0; player.sfLY = 0;
  sfGlobal.fanT = 0; sfGlobal.fanCd = 0; sfGlobal.nearStep = -1;
  sfGlobal.claimed[0] = sfGlobal.claimed[1] = sfGlobal.claimed[2] = sfGlobal.claimed[3] = -1;
}

/* === 6. PER-STEP SHARED SCAN (nearby enemies + incoming bolts) === */
function sfScan() {
  if (sfGlobal.nearStep === sfGlobal.stepId) return;
  sfGlobal.nearStep = sfGlobal.stepId;
  let n = 0;
  const px = player.x, py = player.y, near = sfGlobal.near;
  const sdOn = typeof showdownBusy === "function" && showdownBusy();
  for (let j = 0; j < MAX_E && n < near.length; j++) {
    if (!eAct[j] || (sdOn && sdIgnore(j))) continue;          // v12 Rival Showdown: blades leave the crowd alone
    const dx = eX[j] - px, dy = eY[j] - py;
    if (dx > 300 || dx < -300 || dy > 300 || dy < -300) continue;
    const d = Math.hypot(dx, dy);
    if (d > 300) continue;
    const o = near[n++];
    o.j = j; o.d = d; o.a = Math.atan2(dy, dx); o.r = eType[j] === 99 ? 22 : (eType[j] === 3 ? 15 : 11);
  }
  sfGlobal.nearN = n;
  let bolt = false;
  for (let i = 0; i < MAX_P && !bolt; i++) {
    if (pAct[i] && pEnemy[i] && Math.abs(pX[i] - px) < 200 && Math.abs(pY[i] - py) < 200) bolt = true;
  }
  sfGlobal.boltNear = bolt;
  // v12: claims persist between steps (each blade's latest target), so twin / Jar'Kai blades spread over different foes
  for (let c = 0; c < 4; c++) { const j = sfGlobal.claimed[c]; if (j >= 0 && (!eAct[j] || eStagger[j] > 0)) sfGlobal.claimed[c] = -1; }
}
// called once per simulation step from js/sim.js before the weapon-slot loop
const sfGrazeT = new Float32Array(typeof MAX_E === "number" ? MAX_E : 4096);   // per-enemy graze timer (runTime)
function saberEngineBeginStep(simDt) {
  sfGlobal.stepId++;
  sfGlobal.maxLunge = 0; sfGlobal.lungeX = 0; sfGlobal.lungeY = 0;
  if (sfGlobal.fanT > 0) sfGlobal.fanT = Math.max(0, sfGlobal.fanT - simDt);
  if (sfGlobal.fanCd > 0) sfGlobal.fanCd = Math.max(0, sfGlobal.fanCd - simDt);
}
function saberEngineEndStep() {
  if (!player) return;
  // the body steps into strikes (visual + hitbox origin); springs back when the blade recovers
  player.sfLX = sfGlobal.lungeX; player.sfLY = sfGlobal.lungeY;
}

/* === 7. POSE MATH === */
function sfGuardPose(F, facing, slot, out) {
  const P = SF_POSES[F.pose] || SF_POSES.mid;
  const slotOff = SF_SLOT_ARM[slot] || 0;
  out.arm = (P.armAbs ? sfAbs(P.arm, facing) : facing + P.arm) + slotOff * 0.85;
  out.blade = (P.bladeAbs ? sfAbs(P.blade, facing) : facing + P.blade) + slotOff * 0.6;
  out.reach = P.reach; out.len = P.len;
  return out;
}
function sfChamber(st, mv, ta, side, F, out) {
  const k = mv.k;
  if (k === "overhead") {                       // blade raised high overhead, foreshortened
    out.arm = sfAbs(-1.35, ta); out.blade = sfAbs(-1.75, ta); out.reach = 4.0; out.len = 0.55;
  } else if (k === "thrust") {                  // pulled back, point on the target
    out.arm = ta + side * 0.3; out.blade = ta - side * 0.1; out.reach = 4.5; out.len = 1.0;
  } else if (k === "spin") {
    out.arm = ta - side * 0.75; out.blade = ta - side * 1.05; out.reach = 8.5; out.len = 1.0;
  } else if (k === "leap") {                    // crouch with the blade cocked high
    out.arm = ta - side * 0.6; out.blade = sfAbs(-1.6, ta) - side * 0.2; out.reach = 5.5; out.len = 0.7;
  } else if (k === "diag") {
    out.arm = ta - side * 0.55; out.blade = ta - side * (mv.arc * 0.5) - 0.0; out.reach = 6.5; out.len = 0.72;
  } else {                                      // slash / quick / push
    out.arm = ta - side * mv.arc * 0.3; out.blade = ta - side * mv.arc * 0.5; out.reach = 7.0; out.len = 1.0;
  }
  if (F.staff && st.useBack) out.blade += Math.PI;
  return out;
}
function sfStrikeEnd(st, mv, ta, side, F, out) {
  const k = mv.k;
  if (k === "overhead") {
    out.arm = ta + side * 0.12; out.blade = ta + side * 0.38; out.reach = 11.0; out.len = 1.08;
  } else if (k === "thrust") {
    out.arm = ta; out.blade = ta; out.reach = 4.5 + mv.ext; out.len = 1.0;
  } else if (k === "spin") {
    out.arm = st.a0.arm + side * SF_TAU * mv.turns; out.blade = st.a0.blade + side * SF_TAU * mv.turns; out.reach = 10.0; out.len = 1.05;
  } else {
    out.arm = ta + side * mv.arc * 0.32; out.blade = ta + side * (mv.arc * 0.5 + 0.22); out.reach = k === "quick" ? 8.5 : 9.0; out.len = 1.0;
  }
  if (F.staff && st.useBack) out.blade += (k === "spin" ? 0 : Math.PI);
  return out;
}

/* === 8. MAIN STEP === */
// Returns true when the engine posed + collided the weapon's blade(s) (js/sim.js then skips its legacy flourish).
function saberEngineStep(w, slot, nSlots, simDt, col) {
  if (sfGlobal.disabled || !player) return false;
  if (!w.sf) w.sf = sfNewState(w);
  const st = w.sf;
  sfScan();
  const info = saberFormInfo(w);
  const F = info.form;

  // ---- stage change: banner / intro ----
  if (st.stage !== info.idx || st.key !== info.key) {
    const upgraded = st.init && info.idx > st.stage;
    st.stage = info.idx; st.key = info.key; st.ci = 0; st.q.length = 0;
    if (upgraded) sfAnnounce(w, info, col, true);
    st.init = true;
  }
  if (sfGlobal.labelStep !== sfGlobal.stepId) {
    sfGlobal.labelStep = sfGlobal.stepId;
    player.activeStanceName = saberFormLabel(info) + (info.stage.era ? " (" + info.stage.era + ")" : "");
  }

  // ---- ignition / stowed hilt (per weapon) ----
  let nearest = 1e9, tgtNear = -1;
  for (let k = 0; k < sfGlobal.nearN; k++) { const o = sfGlobal.near[k]; if (o.d < nearest) { nearest = o.d; tgtNear = k; } }
  const wantLit = nearest < 260 || sfGlobal.boltNear || player.whirlwindTimer > 0 || sfGlobal.fanT > 0 || (player.invulnT > 0 && nearest < 400);
  if (wantLit) st.idle = 0; else st.idle += simDt;
  const prevLit = st.lit;
  if (wantLit || st.idle < 3.0) st.lit = Math.min(1, st.lit + simDt / 0.16);
  else st.lit = Math.max(0, st.lit - simDt / 0.26);
  if (prevLit < 0.05 && st.lit >= 0.05 && slot === 0) {
    sfIgnite(w, true);
    if (!st.introDone) { st.introDone = true; sfAnnounce(w, info, col, false); }
  } else if (prevLit > 0.95 && st.lit <= 0.95 && !wantLit && slot === 0) sfIgnite(w, false);

  // ---- shared per-weapon numbers ----
  const lvlK = 1 + 0.035 * (Math.min(10, w.lvl) - 1) + (w.lvl >= 10 ? 0.08 : 0);
  const haste = (player.overclockTimer > 0 ? 1.45 : 1) * (player.sandTimer > 0 ? 1.35 : 1);
  const cdrK = Math.pow(1 / Math.max(0.45, player.cdr || 1), 0.5);
  const C = sfGlobal.ctx;
  C.info = info; C.F = F; C.col = col; C.simDt = simDt;
  C.spd = F.tempo * (info.tempoK || 1) * lvlK * haste * cdrK;
  C.baseLen = (w.id === 79 ? 18 : (w.lvl >= 5 ? 28 : 23)) * (player.area || 1) * (F.reachK || 1) * (w.bladeK || 1);   // v12: shoto hilts
  C.R = 9.5 + C.baseLen;                                          // blade reach from the body centre
  C.facing = (tgtNear >= 0 && nearest < 150) ? sfGlobal.near[tgtNear].a : (player.aim || 0);
  C.kStyle = typeof getHeroKinematicStyle === "function" ? getHeroKinematicStyle(player.cid) : 4;

  // General Grievous: his own saber weapon carries extra blades in his free hands (2 at Dooku's-pupil Makashi,
  // 4 from Jar'Kai on), each with its own guard sector, target and relay timing.
  const want = (w.id === 55) ? (info.idx === 0 ? 2 : 4) : 1;
  const extraN = Math.max(0, Math.min(want, (player.armCap || 2) - (nSlots - 1)) - 1);
  const total = nSlots + extraN;
  sfStepBlade(w, st, slot, total, C, true);
  if (extraN > 0) {
    if (!st.ex) st.ex = [];
    for (let k = 0; k < extraN; k++) {
      const sub = st.ex[k] || (st.ex[k] = sfNewState(w));
      sub.lit = st.lit; sub.stage = st.stage; sub.key = st.key;
      sfStepBlade(w, sub, Math.min(3, slot + 1 + k), total, C, false);
    }
  }
  st.exN = extraN;
  w.sfExtra = extraN > 0 ? st.ex.slice(0, extraN).map(b => b.out) : null;

  // weapon-level outputs (the main blade) for render / rewind / glory
  const o = st.out;
  const prevAng = typeof w.ang === "number" ? w.ang : o.blade;
  w.armAng = o.arm; w.wristSpin = o.blade - o.arm; w.ang = o.blade;
  w.angVel = sfWrap(o.blade - prevAng) / Math.max(0.001, simDt);
  w.sfReach = o.reach; w.sfLenPx = o.len; w.sfSide = o.side; w.sfDbl = o.dbl; w.sfLit = o.lit; w.sfGrip = o.grip; w.sfOff = o.off;
  w.isDoubleBlade = o.dbl;
  return true;
}

// One blade: state machine (or skill spin / glory pose), stowed blend, lunge, swept collision, trail sample.
function sfStepBlade(w, st, slot, nSlots, C, main) {
  const F = C.F, simDt = C.simDt;
  st.grip = (SF_POSES[F.pose] || SF_POSES.mid).grip;
  st.off = (SF_POSES[F.pose] || SF_POSES.mid).off || "";
  st.dbl = (w.id === 77 || !!w.dbl) && (!!F.staff || player.whirlwindTimer > 0);     // v12: custom saberstaff too
  if (w.id === 55 && nSlots > 1) st.grip = 1;                    // one blade per hand
  const sideSign = (slot % 2 === 0) ? 1 : -1;
  st.side0 = sideSign * (nSlots === 1 && C.kStyle <= 2 ? 1.5 : 4.5) + (slot >= 2 ? -3.25 : 0);
  // a blade that was out of hand (thrown / swapped) must not sweep from its stale pose
  if (st.lastStep !== sfGlobal.stepId - 1) st.pv = false;
  st.lastStep = sfGlobal.stepId;
  if (st.cdSweep > 0) st.cdSweep -= simDt;
  if (st.cdLeap > 0) st.cdLeap -= simDt;
  if (st.cdPull > 0) st.cdPull -= simDt;

  // ---- special full-spin states (skills: whirlwind / Grievous buzzsaw / glory finisher) ----
  const gloryE = (main && slot === 0 && typeof gloryState !== "undefined" && gloryState.exec && gloryState.exec.style === "saber") ? gloryState.exec : null;
  const fanSpin = F.fan && sfGlobal.fanT > 0 && slot < 2;
  const cyclone = player.whirlwindTimer > 0 && (slot === 0 || [55, 77].includes(player.cid));
  let hmKind = 0, hmMv = null;
  if (gloryE) {
    sfGloryPose(st, F, gloryE);
  } else if (cyclone || fanSpin) {
    const rate = (fanSpin ? 19 : 15.5) * (slot % 2 === 1 ? -1 : 1);
    st.arm = sfWrap(st.arm + rate * simDt); st.blade = st.arm + 0.35 * Math.sign(rate);
    st.reach = sfLerp(st.reach, 10, Math.min(1, simDt * 12)); st.len = sfLerp(st.len, 1.05, Math.min(1, simDt * 12));
    st.ph = SF_PH_GUARD; st.q.length = 0; hmKind = 1;
    if (main && Math.random() < simDt * 7) sfSwingSfx(w, 0.7);
  } else {
    hmKind = sfRunMachine(w, st, F, C.info, slot, nSlots, simDt, C.spd, C.R, C.facing, C.col);
    hmMv = st.mv;
  }

  // stowed blend: lowered hilt while the blade is retracted
  const litK = st.lit;
  let armW = st.arm, bladeW = st.blade, reachW = st.reach;
  if (litK < 1) {
    const sa = player.aim || 0, k = 1 - litK;
    armW = sfLerpAng(armW, sa + SF_STOW.arm * sideSign, k); bladeW = sfLerpAng(bladeW, sa + SF_STOW.blade * sideSign, k);
    reachW = sfLerp(reachW, SF_STOW.reach, k);
  }
  const lenPx = C.baseLen * st.len * litK;

  // ---- lunge (body steps into the strike) ----
  if (st.lunge > sfGlobal.maxLunge) {
    sfGlobal.maxLunge = st.lunge;
    sfGlobal.lungeX = Math.cos(st.lungeAng) * st.lunge; sfGlobal.lungeY = Math.sin(st.lungeAng) * st.lunge;
  }
  const lx = player.sfLX || 0, ly = player.sfLY || 0;

  // ---- world geometry ----
  const ca = Math.cos(armW), sa2 = Math.sin(armW);
  const hxL = ca * reachW - sa2 * st.side0, hyL = sa2 * reachW + ca * st.side0;
  const hx = player.x + lx + hxL, hy = player.y + ly + hyL;
  const prevB = st.pv ? st.pAng : bladeW;
  st.angSpd = Math.abs(sfWrap(bladeW - prevB)) / Math.max(0.001, simDt);
  const o = st.out || (st.out = {});
  o.arm = armW; o.blade = bladeW; o.reach = reachW; o.len = lenPx; o.side = st.side0; o.dbl = st.dbl; o.lit = litK; o.grip = st.grip; o.off = st.off;
  o.slot = slot; o.st = st;

  // ---- swept collision (previous pose -> current pose) ----
  if (litK > 0.5 && lenPx > 4 && !gloryE) {
    const hm = sfGlobal.hm;
    sfFillHitMode(hm, hmKind, hmMv, F, w, C.info);
    hm.st = st;
    if (st.pv) sfSweep(w, st, st.pHX + player.x, st.pHY + player.y, st.pAng, st.pLen, hx, hy, bladeW, lenPx, hm, C.col);
    else sfSeg(w, hx, hy, bladeW, lenPx, hm, C.col, st);
  }
  st.pv = true; st.pHX = hx - player.x; st.pHY = hy - player.y; st.pAng = bladeW; st.pLen = lenPx;

  // ---- trail sample (sprite-local coords; the sprite itself is drawn at the lunge offset) ----
  const strikeFlag = (st.ph === SF_PH_STRIKE || cyclone || fanSpin || st.angSpd > 10) ? 1 : 0;
  const ti = st.trHead * 6;
  st.tr[ti] = hxL; st.tr[ti + 1] = hyL; st.tr[ti + 2] = bladeW; st.tr[ti + 3] = lenPx; st.tr[ti + 4] = runTime; st.tr[ti + 5] = strikeFlag;
  st.trHead = (st.trHead + 1) % SF_TR_N; st.trN = Math.min(SF_TR_N, st.trN + 1);

  sfGlobal.humLit = Math.max(sfGlobal.humLit, sfIsSaberId(w.id) ? litK : 0);
  sfGlobal.humSpd = Math.max(sfGlobal.humSpd, st.angSpd * litK);
}

function sfFillHitMode(hm, kind, mv, F, w, info) {
  hm.kind = kind; hm.dmg = 1; hm.crit = (F.crit || 0); hm.hitCD = 0.2; hm.cut = 0.2; hm.lethal = !!F.lethal;
  if (!mv || kind === 0) {
    if (kind === 1) { hm.hitCD = w.id === 77 ? 0.14 : 0.18; hm.cut = 0.06 + (Math.random() - 0.5) * 0.2; }   // cyclone / buzzsaw
    else hm.hitCD = 0.32;
    return;
  }
  hm.dmg = (mv.dmg || 1) * (F.dmgK || 1); hm.crit += mv.crit || 0;
  if (mv.hitCD) hm.hitCD = mv.hitCD;
  if (kind === 2) hm.cut = Math.PI / 2 + (Math.random() - 0.5) * 0.25;                   // vertical split
  else hm.cut = (mv.cut || 0.2) * (mv.sideUsed || 1) + (Math.random() - 0.5) * 0.18;
  if (w.id === 77) hm.hitCD = Math.min(hm.hitCD, 0.14);
}

/* === 9. THE STATE MACHINE === */
function sfTargetOk(st) {
  return st.tgt >= 0 && eAct[st.tgt] && eUid[st.tgt] === st.tUid;
}
function sfPickTarget(st, slot, R, extra) {
  let best = -1, bestS = 1e9;
  for (let k = 0; k < sfGlobal.nearN; k++) {
    const o = sfGlobal.near[k];
    if (o.d > R + o.r + extra) continue;
    let s = o.d + Math.abs(sfWrap(o.a - st.blade)) * 7;
    if (eStagger[o.j] > 0) s += 400;                               // waiting for a glory kill: leave it
    for (let c = 0; c < 4; c++) if (c !== slot && sfGlobal.claimed[c] === o.j) s += 30;
    if (s < bestS) { bestS = s; best = k; }
  }
  return best;
}
function sfCountIn(R) {
  let n = 0;
  for (let k = 0; k < sfGlobal.nearN; k++) { const o = sfGlobal.near[k]; if (o.d < R + o.r) n++; }
  return n;
}
function sfIsElite(j) { return eType[j] >= 98 || eType[j] === 3 || eFormType[j] === 1; }

function sfRunMachine(w, st, F, info, slot, nSlots, simDt, spd, R, facing, col) {
  st.t += simDt;
  // ---- Niman "Draw Closer" pull in progress ----
  if (st.pull) {
    const p = st.pull; p.t -= simDt;
    if (p.t <= 0 || !eAct[p.j] || eUid[p.j] !== p.uid) st.pull = null;
    else {
      const dx = player.x - eX[p.j], dy = player.y - eY[p.j], d = Math.hypot(dx, dy) || 1;
      if (d > 26) { const m = Math.min(d - 26, 300 * simDt); eX[p.j] += dx / d * m; eY[p.j] += dy / d * m; }
    }
  }
  // follow-through lunge decays outside strikes
  if (st.ph === SF_PH_STRIKE) st.lunge = sfLerp(st.lunge, st.lungeTgt, Math.min(1, simDt * 32));
  else st.lunge = Math.max(0, st.lunge - simDt * (st.lunge * 9 + 12));

  if (st.ph === SF_PH_GUARD || st.ph === SF_PH_PAUSE) {
    st.arm = sfWrap(st.arm); st.blade = sfWrap(st.blade);
    const g = sfGuardPose(F, facing, slot, st.a1);
    const breathe = Math.sin(runTime * 2.1 + slot * 1.7) * 0.05;
    const k = Math.min(1, simDt * 13);
    st.arm = sfLerpAng(st.arm, g.arm + breathe * 0.5, k); st.blade = sfLerpAng(st.blade, g.blade + breathe, k);
    st.reach = sfLerp(st.reach, g.reach, k); st.len = sfLerp(st.len, g.len, k);
    if (st.ph === SF_PH_PAUSE && st.t < st.dur) return 0;
    st.ph = SF_PH_GUARD;
    if (st.lit < 0.6) return 0;
    if (nSlots > 1 && slot > 0 && st.nMoves === 0 && st.t < slot * 0.09) return 0;     // Jar'Kai relay offset
    sfNextMove(w, st, F, slot, R, spd, facing);
    return 0;
  }

  const u = st.dur > 0 ? Math.min(1, st.t / st.dur) : 1;
  if (st.ph === SF_PH_WIND) {
    // keep tracking a moving target until the strike commits
    if (sfTargetOk(st)) {
      const ta = Math.atan2(eY[st.tgt] - player.y, eX[st.tgt] - player.x) + st.jit;
      st.ta = sfLerpAng(st.ta, ta, Math.min(1, simDt * 18));
      sfChamber(st, st.mv, st.ta, st.mv.sideUsed, F, st.a1);
      st.dArm = sfWrap(st.a1.arm - st.a0.arm); st.dBlade = sfWrap(st.a1.blade - st.a0.blade);
    }
    sfApply(st, SF_EASE.out(u));
    if (u >= 1) sfBeginStrike(w, st, F, spd, col);
    return 0;
  }
  if (st.ph === SF_PH_STRIKE) {
    sfApply(st, (st.mv.k === "thrust" ? SF_EASE.snap : (st.mv.k === "spin" ? SF_EASE.lin : SF_EASE.io))(u));
    const kind = st.mv.k === "overhead" ? 2 : (st.mv.k === "thrust" ? 3 : (st.mv.k === "quick" ? 4 : 1));
    if (u >= 1) sfEndStrike(w, st, F, spd, R, facing, slot, col);
    return kind;
  }
  if (st.ph === SF_PH_REC || st.ph === SF_PH_PARRY) {
    sfApply(st, SF_EASE.out(u));
    if (u >= 1) {
      if (st.ph === SF_PH_PARRY && st.parryHold > 0) { st.parryHold = 0; st.t = 0; st.dur = 0.08 / spd; st.a0 = sfSnapPose(st, st.a0); st.dArm = 0; st.dBlade = 0; return 0; }
      if (st.riposte && F.riposte) {
        st.riposte = false;
        if (sfStartMove(w, st, F, F.riposte, slot, R, spd, facing, 10)) return 0;
      }
      st.ph = SF_PH_GUARD; st.t = 0;
      sfNextMove(w, st, F, slot, R, spd, facing);
    }
    return 0;
  }
  return 0;
}
function sfSnapPose(st, o) { o.arm = st.arm; o.blade = st.blade; o.reach = st.reach; o.len = st.len; return o; }
function sfApply(st, e) {
  st.arm = st.a0.arm + st.dArm * e; st.blade = st.a0.blade + st.dBlade * e;
  st.reach = sfLerp(st.a0.reach, st.a1.reach, e); st.len = sfLerp(st.a0.len, st.a1.len, e);
  if (st.ph === SF_PH_STRIKE && st.mv && (st.mv.k === "slash" || st.mv.k === "quick" || st.mv.k === "push")) st.reach += Math.sin(e * Math.PI) * 2.2;
}

// Decide what to do next: specials first, then the form's combo string.
function sfNextMove(w, st, F, slot, R, spd, facing) {
  if (st.q.length) {
    const tok = st.q.shift();
    if (tok === "_") return sfPause(st, 0.06 + Math.random() * 0.08);
    if (sfStartMove(w, st, F, tok, slot, R, spd, facing, 0)) return;
    st.q.length = 0;
  }
  const nIn = sfCountIn(R + 4);
  // Grievous: arms split into spinning buzzsaws when crowded
  if (F.fan && slot === 0 && sfGlobal.fanCd <= 0 && nIn >= 2) {
    sfGlobal.fanT = 1.4; sfGlobal.fanCd = 5.5;
    spawnSpeech(player.x, player.y - 16, "BUZZSAW!", "#ffd166", 1.0);
    return;
  }
  // Shii-Cho Sarlacc Sweep / Ataru aerial spin / saberstaff twirl: only when genuinely surrounded
  const spinNeed = F.sweep || F.spin || 0;
  if (spinNeed && st.cdSweep <= 0 && nIn >= spinNeed && sfStartMove(w, st, F, "S", slot, R, spd, facing, 0)) {
    st.cdSweep = F.spinCd || 2.6; return;
  }
  // Ataru Hawk-Bat Swoop: leap at a target just out of reach
  if (F.leap && st.cdLeap <= 0) {
    const k = sfPickTarget(st, slot, R, 30);
    if (k >= 0 && sfGlobal.near[k].d > R * 0.75 && sfStartMove(w, st, F, "L", slot, R, spd, facing, 30)) { st.cdLeap = 1.05; return; }
  }
  // Niman Draw Closer: pull a distant foe onto the blade
  if (F.pull && st.cdPull <= 0 && sfCountIn(R + 6) === 0) {
    let best = -1, bd = 1e9;
    for (let k = 0; k < sfGlobal.nearN; k++) { const o = sfGlobal.near[k]; if (o.d > R + 20 && o.d < 150 && o.d < bd && !(eType[o.j] >= 98)) { bd = o.d; best = o.j; } }
    if (best >= 0) {
      st.pull = { j: best, uid: eUid[best], t: 0.3 }; st.cdPull = 3.6;
      player.forceHandTimer = 0.3; player.forceHandAng = Math.atan2(eY[best] - player.y, eX[best] - player.x);
      sfxTone(140, 300, 0.18, "sine", 0.12);
      return sfPause(st, 0.12);
    }
  }
  // the combo
  const k = sfPickTarget(st, slot, R, 4);
  if (k < 0) return;                                            // nothing in reach: hold the guard
  const o = sfGlobal.near[k];
  let tok = F.combo[st.ci % F.combo.length]; st.ci++;
  if (F.elite && sfIsElite(o.j) && st.nMoves % 3 === 0) tok = F.elite;
  if (F.force && st.nMoves % 5 === 4) tok = "P";
  if (tok === "_") return sfPause(st, 0.1 + Math.random() * 0.1);
  if (tok === "S") {                                            // a twirl is earned (crowded + off cooldown), never a habit
    if (st.cdSweep <= 0 && nIn >= Math.max(2, (spinNeed || 3) - 1)) st.cdSweep = Math.max(1.6, (F.spinCd || 2.6) * 0.8);
    else tok = "D";
  }
  if (tok === "W") {                                            // Juyo staccato: 3-5 unconnected-looking strikes
    const n = 3 + Math.floor(Math.random() * 3), pool = ["f", "b", "f", "b", "D", "T"];
    for (let i = 0; i < n; i++) st.q.push(pool[Math.floor(Math.random() * pool.length)]);
    if (Math.random() < 0.35) st.q.push("_");
    tok = st.q.shift();
  } else if (tok === "X") {                                     // Ataru Saber Swarm
    st.q.push("b", "f"); tok = "f";
  }
  sfStartMove(w, st, F, tok, slot, R, spd, facing, 0);
}
function sfPause(st, d) { st.ph = SF_PH_PAUSE; st.t = 0; st.dur = d; }

function sfStartMove(w, st, F, tok, slot, R, spd, facing, extra) {
  const base = SF_MOVES[tok];
  if (!base) return false;
  let k = sfTargetOk(st) ? -1 : -2;
  if (k === -1) {                                                // keep chaining on the same foe while it lives and is in reach
    const d = Math.hypot(eX[st.tgt] - player.x, eY[st.tgt] - player.y);
    if (d > R + 15 + extra || eStagger[st.tgt] > 0) k = -2;
  }
  if (k === -2) {
    const pk = sfPickTarget(st, slot, R, 4 + extra);
    if (pk < 0) return false;
    st.tgt = sfGlobal.near[pk].j; st.tUid = eUid[st.tgt];
  }
  sfGlobal.claimed[slot] = st.tgt;
  const mv = st.mvObj || (st.mvObj = {});
  Object.assign(mv, base);
  // alternate cut direction: forehand / backhand flow into each other instead of resetting
  let side = base.side;
  if (tok === "F" || tok === "f" || tok === "B" || tok === "b") side = base.side;
  else side = st.side;
  if (F.staff) st.useBack = (tok === "B" || tok === "b") ? true : (Math.random() < 0.3);
  else st.useBack = false;
  mv.sideUsed = side; st.side = -side;
  st.mv = mv;
  st.jit = F.name === "Juyo" || F.name === "Vaapad" ? (Math.random() - 0.5) * 0.7 : (Math.random() - 0.5) * 0.12;
  st.ta = Math.atan2(eY[st.tgt] - player.y, eX[st.tgt] - player.x) + st.jit;
  sfSnapPose(st, st.a0);
  sfChamber(st, mv, st.ta, side, F, st.a1);
  st.dArm = sfWrap(st.a1.arm - st.a0.arm); st.dBlade = sfWrap(st.a1.blade - st.a0.blade);
  st.ph = SF_PH_WIND; st.t = 0;
  // wind-up time scales with how far the blade has to travel (flowing combos chain almost instantly)
  const travel = Math.min(1.6, Math.abs(st.dBlade) / 1.6);
  st.dur = Math.max(0.025, mv.wind * (0.45 + 0.55 * travel)) / spd;
  st.nMoves++;
  return true;
}
function sfBeginStrike(w, st, F, spd, col) {
  const mv = st.mv, side = mv.sideUsed;
  sfSnapPose(st, st.a0);
  sfStrikeEnd(st, mv, st.ta, side, F, st.a1);
  if (mv.k === "spin") { st.dArm = side * SF_TAU * mv.turns; st.dBlade = side * SF_TAU * mv.turns; }
  else if (mv.k === "overhead") {
    // chop down from overhead THROUGH the target, the long way round if needed
    let d = sfWrap(st.a1.blade - st.a0.blade);
    if (Math.sign(d) !== side && Math.abs(d) > 2.4) d += side * SF_TAU;
    st.dBlade = d; st.dArm = sfWrap(st.a1.arm - st.a0.arm);
  } else if (mv.k === "thrust") { st.dArm = sfWrap(st.a1.arm - st.a0.arm); st.dBlade = sfWrap(st.a1.blade - st.a0.blade); }
  else {
    // a committed swing: always travel in the cut direction, never the short way back
    let d = st.a1.blade - st.a0.blade; d = sfWrap(d);
    if (Math.sign(d) !== side) d += side * SF_TAU;
    st.dBlade = d; st.dArm = sfWrap(st.a1.arm - st.a0.arm);
  }
  st.ph = SF_PH_STRIKE; st.t = 0; st.struck = false;
  st.dur = mv.strike / spd;
  st.lungeTgt = mv.lunge || 0; st.lungeAng = st.ta;
  if (mv.k === "leap" || (mv.k === "spin" && F.leap)) {
    if ((player.acrobatZ || 0) <= 0.5) { player.acrobatVZ = mv.hop || 46; player.acrobatFlip = (mv.k === "spin" || Math.random() < 0.5) ? SF_TAU : 0; }
  }
  sfSwingSfx(w, mv.k === "overhead" ? 1.25 : (mv.k === "quick" ? 0.55 : (mv.k === "spin" ? 1.1 : 0.85)));
}
function sfEndStrike(w, st, F, spd, R, facing, slot, col) {
  const mv = st.mv, side = mv.sideUsed;
  if (mv.k === "overhead") sfAvalancheImpact(w, st, col);
  if (mv.k === "push") sfPushingSlash(w, st, col);
  sfSnapPose(st, st.a0);
  st.ph = SF_PH_REC; st.t = 0;
  const chain = st.q.length > 0 || sfPickTarget(st, slot, R, 4) >= 0;
  if (mv.k === "thrust") {                                       // withdraw the point
    st.a1.arm = st.a0.arm; st.a1.blade = st.a0.blade + side * 0.08; st.a1.reach = 8.5; st.a1.len = 1;
    st.dur = (chain ? mv.rec * 0.6 : mv.rec) / spd;
  } else if (mv.k === "overhead") {                              // weight: a beat held low after the impact
    st.a1.arm = st.a0.arm; st.a1.blade = st.a0.blade + side * 0.12; st.a1.reach = st.a0.reach - 2; st.a1.len = 1;
    st.dur = mv.rec * 0.7 / spd;
  } else if (chain) {                                            // decelerating follow-through, flowing into the next cut
    st.a1.arm = st.a0.arm + side * 0.1; st.a1.blade = st.a0.blade + (mv.k === "spin" ? side * 0.2 : side * 0.3);
    st.a1.reach = st.a0.reach * 0.88 + 0.8; st.a1.len = sfLerp(st.a0.len, 1, 0.5);
    st.dur = mv.rec * 0.4 / spd;
  } else {                                                       // nothing left in reach: settle back into the guard
    sfGuardPose(F, facing, slot, st.a1);
    st.dur = mv.rec / spd;
  }
  if (mv.k === "thrust" || mv.k === "overhead" || chain) { st.dArm = st.a1.arm - st.a0.arm; st.dBlade = st.a1.blade - st.a0.blade; }
  else { st.dArm = sfWrap(st.a1.arm - st.a0.arm); st.dBlade = sfWrap(st.a1.blade - st.a0.blade); }
}

/* === 10. FORM TECHNIQUES === */
function sfAvalancheImpact(w, st, col) {
  const tipX = player.x + (player.sfLX || 0) + Math.cos(st.blade) * (st.reach + 22), tipY = player.y + (player.sfLY || 0) + Math.sin(st.blade) * (st.reach + 22);
  if (typeof spawnBlastWave === "function") spawnBlastWave(tipX, tipY, 30, col);
  let hit = 0;
  for (let k = 0; k < sfGlobal.nearN; k++) {
    const j = sfGlobal.near[k].j;
    if (!eAct[j]) continue;
    const dx = eX[j] - tipX, dy = eY[j] - tipY, d = Math.hypot(dx, dy) || 1;
    if (d < 40) {
      const push = (eType[j] >= 98 ? 5 : 15) * (player.kb || 1);
      eX[j] += dx / d * push; eY[j] += dy / d * push;
      eStun[j] = Math.max(eStun[j], eType[j] >= 98 ? 0.15 : 0.4); hit++;
    }
  }
  if (!opts.lowPart) for (let k = 0; k < 6; k++) {
    const a = Math.random() * SF_TAU, s = 25 + Math.random() * 45;
    spawnPt(tipX, tipY, Math.cos(a) * s, Math.sin(a) * s, 0.45 + Math.random() * 0.3, 3 + Math.random() * 2, 12, 5);
  }
  if (typeof fxShake === "function") fxShake(hit ? 2.6 : 1.4, 0.12);
  if (hit && typeof fxHitStop === "function") fxHitStop(0.028);
  sfxTone(88, 38, 0.15, "sawtooth", 0.16);
  playNoise(0.1, "lowpass", 420, 90, 1.1, 0.14);
}
function sfPushingSlash(w, st, col) {
  const ang = st.ta;
  player.forceHandTimer = 0.26; player.forceHandAng = ang;
  if (typeof forcePushVis !== "undefined") {
    forcePushVis.timer = 0.26; forcePushVis.maxT = 0.26; forcePushVis.x = player.x; forcePushVis.y = player.y;
    forcePushVis.ang = ang; forcePushVis.arc = 1.4; forcePushVis.maxR = 88; forcePushVis.col = col;
  }
  for (let k = 0; k < sfGlobal.nearN; k++) {
    const o = sfGlobal.near[k], j = o.j;
    if (!eAct[j] || o.d > 88 || Math.abs(sfWrap(o.a - ang)) > 0.72) continue;
    const push = (eType[j] >= 98 ? 8 : 30) * (player.kb || 1);
    eX[j] += Math.cos(o.a) * push; eY[j] += Math.sin(o.a) * push;
    eStun[j] = Math.max(eStun[j], 0.5);
    const dmg = (12 + w.lvl * 4) * (player.might || 1);
    eHP[j] -= dmg; spawnDmg(eX[j], eY[j], dmg, false);
    if (eHP[j] <= 0) killEnemy(j, false);
  }
  sfxTone(190, 75, 0.16, "sine", 0.16);
  playNoise(0.14, "bandpass", 620, 140, 1.4, 0.16);
}

/* === 11. SWEPT BLADE COLLISION === */
function sfSeg(w, hx, hy, ang, len, hm, col, st) {
  const tx = hx + Math.cos(ang) * len, ty = hy + Math.sin(ang) * len;
  sfSegTest(w, hx, hy, tx, ty, hm, col, ang);
  if (st && st.dbl) sfSegTest(w, hx, hy, hx - Math.cos(ang) * len, hy - Math.sin(ang) * len, hm, col, ang + Math.PI);
}
function sfSweep(w, st, h0x, h0y, a0, l0, h1x, h1y, a1, l1, hm, col) {
  const da = sfWrap(a1 - a0);
  const n = Math.max(1, Math.min(12, Math.ceil(Math.abs(da) / 0.16)));
  for (let i = 1; i <= n; i++) {
    const u = i / n;
    sfSeg(w, sfLerp(h0x, h1x, u), sfLerp(h0y, h1y, u), a0 + da * u, sfLerp(l0, l1, u), hm, col, st);
  }
}
function sfSegTest(w, hx, hy, tx, ty, hm, col, ang) {
  const segDX = tx - hx, segDY = ty - hy, segLenSq = segDX * segDX + segDY * segDY;
  if (segLenSq < 1) return;
  const graze = hm.kind === 0;
  for (let k = 0; k < sfGlobal.nearN; k++) {
    const o = sfGlobal.near[k], j = o.j;
    if (!eAct[j] || eScarHitCD[j] > 0) continue;
    if (graze && sfGrazeT[j] > runTime) continue;
    const ex = eX[j], ey = eY[j];
    let t = ((ex - hx) * segDX + (ey - hy) * segDY) / segLenSq;
    t = t < 0 ? 0 : (t > 1 ? 1 : t);
    const cx = hx + t * segDX, cy = hy + t * segDY;
    if (Math.hypot(ex - cx, ey - cy) > o.r + 4.5) continue;
    if (typeof bladeHitEnemy !== "function") continue;
    bladeHitEnemy(j, cx, cy, w, hm.cut, col, hm);
    // a graze (blade resting against someone between strikes) has its own timer: it must never put the
    // shared hit cooldown on a foe and so swallow the committed cut / thrust that follows a moment later
    if (graze) { eScarHitCD[j] = 0; sfGrazeT[j] = runTime + hm.hitCD; }
  }
}
// called by bladeHitEnemy (js/sim.js) for engine hits: sparks, sizzle, heavy-hit punch
function saberOnBladeHit(j, cx, cy, w, hm, killed) {
  const pal = sfPalIdx(w);
  const n = opts.lowPart ? 1 : (hm.kind >= 2 ? 5 : 3);
  for (let k = 0; k < n; k++) {
    const a = Math.random() * SF_TAU, s = 40 + Math.random() * 90;
    spawnPt(cx, cy, Math.cos(a) * s, Math.sin(a) * s, 0.12 + Math.random() * 0.12, 1.6 + Math.random() * 1.2, k === 0 ? 1 : (k === 1 ? 2 : pal), 4);
  }
  sfHitSfx(w, hm.kind, killed);
  const st = hm.st || w.sf;
  if (hm.kind === 2 && st && !st.struck) { st.struck = true; if (typeof fxShake === "function") fxShake(2.2, 0.1); }
}
function sfPalIdx(w) {
  const c = (w.bladeCol || (typeof getWeaponColor === "function" ? getWeaponColor(w.id) : "#00e5ff") || "").toLowerCase();
  if (SF_STEEL_IDS.includes(w.id)) return 7;
  if (/^#(ff|f[0-9a-f]|e[0-9a-f])[0-4]/.test(c)) return 5;          // reds
  if (/^#[0-7][0-9a-f]f/.test(c) && c.slice(1, 3) < "80") return 9;  // cyans / blues
  if (/^#[0-7][0-9a-f][c-f][0-9a-f][0-7]/.test(c)) return 10;        // greens
  if (/^#[89a-f][0-9a-f][0-6][0-9a-f][c-f]/.test(c)) return 11;      // purples
  return 0;
}

/* === 12. BLASTER DEFLECTION: parry pose, Shien redirect, Djem So riposte === */
function saberFormDeflectBonus() {
  if (sfGlobal.disabled || !player || !Array.isArray(player.weapons)) return 0;
  const w = player.weapons.find(x => x && x.enabled !== false && saberEngineOwns(x));
  if (!w) return 0;
  return saberFormInfo(w).form.deflect || 0;
}
function saberOnDeflect(i) {
  if (sfGlobal.disabled || !player) return;
  const en = player.weapons.filter(x => x.enabled !== false);
  const cap = Math.min(player.armCap || 2, en.length);
  let w = null;
  for (let s = 0; s < cap; s++) { const c = en[((player.handSlotOffset || 0) + s) % en.length]; if (saberEngineOwns(c)) { w = c; break; } }
  if (!w) return;
  if (!w.sf) w.sf = sfNewState(w);
  const st = w.sf, F = saberFormInfo(w).form;
  st.lit = 1; st.idle = 0;
  const bAng = Math.atan2(pY[i] - player.y, pX[i] - player.x);
  // sparks + clash where the bolt meets the blade
  for (let k = 0; k < (opts.lowPart ? 2 : 5); k++) {
    const a = bAng + (Math.random() - 0.5) * 2.2, s = 50 + Math.random() * 80;
    spawnPt(pX[i], pY[i], Math.cos(a) * s, Math.sin(a) * s, 0.1 + Math.random() * 0.1, 1.8, k & 1 ? 2 : 1, 4);
  }
  sfClashSfx();
  // Shien / Djem So / Vaapad: send the bolt straight back at a shooter instead of a blind bounce
  if (F.redirect) {
    const spdB = Math.hypot(pVX[i], pVY[i]) || 400;
    const back = Math.atan2(pVY[i], pVX[i]);
    let best = -1, bs = 1e9;
    for (let j = 0; j < MAX_E; j++) {
      if (!eAct[j]) continue;
      const dx = eX[j] - pX[i], dy = eY[j] - pY[i], d = Math.hypot(dx, dy);
      if (d > 460 || d < 8) continue;
      const off = Math.abs(sfWrap(Math.atan2(dy, dx) - back));
      if (off > 0.75) continue;
      const s = d * (1 + off * 1.5) - (eType[j] >= 98 ? 60 : 0);
      if (s < bs) { bs = s; best = j; }
    }
    if (best >= 0) {
      const a = Math.atan2(eY[best] - pY[i], eX[best] - pX[i]);
      pVX[i] = Math.cos(a) * spdB * 1.08; pVY[i] = Math.sin(a) * spdB * 1.08; pLife[i] = Math.max(pLife[i], 1.25);
      pDmg[i] *= 1.15;
    }
  }
  if (st.ph === SF_PH_STRIKE) return;                           // a committed strike carries the bolt away
  sfSnapPose(st, st.a0);
  const side = sfWrap(bAng - st.blade) > 0 ? -1 : 1;
  st.a1.blade = bAng + side * (Math.PI / 2 - 0.3); st.a1.arm = bAng + side * 0.35; st.a1.reach = 9; st.a1.len = 1;
  st.dArm = sfWrap(st.a1.arm - st.a0.arm); st.dBlade = sfWrap(st.a1.blade - st.a0.blade);
  st.ph = SF_PH_PARRY; st.t = 0; st.dur = 0.05 / (F.parryK || 1); st.parryHold = 1;
  st.q.length = 0;
  if (F.riposte) st.riposte = true;
}

/* === 13. GLORY FINISHER CHOREOGRAPHY === */
function saberGloryActive() { return !sfGlobal.disabled; }
function sfGloryPose(st, F, E) {
  const t = (performance.now() - E.t0) / 1000, a = E.ang, fin = F.fin || "O";
  const side = 1;
  let arm, blade, reach, len;
  if (t < 0.18) { arm = a + 0.4; blade = a - 0.5; reach = 8; len = 1; }
  else if (fin === "T") {
    if (t < 0.46) { const u = (t - 0.18) / 0.28; arm = a + 0.3; blade = a - 0.08; reach = sfLerp(8, 3.5, u); len = 1; }
    else if (t < 0.53) { arm = a; blade = a; reach = 18; len = 1; }
    else { arm = a; blade = a + 0.1; reach = 12; len = 1; }
  } else if (fin === "S") {
    if (t < 0.4) { const u = (t - 0.18) / 0.22; arm = a - 0.8 - u * 0.4; blade = a - 1.2 - u * 0.5; reach = 8; len = 1; }
    else if (t < 0.56) { const u = (t - 0.4) / 0.16; arm = a - 1.2 + u * (SF_TAU + 1.6); blade = arm - 0.3; reach = 10; len = 1.05; }
    else { arm = a + 0.6; blade = a + 1.1; reach = 9; len = 1; }
  } else if (fin === "D") {
    if (t < 0.46) { const u = SF_EASE.out((t - 0.18) / 0.28); arm = sfLerpAng(a, a - 0.8, u); blade = sfLerpAng(a, sfAbs(-1.9, a), u); reach = 6; len = sfLerp(1, 0.7, u); }
    else if (t < 0.56) { const u = SF_EASE.io((t - 0.46) / 0.1); arm = sfLerp(a - 0.8, a + 0.7, u); blade = sfLerpAng(sfAbs(-1.9, a), a + 1.3, u); reach = 10; len = sfLerp(0.7, 1, u); }
    else { arm = a + 0.7; blade = a + 1.4; reach = 9; len = 1; }
  } else {                                                         // "O": Falling Avalanche execution
    if (t < 0.46) { const u = SF_EASE.out((t - 0.18) / 0.28); arm = sfLerpAng(a + 0.4, sfAbs(-1.35, a), u); blade = sfLerpAng(a - 0.5, sfAbs(-1.75, a), u); reach = sfLerp(8, 4, u); len = sfLerp(1, 0.55, u); }
    else if (t < 0.55) { const u = SF_EASE.io((t - 0.46) / 0.09); let d = sfWrap(a + 0.35 - sfAbs(-1.75, a)); if (d < 0 && Math.abs(d) > 2.4) d += SF_TAU; blade = sfAbs(-1.75, a) + d * u; arm = sfLerpAng(sfAbs(-1.35, a), a + 0.1, u); reach = sfLerp(4, 11, u); len = sfLerp(0.55, 1.08, u); }
    else { arm = a + 0.1; blade = a + 0.45; reach = 10; len = 1.05; }
  }
  st.arm = arm; st.blade = blade + 0 * side; st.reach = reach; st.len = len; st.ph = SF_PH_GUARD; st.lit = 1;
  st.lunge = 0;
}
function saberGloryCutAngle(ang) {
  if (sfGlobal.disabled || !player) return ang + Math.PI / 2;
  const w = player.weapons[0];
  const fin = (w && saberEngineOwns(w)) ? (saberFormInfo(w).form.fin || "O") : "O";
  if (fin === "T") return null;                                   // impaled: an intact, scorched corpse
  if (fin === "S") return 0.1;                                    // waist cut
  if (fin === "D") return 0.8;
  return Math.PI / 2;                                             // split top to bottom
}

/* === 14. BANNERS / HUD === */
function sfAnnounce(w, info, col, upgraded) {
  const F = info.form, stg = info.stage;
  if (info.saber) {
    const head = `FORM ${F.num} · ${F.name.toUpperCase()}${stg.prime ? " — PRIME" : ""}`;
    const sub = `${stg.era} · ${stg.title}${F.tech ? " · " + F.tech : ""}`;
    if (typeof fxBanner === "function") fxBanner(head, sub, col || "#ffd166", upgraded ? 3.0 : 2.2, !!(upgraded && stg.prime), "saberform");
    if (upgraded) spawnSpeech(player.x, player.y - 20, F.name.toUpperCase() + "!", col || "#ffd166", 1.6);
  } else if (upgraded) {
    if (typeof fxBanner === "function") fxBanner(`STANCE ${["I", "II", "III"][info.idx] || ""} · ${stg.title.toUpperCase()}`, "Blade technique evolved", col || "#ffd166", 2.6, false, "saberform");
  }
  if (upgraded) { sfxTone(330, 990, 0.18, "triangle", 0.12); setTimeout(() => sfxTone(660, 1320, 0.16, "sine", 0.1), 90); }
}
// Small read-out for the help screen / tooltips: "Lv.3 Form IV Ataru (The Empire Strikes Back)"
function saberFormRoadmap(id) {
  const p = SABER_PATHS[id];
  if (!p) return "";
  return p.stages.map(s => `Lv.${s.lv} ${SABER_FORMS[s.form].name}${s.prime ? " ★" : ""} (${s.era})`).join(" → ");
}
function saberNextFormHint(w) {
  const p = w && SABER_PATHS[w.id];
  if (!p) return "";
  const nxt = p.stages.find(s => s.lv > w.lvl);
  if (!nxt) return "";
  const F = SABER_FORMS[nxt.form];
  return `Next form at Lv.${nxt.lv}: Form ${F.num} ${F.name} — ${nxt.era}`;
}

/* === 15. RENDER SUPPORT (called from drawHeroSprite in js/render.js) === */
function saberRenderState(w) {
  if (sfGlobal.disabled || !w || !w.sf || typeof w.sfReach !== "number") return null;
  return { arm: w.armAng, blade: w.ang, reach: w.sfReach, len: w.sfLenPx, side: w.sfSide, dbl: !!w.sfDbl, lit: w.sfLit, grip: w.sfGrip, off: w.sfOff,
           steel: SF_STEEL_IDS.includes(w.id), extra: w.sfExtra || null, st: w.sf };
}
// Motion trail: filled swoosh between successive blade positions (outer 70% of the blade), fading with age.
function saberDrawTrail(tCtx, w, col, bladeSt) {
  const st = bladeSt || w.sf;
  if (!st || st.trN < 2 || opts.lowPart) return;
  const now = runTime, maxAge = 0.13, steel = SF_STEEL_IDS.includes(w.id);
  tCtx.save();
  tCtx.globalCompositeOperation = steel ? "source-over" : "lighter";
  tCtx.fillStyle = steel ? "#cfd8dc" : col;
  let p = -1;
  for (let k = 0; k < st.trN; k++) {
    const idx = ((st.trHead - 1 - k) % SF_TR_N + SF_TR_N) % SF_TR_N, o = idx * 6;
    const age = now - st.tr[o + 4];
    if (age > maxAge || age < -0.5) break;
    if (p >= 0 && st.tr[o + 5] > 0.5 && st.tr[p + 5] > 0.5) {
      const alpha = (steel ? 0.22 : 0.42) * (1 - age / maxAge);
      sfTrailQuad(tCtx, st.tr, p, o, alpha, false);
      if (st.dbl) sfTrailQuad(tCtx, st.tr, p, o, alpha, true);
    }
    p = o;
  }
  tCtx.restore();
}
function sfTrailQuad(tCtx, tr, a, b, alpha, back) {
  const da = sfWrap(tr[b + 2] - tr[a + 2]);
  const n = Math.max(1, Math.min(6, Math.ceil(Math.abs(da) / 0.22)));
  tCtx.globalAlpha = alpha;
  tCtx.beginPath();
  for (let i = 0; i <= n; i++) {                                    // outer edge (tips)
    const u = i / n, ang = tr[a + 2] + da * u + (back ? Math.PI : 0), L = sfLerp(tr[a + 3], tr[b + 3], u);
    const hx = sfLerp(tr[a], tr[b], u), hy = sfLerp(tr[a + 1], tr[b + 1], u);
    const x = hx + Math.cos(ang) * L, y = hy + Math.sin(ang) * L;
    if (i === 0) tCtx.moveTo(x, y); else tCtx.lineTo(x, y);
  }
  for (let i = n; i >= 0; i--) {                                    // inner edge (30% along the blade)
    const u = i / n, ang = tr[a + 2] + da * u + (back ? Math.PI : 0), L = sfLerp(tr[a + 3], tr[b + 3], u) * 0.3;
    const hx = sfLerp(tr[a], tr[b], u), hy = sfLerp(tr[a + 1], tr[b + 1], u);
    tCtx.lineTo(hx + Math.cos(ang) * L, hy + Math.sin(ang) * L);
  }
  tCtx.closePath();
  tCtx.fill();
}

/* === 16. AUDIO: swing / sizzle / clash / ignition / hum === */
const SF_HUM_BASE = { 0: 92, 3: 68, 55: 88, 76: 62, 77: 78, 78: 104, 79: 124 };
const sfAud = { lastSwing: 0, lastHit: 0, lastClash: 0, hum: null, humOff: 0 };
function sfNow() { return (typeof actx !== "undefined" && actx) ? actx.currentTime : performance.now() / 1000; }
function sfSwingSfx(w, power) {
  try {
    if (typeof ensureAudio !== "function") return;
    const ac = ensureAudio(); if (!ac) return;
    const now = ac.currentTime;
    if (now - sfAud.lastSwing < 0.06) return;
    sfAud.lastSwing = now;
    if (SF_STEEL_IDS.includes(w.id)) {                              // steel whoosh
      playNoise(0.12 + power * 0.05, "bandpass", 1500, 380, 1.6, 0.13 * power);
      return;
    }
    const vol = opts.vol, base = (SF_HUM_BASE[w.id] || 92) * (0.92 + Math.random() * 0.16), dur = 0.13 + power * 0.08;
    const o1 = ac.createOscillator(), o2 = ac.createOscillator(), flt = ac.createBiquadFilter(), g = ac.createGain();
    o1.type = "sawtooth"; o2.type = "triangle"; flt.type = "lowpass";
    flt.frequency.setValueAtTime(380, now); flt.frequency.exponentialRampToValueAtTime(1300 + power * 500, now + dur * 0.4); flt.frequency.exponentialRampToValueAtTime(320, now + dur);
    o1.frequency.setValueAtTime(base, now); o1.frequency.exponentialRampToValueAtTime(base * (1.7 + power * 0.35), now + dur * 0.4); o1.frequency.exponentialRampToValueAtTime(base * 0.85, now + dur);
    o2.frequency.setValueAtTime(base * 2.02, now); o2.frequency.exponentialRampToValueAtTime(base * 3.1, now + dur * 0.45);
    g.gain.setValueAtTime(0.001, now); g.gain.linearRampToValueAtTime(vol * 0.15 * power, now + dur * 0.35); g.gain.exponentialRampToValueAtTime(0.001, now + dur);
    o1.connect(flt); o2.connect(flt); flt.connect(g); g.connect(ac.destination);
    o1.start(now); o2.start(now); o1.stop(now + dur + 0.02); o2.stop(now + dur + 0.02);
    playNoise(dur * 0.8, "bandpass", 900, 260, 1.6, 0.06 * power);
  } catch (e) {}
}
function sfHitSfx(w, kind, killed) {
  try {
    const now = sfNow();
    if (now - sfAud.lastHit < 0.045) return;
    sfAud.lastHit = now;
    if (SF_STEEL_IDS.includes(w.id)) { playNoise(0.06, "bandpass", 1900, 700, 2.0, 0.14); sfxTone(260, 110, 0.05, "triangle", 0.1); return; }
    playNoise(0.07, "bandpass", 2600, 760, 1.8, killed ? 0.16 : 0.12);     // plasma sizzle
    sfxTone(165, 55, 0.07, "triangle", 0.12, 0.08);
    if (kind === 2) sfxTone(92, 36, 0.16, "sawtooth", 0.16, 0.05);
  } catch (e) {}
}
function sfClashSfx() {
  try {
    const now = sfNow();
    if (now - sfAud.lastClash < 0.05) return;
    sfAud.lastClash = now;
    sfxTone(2300, 1650, 0.08, "square", 0.05, 0.06);
    sfxTone(3200, 2500, 0.06, "sine", 0.08, 0.06);
    playNoise(0.06, "highpass", 4200, 1600, 1.2, 0.12);
  } catch (e) {}
}
function sfIgnite(w, on) {
  try {
    if (!sfIsSaberId(w.id)) { if (on) playNoise(0.16, "highpass", 3200, 1400, 1.4, 0.08); return; }   // steel draw
    if (on) {
      playNoise(0.24, "bandpass", 700, 2600, 1.2, 0.12);                     // snap-hiss
      sfxTone(55, 118, 0.32, "sawtooth", 0.15, 0.03);
      sfxTone(110, 240, 0.22, "triangle", 0.08, 0.03);
    } else {
      sfxTone(118, 46, 0.3, "sawtooth", 0.12, 0.03);
      playNoise(0.22, "bandpass", 2200, 500, 1.2, 0.08);
    }
  } catch (e) {}
}
// Continuous hum: low detuned saws through a lowpass; louder, brighter and Doppler-bent while the blade swings.
function saberAudioFrame(rawDt) {
  const lit = sfGlobal.humLit, spdA = sfGlobal.humSpd;
  sfGlobal.humLit = Math.max(0, lit - rawDt * 4); sfGlobal.humSpd = 0;
  const want = !sfGlobal.disabled && typeof runActive !== "undefined" && runActive && !runPaused && player && lit > 0.05 && opts.vol > 0.01 && !document.hidden;
  try {
    if (!want) {
      if (sfAud.hum) {
        const ac = actx, h = sfAud.hum;
        h.g.gain.setTargetAtTime(0.0001, ac.currentTime, 0.06);
        sfAud.humOff += rawDt;
        if (sfAud.humOff > 0.6) { try { h.o1.stop(); h.o2.stop(); } catch (e) {} sfAud.hum = null; }
      }
      return;
    }
    sfAud.humOff = 0;
    if (typeof ensureAudio !== "function") return;
    const ac = ensureAudio(); if (!ac) return;
    if (!sfAud.hum) {
      const o1 = ac.createOscillator(), o2 = ac.createOscillator(), flt = ac.createBiquadFilter(), g = ac.createGain();
      const base = SF_HUM_BASE[player.cid] || 92;
      o1.type = "sawtooth"; o2.type = "sawtooth"; o1.frequency.value = base; o2.frequency.value = base * 1.013;
      flt.type = "lowpass"; flt.frequency.value = 260; flt.Q.value = 2.2; g.gain.value = 0.0001;
      o1.connect(flt); o2.connect(flt); flt.connect(g); g.connect(ac.destination);
      o1.start(); o2.start();
      sfAud.hum = { o1, o2, flt, g, base };
    }
    const h = sfAud.hum, now = ac.currentTime, swing = Math.min(1, spdA / 22);
    h.g.gain.setTargetAtTime(opts.vol * (0.018 + swing * 0.05) * Math.min(1, lit), now, 0.04);
    h.flt.frequency.setTargetAtTime(240 + swing * 900, now, 0.03);
    h.o1.frequency.setTargetAtTime(h.base * (1 + swing * 0.22), now, 0.03);
    h.o2.frequency.setTargetAtTime(h.base * 1.013 * (1 + swing * 0.24), now, 0.03);
  } catch (e) {}
}

/* === 17. HOOKS === */
V10.onRunStart.push(function saberRunStart() { saberResetAll(); });
V10.onRunReset.push(function saberRunReset() { saberResetAll(); });
V10.onFrame.push(saberAudioFrame);

// EOF:js/saberforms.js
