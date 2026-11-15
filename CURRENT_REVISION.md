# Current revision notes

- **Revision:** `16.0-s06` (S06 Full-Codebase Modernization, 8-Dir Biomechanical Locomotion & Production Polish Release).
- **Baseline commit:** `41f85d5c0d1ee8c4d962e4a9167901cb9c0ecf5b` (`v15.6.6-LOCKED` / `15.6-SERIES-LOCKED`, preserved untouched in `/home/user/baseline-v15.6.6`, `RESTORE_SHA256SUMS.txt` 82/82 OK).
- **Cache-bust tag:** `?v=16.0-s06-10` unified across all 53 modified runtime assets (`css/style.css` + 52 `js/*.js`) in `index.html`.
- **Runtime scope:** 54 runtime files updated (`+2,650 / -841` lines):
  - **Step 1 — Hero Registry & Health:** Canonical 88-hero registry + `#80` Creator (`89/89` slots), 78/78 module EOF audit, Indianapolis Real Map + `#81` Qui-Gon restoration.
  - **Step 2 — Player 8-Dir Walk Cycle:** True 8-directional biomechanical locomotion, foot-plant kinematics, arm/torso swing, idle settle, and portrait front-facing alignment.
  - **Step 3 — All 89 Hero Archetypes & Postures:** Special bodies (Yoda, R2/droids, quadrupeds, capes/cloaks, Dragon Ball auras), low-ready/aim/holster weapon postures, saber ignition/sheathe handoff, speeder seated pose.
  - **Step 4 — NPC, Enemy, Squad & Ally Locomotion:** All 220 enemy specs × 8 directions, squad members, summons/allies, townsfolk, and local civilians using unified 8-dir walk physics & shadows.
  - **Step 5 — Combat, Weapons & Saber Forms:** Hitboxes, weapon rendering, saber forms I–VII, extended cast `#81`–`#88`, gun art, and projectile/hitstop balance.
  - **Step 6 — Vehicles, Flight & World Systems:** Vehicle damage/headlights/passengers, free flight altitude (`Z`) & speed scaling, traffic/police/rival chase, city damage, and world transitions.
  - **Step 7 — Regions, Real Map & Minimap:** All regional worlds (Tatooine, Arrakis, Night City, Highlands, Continent, LV-426, Ki-Earth, SF-Earth, Midwest, Nexus), Indianapolis Real Map streaming & UI, minimap/world-map overlays & markers.
  - **Step 8 — Jobs/Dispatch, Economy, Ki-Surge & Creator:** All 11 dispatch contracts (`patrol`, `paramedic`/EMT, `fire`, `tactical`, `vehicle`), multi-track `#80` Custom Hero careers, simulated economy, Frieza `#84` Death Ball & Planet Decay, campaign/showdown, and SaveBackup validation/restore.
  - **Step 9 — HUD, Controls, Menus, Proving Ground & Audio:** Unified `Escape`/`P` modal stack & typing input guards (`uiTypingInField`), `timeRewind` self-cooldown & ghost-vehicle fixes, Glory Kill pause-safety & Age Filter `STRONG` sanitization, Proving Ground `14/14` across `#0/#57/#81/#84/#88`, `#gloryBtn` CSS keyframe transform fix (`--hudl-s`), `#cityTip` opacity-race fix, and DOM-verified zero-overlap HUD on desktop, mobile portrait, mobile landscape, and flipped controls.
  - **Step 10 — Release Gate & Packaging:** Guarded `js/scenario.js` `locLabel()` against invalid/legacy scenario modes, unified `?v=16.0-s06-10`, verified zero stray debug logs, and passed all 10/10 Playwright QA suites under `set -euo pipefail`.
- **Verification:** `79/79` JS `node --check` OK · `78/78` runtime scripts & EOF clean · `10/10` Playwright QA suites PASS (`0` page errors, `0` console errors, `0` unexpected 404s, `0` HUD/DOM overlaps).
- **Preserved user assets:** `music/` MP3 files and `data/realmap/` GeoJSON packs are intentionally excluded from the release archive so extracting onto an existing GitHub Pages repository never overwrites them.

The QA runner, Playwright test suites, screenshots, and release report are stored outside the playable snapshot (except a copy of `S06_FINAL_RELEASE_REPORT.md` for reference) and are not runtime dependencies.
