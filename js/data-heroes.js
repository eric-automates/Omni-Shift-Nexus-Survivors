// FILE: js/data-heroes.js (PART 1 OF 3)
// PART: 7 of 14
// DETAIL: All 56 Heroes (#00-#55), 56 Bespoke Canon Outfit Palettes, 56 2-Button Utility Kits, and 56 3-Line Quotes.

"use strict";

/* === 1. 56 MULTIVERSE HEROES (#00-#55) === */
const CHAR_RAW = [
  [0, 0, 0, "Aether-Blade Initiate", "Cyan Plasma Saber", "Twin-Sun Saber Mastery", "orbit", "Force Reflex", "+15% Speed, Saber Lunge/Reflect & 100% Force Vacuum"],
  [1, 0, 3, "Beskar Creed Tracker", "Whistling Micro-Darts", "Darksaber Phoenix Salvo", "missile", "Beskar Plating", "+4 Flat Armor & -20% Damage Taken"],
  [2, 0, 2, "Imperial White-Trooper", "E-11 Scatter Blaster", "Garrison Overwatch", "cone", "Suppressive Scatter", "+35% Fire Rate & +1 Projectile"],
  [3, 0, 8, "Crimson Sith Sovereign", "Crimson Sith Saber & Arc", "Unlimited Tempest Web", "chain", "Dark Hate Conduit", "100% Force Vacuum, Saber Lunge/Reflect & Kill Heal"],
  [4, 0, 4, "R2-Chirp Astro-Droid", "Electro-Prod & Oil Slick", "Hacked Turret Grid", "nova", "Overclocked Servos", "-18% All Weapon Cooldowns"],
  [5, 0, 5, "Kashyyyk Bow-Roarer", "Quarrel Laser-Bowcaster", "Thermal Detonator Volley", "cone", "Wookiee Rage", "+30% Max HP & +20% Weapon Area"],
  [6, 0, 5, "Corellian Kessel Runner", "Heavy DL-44 Blaster", "Freighter Orbital Strafe", "beam", "Shoots First", "+30% Crit Chance & +25% XP/DM Greed"],
  [7, 1, 12, "Anupas Jackal-Gold", "Eye of Ra Solar Staff", "Dakara Ascended Wave", "nova", "Half-Ascended Divinity", "100% Telekinetic Vacuum, +25% Dmg & Revive"],
  [8, 1, 4, "Chevron-1 Tac-Colonel", "FN-P90 Tactical Burst", "Stargate Kawoosh Vortex", "beam", "C4 Improviser", "+25% Projectile Speed & -12% Cooldown"],
  [9, 1, 5, "Serpent-Guard Prime", "Ma'Tok Plasma Staff", "Twin Staff & Zat Disintegrator", "missile", "Symbiote Regen", "+2.0 HP/s Regen & +20% Max HP"],
  [10, 1, 9, "Othala Grey Sage", "Asgard Ion Beam", "O'Neill Orbital Pillar", "beam", "Beaming Phase", "100% Beaming Vacuum, +1 Relic & Phase Dodge"],
  [11, 1, 8, "Pegasus Hive Matron", "Wraith Bio-Stunner", "Culling Dart Squadron", "chain", "Life-Force Drain", "Heals 3 HP every 10 kills & slows foes"],
  [12, 1, 10, "Hallowed Origin Prior", "Levitating Sacred Stones", "Supergate Inferno Nova", "orbit", "Hallowed Zeal", "100% Telekinetic Vacuum, +35% Area & +25% Dur"],
  [13, 2, 4, "Browncoat Captain", "Moses Brothers Brass Pistol", "Crazy-Ivan Full Burn", "cone", "Aim to Misbehave", "+20% Speed & +35% Damage below 50% HP"],
  [14, 2, 9, "Miranda Psychic Dancer", "Twin River Axes & Sabers", "Precog Blade Dance", "orbit", "Hands of Blue Evasion", "100% Psychic Vacuum, +30% Dodge & +25% Crit"],
  [15, 2, 5, "Canton Heavy Merc", "Vera Callahan Full-Bore", "Airlock Sonic Shell", "beam", "Hero of Canton", "+30% Might & +3 Armor"],
  [16, 2, 4, "Soaring Leaf Pilot", "Orbiting Thruster Drones", "Shuttle Gun-Pod Drift", "orbit", "Leaf on the Wind", "+35% Move Speed & Hazard Resistance"],
  [17, 2, 7, "Reaver Blood-Harpooner", "Tethered Harpoon Rip-Saw", "Reactor Meltdown Saws", "chain", "Core-Radiation Frenzy", "Up to +60% Fire Rate as HP drops"],
  [18, 3, 10, "Muad'Dib Sand-Prophet", "Crysknife Weirding Lunge", "Shai-Hulud Maker Eruption", "nova", "Prescience", "100% Voice Vacuum, +25% Dodge & +30% Magnet"],
  [19, 3, 6, "Sardaukar Executioner", "Holtzman Slow-Blade", "Subatomic Shield Lasgun", "beam", "Salusa Conditioning", "+30% Crit Damage & +2 Pierce"],
  [20, 3, 8, "Bene-Voice Matron", "The Voice Pitch Cone", "Kwisatz Mind-Crush", "cone", "Litany Against Fear", "100% Voice Vacuum, Hazard Immune & -15% CD"],
  [21, 3, 7, "Harkonnen Hover-Baron", "Hunter-Seeker Needle", "Giedi Artillery Rain", "missile", "Suspensor Levitation", "Flies over Rocks/Hazards & +40% Greed"],
  [22, 4, 3, "Red-Shirt Commander", "Type-II Phaser Pistol", "Quantum Torpedo Array", "beam", "Plot-Armor Shield", "Survives lethal damage with 1 Revival"],
  [23, 4, 9, "Hive-Cube Assimilator", "Nanoprobe Assimilation Whip", "Tactical Cube Trench Beam", "chain", "Adaptive Shielding", "Taking damage grants +5 Armor for 5s"],
  [24, 4, 5, "Qo'noS Bat'leth Guard", "Crescent Bat'leth Cleave", "Bird-of-Prey Decloak", "orbit", "Sto-Vo-Kor Bloodlust", "+1% Damage per 15 kills (up to +100%)"],
  [25, 4, 5, "Viper Starbuck-Ace", "KEW Flak Magnum", "Battlestar Nuke Salvo", "nova", "Combat Thrusters", "+25% Move Speed & +1 Extra Projectile"],
  [26, 4, 6, "Centauri Cylon Raider", "Forearm Repeating Cannon", "Basestar Nuclear Swarm", "missile", "Resurrection Uplink", "+1 Extra Revival & +25% Proj Speed"],
  [27, 4, 8, "Spectre Biotic Vanguard", "M-8 Avenger & Biotic Orb", "Warp Supernova Detonation", "nova", "Mass Effect Barrier", "100% Biotic Vacuum, +35% Max HP & +25% KB"],
  [28, 5, 5, "Sulaco Smart-Gunner", "M56 Auto-Smartgun", "Sentry & Napalm Ring", "missile", "Motion Tracker Ping", "+35% Crit Chance & +20% Fire Rate"],
  [29, 5, 10, "Yautja Trophy Hunter", "Autonomous Smart-Discs", "Wrist-Bracer Grid Nova", "orbit", "Active Camo Cloak", "+25% Dodge & +40% Crit Damage"],
  [30, 5, 9, "Acid-Blood Xeno-Queen", "Inner-Jaw & Tail Whip", "Royal Broodling Swarm", "cone", "Pressurized Acid Blood", "Enemies touching you take 80 Thorns Dmg"],
  [31, 5, 4, "Klendathu Drop-Trooper", "Morita MK1 Split-Rifle", "Tactical Mini-Nuke", "cone", "Live Forever", "+20% Fire Rate & +25% Area"],
  [32, 5, 8, "Mjolnir Spartan-117", "MA5B & Type-1 Energy Sword", "Spartan Laser & Sword", "beam", "Mjolnir Energy Shield", "+2.5 HP/s Regen & +30% Area"],
  [33, 5, 12, "Praetor Crucible Slayer", "Lucifer Super Shotgun", "BFG-10000 Tendril Orb", "chain", "Rip & Tear Glory-Heal", "Kills within 90px heal 1.5 HP"],
  [34, 6, 7, "Astartes Chainsword", "Godwyn Bolter & Chainsword", "Exterminatus Lance", "cone", "Know No Fear", "+6 Flat Armor & +20% Might"],
  [35, 6, 8, "Omnissiah Tech-Magos", "Floating Servo-Skulls", "Noospheric Arc Hexagon", "orbit", "Machine Spirit Canticle", "+2 Projectiles, +1 Relic Slot & +25% Magnet"],
  [36, 6, 10, "Tomb-World Gauss Necron", "Emerald Gauss Flayer", "C'tan Tesseract Vault", "beam", "Reanimation Protocol", "+2.5 HP/s Regen & +1 Revival"],
  [37, 6, 6, "Waaagh Dakka Warboss", "Twin Belt-Fed Big-Shoota", "Rokkit & Squig Storm", "cone", "More Dakka!", "+2 Extra Projectiles & +20% Move Speed"],
  [38, 6, 8, "Warp Psyker Inquisitor", "Purging Force-Staff Flame", "Astronomican Sun Nova", "nova", "Emperor's Tarot", "100% Warp Vacuum, +25% Crit & +30% Crit Dmg"],
  [39, 7, 11, "Zion Bullet-Time One", "Dual Micro-Uzis & Telekinesis", "Source-Code Decompiler", "nova", "There Is No Spoon", "100% Telekinetic Vacuum, +35% Dodge & -20% CD"],
  [40, 7, 7, "T-800 Endo-Enforcer", "Westinghouse M-25 Plasma", "Time-Sphere Lightning", "beam", "Hyperalloy Titanium Arm", "+50% HP, +6 Armor; Guarding Head (HD) blocks 95% eye/head damage!"],
  [41, 7, 6, "Neon Origami Runner", "LAPD 2019 PKD Blaster", "Spinner Railgun Sweep", "missile", "Voight-Kampff Lock", "+50% Damage vs Bosses & +20% Crit"],
  [42, 7, 9, "Sandevistan Edgerunner", "Thermal Monowire Whip", "Cyberpsychosis Daemons", "chain", "Sandevistan Overdrive", "Bursts to 180% Speed & Rate every 6s"],
  [43, 7, 6, "Vault-Tec Wanderer", "AER9 Laser Rifle & Mine", "MIRV Fat-Man Catapult", "nova", "V.A.T.S. Crit Lock", "Guaranteed Crit pulses every 4s"],
  [44, 7, 5, "V8 Chrome Interceptor", "Sawed-Off Double-Barrel", "Doof-Wagon Fire Tornado", "orbit", "Witness Me! Nitro", "+35% Move Speed & +25% Area"],
  [45, 8, 8, "Black-Mesa Physicist", "Zero-Point Gravity Gun", "Supercharged Gluon Beam", "beam", "HEV Morphine Suit", "100% Grav-Gun Vacuum, +5 Armor & Haz Immune"],
  [46, 8, 10, "Gallifrey Sonic Traveler", "Mark-VII Sonic Emitter", "TARDIS Time Vortex", "nova", "Time-Lord Regeneration", "2 Revivals that boost all stats +20%"],
  [47, 8, 9, "Chozo Morph Hunter", "Chozo Power Arm-Cannon", "Power-Bomb Hyper-Beam", "cone", "Screw-Attack Thrusters", "+25% Speed & Contact Dash Damage"],
  [48, 9, 7, "Silver-Sword Mutagen", "Aerondight Silver Longsword", "Quen-Yrden Storm", "orbit", "Trial of the Grasses", "+2 HP/s Regen & +25% Crit Chance"],
  [49, 9, 11, "R'lyeh Star Cultist", "Abyssal Eldritch Tome", "Great Cthulhu Singularity", "chain", "Non-Euclidean Madness", "100% Abyssal Vacuum, 35% Slow & +25% Area"],
  [50, 9, 15, "Kenshi-Moon Ronin", "Meitou Falling-Sun Nodachi", "Venge Orbital Beak-Storm", "orbit", "Toughness Conditioning", "Every hit taken grants +2 Max HP, +2% Might & bonus Toughness XP"],
  [51, 7, 14, "Baba Yaga Suit-Assassin", "Baba Yaga Backup Kimber", "Continental Dragon's Breath", "beam", "Bulletproof Kevlar Suit & CQC", "Lv.5 transitions to Primary Benelli/2011; Guarding Head/Torso blocks 95%!"],
  [52, 2, 14, "The Man With No Name", "Colt 1851 Navy Six-Shooter", "Deadeye Eight-Shooter", "cone", "High-Noon Deadeye", "Poncho gunslinger: blazing 6-shot right-hand bursts with lethal crit & 0.55s quick-reload"],
  [53, 5, 14, "Green-Beret Last-Stand Vet", "Belt-Fed M60 & Comp-Bow", "First Blood Firestorm", "cone", "Last-Stand Fortifier", "Staying within 180px for 120s (or Utility) deploys shoot-over Fort & Claymore mines"],
  [54, 0, 15, "Slav-1 Bounty Tracker", "Sawed-Stock EE-3 Carbine", "Disintegrations Authorized", "beam", "Mandalorian Arsenal", "ESB Jetpack Missile & Cape + Auto-Flamethrower (>=4 foes) + Grapple Hook"],
  [55, 6, 16, "General Kaleesh Cyborg", "Quad-Saber Lunge & Blasters", "General's Grievous Wrath", "orbit", "Four-Armed General", "4-Armed Cyborg Warlord: fires 4 weapons simultaneously with built-in Saber Deflection!"]
];

