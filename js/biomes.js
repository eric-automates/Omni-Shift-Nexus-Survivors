// FILE: js/biomes.js
// PART: v10 module 6 of 8
// DETAIL: v10 Dynamic Character-Adaptive Biomes — 17 universe themes (Tatooine dunes, Imperial decks, Abydos, Rim frontier,
//         Arrakis, starship decks, Hadley's Hope colony, Val Verde jungle, Hell breach, Imperial hive ruins, neon cyberpunk
//         alleys, Gotham gothic steel, nuclear wasteland, Black Mesa labs, witchwood marsh, ronin valley, castle grounds).
//         Each theme morphs the ground palette & floor pattern, the architecture props, the hazard (with a real gameplay
//         effect on you AND enemies), ambient weather and lighting. Campaign sectors can override the theme.

"use strict";

/* === 1. THEMES === */
// hazard: dps (non-lethal to the hero, like the original hazards), slow 0-1, pull px/s, shock (periodic jolt), enemyMul
const BIOME_THEMES = {
  tatooine:  { name: "Tatooine Dune Sea", base: "#c4a067", blot: ["#b08a52", "#d8bc86"], floor: "sand", spire: "vaporator", crate: "hut", decor: "crystal", decorCol: "#40c4ff",
               hazard: { kind: "pit", name: "Sarlacc Sand Pit", col: "#7a5c3a", dps: 5, slow: 0.45, pull: 45, enemyMul: 2.5 }, weather: "dust", tint: "rgba(255,170,60,0.05)", dark: 0.18, accent: "#ffcc80" },
  deathstar: { name: "Imperial Durasteel Decks", base: "#22262d", blot: ["#1b1e24", "#2b3038"], floor: "plates", spire: "pillar", crate: "crate", decor: "console", decorCol: "#ff1744",
               hazard: { kind: "vent", name: "Reactor Exhaust Vent", col: "#ff6d00", dps: 11, enemyMul: 2.5 }, weather: "none", tint: "rgba(255,0,40,0.04)", dark: 0.35, accent: "#ff5252" },
  abydos:    { name: "Abydos Pyramid Sands", base: "#d2ad67", blot: ["#c09a55", "#e2c487"], floor: "sand", spire: "obelisk", crate: "stone", decor: "crystal", decorCol: "#76ff03",
               hazard: { kind: "pool", name: "Naquadah Radiation Pool", col: "#64dd17", dps: 8, enemyMul: 2.5 }, weather: "dust", tint: "rgba(255,190,90,0.05)", dark: 0.15, accent: "#ffe082" },
  frontier:  { name: "Rim Frontier Badlands", base: "#86583a", blot: ["#744b30", "#9a6a47"], floor: "cracked", spire: "rock", crate: "crate", decor: "cactus", decorCol: "#558b2f",
               hazard: { kind: "bog", name: "Tar Seep", col: "#2b1d14", dps: 3, slow: 0.5, enemyMul: 3 }, weather: "dust", tint: "rgba(255,120,40,0.05)", dark: 0.2, accent: "#ffb74d" },
  arrakis:   { name: "Arrakis Deep Desert", base: "#c1874a", blot: ["#ad763c", "#d39b5c"], floor: "dunes", spire: "rock", crate: "stone", decor: "bloom", decorCol: "#ff9100",
               hazard: { kind: "worm", name: "Sandworm Sign", col: "#8d5a2b", dps: 12, slow: 0.25, pull: 30, enemyMul: 3 }, weather: "sandstorm", tint: "rgba(255,140,40,0.07)", dark: 0.2, accent: "#ffab40" },
  starship:  { name: "Starship Deck", base: "#2c3846", blot: ["#263140", "#34414f"], floor: "plates", spire: "console", crate: "crate", decor: "console", decorCol: "#40c4ff",
               hazard: { kind: "vent", name: "Plasma Conduit Leak", col: "#40c4ff", dps: 10, enemyMul: 2.5 }, weather: "none", tint: "rgba(60,140,255,0.04)", dark: 0.25, accent: "#82b1ff" },
  colony:    { name: "Hadley's Hope Colony", base: "#1d2226", blot: ["#171b1e", "#262c31"], floor: "grate", spire: "stack", crate: "barrel", decor: "egg", decorCol: "#827717",
               hazard: { kind: "pool", name: "Molecular Acid Pool", col: "#c6ff00", dps: 9, enemyMul: 3 }, weather: "steam", tint: "rgba(0,255,180,0.03)", dark: 0.55, accent: "#c6ff00" },
  jungle:    { name: "Val Verde Jungle", base: "#1e3a20", blot: ["#18301a", "#27482a"], floor: "grass", spire: "tree", crate: "crate", decor: "fern", decorCol: "#66bb6a",
               hazard: { kind: "bog", name: "Mud Bog", col: "#3e2c1c", dps: 2, slow: 0.55, enemyMul: 3 }, weather: "rain", tint: "rgba(0,80,20,0.06)", dark: 0.35, accent: "#a5d6a7" },
  hell:      { name: "Hell Breach", base: "#33120e", blot: ["#2a0e0b", "#45180f"], floor: "lava", spire: "bonespire", crate: "altar", decor: "skulls", decorCol: "#ff3d00",
               hazard: { kind: "lava", name: "Lava Pool", col: "#ff3d00", dps: 16, enemyMul: 2.5 }, weather: "embers", tint: "rgba(255,40,0,0.07)", dark: 0.4, accent: "#ff6e40" },
  gothic:    { name: "Imperial Hive Ruins", base: "#37373b", blot: ["#2e2e32", "#424248"], floor: "flagstone", spire: "pillar", crate: "rubble", decor: "skulls", decorCol: "#ffcc00",
               hazard: { kind: "rift", name: "Warp Rift", col: "#aa00ff", dps: 10, pull: 55, enemyMul: 2.5 }, weather: "ash", tint: "rgba(255,200,120,0.03)", dark: 0.35, accent: "#ffd54f" },
  neon:      { name: "Neon Megacity Alleys", base: "#0d0b16", blot: ["#0a0912", "#15121f"], floor: "asphalt", spire: "tower", crate: "dumpster", decor: "neon", decorCol: "#f72585",
               hazard: { kind: "puddle", name: "Electrified Puddle", col: "#4cc9f0", dps: 6, shock: 5, enemyMul: 3 }, weather: "rain", tint: "rgba(120,0,255,0.05)", dark: 0.4, accent: "#f72585" },
  gotham:    { name: "Gotham Gothic Steel", base: "#15181c", blot: ["#101317", "#1d2126"], floor: "asphalt", spire: "gargoyle", crate: "dumpster", decor: "neon", decorCol: "#ffd54f",
               hazard: { kind: "puddle", name: "Live Wire Puddle", col: "#ffd54f", dps: 6, shock: 5, enemyMul: 3 }, weather: "rain", tint: "rgba(255,200,80,0.03)", dark: 0.5, accent: "#ffd54f" },
  wasteland: { name: "Nuclear Wasteland", base: "#655641", blot: ["#584a37", "#73624b"], floor: "cracked", spire: "wreck", crate: "barrel", decor: "bottle", decorCol: "#76ff03",
               hazard: { kind: "pool", name: "Radiation Puddle", col: "#76ff03", dps: 9, enemyMul: 2.5 }, weather: "dust", tint: "rgba(160,200,0,0.04)", dark: 0.25, accent: "#c6ff00" },
  lab:       { name: "Black Mesa Labs", base: "#3a434a", blot: ["#333b41", "#434d55"], floor: "tiles", spire: "pylon", crate: "crate", decor: "crystal", decorCol: "#ff9100",
               hazard: { kind: "pool", name: "Toxic Slime", col: "#aeea00", dps: 10, enemyMul: 2.5 }, weather: "sparks", tint: "rgba(255,140,0,0.03)", dark: 0.3, accent: "#ffab40" },
  darkwood:  { name: "Witchwood Marsh", base: "#1a2318", blot: ["#151d13", "#222d1f"], floor: "forest", spire: "deadtree", crate: "stone", decor: "mushroom", decorCol: "#b388ff",
               hazard: { kind: "bog", name: "Eldritch Swamp", col: "#2e3b1f", dps: 6, slow: 0.45, enemyMul: 3 }, weather: "spores", tint: "rgba(80,0,120,0.05)", dark: 0.5, accent: "#b388ff" },
  feudal:    { name: "Ronin Valley", base: "#4a5d39", blot: ["#3f5131", "#566b43"], floor: "grass", spire: "cherry", crate: "lantern", decor: "fern", decorCol: "#7cb342",
               hazard: { kind: "pool", name: "Koi Pond Shallows", col: "#29b6f6", dps: 0, slow: 0.35, enemyMul: 0 }, weather: "petals", tint: "rgba(255,150,200,0.04)", dark: 0.15, accent: "#f8bbd0" },
  hogwarts:  { name: "Castle Grounds", base: "#2e472d", blot: ["#283e27", "#365335"], floor: "grass", spire: "turret", crate: "trunk", decor: "candles", decorCol: "#ffd166",
               hazard: { kind: "snare", name: "Devil's Snare", col: "#33691e", dps: 4, slow: 0.6, enemyMul: 3 }, weather: "motes", tint: "rgba(255,210,100,0.03)", dark: 0.3, accent: "#ffd166" }
};
const HERO_BIOME = {
  0: "tatooine", 1: "tatooine", 2: "deathstar", 3: "deathstar", 4: "tatooine", 5: "jungle", 6: "tatooine", 54: "tatooine",
  76: "deathstar", 77: "deathstar", 78: "tatooine", 79: "darkwood", 55: "deathstar", 10: "starship", 11: "colony", 17: "wasteland",
  28: "colony", 29: "jungle", 30: "colony", 31: "arrakis", 32: "jungle", 33: "hell", 53: "jungle", 40: "wasteland", 43: "wasteland",
  44: "wasteland", 51: "gotham", 47: "colony", 48: "darkwood", 49: "darkwood", 50: "feudal", 52: "frontier", 71: "darkwood",
  72: "darkwood", 73: "neon", 74: "wasteland", 75: "darkwood"
};
const FACTION_BIOME = ["tatooine", "abydos", "frontier", "arrakis", "starship", "colony", "gothic", "neon", "lab", "darkwood", "hogwarts"];

