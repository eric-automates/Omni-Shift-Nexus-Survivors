# OMNI-SHIFT: NEXUS SURVIVORS — v14.1 PATCH (2026-10-31)

Base: v14 (`74a5b73`, identical to GitHub `main` `abb43db`, verified file by file before starting).
21 files changed · 3,701 lines added · 105 changed · 4 new modules (3,148 lines). Existing code was touched surgically; most changes go through hooks and wrappers.

This patch fixes and finishes the v14 additions you listed: vehicles, doors, the HUD, fences, roofs, fuel and followers in cars. Each task went through the same process as v14: build it → optimise it → check it against what you meant. Then the whole patch was evaluated as one system, which found and fixed 6 more problems (§8).

---

## 0. Evaluation at the start
- GitHub `main` == v14 (44/44 files). The v14 suites passed before any work began.
- **HUD audit (7 screen sizes, scripted):** on desktop, the squad button, the music toast and the FPS pill sat on top of the minimap. On phones, the whole bottom-right cluster collided. *Your HUD picture never arrived*, so every overlap was measured programmatically instead (§7).
- **Vehicles in v14** were static props with a speed boost. They had no mass and no shape, so cars merged into each other and only slowed down.

## 1. Vehicle collision, crumple zones, detachable parts (`js/vehicles.js`)
- **Live rigid bodies.** A parked car, bus, truck or garage car becomes a physics body the moment you enter it, hit it, shoot it, blast it or the convoy picks it. It starts exactly where (and as) it was parked; its tile collision is cleared and its art re-bakes without a flash.
- **Real collisions:**
  - **Vehicle vs vehicle:** oriented-box separating-axis tests with impulses, where mass matters (a 14 t fire engine shoves a sedan; a parked car with locked wheels resists).
  - **Vehicle vs wall or prop:** samples along the *deformed* outline.
  - **Result:** no more merging (deepest overlap measured during a crash: 0.3 px).
- **Crumple zones.** Damage lands where the hit lands:
  - 24 perimeter cells dent inward (front and rear up to 22 % of the length, sides up to 18 %).
  - The sprite deforms and glass cracks, then breaks.
  - **Calibration:** a 50 km/h wall hit costs a sedan ~21 % structure and 19.6 px of crush, and tears off the bumper and a headlight. **Never dead on the first hit**, but three more 80 km/h hits end it.
- **Attachment points.** Each part has its own HP and **falls off and stays on the road** when it runs out. This applies to crashes *and* enemy fire, blades and blasts.
  - The parts: bumpers, hood, trunk / tailgate, 2–4 doors, mirrors, lights, windshield / side / rear glass, wheels (or hover pods), sunroof, light bar, canvas cover, forks, wings, tracks, horses.
- **Damage from everything:**
  - **Bumping a person:** a little (−3 hp).
  - **Bullets:** −0.4 to −6 hp each, plus holes, part hits and glass. Rounds through broken glass or a missing door hit the occupants, and enemies do shoot the driver.
  - **Melee bashing:** −1.5 hp.
  - **Saber cuts:** glowing slashes, about −7.5 hp.
  - **Blasts:** push and damage.
  - **The Force:** push (128 px).
  - **Scraping:** sparks and paint loss.
- **Past the point of no return:**
  - Engine smoke below 35 %, black smoke below 15 %, disabled at 0.
  - A disabled vehicle may catch fire (fuel tankers always do). After ~7 s it **explodes**: 20 pieces of debris, a scorch mark, a blast, and chain reactions with the car next to it.
  - You bail out automatically when it burns, and your riders get out with you.
- **Sound:** engines, horns, crashes and explosions feed v14's hearing AI. A car is loud and draws attention.

## 2. Every vehicle drivable, fuel, gas stations (`js/vehicles.js`)
- **23 kinds, all drivable:**
  - Everyday: sedan, police cruiser, pickup, SUV, bus, semi.
  - **The army trucks of the evacuation roadblocks** (heavy trucks push the sandbags aside).
  - Inside buildings: tractor (barns), fire engine (fire stations), forklift (warehouses), and garage cars (**the garage door rolls up** so you can drive out).
  - Universe rides: landspeeder, spinner, hovercar, ornithopter, death glider, mule, Rhino, APC, wreck-runner, the flying Anglia.
  - Horse-drawn: wagon, stagecoach, cart.
