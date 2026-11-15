# OMNI-SHIFT `v16.0-s06` — Final Release & QA Certification Report

- **Release Version:** `v16.0-s06` (Cache-Bust Tag: `?v=16.0-s06-10`)
- **Date:** 2026-11-14
- **Baseline Reference:** `v15.6.6-LOCKED` / GitHub `main` commit `41f85d5c0d1ee8c4d962e4a9167901cb9c0ecf5b` (preserved untouched in `/home/user/baseline-v15.6.6`, `RESTORE_SHA256SUMS.txt` **82/82 OK**)
- **Staging Source Tree:** `/home/user/staging` (`RESTORE_SHA256SUMS.txt` **82/82 OK**, `SHA256SUMS` **89/89 OK**)
- **Drop-In Deploy Archive:** `/home/user/omni-shift-v16.0-s06-release.zip` (excludes `music/` and `data/realmap/` so live user media & GeoJSON packs are never overwritten)
- **Release Gate Verdict:** **PASS — PRODUCTION READY (10/10 Playwright QA Suites PASS · 79/79 JS Syntax OK · 78/78 Runtime Scripts & EOF Clean · 0 Page Errors · 0 Console Errors · 0 Unexpected 404s · 0 HUD/DOM Overlaps)**

---

## 1. Executive Summary

The **S06 10-Step Full-Codebase Modernization & Polish Pass** upgraded **54 runtime files** (`index.html`, `css/style.css`, and **52 of 79** `js/*.js` modules; **+2650 / -841 lines**) plus **4 repository release-metadata & checksum files** (`CURRENT_REVISION.md`, `UPDATE_INSTRUCTIONS.txt`, `RESTORE_SHA256SUMS.txt`, `SHA256SUMS`).

Every runtime subsystem — from the 88 canonical heroes + `#80` Custom Hero Creator, 8-directional biomechanical locomotion for players and 220 enemy specs, combat & saber forms, vehicles & free flight, regional worlds & Indianapolis Real Map, 11 dispatch career contracts, simulated economy, Ki-Surge Planet Decay, Proving Ground, Age Filter, SaveBackup, and zero-overlap Desktop/Mobile HUD — was audited, hardened, unified on `?v=16.0-s06-10`, and end-to-end verified across **10 automated Playwright suites** with visual contact-sheet inspection.

---

## 2. Step-by-Step S06 Completion Ledger (Steps 1/10 – 10/10)

