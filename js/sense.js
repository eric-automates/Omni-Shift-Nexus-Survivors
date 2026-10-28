/* =========================================================================
   OMNI-SHIFT v13 — THREAT SENSE
   A 0-100% early-warning meter for the next RIVAL and the SECTOR TITAN.

   • Both arrival clocks tick faster the further you roam from the map centre
     (Outpost x1.0 → Abyssal Core x2.1). Stay close and it is calmer; push into
     the outer rings and the hunters find you sooner.
   • The meter always shows whichever arrival is coming FIRST. At 100% it is here.
   • It is dressed per hero: Jedi feel a Disturbance in the Force, Sith feel the
     Dark Side stir, marines get a beeping motion tracker, bounty hunters feel the
     heat, wizards read omens, beasts smell it on the wind…
   • At 90%+ an arrow on the screen edge points where it will come from (the spawn
     angle is pre-rolled, so the arrow never lies).
   Hidden in the Proving Ground (no spawns there).
   ========================================================================= */
"use strict";

/* --- 1. STYLES -------------------------------------------------------------- */
// fx: ripple (Force rings) | radar (sweep + blips + beeps) | reticle (crosshair) | runes (rune ring) | pulse (heartbeat)
const SENSE_STYLES = {
  jedi:    { label: "DISTURBANCE IN THE FORCE", noun: ["A DARK PRESENCE", "A GREAT DARKNESS"], col: "#4fc3f7", fx: "ripple", snd: "force",
             lines: ["I sense something… a presence I've not felt since…", "A dark presence draws near.", "A great disturbance in the Force — it is coming.", "IT IS HERE."] },
  sith:    { label: "THE DARK SIDE STIRS", noun: ["A CHALLENGER", "A TITAN'S HATE"], col: "#ff1744", fx: "ripple", snd: "sith",
             lines: ["Something stirs in the dark side…", "I sense a challenger. Good.", "Their fear is close. Let them come.", "NOW."] },
  seer:    { label: "PRESCIENCE", noun: ["A RIVAL'S THREAD", "THE TITAN'S SHADOW"], col: "#ffd166", fx: "ripple", snd: "force",
             lines: ["A thread of the future tightens…", "The vision sharpens.", "I have seen this moment. It comes now.", "AS FORESEEN."] },
  omen:    { label: "DARK OMEN", noun: ["A DUELLIST", "SOMETHING ANCIENT"], col: "#b388ff", fx: "runes", snd: "omen",
             lines: ["The air grows cold…", "Dark magic gathers on the wind.", "Something wicked this way comes.", "IT HAS COME."] },
  tracker: { label: "MOTION TRACKER", noun: ["SIGNAL", "BIG SIGNAL"], col: "#69f0ae", fx: "radar", snd: "beep",
             lines: ["Signal on the edge of range.", "Movement. It's closing.", "It's right on top of us!", "CONTACT!"] },
  bounty:  { label: "BOUNTY HEAT", noun: ["A HUNTER", "A BIG BOUNTY"], col: "#ffab40", fx: "reticle", snd: "heat",
             lines: ["Word's out. Someone's tracking you.", "A hunter's closing in.", "Someone's about to collect.", "THEY'RE HERE."] },
  hunt:    { label: "HUNT INSTINCT", noun: ["WORTHY PREY", "THE GREATEST PREY"], col: "#ff3d00", fx: "reticle", snd: "heat",
             lines: ["A heat signature, far off…", "Worthy prey approaches.", "The hunt is about to begin.", "TROPHY TIME."] },
  demon:   { label: "DEMONIC PRESENCE", noun: ["A HELL KNIGHT", "AN ARCH-DEMON"], col: "#ff1744", fx: "pulse", snd: "sith",
             lines: ["The air smells of sulphur.", "Something big is crawling out of Hell.", "Demonic presence at critical levels.", "RIP AND TEAR."] },
  beast:   { label: "PRIMAL INSTINCT", noun: ["A PREDATOR", "AN APEX BEAST"], col: "#ffb74d", fx: "pulse", snd: "growl",
             lines: ["A scent on the wind…", "Something big is hunting.", "The ground is trembling.", "IT'S HERE!"] },
  droid:   { label: "SENSOR SWEEP", noun: ["UNKNOWN CONTACT", "MASSIVE CONTACT"], col: "#40c4ff", fx: "radar", snd: "beep",
             lines: ["*bweep* Anomaly detected.", "*bwoo-ee* Contact closing!", "*SCREEEE* Collision imminent!", "*BWAAAH!*"] },
  threat:  { label: "THREAT LEVEL", noun: ["A RIVAL", "THE TITAN"], col: "#ffd166", fx: "pulse", snd: "heat",
             lines: ["Something's coming.", "Threat rising.", "Brace yourself — it's close.", "INCOMING!"] }
};

