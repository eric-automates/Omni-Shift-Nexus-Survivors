# Omni-Shift Nexus Survivors — v13 "Threat Sense, the Light Side, Yoda & Creator v2"

- **Base:** the live repo (v12, latest GitHub commit `9ccf8e0`).
- **Branch:** `v13`.
- **Deliverables:**
  - `omni-shift-v13.zip`: code, `info.md`, `flowchart.md`, `CREDITS.md` and `music/MUSIC_CREDITS.md`, laid out like the repo.
  - `v13.patch`: the same changes, for `git apply` on the live repo.
  - `CHANGELOG_v13.md` (this file) and `V13_SUMMARY.md`.

---

## 0. GitHub evaluation (done before any changes)

| Check | Result |
|---|---|
| Your v12 upload (commits `1bfed0e`, `b7a95ac`, `9ccf8e0`) | ✅ All 25 code / doc files are byte-identical to my v12 build (compared blob hashes through the GitHub API). |
| GitHub Pages | ✅ The latest build succeeded and the live site serves v12 (every script carries the `v12-2026-10-27` tag). |
| Live smoke test | ✅ 21 scripts load, the creator / showdown / EXECUTE are present, 20 music tracks are discovered, the creator opens, 0 page errors. |
| `music/MUSIC_CREDITS.md` | ⚠️ **Still missing (404).** Three tracks are CC-BY and need their credit line. It's in the zip again, and there is now also a root-level **`CREDITS.md`** with the same credits, so it travels with the root files. |
| Nothing new since v12 | The repo is exactly as you left it, so v13 builds on it directly. |

---

## 1. Threat Sense meter (new `js/sense.js`)

You asked for an indicator of when the next elite / boss is coming, tied to the character, 0-100 %, depending on distance from the centre.

- **What it shows.** A slim meter under the XP bar fills **0 → 100 %** toward the next **rival** or the **Sector Titan**, whichever comes first. At 100 % it arrives and the meter switches to "RIVAL ENGAGED" / "THE TITAN IS HERE".
- **Distance from the centre matters.** Both clocks now tick at `threatMult()`:
  - ×1.0 within 300 px of the centre (the Outpost), rising smoothly to **×2.1 at 1800 px+** (the Abyssal Core).
  - So the Titan comes at ~2:00 near the centre, but in under a minute if you camp the outer rim, and rivals come up to twice as often.
  - The ring name and the current multiplier are shown on the meter ("A DARK PRESENCE · Shattered Ruins ×1.7").
  - Both clocks pause during a Rival Showdown.
- **The Titan now has its own clock** (`player.titanClock`) instead of `runTime > 120`. It is rewound with the player.
- **Styled per hero — 47 different readings across the 80 heroes:**
  - Luke / Mace: **DISTURBANCE IN THE FORCE** (blue Force ripples, a soft choir chord).
  - Yoda: **THE FORCE IS TROUBLED** ("Clouded, the future is…", "Coming, it is. Ready, you must be.").
  - Sidious / Vader / Maul: **THE DARK SIDE STIRS** (red, low growl).
  - Marines and tech: **MOTION TRACKER**, with beeps that speed up as it closes in. Variants: IMPERIAL SCANNER, RED ALERT (Kirk), DRADIS CONTACT (Starbuck), BUG RADAR, AUSPEX SCAN, PIP-BOY RADAR, HEV SUIT SENSORS.
  - Droids and cyborgs: SENSOR SWEEP (R2, with "*bweep*" lines), THREAT ASSESSMENT (T-800), SCAN VISOR (Samus), COLLECTIVE ALERT (Borg), CYLON SENSORS.
  - Psychics: PSYCHIC STATIC (River: "Two by two, hands of blue."), PRESCIENCE (Paul), DÉJÀ VU (Neo), FUTURES SEEN (Strange), TIMEY-WIMEY (the Doctor), WARP SIGHT, HIVE TELEPATHY.
  - Wizards: DARK OMEN, **SCAR BURNING** (Harry), THE EYE IS UPON YOU (Gandalf), THE PALANTÍR SEES (Saruman).
  - Hunters: BOUNTY HEAT, **MEDALLION HUMMING** (Geralt), HUNT INSTINCT (Predator), TROPHY HUNT (Grievous), BLOOD HUNT.
  - Demons / beasts: DEMONIC PRESENCE (Doom), WAAAGH-O-METER (Ork), HIVE SENSE (Xeno queen), BATTLE LUST (Klingon), PRIMAL INSTINCT.
  - Your custom hero: chosen from its build (Force + Light → Jedi, Force + Dark → Sith, magic → omen, beskar / bounty → bounty heat, tactical / cyborg → tracker).
