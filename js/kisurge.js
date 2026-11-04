/* =========================================================================
   OMNI-SHIFT v14.2 — KI-SURGE (js/kisurge.js)
   The martial-arts class with ki (replaces the old 40K faction, slot for
   slot — unlocks carry over; Grievous moves to Star-Sector):
     #34 Goku · #35 Vegeta · #36 Piccolo · #37 Trunks (sword) · #38 Gohan
     #84 Frieza · #85 Cell · #86 Android 16 · #87 Android 17 · #88 Android 18
   • everyone flies (G — the ki flight of js/flight.js)
   • POWER UP (hold R or 🔥): charge your ki with an aura round you — the
     Saiyans (Goku, Vegeta, Trunks, Gohan) reach the one golden form and no
     higher; Frieza goes to full power, Cell to perfect power, Piccolo
     focuses; the androids have infinite energy — no charging, an overdrive
   • INSTANT TRANSMISSION (Goku, T): the map opens in its own targeting mode
     (it can never drop a marker) with a glowing IT reticle; tap a place —
     two fingers to the forehead, a crackle of static, and you're there.
     About a second to recharge.
   • Cell absorbs: finish a rival hero (or use ABSORB on a weakened one) and
     he takes a natural ability that's unique to that hero — Yoda gives the
     levitation circle and his backwards way of talking, Goku gives Instant
     Transmission…
   • ki techniques can't be picked up off a fallen fighter unless you can
     use ki yourself; Trunks's sword can be taken by anyone
   ========================================================================= */
"use strict";

const KI = { ki: 0, charging: false, form: 0, formT: 0, cdT: 0, touch: 0, itCd: 0, itPose: null, it: null, absorbed: [], lightT: 0, pulseT: 0, auraT: 0, msgT: -99 };
const KI_HEROES = new Set([34, 35, 36, 37, 38, 84, 85, 86, 87, 88]);
const KI_SAIYAN = new Set([34, 35, 37, 38]);
const KI_ANDROID = new Set([86, 87, 88]);

/* --- the faction (data-factions.js #6), its four enemy rosters (enemylook.js) and every per-hero table
   (data-heroes, combat, vision, sense, stealth, cityaccess, citythemes, squad, biomes) carry the Ki-Surge values in
   the source — this file adds the heroes' extras, the hair, the power-up, Instant Transmission and Cell. --------- */


