// FILE: js/data-relics.js
// PART: 8 of 14
// DETAIL: 50 Unique Relics Database (including #00 Goa'uld Personal Repulsor) and Procedural SVG Icon Builder.

"use strict";

/* === 1. 50 UNIQUE BALANCED RELICS (Found in Biomes, Relic Chests & Boss Drops) ===
   [id, Name, Description, statKey, val] */
const RELICS_DB = [
  [0, "Goa'uld Personal Repulsor", "Kinetic hand-shield: stops & vaporizes enemy missiles/projectiles", "repulsor", 1],
  [1, "Beskar Ricochet Core", "+1 Projectile Pierce & +3 Flat Armor", "prcArm", 1],
  [2, "Continental Gold Coin", "+15% Crit Chance & +25% Crit Damage on close targets", "critPack", 0.15],
  [3, "Clint's Cigar Stub", "-15% Reload/Cooldown time & +20% Projectile Speed", "fastDraw", 0.15],
  [4, "Rambo's Hollow-Handle Knife", "Fortification timer builds 35% faster & +15% Might", "fortFast", 0.35],
  [5, "Mandalorian Jetpack Thruster", "+18% Move Speed & immunity to floor hazards", "jetHover", 0.18],
  [6, "ZPM Zero-Point Module", "-14% All Weapon & Utility Cooldowns", "cdrAll", 0.14],
  [7, "Crysknife Tooth", "+18% All Damage & +15% Move Speed", "dmgSpd", 0.18],
  [8, "Starfleet Combadge", "+35% Orb Pickup Magnet & +15% XP Gain", "magXp", 0.35],
  [9, "Weyland Motion Tracker", "+20% Crit Chance & +18% Weapon Area", "critArea", 0.20],
  [10, "Purity Seal Parchment", "+4 Flat Armor & +1.5 HP/s Regen", "armReg", 4],
  [11, "Sandevistan Heatsink", "-22% Utility Skill Cooldowns", "utilCdr", 0.22],
  [12, "Aperture Portal Catalyst", "+30% Projectile Speed & +20% Duration", "pspdDur", 0.30],
  [13, "Witcher Wolf Medallion", "+25% Damage against Bosses & Rivals", "bossDmg", 0.25],
  [14, "Meitou Blade Tsuba", "+15% Might & +25% Knockback Force", "dmgKb", 0.15],
  [15, "Kyber Focusing Crystal", "+22% Weapon Damage", "dmg", 0.22],
  [16, "Naquadah Blood Vial", "+2.2 HP/s Health Regeneration", "reg", 2.2],
  [17, "Browncoat Flask", "+30% Max Health & +2 Armor", "hpArm", 0.30],
  [18, "Fremen Stillsuit Valve", "+1.8 HP/s Regen & +12% Move Speed", "regSpd", 1.8],
  [19, "Borg Cortical Node", "+5 Flat Armor", "arm", 5],
  [20, "Yautja Bio-Mask", "+35% Critical Hit Damage", "cdmg", 0.35],
  [21, "Omnissiah Cogitator", "+1 Extra Projectile to all weapons", "cnt", 1],
  [22, "Pip-Boy Vacuum Tube", "+25% Experience & Dark Matter Greed", "greed", 0.25],
  [23, "HEV Battery Cell", "+35% Max HP", "hp", 0.35],
  [24, "Eldritch Star Stone", "Attacks Slow Enemies by +20%", "slow", 0.20],
  [25, "Twin-Sun Binoculars", "+24% Weapon Area of Effect", "area", 0.24],
  [26, "Asgard Core Crystal", "-12% Weapon Cooldown & +20% Magnet", "cdrMag", 0.12],
  [27, "Vera's Custom Scope", "+18% Crit Chance", "crit", 0.18],
  [28, "Spice Harvester Filter", "+30% Boss Dark Matter Yield", "dm", 0.30],
  [29, "Klingon Painstik", "+20% Might & +20% Knockback", "dmgKb", 0.20],
  [30, "Xenomorph Resin Gland", "Attacks Shred +20% Enemy Armor", "shred", 0.20],
  [31, "Astartes Storm Shield", "+6 Flat Armor", "arm", 6],
  [32, "Skynet CPU Neural Chip", "+15% Crit Chance & -10% Cooldown", "critCdr", 0.15],
  [33, "TARDIS Chameleon Circuit", "+18% Dodge Chance", "dodge", 0.18],
  [34, "Beak-Thing Egg Trophy", "+20% Move Speed", "spd", 0.20],
  [35, "Thermal Detonator Pin", "+28% Area of Effect", "area", 0.28],
  [36, "Zat'nik'tel Coil", "+1 Projectile Pierce", "prc", 1],
  [37, "Reaver Harpoon Tip", "+25% Crit Damage & +10% Might", "cdmg", 0.25],
  [38, "Bene Gesserit Gom Jabbar", "+22% Crit Chance", "crit", 0.22],
  [39, "Cylon Centurion Eye", "+30% Projectile Speed", "pspd", 0.30],
  [40, "Crucible Energy Cell", "+25% All Weapon Damage", "dmg", 0.25],
  [41, "Necron Phase Shifter", "+1 Extra Revival at 50% HP", "rev", 1],
  [42, "V8 Blower Supercharger", "+40% Hovercraft Vehicle Speed & Ram Damage", "vehBoost", 0.40],
  [43, "Chozo Power Grip", "+30% Effect Duration", "dur", 0.30],
  [44, "Cthulhu Idol Fragment", "+22% Area & +15% Slow", "area", 0.22],
  [45, "Carbonite Freeze Emitter", "+25% Enemy Slow on Hit", "slow", 0.25],
  [46, "Atlantis Drone Pod", "+1 Extra Projectile", "cnt", 1],
  [47, "Serenity Catalyzer", "+16% Move Speed & -10% Cooldown", "spd", 0.16],
  [48, "Shai-Hulud Maker Hook", "+40% Knockback & +20% Max HP", "kb", 0.40],
  [49, "Nexus Singularity Core", "+15% All Damage, +15% Area & -10% Cooldown", "omni", 0.15]
];

