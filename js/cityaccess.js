// FILE: js/cityaccess.js
// PART: v14.1 module 3 of 4
// DETAIL: v14.1 getting in, over and on top. Entrances are drawn after the roofs (step, frame, light, chevron when you
//         are close; garage doors and open bays too; EXIT markers inside), gates at every fence opening, and every hero
//         gets a mobility class with its own flavour: teleporters (apparate, Asgard beam, rings, transporter, sling
//         ring, warp jaunt, TARDIS...), jetpacks / flyers, leapers (Force leap, Spartan jump, Biotic charge...),
//         climbers (Wookiee, Xeno wall-crawl, commandos), a half-giant who steps over fences, and armoured smashers who
//         go straight through them. Every building has a roof access point styled for its universe (steel ladder,
//         wooden ladder, grav-lift pad); roofs are walkable, you see further from up there, enemies can spot and
//         shoot you and melee hunters climb the ladder after you. Teleporters: double-tap a building = inside,
//         triple-tap = roof (leapers / flyers: crash through a window / land on the roof).

"use strict";

/* === 1. MOBILITY CLASSES (per hero, with their own name for it) ===================================================== */
const ACC_MOB = {
  0: ["leap", "FORCE LEAP"], 1: ["jet", "JETPACK"], 2: ["climb", "TROOPER CLIMB"], 3: ["leap", "FORCE LEAP"], 4: ["jet", "ROCKET BOOSTERS"],
  5: ["climb", "WOOKIEE CLIMB", 1.6], 6: ["climb", "SCRAMBLE"], 7: ["tele", "RING TRANSPORTER"], 8: ["climb", "SCRAMBLE"], 9: ["climb", "SCRAMBLE"],
  10: ["tele", "ASGARD BEAM"], 11: ["leap", "WRAITH LEAP"], 12: ["tele", "PRIOR SHIFT"], 13: ["climb", "SCRAMBLE"], 14: ["leap", "ACROBATICS"],
  15: ["climb", "SCRAMBLE"], 16: ["jet", "JETPACK"], 17: ["climb", "REAVER CLIMB", 1.3], 18: ["leap", "WEIRDING LEAP"], 19: ["climb", "SARDAUKAR CLIMB", 1.2],
  20: ["none", "THE VOICE"], 21: ["jet", "SUSPENSORS"], 22: ["tele", "ENERGIZE"], 23: ["tele", "BORG TRANSPORT"], 24: ["climb", "SCRAMBLE"],
  25: ["jet", "THRUSTERS"], 26: ["smash", "CENTURION"], 27: ["leap", "BIOTIC CHARGE"], 28: ["none", "SMARTGUN RIG"], 29: ["leap", "YAUTJA LEAP"],
  30: ["climb", "WALL CRAWL", 2.2], 31: ["climb", "SCRAMBLE"], 32: ["leap", "SPARTAN JUMP"], 33: ["leap", "DOUBLE JUMP"], 34: ["smash", "POWER ARMOUR"],
  35: ["none", "SERVO-HARNESS"], 36: ["smash", "NECRODERMIS"], 37: ["smash", "WAAAGH!"], 38: ["tele", "WARP JAUNT"], 39: ["leap", "SUPER JUMP"],
  40: ["smash", "T-800"], 41: ["climb", "SCRAMBLE"], 42: ["leap", "SANDEVISTAN"], 43: ["climb", "SCRAMBLE"], 44: ["climb", "SCRAMBLE"],
  45: ["leap", "LONG-JUMP MODULE"], 46: ["tele", "TARDIS HOP"], 47: ["leap", "SPACE JUMP"], 48: ["leap", "WITCHER VAULT"], 49: ["tele", "NON-EUCLIDEAN STEP"],
  50: ["leap", "RONIN LEAP"], 51: ["climb", "SCRAMBLE"], 52: ["climb", "SCRAMBLE"], 53: ["climb", "SCRAMBLE", 1.3], 54: ["jet", "JETPACK"],
  55: ["climb", "WALL CRAWL", 2.0], 56: ["tele", "APPARATE"], 57: ["tele", "APPARATE"], 58: ["tele", "APPARATE"], 59: ["tele", "APPARATE"],
  60: ["tele", "APPARATE"], 61: ["giant", "HALF-GIANT STRIDE"], 62: ["tele", "APPARATE"], 63: ["tele", "APPARATE"], 64: ["tele", "APPARATE"],
  65: ["tele", "APPARATE"], 66: ["tele", "APPARATE"], 67: ["tele", "APPARATE"], 68: ["tele", "APPARATE"], 69: ["tele", "APPARATE"],
  70: ["jet", "DARK FLIGHT"], 71: ["tele", "ISTARI STRIDE"], 72: ["tele", "ISTARI STRIDE"], 73: ["tele", "SLING-RING PORTAL"], 74: ["jet", "HEX FLIGHT"],
  75: ["tele", "SHADOW STEP"], 76: ["smash", "FORCE CRUSH"], 77: ["leap", "FORCE FLIP"], 78: ["leap", "FORCE LEAP"], 79: ["leap", "ATARU FLIP"]
};
const ACC_MOB_DESC = {
  tele: "phases through walls & fences — double-tap a building to go inside, triple-tap to land on its roof",
  jet: "flies over fences and onto roofs — double-tap a building to crash in through a window, triple-tap to land on the roof",
  leap: "vaults any fence and jumps onto roofs — double-tap a building to dive through a window, triple-tap for the roof",
  climb: "climbs fences and walls (slower) — press F at a wall to get on the roof",
  giant: "steps over fences and pulls himself onto low roofs — press F at a wall",
  smash: "goes straight through wooden, picket and chain-link fences — roofs by ladder",
  none: "vaults low fences only — use gates, ladders (🪜) and doors"
};
function accMob(cid) {
  if (cid == null && player) cid = player.cid;
  if (typeof CUSTOM_CID !== "undefined" && cid === CUSTOM_CID) {
    if (player && player.flying) return ["jet", "JETPACK"];
    const sp = typeof getHeroDashSpec === "function" ? getHeroDashSpec(cid) : null, st = sp && sp.style;
    if (st === "blink") return ["tele", "BLINK"]; if (st === "jetpack" || st === "jetpackSlam") return ["jet", "JETPACK"];
    if (st === "yodaFlip" || st === "saberRush" || st === "maulSpin" || st === "vaderLunge" || st === "vaapad") return ["leap", "FORCE LEAP"];
    return ["climb", "SCRAMBLE"];
  }
  return ACC_MOB[cid] || ["none", "ON FOOT"];
}

