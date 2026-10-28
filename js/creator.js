// FILE: js/creator.js
// PART: v12 module 2 of 2
// DETAIL: v12 Custom Hero Creator (Hero #80, spec v9.0 §3.4 - first build). Free and always unlocked from the roster or
//         the main menu. Build your own lightsaber duelist: name, allegiance (Jedi / Sith / Grey), species (human,
//         Zabrak, Togruta, Twi'lek, Miraluka, cyborg), body, skin, hair / hood, robes, legs, cloak, Force talent and -
//         the headline - the saber setup: ONE saber, a SABERSTAFF, or DUAL SABERS. Dual sabers are two completely
//         separate weapons ("#1 of 2" / "#2 of 2"): each has its own hilt (10 film-inspired hilts in the hilt selector),
//         its own blade colour (10 incl. the Darksaber), its own level, level-up cards and Form stage, and they fight in
//         relay with independent targets through the Saber Form Engine. "Match #1" makes a mirrored pair.
//         Pick a Fighting Form path (Jar'Kai Duelist, Djem So Guardian, Ataru Acrobat, Juyo Berserker, Makashi Duelist,
//         Soresu Defender, Saberstaff Dervish) and the hero climbs from Shii-Cho basics to that prime Form.
//         Saved in localStorage (meta.custom); the design registers itself as CHAR_RAW[80] for every hero lookup.

"use strict";

/* === 1. DATA === */
const HERO_ROSTER_N = 80;          // canon heroes #00-#79; random rivals / drops / new-weapon cards never pick #80
function randomRosterHero() { return Math.floor(Math.random() * HERO_ROSTER_N); }

// 10 hilts. len = hilt length factor, blade = blade length factor (shoto), curve = bent grip (rad), emitter style.
const SABER_HILTS = [
  { key: "graflex", name: "Graflex Classic", who: "Skywalker family saber (A New Hope)", body: "#b0bec5", grip: "#15181b", band: "#263238", emitter: "clamp", accent: "#ff1744", len: 1.0 },
  { key: "knight", name: "Jedi Knight", who: "Luke's own saber (Return of the Jedi)", body: "#263238", grip: "#101214", band: "#b0bec5", emitter: "cone", accent: "#cfd8dc", len: 1.0 },
  { key: "hermit", name: "Ribbed Hermit", who: "Obi-Wan Kenobi", body: "#cfd8dc", grip: "#1b1d20", band: "#1b1d20", ribs: true, emitter: "cone", accent: "#90a4ae", len: 1.06 },
  { key: "darklord", name: "Dark Lord", who: "Darth Vader", body: "#16181b", grip: "#16181b", band: "#b0bec5", emitter: "shroud", accent: "#ff1744", len: 1.06 },
  { key: "electrum", name: "Electrum", who: "Mace Windu / Palpatine", body: "#ffd166", grip: "#3e2723", band: "#ffb300", emitter: "flare", accent: "#fff3c4", len: 1.0 },
  { key: "curved", name: "Curved Duelist", who: "Count Dooku / Asajj Ventress", body: "#8d6e63", grip: "#3e2723", band: "#cfd8dc", emitter: "cone", accent: "#ffd166", curve: 0.34, len: 1.0 },
  { key: "shoto", name: "Shoto", who: "Yoda / Ahsoka's off-hand", body: "#cfd8dc", grip: "#455a64", band: "#78909c", emitter: "cone", accent: "#00e676", len: 0.72, blade: 0.76 },
  { key: "crossguard", name: "Crossguard", who: "Kylo Ren (unstable kyber)", body: "#212121", grip: "#3e2723", band: "#5d4037", emitter: "cross", accent: "#ff1744", len: 1.06, unstable: true },
  { key: "temple", name: "Temple Guard", who: "Jedi Temple Guard", body: "#c8a15a", grip: "#5d4037", band: "#ffd166", emitter: "flare", accent: "#ffd166", len: 1.25 },
  { key: "scavenger", name: "Scavenger", who: "Rey / Cal Kestis (salvaged)", body: "#8d6e63", grip: "#bcaaa4", band: "#5d4037", wraps: true, emitter: "clamp", accent: "#ff9100", len: 1.0 }
];
const SABER_COLORS = [
  ["Skywalker Blue", "#2196f3"], ["Kyber Cyan", "#00f0ff"], ["Jedi Green", "#00e676"], ["Sith Red", "#ff1744"], ["Vaapad Purple", "#d500f9"],
  ["Sentinel Yellow", "#ffd166"], ["Ember Orange", "#ff9100"], ["Purified White", "#ffffff"], ["Darksaber", "#212121"], ["Teal", "#1de9b6"]
];
const CUSTOM_SPECIES = [
  { key: "human", name: "Human" }, { key: "zabrak", name: "Zabrak" }, { key: "togruta", name: "Togruta" },
  { key: "twilek", name: "Twi'lek" }, { key: "miraluka", name: "Miraluka" }, { key: "cyborg", name: "Cyborg" }
];
const CUSTOM_SKINS = ["#f1c27d", "#e0ac69", "#c68642", "#8d5524", "#ffdbac", "#7cb342", "#4fc3f7", "#e57373", "#b0bec5"];
const CUSTOM_HAIR = [["Short Brown", "#4e342e"], ["Blonde", "#e6c27a"], ["Black", "#1b1b1b"], ["Silver", "#cfd8dc"], ["Auburn", "#bf360c"],
  ["Jedi Hood", "#5d4037", "hood"], ["Sith Hood", "#121212", "hood"], ["Shaved", "none"]];
