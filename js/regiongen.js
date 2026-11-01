/* =========================================================================
   OMNI-SHIFT v14.2 — WORLD PROFILES · GENERATOR (js/regiongen.js)
   Every universe gets its own 64 × 64 km homeworld, different on every run:
   • nexus   — the exact v14.1 Nexus City region (seed-locked, dressed per hero)
   • grid    — the v14 street lattice re-dressed for a world (the Midwest, Night
               City, Starfleet Earth) + an edge beltway + airports
   • organic — no lattice at all: terrain fields (rock, dunes, water, forest…),
               towns with radial / linear / cluster / walled / grid street plans,
               a curvy track network (spanning tree + loops + site spurs + a ring
               road round the map edge), homesteads, camps and film landmarks
               placed where they belong (moisture farms out on the flats, Tusken
               camps in the Jundland canyons, a sandcrawler crossing the dunes…)
   The macro plan (towns, tracks, sites) is built at init in a few ms; each
   1 km cell is ONE block, generated lazily and deterministically on demand,
   so chunk rasterising, interiors, doors, spawns and the renderer all keep
   working unchanged. js/regionsites.js adds the per-world landmark builders,
   js/regionart.js paints everything, js/location.js is the menu side.
   Units: metres for the macro plan, world tiles (0.5 m) for blocks.
   ========================================================================= */
"use strict";

const RG = {
  key: "nexus", P: null, style: "nexus", seed: 1979, org: false, grid: false,
  towns: [], roads: [], segIdx: new Map(), sites: [], siteCell: new Map(), rings: [], airports: [], airCell: new Map(),
  initMs: 0, version: 1, genKey: "nexus"
};
const RG_INSET = 260;                       // ring road centre line, metres from the map edge
function rgCK(mx, my) { return mx * 64 + my; }
function rgSm(a, b, v) { const t = Math.max(0, Math.min(1, (v - a) / (b - a))); return t * t * (3 - 2 * t); }
function rgClamp(v, a, b) { return v < a ? a : v > b ? b : v; }

