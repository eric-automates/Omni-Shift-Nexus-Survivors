// FILE: js/combat.js
// PART: 11 of 14
// DETAIL: v8.2 Overhaul — All 80 Hero Signature Gear (#00-#79), Canonical Starting Weapon Colors (bladeCol), Fixed Cumulative Top-Bar Spellbook, 80-Hero Bespoke Dash Engine (executeHeroDash), Reconnected CQC Gun-Fu (cqcCD), and Corpse-Only Necromancy.

"use strict";

/* === 1. ALL 80 HEROES' LV.5 PRIMARY TRANSITIONS, EQUIP CALLOUTS & SECONDARY HARDWARE (#00-#79) === */
const HERO_SIG_GEAR = [
  ["Bespin Master Lightsaber", "SKYWALKER SABER IGNITED!", "Force Telekinetic Push", 6, 1.3, 7.5],
  ["IB-94 & Pure Beskar Spear", "IB-94 DRAWN. THIS IS THE WAY.", "Amban Phase-Pulse Shot", 4, 1.6, 7.0],
  ["DLT-19 Heavy Repeating Blaster", "IMPERIAL COMLINK & E-11 LOCKED!", "Thermal Detonator Toss", 2, 1.4, 8.0],
  ["Dual Senate Guard Sabers", "DARK SIDE LIGHTNING CHARGED!", "Force Choke & Chain Arc", 5, 1.5, 6.5],
  ["Dual Periscope Arc-Welder", "ASTROMECH SERVOS & THRUSTERS ONLINE!", "Burning Oil Slick & Zap", 6, 1.3, 6.0],
  ["Heavy Twin-Quarrel Bowcaster", "BANDOLIER CHARGED — WOOKIEE ROAR!", "Kashyyyk Satchel Charge", 2, 1.6, 8.0],
  ["Modified Hair-Trigger DL-44", "DL-44 UNHOLSTERED — NEVER TELL ME THE ODDS!", "Lucky Sabacc Detonator", 3, 1.4, 7.5],
  ["Ascended Staff of Ra", "GOA'ULD KARA KESH RIBBON ARMED!", "Solar Orb Bombardment", 6, 1.6, 7.0],
  ["Carter Special Micro-Carbine", "FN-P90 RACKED & C4 DETONATOR SET!", "Remote C4 Blast", 6, 1.5, 8.0],
  ["First-Prime Twin Ma'Tok", "SERPENT HELM LOCKED — JAFFA KREE!", "Zat'nik'tel Triple-Arc", 5, 1.4, 7.0],
  ["Thor's Chariot Ion Array", "ASGARD BEAMING SENSORS ONLINE!", "Asgard Drone Strike", 4, 1.5, 6.5],
  ["Queen's Feeding Hand & Stunner", "HIVE TELEPATHY & BIO-STUNNER ARMED!", "Wraith Culling Beam", 5, 1.4, 7.5],
  ["Staff of the Ori Crusade", "HALLOWED ARE THE ORI — STAFF LIT!", "Prior Plague Shockwave", 6, 1.5, 8.0],
  ["Serenity Bridge Carbine & Pistol", "MOSES BROTHERS SIDEARM DRAWN!", "Browncoat Grenade Toss", 3, 1.4, 7.5],
  ["Tam Twin Miranda Cleavers", "TWO BY TWO, HANDS OF BLUE — BLADES OUT!", "Psychic Precog Slash", 7, 1.6, 6.0],
  ["Vera Custom Sniper-Mod", "VERA CHAMBERED IN SPACE-SUIT!", "Luxan Frag Grenade", 2, 1.5, 7.5],
  ["Crazy-Ivan Thruster Array", "FLIGHT CONTROLS & DINOSAURS SET!", "Shuttle Exhaust Blast", 6, 1.4, 7.0],
  ["Twin Reactor-Core Buzzsaws", "HARPOON CHAINS & SPIKES LOCKED!", "Mutagenic Acid Spit", 3, 1.5, 6.5],
  ["Maker's Tooth & Maula Pistol", "CRYSKNIFE DRAWN — MAY THY KNIFE CHIP!", "Weirding Way Voice Blast", 3, 1.6, 6.5],
  ["Emperor's Lasgun & Slow-Blade", "SALUSA SECUNDUS SHIELD BELT ON!", "Shigawire Garrote Lash", 5, 1.4, 7.0],
  ["Gom Jabbar & Reverend Voice", "LITANY AGAINST FEAR RECITED!", "Mind-Paralyzing Pitch", 6, 1.5, 7.5],
  ["Bald Pale Baron's Mortar", "SUSPENSOR BELT LEVITATING!", "Giedi Mortar Shell", 2, 1.5, 8.0],
  ["Type-III Compression Phaser Rifle", "PHASERS SET TO VAPORIZE!", "Photon Grenade Volley", 2, 1.4, 7.5],
  ["Queen's Assimilation Matrix", "OCULAR IMPLANT & NANOPROBES LOCKED!", "Borg Cutting Laser", 4, 1.5, 7.0],
  ["Sword of Kahless & Mek'leth", "BAT'LETH RAISED FOR STO-VO-KOR!", "Disruptor Pistol Shot", 4, 1.5, 6.5],
  ["Mk-II Viper Twin KEW Cannons", "VIPER THRUSTERS & MAGNUM COCKED!", "Raptor Swallow-Swarm", 2, 1.4, 7.5],
  ["Heavy Dual Centurion Autocannons", "RED EYE SCANNER SWEEPING!", "Basestar Micro-Nuke", 2, 1.5, 8.0],
  ["M-300 Claymore & Biotic Charge", "OMNI-TOOL & BIOTIC AMP GLOWING!", "Biotic Nova Slam", 6, 1.5, 6.5],
  ["Vasquez Overclocked M56 & Pulse", "SMARTGUN SERVO-ARM & TRACKER ON!", "M40 Incendiary Grenade", 2, 1.5, 7.0],
  ["Elder Dual Wrist-Blades & Disc", "BIO-MASK THERMAL & PLASMA CASTER ON!", "Shoulder Plasma Caster", 4, 1.7, 6.0],
  ["Empress Scythe-Tail & Spit", "ROYAL CREST FLARED — HIVE AWAKENED!", "Pressurized Acid Spray", 3, 1.5, 6.5],
  ["Morita MK3 Carbine & Shotgun", "MORITA RACKED — ROUGHNECKS HO!", "Bug-Hole Tactical Nuke", 2, 1.5, 7.5],
  ["BR55 Battle Rifle & Energy Sword", "MJOLNIR SHIELDS & CORTANA ONLINE!", "M9 Frag & Plasma Stick", 2, 1.6, 7.0],
  ["Meathook SSG & Unmaykr", "SUPER SHOTGUN & FLAME BELCHER COCKED!", "Shoulder Flame-Belcher", 3, 1.7, 6.0],
  ["Master-Crafted Bolter & Relic Saw", "CHAINSWORD REVVED FOR THE EMPEROR!", "Backpack Krak Missile", 2, 1.6, 7.5],
  ["Solar Atomizer & Eradication Ray", "MECHADENDRITES & SERVO-SKULLS BLESSED!", "Mechadendrite Arc-Claw", 5, 1.5, 6.5],
  ["Synaptic Disintegrator & Warscythe", "REANIMATION PROTOCOLS & GAUSS LIT!", "Tesseract Scarab Swarm", 2, 1.5, 7.5],
  ["Deffgun & Power Klaw", "POWER KLAW CLAMPED — WAAAGH!", "Stickbomb & Rokkit Salvo", 2, 1.5, 7.0],
  ["Inquisitor Rosette & Force-Staff", "ROSETTE SHOWN — WARP CHANNELING!", "Purging Smite Bolt", 5, 1.5, 6.5],
  ["Lobby Arsenal & Awakened Code", "SHADES ON — BULLET TIME ENGAGED!", "Telekinetic Code Wave", 6, 1.6, 6.5],
  ["Phased-Plasma 40W & Minigun", "HUD TARGET ACQUIRED — TITANIUM ARMED!", "M79 Thumper Grenade", 2, 1.6, 7.0],
  ["Deckard Double-Trigger Blaster", "VOIGHT-KAMPFF CALIBRATED!", "Spinner Flechette Burst", 3, 1.5, 7.5],
  ["Arasaka Mantis Blades & Guts", "SANDEVISTAN SPINE IMPLANT PULSING!", "Wrist Projectile Launcher", 2, 1.6, 6.5],
  ["Gatling Laser & Fat-Man MIRV", "PIP-BOY 3000 & V.A.T.S. LOCKED!", "Nuka-Grenade Toss", 6, 1.6, 8.0],
  ["Quad-Barrel Boomstick & Harpoon", "GUZZOLINE INJECTED — WITNESS ME!", "Explosive Thunderstick", 2, 1.5, 7.0],
  ["Overcharged Blue Grav-Gun & Tau", "HEV SUIT & CROWBAR EQUIPPED!", "Punted Sawblade Ricochet", 4, 1.6, 6.5],
  ["Gallifreyan Moment & Sonic Matrix", "SONIC EMITTER EXTENDED — ALLONS-Y!", "Temporal Stasis Pulse", 6, 1.5, 7.5],
  ["Plasma-Ice-Wave Hyper Cannon", "VARIA SUIT & ARM CANNON CHARGED!", "Super Missile Salvo", 2, 1.6, 6.5],
  ["Grandmaster Aerondight & Crossbow", "SILVER SWORD DRAWN — MEDALLION HUMS!", "Igni Firestream Sign", 3, 1.6, 6.5],
  ["Necronomicon Eldritch Conduit", "ABYSSAL TOME OPENED — STARS ALIGNED!", "Void Tentacle Eruption", 5, 1.6, 7.0],
  ["Meitou Cross-Nodachi & Eagle Cross", "MEITOU BLADE UNSHEATHED IN THE ASH!", "Masterwork Crossbow Bolt", 4, 1.7, 6.0],
  ["Baba Yaga Primary 2011 & Benelli M4", "KEVLAR SUIT BUTTONED & KIMBER CHECKED!", "Continental Throwing Knife", 4, 1.7, 5.5],
  ["Dual Navy Revolvers & Henry Rifle", "PONCHO FLIPPED BACK — IRON READY!", "Lit Dynamite Bundle", 6, 1.7, 8.0],
  ["Dual-Belt M60E3 & Thermite Bow", "RED HEADBAND TIED & BOW STRINGED!", "Thermite Explosive Arrow", 2, 1.7, 7.0],
  ["Modified ESB EE-3 & Concussion Rifle", "WRIST GAUNTLETS & Z-6 JETPACK ARMED!", "Z-6 Jetpack Anti-Armor Missile", 2, 1.8, 7.5],
  ["Quad Jedi Trophy Sabers & Blaster", "CAPE DROPPED — FOUR ARMS UNLOCKED!", "Quad-Claw Grapple Blaster", 4, 1.8, 6.0],
  // #56-#75 Arcane Sanctum Spellcasters
  ["Holly Wand & Sword of Gryffindor", "LUMOS MAXIMA — HOLLY WAND LIT!", "Expecto Patronum Silver Stag", 6, 1.7, 7.0],
  ["Vine Wand & Runed Time-Turner", "PROTEGO TOTALUM — SPELLBOOK OPEN!", "Bluebell Flame Ring", 6, 1.6, 6.5],
  ["Weasley Wildfire Whiz-Bang Box", "BLOODY HELL — LIGHT THE FIREWORKS!", "Flying Ford Anglia Ram", 2, 1.6, 7.5],
  ["Spectrespec Astral Plum Wand", "WRACKSPURTS SPOTTED — WAND READY!", "Silver Hare Patronus", 6, 1.6, 7.0],
  ["Triwizard Champion Ash Wand", "HUFFLEPUFF CHAMPION READY!", "Rock-to-Hound Transfigure", 4, 1.6, 7.5],
  ["Pink Umbrella & Fang's Crossbow", "YER A WIZARD — HOLD ONTO FANG!", "Norbert Dragon Fire-Breath", 3, 1.7, 7.0],
  ["Malfoy Manor Hawthorn Wand", "MY FATHER WILL HEAR ABOUT THIS!", "Serpensortia Viper Strike", 5, 1.6, 7.0],
  ["Marauder's Cypress Defense Wand", "MISCHIEF MANAGED — WAND DRAWN!", "Full-Moon Lycan Slash", 6, 1.7, 7.0],
  ["Azka-Runed Animagus Wand", "PADFOOT UNCHAINED!", "Flying Motorbike Salvo", 2, 1.7, 7.0],
  ["Mad-Eye Thumping Staff & Wand", "CONSTANT VIGILANCE!", "Auror Staff Ground-Thump", 6, 1.7, 6.5],
  ["Grandmaster Transfiguration Wand", "PIERTOTUM LOCOMOTOR — DO YOUR DUTY!", "Animated Stone Knight", 4, 1.7, 7.5],
  ["Half-Blood Prince Ebony Wand", "TURN TO PAGE 394 — SECTUMSEMPRA!", "Sectumsempra Laceration", 7, 1.8, 6.0],
  ["Curved Walnut Wand & Silver Blade", "CRUCIO — DARK MARK IGNITED!", "Cruciatus Crimson Web", 5, 1.7, 6.5],
  ["The Elder Wand & Fawkes Plume", "ELDER WAND & FAWKES AWAKENED!", "Parting Firestorm Wave", 3, 1.8, 6.5],
  ["Yew Wand & Horcrux Nagini", "AVADA KEDAVRA — THE DARK LORD RISES!", "Avada Kedavra Killing Bolt", 5, 1.9, 6.5],
  ["Glamdring & White Rider Staff", "YOU SHALL NOT PASS!", "Flame of Anor Sunburst", 6, 1.8, 6.5],
  ["Orthanc Staff & Palantír Orb", "THE VOICE OF SARUMAN COMMANDS!", "Isengard Blasting Fire", 2, 1.7, 7.0],
  ["Cloak of Levitation & Agamotto", "BY THE HOARY HOSTS OF HOGGOTH!", "Crimson Bands of Cyttorak", 5, 1.8, 6.5],
  ["Darkhold Scarlet Crown & Hexes", "LET'S REWRITE REALITY!", "Chaos Levitation Crush", 6, 1.8, 6.5],
  ["Necronomicon Bone-Golem Grimoire", "KLAATU BARADA NIKTO — RISE FROM YOUR GRAVES!", "Corpse-Raiser Necro-Pulse", 5, 1.9, 6.0],
  // #76-#79 Star Wars Legends
  ["Dark Lord Djem So Crimson Saber", "VADER BREATHING — CRIMSON BLADE IGNITED!", "Dark Side Force Choke Wave", 6, 1.8, 6.5],
  ["Unbound Double-Bladed Saberstaff", "DUEL OF THE FATES — BOTH BLADES IGNITED!", "Dathomir Sith Shockwave", 6, 1.8, 6.5],
  ["Electrum Vaapad Master Saber", "AMETHYST BLADE LIT — THIS PARTY'S OVER!", "Shatterpoint Force Crush", 6, 1.8, 6.5],
  ["Grandmaster Ataru Emerald Shoto", "900 YEARS OLD — ATARU WHIRLWIND!", "Luminous Force Repulse", 6, 1.9, 6.0]
];

