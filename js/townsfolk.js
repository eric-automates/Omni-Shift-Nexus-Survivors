/* =========================================================================
   OMNI-SHIFT v14.2 — TOWNSFOLK (js/townsfolk.js)
   The people of the 🏙️ SIMULATED ECONOMY (and the survivors of the
   ☢️ apocalypse):
   • every home has residents and every workplace its staff — a manager, a
     deputy, the rest — with real shifts (shops 8–4 / 12–8, diners from 6,
     bars into the night, police, hospitals and fire stations round the
     clock, schools 7:30–3:30); the population is rolled from each
     building, so it's the same town every time you come back
   • level of detail: nobody is walked step by step far away — where each
     person is follows from their schedule; near you they become people:
     commuters on the pavements at rush hour, clerks behind the counter,
     families at home, sleepers in their beds at 3 a.m.
   • [F] TALK: name, job, shift, what they're doing — and what's on their
     mind (the prices, the coworker who died and the promotion that came
     with it, the stranger with the bounty…)
   • deaths are permanent: the deputy is promoted, the store hires
     someone (a few game hours), or the job stays open and the shelves run
     low; a few people go bad
   ========================================================================= */
"use strict";

const TF = { on: false, bld: new Map(), npc: new Map(), walk: [], regT: 0, regPos: null, pathBudget: 0, talkT: -1, talk: null, panel: null, hireSeq: 1, frame: 0 };
const TF_MAX_OUT = 34, TF_MAX_IN = 18, TF_REG_M = 380, TF_LIVE_M = 300;

/* --- who works where ---------------------------------------------------------------- */
// kind → [titles by rank], staff count from floor area (m²) and the shift pattern
const TF_JOBS = {
  grocery: [["Store manager", "Assistant manager", "Cashier", "Stocker", "Butcher", "Baker", "Cashier"], 260, "shop2"],
  store: [["Store manager", "Shift lead", "Sales clerk", "Stocker"], 220, "shop"], shop: [["Owner", "Shop assistant", "Sales clerk"], 160, "shop"],
  gasstore: [["Station manager", "Clerk", "Clerk"], 120, "allday"], hardware: [["Store manager", "Floor lead", "Sales clerk", "Yard hand"], 240, "shop"],
  pharmacy: [["Head pharmacist", "Pharmacist", "Pharmacy tech", "Cashier"], 180, "shop2"], diner: [["Owner", "Head cook", "Line cook", "Server", "Server", "Dishwasher"], 110, "diner"],
  cafe: [["Owner", "Barista", "Barista"], 90, "diner"], bar: [["Owner", "Head bartender", "Bartender", "Bouncer"], 120, "bar"],
  office: [["Office manager", "Team lead", "Analyst", "Accountant", "Clerk", "Engineer"], 140, "office"], bank: [["Branch manager", "Loan officer", "Teller", "Teller", "Security guard"], 150, "office"],
  library: [["Head librarian", "Librarian", "Assistant"], 260, "office"], post: [["Postmaster", "Supervisor", "Postal clerk", "Mail carrier"], 200, "office"],
  school: [["Principal", "Vice principal", "Teacher", "Teacher", "Teacher", "Janitor", "Cook"], 160, "school"], police: [["Police chief", "Sergeant", "Officer", "Officer", "Dispatcher"], 140, "round"],
  clinic: [["Head doctor", "Doctor", "Nurse", "Receptionist"], 140, "shop2"], hospital: [["Hospital director", "Head nurse", "Doctor", "Nurse", "Nurse", "Paramedic", "Orderly"], 160, "round"],
  fire: [["Fire chief", "Captain", "Firefighter", "Firefighter"], 160, "round"], church: [["Pastor", "Deacon", "Caretaker"], 400, "church"],
  council: [["Mayor", "City manager", "Clerk", "Clerk", "Security guard"], 200, "office"], warehouse: [["Warehouse manager", "Foreman", "Forklift driver", "Warehouse worker"], 400, "shop2"],
  autorepair: [["Owner", "Lead mechanic", "Mechanic"], 160, "shop"], garage: [["Owner", "Mechanic"], 160, "shop"], dealership: [["Dealer", "Sales manager", "Salesperson", "Mechanic"], 220, "shop"],
  hotel: [["Hotel manager", "Front desk lead", "Receptionist", "Housekeeper", "Housekeeper"], 260, "round"], motel: [["Owner", "Receptionist", "Housekeeper"], 260, "round"],
  cinema: [["Manager", "Projectionist", "Usher", "Concessions"], 300, "bar"], theatre: [["Director", "Stage manager", "Usher"], 300, "bar"], museum: [["Curator", "Guide", "Guard"], 300, "office"],
  station: [["Station master", "Agent", "Porter"], 300, "allday"], arena: [["Venue manager", "Steward", "Steward"], 600, "bar"], laundromat: [["Owner", "Attendant"], 100, "allday"],
  showroom: [["Gallery owner", "Assistant"], 160, "shop"], commercial: [["Manager", "Shift lead", "Clerk", "Clerk"], 200, "shop"], shoprow: [["Owner", "Clerk"], 150, "shop"],
  civic: [["Director", "Deputy", "Clerk", "Clerk"], 220, "office"], barn: [["Farmer", "Farmhand"], 400, "farm"], farmhouse: [["Farmer", "Farmhand"], 900, "farm"]
};
// shift patterns: [start, end) in hours (end may pass midnight) per rank / staff index
const TF_SHIFTS = {
  shop: [[9, 17], [9, 17], [8, 16], [12, 20]], shop2: [[8, 16], [12, 20], [7, 15], [14, 22]], allday: [[6, 14], [14, 22], [22, 30]], diner: [[6, 14], [6, 14], [14, 22], [10, 18]],
  bar: [[16, 24], [18, 26], [16, 24], [20, 28]], office: [[9, 17], [8, 16], [9, 17]], school: [[7.5, 15.5]], round: [[7, 15], [15, 23], [23, 31], [7, 15]], church: [[8, 12], [9, 13], [7, 11]], farm: [[5, 13], [6, 14]]
};
const TF_HOMES = { house: [1, 4], farmhouse: [2, 4], cabin: [1, 2], apartment: [4, 24], residential: [3, 10] };
const TF_UNIFORM = { police: ["#1a237e", "#0d1442", "cap"], hospital: ["#eceff1", "#4db6ac", "hair"], clinic: ["#eceff1", "#4db6ac", "hair"], fire: ["#6d4c41", "#3e2723", "helmet"], station: ["#37474f", "#263238", "cap"], post: ["#1565c0", "#0d47a1", "cap"] };

