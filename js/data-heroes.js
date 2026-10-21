// FILE: js/data-heroes.js
// PART: 7 of 14
// DETAIL: 55 Playable Heroes (#00-#54), Utility Skill specs, 3-line randomized Boss Kill One-Liners per hero/faction, Hero Alignments, and Rival Invasion Callouts.

"use strict";

/* === 1. 55 MULTIVERSE HEROES (#00-#54) ===
   [id, fac, cost, HeroName, WeaponName, SuperchargeName, Style, PassiveName, PassiveSpec] */
const CHAR_RAW = [
  [0, 0, 0, "Aether-Blade Initiate", "Cyan Plasma Saber", "Twin-Sun Saber Vortex", "orbit", "Force Reflex", "+15% Speed & 100% Innate Force Orb Vacuum"],
  [1, 0, 3, "Beskar Creed Tracker", "Whistling Micro-Darts", "Darksaber Phoenix Salvo", "missile", "Beskar Plating", "+4 Flat Armor & -20% Damage Taken"],
  [2, 0, 2, "Imperial White-Trooper", "E-Series Scatter Blaster", "Garrison Overwatch", "cone", "Suppressive Scatter", "+35% Fire Rate & +1 Projectile"],
  [3, 0, 8, "Crimson Sith Sovereign", "Dark Chain Lightning", "Unlimited Tempest Web", "chain", "Dark Hate Conduit", "100% Force Vacuum, +25% Crit Dmg & Kill Heal"],
  [4, 0, 4, "R2-Chirp Astro-Droid", "Electro-Prod & Slick", "Hacked Turret Grid", "nova", "Overclocked Servos", "-18% All Weapon Cooldowns"],
  [5, 0, 5, "Kashyyyk Bow-Roarer", "Quarrel Laser-Bow", "Thermal Detonator Volley", "cone", "Wookiee Rage", "+30% Max HP & +20% Weapon Area"],
  [6, 0, 5, "Corellian Kessel Runner", "Heavy DL-Blaster", "Freighter Orbital Strafe", "beam", "Shoots First", "+30% Crit Chance & +25% XP/DM Greed"],
  [7, 1, 12, "Anupas Jackal-Gold", "Eye of Ra Solar Ribbon", "Dakara Ascended Wave", "nova", "Half-Ascended Divinity", "100% Telekinetic Vacuum, +25% Dmg & Revive"],
  [8, 1, 4, "Chevron-1 Tac-Colonel", "AP-PDW Rapid Burst", "Stargate Kawoosh Vortex", "beam", "C4 Improviser", "+25% Projectile Speed & -12% Cooldown"],
  [9, 1, 5, "Serpent-Guard Prime", "Ma'Tok Plasma Staff", "Twin Staff & Zat Disintegrator", "missile", "Symbiote Regen", "+2.0 HP/s Regen & +20% Max HP"],
  [10, 1, 9, "Othala Grey Sage", "Asgard Ion Pulse", "O'Neill Orbital Pillar", "beam", "Beaming Phase", "100% Beaming Vacuum, +1 Relic & Phase Dodge"],
  [11, 1, 8, "Pegasus Hive Matron", "Bio-Web Stunner", "Culling Dart Squadron", "chain", "Life-Force Drain", "Heals 3 HP every 10 kills & slows foes"],
  [12, 1, 10, "Hallowed Origin Prior", "Origin Sacred Halo", "Supergate Inferno Nova", "orbit", "Hallowed Zeal", "100% Telekinetic Vacuum, +35% Area & +25% Dur"],
  [13, 2, 4, "Browncoat Captain", "Brass Frontier Six-Gun", "Crazy-Ivan Full Burn", "cone", "Aim to Misbehave", "+20% Speed & +35% Damage below 50% HP"],
  [14, 2, 9, "Miranda Psychic Dancer", "Whirling Crescent Blades", "Precog Blade Clones", "orbit", "Hands of Blue Evasion", "100% Psychic Vacuum, +30% Dodge & +25% Crit"],
  [15, 2, 5, "Canton Heavy Merc", "Vera Auto-Cannon", "Airlock Sonic Shell", "beam", "Hero of Canton", "+30% Might & +3 Armor"],
  [16, 2, 4, "Soaring Leaf Pilot", "Thruster Plasma Wash", "Shuttle Gun-Pod Drift", "orbit", "Leaf on the Wind", "+35% Move Speed & Hazard Resistance"],
  [17, 2, 7, "Reaver Blood-Harpooner", "Tethered Rip-Saw", "Reactor Meltdown Saws", "chain", "Core-Radiation Frenzy", "Up to +60% Fire Rate as HP drops"],
  [18, 3, 10, "Muad'Dib Sand-Prophet", "Crysknife Weirding Step", "Shai-Hulud Maker Eruption", "nova", "Prescience", "100% Voice Vacuum, +25% Dodge & +30% Magnet"],
  [19, 3, 6, "Sardaukar Executioner", "Holtzman Slow-Blade", "Subatomic Shield Lasgun", "beam", "Salusa Conditioning", "+30% Crit Damage & +2 Pierce"],
  [20, 3, 8, "Bene-Voice Matron", "The Voice Pitch Cone", "Kwisatz Mind-Crush", "cone", "Litany Against Fear", "100% Voice Vacuum, Hazard Immune & -15% CD"],
  [21, 3, 7, "Harkonnen Hover-Baron", "Hunter-Seeker Needle", "Giedi Artillery Rain", "missile", "Suspensor Levitation", "Flies over Rocks/Hazards & +40% Greed"],
  [22, 4, 3, "Red-Shirt Commander", "Set-to-Vaporize Phaser", "Quantum Torpedo Array", "beam", "Plot-Armor Shield", "Survives lethal damage with 1 Revival"],
  [23, 4, 9, "Hive-Cube Assimilator", "Nanoprobe Tubules", "Tactical Cube Trench Beam", "chain", "Adaptive Shielding", "Taking damage grants +5 Armor for 5s"],
  [24, 4, 5, "Qo'noS Bat'leth Guard", "Crescent Bat'leth Spin", "Bird-of-Prey Decloak", "orbit", "Sto-Vo-Kor Bloodlust", "+1% Damage per 15 kills (up to +100%)"],
  [25, 4, 5, "Viper Starbuck-Ace", "KEW Flak Screen", "Battlestar Nuke Salvo", "nova", "Combat Thrusters", "+25% Move Speed & +1 Extra Projectile"],
  [26, 4, 6, "Centauri Cylon Raider", "Forearm Bayonet Volley", "Basestar Nuclear Swarm", "missile", "Resurrection Uplink", "+1 Extra Revival & +25% Proj Speed"],
  [27, 4, 8, "Spectre Biotic Vanguard", "Biotic Singularity", "Warp Supernova Detonation", "nova", "Mass Effect Barrier", "100% Biotic Vacuum, +35% Max HP & +25% KB"],
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
  [38, 6, 8, "Warp Psyker Inquisitor", "Purging Warp-Flame", "Astronomican Sun Nova", "nova", "Emperor's Tarot", "100% Warp Vacuum, +25% Crit & +30% Crit Dmg"],
  [39, 7, 11, "Zion Bullet-Time One", "Telekinetic Bullet Wall", "Source-Code Decompiler", "nova", "There Is No Spoon", "100% Telekinetic Vacuum, +35% Dodge & -20% CD"],
  [40, 7, 7, "T-800 Endo-Enforcer", "40-Watt Plasma Rifle", "Time-Sphere Lightning", "beam", "Hyperalloy Chassis", "+50% Max HP & +6 Flat Armor"],
  [41, 7, 6, "Neon Origami Runner", "PKD Detonator Magnum", "Spinner Railgun Sweep", "missile", "Voight-Kampff Lock", "+50% Damage vs Bosses & +20% Crit"],
  [42, 7, 9, "Sandevistan Edgerunner", "Thermal Monowire Lash", "Cyberpsychosis Daemons", "chain", "Sandevistan Overdrive", "Bursts to 180% Speed & Rate every 6s"],
  [43, 7, 6, "Vault-Tec Wanderer", "Tri-Beam & Cap Mine", "MIRV Fat-Man Catapult", "nova", "V.A.T.S. Crit Lock", "Guaranteed Crit pulses every 4s"],
  [44, 7, 5, "V8 Chrome Interceptor", "Thunderstick Lance", "Doof-Wagon Fire Tornado", "orbit", "Witness Me! Nitro", "+35% Move Speed & +25% Area"],
  [45, 8, 8, "Black-Mesa Physicist", "Zero-Point Grav-Cannon", "Supercharged Gluon Beam", "beam", "HEV Morphine Suit", "100% Grav-Gun Vacuum, +5 Armor & Haz Immune"],
  [46, 8, 10, "Gallifrey Sonic Traveler", "Sonic Resonance Ring", "TARDIS Time Vortex", "nova", "Time-Lord Regeneration", "2 Revivals that boost all stats +20%"],
  [47, 8, 9, "Chozo Morph Hunter", "Wave-Ice-Plasma Beam", "Power-Bomb Hyper-Beam", "cone", "Screw-Attack Thrusters", "+25% Speed & Contact Dash Damage"],
  [48, 9, 7, "Silver-Sword Mutagen", "Igni Sign & Silver Whirl", "Quen-Yrden Storm", "orbit", "Trial of the Grasses", "+2 HP/s Regen & +25% Crit Chance"],
  [49, 9, 11, "R'lyeh Star Cultist", "Abyssal Tentacle Rift", "Great Cthulhu Singularity", "chain", "Non-Euclidean Madness", "100% Abyssal Vacuum, 35% Slow & +25% Area"],
  [50, 9, 15, "Kenshi-Moon Ronin", "Meitou Falling-Sun Slash", "Venge Orbital Beak-Storm", "orbit", "Toughness Conditioning", "Every hit taken grants +2 Max HP & +2% Might"],
  [51, 7, 14, "Baba Yaga Suit-Assassin", "Baba Yaga Backup Sidearm", "Continental Tactical Arsenal", "beam", "CQC Grapple-Flip-Execute", "Touching any enemy or Boss flips/stuns them & fires a lethal point-blank execution shot"],
  [52, 2, 14, "The Man With No Name", "Blazing Fan-Hammer Six-Shooter", "Deadeye Eight-Shooter", "cone", "High-Noon Deadeye", "Poncho gunslinger: blazing 6-shot right-hand bursts with lethal crit & 0.55s quick-reload"],
  [53, 5, 14, "Green-Beret Last-Stand Vet", "Belt-Fed M60 & Explosive Bow", "First Blood Firestorm", "cone", "Last-Stand Fortifier", "Staying within 180px for 120s (or Utility) deploys shoot-over Fort & Claymore mines"],
  [54, 0, 15, "Slav-1 Bounty Tracker", "Sawed-Stock EE-3 Carbine", "Disintegrations Authorized", "beam", "Mandalorian Arsenal", "Auto-Flamethrower when >=4 foes surround you + Fibercord Grapple Hook locks targets"]
];