/* === 2. ENTRANCES, GARAGE DOORS & ROOF ACCESS (cached per building) ================================================ */
const ACC = { ent: new Map(), lad: new Map(), roofSet: null, roofT: 0, cross: null, push: 0, pushDir: null, climb: null, gest: null, taps: [], tipT: 0, drawnRoofs: new Set(), eRoof: null };
function accOutDir(G, x, y, axis) {
  const out = (cx, cy) => cx < 0 || cy < 0 || cx >= G.w || cy >= G.h || G.c[cy * G.w + cx] === IC_OUT;
  if (axis === "x") return out(x, y - 1) ? [0, -1] : out(x, y + 1) ? [0, 1] : null;
  return out(x - 1, y) ? [-1, 0] : out(x + 1, y) ? [1, 0] : null;
}
function accEntrances(b) {
  let E = ACC.ent.get(b.uid);
  if (E) return E;
  const G = b.int || cityInterior(b);
  E = [];
  G.doors.forEach((d, k) => { if (!d.ext) return; const o = accOutDir(G, d.x, d.y, d.axis); if (o) E.push({ x: b.x + d.x, y: b.y + d.y, len: d.len, axis: d.axis, o, kind: "door", id: b.uid + ":" + k }); });
  // garage doors and open bays (runs of IC_GDOOR / arch cells on the outer wall)
  const seen = new Uint8Array(G.w * G.h);
  for (let y = 0; y < G.h; y++) for (let x = 0; x < G.w; x++) {
    const i = y * G.w + x; if (seen[i] || G.c[i] !== IC_GDOOR) continue;
    let len = 1, axis = "x";
    if (x + 1 < G.w && G.c[i + 1] === IC_GDOOR) { while (x + len < G.w && G.c[i + len] === IC_GDOOR) { seen[i + len] = 1; len++; } }
    else { axis = "y"; while (y + len < G.h && G.c[i + len * G.w] === IC_GDOOR) { seen[i + len * G.w] = 1; len++; } }
    seen[i] = 1;
    const o = accOutDir(G, x, y, axis); if (o) E.push({ x: b.x + x, y: b.y + y, len, axis, o, kind: "garage", id: b.uid + ":g" + x + "," + y });
  }
  if (G.arch && G.arch.length) {
    const cells = []; for (let i = 0; i < G.arch.length; i += 2) cells.push([G.arch[i], G.arch[i + 1]]);
    cells.sort((a, c) => a[1] - c[1] || a[0] - c[0]);
    let run = null;
    const flush = () => { if (run && run.len >= 3) { const o = accOutDir(G, run.x, run.y, run.axis); if (o) E.push({ x: b.x + run.x, y: b.y + run.y, len: run.len, axis: run.axis, o, kind: "bay", id: b.uid + ":a" + run.x + "," + run.y }); } run = null; };
    for (const [x, y] of cells) {
      if (x !== 0 && y !== 0 && x !== G.w - 1 && y !== G.h - 1) continue;
      if (run && run.axis === "x" && y === run.y && x === run.x + run.len) { run.len++; continue; }
      flush(); run = { x, y, len: 1, axis: (y === 0 || y === G.h - 1) ? "x" : "y" };
    }
    flush();
  }
  ACC.ent.set(b.uid, E);
  if (ACC.ent.size > 600) ACC.ent.delete(ACC.ent.keys().next().value);
  return E;
}
// one roof access per building (two for big ones): an exterior wall cell with free, walkable ground outside, away from doors
function accLadders(b) {
  let L = ACC.lad.get(b.uid);
  if (L) return L;
  const G = b.int || cityInterior(b), E = accEntrances(b), cand = [];
  const near = (x, y) => E.some(e => { const ex = e.x - b.x, ey = e.y - b.y; return e.axis === "x" ? Math.abs(y - ey) < 3 && x > ex - 4 && x < ex + e.len + 3 : Math.abs(x - ex) < 3 && y > ey - 4 && y < ey + e.len + 3; });
  for (let y = 0; y < G.h; y++) for (let x = 0; x < G.w; x++) {
    if (G.c[y * G.w + x] !== IC_EXT) continue;
    for (const [dx, dy] of [[0, -1], [0, 1], [-1, 0], [1, 0]]) {
      const ox = x + dx, oy = y + dy;
      if (!(ox < 0 || oy < 0 || ox >= G.w || oy >= G.h || G.c[oy * G.w + ox] === IC_OUT)) continue;
      // the inside neighbour must be wall too along the run (straight wall, not a corner) and ground outside must be free
      const wx = b.x + ox, wy = b.y + oy, f = cityFlagsT(wx, wy), f2 = cityFlagsT(wx + dx, wy + dy);
      if ((f & (F_MOVE | F_IN | F_WATER)) || (f2 & (F_MOVE | F_WATER))) continue;
      const along = dx ? [[0, 1], [0, -1]] : [[1, 0], [-1, 0]];
      if (along.some(([ax, ay]) => G.c[(y + ay) * G.w + (x + ax)] !== IC_EXT && G.c[(y + ay) * G.w + (x + ax)] !== IC_WIN)) continue;
      if (near(x, y)) continue;
      const side = dy < 0 ? (b.front === "N" ? 0 : 2) : dy > 0 ? (b.front === "S" ? 0 : 2) : dx < 0 ? (b.front === "W" ? 0 : 1) : (b.front === "E" ? 0 : 1);
      cand.push({ x: b.x + x, y: b.y + y, o: [dx, dy], score: side * 10 + ((cH(b.seed, x, y, 41) % 100) / 100) });
    }
  }
  cand.sort((a, c) => c.score - a.score);
  L = cand.length ? [cand[0]] : [];
  if (cand.length > 1 && b.w * b.h > 900) { const far = cand.find(q => Math.abs(q.x - cand[0].x) + Math.abs(q.y - cand[0].y) > 18); if (far) L.push(far); }
  for (const q of L) { q.bx = (q.x + q.o[0] * 1.5 + 0.5) * 16 - CITY.orx; q.by = (q.y + q.o[1] * 1.5 + 0.5) * 16 - CITY.ory; q.tx = (q.x - q.o[0] * 1.2 + 0.5) * 16 - CITY.orx; q.ty = (q.y - q.o[1] * 1.2 + 0.5) * 16 - CITY.ory; q.uid = b.uid; }
  ACC.lad.set(b.uid, L);
  if (ACC.lad.size > 600) ACC.lad.delete(ACC.lad.keys().next().value);
  return L;
}