/* --- the heroes ---------------------------------------------------------------------- */
const KI_ICON = (col) => (c1) => `<circle cx="12" cy="12" r="7.5" fill="${col || c1}" opacity="0.35"/><circle cx="12" cy="12" r="4.6" fill="${col || c1}"/><circle cx="12" cy="12" r="2.2" fill="#fff"/><path d="M3 12 Q8 10 12 12 Q16 14 21 12" stroke="#fff" stroke-width="1" fill="none" opacity="0.7"/>`;
const KI_SWORD_ICON = () => `<line x1="5" y1="19" x2="20" y2="4" stroke="#cfd8dc" stroke-width="3" stroke-linecap="round"/><line x1="3" y1="15" x2="9" y2="21" stroke="#795548" stroke-width="3" stroke-linecap="round"/><line x1="2.5" y1="21.5" x2="5.5" y2="18.5" stroke="#4e342e" stroke-width="3"/>`;
const KI_DEFS = [
  { cid: 34, order: 0, name: "Goku", weapon: "Turtle School Ki Wave", ult: "Spirit Sphere", passive: "Saiyan Battle Instinct", style: "beam",
    desc: "A Saiyan raised on Earth who loves a fight: Ki Wave beams, the golden form (and no higher), INSTANT TRANSMISSION across the map in a second, ki flight",
    skin: "#f1c27d", body: { sx: 1.04, sy: 1.08, yOff: -0.8, kind: "adult" }, kin: 5, armCap: 2, hair: "goku",
    sig: ["Weighted Turtle Gi", "THE WEIGHTED GI COMES OFF — POWER LEVEL RISING!", "Spirit Sphere", 6, 1.6, 7.0],
    utils: [["Instant Transmission", 1, "kiIT", "nova", "Two fingers to the forehead: the map opens — tap anywhere and you're there"], ["Spirit Sphere", 12, "factionPulse", "nova", "Raises a sphere of borrowed energy and brings it down on everything ahead"]],
    quotes: ["Hi, I'm Goku! Let's see how strong you are!", "I won't let you get away with this!", "This is going to be fun!"],
    outfit: [["Spiky Black Hair", "#151515"], ["Golden Hair", "#ffd54f"], ["Headband", "#c62828"], ["Orange Turtle Gi", "#ff9100"], ["Yardrat Garb", "#5e35b1"], ["Training Vest", "#1565c0"], ["Orange Gi Trousers", "#ff9100"], ["Blue Training Pants", "#1565c0"], ["No Back Gear", "none"], ["Turtle Shell (Training)", "#2e7d32"]],
    vision: ["aura", "#ffd54f", 26, "KI SENSE", 58], roster: "frieza_force",
    dash: { name: "Afterimage Step", cd: 3.2, dist: 170, style: "apparitionBlink", col: "#ffd54f", callout: "TOO SLOW!", desc: "Moves so fast he leaves an afterimage behind" } },
  { cid: 35, order: 1, name: "Vegeta", weapon: "Royal Flash Beam", ult: "Final Royal Flash", passive: "Saiyan Pride", style: "beam", bad: true,
    desc: "The proud Saiyan prince: piercing royal beams, a Big Bang burst, the golden form (and no higher), ki flight; never backs down",
    skin: "#f1c27d", body: { sx: 0.98, sy: 1.0, yOff: 0, kind: "adult" }, kin: 5, armCap: 2, hair: "vegeta",
    sig: ["Saiyan Battle Armor", "THE PRINCE OF ALL SAIYANS — ARMOR ON!", "Final Royal Flash", 6, 1.8, 6.5],
    utils: [["Big Bang Burst", 8, "critBurst", "nova", "A single crushing ball of ki thrown from an open palm"], ["Royal Barrage", 10, "fanHammer", "cone", "A furious volley of ki blasts across the line"]],
    quotes: ["I am the prince of all Saiyans!", "You're nothing but a low-class clown.", "Don't you ever compare me to them."],
    outfit: [["Flame Black Hair", "#151515"], ["Golden Hair", "#ffd54f"], ["Widow's Peak", "#212121"], ["Blue Battle Suit", "#1a237e"], ["White Armor", "#eceff1"], ["Pink 'Badman' Shirt", "#f48fb1"], ["Blue Battle Suit", "#1a237e"], ["Black Leggings", "#212121"], ["No Back Gear", "none"], ["Gravity-Room Weights", "#455a64"]],
    vision: ["aura", "#4fc3f7", 24, "SCOUTER SENSE", 56], roster: "frieza_force",
    dash: { name: "Royal Dive", cd: 3.8, dist: 160, style: "jetpackSlam", col: "#4fc3f7", callout: "OUT OF MY WAY!", desc: "Dives from above in a burst of blue ki" } },
  { cid: 36, order: 2, name: "Piccolo", weapon: "Piercing Spiral Beam", ult: "Hellzone Cage", passive: "Namekian Regeneration", style: "beam",
    desc: "The Namekian mentor: a spiralling beam that pierces everything in its line, stretching arms, regeneration, ki flight",
    skin: "#7cb342", body: { sx: 1.08, sy: 1.18, yOff: -1.6, kind: "adult" }, kin: 5, armCap: 2, hair: "piccolo",
    sig: ["Weighted Turban & Cape", "THE WEIGHTED CAPE HITS THE GROUND — THUD!", "Hellzone Cage", 6, 1.7, 7.0],
    utils: [["Regenerate", 14, "kiRegen", "nova", "Regrows what was lost: heals 40% and restores every limb"], ["Hellzone Cage", 11, "factionPulse", "nova", "Ki spheres circle the enemy, then all close in at once"]],
    quotes: ["Stop holding back!", "Fear is a luxury you can't afford.", "I'll be watching."],
    outfit: [["Bald (Antennae)", "#7cb342"], ["White Turban", "#eceff1"], ["Purple Turban", "#7b1fa2"], ["Purple Gi", "#6a1b9a"], ["Blue Sash", "#1e88e5"], ["Red Sash", "#c62828"], ["Purple Gi Trousers", "#6a1b9a"], ["Blue Gi Trousers", "#1e88e5"], ["White Weighted Cape", "#eceff1"], ["No Cape", "none"]],
    vision: ["aura", "#76ff03", 28, "NAMEKIAN HEARING", 60], roster: "redribbon",
    dash: { name: "Stretch Strike", cd: 3.6, dist: 150, style: "tacDash", col: "#76ff03", callout: "HAAA!", desc: "Stretches an arm and pulls himself into the fight" } },
  { cid: 37, order: 3, name: "Trunks", weapon: "Brave Sword", ult: "Burning Barrage", passive: "Warrior from the Future", style: "orbit", sword: true, bladeIdx: 0,
    desc: "The swordsman from a ruined future: lightning-fast sword work, Burning Barrage blasts, the golden form (and no higher), ki flight",
    skin: "#f1c27d", body: { sx: 1.0, sy: 1.06, yOff: -0.5, kind: "adult" }, kin: 4, armCap: 3, hair: "trunks",
    sig: ["Capsule Corp Jacket", "THE SWORD FROM THE FUTURE — DRAWN!", "Burning Barrage", 6, 1.7, 6.8],
    utils: [["Burning Barrage", 9, "fanHammer", "cone", "Arms flash through a sign, then a barrage of ki blasts"], ["Sword Rush", 6, "executeDash", "orbit", "Dashes through the line, the sword cutting a path"]],
    quotes: ["I came from the future to stop this!", "My mother built that time machine for this moment.", "Not this time."],
    outfit: [["Lavender Hair", "#b39ddb"], ["Golden Hair", "#ffd54f"], ["Long Lavender Hair", "#9575cd"], ["Capsule Corp Jacket", "#5d4037"], ["Black Tank Top", "#212121"], ["Saiyan Armor", "#eceff1"], ["Grey Trousers", "#455a64"], ["Black Trousers", "#212121"], ["No Back Gear", "none"], ["Capsule Corp Backpack", "#5d4037"]],
    vision: ["aura", "#b39ddb", 24, "FUTURE SENSE", 56], roster: "redribbon",
    dash: { name: "Sword Dash", cd: 3.6, dist: 165, style: "saberRush", col: "#e0e0e0", callout: "HYAAH!", desc: "A blur of steel straight through the front line" } },
  { cid: 38, order: 4, name: "Gohan", weapon: "Rising Ki Blast", ult: "Father-Son Wave", passive: "Hidden Potential", style: "nova",
    desc: "Goku's son, a prodigy with hidden potential: rising ki blasts, a father-son wave, the golden form (and no higher), ki flight; stronger when he's hurt",
    skin: "#f1c27d", body: { sx: 0.92, sy: 0.96, yOff: 0.4, kind: "adult" }, kin: 5, armCap: 2, hair: "gohan",
    sig: ["Purple Mentor's Gi", "HIDDEN POTENTIAL UNLOCKED!", "Father-Son Wave", 6, 1.8, 7.0],
    utils: [["Rising Blast", 7, "flameCone", "flame", "Both hands above the head: a rising burst of yellow ki"], ["Father-Son Wave", 12, "factionPulse", "nova", "A huge ki wave — with a little help from his father"]],
    quotes: ["I won't let you hurt anyone else!", "Mr. Piccolo taught me well.", "I'm not afraid of you anymore."],
    outfit: [["Spiky Black Hair", "#151515"], ["Golden Hair", "#ffd54f"], ["Bowl Cut", "#212121"], ["Purple Gi", "#6a1b9a"], ["Orange Gi", "#ff9100"], ["Saiyan Armor", "#eceff1"], ["Purple Gi Trousers", "#6a1b9a"], ["Orange Gi Trousers", "#ff9100"], ["No Back Gear", "none"], ["Piccolo's White Cape", "#eceff1"]],
    vision: ["aura", "#ffee58", 24, "KI SENSE", 56], roster: "cell_jr",
    dash: { name: "Afterimage Step", cd: 3.2, dist: 165, style: "apparitionBlink", col: "#ffee58", callout: "HAAA!", desc: "Moves faster than the eye, leaving an afterimage" } },
  { cid: 84, order: 5, name: "Frieza", weapon: "Death Beam", ult: "Death Ball", passive: "Emperor of the Universe", style: "beam", bad: true,
    desc: "The galactic tyrant: fingertip death beams, a death ball, telekinesis, full power when he charges, ki flight; utterly ruthless",
    skin: "#f5f5f5", body: { sx: 0.9, sy: 0.96, yOff: 0.3, kind: "adult" }, kin: 5, armCap: 2, hair: "frieza",
    sig: ["Hover Pod Throne", "YOU SHOULD BE HONOURED — FULL POWER!", "Death Ball", 6, 1.9, 6.5],
    utils: [["Death Ball", 12, "factionPulse", "nova", "A sphere of ki the size of a house, dropped on everything ahead"], ["Telekinetic Hurl", 8, "critBurst", "nova", "Lifts the nearest foe with his mind and smashes it down"]],
    quotes: ["I am the emperor of this universe.", "You should be honoured — I'm using full power.", "How dare you."],
    outfit: [["White & Purple Dome", "#f5f5f5"], ["Golden Dome", "#ffd54f"], ["Horned Crown", "#eceff1"], ["White Body", "#f5f5f5"], ["Battle Armor", "#5e35b1"], ["Golden Body", "#ffca28"], ["White Legs", "#f5f5f5"], ["Golden Legs", "#ffca28"], ["No Back Gear", "none"], ["Hover-Pod Frame", "#90a4ae"]],
    vision: ["aura", "#e040fb", 26, "TYRANT'S EYE", 58], roster: "zfighters",
    dash: { name: "Instant Glide", cd: 3.0, dist: 170, style: "apparitionBlink", col: "#e040fb", callout: "OHOHOHO!", desc: "Vanishes and reappears closer, without seeming to move" } },
  { cid: 85, order: 6, name: "Cell", weapon: "Perfect Ki Wave", ult: "Perfect Barrier", passive: "Perfect Bio-Android", style: "nova", bad: true,
    desc: "The bio-android built from the greatest fighters: ki waves, a perfect barrier, regeneration, ki flight — and he ABSORBS: every rival hero he finishes gives him an ability of their own",
    skin: "#81c784", body: { sx: 1.1, sy: 1.18, yOff: -1.4, kind: "adult" }, kin: 5, armCap: 2, hair: "cell",
    sig: ["Perfect Form", "PERFECT — ABSOLUTELY PERFECT!", "Perfect Barrier", 6, 1.9, 6.8],
    utils: [["Absorb", 9, "kiAbsorb", "nova", "The tail strikes: a weakened rival is absorbed (and gives up an ability), anyone else feeds you"], ["Perfect Barrier", 12, "factionPulse", "nova", "A dome of ki explodes outward from his body"]],
    quotes: ["Perfect. Absolutely perfect!", "I have the cells of the greatest fighters.", "Let the games begin."],
    outfit: [["Green Crest", "#43a047"], ["Imperfect Crest", "#2e7d32"], ["Golden Crest", "#ffd54f"], ["Green Spotted Body", "#81c784"], ["Black Wings", "#212121"], ["Purple Accents", "#7b1fa2"], ["Green Spotted Legs", "#66bb6a"], ["Black Legs", "#212121"], ["Black Wings", "#212121"], ["No Wings", "none"]],
    vision: ["aura", "#76ff03", 26, "BIO-SENSE", 58], roster: "zfighters",
    dash: { name: "Perfect Rush", cd: 3.6, dist: 160, style: "jetpackSlam", col: "#76ff03", callout: "TOO SLOW!", desc: "Crashes down on the enemy in a burst of green ki" } },
  { cid: 86, order: 7, name: "Android 16", weapon: "Twin Arm Cannons", ult: "Hell's Flash", passive: "Infinite Energy Core", style: "cone",
    desc: "The gentle giant android: twin arm cannons, Hell's Flash, rocket punches, infinite energy (no charging — an overdrive), invisible to ki sense, flight",
    skin: "#ffcc80", body: { sx: 1.2, sy: 1.26, yOff: -2.0, kind: "adult" }, kin: 2, armCap: 2, hair: "a16",
    sig: ["Red Ribbon Armor", "NATURE MUST BE PROTECTED — CANNONS OPEN!", "Hell's Flash", 6, 1.8, 7.0],
    utils: [["Hell's Flash", 10, "flameCone", "flame", "Detaches both hands: a torrent of energy from the arm cannons"], ["Rocket Punch", 7, "executeDash", "missile", "Fires his fist like a rocket at the nearest foe"]],
    quotes: ["I am programmed to stop Goku. And to protect nature.", "Birds don't run from me.", "Please — protect what I loved."],
    outfit: [["Red Mohawk", "#d84315"], ["Shaved", "#ffcc80"], ["Bright Red", "#ff3d00"], ["Green Armor", "#2e7d32"], ["Grey Armor", "#616161"], ["Black Undersuit", "#212121"], ["Grey Trousers", "#546e7a"], ["Black Undersuit", "#212121"], ["No Back Gear", "none"], ["Red Ribbon Pack", "#c62828"]],
    vision: ["ir", "#ff3d00", 24, "ANDROID SCAN", 56], roster: "cell_jr",
    dash: { name: "Heavy Boost", cd: 4.0, dist: 150, style: "tacDash", col: "#ff3d00", callout: "TARGET ACQUIRED.", desc: "A thruster-powered charge" } },
  { cid: 87, order: 8, name: "Android 17", weapon: "Power Blitz", ult: "Barrier Burst", passive: "Infinite Energy Core", style: "cone",
    desc: "The cool, carefree android: power blitz volleys, an energy barrier that blocks everything, infinite energy (overdrive), invisible to ki sense, flight",
    skin: "#ffe0b2", body: { sx: 0.98, sy: 1.04, yOff: 0, kind: "adult" }, kin: 5, armCap: 2, hair: "a17",
    sig: ["Ranger's Scarf", "INFINITE ENERGY — BARRIER UP!", "Barrier Burst", 6, 1.7, 6.5],
    utils: [["Energy Barrier", 11, "soresuShelter", "nova", "A green dome of energy: nothing gets through"], ["Power Blitz", 8, "critBurst", "nova", "A point-blank blast of pure energy"]],
    quotes: ["This is getting boring.", "Infinite energy means I never get tired.", "Let's make this interesting."],
    outfit: [["Black Shaggy Hair", "#151515"], ["Long Black Hair", "#212121"], ["Ranger Cap", "#2e7d32"], ["Black Shirt", "#212121"], ["Ranger Uniform", "#2e7d32"], ["Red Ribbon Vest", "#c62828"], ["Blue Jeans", "#1565c0"], ["Ranger Trousers", "#33691e"], ["No Scarf", "none"], ["Orange Scarf", "#ff6d00"]],
    vision: ["ir", "#69f0ae", 24, "ANDROID SCAN", 56], roster: "zfighters",
    dash: { name: "Blink Step", cd: 3.0, dist: 165, style: "apparitionBlink", col: "#69f0ae", callout: "BORING.", desc: "Steps out of sight and back into the fight" } },
  { cid: 88, order: 9, name: "Android 18", weapon: "Infinite Barrage", ult: "Energy Disc Storm", passive: "Infinite Energy Core", style: "cone", female: true,
    desc: "The cool android with infinite energy: endless ki barrages, spinning energy discs, an overdrive instead of charging, invisible to ki sense, flight",
    skin: "#ffe0b2", body: { sx: 0.92, sy: 0.98, yOff: 0.4, kind: "adult" }, kin: 5, armCap: 2, hair: "a18",
    sig: ["Denim Jacket", "INFINITE ENERGY — BARRAGE!", "Energy Disc Storm", 6, 1.8, 6.5],
    utils: [["Infinite Barrage", 9, "fanHammer", "cone", "Volley after volley — she never runs out"], ["Energy Disc", 7, "dookuThrow", "orbit", "A spinning disc of energy that slices through and comes back"]],
    quotes: ["You're wasting my time.", "Infinite energy. Remember that.", "Try to keep up."],
    outfit: [["Blonde Bob", "#ffe082"], ["Blonde Long", "#ffd54f"], ["Light Blonde", "#fff59d"], ["Denim Vest", "#1565c0"], ["Striped Shirt", "#eceff1"], ["Black Top", "#212121"], ["Black Leggings", "#212121"], ["Denim Skirt", "#1565c0"], ["No Back Gear", "none"], ["Black Jacket", "#212121"]],
    vision: ["ir", "#4fc3f7", 24, "ANDROID SCAN", 56], roster: "zfighters",
    dash: { name: "Blink Step", cd: 3.0, dist: 165, style: "apparitionBlink", col: "#4fc3f7", callout: "TOO SLOW.", desc: "Steps out of sight and back into the fight" } }
];
// career stages (stance pattern: 5 = open-hand ki channel, 10 = braced cannons; Trunks's sword: Makashi → Djem So → Juyo),
// ki colour (blade palette index: 0 cyan · 1 emerald · 3 amethyst · 4 gold · 6 white) and a theme riff each
const KI_EXTRA = {
  34: { bladeIdx: 0, stance: [[5, "Turtle School Student", 1.05, 0.9, 0.6], [5, "Saiyan Warrior", 1.3, 1.15, 0.9], [5, "Earth's Mightiest", 1.6, 1.4, 1.2], [2, "Ki Guard"]],
        music: [0.2, "square", [392, 440, 523, 587, 659, 587, 523, 440, 392, 523, 659, 784, 659, 587, 523, 587]] },
  35: { bladeIdx: 4, stance: [[5, "Saiyan Elite Soldier", 1.05, 0.9, 0.6], [5, "Prince on Namek", 1.3, 1.15, 0.9], [5, "Prince of All Saiyans", 1.6, 1.4, 1.2], [2, "Ki Guard"]],
        music: [0.19, "sawtooth", [220, 220, 330, 311, 294, 262, 247, 220, 220, 262, 330, 392, 370, 330, 294, 262]] },
  36: { bladeIdx: 4, stance: [[5, "Demon King's Heir", 1.05, 0.9, 0.6], [5, "Gohan's Mentor", 1.3, 1.15, 0.9], [5, "Fused Namekian", 1.6, 1.4, 1.2], [2, "Namekian Guard"]],
        music: [0.18, "triangle", [196, 233, 262, 311, 294, 262, 233, 196, 175, 196, 233, 262, 233, 196, 175, 147]] },
  37: { bladeIdx: 6, stance: [[1, "Gohan's Pupil", 1.1, 0.85, 0.6], [4, "Future Warrior", 1.35, 1.2, 0.9], [6, "Time-Traveller Swordmaster", 1.7, 1.45, 1.3], [2, "Sword Guard"]],
        music: [0.2, "square", [330, 392, 494, 587, 494, 392, 440, 494, 330, 392, 494, 659, 587, 494, 440, 392]] },
  38: { bladeIdx: 0, stance: [[5, "Hidden Potential", 1.05, 0.9, 0.6], [5, "Time-Chamber Trained", 1.3, 1.15, 0.9], [5, "Cell Games Champion", 1.65, 1.45, 1.25], [2, "Ki Guard"]],
        music: [0.19, "square", [349, 440, 523, 698, 659, 523, 440, 523, 587, 698, 880, 784, 698, 659, 587, 523]] },
  84: { bladeIdx: 3, stance: [[5, "Imperial Overlord", 1.05, 0.9, 0.6], [5, "Transformed Tyrant", 1.3, 1.15, 0.9], [5, "Full-Power Emperor", 1.6, 1.4, 1.2], [2, "Tyrant's Guard"]],
        music: [0.18, "sawtooth", [147, 156, 147, 139, 147, 175, 165, 147, 131, 139, 131, 123, 117, 123, 131, 147]] },
  85: { bladeIdx: 1, stance: [[5, "Imperfect Form", 1.05, 0.9, 0.6], [5, "Semi-Perfect Form", 1.3, 1.15, 0.9], [5, "Perfect Form", 1.6, 1.4, 1.2], [2, "Perfect Guard"]],
        music: [0.19, "sawtooth", [165, 165, 196, 185, 165, 147, 165, 220, 208, 196, 185, 165, 147, 139, 147, 165]] },
  86: { bladeIdx: 4, stance: [[10, "Dormant Prototype", 1.0, 0.8, 0.5], [10, "Awakened Guardian", 1.25, 1.05, 0.8], [10, "Nature's Protector", 1.5, 1.3, 1.05], [2, "Armour Brace"]],
        music: [0.17, "triangle", [131, 165, 196, 262, 247, 196, 165, 147, 131, 165, 196, 247, 220, 196, 175, 165]] },
  87: { bladeIdx: 1, stance: [[5, "Gero's Creation", 1.05, 0.9, 0.6], [5, "Free Spirit", 1.3, 1.15, 0.9], [5, "Infinite-Energy Rogue", 1.6, 1.4, 1.2], [2, "Energy Barrier"]],
        music: [0.18, "square", [294, 349, 440, 349, 294, 262, 294, 349, 392, 440, 523, 440, 392, 349, 294, 262]] },
  88: { bladeIdx: 6, stance: [[5, "Gero's Creation", 1.05, 0.9, 0.6], [5, "Free Spirit", 1.3, 1.15, 0.9], [5, "Infinite-Energy Ace", 1.6, 1.4, 1.2], [2, "Ki Guard"]],
        music: [0.18, "square", [330, 415, 494, 415, 330, 311, 330, 415, 440, 494, 554, 494, 440, 415, 370, 330]] }
};
if (typeof heroRegister === "function") for (const d of KI_DEFS) {
  const android = KI_ANDROID.has(d.cid);
  heroRegister(Object.assign({
    fac: 6, sword: !!d.sword, vacuum: false, helmet: false, theme: "capsule", icon: d.sword ? KI_SWORD_ICON : KI_ICON(d.vision[1]),
    sense: android ? { k: "droid", label: "ANDROID SCANNER", lines: ["Power signature detected.", "Target closing.", "Target in range.", "ENGAGE."] }
                   : { k: "jedi", label: "KI SENSE", lines: ["A strong ki…", "Someone's powering up.", "Here they come!", "THEIR POWER IS INCREDIBLE!"] },
    head: { ki: d.hair }, persuade: null,
    matchups: { "34_84": "Frieza! This ends right here!", "84_34": "You monkey — you'll pay for that.", "85_34": "Goku. Show me your full power.", "34_35": "Vegeta! Wanna spar?", "35_34": "Kakarot! I'll surpass you yet.", "37_87": "Not this time — not in this timeline.", "88_87": "Let's go, brother.", "36_38": "Gohan, don't hold back!", "86_85": "Cell must be stopped.", "38_85": "You've hurt enough people, Cell.", "85_38": "Show me that hidden power, boy." }
  }, d, KI_EXTRA[d.cid]));
}

