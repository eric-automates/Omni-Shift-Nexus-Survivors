# Omni-Shift: Nexus Survivors — v9.01 remediation + v10 roadmap
*2026-10-27 · branch `v10` on top of your GitHub `main` (`a3d581d`) · commit `4d7dfb7`*

## TL;DR

| Step | Result |
|---|---|
| **Did your upload land?** | Yes. GitHub `main` is byte-identical to my fix commit, and GitHub Pages is serving it. **All 20 bug checks pass on the live site.** |
| **Bug sweep of the live build** | All **80 heroes**, 40 s each from 1:44 (skills, dashes, spells, Sector Titan fight): **0 errors, 0 soft-locks**. No new bugs found. |
| **v9.01 list (8 items)** | **6 implemented.** Items 1 and 7 were **not present in this build** (they came from a v9.0 build that never reached GitHub). I verified the correct behaviour, and for item 7 converted the relic data anyway as hardening. |
| **v10 roadmap (A–E)** | **All 5 built:** Proving Ground, Squad radial wheel, adaptive biomes, glory kills, Galactic Expedition map. |
| **Extra polish** | Hit-stop, screen shake, kill streaks, boss cinematics, brass casings, fire and smoke explosions, a low-HP heartbeat, a run summary with glory and streak stats, and help-screen docs. |
| **Tests** | Old bug suite **20/20** · new feature suite **14/14** · in-game Proving Ground **12/12** for a saber, a gunner and a wizard hero · 80-hero sweep with all new systems: **0 errors** · 4×200 s soak: **0 errors**, heap steady at 35.6 MB. |

---

## How to upload (please read: there are 8 NEW files)

1. Unzip **`omni-shift-v10.zip`**. It has the repo folder structure: `index.html`, `css/style.css` and 17 files in `js/`.
2. On GitHub, go to **Add file → Upload files** and drag in **`index.html`, the `css` folder and the `js` folder**. Commit everything at once.
3. Wait about a minute for GitHub Pages. The new `?v=v10-2026-10-27` cache-busting tag makes browsers fetch the new files.
4. The menu should show the new buttons **🗺️ GALACTIC EXPEDITION MAP** and **🧪 DEBUG ALL · PROVING GROUND**.
   - If it instead says **"FAILED TO PARSE: fx.js …"**, one of the new files didn't upload. The new files are `fx.js`, `rewind.js`, `arsenal.js`, `squad.js`, `glory.js`, `biomes.js`, `campaign.js` and `proving.js`.

**Alternative for git users:** `git apply v10.patch`. The patch is made against `a3d581d` and is verified to apply cleanly.

---

## 1. v9.01 remediation list, item by item