- **Handling per kind:** mass, acceleration, top speed, brakes, grip, steering lock, armour. Hover kinds slide and cross water.
  - **Controls:** **point-to-steer** by default (push where you want to go, pull back = reverse) or classic W/S + A/D (Options).
  - Space / X = handbrake · H = horn · F = in / out.
  - On touch screens: HB and horn buttons. Speed shows in mph or km/h (Options).
- **Fuel gauge** in the vehicle HUD (speed · fuel · condition · seats). It shows each universe's fuel name: FUEL CELL, REPULSOR FUEL, NAQUADAH, PROMETHIUM, GUZZOLINE, and HORSES for stamina.
  - **Starting level:** parked vehicles hold 15–85 %.
  - **Use:** ∝ throttle, ~9 % per minute flat out.
  - **Refuel:** stop next to a pump to refill at 8 %/s (horses: water & hay). Convoy vehicles fill up at the same stop.
  - **Finding a station:** below half a tank the minimap marks stations; below 30 % an arrow points to the nearest one.
  - **Coverage check:** 45 sample points across all 8 land classes; the worst was a station 3.1 km away (~21 % of a tank). Station names are themed ("TIBANNA FUEL", "STABLES", "GAS & GO").

## 3. Followers ride along and form a real convoy (`js/convoy.js`)
- **Mount up.** When you get in (or press **H**), followers within ~44 m board through the nearest clear door.
  - **Seating:**
    - Gunners take window, bed and roof seats.
    - A hound rides with its head out of the window.
    - A bone golem goes in the bed.
    - Force-persuaded allies ride too.
  - **Shooting:** riders lean out and fire **only on their side** of the vehicle.
  - **Damage shows:** **a missing door shows the whole rider**.
  - **Sunroofs and hatches:** **a sunroof** (35 % of sedans, 50 % of SUVs) **or a hatch puts a gunner up top**.
- **Too many for one vehicle → convoy.** The overflow takes the nearest drivable vehicles (skipping boxed-in ones), with a driver and crew. They follow **your exact path** using pure pursuit on your trail.
- **Researched doctrine** (FM 55-65 ch. 5; US Army Transportation School *Tactical Convoy Handbook*; ANA / FM 4-01.45 TTP; UNITAF herringbone SOP), scaled to a ~40 m-wide screen:
  - **Close column in towns.** The interval follows the "2 × speedometer mph in metres" rule: max(8 m town / 14 m open, 0.6 m per mph), capped at 30 m and tightened 20 % under fire. Plus a catch-up speed.
  - **Gun sectors:** lead 12 o'clock, then alternating 9 / 3, trail 6 o'clock.
  - **Ambush:** drive *through* the kill zone; don't stop in it.
  - **Herringbone at halts:** alternate ~45° pull-offs, road kept clear.
  - **Disabled vehicles:** crews **cross-load** into free seats. If there are none, they **hold the spot with a map marker** until picked up.
- **Robustness:**
  - Three look-ahead feelers see parked cars.
  - An unpark manoeuvre and stuck recovery (reverse away from the blocked side).
  - An off-screen catch-up snap for stragglers.

## 4. Doors you can see (`js/cityaccess.js`, `js/cityrender.js`)
- Every exterior entrance gets a step, a framed door, a porch light and an arrow. Garages and loading bays are drawn as such, and EXIT markers appear inside.
- **Verified:** 80 sampled buildings all have a drawn entrance, none faces a wall, and 27 have garages.

## 5. Roofs (`js/cityaccess.js`)
- **Climbing:** every building has a **ladder** (a grav-lift in sci-fi looks): **F** to climb.
- **On the roof:**
  - You see 25 % further and over everything.
  - The street can see you; the room below can't.
  - Melee hunters climb after you and come down when you do.