/* --- hair (sprite space: head centre 0, -9.3, r 5.2) — gold in the golden form ---------------------- */
function kiHeadOpt(cid) { try { const o = typeof getOutfit === "function" ? getOutfit(cid) : null; return o ? (o.head | 0) % 3 : 0; } catch (e) { return 0; } }
function kiCapOver(t, col) {   // cover the engine's default hair cap & side locks (sprite space) before drawing the real hair
  t.fillStyle = col; t.beginPath(); t.arc(0, -10.3, 5.55, Math.PI * 0.9, Math.PI * 2.1); t.fill(); t.fillRect(-5.45, -11.1, 1.8, 4.4); t.fillRect(3.65, -11.1, 1.8, 4.4);
}
function kiSpikes(t, col, n, len, y0, spread) {
  t.fillStyle = col; t.beginPath(); t.arc(0, -10.4, 5.3, Math.PI, 0); t.fill();
  for (let i = 0; i < n; i++) { const a = -Math.PI / 2 + (i - (n - 1) / 2) * spread; t.beginPath(); t.moveTo(Math.cos(a - 0.22) * 4.6, y0 + Math.sin(a - 0.22) * 4.6); t.lineTo(Math.cos(a) * (4.6 + len), y0 + Math.sin(a) * (4.6 + len)); t.lineTo(Math.cos(a + 0.22) * 4.6, y0 + Math.sin(a + 0.22) * 4.6); t.fill(); }
}
function kiBangs(t, col, xs) { t.fillStyle = col; t.beginPath(); for (const x of xs) { t.moveTo(x - 1.2, -11.6); t.lineTo(x + 0.3, -8.9); t.lineTo(x + 1.3, -11.6); } t.fill(); }
function kiDrawHair(t, cid, kind, hairCol) {
  const X = HERO_EXTRA[cid] || {}, skin = X.skin || "#f1c27d", oi = kiHeadOpt(cid);
  const form = !!(KI.form && player && player.cid === cid);
  const saiyan = KI_SAIYAN.has(cid), gold = saiyan && (form || oi === 1);
  const G = form && (Math.floor(runTime * 10) & 1) ? "#fff59d" : "#ffd54f";
  switch (kind) {
    case "goku": { const c = gold ? G : "#151515"; kiCapOver(t, c); kiSpikes(t, c, gold ? 7 : 6, gold ? 4.4 : 3.2, -10.6, 0.42); kiBangs(t, c, gold ? [-2.2, 1.8] : [-2.6, 0.2, 2.6]);
      if (oi === 2) { t.fillStyle = "#c62828"; t.fillRect(-5.4, -12.2, 10.8, 1.3); t.fillRect(4.6, -12, 1.6, 3.4); } break; }
    case "gohan": { const c = gold ? G : (oi === 2 ? "#212121" : "#151515"); kiCapOver(t, c);
      if (oi === 2 && !form) { t.fillStyle = c; t.beginPath(); t.arc(0, -10.6, 5.7, Math.PI, 0); t.fill(); t.fillRect(-5.7, -11, 11.4, 1.6); }
      else { kiSpikes(t, c, gold ? 6 : 5, gold ? 4 : 2.4, -10.8, 0.45); kiBangs(t, c, [gold ? 0.6 : -1.6]); } break; }
    case "vegeta": { const c = gold ? G : "#151515"; kiCapOver(t, c); t.fillStyle = c; t.beginPath(); t.moveTo(-4.6, -10.4); t.lineTo(-3.4, -17.8); t.lineTo(-1.4, -14.4); t.lineTo(0, -19.6); t.lineTo(1.4, -14.4); t.lineTo(3.4, -17.8); t.lineTo(4.6, -10.4); t.closePath(); t.fill();
      t.beginPath(); t.moveTo(-2.2, -11.6); t.lineTo(0, -9.6); t.lineTo(2.2, -11.6); t.fill(); break; }
    case "trunks": { const c = gold ? G : (hairCol && hairCol !== "#ffd54f" ? hairCol : "#b39ddb"); kiCapOver(t, c);
      if (gold) kiSpikes(t, c, 6, 3.6, -10.6, 0.42);
      else { t.fillStyle = c; t.beginPath(); t.arc(0, -10.2, 5.6, Math.PI * 0.9, Math.PI * 2.1); t.fill(); const L = oi === 2 ? 8.4 : 4.6; t.fillRect(-5.5, -10.8, 1.9, L); t.fillRect(3.6, -10.8, 1.9, L); t.fillStyle = "rgba(0,0,0,0.25)"; t.fillRect(-0.3, -15.6, 0.6, 3.2); } break; }
    case "piccolo": {
      t.fillStyle = skin; t.beginPath(); t.moveTo(-5.1, -9.6); t.lineTo(-7.8, -12.4); t.lineTo(-5.0, -7.6); t.moveTo(5.1, -9.6); t.lineTo(7.8, -12.4); t.lineTo(5.0, -7.6); t.fill();   // pointed ears
      if (oi === 0) { kiCapOver(t, skin); t.strokeStyle = skin; t.lineWidth = 1; t.beginPath(); t.moveTo(-1.6, -15); t.quadraticCurveTo(-2.2, -17.4, -3.1, -18.4); t.moveTo(1.6, -15); t.quadraticCurveTo(2.2, -17.4, 3.1, -18.4); t.stroke(); t.fillStyle = "#c2185b"; t.fillRect(-2.8, -12.4, 1.6, 0.9); t.fillRect(1.2, -12.4, 1.6, 0.9); }
      else { const c = oi === 2 ? "#7b1fa2" : "#eceff1"; kiCapOver(t, skin); t.fillStyle = c; t.beginPath(); t.moveTo(-5.8, -11); t.quadraticCurveTo(-6, -17, -2.4, -17.6); t.lineTo(0, -16.6); t.lineTo(2.4, -17.6); t.quadraticCurveTo(6, -17, 5.8, -11); t.closePath(); t.fill(); t.fillStyle = oi === 2 ? "#4a148c" : "#7b1fa2"; t.fillRect(-5.8, -12, 11.6, 1.5); }
      break; }
    case "frieza": { const dome = oi === 1 ? "#ffd54f" : "#f5f5f5"; kiCapOver(t, dome); t.fillStyle = dome; t.beginPath(); t.arc(0, -10.6, 5.7, Math.PI, 0); t.fill();
      if (oi === 2) { t.fillStyle = "#cfd8dc"; t.beginPath(); t.moveTo(-4.4, -13.2); t.quadraticCurveTo(-8.2, -15.6, -6.6, -20.4); t.lineTo(-3.2, -14.8); t.moveTo(4.4, -13.2); t.quadraticCurveTo(8.2, -15.6, 6.6, -20.4); t.lineTo(3.2, -14.8); t.fill(); }
      t.fillStyle = "#8e24aa"; t.beginPath(); t.ellipse(0, -13.6, oi === 2 ? 2.2 : 3.6, oi === 2 ? 1.6 : 2.4, 0, 0, 7); t.fill(); t.fillStyle = "rgba(255,255,255,0.45)"; t.beginPath(); t.ellipse(-1, -14.2, 1, 0.6, 0, 0, 7); t.fill(); break; }
    case "cell": { const c = oi === 2 ? "#ffd54f" : oi === 1 ? "#2e7d32" : "#43a047", big = oi !== 1; kiCapOver(t, c); t.fillStyle = c; t.beginPath(); t.moveTo(-5.6, -9.4); t.lineTo(big ? -7.6 : -6.4, big ? -16.8 : -14.6); t.lineTo(-2.4, -13.2); t.lineTo(0, big ? -15.6 : -14.2); t.lineTo(2.4, -13.2); t.lineTo(big ? 7.6 : 6.4, big ? -16.8 : -14.6); t.lineTo(5.6, -9.4); t.closePath(); t.fill();
      t.fillStyle = oi === 2 ? "#ff8f00" : "#1b5e20"; for (const [x, y] of [[-4, -13], [3, -12.5], [0, -11.6], [-1.8, -14.4]]) { t.beginPath(); t.arc(x, y, 0.8, 0, 7); t.fill(); } break; }
    case "a16": kiCapOver(t, skin); if (oi !== 1) { t.fillStyle = oi === 2 ? "#ff3d00" : "#d84315"; t.beginPath(); t.moveTo(-1.7, -9.8); t.quadraticCurveTo(-2, -16.6, 0, -16.8); t.quadraticCurveTo(2, -16.6, 1.7, -9.8); t.closePath(); t.fill(); } break;
    case "a17": { const c = oi === 1 ? "#212121" : "#151515"; kiCapOver(t, c);
      if (oi === 2) { t.fillStyle = "#2e7d32"; t.beginPath(); t.arc(0, -11, 5.6, Math.PI, 0); t.fill(); t.fillRect(-1, -11.4, 8.4, 1.4); t.fillStyle = c; t.fillRect(-5.6, -11, 1.8, 4.4); t.fillRect(3.8, -11, 1.8, 4.4); }
      else { t.fillStyle = c; t.beginPath(); t.arc(0, -10.4, 5.7, Math.PI * 0.85, Math.PI * 2.15); t.fill(); const L = oi === 1 ? 8.4 : 5.4; t.fillRect(-5.7, -10.6, 1.9, L); t.fillRect(3.8, -10.6, 1.9, L); t.fillStyle = "rgba(255,255,255,0.12)"; t.fillRect(-0.3, -15.6, 0.6, 3); }
      break; }
    case "a18": { const c = hairCol || "#ffe082"; kiCapOver(t, c); t.fillStyle = c; t.beginPath(); t.arc(0, -10.4, 5.8, Math.PI * 0.85, Math.PI * 2.15); t.fill(); const L = oi === 1 ? 9.4 : 6.4; t.fillRect(-5.9, -10.6, 2.1, L); t.fillRect(3.8, -10.6, 2.1, L); t.fillStyle = "rgba(0,0,0,0.12)"; t.fillRect(1.2, -15.8, 0.6, 3.4); break; }
  }
}
(function kiHeadWire() {
  if (typeof heroExtraHead !== "function") return;
  const o = heroExtraHead;
  window.heroExtraHead = heroExtraHead = function (t, cid, hairCol) {
    const x = HERO_EXTRA[cid];
    if (x && x.head && x.head.ki) { try { kiDrawHair(t, cid, x.head.ki, hairCol); } catch (e) { /* art */ } return; }
    return o.apply(this, arguments);
  };
})();