/* --- 1. PROFILES ------------------------------------------------------------------- */
// fields: named noise fields { sc: feature size (m), k: noise key, lo/hi: smoothstep band of the fbm value }
// cl: names of the 8 district classes on this world (banner, map legend)
// area: names for open country by dominant field
const RG_PROFILES = {
  nexus: { name: "Classic Nexus City", style: "nexus", icon: "🌆", group: "Classic",
    sub: "The v14 Indiana-style 64 km region, re-dressed for whichever hero you play. Same layout every run unless you roll a new one." },

  midwest: { name: "The Midwest", style: "grid", icon: "🌽", group: "Real Life", theme: "modern", roster: "lapd",
    sub: "Real-life heartland: county-road sections, farm towns, a capital city, interstates, an edge beltway and regional airports.",
    grid: { majors: 7, towns: 22, villages: 26, airports: 4, beltway: true } },
  nightcity: { name: "Night City", style: "grid", icon: "🌃", group: "Cyber-Noir", theme: "neon", roster: "arasaka",
    sub: "One sprawling neon megacity — Watson, Westbrook, Heywood, Pacifica, Santo Domingo — ringed by the sun-baked Badlands.",
    grid: { majors: 2, towns: 10, villages: 14, mega: 15500, badlands: true, airports: 2, beltway: true },
    gnd: { 0: ["sand", "#a88a5e"], 1: ["dirt", "#9a7a52"], 6: ["dirt", "#7a6448"] }, gcl: ["Badlands", "Badlands Fringe", "Suburbs", "City", "City Center", "Industrial Zone", "Rock Desert", "Reservoir"] },
  sfearth: { name: "Starfleet Earth", style: "grid", icon: "🖖", group: "Star-Citadel", theme: "starship", roster: "borg",
    sub: "24th-century Earth: a gleaming San Francisco around Starfleet HQ and the Academy, garden suburbs, parkland and shuttle ports.",
    grid: { majors: 5, towns: 16, villages: 18, airports: 3, beltway: true, parks: 0.24 } },

  tatooine: { name: "Tatooine", style: "organic", icon: "🏜️", group: "Star-Sector", theme: "galactic", roster: "imperial", natives: "tusken",
    sub: "Twin suns over the Dune Sea and the Jundland Wastes · domed spaceport towns with docking bays · moisture farms · Tusken camps · Jawa sandcrawlers · krayt bones.",
    fields: { rock: { sc: 3400, k: 301, lo: 0.6, hi: 0.68 }, dune: { sc: 5600, k: 302, lo: 0.54, hi: 0.62 }, flat: { sc: 2600, k: 303, lo: 0.63, hi: 0.69 } },
    ground: { base: ["sand", "#d2ae74"], layers: [
      { f: "flat", pat: "packed", col: "#dcc49a", a: 0.85 },
      { f: "dune", pat: "dune", col: "#dcb06e", a: 1 },
      { f: "rock", pat: "rock", col: "#b07c4e", a: 1, lo: 0.18, hi: 0.42 }], town: ["packed", "#c8a878"] },
    rocks: { col: ["#a06e44", "#b88456", "#8e6040"], mesa: true, boulders: 1 },
    scrub: { n: 5, col: "#8a7a4a" },
    towns: { major: { n: 1, r: [1250, 1450] }, town: { n: 4, r: [600, 900] }, village: { n: 9, r: [230, 360] }, style: "radial", vstyle: "cluster",
      names: ["Mos Eisley", "Mos Espa", "Anchorhead", "Bestine", "Mos Entha", "Freetown", "Mos Pelgo", "Wayfar", "Tosche", "Mos Taike", "Jundland Post", "Motesta", "Arnthout", "Bezzard", "Mos Shuuta"],
      streets: ["Kerner Plaza", "Spaceport Row", "Dewback Way", "Krayt Lane", "Jawa Row", "Bantha Track", "Vaporator St", "Cantina Alley", "Sandcrawler Rd", "Dune Rd", "Hutt Way", "Womp Rat Alley"] },
    bld: { round: 0.62, mat: "masonry", roof: "flat", bays: 4,
      core: [["commercial:bar", 2], ["commercial:store", 3], ["commercial:hardware", 2], ["commercial:autorepair", 2], ["commercial:pharmacy", 1], ["commercial:diner", 1], ["commercial:gasstore", 1], ["warehouse", 2], ["dome", 5], ["rgbox", 3]],
      mid: [["dome", 7], ["rgbox", 3], ["commercial:store", 1], ["commercial:shop", 1]],
      edge: [["dome", 6], ["rgbox", 2], ["shed", 1]] },
    sites: [
      { k: "moisture", n: 46, on: "open", sep: 1400, road: 1, cls: 1 },
      { k: "tusken", n: 16, on: "rock", sep: 2600, cls: 6 },
      { k: "sandcrawler", n: 6, on: "dune", sep: 5000, cls: 0 },
      { k: "krayt", n: 5, on: "dune", sep: 6000, cls: 0 },
      { k: "sarlacc", n: 1, on: "dune", sep: 9000, cls: 0, far: 7000 },
      { k: "jabba", n: 1, on: "rock", sep: 9000, road: 1, cls: 5, far: 9000 },
      { k: "benhut", n: 1, on: "rock", sep: 6000, cls: 1, far: 6000 },
      { k: "tosche", n: 1, on: "open", sep: 4000, road: 1, cls: 5 },
      { k: "escapepod", n: 2, on: "dune", sep: 8000, cls: 0 },
      { k: "podarena", n: 1, on: "open", sep: 5000, road: 1, cls: 5, near: 1 }],
    area: { open: "Open Desert", dune: "Dune Sea", rock: "Jundland Wastes", flat: "Salt Flats" },
    cl: ["Open Desert", "Moisture Farms", "Outskirts", "Old Town", "Spaceport Quarter", "Docking District", "Jundland Wastes", "Oasis"],
    ring: "Outer Rim Road", sky: { tint: "rgba(255,170,70,0.06)" } },

  abydos: { name: "Abydos", style: "organic", icon: "🔺", group: "Chevron-Gate", theme: "pharaoh", roster: "goauld",
    sub: "Endless golden dunes under three moons · the great pyramid that hides the Stargate · Nagada's mud-brick city and naquadah mines · mastadge caravans.",
    fields: { rock: { sc: 3800, k: 311, lo: 0.63, hi: 0.7 }, dune: { sc: 4200, k: 312, lo: 0.48, hi: 0.58 }, flat: { sc: 2400, k: 313, lo: 0.64, hi: 0.7 } },
    ground: { base: ["sand", "#dcbc78"], layers: [
      { f: "dune", pat: "dune", col: "#e2c07a", a: 1 },
      { f: "flat", pat: "packed", col: "#e4cc98", a: 0.8 },
      { f: "rock", pat: "rock", col: "#b89058", a: 1, lo: 0.18, hi: 0.42 }], town: ["packed", "#cfae78"] },
    rocks: { col: ["#b08a52", "#c49c62", "#9a7a46"], mesa: true, boulders: 1 },
    scrub: { n: 2, col: "#9a8a4a" },
    towns: { major: { n: 1, r: [1100, 1300] }, town: { n: 3, r: [450, 700] }, village: { n: 8, r: [200, 320] }, style: "walled", vstyle: "cluster",
      names: ["Nagada", "Kasuf's Rest", "Skaara's Well", "Sha're Oasis", "Old Nagada", "Ra's Landing", "Mine Camp", "Daniel's Ford", "Shifu Well", "Teti Camp", "Mastadge Post", "Star Hollow"],
      streets: ["Market Way", "Mine Road", "Well Street", "Caravan Lane", "Chieftain's Walk", "Potters' Row", "Weavers' Row", "Gate Road"] },
    bld: { round: 0.08, mat: "masonry", roof: "flat", wall: 1,
      core: [["commercial:store", 3], ["commercial:bar", 1], ["commercial:diner", 1], ["rgbox", 6], ["warehouse", 1], ["church", 1]],
      mid: [["rgbox", 8], ["commercial:shop", 1]], edge: [["rgbox", 6], ["shed", 2]] },
    sites: [
      { k: "pyramid", n: 1, on: "dune", sep: 9000, road: 1, cls: 5, near: 1 },
      { k: "mine", n: 5, on: "rock", sep: 4000, road: 1, cls: 5 },
      { k: "caravan", n: 8, on: "dune", sep: 3500, cls: 0 },
      { k: "obelisks", n: 4, on: "open", sep: 6000, cls: 0 },
      { k: "glider", n: 3, on: "dune", sep: 7000, cls: 0 },
      { k: "oasis", n: 6, on: "open", sep: 5000, cls: 7 }],
    area: { open: "Sand Plains", dune: "Great Erg", rock: "Mine Hills", flat: "Hard Pan" },
    cl: ["Sand Plains", "Herders' Fields", "Outskirts", "Mud-Brick Quarter", "Market Quarter", "Mine Works", "Mine Hills", "Oasis"],
    ring: "Caravan Circuit", sky: { tint: "rgba(255,190,90,0.05)" } },

  persephone: { name: "Persephone", style: "organic", icon: "🤠", group: "Verse-Rim", theme: "frontier", roster: "alliance", road: "#9a7c56", road2: "#a48660",
    sub: "A Rim world of dusty grassland and rocky hills · the crowded Eavesdown Docks with parked transports · main-street frontier towns · cattle ranches.",
    fields: { rock: { sc: 3000, k: 321, lo: 0.62, hi: 0.69 }, forest: { sc: 2600, k: 322, lo: 0.6, hi: 0.68 }, flat: { sc: 3000, k: 323, lo: 0.56, hi: 0.64 }, field: { sc: 1800, k: 324, lo: 0.58, hi: 0.62 } },
    ground: { base: ["grass", "#8e8c4c"], layers: [
      { f: "flat", pat: "dirt", col: "#9a7c56", a: 0.8 },
      { f: "forest", pat: "woods", col: "#5e6a38", a: 1 },
      { f: "rock", pat: "rock", col: "#8a7258", a: 1, lo: 0.18, hi: 0.42 }], town: ["dirt", "#8e6e4c"] },
    rocks: { col: ["#7e6a52", "#94806a", "#6a5844"], mesa: false, boulders: 1 },
    trees: { kind: "scrub", dens: 0.55 },
    towns: { major: { n: 1, r: [1150, 1350] }, town: { n: 5, r: [450, 700] }, village: { n: 9, r: [200, 320] }, style: "linear", vstyle: "linear",
      names: ["Eavesdown", "Whitefall", "Paquin", "Three Hills", "Jiangyin Flats", "Ezra", "Beylix Ford", "Boros Gulch", "Triumph", "Harrow's Crossing", "Badger's Rest", "St. Albans", "Greenleaf", "Lilac"],
      streets: ["Dock Row", "Main Street", "Mule Lane", "Tong Street", "Harrow Way", "Cattle Rd", "Saloon Row", "Mill Street", "Market Lane"] },
    bld: { round: 0, mat: "wood", roof: "gable", bays: 3, bayShips: ["firefly", "transport", "transport"], bayName: "DOCK",
      core: [["commercial:bar", 3], ["commercial:store", 3], ["commercial:diner", 2], ["commercial:hardware", 1], ["commercial:gasstore", 1], ["commercial:pharmacy", 1], ["warehouse", 3], ["motel", 1], ["rgbox", 2]],
      mid: [["rgbox", 6], ["cabin", 2], ["commercial:shop", 1], ["church", 0.4]], edge: [["cabin", 5], ["rgbox", 3], ["barn", 1], ["shed", 1]] },
    sites: [
      { k: "ranch", n: 34, on: "open", sep: 1500, road: 1, cls: 1 },
      { k: "estate", n: 1, on: "open", sep: 6000, road: 1, cls: 1 },
      { k: "wreck", n: 4, on: "open", sep: 6000, cls: 0 },
      { k: "outlaw", n: 9, on: "rock", sep: 3000, cls: 6 }],
    area: { open: "Grassland", forest: "Scrub Woods", rock: "Rock Hills", flat: "Dust Flats" },
    cl: ["Grassland", "Ranch Country", "Outskirts", "Main Street", "Eavesdown Docks", "Dock Warehouses", "Rock Hills", "Creek"],
    ring: "Rim Road" },

  arrakis: { name: "Arrakis", style: "organic", icon: "🪱", group: "Spice-Dune", theme: "desert", roster: "harkonnen", natives: "fremen_raid",
    sub: "Dune: the deep desert and the Shield Wall · walled Arrakeen and its landing field · sietches hidden in the rock · spice harvesters, thumpers and worm sign.",
    fields: { rock: { sc: 4200, k: 331, lo: 0.6, hi: 0.67 }, dune: { sc: 3000, k: 332, lo: 0.44, hi: 0.55 }, flat: { sc: 2600, k: 333, lo: 0.65, hi: 0.71 }, spice: { sc: 1400, k: 334, lo: 0.66, hi: 0.72 } },
    ground: { base: ["sand", "#d09a5c"], layers: [
      { f: "dune", pat: "dune", col: "#d8a060", a: 1 },
      { f: "flat", pat: "packed", col: "#d8b48a", a: 0.85 },
      { f: "spice", pat: "spice", col: "#d47a3a", a: 0.9 },
      { f: "rock", pat: "rock", col: "#9a6a44", a: 1, lo: 0.18, hi: 0.42 }], town: ["packed", "#c09060"] },
    rocks: { col: ["#8e6040", "#a87450", "#7a5236"], mesa: true, boulders: 1 },
    towns: { major: { n: 1, r: [1200, 1400] }, town: { n: 2, r: [650, 850] }, village: { n: 5, r: [220, 340] }, style: "walled", vstyle: "cluster",
      names: ["Arrakeen", "Carthag", "Tuono Village", "Pyons' Rest", "Old Gap", "Habbanya Ridge", "Red Wall Post", "Tsimpo"],
      streets: ["Residency Way", "Landing Field Rd", "Water Sellers' Row", "Spice Row", "Guild Street", "Atreides Way", "Shield Wall Rd", "Kanly Street"] },
    bld: { round: 0.05, mat: "masonry", roof: "flat", wall: 1, bays: 2, bayShips: ["thopter", "thopter", "carryall"], bayName: "LANDING PAD",
      core: [["commercial:store", 2], ["commercial:bar", 1], ["commercial:gasstore", 2], ["commercial:office", 2], ["warehouse", 3], ["civic:police", 0.6], ["rgbox", 4]],
      mid: [["rgbox", 8], ["commercial:shop", 1], ["warehouse", 1]], edge: [["rgbox", 6], ["shed", 1]] },
    sites: [
      { k: "sietch", n: 7, on: "rockcore", sep: 5000, cls: 6 },
      { k: "harvester", n: 7, on: "spice", sep: 4000, cls: 5 },
      { k: "windtrap", n: 6, on: "open", sep: 4000, road: 1, cls: 1 },
      { k: "wormsign", n: 5, on: "dune", sep: 7000, cls: 0 },
      { k: "testing", n: 3, on: "rock", sep: 7000, road: 1, cls: 5 },
      { k: "thopterpad", n: 3, on: "open", sep: 6000, road: 1, cls: 5 }],
    area: { open: "Desert Basin", dune: "Deep Desert", rock: "Shield Wall", flat: "Salt Pan", spice: "Spice Field" },
    cl: ["Desert Basin", "Pan & Graben", "Outskirts", "Old Quarter", "Residency District", "Landing Field", "Shield Wall", "Water Basin"],
    ring: "Imperial Basin Road", sky: { tint: "rgba(255,140,40,0.08)" } },

  lv426: { name: "LV-426", style: "organic", icon: "👽", group: "Xeno-Hive", theme: "colony", roster: "xenomorph",
    sub: "Acheron: black volcanic rock under a howling storm · Hadley's Hope's prefab modules · the atmosphere processor · the derelict ship out in the dark.",
    fields: { rock: { sc: 2400, k: 341, lo: 0.56, hi: 0.64 }, flat: { sc: 3000, k: 342, lo: 0.6, hi: 0.66 }, ash: { sc: 2000, k: 343, lo: 0.55, hi: 0.62 } },
    ground: { base: ["ash", "#4c4844"], layers: [
      { f: "ash", pat: "ash", col: "#3e3a38", a: 1 },
      { f: "flat", pat: "packed", col: "#5a5550", a: 0.8 },
      { f: "rock", pat: "rock", col: "#34302e", a: 1, lo: 0.18, hi: 0.42 }], town: ["hazplate", "#4a4e52"] },
    rocks: { col: ["#2e2a28", "#3a3532", "#262220"], mesa: true, boulders: 2 },
    towns: { major: { n: 1, r: [800, 950] }, town: { n: 1, r: [380, 480] }, village: { n: 4, r: [150, 240] }, style: "grid", vstyle: "grid",
      names: ["Hadley's Hope", "Ridge Station", "Survey Post 3", "Relay Camp", "Mining Camp 7", "Outpost Charlie"],
      streets: ["Corridor A", "Corridor B", "Corridor C", "Ops Row", "Med Lane", "Hydro Way", "Garage Row", "Processor Rd"] },
    bld: { round: 0, mat: "metal", roof: "flat",
      core: [["civic:clinic", 1], ["civic:police", 1], ["commercial:office", 2], ["commercial:diner", 1], ["warehouse", 3], ["rgbox", 4]],
      mid: [["rgbox", 6], ["warehouse", 2], ["commercial:hardware", 1]], edge: [["rgbox", 3], ["shed", 2], ["warehouse", 1]] },
    sites: [
      { k: "processor", n: 1, on: "open", sep: 9000, road: 1, cls: 5, near: 1 },
      { k: "derelict", n: 1, on: "rock", sep: 9000, cls: 6, far: 12000 },
      { k: "dropship", n: 2, on: "open", sep: 6000, cls: 0 },
      { k: "relay", n: 6, on: "rock", sep: 4000, road: 1, cls: 5 },
      { k: "hive", n: 5, on: "rockcore", sep: 5000, cls: 6 },
      { k: "crawler", n: 4, on: "open", sep: 4000, cls: 0 }],
    area: { open: "Ash Plain", rock: "Basalt Ridges", flat: "Lava Pan", ash: "Ash Drifts" },
    cl: ["Ash Plain", "Survey Fields", "Colony Edge", "Colony Blocks", "Operations", "Processor Works", "Basalt Ridges", "Sump"],
    ring: "Perimeter Haul Road", sky: { tint: "rgba(60,90,120,0.12)" } },

  kiearth: { name: "Ki-Surge Earth", style: "organic", icon: "🐉", group: "Ki-Surge", theme: "capsule", roster: "frieza_force",
    sub: "Bright green hills, lakes and tall rock spires · West City's capsule domes · Kame House on its island · a tournament stage · dome houses in the mountain woods.",
    fields: { rock: { sc: 2600, k: 351, lo: 0.63, hi: 0.69 }, forest: { sc: 2200, k: 352, lo: 0.56, hi: 0.64 }, field: { sc: 1600, k: 353, lo: 0.6, hi: 0.64 }, flat: { sc: 3000, k: 354, lo: 0.66, hi: 0.72 } },
    ground: { base: ["grass", "#5fa048"], layers: [
      { f: "flat", pat: "grass", col: "#7ab45a", a: 0.7 },
      { f: "forest", pat: "woods", col: "#3e7a34", a: 1 },
      { f: "rock", pat: "rock", col: "#9a8a70", a: 1, lo: 0.18, hi: 0.42 }], town: ["plaza", "#d8d4c8"] },
    rocks: { col: ["#a8987a", "#bcac8c", "#8e7e64"], mesa: true, spires: 1, boulders: 1 },
    trees: { kind: "oak", dens: 0.8 },
    towns: { major: { n: 1, r: [1500, 1700] }, town: { n: 3, r: [550, 800] }, village: { n: 8, r: [200, 320] }, style: "grid", vstyle: "cluster",
      names: ["West City", "Orange Star City", "Ginger Town", "Pepper Town", "Jingle Village", "Aru Village", "Parsley City", "Satan City", "North City", "Penguin Village", "East District 439", "Fire Mountain"],
      streets: ["Capsule Ave", "Brief Blvd", "Kame Way", "Dragon St", "Turtle Lane", "Nimbus Rd", "Senzu St", "Lookout Ave", "Shenron Way"] },
    bld: { round: 0.55, mat: "masonry", roof: "flat",
      core: [["commercial:office", 2], ["commercial:store", 3], ["commercial:diner", 2], ["commercial:cafe", 1], ["commercial:gasstore", 1], ["civic:police", 0.5], ["civic:clinic", 0.5], ["dome", 6]],
      mid: [["dome", 7], ["house", 3], ["commercial:shop", 1]], edge: [["dome", 5], ["house", 2], ["shed", 1]] },
    sites: [
      { k: "kamehouse", n: 1, on: "open", sep: 9000, cls: 7, far: 6000 },
      { k: "gokuhouse", n: 1, on: "forest", sep: 9000, road: 1, cls: 1, far: 6000 },
      { k: "tournament", n: 1, on: "open", sep: 9000, road: 1, cls: 5, near: 1 },
      { k: "lake", n: 10, on: "open", sep: 4000, cls: 7 },
      { k: "ribbon", n: 4, on: "rock", sep: 6000, road: 1, cls: 5 },
      { k: "farmhouse", n: 18, on: "open", sep: 1800, road: 1, cls: 1 },
      { k: "crater", n: 4, on: "open", sep: 7000, cls: 0 }],
    area: { open: "Green Hills", forest: "Mountain Woods", rock: "Rock Spires", flat: "Meadows", field: "Farmland" },
    cl: ["Green Hills", "Farmsteads", "Garden Suburbs", "City Blocks", "Capsule Downtown", "Factory Row", "Rock Spires", "Lakeside"],
    ring: "Grand Circuit Highway" },

  blackmesa: { name: "Black Mesa", style: "organic", icon: "☢️", group: "Anomaly-Lab", theme: "mesa", roster: "combine",
    sub: "New Mexico desert of red mesas and arroyos · the sprawling Black Mesa Research Facility with its tram line · the Lambda complex · motels and gas stops.",
    fields: { rock: { sc: 3000, k: 361, lo: 0.6, hi: 0.67 }, flat: { sc: 2400, k: 362, lo: 0.6, hi: 0.66 }, scrubf: { sc: 1800, k: 363, lo: 0.55, hi: 0.62 } },
    ground: { base: ["dirt", "#b88a5c"], layers: [
      { f: "flat", pat: "packed", col: "#c8a27a", a: 0.8 },
      { f: "scrubf", pat: "grass", col: "#9a8a58", a: 0.55 },
      { f: "rock", pat: "rock", col: "#a85e3c", a: 1, lo: 0.18, hi: 0.42 }], town: ["asphalt", "#55524c"] },
    rocks: { col: ["#a4583a", "#b86a48", "#8e4a30"], mesa: true, boulders: 1 },
    scrub: { n: 7, col: "#7a7a48" },
    towns: { major: { n: 0, r: [0, 0] }, town: { n: 4, r: [450, 650] }, village: { n: 8, r: [180, 300] }, style: "grid", vstyle: "linear",
      names: ["Santego", "Mesa Verde", "Rio Lobo", "Socorro Wells", "Coyote Flats", "Dry Creek", "Los Alamos Rd", "Red Rock", "Gallup Junction", "Tumbleweed"],
      streets: ["Route 66", "Mesa Dr", "Sector Rd", "Main St", "Arroyo Way", "Canyon Rd", "Rail Ave", "Mission St"] },
    bld: { round: 0, mat: "masonry", roof: "flat",
      core: [["commercial:diner", 2], ["commercial:gasstore", 2], ["commercial:store", 2], ["motel", 1.5], ["commercial:bar", 1], ["civic:police", 0.5], ["house", 3]],
      mid: [["house", 6], ["rgbox", 2], ["commercial:shop", 1]], edge: [["house", 3], ["rgbox", 2], ["shed", 1]] },
    sites: [
      { k: "facility", n: 1, on: "open", sep: 9000, road: 1, cls: 5, near: 1 },
      { k: "lambda", n: 1, on: "rock", sep: 6000, road: 1, cls: 5 },
      { k: "radar", n: 3, on: "rock", sep: 6000, road: 1, cls: 5 },
      { k: "xen", n: 6, on: "open", sep: 4000, cls: 6 },
      { k: "osprey", n: 3, on: "open", sep: 6000, cls: 0 },
      { k: "ranchmesa", n: 14, on: "open", sep: 2000, road: 1, cls: 1 }],
    area: { open: "High Desert", rock: "Red Mesas", flat: "Dry Lake", scrubf: "Sagebrush" },
    cl: ["High Desert", "Ranch Land", "Edge of Town", "Town", "Main Street", "Facility Grounds", "Red Mesas", "Reservoir"],
    ring: "State Route Loop" },

  continent: { name: "The Continent", style: "organic", icon: "⚔️", group: "Eldritch-Ash", theme: "medieval", roster: "witcher_foes", road: "#8a7a62", road2: "#94846c",
    sub: "Velen and Temeria: rolling fields, dark woods and bogs · walled cities and thatched villages · keeps on the hills · windmills, inns and monster nests.",
    fields: { forest: { sc: 2400, k: 371, lo: 0.52, hi: 0.6 }, rock: { sc: 3400, k: 372, lo: 0.66, hi: 0.72 }, wet: { sc: 2600, k: 373, lo: 0.64, hi: 0.7 }, field: { sc: 1400, k: 374, lo: 0.5, hi: 0.54 } },
    ground: { base: ["grass", "#5f8442"], layers: [
      { f: "field", pat: "cropH", col: "#9a9a48", a: 0.8 },
      { f: "forest", pat: "woods", col: "#3a5a2a", a: 1 },
      { f: "wet", pat: "bog", col: "#4a5a3a", a: 1 },
      { f: "rock", pat: "rock", col: "#8a8478", a: 1, lo: 0.18, hi: 0.42 }], town: ["cobble", "#8a7a64"] },
    rocks: { col: ["#7e786c", "#928c80", "#6a645a"], mesa: false, boulders: 1 },
    trees: { kind: "oak", dens: 1.0 },
    towns: { major: { n: 1, r: [1150, 1350] }, town: { n: 4, r: [420, 620] }, village: { n: 12, r: [180, 300] }, style: "walled", vstyle: "cluster",
      names: ["Novigrad", "Oxenfurt", "Vizima", "Crow's Perch", "Blackbough", "Midcopse", "Benek", "Lindenvale", "Heatherton", "Orofena", "Downwarren", "Hanged Man's Tree", "Byways", "Toderas", "Sarrasin", "Mulbrydale"],
      streets: ["Hierarch Square", "Temple Isle Rd", "Silverton Way", "Gildorf St", "Bits Lane", "Market Row", "Cutthroat Alley", "Miller's Lane", "Cooper St"] },
    bld: { round: 0.04, mat: "wood", roof: "gable", wall: 1,
      core: [["commercial:bar", 3], ["commercial:store", 2], ["commercial:hardware", 1], ["commercial:shop", 2], ["church", 1], ["commercial:pharmacy", 1], ["rgbox", 4], ["warehouse", 1]],
      mid: [["rgbox", 7], ["cabin", 2], ["commercial:shop", 1]], edge: [["cabin", 5], ["rgbox", 2], ["barn", 2], ["shed", 1]] },
    sites: [
      { k: "keep", n: 3, on: "rock", sep: 8000, road: 1, cls: 5 },
      { k: "windmill", n: 10, on: "field", sep: 3000, road: 1, cls: 1 },
      { k: "bog", n: 3, on: "wet", sep: 7000, cls: 7 },
      { k: "nest", n: 10, on: "forest", sep: 3000, cls: 6 },
      { k: "inn", n: 6, on: "open", sep: 5000, road: 1, cls: 1 },
      { k: "ruin", n: 5, on: "forest", sep: 5000, cls: 6 },
      { k: "farm", n: 24, on: "field", sep: 1500, road: 1, cls: 1 },
      { k: "lake", n: 5, on: "open", sep: 6000, cls: 7 }],
    area: { open: "Meadows", forest: "Wildwoods", rock: "Crags", wet: "Bogs", field: "Fields" },
    cl: ["Meadows", "Farmsteads", "Outskirts", "Old Town", "Market Square", "Docks & Mills", "Wildwoods", "Lakeshore"],
    ring: "Old Imperial Road" },

  highlands: { name: "The Highlands", style: "organic", icon: "🏰", group: "Arcane-Sanctum", theme: "wizard", roster: "death_eaters", road: "#7e776c", road2: "#888174",
    sub: "Scottish highlands of heather moor, lochs and dark forest · the castle on the Black Lake · Hogsmeade village and its station · Hagrid's hut, the pitch and the Willow.",
    fields: { rock: { sc: 3000, k: 381, lo: 0.6, hi: 0.67 }, forest: { sc: 2600, k: 382, lo: 0.55, hi: 0.62 }, heath: { sc: 2000, k: 383, lo: 0.5, hi: 0.58 }, wet: { sc: 3000, k: 384, lo: 0.66, hi: 0.71 } },
    ground: { base: ["grass", "#587c40"], layers: [
      { f: "heath", pat: "heather", col: "#6e5a6a", a: 0.9 },
      { f: "forest", pat: "woods", col: "#2e4a26", a: 1 },
      { f: "wet", pat: "bog", col: "#3e5236", a: 1 },
      { f: "rock", pat: "rock", col: "#7a7470", a: 1, lo: 0.18, hi: 0.42 }], town: ["cobble", "#7a7468"] },
    rocks: { col: ["#6e6a64", "#848078", "#5a5650"], mesa: false, boulders: 2 },
    trees: { kind: "oak", dens: 1.0, dark: 1 },
    towns: { major: { n: 0, r: [0, 0] }, town: { n: 3, r: [380, 560] }, village: { n: 9, r: [170, 280] }, style: "cluster", vstyle: "cluster",
      names: ["Hogsmeade", "Glen Ardoch", "Kinlochmore", "Ballachulish", "Auchterlochy", "Strathfillan", "Dunmhor", "Inverarnan", "Craigmore", "Lochcarron", "Bridge of Orchy"],
      streets: ["High Street", "Station Rd", "Broom Lane", "Owl Way", "Kirk Brae", "Loch Rd", "Mill Wynd", "Heather Row"] },
    bld: { round: 0.06, mat: "masonry", roof: "gable",
      core: [["commercial:bar", 2], ["commercial:store", 2], ["commercial:cafe", 1], ["commercial:shop", 3], ["commercial:post", 1], ["commercial:hardware", 1], ["rgbox", 3]],
      mid: [["rgbox", 6], ["cabin", 3], ["commercial:shop", 1]], edge: [["cabin", 5], ["rgbox", 2], ["shed", 1]] },
    sites: [
      { k: "castle", n: 1, on: "open", sep: 9000, road: 1, cls: 5, near: 1 },
      { k: "hagrid", n: 1, on: "forest", sep: 6000, cls: 1, nearSite: "castle" },
      { k: "pitch", n: 1, on: "open", sep: 6000, road: 1, cls: 5, nearSite: "castle" },
      { k: "willow", n: 1, on: "open", sep: 4000, cls: 1, nearSite: "castle" },
      { k: "loch", n: 6, on: "open", sep: 6000, cls: 7 },
      { k: "croft", n: 18, on: "open", sep: 1800, road: 1, cls: 1 },
      { k: "standing", n: 5, on: "open", sep: 6000, cls: 0 },
      { k: "lair", n: 6, on: "forest", sep: 5000, cls: 6 }],
    area: { open: "Moorland", forest: "Forbidden Forest", rock: "Crags", wet: "Peat Bog", heath: "Heather Moor" },
    cl: ["Moorland", "Crofts", "Village Edge", "Village", "High Street", "Station & Mill", "Forbidden Forest", "Lochside"],
    ring: "Highland Road", sky: { tint: "rgba(90,110,140,0.06)" } }
};
// group (faction id) → homeworld, as approved
const RG_GROUP_HOME = { 0: "tatooine", 1: "abydos", 2: "persephone", 3: "arrakis", 4: "sfearth", 5: "lv426", 6: "kiearth", 7: "nightcity", 8: "blackmesa", 9: "continent", 10: "highlands" };
const RG_WORLD_ORDER = ["tatooine", "abydos", "persephone", "arrakis", "sfearth", "lv426", "kiearth", "nightcity", "blackmesa", "continent", "highlands", "midwest"];