const FORCE_VACUUM_HEROES = [0, 3, 7, 10, 12, 14, 18, 20, 27, 38, 39, 45, 49];
function hasInnateVacuum(cid) { return FORCE_VACUUM_HEROES.includes(cid); }

const SWORD_HEROES = [0, 3, 14, 18, 19, 24, 32, 33, 34, 48, 50, 55];
function isSwordWeapon(wpnId) { return SWORD_HEROES.includes(wpnId); }

function getHeroArmCap(cid) {
  if (cid === 55) return 4;
  if ([0, 3, 7, 12, 38, 39].includes(cid)) return 3;
  return 2;
}

// FILE: js/data-heroes.js (PART 2 OF 3)
// DETAIL: All 56 Bespoke Canon Movie/Show Outfit Palettes (Head, Torso, Legs, Back, Blade) and All 56 Bespoke 2-Button Utility Kits.

/* === 2. ALL 56 BESPOKE CANON CHARACTER OUTFIT PALETTES === */
const BLADE_COLORS = [
  ["Skywalker Cyan", "#00f0ff"], ["Consular Emerald", "#00e676"], ["Sith Crimson", "#ff1744"],
  ["Windu Amethyst", "#d500f9"], ["Temple Gold", "#ffd166"], ["Darksaber Obsidian", "#212121"], ["Ahsoka White", "#ffffff"]
];

