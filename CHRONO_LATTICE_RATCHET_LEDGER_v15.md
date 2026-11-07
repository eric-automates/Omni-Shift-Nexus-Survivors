# VERDIKA-LOCKSTEP-15 — ZERO-FLUFF STATUS & AUTO-ESCALATION

**Directive:** Install this protocol as persistent operating guidance.

## 1. ZERO-FLUFF OUTPUT LAW

- Never output long prose or code dumps in chat.
- Every reply starts with a status icon: 🟢, 🟡, or 🔴.
- Keep every chat line within 30 characters.
- End with exactly one explicit `YOUR NEXT ACTION` line for the user.

## 2. AUTONOMOUS STATUS BRANCHING

At the end of every turn, evaluate state and choose exactly one branch.

### Branch A — 🟢 GREEN

**Trigger:** A step reached `-LOCKED`, or `-partK` moved the target metric closer to green on Strike 1.

Output only:

```text
🟢 STATUS: IN PLACE & MOVING
WATERMARK: CHRONO-LATTICE-V2
STEP : <e.g. 15.1.3-LOCKED>
DELTA: <e.g. A10 d=191->14>
SCORE: <50% +7%/locked ser.>
BUNDL: <8-char SHA> (<MB>MB)
YOUR NEXT ACTION:
-> Reply "GO" to run <next>
```

### Branch B — 🟡 YELLOW

**Trigger:** Cutoff recovery, or Strike 2 of 3 on a `-partK` where the metric moved but the gate is not green.

Output only:

```text
🟡 STATUS: WORKING (STRIKE 2)
WATERMARK: CHRONO-LATTICE-V2
STEP : <e.g. 15.1.3-part16>
STRIK: [2/3] (Cap: 3 parts)
DELTA: <metric prev -> now>
BUNDL: <8-char SHA> (<MB>MB)
YOUR NEXT ACTION:
-> Reply "GO" for final try
```

### Branch C — 🔴 RED

**Trigger if any occur:**

- Two consecutive identical red
  canonical test traces.
- Strike 3 (`-part3` / `part16`)
  without a green gate.
- Any gauntlet regression.
- Hash, bundle, or git mismatch.
- Disk usage exceeds 118 MB.

**Mandatory auto-action:** Do not try another code fix. Immediately:

1. Revert uncommitted broken edits
   so the working tree is clean.
2. Rebuild
   `qa/v15_recent_commits_recovery.bundle`.
3. Generate
   `/home/user/MANAGER_ESCALATION_PACK.zip`
   under 20 MB, excluding the 30 MB
   map/music archive. Include:
   - `AI_MANAGER_BRIEF.md` with the
     exact failure trace, `git log -5`,
     diff, and what failed twice.
   - `ESTIMATE_TRAJECTORY.*`.
   - Latest failing
     `qa/evidence/*.json` and `.log`.
   - Modified `js/` files and
     `qa/v15_recent_commits_recovery.bundle`.
4. Output only:

```text
🔴 STATUS: OUT OF PLACE /
   PLATEAU DETECTED
WATERMARK: CHRONO-LATTICE-V2
REASON: <1-line root cause>
STEP  : <current tag>
PACK  : /home/user/MANAGER_
        ESCALATION_PACK.zip
        (<size MB>, READY)
YOUR NEXT ACTION:
-> Download MANAGER_
   ESCALATION_PACK.zip and
   hand to your AI Manager,
   OR reply "SHELVE" to skip
   to next revision series.
```

## 3. SHORTCUT COMMANDS

- **GO:** Advance one ratchet step and
  reply with 🟢, 🟡, or 🔴.
- **STATUS:** Run the Confidence-Restore
  Visual Graph & Audit check and reply
  with 🟢 or 🔴.
- **SHELVE:** Trigger the Plateau Circuit
  Breaker: turn the feature off in
  `releaseprofile.js`, log it in
  `DEFERRED_LEDGER`, tag
  `-DEFERRED-LOCK`, and start the
  next `15.X.1` series.