// iconic per-hero overrides (label / lines)
const SENSE_HERO = {
  0:  { k: "jedi" }, 78: { k: "jedi" }, 79: { k: "jedi", label: "THE FORCE IS TROUBLED", lines: ["Clouded, the future is…", "Near, the dark side is.", "Coming, it is. Ready, you must be.", "ARRIVED, IT HAS."] },
  3:  { k: "sith" }, 76: { k: "sith" }, 77: { k: "sith" },
  14: { k: "seer", label: "PSYCHIC STATIC", lines: ["…they're coming… they're always coming…", "Two by two, hands of blue.", "Miranda. Miranda. MIRANDA.", "NOW."] },
  18: { k: "seer", label: "PRESCIENCE" }, 20: { k: "seer", label: "THE VOICE WARNS" }, 39: { k: "seer", label: "DÉJÀ VU", lines: ["A black cat went past… and another.", "They changed something.", "Agent inbound. Run.", "HE'S HERE."] },
  73: { k: "seer", label: "FUTURES SEEN", lines: ["One of 14 million futures narrows…", "The Eye of Agamotto glows.", "This is the one. It comes now.", "WE'RE IN THE ENDGAME."] },
  46: { k: "seer", label: "TIMEY-WIMEY", lines: ["Something's wrong with time…", "Can you hear that? Footsteps in the vortex.", "Oh, this is bad. This is very bad.", "RUN!"] },
  56: { k: "omen", label: "SCAR BURNING", lines: ["Your scar prickles.", "Your scar is burning.", "He's close — you can feel it.", "HE'S HERE."] },
  71: { k: "omen", label: "THE EYE IS UPON YOU" }, 72: { k: "omen", label: "THE PALANTÍR SEES" },
  48: { k: "bounty", label: "MEDALLION HUMMING", col: "#cfd8dc", lines: ["Your medallion twitches.", "The medallion is humming.", "Medallion's going crazy. Something strong.", "WIND'S HOWLING."] },
  29: { k: "hunt" }, 33: { k: "demon" }, 49: { k: "demon", label: "THE STARS ARE RIGHT" },
  23: { k: "droid", label: "COLLECTIVE ALERT", col: "#69f0ae", lines: ["Subspace anomaly detected.", "Hostile vessel on approach.", "Resistance is futile. It arrives.", "ASSIMILATE."] },
  4:  { k: "droid" }, 10: { k: "droid", label: "ASGARD SENSORS" },
  28: { k: "tracker" }, 32: { k: "tracker" },
  30: { k: "beast", label: "HIVE SENSE" }, 37: { k: "beast", label: "WAAAGH-O-METER", lines: ["Somefink's comin'.", "A big 'un! Get ready ladz!", "WAAAGH! Dat one's close!", "WAAAAAGH!!!"] },
  5:  { k: "beast" }, 17: { k: "beast", label: "REAVER FRENZY" }, 61: { k: "beast" },
  7:  { k: "omen", label: "THE SYSTEM LORDS STIR" }, 9: { k: "threat", label: "KREE! ENEMY NEAR" }, 11: { k: "seer", label: "HIVE TELEPATHY" },
  12: { k: "seer", label: "THE ORI SEE ALL" }, 19: { k: "bounty", label: "BLOOD HUNT" }, 21: { k: "droid", label: "HUNTER-SEEKER FEED" },
  24: { k: "beast", label: "BATTLE LUST", lines: ["Today is a good day to die.", "An honourable foe approaches!", "It comes. Ready your blade!", "QAPLA'!"] },
  38: { k: "seer", label: "WARP SIGHT" },
  2:  { k: "tracker", label: "IMPERIAL SCANNER" }, 22: { k: "tracker", label: "RED ALERT" }, 25: { k: "tracker", label: "DRADIS CONTACT" },
  26: { k: "droid", label: "CYLON SENSORS" }, 31: { k: "tracker", label: "BUG RADAR" }, 34: { k: "tracker", label: "AUSPEX SCAN" },
  36: { k: "droid", label: "TOMB SENSORS" }, 40: { k: "droid", label: "THREAT ASSESSMENT" }, 43: { k: "tracker", label: "PIP-BOY RADAR" },
  44: { k: "beast", label: "ROAD WARRIOR'S GUT" }, 45: { k: "tracker", label: "HEV SUIT SENSORS" }, 47: { k: "droid", label: "SCAN VISOR" },
  55: { k: "hunt", label: "TROPHY HUNT", lines: ["*cough* Something approaches…", "A worthy addition to my collection.", "Your lightsaber will make a fine addition!", "KILL HIM!"] }
};
const SENSE_TRACKER_IDS = [2, 8, 13, 16, 22, 25, 26, 27, 31, 34, 35, 36, 40, 41, 42, 43, 44, 45, 47, 53];
const SENSE_BOUNTY_IDS = [1, 6, 15, 50, 51, 52, 54, 64, 65, 67, 74];

