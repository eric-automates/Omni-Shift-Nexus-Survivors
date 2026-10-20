// FILE: js/data-factions.js
// PART: 6 of 14
// DETAIL: 5 Difficulty Tiers, 4 Distance Sub-Biomes, 10 Faction Palettes, 20 Passive Matrix Upgrades, 10 Meta-Upgrades, and 50 Procedural Stages.

"use strict";

/* === 1. 5 DIFFICULTY TIERS === */
const DIFFICULTIES = [
  { id: 0, name: "Cadet (Easy)", hpMul: 0.65, dmgMul: 0.65, plrHp: 1.35, xpMul: 0.75, dropMul: 0.75, spdMul: 0.85, desc: "Relaxed pacing: -35% Monster HP/Dmg, +35% Player HP, 0.75x XP & Drops" },
  { id: 1, name: "Operative (Normal)", hpMul: 1.00, dmgMul: 1.00, plrHp: 1.00, xpMul: 1.00, dropMul: 1.00, spdMul: 1.00, desc: "Standard Nexus baseline: 1.0x stats, XP, and Dark Matter drops" },
  { id: 2, name: "Veteran (Hard)", hpMul: 1.50, dmgMul: 1.45, plrHp: 0.85, xpMul: 1.50, dropMul: 1.50, spdMul: 1.12, desc: "+50% Monster HP, -15% Player HP, +12% Foe Speed, 1.5x XP & Drops" },
  { id: 3, name: "Nightmare", hpMul: 2.20, dmgMul: 2.00, plrHp: 0.75, xpMul: 2.30, dropMul: 2.30, spdMul: 1.25, desc: "+120% Monster HP, -25% Player HP, +25% Foe Speed, 2.3x XP & Drops" },
  { id: 4, name: "Omega Nexus", hpMul: 3.50, dmgMul: 3.00, plrHp: 0.65, xpMul: 3.80, dropMul: 3.80, spdMul: 1.40, desc: "Extreme lethality: 3.5x Monster HP, -35% Player HP, 3.8x XP & Drops" }
];

/* === 2. DISTANCE-BASED SUB-BIOMES (Measured from Start 256, 256) === */
const BIOME_RINGS = [
  { id: 0, name: "Outpost Perimeter", minDist: 0, maxDist: 800, tint: "rgba(0,0,0,0)", desc: "Standard Faction Perimeter Props & Crates" },
  { id: 1, name: "Settlement Huts Sector", minDist: 800, maxDist: 1800, tint: "rgba(255,190,80,0.05)", desc: "Colonial Huts, Barricades & Relic Chests" },
  { id: 2, name: "Vehicle Yard Sector", minDist: 1800, maxDist: 3000, tint: "rgba(0,229,255,0.06)", desc: "Abandoned Hovercraft Skimmers & Heavy Cover" },
  { id: 3, name: "Deep Vault Badlands", minDist: 3000, maxDist: 999999, tint: "rgba(224,64,251,0.08)", desc: "Ancient Vault Relic Caches & High-Mutation Waves" }
];

