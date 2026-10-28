# FILE: info.md
# PART: 1 of 14
# DETAIL: Master design document, updated for v12 (2026-10-27). Covers what the game is now, everything built so far (v8.x → v12), how much of the Version 9.0 plan is done, and the roadmap for future iterations, including realism and cool-factor ideas. The architecture and execution diagrams are in flowchart.md.

---

## 1. What the game is (current state, v12)

**OMNI-SHIFT: NEXUS SURVIVORS** is a touch-first multiverse survival roguelike built on HTML5 Canvas. It runs in mobile WebViews and desktop browsers and is played live on GitHub Pages.

### Engine
- **Zero-garbage engine:**
  - Every high-frequency entity lives in pre-allocated Structure-of-Arrays typed-array pools: enemies, projectiles, orbs, particles, blood drips, severed limbs, corpses, bisected halves, squad and minion allies, and rewind keyframes.
  - The sim runs at 60 FPS with sub-steps.
  - The HUD updates in place, so taps never drop.
- **Modular code:** 21 files.
  - **Core:** index.html, css/style.css.
  - **Data:** `chaos.js`, `data-factions.js`, `data-heroes.js`, `data-relics.js`.
  - **Engine:** `state.js`, `world.js`, `combat.js`, `sim.js`, `render.js`.
  - **v10 modules:** `fx.js`, `rewind.js`, `arsenal.js`, `squad.js`, `glory.js`, `biomes.js`, `campaign.js`, `proving.js`.
  - **v11 module:** `saberforms.js`.
  - **v12 modules:** `showdown.js`, `creator.js`.
  - **UI:** `ui.js`.
  - Feature modules plug in through the `V10` hook lists:
    - `onRunStart` / `onRunReset`
    - `onStep` / `onFrame`
    - `onKill`
    - `onRenderWorld` / `onRenderScreen`

