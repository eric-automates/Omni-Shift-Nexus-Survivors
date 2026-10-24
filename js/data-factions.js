// FILE: js/data-factions.js
// PART: 6 of 14
// DETAIL: v7.0 Arcane Sanctum Overhaul — 11 Factions (0-10), House/Order Crest Registry, 1 Free Starter Hero Per Genre, 50 Stages, and 20 Passives.

"use strict";

/* === 1. 11 MULTIVERSE FACTIONS & BIOME MORPH PALETTES (0-10) === */
const FACTIONS = [
  { id: 0, name: "Star-Sector", c1: "#00f0ff", c2: "#ff2a54", bg: "#070b14",
    worlds: ["Tatooine", "Mustafar", "Hoth", "Endor", "Coruscant"],
    tall: "Imperial Turbolaser Tower", low: "Durasteel Cargo Pod",
    decor: "Kyber Crystal Cluster", haz: "Mustafar Magma Vent", loot: "Imperial Supply Pod" },
  { id: 1, name: "Chevron-Gate", c1: "#00e5ff", c2: "#ffd166", bg: "#09101d",
    worlds: ["Abydos", "Chulak", "Dakara", "Pegasus", "Atlantis"],
    tall: "Naquadah Obelisk", low: "Goa'uld Sarcophagus",
    decor: "DHD Control Pedestal", haz: "Unstable Vortex Pool", loot: "Ancient ZPM Cache" },
  { id: 2, name: "Verse-Rim", c1: "#ff9e00", c2: "#d84315", bg: "#140d08",
    worlds: ["Persephone", "Miranda", "beaumonde", "Haven", "Whitefall"],
    tall: "Cortex Relay Spire", low: "Alliance Stamp Crate",
    decor: "Terraformed Dry-Brush", haz: "Reaver Engine Wash", loot: "Smuggler Stash" },
  { id: 3, name: "Spice-Dune", c1: "#ffb703", c2: "#fb8500", bg: "#181006",
    worlds: ["Arrakis", "Caladan", "Giedi Prime", "Kaitain", "Salusa"],
    tall: "Windtrap Moisture Silo", low: "Spice Harvester Track",
    decor: "Thumper Seismic Rod", haz: "Drum-Sand Sinkhole", loot: "Smuggler Spice Cask" },
  { id: 4, name: "Star-Citadel", c1: "#3a86ff", c2: "#8338ec", bg: "#080b18",
    worlds: ["Vulcan", "Qo'noS", "Caprica", "Citadel", "Omega"],
    tall: "Subspace Warp Pylon", low: "Torpedo Casing",
    decor: "Mass Relay Beacon", haz: "Plasma Coolant Leak", loot: "Starfleet Replicator" },
  { id: 5, name: "Xeno-Hive", c1: "#00f5d4", c2: "#9b5de5", bg: "#061214",
    worlds: ["LV-426", "Fiorina", "Klendathu", "Reach", "Argent D'Nur"],
    tall: "Biomass Resin Spire", low: "Weyland Stasis Tube",
    decor: "Ovomorph Egg Clutch", haz: "Molecular Acid Pool", loot: "Colonial Marine Drop" },
  { id: 6, name: "Grim-Imperium", c1: "#ff0055", c2: "#ffcc00", bg: "#14060b",
    worlds: ["Cadia", "Armageddon", "Macragge", "Mars", "Necromunda"],
    tall: "Gothic Aquila Pillar", low: "Munitorum Ammo Crate",
    decor: "Skull Reliquary Shrine", haz: "Promethium Fire-Pit", loot: "Astartes Drop-Pod" },
  { id: 7, name: "Cyber-Noir", c1: "#f72585", c2: "#4cc9f0", bg: "#0d0618",
    worlds: ["Night City", "Mega-City", "Neo-LA", "Zion", "New Vegas"],
    tall: "Arasaka Holo-Monolith", low: "Kevlar Continental Trunk",
    decor: "Neon Noodle Kiosk", haz: "High-Voltage Grid Leak", loot: "Militech Supply Case" },
  { id: 8, name: "Anomaly-Lab", c1: "#ff6d00", c2: "#00e676", bg: "#08140d",
    worlds: ["Black Mesa", "City 17", "Gallifrey", "Zebes", "Aperture"],
    tall: "Resonance Tesla Coil", low: "Weighted Companion Cube",
    decor: "Xen Crystal Sample", haz: "Radioactive Sludge", loot: "HEV Supply Locker" },
  { id: 9, name: "Eldritch-Ash", c1: "#b5179e", c2: "#4ea8de", bg: "#0c0814",
    worlds: ["Kaer Morhen", "R'lyeh", "Kenshi-Moon", "Yharnam", "Caelid"],
    tall: "Non-Euclidean Monolith", low: "Iron Shackles Cage",
    decor: "Place of Power Stone", haz: "Eldritch Madness Fog", loot: "Witcher Alchemy Chest" },
  { id: 10, name: "Arcane-Sanctum", c1: "#ffd166", c2: "#7c4dff", bg: "#0b0718",
    worlds: ["Hogwarts", "Forbidden Forest", "Ministry Atrium", "Khazad-dûm", "Necropolis"],
    tall: "Moving Grand-Staircase Tower", low: "Runed Cauldron & Trunk",
    decor: "Floating Candle Brazier", haz: "Fiendfyre Cursed Pool", loot: "Room of Requirement Chest" }
];