function senseStyleFor(cid) {
  let o = null;
  if (cid === CUSTOM_CID && typeof customSenseKind === "function") o = { k: customSenseKind() };
  else if (SENSE_HERO[cid]) o = SENSE_HERO[cid];
  else if (SENSE_TRACKER_IDS.indexOf(cid) >= 0) o = { k: "tracker" };
  else if (SENSE_BOUNTY_IDS.indexOf(cid) >= 0) o = { k: "bounty" };
  else if (cid >= 56 && cid <= 75) o = { k: "omen" };
  else o = { k: "threat" };
  const base = SENSE_STYLES[o.k] || SENSE_STYLES.threat;
  return { k: o.k, label: o.label || base.label, col: o.col || base.col, lines: o.lines || base.lines, noun: base.noun, fx: base.fx, snd: base.snd };
}

/* --- 2. DISTANCE PRESSURE --------------------------------------------------- */
// 1.0 inside the Outpost (≤300 px from centre) rising smoothly to 2.1 at the Abyssal Core (≥1800 px)
function threatMult() {
  if (!player) return 1;
  const d = Math.hypot(player.x - 256, player.y - 256);
  return 1 + 1.1 * Math.max(0, Math.min(1, (d - 300) / 1500));
}

/* --- 3. STATE --------------------------------------------------------------- */
const senseState = {
  style: null, cid: -1, pct: 0, kind: "", eta: 0, band: 0, mult: 1, engaged: "",
  angRival: Math.random() * Math.PI * 2, angTitan: Math.random() * Math.PI * 2,
  pingT: 0, beepT: 0, sub: "", subT: 0, hudT: 0, el: null, lastSig: "", arrivedT: 0
};
function senseReset() {
  const s = senseState;
  s.style = player ? senseStyleFor(player.cid) : null; s.cid = player ? player.cid : -1;
  s.pct = 0; s.kind = ""; s.eta = 0; s.band = 0; s.mult = 1; s.engaged = ""; s.pingT = 0; s.beepT = 0; s.sub = ""; s.subT = 0; s.lastSig = ""; s.arrivedT = 0;
  s.angRival = Math.random() * Math.PI * 2; s.angTitan = Math.random() * Math.PI * 2;
  if (player) player.titanClock = player.titanClock || 0;
}
// spawnEnemy(boss/rival) asks for the pre-rolled angle so the edge arrow is truthful
function threatSpawnAngle(isBoss) {
  const s = senseState;
  const a = isBoss ? s.angTitan : s.angRival;
  if (isBoss) s.angTitan = Math.random() * Math.PI * 2; else s.angRival = Math.random() * Math.PI * 2;
  s.band = 0;
  return a;
}
function senseHidden() { return !player || !runActive || !!player.noSpawns; }

function senseLiveBoss() {
  for (let j = 0; j < MAX_E; j++) if (eAct[j] && eType[j] === 99) return j;
  return -1;
}

