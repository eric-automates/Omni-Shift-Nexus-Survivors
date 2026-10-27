// FILE: js/data-heroes.js
// PART: 7 of 14
// DETAIL: v8.0 Overhaul — All 80 Multiverse Heroes (#00-#79: Vader, Maul, Windu, Yoda), Early-to-Prime Biographical Saber/Combat Stance Progressions, Blaster-Deflection Stances, and 80 Bespoke Dash Specs.

"use strict";

/* === 1. 80 MULTIVERSE HEROES (#00-#79) === */
const CHAR_RAW = [
  [0, 0, 0, "Aether-Blade Initiate", "Cyan Plasma Saber", "Twin-Sun Saber Mastery", "orbit", "Force Reflex", "+15% Speed, Form I->IV->V Saber Progression, Deflect & 100% Vacuum"],
  [1, 0, 3, "Beskar Creed Tracker", "IB-94 Beskar Heavy Pistol", "IB-94 Full-Charge Beskar Slugs", "beam", "Beskar Plating", "+4 Flat Armor & -20% Damage Taken"],
  [2, 0, 2, "Imperial White-Trooper", "E-11 Scatter Blaster", "Garrison Overwatch", "cone", "Suppressive Scatter", "+35% Fire Rate & +1 Projectile"],
  [3, 0, 8, "Crimson Sith Sovereign", "Crimson Sith Saber & Arc", "Unlimited Tempest Web", "chain", "Dark Hate Conduit", "100% Force Vacuum, Form IV->VII Sith Mastery & Kill Heal"],
  [4, 0, 4, "R2-Chirp Astro-Droid", "Electro-Prod & Oil Slick", "Hacked Turret Grid", "nova", "Overclocked Servos", "-18% All Weapon Cooldowns"],
  [5, 0, 5, "Kashyyyk Bow-Roarer", "Quarrel Laser-Bowcaster", "Thermal Detonator Volley", "cone", "Wookiee Rage", "+30% Max HP & +20% Weapon Area"],
  [6, 0, 5, "Corellian Kessel Runner", "Heavy DL-44 Blaster", "Freighter Orbital Strafe", "beam", "Shoots First", "+30% Crit Chance & +25% XP/DM Greed"],
  [7, 1, 12, "Anupas Jackal-Gold", "Eye of Ra Solar Staff", "Dakara Ascended Wave", "nova", "Half-Ascended Divinity", "100% Telekinetic Vacuum, +25% Dmg & Revive"],
  [8, 1, 0, "Chevron-1 Tac-Colonel", "FN-P90 Tactical Burst", "Stargate Kawoosh Vortex", "beam", "C4 Improviser", "+25% Projectile Speed & -12% Cooldown"],
  [9, 1, 5, "Serpent-Guard Prime", "Ma'Tok Plasma Staff", "Twin Staff & Zat Disintegrator", "missile", "Symbiote Regen", "+2.0 HP/s Regen & +20% Max HP"],
  [10, 1, 9, "Othala Grey Sage", "Asgard Ion Beam", "O'Neill Orbital Pillar", "beam", "Beaming Phase", "100% Beaming Vacuum, +1 Relic & Phase Dodge"],
  [11, 1, 8, "Pegasus Hive Matron", "Wraith Bio-Stunner", "Culling Dart Squadron", "chain", "Life-Force Drain", "Heals 3 HP every 10 kills & slows foes"],
  [12, 1, 10, "Hallowed Origin Prior", "Levitating Sacred Stones", "Supergate Inferno Nova", "orbit", "Hallowed Zeal", "100% Telekinetic Vacuum, +35% Area & +25% Dur"],
  [13, 2, 0, "Browncoat Captain", "Moses Brothers Brass Pistol", "Crazy-Ivan Full Burn", "cone", "Aim to Misbehave", "+20% Speed & +35% Damage below 50% HP"],
  [14, 2, 9, "Miranda Psychic Dancer", "Twin River Axes & Sabers", "Precog Blade Dance", "orbit", "Hands of Blue Evasion", "100% Psychic Vacuum, +30% Dodge & +25% Crit"],
  [15, 2, 5, "Canton Heavy Merc", "Vera Callahan Full-Bore", "Airlock Sonic Shell", "beam", "Hero of Canton", "+30% Might & +3 Armor"],
  [16, 2, 4, "Soaring Leaf Pilot", "Orbiting Thruster Drones", "Shuttle Gun-Pod Drift", "orbit", "Leaf on the Wind", "+35% Move Speed & Hazard Resistance"],
  [17, 2, 7, "Reaver Blood-Harpooner", "Tethered Harpoon Rip-Saw", "Reactor Meltdown Saws", "chain", "Core-Radiation Frenzy", "Up to +60% Fire Rate as HP drops"],
  [18, 3, 10, "Muad'Dib Sand-Prophet", "Crysknife Weirding Lunge", "Shai-Hulud Maker Eruption", "nova", "Prescience", "100% Voice Vacuum, +25% Dodge & +30% Magnet"],
  [19, 3, 0, "Sardaukar Executioner", "Holtzman Slow-Blade", "Subatomic Shield Lasgun", "beam", "Salusa Conditioning", "+30% Crit Damage & +2 Pierce"],
  [20, 3, 8, "Bene-Voice Matron", "The Voice Pitch Cone", "Kwisatz Mind-Crush", "cone", "Litany Against Fear", "100% Voice Vacuum, Hazard Immune & -15% CD"],
  [21, 3, 7, "Harkonnen Hover-Baron", "Hunter-Seeker Needle", "Giedi Artillery Rain", "missile", "Suspensor Levitation", "Flies over Rocks/Hazards & +40% Greed"],
  [22, 4, 0, "Red-Shirt Commander", "Type-II Phaser Pistol", "Quantum Torpedo Array", "beam", "Plot-Armor Shield", "Survives lethal damage with 1 Revival"],
  [23, 4, 9, "Hive-Cube Assimilator", "Nanoprobe Assimilation Whip", "Tactical Cube Trench Beam", "chain", "Adaptive Shielding", "Taking damage grants +5 Armor for 5s"],
  [24, 4, 5, "Qo'noS Bat'leth Guard", "Crescent Bat'leth Cleave", "Bird-of-Prey Decloak", "orbit", "Sto-Vo-Kor Bloodlust", "+1% Damage per 15 kills (up to +100%)"],
  [25, 4, 5, "Viper Starbuck-Ace", "KEW Flak Magnum", "Battlestar Nuke Salvo", "nova", "Combat Thrusters", "+25% Move Speed & +1 Extra Projectile"],
  [26, 4, 6, "Centauri Cylon Raider", "Forearm Repeating Cannon", "Basestar Nuclear Swarm", "missile", "Resurrection Uplink", "+1 Extra Revival & +25% Proj Speed"],
  [27, 4, 8, "Spectre Biotic Vanguard", "M-8 Avenger & Biotic Orb", "Warp Supernova Detonation", "nova", "Mass Effect Barrier", "100% Biotic Vacuum, +35% Max HP & +25% KB"],
  [28, 5, 5, "Sulaco Smart-Gunner", "M56 Auto-Smartgun", "Sentry & Napalm Ring", "missile", "Motion Tracker Ping", "+35% Crit Chance & +20% Fire Rate"],
  [29, 5, 10, "Yautja Trophy Hunter", "Autonomous Smart-Discs", "Wrist-Bracer Grid Nova", "orbit", "Active Camo Cloak", "+25% Dodge & +40% Crit Damage"],
  [30, 5, 9, "Acid-Blood Xeno-Queen", "Inner-Jaw & Tail Whip", "Royal Broodling Swarm", "cone", "Pressurized Acid Blood", "Enemies touching you take 80 Thorns Dmg"],
  [31, 5, 0, "Klendathu Drop-Trooper", "Morita MK1 Split-Rifle", "Tactical Mini-Nuke", "cone", "Live Forever", "+20% Fire Rate & +25% Area"],
  [32, 5, 8, "Mjolnir Spartan-117", "MA5B & Type-1 Energy Sword", "Spartan Laser & Sword", "beam", "Mjolnir Energy Shield", "+2.5 HP/s Regen & +30% Area"],
  [33, 5, 12, "Praetor Crucible Slayer", "Lucifer Super Shotgun", "BFG-10000 Tendril Orb", "chain", "Rip & Tear Glory-Heal", "Kills within 90px heal 1.5 HP"],
  [34, 6, 0, "Astartes Chainsword", "Godwyn Bolter & Chainsword", "Exterminatus Lance", "cone", "Know No Fear", "+6 Flat Armor & +20% Might"],
  [35, 6, 8, "Omnissiah Tech-Magos", "Floating Servo-Skulls", "Noospheric Arc Hexagon", "orbit", "Machine Spirit Canticle", "+2 Projectiles, +1 Relic Slot & +25% Magnet"],
  [36, 6, 10, "Tomb-World Gauss Necron", "Emerald Gauss Flayer", "C'tan Tesseract Vault", "beam", "Reanimation Protocol", "+2.5 HP/s Regen & +1 Revival"],
  [37, 6, 6, "Waaagh Dakka Warboss", "Twin Belt-Fed Big-Shoota", "Rokkit & Squig Storm", "cone", "More Dakka!", "+2 Extra Projectiles & +20% Move Speed"],
  [38, 6, 8, "Warp Psyker Inquisitor", "Purging Force-Staff Flame", "Astronomican Sun Nova", "nova", "Emperor's Tarot", "100% Warp Vacuum, +25% Crit & +30% Crit Dmg"],
  [39, 7, 11, "Zion Bullet-Time One", "Dual Micro-Uzis & Telekinesis", "Source-Code Decompiler", "nova", "There Is No Spoon", "100% Telekinetic Vacuum, +35% Dodge & -20% CD"],
  [40, 7, 7, "T-800 Endo-Enforcer", "Westinghouse M-25 Plasma", "Time-Sphere Lightning", "beam", "Hyperalloy Titanium Arm", "+50% HP, +6 Armor; Guarding Head (HD) blocks 95% eye/head damage!"],
  [41, 7, 0, "Neon Origami Runner", "LAPD 2019 PKD Blaster", "Spinner Railgun Sweep", "missile", "Voight-Kampff Lock", "+50% Damage vs Bosses & +20% Crit"],
  [42, 7, 9, "Sandevistan Edgerunner", "Thermal Monowire Whip", "Cyberpsychosis Daemons", "chain", "Sandevistan Overdrive", "Bursts to 180% Speed & Rate every 6s"],
  [43, 7, 6, "Vault-Tec Wanderer", "AER9 Laser Rifle & Mine", "MIRV Fat-Man Catapult", "nova", "V.A.T.S. Crit Lock", "Guaranteed Crit pulses every 4s"],
  [44, 7, 5, "V8 Chrome Interceptor", "Sawed-Off Double-Barrel", "Doof-Wagon Fire Tornado", "orbit", "Witness Me! Nitro", "+35% Move Speed & +25% Area"],
  [45, 8, 0, "Black-Mesa Physicist", "Zero-Point Gravity Gun", "Supercharged Gluon Beam", "beam", "HEV Morphine Suit", "100% Grav-Gun Vacuum, +5 Armor & Haz Immune"],
  [46, 8, 10, "Gallifrey Sonic Traveler", "Mark-VII Sonic Emitter", "TARDIS Time Vortex", "nova", "Time-Lord Regeneration", "2 Revivals that boost all stats +20%"],
  [47, 8, 9, "Chozo Morph Hunter", "Chozo Power Arm-Cannon", "Power-Bomb Hyper-Beam", "cone", "Screw-Attack Thrusters", "+25% Speed & Contact Dash Damage"],
  [48, 9, 0, "Silver-Sword Mutagen", "Aerondight Silver Longsword", "Quen-Yrden Storm", "orbit", "Trial of the Grasses", "+2 HP/s Regen & +25% Crit Chance"],
  [49, 9, 11, "R'lyeh Star Cultist", "Abyssal Eldritch Tome", "Great Cthulhu Singularity", "chain", "Non-Euclidean Madness", "100% Abyssal Vacuum, 35% Slow & +25% Area"],
  [50, 9, 15, "Kenshi-Moon Ronin", "Meitou Falling-Sun Nodachi", "Venge Orbital Beak-Storm", "orbit", "Toughness Conditioning", "Every hit taken grants +2 Max HP, +2% Might & bonus Toughness XP"],
  [51, 7, 14, "Baba Yaga Suit-Assassin", "Baba Yaga Backup Kimber", "Continental Dragon's Breath", "beam", "Bulletproof Kevlar Suit & CQC", "Lv.5 transitions to Primary Benelli/2011; Guarding Head/Torso blocks 95%!"],
  [52, 2, 14, "The Man With No Name", "Colt 1851 Navy Six-Shooter", "Deadeye Eight-Shooter", "cone", "High-Noon Deadeye", "Poncho gunslinger: blazing 6-shot right-hand bursts with lethal crit & 0.55s quick-reload"],
  [53, 5, 14, "Green-Beret Last-Stand Vet", "Belt-Fed M60 & Comp-Bow", "First Blood Firestorm", "cone", "Last-Stand Fortifier", "Staying within 180px for 120s (or Utility) deploys shoot-over Fort & Claymore mines"],
  [54, 0, 15, "Slav-1 Bounty Tracker", "Sawed-Stock EE-3 Carbine", "Disintegrations Authorized", "beam", "Mandalorian Arsenal", "ESB Jetpack Missile & Cape + Knee Darts + Auto-Flamethrower + Disintegrator"],
  [55, 6, 16, "General Kaleesh Cyborg", "Quad-Saber Lunge & Blasters", "General's Grievous Wrath", "orbit", "Four-Armed General", "4-Armed Cyborg Warlord: fires 4 weapons simultaneously with built-in Saber Deflection!"],
  [56, 10, 0, "Scarred Boy-Wizard", "Holly Phoenix-Feather Wand", "Master of Death Hallows", "beam", "Chosen Boy-Who-Lived", "Unlocks cumulative spells on top bar (Stupefy, Leviosa, Expelliarmus, Stag Patronus) + 100% Vacuum!"],
  [57, 10, 2, "Time-Turner Arithmancer", "Vine Dragon-Heartstring Wand", "Chronos Arithmancy Storm", "beam", "Brightest Witch of Her Age", "-20% Spell Cooldowns, Cumulative Spellbook Bar & Time-Turner Rewind"],
  [58, 10, 3, "Red-Mane Pyro-Keeper", "Ash Wand & Wildfire Whiz-Bangs", "Weasley Dragon-Fire Barrage", "cone", "Wizard's Chess Tactician", "+25% Spell Area, Cumulative Spell Bar & Summons Allied Chess Knight"],
  [59, 10, 3, "Spectrespec Moon-Seer", "Dirigible Plum Astral Wand", "Lovegood Hare Patronus", "chain", "Spectrespec Second Sight", "Innate Spectrespecs Visor (+10% Crit), 100% Vacuum & Levitation Float"],
  [60, 10, 4, "Golden-Badger Champion", "Springy Ash Triwizard Wand", "Triwizard Cup Golden Flare", "beam", "Hufflepuff Loyalty", "+30% Max HP, +3 Armor & Transfigures Rocks into Allied Hounds"],
  [61, 10, 4, "Pink-Umbrella Half-Giant", "Concealed Pink Umbrella & Bow", "Forbidden Forest Dragon-Roar", "cone", "Half-Giant Constitution", "+60% Max HP, +6 Armor, Spell Resistance & Summons Fang + Norbert Dragon"],
  [62, 10, 5, "Silver-Serpent Prefect", "Hawthorn Unicorn-Hair Wand", "Room of Requirement Fiendfyre", "missile", "Pure-Blood Ambition", "+25% Crit Damage, +30% Greed & Conjures Serpensortia Vipers"],
  [63, 10, 6, "Moony Full-Moon Professor", "Cypress Defense Wand", "Full-Moon Alpha Lycanthrope", "cone", "Marauder's Defense", "+2.5 HP/s Regen, +20% Speed & Periodic Werewolf Frenzy"],
  [64, 10, 6, "Padfoot Azka-Fugitive", "Runed Azkaban Wand", "Grim Shadow-Pack Onslaught", "beam", "Animagus Grim Hound", "+25% Move Speed, +25% Crit & Summons Allied Grim Hounds"],
  [65, 10, 7, "Mad-Eye Auror Veteran", "Thumping Auror Staff & Wand", "Constant Vigilance Barrage", "beam", "Magical Spinning Eye", "Innate 360° Magical Eye Visor (+10% Crit), +30% Boss Dmg & Staff Shockwaves"],
  [66, 10, 8, "Emerald Animagus Deputy", "Fir Transfiguration Wand", "Piertotum Locomotor Legion", "beam", "Transfiguration Grandmaster", "Animates Allied Stone Armor Knights to fight for you & -18% Cooldowns"],
  [67, 10, 9, "Half-Blood Potions Master", "Ebony Hex Wand", "Sectumsempra Invisible Laceration", "orbit", "Half-Blood Prince", "Sectumsempra wand-slashes sever limbs at range & open arterial bleeds"],
  [68, 10, 10, "Azka-Born Cruciatus Witch", "Curved Walnut Wand & Dagger", "Lestrange Dark-Mark Tempest", "chain", "Cruciatus Sadism", "+35% Crit Chance, Returning Silver Dagger Impale & Crimson Stun Webs"],
  [69, 10, 12, "Elder-Wand Headmaster", "The Elder Wand & Fawkes", "Parting Inferno & Fawkes Song", "nova", "Phoenix Rebirth & Mastery", "100% Arcane Vacuum, Cumulative Arch-Spells & +1 Fawkes Phoenix Revival"],
  [70, 10, 14, "Nameless Dark Lord", "Yew Phoenix Wand & Nagini", "Avada Kedavra Killing Storm", "chain", "Seven Horcruxes", "Avada Kedavra green lightning vaporizes foes, +2 Horcrux Revivals & 100% Vacuum"],
  [71, 10, 13, "Flame of Anor Istari", "Staff of Light & Glamdring", "White Rider Dawn Sunburst", "orbit", "Servant of the Secret Fire", "Wields Glamdring + Staff simultaneously (3 Hands) & 'You Shall Not Pass!' Barrier"],
  [72, 10, 10, "White-Hand Voice Wizard", "Orthanc Obsidian Staff", "Caradhras Tempest & Ruin", "missile", "Voice of Saruman", "100% Telekinetic Vacuum, +30% Area & Stuns/Blasts Foes"],
  [73, 10, 11, "Kamar-Taj Time Sorcerer", "Eldritch Mandala Whips", "Eye of Agamotto Time-Loop", "orbit", "Sorcerer Supreme", "100% Mystic Vacuum, Mirror Dimension Reflect & Time-Freeze"],
  [74, 10, 12, "Sokovian Chaos Hex-Witch", "Chaos Probability Hex-Orbs", "Darkhold Reality Rewrite", "nova", "Chaos Magic Levitation", "100% Chaos Vacuum, Levitates & Floats Enemies Off-Screen for Instant XP"],
  [75, 10, 15, "Book of the Dead Arch-Lich", "Flesh-Bound Grimoire", "Army of the Dead Necropolis", "chain", "Corpse-Raiser Grimoire", "Lv.1 Soul-Drain creates corpses; Lv.2-10 raises Swordsmen, Critters, Bowmen, Knights & Bone Golem from corpses!"],
  // v8.0 NEW STAR WARS LEGENDS (#76-#79)
  [76, 0, 14, "Darth Vader — Dark Lord", "Mustafar Crimson Lightsaber", "Dark Lord Djem So Supremacy", "orbit", "Cybernetic Sith Juggernaut", "Form V Shien->Djem So Progression, 1-Handed Backhand Blaster Deflect, Force Lunge Dash & +45% HP!"],
  [77, 0, 12, "Darth Maul — Zabrak Assassin", "Double-Bladed Sith Saberstaff", "Duel of the Fates Juyo Cyclone", "orbit", "Dathomir Double-Blade", "Wields a Double-Bladed Saberstaff (slices front & back!), Form VII Juyo Spins & Butterfly-Twist Dash!"],
  [78, 0, 13, "Mace Windu — Vaapad Master", "Electrum Amethyst Lightsaber", "Shatterpoint Vaapad Mastery", "orbit", "Form VII Vaapad Conduit", "Amethyst purple saber (+35% Crit, +30% Reflect), Form V->VII Vaapad Fury & Shatterpoint Blitz Dash!"],
  [79, 0, 15, "Grandmaster Yoda — Ataru Sage", "Emerald Shoto Lightsaber", "Grandmaster Ataru Somersault", "orbit", "900-Year Acrobatic Ataru", "Compact Master (+35% Dodge, +30% Speed): leaps, flips & somersaults mid-air while slicing!"]
];

