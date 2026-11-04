# OMNI-SHIFT v15: CHRONO-LATTICE RATCHET LEDGER
**Directive Code:** `VERDIKA-LOCKSTEP-15`
**Anchor Date:** 2026-11-04
**Base Snapshot:** Commit `c0c11dd` (Cache `15.0.69`, Branch `v15`)

---

## 0. MANDATORY WATERMARK & LOOP-BREAKER DIRECTIVE

1. **Temporal Watermark:** Every status update, test log summary, and Git commit message produced after reading this file MUST include the exact phrase **`CHRONO-LATTICE RATCHET LEDGER`**. This phrase is a unique temporal marker establishing that work is operating under the post-`c0c11dd` micro-revision architecture rather than the old 31-item monolithic loop.
2. **Why Development Stalled Between v14.3 and v15:**
   - Up through `v14.3` (`89d6b21`), features were built and verified in focused 1-to-2 hour commits.
   - Between `v14.3` and `c0c11dd`, 31 massive parent items (`J01`–`J15` and `T16`–`T31`) plus a 10-pass whole-game audit were coupled into a single fail-closed release gate (`qa/v15_release_gate.py` + `qa/v15_item_gate.py`).
   - Because `qa/v15_release_gate.py` blocks any final v15 build until all 31 items are 100% complete, telling the agent to *"shelve what isn't working and finish what is working"* caused a contradiction: the code in `js/releaseprofile.js` shelved unfinished features, but the gate scripts still rejected the build because shelved items were <100%.
3. **The New Law (Strict Decoupling):**
   - **Stop trying to complete all 31 items for `v15.0`.**
   - **Stop running 10-pack whole-game regressions after every tiny edit.** Run only the single targeted test for the active micro-revision, and run the full serial suite ONLY at the Midpoint Seal (`v15.0.99-OMEGA`).
   - **Work is now split into three distinct tiers:**
     - **Tier 1 (`15.0.1` to `15.0.8` — Micro-Revisions):** 1-to-2 hour locked chunks that finish, polish, and verify **ONLY the systems and job flavors that already work** in `c0c11dd`. Anything broken or unbuilt is explicitly shelved—never debugged or expanded during `15.0.x`.
     - **Tier 2 (`v15.0.99-OMEGA` — The Midpoint Seal):** The hard breakpoint between `15.0.x` and `15.1.x`. At `v15.0.99-OMEGA`, 100% of enabled features work, all shelved features are cleanly gated off, the release gate is scoped strictly to enabled `15.0` features, and the working **v15.0 Final Overlay ZIP** is produced.
     - **Tier 3 (`15.1.x`, `15.2.x`, `15.3.x` ... — Shelved Feature Rollouts):** Every feature, career flavor, or subsystem that was shelved because it was broken or unbuilt is moved to planned post-baseline versions (`15.1` through `15.7`), built in small modular increments after `v15.0.99-OMEGA` is locked.

---

## 1. WORKSPACE TIMESTAMP & PARALLEL-PATH AUDIT

Before executing `15.0.1`, align your context with the actual chronological ground truth found in `.git/logs/HEAD` and the workspace files—do not resurrect superseded paths:

- **2026-10-31 21:30 to 2026-11-01 13:25 UTC (`v14.2`, ends at `6876ce3`):** Built Star Wars saber choreography, world profiles, 14 Indiana real-map packs, economy/apocalypse, soft-Newtonian flight, and Ki-Surge. **Status:** Locked legacy baseline.
- **2026-11-01 14:51 to 17:29 UTC (`v14.3`, ends at `89d6b21`):** Built 1:3 real-map scaling, `js/traffic.js`, `js/police.js`, `js/actionui.js`, `js/gunart.js`, `js/dualaim.js`. **Status:** Locked legacy baseline.
- **2026-11-02 (`uploads/ARCHITECTURE-DOCTRINE.md` — Codename `KM45`):** A 254 KB normative open-world spec uploaded mid-stream. **Parallel-Path Warning:** As noted in `V15_STABLE_TASK_TRACKER.md`, further `ARCHITECTURE-DOCTRINE.md` overhaul work is **DEFERRED**. Do NOT use `KM45` to rewrite existing v15 modules.
- **2026-11-03 18:10 UTC (`95e62d4`, Cache `15.0.46`) vs. 20:19 UTC (`3ed123d`, Cache `15.0.48`):**
  - *Superseded Path:* At `15.0.46` (still reflected in the stale header of `V15_REVISED_PLAN.md` "report 16" and `CHANGELOG_v15.md`), all `J02` and `J09` dispatch offers were turned off, and at `15.0.48` only `J09.SUPPLY` was exposed.
  - *Current Active Truth (`2cccfea` & `c0c11dd`, 2026-11-04 13:07–13:22 UTC, Cache `15.0.69`):* After recovering from the host `.git` reset to `9781081` via `qa/v15_recent_commits_recovery.bundle` (`0c0e572`) and purging 1,913 obsolete QA/evidence files (`0a0906b`), `js/releaseprofile.js` now enables **6 working dispatch contracts** (`J09.SUPPLY`, `J09.PRIORITY`, `J09.MEDICAL`, `J09.MEDICAL_CONTACT`, `J09.SHIFT`, and `J02.WITNESS`) while keeping `T22.MULTI_VEHICLE_CONVOY: false`.
  - **Action Required:** Trust `js/releaseprofile.js` and `V15_STABLE_TASK_TRACKER.md` (Report 33, `c0c11dd`) over the stale "Report 16" text at the top of `V15_REVISED_PLAN.md`.

---

## 2. PHASE A: MICRO-REVISIONS (`15.0.1` – `15.0.8`)
**Goal:** Lock in what already works, shelve every non-working sub-flavor, synchronize stale docs/gates, and reach a 100% working `v15.0` without writing new speculative features.

### Micro-Revision `15.0.1` — Release Profile & Doc Synchronization
- **Scope:**
  - Keep `js/releaseprofile.js` locked to the 6 working contracts (`J09.SUPPLY`, `J09.PRIORITY`, `J09.MEDICAL`, `J09.MEDICAL_CONTACT`, `J09.SHIFT`, `J02.WITNESS`) and `T22.MULTI_VEHICLE_CONVOY: false`.
  - Ensure any unmapped/unknown contract ID in `v15ContractEnabled(id)` only passes when an explicit `V15_INTERNAL_TEST_MODE` flag is set by QA fixtures, closing the loophole where unauthored contract aliases bypass `V15_CAREER_CONTRACTS`.
  - Update `Omni-Shift-Nexus-Survivors/CHANGELOG_v15.md` and `RELEASE_SCOPE_v15.md` so they match `15.0.69` (`c0c11dd`) instead of stopping at `15.0.52`.
- **Shelved to `15.1+`:** Full 5-stage careers for `J02`/`J09`, all unbuilt careers (`J01`, `J03`–`J08`, `J10`–`J15`), and `T22.MULTI_VEHICLE_CONVOY`.
- **Verification:** Run `qa/run31_staging_boot_module_checks.py` (fast boot + module probe).

### Micro-Revision `15.0.2` — Courier System Lock-In (`J09` Working Flavors)
- **Scope:**
  - Verify and freeze the 5 working Courier contracts (`community_supply`, `priority_supply`, `medical_supply`, `medical_supply` with `recipientMode`, and 3-stop `courier_shift` with on-foot assistant and run-local work vehicle).
  - Keep the `c0c11dd` fault-injected work-vehicle rollback (`js/jobvehicle.js`) intact.
  - Explicitly label run-local vehicle/fuel behavior in the dispatch UI so it is a documented `15.0` mechanic rather than an open bug.
- **Shelved to `15.2.x`:** Cross-reload persistent loaner vehicles/fuel, assistant vehicle boarding, dynamic road closures, and 7–12 minute multi-act courier arcs.
- **Verification:** Run focused courier checks (`qa/run36_jobvehicle_installed.py`, `qa/run36_loan_touch_retry.py`, `qa/run33_shift_hold_resume.py`).