/* --- 4. STEP ---------------------------------------------------------------- */
function senseStep(simDt) {
  const s = senseState;
  if (!s.style || s.cid !== player.cid) { s.style = senseStyleFor(player.cid); s.cid = player.cid; }
  if (senseHidden()) { s.pct = 0; return; }
  s.mult = threatMult();
  const sdOn = typeof showdownBusy === "function" && showdownBusy();
  const bossJ = player.bossSpawned ? senseLiveBoss() : -1;
  s.engaged = sdOn ? "rival" : (bossJ >= 0 ? "titan" : "");
  // which arrival comes first?
  const rEvery = player.rivalEvery || 75, bAt = player.bossAt || 120;
  const rEta = Math.max(0, (rEvery - rivalTimer) / s.mult);
  const tEta = player.bossSpawned ? 1e9 : Math.max(0, (bAt - (player.titanClock || 0)) / s.mult);
  let kind, p, eta;
  if (tEta <= rEta) { kind = "titan"; p = (player.titanClock || 0) / bAt; eta = tEta; }
  else { kind = "rival"; p = rivalTimer / rEvery; eta = rEta; }
  s.kind = kind; s.eta = eta;
  s.pct = s.engaged ? 100 : Math.max(0, Math.min(99, Math.floor(p * 100)));
  if (s.arrivedT > 0) s.arrivedT -= simDt;
  // thresholds: 50 / 75 / 90 → flavour line + cue
  const band = s.engaged ? 4 : (s.pct >= 90 ? 3 : (s.pct >= 75 ? 2 : (s.pct >= 50 ? 1 : 0)));
  if (band !== s.band) {
    if (band > s.band && band >= 1) {
      s.sub = s.style.lines[Math.min(3, band - 1)]; s.subT = 4.5;
      senseCue(band);
      if (band === 3) spawnSpeech(player.x, player.y - 30, s.style.label + "!", s.style.col, 1.8);
      if (band === 4) { s.arrivedT = 2.2; s.sub = s.style.lines[3]; s.subT = 3.5; }
    }
    s.band = band;
  }
  if (s.subT > 0) s.subT -= simDt;
  // heartbeat pings / tracker beeps quicken as it closes in
  const pf = s.pct / 100;
  if (!s.engaged && pf >= 0.5) {
    s.pingT -= simDt;
    if (s.pingT <= 0) {
      s.pingT = Math.max(0.28, 2.4 - 2.1 * (pf - 0.5) * 2);
      s.pingFx = 1;
      if (s.style.snd === "beep" && opts.vol > 0) sfxTone(pf > 0.9 ? 1420 : 1180, pf > 0.9 ? 1420 : 1180, 0.06, "square", 0.05, 0);
      else if (pf >= 0.9 && opts.vol > 0) sfxTone(s.style.snd === "sith" ? 62 : 74, 48, 0.16, "sine", 0.16, 0);
    }
  }
  if (s.pingFx > 0) s.pingFx = Math.max(0, s.pingFx - simDt * 1.25);
}
function senseCue(band) {
  if (!opts || opts.vol <= 0) return;
  const k = senseState.style.snd;
  if (k === "force") { sfxTone(196, 294, 0.7, "sine", 0.13, 0); sfxTone(147, 220, 0.8, "triangle", 0.08, 0); }
  else if (k === "sith") { sfxTone(82, 55, 0.7, "sawtooth", 0.1, 0); }
  else if (k === "omen") { sfxTone(660, 990, 0.45, "sine", 0.08, 0); sfxTone(330, 494, 0.6, "triangle", 0.06, 0); }
  else if (k === "beep") { sfxTone(1320, 1320, 0.08, "square", 0.07, 0); }
  else if (k === "growl") { sfxTone(95, 60, 0.6, "sawtooth", 0.1, 0.1); }
  else { sfxTone(440, 330 + band * 60, 0.35, "triangle", 0.08, 0); }
}

