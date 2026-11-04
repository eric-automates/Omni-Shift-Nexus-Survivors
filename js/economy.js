/* =========================================================================
   OMNI-SHIFT v14.2 — ECONOMY · MARKET · THE LAW · SURVIVAL NEEDS (js/economy.js)
   • world finances: every workplace near you produces while its people are
     on shift (a grocery's cashiers and stockers → food and water, a
     pharmacy → medicine, a hardware store → parts and ammo…); every home
     consumes. Stock rises and falls with who is alive and working, and
     prices follow it (supply ÷ demand). Kill the town's only pharmacist and
     med kits get expensive until the job is filled.
   • buy & sell: a shop counter while someone is serving ([F] SHOP), or any
     computer terminal ([F] TERMINAL — the courier delivers). Pay a fine
     there too.
   • the law: assault, robbery, murder and theft are crimes when someone
     sees them (self-defence isn't — whoever attacks first is the
     aggressor). ★ security & armed citizens → ★★ police → ★★★ police &
     SWAT → ★★★★ the military → ★★★★★ your universe's elite (a Jedi party,
     Aurors, Agents, Witchers…). Out of sight, the heat cools down.
     Bounty hunters keep to the law — except the lawless kind.
   • survival needs (optional): hunger and thirst build up through the day,
     guns use ammo; the bag feeds you by itself while it has supplies
   ========================================================================= */
"use strict";

const ECO = { on: false, needs: false, stock: {}, price: {}, hourT: 0, W: { heat: 0, lvl: 0, lastSeen: -99, respT: 0, msgT: 0, crimes: 0, unseen: 0 }, hunger: 15, thirst: 15, rounds: 30, ammoMsgT: -99, kioskT: -1, kiosk: null, panel: null, gangT: 120, hunterT: 200, law: new Uint8Array(512), bad: new Int32Array(512).fill(-1) };
const ECO_GOODS = {
  food:     { n: "Food", base: 9, ref: 80 },  water: { n: "Water", base: 6, ref: 90 }, med: { n: "Med kit", base: 45, ref: 14 }, stim: { n: "Stim shot", base: 60, ref: 6 },
  ammo:     { n: "Ammo", base: 14, ref: 40 }, scrap: { n: "Parts", base: 16, ref: 50 }, valuable: { n: "Valuables", base: 120, ref: 8 }, capsule: { n: "Pocket Capsule", base: 450, ref: 1.5 }
};
// what each kind of workplace makes per worker-hour on shift
const ECO_PROD = {
  grocery: { food: 5, water: 4 }, store: { food: 1.5, water: 1.5, scrap: 0.8 }, shop: { scrap: 0.6, valuable: 0.04 }, gasstore: { food: 1, water: 2, stim: 0.05 }, hardware: { scrap: 3, ammo: 0.8 },
  pharmacy: { med: 1.4, stim: 0.3 }, clinic: { med: 0.7 }, hospital: { med: 0.9, stim: 0.1 }, diner: { food: 2.5 }, cafe: { food: 1.2, water: 1 }, bar: { water: 2 },
  warehouse: { scrap: 3, capsule: 0.008 }, autorepair: { scrap: 1.5 }, garage: { scrap: 1 }, dealership: { capsule: 0.02 }, office: { capsule: 0.003, valuable: 0.05 }, bank: { valuable: 0.3 },
  police: { ammo: 0.5 }, barn: { food: 6 }, farmhouse: { food: 4 }, commercial: { food: 1, water: 1, scrap: 0.6 }, shoprow: { food: 0.6, scrap: 0.4 }
};
const ECO_USE = { food: 0.06, water: 0.08, med: 0.004, stim: 0.001, ammo: 0.003, scrap: 0.01, valuable: 0.0008, capsule: 0.00005 };   // per resident-hour
// what a shop counter sells (terminals sell everything)
const ECO_SHOP = { holdout: ["food", "water", "med", "ammo", "scrap"], grocery: ["food", "water"], store: ["food", "water", "scrap"], shop: ["scrap", "valuable"], gasstore: ["food", "water", "stim"], hardware: ["scrap", "ammo"], pharmacy: ["med", "stim"],
  clinic: ["med"], hospital: ["med", "stim"], diner: ["food"], cafe: ["food", "water"], bar: ["water"], police: ["ammo"], commercial: ["food", "water", "scrap"], shoprow: ["food", "water", "scrap"], dealership: ["capsule"], warehouse: ["scrap"] };