const FORCE_VACUUM_HEROES = [0, 3, 7, 10, 12, 14, 18, 20, 27, 38, 39, 45, 49, 56, 57, 59, 66, 67, 69, 70, 71, 72, 73, 74, 75, 76, 77, 78, 79];
function hasInnateVacuum(cid) { return FORCE_VACUUM_HEROES.includes(cid); }

const SWORD_HEROES = [0, 3, 14, 18, 19, 24, 32, 33, 34, 48, 50, 55, 67, 71, 76, 77, 78, 79];
function isSwordWeapon(wpnId) { return SWORD_HEROES.includes(wpnId); }

function getHeroArmCap(cid) {
  if (cid === 55) return 4;
  if ([0, 3, 7, 12, 38, 39, 56, 57, 66, 69, 70, 71, 73, 74, 75, 76, 77, 78, 79].includes(cid)) return 3;
  return 2;
}

/* === 2. BIOGRAPHICAL EARLY-TO-PRIME SABER & COMBAT STANCE PROGRESSION ENGINE ===
   Patterns:
   0 = Form I Shii-Cho (Basic sweeping horizontal guard)
   1 = Form II Makashi (Precise one-handed fencing thrusts & parries)
   2 = Form III Soresu (Tight defensive figure-8 weave close to body)
   3 = Form IV Ataru (Acrobatic wide overhead-to-low flips & spins)
   4 = Form V Djem So / Shien (Heavy two-handed power diagonal cleaves)
   5 = Form VI Niman (Balanced diplomatic weave + Force-hand channel)
   6 = Form VII Juyo / Vaapad (Ferocious high-tempo multi-angle flurry)
   7 = Double-Bladed Saberstaff Moulinet (360° dual-ended staff figure-8)
   8 = CQC Center-Axis Relock (Tight two-handed tactical pistol/blade snap)
   9 = Gunslinger Hip-Fan (Low holster-level single-hand quick-draw)
   10 = Heavy Braced Suppression (Two-handed shoulder-braced recoil stance)
   11 = Arcane Wand / Staff Conduct (Sweeping figure-8 spellcaster somatic weave) */