### Micro-Revision `15.0.3` — Witness Investigation Lock-In (`J02.WITNESS` Working Flavor)
- **Scope:**
  - Freeze the bounded `witness_trace` call (report review, civilian contact interview, optional person-of-interest denial interview, damageable missing-witness foot escort, one-time first aid, and optional unarmed support contact).
  - Add a defensive null/property guard around `hp` deserialization in `js/jobcareer.js` / `js/jobdispatch.js` when hydrating saved witness/contact records so legacy or partial checkpoint objects never throw `KeyError('hp')` or undefined property errors on reload.
- **Shelved to `15.2.x`:** Armed suspect confrontation, police responder handoff, arrest/transport mechanics, and full Detective rank progression.
- **Verification:** Run `qa/run35_witness_profile.py` and `qa/run35_witness_hold_resume.py`.

### Micro-Revision `15.0.4` — Flight, Cruise & Touch HUD Lock-In (`T25`, `T26`, `T28`)
- **Scope:**
  - Lock in the working 60m altitude combat-separation boundary, screen-sized flying hero rendering, held aircraft-to-self-flight transition (`flyEnd` guard), road-vehicle `CRUISE` hold/cancel, and 48px coarse-pointer HUD wrapping (`js/flight.js`, `js/hudlayout.js`, `js/actionui.js`).
  - Add a clean viewport clamp for the separate flight-control panel on narrow landscape screens so it never covers the primary action/exit button.
- **Shelved to `15.4.x`:** Full 3D rooftop-relative altitude combat, adaptive dynamic HUD re-architecting, and physical Android hardware sign-off.
- **Verification:** Run `qa/run30_flight_hold_transition.py`, `qa/run30_flight_job_actual_touch.py`, and `qa/run28_current_self_tap.py`.

### Micro-Revision `15.0.5` — Law, Radar, Attribution & Civilian Safety Lock-In (`T18`, `T19`, `T20`)
- **Scope:**
  - Lock in the working stationary cruiser `RADAR` tool, witnessed-only traffic citations, 12-second stuck-officer traffic-stop cancellation, off-screen radioed cruiser spawning, launch-position ballistic/spell witness checks, rewind evidence preservation, and optional Auto-fire Safety Assist (`js/police.js`, `js/combat.js`, `js/rewind.js`).
- **Shelved to `15.3.x`:** Player-operated traffic stops/ticketing, suspect arrest/transport, tow trucks, and persistent long-term NPC witness memory.
- **Verification:** Run `qa/police_arrival_viewport_v15.py` and targeted `v15` law/attribution tests.

### Micro-Revision `15.0.6` — Player-Car Squad Boarding & Overflow Hold Lock-In (`T21`, `T22` Subset)
- **Scope:**
  - With `T22.MULTI_VEHICLE_CONVOY: false`, verify and lock in the working squad behaviors: travel-oriented infantry follow slots, boarding the player's vehicle up to seat capacity, overflow squad members holding position with a map marker, and clean unpinning on player re-entry.
  - Keep `vehClearEmbeddedHay` (tractor) and `vehClearEmbeddedStop` (armytruck) plus warehouse clear-strip forklift placement active for player-driven vehicles.
- **Shelved to `15.1.x`:** Multi-vehicle AI overflow convoys (`A09`, `A10`, `F04`), herringbone shoulder parking, and faction-specific indoor breaching formations.
- **Verification:** Run `qa/packs/vehicles.py` enabled subset (excluding deferred `A09`/`A10`/`F04`).

### Micro-Revision `15.0.7` — Save Protection, Portable Backup & Map Scale Baseline (`T24`, `T27`)
- **Scope:**
  - Lock in unreadable-save overwrite protection, storage-failure retry UI, Progress Backup JSON export/import/recovery (`js/savebackup.js`), and the `DEFAULT` (1:2) / `±25%` real-map scale options that preserve existing saved world keys.
- **Shelved to `15.3.x`:** Procedural/generated-world road-width and building-footprint rescaling (`T24` citygen/regiongen coordinate migration).
- **Verification:** Run `qa/backup_touch_v15.py`.