| # | Your item | What I found in the code | What I did | Verified by |
|---|---|---|---|---|
| a | Remove `(eFireCD[i] < -0.1)` from `checkBladeSegmentSlice` | **Not present.** This build has no such check, so close-range enemies were never immune. | Nothing to remove. I added a test that pins the correct behaviour. | V01: enemies at 4, 9 and 16 px with `eFireCD = -5` all get sliced. |
| b | 85 px proximity auto-lock + 360° sweep | Missing. There was only a small flourish speed-up under 78 px. | Under 85 px, aim snaps onto the target about twice as fast, and orbit/saber weapons blend smoothly (no snapping) into a full 360° spin. They return to the normal stance when it's clear. | V02: dummies **behind and on both sides** are all sliced; the blend reaches 1.0, then falls back to 0. |
| c | `ptCol` / `ptSize` trails on missiles and rockets | Missing. All particles were identical yellow 3 px squares in a 240-slot pool that silently ran out. | New pool of 1,400 slots with colour, size, life and behaviour per particle (flame, smoke, brass, ember, dust). It's a ring buffer, so emission never fails. Missiles emit by **distance travelled** (a puff every 3.6 px), so the trail is unbroken at any FPS or speed. Explosions get a fireball and rolling smoke. | V03: **100% coverage** of the flame zone in 12 of 12 runs. |
| d | Mandalorian #1: IB-94 primary, Whistling Birds as 120 s Skill 1 | Primary was "Whistling Micro-Darts" (missiles); Skill 1 was an 8 s spread shot. | **Primary:** the IB-94 Beskar Heavy Pistol (`"beam"`) with heavy, high-pierce slugs: a double-tap from Lv.4 and an extra slug at Lv.10. It has its own in-hand model and icon. **Skill 1:** Whistling Birds, 120 s. A swarm of up to 72 looping, homing micro-munitions fans out from the vambrace, each with a fire trail. **Every non-boss enemy on screen dies** (a 1.9 s failsafe guarantees it). Rivals and Titans take heavy damage instead. The Lv.5 signature gear became the Amban Phase-Pulse Shot. | V04: 25/25 regular enemies dead; the rival and Titan survive damaged; cooldown is 120 s. |
| e | Step ladder +3.5x … −5.0x with seamless rewind | Missing. The buttons jumped ±0.5x with my earlier 0.1–3.0x cap, and there was no rewind. | **Ladder:** `− / 1.0x / +` walk **3.5 · 3 · 2.5 · 2 · 1.5 · 1 · 0.75 · 0.5 · 0.25 · 0.1 · ⏪ −0.1 · −0.25 · −0.5 · −1 · −2.5 · −5**. **Rewind engine** (`rewind.js`): snapshots every 0.1 s of game time, covering about **39 s / 30 MB**. Negative speeds play the snapshots backward, interpolating between them, so even −0.1x is smooth. The VHS overlay shows how much buffer is left, and time **halts at the buffer start** until you press + or 1.0x. Details are under "Rules" below. | V05: exact ladder sequence; position error under 6 px; smooth −0.1x (every frame moves, no stair-steps); halt and resume; echo kills pay 0. |
| f | Corpse halves locked to `slSeed` / `slHelmetOff`; static faded eyes | Corpses and halves were plain circles. The v9.0 procedural faces didn't exist yet. | **Built the procedural heads.** About 55% of henchmen lose their helmet (it lies on the ground nearby); the rest keep it with a dead, unlit visor. Exposed heads get a seeded skin tone, hair, head size, eye spacing, brows and nose. Eyes are **faded, half-lidded and fixed in one direction, with no blinking**. Everything derives from the body's seed, and halves inherit **`slSeed` and `slHelmetOff`** from the body they came from. | V06: **pixel-identical** corpses and halves across frames; 110/200 helmets knocked off; halves carry the body's seed. |
| g | `RELICS_DB` entries as objects (`.id`, `.name`, `.desc`) to stop the boss-kill crash | **The crash can't happen in this build**: `grantRelic` reads the arrays correctly. | Converted anyway as hardening. Every row now has `.id/.name/.desc/.key/.val` but is still an array, so old `r[0..4]` code keeps working. `grantRelic` accepts either shape. | V07: schema check; 60 grants in a row; rival and Titan kills grant relics with 0 errors. |
| h | Raise the Music/Debug buttons and toast (30 / 62 px) clear of `#perfHud` (4 px) | There was no `#perfHud`. | **Added `#perfHud`** at the bottom right: `FPS · ms/frame · Bodies X/Max · Enemies Y`, coloured by FPS and toggleable in Options. Music and 🐞 Debug buttons moved to 30 px, the Now-Playing toast to 62 px, and the music and debug panels above them. | V08: CSS positions checked; **no overlaps** with long track names on a phone-width screen. |

### Rewind rules
- **What rewinds:** the battlefield. That means enemies, corpses, sliced halves, severed limbs and helmets, bolts, minions, your position, HP and cooldowns, and the run clock.
- **What you keep:** XP, level, weapons, relics, kills and Dark Matter.
- **Orbs:** collected orbs never come back.
- **No farming:** an enemy you already killed returns as a **temporal echo** (cyan dashed outline). Killing it again shows the gore but pays **no XP, kills, drops or relics**.
- **Never stuck in reverse:** runs always start at 1.0x, and rewind speeds are never saved.

---

## 2. Roadmap v10, what was built and how to use it

