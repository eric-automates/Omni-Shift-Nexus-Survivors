/* =========================================================================
   OMNI-SHIFT v14.2 — HERO REGISTRY
   One call adds a hero everywhere: heroRegister(def) fills every per-hero table
   the engine reads (identity row, weapon/Force/alignment lists, stance read-out,
   saber Form path, signature gear, utilities, quotes, outfit palettes, weapon
   icon, blade colour, threat-sense style, vision, enemy roster, city theme, body,
   kinematics, dash, arm cap, sprite head details). Heroes #81+ then work exactly
   like the original 80, and the roster helpers below no longer assume "80".
   v14.2 heroes: #81 Qui-Gon · #82 The Count (Dooku) · #83 Old Ben (Obi-Wan).
   Renamed (homage names): #0 "Luke", #78 "The Jedi Master Duelist".
   ========================================================================= */
"use strict";

const HERO_EXTRA = {};            // cid → registration record (render / kinematics / dash hooks read it)

/* --- roster helpers ---------------------------------------------------------------- */
function heroRosterIds() { const out = []; for (let i = 0; i < CHAR_RAW.length; i++) if (CHAR_RAW[i] && i !== CUSTOM_CID) out.push(i); return out; }
function heroRosterCount() { return heroRosterIds().length; }
// rivals / weapon drops / new-weapon cards: any canon hero (never the custom hero #80)
randomRosterHero = function (exclude) { const L = heroRosterIds().filter(i => i !== exclude); return L[Math.floor(Math.random() * L.length)]; };

/* --- registration ---------------------------------------------------------------------- */
function heroRegister(d) {
  const cid = d.cid;
  HERO_EXTRA[cid] = d;
  CHAR_RAW[cid] = [cid, d.fac, d.order, d.name, d.weapon, d.ult, d.style || "orbit", d.passive, d.desc];
  const setIn = (arr, on) => { const i = arr.indexOf(cid); if (on && i < 0) arr.push(cid); if (!on && i >= 0) arr.splice(i, 1); };
  setIn(SWORD_HEROES, !!d.sword);
  setIn(FORCE_VACUUM_HEROES, !!d.vacuum);
  setIn(BAD_HEROES, !!d.bad);
  if (typeof BOUNTY_HEROES !== "undefined") setIn(BOUNTY_HEROES, !!d.bounty);
  if (typeof HELMET_HEROES !== "undefined") { if (d.helmet) HELMET_HEROES.add(cid); else HELMET_HEROES.delete(cid); }
  if (typeof FEMALE_HEROES !== "undefined") { if (d.female) FEMALE_HEROES.add(cid); else FEMALE_HEROES.delete(cid); }
  if (d.stance && typeof HERO_STANCE_TABLE !== "undefined") HERO_STANCE_TABLE[cid] = d.stance;
  if (d.path && typeof SABER_PATHS !== "undefined") SABER_PATHS[cid] = d.path;
  if (d.sig && typeof HERO_SIG_GEAR !== "undefined") HERO_SIG_GEAR[cid] = d.sig;
  if (d.utils && typeof UTILS_56 !== "undefined") UTILS_56[cid] = d.utils;
  if (d.quotes && typeof Q_56 !== "undefined") Q_56[cid] = d.quotes;
  if (d.outfit && typeof CANON_56 !== "undefined") CANON_56[cid] = d.outfit;
  if (d.icon && typeof WPN_SVG_56 !== "undefined") WPN_SVG_56[cid] = d.icon;
  if (d.music && typeof CHARACTER_THEMES !== "undefined") CHARACTER_THEMES[cid] = d.music;
  if (d.sense && typeof SENSE_HERO !== "undefined") SENSE_HERO[cid] = d.sense;
  if (d.vision && typeof VIS_HERO !== "undefined") VIS_HERO[cid] = d.vision;
  if (d.roster && typeof ER_HERO !== "undefined") ER_HERO[cid] = d.roster;
  if (d.theme && typeof CITY_THEME_HERO !== "undefined") CITY_THEME_HERO[cid] = d.theme;
  if (d.persuade && typeof FORCE_PERSUADE_LINES !== "undefined") FORCE_PERSUADE_LINES[cid] = d.persuade;
  if (d.matchups && typeof MATCHUP_LINES !== "undefined") Object.assign(MATCHUP_LINES, d.matchups);
  return cid;
}

