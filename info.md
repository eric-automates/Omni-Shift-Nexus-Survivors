# FILE: info.md
# PART: 1 of 14
# DETAIL: Version 9.0 Master Architecture, Bug-Fix Audit, Action/Stealth/Squad Roster Overhaul, Custom Hero Builder, DPS Telemetry & Temporal Rewind Specification.

## 1. Architectural Overview & Core Pillars
**OMNI-SHIFT: NEXUS SURVIVORS** is a zero-allocation, touch-first HTML5 Canvas multiverse survival roguelike engineered for mobile WebViews and desktop browsers.
- **Zero-GC SoA TypedArray Engine (`js/state.js`, `js/sim.js`):** All high-frequency entities (Enemies, Projectiles, Orbs, Damage Numbers, Particles, Blood Drips, Severed Limbs, Corpses, Bisected Halves, Allied Squad/Minions, and Temporal Snapshots) reside in pre-allocated Structure-of-Arrays (`Float32Array`, `Int16Array`, `Uint8Array`) pools.
- **In-Place Non-Destructive HUD (`js/ui.js`):** All HUD bars (`#wpnSlots`, `#utilBar`, `#dashSlot`, `#spellBar`, `#bodyHud`, `#perfHud`) update their text and CSS properties in-place so mobile touch events never drop mid-tap.

---

## 2. Deep Architectural Audit & Smart Restructuring for Version 9.0

During our cross-file audit of the v8.2 codebase against your Version 9.0 requirements, we identified the root causes of every reported bug and designed clean structural solutions:

### A. Root-Cause Bug Audit
1. **Why Regular Corpses Had "Orb Heads" (`js/render.js`):**
   - In `renderScene()`, intact corpses (`MAX_CORPSE`) and upper bisected halves (`slHalf[i] === 0`) drew a plain circle (`ctx.arc`) tinted with `corpHeadCol[i]`, which defaulted to the faction's neon primary color (`player.fac.c1`), making fallen henchmen look like they had glowing cyan/green orbs for heads.
   - **v9.0 Fix:** Deterministic Chaos-driven **Procedural Head & Knocked-Helmet Generator** seeded by `corpSeed[i]`. ~45% of enemies keep their faction helmet/hood intact; ~55% have their helmet/hood knocked off onto the ground nearby (`lmbKind = 3`), exposing a skin-toned head with randomized head radius (`3.1px–4.1px`), randomized eye size/spacing, eyebrow angle/placement, and nose bridge size.
2. **Why Stowed Lightsabers Stayed Ignited (`js/render.js`):**
   - In `drawHeroSprite()`, the holstered weapon loop called `drawWeaponModel()` identically to active held weapons, drawing the full glowing plasma blade on the hero's back or hip.
   - **v9.0 Fix:** `drawWeaponModel()` receives an explicit `isStowed` flag (`true` when holstered on belt/back or during `swapPause > 0.08`). When `isStowed === true` on a lightsaber, the plasma blade is **deactivated**—rendering only the metallic hilt! Hero hilts (`#00` Luke, `#03` Sidious, `#76` Vader, `#77` Maul double-hilt, `#78` Windu gold electrum, `#79` Yoda shoto) always render their exact canonical hilt, while generic/custom sabers roll deterministic metal finishes (brushed beskar, gunmetal, brass, chrome) and emitter shrouds.
3. **Why Bottom-Right Run Stats Disappeared (`index.html`, `js/ui.js`):**
   - FPS and corpse telemetry were only rendered inside `#scrHealth` on the main menu instead of the live HUD.
   - **v9.0 Fix:** Added a dedicated, high-contrast bottom-right telemetry pill (`#perfHud`) displaying live `FPS | ms/frame | Bodies: X/Max | Enemies: Y` so you can immediately tell if the game is running smoothly or frozen.
4. **Why Bisected Bodies Persisted Across Runs (`js/state.js`):**
   - `purgeRunMemory()` in `js/state.js` cleared `corpAct.fill(0)` and `lmbAct.fill(0)`, but **never cleared `slAct.fill(0)`** (the `MAX_SLICE = 64` bisected torso halves pool defined in `js/sim.js`)! Whenever you sliced enemies in a circle, quit to the menu, and started a new run, those 64 bisected body halves remained on the ground at `(256, 256)`.
   - **v9.0 Fix:** Full pool obliteration (`slAct.fill(0)`, `blAct.fill(0)`, `eScarHeat.fill(0)`, `thrownBlade.active = false`) paired with the new **Interactive Post-Run Memory Purge & Diagnostic Screen (`#scrPurge`)**.
5. **Why Level-Up Cards Could Not Be Inspected (`js/ui.js`):**
   - On `#scrLevel`, holding a card for 350ms was either swallowed by click-release timing or lacked the full Level 10 & DPS breakdown, and closing `#tooltip` risked unpausing the game while `#scrLevel` was still open.
   - **v9.0 Fix:** Dedicated pointer-hold lock on all `#lvlGrid` and pause-menu cards with a `suppressNextClick` guard so releasing a 350ms hold never accidentally selects the upgrade.