/* --- 2. FIELDS & CLASSES ------------------------------------------------------------ */
function rgF(name, xm, ym) {
  const P = RG.P, f = P && P.fields && P.fields[name];
  if (!f) return 0;
  const v = cFbm(xm / f.sc, ym / f.sc, f.k) + 0.07 * (cNoise(xm / (f.sc * 0.09), ym / (f.sc * 0.09), f.k + 7) - 0.5);
  return rgSm(f.lo, f.hi, v);
}
function rgTownAt(xm, ym, slack) {
  let best = null, bt = slack || 1.0;
  for (const t of RG.towns) { const d = Math.hypot(t.x - xm, t.y - ym) / t.r; if (d < bt) { bt = d; best = t; } }
  return best;
}
function rgAreaName(mx, my) {
  const P = RG.P, xm = mx * 1000 + 500, ym = my * 1000 + 500, A = P.area || {};
  let best = "open", bv = 0.35;
  for (const k of Object.keys(P.fields || {})) { if (!A[k]) continue; const v = rgF(k, xm, ym); if (v > bv) { bv = v; best = k; } }
  return A[best] || A.open || "Open Country";
}

/* --- 3. PATHS ----------------------------------------------------------------------- */
// a curvy polyline from a to b: straight line + smooth sideways wander that fades out at both ends
function rgPath(ax, ay, bx, by, k, ampK, step) {
  const d = Math.hypot(bx - ax, by - ay) || 1, n = Math.max(2, Math.ceil(d / (step || 140))), nx = -(by - ay) / d, ny = (bx - ax) / d;
  const amp = Math.min(1100, d * (ampK === undefined ? 0.1 : ampK)), pts = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n, env = Math.pow(Math.sin(Math.PI * t), 0.7);
    const o = amp * env * ((cNoise(t * d / 2300, k * 0.371, 911) - 0.5) * 2 + 0.3 * (cNoise(t * d / 520, k * 0.371 + 5.3, 913) - 0.5) * 2);
    pts.push([ax + (bx - ax) * t + nx * o, ay + (by - ay) * t + ny * o]);
  }
  return pts;
}
function rgCircle(cx, cy, r, k, wob, step) {
  const n = Math.max(12, Math.ceil(2 * Math.PI * r / (step || 30))), pts = [];
  for (let i = 0; i <= n; i++) { const a = i / n * Math.PI * 2, rr = r * (1 + (wob || 0) * (cNoise(Math.cos(a) * 1.7 + k, Math.sin(a) * 1.7, 919) - 0.5) * 2); pts.push([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr]); }
  pts[n] = pts[0].slice();
  return pts;
}
function rgAddRoad(kind, w, pts, name, town, extra) {
  const rd = Object.assign({ id: RG.roads.length, kind, w, pts, name: name || "", town: town === undefined ? -1 : town }, extra || {});
  RG.roads.push(rd);
  return rd;
}
function rgIndexRoads() {
  RG.segIdx = new Map();
  let sk = 0;
  for (const rd of RG.roads) {
    for (let i = 0; i < rd.pts.length - 1; i++) {
      const [ax, ay] = rd.pts[i], [bx, by] = rd.pts[i + 1], pad = rd.w / 2 + 4;
      const s = { ax, ay, bx, by, w: rd.w, r: rd, k: sk++ };
      const mx0 = Math.max(0, Math.floor((Math.min(ax, bx) - pad) / 1000)), mx1 = Math.min(63, Math.floor((Math.max(ax, bx) + pad) / 1000));
      const my0 = Math.max(0, Math.floor((Math.min(ay, by) - pad) / 1000)), my1 = Math.min(63, Math.floor((Math.max(ay, by) + pad) / 1000));
      for (let my = my0; my <= my1; my++) for (let mx = mx0; mx <= mx1; mx++) { const key = rgCK(mx, my); let L = RG.segIdx.get(key); if (!L) RG.segIdx.set(key, L = []); L.push(s); }
    }
  }
}
function rgSegsIn(mx, my) { return RG.segIdx.get(rgCK(mx, my)) || []; }
function rgSegDist(px, py, s) {
  const dx = s.bx - s.ax, dy = s.by - s.ay, L2 = dx * dx + dy * dy || 1;
  const t = rgClamp(((px - s.ax) * dx + (py - s.ay) * dy) / L2, 0, 1);
  return Math.hypot(px - (s.ax + dx * t), py - (s.ay + dy * t));
}
// nearest road (any kind) to a point, searching the 3×3 cells around it
function rgNearestRoad(xm, ym, maxD) {
  const mx = Math.floor(xm / 1000), my = Math.floor(ym / 1000);
  let best = null, bd = maxD || 1e9;
  for (let y = my - 1; y <= my + 1; y++) for (let x = mx - 1; x <= mx + 1; x++) {
    if (x < 0 || y < 0 || x > 63 || y > 63) continue;
    for (const s of rgSegsIn(x, y)) { const d = rgSegDist(xm, ym, s) - s.w / 2; if (d < bd) { bd = d; best = s; } }
  }
  return best ? { s: best, d: bd } : null;
}
// nearest point on a set of roads (for spurs)
function rgClosestOnRoads(xm, ym, roads) {
  let best = null, bd = 1e12;
  for (const rd of roads) for (let i = 0; i < rd.pts.length - 1; i++) {
    const s = { ax: rd.pts[i][0], ay: rd.pts[i][1], bx: rd.pts[i + 1][0], by: rd.pts[i + 1][1] };
    const dx = s.bx - s.ax, dy = s.by - s.ay, L2 = dx * dx + dy * dy || 1, t = rgClamp(((xm - s.ax) * dx + (ym - s.ay) * dy) / L2, 0, 1);
    const px = s.ax + dx * t, py = s.ay + dy * t, d = Math.hypot(xm - px, ym - py);
    if (d < bd) { bd = d; best = [px, py, rd]; }
  }
  return best ? { x: best[0], y: best[1], rd: best[2], d: bd } : null;
}