const HERO_STANCE_TABLE = {
  // #00 Luke Skywalker: Farmboy Shii-Cho -> Bespin Form IV/V -> ROTJ Master Djem So | Deflect: Soresu Tight Weave
  0:  [[0, "Form I Shii-Cho (Tatooine Initiate)", 1.0, 0.75, 0.45], [3, "Form V Shien (Bespin Duelist)", 1.25, 1.10, 0.80], [4, "Form V Djem So (ROTJ Jedi Master)", 1.55, 1.35, 1.15], [2, "Form III Soresu Blaster Deflect"]],
  // #03 Emperor Palpatine / Sidious: Hidden Niman -> Dual-Saber Ataru -> Form VII Juyo Sith Whirlwind | Deflect: Force Lightning Redirect
  3:  [[5, "Form VI Niman (Chancellor)", 1.1, 0.85, 0.55], [3, "Form IV Ataru (Senate Duelist)", 1.40, 1.25, 1.05], [6, "Form VII Juyo (Sith Emperor)", 1.75, 1.50, 1.40], [6, "Sith Cortosis Deflection"]],
  // #14 River Tam: Academy Conditioning -> Dual-Axe Precog -> Miranda Cyclone
  14: [[1, "Academy Fencing", 1.15, 0.90, 0.65], [3, "Hands of Blue Dual-Dance", 1.45, 1.25, 1.05], [6, "Miranda Precog Whirlwind", 1.80, 1.55, 1.35], [2, "Precog Bullet-Parry"]],
  // #18 Paul Muad'Dib: Caladan Atreides -> Fremen Weirding Way -> Kwisatz Haderach
  18: [[1, "Caladan Rapier Drill", 1.10, 0.80, 0.50], [3, "Fremen Weirding Step", 1.40, 1.15, 0.95], [6, "Kwisatz Prescience Blur", 1.75, 1.40, 1.25], [1, "Holtzman Shield Slip-Parry"]],
  // #19 Sardaukar: Salusa Drill -> Slow-Blade Penetrator -> Imperial Executioner
  19: [[1, "Salusa Blade Drill", 1.05, 0.78, 0.50], [4, "Holtzman Slow-Blade", 1.30, 1.08, 0.82], [6, "Padishah Executioner", 1.55, 1.32, 1.10], [2, "Shield-Belt Deflect"]],
  // #24 Worf / Klingon: Mok'bara Initiate -> Bat'leth Cleave -> Sword of Kahless
  24: [[0, "Mok'bara Forms", 1.05, 0.90, 0.55], [4, "Qo'noS Bat'leth Cleave", 1.32, 1.22, 0.90], [6, "Sword of Kahless Bloodlust", 1.65, 1.48, 1.25], [4, "Bat'leth Cross-Guard Block"]],
  // #32 Master Chief: UNSC CQC -> Type-1 Energy Lunge -> Spartan Mythic Duelist
  32: [[8, "UNSC CQC Bayonet", 1.05, 0.80, 0.45], [4, "Sangheili Energy Lunge", 1.35, 1.15, 0.85], [6, "Mythic Energy Sword Cleave", 1.60, 1.38, 1.15], [2, "Mjolnir Counter-Slash"]],
  // #33 Doom Slayer: Praetor Brawling -> Meathook Rip & Tear -> Crucible Arch-Slayer
  33: [[4, "Praetor Brutal Cleave", 1.20, 1.05, 0.70], [6, "Rip & Tear Frenzy", 1.50, 1.32, 1.05], [6, "Crucible Titan-Slayer", 1.85, 1.60, 1.40], [4, "Argent Blade Smash"]],
  // #34 Astartes: Neophyte Chainsword -> Tactical Brother -> Chapter Champion
  34: [[0, "Astartes Neophyte Sweep", 1.05, 0.88, 0.55], [4, "Crux Terminatus Cleave", 1.32, 1.18, 0.88], [6, "Emperor's Champion", 1.60, 1.42, 1.20], [2, "Storm-Shield Parry"]],
  // #48 Geralt: Kaer Morhen Fast Style -> Strong Ursine Cleave -> Grandmaster Whirl
  48: [[1, "Wolf School Fast Style", 1.18, 0.92, 0.65], [4, "Wolf School Strong Style", 1.42, 1.22, 0.98], [7, "Grandmaster Aerondight Whirl", 1.78, 1.50, 1.45], [1, "Witcher Arrow-Deflection"]],
  // #50 Kenshi Ronin: Starving Drifter -> Desert Sabre Guard -> Meitou Falling-Sun Master
  50: [[0, "Border-Zone Drifter Swing", 0.95, 0.85, 0.45], [4, "Desert Sabre Heavy Guard", 1.28, 1.18, 0.85], [6, "Meitou Falling-Sun Execution", 1.65, 1.48, 1.25], [2, "Kenshi Cross-Block"]],
  // #55 General Grievous: Kaleesh Warlord -> Dual-Blade Finesse -> 4-Arm Buzzsaw Moulinet
  55: [[1, "Kaleesh Outrider Slash", 1.25, 1.00, 0.75], [6, "Dooku-Trained Quad Assault", 1.60, 1.35, 1.20], [7, "Unbound 4-Arm Buzzsaw Moulinet", 2.10, 1.65, 1.85], [7, "Spinning Rotor Shield"]],
  // #67 Severus Snape: Student Hex-Duelist -> Death-Eater Occlumens -> Half-Blood Prince Sectumsempra
  67: [[1, "Hogwarts Duelist", 1.15, 0.80, 0.55], [11, "Occlumens Counter-Weave", 1.40, 1.05, 0.85], [6, "Half-Blood Prince Sectumsempra", 1.75, 1.35, 1.20], [2, "Silent Non-Verbal Parry"]],
  // #71 Gandalf: Grey Pilgrim Staff-Guard -> Glamdring Foe-Hammer -> White Rider Istari Mastery
  71: [[5, "Grey Pilgrim Staff-Guard", 1.08, 0.88, 0.55], [4, "Glamdring Foe-Hammer Cleave", 1.38, 1.20, 0.92], [6, "Gandalf the White Istari Dawn", 1.70, 1.45, 1.25], [2, "Secret Fire Ward-Parry"]],
  // #76 DARTH VADER: Clone Wars Form V Shien -> Mustafar Aggressive Djem So -> Dark Lord Cybernetic Power Cleave | Deflect: Casual 1-Handed Backhand Swat!
  76: [[3, "Form V Shien (Clone Wars Anakin)", 1.22, 1.05, 0.78], [4, "Form V Djem So (Mustafar Fall)", 1.45, 1.30, 1.05], [4, "Cybernetic Dark Lord Djem So", 1.65, 1.55, 1.25], [1, "1-Handed Backhand Blaster Swat"]],
  // #77 DARTH MAUL: Single-Blade Niman -> Double-Bladed Teräs Käsi -> Prime Form VII Juyo Saberstaff Cyclone | Deflect: Spinning Saberstaff Barrier!
  77: [[5, "Form VI Niman (Single-Blade Probe)", 1.28, 1.00, 0.80], [7, "Double-Bladed Teräs Käsi Spin", 1.65, 1.40, 1.45], [7, "Form VII Juyo Saberstaff Cyclone", 2.05, 1.65, 1.95], [7, "Spinning Saberstaff Wall"]],
  // #78 MACE WINDU: Form V Shien Initiate -> Council Master -> Form VII Vaapad Superconducting Blur | Deflect: Shatterpoint Redirect!
  78: [[4, "Form V Shien (Council Member)", 1.18, 0.95, 0.70], [6, "Korun Shatterpoint Precision", 1.52, 1.28, 1.10], [6, "Form VII Vaapad Superconducting Loop", 1.92, 1.58, 1.55], [6, "Vaapad Shatterpoint Deflect"]],
  // #79 GRANDMASTER YODA: Form III Soresu Sage -> Form IV Ataru Leap -> 900-Year Acrobatic Ataru Whirlwind | Deflect: Mid-Air Spinning Shoto Deflect!
  79: [[2, "Form III Soresu (High Council Sage)", 1.25, 0.90, 0.75], [3, "Form IV Ataru (Acrobatic Duelist)", 1.68, 1.38, 1.35], [3, "900-Year Grandmaster Ataru Whirlwind", 2.15, 1.70, 1.85], [3, "Ataru Mid-Air Shoto Deflect"]]
};