/* --- engine hooks: everything that is a function of the hero id ------------------------------ */
(function heroRegHooks() {
  const wrap = (name, fn) => { if (typeof window[name] === "function") { const orig = window[name]; window[name] = function (cid) { const x = HERO_EXTRA[cid]; return x ? fn(x, orig, arguments) : orig.apply(this, arguments); }; } };
  wrap("getHeroKinematicStyle", (x, o, a) => x.kin != null ? x.kin : o.apply(null, a));
  wrap("getHeroBodySpec", (x, o, a) => x.body || o.apply(null, a));
  wrap("getHeroArmCap", (x, o, a) => x.armCap || o.apply(null, a));
  wrap("getHeroDashSpec", (x, o, a) => x.dash || o.apply(null, a));
  wrap("getDefaultBladeIdx", (x, o, a) => x.bladeIdx != null ? x.bladeIdx : o.apply(null, a));
})();
function heroExtraSkin(cid) { const x = HERO_EXTRA[cid]; return x && x.skin ? x.skin : null; }
// sprite head details for registered heroes (long hair, beards, clasps) — sprite space, head centre (0, -9.3), r 5.2
function heroExtraHead(t, cid, hairCol) {
  const x = HERO_EXTRA[cid]; if (!x || !x.head) return;
  const H = x.head, hc = H.hair || hairCol;
  if (H.long) { t.fillStyle = hc; t.fillRect(-5.7, -11.2, 1.9, 8.6); t.fillRect(3.8, -11.2, 1.9, 8.6); t.fillRect(-2.2, -6.5, 4.4, 1.6); }   // hair to the shoulders, tied back
  if (H.swept) { t.fillStyle = hc; t.beginPath(); t.arc(0, -10.6, 5.3, Math.PI * 0.95, Math.PI * 2.05); t.fill(); t.fillRect(-4.6, -11.4, 9.2, 1.3); }
  if (H.beard === "full") { t.fillStyle = H.beardCol || hc; t.beginPath(); t.moveTo(-4.4, -8.6); t.quadraticCurveTo(-4.6, -3.4, 0, -2.6); t.quadraticCurveTo(4.6, -3.4, 4.4, -8.6); t.lineTo(2.6, -6.6); t.lineTo(-2.6, -6.6); t.closePath(); t.fill(); }
  else if (H.beard === "short") { t.fillStyle = H.beardCol || hc; t.beginPath(); t.moveTo(-3.9, -8.2); t.quadraticCurveTo(-3.6, -4.6, 0, -4.0); t.quadraticCurveTo(3.6, -4.6, 3.9, -8.2); t.lineTo(2.2, -6.7); t.lineTo(-2.2, -6.7); t.closePath(); t.fill(); }
  else if (H.beard === "goatee") { t.fillStyle = H.beardCol || hc; t.beginPath(); t.moveTo(-2.5, -6.9); t.lineTo(2.5, -6.9); t.lineTo(0, -2.2); t.closePath(); t.fill(); t.fillRect(-2.9, -7.6, 5.8, 0.9); }
  if (H.clasp) { t.strokeStyle = "#ffd54f"; t.lineWidth = 0.8; t.beginPath(); t.moveTo(-4.8, -2.4); t.quadraticCurveTo(0, -0.6, 4.8, -2.4); t.stroke(); t.fillStyle = "#ffd54f"; t.beginPath(); t.arc(-4.8, -2.4, 0.9, 0, 7); t.arc(4.8, -2.4, 0.9, 0, 7); t.fill(); }
}

/* --- the v14.2 heroes ---------------------------------------------------------------------- */
const HR_SABER_ICON = (blade, hilt, curve) => (c1) => {
  const b = blade || c1, h = hilt || "#cfd8dc";
  return curve
    ? `<path d="M3.5 21 Q5.5 17.5 8.2 15.8" stroke="${h}" stroke-width="3.2" fill="none" stroke-linecap="round"/><line x1="8" y1="16" x2="21" y2="3" stroke="${b}" stroke-width="4.2" stroke-linecap="round"/><line x1="8" y1="16" x2="21" y2="3" stroke="#fff" stroke-width="1.6"/>`
    : `<line x1="7" y1="17" x2="21" y2="3" stroke="${b}" stroke-width="4.2" stroke-linecap="round"/><line x1="7" y1="17" x2="21" y2="3" stroke="#fff" stroke-width="1.6"/><line x1="2.5" y1="21.5" x2="7.5" y2="16.5" stroke="${h}" stroke-width="3.2" stroke-linecap="round"/>`;
};