### A. "Debug All" Proving Ground (`js/proving.js`)
Open it from the main menu: **🧪 DEBUG ALL · PROVING GROUND**.
- **The arena:** your selected hero drops into a training arena with straw dummies, no natural spawns and invulnerability.
- **The run:** it plays **12 live actions in real time** while a checklist ticks ✅ or ❌ with notes:
  1. Boot & HUD
  2. Firing
  3. 360° melee sweep, with a temporary saber for non-blade heroes
  4. Both skills
  5. Dash
  6. Looting (orbs and a supply pod)
  7. Level-up card pick
  8. **Driving** (board, drive, dismount)
  9. **Squad orders** (Hold → Focus → Regroup)
  10. **Glory kill**
  11. **Time rewind** (kill → −1.0x → the dummy returns as an echo → resume)
  12. **Memory purge** (every pool reaches 0)
- **The end:** you can COPY REPORT, RUN AGAIN or CLOSE. It takes about 25 s.

### B. Squad Direct Command radial wheel (`js/squad.js`)
- **Open the wheel:** tap the **📻** button (it appears when you have companions), or **press and drag** onto an order and release. Keyboard: `Q`, with `1` to `4` as hotkeys. The game slows to 0.3x while the wheel is open.
- **The orders:**
  - **✋ Hold Position:** the squad anchors and defends a radius.
  - **🎯 Focus Fire:** everyone hits the strongest target on screen (Titan before rival before HP), shown by a red reticle.
  - **⬆ Advance:** the squad pushes to a rally point ahead of you.
  - **↩ Regroup:** the squad forms up on you.
- **Who obeys:** every companion, including necromancer swordsmen, hounds, bowmen, knights and bone golems, plus the new rifle fireteams.
- **Fireteam roles:** rifleman (3-round bursts), machine gunner, marksman and breacher. They fire tracers, eject brass and call out their names.
- **Fireteams by universe**, for example:
  - **Tears of the Sun SEAL Team** (Flea, Red, Lake, Slo) for the Green Beret #53
  - **USCM Colonial Marines** for #28
  - **501st Clones** for #2
  - **SG-3** for #8
  - **Roughnecks MI** for #31
  - **Cadians** for #34
  - Faction-themed teams for everyone else
- **How you get one:**
  - **📻 Radio beacons** spawn in the world (any hero, 4 soldiers for 75 s).
  - **Military heroes deploy with a fireteam** that reinforces every 40 s.
- **Vehicle co-gunner:** while you drive, a soldier rides along and mans the gun. This stands in for the "Abrams co-gunner" idea, since the game has hovercraft and mechs but no tank.