function getHeroStanceSpec(cid, wpnLvl = 1, isDeflecting = false) {
  const tier = wpnLvl >= 7 ? 2 : (wpnLvl >= 4 ? 1 : 0);
  const row = HERO_STANCE_TABLE[cid];
  if (row) {
    const st = row[tier];
    const def = row[3];
    return {
      pattern: isDeflecting ? def[0] : st[0],
      stageName: isDeflecting ? def[1] : st[1],
      deflectName: def[1],
      speedMul: st[2] * (isDeflecting ? 1.35 : 1.0),
      arcWidth: st[3],
      wristAmp: st[4],
      isDoubleBlade: (cid === 77 && wpnLvl >= 2), // Maul ignites second blade at Lv.2+ (or during cyclone)
      isAcrobaticLeaper: (cid === 79)             // Prequel Yoda hops & flips around enemies while swinging!
    };
  }
  // Non-saber heroes also evolve their combat stance from Early Career -> Seasoned -> Prime!
  if (cid >= 56 && cid <= 75) {
    const names = ["Apprentice Wand-Cast", "Auror Battle-Weave", "Arch-Mage Somatic Mastery"];
    return { pattern: 11, stageName: names[tier], deflectName: "Protego Wrist-Parry", speedMul: 1 + tier * 0.22, arcWidth: 0.35 + tier * 0.15, wristAmp: 0.3 + tier * 0.2, isDoubleBlade: false, isAcrobaticLeaper: false };
  }
  if ([51, 41, 42].includes(cid)) {
    const names = ["Street CQC Draw", "Center-Axis Relock", "Baba Yaga Gun-Fu Mastery"];
    return { pattern: 8, stageName: names[tier], deflectName: "Kevlar Gauntlet Guard", speedMul: 1 + tier * 0.2, arcWidth: 0.22, wristAmp: 0.15, isDoubleBlade: false, isAcrobaticLeaper: false };
  }
  if ([52, 6, 13, 22].includes(cid)) {
    const names = ["Frontier Hip-Draw", "High-Noon Quickdraw", "Legend Deadeye Fan"];
    return { pattern: 9, stageName: names[tier], deflectName: "Side-Step Dodge", speedMul: 1 + tier * 0.25, arcWidth: 0.18, wristAmp: 0.2, isDoubleBlade: false, isAcrobaticLeaper: false };
  }
  const names = ["Standard Issue Stance", "Veteran Braced Stance", "Prime Spec-Ops Overwatch"];
  return { pattern: 10, stageName: names[tier], deflectName: "Braced Suppression", speedMul: 1 + tier * 0.18, arcWidth: 0.2, wristAmp: 0.1, isDoubleBlade: false, isAcrobaticLeaper: false };
}

