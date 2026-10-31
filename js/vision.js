/* =========================================================================
   OMNI-SHIFT v14 — PER-HERO VISION
   Everyone sees the world through a line-of-sight "vision sphere": what is
   behind a wall or a closed door is greyed out and you have to move to see
   it. On top of that every hero perceives hidden enemies in their OWN way —
   and most cannot see through walls at all:
     Jedi feel faint blue presences (Sith: red) but not droids · the Predator
     sees green, see-through, particle-ized apparitions · Mandalorians read
     heat · the T-800 boxes targets in red · Colonial Marines hear a motion
     tracker ping · Samus and Moody see straight through walls up close ·
     Neo reads the code · Harry's Marauder's Map shows labelled footprints ·
     Paul and River get prescient flashes · Geralt follows scent trails ·
     John Wick, Rambo, Chewie hear footsteps as ripples · Jayne just has a
     long scope (bigger sphere, no wall sense) · a few see nothing extra.
   Senses are visual only: you still can't shoot through walls.
   ========================================================================= */
"use strict";

// mode, colour, range (m), label, sphere radius (tiles)
const VIS_HERO = {
  0: ["aura", "#4fc3ff", 22, "FORCE SENSE", 54], 1: ["thermal", "#ff7043", 16, "BESKAR THERMAL", 54], 2: ["ir", "#ff5252", 12, "TROOPER HUD", 50],
  3: ["aura", "#ff1744", 26, "DARK SIDE SENSE", 54], 4: ["tracker", "#4fc3ff", 30, "ASTROMECH SCANNER", 48], 5: ["keen", "#ffe0b2", 20, "WOOKIEE SENSES", 52],
  6: ["precog", "#ffd54f", 24, "BAD FEELING", 56], 7: ["pulse", "#ffd166", 34, "KARA KESH SCAN", 54], 8: ["keen", "#c5e1a5", 16, "SPEC-OPS INSTINCT", 56],
  9: ["aura", "#ffd166", 14, "SYMBIOTE SENSE", 54], 10: ["pulse", "#80deea", 42, "ASGARD SENSORS", 56], 11: ["telepathy", "#b388ff", 30, "HIVE MIND", 52],
  12: ["aura", "#fff8e1", 24, "ORI SIGHT", 54], 13: ["keen", "#d7ccc8", 12, "BROWNCOAT GUT", 54], 14: ["precog", "#ce93d8", 28, "READER", 56],
  15: ["scope", "#ffcc80", 0, "VERA'S SCOPE", 74], 16: ["tracker", "#80cbc4", 32, "SERENITY SENSORS", 52], 17: ["keen", "#ff5252", 22, "BLOOD SCENT", 52],
  18: ["precog", "#ffb74d", 30, "PRESCIENCE", 56], 19: ["ir", "#ffab40", 14, "SARDAUKAR DISCIPLINE", 54], 20: ["telepathy", "#ea80fc", 22, "TRUTHSENSE", 54],
  21: ["thermal", "#ff8a65", 18, "HARKONNEN OPTICS", 52], 22: ["pulse", "#4fc3ff", 30, "TRICORDER", 52], 23: ["hive", "#76ff03", 30, "COLLECTIVE LINK", 52],
  24: ["keen", "#ffab91", 18, "KLINGON SENSES", 54], 25: ["tracker", "#ff8a65", 34, "DRADIS", 52], 26: ["ir", "#ff1744", 22, "CENTURION SCAN", 54],
  27: ["pulse", "#ff9100", 28, "OMNI-TOOL SCAN", 54], 28: ["tracker", "#b2ff59", 30, "MOTION TRACKER", 52], 29: ["particles", "#69f0ae", 28, "BIO-MASK THERMAL", 56],
  30: ["hive", "#c6ff00", 26, "PHEROMONE SENSE", 52], 31: ["tracker", "#ffe082", 30, "BUG RADAR", 52], 32: ["tracker", "#80d8ff", 30, "MOTION TRACKER", 54],
  33: ["ir", "#69f0ae", 16, "PRAETOR HUD", 54], 34: ["tracker", "#ff8a80", 30, "AUSPEX", 52], 35: ["pulse", "#ff5252", 32, "MECHANICUS AUSPEX", 54],
  36: ["ir", "#00e676", 20, "GAUSS SIGHT", 56], 37: ["rage", "#ff1744", 8, "WAAAGH! RAGE", 50], 38: ["telepathy", "#b388ff", 26, "PSYKER SIGHT", 54],
  39: ["code", "#ffd54f", 30, "THE CODE", 58], 40: ["ir", "#ff1744", 22, "T-800 HUD", 58], 41: ["pulse", "#80deea", 26, "ESPER SCAN", 54],
  42: ["ir", "#ffea00", 18, "KIROSHI OPTICS", 56], 43: ["tracker", "#69f0ae", 28, "PIP-BOY RADAR", 52], 44: ["keen", "#ffcc80", 18, "ROAD WARRIOR", 54],
  45: ["keen", "#ffb74d", 14, "HEV SENSORS", 54], 46: ["pulse", "#69f0ae", 26, "SONIC SWEEP", 54], 47: ["xray", "#80d8ff", 14, "X-RAY VISOR", 54],
  48: ["witcher", "#ff5252", 22, "WITCHER SENSES", 54], 49: ["telepathy", "#76ff03", 24, "ELDRITCH SIGHT", 52], 50: ["keen", "#e0e0e0", 16, "RONIN FOCUS", 56],
  51: ["keen", "#ffffff", 18, "BABA YAGA FOCUS", 56], 52: ["scope", "#ffd180", 0, "GUNSLINGER EYES", 70], 53: ["keen", "#c5e1a5", 22, "JUNGLE SENSES", 56],
  54: ["thermal", "#ff7043", 18, "MANDALORIAN THERMAL", 54], 55: ["ir", "#ffea00", 20, "CYBORG OPTICS", 54], 56: ["footprints", "#5d4037", 40, "MARAUDER'S MAP", 52],
  57: ["pulse", "#ffd54f", 26, "HOMENUM REVELIO", 52], 58: ["keen", "#ffab91", 14, "WEASLEY HUNCH", 52], 59: ["aura", "#e1bee7", 20, "WRACKSPURT SENSE", 52],
  60: ["pulse", "#ffeb3b", 22, "POINT ME", 52], 61: ["keen", "#bcaaa4", 20, "GAMEKEEPER TRACKING", 52], 62: ["keen", "#b0bec5", 14, "SLYTHERIN CUNNING", 52],
  63: ["footprints", "#5d4037", 40, "MARAUDER'S MAP", 52], 64: ["footprints", "#5d4037", 40, "MARAUDER'S MAP", 52], 65: ["xray", "#80d8ff", 14, "MAGICAL EYE", 54],
  66: ["keen", "#c5e1a5", 18, "ANIMAGUS EARS", 52], 67: ["telepathy", "#1de9b6", 22, "LEGILIMENCY", 52], 68: ["telepathy", "#ff4081", 20, "FEAR SCENT", 52],
  69: ["xray", "#e1f5fe", 18, "ALBUS' SIGHT", 56], 70: ["telepathy", "#00e676", 26, "LEGILIMENCY", 54], 71: ["aura", "#ffffff", 24, "ISTARI SIGHT", 56],
  72: ["pulse", "#ff7043", 36, "PALANTÍR", 56], 73: ["xray", "#69f0ae", 16, "ASTRAL SIGHT", 56], 74: ["telepathy", "#ff1744", 24, "CHAOS MIND", 54],
  75: ["aura", "#b2ff59", 22, "SENSE THE LIVING", 52], 76: ["aura", "#ff1744", 24, "DARK SIDE SENSE", 54], 77: ["aura", "#ff5252", 22, "DARK SIDE SENSE", 54],
  78: ["aura", "#b388ff", 22, "SHATTERPOINT", 54], 79: ["aura", "#69f0ae", 30, "FORCE SENSE", 58]
};
const VIS_DESC = {
  none: "plain eyes — what's behind a wall stays hidden", scope: "a longer sight line, no wall sense", aura: "living beings glow faintly behind walls (droids don't)",
  particles: "hidden prey appears as green, see-through particle ghosts", thermal: "warm bodies glow through walls up close", ir: "targets behind cover get boxed with range",
  tracker: "anything MOVING nearby pings — stand-still enemies vanish", pulse: "a scan ring every few seconds outlines what it crosses",
  xray: "see straight through walls up close", code: "hidden enemies show as falling code", footprints: "footprints and names on the Marauder's Map",
  precog: "flashes of whoever is about to find you", witcher: "scent trails and heat of nearby foes", telepathy: "minds pulse through walls",
  hive: "a link line to every enemy in range", keen: "footsteps behind walls ripple like sound", rage: "only the closest foes, through a red haze"
};
const VIS = { trails: new Map(), ripples: [], pulseT: 0, pulseR: 0, pulseOn: false, reveal: new Float32Array(MAX_E), rippleT: new Float32Array(MAX_E), pingT: 0, lastFlash: 0 };
function visionProfile(cid) {
  if (cid === CUSTOM_CID && typeof customCityUniverse === "function") { const u = customCityUniverse(); if (u && u.vision && VIS_HERO[u.vision]) return VIS_HERO[u.vision]; }
  return VIS_HERO[cid] || ["none", "#ffffff", 0, "HUMAN EYES", 52];
}
function visionRadiusTiles(cid) { const p = visionProfile(cid); let r = p[4] || 52; if (CITY.theme && CITY.theme.dark > 0.35 && p[0] !== "ir" && p[0] !== "thermal" && p[0] !== "particles") r -= 6; return r; }
function visionStealthMul() { return player && player.cid === 29 ? 0.75 : 1; }   // the Predator's cloak shimmer
function visLiving(j) { const s = typeof enemySpec === "function" ? enemySpec(eType[j]) : null; return !s || (s.b !== "r" && s.b !== "k" && s.b !== "f"); }