/* --- 4. ORGANIC MACRO PLAN ------------------------------------------------------------ */
function rgOrgInit(P, seed) {
  const t0 = typeof performance !== "undefined" ? performance.now() : 0;
  CITY.seed = seed >>> 0;
  CITY.blockCache = new Map(); CITY.lineCache = new Map(); CITY.cellCache = new Map(); CITY.interiorCount = 0;
  RG.roads = []; RG.sites = []; RG.siteCell = new Map(); RG.rings = []; RG.airports = []; RG.airCell = new Map();
  const R = cRng(cH(seed, 4242, 17, 99));
  const T = P.towns, towns = [];
  const okTown = (x, y, r) => rgF("rock", x, y) < 0.12 && rgF("wet", x, y) < 0.15 && rgF("rock", x + r * 0.6, y) < 0.3 && rgF("rock", x - r * 0.6, y) < 0.3 && rgF("rock", x, y + r * 0.6) < 0.3 && rgF("rock", x, y - r * 0.6) < 0.3
    && towns.every(t => Math.hypot(t.x - x, t.y - y) > (t.r + r) * 1.1 + (t.kind === 2 && r < 400 ? 2600 : 4200));
  const place = (n, ra, kind, centre) => {
    let tries = 0;
    while (n > 0 && tries++ < 6000) {
      const r = cRange(R, ra[0], ra[1]), m = 2600 + r;
      const x = centre ? 32000 + cRange(R, -7000, 7000) : cRange(R, m, 64000 - m), y = centre ? 32000 + cRange(R, -7000, 7000) : cRange(R, m, 64000 - m);
      if (okTown(x, y, r) || (centre && tries > 3000)) { towns.push({ x, y, r, kind }); n--; }
    }
  };
  if (T.major && T.major.n) place(T.major.n, T.major.r, 0, true);
  if (T.town && T.town.n) place(T.town.n, T.town.r, 1, !towns.length);
  if (T.village && T.village.n) place(T.village.n, T.village.r, 2, false);
  towns.forEach((t, i) => { t.idx = i; t.h = cH(seed, 77, i, 9); t.name = T.names[i % T.names.length] + (i >= T.names.length ? " " + (Math.floor(i / T.names.length) + 1) : ""); t.style = t.kind === 2 ? (T.vstyle || T.style) : T.style; t.rot = cF(cH(seed, i, 5, 5)) * Math.PI; });
  RG.towns = towns; CITY.cities = towns; CITY.capital = 0; CITY.hwX = []; CITY.hwY = []; CITY.hwNameX = []; CITY.hwNameY = []; CITY.civic = new Map();

  // --- sites (one per km cell, fully inside it)
  const used = new Set();
  const siteOk = (def, xm, ym, rad, relax) => {
    const rock = rgF("rock", xm, ym), dune = rgF("dune", xm, ym);
    if (!relax) switch (def.on) {
      case "open": if (rock > 0.06 || rgF("rock", xm + rad, ym) > 0.2 || rgF("rock", xm - rad, ym) > 0.2 || rgF("wet", xm, ym) > 0.2) return false; break;
      case "dune": if (dune < 0.5 || rock > 0.05) return false; break;
      case "rock": if (rock < 0.22 || rock > 0.8) return false; break;
      case "rockcore": if (rock < 0.85) return false; break;
      case "forest": if (rgF("forest", xm, ym) < 0.55 || rock > 0.2) return false; break;
      case "field": if (rgF("field", xm, ym) < 0.5 || rgF("forest", xm, ym) > 0.3 || rock > 0.1) return false; break;
      case "wet": if (rgF("wet", xm, ym) < 0.6) return false; break;
      case "spice": if (rgF("spice", xm, ym) < 0.5 || rock > 0.05) return false; break;
      default: break;
    }
    let dTown = 1e9;
    for (const t of towns) dTown = Math.min(dTown, Math.hypot(t.x - xm, t.y - ym) - t.r);
    if (dTown < rad + 450) return false;
    if (def.far && dTown < def.far) return false;
    if (def.near && dTown > 5000) return false;
    if (def.nearSite) { const s0 = RG.sites.find(s => s.k === def.nearSite); if (s0 && Math.hypot(s0.x - xm, s0.y - ym) > 2600) return false; }
    for (const s of RG.sites) if (Math.hypot(s.x - xm, s.y - ym) < Math.max(s.k === def.k ? def.sep : 900, s.rad + rad + 200)) return false;
    return true;
  };
  for (const def of (P.sites || [])) {
    const rad = Math.min(440, ((typeof RG_SITE_RAD !== "undefined" && RG_SITE_RAD[def.k]) || 200));
    let n = def.n, tries = 0;
    while (n > 0 && tries++ < 9000) {
      let mx, my;
      if (def.nearSite) { const s0 = RG.sites.find(s => s.k === def.nearSite); if (!s0) break; mx = rgClamp(s0.mx + cInt(R, -2, 2), 1, 62); my = rgClamp(s0.my + cInt(R, -2, 2), 1, 62); }
      else if (def.near && towns.length) { const t = towns[0]; mx = rgClamp(Math.floor((t.x + cRange(R, -5200, 5200)) / 1000), 1, 62); my = rgClamp(Math.floor((t.y + cRange(R, -5200, 5200)) / 1000), 1, 62); }
      else { mx = cInt(R, 1, 62); my = cInt(R, 1, 62); }
      if (used.has(rgCK(mx, my))) continue;
      const xm = mx * 1000 + cRange(R, rad + 40, 1000 - rad - 40), ym = my * 1000 + cRange(R, rad + 40, 1000 - rad - 40);
      if (!siteOk(def, xm, ym, rad, tries > 6000)) continue;
      const s = { k: def.k, x: xm, y: ym, mx, my, rad, cls: def.cls === undefined ? 0 : def.cls, road: !!def.road, seed: cH(seed, RG.sites.length, 61, 7), idx: RG.sites.length };
      s.name = (typeof RG_SITE_NAME !== "undefined" && RG_SITE_NAME[def.k] && RG_SITE_NAME[def.k](s, R)) || "";
      RG.sites.push(s); RG.siteCell.set(rgCK(mx, my), s); used.add(rgCK(mx, my)); n--;
    }
  }

  // --- tracks: spanning tree over the towns + loops where the detour is long
  const N = towns.length, inT = new Uint8Array(N), edges = [];
  if (N) {
    inT[0] = 1;
    for (let c = 1; c < N; c++) {
      let bi = -1, bj = -1, bd = 1e12;
      for (let i = 0; i < N; i++) if (inT[i]) for (let j = 0; j < N; j++) if (!inT[j]) { const d = Math.hypot(towns[i].x - towns[j].x, towns[i].y - towns[j].y); if (d < bd) { bd = d; bi = i; bj = j; } }
      if (bj < 0) break; inT[bj] = 1; edges.push([bi, bj]);
    }
    const adj = () => { const A = towns.map(() => []); for (const [a, b] of edges) { const d = Math.hypot(towns[a].x - towns[b].x, towns[a].y - towns[b].y); A[a].push([b, d]); A[b].push([a, d]); } return A; };
    const gdist = (A, s, t) => { const D = new Float64Array(N).fill(1e12), done = new Uint8Array(N); D[s] = 0; for (let k = 0; k < N; k++) { let u = -1, ud = 1e12; for (let i = 0; i < N; i++) if (!done[i] && D[i] < ud) { ud = D[i]; u = i; } if (u < 0 || u === t) break; done[u] = 1; for (const [v, w] of A[u]) if (D[u] + w < D[v]) D[v] = D[u] + w; } return D[t]; };
    const pairs = [];
    for (let i = 0; i < N; i++) for (let j = i + 1; j < N; j++) { const d = Math.hypot(towns[i].x - towns[j].x, towns[i].y - towns[j].y); if (d < 16000) pairs.push([d, i, j]); }
    pairs.sort((a, b) => a[0] - b[0]);
    for (const [d, i, j] of pairs) { if (edges.some(e => (e[0] === i && e[1] === j) || (e[0] === j && e[1] === i))) continue; if (gdist(adj(), i, j) > d * 1.55) edges.push([i, j]); }
  }
  const tw = (a, b) => (a.kind === 0 || b.kind === 0) ? 11 : (a.kind === 1 && b.kind === 1) ? 10 : 8;
  edges.forEach(([i, j], ei) => {
    const a = towns[i], b = towns[j];
    rgAddRoad("main", tw(a, b), rgPath(a.x, a.y, b.x, b.y, 100 + ei, 0.11, 150), a.name + " – " + b.name + " Track", -1, { a: i, b: j });
  });
  // the ring road round the map edge (rounded rectangle)
  {
    const I = RG_INSET, rc = 900, pts = [], L = 64000 - 2 * I;
    const corner = (cx, cy, a0) => { for (let k = 0; k <= 8; k++) { const a = a0 + k / 8 * Math.PI / 2; pts.push([cx + Math.cos(a) * rc, cy + Math.sin(a) * rc]); } };
    const edge = (x0, y0, x1, y1) => { const n = Math.ceil(Math.hypot(x1 - x0, y1 - y0) / 220); for (let k = 1; k < n; k++) { const t = k / n; pts.push([x0 + (x1 - x0) * t, y0 + (y1 - y0) * t]); } };
    corner(I + rc, I + rc, Math.PI); edge(I + rc, I, I + L - rc, I);
    corner(I + L - rc, I + rc, -Math.PI / 2); edge(I + L, I + rc, I + L, I + L - rc);
    corner(I + L - rc, I + L - rc, 0); edge(I + L - rc, I + L, I + rc, I + L);
    corner(I + rc, I + L - rc, Math.PI / 2); edge(I, I + L - rc, I, I + rc);
    pts.push(pts[0].slice());
    rgAddRoad("ring", 12, pts, P.ring || "Ring Road", -1);
  }
  // connectors from the towns nearest each edge out to the ring road
  const ringRoad = RG.roads[RG.roads.length - 1];
  [["W", t => t.x], ["E", t => 64000 - t.x], ["N", t => t.y], ["S", t => 64000 - t.y]].forEach(([side, dist], si) => {
    const order = towns.slice().sort((a, b) => dist(a) - dist(b)).slice(0, 2);
    order.forEach((t, k) => {
      if (dist(t) > 22000) return;
      const tx = side === "W" ? RG_INSET : side === "E" ? 64000 - RG_INSET : t.x, ty = side === "N" ? RG_INSET : side === "S" ? 64000 - RG_INSET : t.y;
      rgAddRoad("main", 9, rgPath(t.x, t.y, rgClamp(tx, RG_INSET, 64000 - RG_INSET), rgClamp(ty, RG_INSET, 64000 - RG_INSET), 500 + si * 3 + k, 0.08, 150), t.name + " Rim Spur", -1);
    });
  });
  void ringRoad;
  // town street plans
  towns.forEach(t => rgTownStreets(t, R));
  // spurs from road-served sites to the nearest road
  const trunk = RG.roads.filter(r => r.kind === "main" || r.kind === "ring" || r.kind === "street");
  for (const s of RG.sites) {
    if (!s.road) continue;
    const c = rgClosestOnRoads(s.x, s.y, trunk);
    if (!c || c.d < s.rad + 20) continue;
    // leave the site from the side facing the road
    const ang = Math.atan2(c.y - s.y, c.x - s.x), ex = s.x + Math.cos(ang) * (s.rad * 0.55), ey = s.y + Math.sin(ang) * (s.rad * 0.55);
    s.gate = [ex, ey]; s.gateAng = ang;
    rgAddRoad("spur", s.k === "moisture" || s.k === "ranch" || s.k === "croft" || s.k === "farm" || s.k === "farmhouse" || s.k === "ranchmesa" ? 5 : 7, rgPath(ex, ey, c.x, c.y, 900 + s.idx, 0.12, 90), (s.name || "Farm") + " Lane", -1, { site: s.idx });
  }
  rgWallGaps();
  rgIndexRoads();

  // --- land-use classes per km cell (threat, stealth, banner, map legend)
  const Nm = CITY.MACROS, macro = new Uint8Array(Nm * Nm), mcity = new Int16Array(Nm * Nm).fill(-1), mdist = new Float32Array(Nm * Nm);
  for (let my = 0; my < Nm; my++) for (let mx = 0; mx < Nm; mx++) {
    const cx = mx * 1000 + 500, cy = my * 1000 + 500;
    let cls = CL_FARM, ci = -1, bt = 9;
    for (const t of towns) {   // distance from the town centre to the NEAREST point of the cell
      const nx = rgClamp(t.x, mx * 1000, mx * 1000 + 1000), ny = rgClamp(t.y, my * 1000, my * 1000 + 1000), d = Math.hypot(t.x - nx, t.y - ny) / t.r;
      if (d < 0.98 && d < bt) { bt = d; ci = t.idx; }
    }
    if (ci >= 0) {
      const t = towns[ci];
      cls = t.kind === 0 ? (bt < 0.12 ? CL_DOWNTOWN : bt < 0.45 ? CL_URBAN : bt < 0.8 ? CL_SUBURB : CL_RURAL)
        : t.kind === 1 ? (bt < 0.2 ? CL_URBAN : bt < 0.75 ? CL_SUBURB : CL_RURAL) : (bt < 0.6 ? CL_SUBURB : CL_RURAL);
    } else {
      const s = RG.siteCell.get(rgCK(mx, my));
      if (s) cls = s.cls;
      else {
        let rock = 0, forest = 0, wet = 0;
        for (const [ox, oy] of [[0, 0], [-300, -300], [300, -300], [-300, 300], [300, 300]]) { rock += rgF("rock", cx + ox, cy + oy); forest += rgF("forest", cx + ox, cy + oy); wet += rgF("wet", cx + ox, cy + oy); }
        cls = wet / 5 > 0.55 ? CL_LAKE : (rock / 5 > 0.4 || forest / 5 > 0.55) ? CL_FOREST : CL_FARM;
      }
    }
    macro[my * Nm + mx] = cls; mcity[my * Nm + mx] = ci; mdist[my * Nm + mx] = bt;
  }
  CITY.macro = macro; CITY.macroCity = mcity; CITY.macroT = mdist;
  CITY.ready = true;
  RG.initMs = t0 ? performance.now() - t0 : 0;
  return CITY;
}