if (typeof SABER_FORMS !== "undefined" && typeof sfVariant === "function") {
  Object.assign(SABER_FORMS, {
    // Qui-Gon: Ataru with a long, patient reach — two-handed power leaps, Force-speed lunges (The Phantom Menace)
    ataruQuiGon: sfVariant("ataru", { tag: "Living Force", tempo: 1.08, combo: "XO_", dmgK: 1.15, reachK: 1.06, deflect: 0.02 }),
    // Dooku: the finest Makashi in the galaxy — point control, feints, lightning-fast ripostes
    makashiDooku: sfVariant("makashi", { tag: "Sith Count", tempo: 1.12, combo: "TfTbT", crit: 0.12, deflect: 0.07, dmgK: 1.15 }),
    makashiCount: sfVariant("makashi", { tag: "Lord Tyranus", tempo: 1.18, combo: "TfTbTT", crit: 0.16, deflect: 0.1, dmgK: 1.3, riposte: "T" }),
    // Obi-Wan: Soresu mastery — the tightest guard in the Order, every bolt answered
    soresuMaster: sfVariant("soresu", { tag: "Master", tempo: 1.15, deflect: 0.22, parryK: 1.6, dmgK: 1.6, redirect: true }),
    soresuOldBen: sfVariant("soresu", { tag: "Old Ben", tempo: 1.18, deflect: 0.26, parryK: 1.75, dmgK: 1.75, redirect: true })
  });
}

heroRegister({
  cid: 81, fac: 0, order: 9, name: "Qui-Gon", weapon: "Living Force Green Lightsaber", ult: "Duel of the Fates Ataru Onslaught", passive: "The Living Force",
  desc: "Form II Makashi (Dooku's Padawan) → Form IV Ataru master (The Phantom Menace): long two-handed power leaps; Force Speed and Jedi Mind Trick; standing still he meditates and heals",
  sword: true, vacuum: true, armCap: 3, kin: 4, bladeIdx: 1, skin: "#e0ac83",
  body: { sx: 1.06, sy: 1.12, yOff: -1.2, kind: "adult" },
  head: { long: true, beard: "full", beardCol: "#6d4c41" },
  path: { who: "Qui-Gon Jinn", stages: [
    { lv: 1, form: "makashi", era: "The Old Republic", title: "Dooku's Padawan", blurb: "Trained by Count Dooku: precise one-handed Makashi" },
    { lv: 4, form: "ataru", era: "The Phantom Menace", title: "Tatooine Ambush", blurb: "Ataru: leaping two-handed strikes against a Sith on the dunes" },
    { lv: 7, form: "ataruQuiGon", era: "The Phantom Menace", title: "Duel of the Fates", prime: true, blurb: "Ataru master: long reach, patient power, the Living Force" }] },
  stance: [[1, "Form II Makashi (Dooku's Padawan)", 1.0, 0.8, 0.5], [3, "Form IV Ataru (Tatooine Ambush)", 1.3, 1.1, 0.85], [3, "Ataru Master (Duel of the Fates)", 1.6, 1.35, 1.15], [2, "Form III Soresu Blaster Deflect"]],
  sig: ["Living Force Green Saber", "FEEL, DON'T THINK — GREEN BLADE IGNITED!", "Force Speed Surge", 6, 1.4, 7.0],
  utils: [["Force Speed", 9, "forceSpeed", "orbit", "Bursts into Force-speed: a blur of strikes and footwork for 3 s"],
          ["Jedi Mind Trick", 11, "mindTrick", "nova", "\"You will take me to your leader.\" Weak-minded foes nearby fight for you"]],
  quotes: ["Feel, don't think. Use your instincts.", "There's always a bigger fish.", "Your focus determines your reality."],
  outfit: [["Long Brown Hair & Beard", "#6d4c41"], ["Jedi Hood", "#5d4037"], ["Grey-Streaked Hair", "#8d6e63"],
           ["Tan Jedi Tunic", "#c8b08a"], ["Naboo Duel Tunic", "#a1887f"], ["Brown Jedi Robe", "#5d4037"],
           ["Jedi Boots", "#4e342e"], ["Tan Trousers", "#a1887f"], ["Brown Jedi Cloak", "#4e342e"], ["No Cloak", "none"]],
  icon: HR_SABER_ICON("#00e676", "#b0bec5"),
  sense: { k: "jedi", label: "THE LIVING FORCE", lines: ["Something's not right…", "I sense a disturbance.", "Be mindful of your feelings.", "IT'S HERE."] },
  vision: ["aura", "#69f0ae", 24, "LIVING FORCE", 56], roster: "separatist", theme: "galactic",
  dash: { name: "Force Speed Sprint", cd: 4.0, dist: 165, style: "saberRush", col: "#00e676", callout: "FORCE SPEED!", desc: "A Force-speed blur through the enemy line, green blade cleaving" },
  persuade: ["You will take me to your leader.", "You will help us.", "Your will is mine — for now."],
  matchups: { "81_77": "We'll handle this — together, my Padawan.", "82_81": "You were always a stubborn apprentice, Qui-Gon." }
});