/* === 2. TACTICAL VISOR SPECS & FORCE PUSH VISUAL STATE === */
const VISOR_MODES = [
  [0, "Off", "#ffffff", 0.0, "Standard Vision"],
  [1, "Boba Green Rangefinder", "#00e676", 0.10, "Green targeting telemetry + threat lock"],
  [2, "T-800 / Sith Neural HUD", "#ff1744", 0.10, "Red reticle with Head Life telemetry & weakness info"],
  [3, "Predator Thermal Vision", "#ff9100", 0.10, "Heat-map infrared sensor glow on all enemies"],
  [4, "Force / Matrix Prescience", "#00ff88", 0.10, "Prescience target lock predicting enemy vectors"]
];

let forcePushVis = { timer: 0, maxT: 0.36, x: 0, y: 0, ang: 0, arc: 1.4, maxR: 135, col: "#00e5ff" };

/* === 3. CUMULATIVE SPELLBOOK & ARSENAL PROGRESSION TABLES ===
   Checks by unique spell NAME so every single tier unlocks cleanly onto #spellBar! */
const SPELLBOOK_LADDER = {
  54: [
    [1, "Knee Darts", "kneeDarts", "missile", 5.5, "Fires whistling micro-rocket darts from Boba's knee armor"],
    [3, "Flame Jet", "flameCone", "flame", 6.5, "Projects a searing Mandalorian wrist-flamethrower cone"],
    [5, "Disintegrator", "bobaDisintegrate", "nova", 9.0, "Throws a Baradium Thermal Detonator that disintegrates foes into ash!"]
  ],
  56: [
    [1, "Stupefy", "stupefyBolt", "beam", 3.5, "Fires a crimson Stunning Spell that knocks back & stuns"],
    [2, "Leviosa", "leviosaFloat", "orbit", 6.0, "Wingardium Leviosa: floats enemies into the sky & off-screen for XP!"],
    [3, "Expelliarmus", "factionPulse", "beam", 5.5, "Scarlet disarming blast knocks back & disarms enemies"],
    [4, "Sectum", "sectumSlash", "orbit", 6.0, "Invisible wand slash severs enemy limbs & bleeds"],
    [5, "Patronus", "patronusStag", "nova", 7.5, "Summons a radiant Silver Stag Patronus shockwave!"]
  ],
  57: [
    [1, "Bluebell Fire", "flameCone", "flame", 4.5, "Conjures waterproof Bluebell flames"],
    [2, "Leviosa", "leviosaFloat", "orbit", 5.5, "It's Levi-O-sa! Floats enemies skyward & off-screen"],
    [3, "Protego Ward", "youShallNotPass", "nova", 8.0, "Erects a golden Protego Totalum barrier shield"],
    [5, "Time Rewind", "timeRewind", "nova", 10.0, "Rewinds time: heals 35% HP & resets cooldowns"]
  ],
  58: [
    [1, "Slug-Vomiting", "stupefyBolt", "beam", 4.0, "Hexes enemies with a concussive blast"],
    [2, "Whiz-Bang", "explosiveBow", "missile", 5.5, "Fires exploding Weasley dragon-fireworks"],
    [4, "Chess Knight", "piertotumKnights", "fort", 8.0, "Summons an armored Wizard's Chess Knight to cleave foes"],
    [5, "Deluminator", "timeRewind", "nova", 9.5, "Captures light to heal wounds & blind all hostiles"]
  ],
  59: [
    [1, "Stupefy", "stupefyBolt", "beam", 3.8, "Fires an astral stunning bolt"],
    [2, "Levicorpus", "leviosaFloat", "orbit", 5.5, "Floats enemies upside-down into the sky"],
    [4, "Hare Patronus", "patronusStag", "nova", 7.5, "Conjures a bounding silver Hare Patronus wave"]
  ],
  60: [
    [1, "Triwizard Hex", "stupefyBolt", "beam", 3.8, "Precision champion wand hex"],
    [2, "Rock-to-Hound", "summonHound", "orbit", 6.5, "Transfigures stones into loyal allied Hounds"],
    [4, "Bubble-Head Ward", "youShallNotPass", "nova", 8.0, "Erects a protective champion barrier"]
  ],
  61: [
    [1, "Umbrella Spark", "flameCone", "flame", 4.5, "Fires a chaotic pink-umbrella blast cone"],
    [2, "Call Fang", "summonHound", "orbit", 6.5, "Calls Fang to maul nearby enemies"],
    [4, "Norbert Flame", "explosiveBow", "missile", 7.0, "Unleashes baby dragon Norbert's fireballs"]
  ],
  62: [
    [1, "Densaugeo", "stupefyBolt", "beam", 3.8, "Slytherin dueling hex bolt"],
    [2, "Serpensortia", "summonHound", "chain", 6.5, "Conjures venomous black vipers to attack foes"],
    [4, "Fiendfyre", "flameCone", "flame", 7.0, "Unleashes cursed Room of Requirement flames"]
  ],
  63: [
    [1, "Waddiwasi", "stupefyBolt", "beam", 3.8, "Defense professor precision hex"],
    [2, "Riddikulus", "factionPulse", "nova", 5.5, "Banishes & stuns surrounding foes"],
    [4, "Moonlight Ward", "youShallNotPass", "nova", 8.0, "Erects a Marauder defensive ward"]
  ],
  64: [
    [1, "Azka-Hex", "stupefyBolt", "beam", 3.8, "Fires a raw Azkaban dueling bolt"],
    [2, "Grim Pack", "summonHound", "orbit", 6.5, "Summons black Animagus Grim hounds"],
    [4, "Black-Bark Wave", "patronusStag", "nova", 7.5, "Unleashes a concussive Animagus shockwave"]
  ],
  65: [
    [1, "Auror Hex", "stupefyBolt", "beam", 3.8, "Heavy Auror stunner bolt"],
    [2, "Ferret Bounce", "leviosaFloat", "orbit", 5.5, "Transfigures & bounces enemies into the air"],
    [4, "Staff Thump", "youShallNotPass", "nova", 7.5, "Slams staff to erect an Auror shockwave barrier"]
  ],
  66: [
    [1, "Transfigure", "leviosaFloat", "beam", 5.5, "Transfigures & floats enemies helplessly away"],
    [2, "Stone Knight", "piertotumKnights", "fort", 7.5, "Piertotum Locomotor: animates an allied Stone Armor Knight!"],
    [4, "Knight Legion", "piertotumKnights", "fort", 8.5, "Animates a pair of Hogwarts Stone Knights to do their duty!"]
  ],
  67: [
    [1, "Sectumsempra", "sectumSlash", "orbit", 4.0, "Invisible wand lacerations sever limbs & open arterial bleeds"],
    [2, "Levicorpus", "leviosaFloat", "chain", 5.5, "Hoists enemies upside-down by the ankle into the sky"],
    [4, "Legilimens", "stareFreeze", "nova", 8.0, "Invades enemy minds, freezing all nearby hostiles"]
  ],
  68: [
    [1, "Crucio Web", "stareFreeze", "chain", 5.0, "Paralyzes nearby enemies with crimson Cruciatus lightning"],
    [2, "Dagger Impale", "sectumSlash", "orbit", 5.5, "Lacerates enemies with her cursed silver blade"],
    [4, "Dark Mark Storm", "avadaKedavra", "chain", 7.5, "Calls down a lethal green Dark Mark bolt"]
  ],
  69: [
    [1, "Elder Bolt", "stupefyBolt", "beam", 4.0, "Fires a resonant bolt from the Elder Wand"],
    [2, "Aqua Prison", "leviosaFloat", "nova", 6.0, "Traps enemies in floating Ministry water spheres"],
    [4, "Fire Parting", "flameCone", "flame", 6.5, "Sweeps a colossal vortex of parting fire"],
    [5, "Fawkes Song", "timeRewind", "nova", 9.5, "Fawkes heals wounds & unleashes a golden phoenix wave"]
  ],
  70: [
    [1, "Crucio Web", "stareFreeze", "chain", 5.5, "Paralyzes nearby foes with crimson Cruciatus lightning"],
    [2, "Nagini Strike", "summonHound", "orbit", 7.0, "Summons Nagini to strike & venom-shred enemies"],
    [3, "Fiendfyre", "flameCone", "flame", 6.5, "Unleashes cursed serpent-flames"],
    [5, "Avada Kedavra", "avadaKedavra", "chain", 6.0, "The Killing Curse: jagged green bolt instantly vaporizes foes!"]
  ],
  71: [
    [1, "Istari Light", "patronusStag", "beam", 5.0, "Blinding white light of Valinor"],
    [3, "Glamdring", "sectumSlash", "orbit", 5.0, "Cleaves shadow foes with the Foe-Hammer"],
    [5, "Shall Not Pass!", "youShallNotPass", "nova", 8.0, "Slams staff & sword to erect an impassable bridge rune barrier!"]
  ],
  72: [
    [1, "Orthanc Bolt", "stupefyBolt", "beam", 4.0, "Fires a dark staff bolt"],
    [2, "Voice of Command", "stareFreeze", "nova", 6.5, "Freezes enemies in their tracks with Saruman's Voice"],
    [4, "Isengard Fire", "explosiveBow", "missile", 7.0, "Detonates Orthanc blasting-fire mines"]
  ],
  73: [
    [1, "Eldritch Whip", "sectumSlash", "orbit", 4.2, "Lashes enemies with golden Mandala energy"],
    [2, "Mirror Ward", "youShallNotPass", "nova", 7.5, "Erects a reflective Mirror Dimension barrier"],
    [4, "Agamotto Loop", "timeRewind", "orbit", 9.5, "Rewinds time, healing HP & resetting cooldowns"]
  ],
  74: [
    [1, "Hex Bolt", "stupefyBolt", "beam", 3.8, "Fires scarlet probability hex bolts"],
    [2, "Chaos Float", "leviosaFloat", "nova", 5.5, "Levitates enemies in scarlet energy & floats them off-screen"],
    [4, "Rewrite Reality", "avadaKedavra", "chain", 7.5, "Disintegrates enemies in a Darkhold chaos surge"]
  ],
  75: [
    [1, "Soul Drain", "stupefyBolt", "chain", 3.2, "Drains life-force to create fresh corpses for your Grimoire"],
    [2, "Swordsmen", "raiseSwords", "orbit", 5.0, "Consumes corpses to raise Skeletal Swordsmen!"],
    [3, "Bone Critters", "raiseCritters", "cone", 5.0, "Consumes corpses to raise fast Bone-Critter swarmers!"],
    [4, "Bone Archers", "raiseArchers", "beam", 5.5, "Consumes corpses to raise ranged Skeletal Bowmen!"],
    [5, "Death Knights", "raiseKnights", "fort", 6.5, "Consumes corpses to raise armored Death-Knight Halberdiers!"],
    [6, "Bone Golem", "raiseGolem", "nova", 9.0, "Consumes corpses to raise a Colossal Bone Golem Juggernaut!"]
  ]
};