/* === 3. CHARACTER-SPECIFIC DOUBLE-TAP DISTANT DASH REGISTRY (#00-#79) === */
function getHeroDashSpec(cid) {
  if (cid === 76) return { name: "Vader Force Lunge & Swipe", cd: 4.5, dist: 145, style: "vaderLunge", col: "#ff1744", callout: "THERE IS NO ESCAPE!", desc: "Lunges forward with the Dark Side and executes a massive horizontal crimson bisection!" };
  if (cid === 79) return { name: "Yoda Multi-Flip Tornado", cd: 3.8, dist: 165, style: "yodaFlip", col: "#00e676", callout: "AROUND THE SURVIVORS, A PERIMETER CREATE!", desc: "Somersaults in a rapid multi-flip emerald cyclone, slicing every enemy along the path!" };
  if (cid === 77) return { name: "Maul Butterfly-Twist Blitz", cd: 4.0, dist: 160, style: "maulSpin", col: "#ff1744", callout: "AT LAST WE WILL HAVE REVENGE!", desc: "Leaps into an aerial butterfly-twist while spinning both crimson saberstaff blades!" };
  if (cid === 78) return { name: "Windu Vaapad Shatter-Blitz", cd: 4.2, dist: 155, style: "vaapadBlitz", col: "#d500f9", callout: "THIS PARTY'S OVER!", desc: "Blurs forward in a purple Vaapad streak, shattering armor along the path!" };
  if ([0, 3, 14, 18, 19, 24, 32, 33, 34, 48, 50, 55].includes(cid)) {
    return { name: "Saber / Blade Cleave Rush", cd: 4.2, dist: 150, style: "saberRush", col: "#00f0ff", callout: "BLADE BLITZ!", desc: "Dashes through enemy ranks with a spinning blade cleave that bisects foes in the path!" };
  }
  if ([1, 16, 21, 25, 47, 54].includes(cid)) {
    return { name: "Jetpack Rocket-Jump & Slam", cd: 4.5, dist: 165, style: "jetpackSlam", col: "#ff9100", callout: cid === 54 ? "JETPACK THRUST — CLEAR THE LZ!" : "THRUSTERS FULL BURN!", desc: "Ignites jetpack thrusters to rocket-jump over obstacles and slam down with an explosive blast wave!" };
  }
  if (cid >= 56 && cid <= 75) {
    const spellCall = cid === 70 ? "AVADA FLIGHT!" : (cid === 71 ? "SHADOWFAX HASTE!" : (cid === 73 ? "SLING-RING PORTAL!" : (cid === 75 ? "WRAITH PHASE!" : "APPARATE!")));
    return { name: "Arcane Apparition Blink", cd: 4.0, dist: 160, style: "apparitionBlink", col: "#b388ff", callout: spellCall, desc: "Shouts an incantation and teleports through a crack of arcane smoke & lightning, blasting foes at both ends!" };
  }
  if ([51, 52, 6, 13, 41, 42].includes(cid)) {
    return { name: "Gunslinger Dive-Roll & Volley", cd: 3.8, dist: 140, style: "gunslingerRoll", col: "#ffd166", callout: cid === 51 ? "CENTER-AXIS TAKEDOWN!" : "DRAW!", desc: "Executes an evasive combat dive-roll and fires a 360-degree crit volley on landing!" };
  }
  return { name: "Tactical Phase-Thruster Dash", cd: 4.2, dist: 145, style: "tacDash", col: "#00e5ff", callout: "BREACHING!", desc: "Surges forward with tactical thrusters, knocking back and stunning enemies in the lane!" };
}