- **Feedback:** a flavour line at 50 / 75 / 90 % with a sound cue, quickening pings around the hero, and **at 90 %+ an arrow on the screen edge** pointing where it will come from, plus a soft coloured vignette. The spawn angle is pre-rolled, so the arrow never lies; the arrow stays below the HUD. At 100 % the style's line ("IT IS HERE.", "CONTACT!", "AS FORESEEN.", "RIP AND TEAR.") sweeps the screen.
- Hidden in the Proving Ground (nothing spawns there).

## 2. Force Persuasion — light-side Force users turn enemies (new `js/force.js`)

"Any good-side Force user should be able to turn a few people to their side."

- **Who:** Luke, Mace, Yoda, and your custom hero if it is **Light + Strong in the Force** (automatic). A Force-Touched or Strong Light hero can also take the **Mind Trick** skill to do it on a button.
- **When:** at least 4 enemies within ~170 px. Cooldown 22 s (Yoda 14 s).
- **What happens:**
  - The hero raises a hand toward the crowd and dotted beams of light reach the targets.
  - **2 enemies turn (3 from saber Lv.5)** for 15 s. Yoda turns 4 (6 from Lv.5) for 20 s.
  - Each one floats up for a moment, then gets a halo, a glowing ground ring, a light "redeemed" body colour, a green health bar plus a time-left bar, and is healed to **double health**.
  - Per-hero lines: Luke "There is still good in you.", Mace "This party's over. Pick a side.", Yoda "Join me, you will.", custom "These aren't the droids you're looking for."
- **Allies fight for you.** They hunt the nearest hostile, favouring the ones closest to you. Ranged allies shoot friendly bolts. Their kills count as yours. Hostiles brawl back with any ally in their way, so allies also act as a shield.
- **Nothing of yours hurts them.** Shots, saber blades, rockets / explosions, Force pushes, barriers, flamers, spells, squads and forts all pass through allies (every damage and targeting loop was audited).
- **How it ends:**
  - When the effect wears off, an ally **lays down its arms** and walks out of the war ("I'm going home.") — half an XP orb, no kill.
  - An ally killed by hostiles pays nothing.
- **Never converted:** rivals, Sector Titans, staggered elites waiting for EXECUTE, and Showdown spectators. During a showdown your allies stand with you and stay out of the duel.

## 3. Yoda — from small cuts to Grand Master (js/force.js, js/saberforms.js, js/combat.js)

"As his form levels up he goes from small hits to full jumping attacks and very strong abilities… he pulls his lightsaber in, puts his hand out, everyone levitates and is obliterated or turned good."