const biomeState = { key: "tatooine", th: null, weather: [], hazLabelT: 0, shockT: 0, dustT: 0, vig: null, vigKey: "" };

function biomeKeyForHero(cid) {
  if (HERO_BIOME[cid]) return HERO_BIOME[cid];
  const c = CHAR_RAW[cid];
  return FACTION_BIOME[c ? c[1] : 0] || "tatooine";
}
function biomeActive() { return biomeState.th || BIOME_THEMES.tatooine; }

/* === 2. GROUND === */
function bHash(cx, cy, k) { return ((cx * 73856093) ^ (cy * 19349663) ^ (runSeed * 31 + k * 83492791)) >>> 0; }
function bRand(h, k) { return ((Math.imul(h ^ (k * 2654435761), 1597334677) >>> 0) % 10000) / 10000; }

function biomeRenderGround(left, top, viewW, viewH, bRing) {
  if (!player) return false;
  const th = biomeActive(), c = ctx;
  c.fillStyle = th.base; c.fillRect(left, top, viewW, viewH);
  const cs = CHUNK_SIZE, cx0 = Math.floor(left / cs), cx1 = Math.floor((left + viewW) / cs);
  const cy0 = Math.floor(top / cs), cy1 = Math.floor((top + viewH) / cs);

  // global patterns
  if (th.floor === "plates" || th.floor === "tiles" || th.floor === "flagstone") {
    const step = th.floor === "plates" ? 64 : (th.floor === "tiles" ? 32 : 48);
    const gx0 = Math.floor(left / step) * step, gy0 = Math.floor(top / step) * step;
    if (th.floor === "flagstone") {
      for (let gy = gy0; gy < top + viewH; gy += step) {
        const row = Math.round(gy / step), off = (row & 1) ? step / 2 : 0;
        for (let gx = gx0 - step; gx < left + viewW; gx += step) {
          const v = bRand(bHash(Math.round((gx + off) / step), row, 7), 1);
          c.fillStyle = v < 0.33 ? th.blot[0] : (v < 0.66 ? th.base : th.blot[1]);
          c.fillRect(gx + off + 1.5, gy + 1.5, step - 3, step - 3);
        }
      }
    } else {
      c.strokeStyle = th.floor === "plates" ? "rgba(0,0,0,0.35)" : "rgba(255,255,255,0.06)"; c.lineWidth = th.floor === "plates" ? 2 : 1;
      c.beginPath();
      for (let gx = gx0; gx < left + viewW; gx += step) { c.moveTo(gx, top); c.lineTo(gx, top + viewH); }
      for (let gy = gy0; gy < top + viewH; gy += step) { c.moveTo(left, gy); c.lineTo(left + viewW, gy); }
      c.stroke();
      if (th.floor === "plates") {
        c.fillStyle = "rgba(255,255,255,0.08)";
        for (let gx = gx0; gx < left + viewW; gx += step) for (let gy = gy0; gy < top + viewH; gy += step) {
          c.fillRect(gx + 4, gy + 4, 2, 2); c.fillRect(gx + step - 6, gy + 4, 2, 2); c.fillRect(gx + 4, gy + step - 6, 2, 2); c.fillRect(gx + step - 6, gy + step - 6, 2, 2);
        }
      }
    }
  } else if (th.floor === "grate") {
    const step = 18;
    c.strokeStyle = "rgba(0,0,0,0.4)"; c.lineWidth = 1.2; c.beginPath();
    const span = viewW + viewH;
    for (let d = Math.floor((left + top) / step) * step; d < left + top + span; d += step) { c.moveTo(d - top, top); c.lineTo(d - top - viewH, top + viewH); }
    for (let d = Math.floor((left - top) / step) * step - viewH; d < left - top + viewW; d += step) { c.moveTo(d + top, top); c.lineTo(d + top + viewH, top + viewH); }
    c.stroke();
  }

  // per-chunk decals
  for (let cy = cy0; cy <= cy1; cy++) {
    for (let cx = cx0; cx <= cx1; cx++) {
      const h = bHash(cx, cy, 1), bx = cx * cs, by = cy * cs;
      for (let k = 0; k < 3; k++) {
        c.fillStyle = th.blot[k & 1]; c.globalAlpha = 0.55;
        c.beginPath(); c.ellipse(bx + bRand(h, k) * cs, by + bRand(h, k + 9) * cs, 20 + bRand(h, k + 3) * 44, 12 + bRand(h, k + 5) * 26, bRand(h, k + 7) * 3, 0, Math.PI * 2); c.fill();
      }
      c.globalAlpha = 1;
      biomeFloorChunk(th, c, bx, by, h);
    }
  }
  if (bRing && bRing.tint && bRing.tint !== "rgba(0, 0, 0, 0)" && bRing.tint !== "rgba(0,0,0,0)") { c.fillStyle = bRing.tint; c.fillRect(left, top, viewW, viewH); }
  return true;
}

