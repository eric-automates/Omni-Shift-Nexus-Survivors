/* =========================================================================
   OMNI-SHIFT v14 — NEXUS CITY · RENDERER
   The city is painted into 512 px "render tiles" (16 m × 16 m) that are baked
   once (a few per frame, nearest first) and then blitted — ground, roads,
   sidewalks, lots, floors, walls, furniture, street props and the litter of an
   evacuated city. Everything that changes is drawn live on top: swinging /
   sliding doors, decals, supply caches, roofs (hidden for the building you are
   in), the line-of-sight fog (behind walls = greyed out) and labels.
   All materials come from the universe theme (js/citythemes.js).
   ========================================================================= */
"use strict";

const CR = {
  TS: 512, tiles: new Map(), max: 48, pats: new Map(), shades: new Map(),
  bakeMs: 0, baked: 0, bakeBudget: 6, decals: [], roofs: new Map(), roofA: new Map(),
  fogC: null, fogG: null, fogImg: null, fogGen: -1, fogPX: 1e9, fogPY: 1e9, frame: 0, key: ""
};
function crCanvas(w, h) { const c = document.createElement("canvas"); c.width = w; c.height = h; return c; }
function crHashStr(s) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }

/* --- colour helpers -------------------------------------------------------- */
function crRGB(hex) {
  if (hex[0] !== "#") { const m = /rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/.exec(hex); return m ? [+m[1], +m[2], +m[3]] : [128, 128, 128]; }
  const n = parseInt(hex.length === 4 ? hex[1] + hex[1] + hex[2] + hex[2] + hex[3] + hex[3] : hex.slice(1, 7), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
// f > 0 lighten towards white, f < 0 darken towards black
function crSh(hex, f) {
  const k = hex + f; let v = CR.shades.get(k);
  if (v) return v;
  const [r, g, b] = crRGB(hex);
  const m = f >= 0 ? (c => Math.round(c + (255 - c) * f)) : (c => Math.round(c * (1 + f)));
  v = "rgb(" + m(r) + "," + m(g) + "," + m(b) + ")";
  CR.shades.set(k, v);
  return v;
}
function crA(hex, a) { const [r, g, b] = crRGB(hex); return "rgba(" + r + "," + g + "," + b + "," + a + ")"; }
function crRR(g, x, y, w, h, r) {
  g.beginPath();
  if (r <= 0.5) { g.rect(x, y, w, h); return; }
  r = Math.min(r, w / 2, h / 2);
  g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath();
}

/* --- procedural texture patterns -------------------------------------------- */
const CR_PAT = {
  noise(g, S, c, r, n = 260, a = 0.09, sz = 1) { for (let i = 0; i < n; i++) { g.fillStyle = crSh(c, (r() - 0.5) * 2 * a * 2.2); g.fillRect(Math.floor(r() * S), Math.floor(r() * S), sz, sz); } },
  grass(g, S, c, r) { CR_PAT.noise(g, S, c, r, 300, 0.1, 2); g.lineWidth = 1; for (let i = 0; i < 70; i++) { const x = r() * S, y = r() * S; g.strokeStyle = crSh(c, (r() - 0.4) * 0.35); g.beginPath(); g.moveTo(x, y); g.lineTo(x + (r() - 0.5) * 3, y - 2 - r() * 3); g.stroke(); } },
  pasture(g, S, c, r) { CR_PAT.grass(g, S, c, r); for (let i = 0; i < 9; i++) { g.fillStyle = crA("#000000", 0.07); g.beginPath(); g.arc(r() * S, r() * S, 2 + r() * 4, 0, 7); g.fill(); } },
  woods(g, S, c, r) { CR_PAT.grass(g, S, c, r); const L = ["#7a5a2a", "#8a6a2a", "#5a4a2a", "#9a7a3a"]; for (let i = 0; i < 40; i++) { g.fillStyle = L[i & 3]; g.globalAlpha = 0.5; g.fillRect(r() * S, r() * S, 2 + r() * 2, 1 + r() * 2); } g.globalAlpha = 1; },
  dirt(g, S, c, r) { CR_PAT.noise(g, S, c, r, 380, 0.1, 2); for (let i = 0; i < 12; i++) { g.fillStyle = crSh(c, -0.25 + r() * 0.15); g.beginPath(); g.arc(r() * S, r() * S, 0.8 + r() * 1.6, 0, 7); g.fill(); } },
  sand(g, S, c, r) { CR_PAT.noise(g, S, c, r, 200, 0.06, 2); g.strokeStyle = crSh(c, 0.12); g.lineWidth = 1; for (let k = 0; k < 6; k++) { const y0 = r() * S; g.beginPath(); for (let x = 0; x <= S; x += 4) g.lineTo(x, y0 + Math.sin(x * 0.09 + k) * 3); g.stroke(); } },
  packed(g, S, c, r) { CR_PAT.noise(g, S, c, r, 300, 0.08, 2); g.fillStyle = crA("#000000", 0.05); for (let i = 0; i < 5; i++) g.fillRect(r() * S, 0, 2, S); },
  asphalt(g, S, c, r) { CR_PAT.noise(g, S, c, r, 900, 0.12, 1); for (let i = 0; i < 40; i++) { g.fillStyle = crSh(c, 0.18); g.fillRect(r() * S, r() * S, 1, 1); } },
  wet(g, S, c, r) { CR_PAT.asphalt(g, S, c, r); for (let i = 0; i < 6; i++) { g.fillStyle = i & 1 ? "rgba(255,43,214,0.06)" : "rgba(34,230,255,0.06)"; g.fillRect(r() * S, r() * S, 2 + r() * 6, 14 + r() * 30); } },
  cracked(g, S, c, r) { CR_PAT.asphalt(g, S, c, r); g.strokeStyle = crSh(c, -0.4); g.lineWidth = 1; for (let k = 0; k < 4; k++) { let x = r() * S, y = r() * S; g.beginPath(); g.moveTo(x, y); for (let s = 0; s < 6; s++) { x += (r() - 0.5) * 22; y += (r() - 0.5) * 22; g.lineTo(x, y); } g.stroke(); } for (let i = 0; i < 3; i++) { g.fillStyle = crA("#2a2a20", 0.3); g.beginPath(); g.arc(r() * S, r() * S, 3 + r() * 5, 0, 7); g.fill(); } },
  concrete(g, S, c, r) { CR_PAT.noise(g, S, c, r, 400, 0.05, 1); g.fillStyle = crSh(c, -0.18); g.fillRect(0, 0, S, 1); g.fillRect(0, 0, 1, S); },
  walk(g, S, c, r) { CR_PAT.noise(g, S, c, r, 300, 0.05, 1); g.fillStyle = crSh(c, -0.2); g.fillRect(0, 0, S, 1); g.fillRect(0, 0, 1, S); g.fillRect(0, S / 2, S, 1); g.fillRect(S / 2, 0, 1, S); },
  plaza(g, S, c, r) { const q = S / 4; for (let j = 0; j < 4; j++) for (let i = -1; i < 4; i++) { const x = i * q + (j & 1 ? q / 2 : 0); g.fillStyle = crSh(c, (r() - 0.5) * 0.12); g.fillRect(x + 1, j * q + 1, q - 2, q - 2); } },
  cobble(g, S, c, r) { g.fillStyle = crSh(c, -0.35); g.fillRect(0, 0, S, S); const q = 8; for (let j = 0; j < S / q; j++) for (let i = -1; i < S / q + 1; i++) { const x = i * q + (j & 1 ? q / 2 : 0) + 0.5, y = j * q + 0.5; g.fillStyle = crSh(c, (r() - 0.5) * 0.3); crRR(g, x + 0.6, y + 0.6, q - 1.6, q - 1.6, 3); g.fill(); g.fillStyle = crA("#ffffff", 0.08); g.fillRect(x + 2, y + 1.5, q - 5, 1); } },
  flag(g, S, c, r) { g.fillStyle = crSh(c, -0.3); g.fillRect(0, 0, S, S); const split = (x, y, w, h, d) => { if (d > 3 || (w < 22 && h < 22)) { g.fillStyle = crSh(c, (r() - 0.5) * 0.22); g.fillRect(x + 1, y + 1, w - 2, h - 2); return; } if (w > h) { const s = Math.round(w * (0.35 + r() * 0.3)); split(x, y, s, h, d + 1); split(x + s, y, w - s, h, d + 1); } else { const s = Math.round(h * (0.35 + r() * 0.3)); split(x, y, w, s, d + 1); split(x, y + s, w, h - s, d + 1); } }; split(0, 0, S, S, 0); },
  stone(g, S, c, r) { g.fillStyle = crSh(c, -0.28); g.fillRect(0, 0, S, S); for (let j = 0; j < S / 16; j++) for (let i = -1; i < S / 32 + 1; i++) { g.fillStyle = crSh(c, (r() - 0.5) * 0.16); g.fillRect(i * 32 + (j & 1 ? 16 : 0) + 1, j * 16 + 1, 30, 14); } },
  sandstone(g, S, c, r) { g.fillStyle = crSh(c, -0.15); g.fillRect(0, 0, S, S); for (let j = 0; j < S / 32; j++) for (let i = -1; i < S / 64 + 1; i++) { g.fillStyle = crSh(c, (r() - 0.5) * 0.1); crRR(g, i * 64 + (j & 1 ? 32 : 0) + 1.5, j * 32 + 1.5, 61, 29, 5); g.fill(); } CR_PAT.noise(g, S, c, r, 200, 0.05, 2); },
  plate(g, S, c, r) { g.fillStyle = crSh(c, -0.25); g.fillRect(0, 0, S, S); g.fillStyle = c; g.fillRect(1, 1, S - 2, S - 2); g.fillStyle = crSh(c, 0.12); g.fillRect(1, 1, S - 2, 1); g.fillRect(1, 1, 1, S - 2); g.fillStyle = crSh(c, -0.12); g.fillRect(1, S - 2, S - 2, 1); g.fillRect(S - 2, 1, 1, S - 2); g.fillStyle = crSh(c, -0.35); for (const [x, y] of [[5, 5], [S - 6, 5], [5, S - 6], [S - 6, S - 6]]) g.fillRect(x, y, 2, 2); CR_PAT.noise(g, S, c, r, 120, 0.04, 1); },
  hazplate(g, S, c, r) { CR_PAT.plate(g, S, c, r); g.fillStyle = crA("#000000", 0.12); for (let i = 0; i < 3; i++) g.fillRect(r() * S, r() * S, 6 + r() * 10, 2); },
  grate(g, S, c, r) { g.fillStyle = crSh(c, -0.35); g.fillRect(0, 0, S, S); g.fillStyle = c; for (let i = 0; i < S; i += 4) { g.fillRect(i, 0, 2, S); } g.fillStyle = crSh(c, 0.1); for (let j = 0; j < S; j += 8) g.fillRect(0, j, S, 1); },
  panel(g, S, c, r, c2) { g.fillStyle = crSh(c, -0.3); g.fillRect(0, 0, S, S); g.fillStyle = c; g.fillRect(1, 1, S / 2 - 2, S - 2); g.fillRect(S / 2 + 1, 1, S / 2 - 2, S / 2 - 2); g.fillRect(S / 2 + 1, S / 2 + 1, S / 2 - 2, S / 2 - 2); if (c2) { g.fillStyle = crA(c2, 0.35); g.fillRect(S / 2 - 1, 0, 1, S); } CR_PAT.noise(g, S, c, r, 80, 0.04, 1); },
  polished(g, S, c, r) { const q = S / 2; for (let j = 0; j < 2; j++) for (let i = 0; i < 2; i++) { g.fillStyle = crSh(c, ((i + j) & 1) ? 0.03 : -0.03); g.fillRect(i * q, j * q, q, q); } g.fillStyle = crSh(c, -0.18); g.fillRect(0, 0, S, 1); g.fillRect(0, 0, 1, S); g.fillRect(0, q, S, 1); g.fillRect(q, 0, 1, S); const gr = g.createLinearGradient(0, 0, S, S); gr.addColorStop(0, "rgba(255,255,255,0)"); gr.addColorStop(0.5, "rgba(255,255,255,0.06)"); gr.addColorStop(1, "rgba(255,255,255,0)"); g.fillStyle = gr; g.fillRect(0, 0, S, S); },
  inlay(g, S, c, r, c2) { CR_PAT.stone(g, S, c, r); g.strokeStyle = crA(c2 || "#d4a537", 0.55); g.lineWidth = 1.5; g.strokeRect(0.75, 0.75, S - 1.5, S - 1.5); g.beginPath(); g.moveTo(S / 2, S / 2 - 8); g.lineTo(S / 2 + 8, S / 2); g.lineTo(S / 2, S / 2 + 8); g.lineTo(S / 2 - 8, S / 2); g.closePath(); g.stroke(); },
  wood(g, S, c, r) { const h = 8; for (let j = 0; j < S / h; j++) { g.fillStyle = crSh(c, (r() - 0.5) * 0.16); g.fillRect(0, j * h, S, h - 1); g.fillStyle = crSh(c, -0.3); g.fillRect(0, j * h + h - 1, S, 1); const s = Math.floor(r() * S); g.fillRect(s, j * h, 1, h - 1); g.fillStyle = crA("#000000", 0.06); for (let k = 0; k < 3; k++) g.fillRect(r() * S, j * h + 1 + r() * (h - 3), 6 + r() * 14, 1); } },
  planks(g, S, c, r) { const h = 12; for (let j = 0; j < S / h + 1; j++) { g.fillStyle = crSh(c, (r() - 0.5) * 0.24); g.fillRect(0, j * h, S, h - 1); g.fillStyle = crSh(c, -0.42); g.fillRect(0, j * h + h - 1, S, 1); g.fillStyle = crA("#000000", 0.1); for (let k = 0; k < 4; k++) g.fillRect(r() * S, j * h + 2 + r() * (h - 5), 8 + r() * 18, 1); if (r() < 0.4) { g.beginPath(); g.arc(r() * S, j * h + h / 2, 1.5, 0, 7); g.fill(); } } },
  boardwalk(g, S, c, r) { const w = 10; for (let i = 0; i < S / w + 1; i++) { g.fillStyle = crSh(c, (r() - 0.5) * 0.25); g.fillRect(i * w, 0, w - 1, S); g.fillStyle = crSh(c, -0.45); g.fillRect(i * w + w - 1, 0, 1, S); g.fillStyle = crA("#000000", 0.25); g.fillRect(i * w + 2, 3, 1.4, 1.4); g.fillRect(i * w + 2, S - 5, 1.4, 1.4); } },
  carpet(g, S, c, r) { CR_PAT.noise(g, S, c, r, 500, 0.07, 1); },
  tile(g, S, c, r) { g.fillStyle = crSh(c, 0.15); g.fillRect(0, 0, S, S); const q = S / 2; for (let j = 0; j < 2; j++) for (let i = 0; i < 2; i++) { g.fillStyle = crSh(c, (r() - 0.5) * 0.05); g.fillRect(i * q + 1, j * q + 1, q - 1, q - 1); } },
  lino(g, S, c, r) { const q = S / 2; for (let j = 0; j < 2; j++) for (let i = 0; i < 2; i++) { g.fillStyle = crSh(c, ((i + j) & 1) ? 0.06 : -0.04); g.fillRect(i * q, j * q, q, q); } CR_PAT.noise(g, S, c, r, 120, 0.04, 1); },
  dirty(g, S, c, r) { CR_PAT.lino(g, S, c, r); for (let i = 0; i < 5; i++) { g.fillStyle = crA("#2a2010", 0.12 + r() * 0.12); g.beginPath(); g.ellipse(r() * S, r() * S, 3 + r() * 9, 2 + r() * 6, r() * 3, 0, 7); g.fill(); } },
  straw(g, S, c, r) { CR_PAT.noise(g, S, c, r, 200, 0.08, 2); g.lineWidth = 1; for (let i = 0; i < 90; i++) { const x = r() * S, y = r() * S, a = r() * Math.PI, l = 3 + r() * 6; g.strokeStyle = crSh(c, (r() - 0.3) * 0.4); g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l); g.stroke(); } },
  cropH(g, S, c, r) { g.fillStyle = crSh(c, -0.35); g.fillRect(0, 0, S, S); for (let j = 0; j < S; j += 8) { g.fillStyle = crSh(c, (r() - 0.5) * 0.1); g.fillRect(0, j + 1, S, 5); for (let x = 0; x < S; x += 3) { g.fillStyle = crSh(c, 0.12 + r() * 0.1); g.fillRect(x + r() * 2, j + 2 + r() * 2, 1.5, 1.5); } } },
  cropV(g, S, c, r) { g.fillStyle = crSh(c, -0.35); g.fillRect(0, 0, S, S); for (let i = 0; i < S; i += 8) { g.fillStyle = crSh(c, (r() - 0.5) * 0.1); g.fillRect(i + 1, 0, 5, S); for (let y = 0; y < S; y += 3) { g.fillStyle = crSh(c, 0.12 + r() * 0.1); g.fillRect(i + 2 + r() * 2, y + r() * 2, 1.5, 1.5); } } },
  water(g, S, c, r) { g.strokeStyle = crSh(c, 0.18); g.lineWidth = 1; for (let k = 0; k < 10; k++) { const x = r() * S, y = r() * S; g.beginPath(); g.arc(x, y, 6 + r() * 8, Math.PI * 1.15, Math.PI * 1.85); g.stroke(); } },
  gravel(g, S, c, r) { CR_PAT.noise(g, S, c, r, 200, 0.06, 1); for (let i = 0; i < 160; i++) { g.fillStyle = crSh(c, (r() - 0.5) * 0.5); g.beginPath(); g.arc(r() * S, r() * S, 0.7 + r() * 1.1, 0, 7); g.fill(); } }
};
const CR_PAT_SIZE = { asphalt: 128, wet: 128, cracked: 128, concrete: 128, walk: 64, plaza: 64, cobble: 64, flag: 128, stone: 64, sandstone: 128, plate: 64, hazplate: 64, grate: 32, panel: 64, polished: 128, inlay: 64, wood: 64, planks: 64, boardwalk: 64, carpet: 64, tile: 32, lino: 64, dirty: 64, straw: 64, cropH: 64, cropV: 64, water: 128, gravel: 64, grass: 128, pasture: 128, woods: 128, dirt: 128, sand: 128, packed: 128 };
function crPat(name, col, col2) {
  const key = name + "|" + col + "|" + (col2 || "");
  let p = CR.pats.get(key);
  if (p) return p;
  const S = CR_PAT_SIZE[name] || 64, c = crCanvas(S, S), g = c.getContext("2d");
  g.fillStyle = col; g.fillRect(0, 0, S, S);
  (CR_PAT[name] || CR_PAT.noise)(g, S, col, cRng(crHashStr(key)), col2);
  p = g.createPattern(c, "repeat");
  CR.pats.set(key, p);
  return p;
}

/* --- per-theme road / sidewalk / marking styles -------------------------------- */
const CR_ROAD = {
  modern: ["asphalt", "walk", "paint"], neon: ["wet", "panel", "neon"], galactic: ["packed", "sandstone", "none"], coruscant: ["plate", "polished", "light"],
  starship: ["plate", "polished", "light"], colony: ["hazplate", "grate", "hazard"], frontier: ["dirt", "planks", "none"], western: ["dirt", "boardwalk", "none"],
  desert: ["packed", "stone", "none"], pharaoh: ["flag", "stone", "gold"], gothic: ["flag", "flag", "none"], wasteland: ["cracked", "walk", "faded"],
  medieval: ["cobble", "flag", "none"], wizard: ["cobble", "flag", "none"]
};
const CR_FAM = { modern: "earth", ruined: "earth", neon: "scifi", sleek: "scifi", clean: "scifi", industrial: "scifi", used: "scifi", rustic: "rustic", western: "rustic", medieval: "rustic", wizard: "rustic", spartan: "rustic", egyptian: "rustic", gothic: "rustic" };
function crFam() { return CR_FAM[CITY.theme.fu.style] || "earth"; }

/* --- tile cache --------------------------------------------------------------- */
function cityRenderReset() {
  CR.tiles.clear(); CR.roofs.clear(); CR.roofA.clear(); CR.decals.length = 0; CR.fogGen = -1; CR.pats.clear();
  CR.key = CITY.themeKey + "|" + CITY.seed;
}
// v14.1: mark tiles stale but keep drawing them until the re-bake lands (no flat-colour flashes when a car wakes up)
function cityRenderRefresh(lx, ly, w, h) {
  const x0 = Math.floor((lx + CITY.orx) / CR.TS), x1 = Math.floor((lx + w + CITY.orx) / CR.TS);
  const y0 = Math.floor((ly + CITY.ory) / CR.TS), y1 = Math.floor((ly + h + CITY.ory) / CR.TS);
  CR.stale = CR.stale || new Set();
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) { const k = x * 65536 + y; if (CR.tiles.has(k)) CR.stale.add(k); }
  for (const [uid, R] of CR.roofs) if (R.x1 >= x0 * CR.TS && R.x0 <= (x1 + 1) * CR.TS && R.y1 >= y0 * CR.TS && R.y0 <= (y1 + 1) * CR.TS) CR.roofs.delete(uid);
}
function cityRenderInvalidate(lx, ly, w, h) {   // local px rect
  const x0 = Math.floor((lx + CITY.orx) / CR.TS), x1 = Math.floor((lx + w + CITY.orx) / CR.TS);
  const y0 = Math.floor((ly + CITY.ory) / CR.TS), y1 = Math.floor((ly + h + CITY.ory) / CR.TS);
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) CR.tiles.delete(x * 65536 + y);
  for (const [uid, R] of CR.roofs) if (R.x1 >= x0 * CR.TS && R.x0 <= (x1 + 1) * CR.TS && R.y1 >= y0 * CR.TS && R.y0 <= (y1 + 1) * CR.TS) CR.roofs.delete(uid);
}
function crClassGround(cls) {
  const g = CITY.theme.g;
  switch (cls) {
    case CL_FARM: return ["pasture", g.field];
    case CL_URBAN: return ["grass", g.grass2];
    case CL_DOWNTOWN: return ["plaza", g.plaza];
    case CL_INDUSTRIAL: return ["gravel", g.gravel];
    case CL_FOREST: return ["woods", g.woods];
    default: return ["grass", g.grass];
  }
}

/* --- roads ---------------------------------------------------------------------- */
// all road bands overlapping a metre rect: { ax: 0 vertical | 1 horizontal, c: centre, w, sw, hw, r, a0, a1 (span), cuts: [[p0, p1]...] }
function crRoads(m0x, m0y, m1x, m1y) {
  const out = [];
  const mx0 = Math.max(0, Math.floor((m0x - 20) / 1000)), mx1 = Math.min(64, Math.floor((m1x + 20) / 1000));
  const my0 = Math.max(0, Math.floor((m0y - 20) / 1000)), my1 = Math.min(64, Math.floor((m1y + 20) / 1000));
  for (let my = my0; my <= my1; my++) for (let mx = mx0; mx <= mx1; mx++) {
    const S = cityCell(mx, my);
    const hyU = S.hy.slice(0, -1), vxU = S.vx.slice(0, -1);
    for (let i = 0; i < vxU.length; i++) {
      const l = vxU[i];
      if (l.x + l.w / 2 < m0x - 2 || l.x - l.w / 2 > m1x + 2 || (my + 1) * 1000 < m0y - 2 || my * 1000 > m1y + 2) continue;
      let cross = S.hy;
      if (i === 0 && mx > 0) cross = cross.concat(cityCell(mx - 1, my).hy);   // T-junctions from the west
      out.push({ ax: 0, c: l.x, w: l.w, sw: l.sw, hw: l.hw, r: l.r, a0: my * 1000, a1: (my + 1) * 1000, cross, cls: S.cls });
    }
    for (let j = 0; j < hyU.length; j++) {
      const l = hyU[j];
      if (l.y + l.w / 2 < m0y - 2 || l.y - l.w / 2 > m1y + 2 || (mx + 1) * 1000 < m0x - 2 || mx * 1000 > m1x + 2) continue;
      let cross = S.vx;
      if (j === 0 && my > 0) cross = cross.concat(cityCell(mx, my - 1).vx);
      out.push({ ax: 1, c: l.y, w: l.w, sw: l.sw, hw: l.hw, r: l.r, a0: mx * 1000, a1: (mx + 1) * 1000, cross, cls: S.cls });
    }
  }
  // segments between crossing streets (for curbs, markings, crosswalks)
  for (const R of out) {
    const cs = R.cross.map(q => [(R.ax === 0 ? q.y : q.x) - q.w / 2, (R.ax === 0 ? q.y : q.x) + q.w / 2]).filter(q => q[1] > R.a0 - 40 && q[0] < R.a1 + 40).sort((a, b) => a[0] - b[0]);
    const segs = []; let p = R.a0 - 40;
    for (const [q0, q1] of cs) { if (q0 > p + 0.5) segs.push([p, q0]); p = Math.max(p, q1); }
    if (R.a1 + 40 > p + 0.5) segs.push([p, R.a1 + 40]);
    R.segs = segs.map(([a, b]) => [Math.max(a, R.a0 - 40), Math.min(b, R.a1 + 40)]).filter(s => s[1] > s[0] + 0.5);
    R.inter = cs;
  }
  return out;
}
function crRect(g, R, a0, a1, off0, off1) {   // rect in metres along/across a road band -> px
  if (R.ax === 0) g.fillRect((R.c + off0) * 32, a0 * 32, (off1 - off0) * 32, (a1 - a0) * 32);
  else g.fillRect(a0 * 32, (R.c + off0) * 32, (a1 - a0) * 32, (off1 - off0) * 32);
}
function crRoadPass(g, roads, pass) {
  const T = CITY.theme, st = CR_ROAD[CITY.themeKey] || CR_ROAD.modern;
  if (pass === 0) {        // sidewalks / shoulders: the full band
    for (const R of roads) {
      if (R.sw > 0) { g.fillStyle = crPat(st[1], T.g.walk); crRect(g, R, R.a0, R.a1, -R.w / 2, R.w / 2); }
      else if (!R.hw) { g.fillStyle = crPat("gravel", T.g.gravel); crRect(g, R, R.a0, R.a1, -R.w / 2, R.w / 2); }
    }
    return;
  }
  if (pass === 1) {        // driving surface
    for (const R of roads) {
      const half = R.sw > 0 ? R.w / 2 - R.sw : R.w / 2 - (R.hw ? 0 : 0.6);
      g.fillStyle = crPat(st[0], R.hw && st[0] === "dirt" ? T.g.road2 : T.g.road);
      crRect(g, R, R.a0 - (R.sw > 0 ? 0 : 0), R.a1, -half, half);
    }
    return;
  }
  // pass 2: curbs, markings, crosswalks
  const mk = st[2];
  for (const R of roads) {
    const half = R.sw > 0 ? R.w / 2 - R.sw : R.w / 2 - (R.hw ? 0 : 0.6);
    for (const [s0, s1] of R.segs) {
      if (R.sw > 0) {   // curb lines
        g.fillStyle = T.g.curb; crRect(g, R, s0, s1, -half - 0.12, -half); crRect(g, R, s0, s1, half, half + 0.12);
        g.fillStyle = "rgba(0,0,0,0.18)"; crRect(g, R, s0, s1, -half, -half + 0.12); crRect(g, R, s0, s1, half - 0.12, half);
      }
      if (mk === "none") continue;
      const len = s1 - s0, dash = (a, b, off, w, col, on, gap) => { g.fillStyle = col; for (let p = a; p < b; p += on + gap) crRect(g, R, p, Math.min(b, p + on), off - w / 2, off + w / 2); };
      const glow = mk === "neon" || mk === "light";
      if (glow) { g.save(); g.shadowColor = mk === "neon" ? T.g.line : T.g.line; g.shadowBlur = 6; }
      if (R.hw) {   // interstate: median barrier, lane dashes, edge lines
        g.fillStyle = mk === "hazard" ? T.g.line : "#9a9a96"; crRect(g, R, s0, s1, -0.45, 0.45);
        g.fillStyle = "rgba(0,0,0,0.25)"; crRect(g, R, s0, s1, 0.45, 0.6);
        g.fillStyle = T.g.line2; crRect(g, R, s0, s1, -half + 1.2, -half + 1.35); crRect(g, R, s0, s1, half - 1.35, half - 1.2);
        for (const off of [-10.2, -6.6, 6.6, 10.2]) dash(s0 + 1, s1 - 1, off, 0.15, T.g.line2, 3, 6);
        g.fillStyle = T.g.line; crRect(g, R, s0, s1, -1.1, -0.95); crRect(g, R, s0, s1, 0.95, 1.1);
      } else if (len > 3) {
        const a = s0 + 0.6, b = s1 - 0.6;
        if (R.r <= 1 && mk !== "hazard") { g.fillStyle = mk === "faded" ? crA(T.g.line, 0.45) : T.g.line; crRect(g, R, a, b, -0.22, -0.1); crRect(g, R, a, b, 0.1, 0.22); }
        else if (R.r === 2 || mk === "hazard") dash(a, b, 0, 0.14, mk === "faded" ? crA(T.g.line, 0.4) : T.g.line, mk === "hazard" ? 1.2 : 3, mk === "hazard" ? 1.2 : 4);
        if (half * 2 >= 12) for (const off of [-half / 2, half / 2]) dash(a, b, off, 0.12, T.g.line2, 3, 6);
        // crosswalks at both ends (urban streets with sidewalks)
        if (R.sw > 0 && (R.cls === CL_URBAN || R.cls === CL_DOWNTOWN || R.r <= 1) && mk !== "hazard") {
          g.fillStyle = mk === "faded" ? "rgba(230,230,220,0.45)" : (glow ? crA(T.g.line2, 0.8) : "#e8e8e2");
          for (const end of [s0, s1]) {
            if (end <= R.a0 - 39 || end >= R.a1 + 39) continue;
            const p0 = end === s0 ? s0 + 0.5 : s1 - 3.5;
            for (let q = -half + 0.4; q < half - 0.4; q += 1.0) crRect(g, R, p0, p0 + 3, q, q + 0.5);
          }
        }
      }
      if (glow) g.restore();
    }
  }
}