const FORCE_VACUUM_HEROES = [0, 3, 7, 10, 12, 14, 18, 20, 27, 38, 39, 45, 49];

function hasInnateVacuum(cid) {
  return FORCE_VACUUM_HEROES.includes(cid);
}

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

const HERO_QUOTES = {
  0: ["The Force will be with you. Always.", "Your overconfidence is your weakness.", "I am one with the Force, and the Force is with me."],
  1: ["This is the Way.", "I can bring you in warm, or I can bring you in cold.", "Weapons are part of my religion."],
  3: ["Power! Unlimited power!", "You don't know the power of the Dark Side!", "So be it... Jedi."],
  6: ["Never tell me the odds!", "Hokey religions and ancient weapons are no match for a good blaster.", "Chewie, we're home."],
  7: ["Kneel before your god!", "My ascension is inevitable.", "Even the Ancients cannot stop my wrath!"],
  8: ["Indeed. Come on, that had to be at least a little fun.", "In the middle of my backswing?!", "Wait... that's 'O'Neill' with TWO L's!"],
  13: ["I aim to misbehave.", "Swear by my pretty floral bonnet, I will end you.", "Next time you stab me in the back, have the guts to do it to my face."],
  15: ["Jayne, the man they call Jayne!", "Six men came to kill me one time. And the best of 'em carried this: Vera.", "Let's go be bad guys."],
  16: ["I am a leaf on the wind... watch how I soar.", "Curse your sudden but inevitable betrayal!", "buckle up, this landing is gonna get interesting."],
  18: ["Fear is the mind-killer.", "He who can destroy a thing, controls a thing.", "Long live the fighters of Muad'Dib!"],
  23: ["Resistance is futile.", "Your biological and technological distinctiveness will be added to our own.", "We are the Borg. Lower your shields."],
  24: ["Today is a good day to die!", "Qapla'! Glory to you and your House!", "Revenge is a dish best served cold."],
  28: ["Game over, man! Game over!", "They're coming outta the goddamn walls!", "Let's rock!"],
  29: ["If it bleeds, we can kill it.", "One ugly mother...", "Want some candy?"],
  31: ["Come on you apes, you wanna live forever?!", "The only good bug is a dead bug!", "I'm from Buenos Aires, and I say kill 'em all!"],
  32: ["I need a weapon.", "Finishing this fight.", "Wake me... when you need me."],
  33: ["Rip and tear, until it is done.", "They are rage, brutal, without mercy. But you will be worse.", "The only thing they fear is you."],
  34: ["For the Emperor!", "Burn the heretic! Kill the mutant! Purge the unclean!", "Even in death, I still serve."],
  39: ["Whoa. I know Kung Fu.", "There is no spoon.", "No... I don't have to dodge bullets."],
  40: ["Hasta la vista, baby.", "I'll be back.", "Come with me if you want to live."],
  41: ["All those moments will be lost in time, like tears in rain.", "More human than human is our motto.", "Time... to die."],
  44: ["Witness me! Shiny and chrome!", "What a day! What a lovely day!", "I live, I die, I live again!"],
  46: ["Wibbly wobbly, timey wimey... stuff.", "Allons-y!", "Basically... run."],
  48: ["Wind's howling.", "How do you like that silver?", "Evil is evil. Lesser, greater, middling."],
  50: ["Another limb lost in the Bonefields...", "Beep is the strongest warrior!", "My Meitou blade drinks again."],
  51: ["Yeah... I'm thinking I'm back.", "People keep asking if I'm back. Yeah, I'm back.", "Consequences."],
  52: ["You see, in this world there's two kinds of people, my friend...", "My mule don't like people laughing.", "Get three coffins ready... my mistake, four."],
  53: ["To survive a war, you gotta become war.", "They drew first blood, not me!", "Nothing is over! Nothing!"],
  54: ["He's no good to me dead.", "As you wish.", "Put Captain Solo in the cargo hold."]
};

