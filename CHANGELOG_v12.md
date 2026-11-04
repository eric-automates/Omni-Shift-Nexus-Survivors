# Omni-Shift Nexus Survivors — v12 "Your Own Hero, Rival Showdowns & EXECUTE"

- **Base:** the live repo (v11 code, commit `1f10686` on GitHub).
- **Branch:** `v12`.
- **Deliverables:**
  - `omni-shift-v12.zip`: code, `info.md`, `flowchart.md` and `music/MUSIC_CREDITS.md`, laid out like the repo.
  - `v12.patch`: the same changes, for `git apply`.
  - `CHANGELOG_v12.md` and `V12_SUMMARY.md`.

---

## 0. Repo status evaluation (done before any changes)

| Check | Result |
|---|---|
| Your uploads (7 "Add files via upload" commits, 2026-10-27 ~19:50 EDT) | ✅ `index.html` and all 19 JS files are byte-identical to my v11 build. All 17 new MP3s are byte-identical to the music zip. |
| GitHub Pages | ✅ Latest build `1f10686` deployed successfully. Earlier builds were cancelled because newer ones replaced them, which is normal. |
| Live site vs repo | ✅ 21 / 21 code files match. All 21 MP3s are served (HTTP 206). |
| Live smoke test | ✅ Boots in 0.8 s, all scripts carry the v11 tag, 20 tracks discovered (15 genres), sample tracks decode, a real deploy runs, the Form Engine drives Luke / Grievous / Maul / Yoda, 0 page errors. |
| `music/MUSIC_CREDITS.md` | ⚠️ **Missing from the repo.** Three tracks are CC-BY and need their credit. The file is included again in this zip, so please upload it to `music/`. |
| Two empty commits (`f4fd9e0`, `1f10686`) | Harmless: identical files were re-uploaded. |
| `info.md` / `flowchart.md` | ⚠️ Out of date. `info.md` was the v9.0 plan and `flowchart.md` showed v8.2. **Both are rewritten for v12** (see §4). |

---

## 1. EXECUTE: always on, highest rank first, chains (js/glory.js)

Your notes said the EXECUTE button felt stop-and-go: it showed up and went away. These changes address that.

- **It stays on.** After the first stagger of a run the button stays on the HUD until the run ends.
  - When nothing is executable it dims and shows "move closer" or "stagger an elite".
  - It no longer appears and disappears as targets come and go.
- **Each tap (or the E key) finishes the highest-ranked staggered elite in reach.**
  - Rank order: rival → heavy → shield-wall leader → shield trooper. Among equal ranks the nearest one goes first.
  - Reach went from 160 px to **230 px**; long lunges leave a Force-leap afterimage.
- **Execution chains.** Tapping during a finisher queues the next target. When the finisher ends you go straight into it: "CHAIN KILL · EXECUTION CHAIN ×N". Chained finishers use lighter slow-mo so the action keeps flowing.
- **Next-target reticle.** A pulsing red bracket with a ☠ marks the target. Other staggered elites in reach get faint brackets.
- **Labels.** The button shows the target type ("HEAVY · ×2") or "CHAIN QUEUED".
- **Staggered elites wait longer:** 4.5 s instead of 3.2 s.
- **Your own abilities no longer steal a waiting execution.** Signature gear and Avada-style auto-spells now skip staggered elites, as auto-aim already did.

## 2. Rival Showdown (new js/showdown.js)

This is your "rival shows up" idea, and it was also spec'd in the old v9.0 plan as "Get 'Em Space!".

1. **Arrive.**
   - A "⚔ RIVAL SHOWDOWN" banner names the rival and its universe, and the camera swings to it.
   - The rival strides into view and stops about 125 px from you.
   - **Every regular enemy slowly backs away into a big open ring** around you and the rival. Each one keeps its own side, crowded sides stack into rows, and the ring follows the fight.
2. **Challenge.** One reckless grunt breaks out of the crowd and charges the rival ("THIS BOUNTY IS MINE!"). The game picks one on your side of the screen so you see what happens.
3. **Finisher.**
   - **The rival destroys it instantly** with a finisher in its own style: saber bisect, point-blank shot, arcane disintegration, Yautja spine-rip, rip & tear, or limb tear.
   - Slow-mo, hit-stop, a strike flash, a line from the rival ("You are not worthy.") and a crowd gasp ("OOOOH!") follow.
   - It's the rival's kill, so you get no XP for it.