/* --- 5. HUD (DOM) ----------------------------------------------------------- */
const SENSE_ICONS = {
  ripple: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3" fill="currentColor"/><circle class="r1" cx="12" cy="12" r="6.5" fill="none" stroke="currentColor" stroke-width="1.3"/><circle class="r2" cx="12" cy="12" r="10" fill="none" stroke="currentColor" stroke-width="1"/></svg>',
  radar: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" stroke-width="1.2"/><circle cx="12" cy="12" r="5.5" fill="none" stroke="currentColor" stroke-width="0.8" opacity="0.6"/><path class="sweep" d="M12 12 L12 2 A10 10 0 0 1 20.7 7 Z" fill="currentColor" opacity="0.45"/><circle class="blip" cx="16.5" cy="6.5" r="1.6" fill="currentColor"/></svg>',
  reticle: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="7.5" fill="none" stroke="currentColor" stroke-width="1.4"/><path d="M12 1v6M12 17v6M1 12h6M17 12h6" stroke="currentColor" stroke-width="1.6"/><circle cx="12" cy="12" r="1.5" fill="currentColor"/></svg>',
  runes: '<svg viewBox="0 0 24 24"><g class="spin"><circle cx="12" cy="12" r="9.5" fill="none" stroke="currentColor" stroke-width="0.9" stroke-dasharray="2 2.2"/><path d="M12 2.5l1.2 2.4-1.2 1.1-1.2-1.1zM12 21.5l1.2-2.4-1.2-1.1-1.2 1.1zM2.5 12l2.4-1.2 1.1 1.2-1.1 1.2zM21.5 12l-2.4-1.2-1.1 1.2 1.1 1.2z" fill="currentColor"/></g><path d="M12 7.5l3.8 6.6H8.2z" fill="none" stroke="currentColor" stroke-width="1.3"/></svg>',
  pulse: '<svg viewBox="0 0 24 24"><path d="M1 12h5l2-5 3.5 11 2.5-8 1.6 2H23" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/></svg>'
};
function senseEnsureEl() {
  let el = senseState.el;
  if (el && el.isConnected) return el;
  el = document.getElementById("senseHud");
  if (!el) {
    el = document.createElement("div"); el.id = "senseHud";
    const hud = document.getElementById("hud"), xp = hud ? hud.querySelector(".xp-wrap") : null;
    if (xp && xp.parentNode) xp.parentNode.insertBefore(el, xp.nextSibling); else if (hud) hud.appendChild(el); else return null;
  }
  el.innerHTML = '<div class="sn-ico"></div><div class="sn-body"><div class="sn-top"><span class="sn-lbl"></span><span class="sn-pct">0%</span></div>' +
    '<div class="sn-bar"><div class="sn-fill"></div><i style="left:50%"></i><i style="left:75%"></i><i style="left:90%"></i></div><div class="sn-sub"></div></div>';
  senseState.el = el; senseState.lastSig = "";
  return el;
}
function senseHudFrame(rawDt) {
  const s = senseState;
  if (!runActive || !player || !s.style) { if (s.el) s.el.style.display = "none"; return; }
  s.hudT -= rawDt;
  if (s.hudT > 0) return;
  s.hudT = 0.1;
  const el = senseEnsureEl();
  if (!el) return;
  if (senseHidden()) { el.style.display = "none"; return; }
  el.style.display = "";
  const st = s.style, sig = st.k + "|" + st.label;
  if (s.lastSig !== sig) {
    s.lastSig = sig;
    el.className = "fx-" + st.fx;
    el.style.setProperty("--sn", st.col);
    el.querySelector(".sn-ico").innerHTML = SENSE_ICONS[st.fx] || SENSE_ICONS.pulse;
    el.querySelector(".sn-lbl").textContent = st.label;
  }
  const pct = s.pct;
  el.querySelector(".sn-pct").textContent = pct + "%";
  el.querySelector(".sn-fill").style.width = pct + "%";
  el.classList.toggle("hot", pct >= 75); el.classList.toggle("crit", pct >= 90);
  el.style.setProperty("--rate", (Math.max(0.35, 2.2 - pct * 0.018)).toFixed(2) + "s");
  let sub;
  if (s.engaged === "rival") sub = "RIVAL ENGAGED — finish the duel";
  else if (s.engaged === "titan") sub = "THE TITAN IS HERE — bring it down";
  else if (s.subT > 0 && s.sub) sub = s.sub;
  else {
    const who = s.kind === "titan" ? st.noun[1] : st.noun[0];
    const ring = typeof getDistBiome === "function" ? getDistBiome(player.x, player.y).name : "";
    sub = who + " · " + ring + " ×" + s.mult.toFixed(1);
  }
  const subEl = el.querySelector(".sn-sub");
  if (subEl.textContent !== sub) subEl.textContent = sub;
}