/* --- block surfaces ----------------------------------------------------------- */
const CR_SURF_ORDER = { field: 0, pasture: 0, crop: 0, woods: 1, clearing: 1, grass: 1, park: 1, yard: 1, gravel: 2, lot: 3, plaza: 3, drive: 4, path: 4, walk: 5, water: 6, pool: 7 };
function crSurface(g, s) {
  const T = CITY.theme, X = s.x0 * 16, Y = s.y0 * 16, W = (s.x1 - s.x0) * 16, H = (s.y1 - s.y0) * 16;
  const road = CR_ROAD[CITY.themeKey] || CR_ROAD.modern;
  switch (s.t) {
    case "lot": g.fillStyle = crPat(road[0] === "dirt" || road[0] === "cobble" ? road[0] : (road[0] === "wet" ? "wet" : "asphalt"), T.g.lot); g.fillRect(X, Y, W, H); break;
    case "drive": g.fillStyle = crPat(road[0] === "dirt" ? "dirt" : road[0] === "cobble" ? "cobble" : "concrete", T.g.drive); g.fillRect(X, Y, W, H); break;
    case "walk": g.fillStyle = crPat(road[1], T.g.walk); g.fillRect(X, Y, W, H); break;
    case "path": g.fillStyle = crPat(road[0] === "plate" ? "polished" : "gravel", T.g.path); g.fillRect(X, Y, W, H); break;
    case "plaza": g.fillStyle = crPat("plaza", T.g.plaza); g.fillRect(X, Y, W, H); break;
    case "gravel": g.fillStyle = crPat("gravel", T.g.gravel); g.fillRect(X, Y, W, H); break;
    case "yard": case "grass": case "clearing": g.fillStyle = crPat("grass", s.t === "clearing" ? crSh(T.g.grass, 0.08) : T.g.grass); g.fillRect(X, Y, W, H); break;
    case "park": g.fillStyle = crPat("grass", T.g.park); g.fillRect(X, Y, W, H); g.fillStyle = "rgba(255,255,255,0.035)"; for (let x = X; x < X + W; x += 96) g.fillRect(x, Y, 48, H); break;
    case "woods": g.fillStyle = crPat("woods", T.g.woods); g.fillRect(X, Y, W, H); break;
    case "pasture": g.fillStyle = crPat("pasture", T.g.field); g.fillRect(X, Y, W, H); break;
    case "crop": g.fillStyle = crPat(s.v & 1 ? "cropV" : "cropH", T.g.crop[(s.v >> 1) & 1]); g.fillRect(X, Y, W, H); break;
    case "field": {   // sports field with lines
      g.fillStyle = crPat("grass", crSh(T.g.park, 0.05)); g.fillRect(X, Y, W, H);
      g.fillStyle = "rgba(255,255,255,0.05)"; for (let x = X; x < X + W; x += 64) g.fillRect(x, Y, 32, H);
      g.strokeStyle = "rgba(255,255,255,0.75)"; g.lineWidth = 3; g.strokeRect(X + 16, Y + 16, W - 32, H - 32);
      g.beginPath(); if (W > H) { g.moveTo(X + W / 2, Y + 16); g.lineTo(X + W / 2, Y + H - 16); } else { g.moveTo(X + 16, Y + H / 2); g.lineTo(X + W - 16, Y + H / 2); } g.stroke();
      g.beginPath(); g.arc(X + W / 2, Y + H / 2, Math.min(W, H) * 0.14, 0, 7); g.stroke();
      break;
    }
    case "water": {   // elliptical lake with a sandy shore
      const cx = X + W / 2, cy = Y + H / 2;
      g.fillStyle = crPat("sand", T.g.sand); g.beginPath(); g.ellipse(cx, cy, W / 2 + 22, H / 2 + 22, 0, 0, 7); g.fill();
      g.fillStyle = crPat("water", crSh(T.g.water, 0.15)); g.beginPath(); g.ellipse(cx, cy, W / 2 + 6, H / 2 + 6, 0, 0, 7); g.fill();
      g.fillStyle = crPat("water", T.g.water); g.beginPath(); g.ellipse(cx, cy, W / 2 - 10, H / 2 - 10, 0, 0, 7); g.fill();
      g.fillStyle = crA("#000000", 0.12); g.beginPath(); g.ellipse(cx, cy, W / 2 * 0.6, H / 2 * 0.6, 0, 0, 7); g.fill();
      break;
    }
    case "pool": {
      g.fillStyle = crSh(T.g.walk, 0.25); g.fillRect(X - 8, Y - 8, W + 16, H + 16);
      g.fillStyle = crPat("water", T.g.pool); g.fillRect(X, Y, W, H);
      g.fillStyle = "rgba(255,255,255,0.18)"; g.fillRect(X, Y, W, 3); g.fillStyle = "rgba(0,0,0,0.12)"; g.fillRect(X, Y + H - 3, W, 3);
      break;
    }
    default: g.fillStyle = crPat("grass", T.g.grass); g.fillRect(X, Y, W, H);
  }
}
// EOF part 1 (cityrender.js continues)

/* --- buildings ------------------------------------------------------------------ */
const CR_ROOMCAT = {
  living: "living", unitliving: "living", dining: "living", cabin: "living", dayroom: "living", waiting: "hall", lobby: "hall", reception: "hall", hall: "hall",
  bed: "bed", master: "bed", motelunit: "bed", dorm: "bed", kitchen: "kitchen", kitchenpro: "kitchen", break: "kitchen", cafeteria: "kitchen", concession: "comm",
  bath: "bath", restroom: "bath", locker: "bath", laundry: "bath", laundromat: "bath", exam: "bath", lab: "bath",
  garage: "garage", bay: "garage", shed: "garage", barn: "garage", warehouse: "ind", storage: "ind",
  sales: "comm", shop: "comm", grocery: "comm", pharmacy: "comm", dinerfront: "comm", bar: "comm", showroom: "comm", teller: "comm",
  office: "office", openoffice: "office", conference: "office", records: "office", mayor: "office", bullpen: "office", interrogation: "office", classroom: "office", library: "wood",
  chamber: "civic", nave: "civic", auditorium: "civic", gym: "wood", armory: "ind", vault: "civic", cell: "ind"
};
function crRoomFloor(type, b) {
  const T = CITY.theme, cat = CR_ROOMCAT[type] || "hall", f = T.f[cat] || T.f.hall;
  if (b && b.type === "barn") return ["straw", "#a8945a"];
  return f;
}
function crCellAxis(G, x, y) {   // is this wall cell part of a horizontal (x) run?
  const a = G.c[y * G.w + x - 1], b = G.c[y * G.w + x + 1];
  const wallish = v => v === IC_EXT || v === IC_INT || v === IC_WIN || v === IC_GDOOR || v === IC_BARS || v === IC_DOOR || v === IC_EDOOR;
  return (x > 0 && wallish(a)) || (x < G.w - 1 && wallish(b));
}
function crBuilding(g, b, tx0, ty0, tx1, ty1, layer) {
  const G = cityInterior(b), T = CITY.theme, bx = b.x, by = b.y, W = G.w;
  const x0 = Math.max(tx0 - 1, bx) - bx, x1 = Math.min(tx1 + 1, bx + G.w) - bx, y0 = Math.max(ty0 - 1, by) - by, y1 = Math.min(ty1 + 1, by + G.h) - by;
  if (x1 <= x0 || y1 <= y0) return;
  const ext = T.w[b.mat] || T.w.masonry, intC = crSh(T.w.int, -0.32), edge = T.w.edge;
  if (layer === 0) {
    // drop shadow
    g.fillStyle = "rgba(0,0,0,0.22)";
    for (const q of (G.parts && G.parts.length ? G.parts : [{ x: 0, y: 0, w: G.w, h: G.h }])) g.fillRect((bx + q.x) * 16 + 5, (by + q.y) * 16 + 6, q.w * 16, q.h * 16);
    // neon / sci-fi signage spills light on the pavement in front
    if (T.w.glow && (b.type === "commercial" || b.type === "civic" || b.type === "motel" || b.type === "shoprow") && (CITY.themeKey === "neon" || CITY.themeKey === "coruscant" || CITY.themeKey === "starship" || CITY.themeKey === "colony")) {
      const f = b.front || "S", cx = (bx + G.w / 2) * 16, cy = (by + G.h / 2) * 16, off = (f === "S" || f === "N" ? G.h : G.w) * 8 + 26;
      const gx = cx + (f === "E" ? off : f === "W" ? -off : 0), gy = cy + (f === "S" ? off : f === "N" ? -off : 0), R = Math.max(G.w, G.h) * 9;
      for (const [col, k] of [[T.w.glow, 1], [T.w.glow2 || T.w.glow, 0.6]]) { const gr = g.createRadialGradient(gx, gy, 4, gx, gy, R * k); gr.addColorStop(0, crA(col, CITY.themeKey === "neon" ? 0.22 : 0.12)); gr.addColorStop(1, crA(col, 0)); g.fillStyle = gr; g.beginPath(); g.arc(gx, gy, R * k, 0, 7); g.fill(); }
    }
    // footprint floor
    const [fp, fc] = crRoomFloor("hall", b);
    g.fillStyle = crPat(fp, fc);
    for (let y = y0; y < y1; y++) {
      let run = -1;
      for (let x = x0; x <= x1; x++) {
        const inside = x < x1 && G.c[y * W + x] !== IC_OUT;
        if (inside && run < 0) run = x; else if (!inside && run >= 0) { g.fillRect((bx + run) * 16, (by + y) * 16, (x - run) * 16, 16); run = -1; }
      }
    }
    for (const rm of G.rooms) {
      if (rm.x + rm.w < x0 || rm.x > x1 || rm.y + rm.h < y0 || rm.y > y1) continue;
      const [p, c] = crRoomFloor(rm.type, b);
      g.fillStyle = crPat(p, c, T.w.glow || null); g.fillRect((bx + rm.x) * 16, (by + rm.y) * 16, rm.w * 16, rm.h * 16);
      if (rm.type === "garage" || rm.type === "bay") { g.fillStyle = "rgba(40,30,20,0.18)"; g.beginPath(); g.ellipse((bx + rm.x + rm.w / 2) * 16, (by + rm.y + rm.h / 2) * 16, rm.w * 4, rm.h * 3, 0, 0, 7); g.fill(); }
    }
    return;
  }
  // layer 1: walls, windows, doors' thresholds, counters, bars
  for (let y = y0; y < y1; y++) {
    let run = -1, rc = -1;
    for (let x = x0; x <= x1; x++) {
      const v = x < x1 ? G.c[y * W + x] : -1, code = (v === IC_EXT || v === IC_INT) ? v : -1;
      if (code !== rc) {
        if (rc >= 0) { g.fillStyle = rc === IC_EXT ? ext : intC; g.fillRect((bx + run) * 16, (by + y) * 16, (x - run) * 16, 16); }
        rc = code; run = x;
      }
    }
  }
  const glass = T.w.glass, frame = T.w.frame, gold = T.w.gold;
  for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) {
    const v = G.c[y * W + x];
    if (v === IC_OUT || v === IC_FLOOR) continue;
    const X = (bx + x) * 16, Y = (by + y) * 16;
    const nb = (dx, dy) => { const xx = x + dx, yy = y + dy; return (xx < 0 || yy < 0 || xx >= W || yy >= G.h) ? IC_OUT : G.c[yy * W + xx]; };
    if (v === IC_EXT || v === IC_INT) {
      // outer faces dark, inner faces lit
      for (const [dx, dy] of [[0, -1], [1, 0], [0, 1], [-1, 0]]) {
        const n = nb(dx, dy);
        if (n === IC_OUT && v === IC_EXT) { g.fillStyle = edge; if (dx) g.fillRect(dx > 0 ? X + 14 : X, Y, 2, 16); else g.fillRect(X, dy > 0 ? Y + 14 : Y, 16, 2); }
        else if (n === IC_FLOOR || n === IC_COUNTER) { g.fillStyle = "rgba(255,255,255,0.16)"; if (dx) g.fillRect(dx > 0 ? X + 15 : X, Y, 1, 16); else g.fillRect(X, dy > 0 ? Y + 15 : Y, 16, 1); }
      }
      if (v === IC_EXT && gold && ((x + y) % 6 === 0)) { g.fillStyle = crA(gold === true ? "#d4a537" : gold, 0.0); }
      if (v === IC_EXT && T.w.timber && ((x * 7 + y * 3) % 5 === 0)) { g.fillStyle = crA(edge, 0.55); g.fillRect(X + 6, Y, 4, 16); }
      continue;
    }
    if (v === IC_WIN) {
      const hx = crCellAxis(G, x, y), broken = cityRT.broken.has(cityKeyT(bx + x, by + y));
      g.fillStyle = ext; g.fillRect(X, Y, 16, 16);
      g.fillStyle = frame; if (hx) g.fillRect(X, Y + 5, 16, 6); else g.fillRect(X + 5, Y, 6, 16);
      if (broken) { g.fillStyle = "rgba(10,12,16,0.85)"; if (hx) g.fillRect(X, Y + 6, 16, 4); else g.fillRect(X + 6, Y, 4, 16); g.fillStyle = crA(glass, 0.8); g.beginPath(); g.moveTo(X + 2, Y + 6); g.lineTo(X + 5, Y + 9); g.lineTo(X + 7, Y + 6); g.fill(); }
      else { g.fillStyle = glass; if (hx) g.fillRect(X, Y + 6, 16, 4); else g.fillRect(X + 6, Y, 4, 16); g.fillStyle = "rgba(255,255,255,0.55)"; if (hx) g.fillRect(X + 2, Y + 7, 5, 1); else g.fillRect(X + 7, Y + 2, 1, 5); }
      if (T.w.glow && ((x + y) & 3) === 0) { g.fillStyle = crA(T.w.glow, 0.5); if (hx) g.fillRect(X, Y + 4, 16, 1); else g.fillRect(X + 4, Y, 1, 16); }
      continue;
    }
    if (v === IC_GDOOR) {
      const hx = crCellAxis(G, x, y);
      if (cityRT.gopen && cityRT.gopen.has(b.uid)) {   // v14.1: rolled up (or smashed) - dark threshold + door edge
        g.fillStyle = "rgba(12,12,14,0.55)"; if (hx) g.fillRect(X, Y + 3, 16, 10); else g.fillRect(X + 3, Y, 10, 16);
        g.fillStyle = crSh(T.w.metal, -0.25); if (hx) g.fillRect(X, Y + 2, 16, 2); else g.fillRect(X + 2, Y, 2, 16);
        continue;
      }
      g.fillStyle = crSh(T.w.metal, 0.25); g.fillRect(X, Y + (hx ? 3 : 0), hx ? 16 : 16, hx ? 10 : 16);
      g.fillStyle = crSh(T.w.metal, -0.15);
      if (hx) { for (let k = 0; k < 3; k++) g.fillRect(X, Y + 5 + k * 3, 16, 1); } else { g.fillRect(X + 3, Y, 10, 16); g.fillStyle = crSh(T.w.metal, 0.25); for (let k = 0; k < 3; k++) g.fillRect(X + 5 + k * 3, Y, 1, 16); }
      continue;
    }
    if (v === IC_BARS) {
      const hx = crCellAxis(G, x, y); g.fillStyle = "#2a2d33";
      for (let k = 1; k < 16; k += 4) { if (hx) g.fillRect(X + k, Y + 6, 2, 4); else g.fillRect(X + 6, Y + k, 4, 2); }
      g.fillStyle = "#5a5f66"; if (hx) g.fillRect(X, Y + 7, 16, 2); else g.fillRect(X + 7, Y, 2, 16);
      continue;
    }
    if (v === IC_COUNTER) {
      const fam = crFam(), top = fam === "scifi" ? T.fu.white : fam === "rustic" ? T.fu.wood : "#d8d2c6";
      g.fillStyle = crSh(top, -0.2); g.fillRect(X, Y, 16, 16); g.fillStyle = top; g.fillRect(X + 1, Y + 1, 14, 14);
      if (T.fu.glow && fam === "scifi") { g.fillStyle = crA(T.fu.glow, 0.6); g.fillRect(X, Y + 15, 16, 1); }
      continue;
    }
    if (v === IC_DOOR || v === IC_EDOOR) {   // threshold strip (the leaf itself is drawn live)
      const hx = crCellAxis(G, x, y); g.fillStyle = v === IC_EDOOR ? crSh(ext, -0.35) : "rgba(0,0,0,0.18)";
      if (hx) g.fillRect(X, Y + 6, 16, 4); else g.fillRect(X + 6, Y, 4, 16);
    }
  }
}