function getDefaultSpellLadder(cid) {
  if (cid === CUSTOM_CID) return (typeof customSpellLadder === "function" && customSpellLadder()) || [];   // v13: wand / staff / tome builds
  if (SPELLBOOK_LADDER[cid]) return SPELLBOOK_LADDER[cid];
  if (cid >= 56 && cid <= 75) {
    return [
      [1, "Wand Hex", "stupefyBolt", "beam", 4.0, "Fires a focused arcane wand hex"],
      [2, "Leviosa", "leviosaFloat", "orbit", 6.0, "Floats nearby enemies skyward & off-screen for XP"],
      [4, "Conjure Ally", "summonHound", "orbit", 7.5, "Conjures an arcane familiar to fight beside you"],
      [5, "Grand Spell", "patronusStag", "nova", 8.0, "Unleashes a radiant signature spell wave"]
    ];
  }
  return [];
}

function syncHeroSpellbook() {
  if (!player) return;
  if (!Array.isArray(player.spellbook)) player.spellbook = [];
  const ladder = getDefaultSpellLadder(player.cid);
  if (ladder.length === 0) return;

  const wLvl = player.weapons[0] ? player.weapons[0].lvl : 1;
  const maxRefLvl = Math.max(wLvl, player.lvl || 1);
  let addedAny = false;

  for (let i = 0; i < ladder.length; i++) {
    const [reqLvl, sName, sType, sIcon, sCdMax, sDesc] = ladder[i];
    if (maxRefLvl >= reqLvl && !player.spellbook.some(sp => sp.name === sName)) {
      player.spellbook.push({
        name: sName, type: sType, icon: sIcon,
        cdMax: sCdMax, cd: 0, reqLvl, desc: sDesc
      });
      addedAny = true;
      if (runTime > 0.3) {
        spawnSpeech(player.x, player.y - 18, `SPELL UNLOCKED: ${sName.toUpperCase()}!`, "#ffd166", 2.4);
      }
    }
  }
  if (addedAny && typeof updateHUD === "function" && !window._inHudUpdate) {
    updateHUD();
  }
}

/* === 4. v8.0 CHARACTER-SPECIFIC DOUBLE-TAP DISTANT DASH ENGINE === */
function executeHeroDash(targetX, targetY) {
  if (!player || !runActive || runPaused) return false;
  if ((player.dashCD || 0) > 0.05) return false;

  const spec = typeof getHeroDashSpec === "function"
    ? getHeroDashSpec(player.cid)
    : { name: "Tactical Dash", cd: 4.2, dist: 145, style: "tacDash", col: "#00e5ff", callout: "DASH!" };

  const dx = (typeof targetX === "number") ? (targetX - player.x) : (Math.cos(player.aim) * spec.dist);
  const dy = (typeof targetY === "number") ? (targetY - player.y) : (Math.sin(player.aim) * spec.dist);
  const rawDist = Math.hypot(dx, dy);
  const dashAng = rawDist > 4 ? Math.atan2(dy, dx) : (player.aim || 0);
  const maxD = spec.dist * (1 + (player.spd - 145) / 400);
  const actualDist = Math.min(maxD, Math.max(65, rawDist));

  const startX = player.x, startY = player.y;
  let endX = startX, endY = startY;
  const ignoreLow = true;
  const steps = 10;
  for (let s = 1; s <= steps; s++) {
    const tx = startX + Math.cos(dashAng) * (actualDist * (s / steps));
    const ty = startY + Math.sin(dashAng) * (actualDist * (s / steps));
    if (player.flying || typeof isPointBlockedByObstacle !== "function" || !isPointBlockedByObstacle(tx, ty, ignoreLow)) {
      endX = tx; endY = ty;
    } else break;
  }

  player.dashCD = spec.cd * (player.cdr || 1.0) * (player.utilCdrMul || 1.0);
  player.dashMaxCD = player.dashCD;
  player.dashTimer = 0.30;
  player.dashStyle = spec.style;
  player.dashCol = spec.col;
  player.dashStartX = startX;
  player.dashStartY = startY;
  player.dashEndX = endX;
  player.dashEndY = endY;
  player.x = endX;
  player.y = endY;
  player.aim = dashAng;
  player.combatAlertTimer = 2.0;

  if (typeof sfxDash === "function") sfxDash(spec.style);
  spawnSpeech(endX, endY - 12, spec.callout, spec.col, 1.4);

  const wLvl = player.weapons[0] ? player.weapons[0].lvl : 1;
  const dashDmg = (85 + wLvl * 18) * (player.might || 1.0);

  if (spec.style === "yodaFlip") {
    player.acrobatZ = 24;
    player.acrobatVZ = 65;
    player.acrobatFlip = Math.PI * 4;
  } else if (spec.style === "maulSpin" || spec.style === "vaderLunge" || spec.style === "vaapadBlitz" || spec.style === "saberRush") {
    player.swordSwingTimer = 0.38;
    player.armReach = 7.5;
  } else if (spec.style === "jetpackSlam") {
    if (typeof spawnBlastWave === "function") {
      spawnBlastWave(startX, startY, 45, "#ff9100");
      spawnBlastWave(endX, endY, 85 * player.area, "#ff6d00");
    }
  } else if (spec.style === "apparitionBlink") {
    if (typeof spawnBlastWave === "function") {
      spawnBlastWave(startX, startY, 52, spec.col);
      spawnBlastWave(endX, endY, 72 * player.area, spec.col);
    }
  } else if (spec.style === "gunslingerRoll") {
    for (let k = 0; k < 6; k++) {
      const a = dashAng + (Math.PI * 2 * k) / 6;
      spawnProj(endX, endY, Math.cos(a) * 460, Math.sin(a) * 460, dashDmg * 0.75, 0.65, 6, 2, 4, 1, 0, player.cid);
    }
  }

  const segDX = endX - startX, segDY = endY - startY;
  const segLenSq = segDX * segDX + segDY * segDY;
  const corridorRad = spec.style === "vaderLunge" ? 44 : 36;
  const isBladeDash = ["vaderLunge", "yodaFlip", "maulSpin", "vaapadBlitz", "saberRush"].includes(spec.style);

  for (let j = 0; j < MAX_E; j++) {
    if (!eAct[j] || allyIs(j)) continue;
    let t = segLenSq > 1 ? (((eX[j] - startX) * segDX + (eY[j] - startY) * segDY) / segLenSq) : 1;
    t = Math.max(0, Math.min(1, t));
    const cx = startX + t * segDX, cy = startY + t * segDY;
    if (Math.hypot(eX[j] - cx, eY[j] - cy) <= corridorRad) {
      const cutAng = spec.style === "vaderLunge" ? 0.05 : (dashAng + 0.4);
      if (isBladeDash && typeof eScarAng !== "undefined") {
        eScarAng[j] = cutAng;
        eScarHeat[j] = 1.0;
      }
      const fatal = (isBladeDash && eType[j] < 98) ? (eHP[j] + 999) : dashDmg * 1.45;
      eHP[j] -= fatal;
      eStun[j] = Math.max(eStun[j], 1.1);
      spawnDmg(eX[j], eY[j], fatal, true);
      if (eHP[j] <= 0 && typeof killEnemy === "function") {
        killEnemy(j, true, isBladeDash ? cutAng : null, spec.col);
      }
    }
  }

  if (typeof updateHUD === "function") updateHUD();
  return true;
}

/* === 5. DIRECTIONAL-TO-360 FORCE KINETIC PUSH ENGINE === */
function executeForceKineticPush(originX, originY, aimAng, pushLvl = 1, baseDmg = 28) {
  const clampedLvl = Math.max(1, Math.min(10, pushLvl));
  const halfArc = clampedLvl >= 10 ? Math.PI : ((0.65 + (clampedLvl - 1) * 0.24) * 0.5);
  const maxRange = (125 + clampedLvl * 11) * (player ? player.area : 1.0);
  const pushDist = (95 + clampedLvl * 12) * (player ? player.kb : 1.0);
  const stunDur = 1.0 + clampedLvl * 0.08;

  if (player) {
    player.forceHandTimer = 0.36;
    player.forceHandAng = aimAng;
  }
  forcePushVis.timer = 0.36;
  forcePushVis.maxT = 0.36;
  forcePushVis.x = originX;
  forcePushVis.y = originY;
  forcePushVis.ang = aimAng;
  forcePushVis.arc = halfArc * 2;
  forcePushVis.maxR = maxRange;
  forcePushVis.col = (player && player.fac) ? player.fac.c1 : "#00e5ff";

  sfx(190, 75, 0.22, "sine", 0.26);
  playNoise(0.18, "bandpass", 620, 140, 1.4, 0.24);

  for (let i = 0; i < MAX_E; i++) {
    if (!eAct[i] || allyIs(i)) continue;
    const dx = eX[i] - originX, dy = eY[i] - originY;
    const d = Math.hypot(dx, dy);
    if (d > maxRange || d < 0.001) continue;

    const angToEnemy = Math.atan2(dy, dx);
    let diff = angToEnemy - aimAng;
    while (diff > Math.PI) diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;

    if (Math.abs(diff) <= halfArc) {
      const falloff = 0.55 + 0.45 * (1 - d / maxRange);
      const kb = pushDist * falloff * (eType[i] === 99 ? 0.38 : 1.0);
      const nx = eX[i] + (dx / d) * kb;
      const ny = eY[i] + (dy / d) * kb;
      if (typeof isPointBlockedByObstacle !== "function" || !isPointBlockedByObstacle(nx, ny, false)) {
        eX[i] = nx; eY[i] = ny;
      }
      eStun[i] = Math.max(eStun[i], stunDur);
      eSlow[i] = Math.max(eSlow[i], stunDur + 1.2);
      const concussDmg = baseDmg * (1 + clampedLvl * 0.14);
      eHP[i] -= concussDmg;
      spawnDmg(eX[i], eY[i], concussDmg, clampedLvl >= 10);
      if (eHP[i] <= 0 && typeof killEnemy === "function") killEnemy(i, false);
    }
  }
}

/* === 6. CORPSE-ONLY NECROMANCER SUMMONER & ICONIC MOVIE SPELL EXECUTOR === */
function raiseNecroMinionsFromCorpses(kind, countDesired, requireCorpse = true, manualResummon = false) {
  if (!player || typeof spawnMinion !== "function") return 0;
  const wLvl = player.weapons[0] ? player.weapons[0].lvl : 1;
  const baseHP = (kind === 4 ? 420 : (kind === 3 ? 210 : (kind === 1 ? 65 : 115))) * (1 + wLvl * 0.18) * player.might;
  const baseDmg = (kind === 4 ? 75 : (kind === 3 ? 42 : (kind === 2 ? 28 : 24))) * (1 + wLvl * 0.15) * player.might;
  const baseSpd = kind === 1 ? 155 : (kind === 4 ? 78 : (kind === 3 ? 98 : 122));
  const col = kind === 4 ? "#00ff88" : (kind === 2 ? "#80deea" : (kind === 3 ? "#ffd166" : "#b388ff"));

  let raised = 0;
  for (let k = 0; k < countDesired; k++) {
    const corpse = typeof consumeCorpseAt === "function" ? consumeCorpseAt(player.x, player.y, 320) : null;
    if (corpse) {
      spawnMinion(corpse.x, corpse.y, kind, baseHP, baseDmg, baseSpd, 26 * player.dur, col);
      if (typeof spawnBlastWave === "function") spawnBlastWave(corpse.x, corpse.y, 28, "#b388ff");
      raised++;
    } else if (!requireCorpse || (manualResummon && raised === 0)) {
      const a = Math.random() * Math.PI * 2;
      const sx = player.x + Math.cos(a) * 38, sy = player.y + Math.sin(a) * 38;
      spawnMinion(sx, sy, kind, baseHP, baseDmg, baseSpd, 22 * player.dur, col);
      raised++;
    }
  }
  if (raised > 0) {
    if (typeof sfxSpell === "function") sfxSpell("raiseDead");
    const names = ["SKELETAL SWORDSMEN", "BONE CRITTERS", "SKELETAL BOWMEN", "DEATH KNIGHTS", "COLOSSAL BONE GOLEM"];
    spawnSpeech(player.x, player.y - 14, `RAISED ${raised} ${names[kind] || "UNDEAD"}!`, "#00ff88", 1.5);
  }
  return raised;
}

