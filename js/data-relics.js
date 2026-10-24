// FILE: js/data-relics.js
// PART: 8 of 14
// DETAIL: v7.0 Arcane Sanctum Overhaul — 50 Relics DB and 100% Bespoke Side-Profile Weapon Silhouette SVGs for All 76 Heroes (#00-#75).

"use strict";

/* === 1. 50 UNIQUE BALANCED RELICS === */
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
  [42, "V8 Blower Supercharger", "+40% Hovercraft/Mech Speed & Ram Damage", "vehBoost", 0.40],
  [43, "Chozo Power Grip", "+30% Effect Duration", "dur", 0.30],
  [44, "Cthulhu Idol Fragment", "+22% Area & +15% Slow", "area", 0.22],
  [45, "Carbonite Freeze Emitter", "+25% Enemy Slow on Hit", "slow", 0.25],
  [46, "Atlantis Drone Pod", "+1 Extra Projectile", "cnt", 1],
  [47, "Serenity Catalyzer", "+16% Move Speed & -10% Cooldown", "spd", 0.16],
  [48, "Shai-Hulud Maker Hook", "+40% Knockback & +20% Max HP", "kb", 0.40],
  [49, "Nexus Singularity Core", "+15% All Damage, +15% Area & -10% Cooldown", "omni", 0.15]
];