/* --- furniture ------------------------------------------------------------------- */
function crGlow(g, x, y, r, col, a) { const gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, crA(col, a)); gr.addColorStop(1, crA(col, 0)); g.fillStyle = gr; g.beginPath(); g.arc(x, y, r, 0, 7); g.fill(); }
function crCandle(g, x, y) { crGlow(g, x, y, 7, "#ffcc66", 0.45); g.fillStyle = "#f4ead0"; g.beginPath(); g.arc(x, y, 1.6, 0, 7); g.fill(); g.fillStyle = "#ffb300"; g.beginPath(); g.arc(x, y, 0.9, 0, 7); g.fill(); }
const CR_BOOK = ["#8e2b2b", "#2b4e8e", "#2b7a4a", "#8e6a2b", "#5a2b7a", "#2a2a2a", "#b8902a", "#7a3a1a"];
function crFurn(g, f, b, P, fam, st) {
  const X = (b.x + f.x) * 16, Y = (b.y + f.y) * 16, W = f.w * 16, H = f.h * 16;
  const o = (f.o | 0) & 3, L = (o & 1) ? H : W, D = (o & 1) ? W : H, x0 = -L / 2, y0 = -D / 2;
  const h = cH(b.seed, f.x, f.y, 11), rr = fam === "scifi" ? 4 : (fam === "rustic" ? 1.5 : 2.5);
  const wood = P.wood, metal = P.metal, glow = P.glow, white = P.white;
  const top = fam === "scifi" ? white : fam === "rustic" ? wood : (h & 1 ? wood : crSh(wood, 0.25));
  g.save(); g.translate(X + W / 2, Y + H / 2); if (o) g.rotate(o * Math.PI / 2);
  const box = (x, y, w, hh, c, r = rr) => { g.fillStyle = crSh(c, -0.3); crRR(g, x, y, w, hh, r); g.fill(); g.fillStyle = c; crRR(g, x + 1, y + 1, w - 2, hh - 2, Math.max(0, r - 1)); g.fill(); };
  const strip = (y, c) => { if (!c) return; g.fillStyle = crA(c, 0.85); g.fillRect(x0 + 2, y, L - 4, 1.2); };
  const ruined = st === "ruined";
  if (ruined && (h & 7) === 0 && f.t !== "car") g.rotate(((h >> 5) & 7) * 0.05 - 0.17);
  switch (f.t) {
    case "bed": case "cot": case "exambed": {
      const cot = f.t === "cot", exam = f.t === "exambed";
      box(x0, y0, L, D, cot ? "#6a7076" : (fam === "scifi" ? metal : wood));
      g.fillStyle = exam ? "#e8eef2" : (cot ? "#9aa08a" : white); crRR(g, x0 + 2, y0 + 2, L - 4, D - 4, rr); g.fill();
      if (!exam) {
        const np = f.v || L > 40 ? 2 : 1, pw = (L - 6) / np;
        for (let k = 0; k < np; k++) { g.fillStyle = crSh(white, 0.2); crRR(g, x0 + 3 + k * pw, y0 + 3, pw - 2, D * 0.15, 3); g.fill(); }
        const bc = cot ? "#5a6a3a" : (h & 2 ? P.fabric : P.fabric2);
        g.fillStyle = bc; crRR(g, x0 + 2, y0 + D * 0.3, L - 4, D * 0.7 - 2, rr); g.fill();
        g.fillStyle = crSh(bc, 0.2); g.fillRect(x0 + 2, y0 + D * 0.3, L - 4, 3);
        if (ruined || (h & 15) === 3) { g.fillStyle = crSh(bc, -0.2); g.beginPath(); g.moveTo(x0 + L * 0.2, y0 + D * 0.3); g.lineTo(x0 + L * 0.8, y0 + D * 0.55); g.lineTo(x0 + L * 0.3, y0 + D * 0.62); g.fill(); }
      } else { g.fillStyle = "#f8f8f8"; g.fillRect(x0 + L * 0.3, y0 + 2, L * 0.4, D - 4); g.fillStyle = "#cfd8dc"; crRR(g, x0 + 4, y0 + 3, L - 8, D * 0.18, 3); g.fill(); }
      if (st === "medieval" || st === "wizard" || st === "gothic") { g.fillStyle = crSh(wood, -0.35); for (const [px, py] of [[x0 + 2, y0 + 2], [x0 + L - 2, y0 + 2], [x0 + 2, y0 + D - 2], [x0 + L - 2, y0 + D - 2]]) { g.beginPath(); g.arc(px, py, 2.4, 0, 7); g.fill(); } if (st === "wizard") { g.fillStyle = crA(P.fabric, 0.75); g.fillRect(x0, y0, 3, D); g.fillRect(x0 + L - 3, y0, 3, D); } }
      if (st === "egyptian") { g.strokeStyle = P.accent; g.lineWidth = 1.5; crRR(g, x0 + 0.75, y0 + 0.75, L - 1.5, D - 1.5, rr); g.stroke(); }
      if (glow && fam === "scifi") strip(y0 + D - 3, glow);
      break;
    }
    case "sofa": case "armchair": {
      const fab = h & 4 ? P.fabric : P.fabric2;
      box(x0, y0, L, D, crSh(fab, -0.15), fam === "scifi" ? 6 : 3);
      g.fillStyle = crSh(fab, -0.05); crRR(g, x0 + 1, y0 + 1, L - 2, D * 0.34, 3); g.fill();
      g.fillStyle = crSh(fab, 0.02); crRR(g, x0 + 1, y0 + 1, 5, D - 2, 3); g.fill(); crRR(g, x0 + L - 6, y0 + 1, 5, D - 2, 3); g.fill();
      const n = f.t === "armchair" ? 1 : Math.max(2, Math.round((L - 12) / 24)), cw = (L - 12) / n;
      for (let k = 0; k < n; k++) { g.fillStyle = fab; crRR(g, x0 + 6 + k * cw + 0.5, y0 + D * 0.34 + 1, cw - 1, D * 0.66 - 3, 3); g.fill(); g.fillStyle = crSh(fab, 0.18); g.fillRect(x0 + 7 + k * cw, y0 + D * 0.34 + 2, cw - 3, 1.5); }
      if (glow && fam === "scifi") strip(y0 + 2, glow);
      if (st === "egyptian" || st === "gothic") { g.strokeStyle = P.accent; g.lineWidth = 1; crRR(g, x0 + 0.5, y0 + 0.5, L - 1, D - 1, 3); g.stroke(); }
      break;
    }
    case "chair": case "stool": {
      g.rotate(((h >> 3) & 7) * 0.05 - 0.17);
      const c = fam === "scifi" ? (h & 1 ? metal : P.fabric) : fam === "rustic" ? wood : (h & 1 ? P.fabric2 : wood);
      if (f.t === "stool") { g.fillStyle = crSh(c, -0.3); g.beginPath(); g.arc(0, 0, 5.5, 0, 7); g.fill(); g.fillStyle = fam === "scifi" ? c : "#b8392b"; g.beginPath(); g.arc(0, 0, 4.4, 0, 7); g.fill(); g.fillStyle = "rgba(255,255,255,0.25)"; g.beginPath(); g.arc(-1.2, -1.2, 1.6, 0, 7); g.fill(); break; }
      box(x0 + 2, y0 + 3, L - 4, D - 5, c, fam === "scifi" ? 4 : 1.5);
      g.fillStyle = crSh(c, -0.25); crRR(g, x0 + 2, y0 + 1, L - 4, 3.5, 1.5); g.fill();
      if (glow && fam === "scifi") { g.fillStyle = crA(glow, 0.7); g.fillRect(x0 + 3, y0 + 1.5, L - 6, 1); }
      break;
    }
    case "bench": case "benchrow": case "pew": case "seatrow": case "bleachers": {
      if (f.t === "seatrow") {
        const n = Math.max(1, Math.round(L / 16)), sw = L / n, fab = b.kind === "council" ? P.fabric2 : (fam === "scifi" ? P.fabric : "#8e2430");
        for (let k = 0; k < n; k++) { g.fillStyle = crSh(fab, -0.35); crRR(g, x0 + k * sw + 1, y0 + 1, sw - 2, D - 2, 2); g.fill(); g.fillStyle = fab; crRR(g, x0 + k * sw + 2, y0 + 4, sw - 4, D - 6, 2); g.fill(); }
        break;
      }
      if (f.t === "bleachers") { for (let k = 0; k < 3; k++) { g.fillStyle = crSh(fam === "rustic" ? wood : "#a8b0b8", -0.1 * k); g.fillRect(x0, y0 + k * D / 3, L, D / 3 - 1); g.fillStyle = "rgba(0,0,0,0.25)"; g.fillRect(x0, y0 + (k + 1) * D / 3 - 1.5, L, 1.5); } break; }
      const c = f.t === "pew" ? crSh(wood, -0.1) : (fam === "scifi" ? metal : wood);
      box(x0, y0 + (f.t === "pew" ? 0 : 2), L, D - (f.t === "pew" ? 0 : 4), c, 1.5);
      g.fillStyle = crSh(c, -0.25);
      if (f.t === "pew") { g.fillRect(x0, y0, L, D * 0.3); g.fillRect(x0, y0, 3, D); g.fillRect(x0 + L - 3, y0, 3, D); }
      else for (let k = 1; k < 3; k++) g.fillRect(x0 + 1, y0 + 2 + k * (D - 4) / 3, L - 2, 0.8);
      break;
    }
    case "booth": {
      const v = st === "neon" ? "#ff2bd6" : fam === "scifi" ? P.fabric : fam === "rustic" ? crSh(wood, -0.1) : "#b3242e";
      box(x0 + 1, y0, L - 2, D * 0.27, v, 3); box(x0 + 1, y0 + D * 0.73, L - 2, D * 0.27, v, 3);
      box(x0 + 3, y0 + D * 0.31, L - 6, D * 0.38, fam === "rustic" ? wood : "#e8e4dc", 2);
      g.fillStyle = "#f4f4f4"; g.beginPath(); g.arc(x0 + L * 0.35, 0, 3, 0, 7); g.arc(x0 + L * 0.65, 1, 3, 0, 7); g.fill();
      break;
    }
    case "table": case "conftable": case "longtable": case "coffeetable": case "island": case "prep": case "display": {
      const c = f.t === "prep" ? "#b8c0c6" : f.t === "island" ? (fam === "rustic" ? wood : "#cfc8bc") : f.t === "display" ? "#bfe3f2" : top;
      box(x0, y0, L, D, c, f.t === "coffeetable" && fam !== "rustic" ? 5 : rr);
      if (fam === "rustic" && f.t !== "display") { g.fillStyle = "rgba(0,0,0,0.12)"; for (let k = 1; k < Math.floor(D / 6); k++) g.fillRect(x0 + 1, y0 + k * 6, L - 2, 0.8); }
      if (f.t === "display") { g.fillStyle = "rgba(255,255,255,0.4)"; g.fillRect(x0 + 2, y0 + 2, L - 4, 2); for (let k = 0; k < 4; k++) { g.fillStyle = CR_BOOK[(h >> k) & 7]; g.fillRect(x0 + 5 + k * (L - 10) / 4, y0 + D / 2 - 2, 4, 4); } }
      else if (f.t === "table" || f.t === "longtable") { const n = Math.max(2, Math.floor(L / 16)); for (let k = 0; k < n; k++) { const px = x0 + (k + 0.5) * L / n; if (((h >> k) & 3) === 0) continue; g.fillStyle = fam === "rustic" ? "#c8b48a" : "#f4f4f2"; g.beginPath(); g.arc(px, y0 + D * 0.3, 2.6, 0, 7); g.arc(px, y0 + D * 0.7, 2.6, 0, 7); g.fill(); } if (st === "medieval" || st === "wizard" || st === "gothic") crCandle(g, 0, 0); }
      else if (f.t === "conftable") { for (let k = 0; k < Math.floor(L / 16); k++) { g.fillStyle = fam === "scifi" ? crA(glow || "#4fc3ff", 0.6) : "#f0f0ea"; g.fillRect(x0 + 6 + k * 16, y0 + 3, 6, 4); g.fillRect(x0 + 6 + k * 16, y0 + D - 7, 6, 4); } }
      else if (f.t === "coffeetable") { g.fillStyle = CR_BOOK[h & 7]; g.fillRect(x0 + 4, y0 + 4, 9, 6); g.fillStyle = "#222"; g.fillRect(x0 + L - 10, y0 + D - 8, 6, 2); }
      else if (f.t === "prep") { g.fillStyle = "#e0e6ea"; g.fillRect(x0 + 4, y0 + 4, L * 0.3, D - 8); g.fillStyle = "#8a6a44"; g.fillRect(x0 + L * 0.55, y0 + 5, 12, 8); }
      if (glow && fam === "scifi") { g.strokeStyle = crA(glow, 0.7); g.lineWidth = 1; crRR(g, x0 + 1.5, y0 + 1.5, L - 3, D - 3, rr); g.stroke(); }
      break;
    }
    case "desk": case "teacherdesk": case "schooldesk": case "deskpod": case "reception": case "workbench": {
      if (f.t === "deskpod") {
        g.fillStyle = "#8a9096"; g.fillRect(x0, -1.5, L, 3); g.fillRect(-1.5, y0, 3, D);
        for (const [sx, sy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) { const qx = sx < 0 ? x0 + 2 : 3, qy = sy < 0 ? y0 + 2 : 3; box(qx, qy, L / 2 - 5, D / 2 - 5, top, rr); g.fillStyle = fam === "scifi" ? crA(glow || "#4fc3ff", 0.75) : "#1c2630"; g.fillRect(qx + (L / 2 - 5) / 2 - 6, sy < 0 ? qy + 2 : qy + D / 2 - 11, 12, 3); g.fillStyle = "#3a3f46"; g.beginPath(); g.arc(qx + (L / 2 - 5) / 2, sy < 0 ? qy + D / 2 - 2 : qy + 1, 4, 0, 7); g.fill(); }
        break;
      }
      const c = f.t === "workbench" ? crSh(fam === "scifi" ? metal : wood, -0.05) : f.t === "reception" ? (fam === "scifi" ? white : crSh(wood, -0.1)) : top;
      box(x0, y0, L, D, c, rr);
      if (f.t === "schooldesk") { g.fillStyle = fam === "scifi" ? metal : "#5a5f66"; crRR(g, -4, D / 2 + 1, 8, 6, 2); g.fill(); g.fillStyle = "#f0efe6"; g.fillRect(-5, y0 + 3, 7, 6); break; }
      if (f.t === "workbench") { g.fillStyle = "#7a7f86"; g.fillRect(x0 + 4, y0 + 3, 8, 5); g.fillStyle = "#c0392b"; g.fillRect(x0 + L * 0.45, y0 + 4, 10, 2.5); g.fillStyle = "#4a4f56"; g.fillRect(x0 + L * 0.7, y0 + 3, 2.5, 8); g.fillRect(x0 + L * 0.7 - 3, y0 + 3, 8.5, 2.5); break; }
      if (fam === "rustic") {
        g.fillStyle = "#e8dcc0"; g.fillRect(x0 + L * 0.3, y0 + 4, 10, 8); g.fillStyle = "#1a1a1a"; g.beginPath(); g.arc(x0 + L * 0.6, y0 + 6, 1.8, 0, 7); g.fill();
        g.fillStyle = CR_BOOK[h & 7]; g.fillRect(x0 + 4, y0 + 3, 7, 9); crCandle(g, x0 + L - 6, y0 + 6);
      } else {
        const sc = fam === "scifi" ? crA(glow || "#4fc3ff", 0.8) : "#18222c";
        g.fillStyle = "#2a2f36"; g.fillRect(-7, y0 + 2, 14, 3); g.fillStyle = sc; g.fillRect(-6, y0 + 2.5, 12, 2);
        if (fam === "scifi") crGlow(g, 0, y0 + 5, 9, glow || "#4fc3ff", 0.25);
        g.fillStyle = "#d8dce0"; g.fillRect(-6, y0 + 8, 12, 3); g.fillStyle = "#f5f5f0"; g.fillRect(x0 + 4, y0 + 4, 7, 9); g.fillStyle = "#8a5a3a"; g.beginPath(); g.arc(x0 + L - 6, y0 + 6, 2, 0, 7); g.fill();
      }
      if (f.t === "reception" && glow) strip(y0 + D - 3, glow);
      if (f.t !== "reception") { g.fillStyle = fam === "rustic" ? crSh(wood, -0.2) : "#30353c"; g.beginPath(); g.arc(0, D / 2 + 4, 4.5, 0, 7); g.fill(); }
      if (f.t === "teacherdesk") { g.fillStyle = "#c62828"; g.beginPath(); g.arc(x0 + L - 12, y0 + D - 6, 2.4, 0, 7); g.fill(); }
      break;
    }
    case "counter": case "barcounter": case "checkout": case "vanity": {
      const c = f.t === "barcounter" ? (fam === "scifi" ? crSh(metal, -0.1) : crSh(wood, -0.15)) : f.t === "checkout" ? "#9aa0a6" : (fam === "scifi" ? white : fam === "rustic" ? wood : (st === "ruined" ? "#a89a88" : "#d8d2c6"));
      box(x0, y0, L, D, c, fam === "scifi" ? 3 : 1);
      g.fillStyle = crSh(c, -0.15); g.fillRect(x0 + 1, y0 + 1, L - 2, 2.5);
      if (f.t === "vanity" || f.v === 1) { g.fillStyle = fam === "rustic" ? "#7a6a5a" : "#c8d0d6"; crRR(g, -6, y0 + 3.5, 12, D - 6, 4); g.fill(); g.fillStyle = "rgba(255,255,255,0.4)"; g.fillRect(-4, y0 + 5, 8, 1); }
      if (f.t === "barcounter") { for (let k = 0; k < Math.floor(L / 6); k++) { g.fillStyle = ["#2e7d32", "#6d4c41", "#c62828", "#ffd54f"][(h >> (k & 7)) & 3]; g.beginPath(); g.arc(x0 + 4 + k * 6, y0 + 3, 1.6, 0, 7); g.fill(); } if (glow) strip(y0 + D - 2.5, glow); }
      if (f.t === "checkout") { g.fillStyle = "#2a2a2a"; g.fillRect(x0 + 3, y0 + 4, L * 0.55, D - 8); g.fillStyle = fam === "scifi" ? crA(glow || "#4fc3ff", 0.8) : "#37474f"; g.fillRect(x0 + L * 0.68, y0 + 4, 9, 7); }
      if (f.v === 3) { for (let k = 0; k < 4; k++) { g.fillStyle = ["#4fc3ff", "#76ff03", "#ff7043", "#e1bee7"][k]; g.globalAlpha = 0.75; g.beginPath(); g.arc(x0 + 8 + k * 10, y0 + D / 2, 2.4, 0, 7); g.fill(); } g.globalAlpha = 1; }
      if (f.v === 2) { g.fillStyle = "#37474f"; g.fillRect(x0 + L - 14, y0 + 3, 9, 7); }
      break;
    }
    case "stove": case "fireplace": {
      const hearth = f.t === "fireplace" || st === "medieval" || st === "wizard" || st === "gothic";
      if (hearth) { box(x0, y0, L, D, "#6a645c", 1); g.fillStyle = "#1a1410"; g.fillRect(x0 + 3, y0 + 2, L - 6, D - 3); crGlow(g, 0, y0 + D * 0.55, Math.max(8, L * 0.4), "#ff8a00", 0.55); g.fillStyle = "#ffb74d"; g.beginPath(); g.arc(0, y0 + D * 0.6, 2.2, 0, 7); g.fill(); break; }
      const c = fam === "scifi" ? crSh(metal, -0.1) : (st === "western" || st === "rustic" ? "#2a2a2a" : "#e8e8e4");
      box(x0, y0, L, D, c, fam === "scifi" ? 3 : 1);
      const nb = Math.max(2, Math.floor(L / 9)) * (D > 20 ? 2 : 1), cols = Math.floor(nb / (D > 20 ? 2 : 1));
      for (let k = 0; k < nb; k++) { const cx = x0 + (k % cols + 0.5) * L / cols, cy = D > 20 ? y0 + (Math.floor(k / cols) + 0.5) * D / 2 : 0; if (fam === "scifi") { g.strokeStyle = crA(glow || "#ff7043", 0.85); g.lineWidth = 1.2; g.beginPath(); g.arc(cx, cy, 3, 0, 7); g.stroke(); } else { g.fillStyle = "#222"; g.beginPath(); g.arc(cx, cy, 3, 0, 7); g.fill(); g.strokeStyle = "#555"; g.lineWidth = 0.8; g.beginPath(); g.arc(cx, cy, 1.8, 0, 7); g.stroke(); } }
      break;
    }
    case "fridge": case "washer": case "vending": case "arcade": case "printer": case "watercooler": case "cooler": {
      if (f.t === "fridge" && (st === "medieval" || st === "wizard")) { for (const px of [x0 + L * 0.3, x0 + L * 0.7]) { g.fillStyle = "#5a3a1e"; g.beginPath(); g.arc(px, 0, Math.min(L, D) * 0.3, 0, 7); g.fill(); g.strokeStyle = "#2a2a2a"; g.lineWidth = 1; g.beginPath(); g.arc(px, 0, Math.min(L, D) * 0.3 - 2, 0, 7); g.stroke(); } break; }
      if (f.t === "fridge" && st === "egyptian") { for (const px of [x0 + L * 0.3, x0 + L * 0.7]) { g.fillStyle = "#b8743a"; g.beginPath(); g.arc(px, 0, Math.min(L, D) * 0.28, 0, 7); g.fill(); g.fillStyle = "#3a2a1a"; g.beginPath(); g.arc(px, 0, 2, 0, 7); g.fill(); } break; }
      if (f.t === "cooler") { box(x0, y0, L, D, fam === "scifi" ? metal : "#dfe4e8", 1); g.fillStyle = "rgba(120,190,230,0.55)"; g.fillRect(x0 + 2, y0 + D * 0.45, L - 4, D * 0.5); for (let k = 0; k < Math.floor(L / 5); k++) { g.fillStyle = ["#e53935", "#1e88e5", "#43a047", "#fdd835", "#fb8c00"][(k + h) % 5]; g.fillRect(x0 + 3 + k * 5, y0 + 3, 3, D * 0.38); } if (glow) strip(y0 + D - 2, glow); else { g.fillStyle = "rgba(255,255,255,0.5)"; g.fillRect(x0 + 2, y0 + D - 3, L - 4, 1); } break; }
      const c = f.t === "vending" ? (h & 1 ? "#c62828" : "#1565c0") : f.t === "arcade" ? "#212121" : f.t === "printer" ? "#9e9e9e" : (fam === "scifi" ? metal : (st === "western" ? crSh(wood, 0.1) : "#eceff1"));
      box(x0, y0, L, D, c, fam === "scifi" ? 4 : 2);
      if (f.t === "fridge") { g.fillStyle = crSh(c, -0.22); g.fillRect(x0 + 2, y0 + D * 0.45, L - 4, 1); g.fillRect(x0 + L - 5, y0 + 4, 1.5, D * 0.3); if (glow && fam === "scifi") { g.fillStyle = crA(glow, 0.8); g.fillRect(x0 + 4, y0 + 4, 5, 3); } }
      else if (f.t === "washer") {   // a row of machines, ~1 m each
        const n = Math.max(1, Math.round(L / 32)), uw = L / n;
        for (let k = 0; k < n; k++) {
          const ux = x0 + (k + 0.5) * uw;
          if (k) { g.fillStyle = crSh(c, -0.25); g.fillRect(x0 + k * uw - 0.5, y0 + 1, 1, D - 2); }
          g.fillStyle = "#37474f"; g.beginPath(); g.arc(ux, 1, Math.min(uw, D) * 0.3, 0, 7); g.fill();
          g.fillStyle = fam === "scifi" && glow ? crA(glow, 0.55) : "rgba(160,210,240,0.6)"; g.beginPath(); g.arc(ux, 1, Math.min(uw, D) * 0.22, 0, 7); g.fill();
        }
      }
      else if (f.t === "vending" || f.t === "arcade") { const sc = f.t === "arcade" ? ["#00e5ff", "#ff2bd6", "#76ff03"][h % 3] : "#e3f2fd"; g.fillStyle = crA(sc, 0.85); g.fillRect(x0 + 3, y0 + D * 0.5, L - 6, D * 0.4); crGlow(g, 0, y0 + D * 0.7, L * 0.6, sc, 0.25); if (f.t === "arcade") { g.fillStyle = "#e53935"; g.beginPath(); g.arc(-4, y0 + D * 0.3, 1.8, 0, 7); g.fill(); g.fillStyle = "#fdd835"; g.beginPath(); g.arc(3, y0 + D * 0.3, 1.5, 0, 7); g.fill(); } }
      else if (f.t === "printer") { g.fillStyle = "#f5f5f5"; g.fillRect(x0 + 5, y0 + 3, L - 10, D - 6); }
      else if (f.t === "watercooler") { g.fillStyle = "rgba(100,170,240,0.85)"; g.beginPath(); g.arc(0, 0, Math.min(L, D) * 0.32, 0, 7); g.fill(); }
      break;
    }
    case "toilet": {
      if (st === "medieval" || st === "western" || st === "wizard") { box(x0 + 1, y0, L - 2, D * 0.7, wood, 1); g.fillStyle = "#1a1a1a"; g.beginPath(); g.ellipse(0, y0 + D * 0.35, L * 0.22, D * 0.14, 0, 0, 7); g.fill(); break; }
      const c = fam === "scifi" ? white : "#f4f6f7";
      g.fillStyle = crSh(c, -0.18); crRR(g, x0 + 2, y0, L - 4, D * 0.3, 2); g.fill();
      g.fillStyle = crSh(c, -0.12); g.beginPath(); g.ellipse(0, y0 + D * 0.58, L * 0.36, D * 0.32, 0, 0, 7); g.fill();
      g.fillStyle = c; g.beginPath(); g.ellipse(0, y0 + D * 0.58, L * 0.3, D * 0.26, 0, 0, 7); g.fill();
      g.fillStyle = "rgba(120,180,220,0.5)"; g.beginPath(); g.ellipse(0, y0 + D * 0.6, L * 0.17, D * 0.15, 0, 0, 7); g.fill();
      break;
    }
    case "tub": {
      if (st === "medieval" || st === "western" || st === "wizard" || st === "rustic") { g.fillStyle = "#6a4a2a"; g.beginPath(); g.ellipse(0, 0, L / 2 - 1, D / 2 - 1, 0, 0, 7); g.fill(); g.fillStyle = "rgba(120,170,200,0.7)"; g.beginPath(); g.ellipse(0, 0, L / 2 - 4, D / 2 - 4, 0, 0, 7); g.fill(); g.strokeStyle = "#2a2a2a"; g.lineWidth = 1; g.beginPath(); g.ellipse(0, 0, L / 2 - 1.5, D / 2 - 1.5, 0, 0, 7); g.stroke(); break; }
      if (fam === "scifi" && f.v) { g.fillStyle = crSh(metal, -0.2); g.beginPath(); g.arc(0, 0, Math.min(L, D) / 2 - 1, 0, 7); g.fill(); crGlow(g, 0, 0, Math.min(L, D) / 2, glow || "#4fc3ff", 0.4); break; }
      box(x0, y0, L, D, st === "egyptian" ? "#e0c890" : "#f4f6f7", 6);
      g.fillStyle = "rgba(150,200,230,0.75)"; crRR(g, x0 + 3, y0 + 3, L - 6, D - 6, 6); g.fill();
      if (st === "egyptian") { g.strokeStyle = P.accent; g.lineWidth = 1.5; crRR(g, x0 + 1, y0 + 1, L - 2, D - 2, 6); g.stroke(); }
      break;
    }
    case "stall": {
      if (b.type === "barn") { g.fillStyle = crPat("straw", "#b8a060"); g.fillRect(x0 + 2, y0 + 2, L - 4, D - 4); g.fillStyle = "#6a4a2a"; g.fillRect(x0, y0, L, 2); g.fillRect(x0, y0, 2, D); g.fillRect(x0 + L - 2, y0, 2, D); g.fillStyle = "#5a5f66"; g.beginPath(); g.arc(x0 + L - 7, y0 + 7, 3, 0, 7); g.fill(); break; }
      g.fillStyle = fam === "scifi" ? metal : "#90a4ae"; g.fillRect(x0, y0, 2, D); g.fillRect(x0 + L - 2, y0, 2, D); g.fillRect(x0, y0, L, 2);
      g.fillStyle = "#f4f6f7"; g.beginPath(); g.ellipse(0, y0 + D * 0.32, L * 0.22, D * 0.17, 0, 0, 7); g.fill();
      g.fillStyle = crA("#90a4ae", 0.6); g.fillRect(x0 + 2, y0 + D - 2, L - 4, 2);
      break;
    }
    case "shelf": case "bookshelf": case "rack": case "lockers": case "safeboxes": case "gunrack": case "filing": case "cabinet": case "wardrobe": case "dresser": case "nightstand": {
      const isWood = f.t === "bookshelf" || f.t === "cabinet" || f.t === "wardrobe" || f.t === "dresser" || f.t === "nightstand" || (fam === "rustic" && f.t !== "lockers" && f.t !== "safeboxes");
      const c = isWood ? (fam === "scifi" ? metal : crSh(wood, -0.05)) : f.t === "lockers" ? (fam === "scifi" ? metal : "#5c7a96") : f.t === "rack" ? "#3d5a80" : f.t === "safeboxes" ? "#9aa3ab" : f.t === "gunrack" ? "#3a3f46" : (fam === "scifi" ? metal : "#a9b2b9");
      box(x0, y0, L, D, c, fam === "scifi" ? 2 : 1);
      if (f.t === "bookshelf") { let px = x0 + 2; while (px < x0 + L - 3) { const bw = 2 + ((h >> (px & 15)) & 3); g.fillStyle = CR_BOOK[(h + Math.floor(px)) & 7]; g.fillRect(px, y0 + 2, bw - 0.5, D - 4); px += bw; } }
      else if (f.t === "shelf") {
        const two = D > 20; g.fillStyle = crSh(c, -0.25); if (two) g.fillRect(x0 + 1, -0.75, L - 2, 1.5);
        for (let side = 0; side < (two ? 2 : 1); side++) for (let px = x0 + 2; px < x0 + L - 4; px += 4) { g.fillStyle = ["#e53935", "#1e88e5", "#43a047", "#fdd835", "#fb8c00", "#8e24aa", "#f5f5f5"][(h + Math.floor(px) * 3 + side) % 7]; g.fillRect(px, side ? 2 : y0 + 2, 3, (two ? D / 2 : D) - 4); }
        if (glow && fam === "scifi") strip(two ? -0.5 : y0 + D - 2, glow);
      }
      else if (f.t === "rack") { g.fillStyle = "#ff8f00"; g.fillRect(x0, y0, 2, D); g.fillRect(x0 + L - 2, y0, 2, D); for (let px = x0 + 3; px < x0 + L - 8; px += 9) { if (((h >> (Math.floor(px) & 15)) & 3) === 0) continue; g.fillStyle = fam === "scifi" ? "#78909c" : "#a1887f"; g.fillRect(px, y0 + 2, 8, D - 4); g.fillStyle = "rgba(0,0,0,0.2)"; g.fillRect(px + 3.5, y0 + 2, 1, D - 4); } }
      else if (f.t === "lockers" || f.t === "safeboxes") { g.fillStyle = crSh(c, -0.3); const step = f.t === "lockers" ? 6 : 5; for (let px = x0 + step; px < x0 + L - 1; px += step) g.fillRect(px, y0 + 1, 1, D - 2); if (f.t === "safeboxes") g.fillRect(x0 + 1, 0, L - 2, 1); }
      else if (f.t === "gunrack") { for (let px = x0 + 4; px < x0 + L - 3; px += 5) { if (st === "wizard") { g.fillStyle = "#8a6a3a"; g.fillRect(px, y0 + 1, 1.5, D - 2); g.fillStyle = "#c8a060"; g.fillRect(px - 1, y0 + D - 4, 3.5, 3); } else if (fam === "rustic") { g.fillStyle = "#b0bec5"; g.fillRect(px, y0 + 1, 1.2, D - 2); g.fillStyle = "#6a4a2a"; g.fillRect(px - 1, y0 + D - 4, 3, 2); } else { g.fillStyle = "#111"; g.fillRect(px, y0 + 2, 2, D - 4); if (fam === "scifi" && glow) { g.fillStyle = crA(glow, 0.8); g.fillRect(px, y0 + 3, 2, 1); } } } }
      else if (f.t === "nightstand") { crGlow(g, 0, 0, 9, "#ffe082", 0.35); g.fillStyle = "#fff3c4"; g.beginPath(); g.arc(0, 0, 3, 0, 7); g.fill(); }
      else { g.fillStyle = crSh(c, -0.3); if (f.t === "wardrobe" || f.t === "cabinet") g.fillRect(-0.5, y0 + 1, 1, D - 2); else for (let k = 1; k < 3; k++) g.fillRect(x0 + k * L / 3, y0 + 1, 0.8, D - 2); g.fillStyle = st === "egyptian" || st === "gothic" ? P.accent : "#d0d0d0"; g.fillRect(-3, y0 + D - 3, 2, 1.5); g.fillRect(1, y0 + D - 3, 2, 1.5); }
      break;
    }
    case "tvstand": case "screen": case "cinemascreen": case "whiteboard": {
      if (f.t === "cinemascreen") { g.fillStyle = "#111"; g.fillRect(x0, y0, L, D); g.fillStyle = "#f4f4f4"; g.fillRect(x0 + 2, y0 + 3, L - 4, D - 6); crGlow(g, 0, y0 + D + 20, L * 0.6, "#ffffff", 0.06); break; }
      if (f.t === "whiteboard") { const chalk = fam === "rustic"; g.fillStyle = chalk ? "#2e4a32" : (fam === "scifi" ? "#10202c" : "#f8f8f8"); g.fillRect(x0, y0 + 2, L, D - 4); g.strokeStyle = chalk ? "rgba(255,255,255,0.6)" : (fam === "scifi" ? crA(glow || "#4fc3ff", 0.8) : "#1e88e5"); g.lineWidth = 1; g.beginPath(); for (let k = 0; k < 4; k++) { g.moveTo(x0 + 6 + k * L / 5, y0 + 6); g.lineTo(x0 + 12 + k * L / 5, y0 + D - 6); } g.stroke(); break; }
      if (f.t === "screen") { g.fillStyle = "#15191e"; g.fillRect(x0 + 2, y0 + 2, L - 4, D - 4); g.fillStyle = crA(glow || "#4fc3ff", 0.5); g.fillRect(x0 + 4, y0 + 4, L - 8, D - 8); break; }
      box(x0, y0, L, D, fam === "scifi" ? metal : crSh(wood, -0.1), rr);
      if (fam === "earth") { g.fillStyle = "#0d0f12"; g.fillRect(x0 + 3, y0 + 2, L - 6, 4); g.fillStyle = "rgba(255,255,255,0.25)"; g.fillRect(x0 + 4, y0 + 2.5, (L - 8) * 0.4, 1); }
      else if (fam === "scifi") { g.fillStyle = crA(glow || "#4fc3ff", 0.9); g.beginPath(); g.arc(0, 0, 3, 0, 7); g.fill(); crGlow(g, 0, 0, 14, glow || "#4fc3ff", 0.3); }
      else if (st === "western") { g.fillStyle = "#b8902a"; g.beginPath(); g.arc(4, 0, 5, 0, 7); g.fill(); g.fillStyle = "#3a2a1a"; g.beginPath(); g.arc(4, 0, 2, 0, 7); g.fill(); }
      else if (st === "wizard") { g.fillStyle = "#6a4a2a"; g.fillRect(-6, y0 + 2, 12, D - 4); g.fillStyle = "#d4a537"; g.beginPath(); g.arc(-2, 0, 1.6, 0, 7); g.fill(); g.beginPath(); g.arc(3, 0, 1.6, 0, 7); g.fill(); }
      else if (st === "egyptian" || st === "gothic") { g.fillStyle = P.accent; g.fillRect(-4, y0 + 2, 8, D - 4); crCandle(g, x0 + 5, 0); crCandle(g, x0 + L - 5, 0); }
      else { g.fillStyle = "#4a3420"; g.fillRect(-7, y0 + 2, 14, D - 4); g.fillStyle = "#c8a060"; g.fillRect(-7, -0.5, 14, 1); }
      break;
    }
    case "plant": case "lamp": case "flag": {
      if (f.t === "lamp") { crGlow(g, 0, 0, 16, "#ffe082", fam === "scifi" ? 0.2 : 0.3); g.fillStyle = fam === "scifi" ? crA(glow || "#ffe082", 0.9) : "#fff3c4"; g.beginPath(); g.arc(0, 0, 3.5, 0, 7); g.fill(); break; }
      if (f.t === "flag") { g.fillStyle = "#b0b0b0"; g.beginPath(); g.arc(0, 0, 2, 0, 7); g.fill(); g.fillStyle = CITY.theme.flag || "#b22234"; g.beginPath(); g.moveTo(1, -1); g.lineTo(9, -3); g.lineTo(10, 3); g.lineTo(1, 2); g.fill(); break; }
      if (st === "gothic") { g.fillStyle = P.accent; g.beginPath(); g.arc(0, 0, 2.5, 0, 7); g.fill(); crCandle(g, -3, -2); crCandle(g, 3, -2); crCandle(g, 0, 3); break; }
      if (fam === "scifi" && glow) { g.fillStyle = crSh(metal, -0.2); g.beginPath(); g.arc(0, 0, 5.5, 0, 7); g.fill(); crGlow(g, 0, 0, 9, "#76ff03", 0.25); g.fillStyle = "#43a047"; for (let k = 0; k < 5; k++) { g.beginPath(); g.arc(Math.cos(k * 1.26) * 2.6, Math.sin(k * 1.26) * 2.6, 2.2, 0, 7); g.fill(); } break; }
      if (st === "spartan" || st === "western") { g.fillStyle = "#8a5a3a"; g.beginPath(); g.arc(0, 0, 5, 0, 7); g.fill(); g.fillStyle = "#4a7a3a"; crRR(g, -2, -5, 4, 9, 2); g.fill(); g.fillRect(-5, -2, 3, 2); g.fillRect(2, -3, 3, 2); break; }
      g.fillStyle = "#8d5a3a"; g.beginPath(); g.arc(0, 0, 5, 0, 7); g.fill();
      for (let k = 0; k < 6; k++) { g.fillStyle = k & 1 ? "#2e7d32" : "#43a047"; g.beginPath(); g.arc(Math.cos(k * 1.05 + h) * 3.4, Math.sin(k * 1.05 + h) * 3.4, 3, 0, 7); g.fill(); }
      break;
    }
    case "rug": case "runner": case "court": {
      if (f.t === "court") { g.strokeStyle = "rgba(255,255,255,0.75)"; g.lineWidth = 2; g.strokeRect(x0 + 2, y0 + 2, L - 4, D - 4); g.beginPath(); g.moveTo(x0 + 2, 0); g.lineTo(x0 + L - 2, 0); g.stroke(); g.beginPath(); g.arc(0, 0, Math.min(L, D) * 0.12, 0, 7); g.stroke(); g.strokeStyle = "rgba(255,140,0,0.7)"; g.strokeRect(-L * 0.12, y0 + 2, L * 0.24, D * 0.18); g.strokeRect(-L * 0.12, y0 + D - 2 - D * 0.18, L * 0.24, D * 0.18); break; }
      const c = f.t === "runner" ? crSh(P.fabric2, -0.1) : (h & 1 ? P.fabric2 : P.fabric);
      g.fillStyle = c; crRR(g, x0 + 1, y0 + 1, L - 2, D - 2, f.t === "runner" ? 0 : 3); g.fill();
      g.strokeStyle = st === "egyptian" || st === "gothic" || st === "wizard" ? P.accent : crSh(c, 0.3); g.lineWidth = 1.5; crRR(g, x0 + 4, y0 + 4, L - 8, D - 8, 2); g.stroke();
      if (fam === "scifi" && glow) { g.strokeStyle = crA(glow, 0.45); g.beginPath(); g.arc(0, 0, Math.min(L, D) * 0.25, 0, 7); g.stroke(); }
      else if (L > 30 && D > 30) { g.fillStyle = crSh(c, 0.25); g.beginPath(); g.moveTo(0, -D * 0.18); g.lineTo(L * 0.14, 0); g.lineTo(0, D * 0.18); g.lineTo(-L * 0.14, 0); g.fill(); }
      break;
    }
    case "box": case "crate": case "pallet": case "cashbag": case "haybale": {
      if (f.t === "haybale") { g.fillStyle = crPat("straw", "#c8a85a"); crRR(g, x0 + 1, y0 + 1, L - 2, D - 2, 3); g.fill(); g.strokeStyle = "#8a6a2a"; g.lineWidth = 0.8; g.beginPath(); g.moveTo(x0 + L * 0.33, y0 + 1); g.lineTo(x0 + L * 0.33, y0 + D - 1); g.moveTo(x0 + L * 0.66, y0 + 1); g.lineTo(x0 + L * 0.66, y0 + D - 1); g.stroke(); break; }
      if (f.t === "cashbag") { g.fillStyle = st === "wizard" ? "#8a6a3a" : "#c8b88a"; g.beginPath(); g.arc(0, 1, 5, 0, 7); g.fill(); g.fillStyle = "#6a5a3a"; g.fillRect(-2, -5, 4, 3); g.fillStyle = st === "wizard" || st === "egyptian" ? "#d4a537" : "#2e7d32"; g.font = "bold 6px sans-serif"; g.textAlign = "center"; g.fillText(st === "wizard" ? "G" : (fam === "scifi" ? "¤" : "$"), 0, 3); break; }
      if (f.t === "pallet") { g.fillStyle = "#b08a5a"; for (let k = 0; k < 5; k++) g.fillRect(x0 + 1, y0 + 1 + k * (D - 2) / 5, L - 2, (D - 2) / 5 - 1); if (h & 1) box(x0 + 2, y0 + 2, L - 4, D - 4, "#a1887f", 1); break; }
      const kind = fam === "scifi" ? 1 : fam === "rustic" ? (h % 3 === 0 ? 2 : (h % 3 === 1 ? 3 : 4)) : 0;
      if (kind === 2) { g.fillStyle = "#6a4a2a"; g.beginPath(); g.arc(0, 0, Math.min(L, D) / 2 - 1, 0, 7); g.fill(); g.strokeStyle = "#3a2a1a"; g.lineWidth = 1; g.beginPath(); g.arc(0, 0, Math.min(L, D) / 2 - 2.5, 0, 7); g.stroke(); break; }
      if (kind === 3) { g.fillStyle = "#c8b080"; g.beginPath(); g.ellipse(0, 0, L / 2 - 1, D / 2 - 2, 0.3, 0, 7); g.fill(); g.fillStyle = "#9a8058"; g.fillRect(-1, -D / 2 + 1, 2, 3); break; }
      const c = f.t === "crate" ? (fam === "scifi" ? "#5a6a5a" : "#7a6a4a") : kind === 1 ? (h & 1 ? "#8a949c" : "#5a6470") : kind === 4 ? "#8a6a42" : "#b8915e";
      box(x0 + 1, y0 + 1, L - 2, D - 2, c, kind === 1 ? 2 : 0.5);
      if (kind === 0) { g.fillStyle = "#d8c49a"; g.fillRect(-1, y0 + 1, 2, D - 2); }
      else if (kind === 1) { g.fillStyle = crA(glow || "#ffb300", 0.8); g.fillRect(x0 + 2, -0.75, L - 4, 1.5); }
      else { g.fillStyle = "rgba(0,0,0,0.25)"; g.fillRect(x0 + 2, -0.5, L - 4, 1); g.beginPath(); g.moveTo(x0 + 2, y0 + 2); g.lineTo(x0 + L - 2, y0 + D - 2); g.lineWidth = 1; g.strokeStyle = "rgba(0,0,0,0.25)"; g.stroke(); }
      break;
    }
    case "dais": case "altar": {
      if (f.t === "dais") { box(x0, y0, L, D, crSh(wood, -0.1), 1); g.fillStyle = crSh(wood, 0.15); g.fillRect(x0 + 2, y0 + 2, L - 4, D * 0.5); g.fillStyle = crSh(wood, -0.3); g.fillRect(-6, y0 + D * 0.55, 12, D * 0.35); if (glow) strip(y0 + D - 2, glow); break; }
      g.fillStyle = st === "gothic" ? "#7a1a1a" : "#f0ece0"; crRR(g, x0, y0, L, D, 2); g.fill();
      g.strokeStyle = st === "gothic" || st === "egyptian" ? P.accent : "#c8a050"; g.lineWidth = 1.5; crRR(g, x0 + 1, y0 + 1, L - 2, D - 2, 2); g.stroke();
      crCandle(g, x0 + 5, 0); crCandle(g, x0 + L - 5, 0);
      g.fillStyle = st === "egyptian" ? "#ffd166" : (fam === "scifi" ? crA(glow || "#4fc3ff", 0.9) : "#c8a050");
      if (st === "egyptian") { g.beginPath(); g.arc(0, 0, 4, 0, 7); g.fill(); } else if (fam === "scifi") { crGlow(g, 0, 0, 10, glow || "#4fc3ff", 0.5); } else { g.fillRect(-1, -5, 2, 10); g.fillRect(-4, -2.5, 8, 2); }
      break;
    }
    case "car": case "firetruck": case "forklift": case "tractor": case "carlift": {
      if (f.t === "carlift") { g.fillStyle = "#ffb300"; g.fillRect(x0 + 2, y0 + 2, 3, D - 4); g.fillRect(x0 + L - 5, y0 + 2, 3, D - 4); }
      crVehicle(g, f.t === "carlift" ? "sedan" : f.t, L, D, f.v | 0, h, f.t === "car" || f.t === "carlift");
      break;
    }
    default: box(x0, y0, L, D, wood, 1);
  }
  g.restore();
}
// EOF part 2

/* --- vehicles (canonical: front at the top, L = width, D = length) ---------------- */
const CR_CARCOL = ["#c62828", "#1565c0", "#eceff1", "#212121", "#9e9e9e", "#2e7d32", "#f9a825", "#6d4c41"];
function crHorse(g, x, y, s, col) { g.fillStyle = col || "#6d4c2f"; g.beginPath(); g.ellipse(x, y, 3.2 * s, 7 * s, 0, 0, 7); g.fill(); g.beginPath(); g.ellipse(x, y - 8 * s, 1.8 * s, 3.2 * s, 0, 0, 7); g.fill(); g.fillStyle = "#2a1a10"; g.fillRect(x - 0.6 * s, y - 6 * s, 1.2 * s, 9 * s); }
function crWheel(g, x, y, r, spoke) { g.fillStyle = "#3a2a1a"; g.beginPath(); g.arc(x, y, r, 0, 7); g.fill(); if (spoke) { g.strokeStyle = "#8a6a3a"; g.lineWidth = 0.8; g.beginPath(); for (let k = 0; k < 4; k++) { g.moveTo(x, y); g.lineTo(x + Math.cos(k * 0.785 * 2) * r, y + Math.sin(k * 0.785 * 2) * r); } g.stroke(); } }
function crVehicle(g, kind, L, D, v, h, themed, wreck) {
  const T = CITY.theme, fam = crFam(), x0 = -L / 2, y0 = -D / 2;
  if (themed && kind === "car") {
    kind = T.car || "sedan";
    if (kind === "sedan") { if (v === 8) kind = "police"; else if ((v & 7) === 6) kind = "pickup"; else if ((v & 7) === 3) kind = "suv"; }   // v14.1 variety
  }
  let col = crVehicle.col || CR_CARCOL[v & 7];
  if (!crVehicle.noShadow) { g.fillStyle = "rgba(0,0,0,0.28)"; crRR(g, x0 + 3, y0 + 4, L, D, L * 0.25); g.fill(); }
  if (wreck) col = "#3a3530";
  switch (kind) {
    case "police": {   // v14.1: black-and-white cruiser, push bar, lightbar
      const ns = crVehicle.noShadow; crVehicle.noShadow = true; crVehicle.col = wreck ? null : "#f2f2f2";
      try { crVehicle(g, "sedan", L, D, v, h, false, wreck); } finally { crVehicle.noShadow = ns; crVehicle.col = null; }
      if (!wreck) {
        g.fillStyle = "#16181b"; crRR(g, x0 + 1, y0 + 1, L - 2, D * 0.27, L * 0.26); g.fill(); crRR(g, x0 + 2, y0 + D * 0.8, L - 4, D * 0.19, L * 0.22); g.fill();
        g.fillStyle = "#fffde7"; g.fillRect(x0 + 2, y0 + 1, 4, 2); g.fillRect(x0 + L - 6, y0 + 1, 4, 2); g.fillStyle = "#e53935"; g.fillRect(x0 + 2, y0 + D - 3, 4, 2); g.fillRect(x0 + L - 6, y0 + D - 3, 4, 2);
        g.fillStyle = "#2a2d31"; g.fillRect(x0 + 7, y0 - 2.5, L - 14, 3);
        g.fillStyle = "#26292d"; g.fillRect(x0 + 6, y0 + D * 0.5, L - 12, 4); g.fillStyle = "#e53935"; g.fillRect(x0 + 7, y0 + D * 0.5 + 0.8, (L - 14) / 2 - 1, 2.4); g.fillStyle = "#1e63e9"; g.fillRect(1, y0 + D * 0.5 + 0.8, (L - 14) / 2 - 1, 2.4);
        g.fillStyle = "#1a1c20"; g.font = "bold 6px sans-serif"; g.textAlign = "center"; g.fillText(String(10 + (h % 89)), 0, y0 + D * 0.66);
      }
      break;
    }
    case "pickup": {   // v14.1: cab + open bed (riders can stand in it)
      g.fillStyle = crSh(col, -0.35); crRR(g, x0, y0, L, D, L * 0.22); g.fill();
      g.fillStyle = col; crRR(g, x0 + 1, y0 + 1, L - 2, D * 0.55, L * 0.2); g.fill();
      const glass = wreck ? "#1a1a1a" : "#22323f";
      g.fillStyle = glass; g.beginPath(); g.moveTo(x0 + 3, y0 + D * 0.24); g.lineTo(x0 + L - 3, y0 + D * 0.24); g.lineTo(x0 + L - 5, y0 + D * 0.33); g.lineTo(x0 + 5, y0 + D * 0.33); g.fill();
      g.fillStyle = crSh(col, -0.08); crRR(g, x0 + 4, y0 + D * 0.33, L - 8, D * 0.17, 3); g.fill();
      g.fillStyle = glass; g.fillRect(x0 + 5, y0 + D * 0.5, L - 10, D * 0.03);
      g.fillStyle = crSh(col, -0.22); g.fillRect(x0 + 1, y0 + D * 0.57, L - 2, D * 0.42);
      g.fillStyle = "#2b2c2e"; g.fillRect(x0 + 4, y0 + D * 0.59, L - 8, D * 0.37); g.fillStyle = "rgba(255,255,255,0.07)"; for (let k = 1; k < 5; k++) g.fillRect(x0 + 4 + k * (L - 8) / 5, y0 + D * 0.59, 1, D * 0.37);
      g.fillStyle = "rgba(255,255,255,0.25)"; g.fillRect(x0 + 5, y0 + D * 0.25, (L - 10) * 0.35, 1.5);
      if (!wreck) { g.fillStyle = "#fffde7"; g.fillRect(x0 + 2, y0 + 1, 4, 2); g.fillRect(x0 + L - 6, y0 + 1, 4, 2); g.fillStyle = "#e53935"; g.fillRect(x0 + 2, y0 + D - 3, 4, 2); g.fillRect(x0 + L - 6, y0 + D - 3, 4, 2); }
      g.fillStyle = crSh(col, -0.3); g.fillRect(x0 - 1.5, y0 + D * 0.27, 2, 3); g.fillRect(x0 + L - 0.5, y0 + D * 0.27, 2, 3);
      break;
    }
    case "suv": {   // v14.1: boxy, long roof, roof rails
      g.fillStyle = crSh(col, -0.35); crRR(g, x0, y0, L, D, L * 0.18); g.fill();
      g.fillStyle = col; crRR(g, x0 + 1, y0 + 1, L - 2, D - 2, L * 0.16); g.fill();
      const glass = wreck ? "#1a1a1a" : "#22323f";
      g.fillStyle = crSh(col, 0.12); crRR(g, x0 + 3, y0 + 2, L - 6, D * 0.18, 3); g.fill();
      g.fillStyle = glass; g.beginPath(); g.moveTo(x0 + 3, y0 + D * 0.24); g.lineTo(x0 + L - 3, y0 + D * 0.24); g.lineTo(x0 + L - 5, y0 + D * 0.34); g.lineTo(x0 + 5, y0 + D * 0.34); g.fill();
      g.fillStyle = crSh(col, -0.1); crRR(g, x0 + 4, y0 + D * 0.34, L - 8, D * 0.52, 3); g.fill();
      g.fillStyle = "#2a2c30"; g.fillRect(x0 + 6, y0 + D * 0.38, 1.6, D * 0.44); g.fillRect(x0 + L - 7.6, y0 + D * 0.38, 1.6, D * 0.44);
      g.fillStyle = glass; g.fillRect(x0 + 5, y0 + D * 0.88, L - 10, D * 0.06);
      g.fillStyle = "rgba(255,255,255,0.25)"; g.fillRect(x0 + 5, y0 + D * 0.25, (L - 10) * 0.35, 1.5);
      if (!wreck) { g.fillStyle = "#fffde7"; g.fillRect(x0 + 2, y0 + 1, 4, 2); g.fillRect(x0 + L - 6, y0 + 1, 4, 2); g.fillStyle = "#e53935"; g.fillRect(x0 + 2, y0 + D - 3, 4, 2); g.fillRect(x0 + L - 6, y0 + D - 3, 4, 2); }
      g.fillStyle = crSh(col, -0.3); g.fillRect(x0 - 1.5, y0 + D * 0.27, 2, 3); g.fillRect(x0 + L - 0.5, y0 + D * 0.27, 2, 3);
      break;
    }
    case "sedan": case "rusted": case "anglia": {
      if (kind === "anglia") col = "#7fc8c8";
      if (kind === "rusted") col = ["#7a5a3a", "#5a6a6a", "#8a7a5a", "#6a4a3a"][v & 3];
      g.fillStyle = crSh(col, -0.35); crRR(g, x0, y0, L, D, L * 0.3); g.fill();
      g.fillStyle = col; crRR(g, x0 + 1, y0 + 1, L - 2, D - 2, L * 0.28); g.fill();
      g.fillStyle = crSh(col, 0.15); crRR(g, x0 + 3, y0 + 2, L - 6, D * 0.22, 4); g.fill();
      const glass = kind === "rusted" || wreck ? "#1a1a1a" : "#22323f";
      g.fillStyle = glass; g.beginPath(); g.moveTo(x0 + 3, y0 + D * 0.3); g.lineTo(x0 + L - 3, y0 + D * 0.3); g.lineTo(x0 + L - 5, y0 + D * 0.42); g.lineTo(x0 + 5, y0 + D * 0.42); g.fill();
      g.fillStyle = crSh(col, -0.08); crRR(g, x0 + 4, y0 + D * 0.42, L - 8, D * 0.3, 3); g.fill();
      g.fillStyle = glass; g.fillRect(x0 + 5, y0 + D * 0.74, L - 10, D * 0.08);
      g.fillStyle = "rgba(255,255,255,0.25)"; g.fillRect(x0 + 5, y0 + D * 0.31, (L - 10) * 0.35, 1.5);
      if (!wreck && kind !== "rusted") { g.fillStyle = "#fffde7"; g.fillRect(x0 + 2, y0 + 1, 4, 2); g.fillRect(x0 + L - 6, y0 + 1, 4, 2); g.fillStyle = "#e53935"; g.fillRect(x0 + 2, y0 + D - 3, 4, 2); g.fillRect(x0 + L - 6, y0 + D - 3, 4, 2); }
      g.fillStyle = crSh(col, -0.3); g.fillRect(x0 - 1.5, y0 + D * 0.33, 2, 3); g.fillRect(x0 + L - 0.5, y0 + D * 0.33, 2, 3);
      if (kind === "rusted" || wreck) { for (let k = 0; k < 5; k++) { g.fillStyle = k & 1 ? "rgba(120,60,20,0.55)" : "rgba(20,15,10,0.45)"; g.beginPath(); g.arc(x0 + ((h >> k) % L), y0 + ((h >> (k + 3)) % D), 2 + (k % 3), 0, 7); g.fill(); } }
      if (kind === "anglia") { g.fillStyle = "#e0f2f1"; g.fillRect(x0 + 2, y0 + D * 0.5, L - 4, 1); }
      break;
    }
    case "spinner": {
      g.fillStyle = "#15151c"; g.beginPath(); g.moveTo(0, y0); g.lineTo(x0 + L, y0 + D * 0.55); g.lineTo(x0 + L - 2, y0 + D); g.lineTo(x0 + 2, y0 + D); g.lineTo(x0, y0 + D * 0.55); g.closePath(); g.fill();
      g.save(); g.shadowColor = v & 1 ? "#ff2bd6" : "#22e6ff"; g.shadowBlur = 8; g.strokeStyle = v & 1 ? "#ff2bd6" : "#22e6ff"; g.lineWidth = 1.2; g.stroke(); g.restore();
      g.fillStyle = "rgba(60,200,255,0.5)"; g.beginPath(); g.ellipse(0, y0 + D * 0.42, L * 0.24, D * 0.16, 0, 0, 7); g.fill();
      g.fillStyle = "#ff3b3b"; g.fillRect(x0 + 3, y0 + D - 3, L - 6, 1.5);
      break;
    }
    case "speeder": case "hover": case "mule": {
      const c = kind === "speeder" ? ["#c0582c", "#d8c8a8", "#8a949a", "#b8402a"][v & 3] : kind === "mule" ? "#9a5a2a" : (fam === "scifi" ? ["#e8eef2", "#b8c2cc", "#3a4048", "#c8102e"][v & 3] : col);
      if (kind === "mule") { g.fillStyle = crSh(c, -0.3); crRR(g, x0, y0, L, D, 3); g.fill(); g.fillStyle = c; crRR(g, x0 + 1.5, y0 + 1.5, L - 3, D - 3, 2); g.fill(); g.fillStyle = crSh(c, -0.2); g.fillRect(x0 + 3, y0 + D * 0.35, L - 6, D * 0.55); g.fillStyle = "#3a3a3a"; g.fillRect(x0 + 3, y0 + 3, L - 6, D * 0.18); crGlow(g, 0, y0 + D, L * 0.5, "#ff7043", 0.25); break; }
      g.fillStyle = crSh(c, -0.35); crRR(g, x0, y0, L, D, L * 0.45); g.fill();
      g.fillStyle = c; crRR(g, x0 + 1, y0 + 1, L - 2, D - 2, L * 0.42); g.fill();
      g.fillStyle = "rgba(120,200,240,0.55)"; crRR(g, x0 + 3, y0 + D * 0.18, L - 6, D * 0.16, 4); g.fill();
      g.fillStyle = crSh(c, -0.25); crRR(g, x0 + 3, y0 + D * 0.38, L - 6, D * 0.25, 4); g.fill();
      if (kind === "speeder") { g.fillStyle = "#5a5a5a"; for (const ex of [x0 + 1, -2.5, x0 + L - 6]) { crRR(g, ex, y0 + D * 0.72, 5, D * 0.26, 2); g.fill(); } crGlow(g, 0, y0 + D + 2, L * 0.6, "#ffab40", 0.3); }
      else { g.save(); g.shadowColor = T.fu.glow || "#4fc3ff"; g.shadowBlur = 6; g.fillStyle = crA(T.fu.glow || "#4fc3ff", 0.9); g.fillRect(x0 + 2, y0 + D * 0.66, L - 4, 1.5); g.restore(); crGlow(g, 0, 0, L * 0.8, T.fu.glow || "#4fc3ff", 0.12); }
      break;
    }
    case "apc": case "rhino": case "armytruck": {
      const c = kind === "rhino" ? "#3a4a3a" : kind === "armytruck" ? (fam === "scifi" ? "#5a6058" : "#4a5a3a") : "#5a6a4a";
      g.fillStyle = "#1e1e1e"; g.fillRect(x0 - 1.5, y0 + 2, 3, D - 4); g.fillRect(x0 + L - 1.5, y0 + 2, 3, D - 4);
      g.fillStyle = crSh(c, -0.3); crRR(g, x0 + 1, y0, L - 2, D, 2); g.fill(); g.fillStyle = c; crRR(g, x0 + 2, y0 + 1, L - 4, D - 2, 2); g.fill();
      if (kind === "armytruck") { g.fillStyle = crSh(c, 0.12); g.fillRect(x0 + 2, y0 + D * 0.32, L - 4, D * 0.66); g.fillStyle = "rgba(0,0,0,0.2)"; for (let k = 1; k < 4; k++) g.fillRect(x0 + 2, y0 + D * 0.32 + k * D * 0.16, L - 4, 1); g.fillStyle = "#22323f"; g.fillRect(x0 + 4, y0 + D * 0.18, L - 8, D * 0.08); }
      else { g.fillStyle = crSh(c, -0.15); g.fillRect(x0 + 4, y0 + D * 0.25, L - 8, D * 0.45); g.fillStyle = "#2a2a2a"; g.beginPath(); g.arc(0, y0 + D * 0.45, L * 0.18, 0, 7); g.fill(); g.fillStyle = "#1a1a1a"; g.fillRect(-1, y0 + D * 0.1, 2, D * 0.35); if (kind === "rhino") { g.fillStyle = "#c9a227"; g.beginPath(); g.moveTo(-4, y0 + D * 0.8); g.lineTo(0, y0 + D * 0.74); g.lineTo(4, y0 + D * 0.8); g.lineTo(0, y0 + D * 0.86); g.fill(); } else { g.fillStyle = "#f2c200"; for (let k = 0; k < 3; k++) g.fillRect(x0 + 3 + k * 5, y0 + D - 4, 3, 2); } }
      break;
    }
    case "wagon": case "cart": {
      const bedY = y0 + D * 0.38;
      crHorse(g, -L * 0.18, y0 + D * 0.16, Math.min(1, D / 140), "#6d4c2f"); if (kind === "wagon") crHorse(g, L * 0.18, y0 + D * 0.16, Math.min(1, D / 140), "#4e342e");
      g.fillStyle = "#3a2a1a"; g.fillRect(-0.8, y0 + D * 0.25, 1.6, D * 0.15);
      crWheel(g, x0 + 1, bedY + 4, 3.5, true); crWheel(g, x0 + L - 1, bedY + 4, 3.5, true); if (kind === "wagon") { crWheel(g, x0 + 1, y0 + D - 4, 3.5, true); crWheel(g, x0 + L - 1, y0 + D - 4, 3.5, true); }
      g.fillStyle = "#7a5432"; g.fillRect(x0 + 2, bedY, L - 4, y0 + D - bedY - 1);
      if (kind === "wagon") { g.fillStyle = "#ece4d0"; crRR(g, x0 + 1.5, bedY + 2, L - 3, y0 + D - bedY - 5, 4); g.fill(); g.fillStyle = "rgba(0,0,0,0.1)"; for (let k = 1; k < 4; k++) g.fillRect(x0 + 1.5, bedY + 2 + k * (D * 0.55) / 4, L - 3, 1); }
      else { g.fillStyle = crPat("straw", "#c8a85a"); g.fillRect(x0 + 3, bedY + 1, L - 6, y0 + D - bedY - 3); }
      break;
    }
    case "thopter": {
      g.fillStyle = "rgba(200,190,170,0.75)"; for (const s of [-1, 1]) for (const yy of [y0 + D * 0.3, y0 + D * 0.55]) { g.save(); g.translate(0, yy); g.rotate(s * 0.08); g.fillRect(s > 0 ? L * 0.1 : -L * 1.25, -2, L * 1.15, 4); g.restore(); }
      g.fillStyle = "#7a6a52"; crRR(g, x0 + L * 0.2, y0, L * 0.6, D, L * 0.3); g.fill(); g.fillStyle = "rgba(60,80,90,0.7)"; crRR(g, x0 + L * 0.27, y0 + 2, L * 0.46, D * 0.2, 4); g.fill();
      break;
    }
    case "glider": {
      g.strokeStyle = "#c8a040"; g.lineWidth = 3.5; g.beginPath(); g.arc(0, y0 + D * 0.7, L * 0.9, Math.PI * 1.15, Math.PI * 1.85); g.stroke();
      g.fillStyle = "#b8902a"; crRR(g, -L * 0.18, y0 + D * 0.2, L * 0.36, D * 0.65, 4); g.fill(); g.fillStyle = "rgba(255,209,102,0.85)"; g.beginPath(); g.arc(0, y0 + D * 0.35, L * 0.12, 0, 7); g.fill();
      break;
    }
    case "firetruck": {
      const c = fam === "rustic" ? "#7a2a1a" : "#c62828";
      g.fillStyle = crSh(c, -0.35); crRR(g, x0, y0, L, D, 3); g.fill(); g.fillStyle = c; crRR(g, x0 + 1, y0 + 1, L - 2, D - 2, 3); g.fill();
      g.fillStyle = "#22323f"; g.fillRect(x0 + 3, y0 + 4, L - 6, D * 0.08);
      g.fillStyle = "#cfd8dc"; g.fillRect(-3, y0 + D * 0.22, 6, D * 0.72); g.fillStyle = "#90a4ae"; for (let k = 0; k < 10; k++) g.fillRect(-3, y0 + D * 0.24 + k * D * 0.07, 6, 1);
      g.fillStyle = "#fffde7"; g.fillRect(x0 + 2, y0 + 1, 4, 2); g.fillRect(x0 + L - 6, y0 + 1, 4, 2); g.fillStyle = "#2196f3"; g.fillRect(x0 + 4, y0 + D * 0.15, 3, 2); g.fillStyle = "#f44336"; g.fillRect(x0 + L - 7, y0 + D * 0.15, 3, 2);
      break;
    }
    case "forklift": { g.fillStyle = "#f9a825"; crRR(g, x0 + 1, y0 + D * 0.3, L - 2, D * 0.65, 3); g.fill(); g.fillStyle = "#212121"; g.fillRect(x0 + 3, y0 + D * 0.45, L - 6, D * 0.25); g.fillStyle = "#616161"; g.fillRect(x0 + 2, y0, 2, D * 0.32); g.fillRect(x0 + L - 4, y0, 2, D * 0.32); break; }
    case "tractor": {
      if (fam === "rustic" && CITY.themeKey !== "frontier") { crVehicle(g, "cart", L, D, v, h, false); break; }
      const c = h & 1 ? "#2e7d32" : "#c62828";
      g.fillStyle = "#212121"; g.fillRect(x0 - 1, y0 + D * 0.6, 4, D * 0.36); g.fillRect(x0 + L - 3, y0 + D * 0.6, 4, D * 0.36); g.fillRect(x0 + 1, y0 + 2, 3, D * 0.2); g.fillRect(x0 + L - 4, y0 + 2, 3, D * 0.2);
      g.fillStyle = c; crRR(g, x0 + 3, y0 + 1, L - 6, D * 0.55, 3); g.fill(); g.fillStyle = crSh(c, -0.2); g.fillRect(x0 + 2, y0 + D * 0.55, L - 4, D * 0.4); g.fillStyle = "#22323f"; g.fillRect(x0 + 4, y0 + D * 0.62, L - 8, D * 0.2);
      break;
    }
    case "bus": {
      const knight = CITY.themeKey === "wizard", coach = CITY.themeKey === "western" || CITY.themeKey === "medieval";
      if (coach) { crVehicle(g, "wagon", L, D, v, h, false); break; }
      const c = knight ? "#5e35b1" : fam === "scifi" ? (T.fu.white || "#e8eef2") : "#f9a825";
      g.fillStyle = crSh(c, -0.35); crRR(g, x0, y0, L, D, fam === "scifi" ? 8 : 3); g.fill(); g.fillStyle = c; crRR(g, x0 + 1, y0 + 1, L - 2, D - 2, fam === "scifi" ? 7 : 3); g.fill();
      g.fillStyle = "#22323f"; g.fillRect(x0 + 3, y0 + 3, L - 6, D * 0.05); g.fillStyle = "rgba(0,0,0,0.18)"; for (let k = 1; k < 8; k++) g.fillRect(x0 + 2, y0 + k * D / 8, L - 4, 1);
      if (fam === "scifi") { g.fillStyle = crA(T.fu.glow || "#4fc3ff", 0.85); g.fillRect(x0 + 2, y0 + D * 0.5, L - 4, 1.5); }
      if (knight) { g.fillStyle = "#ffd54f"; g.font = "bold 7px serif"; g.textAlign = "center"; g.save(); g.rotate(Math.PI / 2); g.fillText("KNIGHT BUS", 0, 2.5); g.restore(); }
      break;
    }
    case "trailer": {   // v14.1: a semi - cab up front, so every truck in the yard can be driven
      const cab = Math.min(D * 0.2, 84), cc = fam === "scifi" ? (T.fu.white || "#e8eef2") : ["#c62828", "#1565c0", "#eceff1", "#2e7d32"][h & 3];
      g.fillStyle = "#cfd2d4"; crRR(g, x0, y0 + cab + 4, L, D - cab - 4, 2); g.fill(); g.fillStyle = "rgba(0,0,0,0.12)"; for (let k = 1; k < 10; k++) g.fillRect(x0 + 1, y0 + cab + 4 + k * (D - cab - 4) / 10, L - 2, 1);
      g.fillStyle = "#3a3a3a"; g.fillRect(-6, y0 + cab - 2, 12, 8);
      g.fillStyle = crSh(cc, -0.35); crRR(g, x0 + 1, y0, L - 2, cab, 5); g.fill(); g.fillStyle = cc; crRR(g, x0 + 2, y0 + 1, L - 4, cab - 2, 4); g.fill();
      g.fillStyle = "#22323f"; g.fillRect(x0 + 4, y0 + cab * 0.2, L - 8, cab * 0.16); g.fillStyle = crSh(cc, -0.15); g.fillRect(x0 + 4, y0 + cab * 0.45, L - 8, cab * 0.45);
      g.fillStyle = "#b0b6bb"; g.fillRect(x0 + 3, y0 + 1, L - 6, 2.5); g.fillStyle = "#fffde7"; g.fillRect(x0 + 3, y0 + 0.5, 4, 2); g.fillRect(x0 + L - 7, y0 + 0.5, 4, 2);
      g.fillStyle = "#9aa0a6"; g.fillRect(x0 - 1.5, y0 + cab * 0.25, 2, 5); g.fillRect(x0 + L - 0.5, y0 + cab * 0.25, 2, 5);
      g.fillStyle = "#e53935"; g.fillRect(x0 + 2, y0 + D - 3, 5, 2); g.fillRect(x0 + L - 7, y0 + D - 3, 5, 2);
      break;
    }
    default: crVehicle(g, "sedan", L, D, v, h, false, wreck);
  }
}

/* --- trees, lamps & street props -------------------------------------------------- */
function crTree(g, x, y, p, h) {
  const T = CITY.theme, kind = p.wild && (T.tree === "holo" || T.tree === "planter" || T.tree === "topiary" || T.tree === "vaporator") ? "oak" : T.tree, s = (p.sz || 1) * (0.85 + (h & 7) * 0.05);
  const gc = T.g.woods, leaf = CITY.themeKey === "wasteland" || CITY.themeKey === "gothic" ? "#5a5a3a" : (CITY.themeKey === "neon" ? "#1f5a4a" : "#3d7a33");
  switch (kind) {
    case "oak": case "scrub": {
      const R = (kind === "scrub" ? 14 : 30) * s;
      g.fillStyle = "rgba(0,0,0,0.22)"; g.beginPath(); g.arc(x + 6, y + 8, R, 0, 7); g.fill();
      const base = kind === "scrub" ? "#7a7a3a" : leaf;
      for (let k = 0; k < 7; k++) { const a = k * 0.9 + (h & 15), rr = R * (k === 0 ? 0.75 : 0.55); g.fillStyle = crSh(base, -0.25 + (k / 7) * 0.3); g.beginPath(); g.arc(x + (k ? Math.cos(a) * R * 0.45 : 0), y + (k ? Math.sin(a) * R * 0.45 : 0), rr, 0, 7); g.fill(); }
      g.fillStyle = "rgba(255,255,255,0.08)"; g.beginPath(); g.arc(x - R * 0.25, y - R * 0.25, R * 0.4, 0, 7); g.fill();
      break;
    }
    case "dead": {
      g.strokeStyle = "#3a3028"; g.lineCap = "round";
      for (let k = 0; k < 6; k++) { const a = k * 1.05 + (h & 7), l = (12 + ((h >> k) & 7) * 2) * s; g.lineWidth = 3 - k * 0.3; g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l); g.lineTo(x + Math.cos(a + 0.4) * l * 1.4, y + Math.sin(a + 0.4) * l * 1.4); g.stroke(); }
      g.fillStyle = "#2a2018"; g.beginPath(); g.arc(x, y, 4 * s, 0, 7); g.fill(); g.lineCap = "butt";
      break;
    }
    case "palm": {
      g.fillStyle = "rgba(0,0,0,0.2)"; g.beginPath(); g.arc(x + 5, y + 6, 18 * s, 0, 7); g.fill();
      for (let k = 0; k < 8; k++) { const a = k * 0.785 + (h & 7) * 0.2; g.fillStyle = k & 1 ? "#3a7a2a" : "#4a8a32"; g.beginPath(); g.ellipse(x + Math.cos(a) * 11 * s, y + Math.sin(a) * 11 * s, 12 * s, 3.2 * s, a, 0, 7); g.fill(); }
      g.fillStyle = "#8a6a3a"; g.beginPath(); g.arc(x, y, 3.5 * s, 0, 7); g.fill();
      break;
    }
    case "cactus": {
      g.fillStyle = "rgba(0,0,0,0.2)"; g.beginPath(); g.ellipse(x + 4, y + 5, 10 * s, 5 * s, 0, 0, 7); g.fill();
      g.fillStyle = "#4a7a3a"; crRR(g, x - 3 * s, y - 10 * s, 6 * s, 20 * s, 3 * s); g.fill(); crRR(g, x - 10 * s, y - 4 * s, 8 * s, 4 * s, 2 * s); g.fill(); crRR(g, x + 2 * s, y - 2 * s, 8 * s, 4 * s, 2 * s); g.fill();
      g.fillStyle = "#6a9a4a"; g.fillRect(x - 0.6 * s, y - 9 * s, 1.2 * s, 18 * s);
      break;
    }
    case "vaporator": {
      g.fillStyle = "rgba(0,0,0,0.22)"; g.beginPath(); g.arc(x + 4, y + 5, 9, 0, 7); g.fill();
      g.fillStyle = "#9aa0a6"; g.beginPath(); g.arc(x, y, 7, 0, 7); g.fill(); g.fillStyle = "#c8ccd0"; g.beginPath(); g.arc(x, y, 4.5, 0, 7); g.fill();
      g.strokeStyle = "#6a7076"; g.lineWidth = 1.5; for (let k = 0; k < 3; k++) { const a = k * 2.09; g.beginPath(); g.moveTo(x + Math.cos(a) * 4, y + Math.sin(a) * 4); g.lineTo(x + Math.cos(a) * 11, y + Math.sin(a) * 11); g.stroke(); }
      g.fillStyle = "#40c4ff"; g.beginPath(); g.arc(x, y, 1.5, 0, 7); g.fill();
      break;
    }
    case "holo": case "planter": case "topiary": {
      if (kind === "holo") { crGlow(g, x, y, 22 * s, "#22e6ff", 0.25); g.strokeStyle = "rgba(34,230,255,0.6)"; g.lineWidth = 1; for (let k = 0; k < 3; k++) { g.beginPath(); g.arc(x, y, (8 + k * 5) * s, 0, 7); g.stroke(); } g.fillStyle = "#2a2a35"; g.fillRect(x - 4, y - 4, 8, 8); break; }
      if (kind === "planter") { g.fillStyle = "#4a4f56"; crRR(g, x - 12, y - 12, 24, 24, 3); g.fill(); g.fillStyle = "#59c8ff"; g.fillRect(x - 12, y + 11, 24, 1); }
      g.fillStyle = "rgba(0,0,0,0.2)"; g.beginPath(); g.arc(x + 4, y + 5, 14 * s, 0, 7); g.fill();
      g.fillStyle = "#3e8a4e"; g.beginPath(); g.arc(x, y, 12 * s, 0, 7); g.fill(); g.fillStyle = "#56a066"; g.beginPath(); g.arc(x - 3, y - 3, 7 * s, 0, 7); g.fill();
      break;
    }
    default: g.fillStyle = leaf; g.beginPath(); g.arc(x, y, 24 * s, 0, 7); g.fill();
  }
}
const CR_DIR = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] };
function crLamp(g, x, y, o, pole) {
  const T = CITY.theme, k = T.lamp, d = CR_DIR[o] || [0, -1];
  // the arm reaches out over the road (away from the block)
  const ax = x - d[0] * 22, ay = y - d[1] * 22;
  g.fillStyle = "rgba(0,0,0,0.25)"; g.beginPath(); g.arc(x + 2, y + 3, 3, 0, 7); g.fill();
  if (pole) { g.fillStyle = "#6a4a2a"; g.beginPath(); g.arc(x, y, 3, 0, 7); g.fill(); g.strokeStyle = "rgba(20,20,20,0.5)"; g.lineWidth = 0.8; g.beginPath(); g.moveTo(x - 30 * Math.abs(d[1]), y - 30 * Math.abs(d[0])); g.lineTo(x + 30 * Math.abs(d[1]), y + 30 * Math.abs(d[0])); g.stroke(); return; }
  switch (k) {
    case "torch": case "brazier": case "candle": case "oil": case "lantern": case "glowglobe": case "glowrod": {
      const fire = k === "torch" || k === "brazier", c = k === "lantern" ? "#ff5a3a" : k === "glowglobe" ? "#ffcc80" : k === "glowrod" ? "#b3e5fc" : "#ffb74d";
      g.fillStyle = k === "brazier" ? "#3a3a3a" : "#4a3a2a"; g.beginPath(); g.arc(x, y, fire ? 4 : 2.5, 0, 7); g.fill();
      crGlow(g, x, y, fire ? 26 : 20, c, 0.32); g.fillStyle = c; g.beginPath(); g.arc(x, y, fire ? 2.6 : 2, 0, 7); g.fill();
      if (k === "candle") { crCandle(g, x + 6, y - 5); }
      break;
    }
    case "holo": case "flood": {
      const c = k === "holo" ? (T.fu.glow || "#59c8ff") : "#f5f5dc";
      g.fillStyle = "#2a2d33"; g.beginPath(); g.arc(x, y, 3, 0, 7); g.fill();
      g.strokeStyle = "#3a3e45"; g.lineWidth = 2; g.beginPath(); g.moveTo(x, y); g.lineTo(ax, ay); g.stroke();
      crGlow(g, ax, ay, k === "flood" ? 40 : 30, c, k === "flood" ? 0.2 : 0.25); g.fillStyle = c; g.fillRect(ax - 3, ay - 3, 6, 6);
      break;
    }
    case "broken": default: {
      const lit = k !== "broken" || ((x * 7 + y) & 3) === 0;
      g.fillStyle = "#5a5f66"; g.beginPath(); g.arc(x, y, 3, 0, 7); g.fill();
      g.strokeStyle = "#5a5f66"; g.lineWidth = 2; g.beginPath(); g.moveTo(x, y); g.lineTo(ax, ay); g.stroke();
      g.fillStyle = lit ? "#fff8e1" : "#3a3a3a"; crRR(g, ax - 4, ay - 3, 8, 6, 2); g.fill();
      if (lit) crGlow(g, ax, ay, 34, "#fff3c4", 0.14);
    }
  }
}
function crProp(g, p, h) {
  const T = CITY.theme, fam = crFam(), X = p.x * 16, Y = p.y * 16, W = p.w * 16, H = p.h * 16, cx = X + W / 2, cy = Y + H / 2;
  switch (p.t) {
    case "car": case "bus": case "trailer": case "armytruck": case "tractor": {
      const o = typeof p.o === "number" ? p.o : 0, L = (o & 1) ? H : W, D = (o & 1) ? W : H;
      g.save(); g.translate(cx, cy); g.rotate(o * Math.PI / 2 + (p.ang || 0));
      crVehicle(g, p.t, Math.min(L, D), Math.max(L, D), p.v | 0, h, p.t === "car", !!p.wreck);
      g.restore(); return;
    }
    case "streetlight": case "pole": crLamp(g, cx, cy, p.o, p.t === "pole"); return;
    case "stall": {
      g.fillStyle = CITY.themeKey === "neon" ? "rgba(255,43,214,0.6)" : (fam === "rustic" ? "rgba(0,0,0,0.12)" : "rgba(240,240,232,0.7)");
      if (W < H) { g.fillRect(X, Y, 1.5, H); g.fillRect(X + W - 1.5, Y, 1.5, H); } else { g.fillRect(X, Y, W, 1.5); g.fillRect(X, Y + H - 1.5, W, 1.5); }
      return;
    }
    case "hydrant": {
      if (fam === "rustic") { g.fillStyle = "#5a3a1e"; g.beginPath(); g.arc(cx, cy, 6, 0, 7); g.fill(); g.fillStyle = "rgba(90,140,170,0.8)"; g.beginPath(); g.arc(cx, cy, 4, 0, 7); g.fill(); return; }
      if (fam === "scifi") { g.fillStyle = "#3a4048"; g.fillRect(cx - 4, cy - 4, 8, 8); g.fillStyle = crA(T.fu.glow || "#4fc3ff", 0.9); g.fillRect(cx - 3, cy - 1, 6, 2); return; }
      g.fillStyle = "#c62828"; g.beginPath(); g.arc(cx, cy, 4.5, 0, 7); g.fill(); g.fillStyle = "#ef5350"; g.beginPath(); g.arc(cx - 1, cy - 1, 2, 0, 7); g.fill(); g.fillStyle = "#8e0000"; g.fillRect(cx - 7, cy - 1.5, 14, 3);
      return;
    }
    case "trashcan": {
      if (fam === "rustic") { g.fillStyle = "#6a4a2a"; g.beginPath(); g.arc(cx, cy, 6, 0, 7); g.fill(); g.strokeStyle = "#2a2a2a"; g.lineWidth = 1; g.beginPath(); g.arc(cx, cy, 4.5, 0, 7); g.stroke(); return; }
      g.fillStyle = fam === "scifi" ? "#3a4048" : "#2e5a3a"; g.beginPath(); g.arc(cx, cy, 6, 0, 7); g.fill(); g.fillStyle = fam === "scifi" ? crA(T.fu.glow || "#4fc3ff", 0.7) : "#3e6a4a"; g.beginPath(); g.arc(cx, cy, 3.5, 0, 7); g.fill();
      if ((h & 3) === 0) { g.fillStyle = "#e8e4d8"; g.fillRect(cx + 4, cy + 2, 5, 4); }
      return;
    }
    case "mailbox": {
      if (CITY.themeKey === "wizard") { g.fillStyle = "#5a3a1e"; g.fillRect(cx - 1, cy - 1, 2, 2); g.fillStyle = "#8a7a6a"; g.beginPath(); g.ellipse(cx, cy - 2, 3, 4, 0, 0, 7); g.fill(); g.fillStyle = "#ffd54f"; g.fillRect(cx - 2, cy - 4, 1, 1); g.fillRect(cx + 1, cy - 4, 1, 1); return; }
      g.fillStyle = "#5a5a5a"; g.fillRect(cx - 1, cy - 1, 2, 2); g.fillStyle = fam === "rustic" ? "#7a5a3a" : (fam === "scifi" ? "#8a949c" : "#37474f"); crRR(g, cx - 3, cy - 6, 6, 9, 2); g.fill(); if (fam === "earth") { g.fillStyle = "#c62828"; g.fillRect(cx + 3, cy - 5, 1.5, 3); }
      return;
    }
    case "bench": {
      g.save(); g.translate(cx, cy); if (typeof p.o === "number") g.rotate(p.o * 1.047 + Math.PI / 2); else if (p.o === "W" || p.o === "E") g.rotate(Math.PI / 2);
      g.fillStyle = "rgba(0,0,0,0.2)"; g.fillRect(-W / 2 + 2, -5, Math.max(W, H, 24), 10);
      g.fillStyle = fam === "scifi" ? "#6a7078" : "#7a5432"; const bl = Math.max(W, H, 24); g.fillRect(-bl / 2, -5, bl, 10); g.fillStyle = "rgba(0,0,0,0.25)"; g.fillRect(-bl / 2, -1, bl, 1); g.fillRect(-bl / 2, 2, bl, 1); g.fillStyle = "#2a2a2a"; g.fillRect(-bl / 2, -5, bl, 2);
      g.restore(); return;
    }
    case "newsbox": { const c = CITY.themeKey === "wizard" ? "#4a2a5a" : (fam === "scifi" ? "#2a3a4a" : (h & 1 ? "#1565c0" : "#c62828")); g.fillStyle = c; g.fillRect(cx - 5, cy - 5, 10, 10); g.fillStyle = fam === "scifi" ? crA(T.fu.glow || "#4fc3ff", 0.8) : "#e8e4d8"; g.fillRect(cx - 3, cy - 3, 6, 4); return; }
    case "hedge": { g.fillStyle = crSh(T.g.woods, -0.1); crRR(g, X, Y, W, H, 6); g.fill(); g.fillStyle = crSh(T.g.woods, 0.1); for (let k = 0; k < Math.max(W, H) / 10; k++) { g.beginPath(); g.arc(W > H ? X + 5 + k * 10 : cx, W > H ? cy : Y + 5 + k * 10, 4.5, 0, 7); g.fill(); } return; }
    case "grill": { if (fam === "rustic") { g.fillStyle = "#5a5a5a"; g.beginPath(); g.arc(cx, cy, 7, 0, 7); g.fill(); g.fillStyle = "#2a2a2a"; g.beginPath(); g.arc(cx, cy, 5, 0, 7); g.fill(); return; } g.fillStyle = "#212121"; g.beginPath(); g.arc(cx, cy, 6.5, 0, 7); g.fill(); g.strokeStyle = "#616161"; g.lineWidth = 0.8; for (let k = -4; k <= 4; k += 2) { g.beginPath(); g.moveTo(cx + k, cy - 5); g.lineTo(cx + k, cy + 5); g.stroke(); } return; }
    case "pump": {
      const k = CITY.themeKey;
      if (k === "medieval" || k === "western" || k === "frontier") { g.fillStyle = crPat("straw", "#c8a85a"); crRR(g, X + 1, Y + 1, W - 2, H - 2, 4); g.fill(); g.fillStyle = "#6a4a2a"; g.fillRect(X, cy - 1, W, 2); return; }
      if (k === "wizard") { g.fillStyle = "#3a2a4a"; g.beginPath(); g.arc(cx, cy, Math.min(W, H) / 2 - 1, 0, 7); g.fill(); crGlow(g, cx, cy, 14, "#76ff03", 0.35); return; }
      const c = fam === "scifi" ? "#2a3038" : (k === "gothic" ? "#5a4a3a" : (k === "pharaoh" ? "#b8902a" : "#eceff1"));
      g.fillStyle = "rgba(0,0,0,0.25)"; g.fillRect(X + 3, Y + 3, W, H);
      g.fillStyle = c; crRR(g, X + 1, Y + 1, W - 2, H - 2, fam === "scifi" ? 4 : 2); g.fill();
      g.fillStyle = fam === "scifi" || k === "pharaoh" ? crA(T.fu.glow || "#4fc3ff", 0.9) : "#c62828"; g.fillRect(X + 3, Y + 3, W - 6, 4);
      if (fam === "scifi" || k === "pharaoh") crGlow(g, cx, cy, 16, T.fu.glow || "#4fc3ff", 0.25);
      g.strokeStyle = "#212121"; g.lineWidth = 1.5; g.beginPath(); g.moveTo(X + W - 2, cy); g.quadraticCurveTo(X + W + 6, cy + 6, X + W + 2, cy + 10); g.stroke();
      if (k === "gothic") { g.fillStyle = "#e8e0c8"; g.beginPath(); g.arc(cx, cy + 2, 2.5, 0, 7); g.fill(); }
      return;
    }
    case "canopy": return;   // drawn live with the roofs
    case "pricesign": case "pylon": case "evacsign": {
      const lab = p.t === "evacsign" ? "EVAC ROUTE" : p.t === "pricesign" ? cityThemedSign("gasstore", "GAS") : (p.kind ? cityThemedSign(p.kind, p.label) : (p.label || ""));
      g.fillStyle = "#4a4f56"; g.fillRect(cx - 1.5, cy - 1.5, 3, 3);
      const sw = Math.max(26, Math.min(70, lab.length * 4.6 + 8));
      g.fillStyle = p.t === "evacsign" ? "#e65100" : (fam === "rustic" ? "#5a3a1e" : (fam === "scifi" ? "#15191e" : "#f5f5f5"));
      crRR(g, cx - sw / 2, cy - 14, sw, 11, 2); g.fill();
      if (fam === "scifi" && T.fu.glow) { g.strokeStyle = T.fu.glow; g.lineWidth = 1; crRR(g, cx - sw / 2, cy - 14, sw, 11, 2); g.stroke(); }
      g.fillStyle = p.t === "evacsign" ? "#fff" : (fam === "rustic" ? "#f0e0b0" : (fam === "scifi" ? (T.fu.glow || "#4fc3ff") : "#b71c1c"));
      g.font = "bold 6.5px sans-serif"; g.textAlign = "center"; g.fillText(lab.slice(0, 16), cx, cy - 6.5);
      return;
    }
    case "icechest": { g.fillStyle = "#e3f2fd"; g.fillRect(X + 1, Y + 1, W - 2, H - 2); g.fillStyle = "#1565c0"; g.font = "bold 6px sans-serif"; g.textAlign = "center"; g.fillText(fam === "scifi" ? "CRYO" : fam === "rustic" ? "ICE" : "ICE", cx, cy + 2); return; }
    case "airpump": { g.fillStyle = "#c62828"; g.fillRect(cx - 4, cy - 4, 8, 8); return; }
    case "stopsign": case "trafficlight": {
      if (fam === "rustic") { g.fillStyle = "#5a3a1e"; g.fillRect(cx - 1.5, cy - 1.5, 3, 3); g.fillRect(cx - 7, cy - 7, 12, 3); return; }
      if (p.t === "trafficlight") { g.fillStyle = "#4a4f56"; g.beginPath(); g.arc(cx, cy, 2.5, 0, 7); g.fill(); g.fillStyle = "#212121"; crRR(g, cx - 4, cy - 12, 8, 10, 2); g.fill(); g.fillStyle = "#ffb300"; g.beginPath(); g.arc(cx, cy - 7, 2.2, 0, 7); g.fill(); crGlow(g, cx, cy - 7, 8, "#ffb300", 0.3); return; }
      g.fillStyle = "#6a6f76"; g.fillRect(cx - 1, cy - 1, 2, 2);
      g.fillStyle = fam === "scifi" ? crA(T.fu.accent || "#ff3b4a", 0.9) : "#c62828"; g.beginPath(); for (let k = 0; k < 8; k++) { const a = k * 0.785 + 0.39; g.lineTo(cx + Math.cos(a) * 5.5, cy - 7 + Math.sin(a) * 5.5); } g.fill();
      g.fillStyle = "#fff"; g.fillRect(cx - 3, cy - 7.5, 6, 1);
      return;
    }
    case "playset": { g.strokeStyle = "#e53935"; g.lineWidth = 2; g.strokeRect(X + 2, Y + 2, W - 4, H - 4); g.fillStyle = "#fdd835"; g.fillRect(X + 4, cy - 3, W * 0.3, 6); g.fillStyle = "#1e88e5"; g.fillRect(X + W * 0.6, Y + 4, 6, H - 8); return; }
    case "pillar": { g.fillStyle = "rgba(0,0,0,0.25)"; g.fillRect(X + 3, Y + 3, W, H); g.fillStyle = fam === "scifi" ? T.w.metal : "#bdbdbd"; g.fillRect(X, Y, W, H); return; }
    case "dumpster": { g.fillStyle = "rgba(0,0,0,0.25)"; g.fillRect(X + 3, Y + 4, W, H); g.fillStyle = fam === "scifi" ? "#3a4a5a" : (h & 1 ? "#2e5a3a" : "#1e4a7a"); g.fillRect(X, Y, W, H); g.fillStyle = "rgba(0,0,0,0.25)"; if (W > H) g.fillRect(cx - 0.5, Y, 1, H); else g.fillRect(X, cy - 0.5, W, 1); if ((h & 3) === 1) { g.fillStyle = "#e8e4d8"; g.fillRect(X + W - 6, Y - 3, 5, 4); } return; }
    case "busstop": { g.fillStyle = "rgba(0,0,0,0.2)"; g.fillRect(X + 3, Y + 3, W, H); g.fillStyle = fam === "scifi" ? crA(T.fu.glow || "#4fc3ff", 0.35) : "rgba(180,210,230,0.55)"; g.fillRect(X, Y, W, H); g.strokeStyle = fam === "rustic" ? "#5a3a1e" : "#5a5f66"; g.lineWidth = 1.5; g.strokeRect(X, Y, W, H); return; }
    case "container": { const c = ["#c62828", "#1565c0", "#2e7d32", "#ef6c00", "#6a1b9a"][h % 5]; g.fillStyle = "rgba(0,0,0,0.25)"; g.fillRect(X + 4, Y + 4, W, H); g.fillStyle = c; g.fillRect(X, Y, W, H); g.fillStyle = "rgba(0,0,0,0.18)"; for (let k = 4; k < Math.max(W, H); k += 4) { if (W > H) g.fillRect(X + k, Y, 1, H); else g.fillRect(X, Y + k, W, 1); } return; }
    case "haybale": { g.fillStyle = "#c8a85a"; g.beginPath(); g.arc(cx, cy, Math.min(W, H) / 2, 0, 7); g.fill(); g.strokeStyle = "#9a7a3a"; g.lineWidth = 1; g.beginPath(); g.arc(cx, cy, Math.min(W, H) / 4, 0, 7); g.stroke(); return; }
    case "barricade": case "sandbags": {
      if (p.t === "sandbags") { g.fillStyle = "#b8a070"; for (let k = 0; k < Math.max(W, H) / 8; k++) { crRR(g, W > H ? X + k * 8 : X, W > H ? Y : Y + k * 8, W > H ? 8 : W, W > H ? H : 8, 3); g.fill(); g.strokeStyle = "rgba(0,0,0,0.2)"; g.stroke(); } return; }
      g.fillStyle = "#f5f5f5"; g.fillRect(X, Y, W, H); g.fillStyle = "#e65100"; for (let k = 0; k < Math.max(W, H); k += 8) { if (W > H) g.fillRect(X + k, Y, 4, H); else g.fillRect(X, Y + k, W, 4); }
      return;
    }
    case "gazebo": { g.fillStyle = "rgba(0,0,0,0.22)"; g.beginPath(); g.arc(cx + 5, cy + 6, W / 2, 0, 7); g.fill(); g.fillStyle = fam === "rustic" ? "#8a6a4a" : "#eceff1"; g.beginPath(); for (let k = 0; k < 8; k++) { const a = k * 0.785; g.lineTo(cx + Math.cos(a) * W / 2, cy + Math.sin(a) * H / 2); } g.fill(); g.strokeStyle = "rgba(0,0,0,0.18)"; g.lineWidth = 1; for (let k = 0; k < 8; k++) { const a = k * 0.785; g.beginPath(); g.moveTo(cx, cy); g.lineTo(cx + Math.cos(a) * W / 2, cy + Math.sin(a) * H / 2); g.stroke(); } return; }
    case "silo": { const R = Math.min(W, H) / 2; g.fillStyle = "rgba(0,0,0,0.25)"; g.beginPath(); g.arc(cx + 6, cy + 7, R, 0, 7); g.fill(); const gr = g.createRadialGradient(cx - R * 0.3, cy - R * 0.3, 1, cx, cy, R); gr.addColorStop(0, "#e0e4e8"); gr.addColorStop(1, fam === "rustic" ? "#8a6a4a" : "#8a949c"); g.fillStyle = gr; g.beginPath(); g.arc(cx, cy, R, 0, 7); g.fill(); return; }
    case "bleachers": { for (let k = 0; k < 3; k++) { g.fillStyle = crSh(fam === "rustic" ? "#8a6a4a" : "#b0b8c0", -0.08 * k); g.fillRect(X, Y + k * H / 3, W, H / 3 - 1); } return; }
    case "booth": { g.fillStyle = "rgba(0,0,0,0.25)"; g.fillRect(X + 3, Y + 3, W, H); g.fillStyle = fam === "scifi" ? T.w.metal : "#cfd8dc"; g.fillRect(X, Y, W, H); g.fillStyle = "rgba(150,200,230,0.7)"; g.fillRect(X + 2, Y + 2, W - 4, H - 4); return; }
    case "flagpole": { g.fillStyle = "#bdbdbd"; g.beginPath(); g.arc(cx, cy, 2.5, 0, 7); g.fill(); g.fillStyle = T.flag || "#b22234"; g.beginPath(); g.moveTo(cx + 2, cy - 2); g.quadraticCurveTo(cx + 12, cy - 6, cx + 22, cy - 2); g.lineTo(cx + 22, cy + 8); g.quadraticCurveTo(cx + 12, cy + 4, cx + 2, cy + 8); g.fill(); return; }
    case "fountain": { const R = Math.min(W, H) / 2; g.fillStyle = crSh(T.g.plaza, -0.2); g.beginPath(); g.arc(cx, cy, R, 0, 7); g.fill(); g.fillStyle = crPat("water", T.g.pool); g.beginPath(); g.arc(cx, cy, R - 5, 0, 7); g.fill(); g.fillStyle = "rgba(255,255,255,0.6)"; g.beginPath(); g.arc(cx, cy, 4, 0, 7); g.fill(); return; }
    case "statue": { g.fillStyle = "rgba(0,0,0,0.25)"; g.fillRect(X + 4, Y + 4, W, H); g.fillStyle = crSh(T.g.plaza, -0.15); g.fillRect(X, Y, W, H); const c = CITY.themeKey === "gothic" || CITY.themeKey === "pharaoh" ? "#c9a227" : (fam === "scifi" ? "#9aa1aa" : "#5d7a6a"); g.fillStyle = c; g.beginPath(); g.arc(cx, cy, Math.min(W, H) * 0.28, 0, 7); g.fill(); g.fillStyle = crSh(c, 0.2); g.beginPath(); g.arc(cx - 2, cy - 2, Math.min(W, H) * 0.12, 0, 7); g.fill(); return; }
    case "dock": { g.fillStyle = "#3a3a3a"; g.fillRect(X, Y, W, H); g.fillStyle = "#f9a825"; for (let k = 0; k < Math.max(W, H); k += 12) { if (W > H) g.fillRect(X + k, Y, 6, 3); else g.fillRect(X, Y + k, 3, 6); } return; }
    case "grave": {
      const k = CITY.themeKey;
      g.fillStyle = "rgba(0,0,0,0.15)"; g.fillRect(X + 2, Y + 3, 12, 22);
      g.fillStyle = crSh(T.g.grass, -0.12); crRR(g, X + 2, Y + 5, 12, 20, 4); g.fill();
      g.fillStyle = fam === "scifi" ? "#8a949c" : "#9e9e9e"; crRR(g, X + 1, Y, 14, 6, fam === "scifi" ? 1 : 3); g.fill();
      if (k === "gothic") { g.fillStyle = "#e8e0c8"; g.beginPath(); g.arc(X + 8, Y + 2, 2.2, 0, 7); g.fill(); }
      else if (fam !== "scifi" && (p.v & 1)) { g.fillStyle = "#8a8a8a"; g.fillRect(X + 7, Y - 3, 2, 8); g.fillRect(X + 4.5, Y - 1, 7, 2); }
      return;
    }
    default: { g.fillStyle = "#7a7f86"; g.fillRect(X, Y, Math.max(4, W), Math.max(4, H)); }
  }
}
// v14.1: fences read as fences - a standing face with height (boards / chain mesh / pickets / stone courses), posts,
// a cast shadow, sections a vehicle (or a T-800) smashed through, and a gate at every opening
const CR_FENCE_H = { wood: 11, chain: 10, picket: 6, stone: 7 };
// v14.1 chain-link mesh: a pixel-exact 4×4 diamond lattice (seamless across tiles; crisp at 1×, unlike hairline strokes)
function crChainPat(col) {
  const key = "chainmesh|" + col; let p = CR.pats.get(key);
  if (p) return p;
  const c = crCanvas(4, 4), q = c.getContext("2d");
  q.fillStyle = col; for (let i = 0; i < 4; i++) { q.fillRect(i, i, 1, 1); q.fillRect(3 - i, i, 1, 1); }
  p = q.createPattern(c, "repeat"); CR.pats.set(key, p);
  return p;
}
function crFenceOnAny(B, tx, ty) {
  for (const q of B.fences) { const w = Math.max(1, q.x1 - q.x0), h = Math.max(1, q.y1 - q.y0); if (tx >= q.x0 && tx < q.x0 + w && ty >= q.y0 && ty < q.y0 + h) return true; }
  for (const b of B.blds) if (tx >= b.x && tx < b.x + b.w && ty >= b.y && ty < b.y + b.h) return true;
  return false;
}
function crFence(g, f) {
  const fam = crFam(), T = CITY.theme, key = CITY.themeKey, horiz = f.y1 === f.y0, n = Math.max(1, horiz ? f.x1 - f.x0 : f.y1 - f.y0);
  const kind = f.kind, h = CR_FENCE_H[kind] || 8, broken = cityRT.fenceBroken;
  const col = kind === "wood" ? (fam === "scifi" ? "#5a6068" : key === "wasteland" ? "#6a5a4a" : key === "western" || key === "frontier" ? "#8a6236" : "#8f6c48")
    : kind === "picket" ? (fam === "rustic" ? "#c8b898" : "#f2f2ee") : kind === "stone" ? (key === "gothic" ? "#6a645c" : "#8a8478") : (fam === "scifi" ? "#8fa3b3" : "#a9b1b8");
  const barbed = kind === "chain" && !!(f._B && f._B.cls === CL_INDUSTRIAL);   // v14.1: security fencing around yards & depots
  const dark = crSh(col, -0.32), lite = crSh(col, 0.22), postEvery = kind === "wood" ? 4 : kind === "chain" ? 6 : kind === "picket" ? 4 : 0;   // chain-link: ~3 m spans
  // per tile: base line sits low in the tile, the face rises toward the top of the tile (no bleed into the next tile)
  for (let i = 0; i < n; i++) {
    const tx = horiz ? f.x0 + i : f.x0, ty = horiz ? f.y0 : f.y0 + i, X = tx * 16, Y = ty * 16;
    if (broken && broken.has(cityKeyT(tx, ty))) {   // smashed: splintered stubs + boards on the ground
      g.fillStyle = dark; if (horiz) { g.fillRect(X + 1, Y + 10, 2, 3); g.fillRect(X + 12, Y + 11, 2, 2); } else { g.fillRect(X + 7, Y + 1, 3, 2); g.fillRect(X + 8, Y + 12, 2, 2); }
      g.save(); g.translate(X + 8, Y + 8); g.rotate(((tx * 7 + ty * 3) % 5) * 0.6); g.fillStyle = crA(col, 0.8); g.fillRect(-7, -1, 14, 2.2); g.restore();
      continue;
    }
    if (horiz) {
      const by = Y + 13, top = by - h;
      g.fillStyle = "rgba(0,0,0,0.22)"; g.beginPath(); g.moveTo(X, by); g.lineTo(X + 16, by); g.lineTo(X + 19, by + 4); g.lineTo(X + 3, by + 4); g.fill();   // shadow
      if (kind === "wood") {
        g.fillStyle = col; g.fillRect(X, top, 16, h); g.fillStyle = dark; for (let k = 0; k < 16; k += 4) g.fillRect(X + k, top, 0.9, h);
        g.fillStyle = lite; g.fillRect(X, top, 16, 1.5); g.fillStyle = "rgba(0,0,0,0.25)"; g.fillRect(X, by - 2, 16, 2);
      } else if (kind === "chain") {   // a see-through steel screen: faint fill, dense diamond mesh, top rail, tension wire (+ barbed wire in industrial blocks)
        g.fillStyle = crA(col, 0.14); g.fillRect(X, top, 16, h);
        g.fillStyle = crChainPat(crA(lite, 0.85)); g.fillRect(X, top, 16, h);
        g.fillStyle = lite; g.fillRect(X, top - 0.8, 16, 1.8); g.fillStyle = crSh(col, -0.25); g.fillRect(X, top + 1, 16, 0.5);
        g.fillStyle = crA(col, 0.9); g.fillRect(X, by - 1.2, 16, 0.9);
        if (barbed) { g.strokeStyle = "rgba(40,40,44,0.85)"; g.lineWidth = 0.5; g.beginPath(); g.moveTo(X, top - 1.6); g.lineTo(X + 16, top - 1.6); g.moveTo(X, top - 2.9); g.lineTo(X + 16, top - 2.9); g.stroke(); g.fillStyle = "rgba(40,40,44,0.9)"; for (let k = (tx & 1) * 2 + 1; k < 16; k += 4) { g.fillRect(X + k, top - 3.4, 1, 1); g.fillRect(X + k + 2, top - 2.1, 1, 1); } }
      } else if (kind === "picket") {
        g.fillStyle = dark; g.fillRect(X, top + 2, 16, 1); g.fillRect(X, by - 2, 16, 1);
        g.fillStyle = col; for (let k = 1; k < 16; k += 4) { g.fillRect(X + k, top + 1, 2.2, h - 1); g.beginPath(); g.moveTo(X + k, top + 1); g.lineTo(X + k + 1.1, top - 0.8); g.lineTo(X + k + 2.2, top + 1); g.fill(); }
      } else {   // stone garden wall: courses + coping
        g.fillStyle = col; g.fillRect(X, top, 16, h); g.fillStyle = dark; g.fillRect(X, top + h * 0.5, 16, 0.8); for (let k = (ty & 1) * 4; k < 16; k += 8) g.fillRect(X + k, top + 1, 0.8, h * 0.5 - 1); for (let k = 4 - (ty & 1) * 4; k < 16; k += 8) g.fillRect(X + k, top + h * 0.5, 0.8, h * 0.5);
        g.fillStyle = lite; g.fillRect(X - 0.5, top - 1, 17, 1.8);
      }
      if (postEvery && (i % postEvery === 0 || i === n - 1)) { const px = i === n - 1 && i % postEvery ? X + 14 : X; g.fillStyle = kind === "chain" ? crSh(col, -0.2) : dark; g.fillRect(px, top - 1.5, 2, h + 1.5); g.fillStyle = lite; g.fillRect(px, top - 1.5, 2, 1); }
    } else {
      // running north-south: the face leans up-left (oblique), boards / mesh across it, cap on top, shadow to the east
      const bx = X + 12, off = Math.max(4, h * 0.8);
      g.fillStyle = "rgba(0,0,0,0.28)"; g.fillRect(bx, Y, 2.5, 16); g.fillStyle = "rgba(0,0,0,0.13)"; g.fillRect(bx + 2.5, Y, 2, 16);   // cast shadow: a tall thing, not a kerb
      if (kind === "chain") {
        g.fillStyle = crA(col, 0.14); g.fillRect(bx - off, Y, off, 16);
        g.fillStyle = crChainPat(crA(lite, 0.85)); g.fillRect(bx - off, Y, off, 16);
        g.fillStyle = lite; g.fillRect(bx - off - 0.8, Y, 1.8, 16); g.fillStyle = crA(col, 0.9); g.fillRect(bx - 0.6, Y, 0.9, 16);
        if (barbed) { g.fillStyle = "rgba(40,40,44,0.85)"; g.fillRect(bx - off - 2.4, Y, 0.5, 16); for (let k = (ty & 1) * 2 + 1; k < 16; k += 4) g.fillRect(bx - off - 2.9, Y + k, 1, 1); }
      } else if (kind === "picket") {
        g.fillStyle = dark; g.fillRect(bx - 1, Y, 1, 16); g.fillRect(bx - off + 1, Y, 1, 16); g.fillStyle = col; for (let k = 1; k < 16; k += 4) { g.fillRect(bx - off, Y + k, off, 2.2); g.beginPath(); g.moveTo(bx - off, Y + k); g.lineTo(bx - off - 1.6, Y + k + 1.1); g.lineTo(bx - off, Y + k + 2.2); g.fill(); }
      } else {
        g.fillStyle = col; g.fillRect(bx - off, Y, off, 16);
        if (kind === "wood") { g.fillStyle = dark; for (let k = 0; k < 16; k += 4) g.fillRect(bx - off, Y + k, off, 0.9); g.fillStyle = lite; g.fillRect(bx - off - 1.2, Y, 1.6, 16); g.fillStyle = "rgba(0,0,0,0.22)"; g.fillRect(bx - 1.6, Y, 1.6, 16); }
        else { g.fillStyle = dark; for (let k = (tx & 1) * 4; k < 16; k += 8) g.fillRect(bx - off, Y + k, off, 0.8); g.fillRect(bx - off * 0.5, Y, 0.8, 16); g.fillStyle = lite; g.fillRect(bx - off - 1.4, Y, 1.8, 16); }
      }
      if (postEvery && (i % postEvery === 0 || i === n - 1)) { const py = Y + (i === n - 1 && i % postEvery ? 13 : 0); g.fillStyle = kind === "chain" ? crSh(col, -0.2) : dark; g.fillRect(bx - off - 1.5, py, off + 2.5, 2.8); g.fillStyle = lite; g.fillRect(bx - off - 1.5, py, 2.2, 1.2); }
    }
  }
  // gates: an end of this run that opens onto nothing (until another fence / building closes it) is a gate opening
  const B = f._B; if (!B) return;
  for (const end of [0, 1]) {
    const ex = horiz ? (end ? f.x0 + n : f.x0 - 1) : f.x0, ey = horiz ? f.y0 : (end ? f.y0 + n : f.y0 - 1), sx = horiz ? (end ? 1 : -1) : 0, sy = horiz ? 0 : (end ? 1 : -1);
    if (crFenceOnAny(B, ex, ey)) continue;
    let gap = 0; for (let k = 0; k < 15; k++) { if (crFenceOnAny(B, ex + sx * k, ey + sy * k)) { gap = k; break; } }
    const PX = (horiz ? (end ? f.x0 + n : f.x0) : f.x0) * 16, PY = (horiz ? f.y0 : (end ? f.y0 + n : f.y0)) * 16;
    g.fillStyle = crSh(col, -0.45);   // gate / end post, a bit taller
    if (horiz) g.fillRect(PX - 1.5, PY + 13 - h - 3, 3, h + 3); else g.fillRect(PX + 9 - 3, PY - 1.5, 5, 3);
    if (!gap) continue;
    g.save();
    const leaf = Math.min(gap, 3) * 16 * (gap <= 3 ? 0.9 : 0.5), ang = (gap <= 3 ? 1.15 : 1.35) * (end ? 1 : -1);
    g.translate(horiz ? PX : PX + 9, horiz ? PY + 11 : PY);
    g.rotate(horiz ? (end ? -ang : Math.PI + ang) * -1 + (end ? 0 : Math.PI) : Math.PI / 2 + (end ? -ang : ang));
    g.fillStyle = "rgba(0,0,0,0.2)"; g.fillRect(2, 1, leaf, 3);
    g.fillStyle = kind === "chain" ? crA(col, 0.85) : col; g.fillRect(0, -1.5, leaf, 3);
    g.fillStyle = crSh(col, -0.3); g.fillRect(0, -1.5, leaf, 0.8); g.fillRect(leaf - 1.5, -2, 1.5, 4);
    g.restore();
    if (gap > 3) {   // the far post of a wide (vehicle) gate
      const FX = PX + sx * gap * 16, FY = PY + sy * gap * 16;
      g.fillStyle = crSh(col, -0.45); if (horiz) g.fillRect(FX - 1.5, FY + 13 - h - 3, 3, h + 3); else g.fillRect(FX + 6, FY - 1.5, 5, 3);
    }
  }
}

