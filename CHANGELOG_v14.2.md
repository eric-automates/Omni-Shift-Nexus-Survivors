# OMNI-SHIFT: NEXUS SURVIVORS — v14.2 (2026-11-01)

Base: v14.1 (GitHub `main`). 52 files changed · 10,632 lines added · 328 changed or removed · 23 new modules (9,523 lines), plus `data/realmap/` (28 files, ≈ 40 MB — shipped in the zip, kept out of the git history). Existing code was touched surgically; most changes go through hooks and wrappers.

Version 14.2 is the big one you asked for: an age setting, real maps of Indiana (and any city online), homeworlds for every universe, three scenarios (Survivors, Post-Apocalyptic, a simulated economy), searchable furniture, capsules and a courier, flight for everything that flies, the Ki-Surge class in place of all 40K content, three new Star Wars heroes and rivals who come back when you out-run them. Each task went through the same process as before: build it → check that it does what you asked → optimise it → check it still fits the whole. Then the whole game was re-tested.

Everything stays a static GitHub Pages site: no installs, no launchers, no servers, the same folder layout. The only new folder is `data/realmap/` (the offline Indiana maps, ≈ 40 MB in 28 files, each well under GitHub's 25 MB web-upload limit).

---

## 1. Age-appropriate content (`js/agefilter.js`)
- **Options → 🛡️ Age-Appropriate Content**, three levels, each with its explanation on screen:
  - **OFF** — the full experience (bisections, dismemberment, blood, bodies).
  - **NORMAL** — no slicing or dismemberment: foes fall whole. Blood becomes a quick pop of **sparks** (or blue / green / nothing) with no drips, pools or stains.
  - **STRONG** — very mild: no blood, no bodies, no gory finishers; foes vanish in a sparkle, EXECUTE becomes TAKEDOWN, words are softened ("kill" → "defeat").
- Optional 4-digit **parent PIN**: raising the level is free, lowering it asks for the PIN.
- Gameplay is unchanged: the filter wraps the gore spawners, so corpses still exist invisibly (the necromancer can still raise them).

## 2. Carrying weapons (`js/sheathe.js`, `js/weaponart.js`)
- **Steel blades sheathe on the back** (scabbard) and draw themselves when a fight starts; **guns sit at low ready**. Both are Options rows (ALWAYS IN HAND is still there).
- Steel never "retracts" like a lightsaber. **Only lightsabers glow**; shooters no longer carry glowing blades.

## 3. Star Wars: Qui-Gon, The Count, Old Ben (`js/heroreg.js`, `js/saga.js`)
- **#81 Qui-Gon** (Makashi → Ataru; meditation heal, Force Speed, mind trick), **#82 The Count** (Makashi master; straight-line fingertip lightning that grows longer as he levels; Force throw), **#83 Old Ben** (Soresu master; shelter, High Ground, mind trick).
- Names: Luke → **Luke**, Windu → **The Jedi Master Duelist**.
- **Film ignitions** for every saber hero, each with variations (Vader, Maul's slow second blade, Yoda's hilt flying to his hand, Sidious from the sleeve, Luke's catch, Obi-Wan + Qui-Gon together, Windu, Dooku's Makashi salute, Grievous's collection).
- **Form matchups:** lightsaber users only, +25 %, bonuses only.

## 4. 📍 Location: homeworlds, worlds and the real map (`js/regiongen.js`, `js/regionsites.js`, `js/regionart.js`, `js/regionworlds.js`, `js/location.js`, `js/locals.js`)
- **Main menu → 📍 LOCATION**:
  - **HOMEWORLD:** your hero's own world, built as close to the films as it can be, and **a different one every run**.
  - **CHOOSE A WORLD:** visit any universe's homeworld; its locals and its enemies come with it.
  - **CLASSIC NEXUS CITY:** exactly v14.1 (seed-locked, verified by hash).
  - **REAL MAP:** see below.
- **The worlds:**
  - *Organic:* Tatooine (towns with domes and docking bays, moisture farms, Tusken camps, a sandcrawler, krayt bones, the Sarlacc, Jabba's palace, a podrace arena), Abydos, Persephone, Arrakis, LV-426, Ki-Surge Earth (West City's capsule domes, Kame House, a tournament stage), Black Mesa, The Continent and the Highlands.
  - *Grid:* the Midwest, Night City and Starfleet Earth.
- **Seeds:** a brand-new world every run, KEEP to stay, or type a seed. Markers and the drop zone are remembered per world.
- **The creator's "HAILS FROM"** picks your own hero's homeworld, including **Real Life**.
- **Edge roads:** a ring road or beltway around every world. **Airports** in most cities, with aircraft parked on the aprons.
- **Natives:** Tusken Raiders and others live on their worlds (and leave their own people alone). **Jawas** live round every sandcrawler on Tatooine: they potter about the ramp and the scrap piles, chatter ("Utinni!"), scatter when shots ring out and come back when it's quiet, and **[F] TRADE** opens their stall (scrap, parts, salvage).

### 4.1 Real map (`js/realdata.js`, `js/realgen.js`, `js/realart.js`, `js/realui.js`, `tools/realmap-build.js`)
- **🏛️ INDIANA CITY (offline, shipped in `data/realmap/`):**
  - Indianapolis (default), Carmel, Fishers, Noblesville, Gary, Greenwood, Kokomo, Westfield, Lebanon, Beech Grove, Brazil, Sheridan, Thorntown and Clay City.
- **🌍 ANY CITY IN THE WORLD (online):** search any place. The map is streamed from OpenFreeMap and cached for the next visit.
- **The map itself:**
  - 48 km across with the city in the middle.
  - Every real road, river, lake, park and building, with real names.
  - Microsoft's building footprints fill in the ≈ 500,000 houses OpenStreetMap lacks in small towns.
  - Interiors, all on one floor.
- **The border:** **Highway 365 — Under Construction** rings the edge on every map. You can drive it and turn around on it; lanes close, crews work, traffic cops direct, and you can't leave.
- **WHO'S AFTER YOU:**
  - *Snuck In:* real locals, plus bounty hunters from your own universe who followed you; lawful ones keep to local rules.
  - *Invasion*, *Locals Only*, *Open Season* (any hero can come to collect).
- **Housekeeping:** a first-start disclaimer (art/parody, not affiliated) and on-screen attribution (OpenStreetMap / OpenMapTiles / OpenFreeMap / Microsoft, ODbL; `data/realmap/LICENSE.md`).
- **Loading cost:** a start in Indianapolis downloads ≈ 2.4 MB (overview + the city core); the rest streams in as you travel. If the map files are missing, the game streams Indiana online, then falls back to a generated map with a banner.

## 5. Scenarios, day & night (`js/scenario.js`)
- **📍 LOCATION → SCENARIO:**
  - **🛡️ SURVIVORS** — the game as it was, with optional day & night.
  - **☢️ POST-APOCALYPTIC.**
  - **🏙️ SIMULATED ECONOMY.**
- **SURVIVAL NEEDS** (food, water, ammo) is an option for the last two, off by default.
- **Clock:** 1 game hour = 1 real minute.
- **Night:** a single low-resolution light map (street lights, headlights, lit windows, your own light), so it stays fast.

## 6. Simulated economy (`js/townsfolk.js`, `js/economy.js`)
- **Townsfolk:**
  - Every home has residents and every workplace its staff (manager, deputy, the rest), with real shifts.
  - Commuters at rush hour, clerks behind counters, sleepers at 3 a.m. Nobody far away is simulated step by step; their schedule says where they are.
- **[F] TALK:** name, job, shift and what's on their mind (prices, the coworker who died and the promotion that came with it, the stranger with the bounty…).
- **Deaths are permanent:** the deputy is promoted, the shop hires someone within a few game hours, or the job stays open and the shelves run low. A few people go bad.
- **World finances:** workplaces produce while their people are on shift, homes consume, and stock and prices follow. Kill the only pharmacist and med kits get expensive.
- **Buying and selling:** at a counter while someone is serving, or at any terminal (the courier delivers). Fines can be paid there too.
- **The law:** assault, robbery, murder and theft count only when someone sees them (self-defence doesn't count).
  - The escalation: ★ security & armed citizens → ★★ police → ★★★ SWAT → ★★★★ the military → ★★★★★ your universe's elite.
  - Out of sight, the heat cools down.
  - Bounty hunters keep to the law, except the lawless kind.

## 7. Post-apocalyptic (`js/apoc.js`)
- **The look:** a dusty, washed-out world, burnt-out wrecks (a few still run), rubble, weeds and smoke.
- **Loot:** more in every cupboard, plus caches in the streets.
- **People:** raider parties on the roads, and holed-up survivors in barricaded houses (talk and trade).
- **ZOMBIES: OFF / A FEW / HORDE.** Walkers, runners, crawlers and brutes. Noise draws them, they're bolder at night, and gunfire pulls in more.

## 8. Searchable furniture, capsules and the courier (`js/items.js`)
- **Searching:** every cabinet, shelf, fridge, desk, locker, safe, gun rack… can be searched. Contents are **rolled on first opening and remembered per world**.
- **Rare ★ UNIQUE weapons** start at LV 3. Med kits and stims use themselves when needed.
- **🎒 bag (I):**
  - **Wallet**, in each universe's currency.
  - **Supplies.**
  - **Pocket Capsules:** throw one and a ship or car pops out, yours to pilot.
  - **Courier (drone disposal):** send away a weapon you don't want and get paid what it's worth. It's a probe droid, raven, owl, delivery drone or transporter beam, depending on the universe.

## 9. Flight (`js/flight.js`)
- **What flies:**
  - Aircraft: helicopters, planes and airliners at the airports.
  - Every universe's ships and flying cars.
  - Capsule ships.
  - **Heroes who fly by themselves:** jetpacks, boosters, suspensors, dark & hex flight, brooms, ki flight.
- **Handling:**
  - Soft-Newtonian: you keep drifting until thrust or drag says otherwise.
  - **⏹ HOVER (H)** kills the drift.
  - **SAFE / UNSAFE (K, asks first):** assists off, double top speed, red cabin lights.
  - **👁 Cockpit view (C).**
  - **F** gets out; above the rooftops you bail out with a parachute.
- **Altitude:**
  - From the treetops to the edge of space; the view widens until the whole map fits.
  - The air thins above ~35 km.
  - Clouds and haze.
  - Ground detail steps down in levels (Nanite-style), so it stays light.
- **Damage:** engines, wings, rotor, tail, gear and cockpit take damage, and a crash breaks the craft apart.

## 10. The Ki-Surge class — all 40K content removed (`js/kisurge.js` + the source tables)
- **The faction:**
  - Faction #6 is now **Ki-Surge**.
  - **Heroes:** **Goku** (free starter), **Vegeta**, **Piccolo**, **Trunks**, **Gohan**, **Frieza**, **Cell**, **Android 16**, **Android 17** and **Android 18**.
  - The roster now has 88 heroes. Grievous moves back to Star-Sector.
  - Each hero has their own look, with 3 head styles each (golden hair, Goku's headband, Gohan's bowl cut, Piccolo's turbans, Frieza's horned first form…), tails for Frieza and Cell, and bare-handed ki glow instead of guns. Trunks carries a steel sword on his back.
- **Power-up:**
  - **Hold R (or 🔥)** to charge ki with a flame aura.
  - **The Saiyans reach the GOLDEN FORM** (the regular golden form only) for 36 s, with golden hair and stats up; the stats are restored afterwards.
  - Frieza's **FULL POWER**, Cell's **PERFECT POWER**, Piccolo's **NAMEKIAN FOCUS**.
  - The androids' **OVERDRIVE** needs no charging.
- **Instant Transmission:**
  - **T / IT button.** Goku (or a Cell who absorbed it) opens a dark aiming map with a glowing **IT** reticle.
  - A tap jumps him there after fingers-to-forehead and static.
  - **No marker is ever placed** (jump, cancel or ESC), and the recharge is 1 s.
- **Cell absorbs:**
  - Finishing a rival (or the tail strike on a weakened one) absorbs **one natural ability from every hero in the game** (89 entries, 19 kinds).
  - Yoda gives levitation (hazard-proof) and Yoda's way of speaking ("Every one of you, I will crush.").
- **Drops:** ki techniques only drop for a killer who can use them. Trunks's sword drops for anyone.
- **Flight:** **KI FLIGHT (G)** for all ten (fast, high ceiling, ki trail).
- **The rest of the class:**
  - **Earth's Defenders** squad (Krillin, Yamcha, Tien, Chiaotzu, Yajirobe).
  - Enemy rosters: Frieza Force, Red Ribbon Army, Cell Juniors, Earth's Defenders.
  - The **Rocky Battle Plains** arena biome and the Capsule-Age city.
  - A **KI BLAST FINISH** glory kill and career stances (Turtle School Student → Saiyan Warrior → Earth's Mightiest…).
- **Removed:** every 40K name and art piece is gone from heroes, factions, rosters, squads, relics, biomes, city names, shops and vehicles (a QA test scans every table). The gothic city theme is now a neutral "Gothic Spire City".

## 11. Rivals you out-run come back (`js/rivalchase.js`)
- **Evading:** drive, fly, Instant-Transmit or run more than 350 m from a rival and stay away for 6 s. You get **"RIVAL EVADED · BOUNTY UP"**: the whole team leaves and any duel ring closes.
- **🎯 Bounty:** the price on your head goes up a star.
- **The return:** 60–100 s later the **same rival comes back with +1 partner per evasion** (max 4) from its own universe.
- **The payoff:** finish the returning leader to **claim its stake** (cash and an XP burst); the bounty drops again.

## 12. Found and fixed along the way
- Ki heroes in the old 40K slots inherited bullets, ammo use, a jetpack, a helmet, a thermal visor, an innate Cadian squad, a servo-skull weapon drawing and steel or bolter sounds. All of that is gone.
- Trunks's sword is in the steel lists (no glow, back scabbard). Back-gear outfit slots no longer draw capes on characters who don't wear one.
- The guide's "Imperial hive" wording is gone. The music player's probe for an optional 22nd track shows as a harmless 404 in dev tools.

## 13. Tests
- `qa/run.py all`: 8 packs (core, combat, sabers, duels, heroes, city, vehicles, v142). The v142 pack covers every 14.2 feature, including:
  - Ki-Surge K01–K06: roster and 40K scan, power-up and forms, Instant Transmission (no marker, ≤ 1 s), Cell absorbs, drops, ki flight and the class's look.
  - Rival evasion: R21. Jawas: R22.
- `qa/perf.py`: arena, city and drive ≈ 60 fps; flight at 150 m 47–52 fps, at 5 km and 60 km ≈ 58–60; economy day 60, night 55; horde 59.
- `qa/static.py`: module order, EOF markers, boot probes, no map packs inside the repo.

## 14. Upload
See `UPLOAD_v14.2.md` in the delivery folder. Upload in two batches (the web uploader takes ≤ 100 files at a time): first the code, then `data/realmap/`.