| Step | Scope | Key Engineering Deliverables | Automated QA Suite | Status |
|---|---|---|---|---|
| **1/10** | Hero Registry, Health Telemetry & Real Map Restoration | Restored canonical **88/88** hero registry + `#80` Creator (**89/89** total slots), dynamic **78/78** script/EOF scanner in Health UI, Indianapolis Real Map, and `#81` Qui-Gon Jinn. | `test_hero_registry_health.js` | **PASS** |
| **2/10** | Player 8-Dir Biomechanical Walk Cycle | Unified 8-directional locomotion gait, foot-plant kinematics, arm/torso counter-swing, smooth idle settle (`walkBlend -> 0`), and front-facing roster portraits. | `test_player_walk_cycle.js` | **PASS** |
| **3/10** | All 89 Hero Archetypes, Special Bodies & Weapon Postures | Audited & upgraded all 89 hero rigs (droids, Yoda shuffle & Force-leap tuck, quadrupeds, capes/cloaks, Super Saiyan aura), gun carry postures (`lowready`/`aim`/`holster`), saber ignited vs stowed arm swing, and speeder seated reset. | `test_hero_archetypes.js` | **PASS** |
| **4/10** | NPC, Enemy, Squad, Ally & Townsfolk Locomotion | Upgraded all **220** enemy specs × 8 directions plus squadmates, summons, locals, and townsfolk onto unified directional gait & ground shadow rendering. | `test_npc_locomotion.js` | **PASS** |
| **5/10** | Combat, Weapons, Saber Forms & Extended Cast | Hardened hitboxes, melee/gun/projectile combat, Saber Forms I–VII, gun art, and extended cast `#81`–`#88` (`Qui-Gon`, `Darth Maul`, `Mace Windu`, `Frieza`, `Piccolo`, `Gohan`, `Trunks`, `Broly`). | `test_combat_weapons.js` | **PASS** |
| **6/10** | Vehicles, Flight & World Systems | Audited vehicle handling, crash crumple/headlights, squad mount-up, free flight altitude (`Z`) & air-speed scaling, traffic, police pursuit, rival chase, and city destruction. | `test_vehicles_flight_world.js` | **PASS** |
| **7/10** | Regional Worlds, Real Map & Minimap | Verified all regional worlds (Tatooine, Arrakis, Night City, Highlands, Continent, LV-426, Ki-Earth, SF-Earth, Midwest, Nexus City), Indianapolis Real Map streaming & UI, and minimap/world-map overlays. | `test_world_regions_realmap_minimap.js` (16/16) | **PASS** |
| **8/10** | Jobs/Dispatch, Economy, Ki-Surge & Custom Creator | Verified all **11** dispatch career contracts (`patrol`, `paramedic`/EMT, `fire`, `tactical`, `vehicle`), `#80` Creator multi-track career progression, simulated economy, Frieza `#84` Death Ball & Planet Decay, campaign/showdown, and SaveBackup round-trip. | `test_jobs_economy_kisurge_creator.js` (11/11) | **PASS** |
| **9/10** | HUD, Controls, Menus, Proving Ground & Audio | Unified `Escape`/`P` modal close stack & `uiTypingInField()` input guards across 22 modules, fixed `timeRewind` self-CD & ghost-vehicle rewind, hardened Glory Kill pause-safety & Age Filter `STRONG`, verified Proving Ground **14/14** across `#0/#57/#81/#84/#88`, fixed `#gloryBtn` CSS keyframe transform override & `#cityTip` opacity-race, and enforced DOM `getBoundingClientRect()` zero-overlap across Desktop, Mobile Portrait, Mobile Landscape & Flipped Controls. | `test_hud_controls_menus_proving_audio.js` (7/7) | **PASS** |
| **10/10** | Final Release Gate Audit, Checksums & Packaging | Audited all 54 diffs (zero stray `console.log`/`debug`/`trace`), unified `?v=16.0-s06-10`, caught & fixed defensive `js/scenario.js` `locLabel()` crash on unrecognized scenario modes, verified 10/10 QA suites back-to-back under `set -euo pipefail`, regenerated SHA-256 manifests, and built & verified the drop-in deploy ZIP. | `test_release_gate_end_to_end.js` (6/6) + full 10/10 suite | **PASS** |

---

## 3. Notable Defects Caught & Permanently Fixed During S06 QA