### B. Roster & Faction Restructuring (Removing Warhammer 40K & Dune)
To keep the 80-hero array (`#00–#79`) + Custom Hero (`#80`) cleanly indexed without breaking save files or weapon IDs:
- **Former Faction 3 (`Dune`, `#18–#21`) $\rightarrow$ Rebuilt as `Faction 3: HEAT & CONTRACT SYNDICATE (Heist / Assassins / Die Hard)`:**
  - `#18`: **John McClane** (*Die Hard* — Barefoot Nakatomi survivor; Beretta 92F + Vent Ambush & Duct-Tape Surprise).
  - `#19`: **Hans Gruber** (*Die Hard Villain* — Tailored suit mastermind; suppressed **HK P7M13** & **Steyr AUG** assault rifle + Vault Detonator).
  - `#20`: **Agent 47** (*Hitman* — Dual suppressed **ICA Silverballers**, Fiber-Wire execution, Chameleon Disguise stealth).
  - `#21`: **Léon Montana** (*Léon: The Professional* — Compensated suppressed **Beretta 92FS / Sniper** + **CQC Combat Knife** utility & Potted-Plant Resilience).
- **Former Faction 6 (`Warhammer 40K`, `#34–#38`) $\rightarrow$ Rebuilt as `Faction 6: TACTICAL SPEC-OPS, SWAT & STEALTH`:**
  - `#34`: **Lt. A.K. Waters & Tears of the Sun SEAL Squad** (*Bruce Willis + "Flea", "Red", "Lake", "Slo", "Zee"* — Selecting Waters or any squad member deploys the **entire 6-man Special Forces team** together on the map with Sniper, SAW MG, Breacher Shotgun, and Leadership Aura!).
  - `#35`: **SWAT Tactical Pointman** (Deploys with an **Armored SWAT BearCat Truck** + 2 AI SWAT Riflemen riding on the sides firing at hostiles until their armor breaks).
  - `#36`: **US Special Forces Operator** (Deploys with an **Armored Troop Transport**; dismounting deploys a squad of allied riflemen).
  - `#37`: **Abrams Tank Commander** (Operates an **Armored Battle Tank** with an AI Co-Gunner manning the secondary machine gun while you fire the main cannon).
  - `#38`: **Sam Fisher / Shinobi Stealth Operative** (Tri-Focal NVG + Suppressed Five-seveN & **3-Second Environmental Object Shadow-Meld** with live proximity ring).
- **Additional Action, Heist & Time-Control Icons Integrated into Existing Slots:**
  - **Heat (1995) Crew & LAPD** (**Neil McCauley**, **Chris Shiherlis**, **Lt. Vincent Hanna**) integrated into the Action/Heist roster with authentic Colt 733 / FN FAL acoustics.
  - **Avengers & Cosmic Time Titans** (**Thanos with 6-Stone Infinity Gauntlet**, **Iron Man**, **Captain America**, **Thor**, and **TimeShift Beta-Suit Operative** with yellow 'T' Chrono-Visor & Chrono-Gauntlet).
  - **Yautja Predator (`#29`) Upgraded:** Active Cloak (enemies display `?` confusion and search blindly) + **Spine-Rip Trophy Finisher** (1-hit close-range execution leaving the head and hanging spine).

---

## 3. Version 9.0 Feature Specifications

1. **"Get 'Em Space!" — Rival Crowd Deference & Show of Force:**
   - Whenever a Rival (`et === 98`) is alive on-screen, standard NPCs (`et < 98`) within `220px` enter a **Deference State**: they slowly back away to form a respectful dueling perimeter around you and the Rival.
   - **The Show of Force:** 1 to 2 reckless NPCs refuse to back down and charge the Rival. The Rival immediately snaps to them and **obliterates** them (instant bisection/explosion with a `"OUT OF MY WAY!"` callout) before turning their full attention to you.
2. **Universal DPS Calculator & Level-Up Delta Telemetry:**
   - Every card on `#scrLevel` displays a right-aligned **DPS Telemetry Badge** showing:
     - `Δ DPS` if selected/equipped, `Min DPS (Lv.1)`, and `Max DPS (Lv.10)`.
     - **Red Badge:** Lower DPS than your current active hand slots.
     - **Green Badge:** Higher immediate or Max DPS than your current active DPS.
     - **Flashing Green-Gold Badge (`super-dps-flash`):** Max DPS exceeds the Lv.10 ceiling of your currently equipped weapons!
   - **Pause Menu `[📊 TACTICAL DPS & ARSENAL MATRIX]`:** Compares all held weapons, passives, relics, and utilities side-by-side.
3. **Active-Only Weapon Leveling:**
   - `triggerLevelUp()` strictly filters `player.weapons` by `w.enabled !== false`. Deactivated (`OFF`) weapons on your belt never appear as upgrade cards on level-up.