// who enforces the law, by universe (faction id; "real" for real maps): ★..★★★★★
const ECO_LAW = {
  0: ["security", "imperial", "imperial", "imperial", "jedi"], 1: ["security", "lapd", "lapd", "sgc", "atlantis"], 2: ["security", "alliance", "alliance", "alliance", "alliance"],
  3: ["security", "harkonnen", "harkonnen", "harkonnen", "fremen"], 4: ["security", "starfleet", "starfleet", "colonial", "starfleet"], 5: ["security", "colonial_marines", "colonial_marines", "commandos", "colonial_marines"],
  6: ["security", "lapd", "lapd", "commandos", "zfighters"], 7: ["security", "lapd", "lapd", "arasaka", "agents"], 8: ["security", "combine", "combine", "commandos", "combine"],
  9: ["security", "knights", "knights", "knights", "investigators"], 10: ["security", "aurors", "aurors", "aurors", "aurors"], real: ["security", "lapd", "lapd", "commandos", "commandos"]
};
const ECO_LAW_NAME = ["", "SECURITY & ARMED CITIZENS", "POLICE", "POLICE & SWAT", "THE MILITARY", "THE ELITE"];
const ECO_HEAT = { theft: 14, robbery: 32, assault: 26, murder: 70, copassault: 30, copkill: 55, hitrun: 30 };
const ECO_LVL = [0, 12, 55, 120, 200, 300];
// new rosters: the law's first line, and two elites
if (typeof erDef === "function") {
  const RED = "rgba(130,10,16,0.62)";
  erDef("security", "Security & Armed Citizens", RED, [
    ["Security Guard", "h", ["#263238", "#37474f", "#ffd54f"], "cap", "pistol", 1, 0, 1, "belt"],
    ["Armed Citizen", "h", ["#6d4c41", "#3e2723", "#90a4ae"], "hair", "shotgun", 1, 0, 1, ""],
    ["Guard Dog", "b", ["#5d4037", "#3e2723", "#1a1a1a"], "dog", "none", 0, 0, 0.85, ""],
    ["Security Chief", "h", ["#212121", "#263238", "#ffd54f"], "cap", "smg", 1, 0, 1.1, "pads belt"]]);
  erDef("jedi", "Jedi Order", RED, [
    ["Jedi Knight", "h", ["#c8b08a", "#8a6a48", "#29b6f6"], "hood", "esword", 0, 0, 1, "glow"],
    ["Jedi Padawan", "h", ["#d8c8a8", "#9a7a58", "#66bb6a"], "hair", "esword", 0, 0, 0.92, "glow"],
    ["Temple Guard", "h", ["#e8e0c8", "#c8b890", "#ffd54f"], "hood", "polearm", 0, 0, 1.1, "glow"],
    ["Jedi Master", "h", ["#6d4c41", "#4e342e", "#ab47bc"], "hood", "esword", 0, 0, 1.15, "glow"]]);
  erDef("inquisitors", "Inquisitorius", RED, [
    ["Inquisitor", "h", ["#212121", "#151515", "#ff1744"], "helmet", "esword", 0, 0, 1, "glow"],
    ["Purge Trooper", "h", ["#1c1c1c", "#2a2a2a", "#ff5252"], "deathtrooper", "baton", 0, 0, 1.05, "armor"],
    ["Probe Droid", "f", ["#2a2d33", "#15171b", "#ff3b3b"], "probe", "none", 1, 0, 0.9, ""],
    ["Grand Inquisitor", "h", ["#263238", "#151515", "#ff1744"], "bald", "esword", 0, 0, 1.15, "glow armor"]]);
}
const ECO_JEDI_HEROES = new Set([0, 3, 81, 83, 55]);

/* --- money & stock -------------------------------------------------------------------- */
function ecoMem() { const M = typeof tfMem === "function" ? tfMem() : {}; if (!M.stock) M.stock = {}; return M; }
function ecoInitStock() { const M = ecoMem(); for (const k in ECO_GOODS) if (!(M.stock[k] >= 0)) M.stock[k] = ECO_GOODS[k].ref; ECO.stock = M.stock; ecoPrices(); }
function ecoPriceMul(k) {
  if (k === "weapon") return ECO.on ? Math.max(0.7, Math.min(1.6, (ECO.price.ammo || 14) / 14)) : 1;
  const G = ECO_GOODS[k]; if (!G) return 1;
  return (ECO.price[k] || G.base) / G.base;
}
function ecoPrices() {
  for (const k in ECO_GOODS) {
    const G = ECO_GOODS[k], S = ECO.stock[k] != null ? ECO.stock[k] : G.ref;
    ECO.price[k] = ECO.on ? Math.max(1, Math.round(G.base * Math.max(0.55, Math.min(3.2, Math.pow(G.ref / Math.max(0.5, S), 0.55)))))
      : SCN.mode === "apoc" && typeof APOC_PRICE !== "undefined" ? Math.max(1, Math.round(G.base * (APOC_PRICE[k] || 1))) : G.base;
  }
}
// once per game hour: everyone near you on shift produces, every household consumes
function ecoHourTick() {
  if (!ECO.on || typeof TF === "undefined") return;
  const h = scnHour(), prod = {}, use = {};
  let res = 0, working = 0;
  for (const R of TF.bld.values()) {
    for (const id of R.res) { const p = TF.npc.get(id); if (p && p.alive) res++; }
    const P = ECO_PROD[R.kind]; if (!P) continue;
    for (const J of R.jobs) { const p = TF.npc.get(J.id); if (J.open || !p || !p.alive || p.bad || !tfIn(h, J.shift[0], J.shift[1])) continue; working++; for (const k in P) prod[k] = (prod[k] || 0) + P[k]; }
  }
  const scale = Math.max(1, res) / 60;   // the registry is a sample of the town: keep stock in the same units as ECO_GOODS.ref
  for (const k in ECO_GOODS) {
    const G = ECO_GOODS[k], before = ECO.stock[k];
    ECO.stock[k] = Math.max(0, Math.min(G.ref * 4, ECO.stock[k] + ((prod[k] || 0) - res * (ECO_USE[k] || 0)) / scale));
    if (before > G.ref * 0.25 && ECO.stock[k] <= G.ref * 0.25 && typeof tfNews === "function") tfNews(G.n + " is running short in town — prices are climbing.");
  }
  ECO.working = working; ECO.res = res;
  ecoPrices();
}
function ecoBuy(k, n, how) {
  const price = ECO.price[k] || ECO_GOODS[k].base, cost = price * n;
  if (itWallet() < cost) { itToast("Not enough money (" + itMoney(cost) + ")", "#ff8a80"); return false; }
  if (k === "capsule") { const B = itBag(); if (B.caps.length + n > IT_DEF.capsule.cap) { itToast("No room for more capsules", "#ffab40"); return false; } for (let i = 0; i < n; i++) B.caps.push(IT_CAPSULES[Math.floor(Math.random() * IT_CAPSULES.length)][0]); }
  else { const got = itAdd(k, n); if (got < n) { if (got === 0) { itToast("Your bag is full of that", "#ffab40"); return false; } } n = got; }
  itPay(-price * n, (how || "bought") + " " + n + "× " + (typeof itName === "function" ? itName(k) : k));
  if (ECO.on) { ECO.stock[k] = Math.max(0, ECO.stock[k] - n); ecoPrices(); }
  return true;
}
function ecoSell(k, n) {
  const B = itBag(); n = Math.min(n, B[k] || 0); if (!n) return false;
  const each = Math.max(1, Math.round((ECO.price[k] || ECO_GOODS[k].base) * 0.6));
  B[k] -= n; itPay(each * n, "sold " + n + "× " + itName(k));
  if (ECO.on) { ECO.stock[k] = Math.min(ECO_GOODS[k].ref * 4, ECO.stock[k] + n); ecoPrices(); }
  return true;
}