### C. Dynamic character-adaptive biomes (`js/biomes.js`)
- **17 universe themes.** Each changes the ground palette and floor pattern, the architecture props, the hazard, the weather and the lighting.
- **The themes:**
  - **Star Wars:** Tatooine Dune Sea · Imperial Durasteel Decks (Sith heroes)
  - **Desert worlds:** Abydos · Arrakis (sandstorms, sandworm sign)
  - **Frontier and space:** Rim Frontier · Starship Deck
  - **Sci-fi warzones:** Hadley's Hope Colony · Val Verde Jungle (rain; Predator/Rambo) · **Hell Breach** (lava; Doom) · Imperial Hive Ruins (warp rifts; 40K)
  - **Cities:** **Neon Megacity Alleys** (Cyberpunk, Blade Runner, Matrix) · **Gotham Gothic Steel** (John Wick #51)
  - **Wasteland and labs:** Nuclear Wasteland · Black Mesa Labs
  - **Nature and fantasy:** Witchwood Marsh (Witcher, Lovecraft; **Dagobah for Yoda**) · Ronin Valley (cherry blossoms) · Castle Grounds (wizards)
- **Hazards do real things.** Sarlacc pits slow and pull you, lava burns, puddles shock, Devil's Snare roots. They still never kill you by themselves, as before.
- **They also cook enemies at 2.5–3× the rate**, so lure crowds in. A floating label names each hazard when you get close.

### D. Cinematic glory-kill finishers (`js/glory.js`)
- **Stagger:** an elite (heavy, shield-wall leader or rival) is **staggered** by a heavy melee or close-combat hit at 35% HP or below, or by any damage at 20% or below. A staggered enemy freezes, pulses orange and blue, and shows ☠ EXECUTE. Auto-aim leaves it alone.
- **Execute:** walk into it, or tap the **☠ EXECUTE** button to lunge from up to 160 px.
- **The finisher:** slow motion, a camera push-in, letterbox bars and hit-stop, then a **hero-specific finisher**:
  - saber bisect
  - **Predator spine-rip** (leaves a spine trophy)
  - **Doom "Rip & Tear"** (+30% HP)
  - point-blank execution
  - arcane disintegration
  - beast limb-tear
- **Rewards:** a heal (12–30%), 25% off skill cooldowns, an XP orb and 1.2 s of invulnerability.

### E. Galactic Expedition campaign map (`js/campaign.js`)
- **Where:** the main-menu map button now opens a **seeded, branching 12-sector route** in the Slay-the-Spire style, with warlord citadels at sectors 6 and 12. The classic 50-stage list is one tap away.
- **Sector types:**
  - Combat
  - Elite Garrison (more heavies, so more glory kills, plus an extra relic)
  - Hazard Zone
  - Supply Cache
  - Rival Hunt
  - Warlord Citadel (the warlord arrives at 1:30 with 2.2× HP)
- **The rule you asked for:** sectors ahead stay **UNCHARTED** until you clear a connected district. **The district you clear decides the next sector's hostile faction** (55% chance it regroups there), **environmental modifier** (follows a modifier chain), **biome** and **warlord**.
- **12 modifiers with real effects:**
  - Ion Storm (lightning that hurts enemies too)
  - Low Gravity
  - Acid Fog
  - Thermal Vents
  - Warp Rifts
  - **Blackout** (a pool of light around you)
  - Bounty Hunt
  - Swarm
  - Fortified
  - Supply Drop
  - Blood Moon
  - Clear Skies
- **4 warlord traits:**
  - Enrages at 50%
  - Calls an escort
  - Fires bolt novas
  - Regenerates
- **Enemies are recoloured** to the hostile faction's palette.
- **Progress is saved.** Expedition clears pay Dark Matter but don't touch the classic stage ladder. The run summary shows the sector, and the "Next" button returns you to the map.

---

## 3. Extra polish ("feels good, feels polished")

- **Hit and impact feel:**
  - Hit-stop
  - Screen shake: explosions, big hits, the Titan, damage taken
  - Cinematic zoom and focus
- **Announcements:**
  - **Kill-streak announcer** from DOUBLE KILL up to GODLIKE. A new tier replaces the old banner instead of stacking. There's a 🔥 combo counter and a small XP bonus.
  - **Titan intro:** banner, slow-mo and camera focus. **"Sector Cleared"** cinematic on the kill.
- **Weapons:**
  - **Brass casings and muzzle smoke** for slug-throwers (P90, Smartgun, Morita, MA5B, bolter, M60…). Energy weapons stay clean, for realism.
  - Missile bodies now have a stable flame instead of random flicker.
- **Low HP:** pulsing red vignette and a **heartbeat** under 30% HP, plus a damage flash.
- **Information:**
  - Run summary now shows **glory kills and best streak**.
  - A **"NEW IN v10 · HOW TO USE"** section at the top of the Controls/Help screen.
- **New Options toggles:** Screen Shake & Hit-Stop, Run Telemetry Pill, Biome Weather FX.

---

## 4. Changes you might notice, and where to tune them

| Change | Why | Tune in |
|---|---|---|
| Max game speed is **3.5x** (was 3.0x), and the − / + buttons step a ladder. | Your v9.01 spec. Fast frames are still sub-stepped (up to 12 steps), so nothing tunnels. | `TIME_LADDER` in `state.js` |
| **Mandalorian #1** plays differently: pistol primary, 120 s ultimate. | Your spec. | `fireWeapon` (IB-94), `BIRD_MAX` in `arsenal.js` |
| **Military heroes start with a fireteam** (#2, #8, #28, #31, #34, #53). | It makes the squad wheel useful from minute 1 for those heroes. It's a buff for them. | `INNATE_SQUAD` and `SOLDIER_SPECS` in `squad.js` |
| **Saber heroes are stronger up close** (360° sweep). | Your spec. It also offsets the deflect fix from my last round. | 85 px radius and 14.5 rad/s spin in `sim.js` |
| The rewind buffer uses **about 30 MB** from the first run onward. | It holds about 39 s of history. | `REWIND_BUDGET_BYTES` and `REWIND_KEY_DT` in `rewind.js` |
| Staggered elites are ignored by auto-aim. | So that glory kills actually happen. | `gloryStep` thresholds and the 3.2 s stagger in `glory.js` |
| Hazards vary per biome and also hurt enemies. | Roadmap C. | `BIOME_THEMES[...].hazard` in `biomes.js` |
| Sector clears pay a multiplier (Elite ×1.5, Citadel ×2, Blackout ×1.35, Bounty ×1.5). | Risk vs reward. | `CAMP_NODE_TYPES` / `CAMPAIGN_MODS` in `campaign.js` |

Performance: average sim cost is **0.13–0.31 ms per step** across all 80 heroes, and the menus stay at about 57–61 FPS in headless Chromium. The new systems add about 0.07 ms per step on average.

---

## 5. Not done, so you know exactly where things stand

- **The rest of the `info.md` v9.0 roster isn't in the game yet.** That covers Die Hard, Hitman, Léon, Heat, SWAT/Tank, Waters as hero #34, Ninja, Sam Fisher, Avengers, Thanos, TimeShift and the custom hero #80. So:
  - The "Tears of the Sun SEALs" exist as a **fireteam** (Green Beret #53, or any hero via radio beacons) rather than as heroes.
  - "SWAT BearCat riflemen" are covered by the per-universe fireteams.
  - "Abrams co-gunners" became a generic vehicle co-gunner.
  - The "Gotham steel for Die Hard/Hitman" theme went to John Wick #51, the closest hero in the roster.
- **Rewind length:** rewind reaches about 39 s back (bounded by memory), not "all the way to 0:00" as `info.md` imagined.
- **Other `info.md` v9.0 extras I didn't build:** the purge diagnostic screen, stowed-saber hilts, Predator cloak, twin-gun tracking and the DPS delta matrix.
- **Proving Ground scope:** the in-game Proving Ground tests the **selected** hero. The full 80-hero sweep lives in `qa/sweep_v10.py`.

---

## 6. Verification details (all in `/home/user/qa`)

- **Live site:** `verify_fixes.py` against the GitHub Pages URL → **20/20** (`fix_results_live.json`).
- **Old bug suite on v10:** `verify_fixes.py` → **20/20** (`fix_results_v10.json`). Three test-only adjustments:
  - T09 now expects the new **3.5x** ladder top.
  - T04 opens the classic list via the new map screen.
  - The test harness clears the new innate fireteams so hit counts stay clean.
- **New feature suite:** `verify_v10.py` → **14/14** (`v10_results.json`): V01–V08 are the v9.01 items, V09–V13 are roadmap A–E, V14 is polish.
- **All-hero sweeps:**
  - `sweep_all.py` on the **uploaded build**: 80/80 clean.
  - `sweep_v10.py` on **v10**: 80/80 clean, with fireteam + all 4 orders, a −2.5x rewind round-trip and glory kills (65 executions) for every hero.
- **Soak:** `soak_v10.py` → 4 heroes × 200 s; the rewind buffer wrapped about 4×, a full −5x rewind halted at the buffer start, then resumed. 0 errors, heap steady at 35.6 MB.
- **Screenshots:** `qa/v10/shots/` covers every biome, corpse faces, missile trails, Whistling Birds, the squad wheel, the glory finisher, the rewind overlay, the Expedition map and the Proving Ground.
- **Bugs my own tests caught and I fixed before shipping:**
  - a small gap in missile trails behind the nozzle
  - the hero's own blade "stealing" a glory kill mid-finisher
  - a stray level-up picker freezing the Proving Ground
  - stacked streak banners
  - the Expedition map opening scrolled away from your sector

## Files
- **Changed (11):**
  - `index.html`
  - `css/style.css`
  - `js/state.js`, `sim.js`, `combat.js`, `render.js`, `ui.js`, `world.js`, `chaos.js`, `data-heroes.js`, `data-relics.js`
- **New (8):**
  - `js/fx.js`, `rewind.js`, `arsenal.js`, `squad.js`
  - `js/glory.js`, `biomes.js`, `campaign.js`, `proving.js`
- **Total:** +3,175 / −128 lines.
- **Deliverables:** `omni-shift-v10.zip` (repo structure) · `v10.patch` (against `a3d581d`) · this changelog.