function biomeFloorChunk(th, c, bx, by, h) {
  const cs = CHUNK_SIZE;
  switch (th.floor) {
    case "sand": case "dunes": {
      c.strokeStyle = th.floor === "dunes" ? "rgba(90,50,15,0.22)" : "rgba(110,75,35,0.18)"; c.lineWidth = th.floor === "dunes" ? 3 : 1.4;
      const n = th.floor === "dunes" ? 3 : 5;
      for (let k = 0; k < n; k++) {
        const y = by + (k + 0.5) / n * cs + (bRand(h, k) - 0.5) * 20, amp = 6 + bRand(h, k + 4) * 10, ph = bRand(h, k + 8) * 6;
        c.beginPath(); c.moveTo(bx, y);
        for (let x = 0; x <= cs; x += 32) c.lineTo(bx + x, y + Math.sin(x / 40 + ph) * amp);
        c.stroke();
      }
      break;
    }
    case "cracked": case "lava": {
      c.strokeStyle = th.floor === "lava" ? `rgba(255,${90 + Math.floor(40 * Math.sin(runTime * 3 + h))},0,0.55)` : "rgba(30,15,5,0.35)";
      c.lineWidth = th.floor === "lava" ? 2.2 : 1.3;
      for (let k = 0; k < 3; k++) {
        let x = bx + bRand(h, k) * cs, y = by + bRand(h, k + 11) * cs;
        c.beginPath(); c.moveTo(x, y);
        for (let s = 0; s < 5; s++) { x += (bRand(h, k * 7 + s) - 0.5) * 50; y += (bRand(h, k * 7 + s + 3) - 0.5) * 50; c.lineTo(x, y); }
        c.stroke();
      }
      break;
    }
    case "grass": case "forest": {
      c.strokeStyle = th.floor === "forest" ? "rgba(90,120,60,0.35)" : "rgba(140,200,100,0.28)"; c.lineWidth = 1.2;
      c.beginPath();
      for (let k = 0; k < 16; k++) {
        const x = bx + bRand(h, k) * cs, y = by + bRand(h, k + 40) * cs;
        c.moveTo(x - 3, y); c.lineTo(x, y - 5); c.lineTo(x + 3, y);
      }
      c.stroke();
      if (th.floor === "forest") {
        c.fillStyle = "rgba(120,90,40,0.35)";
        for (let k = 0; k < 8; k++) c.fillRect(bx + bRand(h, k + 70) * cs, by + bRand(h, k + 90) * cs, 3, 2);
      } else if (bRand(h, 99) < 0.6) {
        c.fillStyle = th === BIOME_THEMES.feudal ? "#f8bbd0" : "#fff59d";
        for (let k = 0; k < 5; k++) c.fillRect(bx + bRand(h, k + 120) * cs, by + bRand(h, k + 130) * cs, 2, 2);
      }
      break;
    }
    case "asphalt": {
      c.fillStyle = "rgba(255,255,255,0.05)";
      for (let k = 0; k < 18; k++) c.fillRect(bx + bRand(h, k) * cs, by + bRand(h, k + 50) * cs, 1.5, 1.5);
      for (let k = 0; k < 2; k++) {
        const x = bx + bRand(h, k + 20) * cs, y = by + bRand(h, k + 30) * cs, rw = 18 + bRand(h, k + 33) * 26;
        c.fillStyle = "rgba(20,25,45,0.85)"; c.beginPath(); c.ellipse(x, y, rw, rw * 0.45, 0, 0, Math.PI * 2); c.fill();
        c.strokeStyle = (k & 1 ? "rgba(76,201,240,0.35)" : "rgba(247,37,133,0.35)"); c.lineWidth = 1.5;
        c.beginPath(); c.ellipse(x, y, rw * 0.7, rw * 0.22, 0, 0, Math.PI * 2); c.stroke();
      }
      if (bRand(h, 77) < 0.5) {
        c.fillStyle = "rgba(255,214,0,0.25)";
        for (let k = 0; k < 4; k++) c.fillRect(bx + 20 + k * 60, by + cs * 0.5, 30, 3);
      }
      break;
    }
    case "plates": {
      if (bRand(h, 5) < 0.5) {
        c.fillStyle = th.decorCol; c.globalAlpha = 0.25 + 0.15 * Math.sin(runTime * 2 + h);
        c.fillRect(bx + 16, by + Math.floor(bRand(h, 6) * 4) * 64 + 30, cs - 32, 3); c.globalAlpha = 1;
      }
      break;
    }
    case "grate": case "tiles": {
      if (bRand(h, 3) < 0.6) {
        const x = bx + bRand(h, 4) * (cs - 60), y = by + bRand(h, 5) * (cs - 30);
        c.fillStyle = "rgba(255,214,0,0.22)";
        for (let k = 0; k < 5; k++) { c.beginPath(); c.moveTo(x + k * 12, y); c.lineTo(x + k * 12 + 6, y); c.lineTo(x + k * 12 - 2, y + 10); c.lineTo(x + k * 12 - 8, y + 10); c.fill(); }
      }
      break;
    }
  }
}