- **Gestures** (real taps tested):
  - Teleporters: **double-tap a building = inside, triple-tap = roof**.
  - Leapers and jetpacks: double-tap = dive through a window, triple-tap = land on the roof.
  - Tapping the street from a roof drops you there.
  - Everyone else keeps the normal double-tap dash.
- **Mobility class per hero** (tele / jet / leap / climb / giant / smash / none): climbers pull themselves up without a ladder.

## 6. Fences
- **They look like fences now, in every universe look.** Faces are drawn tall and at an angle, with posts, cast shadows, broken sections and gates.
  - **Kinds:** wood / durasteel privacy panels, **chain-link with a crisp diamond mesh** (barbed wire in industrial blocks), pickets, stone garden walls, hedges.
  - **North–south runs:** these now have a leaning face and a stepped shadow, so none of them read as a kerb or guardrail.
- **Crossing by hero:**
  - Teleporters phase through.
  - Leapers vault.
  - Jetpacks fly over.
  - Climbers scale.
  - Hagrid steps over.
  - **The T-800 and Vader smash through** (the section stays open).
  - Heroes without mobility use gates.
  - Vehicles break wooden, chain-link and picket fences.
- **The grey beyond a fence now matches the fence:**
  - Privacy fences, hedges and stone walls block sight.
  - Chain-link and pickets never do.
- **Eye height** (new): from a tall cab, on a jetpack, as the half-giant, or at the top of a leap, your eyes are above ~2 m obstacles. You see over them, and you can be seen (symmetric line of sight).
  - Tall cabs: bus, army truck, fire engine, semi, tractor, APC / Rhino hatch, stagecoach box.
  - On foot or in a sedan, the fence still blocks.

## 7. HUD that never overlaps (`js/hudlayout.js`)
- **Layout solver:** it places the 12 HUD elements by priority in zones (top bar, corners, a bottom-centre column).
  - **Fallback order:** lower-priority items shrink first (each to its own minimum); then hide-able items step aside.
  - **Phones:** auto-compact.
  - **Result:** **0 overlaps at 390×844, 360×740, 844×390, 1024×768, 1280×800, 1366×768 and 1920×1080**, while driving with a tip, EXECUTE and the music toast all up.
- **Options → HUD LAYOUT:**
  - priority order (▲▼);
  - **"Don't shrink"** per item;
  - Hide per item;
  - overall HUD size;
  - live preview.
- **One prompt, not two:** the world shows only an **F** (or **TAP** on touch screens) keycap over the thing you can use; the full prompt is the HUD button.

## 8. Found & fixed in the whole-system pass
1. **Interiors could change when you came back** (a v14 bug).
   - **Cause:** the furniture placer shuffled with `sort(() => r() - 0.5)`. Chrome's sort isn't repeatable with an inconsistent comparator, so ~1 % of buildings re-furnished differently whenever the block cache evicted and regenerated them.
   - **Effect:** mismatched chunk seams, furniture you could collide with but not see, and garage-car keys pointing at the wrong item.
   - **Fix:** a seeded Fisher–Yates shuffle.
   - **Proof:** 576 blocks and 3,870 interiors regenerated three ways, 0 differences; the new test D04 fails on the old code.
2. **Ghost collision after promoting a vehicle that straddled a chunk seam.** Every overlapped chunk is now rebuilt, and an orphan stamp heals itself.
3. **Convoy drivers drove into parked cars** (the look-ahead ignored them). Fixed with feelers, unpark manoeuvres, scoring that skips boxed-in cars, and stuck recovery.
4. **The same interaction prompt was drawn twice** (HUD button + world text). The world now shows a keycap only.
5. **Debug-All Proving Ground had two coin-flip checks:** "squad did not regroup" (reproduced 1 in 6 on untouched v14) and "killed dummy did not come back". Both now poll instead of taking a single sample: 8/8 clean runs.
6. **Chain-link fences still read as railings** at game zoom, because hairline mesh strokes blur away. They now use a pixel-exact diamond pattern and 3 m post spans.