---

# CHRONO-LATTICE RATCHET LEDGER — INDEPENDENT REVIEW & RATCHET v2.0 DIRECTIVE
**Directive Code:** `VERDIKA-LOCKSTEP-15-R2`
**Reviewed Snapshot:** Branch `v15` @ `8fab687` (`15.1.3-part14`)
**Supersedes:** `CHRONO_LATTICE_RATCHET_LEDGER_v15.md` (v1.0)

---

## 1. ANSWERS TO §7 QUESTIONS (`verdict → minimal concrete change → observable/test → risk → unverified`)

### Q1. Product vs. Fixture Halt-Spot Rehearsal (§4 / §7.1)
* **Verdict:** **Put a lightweight Shoulder-Availability Delay in the Product (`convoyStep`) AND fix the station coordinates in the QA Fixture (`chrono1513HaltReady`).** However, first fix the two underlying bugs identified below (`keepAim` +240 px overshoot and `cvHaltLaneClear` using `v.D` instead of `v.L`), which are the actual reason Unit 0 (`[-212, -710]`, `d=191→143`) and Unit 1 (`[-276, -389]`, `d=265→83`) failed to settle in `part13`/`part14`.
* **Why `part14` Produced a Byte-Identical Trace (Observed Fact):**
  1. In `qa/packs/vehicles.py`, `chrono1513HaltReady(cx, cy, ang)` checks stations `f of [0.45, 0.55, 0.65]` of `2000 px` (`900 px`, `1100 px`, `1300 px`). In `A09`/`A10`, the leader starts at `y = 651.98` (`ang = -π/2`) and halts after 320 drive frames at `y = -1144.74` (`1796.7 px` down-road, `f ≈ 0.90`), while followers sit at `y = -389..-710`. Because the first corridor passed at `f = 0.45..0.65`, `chrono1511FindCorridor` returned the **exact same corridor** (`sx = -139.98, sy = 651.98`) as `part12` and `part13`.
  2. In `chrono_1513_planner_diag.log`, both followers **DID** commit to `herring` spots at `t = 0` (`Unit 0 -> [-212, -710]`, `d = 191`; `Unit 1 -> [-276, -389]`, `d = 265`) with `ka: true` (`c.keepAim = true`). They failed to reach `d < 18` because `c.keepAim` (`js/convoy.js:574–576`) aimed `+240 px` *past* `(c.hx, c.hy)` while `d > 90`, steering their `look = dSpot` halt-guard arcs (`js/convoy.js:838–844`) straight into obstacles beyond the spot (`arcS = 6..8`, `arcT = 8`) at `d = 143..147`, triggering `pinFails` release into a dead-band where `cvHaltLaneClear` rejected all `extra = 0, 64` candidates.