/* === 3. PROPS (world objects type 0-3) === */
function biomeDrawObject(o, r) {
  const th = biomeActive(), c = ctx;
  if (o.type === 0) {
    c.save(); c.translate(4, 5); c.fillStyle = "rgba(0,0,0,0.38)"; drawPolyPath(c, o.poly, r); c.fill(); c.restore();
    biomeSpire(c, th.spire, r, o, th);
  } else if (o.type === 1) {
    biomeCrate(c, th.crate, r, o, th);
  } else if (o.type === 2) {
    biomeDecor(c, th.decor, r, o, th);
  } else if (o.type === 3) {
    biomeHazardDraw(c, th.hazard, r, o);
  }
  return true;
}

function biomeSpire(c, style, r, o, th) {
  switch (style) {
    case "vaporator":
      c.fillStyle = "#9e9e9e"; c.beginPath(); c.arc(0, 0, r * 0.55, 0, Math.PI * 2); c.fill();
      c.fillStyle = "#cfd8dc"; c.beginPath(); c.arc(0, 0, r * 0.32, 0, Math.PI * 2); c.fill();
      c.strokeStyle = "#757575"; c.lineWidth = 2.2;
      for (let k = 0; k < 3; k++) { const a = k * 2.09 + 0.5; c.beginPath(); c.moveTo(Math.cos(a) * r * 0.3, Math.sin(a) * r * 0.3); c.lineTo(Math.cos(a) * r * 0.95, Math.sin(a) * r * 0.95); c.stroke(); }
      c.fillStyle = "#ffcc80"; c.fillRect(-1.5, -1.5, 3, 3);
      break;
    case "obelisk":
      c.fillStyle = "#b8925a"; c.save(); c.rotate(Math.PI / 4); c.fillRect(-r * 0.55, -r * 0.55, r * 1.1, r * 1.1);
      c.fillStyle = "#d7b77a"; c.fillRect(-r * 0.32, -r * 0.32, r * 0.64, r * 0.64); c.restore();
      c.fillStyle = th.decorCol; c.globalAlpha = 0.5 + 0.3 * Math.sin(runTime * 2 + o.seed); c.fillRect(-1.5, -r * 0.4, 3, r * 0.8); c.globalAlpha = 1;
      break;
    case "pillar":
      c.fillStyle = th.blot[0]; c.beginPath(); c.arc(0, 0, r * 0.75, 0, Math.PI * 2); c.fill();
      c.strokeStyle = "rgba(255,255,255,0.18)"; c.lineWidth = 2; c.beginPath(); c.arc(0, 0, r * 0.62, 0, Math.PI * 2); c.stroke();
      c.fillStyle = "#555"; c.beginPath(); c.arc(0, 0, r * 0.4, 0, Math.PI * 2); c.fill();
      c.fillStyle = th.accent; c.globalAlpha = 0.6; c.fillRect(-r * 0.75, -1, r * 1.5, 2); c.globalAlpha = 1;
      break;
    case "tree": case "cherry": {
      c.fillStyle = "#4e342e"; c.beginPath(); c.arc(0, 0, r * 0.25, 0, Math.PI * 2); c.fill();
      const cols = style === "cherry" ? ["#f48fb1", "#f8bbd0", "#ec407a"] : ["#1b5e20", "#2e7d32", "#388e3c"];
      for (let k = 0; k < 5; k++) {
        const a = k * 1.256 + (o.seed % 7), d = r * 0.45;
        c.fillStyle = cols[k % 3]; c.globalAlpha = 0.88;
        c.beginPath(); c.arc(Math.cos(a) * d, Math.sin(a) * d, r * 0.55, 0, Math.PI * 2); c.fill();
      }
      c.globalAlpha = 1;
      break;
    }
    case "deadtree":
      c.strokeStyle = "#3e2723"; c.lineWidth = 3; c.lineCap = "round";
      for (let k = 0; k < 5; k++) { const a = k * 1.3 + (o.seed % 5); c.beginPath(); c.moveTo(0, 0); c.lineTo(Math.cos(a) * r, Math.sin(a) * r); c.stroke(); }
      c.fillStyle = "#2d1e1a"; c.beginPath(); c.arc(0, 0, r * 0.3, 0, Math.PI * 2); c.fill();
      c.lineCap = "butt";
      break;
    case "rock":
      c.fillStyle = th.blot[0]; drawPolyPath(c, o.poly, r); c.fill();
      c.fillStyle = "rgba(255,255,255,0.12)"; c.save(); c.scale(0.6, 0.6); c.translate(-r * 0.2, -r * 0.2); drawPolyPath(c, o.poly, r); c.fill(); c.restore();
      c.strokeStyle = "rgba(0,0,0,0.3)"; c.lineWidth = 1.2; drawPolyPath(c, o.poly, r); c.stroke();
      break;
    case "tower": case "gargoyle": {
      c.fillStyle = style === "gargoyle" ? "#23272d" : "#12101c"; drawPolyPath(c, o.poly, r); c.fill();
      c.strokeStyle = style === "gargoyle" ? "#3a4048" : "#2a2440"; c.lineWidth = 1.5; c.stroke();
      if (style === "tower") {
        const g = (o.seed & 1) ? "#f72585" : "#4cc9f0";
        c.strokeStyle = g; c.lineWidth = 2; c.globalAlpha = 0.7 + 0.3 * Math.sin(runTime * 4 + o.seed);
        c.strokeRect(-r * 0.45, -r * 0.2, r * 0.9, r * 0.32); c.globalAlpha = 1;
        c.fillStyle = "#ffe082"; for (let k = 0; k < 4; k++) c.fillRect(-r * 0.4 + k * r * 0.25, r * 0.25, 2, 2);
      } else {
        c.fillStyle = "#3a4048"; c.beginPath(); c.moveTo(-r * 0.4, -r * 0.1); c.lineTo(0, -r * 0.55); c.lineTo(r * 0.4, -r * 0.1); c.fill();
        c.fillStyle = "#ffd54f"; c.fillRect(-r * 0.15, -r * 0.3, 2, 2); c.fillRect(r * 0.1, -r * 0.3, 2, 2);
      }
      break;
    }
    case "console": case "pylon":
      c.fillStyle = "#37474f"; c.fillRect(-r * 0.6, -r * 0.4, r * 1.2, r * 0.8);
      c.fillStyle = th.decorCol; c.globalAlpha = 0.55 + 0.25 * Math.sin(runTime * 3 + o.seed); c.fillRect(-r * 0.45, -r * 0.25, r * 0.9, r * 0.35); c.globalAlpha = 1;
      if (style === "pylon") { c.strokeStyle = th.accent; c.lineWidth = 2; c.beginPath(); c.arc(0, 0, r * 0.8, 0, Math.PI * 2); c.stroke(); }
      break;
    case "stack":
      c.fillStyle = "#2b3238"; c.beginPath(); c.arc(0, 0, r * 0.7, 0, Math.PI * 2); c.fill();
      c.fillStyle = "#11161a"; c.beginPath(); c.arc(0, 0, r * 0.38, 0, Math.PI * 2); c.fill();
      c.strokeStyle = "#ffd600"; c.lineWidth = 2; c.setLineDash([4, 4]); c.beginPath(); c.arc(0, 0, r * 0.55, 0, Math.PI * 2); c.stroke(); c.setLineDash([]);
      break;
    case "turret":
      c.fillStyle = "#6d6d6d"; c.beginPath(); c.arc(0, 0, r * 0.7, 0, Math.PI * 2); c.fill();
      c.fillStyle = "#8a8a8a";
      for (let k = 0; k < 8; k++) { const a = k * 0.785; c.fillRect(Math.cos(a) * r * 0.62 - 2.5, Math.sin(a) * r * 0.62 - 2.5, 5, 5); }
      c.fillStyle = "#4a148c"; c.beginPath(); c.arc(0, 0, r * 0.3, 0, Math.PI * 2); c.fill();
      break;
    case "wreck":
      c.fillStyle = "#6d4c41"; c.save(); c.rotate((o.seed % 6) * 0.5); c.fillRect(-r * 0.7, -r * 0.35, r * 1.4, r * 0.7);
      c.fillStyle = "#3e2723"; c.fillRect(-r * 0.3, -r * 0.3, r * 0.6, r * 0.6); c.fillStyle = "#8d6e63"; c.fillRect(-r * 0.7, -r * 0.35, r * 0.25, r * 0.7); c.restore();
      break;
    case "bonespire":
      c.fillStyle = "#d7ccc8";
      for (let k = 0; k < 5; k++) { const a = k * 1.25 + (o.seed % 4); c.beginPath(); c.moveTo(Math.cos(a) * 3, Math.sin(a) * 3); c.lineTo(Math.cos(a + 0.25) * r, Math.sin(a + 0.25) * r); c.lineTo(Math.cos(a - 0.2) * r * 0.4, Math.sin(a - 0.2) * r * 0.4); c.fill(); }
      c.fillStyle = "#4e1a12"; c.beginPath(); c.arc(0, 0, r * 0.28, 0, Math.PI * 2); c.fill();
      break;
    default:
      c.fillStyle = th.blot[0]; drawPolyPath(c, o.poly, r); c.fill();
  }
}