// town walls get a gate wherever a street, track or lane crosses them
function rgWallGaps() {
  for (const R of RG.rings) {
    if (R.kind !== "wall") continue;
    const gaps = [];
    for (const rd of RG.roads) {
      if (rd.kind === "ring") continue;
      for (let i = 0; i < rd.pts.length - 1; i++) {
        const [ax, ay] = rd.pts[i], [bx, by] = rd.pts[i + 1], da = Math.hypot(ax - R.cx, ay - R.cy) - R.r, db = Math.hypot(bx - R.cx, by - R.cy) - R.r;
        if ((da < 0) === (db < 0)) continue;
        const t = da / (da - db), x = ax + (bx - ax) * t, y = ay + (by - ay) * t, a = Math.atan2(y - R.cy, x - R.cx);
        if (!gaps.some(g0 => Math.abs(((a - g0.a) % 6.2832 + 9.4248) % 6.2832 - 3.1416) * R.r < g0.w)) gaps.push({ a, w: rd.w + 6 });
      }
    }
    R.gaps.length = 0; for (const g0 of gaps) R.gaps.push(g0);
  }
}
// streets inside a town, by plan style
function rgTownStreets(t, R) {
  const P = RG.P, S = (P.towns && P.towns.streets) || ["Main St"], nm = k => S[(t.h + k) % S.length];
  const add = (pts, w, k) => rgAddRoad("street", w, pts, nm(k), t.idx);
  const r = t.r, k0 = t.idx * 37;
  t.plaza = t.style === "linear" ? 12 + r * 0.008 : t.style === "cluster" ? 10 + r * 0.02 : Math.min(46, 14 + r * 0.03);
  if (t.style === "radial" || t.style === "walled") {
    const n = r > 1000 ? 7 : r > 600 ? 5 : 4;
    for (let i = 0; i < n; i++) {
      const a = t.rot + i * Math.PI * 2 / n + (cF(cH(t.h, i, 1, 1)) - 0.5) * 0.5;
      add(rgPath(t.x + Math.cos(a) * t.plaza, t.y + Math.sin(a) * t.plaza, t.x + Math.cos(a) * r * 1.02, t.y + Math.sin(a) * r * 1.02, k0 + i, 0.07, 40), r > 900 ? 9 : 8, i);
    }
    add(rgCircle(t.x, t.y, t.plaza + 4, k0, 0.02, 14), 7, 20);
    if (r > 380) add(rgCircle(t.x, t.y, r * 0.48, k0 + 3, 0.07, 32), 7, 21);
    if (r > 760) add(rgCircle(t.x, t.y, r * 0.82, k0 + 5, 0.06, 36), 7, 22);
    if (t.style === "walled") {
      // town wall just outside the last houses, with a gate wherever a street or track leaves
      t.wall = { r: r * 1.06, gaps: [] };
      RG.rings.push({ cx: t.x, cy: t.y, r: r * 1.06, th: 2.2, gaps: t.wall.gaps, kind: "wall", town: t.idx, towers: 1 });
    }
  } else if (t.style === "linear") {
    const a = t.rot, ux = Math.cos(a), uy = Math.sin(a), vx = -uy, vy = ux;
    add(rgPath(t.x - ux * r, t.y - uy * r, t.x + ux * r, t.y + uy * r, k0, 0.03, 40), 10, 0);
    if (r > 420) { add(rgPath(t.x - ux * r * 0.75 + vx * 70, t.y - uy * r * 0.75 + vy * 70, t.x + ux * r * 0.75 + vx * 70, t.y + uy * r * 0.75 + vy * 70, k0 + 1, 0.03, 40), 7, 1); add(rgPath(t.x - ux * r * 0.75 - vx * 70, t.y - uy * r * 0.75 - vy * 70, t.x + ux * r * 0.75 - vx * 70, t.y + uy * r * 0.75 - vy * 70, k0 + 2, 0.03, 40), 7, 2); }
    const sp = cRange(R, 85, 120);
    for (let s = -r * 0.8, i = 0; s <= r * 0.8; s += sp, i++) {
      const L = r * (0.35 + 0.35 * cF(cH(t.h, i, 2, 2)));
      add(rgPath(t.x + ux * s - vx * L, t.y + uy * s - vy * L, t.x + ux * s + vx * L, t.y + uy * s + vy * L, k0 + 10 + i, 0.04, 30), 7, 3 + i);
    }
  } else if (t.style === "grid") {
    const sp = r > 1000 ? 120 : r > 500 ? 95 : 75, a = Math.round(t.rot / (Math.PI / 2)) * 0;   // axis-aligned blocks
    void a;
    for (let dx = -Math.floor(r / sp) * sp; dx <= r; dx += sp) { const h = Math.sqrt(Math.max(0, r * r - dx * dx)); if (h < 60) continue; add([[t.x + dx, t.y - h], [t.x + dx, t.y + h]], Math.abs(dx) < sp / 2 ? 11 : 8, 1 + Math.round(dx / sp)); }
    for (let dy = -Math.floor(r / sp) * sp; dy <= r; dy += sp) { const h = Math.sqrt(Math.max(0, r * r - dy * dy)); if (h < 60) continue; add([[t.x - h, t.y + dy], [t.x + h, t.y + dy]], Math.abs(dy) < sp / 2 ? 11 : 8, 30 + Math.round(dy / sp)); }
    t.plaza = Math.min(t.plaza, sp * 0.3);
  } else {   // cluster: a few wandering lanes from the green
    const n = r > 400 ? 5 : 4;
    for (let i = 0; i < n; i++) {
      const a = t.rot + i * Math.PI * 2 / n + (cF(cH(t.h, i, 3, 3)) - 0.5) * 0.9, L = r * (0.75 + 0.35 * cF(cH(t.h, i, 4, 4)));
      add(rgPath(t.x + Math.cos(a) * t.plaza, t.y + Math.sin(a) * t.plaza, t.x + Math.cos(a) * L, t.y + Math.sin(a) * L, k0 + i, 0.16, 25), 6, i);
    }
    add(rgCircle(t.x, t.y, t.plaza + 3, k0, 0.05, 12), 6, 9);
    if (r > 300) add(rgCircle(t.x, t.y, r * 0.55, k0 + 2, 0.12, 24), 5, 10);
  }
}
// EOF part 1 (regiongen.js continues)

/* --- 5. CELLS & BLOCKS ------------------------------------------------------------------ */
function rgOrgCell(mx, my) {
  const cls = cityMacroClass(mx, my), z = (x, km, closing) => ({ x, r: 0, w: 0, hw: false, sw: 0, k: 0, km, org: 1, closing: !!closing });
  const zy = (y, km, closing) => ({ y, r: 0, w: 0, hw: false, sw: 0, k: 0, km, org: 1, closing: !!closing });
  return { cls, vx: [z(mx * 1000, mx, true), z((mx + 1) * 1000, mx + 1, true)], hy: [zy(my * 1000, my, true), zy((my + 1) * 1000, my + 1, true)], org: 1 };
}
// 2 m occupancy raster of the block being generated (roads, plazas, buildings, sites, rocks)
const RG_OCC = { a: new Uint8Array(500 * 500), x0: 0, y0: 0 };
function rgOccReset(mx, my) { RG_OCC.a.fill(0); RG_OCC.x0 = mx * 1000; RG_OCC.y0 = my * 1000; }
function rgOccRect(x0, y0, x1, y1, v) {
  const O = RG_OCC, a = Math.max(0, Math.floor((x0 - O.x0) / 2)), b = Math.min(499, Math.floor((x1 - O.x0) / 2)), c = Math.max(0, Math.floor((y0 - O.y0) / 2)), d = Math.min(499, Math.floor((y1 - O.y0) / 2));
  for (let y = c; y <= d; y++) for (let x = a; x <= b; x++) O.a[y * 500 + x] = Math.max(O.a[y * 500 + x], v || 1);
}
function rgOccFree(x0, y0, x1, y1) {
  const O = RG_OCC;
  if (x0 < O.x0 || y0 < O.y0 || x1 > O.x0 + 1000 || y1 > O.y0 + 1000) return false;
  const a = Math.floor((x0 - O.x0) / 2), b = Math.min(499, Math.floor((x1 - O.x0) / 2)), c = Math.floor((y0 - O.y0) / 2), d = Math.min(499, Math.floor((y1 - O.y0) / 2));
  for (let y = c; y <= d; y++) for (let x = a; x <= b; x++) if (O.a[y * 500 + x]) return false;
  return true;
}
function rgOccDisc(cx, cy, r, v) {
  const O = RG_OCC, a = Math.max(0, Math.floor((cx - r - O.x0) / 2)), b = Math.min(499, Math.floor((cx + r - O.x0) / 2)), c = Math.max(0, Math.floor((cy - r - O.y0) / 2)), d = Math.min(499, Math.floor((cy + r - O.y0) / 2));
  for (let y = c; y <= d; y++) for (let x = a; x <= b; x++) { const px = O.x0 + x * 2 + 1, py = O.y0 + y * 2 + 1; if ((px - cx) ** 2 + (py - cy) ** 2 <= r * r) O.a[y * 500 + x] = Math.max(O.a[y * 500 + x], v || 1); }
}
function rgOccDiscFree(cx, cy, r) {
  const O = RG_OCC;
  if (cx - r < O.x0 || cy - r < O.y0 || cx + r > O.x0 + 1000 || cy + r > O.y0 + 1000) return false;
  const a = Math.floor((cx - r - O.x0) / 2), b = Math.floor((cx + r - O.x0) / 2), c = Math.floor((cy - r - O.y0) / 2), d = Math.floor((cy + r - O.y0) / 2);
  for (let y = c; y <= d; y++) for (let x = a; x <= b; x++) { const px = O.x0 + x * 2 + 1, py = O.y0 + y * 2 + 1; if ((px - cx) ** 2 + (py - cy) ** 2 <= r * r && O.a[y * 500 + x]) return false; }
  return true;
}
function rgOccSeg(s, pad) {
  const O = RG_OCC, hw = s.w / 2 + (pad || 0);
  const a = Math.max(0, Math.floor((Math.min(s.ax, s.bx) - hw - O.x0) / 2)), b = Math.min(499, Math.floor((Math.max(s.ax, s.bx) + hw - O.x0) / 2));
  const c = Math.max(0, Math.floor((Math.min(s.ay, s.by) - hw - O.y0) / 2)), d = Math.min(499, Math.floor((Math.max(s.ay, s.by) + hw - O.y0) / 2));
  for (let y = c; y <= d; y++) for (let x = a; x <= b; x++) if (rgSegDist(O.x0 + x * 2 + 1, O.y0 + y * 2 + 1, s) <= hw) O.a[y * 500 + x] = Math.max(O.a[y * 500 + x], 2);
}