/* --- power up: charge, the golden form, full power, overdrive ---------------------------------------------- */
function kiIs() { return player && KI_HEROES.has(player.cid); }
function kiFormName(cid) { return KI_SAIYAN.has(cid) ? "GOLDEN FORM" : cid === 84 ? "FULL POWER" : cid === 85 ? "PERFECT POWER" : cid === 36 ? "NAMEKIAN FOCUS" : "OVERDRIVE"; }
function kiEnterForm() {
  const c = player.cid; KI.form = 1; KI.formT = runTime + (KI_ANDROID.has(c) ? 18 : 36); KI.ki = 0;
  const b = { might: 0.35, spd: 1.22, crit: 0.12, armor: 0, regen: 0, cdr: 1 };
  if (c === 84) { b.might = 0.45; b.spd = 1.15; } else if (c === 85) { b.might = 0.3; b.regen = 3; } else if (c === 36) { b.might = 0.15; b.armor = 6; b.regen = 4; b.spd = 1.1; }
  else if (KI_ANDROID.has(c)) { b.might = 0.15; b.spd = 1.1; b.cdr = 0.7; }
  KI.buff = b; player.might += b.might; player.spd *= b.spd; player.crit += b.crit; player.armor += b.armor; player.regen += b.regen; player.cdr = (player.cdr || 1) * b.cdr;
  if (typeof spawnSpeech === "function") spawnSpeech(player.x, player.y - 34, "⚡ " + kiFormName(c) + "!", KI_SAIYAN.has(c) ? "#ffd54f" : "#e1bee7", 2.6);
  if (typeof spawnBlastWave === "function") spawnBlastWave(player.x, player.y, 140, KI_SAIYAN.has(c) ? "#ffd54f" : "#ce93d8");
  if (typeof sfx === "function") { sfx(80, 900, 0.7, "sawtooth", 0.16); setTimeout(() => sfx(900, 1400, 0.3, "square", 0.08), 300); }
  if (typeof fxShake === "function") fxShake(10, 0.4);
}
function kiLeaveForm() {
  const b = KI.buff; if (b) { player.might -= b.might; player.spd /= b.spd; player.crit -= b.crit; player.armor -= b.armor; player.regen -= b.regen; player.cdr = (player.cdr || 1) / b.cdr; }
  KI.buff = null; KI.form = 0; KI.cdT = runTime + 20;
  if (typeof spawnSpeech === "function") spawnSpeech(player.x, player.y - 30, "…back to base", "#b0bec5", 1.4);
}
function kiStep(dt) {
  if (!kiIs()) return;
  const holding = keys.KeyR || KI.touch;
  if (KI.form && runTime > KI.formT) kiLeaveForm();
  if (KI_ANDROID.has(player.cid)) {   // infinite energy: no charging — the overdrive is there when it's off cooldown
    KI.ki = 100;
    if (holding && !KI.form && runTime > KI.cdT) kiEnterForm();
    KI.charging = false;
  } else {
    KI.charging = !!holding && !KI.form && runTime > KI.cdT && !player.inVehicle;
    if (KI.charging) {
      KI.ki = Math.min(100, KI.ki + dt * 34);
      player.vx *= 0.3; player.vy *= 0.3;
      if (Math.random() < dt * 14 && typeof spawnParticles === "function") spawnParticles(player.x + (Math.random() - 0.5) * 60, player.y + 14, 1, 6);
      if ((KI.auraT -= dt) <= 0) { KI.auraT = 0.5; if (typeof sfx === "function") sfx(60 + KI.ki * 3, 90 + KI.ki * 4, 0.45, "sawtooth", 0.05); if (typeof noiseEmit === "function") noiseEmit(player.x, player.y, 70 + KI.ki * 0.3, "ki", 2); }
      if (KI.ki >= 100) kiEnterForm();
    } else KI.ki = Math.max(0, KI.ki - dt * 3);
  }
  // Cell's borrowed abilities tick here
  kiAbsorbStep(dt);
  // Instant Transmission pose & static
  if (KI.itPose && runTime - KI.itPose.t > 1.2) KI.itPose = null;
  if ((TF && TF.frame & 15) === 0) kiHud();
}
function kiAuraCol(cid) { return KI.form ? (KI_SAIYAN.has(cid) ? "255,214,64" : cid === 84 ? "224,64,251" : cid === 85 ? "118,255,3" : KI_ANDROID.has(cid) ? "255,82,82" : "118,255,3") : "190,225,255"; }
function kiAuraStrength() { return KI.form ? 1 : KI.charging ? Math.max(0.15, KI.ki / 100) : 0; }
// the flame itself, drawn just before the hero sprite so the hero stays in front of it
function kiAuraBack(g, x, y) {
  const strength = kiAuraStrength(); if (strength <= 0) return;
  const t = runTime, col = kiAuraCol(player.cid), h = 30 + 18 * strength, w = 13 + 7 * strength;
  g.save(); g.globalCompositeOperation = "lighter";
  const base = g.createRadialGradient(x, y + 4, 2, x, y - 4, h * 0.9);
  base.addColorStop(0, "rgba(" + col + "," + (0.30 * strength) + ")"); base.addColorStop(0.6, "rgba(" + col + "," + (0.12 * strength) + ")"); base.addColorStop(1, "rgba(" + col + ",0)");
  g.fillStyle = base; g.beginPath(); g.moveTo(x - w, y + 13); g.quadraticCurveTo(x - w * 1.25, y - h * 0.45, x, y - h); g.quadraticCurveTo(x + w * 1.25, y - h * 0.45, x + w, y + 13); g.closePath(); g.fill();
  for (let k = 0; k < 5; k++) {   // flame tongues licking upwards
    const s = (k - 2) / 2, ph = t * (11 + k) + k * 1.7, top = y - h * (0.72 + 0.22 * Math.sin(ph)) , bx = x + s * w * 0.9;
    g.fillStyle = "rgba(" + col + "," + (0.16 * strength) + ")";
    g.beginPath(); g.moveTo(bx - 3.5, y + 10); g.quadraticCurveTo(bx - 4 + Math.sin(ph) * 3, (y + top) / 2, bx + s * 4 + Math.sin(ph * 1.3) * 2.5, top); g.quadraticCurveTo(bx + 4 + Math.sin(ph) * 2, (y + top) / 2, bx + 3.5, y + 10); g.closePath(); g.fill();
  }
  g.fillStyle = "rgba(" + col + "," + (0.18 * strength) + ")"; g.beginPath(); g.ellipse(x, y + 13, w * 1.15, 4.2, 0, 0, 7); g.fill();   // glow on the ground
  g.restore();
}
function kiRender(g) {
  if (!kiIs() || !player) return;
  const t = runTime, x = player.x, y = player.y, strength = kiAuraStrength();
  if (strength > 0) {   // in front of the hero: only a thin flickering rim, rising motes and (in a form) crackling sparks
    const col = kiAuraCol(player.cid), h = 30 + 18 * strength, w = 13 + 7 * strength, f = 0.5 + 0.5 * Math.sin(t * 23);
    g.save(); g.globalCompositeOperation = "lighter";
    g.strokeStyle = "rgba(" + col + "," + (0.22 + 0.18 * f) * strength + ")"; g.lineWidth = 1.1;
    g.beginPath(); g.moveTo(x - w, y + 13); g.quadraticCurveTo(x - w * 1.3, y - h * 0.45, x + Math.sin(t * 9) * 2, y - h - 2); g.quadraticCurveTo(x + w * 1.3, y - h * 0.45, x + w, y + 13); g.stroke();
    g.fillStyle = "rgba(" + col + "," + (0.55 * strength) + ")";
    for (let k = 0; k < 6; k++) { const u = (t * 0.9 + k / 6) % 1, mx = x + Math.sin(k * 2.3 + t * 2) * w * 0.9, my = y + 10 - u * h * 1.1; g.fillRect(mx - 0.7, my - 0.7, 1.4, 1.4); }
    if (KI.form && Math.random() < 0.35) { g.strokeStyle = "rgba(" + col + ",0.9)"; g.lineWidth = 1; g.beginPath(); let px = x + (Math.random() - 0.5) * 28, py = y - 28; g.moveTo(px, py); for (let s2 = 0; s2 < 4; s2++) { px += (Math.random() - 0.5) * 10; py += 9; g.lineTo(px, py); } g.stroke(); }
    g.restore();
  }
  // Instant Transmission: fingers to the forehead, then static
  const P = KI.itPose;
  if (P) {
    const k = runTime - P.t;
    g.save();
    if (k < 0.45 && P.phase === 0) { g.fillStyle = player.fac ? player.fac.c1 : "#ff9100"; g.save(); g.translate(x + 4, y - 12); g.rotate(-1.1); g.fillRect(0, -1.5, 9, 3); g.fillStyle = "#f1c27d"; g.fillRect(8, -1.2, 3.5, 1.1); g.fillRect(8, 0.3, 3.5, 1.1); g.restore(); }
    g.strokeStyle = "rgba(200,240,255,0.9)"; g.lineWidth = 1.1;
    for (let s2 = 0; s2 < 7; s2++) { const a = Math.random() * 6.28, r0 = 8 + Math.random() * 6, r1 = r0 + 6 + Math.random() * 10; g.beginPath(); g.moveTo(x + Math.cos(a) * r0, y - 6 + Math.sin(a) * r0); g.lineTo(x + Math.cos(a + 0.3) * (r0 + r1) / 2, y - 6 + Math.sin(a - 0.2) * (r0 + r1) / 2); g.lineTo(x + Math.cos(a) * r1, y - 6 + Math.sin(a) * r1); g.stroke(); }
    g.restore();
  }
  if (KI.absorbed.some(a => a.k === "levitate")) { g.save(); g.strokeStyle = "rgba(128,222,234,0.7)"; g.lineWidth = 1.5; g.beginPath(); g.ellipse(x, y + 12, 15, 5, 0, 0, 7); g.stroke(); g.restore(); }
}
function kiHud() {
  let el = document.getElementById("hudKi");
  if (!el) { const dm = document.getElementById("hudDM"); if (!dm) return; el = document.createElement("div"); el.className = "stat-pill"; el.id = "hudKi"; el.title = "Ki — hold R (or 🔥) to power up"; dm.insertAdjacentElement("beforebegin", el); }
  if (!kiIs()) { el.style.display = "none"; return; }
  el.style.display = "";
  const c = player.cid;
  el.textContent = KI.form ? "⚡ " + kiFormName(c) + " " + Math.max(0, Math.ceil(KI.formT - runTime)) + "s" : runTime < KI.cdT ? "🔥 recovering " + Math.ceil(KI.cdT - runTime) + "s" : KI_ANDROID.has(c) ? "♾ OVERDRIVE READY (R)" : "🔥 KI " + Math.round(KI.ki) + "% (hold R)";
  el.style.color = KI.form ? "#ffd54f" : "";
  let b = document.getElementById("kiBtns");
  if (!b) {
    b = document.createElement("div"); b.id = "kiBtns"; b.style.cssText = "position:fixed;left:10px;top:42%;z-index:9000;display:flex;flex-direction:column;gap:6px;touch-action:none;user-select:none";
    b.innerHTML = '<button class="btn" id="kiPow" title="Power up (hold R)" style="min-width:54px;padding:8px 6px;font-size:16px">🔥</button><button class="btn" id="kiITb" title="Instant Transmission (T)" style="min-width:54px;padding:8px 6px;font-size:13px">IT</button><button class="btn" id="kiFly" title="Fly (G)" style="min-width:54px;padding:8px 6px;font-size:16px">🕊</button>';
    document.body.appendChild(b);
    const p = b.querySelector("#kiPow"); p.onpointerdown = (e) => { e.preventDefault(); KI.touch = 1; }; p.onpointerup = p.onpointerleave = p.onpointercancel = () => { KI.touch = 0; };
    b.querySelector("#kiITb").onclick = () => kiITOpen();
    b.querySelector("#kiFly").onclick = () => { if (typeof flyToggleSelf === "function") flyToggleSelf(); };
  }
  b.style.display = runActive && typeof CITY !== "undefined" && CITY.on ? "flex" : "none";
  b.querySelector("#kiITb").style.display = kiCanIT() ? "" : "none";
}