### Content
- **81 heroes:** 80 canon heroes (#00–#79) in 11 universe genres, plus **your own hero (#80)**.
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
- Survive to 2:00, when the **Sector Titan** arrives.
- Kill it to clear the sector and bank Dark Matter.
- **Rivals:** other heroes hunt you every ~75 s, and the duel is now a **Rival Showdown**.

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

### 2.2 Lightsaber Form Engine (v11, extended in v12)
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

### 2.3 Your Own Hero — Custom Hero Creator (#80, new in v12)
- **Access:** free and always unlocked, from the main menu or the top card of the roster.
- **Identity:**
  - Name.
  - Allegiance: Jedi (+0.6 HP/s), Sith (+25 % crit damage) or Grey (+15 % XP & Dark Matter).
  - Force talent: Speed (+15 % speed, +10 % dodge), Endurance (+25 % HP, +2 armour) or Fury (+20 % damage, +10 % crit).
- **Look:**
  - Species: Human, Zabrak (horns), Togruta (montrals & head-tails), Twi'lek (lekku), Miraluka (blindfold) or Cyborg (half-mech face).
  - Body: masculine or feminine.
  - 9 skin tones.
  - Hair, or a Jedi / Sith hood.
  - 8 robes, 4 legs, 5 cloaks.
- **Sabers:**
  - **Single saber**, **saberstaff**, or **dual sabers**.
  - **Dual sabers are two completely separate weapons ("#1 of 2" / "#2 of 2").** Each has:
    - its own hilt (hilt selector, 10 hilts);
    - its own blade colour (10 colours, including the Darksaber);
    - its own level and its own level-up cards;
    - its own Form stage and its own targets.
  - They fight in relay through the Form Engine. **Match #1** mirrors saber 1 onto saber 2 for a matched pair.
  - **The 10 hilts:** Graflex Classic, Jedi Knight, Ribbed Hermit, Dark Lord, Electrum, Curved Duelist (bent grip), Shoto (short blade), Crossguard (quillons, unstable), Temple Guard, Scavenger.
- **Fighting Form paths** (all start at Shii-Cho and end at a prime Form at Lv.7):

  | Path | Lv.1 | Lv.3 | Lv.5 | Lv.7 (prime) |
  |---|---|---|---|---|
  | Jar'Kai Duelist (dual only) | Shii-Cho | Ataru | Jar'Kai | Jar'Kai Master |
  | Djem So Guardian | Shii-Cho | Soresu | Shien | Djem So |
  | Ataru Acrobat | Shii-Cho | Makashi | Ataru | Ataru Master |
  | Juyo Berserker | Shii-Cho | Ataru | Djem So | Vaapad |
  | Makashi Duelist | Shii-Cho | Makashi | Soresu | Makashi Master |
  | Soresu Defender | Shii-Cho | Soresu | Shien | Soresu Master |
  | Saberstaff Dervish (staff only) | Staff Shii-Cho | Staff Ataru | Staff Niman | Staff Juyo |

- **Also included:**
  - Allegiance-based utilities: Saber Throw plus Force Repulse, Force Lightning or Shatterpoint.
  - Signature gear: Force Push (Jedi / Grey) or Force Lightning (Sith).
  - Force Dash in your saber colour.
  - Force-sense visor and quotes.
  - Sith heroes count as villains in rival dialogue.
- **Saving:**
  - The design is saved in `localStorage` (`meta.custom`) and sanitised on load.
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
- **Debug All · Proving Ground:** plays **14** live actions with your hero and ticks each PASS / FAIL:
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

---

## 3. Version history

| Version | Highlights |
|---|---|
| **v8.0 / v8.2** | 80 heroes with biographical stances, bespoke dashes, outfit customiser, signature gear, cumulative spellbooks, zero-GC engine (baseline in the old flowchart). |
| **v9.0 (spec)** | Master plan in the previous info.md: bug audit, roster overhaul, Rival deference, DPS telemetry, active-only levelling, Custom Hero #80, true rewind. See §4 for what got built. |
| **Bug-fix pass** (`a3d581d`) | 13 bugs + 12 smaller issues fixed. Included: Titan kill now clears the sector, levitated rivals pay out, OFF weapons are no longer offered on level-up, the empty level-up hand is fixed, the Dark Matter Greed bonus works, EVADED! text is throttled, music discovery 404 bursts are gone. |
| **v9.01 → v10** (`bac8b41`) | v9.01 items a–h: close-range blade immunity fixed, missile fire/smoke trails, Mandalorian IB-94 + Whistling Birds, temporal ladder + rewind, seed-locked corpse faces, relic objects, music button / perf HUD layout. Roadmap A–E: Proving Ground, squad wheel, adaptive biomes, glory kills, Galactic Expedition. Polish: game-feel layer. |
| **v11** (`6095850`) | Lightsaber Form Engine (no more spinning; canon Forms; film progression per hero). 17 new royalty-free tracks → 20-track soundtrack with credits. |
| **v12** (this update) | Custom Hero Creator #80 (single / staff / **dual sabers**, hilt selector, 10 colours, Form paths, species). Rival Showdown. Always-on EXECUTE with rank targeting and chains. Film hilts for canon saber heroes. Darksaber. Proving Ground 14 actions. Execute targets protected from auto-abilities. More robust Proving Ground tests. |

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
| "Get 'Em Space!" Rival crowd deference + show of force | ✅ **v12 Rival Showdown** |
| DPS telemetry badges on level-up cards + Tactical DPS & Arsenal matrix | ⏳ not built |
| Active-only weapon levelling | ✅ bug-fix pass |
| Custom Character Creator #80 | ✅ **v12 for lightsaber builds** (single / staff / dual with hilt selector). Still to add: gun builds (twin guns), wizard / cyborg classes, jetpack gear, house crest, 10-slot utility belt |
| Twin weapons named "#1 of 2 / #2 of 2", levelled independently | ✅ v12 (custom dual sabers). Twin **guns** with independent aim: ⏳ |
| True temporal rewind | ✅ v10 for every hero (~40 s window; not gated behind Infinity Gauntlet / Chrono-Gauntlet as the spec suggested) |

---

## 5. Future iterations (roadmap)

### 5.1 Next up (v13 candidates)
1. **Twin guns as two separate weapons.**
   - Akimbo pistols that track two different targets (independent aim arcs), each with its own level and "#1 of 2 / #2 of 2" cards.
   - Fan-hammer / Silverballer-style alternating fire.
2. **Creator, part 2.**
   - Gunslinger builds: twin pistols with grip / finish / barrel selector, muzzle-flash colour.
   - Wizard builds: wand wood & core, spell school.
   - Cyborg builds: implants and weapon arm.
   - Jetpack and back gear, house crest, utility-belt picker.
   - Save several custom heroes (slots #80–#82).
3. **Saber-vs-saber Showdowns.**
   - When the rival is a lightsaber hero, the duel uses the Form Engine on both sides: blade locks (bind → push-off), clashes, parry-riposte, Force-push breaks.
   - A "duel camera" that frames both fighters.
4. **Form-specific Force powers**, all automatic, no extra buttons:
   - Soresu: *Circle of Shelter* bubble that eats bolts.
   - Niman: Force-push wave.
   - Ataru: Force-leap to distant targets.
   - Juyo / Vaapad: rage burst at low HP.
   - Makashi: disarm, so enemies drop their weapon.
5. **The rest of the v9.0 roster:** Die Hard, Hitman, Léon, Heat crew, SWAT / Spec-Ops vehicles with AI co-gunners, Waters' SEAL team, Sam Fisher / Ninja stealth, Avengers, Thanos (Infinity Gauntlet), TimeShift.
6. **Predator active cloak**, plus a stealth meter for ninja / Sam Fisher heroes.
7. **DPS telemetry:** Δ-DPS badges on level-up cards (red / green / flashing gold) and a Tactical DPS & Arsenal matrix in the pause menu.
8. **Post-run Memory Purge & Diagnostics screen** (`#scrPurge`) with the animated "130 → 0 CLEARED" count-down.
9. **Credits screen** listing every music track and attribution (the CC-BY credits are already in the toast and in `MUSIC_CREDITS.md`).
10. **Proving Ground batch mode:** run all 81 heroes back to back, not just the selected one.
11. **Hero-specific squad co-gunners**, a dedicated Batman / Gotham theme, and a visible rewind-window meter.

### 5.2 Showdown and EXECUTE follow-ups (after playtesting)
- Rival intro variations:
  - The rival Force-chokes or shoots the challenger from range.
  - A rival bounty hunter tosses a thermal detonator into the crowd.
  - Two challengers at once at higher difficulties.
- Crowd reactions:
  - Some spectators flee when the rival dies; others kneel ("WE YIELD").
  - Kneeling enemies can be spared for bonus Dark Matter, or executed.
- EXECUTE fine-tuning:
  - Adjustable reach in Options.
  - Optional auto-execute when walking near a staggered elite.
  - A chain counter that rewards ×3+ chains with a short invulnerability.

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
  - v12 custom sabers add `ownCol`, `hilt`, `bladeK` (shoto length), `dualTag` (" #1 of 2") and `dbl` (saberstaff).
  - Two weapons may share an `id`; level-up cards reference the weapon object, so twins level independently.
- **Showdown API:** `showdownBusy()`, `sdSpect(j)`, `sdIgnore(j)`.
  - Any new targeting code must skip `sdIgnore(j)` enemies.
  - Execution-style abilities should also skip staggered enemies (`eStagger[j] > 0`).
- **EXECUTE API:** `gloryRequest()` (button / E key / Proving Ground), `gloryRank(i)`, `gloryState.best / inRange / queued / chain`.
- **Saves:** the `localStorage` key `OMNISHIFT_META_V1` holds `chars`, `selChar`, `outfits`, `custom` (v12), `campaign`, `stages`, `cleared`, the Dark Matter totals and options.
- **Cache-busting:** every script tag carries `?v=v12-2026-10-27`; bump it on each release so GitHub Pages serves fresh files.
- **Testing:**
  - The in-game **Debug All · Proving Ground** covers 14 live actions.
  - The offline QA suites used for each release (not part of the repo) cover the Form Engine, showdowns, the creator, all 81 heroes and 3-minute soak runs.