4. **Duel.**
   - "Now... YOU." It's you against the rival.
   - The crowd stands in the ring pumping fists and shouting ("FIGHT!", "FINISH HIM!") but **never attacks**.
   - Your auto-aim, saber blades, squad, signature gear and spells all ignore the crowd; stray bullets can still hit it.
   - New arrivals join the ring, and spawns slow to 35 %.
5. **Release.** When the rival falls, "RIVAL DEFEATED" appears, the crowd is SHAKEN (some freeze) and the brawl resumes.

**Rules and edge cases:**
- The Sector Titan and a second rival wait until the duel is over.
- If a Titan is already loose there is no ceremony.
- Rewinding to before the rival arrived ends the showdown cleanly.
- 90 s safety cap.

## 3. Create Your Own Hero (#80) with dual lightsabers (new js/creator.js)

- **Where:** main menu → **✨ CREATE YOUR OWN HERO**, or the top card of the roster. It's free and always unlocked.
- **Identity:**
  - Name.
  - Allegiance: Jedi (+regen), Sith (+crit damage, counts as a villain in rival dialogue) or Grey (+XP / Dark Matter).
  - Force talent: Speed, Endurance or Fury.
- **Look:**
  - Species: Human, Zabrak, Togruta, Twi'lek, Miraluka or Cyborg, each with its own head details.
  - Body: masculine or feminine.
  - 9 skin tones.
  - Hair, or a Jedi / Sith hood.
  - Robes, legs and cloak.
- **Sabers:**
  - **Single saber, saberstaff, or DUAL SABERS.**
  - **Dual sabers are two completely separate weapons.** Each one has:
    - its own **hilt** from the **hilt selector** (10 hilts: Graflex Classic, Jedi Knight, Ribbed Hermit, Dark Lord, Electrum, Curved Duelist with a bent grip, Shoto with a shorter blade and hitbox, Crossguard with quillons and an unstable crackling blade, Temple Guard, Scavenger);
    - its own **blade colour** (10, including the Darksaber: a black blade with a white corona);
    - its own name ("… #1 of 2" / "… #2 of 2"), **level, level-up cards, Lv.5 / Lv.10 evolutions and Form stage**;
    - its own targets. Both blades fight in relay and spread over different foes.
  - **⇆ Match Saber #1** copies saber 1 onto saber 2 when you want a matching pair.
- **Fighting Form paths:** Jar'Kai Duelist, Djem So Guardian, Ataru Acrobat, Juyo Berserker, Makashi Duelist, Soresu Defender and Saberstaff Dervish.
  - Every path starts at Shii-Cho and climbs to a prime Form at Lv.7.
  - New prime Forms were added for these paths: Jar'Kai Master, Makashi Master, Soresu Master, Saberstaff Shii-Cho and Saberstaff Niman.
- **Live preview.** You see the hero holding both sabers ignited, plus close-ups of each hilt.
- **Kit:** allegiance-based skills (Saber Throw plus Force Repulse, Force Lightning or Shatterpoint), Force Push or Force Lightning signature gear, Force Dash in your saber colour, and the Force-sense visor.
- **Saving.**
  - The hero is saved in your browser, survives reloads and is sanitised on load.
  - Rivals, weapon drops and new-weapon cards never pick #80.

## 4. Docs rewritten

- **`info.md`** is the master document. It covers:
  - the current game;
  - the full feature catalogue;
  - version history from v8 to v12;
  - the status of every v9.0 item (built / not built);
  - the **future roadmap**: twin guns as separate weapons, creator part 2 (gunslinger / wizard / cyborg builds and several hero slots), saber-vs-saber showdowns, Form-specific Force powers, the rest of the v9.0 roster, Predator cloak, DPS telemetry, the purge screen, a credits screen, Proving Ground batch mode, and Showdown / EXECUTE follow-ups;
  - **20 realism and cool-factor ideas**, all automatic and none tedious;
  - technical notes.
- **`flowchart.md`** has four Mermaid diagrams: whole-game flow (boot → menus → creator → run → loop → sim → kills → render → end), the Rival Showdown state machine, the EXECUTE button states, and the custom-hero data flow. All four render; I checked them with Mermaid 10.