/* --- litter of an evacuated city ---------------------------------------------- */
const CR_LITTER = {
  paper: ["paper", "paper", "news", "can", "bottle", "bag", "cup", "leaf", "flyer", "box"],
  neon: ["paper", "neonwrap", "can", "chip", "cup", "puddle", "flyer", "neonwrap"],
  scrap: ["bolt", "plate", "wire", "tin", "paper", "bolt", "chip"],
  scifi: ["chip", "wrap", "cup", "paper", "chip", "flyer"],
  rustic: ["straw", "paper", "bottle", "straw", "rag", "leaf"],
  west: ["tumble", "straw", "bottle", "card", "paper", "shoe"],
  sand: ["drift", "rag", "drift", "tin", "paper"],
  gothic: ["parch", "seal", "casing", "skull", "candle", "parch", "casing"],
  rubble: ["chunk", "brick", "tire", "bottle", "can", "chunk", "paper", "bone"],
  straw: ["straw", "apple", "parch", "feather", "straw", "leaf"],
  letters: ["letter", "letter", "card", "feather", "news", "wrap", "letter"]
};
function crLitterItem(g, k, x, y, a, r) {
  g.save(); g.translate(x, y); g.rotate(a);
  switch (k) {
    case "paper": case "flyer": g.fillStyle = k === "flyer" ? ["#ffecb3", "#e1f5fe", "#f8bbd0"][Math.floor(r * 3)] : "#efeee8"; g.fillRect(-4, -3, 8, 6); g.fillStyle = "rgba(0,0,0,0.15)"; g.fillRect(-3, -1.5, 6, 0.6); g.fillRect(-3, 0.5, 5, 0.6); break;
    case "news": g.fillStyle = "#d8d6cc"; g.fillRect(-6, -4, 12, 8); g.fillStyle = "rgba(0,0,0,0.25)"; g.fillRect(-5, -3, 10, 1.4); for (let i = 0; i < 3; i++) g.fillRect(-5, -0.5 + i * 1.5, 4, 0.6); break;
    case "letter": g.fillStyle = "#f2e6c8"; g.fillRect(-4.5, -3, 9, 6); g.strokeStyle = "rgba(0,0,0,0.2)"; g.lineWidth = 0.5; g.beginPath(); g.moveTo(-4.5, -3); g.lineTo(0, 0.5); g.lineTo(4.5, -3); g.stroke(); g.fillStyle = "#a01c1c"; g.beginPath(); g.arc(0, 0.5, 1.2, 0, 7); g.fill(); break;
    case "card": g.fillStyle = "#f5f5f5"; g.fillRect(-2, -3, 4, 6); g.fillStyle = r < 0.5 ? "#c62828" : "#212121"; g.fillRect(-1, -1, 2, 2); break;
    case "can": case "tin": g.fillStyle = k === "tin" ? "#9aa0a6" : ["#c62828", "#b0bec5", "#1565c0", "#2e7d32"][Math.floor(r * 4)]; g.fillRect(-3, -1.5, 6, 3); g.fillStyle = "rgba(255,255,255,0.4)"; g.fillRect(-3, -1.5, 6, 0.8); break;
    case "bottle": g.fillStyle = r < 0.5 ? "rgba(46,125,50,0.8)" : "rgba(121,85,72,0.85)"; g.fillRect(-4, -1.3, 6, 2.6); g.fillRect(2, -0.7, 2.5, 1.4); break;
    case "bag": g.fillStyle = "rgba(240,240,240,0.7)"; g.beginPath(); g.ellipse(0, 0, 4.5, 3.2, 0, 0, 7); g.fill(); break;
    case "cup": g.fillStyle = "#f5f5f5"; g.beginPath(); g.arc(0, 0, 2.2, 0, 7); g.fill(); g.fillStyle = "#c62828"; g.fillRect(-2.2, -0.4, 4.4, 0.8); break;
    case "leaf": g.fillStyle = ["#a1662f", "#c58b2b", "#7a5a2a"][Math.floor(r * 3)]; g.beginPath(); g.ellipse(0, 0, 3, 1.6, 0, 0, 7); g.fill(); break;
    case "box": g.fillStyle = "#b8915e"; g.fillRect(-4, -4, 8, 8); g.fillStyle = "#8a6a42"; g.fillRect(-4, -0.5, 8, 1); break;
    case "neonwrap": g.fillStyle = r < 0.5 ? "#ff2bd6" : "#22e6ff"; g.globalAlpha = 0.85; g.fillRect(-3, -2, 6, 4); break;
    case "chip": g.fillStyle = "#1a1f26"; g.fillRect(-3, -2, 6, 4); g.fillStyle = CITY.theme.fu.glow || "#4fc3ff"; g.fillRect(-2, -1, 4, 2); break;
    case "wrap": g.fillStyle = "#cfd8dc"; g.fillRect(-3, -1.5, 6, 3); break;
    case "puddle": g.fillStyle = "rgba(20,24,40,0.45)"; g.beginPath(); g.ellipse(0, 0, 10, 5, 0, 0, 7); g.fill(); g.fillStyle = "rgba(255,43,214,0.12)"; g.fillRect(-6, -1, 10, 1.5); break;
    case "bolt": g.fillStyle = "#8a8f96"; g.beginPath(); g.arc(0, 0, 1.6, 0, 7); g.fill(); g.fillRect(0, -0.6, 3.5, 1.2); break;
    case "plate": g.fillStyle = "#6a7076"; g.beginPath(); g.moveTo(-4, -2); g.lineTo(3, -3); g.lineTo(4, 2); g.lineTo(-2, 3); g.fill(); break;
    case "wire": g.strokeStyle = r < 0.5 ? "#c62828" : "#1565c0"; g.lineWidth = 0.8; g.beginPath(); g.moveTo(-5, 0); g.quadraticCurveTo(0, -4, 5, 1); g.stroke(); break;
    case "straw": g.strokeStyle = "#c8a85a"; g.lineWidth = 0.8; g.beginPath(); for (let i = 0; i < 5; i++) { g.moveTo(-4 + i * 1.5, -2); g.lineTo(-2 + i * 1.5, 2.5); } g.stroke(); break;
    case "rag": g.fillStyle = "#8a7a6a"; g.beginPath(); g.moveTo(-4, -2); g.lineTo(3, -3); g.lineTo(4, 3); g.lineTo(-3, 2); g.fill(); break;
    case "tumble": g.strokeStyle = "#8a6a3a"; g.lineWidth = 0.8; g.beginPath(); g.arc(0, 0, 5, 0, 7); g.moveTo(-4, -2); g.lineTo(4, 2); g.moveTo(-3, 3); g.lineTo(3, -3); g.moveTo(0, -5); g.lineTo(0, 5); g.stroke(); break;
    case "shoe": g.fillStyle = "#4e342e"; g.beginPath(); g.ellipse(0, 0, 4, 1.8, 0, 0, 7); g.fill(); break;
    case "drift": g.fillStyle = crA(CITY.theme.g.sand, 0.7); g.beginPath(); g.ellipse(0, 0, 14, 5, 0, 0, 7); g.fill(); break;
    case "parch": g.fillStyle = "#e8dcb8"; g.fillRect(-4, -3, 8, 6); g.fillStyle = "rgba(60,30,10,0.3)"; g.fillRect(-3, -1, 6, 0.6); break;
    case "seal": g.fillStyle = "#e8dcb8"; g.fillRect(-1, -1, 2, 7); g.fillStyle = "#a01c1c"; g.beginPath(); g.arc(0, -1, 2.4, 0, 7); g.fill(); break;
    case "casing": g.fillStyle = "#d4a537"; g.fillRect(-1.5, -0.6, 3, 1.2); break;
    case "skull": g.fillStyle = "#e8e0c8"; g.beginPath(); g.arc(0, 0, 2.6, 0, 7); g.fill(); g.fillStyle = "#2a2a2a"; g.fillRect(-1.4, -0.6, 1, 1); g.fillRect(0.4, -0.6, 1, 1); break;
    case "candle": crCandle(g, 0, 0); break;
    case "chunk": g.fillStyle = "#8a847a"; g.beginPath(); g.moveTo(-4, -2); g.lineTo(2, -4); g.lineTo(5, 1); g.lineTo(0, 4); g.lineTo(-4, 2); g.fill(); break;
    case "brick": g.fillStyle = "#9a4b3b"; g.fillRect(-4, -2, 8, 4); break;
    case "tire": g.strokeStyle = "#1e1e1e"; g.lineWidth = 2.4; g.beginPath(); g.arc(0, 0, 4.5, 0, 7); g.stroke(); break;
    case "bone": g.fillStyle = "#e0d8c0"; g.fillRect(-4, -0.8, 8, 1.6); g.beginPath(); g.arc(-4, 0, 1.4, 0, 7); g.arc(4, 0, 1.4, 0, 7); g.fill(); break;
    case "apple": g.fillStyle = "#a83a2a"; g.beginPath(); g.arc(0, 0, 2, 0, 7); g.fill(); break;
    case "feather": g.strokeStyle = "#e8e8e0"; g.lineWidth = 1.4; g.beginPath(); g.moveTo(-4, 1); g.quadraticCurveTo(0, -2, 4, -1); g.stroke(); break;
    default: g.fillStyle = "#ddd"; g.fillRect(-3, -2, 6, 4);
  }
  g.restore();
}
function crLitter(g, rx, ry) {
  const T = CITY.theme, list = CR_LITTER[T.trash] || CR_LITTER.paper;
  const mcx = Math.floor(rx * 16 / 1000), mcy = Math.floor(ry * 16 / 1000), cls = cityMacroClass(mcx, mcy);
  const n = [10, 6, 22, 40, 64, 30, 5, 4][cls] || 10;
  const r = cRng(cH(CITY.seed, rx, ry, 909));
  const tx0 = rx * 32, ty0 = ry * 32;
  for (let k = 0; k < n; k++) {
    const tx = tx0 + Math.floor(r() * 32), ty = ty0 + Math.floor(r() * 32), fl = cityFlagsT(tx, ty);
    const kind = list[Math.floor(r() * list.length)], a = r() * 6.28, rr = r();
    if (fl & (F_MOVE | F_WATER)) continue;
    // indoors: less litter, mostly papers
    if ((fl & F_IN) && r() < 0.5) continue;
    const x = tx * 16 + r() * 16, y = ty * 16 + r() * 16;
    crLitterItem(g, (fl & F_IN) && (kind === "tumble" || kind === "drift" || kind === "puddle") ? "paper" : kind, x, y, a, rr);
    if (r() < 0.25) for (let q = 0; q < 3; q++) crLitterItem(g, kind === "drift" ? "drift" : list[Math.floor(r() * list.length)], x + (r() - 0.5) * 30, y + (r() - 0.5) * 30, r() * 6.28, r());
  }
}
// EOF part 3

