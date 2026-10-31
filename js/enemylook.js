/* =========================================================================
   OMNI-SHIFT v14 — ENEMY ROSTERS & DETAILED ENEMY RENDERER
   Who you fight depends on who you are: Stormtroopers hunt the Rebels,
   Serpent-Guard Jaffa, Horus Guards, Replicators and Kull Warriors hunt
   SG-1, the Bratva (tracksuit gunmen, Tarasov enforcers, attack dogs and
   High Table heavies) hunt John Wick… 48 rosters × 4 archetypes
   (grunt · fast · critter · heavy), used in the city AND the classic arena.
   Each enemy is drawn with a walk cycle, outfit, headgear and a weapon that
   tracks its aim; per-enemy seeds vary skin, hair and outfit colours.
   Spec: [name, body, colours[main, legs, accent, extra], head, weapon, ranged, kinetic, scale, extras]
   body: h human · r robot · g giant · b beast · i insect · f floater · k dalek · x xeno
   ========================================================================= */
"use strict";

const ER = {};   // roster key -> { name, t: [grunt, fast, critter, heavy], blood }
function erDef(key, name, blood, t) { ER[key] = { key, name, blood, t: t.map(a => ({ n: a[0], b: a[1], c: a[2], hd: a[3], w: a[4], r: a[5], k: a[6], s: a[7] || 1, x: a[8] || "" })) }; }
const RED = "rgba(130,10,16,0.62)", OIL = "rgba(20,20,24,0.7)", GREEN = "rgba(60,140,30,0.6)", ACID = "rgba(150,220,40,0.6)", BLUEB = "rgba(40,90,200,0.55)", WHITEB = "rgba(230,230,235,0.6)";
erDef("imperial", "Galactic Empire", RED, [
  ["Stormtrooper", "h", ["#eceff1", "#e0e3e6", "#1c1f24"], "bucket", "blaster", 1, 0, 1, "pads belt"],
  ["Scout Trooper", "h", ["#e8eaec", "#2a2d33", "#1c1f24"], "scout", "pistolE", 1, 0, 0.95, "belt"],
  ["Probe Droid", "f", ["#2a2d33", "#15171b", "#ff3b3b"], "probe", "none", 1, 0, 0.9, ""],
  ["Death Trooper", "h", ["#1a1c20", "#15171b", "#3a7a5a"], "deathtrooper", "rifleE", 1, 0, 1.12, "pads armor"]]);
erDef("separatist", "Separatist Droid Army", OIL, [
  ["B1 Battle Droid", "r", ["#c9b48a", "#b8a37a", "#8a7a5a"], "b1", "blaster", 1, 0, 1, "thin"],
  ["BX Commando Droid", "r", ["#6a6a62", "#55554e", "#e8e0c8"], "bx", "blade", 0, 0, 1, "thin"],
  ["Buzz Droid", "i", ["#8a8a92", "#5a5a62", "#ff5252"], "buzz", "none", 0, 0, 0.8, "round"],
  ["B2 Super Battle Droid", "r", ["#5a6a7a", "#4a5868", "#ff5252"], "b2", "wristblaster", 1, 0, 1.25, "bulky"]]);
erDef("rebel", "Rebel Alliance", RED, [
  ["Rebel Trooper", "h", ["#8a7a5e", "#4a4a52", "#e8e8e2"], "rebelhelm", "blaster", 1, 0, 1, "vest belt"],
  ["Endor Commando", "h", ["#4a5a3a", "#3a4a2e", "#5a6a3a"], "camohelm", "blaster", 1, 0, 1, "poncho"],
  ["Ewok Warrior", "h", ["#6a4a2e", "#5a3e26", "#8a5a3a"], "ewok", "spear", 0, 0, 0.62, "fur"],
  ["Wookiee Warrior", "g", ["#6a4a2e", "#5a3e26", "#3a2a1a"], "wookiee", "bowcaster", 1, 0, 1.3, "fur bandolier"]]);
erDef("republic", "Galactic Republic", RED, [
  ["Clone Trooper", "h", ["#f0f2f4", "#e4e7ea", "#2a5ad8"], "clone", "blaster", 1, 0, 1, "pads belt stripe"],
  ["Jedi Knight", "h", ["#c8b48a", "#8a6a44", "#6a4a2e"], "hair", "saberB", 0, 0, 1, "robe"],
  ["Astromech", "f", ["#e8eaec", "#2a5ad8", "#9aa0a6"], "astro", "none", 0, 0, 0.75, "ground"],
  ["ARC Trooper", "h", ["#f0f2f4", "#e4e7ea", "#d84a2a"], "clone", "rifleE", 1, 0, 1.12, "pads belt kama"]]);
erDef("goauld", "Goa'uld Dominion", RED, [
  ["Serpent Guard Jaffa", "h", ["#8a8a8e", "#5a5a5e", "#d4a537"], "serpent", "staff", 1, 0, 1.05, "chain"],
  ["Horus Guard", "h", ["#7a7a7e", "#55555a", "#c8a040"], "horus", "zat", 1, 0, 1.05, "chain"],
  ["Replicator", "i", ["#9aa3ab", "#6a737b", "#c0c8d0"], "rep", "none", 0, 0, 0.75, "blocks"],
  ["Kull Warrior", "g", ["#15171b", "#101215", "#c62828"], "kull", "wristgun", 1, 0, 1.3, "armor"]]);
erDef("replicator", "Replicator Swarm", OIL, [
  ["Human-Form Replicator", "r", ["#b8c0c8", "#a8b0b8", "#5a6a7a"], "repform", "claws", 0, 0, 1, "blocks"],
  ["Replicator Bug", "i", ["#9aa3ab", "#6a737b", "#c0c8d0"], "rep", "none", 0, 0, 0.8, "blocks"],
  ["Replicator Spawn", "i", ["#8a939b", "#5a636b", "#b0b8c0"], "rep", "none", 0, 0, 0.55, "blocks"],
  ["Replicator Queen", "i", ["#aab3bb", "#7a838b", "#d0d8e0"], "rep", "none", 0, 0, 1.6, "blocks"]]);
erDef("sgc", "Stargate Command", RED, [
  ["SG Team Soldier", "h", ["#4a5a3a", "#3e4c30", "#2a2a2a"], "boonie", "smg", 1, 1, 1, "vest belt"],
  ["SGC Marine", "h", ["#5a5a42", "#4a4a36", "#2a2a2a"], "helmet", "rifle", 1, 1, 1, "vest"],
  ["MALP Probe", "f", ["#9aa0a6", "#4a4f56", "#ffb300"], "malp", "none", 0, 0, 0.85, "ground"],
  ["SGC Heavy Gunner", "h", ["#3e4c30", "#34402a", "#2a2a2a"], "helmet", "mg", 1, 1, 1.15, "vest pack"]]);
erDef("atlantis", "Atlantis Expedition", RED, [
  ["Atlantis Marine", "h", ["#2a2d33", "#5a5446", "#2a2a2a"], "cap", "smg", 1, 1, 1, "vest"],
  ["Athosian Hunter", "h", ["#7a5a3a", "#5a4430", "#3a2a1a"], "hair", "knife", 0, 0, 1, "leather"],
  ["Ancient Drone", "f", ["#f9d65c", "#c8a040", "#fff3b0"], "drone", "none", 1, 0, 0.7, "glow"],
  ["Satedan Runner", "h", ["#4a3a2a", "#3a2e22", "#c8102e"], "dreads", "pistolE", 1, 0, 1.15, "leather"]]);
erDef("alliance", "Alliance & Reavers", RED, [
  ["Alliance Soldier", "h", ["#5a6a8a", "#4a5876", "#cfd8dc"], "visorhelm", "rifle", 1, 1, 1, "armor"],
  ["Reaver", "h", ["#5a3a2a", "#3a2a22", "#8a1a1a"], "scar", "knife", 0, 0, 1, "rags"],
  ["Reaver Scavenger", "h", ["#4a2e22", "#3a241c", "#8a1a1a"], "scar", "claws", 0, 0, 0.8, "rags crouch"],
  ["Alliance Heavy Trooper", "h", ["#4a5876", "#3e4a66", "#cfd8dc"], "visorhelm", "mg", 1, 1, 1.18, "armor pads"]]);
erDef("browncoat", "Browncoat Militia", RED, [
  ["Browncoat", "h", ["#7a5432", "#4a4036", "#d8c8a8"], "hair", "rifle", 1, 1, 1, "coat"],
  ["Frontier Gunhand", "h", ["#8a6a4a", "#3e3630", "#5a3a1e"], "hat", "shotgun", 1, 1, 1, "vest"],
  ["Ranch Dog", "b", ["#8a6a4a", "#6a4a2e", "#2a1a10"], "dog", "none", 0, 0, 0.85, ""],
  ["Browncoat Veteran", "h", ["#6a4a2e", "#3e3630", "#c8b88a"], "hat", "mg", 1, 1, 1.15, "coat bandolier"]]);
erDef("outlaws", "Outlaw Gang", RED, [
  ["Outlaw Gunslinger", "h", ["#8a6a4a", "#4a3e32", "#c62828"], "hat", "revolver", 1, 1, 1, "vest bandana"],
  ["Bandito", "h", ["#c8a878", "#6a5a42", "#8a2a1a"], "sombrero", "knife", 0, 0, 1, "poncho"],
  ["Coyote", "b", ["#a88a62", "#8a6a4a", "#3a2a1a"], "coyote", "none", 0, 0, 0.8, ""],
  ["Gang Boss", "h", ["#3a2a22", "#2a2420", "#d4a537"], "hat", "shotgun", 1, 1, 1.2, "coat bandolier"]]);
erDef("harkonnen", "House Harkonnen", RED, [
  ["Harkonnen Trooper", "h", ["#2a2a2e", "#1e1e22", "#8a6a3a"], "harkhelm", "rifleE", 1, 0, 1, "armor"],
  ["Harkonnen Assassin", "h", ["#1a1a1e", "#141418", "#d8d8d8"], "bald", "knife", 0, 0, 1, "suit"],
  ["Hunter-Seeker", "f", ["#3a3a3e", "#1a1a1e", "#ff5252"], "needle", "none", 0, 0, 0.5, ""],
  ["Harkonnen Brute", "g", ["#2a2a2e", "#1e1e22", "#4fc3ff"], "bald", "mace", 0, 0, 1.32, "armor shield"]]);
erDef("fremen", "Fremen", RED, [
  ["Fremen Warrior", "h", ["#6a5a46", "#5a4a3a", "#2a7ab8"], "stillsuit", "maula", 1, 1, 1, "stillsuit"],
  ["Fedaykin", "h", ["#5a4a3a", "#4a3e30", "#2a7ab8"], "stillsuit", "crysknife", 0, 0, 1, "stillsuit cloak"],
  ["Sandtrout", "i", ["#a8743e", "#8a5a2e", "#5a3a1e"], "worm", "none", 0, 0, 0.6, "worm"],
  ["Sandrider", "g", ["#6a5a46", "#5a4a3a", "#2a7ab8"], "stillsuit", "spear", 0, 0, 1.28, "stillsuit cloak"]]);
erDef("borg", "The Borg Collective", ACID, [
  ["Borg Drone", "h", ["#2a2d30", "#202326", "#76ff03"], "borg", "claws", 0, 0, 1, "tubes"],
  ["Tactical Drone", "h", ["#1e2124", "#181a1d", "#76ff03"], "borg", "wristgun", 1, 0, 1.08, "tubes armor"],
  ["Borg Probe", "f", ["#2a2d30", "#15171a", "#76ff03"], "cube", "none", 1, 0, 0.6, "glow"],
  ["Borg Juggernaut", "g", ["#1e2124", "#15171a", "#76ff03"], "borg", "claws", 0, 0, 1.35, "tubes armor"]]);
erDef("starfleet", "Starfleet", RED, [
  ["Starfleet Security", "h", ["#a81c1c", "#1a1a1e", "#d4a537"], "hair", "phaser", 1, 0, 1, "uniform"],
  ["Starfleet Officer", "h", ["#2a4a8a", "#1a1a1e", "#d4a537"], "hair", "phaser", 1, 0, 1, "uniform"],
  ["Exocomp", "f", ["#c8ccd0", "#8a9096", "#4fc3ff"], "exocomp", "none", 0, 0, 0.55, "glow"],
  ["MACO Heavy", "h", ["#3a4a3a", "#2e3a2e", "#d4a537"], "helmet", "rifleE", 1, 0, 1.15, "armor pack"]]);
erDef("cylon", "Cylon Forces", OIL, [
  ["Cylon Centurion", "r", ["#c8ccd0", "#a8acb0", "#ff1744"], "centurion", "wristgun", 1, 1, 1.1, "chrome"],
  ["Humanoid Cylon", "h", ["#2a2a2e", "#1e1e22", "#e8e8e8"], "hair", "pistol", 1, 1, 1, "suit"],
  ["Cylon Scout", "f", ["#b8bcc0", "#8a8e92", "#ff1744"], "scanner", "none", 1, 0, 0.6, ""],
  ["Heavy Centurion", "r", ["#a8acb0", "#888c90", "#ff1744"], "centurion", "minigun", 1, 1, 1.32, "chrome bulky"]]);
erDef("colonial", "Colonial Fleet", RED, [
  ["Colonial Marine", "h", ["#6a6448", "#56503a", "#2a2a2a"], "helmet", "rifle", 1, 1, 1, "armor"],
  ["Viper Pilot", "h", ["#c86a2a", "#a85a22", "#e8e8e8"], "pilothelm", "pistol", 1, 1, 1, "flightsuit"],
  ["Deck Hand", "h", ["#e65100", "#4a4a4a", "#212121"], "cap", "wrench", 0, 0, 0.95, ""],
  ["Colonial Heavy Gunner", "h", ["#56503a", "#4a4532", "#2a2a2a"], "helmet", "mg", 1, 1, 1.15, "armor pack"]]);
erDef("geth", "The Geth", WHITEB, [
  ["Geth Trooper", "r", ["#4a5058", "#3a4048", "#4fc3ff"], "geth", "rifleE", 1, 0, 1, "thin"],
  ["Geth Hunter", "r", ["#3a4048", "#2a3038", "#4fc3ff"], "geth", "shotgunE", 1, 0, 1, "thin shimmer"],
  ["Geth Recon Drone", "f", ["#5a6068", "#3a4048", "#4fc3ff"], "drone", "none", 1, 0, 0.6, "glow"],
  ["Geth Prime", "r", ["#3a4048", "#2a3038", "#4fc3ff"], "geth", "mg", 1, 0, 1.4, "bulky"]]);
erDef("xenomorph", "Xenomorph Hive", ACID, [
  ["Xenomorph Drone", "x", ["#1a1c20", "#101215", "#3a4048"], "xeno", "none", 0, 0, 1.05, ""],
  ["Xeno Runner", "x", ["#2a2420", "#1a1612", "#4a4038"], "xeno", "none", 0, 0, 0.92, "runner"],
  ["Facehugger", "i", ["#c8b89a", "#a8987a", "#8a7a5a"], "hugger", "none", 0, 0, 0.6, "hugger"],
  ["Xeno Praetorian", "x", ["#15171a", "#0c0e10", "#3a4048"], "xeno", "none", 0, 0, 1.45, "crest"]]);