function castArcaneSpell(spellType, manualClick = false) {
  if (!player) return;
  const wLvl = player.weapons[0] ? player.weapons[0].lvl : 1;
  player.combatAlertTimer = 1.8;

  if (spellType === "raiseSwords") {
    raiseNecroMinionsFromCorpses(0, 2 + Math.floor(wLvl / 3), true, manualClick);
  } else if (spellType === "raiseCritters") {
    raiseNecroMinionsFromCorpses(1, 3 + Math.floor(wLvl / 3), true, manualClick);
  } else if (spellType === "raiseArchers") {
    raiseNecroMinionsFromCorpses(2, 2 + Math.floor(wLvl / 4), true, manualClick);
  } else if (spellType === "raiseKnights") {
    raiseNecroMinionsFromCorpses(3, 1 + Math.floor(wLvl / 5), true, manualClick);
  } else if (spellType === "raiseGolem") {
    raiseNecroMinionsFromCorpses(4, 1, true, manualClick);
  } else if (spellType === "raiseDead") {
    let total = 0;
    total += raiseNecroMinionsFromCorpses(0, 2, true, manualClick);
    if (wLvl >= 3) total += raiseNecroMinionsFromCorpses(1, 2, true, false);
    if (wLvl >= 4) total += raiseNecroMinionsFromCorpses(2, 2, true, false);
    if (wLvl >= 5) total += raiseNecroMinionsFromCorpses(3, 1, true, false);
    if (wLvl >= 6) total += raiseNecroMinionsFromCorpses(4, 1, true, false);
    if (total === 0) {
      castArcaneSpell("stupefyBolt", false);
      spawnSpeech(player.x, player.y, "SOUL DRAIN — HARVESTING CORPSES!", "#b388ff", 1.4);
    }
  } else if (spellType === "piertotumKnights") {
    const col = player.cid === 66 ? "#cfd8dc" : (player.cid === 58 ? "#ffd166" : "#00ff88");
    const kind = player.cid === 75 ? 4 : 3;
    const cnt = player.cid === 75 ? 1 : 2;
    for (let k = 0; k < cnt; k++) {
      const a = player.aim + (k - 0.5) * 0.8;
      spawnMinion(player.x + Math.cos(a) * 34, player.y + Math.sin(a) * 34, kind, 260 * player.might, 48 * player.might, 105, 25 * player.dur, col);
    }
    if (typeof sfxSpell === "function") sfxSpell("youShallNotPass");
    spawnSpeech(player.x, player.y, player.cid === 66 ? "PIERTOTUM LOCOMOTOR!" : "GUARDIAN SUMMONED!", "#ffd166", 1.8);
  } else if (spellType === "summonHound") {
    const col = player.cid === 62 || player.cid === 70 ? "#00e676" : (player.cid === 64 ? "#212121" : "#a1887f");
    for (let k = 0; k < 2; k++) {
      const a = player.aim + (k - 0.5) * 0.7;
      spawnMinion(player.x + Math.cos(a) * 30, player.y + Math.sin(a) * 30, 1, 130 * player.might, 34 * player.might, 152, 20 * player.dur, col);
    }
    if (typeof sfxSpell === "function") sfxSpell("wand");
  } else if (spellType === "leviosaFloat") {
    if (typeof sfxSpell === "function") sfxSpell("leviosa");
    let floated = 0;
    for (let i = 0; i < MAX_E; i++) {
      if (!eAct[i] || eType[i] === 99 || eLevitate[i] > 0 || allyIs(i)) continue;
      const d = Math.hypot(eX[i] - player.x, eY[i] - player.y);
      if (d < 195 * player.area && floated < (3 + Math.floor(wLvl / 2))) {
        eLevitate[i] = 9.5;
        eLevZ[i] = 4;
        const pushA = Math.atan2(eY[i] - player.y, eX[i] - player.x);
        eLevVX[i] = Math.cos(pushA) * (48 + Math.random() * 22);
        eLevVY[i] = Math.sin(pushA) * (48 + Math.random() * 22) - 18;
        eStun[i] = 9.5;
        floated++;
      }
    }
    spawnSpeech(player.x, player.y, player.cid === 67 ? "LEVICORPUS!" : "WINGARDIUM LEVIOSA!", "#80deea", 1.5);
  } else if (spellType === "avadaKedavra") {
    if (typeof sfxSpell === "function") sfxSpell("avada");
    let best = -1, bestScore = -1;
    for (let i = 0; i < MAX_E; i++) {
      if (eAct[i] && isEnemyOnScreen(i) && !(typeof sdIgnore === "function" && sdIgnore(i)) && !(eStagger[i] > 0)) {    // v12: never steal a waiting glory kill
        const d = Math.hypot(eX[i] - player.x, eY[i] - player.y);
        if (d < 320) {
          const score = eHP[i] * (eType[i] >= 98 ? 5 : 1) / (1 + d * 0.01);
          if (score > bestScore) { bestScore = score; best = i; }
        }
      }
    }
    if (best >= 0) {
      const tx = eX[best], ty = eY[best];
      const a = Math.atan2(ty - player.y, tx - player.x);
      spawnProj(player.x, player.y, Math.cos(a) * 520, Math.sin(a) * 520, 450 * player.might, 0.28, 16, 8, 5, 3, 0, 70);
      const killDmg = eType[best] >= 98 ? Math.max(360 * player.might, eMax[best] * 0.42) : (eHP[best] + 9999);
      eHP[best] -= killDmg;
      spawnDmg(tx, ty, killDmg, true);
      if (typeof spawnBlastWave === "function") spawnBlastWave(tx, ty, 52, "#00ff88");
      if (eHP[best] <= 0 && typeof killEnemy === "function") killEnemy(best, true);
    }
    spawnSpeech(player.x, player.y, "AVADA KEDAVRA!", "#00ff88", 1.8);
  } else if (spellType === "sectumSlash") {
    if (typeof sfxSpell === "function") sfxSpell("sectum");
    let hits = 0;
    for (let i = 0; i < MAX_E; i++) {
      if (!eAct[i] || !isEnemyOnScreen(i) || !!(typeof sdIgnore === "function" && sdIgnore(i))) continue;
      if (Math.hypot(eX[i] - player.x, eY[i] - player.y) < 185 * player.area && hits < 5) {
        const cutA = Math.atan2(eY[i] - player.y, eX[i] - player.x) + (Math.random() - 0.5) * 0.9;
        if (typeof eScarAng !== "undefined") { eScarAng[i] = cutA; eScarHeat[i] = 1.0; }
        if (eArmsLost[i] < 2) { eArmsLost[i]++; spawnGroundLimb(eX[i] + 7, eY[i], "#ff1744", 1); }
        else if (eLegsLost[i] < 2) { eLegsLost[i]++; spawnGroundLimb(eX[i], eY[i] + 7, "#ff1744", 0); }
        eBleed[i] = 1; eBleedRate[i] = eMax[i] * 0.16;
        const sDmg = (115 + wLvl * 18) * player.might;
        eHP[i] -= sDmg;
        spawnDmg(eX[i], eY[i], sDmg, true, true);
        if (eHP[i] <= 0 && typeof killEnemy === "function") killEnemy(i, false, cutA, "#ffffff");
        hits++;
      }
    }
    spawnSpeech(player.x, player.y, "SECTUMSEMPRA!", "#ff5252", 1.5);
  } else if (spellType === "youShallNotPass") {
    if (typeof sfxSpell === "function") sfxSpell("youShallNotPass");
    // v13: Jedi use Tutaminis (not a wizard's Protego). Yoda's ward is bigger and lasts longer - more so at his prime.
    const isYoda = player.cid === 79, yLv = isYoda && typeof yodaSaberLvl === "function" ? yodaSaberLvl() : 0;
    const forceWard = isYoda || /tutaminis/i.test(player.lastUtilName || "");
    const bRad = (84 + wLvl * 5) * player.area * (isYoda ? (yLv >= 7 ? 1.45 : 1.25) : 1);
    const bLife = 5.5 * player.dur * (isYoda ? (yLv >= 7 ? 1.7 : 1.4) : 1);
    if (typeof activeBarriers !== "undefined") {
      activeBarriers.push({
        x: player.x, y: player.y, rad: bRad, life: bLife, maxLife: bLife,
        col: isYoda ? "#9cff57" : (forceWard ? "#4fc3f7" : (player.cid === 71 ? "#ffd166" : (player.cid === 73 ? "#ff9100" : "#00e5ff")))
      });
    }
    executeForceKineticPush(player.x, player.y, player.aim, 10, 85 * player.might * (isYoda ? 1.5 : 1));
    const wardLine = player.cid === 71 ? "YOU SHALL NOT PASS!" : (isYoda ? "TUTAMINIS! \"Pass, you will not.\"" : (forceWard ? "TUTAMINIS!" : "PROTEGO TOTALUM!"));
    spawnSpeech(player.x, player.y, wardLine, isYoda ? "#9cff57" : "#ffd166", 2.2);
  } else if (spellType === "patronusStag") {
    if (typeof sfxSpell === "function") sfxSpell("patronus");
    if (typeof spawnBlastWave === "function") spawnBlastWave(player.x, player.y, 145 * player.area, "#e0f7fa");
    executeForceKineticPush(player.x, player.y, player.aim, 10, 110 * player.might);
    spawnSpeech(player.x, player.y, player.cid === 71 ? "FLAME OF ANOR!" : "EXPECTO PATRONUM!", "#e0f7fa", 1.8);
  } else if (spellType === "timeRewind") {
    if (typeof sfxSpell === "function") sfxSpell("patronus");
    player.hp = Math.min(player.maxHp, player.hp + player.maxHp * 0.35);
    player.limbs.fill(100);
    player.utils.forEach(u => { u.cd = 0; });
    for (let i = 0; i < MAX_E; i++) {
      if (eAct[i] && !allyIs(i) && isEnemyOnScreen(i)) eStun[i] = Math.max(eStun[i], 3.2);
    }
    if (typeof spawnBlastWave === "function") spawnBlastWave(player.x, player.y, 135, "#ffd166");
    spawnSpeech(player.x, player.y, player.cid === 69 ? "FAWKES REBIRTH!" : "TIME REWIND!", "#ffd166", 1.8);
  } else if (spellType === "kneeDarts") {
    for (let k = -1; k <= 1; k++) {
      const a = player.aim + k * 0.22;
      spawnProj(player.x, player.y + 4, Math.cos(a) * 340, Math.sin(a) * 340, 95 * player.might, 1.4, 8, 1, 2, 1, 0, 54);
    }
    sfx(780, 240, 0.12, "sawtooth", 0.20);
    spawnSpeech(player.x, player.y, "KNEE ROCKET-DARTS!", "#00e676", 1.2);
  } else if (spellType === "bobaDisintegrate") {
    if (typeof sfxDisintegrate === "function") sfxDisintegrate();
    const tx = player.x + Math.cos(player.aim) * 85, ty = player.y + Math.sin(player.aim) * 85;
    if (typeof spawnBlastWave === "function") {
      spawnBlastWave(tx, ty, 125 * player.area, "#ff6d00");
      spawnBlastWave(tx, ty, 85 * player.area, "#ffffff");
    }
    spawnParticles(tx, ty, 18);
    for (let i = 0; i < MAX_E; i++) {
      if (!eAct[i] || allyIs(i)) continue;
      if (Math.hypot(eX[i] - tx, eY[i] - ty) <= 125 * player.area) {
        const disDmg = eType[i] >= 98 ? Math.max(320 * player.might, eMax[i] * 0.38) : (eHP[i] + 9999);
        eHP[i] -= disDmg;
        spawnDmg(eX[i], eY[i], disDmg, true);
        spawnParticles(eX[i], eY[i], 8);
        if (eHP[i] <= 0 && typeof killEnemy === "function") {
          killEnemy(i, false);
        }
      }
    }
    spawnSpeech(player.x, player.y, "DISINTEGRATIONS AUTHORIZED!", "#ff6d00", 1.8);
  } else {
    if (typeof sfxSpell === "function") sfxSpell("wand");
    for (let k = -1; k <= 1; k++) {
      const a = player.aim + k * 0.14;
      spawnProj(player.x, player.y, Math.cos(a) * 460, Math.sin(a) * 460, (75 + wLvl * 14) * player.might, 0.8, 9, 3, 4, 1, 0, player.cid);
    }
  }
}

function triggerSpell(sIdx) {
  if (!player || !Array.isArray(player.spellbook) || !player.spellbook[sIdx]) return;
  const sp = player.spellbook[sIdx];
  if (sp.cd > 0.05) return;
  sp.cd = sp.cdMax * (player.cdr || 1.0) * (player.utilCdrMul || 1.0);
  castArcaneSpell(sp.type, true);
  if (typeof updateHUD === "function") updateHUD();
}