function biomeCrate(c, style, r, o, th) {
  switch (style) {
    case "barrel":
      c.fillStyle = th === BIOME_THEMES.colony ? "#ffb300" : "#8d6e63"; c.beginPath(); c.arc(0, 0, r * 0.6, 0, Math.PI * 2); c.fill();
      c.strokeStyle = "rgba(0,0,0,0.45)"; c.lineWidth = 1.5; c.beginPath(); c.arc(0, 0, r * 0.42, 0, Math.PI * 2); c.stroke();
      if (th === BIOME_THEMES.wasteland) { c.fillStyle = "#76ff03"; c.fillRect(-2, -2, 4, 4); }
      break;
    case "dumpster":
      c.fillStyle = "#2e5d32"; c.fillRect(-r * 0.8, -r * 0.5, r * 1.6, r);
      c.fillStyle = "#1b3a1e"; c.fillRect(-r * 0.8, -r * 0.5, r * 1.6, r * 0.25);
      break;
    case "stone": case "rubble":
      c.fillStyle = th.blot[1]; drawPolyPath(c, o.poly, r * 0.8); c.fill();
      c.strokeStyle = "rgba(0,0,0,0.3)"; c.lineWidth = 1; c.stroke();
      if (style === "rubble") { c.fillStyle = th.blot[0]; c.fillRect(r * 0.4, r * 0.2, 5, 4); c.fillRect(-r * 0.7, -r * 0.3, 4, 3); }
      break;
    case "hut":
      c.fillStyle = "#d7b98a"; c.beginPath(); c.arc(0, 0, r * 0.8, 0, Math.PI * 2); c.fill();
      c.fillStyle = "#b08a5a"; c.beginPath(); c.arc(0, 0, r * 0.5, 0, Math.PI * 2); c.fill();
      c.fillStyle = "#3e2723"; c.fillRect(-2.5, r * 0.45, 5, r * 0.35);
      break;
    case "altar":
      c.fillStyle = "#4a0e0e"; c.fillRect(-r * 0.6, -r * 0.4, r * 1.2, r * 0.8);
      c.fillStyle = "#ffab40"; c.globalAlpha = 0.6 + 0.4 * Math.sin(runTime * 9 + o.seed);
      c.fillRect(-r * 0.5, -r * 0.55, 2, 3); c.fillRect(r * 0.4, -r * 0.55, 2, 3); c.globalAlpha = 1;
      break;
    case "trunk":
      c.fillStyle = "#5d4037"; c.fillRect(-r * 0.7, -r * 0.45, r * 1.4, r * 0.9);
      c.strokeStyle = "#ffd166"; c.lineWidth = 1.2; c.strokeRect(-r * 0.7, -r * 0.45, r * 1.4, r * 0.9);
      break;
    case "lantern":
      c.fillStyle = "#9e9e9e"; c.fillRect(-r * 0.4, -r * 0.4, r * 0.8, r * 0.8);
      c.fillStyle = "#ffe082"; c.globalAlpha = 0.7 + 0.3 * Math.sin(runTime * 5 + o.seed); c.fillRect(-r * 0.18, -r * 0.18, r * 0.36, r * 0.36); c.globalAlpha = 1;
      break;
    default:
      c.fillStyle = th === BIOME_THEMES.jungle || th === BIOME_THEMES.frontier ? "#6d4c2f" : "#37474f";
      c.fillRect(-r * 0.6, -r * 0.6, r * 1.2, r * 1.2);
      c.strokeStyle = "rgba(0,0,0,0.45)"; c.lineWidth = 1.5;
      c.beginPath(); c.moveTo(-r * 0.6, -r * 0.6); c.lineTo(r * 0.6, r * 0.6); c.moveTo(r * 0.6, -r * 0.6); c.lineTo(-r * 0.6, r * 0.6); c.stroke();
      c.strokeRect(-r * 0.6, -r * 0.6, r * 1.2, r * 1.2);
  }
}