/* === 4. ALL 80 BESPOKE CANON CHARACTER OUTFIT PALETTES === */
const BLADE_COLORS = [
  ["Skywalker Cyan", "#00f0ff"], ["Yoda / Qui-Gon Emerald", "#00e676"], ["Sith Vader/Maul Crimson", "#ff1744"],
  ["Windu Electrum Amethyst", "#d500f9"], ["Temple Guard Gold", "#ffd166"], ["Darksaber Obsidian", "#212121"], ["Ahsoka Pure White", "#ffffff"]
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
  [["Kaleesh Bone Mask","#eceff1"],["Crimson Warlord Helm","#b71c1c"],["Battle-Scarred Alloy","#90a4ae"],["Cyborg Rib-Plating","#cfd8dc"],["General Crimson Trim","#b71c1c"],["Obsidian Alloy","#263238"],["Talon Cyborg Greaves","#90a4ae"],["Heavy Plated Armor","#455a64"],["General's Flowing Cape","#8e1b1b"],["No Cape (Unbound 4-Arms)","none"]],
  [["Round Glasses & Scar","#141418"],["Quidditch Goggles","#b71c1c"],["Auror Messy Hair","#1b1e23"],["Gryffindor Robe & Tie","#7f1d1d"],["Scarlet Quidditch Jersey","#d32f2f"],["Invisibility Shimmer","#455a64"],["Charcoal School Trousers","#1c2024"],["Dragon-Hide Boots","#3e2723"],["Gryffindor Cloak","#181a1f"],["Firebolt Back-Mount","#6d4c41"]],
  [["Bushy Brown Curls","#5d4037"],["Yule Ball Updo","#4e342e"],["Prefect Badge Hair","#3e2723"],["Gryffindor Sweater & Tie","#37474f"],["Pink Hoodie & Jacket","#ad1457"],["Ministry Coat","#263238"],["Pleated Skirt & Socks","#212121"],["Denim Jeans","#1565c0"],["Gryffindor Cloak","#181a1f"],["Beaded Handbag","#8e24aa"]],
  [["Ginger Shag Hair","#e65100"],["Keeper Helmet","#b71c1c"],["Chudley Cap","#ff6d00"],["Maroon Knit Sweater","#6a1b1b"],["Weasley Twin Suit","#4a148c"],["Keeper Chestpad","#b71c1c"],["School Trousers","#263238"],["Pinstripe Pants","#311b92"],["Gryffindor Cloak","#181a1f"],["Firework Box Pack","#ff9100"]],
  [["Spectrespecs & Blonde","#fff59d"],["Roaring Lion Hat","#ffd166"],["Radish Earrings","#ffe082"],["Ravenclaw Blue Tie","#1565c0"],["Tweed Butterbeer Coat","#4db6ac"],["Silver Raven Robe","#283593"],["Blue Striped Stockings","#0277bd"],["Yellow Boots","#fbc02d"],["Ravenclaw Cloak","#0d1b2a"],["Quibbler Satchel","#ab47bc"]],
  [["Swept Brown Hair","#4e342e"],["Bubble-Head Charm","#80deea"],["Seeker Hood","#fbc02d"],["Yellow & Black Tunic","#f57f17"],["Hufflepuff Prefect Robe","#212121"],["Maze Champion Jacket","#ffb300"],["Black Breeches","#181a1d"],["Quidditch Greaves","#5d4037"],["Hufflepuff Cloak","#1c1914"],["Triwizard Cup Glow","#00e5ff"]],
  [["Wild Mane & Beard","#3e2723"],["Dragon Goggles","#4e342e"],["Fuzzy Earmuffs","#d84315"],["Moleskin Overcoat","#5d4037"],["Hairy Brown Suit","#6d4c41"],["Leather Apron","#4e342e"],["Giant Boots","#261c18"],["Patchwork Trousers","#3e2723"],["Moleskin Greatcoat","#4e342e"],["Crossbow & Quiver","#795548"]],
  [["Slicked Platinum Blonde","#fff9c4"],["Inquisitorial Pin","#eceff1"],["Dark Mark Hood","#141619"],["Slytherin Emerald Tie","#1b5e20"],["Black Tailor Suit","#111111"],["Seeker Green Tunic","#2e7d32"],["Black Dress Slacks","#0d0f12"],["Polished Dragon Boots","#1b1e23"],["Slytherin Cloak","#0d1912"],["Nimbus 2001 Mount","#212121"]],
  [["Grey-Streaked Hair","#795548"],["Wolfish Gold Eyes","#8d6e63"],["Alpha Werewolf Head","#455a64"],["Shabby Tweed Jacket","#6d5c46"],["Professor Robes","#4e342e"],["Torn Lycan Fur","#37474f"],["Patched Trousers","#4e4537"],["Wolf Digitigrade Legs","#263238"],["Tattered Professor Cloak","#3e3830"],["Full-Moon Aura","#cfd8dc"]],
  [["Long Wavy Azkaban Locks","#261e1b"],["Wanted Poster Scowl","#1b1e23"],["Padfoot Grim Hound","#111111"],["Striped Prison Coat","#37474f"],["Velvet Black Coat","#4a148c"],["Grim Black Fur","#141416"],["Ragged Trousers","#263238"],["Biker Leather Boots","#111111"],["Velvet Duster","#1c1424"],["Motorbike Exhaust","#90a4ae"]],
  [["Spinning Magical Eye","#8d6e63"],["Battered Bowler Hat","#3e2723"],["Battle-Scarred Grizzle","#78909c"],["Scarred Leather Duster","#5d4037"],["Auror Red Robe","#7f1d1d"],["Buckled Armor Coat","#37474f"],["Wooden Claw-Foot Peg","#4e342e"],["Heavy Auror Boots","#212121"],["Weather-Beaten Duster","#4e342e"],["Hip-Flask & Staff","#90a4ae"]],
  [["Tall Emerald Witch Hat","#004d40"],["Square Spectacles Bun","#455a64"],["Silver Tabby Markings","#78909c"],["Emerald Tartan Robes","#00695c"],["Formal Black Gown","#181a1f"],["Highland Plaid","#1b5e20"],["Emerald Skirt Hem","#004d40"],["Dark Dress Boots","#111111"],["Emerald Velvet Cloak","#00332c"],["No Cloak","none"]],
  [["Curtained Black Hair","#0a0a0c"],["Half-Blood Hood","#141619"],["Occlumency Scowl","#111111"],["Buttoned Frock Coat","#101216"],["Potions Master Robe","#181a1f"],["Death-Flight Smoke","#212121"],["Black Tailored Slacks","#080a0d"],["Dragon-Hide Boots","#111111"],["Billowing Bat-Cloak","#08090c"],["Silver Doe Patronus","#80deea"]],
  [["Wild Tangled Curls","#1a1412"],["Azka-Skull Hood","#212121"],["Manic Dark Crown","#111111"],["Laced Leather Corset","#1c141d"],["Swirling Dark Gown","#120d14"],["Silver Dagger Belt","#263238"],["Tattered Gothic Hem","#0d0a0f"],["Spiked Heel Boots","#111111"],["Dark-Order Cloak","#140e18"],["Green Dark-Mark Cloud","#00e676"]],
  [["Half-Moon Specs & Beard","#eceff1"],["Tassel Wizard Hat","#7e57c2"],["Young Auburn Beard","#8d6e63"],["Midnight Star Robes","#311b92"],["Silver & Gold Silk","#cfd8dc"],["Plum Velvet Suit","#4a148c"],["Embroidered Hem","#1a0f30"],["Buckled Wizard Shoes","#4e342e"],["Starlight Flowing Cloak","#311b92"],["Fawkes Phoenix Perch","#ff6d00"]],
  [["Slit-Nostril Pale Bald","#e0e7e9"],["Red-Eyed Serpent Visage","#cfd8dc"],["Shadow Hood","#111111"],["Tattered Dark Shroud","#101614"],["Slytherin Heir Robe","#1b3022"],["Smoke Tendril Tunic","#181a1d"],["Bare Pale Feet","#cfd8dc"],["Shadow Hem","#0a0d0c"],["Living Smoke Cloak","#0d1210"],["Coiled Nagini Serpent","#2e7d32"]],
  [["Pointed Grey Hat & Beard","#78909c"],["Radiant White Crown","#ffffff"],["Windblown Pilgrim","#90a4ae"],["Pilgrim Grey Robes","#607d8b"],["Gandalf the White","#eceff1"],["Mithril-Threaded Tunic","#cfd8dc"],["Grey Travelling Hem","#455a64"],["White Rider Boots","#e0e0e0"],["Grey Pilgrim Cloak","#546e7a"],["Glamdring Scabbard","#ffd166"]],
  [["Long White Hair & Beard","#eceff1"],["Orthanc Crown","#263238"],["Many-Colored Hood","#cfd8dc"],["Ivory White Robes","#e0e0e0"],["Robe of Many Colors","#b0bec5"],["Isengard Iron Trim","#37474f"],["White Robe Hem","#bdbdbd"],["Obsidian Boots","#1c2024"],["White Hand Cloak","#cfd8dc"],["Palantír Seeing-Stone","#ff6d00"]],
  [["Silver-Temples & Goatee","#1c2024"],["Astral Form Glow","#80deea"],["Defender Ponytail","#263238"],["Kamar-Taj Blue Tunic","#1565c0"],["Sanctum Master Robes","#0d47a1"],["Dark Defender Suit","#1b1e23"],["Bound Shin Wraps","#263238"],["Sanctum Boots","#3e2723"],["Cloak of Levitation","#b71c1c"],["Eye of Agamotto","#00e676"]],
  [["Scarlet Tiara & Auburn","#d32f2f"],["Darkhold Black-Tips","#8e0000"],["Sokovian Waves","#a1887f"],["Scarlet Corset & Coat","#b71c1c"],["Darkhold Corrupted Armor","#4a0e17"],["Civil Leather Jacket","#880e4f"],["Black Tactical Pants","#141619"],["Crimson Boots","#4a0e17"],["Scarlet Hex Cape","#8e0000"],["Floating Darkhold Pages","#ff1744"]],
  [["Skull-Crown & Hood","#212121"],["Lich Glowing Skull","#cfd8dc"],["Horned Necro-Helm","#311b92"],["Bone-Ribbed Vestments","#261838"],["Flesh-Stitched Robes","#3e2723"],["Arch-Lich Plate","#1a1224"],["Tattered Crypt Hem","#120d16"],["Skeletal Greaves","#90a4ae"],["Shroud of the Damned","#1c102b"],["Floating Bone Totems","#b388ff"]],
  // #76-#79 New Star Wars Legends Palettes
  [["Obsidian Sith Dome Helm","#111317"],["Battle-Damaged Scarred Mask","#263238"],["Mustafar Hooded Anakin","#3e2723"],["Cybernetic Chest-Box Armor","#181b20"],["Emperor's Wrath Durasteel","#0d0f12"],["Jedi General Dark Tunic","#261c18"],["Armored Sith Greaves","#111111"],["Cybernetic Alloy Legs","#37474f"],["Flowing Sith Cape","#0a0b0e"],["No Cape","none"]],
  [["Crown of Horns & Red Tattoos","#d50000"],["Hooded Naboo Assassin","#111111"],["Nightbrother Gold Markings","#ff9100"],["Sith Sleeveless Tunic","#141619"],["Mandalore Crimson Mail","#7f1d1d"],["Bare Tattooed Chest","#b71c1c"],["Sith Martial Trousers","#111111"],["Cybernetic Spider-Greaves","#78909c"],["Naboo Sith Cloak","#111111"],["No Cloak (Agile)","none"]],
  [["Korun Jedi Master Bald","#6d4c41"],["Clone Wars General Helm","#cfd8dc"],["Temple Hood","#4e342e"],["Jedi Council Cream Tunic","#d7ccc8"],["Clone General Plate & Robe","#8d6e63"],["Dark Vaapad Vestments","#3e2723"],["Jedi Boots & Trousers","#4e342e"],["Armored General Greaves","#eceff1"],["Jedi Master Cloak","#5d4037"],["No Cloak","none"]],
  [["Ancient Green Ears & Wisps","#7cb342"],["Hooded Dagobah Sage","#689f38"],["High Republic Gold Circlet","#8bc34a"],["Jedi Grandmaster Cream Robe","#d7ccc8"],["High Council Brown Tunic","#5d4037"],["Dagobah Woven Vest","#795548"],["Short Jedi Hem & Feet","#689f38"],["Council Sandals","#4e342e"],["Grandmaster Small Cloak","#bcaaa4"],["No Cloak (Acrobatic)","none"]]
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

/* === 5. ALL 80 BESPOKE 2-BUTTON UTILITY KITS (#00-#79) === */
const UTILS_56 = [
  [["Saber Throw",6.5,"quadSpin","orbit","Hurls spinning lightsaber to impale & rip back"],["Force Repulse",10,"factionPulse","nova","Telekinetic wave blasts back surrounding foes"]],
  [["Whistling Birds",120,"whistlingBirds","missile","Vambrace swarm: looping, homing micro-munitions wipe out EVERY non-boss enemy on screen (bosses & rivals take heavy damage). 120s cooldown"],["Beskar Grapple",8.5,"grappleHook","grapple","Tethers & stuns the strongest nearby target"]],
  [["Barrage Volley",6.5,"fanHammer","cone","Fires a rapid E-11 suppressive blaster fan"],["Thermal Detonator",11,"factionPulse","nova","Detonates a high-yield Imperial baradium charge"]],
  [["Force Storm",7.5,"critBurst","chain","Unleashes a 360-degree dark lightning web"],["Dark Siphon",11,"executeDash","beam","Crushes and executes weakened nearby enemies"]],
  [["Oil Igniter",7,"flameCone","flame","Sprays burning thruster oil in a forward cone"],["Arc Overload",9.5,"factionPulse","nova","Shocks and stuns all surrounding enemies"]],
  [["Bowcaster Volley",7,"fanHammer","cone","Fires an explosive quarrel spread"],["Wookiee Slam",10,"factionPulse","nova","Ground-shattering Kashyyyk war roar"]],
  [["Lucky Fan-Shot",6,"fanHammer","beam","Blazing Corellian hip-fire blaster fan"],["Smuggler Rig",14,"buildFort","fort","Drops emergency cargo cover & mines"]],
  [["Solar Flare",7.5,"factionPulse","nova","Erupts a blinding Eye of Ra solar shockwave"],["Mind Crush",10,"executeDash","beam","Shatters nearby enemies with ascended wrath"]],
  [["P90 Mag-Dump",6.5,"fanHammer","beam","Fires an armor-piercing P90 horizontal sweep"],["Plant C4",15,"buildFort","fort","Deploys C4 mines and sandbag cover"]],
  [["Staff Overcharge",7,"fanHammer","missile","Unleashes a concentrated plasma staff salvo"],["Zat Stun-Wave",10,"factionPulse","chain","Disintegrates and stuns nearby hostiles"]],
  [["Thor's Hammer",8,"executeDash","beam","Calls down an orbital Asgard ion strike"],["Phase Blink",9.5,"factionPulse","nova","Teleports and emits a shield shockwave"]],
  [["Wraith Web",8,"grappleHook","grapple","Cocoons the strongest enemy in bio-webbing"],["Feeding Surge",9.5,"executeDash","chain","Drains life-force from surrounding targets"]],
  [["Hallowed Ring",7.5,"factionPulse","nova","Unleashes a sacred ring of Origin fire"],["Prior Staff",9,"critBurst","orbit","Projects 360-degree telekinetic force bolts"]],
  [["Browncoat Fan",6.5,"fanHammer","cone","Rapid-fires brass revolver across the line"],["Barfight Toss",10,"executeDash","beam","Throws back and stuns close-quarters foes"]],
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
  [["Smart-Disc Spin",6.5,"quadSpin","orbit","Recalls razor smart-discs in a lethal ring"],["Shoulder Plasma",8.5,"executeDash","beam","Locks tri-laser onto high-value targets"]],
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
  [["Spinner Barrage",7,"critBurst","missile","Fires precision LAPD blaster bolts in 360 degrees"],["Baseline Lock",9,"executeDash","beam","Retires rogue targets with headshots"]],
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
  [["Quad-Blade Whirlwind",5.5,"quadSpin","orbit","Spins 4 plasma blades in a deadly defensive cyclone"],["Cyborg Overclock",11,"cyborgRush","beam","Doubles attack rate and movement speed for 4.5 seconds"]],
  [["Expecto Patronum",8,"patronusStag","nova","Summons a radiant Silver Stag Patronus that charges & banishes foes"],["Expelliarmus",6,"factionPulse","beam","Scarlet disarming beam blasts enemies backward & stuns"]],
  [["Wingardium Leviosa",7.5,"leviosaFloat","orbit","Floats nearby enemies skyward & drifts them off-screen for XP!"],["Time-Turner Rewind",12,"timeRewind","nova","Rewinds time: heals 35% HP, resets spell cooldowns & freezes foes"]],
  [["Weasley Whiz-Bangs",7,"explosiveBow","missile","Launches exploding dragon-firework rockets across the sector"],["Summon Chess Knight",12,"piertotumKnights","fort","Summons an armored Wizard's Chess Knight to cleave enemies"]],
  [["Levicorpus Float",7.5,"leviosaFloat","orbit","Dangles enemies upside-down by the ankle & floats them away!"],["Hare Patronus",8.5,"patronusStag","nova","Conjures a bounding silver Hare Patronus shockwave"]],
  [["Rock-to-Hound",10,"summonHound","orbit","Transfigures stones into loyal allied Hounds that maul foes"],["Triwizard Flare",7,"fanHammer","beam","Fires a golden star-flare volley across the horizon"]],
  [["Call Fang & Norbert",10,"summonHound","flame","Calls Fang & baby dragon Norbert to torch & maul enemies"],["Umbrella Blast",7.5,"flameCone","cone","Fires a chaotic pink-umbrella spell cone"]],
  [["Serpensortia",9,"summonHound","chain","Conjures venomous Slytherin vipers that attack nearby enemies"],["Fiendfyre Wyrm",11,"flameCone","flame","Unleashes cursed Fiendfyre flames that incinerate everything"]],
  [["Full-Moon Werewolf",11,"cyborgRush","orbit","Transforms into a rapid-slashing Alpha Werewolf for 5s"],["Riddikulus Banish",8,"factionPulse","nova","Banishes & stuns surrounding foes in a burst of laughter"]],
  [["Padfoot Grim Pack",9.5,"summonHound","orbit","Summons allied black Grim Hounds to tear through enemies"],["Azka-Bark Shockwave",7.5,"factionPulse","nova","Unleashes a concussive Animagus howl"]],
  [["Auror Staff Thump",7,"youShallNotPass","nova","Slams staff to erect a shockwave ward that blasts foes back"],["Avada Counter-Volley",8.5,"fanHammer","beam","Sweeps Auror hex bolts in a wide arc"]],
  [["Piertotum Locomotor",10.5,"piertotumKnights","fort","Animates Hogwarts Stone Armor Knights to do their duty!"],["Transfigure Ferret",7.5,"leviosaFloat","beam","Transfigures & floats enemies helplessly into the sky"]],
  [["Sectumsempra",6.5,"sectumSlash","orbit","Invisible high-speed wand slashes sever limbs & open arterial bleeds!"],["Levicorpus Hoist",8,"leviosaFloat","chain","Hoists enemies into the air by their ankles"]],
  [["Cruciatus Web",7.5,"stareFreeze","chain","Casts crimson Cruciatus lightning that paralyzes all nearby foes"],["Silver Dagger Throw",6.5,"quadSpin","orbit","Hurls her cursed silver blade to impale & rip back"]],
  [["Firestorm Parting",8,"flameCone","flame","Waves the Elder Wand in a sweeping vortex of parting fire"],["Fawkes Rebirth Song",12,"timeRewind","nova","Fawkes heals your wounds & unleashes a golden phoenix wave"]],
  [["Avada Kedavra",7,"avadaKedavra","chain","Fires the jagged neon-green Killing Curse—instantly slays foes!"],["Summon Nagini",10,"summonHound","orbit","Unleashes Nagini to strike & venom-shred enemies"]],
  [["You Shall Not Pass!",9.5,"youShallNotPass","nova","Slams Staff & Glamdring—erects an impassable bridge rune barrier!"],["Flame of Anor",7.5,"patronusStag","beam","Blinding white Istari sunburst burns all shadow foes"]],
  [["Voice of Orthanc",8.5,"stareFreeze","nova","Commands all on-screen enemies to freeze in terror"],["Isengard Fire-Mine",10,"explosiveBow","missile","Hurls Orthanc blasting-fire orbs that detonate on impact"]],
  [["Mirror Dimension",9,"youShallNotPass","nova","Erects a crystalline Mirror Dimension barrier that reflects bolts"],["Eye of Agamotto",11.5,"timeRewind","orbit","Freezes time across the sector & rewinds cooldowns"]],
  [["Chaos Levitation",7,"leviosaFloat","nova","Wraps enemies in scarlet hexes & floats them off-screen to die!"],["Rewrite Reality",10.5,"avadaKedavra","chain","Disintegrates surrounding enemies in a scarlet chaos wave"]],
  [["Raise Dead Army",6.5,"raiseDead","chain","Consumes nearby corpses to resurrect Skeletal Warriors & Archers!"],["Summon Bone Golem",12,"piertotumKnights","fort","Consumes corpses to raise a Colossal Bone Golem juggernaut!"]],
  // #76-#79 Star Wars Legends Utilities
  [["Force Choke Crush",7.5,"stareFreeze","chain","Lifts, chokes & crushes surrounding enemies across the sector"],["Imploding Saber Throw",6.5,"quadSpin","orbit","Hurls crimson lightsaber to impale & rip back through ranks"]],
  [["Saberstaff Cyclone",5.5,"quadSpin","orbit","Whirls double-bladed saberstaff in a 360-degree crimson buzzsaw"],["Sith Choke Push",8.0,"factionPulse","nova","Unleashes a ferocious Dathomir Force shockwave"]],
  [["Shatterpoint Strike",7.0,"executeDash","orbit","Instantly fractures armor weak-points on surrounding enemies & bosses"],["Vaapad Repulse",8.5,"factionPulse","nova","Channels inner darkness into a purple telekinetic shockwave"]],
  [["Ataru Sonic Flip-Slam",5.5,"quadSpin","orbit","Launches into a blinding mid-air multi-flip emerald whirlwind"],["Tutaminis Force Absorb",8.5,"youShallNotPass","nova","Absorbs incoming energy & erupts a luminous Force ward"]]
];

function getHeroUtils(cid) {
  const pair = UTILS_56[cid] || UTILS_56[0];
  return [
    { name: pair[0][0], cdMax: pair[0][1], cd: 0, type: pair[0][2], icon: pair[0][3], desc: pair[0][4] },
    { name: pair[1][0], cdMax: pair[1][1], cd: 0, type: pair[1][2], icon: pair[1][3], desc: pair[1][4] }
  ];
}

/* === 6. ALL 80 BESPOKE 3-LINE HERO QUOTES (#00-#79) === */
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
  ["The right man in the wrong place can make all the difference.", "HEV Mark-IV suit administering morphine.", "Zero-point energy field manipulator charged!"],
  ["Wibbly-wobbly, timey-wimey... stuff.", "Allons-y! Sonic emitter at maximum resonance!", "I don't want to go—regeneration energy surging!"],
  ["Chozo Varia matrix online—morph ball ready.", "Hyper-beam charged to full capacity.", "The last Metroid is in captivity—the galaxy is at peace."],
  ["Wind's howling... medallion's humming.", "Steel for humans, silver for monsters.", "Toss a coin—the White Wolf hunts tonight."],
  ["Ph'nglui mglw'nafh Cthulhu R'lyeh!", "The stars have aligned above the sunken city.", "Gaze into the non-euclidean abyss!"],
  ["Another limb lost in the Bonefields—toughness rising!", "Beep is the strongest warrior in the Ashlands!", "My Meitou Falling-Sun blade drinks again."],
  ["Yeah... I'm thinking I'm back.", "Rules. Without them, we live with the animals.", "Consequences."],
  ["In this world there's two kinds of people, my friend...", "My mule don't like people laughing.", "Get three coffins ready... my mistake, four."],
  ["To survive a war, you gotta become war.", "Out here in the forest, I am the law.", "Nothing is over! Nothing!"],
  ["He's no good to me dead.", "As you wish.", "Put Captain Solo in the cargo hold."],
  ["Your lightsabers will make a fine addition to my collection!", "Army or not, you must realize you are doomed.", "I have been trained in your Jedi arts!"],
  ["Expecto Patronum!", "Expelliarmus! I solemnly swear I am up to no good.", "Come on, Tom—let's finish this the way we started it!"],
  ["It's Levi-O-sa, not Levio-SA!", "When in doubt, go to the library—or cast Protego Totalum!", "Three turns of the Time-Turner should do it!"],
  ["Bloody hell! Light up the Wildfire Whiz-Bangs!", "Knight to E-5! You've got to make some sacrifices!", "Eat slugs, Malfoy!"],
  ["You're just as sane as I am.", "Careful, there's a swarm of Wrackspurts around your head!", "Wit beyond measure is man's greatest treasure."],
  ["For Hufflepuff and the Triwizard Cup!", "Take my body back to my father... or fight beside me now!", "Fair play and a steady wand win the maze."],
  ["Yer a wizard, Harry!", "Shouldn'ta said that... I definitely shouldn'ta said that!", "Sic 'em, Fang! Mind Norbert's tail!"],
  ["My father will hear about this!", "Scared, Potter? Serpensortia!", "Training for the ballet, Potter?"],
  ["Mischief Managed! Riddikulus!", "It is the quality of one's convictions that determines success.", "Eat this chocolate—you'll feel right as rain."],
  ["I did my waiting! Twelve years of it—in Azkaban!", "The ones that love us never really leave us.", "Nice one, James! Let Padfoot loose!"],
  ["CONSTANT VIGILANCE!", "Mad-Eye sees right through the back of his own head!", "Is that a student? Technically it's a ferret!"],
  ["Piertotum Locomotor! Hogwarts is threatened—do your duty!", "I've always wanted to use that spell!", "Have a biscuit, Potter."],
  ["Turn to page three hundred and ninety-four.", "Sectumsempra! You dare use my own spells against me?", "Always."],
  ["I killed Sirius Black! Ha-ha-ha!", "You have to mean an Unforgivable Curse, Potter!", "Crucio! The Dark Lord rises again!"],
  ["Happiness can be found, even in the darkest of times, if one remembers to turn on the light.", "It is our choices, Harry, that show what we truly are.", "Fawkes, to me!"],
  ["Avada Kedavra!", "There is no good and evil—there is only power!", "Nagini... dinner!"],
  ["YOU SHALL NOT PASS!", "I am a servant of the Secret Fire, wielder of the flame of Anor!", "A wizard is never late—he arrives precisely when he means to."],
  ["Against the power of Mordor there can be no victory.", "A new power is rising—its victory is at hand!", "So you have chosen... death."],
  ["Dormammu, I've come to bargain!", "By the Hoary Hosts of Hoggoth—into the Mirror Dimension!", "I went forward in time to view fourteen million outcomes."],
  ["You took everything from me.", "No more mutants... no more mercy.", "That doesn't seem fair—let's rewrite reality."],
  ["Klaatu... Barada... Nikto! Rise from your graves!", "Every corpse on this battlefield belongs to my Grimoire!", "Skeletal Legion, Bone Golems—awaken and march!"],
  // #76-#79 Star Wars Legends Quotes
  ["I find your lack of faith disturbing.", "All I am surrounded by is fear... and dead men.", "You don't know the power of the Dark Side!"],
  ["At last we will reveal ourselves to the Jedi—at last we will have revenge!", " Kenobi... KENOOOBIII!", "My double-bladed saberstaff hungers for battle!"],
  ["This party's over.", "He's too dangerous to be left alive—Vaapad engaged!", "Take a seat, young Skywalker."],
  ["Do. Or do not. There is no try.", "Size matters not! Judge me by my size, do you?", "Much to learn, you still have!"]
];