/* === 3. ART: entrances, ladders, exits (drawn after the roofs so you never have to guess a slit) ===================== */
function accDrawEntrance(g, b, e, near, inside) {
  const T = CITY.theme, fam = crFam(), ox = CITY.orx, oy = CITY.ory;
  const X = e.x * 16 - ox, Y = e.y * 16 - oy, len = e.len * 16, hx = e.axis === "x";
  const [odx, ody] = e.o;
  const fx = hx ? X : (odx < 0 ? X : X + 16), fy = hx ? (ody < 0 ? Y : Y + 16) : Y;   // outer face of the door cell
  const D = e.kind === "door" ? cityRT.doors.get(e.id) : null, open = D ? Math.max(0, Math.min(1, D.open)) : (e.kind === "bay" || (e.kind === "garage" && cityRT.gopen.has(b.uid)) ? 1 : 0);
  const accent = fam === "scifi" ? (T.fu.glow || "#4fc3ff") : fam === "rustic" ? "#ffcc66" : "#ffe082";
  const t = typeof runTime === "number" ? runTime : 0, pulse = 0.5 + 0.5 * Math.sin(t * 4 + e.x);
  // local frame: u along the door, n = outward normal (so one drawing serves all four walls)
  const ux = hx ? 1 : 0, uy = hx ? 0 : 1, nx = odx, ny = ody;
  const P = (a, n) => [fx + ux * a + nx * n, fy + uy * a + ny * n];
  const quad = (a0, a1, n0, n1) => { const p1 = P(a0, n0), p2 = P(a1, n0), p3 = P(a1, n1), p4 = P(a0, n1); g.beginPath(); g.moveTo(p1[0], p1[1]); g.lineTo(p2[0], p2[1]); g.lineTo(p3[0], p3[1]); g.lineTo(p4[0], p4[1]); g.closePath(); };
  g.save();
  if (!inside) {
    if (e.kind === "door") {
      // stoop / step / landing pad outside + doormat
      quad(-6, len + 6, 0, 12); g.fillStyle = fam === "scifi" ? "rgba(36,54,72,0.92)" : fam === "rustic" ? "rgba(128,92,56,0.95)" : "rgba(214,210,200,0.95)"; g.fill();
      g.strokeStyle = fam === "scifi" ? crA(accent, 0.8) : "rgba(0,0,0,0.35)"; g.lineWidth = 1; g.stroke();
      quad(3, len - 3, 2, 8); g.fillStyle = fam === "scifi" ? crA(accent, 0.35) : "#6d2f22"; g.fill();
    } else {
      quad(-2, len + 2, 0, 7); g.fillStyle = fam === "scifi" ? "rgba(36,54,72,0.85)" : "rgba(150,150,146,0.9)"; g.fill();
      if (e.kind === "bay") { g.fillStyle = "#f9a825"; for (let k = 0; k < len; k += 8) { quad(k, Math.min(len, k + 4), 0, 4); g.fill(); } }
    }
    // the door itself across the wall line (or the dark opening when it is open), outlined so it pops off the roof
    const th = e.kind === "door" ? 6 : 5;
    quad(0, len, -th, 0);
    if (open > 0.5) g.fillStyle = "#0b0b0d";
    else g.fillStyle = e.kind === "garage" ? crSh(T.w.metal, 0.25) : fam === "scifi" ? crSh(T.w.metal, 0.05) : fam === "rustic" ? "#6b4424" : ["#b3261e", "#1e4f8a", "#2f6b34", "#7a4a22", "#f2f2ec", "#1d1d1f"][cH(b.seed, e.x, e.y, 3) % 6];
    g.fill(); g.strokeStyle = open > 0.5 ? crA(accent, 0.6) : "rgba(255,255,255,0.75)"; g.lineWidth = 1; g.stroke();
    if (e.kind === "garage" && open <= 0.5) { g.strokeStyle = "rgba(0,0,0,0.35)"; g.lineWidth = 0.7; for (let k = 1; k < 3; k++) { const a = P(0, -th * k / 3), c = P(len, -th * k / 3); g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(c[0], c[1]); g.stroke(); } }
    if (e.kind === "door" && open <= 0.5) { const k = P(len * 0.8, -th / 2); g.fillStyle = "#ffd54f"; g.beginPath(); g.arc(k[0], k[1], 1.1, 0, 7); g.fill(); }
    if (e.kind === "door" && open > 0.5) { const h0 = P(0, -1); g.save(); g.translate(h0[0], h0[1]); g.rotate(Math.atan2(uy, ux) + (nx + ny > 0 ? -1 : 1) * 1.2 * (hx ? 1 : -1)); g.fillStyle = "rgba(160,120,80,0.9)"; g.fillRect(0, -1.2, len * 0.85, 2.4); g.restore(); }
    // frame posts + porch light
    g.fillStyle = accent; quad(-2.5, 0, -th - 1, 1); g.fill(); quad(len, len + 2.5, -th - 1, 1); g.fill();
    if (e.kind === "door") { const l = P(len + 6, 5); crGlow(g, l[0], l[1], 14 + (T.dark || 0) * 18, accent, 0.28 + (T.dark || 0) * 0.5); g.fillStyle = "#fffde7"; g.fillRect(l[0] - 1.2, l[1] - 1.2, 2.4, 2.4); }
    // a soft chevron on the step points in, always (stronger when you are close)
    const c0 = P(len / 2, e.kind === "door" ? 9 : 5), a = near ? 0.55 + 0.4 * pulse : 0.38;
    g.fillStyle = crA(accent, a); g.beginPath();
    const tip = [c0[0] - nx * 4.5, c0[1] - ny * 4.5], wl = [c0[0] + nx * 1.5 + ux * 4.5, c0[1] + ny * 1.5 + uy * 4.5], wr = [c0[0] + nx * 1.5 - ux * 4.5, c0[1] + ny * 1.5 - uy * 4.5];
    g.moveTo(tip[0], tip[1]); g.lineTo(wl[0], wl[1]); g.lineTo(wr[0], wr[1]); g.fill();
    if (near) { quad(-7, len + 7, -th - 2, 14); g.strokeStyle = crA(accent, 0.35 + 0.45 * pulse); g.lineWidth = 1.6; g.stroke(); }
  } else if (e.kind !== "garage") {
    // from inside: an EXIT marker on the floor in front of the door (green, like the real thing)
    const c0 = P(len / 2, -22), a = near ? 0.6 + 0.35 * pulse : 0.4;
    g.fillStyle = "rgba(10,40,20," + (a * 0.8).toFixed(2) + ")"; g.fillRect(c0[0] - 11, c0[1] - 5, 22, 10);
    g.font = "800 7px 'Segoe UI', sans-serif"; g.textAlign = "center"; g.textBaseline = "middle"; g.fillStyle = "rgba(105,240,174," + a.toFixed(2) + ")"; g.fillText("EXIT", c0[0], c0[1] + 0.5);
    const tip = P(len / 2, -10); g.beginPath(); g.moveTo(tip[0] + nx * 4, tip[1] + ny * 4); g.lineTo(tip[0] - nx * 1 + ux * 4, tip[1] - ny * 1 + uy * 4); g.lineTo(tip[0] - nx * 1 - ux * 4, tip[1] - ny * 1 - uy * 4); g.fill();
  }
  g.restore();
}
function accDrawLadder(g, q, near) {
  const fam = crFam(), T = CITY.theme, ox = CITY.orx, oy = CITY.ory, X = q.x * 16 - ox, Y = q.y * 16 - oy, [dx, dy] = q.o;
  g.save();
  if (fam === "scifi") {   // grav-lift pad on the ground + beam up the wall
    const cx = q.bx, cy = q.by, gl = T.fu.glow || "#4fc3ff", p = 0.5 + 0.5 * Math.sin((runTime || 0) * 4);
    crGlow(g, cx, cy, 16, gl, 0.3 + 0.25 * p); g.strokeStyle = crA(gl, 0.85); g.lineWidth = 1.6; g.beginPath(); g.arc(cx, cy, 7, 0, 7); g.stroke();
    g.fillStyle = crA(gl, 0.8); for (let k = 0; k < 3; k++) { const t = ((runTime || 0) * 1.5 + k / 3) % 1; g.globalAlpha = 1 - t; g.fillRect(cx - 3 - dy * 0, cy - 1 - t * 8 * (dy || 0) - t * 8 * 0, 6, 1.5); }
    g.globalAlpha = 1;
  } else {
    const wood = fam === "rustic" || CITY.themeKey === "frontier" || CITY.themeKey === "western" || CITY.themeKey === "medieval", rail = wood ? "#7a5432" : "#9aa0a6", rung = wood ? "#8a6440" : "#b8bec4";
    // ladder lying against the outer wall face, foot on the ground (oblique: it reaches 14 px out)
    const fx = X + (dx > 0 ? 16 : 0), fy = Y + (dy > 0 ? 16 : 0);
    const w = 10, out = 18;
    g.fillStyle = "rgba(0,0,0,0.25)";
    if (dy) g.fillRect(X + 3.5 + 2, dy < 0 ? fy - out + 2 : fy + 2, w, out); else g.fillRect(dx < 0 ? fx - out + 2 : fx + 2, Y + 3.5 + 2, out, w);
    g.fillStyle = rail;
    if (dy) { g.fillRect(X + 3.5, dy < 0 ? fy - out : fy, 1.8, out); g.fillRect(X + 3.5 + w - 1.8, dy < 0 ? fy - out : fy, 1.8, out); g.fillStyle = rung; for (let k = 2; k < out; k += 3.2) g.fillRect(X + 3.5, (dy < 0 ? fy - out : fy) + k, w, 1.2); }
    else { g.fillRect(dx < 0 ? fx - out : fx, Y + 3.5, out, 1.8); g.fillRect(dx < 0 ? fx - out : fx, Y + 3.5 + w - 1.8, out, 1.8); g.fillStyle = rung; for (let k = 2; k < out; k += 3.2) g.fillRect((dx < 0 ? fx - out : fx) + k, Y + 3.5, 1.2, w); }
    // hooks over the roof edge
    g.fillStyle = rail; if (dy) { g.fillRect(X + 3.5, dy < 0 ? fy : fy - 3, 1.8, 3); g.fillRect(X + 3.5 + w - 1.8, dy < 0 ? fy : fy - 3, 1.8, 3); } else { g.fillRect(dx < 0 ? fx : fx - 3, Y + 3.5, 3, 1.8); g.fillRect(dx < 0 ? fx : fx - 3, Y + 3.5 + w - 1.8, 3, 1.8); }
  }
  if (near) {
    const p = 0.5 + 0.5 * Math.sin((runTime || 0) * 5);
    g.strokeStyle = "rgba(255,209,102," + (0.45 + 0.4 * p).toFixed(2) + ")"; g.lineWidth = 1.6; g.beginPath(); g.arc(q.bx, q.by, 12, 0, 7); g.stroke();
  }
  g.restore();
}

/* === 4. DRAW HOOKS ================================================================================================== */
// after the roofs: entrances (outside: every seen building; inside: your building's exits), ladders, gesture reticle
function accRenderOverlay(list) {
  if (!CITY.on || !player) return;
  const g = ctx, pb = cityVis.pBid, seen = cityVis.roof, px = player.x, py = player.y;
  for (const b of list) {
    if (b.canopy) continue;
    const inside = b.uid === pb, vis = inside || seen.has(b.uid) || (player.roof && ACC.roofSet && ACC.roofSet.has(b.uid));
    if (!vis) continue;
    const E = accEntrances(b);
    for (const e of E) {
      const ex = (e.x + (e.axis === "x" ? e.len / 2 : 0.5)) * 16 - CITY.orx, ey = (e.y + (e.axis === "x" ? 0.5 : e.len / 2)) * 16 - CITY.ory;
      accDrawEntrance(g, b, e, Math.abs(ex - px) < 200 && Math.abs(ey - py) < 200 && Math.hypot(ex - px, ey - py) < 190 && !player.roof, inside);
    }
    if (!inside) for (const q of accLadders(b)) accDrawLadder(g, q, Math.hypot(q.bx - px, q.by - py) < 70 || (player.roof && Math.hypot(q.tx - px, q.ty - py) < 70));
  }
  // where a double / triple tap will put you
  const R = ACC.reticle;
  if (R && runTime - R.t < 0.6) {
    const a = 1 - (runTime - R.t) / 0.6;
    g.save(); g.globalAlpha = a; g.strokeStyle = "#80deea"; g.lineWidth = 2; g.beginPath(); g.arc(R.x, R.y, 10 + (1 - a) * 14, 0, 7); g.stroke();
    g.font = "800 9px 'Segoe UI', sans-serif"; g.textAlign = "center"; g.fillStyle = "#e0f7fa"; g.fillText(R.txt, R.x, R.y - 18); g.restore();
  }
  // climb / drop progress ring
  const P = ACC.climb || (ACC.push > 0.05 && ACC.pushNeed ? { prog: ACC.push / ACC.pushNeed, x: px, y: py } : null);
  if (P && (P.prog || P.t != null)) {
    const prog = P.prog != null ? P.prog : P.t / P.dur;
    g.save(); g.strokeStyle = "rgba(255,209,102,0.9)"; g.lineWidth = 3; g.beginPath(); g.arc(px, py - 22, 7, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * Math.min(1, prog)); g.stroke(); g.restore();
  }
}
// while you stand on a roof, its buildings are drawn under the characters (so you, and anyone up there, stand on it)
function accRenderRoofUnder() {
  ACC.drawnRoofs.clear();
  if (!player || !player.roof || !ACC.roofSet) return;
  const CV = typeof camView === "function" ? camView(200) : null;
  const list = CV ? crViewBuildings(CV.left, CV.top, CV.vw, CV.vh) : [];
  for (const b of list) {
    if (!ACC.roofSet.has(b.uid) || b.canopy) continue;
    crDrawRoof(b, 1); ACC.drawnRoofs.add(b.uid);
    ctx.globalAlpha = 1;
  }
  // a soft edge line so you know where the drop is
  ctx.save(); ctx.strokeStyle = "rgba(255,255,255,0.18)"; ctx.setLineDash([5, 4]); ctx.lineWidth = 1.2;
  for (const b of list) if (ACC.drawnRoofs.has(b.uid)) { const X = b.x * 16 - CITY.orx, Y = b.y * 16 - CITY.ory; ctx.strokeRect(X + 2, Y + 2, b.w * 16 - 4, b.h * 16 - 4); }
  ctx.restore();
}

