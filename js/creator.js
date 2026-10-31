// FILE: js/creator.js
// PART: v13 Hero Creator v2 (Hero #80)
// DETAIL: Build ANY kind of character inside a fixed loadout budget (like a real RPG creator):
//         • Identity: allegiance (Light / Dark / Grey / Bounty Hunter), Force (None / Force-Touched / Strong) and a talent.
//         • WEAPONS 1-3 from a 26-weapon catalog (lightsaber, saberstaff, blades, pistols incl. the six-shooter, rifles,
//           heavy guns, wands & staves, tech). Duplicates are real twins ("#1 of 2" / "#2 of 2"): each has its own level,
//           cylinder (six-shooters reload independently) and target. Lightsabers keep the v12 hilt + colour selector and
//           climb a Fighting Form path.
//         • EXACTLY 2 SKILLS, 1 SIGNATURE GEAR, 1 MOBILITY and 1 ARMOR - each with honest requirements (Force Choke needs
//           Strong + Dark Side, Fan the Hammer needs a pistol, Whistling Birds needs beskar, spells need a magic weapon...).
//         • Mandalorian beskar comes with a JETPACK and the hero really FLIES (over rocks, walls, water and hazards; the
//           sprite hovers with a ground shadow and live thruster flames).
//         • Look: species, body, skin, hair, headgear (hoods, Mandalorian helmet, cowboy hat, wizard hat, tactical helmet,
//           goggles), outfit / legs / cloak colours. 8 one-tap presets (Jedi Knight, Sith Lord, Twin-Gun Drifter,
//           Force-Touched Wizard, Space Cowboy, Smuggler, Mandalorian, Jar'Kai Duelist).
//         Saved in localStorage (meta.custom, v: 2 - v12 designs migrate automatically); the design registers itself as
//         CHAR_RAW[80] and in every per-hero table.

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
  ["Long Dark", "#2d1b12", "long"], ["Shaved", "none"]];
const CUSTOM_HEADGEAR = [
  { key: "none", name: "None" },
  { key: "jediHood", name: "Jedi Hood", col: "#5d4037", hood: true },
  { key: "sithHood", name: "Sith Hood", col: "#121212", hood: true },
  { key: "mando", name: "Mandalorian Helmet", col: "#90a4ae", helmet: true },
  { key: "cowboy", name: "Cowboy Hat", col: "#4e342e" },
  { key: "wizard", name: "Wizard Hat", col: "#311b92" },
  { key: "tactical", name: "Tactical Helmet", col: "#37474f", helmet: true },
  { key: "goggles", name: "Pilot Goggles", col: "#795548" }
];
const CUSTOM_ROBES = [["Jedi Tunic", "#d7ccc8"], ["Sith Black", "#16181b"], ["Grey Wanderer", "#78909c"], ["Temple Gold", "#c8a15a"],
  ["Inquisitor Crimson", "#8e0000"], ["Rebel Orange", "#e65100"], ["Beskar Steel", "#90a4ae"], ["Clone Wars Brown", "#6d4c41"],
  ["Duster Tan", "#a1887f"], ["Wizard Indigo", "#311b92"], ["Tactical Olive", "#556b2f"], ["Bounty Teal", "#00695c"]];
const CUSTOM_LEGS = [["Jedi Boots", "#3e2723"], ["Black", "#111315"], ["Grey", "#455a64"], ["Desert Sand", "#bcaaa4"], ["Denim", "#283593"]];
const CUSTOM_CLOAKS = [["Brown Jedi Cloak", "#4e342e"], ["Black Sith Cloak", "#181a1f"], ["Grey Cloak", "#546e7a"], ["Crimson Cape", "#8e0000"], ["No Cloak", "none"]];

