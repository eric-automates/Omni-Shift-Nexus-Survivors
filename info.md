# FILE: info.md
# PART: 1 of 14
# DETAIL: Master design document, updated for v13 (2026-10-28). Covers what the game is now, everything built so far (v8.x → v13), how much of the Version 9.0 plan is done, and the roadmap for future iterations, including realism and cool-factor ideas. The architecture and execution diagrams are in flowchart.md.

---

## 1. What the game is (current state, v13)

**OMNI-SHIFT: NEXUS SURVIVORS** is a touch-first multiverse survival roguelike built on HTML5 Canvas. It runs in mobile WebViews and desktop browsers and is played live on GitHub Pages.

### Engine
- **Zero-garbage engine:**
  - Every high-frequency entity lives in pre-allocated Structure-of-Arrays typed-array pools: enemies, projectiles, orbs, particles, blood drips, severed limbs, corpses, bisected halves, squad and minion allies, Force-persuaded allies and rewind keyframes.
  - The sim runs at 60 FPS with sub-steps.
  - The HUD updates in place, so taps never drop.
- **Modular code:** 23 files.
  - **Core:** index.html, css/style.css.
  - **Data:** `chaos.js`, `data-factions.js`, `data-heroes.js`, `data-relics.js`.
  - **Engine:** `state.js`, `world.js`, `combat.js`, `sim.js`, `render.js`.
  - **v10 modules:** `fx.js`, `rewind.js`, `arsenal.js`, `squad.js`, `glory.js`, `biomes.js`, `campaign.js`, `proving.js`.
  - **v11 module:** `saberforms.js`.
  - **v12 modules:** `showdown.js`, `creator.js` (rewritten as Creator v2 in v13).
  - **v13 modules:** `sense.js` (Threat Sense), `force.js` (Force Persuasion + Yoda's powers).
  - **UI:** `ui.js`.
  - Feature modules plug in through the `V10` hook lists:
    - `onRunStart` / `onRunReset`
    - `onStep` / `onFrame`
    - `onKill`
    - `onRenderWorld` / `onRenderScreen`

### Content
- **81 heroes:** 80 canon heroes (#00–#79) in 11 universe genres, plus **your own hero (#80)** — any kind of character since v13.
- **The 11 genres:** Star-Sector, Chevron-Gate, Verse-Rim, Spice-Dune, Star-Citadel, Xeno-Hive, Grim-Imperium, Cyber-Noir, Anomaly-Lab, Eldritch-Ash and Arcane-Sanctum.
- **Sectors:** 50 procedural sectors, plus the **Galactic Expedition** branching campaign map.
- **Meta progression:**
  - Dark Matter shop with a 100 % respec.
  - Heroes unlock with Dark Matter.
  - One free starter hero per genre.
  - The custom hero is free.

### Core loop
Pick a hero → deploy into a sector → auto-fighting weapons, Forms and spells shred hordes. Then:
- Pick up XP orbs.
- Level up and choose 1 of 3 cards (weapons, signature gear, passives, visors, vacuum).
- Watch the **Threat Sense** meter: it fills toward the next rival or the **Sector Titan** (about 2:00 near the centre — sooner the further you roam).
- Kill the Titan to clear the sector and bank Dark Matter.
- **Rivals:** other heroes hunt you about every 75 s (sooner in the outer rings), and the duel is a **Rival Showdown**.

---

## 2. Feature catalogue (everything currently in the game)

### 2.1 Heroes & combat
- **Each hero has its own kit:**
  - Lv.1 weapon, Lv.5 primary evolution, Lv.10 supercharge.
  - Signature gear that auto-fires.
  - 2 utility skills and a signature double-tap dash.
  - Passive, tactical visor, stance progression and spellbook (wizards).
- **Health and armour:**
  - Limb integrity: HD / TR / LA / RA / LL / RL. Tap a limb to guard that zone.
  - Armour, dodge, regeneration and revives.
- **Hand slots:** heroes hold 2–4 weapons at once (`armCap`). Grievous holds 4, the saber masters 3. Extra weapons are holstered and swapped automatically.
- **Weapon drops:** rivals and Titans drop their signature weapon. Each weapon keeps its own blade colour.

### 2.2 Lightsaber Form Engine (v11, extended in v12 and v13)
- **Real strikes, no blind spinning:**
  - Every blade goes guard → wind-up aimed at a real enemy → committed cut → follow-through.
  - Cuts chain from foe to foe and alternate forehand / backhand.
  - Collision is swept along the drawn arc.
- **The seven canon Forms:**
  - I Shii-Cho, II Makashi, III Soresu, IV Ataru.
  - V Shien / Djem So, VI Niman (plus Jar'Kai), VII Juyo / Vaapad.
  - Each Form has its own guard, combos and signature techniques: Sarlacc Sweep, Makashi lunge & riposte, Circle of Shelter, Hawk-Bat Swoop & Saber Swarm, Falling Avalanche, Shien redirect, Pushing Slash / Draw Closer, Juyo staccato.
- **Film-accurate progression as the saber levels:**
  - Luke: A New Hope Shii-Cho → Dagobah Ataru → Cloud City Djem So → Return of the Jedi Djem So.
  - Vader, Maul, Mace, Yoda, Sidious and Grievous each have their own path.
  - Other sword heroes map onto the same Forms.
- **Hit types:**
  - Graze, cut (sever / bisect), heavy (ignores shields, fatal), thrust (intact corpse), flurry.
- **Defence:**
  - Parry pose on every blocked bolt.
  - Shien, Djem So and Vaapad send bolts back at the shooter, then riposte.
- **Ignition:** snap-hiss ignition; after 3 s idle the hilt clips back to the belt.
- **Feel:** motion trails, swing / sizzle / clash / hum audio, and "FORM IV · ATARU" banners. A fail-safe falls back to the legacy flourish.
- **New in v12:**
  - Film hilts for the canon saber heroes: Luke's Graflex, Vader's Dark Lord hilt, Windu / Palpatine electrum, Yoda's shoto, Grievous' trophies.
  - The Darksaber renders as a black blade with a white corona.
  - Twin / Jar'Kai blades keep persistent target claims, so they spread across different foes.
  - The Crossguard hilt has quillons and an unstable, crackling blade.
- **New in v13:** Yoda's prime (Lv.7) is a new Form variant, **Ataru Grand Master** (`ataruGrand`): his leaps really carry his body from foe to foe (up to ~118 px, about every 0.5 s, never against the direction you are steering). Lv.4 Ataru still leaps in place. During the Will of the Force he puts his blade away.

### 2.3 Your Own Hero — Hero Creator v2 (#80; v12, rebuilt in v13)
- **Access:** free and always unlocked, from the main menu or the top card of the roster. 8 one-tap **presets** load a full build that you can then change: Jedi Knight, Sith Lord, Twin-Gun Drifter (the Man with No Name), Force-Touched Wizard, Space Cowboy (six-shooter + saber + a little Force), Smuggler (six-shooter + saber, no Force, thermal detonators), Mandalorian (beskar + jetpack) and Jar'Kai Duelist.
- **Identity:**
  - Name.
  - Allegiance: **Light Side** (+0.6 HP/s), **Dark Side** (+25 % crit damage), **Grey** (+15 % XP & Dark Matter) or **Bounty Hunter** (+8 % crit, +20 % Dark Matter).
  - **The Force:** **None** (+10 % max HP) · **Force-Touched** (35 % orb pull, +5 % dodge, basic Force skills) · **Strong in the Force** (full orb vacuum, Force-sight visor, every Force skill; Light → automatic Force Persuasion, Dark → heal on every kill).
  - Talent: Speed, Endurance, Fury or Deadeye.
- **The loadout budget** (shown as a capacity bar): **1–3 weapons · exactly 2 skills · 1 signature gear · 1 mobility move · 1 armor.** Every choice has honest requirements; a locked chip shows 🔒 and tells you what's missing.
- **Weapons (26, each keeps its real firing behaviour):**

  | Category | Weapons |
  |---|---|
  | Lightsaber | Lightsaber, Saberstaff (hilt selector + 10 colours + Form path) |
  | Blade | Silver Longsword, Nodachi Katana, Bat'leth |
  | Pistol | **Six-Shooter Revolver**, DL-44 Heavy Blaster, IB-94 Beskar Pistol, Kimber .45, Phaser |
  | Rifle | E-11, P90, EE-3 Carbine, Bowcaster, M-25 Plasma Rifle |
  | Heavy | Super Shotgun, M56 Smartgun, M60 |
  | Magic | Phoenix-Feather Wand, Elder Wand, Obsidian Wizard Staff, Eldritch Tome, Chaos Hex-Orbs (any magic weapon adds the wizard spellbook) |
  | Tech | Smart-Discs, Gravity Gun, Arm Cannon |

  - **Twins:** two of the same weapon are two separate weapons ("#1 of 2" / "#2 of 2"): own level, own level-up cards, and for guns their own target (the second gun takes the second-nearest enemy). **Six-shooters have their own cylinders**: each fires 6, runs dry and reloads on its own, half a beat apart.
  - A saberstaff can't share the loadout with other lightsabers. The quick saber setup (single / staff / dual) and "make #2 a twin of #1" are one tap.
- **Skills (pick exactly 2):** Force Push (Force) · Saber Throw (blade) · **Mind Trick** (Force + Light: turns 2–3 nearby enemies into allies for 12 s) · Tutaminis Barrier (Strong) · **Force Choke** (Strong + Dark: lifts and crushes the strongest nearby enemy) · Force Lightning (Strong + Dark) · **Thermal Detonator** (lob, beep-beep, boom) · Fan the Hammer (pistol) · Whistling Birds (beskar) · Wrist Flamethrower · Grapple Line · Explosive Arrows · Deploy Cover · Overclock Stim · Execution Strike · Leviosa / Patronus / Protego / Summon Familiar / Sectumsempra (magic weapon).
- **Signature gear (automatic, 1):** Force Push (Force), Force Lightning (Strong + Dark), Wrist Rocket, Shoulder Missile Pod (beskar), Deadeye Shot (gun), Arcane Bolt (magic).
- **Mobility (dash button, 1):** Force Dash (Force), Acrobatic Force Flip (Force), Jetpack Rocket-Jump (beskar), Gunslinger Dive-Roll, Apparition Blink (magic), Tactical Thrusters.
- **Armor (1):** Jedi / Sith Robes · **Mandalorian Beskar + Jetpack** · Gunslinger Duster · Tactical Armor · Wizard Robes · Cyborg Plating · Bounty Hunter Rig — each with its own look and bonus.
  - **Jetpack flight is real:** you hover above a ground shadow with thrusters burning, fly straight over rocks, walls and water, ignore ground hazards, and the jetpack dash rocket-jumps over anything. A "JETPACK ONLINE — YOU'RE FLYING!" call-out confirms it at the start of a run.
- **Look:** species (Human, Zabrak, Togruta, Twi'lek, Miraluka, Cyborg), body, 9 skins, 7 hair styles, **headgear** (Jedi / Sith hood, Mandalorian T-visor helmet, cowboy hat, wizard hat, tactical helmet, pilot goggles), 12 outfit colours, legs and cloak.
- **The run follows the build:** weapon-hand pose (saber guard, gunslinger hip-fire, braced rifle, jetpack hover, floating wizard weapons), finisher style (saber / gun / arcane), Threat Sense style, visor, rival dialogue (Dark = villain, Bounty = bounty hunter).
- **Fighting Form paths** (lightsaber builds; all start at Shii-Cho and end at a prime Form at Lv.7):

  | Path | Lv.1 | Lv.3 | Lv.5 | Lv.7 (prime) |
  |---|---|---|---|---|
  | Jar'Kai Duelist (dual only) | Shii-Cho | Ataru | Jar'Kai | Jar'Kai Master |
  | Djem So Guardian | Shii-Cho | Soresu | Shien | Djem So |
  | Ataru Acrobat | Shii-Cho | Makashi | Ataru | Ataru Master |
  | Juyo Berserker | Shii-Cho | Ataru | Djem So | Vaapad |
  | Makashi Duelist | Shii-Cho | Makashi | Soresu | Makashi Master |
  | Soresu Defender | Shii-Cho | Soresu | Shien | Soresu Master |
  | Saberstaff Dervish (staff only) | Staff Shii-Cho | Staff Ataru | Staff Niman | Staff Juyo |

- **Saving:**
  - The design is saved in `localStorage` (`meta.custom`, `v: 2`) and sanitised on load; v12 designs migrate automatically (Jedi → Light, Sith → Dark, the hoods become headgear, the sabers become weapons).
  - It registers itself as `CHAR_RAW[80]`, so every per-hero system works with it.
  - Rivals, weapon drops and new-weapon cards never pick #80.

### 2.4 Glory kills & EXECUTE (v10, refined in v12)
- **Staggering:**
  - Elites (heavies, shield-wall leaders and troopers, rivals) **stagger** at ≤35 % HP from heavy melee, or ≤20 % HP from any damage.
  - They wait 4.5 s for a finisher.
  - Your own auto-aim, signature gear and Avada-style spells no longer steal a waiting execution.
- **Finishers:** walk into the elite or press EXECUTE for a hero-specific finisher:
  - Saber Form finisher.
  - Yautja spine-rip.
  - Doom rip & tear.
  - Point-blank execution.
  - Arcane disintegration.
  - Beast limb tear.
- **Rewards and effects:** heal, cooldown refund, XP, slow-mo, camera push-in, letterbox.
- **v12 EXECUTE button:**
  - Never pops in and out. After the first stagger of a run it stays on the HUD, dimmed when nothing is ready ("move closer" / "stagger an elite").
  - **Tap or press E:** executes the **highest-ranked** staggered elite within 230 px. Rank order: rival → heavy → shield leader → shield trooper, nearest first.
  - **Tap during a finisher:** queues an **Execution Chain** — "CHAIN KILL ×N", with lighter slow-mo so the flow never stalls.
  - A pulsing red reticle with a ☠ marks the next target.

### 2.5 Rival Showdown (new in v12; the "Get 'Em Space!" idea from the v9.0 spec)
When a rival (a hero you did not pick) arrives:
1. **Arrive:**
   - A "⚔ RIVAL SHOWDOWN" banner shows the rival and its universe.
   - The rival strides into view.
   - Every regular enemy slowly backs away into a wide spectator ring. Each one keeps its own side; crowded sides stack into rows.
   - The ring follows the fight.
2. **Challenge:** one reckless grunt (on your side, on screen) breaks from the crowd and charges the rival, shouting "THIS BOUNTY IS MINE!".
3. **Finisher:**
   - The rival destroys it with an instant signature finisher in its own style: saber bisect, shot, disintegration, spine-rip, rip & tear, or limb tear.
   - Slow-mo, hit-stop and a crowd gasp follow.
   - The kill is not yours, so it gives no XP.
4. **Duel:**
   - "Now... YOU." — it is you against the rival.
   - The crowd cheers and pumps fists, and never attacks.
   - Your auto-aim, blades, squad, signature gear and spells all ignore the crowd. Stray shots can still clip it.
   - Newcomers join the ring, and spawns slow to 35 %.
5. **Release:** when the rival falls, "RIVAL DEFEATED" appears; the crowd is **shaken** (some freeze, the rest hesitate) and the brawl resumes.

Titans and second rivals wait until the duel is over. Showdowns are rewind-safe and capped at 90 s, and skipped if a Titan is already loose.

### 2.6 Other systems
- **Temporal ladder:**
  - HUD − / 1.0x / + steps from 3.5x down to 0.1x, then into **rewind** (−0.1x … −5.0x).
  - Rewind covers about the last 40 s with interpolation and halts at the start of the buffer.
  - Re-killed "echo" enemies pay nothing.
  - XP, levels, weapons, relics and Dark Matter are kept.
- **Squad radial wheel** (Q / hold the radio button):
  - Orders: Hold, Focus Fire, Advance, Regroup (keys 1–4).
  - Radio beacons call universe-themed fireteams; military heroes start with one.
- **Adaptive biomes:** every universe has its own ground, props, weather and a hazard that hurts you *and* enemies.
- **Galactic Expedition map:** a branching route of sectors. The district you clear decides the next faction, modifier, biome and warlord.
- **Debug All · Proving Ground:** plays **14** live actions with your hero and ticks each PASS / FAIL (it passes with every creator build, including the twin six-shooters and the flying Mandalorian):
  - boot, firing, close-quarters blade, skills, dash, looting, level-up, driving, squad orders;
  - glory kill, **execute chain**, **rival showdown**;
  - rewind, memory purge.
- **Game feel:** camera shake & cinematic zoom, hit-stop & slow-motion, kill-streak announcer (DOUBLE … BEYOND GODLIKE), Titan intro / boss-down cinematics, brass casings & muzzle smoke, low-HP heartbeat vignette, live perf pill.
- **Gore and corpses:**
  - Seed-locked procedural faces and knocked-off helmets.
  - Severed limbs, bisected halves and blood drips.
  - Trophy corpses for rivals and Titans.
- **Relics:** 50 relics; Titans and rivals grant them.
- **Soundtrack:**
  - 20 tracks: your 3 plus 17 royalty-free tracks from OpenGameArt (14 CC0, 3 CC-BY).
  - Named `track_<N>_<Genre>_<Title>.mp3` and listed in `js/chaos.js` `CUSTOM_TRACK_LIST`.
  - Genre filter in the player; credit line in the now-playing pop-up.
  - Full credits in `music/MUSIC_CREDITS.md`.

### 2.7 Threat Sense (new in v13)
- **What it is:** a slim meter under the XP bar that fills **0 → 100 %** toward the next arrival — a **rival** or the **Sector Titan**, whichever comes first. At 100 % it's here (the meter then reads "RIVAL ENGAGED" / "THE TITAN IS HERE").
- **Distance matters:** both arrival clocks tick faster the further you are from the map centre — ×1.0 within the Outpost (≤ 300 px), rising smoothly to **×2.1 at the Abyssal Core** (≥ 1800 px). Exploring the outer rings brings the hunters sooner. Both clocks hold still during a Rival Showdown.
- **Dressed for the hero:**

  | Hero type | Reading |
  |---|---|
  | Luke, Mace, light custom Force users | DISTURBANCE IN THE FORCE (blue ripples) |
  | Yoda | THE FORCE IS TROUBLED ("Clouded, the future is…") |
  | Sidious, Vader, Maul, dark custom Force users | THE DARK SIDE STIRS (red) |
  | Psychics / prescience | PRESCIENCE, PSYCHIC STATIC (River), DÉJÀ VU (Neo), FUTURES SEEN (Strange), TIMEY-WIMEY (the Doctor) |
  | Wizards | DARK OMEN — SCAR BURNING for Harry |
  | Military / tech | MOTION TRACKER with beeps that quicken; SENSOR SWEEP for R2; COLLECTIVE ALERT for the Borg |
  | Bounty hunters / hunters | BOUNTY HEAT, MEDALLION HUMMING (Geralt), HUNT INSTINCT (Predator) |
  | Demons / beasts | DEMONIC PRESENCE (Doom), PRIMAL INSTINCT, WAAAGH-O-METER (Ork), HIVE SENSE (Xeno) |
  | Everyone else | THREAT LEVEL |

- **Feedback:** flavour lines at 50 / 75 / 90 %, a style-specific sound cue, pings around the hero that quicken as it closes in, and at **90 %+ an arrow on the screen edge** pointing where it will come from (the spawn angle is pre-rolled, so the arrow is truthful) with a soft coloured vignette. At 100 % the line ("IT IS HERE.", "CONTACT!", "AS FORESEEN."…) sweeps the screen.
- Hidden in the Proving Ground (no spawns there).

### 2.8 Force Persuasion & allies (new in v13)
- **Who:** Luke (#0), Mace Windu (#78), Yoda (#79) and a custom hero who is **Light + Strong in the Force** — automatically. A custom hero with the **Mind Trick** skill can do it on a button.
- **When:** at least 4 enemies within ~170 px, every 22 s (Yoda every 14 s).
- **What:** the hero raises a hand toward the crowd and **2 enemies (3 from saber Lv.5) turn to his side** for 15 s — Yoda turns 4 (6 from Lv.5) for 20 s. Each one is lifted for a moment, then glows with a halo, a ground ring and a green health bar plus a time-left bar, and is **healed to double health**.
- **Allies fight for you:** they hunt the nearest hostile (favouring the ones near you), ranged ones shoot friendly bolts, and their kills are yours. Hostiles brawl back with any ally in their way. Your shots, blades, explosions, pushes, barriers and spells all pass through allies.
- **Endings:** when the effect wears off an ally **lays down its arms** and leaves (half an XP orb, no kill). An ally killed by hostiles pays nothing.
- **Never converted:** rivals, Sector Titans, staggered elites waiting for EXECUTE, and Showdown spectators. During a showdown allies stand by you and leave the duel alone.

### 2.9 Yoda, Grand Master (new in v13)
- **Lv.1–3 Soresu:** small, economical shoto cuts (unchanged).
- **Lv.4 Ataru:** the leaps and flips of the Geonosis duel.
- **Lv.5+ FORCE LIFT & HURL** (automatic, ~10 s): with 5+ enemies nearby, he lifts up to 8 of them into the air and hurls them outward for heavy damage (most grunts die, survivors are stunned).
- **Lv.7 Ataru Grand Master:** full jumping attacks — he bounds from foe to foe.
- **Lv.7 WILL OF THE FORCE** (his ultimate, automatic, ~45 s, needs 8+ enemies on screen): he **puts his lightsaber away and raises his hand**; the screen slows, and a wave of the Force rolls across the entire screen. **Every enemy it touches levitates.** The badly hurt (< 30 % HP) are **obliterated**; **everyone else turns to the light and fights for Yoda for 25 s**. Rivals and Titans resist (stunned). Anything that spawns afterwards is still hostile. A banner counts how many turned.
- **Tutaminis:** his barrier now says "TUTAMINIS!" (no more "Protego Totalum"), is 25 % bigger (45 % at Lv.7) and lasts 40 % longer (70 % at Lv.7).

---

## 3. Version history

| Version | Highlights |
|---|---|
| **v8.0 / v8.2** | 80 heroes with biographical stances, bespoke dashes, outfit customiser, signature gear, cumulative spellbooks, zero-GC engine (baseline in the old flowchart). |
| **v9.0 (spec)** | Master plan in the previous info.md: bug audit, roster overhaul, Rival deference, DPS telemetry, active-only levelling, Custom Hero #80, true rewind. See §4 for what got built. |
| **Bug-fix pass** (`a3d581d`) | 13 bugs + 12 smaller issues fixed. Included: Titan kill now clears the sector, levitated rivals pay out, OFF weapons are no longer offered on level-up, the empty level-up hand is fixed, the Dark Matter Greed bonus works, EVADED! text is throttled, music discovery 404 bursts are gone. |
| **v9.01 → v10** (`bac8b41`) | v9.01 items a–h: close-range blade immunity fixed, missile fire/smoke trails, Mandalorian IB-94 + Whistling Birds, temporal ladder + rewind, seed-locked corpse faces, relic objects, music button / perf HUD layout. Roadmap A–E: Proving Ground, squad wheel, adaptive biomes, glory kills, Galactic Expedition. Polish: game-feel layer. |
| **v11** (`6095850`) | Lightsaber Form Engine (no more spinning; canon Forms; film progression per hero). 17 new royalty-free tracks → 20-track soundtrack with credits. |
| **v12** (`1bfed0e` … `9ccf8e0`) | Custom Hero Creator #80 (single / staff / dual sabers, hilt selector, 10 colours, Form paths, species). Rival Showdown. Always-on EXECUTE with rank targeting and chains. Film hilts for canon saber heroes. Darksaber. Proving Ground 14 actions. |
| **v13** (this update) | **Threat Sense** meter (per-hero style, distance-scaled rival / Titan clocks, edge arrow). **Force Persuasion** (light-side Force users turn enemies into allies). **Yoda:** Force Lift & Hurl, Ataru bounding, **Will of the Force**, Tutaminis. **Hero Creator v2:** any character — 26 weapons, twins with own cylinders / targets, 2 skills, gear, mobility, armor, headgear, **jetpack flight**, 8 presets, v12 migration. |

---

## 4. Status of the Version 9.0 plan

| v9.0 item | Status |
|---|---|
| Corpse "orb heads" → procedural faces + knocked helmets | ✅ v10 (seed-locked, no flicker) |
| Stowed lightsabers stay ignited → hilt only | ✅ v11 (belt hilt + ignition), film hilts v12 |
| Bottom-right live perf HUD (`#perfHud`) | ✅ v10 |
| Bisected bodies persisting across runs (`slAct` purge) | ✅ bug-fix pass |
| Level-up card 350 ms inspect without accidental pick | ✅ |
| Interactive post-run **Memory Purge screen** (`#scrPurge`) | ⏳ not built (the purge itself works; the animated screen does not exist) |
| Roster overhaul: Die Hard (McClane, Gruber), Hitman, Léon, Heat crew, SWAT BearCat, Special Forces transport, Abrams tank + co-gunner, Waters' SEAL team, Sam Fisher / Shinobi shadow-meld, Avengers, Thanos, TimeShift | ⏳ not built (Dune and Warhammer genres are still in place) |
| Predator **spine-rip finisher** | ✅ v10 (glory kill) |
| Predator **active cloak** (enemies lose you, "?") | ⏳ not built |
| "Get 'Em Space!" Rival crowd deference + show of force | ✅ v12 Rival Showdown |
| DPS telemetry badges on level-up cards + Tactical DPS & Arsenal matrix | ⏳ not built |
| Active-only weapon levelling | ✅ bug-fix pass |
| Custom Character Creator #80 | ✅ **v13 Creator v2**: any build (sabers, blades, guns, wands, tech), Force tiers, skills / gear / mobility / armor budget, jetpack flight, headgear. Still open: house crest, several save slots |
| Twin weapons named "#1 of 2 / #2 of 2", levelled independently | ✅ v12 sabers, ✅ **v13 twin guns** with own cylinders and split targets |
| True temporal rewind | ✅ v10 for every hero (~40 s window; not gated behind Infinity Gauntlet / Chrono-Gauntlet as the spec suggested) |

---

## 5. Future iterations (roadmap)

### 5.1 Next up (v14 candidates)
1. **Dark-side mirror of Persuasion — "Fear":** Sith heroes make nearby enemies kneel or flee in terror for a few seconds (kneeling ones can be executed for a heal). Automatic, like Persuasion.
2. **Ally orders without extra buttons:** allies follow the squad wheel's existing orders (Hold / Focus / Advance / Regroup), and a Yoda ally army gets a short "For the Republic!" charge when the Titan arrives.
3. **Saber-vs-saber Showdowns.**
   - When the rival is a lightsaber hero, the duel uses the Form Engine on both sides: blade locks (bind → push-off), clashes, parry-riposte, Force-push breaks.
   - A "duel camera" that frames both fighters.
4. **Creator, part 3:** several save slots (#80–#82), gun finish / grip / muzzle-flash colour, wand wood & core, cyborg implants, house crest, cape physics; share a build as a short code.
5. **Threat Sense extras:** the meter also warns of elite squads (shield walls) and hazards; a Force user can "meditate" (stand still for 2 s) to read the exact arrival time.
6. **Form-specific Force powers**, all automatic, no extra buttons: Soresu *Circle of Shelter* bubble, Niman Force-push wave, Juyo / Vaapad rage burst at low HP, Makashi disarm.
7. **The rest of the v9.0 roster:** Die Hard, Hitman, Léon, Heat crew, SWAT / Spec-Ops vehicles with AI co-gunners, Waters' SEAL team, Sam Fisher / Ninja stealth, Avengers, Thanos (Infinity Gauntlet), TimeShift.
8. **Predator active cloak**, plus a stealth meter for ninja / Sam Fisher heroes.
9. **DPS telemetry:** Δ-DPS badges on level-up cards and a Tactical DPS & Arsenal matrix in the pause menu.
10. **Post-run Memory Purge & Diagnostics screen** (`#scrPurge`) and an in-game **credits screen** for the music.
11. **Proving Ground batch mode:** run all 81 heroes (and the 8 creator presets) back to back.

### 5.2 Showdown, EXECUTE and ally follow-ups (after playtesting)
- Rival intro variations: the rival Force-chokes or shoots the challenger from range; a bounty hunter tosses a thermal detonator into the crowd; two challengers at higher difficulties.
- Crowd reactions: some spectators flee when the rival dies; others kneel ("WE YIELD") and can be spared for Dark Matter — or persuaded by a Jedi.
- Allies: tune numbers after playtesting (count, duration, double health); maybe let a Jedi re-persuade an ally that is about to leave.
- EXECUTE fine-tuning: adjustable reach in Options; optional auto-execute when walking near a staggered elite; chain rewards.

### 5.3 Realism and cool-factor ideas (automatic, no tedium, no extra buttons)
The goal is to make the player *feel like the character* while the game stays a fast survivor game.

1. **Coloured light from sabers, blasters and spells.**
   - Additive glow pools on the ground and on nearby enemies; muzzle flashes light the area for 1–2 frames.
   - Dark biomes become pools of light.
2. **Cauterised cuts:** saber kills leave glowing orange edges that cool to black and smoke for a second. Steel blades leave blood instead.
3. **Blaster scorch marks and spark bursts** where bolts hit the ground or are deflected; cheap pooled decals that fade.
4. **Footprints and dust:** prints in sand, snow and mud; dust plumes on dashes and Force leaps; puddle splashes in rain biomes.
5. **Weather that touches the action:**
   - Rain sizzles into steam on lit sabers.
   - Snow settles on corpses.
   - Sandstorms tint distant enemies.
   - Lightning flashes briefly reveal the whole screen.
6. **Directional hit reactions:**
   - Enemies flinch away from the hit and spin from shotgun blasts.
   - They fall in the direction of the blow; heavies stagger back a step on Falling Avalanche.
7. **Physics-lite capes and robes:** 3-segment cloaks that trail behind on dashes and flutter in wind.
8. **Soft contact shadows** under heroes, enemies and props (a radial gradient), so everything feels grounded.
9. **Camera feel:**
   - A slight lean toward the aim direction.
   - A tiny kick on heavy shots.
   - A slow push-in when HP is low.
   - A duel framing shot when a Rival Showdown starts.
10. **Signature entrances and exits:**
    - Run start: saber ignition close-up, gun cock, spell flare.
    - Wave cleared: a saber twirl-and-stow, a gun spin-holster, a staff tap.
11. **Better audio space:**
    - Stereo panning by screen position.
    - Saber hum doppler on fast swings.
    - Light reverb in caves, interiors and Titan arenas.
    - A crowd murmur during showdowns.
12. **Material-aware gore:** droids spark and leak oil, xenos bleed acid that hisses, armoured troopers lose plates before limbs.
13. **Destructible cover:** crates splinter, barrels explode, energy shields shatter. Mostly particles, at little gameplay cost.
14. **Holographic HUD anchored to the hero:** cooldown arcs and overheat rings around the character instead of in the corners. Optional, with the classic HUD kept.
15. **Saber hilt heat:** after long combos the emitter glows brighter and the hum deepens. Purely cosmetic.
16. **Contextual finishers:** finishers chosen by angle (from behind = backstab) and by Form (Djem So overhead, Makashi thrust, Juyo spin), plus finishers chosen by the enemy's size.
17. **Living crowds:** spectators in showdowns bang weapons, chant the rival's name, and scatter from stray explosions.
18. **Enemy battle chatter:** short barks such as "FLANK HIM!", "RELOADING!" or "IT'S A JEDI!" on a cooldown, so the horde feels alive.
19. **Dynamic music intensity:** the track's low-pass filter opens as kill streaks rise; boss and showdown stingers duck the music for impact.
20. **Photo mode / replay of the last finisher:** a 2-second slow-motion replay you can save as a screenshot.

---

## 6. Technical notes for future work
- **Hero data:**
  - `CHAR_RAW[cid] = [id, genre, price DM, name, Lv.1 weapon, Lv.10 supercharge, style, passive, passive text]`.
  - Per-hero tables are indexed by `cid`: `HERO_SIG_GEAR`, `UTILS_56`, `Q_56`, `HERO_STANCE_TABLE`, `SABER_PATHS`, `WPN_SVG_56`, `CANON_56`.
  - `CUSTOM_CID = 80` is filled in at runtime by `customHeroRegister()`.
- **Weapons:** player weapons are objects `{ id, name, style, lvl, bladeCol, … }`.
  - Custom sabers add `ownCol`, `hilt`, `bladeK` (shoto length), `dualTag` (" #1 of 2") and `dbl` (saberstaff).
  - v13: `twinIdx` (0 / 1 for twins; odd twins take the second-nearest target in `fireWeapon`) and `w.six = { left, burst, reload }` (per-weapon six-shooter cylinder; `player.six*` mirrors the last one for the HUD / render).
  - Two weapons may share an `id`; level-up cards reference the weapon object, so twins level independently.
- **Creator v2 design (`meta.custom`, `v: 2`):** `{ name, align: light|dark|grey|bounty, force: none|touched|strong, talent, weapons: [{ k, hilt?, col? }] (1-3), path, skills: [2 keys], gear, dash, armor, species, body, skin, hair, head, robe, legs, cloak }`. Read-only views `setup` / `sabers` are derived for v12 compatibility. Catalogs: `CUSTOM_WEAPONS`, `CUSTOM_SKILLS`, `CUSTOM_GEAR`, `CUSTOM_DASHES`, `CUSTOM_ARMOR`, `CUSTOM_HEADGEAR`, `CUSTOM_PRESETS`; requirements via `crReqOk(design, req)`. Queries used by other modules: `customForceTier()`, `customAllegiance()`, `customHasMagic()`, `customHasJetpack()`, `customKinStyle()`, `customDashSpec()`, `customSpellLadder()`, `customGloryStyle()`, `customSenseKind()`, `customAllyColor()`.
- **Flight:** `player.flying` (beskar) skips obstacle checks in movement and dashes; `hover` + `hazImmune` are set too. The sprite lift, shadow and jets are drawn in `drawHeroSprite` when `customHasJetpack()`.
- **Allies API (`js/state.js` + `js/force.js`):** `allyIs(j)` (`allyUid[j] === eUid[j]`), `allyCount`, `allyT / allyDur / allyLift`, `allyConvert(j, dur, lift)`, `allyLayDown(j)`, `allyTakeHit(a, i, dt)`, `allyNearestFor(i, r)`. The enemy loop runs `allyEnemyStep` for allies. **Any new damage / targeting loop must skip `allyIs(j)` (or `sdIgnore(j)`, which now covers allies).** `targetFilterOn()` = showdown active or allies present.
- **Threat Sense API (`js/sense.js`):** `threatMult()` (1.0 → 2.1 by distance), `player.titanClock` (replaces the old `runTime > bossAt` check; rewound with the player), `senseState` (pct, kind, engaged, angRival / angTitan), `threatSpawnAngle(isBoss)` used by `spawnEnemy`.
- **Yoda:** `yodaSaberLvl()`, `forceState` (persuade / lift / will timers and counters), `player.saberStowT` (the Form Engine retracts and holds the blade), `player.boundT` (Ataru bound in flight), `eFLiftZ[j]` (render height of a lifted foe).
- **Showdown API:** `showdownBusy()`, `sdSpect(j)`, `sdIgnore(j)`.
  - Execution-style abilities should also skip staggered enemies (`eStagger[j] > 0`).
- **EXECUTE API:** `gloryRequest()` (button / E key / Proving Ground), `gloryRank(i)`, `gloryState.best / inRange / queued / chain`.
- **Saves:** the `localStorage` key `OMNISHIFT_META_V1` holds `chars`, `selChar`, `outfits`, `custom` (v2 since v13), `campaign`, `stages`, `cleared`, the Dark Matter totals and options.
- **Cache-busting:** every script tag carries `?v=v13-2026-10-28`; bump it on each release so GitHub Pages serves fresh files.
- **Testing:**
  - The in-game **Debug All · Proving Ground** covers 14 live actions.
  - The offline QA suites used for each release (not part of the repo) cover the Form Engine, showdowns, the creator (v12 + v13), Threat Sense, allies and Yoda, all 81 heroes plus the 8 creator presets, and 3-minute soak runs.