/* --- baking --------------------------------------------------------------------- */
function crBake(rx, ry) {
  const t0 = performance.now();
  const S = CR.TS, cv = crCanvas(S, S), g = cv.getContext("2d");
  const wx0 = rx * S, wy0 = ry * S, m0x = wx0 / 32, m0y = wy0 / 32, m1x = m0x + 16, m1y = m0y + 16;
  const tx0 = rx * 32, ty0 = ry * 32, tx1 = tx0 + 32, ty1 = ty0 + 32;
  g.translate(-wx0, -wy0);
  try {
    for (let my = Math.floor(m0y / 1000); my <= Math.floor((m1y - 0.01) / 1000); my++) for (let mx = Math.floor(m0x / 1000); mx <= Math.floor((m1x - 0.01) / 1000); mx++) {
      const [pn, col] = crClassGround(cityMacroClass(mx, my));
      g.fillStyle = crPat(pn, col);
      const ax = Math.max(wx0, mx * 32000), ay = Math.max(wy0, my * 32000), bx = Math.min(wx0 + S, (mx + 1) * 32000), by = Math.min(wy0 + S, (my + 1) * 32000);
      g.fillRect(ax, ay, bx - ax, by - ay);
    }
    const roads = crRoads(m0x, m0y, m1x, m1y);
    crRoadPass(g, roads, 0);
    const blocks = cityBlocksInRect(m0x, m0y, m1x, m1y), surfs = [], blds = [], props = [], fences = [];
    for (const B of blocks) {
      for (const s of B.surf) if (s.x1 >= tx0 - 3 && s.x0 <= tx1 + 3 && s.y1 >= ty0 - 3 && s.y0 <= ty1 + 3) surfs.push(s);
      for (const b of B.blds) if (b.x + b.w >= tx0 - 1 && b.x <= tx1 + 1 && b.y + b.h >= ty0 - 1 && b.y <= ty1 + 1) blds.push(b);
      for (let pi = 0; pi < B.props.length; pi++) { const p = B.props[pi]; if (p.t === "tree" || p.x + p.w < tx0 - 4 || p.x > tx1 + 4 || p.y + p.h < ty0 - 4 || p.y > ty1 + 4) continue; if (cityRT.used.has(B.key + "|" + pi)) continue; props.push(p); }
      for (const f of B.fences) if (f.x1 >= tx0 - 1 && f.x0 <= tx1 + 1 && f.y1 >= ty0 - 1 && f.y0 <= ty1 + 1) { f._B = B; fences.push(f); }
    }
    surfs.sort((a, b) => (CR_SURF_ORDER[a.t] || 0) - (CR_SURF_ORDER[b.t] || 0));
    for (const s of surfs) crSurface(g, s);
    crRoadPass(g, roads, 1); crRoadPass(g, roads, 2);
    for (const p of props) if (p.t === "stall") crProp(g, p, 0);
    for (const b of blds) crBuilding(g, b, tx0, ty0, tx1, ty1, 0);
    crLitter(g, rx, ry);
    for (const b of blds) crBuilding(g, b, tx0, ty0, tx1, ty1, 1);
    const P = CITY.theme.fu, fam = crFam(), st = P.style;
    for (const b of blds) {
      const G = b.int;
      for (let fi = 0; fi < G.furn.length; fi++) { const f = G.furn[fi]; if (b.x + f.x + f.w < tx0 - 1 || b.x + f.x > tx1 + 1 || b.y + f.y + f.h < ty0 - 1 || b.y + f.y > ty1 + 1) continue; if (cityRT.used.has(b.uid + ":f" + fi)) continue; crFurn(g, f, b, P, fam, st); }
    }
    for (const f of fences) crFence(g, f);
    for (const p of props) if (p.t !== "stall" && p.t !== "streetlight" && p.t !== "pole") crProp(g, p, cH(CITY.seed, p.x | 0, p.y | 0, 5));
    // trees (block trees + wild woods), deduplicated across chunks
    const seen = new Set();
    for (let cy = (ty0 - 8) >> 7; cy <= (ty1 + 8) >> 7; cy++) for (let cx = (tx0 - 8) >> 7; cx <= (tx1 + 8) >> 7; cx++) {
      const C = cityChunk(cx, cy);
      for (const t of C.trees) { if (seen.has(t) || t.x < tx0 - 8 || t.x > tx1 + 8 || t.y < ty0 - 8 || t.y > ty1 + 8) continue; seen.add(t); crTree(g, t.x * 16 + 8, t.y * 16 + 8, t, cH(CITY.seed, t.x * 7 | 0, t.y * 7 | 0, 3)); }
    }
    for (const p of props) if (p.t === "streetlight" || p.t === "pole") crProp(g, p, 0);
  } catch (e) { if (window.trackProgress) window.trackProgress("cityBake " + rx + "," + ry + ": " + e.message, true); else console.warn(e); }
  CR.bakeMs = performance.now() - t0; CR.baked++;
  return cv;
}
function cityRenderPrewarm(lx, ly, rad) {
  const S = CR.TS, cx = Math.floor((lx + CITY.orx) / S), cy = Math.floor((ly + CITY.ory) / S), n = Math.ceil(rad / S);
  for (let y = cy - n; y <= cy + n; y++) for (let x = cx - n; x <= cx + n; x++) { const k = x * 65536 + y; if (!CR.tiles.has(k) && x >= 0 && y >= 0) CR.tiles.set(k, { c: crBake(x, y), used: CR.frame }); }
}