erDef("commandos", "Special Forces", RED, [
  ["Commando", "h", ["#4a5a3a", "#3e4c30", "#2a2a2a"], "bandana", "rifle", 1, 1, 1, "vest camo"],
  ["Guerrilla", "h", ["#6a6448", "#56503a", "#3a2a1a"], "beret", "rifle", 1, 1, 1, ""],
  ["Jungle Dog", "b", ["#5a4a3a", "#3a2e22", "#1a1a1a"], "dog", "none", 0, 0, 0.85, ""],
  ["Minigun Commando", "g", ["#3e4c30", "#34402a", "#2a2a2a"], "hair", "minigun", 1, 1, 1.25, "vest bandolier"]]);
erDef("colonial_marines", "Colonial Marines", RED, [
  ["Colonial Marine", "h", ["#5a6448", "#4a5238", "#2a2a2a"], "marinehelm", "pulserifle", 1, 1, 1, "armor"],
  ["Marine Scout", "h", ["#5a6448", "#4a5238", "#2a2a2a"], "cap", "pistol", 1, 1, 1, "armor tracker"],
  ["Sentry Drone", "f", ["#5a6058", "#3a4038", "#ff5252"], "sentry", "none", 1, 1, 0.7, "ground"],
  ["Smartgunner", "g", ["#4a5238", "#3e4630", "#2a2a2a"], "marinehelm", "smartgun", 1, 1, 1.18, "armor harness"]]);
erDef("arachnids", "Arachnid Swarm", ACID, [
  ["Warrior Bug", "i", ["#7a5a3a", "#5a4028", "#c8a060"], "warrior", "none", 0, 0, 1.25, "spider"],
  ["Hopper", "i", ["#6a5a4a", "#4a3e32", "#a8987a"], "hopper", "none", 0, 0, 1.0, "wings"],
  ["Brood Bug", "i", ["#8a6a4a", "#6a4e34", "#c8a878"], "warrior", "none", 0, 0, 0.6, "spider"],
  ["Tanker Bug", "i", ["#5a4a3a", "#3e3226", "#ff7043"], "tanker", "none", 1, 0, 1.75, "tank"]]);
erDef("covenant", "The Covenant", BLUEB, [
  ["Grunt", "h", ["#c86a2a", "#5a4a3a", "#4fc3ff"], "grunt", "plasmapistol", 1, 0, 0.75, "tank"],
  ["Elite", "h", ["#3a4a8a", "#2a3a6a", "#4fc3ff"], "elite", "esword", 0, 0, 1.15, "armor"],
  ["Flood Infection", "f", ["#c8b47a", "#a8945a", "#7a6a3a"], "flood", "none", 0, 0, 0.5, "ground"],
  ["Hunter", "g", ["#2a3a5a", "#1e2a44", "#ff9100"], "hunter", "fuelrod", 1, 0, 1.45, "armor shield"]]);
erDef("demons", "Hell's Legions", RED, [
  ["Imp", "h", ["#8a5a3a", "#6a4430", "#ff7043"], "imp", "claws", 1, 0, 1, "spikes"],
  ["Pinky Demon", "b", ["#c86a6a", "#a85050", "#3a1a1a"], "pinky", "none", 0, 0, 1.15, ""],
  ["Lost Soul", "f", ["#e8e0c8", "#c8b89a", "#ff7043"], "skullfire", "none", 0, 0, 0.65, "fire"],
  ["Baron of Hell", "g", ["#c87a6a", "#5a3a2a", "#76ff03"], "baron", "claws", 1, 0, 1.45, "spikes"]]);
erDef("guard_hope", "Hope County Law", RED, [
  ["Deputy", "h", ["#8a7a5a", "#5a5446", "#3a2a1a"], "hat", "shotgun", 1, 1, 1, "uniform badge"],
  ["National Guard", "h", ["#5a6448", "#4a5238", "#2a2a2a"], "helmet", "rifle", 1, 1, 1, "vest"],
  ["K9 Unit", "b", ["#6a4a2e", "#2a1a10", "#1a1a1a"], "shepherd", "none", 0, 0, 0.9, ""],
  ["State Trooper", "h", ["#3a4a6a", "#2a3550", "#d4a537"], "hat", "mg", 1, 1, 1.15, "uniform vest"]]);
erDef("orks", "Ork WAAAGH!", RED, [
  ["Ork Boy", "h", ["#4a7a2a", "#5a4a3a", "#2a2a2a"], "ork", "slugga", 1, 1, 1.05, "spikes"],
  ["Ork Stormboy", "h", ["#4a7a2a", "#3a3a3a", "#c62828"], "ork", "choppa", 0, 0, 1.0, "rokkit"],
  ["Gretchin", "h", ["#6a8a3a", "#5a4a3a", "#2a2a2a"], "grot", "pistol", 1, 1, 0.62, ""],
  ["Ork Nob", "g", ["#3e6a22", "#3a3a3a", "#d4a537"], "ork", "klaw", 0, 0, 1.38, "spikes armor"]]);
erDef("chaos", "Forces of Chaos", RED, [
  ["Chaos Cultist", "h", ["#5a3a3a", "#3a2a2a", "#8a1a1a"], "hood", "rifle", 1, 1, 1, "rags"],
  ["Possessed", "h", ["#6a2a2a", "#4a1e1e", "#ff5252"], "horns", "claws", 0, 0, 1.08, "spikes"],
  ["Nurgling", "f", ["#7a8a4a", "#5a6a3a", "#c8c86a"], "nurgling", "none", 0, 0, 0.5, "ground"],
  ["Chaos Space Marine", "g", ["#5a1a1a", "#3a1212", "#c9a227"], "chaoshelm", "bolter", 1, 1, 1.3, "spikes armor"]]);
erDef("imperial_guard", "Astra Militarum", RED, [
  ["Cadian Guardsman", "h", ["#5a6a4a", "#4a583c", "#2a2a2a"], "helmet", "lasgun", 1, 0, 1, "armor"],
  ["Commissar", "h", ["#1a1a1e", "#141418", "#c62828"], "commissar", "boltpistol", 1, 1, 1, "coat"],
  ["Servo-Skull", "f", ["#e8e0c8", "#9a9a9a", "#ff5252"], "skull", "none", 1, 0, 0.55, ""],
  ["Space Marine", "g", ["#1e3a8a", "#162c6a", "#d4a537"], "marinehelmet40k", "bolter", 1, 1, 1.3, "armor pads"]]);
erDef("agents", "The Matrix", RED, [
  ["SWAT Officer", "h", ["#1a1a1e", "#141418", "#2a2a2a"], "helmet", "smg", 1, 1, 1, "vest"],
  ["Agent", "h", ["#1e1e22", "#1a1a1e", "#2a2a2a"], "agent", "pistol", 1, 1, 1, "suit tie"],
  ["Sentinel", "f", ["#2a2a2e", "#151518", "#ff1744"], "sentinel", "none", 0, 0, 0.9, "tentacles"],
  ["Agent Smith", "h", ["#1a1a1e", "#141418", "#2a2a2a"], "agent", "pistol", 1, 1, 1.12, "suit tie glow"]]);
erDef("lapd", "LAPD & SWAT", RED, [
  ["LAPD Officer", "h", ["#1e2a4a", "#1a2440", "#d4a537"], "cap", "pistol", 1, 1, 1, "uniform badge"],
  ["SWAT", "h", ["#1a1a1e", "#2a2a2e", "#2a2a2a"], "helmet", "smg", 1, 1, 1, "vest"],
  ["Police Dog", "b", ["#6a4a2e", "#2a1a10", "#1a1a1a"], "shepherd", "none", 0, 0, 0.9, ""],
  ["SWAT Breacher", "h", ["#1a1a1e", "#2a2a2e", "#5a5f66"], "helmet", "shotgun", 1, 1, 1.15, "vest shield"]]);
erDef("replicants", "Nexus Replicants", RED, [
  ["Combat Replicant", "h", ["#3a3a42", "#2a2a30", "#d8c8a8"], "hair", "pistol", 1, 1, 1, "coat"],
  ["Pleasure Model", "h", ["#5a2a4a", "#2a1a2a", "#f8f8f8"], "hair", "claws", 0, 0, 0.95, ""],
  ["Spinner Drone", "f", ["#3a3a42", "#1a1a20", "#ff2bd6"], "drone", "none", 1, 0, 0.6, "glow"],
  ["Nexus-6 Leader", "h", ["#2a2a30", "#1a1a20", "#f0f0f0"], "platinum", "claws", 0, 0, 1.12, "coat"]]);
erDef("arasaka", "Arasaka & Maelstrom", RED, [
  ["Arasaka Soldier", "h", ["#1a1a1e", "#141418", "#c62828"], "visorhelm", "rifle", 1, 1, 1, "armor"],
  ["Maelstrom Ganger", "h", ["#3a3a42", "#2a2a30", "#ff1744"], "chromeface", "shotgun", 1, 1, 1, "spikes"],
  ["Arasaka Drone", "f", ["#2a2a30", "#151518", "#ff1744"], "drone", "none", 1, 1, 0.6, "glow"],
  ["Arasaka Heavy", "g", ["#1a1a1e", "#141418", "#c62828"], "visorhelm", "minigun", 1, 1, 1.3, "armor"]]);
erDef("wasteland", "Wasteland Raiders", RED, [
  ["Raider", "h", ["#5a4a3a", "#3e3428", "#8a8070"], "mohawk", "rifle", 1, 1, 1, "spikes leather"],
  ["Feral Ghoul", "h", ["#8a7a5a", "#6a5a42", "#5a4a32"], "ghoul", "claws", 0, 0, 0.98, "rags"],
  ["Radroach", "i", ["#6a3a1e", "#4a2a14", "#8a5a2e"], "roach", "none", 0, 0, 0.62, "roach"],
  ["Super Mutant", "g", ["#6a8a4a", "#4a3e32", "#3a3a3a"], "mutant", "minigun", 1, 1, 1.42, "rags"]]);
erDef("warboys", "Immortan's War Boys", RED, [
  ["War Boy", "h", ["#e8e4dc", "#3a3028", "#1a1a1a"], "warboy", "lance", 0, 0, 1, "chains"],
  ["Buzzard", "h", ["#4a3a2a", "#3a2e22", "#8a6a3a"], "spikehelm", "shotgun", 1, 1, 1, "spikes"],
  ["Feral Dog", "b", ["#8a7a5a", "#6a5a42", "#3a2a1a"], "dog", "none", 0, 0, 0.82, ""],
  ["Rictus Brute", "g", ["#e0dcd4", "#3a3028", "#5a5f66"], "rictus", "mg", 1, 1, 1.4, "harness"]]);
erDef("bratva", "Bratva & the High Table", RED, [
  ["Bratva Gunman", "h", ["#1a1a1e", "#1a1a1e", "#e8e8e8"], "buzz", "pistol", 1, 1, 1, "tracksuit"],
  ["Tarasov Enforcer", "h", ["#2a2420", "#1e1a18", "#8a8a8a"], "slick", "smg", 1, 1, 1, "leather"],
  ["Attack Dog", "b", ["#3a2e26", "#2a201a", "#b8a890"], "pitbull", "none", 0, 0, 0.82, ""],
  ["High Table Enforcer", "h", ["#2a2d30", "#202326", "#5a5f66"], "tactical", "shotgun", 1, 1, 1.15, "armor vest"]]);
erDef("combine", "The Combine", RED, [
  ["Metrocop", "h", ["#3a4048", "#2a3038", "#c8ccd0"], "metrocop", "baton", 0, 0, 1, "uniform"],
  ["Combine Soldier", "h", ["#2a4a6a", "#1e3650", "#ff9100"], "combine", "smg", 1, 1, 1, "armor"],
  ["Headcrab", "i", ["#c8b48a", "#a8946a", "#6a4a2a"], "headcrab", "none", 0, 0, 0.55, "crab"],
  ["Combine Elite", "h", ["#e0e4e8", "#c8ccd0", "#ff1744"], "elite_c", "pulse", 1, 0, 1.15, "armor"]]);
erDef("daleks", "Daleks & Cybermen", OIL, [
  ["Dalek", "k", ["#8a6a2a", "#5a4a2a", "#d4a537"], "dalek", "none", 1, 0, 1.1, ""],
  ["Cyberman", "r", ["#c8ccd0", "#a8acb0", "#1a1a1a"], "cyber", "wristgun", 1, 0, 1.05, "chrome"],
  ["Cybermat", "i", ["#a8acb0", "#888c90", "#4fc3ff"], "cybermat", "none", 0, 0, 0.55, "round"],
  ["Dalek Supreme", "k", ["#e8e8e8", "#c8c8c8", "#d4a537"], "dalek", "none", 1, 0, 1.35, ""]]);
erDef("space_pirates", "Space Pirates", ACID, [
  ["Space Pirate", "h", ["#3a2a4a", "#2a1e36", "#76ff03"], "pirate", "armcannon", 1, 0, 1.08, "armor"],
  ["Pirate Commando", "h", ["#4a2a2a", "#361e1e", "#ff9100"], "pirate", "claws", 0, 0, 1.05, "armor"],
  ["Metroid", "f", ["#a8e86a", "#c62828", "#76ff03"], "metroid", "none", 0, 0, 0.75, "glow"],
  ["Pirate Brute", "g", ["#2a1e36", "#1e1428", "#76ff03"], "pirate", "armcannon", 1, 0, 1.4, "armor"]]);
erDef("witcher_foes", "Monsters & Bandits", RED, [
  ["Bandit", "h", ["#6a5a42", "#4a3e30", "#8a2a1a"], "hood", "sword", 0, 0, 1, "leather"],
  ["Drowner", "h", ["#4a6a5a", "#3a5448", "#2a3a32"], "drowner", "claws", 0, 0, 1, "rags"],
  ["Nekker", "h", ["#7a6a5a", "#5a4e42", "#3a2e22"], "nekker", "claws", 0, 0, 0.62, ""],
  ["Wild Hunt Knight", "g", ["#3a4048", "#2a3038", "#9adcff"], "wildhunt", "sword", 0, 0, 1.3, "armor spikes"]]);
erDef("investigators", "The Investigators", RED, [
  ["Detective", "h", ["#6a5a46", "#4a4036", "#3a3028"], "fedora", "revolver", 1, 1, 1, "coat"],
  ["Tommy-Gun Agent", "h", ["#3a3a42", "#2a2a30", "#3a3028"], "fedora", "tommy", 1, 1, 1, "suit"],
  ["Guard Dog", "b", ["#5a4a3a", "#3a2e22", "#1a1a1a"], "shepherd", "none", 0, 0, 0.85, ""],
  ["Federal Agent", "h", ["#2a2a30", "#202026", "#3a3028"], "fedora", "shotgun", 1, 1, 1.12, "coat"]]);