const FACTION_QUOTES = [
  ["Another bounty claimed in the Outer Rim.", "For the Rebellion! Target down.", "May the Force serve you well."],
  ["Chevron Seven locked. Target eliminated.", "False god neutralized.", "SG-1 mission accomplished."],
  ["Can't stop the signal, Mal.", "Shiny. Let's grab the loot and run.", "No power in the 'Verse can stop us."],
  ["The Spice must flow.", "Shai-Hulud claims your water.", "Arrakis teaches the attitude of the knife."],
  ["Target neutralized. Klingon honor satisfied.", "Beam us up, Commander.", "Set phasers to vaporize."],
  ["Bug hunt complete. Area secure.", "Nuke the entire site from orbit.", "Stay frosty, Marines."],
  ["Purged in holy promethium!", "Skulls for the Golden Throne!", "The Omnissiah approves this kill."],
  ["Flatlined in the neon sprawl.", "Wake the hell up, Samurai.", "Judgement delivered."],
  ["Resonance cascade contained.", "The cake was a lie anyway.", "Experiment concluded."],
  ["The cosmos claims another wanderer.", "Ph'nglui mglw'nafh Cthulhu!", "Toss a coin to your survivor."]
];

function getBossQuote(cid, facId) {
  const arr = HERO_QUOTES[cid] || FACTION_QUOTES[facId] || ["Target eliminated."];
  return arr[Math.floor(Math.random() * arr.length)];
}