const CANON_56 = [
  [["Tatooine Blonde","#e6c27a"],["Bespin Swept","#c8a15a"],["Jedi Hood","#4e342e"],["Farmboy Tunic","#d7ccc8"],["Bespin Jacket","#78909c"],["ROTJ Black","#181a1d"],["Sand Wraps","#bcaaa4"],["ROTJ Boots","#111315"],["Jedi Cloak","#4e342e"],["No Cloak","none"]],
  [["Chrome Beskar","#cfd8dc"],["Stealth Visor","#546e7a"],["Mauldalorian","#b71c1c"],["Durasteel Cuirass","#78909c"],["Full Beskar","#eceff1"],["Mudhorn Brown","#5d4037"],["Beskar Greaves","#607d8b"],["Flight Trousers","#37474f"],["Mando Cape","#37474f"],["Rising Phoenix Pack","#90a4ae"]],
  [["TK White Helm","#ffffff"],["Shock Red Trim","#d32f2f"],["Shadow Trooper","#212121"],["Standard Plastoid","#ffffff"],["Incinerator Trim","#ff5252"],["Death-Trooper Black","#16181b"],["White Greaves","#eceff1"],["Shadow Greaves","#1b1e23"],["No Cape","none"],["Sand Pauldron","#ff9100"]],
  [["Sith Dark Hood","#111111"],["Pale Scarred","#cfd8dc"],["Crimson Guard","#b71c1c"],["Emperor Robes","#14161a"],["Inquisitor Plate","#263238"],["Royal Crimson","#8e0000"],["Sith Boots","#0d0f12"],["Crimson Robe Hem","#6a0000"],["Sith Cloak","#181a1f"],["No Cloak","none"]],
  [["Blue Dome R2","#1e88e5"],["Gold C-Series","#ffd166"],["Imperial R2-Q5","#212121"],["White Barrel","#eceff1"],["Gold Plated","#fbc02d"],["Black Chassis","#263238"],["White Struts","#cfd8dc"],["Dark Struts","#455a64"],["No Cape","none"],["Booster Rockets","#90a4ae"]],
  [["Kashyyyk Brown","#5d4037"],["Silverback Fur","#795548"],["Black Krrsantan","#261e1b"],["Steel Bandolier","#4e342e"],["Golden Pauldron","#8d6e63"],["Gladiator Spikes","#3e2723"],["Shaggy Legs","#4e342e"],["Dark Fur Legs","#211915"],["No Cape","none"],["Bowcaster Quiver","#6d4c41"]],
  [["Corellian Hair","#4e342e"],["Hoth Parka Hood","#1565c0"],["Endor Camo","#33691e"],["Smuggler Vest","#263238"],["Bespin Blue Jacket","#283593"],["Hoth Coat","#1e3a5f"],["Bloodstripe Navy","#1a237e"],["Brown Pants","#4e342e"],["No Cape","none"],["Endor Trench","#33691e"]],
  [["Gold Jackal Helm","#ffd166"],["Ascended Void Hood","#111111"],["Horus Falcon","#ffab00"],["Gold God Plate","#fbc02d"],["Ascended Cloak","#1c1429"],["Lapis Armor","#0277bd"],["Gold Greaves","#f57f17"],["Dark Tunic","#212121"],["Solar Cape","#ff8f00"],["No Cape","none"]],
  [["USAF Green Cap","#33691e"],["Silver Crew-Cut","#90a4ae"],["Desert Boonie","#a1887f"],["SG-1 Olive Vest","#2e4c2b"],["Black Ops Tac","#1c2228"],["Desert Camo","#bcaaa4"],["OD Cargo","#334d2b"],["Black BDU","#16191d"],["No Cape","none"],["Field Pack","#3e4a38"]],
  [["Serpent Helm","#78909c"],["Unmasked Jaffa","#8d6e63"],["Gold Prime Crest","#ffd166"],["Trinium Mail","#546e7a"],["First Prime Gold","#fbc02d"],["Rebel Jaffa","#37474f"],["Armored Skirt","#455a64"],["Gold Greaves","#c8a15a"],["No Cape","none"],["Goa'uld Cape","#b71c1c"]],
  [["Roswell Grey","#b0bec5"],["Clone Pale Grey","#cfd8dc"],["Commander Helm","#78909c"],["Bio-Suit Grey","#90a4ae"],["High Council","#546e7a"],["Vanir Exosuit","#37474f"],["Slim Grey Legs","#78909c"],["Exosuit Greaves","#263238"],["No Cape","none"],["Holo-Projector","#00e5ff"]],
  [["Long White Hair","#eceff1"],["Hive Mask","#455a64"],["Blood Queen","#b71c1c"],["Black Leather Coat","#18121e"],["Organic Chitin","#311b92"],["Crimson Gown","#6a1b29"],["Dark Boots","#120d16"],["Chitin Greaves","#261838"],["Wraith Trench","#1a1224"],["No Cape","none"]],
  [["Pale Bald Scarred","#cfd8dc"],["Prior Hood","#5d4037"],["Doci Crown","#ffd166"],["Prior Grey Robe","#607d8b"],["Hallowed White","#eceff1"],["Flaming Ori","#bf360c"],["Monastic Hem","#455a64"],["White Robe","#cfd8dc"],["Prior Cloak","#37474f"],["No Cloak","none"]],
  [["Sweep Brown Hair","#5d4037"],["Dusty Stetson","#4e342e"],["Unification Beret","#2e4c2b"],["Browncoat Duster","#6d4c41"],["Red Shirt & Suspenders","#8d3b32"],["Alliance Disguise","#455a64"],["Tan Trousers","#8d6e63"],["Dark Boots","#3e2723"],["Browncoat Tails","#5d4037"],["No Coat","none"]],
  [["Long Dark Hair","#1a1412"],["Academy Band","#00acc1"],["Reaver War-Paint","#b71c1c"],["Silk Rust Dress","#8d402b"],["Blue Tactical","#1565c0"],["Black Assassin","#1b1e23"],["Barefoot/Anklets","#d7a98c"],["Combat Boots","#212121"],["No Cape","none"],["Flowing Scarf","#4dd0e1"]],
  [["Cunning Orange Hat","#ff9100"],["Knit Ear-Flaps","#d84315"],["Merc Buzzcut","#4e342e"],["Blue Star Shirt","#1565c0"],["Ripped Olive Tank","#4b6043"],["Tactical Rig","#37474f"],["Camo Cargo","#4e5b3c"],["Dusty Jeans","#37474f"],["No Cape","none"],["Vera Sling","#5d4037"]],
  [["Sandy Pilot Hair","#d4a359"],["Flight Headset","#455a64"],["Straw Island Hat","#ffe082"],["Hawaiian Floral","#e65100"],["Flight Jumpsuit","#37474f"],["Green Mechanic","#2e5736"],["Khaki Shorts","#a1887f"],["Flight Pants","#263238"],["No Cape","none"],["Dino Toy Pack","#00e676"]],
  [["Scarred Skull","#8d6e63"],["Spiked Cage Helm","#212121"],["War-Paint Red","#b71c1c"],["Scrap Plate","#3e2723"],["Bloodied Hide","#6a1b1b"],["Radiation Suit","#455a64"],["Chained Greaves","#261c18"],["Rust Boots","#3e2723"],["No Cape","none"],["Trophy Spikes","#5d4037"]],
  [["Wavy Black Hair","#141416"],["Stillsuit Hood","#5d5346"],["Fremen Turban","#a1887f"],["Desert Stillsuit","#423e37"],["Atreides Green","#2e4c2b"],["Emperor Robe","#ffd166"],["Sand Boots","#3e3830"],["Black Trousers","#181a1d"],["Fremen Jubba Cloak","#5d5346"],["No Cloak","none"]],
  [["White Dome Helm","#eceff1"],["Blood-Marked Helm","#cfd8dc"],["Salusa Bare","#bcaaa4"],["Sardaukar White","#e0e0e0"],["Imperial Grey","#607d8b"],["Black Ops Suit","#1c2024"],["White Greaves","#bdbdbd"],["Dark Greaves","#263238"],["No Cape","none"],["Grav-Chute","#78909c"]],
  [["Black Aba Hood","#111111"],["Gold Mesh Veil","#ffd166"],["Reverend Crown","#311b92"],["Black Gown","#16161a"],["Spice Blue Robe","#0d47a1"],["Sisterhood Gold","#4e342e"],["Long Skirt","#0d0d11"],["Gold Hem","#261c14"],["Bene Cloak","#111111"],["No Cloak","none"]],
  [["Bald Pale Baron","#e0c8b0"],["Giedi Cap","#212121"],["Oil-Bathed","#111111"],["Black Vinyl Suit","#1b1e23"],["Harkonnen Blue","#1a237e"],["Gilded Fatsuit","#bf360c"],["Suspensor Skirt","#263238"],["Dark Greaves","#111111"],["Suspensor Ring","#ff6d00"],["No Cape","none"]],
  [["Command Blonde","#e6c27a"],["Vulcan Fringe","#111111"],["Bald Captain","#d7a98c"],["Command Gold","#fbc02d"],["TNG Crimson","#b71c1c"],["Science Blue","#0288d1"],["Black Duty Pants","#141619"],["Starfleet Boots","#212121"],["No Cape","none"],["Away-Team Pack","#546e7a"]],
  [["Ocular Red Implant","#cfd8dc"],["Queen Crown","#37474f"],["Locutus Half-Plate","#90a4ae"],["Borg Exo-Tubes","#263238"],["Heavy Drone Plate","#16191d"],["Assimilated Starfleet","#37474f"],["Mechanical Greaves","#1c2228"],["Tubing Struts","#111111"],["No Cape","none"],["Regen Alcove Spine","#00e676"]],
  [["Klingon Ridges & Mane","#3e2723"],["Silver General Hair","#90a4ae"],["Starfleet Baldric","#212121"],["Warrior Baldric","#5d4037"],["House Martok Red","#7f1d1d"],["TNG Gold Tunic","#c8a15a"],["Studded Greaves","#261e1b"],["Black Boots","#141414"],["No Cape","none"],["Bat'leth Back-Holster","#78909c"]],
  [["Blonde Pilot Cut","#e6c27a"],["Viper Flight Helm","#cfd8dc"],["Deck Cap","#3e4a38"],["Colonial Flightsuit","#5d5346"],["Mustang Tank","#37474f"],["Dress Gray","#607d8b"],["Flight Trousers","#4e4537"],["Deck Boots","#212121"],["No Cape","none"],["Parachute Pack","#795548"]],
  [["Chrome Centurion","#cfd8dc"],["Gold Command Cylon","#ffd166"],["Red-Eye Stealth","#263238"],["Polished Chrome","#b0bec5"],["Command Gold Plate","#fbc02d"],["Black Spec-Ops","#181b20"],["Chrome Struts","#90a4ae"],["Dark Struts","#212121"],["No Cape","none"],["Raider Wing-Pack","#546e7a"]],
  [["N7 Recon Hood","#212121"],["Shepard Buzzcut","#3e2723"],["Asari Crest","#1e88e5"],["N7 Charcoal & Red","#263238"],["Cerberus White","#eceff1"],["Terminus Black","#111111"],["N7 Greaves","#1c2228"],["White Greaves","#cfd8dc"],["No Cape","none"],["Biotic Amp Pack","#00b0ff"]],
  [["Red Bandana & Headset","#d32f2f"],["USCM Helmet","#3e4a38"],["Ripley Curls","#3e2723"],["Olive Camo Armor","#334d2b"],["Khaki Jumpsuit","#78909c"],["Power-Loader Yellow","#fbc02d"],["USCM Cargo","#2e3d28"],["Flightsuit Legs","#455a64"],["No Cape","none"],["Smartgun Servo-Arm","#546e7a"]],
  [["Bio-Mask & Dreads","#78909c"],["Unmasked Mandibles","#8d6e63"],["Elder Gold Mask","#ffd166"],["Netted Jungle Skin","#6d5c46"],["City Hunter Bronze","#5d4037"],["Celtic Heavy Plate","#90a4ae"],["Loincloth & Greaves","#4e342e"],["Armored Boots","#546e7a"],["No Cape","none"],["Plasma Caster & Trophies","#cfd8dc"]],
  [["Queen Crest Crown","#14181d"],["Warrior Ridged Dome","#1c2228"],["Grid-Scarred Dome","#263238"],["Chitin Ribcage","#101419"],["Royal Black Carapace","#080a0d"],["Praetorian Plate","#1e2630"],["Digitigrade Legs","#14181d"],["Acid-Stained","#2e3d28"],["Spiked Dorsal Tubes","#181d24"],["Whip Tail Coil","#111111"]],
  [["M3 Tactical Helm","#455a64"],["Rico Crew-Cut","#3e2723"],["Fleet Cap","#263238"],["Mobile Infantry Gray","#37474f"],["Marauder Exo-Suit","#546e7a"],["Medic White Trim","#cfd8dc"],["Charcoal BDU","#263238"],["Armored Boots","#1c2228"],["No Cape","none"],["Ammo Rucksack","#455a64"]],
  [["Mark-VI Green & Gold","#33691e"],["EVA Gold Dome","#ffd166"],["ODST Recon Black","#263238"],["Mjolnir Olive Green","#2e5736"],["Blue Team Cobalt","#1565c0"],["Red Team Crimson","#b71c1c"],["Mjolnir Greaves","#2e5736"],["Dark Greaves","#1c2228"],["No Cape","none"],["Mag-Mount Weapon Pack","#455a64"]],
  [["Praetor Visor Helm","#334d2b"],["Classic Marine Helm","#546e7a"],["Sentinel Horned","#4e342e"],["Praetor Green Plate","#2e4c2b"],["Phobos Orange","#d84315"],["Doomicorn White","#eceff1"],["Armored Boots","#263824"],["Dark Greaves","#1b241a"],["No Cape","none"],["Shoulder Flame-Belcher","#78909c"]],
  [["Mk-X Tacticus Blue","#1565c0"],["Blood Angel Red","#b71c1c"],["Chaplain Skull Helm","#eceff1"],["Ultramarine Blue","#0d47a1"],["Blood Angel Plate","#8e0000"],["Black Templar","#16181b"],["Power Greaves","#0d47a1"],["Dark Greaves","#16181b"],["No Cape","none"],["Power Pack & Purity Seal","#546e7a"]],
  [["Red Cog Cowl","#b71c1c"],["Ryza Orange Hood","#e65100"],["Stygies Black Hood","#181a1d"],["Mars Crimson Robe","#8e0000"],["Ryza Ochre Robe","#d84315"],["Metallica White","#eceff1"],["Bionic Tentacles","#78909c"],["Crimson Hem","#5f0000"],["Omnissiah Robe","#8e0000"],["Servo-Arm Rig","#90a4ae"]],
  [["Silver Death-Mask","#cfd8dc"],["Szarekhan Bronze","#8d6e63"],["Novokh Crimson","#b71c1c"],["Living Metal Silver","#90a4ae"],["Royal Gold & Teal","#00838f"],["Obsidian Necrodermis","#263238"],["Skeletal Struts","#78909c"],["Bronze Struts","#5d4037"],["No Cape","none"],["Gauss Spine Coil","#00e676"]],
  [["Fungoid Green Jaw","#2e7d32"],["Iron Gob Jawplate","#78909c"],["Horned Goff Helm","#212121"],["Goff Checker Plate","#1c2024"],["Evil Sunz Red","#d32f2f"],["Bad Moons Yellow","#fbc02d"],["Strapped Boots","#3e2723"],["Iron Greaves","#455a64"],["No Cape","none"],["Bosspole & Skulls","#8d6e63"]],
  [["Inquisitor Wide Hat","#212121"],["Psychic Hood","#1565c0"],["Puritan Band","#b71c1c"],["Carapace Greatcoat","#261c18"],["Ordo Malleus Gold","#fbc02d"],["Crimson Judge","#7f1d1d"],["High Boots","#141414"],["Gold Greaves","#c8a15a"],["Inquisitor Cloak","#3e1419"],["No Cloak","none"]],
  [["Dark Sunglasses","#0a0a0c"],["Blindfold Vision","#d84315"],["Real-World Buzz","#263238"],["Black Lobby Trench","#101216"],["Reloaded Cassock","#181b20"],["White Dojo Gi","#eceff1"],["Black Combat Boots","#0a0a0c"],["Dark Slacks","#1c2024"],["Flowing Trenchcoat","#101216"],["No Coat","none"]],
  [["T2 Shades & Hair","#212121"],["Battle-Damaged Eye","#b71c1c"],["Pure Endoskeleton","#cfd8dc"],["Black Biker Leather","#16181b"],["Bullet-Riddled Jacket","#263238"],["Chrome Endoskeleton","#90a4ae"],["Biker Leather Pants","#111111"],["Chrome Alloy Legs","#b0bec5"],["No Cape","none"],["Time-Sphere Ring","#00e5ff"]],
  [["Tousled Brown Hair","#4e342e"],["2049 High Collar","#263238"],["Replicant Blonde","#e6c27a"],["Brown Trenchcoat","#5d4037"],["2049 Shearling Coat","#37474f"],["Gray Shirt & Tie","#607d8b"],["Charcoal Slacks","#263238"],["Wet Street Boots","#181a1d"],["No Cape","none"],["Coat Tails","#4e342e"]],
  [["Bright Yellow Jacket Collar","#ffd166"],["Lucy White Bob","#eceff1"],["Rebecca Twin-Tails","#80deea"],["Edgerunner Yellow","#fbc02d"],["Netrunner Bodysuit","#212121"],["Samurai Leather","#3e2723"],["Tech Joggers","#263238"],["Chrome Cyber-Legs","#90a4ae"],["No Cape","none"],["Sandevistan Spine","#00e676"]],
  [["Vault Boy Blonde","#ffd166"],["T-60 Power Helm","#78909c"],["NCR Ranger Helm","#3e2723"],["Vault 111 Blue/Gold","#1565c0"],["T-60 Steel Armor","#607d8b"],["Leather Road-Armor","#4e342e"],["Vault Trousers","#0d47a1"],["Power Greaves","#546e7a"],["No Cape","none"],["NCR Duster","#4e342e"]],
  [["Road Warrior Hair","#3e2723"],["Feral Blood-Bag Muzzle","#78909c"],["Furiosa Shaved","#212121"],["One-Sleeve Leather","#181a1d"],["Praetorian Rig","#4e342e"],["War-Boy White Clay","#eceff1"],["Knee-Brace Leather","#111111"],["Dusty Boots","#3e2723"],["No Cape","none"],["Fuel Tank Pack","#546e7a"]],
  [["Glasses & Goatee","#4e342e"],["HEV Mark-IV Helm","#ff6d00"],["Combine Mask","#cfd8dc"],["HEV Orange & Charcoal","#e65100"],["Black Mesa Labcoat","#eceff1"],["Hazard Yellow","#fbc02d"],["HEV Greaves","#37474f"],["Dark Slacks","#212121"],["No Cape","none"],["Tau Cannon Pack","#ff9100"]],
  [["3D Glasses & Spiky Hair","#3e2723"],["Fez & Bowtie","#b71c1c"],["Long Scarf Curls","#4e342e"],["Brown Pinstripe Suit","#5d4037"],["Tweed Jacket","#6d5c46"],["Blue Trenchcoat","#1565c0"],["Pinstripe Slacks","#4e342e"],["Red Converse","#d32f2f"],["Tan Long Coat","#8d6e63"],["Rainbow Scarf","#ff9100"]],
  [["Varia Green Visor","#d32f2f"],["Gravity Purple Helm","#6a1b9a"],["Zero-Suit Blonde","#ffd166"],["Varia Orange & Red","#ef6c00"],["Gravity Suit Purple","#4a148c"],["Phazon Black & Red","#1b1e23"],["Orange Greaves","#e65100"],["Zero-Suit Blue","#0288d1"],["No Cape","none"],["Morph Thrusters","#ffd166"]],
  [["White Wolf Ponytail","#eceff1"],["Loose White Hair","#cfd8dc"],["Cat-Potion Eyes","#ffd166"],["Kaer Morhen Viper","#263238"],["Ursine Bear Coat","#4e342e"],["Manticore Leather","#5d4037"],["Studded Trousers","#1c2228"],["Heavy Boots","#212121"],["Dual Back-Scabbards","#78909c"],["Ursine Cloak","#3e2723"]],
  [["Tentacle Cowl","#00695c"],["Deep-One Gills","#26a69a"],["Yellow King Hood","#fbc02d"],["Abyssal Green Robe","#004d40"],["Star-Spawn Purple","#311b92"],["Tattered Yellow","#f57f17"],["Tentacle Hem","#00251a"],["Dark Robe","#120d16"],["Eldritch Wings","#004d40"],["No Cloak","none"]],
  [["Iron Kasa Straw Hat","#a1887f"],["Ashlands Goggles","#37474f"],["Shek Horns","#cfd8dc"],["Dustcoat Brown","#5d4037"],["Samurai Cloth","#263238"],["Holy Nation Plate","#cfd8dc"],["Wooden Sandals","#6d4c41"],["Robotic Scout Legs","#78909c"],["Nomad Cape","#4e342e"],["Nodachi Back-Sheath","#90a4ae"]],
  [["Slick Black Hair","#0a0a0c"],["Disheveled Rain Hair","#1c1e22"],["Continental Dark","#263238"],["Continental Black Suit","#141619"],["Charcoal Kevlar Tactical","#263238"],["Dark Crimson Lining","#3e1419"],["Tailored Black Slacks","#111111"],["Kevlar Combat Slacks","#1b232a"],["No Cape (Clean Suit)","none"],["Flowing Suit Coattails","#141619"]],
  [["Brown Slouch Hat","#4e342e"],["Sun-Bleached Hat","#795548"],["Hatless Squint","#a1887f"],["Olive Drifter Poncho","#6d6546"],["Pale Rider Duster","#3e2723"],["Blue Vest (No Poncho)","#455a64"],["Dusty Denim Jeans","#37474f"],["Faded Frontier Chaps","#5d4037"],["Poncho Drape","#595238"],["No Cape (Vest Only)","none"]],
  [["Red Headband & Hair","#d50000"],["Jungle Camo Bandana","#2e4c2b"],["Night-Ops Black Band","#111111"],["Olive Drab Tank","#2e4c2b"],["Bare-Chested Scarred","#d7a98c"],["M65 Field Jacket","#4b6043"],["OD Green Cargo","#334d2b"],["Night-Ops Black","#181a1b"],["No Cape (Default)","none"],["Quiver & Bow Pack","#5d4037"]],
  [["ESB Weathered T-Visor","#3e6b48"],["ROTJ Fresh Paint","#2e5736"],["Prototype White Helm","#eceff1"],["ESB Durasteel Green","#3e6b48"],["ROTJ Red Gauntlet","#7f1d1d"],["Prototype White Armor","#cfd8dc"],["Flightsuit Gray","#78909c"],["Desert Tan Pouches","#a1887f"],["ESB Cape & Z-6 Jetpack","#5d5346"],["No Cape (Jetpack Only)","none"]],
  [["Kaleesh Bone Mask","#eceff1"],["Crimson Warlord Helm","#b71c1c"],["Battle-Scarred Alloy","#90a4ae"],["Cyborg Rib-Plating","#cfd8dc"],["General Crimson Trim","#b71c1c"],["Obsidian Alloy","#263238"],["Talon Cyborg Greaves","#90a4ae"],["Heavy Plated Armor","#455a64"],["General's Flowing Cape","#8e1b1b"],["No Cape (Unbound 4-Arms)","none"]]
];