/* --- per-frame ground ------------------------------------------------------------ */
function cityRenderGround(left, top, vw, vh) {
  CR.frame++;
  if (CR.key !== CITY.themeKey + "|" + CITY.seed) cityRenderReset();
  const S = CR.TS, ox = CITY.orx, oy = CITY.ory;
  const rx0 = Math.max(0, Math.floor((left + ox) / S)), rx1 = Math.floor((left + vw + ox) / S), ry0 = Math.max(0, Math.floor((top + oy) / S)), ry1 = Math.floor((top + vh + oy) / S);
  const pcx = (player.x + ox) / S - 0.5, pcy = (player.y + oy) / S - 0.5;
  let need = null;
  for (let ry = ry0; ry <= ry1; ry++) for (let rx = rx0; rx <= rx1; rx++) {
    const t = CR.tiles.get(rx * 65536 + ry);
    if (t) t.used = CR.frame; else (need || (need = [])).push([rx, ry, (rx - pcx) * (rx - pcx) + (ry - pcy) * (ry - pcy)]);
  }
  const t0 = performance.now();
  if (CR.stale && CR.stale.size) {   // v14.1: stale tiles re-bake first (at least one per frame), old art stays up meanwhile
    let n = 0;
    for (const k of CR.stale) {
      if (n > 0 && performance.now() - t0 > CR.bakeBudget) break;
      const t = CR.tiles.get(k); CR.stale.delete(k);
      if (!t) continue;
      t.c = crBake(Math.floor(k / 65536), k % 65536); t.used = CR.frame; n++;
    }
  }
  if (need) {
    need.sort((a, b) => a[2] - b[2]);
    for (let i = 0; i < need.length; i++) {
      if (i > 0 && performance.now() - t0 > CR.bakeBudget) break;
      const [rx, ry] = need[i]; CR.tiles.set(rx * 65536 + ry, { c: crBake(rx, ry), used: CR.frame });
    }
  } else {   // idle: pre-bake one tile of the ring just outside the view
    let best = null, bd = 1e9;
    for (let ry = ry0 - 1; ry <= ry1 + 1; ry++) for (let rx = rx0 - 1; rx <= rx1 + 1; rx++) {
      if (rx < 0 || ry < 0 || (rx >= rx0 && rx <= rx1 && ry >= ry0 && ry <= ry1) || CR.tiles.has(rx * 65536 + ry)) continue;
      const vx = (typeof player.vx === "number" ? player.vx : 0), vy = (typeof player.vy === "number" ? player.vy : 0);
      const d = (rx - pcx - vx * 0.004) ** 2 + (ry - pcy - vy * 0.004) ** 2;
      if (d < bd) { bd = d; best = [rx, ry]; }
    }
    if (best) CR.tiles.set(best[0] * 65536 + best[1], { c: crBake(best[0], best[1]), used: CR.frame });
  }
  if (CR.tiles.size > CR.max) {
    const arr = [...CR.tiles.entries()].filter(e => e[1].used < CR.frame).sort((a, b) => a[1].used - b[1].used);
    for (let i = 0; i < arr.length && CR.tiles.size > CR.max - 8; i++) CR.tiles.delete(arr[i][0]);
  }
  for (let ry = ry0; ry <= ry1; ry++) for (let rx = rx0; rx <= rx1; rx++) {
    const t = CR.tiles.get(rx * 65536 + ry), X = rx * S - ox, Y = ry * S - oy;
    if (t) ctx.drawImage(t.c, X, Y);
    else { ctx.fillStyle = crClassGround(cityMacroClass(Math.floor(rx * 16 / 1000), Math.floor(ry * 16 / 1000)))[1]; ctx.fillRect(X, Y, S, S); }
  }
  crLiveLayer(left, top, vw, vh);
}