/* === 2. ALL 76 BESPOKE SIDE-PROFILE WEAPON SILHOUETTE SVGs (#00-#75) === */
const WPN_SVG_56 = {
  0: (c1, c2) => `<line x1="7" y1="17" x2="21" y2="3" stroke="${c1}" stroke-width="4.2" stroke-linecap="round"/><line x1="7" y1="17" x2="21" y2="3" stroke="#fff" stroke-width="1.6"/><line x1="2.5" y1="21.5" x2="7.5" y2="16.5" stroke="#cfd8dc" stroke-width="3.4"/><circle cx="6.5" cy="17.5" r="1.5" fill="#ff1744"/>`,
  1: (c1, c2) => `<rect x="3" y="11" width="11" height="5" rx="1" fill="#607d8b" stroke="${c2}" stroke-width="1"/><polygon points="14,10 22,7 17,12" fill="${c1}"/><polygon points="14,13 23,13 17,15" fill="${c1}"/><polygon points="14,16 22,19 17,14" fill="${c1}"/>`,
  2: (c1, c2) => `<rect x="4" y="11" width="17" height="3.2" fill="#263238" stroke="#cfd8dc" stroke-width="0.9"/><rect x="8" y="8" width="6" height="2.2" fill="${c2}"/><rect x="6" y="14" width="2.5" height="5" fill="#78909c"/><rect x="11" y="14" width="3" height="3" fill="${c1}"/>`,
  3: (c1, c2) => `<line x1="8" y1="16" x2="21" y2="3" stroke="#ff1744" stroke-width="4" stroke-linecap="round"/><line x1="8" y1="16" x2="21" y2="3" stroke="#fff" stroke-width="1.4"/><path d="M2,20 Q5,20 8,16" fill="none" stroke="#90a4ae" stroke-width="3.2"/><polyline points="6,11 11,7 9,4 15,2" fill="none" stroke="#00e5ff" stroke-width="1.4"/>`,
  4: (c1, c2) => `<rect x="2" y="11" width="12" height="3" fill="#cfd8dc" stroke="#1e88e5" stroke-width="1"/><polygon points="14,9 20,11 14,12" fill="${c2}"/><polygon points="14,13 20,14 14,16" fill="${c2}"/><circle cx="21" cy="12.5" r="2" fill="${c1}"/>`,
  5: (c1, c2) => `<path d="M2,15 L7,12 L20,12 L20,14 L7,14 L3,18 Z" fill="#8d6e63" stroke="${c2}" stroke-width="0.9"/><line x1="17" y1="6" x2="17" y2="20" stroke="#cfd8dc" stroke-width="1.8"/><circle cx="17" cy="5.5" r="2.2" fill="#00e676"/><circle cx="17" cy="20.5" r="2.2" fill="#00e676"/>`,
  6: (c1, c2) => `<path d="M4,19 L6,13.5 L18,13.5 L18,10 L6,10 L3,14 Z" fill="${c1}" stroke="#fff" stroke-width="0.8"/><rect x="7" y="7" width="8" height="2.2" fill="${c2}"/><rect x="18" y="10.5" width="4" height="2" fill="#cfd8dc"/>`,
  7: (c1, c2) => `<line x1="2" y1="20" x2="17" y2="7" stroke="#ffd166" stroke-width="2.6"/><circle cx="18.5" cy="5.5" r="3.8" fill="none" stroke="${c1}" stroke-width="1.5"/><circle cx="18.5" cy="5.5" r="1.8" fill="${c2}"/>`,
  8: (c1, c2) => `<path d="M3,10 L18,10 L18,15 L14,15 L14,18 L11,18 L11,15 L7,15 L7,18 L3,18 Z" fill="#37474f" stroke="${c1}" stroke-width="1"/><rect x="6" y="8" width="10" height="2" fill="${c2}"/><line x1="18" y1="12" x2="22" y2="12" stroke="#cfd8dc" stroke-width="2"/>`,
  9: (c1, c2) => `<line x1="2" y1="20" x2="17" y2="7" stroke="#8d6e63" stroke-width="2.6"/><ellipse cx="19" cy="5.5" rx="4" ry="2.2" transform="rotate(-40 19 5.5)" fill="${c1}" stroke="${c2}" stroke-width="1.2"/>`,
  10: (c1, c2) => `<path d="M3,9 Q12,6 17,10 L15,12 Q10,9 5,12 Z" fill="#cfd8dc"/><path d="M3,15 Q12,18 17,14 L15,12 Q10,15 5,12 Z" fill="#cfd8dc"/><circle cx="11" cy="12" r="2.6" fill="${c1}"/><line x1="14" y1="12" x2="23" y2="12" stroke="${c2}" stroke-width="2.4"/>`,
  11: (c1, c2) => `<path d="M3,17 C5,11 11,9 19,11 C17,14 14,15 9,15 L6,19 Z" fill="#4a148c" stroke="${c1}" stroke-width="1.1"/><circle cx="19.5" cy="11.5" r="2.2" fill="#00e5ff"/>`,
  12: (c1, c2) => `<line x1="3" y1="21" x2="15" y2="9" stroke="#cfd8dc" stroke-width="2.5"/><circle cx="17" cy="7" r="4" fill="none" stroke="${c2}" stroke-width="1.6"/><circle cx="6" cy="8" r="2" fill="${c1}"/><circle cx="18" cy="16" r="2" fill="${c1}"/>`,
  13: (c1, c2) => `<path d="M3,19 L5,13 L8,11 L13,11 L13,14.5 L8,14.5 L6,19 Z" fill="#8d6e63" stroke="${c2}" stroke-width="0.8"/><rect x="8" y="9.5" width="5" height="4.2" rx="1" fill="#ffd166"/><rect x="13" y="10" width="9.5" height="2.2" fill="#ffd166"/>`,
  14: (c1, c2) => `<path d="M4,18 C8,6 16,6 20,18 C15,13 9,13 4,18 Z" fill="#cfd8dc" stroke="${c1}" stroke-width="1.3"/><line x1="12" y1="4" x2="12" y2="20" stroke="${c2}" stroke-width="2"/>`,
  15: (c1, c2) => `<path d="M2,15 L7,15 L8,18 L10,18 L10,14 L22,14 L22,11 L15,11 L15,10 L7,10 L2,12 Z" fill="${c1}" stroke="#fff" stroke-width="0.8"/><rect x="8" y="6" width="8" height="2.5" rx="1" fill="${c2}"/><circle cx="12" cy="16" r="2.4" fill="${c2}"/>`,
  16: (c1, c2) => `<polygon points="12,4 19,10 15,12 18,19 12,16 6,19 9,12 5,10" fill="${c1}" stroke="${c2}" stroke-width="1"/><circle cx="12" cy="12" r="2.2" fill="#fff"/>`,
  17: (c1, c2) => `<line x1="2" y1="18" x2="16" y2="9" stroke="#8d6e63" stroke-width="2.5" stroke-dasharray="2 1"/><circle cx="17.5" cy="8" r="4.5" fill="#b71c1c" stroke="${c2}" stroke-width="1.4" stroke-dasharray="3 1.5"/><polygon points="22,5 18,6 20,10" fill="#cfd8dc"/>`,
  18: (c1, c2) => `<path d="M7,17 Q14,10 22,3 Q16,13 9,19 Z" fill="#eceff1" stroke="${c1}" stroke-width="1"/><line x1="2.5" y1="21.5" x2="8" y2="16" stroke="#5d4037" stroke-width="3"/>`,
  19: (c1, c2) => `<polygon points="7,16 21,3 18,8 9,18" fill="#cfd8dc" stroke="${c1}" stroke-width="1"/><rect x="3" y="16" width="5" height="3" transform="rotate(-45 5 17)" fill="${c2}"/>`,
  20: (c1, c2) => `<polygon points="3,12 9,9 9,15" fill="${c2}"/><path d="M12,8 A5,5 0 0,1 12,16 M15,6 A8,8 0 0,1 15,18 M18,4 A11,11 0 0,1 18,20" fill="none" stroke="${c1}" stroke-width="1.8"/>`,
  21: (c1, c2) => `<polygon points="2,12 14,10.2 23,12 14,13.8" fill="#cfd8dc" stroke="${c1}" stroke-width="0.9"/><circle cx="16" cy="12" r="1.5" fill="#ff1744"/><polygon points="5,10 2,7 8,10" fill="${c2}"/>`,
  22: (c1, c2) => `<path d="M5,18 L8,12 L19,11 L19,13.5 L10,14 L8,18 Z" fill="#cfd8dc" stroke="${c1}" stroke-width="1"/><circle cx="20" cy="12.2" r="2" fill="#ff5252"/>`,
  23: (c1, c2) => `<rect x="2" y="9" width="7" height="6" fill="#263238" stroke="#00e676" stroke-width="1.2"/><path d="M9,10.5 Q15,6 22,9 M9,13.5 Q15,18 22,15" fill="none" stroke="#00e676" stroke-width="1.8"/><circle cx="22" cy="9" r="1.5" fill="${c2}"/><circle cx="22" cy="15" r="1.5" fill="${c2}"/>`,
  24: (c1, c2) => `<path d="M3,18 C7,5 17,5 21,18 C16,12 8,12 3,18 Z" fill="#cfd8dc" stroke="${c1}" stroke-width="1.4"/><rect x="10" y="7" width="4" height="3" fill="${c2}"/>`,
  25: (c1, c2) => `<path d="M3,19 L5,12 L18,12 L18,9.5 L6,9.5 L3,13 Z" fill="#455a64" stroke="${c2}" stroke-width="1"/><rect x="11" y="12.5" width="7" height="2.8" fill="#ff6d00"/><circle cx="20.5" cy="11" r="1.8" fill="${c1}"/>`,
  26: (c1, c2) => `<rect x="3" y="9" width="12" height="6" rx="1" fill="#b0bec5" stroke="#263238" stroke-width="1"/><line x1="15" y1="10.5" x2="22" y2="10.5" stroke="#cfd8dc" stroke-width="2"/><line x1="15" y1="13.5" x2="22" y2="13.5" stroke="#cfd8dc" stroke-width="2"/><circle cx="7" cy="12" r="1.6" fill="#ff1744"/>`,
  27: (c1, c2) => `<path d="M2,15 L6,10 L19,10 L21,12.5 L18,15 L8,15 L6,18 L3,18 Z" fill="#263238" stroke="#d50000" stroke-width="1.1"/><circle cx="19" cy="12.5" r="2.5" fill="${c1}"/>`,
  28: (c1, c2) => `<rect x="3" y="10" width="12" height="4.5" fill="${c1}" stroke="#fff" stroke-width="0.8"/><rect x="15" y="11" width="7.5" height="2.2" fill="#cfd8dc"/><rect x="8.5" y="14.5" width="5" height="4.5" fill="${c2}"/><line x1="18" y1="13" x2="20" y2="19" stroke="${c2}" stroke-width="1.4"/>`,
  29: (c1, c2) => `<circle cx="12" cy="12" r="8" fill="#37474f" stroke="${c1}" stroke-width="2" stroke-dasharray="5 2"/><circle cx="12" cy="12" r="3.5" fill="${c2}"/>`,
  30: (c1, c2) => `<path d="M3,18 Q6,9 15,9 L22,5 L18,12 Q10,12 7,19 Z" fill="#14181d" stroke="#00e676" stroke-width="1.2"/><line x1="12" y1="15" x2="21" y2="15" stroke="#cfd8dc" stroke-width="2"/><polygon points="22,15 19,13 19,17" fill="#00e676"/>`,
  31: (c1, c2) => `<path d="M2,16 L5,10 L19,10 L21,12 L21,14.5 L12,14.5 L11,18 L8,18 L8,15 L5,15 L4,18 Z" fill="#455a64" stroke="${c1}" stroke-width="1"/><rect x="9" y="8" width="6" height="2" fill="${c2}"/>`,
  32: (c1, c2) => `<path d="M2,15 L6,10 L18,10 L19,14 L8,14 L6,18 Z" fill="#2e5736" stroke="#ffd166" stroke-width="0.9"/><path d="M9,19 L21,5 L16,13 L22,7" fill="none" stroke="#00f0ff" stroke-width="2"/>`,
  33: (c1, c2) => `<path d="M2,17 L6,12 L21,11 L21,14.5 L9,14.5 L5,19 Z" fill="#8d6e63" stroke="#fff" stroke-width="0.9"/><rect x="8" y="10.5" width="13" height="3.2" fill="#cfd8dc"/><path d="M16,14.5 L19,18 L22,16" fill="none" stroke="#ff1744" stroke-width="1.6"/>`,
  34: (c1, c2) => `<rect x="3" y="9" width="15" height="6.5" rx="1" fill="#1565c0" stroke="${c2}" stroke-width="1.2"/><rect x="18" y="10.5" width="4" height="3.5" fill="#cfd8dc"/><path d="M10,15.5 Q11,20 14,20 L12,15.5 Z" fill="${c2}"/>`,
  35: (c1, c2) => `<circle cx="11" cy="11" r="6" fill="#cfd8dc" stroke="#b71c1c" stroke-width="1.4"/><circle cx="13" cy="10" r="2" fill="#ff1744"/><path d="M8,16 L6,21 M11,17 L11,22 M14,16 L16,21" stroke="#90a4ae" stroke-width="1.4"/>`,
  36: (c1, c2) => `<rect x="2" y="11" width="19" height="3.8" fill="#37474f" stroke="#00e676" stroke-width="1"/><line x1="7" y1="12.9" x2="22" y2="12.9" stroke="#00e676" stroke-width="2.2"/><polygon points="18,8 22,12 18,17" fill="#00e676"/>`,
  37: (c1, c2) => `<rect x="2" y="8" width="15" height="7.5" fill="#b71c1c" stroke="${c2}" stroke-width="1.2"/><line x1="17" y1="10" x2="23" y2="10" stroke="#cfd8dc" stroke-width="2.2"/><line x1="17" y1="13.5" x2="23" y2="13.5" stroke="#cfd8dc" stroke-width="2.2"/><rect x="8" y="15.5" width="5" height="5" fill="${c2}"/>`,
  38: (c1, c2) => `<line x1="3" y1="20" x2="17" y2="6" stroke="#ffd166" stroke-width="2.6"/><path d="M15,9 C18,3 22,4 21,9 C20,12 16,12 15,9 Z" fill="#00e5ff" stroke="#fff" stroke-width="1"/>`,
  39: (c1, c2) => `<path d="M3,15 L3,9 L11,9 L11,11.5 L6,11.5 L6,16 Z" fill="#212121" stroke="#00e676" stroke-width="1"/><rect x="7" y="11.5" width="2" height="6" fill="#455a64"/><circle cx="16" cy="8" r="1.4" fill="#00e676"/><circle cx="19" cy="12" r="1.4" fill="#00e676"/><circle cx="16" cy="16" r="1.4" fill="#00e676"/>`,
  40: (c1, c2) => `<path d="M2,15 L6,10 L19,10 L21,13 L9,14 L6,18 Z" fill="#546e7a" stroke="#00e5ff" stroke-width="1.1"/><rect x="9" y="7.5" width="6" height="2.2" fill="#e040fb"/><line x1="19" y1="11.5" x2="23" y2="11.5" stroke="#e040fb" stroke-width="2"/>`,
  41: (c1, c2) => `<path d="M4,19 L6,13.5 L17,13.5 L17,9.5 L6,9.5 L3,14 Z" fill="#37474f" stroke="#ff9100" stroke-width="1"/><rect x="11" y="13.5" width="5" height="2.5" fill="#d84315"/><circle cx="14" cy="11.5" r="1.4" fill="#00e676"/>`,
  42: (c1, c2) => `<rect x="2" y="11" width="5" height="5" fill="#ffd166" stroke="#212121" stroke-width="1"/><path d="M7,13 C12,3 19,5 21,12 C22,18 14,21 10,16" fill="none" stroke="#ff1744" stroke-width="2"/><path d="M7,13 C12,3 19,5 21,12" fill="none" stroke="#fff" stroke-width="0.9"/>`,
  43: (c1, c2) => `<rect x="2" y="10" width="18" height="4.5" fill="#546e7a" stroke="#ffd166" stroke-width="1"/><rect x="7" y="14.5" width="5" height="3" fill="#fbc02d"/><line x1="20" y1="12" x2="23" y2="12" stroke="#ff1744" stroke-width="2.2"/>`,
  44: (c1, c2) => `<path d="M3,18 L6,12 L19,11 L19,14.5 L8,14.5 L5,19 Z" fill="#795548" stroke="#cfd8dc" stroke-width="1"/><line x1="8" y1="11" x2="20" y2="11" stroke="#b0bec5" stroke-width="2.5"/>`,
  45: (c1, c2) => `<rect x="3" y="9" width="13" height="7" rx="2" fill="#e65100" stroke="#fff" stroke-width="1"/><path d="M16,8 L21,6 M16,12.5 L22,12.5 M16,17 L21,19" stroke="#ffd166" stroke-width="2"/>`,
  46: (c1, c2) => `<line x1="4" y1="19" x2="17" y2="6" stroke="#cfd8dc" stroke-width="3.2"/><line x1="7" y1="16" x2="13" y2="10" stroke="#ffd166" stroke-width="2"/><circle cx="19" cy="4.5" r="2.8" fill="#00e5ff"/><circle cx="19" cy="4.5" r="1.2" fill="#fff"/>`,
  47: (c1, c2) => `<ellipse cx="11" cy="12" rx="8" ry="5" fill="#00838f" stroke="#00e676" stroke-width="1.4"/><circle cx="19" cy="12" r="3" fill="#ffd166"/>`,
  48: (c1, c2) => `<line x1="7" y1="17" x2="22" y2="2" stroke="#eceff1" stroke-width="3" stroke-linecap="round"/><path d="M4,13 L8,17 L12,13" fill="none" stroke="${c2}" stroke-width="2"/><line x1="2.5" y1="21.5" x2="7" y2="17" stroke="#4e342e" stroke-width="2.8"/>`,
  49: (c1, c2) => `<rect x="4" y="6" width="12" height="14" rx="1" fill="#3e2723" stroke="#00e676" stroke-width="1.2"/><circle cx="10" cy="13" r="2.5" fill="#ffd166"/><path d="M16,9 Q21,6 22,11 M16,15 Q22,14 21,19" fill="none" stroke="#00e676" stroke-width="1.8"/>`,
  50: (c1, c2) => `<path d="M6,18 Q14,11 22,2" fill="none" stroke="#cfd8dc" stroke-width="3.6" stroke-linecap="round"/><line x1="5" y1="15" x2="9" y2="19" stroke="#ffd166" stroke-width="2.2"/><line x1="2" y1="22" x2="6.5" y2="17.5" stroke="#5d4037" stroke-width="2.8"/>`,
  51: (c1, c2) => `<path d="M4,19 L6,13.5 L18,13.5 L18,10 L6,10 L3,14 Z" fill="#141619" stroke="#fff" stroke-width="0.9"/><rect x="18" y="10" width="4" height="3.2" fill="${c2}"/>`,
  52: (c1, c2) => `<path d="M3,19 L5,13 L8,11 L13,11 L13,14.5 L8,14.5 L6,19 Z" fill="#8d6e63" stroke="${c2}" stroke-width="0.8"/><rect x="8" y="9.5" width="5" height="4.2" rx="1" fill="#cfd8dc"/><rect x="13" y="10" width="9.5" height="2.2" fill="#cfd8dc"/>`,
  53: (c1, c2) => `<rect x="3" y="10" width="12" height="4.5" fill="#2e4c2b" stroke="#fff" stroke-width="0.8"/><rect x="15" y="11" width="7.5" height="2.2" fill="#cfd8dc"/><rect x="8.5" y="14.5" width="5" height="4.5" fill="${c2}"/><line x1="18" y1="13" x2="20" y2="19" stroke="${c2}" stroke-width="1.4"/>`,
  54: (c1, c2) => `<path d="M2,17 C4,14 6,14 7,13 L18,13 L21,10 L22,10 L22,16 L21,16 L18,14 L10,14 L9,18 L7,18 L7,15 L4,18 Z" fill="#3e6b48" stroke="${c2}" stroke-width="0.9"/><rect x="8" y="9" width="7" height="2.2" fill="#eceff1"/>`,
  55: (c1, c2) => `<line x1="4" y1="20" x2="20" y2="4" stroke="#00f0ff" stroke-width="3.4"/><line x1="4" y1="4" x2="20" y2="20" stroke="#00e676" stroke-width="3.4"/><circle cx="12" cy="12" r="2.5" fill="${c2}"/>`,
  56: (c1, c2) => `<line x1="4" y1="20" x2="20" y2="4" stroke="#8d6e63" stroke-width="3.5"/><circle cx="20" cy="4" r="2.5" fill="#ffd166"/><path d="M12,12 Q15,8 19,10" fill="none" stroke="#00e676" stroke-width="1.5"/>`,
  57: (c1, c2) => `<path d="M3,19 Q12,14 20,4" fill="none" stroke="#5d4037" stroke-width="3.2"/><path d="M16,6 C18,3 21,3 22,6 C22,9 18,11 16,6 Z" fill="#ab47bc"/><circle cx="7" cy="15" r="2" fill="#00e5ff"/>`,
  58: (c1, c2) => `<line x1="4" y1="20" x2="19" y2="5" stroke="#795548" stroke-width="3.2"/><circle cx="19" cy="5" r="3" fill="#ff1744"/><polygon points="12,10 16,6 14,14" fill="#ffd166"/>`,
  59: (c1, c2) => `<line x1="5" y1="19" x2="19" y2="5" stroke="#ba68c8" stroke-width="3.0"/><circle cx="19" cy="5" r="3.5" fill="#ffeb3b"/><ellipse cx="11" cy="12" rx="4" ry="2" fill="none" stroke="#00e5ff" stroke-width="1.2"/>`,
  60: (c1, c2) => `<line x1="4" y1="20" x2="20" y2="4" stroke="#a1887f" stroke-width="3.5"/><polygon points="20,4 23,8 17,8" fill="#ffd166"/><circle cx="12" cy="12" r="2.5" fill="#00e5ff"/>`,
  61: (c1, c2) => `<line x1="4" y1="20" x2="18" y2="6" stroke="#f06292" stroke-width="3.8"/><path d="M15,9 L22,3 M18,6 L21,9" stroke="#f06292" stroke-width="2"/><path d="M3,19 L7,15" stroke="#4e342e" stroke-width="3.5"/>`,
  62: (c1, c2) => `<line x1="4" y1="20" x2="20" y2="4" stroke="#d7ccc8" stroke-width="3.2"/><circle cx="20" cy="4" r="2.5" fill="#00e676"/><path d="M10,14 L14,10" stroke="#2e7d32" stroke-width="2"/>`,
  63: (c1, c2) => `<line x1="4" y1="20" x2="19" y2="5" stroke="#5d4037" stroke-width="3.5"/><circle cx="19" cy="5" r="3" fill="#cfd8dc"/><path d="M10,12 L14,8" stroke="#ffd166" stroke-width="1.8"/>`,
  64: (c1, c2) => `<line x1="4" y1="20" x2="20" y2="4" stroke="#37474f" stroke-width="3.6"/><circle cx="20" cy="4" r="3" fill="#b0bec5"/><path d="M11,11 Q14,8 17,11" fill="none" stroke="#e040fb" stroke-width="1.8"/>`,
  65: (c1, c2) => `<rect x="4" y="9" width="16" height="4" fill="#5d4037"/><circle cx="12" cy="11" r="3.5" fill="#00e5ff"/><line x1="12" y1="4" x2="12" y2="20" stroke="#8d6e63" stroke-width="3"/>`,
  66: (c1, c2) => `<line x1="4" y1="20" x2="19" y2="5" stroke="#5d4037" stroke-width="3.5"/><circle cx="19" cy="5" r="3" fill="#00e676"/><polygon points="11,10 15,6 13,13" fill="#ffd166"/>`,
  67: (c1, c2) => `<line x1="4" y1="20" x2="20" y2="4" stroke="#111111" stroke-width="3.6"/><circle cx="20" cy="4" r="3" fill="#00ff88"/><path d="M10,14 L15,9" stroke="#ff1744" stroke-width="2"/>`,
  68: (c1, c2) => `<line x1="4" y1="20" x2="19" y2="5" stroke="#4e342e" stroke-width="3.5"/><polygon points="19,5 22,9 16,9" fill="#ff1744"/><path d="M2,18 L8,12" stroke="#cfd8dc" stroke-width="2.5"/>`,
  69: (c1, c2) => `<line x1="3" y1="21" x2="21" y2="3" stroke="#bcaaa4" stroke-width="4.2"/><circle cx="21" cy="3" r="3.5" fill="#ffd166"/><circle cx="7" cy="17" r="2" fill="#ff6d00"/>`,
  70: (c1, c2) => `<path d="M4,19 Q12,10 20,4" fill="none" stroke="#212121" stroke-width="3.5"/><circle cx="20" cy="4" r="3.2" fill="#00ff88"/><path d="M12,13 L17,8" stroke="#2e7d32" stroke-width="2.2"/>`,
  71: (c1, c2) => `<line x1="3" y1="21" x2="21" y2="3" stroke="#eceff1" stroke-width="4"/><circle cx="21" cy="3" r="4" fill="#fff"/><line x1="2" y1="20" x2="16" y2="6" stroke="#b0bec5" stroke-width="3.2"/>`,
  72: (c1, c2) => `<line x1="4" y1="20" x2="20" y2="4" stroke="#111111" stroke-width="4"/><circle cx="20" cy="4" r="3.5" fill="#ff9100"/><rect x="9" y="10" width="6" height="4" fill="#37474f"/>`,
  73: (c1, c2) => `<ellipse cx="12" cy="12" rx="8" ry="4" fill="none" stroke="#ff9100" stroke-width="2.4" transform="rotate(-30 12 12)"/><circle cx="12" cy="12" r="3" fill="#00e5ff"/>`,
  74: (c1, c2) => `<circle cx="12" cy="12" r="7" fill="none" stroke="#ff1744" stroke-width="2.2"/><circle cx="12" cy="12" r="3" fill="#e040fb"/><path d="M4,4 L9,9 M20,4 L15,9" stroke="#ff1744" stroke-width="2"/>`,
  75: (c1, c2) => `<rect x="3" y="7" width="18" height="14" rx="2" fill="#311b92" stroke="#b388ff" stroke-width="1.6"/><circle cx="12" cy="14" r="3.5" fill="#00ff88"/><line x1="7" y1="10" x2="17" y2="10" stroke="#b388ff" stroke-width="1.5"/>`
};