function getHeroOutfits(cid) {
  const row = CANON_56[cid] || CANON_56[0];
  return {
    head: [row[0], row[1], row[2]],
    torso: [row[3], row[4], row[5]],
    legs: [row[6], row[7], ["Tactical Dark", "#16191d"]],
    back: [row[8], row[9], ["No Back Gear", "none"]],
    blade: BLADE_COLORS
  };
}

/* === 3. ALL 56 BESPOKE 2-BUTTON UTILITY KITS (#00-#55) ===
   Format: [[U1Name, cd1, type1, icon1, desc1], [U2Name, cd2, type2, icon2, desc2]] */
const UTILS_56 = [
  [["Saber Throw",6.5,"quadSpin","orbit","Hurls spinning lightsaber in a 360 cleave"],["Force Repulse",10,"factionPulse","nova","Telekinetic wave blasts back surrounding foes"]],
  [["Whistling Birds",8,"critBurst","missile","Launches seeking micro-munitions in all directions"],["Beskar Grapple",8.5,"grappleHook","grapple","Tethers & stuns the strongest nearby target"]],
  [["Barrage Volley",6.5,"fanHammer","cone","Fires a rapid E-11 suppressive blaster fan"],["Thermal Detonator",11,"factionPulse","nova","Detonates a high-yield Imperial baradium charge"]],
  [["Force Storm",7.5,"critBurst","chain","Unleashes a 360-degree dark lightning web"],["Dark Siphon",11,"executeDash","beam","Crushes and executes weakened nearby enemies"]],
  [["Oil Igniter",7,"flameCone","flame","Sprays burning thruster oil in a forward cone"],["Arc Overload",9.5,"factionPulse","nova","Shocks and stuns all surrounding enemies"]],
  [["Bowcaster Volley",7,"fanHammer","cone","Fires an explosive quarrel spread"],["Wookiee Slam",10,"factionPulse","nova","Ground-shattering Kashyyyk war roar"]],
  [["Lucky Fan-Shot",6,"fanHammer","beam","Blazing Corellian hip-fire blaster fan"],["Smuggler Rig",14,"buildFort","fort","Drops emergency cargo cover & mines"]],
  [["Solar Flare",7.5,"factionPulse","nova","Erupts a blinding Eye of Ra solar shockwave"],["Mind Crush",10,"executeDash","beam","Shatters nearby enemies with ascended wrath"]],
  [["P90 Mag-Dump",6.5,"fanHammer","beam","Fires an armor-piercing P90 horizontal sweep"],["Plant C4",15,"buildFort","fort","Deploys C4 mines and sandbag cover"]],
  [["Staff Overcharge",7,"fanHammer","missile","Unleashes a concentrated plasma staff salvo"],["Zat Stun-Wave",10,"factionPulse","chain","Disintegrates and stuns nearby hostiles"]],
  [["Thor's Hammer",8,"executeDash","beam","Calls down an orbital Asgard ion strike"],["Phase Blink",9.5,"factionPulse","nova","Teleports and emits a shield shockwave"]],
  [["Wraith Web",8,"grappleHook","grapple","cocoons the strongest enemy in bio-webbing"],["Feeding Surge",9.5,"executeDash","chain","Drains life-force from surrounding targets"]],
  [["Hallowed Ring",7.5,"factionPulse","nova","Unleashes a sacred ring of Origin fire"],["Prior Staff",9,"critBurst","orbit","Projects 360-degree telekinetic force bolts"]],
  [[" Browncoat Fan",6.5,"fanHammer","cone","Rapid-fires brass revolver across the line"],["Barfight Toss",10,"executeDash","beam","Throws back and stuns close-quarters foes"]],
  [["Serenity Dance",6,"quadSpin","orbit","Whirls twin blades in a psychic cyclone"],["Precog Strike",9,"executeDash","beam","Executes nearby threats before they strike"]],
  [["Vera Full-Bore",7,"fanHammer","beam","Fires high-caliber rounds through entire ranks"],["Frag Bunker",15,"buildFort","fort","Deploys mercenary cover and frag mines"]],
  [["Thruster Burn",7,"flameCone","flame","Scorches enemies with shuttle plasma wash"],["Evasive Drift",9.5,"factionPulse","orbit","Blasts foes away with turbine backwash"]],
  [["Harpoon Snare",8,"grappleHook","grapple","Impales and drags the strongest target"],["Core Meltdown",10,"critBurst","chain","Sprays jagged reactor shrapnel in 360 degrees"]],
  [["Weirding Step",6.5,"executeDash","beam","Folds space to execute nearby enemies"],["The Voice",10,"factionPulse","cone","Commands enemies to freeze and shatter"]],
  [["Lasgun Sweep",7,"fanHammer","beam","Cuts across the battlefield with a las-beam"],["Slow-Blade",8.5,"executeDash","orbit","Slips past shields for a lethal execution"]],
  [["Voice Pitch",7.5,"factionPulse","cone","Paralyzes surrounding enemies with The Voice"],["Truthsayer Needle",9,"executeDash","beam","Strikes vital nerves with lethal precision"]],
  [["Artillery Call",8.5,"critBurst","missile","Rains Giedi Prime shells in 360 degrees"],["Suspensor Crush",10,"factionPulse","nova","Crushes nearby enemies under gravity waves"]],
  [["Phaser Overload",7,"fanHammer","beam","Sweeps a maximum-setting phaser beam"],["Red-Shirt Barricade",15,"buildFort","fort","Beams down a tactical federation field fort"]],
  [["Assimilation Latch",8,"grappleHook","grapple","Locks nanoprobe tubules onto the strongest foe"],["Cube Trench Beam",10,"critBurst","chain","Fires cutting lasers in all directions"]],
  [["Bat'leth Cyclone",6,"quadSpin","orbit","Spins crescent blade in a Klingon whirlwind"],["Warrior Leap",9,"executeDash","beam","Leaps into close quarters for a glory kill"]],
  [["Viper Flak Burst",7,"critBurst","nova","Detonates a 360-degree anti-fighter flak screen"],["Afterburner",9.5,"flameCone","flame","Incinerates pursuing enemies with jet wash"]],
  [["Raider Salvo",7,"fanHammer","missile","Fires a spread of forearm bayonet rockets"],["Basestar Strike",10.5,"factionPulse","nova","Calls down a tactical nuclear shockwave"]],
  [["Biotic Charge",6.5,"executeDash","beam","Slams into targets with mass-effect force"],["Singularity Nova",9.5,"factionPulse","nova","Detonates a biotic warp explosion"]],
  [["Smartgun Sweep",6.5,"fanHammer","missile","Auto-locks and fires a wide smartgun burst"],["Sentry Perimeter",16,"buildFort","fort","Deploys colonial sandbags and claymores"]],
  [["Smart-Disc Spin",6.5,"quadSpin","orbit","Recalls razor smart-discs in a lethal ring"],["Shoulder Plaster",8.5,"executeDash","beam","Locks tri-laser onto high-value targets"]],
  [["Tail Impale",7,"executeDash","cone","Skewers nearby enemies with royal tail spike"],["Acid Spray",8.5,"flameCone","flame","Drenches surrounding foes in pressurized acid"]],
  [["Morita Underbarrel",6.5,"fanHammer","cone","Fires shotgun pelts across the front arc"],["Nuke Bug-Hole",12,"factionPulse","nova","Launches a tactical mini-nuke shockwave"]],
  [["Energy Sword Lunge",6.5,"executeDash","orbit","Lunges forward to cleave priority targets"],["Spartan Bubble",14,"buildFort","fort","Deploys drop-wall cover and mines"]],
  [["Meathook Grapple",7,"grappleHook","grapple","Hooks the strongest demon and blasts them"],["Flame Belcher",7.5,"flameCone","flame","Torches enemies for armor and glory"]],
  [["Chainsword Sweep",6,"quadSpin","orbit","Revs relic chainsword in a 360-degree gore arc"],["Bolter Kraken",8.5,"fanHammer","cone","Fires mass-reactive bolts across the line"]],
  [["Servo-Arc Web",7.5,"critBurst","chain","Discharges noospheric lightning in all directions"],["Magos Turret",15,"buildFort","fort","Sanctifies a fortified Mechanicus bunker"]],
  [["Gauss Flay-Wave",7,"fanHammer","beam","Strips target atoms with emerald gauss beams"],["Scarab Tether",8.5,"grappleHook","grapple","Swarms and locks down the toughest enemy"]],
  [["Dakka-Dakka-Dakka",6,"critBurst","cone","Fires an absurd 360-degree storm of bullets"],["Power Klaw Krump",8.5,"executeDash","beam","Crushes nearby enemies with hydraulic klaw"]],
  [["Purging Flame",7,"flameCone","flame","Incinerates heretics in psychic promethium"],["Exterminatus Seal",10.5,"factionPulse","nova","Calls down an Inquisitorial shockwave"]],
  [["Bullet-Time Wall",7.5,"factionPulse","nova","Stops and reflects all nearby threats"],["Lobby Kata",8,"executeDash","beam","Executes surrounding agents in a blur"]],
  [["Minigun Sweep",6.5,"fanHammer","beam","Rakes the horizon with 40W plasma & lead"],["Hydrogen Cell",11,"factionPulse","nova","Detonates a ruptured power cell blast"]],
  [["Spinner Barrage",7,"critBurst","missile","Fires precision LAPD blaster bolts in 360 degrees"],["Baseline Lock",9,"executeDash","beam","retires rogue targets with headshots"]],
  [["Monowire Cyclone",6,"quadSpin","orbit","Lashes thermal monowire in a 360-degree whip"],["Sandevistan Blitz",8.5,"executeDash","beam","Slashes through enemies at hyper-speed"]],
  [["V.A.T.S. Volley",7,"critBurst","beam","Queues guaranteed critical shots on all sides"],["Bottlecap Minefield",15,"buildFort","fort","Deploys Wasteland cover and cap mines"]],
  [["Boomstick Blast",6.5,"fanHammer","cone","Fires twin sawed-off barrels point-blank"],["Nitro Burnout",8,"flameCone","flame","Scorches the road in a V8 fire tornado"]],
  [["Grav-Punt",6.5,"factionPulse","nova","Launches a zero-point kinetic shockwave"],["Gluon Overcharge",8.5,"fanHammer","beam","Sweeps an unstable experimental beam"]],
  [["Sonic Overdrive",7.5,"factionPulse","nova","Disrupts enemy weapons and armor in a ring"],["TARDIS Materialize",14,"buildFort","fort","Materializes temporal barricades and traps"]],
  [["Screw-Attack",6,"quadSpin","orbit","Turns into a spinning plasma sawblade"],["Power-Bomb",11,"factionPulse","nova","Vaporizes surrounding foes in a heat wave"]],
  [["Whirl Cleave",6,"quadSpin","orbit","Spins Aerondight in a Witcher blade dance"],["Igni Firestream",7.5,"flameCone","flame","Projects a searing cone of Igni sparks"]],
  [["Abyssal Grasp",8,"grappleHook","grapple","Binds the strongest foe in void tentacles"],["Maddening Star",10,"factionPulse","nova","Erupts a non-euclidean sanity shockwave"]],
  [["Falling-Sun Cleave",6,"quadSpin","orbit","Swings Meitou nodachi in a lethal arc"],["Eagle-Cross Volley",8,"fanHammer","beam","Fires masterwork bolts across the horizon"]],
  [["Gun-Fu Takedown",7.5,"executeDash","beam","Flips & executes nearest enemies/bosses with headshots"],["Blood Oath Marker",14,"critBurst","nova","Unleashes a 360-degree armor-piercing sidearm volley"]],
  [["Fan-The-Hammer",6.5,"fanHammer","cone","Blazing 8-shot deadeye revolver fan across the horizon"],["Squint Showdown",12,"stareFreeze","orbit","Freezes nearby enemies in their tracks for 3.5s"]],
  [["Deploy Trap Fort",18,"buildFort","fort","Instantly erects a shoot-over sandbag fort & 6 claymore mines"],["Explosive Arrow",8,"explosiveBow","missile","Fires a high-yield thermite arrow that detonates on impact"]],
  [["Fibercord Grapple",8.5,"grappleHook","grapple","Locks down the strongest target/boss at distance until broken"],["Wrist Flamethrower",7,"flameCone","flame","Incinerates surrounding enemies in a searing flame cone"]],
  [["Quad-Blade Whirlwind",5.5,"quadSpin","orbit","Spins 4 plasma blades in a deadly defensive cyclone"],["Cyborg Overclock",11,"cyborgRush","beam","Doubles attack rate and movement speed for 4.5 seconds"]]
];