/* --- 6. WORLD + SCREEN FX --------------------------------------------------- */
function senseRenderWorld(c) {
  const s = senseState;
  if (senseHidden() || !s.style || s.engaged) return;
  const pf = s.pct / 100;
  if (pf < 0.5 || !(s.pingFx > 0)) return;
  const k = 1 - s.pingFx, col = s.style.col;
  c.save();
  c.globalAlpha = s.pingFx * (0.25 + pf * 0.45);
  c.strokeStyle = col; c.lineWidth = 1.6;
  if (s.style.fx === "radar") {
    // tracker ping + a blip toward the threat
    c.beginPath(); c.arc(player.x, player.y, 26 + k * 120, 0, Math.PI * 2); c.stroke();
    if (pf >= 0.75) {
      const a = s.kind === "titan" ? s.angTitan : s.angRival, r = 150 - pf * 80;
      c.globalAlpha = s.pingFx; c.fillStyle = col;
      c.beginPath(); c.arc(player.x + Math.cos(a) * r, player.y + Math.sin(a) * r, 3.2, 0, Math.PI * 2); c.fill();
    }
  } else if (s.style.fx === "ripple" || s.style.fx === "runes") {
    // Force ripples roll outward from the hero
    for (let n = 0; n < 2; n++) { c.beginPath(); c.arc(player.x, player.y, 18 + (k + n * 0.35) * 70, 0, Math.PI * 2); c.stroke(); }
  } else {
    c.beginPath(); c.arc(player.x, player.y, 20 + k * 46, 0, Math.PI * 2); c.stroke();
  }
  c.restore();
}
function senseRenderScreen(c) {
  const s = senseState;
  if (senseHidden() || !s.style) return;
  const col = s.style.col;
  // arrival flash: the label sweeps the screen
  if (s.arrivedT > 0) {
    const a = Math.min(1, s.arrivedT / 0.6);
    c.save(); c.globalAlpha = 0.18 * a; c.fillStyle = col; c.fillRect(0, 0, W, H);
    c.globalAlpha = a; c.font = "bold 15px monospace"; c.textAlign = "center"; c.lineWidth = 4; c.strokeStyle = "rgba(0,0,0,0.75)";
    const txt = s.style.lines[3];
    c.strokeText(txt, W / 2, H * 0.3); c.fillStyle = col; c.fillText(txt, W / 2, H * 0.3);
    c.restore();
  }
  if (s.engaged || s.pct < 90) return;
  // edge vignette + direction arrow (pre-rolled spawn angle)
  const a = s.kind === "titan" ? s.angTitan : s.angRival, t = performance.now() / 1000;
  const pulse = 0.55 + 0.45 * Math.sin(t * 9);
  c.save();
  const g = c.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.32, W / 2, H / 2, Math.max(W, H) * 0.72);
  g.addColorStop(0, "rgba(0,0,0,0)"); g.addColorStop(1, col);
  c.globalAlpha = 0.1 + 0.08 * pulse; c.fillStyle = g; c.fillRect(0, 0, W, H);
  // keep the arrow inside the play area: below the HUD block, above the bottom buttons
  if (!(s.hudBotT > 0)) { s.hudBotT = 1; const hud = document.getElementById("hud"); s.hudBot = hud ? Math.min(H * 0.4, hud.getBoundingClientRect().bottom) : 0; }
  s.hudBotT -= 1 / 60;
  const top = Math.max(26, (s.hudBot || 0) + 18), bot = H - 70, cx = W / 2, cy = (top + bot) / 2, dx = Math.cos(a), dy = Math.sin(a);
  const m = 26, sx = (W / 2 - m) / Math.max(1e-3, Math.abs(dx)), sy = ((bot - top) / 2) / Math.max(1e-3, Math.abs(dy));
  const sc = Math.min(sx, sy), ex = cx + dx * sc, ey = cy + dy * sc;
  c.globalAlpha = 0.6 + 0.4 * pulse;
  c.translate(ex, ey); c.rotate(a);
  c.fillStyle = col; c.strokeStyle = "rgba(0,0,0,0.7)"; c.lineWidth = 2;
  c.beginPath(); c.moveTo(13, 0); c.lineTo(-7, -9); c.lineTo(-3, 0); c.lineTo(-7, 9); c.closePath(); c.stroke(); c.fill();
  c.rotate(-a);
  c.font = "bold 9px monospace"; c.textAlign = "center"; c.lineWidth = 3;
  const lbl = (s.kind === "titan" ? s.style.noun[1] : s.style.noun[0]);
  const ly = dy > 0.6 ? -16 : 20;
  c.strokeText(lbl, -dx * 34, ly); c.fillText(lbl, -dx * 34, ly);
  c.restore();
}

V10.onRunStart.push(function senseRunStart() { senseReset(); });
V10.onRunReset.push(function senseRunReset() { senseReset(); if (senseState.el) senseState.el.style.display = "none"; });
V10.onStep.push(senseStep);
V10.onFrame.push(senseHudFrame);
V10.onRenderWorld.push(senseRenderWorld);
V10.onRenderScreen.push(senseRenderScreen);
// EOF:js/sense.js