function biomeDecor(c, style, r, o, th) {
  const col = th.decorCol;
  switch (style) {
    case "crystal": case "bloom":
      c.fillStyle = col; c.globalAlpha = 0.25; c.beginPath(); c.arc(0, 0, r * 0.9, 0, Math.PI * 2); c.fill(); c.globalAlpha = 0.9;
      if (style === "bloom") { c.strokeStyle = col; c.lineWidth = 2; c.beginPath(); c.arc(0, 0, r * (0.4 + 0.1 * Math.sin(runTime * 3 + o.seed)), 0, Math.PI * 2); c.stroke(); }
      else for (let k = 0; k < 4; k++) { const a = k * 1.57 + (o.seed % 3); c.beginPath(); c.moveTo(Math.cos(a) * 2, Math.sin(a) * 2); c.lineTo(Math.cos(a + 0.2) * r * 0.8, Math.sin(a + 0.2) * r * 0.8); c.lineTo(Math.cos(a - 0.3) * r * 0.3, Math.sin(a - 0.3) * r * 0.3); c.fill(); }
      c.globalAlpha = 1;
      break;
    case "console":
      c.fillStyle = "#263238"; c.fillRect(-r * 0.5, -r * 0.35, r, r * 0.7);
      c.fillStyle = col; for (let k = 0; k < 3; k++) { c.globalAlpha = (Math.floor(runTime * 3 + k + o.seed) % 3 === 0) ? 1 : 0.3; c.fillRect(-r * 0.35 + k * r * 0.25, -r * 0.1, r * 0.15, r * 0.15); }
      c.globalAlpha = 1;
      break;
    case "egg":
      c.fillStyle = "#5d4037"; c.beginPath(); c.ellipse(0, 0, r * 0.45, r * 0.6, 0, 0, Math.PI * 2); c.fill();
      c.strokeStyle = col; c.lineWidth = 1.2; c.beginPath(); c.moveTo(-r * 0.25, -r * 0.2); c.lineTo(r * 0.25, r * 0.2); c.moveTo(r * 0.25, -r * 0.2); c.lineTo(-r * 0.25, r * 0.2); c.stroke();
      break;
    case "fern": case "cactus":
      c.strokeStyle = col; c.lineWidth = style === "cactus" ? 4 : 1.6; c.lineCap = "round";
      for (let k = 0; k < (style === "cactus" ? 3 : 7); k++) { const a = style === "cactus" ? -Math.PI / 2 + (k - 1) * 0.9 : k * 0.9; c.beginPath(); c.moveTo(0, 0); c.lineTo(Math.cos(a) * r * 0.8, Math.sin(a) * r * 0.8); c.stroke(); }
      c.lineCap = "butt";
      break;
    case "neon":
      c.fillStyle = "#111"; c.fillRect(-r * 0.6, -r * 0.3, r * 1.2, r * 0.6);
      c.strokeStyle = col; c.lineWidth = 2; c.globalAlpha = (Math.sin(runTime * 13 + o.seed) > -0.85) ? 1 : 0.2;   // dodgy neon flicker
      c.strokeRect(-r * 0.5, -r * 0.2, r, r * 0.4); c.globalAlpha = 1;
      break;
    case "skulls":
      c.fillStyle = "#d7ccc8";
      for (let k = 0; k < 4; k++) { c.beginPath(); c.arc((k - 1.5) * 4, (k & 1) * 3, 2.6, 0, Math.PI * 2); c.fill(); }
      c.fillStyle = col; c.globalAlpha = 0.6 + 0.4 * Math.sin(runTime * 8 + o.seed); c.fillRect(-1, -r * 0.6, 2, 3); c.globalAlpha = 1;
      break;
    case "mushroom":
      for (let k = 0; k < 4; k++) {
        const x = (k - 1.5) * 4.5, y = (k & 1) * 4;
        c.fillStyle = col; c.globalAlpha = 0.35; c.beginPath(); c.arc(x, y, 5, 0, Math.PI * 2); c.fill();
        c.globalAlpha = 1; c.beginPath(); c.arc(x, y, 2.2, 0, Math.PI * 2); c.fill();
      }
      break;
    case "bottle":
      c.fillStyle = "#4e342e"; c.fillRect(-r * 0.5, -r * 0.3, r, r * 0.6);
      c.fillStyle = col; c.globalAlpha = 0.8; c.fillRect(-r * 0.3, -r * 0.2, 2, r * 0.4); c.fillRect(r * 0.1, -r * 0.2, 2, r * 0.4); c.globalAlpha = 1;
      break;
    case "candles":
      for (let k = 0; k < 3; k++) {
        const fy = Math.sin(runTime * 2 + k + o.seed) * 2;
        c.fillStyle = "#fff8e1"; c.fillRect((k - 1) * 6 - 1, fy - 2, 2, 5);
        c.fillStyle = col; c.globalAlpha = 0.8; c.beginPath(); c.arc((k - 1) * 6, fy - 3.5, 1.6, 0, Math.PI * 2); c.fill(); c.globalAlpha = 1;
      }
      break;
    default:
      c.fillStyle = col; drawPolyPath(c, o.poly, r * 0.7); c.fill();
  }
}