// building record through the classic mkBuilding (tile rect, front = the street side)
function rgBld(B, type, xm, ym, wm, hm, front, extra) {
  const xT = Math.round(xm * 2), yT = Math.round(ym * 2), wT = Math.max(8, Math.round(wm * 2)), hT = Math.max(8, Math.round(hm * 2));
  const ns = front === "N" || front === "S", cw = ns ? wT : hT, ch = ns ? hT : wT;
  const b = mkBuilding(B, type, { x0: xT, y0: yT, x1: xT + wT, y1: yT + hT }, cw, ch, front, 0, 0, extra);
  return b;
}
function rgProp(B, t, xm, ym, wm, hm, s, extra) { return addProp(B, t, xm * 2, ym * 2, Math.max(1, wm * 2), Math.max(1, hm * 2), s, Object.assign({ rg: 1 }, extra || {})); }

function rgGridParks(B) {   // Starfleet Earth: a share of the city blocks are parks and gardens
  const pk = RG.P.grid.parks || 0;
  if (!(B.cls === CL_SUBURB || B.cls === CL_URBAN) || cF(cH(CITY.seed, B.mx * 64 + B.my, B.i * 16 + B.j, 913)) > pk) return;
  if (B.x1 - B.x0 < 40 || B.y1 - B.y0 < 40) return;
  const r = cRng(B.seed ^ 0x2468);
  B.blds = []; B.spawns = []; B.fences = []; B.props = B.props.filter(q => q.t === "streetlight" || q.t === "pole");
  B.surf = [{ t: "park", x0: B.x0 + 4, y0: B.y0 + 4, x1: B.x1 - 4, y1: B.y1 - 4, v: 0 }];
  const cx = (B.x0 + B.x1) / 2, cy = (B.y0 + B.y1) / 2;
  B.surf.push({ t: "path", x0: B.x0 + 4, y0: cy - 3, x1: B.x1 - 4, y1: cy + 3, v: 0 }, { t: "path", x0: cx - 3, y0: B.y0 + 4, x1: cx + 3, y1: B.y1 - 4, v: 0 });
  addProp(B, "fountain", cx - 6, cy - 6, 12, 12, FS_COVER);
  const n = Math.round((B.x1 - B.x0) * (B.y1 - B.y0) / 900);
  for (let k = 0; k < n; k++) { const x = B.x0 + 8 + r() * (B.x1 - B.x0 - 16), y = B.y0 + 8 + r() * (B.y1 - B.y0 - 16); if (Math.abs(x - cx) < 6 || Math.abs(y - cy) < 6) continue; addProp(B, "tree", x, y, 1, 1, FS_COVER, { v: Math.floor(r() * 4), sz: 0.9 + r() * 0.7 }); }
  for (let k = 0; k < 6; k++) addProp(B, "bench", cx + (k % 3 - 1) * 18 - 2, cy + (k < 3 ? -7 : 5), 4, 1.5, FS_LOW);
}
const RG_SIZE = {   // metres: [along-street min, max, depth min, max]
  dome: [8, 15, 8, 15], rgbox: [9, 15, 8, 12], cabin: [9, 11, 7, 8], shed: [4.5, 6, 4.5, 5.5], barn: [15, 20, 12, 15], house: [14, 19, 9.5, 11.5],
  warehouse: [20, 30, 15, 22], church: [16, 20, 11, 14], motel: [28, 40, 9, 11], "civic": [30, 44, 22, 30],
  "commercial:store": [12, 20, 9, 13], "commercial:bar": [11, 15, 9, 12], "commercial:diner": [13, 18, 9, 12], "commercial:cafe": [8, 11, 7, 9], "commercial:pharmacy": [13, 18, 10, 13],
  "commercial:gasstore": [13, 16, 9, 11], "commercial:hardware": [14, 22, 11, 15], "commercial:autorepair": [14, 20, 10, 13], "commercial:shop": [8, 12, 8, 11],
  "commercial:office": [16, 28, 12, 17], "commercial:post": [12, 16, 9, 12], "commercial:bank": [12, 16, 10, 13]
};
function rgPickW(r, list) { let tot = 0; for (const e of list) tot += e[1]; let x = r() * tot; for (const e of list) { x -= e[1]; if (x <= 0) return e[0]; } return list[0][0]; }
function rgBldSpec(T, dT, r) {
  const P = RG.P, bp = P.bld, zone = dT < (T.kind === 0 ? 0.36 : 0.3) ? "core" : dT < 0.7 ? "mid" : "edge";
  let id = rgPickW(r, bp[zone] || bp.mid);
  if (T.kind === 2 && id.startsWith("civic")) id = "rgbox";
  let type = id, kind = null;
  if (id.indexOf(":") > 0) { const q = id.split(":"); type = q[0]; kind = q[1]; }
  const round = (type === "dome") || (type === "rgbox" && r() < (bp.round || 0) * 0.25);
  const sz = RG_SIZE[id] || RG_SIZE[type] || RG_SIZE.rgbox;
  let bw = cRange(r, sz[0], sz[1]), bd = cRange(r, sz[2], sz[3]);
  if (type === "dome") { const big = zone === "core" && r() < 0.35 ? cRange(r, 1.1, 1.45) : 1; bw = Math.round(bw * big); bd = r() < 0.7 ? bw : Math.round(bw * cRange(r, 0.8, 0.95)); }
  if (T.kind === 0 && zone === "core") { bw *= 1.1; bd *= 1.08; }
  return { type: type === "dome" ? "dome" : type, kind, bw, bd, round: round || type === "dome", setback: zone === "core" ? cRange(r, 1, 3) : cRange(r, 2.5, 7), zone };
}
function rgMakeTownBld(B, spec, x0, y0, ww, hh, front, r, T) {
  const P = RG.P, bp = P.bld, extra = { mat: bp.mat || "masonry", roof: bp.roof || "flat", imp: spec.zone === "core" ? 1 : 0, rgTown: T.idx };
  let type = spec.type;
  if (type === "commercial") { extra.kind = spec.kind; extra.name = bName(spec.kind, r); extra.roof = bp.roof === "gable" ? "gable" : "flat"; if (P.theme === "frontier" || P.theme === "medieval") extra.mat = "wood"; }
  else if (type === "civic") { extra.kind = spec.kind; extra.name = (spec.kind || "civic").toUpperCase(); extra.mat = "masonry"; extra.imp = 2; }
  else if (type === "church") { extra.kind = "church"; extra.name = "CHURCH"; }
  else if (type === "warehouse") { extra.kind = "warehouse"; extra.mat = P.theme === "frontier" ? "wood" : "metal"; extra.roof = "flat"; }
  else if (type === "barn") { extra.kind = "barn"; extra.name = "BARN"; extra.mat = "wood"; extra.roof = "gable"; }
  else if (type === "cabin") { extra.kind = "cabin"; extra.mat = bp.mat === "metal" ? "metal" : "wood"; extra.roof = bp.roof === "flat" ? "flat" : "gable"; }
  else if (type === "house") { extra.spec = { mw: 0, gw: 0, gh: 0, garage: false }; extra.mat = r() < 0.5 ? "wood" : "brick"; extra.roof = r() < 0.6 ? "gable" : "hip"; }
  else if (type === "motel") { extra.kind = "motel"; extra.name = "MOTEL"; extra.roof = "flat"; }
  if (spec.round) { extra.round = 1; extra.roof = "dome"; if (type !== "dome") extra.domeKind = type; type = "dome"; }
  const b = rgBld(B, type, x0, y0, ww, hh, front, extra);
  if (type === "house" && b.spec) b.spec.mw = b.cw;
  // occupants: shops & big buildings more often; homes sometimes
  const occ = type === "commercial" || type === "civic" || type === "warehouse" ? 0.5 : type === "dome" ? 0.28 : 0.3;
  if (r() < occ) addSpawn(B, "room", type === "civic" ? cInt(r, 2, 4) : cInt(r, 1, 2), { bid: b.id, bkey: b.key, heavy: type === "civic" ? 0.3 : 0.1 });
  return b;
}
// line every street & track inside a town with lots facing it
function rgTownLots(B, mx, my, r) {
  const segs = rgSegsIn(mx, my);
  const cx0 = mx * 1000, cy0 = my * 1000;
  for (const s of segs) {
    if (s.r.kind === "ring") continue;
    const midx = (s.ax + s.bx) / 2, midy = (s.ay + s.by) / 2;
    const T = s.r.town >= 0 ? RG.towns[s.r.town] : rgTownAt(midx, midy, 1.0);
    if (!T) continue;
    const L = Math.hypot(s.bx - s.ax, s.by - s.ay);
    if (L < 6) continue;
    const ux = (s.bx - s.ax) / L, uy = (s.by - s.ay) / L, nx = -uy, ny = ux;
    let t = 2 + (s.k % 5);
    while (t < L - 3) {
      const px = s.ax + ux * t, py = s.ay + uy * t;
      const dT = Math.hypot(px - T.x, py - T.y) / T.r;
      if (dT > 1.0 || px < cx0 - 30 || py < cy0 - 30 || px > cx0 + 1030 || py > cy0 + 1030) { t += 10; continue; }
      let adv = 7;
      // now and then a vehicle parked at the kerb (drivable, themed per world)
      if (r() < (T.kind === 0 ? 0.05 : 0.035) && s.w >= 7) {
        const o = Math.abs(ux) > Math.abs(uy) ? 1 : 0, cxm = px + nx * (s.w / 2 - 1.3), cym = py + ny * (s.w / 2 - 1.3);
        const wT = o ? 9 : 4, hT = o ? 4 : 9, x0 = Math.round(cxm * 2 - wT / 2), y0 = Math.round(cym * 2 - hT / 2);
        if (x0 > cx0 * 2 + 2 && y0 > cy0 * 2 + 2 && x0 + wT < (cx0 + 1000) * 2 - 2 && y0 + hT < (cy0 + 1000) * 2 - 2) addProp(B, "car", x0, y0, wT, hT, FS_COVER, { o: o ? (ux > 0 ? 1 : 3) : (uy > 0 ? 2 : 0), v: cInt(r, 0, 7) });
      }
      for (const side of [1, -1]) {
        if (dT > 0.82 && r() < (dT - 0.82) * 2.2) continue;   // houses thin out towards the edge
        let spec = rgBldSpec(T, dT, r);
        for (let tryk = 0; tryk < 3; tryk++) {
          if (tryk === 1) spec = Object.assign({}, spec, { bw: spec.bw * 0.74, bd: spec.bd * 0.82 });
          if (tryk === 2) { if (spec.type !== "commercial" && spec.type !== "warehouse") break; spec = Object.assign({}, spec, { bw: spec.bw * 0.7, bd: spec.bd * 0.8 }); if (spec.bw < 7.5 || spec.bd < 6.5) break; }
          const fx = -nx * side, fy = -ny * side;
          const front = Math.abs(fx) > Math.abs(fy) ? (fx > 0 ? "E" : "W") : (fy > 0 ? "S" : "N");
          const ns = front === "N" || front === "S", ww = ns ? spec.bw : spec.bd, hh = ns ? spec.bd : spec.bw;
          // the footprint is axis-aligned, the street may run at any angle: clear the street by the rect's reach along the normal
          const off = s.w / 2 + spec.setback + (Math.abs(nx) * ww + Math.abs(ny) * hh) / 2;
          const bxm = px + nx * side * off, bym = py + ny * side * off;
          const x0 = bxm - ww / 2, y0 = bym - hh / 2;
          if (x0 < cx0 + 1.5 || y0 < cy0 + 1.5 || x0 + ww > cx0 + 998.5 || y0 + hh > cy0 + 998.5) continue;
          if (Math.hypot(bxm - T.x, bym - T.y) < T.plaza + 6 + Math.max(ww, hh) / 2) continue;
          if (!rgOccFree(x0 - 1.6, y0 - 1.6, x0 + ww + 1.6, y0 + hh + 1.6)) continue;
          rgOccRect(x0 - 0.6, y0 - 0.6, x0 + ww + 0.6, y0 + hh + 0.6, 3);
          rgMakeTownBld(B, spec, x0, y0, ww, hh, front, r, T);
          adv = Math.max(adv, (Math.abs(ux) * ww + Math.abs(uy) * hh) * 0.75 + cRange(r, 1, 4));
          break;
        }
      }
      t += adv;
    }
  }
}
// town centre: a plaza disc (+ well / fountain / statue) and the market stalls
function rgTownCentre(B, mx, my, r) {
  for (const T of RG.towns) {
    const cx0 = mx * 1000, cy0 = my * 1000;
    if (T.x < cx0 || T.y < cy0 || T.x >= cx0 + 1000 || T.y >= cy0 + 1000) continue;
    const P = RG.P, g = (P.ground && P.ground.town) || ["plaza", "#b8b1a3"];
    B.surf.push({ t: "rgdisc", x0: (T.x - T.plaza) * 2, y0: (T.y - T.plaza) * 2, x1: (T.x + T.plaza) * 2, y1: (T.y + T.plaza) * 2, pat: g[0], col: g[1] });
    rgOccDisc(T.x, T.y, T.plaza + 2, 2);
    const mid = P.theme === "galactic" || P.theme === "desert" || P.theme === "pharaoh" ? "well" : P.theme === "medieval" || P.theme === "wizard" ? "well" : "fountain";
    rgProp(B, mid === "well" ? "rgwell" : "fountain", T.x - 2, T.y - 2, 4, 4, FS_COVER, mid === "well" ? {} : { rg: 0 });
    const n = Math.min(14, Math.floor(T.plaza / 4));
    for (let k = 0; k < n; k++) {
      const a = k / n * Math.PI * 2 + 0.3, rr = T.plaza * 0.62;
      addProp(B, "rgstall", (T.x + Math.cos(a) * rr - 1.5) * 2, (T.y + Math.sin(a) * rr - 1) * 2, 6, 4, FS_LOW, { rg: 1, v: k & 3 });
    }
    if (T.kind <= 1) addSpawn(B, "patrol", cInt(r, 2, 3), { pts: [0, 1, 2, 3].map(k => [Math.round((T.x + Math.cos(k * 1.57) * (T.plaza + 6)) * 2), Math.round((T.y + Math.sin(k * 1.57) * (T.plaza + 6)) * 2)]), street: 1, heavy: 0.2 });
  }
}
// rocks / mesas where the rock field is high, scrub and boulders on the open ground
function rgTerrainProps(B, mx, my, r) {
  const P = RG.P, cx0 = mx * 1000, cy0 = my * 1000, RK = P.rocks || {}, rr = cRng(cH(CITY.seed, mx, my, 707));
  if (P.fields && P.fields.rock) {
    for (let gy = 0; gy < 1000; gy += 32) for (let gx = 0; gx < 1000; gx += 32) {
      const x = cx0 + gx + rr() * 32, y = cy0 + gy + rr() * 32, v = rgF("rock", x, y);
      if (v < 0.42) { if (v > 0.12 && rr() < 0.03 * (RK.boulders || 1)) { const rad = cRange(rr, 0.8, 2.2); if (rgOccDiscFree(x, y, rad + 1.5)) { rgOccDisc(x, y, rad + 0.5, 4); rgRock(B, x, y, rad, rr, "boulder"); } } continue; }
      if (rr() > 0.3 + 0.7 * v) continue;
      let rad = 3 + v * cRange(rr, 6, 13);
      if (RK.mesa && v > 0.8 && rr() < 0.3) rad = cRange(rr, 15, 28);
      if (RK.spires && v > 0.7 && rr() < 0.12) rad = cRange(rr, 4, 7);
      if (!rgOccDiscFree(x, y, rad + 4.5)) continue;
      rgOccDisc(x, y, rad + 1, 4);
      rgRock(B, x, y, rad, rr, rad > 13 ? "mesa" : RK.spires && rad < 7.5 && v > 0.7 ? "spire" : "rock");
    }
  }
  if (P.scrub) {
    const n = Math.round((P.scrub.n || 4) * 20);
    for (let k = 0; k < n; k++) { const x = cx0 + rr() * 1000, y = cy0 + rr() * 1000; if (rgF("rock", x, y) > 0.3 || rgF("dune", x, y) > 0.6) continue; if (!rgOccDiscFree(x, y, 1.2)) continue; rgProp(B, "rgscrub", x - 0.6, y - 0.6, 1.2, 1.2, FS_NONE, { v: Math.floor(rr() * 4), col: P.scrub.col }); }
  }
}
function rgRock(B, xm, ym, rad, r, kind) {
  const n = kind === "boulder" ? 7 : kind === "spire" ? 9 : 12, pts = [];
  for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2 + r() * 0.3, q = rad * (kind === "mesa" ? cRange(r, 0.82, 1.08) : cRange(r, 0.72, 1.12)); pts.push([(xm + Math.cos(a) * q) * 2, (ym + Math.sin(a) * q) * 2]); }
  const xs = pts.map(p => p[0]), ys = pts.map(p => p[1]), x0 = Math.min(...xs), y0 = Math.min(...ys);
  return addProp(B, "rgrock", x0, y0, Math.max(...xs) - x0, Math.max(...ys) - y0, 0, { rg: 1, pg: pts, es: kind === "boulder" && rad < 1.3 ? FS_COVER : FS_TALL, kind, v: Math.floor(r() * 3), seed: Math.floor(r() * 1e9) });
}
// wild hostiles: patrols out in the open country, natives where the profile has them
function rgWildSpawns(B, mx, my, r) {
  const P = RG.P, cls = B.cls, cx0 = mx * 1000, cy0 = my * 1000;
  const p = cls === CL_FOREST ? 0.3 : cls === CL_FARM ? 0.14 : cls === CL_RURAL ? 0.12 : 0;
  if (r() < p) {
    const x = cx0 + cRange(r, 150, 850), y = cy0 + cRange(r, 150, 850);
    if (rgOccFree(x - 4, y - 4, x + 4, y + 4)) addSpawn(B, "patrol", cInt(r, 2, 4), { pts: [[x * 2, y * 2], [(x + 120) * 2, y * 2], [(x + 120) * 2, (y + 120) * 2], [x * 2, (y + 120) * 2]].map(q => q.map(Math.round)), ros: P.natives && cls === CL_FOREST ? P.natives : undefined, wild: 1 });
  }
}
function rgGenBlock(mx, my, i, j, key) {
  const S = cityCell(mx, my), zero = { r: 0, w: 0, sw: 0, hw: false, k: 0 };
  const B = { key, mx, my, i, j, cls: S.cls, seed: cH(CITY.seed, mx * 64 + my, i * 16 + j, 4243), x0: mx * 2000, x1: (mx + 1) * 2000, y0: my * 2000, y1: (my + 1) * 2000,
    side: { N: zero, S: zero, W: zero, E: zero }, blds: [], props: [], surf: [], fences: [], spawns: [], rg: 1 };
  const r = cRng(B.seed);
  try {
    rgOccReset(mx, my);
    for (const s of rgSegsIn(mx, my)) rgOccSeg(s, 1.2);
    const site = RG.siteCell.get(rgCK(mx, my));
    if (site && typeof RG_SITE_GEN !== "undefined") (RG_SITE_GEN[site.k] || rgSiteFallback)(B, site, cRng(site.seed));
    rgTownCentre(B, mx, my, r);
    const inTown = cityMacroCityIdx(mx, my) >= 0 || rgTownNear(mx, my);
    if (inTown && typeof rgTownBays === "function") rgTownBays(B, mx, my, r);
    if (inTown) rgTownLots(B, mx, my, r);
    rgTerrainProps(B, mx, my, r);
    if (!site) rgWildSpawns(B, mx, my, r);
  } catch (e) { if (typeof window !== "undefined" && window.trackProgress) window.trackProgress("rgGenBlock " + key + ": " + e.message, true); else throw e; }
  return B;
}
function rgTownNear(mx, my) { const cx = mx * 1000 + 500, cy = my * 1000 + 500; return RG.towns.some(t => Math.hypot(t.x - cx, t.y - cy) < t.r + 720); }
// EOF part 2 (regiongen.js continues)