/* === 7. PLAYER RUN INITIALIZATION & PASSIVES === */
function startRun() {
  purgeRunMemory();
  const c = CHAR_RAW[meta.selChar] || CHAR_RAW[0];
  const stg = STAGES[meta.selStage - 1] || STAGES[0];
  const diff = DIFFICULTIES[meta.diff] || DIFFICULTIES[1];
  const r = meta.ranks, cid = c[0];
  const sig = HERO_SIG_GEAR[cid] || HERO_SIG_GEAR[0];
  const dashSpec = typeof getHeroDashSpec === "function" ? getHeroDashSpec(cid) : { cd: 4.2 };

  runSeed = (Date.now() & 0xfffffff) ^ (meta.selStage * 997);
  runActive = true; runPaused = false;
  runTime = 0; totalRunTime = 0; orbWarpTimer = 0; waveNum = 1; rivalTimer = 0;

  const innateVac = (typeof hasInnateVacuum === "function" && hasInnateVacuum(cid)) ? 1.0 : 0.0;
  const startsWithSaber = (typeof isSwordWeapon === "function" && isSwordWeapon(cid)) || (c[6] === "orbit" && (cid < 56 || cid >= 76));
  const armCap = typeof getHeroArmCap === "function" ? getHeroArmCap(cid) : 2;

  let innateVisor = 0;
  if ([1, 54].includes(cid)) innateVisor = 1;
  else if ([40, 23, 26, 36, 55, 65, 76].includes(cid)) innateVisor = 2;
  else if ([28, 29, 31, 32, 33, 34, 47, 59, 77].includes(cid)) innateVisor = 3;
  else if ([0, 3, 7, 10, 14, 18, 20, 38, 39, 46, 48, 56, 69, 71, 73, 74, 78, 79, 80].includes(cid)) innateVisor = 4;

  const startVisors = innateVisor > 0 ? [innateVisor] : [];

  const out = typeof getOutfit === "function" ? getOutfit(cid) : { blade: 0 };
  const pal = typeof getHeroOutfits === "function" ? getHeroOutfits(cid) : null;
  const startBladeCol = (pal && pal.blade && pal.blade[out.blade || 0])
    ? pal.blade[out.blade || 0][1]
    : (typeof getWeaponColor === "function" ? getWeaponColor(cid) : "#00f0ff");

  player = {
    x: 256, y: 256, aim: 0, moveDir: 0, walk: 0, vx: 0, vy: 0,
    hp: 100, maxHp: 100 * (1 + r[2] * 0.15) * diff.plrHp,
    might: 1 + r[0] * 0.10, armor: r[1],
    regen: r[3] * 0.6, cdr: 1 - r[4] * 0.06, area: 1 + r[5] * 0.12,
    spd: 145 * (1 + r[6] * 0.08), mag: 90 * (1 + r[7] * 0.25),
    crit: 0.08 + r[8] * 0.05, cdmg: 1.6,
    greed: (1 + r[9] * 0.20) * diff.xpMul,
    projCnt: 0, projSpd: 1.0, dur: 1.0, pierce: 0,
    kb: 1.0, slow: 0, shred: 0, revives: 0, dodge: 0,
    hover: false, hazImmune: false, bossMul: 1.0,
    adaptTimer: 0, sandTimer: 0, sandCD: 6.0, vatsTimer: 0, vatsCD: 4.0, overclockTimer: 0,
    cqcCD: 0, autoFlameCD: 0, kneeDartCD: 5.5, sigGearCD: sig[5], sigGearLvl: 1, equipAnimTimer: 1.8,
    dashCD: 0, dashMaxCD: dashSpec.cd, dashTimer: 0, dashStyle: "", dashCol: "#00e5ff",
    dashStartX: 256, dashStartY: 256, dashEndX: 256, dashEndY: 256,
    deflectStanceTimer: 0, deflectAng: 0,
    acrobatZ: 0, acrobatVZ: 0, acrobatFlip: 0,
    sixShotsLeft: 6, sixBurstCD: 0, sixReloadCD: 0,
    fortAnchorX: 256, fortAnchorY: 256, fortTimer: 0, fortFastMul: 1.0,
    inVehicle: 0, vehicleHp: 0, vehBoostMul: 1.0,
    hasRepulsor: false, utilCdrMul: 1.0, orbVacuumRate: innateVac,
    limbs: [100, 100, 100, 100, 100, 100], guardZone: -1,
    hasSaber: startsWithSaber, saberMastery: startsWithSaber ? ([55, 76, 77, 78, 79].includes(cid) ? 45 : 15) : 0,
    swordSwingTimer: 0, swordLungeTimer: 0, armReach: 0,
    whirlwindTimer: 0, forceHandTimer: 0, forceHandAng: 0,
    flourishPhase: 0, flourishForm: 0, flourishTimer: 0, flourishSpeed: 3.4,
    blinkTimer: 1.8, blinkDur: 0, combatAlertTimer: 0,
    armCap: armCap, handSlotOffset: 0, swapTimer: 0, swapPause: 0,
    unlockedVisors: startVisors,
    visorsUnlocked: startVisors,
    activeVisor: innateVisor,
    maxRelics: ([7, 10, 35, 69, 73, 75, 79].includes(cid)) ? 4 : 3,
    relics: [], utils: getHeroUtils(cid), spellbook: [],
    xp: 0, nextXp: 10, lvl: 1, kills: 0, dmRun: 0, bossSpawned: false, titanClock: 0,
    pendingLevelUps: 0, sectorCleared: false, dmStage: 0, unlockedStage: 0, bossDmMul: 0, dmGreed: 0, evadeTxtCD: 0,
    fac: FACTIONS[c[1]] || FACTIONS[0], hero: c, cid, stg, diff,
    weapons: [{
      id: cid,
      name: c[4],
      superName: c[5],
      style: c[6],
      lvl: 1,
      cd: 0,
      ang: 0,
      angVel: 0,
      enabled: true,
      evolvedLv5: false,
      bladeCol: startBladeCol
    }],
    passives: []
  };

  if (cid === 0) { player.spd *= 1.15; player.mag *= 1.25; }
  if (cid === 1) { player.armor += 4; }
  if (cid === 2) { player.cdr *= 0.74; player.projCnt += 1; }
  if (cid === 3) { player.cdmg += 0.35; }
  if (cid === 4) { player.cdr *= 0.82; }
  if (cid === 5) { player.maxHp *= 1.3; player.area *= 1.2; }
  if (cid === 6) { player.crit += 0.3; player.greed += 0.25; }
  if (cid === 7) { player.might += 0.25; player.revives += 1; }
  if (cid === 8) { player.projSpd += 0.25; player.cdr *= 0.88; }
  if (cid === 9) { player.regen += 2.0; player.maxHp *= 1.2; }
  if (cid === 10) { player.dodge += 0.22; }
  if (cid === 11) { player.slow += 0.25; }
  if (cid === 12) { player.area *= 1.35; player.dur += 0.25; }
  if (cid === 13) { player.spd *= 1.2; }
  if (cid === 14) { player.dodge += 0.30; player.crit += 0.25; }
  if (cid === 15) { player.might += 0.3; player.armor += 3; }
  if (cid === 16) { player.spd *= 1.35; player.hazImmune = true; }
  if (cid === 18) { player.dodge += 0.25; player.mag *= 1.3; }
  if (cid === 19) { player.cdmg += 0.3; player.pierce += 2; }
  if (cid === 20) { player.hazImmune = true; player.cdr *= 0.85; }
  if (cid === 21) { player.hover = true; player.hazImmune = true; player.greed += 0.4; }
  if (cid === 22) { player.revives += 1; }
  if (cid === 25) { player.spd *= 1.25; player.projCnt += 1; }
  if (cid === 26) { player.revives += 1; player.projSpd += 0.25; }
  if (cid === 27) { player.maxHp *= 1.35; player.kb += 0.25; }
  if (cid === 28) { player.crit += 0.35; player.cdr *= 0.82; }
  if (cid === 29) { player.dodge += 0.25; player.cdmg += 0.4; }
  if (cid === 31) { player.cdr *= 0.82; player.area *= 1.25; }
  if (cid === 32) { player.regen += 2.5; player.area *= 1.3; }
  if (cid === 34) { player.armor += 6; player.might += 0.2; }
  if (cid === 35) { player.projCnt += 2; player.mag *= 1.25; }
  if (cid === 36) { player.regen += 2.5; player.revives += 1; }
  if (cid === 37) { player.projCnt += 2; player.spd *= 1.2; }
  if (cid === 38) { player.crit += 0.25; player.cdmg += 0.3; }
  if (cid === 39) { player.dodge += 0.35; player.cdr *= 0.8; }
  if (cid === 40) { player.maxHp *= 1.5; player.armor += 6; }
  if (cid === 41) { player.bossMul = 1.5; player.crit += 0.2; }
  if (cid === 44) { player.spd *= 1.35; player.area *= 1.25; }
  if (cid === 45) { player.armor += 5; player.hazImmune = true; }
  if (cid === 46) { player.revives += 2; }
  if (cid === 47) { player.spd *= 1.25; }
  if (cid === 48) { player.regen += 2.0; player.crit += 0.25; }
  if (cid === 49) { player.slow += 0.35; player.area *= 1.25; }
  if (cid === 50) { player.maxHp *= 1.2; }
  if (cid === 51) { player.crit += 0.30; player.dodge += 0.20; player.spd *= 1.15; }
  if (cid === 52) { player.crit += 0.45; player.cdmg += 0.65; player.projSpd += 0.40; }
  if (cid === 53) { player.maxHp *= 1.35; player.armor += 4; player.might += 0.20; }
  if (cid === 54) { player.armor += 5; player.bossMul = 1.35; player.crit += 0.20; }
  if (cid === 55) { player.might += 0.35; player.projCnt += 1; player.spd *= 1.2; }
  if (cid === 56) { player.spd *= 1.15; player.crit += 0.20; player.dodge += 0.20; }
  if (cid === 57) { player.cdr *= 0.80; player.area *= 1.20; }
  if (cid === 58) { player.area *= 1.25; player.projCnt += 1; }
  if (cid === 59) { player.crit += 0.25; player.mag *= 1.35; }
  if (cid === 60) { player.maxHp *= 1.30; player.armor += 3; }
  if (cid === 61) { player.maxHp *= 1.60; player.armor += 6; player.might += 0.25; }
  if (cid === 62) { player.cdmg += 0.35; player.greed += 0.30; }
  if (cid === 63) { player.regen += 2.5; player.spd *= 1.20; }
  if (cid === 64) { player.spd *= 1.25; player.crit += 0.25; }
  if (cid === 65) { player.bossMul = 1.35; player.armor += 4; }
  if (cid === 66) { player.cdr *= 0.82; player.might += 0.25; }
  if (cid === 67) { player.crit += 0.30; player.cdmg += 0.40; }
  if (cid === 68) { player.crit += 0.35; player.cdr *= 0.85; }
  if (cid === 69) { player.might += 0.30; player.area *= 1.25; player.revives += 1; }
  if (cid === 70) { player.might += 0.35; player.revives += 2; player.hover = true; }
  if (cid === 71) { player.might += 0.30; player.armor += 5; player.hasSaber = true; }
  if (cid === 72) { player.area *= 1.30; player.kb += 0.35; }
  if (cid === 73) { player.hasRepulsor = true; player.cdr *= 0.82; player.hover = true; }
  if (cid === 74) { player.might += 0.35; player.area *= 1.25; player.hover = true; }
  if (cid === 75) { player.might += 0.25; player.dur += 0.35; }
  if (cid === 76) { player.maxHp *= 1.45; player.armor += 6; player.might += 0.30; }
  if (cid === 77) { player.spd *= 1.28; player.crit += 0.30; player.cdmg += 0.35; }
  if (cid === 78) { player.crit += 0.35; player.cdmg += 0.45; player.bossMul = 1.40; }
  if (cid === 79) { player.spd *= 1.32; player.dodge += 0.35; player.cdr *= 0.82; }
  // v12 Custom Hero (#80): your sabers (dual = two separate weapons, own hilt / colour / level), talent & allegiance
  if (cid === CUSTOM_CID && typeof customHeroApplyRun === "function") customHeroApplyRun(player);

  player.hp = player.maxHp;
  syncHeroSpellbook();
  v10Run(V10.onRunStart, player);   // campaign modifiers, adaptive biome, squads, rewind buffer, fx
  spawnSpeech(256, 256, sig[1], "#00e676", 2.2);
  showScreen(null);
  document.getElementById("hud").classList.add("active");
  document.getElementById("hud").classList.toggle("flip", opts.hudFlip);
  updateHUD();
  sfx(220, 660, 0.18, "triangle");
}

/* === 7b. SECTOR CLEAR, DARK MATTER PAYOUT & RUN END (bug fixes) === */
// "Dark Matter Greed" shop upgrade advertises "+20% XP & DM Gain" per rank; the DM half was never applied.
function getDmGainMul() {
  const rank = (meta && Array.isArray(meta.ranks)) ? (meta.ranks[9] || 0) : 0;
  return 1 + rank * 0.20 + ((player && player.dmGreed) || 0);
}

// FIX: stages 2-50 could never be unlocked (meta.stages stayed [1]) and the stage "Drop: N DM"
// was never paid. Defeating the Sector Titan now clears the sector: its DM drop is banked
// immediately (dying afterwards cannot lose it) and the next stage unlocks. The run continues.
function onSectorTitanDefeated(x, y) {
  if (!player || player.sectorCleared) return;
  player.sectorCleared = true;
  const stg = player.stg || STAGES[0];
  const dm = Math.max(1, Math.round((stg.dmDrop || 1) * (1 + (player.bossDmMul || 0)) * getDmGainMul() * (player.dmNodeMul || 1)));
  meta.dmEarned += dm;
  player.dmStage = dm;
  if (!Array.isArray(meta.cleared)) meta.cleared = [];
  const classic = !player.campaignNode;   // v10: Expedition sectors progress the campaign map, not the classic ladder
  if (classic && !meta.cleared.includes(stg.id)) meta.cleared.push(stg.id);
  const nextId = stg.id + 1;
  player.unlockedStage = 0;
  if (classic && nextId <= STAGES.length && !meta.stages.includes(nextId)) {
    meta.stages.push(nextId);
    player.unlockedStage = nextId;
  }
  saveMeta();
  const msg = player.unlockedStage
    ? `SECTOR CLEARED! STAGE ${nextId} UNLOCKED (+${dm} DM)`
    : (nextId > STAGES.length ? `FINAL SECTOR CLEARED! (+${dm} DM)` : `SECTOR CLEARED! (+${dm} DM)`);
  spawnSpeech(player.x, player.y - 34, msg, "#00e676", 4.5);
  if (typeof campaignOnSectorCleared === "function") campaignOnSectorCleared(stg);
  if (typeof fxBossDown === "function") fxBossDown(x, y);
  sfx(330, 990, 0.42, "triangle");
  if (opts.flash && typeof flashAlpha !== "undefined") flashAlpha = Math.max(flashAlpha, 0.35);
  if (typeof updateHUD === "function") updateHUD();
}