/* === 5. ROOFS: standing, walking, getting up and down ================================================================ */
function accRoofTile(lx, ly) { return cityBldT(cityTX(lx), cityTY(ly)); }
function accRoofBlocked(x, y, r) {
  r = r || 7;
  if (!accRoofTile(x, y) || !accRoofTile(x + r, y) || !accRoofTile(x - r, y) || !accRoofTile(x, y + r) || !accRoofTile(x, y - r)) return true;
  return false;
}
function accRoofCompute(b) {   // every roof you can walk to from here (touching buildings), within ~80 m
  const set = new Set([b.uid]);
  const sx = b.x + (b.w >> 1), sy = b.y + (b.h >> 1), seen = new Set(), q = [[sx, sy]];
  let n = 0;
  while (q.length && n < 30000) {
    const [x, y] = q.pop(); const k = y * 131072 + x; if (seen.has(k)) continue; seen.add(k); n++;
    if (Math.abs(x - sx) > 160 || Math.abs(y - sy) > 160) continue;
    const bb = cityBldT(x, y); if (!bb) continue;
    set.add(bb.uid);
    q.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
  }
  return set;
}
function accSetRoof(b) {
  player.roof = { uid: b.uid, t: runTime };
  ACC.roofSet = accRoofCompute(b);
  cityRT.visGen++;
  if (typeof noiseEmit === "function") noiseEmit(player.x, player.y, 48, "steps", 0);
  accTipOnce("roof", "🏠 <b>On the roof</b> — you see further from up here. Enemies can spot you from the street; melee hunters will come up the ladder. <b>F</b> at the edge or ladder to get down.");
}
function accLeaveRoof() { player.roof = null; ACC.roofSet = null; cityRT.visGen++; if (ACC.eRoof) ACC.eRoof.fill(0); }
// movement on a roof (js/sim.js calls this instead of the tile collision); pushing over the edge = drop down
function accRoofMove(nx, ny, dt) {
  const ox = player.x, oy = player.y;
  if (!accRoofBlocked(nx, player.y)) player.x = nx;
  if (!accRoofBlocked(player.x, ny)) player.y = ny;
  const want = Math.hypot(nx - ox, ny - oy), got = Math.hypot(player.x - ox, player.y - oy);
  if (want > 0.3 && got < want * 0.35) {
    const cls = accMob()[0], need = cls === "none" || cls === "smash" ? 0.55 : cls === "climb" ? 0.4 : 0.15;
    ACC.push += dt; ACC.pushNeed = need;
    if (ACC.push > need) { ACC.push = 0; accDropFromRoof((nx - ox) / want, (ny - oy) / want); }
  } else if (got > want * 0.6) ACC.push = Math.max(0, ACC.push - dt * 2);
}
function accDropFromRoof(dx, dy, viaLadder) {
  let x = player.x, y = player.y;
  if (viaLadder) { x = viaLadder.bx; y = viaLadder.by; }
  else { for (let k = 0; k < 40 && accRoofTile(x, y); k++) { x += dx * 8; y += dy * 8; } x += dx * 14; y += dy * 14; }
  const q = cityFindWalkable(x, y, 120, true), cls = accMob()[0];
  ACC.climb = { t: 0, dur: viaLadder ? 0.8 : 0.4, x0: player.x, y0: player.y, x1: q[0], y1: q[1], down: true, ladder: !!viaLadder };
  player.acrobatVZ = viaLadder ? 0 : 60;
  accLeaveRoof();
  if (!viaLadder) {
    const dmg = cls === "none" ? 0.04 : cls === "smash" ? 0.03 : cls === "climb" ? 0.015 : 0;
    if (dmg && !(player.invulnT > 0)) { player.hp -= player.maxHp * dmg; spawnSpeech(player.x, player.y - 24, "OOF!", "#ffab40", 0.8); }
    if (typeof noiseEmit === "function") noiseEmit(q[0], q[1], dmg ? 66 : 50, "land", 0);
  }
}
function accClimbUp(b, x1, y1, how) {
  const cls = accMob(), dur = how === "ladder" ? 1.1 : cls[0] === "tele" ? 0.25 : cls[0] === "jet" ? 0.55 : cls[0] === "leap" ? 0.45 : cls[0] === "giant" ? 0.8 : 1.3 / (cls[2] || 1);
  ACC.climb = { t: 0, dur, x0: player.x, y0: player.y, x1, y1, b, up: true, how };
  if (how !== "ladder" && cls[0] !== "climb" && cls[0] !== "giant") player.acrobatVZ = 95;
  spawnSpeech(player.x, player.y - 26, how === "ladder" ? "CLIMBING…" : cls[1] + "!", "#ffd166", 0.9);
  if (typeof sfx === "function") { if (cls[0] === "tele") sfx(1400, 300, 0.18, "sine", 0.08); else if (cls[0] === "jet") sfx(120, 300, 0.3, "sawtooth", 0.07); else sfx(500, 700, 0.06, "triangle", 0.05); }
}
function accClimbStep(dt) {
  const C = ACC.climb; if (!C) return false;
  C.t += dt;
  const f = Math.min(1, C.t / C.dur), e = f * f * (3 - 2 * f);
  player.x = C.x0 + (C.x1 - C.x0) * e; player.y = C.y0 + (C.y1 - C.y0) * e; player.vx = player.vy = 0;
  if (C.how === "ladder" || C.ladder) player.walk += dt * 9;
  if (f >= 1) {
    ACC.climb = null;
    if (C.up) accSetRoof(C.b || accRoofTile(C.x1, C.y1) || { uid: -1, x: 0, y: 0, w: 1, h: 1 });
    if (C.tele) { player.x = C.x1; player.y = C.y1; }
  }
  return true;
}
// nearest exterior wall in front of the hero (for "F: get on the roof" by climbers / leapers / flyers / teleporters)
function accWallAhead() {
  const a = Math.atan2(player.vy || Math.sin(player.aim || 0), player.vx || Math.cos(player.aim || 0));
  let best = null;
  for (const da of [0, -0.6, 0.6, -1.2, 1.2, Math.PI]) {
    const ux = Math.cos(a + da), uy = Math.sin(a + da);
    for (let s = 8; s <= 26; s += 3) {
      const tx = cityTX(player.x + ux * s), ty = cityTY(player.y + uy * s), b = cityBldT(tx, ty);
      if (!b) continue;
      const k = cityKindT(tx, ty);
      if (k >= 1 && k <= 4 || k === K_WIN || k === K_GDOOR) { best = { b, x: player.x + ux * (s + 22), y: player.y + uy * (s + 22), d: s }; break; }
      break;
    }
    if (best) break;
  }
  return best;
}