/* --- per-frame bookkeeping ------------------------------------------------------- */
function visionStep(dt) {
  if (!CITY.on || !player) return;
  const p = visionProfile(player.cid), mode = p[0], R = p[2] * 32;
  for (let j = 0; j < MAX_E; j++) if (VIS.reveal[j] > 0) VIS.reveal[j] -= dt;
  if (mode === "pulse") {   // a scan ring every 6 s; enemies it crosses stay outlined for 1.6 s
    VIS.pulseT -= dt;
    if (VIS.pulseT <= 0) { VIS.pulseT = 6; VIS.pulseR = 0; VIS.pulseOn = true; if (typeof sfx === "function") sfx(880, 1320, 0.09, "sine", 0.05); }
    if (VIS.pulseOn) {
      const r0 = VIS.pulseR; VIS.pulseR += dt * R * 1.4;
      for (let j = 0; j < MAX_E; j++) { if (!eAct[j]) continue; const d = Math.hypot(eX[j] - player.x, eY[j] - player.y); if (d >= r0 && d < VIS.pulseR && d < R) VIS.reveal[j] = 1.6; }
      if (VIS.pulseR > R) VIS.pulseOn = false;
    }
  }
  if (mode === "keen" || mode === "tracker" || mode === "footprints" || mode === "witcher") {
    for (let j = 0; j < MAX_E; j++) {
      if (!eAct[j]) continue;
      const moving = Math.hypot(eVX[j], eVY[j]) > 8;
      const d = Math.hypot(eX[j] - player.x, eY[j] - player.y);
      if (d > R) continue;
      VIS.rippleT[j] -= dt;
      if (VIS.rippleT[j] > 0) continue;
      if (mode === "keen" && moving && !cityVisibleAt(eX[j], eY[j])) { VIS.rippleT[j] = 0.5 + Math.random() * 0.2; VIS.ripples.push({ x: eX[j], y: eY[j], t: runTime, big: (typeof ST !== "undefined" && ST.flash[j] > 0) }); }
      if ((mode === "footprints" || mode === "witcher") && moving) {
        VIS.rippleT[j] = mode === "footprints" ? 0.45 : 0.25;
        let tr = VIS.trails.get(eUid[j]); if (!tr) { tr = []; VIS.trails.set(eUid[j], tr); }
        tr.push({ x: eX[j], y: eY[j], t: runTime, a: Math.atan2(eVY[j], eVX[j]), s: tr.length & 1 });
        if (tr.length > (mode === "footprints" ? 10 : 16)) tr.shift();
      }
    }
    if (VIS.ripples.length > 60) VIS.ripples.splice(0, VIS.ripples.length - 60);
    if (VIS.trails.size > 160) VIS.trails.clear();
  }
  if (mode === "tracker") {   // the classic ping
    VIS.pingT -= dt;
    if (VIS.pingT <= 0) {
      let nearest = 1e9;
      for (let j = 0; j < MAX_E; j++) if (eAct[j] && Math.hypot(eVX[j], eVY[j]) > 8) nearest = Math.min(nearest, Math.hypot(eX[j] - player.x, eY[j] - player.y));
      VIS.pingT = nearest < R ? 0.35 + 1.1 * (nearest / R) : 1.6;
      if (nearest < R && typeof sfx === "function") sfx(1650, 1600, 0.05, "sine", 0.035);
    }
  }
}