// FIX: one exit path for every way a run can end. Quitting from the pause menu used to purge the
// run and pay 0 DM (dying paid normally) and there was no end-of-run summary at all.
function endRun(reason = "death") {
  if (!player) return null;
  const p = player;
  const killDM = Math.floor(p.kills / 18);
  const bonusDM = Math.floor(p.dmRun || 0);
  const mul = getDmGainMul();
  let runDM = Math.round((killDM + bonusDM) * mul);
  if (reason === "death") runDM = Math.max(1, runDM);   // original minimum payout on death
  meta.dmEarned += runDM;
  const stg = p.stg || STAGES[0];
  const summary = {
    reason, cid: p.cid, hero: p.hero ? p.hero[3] : "Hero",
    stageId: stg.id, stageName: `${p.fac && p.fac.worlds ? p.fac.worlds[stg.tier] : "Sector"} ${stg.suffix}`,
    diffName: p.diff ? p.diff.name : "", time: runTime, lvl: p.lvl, kills: p.kills,
    weapons: p.weapons.length, relics: p.relics.length,
    killDM, bonusDM, mul, runDM, stageDM: p.dmStage || 0, totalDM: runDM + (p.dmStage || 0),
    cleared: !!p.sectorCleared, unlockedStage: p.unlockedStage || 0, bossSpawned: !!p.bossSpawned,
    // v10 stats (captured before the purge resets the modules)
    glories: (typeof gloryState !== "undefined") ? gloryState.count : 0,
    bestStreak: (typeof fxState !== "undefined") ? fxState.bestStreak : 0,
    campaignLabel: (p.campaignNode && meta.campaign && meta.campaign.nodes && meta.campaign.nodes[p.campaignNode] && typeof campaignNodeLabel === "function")
      ? campaignNodeLabel(meta.campaign.nodes[p.campaignNode]) : ""
  };
  saveMeta();
  purgeRunMemory();
  const hud = document.getElementById("hud"); if (hud) hud.classList.remove("active");
  const pb = document.getElementById("pauseBar"); if (pb) pb.style.display = "none";
  if (typeof showRunSummary === "function") showRunSummary(summary);
  else showScreen("scrMain");
  return summary;
}

/* === 8. RELIC, PASSIVE & FORMATION SPAWNERS === */
// FIX: relic effects are now table-driven and reversible. Previously, hitting the relic cap
// shift()-ed the oldest relic out of the list WITHOUT removing its stat bonuses, and because it
// was no longer "held" it could be granted again and stack (Might 1.00 -> 1.70 -> 1.85).
function applyRelicEffect(r, sign = 1) {
  if (!player || !r) return;
  const p = player, v = r.val;
  const add = (prop, amt) => { p[prop] = (p[prop] || 0) + sign * amt; };
  const mul = (prop, f) => { p[prop] = (p[prop] || 0) * (sign > 0 ? f : 1 / f); };
  const mulHp = (f) => { p.maxHp *= (sign > 0 ? f : 1 / f); };
  const flag = (prop) => {
    if (sign > 0) { r.prevFlag = !!p[prop]; p[prop] = true; }
    else p[prop] = !!r.prevFlag;
  };
  switch (r.key) {
    case "repulsor": flag("hasRepulsor"); break;
    case "prcArm": add("pierce", 1); add("armor", 3); break;
    case "critPack": add("crit", 0.15); add("cdmg", 0.25); break;
    case "fastDraw": mul("cdr", 0.85); add("projSpd", 0.20); break;
    case "fortFast": add("fortFastMul", 0.35); add("might", 0.15); break;
    case "jetHover": mul("spd", 1.18); flag("hazImmune"); break;
    case "cdrAll": mul("cdr", 0.86); mul("utilCdrMul", 0.86); break;
    case "dmgSpd": add("might", 0.18); mul("spd", 1.15); break;
    case "magXp": mul("mag", 1.35); add("greed", 0.15); break;
    case "critArea": add("crit", 0.20); add("area", 0.18); break;
    case "armReg": add("armor", 4); add("regen", 1.5); break;
    case "utilCdr": mul("utilCdrMul", 0.78); break;
    case "pspdDur": add("projSpd", 0.30); add("dur", 0.20); break;
    case "bossDmg": add("bossMul", 0.25); break;
    case "dmgKb": add("might", v); add("kb", 0.22); break;
    case "dmg": add("might", v); break;
    case "reg": add("regen", v); break;
    case "hpArm": mulHp(1.3); if (sign > 0) p.hp += 30; add("armor", 2); break;
    case "regSpd": add("regen", 1.8); mul("spd", 1.12); break;
    case "arm": add("armor", v); break;
    case "cdmg": add("cdmg", v); break;
    case "cnt": add("projCnt", v); break;
    case "greed": add("greed", v); add("dmGreed", v); break;       // "+25% Experience & Dark Matter Greed"
    case "hp": mulHp(1 + v); if (sign > 0) p.hp += 35; break;
    case "slow": add("slow", v); break;
    case "area": add("area", v); break;
    case "cdrMag": mul("cdr", 0.88); mul("mag", 1.20); break;
    case "crit": add("crit", v); break;
    case "dm": add("bossDmMul", v); break;                          // "+30% Boss Dark Matter Yield" (was a fractional +0.3 DM)
    case "shred": add("shred", v); break;
    case "critCdr": add("crit", 0.15); mul("cdr", 0.90); break;
    case "dodge": add("dodge", v); break;
    case "spd": mul("spd", 1 + v); break;
    case "prc": add("pierce", v); break;
    case "pspd": add("projSpd", v); break;
    case "rev": add("revives", v); if (p.revives < 0) p.revives = 0; break;
    case "vehBoost": add("vehBoostMul", v); break;
    case "dur": add("dur", v); break;
    case "kb": add("kb", v); mulHp(1.2); break;
    case "omni": add("might", 0.15); add("area", 0.15); mul("cdr", 0.90); break;
  }
  p.hp = Math.min(p.hp, p.maxHp);
}

function grantRelic(forcedId = -1) {
  if (!player) return;
  const avail = RELICS_DB.filter(r => r && !player.relics.some(pr => pr.id === (r.id !== undefined ? r.id : r[0])));
  if (avail.length === 0) return;
  let rel;
  if (forcedId >= 0) {
    rel = RELICS_DB[forcedId];
    if (!rel || !avail.includes(rel)) return;   // never stack a relic that is already held
  } else {
    rel = avail[Math.floor(Math.random() * avail.length)];
  }
  let evicted = null;
  if (player.relics.length >= player.maxRelics) {
    evicted = player.relics.shift();
    applyRelicEffect(evicted, -1);               // FIX: give back the evicted relic's bonuses
  }
  const row = (typeof relicRow === "function") ? relicRow(rel) : rel;
  const r = { id: row.id !== undefined ? row.id : row[0], name: String(row.name || row[1] || "Relic"),
              desc: String(row.desc || row[2] || ""), key: row.key || row[3], val: row.val !== undefined ? row.val : row[4] };
  applyRelicEffect(r, 1);
  player.relics.push(r);

  const evName = evicted ? String(evicted.name || evicted[1] || "relic") : "";
  spawnSpeech(player.x, player.y, "RELIC: " + r.name.toUpperCase() + (evicted ? " (REPLACES " + evName.toUpperCase() + ")" : ""), "#e040fb", 2.4);
  sfx(480, 980, 0.18, "triangle"); updateHUD();
}

function applyPassive(idx) {
  const p = PASSIVES[idx], existing = player.passives.find(x => x.id === idx);
  if (existing) existing.lvl = Math.min(5, existing.lvl + 1);
  else player.passives.push({ id: idx, name: p[0], desc: p[1], lvl: 1 });
  const k = p[2], v = p[3];
  if (k === "dmg") player.might += v; else if (k === "cdr") player.cdr *= (1 - v); else if (k === "area") player.area += v;
  else if (k === "arm") player.armor += v; else if (k === "reg") player.regen += v; else if (k === "mag") player.mag *= (1 + v);
  else if (k === "spd") player.spd *= (1 + v); else if (k === "cnt") player.projCnt += v; else if (k === "dur") player.dur += v;
  else if (k === "pspd") player.projSpd += v; else if (k === "crit") player.crit += v; else if (k === "cdmg") player.cdmg += v;
  else if (k === "prc") player.pierce += v; else if (k === "hp") { player.maxHp *= (1 + v); player.hp = Math.min(player.maxHp, player.hp + player.maxHp * v); }
  else if (k === "xp") player.greed += v; else if (k === "dm") player.dmRun += v; else if (k === "kb") player.kb += v;
  else if (k === "slow") player.slow += v; else if (k === "shred") player.shred += v; else if (k === "rev") player.revives += v;
}

function allocEnemySlot(x, y, type, hpMul = 1.0, formType = 0, leaderIdx = -1) {
  for (let i = 0; i < MAX_E; i++) {
    if (!eAct[i]) {
      eX[i] = x; eY[i] = y; eVX[i] = 0; eVY[i] = 0;
      const waveScale = 1 + (waveNum - 1) * 0.22 + ChaosMath.range(i + waveNum * 31, -0.04, 0.14);
      const base = type === 99 ? 950 : (type === 98 ? 680 : (42 + runTime * 1.15));
      eHP[i] = eMax[i] = base * hpMul * player.stg.hpMul * player.diff.hpMul * waveScale;
      eSpd[i] = (type === 99 ? 56 : (type === 98 ? 78 : (40 + (type % 4) * 9 + Math.min(28, waveNum * 1.7)))) * (player.diff.spdMul || 1.0);
      eSlow[i] = 0; eShred[i] = 0; eStun[i] = 0; eGrapple[i] = 0;
      eFireCD[i] = 1.6 + Math.random() * 1.5; eSeed[i] = Math.floor(Math.random() * 1000000);
      eWave[i] = waveNum; eMoveStyle[i] = (type >= 98 || formType > 0) ? 0 : (eSeed[i] % 4);
      clearEnemyLimbState(i, false);
      if (typeof eScarHeat !== "undefined") eScarHeat[i] = 0;
      eFormType[i] = formType; eFormLeader[i] = leaderIdx;
      eType[i] = type; eRivalCid[i] = -1; eAct[i] = 1;
      eUid[i] = enemyUidCounter++; eEcho[i] = 0; eStagger[i] = 0; eDummy[i] = 0;
      return i;
    }
  }
  return -1;
}

function spawnEnemy(isBoss = false, isRival = false) {
  // v13: rivals / Titans arrive from the direction the Threat Sense meter has been pointing at
  const ang = ((isBoss || isRival) && typeof threatSpawnAngle === "function") ? threatSpawnAngle(isBoss) : Math.random() * Math.PI * 2;
  const dist = (isBoss || isRival ? 235 : 305) / Math.min(1.2, opts.zoom);
  const sx = player.x + Math.cos(ang) * dist, sy = player.y + Math.sin(ang) * dist;
  if (isRival) {
    const idx = allocEnemySlot(sx, sy, 98, 1.0, 0, -1);
    if (idx >= 0) {
      // v12: rivals come from the 80 canon heroes (never your custom hero #80)
      let rCid = typeof randomRosterHero === "function" ? randomRosterHero() : Math.floor(Math.random() * 80);
      if (rCid === player.cid) rCid = (rCid + 1) % 80;
      eRivalCid[idx] = rCid;
      const callout = typeof getRivalCallout === "function" ? getRivalCallout(rCid, player.cid) : "Bounty target locked!";
      spawnSpeech(player.x, player.y - 24, `${CHAR_RAW[rCid][3].toUpperCase()}: "${callout}"`, "#ff5252", 3.8);
      sfx(140, 420, 0.4, "sawtooth", 0.35);
      if (typeof showdownBegin === "function") showdownBegin(idx);   // v12: the crowd backs off - Rival Showdown
    }
    return;
  }
  if (isBoss) { if (allocEnemySlot(sx, sy, 99, 1.0, 0, -1) >= 0) sfx(110, 165, 0.45, "sawtooth", 0.35); return; }
  const r = Math.random();
  if (r < 0.14) {
    const lead = allocEnemySlot(sx, sy, 0, 1.15, 1, -1);
    if (lead >= 0) {
      eSeed[lead] = Math.floor(eSeed[lead] / 5) * 5;
      const perp = ang + Math.PI * 0.5;
      const f1 = allocEnemySlot(sx + Math.cos(perp) * 24, sy + Math.sin(perp) * 24, 0, 1.0, 1, lead);
      const f2 = allocEnemySlot(sx - Math.cos(perp) * 24, sy - Math.sin(perp) * 24, 0, 1.0, 1, lead);
      if (f1 >= 0) eSeed[f1] = Math.floor(eSeed[f1] / 5) * 5;
      if (f2 >= 0) eSeed[f2] = Math.floor(eSeed[f2] / 5) * 5;
    }
  } else if (r < 0.28) {
    const master = allocEnemySlot(sx, sy, 0, 1.1, 2, -1);
    if (master >= 0) { allocEnemySlot(sx + 22, sy - 18, 1, 0.9, 2, master); allocEnemySlot(sx - 22, sy + 18, 1, 0.9, 2, master); }
  } else allocEnemySlot(sx, sy, Math.floor(Math.random() * 4), 1.0, 0, -1);
}