1. **`js/scenario.js` — Unchecked `SCN_MODES[Q.mode].icon` crash in `locLabel()` (Caught in Step 10 Release Gate Visual Audit):** If saved/legacy metadata ever contained an unrecognized `meta.region.scen.mode`, `locLabel()` threw `TypeError: Cannot read properties of undefined (reading "icon")` during `updateMenuUI()`, popping open the red Live Debugger overlay. Guarded with safe lookup `M = SCN_MODES[Q.mode]` and enforced `#live-debug-box` non-open assertion in Release Gate R6.
2. **`css/style.css` & `js/hudlayout.js` — `#gloryBtn` Mobile HUD Overlap:** CSS `@keyframes gloryPulse` / `gloryShake` hardcoded `transform: translateX(-50%) scale(...)`, overriding HUD layout inline positioning on mobile viewports. Replaced with `--hudl-s` CSS variable & `[data-hudl="1"]` keyframe variants; verified `HUDL.overlaps === 0` AND pairwise DOM `getBoundingClientRect()` overlap count `=== 0`.
3. **`js/hudlayout.js` — `#cityTip` Opacity-Transition Race:** `hudShown()` missed elements just beginning an opacity transition (`cs.opacity === 0`), allowing transient overlap with bottom HUD widgets. Fixed visibility detection so layout accounts for entering tips immediately.
4. **`js/rewind.js` & `js/sim.js` — `timeRewind` Self-Cooldown & Ghost-Vehicle Rewind:** Restoring snapshots previously rewound `timeRewind`'s own cooldown (allowing infinite rewind chains) and could leave stale vehicle occupancy flags on rewind across vehicle entry/exit boundaries. Both permanently fixed and asserted in Step 9 & Step 10 QA.
5. **`js/proving.js` — Frieza (`#84`) Death Ball Proving Check:** Fixed Death Ball activation detection in Proving Ground so all 5 flagship test heroes (`#0 Luke`, `#57 Iron Man`, `#81 Qui-Gon`, `#84 Frieza`, `#88 Broly`) score **14/14**.
6. **`js/glory.js` & `js/agefilter.js` — Pause-Safety & `STRONG` Filter Sanitization:** Hardened Glory Kill triggers against firing while paused and ensured `ageSetLevel("STRONG")` cleanly strips graphic gore/blood terminology and effects.
7. **`js/ui.js` + 21 Gameplay Modules — Global Keystroke Bleed While Typing:** Added centralized `uiTypingInField(e)` guard across keydown listeners so typing hero names or save text in `<input>`/`<textarea>` never latches movement/combat/hotkeys, and standardized `Escape` modal dismissal priority.
8. **QA Suite Determinism Fixes:** Eliminated random-seed city-wall flakes in `test_jobs_economy_kisurge_creator.js` (T4 clear cardinal lane via `cityCircleBlocked`), `test_player_walk_cycle.js`, and `test_hero_archetypes.js` (explicit `meta.world = "classic"` for open-ground gait & posture capture) without weakening any gameplay assertions.

---

## 4. Automated Verification Matrix (10/10 Suites Hard-Verified PASS)

All 10 suites ran sequentially under `set -euo pipefail` against `/home/user/staging` served over HTTP in headless Chromium (Playwright):

| # | QA Suite File | Key Checks Verified | Result |
|---|---|---|---|
| 1 | `/home/user/qa/tests/test_hero_registry_health.js` | 88 canonical + `#80` creator (89/89), 78/78 scripts, Health UI, Indianapolis + `#81` | **PASS** |
| 2 | `/home/user/qa/tests/test_player_walk_cycle.js` | 8-dir keyboard walk, biomechanical gait invariants, idle settle, roster portraits | **PASS** |
| 3 | `/home/user/qa/tests/test_hero_archetypes.js` | All 89 archetypes, Boba gun postures, Luke saber ignited/stowed, Speeder, Yoda, Goku SSJ | **PASS** |
| 4 | `/home/user/qa/tests/test_npc_locomotion.js` | All 220 enemy specs × 8 dirs, squad, allies, minions, townsfolk | **PASS** |
| 5 | `/home/user/qa/tests/test_combat_weapons.js` | Melee/gun/projectile combat, Saber Forms I–VII, extended cast `#81`–`#88` | **PASS** |
| 6 | `/home/user/qa/tests/test_vehicles_flight_world.js` | Vehicles, crash damage, headlights, flight altitude `Z`, traffic, police, world systems | **PASS** |
| 7 | `/home/user/qa/tests/test_world_regions_realmap_minimap.js` | 16/16 checks: all regional worlds, Indianapolis Real Map, minimap & world map | **PASS (16/16)** |
| 8 | `/home/user/qa/tests/test_jobs_economy_kisurge_creator.js` | 11/11 checks: dispatch contracts, economy, Frieza Death Ball/Planet Decay, `#80` creator, campaign/showdown, SaveBackup | **PASS (11/11)** |
| 9 | `/home/user/qa/tests/test_hud_controls_menus_proving_audio.js` | 7/7 checks: 89/89 skills, Proving 14/14 × 5 heroes, Pause/ESC/input guards, Glory/Age Filter, Rewind/Force/Vision, Desktop+Mobile+Flip `HUDL=0` & DOM `domOv=0` | **PASS (7/7)** |
| 10 | `/home/user/qa/tests/test_release_gate_end_to_end.js` | 6/6 checks: Cold boot 78/78 EOF & Health UI, `#80` creator + careers, Classic Arena full lifecycle, Night Nexus City driving/flight/dispatch/ESC, Ki-Surge Planet Decay + Tatooine + Age Filter + SaveBackup, Proving 14/14 + Mobile 0/0 overlap + 0 errors + Live Debugger closed | **PASS (6/6)** |