function makeSVG(type, c1 = "#00e5ff", c2 = "#ffd166", wpnId = -1) {
  const sOpen = `<svg class="ico" viewBox="0 0 24 24" width="28" height="28" style="width:28px;height:28px;flex-shrink:0">`;
  let p = "";
  if (typeof WPN_SVG_56 !== "undefined" && wpnId >= 0 && WPN_SVG_56[wpnId]) {
    p = WPN_SVG_56[wpnId](c1, c2);
  } else if (type === "orbit") {
    p = `<line x1="8" y1="16" x2="21" y2="3" stroke="${c1}" stroke-width="4" stroke-linecap="round"/><line x1="3" y1="21" x2="8" y2="16" stroke="#90a4ae" stroke-width="3"/>`;
  } else if (type === "beam") {
    p = `<path d="M2,15 L6,12 L18,12 L18,14.5 L8,14.5 L6,18 Z" fill="#90a4ae" stroke="${c1}" stroke-width="1"/><line x1="18" y1="13" x2="23" y2="13" stroke="${c2}" stroke-width="2.5"/>`;
  } else if (type === "cone") {
    p = `<path d="M2,16 L6,12 L16,12 L16,14.5 L7,14.5 L4,18 Z" fill="${c1}" stroke="#fff" stroke-width="0.9"/><circle cx="20" cy="10" r="1.4" fill="${c2}"/><circle cx="21" cy="14" r="1.4" fill="${c2}"/>`;
  } else if (type === "missile") {
    p = `<path d="M4,12 L15,12 L21,14 L15,16 L4,16 Z" fill="${c1}" stroke="#fff" stroke-width="0.9"/><polygon points="4,12 1,9 6,12" fill="${c2}"/>`;
  } else if (type === "chain") {
    p = `<rect x="2" y="11" width="8" height="4" fill="#78909c"/><polyline points="10,13 15,8 17,16 22,10" fill="none" stroke="${c1}" stroke-width="2.2"/>`;
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
  return `${sOpen}${p}</svg>`;
}
// EOF:js/data-relics.js