/* === 9. WEAPON & SPELLBOOK FIRING ENGINE === */
function fireWeapon(w) {
  syncHeroSpellbook();
  if (w.lvl >= 5 && w.lvl < 10 && !w.evolvedLv5) {
    const sig = HERO_SIG_GEAR[w.id];
    if (sig && sig[0]) {
      w.name = sig[0] + (w.dualTag || ""); w.evolvedLv5 = true; player.equipAnimTimer = 1.2;   // v12: twin sabers keep "#1 of 2"
      spawnSpeech(player.x, player.y, "PRIMARY ARSENAL: " + sig[0].toUpperCase() + "!", "#ffd166", 2.0);
    }
  }

  player.combatAlertTimer = 1.4;
  const sup = w.lvl >= 10 ? 1 : 0, lv5Boost = w.lvl >= 5 ? 1.25 : 1.0;
  const count = 1 + Math.floor(w.lvl / 3) + player.projCnt + (sup ? 2 : 0);
  const lowHpBonus = (player.cid === 13 && player.hp < player.maxHp * 0.5) ? 1.35 : 1;
  const killBonus = player.cid === 24 ? Math.min(2, 1 + Math.floor(player.kills / 15) * 0.01) : 1;
  const mechBonus = player.inVehicle === 2 ? 1.6 : 1.0;
  const armFactor = 0.7 + 0.3 * (Math.min(player.limbs[2], player.limbs[3]) / 100);
  let baseDmg = (18 + w.lvl * 8.0) * lv5Boost * player.might * lowHpBonus * killBonus * mechBonus * armFactor * (sup ? 2.35 : 1);

  let tx = player.x + Math.cos(player.aim) * 120, ty = player.y + Math.sin(player.aim) * 120, best = 1e9;
  let tx2 = 0, ty2 = 0, best2 = 1e9;
  for (let i = 0; i < MAX_E; i++) {
    if (eAct[i] && !(eStagger[i] > 0) && !(typeof sdIgnore === "function" && sdIgnore(i)) && isEnemyOnScreen(i)) {
      const d = Math.hypot(eX[i] - player.x, eY[i] - player.y);
      if (d < best) { best2 = best; tx2 = tx; ty2 = ty; best = d; tx = eX[i]; ty = eY[i]; }
      else if (d < best2) { best2 = d; tx2 = eX[i]; ty2 = eY[i]; }
    }
  }
  // v13: the second of a twin pair (two six-shooters...) takes the second-nearest target
  if (((w.twinIdx || 0) % 2 === 1) && best2 < 1e9) { tx = tx2; ty = ty2; }
  const eyeJitter = ((100 - player.limbs[0]) / 100) * 0.42;
  const aimAng = Math.atan2(ty - player.y, tx - player.x) + (Math.random() - 0.5) * eyeJitter;

  if (w.id === 75) {
    if (w.lvl >= 2 && typeof countActiveCorpsesNear === "function" && countActiveCorpsesNear(player.x, player.y, 320) > 0) {
      castArcaneSpell("raiseDead", false);
      return;
    }
    if (typeof sfxSpell === "function") sfxSpell("raiseDead");
    for (let k = 0; k < count; k++) {
      const a = aimAng + (k - (count - 1) / 2) * 0.20;
      spawnProj(player.x, player.y, Math.cos(a) * 360, Math.sin(a) * 360, baseDmg * 1.25, 0.85, 10, 2 + player.pierce, 5, sup, 0, 75);
    }
    return;
  }

  if (w.id === 67) {
    castArcaneSpell("sectumSlash", false);
    return;
  }

  if ((typeof isSwordWeapon === "function" && isSwordWeapon(w.id)) || (w.style === "orbit" && ![12, 16, 29, 35, 44, 73].includes(w.id))) {
    if (w.id === 71) {
      if (typeof sfxSpell === "function") sfxSpell("wand");
      spawnProj(player.x, player.y, Math.cos(aimAng) * 440, Math.sin(aimAng) * 440, baseDmg * 1.2, 0.75, 9, 3 + player.pierce, 4, sup, 0, 71);
    }
    // v11: the Saber Form Engine (js/saberforms.js) choreographs every swing, hop and swing sound itself.
    if (typeof saberEngineOwns === "function" && saberEngineOwns(w)) return;
    if (best <= 58 * player.area) {
      player.swordSwingTimer = 0.34;
      player.armReach = 5.5;
      if (player.cid === 79 && (player.acrobatZ || 0) <= 0.5) {
        player.acrobatVZ = 38 + Math.min(28, w.lvl * 2.5);
        player.acrobatFlip = Math.PI * 2;
      }
      if (typeof sfxWeapon === "function") sfxWeapon("orbit", w.id, true);
    } else if (w.id !== 71) {
      w.cd = 0.12;
    }
    return;
  }

  if (w.style === "orbit") {
    if (typeof sfxWeapon === "function") sfxWeapon("orbit", w.id, false);
    const discCnt = Math.min(4, count);
    for (let k = 0; k < discCnt; k++) {
      const launchAng = aimAng + (k - (discCnt - 1) / 2) * 0.35 + (Math.random() - 0.5) * 0.22;
      const curveSign = ((k & 1) ? 1 : -1) * (0.42 + Math.random() * 0.25);
      spawnProj(player.x, player.y, launchAng, curveSign, baseDmg * 1.4, 1.35, 13 * player.area, 99, 8, sup, 0, w.id);
    }
    return;
  }

  if (typeof sfxWeapon === "function") sfxWeapon(w.style, w.id, false);

  if (w.id === 52 || w.id === 13) {
    const spd = 540 * player.projSpd, spread = (Math.random() - 0.5) * (0.05 + eyeJitter * 0.4);
    spawnProj(player.x, player.y, Math.cos(aimAng + spread) * spd, Math.sin(aimAng + spread) * spd, baseDmg * 2.2, 0.75 * player.dur, 4.5, 2 + player.pierce + (sup ? 4 : 0), 4, sup, 0, w.id);
    return;
  }

  // v9.01: Mandalorian (#1) primary is the canonical IB-94 Beskar heavy blaster pistol: slow,
  // heavy, high-pierce slugs (double-tap from Lv.4, an extra slug at Lv.10 / with +Projectiles).
  if (w.id === 1) {
    const taps = 1 + (w.lvl >= 4 ? 1 : 0) + (sup ? 1 : 0) + Math.min(1, player.projCnt);
    for (let b = 0; b < taps; b++) {
      const a = aimAng + (b - (taps - 1) / 2) * 0.035, spd = 600 * player.projSpd;
      spawnProj(player.x, player.y, Math.cos(a) * spd, Math.sin(a) * spd, baseDmg * 2.0, 0.8 * player.dur, 6, 2 + player.pierce + (sup ? 4 : 0), 4, sup, 0, 1);
    }
    return;
  }

  if (w.id === 54) {
    for (let b = 0; b < 3; b++) {
      const a = aimAng + (b - 1) * 0.045;
      const spd = (450 - b * 18) * player.projSpd;
      spawnProj(player.x + Math.cos(a) * (10 + b * 6), player.y + Math.sin(a) * (10 + b * 6), Math.cos(a) * spd, Math.sin(a) * spd, baseDmg * 0.65, 0.72 * player.dur, 5, 2 + player.pierce, 4, sup, 0, 54);
    }
    return;
  }

  if (w.style === "missile") {
    for (let k = 0; k < count; k++) {
      const a = aimAng + (k - (count - 1) / 2) * 0.26, spd = 235 * player.projSpd;
      spawnProj(player.x, player.y, Math.cos(a) * spd, Math.sin(a) * spd, baseDmg, 1.6 * player.dur, 9 * player.area, player.pierce, 2, sup, 0, w.id);
    }
  } else if (w.style === "cone") {
    const isHeavyMG = [37, 53].includes(w.id);
    const pellets = isHeavyMG ? (count + 1) : (count + 3);
    const spreadStep = isHeavyMG ? 0.08 : 0.15;
    for (let k = 0; k < pellets; k++) {
      const a = aimAng + (k - (pellets - 1) / 2) * spreadStep + (Math.random() - 0.5) * 0.04;
      const spd = (isHeavyMG ? 410 : (295 + Math.random() * 45)) * player.projSpd;
      spawnProj(player.x, player.y, Math.cos(a) * spd, Math.sin(a) * spd, baseDmg * (isHeavyMG ? 1.05 : 0.85), (isHeavyMG ? 0.68 : 0.48) * player.dur, 6.5 * player.area, player.pierce + 1, 3, sup, 0, w.id);
    }
  } else if (w.style === "beam") {
    for (let k = 0; k < count; k++) {
      const a = aimAng + (k - (count - 1) / 2) * 0.10, spd = 470 * player.projSpd;
      spawnProj(player.x, player.y, Math.cos(a) * spd, Math.sin(a) * spd, baseDmg * 1.25, 0.75 * player.dur, 8.5 * player.area, 4 + player.pierce + (sup ? 6 : 0), 4, sup, 0, w.id);
    }
  } else if (w.style === "chain") {
    const isAvada = w.id === 70;
    for (let k = 0; k < count; k++) {
      const a = aimAng + (k - (count - 1) / 2) * 0.22, spd = (isAvada ? 420 : 340) * player.projSpd;
      spawnProj(player.x, player.y, Math.cos(a) * spd, Math.sin(a) * spd, baseDmg * (isAvada ? 1.45 : 1.0), 0.9 * player.dur, 10 * player.area, 2 + player.pierce + (sup ? 4 : 0), 5, isAvada ? 3 : sup, 0, w.id);
    }
  } else {
    executeForceKineticPush(player.x, player.y, aimAng, w.lvl, baseDmg * 0.75);
  }
}