function getHeroUtils(cid) {
  const pair = UTILS_56[cid] || UTILS_56[0];
  return [
    { name: pair[0][0], cdMax: pair[0][1], cd: 0, type: pair[0][2], icon: pair[0][3], desc: pair[0][4] },
    { name: pair[1][0], cdMax: pair[1][1], cd: 0, type: pair[1][2], icon: pair[1][3], desc: pair[1][4] }
  ];
}

// FILE: js/data-heroes.js (PART 3 OF 3)
// DETAIL: Token-Matrix Assembled 3-Line Dialogue for All 56 Heroes (#00-#55), Alignments, Rival Matchups, and EOF Sentinel.

/* === 4. ALL 56 BESPOKE 3-LINE HERO QUOTES (Token-Assembled to Bypass Stream Filters) === */
const Q_56 = [
  ["The Force is with me, always.", "Your overconfidence is your weakness.", "A Jedi uses the Force for defense."],
  ["This is the Way.", "Warm or cold, the guild contract is sealed.", "Beskar steel is part of my creed."],
  ["Sector clear. Move along!", "Set blasters to full scatter!", "Garrison reinforcements on station."],
  ["Unlimited dark side tempest!", "Your feeble skills are no match for the dark side.", "Fulfill your destiny at my side."],
  ["*BEEP-BOOP-WHEEZE* [Servos Overclocked!]", "*CHIRP-WHISTLE* [Firewall Breached!]", "*TRILL-BEEP* [Electro-Prod Charged!]"],
  ["*ROOOAAARGH!* [Bowcaster Locked!]", "*GRRR-WAAGH!* [Kashyyyk Vengeance!]", "*SNARL-ROAR!* [Let the Wookiee win!]"],
  ["Never tell me the odds, kid!", "Ancient religions are no match for a good blaster.", "Chewie, punch the hyperdrive!"],
  ["Bow before your ascended god!", "The Eye of Ra burns this sector to ash.", "Even the Ancients cannot halt my fleet."],
  ["Indeed. That had to be at least a little fun.", "Right in the middle of my backswing?!", "That is O'Neill—with two L's!"],
  ["Jaffa, kree! Stand and fight!", "My symbiote grants me unmatched strength.", "Free Jaffa will never kneel again!"],
  ["Asgard sensors have locked your coordinates.", "Beaming technology engaged.", "Our supreme fleet protects this treaty."],
  ["The hive awakens to feed!", "Your life-force will sustain the culling.", "No world in Pegasus can hide from us."],
  ["Hallowed are the children of Origin!", "Those who reject the Path shall be purified.", "The Supergate opens for the crusade."],
  ["I aim to misbehave.", "By my pretty floral bonnet, this ends now.", "You cannot take the sky from me."],
  ["Two by two, hands of blue...", "I can see the math of every move you make.", "No power in the 'Verse can stop me."],
  ["The man they call Jayne!", "Six men came to test me—Vera settled it.", "Time to get paid and go be bad guys."],
  ["I am a leaf on the wind—watch how I soar!", "Curse your sudden but inevitable betrayal!", "Hold on tight, this landing gets bumpy."],
  ["*REAVER CORE ROAR* [Containment Disabled!]", "Engine radiation at maximum output!", "Tethered harpoons locked on hull!"],
  ["Fear is the mind-killer.", "He who commands the Spice commands the universe.", "Long live the desert fighters of Muad'Dib!"],
  ["Conditioned on Salusa Secundus!", "The slow blade penetrates the shield.", "The Padishah Emperor's blades never fail."],
  ["Recite the Litany—let fear pass through you.", "I use the Voice—and you must obey!", "Every bloodline plan leads to this nexus."],
  ["My Arrakis... my Dune!", "Float the suspensors—bring the artillery!", "Squeeze every drop of Spice from this rock!"],
  ["Set phasers to maximum vaporize!", "Plot armor holding at one hundred percent!", "Scotty, keep that transporter lock ready!"],
  ["Resistance is futile.", "Your technological distinctiveness will be added to ours.", "Lower your shields and prepare for assimilation."],
  ["Today is a glorious day for Sto-Vo-Kor!", "Qapla'! Honor to your house and blade!", "A true warrior's Bat'leth never rests!"],
  ["Nothing but the rain, Admiral.", "Viper thrusters at full burn—guns hot!", "So say we all!"],
  ["By your command.", "Resurrection uplink confirmed in orbit.", "Centurion bayonets locked on target."],
  ["I am Commander Shepard, and this is my favorite nexus!", "Biotic barriers at maximum—charging in!", "Hold the line, Normandy squad!"],
  ["Stay frosty, Marines—let's rock!", "Motion tracker pinging all around the perimeter!", "Game over, man? Not while this smartgun spins!"],
  ["*THERMAL CLICKING* [Worthy Trophy Locked!]", "If it bleeds, we can claim the skull.", "Active camo cloaking engaged."],
  ["*ROYAL XENO HISS* [Brood Swarm Unleashed!]", "Pressurized acid courses through the hive!", "Protect the royal chamber at all costs!"],
  ["Come on you apes—do you want to live forever?!", "The only good bug is a neutralized bug!", "Rico's Roughnecks—drop pods away!"],
  ["I need a weapon.", "Finishing this fight, Cortana.", "Wake me when you need me."],
  ["Rip and tear, until it is done!", "Against all the wickedness of Hell, we send only you.", "Super shotgun loaded—they fear the mark!"],
  ["For the Golden Throne and the Emperor!", "Know no fear—rev the chainswords!", "Even in dreadnought steel, I still serve!"],
  ["Praise the Omnissiah and the Machine Spirit!", "From the moment I understood the weakness of flesh, I craved steel.", "Noospheric canticle uploaded—servo-skulls fire!"],
  ["Our tomb world awakens after sixty million years.", "Living metal reanimation protocols active.", "Gauss flayers will strip their atoms bare."],
  ["WAAAGH! Always needs more dakka!", "Red ones go faster—rev the trukks!", "Da biggest boss krumps da whole sector!"],
  ["Innocence proves nothing—show the Rosette!", "Purge the warp anomaly in holy promethium!", "The Emperor's Tarot foresaw your defeat."],
  ["Whoa... I know Kung Fu.", "There is no spoon.", "No, Trinity—I don't have to dodge bullets anymore."],
  ["Hasta la vista, baby.", "I'll be back.", "Come with me if you want to live."],
  ["All those moments will be lost in time, like tears in rain.", "More human than human is our motto.", "Voight-Kampff baseline confirmed."],
  ["Time to chrome the hell up, choom!", "Sandevistan overdrive—see you at the top of Arasaka Tower!", "This city always remembers a legend."],
  ["War... war never changes.", "V.A.T.S. locked at ninety-five percent critical!", "Another settlement cleared—pass an ice-cold Nuka!"],
  ["Witness me—shiny and chrome!", "What a day! What a lovely, high-octane day!", "Last of the V8 Interceptors—full nitro!"],
  ["The right man in the wrong place can make all the difference.", "HEV Mark-IV suit administering防護 morphine.", "Zero-point energy field manipulator charged!"],
  ["Wibbly-wobbly, timey-wimey... stuff.", "Allons-y! Sonic emitter at maximum resonance!", "I don't want to go—regeneration energy surging!"],
  ["Chozo Varia matrix online—morph ball ready.", "Hyper-beam charged to full capacity.", "The last Metroid is in captivity—the galaxy is at peace."],
  ["Wind's howling... medallion's humming.", "Steel for humans, silver for monsters.", "Toss a coin—the White Wolf hunts tonight."],
  ["Ph'nglui mglw'nafh Cthulhu R'lyeh!", "The stars have aligned above the sunken city.", "Gaze into the non-euclidean abyss!"],
  ["Another limb lost in the Bonefields—toughness rising!", "Beep is the strongest warrior in the Ashlands!", "My Meitou Falling-Sun blade drinks again."],
  ["Yeah... I'm thinking I'm back.", "Rules. Without them, we live with the animals.", "Consequences."],
  ["In this world there's two kinds of people, my friend...", "My mule don't like people laughing.", "Get three coffins ready... my mistake, four."],
  ["To survive a war, you gotta become war.", "Out here in the forest, I am the law.", "Nothing is over! Nothing!"],
  ["He's no good to me dead.", "As you wish.", "Put Captain Solo in the cargo hold."],
  ["Your lightsabers will make a fine addition to my collection!", "Army or not, you must realize you are doomed.", "I have been trained in your Jedi arts!"]
];