/* --- drawing ---------------------------------------------------------------------- */
function visSilhouette(g, x, y, col, a, sc) {
  g.globalAlpha = a; g.fillStyle = col;
  g.beginPath(); g.ellipse(x, y + 1, 6 * sc, 7.5 * sc, 0, 0, 7); g.fill();
  g.beginPath(); g.arc(x, y - 9 * sc, 4.2 * sc, 0, 7); g.fill();
  g.globalAlpha = 1;
}
function visionRenderWorld(g) {
  if (!CITY.on || !player) return;
  const p = visionProfile(player.cid), mode = p[0], col = p[1], R = p[2] * 32, t = runTime;
  if (mode === "none" || mode === "scope") return;
  if (mode === "pulse" && VIS.pulseOn) { g.save(); g.strokeStyle = col; g.globalAlpha = 0.5 * (1 - VIS.pulseR / R); g.lineWidth = 2.5; g.beginPath(); g.arc(player.x, player.y, VIS.pulseR, 0, 7); g.stroke(); g.restore(); }
  if (mode === "keen") {
    for (const r of VIS.ripples) { const k = (t - r.t) / 0.9; if (k > 1) continue; g.strokeStyle = col; g.globalAlpha = 0.55 * (1 - k); g.lineWidth = r.big ? 2.2 : 1.4; g.beginPath(); g.arc(r.x, r.y, (r.big ? 26 : 10) + k * (r.big ? 34 : 18), 0, 7); g.stroke(); }
    g.globalAlpha = 1; return;
  }
  if (mode === "footprints") {   // Marauder's Map ink
    for (let j = 0; j < MAX_E; j++) {
      if (!eAct[j]) continue;
      const d = Math.hypot(eX[j] - player.x, eY[j] - player.y);
      if (d > R) continue;
      const tr = VIS.trails.get(eUid[j]);
      g.fillStyle = "rgba(60,36,20,0.75)";
      if (tr) for (const f of tr) { const age = t - f.t; if (age > 5) continue; g.save(); g.translate(f.x + Math.cos(f.a + 1.57) * (f.s ? 3 : -3), f.y + Math.sin(f.a + 1.57) * (f.s ? 3 : -3)); g.rotate(f.a); g.globalAlpha = 0.7 * (1 - age / 5); g.beginPath(); g.ellipse(0, 0, 2.6, 1.3, 0, 0, 7); g.fill(); g.restore(); }
      if (!cityVisibleAt(eX[j], eY[j])) {
        const nm = typeof enemySpec === "function" ? enemySpec(eType[j]).n : "Hostile";
        g.save(); g.font = "italic 700 9px Georgia, serif"; g.textAlign = "center"; g.globalAlpha = 0.85;
        const w = g.measureText(nm).width + 8; g.fillStyle = "rgba(240,226,190,0.9)"; g.fillRect(eX[j] - w / 2, eY[j] - 22, w, 11);
        g.fillStyle = "#3e2723"; g.fillText(nm, eX[j], eY[j] - 13.5); g.restore();
      }
    }
    g.globalAlpha = 1; return;
  }
  for (let j = 0; j < MAX_E; j++) {
    if (!eAct[j] || eDummy[j]) continue;
    const dx = eX[j] - player.x, dy = eY[j] - player.y, d = Math.hypot(dx, dy);
    if (d > R || cityVisibleAt(eX[j], eY[j])) continue;
    const k = 1 - d / R, x = eX[j], y = eY[j], sc = eType[j] === 3 ? 1.3 : 1;
    switch (mode) {
      case "aura": {
        if (!visLiving(j)) break;   // droids have no presence in the Force
        const pulse = 0.5 + 0.5 * Math.sin(t * 2.4 + j);
        if (typeof erGlow === "function") erGlow(g, x, y - 3, 17 + pulse * 6, col, 0.22 + 0.22 * k);
        if (player.cid === 78 && k > 0.3) { g.strokeStyle = col; g.globalAlpha = 0.6; g.lineWidth = 1; g.beginPath(); g.moveTo(x - 4, y - 6); g.lineTo(x + 2, y - 1); g.lineTo(x - 1, y + 3); g.stroke(); g.globalAlpha = 1; }
        break;
      }
      case "particles": {   // Predator: green, see-through, particle-ized apparition
        if (typeof erGlow === "function") erGlow(g, x, y - 3, 20 * sc, col, 0.12 + 0.12 * k);
        visSilhouette(g, x, y, col, 0.2 + 0.2 * k, sc);
        g.fillStyle = col;
        for (let q = 0; q < 30; q++) {
          const h = (j * 131 + q * 71 + Math.floor(t * 14 + q * 0.37)) % 997, head = q < 8;
          const ang = (h % 360) * 0.01745, rr = (head ? (h % 5) : (h % 9)) * sc;
          g.globalAlpha = 0.4 + 0.5 * ((h % 7) / 7);
          const px2 = x + Math.cos(ang) * rr * (head ? 0.9 : 0.75), py2 = (head ? y - 9 * sc : y) + Math.sin(ang) * rr * (head ? 0.9 : 1.1) - (t * 6 + q) % 3;
          g.fillRect(px2, py2, 1.8, 1.8);
        }
        g.globalAlpha = 1;
        break;
      }
      case "thermal": {
        if (!visLiving(j)) { visSilhouette(g, x, y, "#5c6bc0", 0.2 * k + 0.05, sc); break; }
        const gr = g.createRadialGradient(x, y - 3, 1, x, y - 3, 13 * sc); gr.addColorStop(0, "rgba(255,241,118," + (0.55 * k + 0.15) + ")"); gr.addColorStop(0.5, "rgba(255,112,67," + (0.4 * k + 0.1) + ")"); gr.addColorStop(1, "rgba(183,28,28,0)");
        g.fillStyle = gr; g.beginPath(); g.ellipse(x, y - 3, 10 * sc, 14 * sc, 0, 0, 7); g.fill();
        break;
      }
      case "ir": {
        g.strokeStyle = col; g.globalAlpha = 0.45 + 0.4 * k; g.lineWidth = 1.2; const s = 12 * sc;
        g.beginPath(); for (const [ax, ay] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) { g.moveTo(x + ax * s, y - 3 + ay * s - ay * 5); g.lineTo(x + ax * s, y - 3 + ay * s); g.lineTo(x + ax * s - ax * 5, y - 3 + ay * s); } g.stroke();
        g.font = "700 7px monospace"; g.fillStyle = col; g.textAlign = "left"; g.fillText(Math.round(d / 32) + "M", x + s + 2, y - s);
        g.globalAlpha = 1;
        break;
      }
      case "tracker": {
        if (Math.hypot(eVX[j], eVY[j]) < 8) break;   // motion trackers only see movement
        const ph = (t * 1.6 + j * 0.13) % 1;
        g.fillStyle = col; g.globalAlpha = 0.85; g.beginPath(); g.arc(x, y, 3, 0, 7); g.fill();
        g.strokeStyle = col; g.globalAlpha = 0.5 * (1 - ph); g.lineWidth = 1; g.beginPath(); g.arc(x, y, 3 + ph * 14, 0, 7); g.stroke(); g.globalAlpha = 1;
        break;
      }
      case "pulse": {
        if (VIS.reveal[j] <= 0) break;
        g.strokeStyle = col; g.globalAlpha = Math.min(1, VIS.reveal[j]) * 0.8; g.lineWidth = 1.4;
        g.beginPath(); g.ellipse(x, y + 1, 6 * sc, 7.5 * sc, 0, 0, 7); g.moveTo(x + 4.2 * sc, y - 9 * sc); g.arc(x, y - 9 * sc, 4.2 * sc, 0, 7); g.stroke(); g.globalAlpha = 1;
        break;
      }
      case "xray": {   // see straight through walls up close
        if (typeof drawEnemyDetailed === "function") { g.save(); g.globalAlpha = 0.35 + 0.35 * k; drawEnemyDetailed(j, x, y, eType[j] === 3 ? 15 : 11, false, false, false, false, g); g.restore(); }
        g.strokeStyle = col; g.globalAlpha = 0.35; g.lineWidth = 1; g.beginPath(); g.arc(x, y - 2, 16 * sc, 0, 7); g.stroke(); g.globalAlpha = 1;
        break;
      }
      case "code": {   // the Matrix: falling glyph columns in the shape of a body
        g.fillStyle = col; g.font = "700 6px monospace"; g.textAlign = "center";
        for (let c2 = -2; c2 <= 2; c2++) for (let r2 = -3; r2 <= 2; r2++) { const h = (j * 977 + c2 * 131 + r2 * 31 + Math.floor(t * 9 + c2)) % 23; if (Math.abs(c2) === 2 && (r2 < -2 || r2 > 1)) continue; g.globalAlpha = (0.2 + 0.6 * k) * ((h % 4) / 4 + 0.25); g.fillText(String.fromCharCode(0x30A0 + h * 3), x + c2 * 3.6, y + r2 * 5.4); }
        g.globalAlpha = 1;
        break;
      }
      case "precog": {   // prescient flashes: who is about to find you
        const aware = typeof ST !== "undefined" && (ST.sus[j] > 0.1 || ST.state[j] >= 2);
        const flash = Math.sin(t * 3.1 + j * 1.7) > 0.86 || aware;
        if (!flash) break;
        visSilhouette(g, x + eVX[j] * 0.6, y + eVY[j] * 0.6, col, aware ? 0.38 : 0.18, sc);
        break;
      }
      case "witcher": {
        const tr = VIS.trails.get(eUid[j]);
        if (tr) for (const f of tr) { const age = t - f.t; if (age > 4) continue; g.fillStyle = "rgba(255,40,40," + (0.22 * (1 - age / 4)) + ")"; g.beginPath(); g.arc(f.x, f.y, 6, 0, 7); g.fill(); }
        if (typeof erGlow === "function") erGlow(g, x, y - 3, 12, "#ff1744", 0.3 * k + 0.1);
        break;
      }
      case "telepathy": {
        if (!visLiving(j)) break;
        const pulse = (t * 0.9 + j * 0.21) % 1;
        g.strokeStyle = col; g.lineWidth = 1.2; g.globalAlpha = (0.55 * k + 0.15) * (1 - pulse); g.beginPath(); g.arc(x, y - 9, 3 + pulse * 12, 0, 7); g.stroke();
        g.globalAlpha = 0.5 * k + 0.2; g.fillStyle = col; g.beginPath(); g.arc(x, y - 9, 2.2, 0, 7); g.fill(); g.globalAlpha = 1;
        break;
      }
      case "hive": {
        g.strokeStyle = col; g.globalAlpha = 0.25 + 0.3 * k; g.lineWidth = 0.8; g.beginPath(); g.moveTo(player.x, player.y); g.lineTo(x, y); g.stroke();
        g.fillStyle = col; g.globalAlpha = 0.6; g.fillRect(x - 2.5, y - 2.5, 5, 5); g.globalAlpha = 1;
        break;
      }
      case "rage": { visSilhouette(g, x, y, col, 0.35 * k + 0.1, sc); break; }
    }
  }
}
function visionRenderScreen(g) {
  if (!CITY.on || !player || !runActive) return;
  const p = visionProfile(player.cid);
  if (p[0] === "rage") { const gr = g.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.3, W / 2, H / 2, Math.max(W, H) * 0.7); gr.addColorStop(0, "rgba(255,0,0,0)"); gr.addColorStop(1, "rgba(160,0,0,0.18)"); g.fillStyle = gr; g.fillRect(0, 0, W, H); }
  if (p[0] === "ir") { g.fillStyle = p[1] === "#ff1744" ? "rgba(255,0,0,0.035)" : "rgba(0,0,0,0)"; g.fillRect(0, 0, W, H); }
}
V10.onStep.push((dt) => { if (CITY.on) visionStep(dt); });
V10.onRenderWorld.push((g) => { if (CITY.on) visionRenderWorld(g); });
V10.onRenderScreen.push((g) => { if (CITY.on) visionRenderScreen(g); });
V10.onRunStart.push(() => { VIS.trails.clear(); VIS.ripples.length = 0; VIS.pulseT = 2; VIS.pingT = 1; VIS.reveal.fill(0); });
// EOF:js/vision.js