const BAD_HEROES = [2, 3, 7, 9, 11, 12, 17, 19, 21, 23, 26, 30, 36, 37, 49];
const BOUNTY_HEROES = [1, 6, 15, 29, 41, 42, 48, 50, 51, 52, 54];

function getHeroAlign(cid) {
  if (BOUNTY_HEROES.includes(cid)) return "bounty";
  if (BAD_HEROES.includes(cid)) return "bad";
  return "good";
}

const MATCHUP_LINES = {
  "54_0": "Jedi bounty! Vader said no disintegrations... maybe just one!",
  "54_6": "Put Captain Solo in the cargo hold! You're worth a fortune frozen!",
  "3_0": "At last we will reveal ourselves to the Jedi. Join the Dark Side!",
  "0_3": "I will do what I must, Sith!",
  "8_7": "I knew you were a Goa'uld! Eyes glowing and everything!",
  "8_9": "Jaffa, kree! Tell your false god Jack O'Neill says hello!",
  "7_8": "Insolent Tau'ri! Bow before your god Anupas!",
  "52_51": "Nice suit, city boy... let's see if it stops a .45 Colt.",
  "51_52": "Six bullets? I only need one pencil.",
  "53_40": "Man versus machine... welcome to the jungle!",
  "29_30": "A worthy Xenomorph Queen skull for the trophy wall!"
};