### Additional Static & Integrity Gates
- **Baseline untouched check (`/home/user/baseline-v15.6.6`):** `sha256sum -c RESTORE_SHA256SUMS.txt` -> **82/82 OK**
- **Staging JS syntax (`node --check`):** **79/79 OK** (`78` browser modules in `index.html` + `js/realmap-build.js`)
- **Staging checksums (`/home/user/staging`):** `RESTORE_SHA256SUMS.txt` **82/82 OK** · `SHA256SUMS` **89/89 OK**
- **Stray debug audit:** **0** stray `console.log` / `console.debug` / `console.trace` added across all 54 diffs
- **Cache-bust audit:** **53/53** modified runtime assets in `index.html` unified on `?v=16.0-s06-10` (**0** stale version strings)

### Visual Proof Contact Sheets
- Release Gate 2×2 Flagship Showcase: `/home/user/qa/screenshots/s06-step10/01_s06_release_gate_showcase.png`
- Step 9 HUD & Mobile Zero-Overlap Proofs: `/home/user/qa/screenshots/s06-step9/01_hud_desktop_pause_opts_proving.png`, `/home/user/qa/screenshots/s06-step9/02_mobile_hud_flip_age_summary.png`
- Steps 1–8 Visual Suites: `/home/user/qa/screenshots/s06-step1/` through `/home/user/qa/screenshots/s06-step8/`

---

## 5. Modified Runtime Files & SHA-256 Manifest (54 Files · +2650 / -841 Lines)