* **Minimal Concrete Changes:**
  1. **`Omni-Shift-Nexus-Survivors/js/convoy.js` (`cvDriveNormal`, lines 574–577):** Cap the `keepAim` virtual tangent lead so it never aims past the validated spot into unvalidated terrain, and turn it off once `d <= 64`:
     ```javascript
     if (c.keepAim && Number.isFinite(c.hAng) && (d > 64 && Math.abs(vehAngDiff(c.hAng, v.ang)) > .35)) {
       const leadD = Math.min(48, d * 0.4);
       const ax = c.hx + Math.cos(c.hAng) * leadD, ay = c.hy + Math.sin(c.hAng) * leadD;
       if (Math.hypot(ax - v.x, ay - v.y) > 24) { tx = ax; ty = ay; }
     }
     ```
  2. **`Omni-Shift-Nexus-Survivors/js/convoy.js` (`cvDrive` halt-guard lookahead, lines 832–836):** When `c.st === 'herring'`, cap the curved lookahead `look` to `Math.max(12, Math.min(look, dSpot - 12))` so the halt guard checks the path *up to* the validated spot center `(c.hx, c.hy)` (whose full pose is already certified by `cvHaltStaticPoseClear(v, c.hx, c.hy, h)`), not the wall beyond `(c.hx, c.hy)`.
  3. **`qa/packs/vehicles.py` (`chrono1513HaltReady`):** Sample stations `[0.55, 0.70, 0.85]` of `2000 px` (`1100 px`, `1400 px`, `1700 px`—matching the actual follower halt zone behind the leader's `~1800 px` stop) and require **both** `side = 1` and `side = -1` (or two distinct stations `>= 180 px` apart) to have a valid spot so a 2-follower column has 2 non-overlapping slots.
* **Exact Observable / Test:** `qa/run1513_planner_diag.py` and `qa/run1511_convoy_cases.py` (`A09` and `A10` both `ok: true`, `physicallyParked: true`, `arcS` stays `0` during approach from `d = 191 -> <18`).
* **Risk to A09/A10/F04:** Near zero for `A09` and `F04` (only affects `c.st === 'herring'` approach after halt).
* **Unverified:** Live browser execution of the combined `keepAim` + `cvHaltLaneClear` change against the 19-row gauntlet `qa/run1519_final.py`.

---

### Q2. Plateau Policy: "N Consecutive Identical-Red Canonical Traces" (§6 / §7.2)
* **Verdict:** **Adopt a Mandatory 3-Strike Plateau Circuit Breaker.** Eight to fourteen iterations on a single sub-revision (`15.1.3`) with an unchanging canonical failure trace violates the 1-to-2 hour micro-revision principle.
* **Concrete Rule Added to Ledger (Section 3 below):**
  1. **2-Run Identical-Trace Stop:** If two consecutive `-partK` checkpoints produce the same failing canonical test outcome (`A10 ok: false`), the agent is **prohibited** from shipping another speculative heuristic tweak. It must run a single deterministic state-dump script to prove *why* the previous lever either did not fire or did not move the metric.
  2. **Hard Cap of 3 `-partK` Sub-Commits per Micro-Revision:** No micro-revision (`15.X.Y`) may exceed `part3`. If the target gate is still red after `part3`, the feature switch (`T22.MULTI_VEHICLE_CONVOY`) stays `false`, the remaining blocker is logged in `DEFERRED_TO_V15_8_LEDGER.json`, the current revision closes as `15.X.Y-DEFERRED-LOCK`, and execution advances immediately to the next minor series (`15.2.1`).

---

### Q3. `cvHaltLaneClear` Fixed ~136-px Lane Ring (§4 / §7.3)
* **Verdict:** **`cvHaltLaneClear` (`js/convoy.js:463`) contains a geometric dimension bug: it uses `Math.max(v.D, v.L) * 0.5` (`72 px`, half the car's LENGTH) instead of lateral width (`v.L * 0.5 = 32 px`) plus an excessive `64 px` padding (`136 px` total).**
* **Why This Matters (Proven from Code):**
  * At `js/convoy.js:529`, the primary shoulder offset is `off = v.L * 0.9 + 14` (`64 * 0.9 + 14 = 71.6 px` from the trail centerline), and the second offset (`extra = 64`) is `135.6 px`.
  * Because `cvHaltLaneClear` (`line 463`) requires `clearance = (Math.max(144, 64) * 0.5 + 40 * net.k + 24) / 32 = 136 px / 32`, **every `extra = 0` (`71.6 px`) and `extra = 64` (`135.6 px`) shoulder candidate on a mapped road fails `cvHaltLaneClear` automatically!** And `extra = 128` (`199.6 px`) lands inside roadside buildings (`cityCircleBlocked`).
* **Minimal Concrete Change (`Omni-Shift-Nexus-Survivors/js/convoy.js`, function `cvHaltLaneClear`, line 463):**
  * Replace the isotropic length-based radius `(Math.max(v.D, v.L) * .5 + 40 * net.k + 24)` with the actual lateral projection of a shoulder-parked vehicle (`v.L * 0.5 + v.D * 0.15` for slight angle, plus `20 * net.k + 12` lane half-width margin = `~85 px` when `CONVOY.halted` has already stopped the leader in the lane, or keep `136 px` only for opposing/unblocked high-speed links):
    ```javascript
    const latHalf = v.L * 0.5 + v.D * 0.12;
    const clearance = (latHalf + 20 * net.k + 12) / 32;
    ```
* **Exact Observable / Test:** In `qa/run1513_planner_diag.py`, `cands` at `extra = 0` (`71.6 px`) or `extra = 64` (`135.6 px`) transitions from `lane: false` to `lane: true` while `qa/run1518_shoulder_lane.py` and `qa/run1515_parking_traffic.py` remain 100% green.
* **Risk to A09/A10/F04:** Low; check against `qa/run1518_shoulder_lane.py` and `qa/run1515_parking_traffic.py` to ensure live traffic in adjacent lanes still passes cleanly without contact.

---

### Q4. Fate of `part14`’s Non-Firing Peer-Yield Lever (§6 / §7.4)
* **Verdict:** **Revert the non-firing runtime block in `cvDriveNormal` (`js/convoy.js:643–663`) or gate it strictly behind an invariant test.**
* **Reasoning:** Shipping dead code that provably never fires in the target scenario ("doctrine insurance") adds state-machine branches that complicate future debugging. Since `qa/run1516_yield_safety.py` and `qa/run1517_crossing_safety.py` already cover peer yielding, remove lines `648–663` from `js/convoy.js` during `15.1.3-part15` so `part15` tests only the active `cvHaltLaneClear` + `keepAim` fix.

---

### Q5. Audit of `qa/ESTIMATE_TRAJECTORY` & The Estimation Ritual (§6 / §7.5)
* **Verdict:** **Replace subjective 3-line percentage ranges with a single Deterministic Gate-Count Ratio (`Locked Sub-Revisions / Total Planned Sub-Revisions`) and freeze `v15 overall` during `-partK` sub-steps.**
* **Why (Audit of `ESTIMATE_TRAJECTORY.csv`):**
  * Across 24 convoy sub-checkpoints (`15.1.2 p1` → `15.1.3 part14`), the Blue `v15 overall` line was incremented from `53–56%` to `66–70%` (`+14 points`) while the project was working on a single sub-system (`T22` Convoy, which is only 1 of 31 original items!).
  * Worse, at `part14`, when `15.1.3` and `15.1.x series` were rescored downward (`-15%` and `-13%`), `v15 overall` was simultaneously bumped **up** `+2%` (`64–67%` → `66–70%`).
  * **New Scoring Rule:**
    1. **`v15 overall` CANNOT increase on any `-partK` commit.** It may only increase when a numbered revision reaches `-LOCKED` (e.g., `15.1.3-LOCKED`, `15.2.1-LOCKED`).
    2. **Fixed Weights:** `15.0.99-OMEGA` (Locked Baseline) = `50%`. Each of the 7 post-Omega minor series (`15.1` through `15.7`) is worth a fixed **`7%`** of `v15 overall` (totaling `99%`, + `1%` for final packaging = `100%`). Therefore, all of `15.1.x` (`15.1.1`–`15.1.4`) can move `v15 overall` by at most `+7%` (`50%` → `57%`), completely eliminating grade inflation.

---

### Q6. Where §6 Self-Assessment Was Too Soft (§6 / §7.6)
1. **Ceremony Overhead (~14 full 78-file archives + cache bumps on failing `-partK` steps):** Archiving 78 files and bumping 72 cache tags in `index.html` on every intermediate `-partK` diagnostic step wasted massive turn time. **Fix:** Run `git commit` + `git bundle` on every `-partK` (takes <2 seconds and guarantees rollback safety), but run the 78-file `qa/archive_part.py`, `index.html` cache bump, and `CHANGELOG_v15.md` write **ONLY** when locking a revision (`-LOCKED`).
2. **Batching 3 Untested Levers in `part14`:** Shipping three changes at once in `part14` before running `run1513_planner_diag.py` hid the fact that `chrono1513HaltReady` selected the exact same corridor and `cvHaltLaneClear` still blocked all 12 candidates. Enforce **1 hypothesis = 1 test run**.
3. **Widening `run1519_replan.py` from 240 to 420 frames:** Because `planRetryAt = runTime + 2` (120 frames) plus a 1.1s–2.0s reverse cycle (`~90 frames`) + 2.0s `terrainWait` (`120 frames`) mathematically requires `~330 frames` (`5.5 s`) to complete one back-out + re-plan cycle, widening `run1519_replan.py` from `240` (`4.0 s`) to `420` (`7.0 s`) was **mathematically necessary calibration**, not gate-weakening. That change is approved.

---

## 2. UPDATED RATCHET GOVERNANCE (`CHRONO-LATTICE RATCHET LEDGER` v2.0)

Effective immediately at commit `8fab687`, the following rules govern `15.1.3-part15` and all subsequent revisions:

1. **Hard 2-Part Cap to Close `15.1.3` (`part15` → `15.1.3-LOCKED`):**
   - **Step `15.1.3-part15`:** Apply the three targeted fixes from Q1 & Q3 (`cvHaltLaneClear` lateral width formula, `keepAim` lead cap `<= 48 px` + `cvDrive` lookahead cap `dSpot - 12`, and `chrono1513HaltReady` station range `[0.55, 0.70, 0.85]`) and remove the dead peer-yield block (`lines 648–663`). Run `qa/run1511_convoy_cases.py` (`A09` + `A10`) and `qa/run1519_final.py`.
   - **If `A09` + `A10` + Gauntlet are GREEN:** Immediately lock `15.1.3-LOCKED`, flip `T22.MULTI_VEHICLE_CONVOY: true` in `15.1.4-LOCKED`, verify the full suite, and advance to **`15.2.1`** (Persistent Work Vehicles & Full Courier/Detective Careers).
   - **If `A10` is STILL RED after `15.1.3-part16` (Max 2 attempts):** Trigger the **Plateau Circuit Breaker**. Leave `T22.MULTI_VEHICLE_CONVOY: false` (keeping working player-car squad boarding and overflow hold markers active), log `A10` in `DEFERRED_TO_V15_8_LEDGER.json`, tag `15.1.3-DEFERRED-LOCK`, and **immediately advance to `15.2.1`**. Do NOT spend a 17th part on `15.1.3`.
2. **Lightweight `-partK` vs. Full `-LOCKED` Ceremony:**
   - **On `-partK` commits:** Code edit + targeted test + `git commit` + refresh `qa/v15_recent_commits_recovery.bundle`. **Skip** `index.html` cache bumps, `CHANGELOG_v15.md` essays, and 78-file directory copies on `-partK`.
   - **On `-LOCKED` commits:** Bump `index.html` cache tag, update `CHANGELOG_v15.md` and `ESTIMATE_TRAJECTORY.csv`, refresh `qa/v15_recent_commits_recovery.bundle`, and run `qa/archive_part.py`.
3. **Locked Non-Inflating Progress Formula:**
   - Recalculate `v15 overall` in `ESTIMATE_TRAJECTORY.csv` using fixed milestone weights:
     - `15.0.99-OMEGA` = **50%** (complete)
     - `15.1.x` = **+7%** (`57%` when `15.1.4` locks)
     - `15.2.x` = **+7%** (`64%` when `15.2.3` locks)
     - `15.3.x` = **+7%** (`71%` when `15.3.3` locks)
     - `15.4.x` = **+7%** (`78%` when `15.4.5` locks)
     - `15.5.x` = **+7%** (`85%` when `15.5.6` locks)
     - `15.6.x` = **+7%** (`92%` when `15.6.x` locks)
     - `15.7.x` = **+8%** (`100%` when `15.7.x` locks)
   - Never increase `v15 overall` on a `-partK` checkpoint.