const RIVAL_LINES = {
  bounty: [
    "You have a bounty on your head, and I've come to collect!",
    "Nothing personal, kid... your contract just hit top dollar.",
    "Dead or alive, your head is paying my next fuel tab!"
  ],
  goodVsBad: [
    "Your reign of terror ends right here, monster!",
    "I've tracked your dark signature across the sector—prepare for justice!",
    "Stand down, villain! You won't corrupt another world!"
  ],
  goodVsGood: [
    "Hold it! Command says you're compromised—could be a Goa'uld or Cylon!",
    "Intel flagged you as a rogue impostor! Drop your weapons now!",
    "Wait—my scanner says you're infected! I have to put you down!"
  ],
  badVsAll: [
    "Kneel before your new master, pathetic mortal!",
    "Your biomass and Dark Matter belong to me now!",
    "Die, weakling! This sector is mine to conquer!"
  ]
};

function getRivalCallout(rivalCid, playerCid) {
  const key = rivalCid + "_" + playerCid;
  if (MATCHUP_LINES[key]) return MATCHUP_LINES[key];
  const rAlign = getHeroAlign(rivalCid);
  const pAlign = getHeroAlign(playerCid);
  let pool = RIVAL_LINES.bounty;
  if (rAlign === "bounty") pool = RIVAL_LINES.bounty;
  else if (rAlign === "bad") pool = RIVAL_LINES.badVsAll;
  else if (pAlign === "bad") pool = RIVAL_LINES.goodVsBad;
  else pool = RIVAL_LINES.goodVsGood;
  return pool[Math.floor(Math.random() * pool.length)];
}
