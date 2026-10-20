// FILE: js/data-heroes.js
// PART: 7 of 14
// DETAIL: 55 Playable Heroes (#00-#54 including Baba Yaga, Man With No Name, Last-Stand Vet, Slav-1 Tracker), Utility Skill specs, and Boss Kill One-Liners.

"use strict";

/* === 1. 55 MULTIVERSE HEROES (#00-#54) ===
   [id, fac, cost, HeroName, WeaponName, SuperchargeName, Style, PassiveName, PassiveSpec] */
const CHAR_RAW = [
  [0, 0, 0, "Aether-Blade Initiate", "Cyan Plasma Saber", "Twin-Sun Saber Vortex", "orbit", "Force Reflex", "+15% Move Speed & +25% Orb Magnet"],
  [1, 0, 3, "Beskar Creed Tracker", "Whistling Micro-Darts", "Darksaber Phoenix Salvo", "missile", "Beskar Plating", "+4 Flat Armor & -20% Damage Taken"],
  [2, 0, 2, "Imperial White-Trooper", "E-Series Scatter Blaster", "Garrison Overwatch", "cone", "Suppressive Scatter", "+35% Fire Rate & +1 Projectile"],
  [3, 0, 8, "Crimson Sith Sovereign", "Dark Chain Lightning", "Unlimited Tempest Web", "chain", "Dark Hate Conduit", "+25% Crit Damage & Heals 1 HP per 15 Kills"],
  [4, 0, 4, "R2-Chirp Astro-Droid", "Electro-Prod & Slick", "Hacked Turret Grid", "nova", "Overclocked Servos", "-18% All Weapon Cooldowns"],
  [5, 0, 5, "Kashyyyk Bow-Roarer", "Quarrel Laser-Bow", "Thermal Detonator Volley", "cone", "Wookiee Rage", "+30% Max HP & +20% Weapon Area"],
  [6, 0, 5, "Corellian Kessel Runner", "Heavy DL-Blaster", "Freighter Orbital Strafe", "beam", "Shoots First", "+30% Crit Chance & +25% XP/DM Greed"],
  [7, 1, 12, "Anupas Jackal-Gold", "Eye of Ra Solar Ribbon", "Dakara Ascended Wave", "nova", "Half-Ascended Divinity", "+25% Damage, +1 Relic Slot & Solar Revive"],
  [8, 1, 4, "Chevron-1 Tac-Colonel", "AP-PDW Rapid Burst", "Stargate Kawoosh Vortex", "beam", "C4 Improviser", "+25% Projectile Speed & -12% Cooldown"],
  [9, 1, 5, "Serpent-Guard Prime", "Ma'Tok Plasma Staff", "Twin Staff & Zat Disintegrator", "missile", "Symbiote Regen", "+2.0 HP/s Regen & +20% Max HP"],
  [10, 1, 9, "Othala Grey Sage", "Asgard Ion Pulse", "O'Neill Orbital Pillar", "beam", "Beaming Phase", "+1 Relic Slot & Teleports from lethal hits (8s)"],
  [11, 1, 8, "Pegasus Hive Matron", "Bio-Web Stunner", "Culling Dart Squadron", "chain", "Life-Force Drain", "Heals 3 HP every 10 kills & slows foes"],
  [12, 1, 10, "Hallowed Origin Prior", "Origin Sacred Halo", "Supergate Inferno Nova", "orbit", "Hallowed Zeal", "+35% Area of Effect & +25% Duration"],
  [13, 2, 4, "Browncoat Captain", "Brass Frontier Six-Gun", "Crazy-Ivan Full Burn", "cone", "Aim to Misbehave", "+20% Speed & +35% Damage below 50% HP"],
  [14, 2, 9, "Miranda Psychic Dancer", "Whirling Crescent Blades", "Precog Blade Clones", "orbit", "Hands of Blue Evasion", "+30% Dodge Chance & +25% Crit Chance"],
  [15, 2, 5, "Canton Heavy Merc", "Vera Auto-Cannon", "Airlock Sonic Shell", "beam", "Hero of Canton", "+30% Might & +3 Armor"],
  [16, 2, 4, "Soaring Leaf Pilot", "Thruster Plasma Wash", "Shuttle Gun-Pod Drift", "orbit", "Leaf on the Wind", "+35% Move Speed & Hazard Resistance"],
  [17, 2, 7, "Reaver Blood-Harpooner", "Tethered Rip-Saw", "Reactor Meltdown Saws", "chain", "Core-Radiation Frenzy", "Up to +60% Fire Rate as HP drops"],
  [18, 3, 10, "Muad'Dib Sand-Prophet", "Crysknife Weirding Step", "Shai-Hulud Maker Eruption", "nova", "Prescience", "+25% Dodge & +30% Orb Magnet"],
  [19, 3, 6, "Sardaukar Executioner", "Holtzman Slow-Blade", "Subatomic Shield Lasgun", "beam", "Salusa Conditioning", "+30% Crit Damage & +2 Pierce"],
  [20, 3, 8, "Bene-Voice Matron", "The Voice Pitch Cone", "Kwisatz Mind-Crush", "cone", "Litany Against Fear", "Immune to Hazards & -15% Cooldown"],
  [21, 3, 7, "Harkonnen Hover-Baron", "Hunter-Seeker Needle", "Giedi Artillery Rain", "missile", "Suspensor Levitation", "Flies over Rocks/Hazards & +40% Greed"],
  [22, 4, 3, "Red-Shirt Commander", "Set-to-Vaporize Phaser", "Quantum Torpedo Array", "beam", "Plot-Armor Shield", "Survives lethal damage with 1 Revival"],
  [23, 4, 9, "Hive-Cube Assimilator", "Nanoprobe Tubules", "Tactical Cube Trench Beam", "chain", "Adaptive Shielding", "Taking damage grants +5 Armor for 5s"],
  [24, 4, 5, "Qo'noS Bat'leth Guard", "Crescent Bat'leth Spin", "Bird-of-Prey Decloak", "orbit", "Sto-Vo-Kor Bloodlust", "+1% Damage per 15 kills (up to +100%)"],
  [25, 4, 5, "Viper Starbuck-Ace", "KEW Flak Screen", "Battlestar Nuke Salvo", "nova", "Combat Thrusters", "+25% Move Speed & +1 Extra Projectile"],
  [26, 4, 6, "Centauri Cylon Raider", "Forearm Bayonet Volley", "Basestar Nuclear Swarm", "missile", "Resurrection Uplink", "+1 Extra Revival & +25% Proj Speed"],
  [27, 4, 8, "Spectre Biotic Vanguard", "Biotic Singularity", "Warp Supernova Detonation", "nova", "Mass Effect Barrier", "+35% Max HP & +25% Knockback"],
  [28, 5, 5, "Sulaco Smart-Gunner", "M56 Auto-Smartgun", "Sentry & Napalm Ring", "missile", "Motion Tracker Ping", "+35% Crit Chance & +20% Fire Rate"],
  [29, 5, 10, "Yautja Trophy Hunter", "Tri-Laser & Smart-Disc", "Wrist-Bracer Grid Nova", "orbit", "Active Camo Cloak", "+25% Dodge & +40% Crit Damage"],
  [30, 5, 9, "Acid-Blood Xeno-Queen", "Tail-Impaler Whip", "Royal Broodling Swarm", "cone", "Pressurized Acid Blood", "Enemies touching you take 80 Thorns Dmg"],
  [31, 5, 4, "Klendathu Drop-Trooper", "Morita Split-Rifle", "Tactical Mini-Nuke", "cone", "Live Forever", "+20% Fire Rate & +25% Area"],
  [32, 5, 8, "Mjolnir Spartan-117", "Sticky Plasma & Rifle", "Spartan Laser & Sword", "beam", "Mjolnir Energy Shield", "+2.5 HP/s Regen & +30% Area"],
  [33, 5, 12, "Praetor Crucible Slayer", "Super Shotgun Hook", "BFG-10000 Tendril Orb", "chain", "Rip & Tear Glory-Heal", "Kills within 90px heal 1.5 HP"],
  [34, 6, 7, "Astartes Chainsword", "Godwyn Bolter & Saw", "Exterminatus Lance", "cone", "Know No Fear", "+6 Flat Armor & +20% Might"],
  [35, 6, 8, "Omnissiah Tech-Magos", "Servo-Skull Beamer", "Noospheric Arc Hexagon", "orbit", "Machine Spirit Canticle", "+2 Projectiles, +1 Relic Slot & +25% Magnet"],
  [36, 6, 10, "Tomb-World Gauss Necron", "Emerald Gauss Flayer", "C'tan Tesseract Vault", "beam", "Reanimation Protocol", "+2.5 HP/s Regen & +1 Revival"],
  [37, 6, 6, "Waaagh Dakka Warboss", "Twin Big-Shoota", "Rokkit & Squig Storm", "cone", "More Dakka!", "+2 Extra Projectiles & +20% Move Speed"],
  [38, 6, 8, "Warp Psyker Inquisitor", "Purging Warp-Flame", "Astronomican Sun Nova", "nova", "Emperor's Tarot", "+25% Crit Chance & +30% Crit Damage"],
  [39, 7, 11, "Zion Bullet-Time One", "Telekinetic Bullet Wall", "Source-Code Decompiler", "nova", "There Is No Spoon", "+35% Dodge & -20% Cooldowns"],
  [40, 7, 7, "T-800 Endo-Enforcer", "40-Watt Plasma Rifle", "Time-Sphere Lightning", "beam", "Hyperalloy Chassis", "+50% Max HP & +6 Flat Armor"],
  [41, 7, 6, "Neon Origami Runner", "PKD Detonator Magnum", "Spinner Railgun Sweep", "missile", "Voight-Kampff Lock", "+50% Damage vs Bosses & +20% Crit"],
  [42, 7, 9, "Sandevistan Edgerunner", "Thermal Monowire Lash", "Cyberpsychosis Daemons", "chain", "Sandevistan Overdrive", "Bursts to 180% Speed & Rate every 6s"],
  [43, 7, 6, "Vault-Tec Wanderer", "Tri-Beam & Cap Mine", "MIRV Fat-Man Catapult", "nova", "V.A.T.S. Crit Lock", "Guaranteed Crit pulses every 4s"],
  [44, 7, 5, "V8 Chrome Interceptor", "Thunderstick Lance", "Doof-Wagon Fire Tornado", "orbit", "Witness Me! Nitro", "+35% Move Speed & +25% Area"],
  [45, 8, 8, "Black-Mesa Physicist", "Zero-Point Grav-Cannon", "Supercharged Gluon Beam", "beam", "HEV Morphine Suit", "+5 Armor & Immune to Floor Hazards"],
  [46, 8, 10, "Gallifrey Sonic Traveler", "Sonic Resonance Ring", "TARDIS Time Vortex", "nova", "Time-Lord Regeneration", "2 Revivals that boost all stats +20%"],
  [47, 8, 9, "Chozo Morph Hunter", "Wave-Ice-Plasma Beam", "Power-Bomb Hyper-Beam", "cone", "Screw-Attack Thrusters", "+25% Speed & Contact Dash Damage"],
  [48, 9, 7, "Silver-Sword Mutagen", "Igni Sign & Silver Whirl", "Quen-Yrden Storm", "orbit", "Trial of the Grasses", "+2 HP/s Regen & +25% Crit Chance"],
  [49, 9, 11, "R'lyeh Star Cultist", "Abyssal Tentacle Rift", "Great Cthulhu Singularity", "chain", "Non-Euclidean Madness", "Slows nearby enemies by 35% & +25% Area"],
  [50, 9, 15, "Kenshi-Moon Ronin", "Meitou Falling-Sun Slash", "Venge Orbital Beak-Storm", "orbit", "Toughness Conditioning", "Every hit taken grants +2 Max HP & +2% Might"],
  [51, 7, 14, "Baba Yaga Suit-Assassin", "Baba Yaga Backup Sidearm", "Continental Tactical Arsenal", "beam", "CQC Grapple-Flip-Execute", "Touching any enemy or Boss flips/stuns them & fires a lethal point-blank execution shot"],
  [52, 2, 14, "The Man With No Name", "Blazing Fan-Hammer Six-Shooter", "Deadeye Eight-Shooter", "cone", "High-Noon Deadeye", "Poncho gunslinger: blazing 6-shot right-hand bursts with lethal crit & 0.55s quick-reload"],
  [53, 5, 14, "Green-Beret Last-Stand Vet", "Belt-Fed M60 & Explosive Bow", "First Blood Firestorm", "cone", "Last-Stand Fortifier", "Staying within 180px for 120s (or Utility) deploys shoot-over Fort & Claymore mines"],
  [54, 0, 15, "Slav-1 Bounty Tracker", "Sawed-Stock EE-3 Carbine", "Disintegrations Authorized", "beam", "Mandalorian Arsenal", "Auto-Flamethrower when >=4 foes surround you + Fibercord Grapple Hook locks targets"]
];