/* --- names & looks per universe --------------------------------------------------------- */
const TF_NAMES = {
  modern: [["James", "Mary", "Robert", "Linda", "Michael", "Jennifer", "David", "Susan", "Chris", "Jessica", "Daniel", "Sarah", "Kevin", "Amanda", "Brian", "Megan", "Jason", "Ashley", "Tyler", "Brittany", "Luis", "Maria", "Andre", "Keisha", "Raj", "Priya", "Tom", "Emily", "Hank", "Dolores", "Ray", "Carol"],
    ["Smith", "Johnson", "Williams", "Brown", "Jones", "Miller", "Davis", "Garcia", "Wilson", "Anderson", "Taylor", "Thomas", "Moore", "Martin", "Jackson", "White", "Harris", "Clark", "Lewis", "Walker", "Hall", "Young", "King", "Wright", "Hill", "Green", "Baker", "Nelson", "Carter", "Patel", "Nguyen", "Kim"]],
  scifi: [["Tarlo", "Mira", "Bek", "Jessa", "Dov", "Kael", "Rina", "Oren", "Talla", "Vix", "Sorn", "Lyra", "Pell", "Yara", "Corran", "Nessa", "Brex", "Ilsa", "Daro", "Kima", "Tobb", "Senna", "Rook", "Ama"],
    ["Vanto", "Rell", "Okara", "Desh", "Morrow", "Taal", "Kesh", "Varn", "Ostrin", "Belu", "Draxis", "Sunn", "Abrel", "Cato", "Fenn", "Ishar", "Lume", "Quell"]],
  rustic: [["Aldric", "Maud", "Bran", "Elsa", "Wat", "Agnes", "Hugh", "Edith", "Tomas", "Isolde", "Piers", "Joan", "Geoff", "Hilde", "Osric", "Wynn", "Cedric", "Beatrix"],
    ["Thatcher", "Miller", "Cooper", "Fletcher", "Smith", "Ashford", "Brook", "Carter", "Dunmore", "Hale", "Marsh", "Reeve", "Tanner", "Wold"]],
  cyber: [["Kenji", "Vex", "Rin", "Jax", "Nova", "Dex", "Mei", "Zed", "Luz", "Kai", "Sable", "Ryo", "Ines", "Tavi"], ["Tanaka", "Okoye", "Silva", "Volkov", "Chen", "Reyes", "Ito", "Mbeki", "Kowal", "Duarte", "Sato", "Ferro"]],
  waste: [["Rusty", "Dusty", "Scrap", "Mags", "Tinker", "Ash", "Cinder", "Hollis", "Jo", "Patch", "Grit", "Wren", "Boone", "Sal"], ["the Scavver", "of Route 9", "Two-Guns", "the Mechanic", "Rivers", "Callahan", "Holt", "Vega", "the Quiet"]]
};
function tfNamePool() {
  const k = typeof CITY !== "undefined" ? CITY.themeKey : "modern";
  if (typeof APOC !== "undefined" && APOC.on) return TF_NAMES.waste;
  if (k === "galactic" || k === "coruscant" || k === "starship" || k === "desert" || k === "colony" || k === "pharaoh") return TF_NAMES.scifi;
  if (k === "medieval" || k === "wizard" || k === "western") return TF_NAMES.rustic;
  if (k === "neon") return TF_NAMES.cyber;
  if (k === "wasteland") return TF_NAMES.waste;
  return TF_NAMES.modern;
}
const TF_LOOKS = {
  modern: { shirts: ["#3b6ea5", "#c0392b", "#27ae60", "#f1c40f", "#8e44ad", "#ecf0f1", "#2c3e50", "#e67e22", "#16a085", "#d35400", "#7f8c8d", "#e84393"], pants: ["#2c3e50", "#34495e", "#5d4037", "#1a237e", "#212121", "#795548"], heads: ["hair", "hair", "hair", "cap", "bald", "hat", "beret"] },
  scifi: { shirts: ["#c8b08a", "#a08868", "#e8e0d0", "#6d5a46", "#b07a4a", "#8a8070", "#5a6a70"], pants: ["#5a4a3a", "#3a3028", "#6a6058", "#2a2a2a"], heads: ["hood", "hair", "hood", "bald", "hair"] },
  rustic: { shirts: ["#7a5a3a", "#5a6a3a", "#8a3a2a", "#4a5a7a", "#a08a5a", "#6a4a6a"], pants: ["#3a2a1a", "#4a3a2a", "#2a2a2a"], heads: ["hair", "hood", "hat", "hair"] },
  cyber: { shirts: ["#f72585", "#4cc9f0", "#212121", "#7209b7", "#3a0ca3", "#ffbe0b", "#2b2d42"], pants: ["#141414", "#22223b", "#3c096c"], heads: ["hair", "mohawk", "cap", "hair", "bald"] },
  waste: { shirts: ["#6a5a46", "#4a4a3a", "#7a6a5a", "#5a3a2a", "#3a4a3a"], pants: ["#3a3028", "#2a2a24", "#4a3a2a"], heads: ["bandana", "hair", "cap", "hood", "bald"] }
};
function tfLookPool() {
  const n = tfNamePool();
  return n === TF_NAMES.scifi ? TF_LOOKS.scifi : n === TF_NAMES.rustic ? TF_LOOKS.rustic : n === TF_NAMES.cyber ? TF_LOOKS.cyber : n === TF_NAMES.waste ? TF_LOOKS.waste : TF_LOOKS.modern;
}
function tfHash(s) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
function tfRng(seed) { let s = seed >>> 0 || 1; return () => { s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; }; }

/* --- the registry: buildings near you get their people ------------------------------------ */
function tfKind(b) { return b.kind && (TF_JOBS[b.kind] || TF_HOMES[b.kind]) ? b.kind : b.type; }
function tfArea(b) { return Math.max(20, (b.cw || 10) * (b.ch || 10) * 0.25); }
function tfPerson(id, r, extra) {
  const N = tfNamePool(), L = tfLookPool();
  const p = Object.assign({ id, seed: tfHash(id), name: N[0][Math.floor(r() * N[0].length)] + " " + N[1][Math.floor(r() * N[1].length)], age: 18 + Math.floor(r() * 58),
    shirt: L.shirts[Math.floor(r() * L.shirts.length)], pants: L.pants[Math.floor(r() * L.pants.length)], head: L.heads[Math.floor(r() * L.heads.length)],
    alive: true, bad: false, mood: 0.45 + r() * 0.5, cash: Math.floor(20 + r() * 180), home: null, job: null, w: null, walkT: r() * 24 }, extra || {});
  TF.npc.set(id, p);
  return p;
}
function tfRegister(b) {
  if (TF.bld.has(b.uid)) return TF.bld.get(b.uid);
  const kind = tfKind(b), r = tfRng(tfHash(b.uid + "|tf")), R = { b, uid: b.uid, kind, res: [], jobs: [], name: typeof cityBuildingLabel === "function" ? cityBuildingLabel(b) || "" : "" };
  if (typeof APOC !== "undefined" && APOC.on) {   // after the end: only the barricaded holdouts are lived in, nobody goes to work
    if (typeof apocIsHoldout === "function" && apocIsHoldout(b)) {
      R.holdout = true;
      const n = 1 + Math.floor(r() * 4);
      for (let k = 0; k < n; k++) { const p = tfPerson(b.uid + "/r" + k, r, { home: b.uid, occ: "survivor", cash: Math.floor(r() * 60) }); R.res.push(p.id); }
    }
    TF.bld.set(b.uid, R);
    return R;
  }
  const H = TF_HOMES[kind];
  if (H) {
    const n = kind === "apartment" || kind === "residential" ? Math.min(H[1], Math.max(H[0], Math.round(tfArea(b) / 110))) : H[0] + Math.floor(r() * (H[1] - H[0] + 1));
    const last = tfNamePool()[1][Math.floor(r() * tfNamePool()[1].length)];
    for (let k = 0; k < n; k++) {
      const p = tfPerson(b.uid + "/r" + k, r, { home: b.uid });
      if (kind !== "apartment" && kind !== "residential") p.name = p.name.split(" ")[0] + " " + last;   // a household shares a surname
      const roll = r();
      p.occ = p.age >= 67 ? "retired" : p.age < 22 && roll < 0.5 ? "student" : roll < 0.12 ? "unemployed" : "commuter";
      p.shift = p.occ === "commuter" ? (r() < 0.8 ? [8 + Math.floor(r() * 2), 16 + Math.floor(r() * 2)] : [22, 30]) : p.occ === "student" ? [8, 15] : null;
      R.res.push(p.id);
    }
  }
  const J = TF_JOBS[kind];
  if (J) {
    const titles = J[0], n = Math.max(2, Math.min(titles.length + 4, Math.round(tfArea(b) / J[1]) + 1)), sh = TF_SHIFTS[J[2]] || TF_SHIFTS.shop;
    for (let s = 0; s < n; s++) {
      const title = titles[Math.min(s, titles.length - 1)], rank = Math.min(2, s), shift = sh[s % sh.length].slice();
      const id = b.uid + "/j" + s;
      const slot = { s, rank, title, shift, id, open: 0, hireAt: 0 };
      R.jobs.push(slot);
      const p = tfPerson(id, r, { job: { uid: b.uid, s }, occ: "worker", shift });
      p.home = tfPickHome(b, r);
      const U = TF_UNIFORM[kind] || (/Security guard/.test(title) ? ["#263238", "#37474f", "cap"] : null);
      if (U) { p.shirt = U[0]; p.pants = U[1]; p.head = U[2]; p.uniform = kind === "police" || /Security/.test(title) ? "law" : kind; }
    }
    tfApplyMem(R);
  }
  TF.bld.set(b.uid, R);
  return R;
}
function tfPickHome(b, r) {   // somewhere to live within a kilometre or so
  try {
    const xm = (b.x + b.cw / 2) / 2, ym = (b.y + b.ch / 2) / 2;
    for (let k = 0; k < 3; k++) {
      const ox = (r() - 0.5) * 1600, oy = (r() - 0.5) * 1600;
      const homes = [];
      for (const B of cityBlocksInRect(xm + ox - 150, ym + oy - 150, xm + ox + 150, ym + oy + 150)) if (B && !B.pending) for (const q of B.blds) if (TF_HOMES[tfKind(q)]) homes.push(q);
      if (homes.length) return homes[Math.floor(r() * homes.length)].uid;
    }
  } catch (e) { /* far edge */ }
  return null;
}
function tfSlotPerson(R, s) { const J = R.jobs[s]; return J && !J.open ? TF.npc.get(J.id) : null; }