## 5. Smaller changes

- **Film hilts** for the canon saber heroes: Luke Graflex, Vader Dark Lord, Windu / Sidious electrum, Yoda shoto, Maul's staff, and Grievous' trophy hilts.
- **Twin and Jar'Kai target claims now persist between frames**, so twin blades (and Grievous' arms) spread over different enemies instead of double-hitting one.
- **Proving Ground: 14 actions.** Execute Chain and Rival Showdown are new. The Driving test now drives toward open ground, because a random rock could make it fail.
- **Help screen:** new "NEW IN v12" box. The roster reads "80 + YOUR HERO".
- **Cache-busting tag:** `v12-2026-10-27`.

## 6. Files

| File | Change |
|---|---|
| `js/showdown.js` | **new**, Rival Showdown |
| `js/creator.js` | **new**, Hero Creator #80 |
| `js/glory.js` | always-on EXECUTE, rank targeting, chains, reticle, E key |
| `js/sim.js` | showdown hooks (crowd AI, spawn / Titan / rival holds, aim exclusion), no-pay kills, own-colour twin sabers |
| `js/combat.js` | rival → showdown, custom hero run start, canon-only random picks, auto-abilities skip staggered / crowd |
| `js/render.js` | 10 hilt designs, Darksaber, crossguard, curved / shoto hilts, species / hood / skin for #80, spectator fist-pump, rival facing |
| `js/saberforms.js` | crowd ignored, persistent claims, saberstaff for #80, shoto blade length |
| `js/data-heroes.js` | `CUSTOM_CID`, #80 arm cap / dash / outfits |
| `js/state.js` | register the custom hero on load |
| `js/ui.js` | roster card, menu button, level-up names (#1 / #2 of 2), own-colour saber icons, script checks |
| `js/squad.js`, `js/arsenal.js` | ignore the showdown crowd |
| `js/proving.js` | Execute Chain + Rival Showdown actions, sturdier Driving |
| `index.html` | creator screen, menu button, script tags, v12 help box |
| `css/style.css` | creator UI, EXECUTE button states |
| `info.md`, `flowchart.md` | rewritten |
| `music/MUSIC_CREDITS.md` | re-included (missing on GitHub) |

## 7. Tests (all on the final build)

- **`verify_v12.py` (new): 11/11.** It checks:
  - EXECUTE rank-first and the two-target chain.
  - The button never pops out and the E key works.
  - Showdown phase order: crowd ring ≥95 px, challenger executed with no payout, duel within 4.5 s.
  - During the duel: crowd never hurts you, aim on the rival 100 %, a blade parked next to a spectator does 0 damage.
  - Release + SHAKEN, with the Titan and second rival held during the duel.
  - Rewind safety.
  - Creator controls and preview.
  - Save / reload / roster / sanitising.
  - **Dual sabers:** two weapons, own hilts / colours / levels / Forms, distinct targets, separate level-up cards, "#2 of 2" kept after Lv.5.
  - Staff and single setups, #80 never a rival, all 100 hilt × colour combos and 48 species × hair combos render, Darksaber corona.
  - Proving Ground 14/14 with hero #80.
- **Regression suites:**
  - `verify_v11.py` 10/10.
  - `verify_v10.py` 14/14, including the Proving Ground 14/14 for a saber, a gunner and a wizard hero.
  - `verify_fixes.py` 20/20.
  - `music_check.py` PASS.
- **Hero sweep:** **81 / 81 heroes** (#00–#80) × 40 s with no errors.
- **Soak:** Luke, Grievous, Maul, Yoda and the custom hero, ~3 game-minutes each. No errors, nothing stuck, rewind OK, heap ~38 MB.
- **Natural runs:** showdowns fire at 75 s and 150 s with 28–37 spectators, a challenger finisher and a 5–12 s duel.

## 8. Uploading (GitHub web UI)

1. Unzip `omni-shift-v12.zip`.
2. In the repo, **Add file → Upload files** and drag in `index.html`, `info.md`, `flowchart.md` and the `css/`, `js/` and `music/` folders. The `music/` folder only contains `MUSIC_CREDITS.md`; your MP3s are untouched.
3. Commit. Pages redeploys in about a minute.

Alternatively, `git apply v12.patch` on `main`. It also restores `music/MUSIC_CREDITS.md`.