| Saber level | What Yoda does |
|---|---|
| Lv.1–3 | Soresu: small, economical shoto cuts (unchanged) |
| Lv.4 | Ataru: the leaps and flips of the Geonosis duel |
| **Lv.5+** | **FORCE LIFT & HURL** (automatic, ~10 s): with 5+ foes nearby he lifts up to 8 into the air, then hurls them outward for heavy damage (most grunts die, survivors are stunned) |
| **Lv.7** | **Ataru Grand Master** (new Form variant `ataruGrand`): full jumping attacks — his leaps really carry him from foe to foe (up to ~118 px, about every 0.5 s, never against the way you're steering) |
| **Lv.7** | **WILL OF THE FORCE** — see below |
| Any | Force Persuasion every 14 s (4–6 allies), and a real **Tutaminis** ward |

- **WILL OF THE FORCE** (Yoda only; automatic, ~45 s cooldown, needs 8+ enemies on screen):
  1. He **switches his lightsaber off** (the Form Engine retracts and holds it) and **raises his hand**. Slow-motion, a gathering light at his palm, the banner "WILL OF THE FORCE", "Size matters not."
  2. A wave of the Force rolls out across **the whole screen** in under a second.
  3. **Every enemy it touches levitates.** Those already badly hurt (< 30 % HP) are **obliterated**; everyone else **turns to the light and fights for Yoda for 25 s**.
  4. Rivals and Titans **resist** (stunned). Anything that spawns afterwards is **still hostile**, just as you described.
  5. A banner counts the result: "18 TURNED TO THE LIGHT".
- **Tutaminis fix:** Yoda's barrier used to shout "PROTEGO TOTALUM!". It now says "TUTAMINIS! 'Pass, you will not.'", glows green, is 25 % bigger (45 % at Lv.7) and lasts 40 % longer (70 % at Lv.7). The custom "Tutaminis Barrier" skill uses the Jedi line too; wizards keep Protego.

## 4. Hero Creator v2 — any character (js/creator.js rewritten)

"Create any type of character, limited by skills / utilities / guns… a wizard with a little Force, the Man with No Name with two six-shooters, six-shooter + lightsaber + a little Force, six-shooter + lightsaber with no Force and thermal detonators, Mandalorian armor with a jetpack that clearly flies."

- **Presets (one tap, then tweak anything):** Jedi Knight · Sith Lord · **Twin-Gun Drifter** (two six-shooters, duster, cowboy hat, no Force) · **Force-Touched Wizard** (wand + staff, a little Force) · **Space Cowboy** (six-shooter + lightsaber + a little Force) · **Smuggler** (six-shooter + lightsaber, no Force, thermal detonators) · **Mandalorian** (beskar, jetpack flight, Whistling Birds) · Jar'Kai Duelist (the v12 default).
- **Identity:** allegiance **Light / Dark / Grey / Bounty Hunter**; **the Force: None / Force-Touched / Strong** (vacuum 0 / 35 / 100 %, visor, skill access; Strong + Light = automatic Force Persuasion; Strong + Dark = heal on every kill); talent Speed / Endurance / Fury / **Deadeye**.
- **The budget** (a capacity bar shows it): **1–3 weapons · exactly 2 skills · 1 signature gear · 1 mobility · 1 armor.**
- **26 weapons in 7 categories**, each keeping its real behaviour: Lightsaber, Saberstaff · Silver Longsword, Nodachi Katana, Bat'leth · **Six-Shooter**, DL-44, IB-94, Kimber .45, Phaser · E-11, P90, EE-3, Bowcaster, M-25 Plasma · Super Shotgun, M56 Smartgun, M60 · Wand, Elder Wand, Wizard Staff, Eldritch Tome, Hex-Orbs · Smart-Discs, Gravity Gun, Arm Cannon.
  - Each slot picks a category, then cycles models. "＋ ADD WEAPON", "✕" to remove, "⇆ MAKE #2 A TWIN OF #1".
  - Lightsabers keep the v12 hilt selector (10) and colours (10, Darksaber) and get a Form path; the quick saber setup (single / dual / staff) is still one tap.
- **Twins are real.** Two of the same weapon are named "#1 of 2" / "#2 of 2", level separately, and for guns **each takes its own target** (the second gun shoots the second-nearest enemy).
  - The six-shooter's shared cylinder was refactored into a **per-gun cylinder** (`w.six`): each revolver fires 6, runs dry and reloads on its own, half a beat behind the other — a real bang-bang rhythm.
- **20 skills with honest requirements** (locked chips show 🔒 and explain why):
  - **Force:** Force Push (Force) · **Mind Trick** (Force + Light) · Tutaminis Barrier (Strong) · **Force Choke** (Strong + Dark — new: lifts the strongest nearby foe by the throat and crushes it) · Force Lightning (Strong + Dark).
  - **Blades and guns:** Saber Throw (blade) · Fan the Hammer (pistol).
  - **Gear:** **Thermal Detonator** (new: lobbed in an arc into the thickest crowd, red light beeping, then a 95 px blast) · Whistling Birds (beskar) · Wrist Flamethrower · Grapple Line · Explosive Arrows · Deploy Cover · Overclock Stim · Execution Strike.
  - **Magic** (needs a magic weapon): Leviosa · Patronus · Protego · Summon Familiar · Sectumsempra.
- **Signature gear (automatic):** Force Push, Force Lightning, Wrist Rocket, Shoulder Missile Pod (beskar), Deadeye Shot (gun), Arcane Bolt (magic).
- **Mobility:** Force Dash, Acrobatic Force Flip, **Jetpack Rocket-Jump** (beskar), Gunslinger Dive-Roll, Apparition Blink (magic), Tactical Thrusters.
- **Armor, each with its own look and bonus:** Jedi / Sith Robes (tabard + skirt) · **Mandalorian Beskar + Jetpack** (plates, pauldrons) · Gunslinger Duster (long coat, gun belt) · Tactical Armor (vest, pouches) · Wizard Robes (star-flecked gown) · Cyborg Plating · Bounty Hunter Rig (bandolier).
- **Jetpack flight is real and obvious:**
  - The hero hovers ~7 px above a ground shadow, gently bobbing, with **twin thruster jets burning** under the boots (bigger while moving).
  - You **fly straight over rocks, walls and water**; ground hazards can't touch you; the jetpack dash rocket-jumps over anything.
  - "JETPACK ONLINE — YOU'RE FLYING!" at the start of a run, and the creator labels it "✈ JETPACK FLIGHT".
- **Look:** species, body, 9 skins, 7 hair styles (new long hair), **headgear** (Jedi hood, Sith hood, **Mandalorian T-visor helmet** with rangefinder, **cowboy hat**, **wizard hat**, tactical helmet, pilot goggles), 12 outfit colours, legs, cloak.
- **The run follows the build:**
  - Hand pose: saber guard / gunslinger hip-fire / braced rifle / jetpack hover / floating wizard weapons.
  - Finisher style: saber / gun / arcane.
  - Threat Sense style, visor (Mando HUD, tactical, Force sight).
  - Spellbook (magic weapon), stance read-out, rival dialogue (Dark = villain, Bounty = bounty hunter).
- **Compatibility:** v12 designs migrate automatically (Jedi → Light, Sith → Dark, hoods → headgear, sabers → weapons). The v12 creator controls (hilt / colour / setup / Match) still work. An unsaved creator draft can never leak into a run.

## 5. Other changes
- `index.html`: "NEW IN v13" help box. Cache tag → `v13-2026-10-28`. New scripts `js/sense.js` and `js/force.js`. Creator subtitle updated.
- `css/style.css`: Threat Sense meter styles (per-style animated icons: Force ripples, radar sweep, rune ring, reticle, heartbeat). Creator v2 styles (locked chips, capacity bar, flight row, messages).
- `js/state.js`: ally pools (`allyUid`, `allyT`, `allyLift`, `allyDur`, `allyAtkCD`, `allyIs()`) and `eFLiftZ` (render height of lifted foes); cleared on every run.
- `js/showdown.js`: `sdIgnore()` also covers allies; new `targetFilterOn()`; allies are never spectators.
- `js/combat.js`: `getDefaultSpellLadder` for custom magic builds; new utility types (`mindTrick`, `thermalDetonator`, `forceChoke`); twin split targeting; Tutaminis by skill name; dashes fly over obstacles when flying; Titan / rival spawn at the pre-rolled angle.
- `js/sim.js`: Titan clock + distance-scaled clocks; per-weapon six-shooter cylinders; flight movement; ally hooks in the enemy loop; custom Dark Side kill-heal; allies skipped by projectiles, blasts and barriers.
- `js/render.js`: custom armour / headgear / helmet / jetpack flight drawing; ally aura, halo and bars; lifted foes.
- `js/glory.js`, `js/data-heroes.js`: custom finisher style and mobility.
- `CREDITS.md` (repo root): the music credits again, so the CC-BY lines can't go missing.
- `info.md` and `flowchart.md` updated for v13 (3 new Mermaid diagrams: Threat Sense, the ally lifecycle, Yoda's powers; all 7 diagrams validated with mermaid 10.9.1).

---

## 6. Testing

| Suite | Result |
|---|---|
| **New `verify_v13.py`** — Threat Sense styles / 0-100 % / Proving Ground hide · distance ×2.1, Titan clock, showdown freeze, truthful arrow · Luke's persuasion + friendly-fire immunity + allies hunting · brawls, lay-down, no payout, immunities · Yoda Lift & Hurl · Will of the Force · Ataru bounding + Tutaminis · creator UI · twin six-shooters · Mandalorian flight through a wall a Jedi can't pass · thermal detonator / Force Choke / Mind Trick · v12 migration + every preset + 40 random builds legal · Proving Ground 14/14 with the Drifter and the Mandalorian | **13 / 13** |
| `verify_v12.py` (EXECUTE, Showdown, Creator v1 controls) | **11 / 11** (two creator assertions moved to the v13 vocabulary; biome hazard pools muted in S02, which only measures weapons / AI) |
| `verify_v11.py` (Form Engine, music) | **10 / 10** (Yoda's Lv.7 Form is now `ataruGrand`) |
| `verify_v10.py` (v10 systems) | **14 / 14** |
| `verify_fixes.py` (bug-fix pass) | **20 / 20** (T08 now counts only rival trophy corpses, not the showdown challenger's) |
| `music_check.py` | PASS |
| Sweep: heroes 0–80 + all 8 creator presets + Yoda at Lv.4 / 5 / 7 / 10 + Luke / Mace / Sidious / Vader / Maul / Grievous at Lv.7 (99 runs × 40 s, Titan, skills, dashes, rewind, glory) | **99 / 99 clean**, avg 0.23–0.42 ms per sim step |
| Soak: 3 min + full −5× rewind + 20 s for Luke, Yoda Lv.7, Mace, Mandalorian, Drifter, Wizard, Grievous | **clean**: no errors, no soft-locks, pools bounded, 0.15–0.22 ms per step, heap 38 MB. Yoda: 94 allies, 5 Wills, 8 Lifts in 3 min |

---

## 7. How to upload

1. **Option A — web upload:** GitHub → Add file → Upload files. Drag in `index.html`, `info.md`, `flowchart.md`, `CREDITS.md`, `css/` and `js/` from the zip, then `music/MUSIC_CREDITS.md` into the `music/` folder. Commit.
2. **Option B — patch:** `git apply v13.patch` at the repo root. It also creates `music/MUSIC_CREDITS.md` and `CREDITS.md`.
3. GitHub Pages redeploys in about a minute. The `v13-2026-10-28` tag forces fresh files.