heroRegister({
  cid: 82, fac: 0, order: 10, name: "The Count", weapon: "Curved-Hilt Makashi Lightsaber", ult: "Makashi Duelist's Supremacy", passive: "Sith Lightning",
  desc: "Form II Makashi, the finest duelist alive (Attack of the Clones): straight-line Force lightning from his fingertips that reaches further with every level, a spinning sideways saber throw that sticks and snaps back to his hand, and +25% against saber / melee fighters",
  sword: true, vacuum: true, bad: true, armCap: 3, kin: 4, bladeIdx: 2, skin: "#e8c39e",
  body: { sx: 1.08, sy: 1.16, yOff: -1.5, kind: "adult" },
  head: { swept: true, hair: "#e0e0e0", beard: "goatee", beardCol: "#eeeeee", clasp: true },
  path: { who: "Count Dooku", stages: [
    { lv: 1, form: "makashi", era: "The Old Republic", title: "Jedi Master Dooku", blurb: "Yoda's Padawan, the Order's finest fencer: classic Makashi" },
    { lv: 4, form: "makashiDooku", era: "Attack of the Clones", title: "Geonosis", blurb: "The Sith Count: feints, point control, lightning to open a guard" },
    { lv: 7, form: "makashiCount", era: "Revenge of the Sith", title: "Lord Tyranus", prime: true, blurb: "Makashi perfected: every riposte an answer, every lunge a lesson" }] },
  stance: [[1, "Form II Makashi (Jedi Master)", 1.05, 0.85, 0.55], [1, "Form II Makashi (Geonosis)", 1.35, 1.15, 0.9], [1, "Makashi Perfected (Lord Tyranus)", 1.65, 1.4, 1.2], [1, "Makashi Precision Parry"]],
  sig: ["Curved-Hilt Crimson Saber", "COUNT DOOKU SALUTES — CRIMSON BLADE IGNITED!", "Sith Lightning Lance", 6, 1.7, 6.5],
  utils: [["Spinning Saber Throw", 6, "dookuThrow", "orbit", "A flat, spinning sideways throw: the blade sticks into the target and snaps straight back to his hand"],
          ["Telekinetic Pillar Drop", 11, "pillarDrop", "nova", "Brings a column of debris crashing down on the foes ahead, as on Geonosis"]],
  quotes: ["I've been looking forward to this.", "Twice the pride, double the fall.", "Your swordsmanship is no match for mine."],
  outfit: [["Silver Hair & Goatee", "#e0e0e0"], ["Sith Hood", "#1b1b1b"], ["Jedi Master Grey", "#bdbdbd"],
           ["Serenno Dark Tunic", "#3e2723"], ["Sith Lord Black", "#1b1b1b"], ["Jedi Master Robes", "#795548"],
           ["Black Riding Boots", "#111111"], ["Brown Trousers", "#4e342e"], ["Cape with Chain Clasp", "#2a1a12"], ["No Cape", "none"]],
  icon: HR_SABER_ICON("#ff1744", "#8d6e63", true),
  sense: { k: "sith", label: "THE DARK SIDE STIRS" },
  vision: ["aura", "#ff1744", 24, "SITH SENSES", 56], roster: "republic", theme: "galactic",
  dash: { name: "Makashi Flèche", cd: 3.8, dist: 150, style: "saberRush", col: "#ff1744", callout: "EN GARDE!", desc: "A fencer's running lunge: the curved blade leads, point first" },
  persuade: ["Join me, and together we will destroy the Sith.", "You are a brave one.", "Kneel before the Count."],
  matchups: { "82_79": "Master Yoda.", "82_83": "Your swordsmanship is no match for mine, Kenobi.", "79_82": "Fought well, you have, my old Padawan." }
});