const CUSTOM_ROBES = [["Jedi Tunic", "#d7ccc8"], ["Sith Black", "#16181b"], ["Grey Wanderer", "#78909c"], ["Temple Gold", "#c8a15a"],
  ["Inquisitor Crimson", "#8e0000"], ["Rebel Orange", "#e65100"], ["Beskar Steel", "#90a4ae"], ["Clone Wars Brown", "#6d4c41"]];
const CUSTOM_LEGS = [["Jedi Boots", "#3e2723"], ["Black", "#111315"], ["Grey", "#455a64"], ["Desert Sand", "#bcaaa4"]];
const CUSTOM_CLOAKS = [["Brown Jedi Cloak", "#4e342e"], ["Black Sith Cloak", "#181a1f"], ["Grey Cloak", "#546e7a"], ["Crimson Cape", "#8e0000"], ["No Cloak", "none"]];
const CUSTOM_ALIGN = {
  jedi: { name: "Jedi", desc: "Guardian of peace: +0.6 HP/s regeneration" },
  sith: { name: "Sith", desc: "Power through passion: +25% crit damage" },
  grey: { name: "Grey", desc: "Walks between: +15% XP & Dark Matter gain" }
};
const CUSTOM_TALENTS = {
  swift: { name: "Force Speed", desc: "+15% move speed & +10% dodge" },
  resilient: { name: "Force Endurance", desc: "+25% max HP & +2 armor" },
  fierce: { name: "Force Fury", desc: "+20% damage & +10% crit chance" }
};
const CUSTOM_SETUPS = {
  single: { name: "Single Saber", desc: "One blade, classic Jedi / Sith duelist" },
  dual: { name: "Dual Sabers", desc: "Two separate sabers - own hilt, colour, level & Form stage" },
  staff: { name: "Saberstaff", desc: "Double-bladed staff, cuts front & back" }
};
// Fighting Form paths: every hero starts with Shii-Cho basics and climbs to the path's prime Form.
const CUSTOM_PATHS = {
  jarkai:  { name: "Jar'Kai Duelist", setups: ["dual"], desc: "Two blades in relay (Ahsoka, Ventress)",
             stages: [["shiicho", 1, "Padawan"], ["ataru", 3, "Knight Errant"], ["jarkai", 5, "Jar'Kai Duelist"], ["jarkaiMaster", 7, "Twin-Blade Master"]] },
  djemso:  { name: "Djem So Guardian", setups: ["single", "dual"], desc: "Power, Falling Avalanche, bolts sent back (Luke, Anakin)",
             stages: [["shiicho", 1, "Padawan"], ["soresu", 3, "Temple Guardian"], ["shien", 5, "Shien Knight"], ["djemso", 7, "Djem So Master"]] },
  ataru:   { name: "Ataru Acrobat", setups: ["single", "dual"], desc: "Leaps, flips and saber swarms (Yoda, Qui-Gon)",
             stages: [["shiicho", 1, "Padawan"], ["makashi", 3, "Duelist"], ["ataru", 5, "Hawk-Bat Knight"], ["ataruMaster", 7, "Ataru Master"]] },
  juyo:    { name: "Juyo Berserker", setups: ["single", "dual"], desc: "Ferocious staccato flurries (Maul, Windu)",
             stages: [["shiicho", 1, "Initiate"], ["ataru", 3, "Hunter"], ["djemso", 5, "Juggernaut"], ["vaapad", 7, "Vaapad Master"]] },
  makashi: { name: "Makashi Duelist", setups: ["single", "dual"], desc: "Precision lunges and ripostes (Dooku)",
             stages: [["shiicho", 1, "Padawan"], ["makashi", 3, "Fencer"], ["soresu", 5, "Blademaster"], ["makashiMaster", 7, "Makashi Master"]] },
  soresu:  { name: "Soresu Defender", setups: ["single", "dual"], desc: "An unbreakable guard (Obi-Wan)",
             stages: [["shiicho", 1, "Padawan"], ["soresu", 3, "Guardian"], ["shien", 5, "Sentinel"], ["soresuMaster", 7, "Soresu Master"]] },
  staff:   { name: "Saberstaff Dervish", setups: ["staff"], desc: "Double-bladed spins and staccato (Maul, Temple Guards)",
             stages: [["staffShiicho", 1, "Initiate"], ["staffAtaru", 3, "Dervish"], ["staffNiman", 5, "Warden"], ["staffJuyo", 7, "Saberstaff Master"]] }
};
const CUSTOM_DEFAULT = {
  v: 1, created: false, name: "Nexus Wanderer", align: "jedi", species: 0, body: 0, skin: 0, hair: 0, robe: 0, legs: 0, cloak: 0,
  setup: "dual", path: "jarkai", talent: "swift", sabers: [{ hilt: 0, col: 0 }, { hilt: 6, col: 2 }]
};