function biomeHazardDraw(c, hz, r, o) {
  const t = runTime, col = hz.col;
  switch (hz.kind) {
    case "pit": case "worm":
      for (let k = 3; k >= 1; k--) { c.fillStyle = k === 1 ? "rgba(40,25,10,0.75)" : `rgba(90,60,30,${0.15 * k})`; c.beginPath(); c.arc(0, 0, r * k / 3, 0, Math.PI * 2); c.fill(); }
      c.strokeStyle = "rgba(60,35,10,0.5)"; c.lineWidth = 1.5;
      for (let k = 0; k < 3; k++) { const rr = ((t * (hz.kind === "worm" ? 18 : 8) + k * r / 3) % r) || 1; c.beginPath(); c.arc(0, 0, rr, 0, Math.PI * 2); c.stroke(); }
      break;
    case "lava":
      c.fillStyle = "#3e0b00"; drawPolyPath(c, o.poly, r); c.fill();
      c.fillStyle = col; c.globalAlpha = 0.65 + 0.25 * Math.sin(t * 3 + o.seed); c.save(); c.scale(0.78, 0.78); drawPolyPath(c, o.poly, r); c.fill(); c.restore();
      c.globalAlpha = 1; c.fillStyle = "#ffd180"; c.beginPath(); c.arc(Math.sin(t * 2 + o.seed) * r * 0.3, Math.cos(t * 1.7 + o.seed) * r * 0.3, 2.5, 0, Math.PI * 2); c.fill();
      break;
    case "vent":
      c.fillStyle = "#263238"; c.fillRect(-r * 0.7, -r * 0.7, r * 1.4, r * 1.4);
      c.strokeStyle = "#11161a"; c.lineWidth = 2; for (let k = -2; k <= 2; k++) { c.beginPath(); c.moveTo(-r * 0.6, k * r * 0.25); c.lineTo(r * 0.6, k * r * 0.25); c.stroke(); }
      c.fillStyle = col; c.globalAlpha = 0.25 + 0.2 * Math.sin(t * 6 + o.seed); c.fillRect(-r * 0.7, -r * 0.7, r * 1.4, r * 1.4); c.globalAlpha = 1;
      break;
    case "rift":
      c.save(); c.rotate(t * 1.6);
      for (let k = 0; k < 3; k++) { c.strokeStyle = k === 1 ? "#ea80fc" : col; c.lineWidth = 2.5 - k * 0.6; c.globalAlpha = 0.8 - k * 0.2; c.beginPath(); c.arc(0, 0, r * (0.9 - k * 0.25), k, k + 4.2); c.stroke(); }
      c.restore(); c.globalAlpha = 0.35; c.fillStyle = "#12001f"; c.beginPath(); c.arc(0, 0, r * 0.45, 0, Math.PI * 2); c.fill(); c.globalAlpha = 1;
      break;
    case "puddle":
      c.fillStyle = "rgba(10,20,40,0.85)"; c.beginPath(); c.ellipse(0, 0, r, r * 0.6, 0, 0, Math.PI * 2); c.fill();
      c.strokeStyle = col; c.lineWidth = 1.3; c.globalAlpha = 0.85;
      if (Math.sin(t * 17 + o.seed) > 0.2) {
        c.beginPath(); let x = -r * 0.7, y = 0; c.moveTo(x, y);
        for (let k = 0; k < 6; k++) { x += r * 0.25; y = (Math.random() - 0.5) * r * 0.5; c.lineTo(x, y); }
        c.stroke();
      }
      c.globalAlpha = 1;
      break;
    case "snare":
      c.fillStyle = "rgba(20,40,10,0.7)"; c.beginPath(); c.arc(0, 0, r, 0, Math.PI * 2); c.fill();
      c.strokeStyle = col; c.lineWidth = 2; c.lineCap = "round";
      for (let k = 0; k < 6; k++) { const a = k * 1.05 + Math.sin(t + k) * 0.3; c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(Math.cos(a + 0.6) * r * 0.6, Math.sin(a + 0.6) * r * 0.6, Math.cos(a) * r * 0.95, Math.sin(a) * r * 0.95); c.stroke(); }
      c.lineCap = "butt";
      break;
    default: {   // pool / bog
      c.fillStyle = col; c.globalAlpha = hz.kind === "bog" ? 0.85 : 0.5 + 0.1 * Math.sin(t * 2 + o.seed);
      drawPolyPath(c, o.poly, r); c.fill(); c.globalAlpha = 1;
      c.fillStyle = "rgba(255,255,255,0.25)";
      for (let k = 0; k < 2; k++) { const ph = (t * 0.8 + k * 0.5 + o.seed) % 1; c.beginPath(); c.arc(Math.sin(o.seed + k * 3) * r * 0.4, Math.cos(o.seed + k * 2) * r * 0.4, 1 + ph * 2.5, 0, Math.PI * 2); c.fill(); }
    }
  }
  if (player && Math.hypot(player.x - o.x, player.y - o.y) < r + 90) {
    c.fillStyle = "rgba(255,255,255,0.85)"; c.font = "bold 7px monospace"; c.textAlign = "center";
    c.fillText("⚠ " + hz.name.toUpperCase(), 0, -r - 5);
  }
}

/* === 4. HAZARD EFFECTS (hero via world.js, enemies here) === */
function biomeHazardTick(hz, simDt) {
  const H0 = biomeActive().hazard;
  if (H0.dps) player.hp = Math.max(1, player.hp - H0.dps * simDt);
  if (H0.slow) player.hazSlowT = 0.15;
  if (H0.pull && hz) {
    const dx = hz.x - player.x, dy = hz.y - player.y, d = Math.hypot(dx, dy);
    if (d > 4) { player.x += dx / d * H0.pull * simDt; player.y += dy / d * H0.pull * simDt; }
  }
  if (H0.shock) {
    biomeState.shockT -= simDt;
    if (biomeState.shockT <= 0) {
      biomeState.shockT = 0.75;
      player.hp = Math.max(1, player.hp - H0.shock);
      spawnParticles(player.x, player.y, 5, 9, 2.5);
      if (typeof fxShake === "function") fxShake(2.5, 0.15);
      sfx(1800, 300, 0.06, "square", 0.08);
    }
  }
  biomeState.hazLabelT -= simDt;
  if (biomeState.hazLabelT <= 0) {
    biomeState.hazLabelT = 3.5;
    spawnSpeech(player.x, player.y - 18, "⚠ " + H0.name.toUpperCase() + (H0.slow ? ` (-${Math.round(H0.slow * 100)}% SPEED)` : ""), "#ffab40", 1.2);
  }
}

function biomeStep(simDt) {
  const th = biomeActive(), H0 = th.hazard;
  if (player.hazSlowT > 0) player.hazSlowT = Math.max(0, player.hazSlowT - simDt);
  // enemies get cooked / stuck / pulled by the same hazards (lure them in!)
  if ((H0.dps || H0.slow || H0.pull) && H0.enemyMul !== 0) {
    const cx = Math.floor(player.x / CHUNK_SIZE), cy = Math.floor(player.y / CHUNK_SIZE);
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
      const objs = getChunk(cx + dx, cy + dy);
      for (let k = 0; k < objs.length; k++) {
        const o = objs[k];
        if (o.type !== 3) continue;
        const rr = o.rad * o.rad;
        for (let i = 0; i < MAX_E; i++) {
          if (!eAct[i] || eDummy[i]) continue;
          const ex = eX[i] - o.x, ey = eY[i] - o.y;
          if (ex * ex + ey * ey > rr) continue;
          if (H0.dps) { eHP[i] -= H0.dps * (H0.enemyMul || 2.5) * (player.hazardEnemyMul || 1) * simDt; if (eHP[i] <= 0) { killEnemy(i, false); continue; } }
          if (H0.slow) eSlow[i] = Math.max(eSlow[i], 0.25);
          if (H0.pull) { const d = Math.sqrt(ex * ex + ey * ey) || 1; eX[i] -= ex / d * H0.pull * 0.8 * simDt; eY[i] -= ey / d * H0.pull * 0.8 * simDt; }
        }
      }
    }
  }
  // footstep dust on loose ground
  if (th.floor === "sand" || th.floor === "dunes" || th.floor === "cracked") {
    const spd = Math.hypot(player.vx || 0, player.vy || 0);
    biomeState.dustT -= simDt;
    if (spd > 30 && biomeState.dustT <= 0 && player.inVehicle === 0) {
      biomeState.dustT = 0.09;
      spawnPt(player.x + (Math.random() - 0.5) * 6, player.y + 9, (Math.random() - 0.5) * 16, -6, 0.5, 2.2, 12, 5);
    }
  }
}