| # | File | Diff Lines | Size (B) | SHA-256 |
|---:|---|---:|---:|---|
| 1 | `css/style.css` | +8 / -1 | 29,740 | `234a4c792b68c372c560e0595a4cac46609282383d6b0abef8ec8c06657b8160` |
| 2 | `index.html` | +55 / -55 | 57,372 | `0c9f8744e59088b119c31de5bc908891313cb0f1e7a2c591b69b64acb209e53d` |
| 3 | `js/actionui.js` | +11 / -7 | 24,859 | `ff36580f0d475988fbb9d05033c915e67d471e2860ff80df353e0a08c9bafe5b` |
| 4 | `js/biomes.js` | +18 / -1 | 39,104 | `28e14228bb0cd7d0fca5ea5a8371f78ed9fcc3e39a42132e28af43b97d64a5bc` |
| 5 | `js/campaign.js` | +5 / -5 | 22,686 | `11f7b21db00fbb8320f59afe3622a2eb23f250729d8740b62d6582ab5bdde9f1` |
| 6 | `js/chaos.js` | +12 / -3 | 51,914 | `e8c09d002465b546a7cbeb9cbfd71c3d7f75cfa1b87a5040925c3a5aa4fb8b78` |
| 7 | `js/cityaccess.js` | +2 / -1 | 52,080 | `42ac9d533ee15feba87b81a00da26f8c034dab053fd58e911adc44631ab46cd9` |
| 8 | `js/citydamage.js` | +6 / -2 | 23,221 | `71929a0b743703d191c62a086b27d5ecdbc4df094c0665145d257447c77effb8` |
| 9 | `js/cityplay.js` | +1 / -1 | 18,258 | `b307cb0c37579e621af90da39d227337619219060ae67552bbdbb88a4c578f0c` |
| 10 | `js/cityrender.js` | +10 / -3 | 147,789 | `ab71b740479327aab310912390e42c4d3bfce9739a792ebe15af463137b02a3f` |
| 11 | `js/combat.js` | +123 / -18 | 90,988 | `10dc46b156e4ea4f19633b623c5c2c6c1d98ab0bf3d107c4814fa61c78599d52` |
| 12 | `js/creator.js` | +113 / -40 | 86,323 | `8c6cf984055d8fa36270589ddc64987c113efc98a4de9287d0e096eb493034b6` |
| 13 | `js/data-heroes.js` | +12 / -0 | 85,001 | `4b917f66eb5439d2aa81de2687a716b6e5b5f40017ab92ce072363ad38dc09f5` |
| 14 | `js/dualaim.js` | +3 / -1 | 6,203 | `dec52b6c109b9932d45b1d7ae625a592c6ff570d6beef3f0f63a6f8b14b51c33` |
| 15 | `js/economy.js` | +13 / -5 | 36,218 | `f0db2422ac452d2e6024aa3d3e4d98d2ecee5c82eca8170f0186f4b6ba145c59` |
| 16 | `js/enemylook.js` | +450 / -148 | 93,834 | `1eef993f91ef04f194c907fad26f67c2e47a599b5fd598587ab0fd267476466a` |
| 17 | `js/flight.js` | +86 / -27 | 68,682 | `d3910f66e17825db8565be4e2030c3a0d5cfec9423133ba2e6df83f36c05189f` |
| 18 | `js/force.js` | +1 / -1 | 23,065 | `4dae706bd44ea5937af5c56367ec24915db3ba3ca395ded1ebfa85fd19233a12` |
| 19 | `js/fx.js` | +8 / -4 | 13,208 | `3f22585b83d9f9b70701db53b43bf059cc9e1c96c36f9d23bda7a1cda6906dff` |
| 20 | `js/glory.js` | +31 / -14 | 16,205 | `e435b42d65e15b99d1a5e33c40ada9dcb4dde12f706c6e5813440d2afd700c36` |
| 21 | `js/gunart.js` | +1 / -1 | 17,240 | `29ce7e012ee938c49ee637fdc39ea7292e259376e4f913fd4ccd5ce942725d41` |
| 22 | `js/heroreg.js` | +80 / -3 | 21,389 | `c51bad2a790b7dd27be900ea97035eb3d46021b011d57638ffbe0cd4530de5ab` |
| 23 | `js/hudlayout.js` | +4 / -3 | 21,447 | `a510f91fde04f3c0b59a584908d29eb6920bcb2ff91078fc76327ac4a82aefb8` |
| 24 | `js/items.js` | +6 / -2 | 28,425 | `3f915d249b9a9d4ca83da447cdbf8dc64ecb7363a84464c6ab09bb5b060a8fa7` |
| 25 | `js/jobdispatch.js` | +5 / -4 | 95,510 | `524fde362d85a838a61d5c9c14d729cc2cc4925d74786792a171d06c3f32699d` |
| 26 | `js/jobemt.js` | +9 / -4 | 40,254 | `a0a14df4e6cb20e3a015d565742689fa6d8ff5f8ab200dfd87a870c8d0f1addc` |
| 27 | `js/jobfire.js` | +7 / -3 | 30,716 | `45b7ae3c34621e1073ed3546d02de0bb782969238b7218295e528ddf23e02037` |
| 28 | `js/jobpatrol.js` | +25 / -7 | 67,578 | `42307a5f0dfee621004c1829256b940846671ec1d67a7547770ae69fa6afc231` |
| 29 | `js/jobtactical.js` | +5 / -2 | 35,719 | `36f70ada0923bc550c12dd8cf603a8b55a7172c3d6234a3688a445509b45cf4c` |
| 30 | `js/jobvehicle.js` | +3 / -2 | 17,234 | `ae1add97c660995628ced6856af2820732dddc4400a4a265c6304b8ed60daf6d` |
| 31 | `js/kisurge.js` | +81 / -37 | 65,593 | `5385ded528b1db94e51642bb4aa93dee32e3f61addfc32144b4f99a7a09f4072` |
| 32 | `js/locals.js` | +9 / -2 | 14,365 | `c7280525cf27c8d0da03ae6df76c21a3246f1353af6cee76aa7adf1de6151fbb` |
| 33 | `js/minimap.js` | +18 / -7 | 46,860 | `89ee376303994b0016c5749938da9df0710a49191136941755c6fa19e630d069` |
| 34 | `js/police.js` | +20 / -13 | 52,403 | `b8bc8de764a98ee32521c3f12495f3c2128007f38af97417f6e1cf036088f5af` |
| 35 | `js/proving.js` | +26 / -4 | 23,072 | `eb58d0963745f12c0c2230372ffce468cd3a9850753c976d3b49918308b268eb` |
| 36 | `js/realdata.js` | +43 / -4 | 38,995 | `05355d7d2aa7342f8e53beccb0484addb421751e15ceda0ba0d87a278febaf01` |
| 37 | `js/realgen.js` | +28 / -3 | 106,598 | `bcc5936ac6fa1c95a55e7868d1c97b52c464c99ef293675e2b037187876a8827` |
| 38 | `js/realui.js` | +6 / -2 | 38,375 | `b5ef5deea8868b20f643b37c1bc97fd38ebcfd5e94ef260a32cffabca53dc9d0` |
| 39 | `js/regionart.js` | +16 / -6 | 61,655 | `ed2bc0f931915bb9a016bb7e7ad89d5c601b7d30d09ab3871757cdd2a3ededc4` |
| 40 | `js/releaseprofile.js` | +3 / -2 | 3,765 | `6e9810877ffdcbdbe8e85d453a4fd133fbf490b29383d11134eb850236418fcf` |
| 41 | `js/render.js` | +875 / -301 | 134,764 | `dd25e14f47b5874c698b36a2f18370cdcc7d0b7c7359b335f950ef782dc51359` |
| 42 | `js/rewind.js` | +1 / -0 | 12,673 | `cb350be0e246cf01fb9f50dc61e26ac9d1178ecd2a6cd580e405c62cf12383e1` |
| 43 | `js/rivalchase.js` | +2 / -2 | 8,920 | `fade9e50195ca6a14ce2329fb43013a9b771b3746ffcdbffebbe3a1b791e1bc7` |
| 44 | `js/saberforms.js` | +15 / -3 | 65,776 | `c61f64cd2a547176aa5cf5c1bca6edbe19d5fa9db00a377f361ad7484b8a938c` |
| 45 | `js/scenario.js` | +5 / -3 | 13,184 | `92931d4358757b70623086b58f42cedfaabc3682aeedeeb78f3c0df4bcf4de02` |
| 46 | `js/sheathe.js` | +17 / -5 | 7,942 | `c18f06bb6d55c114382f4ca4ea3af8e916a13c15eba0c903fb254d850c97ff04` |
| 47 | `js/sim.js` | +51 / -14 | 77,783 | `01eaf40b051f41b31df9dc9449f055b8f7545a1b00673180d12208cd5c9c78b0` |
| 48 | `js/squad.js` | +119 / -36 | 57,916 | `bb8fd3b075866836955d25cc56c3354680c03b54022281afcf0540b996c72972` |
| 49 | `js/state.js` | +4 / -1 | 43,745 | `22103cb894a81da6b0465f35f6f440d8262ce1f2c3ace3f385e994df49de0c60` |
| 50 | `js/stealth.js` | +5 / -2 | 42,536 | `fbfe1833ff17268e4393ff4b0edbc6544d335d466f5ac5808a194a34b0bf6f4c` |
| 51 | `js/townsfolk.js` | +10 / -3 | 59,568 | `356b79f7e8a77ee7796347bff69199461ad2fb4ca5a06ed71e041f86db2be52a` |
| 52 | `js/traffic.js` | +5 / -5 | 42,573 | `a8e3405c51e14eb4f4080100bb39aa27da7bdceb31b3d3957d6330fce4dd831c` |
| 53 | `js/ui.js` | +141 / -15 | 80,469 | `4ae0d44722768410301eb269c3db45a9ab32ce236fb2af929e0af37c9ec74f29` |
| 54 | `js/vehicles.js` | +37 / -3 | 133,073 | `2842b8a18f7870fc81a5494566401e6af93a801235f4e1fb93598bd0337ee1aa` |