erDef("kenshi_foes", "Holy Nation & Dust Bandits", RED, [
  ["Holy Nation Paladin", "h", ["#c8c0a8", "#a8a088", "#d4a537"], "paladin", "spear", 0, 0, 1, "armor"],
  ["Dust Bandit", "h", ["#8a6a4a", "#6a5238", "#3a2a1a"], "rag", "sword", 0, 0, 1, "rags"],
  ["Bonedog", "b", ["#d8c8a8", "#b8a888", "#5a4a3a"], "bonedog", "none", 0, 0, 0.9, ""],
  ["Inquisitor", "g", ["#e0d8c0", "#c0b8a0", "#d4a537"], "paladin", "polearm", 0, 0, 1.25, "armor"]]);
erDef("death_eaters", "Death Eaters", RED, [
  ["Death Eater", "h", ["#15151a", "#101014", "#c8ccd0"], "demask", "wand", 1, 0, 1, "robe"],
  ["Snatcher", "h", ["#4a3e32", "#3a3028", "#2a2a2a"], "hair", "wand", 1, 0, 1, "leather"],
  ["Inferius", "h", ["#b8c0b0", "#8a9080", "#5a6050"], "inferi", "claws", 0, 0, 0.95, "rags"],
  ["Werewolf", "g", ["#5a4a3a", "#4a3e30", "#ffd54f"], "wolf", "claws", 0, 0, 1.3, "fur"]]);
erDef("aurors", "Aurors & the Order", RED, [
  ["Auror", "h", ["#1e2a4a", "#16203a", "#d4a537"], "hair", "wand", 1, 0, 1, "coat"],
  ["Order Member", "h", ["#5a3a2a", "#4a3022", "#c62828"], "hair", "wand", 1, 0, 1, "coat scarf"],
  ["Patronus", "f", ["#c8e8ff", "#a8d8ff", "#ffffff"], "patronus", "none", 0, 0, 0.7, "glow ghost"],
  ["Stone Knight", "g", ["#8a8a82", "#6a6a62", "#5a5a52"], "knighthelm", "sword", 0, 0, 1.3, "armor stone"]]);
erDef("orcs", "Armies of Mordor", "rgba(30,30,30,0.7)", [
  ["Orc", "h", ["#3a3a32", "#2a2a24", "#5a6a3a"], "orc", "scimitar", 0, 0, 1, "armor"],
  ["Goblin", "h", ["#5a5a42", "#3a3a2e", "#6a7a4a"], "goblin", "knife", 0, 0, 0.75, "rags"],
  ["Warg", "b", ["#4a4036", "#3a3028", "#1a1a1a"], "warg", "none", 0, 0, 1.1, ""],
  ["Uruk-hai", "g", ["#2a2a26", "#1e1e1c", "#e8e8e8"], "uruk", "sword", 0, 0, 1.3, "armor hand"]]);
erDef("rohan", "Riders of Rohan", RED, [
  ["Rohirrim Soldier", "h", ["#3a5a3a", "#5a4a3a", "#c8c0a8"], "rohanhelm", "sword", 0, 0, 1, "armor cloak shield"],
  ["Rohan Archer", "h", ["#4a6a3a", "#5a4a3a", "#8a6a3a"], "hood", "bow", 1, 1, 1, "cloak"],
  ["Rohan Hound", "b", ["#8a6a4a", "#6a4a2e", "#2a1a10"], "dog", "none", 0, 0, 0.85, ""],
  ["Royal Guard", "g", ["#2e4a2e", "#5a4a3a", "#d4a537"], "rohanhelm", "spear", 0, 0, 1.22, "armor cloak shield"]]);
erDef("zealots", "Zealots of Dormammu", RED, [
  ["Zealot", "h", ["#5a4a3a", "#3a2e22", "#7a2a6a"], "zealot", "blade", 0, 0, 1, "robe"],
  ["Zealot Blade", "h", ["#4a3a2e", "#3a2e22", "#ff9100"], "zealot", "sword", 0, 0, 1, "robe"],
  ["Mindless One", "f", ["#2a1a3a", "#1a0e26", "#ff7043"], "skullfire", "none", 0, 0, 0.6, "fire"],
  ["Dark Dimension Brute", "g", ["#3a1e4a", "#2a1436", "#ff7043"], "horns", "claws", 0, 0, 1.3, "spikes"]]);
erDef("sword", "S.W.O.R.D.", RED, [
  ["S.W.O.R.D. Agent", "h", ["#1a1a1e", "#2a2a2e", "#c8ccd0"], "helmet", "rifle", 1, 1, 1, "vest"],
  ["S.W.O.R.D. Operative", "h", ["#2a2a30", "#1e1e22", "#c8ccd0"], "cap", "pistol", 1, 1, 1, "vest"],
  ["Recon Drone", "f", ["#3a3a42", "#1a1a20", "#4fc3ff"], "drone", "none", 1, 1, 0.6, "glow"],
  ["S.W.O.R.D. Heavy", "h", ["#1a1a1e", "#2a2a2e", "#5a5f66"], "helmet", "mg", 1, 1, 1.15, "armor"]]);
erDef("knights", "The Holy Order", RED, [
  ["Knight", "h", ["#9aa0a6", "#7a8086", "#c62828"], "knighthelm", "sword", 0, 0, 1, "armor tabard shield"],
  ["Militia Peasant", "h", ["#7a6a4a", "#5a4e36", "#3a2a1a"], "hair", "pitchfork", 0, 0, 0.95, "rags torch"],
  ["Hound", "b", ["#6a5a46", "#4a3e30", "#2a1a10"], "dog", "none", 0, 0, 0.85, ""],
  ["Paladin", "g", ["#c8ccd0", "#a8acb0", "#ffd54f"], "knighthelm", "mace", 0, 0, 1.25, "armor tabard glow"]]);

const ER_HERO = {
  0: "imperial", 1: "imperial", 4: "imperial", 5: "imperial", 6: "imperial", 2: "rebel", 54: "rebel", 76: "rebel", 3: "republic", 55: "republic", 77: "republic",
  78: "separatist", 79: "separatist", 8: "goauld", 9: "goauld", 10: "replicator", 7: "sgc", 12: "sgc", 11: "atlantis",
  13: "alliance", 14: "alliance", 15: "alliance", 16: "alliance", 17: "browncoat", 52: "outlaws", 18: "harkonnen", 20: "harkonnen", 19: "fremen", 21: "fremen",
  22: "borg", 24: "borg", 23: "starfleet", 25: "cylon", 26: "colonial", 27: "geth", 28: "xenomorph", 29: "commandos", 30: "colonial_marines", 31: "arachnids",
  32: "covenant", 33: "demons", 53: "guard_hope", 34: "orks", 35: "chaos", 38: "chaos", 36: "imperial_guard", 37: "imperial_guard", 39: "agents", 40: "lapd",
  41: "replicants", 42: "arasaka", 43: "wasteland", 44: "warboys", 51: "bratva", 45: "combine", 46: "daleks", 47: "space_pirates", 48: "witcher_foes",
  49: "investigators", 50: "kenshi_foes", 62: "aurors", 68: "aurors", 70: "aurors", 71: "orcs", 72: "rohan", 73: "zealots", 74: "sword", 75: "knights"
};
[56, 57, 58, 59, 60, 61, 63, 64, 65, 66, 67, 69].forEach(c => { ER_HERO[c] = "death_eaters"; });
function enemyRosterKey() {
  if (!player) return "imperial";
  if (player.cid === CUSTOM_CID && typeof customCityUniverse === "function") { const u = customCityUniverse(); if (u && ER[u.roster]) return u.roster; }
  if (player.hostileRoster && ER[player.hostileRoster]) return player.hostileRoster;
  return ER_HERO[player.cid] || "imperial";
}
function enemyRoster() { const k = enemyRosterKey(); return ER[k] || ER.imperial; }
function enemySpec(type) { const R = enemyRoster(); return R.t[type === 99 ? 3 : (type & 3)]; }
function enemyIsRanged(type) { const s = enemySpec(type); return !!(s && s.r); }
function enemyIsKinetic(wpnId) { const R = enemyRoster(); return !!(R.t[0].k || R.t[3].k); }
function enemyWeaponId(j) { return enemySpec(eType[j]).k ? 51 : 2; }
function enemyBloodCol(j) { return enemyRoster().blood; }
function enemyDisplayName(j) { const s = enemySpec(eType[j]); return eType[j] === 99 ? (s.n + " Titan").toUpperCase() : s.n.toUpperCase(); }
// EOF part 1

/* --- renderer helpers -------------------------------------------------------------- */
const ER_SKIN = ["#f1c27d", "#e0ac69", "#c68642", "#8d5524", "#ffdbac", "#d1a17a"], ER_HAIR = ["#2b1b12", "#4e342e", "#1b1b1b", "#8d6e63", "#d7b26a", "#a0522d", "#9e9e9e"];
const ER_SABER = ["#4fc3ff", "#69f0ae", "#b388ff", "#ffd54f"];
function erRR(g, x, y, w, h, r) { g.beginPath(); if (g.roundRect) g.roundRect(x, y, w, h, Math.min(r, w / 2, h / 2)); else g.rect(x, y, w, h); }
function erShade(hex, f) { return typeof crSh === "function" ? crSh(hex, f) : hex; }
function erGlow(g, x, y, r, col, a) { const gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, typeof crA === "function" ? crA(col, a) : col); gr.addColorStop(1, "rgba(0,0,0,0)"); g.fillStyle = gr; g.beginPath(); g.arc(x, y, r, 0, 7); g.fill(); }
function erFace(g, skin, dir, back, eyes, y0 = -9) {
  g.fillStyle = skin; g.beginPath(); g.arc(0, y0, 4.6, 0, 7); g.fill();
  if (back) return;
  g.fillStyle = eyes || "#15171b"; g.fillRect(-2.2 + dir * 0.9, y0 - 0.9, 1.3, 1.3); g.fillRect(0.9 + dir * 0.9, y0 - 0.9, 1.3, 1.3);
  g.fillStyle = "rgba(0,0,0,0.25)"; g.fillRect(-1 + dir * 0.9, y0 + 2, 2, 0.6);
}
function erHelm(g, col, y0 = -9, r = 5, brim = 0) {
  g.fillStyle = col; g.beginPath(); g.arc(0, y0 - 0.6, r, Math.PI, 0); g.lineTo(r, y0 + 0.4); g.lineTo(-r, y0 + 0.4); g.closePath(); g.fill();
  if (brim) { g.fillRect(-r - brim, y0 + 0.2, (r + brim) * 2, 1.4); }
  g.fillStyle = "rgba(255,255,255,0.18)"; g.beginPath(); g.arc(-1.5, y0 - 3, 1.6, 0, 7); g.fill();
}