4. **Always-Unlocked Custom Character Creator (`Hero #80`):**
   - Free (`0 DM`) at the top of the Character Roster & Main Menu.
   - Customize Head/Visor, Torso, Legs, Back/Jetpack, House Crest, Class (Standard, Force Wielder, Wizard, Cyborg), Weapon, Hilt Style/Metal, Blade Color, **Blade/Gun Topology** (Single, Double-Bladed Maul Staff, or **Dual-Wield Twin Sabers / Twin Guns** right from Lv.1 with 0 DM), and **Multi-Slot Utility Belt** (up to 10 utilities, including Chrono-Gauntlet & Stealth Cloak).
   - **Twin Weapon Differentiation:** Identical dual-wielded weapons are automatically named **`[Weapon Name] #1 of 2`** and **`[Weapon Name] #2 of 2`** so you can track and upgrade each gun independently.
5. **True Temporal Rewind Engine (`-0.5x` to `-5.0x`):**
   - Available whenever your hero has the **Infinity Gauntlet (Thanos)**, **Chrono-Gauntlet (TimeShift)**, **Time-Turner Locket (Hermione `#57`)**, **Eye of Agamotto (`#73`)**, or equips the Chrono-Gauntlet on a Custom Character.
   - Adds a **`[⏪ REWIND]`** button to the left of `-0.5x` on the HUD. Stepping below `0.0x` (`-0.5x`, `-1.0x`, `-2.5x`, `-5.0x`) streams backward through a 600-keyframe circular ring buffer: dead enemies and corpses rise back to life and walk backward toward `0:00` (where time halts at `0.0x` waiting for you to press Forward), while **keeping 100% of your earned Dark Matter, Character Level, and Weapon Upgrades**!

---

## 4. Version 9.0 Testable Batch Implementation Plan

To ensure every feature can be tested cleanly without code cutoffs, we will roll out Version 9.0 in **6 Modular Batches**:

- **v9.0 Batch 1 ( Diagnostics, Memory Purge Screen, Bottom-Right Perf HUD & Corpse/Saber Visual Fixes):**
  - *Files:* `index.html`, `css/style.css`, `js/state.js`
  - *What You Can Test Immediately:* Bottom-right live FPS/Body count HUD; the animated Post-Run Memory Purge & Diagnostic Screen (`130 -> 0 CLEARED` with the sarcastic 1-click force-copy fallback button); `slAct` ring-of-bodies bug fix; and Temporal Ring Buffer allocation.
- **v9.0 Batch 2 (Roster Overhaul: Die Hard, Hitman, Léon, Heat, SWAT/Military/Tank, Tears of the Sun, Ninja, Sam Fisher, Avengers, Thanos & TimeShift):**
  - *Files:* `js/data-factions.js`, `js/data-heroes.js`, `js/chaos.js`
  - *What You Can Test Immediately:* Warhammer 40K & Dune replaced by the new Action/Heist/Spec-Ops/Cosmic heroes; authentic subsonic **suppressed gun audio** (`chaos.js`) for Hans Gruber's AUG/P7, Agent 47's Silverballers, Léon, and Sam Fisher.
- **v9.0 Batch 3 (Procedural Faces/Knocked Helmets on Corpses & Deactivated Stowed Lightsabers with Random/Hero Hilts):**
  - *Files:* `js/render.js`
  - *What You Can Test Immediately:* Stowed lightsabers on back/hip deactivate to metal hilts (canonical hero hilts vs randomized metal hilts); fallen enemy corpses show knocked-off helmets and procedural Chaos-generated faces (varied head size, eyes, eyebrows, nose) instead of colored orbs.
- **v9.0 Batch 4 ("Get 'Em Space!" Rival Crowd Deference, Predator Cloak + Spine-Rip Finisher, Ninja Object-Stealth & Squad Vehicles):**
  - *Files:* `js/world.js`, `js/combat.js`
  - *What You Can Test Immediately:* NPCs backing away when a Rival spawns + Rival obliterating 1–2 defiant NPCs; Predator Cloak (`?` enemy confusion) + Spine-Rip finisher; Ninja 3-second object-proximity stealth meter; Tears of the Sun full-squad deployment; SWAT Truck, Troop Transport & Tank with AI co-gunners.
- **v9.0 Batch 5 (True Temporal Rewind Engine `-0.5x` to `-5.0x`):**
  - *Files:* `js/sim.js`
  - *What You Can Test Immediately:* Rewinding time all the way back to `0:00` with Thanos, TimeShift, or Hermione (`#57`)—watching dead enemies resurrect and reverse while keeping your Dark Matter and weapon levels.
- **v9.0 Batch 6 (Custom Character Creator `#80`, Twin Gun `#1/2` & `#2/2` Tracking, Active-Only Leveling & Live DPS Delta Matrix):**
  - *Files:* `js/ui.js`
  - *What You Can Test Immediately:* Building a custom hero from any unlocked parts (including 0-DM dual sabers or dual fan-hammer revolvers labeled `#1 of 2` and `#2 of 2`), inspecting cards on the Level-Up screen, viewing Red/Green/Flashing-Gold DPS Deltas, and verifying that `OFF` weapons never appear on level-up.