### Updated Release Metadata & Checksum Files (4 Files)

| # | File | Diff Lines | Size (B) | SHA-256 |
|---:|---|---:|---:|---|
| 1 | `CURRENT_REVISION.md` | +17 / -10 | 3,612 | `7dd8fa9dfaa7b5f1faea1f8d38eee70ba36dd6c3e91ad36197b62e866805e731` |
| 2 | `RESTORE_SHA256SUMS.txt` | +54 / -54 | 6,607 | `b35afbffae90ca4dfcf34b96df6387fd12c670f7334de81d54a6c4b81557f174` |
| 3 | `SHA256SUMS` | +61 / -61 | 7,182 | `490595cbcab160488749773c1ebe81008ec5d21fac69f3b86f7bc5bb6d19dd8f` |
| 4 | `UPDATE_INSTRUCTIONS.txt` | +19 / -17 | 1,907 | `d988a45925d4488543fdeaaaf78a28ae95cbeb05a3fe1db08669e83a6570a325` |

---

## 6. Zero-Risk GitHub Pages Deployment & Rollback Guide

### Deploy `omni-shift-v16.0-s06-release.zip`
1. **Create a safety branch (optional but recommended):**
   ```bash
   git checkout -b release/v16.0-s06
   ```
2. **Extract directly into your repository root** (archive contains no `music/` and no `data/realmap/`, so existing MP3 files and GeoJSON map packs are preserved untouched):
   ```bash
   unzip -o omni-shift-v16.0-s06-release.zip -d /path/to/your/repo
   ```