/* --- live layer: dynamic vehicles, decals, caches, doors --------------------------- */
function cityDecal(lx, ly, kind, ang, col) {
  CR.decals.push({ x: lx + CITY.orx, y: ly + CITY.ory, k: kind, a: ang || 0, t: (typeof runTime === "number" ? runTime : 0), c: col || null });
  if (CR.decals.length > 360) CR.decals.splice(0, CR.decals.length - 360);
}
function crLiveLayer(left, top, vw, vh) {
  const ox = CITY.orx, oy = CITY.ory, T = CITY.theme, fam = crFam();
  const L = left + ox, Tp = top + oy, R = L + vw, B = Tp + vh;
  for (const d of cityRT.dyn) {
    if (d.x * 16 > R + 64 || (d.x + d.w) * 16 < L - 64 || d.y * 16 > B + 64 || (d.y + d.h) * 16 < Tp - 64) continue;
    crProp(ctx, Object.assign({}, d, { x: d.x - ox / 16, y: d.y - oy / 16 }), d.h2 || 7);
  }
  for (const d of CR.decals) {
    if (d.x < L - 30 || d.x > R + 30 || d.y < Tp - 30 || d.y > B + 30) continue;
    const x = d.x - ox, y = d.y - oy, age = runTime - d.t;
    if (d.k === "hole") { ctx.fillStyle = "rgba(20,18,16,0.85)"; ctx.beginPath(); ctx.arc(x, y, 1.6, 0, 7); ctx.fill(); ctx.strokeStyle = "rgba(255,255,255,0.18)"; ctx.lineWidth = 0.6; ctx.beginPath(); ctx.arc(x, y, 2.6, 0, 7); ctx.stroke(); }
    else if (d.k === "scorch") { const gr = ctx.createRadialGradient(x, y, 0, x, y, 26); gr.addColorStop(0, "rgba(10,8,6,0.65)"); gr.addColorStop(1, "rgba(10,8,6,0)"); ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(x, y, 26, 0, 7); ctx.fill(); }
    else if (d.k === "glass") { ctx.fillStyle = crA(T.w.glass, 0.7); for (let k = 0; k < 7; k++) { const a = k * 0.9 + d.a, r = 4 + (k * 37 % 11); ctx.fillRect(x + Math.cos(a) * r, y + Math.sin(a) * r, 1.6, 1.6); } }
    else if (d.k === "blood") { ctx.fillStyle = d.c || "rgba(120,10,16,0.6)"; ctx.beginPath(); ctx.ellipse(x, y, 7, 4, d.a, 0, 7); ctx.fill(); ctx.beginPath(); ctx.arc(x + Math.cos(d.a) * 8, y + Math.sin(d.a) * 8, 2, 0, 7); ctx.fill(); }
    else if (d.k === "saber") { const heat = Math.max(0, 1 - age / 6); ctx.strokeStyle = heat > 0 ? "rgba(255," + Math.round(140 + 100 * heat) + ",60," + (0.35 + heat * 0.6) + ")" : "rgba(20,16,14,0.7)"; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(x - Math.cos(d.a) * 7, y - Math.sin(d.a) * 7); ctx.lineTo(x + Math.cos(d.a) * 7, y + Math.sin(d.a) * 7); ctx.stroke(); }
  }
  // supply caches (inside buildings)
  const cx0 = Math.floor(L / 2048), cx1 = Math.floor(R / 2048), cy0 = Math.floor(Tp / 2048), cy1 = Math.floor(B / 2048);
  for (let cy = cy0; cy <= cy1; cy++) for (let cx = cx0; cx <= cx1; cx++) {
    const C = cityRT.chunks.get(cx * 4096 + cy);
    if (!C) continue;
    for (const k of C.caches) {
      if (cityRT.used.has("cache|" + k.uid)) continue;
      const x = k.x * 16 + 8 - ox, y = k.y * 16 + 8 - oy, pulse = 0.5 + 0.5 * Math.sin(runTime * 3 + k.x);
      crGlow(ctx, x, y, 16, T.fu.glow || "#ffd166", 0.18 + 0.12 * pulse);
      ctx.fillStyle = fam === "scifi" ? "#4a5560" : fam === "rustic" ? "#6a4a2a" : "#4e6a3a"; crRR(ctx, x - 7, y - 5, 14, 10, 2); ctx.fill();
      ctx.fillStyle = T.fu.glow || "#ffd166"; ctx.fillRect(x - 7, y - 1, 14, 2); ctx.fillRect(x - 1, y - 5, 2, 10);
    }
  }
  // doors
  for (const D of (cityRT.nearDoors || [])) {
    const X = D.x * 16 - ox, Y = D.y * 16 - oy, len = D.len * 16;
    if (X > left + vw + 40 || X + len < left - 40 || Y > top + vh + 40 || Y + len < top - 40) continue;
    crDrawDoor(ctx, D, X, Y, len, T, fam);
  }
  if (typeof vehRenderLayer === "function") vehRenderLayer(ctx, left, top, vw, vh);   // v14.1 live vehicles, debris, skid marks
  if (typeof accRenderRoofUnder === "function") accRenderRoofUnder();                  // v14.1 the roof you stand on
}
function crDrawDoor(g, D, X, Y, len, T, fam) {
  const open = Math.max(0, Math.min(1, D.open)), hx = D.axis === "x";
  const h = crHashStr(D.id);
  const col = fam === "scifi" ? crSh(T.w.metal, D.ext ? -0.05 : 0.2) : fam === "rustic" ? (D.ext ? "#5a3a1e" : "#8a6440") : (D.ext ? ["#7a2a1e", "#1e3a5a", "#2a4a2a", "#5a3a1e", "#e8e8e2", "#3a3a3a"][h % 6] : "#b08a5e");
  if (fam === "scifi") {   // sliding panels retract into the wall
    const half = len / 2, gap = half * open * 0.92;
    g.fillStyle = col;
    if (hx) { g.fillRect(X, Y + 5, half - gap, 6); g.fillRect(X + half + gap, Y + 5, half - gap, 6); }
    else { g.fillRect(X + 5, Y, 6, half - gap); g.fillRect(X + 5, Y + half + gap, 6, half - gap); }
    if (open < 0.95 && T.fu.glow) { g.fillStyle = crA(T.fu.glow, 0.85); if (hx) { g.fillRect(X + half - gap - 1, Y + 5, 1, 6); g.fillRect(X + half + gap, Y + 5, 1, 6); } else { g.fillRect(X + 5, Y + half - gap - 1, 6, 1); g.fillRect(X + 5, Y + half + gap, 6, 1); } }
    return;
  }
  // swing into the interior side
  let side = 1;
  if (hx) { const a = cityFlagsT(D.x, D.y - 1) & F_IN, b = cityFlagsT(D.x, D.y + 1) & F_IN; side = a && !b ? -1 : 1; }
  else { const a = cityFlagsT(D.x - 1, D.y) & F_IN, b = cityFlagsT(D.x + 1, D.y) & F_IN; side = a && !b ? -1 : 1; }
  const ang = open * Math.PI / 2 * side * ((h & 1) ? 1 : -1) * (hx ? 1 : -1);
  const hingeAtStart = (h & 2) === 0;
  g.save();
  if (hx) { g.translate(hingeAtStart ? X : X + len, Y + 8); g.rotate(hingeAtStart ? ang : -ang); g.fillStyle = "rgba(0,0,0,0.25)"; g.fillRect(hingeAtStart ? 1 : -len + 1, -1, len - 1, 4); g.fillStyle = col; g.fillRect(hingeAtStart ? 0 : -len, -1.5, len, 3); g.fillStyle = "#d4c070"; g.fillRect(hingeAtStart ? len - 4 : -len + 2, -1, 2, 2); }
  else { g.translate(X + 8, hingeAtStart ? Y : Y + len); g.rotate(hingeAtStart ? ang : -ang); g.fillStyle = "rgba(0,0,0,0.25)"; g.fillRect(-1, hingeAtStart ? 1 : -len + 1, 4, len - 1); g.fillStyle = col; g.fillRect(-1.5, hingeAtStart ? 0 : -len, 3, len); g.fillStyle = "#d4c070"; g.fillRect(-1, hingeAtStart ? len - 4 : -len + 2, 2, 2); }
  g.restore();
}