/* === 2. PROCEDURAL SVG ICON GENERATOR === */
function makeSVG(type, c1 = "#00e5ff", c2 = "#ffd166") {
  let p = "";
  if (type === "orbit") {
    p = `<circle cx="12" cy="12" r="8" fill="none" stroke="${c1}" stroke-width="2" stroke-dasharray="6 3"/><circle cx="12" cy="12" r="3" fill="${c2}"/>`;
  } else if (type === "missile") {
    p = `<polygon points="12,2 19,18 12,14 5,18" fill="${c1}"/><circle cx="12" cy="19" r="3" fill="${c2}"/>`;
  } else if (type === "cone") {
    p = `<polygon points="4,19 12,4 20,19" fill="none" stroke="${c1}" stroke-width="2"/><line x1="12" y1="4" x2="12" y2="20" stroke="${c2}" stroke-width="2"/>`;
  } else if (type === "beam") {
    p = `<line x1="3" y1="21" x2="21" y2="3" stroke="${c1}" stroke-width="4"/><line x1="3" y1="21" x2="21" y2="3" stroke="#fff" stroke-width="1.5"/>`;
  } else if (type === "chain") {
    p = `<polyline points="14,2 6,12 13,12 9,22 19,10 12,10" fill="none" stroke="${c1}" stroke-width="2.2"/>`;
  } else if (type === "nova") {
    p = `<polygon points="12,2 15,9 22,12 15,15 12,22 9,15 2,12 9,9" fill="${c1}" stroke="${c2}" stroke-width="1.2"/>`;
  } else if (type === "relic") {
    p = `<polygon points="12,2 21,9 17,21 7,21 3,9" fill="none" stroke="#e040fb" stroke-width="2"/><circle cx="12" cy="12" r="4" fill="${c2}"/>`;
  } else if (type === "grapple") {
    p = `<line x1="4" y1="20" x2="18" y2="6" stroke="${c1}" stroke-width="2"/><polygon points="20,4 13,5 19,11" fill="${c2}"/>`;
  } else if (type === "flame") {
    p = `<path d="M12,2 C16,8 20,11 18,17 C16,21 8,21 6,17 C4,11 8,8 12,2 Z" fill="#ff6d00" stroke="${c2}" stroke-width="1.5"/>`;
  } else if (type === "fort") {
    p = `<rect x="3" y="8" width="18" height="12" fill="none" stroke="${c2}" stroke-width="2"/><line x1="3" y1="14" x2="21" y2="14" stroke="${c1}" stroke-width="2"/>`;
  } else {
    p = `<rect x="4" y="4" width="16" height="16" rx="3" fill="none" stroke="${c1}" stroke-width="2"/><circle cx="12" cy="12" r="4" fill="${c2}"/>`;
  }
  return `<svg class="ico" viewBox="0 0 24 24">${p}</svg>`;
}