/* === 6. FENCES: who gets over, and how ============================================================================== */
// fence kind at a tile: wood / chain / picket / stone (garden walls) / hedge, or null
function accFenceKind(tx, ty) {
  const k = cityKindT(tx, ty);
  if (k === K_FENCE_WOOD) return "wood"; if (k === K_FENCE_CHAIN) return "chain"; if (k === K_FENCE_PICKET) return "picket"; if (k === K_HEDGE) return "hedge";
  if (k === K_STONE) { const C = cityChunk(tx >> 7, ty >> 7); for (const f of C.fences) if (f.kind === "stone" && tx >= f.x0 && tx <= Math.max(f.x0, f.x1 - 1) && ty >= f.y0 && ty <= Math.max(f.y0, f.y1 - 1)) return "stone"; }
  return null;
}
// seconds of pushing before the hero goes over (Infinity = cannot)
function accFenceTime(cls, kind) {
  const T = {
    tele:  { picket: 0.12, stone: 0.12, wood: 0.15, chain: 0.15, hedge: 0.15 },
    jet:   { picket: 0.12, stone: 0.12, wood: 0.15, chain: 0.15, hedge: 0.15 },
    leap:  { picket: 0.1, stone: 0.12, wood: 0.15, chain: 0.15, hedge: 0.15 },
    giant: { picket: 0.1, stone: 0.12, wood: 0.2, chain: 0.2, hedge: 0.2 },
    climb: { picket: 0.2, stone: 0.3, wood: 0.35, chain: 0.3, hedge: Infinity },
    smash: { picket: 0.15, stone: 0.5, wood: 0.25, chain: 0.3, hedge: 0.3 },
    none:  { picket: 0.25, stone: 0.4, wood: Infinity, chain: Infinity, hedge: Infinity }
  };
  return (T[cls] || T.none)[kind];
}
function accCrossDur(cls, kind, mob) { if (cls === "tele") return 0.22; if (cls === "jet" || cls === "leap") return 0.42; if (cls === "giant") return 0.5; if (cls === "climb") return (kind === "picket" ? 0.45 : 1.0) / (mob[2] || 1); return kind === "picket" ? 0.5 : 0.85; }
function accInputDir() {
  let mx = joy && joy.act ? joy.dx : 0, my = joy && joy.act ? joy.dy : 0;
  if (keys.KeyW || keys.ArrowUp) my -= 1; if (keys.KeyS || keys.ArrowDown) my += 1; if (keys.KeyA || keys.ArrowLeft) mx -= 1; if (keys.KeyD || keys.ArrowRight) mx += 1;
  const m = Math.hypot(mx, my); return m > 0.01 ? [mx / Math.max(1, m), my / Math.max(1, m), Math.min(1, m)] : [0, 0, 0];
}
function accFenceStep(dt) {
  if (ACC.cross) {
    const C = ACC.cross; C.t += dt;
    const f = Math.min(1, C.t / C.dur), e = f * f * (3 - 2 * f);
    player.x = C.x0 + (C.x1 - C.x0) * e; player.y = C.y0 + (C.y1 - C.y0) * e;
    if (C.cls === "climb" || C.cls === "none" || C.cls === "smash") player.walk += dt * 8;
    if (f >= 1) ACC.cross = null;
    return;
  }
  if (player.inVehicle || player.roof || player.flying || ACC.climb) { ACC.fpush = 0; return; }
  const [dx, dy, mag] = accInputDir();
  if (mag < 0.5) { ACC.fpush = 0; return; }
  const moved = Math.hypot(player.x - (ACC.lpx || player.x), player.y - (ACC.lpy || player.y));
  ACC.lpx = player.x; ACC.lpy = player.y;
  const tx = cityTX(player.x + dx * 13), ty = cityTY(player.y + dy * 13), kind = accFenceKind(tx, ty);
  if (!kind || moved > (player.spd || 110) * dt * 0.45) { ACC.fpush = 0; ACC.fkind = null; return; }
  const mob = accMob(), cls = mob[0], need = accFenceTime(cls, kind);
  if (!isFinite(need)) {
    if (runTime - (ACC.fenceHintT || -99) > 6) { ACC.fenceHintT = runTime; spawnSpeech(player.x, player.y - 26, kind === "hedge" ? "HEDGE TOO THICK — GO AROUND" : "TOO TALL TO CLIMB — USE A GATE", "#ffab40", 1.4); }
    return;
  }
  ACC.fpush = (ACC.fkind === kind ? ACC.fpush : 0) + dt; ACC.fkind = kind;
  if (ACC.fpush < need) return;
  ACC.fpush = 0;
  if (cls === "smash" && kind !== "stone") { accSmashFence(tx, ty, kind, dx, dy, mob); return; }
  // landing: first clear spot past the fence line
  let land = null;
  for (let s = 22; s <= 64 && !land; s += 6) { const lx = player.x + dx * s, ly = player.y + dy * s; if (!cityCircleBlocked(lx, ly, 7, false) && !accFenceKind(cityTX(lx), cityTY(ly))) land = [lx, ly]; }
  if (!land) return;
  const dur = accCrossDur(cls, kind, mob);
  ACC.cross = { x0: player.x, y0: player.y, x1: land[0], y1: land[1], t: 0, dur, cls, kind };
  if (cls === "tele") { for (let k = 0; k < 8; k++) spawnPt(player.x, player.y, (Math.random() - 0.5) * 80, (Math.random() - 0.5) * 80, 0.4, 2, 9, 4); if (typeof sfx === "function") sfx(1300, 500, 0.12, "sine", 0.06); }
  else if (cls === "jet" || cls === "leap" || cls === "giant") player.acrobatVZ = cls === "giant" ? 40 : 75;
  else player.acrobatVZ = 30;
  const loud = kind === "chain" ? 58 : kind === "wood" ? 52 : 40;
  if (typeof noiseEmit === "function") noiseEmit(player.x, player.y, cls === "tele" ? 30 : loud, "fence", 0);
  if (cls === "climb" || cls === "none") spawnSpeech(player.x, player.y - 24, kind === "picket" || kind === "stone" ? "VAULT" : "CLIMBING OVER", "#ffd166", 0.7);
  else if (!ACC.saidCross || runTime - ACC.saidCross > 8) { ACC.saidCross = runTime; spawnSpeech(player.x, player.y - 24, mob[1] + "!", "#80deea", 0.8); }
}
function accSmashFence(tx, ty, kind, dx, dy, mob) {
  const horiz = Math.abs(dy) > Math.abs(dx);   // walking north/south into a horizontal fence
  for (let d = -1; d <= 1; d++) cityRT.fenceBroken.add(cityKeyT(horiz ? tx + d : tx, horiz ? ty : ty + d));
  const lx = tx * 16 + 8 - CITY.orx, ly = ty * 16 + 8 - CITY.ory;
  if (typeof vehQueueRebuild === "function") vehQueueRebuild(tx, ty, lx, ly, 80); else cityRebuildAt(tx, ty);
  cityRT.visGen++;
  for (let q = 0; q < 10; q++) spawnPt(lx, ly, dx * 120 + (Math.random() - 0.5) * 140, dy * 120 + (Math.random() - 0.5) * 140, 0.6, 2.2, kind === "chain" ? 15 : 12, 3);
  if (typeof noiseEmit === "function") noiseEmit(lx, ly, 82, "crash", 0);
  if (typeof sfx === "function") sfx(260, 70, 0.14, "sawtooth", 0.09);
  spawnSpeech(player.x, player.y - 26, mob[1] + " — SMASH!", "#ff8a65", 0.9);
}