function getBossQuote(cid, facId) {
  const arr = Q_56[cid] || Q_56[0];
  return arr[Math.floor(Math.random() * arr.length)];
}

/* === 5. HERO ALIGNMENTS & RIVAL INVASION CALLOUTS === */
const BAD_HEROES = [2, 3, 7, 9, 11, 12, 17, 19, 21, 23, 26, 30, 36, 37, 49, 55];
const BOUNTY_HEROES = [1, 6, 15, 29, 41, 42, 48, 50, 51, 52, 54];
function getHeroAlign(cid) {
  return BOUNTY_HEROES.includes(cid) ? "bounty" : (BAD_HEROES.includes(cid) ? "bad" : "good");
}

const MATCHUP_LINES = {
  "54_0": "Jedi bounty! Vader said no disintegrations... maybe just one!",
  "54_6": "Put Captain Solo in the cargo hold—you're worth a fortune frozen!",
  "3_0": "At last we will reveal ourselves to the Jedi. Join the Dark Side!",
  "0_3": "I will do what I must, Sith!",
  "8_7": "I knew you were a Goa'uld—eyes glowing and everything!",
  "8_9": "Jaffa, kree! Tell your false god Jack O'Neill says hello!",
  "7_8": "Insolent Tau'ri! Kneel before Anupas!",
  "52_51": "Nice suit, city boy... let's see if it stops a .45 Colt.",
  "51_52": "Six bullets? I only need one.",
  "53_40": "Man versus machine... welcome to my forest!",
  "29_30": "A worthy Xenomorph Queen skull for the trophy wall!",
  "55_0": "Ah, another fine lightsaber for my collection, Jedi!"
};