/* --- kiosks: shop counters & terminals ------------------------------------------------------ */
const ECO_TERM = new Set(["deskpod", "teacherdesk", "desk"]);
function ecoNearKiosk() {
  if (!player || player.inVehicle || !CITY.on || typeof cityBuildingAt !== "function") return null;
  const b = cityBuildingAt(player.x, player.y); if (!b) return null;
  const G = b.int || cityInterior(b), tx = (player.x + CITY.orx) / 16, ty = (player.y + CITY.ory) / 16, kind = typeof tfKind === "function" ? tfKind(b) : (b.kind || b.type);
  let best = null, bd = 2.6;
  G.furn.forEach((f, fi) => {
    const shop = (f.t === "counter" || f.t === "barcounter") && ECO_SHOP[kind], term = ECO_TERM.has(f.t) && (kind === "office" || kind === "library" || kind === "school" || kind === "police" || kind === "bank" || kind === "council" || kind === "post" || kind === "civic" || f.t === "deskpod");
    if (!shop && !term) return;
    const x0 = b.x + f.x, y0 = b.y + f.y, d = Math.hypot(Math.max(x0 - tx, 0, tx - (x0 + f.w)), Math.max(y0 - ty, 0, ty - (y0 + f.h)));
    if (d < bd) { bd = d; best = { b, f, fi, kind, shop: !!shop, x: (x0 + f.w / 2) * 16 - CITY.orx, y: (y0 + f.h / 2) * 16 - CITY.ory }; }
  });
  return best;
}
function ecoShopOpen(K) {   // a counter needs someone serving (economy); elsewhere the shop is simply open in daytime
  if (K.barter || K.jawa) return true;   // survivors' barter and the Jawas' stall are always open
  if (!K.shop) return true;
  if (SCN.mode === "apoc") return false;
  if (!ECO.on || typeof TF === "undefined" || !TF.on) return true;
  const R = TF.bld.get(K.b.uid) || tfRegister(K.b), h = scnHour();
  return R.jobs.some(J => { const p = TF.npc.get(J.id); return !J.open && p && p.alive && !p.bad && tfIn(h, J.shift[0], J.shift[1]); });
}
function ecoKioskOpen(K) {
  if (ECO.panel) return;
  if (!ecoShopOpen(K)) { itToast(ECO.on ? "🔒 Nobody's serving right now — come back during opening hours" : "🔒 Closed", "#ffab40"); return; }
  const el = document.createElement("div"); el.id = "ecoPanel";
  el.style.cssText = "position:fixed;inset:0;z-index:99980;background:rgba(3,7,12,0.78);display:flex;align-items:center;justify-content:center;font-family:'Segoe UI',sans-serif";
  document.body.appendChild(el); ECO.panel = el; ECO.panelK = K; ECO.wasPaused = runPaused; runPaused = true;
  el.addEventListener("click", e => { if (e.target === el) ecoKioskClose(); });
  ecoKioskRender();
}
function ecoKioskClose() { if (!ECO.panel) return; ECO.panel.remove(); ECO.panel = null; runPaused = !!ECO.wasPaused; }
function ecoKioskRender() {
  const el = ECO.panel, K = ECO.panelK; if (!el) return;
  const goods = K.shop ? ECO_SHOP[K.kind] : Object.keys(ECO_GOODS), B = itBag(), name = K.jawa ? "Jawa traders · sandcrawler" : K.barter ? K.who + " — survivors' trade" : (typeof cityBuildingLabel === "function" && K.b && cityBuildingLabel(K.b)) || (K.shop ? "Shop" : "Terminal");
  const trend = (k) => { const m = ecoPriceMul(k); return !ECO.on ? "" : m > 1.25 ? ' <span style="color:#ff8a80">▲' + Math.round((m - 1) * 100) + "%</span>" : m < 0.85 ? ' <span style="color:#69f0ae">▼' + Math.round((1 - m) * 100) + "%</span>" : ""; };
  let h = '<div style="width:min(600px,95vw);max-height:88vh;overflow:auto;background:#08111b;border:1px solid #ffd16688;border-radius:10px;padding:14px 16px;color:#d6e9f5">';
  h += '<div style="display:flex;justify-content:space-between;align-items:center"><b style="font-size:17px;color:#ffd166">' + (K.shop ? "🛒 " : "🖥️ ") + tfEscE(name) + '</b><span>💵 ' + itMoney(itWallet()) + '</span><button class="btn" id="ecoX">✖</button></div>';
  h += '<div style="font-size:11px;color:#89a;margin:4px 0 10px">' + (K.jawa ? "Utinni! Scrap, parts and salvage off the dunes — Jawas haggle hard, and nothing is sold as it was found." : K.barter ? "After the end, food, water, medicine and ammo are what's worth anything — money and trinkets barely count." : K.shop ? "Prices follow the town's stock — who is alive and working decides it." : "Online market — the courier brings what you buy. Prices follow the town's stock.") + (ECO.on && ECO.working != null ? " · " + ECO.working + " people on shift nearby" : "") + "</div>";
  h += '<style>#ecoPanel .er{display:grid;grid-template-columns:1fr 92px 40px 64px 64px;gap:6px;align-items:center;padding:3px 0;border-bottom:1px solid #ffffff10}#ecoPanel .btn{padding:3px 6px;font-size:12px}</style>';
  h += '<div class="er" style="color:#89a;font-size:11px"><span>GOODS</span><span>PRICE</span><span>HAVE</span><span></span><span></span></div>';
  for (const k of goods) {
    const p = ECO.price[k] || ECO_GOODS[k].base, have = k === "capsule" ? B.caps.length : (B[k] || 0);
    h += '<div class="er"><span>' + (IT_DEF[k] ? IT_DEF[k].i : "") + " " + itName(k) + "</span><span>" + itMoney(p) + trend(k) + "</span><b>" + have + '</b><button class="btn" data-ebuy="' + k + '">BUY</button>' + (k !== "capsule" && have ? '<button class="btn" data-esell="' + k + '">SELL</button>' : "<i></i>") + "</div>";
  }
  if (!K.shop || K.kind === "police") {
    const W = ECO.W, fine = ecoFine();
    h += '<div style="margin-top:12px;padding-top:8px;border-top:1px solid #ffffff22">' + (W.lvl > 0 ? "⚖️ Wanted " + "★".repeat(W.lvl) + (fine ? ' — pay the fine: <b>' + itMoney(fine) + '</b> <button class="btn" id="ecoFine">PAY FINE</button>' : " — too hot to settle now (lose them first, or it's ★★★★ and up)") : "⚖️ Clean record.") + "</div>";
  }
  if (K.f && IT_CONT[K.f.t] && K.b) { const st = itSearched(K.b, K.fi); h += '<div style="margin-top:10px"><button class="btn" id="ecoSearch" title="' + (K.shop ? "Going through the stock is theft if staff see it" : "") + '">🔍 SEARCH THE ' + IT_CONT[K.f.t][0] + (st === 2 ? " (empty)" : "") + "</button></div>"; }
  const news = typeof tfMem === "function" ? (tfMem().news || []).slice(0, 4) : [];
  if (news.length && ECO.on) h += '<div style="margin-top:10px;font-size:12px;color:#9ab"><b style="color:#cfe">📰 LOCAL NEWS</b>' + news.map(n => "<div>• " + tfEscE(n.txt) + "</div>").join("") + "</div>";
  h += "</div>";
  el.innerHTML = h;
  el.querySelector("#ecoX").onclick = ecoKioskClose;
  el.querySelectorAll("[data-ebuy]").forEach(b => b.onclick = () => { ecoBuy(b.dataset.ebuy, 1, K.shop ? "bought" : "ordered"); ecoKioskRender(); });
  el.querySelectorAll("[data-esell]").forEach(b => b.onclick = () => { ecoSell(b.dataset.esell, 1); ecoKioskRender(); });
  const sb = el.querySelector("#ecoSearch"); if (sb) sb.onclick = () => { ecoKioskClose(); itSearch({ b: K.b, c: { fi: K.fi, t: K.f.t } }); };
  const pf = el.querySelector("#ecoFine"); if (pf) pf.onclick = () => { const f = ecoFine(); if (itWallet() < f) { itToast("Not enough money for the fine", "#ff8a80"); return; } itPay(-f, "fine paid"); ECO.W.heat = 0; ecoSetLevel(); ecoKioskRender(); };
}
function tfEscE(s) { return String(s || "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c])); }

/* --- the law ------------------------------------------------------------------------- */
function ecoLawRoster(lvl) {
  const fac = typeof RG !== "undefined" && RG.real ? "real" : (player && player.fac ? player.fac.id : 0), L = ECO_LAW[fac] || ECO_LAW.real;
  let k = L[Math.max(0, Math.min(4, lvl - 1))];
  if (k === "jedi" && player && ECO_JEDI_HEROES.has(player.cid)) k = "inquisitors";
  return typeof ER !== "undefined" && ER[k] ? k : "lapd";
}
function ecoFine() { const W = ECO.W; if (W.lvl <= 0 || W.lvl >= 4 || runTime - W.lastSeen < 20) return 0; return Math.round(60 + W.heat * 5); }
function ecoSetLevel() {
  const W = ECO.W, old = W.lvl;
  let l = 0; for (let i = ECO_LVL.length - 1; i >= 1; i--) if (W.heat >= ECO_LVL[i]) { l = i; break; }
  W.lvl = l;
  if (l > old && player) { itToast("⚠ WANTED " + "★".repeat(l) + " — " + ECO_LAW_NAME[l] + " ON THE WAY", "#ff5252"); W.respT = Math.min(W.respT, 3); if (typeof sfx === "function") sfx(880, 440, 0.3, "square", 0.15); }
  if (l === 0 && old > 0 && player) itToast("✔ The heat is off", "#69f0ae");
  ecoHud();
}
// Event witnesses can react without necessarily identifying the shooter.
// For direct shots, the optional launch position gives an additional geometric
// identification check. It is not a memory of exactly what each actor saw at
// firing time; explosions and other crimes still use the legacy model.
function ecoWitnesses(x, y, victim, origin) {
  let n = 0, cops = 0, identified = 0, idCops = 0;
  const canIdentify = (wx, wy) => !origin || (Math.hypot(wx - origin.x, wy - origin.y) <= 900 && cityLOS(wx, wy, origin.x, origin.y));
  if (typeof TF !== "undefined") for (const p of TF.walk) {
    const W = p.w; if (!W || !p.alive || W.sleep || p === victim) continue;
    const d = Math.hypot(W.x - x, W.y - y); if (d > 900) continue;
    // Direct-shot identification requires sight of the incident as well as
    // the launch point; the legacy near-event shortcut cannot prove either.
    if ((origin || d > 60) && !cityLOS(W.x, W.y, x, y)) continue;
    n++; const job = p.job && TF.bld.get(p.job.uid), isCop = job && job.kind === "police"; if (isCop) cops++;
    if (canIdentify(W.x, W.y)) { identified++; if (isCop) idCops++; }
    W.flee = 5; W.fleeX = x; W.fleeY = y;
  }
  for (let j = 0; j < MAX_E; j++) if (eAct[j] && ECO.law[j] && Math.hypot(eX[j] - x, eY[j] - y) < 900 && cityLOS(eX[j], eY[j], x, y)) { n++; cops++; if (canIdentify(eX[j], eY[j])) { identified++; idCops++; } }
  return { n, cops, identified, idCops };
}
function ecoOnCrime(kind, x, y, victim, how, origin) {
  if (!ECO.on) return;
  // self-defence: hurting someone who attacked you first isn't a crime
  if (victim && victim.aggr && runTime - victim.aggr < 20) return;
  const w = ecoWitnesses(x, y, victim, origin), v = victim && victim.w;
  const seenByVictim = victim && victim.alive && (kind === "robbery" || kind === "assault") && (!origin || (v && Math.hypot(v.x - origin.x, v.y - origin.y) <= 900 && cityLOS(v.x, v.y, origin.x, origin.y)));
  const witnesses = origin ? w.identified : w.n, identifiedCops = origin ? w.idCops : w.cops;
  let heat = ECO_HEAT[kind] || 20;
  // A discovered body or an unseen event is not evidence against the hero.
  // Keep the world news, but do not invent player heat without a witness.
  if (!witnesses && !seenByVictim) {
    if (kind === "murder" && typeof tfNews === "function") {
      if (w.n) tfNews((victim ? victim.name : "A person") + " was killed. Witnesses could not identify the attacker.");
      else tfNews("A body was found" + (victim ? " — " + victim.name : "") + ". Police are asking for witnesses.");
    }
    return;
  }
  if (identifiedCops) heat *= 1.3;
  ECO.W.heat += heat; ECO.W.crimes++;
  if (witnesses || seenByVictim) ECO.W.lastSeen = runTime;
  ECO.W.unseen = runTime - ECO.W.lastSeen;
  ecoSetLevel();
  if (kind === "murder" && victim && typeof tfNews === "function" && (witnesses || seenByVictim)) tfNews(victim.name + " was killed in broad view. The suspect is still at large.");
}
function ecoOnAlarm(x, y, R, why) { /* reserved: the law hears about big noise only through witnesses (above) */ }
function ecoWitnessTheft(b, n) {
  if (!ECO.on || !n || typeof TF === "undefined") return;
  const kind = tfKind(b); if (kind === "house" || kind === "farmhouse" || kind === "apartment" || kind === "cabin") { if (b.uid && TF.bld.get(b.uid) && TF.walk.some(p => p.w && p.w.inside === b.uid && !p.w.sleep)) ecoOnCrime("theft", player.x, player.y, null, "theft"); return; }
  if (TF.walk.some(p => p.w && p.w.inside === b.uid && !p.w.sleep)) ecoOnCrime("theft", player.x, player.y, null, "theft");   // staff saw you go through the stock
}
function ecoRob(p) {
  if (!p || !p.alive) return;
  const take = p.cash || 0; p.cash = 0;
  if (take) itPay(take, "robbed " + p.name.split(" ")[0]); else itToast(p.name.split(" ")[0] + " has nothing on them", "#90a4ae");
  if (p.w) { p.w.flee = 7; p.w.fleeX = player.x; p.w.fleeY = player.y; tfSay(p, "Help! I've been robbed!", 2.4); }
  p.mood = Math.max(0, p.mood - 0.3);
  ecoOnCrime("robbery", player.x, player.y, p, "robbery");
}
function ecoAttackCivilian(p) {
  if (!p || !p.alive || !p.w) return;
  tfHurt(p, 12 + Math.random() * 8, "punch", "player", null, {x:player.x,y:player.y});
  if (p.alive) tfSay(p, ["Hey! What the—", "Stop! Help!", "Are you crazy?!"][Math.floor(Math.random() * 3)], 2);
}
// a townsperson goes bad: they become a real threat (lawless street crew); fighting them is self-defence
function ecoTurnBad(p) {
  if (!p || !p.w || typeof stCityEnemy !== "function") return;
  const W = p.w, j = stCityEnemy(W.x, W.y, Math.random() < 0.2 ? 1 : 0, 1, typeof ST_INVEST !== "undefined" ? ST_INVEST : 2);
  if (j < 0) return;
  if (typeof eRos !== "undefined" && typeof locRosIndex === "function") eRos[j] = locRosIndex("streets");
  ECO.bad[j] = 1; ECO.law[j] = 0;
  ST.tx[j] = player.x; ST.ty[j] = player.y; ST.urg[j] = 0.6;
  p.bad = true;
  if (typeof spawnSpeech === "function") spawnSpeech(W.x, W.y - 18, ["I've had it with this town!", "Your money. NOW.", "Nobody's coming to help you."][Math.floor(Math.random() * 3)], "#ff5252", 2.4);
  if (typeof tfNews === "function") tfNews(p.name + " snapped and started a fight on the street.");
  const i = TF.walk.indexOf(p); if (i >= 0) tfDespawn(i);
}
function ecoSpawnLaw() {
  const W = ECO.W; if (W.lvl <= 0) return;
  let live = 0; for (let j = 0; j < MAX_E; j++) if (eAct[j] && ECO.law[j]) live++;
  const cap = [0, 2, 4, 6, 8, 8][W.lvl]; if (live >= cap) return;
  const ros = ecoLawRoster(W.lvl), n = Math.min(cap - live, [0, 2, 3, 4, 4, 3][W.lvl]), a0 = Math.random() * 6.283;
  let made = 0;
  for (let k = 0; k < n; k++) {
    const a = a0 + (Math.random() - 0.5) * 0.6, d = 1900 + Math.random() * 900;
    const q = cityFindWalkable(player.x + Math.cos(a) * d, player.y + Math.sin(a) * d, 360, true);
    if (cityVisibleAt(q[0], q[1]) && Math.hypot(q[0] - player.x, q[1] - player.y) < 1500) continue;
    const heavy = W.lvl >= 3 ? 0.3 : W.lvl === 2 ? 0.08 : 0, j = stCityEnemy(q[0], q[1], k === 0 && W.lvl >= 4 ? 3 : stPickType(heavy), 1 + 0.15 * (W.lvl - 1), typeof ST_INVEST !== "undefined" ? ST_INVEST : 2);
    if (j < 0) break;
    if (typeof eRos !== "undefined" && typeof locRosIndex === "function") eRos[j] = locRosIndex(ros);
    ECO.law[j] = 1; ECO.bad[j] = -1;
    ST.tx[j] = player.x + (Math.random() - 0.5) * 300; ST.ty[j] = player.y + (Math.random() - 0.5) * 300; ST.urg[j] = 1; ST.sus[j] = 0.8;
    made++;
  }
  if (made && runTime - W.msgT > 15) { W.msgT = runTime; itToast("🚨 " + ECO_LAW_NAME[W.lvl] + " — " + (ER[ros] ? ER[ros].name : ros).toUpperCase(), "#ff8a80"); }
}
function ecoLawStep(dt) {
  const W = ECO.W;
  // seen by the law?
  let seen = false;
  for (let j = 0; j < MAX_E; j++) if (eAct[j] && ECO.law[j] && ST.city[j] && ST.state[j] === (typeof ST_ALERT !== "undefined" ? ST_ALERT : 3)) { seen = true; break; }
  // a patrol officer who spots a wanted hero stops being a passer-by
  if (W.lvl >= 1 && typeof TF !== "undefined" && (TF.frame & 7) === 0) {
    for (const p of TF.walk.slice()) {
      const w = p.w; if (!w || !w.patrol || !p.alive) continue;
      if (Math.hypot(w.x - player.x, w.y - player.y) > 900 || !cityLOS(w.x, w.y, player.x, player.y)) continue;
      const j = stCityEnemy(w.x, w.y, 0, 1.1, typeof ST_ALERT !== "undefined" ? ST_ALERT : 4);
      if (j < 0) break;
      eRos[j] = locRosIndex(ecoLawRoster(Math.max(2, W.lvl))); ECO.law[j] = 1; ECO.bad[j] = -1; ST.tx[j] = player.x; ST.ty[j] = player.y; ST.urg[j] = 1;
      if (typeof spawnSpeech === "function") spawnSpeech(w.x, w.y - 18, "POLICE! STOP RIGHT THERE!", "#90caf9", 2.4);
      p.onDuty = true; const i = TF.walk.indexOf(p); if (i >= 0) tfDespawn(i);
      seen = true;
    }
  }
  if (seen) W.lastSeen = runTime;
  W.unseen = runTime - W.lastSeen;
  if (W.lvl > 0) {
    if (W.unseen > 30) { W.heat = Math.max(0, W.heat - dt * (3 + W.lvl)); ecoSetLevelQuiet(); }
    W.respT -= dt;
    if (W.respT <= 0) { W.respT = 18 + Math.random() * 14 - W.lvl * 2; ecoSpawnLaw(); }
  } else {
    // nobody wants you: the law goes home
    for (let j = 0; j < MAX_E; j++) if (eAct[j] && ECO.law[j] && Math.hypot(eX[j] - player.x, eY[j] - player.y) > 900 && typeof stDespawn === "function") { stDespawn(j); ECO.law[j] = 0; }
  }
  if ((TF.frame & 15) === 0) ecoHud();
}
function ecoSetLevelQuiet() { const old = ECO.W.lvl; let l = 0; for (let i = ECO_LVL.length - 1; i >= 1; i--) if (ECO.W.heat >= ECO_LVL[i]) { l = i; break; } if (l !== old) ecoSetLevel(); }
function ecoHud() {
  let el = document.getElementById("hudWanted");
  if (!el) { const dm = document.getElementById("hudDM"); if (!dm) return; el = document.createElement("div"); el.className = "stat-pill"; el.id = "hudWanted"; el.title = "Wanted level — out of sight, the heat cools down"; dm.insertAdjacentElement("beforebegin", el); }
  const W = ECO.W;
  if (!ECO.on || W.lvl <= 0) { el.style.display = "none"; } else {
    el.style.display = ""; el.style.color = "#ff5252";
    el.textContent = "★".repeat(W.lvl) + "☆".repeat(5 - W.lvl) + (W.unseen > 30 ? " (cooling)" : "");
    el.style.opacity = W.unseen > 30 && (Math.floor(runTime * 2) & 1) ? 0.45 : 1;
  }
  let nd = document.getElementById("hudNeeds");
  if (!nd) { const dm = document.getElementById("hudDM"); if (!dm) return; nd = document.createElement("div"); nd.className = "stat-pill"; nd.id = "hudNeeds"; nd.title = "Hunger & thirst — the bag feeds you by itself while it has food and water"; dm.insertAdjacentElement("beforebegin", nd); }
  if (!ECO.needs) nd.style.display = "none";
  else { nd.style.display = ""; nd.textContent = "🥫" + Math.round(ECO.hunger) + "% 💧" + Math.round(ECO.thirst) + "%" + (ecoGunNeedsAmmo() ? " 🔋" + ECO.rounds + "+" + (itBag().ammo || 0) : ""); nd.style.color = ECO.hunger > 75 || ECO.thirst > 75 ? "#ff8a80" : ""; }
}

/* --- survival needs --------------------------------------------------------------------- */
const ECO_GUN_RX = /pistol|rifle|blaster|gun|carbine|shot|revolver|smg|launcher|cannon|magnum|sniper|repeater|slug|bullet|minigun|phaser|disruptor|bowcaster|lancer|pulse|caster/i;
function ecoIsGun(w) { return !!w && w.style !== "orbit" && !(typeof isSwordWeapon === "function" && isSwordWeapon(w.id)) && ECO_GUN_RX.test(w.name || ""); }
function ecoGunNeedsAmmo() { return ECO.needs && player && (player.weapons || []).some(w => w.enabled !== false && ecoIsGun(w)); }
function ecoEat(k) {
  if (k === "food") { if (ECO.needs) { if (ECO.hunger < 8) return false; ECO.hunger = Math.max(0, ECO.hunger - 45); } else if (player.hp >= player.maxHp) return false; else player.hp = Math.min(player.maxHp, player.hp + player.maxHp * 0.06); itToast("🥫 " + itName("food"), "#c5e1a5"); return true; }
  if (k === "water") { if (ECO.needs) { if (ECO.thirst < 8) return false; ECO.thirst = Math.max(0, ECO.thirst - 50); } else if (player.hp >= player.maxHp) return false; else player.hp = Math.min(player.maxHp, player.hp + player.maxHp * 0.04); itToast("💧 " + itName("water"), "#b3e5fc"); return true; }
  return false;
}
function ecoNeedsStep(dt) {
  if (!ECO.needs || !player) return;
  ECO.hunger = Math.min(100, ECO.hunger + dt * 0.055);
  ECO.thirst = Math.min(100, ECO.thirst + dt * 0.085);
  const B = itBag();
  if (ECO.hunger >= 55 && B.food > 0) itUse("food");
  if (ECO.thirst >= 50 && B.water > 0) itUse("water");
  if (ECO.hunger >= 100 || ECO.thirst >= 100) { player.hp -= player.maxHp * 0.005 * dt; if (runTime - ECO.ammoMsgT > 12) { ECO.ammoMsgT = runTime; itToast(ECO.thirst >= 100 ? "💧 DEHYDRATED — find water" : "🥫 STARVING — find food", "#ff5252"); } }
  player.ecoWeak = ECO.hunger >= 75 || ECO.thirst >= 75;
}

/* --- engine hooks -------------------------------------------------------------------- */
(function ecoWire() {
  // ammo: a gun fires only with rounds; out of ammo, it scrapes by at a quarter of the rate
  if (typeof fireWeapon === "function") {
    const _fw = fireWeapon;
    window.fireWeapon = function (w) {
      let spentRound = false;
      if (ECO.needs && ecoIsGun(w)) {
        if (ECO.rounds <= 0) {
          const B = itBag();
          if (B.ammo > 0) { B.ammo--; ECO.rounds = 30; itToast("🔋 RELOAD — " + itName("ammo").toLowerCase() + " (" + B.ammo + " left)", "#b3e5fc"); }
          else { w.dryN = (w.dryN || 0) + 1; if (runTime - ECO.ammoMsgT > 10) { ECO.ammoMsgT = runTime; itToast("🔋 OUT OF AMMO — buy or loot some", "#ff8a80"); } if (w.dryN % 4) return; }
        }
        if (ECO.rounds > 0) { ECO.rounds--; spentRound = true; }
      }
      const result = _fw.apply(this, arguments);
      if (result === false && spentRound) ECO.rounds++;
      return result;
    };
  }
  // the city's own spawners: calm in a working town — gangs at night, a bounty hunter now and then, the law when wanted
  if (typeof stDirector === "function") { const _sd = stDirector; window.stDirector = function (dt) { if (ECO.on) return; return _sd.apply(this, arguments); }; }
  if (typeof stHunters === "function") { const _sh = stHunters; window.stHunters = function (dt) { if (ECO.on) { ECO.hunterT -= dt; if (ECO.hunterT > 0) return; ECO.hunterT = 240 + Math.random() * 120; ST.hunterT = 0; return _sh.apply(this, arguments); } return _sh.apply(this, arguments); }; }
  if (typeof stResponders === "function") { const _sr = stResponders; window.stResponders = function () { if (ECO.on) return; return _sr.apply(this, arguments); }; }
  // [F] at a counter or terminal
  const _fit = window.findInteractTarget, _twi = window.triggerWorldInteract;
  if (typeof _fit === "function") window.findInteractTarget = function () {
    const t = _fit();
    if (!CITY.on || !player || player.inVehicle || (t && t.kind !== "itCont" && t.kind !== "tfTalk")) return t;
    if (ECO.kioskT !== runTime) { ECO.kioskT = runTime; const K = SCN.mode === "apoc" ? null : ecoNearKiosk(); ECO.kiosk = K ? { kind: "ecoKiosk", K, x: K.x, y: K.y - 12, label: K.shop ? "[F] SHOP" + (ecoShopOpen(K) ? "" : " (closed)") : "[F] TERMINAL — online market" } : null; }
    return ECO.kiosk || t;   // the counter / terminal first (the panel can still search the furniture)
  };
  if (typeof _twi === "function") window.triggerWorldInteract = function () {
    if (CITY.on && player && !player.inVehicle) { const t = findInteractTarget(); if (t && t.kind === "ecoKiosk") { ecoKioskOpen(t.K); ECO.kioskT = -1; return; } }
    return _twi();
  };
  window.addEventListener("keydown", e => { if (e.code === "Escape" && ECO.panel) ecoKioskClose(); });
  if (typeof V10 !== "undefined") {
    V10.onRunStart.push(() => {
      ECO.on = typeof CITY !== "undefined" && CITY.on && SCN.mode === "economy";
      ECO.needs = SCN.needs; ECO.hunger = 15; ECO.thirst = 15; ECO.rounds = 30; ECO.law.fill(0); ECO.bad.fill(-1);
      ECO.W = { heat: 0, lvl: 0, lastSeen: -99, respT: 0, msgT: -99, crimes: 0, unseen: 99 };
      ECO.hourT = 0; ECO.gangT = 90 + Math.random() * 60; ECO.hunterT = 200;
      if (ECO.on) { ecoInitStock(); player.rivalEvery = Math.max(player.rivalEvery || 0, 300); }
      else { ECO.stock = {}; ecoPrices(); }
      ecoHud();
    });
    V10.onStep.push((dt) => {
      if (!CITY.on) return;
      ecoNeedsStep(dt);
      if (!ECO.on) return;
      ECO.hourT -= dt;
      if (ECO.hourT <= 0) { ECO.hourT = 60; ecoHourTick(); }
      ecoLawStep(dt);
      if (!(typeof RG !== "undefined" && RG.real) && typeof rmLawfulHunters === "function") rmLawfulHunters(dt);   // lawful bounty hunters keep out of sanctuaries here too
      // a street crew now and then at night (lawless: fair game)
      ECO.gangT -= dt;
      if (ECO.gangT <= 0) {
        ECO.gangT = 150 + Math.random() * 150;
        const h = scnHour();
        if ((h >= 21 || h < 4) && typeof stCityEnemy === "function") {
          const a = Math.random() * 6.283, q = cityFindWalkable(player.x + Math.cos(a) * 2600, player.y + Math.sin(a) * 2600, 360, true);
          if (!cityVisibleAt(q[0], q[1])) for (let k = 0; k < 3; k++) { const j = stCityEnemy(q[0] + (k - 1) * 30, q[1], stPickType(0.05), 1, typeof ST_INVEST !== "undefined" ? ST_INVEST : 2); if (j < 0) break; eRos[j] = locRosIndex("streets"); ECO.bad[j] = 1; ST.tx[j] = player.x; ST.ty[j] = player.y; }
        }
      }
    });
    V10.onKill.push((idx, x, y, et, isEcho) => {
      if (!ECO.on) return;
      if (ECO.law[idx]) {
        ECO.law[idx] = 0;
        // Never blame the hero for a known hostile, squad or unknown cause.
        // Unconverted legacy kill paths retain previous handling until the
        // remaining actor/command provenance audit is complete.
        const cause = typeof currentKillSource === "string" ? currentKillSource : "legacy";
        if (!isEcho && (cause === "player" || cause === "legacy")) ecoOnCrime("copkill", x, y, null, "kill", typeof currentKillOrigin !== "undefined" ? currentKillOrigin : null);
      }
      ECO.bad[idx] = -1;
    });
    V10.onRunReset.push(() => { ECO.on = false; ecoKioskClose(); ecoHud(); });
  }
})();
// thoughts the economy puts in people's heads (js/townsfolk.js asks)
function ecoThoughts(p, r) {
  const T = [];
  if (!ECO.on) return T;
  const pick = a => a[Math.floor(r() * a.length)];
  const hi = Object.keys(ECO_GOODS).filter(k => ecoPriceMul(k) > 1.3).sort((a, b) => ecoPriceMul(b) - ecoPriceMul(a));
  if (hi.length) T.push(pick([itName(hi[0]) + " costs " + Math.round((ecoPriceMul(hi[0]) - 1) * 100) + "% more than last month. Who can afford that?", "Have you seen what they want for " + itName(hi[0]).toLowerCase() + " now?"]));
  if (ECO.W.lvl >= 2) T.push(pick(["Sirens all day. Somebody's in big trouble.", "Isn't that the one from the news…? Don't stare.", "They say the " + (ECO.W.lvl >= 4 ? "army" : "police") + " is all over town."]));
  if (ECO.W.lvl >= 1 && Math.hypot((p.w ? p.w.x : 0) - player.x, (p.w ? p.w.y : 0) - player.y) < 200) T.push("Keep calm. Don't make eye contact. Just walk.");
  return T;
}
// EOF:js/economy.js