/* --- schedules ---------------------------------------------------------------------- */
function tfIn(h, a, b) { if (b > 24) return h >= a || h < b - 24; return h >= a && h < b; }
// what someone is doing at hour h: home / sleep / work / commute (to or from) / out (errands, a walk, a drink)
function tfActivity(p, h) {
  if (!p.alive) return "dead";
  if (p.bad) return "prowl";
  const sh = p.shift;
  if (sh) {
    if (tfIn(h, sh[0], sh[1])) {
      if (p.occ === "worker" && p.seed % 3 === 0 && tfIn(h, sh[0] + 4, sh[0] + 4.75)) return "out";   // lunch break
      return p.occ === "commuter" ? "away" : p.occ === "student" ? "school" : "work";
    }
    if (tfIn(h, sh[0] - 0.6, sh[0])) return "commute";
    if (tfIn(h, sh[1], sh[1] + 0.6)) return "homeward";
    const wake = sh[0] - 1.2, sleep0 = wake - 8;
    if (tfIn((h + 48) % 24, (sleep0 + 48) % 24, ((sleep0 + 48) % 24) + 8)) return "sleep";
  } else if (h < 7 || h >= 23) return "sleep";
  const slot = Math.floor((h + (p.walkT || 0)) % 24);
  if (p.occ === "survivor") return h >= 9 && h < 17 && (p.seed + slot) % 8 === 0 ? "out" : "home";   // out scavenging now and then
  if ((p.seed + slot) % (h >= 10 && h < 19 ? 3 : 7) === 0) return "out";   // errands, a walk, a drink
  return "home";
}
const TF_ACT_TXT = { home: "At home", sleep: "Asleep", work: "Working", away: "At work (out of the area)", school: "At school", commute: "On the way to work", homeward: "Heading home", out: "Out and about", prowl: "Up to no good", dead: "Dead" };

/* --- level of detail: who is a walking person right now ---------------------------------------- */
function tfDoorOutside(b) {   // a walkable tile just outside an exterior door (world px), cached
  if (b._tfDoor !== undefined) return b._tfDoor;
  b._tfDoor = null;
  try {
    const G = b.int || cityInterior(b);
    for (const d of G.doors) {
      if (!d.ext) continue;
      for (const [dx, dy] of [[0, 1], [0, -1], [1, 0], [-1, 0], [0, 2], [0, -2], [2, 0], [-2, 0]]) {
        const tx = b.x + d.x + dx, ty = b.y + d.y + dy, f = cityFlagsT(tx, ty);
        if (!(f & F_MOVE) && !(f & F_IN)) { b._tfDoor = [tx * 16 + 8 - CITY.orx, ty * 16 + 8 - CITY.ory]; return b._tfDoor; }
      }
    }
  } catch (e) { /* no interior */ }
  return b._tfDoor;
}
function tfIndoorSpot(b, r, near) {   // a free floor tile inside (near a furniture type when asked)
  try {
    const G = b.int || cityInterior(b);
    if (near) for (const f of G.furn) if (near.includes(f.t)) for (const [dx, dy] of [[-1, 0], [f.w, 0], [0, -1], [0, f.h]]) { const tx = b.x + f.x + dx, ty = b.y + f.y + dy, fl = cityFlagsT(tx, ty); if ((fl & F_IN) && !(fl & F_MOVE) && r() < 0.6) return [tx * 16 + 8 - CITY.orx, ty * 16 + 8 - CITY.ory]; }
    for (let k = 0; k < 30; k++) { const tx = b.x + 1 + Math.floor(r() * Math.max(1, b.cw - 2)), ty = b.y + 1 + Math.floor(r() * Math.max(1, b.ch - 2)), fl = cityFlagsT(tx, ty); if ((fl & F_IN) && !(fl & F_MOVE)) return [tx * 16 + 8 - CITY.orx, ty * 16 + 8 - CITY.ory]; }
  } catch (e) { /* none */ }
  return null;
}
function tfSpawnWalker(p, x, y, inside, b) {
  p.w = { x, y, vx: 0, vy: 0, face: Math.random() * 6.28, hp: 30, inside: inside ? b.uid : null, tx: x, ty: y, path: null, stuck: 0, flee: 0, fleeX: 0, fleeY: 0, idle: 1 + Math.random() * 3, say: "", sayT: 0, born: runTime };
  TF.walk.push(p);
  return p.w;
}
function tfDespawn(i) { const p = TF.walk[i]; if (p) p.w = null; TF.walk.splice(i, 1); }
function tfNearBuildings(rM) {
  const [xm, ym] = cityWorldM(player.x, player.y), out = [], seen = new Set();
  let blocks = [];
  try { blocks = cityBlocksInRect(xm - rM, ym - rM, xm + rM, ym + rM); } catch (e) { blocks = []; }
  for (const B of blocks) {
    if (!B || B.pending) continue;
    for (const b of B.blds) { if (seen.has(b.uid)) continue; seen.add(b.uid); const bx = (b.x + b.cw / 2) / 2, by = (b.y + b.ch / 2) / 2; if (Math.abs(bx - xm) < rM && Math.abs(by - ym) < rM) out.push(b); }
  }
  return out;
}
function tfRegisterNear() {
  const L = tfNearBuildings(TF_REG_M);
  let n = 0;
  for (const b of L) { if (!TF.bld.has(b.uid)) { tfRegister(b); if (++n > 40) break; } }
  return L;
}
function tfPopulate() {
  if (!player || player.inVehicle === 3 && TF.walk.length > TF_MAX_OUT) return;
  const h = scnHour(), L = TF.nearList || [];
  const rush = (h >= 7 && h < 9.5) || (h >= 15.5 && h < 18.5) ? 1 : h >= 22 || h < 6 ? 0.25 : 0.65;
  const want = Math.round(TF_MAX_OUT * rush), out = TF.walk.filter(p => !p.w.inside).length;
  const r = Math.random;
  // outdoor: someone steps out of a door near you (or comes round the corner), heading wherever their day takes them
  const near = (q) => q && Math.hypot(q[0] - player.x, q[1] - player.y) < TF_LIVE_M * 32 * 0.8;
  for (let k = 0, made = 0; k < 14 && made < 3 && out + made < want && L.length; k++) {
    const b = L[Math.floor(r() * L.length)], R = TF.bld.get(b.uid); if (!R) continue;
    const ids = R.res.concat(R.jobs.filter(j => !j.open).map(j => j.id)), p = TF.npc.get(ids[Math.floor(r() * ids.length)]);
    if (!p || p.w || !p.alive || p.bad) continue;
    const act = tfActivity(p, h);
    if (act !== "commute" && act !== "homeward" && act !== "out") continue;
    const homeR = p.home ? TF.bld.get(p.home) : null, jobR = p.job ? TF.bld.get(p.job.uid) : null;
    let from = null, to = null;
    if (act === "commute") { from = homeR && tfDoorOutside(homeR.b); to = jobR && tfDoorOutside(jobR.b); }
    else if (act === "homeward") { from = jobR && tfDoorOutside(jobR.b); to = homeR && tfDoorOutside(homeR.b); }
    else from = tfDoorOutside(b);
    let at = near(from) ? from : null;
    if (!at) {   // not from a door you can see: round a corner out of sight, on the way
      for (let t = 0; t < 4 && !at; t++) {
        const a0 = to ? Math.atan2(player.y - to[1], player.x - to[0]) + (r() - 0.5) * 2.2 : r() * 6.283, d = 1500 + r() * 1300;
        const q = cityFindWalkable(player.x + Math.cos(a0) * d, player.y + Math.sin(a0) * d, 300, true);
        if (q && !cityVisibleAt(q[0], q[1])) at = q;
      }
    }
    if (!at || Math.hypot(at[0] - player.x, at[1] - player.y) < 100) continue;
    const W = tfSpawnWalker(p, at[0], at[1], false, b);
    if (to && Math.hypot(to[0] - at[0], to[1] - at[1]) > 30) { W.tx = to[0]; W.ty = to[1]; } else tfPickGoal(p, act === "out" ? "out" : act);
    W.idle = 0; made++;
  }
  // the police on shift walk a beat round here
  if (SCN.mode === "economy" && TF.walk.filter(p => p.w.patrol).length < 3 && r() < 0.5) {
    for (const R of TF.bld.values()) {
      if (R.kind !== "police") continue;
      const J = R.jobs.find(J => J.rank >= 1 && !J.open && tfIn(h, J.shift[0], J.shift[1]) && (() => { const q = TF.npc.get(J.id); return q && q.alive && !q.w && !q.bad && !q.onDuty; })());
      if (!J) continue;
      const p = TF.npc.get(J.id), a0 = r() * 6.283, q = cityFindWalkable(player.x + Math.cos(a0) * 1900, player.y + Math.sin(a0) * 1900, 300, true);
      if (!q || cityVisibleAt(q[0], q[1])) break;
      const W = tfSpawnWalker(p, q[0], q[1], false, R.b); W.patrol = 1; W.idle = 0;
      const g = stRandomNear(q[0], q[1], 700, false); W.tx = g[0]; W.ty = g[1];
      break;
    }
  }
  // indoor: the building you're in (and the one you're about to enter) has its people where their day puts them
  const here = typeof cityBuildingAt === "function" ? cityBuildingAt(player.x, player.y) : null;
  if (here) {
    const R = TF.bld.get(here.uid) || tfRegister(here);
    if (!R._lived) {
      R._lived = 1; TF.livedUid = here.uid;
      const rr = tfRng(tfHash(here.uid + "|in" + Math.floor(SCN.min / 30)));
      let nIn = TF.walk.filter(p => p.w.inside === here.uid).length;
      for (const id of R.res.concat(R.jobs.filter(j => !j.open).map(j => j.id))) {
        if (nIn >= TF_MAX_IN) break;
        const p = TF.npc.get(id); if (!p || p.w || !p.alive || p.bad) continue;
        const act = tfActivity(p, h), atHome = p.home === here.uid && (act === "home" || act === "sleep"), atWork = p.job && p.job.uid === here.uid && act === "work";
        if (!atHome && !atWork) continue;
        const spot = tfIndoorSpot(here, rr, atWork ? ["counter", "barcounter", "desk", "teacherdesk", "deskpod", "bar", "stove", "exambed", "shelf"] : act === "sleep" ? ["bed"] : ["sofa", "tvstand", "table", "coffeetable"]);
        if (!spot) continue;
        const W = tfSpawnWalker(p, spot[0], spot[1], true, here); W.sleep = act === "sleep"; W.idle = 4 + rr() * 8; W.post = atWork;
        nIn++;
      }
    }
  }
}
function tfPickGoal(p, act) {
  const W = p.w; if (!W) return;
  let goal = null;
  if (act === "commute" && p.job) { const R = TF.bld.get(p.job.uid); if (R) goal = tfDoorOutside(R.b); }
  else if (act === "homeward" && p.home) { const R = TF.bld.get(p.home); if (R) goal = tfDoorOutside(R.b); }
  if (!goal) {   // errands: a shop / diner / bar nearby, or a stroll
    const L = (TF.nearList || []).filter(b => { const k = tfKind(b); return k === "grocery" || k === "store" || k === "diner" || k === "cafe" || k === "bar" || k === "shop" || k === "pharmacy" || k === "gasstore" || k === "commercial"; });
    const b = L.length ? L[Math.floor(Math.random() * L.length)] : null;
    goal = b ? tfDoorOutside(b) : (typeof stRandomNear === "function" ? stRandomNear(W.x, W.y, 600, false) : [W.x + 200, W.y]);
  }
  if (goal) { W.tx = goal[0]; W.ty = goal[1]; W.path = null; }
}