/* --- heads -------------------------------------------------------------------------- */
function erHead(g, s, i, dir, back, t) {
  const c = s.c, sd = eSeed[i] || i, skin = ER_SKIN[sd % 6], hair = ER_HAIR[(sd >> 3) % 7], acc = c[2];
  switch (s.hd) {
    case "bucket": case "clone": case "scout": case "deathtrooper": {
      const base = s.hd === "deathtrooper" ? "#1a1c20" : "#eef0f2";
      g.fillStyle = base; erRR(g, -4.8, -14, 9.6, 10.2, 4.2); g.fill();
      if (back) break;
      g.fillStyle = s.hd === "deathtrooper" ? "#3a7a5a" : "#15171b";
      if (s.hd === "scout") g.fillRect(-4 + dir, -10.4, 8, 2.2);
      else { g.beginPath(); g.moveTo(-3.6 + dir, -10.6); g.lineTo(-0.6 + dir, -9.4); g.lineTo(-0.6 + dir, -10.6); g.closePath(); g.fill(); g.beginPath(); g.moveTo(3.6 + dir, -10.6); g.lineTo(0.6 + dir, -9.4); g.lineTo(0.6 + dir, -10.6); g.closePath(); g.fill(); g.fillRect(-0.6 + dir, -10.6, 1.2, 4.2); }
      g.fillStyle = s.hd === "clone" ? acc : "#9aa0a6"; if (s.hd === "clone") g.fillRect(-4.8, -13, 9.6, 1.2); else g.fillRect(-1.6 + dir, -6.4, 3.2, 1);
      break;
    }
    case "b1": g.fillStyle = c[0]; erRR(g, -1.6, -15, 3.2, 5, 1.5); g.fill(); g.beginPath(); g.ellipse(dir * 2.2, -14.2, 4.2, 1.8, 0, 0, 7); g.fill(); if (!back) { g.fillStyle = "#3a3020"; g.beginPath(); g.arc(dir * 0.8, -14.3, 0.9, 0, 7); g.fill(); } break;
    case "bx": g.fillStyle = c[0]; erRR(g, -2.6, -14, 5.2, 5, 2); g.fill(); if (!back) { g.fillStyle = acc; g.fillRect(-1.2 + dir, -12.4, 2.4, 1.2); } break;
    case "b2": if (!back) { g.fillStyle = "#15171b"; g.fillRect(-3 + dir, -7.5, 6, 1.6); g.fillStyle = acc; g.fillRect(-1.6 + dir, -7.2, 1, 1); g.fillRect(0.8 + dir, -7.2, 1, 1); } break;
    case "rebelhelm": case "camohelm": erFace(g, skin, dir, back); erHelm(g, s.hd === "camohelm" ? "#5a6a3a" : "#e8e8e2"); break;
    case "ewok": g.fillStyle = c[0]; g.beginPath(); g.arc(0, -9, 5.4, 0, 7); g.fill(); g.fillStyle = "#c86a2a"; g.beginPath(); g.arc(0, -10.5, 5.2, Math.PI * 1.05, Math.PI * 1.95); g.fill(); if (!back) { g.fillStyle = "#1a1a1a"; g.beginPath(); g.arc(-2 + dir, -8.6, 1.1, 0, 7); g.arc(2 + dir, -8.6, 1.1, 0, 7); g.fill(); } break;
    case "wookiee": case "wolf": g.fillStyle = c[0]; g.beginPath(); g.arc(0, -9.4, 5.6, 0, 7); g.fill(); g.fillStyle = erShade(c[0], -0.25); for (let k = 0; k < 5; k++) g.fillRect(-4 + k * 2, -14, 0.8, 3); if (!back) { g.fillStyle = s.hd === "wolf" ? "#ffd54f" : "#1a1a1a"; g.fillRect(-2.2 + dir, -10, 1.3, 1.1); g.fillRect(1 + dir, -10, 1.3, 1.1); if (s.hd === "wolf") { g.fillStyle = erShade(c[0], 0.15); g.beginPath(); g.ellipse(dir * 3.5, -8, 2.6, 1.6, 0, 0, 7); g.fill(); g.fillStyle = c[0]; g.beginPath(); g.moveTo(-4, -12); g.lineTo(-3, -16); g.lineTo(-1.5, -13); g.moveTo(4, -12); g.lineTo(3, -16); g.lineTo(1.5, -13); g.fill(); } } break;
    case "serpent": case "horus": {
      g.fillStyle = s.hd === "serpent" ? "#9aa0a6" : "#8a6a3a"; g.beginPath(); g.ellipse(0, -10.5, 4.6, 5.6, 0, 0, 7); g.fill();
      g.fillStyle = s.hd === "serpent" ? "#c0c6cc" : "#c8a040"; g.beginPath(); g.moveTo(-2.5, -15); g.quadraticCurveTo(dir * 4, -20, dir * 6.5, -16.5); g.lineTo(dir * 3, -14); g.closePath(); g.fill();
      if (!back) { g.fillStyle = "#ff3b3b"; g.fillRect(-2 + dir, -10.6, 1.4, 1.1); g.fillRect(0.8 + dir, -10.6, 1.4, 1.1); }
      g.fillStyle = acc; g.fillRect(-4.6, -6.5, 9.2, 1.4);
      break;
    }
    case "kull": case "tactical": case "metrocop": case "combine": case "elite_c": case "visorhelm": case "pilothelm": case "marinehelm": case "harkhelm": case "chromeface": {
      const base = { kull: "#15171b", tactical: "#2a2d30", metrocop: "#3a4048", combine: "#2a4a6a", elite_c: "#e8ecf0", visorhelm: c[2] === "#cfd8dc" ? "#cfd8dc" : "#2a2d33", pilothelm: "#e8e8e8", marinehelm: "#5a6448", harkhelm: "#1e1e22", chromeface: "#9aa0a6" }[s.hd];
      g.fillStyle = base; erRR(g, -4.9, -14.2, 9.8, 10, 4); g.fill();
      if (back) break;
      if (s.hd === "kull" || s.hd === "elite_c") { g.fillStyle = s.hd === "kull" ? "#c62828" : "#ff1744"; g.fillRect(-1 + dir * 1.4, -10.4, 2, 1.4); }
      else if (s.hd === "metrocop") { g.fillStyle = "#e8eef2"; g.fillRect(-2.6 + dir, -10.6, 1.6, 1.6); g.fillRect(1 + dir, -10.6, 1.6, 1.6); g.fillStyle = "#1a1d22"; g.fillRect(-1 + dir, -7.6, 2, 2); }
      else if (s.hd === "combine") { g.fillStyle = "#ff9100"; g.fillRect(-3 + dir, -10.6, 1.8, 1.8); g.fillRect(1.2 + dir, -10.6, 1.8, 1.8); }
      else if (s.hd === "tactical") { g.fillStyle = "#15171b"; g.fillRect(-4 + dir, -10.8, 8, 2.4); g.fillStyle = "rgba(120,200,240,0.6)"; g.fillRect(-3 + dir, -10.4, 2, 1.4); g.fillRect(1 + dir, -10.4, 2, 1.4); }
      else if (s.hd === "chromeface") { g.fillStyle = "#ff1744"; g.fillRect(-2.6 + dir, -10.6, 1.6, 1.2); g.fillRect(1 + dir, -10.6, 1.6, 1.2); }
      else { g.fillStyle = s.hd === "harkhelm" ? "#8a6a3a" : (typeof acc === "string" && s.hd === "visorhelm" ? "#1a1d22" : "#15202b"); g.fillRect(-4 + dir, -11, 8, 2.6); g.fillStyle = "rgba(255,255,255,0.3)"; g.fillRect(-3 + dir, -10.6, 2.4, 0.8); if (s.hd === "marinehelm") { g.fillStyle = "#2a2a2a"; g.fillRect(dir * 4, -13, 2 * dir, 2); } }
      break;
    }
    case "repform": case "cyber": case "centurion": case "geth": {
      const base = s.hd === "geth" ? c[0] : (s.hd === "repform" ? "#c0c8d0" : "#d0d4d8");
      g.fillStyle = base;
      if (s.hd === "geth") { g.beginPath(); g.ellipse(dir * 1.5, -11, 3.6, 4.8, dir * 0.4, 0, 7); g.fill(); if (!back) { erGlow(g, dir * 2.4, -11.4, 4.5, acc, 0.6); g.fillStyle = acc; g.beginPath(); g.arc(dir * 2.4, -11.4, 1.6, 0, 7); g.fill(); } break; }
      erRR(g, -4.4, -14, 8.8, 9.4, s.hd === "repform" ? 1 : 3.5); g.fill();
      g.fillStyle = "rgba(255,255,255,0.35)"; g.fillRect(-3.4, -13.2, 2, 6);
      if (back) break;
      if (s.hd === "centurion") { const sweep = Math.sin(t * 4 + i) * 2.6; g.fillStyle = "#15171b"; g.fillRect(-3.6, -10.6, 7.2, 2); g.fillStyle = "#ff1744"; g.fillRect(sweep - 0.8, -10.4, 1.8, 1.6); erGlow(g, sweep, -9.6, 3, "#ff1744", 0.6); }
      else if (s.hd === "cyber") { g.fillStyle = "#15171b"; g.beginPath(); g.ellipse(-1.8 + dir, -10, 0.9, 1.4, 0, 0, 7); g.ellipse(1.8 + dir, -10, 0.9, 1.4, 0, 0, 7); g.fill(); g.fillRect(-1.5 + dir, -7.2, 3, 0.8); g.fillStyle = base; g.fillRect(-6, -12, 1.6, 4); g.fillRect(4.4, -12, 1.6, 4); }
      else { g.fillStyle = "#5a6a7a"; g.fillRect(-2 + dir, -10.4, 1.4, 1.4); g.fillRect(0.8 + dir, -10.4, 1.4, 1.4); }
      break;
    }
    case "borg": erFace(g, "#b8bcc0", dir, back); if (!back) { g.fillStyle = "#1a1a1a"; g.fillRect(-4.6, -12, 4, 6); g.fillStyle = "#ff1744"; g.fillRect(-3 + dir, -9.8, 1.2, 1.2); erGlow(g, -2.4 + dir, -9.2, 3, "#ff1744", 0.5); } g.strokeStyle = "#1a1a1a"; g.lineWidth = 0.8; g.beginPath(); g.moveTo(-2, -5); g.lineTo(-3, -1); g.moveTo(2, -5); g.lineTo(3, -1); g.stroke(); break;
    case "stillsuit": g.fillStyle = "#7a6a52"; g.beginPath(); g.arc(0, -9.4, 5.2, 0, 7); g.fill(); if (!back) { g.fillStyle = skin; g.fillRect(-3.4 + dir, -11.6, 6.8, 3.4); g.fillStyle = "#2a7ab8"; g.fillRect(-2.2 + dir, -10.6, 1.4, 1.2); g.fillRect(0.9 + dir, -10.6, 1.4, 1.2); g.fillStyle = "#3a3a3a"; g.fillRect(-0.4 + dir, -8.2, 0.8, 3); } break;
    case "grunt": g.fillStyle = "#8a8a7a"; g.beginPath(); g.ellipse(dir * 1.2, -7.5, 4.4, 3.8, 0, 0, 7); g.fill(); if (!back) { g.fillStyle = "#3a5a8a"; g.fillRect(dir * 2 - 2, -6.6, 4, 2.4); g.fillStyle = "#ff9100"; g.fillRect(-2 + dir * 1.5, -9.2, 1.2, 1.2); g.fillRect(1 + dir * 1.5, -9.2, 1.2, 1.2); } break;
    case "elite": g.fillStyle = c[0]; g.beginPath(); g.ellipse(dir * 1.6, -10, 4.2, 4.6, dir * 0.3, 0, 7); g.fill(); if (!back) { g.fillStyle = "#6a5a4a"; g.beginPath(); g.moveTo(dir * 2, -8); g.lineTo(dir * 6, -6); g.lineTo(dir * 2, -5.6); g.fill(); g.fillStyle = acc; g.fillRect(dir * 1.4 - 0.6, -11.2, 1.4, 1.2); } break;
    case "imp": case "baron": case "horns": case "chaoshelm": {
      const base = s.hd === "chaoshelm" ? c[0] : (s.hd === "horns" ? skin : c[0]);
      g.fillStyle = base; g.beginPath(); g.arc(0, -9.4, 4.9, 0, 7); g.fill();
      g.fillStyle = s.hd === "chaoshelm" ? acc : "#e8e0c8"; g.beginPath(); g.moveTo(-3.5, -12); g.quadraticCurveTo(-7, -14, -6, -18); g.lineTo(-2.4, -13.4); g.moveTo(3.5, -12); g.quadraticCurveTo(7, -14, 6, -18); g.lineTo(2.4, -13.4); g.fill();
      if (!back) { const ec = s.hd === "baron" ? "#76ff03" : "#ff7043"; g.fillStyle = ec; g.fillRect(-2.4 + dir, -10, 1.6, 1.2); g.fillRect(0.9 + dir, -10, 1.6, 1.2); erGlow(g, dir, -9.5, 4, ec, 0.35); }
      break;
    }
    case "ork": case "grot": case "goblin": case "orc": case "uruk": case "nekker": case "drowner": {
      const base = s.hd === "orc" ? "#6a6a5a" : s.hd === "uruk" ? "#3a3a32" : s.hd === "drowner" ? "#5a7a6a" : s.hd === "nekker" ? "#8a7a6a" : s.hd === "goblin" ? "#9aa088" : c[0];
      g.fillStyle = base; g.beginPath(); g.ellipse(0, -9, 5.2, 4.6, 0, 0, 7); g.fill();
      if (s.hd === "grot" || s.hd === "goblin" || s.hd === "nekker") { g.beginPath(); g.moveTo(-4, -10); g.lineTo(-8, -12); g.lineTo(-4, -8); g.moveTo(4, -10); g.lineTo(8, -12); g.lineTo(4, -8); g.fill(); }
      if (!back) { g.fillStyle = s.hd === "orc" || s.hd === "uruk" ? "#ffcc00" : "#ff3b3b"; g.fillRect(-2.4 + dir, -10, 1.4, 1.1); g.fillRect(1 + dir, -10, 1.4, 1.1); if (s.hd === "ork" || s.hd === "orc" || s.hd === "uruk") { g.fillStyle = "#e8e0c8"; g.fillRect(-2.2 + dir, -6.8, 1, 1.6); g.fillRect(1.2 + dir, -6.8, 1, 1.6); } if (s.hd === "uruk") { g.fillStyle = "#f2f2f2"; g.fillRect(-1 + dir, -12, 2.6, 2.6); } }
      if (s.hd === "orc" || s.hd === "uruk") erHelm(g, "#2a2a26", -9.6, 5.2);
      break;
    }
    case "hood": case "demask": case "zealot": case "rag": {
      g.fillStyle = s.hd === "rag" ? "#a8906a" : (s.hd === "demask" ? "#15151a" : (s.hd === "zealot" ? skin : erShade(c[0], -0.15)));
      if (s.hd === "zealot") { erFace(g, skin, dir, back); if (!back) { g.fillStyle = "rgba(60,20,60,0.8)"; g.fillRect(-3 + dir, -10.4, 2.4, 1.8); g.fillRect(0.6 + dir, -10.4, 2.4, 1.8); } g.fillStyle = "#2a1e16"; g.beginPath(); g.arc(0, -10.5, 4.8, Math.PI, 0); g.fill(); break; }
      g.beginPath(); g.moveTo(-5.4, -4.5); g.quadraticCurveTo(-6, -16, 0, -15.5); g.quadraticCurveTo(6, -16, 5.4, -4.5); g.closePath(); g.fill();
      if (!back) { if (s.hd === "demask") { g.fillStyle = "#c8ccd0"; erRR(g, -3 + dir, -12.2, 6, 6.6, 2.5); g.fill(); g.strokeStyle = "#5a5f66"; g.lineWidth = 0.5; g.beginPath(); g.moveTo(-2 + dir, -11); g.quadraticCurveTo(dir, -9, 2 + dir, -11); g.stroke(); g.fillStyle = "#15151a"; g.fillRect(-2 + dir, -10.4, 1.3, 1); g.fillRect(0.8 + dir, -10.4, 1.3, 1); } else { g.fillStyle = "rgba(0,0,0,0.6)"; erRR(g, -3 + dir, -12, 6, 6, 2.5); g.fill(); g.fillStyle = s.hd === "rag" ? skin : "#ff5252"; g.fillRect(-2 + dir, -10, 1.2, 1); g.fillRect(0.8 + dir, -10, 1.2, 1); } }
      break;
    }
    case "marinehelmet40k": case "knighthelm": case "rohanhelm": case "paladin": case "wildhunt": case "spikehelm": {
      const base = s.hd === "marinehelmet40k" ? c[0] : s.hd === "wildhunt" ? "#3a4048" : s.hd === "paladin" ? "#d8d0b8" : (s.hd === "spikehelm" ? "#5a5046" : "#b8bec4");
      g.fillStyle = base; erRR(g, -5, -14.6, 10, 10.4, s.hd === "knighthelm" ? 2 : 4); g.fill();
      if (s.hd === "paladin") { g.beginPath(); g.moveTo(-4, -14); g.lineTo(0, -20); g.lineTo(4, -14); g.fill(); }
      if (s.hd === "rohanhelm") { g.fillStyle = "#e8e0c8"; g.beginPath(); g.moveTo(0, -15); g.quadraticCurveTo(-dir * 7, -14, -dir * 6, -6); g.lineTo(-dir * 4, -8); g.closePath(); g.fill(); }
      if (s.hd === "wildhunt" || s.hd === "spikehelm") { g.fillStyle = s.hd === "wildhunt" ? "#9adcff" : "#8a8a8a"; for (let k = -2; k <= 2; k++) { g.beginPath(); g.moveTo(k * 2 - 0.8, -14); g.lineTo(k * 2.4, -18 - (2 - Math.abs(k))); g.lineTo(k * 2 + 0.8, -14); g.fill(); } }
      if (!back) {
        if (s.hd === "marinehelmet40k") { g.fillStyle = "#ff1744"; g.fillRect(-2.8 + dir, -10.6, 1.8, 1.4); g.fillRect(1 + dir, -10.6, 1.8, 1.4); g.fillStyle = erShade(base, -0.3); g.fillRect(-1.4 + dir * 1.4, -8, 2.8, 3); }
        else if (s.hd === "knighthelm") { g.fillStyle = "#15171b"; g.fillRect(-3.6 + dir, -10.6, 7.2, 1.2); g.fillRect(-0.5 + dir, -10.6, 1, 4); }
        else if (s.hd === "wildhunt") { g.fillStyle = "#9adcff"; g.fillRect(-2.6 + dir, -10.4, 1.6, 1.2); g.fillRect(1 + dir, -10.4, 1.6, 1.2); erGlow(g, dir, -10, 5, "#9adcff", 0.35); }
        else { g.fillStyle = "#15171b"; g.fillRect(-3 + dir, -10.4, 6, 1.4); }
      }
      break;
    }
    case "pirate": g.fillStyle = c[0]; g.beginPath(); g.ellipse(dir * 1.4, -10.4, 4.4, 5.2, dir * 0.3, 0, 7); g.fill(); if (!back) { g.fillStyle = acc; g.fillRect(dir * 1.2 - 2.4, -11.4, 4.8, 1.6); erGlow(g, dir * 1.2, -10.6, 4, acc, 0.4); } g.fillStyle = erShade(c[0], 0.2); g.beginPath(); g.moveTo(-3, -14); g.lineTo(-dir * 6, -17); g.lineTo(-dir * 2, -12); g.fill(); break;
    case "hunter": g.fillStyle = c[0]; erRR(g, -5, -13, 10, 8, 2); g.fill(); if (!back) { g.fillStyle = acc; g.fillRect(-3 + dir, -10, 6, 1.6); erGlow(g, dir, -9, 5, acc, 0.4); } g.fillStyle = erShade(c[0], 0.2); for (let k = -2; k <= 2; k++) g.fillRect(k * 2 - 0.5, -16, 1, 3); break;
    case "platinum": case "agent": case "buzz": case "slick": case "mohawk": case "dreads": case "scar": case "hair": case "bald": case "warboy": case "ghoul": case "inferi": case "mutant": case "rictus": case "commissar": case "fedora": case "hat": case "sombrero": case "cap": case "helmet": case "boonie": case "beret": case "bandana": default: {
      let sk = skin;
      if (s.hd === "warboy" || s.hd === "rictus") sk = "#ece8e0"; else if (s.hd === "ghoul") sk = "#9a8a6a"; else if (s.hd === "inferi") sk = "#c8d0c0"; else if (s.hd === "mutant") sk = "#7a9a5a"; else if (s.hd === "bald" && s.c[2] === "#8a6a3a") sk = "#e8dcd0";
      if (s.hd === "scar") sk = "#d8c0a8";
      erFace(g, sk, dir, back, s.hd === "inferi" ? "#f0f0f0" : (s.hd === "mutant" ? "#c62828" : null));
      if (s.hd === "warboy" && !back) { g.fillStyle = "#15171b"; g.fillRect(-3 + dir, -10.6, 2.6, 2.2); g.fillRect(0.6 + dir, -10.6, 2.6, 2.2); g.fillStyle = "#f2f2f2"; g.fillRect(-1.6 + dir, -6.8, 3.2, 1); }
      if (s.hd === "rictus" && !back) { g.fillStyle = "#5a5f66"; erRR(g, -2.4 + dir, -8.6, 4.8, 3.6, 1); g.fill(); }
      if (s.hd === "scar" && !back) { g.strokeStyle = "#8a1a1a"; g.lineWidth = 0.7; g.beginPath(); g.moveTo(-3, -12); g.lineTo(1, -6); g.moveTo(2, -12); g.lineTo(3.5, -8); g.stroke(); }
      if (s.hd === "ghoul" && !back) { g.fillStyle = "rgba(90,40,20,0.6)"; g.beginPath(); g.arc(1.5 * dir, -8, 1.4, 0, 7); g.fill(); }
      const hc = s.hd === "platinum" ? "#f2efe6" : (s.hd === "mohawk" ? "#c62828" : hair);
      if (s.hd === "agent") { g.fillStyle = "#1a1a1a"; g.beginPath(); g.arc(0, -10.6, 4.7, Math.PI * 1.02, Math.PI * 1.98); g.fill(); if (!back) { g.fillStyle = "#050505"; g.fillRect(-3.2 + dir, -10.4, 2.8, 1.4); g.fillRect(0.4 + dir, -10.4, 2.8, 1.4); g.fillRect(-0.6 + dir, -10, 1.2, 0.6); } }
      else if (s.hd === "buzz") { g.fillStyle = "rgba(30,25,20,0.7)"; g.beginPath(); g.arc(0, -10.4, 4.7, Math.PI * 1.05, Math.PI * 1.95); g.fill(); }
      else if (s.hd === "slick" || s.hd === "platinum") { g.fillStyle = hc; g.beginPath(); g.arc(0, -10.3, 4.9, Math.PI * 0.95, Math.PI * 2.05); g.fill(); if (s.hd === "platinum") for (let k = -2; k <= 2; k++) { g.beginPath(); g.moveTo(k * 1.8 - 0.8, -13.5); g.lineTo(k * 2, -16); g.lineTo(k * 1.8 + 0.8, -13.5); g.fill(); } }
      else if (s.hd === "mohawk") { g.fillStyle = hc; g.fillRect(-0.9, -16, 1.8, 6); }
      else if (s.hd === "dreads") { g.fillStyle = hair; g.beginPath(); g.arc(0, -10.5, 5, Math.PI, 0); g.fill(); for (let k = 0; k < 5; k++) g.fillRect(-4.6 + k * 2.2, -10, 1.2, 7 + (k & 1) * 2); }
      else if (s.hd === "hair" || s.hd === "scar") { g.fillStyle = s.hd === "scar" ? "#3a2a1a" : hair; g.beginPath(); g.arc(0, -10.4, 4.9, Math.PI * 0.98, Math.PI * 2.02); g.fill(); if ((sd & 3) === 1) { g.fillRect(-5, -10.4, 1.8, 6); g.fillRect(3.2, -10.4, 1.8, 6); } }
      else if (s.hd === "commissar") { g.fillStyle = "#15171b"; g.fillRect(-5.6, -13.4, 11.2, 3.4); g.fillRect(-4.4, -15.4, 8.8, 2.4); g.fillStyle = "#c62828"; g.fillRect(-5.6, -11.4, 11.2, 0.8); g.fillStyle = "#d4a537"; g.fillRect(-1, -14.6, 2, 1.6); }
      else if (s.hd === "fedora") { g.fillStyle = "#3a3028"; g.fillRect(-6.4, -12.6, 12.8, 1.6); erRR(g, -4, -16, 8, 4.2, 1.5); g.fill(); g.fillStyle = "#1a1a1a"; g.fillRect(-4, -13.2, 8, 0.8); }
      else if (s.hd === "hat" || s.hd === "sombrero") { const w2 = s.hd === "sombrero" ? 9.5 : 7.2; g.fillStyle = s.hd === "sombrero" ? "#c8a060" : "#5a3a1e"; g.beginPath(); g.ellipse(0, -12.2, w2, 1.8, 0, 0, 7); g.fill(); erRR(g, -3.6, -16.6, 7.2, 4.8, 2); g.fill(); g.fillStyle = "#2a1a10"; g.fillRect(-3.6, -12.8, 7.2, 0.8); }
      else if (s.hd === "cap") { g.fillStyle = acc === "#d4a537" ? "#1e2a4a" : erShade(c[0], -0.1); g.beginPath(); g.arc(0, -11, 4.8, Math.PI, 0); g.fill(); g.fillRect(dir > 0 ? 0 : -7, -11.4, 7, 1.4); if (acc === "#d4a537") { g.fillStyle = acc; g.fillRect(-0.8, -14, 1.6, 1.4); } }
      else if (s.hd === "helmet" || s.hd === "boonie") erHelm(g, s.hd === "boonie" ? "#5a6a3a" : (c[2] === "#2a2a2a" ? erShade(c[0], -0.1) : "#2a2d30"), -9, 5.2, s.hd === "boonie" ? 2.2 : 0.6);
      else if (s.hd === "beret") { g.fillStyle = "#2a3a2a"; g.beginPath(); g.ellipse(dir * -0.8, -12.6, 4.8, 2.4, -dir * 0.3, 0, 7); g.fill(); }
      else if (s.hd === "bandana") { g.fillStyle = hair; g.beginPath(); g.arc(0, -10.4, 4.9, Math.PI, 0); g.fill(); g.fillStyle = (sd & 1) ? "#c62828" : "#2e5a2e"; g.fillRect(-4.9, -12, 9.8, 1.6); g.fillRect(-dir * 4, -11.6, -dir * 3, 1); }
      break;
    }
  }
}