const CUSTOM_ALIGN = {
  light:  { name: "Light Side", desc: "Hero: +0.6 HP/s regeneration" },
  dark:   { name: "Dark Side", desc: "Villain: +25% crit damage" },
  grey:   { name: "Grey", desc: "Walks between: +15% XP & Dark Matter" },
  bounty: { name: "Bounty Hunter", desc: "Paid to fight: +8% crit & +20% Dark Matter" }
};
const CUSTOM_FORCE = {
  none:    { name: "No Force", tier: 0, desc: "No Force powers - your gear and grit do the work. +10% max HP" },
  touched: { name: "Force-Touched", tier: 1, desc: "A little Force: 35% orb pull, Force reflexes (+5% dodge), basic Force skills" },
  strong:  { name: "Strong in the Force", tier: 2, desc: "Full orb vacuum, Force-sight visor, every Force skill. Light: auto FORCE PERSUADE turns nearby enemies into allies · Dark: heal on every kill" }
};
const CUSTOM_TALENTS = {
  swift:     { name: "Speed", desc: "+15% move speed & +10% dodge" },
  resilient: { name: "Endurance", desc: "+25% max HP & +2 armor" },
  fierce:    { name: "Fury", desc: "+20% damage & +10% crit chance" },
  deadeye:   { name: "Deadeye", desc: "+18% crit chance, +25% crit damage, +10% projectile speed" }
};
// weapon catalog -> existing weapon ids (they keep their real firing behaviour)
const CUSTOM_WCATS = { saber: "Lightsaber", blade: "Blade", pistol: "Pistol", rifle: "Rifle", heavy: "Heavy", magic: "Magic", tech: "Tech" };
const CUSTOM_WEAPONS = {
  saber:      { name: "Lightsaber", cat: "saber", id: 80 },
  staff:      { name: "Saberstaff", cat: "saber", id: 80, dbl: true },
  longsword:  { name: "Silver Longsword", cat: "blade", id: 48 },
  katana:     { name: "Nodachi Katana", cat: "blade", id: 50 },
  batleth:    { name: "Bat'leth", cat: "blade", id: 24 },
  sixshooter: { name: "Six-Shooter Revolver", cat: "pistol", id: 52 },
  dl44:       { name: "DL-44 Heavy Blaster", cat: "pistol", id: 6 },
  ib94:       { name: "IB-94 Beskar Pistol", cat: "pistol", id: 1 },
  kimber:     { name: "Kimber .45 Pistol", cat: "pistol", id: 51 },
  phaser:     { name: "Phaser Pistol", cat: "pistol", id: 22 },
  e11:        { name: "E-11 Blaster Rifle", cat: "rifle", id: 2 },
  p90:        { name: "P90 SMG", cat: "rifle", id: 8 },
  ee3:        { name: "EE-3 Carbine", cat: "rifle", id: 54 },
  bowcaster:  { name: "Bowcaster", cat: "rifle", id: 5 },
  plasma:     { name: "M-25 Plasma Rifle", cat: "rifle", id: 40 },
  shotgun:    { name: "Super Shotgun", cat: "heavy", id: 33 },
  smartgun:   { name: "M56 Smartgun", cat: "heavy", id: 28 },
  m60:        { name: "M60 Machine Gun", cat: "heavy", id: 53 },
  wand:       { name: "Phoenix-Feather Wand", cat: "magic", id: 56 },
  elder:      { name: "Elder Wand", cat: "magic", id: 69 },
  wizstaff:   { name: "Obsidian Wizard Staff", cat: "magic", id: 72 },
  tome:       { name: "Eldritch Tome", cat: "magic", id: 49 },
  hexorbs:    { name: "Chaos Hex-Orbs", cat: "magic", id: 74 },
  discs:      { name: "Smart-Discs", cat: "tech", id: 29 },
  gravgun:    { name: "Gravity Gun", cat: "tech", id: 45 },
  armcannon:  { name: "Arm Cannon", cat: "tech", id: 47 }
};
// requirement keys -> what the player reads when a choice is locked
const CUSTOM_REQ_TXT = {
  force1: "the Force (Force-Touched or Strong)", force2: "Strong in the Force", force1light: "the Force + the Light Side",
  force2dark: "Strong in the Force + the Dark Side", blade: "a lightsaber or blade", pistol: "a pistol", gun: "a gun",
  magic: "a magic weapon", beskar: "Mandalorian beskar armor"
};
// EXACTLY 2 skills (the two utility buttons). u = [name, cooldown, type, icon, description]
const CUSTOM_SKILLS = {
  forcePush:  { req: "force1", u: ["Force Push", 9, "factionPulse", "nova", "A telekinetic wave blasts surrounding foes away"] },
  saberThrow: { req: "blade", u: ["Saber Throw", 6.5, "quadSpin", "orbit", "Your blade whirls around you, cutting everything in reach"] },
  mindTrick:  { req: "force1light", u: ["Mind Trick", 14, "mindTrick", "nova", "\"You will fight for me\" - turns 2-3 nearby enemies into allies for 12 s"] },
  barrier:    { req: "force2", u: ["Tutaminis Barrier", 9, "youShallNotPass", "nova", "A Force ward that shoves foes out and sends blaster bolts back"] },
  forceChoke: { req: "force2dark", u: ["Force Choke", 8, "forceChoke", "chain", "Lifts the strongest nearby enemy by the throat and crushes it"] },
  lightning:  { req: "force2dark", u: ["Force Lightning", 7.5, "critBurst", "chain", "A 360-degree storm of Sith lightning"] },
  thermal:    { req: "", u: ["Thermal Detonator", 8, "thermalDetonator", "nova", "Lobs a baradium grenade: beep... beep... BOOM"] },
  fanHammer:  { req: "pistol", u: ["Fan the Hammer", 6, "fanHammer", "cone", "Empties a fan of rapid hip-fire shots"] },
  birds:      { req: "beskar", u: ["Whistling Birds", 90, "whistlingBirds", "missile", "Vambrace micro-missiles hit every non-boss enemy on screen"] },
  flamer:     { req: "", u: ["Wrist Flamethrower", 7, "flameCone", "flame", "A roaring cone of fire from the vambrace"] },
  grapple:    { req: "", u: ["Grapple Line", 8.5, "grappleHook", "grapple", "Tethers and yanks the strongest nearby target"] },
  explosive:  { req: "", u: ["Explosive Arrows", 7, "explosiveBow", "missile", "A volley of three exploding arrows"] },
  fort:       { req: "", u: ["Deploy Cover", 14, "buildFort", "fort", "Drops emergency cover and mines"] },
  stim:       { req: "", u: ["Overclock Stim", 12, "cyborgRush", "nova", "Overclocks your body: faster attacks for 4.5 s"] },
  execute:    { req: "", u: ["Execution Strike", 8, "executeDash", "orbit", "Shoves back and executes weakened enemies around you"] },
  leviosa:    { req: "magic", u: ["Leviosa", 6, "leviosaFloat", "orbit", "Floats nearby enemies skyward and off-screen"] },
  patronus:   { req: "magic", u: ["Patronus", 7.5, "patronusStag", "nova", "A radiant spirit-wave blasts enemies back"] },
  protego:    { req: "magic", u: ["Protego Ward", 8, "youShallNotPass", "nova", "A golden shield-ward that reflects bolts"] },
  familiar:   { req: "magic", u: ["Summon Familiar", 7.5, "summonHound", "orbit", "Conjures an arcane familiar to fight beside you"] },
  sectum:     { req: "magic", u: ["Sectumsempra", 6, "sectumSlash", "orbit", "Invisible slashes carve up nearby enemies"] }
};
// 1 signature gear (fires automatically) [gear name, projectile style, damage mult, cooldown]
const CUSTOM_GEAR = {
  forcePush:   { req: "force1", name: "Force Telekinetic Push", st: 6, mult: 1.4, cd: 7.0, desc: "Auto: a Force push at the strongest nearby foe" },
  lightning:   { req: "force2dark", name: "Force Lightning Arc", st: 5, mult: 1.5, cd: 6.5, desc: "Auto: Sith lightning from your fingertips" },
  wristRocket: { req: "", name: "Wrist Rocket", st: 2, mult: 1.6, cd: 7.0, desc: "Auto: an explosive vambrace rocket" },
  missilePod:  { req: "beskar", name: "Shoulder Missile Pod", st: 2, mult: 1.9, cd: 8.0, desc: "Auto: a heavy beskar missile" },
  deadeye:     { req: "gun", name: "Deadeye Shot", st: 4, mult: 2.1, cd: 7.0, desc: "Auto: a piercing marksman shot" },
  arcane:      { req: "magic", name: "Arcane Bolt", st: 5, mult: 1.6, cd: 6.5, desc: "Auto: a crackling bolt of raw magic" }
};
// 1 mobility move (the dash button)
const CUSTOM_DASHES = {
  forceDash: { req: "force1", name: "Force Dash", style: "saberRush", cd: 4.0, dist: 155, callout: "FORCE DASH!", desc: "Force-dashes through the ranks, cutting foes in the path" },
  flip:      { req: "force1", name: "Acrobatic Force Flip", style: "yodaFlip", cd: 3.8, dist: 165, callout: "FLIP!", desc: "A multi-flip leap over the crowd, slicing on the way" },
  jetpack:   { req: "beskar", name: "Jetpack Rocket-Jump", style: "jetpackSlam", cd: 4.5, dist: 170, callout: "THRUSTERS FULL BURN!", desc: "Rocket-jumps and slams down with a blast wave" },
  roll:      { req: "", name: "Gunslinger Dive-Roll", style: "gunslingerRoll", cd: 3.8, dist: 140, callout: "DRAW!", desc: "An evasive roll ending in a 360-degree volley" },
  blink:     { req: "magic", name: "Apparition Blink", style: "apparitionBlink", cd: 4.0, dist: 160, callout: "APPARATE!", desc: "Teleports with a crack of arcane smoke at both ends" },
  thrusters: { req: "", name: "Tactical Thrusters", style: "tacDash", cd: 4.2, dist: 145, callout: "BREACHING!", desc: "A thruster surge that knocks back and stuns" }
};
const CUSTOM_ARMOR = {
  robes:    { name: "Jedi / Sith Robes", desc: "+8% speed & +5% dodge" },
  beskar:   { name: "Mandalorian Beskar + Jetpack", desc: "+4 armor · ✈ JETPACK FLIGHT: you hover and fly over rocks, walls, water & hazards", jetpack: true },
  duster:   { name: "Gunslinger Duster", desc: "+12% crit chance & +15% crit damage" },
  tactical: { name: "Tactical Armor", desc: "+3 armor & +15% max HP" },
  wizard:   { name: "Wizard Robes", desc: "-12% cooldowns & +12% area" },
  cyborg:   { name: "Cyborg Plating", desc: "+2 armor & +1.2 HP/s regeneration" },
  hunter:   { name: "Bounty Hunter Rig", desc: "+15% XP & Dark Matter, +10% speed" }
};
// Fighting Form paths (lightsabers only): every hero starts with Shii-Cho basics and climbs to the path's prime Form.
const CUSTOM_PATHS = {
  jarkai:  { name: "Jar'Kai Duelist", setups: ["dual"], desc: "Two blades in relay (Ahsoka, Ventress)",
             stages: [["shiicho", 1, "Padawan"], ["ataru", 3, "Knight Errant"], ["jarkai", 5, "Jar'Kai Duelist"], ["jarkaiMaster", 7, "Twin-Blade Master"]] },
  djemso:  { name: "Djem So Guardian", setups: ["single", "dual"], desc: "Power, Falling Avalanche, bolts sent back (Luke, Anakin)",
             stages: [["shiicho", 1, "Padawan"], ["soresu", 3, "Temple Guardian"], ["shien", 5, "Shien Knight"], ["djemso", 7, "Djem So Master"]] },
  ataru:   { name: "Ataru Acrobat", setups: ["single", "dual"], desc: "Leaps, flips and saber swarms (Qui-Gon)",
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
// quick saber setups (kept from v12): replaces the lightsaber part of the loadout
const CUSTOM_SETUPS = {
  single: { name: "Single Saber", desc: "One blade, classic Jedi / Sith duelist" },
  dual:   { name: "Dual Sabers", desc: "Two separate sabers - own hilt, colour, level & Form stage" },
  staff:  { name: "Saberstaff", desc: "Double-bladed staff, cuts front & back" }
};
const CUSTOM_DEFAULT = {
  v: 2, created: false, name: "Nexus Wanderer", align: "light", force: "strong", talent: "swift", universe: "auto",
  weapons: [{ k: "saber", hilt: 0, col: 0 }, { k: "saber", hilt: 6, col: 2 }], path: "jarkai",
  skills: ["saberThrow", "forcePush"], gear: "forcePush", dash: "forceDash", armor: "robes",
  species: 0, body: 0, skin: 0, hair: 0, head: "none", robe: 0, legs: 0, cloak: 0
};
const CUSTOM_PRESETS = {
  jedi:     { name: "Jedi Knight", d: { name: "Kael Varr", align: "light", force: "strong", talent: "swift", weapons: [{ k: "saber", hilt: 1, col: 2 }], path: "djemso",
              skills: ["saberThrow", "forcePush"], gear: "forcePush", dash: "forceDash", armor: "robes", head: "jediHood", hair: 0, robe: 0, legs: 0, cloak: 0 } },
  sith:     { name: "Sith Lord", d: { name: "Darth Malorn", align: "dark", force: "strong", talent: "fierce", weapons: [{ k: "saber", hilt: 3, col: 3 }], path: "juyo",
              skills: ["lightning", "forceChoke"], gear: "lightning", dash: "forceDash", armor: "robes", head: "sithHood", hair: 2, robe: 1, legs: 1, cloak: 1, skin: 8 } },
  drifter:  { name: "Twin-Gun Drifter", d: { name: "The Stranger", align: "bounty", force: "none", talent: "deadeye", weapons: [{ k: "sixshooter" }, { k: "sixshooter" }], path: "djemso",
              skills: ["fanHammer", "thermal"], gear: "deadeye", dash: "roll", armor: "duster", head: "cowboy", hair: 0, robe: 8, legs: 3, cloak: 4, skin: 1 } },
  wizard:   { name: "Force-Touched Wizard", d: { name: "Elric Thorne", align: "light", force: "touched", talent: "resilient", weapons: [{ k: "wand" }, { k: "wizstaff" }], path: "djemso",
              skills: ["patronus", "forcePush"], gear: "arcane", dash: "blink", armor: "wizard", head: "wizard", hair: 3, robe: 9, legs: 1, cloak: 4 } },
  cowboy:   { name: "Space Cowboy", d: { name: "Cass Dawnrider", align: "light", force: "touched", talent: "swift", weapons: [{ k: "sixshooter" }, { k: "saber", hilt: 9, col: 0 }], path: "djemso",
              skills: ["fanHammer", "forcePush"], gear: "forcePush", dash: "roll", armor: "duster", head: "cowboy", hair: 1, robe: 8, legs: 4, cloak: 4 } },
  smuggler: { name: "Smuggler", d: { name: "Rook Tallis", align: "grey", force: "none", talent: "deadeye", weapons: [{ k: "sixshooter" }, { k: "saber", hilt: 9, col: 6 }], path: "djemso",
              skills: ["thermal", "grapple"], gear: "wristRocket", dash: "roll", armor: "hunter", head: "none", hair: 0, robe: 7, legs: 2, cloak: 4, skin: 2 } },
  mando:    { name: "Mandalorian", d: { name: "Din Vyrek", align: "bounty", force: "none", talent: "resilient", weapons: [{ k: "ib94" }, { k: "ee3" }], path: "djemso",
              skills: ["birds", "flamer"], gear: "wristRocket", dash: "jetpack", armor: "beskar", head: "mando", hair: 0, robe: 6, legs: 2, cloak: 2 } },
  jarkai:   { name: "Jar'Kai Duelist", d: { name: "Nexus Wanderer", align: "light", force: "strong", talent: "swift", weapons: [{ k: "saber", hilt: 0, col: 0 }, { k: "saber", hilt: 6, col: 2 }], path: "jarkai",
              skills: ["saberThrow", "forcePush"], gear: "forcePush", dash: "forceDash", armor: "robes", head: "none", hair: 0, robe: 0, legs: 0, cloak: 0 } }
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
const crClampI = (v, n, def = 0) => (Number.isInteger(v) && v >= 0 && v < n) ? v : def;
function crWDef(w) { return CUSTOM_WEAPONS[w && w.k] || CUSTOM_WEAPONS.saber; }
function crIsSaber(w) { return crWDef(w).cat === "saber"; }
function crHasCat(d, cat) { return d.weapons.some(w => crWDef(w).cat === cat); }
function crSaberSetup(d) {
  const sab = d.weapons.filter(crIsSaber);
  if (!sab.length) return "none";
  if (sab.some(w => w.k === "staff")) return "staff";
  return sab.length >= 2 ? "dual" : "single";
}
function crForceTier(d) { return (CUSTOM_FORCE[d.force] || CUSTOM_FORCE.none).tier; }
// does design d meet requirement key r?
function crReqOk(d, r) {
  if (!r) return true;
  const t = crForceTier(d);
  switch (r) {
    case "force1": return t >= 1;
    case "force2": return t >= 2;
    case "force1light": return t >= 1 && d.align === "light";
    case "force2dark": return t >= 2 && d.align === "dark";
    case "blade": return crHasCat(d, "saber") || crHasCat(d, "blade");
    case "pistol": return crHasCat(d, "pistol");
    case "gun": return crHasCat(d, "pistol") || crHasCat(d, "rifle") || crHasCat(d, "heavy");
    case "magic": return crHasCat(d, "magic");
    case "beskar": return d.armor === "beskar";
  }
  return true;
}
function crPickDefault(d, table, order) {
  for (const k of order) if (table[k] && crReqOk(d, table[k].req)) return k;
  return Object.keys(table).find(k => crReqOk(d, table[k].req));
}
// v12 design (setup + sabers, jedi/sith/grey) -> v13
function crMigrateV1(o) {
  const al = { jedi: "light", sith: "dark", grey: "grey" }[o.align] || (CUSTOM_ALIGN[o.align] ? o.align : "light");
  const sb = Array.isArray(o.sabers) ? o.sabers : [];
  const s = k => ({ hilt: crClampI(sb[k] && sb[k].hilt, SABER_HILTS.length), col: crClampI(sb[k] && sb[k].col, SABER_COLORS.length) });
  const setup = CUSTOM_SETUPS[o.setup] ? o.setup : "dual";
  const weapons = setup === "dual" ? [Object.assign({ k: "saber" }, s(0)), Object.assign({ k: "saber" }, s(1))]
    : [Object.assign({ k: setup === "staff" ? "staff" : "saber" }, s(0))];
  let hair = o.hair, head = "none";
  if (hair === 5) { hair = 0; head = "jediHood"; } else if (hair === 6) { hair = 2; head = "sithHood"; } else if (hair === 7) hair = 6;
  return Object.assign({}, o, { v: 2, align: al, force: "strong", weapons, hair, head,
    skills: al === "dark" ? ["lightning", "saberThrow"] : (al === "grey" ? ["saberThrow", "execute"] : ["saberThrow", "forcePush"]),
    gear: al === "dark" ? "lightning" : "forcePush", dash: "forceDash", armor: "robes" });
}
function customHeroSanitize(d) {
  let src = d && typeof d === "object" ? d : {};
  if (!Array.isArray(src.weapons)) src = crMigrateV1(src);           // v12 saves (setup + sabers) migrate; anything with a weapons list is v2
  const o = Object.assign({}, CUSTOM_DEFAULT, src);
  o.v = 2;
  o.name = String(o.name || CUSTOM_DEFAULT.name).replace(/[<>&"]/g, "").trim().slice(0, 22) || CUSTOM_DEFAULT.name;
  if (!CUSTOM_ALIGN[o.align]) o.align = "light";
  if (!CUSTOM_FORCE[o.force]) o.force = "strong";
  if (!CUSTOM_TALENTS[o.talent]) o.talent = "swift";
  if (!CUSTOM_ARMOR[o.armor]) o.armor = "robes";
  if (typeof CITY_UNIVERSES !== "undefined" ? !CITY_UNIVERSES[o.universe] : typeof o.universe !== "string") o.universe = "auto";   // v14 Nexus City universe
  o.species = crClampI(o.species, CUSTOM_SPECIES.length); o.body = crClampI(o.body, 2); o.skin = crClampI(o.skin, CUSTOM_SKINS.length);
  o.hair = crClampI(o.hair, CUSTOM_HAIR.length); o.robe = crClampI(o.robe, CUSTOM_ROBES.length);
  o.legs = crClampI(o.legs, CUSTOM_LEGS.length); o.cloak = crClampI(o.cloak, CUSTOM_CLOAKS.length);
  if (!CUSTOM_HEADGEAR.some(h => h.key === o.head)) o.head = "none";
  // weapons: 1-3 valid entries; sabers carry their own hilt + colour; a saberstaff can't share the loadout with other sabers
  let ws = (Array.isArray(o.weapons) ? o.weapons : []).filter(w => w && CUSTOM_WEAPONS[w.k]).slice(0, 3)
    .map(w => crIsSaber(w) ? { k: w.k, hilt: crClampI(w.hilt, SABER_HILTS.length), col: crClampI(w.col, SABER_COLORS.length) } : { k: w.k });
  const staffAt = ws.findIndex(w => w.k === "staff");
  if (staffAt >= 0) ws = ws.filter((w, i) => i === staffAt || !crIsSaber(w));
  if (!ws.length) ws = [{ k: "saber", hilt: 0, col: 0 }];
  o.weapons = ws;
  // v12-style callers may still pass { setup: "single" | "dual" | "staff" }: re-shape the lightsaber part to match
  // (internal edits strip the derived setup first, so this only fires for an explicit external request)
  const derived = crSaberSetup(o);
  if (src.setup && CUSTOM_SETUPS[src.setup] && derived !== "none" && src.setup !== derived) {
    const sab = ws.filter(crIsSaber), rest = ws.filter(w => !crIsSaber(w));
    const s0 = sab[0], s1 = sab[1] || { hilt: 6, col: 2 };
    const want = src.setup === "dual" ? [{ k: "saber", hilt: s0.hilt, col: s0.col }, { k: "saber", hilt: s1.hilt, col: s1.col }]
      : [{ k: src.setup === "staff" ? "staff" : "saber", hilt: s0.hilt, col: s0.col }];
    o.weapons = ws = want.concat(rest).slice(0, 3);
  }
  const setup = crSaberSetup(o);
  if (!CUSTOM_PATHS[o.path] || (setup !== "none" && !CUSTOM_PATHS[o.path].setups.includes(setup))) o.path = customDefaultPath(setup);
  // exactly 2 skills that the build can actually use
  const sk = [];
  (Array.isArray(o.skills) ? o.skills : []).forEach(k => { if (CUSTOM_SKILLS[k] && crReqOk(o, CUSTOM_SKILLS[k].req) && !sk.includes(k) && sk.length < 2) sk.push(k); });
  for (const k of ["forcePush", "saberThrow", "fanHammer", "thermal", "patronus", "grapple", "flamer", "stim"]) {
    if (sk.length >= 2) break;
    if (!sk.includes(k) && crReqOk(o, CUSTOM_SKILLS[k].req)) sk.push(k);
  }
  o.skills = sk;
  if (!CUSTOM_GEAR[o.gear] || !crReqOk(o, CUSTOM_GEAR[o.gear].req)) o.gear = crPickDefault(o, CUSTOM_GEAR, ["forcePush", "deadeye", "arcane", "wristRocket"]);
  if (!CUSTOM_DASHES[o.dash] || !crReqOk(o, CUSTOM_DASHES[o.dash].req)) o.dash = crPickDefault(o, CUSTOM_DASHES, [o.armor === "beskar" ? "jetpack" : "forceDash", "blink", "roll"]);
  o.created = !!o.created;
  // v12-compatible views (read-only): saber setup ("none" = no lightsaber) + the first two sabers' hilt / colour
  o.setup = setup;
  const sab = ws.filter(crIsSaber).map(w => ({ hilt: w.hilt, col: w.col }));
  while (sab.length < 2) sab.push({ hilt: 0, col: 0 });
  o.sabers = sab;
  return o;
}
function customDefaultPath(setup) { return setup === "dual" ? "jarkai" : (setup === "staff" ? "staff" : "djemso"); }
function customHeroDesign() {
  if (window._crDraft) return window._crDraft;                 // the creator's working draft (cleared whenever a run starts)
  if (typeof meta !== "undefined" && meta && meta.custom) return meta.custom;
  return crDefaultDesign || (crDefaultDesign = customHeroSanitize(CUSTOM_DEFAULT));
}
let crDefaultDesign = null;
function customHeroCreated() { return typeof meta !== "undefined" && !!(meta && meta.custom && meta.custom.created); }
function customSaberCol(d, k) { const s = d.weapons.filter(crIsSaber)[k] || d.sabers[k] || { col: 0 }; return SABER_COLORS[s.col][1]; }
// labels for twins: "#1 of 2" / "#2 of 2" for every duplicated catalog weapon
function crTwinTags(d) {
  const tags = [], cnt = {}, seen = {};
  d.weapons.forEach(w => { const key = crIsSaber(w) ? "saber" : w.k; cnt[key] = (cnt[key] || 0) + 1; });
  d.weapons.forEach(w => { const key = crIsSaber(w) ? "saber" : w.k; seen[key] = (seen[key] || 0) + 1;
    tags.push(cnt[key] > 1 ? { tag: ` #${seen[key]} of ${cnt[key]}`, idx: seen[key] - 1 } : { tag: "", idx: 0 }); });
  return tags;
}

/* --- small queries used by other modules --- */
function customForceTier() { return crForceTier(customHeroDesign()); }
function customAllegiance() { return customHeroDesign().align; }
function customHasMagic() { return crHasCat(customHeroDesign(), "magic"); }
function customHasJetpack() { return customHeroDesign().armor === "beskar"; }
function customHasBlade() { const d = customHeroDesign(); return crHasCat(d, "saber") || crHasCat(d, "blade"); }
function customAllyColor() {
  const d = customHeroDesign(), s = d.weapons.find(crIsSaber);
  if (s) { const c = SABER_COLORS[s.col][1]; return c === "#212121" ? "#e0e0e0" : c; }
  return "#69f0ae";
}
function customSenseKind() {
  const d = customHeroDesign(), t = crForceTier(d);
  if (t >= 1) return d.align === "dark" ? "sith" : (d.align === "light" ? "jedi" : "seer");
  if (crHasCat(d, "magic")) return "omen";
  if (d.align === "bounty" || d.armor === "beskar" || d.armor === "hunter" || d.armor === "duster") return "bounty";
  if (d.armor === "tactical" || d.armor === "cyborg") return "tracker";
  return "threat";
}
function customKinStyle() {
  const d = customHeroDesign(), cat = crWDef(d.weapons[0]).cat;
  if (cat === "saber" || cat === "blade") return 4;
  if (d.armor === "beskar") return 3;
  if (cat === "pistol") return 1;
  if (cat === "rifle" || cat === "heavy") return 2;
  if (cat === "magic") return 5;
  return 6;
}
function customGloryStyle(hasSaber) {
  const d = customHeroDesign();
  if (hasSaber || crHasCat(d, "saber") || crHasCat(d, "blade")) return "saber";
  if (crHasCat(d, "magic")) return "arcane";
  return "gun";
}
function customDashSpec() {
  const d = customHeroDesign(), s = CUSTOM_DASHES[d.dash] || CUSTOM_DASHES.roll;
  const sc = customAllyColor();
  const col = s.style === "jetpackSlam" ? "#ff9100" : (s.style === "apparitionBlink" ? "#b388ff" : (s.style === "gunslingerRoll" ? "#ffd166" : sc));
  return { name: s.name, cd: s.cd, dist: s.dist, style: s.style, col, callout: s.callout, desc: s.desc };
}
function customSpellLadder() {
  if (!crHasCat(customHeroDesign(), "magic")) return null;
  return [
    [1, "Wand Hex", "stupefyBolt", "beam", 4.0, "Fires a focused arcane wand hex"],
    [2, "Leviosa", "leviosaFloat", "orbit", 6.0, "Floats nearby enemies skyward & off-screen for XP"],
    [4, "Conjure Ally", "summonHound", "orbit", 7.5, "Conjures an arcane familiar to fight beside you"],
    [5, "Grand Spell", "patronusStag", "nova", 8.0, "Unleashes a radiant signature spell wave"]
  ];
}
function customNeckCol() {
  const d = customHeroDesign();
  if (d.armor === "beskar" || d.armor === "tactical" || d.armor === "cyborg") return null;
  return d.armor === "duster" ? "#efebe9" : CUSTOM_SKINS[d.skin];
}
function customHandCol() {
  const d = customHeroDesign(), h = CUSTOM_HEADGEAR.find(x => x.key === d.head);
  if (d.armor === "beskar" || (h && h.helmet)) return "#3e2723";
  if (d.species === 5) return "#90a4ae";
  return CUSTOM_SKINS[d.skin];
}

/* === 3. REGISTRATION (CHAR_RAW[80] + every per-hero table) === */
let customPalCache = null;
function customHeroRegister() {
  const d = customHeroDesign();
  const al = CUSTOM_ALIGN[d.align], tal = CUSTOM_TALENTS[d.talent], fo = CUSTOM_FORCE[d.force], ar = CUSTOM_ARMOR[d.armor];
  const setup = crSaberSetup(d), path = CUSTOM_PATHS[d.path] || CUSTOM_PATHS.djemso;
  const w0 = crWDef(d.weapons[0]);
  const wName = d.weapons.length > 1 ? d.weapons.map(w => crWDef(w).name).join(" + ") : (crIsSaber(d.weapons[0]) && w0.id === 80
    ? SABER_HILTS[d.weapons[0].hilt].name + (d.weapons[0].k === "staff" ? " Saberstaff" : " Lightsaber") : w0.name);
  const prime = path.stages[path.stages.length - 1];
  CHAR_RAW[CUSTOM_CID] = [CUSTOM_CID, 0, 0, d.name, wName, setup !== "none" ? prime[2] + " Supremacy" : "Legend of the Nexus", crIsSaber(d.weapons[0]) ? "orbit" : (CHAR_RAW[w0.id] ? CHAR_RAW[w0.id][6] : "beam"),
    tal.name, `${al.name} · ${fo.name} · ${ar.name}: ${tal.desc}`];
  // membership lists (live arrays / sets used across the engine)
  const setIn = (arr, on) => { const i = arr.indexOf(CUSTOM_CID); if (on && i < 0) arr.push(CUSTOM_CID); if (!on && i >= 0) arr.splice(i, 1); };
  setIn(SWORD_HEROES, true);                                   // id 80 = the custom lightsaber weapon id (non-saber weapons use their own ids)
  setIn(FORCE_VACUUM_HEROES, fo.tier >= 2);
  setIn(BAD_HEROES, d.align === "dark");
  if (typeof BOUNTY_HEROES !== "undefined") setIn(BOUNTY_HEROES, d.align === "bounty" || (d.align === "grey" && (d.armor === "beskar" || d.armor === "hunter" || d.armor === "duster")));
  if (typeof HELMET_HEROES !== "undefined") { const h = CUSTOM_HEADGEAR.find(x => x.key === d.head); if (h && h.helmet) HELMET_HEROES.add(CUSTOM_CID); else HELMET_HEROES.delete(CUSTOM_CID); }
  if (typeof FEMALE_HEROES !== "undefined") { if (d.body === 1) FEMALE_HEROES.add(CUSTOM_CID); else FEMALE_HEROES.delete(CUSTOM_CID); }
  if (typeof HERO_SIG_GEAR !== "undefined") {
    const g = CUSTOM_GEAR[d.gear] || CUSTOM_GEAR.wristRocket;
    const lv5 = setup === "dual" ? "Kyber-Attuned Saber" : (setup === "staff" ? "Kyber-Attuned Saberstaff" : (setup === "single" ? "Kyber-Attuned Lightsaber" : "Masterwork " + w0.name));
    const call = setup === "dual" ? "TWIN SABERS IGNITED!" : (setup === "staff" ? "BOTH BLADES IGNITED!" : (setup === "single" ? "LIGHTSABER IGNITED!" : "LOCKED AND LOADED!"));
    HERO_SIG_GEAR[CUSTOM_CID] = [lv5, call, g.name, g.st, g.mult, g.cd];
  }
  if (typeof UTILS_56 !== "undefined") UTILS_56[CUSTOM_CID] = d.skills.map(k => CUSTOM_SKILLS[k].u.slice());
  if (typeof Q_56 !== "undefined") {
    Q_56[CUSTOM_CID] = d.align === "dark" ? ["Peace is a lie. There is only passion.", "Your hate will make you strong.", "Kneel."]
      : (d.align === "grey" ? ["I serve no Order.", "Choose your next move carefully.", "The Force is not light or dark. It simply is."]
      : (d.align === "bounty" ? ["I can bring you in warm, or I can bring you in cold.", "This is the Way.", "Nothing personal. Just business."]
      : ["I am one with the Force.", "There is another way.", "May the Force be with you."]));
  }
  if (typeof SABER_PATHS !== "undefined") {
    SABER_PATHS[CUSTOM_CID] = { who: d.name, stages: path.stages.map((s, k) => ({ lv: s[1], form: s[0], era: d.name, title: s[2],
      prime: k === path.stages.length - 1, blurb: path.desc })) };
  }
  if (typeof HERO_STANCE_TABLE !== "undefined" && setup === "none") {
    // no lightsaber: the stance read-out follows the primary weapon's own stance table (or none)
    if (HERO_STANCE_TABLE[w0.id] && w0.id !== CUSTOM_CID) HERO_STANCE_TABLE[CUSTOM_CID] = HERO_STANCE_TABLE[w0.id]; else delete HERO_STANCE_TABLE[CUSTOM_CID];
  } else if (typeof HERO_STANCE_TABLE !== "undefined") {
    const pat = f => ({ shiicho: 0, makashi: 1, soresu: 2, ataru: 3, djemso: 4, shien: 4, niman: 5, juyo: 6, vaapad: 6, jarkai: 5 })[(SABER_FORMS[f] && SABER_FORMS[f].base) || f] ?? (f.startsWith("staff") ? 7 : 0);
    const st = path.stages, lbl = s => `Form ${SABER_FORMS[s[0]].num} ${SABER_FORMS[s[0]].name} (${s[2]})`;
    HERO_STANCE_TABLE[CUSTOM_CID] = [[pat(st[0][0]), lbl(st[0]), 1.0, 0.8, 0.5], [pat(st[2][0]), lbl(st[2]), 1.3, 1.1, 0.8], [pat(st[3][0]), lbl(st[3]), 1.55, 1.3, 1.1], [2, "Form III Soresu Blaster Deflect"]];
  }
  if (typeof WPN_SVG_56 !== "undefined") {
    const sab = d.weapons.filter(crIsSaber), dark = c => (c === "#212121" ? "#9e9e9e" : c);
    const c1 = sab[0] ? SABER_COLORS[sab[0].col][1] : "#ffd166", c2 = sab[1] ? SABER_COLORS[sab[1].col][1] : c1;
    if (!sab.length) {
      const gunCol = d.weapons.length > 1 ? "#ffd166" : "#cfd8dc";
      WPN_SVG_56[CUSTOM_CID] = () => `<path d="M3 9h13l3-2v4H9l-2 6H4l1-6H3z" fill="${gunCol}"/>` + (d.weapons.length > 1 ? `<path d="M6 17h13l3-2v4h-10l-2 4H7l1-4H6z" fill="#90a4ae"/>` : "");
    } else if (setup === "dual") {
      WPN_SVG_56[CUSTOM_CID] = () => `<line x1="5" y1="15" x2="16" y2="3" stroke="${dark(c1)}" stroke-width="3" stroke-linecap="round"/><line x1="2" y1="19" x2="5" y2="15" stroke="#90a4ae" stroke-width="2.6"/><line x1="11" y1="20" x2="22" y2="8" stroke="${dark(c2)}" stroke-width="3" stroke-linecap="round"/><line x1="8" y1="23" x2="11" y2="20" stroke="#90a4ae" stroke-width="2.6"/>`;
    } else if (setup === "staff") {
      WPN_SVG_56[CUSTOM_CID] = () => `<line x1="2" y1="22" x2="22" y2="2" stroke="${dark(c1)}" stroke-width="3" stroke-linecap="round"/><line x1="9" y1="15" x2="15" y2="9" stroke="#90a4ae" stroke-width="3.5"/>`;
    } else {
      WPN_SVG_56[CUSTOM_CID] = () => `<line x1="8" y1="16" x2="21" y2="3" stroke="${dark(c1)}" stroke-width="4" stroke-linecap="round"/><line x1="3" y1="21" x2="8" y2="16" stroke="#90a4ae" stroke-width="3"/>`;
    }
  }
  customPalCache = null;
}

/* === 4. LOOK (used by js/data-heroes.js getHeroOutfits + js/render.js drawHeroSprite) === */
function customHeroOutfits() {
  if (customPalCache && customPalCache.d === customHeroDesign()) return customPalCache.pal;
  const d = customHeroDesign(), h = CUSTOM_HAIR[d.hair];
  const sab = d.weapons.filter(crIsSaber);
  const back = d.armor === "beskar" ? ["Beskar Jetpack", "#607d8b"] : CUSTOM_CLOAKS[d.cloak];
  const bl = sab.length ? sab.map(s => SABER_COLORS[s.col]) : [["Muzzle Gold", "#ffd166"]];
  while (bl.length < 2) bl.push(bl[0]);
  const pal = {
    head: [[h[0], h[1] === "none" ? CUSTOM_SKINS[d.skin] : h[1]]], torso: [CUSTOM_ROBES[d.robe]], legs: [CUSTOM_LEGS[d.legs]],
    back: [back], blade: bl.map(c => [c[0], c[1]])
  };
  customPalCache = { d, pal };
  return pal;
}
function customSkinCol() { return CUSTOM_SKINS[customHeroDesign().skin]; }
function customHairStyle() {
  const d = customHeroDesign(), hg = CUSTOM_HEADGEAR.find(x => x.key === d.head), h = CUSTOM_HAIR[d.hair];
  if (hg && hg.hood) return "hood";
  return h[1] === "none" ? "bald" : (h[2] === "long" ? "long" : "hair");
}
// species details drawn over the head (sprite space, head centre ~ (0, -9.3), r 5.2)
function drawCustomSpeciesExtras(t, eyeLookX) {
  const d = customHeroDesign(), sp = CUSTOM_SPECIES[d.species].key, skin = CUSTOM_SKINS[d.skin];
  if (CUSTOM_HAIR[d.hair][2] === "long" && d.head !== "jediHood" && d.head !== "sithHood") {   // long hair falls to the shoulders
    t.fillStyle = CUSTOM_HAIR[d.hair][1];
    t.fillRect(-5.6, -10.5, 1.8, 7.5); t.fillRect(3.8, -10.5, 1.8, 7.5);
  }
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
  drawCustomHeadgear(t, eyeLookX);
}
function customHoodOver(t, col) {     // hood drawn over the hair line, framing the face
  t.fillStyle = col;
  t.beginPath(); t.arc(0, -9.6, 6.6, Math.PI * 0.86, Math.PI * 2.14); t.lineTo(6.2, -5.4); t.lineTo(4.6, -5.4); t.lineTo(4.4, -9.2);
  t.arc(0, -9.3, 4.5, -0.05, Math.PI + 0.05, true); t.lineTo(-4.6, -5.4); t.lineTo(-6.2, -5.4); t.closePath(); t.fill();
}
// hats / hoods / goggles on an uncovered head
function drawCustomHeadgear(t, eyeLookX) {
  const d = customHeroDesign(), hg = CUSTOM_HEADGEAR.find(x => x.key === d.head);
  if (!hg || hg.key === "none" || hg.helmet) return;
  if (hg.hood) { customHoodOver(t, hg.col); return; }
  if (hg.key === "cowboy") {
    t.fillStyle = "#4e342e";
    t.beginPath(); t.moveTo(-4.8, -12.4); t.lineTo(-3.6, -17.2); t.quadraticCurveTo(0, -15.6, 3.6, -17.2); t.lineTo(4.8, -12.4); t.closePath(); t.fill();
    t.fillStyle = "#3e2723"; t.beginPath(); t.ellipse(0, -12.6, 8.6, 1.5, 0, 0, Math.PI * 2); t.fill();
    t.fillStyle = "#8d6e63"; t.fillRect(-4.6, -13.6, 9.2, 1.0);
  } else if (hg.key === "wizard") {
    t.fillStyle = hg.col;
    t.beginPath(); t.moveTo(-5.2, -12.6); t.quadraticCurveTo(-1.2, -16.0, 2.0, -22.5); t.quadraticCurveTo(2.4, -16.5, 5.2, -12.6); t.closePath(); t.fill();
    t.beginPath(); t.ellipse(0, -12.6, 7.8, 1.4, 0, 0, Math.PI * 2); t.fill();
    t.fillStyle = "#ffd166"; t.beginPath(); t.arc(0.6, -16.2, 0.9, 0, Math.PI * 2); t.fill();
  } else if (hg.key === "goggles") {
    t.fillStyle = "#3e2723"; t.fillRect(-5.3, -13.1, 10.6, 1.3);
    t.fillStyle = hg.col; t.beginPath(); t.arc(-2.2, -13.0, 1.7, 0, Math.PI * 2); t.arc(2.2, -13.0, 1.7, 0, Math.PI * 2); t.fill();
    t.fillStyle = "#80deea"; t.beginPath(); t.arc(-2.2, -13.0, 1.0, 0, Math.PI * 2); t.arc(2.2, -13.0, 1.0, 0, Math.PI * 2); t.fill();
  }
}
// full helmets (the head is covered): Mandalorian T-visor or a tactical visor
function drawCustomHelmet(t, eyeLookX, isLive) {
  const d = customHeroDesign();
  if (d.head === "mando") {
    t.fillStyle = "#90a4ae"; t.beginPath(); t.arc(0, -9.5, 5.6, 0, Math.PI * 2); t.fill();
    t.fillStyle = "#cfd8dc"; t.beginPath(); t.arc(-1.6, -11.6, 2.2, Math.PI, Math.PI * 1.8); t.lineTo(-1.6, -11.6); t.fill();
    t.fillStyle = "#111"; t.fillRect(-3.9, -10.9, 7.8, 1.9); t.fillRect(-1.05, -10.9, 2.1, 4.8);
    t.strokeStyle = "#546e7a"; t.lineWidth = 0.6; t.beginPath(); t.moveTo(-5.0, -7.2); t.lineTo(-2.6, -5.6); t.moveTo(5.0, -7.2); t.lineTo(2.6, -5.6); t.stroke();
    const visorOn = !isLive || player.activeVisor === 1;
    t.strokeStyle = "#b0bec5"; t.lineWidth = 1.1; t.beginPath(); t.moveTo(5.2, -10);
    if (visorOn) { t.lineTo(7.0, -12.4); t.lineTo(2.6, -12.4); t.stroke(); t.fillStyle = "#ff1744"; t.fillRect(1.4, -13.1, 2.0, 1.4); }
    else { t.lineTo(5.2, -16.2); t.stroke(); }
  } else {
    t.fillStyle = "#37474f"; t.beginPath(); t.arc(0, -9.6, 5.6, 0, Math.PI * 2); t.fill();
    t.fillStyle = "#263238"; t.fillRect(-5.6, -9.6, 11.2, 1.0);
    t.fillStyle = "#0d1b2a"; t.fillRect(-4.2, -11.3, 8.4, 2.5);
    t.fillStyle = "#40c4ff"; t.fillRect(-3.4 + eyeLookX * 0.5, -10.7, 6.8, 1.0);
    t.fillStyle = "#546e7a"; t.fillRect(4.4, -13.4, 1.0, 3.0);
  }
}
// armour over the torso (after the legs + torso fill)
function drawCustomArmor(t, stride, cTorso) {
  const d = customHeroDesign(), a = d.armor;
  if (a === "robes") {
    t.fillStyle = cTorso; t.fillRect(-5.8, 4.0, 11.6, 3.4);                    // robe skirt
    t.fillStyle = "rgba(0,0,0,0.18)"; t.fillRect(-1.5, -5.5, 3.0, 12.9);       // tabard
    t.fillStyle = "rgba(255,255,255,0.12)"; t.beginPath(); t.moveTo(-5.8, -5.5); t.lineTo(0, 1.2); t.lineTo(5.8, -5.5); t.lineTo(3.6, -5.5); t.lineTo(0, -1.4); t.lineTo(-3.6, -5.5); t.closePath(); t.fill();
  } else if (a === "beskar") {
    t.fillStyle = "#b0bec5"; t.fillRect(-4.9, -4.9, 9.8, 6.0);
    t.fillStyle = "#eceff1"; t.fillRect(-4.3, -4.4, 3.6, 2.2); t.fillRect(0.7, -4.4, 3.6, 2.2);
    t.fillStyle = "#90a4ae"; t.beginPath(); t.arc(-6.0, -4.3, 2.4, 0, Math.PI * 2); t.arc(6.0, -4.3, 2.4, 0, Math.PI * 2); t.fill();
    t.fillStyle = "#4e342e"; t.fillRect(-5.8, 2.4, 11.6, 1.6); t.fillStyle = "#6d4c41"; t.fillRect(-4.6, 2.6, 1.8, 2.2); t.fillRect(2.8, 2.6, 1.8, 2.2);
  } else if (a === "duster") {
    const sw = stride * 0.35;
    t.fillStyle = "#8d6e63";
    t.beginPath(); t.moveTo(-6.6, -5.5); t.lineTo(-2.0, -5.5); t.lineTo(-2.4 + sw, 10.8); t.lineTo(-7.2 + sw, 10.4); t.closePath(); t.fill();
    t.beginPath(); t.moveTo(2.0, -5.5); t.lineTo(6.6, -5.5); t.lineTo(7.2 - sw, 10.4); t.lineTo(2.4 - sw, 10.8); t.closePath(); t.fill();
    t.fillStyle = "#6d4c41"; t.fillRect(-6.6, -5.5, 13.2, 1.6);                // shoulder cape
    t.strokeStyle = "#3e2723"; t.lineWidth = 1.2; t.beginPath(); t.moveTo(-5.4, 0.6); t.lineTo(4.8, 3.6); t.stroke();   // gun belt
    t.fillStyle = "#ffd166"; for (let k = 0; k < 4; k++) t.fillRect(-3.8 + k * 2.4, 1.3 + k * 0.72, 0.8, 0.8);
  } else if (a === "tactical") {
    t.fillStyle = "#37474f"; t.fillRect(-5.3, -4.9, 10.6, 8.2);
    t.fillStyle = "#263238"; t.fillRect(-4.4, 0.4, 2.4, 2.2); t.fillRect(-1.2, 0.4, 2.4, 2.2); t.fillRect(2.0, 0.4, 2.4, 2.2);
    t.fillStyle = "#546e7a"; t.fillRect(-5.3, -4.9, 10.6, 1.0);
  } else if (a === "wizard") {
    t.fillStyle = cTorso;
    t.beginPath(); t.moveTo(-5.8, -5.5); t.lineTo(5.8, -5.5); t.lineTo(7.6, 10.6); t.lineTo(-7.6, 10.6); t.closePath(); t.fill();
    t.fillStyle = "rgba(255,209,102,0.85)"; [[-3.6, 4.2], [3.0, 7.6], [0.4, 1.0], [-4.6, 8.8], [4.6, 2.8]].forEach(([sx, sy]) => t.fillRect(sx, sy, 0.9, 0.9));
    t.fillStyle = "rgba(0,0,0,0.25)"; t.fillRect(-0.6, -5.5, 1.2, 16.1);
  } else if (a === "cyborg") {
    t.fillStyle = "#90a4ae"; t.fillRect(0, -5.2, 5.6, 9.8);
    t.fillStyle = "#546e7a"; t.fillRect(0, -1.2, 5.6, 0.8); t.fillRect(0, 1.6, 5.6, 0.8);
    t.fillStyle = "#00e5ff"; t.beginPath(); t.arc(-2.2, -2.0, 1.4, 0, Math.PI * 2); t.fill();
  } else if (a === "hunter") {
    t.strokeStyle = "#3e2723"; t.lineWidth = 1.8; t.beginPath(); t.moveTo(-5.2, -5.0); t.lineTo(5.0, 3.8); t.stroke();
    t.fillStyle = "#ffb300"; for (let k = 0; k < 5; k++) t.fillRect(-4.2 + k * 2.0, -4.0 + k * 1.72, 0.8, 1.0);
    t.fillStyle = "#4e342e"; t.fillRect(-5.8, 2.6, 11.6, 1.8); t.fillStyle = "#6d4c41"; t.fillRect(-5.0, 2.8, 2.0, 2.4); t.fillRect(3.0, 2.8, 2.0, 2.4);
  }
}
// the weapons drawn on a non-live sprite (roster card, creator preview)
function customPreviewWeapons() {
  const d = customHeroDesign(), tags = crTwinTags(d);
  return d.weapons.slice(0, 3).map((w, i) => {
    const def = crWDef(w);
    if (def.cat === "saber") return { id: CUSTOM_CID, style: "orbit", lvl: 1, bladeCol: SABER_COLORS[w.col][1], ownCol: true, hilt: w.hilt, dbl: w.k === "staff", twinIdx: tags[i].idx };
    return { id: def.id, style: CHAR_RAW[def.id] ? CHAR_RAW[def.id][6] : "beam", lvl: 1, bladeCol: getWeaponColor(def.id), twinIdx: tags[i].idx };
  });
}

/* === 5. RUN START (called from js/combat.js startRun for hero #80) === */
function customHeroApplyRun(p) {
  const d = customHeroDesign(), tags = crTwinTags(d), tier = crForceTier(d);
  p.weapons = d.weapons.map((wd, i) => {
    const def = crWDef(wd), tag = tags[i].tag;
    if (def.cat === "saber") {
      const h = SABER_HILTS[wd.hilt];
      return { id: CUSTOM_CID, name: h.name + (wd.k === "staff" ? " Saberstaff" : " Lightsaber") + tag, superName: CHAR_RAW[CUSTOM_CID][5],
        style: "orbit", lvl: 1, cd: 0, ang: 0, angVel: 0, enabled: true, evolvedLv5: false, bladeCol: SABER_COLORS[wd.col][1],
        ownCol: true, hilt: wd.hilt, bladeK: h.blade || 1, dualTag: tag, dbl: wd.k === "staff", twinIdx: tags[i].idx };
    }
    const c = CHAR_RAW[def.id];
    return { id: def.id, name: def.name + tag, superName: c ? c[5] : def.name, style: c ? c[6] : "beam", lvl: 1, cd: i * 0.08, ang: 0, angVel: 0,
      enabled: true, evolvedLv5: false, bladeCol: getWeaponColor(def.id), dualTag: tag, twinIdx: tags[i].idx };
  });
  const blade = crHasCat(d, "saber") || crHasCat(d, "blade");
  p.hasSaber = blade; p.saberMastery = blade ? 25 : 0; p.armCap = Math.max(p.armCap || 2, 3);
  // the Force
  p.orbVacuumRate = [0, 0.35, 1.0][tier];
  if (tier === 0) p.maxHp *= 1.10;
  if (tier === 1) p.dodge += 0.05;
  const visor = tier >= 1 ? 4 : (d.armor === "beskar" || d.head === "mando" ? 1 : (d.armor === "tactical" || d.head === "tactical" ? 2 : 0));
  p.unlockedVisors = visor ? [visor] : []; p.visorsUnlocked = p.unlockedVisors; p.activeVisor = visor;
  if (tier >= 2 && d.align === "dark") p.killHeal = 0.9;
  // talent / allegiance / armor
  if (d.talent === "swift") { p.spd *= 1.15; p.dodge += 0.10; }
  else if (d.talent === "resilient") { p.maxHp *= 1.25; p.armor += 2; }
  else if (d.talent === "fierce") { p.might += 0.20; p.crit += 0.10; }
  else { p.crit += 0.18; p.cdmg += 0.25; p.projSpd += 0.10; }
  if (d.align === "light") p.regen += 0.6; else if (d.align === "dark") p.cdmg += 0.25; else if (d.align === "grey") p.greed += 0.15; else { p.crit += 0.08; p.dmGreed = (p.dmGreed || 0) + 0.2; }
  switch (d.armor) {
    case "robes": p.spd *= 1.08; p.dodge += 0.05; break;
    case "beskar": p.armor += 4; p.flying = true; p.hover = true; p.hazImmune = true; break;
    case "duster": p.crit += 0.12; p.cdmg += 0.15; break;
    case "tactical": p.armor += 3; p.maxHp *= 1.15; break;
    case "wizard": p.cdr *= 0.88; p.area *= 1.12; break;
    case "cyborg": p.armor += 2; p.regen += 1.2; break;
    case "hunter": p.greed += 0.15; p.spd *= 1.10; break;
  }
  if (p.flying) setTimeout(() => { if (player === p && runActive) spawnSpeech(p.x, p.y - 30, "JETPACK ONLINE — YOU'RE FLYING!", "#ff9100", 2.6); }, 900);
}

/* === 5b. CREATOR SKILLS: Thermal Detonator + Force Choke (utility types in js/combat.js triggerUtility) === */
const crKit = { nades: [], chokes: [] };
function throwThermalDetonator() {
  if (!player) return;
  let best = -1, bd = 1e9;
  for (let j = 0; j < MAX_E; j++) {
    if (!eAct[j] || (typeof sdIgnore === "function" && sdIgnore(j)) || eStagger[j] > 0 || !isEnemyOnScreen(j)) continue;
    // aim at the middle of a crowd: count neighbours
    let n = 0; for (let k = 0; k < MAX_E; k += 3) if (eAct[k] && Math.abs(eX[k] - eX[j]) < 60 && Math.abs(eY[k] - eY[j]) < 60) n++;
    const s = Math.hypot(eX[j] - player.x, eY[j] - player.y) - n * 25;
    if (s < bd) { bd = s; best = j; }
  }
  const tx = best >= 0 ? eX[best] : player.x + Math.cos(player.aim) * 140, ty = best >= 0 ? eY[best] : player.y + Math.sin(player.aim) * 140;
  const d = Math.min(240, Math.hypot(tx - player.x, ty - player.y)), a = Math.atan2(ty - player.y, tx - player.x);
  crKit.nades.push({ x0: player.x, y0: player.y, x1: player.x + Math.cos(a) * d, y1: player.y + Math.sin(a) * d, t: 0, fly: 0.55, fuse: 0.55, beep: 0 });
  spawnSpeech(player.x, player.y - 16, "THERMAL DETONATOR!", "#ffd166", 1.2);
  sfx(700, 900, 0.05, "square", 0.08);
}
function castForceChoke() {
  if (!player) return;
  let best = -1, bh = -1;
  for (let j = 0; j < MAX_E; j++) {
    if (!eAct[j] || (typeof sdIgnore === "function" && sdIgnore(j)) || eStagger[j] > 0 || eType[j] === 99) continue;
    const dd = Math.hypot(eX[j] - player.x, eY[j] - player.y);
    if (dd > 230) continue;
    if (eHP[j] > bh) { bh = eHP[j]; best = j; }
  }
  if (best < 0) { executeForceKineticPush(player.x, player.y, player.aim, 6, 60 * (player.might || 1)); return; }
  crKit.chokes.push({ j: best, uid: eUid[best], t: 0, dur: 1.6 });
  player.forceHandTimer = 1.6; player.forceHandAng = Math.atan2(eY[best] - player.y, eX[best] - player.x);
  spawnSpeech(player.x, player.y - 18, "\"I find your lack of faith disturbing.\"", "#ff5252", 1.8);
  sfxTone(90, 60, 1.2, "sawtooth", 0.08, 0);
}
function crKitStep(simDt) {
  if (!player) return;
  for (let k = crKit.nades.length - 1; k >= 0; k--) {
    const g = crKit.nades[k];
    g.t += simDt;
    if (g.t > g.fly) {
      g.beep -= simDt;
      if (g.beep <= 0) { g.beep = 0.16; if (opts.vol > 0) sfxTone(1500, 1500, 0.03, "square", 0.05, 0); }
      if (g.t >= g.fly + g.fuse) {
        const lvl = player.weapons[0] ? player.weapons[0].lvl : 1;
        triggerRocketDetonation(g.x1, g.y1, (240 + 30 * lvl + 1.6 * runTime) * (player.might || 1), 95 * (player.area || 1));
        if (typeof fxShake === "function") fxShake(4, 0.3);
        crKit.nades.splice(k, 1);
      }
    }
  }
  for (let k = crKit.chokes.length - 1; k >= 0; k--) {
    const c = crKit.chokes[k], j = c.j;
    if (!eAct[j] || eUid[j] !== c.uid) { crKit.chokes.splice(k, 1); continue; }
    c.t += simDt;
    eStun[j] = Math.max(eStun[j], 0.3);
    if (typeof eFLiftZ !== "undefined") eFLiftZ[j] = Math.min(16, c.t * 22);
    player.forceHandAng = Math.atan2(eY[j] - player.y, eX[j] - player.x);
    const dmg = (eType[j] >= 98 ? Math.max(eMax[j] * 0.14, 160) : Math.max(eMax[j] * 1.05, 220)) * (player.might || 1) * simDt / c.dur;   // crushes a regular, hurts an elite
    eHP[j] -= dmg;
    if (eHP[j] <= 0) { if (typeof eFLiftZ !== "undefined") eFLiftZ[j] = 0; killEnemy(j, false); crKit.chokes.splice(k, 1); continue; }
    if (c.t >= c.dur) { if (typeof eFLiftZ !== "undefined") eFLiftZ[j] = 0; eStun[j] = Math.max(eStun[j], 0.8); crKit.chokes.splice(k, 1); }
    else if (eHP[j] <= eMax[j] * 0.02 && eType[j] < 98) { eFLiftZ[j] = 0; killEnemy(j, false); crKit.chokes.splice(k, 1); }
  }
}
function crKitRender(c) {
  if (!player) return;
  const now = performance.now() / 1000;
  for (const g of crKit.nades) {
    const u = Math.min(1, g.t / g.fly), x = g.x0 + (g.x1 - g.x0) * u, y = g.y0 + (g.y1 - g.y0) * u - Math.sin(u * Math.PI) * 34;
    c.save();
    c.fillStyle = "rgba(0,0,0,0.3)"; c.beginPath(); c.ellipse(g.x0 + (g.x1 - g.x0) * u, g.y0 + (g.y1 - g.y0) * u + 3, 3, 1.2, 0, 0, Math.PI * 2); c.fill();
    c.fillStyle = "#b0bec5"; c.beginPath(); c.arc(x, y, 3, 0, Math.PI * 2); c.fill();
    c.fillStyle = "#546e7a"; c.fillRect(x - 3, y - 0.6, 6, 1.2);
    const on = g.t > g.fly ? (Math.floor(now * 12) % 2 === 0) : true;
    c.fillStyle = on ? "#ff1744" : "#5d0000"; c.beginPath(); c.arc(x + 1, y - 1, 1.1, 0, Math.PI * 2); c.fill();
    if (g.t > g.fly) { c.strokeStyle = "rgba(255,23,68,0.5)"; c.lineWidth = 1; c.beginPath(); c.arc(g.x1, g.y1, 92 * (player.area || 1) * ((g.t - g.fly) / g.fuse), 0, Math.PI * 2); c.stroke(); }
    c.restore();
  }
  for (const ch of crKit.chokes) {
    const j = ch.j; if (!eAct[j] || eUid[j] !== ch.uid) continue;
    c.save(); c.strokeStyle = "rgba(255,23,68,0.65)"; c.lineWidth = 1.4;
    c.beginPath(); c.arc(eX[j], eY[j] - (eFLiftZ[j] || 0) - 6, 6 + Math.sin(now * 20) * 1.2, 0, Math.PI * 2); c.stroke(); c.restore();
  }
}
V10.onStep.push(crKitStep);
V10.onRenderWorld.push(crKitRender);
V10.onRunReset.push(function crKitReset() {
  crKit.nades.length = 0; crKit.chokes.length = 0;
  // a run always uses the SAVED hero: drop an unsaved creator draft before startRun reads the hero tables
  if (window._crDraft) { window._crDraft = null; customHeroRegister(); }
});

/* === 6. CREATOR SCREEN === */
function openCreator() {
  const cur = document.querySelector(".screen.active");
  window._crFrom = (cur && cur.id !== "scrCreate") ? cur.id : (window._crFrom || "scrMain");
  window._crDraft = customHeroSanitize(JSON.parse(JSON.stringify(customHeroCreated() ? meta.custom : CUSTOM_DEFAULT)));
  window._crMsg = "";
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
function crCommit(d) {
  delete d.setup; delete d.sabers;                              // derived views - never let a stale one re-shape the loadout
  window._crDraft = customHeroSanitize(d);
  customHeroRegister();
  renderCreator();
  sfx(380, 620, 0.05, "triangle", 0.12);
}
// v12-compatible setter + the v13 keys
function crSet(key, val) {
  const d = window._crDraft; if (!d) return;
  window._crMsg = "";
  if (key.startsWith("sab")) {                                 // sab{k}_{hilt|col} -> the k-th lightsaber in the loadout
    const k = +key[3], f = key.slice(5), sab = d.weapons.filter(crIsSaber);
    if (sab[k]) sab[k][f] = +val;
  } else if (key === "setup") {                                // quick saber setup: swap the lightsaber part of the loadout
    const sab = d.weapons.filter(crIsSaber), rest = d.weapons.filter(w => !crIsSaber(w));
    const s0 = sab[0] || { hilt: 0, col: 0 }, s1 = sab[1] || { hilt: 6, col: 2 };
    const want = val === "dual" ? [{ k: "saber", hilt: s0.hilt, col: s0.col }, { k: "saber", hilt: s1.hilt, col: s1.col }]
      : [{ k: val === "staff" ? "staff" : "saber", hilt: s0.hilt, col: s0.col }];
    d.weapons = want.concat(rest).slice(0, 3);
    if (!CUSTOM_PATHS[d.path] || !CUSTOM_PATHS[d.path].setups.includes(val)) d.path = customDefaultPath(val);
  } else if (/^w\d_k$/.test(key)) {                            // weapon slot model
    const k = +key[1], def = CUSTOM_WEAPONS[val]; if (!def || !d.weapons[k]) return;
    const old = d.weapons[k];
    d.weapons[k] = def.cat === "saber" ? { k: val, hilt: old.hilt || 0, col: old.col || 0 } : { k: val };
    if (val === "staff") d.weapons = d.weapons.filter((w, i) => i === k || !crIsSaber(w));
    else if (def.cat === "saber") d.weapons = d.weapons.map((w, i) => (i !== k && w.k === "staff") ? { k: "saber", hilt: w.hilt, col: w.col } : w);
  } else if (/^w\d_cat$/.test(key)) {                          // weapon slot category -> first model of that category
    const k = +key[1], first = Object.keys(CUSTOM_WEAPONS).find(x => CUSTOM_WEAPONS[x].cat === val);
    if (first) return crSet("w" + k + "_k", first);
  } else if (key === "skill") {                                // toggle; a third pick replaces the older one
    const s = CUSTOM_SKILLS[val]; if (!s) return;
    if (!crReqOk(d, s.req)) { window._crMsg = `🔒 ${s.u[0]} needs ${CUSTOM_REQ_TXT[s.req]}.`; renderCreator(); return; }
    const i = d.skills.indexOf(val);
    if (i >= 0) { window._crMsg = "Pick another skill to replace it (exactly 2)."; renderCreator(); return; }
    d.skills = [d.skills[d.skills.length - 1], val].filter(Boolean).slice(-2);
  } else if (key === "gear" || key === "dash") {
    const tbl = key === "gear" ? CUSTOM_GEAR : CUSTOM_DASHES, it = tbl[val]; if (!it) return;
    if (!crReqOk(d, it.req)) { window._crMsg = `🔒 ${it.name} needs ${CUSTOM_REQ_TXT[it.req]}.`; renderCreator(); return; }
    d[key] = val;
  } else if (key === "armor") {
    d.armor = val;
    if (val === "beskar" && d.dash !== "jetpack") d.dash = "jetpack";
  } else d[key] = (typeof CUSTOM_DEFAULT[key] === "number") ? +val : val;
  crCommit(d);
}
function crCycle(key, n, dir) {
  const d = window._crDraft; if (!d) return;
  let cur;
  if (key.startsWith("sab")) { const s = d.weapons.filter(crIsSaber)[+key[3]]; cur = s ? s[key.slice(5)] : 0; }
  else if (key === "head") { const i = CUSTOM_HEADGEAR.findIndex(h => h.key === d.head); return crSet("head", CUSTOM_HEADGEAR[(i + dir + CUSTOM_HEADGEAR.length) % CUSTOM_HEADGEAR.length].key); }
  else if (/^w\d_m$/.test(key)) {                              // cycle models inside the slot's category
    const k = +key[1], cat = crWDef(d.weapons[k]).cat, list = Object.keys(CUSTOM_WEAPONS).filter(x => CUSTOM_WEAPONS[x].cat === cat);
    const i = list.indexOf(d.weapons[k].k);
    return crSet("w" + k + "_k", list[(i + dir + list.length) % list.length]);
  } else cur = d[key];
  crSet(key, (cur + dir + n) % n);
}
function crAddWeapon() {
  const d = window._crDraft; if (!d || d.weapons.length >= 3) return;
  const last = d.weapons[d.weapons.length - 1];
  d.weapons.push(crIsSaber(last) && last.k !== "staff" ? { k: "saber", hilt: 6, col: 2 } : { k: last.k === "staff" ? "sixshooter" : last.k });
  crCommit(d);
}
function crRemoveWeapon(k) {
  const d = window._crDraft; if (!d || d.weapons.length <= 1) return;
  d.weapons.splice(k, 1);
  crCommit(d);
}
function crApplyPreset(key) {
  const p = CUSTOM_PRESETS[key], d = window._crDraft; if (!p || !d) return;
  const keepName = d.name && d.name !== CUSTOM_DEFAULT.name && !Object.values(CUSTOM_PRESETS).some(x => x.d.name === d.name);
  const nd = Object.assign({}, d, JSON.parse(JSON.stringify(p.d)), { v: 2, species: d.species, body: d.body, skin: p.d.skin !== undefined ? p.d.skin : d.skin });
  if (keepName) nd.name = d.name;
  window._crMsg = "Preset loaded: " + p.name + " — tweak anything below.";
  crCommit(nd);
}
function crRandomize() {
  const r = n => Math.floor(Math.random() * n), d = window._crDraft; if (!d) return;
  const keys = Object.keys(CUSTOM_PRESETS), base = JSON.parse(JSON.stringify(CUSTOM_PRESETS[keys[r(keys.length)]].d));
  const wk = Object.keys(CUSTOM_WEAPONS), n = 1 + r(3), weapons = [];
  for (let i = 0; i < n; i++) { const k = wk[r(wk.length)]; weapons.push(CUSTOM_WEAPONS[k].cat === "saber" ? { k, hilt: r(SABER_HILTS.length), col: r(SABER_COLORS.length) } : { k }); }
  if (Math.random() < 0.35 && weapons[0].k !== "staff") weapons[1] = Object.assign({}, weapons[0]);   // twins are fun
  const align = Object.keys(CUSTOM_ALIGN)[r(4)], force = Object.keys(CUSTOM_FORCE)[r(3)];
  const nd = Object.assign({}, d, base, { align, force, weapons: weapons.slice(0, 3), talent: Object.keys(CUSTOM_TALENTS)[r(4)], armor: Object.keys(CUSTOM_ARMOR)[r(7)],
    skills: [], gear: "", dash: "", species: r(CUSTOM_SPECIES.length), body: r(2), skin: r(CUSTOM_SKINS.length), hair: r(CUSTOM_HAIR.length),
    head: CUSTOM_HEADGEAR[r(CUSTOM_HEADGEAR.length)].key, robe: r(CUSTOM_ROBES.length), legs: r(CUSTOM_LEGS.length), cloak: r(CUSTOM_CLOAKS.length), name: d.name });
  const sk = Object.keys(CUSTOM_SKILLS).filter(k => crReqOk(customHeroSanitize(nd), CUSTOM_SKILLS[k].req));
  nd.skills = [sk[r(sk.length)], sk[r(sk.length)]];
  crCommit(nd);
}
function customCapacity(d) {
  return [["⚔", "Weapons", d.weapons.length, 3], ["✦", "Skills", d.skills.length, 2], ["⚙", "Gear", 1, 1], ["➤", "Mobility", 1, 1], ["🛡", "Armor", 1, 1]];
}

function renderCreator() {
  const d = window._crDraft; if (!d) return;
  const box = document.getElementById("crForm"); if (!box) return;
  const esc = s => String(s).replace(/[<>&"]/g, "");
  const chips = (key, obj, cur) => Object.keys(obj).map(k => {
    const it = obj[k], ok = crReqOk(d, it.req);
    return `<button class="btn cr-chip${cur === k ? " gold" : ""}${ok ? "" : " locked"}" data-cr="${key}" data-v="${k}" title="${ok ? esc(it.desc || "") : "Needs " + CUSTOM_REQ_TXT[it.req]}">${ok ? "" : "🔒 "}${it.name}</button>`;
  }).join("");
  const cyc = (key, n, label) => `<span class="cr-cyc"><button class="btn" data-crc="${key}" data-n="${n}" data-dir="-1">◀</button><b>${label}</b><button class="btn" data-crc="${key}" data-n="${n}" data-dir="1">▶</button></span>`;
  const swatches = (key, list, cur) => list.map((c, i) => `<button class="cr-sw${cur === i ? " on" : ""}" data-crn="${key}" data-v="${i}" title="${Array.isArray(c) ? c[0] : c}" style="background:${Array.isArray(c) ? c[1] : c}"></button>`).join("");
  const setup = crSaberSetup(d), tags = crTwinTags(d), sabList = d.weapons.filter(crIsSaber);
  // presets
  const presets = Object.keys(CUSTOM_PRESETS).map(k => `<button class="btn cr-chip" data-crp="${k}">${CUSTOM_PRESETS[k].name}</button>`).join("");
  // weapons
  const wRows = d.weapons.map((w, k) => {
    const def = crWDef(w), si = sabList.indexOf(w);
    const catChips = Object.keys(CUSTOM_WCATS).map(c => `<button class="btn cr-chip cr-mini${def.cat === c ? " gold" : ""}" data-cr="w${k}_cat" data-v="${c}">${CUSTOM_WCATS[c]}</button>`).join("");
    const nInCat = Object.keys(CUSTOM_WEAPONS).filter(x => CUSTOM_WEAPONS[x].cat === def.cat).length;
    const sab = def.cat === "saber" ? `<div>Hilt ${cyc("sab" + si + "_hilt", SABER_HILTS.length, SABER_HILTS[w.hilt].name)} <small>${SABER_HILTS[w.hilt].who}</small></div>
        <div class="cr-sws">${swatches("sab" + si + "_col", SABER_COLORS, w.col)}</div>` : "";
    return `<div class="cr-row cr-wpn${def.cat === "saber" ? " cr-saber" : ""}"><div class="cr-lbl">WEAPON ${k + 1} OF ${d.weapons.length}${tags[k].tag ? " · TWIN" + tags[k].tag.toUpperCase() : ""}
        ${d.weapons.length > 1 ? `<button class="btn cr-x" data-crx="${k}" title="Remove this weapon">✕</button>` : ""}</div>
      <div class="cr-chips">${catChips}</div>
      <div>${nInCat > 1 ? cyc("w" + k + "_m", nInCat, def.name) : `<b class="cr-one">${def.name}</b>`}</div>${sab}</div>`;
  }).join("");
  const setupChips = Object.keys(CUSTOM_SETUPS).map(k => `<button class="btn cr-chip cr-mini${setup === k ? " gold" : ""}" data-cr="setup" data-v="${k}">${CUSTOM_SETUPS[k].name}</button>`).join("");
  const canMatch = d.weapons.length >= 2;
  // form path (lightsabers only)
  let pathRow = "";
  if (setup !== "none") {
    const path = CUSTOM_PATHS[d.path];
    const pathChips = Object.keys(CUSTOM_PATHS).filter(k => CUSTOM_PATHS[k].setups.includes(setup))
      .map(k => `<button class="btn cr-chip${d.path === k ? " gold" : ""}" data-cr="path" data-v="${k}">${CUSTOM_PATHS[k].name}</button>`).join("");
    const roadmap = path.stages.map((s, k) => `Lv.${s[1]} ${SABER_FORMS[s[0]].name}${k === path.stages.length - 1 ? " ★" : ""}`).join(" → ");
    pathRow = `<div class="cr-row"><div class="cr-lbl">LIGHTSABER FORM PATH</div><div class="cr-chips">${pathChips}</div><small>${path.desc}<br><b>${roadmap}</b></small></div>`;
  }
  // skills
  const skillChips = Object.keys(CUSTOM_SKILLS).map(k => {
    const s = CUSTOM_SKILLS[k], ok = crReqOk(d, s.req), on = d.skills.includes(k);
    return `<button class="btn cr-chip${on ? " gold" : ""}${ok ? "" : " locked"}" data-crs="${k}" title="${ok ? esc(s.u[4]) : "Needs " + CUSTOM_REQ_TXT[s.req]}">${ok ? "" : "🔒 "}${s.u[0]}</button>`;
  }).join("");
  const skillTxt = d.skills.map((k, i) => `<b>${i + 1}. ${CUSTOM_SKILLS[k].u[0]}</b> (${CUSTOM_SKILLS[k].u[1]}s) — ${esc(CUSTOM_SKILLS[k].u[4])}`).join("<br>");
  const cap = customCapacity(d).map(c => `<span class="${c[2] >= c[3] ? "full" : ""}">${c[0]} ${c[1]} ${c[2]}/${c[3]}</span>`).join("");
  const hg = CUSTOM_HEADGEAR.find(h => h.key === d.head) || CUSTOM_HEADGEAR[0];
  box.innerHTML = `
    <div class="cr-row cr-presets"><div class="cr-lbl">QUICK START · PRESETS</div><div class="cr-chips">${presets}</div><small>One tap loads a full build. Then change anything.</small></div>
    ${window._crMsg ? `<div class="cr-msg">${esc(window._crMsg)}</div>` : ""}
    <div class="cr-row"><div class="cr-lbl">NAME</div><input id="crName" maxlength="22" value="${esc(d.name)}" autocomplete="off"></div>
    <div class="cr-row"><div class="cr-lbl">ALLEGIANCE</div><div class="cr-chips">${chips("align", CUSTOM_ALIGN, d.align)}</div><small>${CUSTOM_ALIGN[d.align].desc}</small></div>
    <div class="cr-row"><div class="cr-lbl">THE FORCE</div><div class="cr-chips">${chips("force", CUSTOM_FORCE, d.force)}</div><small>${CUSTOM_FORCE[d.force].desc}</small></div>
    <div class="cr-row"><div class="cr-lbl">TALENT</div><div class="cr-chips">${chips("talent", CUSTOM_TALENTS, d.talent)}</div><small>${CUSTOM_TALENTS[d.talent].desc}</small></div>
    ${typeof CITY_UNIVERSES !== "undefined" ? `<div class="cr-row"><div class="cr-lbl">UNIVERSE · NEXUS CITY</div><div class="cr-chips">${chips("universe", CITY_UNIVERSES, d.universe || "auto")}</div><small>${(CITY_UNIVERSES[d.universe] || CITY_UNIVERSES.auto).desc}</small></div>` : ""}
    <div class="cr-cap">LOADOUT ${cap}</div>
    ${wRows}
    <div class="cr-row"><div class="cr-chips">${d.weapons.length < 3 ? `<button class="btn gold cr-chip" id="crAdd">＋ ADD WEAPON (${d.weapons.length}/3)</button>` : ""}
      ${canMatch ? `<button class="btn cr-chip" id="crMatch">⇆ MAKE #2 A TWIN OF #1</button>` : ""}</div>
      <div class="cr-lbl" style="margin-top:3px">QUICK SABER SETUP</div><div class="cr-chips">${setupChips}</div>
      <small>Twins (two of the same weapon) are separate weapons: own level, own reload, own target.</small></div>
    ${pathRow}
    <div class="cr-row"><div class="cr-lbl">SKILLS · PICK EXACTLY 2</div><div class="cr-chips">${skillChips}</div><small>${skillTxt}</small></div>
    <div class="cr-row"><div class="cr-lbl">SIGNATURE GEAR (AUTOMATIC)</div><div class="cr-chips">${chips("gear", CUSTOM_GEAR, d.gear)}</div><small>${CUSTOM_GEAR[d.gear].desc}</small></div>
    <div class="cr-row"><div class="cr-lbl">MOBILITY (DASH BUTTON)</div><div class="cr-chips">${chips("dash", CUSTOM_DASHES, d.dash)}</div><small>${CUSTOM_DASHES[d.dash].desc}</small></div>
    <div class="cr-row${d.armor === "beskar" ? " cr-fly" : ""}"><div class="cr-lbl">ARMOR</div><div class="cr-chips">${chips("armor", CUSTOM_ARMOR, d.armor)}</div><small>${CUSTOM_ARMOR[d.armor].desc}</small></div>
    <div class="cr-row"><div class="cr-lbl">LOOK</div>
      <div>Species ${cyc("species", CUSTOM_SPECIES.length, CUSTOM_SPECIES[d.species].name)} Body ${cyc("body", 2, d.body ? "Feminine" : "Masculine")}</div>
      <div class="cr-sws">${swatches("skin", CUSTOM_SKINS, d.skin)}</div>
      <div>Hair ${cyc("hair", CUSTOM_HAIR.length, CUSTOM_HAIR[d.hair][0])} Headgear ${cyc("head", CUSTOM_HEADGEAR.length, hg.name)}</div>
      <div>Outfit ${cyc("robe", CUSTOM_ROBES.length, CUSTOM_ROBES[d.robe][0])} Legs ${cyc("legs", CUSTOM_LEGS.length, CUSTOM_LEGS[d.legs][0])}</div>
      <div>Cloak ${cyc("cloak", CUSTOM_CLOAKS.length, d.armor === "beskar" ? "— (jetpack)" : CUSTOM_CLOAKS[d.cloak][0])}</div></div>`;
  box.querySelectorAll("[data-cr]").forEach(b => b.onclick = () => crSet(b.dataset.cr, b.dataset.v));
  box.querySelectorAll("[data-crc]").forEach(b => b.onclick = () => crCycle(b.dataset.crc, +b.dataset.n, +b.dataset.dir));
  box.querySelectorAll("[data-crn]").forEach(b => b.onclick = () => crSet(b.dataset.crn, +b.dataset.v));
  box.querySelectorAll("[data-crs]").forEach(b => b.onclick = () => crSet("skill", b.dataset.crs));
  box.querySelectorAll("[data-crp]").forEach(b => b.onclick = () => crApplyPreset(b.dataset.crp));
  box.querySelectorAll("[data-crx]").forEach(b => b.onclick = e => { e.stopPropagation(); crRemoveWeapon(+b.dataset.crx); });
  const nm = document.getElementById("crName");
  if (nm) nm.oninput = () => { window._crDraft.name = nm.value; customHeroRegister(); drawCreatorPreview(); };
  const ad = document.getElementById("crAdd");
  if (ad) ad.onclick = () => crAddWeapon();
  const mt = document.getElementById("crMatch");
  if (mt) mt.onclick = () => { d.weapons[1] = Object.assign({}, d.weapons[0]); window._crMsg = "Twin weapons: #1 and #2 are now a matched pair."; crCommit(d); };
  drawCreatorPreview();
}

// hero (weapons out, flight shown) + a close-up of every weapon + the loadout
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
  if (d.armor === "beskar") { c.fillStyle = "#ff9100"; c.font = "bold 8px monospace"; c.fillText("✈ JETPACK FLIGHT", 77, 20); }
  c.textAlign = "left";
  const tags = crTwinTags(d), n = d.weapons.length, rowH = Math.min(58, (cv.height - 16) / n);
  d.weapons.forEach((w, k) => {
    const def = crWDef(w), y = 14 + rowH * k + rowH * 0.5;
    c.fillStyle = "#9fb3c8"; c.font = "bold 7.5px monospace";
    c.fillText(`WEAPON ${k + 1}${tags[k].tag ? " ·" + tags[k].tag.toUpperCase() : ""}`, 158, y - rowH * 0.5 + 9);
    c.fillStyle = "#e0f2f1"; c.font = "bold 8.5px sans-serif";
    const lbl = def.cat === "saber" ? SABER_HILTS[w.hilt].name + " · " + SABER_COLORS[w.col][0] : def.name;
    c.fillText(lbl.length > 30 ? lbl.slice(0, 29) + "…" : lbl, 158, y - rowH * 0.5 + 19);
    c.save();
    if (def.cat === "saber") {
      const h = SABER_HILTS[w.hilt]; c.translate(w.k === "staff" ? 232 : 182, y + 8); c.scale(3.2, 3.2);
      drawWeaponModel(c, CUSTOM_CID, "orbit", false, false, SABER_COLORS[w.col][1], 0, 0, w.k === "staff" ? 16 : 22 * (h.blade || 1), w.k === "staff", w.hilt);
    } else {
      c.translate(200, y + 8); c.scale(3.0, 3.0);
      drawWeaponModel(c, def.id, CHAR_RAW[def.id] ? CHAR_RAW[def.id][6] : "beam", false, false, getWeaponColor(def.id), 0, 0, 0, null);
    }
    c.restore();
  });
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
      <div class="card-desc">Build <b>any</b> character: a Jedi, a Sith, a gunslinger with <b>twin six-shooters</b>, a wizard with a little Force, a smuggler with a revolver and a lightsaber, a <b>Mandalorian with a real jetpack</b>… 1-3 weapons, 2 skills, gear, mobility and armor — each with honest requirements.</div>
      <button class="btn gold cr-edit">✨ OPEN HERO CREATOR</button>`;
  } else {
    const wl = d.weapons.map(w => crWDef(w).name).join(" + ");
    card.innerHTML = `<div class="card-head"><canvas width="36" height="36" style="position:relative;width:36px;height:36px;background:#0a1424;border:1px solid #ffd166;border-radius:6px;flex-shrink:0"></canvas>
      <div><div class="card-title">#80 ${d.name}</div><div class="card-sub">YOUR HERO · ${CUSTOM_ALIGN[d.align].name} · ${CUSTOM_FORCE[d.force].name}</div></div></div>
      <div class="card-desc"><b>Weapons:</b> ${wl}<br><b>Skills:</b> ${d.skills.map(k => CUSTOM_SKILLS[k].u[0]).join(" · ")} · <b>Armor:</b> ${CUSTOM_ARMOR[d.armor].name}</div>
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