/* --- 6. GRID PROFILES: the v14 lattice re-dressed + edge beltway + airports ----------- */
function rgGridInit(P, seed) {
  const G = P.grid || {};
  const _cities = RG._gridHook = G;   // read by the cityGenInit wrapper below
  void _cities;
  RG._origInit(seed);
  // edge beltway: interstate lines 1 km inside every edge (traffic can always turn back)
  if (G.beltway) {
    for (const v of [1, 63]) { if (CITY.hwX.indexOf(v) < 0) CITY.hwX.push(v); if (CITY.hwY.indexOf(v) < 0) CITY.hwY.push(v); }
    CITY.hwX.sort((a, b) => a - b); CITY.hwY.sort((a, b) => a - b);
    const ODD = [65, 69, 71, 75, 57, 59], EVEN = [70, 74, 64, 80, 94, 90];
    CITY.hwNameX = CITY.hwX.map((v, i) => v === 1 || v === 63 ? "I-465" : "I-" + ODD[i % ODD.length]);
    CITY.hwNameY = CITY.hwY.map((v, i) => v === 1 || v === 63 ? "I-465" : "I-" + EVEN[i % EVEN.length]);
    CITY.lineCache = new Map(); CITY.cellCache = new Map(); CITY.blockCache = new Map();
  }
  // airports: one open farm cell next to each of the biggest cities becomes an airfield
  RG.airports = []; RG.airCell = new Map();
  const N = CITY.MACROS, majors = CITY.cities.filter(c => c.kind === 0).sort((a, b) => b.r - a.r).slice(0, G.airports || 0);
  for (const c of majors) {
    let best = null, bd = 1e9;
    for (let my = 2; my < N - 2; my++) for (let mx = 2; mx < N - 2; mx++) {
      if (CITY.macro[my * N + mx] !== CL_FARM) continue;
      if (CITY.hwX.indexOf(mx) >= 0 || CITY.hwX.indexOf(mx + 1) >= 0 || CITY.hwY.indexOf(my) >= 0 || CITY.hwY.indexOf(my + 1) >= 0) continue;
      if (RG.airCell.has(rgCK(mx, my))) continue;
      const d = Math.hypot(mx * 1000 + 500 - c.x, my * 1000 + 500 - c.y);
      if (d < c.r * 0.9 || d > c.r * 2.4) continue;
      if (d < bd) { bd = d; best = [mx, my]; }
    }
    if (!best) continue;
    const a = { mx: best[0], my: best[1], city: c.idx, name: (typeof cityName === "function" ? cityName(c) : c.name) + " " + (P.theme === "starship" ? "Shuttleport" : "Airport"), ns: cF(cH(seed, best[0], best[1], 3)) < 0.5 };
    RG.airports.push(a); RG.airCell.set(rgCK(best[0], best[1]), a);
  }
  // the parks share (Starfleet Earth): more green blocks — handled per block via RG.P.grid.parks
  CITY.ready = true;
  return CITY;
}