/* === 2. SPELLCASTER HOUSE & ORDER CREST REGISTRY (#56-#75) === */
const HOUSE_CRESTS = {
  56: ["🦁", "Gryffindor House", "#ff5252"],
  57: ["🦁", "Gryffindor House", "#ff5252"],
  58: ["🦁", "Gryffindor House", "#ff5252"],
  59: ["🦅", "Ravenclaw House", "#40c4ff"],
  60: ["🦡", "Hufflepuff House", "#ffd166"],
  61: ["🦁", "Gryffindor Keeper", "#ff5252"],
  62: ["🐍", "Slytherin House", "#00e676"],
  63: ["🦁", "Gryffindor Marauder", "#ff5252"],
  64: ["🦁", "Gryffindor Marauder", "#ff5252"],
  65: ["👁️", "Order of the Phoenix", "#00e5ff"],
  66: ["🦁", "Gryffindor Head", "#ff5252"],
  67: ["🐍", "Slytherin Head", "#00e676"],
  68: ["🐍", "Slytherin Dark-Order", "#00e676"],
  69: ["🦁", "Order of the Phoenix", "#ffd166"],
  70: ["🐍", "Slytherin Heir", "#00e676"],
  71: ["🧙", "Order of Istari", "#ffffff"],
  72: ["🧙", "White Hand Orthanc", "#cfd8dc"],
  73: ["🔯", "Kamar-Taj Sanctum", "#ff9100"],
  74: ["🔮", "Darkhold Chaos", "#ff1744"],
  75: ["💀", "Necropolis Grimoire", "#b388ff"]
};

function getHeroHouseBadge(cid) {
  if (HOUSE_CRESTS[cid]) return HOUSE_CRESTS[cid];
  return null;
}

/* === 3. DEFAULT UNLOCKED STARTER HERO PER FACTION/GENRE (0 DM COST) ===
   Ensures players start with 1 playable hero unlocked in EVERY single genre/faction! */
const STARTER_HEROES_BY_FACTION = [0, 8, 13, 19, 22, 31, 34, 41, 45, 48, 56];

/* === 4. DISTANCE SUB-BIOME RINGS === */
const BIOME_RINGS = [
  { id: 0, name: "Outpost Perimeter", minDist: 0, maxDist: 450, tint: "rgba(0, 0, 0, 0)" },
  { id: 1, name: "Contested Badlands", minDist: 450, maxDist: 950, tint: "rgba(255, 145, 0, 0.04)" },
  { id: 2, name: "Shattered Ruins", minDist: 950, maxDist: 1600, tint: "rgba(124, 77, 255, 0.06)" },
  { id: 3, name: "Abyssal Core", minDist: 1600, maxDist: 999999, tint: "rgba(255, 23, 68, 0.08)" }
];