/* === 2. HERO ACTIVE UTILITY SKILLS (With Radial Clock-Sweep Cooldowns) === */
function getHeroUtils(cid) {
  if (cid === 51) {
    return [
      { name: "Gun-Fu Takedown", cdMax: 7.5, cd: 0, type: "executeDash", icon: "beam", desc: "Flips & executes nearest enemies/bosses with point-blank headshots" },
      { name: "Blood Oath Marker", cdMax: 14.0, cd: 0, type: "critBurst", icon: "nova", desc: "Unleashes a 360-degree armor-piercing sidearm volley" }
    ];
  }
  if (cid === 52) {
    return [
      { name: "Fan-The-Hammer", cdMax: 6.5, cd: 0, type: "fanHammer", icon: "cone", desc: "Blazing 8-shot deadeye revolver fan across the horizon" },
      { name: "Squint Showdown", cdMax: 12.0, cd: 0, type: "stareFreeze", icon: "orbit", desc: "Freezes nearby enemies in their tracks for 3.5s" }
    ];
  }
  if (cid === 53) {
    return [
      { name: "Deploy Trap Fort", cdMax: 18.0, cd: 0, type: "buildFort", icon: "fort", desc: "Instantly erects a shoot-over sandbag fort & 6 claymore mines" },
      { name: "Explosive Arrow", cdMax: 8.0, cd: 0, type: "explosiveBow", icon: "missile", desc: "Fires a high-yield thermite arrow that detonates on impact" }
    ];
  }
  if (cid === 54) {
    return [
      { name: "Fibercord Grapple", cdMax: 8.5, cd: 0, type: "grappleHook", icon: "grapple", desc: "Locks down the strongest target/boss at distance until broken" },
      { name: "Wrist Flamethrower", cdMax: 7.0, cd: 0, type: "flameCone", icon: "flame", desc: "Incinerates surrounding enemies in a searing flame cone" }
    ];
  }
  const c = CHAR_RAW[cid] || CHAR_RAW[0];
  return [
    { name: c[7] + " Surge", cdMax: 10.0, cd: 0, type: "factionPulse", icon: c[6], desc: "Tactical utility shockwave that damages & knocks back nearby foes" }
  ];
}

