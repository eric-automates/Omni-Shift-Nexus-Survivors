/* =========================================================================
   OMNI-SHIFT v14 — NEXUS CITY · UNIVERSE THEMES
   The world layout (streets, lots, floor plans) is the same for everybody —
   your markers and notes stay valid — but every material is dressed for the
   hero you play: a gas station is a Tibanna fuel depot on the Outer Rim, a
   promethium depot in the Imperium, "Floo Powder Co." for wizards, a lamp-oil
   & feed store in the Old West. Chairs, sofas, counters, cars, trees, street
   lamps, roofs, floors, signage and the litter on the ground all follow.
   ========================================================================= */
"use strict";

const CITY_THEMES = {
  modern: { name: "Modern Earth", era: "earth",
    g: { grass: "#4f7a3a", grass2: "#5b8944", dirt: "#7a6448", road: "#2f3136", road2: "#3a3c42", line: "#e3c24a", line2: "#e7e7e2", walk: "#a8a69e", curb: "#86847d", lot: "#3a3c41", plaza: "#b8b1a3", drive: "#9b9993", path: "#c2b59b", field: "#4d8a3c", crop: ["#6d8b39", "#8a7a3d"], water: "#2e6c96", sand: "#cdb98a", gravel: "#8b8478", woods: "#3a5a2c", pool: "#3db4d6", park: "#4a8040" },
    w: { wood: "#e4d9c4", brick: "#9a4b3b", masonry: "#c7c0b2", metal: "#8a949c", stone: "#bcb6a8", int: "#ede7dc", edge: "#463f36", glow: null, glass: "#9cc9e6", frame: "#eeeeea" },
    f: { living: ["carpet", "#978877"], bed: ["carpet", "#8d95a4"], kitchen: ["tile", "#dad6cd"], bath: ["tile", "#e2e5e7"], hall: ["wood", "#a3784e"], garage: ["concrete", "#8e8c87"], comm: ["lino", "#ccc5b7"], office: ["carpet", "#66707a"], civic: ["tile", "#c7c0af"], ind: ["concrete", "#7e7c77"], wood: ["wood", "#a3784e"] },
    r: { pat: "shingle", gable: ["#5c5450", "#4d4642"], hip: ["#6a5043", "#594338"], flat: "#7c7971", trim: "#38342f", hvac: "#b7bbbf" },
    fu: { style: "modern", wood: "#8a5a2c", wood2: "#6b4521", fabric: "#58697b", fabric2: "#7a594a", metal: "#99a2aa", white: "#f1f1ed", accent: "#c0392b", glow: null, screen: "#18283a" },
    car: "sedan", tree: "oak", lamp: "street", trash: "paper", flag: "#b22234", weather: "none", tint: "rgba(0,0,0,0)", dark: 0.16 },
  neon: { name: "Neon Megacity", era: "future",
    g: { grass: "#24363a", grass2: "#2a3c40", dirt: "#332e3a", road: "#22222c", road2: "#2a2a36", line: "#ff2bd6", line2: "#22e6ff", walk: "#4a4858", curb: "#6a6884", lot: "#262632", plaza: "#3a3848", drive: "#2a2a34", path: "#3a3946", field: "#1d2b2b", crop: ["#233a2a", "#2a2a3a"], water: "#123a5a", sand: "#3a3440", gravel: "#2f2d38", woods: "#16261f", pool: "#18c8e8", park: "#1d3a30" },
    w: { wood: "#4a495a", brick: "#5a3a4e", masonry: "#484858", metal: "#3a3e4a", stone: "#464656", int: "#34343f", edge: "#0b0b12", glow: "#ff2bd6", glow2: "#22e6ff", glass: "#3fd9ff", frame: "#2a2a36" },
    f: { living: ["carpet", "#2a2238"], bed: ["carpet", "#241f33"], kitchen: ["tile", "#2e2e3a"], bath: ["tile", "#33333f"], hall: ["panel", "#22222e"], garage: ["concrete", "#24242c"], comm: ["panel", "#272734"], office: ["carpet", "#1f2433"], civic: ["panel", "#2a2a38"], ind: ["grate", "#22222a"], wood: ["panel", "#22222e"] },
    r: { pat: "panel", gable: ["#24242e", "#1c1c25"], hip: ["#28232e", "#201c26"], flat: "#1f1f28", trim: "#ff2bd6", hvac: "#3a3a48", neon: true },
    fu: { style: "neon", wood: "#2a2a35", wood2: "#1e1e28", fabric: "#3a1f4a", fabric2: "#1f3a4a", metal: "#4a4e5a", white: "#c8c8d8", accent: "#ff2bd6", glow: "#22e6ff", screen: "#ff2bd6" },
    car: "spinner", tree: "holo", lamp: "holo", trash: "neon", flag: "#ff2bd6", weather: "rain", tint: "rgba(110,0,255,0.05)", dark: 0.34 },
  galactic: { name: "Outer Rim Settlement", era: "future",
    g: { grass: "#c9a46a", grass2: "#d2b07a", dirt: "#b48e5c", road: "#9a7d58", road2: "#8c7150", line: "#e2c78e", line2: "#d9be86", walk: "#c2a77c", curb: "#a88d64", lot: "#a68a62", plaza: "#cdb48a", drive: "#b39670", path: "#d0b385", field: "#c4a06a", crop: ["#b89a62", "#a88a58"], water: "#3a8aa8", sand: "#d4b07a", gravel: "#b09878", woods: "#a88a5a", pool: "#4ab8d0", park: "#bfa06a" },
    w: { wood: "#d8c09a", brick: "#cbb08a", masonry: "#d6bf98", metal: "#8a8f94", stone: "#c9b28c", int: "#e6d6b8", edge: "#6a5638", glow: "#40c4ff", glass: "#5ab4d8", frame: "#7a6a52", rounded: true },
    f: { living: ["sandstone", "#c8b08a"], bed: ["sandstone", "#c2a985"], kitchen: ["plate", "#9a9a94"], bath: ["sandstone", "#d0bc98"], hall: ["sandstone", "#c4ab84"], garage: ["plate", "#8a877f"], comm: ["sandstone", "#c6ad86"], office: ["plate", "#8e8a82"], civic: ["sandstone", "#ccb48c"], ind: ["plate", "#7e7b74"], wood: ["sandstone", "#c4ab84"] },
    r: { pat: "dome", gable: ["#d4bc94", "#c2a882"], hip: ["#cfb68e", "#bba07a"], flat: "#c8ae86", trim: "#8a7454", hvac: "#9aa0a6" },
    fu: { style: "used", wood: "#8a7a62", wood2: "#6e6150", fabric: "#a8784a", fabric2: "#7a6a5a", metal: "#8e949a", white: "#d8d2c4", accent: "#c0582c", glow: "#40c4ff", screen: "#1a3a4a" },
    car: "speeder", tree: "vaporator", lamp: "glowrod", trash: "scrap", flag: "#c0582c", weather: "dust", tint: "rgba(255,170,60,0.05)", dark: 0.18 },
  coruscant: { name: "Core-World Ecumenopolis", era: "future",
    g: { grass: "#5a6068", grass2: "#626870", dirt: "#4a4f56", road: "#25282e", road2: "#2c3036", line: "#59c8ff", line2: "#e8eef4", walk: "#7d838b", curb: "#9aa1a9", lot: "#2a2d33", plaza: "#8a9098", drive: "#6a7078", path: "#9aa1a9", field: "#4e5a52", crop: ["#4e5a52", "#525a62"], water: "#1e5a7a", sand: "#7a7068", gravel: "#5e636a", woods: "#3e4a44", pool: "#2ab0e0", park: "#4a5a50" },
    w: { wood: "#9aa1aa", brick: "#7a7f88", masonry: "#8d939c", metal: "#5c626b", stone: "#a3a9b1", int: "#c8ccd2", edge: "#22262c", glow: "#ff3b4a", glow2: "#59c8ff", glass: "#2c3e52", frame: "#3a4048" },
    f: { living: ["polished", "#3a3f47"], bed: ["polished", "#353a42"], kitchen: ["polished", "#c4c8ce"], bath: ["polished", "#d4d8de"], hall: ["polished", "#2f343b"], garage: ["plate", "#4a4f56"], comm: ["polished", "#3a3f47"], office: ["polished", "#30353c"], civic: ["polished", "#3c4149"], ind: ["plate", "#3e434a"], wood: ["polished", "#2f343b"] },
    r: { pat: "panel", gable: ["#6a707a", "#5a606a"], hip: ["#6e747e", "#5e646e"], flat: "#4e545c", trim: "#ff3b4a", hvac: "#8a9098", pad: true },
    fu: { style: "sleek", wood: "#5a606a", wood2: "#454a52", fabric: "#2a2e36", fabric2: "#6a2a30", metal: "#9aa1aa", white: "#e8ecf0", accent: "#ff3b4a", glow: "#59c8ff", screen: "#0e2a40" },
    car: "hover", tree: "planter", lamp: "holo", trash: "scifi", flag: "#ff3b4a", weather: "none", tint: "rgba(80,120,255,0.04)", dark: 0.3 },
  starship: { name: "Federation Colony", era: "future",
    g: { grass: "#4f8f5f", grass2: "#5a9a68", dirt: "#6a6a5a", road: "#3a4250", road2: "#444c5a", line: "#7fe7ff", line2: "#f0f6fa", walk: "#c8d2da", curb: "#e0e8ee", lot: "#3e4654", plaza: "#d8e0e6", drive: "#b8c2ca", path: "#d0d8de", field: "#4f8f5f", crop: ["#5a9a5a", "#6aa060"], water: "#2a7ab0", sand: "#d8d0b8", gravel: "#a8b0b8", woods: "#3e7a4e", pool: "#40c8f0", park: "#56a066" },
    w: { wood: "#e8eef2", brick: "#d6dee6", masonry: "#e2e8ee", metal: "#b8c2cc", stone: "#dde4ea", int: "#f4f8fa", edge: "#5a6672", glow: "#4fc3ff", glow2: "#ff9c3a", glass: "#8fd8ff", frame: "#c8d2dc", rounded: true },
    f: { living: ["carpet", "#5a6a8a"], bed: ["carpet", "#6a6a8a"], kitchen: ["polished", "#e0e6ea"], bath: ["polished", "#eaeef2"], hall: ["carpet", "#4a5a7a"], garage: ["plate", "#8a949e"], comm: ["polished", "#d8dee4"], office: ["carpet", "#4a5a78"], civic: ["polished", "#dce2e8"], ind: ["plate", "#7a848e"], wood: ["carpet", "#4a5a7a"] },
    r: { pat: "panel", gable: ["#e4eaee", "#cdd5dc"], hip: ["#e0e6ec", "#c8d0d8"], flat: "#d4dce2", trim: "#ff9c3a", hvac: "#b8c2cc", solar: true },
    fu: { style: "clean", wood: "#c8d0d8", wood2: "#a8b2bc", fabric: "#3a5a9a", fabric2: "#9a3a3a", metal: "#c0c8d0", white: "#f4f8fa", accent: "#ff9c3a", glow: "#4fc3ff", screen: "#0a2a4a" },
    car: "hover", tree: "topiary", lamp: "holo", trash: "scifi", flag: "#3a6ad8", weather: "none", tint: "rgba(80,160,255,0.03)", dark: 0.14 },
  colony: { name: "Frontier Colony Base", era: "future",
    g: { grass: "#5d5a55", grass2: "#66625c", dirt: "#4e4a44", road: "#2b2d2f", road2: "#333537", line: "#f2c200", line2: "#d8d8d0", walk: "#5a5e62", curb: "#f2c200", lot: "#2f3133", plaza: "#4e5256", drive: "#45494d", path: "#5e6266", field: "#55524c", crop: ["#5a564e", "#4e4a44"], water: "#2a4a4a", sand: "#6a645a", gravel: "#5a5650", woods: "#3e3c38", pool: "#2a8a8a", park: "#4e4c46" },
    w: { wood: "#6f7478", brick: "#7a6a5a", masonry: "#767b7f", metal: "#5f6468", stone: "#6c7074", int: "#8a8f93", edge: "#1e2124", glow: "#9cff3a", glass: "#3a6a5a", frame: "#3a3e42" },
    f: { living: ["grate", "#4a4f53"], bed: ["plate", "#50555a"], kitchen: ["plate", "#5a5f64"], bath: ["plate", "#62676c"], hall: ["grate", "#45494d"], garage: ["grate", "#3e4246"], comm: ["plate", "#52575c"], office: ["plate", "#4c5156"], civic: ["plate", "#54595e"], ind: ["grate", "#3a3e42"], wood: ["grate", "#45494d"] },
    r: { pat: "metal", gable: ["#5a5f63", "#4c5155"], hip: ["#5e6367", "#505559"], flat: "#4a4f53", trim: "#f2c200", hvac: "#6a7074", pipes: true },
    fu: { style: "industrial", wood: "#5a5f64", wood2: "#45494d", fabric: "#4a5a3a", fabric2: "#5a4a3a", metal: "#7a8086", white: "#b8bcb4", accent: "#f2c200", glow: "#9cff3a", screen: "#0a2a14" },
    car: "apc", tree: "dead", lamp: "flood", trash: "scrap", flag: "#4a5a3a", weather: "steam", tint: "rgba(0,255,160,0.03)", dark: 0.42 },
  frontier: { name: "Rim-World Frontier", era: "future",
    g: { grass: "#8a8a4a", grass2: "#94924f", dirt: "#8b6b4a", road: "#8a6a48", road2: "#7e6142", line: "#8a6a48", line2: "#8a6a48", walk: "#9a7a58", curb: "#7a5c3e", lot: "#866848", plaza: "#a08060", drive: "#93745a", path: "#a68a66", field: "#8f8c48", crop: ["#9a8a48", "#8a7a42"], water: "#4a7a8a", sand: "#c0a070", gravel: "#9a8a72", woods: "#5e6a38", pool: "#4aa0b0", park: "#808a48" },
    w: { wood: "#8a6440", brick: "#8a5a3e", masonry: "#9a8a74", metal: "#7a7f84", stone: "#9a9080", int: "#b89a74", edge: "#3a2818", glow: "#ff7043", glass: "#8ab0b8", frame: "#5a4028" },
    f: { living: ["wood", "#8a6440"], bed: ["wood", "#7e5a3a"], kitchen: ["wood", "#8a6a48"], bath: ["plate", "#8a8a82"], hall: ["wood", "#7a5838"], garage: ["dirt", "#7a6448"], comm: ["wood", "#866240"], office: ["wood", "#7a5a3a"], civic: ["wood", "#866440"], ind: ["plate", "#6e6a62"], wood: ["wood", "#7a5838"] },
    r: { pat: "metal", gable: ["#8a6a52", "#7a5a44"], hip: ["#9a6a4a", "#8a5a3e"], flat: "#7a6a5a", trim: "#c0392b", hvac: "#8a8a82", rust: true },
    fu: { style: "rustic", wood: "#7a5230", wood2: "#5e3e22", fabric: "#9a3a2a", fabric2: "#6a5a3a", metal: "#7a7f84", white: "#d8ccb4", accent: "#c0392b", glow: "#ff7043", screen: "#2a1a10" },
    car: "mule", tree: "scrub", lamp: "lantern", trash: "rustic", flag: "#8a3a2a", weather: "dust", tint: "rgba(255,120,40,0.05)", dark: 0.2 },
  western: { name: "Old West Frontier Town", era: "past",
    g: { grass: "#b8925f", grass2: "#c49c68", dirt: "#a67c52", road: "#a27a50", road2: "#96704a", line: "#a27a50", line2: "#a27a50", walk: "#7a5434", curb: "#6a4a2e", lot: "#a8805a", plaza: "#b48c62", drive: "#a07a54", path: "#b8946a", field: "#a8905a", crop: ["#a89058", "#98804e"], water: "#4a7a8a", sand: "#cfa877", gravel: "#a89070", woods: "#7a7040", pool: "#4a90a0", park: "#9a8a52" },
    w: { wood: "#9a7550", brick: "#a46a48", masonry: "#c8a27a", metal: "#7a6a5a", stone: "#b09a7a", int: "#c4a47e", edge: "#3e2a18", glow: null, glass: "#a8c0c4", frame: "#4a3220" },
    f: { living: ["planks", "#8a6a48"], bed: ["planks", "#86643f"], kitchen: ["planks", "#8e6c4a"], bath: ["planks", "#8a6a48"], hall: ["planks", "#7e5e3e"], garage: ["dirt", "#8a6a48"], comm: ["planks", "#8a6844"], office: ["planks", "#7e5e3e"], civic: ["planks", "#8a6a48"], ind: ["dirt", "#86684a"], wood: ["planks", "#7e5e3e"] },
    r: { pat: "woodshingle", gable: ["#7a5a3e", "#6a4c34"], hip: ["#7e5e40", "#6e5036"], flat: "#8a6a4a", trim: "#4a3220", hvac: "#8a6a4a", falseFront: true },
    fu: { style: "western", wood: "#7a5232", wood2: "#5a3a20", fabric: "#8a2a1a", fabric2: "#6a5a40", metal: "#5a5a5a", white: "#e0d0b0", accent: "#8a2a1a", glow: null, screen: "#2a1a10" },
    car: "wagon", tree: "cactus", lamp: "oil", trash: "west", flag: "#8a2a1a", weather: "dust", tint: "rgba(255,150,60,0.06)", dark: 0.2 },
  desert: { name: "Arrakeen Desert City", era: "future",
    g: { grass: "#c48a50", grass2: "#cc9458", dirt: "#b07a44", road: "#a8743e", road2: "#9c6c3a", line: "#c89a62", line2: "#c89a62", walk: "#b8875a", curb: "#9c6c3a", lot: "#a87444", plaza: "#c09060", drive: "#b0804e", path: "#c49462", field: "#b8844c", crop: ["#a8884a", "#b08a4e"], water: "#3a7a8a", sand: "#d09a5c", gravel: "#a88a68", woods: "#9a7a44", pool: "#3a9ab0", park: "#b08848" },
    w: { wood: "#b9915f", brick: "#a8804e", masonry: "#b48c5c", metal: "#7a6a5a", stone: "#c09a6a", int: "#c8a678", edge: "#4a3218", glow: "#ff9a3a", glass: "#5a6a6a", frame: "#6a4a28" },
    f: { living: ["stone", "#b08a5e"], bed: ["stone", "#a8845a"], kitchen: ["stone", "#b48e62"], bath: ["stone", "#bc9668"], hall: ["stone", "#a88458"], garage: ["stone", "#9a7a52"], comm: ["stone", "#ac8a5e"], office: ["stone", "#a48256"], civic: ["stone", "#b08c60"], ind: ["stone", "#94764e"], wood: ["stone", "#a88458"] },
    r: { pat: "flatstone", gable: ["#b08a5a", "#9e7a4e"], hip: ["#b48c5c", "#a27c50"], flat: "#a8844e", trim: "#6a4a28", hvac: "#8a7a62", windtrap: true },
    fu: { style: "spartan", wood: "#8a6a44", wood2: "#6a4e30", fabric: "#7a3a2a", fabric2: "#3a4a6a", metal: "#a8885a", white: "#e0ceaa", accent: "#3a6ab0", glow: "#ff9a3a", screen: "#2a1a0a" },
    car: "thopter", tree: "palm", lamp: "glowglobe", trash: "sand", flag: "#3a6a2a", weather: "dust", tint: "rgba(255,140,40,0.07)", dark: 0.22 },
  pharaoh: { name: "Goa'uld Dominion World", era: "future",
    g: { grass: "#d6b46c", grass2: "#dcbc76", dirt: "#c4a060", road: "#c2a060", road2: "#b8965a", line: "#d4a537", line2: "#e6c47a", walk: "#d0b07a", curb: "#a8884e", lot: "#c4a464", plaza: "#e0c890", drive: "#cba86c", path: "#dcbc80", field: "#c8a868", crop: ["#b89858", "#c4a060"], water: "#2a8aa0", sand: "#dcbc78", gravel: "#c0a478", woods: "#9a8a4a", pool: "#3ab0c8", park: "#b8a060" },
    w: { wood: "#d9bd82", brick: "#cfae70", masonry: "#d6b97c", metal: "#b8964a", stone: "#e0c890", int: "#ead6a8", edge: "#6a4e1e", glow: "#ffd166", glass: "#3a8aa0", frame: "#b8964a", gold: true },
    f: { living: ["inlay", "#c8a868"], bed: ["inlay", "#c4a464"], kitchen: ["stone", "#cdb07a"], bath: ["stone", "#d6bc86"], hall: ["inlay", "#c0a060"], garage: ["stone", "#b4985e"], comm: ["inlay", "#c8a868"], office: ["inlay", "#bfa062"], civic: ["inlay", "#ccac6c"], ind: ["stone", "#ae925a"], wood: ["inlay", "#c0a060"] },
    r: { pat: "flatstone", gable: ["#d4b47a", "#c4a46a"], hip: ["#d8b87e", "#c8a86e"], flat: "#ccac72", trim: "#d4a537", hvac: "#b8964a", obelisk: true },
    fu: { style: "egyptian", wood: "#8a6a3a", wood2: "#6a4e2a", fabric: "#1e4a8a", fabric2: "#8a1e1e", metal: "#d4a537", white: "#f0e2c0", accent: "#d4a537", glow: "#ffd166", screen: "#2a1e0a" },
    car: "glider", tree: "palm", lamp: "brazier", trash: "sand", flag: "#d4a537", weather: "dust", tint: "rgba(255,190,90,0.05)", dark: 0.15 },
  gothic: { name: "Imperial Hive City", era: "future",
    g: { grass: "#4a4a50", grass2: "#525258", dirt: "#3e3c40", road: "#2e2e33", road2: "#36363c", line: "#6a6a70", line2: "#6a6a70", walk: "#46464c", curb: "#5a5a60", lot: "#323237", plaza: "#4e4e55", drive: "#3e3e44", path: "#55555c", field: "#44443e", crop: ["#4a4a40", "#42423c"], water: "#2a3a4a", sand: "#5a5650", gravel: "#4a4a4e", woods: "#333832", pool: "#3a5a6a", park: "#3e4440" },
    w: { wood: "#4b4b55", brick: "#5a3a3a", masonry: "#55555f", metal: "#3e4048", stone: "#5e5e66", int: "#6a6a72", edge: "#121216", glow: "#ffcc33", glass: "#b8442a", frame: "#c9a227", gold: true },
    f: { living: ["flagstone", "#4a4a52"], bed: ["flagstone", "#46464e"], kitchen: ["flagstone", "#50505a"], bath: ["flagstone", "#56565e"], hall: ["flagstone", "#42424a"], garage: ["plate", "#3e3e46"], comm: ["flagstone", "#4c4c54"], office: ["flagstone", "#44444c"], civic: ["flagstone", "#4e4e56"], ind: ["grate", "#3a3a42"], wood: ["flagstone", "#42424a"] },
    r: { pat: "slate", gable: ["#3a3a44", "#2e2e36"], hip: ["#3e3e48", "#32323a"], flat: "#36363e", trim: "#c9a227", hvac: "#5a5a62", spires: true },
    fu: { style: "gothic", wood: "#3a2a22", wood2: "#2a1e18", fabric: "#7a1a1a", fabric2: "#3a3a4a", metal: "#6a6a72", white: "#c8c0a8", accent: "#c9a227", glow: "#ffcc33", screen: "#1a3a1a" },
    car: "rhino", tree: "dead", lamp: "brazier", trash: "gothic", flag: "#7a1a1a", weather: "ash", tint: "rgba(255,200,120,0.04)", dark: 0.4 },
  wasteland: { name: "Post-Apocalyptic Wasteland", era: "earth",
    g: { grass: "#7a6e4a", grass2: "#857850", dirt: "#6e5e44", road: "#4a4844", road2: "#54524c", line: "#a89a6a", line2: "#a8a490", walk: "#7a766c", curb: "#6a665c", lot: "#4a4842", plaza: "#7e7a70", drive: "#6a665e", path: "#8a8068", field: "#7a6e48", crop: ["#7a6e44", "#6a5e3e"], water: "#3a5a3a", sand: "#a89870", gravel: "#7a7262", woods: "#5a5438", pool: "#5a7a4a", park: "#6e6a48" },
    w: { wood: "#9a8f7a", brick: "#7e5444", masonry: "#8e887a", metal: "#7a5a3a", stone: "#8a847a", int: "#a49c88", edge: "#2a241c", glow: "#76ff03", glass: "#5a6a5a", frame: "#5a4a3a", ruined: true },
    f: { living: ["dirty", "#7a6e5a"], bed: ["dirty", "#746856"], kitchen: ["dirty", "#8a8272"], bath: ["dirty", "#908878"], hall: ["dirty", "#7a6c58"], garage: ["concrete", "#6e6a62"], comm: ["dirty", "#82786a"], office: ["dirty", "#6e665a"], civic: ["dirty", "#847c6c"], ind: ["concrete", "#6a665e"], wood: ["dirty", "#7a6c58"] },
    r: { pat: "patched", gable: ["#6a5e50", "#5a5044"], hip: ["#6e5a4a", "#5e4c3e"], flat: "#5e5a52", trim: "#7a5a3a", hvac: "#6a6058", holes: true },
    fu: { style: "ruined", wood: "#6a4e34", wood2: "#4e3826", fabric: "#6a5a3a", fabric2: "#5a4a3a", metal: "#7a6a5a", white: "#b8b09a", accent: "#76ff03", glow: "#76ff03", screen: "#0e2a0e" },
    car: "rusted", tree: "dead", lamp: "broken", trash: "rubble", flag: "#5a4a3a", weather: "dust", tint: "rgba(160,200,0,0.04)", dark: 0.26 },
  medieval: { name: "Medieval Kingdom", era: "past",
    g: { grass: "#557a3a", grass2: "#5f8442", dirt: "#7a6a4e", road: "#8a7a64", road2: "#7e6e5a", line: "#8a7a64", line2: "#8a7a64", walk: "#8e826e", curb: "#6e624e", lot: "#857560", plaza: "#9a8e78", drive: "#8a7a62", path: "#9a8a6e", field: "#5c8a3c", crop: ["#9a9a48", "#8a8a3e"], water: "#2e6a8a", sand: "#bca478", gravel: "#8a8070", woods: "#3a5a2a", pool: "#3a8aa0", park: "#507a38" },
    w: { wood: "#d8cfb8", brick: "#9a6a4e", masonry: "#8a8478", metal: "#6a6a6a", stone: "#8e887c", int: "#c8bea6", edge: "#3a2c1e", glow: null, glass: "#c8b070", frame: "#4a3a2a", timber: true },
    f: { living: ["planks", "#7a5e40"], bed: ["planks", "#76593c"], kitchen: ["flagstone", "#7e766a"], bath: ["flagstone", "#848074"], hall: ["planks", "#6e5438"], garage: ["straw", "#a8945a"], comm: ["planks", "#7a5e40"], office: ["planks", "#6e5438"], civic: ["flagstone", "#8a8276"], ind: ["straw", "#a08c56"], wood: ["planks", "#6e5438"] },
    r: { pat: "thatch", gable: ["#b89a58", "#a4884c"], hip: ["#b49656", "#a0844a"], flat: "#6a645a", trim: "#4a3a2a", hvac: "#6a645a", chimney: true },
    fu: { style: "medieval", wood: "#6a4a2a", wood2: "#4e341c", fabric: "#7a2a2a", fabric2: "#3a5a3a", metal: "#5a5a5a", white: "#d8ccb0", accent: "#b8902a", glow: null, screen: "#2a1a0a" },
    car: "cart", tree: "oak", lamp: "torch", trash: "straw", flag: "#7a2a2a", weather: "none", tint: "rgba(255,200,120,0.03)", dark: 0.2 },
  wizard: { name: "Wizarding Village", era: "past",
    g: { grass: "#4e7238", grass2: "#587c40", dirt: "#6e5e48", road: "#6e6a64", road2: "#646058", line: "#6e6a64", line2: "#6e6a64", walk: "#7e766a", curb: "#5e5850", lot: "#6a645c", plaza: "#8a8276", drive: "#76706a", path: "#8a8070", field: "#4e7a38", crop: ["#6a7a3a", "#7a7a42"], water: "#2a5a7a", sand: "#a89878", gravel: "#7a7468", woods: "#2e4a26", pool: "#3a7a9a", park: "#4a7036" },
    w: { wood: "#cfc2a4", brick: "#8a4e3e", masonry: "#8a8074", metal: "#6a6070", stone: "#8c8478", int: "#c4b496", edge: "#2e2216", glow: "#ffd166", glass: "#e0b860", frame: "#3e2e1e", timber: true, crooked: true },
    f: { living: ["planks", "#6e4e34"], bed: ["planks", "#6a4a30"], kitchen: ["flagstone", "#7a7266"], bath: ["flagstone", "#807a6e"], hall: ["planks", "#624630"], garage: ["planks", "#6a5038"], comm: ["planks", "#6e4e34"], office: ["planks", "#624630"], civic: ["flagstone", "#847c70"], ind: ["planks", "#6a5038"], wood: ["planks", "#624630"] },
    r: { pat: "slate", gable: ["#4a4250", "#3e3644"], hip: ["#4e4654", "#423a48"], flat: "#4a4450", trim: "#7a1e2e", hvac: "#5a5260", chimney: true },
    fu: { style: "wizard", wood: "#5e3e24", wood2: "#442c18", fabric: "#7a1e2e", fabric2: "#1e3a5e", metal: "#b8902a", white: "#e8dcc0", accent: "#ffd166", glow: "#ffd166", screen: "#2a1e0a" },
    car: "anglia", tree: "oak", lamp: "candle", trash: "letters", flag: "#7a1e2e", weather: "motes", tint: "rgba(255,210,100,0.035)", dark: 0.28 }
};