### Micro-Revision `15.0.8` — Baseline Gate Alignment for `v15.0`
- **Scope:**
  - Update `qa/v15_regression_policy.py` and `qa/v15_release_gate.py` so they support a **Baseline Release Mode (`--profile=v15.0-omega`)**:
    1. All tests for enabled features must pass 100%.
    2. Explicitly gated `15.1+` items (`A09`, `A10`, `F04` convoy tests and unbuilt careers) are recorded in `DEFERRED_TO_V15_1_LEDGER.json` rather than blocking the `v15.0` baseline build.
    3. Locally omitted asset tests (`v142:R20` Clay City and `sabers:S10` omitted MP3 track) are explicitly classified under the authorized 2-city/2-track local subset rule (verified via `R24` and `ORIGINAL_SNAPSHOT_MANIFEST.json`) rather than treated as code regressions.

---

## 3. PHASE B: THE MIDPOINT BREAKPOINT (`v15.0.99-OMEGA`)
**Meaning:** `v15.0.99-OMEGA` is the **Ironclad Midpoint Seal** between the `15.0.x` stabilization micro-revisions and the `15.1+` shelved-feature expansions.

At `v15.0.99-OMEGA`, and **ONLY** at `v15.0.99-OMEGA`:
1. Set `index.html` cache tag to `15.0.99-OMEGA`.
2. Run the full serial regression suite once across all 10 packs and verify that:
   - Source SHA-256 digest is identical before and after the run.
   - Every enabled test passes (`426/426` enabled, with `S10` and `R20` documented under the local-asset omission manifest and `A09`/`A10`/`F04` deferred to `15.1.x`).
3. Run `qa/run22_stage_overlay.py`, `qa/run26_overlay_verify.py`, and `qa/package_v15_final.py` to build the clean, shippable **`omni-shift-v15.0-omega-overlay.zip`** (no `.git`, every file <20 MB, with `V15_OVERLAY_MANIFEST.json` listing the 30 unchanged remote asset prerequisites).
4. Create a local Git tag/branch `v15.0.99-OMEGA` and update `qa/v15_recent_commits_recovery.bundle`.

**No shelved feature may be re-enabled or coded until `v15.0.99-OMEGA` is sealed and packaged.**

---

## 4. PHASE C: SHELVED FEATURE ROADMAP (`15.1.x` – `15.7.x`)
Once `v15.0.99-OMEGA` is locked, bring back the shelved features one isolated minor version at a time:

### `v15.1.x` — Multi-Vehicle AI Convoy & Herringbone Recovery (`T22`, `T29`)
- **`15.1.1`:** Deterministic corridor & prop-relocation trace (fixing `A09` fixture vs. `K_POLE` width mismatch).
- **`15.1.2`:** Leader traffic-collision avoidance & follower `rejoin` catch-up velocity floor when leader halts early.
- **`15.1.3`:** Herringbone target lock (fixing the bug where `cvDrive` overwrites `c.hx, c.hy` every tick) and `A10` 30-frame physical parking certification.
- **`15.1.4`:** Flip `T22.MULTI_VEHICLE_CONVOY: true` once `A09`, `A10`, and `F04` pass deterministically.

### `v15.2.x` — Full Detective (`J02`) & Courier (`J09`) Career Completion + Persistent Vehicles (`T16`, `T17`)
- **`15.2.1`:** Serialize active loaner work-vehicle pose, HP, and fuel in `meta.jobState` across reloads, and allow the courier assistant to board passenger seats.
- **`15.2.2`:** Complete `J09` Courier 5-stage career progression, road-closure rerouting, and 7–12 minute flagship arc.
- **`15.2.3`:** Complete `J02` Detective confrontation, police responder arrival, guarded handoff, and 5-stage career progression.

### `v15.3.x` — Proactive Police Role (`J01`, `T18`), Actor Identity (`T19`), & World Scale Migration (`T24`)
- **`15.3.1`:** Durable Actor UUIDs & hydration/dehydration invariants (`T19`) so mission/witness NPCs never lose identity across streaming or crime-selector passes (`C66`).
- **`15.3.2`:** Player-operated cruiser pull-over, walk-up citation/search, suspect arrest, and cruiser transport (`J01` Patrol Officer + `T18`).
- **`15.3.3`:** Versioned `genScaleVersion: 2` procedural road/building scale migration (`T24`) that keeps legacy `genScaleVersion: 1` worlds byte-identical for old saves.