/* --- roofs ------------------------------------------------------------------------- */
function crRoofKind(b) {
  const k = CITY.themeKey, r = b.roof || "flat";
  if (r === "flat" && (k === "medieval" || k === "wizard")) return "hip";
  if (r === "flat" && k === "galactic") return "dome";
  if (r === "flat" && k === "western") return "false";
  if ((r === "gable" || r === "hip") && k === "galactic") return "dome";
  return r;
}
function crRoofTexture(g, X, Y, W, H, col, along, pat) {
  g.fillStyle = col; g.fillRect(X, Y, W, H);
  g.save(); g.beginPath(); g.rect(X, Y, W, H); g.clip();
  const dark = crSh(col, -0.22), lite = crSh(col, 0.1);
  if (pat === "metal") { g.fillStyle = dark; if (along === "x") for (let y = Y; y < Y + H; y += 4) g.fillRect(X, y, W, 1); else for (let x = X; x < X + W; x += 4) g.fillRect(x, Y, 1, H); }
  else if (pat === "panel") { g.fillStyle = dark; for (let x = X; x < X + W; x += 32) g.fillRect(x, Y, 1, H); for (let y = Y; y < Y + H; y += 32) g.fillRect(X, y, W, 1); }
  else if (pat === "thatch") { g.fillStyle = crPat("straw", col); g.fillRect(X, Y, W, H); g.fillStyle = dark; if (along === "x") for (let y = Y + 6; y < Y + H; y += 10) g.fillRect(X, y, W, 1.5); else for (let x = X + 6; x < X + W; x += 10) g.fillRect(x, Y, 1.5, H); }
  else if (pat === "flatstone" || pat === "dome") { g.fillStyle = crPat(pat === "dome" ? "sandstone" : "stone", col); g.fillRect(X, Y, W, H); }
  else {   // shingle / woodshingle / slate / patched: rows parallel to the ridge with staggered ticks
    const row = pat === "slate" ? 6 : 8;
    if (along === "x") for (let y = Y, j = 0; y < Y + H; y += row, j++) { g.fillStyle = dark; g.fillRect(X, y, W, 1); g.fillStyle = crA("#000000", 0.12); for (let x = X + (j & 1) * 6; x < X + W; x += 12) g.fillRect(x, y, 1, row); }
    else for (let x = X, j = 0; x < X + W; x += row, j++) { g.fillStyle = dark; g.fillRect(x, Y, 1, H); g.fillStyle = crA("#000000", 0.12); for (let y = Y + (j & 1) * 6; y < Y + H; y += 12) g.fillRect(x, y, row, 1); }
    g.fillStyle = crA(lite, 0.15); g.fillRect(X, Y, W, 2);
  }
  g.restore();
}
function crRoofCanvas(b) {
  let R = CR.roofs.get(b.uid);
  if (R) { R.used = CR.frame; return R; }
  const G = cityInterior(b), T = CITY.theme, r = T.r, pad = 4, kind = crRoofKind(b);
  const Wp = G.w * 16 + pad * 2, Hp = G.h * 16 + pad * 2, sc = Math.min(1, Math.sqrt(380000 / (Wp * Hp)));
  const c = crCanvas(Math.ceil(Wp * sc), Math.ceil(Hp * sc)), g = c.getContext("2d");
  g.scale(sc, sc); g.translate(pad, pad);
  const parts = (G.parts && G.parts.length ? G.parts : [{ x: 0, y: 0, w: G.w, h: G.h }]).slice().sort((a, q) => q.w * q.h - a.w * a.h);
  const pat = r.pat, h = b.seed >>> 0, fam = crFam();
  for (const q of parts) {
    const X = q.x * 16 - pad, Y = q.y * 16 - pad, W = q.w * 16 + pad * 2, H = q.h * 16 + pad * 2;
    if (kind === "gable") {
      const along = W >= H ? "x" : "y";
      if (along === "x") { crRoofTexture(g, X, Y, W, H / 2, r.gable[0], "x", pat); crRoofTexture(g, X, Y + H / 2, W, H / 2, r.gable[1], "x", pat); g.fillStyle = crSh(r.gable[0], 0.2); g.fillRect(X, Y + H / 2 - 2, W, 4); }
      else { crRoofTexture(g, X, Y, W / 2, H, r.gable[0], "y", pat); crRoofTexture(g, X + W / 2, Y, W / 2, H, r.gable[1], "y", pat); g.fillStyle = crSh(r.gable[0], 0.2); g.fillRect(X + W / 2 - 2, Y, 4, H); }
    } else if (kind === "hip") {
      const along = W >= H ? "x" : "y", s = Math.min(W, H) / 2;
      const faces = along === "x"
        ? [[[X, Y], [X + W, Y], [X + W - s, Y + s], [X + s, Y + s], 0.08], [[X + W, Y], [X + W, Y + H], [X + W - s, Y + s], null, -0.12], [[X, Y + H], [X + W, Y + H], [X + W - s, Y + s], [X + s, Y + s], -0.2], [[X, Y], [X, Y + H], [X + s, Y + s], null, 0]]
        : [[[X, Y], [X + W, Y], [X + s, Y + s], null, 0.08], [[X + W, Y], [X + W, Y + H], [X + s, Y + H - s], [X + s, Y + s], -0.12], [[X, Y + H], [X + W, Y + H], [X + s, Y + H - s], null, -0.2], [[X, Y], [X, Y + H], [X + s, Y + H - s], [X + s, Y + s], 0]];
      for (const f of faces) {
        g.save(); g.beginPath(); g.moveTo(f[0][0], f[0][1]); g.lineTo(f[1][0], f[1][1]); g.lineTo(f[2][0], f[2][1]); if (f[3]) g.lineTo(f[3][0], f[3][1]); g.closePath(); g.clip();
        crRoofTexture(g, X, Y, W, H, crSh(r.hip[0], f[4]), Math.abs(f[0][1] - f[1][1]) < 1 ? "x" : "y", pat); g.restore();
      }
      g.strokeStyle = crSh(r.hip[0], 0.25); g.lineWidth = 2; g.beginPath();
      if (along === "x") { g.moveTo(X, Y); g.lineTo(X + s, Y + s); g.lineTo(X, Y + H); g.moveTo(X + s, Y + s); g.lineTo(X + W - s, Y + s); g.moveTo(X + W, Y); g.lineTo(X + W - s, Y + s); g.lineTo(X + W, Y + H); }
      else { g.moveTo(X, Y); g.lineTo(X + s, Y + s); g.lineTo(X + W, Y); g.moveTo(X + s, Y + s); g.lineTo(X + s, Y + H - s); g.moveTo(X, Y + H); g.lineTo(X + s, Y + H - s); g.lineTo(X + W, Y + H); }
      g.stroke();
    } else if (kind === "dome") {
      crRoofTexture(g, X, Y, W, H, r.flat, "x", "dome");
      g.fillStyle = crSh(r.flat, -0.25); g.fillRect(X, Y, W, 4); g.fillRect(X, Y + H - 4, W, 4); g.fillRect(X, Y, 4, H); g.fillRect(X + W - 4, Y, 4, H);
      const nd = Math.max(1, Math.min(3, Math.round(Math.max(W, H) / Math.min(W, H)))), dr = Math.min(W, H) * 0.34;
      for (let k = 0; k < nd; k++) { const dx = W >= H ? X + W * (k + 0.5) / nd : X + W / 2, dy = W >= H ? Y + H / 2 : Y + H * (k + 0.5) / nd; const gr = g.createRadialGradient(dx - dr * 0.35, dy - dr * 0.35, dr * 0.1, dx, dy, dr); gr.addColorStop(0, crSh(r.gable[0], 0.25)); gr.addColorStop(1, crSh(r.gable[1], -0.15)); g.fillStyle = gr; g.beginPath(); g.arc(dx, dy, dr, 0, 7); g.fill(); }
    } else {   // flat / false front
      crRoofTexture(g, X, Y, W, H, r.flat, "x", pat === "panel" ? "panel" : (pat === "patched" ? "shingle" : "flatstone"));
      if (pat !== "panel" && pat !== "flatstone") { g.fillStyle = crPat("gravel", r.flat); g.fillRect(X + 6, Y + 6, W - 12, H - 12); }
      g.fillStyle = crSh(r.flat, -0.3); g.fillRect(X, Y, W, 5); g.fillRect(X, Y + H - 5, W, 5); g.fillRect(X, Y, 5, H); g.fillRect(X + W - 5, Y, 5, H);
      g.fillStyle = crSh(r.flat, 0.12); g.fillRect(X + 5, Y + 5, W - 10, 1.5);
    }
  }
  // extras
  const X0 = -pad, Y0 = -pad, W0 = G.w * 16 + pad * 2, H0 = G.h * 16 + pad * 2;
  const house = b.type === "house" || b.type === "farmhouse" || b.type === "cabin" || b.type === "apartment";
  if (kind === "flat" || kind === "false") {
    const n = Math.max(1, Math.floor(W0 * H0 / 40000));
    for (let k = 0; k < Math.min(6, n); k++) {
      const ux = X0 + 16 + ((h >> (k * 3)) % Math.max(1, W0 - 60)), uy = Y0 + 16 + ((h >> (k * 3 + 7)) % Math.max(1, H0 - 50));
      if (r.windtrap) { g.fillStyle = "#8a7a62"; g.beginPath(); g.arc(ux + 12, uy + 12, 11, 0, 7); g.fill(); g.strokeStyle = "#5a4a32"; g.lineWidth = 1.5; for (let a = 0; a < 6; a++) { g.beginPath(); g.moveTo(ux + 12, uy + 12); g.lineTo(ux + 12 + Math.cos(a) * 11, uy + 12 + Math.sin(a) * 11); g.stroke(); } continue; }
      if (r.obelisk && k === 0) { g.fillStyle = "#d8bc7e"; g.fillRect(ux, uy, 14, 14); g.fillStyle = "#d4a537"; g.beginPath(); g.moveTo(ux, uy); g.lineTo(ux + 14, uy); g.lineTo(ux + 7, uy + 7); g.fill(); g.fillStyle = "#b8902a"; g.beginPath(); g.moveTo(ux, uy + 14); g.lineTo(ux + 14, uy + 14); g.lineTo(ux + 7, uy + 7); g.fill(); continue; }
      if (r.spires && k < 2) { g.fillStyle = "#2a2a32"; g.beginPath(); g.arc(ux + 8, uy + 8, 9, 0, 7); g.fill(); g.fillStyle = "#c9a227"; g.beginPath(); g.arc(ux + 8, uy + 8, 2.5, 0, 7); g.fill(); continue; }
      g.fillStyle = "rgba(0,0,0,0.25)"; g.fillRect(ux + 3, uy + 3, 26, 20);
      g.fillStyle = r.hvac; g.fillRect(ux, uy, 26, 20); g.fillStyle = crSh(r.hvac, -0.3); g.beginPath(); g.arc(ux + 13, uy + 10, 7, 0, 7); g.fill();
      g.strokeStyle = crSh(r.hvac, 0.2); g.lineWidth = 1; g.beginPath(); g.moveTo(ux + 6, uy + 10); g.lineTo(ux + 20, uy + 10); g.moveTo(ux + 13, uy + 3); g.lineTo(ux + 13, uy + 17); g.stroke();
    }
    if (r.pad && W0 > 360 && H0 > 260) { const px = X0 + W0 * 0.78, py = Y0 + H0 * 0.32; g.strokeStyle = "#f2f2f2"; g.lineWidth = 3; g.beginPath(); g.arc(px, py, 40, 0, 7); g.stroke(); g.fillStyle = "#f2f2f2"; g.font = "bold 28px sans-serif"; g.textAlign = "center"; g.fillText("H", px, py + 10); }
    if (r.holes) for (let k = 0; k < 3; k++) { g.fillStyle = "rgba(15,12,10,0.85)"; g.beginPath(); g.ellipse(X0 + 20 + ((h >> (k * 5)) % Math.max(1, W0 - 40)), Y0 + 20 + ((h >> (k * 5 + 9)) % Math.max(1, H0 - 40)), 8 + k * 3, 5 + k * 2, k, 0, 7); g.fill(); }
    if (kind === "false") { g.fillStyle = crPat("planks", "#8a6a48"); const f = b.front || "S"; if (f === "S") g.fillRect(X0, Y0 + H0 - 14, W0, 14); else if (f === "N") g.fillRect(X0, Y0, W0, 14); else if (f === "W") g.fillRect(X0, Y0, 14, H0); else g.fillRect(X0 + W0 - 14, Y0, 14, H0); }
  } else if (house) {
    if (r.chimney || (CITY.themeKey === "modern" && (h & 3) === 0) || CITY.themeKey === "frontier") { const cx = X0 + 20 + (h % Math.max(1, W0 - 50)), cy = Y0 + 14 + ((h >> 8) % Math.max(1, H0 - 40)); g.fillStyle = "rgba(0,0,0,0.3)"; g.fillRect(cx + 4, cy + 5, 16, 16); g.fillStyle = r.chimney && CITY.themeKey === "wizard" ? "#6a4a3a" : "#8a4a3a"; g.fillRect(cx, cy, 16, 16); g.fillStyle = "#2a2a2a"; g.fillRect(cx + 4, cy + 4, 8, 8); }
    if (r.solar || (CITY.themeKey === "modern" && (h & 7) === 5)) { const sx = X0 + W0 * 0.2, sy = Y0 + H0 * 0.58, sw = W0 * 0.42, sh = H0 * 0.26; g.fillStyle = "#1a2a4a"; g.fillRect(sx, sy, sw, sh); g.strokeStyle = "#5a7aa8"; g.lineWidth = 1; for (let x = sx; x < sx + sw; x += 12) { g.beginPath(); g.moveTo(x, sy); g.lineTo(x, sy + sh); g.stroke(); } g.beginPath(); g.moveTo(sx, sy + sh / 2); g.lineTo(sx + sw, sy + sh / 2); g.stroke(); }
  }
  if (r.neon || (T.w.glow && fam === "scifi" && kind !== "dome")) { g.save(); g.shadowColor = r.neon ? r.trim : T.w.glow; g.shadowBlur = 8; g.strokeStyle = r.neon ? r.trim : T.w.glow; g.lineWidth = 1.5; g.strokeRect(X0 + 3, Y0 + 3, W0 - 6, H0 - 6); g.restore(); }
  else if (r.trim && (CITY.themeKey === "pharaoh" || CITY.themeKey === "gothic")) { g.strokeStyle = r.trim; g.lineWidth = 2; g.strokeRect(X0 + 2, Y0 + 2, W0 - 4, H0 - 4); }
  R = { c, x0: b.x * 16 - pad, y0: b.y * 16 - pad, w: Wp, h: Hp, used: CR.frame, x1: b.x * 16 + Wp, y1: b.y * 16 + Hp };
  CR.roofs.set(b.uid, R);
  if (CR.roofs.size > 70) { const arr = [...CR.roofs.entries()].sort((a, q) => a[1].used - q[1].used); for (let i = 0; i < 16; i++) CR.roofs.delete(arr[i][0]); }
  return R;
}
function crDrawRoof(b, a) {
  const R = crRoofCanvas(b), ox = CITY.orx, oy = CITY.ory;
  ctx.globalAlpha = a;
  ctx.drawImage(R.c, R.x0 - ox, R.y0 - oy, R.w, R.h);
  ctx.globalAlpha = 1;
}
function crLabel(b, a) {
  const lab = cityBuildingLabel(b);
  if (!lab) return;
  const ox = CITY.orx, oy = CITY.ory, G = b.int, cx = (b.x + G.w / 2) * 16 - ox, cy = (b.y + G.h / 2) * 16 - oy, w = G.w * 16;
  const fs = Math.max(9, Math.min(22, w / Math.max(6, lab.length) * 1.5));
  ctx.save(); ctx.globalAlpha = a * 0.92; ctx.font = "900 " + fs + "px 'Segoe UI', sans-serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
  const tw = ctx.measureText(lab).width, T = CITY.theme, fam = crFam();
  ctx.fillStyle = fam === "scifi" ? "rgba(6,10,16,0.75)" : fam === "rustic" ? "rgba(60,40,20,0.8)" : "rgba(250,250,245,0.85)";
  crRR(ctx, cx - tw / 2 - 6, cy - fs * 0.7, tw + 12, fs * 1.4, 3); ctx.fill();
  if (fam === "scifi" && T.fu.glow) { ctx.shadowColor = T.fu.glow; ctx.shadowBlur = 8; ctx.fillStyle = T.fu.glow; }
  else ctx.fillStyle = fam === "rustic" ? "#f0deb0" : "#b71c1c";
  ctx.fillText(lab, cx, cy + 1);
  ctx.restore();
}

/* --- overlay: roofs + line-of-sight fog --------------------------------------------- */
function crViewBuildings(left, top, vw, vh) {
  const ox = CITY.orx, oy = CITY.ory, L = left + ox, Tp = top + oy, R = L + vw, B = Tp + vh, out = [], seen = new Set();
  for (let cy = Math.floor(Tp / 2048); cy <= Math.floor(B / 2048); cy++) for (let cx = Math.floor(L / 2048); cx <= Math.floor(R / 2048); cx++) {
    const C = cityRT.chunks.get(cx * 4096 + cy) || cityChunk(cx, cy);
    for (const b of C.blds) { if (seen.has(b.uid)) continue; seen.add(b.uid); if (b.x * 16 > R + 16 || (b.x + b.w) * 16 < L - 16 || b.y * 16 > B + 16 || (b.y + b.h) * 16 < Tp - 16) continue; out.push(b); }
    for (const p of C.props) if (p.t === "canopy" && !seen.has(p)) { seen.add(p); out.push({ canopy: p }); }
  }
  return out;
}
function cityRenderOverlay() {
  if (!CITY.on || !player) return;
  const CV = typeof camView === "function" ? camView(140) : null;
  const viewW = CV ? CV.vw : (W / opts.zoom) + 140, viewH = CV ? CV.vh : (H / opts.zoom) + 140, left = CV ? CV.left : player.x - viewW * 0.5, top = CV ? CV.top : player.y - viewH * 0.5;
  const list = crViewBuildings(left, top, viewW, viewH), dt = Math.min(0.05, (typeof frameDt === "number" ? frameDt : 0.016));
  const seenRoof = cityVis.roof, pb = cityVis.pBid, late = [];
  const under = typeof ACC !== "undefined" && player.roof ? ACC.drawnRoofs : null;   // v14.1: already drawn under the characters
  for (const b of list) {
    if (b.canopy) { late.push(b); continue; }
    if (under && under.has(b.uid)) continue;
    const tgt = b.uid === pb ? 0 : 1;
    let a = CR.roofA.get(b.uid); if (a === undefined) a = tgt;
    a += (tgt - a) * Math.min(1, dt * 9); if (Math.abs(tgt - a) < 0.01) a = tgt;
    CR.roofA.set(b.uid, a);
    if (a <= 0.01) continue;
    if (seenRoof.has(b.uid) || a < 1) late.push(b); else crDrawRoof(b, a);
  }
  crFog(left, top, viewW, viewH);
  const ox = CITY.orx, oy = CITY.ory;
  for (const b of late) {
    if (b.canopy) {
      const p = b.canopy, X = p.x * 16 - ox, Y = p.y * 16 - oy, Wc = p.w * 16, Hc = p.h * 16;
      const under = player.x > X && player.x < X + Wc && player.y > Y && player.y < Y + Hc, fam = crFam(), T = CITY.theme;
      ctx.globalAlpha = under ? 0.28 : 0.9;
      ctx.fillStyle = "rgba(0,0,0,0.25)"; ctx.fillRect(X + 8, Y + 10, Wc, Hc);
      ctx.fillStyle = fam === "scifi" ? T.w.metal : fam === "rustic" ? "#7a5a3e" : "#eceff1"; ctx.fillRect(X, Y, Wc, Hc);
      ctx.fillStyle = fam === "scifi" ? (T.fu.glow || "#4fc3ff") : fam === "rustic" ? "#5a3a1e" : "#c62828"; ctx.fillRect(X, Y, Wc, 6); ctx.fillRect(X, Y + Hc - 6, Wc, 6);
      ctx.globalAlpha = 1;
      continue;
    }
    const a = CR.roofA.get(b.uid);
    crDrawRoof(b, a);
    if (a > 0.4) crLabel(b, a);
  }
  ctx.globalAlpha = 1;
  if (typeof accRenderOverlay === "function") accRenderOverlay(list);   // v14.1 entrances, ladders, gesture reticle
}
function crFog(left, top, vw, vh) {
  const V = cityVis;
  if (!V.grid) return;
  const N = V.n;
  if (!CR.fogC || CR.fogC.width !== N) { CR.fogC = crCanvas(N, N); CR.fogG = CR.fogC.getContext("2d"); CR.fogImg = CR.fogG.createImageData(N, N); CR.fogGen = -1; }
  if (CR.fogGen !== V.stamp) {
    const d = CR.fogImg.data, Gd = V.grid;
    for (let i = 0, j = 0; i < N * N; i++, j += 4) { d[j] = 118; d[j + 1] = 122; d[j + 2] = 132; d[j + 3] = Gd[i] ? 0 : 255; }
    CR.fogG.putImageData(CR.fogImg, 0, 0); CR.fogGen = V.stamp;
  }
  const X = V.ox * 16 - CITY.orx, Y = V.oy * 16 - CITY.ory, S = N * 16;
  ctx.save();
  ctx.imageSmoothingEnabled = true;
  const pass = (op, alpha) => {
    ctx.globalCompositeOperation = op; ctx.globalAlpha = alpha;
    ctx.drawImage(CR.fogC, X, Y, S, S);
    ctx.fillStyle = "rgb(118,122,132)";
    const L = left - 50, Tt = top - 50, R = left + vw + 50, B = top + vh + 50;
    if (Y > Tt) ctx.fillRect(L, Tt, R - L, Y - Tt);
    if (Y + S < B) ctx.fillRect(L, Y + S, R - L, B - Y - S);
    if (X > L) ctx.fillRect(L, Math.max(Tt, Y), X - L, Math.min(B, Y + S) - Math.max(Tt, Y));
    if (X + S < R) ctx.fillRect(X + S, Math.max(Tt, Y), R - X - S, Math.min(B, Y + S) - Math.max(Tt, Y));
  };
  // true desaturation looks best but is the priciest blend on GPU-less devices: drop to a grey wash if FPS stays low
  const now = performance.now(), fdt = now - (CR.lastFog || now); CR.lastFog = now;
  if (fdt > 0 && fdt < 250) CR.fms = (CR.fms || 16.7) * 0.97 + fdt * 0.03;   // smoothed real frame interval
  if (CR.fogSat !== false && CR.fogSat !== "forced" && runActive && !runPaused) { CR.lowT = CR.fms > 19.5 ? (CR.lowT || 0) + 1 : Math.max(0, (CR.lowT || 0) - 2); if (CR.lowT > 150) CR.fogSat = false; }
  if (CR.fogSat !== false) pass("saturation", 0.92); else pass("source-over", 0.36);
  pass("multiply", 0.62);
  ctx.restore();
}
// EOF:js/cityrender.js