/* --- weapons (drawn along +x in the aim frame) ---------------------------------------- */
function erWeapon(g, w, s, i, swing, firing) {
  const metal = "#2a2d33";
  switch (w) {
    case "none": case "claws": return 0;
    case "blaster": case "rifleE": case "lasgun": case "pulse": case "pulserifle": case "rifle": case "shotgunE": case "shotgun": case "smg": case "tommy": case "bowcaster": {
      const L = w === "smg" || w === "tommy" ? 9 : (w === "shotgun" || w === "shotgunE" ? 11 : 13), th = w === "shotgun" ? 2.6 : 2.2;
      const body = w === "rifle" || w === "shotgun" ? (s.k ? "#3a2a1e" : metal) : (w === "lasgun" ? "#6a4a2a" : metal);
      g.fillStyle = body; g.fillRect(2, -th / 2, L, th);
      g.fillStyle = metal; g.fillRect(L - 1, -0.8, 4, 1.6); g.fillRect(4, th / 2 - 0.5, 1.6, 2.6);
      if (w === "blaster" || w === "rifleE") { g.fillStyle = "#4a4f56"; g.fillRect(5, -th / 2 - 1.2, 4, 1.2); }
      if (w === "tommy") { g.fillStyle = "#1a1a1a"; g.beginPath(); g.arc(7, 2, 2, 0, 7); g.fill(); }
      if (w === "pulserifle" || w === "pulse") { g.fillStyle = w === "pulse" ? "#4fc3ff" : "#5a6448"; g.fillRect(4, -1.6, 6, 0.8); }
      if (w === "bowcaster") { g.strokeStyle = "#8a6a3a"; g.lineWidth = 1; g.beginPath(); g.moveTo(L - 2, -4); g.quadraticCurveTo(L + 1, 0, L - 2, 4); g.stroke(); }
      return L + 3;
    }
    case "pistol": case "pistolE": case "phaser": case "boltpistol": case "revolver": case "maula": case "plasmapistol": case "zat": {
      const col = w === "phaser" ? "#2a2a2a" : w === "plasmapistol" ? "#5a7ad8" : w === "zat" ? "#5a4a3a" : w === "revolver" ? "#5a5f66" : metal;
      g.fillStyle = col; g.fillRect(2, -1.1, 6.5, 2.2); g.fillRect(3, 0.8, 1.6, 2.4);
      if (w === "zat") { g.beginPath(); g.moveTo(8, -1.5); g.quadraticCurveTo(11, 0, 8, 1.5); g.fill(); }
      if (w === "plasmapistol" || w === "pistolE") { g.fillStyle = s.c[2] && s.hd === "grunt" ? "#4fc3ff" : "#ff5252"; g.fillRect(7, -0.6, 1.6, 1.2); }
      return 9;
    }
    case "mg": case "minigun": case "smartgun": case "bolter": case "slugga": case "fuelrod": case "armcannon": case "wristgun": case "wristblaster": {
      if (w === "armcannon" || w === "wristgun" || w === "wristblaster") { g.fillStyle = w === "armcannon" ? "#3a2a4a" : "#5a5f66"; erRR(g, 0, -2, 9, 4, 1.5); g.fill(); g.fillStyle = s.c[2]; g.fillRect(8, -1, 2, 2); if (firing) erGlow(g, 10, 0, 4, s.c[2], 0.6); return 10; }
      const L = w === "minigun" ? 14 : 13;
      g.fillStyle = w === "bolter" ? "#2a2a2a" : (w === "fuelrod" ? "#3a5a2a" : metal); erRR(g, 1, -2.4, L - 2, 4.8, 1); g.fill();
      if (w === "minigun") { g.fillStyle = "#4a4f56"; for (let k = -1; k <= 1; k++) g.fillRect(L - 2, k * 1.2 - 0.4, 5, 0.8); }
      else { g.fillStyle = metal; g.fillRect(L - 2, -0.9, 4, 1.8); }
      if (w === "smartgun") { g.strokeStyle = "#5a5f66"; g.lineWidth = 1; g.beginPath(); g.moveTo(1, 2); g.lineTo(-4, 5); g.stroke(); }
      if (w === "bolter") { g.fillStyle = "#c9a227"; g.fillRect(4, -2.4, 2, 1); }
      return L + 2;
    }
    case "staff": { g.fillStyle = "#c8a040"; g.fillRect(-6, -0.9, 22, 1.8); g.fillStyle = "#e8c860"; g.beginPath(); g.ellipse(16, 0, 2.6, 1.6, 0, 0, 7); g.fill(); if (firing) erGlow(g, 17, 0, 5, "#ffd166", 0.7); return 17; }
    case "saberB": case "esword": {
      const col = w === "esword" ? "#4fc3ff" : ER_SABER[(eSeed[i] || i) & 3];
      g.save(); g.rotate(swing); g.fillStyle = "#9aa0a6"; g.fillRect(1, -1, 4, 2);
      g.shadowColor = col; g.shadowBlur = 6; g.strokeStyle = col; g.lineWidth = 2.2; g.lineCap = "round";
      g.beginPath(); g.moveTo(5, 0); g.lineTo(18, 0); g.stroke(); g.strokeStyle = "#ffffff"; g.lineWidth = 0.9; g.beginPath(); g.moveTo(5, 0); g.lineTo(17.5, 0); g.stroke(); g.restore(); return 0;
    }
    case "sword": case "scimitar": case "blade": case "knife": case "crysknife": {
      const L = w === "knife" || w === "crysknife" || w === "blade" ? 6 : 12, col = w === "crysknife" ? "#f2ead8" : "#c8ccd0";
      g.save(); g.rotate(swing); g.fillStyle = "#5a3a1e"; g.fillRect(1, -0.9, 3, 1.8); g.fillStyle = "#8a7a5a"; g.fillRect(3.6, -2, 1, 4);
      g.fillStyle = col; g.beginPath(); g.moveTo(4.6, -1); g.lineTo(4.6 + L, w === "scimitar" ? -2.5 : -0.3); g.lineTo(4.6 + L, 0.4); g.lineTo(4.6, 1); g.closePath(); g.fill(); g.restore(); return 0;
    }
    case "spear": case "lance": case "polearm": case "pitchfork": {
      g.save(); g.rotate(swing * 0.4); g.fillStyle = "#6a4a2a"; g.fillRect(-6, -0.7, 22, 1.4);
      g.fillStyle = w === "lance" ? "#c62828" : "#b8bec4";
      if (w === "pitchfork") { for (let k = -1; k <= 1; k++) g.fillRect(16, k * 1.6 - 0.4, 4, 0.8); }
      else { g.beginPath(); g.moveTo(16, -1.6); g.lineTo(21, 0); g.lineTo(16, 1.6); g.fill(); }
      if (w === "lance") erGlow(g, 19, 0, 4, "#ff7043", 0.5);
      g.restore(); return 0;
    }
    case "mace": case "klaw": case "choppa": case "wrench": case "baton": {
      g.save(); g.rotate(swing); g.fillStyle = "#5a3a1e"; g.fillRect(1, -0.8, 7, 1.6);
      if (w === "baton") { g.fillStyle = "#1a1a1a"; g.fillRect(1, -0.9, 10, 1.8); if (Math.sin(runTime * 20 + i) > 0.6) erGlow(g, 11, 0, 3, "#4fc3ff", 0.6); }
      else if (w === "klaw") { g.fillStyle = "#5a5f66"; erRR(g, 4, -3.5, 7, 7, 2); g.fill(); g.fillStyle = "#c9a227"; g.fillRect(10, -3.5, 3, 1.4); g.fillRect(10, 2.1, 3, 1.4); }
      else if (w === "choppa") { g.fillStyle = "#9aa0a6"; g.beginPath(); g.moveTo(7, -1); g.lineTo(12, -4); g.lineTo(13, 1); g.lineTo(7, 1.5); g.fill(); }
      else if (w === "wrench") { g.fillStyle = "#9aa0a6"; g.fillRect(4, -0.8, 6, 1.6); g.beginPath(); g.arc(10.5, 0, 1.8, 0, 7); g.fill(); }
      else { g.fillStyle = "#7a7f86"; g.beginPath(); g.arc(9.5, 0, 2.6, 0, 7); g.fill(); g.fillStyle = "#9aa0a6"; for (let k = 0; k < 4; k++) g.fillRect(9.5 + Math.cos(k * 1.57) * 2.6 - 0.6, Math.sin(k * 1.57) * 2.6 - 0.6, 1.2, 1.2); }
      g.restore(); return 0;
    }
    case "wand": { g.fillStyle = "#4a3020"; g.fillRect(2, -0.5, 8, 1); if (firing) { erGlow(g, 10.5, 0, 5, s.c[2] === "#c8ccd0" ? "#76ff03" : "#ff5252", 0.7); } return 10; }
    case "bow": { g.strokeStyle = "#6a4a2a"; g.lineWidth = 1.2; g.beginPath(); g.arc(4, 0, 6, -1.2, 1.2); g.stroke(); g.strokeStyle = "#e8e0c8"; g.lineWidth = 0.5; g.beginPath(); g.moveTo(4 + Math.cos(-1.2) * 6, Math.sin(-1.2) * 6); g.lineTo(4 + Math.cos(1.2) * 6, Math.sin(1.2) * 6); g.stroke(); return 10; }
    default: g.fillStyle = metal; g.fillRect(2, -1, 7, 2); return 9;
  }
}
// EOF part 2