3. **Verify file integrity before committing:**
   ```bash
   cd /path/to/your/repo
   sha256sum -c RESTORE_SHA256SUMS.txt   # Expect 82/82 OK
   sha256sum -c SHA256SUMS               # Expect 89/89 OK
   git status                            # Confirm music/ & data/realmap/ untouched
   ```
4. **Commit & push to `main`:**
   ```bash
   git add -A
   git commit -m "Release OMNI-SHIFT v16.0-s06 (Steps 1-10 modernization & QA certified)"
   git push origin main
   ```
5. **Post-deploy smoke check on GitHub Pages:**
   - Open your live GitHub Pages URL (cache-busting `?v=16.0-s06-10` automatically fetches all 53 updated assets).
   - Click **HEALTH OF GAME** and confirm `88/88 Loaded` + `Creator Slot #80` (`89/89`) and `78/78 Runtime Checks · 78/78 EOF Clean`.
   - Start a run, verify movement, minimap, pause (`Escape`/`P`), and Music panel (your live `music/*.mp3` tracks auto-load via `discoverMusicFiles()`).

### Instant Rollback
If you ever need to revert to `v15.6.6-LOCKED`:
```bash
git checkout 41f85d5c0d1ee8c4d962e4a9167901cb9c0ecf5b -- index.html css/style.css js/ CURRENT_REVISION.md UPDATE_INSTRUCTIONS.txt RESTORE_SHA256SUMS.txt SHA256SUMS
```