/* === 3. 10 FACTIONS & 5-WORLD STAGE PREFIX PALETTES === */
const FACTIONS = [
  { id: 0, name: "Laser-Opera", worlds: ["Tatooine", "Hoth", "Mustafar", "Coruscant", "Death-Moon"],
    bg: "#26190c", grid: "#3a2612", tall: "Moisture Vaporator Spire", low: "Kyber Cargo Crate",
    decor: "Holo-Beacon Scrub", haz: "Twin-Sun Thermal Vent", loot: "Imperial Supply Pod", c1: "#00e5ff", c2: "#ff1744" },
  { id: 1, name: "Astral-Gate", worlds: ["Abydos", "Chulak", "Dakara", "Atlantis", "Celestis"],
    bg: "#241c0e", grid: "#382c16", tall: "Naquadah Obelisk", low: "Chevron Dial Pedestal",
    decor: "Scarab Crystal Cluster", haz: "Unstable Kawoosh Ring", loot: "Ancient Sarcophagus Cache", c1: "#ffd166", c2: "#00b0ff" },
  { id: 2, name: "Rim-Outlaw", worlds: ["Whitefall", "Jiangyin", "Beaumonde", "Persephone", "Miranda"],
    bg: "#22140d", grid: "#362015", tall: "Brittle Rim Windmill Scrub", low: "Stamped Alliance Barrel",
    decor: "Dry Alkali Sagebrush", haz: "Reaver Core Leak Zone", loot: "Smuggler Contraband Safe", c1: "#ff9100", c2: "#cfd8dc" },
  { id: 3, name: "Spice-Empire", worlds: ["Arrakeen", "Sietch Tabr", "Hagga Basin", "Giedi Prime", "Kaitain"],
    bg: "#2c1808", grid: "#44250d", tall: "Windtrap Collector Spire", low: "Basalt Sietch Outcrop",
    decor: "Cinnamon Spice Vent", haz: "Thumper Worm-Tremor Ring", loot: "Water-of-Life Cistern", c1: "#ff6d00", c2: "#40c4ff" },
  { id: 4, name: "Star-Citadel", worlds: ["Wolf-359", "Bajor Sector", "Caprica Orbit", "Omega Relay", "Citadel Core"],
    bg: "#0a1422", grid: "#142640", tall: "Warp Plasma Conduit", low: "Trinium Deflector Node",
    decor: "Subspace Sensor Dish", haz: "Antimatter Containment Leak", loot: "Starfleet Replicator Chest", c1: "#ffab00", c2: "#00e5ff" },
  { id: 5, name: "Xeno-Drop", worlds: ["Hadley's Hope", "LV-426", "Klendathu", "Reach Spire", "Argent D'Nur"],
    bg: "#091710", grid: "#122d20", tall: "Biomechanical Hive Spire", low: "Ovomorph Egg Pod",
    decor: "Steaming Acid Grate", haz: "Pressurized Acid Pool", loot: "Weyland-Yutani Drop-Crate", c1: "#00e676", c2: "#cddc39" },
  { id: 6, name: "Grimdark-40K", worlds: ["Cadia Gate", "Armageddon", "Mars Forge", "Necron Tomb", "Eye of Terror"],
    bg: "#180b10", grid: "#2c141d", tall: "Gothic Cathedral Buttress", low: "Promethium Fuel Drum",
    decor: "Purity Seal Shrine", haz: "Warp-Fire Corruption Rift", loot: "Reliquary Munitorum Chest", c1: "#ff1744", c2: "#ffd700" },
  { id: 7, name: "Cyber-Waste", worlds: ["Mega-City", "Skynet Core", "Night-City", "Glowing Sea", "Fury Road"],
    bg: "#07101c", grid: "#0f2238", tall: "Holo-Billboard Pylon", low: "Crushed Chrome Chassis",
    decor: "Sparking Fiber Conduit", haz: "EMP Blackwall Glitch Zone", loot: "Vault-Tec Supply Locker", c1: "#00ff66", c2: "#ff00aa" },
  { id: 8, name: "Lab-Vortex", worlds: ["Sector-C", "Xen Border", "Skaro Trench", "Zebes Depth", "Gallifrey"],
    bg: "#120c22", grid: "#22183e", tall: "Xen Resonance Prism", low: "Weighted Companion Crate",
    decor: "Temporal Crack Conduit", haz: "Resonance Cascade Anomaly", loot: "Aperture Testing Receptacle", c1: "#ff9100", c2: "#aa00ff" },
  { id: 9, name: "Eldritch-Ronin", worlds: ["Kaer Morhen", "Innsmouth Reef", "Bonefields", "Venge Crater", "R'lyeh"],
    bg: "#101619", grid: "#1d282d", tall: "Leviathan Bone Rib", low: "Runic Place-of-Power",
    decor: "Bioluminescent Void Frond", haz: "Orbital Venge Laser Scorch", loot: "Ancient Meitou Relic Box", c1: "#b388ff", c2: "#80cbc4" }
];

/* === 4. ALL 20 PASSIVE MATRIX UPGRADES (Levels 1-5) === */
const PASSIVES = [
  ["Kyber Power Cell", "+15% All Damage", "dmg", 0.15],
  ["Naquadah Capacitor", "-10% Weapon Cooldown", "cdr", 0.10],
  ["Holtzman Amplifier", "+18% Weapon Area", "area", 0.18],
  ["Beskar Alloy Weave", "+2 Flat Armor", "arm", 2],
  ["Bacta Nanite Injector", "+1.2 HP/s Regeneration", "reg", 1.2],
  ["Subspace Grav-Magnet", "+35% Orb Pickup Radius", "mag", 0.35],
  ["Spice Melange Vial", "+12% Move Speed", "spd", 0.12],
  ["Omnissiah Multi-Loader", "+1 Extra Projectile", "cnt", 1],
  ["Chrono-Stasis Coil", "+22% Effect Duration", "dur", 0.22],
  ["Tachyon Accelerator", "+25% Projectile Speed", "pspd", 0.25],
  ["Targeting Visor", "+10% Crit Chance", "crit", 0.10],
  ["Focused Plasma Lens", "+30% Crit Damage", "cdmg", 0.30],
  ["Tungsten Sabot Core", "+1 Projectile Pierce", "prc", 1],
  ["Symbiote Vitae Sac", "+25% Max Health", "hp", 0.25],
  ["Neural XP Synthesizer", "+20% Experience Gain", "xp", 0.20],
  ["Dark Matter Extractor", "+25% Boss DM Yield", "dm", 0.25],
  ["Repulsor Field Coil", "+30% Knockback Force", "kb", 0.30],
  ["Cryo-Coolant Vent", "Attacks Slow Enemies 15%", "slow", 0.15],
  ["Corrosive Acid Coat", "Shreds +15% Enemy Armor", "shred", 0.15],
  ["Resurrection Beacon", "+1 Extra Revival (50% HP)", "rev", 1]
];