/* --- bodies -------------------------------------------------------------------------- */
const ER_TWO_HANDED = new Set(["blaster", "rifleE", "lasgun", "pulse", "pulserifle", "rifle", "shotgunE", "shotgun", "smg", "tommy", "bowcaster", "mg", "minigun", "smartgun", "bolter", "fuelrod", "staff", "spear", "lance", "polearm", "pitchfork", "bow"]);
function erBodyHuman(g, s, i, face, walk, swing, firing, kneel) {
  const dir = Math.cos(face) >= 0 ? 1 : -1, back = Math.sin(face) < -0.62;
  const c = s.c, x = s.x, robot = s.b === "r", giant = s.b === "g";
  const thin = x.indexOf("thin") >= 0, bulky = x.indexOf("bulky") >= 0 || giant;
  const tw = bulky ? 7.2 : (thin ? 4.4 : 6), limb = thin ? 2 : (bulky ? 3.8 : 3);
  const sw = Math.sin(walk), bob = walk ? Math.abs(Math.cos(walk)) * 0.8 : Math.sin(runTime * 2 + i) * 0.25;
  const crouch = x.indexOf("crouch") >= 0 ? 2.5 : 0, legsLost = eLegsLost[i] | 0, armsLost = eArmsLost[i] | 0;
  g.fillStyle = "rgba(0,0,0,0.28)"; g.beginPath(); g.ellipse(0, 10.6, tw + 2.2, 2.6, 0, 0, 7); g.fill();
  g.save(); g.translate(0, crouch - bob);
  if (x.indexOf("shimmer") >= 0) g.globalAlpha = 0.42 + 0.22 * Math.sin(runTime * 5 + i);
  if (x.indexOf("glow") >= 0) erGlow(g, 0, -2, 18, c[2], 0.22);
  g.scale(dir, 1);
  // cape / cloak / rokkit pack behind
  if (x.indexOf("cloak") >= 0 || (back && (x.indexOf("robe") >= 0 || x.indexOf("coat") >= 0))) { g.fillStyle = erShade(x.indexOf("cloak") >= 0 && c[0] === "#3a5a3a" ? "#2e5a2e" : c[0], -0.25); g.beginPath(); g.moveTo(-tw - 0.5, -5.5); g.lineTo(tw + 0.5, -5.5); g.lineTo(tw + 2.5, 9); g.lineTo(-tw - 2.5, 9); g.closePath(); g.fill(); }
  if (x.indexOf("rokkit") >= 0) { g.fillStyle = "#5a5f66"; g.fillRect(-tw - 3, -6, 4, 9); erGlow(g, -tw - 1, 5, 5, "#ff9100", 0.7); }
  if (x.indexOf("pack") >= 0 && back) { g.fillStyle = erShade(c[0], -0.2); erRR(g, -tw + 1, -6, tw * 2 - 2, 8, 2); g.fill(); }
  // legs
  const lc = c[1], boot = robot ? erShade(c[1], -0.3) : "#1e1a16";
  const leg = (lx, off) => { g.fillStyle = lc; g.fillRect(lx, 3.6 + Math.min(0, off), limb, 6.2 - Math.abs(off) * 0.3); g.fillStyle = boot; g.fillRect(lx - 0.3, 8.4 + Math.min(0, off) * 0.5, limb + 0.8, 2); };
  if (kneel) { g.fillStyle = lc; g.fillRect(-tw + 0.5, 5, tw - 1, 3); g.fillRect(1, 5, tw - 1, 3); }
  else { if (legsLost < 1) leg(-tw * 0.55 - limb * 0.4, sw * 1.6); if (legsLost < 2) leg(tw * 0.55 - limb * 0.6, -sw * 1.6); }
  // lower garment over the legs
  if (x.indexOf("robe") >= 0 || x.indexOf("coat") >= 0 || x.indexOf("poncho") >= 0 || x.indexOf("kama") >= 0) {
    const lowCol = x.indexOf("kama") >= 0 ? erShade(c[2], -0.1) : (x.indexOf("robe") >= 0 ? erShade(c[0], -0.08) : erShade(c[0], -0.12));
    g.fillStyle = lowCol; g.beginPath(); g.moveTo(-tw, 2); g.lineTo(tw, 2); g.lineTo(tw + 1.4, x.indexOf("robe") >= 0 ? 9.8 : 7.5); g.lineTo(-tw - 1.4, x.indexOf("robe") >= 0 ? 9.8 : 7.5); g.closePath(); g.fill();
    if (x.indexOf("coat") >= 0) { g.fillStyle = "rgba(0,0,0,0.3)"; g.fillRect(-0.4, 2, 0.8, 5.5); }
  }
  // weapon & arms: behind the body when facing away
  const la = dir > 0 ? face : Math.PI - face, px = tw * 0.25, py = -1.6, two = ER_TWO_HANDED.has(s.w);
  const drawArms = () => {
    if (armsLost >= 2) return;
    g.save(); g.translate(px, py); g.rotate(la);
    if (s.w !== "none") erWeapon(g, s.w, s, i, swing, firing);
    g.restore();
    const cg = Math.cos(la + (s.w === "sword" || s.w === "saberB" || s.w === "mace" || s.w === "knife" ? swing : 0)), sg = Math.sin(la + (s.w === "sword" || s.w === "saberB" ? swing : 0));
    const sleeve = robot ? erShade(c[0], -0.1) : (x.indexOf("tracksuit") >= 0 || x.indexOf("suit") >= 0 ? c[0] : erShade(c[0], -0.06));
    g.strokeStyle = sleeve; g.lineCap = "round"; g.lineWidth = limb * 0.95;
    g.beginPath(); g.moveTo(tw * 0.7, -4.2); g.lineTo(px + cg * 4.5, py + sg * 4.5); g.stroke();
    if (armsLost < 1) { g.beginPath(); g.moveTo(-tw * 0.7, -4.2); if (two) g.lineTo(px + cg * 8.5, py + sg * 8.5); else g.lineTo(-tw * 0.8 - sw * 0.8, 1.5); g.stroke(); }
    const hand = robot ? erShade(c[0], 0.15) : (s.w === "claws" ? erShade(c[0], 0.1) : ER_SKIN[(eSeed[i] || i) % 6]);
    g.fillStyle = hand; g.beginPath(); g.arc(px + cg * 4.5, py + sg * 4.5, limb * 0.55, 0, 7); g.fill();
    if (s.w === "claws") { g.strokeStyle = "#e8e0c8"; g.lineWidth = 0.7; for (let k = -1; k <= 1; k++) { g.beginPath(); g.moveTo(px + cg * 5, py + sg * 5 + k); g.lineTo(px + cg * 8, py + sg * 8 + k * 1.6); g.stroke(); } }
    if (armsLost < 1 && x.indexOf("torch") >= 0) { erGlow(g, -tw - 1, -3, 7, "#ff9100", 0.6); g.fillStyle = "#ffb74d"; g.beginPath(); g.arc(-tw - 1, -3, 1.6, 0, 7); g.fill(); }
    if (armsLost < 1 && x.indexOf("tracker") >= 0) { g.fillStyle = "#2a2d33"; g.fillRect(-tw - 2, 0, 3.4, 2.4); g.fillStyle = "#76ff03"; g.fillRect(-tw - 1.6, 0.4, 2.4, 1.4); }
  };
  if (back) drawArms();
  // torso — outfits vary person to person (tracksuits, suits, jackets, fatigues)
  const sd = eSeed[i] || i, x2 = x;
  const tc = x2.indexOf("tracksuit") >= 0 ? ["#1a1a1e", "#1e2a5a", "#5a1a1a", "#2a2a2e", "#e8e8e8", "#1e4a2a"][sd % 6]
    : x2.indexOf("suit") >= 0 ? ["#1e1e22", "#2a2d33", "#1e2433", "#3a3a3e"][sd % 4]
    : x2.indexOf("leather") >= 0 ? ["#2a2420", "#3a2a1e", "#1a1a1e", "#4a3a2a"][sd % 4]
    : (robot || x2.indexOf("armor") >= 0 || x2.indexOf("uniform") >= 0) ? c[0] : erShade(c[0], ((sd >> 4) % 5 - 2) * 0.05);
  g.fillStyle = erShade(tc, -0.3); erRR(g, -tw, -6.2, tw * 2, 10.6, robot ? 2 : 3); g.fill();
  g.fillStyle = tc; erRR(g, -tw + 0.7, -5.6, tw * 2 - 1.4, 9.6, robot ? 1.6 : 2.6); g.fill();
  if (robot || x.indexOf("chrome") >= 0) { g.fillStyle = "rgba(255,255,255,0.28)"; g.fillRect(-tw + 1.4, -5, 1.4, 7); }
  if (x.indexOf("vest") >= 0) { g.fillStyle = erShade(tc, -0.22); erRR(g, -tw + 1.6, -5, tw * 2 - 3.2, 7.6, 1.5); g.fill(); g.fillStyle = erShade(tc, -0.34); g.fillRect(-tw + 2.2, -1, 2.4, 2.4); g.fillRect(tw - 4.6, -1, 2.4, 2.4); }
  if (x.indexOf("armor") >= 0) { g.fillStyle = erShade(tc, 0.14); g.fillRect(-tw + 1, -5.4, tw * 2 - 2, 2.2); g.fillStyle = "rgba(0,0,0,0.22)"; g.fillRect(-0.4, -3, 0.8, 6); }
  if (x.indexOf("pads") >= 0 || x.indexOf("stripe") >= 0) { g.fillStyle = x.indexOf("stripe") >= 0 ? c[2] : erShade(tc, 0.1); erRR(g, -tw - 1.4, -7, 4.2, 3.4, 1.4); g.fill(); erRR(g, tw - 2.8, -7, 4.2, 3.4, 1.4); g.fill(); }
  if (x.indexOf("suit") >= 0 || x.indexOf("tie") >= 0) { g.fillStyle = "#f2f2f2"; g.beginPath(); g.moveTo(-2, -6); g.lineTo(2, -6); g.lineTo(0, -1); g.closePath(); g.fill(); g.fillStyle = x.indexOf("tie") >= 0 ? "#1a1a1a" : "#8a1a1a"; g.fillRect(-0.6, -5.6, 1.2, 4.4); }
  if (x.indexOf("tracksuit") >= 0) { g.fillStyle = c[2]; g.fillRect(-tw + 0.8, -5, 0.9, 8); g.fillRect(tw - 1.7, -5, 0.9, 8); g.fillStyle = "rgba(255,255,255,0.35)"; g.fillRect(-0.3, -5.6, 0.6, 9); }
  if (x.indexOf("leather") >= 0) { g.fillStyle = "rgba(255,255,255,0.14)"; g.fillRect(tw - 3, -5, 1.2, 7); }
  if (x.indexOf("uniform") >= 0) { g.fillStyle = c[2]; for (let k = 0; k < 3; k++) g.fillRect(-0.5, -4.6 + k * 2.6, 1, 1); }
  if (x.indexOf("badge") >= 0) { g.fillStyle = "#d4a537"; g.beginPath(); g.arc(-tw * 0.45, -3.6, 1.2, 0, 7); g.fill(); }
  if (x.indexOf("fur") >= 0) { g.strokeStyle = erShade(tc, -0.25); g.lineWidth = 0.6; for (let k = 0; k < 7; k++) { g.beginPath(); g.moveTo(-tw + 1 + k * tw * 0.3, -5); g.lineTo(-tw + 1.6 + k * tw * 0.3, -2.5); g.stroke(); } }
  if (x.indexOf("poncho") >= 0) { g.fillStyle = erShade(tc, 0.12); g.beginPath(); g.moveTo(-tw - 1, -5); g.lineTo(tw + 1, -5); g.lineTo(0, 3); g.closePath(); g.fill(); }
  if (x.indexOf("stillsuit") >= 0 || x.indexOf("tubes") >= 0) { g.strokeStyle = x.indexOf("tubes") >= 0 ? "#111" : erShade(tc, -0.3); g.lineWidth = 0.8; g.beginPath(); g.moveTo(-tw + 1.5, -5); g.quadraticCurveTo(0, -1, tw - 1.5, -5); g.moveTo(-tw + 1.5, 1); g.lineTo(tw - 1.5, -2); g.stroke(); }
  if (x.indexOf("chain") >= 0) { g.fillStyle = "rgba(200,200,200,0.35)"; for (let yy = -5; yy < 3; yy += 1.6) for (let xx = -tw + 1.2; xx < tw - 1; xx += 1.6) g.fillRect(xx, yy, 0.7, 0.7); }
  if (x.indexOf("rags") >= 0) { g.fillStyle = erShade(tc, -0.3); for (let k = 0; k < 5; k++) { g.beginPath(); g.moveTo(-tw + k * tw * 0.42, 3.4); g.lineTo(-tw + k * tw * 0.42 + 1.2, 6); g.lineTo(-tw + k * tw * 0.42 + 2.4, 3.4); g.fill(); } }
  if (x.indexOf("camo") >= 0) { g.fillStyle = "rgba(30,40,20,0.35)"; g.beginPath(); g.arc(-2, -3, 1.8, 0, 7); g.arc(2.5, 0, 1.6, 0, 7); g.fill(); }
  if (x.indexOf("bandolier") >= 0 || x.indexOf("harness") >= 0) { g.strokeStyle = x.indexOf("harness") >= 0 ? "#2a2a2a" : "#5a3a1e"; g.lineWidth = 1.4; g.beginPath(); g.moveTo(-tw + 1, -5.5); g.lineTo(tw - 1, 2.5); g.stroke(); if (x.indexOf("bandolier") >= 0) { g.fillStyle = "#d4a537"; for (let k = 1; k < 5; k++) g.fillRect(-tw + 1 + k * (tw * 2 - 2) / 5 - 0.4, -5.5 + k * 8 / 5 - 0.6, 0.8, 1.2); } }
  if (x.indexOf("tabard") >= 0) { g.fillStyle = c[2]; g.fillRect(-2, -5.4, 4, 10.5); }
  if (x.indexOf("scarf") >= 0) { g.fillStyle = c[2]; g.fillRect(-tw + 1, -6.4, tw * 2 - 2, 1.6); g.fillStyle = "#d4a537"; g.fillRect(-tw + 3, -6.4, 1, 1.6); }
  if (x.indexOf("spikes") >= 0) { g.fillStyle = "#b8b0a0"; for (const sx of [-tw, tw]) { g.beginPath(); g.moveTo(sx - 1.2, -6); g.lineTo(sx + (sx > 0 ? 1.8 : -1.8), -9); g.lineTo(sx + 1.2, -6); g.fill(); } }
  if (x.indexOf("stone") >= 0) { g.fillStyle = "rgba(0,0,0,0.15)"; for (let k = 0; k < 6; k++) g.fillRect(-tw + 1 + (k * 37 % (tw * 2 - 2)), -5 + (k * 23 % 8), 1.4, 1.4); }
  if (x.indexOf("belt") >= 0) { g.fillStyle = robot ? "#3a3a3a" : "#2a2420"; g.fillRect(-tw + 0.7, 2.4, tw * 2 - 1.4, 1.4); g.fillStyle = "#c8ccd0"; g.fillRect(-0.8, 2.4, 1.6, 1.4); }
  if (x.indexOf("tank") >= 0 && !back) { g.fillStyle = "#4fc3ff"; erRR(g, -tw - 2, -6, 3, 6, 1.4); g.fill(); }
  if (x.indexOf("shield") >= 0 && !back) { g.fillStyle = s.hd === "rohanhelm" ? "#3a5a3a" : (s.b === "g" && s.hd === "hunter" ? "#2a3a5a" : erShade(c[2], -0.1)); g.beginPath(); g.ellipse(-tw - 0.5, -0.5, 3.2, 5, 0, 0, 7); g.fill(); g.strokeStyle = "#d4a537"; g.lineWidth = 0.8; g.stroke(); }
  if (x.indexOf("flightsuit") >= 0) { g.fillStyle = "#2a2a2a"; g.fillRect(-tw + 1, -1, tw * 2 - 2, 1); }
  // head
  if (s.hd !== "b2") { g.save(); if (giant) g.translate(0, 0.6); erHead(g, s, i, 1, back, runTime); g.restore(); } else erHead(g, s, i, 1, back, runTime);
  if (!back) drawArms();
  g.restore();
}
function erBodyBeast(g, s, i, face, walk) {
  const dir = Math.cos(face) >= 0 ? 1 : -1, c = s.c, sw = Math.sin(walk * 1.3), big = s.hd === "warg" ? 1.2 : (s.hd === "pitbull" ? 0.95 : 1);
  g.fillStyle = "rgba(0,0,0,0.25)"; g.beginPath(); g.ellipse(0, 7.6, 9.5 * big, 2.4, 0, 0, 7); g.fill();
  g.save(); g.scale(dir * big, big);
  const pinky = s.hd === "pinky", bone = s.hd === "bonedog";
  g.strokeStyle = erShade(c[1], -0.15); g.lineWidth = pinky ? 2.6 : 1.8; g.lineCap = "round";
  for (const [lx, ph] of [[-5, 0], [-3.6, Math.PI], [3.4, Math.PI], [5, 0]]) { const o = Math.sin(walk * 1.3 + ph) * 2.2; g.beginPath(); g.moveTo(lx, 1.5); g.lineTo(lx + o, 7.2); g.stroke(); }
  g.strokeStyle = c[0]; g.lineWidth = s.hd === "coyote" || s.hd === "warg" ? 2.6 : 1.5; g.beginPath(); g.moveTo(-7, -0.5); g.quadraticCurveTo(-10, -3 + sw, -11, -5.5 + sw * 1.5); g.stroke();
  g.fillStyle = c[0]; g.beginPath(); g.ellipse(0, 0, 7.6, pinky ? 4.6 : 3.8, 0, 0, 7); g.fill();
  g.fillStyle = erShade(c[0], 0.15); g.beginPath(); g.ellipse(0, 1.6, 5.6, 1.6, 0, 0, 7); g.fill();
  if (s.hd === "shepherd") { g.fillStyle = "#1e1612"; g.beginPath(); g.ellipse(-1, -2, 5.5, 2.2, 0, 0, 7); g.fill(); }
  if (bone) { g.strokeStyle = "#8a7a62"; g.lineWidth = 0.6; for (let k = -3; k <= 3; k += 1.5) { g.beginPath(); g.moveTo(k, -3.2); g.lineTo(k, 2.4); g.stroke(); } }
  const hx = 7.6, hy = -3.4;
  g.fillStyle = pinky ? erShade(c[0], -0.1) : c[0]; g.beginPath(); g.arc(hx, hy, pinky ? 4.4 : 3.3, 0, 7); g.fill();
  g.beginPath(); g.ellipse(hx + 2.8, hy + 1, pinky ? 3.2 : 2.5, pinky ? 2.4 : 1.5, 0, 0, 7); g.fill();
  if (pinky) { g.fillStyle = "#f2ead8"; for (let k = 0; k < 4; k++) g.fillRect(hx + 1.5 + k * 1.1, hy + 2.6, 0.7, 1.4); }
  g.fillStyle = "#15100c"; g.beginPath(); g.arc(hx + 5, hy + 0.6, 0.8, 0, 7); g.fill();
  g.fillStyle = s.hd === "warg" || pinky ? "#ffcc00" : "#15100c"; g.beginPath(); g.arc(hx + 1, hy - 1, 0.75, 0, 7); g.fill();
  if (!pinky) { g.fillStyle = erShade(c[0], -0.2); g.beginPath(); g.moveTo(hx - 1.6, hy - 2.4); g.lineTo(hx - 0.6, hy - 5.6); g.lineTo(hx + 0.6, hy - 2.6); g.fill(); }
  g.restore();
}
function erBodyInsect(g, s, i, face, walk) {
  const c = s.c, sw = Math.sin(walk * 1.6);
  g.fillStyle = "rgba(0,0,0,0.25)"; g.beginPath(); g.ellipse(1, 3, 9, 4, 0, 0, 7); g.fill();
  g.save(); g.rotate(face);
  const legs = (n, len, y0, col, w = 1.2) => { g.strokeStyle = col; g.lineWidth = w; g.lineCap = "round"; for (let k = 0; k < n; k++) for (const sd of [-1, 1]) { const ax = -2 + k * (6 / Math.max(1, n - 1)) * 1.1, o = Math.sin(walk * 1.6 + k * 1.7 + (sd > 0 ? 0 : Math.PI)) * 1.6; g.beginPath(); g.moveTo(ax, sd * y0); g.lineTo(ax + 1.5 + o, sd * (y0 + len * 0.6)); g.lineTo(ax + 3 + o * 1.5, sd * (y0 + len)); g.stroke(); } };
  switch (s.hd) {
    case "warrior": case "hopper": case "tanker": {
      const tank = s.hd === "tanker";
      legs(4, tank ? 6 : 8, 2.4, c[1], tank ? 1.8 : 1.4);
      if (s.hd === "hopper") { g.fillStyle = "rgba(220,220,200,0.35)"; const f = Math.sin(runTime * 30 + i) * 0.4; g.beginPath(); g.ellipse(-3, -5, 6, 2.4, -0.6 + f, 0, 7); g.ellipse(-3, 5, 6, 2.4, 0.6 - f, 0, 7); g.fill(); }
      g.fillStyle = c[0]; g.beginPath(); g.ellipse(-5.5, 0, tank ? 9 : 6, tank ? 7 : 4.4, 0, 0, 7); g.fill();
      g.fillStyle = erShade(c[0], -0.2); g.beginPath(); g.ellipse(1.5, 0, 3.6, 3, 0, 0, 7); g.fill();
      g.fillStyle = c[2]; g.beginPath(); g.arc(5, 0, 2.4, 0, 7); g.fill();
      g.strokeStyle = c[2]; g.lineWidth = 1.2; g.beginPath(); g.moveTo(6, -1.4); g.quadraticCurveTo(9, -3, 10, -1); g.moveTo(6, 1.4); g.quadraticCurveTo(9, 3, 10, 1); g.stroke();
      if (tank) erGlow(g, 7, 0, 7, "#ff7043", 0.45);
      break;
    }
    case "rep": case "blocks": {
      legs(4, 5, 2, "#7a838b", 1);
      g.fillStyle = c[0]; for (let yy = -1; yy <= 1; yy++) for (let xx = -1; xx <= 1; xx++) { g.fillRect(xx * 2.4 - 1.1, yy * 2.4 - 1.1, 2.2, 2.2); }
      g.fillStyle = c[2]; g.fillRect(2.6, -1.1, 2.2, 2.2); g.fillStyle = "rgba(255,255,255,0.35)"; g.fillRect(-3.5, -3.5, 2.2, 0.8);
      break;
    }
    case "buzz": case "cybermat": {
      g.fillStyle = c[0]; g.beginPath(); g.arc(0, 0, 4, 0, 7); g.fill(); g.fillStyle = erShade(c[0], 0.2); g.beginPath(); g.arc(-1, -1, 1.6, 0, 7); g.fill();
      g.fillStyle = c[2]; g.beginPath(); g.arc(2.8, 0, 1, 0, 7); g.fill();
      if (s.hd === "buzz") { g.strokeStyle = "#5a5a62"; g.lineWidth = 1; for (let k = 0; k < 4; k++) { const a = k * 1.57 + 0.78 + Math.sin(runTime * 9 + i) * 0.2; g.beginPath(); g.moveTo(Math.cos(a) * 3.6, Math.sin(a) * 3.6); g.lineTo(Math.cos(a) * 6.5, Math.sin(a) * 6.5); g.stroke(); } }
      else { g.fillStyle = c[1]; g.fillRect(-6, -0.4, 2.4, 0.8); }
      break;
    }
    case "roach": legs(3, 5, 2, "#3a2010", 0.8); g.fillStyle = c[0]; g.beginPath(); g.ellipse(0, 0, 5, 3, 0, 0, 7); g.fill(); g.fillStyle = erShade(c[0], 0.2); g.fillRect(-4, -0.3, 8, 0.6); g.strokeStyle = "#3a2010"; g.lineWidth = 0.6; g.beginPath(); g.moveTo(4.5, -1); g.lineTo(8, -3); g.moveTo(4.5, 1); g.lineTo(8, 3); g.stroke(); break;
    case "headcrab": case "hugger": {
      if (s.hd === "hugger") { g.strokeStyle = c[1]; g.lineWidth = 1; for (let k = 0; k < 4; k++) for (const sd of [-1, 1]) { g.beginPath(); g.moveTo(0, 0); g.quadraticCurveTo(2 + k, sd * 4, 4 + k * 0.8 + Math.sin(walk * 2 + k) * 1.2, sd * (5 + k * 0.6)); g.stroke(); } g.strokeStyle = c[0]; g.lineWidth = 1.4; g.beginPath(); g.moveTo(-3, 0); g.quadraticCurveTo(-7, Math.sin(runTime * 6 + i) * 3, -10, 0); g.stroke(); }
      else legs(2, 4, 2.6, c[1], 1.3);
      g.fillStyle = c[0]; g.beginPath(); g.ellipse(0, 0, 4.4, 3.8, 0, 0, 7); g.fill(); g.fillStyle = erShade(c[0], -0.25); g.beginPath(); g.arc(1.6, 0, 1.4, 0, 7); g.fill();
      break;
    }
    case "worm": { for (let k = 0; k < 6; k++) { g.fillStyle = erShade(c[0], k & 1 ? -0.12 : 0); g.beginPath(); g.arc(3 - k * 2.2, Math.sin(runTime * 6 + i + k) * 1.2, 2.4 - k * 0.2, 0, 7); g.fill(); } g.fillStyle = "#3a1e0e"; g.beginPath(); g.arc(4.4, 0, 1, 0, 7); g.fill(); break; }
    default: legs(3, 5, 2, c[1]); g.fillStyle = c[0]; g.beginPath(); g.ellipse(0, 0, 5, 3.4, 0, 0, 7); g.fill();
  }
  g.restore();
}
function erBodyFloat(g, s, i, face, walk) {
  const c = s.c, ground = s.x.indexOf("ground") >= 0, bob = ground ? 0 : Math.sin(runTime * 3 + i) * 1.6 - 7;
  g.fillStyle = "rgba(0,0,0," + (ground ? 0.28 : 0.18) + ")"; g.beginPath(); g.ellipse(0, ground ? 6 : 8, ground ? 6 : 4.5, ground ? 2 : 1.6, 0, 0, 7); g.fill();
  g.save(); g.translate(0, bob);
  const ex = Math.cos(face) * 2, ey = Math.sin(face) * 1.2;
  switch (s.hd) {
    case "probe": g.strokeStyle = "#15171b"; g.lineWidth = 0.8; for (let k = -2; k <= 2; k++) { g.beginPath(); g.moveTo(k * 1.4, 3); g.quadraticCurveTo(k * 2.2, 7, k * 1.6 + Math.sin(runTime * 3 + k) * 1.2, 11); g.stroke(); } for (let k = -1; k <= 1; k++) { g.beginPath(); g.moveTo(k * 1.6, -4); g.lineTo(k * 2.6, -9); g.stroke(); } g.fillStyle = c[0]; g.beginPath(); g.arc(0, 0, 5, 0, 7); g.fill(); g.fillStyle = c[2]; g.beginPath(); g.arc(ex, ey, 1.4, 0, 7); g.fill(); erGlow(g, ex, ey, 4, c[2], 0.5); break;
    case "astro": g.fillStyle = "#9aa0a6"; g.fillRect(-6, -2, 2, 8); g.fillRect(4, -2, 2, 8); g.fillStyle = c[0]; erRR(g, -4, -3, 8, 9, 1.5); g.fill(); g.fillStyle = c[1]; g.beginPath(); g.arc(0, -3, 4, Math.PI, 0); g.fill(); g.fillStyle = "#15171b"; g.beginPath(); g.arc(ex * 0.8, -4.6, 1, 0, 7); g.fill(); g.fillStyle = c[1]; g.fillRect(-2, 0, 4, 1.4); break;
    case "malp": g.fillStyle = "#2a2a2a"; for (const [wx, wy] of [[-5, 4], [5, 4], [-5, -1], [5, -1]]) { g.beginPath(); g.arc(wx, wy, 1.8, 0, 7); g.fill(); } g.fillStyle = c[0]; g.fillRect(-4.5, -3, 9, 6); g.fillStyle = c[2]; g.fillRect(-1, -7, 2, 4); g.fillStyle = "#15171b"; g.beginPath(); g.arc(ex, -7.5, 1.4, 0, 7); g.fill(); break;
    case "drone": case "scanner": case "exocomp": case "cube": case "sentry": {
      if (s.hd === "sentry") { g.strokeStyle = "#3a3a3a"; g.lineWidth = 1.2; g.beginPath(); g.moveTo(0, 0); g.lineTo(-4, 6); g.moveTo(0, 0); g.lineTo(4, 6); g.moveTo(0, 0); g.lineTo(0, 6); g.stroke(); g.save(); g.rotate(face); g.fillStyle = c[0]; g.fillRect(-3, -2.4, 9, 4.8); g.fillStyle = "#2a2a2a"; g.fillRect(6, -0.8, 4, 1.6); g.restore(); g.fillStyle = c[2]; g.beginPath(); g.arc(0, -2, 1, 0, 7); g.fill(); break; }
      if (s.hd === "cube") { g.fillStyle = c[0]; g.fillRect(-4, -4, 8, 8); g.strokeStyle = c[2]; g.lineWidth = 0.6; g.strokeRect(-3, -3, 6, 6); g.beginPath(); g.moveTo(-4, 0); g.lineTo(4, 0); g.moveTo(0, -4); g.lineTo(0, 4); g.stroke(); erGlow(g, 0, 0, 7, c[2], 0.25); break; }
      if (s.hd === "exocomp") { g.fillStyle = c[0]; erRR(g, -3.5, -2.5, 7, 5, 1.5); g.fill(); g.fillStyle = c[2]; g.fillRect(-1, -1, 2, 2); g.strokeStyle = c[1]; g.lineWidth = 0.8; g.beginPath(); g.moveTo(3.5, 0); g.lineTo(6, -1.5); g.moveTo(-3.5, 0); g.lineTo(-6, -1.5); g.stroke(); break; }
      g.fillStyle = c[1]; g.beginPath(); g.ellipse(0, 0, 6, 2.4, 0, 0, 7); g.fill(); g.fillStyle = c[0]; g.beginPath(); g.ellipse(0, -1, 4, 2.6, 0, 0, 7); g.fill();
      g.fillStyle = c[2]; g.beginPath(); g.arc(ex, -0.6 + ey, 1.3, 0, 7); g.fill(); erGlow(g, ex, ey, 5, c[2], 0.4);
      break;
    }
    case "needle": g.save(); g.rotate(face); g.strokeStyle = "#3a3a3e"; g.lineWidth = 1.4; g.beginPath(); g.moveTo(-4, 0); g.lineTo(4, 0); g.stroke(); g.fillStyle = c[2]; g.beginPath(); g.arc(4.4, 0, 0.9, 0, 7); g.fill(); g.restore(); break;
    case "skullfire": erGlow(g, 0, -1, 10, c[2], 0.55); for (let k = 0; k < 4; k++) { g.fillStyle = k & 1 ? "#ff9100" : "#ffd54f"; g.beginPath(); g.arc(-Math.cos(face) * (3 + k * 1.6) + Math.sin(runTime * 9 + k) * 0.8, -Math.sin(face) * (3 + k * 1.6) - 1, 2.6 - k * 0.5, 0, 7); g.fill(); } /* falls through to the skull */
    // eslint-disable-next-line no-fallthrough
    case "skull": { g.fillStyle = c[0]; g.beginPath(); g.arc(0, -1, 4.2, 0, 7); g.fill(); g.fillRect(-2.4, 1.6, 4.8, 2.6); g.fillStyle = "#1a1a1a"; g.beginPath(); g.arc(-1.6 + ex * 0.4, -1.2, 1.1, 0, 7); g.arc(1.6 + ex * 0.4, -1.2, 1.1, 0, 7); g.fill(); if (s.hd === "skull") { g.fillStyle = c[2]; g.beginPath(); g.arc(1.6 + ex * 0.4, -1.2, 0.6, 0, 7); g.fill(); g.fillStyle = "#9a9a9a"; g.fillRect(-3, 4.4, 6, 1.2); } break; }
    case "sentinel": g.strokeStyle = "#1a1a1e"; g.lineWidth = 1.1; for (let k = 0; k < 7; k++) { const a = Math.PI * 0.15 + k * 0.12 + face + Math.PI; g.beginPath(); g.moveTo(0, 0); g.quadraticCurveTo(Math.cos(a) * 6, Math.sin(a) * 6 + Math.sin(runTime * 4 + k) * 2, Math.cos(a) * 12, Math.sin(a) * 12); g.stroke(); } g.fillStyle = c[0]; g.beginPath(); g.ellipse(0, 0, 5, 4, face, 0, 7); g.fill(); g.fillStyle = c[2]; for (let k = -1; k <= 1; k++) { g.beginPath(); g.arc(Math.cos(face) * 3.6 + Math.cos(face + 1.57) * k * 1.6, Math.sin(face) * 3.6 + Math.sin(face + 1.57) * k * 1.6, 0.8, 0, 7); g.fill(); } erGlow(g, Math.cos(face) * 4, Math.sin(face) * 4, 5, c[2], 0.4); break;
    case "metroid": erGlow(g, 0, 0, 10, c[2], 0.25); g.fillStyle = "rgba(168,232,106,0.75)"; g.beginPath(); g.arc(0, -1, 6, Math.PI, 0); g.lineTo(6, 2); g.lineTo(-6, 2); g.closePath(); g.fill(); g.fillStyle = c[1]; for (let k = -1; k <= 1; k++) { g.beginPath(); g.arc(k * 2.4, -1.8 + Math.abs(k) * 0.6, 1.3, 0, 7); g.fill(); } g.strokeStyle = "#e8e0c8"; g.lineWidth = 0.9; for (let k = -1; k <= 1; k += 2) { g.beginPath(); g.moveTo(k * 2.5, 2); g.quadraticCurveTo(k * 3, 5, k * 1.4, 6.5); g.stroke(); } break;
    case "nurgling": g.fillStyle = c[0]; g.beginPath(); g.arc(0, 0, 4, 0, 7); g.fill(); g.fillStyle = c[2]; g.beginPath(); g.arc(-1.4, -1, 0.9, 0, 7); g.arc(1.4, -1, 0.9, 0, 7); g.fill(); g.fillStyle = "#3a2a1a"; g.fillRect(-1.6, 1.2, 3.2, 0.9); break;
    case "flood": g.fillStyle = c[0]; g.beginPath(); g.arc(0, -1, 3.8, 0, 7); g.fill(); g.strokeStyle = c[2]; g.lineWidth = 0.8; for (let k = 0; k < 5; k++) { g.beginPath(); g.moveTo(-2 + k, 2); g.lineTo(-3 + k * 1.5 + Math.sin(runTime * 8 + k) * 0.8, 6); g.stroke(); } break;
    case "patronus": { g.globalAlpha = 0.75; erGlow(g, 0, 0, 12, "#c8e8ff", 0.5); g.fillStyle = "#e8f6ff"; g.beginPath(); g.ellipse(0, 0, 5.5, 3, 0, 0, 7); g.fill(); g.beginPath(); g.arc(Math.cos(face) >= 0 ? 5 : -5, -3, 2.2, 0, 7); g.fill(); g.strokeStyle = "#e8f6ff"; g.lineWidth = 0.8; g.beginPath(); g.moveTo(Math.cos(face) >= 0 ? 5 : -5, -5); g.lineTo(Math.cos(face) >= 0 ? 7 : -7, -9); g.stroke(); g.globalAlpha = 1; break; }
    default: g.fillStyle = c[0]; g.beginPath(); g.arc(0, 0, 4.5, 0, 7); g.fill();
  }
  g.restore();
}
function erBodyDalek(g, s, i, face) {
  const c = s.c;
  g.fillStyle = "rgba(0,0,0,0.3)"; g.beginPath(); g.ellipse(0, 9, 8, 2.6, 0, 0, 7); g.fill();
  g.fillStyle = c[0]; g.beginPath(); g.moveTo(-7.5, 9); g.lineTo(7.5, 9); g.lineTo(5, -2); g.lineTo(-5, -2); g.closePath(); g.fill();
  g.fillStyle = c[2]; for (let r = 0; r < 3; r++) for (let k = -2; k <= 2; k++) { g.beginPath(); g.arc(k * (2.4 + r * 0.4), 0.5 + r * 2.8, 0.9, 0, 7); g.fill(); }
  g.fillStyle = erShade(c[0], -0.2); g.fillRect(-5, -4.5, 10, 2.6);
  const ax = Math.cos(face), ay = Math.sin(face);
  g.strokeStyle = "#2a2a2a"; g.lineWidth = 1.2; g.beginPath(); g.moveTo(-2, -3.2); g.lineTo(-2 + ax * 7, -3.2 + ay * 4); g.moveTo(2, -3.2); g.lineTo(2 + ax * 6, -3.2 + ay * 4); g.stroke();
  g.fillStyle = "#9aa0a6"; g.beginPath(); g.arc(-2 + ax * 7, -3.2 + ay * 4, 1.3, 0, 7); g.fill();
  g.fillStyle = erShade(c[0], 0.15); g.fillRect(-4.2, -7.4, 8.4, 3);
  g.fillStyle = c[1]; g.beginPath(); g.arc(0, -7.6, 4, Math.PI, 0); g.fill();
  g.strokeStyle = "#5a5a5a"; g.lineWidth = 1; g.beginPath(); g.moveTo(0, -9); g.lineTo(ax * 6, -9 + ay * 3); g.stroke();
  g.fillStyle = "#4fc3ff"; g.beginPath(); g.arc(ax * 6, -9 + ay * 3, 1.2, 0, 7); g.fill();
  if (Math.sin(runTime * 7 + i) > 0.7) { g.fillStyle = "#fff8c4"; g.fillRect(-3.4, -12.4, 1.4, 1.4); g.fillRect(2, -12.4, 1.4, 1.4); }
}
function erBodyXeno(g, s, i, face, walk) {
  const dir = Math.cos(face) >= 0 ? 1 : -1, c = s.c, sw = Math.sin(walk * 1.2), runner = s.x.indexOf("runner") >= 0, crest = s.x.indexOf("crest") >= 0;
  g.fillStyle = "rgba(0,0,0,0.3)"; g.beginPath(); g.ellipse(0, 9, 9, 2.4, 0, 0, 7); g.fill();
  g.save(); g.scale(dir, 1);
  g.strokeStyle = c[0]; g.lineWidth = 1.8; g.lineCap = "round";
  g.beginPath(); g.moveTo(-4, 0); g.quadraticCurveTo(-11, 2 + sw * 2, -14, -4 + sw * 3); g.stroke();
  g.fillStyle = c[0]; g.beginPath(); g.moveTo(-14, -4 + sw * 3); g.lineTo(-16.5, -6 + sw * 3); g.lineTo(-13, -2.5 + sw * 3); g.fill();
  g.strokeStyle = c[1]; g.lineWidth = 1.6;
  for (const [lx, ph] of [[-2.5, 0], [1.5, Math.PI]]) { const o = Math.sin(walk * 1.2 + ph) * 2; g.beginPath(); g.moveTo(lx, 2); g.lineTo(lx + 2 + o, 5.5); g.lineTo(lx + o, 9.5); g.stroke(); }
  if (runner) for (const [lx, ph] of [[4, Math.PI], [6, 0]]) { const o = Math.sin(walk * 1.2 + ph) * 2; g.beginPath(); g.moveTo(lx, 1); g.lineTo(lx + o, 9); g.stroke(); }
  g.fillStyle = c[0]; g.beginPath(); g.ellipse(0, -1.5, 5.5, 4, runner ? 0.1 : -0.35, 0, 7); g.fill();
  g.strokeStyle = erShade(c[0], 0.25); g.lineWidth = 0.6; for (let k = -2; k <= 2; k++) { g.beginPath(); g.moveTo(k * 1.4, -4.5); g.lineTo(k * 1.4 + 0.6, 1); g.stroke(); }
  g.strokeStyle = c[0]; g.lineWidth = 1.4; g.beginPath(); g.moveTo(-3, -4.5); g.lineTo(-5.5, -8); g.moveTo(-1, -5); g.lineTo(-2.5, -9); g.stroke();
  const hx = runner ? 6 : 4.5, hy = runner ? -2 : -6;
  g.fillStyle = c[0]; g.beginPath(); g.ellipse(hx - 3, hy - 1.5, crest ? 7 : 6, crest ? 3.6 : 2.6, -0.25, 0, 7); g.fill();
  g.fillStyle = "rgba(160,190,210,0.35)"; g.beginPath(); g.ellipse(hx - 4, hy - 2.6, 3, 1, -0.25, 0, 7); g.fill();
  g.fillStyle = "#c8c0a8"; g.fillRect(hx + 1.6, hy + 0.2, 2, 0.7);
  g.strokeStyle = c[1]; g.lineWidth = 1.3; g.beginPath(); g.moveTo(2.5, -3); g.lineTo(5.5 + sw, 0.5); g.lineTo(7.5, 0); g.stroke();
  g.restore();
}