function getBossQuote(cid, facId) {
  const arr = Q_56[cid] || Q_56[0];
  return arr[Math.floor(Math.random() * arr.length)];
}

/* === 7. HERO ALIGNMENTS & RIVAL INVASION CALLOUTS === */
const BAD_HEROES = [2, 3, 7, 9, 11, 12, 17, 19, 21, 23, 26, 30, 36, 37, 49, 55, 62, 68, 70, 72, 75, 76, 77];
const BOUNTY_HEROES = [1, 6, 15, 29, 41, 42, 48, 50, 51, 52, 54, 64, 65, 67, 74];
function getHeroAlign(cid) {
  return BOUNTY_HEROES.includes(cid) ? "bounty" : (BAD_HEROES.includes(cid) ? "bad" : "good");
}

const MATCHUP_LINES = {
  "54_0": "Jedi bounty! Vader said no disintegrations... maybe just one!",
  "54_6": "Put Captain Solo in the cargo hold—you're worth a fortune frozen!",
  "3_0": "At last we will reveal ourselves to the Jedi. Join the Dark Side!",
  "0_3": "I will do what I must, Sith!",
  "76_0": "The Force is with you, young Skywalker... but you are not a Jedi yet!",
  "0_76": "I'll never turn to the Dark Side! I am a Jedi, like my father before me!",
  "76_54": "Remember, bounty hunter: no disintegrations!",
  "77_0": "Your master couldn't save himself—and neither will you, Jedi!",
  "78_3": "In the name of the Galactic Senate of the Republic, you are under arrest, Chancellor!",
  "3_78": "Are you threatening me, Master Jedi?!",
  "79_3": "At an end your rule is, and not short enough it was!",
  "3_79": "Master Yoda... you survived!",
  "79_76": "Twisted by the Dark Side, young Skywalker has become.",
  "8_7": "I knew you were a Goa'uld—eyes glowing and everything!",
  "8_9": "Jaffa, kree! Tell your false god Jack O'Neill says hello!",
  "7_8": "Insolent Tau'ri! Kneel before Anupas!",
  "52_51": "Nice suit, city boy... let's see if it stops a .45 Colt.",
  "51_52": "Six bullets? I only need one.",
  "53_40": "Man versus machine... welcome to my forest!",
  "29_30": "A worthy Xenomorph Queen skull for the trophy wall!",
  "55_0": "Ah, another fine lightsaber for my collection, Jedi!",
  "70_56": "Harry Potter... the Boy Who Lived, come to die! Avada Kedavra!",
  "56_70": "Expelliarmus! Neither can live while the other survives, Riddle!",
  "68_64": "I killed Sirius Black! Coming to join your cousin, Padfoot?!",
  "64_68": "Come on then, Bellatrix—you can do better than that!",
  "69_70": "It was foolish of you to come tonight, Tom. The Aurors are on their way.",
  "70_69": "By which time I shall be gone, and you shall be dead, Dumbledore!",
  "67_56": "You dare use my own spells against me, Potter? I am the Half-Blood Prince!",
  "57_62": "You foul, loathsome, evil little cockroach, Malfoy!",
  "71_72": "Saruman! Your staff is broken!",
  "72_71": "You have elected the way of pain, Gandalf!"
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
    "Hold it! Command says you're compromised—could be a Polyjuice impostor or Cylon!",
    "Intel flagged you as a rogue illusion! Drop your wand and weapons now!",
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