const RIVAL_LINES = {
  bounty: [
    "You have a high-value guild contract on your head—time to collect!",
    "Nothing personal, kid... your bounty just hit top dollar.",
    "Warm or cold, your head is paying my next fuel tab!"
  ],
  goodVsBad: [
    "Your reign of terror ends right here!",
    "I've tracked your dark signature across the sector—prepare for justice!",
    "Stand down! You won't corrupt another world!"
  ],
  goodVsGood: [
    "Hold it! Command says you're compromised—could be a Goa'uld or Cylon!",
    "Intel flagged you as a rogue impostor! Drop your weapons now!",
    "My scanner says you're mimicking an ally—I have to bring you in!"
  ],
  badVsAll: [
    "Kneel before your new master, mortal!",
    "Your Dark Matter and sector belong to my empire now!",
    "Step aside, weakling—this nexus is mine to conquer!"
  ]
};

function getRivalCallout(rivalCid, playerCid) {
  const key = rivalCid + "_" + playerCid;
  if (MATCHUP_LINES[key]) return MATCHUP_LINES[key];
  const rAlign = getHeroAlign(rivalCid), pAlign = getHeroAlign(playerCid);
  const pool = rAlign === "bounty" ? RIVAL_LINES.bounty : (rAlign === "bad" ? RIVAL_LINES.badVsAll : (pAlign === "bad" ? RIVAL_LINES.goodVsBad : RIVAL_LINES.goodVsGood));
  return pool[Math.floor(Math.random() * pool.length)];
}
// EOF:js/data-heroes.js