/* --- entry point (called from render.js) ----------------------------------------------- */
function drawEnemyDetailed(i, ex, ey, baseR, ally, kneel, lev, spect, tCtx) {
  const et = eType[i], s = enemySpec(et);
  if (!s) return false;
  const g = tCtx || ctx, sc = (et === 99 ? 2.1 : 1) * s.s;
  const cityAI = typeof CITY !== "undefined" && CITY.on && typeof ST !== "undefined" && ST.city[i] && ST.state[i] !== 4;
  const dPl = Math.hypot(player.x - ex, player.y - ey);
  let face = cityAI ? ST.face[i] : Math.atan2(player.y - ey, player.x - ex);
  if (ally) face = Math.hypot(eVX[i], eVY[i]) > 5 ? Math.atan2(eVY[i], eVX[i]) : face + Math.PI;
  const moving = Math.hypot(eVX[i], eVY[i]) > 6;
  const walk = moving ? runTime * (et === 1 ? 13 : 10) + i * 0.7 : 0;
  const swing = (!cityAI && dPl < 40 && !ally) ? Math.sin(runTime * 13 + i) * 0.9 : 0;
  const firing = (typeof ST !== "undefined" && ST.flash && ST.flash[i] > 0) || (et === 3 && eFireCD[i] > 2.2);
  g.save(); g.translate(ex, ey); g.scale(sc, sc);
  if (et === 99) erGlow(g, 0, 0, 16, "#ff1744", 0.3 + 0.1 * Math.sin(runTime * 4));
  switch (s.b) {
    case "b": erBodyBeast(g, s, i, face, walk); break;
    case "i": erBodyInsect(g, s, i, face, walk); break;
    case "f": erBodyFloat(g, s, i, face, walk); break;
    case "k": erBodyDalek(g, s, i, face); break;
    case "x": erBodyXeno(g, s, i, face, walk); break;
    default: erBodyHuman(g, s, i, face, walk, swing, firing, kneel);
  }
  if (lev) { g.strokeStyle = "#80deea"; g.lineWidth = 1.4; g.beginPath(); g.arc(0, 0, 14, 0, Math.PI * 2); g.stroke(); }
  g.restore();
  return true;
}
// EOF:js/enemylook.js