/* === 7. [F] PROMPTS: ladders, walls, edges =========================================================================== */
function accInteractTarget() {
  if (!player || player.inVehicle || ACC.climb || ACC.cross) return null;
  const mob = accMob(), cls = mob[0];
  const C = cityChunk(cityTX(player.x) >> 7, cityTY(player.y) >> 7);
  if (player.roof) {
    for (const b of accNearBuildings(260)) for (const q of accLadders(b)) if (Math.hypot(q.tx - player.x, q.ty - player.y) < 34) return { kind: "accDown", lad: q, x: q.tx, y: q.ty - 16, label: "[F] CLIMB DOWN 🪜" };
    // near an edge: drop (or leap) down
    for (const [ex, ey] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) if (!accRoofTile(player.x + ex * 22, player.y + ey * 22)) return { kind: "accDrop", dx: ex, dy: ey, x: player.x, y: player.y - 16, label: "[F] " + (cls === "none" || cls === "smash" ? "DROP DOWN (OUCH)" : cls === "climb" ? "CLIMB DOWN" : mob[1] + " DOWN") };
    return null;
  }
  if (cityBuildingAt(player.x, player.y)) return null;
  for (const b of accNearBuildings(220)) for (const q of accLadders(b)) if (Math.hypot(q.bx - player.x, q.by - player.y) < 30) return { kind: "accUp", b, lad: q, x: q.bx, y: q.by - 16, label: (crFam() === "scifi" ? "[F] GRAV-LIFT TO ROOF" : "[F] CLIMB LADDER TO ROOF 🪜") };
  if (cls !== "none" && cls !== "smash") {
    const w = accWallAhead();
    if (w && w.d < 22 && !accRoofBlocked(w.x, w.y, 6)) return { kind: "accUp", b: w.b, wall: w, x: player.x, y: player.y - 18, label: "[F] " + mob[1] + " ONTO ROOF" };
  }
  void C;
  return null;
}
function accNearBuildings(r) {
  const out = [], seen = new Set(), tx = cityTX(player.x), ty = cityTY(player.y), R = Math.ceil(r / 16);
  for (let cy = (ty - R) >> 7; cy <= (ty + R) >> 7; cy++) for (let cx = (tx - R) >> 7; cx <= (tx + R) >> 7; cx++) {
    const C = cityChunk(cx, cy);
    for (const b of C.blds) { if (seen.has(b.uid)) continue; seen.add(b.uid); const X = b.x * 16 - CITY.orx, Y = b.y * 16 - CITY.ory; if (player.x > X - r && player.x < X + b.w * 16 + r && player.y > Y - r && player.y < Y + b.h * 16 + r) out.push(b); }
  }
  return out;
}
function accInteract(t) {
  if (t.kind === "accUp") {
    if (t.lad) accClimbUp(t.b, t.lad.tx, t.lad.ty, "ladder");
    else accClimbUp(t.b, t.wall.x, t.wall.y, "wall");
    if (typeof noiseEmit === "function") noiseEmit(player.x, player.y, t.lad ? 50 : 44, "climb", 0);
    return true;
  }
  if (t.kind === "accDown") { accDropFromRoof(0, 0, t.lad); return true; }
  if (t.kind === "accDrop") { accDropFromRoof(t.dx, t.dy); return true; }
  return false;
}

/* === 8. GESTURES: double-tap a building = inside, triple-tap = roof (teleporters, leapers, flyers) =================== */
function accScreenToWorld(sx, sy) {
  const c = typeof fxCamOut !== "undefined" ? fxCamOut : { zoom: 1, fx: 0, fy: 0 }, z = (opts.zoom || 1) * (c.zoom || 1);
  return [player.x + (c.fx || 0) + (sx - W * 0.5) / z, player.y + (c.fy || 0) + (sy - H * 0.5) / z];
}
function accFloorNear(b, x, y) {   // a walkable floor tile of building b near (x, y)
  const G = b.int || cityInterior(b);
  let best = null, bd = 1e12;
  for (let cy = 0; cy < G.h; cy++) for (let cx = 0; cx < G.w; cx++) {
    const v = G.c[cy * G.w + cx]; if (v !== IC_FLOOR && v !== IC_DOOR) continue;
    const wx = (b.x + cx + 0.5) * 16 - CITY.orx, wy = (b.y + cy + 0.5) * 16 - CITY.ory, d = (wx - x) ** 2 + (wy - y) ** 2;
    if (d < bd && !cityCircleBlocked(wx, wy, 6, false)) { bd = d; best = [wx, wy]; }
  }
  return best;
}
function accGestureResolve(roof) {
  const G = ACC.gest; ACC.gest = null; if (!G) return;
  if (G.timer) clearTimeout(G.timer);
  if (!player || !runActive) return;
  const mob = accMob(), cls = mob[0], b = G.b, range = cls === "tele" ? 560 : cls === "jet" ? 440 : 380;
  const spec = typeof getHeroDashSpec === "function" ? getHeroDashSpec(player.cid) : { cd: 4 };
  const fx = (x, y, n) => { for (let k = 0; k < n; k++) spawnPt(x, y, (Math.random() - 0.5) * 120, (Math.random() - 0.5) * 120, 0.45, 2.2, cls === "tele" ? 9 : 7, 4); };
  if (roof) {
    let tx = G.wx, ty = G.wy;
    if (accRoofBlocked(tx, ty, 6)) { const X = b.x * 16 - CITY.orx, Y = b.y * 16 - CITY.ory; tx = Math.max(X + 20, Math.min(X + b.w * 16 - 20, tx)); ty = Math.max(Y + 20, Math.min(Y + b.h * 16 - 20, ty)); }
    const d = Math.hypot(tx - player.x, ty - player.y);
    if (d > range + Math.max(b.w, b.h) * 8) { spawnSpeech(player.x, player.y - 26, "TOO FAR — GET CLOSER", "#ffab40", 1.0); return; }
    if (cls === "tele") { fx(player.x, player.y, 10); player.x = tx; player.y = ty; fx(tx, ty, 10); accSetRoof(b); spawnSpeech(tx, ty - 26, mob[1] + " — ROOF", "#80deea", 1.0); if (typeof sfx === "function") sfx(1500, 260, 0.22, "sine", 0.08); }
    else { const k = Math.min(1, (range * 0.9) / Math.max(1, d)); accClimbUp(b, player.x + (tx - player.x) * Math.max(k, 0.98), player.y + (ty - player.y) * Math.max(k, 0.98), "leap"); }
    player.dashCD = spec.cd * (player.cdr || 1); player.dashMaxCD = player.dashCD;
    return;
  }
  // inside
  if (cls === "tele") {
    const dest = accFloorNear(b, G.wx, G.wy);
    if (!dest || Math.hypot(dest[0] - player.x, dest[1] - player.y) > range) { spawnSpeech(player.x, player.y - 26, dest ? "TOO FAR — GET CLOSER" : "NO ROOM IN THERE", "#ffab40", 1.0); return; }
    fx(player.x, player.y, 12); player.x = dest[0]; player.y = dest[1]; fx(dest[0], dest[1], 12);
    if (player.roof) accLeaveRoof();
    spawnSpeech(dest[0], dest[1] - 26, mob[1] + "!", "#80deea", 1.0);
    if (typeof sfx === "function") sfx(300, 1500, 0.2, "sine", 0.08);
    if (typeof noiseEmit === "function") noiseEmit(dest[0], dest[1], cls === "tele" && mob[1] === "APPARATE" ? 64 : 40, "apparate", 0);
  } else {   // leapers / flyers dive through the nearest window (or door) on your side
    const Gi = b.int || cityInterior(b);
    let best = null, bd = 1e12;
    for (let cy = 0; cy < Gi.h; cy++) for (let cx = 0; cx < Gi.w; cx++) {
      const v = Gi.c[cy * Gi.w + cx]; if (v !== IC_WIN && v !== IC_EDOOR) continue;
      const wx = (b.x + cx + 0.5) * 16 - CITY.orx, wy = (b.y + cy + 0.5) * 16 - CITY.ory, d = (wx - player.x) ** 2 + (wy - player.y) ** 2 + ((wx - G.wx) ** 2 + (wy - G.wy) ** 2) * 0.3;
      if (d < bd) { bd = d; best = { cx, cy, wx, wy, win: v === IC_WIN }; }
    }
    if (!best || Math.hypot(best.wx - player.x, best.wy - player.y) > range) { spawnSpeech(player.x, player.y - 26, "TOO FAR — GET CLOSER", "#ffab40", 1.0); return; }
    if (best.win) cityBreakWindow(b.x + best.cx, b.y + best.cy, true);
    const dest = accFloorNear(b, best.wx + (best.wx - player.x) * 0.15, best.wy + (best.wy - player.y) * 0.15) || [best.wx, best.wy];
    ACC.cross = { x0: player.x, y0: player.y, x1: dest[0], y1: dest[1], t: 0, dur: 0.45, cls, kind: "window" };
    player.acrobatVZ = 70;
    spawnSpeech(player.x, player.y - 26, best.win ? "THROUGH THE WINDOW!" : mob[1] + "!", "#80deea", 1.0);
  }
  player.dashCD = spec.cd * (player.cdr || 1); player.dashMaxCD = player.dashCD;
}
function accTapDown(e) {
  if (!runActive || runPaused || !CITY.on || !player) return;
  const now = performance.now(), x = e.clientX || 0, y = e.clientY || 0;
  ACC.taps.push({ t: now, x, y }); if (ACC.taps.length > 4) ACC.taps.shift();
  const G = ACC.gest;
  if (G && now - G.t < 340 && Math.hypot(x - G.sx, y - G.sy) < 80) { accGestureResolve(true); ACC.swallow = now; }
}