/* --- walking, fleeing, talking ----------------------------------------------------------- */
function tfMove(W, tx, ty, spd, dt) {
  let gx = tx, gy = ty;
  const far = Math.abs(tx - W.x) + Math.abs(ty - W.y);
  if (far > 40 && typeof stClearLine === "function" && !stClearLine(W.x, W.y, tx, ty, 6)) {
    if ((!W.path || W.stuck > 1.2 || Math.hypot(W.path.tx - tx, W.path.ty - ty) > 60) && TF.pathBudget > 0) { TF.pathBudget--; W.path = stFindPath(W.x, W.y, tx, ty); W.stuck = 0; }
    const P = W.path;
    if (P && P.k < P.pts.length) { let w = P.pts[P.k]; if (Math.hypot(w[0] - W.x, w[1] - W.y) < 12) { P.k++; w = P.pts[Math.min(P.k, P.pts.length - 1)]; } gx = w[0]; gy = w[1]; }
  }
  const a = Math.atan2(gy - W.y, gx - W.x), step = Math.min(spd * dt, Math.hypot(gx - W.x, gy - W.y));
  let diff = a - W.face; diff = Math.atan2(Math.sin(diff), Math.cos(diff)); W.face += diff * Math.min(1, dt * 8);
  const q = cityResolve(W.x + Math.cos(a) * step, W.y + Math.sin(a) * step, 7, false), mv = Math.hypot(q[0] - W.x, q[1] - W.y);
  W.stuck = step > 0.5 && mv < step * 0.3 ? W.stuck + dt : Math.max(0, W.stuck - dt);
  if (W.stuck > 2.5) { W.path = null; W.stuck = 0; W.idle = 0.5; }
  W.vx = (q[0] - W.x) / Math.max(1e-4, dt); W.vy = (q[1] - W.y) / Math.max(1e-4, dt); W.x = q[0]; W.y = q[1];
  if ((TF.frame & 3) === 0) { const fx = W.x + Math.cos(a) * 12, fy = W.y + Math.sin(a) * 12; if (cityFlagsAt(fx, fy) & F_DOOR) cityDoorRequest(fx, fy); }
  return Math.hypot(tx - W.x, ty - W.y);
}
function tfSay(p, txt, t) { if (p.w) { p.w.say = txt; p.w.sayT = runTime + (t || 2.6); } }
function tfAlarm(x, y, R, why) {   // gunfire, an explosion, a drawn weapon swinging: people run from it
  for (const p of TF.walk) { const W = p.w; if (!W) continue; const d = Math.hypot(W.x - x, W.y - y); if (d > R) continue; W.flee = Math.max(W.flee, 4 + Math.random() * 3); W.fleeX = x; W.fleeY = y; W.sleep = false; if (Math.random() < 0.25) tfSay(p, ["Run!", "Get down!", "Oh my god!", "Somebody call the police!", "Not again…"][Math.floor(Math.random() * 5)], 1.8); }
  if (typeof ecoOnAlarm === "function") ecoOnAlarm(x, y, R, why);
}
function tfStep(dt) {
  if (!TF.on || !player) return;
  TF.frame++; TF.pathBudget = 3;
  TF.regT -= dt;
  if (TF.regT <= 0) { TF.regT = 1.5; TF.nearList = tfRegisterNear(); tfPopulate(); tfJobsTick(); }
  const here = typeof cityBuildingAt === "function" ? cityBuildingAt(player.x, player.y) : null, h = scnHour();
  if (TF.livedUid && (!here || here.uid !== TF.livedUid)) { const R0 = TF.bld.get(TF.livedUid); if (R0) R0._lived = 0; TF.livedUid = null; }
  for (let i = TF.walk.length - 1; i >= 0; i--) {
    const p = TF.walk[i], W = p.w;
    if (!W || !p.alive) { tfDespawn(i); continue; }
    const dPl = Math.hypot(W.x - player.x, W.y - player.y);
    if (dPl > TF_LIVE_M * 32 * 1.2 || (W.inside && (!here || here.uid !== W.inside) && dPl > 700)) { tfDespawn(i); continue; }
    if (W.flee > 0) {   // run away from the trouble
      W.flee -= dt; W.sleep = false;
      const a = Math.atan2(W.y - W.fleeY, W.x - W.fleeX);
      tfMove(W, W.x + Math.cos(a) * 160, W.y + Math.sin(a) * 160, 150, dt);
      continue;
    }
    // Dispatch contacts wait for interview, but still flee and take damage.
    if (W.jobContact) {
      // The missing witness follows on foot through the normal collision-aware
      // mover. They never board vehicles or teleport; wait when the player is
      // airborne or driving and preserve ordinary alarm/injury behavior.
      if(W.jobClinic) {
        const target=typeof jdClinicTarget==="function" ? jdClinicTarget(p) : null;
        // Do not stop at an arbitrary 25px radius: a corner can leave the contact
        // close to the door but without the body-clear line required for handoff.
        // Walk normally towards the validated entrance until it is actually clear.
        if(target && (Math.hypot(W.x-target.x,W.y-target.y)>8 || !stClearLine(W.x,W.y,target.x,target.y,7)))tfMove(W,target.x,target.y,100,dt);
        else W.vx=W.vy=0;
      } else if(W.jobSupport) {
        const target=typeof jdSupportTarget==="function" ? jdSupportTarget(p) : null;
        if(target && (Math.hypot(W.x-target.x,W.y-target.y)>(target.stop||30) || (target.stop===8 && !stClearLine(W.x,W.y,target.x,target.y,7))))tfMove(W,target.x,target.y,100,dt);
        else W.vx=W.vy=0;
      } else if(W.jobEscort && !player.inVehicle && !player.roof && (player.flyAlt||0)<=2) {
        const target=typeof jdEscortTarget==="function" ? jdEscortTarget(p) : {x:player.x,y:player.y,stop:48};
        if(Math.hypot(W.x-target.x,W.y-target.y)>target.stop)tfMove(W,target.x,target.y,200,dt);
        else W.vx=W.vy=0;
      } else W.vx = W.vy = 0;
      continue;
    }
    if (W.sleep) { W.vx = W.vy = 0; continue; }
    if (W.inside) {   // indoors: potter about, stay at your post
      W.idle -= dt;
      if (W.idle <= 0) { W.idle = W.post ? 5 + Math.random() * 9 : 3 + Math.random() * 7; const b = TF.bld.get(W.inside); const s = b && tfIndoorSpot(b.b, Math.random, W.post ? ["counter", "barcounter", "desk", "shelf", "stove", "deskpod"] : null); if (s) { W.tx = s[0]; W.ty = s[1]; W.path = null; } }
      if (Math.hypot(W.tx - W.x, W.ty - W.y) > 6) tfMove(W, W.tx, W.ty, 46, dt); else { W.vx = W.vy = 0; }
      continue;
    }
    // outdoors: walk to the goal; go in when there (a patrol just picks the next corner)
    const left = tfMove(W, W.tx, W.ty, W.patrol ? 64 : 58 + (p.seed % 20), dt);
    if (left < 14) {
      if (W.patrol) { const g = stRandomNear(W.x, W.y, 700, false); W.tx = g[0]; W.ty = g[1]; if (tfActivity(p, h) !== "work") { tfDespawn(i); continue; } }
      else { const act = tfActivity(p, h); if (act === "out" && Math.random() < 0.5) tfPickGoal(p, act); else { tfDespawn(i); continue; } }
    }
  }
  tfCollateral(dt);
  // a drawn weapon in town makes people nervous (brandishing — not a crime, just unwelcome)
  if (SCN.mode === "economy" && (TF.frame % 20) === 0 && typeof sheatheArmed === "function" && sheatheArmed() && !player.inVehicle) {
    // A dispatch contact remains approachable with the default low-ready setting;
    // gunfire, damage and other real alarms still make them flee normally.
    for (const p of TF.walk) { const W = p.w; if (!W || W.sleep || W.flee > 0 || W.patrol || (W.jobContact && sheatheGunMode() !== "aim" && sheatheBladeMode() !== "hand") || Math.hypot(W.x - player.x, W.y - player.y) > 150) continue; W.flee = 1.6; W.fleeX = player.x; W.fleeY = player.y; if (Math.random() < 0.3) tfSay(p, ["Whoa — put that away!", "Easy with that thing…", "Is that real?!", "I don't want any trouble."][Math.floor(Math.random() * 4)], 1.8); }
  }
}
// stray shots, blasts and cars hurt people too — and who did it matters (js/economy.js)
function tfCollateral(dt) {
  if (!TF.walk.length) return;
  for (const p of TF.walk) {
    const W = p.w; if (!W || W.hp <= 0) continue;
    if (Math.abs(W.x - player.x) > 900 || Math.abs(W.y - player.y) > 700) continue;
    for (let i = 0; i < MAX_P; i++) {
      if (!pAct[i]) continue;
      const dx = pX[i] - W.x, dy = pY[i] - W.y, rr = (pRad[i] || 4) + 7;
      if (dx * dx + dy * dy > rr * rr) continue;
      // Do not blame the hero for a hostile round. Squad fire is recorded separately;
      // context-aware squad consequences and off-screen safety warnings are still planned.
      const by = typeof projectileOwner === "function" ? projectileOwner(i) : (pEnemy[i] ? "enemy" : "player");
      if (pStyle[i] === 2 && typeof triggerRocketDetonation === "function") {
        // Resolve the impact as one blast, rather than charging the same victim
        // for a direct shot and a second blast from one rocket.
        pAct[i] = 0;
        triggerRocketDetonation(pX[i], pY[i], pDmg[i], pRad[i] * 4.8, by);
      } else {
        const origin = projectileShotOrigin(i);
        // React to the incoming travel direction, not the hero's current
        // position or an omniscient assumption about who fired the round.
        const speed=Math.hypot(pVX[i],pVY[i]);
        const danger=![1,6,8].includes(pStyle[i]) && speed>1 && Number.isFinite(speed)
          ? {x:W.x-pVX[i]/speed*80,y:W.y-pVY[i]/speed*80} : null;
        tfHurt(p, Math.min(30, (pDmg[i] || 10) * 0.6), "shot", by, origin, danger);
        if (!(typeof isPersistentProj === "function" && isPersistentProj(i))) pAct[i] = 0;
      }
      break;
    }

  }
}
function tfHurt(p, dmg, how, by, origin, danger) {
  const W = p.w; if (!W || !p.alive) return;
  // Danger location drives movement only. It is not identity or legal evidence.
  // If the impact direction is unknown, move forward instead of guessing that
  // the player caused the harm. Direct melee supplies its actual source.
  const face=Number.isFinite(W.face)?W.face:0;
  const spot=danger && Number.isFinite(danger.x) && Number.isFinite(danger.y)
    ? danger : {x:W.x-Math.cos(face)*20,y:W.y-Math.sin(face)*20};
  W.hp -= dmg; W.flee = 6; W.fleeX = spot.x; W.fleeY = spot.y; W.sleep = false;
  if (typeof spawnSpeech === "function") spawnSpeech(W.x, W.y - 16, W.hp > 0 ? "AAH!" : "", "#ff8a80", 0.8);
  if (W.hp <= 0) tfDie(p, how, by, origin);
  else if (typeof ecoOnCrime === "function" && by === "player" && opts.civilianConsequences !== false) ecoOnCrime("assault", W.x, W.y, p, how, origin);
}
function tfDie(p, how, by, origin) {
  if (!p.alive) return;
  p.alive = false;
  const W = p.w, x = W ? W.x : player.x, y = W ? W.y : player.y;
  if (W && typeof spawnCorpse === "function" && !(typeof AGE !== "undefined" && AGE.level >= 2)) { try { spawnCorpse(x, y, p.seed, 0, 0, 0, p.shirt, "#d7a98c", -1); } catch (e) { /* art */ } }
  tfMemDeath(p, how, by);
  if (typeof ecoOnCrime === "function" && by === "player" && opts.civilianConsequences !== false) ecoOnCrime("murder", x, y, p, how, origin);
  tfAlarm(x, y, 520, "death");
}