## 9. Changes to existing files
- `js/sim.js`:
  - driving and roof movement branches;
  - roof / street contact rules;
  - melee and bolts damage vehicles.
- `js/render.js`:
  - camera view while driving;
  - culling;
  - the interaction keycap.
- `js/fx.js`: driving camera zoom; banners sit below the HUD top bar.
- `js/state.js`: options `hud`, `vehSteer` and `vehUnits`; on-screen checks use the driving camera.
- `js/cityworld.js`:
  - broken fences;
  - open garages;
  - furniture vehicles taken out of the grid;
  - eye-height sight (`K_LOWSIGHT`).
- `js/cityrender.js`:
  - fence painter rewritten;
  - new vehicle art (police, pickup, SUV, semi) and garages;
  - stale-while-rebake tile refresh;
  - roof overlay hooks.
- `js/citygen.js`: `cShuffle`.
- `js/cityplay.js`: resets, "On the roof:" banner, tip.
- `js/minimap.js`:
  - HUD-manager placement;
  - vehicle, convoy, station and hold layers;
  - ROOF label.
- `js/stealth.js`: the pill follows the HUD manager.
- `js/squad.js`: riders handled by the convoy; co-gunner off in the city.
- `js/proving.js`: the two polling fixes.
- `js/ui.js`: options rows.
- `index.html`:
  - 4 new scripts;
  - NEW IN v14.1 help box;
  - cache tag `v14.1-2026-10-31`.
- `css/style.css`: vehicle HUD, HUD options panel.
- **Docs:**
  - `info.md`: §2.16–2.20, history, roadmap, technical notes.
  - `flowchart.md`: +5 diagrams (vehicle life, one hit, convoy, fences / roofs / eye height, HUD solver); 16/16 validated with Mermaid 10.9.1.

## 10. Tests
**New `verify_v141.py`: 20/20**

| Area | Tests |
|---|---|
| Vehicles | A01 promotion · A02 solid cars · A03 crumple zones · A04 damage from everything · A05 fire & explosion · A06 every vehicle drives (8/8 kinds) |
| Fuel & squad | A07 fuel & stations · A08 followers ride · A09 convoy (trail, herringbone, cross-load / hold) |
| Access & fences | B01 doors · B02 fences by hero · B03 roofs · B04 real-tap gestures · B05 eye height |
| HUD | C01 no overlaps at 7 sizes · C02 priority & Don't shrink |
| Whole game | D01 performance (51 fps with a 3-vehicle convoy, 11 riders, 24 live vehicles, 41 enemies) · D02 all 80 heroes drive / climb / cross, 0 errors · D03 classic arena untouched · D04 repeatable world |

**Old suites:**

| Suite | Result | Note |
|---|---|---|
| `verify_v14` | 18/18 | V13 updated to v14.1 semantics; V07's 70 % bullet-hole roll pinned so it can't flake |
| `verify_v13` | 13/13 | classic mode |
| `verify_v12` | 11/11 | classic mode |
| `verify_v11` | 10/10 | classic mode |
| `verify_v10` | 14/14 | V08 now asserts the intent, "nothing covers anything", instead of v9.01's fixed pixel offsets |
| `verify_fixes` | 20/20 | classic mode |
| City soak | 0 errors | 6 heroes |
| Real-time frames | 55 fps | baseline 57 |
| Music | PASS | 20 tracks served and decoded, genres, credits, queue; lite decode — fully decoding all 20 MP3s crashes headless Chrome in this 2 GB sandbox on untouched v14 too |
| Mermaid | 16/16 | diagrams validated |

## 11. Upload
- **Web UI:** unzip `omni-shift-v14.1.zip` and upload its contents with GitHub → *Add file → Upload files*. It holds the full repo layout; the MP3s are unchanged and not included.
- **Git:** run `git apply v14.1.patch` on `main`.
- **Switch back to the arena:** main menu → WORLD → Classic Arena, or `?world=classic`.