/* === 3. BOSS & RIVAL KILL ONE-LINERS === */
const HERO_QUOTES = {
  0: "The Force will be with you. Always.",
  1: "This is the Way.",
  3: "Power! Unlimited power!",
  6: "Never tell me the odds!",
  8: "Indeed. Come on, that had to be at least a little fun.",
  13: "I aim to misbehave.",
  15: "Jayne, the man they call Jayne!",
  16: "I am a leaf on the wind... watch how I soar.",
  18: "Fear is the mind-killer.",
  23: "Resistance is futile.",
  24: "Today is a good day to die!",
  28: "Game over, man! Game over!",
  29: "If it bleeds, we can kill it.",
  31: "Come on you apes, you wanna live forever?!",
  32: "I need a weapon.",
  33: "Rip and tear, until it is done.",
  34: "For the Emperor!",
  39: "Whoa. I know Kung Fu.",
  40: "Hasta la vista, baby.",
  41: "All those moments will be lost in time, like tears in rain.",
  44: "Witness me! Shiny and chrome!",
  46: "Wibbly wobbly, timey wimey... stuff.",
  48: "Wind's howling.",
  51: "Yeah... I'm thinking I'm back.",
  52: "You see, in this world there's two kinds of people, my friend...",
  53: "To survive a war, you gotta become war.",
  54: "He's no good to me dead."
};

const FACTION_QUOTES = [
  "Another bounty claimed in the Outer Rim.",
  "Chevron Seven locked. Target eliminated.",
  "Can't stop the signal, Mal.",
  "The Spice must flow.",
  "Target neutralized. Klingon honor satisfied.",
  "Bug hunt complete. Area secure.",
  "Purged in holy promethium!",
  "Flatlined in the neon sprawl.",
  "Resonance cascade contained.",
  "The cosmos claims another wanderer."
];

function getBossQuote(cid, facId) {
  return HERO_QUOTES[cid] || FACTION_QUOTES[facId] || "Target eliminated.";
}