/* --- hero -> theme ---------------------------------------------------------- */
const CITY_THEME_HERO = {
  0: "galactic", 1: "galactic", 4: "galactic", 5: "galactic", 6: "galactic", 54: "galactic", 79: "galactic",
  2: "coruscant", 3: "coruscant", 76: "coruscant", 77: "coruscant", 78: "coruscant", 55: "coruscant",
  7: "pharaoh", 9: "pharaoh", 8: "modern", 10: "starship", 11: "starship", 12: "medieval",
  13: "frontier", 14: "frontier", 15: "frontier", 16: "frontier", 17: "frontier", 52: "western",
  18: "desert", 19: "desert", 20: "desert", 21: "desert", 50: "desert",
  22: "starship", 23: "starship", 24: "starship", 25: "starship", 26: "starship", 27: "starship",
  28: "colony", 30: "colony", 31: "colony", 32: "colony", 33: "colony", 47: "colony", 29: "modern", 53: "modern",
  34: "gothic", 35: "gothic", 36: "gothic", 37: "gothic", 38: "gothic",
  39: "modern", 40: "modern", 41: "neon", 42: "neon", 43: "wasteland", 44: "wasteland", 51: "modern",
  45: "modern", 46: "modern", 48: "medieval", 49: "modern", 71: "medieval", 72: "medieval", 75: "medieval", 73: "modern", 74: "modern"
};
for (let c = 56; c <= 70; c++) CITY_THEME_HERO[c] = "wizard";
function cityThemeKeyForHero(cid) {
  if (cid === CUSTOM_CID && typeof customCityUniverse === "function") { const u = customCityUniverse(); if (u && CITY_THEMES[u.theme]) return u.theme; }
  return CITY_THEME_HERO[cid] || "modern";
}