/* === 9. ENEMIES & THE ROOF ========================================================================================== */
function accRoofSeen(ex, ey) {
  // from inside a building nobody sees the roof; right below the wall you can't see a hero standing back from the edge
  const inB = cityBuildingAt(ex, ey);
  if (inB) return !!(ACC.roofSet && ACC.roofSet.has(inB.uid) && accEnemyAt(ex, ey));
  let near = false; for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const b = accRoofTile(ex + dx * 56, ey + dy * 56); if (b && ACC.roofSet && ACC.roofSet.has(b.uid)) near = true; }
  let back = true; for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) if (!accRoofTile(player.x + dx * 40, player.y + dy * 40)) back = false;
  if (near && back) return false;
  // tall fences / hedges still block; buildings don't (the hero is above them)
  let x0 = ex, y0 = ey;
  for (let k = 0; k < 6; k++) {
    const h = cityRay(x0, y0, player.x, player.y, F_SIGHT, 600);
    if (!h.hit) return true;
    if (!cityBldT(h.tx, h.ty)) return false;
    const len = Math.hypot(player.x - x0, player.y - y0) || 1;
    x0 = h.x + (player.x - x0) / len * 12; y0 = h.y + (player.y - y0) / len * 12;
  }
  return true;
}
function accEnemyAt(x, y) { if (!ACC.eRoof) return false; for (let j = 0; j < MAX_E; j++) if (eAct[j] && ACC.eRoof[j] && Math.abs(eX[j] - x) < 1 && Math.abs(eY[j] - y) < 1) return true; return false; }
function accEnemyOnRoof(j) { return !!(ACC.eRoof && ACC.eRoof[j]); }
// alert melee hunters head for a ladder and climb after you; up there they fight on the roof; when you leave, so do they
function accEnemyRoofStep(j, dt) {
  if (!ACC.eRoof) ACC.eRoof = new Uint8Array(MAX_E);
  if (!ACC.eClimb) ACC.eClimb = new Float32Array(MAX_E);
  if (ACC.eRoof[j]) {
    if (!player.roof) { ACC.eClimb[j] += dt; if (ACC.eClimb[j] > 1.2) { ACC.eRoof[j] = 0; ACC.eClimb[j] = 0; const q = cityFindWalkable(eX[j], eY[j], 300, true); eX[j] = q[0]; eY[j] = q[1]; } return 1; }
    const dx = player.x - eX[j], dy = player.y - eY[j], d = Math.hypot(dx, dy) || 1, spd = (eSpd[j] || 80) * (eSlow[j] > 0 ? 0.5 : 1);
    if (d > 14) { const nx = eX[j] + dx / d * spd * dt, ny = eY[j] + dy / d * spd * dt; if (!accRoofBlocked(nx, eY[j], 6)) eX[j] = nx; if (!accRoofBlocked(eX[j], ny, 6)) eY[j] = ny; eVX[j] = dx / d * spd; eVY[j] = dy / d * spd; }
    if (typeof ST !== "undefined" && ST.face) ST.face[j] = Math.atan2(dy, dx);
    return 2;
  }
  if (!player.roof || typeof ST === "undefined" || ST.state[j] !== 4 || ST.ranged[j] || eType[j] === 3 || eType[j] >= 98) return 0;
  if (Math.hypot(player.x - eX[j], player.y - eY[j]) > 1300) return 0;
  // nearest ladder of the roof the hero is on
  let lad = ACC.eLad && ACC.eLad[j];
  if (!lad || !ACC.roofSet || !ACC.roofSet.has(lad.uid)) {
    lad = null; let bd = 1e12;
    for (const b of accNearBuildings(900)) { if (!ACC.roofSet || !ACC.roofSet.has(b.uid)) continue; for (const q of accLadders(b)) { const d = Math.hypot(q.bx - eX[j], q.by - eY[j]); if (d < bd) { bd = d; lad = q; } } }
    if (!ACC.eLad) ACC.eLad = []; ACC.eLad[j] = lad;
  }
  if (!lad) return 0;
  const d = Math.hypot(lad.bx - eX[j], lad.by - eY[j]);
  if (d < 22) { ACC.eClimb[j] += dt; eVX[j] = eVY[j] = 0; if (ACC.eClimb[j] > 1.3) { ACC.eClimb[j] = 0; ACC.eRoof[j] = 1; eX[j] = lad.tx; eY[j] = lad.ty; if (typeof noiseEmit === "function") noiseEmit(lad.tx, lad.ty, 55, "climb", 1); } return 2; }
  stMove(j, lad.bx, lad.by, (eSpd[j] || 80), dt);
  return 2;
}

/* === 10. GARAGE DOORS: the opener when you get in, or straight through them ========================================== */
function cityAccessGarageOpen(b, v) {
  if (!b || cityRT.gopen.has(b.uid)) return;
  const G = b.int || cityInterior(b);
  if (!G.c.some(c => c === IC_GDOOR)) return;
  cityRT.gopen.add(b.uid);
  if (typeof vehQueueRebuild === "function") vehQueueRebuild(b.x + b.w / 2, b.y + b.h / 2, (b.x + b.w / 2) * 16 - CITY.orx, (b.y + b.h / 2) * 16 - CITY.ory, Math.max(b.w, b.h) * 16 + 40);
  cityRT.visGen++; ACC.ent.delete(b.uid);
  if (typeof sfx === "function") { sfx(90, 140, 0.9, "sawtooth", 0.05); }
  if (typeof noiseEmit === "function") noiseEmit((b.x + b.w / 2) * 16 - CITY.orx, (b.y + b.h / 2) * 16 - CITY.ory, 70, "garage", 0);
  if (player) spawnSpeech(player.x, player.y - 46, "GARAGE DOOR OPENING", "#80deea", 1.4);
}
function cityAccessGarageBreak(tx, ty, v) {
  const b = cityBldT(tx, ty); if (!b || cityRT.gopen.has(b.uid)) return;
  cityRT.gopen.add(b.uid); ACC.ent.delete(b.uid);
  const lx = tx * 16 + 8 - CITY.orx, ly = ty * 16 + 8 - CITY.ory;
  if (typeof vehQueueRebuild === "function") vehQueueRebuild(tx, ty, lx, ly, Math.max(b.w, b.h) * 16 + 40);
  cityRT.visGen++;
  for (let k = 0; k < 14; k++) spawnPt(lx, ly, v.vx * 0.4 + (Math.random() - 0.5) * 200, v.vy * 0.4 + (Math.random() - 0.5) * 200, 0.6, 2.4, 15, 3);
  const [l2x, l2y] = vehToLocal(v, lx, ly); vehDamage(v, l2x, l2y, Math.hypot(v.vx, v.vy) * 0.8, "crash", 0, 0, v.drv === "P" ? "player" : null);
  if (typeof noiseEmit === "function") noiseEmit(lx, ly, 100, "crash", v.drv === "P" ? 0 : 1);
  if (typeof sfx === "function") sfx(200, 50, 0.3, "sawtooth", 0.14);
}