/* === 5. WEATHER + LIGHTING (screen space) === */
const WEATHER_COUNT = { rain: 110, dust: 45, sandstorm: 120, ash: 60, embers: 45, steam: 22, spores: 40, petals: 36, motes: 40, sparks: 0, none: 0 };
function biomeWeatherReset() {
  const th = biomeActive(), n = opts.weather === false ? 0 : (WEATHER_COUNT[th.weather] || 0) * (opts.lowPart ? 0.4 : 1);
  biomeState.weather = [];
  for (let k = 0; k < n; k++) biomeState.weather.push({ x: Math.random() * W, y: Math.random() * H, s: Math.random(), p: Math.random() * 6.28 });
}

function biomeRenderScreen(c) {
  if (!player) return;
  const th = biomeActive(), w = th.weather, dt = 1 / 60, ps = biomeState.weather;
  if (ps.length) {
    c.save();
    for (let k = 0; k < ps.length; k++) {
      const p = ps[k];
      if (w === "rain") { p.x += (-60 - p.s * 40) * dt; p.y += (520 + p.s * 300) * dt; }
      else if (w === "sandstorm") { p.x += (420 + p.s * 300) * dt; p.y += (60 + p.s * 40) * dt; }
      else if (w === "dust") { p.x += (40 + p.s * 50) * dt; p.y += Math.sin(p.p += dt * 2) * 10 * dt; }
      else if (w === "ash") { p.x += Math.sin(p.p += dt) * 14 * dt; p.y += (24 + p.s * 26) * dt; }
      else if (w === "embers") { p.x += Math.sin(p.p += dt * 3) * 20 * dt; p.y -= (30 + p.s * 40) * dt; }
      else if (w === "steam") { p.y -= (20 + p.s * 25) * dt; p.x += Math.sin(p.p += dt) * 6 * dt; }
      else { p.x += Math.sin(p.p += dt * 1.3) * 18 * dt + 8 * dt; p.y += (w === "petals" ? 20 : -6) * dt + Math.cos(p.p) * 8 * dt; }
      if (p.y > H + 10) { p.y = -10; p.x = Math.random() * W; } else if (p.y < -12) { p.y = H + 10; p.x = Math.random() * W; }
      if (p.x > W + 10) { p.x = -10; p.y = Math.random() * H; } else if (p.x < -12) { p.x = W + 10; }
      if (w === "rain") { c.strokeStyle = "rgba(170,200,255,0.32)"; c.lineWidth = 1; c.beginPath(); c.moveTo(p.x, p.y); c.lineTo(p.x - 3, p.y + 12); c.stroke(); }
      else if (w === "sandstorm") { c.strokeStyle = "rgba(230,170,90,0.28)"; c.lineWidth = 1.2; c.beginPath(); c.moveTo(p.x, p.y); c.lineTo(p.x - 18, p.y - 2); c.stroke(); }
      else {
        const col = w === "dust" ? "rgba(230,200,150,0.35)" : w === "ash" ? "rgba(200,200,200,0.5)" : w === "embers" ? `rgba(255,${120 + Math.floor(p.s * 100)},0,${0.5 + 0.4 * Math.sin(p.p * 3)})`
          : w === "steam" ? "rgba(220,240,240,0.12)" : w === "spores" ? "rgba(178,255,89,0.45)" : w === "petals" ? "rgba(248,187,208,0.8)" : "rgba(255,214,102,0.7)";
        c.fillStyle = col;
        const sz = w === "steam" ? 10 + p.s * 10 : (w === "petals" ? 3 : 1.6 + p.s * 1.6);
        if (w === "steam") { c.beginPath(); c.arc(p.x, p.y, sz, 0, Math.PI * 2); c.fill(); } else c.fillRect(p.x, p.y, sz, sz * (w === "petals" ? 0.6 : 1));
      }
    }
    c.restore();
  }
  if (th.weather === "sparks" && Math.random() < 0.02) spawnParticles(player.x + (Math.random() - 0.5) * 300, player.y + (Math.random() - 0.5) * 300, 6, 14, 2);
  // colour grade + vignette (cached gradient)
  c.fillStyle = th.tint; c.fillRect(0, 0, W, H);
  const vk = W + "x" + H + ":" + th.dark;
  if (biomeState.vigKey !== vk) {
    const g = c.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.25, W / 2, H / 2, Math.max(W, H) * 0.75);
    g.addColorStop(0, "rgba(0,0,0,0)"); g.addColorStop(1, `rgba(0,0,0,${th.dark})`);
    biomeState.vig = g; biomeState.vigKey = vk;
  }
  c.fillStyle = biomeState.vig; c.fillRect(0, 0, W, H);
}

/* === 6. HOOKS === */
V10.onRunStart.push(function biomeRunStart(p) {
  const over = (typeof campaignBiomeFor === "function") ? campaignBiomeFor(p) : null;
  biomeState.key = (over && BIOME_THEMES[over]) ? over : biomeKeyForHero(p.cid);
  biomeState.th = BIOME_THEMES[biomeState.key];
  biomeState.vigKey = ""; biomeState.hazLabelT = 0; biomeState.shockT = 0;
  biomeWeatherReset();
  if (typeof fxBanner === "function" && !p.noSpawns) setTimeout(() => { if (player === p) fxBanner(biomeState.th.name.toUpperCase(), "Hazard: " + biomeState.th.hazard.name, biomeState.th.accent, 2.6); }, 400);
});
V10.onStep.push(biomeStep);
V10.onRenderScreen.unshift(biomeRenderScreen);   // weather & grade go UNDER the other overlays
window.addEventListener("resize", () => { biomeState.vigKey = ""; if (runActive) biomeWeatherReset(); });
// EOF:js/biomes.js