/* --- Instant Transmission --------------------------------------------------------------- */
function kiCanIT() { return player && (player.cid === 34 || KI.absorbed.some(a => a.k === "it")); }
function kiITOpen() {
  if (!runActive || !kiCanIT() || KI.it || typeof CITY === "undefined" || !CITY.on || typeof mapDraw !== "function") return;
  if (runTime < KI.itCd) { if (typeof itToast === "function") itToast("Instant Transmission recharging…", "#b0bec5"); return; }
  const el = document.createElement("div"); el.id = "kiIT";
  el.style.cssText = "position:fixed;inset:0;z-index:100500;background:#05080f;touch-action:none;cursor:none";
  el.innerHTML = '<canvas id="kiITcv" style="position:absolute;inset:0;width:100%;height:100%"></canvas>' +
    '<div style="position:absolute;top:12px;left:50%;transform:translateX(-50%);color:#ffd54f;font:800 15px \'Segoe UI\',sans-serif;text-shadow:0 0 8px #ff9100;pointer-events:none">✌️ INSTANT TRANSMISSION — tap where to go</div>' +
    '<div style="position:absolute;top:10px;right:12px;display:flex;gap:6px"><button class="btn" id="kiITin">+</button><button class="btn" id="kiITout">−</button><button class="btn" id="kiITx">✖ CANCEL</button></div>' +
    '<div style="position:absolute;top:36px;left:50%;transform:translateX(-50%);color:#b0bec5;font:12px \'Segoe UI\',sans-serif;text-shadow:0 1px 3px #000;pointer-events:none;white-space:nowrap">No marker is placed — this map only aims the jump · wheel / ± zoom · ESC cancels</div>';
  document.body.appendChild(el);
  const [xm, ym] = cityWorldM(player.x, player.y);
  KI.it = { el, cxm: xm, cym: ym, mpp: 8, mx: -1, my: -1, wasPaused: runPaused, raf: 0 };
  runPaused = true;
  const cv = el.querySelector("#kiITcv");
  const draw = () => {
    if (!KI.it) return;
    const I = KI.it, W0 = cv.width = el.clientWidth, H0 = cv.height = el.clientHeight, g = cv.getContext("2d");
    mapDraw(g, 0, 0, W0, H0, I.cxm, I.cym, I.mpp, 4);
    const [pxm, pym] = cityWorldM(player.x, player.y), sx = W0 / 2 + (pxm - I.cxm) / I.mpp, sy = H0 / 2 + (pym - I.cym) / I.mpp;
    g.fillStyle = "#ff9100"; g.beginPath(); g.arc(sx, sy, 6, 0, 7); g.fill(); g.strokeStyle = "#fff"; g.lineWidth = 2; g.stroke();
    // the glowing IT reticle at the pointer
    if (I.mx >= 0) {
      const p = 0.6 + 0.4 * Math.sin(performance.now() / 120);
      g.save(); g.shadowColor = "#ffd54f"; g.shadowBlur = 18 * p;
      g.strokeStyle = "rgba(255,213,79," + (0.7 + 0.3 * p) + ")"; g.lineWidth = 3; g.beginPath(); g.arc(I.mx, I.my, 22, 0, 7); g.stroke();
      g.beginPath(); g.arc(I.mx, I.my, 30 + 6 * p, 0, 7); g.globalAlpha = 0.4; g.stroke(); g.globalAlpha = 1;
      g.fillStyle = "#ffd54f"; g.font = "900 14px 'Segoe UI', sans-serif"; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText("IT", I.mx, I.my);
      g.restore();
    }
    I.raf = requestAnimationFrame(draw);
  };
  const toM = (cx, cy) => { const I = KI.it, r = cv.getBoundingClientRect(); return [I.cxm + (cx - r.left - r.width / 2) * I.mpp, I.cym + (cy - r.top - r.height / 2) * I.mpp]; };
  el.addEventListener("pointermove", (e) => { const r = cv.getBoundingClientRect(); KI.it.mx = e.clientX - r.left; KI.it.my = e.clientY - r.top; });
  el.addEventListener("pointerdown", (e) => { if (e.target.closest("button")) return; const r = cv.getBoundingClientRect(); KI.it.mx = e.clientX - r.left; KI.it.my = e.clientY - r.top; });
  cv.addEventListener("click", (e) => { const [tx, ty] = toM(e.clientX, e.clientY); kiITClose(); kiITGo(tx, ty); });
  el.addEventListener("wheel", (e) => { e.preventDefault(); KI.it.mpp = Math.max(1, Math.min(160, KI.it.mpp * (e.deltaY > 0 ? 1.25 : 0.8))); }, { passive: false });
  el.querySelector("#kiITin").onclick = () => { KI.it.mpp = Math.max(1, KI.it.mpp * 0.7); };
  el.querySelector("#kiITout").onclick = () => { KI.it.mpp = Math.min(160, KI.it.mpp * 1.4); };
  el.querySelector("#kiITx").onclick = kiITClose;
  draw();
}
function kiITClose() { const I = KI.it; if (!I) return; cancelAnimationFrame(I.raf); I.el.remove(); runPaused = !!I.wasPaused; KI.it = null; }
function kiITGo(xm, ym) {
  const lo = typeof RG !== "undefined" && RG.real ? 8100 : 50, hi = typeof RG !== "undefined" && RG.real ? 55900 : 63950;
  xm = Math.max(lo, Math.min(hi, xm)); ym = Math.max(lo, Math.min(hi, ym));
  const q = cityFindWalkable(xm * 32 - CITY.orx, ym * 32 - CITY.ory, 600, false);
  KI.itPose = { t: runTime, phase: 0 };
  if (typeof sfx === "function") sfx(1200, 3000, 0.18, "square", 0.08);
  KI.itCd = runTime + 1.0;   // about a second to recharge
  setTimeout(() => {
    if (!player || !runActive) return;
    if (player.inVehicle === 3 && typeof vehExit === "function") vehExit(false);
    if (typeof FLY !== "undefined" && FLY.on && FLY.self && typeof flyEnd === "function") flyEnd("it");
    player.x = q[0]; player.y = q[1]; player.vx = player.vy = 0;
    KI.itPose = { t: runTime, phase: 1 };
    if (typeof sfx === "function") sfx(3000, 900, 0.16, "square", 0.08);
    if (typeof spawnSpeech === "function") spawnSpeech(player.x, player.y - 28, "✌️ INSTANT TRANSMISSION", "#ffd54f", 1.6);
    if (typeof cityRT !== "undefined") cityRT.visGen++;
  }, 420);
}