/* --- 7. WIRING INTO THE CLASSIC GENERATOR ---------------------------------------------- */
(function rgWire() {
  if (typeof cityGenInit !== "function") return;
  const _init = cityGenInit;
  RG._origInit = function (seed) { return _init(seed); };
  window.cityGenInit = cityGenInit = function (seed) {
    if (RG.org && RG.P) return rgOrgInit(RG.P, seed);
    if (RG.grid && RG.P && !RG._inGrid) { RG._inGrid = true; try { return rgGridInit(RG.P, seed); } finally { RG._inGrid = false; } }
    return _init(seed);
  };
  const _cell = cityCellStreets;
  window.cityCellStreets = cityCellStreets = function (mx, my) { return RG.org ? rgOrgCell(mx, my) : _cell(mx, my); };
  const _blk = cityGenBlock;
  window.cityGenBlock = cityGenBlock = function (mx, my, i, j, key) {
    if (RG.org) return rgGenBlock(mx, my, i, j, key);
    if (RG.grid && RG.airCell.has(rgCK(mx, my)) && typeof rgGenAirport === "function") return rgGenAirport(mx, my, i, j, key, RG.airCell.get(rgCK(mx, my)));
    const B = _blk(mx, my, i, j, key);
    if (RG.grid && RG.P && RG.P.grid) {
      if (RG.P.grid.parks && typeof rgGridParks === "function") rgGridParks(B);
      if (RG.P.grid.badlands && (B.cls === CL_FARM || B.cls === CL_RURAL || B.cls === CL_FOREST)) {   // the Badlands: no crops, no woods — scrub, shacks and rock
        B.surf = B.surf.filter(q => q.t !== "crop" && q.t !== "field" && q.t !== "pasture" && q.t !== "woods" && q.t !== "clearing" && q.t !== "yard" && q.t !== "grass" && q.t !== "park");
        B.props = B.props.filter(q => q.t !== "tree" && q.t !== "haybale" && q.t !== "silo");
      }
    }
    return B;
  };
  const _sn = cityStreetName;
  window.cityStreetName = cityStreetName = function (axis, line, mx, my) {
    if (RG.org) { const nr = typeof player !== "undefined" && player ? rgNearestRoad(...cityWorldM(player.x, player.y), 60) : null; return nr ? nr.s.r.name : ""; }
    return _sn(axis, line, mx, my);
  };
})();
// grid cities: profile sizes (the cityGenInit wrapper passes through; sizes applied by patching the city list after init)
(function rgGridCities() {
  const _o = RG._origInit;
  RG._origInit = function (seed) {
    const C = _o(seed), G = RG._gridHook;
    if (!RG.grid || !G) return C;
    if (G.badlands && !G.mega) rgRebuildLandUse();
    if (G.mega) {   // one megacity: grow the capital, rebuild the land use around it
      CITY.cities[0].r = G.mega; CITY.cities[0].x = 32000; CITY.cities[0].y = 32000;
      CITY.cities = CITY.cities.filter((c, i) => i === 0 || Math.hypot(c.x - 32000, c.y - 32000) > G.mega + c.r + 2500);
      CITY.cities.forEach((c, i) => { c.idx = i; });
      rgRebuildLandUse();
    }
    return C;
  };
})();
// recompute the classic land use after the city list changed (same rules as cityGenInit)
function rgRebuildLandUse() {
  const N = CITY.MACROS, cities = CITY.cities, seed = CITY.seed, macro = new Uint8Array(N * N), mcity = new Int16Array(N * N).fill(-1), mdist = new Float32Array(N * N);
  for (let my = 0; my < N; my++) for (let mx = 0; mx < N; mx++) {
    const cx = mx * 1000 + 500, cy = my * 1000 + 500;
    let cls = CL_FARM, bestT = 9, ci = -1;
    const rankOf = v => [0, 1, 2, 3, 5, 2, 0, 0][v];
    for (const c of cities) {
      const t = Math.hypot(c.x - cx, c.y - cy) / c.r;
      if (t > 1.3) continue;
      let k;
      if (c.kind === 0) k = t < 0.15 ? CL_DOWNTOWN : t < 0.46 ? CL_URBAN : t < 0.86 ? CL_SUBURB : t < 1.2 ? CL_RURAL : CL_FARM;
      else if (c.kind === 1) k = t < 0.3 ? CL_URBAN : t < 0.8 ? CL_SUBURB : t < 1.18 ? CL_RURAL : CL_FARM;
      else k = t < 0.65 ? CL_SUBURB : t < 1.25 ? CL_RURAL : CL_FARM;
      if (rankOf(k) > rankOf(cls) || (rankOf(k) === rankOf(cls) && t < bestT)) { cls = k; ci = c.idx; bestT = t; }
    }
    if ((cls === CL_URBAN || cls === CL_SUBURB) && ci >= 0 && cities[ci].kind === 0 && bestT > 0.4 && bestT < 0.9) {
      const nearHw = CITY.hwX.some(v => Math.abs(v - mx) <= 1) || CITY.hwY.some(v => Math.abs(v - my) <= 1);
      if (cFbm(mx * 0.35, my * 0.35, 5) > (nearHw ? 0.56 : 0.66)) cls = CL_INDUSTRIAL;
    }
    if (cls === CL_FARM && !(RG.P && RG.P.grid && RG.P.grid.badlands)) {
      if (cFbm(mx * 0.22, my * 0.22, 11) > 0.62) cls = CL_FOREST;
      else if (cF(cH(seed, mx, my, 7)) < 0.045 && !CITY.hwX.includes(mx) && !CITY.hwX.includes(mx + 1) && !CITY.hwY.includes(my) && !CITY.hwY.includes(my + 1)) cls = CL_LAKE;
    }
    macro[my * N + mx] = cls; mcity[my * N + mx] = ci; mdist[my * N + mx] = bestT;
  }
  CITY.macro = macro; CITY.macroCity = mcity; CITY.macroT = mdist;
  CITY.civic = new Map();
  cities.forEach(c => { if (c.kind === 2) return; const mx = Math.floor(c.x / 1000), my = Math.floor(c.y / 1000); if (mx >= 0 && my >= 0 && mx < N && my < N) CITY.civic.set(mx + "," + my, c.idx); });
  CITY.lineCache = new Map(); CITY.cellCache = new Map(); CITY.blockCache = new Map();
}

/* --- 8. PUBLIC API --------------------------------------------------------------------- */
// switch the generator to a world profile (does not generate; call cityGenInit(seed) after)
function regionSetProfile(key) {
  const P = RG_PROFILES[key] || RG_PROFILES.nexus, nk = RG_PROFILES[key] ? key : "nexus";
  if (RG.key !== nk || RG.genKey !== nk) CITY.ready = false;
  RG.key = nk; RG.P = P; RG.style = P.style; RG.org = P.style === "organic"; RG.grid = P.style === "grid";
  if (typeof rgApplyClassNames === "function") rgApplyClassNames();
  return P;
}
function regionGenerate(key, seed) {
  regionSetProfile(key);
  RG.seed = seed >>> 0;
  cityGenInit(RG.seed);
  RG.genKey = RG.key;
  return CITY;
}
// world key for markers / drop zones: nexus keeps the old per-seed key so v14 markers survive
function regionWorldKey() { return RG.key === "nexus" ? String(CITY.seed || 1979) : RG.key + "|" + (CITY.seed >>> 0); }
// a good outdoor drop point (world px) for organic worlds: a street in the main town
function regionPickDrop() {
  const T = RG.towns[0];
  if (!T) return [32000 * 32, 32000 * 32];
  const L = RG.roads.filter(r => r.town === T.idx && r.kind === "street");
  const rd = L.length ? L[Math.floor(Math.random() * L.length)] : null;
  if (rd) { const p = rd.pts[Math.floor(rd.pts.length * (0.25 + Math.random() * 0.5))]; return [p[0] * 32, p[1] * 32]; }
  return [(T.x + T.plaza + 10) * 32, T.y * 32];
}

/* --- 9. INTERIORS: round domes and simple boxes ---------------------------------------- */
// a round (elliptical) building: wall ring of cells, door(s) on the long axis, optional back room
ICT.dome = function (G, b, r) {
  const W = G.w, H = G.h, cx = (W - 1) / 2, cy = (H - 1) / 2, ax = W / 2 - 0.3, ay = H / 2 - 0.3;
  const ins = (x, y) => x >= 0 && y >= 0 && x < W && y < H && ((x - cx) / ax) ** 2 + ((y - cy) / ay) ** 2 <= 1;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (ins(x, y)) icSet(G, x, y, IC_FLOOR);
  const edge = [];
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    if (!ins(x, y)) continue;
    let out = false;
    for (let dy = -1; dy <= 1 && !out; dy++) for (let dx = -1; dx <= 1; dx++) if ((dx || dy) && !ins(x + dx, y + dy)) { out = true; break; }
    if (out) edge.push(x, y);
  }
  for (let k = 0; k < edge.length; k += 2) icSet(G, edge[k], edge[k + 1], IC_EXT);
  G.parts.push({ x: 0, y: 0, w: W, h: H, round: 1 });
  const kind = b.domeKind || "home", frontT = kind === "commercial" ? (FRONT_OF[b.kind] || "shop") : kind === "warehouse" ? "warehouse" : kind === "civic" ? "lobby" : "living";
  let main, back = null;
  if (W >= 22 && H >= 20) {
    const wy = Math.round(H * 0.42);
    icHWall(G, wy, 1, W - 2);
    back = icRoom(G, kind === "commercial" ? "storage" : kind === "civic" ? "office" : "bed", 1, 1, W - 2, wy - 1);
    main = icRoom(G, frontT, 1, wy + 1, W - 2, H - wy - 2);
    const dx = Math.floor(cx); icSet(G, dx, wy, IC_DOOR); icSet(G, dx + 1, wy, IC_DOOR);
    if (W >= 30) { const vx = Math.floor(cx) + 1; for (let y = 1; y < wy; y++) if (icGet(G, vx + 4, y) === IC_FLOOR) icSet(G, vx + 4, y, IC_INT); }
  } else main = icRoom(G, frontT, 1, 1, W - 2, H - 2);
  const door = (top) => { for (const x of [Math.floor(cx), Math.floor(cx) + 1]) { if (top) { for (let y = 0; y < H; y++) if (icGet(G, x, y) === IC_EXT) { icSet(G, x, y, IC_EDOOR); break; } } else { for (let y = H - 1; y >= 0; y--) if (icGet(G, x, y) === IC_EXT) { icSet(G, x, y, IC_EDOOR); break; } } } };
  door(false); if (b.door2) door(true);
  // two small windows on the flanks
  for (const side of [-1, 1]) {
    const y0 = Math.floor(cy) - 1;
    for (let q = 0; q < 2; q++) { const y = y0 + q; let x = side < 0 ? 0 : W - 1; while (x >= 0 && x < W && icGet(G, x, y) !== IC_EXT) x -= side; if (icGet(G, x, y) === IC_EXT && icGet(G, x, y - 1) === IC_EXT && icGet(G, x, y + 1) !== IC_FLOOR) icSet(G, x, y, IC_WIN); else if (icGet(G, x, y) === IC_EXT && r() < 0.8) icSet(G, x, y, IC_WIN); }
  }
  G.spawnRooms = [main.id].concat(back ? [back.id] : []);
};
// a plain box: one to three rooms (adobe homes, prefab modules, cottages, crofts)
ICT.rgbox = function (G, b, r) {
  const W = G.w, H = G.h;
  icRect(G, 0, 0, W, H);
  let main;
  if (W >= 26 && H >= 16) {
    const sx = Math.round(W * cRange(r, 0.55, 0.64));
    icVWall(G, sx, 1, H - 2);
    main = icRoom(G, b.rgGarage ? "garage" : "living", 1, 1, sx - 1, H - 2);
    const side = icRoom(G, b.rgGarage ? "storage" : "bed", sx + 1, 1, W - sx - 2, H - 2);
    icConnect(G, main, side, r, 2);
    icWindows(G, side, r, 2, 4, true);
  } else main = icRoom(G, b.rgGarage ? "garage" : (W * H < 260 ? "storage" : "living"), 1, 1, W - 2, H - 2);
  if (b.rgGarage) { main.bayKind = "carlift"; for (let x = 2; x <= Math.min(W - 3, 9); x++) if (icGet(G, x, H - 1) === IC_EXT) icSet(G, x, H - 1, IC_GDOOR); icExtDoor(G, main, 0, r, 2); }
  else icExtDoor(G, main, 2, r, 2, IC_EDOOR, Math.floor((main.w - 2) / 2));
  icWindows(G, main, r, 2, 4);
  G.spawnRooms = [main.id];
};
// EOF:js/regiongen.js