// Prime Forms for the custom paths (variants of the canon Forms in js/saberforms.js)
if (typeof SABER_FORMS !== "undefined" && typeof sfVariant === "function") {
  Object.assign(SABER_FORMS, {
    jarkaiMaster:  sfVariant("jarkai", { tag: "Master", tempo: 1.16, combo: "fbFD_", deflect: 0.08, redirect: true, dmgK: 1.5 }),
    makashiMaster: sfVariant("makashi", { tag: "Master", tempo: 1.12, combo: "TfTbT", crit: 0.12, dmgK: 1.15 }),
    soresuMaster:  sfVariant("soresu", { tag: "Master", tempo: 1.18, combo: "fbF_", redirect: true, deflect: 0.2, dmgK: 1.55 }),
    staffShiicho:  sfVariant("shiicho", { tag: "Saberstaff", staff: true, pose: "staff", combo: "FBF_", sweep: 4 }),
    staffNiman:    sfVariant("niman", { tag: "Saberstaff", staff: true, pose: "staff", combo: "FbPS", spin: 3 })
  });
}

/* === 2. DESIGN ACCESS + VALIDATION === */
function customHeroSanitize(d) {
  const o = Object.assign({}, CUSTOM_DEFAULT, d || {});
  const clampI = (v, n) => (Number.isInteger(v) && v >= 0 && v < n) ? v : 0;
  o.name = String(o.name || CUSTOM_DEFAULT.name).replace(/[<>&"]/g, "").trim().slice(0, 22) || CUSTOM_DEFAULT.name;
  if (!CUSTOM_ALIGN[o.align]) o.align = "jedi";
  if (!CUSTOM_TALENTS[o.talent]) o.talent = "swift";
  if (!CUSTOM_SETUPS[o.setup]) o.setup = "dual";
  o.species = clampI(o.species, CUSTOM_SPECIES.length); o.body = clampI(o.body, 2); o.skin = clampI(o.skin, CUSTOM_SKINS.length);
  o.hair = clampI(o.hair, CUSTOM_HAIR.length); o.robe = clampI(o.robe, CUSTOM_ROBES.length);
  o.legs = clampI(o.legs, CUSTOM_LEGS.length); o.cloak = clampI(o.cloak, CUSTOM_CLOAKS.length);
  const sb = Array.isArray(o.sabers) ? o.sabers : [];
  o.sabers = [0, 1].map(k => ({ hilt: clampI(sb[k] && sb[k].hilt, SABER_HILTS.length), col: clampI(sb[k] && sb[k].col, SABER_COLORS.length) }));
  if (!CUSTOM_PATHS[o.path] || !CUSTOM_PATHS[o.path].setups.includes(o.setup)) o.path = customDefaultPath(o.setup);
  o.created = !!o.created;
  return o;
}
function customDefaultPath(setup) { return setup === "dual" ? "jarkai" : (setup === "staff" ? "staff" : "djemso"); }
function customHeroDesign() {
  if (window._crDraft) return window._crDraft;
  if (typeof meta !== "undefined" && meta && meta.custom) return meta.custom;
  return CUSTOM_DEFAULT;
}
function customHeroCreated() { return typeof meta !== "undefined" && !!(meta && meta.custom && meta.custom.created); }
function customSaberCol(d, k) { return SABER_COLORS[d.sabers[k].col][1]; }

/* === 3. REGISTRATION (CHAR_RAW[80] + every per-hero table) === */
let customPalCache = null;
function customHeroRegister() {
  const d = customHeroDesign();
  const path = CUSTOM_PATHS[d.path] || CUSTOM_PATHS.djemso, al = CUSTOM_ALIGN[d.align], tal = CUSTOM_TALENTS[d.talent];
  const wName = d.setup === "dual" ? "Twin Lightsabers" : (d.setup === "staff" ? "Saberstaff" : SABER_HILTS[d.sabers[0].hilt].name + " Lightsaber");
  const prime = path.stages[path.stages.length - 1];
  CHAR_RAW[CUSTOM_CID] = [CUSTOM_CID, 0, 0, d.name, wName, prime[2] + " Supremacy", "orbit", tal.name,
    `${al.name} · ${CUSTOM_SETUPS[d.setup].name} · ${path.name}: ${tal.desc}`];
  if (!SWORD_HEROES.includes(CUSTOM_CID)) SWORD_HEROES.push(CUSTOM_CID);
  if (!FORCE_VACUUM_HEROES.includes(CUSTOM_CID)) FORCE_VACUUM_HEROES.push(CUSTOM_CID);
  const bi = BAD_HEROES.indexOf(CUSTOM_CID);
  if (d.align === "sith" && bi < 0) BAD_HEROES.push(CUSTOM_CID);
  if (d.align !== "sith" && bi >= 0) BAD_HEROES.splice(bi, 1);
  if (typeof HERO_SIG_GEAR !== "undefined") {
    HERO_SIG_GEAR[CUSTOM_CID] = [d.setup === "dual" ? "Kyber-Attuned Saber" : "Kyber-Attuned " + (d.setup === "staff" ? "Saberstaff" : "Lightsaber"),
      d.setup === "dual" ? "TWIN SABERS IGNITED!" : (d.setup === "staff" ? "BOTH BLADES IGNITED!" : "LIGHTSABER IGNITED!"),
      d.align === "sith" ? "Force Lightning Arc" : "Force Telekinetic Push", d.align === "sith" ? 5 : 6, 1.5, d.align === "sith" ? 6.5 : 7.0];
  }
  if (typeof UTILS_56 !== "undefined") {
    UTILS_56[CUSTOM_CID] = d.align === "sith"
      ? [["Force Lightning", 7.5, "critBurst", "chain", "Unleashes a 360-degree web of Sith lightning"], ["Saber Throw", 6.5, "quadSpin", "orbit", "Hurls your lightsaber to impale & rip back"]]
      : (d.align === "grey"
        ? [["Saber Throw", 6.5, "quadSpin", "orbit", "Hurls your lightsaber to impale & rip back"], ["Shatterpoint", 8.0, "executeDash", "orbit", "Finds the fault lines and shatters nearby enemies"]]
        : [["Saber Throw", 6.5, "quadSpin", "orbit", "Hurls your lightsaber to impale & rip back"], ["Force Repulse", 10, "factionPulse", "nova", "Telekinetic wave blasts back surrounding foes"]]);
  }
  if (typeof Q_56 !== "undefined") {
    Q_56[CUSTOM_CID] = d.align === "sith" ? ["Peace is a lie. There is only passion.", "Your hate will make you strong.", "Kneel."]
      : (d.align === "grey" ? ["The Force is not light or dark. It simply is.", "I serve no Order.", "Choose your next move carefully."]
        : ["I am one with the Force.", "There is another way.", "May the Force be with you."]);
  }
  if (typeof SABER_PATHS !== "undefined") {
    SABER_PATHS[CUSTOM_CID] = { who: d.name, stages: path.stages.map((s, k) => ({ lv: s[1], form: s[0], era: d.name, title: s[2],
      prime: k === path.stages.length - 1, blurb: path.desc })) };
  }
  if (typeof HERO_STANCE_TABLE !== "undefined") {
    const pat = f => ({ shiicho: 0, makashi: 1, soresu: 2, ataru: 3, djemso: 4, shien: 4, niman: 5, juyo: 6, vaapad: 6, jarkai: 5 })[(SABER_FORMS[f] && SABER_FORMS[f].base) || f] ?? (f.startsWith("staff") ? 7 : 0);
    const st = path.stages, lbl = s => `Form ${SABER_FORMS[s[0]].num} ${SABER_FORMS[s[0]].name} (${s[2]})`;
    HERO_STANCE_TABLE[CUSTOM_CID] = [[pat(st[0][0]), lbl(st[0]), 1.0, 0.8, 0.5], [pat(st[2][0]), lbl(st[2]), 1.3, 1.1, 0.8], [pat(st[3][0]), lbl(st[3]), 1.55, 1.3, 1.1], [2, "Form III Soresu Blaster Deflect"]];
  }
  if (typeof FEMALE_HEROES !== "undefined") { if (d.body === 1) FEMALE_HEROES.add(CUSTOM_CID); else FEMALE_HEROES.delete(CUSTOM_CID); }
  if (typeof WPN_SVG_56 !== "undefined") {
    const c1 = customSaberCol(d, 0), c2 = d.setup === "dual" ? customSaberCol(d, 1) : c1;
    const dark = c => (c === "#212121" ? "#9e9e9e" : c);
    WPN_SVG_56[CUSTOM_CID] = d.setup === "dual"
      ? () => `<line x1="5" y1="15" x2="16" y2="3" stroke="${dark(c1)}" stroke-width="3" stroke-linecap="round"/><line x1="2" y1="19" x2="5" y2="15" stroke="#90a4ae" stroke-width="2.6"/><line x1="11" y1="20" x2="22" y2="8" stroke="${dark(c2)}" stroke-width="3" stroke-linecap="round"/><line x1="8" y1="23" x2="11" y2="20" stroke="#90a4ae" stroke-width="2.6"/>`
      : (d.setup === "staff"
        ? () => `<line x1="2" y1="22" x2="22" y2="2" stroke="${dark(c1)}" stroke-width="3" stroke-linecap="round"/><line x1="9" y1="15" x2="15" y2="9" stroke="#90a4ae" stroke-width="3.5"/>`
        : () => `<line x1="8" y1="16" x2="21" y2="3" stroke="${dark(c1)}" stroke-width="4" stroke-linecap="round"/><line x1="3" y1="21" x2="8" y2="16" stroke="#90a4ae" stroke-width="3"/>`);
  }
  customPalCache = null;
}

/* === 4. LOOK (used by js/data-heroes.js getHeroOutfits + js/render.js drawHeroSprite) === */
function customHeroOutfits() {
  if (customPalCache && customPalCache.d === customHeroDesign()) return customPalCache.pal;
  const d = customHeroDesign(), h = CUSTOM_HAIR[d.hair];
  const pal = {
    head: [[h[0], h[1] === "none" ? CUSTOM_SKINS[d.skin] : h[1]]], torso: [CUSTOM_ROBES[d.robe]], legs: [CUSTOM_LEGS[d.legs]],
    back: [CUSTOM_CLOAKS[d.cloak]],
    blade: [[SABER_COLORS[d.sabers[0].col][0], customSaberCol(d, 0)], [SABER_COLORS[d.sabers[1].col][0], customSaberCol(d, 1)]]
  };
  customPalCache = { d, pal };
  return pal;
}
function customSkinCol() { return CUSTOM_SKINS[customHeroDesign().skin]; }
function customHairStyle() { const h = CUSTOM_HAIR[customHeroDesign().hair]; return h[2] === "hood" ? "hood" : (h[1] === "none" ? "bald" : "hair"); }
// species details drawn over the head (sprite space, head centre ~ (0, -9.3), r 5.2)
function drawCustomSpeciesExtras(t, eyeLookX) {
  const d = customHeroDesign(), sp = CUSTOM_SPECIES[d.species].key, skin = CUSTOM_SKINS[d.skin];
  if (sp === "zabrak") {
    t.fillStyle = "#e0d6c8";
    [[-3.2, -13.4], [-1.1, -14.6], [1.1, -14.6], [3.2, -13.4]].forEach(([hx, hy]) => { t.beginPath(); t.moveTo(hx - 0.7, -12.6); t.lineTo(hx, hy - 1.2); t.lineTo(hx + 0.7, -12.6); t.closePath(); t.fill(); });
    t.strokeStyle = "rgba(20,10,10,0.55)"; t.lineWidth = 0.6;
    t.beginPath(); t.moveTo(-3.4, -11.6); t.lineTo(-1.4, -9.0); t.moveTo(3.4, -11.6); t.lineTo(1.4, -9.0); t.stroke();
  } else if (sp === "togruta") {
    t.fillStyle = "#eceff1";                                      // montrals
    t.beginPath(); t.moveTo(-4.6, -12.4); t.quadraticCurveTo(-7.4, -16.5, -5.0, -18.6); t.lineTo(-3.0, -13.0); t.closePath(); t.fill();
    t.beginPath(); t.moveTo(4.6, -12.4); t.quadraticCurveTo(7.4, -16.5, 5.0, -18.6); t.lineTo(3.0, -13.0); t.closePath(); t.fill();
    t.fillStyle = "#1565c0"; t.fillRect(-5.6, -15.6, 1.4, 1.0); t.fillRect(4.2, -15.6, 1.4, 1.0);
    t.fillStyle = skin;                                           // head-tails down the chest
    t.fillRect(-6.4, -9.5, 2.0, 8.5); t.fillRect(4.4, -9.5, 2.0, 8.5);
    t.fillStyle = "#eceff1"; t.fillRect(-6.4, -6.5, 2.0, 1.0); t.fillRect(4.4, -6.5, 2.0, 1.0);
  } else if (sp === "twilek") {
    t.fillStyle = skin;                                           // lekku
    t.beginPath(); t.moveTo(-3.6, -11.5); t.quadraticCurveTo(-8.4, -6.0, -6.4, 1.5); t.lineTo(-4.6, 1.2); t.quadraticCurveTo(-5.6, -6.0, -1.6, -10.5); t.closePath(); t.fill();
    t.beginPath(); t.moveTo(3.6, -11.5); t.quadraticCurveTo(8.0, -7.0, 6.8, -1.8); t.lineTo(5.2, -2.0); t.quadraticCurveTo(5.4, -7.0, 1.6, -10.5); t.closePath(); t.fill();
  } else if (sp === "miraluka") {
    t.fillStyle = "#212121"; t.fillRect(-5.2, -11.4, 10.4, 2.6);
    t.fillStyle = "#37474f"; t.fillRect(-5.2, -11.4, 10.4, 0.6);
  } else if (sp === "cyborg") {
    t.fillStyle = "#90a4ae"; t.beginPath(); t.arc(0, -9.3, 5.25, -Math.PI / 2, Math.PI / 2); t.closePath(); t.fill();
    t.strokeStyle = "#455a64"; t.lineWidth = 0.6; t.beginPath(); t.moveTo(0, -14.4); t.lineTo(0, -4.2); t.stroke();
    t.fillStyle = "#ff1744"; t.beginPath(); t.arc(2.3 + eyeLookX * 0.5, -9.9, 1.2, 0, Math.PI * 2); t.fill();
  }
}
function customHoodOver(t, col) {     // hood drawn over the hair line, framing the face
  t.fillStyle = col;
  t.beginPath(); t.arc(0, -9.6, 6.6, Math.PI * 0.86, Math.PI * 2.14); t.lineTo(6.2, -5.4); t.lineTo(4.6, -5.4); t.lineTo(4.4, -9.2);
  t.arc(0, -9.3, 4.5, -0.05, Math.PI + 0.05, true); t.lineTo(-4.6, -5.4); t.lineTo(-6.2, -5.4); t.closePath(); t.fill();
}
// the weapons drawn on a non-live sprite (roster card, creator preview, rival)
function customPreviewWeapons() {
  const d = customHeroDesign();
  const mk = k => ({ id: CUSTOM_CID, style: "orbit", lvl: 1, bladeCol: customSaberCol(d, k), ownCol: true, hilt: d.sabers[k].hilt, dbl: d.setup === "staff" });
  return d.setup === "dual" ? [mk(0), mk(1)] : [mk(0)];
}

/* === 5. RUN START (called from js/combat.js startRun for hero #80) === */
function customHeroApplyRun(p) {
  const d = customHeroDesign();
  const mk = (k, tag) => {
    const h = SABER_HILTS[d.sabers[k].hilt];
    return { id: CUSTOM_CID, name: (d.setup === "staff" ? h.name + " Saberstaff" : h.name + " Lightsaber") + tag, superName: CHAR_RAW[CUSTOM_CID][5],
             style: "orbit", lvl: 1, cd: 0, ang: 0, angVel: 0, enabled: true, evolvedLv5: false, bladeCol: customSaberCol(d, k),
             ownCol: true, hilt: d.sabers[k].hilt, bladeK: h.blade || 1, dualTag: tag, dbl: d.setup === "staff" };
  };
  p.weapons = d.setup === "dual" ? [mk(0, " #1 of 2"), mk(1, " #2 of 2")] : [mk(0, "")];
  p.saberMastery = 25; p.hasSaber = true; p.armCap = Math.max(p.armCap || 2, 3);
  if (d.talent === "swift") { p.spd *= 1.15; p.dodge += 0.10; }
  else if (d.talent === "resilient") { p.maxHp *= 1.25; p.armor += 2; }
  else { p.might += 0.20; p.crit += 0.10; }
  if (d.align === "jedi") p.regen += 0.6; else if (d.align === "sith") p.cdmg += 0.25; else p.greed += 0.15;
}

/* === 6. CREATOR SCREEN === */
function openCreator() {
  const cur = document.querySelector(".screen.active");
  window._crFrom = (cur && cur.id !== "scrCreate") ? cur.id : (window._crFrom || "scrMain");
  window._crDraft = customHeroSanitize(JSON.parse(JSON.stringify(customHeroCreated() ? meta.custom : CUSTOM_DEFAULT)));
  customHeroRegister();
  showScreen("scrCreate");
  renderCreator();
}
function closeCreator(save) {
  const draft = window._crDraft;
  window._crDraft = null;
  if (save && draft) {
    draft.created = true;
    meta.custom = customHeroSanitize(draft);
    if (!meta.chars.includes(CUSTOM_CID)) meta.chars.push(CUSTOM_CID);
    meta.selChar = CUSTOM_CID;
    saveMeta();
    sfx(440, 990, 0.2, "triangle");
  }
  customHeroRegister();
  if (typeof updateMenuUI === "function") updateMenuUI();
  const back = window._crFrom || "scrMain";
  if (back === "scrChars" && typeof renderChars === "function") renderChars();
  showScreen(back);
}
function crSet(key, val) {
  const d = window._crDraft; if (!d) return;
  if (key.startsWith("sab")) { const k = +key[3], f = key.slice(5); d.sabers[k][f] = val; }
  else d[key] = val;
  if (key === "setup" && !CUSTOM_PATHS[d.path].setups.includes(val)) d.path = customDefaultPath(val);
  window._crDraft = customHeroSanitize(d);
  customHeroRegister();
  renderCreator();
  sfx(380, 620, 0.05, "triangle", 0.12);
}
function crCycle(key, n, dir) {
  const d = window._crDraft; if (!d) return;
  const cur = key.startsWith("sab") ? d.sabers[+key[3]][key.slice(5)] : d[key];
  crSet(key, (cur + dir + n) % n);
}
function crRandomize() {
  const r = n => Math.floor(Math.random() * n), d = window._crDraft; if (!d) return;
  const setups = Object.keys(CUSTOM_SETUPS), setup = setups[r(3)];
  const paths = Object.keys(CUSTOM_PATHS).filter(k => CUSTOM_PATHS[k].setups.includes(setup));
  const align = ["jedi", "sith", "grey"][r(3)];
  const col = () => align === "sith" ? (Math.random() < 0.75 ? 3 : r(SABER_COLORS.length)) : r(SABER_COLORS.length);
  Object.assign(d, { align, setup, path: paths[r(paths.length)], species: r(CUSTOM_SPECIES.length), body: r(2), skin: r(CUSTOM_SKINS.length),
    hair: r(CUSTOM_HAIR.length), robe: r(CUSTOM_ROBES.length), legs: r(CUSTOM_LEGS.length), cloak: r(CUSTOM_CLOAKS.length),
    talent: ["swift", "resilient", "fierce"][r(3)], sabers: [{ hilt: r(SABER_HILTS.length), col: col() }, { hilt: r(SABER_HILTS.length), col: col() }] });
  crSet("name", d.name);
}

function renderCreator() {
  const d = window._crDraft; if (!d) return;
  const box = document.getElementById("crForm"); if (!box) return;
  const chips = (key, obj) => Object.keys(obj).map(k => `<button class="btn cr-chip${d[key] === k ? " gold" : ""}" data-cr="${key}" data-v="${k}">${obj[k].name}</button>`).join("");
  const cyc = (key, n, label) => `<span class="cr-cyc"><button class="btn" data-crc="${key}" data-n="${n}" data-dir="-1">◀</button><b>${label}</b><button class="btn" data-crc="${key}" data-n="${n}" data-dir="1">▶</button></span>`;
  const swatches = (key, list, cur) => list.map((c, i) => `<button class="cr-sw${cur === i ? " on" : ""}" data-crn="${key}" data-v="${i}" title="${Array.isArray(c) ? c[0] : c}" style="background:${Array.isArray(c) ? c[1] : c}"></button>`).join("");
  const path = CUSTOM_PATHS[d.path];
  const pathKeys = Object.keys(CUSTOM_PATHS).filter(k => CUSTOM_PATHS[k].setups.includes(d.setup));
  const pathChips = pathKeys.map(k => `<button class="btn cr-chip${d.path === k ? " gold" : ""}" data-cr="path" data-v="${k}">${CUSTOM_PATHS[k].name}</button>`).join("");
  const roadmap = path.stages.map((s, k) => `Lv.${s[1]} ${SABER_FORMS[s[0]].name}${k === path.stages.length - 1 ? " ★" : ""}`).join(" → ");
  const saberRow = k => {
    const h = SABER_HILTS[d.sabers[k].hilt];
    return `<div class="cr-row cr-saber"><div class="cr-lbl">${d.setup === "dual" ? "SABER #" + (k + 1) + " OF 2" : (d.setup === "staff" ? "SABERSTAFF" : "LIGHTSABER")}</div>
      <div>Hilt ${cyc("sab" + k + "_hilt", SABER_HILTS.length, h.name)} <small>${h.who}</small></div>
      <div class="cr-sws">${swatches("sab" + k + "_col", SABER_COLORS, d.sabers[k].col)}</div>
      ${k === 1 ? `<button class="btn" id="crMatch">⇆ MATCH SABER #1</button>` : ""}</div>`;
  };
  box.innerHTML = `
    <div class="cr-row"><div class="cr-lbl">NAME</div><input id="crName" maxlength="22" value="${d.name}" autocomplete="off"></div>
    <div class="cr-row"><div class="cr-lbl">ALLEGIANCE</div><div class="cr-chips">${chips("align", CUSTOM_ALIGN)}</div><small>${CUSTOM_ALIGN[d.align].desc}</small></div>
    <div class="cr-row"><div class="cr-lbl">SABER SETUP</div><div class="cr-chips">${chips("setup", CUSTOM_SETUPS)}</div><small>${CUSTOM_SETUPS[d.setup].desc}</small></div>
    ${saberRow(0)}${d.setup === "dual" ? saberRow(1) : ""}
    <div class="cr-row"><div class="cr-lbl">FIGHTING FORM PATH</div><div class="cr-chips">${pathChips}</div><small>${path.desc}<br><b>${roadmap}</b></small></div>
    <div class="cr-row"><div class="cr-lbl">FORCE TALENT</div><div class="cr-chips">${chips("talent", CUSTOM_TALENTS)}</div><small>${CUSTOM_TALENTS[d.talent].desc}</small></div>
    <div class="cr-row"><div class="cr-lbl">LOOK</div>
      <div>Species ${cyc("species", CUSTOM_SPECIES.length, CUSTOM_SPECIES[d.species].name)} Body ${cyc("body", 2, d.body ? "Feminine" : "Masculine")}</div>
      <div class="cr-sws">${swatches("skin", CUSTOM_SKINS, d.skin)}</div>
      <div>Hair ${cyc("hair", CUSTOM_HAIR.length, CUSTOM_HAIR[d.hair][0])} Robes ${cyc("robe", CUSTOM_ROBES.length, CUSTOM_ROBES[d.robe][0])}</div>
      <div>Legs ${cyc("legs", CUSTOM_LEGS.length, CUSTOM_LEGS[d.legs][0])} Cloak ${cyc("cloak", CUSTOM_CLOAKS.length, CUSTOM_CLOAKS[d.cloak][0])}</div></div>`;
  box.querySelectorAll("[data-cr]").forEach(b => b.onclick = () => crSet(b.dataset.cr, b.dataset.v));
  box.querySelectorAll("[data-crc]").forEach(b => b.onclick = () => crCycle(b.dataset.crc, +b.dataset.n, +b.dataset.dir));
  box.querySelectorAll("[data-crn]").forEach(b => b.onclick = () => crSet(b.dataset.crn, +b.dataset.v));
  const nm = document.getElementById("crName");
  if (nm) nm.oninput = () => { window._crDraft.name = nm.value; customHeroRegister(); drawCreatorPreview(); };
  const mt = document.getElementById("crMatch");
  if (mt) mt.onclick = () => { d.sabers[1] = { hilt: d.sabers[0].hilt, col: d.sabers[0].col }; crSet("setup", d.setup); };
  drawCreatorPreview();
}

// hero (both sabers ignited) + big hilt close-ups of each saber
function drawCreatorPreview() {
  const cv = document.getElementById("crCv"); if (!cv) return;
  const c = cv.getContext("2d"), d = window._crDraft || customHeroDesign(), fac = FACTIONS[0];
  c.fillStyle = "#060b14"; c.fillRect(0, 0, cv.width, cv.height);
  c.fillStyle = fac.bg || "#0a1424"; c.fillRect(6, 6, 142, cv.height - 12);
  c.strokeStyle = "#00e5ff55"; c.strokeRect(6, 6, 142, cv.height - 12);
  c.save(); c.translate(77, 108); c.scale(3.3, 3.3);
  drawHeroSprite(0, 0, fac, CUSTOM_CID, 0.6, -0.25, 0, c, -1);
  c.restore();
  c.fillStyle = "#ffd166"; c.font = "bold 9px sans-serif"; c.textAlign = "center";
  c.fillText(d.name.toUpperCase(), 77, cv.height - 12);
  c.textAlign = "left";
  const n = d.setup === "dual" ? 2 : 1;
  for (let k = 0; k < n; k++) {
    const y = n === 1 ? 100 : 58 + k * 84, h = SABER_HILTS[d.sabers[k].hilt], col = customSaberCol(d, k);
    c.fillStyle = "#9fb3c8"; c.font = "bold 8px monospace";
    c.fillText(n === 1 ? (d.setup === "staff" ? "SABERSTAFF" : "LIGHTSABER") : `SABER #${k + 1} OF 2`, 158, y - 30);
    c.fillStyle = "#e0f2f1"; c.font = "bold 9px sans-serif"; c.fillText(h.name + " · " + SABER_COLORS[d.sabers[k].col][0], 158, y - 20);
    c.save(); c.translate(d.setup === "staff" ? 232 : 186, y + 8); c.scale(4.3, 4.3);
    drawWeaponModel(c, CUSTOM_CID, "orbit", false, false, col, 0, 0, d.setup === "staff" ? 18 : 24 * (h.blade || 1), d.setup === "staff", d.sabers[k].hilt);
    c.restore();
  }
}

/* === 7. ROSTER CARD (top of the hero roster) === */
function customRosterCard() {
  const d = customHeroCreated() ? meta.custom : null;
  const card = document.createElement("div");
  card.className = "card unlocked cr-card" + (meta.selChar === CUSTOM_CID ? " selected" : "");
  card.style.gridColumn = "1 / -1";
  if (!d) {
    card.innerHTML = `<div class="card-head"><div class="cr-plus">＋</div><div><div class="card-title">#80 CREATE YOUR OWN HERO</div>
      <div class="card-sub">★ FREE · always unlocked</div></div></div>
      <div class="card-desc">Build a lightsaber duelist: species, robes, allegiance, <b>single saber, saberstaff or two separate sabers</b> with their own hilts & colours, and a Fighting Form path from Shii-Cho to your prime Form.</div>
      <button class="btn gold cr-edit">✨ OPEN HERO CREATOR</button>`;
  } else {
    const path = CUSTOM_PATHS[d.path];
    card.innerHTML = `<div class="card-head"><canvas width="36" height="36" style="position:relative;width:36px;height:36px;background:#0a1424;border:1px solid #ffd166;border-radius:6px;flex-shrink:0"></canvas>
      <div><div class="card-title">#80 ${d.name}</div><div class="card-sub">YOUR HERO · ${CUSTOM_ALIGN[d.align].name} · ${CUSTOM_SETUPS[d.setup].name}</div></div></div>
      <div class="card-desc"><b>Form path:</b> ${path.name} — ${path.stages.map(s => SABER_FORMS[s[0]].name).join(" → ")} ★<br><b>Talent:</b> ${CUSTOM_TALENTS[d.talent].name} (${CUSTOM_TALENTS[d.talent].desc})</div>
      <button class="btn cr-edit">✏️ EDIT HERO</button>`;
    const pcv = card.querySelector("canvas");
    if (pcv) drawHeroSprite(18, 20, FACTIONS[0], CUSTOM_CID, 0, 0, 0, pcv.getContext("2d"), -1);
  }
  const eb = card.querySelector(".cr-edit");
  if (eb) eb.onclick = e => { e.stopPropagation(); openCreator(); };
  card.onclick = () => {
    if (typeof wasLongPress !== "undefined" && (wasLongPress || wasScrolled)) return;
    if (!customHeroCreated()) { openCreator(); return; }
    meta.selChar = CUSTOM_CID; saveMeta(); renderChars();
  };
  return card;
}

/* === 8. BOOT === */
(function customHeroBoot() {
  try {
    if (typeof meta !== "undefined" && meta && meta.custom) meta.custom = customHeroSanitize(meta.custom);
    customHeroRegister();
    if (typeof meta !== "undefined" && meta && meta.selChar === CUSTOM_CID && !customHeroCreated()) meta.selChar = 0;
    const sv = document.getElementById("crSave"), rn = document.getElementById("crRandom"), bk = document.getElementById("crBack");
    if (sv) sv.onclick = () => closeCreator(true);
    if (rn) rn.onclick = () => crRandomize();
    if (bk) bk.onclick = () => closeCreator(false);
    const mb = document.getElementById("goCreate");
    if (mb) mb.onclick = () => openCreator();
  } catch (e) {
    if (window.trackProgress) window.trackProgress("Hero creator init failed: " + e.message, true);
  }
})();
// EOF:js/creator.js