/* --- themed signage ----------------------------------------------------------- */
const CITY_SIGNS = {
  gasstore: { modern: "GAS & GO", neon: "VOLT CHARGE", galactic: "TIBANNA FUEL", coruscant: "REPULSOR FUEL", starship: "DEUTERIUM DEPOT", colony: "HYDROGEN DEPOT", frontier: "FUEL & FEED", western: "LAMP OIL & FEED", desert: "WATER SELLERS", pharaoh: "NAQUADAH DEPOT", gothic: "PROMETHIUM DEPOT", wasteland: "GAS-N-RADS", medieval: "STABLES", wizard: "FLOO POWDER CO." },
  diner: { neon: "NOODLE BAR", galactic: "CANTINA", coruscant: "DEX'S DINER", starship: "MESS HALL", colony: "MESS HALL", frontier: "TEA HOUSE", western: "SALOON", desert: "WATER HALL", pharaoh: "FEAST HALL", gothic: "MUNITORUM MESS", wasteland: "NUKA DINER", medieval: "TAVERN", wizard: "THREE BROOMSTICKS" },
  cafe: { neon: "SYNTH-CAF", galactic: "CAF STAND", coruscant: "CAF HOUSE", starship: "REPLICATOR CAFE", western: "BAKERY", medieval: "BAKERY", wizard: "TEA SHOPPE", gothic: "RECAF STALL", wasteland: "BOTTLE CAPS CAFE" },
  bar: { galactic: "CANTINA", coruscant: "OUTLANDER CLUB", neon: "AFTERLIFE", western: "SALOON", frontier: "SALOON", medieval: "ALEHOUSE", wizard: "HOG'S HEAD", gothic: "AMASEC DEN", desert: "SPICE DEN", pharaoh: "MEAD HALL" },
  store: { neon: "24/7 KONBINI", galactic: "JUNK DEALER", coruscant: "MARKET HALL", starship: "PROVISIONS", colony: "COMMISSARY", frontier: "TRADING POST", western: "GENERAL STORE", desert: "SPICE MARKET", pharaoh: "BAZAAR", gothic: "MUNITORUM DEPOT", wasteland: "TRADER", medieval: "GENERAL GOODS", wizard: "HONEYDUKES" },
  grocery: { galactic: "RATION DEPOT", gothic: "RATION HALL", medieval: "MARKET", wizard: "DIAGON MARKET", western: "MERCANTILE", wasteland: "SCAVENGER MARKET" },
  pharmacy: { galactic: "BACTA DISPENSARY", coruscant: "MED SUPPLY", starship: "SICKBAY SUPPLY", neon: "RIPPERDOC", gothic: "APOTHECARIUM", medieval: "APOTHECARY", wizard: "SLUG & JIGGERS", western: "DRUGGIST", wasteland: "STIMPAK SHOP" },
  office: { neon: "ARASAKA OFFICES", galactic: "TRADE GUILD", coruscant: "SENATE OFFICES", starship: "ADMINISTRATION", colony: "WEYLAND-YUTANI", gothic: "ADMINISTRATUM", medieval: "GUILD OFFICES", wizard: "OWL POST", western: "LAND OFFICE", pharaoh: "SCRIBES' HALL", desert: "GUILD OFFICES", wasteland: "VAULT-TEC OFFICE" },
  bank: { galactic: "BANKING CLAN", coruscant: "INTERGALACTIC BANK", neon: "EUROBANK", gothic: "TITHE OFFICE", western: "BANK", medieval: "MONEYLENDER", wizard: "GRINGOTTS", pharaoh: "TREASURY", desert: "CHOAM", wasteland: "BANK (LOOTED)" },
  motel: { galactic: "SPACEPORT HOSTEL", western: "HOTEL", medieval: "INN", wizard: "INN", gothic: "HAB-BLOCK", neon: "CAPSULE HOTEL", desert: "CARAVANSERAI", frontier: "BOARDING HOUSE" },
  library: { wizard: "LIBRARY", gothic: "LIBRARIUM", galactic: "ARCHIVES", coruscant: "JEDI ARCHIVES", starship: "MEMORY ALPHA", medieval: "SCRIPTORIUM" },
  cinema: { neon: "BRAINDANCE", galactic: "HOLO-THEATER", coruscant: "GALAXIES OPERA", starship: "HOLODECK", western: "OPERA HOUSE", medieval: "PLAYHOUSE", wizard: "THEATRE", gothic: "PROPAGANDA HALL" },
  council: { modern: "CITY HALL", neon: "CITY ADMIN", galactic: "GOVERNOR'S HALL", coruscant: "SENATE ANNEX", starship: "FEDERATION COUNCIL", colony: "COLONY ADMIN", frontier: "MAGISTRATE", western: "TOWN HALL", desert: "THE RESIDENCY", pharaoh: "TEMPLE OF RA", gothic: "ADMINISTRATUM", wasteland: "TOWN HALL", medieval: "GUILDHALL", wizard: "MINISTRY OF MAGIC" },
  police: { neon: "NCPD", galactic: "SECURITY", coruscant: "IMPERIAL SECURITY", starship: "SECURITY", colony: "MP STATION", frontier: "ALLIANCE OUTPOST", western: "SHERIFF", desert: "GARRISON", pharaoh: "JAFFA BARRACKS", gothic: "ARBITES PRECINCT", wasteland: "SHERIFF", medieval: "GUARDHOUSE", wizard: "AUROR OFFICE" },
  fire: { galactic: "DROID DEPOT", coruscant: "EMERGENCY SVC", starship: "RESCUE STATION", neon: "TRAUMA TEAM", gothic: "FIRE SHRINE", medieval: "WATCH HOUSE", wizard: "BROOM SHED", western: "FIRE BRIGADE", desert: "WATER GUARD", pharaoh: "GUARD POST" },
  school: { wizard: "SCHOOL OF MAGIC", medieval: "SCRIPTORIUM", gothic: "SCHOLA PROGENIUM", galactic: "PADAWAN ACADEMY", coruscant: "IMPERIAL ACADEMY", starship: "STARFLEET ACADEMY", colony: "TRAINING CENTER", desert: "BENE GESSERIT SCHOOL", pharaoh: "SCHOOL OF SCRIBES", western: "SCHOOLHOUSE" },
  clinic: { galactic: "MED CENTER", coruscant: "MED CENTER", starship: "SICKBAY", colony: "MED BAY", wizard: "ST MUNGO'S", medieval: "APOTHECARY", gothic: "MEDICAE", neon: "TRAUMA CLINIC", western: "DOCTOR", wasteland: "CLINIC" },
  church: { gothic: "CHAPEL OF THE EMPEROR", medieval: "SHRINE", galactic: "TEMPLE", coruscant: "JEDI SHRINE", pharaoh: "SHRINE OF RA", starship: "MEMORIAL", desert: "SIETCH SHRINE", wizard: "CHAPEL", neon: "CHAPEL" },
  warehouse: { galactic: "HANGAR", coruscant: "HANGAR", gothic: "MANUFACTORUM", medieval: "GRANARY", wizard: "STOREHOUSE", western: "LIVERY BARN", desert: "SPICE SILO", pharaoh: "STOREHOUSE", colony: "ATMOSPHERE PLANT" },
  autorepair: { galactic: "SPEEDER REPAIR", coruscant: "SPEEDER BAY", neon: "AUTO DOC", western: "BLACKSMITH", medieval: "SMITHY", wizard: "BROOM REPAIR", gothic: "MECHANICUS SHRINE", desert: "THOPTER BAY", pharaoh: "FORGE" },
  dealership: { galactic: "USED SPEEDERS", coruscant: "SPEEDER SALES", western: "HORSE TRADER", medieval: "HORSE TRADER", wizard: "BROOM SHOP", gothic: "VEHICLE DEPOT" },
  laundromat: { medieval: "WASHHOUSE", wizard: "LAUNDRY", western: "LAUNDRY", galactic: "LAUNDRY DROIDS" },
  hardware: { galactic: "DROID PARTS", medieval: "TOOLMAKER", wizard: "OLLIVANDERS", western: "HARDWARE", gothic: "ARMOURY" },
  post: { wizard: "OWL POST", medieval: "COURIERS", galactic: "HOLONET RELAY", western: "TELEGRAPH" },
  barn: { galactic: "MOISTURE FARM", desert: "SPICE SHED", colony: "STORAGE BAY", gothic: "AGRI-SHED", pharaoh: "GRANARY" }
};
function cityThemedSign(kind, fallback) {
  const t = CITY.themeKey || "modern", m = CITY_SIGNS[kind];
  return (m && m[t]) || fallback || (kind || "").toUpperCase();
}
const CITY_THEME_CITIES = {
  galactic: ["Mos Espa", "Anchorhead", "Mos Eisley", "Bestine", "Mos Pelgo", "Freetown", "Tosche", "Wayfar", "Jundland", "Mos Entha"],
  coruscant: ["Galactic City", "Uscru", "Coco Town", "Five Points", "Senate District", "Westport", "Crimson Corridor", "The Works", "Zi-Kree", "Sah'c Town"],
  starship: ["San Francisco", "Starbase 12", "Utopia Planitia", "Caprica City", "Delphi", "Tycho", "New Paris", "Ceti Alpha", "Vega", "Rigel"],
  pharaoh: ["Nagada", "Chulak", "Dakara", "Hak'tyl", "Abydos", "Netu", "Tartarus", "Kheb", "Hasara", "P3X-888"],
  desert: ["Arrakeen", "Carthag", "Sietch Tabr", "Tuono", "Habbanya", "Red Wall", "Old Gap", "Shield Wall", "Imperial Basin", "Funeral Plain"],
  frontier: ["Persephone", "Whitefall", "Jiangyin", "Paquin", "Beaumonde", "Haven", "Ezra", "Three Hills", "Boros", "Triumph"],
  western: ["San Miguel", "Agua Caliente", "El Paso", "Tucumcari", "Santa Cruz", "Tombstone", "Red Rock", "Dry Gulch", "Sweetwater", "Lago"],
  gothic: ["Hive Primus", "Cadia Secundus", "Macragge Port", "Hive Tertius", "Vigilus", "Necromunda Spire", "Armageddon Prime", "Gathalamor", "Ophelia", "Valhalla"],
  wasteland: ["Megaton", "Diamond City", "Gastown", "Bullet Farm", "Rivet City", "Goodneighbor", "New Reno", "Junktown", "Bartertown", "Novac"],
  medieval: ["Novigrad", "Bree", "Edoras", "Vizima", "Oxenfurt", "Dale", "Minas Tirith", "Tretogor", "Hobbiton", "Dol Amroth"],
  wizard: ["Hogsmeade", "Godric's Hollow", "Ottery St Catchpole", "Little Whinging", "Tinworth", "Upper Flagley", "Little Hangleton", "Mould-on-the-Wold", "Diagon Alley", "Spinner's End"],
  neon: ["Night City", "Watson", "Neo-Tokyo", "Kabuki", "Pacifica", "Westbrook", "Heywood", "Santo Domingo", "City Center", "Japantown"],
  colony: ["Hadley's Hope", "Fiorina", "Reach Base", "Klendathu Station", "UAC Mars", "LV-426", "Sulaco Yard", "Phobos Lab", "Talos", "Tantalus"]
};
function cityName(c) {
  if (!c) return "";
  if (c.idx === 0) return "Nexus City";
  const L = CITY_THEME_CITIES[CITY.themeKey];
  if (L && c.kind < 2 && c.idx - 1 < L.length) return L[c.idx - 1];
  return c.name;
}
const CITY_SHOPS = {
  galactic: ["DROID PARTS", "JUNK SHOP", "BLASTER SHOP", "HOLO-GAMES", "MOISTURE SUPPLY", "PODRACE BETS"],
  coruscant: ["HOLO BOUTIQUE", "DROID SHOP", "CAF BAR", "DATAPAD STORE", "SPEEDER PARTS"],
  neon: ["CYBERWARE", "PAWN // GUNS", "RAMEN", "TATTOO", "BRAINDANCE", "NETRUNNER GEAR"],
  starship: ["REPLICATOR SHOP", "ART GALLERY", "PADD STORE", "TAILOR", "BOOKS"],
  colony: ["SUPPLY", "MED SUPPLY", "TOOLS", "ARMORY", "COMMS"],
  frontier: ["GUNSMITH", "NOODLES", "TAILOR", "TRADING POST", "TEA HOUSE"],
  western: ["GUNSMITH", "BARBER", "UNDERTAKER", "SADDLERY", "ASSAYER", "TELEGRAPH"],
  desert: ["SPICE TRADER", "STILLSUIT MAKER", "WATER SELLER", "WEAPONSMITH", "RUG WEAVER"],
  pharaoh: ["POTTERY", "WEAVER", "GOLDSMITH", "SCRIBE", "INCENSE"],
  gothic: ["RELIQUARY", "ARMOURY", "SERVITOR PARTS", "SCRIPTORIUM", "CANDLEMAKER"],
  wasteland: ["SCRAP TRADER", "GUNS & AMMO", "WATER", "CAPS EXCHANGE", "ROBOT REPAIR"],
  medieval: ["BLACKSMITH", "BAKER", "TAILOR", "FLETCHER", "BUTCHER", "HERBALIST"],
  wizard: ["OLLIVANDERS", "FLOURISH & BLOTTS", "WEASLEYS' WIZARD WHEEZES", "ZONKO'S", "QUALITY QUIDDITCH", "EEYLOPS OWL EMPORIUM", "MADAM MALKIN'S"]
};
function cityBuildingLabel(b) {
  if (!b) return "";
  const t = CITY.themeKey || "modern";
  if (b.kind === "council") return cityThemedSign("council", "CITY HALL") + (b.cityName ? " · " + (t === "modern" ? b.cityName : cityName(CITY.cities.find(c => c.name === b.cityName))).toUpperCase() : "");
  if (t === "modern") return b.name || "";
  if (b.kind === "shop") { const L = CITY_SHOPS[t]; if (L) return L[(b.seed >>> 3) % L.length]; }
  const m = CITY_SIGNS[b.kind];
  return (m && m[t]) || b.name || "";
}
/* --- custom hero (#80): pick a universe in the Hero Creator ------------------------------ */
const CITY_UNIVERSES = {
  auto: { name: "Auto", desc: "Matches your loadout: sabers → the Outer Rim, wands → the Wizarding World, guns → a modern mob war…" },
  outerrim: { name: "Outer Rim", desc: "Tatooine-style adobe town · hunted by Imperial Stormtroopers · Force sense", theme: "galactic", roster: "imperial", vision: 0 },
  core: { name: "Core Worlds", desc: "Durasteel ecumenopolis · Clone Troopers & Jedi · Dark Side sense", theme: "coruscant", roster: "republic", vision: 3 },
  clonewars: { name: "Clone Wars", desc: "Outer Rim town · Separatist droid army (droids hide from the Force)", theme: "galactic", roster: "separatist", vision: 79 },
  stargate: { name: "Stargate", desc: "Sandstone & gold Goa'uld world · Jaffa, Horus Guards, Replicators, Kull", theme: "pharaoh", roster: "goauld", vision: 7 },
  mob: { name: "Mob War", desc: "Modern city · the Bratva & the High Table · keen hearing", theme: "modern", roster: "bratva", vision: 51 },
  manhunt: { name: "Manhunt", desc: "Modern city · LAPD & SWAT · red HUD", theme: "modern", roster: "lapd", vision: 40 },
  matrix: { name: "The Matrix", desc: "Modern city · Agents & Sentinels · read the code", theme: "modern", roster: "agents", vision: 39 },
  cyber: { name: "Cyberpunk", desc: "Neon megacity · Arasaka & Maelstrom · optics scan", theme: "neon", roster: "arasaka", vision: 42 },
  frontier: { name: "Firefly", desc: "Rim-world frontier · Alliance & Reavers · prescience", theme: "frontier", roster: "alliance", vision: 14 },
  west: { name: "Old West", desc: "Frontier town · outlaw gang · gunslinger eyes", theme: "western", roster: "outlaws", vision: 52 },
  dune: { name: "Arrakis", desc: "Desert city · House Harkonnen · prescience", theme: "desert", roster: "harkonnen", vision: 18 },
  trek: { name: "Federation", desc: "Clean colony · the Borg · tricorder scans", theme: "starship", roster: "borg", vision: 22 },
  aliens: { name: "Colony Siege", desc: "Industrial colony · Xenomorph hive · motion tracker", theme: "colony", roster: "xenomorph", vision: 28 },
  doom: { name: "Hell on Mars", desc: "Colony base · demons · Praetor HUD", theme: "colony", roster: "demons", vision: 33 },
  w40k: { name: "Hive City", desc: "Gothic Imperium · Ork WAAAGH! · auspex", theme: "gothic", roster: "orks", vision: 34 },
  waste: { name: "Wasteland", desc: "Ruined city · raiders, ghouls & super mutants · Pip-Boy radar", theme: "wasteland", roster: "wasteland", vision: 43 },
  middle: { name: "Middle-earth", desc: "Medieval kingdom · orcs, wargs & Uruk-hai · Istari sight", theme: "medieval", roster: "orcs", vision: 71 },
  witcher: { name: "The Continent", desc: "Medieval kingdom · bandits & monsters · witcher senses", theme: "medieval", roster: "witcher_foes", vision: 48 },
  wizard: { name: "Wizarding World", desc: "Wizarding village · Death Eaters · Marauder's Map", theme: "wizard", roster: "death_eaters", vision: 56 }
};
function customCityUniverse() {
  const d = typeof customHeroDesign === "function" ? customHeroDesign() : null;
  if (!d || !Array.isArray(d.weapons)) return null;
  const cat = w => (typeof CUSTOM_WEAPONS !== "undefined" && CUSTOM_WEAPONS[w && w.k]) ? CUSTOM_WEAPONS[w.k].cat : "saber";
  let key = d.universe || "auto";
  if (!CITY_UNIVERSES[key] || key === "auto") {
    const cats = d.weapons.map(cat);
    key = cats.includes("magic") ? "wizard" : cats.includes("saber") ? (d.align === "dark" ? "core" : "outerrim") : cats.includes("heavy") ? "aliens"
      : (cats.includes("rifle") || cats.includes("pistol")) ? (d.align === "bounty" ? "west" : "mob") : cats.includes("blade") ? "witcher" : cats.includes("tech") ? "cyber" : "outerrim";
  }
  const U = CITY_UNIVERSES[key], w0 = d.weapons[0], id = (typeof CUSTOM_WEAPONS !== "undefined" && CUSTOM_WEAPONS[w0 && w0.k]) ? CUSTOM_WEAPONS[w0.k].id : 80;
  const sound = (typeof ST_WPN !== "undefined" && ST_WPN[id] && id !== 80) ? ST_WPN[id] : [72, "x", 0];
  return { key, theme: U.theme, roster: U.roster, vision: U.vision, sound };
}
function cityApplyTheme(key) {
  CITY.themeKey = CITY_THEMES[key] ? key : "modern";
  CITY.theme = CITY_THEMES[CITY.themeKey];
  return CITY.theme;
}
cityApplyTheme("modern");
// EOF:js/citythemes.js