/* === 5. 50 PROCEDURAL STAGES === */
const STAGES = Array.from({ length: 50 }, (_, i) => {
  const id = i + 1, tier = Math.floor(i / 10);
  const suffixes = ["Outpost", "Trench", "Citadel", "Crucible", "Nexus", "Badlands", "Vault", "Spire", "Abyss", "Omega"];
  const hazards = ["Low Gravity", "Ion Storms", "Acid Fog", "Thermal Vents", "Warp Rifts"];
  return {
    id, tier, suffix: suffixes[i % 10], hazard: hazards[i % 5],
    hpMul: +(1 + i * 0.14).toFixed(2), dmDrop: 1 + Math.floor(i / 4)
  };
});

/* === 6. 5 DIFFICULTY TIERS === */
const DIFFICULTIES = [
  { id: 0, name: "Cadet (Story)", hpMul: 0.70, spdMul: 0.88, spawnMul: 0.80, plrHp: 1.35, xpMul: 1.20 },
  { id: 1, name: "Operative (Standard)", hpMul: 1.00, spdMul: 1.00, spawnMul: 1.00, plrHp: 1.00, xpMul: 1.00 },
  { id: 2, name: "Veteran (Hard)", hpMul: 1.35, spdMul: 1.08, spawnMul: 1.20, plrHp: 0.95, xpMul: 1.25 },
  { id: 3, name: "Elite (Nightmare)", hpMul: 1.75, spdMul: 1.15, spawnMul: 1.40, plrHp: 0.90, xpMul: 1.50 },
  { id: 4, name: "Omega (Multiverse Hell)", hpMul: 2.30, spdMul: 1.24, spawnMul: 1.65, plrHp: 0.85, xpMul: 2.00 }
];

/* === 7. 20 PASSIVE MATRIX UPGRADES & 10 PERMANENT META UPGRADES === */
const PASSIVES = [
  ["Kyber Power Cell", "+20% All Weapon & Spell Damage", "dmg", 0.20],
  ["Chrono Accelerator", "-10% Weapon & Spell Cooldown", "cdr", 0.10],
  ["Subspace Amplifier", "+18% Attack & Spell Area", "area", 0.18],
  ["Beskar Weave", "+2 Flat Armor", "arm", 2],
  ["Bacta Nanites", "+1.2 HP/s Regeneration", "reg", 1.2],
  ["Tractor Siphon", "+30% Orb Magnet Range", "mag", 0.30],
  ["Ion Thrusters", "+12% Move Speed", "spd", 0.12],
  ["Binary Duplicator", "+1 Extra Projectile / Minion Cap", "cnt", 1],
  ["Zero-Point Capacitor", "+20% Effect & Summon Duration", "dur", 0.20],
  ["Hypervelocity Coils", "+20% Projectile Speed", "pspd", 0.20],
  ["Targeting Computer", "+10% Critical Chance", "crit", 0.10],
  ["Assassin Core", "+25% Critical Damage", "cdmg", 0.25],
  ["Depleted Uranium", "+1 Projectile Pierce", "prc", 1],
  ["Juggernaut Plating", "+20% Max Health", "hp", 0.20],
  ["Spice Extractor", "+20% XP Gain", "xp", 0.20],
  ["Dark Matter Collector", "+1 Bonus Dark Matter per Run", "dm", 1],
  ["Repulsor Pistons", "+25% Knockback Impulse", "kb", 0.25],
  ["Cryo Payload", "+15% Enemy Slow on Hit", "slow", 0.15],
  ["Corrosive Nanites", "+15% Enemy Armor Shred", "shred", 0.15],
  ["Phoenix Protocol", "+1 Extra Revival", "rev", 1]
];

const META_UPG = [
  ["Might Core", "+10% Base Damage", 2],
  ["Plating Matrix", "+1 Starting Armor", 2],
  ["Vitality Vats", "+15% Max Health", 2],
  ["Regen Nodules", "+0.6 HP/s Regen", 2],
  ["Haste Relays", "-6% Cooldowns", 3],
  ["Expansion Lens", "+12% Weapon Area", 2],
  ["Thruster Boots", "+8% Move Speed", 2],
  ["Magnet Array", "+25% Pickup Range", 2],
  ["Lethality Optics", "+5% Crit Chance", 3],
  ["Dark Matter Greed", "+20% XP & DM Gain", 3]
];
// EOF:js/data-factions.js