/* --- Cell absorbs: one natural ability per hero ------------------------------------------- */
// cid → [ability, kind, value] (kinds: speed regen armor crit might multi cdr magnet area revive dodge lightning burn freeze levitate cloak vamp it rage)
const CELL_ABSORB = {
  0: ["Farm-Boy Reflexes", "dodge", 0.08], 1: ["Beskar Hide", "armor", 4], 2: ["Garrison Discipline", "multi", 1], 3: ["Sovereign Lightning", "lightning", 3], 4: ["Overclocked Servos", "cdr", 0.15],
  5: ["Wookiee Fury", "rage", 0.4], 6: ["Smuggler's Luck", "crit", 0.1], 7: ["Jackal Ascension", "regen", 2.5], 8: ["Demolition Instinct", "area", 0.25], 9: ["Symbiote Healing", "regen", 3],
  10: ["Asgard Beam-Step", "it", 1], 11: ["Life-Force Feeding", "vamp", 0.04], 12: ["Prior's Zeal", "might", 0.18], 13: ["Captain's Grit", "armor", 3], 14: ["Psychic Evasion", "dodge", 0.12],
  15: ["Canton Toughness", "armor", 5], 16: ["Leaf on the Wind", "speed", 0.15], 17: ["Reaver Frenzy", "rage", 0.5], 18: ["Prescience", "dodge", 0.1], 19: ["Salusa Conditioning", "armor", 4],
  20: ["The Voice", "freeze", 1], 21: ["Suspensor Drift", "levitate", 0], 22: ["Plot Armor", "revive", 1], 23: ["Adaptive Shielding", "armor", 6], 24: ["Warrior's Bloodlust", "vamp", 0.03],
  25: ["Ace Pilot Reflexes", "speed", 0.12], 26: ["Resurrection Uplink", "revive", 1], 27: ["Biotic Barrier", "armor", 5], 28: ["Motion Tracking", "crit", 0.08], 29: ["Active Camouflage", "cloak", 0.5],
  30: ["Acid Blood", "burn", 18], 31: ["Bug-War Grit", "multi", 1], 32: ["Energy Shield", "regen", 2], 33: ["Rip & Tear", "rage", 0.6], 34: ["Instant Transmission", "it", 1],
  35: ["Saiyan Pride", "might", 0.2], 36: ["Namekian Regeneration", "regen", 4], 37: ["Swordsman's Speed", "speed", 0.14], 38: ["Hidden Potential", "rage", 0.5], 39: ["Bullet-Time Mind", "dodge", 0.15],
  40: ["Hyperalloy Frame", "armor", 7], 41: ["Replicant Endurance", "regen", 2], 42: ["Sandevistan Reflex", "speed", 0.2], 43: ["Targeting Lock", "crit", 0.12], 44: ["Nitro Rush", "speed", 0.18],
  45: ["HEV Suit Systems", "armor", 4], 46: ["Time-Lord Regeneration", "revive", 1], 47: ["Screw-Attack Spin", "burn", 14], 48: ["Mutagen Senses", "crit", 0.1], 49: ["Non-Euclidean Step", "cloak", 0.35],
  50: ["Ronin Toughness", "armor", 4], 51: ["Assassin's Focus", "crit", 0.14], 52: ["High-Noon Deadeye", "crit", 0.12], 53: ["Last-Stand Grit", "rage", 0.45], 54: ["Bounty Arsenal", "multi", 1],
  55: ["Four-Armed Fury", "multi", 2], 56: ["The Boy Who Lived", "revive", 1], 57: ["Brightest Mind", "cdr", 0.18], 58: ["Wizard Chess Tactics", "area", 0.2], 59: ["Second Sight", "dodge", 0.1],
  60: ["Badger Loyalty", "armor", 3], 61: ["Half-Giant Constitution", "regen", 3], 62: ["Pure-Blood Ambition", "might", 0.15], 63: ["Moon-Touched Ferocity", "rage", 0.5], 64: ["Grim Hound Speed", "speed", 0.16],
  65: ["Constant Vigilance", "dodge", 0.1], 66: ["Transfiguration", "magnet", 0.5], 67: ["Half-Blood Craft", "cdr", 0.15], 68: ["Cruciatus Sadism", "burn", 16], 69: ["Phoenix Rebirth", "revive", 1],
  70: ["Dark Flight", "speed", 0.14], 71: ["Secret Fire", "burn", 20], 72: ["Voice of Command", "freeze", 1], 73: ["Time Stone Insight", "cdr", 0.2], 74: ["Chaos Hex", "lightning", 2],
  75: ["Corpse-Raiser's Hunger", "vamp", 0.05], 76: ["Juggernaut Armor", "armor", 8], 77: ["Assassin's Agility", "speed", 0.15], 78: ["Vaapad Conduit", "might", 0.22], 79: ["Levitation & the Backwards Tongue", "levitate", 1],
  80: ["Custom Gift", "might", 0.15], 81: ["The Living Force", "regen", 3], 82: ["Sith Lightning", "lightning", 3], 83: ["The High Ground", "armor", 5],
  84: ["Tyrant's Telekinesis", "freeze", 1], 85: ["Perfect Cells", "regen", 3], 86: ["Infinite Energy Core", "cdr", 0.2], 87: ["Barrier Generator", "armor", 6], 88: ["Infinite Barrage", "multi", 2]
};
function kiAbsorb(cid, how) {
  if (!player || player.cid !== 85 || KI.absorbed.some(a => a.cid === cid)) return false;
  const A = CELL_ABSORB[cid]; if (!A) return false;
  const [name, k, v] = A, rec = { cid, n: name, k, v };
  KI.absorbed.push(rec);
  if (k === "speed") player.spd *= 1 + v; else if (k === "regen") player.regen += v; else if (k === "armor") player.armor += v; else if (k === "crit") player.crit += v;
  else if (k === "might" || k === "rage") player.might += k === "might" ? v : 0; else if (k === "multi") player.projCnt += v; else if (k === "cdr") player.cdr = (player.cdr || 1) * (1 - v);
  else if (k === "magnet") player.mag *= 1 + v; else if (k === "area") player.area *= 1 + v; else if (k === "revive") player.revives = (player.revives || 0) + v; else if (k === "dodge") player.dodge = (player.dodge || 0) + v;
  else if (k === "levitate") player.hazImmune = true;
  const who = CHAR_RAW[cid] ? (typeof heroDisplayName === "function" ? heroDisplayName(cid) : CHAR_RAW[cid][3]) : "?";
  if (typeof spawnSpeech === "function") spawnSpeech(player.x, player.y - 36, "🧬 ABSORBED " + String(who).toUpperCase() + " — " + name.toUpperCase(), "#76ff03", 3.2);
  if (typeof spawnBlastWave === "function") spawnBlastWave(player.x, player.y, 90, "#76ff03");
  if (typeof sfx === "function") sfx(200, 60, 0.5, "sawtooth", 0.14);
  return true;
}
function kiAbsorbStep(dt) {
  if (!KI.absorbed.length) return;
  for (const a of KI.absorbed) {
    if ((a.k === "lightning" || a.k === "burn" || a.k === "freeze") && typeof flyGroundSeparated === "function" && flyGroundSeparated()) continue;
    if (a.k === "lightning") { a.t = (a.t || 0) - dt; if (a.t <= 0) { a.t = 2.4; let n = a.v; for (let j = 0; j < MAX_E && n > 0; j++) if (eAct[j] && Math.hypot(eX[j] - player.x, eY[j] - player.y) < 260) { eHP[j] -= 40 * (player.might || 1); if (typeof spawnParticles === "function") spawnParticles(eX[j], eY[j], 3, 8); if (eHP[j] <= 0) killEnemy(j); n--; } } }
    else if (a.k === "burn") { for (let j = 0; j < MAX_E; j++) if (eAct[j] && Math.hypot(eX[j] - player.x, eY[j] - player.y) < 90) { eHP[j] -= a.v * dt * (player.might || 1); if (eHP[j] <= 0) killEnemy(j); } }
    else if (a.k === "freeze") { a.t = (a.t || 0) - dt; if (a.t <= 0) { a.t = 4; for (let j = 0; j < MAX_E; j++) if (eAct[j] && Math.hypot(eX[j] - player.x, eY[j] - player.y) < 130) eStun[j] = Math.max(eStun[j], 0.8); } }
    else if (a.k === "rage") { const on = player.hp < player.maxHp * 0.5; if (on && !a.on) { player.might += a.v; a.on = 1; } else if (!on && a.on) { player.might -= a.v; a.on = 0; } }
  }
}
// Yoda's gift: the way of speaking comes with it
function kiYodaSpeak(s) {
  const m = String(s).match(/^([\s\S]*?)([!.?]*)$/), body = m[1], end = m[2] || ".";
  const words = body.split(" ");
  if (words.length < 3) return s;
  const cut = Math.max(1, Math.floor(words.length / 2)), first = words.slice(0, cut), rest = words.slice(cut);
  if (first[0] && !/^I($|')/.test(first[0])) first[0] = first[0].charAt(0).toLowerCase() + first[0].slice(1);
  const out = rest.join(" ") + ", " + first.join(" ");
  return out.charAt(0).toUpperCase() + out.slice(1) + (end.indexOf("!") >= 0 ? "!" : end.indexOf("?") >= 0 ? "?" : ".");
}

// Frieza's and Cell's tails swing behind them (sprite space, drawn before the body)
function kiTail(g, x, y, cid, walk, aim) {
  const dir = Math.cos(aim || 0) >= 0 ? 1 : -1, sw = Math.sin((walk || 0) * 2.6 + (typeof runTime !== "undefined" ? runTime : 0) * 2) * 2.5;
  const tip = [x - dir * 15, y - 3 + sw];
  g.save(); g.lineCap = "round";
  g.strokeStyle = "rgba(0,0,0,0.35)"; g.lineWidth = 3.6; g.beginPath(); g.moveTo(x - dir * 2.5, y + 5); g.quadraticCurveTo(x - dir * 15, y + 11 + sw, tip[0], tip[1]); g.stroke();
  g.strokeStyle = cid === 84 ? "#f5f5f5" : "#43a047"; g.lineWidth = 2.4; g.beginPath(); g.moveTo(x - dir * 2.5, y + 5); g.quadraticCurveTo(x - dir * 15, y + 11 + sw, tip[0], tip[1]); g.stroke();
  if (cid === 85) { g.fillStyle = "#1b5e20"; g.beginPath(); g.moveTo(tip[0] - 1.6, tip[1] + 1); g.lineTo(tip[0] - dir * 1.5, tip[1] - 4.2); g.lineTo(tip[0] + 1.6, tip[1] + 1); g.fill(); }
  else { g.fillStyle = "#ce93d8"; g.beginPath(); g.arc(tip[0], tip[1], 1.3, 0, 7); g.fill(); }
  g.restore();
}
/* --- bare-handed fighters: a ki glow in the palm instead of a gun (Trunks's sword is drawn as steel by the engine) -- */
const KI_PALM = { 34: "#4fc3f7", 35: "#ffd54f", 36: "#ffd54f", 38: "#4fc3f7", 84: "#e040fb", 85: "#76ff03", 86: "#ff9100", 87: "#69f0ae", 88: "#e1f5fe" };
(function kiArtWire() {
  if (typeof drawWeaponModel === "function") {
    const o = drawWeaponModel;
    window.drawWeaponModel = drawWeaponModel = function (t, wpnId, style, isLv5, isSuper, bladeCol, rackShift) {
      const col = KI_PALM[wpnId];
      if (!col) return o.apply(this, arguments);
      try {
        const rk = Math.min(1, Math.abs(rackShift || 0)), cannon = wpnId === 86;
        if (cannon) { t.fillStyle = "#546e7a"; t.fillRect(-1, -1.7, 6, 3.4); t.fillStyle = "#263238"; t.fillRect(4.4, -1.1, 1.4, 2.2); }   // Android 16's forearm cannon
        const r = (isLv5 ? 2.3 : 1.8) * (0.8 + 0.2 * Math.sin(runTime * 10 + wpnId)) + rk * 2.2 + (isSuper ? 1 : 0), x = cannon ? 6 : 2.6;
        t.save(); t.globalCompositeOperation = "lighter";
        const G = t.createRadialGradient(x, 0, 0, x, 0, r * 2.4);
        G.addColorStop(0, "rgba(255,255,255,0.95)"); G.addColorStop(0.35, col); G.addColorStop(1, "rgba(0,0,0,0)");
        t.fillStyle = G; t.beginPath(); t.arc(x, 0, r * 2.4, 0, 7); t.fill(); t.restore();
      } catch (e) { /* art */ }
    };
  }
  if (typeof drawHeroSprite === "function") {
    const o = drawHeroSprite;
    window.drawHeroSprite = drawHeroSprite = function (x, y, fac, cid, walk, aim, inVeh, g) {
      if (g && player && cid === player.cid && kiIs() && (KI.form || KI.charging) && Math.abs(x - player.x) < 8 && Math.abs(y - player.y) < 8) { try { kiAuraBack(g, x, y); } catch (e) { /* art */ } }
      if (g && (cid === 84 || cid === 85)) { try { kiTail(g, x, y, cid, walk, aim); } catch (e) { /* art */ } }
      return o.apply(this, arguments);
    };
  }
})();

/* --- engine hooks ----------------------------------------------------------------------- */
(function kiWire() {
  // ki techniques don't drop for someone who can't use ki; Trunks's sword drops for anyone
  if (typeof spawnWeaponDrop === "function") {
    const o = spawnWeaponDrop;
    window.spawnWeaponDrop = spawnWeaponDrop = function (x, y, wpnId) {
      if (KI_HEROES.has(wpnId) && wpnId !== 37 && !kiIs()) { if (typeof spawnSpeech === "function") spawnSpeech(x, y - 20, "KI TECHNIQUES CAN'T BE LOOTED", "#b0bec5", 2); return; }
      return o.apply(this, arguments);
    };
  }
  // Cell: finishing a rival hero absorbs them
  if (typeof V10 !== "undefined") V10.onKill.push((idx, ex, ey, et, isEcho) => { if (!isEcho && player && player.cid === 85 && eType[idx] === 98 && typeof eRivalCid !== "undefined" && eRivalCid[idx] >= 0) kiAbsorb(eRivalCid[idx], "kill"); });
  // ki blasts sound like ki
  if (typeof sfxWeapon === "function") { const o = sfxWeapon; window.sfxWeapon = sfxWeapon = function (style, wpnId) { if (KI_HEROES.has(wpnId) && wpnId !== 37) { sfx(520 + Math.random() * 80, 1400, 0.09, "square", 0.07); return; } return o.apply(this, arguments); }; }
  // utilities: Instant Transmission, Absorb, Regenerate
  if (typeof triggerUtility === "function") {
    const o = triggerUtility;
    window.triggerUtility = triggerUtility = function (uIdx) {
      const u = player && player.utils && player.utils[uIdx];
      if (u && (u.type === "kiIT" || u.type === "kiAbsorb" || u.type === "kiRegen")) {
        if (u.type === "kiAbsorb" && typeof flyGroundSeparated === "function" && flyGroundSeparated()) { if (typeof flyTip === "function") flyTip("⬇ DESCEND TO REACH THE GROUND"); return; }
        if (u.cd > 0) return;
        if (u.type === "kiIT") { kiITOpen(); u.cd = 1; }
        else if (u.type === "kiRegen") { player.hp = Math.min(player.maxHp, player.hp + player.maxHp * 0.4); if (player.limbs) for (let i = 0; i < player.limbs.length; i++) player.limbs[i] = 100; spawnSpeech(player.x, player.y - 30, "REGENERATE!", "#76ff03", 1.8); u.cd = u.cdMax * (player.utilCdrMul || 1); }
        else {   // the tail strike
          let best = -1, bd = 150;
          for (let j = 0; j < MAX_E; j++) if (eAct[j]) { const d = Math.hypot(eX[j] - player.x, eY[j] - player.y); if (d < bd) { bd = d; best = j; } }
          if (best < 0) { spawnSpeech(player.x, player.y - 26, "Nothing to absorb…", "#90a4ae", 1.4); return; }
          const rival = eType[best] === 98 && eRivalCid[best] >= 0, weak = eHP[best] < eMax[best] * 0.4;
          if (rival && !weak) { eHP[best] -= eMax[best] * 0.15; spawnSpeech(eX[best], eY[best] - 24, "NOT WEAK ENOUGH YET", "#ffab40", 1.4); }
          else { const cidR = rival ? eRivalCid[best] : -1; killEnemy(best); player.hp = Math.min(player.maxHp, player.hp + player.maxHp * 0.08); if (cidR >= 0) kiAbsorb(cidR, "tail"); else spawnSpeech(player.x, player.y - 26, "🧬 ABSORBED", "#76ff03", 1.2); }
          u.cd = u.cdMax * (player.utilCdrMul || 1);
        }
        if (typeof updateHUD === "function") updateHUD();
        return;
      }
      return o.apply(this, arguments);
    };
  }
  // Yoda's speech for Cell, once absorbed: his own lines only (not a rival's "NAME: …" callout, not ALL-CAPS combat calls)
  if (typeof spawnSpeech === "function") { const o = spawnSpeech; window.spawnSpeech = spawnSpeech = function (x, y, text) { if (player && player.cid === 85 && KI.absorbed.some(a => a.k === "levitate" && a.v) && typeof text === "string" && Math.abs(x - player.x) < 4 && /^[A-Z]/.test(text) && /[a-z]/.test(text) && !/^[A-Z][A-Z0-9 '.\-]+:/.test(text) && text.split(" ").length >= 3) arguments[2] = kiYodaSpeak(text); return o.apply(this, arguments); }; }
  window.addEventListener("keydown", e => { if (e.code === "KeyT" && !e.repeat && runActive && !runPaused && kiCanIT()) kiITOpen(); else if (e.code === "Escape" && KI.it) kiITClose(); });
  if (typeof V10 !== "undefined") {
    V10.onRunStart.push(() => { KI.ki = 0; KI.form = 0; KI.buff = null; KI.cdT = 0; KI.itCd = 0; KI.itPose = null; KI.absorbed = []; kiITClose(); kiHud(); });
    V10.onStep.push(kiStep);
    V10.onRenderWorld.push(kiRender);
    V10.onRunReset.push(() => { kiITClose(); const b = document.getElementById("kiBtns"); if (b) b.style.display = "none"; const h = document.getElementById("hudKi"); if (h) h.style.display = "none"; });
  }
})();

// EOF:js/kisurge.js