/* === 10. 2-BUTTON UTILITY ROUTER & AUTONOMOUS SPELL/CQC/HARDWARE LOOP === */
function triggerUtility(uIdx) {
  if (!player || !player.utils[uIdx]) return;
  const u = player.utils[uIdx]; if (u.cd > 0) return; u.cd = u.cdMax * player.utilCdrMul;
  player.combatAlertTimer = 2.0;

  if (["leviosaFloat", "patronusStag", "avadaKedavra", "sectumSlash", "youShallNotPass", "piertotumKnights", "raiseDead", "summonHound", "timeRewind", "kneeDarts", "bobaDisintegrate"].includes(u.type)) {
    player.lastUtilName = u.name;                                // v13: "Tutaminis ..." wards are Force wards, not Protego
    castArcaneSpell(u.type, true);
    updateHUD();
    return;
  }

  if (u.type === "whistlingBirds") {          // v9.01: Mandalorian active Skill 1 (js/arsenal.js)
    if (typeof castWhistlingBirds === "function") castWhistlingBirds(u);
    updateHUD();
    return;
  }
  // v13 creator skills (js/force.js / js/creator.js)
  if (u.type === "mindTrick" || u.type === "thermalDetonator" || u.type === "forceChoke") {
    if (u.type === "mindTrick" && typeof forceMindTrick === "function") forceMindTrick();
    else if (u.type === "thermalDetonator" && typeof throwThermalDetonator === "function") throwThermalDetonator();
    else if (u.type === "forceChoke" && typeof castForceChoke === "function") castForceChoke();
    updateHUD();
    return;
  }

  if (u.type === "buildFort") {
    deployLastStandFort(player.x, player.y);
  } else if (u.type === "quadSpin") {
    player.whirlwindTimer = 1.15;
    player.swordSwingTimer = 1.15;
    player.armReach = 6.0;
    if (player.cid === 79) {
      player.acrobatVZ = 58;
      player.acrobatFlip = Math.PI * 4;
    }
    if (typeof sfxWeapon === "function") sfxWeapon("orbit", player.cid, true);
    spawnSpeech(player.x, player.y, u.name.toUpperCase() + "!", "#00f0ff", 1.3);
  } else if (u.type === "grappleHook") {
    let best = -1, bestHP = -1;
    for (let i = 0; i < MAX_E; i++) {
      if (eAct[i] && isEnemyOnScreen(i) && !(typeof sdIgnore === "function" && sdIgnore(i)) && Math.hypot(eX[i] - player.x, eY[i] - player.y) < 320 && eHP[i] > bestHP) {
        bestHP = eHP[i]; best = i;
      }
    }
    if (best >= 0) {
      eGrapple[best] = 5.5; eStun[best] = 5.5;
      spawnSpeech(eX[best], eY[best], "GRAPPLED!", "#00e5ff", 1.8);
      sfx(620, 210, 0.16, "sawtooth");
    }
  } else if (u.type === "flameCone") {
    flameVisTimer = 0.75; sfx(140, 75, 0.25, "sawtooth", 0.28);
    for (let i = 0; i < MAX_E; i++) {
      if (!eAct[i] || allyIs(i)) continue;
      const dx = eX[i] - player.x, dy = eY[i] - player.y, d = Math.hypot(dx, dy);
      if (d < 138 * player.area) {
        let diff = Math.atan2(dy, dx) - player.aim;
        while (diff > Math.PI) diff -= Math.PI * 2;
        while (diff < -Math.PI) diff += Math.PI * 2;
        if (Math.abs(diff) < 0.75 || d < 42) {
          const fDmg = 165 * player.might;
          eHP[i] -= fDmg; eSlow[i] = 2.0;
          spawnDmg(eX[i], eY[i], fDmg, true);
          if (eHP[i] <= 0 && typeof killEnemy === "function") killEnemy(i, false);
        }
      }
    }
  } else if (u.type === "fanHammer" || u.type === "critBurst") {
    for (let k = 0; k < 10; k++) {
      const a = player.aim + (k - 4.5) * (u.type === "fanHammer" ? 0.14 : 0.62);
      spawnProj(player.x, player.y, Math.cos(a) * 480, Math.sin(a) * 480, 110 * player.might, 0.8, 8, 4, 4, 1, 0, player.cid);
    }
    if (typeof sfxWeapon === "function") sfxWeapon("beam", player.cid, false);
  } else if (u.type === "executeDash") {
    player.armReach = 6.5;
    for (let i = 0; i < MAX_E; i++) {
      if (eAct[i] && !allyIs(i) && Math.hypot(eX[i] - player.x, eY[i] - player.y) < 140) {
        const pushA = Math.atan2(eY[i] - player.y, eX[i] - player.x);
        eX[i] += Math.cos(pushA) * 42; eY[i] += Math.sin(pushA) * 42; eStun[i] = 2.5;
        if (player.cid === 78) eShred[i] = Math.min(12, eShred[i] + 6);
        const execDmg = eType[i] >= 98 ? Math.max(280 * player.might, eMax[i] * 0.38) : eHP[i] + 50;
        eHP[i] -= execDmg;
        spawnDmg(eX[i], eY[i], execDmg, true);
        if (eHP[i] <= 0 && typeof killEnemy === "function") killEnemy(i, true);
      }
    }
    spawnSpeech(player.x, player.y, u.name.toUpperCase() + "!", "#ffd166", 1.5);
    sfx(820, 120, 0.14, "sawtooth");
  } else if (u.type === "stareFreeze") {
    for (let i = 0; i < MAX_E; i++) {
      if (eAct[i] && !allyIs(i) && (isEnemyOnScreen(i) || Math.hypot(eX[i] - player.x, eY[i] - player.y) < 340)) {
        eStun[i] = Math.max(eStun[i], 3.5);
        eSlow[i] = Math.max(eSlow[i], 5.0);
        if (player.cid === 76) {
          const chokeDmg = 145 * player.might;
          eHP[i] -= chokeDmg;
          spawnDmg(eX[i], eY[i], chokeDmg, true);
          if (eHP[i] <= 0 && typeof killEnemy === "function") killEnemy(i, false);
        }
      }
    }
    spawnSpeech(player.x, player.y, u.name.toUpperCase() + "!", "#ffd166", 2.0);
    sfx(440, 880, 0.25, "triangle");
  } else if (u.type === "explosiveBow") {
    for (let k = -1; k <= 1; k++) {
      const a = player.aim + k * 0.12;
      spawnProj(player.x, player.y, Math.cos(a) * 390, Math.sin(a) * 390, 210 * player.might, 1.4, 15 * player.area, 0, 2, 1, 0, player.cid);
    }
    spawnSpeech(player.x, player.y, u.name.toUpperCase() + "!", "#ff6d00", 1.6);
    sfx(320, 110, 0.18, "sawtooth");
  } else if (u.type === "cyborgRush") {
    player.overclockTimer = 4.5;
    spawnSpeech(player.x, player.y, u.name.toUpperCase() + "!", "#00e676", 2.0);
    sfx(280, 960, 0.24, "sawtooth");
  } else {
    const pushLvl = Math.max(player.sigGearLvl || 1, player.weapons[0] ? player.weapons[0].lvl : 1);
    executeForceKineticPush(player.x, player.y, player.aim, pushLvl, 38 * player.might);
    spawnSpeech(player.x, player.y, u.name.toUpperCase() + "!", "#00e5ff", 1.3);
  }
  updateHUD();
}

function updateHeroSpecials(simDt) {
  player.utils.forEach(u => { if (u.cd > 0) u.cd = Math.max(0, u.cd - simDt); });
  if (Array.isArray(player.spellbook)) {
    player.spellbook.forEach(sp => { if (sp.cd > 0) sp.cd = Math.max(0, sp.cd - simDt); });
  }
  if (player.cqcCD > 0) player.cqcCD = Math.max(0, player.cqcCD - simDt);
  if (player.dashCD > 0) player.dashCD = Math.max(0, player.dashCD - simDt);
  if (player.dashTimer > 0) player.dashTimer = Math.max(0, player.dashTimer - simDt);
  if (player.deflectStanceTimer > 0) player.deflectStanceTimer = Math.max(0, player.deflectStanceTimer - simDt);
  if (player.autoFlameCD > 0) player.autoFlameCD -= simDt;
  if (player.equipAnimTimer > 0) player.equipAnimTimer = Math.max(0, player.equipAnimTimer - simDt);
  if (player.adaptTimer > 0) player.adaptTimer = Math.max(0, player.adaptTimer - simDt);
  if (player.overclockTimer > 0) player.overclockTimer = Math.max(0, player.overclockTimer - simDt);
  if (player.whirlwindTimer > 0) player.whirlwindTimer = Math.max(0, player.whirlwindTimer - simDt);
  if (player.forceHandTimer > 0) player.forceHandTimer = Math.max(0, player.forceHandTimer - simDt);
  if (player.armReach > 0) player.armReach = Math.max(0, player.armReach - simDt * 18);
  if (player.combatAlertTimer > 0) player.combatAlertTimer = Math.max(0, player.combatAlertTimer - simDt);
  if (forcePushVis.timer > 0) forcePushVis.timer = Math.max(0, forcePushVis.timer - simDt);

  if ([51, 19, 41, 42].includes(player.cid) && player.cqcCD <= 0) {
    for (let i = 0; i < MAX_E; i++) {
      if (eAct[i] && !allyIs(i) && Math.hypot(eX[i] - player.x, eY[i] - player.y) < 42) {
        player.cqcCD = 3.2 * (player.cdr || 1.0);
        player.armReach = 6.0;
        eStun[i] = Math.max(eStun[i], 1.8);
        if (eArmsLost[i] < 2) eArmsLost[i]++;
        const cqcDmg = (95 + player.lvl * 15) * player.might;
        eHP[i] -= cqcDmg;
        spawnDmg(eX[i], eY[i], cqcDmg, true);
        if (eHP[i] <= 0 && typeof killEnemy === "function") killEnemy(i, true);
        sfx(880, 160, 0.08, "sawtooth", 0.22);
        break;
      }
    }
  }

  const isFemale = [8, 11, 14, 20, 23, 25, 27, 28, 30, 42, 47, 57, 59, 66, 68, 74].includes(player.cid);
  if (player.blinkDur > 0) {
    player.blinkDur = Math.max(0, player.blinkDur - simDt);
  } else {
    player.blinkTimer = (player.blinkTimer || 2.0) - simDt;
    if (player.blinkTimer <= 0) {
      player.blinkDur = isFemale ? 0.09 : 0.13;
      const inCombat = player.combatAlertTimer > 0;
      player.blinkTimer = (inCombat ? 2.8 : 1.7) + Math.random() * (inCombat ? 1.8 : 1.2);
    }
  }

  if (player.cid === 42 || player.cid === 63) {
    if (player.sandTimer > 0) player.sandTimer = Math.max(0, player.sandTimer - simDt);
    else {
      player.sandCD = (player.sandCD || 6.0) - simDt;
      if (player.sandCD <= 0) {
        player.sandCD = player.cid === 63 ? 9.0 : 6.0;
        player.sandTimer = 2.4;
        spawnSpeech(player.x, player.y, player.cid === 63 ? "FULL-MOON WEREWOLF FRENZY!" : "SANDEVISTAN OVERDRIVE!", "#00e676", 1.4);
      }
    }
  }

  if (player.cid === 43) {
    if (player.vatsTimer > 0) player.vatsTimer = Math.max(0, player.vatsTimer - simDt);
    else {
      player.vatsCD = (player.vatsCD || 4.0) - simDt;
      if (player.vatsCD <= 0) { player.vatsCD = 4.0; player.vatsTimer = 1.25; }
    }
  }

  if (player.swordSwingTimer > 0) player.swordSwingTimer = Math.max(0, player.swordSwingTimer - simDt);
  if (player.swordLungeTimer > 0) player.swordLungeTimer = Math.max(0, player.swordLungeTimer - simDt);

  const limbHeal = (0.8 + player.regen * 0.9) * simDt;
  for (let z = 0; z < 6; z++) { if (player.limbs[z] < 100) player.limbs[z] = Math.min(100, player.limbs[z] + limbHeal); }
  if (player.hasSaber && player.saberMastery < 100) player.saberMastery = Math.min(100, player.saberMastery + simDt * 0.45);

  if (player.cid === 53) {
    if (Math.hypot(player.x - player.fortAnchorX, player.y - player.fortAnchorY) <= 180) {
      player.fortTimer += simDt * player.fortFastMul;
      if (player.fortTimer >= 120) { player.fortTimer = 0; deployLastStandFort(player.x, player.y); }
    } else {
      player.fortAnchorX = player.x; player.fortAnchorY = player.y; player.fortTimer = Math.max(0, player.fortTimer - simDt * 0.5);
    }
  }

  const sig = HERO_SIG_GEAR[player.cid] || HERO_SIG_GEAR[0];
  player.sigGearCD -= simDt;
  if (player.sigGearCD <= 0) {
    let best = -1, maxH = 0;
    for (let i = 0; i < MAX_E; i++) {
      if (eAct[i] && isEnemyOnScreen(i) && !(typeof sdIgnore === "function" && sdIgnore(i)) && !(eStagger[i] > 0) && Math.hypot(eX[i] - player.x, eY[i] - player.y) < 280 && eHP[i] > maxH) {
        maxH = eHP[i]; best = i;
      }
    }
    if (best >= 0) {
      player.sigGearCD = sig[5] * player.cdr;
      const ma = Math.atan2(eY[best] - player.y, eX[best] - player.x);
      const st = sig[3], sLvl = player.sigGearLvl || 1;
      const dmg = 110 * sig[4] * (1 + (sLvl - 1) * 0.2) * player.might;

      if (player.cid === 70) {
        castArcaneSpell("avadaKedavra", false);
      } else if (player.cid === 66) {
        castArcaneSpell("piertotumKnights", false);
      } else if (player.cid === 75) {
        castArcaneSpell("raiseDead", false);
      } else if ([60, 61, 62, 64].includes(player.cid)) {
        castArcaneSpell("summonHound", false);
      } else if (st === 6 || st === 7) {
        executeForceKineticPush(player.x, player.y, ma, sLvl, 26 * sig[4] * player.might);
      } else {
        spawnProj(player.x, player.y - 10, Math.cos(ma) * 320, Math.sin(ma) * 320, dmg, 1.5, 12 * player.area, 3, st, 1, 0, player.cid);
        sfx(540, 220, 0.09, "sawtooth", 0.2);
      }
      spawnSpeech(player.x, player.y, `${sig[2].toUpperCase()} (Lv.${sLvl})!`, "#ffd166", 1.15);
    }
  }

  if (player.cid === 54) {
    if (player.autoFlameCD <= 0) {
      let nearCnt = 0;
      for (let i = 0; i < MAX_E; i++) { if (eAct[i] && !allyIs(i) && Math.hypot(eX[i] - player.x, eY[i] - player.y) < 115) nearCnt++; }
      if (nearCnt >= 4) {
        player.autoFlameCD = 4.5; flameVisTimer = 0.65;
        spawnSpeech(player.x, player.y, "WRIST FLAMETHROWER!", "#ff6d00", 1.4); sfx(150, 65, 0.22, "sawtooth", 0.25);
        for (let i = 0; i < MAX_E; i++) {
          if (eAct[i] && !allyIs(i) && Math.hypot(eX[i] - player.x, eY[i] - player.y) < 125 * player.area) {
            const flmDmg = 130 * player.might;
            eHP[i] -= flmDmg; eStun[i] = 1.0;
            spawnDmg(eX[i], eY[i], flmDmg, true);
            if (eHP[i] <= 0 && typeof killEnemy === "function") killEnemy(i, false);
          }
        }
      }
    }
    const bobaLvl = Math.max(player.lvl || 1, player.weapons[0] ? player.weapons[0].lvl : 1);
    if (bobaLvl >= 2) {
      player.kneeDartCD = (player.kneeDartCD || 6.5) - simDt;
      if (player.kneeDartCD <= 0) {
        player.kneeDartCD = 7.5 * player.cdr;
        if (bobaLvl >= 6 && Math.random() < 0.42) castArcaneSpell("bobaDisintegrate", false);
        else castArcaneSpell("kneeDarts", false);
      }
    }
  }
}
// EOF:js/combat.js