### `v15.4.x` — Emergency & Rescue Careers (`J04` Firefighter, `J05` Paramedic, `J06` SAR, `J07` Airlift, `J08` Mechanic/Tow)
- Build each responder career in its own sub-revision (`15.4.1` through `15.4.5`) reusing `jobcore.js` checkpoints and `jobvehicle.js` spawning.

### `v15.5.x` — Tactical & Underworld Careers (`J03` SWAT, `J10` Bounty Hunter, `J11` Security, `J12` Heist, `J13` Smuggler, `J14` Mercenary)
- Build one career per sub-revision (`15.5.1` through `15.5.6`).

### `v15.6.x` — Universe-Specific Career Profiles (`J15`) & Squad Faction Doctrine (`T21`)
- Map universe-native call variants (Star Wars bounty/Imperial patrols, Cyberpunk trauma/netrunner, Post-Apoc convoy escort) and faction door/crossing formations.

### `v15.7.x` — Material-Aware Destruction & Repair (`T23`)
- Implement bounded, per-chunk delta-overlay structural damage, wall penetration, fire spread caps, and repair crews.

---

## 5. TECHNICAL CAUTIONS & ANSWERS TO `V15_INDEPENDENT_REVIEW_HANDOFF.md`
*(For use during `15.0.x` stabilization and `15.1.x` convoy work)*

### Top 5 Technical Findings (Tagged Observed / Inference / Unverified)
1. **[Observed — High Impact] `cvDrive` Overwrites Herringbone Target `c.hx, c.hy` Every Frame (`js/convoy.js:488–534`):**
   - In `cvDrive(v, dt, target, gap, i)`, `was` is captured before `cvDriveNormal`. On the frame `cvDriveNormal` transitions `c.st` from `"go"`/`"column"` to `"herring"`, `was !== 'herring'` and `c.st === 'herring'`. Execution falls through to lines 513–534, which **re-projects and overwrites `c.hx` and `c.hy` 120–360 px forward**! Worse, on subsequent frames (`was === 'herring'`), lines 494–507 run a curved-path lookahead check (`cvHaltPoseClear`) that slams the brakes (`v.ctl.thr = -1; v.ctl.hb = 1`) whenever `look` (minimum 96 px) touches the leader's safety box or another follower—freezing the follower 30–90 px short of `c.hx, c.hy` so `A10` (`d < 18` for 30 frames) never completes.
2. **[Observed — High Impact] `A09` Corridor Scan Width vs. Actual Vehicle Footprint (`qa/packs/vehicles.py:187` vs. `js/vehicles.js:795`):**
   - `A09` scans for a straight corridor using `for (const o of [-46, 0, 46]) if (cityCircleBlocked(..., 4, false))`—checking a lateral half-width of `46 + 4 = 50 px` at `24 px` longitudinal steps.
   - However, `me` is spawned as a `sedan` (`L = 64, D = 144`) and followers can promote wider parked props (`armytruck`, `suv`, `pickup`), plus `A09` steers using `vehAngDiff(R.ang, me.ang) * 2`. In `run35_convoy_candidate.json`, `me` started at `x = 216.0, y = 325.3` and drifted laterally to `x = 212.7, y = 78.1`, clipping tile `(tx: 75249, ty: 61434)` (`k: 20` / `K_POLE`) at the edge of the corridor, which triggered `vehWorldCollide` velocity damping and dropped top speed to `17 mph`.
3. **[Observed — High Impact] Traffic Collision & `rejoin` Deadlock in `A09` (`run36_convoy_obstacle_trace.json`):**
   - In `run36`, the leader (`cv`) did not hit terrain, but collided repeatedly with live traffic (`trf2`, hover car, `depth: 3.17`), capping leader speed at `9 mph` (`vy: 106 px/s`).
   - Because `A09` asserts `if (P.d < 120 && Math.hypot(u.vx, u.vy) > 60) followed++` only at the single instant `k = 480` (right after the 8-second drive loop ends), any traffic slowdown that causes followers to brake via the feeler `vDes = Math.min(vDes, Math.max(0, (block - 20) * 1.6))` at `k = 480` results in `followed = 0`.
   - Then, when `keys.Space = true` halts the leader, followers with `err < -gap * 0.8` are forced into `c.st = "rejoin"` (`js/convoy.js:343`). While in `rejoin` during a halt, `lead` speed is `0`, so `vDes = Math.max(0, lead - err * 1.1)` drops to `0` as soon as `err >= -gap * 0.4` (even while `err < 0` or `P.d <= 90`), stranding both units at `speed: 0` in `"rejoin"` (`dist: 330.4` and `113.6`) forever!