heroRegister({
  cid: 83, fac: 0, order: 11, name: "Old Ben", weapon: "Kenobi's Soresu Lightsaber", ult: "Mastery of Soresu", passive: "The High Ground",
  desc: "Form IV Ataru (Padawan, The Phantom Menace) → Form III Soresu mastery (Revenge of the Sith → A New Hope): an impenetrable guard that sends bolts back; mind trick; +25% damage and deflection from higher ground (roofs)",
  sword: true, vacuum: true, armCap: 3, kin: 4, bladeIdx: 0, skin: "#e8c39e",
  body: { sx: 1.0, sy: 1.02, yOff: 0, kind: "adult" },
  head: { beard: "short", beardCol: "#cfd8dc" },
  path: { who: "Obi-Wan Kenobi", stages: [
    { lv: 1, form: "ataru", era: "The Phantom Menace", title: "Padawan Kenobi", blurb: "Qui-Gon's Padawan: athletic, aggressive Ataru" },
    { lv: 3, form: "soresu", era: "Attack of the Clones", title: "Jedi Knight", blurb: "Soresu discipline: the guard that gets you home alive" },
    { lv: 5, form: "soresuMaster", era: "Revenge of the Sith", title: "The Negotiator", blurb: "Mastery of Soresu: Utapau, Mustafar — nothing gets through" },
    { lv: 7, form: "soresuOldBen", era: "A New Hope", title: "Old Ben", prime: true, blurb: "The patient old master: every bolt answered, every opening taken" }] },
  stance: [[3, "Form IV Ataru (Padawan Kenobi)", 1.0, 0.8, 0.5], [2, "Form III Soresu (The Negotiator)", 1.3, 1.1, 0.85], [2, "Mastery of Soresu (Old Ben)", 1.6, 1.35, 1.15], [2, "Form III Soresu Circle of Shelter"]],
  sig: ["Kenobi's Blue Saber", "HELLO THERE — BLUE BLADE IGNITED!", "Soresu Deflection Field", 6, 1.5, 7.0],
  utils: [["Circle of Shelter", 10, "soresuShelter", "nova", "For 3 s every blaster bolt is caught and sent back; melee strikes glance off"],
          ["\"These Aren't the Droids…\"", 11, "kenobiTrick", "nova", "Droids and troopers nearby lose interest and wander off; the weak-minded fight for you"]],
  quotes: ["Hello there.", "Use the Force, Luke.", "It's over — I have the high ground."],
  outfit: [["Old Ben Grey Hair & Beard", "#cfd8dc"], ["Jedi Hood", "#6d4c41"], ["Clone Wars Auburn", "#b5651d"],
           ["Tatooine Tan Tunic", "#d7ccc8"], ["Clone Wars Armor", "#cfd8dc"], ["Desert Wraps", "#bcaaa4"],
           ["Jedi Boots", "#4e342e"], ["Tan Trousers", "#a1887f"], ["Brown Hermit Cloak", "#5d4037"], ["No Cloak", "none"]],
  icon: HR_SABER_ICON("#00b0ff", "#cfd8dc"),
  sense: { k: "jedi", label: "I HAVE A BAD FEELING", lines: ["Something stirs…", "Be mindful.", "They're close now.", "HELLO THERE."] },
  vision: ["aura", "#4fc3ff", 26, "JEDI SENSES", 56], roster: "separatist", theme: "galactic",
  dash: { name: "Ataru Force Flip", cd: 3.8, dist: 160, style: "saberRush", col: "#4fc3ff", callout: "HELLO THERE!", desc: "A Force-assisted flip over the front line, blue blade sweeping on landing" },
  persuade: ["These aren't the droids you're looking for.", "You will move along.", "You don't need to see his identification."],
  matchups: { "83_76": "Only a Sith deals in absolutes.", "76_83": "When I left you, I was but the learner.", "83_55": "Hello there!" }
});

// homage renames (v14.2 request)
if (CHAR_RAW[0]) CHAR_RAW[0][3] = "Luke";
if (CHAR_RAW[78]) CHAR_RAW[78][3] = "The Jedi Master Duelist";

/* --- roster labels follow the real count -------------------------------------------------------- */
function heroRosterLabels() {
  const n = heroRosterCount();
  const b = document.getElementById("goChars"); if (b) b.textContent = `CHARACTER ROSTER (${n})`;
  const h = document.querySelector("#scrChars h2"); if (h) h.textContent = h.textContent.replace(/^\d+ MULTIVERSE/, `${n} MULTIVERSE`);
}
if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", heroRosterLabels); else heroRosterLabels();
// EOF:js/heroreg.js