/* --- deaths, promotions, hiring, people going bad ---------------------------------------------- */
function tfMem() {
  if (typeof meta === "undefined") return { dead: {}, jobs: {}, news: [] };
  if (!meta.tfMem || typeof meta.tfMem !== "object") meta.tfMem = {};
  const wk = typeof itWorldKey === "function" ? itWorldKey() : "w";
  if (!meta.tfMem[wk]) { meta.tfMem[wk] = { dead: {}, jobs: {}, news: [], t: Date.now() }; const ks = Object.keys(meta.tfMem); if (ks.length > 10) { ks.sort((a, b) => meta.tfMem[a].t - meta.tfMem[b].t); delete meta.tfMem[ks[0]]; } }
  meta.tfMem[wk].t = Date.now();
  return meta.tfMem[wk];
}
function tfNews(txt) { const M = tfMem(); M.news.unshift({ t: SCN.day * 1440 + SCN.min, txt }); M.news.length = Math.min(M.news.length, 30); }
function tfMemDeath(p, how, by) {
  const M = tfMem(); M.dead[p.id] = { t: Math.round(SCN.day * 1440 + SCN.min), by, how };
  if (p.job) {
    const R = TF.bld.get(p.job.uid); if (!R) return;
    const J = R.jobs[p.job.s]; if (!J) return;
    // the replacement process: the deputy steps up (and someone below them), the bottom slot is hired for
    const above = J.rank;
    let gap = J.s;
    if (above < 2) {
      const next = R.jobs.find(q => q.rank === above + 1 && !q.open && TF.npc.get(q.id) && TF.npc.get(q.id).alive);
      if (next) {
        const np = TF.npc.get(next.id);
        J.id = next.id; np.job = { uid: R.uid, s: J.s }; np.mood = Math.min(1, np.mood + 0.15); np.promoted = { from: next.title, to: J.title, after: p.name, day: SCN.day };
        tfNews(np.name + " was promoted to " + J.title.toLowerCase() + " at " + (R.name || "the " + R.kind) + " after " + p.name + " died.");
        gap = next.s;
      }
    }
    const G = R.jobs[gap]; G.open = 1; G.hireAt = SCN.day * 1440 + SCN.min + 240 + Math.floor(Math.random() * 480);   // 4–12 game hours
    tfJobMemSave(R);
  }
}
function tfJobMemSave(R) { const M = tfMem(); M.jobs[R.uid] = R.jobs.map(j => [j.id, j.open ? 1 : 0, j.hireAt || 0]); }
function tfApplyMem(R) {
  const M = tfMem(), S = M.jobs[R.uid];
  for (const J of R.jobs) { const p = TF.npc.get(J.id); if (p && M.dead[p.id]) p.alive = false; }
  if (!S) return;
  S.forEach((e, s) => { const J = R.jobs[s]; if (!J) return; if (e[0] !== J.id) { let p = TF.npc.get(e[0]); if (!p) p = tfPerson(e[0], tfRng(tfHash(e[0])), { occ: "worker" }); p.job = { uid: R.uid, s }; p.shift = J.shift; J.id = e[0]; } J.open = e[1]; J.hireAt = e[2]; if (M.dead[J.id]) { const p = TF.npc.get(J.id); if (p) p.alive = false; } });
}
function tfJobsTick() {
  const now = SCN.day * 1440 + SCN.min, M = tfMem();
  for (const R of TF.bld.values()) {
    let ch = false;
    for (const J of R.jobs) {
      if (J.open && J.hireAt && now >= J.hireAt) {
        // hire: an unemployed resident nearby if there is one, else a newcomer
        let cand = null;
        for (const q of TF.npc.values()) if (q.alive && !q.bad && q.occ === "unemployed" && q.home) { cand = q; break; }
        const id = cand ? cand.id : R.uid + "/j" + J.s + "#" + (TF.hireSeq++) + "_" + SCN.day;
        const p = cand || tfPerson(id, tfRng(tfHash(id)), {});
        p.occ = "worker"; p.job = { uid: R.uid, s: J.s }; p.shift = J.shift; p.hired = { day: SCN.day, as: J.title }; p.mood = Math.min(1, p.mood + 0.2);
        J.id = p.id; J.open = 0; J.hireAt = 0; ch = true;
        tfNews((R.name || "The " + R.kind) + " hired " + p.name + " as " + J.title.toLowerCase() + ".");
      }
    }
    if (ch) tfJobMemSave(R);
  }
  // a few go bad: the jobless, the broke, the grieving — at night, near you, it becomes your problem
  if (SCN.mode === "economy" && Math.random() < 0.02) {
    // Active dispatch actors have their own explicit loss paths. Do not silently
    // replace a witness or support worker with an unrelated street enemy.
    const L = TF.walk.filter(p => p.alive && !p.bad && p.w && !p.w.inside && !p.w.jobContact && (p.occ === "unemployed" || p.mood < 0.35));
    const p = L[Math.floor(Math.random() * L.length)];
    if (p && typeof ecoTurnBad === "function") ecoTurnBad(p);
  }
}