/* === 11. ENGINE HOOKS ================================================================================================= */
function accTipOnce(k, html) {
  if (typeof meta === "undefined") return;
  meta.accTips = meta.accTips || {}; if (meta.accTips[k]) return;
  meta.accTips[k] = 1; if (typeof saveMeta === "function") saveMeta();
  if (typeof cityTip === "function") cityTip(html, 7);
}
// v14.1 eye height: who looks over a 6-ft fence? Tall cabs (bus, army truck, fire engine, semi, tractor, APC hatch,
// stagecoach box), a jetpack in flight, the half-giant, and anyone at the top of a leap. Vision AND being seen both use it.
const VEH_TALL = new Set(["bus", "armytruck", "firetruck", "semi", "tractor", "apc", "rhino", "coach", "wagon"]);
function accEyeHigh() {
  if (!player || !CITY.on || player.roof) return false;
  if (player.inVehicle) return !!(typeof VEH !== "undefined" && VEH.me && VEH_TALL.has(VEH.me.kind));
  return !!(player.flying || accMob()[0] === "giant" || (player.acrobatZ || 0) > 12);   // 12 px: fence vaults / Force leaps yes, saber hops (6) and dashes (11) no
}
// line of sight that ignores ~2 m obstacles (fences, hedges, stone walls) — used when the hero's head is above them
function accLOSHigh(x0, y0, x1, y1) {
  let ax = x0, ay = y0;
  for (let k = 0; k < 8; k++) {
    const h = cityRay(ax, ay, x1, y1, F_SIGHT, 900);
    if (!h.hit) return true;
    if (!K_LOWSIGHT[h.k]) return false;
    const L = Math.hypot(x1 - ax, y1 - ay) || 1, ux = (x1 - ax) / L, uy = (y1 - ay) / L;
    ax = h.x + ux * 18; ay = h.y + uy * 18;
    if ((x1 - ax) * ux + (y1 - ay) * uy <= 0) return true;
  }
  return false;
}
(function accPatch() {
  // gestures (the double-tap dash detector in js/ui.js calls executeHeroDash; we look at the taps first)
  if (typeof cv !== "undefined") cv.addEventListener("pointerdown", accTapDown);
  const _ehd = window.executeHeroDash;
  if (typeof _ehd === "function") window.executeHeroDash = function (tx, ty) {
    if (!CITY.on || !player || player.inVehicle) return _ehd(tx, ty);
    const now = performance.now(), T = ACC.taps, last = T[T.length - 1];
    if (!last || now - last.t > 60 || T.length < 2 || now - (ACC.swallow || 0) < 400) return ACC.swallow && now - ACC.swallow < 400 ? true : _ehd(tx, ty);
    const [wx, wy] = accScreenToWorld(last.x, last.y), cls = accMob()[0];
    const b = cityBldT(cityTX(wx), cityTY(wy));
    if (player.roof && !b) {   // tap the street from a roof: mobile heroes go straight down there
      if (cls === "tele" || cls === "jet" || cls === "leap") { const q = cityFindWalkable(wx, wy, 100, true); if (Math.hypot(q[0] - player.x, q[1] - player.y) < 420) { accLeaveRoof(); ACC.climb = { t: 0, dur: cls === "tele" ? 0.2 : 0.45, x0: player.x, y0: player.y, x1: q[0], y1: q[1], down: true }; player.acrobatVZ = cls === "tele" ? 0 : 70; return true; } }
      return _ehd(tx, ty);
    }
    if (!b || !(cls === "tele" || cls === "jet" || cls === "leap") || cityBuildingAt(player.x, player.y) === b) return _ehd(tx, ty);
    if (ACC.gest && ACC.gest.timer) clearTimeout(ACC.gest.timer);
    ACC.gest = { b, wx, wy, sx: last.x, sy: last.y, t: now, timer: setTimeout(() => accGestureResolve(false), 330) };
    ACC.reticle = { x: wx, y: wy, t: runTime, txt: cls === "tele" ? "IN  ·  tap again = ROOF" : "WINDOW  ·  tap again = ROOF" };
    return true;
  };
  // [F] prompts
  const _fit = window.findInteractTarget, _twi = window.triggerWorldInteract;
  if (typeof _fit === "function") window.findInteractTarget = function () {
    const t = _fit();
    if (!CITY.on || !player) return t;
    if (t && (t.kind === "cityCar" || t.kind === "exitVeh")) return t;
    return accInteractTarget() || t;
  };
  if (typeof _twi === "function") window.triggerWorldInteract = function () {
    if (CITY.on && player && !player.inVehicle) { const t = findInteractTarget(); if (t && t.kind && t.kind.startsWith("acc")) { accInteract(t); return; } }
    return _twi();
  };
  // line of sight to a hero on a roof
  if (typeof cityLOS === "function") {
    const _los = cityLOS;
    window.cityLOS = function (x0, y0, x1, y1) {
      if (player && player.roof && CITY.on) { if (x1 === player.x && y1 === player.y) return accRoofSeen(x0, y0); if (x0 === player.x && y0 === player.y) return accRoofSeen(x1, y1); }
      if (ACC.eyeHi && player && ((x1 === player.x && y1 === player.y) || (x0 === player.x && y0 === player.y))) return accLOSHigh(x0, y0, x1, y1);   // a head above the fence sees — and is seen
      return _los(x0, y0, x1, y1);
    };
  }
  // vision from a roof: nothing at your height blocks it, and you see 25 % further
  if (typeof cityComputeVis === "function") {
    const _ccv = cityComputeVis;
    window.cityComputeVis = function (radiusTiles) {
      if (!(player && player.roof && CITY.on)) return _ccv(radiusTiles);
      const R = Math.max(8, Math.min(90, Math.round(radiusTiles * 1.25))), N = R * 2 + 1;
      if (!cityVis.grid || cityVis.n !== N) { cityVis.grid = new Uint8Array(N * N); cityVis.n = N; }
      const ptx = cityTX(player.x), pty = cityTY(player.y), Gd = cityVis.grid;
      cityVis.r = R; cityVis.ox = ptx - R; cityVis.oy = pty - R;
      for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) { const dx = i - R, dy = j - R; Gd[j * N + i] = dx * dx + dy * dy <= R * R ? 255 : 0; }
      cityVis.roof.clear();
      for (let cy = (cityVis.oy) >> 7; cy <= (cityVis.oy + N) >> 7; cy++) for (let cx = (cityVis.ox) >> 7; cx <= (cityVis.ox + N) >> 7; cx++) { const C = cityChunk(cx, cy); for (const b of C.blds) cityVis.roof.add(b.uid); }
      cityVis.pBid = null; cityVis.gen = cityRT.visGen; cityVis.px = player.x; cityVis.py = player.y; cityVis.stamp = (cityVis.stamp || 0) + 1;
      return cityVis;
    };
  }
  if (typeof isEnemyOnScreen === "function") {
    const _ieos = window.isEnemyOnScreen;
    window.isEnemyOnScreen = function (j) { if (player && player.roof && ACC.eRoof && ACC.eRoof[j] && eAct[j]) return Math.abs(eX[j] - player.x) < W && Math.abs(eY[j] - player.y) < H; return _ieos(j); };
  }
  if (typeof stealthEnemyStep === "function") {
    const _ses = stealthEnemyStep;
    window.stealthEnemyStep = function (j, dt) { if ((player && player.roof) || (ACC.eRoof && ACC.eRoof[j])) { const r = accEnemyRoofStep(j, dt); if (r) return r; } return _ses(j, dt); };
  }
  if (typeof stHeroVisMul === "function") {
    const _vm = stHeroVisMul;
    window.stHeroVisMul = function () { let m = _vm(); if (player && player.roof && typeof ST !== "undefined" && ST.sneak) m *= 0.6; return m; };
  }
  // shots fired from or at a roof clear the walls of that roof's buildings
  if (typeof cityProjWall === "function") {
    const _cpw = window.cityProjWall;
    window.cityProjWall = function (i, dt) {
      if (player && player.roof && ACC.roofSet && CITY.on) {
        const x1 = pX[i], y1 = pY[i], x0 = x1 - pVX[i] * dt, y0 = y1 - pVY[i] * dt, h = cityRay(x0, y0, x1, y1, F_SHOT | F_WIN, 48);
        if (h.hit) { const b = cityBldT(h.tx, h.ty); if (b && ACC.roofSet.has(b.uid)) return false; }
      }
      return _cpw(i, dt);
    };
  }
})();
function accReset() {
  ACC.eyeHi = false;
  ACC.ent.clear(); ACC.lad.clear(); ACC.roofSet = null; ACC.cross = null; ACC.climb = null; ACC.gest = null; ACC.push = 0; ACC.fpush = 0; ACC.drawnRoofs.clear();
  if (ACC.eRoof) ACC.eRoof.fill(0); if (ACC.eClimb) ACC.eClimb.fill(0); ACC.eLad = [];
  if (player) player.roof = null;
}
V10.onRunStart.push(() => {
  accReset();
  if (!CITY.on || !player) return;
  const mob = accMob(), cid = player.cid;
  setTimeout(() => { if (runActive && CITY.on && player && player.cid === cid) accTipOnce("mob_" + mob[0], "🧗 <b>" + mob[1] + "</b> — " + ACC_MOB_DESC[mob[0]] + "."); }, 26000);
});
V10.onRunReset.push(accReset);
V10.onStep.push((dt) => {
  if (!CITY.on || !player) return;
  const hi = accEyeHigh();
  if (hi !== !!ACC.eyeHi) {
    ACC.eyeHi = hi; cityRT.visGen++;
    if (hi && (player.inVehicle || player.flying || accMob()[0] === "giant")) accTipOnce("eyehi", "👁 <b>Eyes above the fences</b> — from a tall cab, a jetpack or a giant's height you see over privacy fences, hedges and stone walls (and can be seen).");
  }
  if (!accClimbStep(dt)) accFenceStep(dt);
  if (player.roof && !player.inVehicle && !accRoofTile(player.x, player.y) && !ACC.climb) accLeaveRoof();   // knocked off / teleported away
  if (player.inVehicle && player.roof) accLeaveRoof();
});
// EOF:js/cityaccess.js