4. **[Inference — Medium Impact] `C66` Witness Disappearance & Initial `KeyError('hp')` (`T19` / `J02`):**
   - When a saved witness checkpoint is reloaded while the player is far away, chunk streaming/townsfolk pool recycling (`TF.walk`) can fail to hydrate the physical walker `p.w` before the test fixture inspects the actor's live `hp` field, whereas positioning the player near the saved coordinates forces immediate chunk/walker hydration. Storing authoritative `hp` on the persistent `meta.jobState.active.data` record (and falling back to it when `p.w` is unhydrated) will prevent both the `KeyError('hp')` and off-screen state loss.
5. **[Observed — Medium Impact] `v143:A02` & Touch Action Priority Edge Cases:**
   - In `v143:A02` (building/roof action fallback), `actionui.js` debounces taps on wall-clock time and filters competing prompts. When `jobdispatch.js` or telemetry pills update layout during startup, coordinate shifts or active chooser modal state can swallow synthetic test taps if the chooser state isn't explicitly cleared on `G.start()`.

### Actionable Patch Blueprint for `v15.1.x` (Do NOT apply until after `v15.0.99-OMEGA` is sealed!)
When you reach `v15.1.x` to fix Convoy (`js/convoy.js`):
1. **Fix the `rejoin` Speed Floor When Leader is Halted (`js/convoy.js:368–375`):**
   - When `CONVOY.halted` is true and `c.st === "rejoin"`, `lead` is `0`. Replace the `vDes` calculation during halted rejoin with a positive closing speed until the vehicle is within herringbone eligibility (`Math.abs(err) < gap * 0.8 && P.d < 90`):
     ```javascript
     if (CONVOY.halted && c.st === "rejoin") {
       const needClose = err < -gap * 0.6 || P.d > 80;
       if (needClose) vDes = Math.max(vDes, Math.min(140, Math.max(Math.abs(err), P.d) * 0.9 + 45));
       else c.st = "column"; // Eligible to enter herringbone block on next tick
     }
     ```
2. **Stop Overwriting `c.hx, c.hy` and Relax Self-Braking Near `c.hx, c.hy` (`js/convoy.js:488–534`):**
   - If `cvDriveNormal` already found a valid `(c.hx, c.hy)` that passed `!cityCircleBlocked` and `cvSpotClear`, do **not** overwrite `c.hx, c.hy` with `[240, 180, 300, 120, 360]` forward offsets unless the original `(c.hx, c.hy)` failed `cvHaltPoseClear`.
   - In the `was === 'herring'` braking loop (`lines 494–507`), cap `look` to `Math.min(dToTarget, 64)` so the parking car does not brake for obstacles *beyond* its target parking spot `c.hx, c.hy`.

---

## 6. PEER-AI PERSPECTIVE DISCLAIMER

> **Important Perspective Note for the Implementation Agent (Arena.ai) & Developer:**
> This review and the **`CHRONO-LATTICE RATCHET LEDGER`** were prepared by an external AI reviewing a static snapshot (`c0c11dd`) and workspace archive from a different angle. Because I am outside your live E2B/Playwright runtime environment, I cannot execute live browser traces or see runtime side effects that only appear during interactive execution.
>
> **Arena.ai has direct, superior visibility into the live codebase, the Playwright harness, and module interactions.** Where a subsystem or fix looks complex or risky from my external static view, Arena.ai may see a cleaner, faster native solution—and where my static analysis flags a potential edge case, Arena.ai should verify it against the actual live source before changing working code. Use this ledger's **micro-revision boundaries (`15.0.1` → `v15.0.99-OMEGA` → `15.1+`)** as your strict scope guardrail so you can apply your full coding intelligence to one small, finishable chunk at a time.