/* --- the inner monologue ---------------------------------------------------------------- */
function tfWorkplace(p) { if (!p.job) return null; const R = TF.bld.get(p.job.uid); return R ? { R, J: R.jobs[p.job.s] } : null; }
function tfThoughts(p) {
  const h = scnHour(), act = tfActivity(p, h), T = [], W = tfWorkplace(p), r = tfRng(p.seed + Math.floor(SCN.min / 20));
  const pick = (a) => a[Math.floor(r() * a.length)];
  if (act === "commute") T.push(pick(["Late again. The boss is going to love this.", "Same street, same time, every day.", "Coffee first. Then the world."]));
  if (act === "homeward") T.push(pick(["Shift's done. Feet are killing me.", "Home, food, sleep. In that order.", "Another day, another few " + (typeof itFlavor === "function" ? itFlavor().cur : "credits") + "."]));
  if (act === "work" && W) T.push(pick(["If one more person asks for the manager…", "Keep busy and the shift goes faster.", "Somebody has to keep this place running.", W.J.rank === 0 ? "Payroll's due and the numbers don't add up." : "Smile. Customers are watching."]));
  if (act === "sleep") T.push(pick(["…zzz…", "…five more minutes…", "(dreaming of a quieter town)"]));
  if (act === "out") T.push(h < 12 ? pick(["Just need a few things from the store.", "Nice morning for a walk.", "Coffee. I need coffee."]) : h < 17 ? pick(["Lunch, then back to it.", "Errands, errands, errands.", "Maybe I'll treat myself today."]) : h < 23 ? pick(["Nice evening for a walk.", "I could go for a drink.", "One drink. Just one."]) : pick(["Can't sleep. Might as well walk.", "Streets are different at night."]));
  if (act === "home") T.push(pick(["Nothing good on tonight.", "These walls are too thin.", "I should call my mother."]));
  if (p.promoted) T.push("Never wanted it like this — I'm " + p.promoted.to.toLowerCase() + " now because " + p.promoted.after + " is gone.");
  if (p.hired) T.push("Day " + p.hired.day + " I got hired as " + p.hired.as.toLowerCase() + ". Somebody had to die for that job to open up. Don't think about it.");
  if (W && !p.promoted) { const dead = W.R.jobs.filter(j => j.open).length; if (dead) T.push("We're short-handed — " + dead + (dead > 1 ? " jobs" : " job") + " still open since the killings."); }
  if (p.occ === "unemployed") T.push(pick(["Three applications this week. Nothing.", "Rent's due Friday. I don't have it.", "Maybe the store's hiring. Somebody died there, I heard."]));
  if (p.occ === "retired") T.push(pick(["In my day this street was quiet.", "My knees know the weather before the news does."]));
  if (p.occ === "survivor") {
    T.length = 0;
    T.push(pick(["We board the windows before dark. Every night.", "Haven't seen a working car in weeks.", "Water's the thing. You can go days without food.", "Heard engines on the highway again. Raiders."]));
    T.push(pick(typeof APOC !== "undefined" && APOC.z !== "off" ? ["They're slower in the cold. Not slower enough.", "Don't shoot unless you have to. The noise brings more.", "I knew some of them. Before."] : ["It's the living you have to watch out for.", "Trade is fair here. Try us."]));
    if (act === "out") T.push("Scavenging. Two hours, then back before the light goes.");
  }
  if (typeof ecoThoughts === "function") for (const t of ecoThoughts(p, r)) T.push(t);
  if (p.mood < 0.3) T.push(pick(["Everything's going wrong lately.", "One more bad day and I don't know what I'll do.", "People like me don't get a fair shake."]));
  return T.slice(0, 4);
}
function tfTalkOpen(p) {
  if (!p || TF.panel) return;
  const W = tfWorkplace(p), act = tfActivity(p, scnHour()), home = p.home && TF.bld.get(p.home);
  const sh = p.shift ? scnTime(p.shift[0] * 60) + "–" + scnTime(p.shift[1] * 60) : "";
  const el = document.createElement("div"); el.id = "tfPanel";
  el.style.cssText = "position:fixed;left:50%;bottom:90px;transform:translateX(-50%);z-index:99970;width:min(480px,94vw);background:#081019ee;border:1px solid #ffd16688;border-radius:10px;padding:12px 14px;color:#dbe9f3;font-family:'Segoe UI',sans-serif;font-size:13px";
  let h = '<div style="display:flex;justify-content:space-between;align-items:baseline"><b style="font-size:16px;color:#ffd166">' + tfEsc(p.name) + '</b><span style="color:#89a">' + p.age + " · " + tfEsc(W ? W.J.title + (W.R.name ? " at " + W.R.name : "") : ({ retired: "Retired", student: "Student", unemployed: "Out of work", commuter: "Works out of the area", survivor: "Survivor" }[p.occ] || "")) + "</span></div>";
  h += '<div style="color:#9ab;margin:2px 0 8px">' + TF_ACT_TXT[act] + (sh ? " · shift " + sh : "") + (home && home.name ? " · lives at " + tfEsc(home.name) : "") + "</div>";
  h += tfThoughts(p).map(t => '<div style="font-style:italic;color:#e8f0f6;margin:3px 0">💭 “' + tfEsc(t) + "”</div>").join("");
  h += '<div style="display:flex;gap:8px;margin-top:10px;justify-content:flex-end">' + (SCN.mode === "economy" ? '<button class="btn" id="tfRob" title="A crime if anyone sees">💰 ROB</button><button class="btn" id="tfHit" title="Assault — witnesses call the police">👊 ATTACK</button>' : "") + (p.occ === "survivor" ? '<button class="btn" id="tfTrade" title="Barter at apocalypse prices">🔁 TRADE</button>' : "") + '<button class="btn" id="tfBye">✔ BYE</button></div>';
  el.innerHTML = h; document.body.appendChild(el); TF.panel = el; TF.panelP = p;
  el.querySelector("#tfBye").onclick = tfTalkClose;
  const rob = el.querySelector("#tfRob"); if (rob) rob.onclick = () => { tfTalkClose(); if (typeof ecoRob === "function") ecoRob(p); };
  const hit = el.querySelector("#tfHit"); if (hit) hit.onclick = () => { tfTalkClose(); if (typeof ecoAttackCivilian === "function") ecoAttackCivilian(p); };
  const tr = el.querySelector("#tfTrade"); if (tr) tr.onclick = () => { tfTalkClose(); const hb = p.home && TF.bld.get(p.home); if (typeof ecoKioskOpen === "function") ecoKioskOpen({ b: hb ? hb.b : null, kind: "holdout", shop: true, barter: true, who: p.name, f: { t: "none" }, fi: -1, x: player.x, y: player.y }); };
  if (p.w) { p.w.idle = 6; p.w.face = Math.atan2(player.y - p.w.y, player.x - p.w.x); }
}
function tfTalkClose() { if (TF.panel) { TF.panel.remove(); TF.panel = null; TF.panelP = null; } }
function tfEsc(s) { return String(s || "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c])); }
function tfNearestWalker(r) { let best = null, bd = r; for (const p of TF.walk) { const W = p.w; if (!W || !p.alive) continue; const d = Math.hypot(W.x - player.x, W.y - player.y); if (d < bd) { bd = d; best = p; } } return best; }

/* --- drawing -------------------------------------------------------------------------- */
const TF_SPEC = { n: "", b: "h", c: ["#888", "#555", "#333"], hd: "hair", w: "none", r: 0, k: 0, s: 0.95, x: "" };
function tfRender(g) {
  if (!TF.on || !TF.walk.length || typeof erBodyHuman !== "function") return;
  const here = typeof cityBuildingAt === "function" ? cityBuildingAt(player.x, player.y) : null;
  for (const p of TF.walk) {
    const W = p.w; if (!W) continue;
    if (Math.abs(W.x - player.x) > 1500 || Math.abs(W.y - player.y) > 1100) continue;
    if (W.inside && (!here || here.uid !== W.inside)) continue;   // indoors: only seen from inside
    if (typeof cityVisibleAt === "function" && !cityVisibleAt(W.x, W.y)) continue;
    const S = TF_SPEC; S.c[0] = p.shirt; S.c[1] = p.pants; S.c[2] = p.bad ? "#c62828" : "#3a2a1a"; S.hd = p.head; S.s = p.age < 18 ? 0.8 : 0.95;
    const moving = Math.hypot(W.vx, W.vy) > 6, walk = moving ? runTime * 9 + (p.seed % 7) : 0;
    g.save(); g.translate(W.x, W.y);
    if (W.sleep) { g.rotate(Math.PI / 2); g.globalAlpha = 0.9; }
    g.scale(S.s, S.s);
    try { erBodyHuman(g, S, 100000 + (p.seed % 50000), W.face, walk, 0, false, false); } catch (e) { g.fillStyle = p.shirt; g.beginPath(); g.arc(0, 0, 6, 0, 7); g.fill(); }
    g.restore();
    // Only label the actual visible mission actor; do not reveal them through
    // city fog or create a marker for an absent/unspawned person.
    if ((p.jdSupport || p.jdClinic) && p.alive) {
      const label=p.jdClinic ? "CLINIC CONTACT" : "SUPPORT",width=p.jdClinic ? 80 : 48;
      g.save();g.font="bold 9px sans-serif";g.textAlign="center";g.fillStyle="rgba(20,20,20,.8)";g.fillRect(W.x-width/2,W.y-44,width,12);g.fillStyle="#ffe292";g.fillText(label,W.x,W.y-35);g.restore();
    }
    if (W.sayT > runTime && W.say) { g.save(); g.font = "bold 9px sans-serif"; g.textAlign = "center"; g.fillStyle = "rgba(0,0,0,0.55)"; const tw = g.measureText(W.say).width + 8; g.fillRect(W.x - tw / 2, W.y - 34, tw, 12); g.fillStyle = "#fff"; g.fillText(W.say, W.x, W.y - 25); g.restore(); }
    if (W.sleep && (TF.frame >> 4) % 3 === 0) { g.fillStyle = "#cfd8dc"; g.font = "9px sans-serif"; g.fillText("z", W.x + 8, W.y - 12); }
  }
}
// lit windows at night: homes with people awake, workplaces on shift (js/scenario.js asks)
function townsLights(push) {
  if (!TF.on || !TF.nearList) return;
  const h = scnHour();
  for (const b of TF.nearList) {
    const R = TF.bld.get(b.uid); if (!R) continue;
    const wx = (b.x + b.cw / 2) * 16 - CITY.orx, wy = (b.y + b.ch / 2) * 16 - CITY.ory;
    if (Math.abs(wx - player.x) > 1500 || Math.abs(wy - player.y) > 1100) continue;
    let lit = false;
    for (const J of R.jobs) { const p = TF.npc.get(J.id); if (p && p.alive && !J.open && tfIn(h, J.shift[0], J.shift[1])) { lit = true; break; } }
    if (!lit && R.res.length && (h >= 18 && h < 23.5 || h >= 6 && h < 7.5)) lit = (tfHash(b.uid + Math.floor(h)) & 3) !== 0;
    if (lit) push(wx, wy, Math.min(260, 40 + Math.max(b.cw, b.ch) * 5), 0.5, "window");
  }
}

/* --- hooks -------------------------------------------------------------------------------- */
(function tfWire() {
  const _fit = window.findInteractTarget, _twi = window.triggerWorldInteract;
  if (typeof _fit === "function") window.findInteractTarget = function () {
    const t = _fit();
    if ((t && t.kind !== "itCont" && !(t.kind && t.kind.startsWith("acc"))) || !TF.on || !player || player.inVehicle) return t;
    if (TF.talkT !== runTime) {
      TF.talkT = runTime;
      const p = tfNearestWalker(t ? 30 : 44);   // someone right next to you beats the cupboard, the ladder and the roof vault
      TF.talk = p ? { kind: "tfTalk", p, x: p.w.x, y: p.w.y - 20, label: "[F] TALK — " + p.name.split(" ")[0] } : null;
    }
    return TF.talk || t;
  };
  if (typeof _twi === "function") window.triggerWorldInteract = function () {
    if (TF.on && player && !player.inVehicle) { const t = findInteractTarget(); if (t && t.kind === "tfTalk") { if (TF.panel) tfTalkClose(); else tfTalkOpen(t.p); TF.talkT = -1; return; } }
    return _twi();
  };
  if (typeof noiseEmit === "function") { const _ne = noiseEmit; window.noiseEmit = function (x, y, L0, kind, src, data) { const r = _ne.apply(this, arguments); if (TF.on && L0 >= 95 && (src === 2 || src === undefined)) tfAlarm(x, y, Math.min(900, L0 * 6), kind || "noise"); return r; }; }
  if (typeof spawnBlastWave === "function") {
    const _sb = spawnBlastWave;
    window.spawnBlastWave = function (x, y, R, color, owner) {
      const r = _sb.apply(this, arguments);
      // A visual ring is not necessarily an explosion (revival, magic effects,
      // and enemy hit flashes use it too). Only an explicitly caused blast hurts.
      if (TF.on && owner) {
        const by = ["player", "squad", "enemy", "unknown"].includes(owner) ? owner : "unknown";
        for (const p of TF.walk.slice()) { const W = p.w; if (W && Math.hypot(W.x - x, W.y - y) < (R || 68) * 1.1) tfHurt(p, 40, "blast", by, null, {x,y}); }
        tfAlarm(x, y, 700, "blast");
      }
      return r;
    };
  }
  window.addEventListener("keydown", e => { if (e.code === "Escape" && TF.panel) tfTalkClose(); });
  if (typeof V10 !== "undefined") {
    V10.onRunStart.push(() => {
      TF.on = typeof CITY !== "undefined" && CITY.on && (SCN.mode === "economy" || SCN.mode === "apoc");
      TF.bld.clear(); TF.npc.clear(); TF.walk.length = 0; TF.regT = 0; TF.nearList = null; tfTalkClose();
    });
    V10.onStep.push(tfStep);
    V10.onRenderWorld.push(tfRender);
    V10.onRunReset.push(() => { TF.on = false; TF.walk.length = 0; tfTalkClose(); });
  }
})();
// Optional assist for straight-projectile auto-fire. It checks the actual
// spawned direction of each projectile, so independent hands and spread are
// treated independently. It is not a prediction for blasts, ricochets,
// utilities, unknown civilians or every weapon effect.
const TF_AUTO_FIRE = { context: null, heldUntil: 0 };
function tfAutoFireAllowed(x, y, vx, vy, life, rad, style, enemy, sourceKind) {
  const context = TF_AUTO_FIRE.context;
  if (!context || enemy || (sourceKind != null && sourceKind !== 0) || (style !== 3 && style !== 4 && style !== 5) ||
      !TF.on || !CITY.on || !player || (typeof flyGroundSeparated === "function" && flyGroundSeparated())) return true;
  const speed = Math.hypot(vx, vy);
  if (!(speed > 1) || !(life > 0) || !Number.isFinite(rad)) return true;
  const ux = vx / speed, uy = vy / speed, reach = Math.min(1000, speed * life + 20);
  for (const p of TF.walk) {
    const q = p && p.w; if (!p || !p.alive || !q || !(q.hp > 0)) continue;
    const dx = q.x - x, dy = q.y - y, along = dx * ux + dy * uy;
    const bodyRadius = Math.max(0, rad) + 7;
    // The projectile appears 20 px ahead, but its body may already overlap a
    // person whose centre is slightly behind that muzzle point.
    if (along < Math.max(0, 20 - bodyRadius) || along > reach + bodyRadius || Math.abs(-dx * uy + dy * ux) > bodyRadius) continue;
    // Sight is a conservative knowledge test; F_SHOT matches the current
    // solid-wall stop rule, while unblocked windows remain traversable.
    if (!cityLOS(player.x, player.y, q.x, q.y)) continue;
    const beforePerson = Math.max(20, along - bodyRadius);
    if (cityRay(x + ux * 20, y + uy * 20, x + ux * beforePerson, y + uy * beforePerson, F_SHOT, 900).hit) continue;
    context.blocked++;
    TF_AUTO_FIRE.heldUntil = runTime + .9;
    return false;
  }
  return true;
}
function tfAutoFireSpawned(enemy, sourceKind) {
  if (TF_AUTO_FIRE.context && !enemy && (sourceKind == null || sourceKind === 0)) TF_AUTO_FIRE.context.spawned++;
}
(function tfAutoFireWire() {
  if (typeof window.fireWeapon !== "function") return;
  const fire = window.fireWeapon;
  window.fireWeapon = function () {
    if (opts.autoFireSafety !== true || !TF.on || !CITY.on) return fire.apply(this, arguments);
    const previous = TF_AUTO_FIRE.context, context = { blocked: 0, spawned: 0 };
    TF_AUTO_FIRE.context = context;
    let result;
    try { result = fire.apply(this, arguments); }
    finally { TF_AUTO_FIRE.context = previous; }
    if (!context.blocked) TF_AUTO_FIRE.heldUntil = 0;
    return context.blocked && !context.spawned ? false : result;
  };
  if (typeof V10 !== "undefined") {
    V10.onRenderScreen.push(g => {
      if (!runActive || opts.autoFireSafety !== true || TF_AUTO_FIRE.heldUntil <= runTime) return;
      g.save(); g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1; g.globalCompositeOperation = "source-over";
      g.font = "bold 12px sans-serif"; g.textAlign = "center"; g.textBaseline = "middle";
      const x = W / 2, y = Math.max(32, H * .16); g.fillStyle = "rgba(30,20,4,.9)"; g.fillRect(x - 94, y - 13, 188, 26);
      g.fillStyle = "#ffd166"; g.fillText("HOLD FIRE · CIVILIAN", x, y); g.restore();
    });
    V10.onRunReset.push(() => { TF_AUTO_FIRE.context = null; TF_AUTO_FIRE.heldUntil = 0; });
  }
})();

// Off-screen caution, not omniscient detection or a shot guarantee. Only
// locally simulated, awake civilians with direct sight from the player count.
// One marker per quadrant limits clutter; unobserved areas remain unknown.
const TF_WARNING = { t: 0, items: [] };
function tfWarningCollect() {
  if (!runActive || !player || !CITY.on || !TF.on || opts.civilianWarning === false || (typeof flyGroundSeparated === "function" && flyGroundSeparated())) return [];
  const cam = typeof fxCamOut !== "undefined" ? fxCamOut : null, z = opts.zoom * (cam ? cam.zoom || 1 : 1);
  const cx = W * .5 + (cam ? cam.sx || 0 : 0), cy = H * .5 + (cam ? cam.sy || 0 : 0);
  const fx = cam ? cam.fx || 0 : 0, fy = cam ? cam.fy || 0 : 0, sectors = [null, null, null, null];
  for (const p of TF.walk) {
    const q = p && p.w; if (!p || !p.alive || !q || q.hp <= 0 || q.sleep) continue;
    const dx = q.x - player.x, dy = q.y - player.y, d = Math.hypot(dx, dy);
    if (d < 1 || d > 1000) continue;
    const sx = cx + (dx - fx) * z, sy = cy + (dy - fy) * z;
    if (sx >= 0 && sy >= 0 && sx <= W && sy <= H) continue;
    if (!cityLOS(player.x, player.y, q.x, q.y)) continue;
    const a = Math.atan2(dy, dx), k = (Math.round(a / (Math.PI / 2)) + 4) % 4;
    if (!sectors[k] || d < sectors[k].d) sectors[k] = { a, d };
  }
  return sectors.filter(Boolean);
}
function tfWarningStep(dt) {
  TF_WARNING.t -= dt;
  if (TF_WARNING.t <= 0) { TF_WARNING.t = .2; TF_WARNING.items = tfWarningCollect(); }
}
function tfWarningRender(g) {
  if (!runActive || !player || !CITY.on || !TF.on || opts.civilianWarning === false || (typeof flyGroundSeparated === "function" && flyGroundSeparated())) return;
  const cam = typeof fxCamOut !== "undefined" ? fxCamOut : null, z = opts.zoom * (cam ? cam.zoom || 1 : 1);
  const x = W * .5 + (cam ? cam.sx || 0 : 0) - (cam ? cam.fx || 0 : 0) * z, y = H * .5 + (cam ? cam.sy || 0 : 0) - (cam ? cam.fy || 0 : 0) * z;
  const r = Math.min(82, Math.min(W, H) * .2);
  g.save(); g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1; g.globalCompositeOperation = "source-over";
  g.font = "bold 11px sans-serif"; g.textAlign = "center"; g.textBaseline = "middle";
  for (const q of TF_WARNING.items) {
    const px = x + Math.cos(q.a) * r, py = y + Math.sin(q.a) * r;
    g.fillStyle = "rgba(28,20,4,.9)"; g.strokeStyle = "#ffd166"; g.lineWidth = 2;
    g.beginPath(); g.arc(px, py, 13, 0, Math.PI * 2); g.fill(); g.stroke();
    g.fillStyle = "#ffd166"; g.fillText("CIV", px, py);
  }
  g.restore();
}
V10.onStep.push(tfWarningStep);
V10.onRenderScreen.push(tfWarningRender);
V10.onRunStart.push(() => { TF_WARNING.t = 0; TF_WARNING.items = []; });
V10.onRunReset.push(() => { TF_WARNING.t = 0; TF_WARNING.items = []; });
// EOF:js/townsfolk.js