/* === 5. 10 DARK MATTER PERMANENT UPGRADES === */
const META_UPG = [
  ["Might", "+10% Base Damage", 2], ["Armor", "+1 Flat Armor", 2],
  ["Vitality", "+15% Base Max HP", 1], ["Recovery", "+0.6 HP/s Regen", 2],
  ["Haste", "-6% Weapon Cooldown", 3], ["Area", "+12% Base Area", 2],
  ["Swiftness", "+8% Move Speed", 1], ["Magnet", "+25% Pickup Radius", 1],
  ["Critical", "+5% Crit Chance", 2], ["Greed", "+20% XP & DM Gain", 3]
];

/* === 6. 50 PROCEDURAL STAGES === */
const STAGE_DATA = [
  ["Sun-Baked Dune Sea", "Dust Gusts"], ["Rust-Canyon Scrapyard", "Falling Debris"],
  ["Moisture Spire Outpost", "Shock Pylons"], ["Smuggler Cantina Basin", "Crossfire Turrets"],
  ["Twin-Sun Salt Flats", "Heat Mirage"], ["Sub-Surface Sand Tunnels", "Cave-In Rings"],
  ["Abandoned Mining Rig", "Plasma Vents"], ["Bandit Badlands Ridge", "Sniper Lasers"],
  ["Ancient Obelisk Ruins", "Gravity Wells"], ["Frontier Command Citadel", "Orbital Strikes"],
  ["Cryo-Glacier Trench", "Slippery Ice"], ["Blizzard Relay Station", "Frostbite Fog"],
  ["Frozen Hangar Bay", "Cryo Barrels"], ["Ice-Crystalline Cavern", "Shatter Spikes"],
  ["Sub-Zero Thermal Core", "Freeze Waves"], ["Bioluminescent Swamp", "Acid Bog Pools"],
  ["Spore-Choked Jungle", "Toxic Spores"], ["Sunken Temple Marsh", "Quicksand Vortex"],
  ["Xeno-Resin Hive Nest", "Brood Egg Pods"], ["Hive-Mother Chamber", "Acid Geysers"],
  ["Neon Slum Undercity", "Arc Conduits"], ["Mag-Lev Transit Grid", "Speeding Trains"],
  ["Cyber-Foundry Smelter", "Molten Slag"], ["Drone Assembly Matrix", "Laser Grids"],
  ["AI Mainframe Spire", "EMP Pulses"], ["Sulfur Lava River", "Magma Eruptions"],
  ["Obsidian Tek-Fortress", "Fire Tornadoes"], ["Tectonic Refinery Bridge", "Thermal Venting"],
  ["Ash-Storm Caldera", "Meteor Showers"], ["High-Ground Lava Throne", "Dual Magma Waves"],
  ["Derelict Frigate Hull", "Low-G Drift"], ["Breached Reactor Deck", "Radiation Pulses"],
  ["Hydroponics Bio-Dome", "Mutant Tendrils"], ["Warp-Core Engine Room", "Plasma Arcs"],
  ["Flagship Command Bridge", "Broadside Lasers"], ["Asteroid Trench Run", "Drifting Boulders"],
  ["Orbital Defense Ring", "Ion Cannon Sweep"], ["Dyson Swarm Collector", "Solar Flares"],
  ["Ghost Armada Graveyard", "Proximity Mines"], ["Superweapon Trench Core", "Mega-Beam Sweep"],
  ["Temporal Rift Horizon", "Time-Dilation"], ["Non-Euclidean Labyrinth", "Warp Portals"],
  ["Black-Hole Accretion Disk", "Singularities"], ["Quantum Foam Anomaly", "Phase Hazards"],
  ["Ascended Astral Sanctuary", "Solar Rings"], ["Entropy Cascade Sector", "Void Lightning"],
  ["Multiverse Convergence Hub", "Boss Rifts"], ["Omega Singularity Gate", "Gravity Crush"],
  ["Throne of the Architects", "Laser Matrix"], ["The 51st Echo (Final Nexus)", "All-Biome Shift"]
];

const STAGES = STAGE_DATA.map((d, i) => ({
  id: i + 1,
  suffix: d[0],
  hazard: d[1],
  tier: Math.floor(i / 10),
  hpMul: +(1 + i * 0.38).toFixed(2),
  dmDrop: i === 49 ? 50 : Math.max(1, Math.floor((i + 1) / 3) + 1)
}));
