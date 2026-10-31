# FILE: info.md
# PART: 1 of 14
# DETAIL: Master design document, updated for the v14.1 patch (2026-10-31). Covers what the game is now, everything built so far (v8.x → v14.1), how much of the Version 9.0 plan is done, and the roadmap for future iterations, including realism and cool-factor ideas. The architecture and execution diagrams are in flowchart.md.

---

## 1. What the game is (current state, v14.1)

**OMNI-SHIFT: NEXUS SURVIVORS** is a touch-first multiverse survival roguelike built on HTML5 Canvas. It runs in mobile WebViews and desktop browsers and is played live on GitHub Pages.

### Engine
- **Zero-garbage engine:**
  - Every high-frequency entity lives in pre-allocated Structure-of-Arrays typed-array pools: enemies, projectiles, orbs, particles, blood drips, severed limbs, corpses, bisected halves, squad and minion allies, Force-persuaded allies and rewind keyframes.
  - The sim runs at 60 FPS with sub-steps.
  - The HUD updates in place, so taps never drop.
- **Modular code:** 36 files.
  - **Core:** index.html, css/style.css.
  - **Data:** `chaos.js`, `data-factions.js`, `data-heroes.js`, `data-relics.js`.
  - **Engine:** `state.js`, `world.js`, `combat.js`, `sim.js`, `render.js`.
  - **v10 modules:** `fx.js`, `rewind.js`, `arsenal.js`, `squad.js`, `glory.js`, `biomes.js`, `campaign.js`, `proving.js`.
  - **v11 module:** `saberforms.js`.
  - **v12 modules:** `showdown.js`, `creator.js` (rewritten as Creator v2 in v13).
  - **v13 modules:** `sense.js` (Threat Sense), `force.js` (Force Persuasion + Yoda's powers).
  - **v14 modules (Nexus City):** `citygen.js` (world generator), `cityworld.js` (chunks, collision, doors, sight), `citythemes.js` (14 universe looks), `cityrender.js` (baked city painter, roofs, fog), `stealth.js` (hearing, AI, director), `enemylook.js` (48 enemy rosters), `cityplay.js` (engine integration, cars), `vision.js` (per-hero senses), `minimap.js` (minimap, map, markers).
  - **v14.1 modules:** `vehicles.js` (rigid-body vehicles, crumple damage, parts, fuel, driving), `convoy.js` (squad seats, gunners, tactical convoy), `cityaccess.js` (entrances, ladders, roofs, fence crossing, tap gestures, eye height), `hudlayout.js` (HUD layout manager + options).
  - **UI:** `ui.js`.
  - Feature modules plug in through the `V10` hook lists:
    - `onRunStart` / `onRunReset`
    - `onStep` / `onFrame`
    - `onKill`
    - `onRenderWorld` / `onRenderScreen`

### Content
- **81 heroes:** 80 canon heroes (#00–#79) in 11 universe genres, plus **your own hero (#80)** — any kind of character since v13.
- **The 11 genres:** Star-Sector, Chevron-Gate, Verse-Rim, Spice-Dune, Star-Citadel, Xeno-Hive, Grim-Imperium, Cyber-Noir, Anomaly-Lab, Eldritch-Ash and Arcane-Sanctum.
- **World:** since v14 every deploy drops you into **Nexus City**, a generated 64 × 64 km region (55 cities & towns, interstates, thousands of enterable single-storey buildings), dressed for your hero's universe. The classic arena is one toggle away (main menu → WORLD, or `?world=classic`).
- **Sectors:** 50 procedural sectors, plus the **Galactic Expedition** branching campaign map.
- **Meta progression:**
  - Dark Matter shop with a 100 % respec.
  - Heroes unlock with Dark Matter.
  - One free starter hero per genre.
  - The custom hero is free.

### Core loop
Pick a hero → drop into Nexus City (or the classic arena) → sneak, scout and fight: weapons fire automatically at hostiles in sight, Forms and spells shred whoever comes. Gunfire draws everyone who hears it. Then:
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

### 2.10 Nexus City — the world (new in v14)
- **Scale:** 64 × 64 km at 32 px per metre, generated from a seed in ~25 ms (`meta.citySeed`, default 1979 — everyone shares the same region, so markers stay valid; the drop-zone map can roll a NEW REGION).
- **Macro map (1 km cells):** 1 capital ("Nexus City"), 6 more cities, 22 towns, 26 villages; land use Downtown / Urban / Suburbs / Rural / Farmland / Industrial / Woods / Lakes; 3–4 interstates each way (I-65, I-70…).
- **Streets:** a ranked lattice (1 km / 500 m / 250 m / 125 m) with jitter; widths, sidewalks, curbs, lane markings and crosswalks follow rank and district; street names (Meridian Ave, 66th St, County Rd 300 E).
- **Blocks & lots:** suburbs of ranch houses with driveways, garages, fences, pools and sheds; strip malls, gas stations (pumps, canopy, price sign), diners, banks, motels, apartments, downtown shop rows, warehouses with docks, farms with barns and silos; civic centres with **city hall**, police, fire station, school (sports field), clinic, library, church (graveyard).
- **Interiors:** 20 templates, every building enterable: rooms by purpose (living, kitchens, bedrooms, baths, offices, classrooms, cells, armory, vault, council chamber, nave…), doors (swing / slide, open for anyone), windows (break, then climbable), ~75 furniture types placed so walkways and archways stay clear (validated: <2 % unreachable floor on average, every building has an exterior door).
- **Runtime (`cityworld.js`):** 64 m chunks of 0.5 m tiles with flags (MOVE / SIGHT / SHOT / WINDOW / DOOR / INDOOR / LOW / WATER) and material kinds; circle collision with sliding, DDA ray casts, recursive shadow-cast line of sight, door simulation, window breaking. The drop zone maps to local (256, 256) so every v13 system keeps working.
- **Rendering (`cityrender.js`):** 512 px tiles baked nearest-first within a 6 ms budget (LRU), procedural texture patterns per universe; live layer for doors, decals (bullet holes, scorch, glass, blood), supply caches; roofs (gable / hip / flat / dome / false front, chimneys, AC units, solar, windtraps, obelisks, spires, landing pads, neon trims) that fade out for the building you're in; signage with themed names; scattered litter everywhere.
- **Universe dressing (`citythemes.js`):** 14 looks — Modern Earth, Neon Megacity, Outer Rim, Core-World ecumenopolis, Federation colony, Frontier colony base, Firefly rim world, Old West, Arrakeen, Goa'uld world, Imperial hive, Wasteland, Medieval kingdom, Wizarding village. Floors, walls, roofs, furniture style, cars (sedans, spinners, landspeeders, hovercars, APCs, mules, wagons, ornithopters, death gliders, Rhinos, rusted wrecks, carts, the flying Anglia), trees (palms, cacti, vaporators, holo-trees…), lamps, signs ("TIBANNA FUEL", "PROMETHIUM DEPOT", "FLOO POWDER CO."), city names (Mos Espa, Hogsmeade, Night City…), weather and litter.

### 2.11 Stealth, hearing & the director (new in v14)
- **Sound model:** `L = L0 − 20·log10(d) − 0.012·d − walls`. Every wall, door, window, fence on the straight path costs its transmission loss (wood 24, brick 32, masonry 35, metal 30, interior 20, closed door 15/24, window 20, broken 0); buildings the sound only passes over cost 10 dB (+3 each more). Thresholds: notice 50, investigate 66, urgent 88, combat 115 (< 25 m).
- **Profiles:** each hero's weapon has a level and class (firearm 160–176, blaster 140, staff weapons 136, energy 88–150, magic ~104, blades 72). **V** fits a suppressor (118 dB) on real firearms only (revolvers, bolters, shotguns, the Deffgun… can't). Footsteps 58–66, sneaking 36, engines 92, glass 105, ricochets 100, explosions ~160–178.
- **Reactions:** listeners investigate the (error-blurred) source, the next shot re-targets them, very loud close shots put them straight into combat; distant enemies beyond the simulated radius answer loud shots as responders. Ricochets and breaking glass make noise at the impact point (distraction).
- **AI states:** idle (guard posts, rooms) · patrol (street patrols, routes) · investigate · search · alert (chase, shoot with LOS, call contacts) · return. View cones (wider when searching), suspicion that builds with distance, light, movement and muzzle flash; A* on a walkability snapshot, door opening, unsticking.
- **Director:** spawns the generator's room / guard / patrol records within ~130 m (never in plain view), despawns far idle enemies, remembers kills; hunter squads sweep toward you periodically (faster in dangerous districts).
- **Weapons-free rule:** guns fire automatically only at hostiles in sight and range; **Shift** = sneak (55 % speed, hold fire until spotted). Blades on unaware foes are silent takedowns.

### 2.12 Line of sight & per-hero vision (new in v14)
- A shadow-cast vision sphere (≈ 26 m, per hero): everything behind walls / closed doors is desaturated and darkened (adaptive: a cheaper grey wash on GPU-less devices); roofs hide other buildings' interiors.
- 16 sense kinds across the 80 heroes, most without wall vision: Force aura (no droids), Predator particle ghosts, thermal, IR target boxes, motion tracker (movement only, with ping), scan pulses, close-range X-ray, the Matrix code, Marauder's Map footprints, prescient flashes, witcher scent trails, telepathy, hive links, rage haze, keen-hearing ripples, long scopes, and plain human eyes. Senses never allow shooting through walls.

### 2.13 Enemy rosters (new in v14 — city and arena)
- 48 rosters × 4 archetypes (grunt · fast · critter · heavy), chosen by hero: Stormtroopers / Scout & Death Troopers / probe droids hunt the Rebels; Serpent & Horus Jaffa, Replicators and Kull hunt SG-1; the Bratva (tracksuit gunmen, Tarasov enforcers, attack dogs, High Table heavies) hunt John Wick; the Covenant hunt the Chief; Death Eaters hunt Harry…
- Detailed renderer: walk cycles, outfit details and per-person variations, ~70 headgear types, weapons that track the aim (sabers swing), plus droids, beasts, bugs, drones, Daleks and Xenomorphs. Ranged / kinetic flags drive AI and ricochets.

### 2.14 Map, minimap & markers (new in v14)
- Minimap (bottom-right, 5 zoom levels) in the universe's map style (paper road map, holo-map, parchment); shows visible / sensed enemies.
- **M** opens the full map: pan / zoom to the whole region, street names, interstate shields, city names, cursor read-out. Click to drop a marker (6 colours × 8 symbols) with a note; markers & notes persist per region.
- Markers ride the minimap edge while far, sit on the minimap when in range, and become a coloured beacon (plus edge arrow) on the main screen within ~160 m. From the main menu the map picks the drop zone.

### 2.15 Vehicles, caches & districts (new in v14)
- **F** next to a parked car drives it (themed vehicle, too wide for doorways, loud engine); it stays where you leave it. Since v14.1 every vehicle is a real rigid body — see §2.16.
- Supply caches inside buildings heal and give XP. City kills are worth 30 % more XP.
- Threat Sense and the HUD follow the district (Suburbs ×1.15 … Downtown ×1.85); arena biome hazards are off in the city.

### 2.16 Vehicles — physics, crashes & damage (v14.1)
- **Every vehicle drives (23 kinds):** sedans, police cruisers (light bar), pickups, SUVs, the universe rides (landspeeder, spinner, hovercar, ornithopter, death glider, mule, Rhino, APC, rusted wreck-runner, flying Anglia), wagons, stagecoaches and carts (horses = stamina instead of fuel), buses, **the army trucks of the evacuation roadblocks**, tractors, semis, fire engines (inside fire stations), forklifts (warehouses) and garage cars (the garage door rolls up when you get in).
- **Live rigid bodies:** a parked prop / furniture vehicle is *promoted* to a live body the moment it's entered, hit, shot or caught in a blast — exactly where and as it was parked; its tile collision is cleared and the art re-bakes without a flash. Bicycle steering model (speed-sensitive), tyre grip, hover kinds slide and cross water.
- **Collisions:** deformed-perimeter samples against walls / props; OBB–OBB separating-axis tests between vehicles with impulses (mass matters: a bus shoves a car, a parked car with locked wheels resists). Cars never merge any more.
- **Crumple zones:** damage depends on where the hit lands — 24 perimeter cells dent inwards (front / rear up to 22 % of the length, sides 18 %), the sprite deforms, glass cracks then breaks. A 50 km/h wall hit costs a sedan ~21 % structure and tears off the bumper and a light — **never dead on the first hit**, but three more 80 km/h hits kill it.
- **Attachment points:** bumpers, hood, trunk / tailgate, doors, mirrors, lights, glass, wheels / pods, sunroof, light bar, canvas cover, forks, wings, tracks and horses each have their own HP; past it they **fall off and stay on the road** (from crashes *and* from enemy fire, blades and blasts).
- **Damage from everything:** bumping a person (a little), bullets (holes, part hits, glass; rounds through glass or a missing door reach the occupants), melee bashing, saber cuts (glowing slashes), blasts (push + damage), the Force (push), fire. Engine smoke < 35 %, black smoke < 15 %, 0 = disabled; a disabled vehicle may burn → explodes after ~7 s (debris, scorch, chain reactions). The driver bails out automatically when it burns; riders get out with you.
- **Noise:** engines, horns, crashes and explosions feed the v14 hearing model (a car is loud).
- **Controls:** F in / out · point-to-steer (push where you want to go, pull back = reverse) or classic W/S + A/D (Options) · Space / X handbrake · H horn (+ squad mount-up) · touch HB / horn buttons on phones · speed in mph or km/h (Options).

### 2.17 Fuel & gas stations (v14.1)
- Each vehicle starts with 15–85 % (parked cars aren't full); use ∝ throttle (~9–10 % per minute flat out). The gauge shows the universe's fuel name (FUEL CELL, REPULSOR FUEL, NAQUADAH, PROMETHIUM, GUZZOLINE, HORSES…).
- Stop next to a pump (≤ 2.5 m) to refill at 8 %/s (horses: water & hay). Convoy vehicles refuel at the same stop. Below half a tank the minimap shows stations; below 30 % an arrow points to the nearest. Coverage check: every land class has a station within ~3 km.

### 2.18 Squad riders & tactical convoys (v14.1)
- **Mount up:** when you get in (or press H), followers within ~44 m board: gunners take window / bed / hatch / sunroof seats, a hound rides with its head out of the window, a bone golem goes in the bed. Riders lean out and shoot **only on their side**; a missing door shows the whole rider; a sunroof (35 % of sedans, 50 % of SUVs) or hatch puts a gunner up top. Allies (Force-persuaded) ride too.
- **Overflow → convoy:** riders who don't fit take the nearest drivable vehicles and follow your exact path (pure pursuit on your trail). Doctrine (FM 55-65, US Army Tactical Convoy Handbook, ANA/FM 4-01.45): close column in towns, interval ≈ 2 × speed (mph) in metres scaled to the screen (8 m town / 14 m open, cap 30 m, tighter under fire), catch-up speed, lead 12 o'clock · alternating 9 / 3 · trail 6 o'clock gun sectors, drive through the kill zone, **herringbone** at halts (alternate 45° pull-offs, road kept clear), **cross-load** from disabled vehicles; crews with no seats hold the spot with a map marker until picked up. Stuck recovery, unpark manoeuvres and three look-ahead feelers keep them out of parked cars.

### 2.19 Doors, roofs, fences & eye height (v14.1)
- **Entrances you can see:** every exterior door has a step, frame, porch light and an arrow; garages and loading bays too; EXIT markers inside.
- **Roofs:** every building has a ladder (grav-lift in sci-fi looks) — **F** to climb. On a roof you see 25 % further and over everything, the street can see you, the room below can't; melee hunters climb after you and come down when you do. Mobility classes per hero (tele / jet / leap / climb / giant / smash / none): climbers pull themselves up without a ladder.
- **Teleport / leap gestures:** double-tap a building = inside (apparate) or dive through a window (leapers / jetpacks), **triple-tap = roof**; tapping the street from a roof drops you there.
- **Fences:** drawn tall in every look (wood / durasteel privacy panels, chain-link with a crisp diamond mesh — barbed wire in industrial blocks — pickets, stone garden walls, hedges), with gates. Leapers vault, jetpacks fly over, climbers scale, teleporters phase, the half-giant steps over, the T-800 and Vader smash through; heroes without mobility use gates.
- **Sight through fences:** privacy fences, hedges and stone walls block sight (that's the grey beyond them); chain-link and pickets don't. **Eye height:** from a tall cab (bus, army truck, fire engine, semi, tractor, APC / Rhino hatch, stagecoach box), on a jetpack, as the half-giant or at the top of a leap you see over those ~2 m obstacles — and can be seen.

### 2.20 HUD layout manager (v14.1)
- A solver places 12 HUD elements (health bar, EXECUTE, vehicle gauge, minimap, stealth pill, squad radio, minimap buttons, tips, district banner, debug / music, music toast, FPS) by priority so **nothing ever overlaps** — verified at 7 screen sizes from 360 × 740 phones to 1080p, while driving with a tip, EXECUTE and the toast up. Lower-priority items shrink first (each down to its own minimum), then hide-able items step aside.
- **Options → HUD LAYOUT:** priority order (▲▼), **Don't shrink** per item, Hide per item, overall HUD size, auto-compact on phones, live preview.
- The world shows only an **F / TAP keycap** over the thing you can use; the full prompt lives in one HUD button (no duplicate text).

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
| **v13** (`65c212e`) | **Threat Sense** meter (per-hero style, distance-scaled rival / Titan clocks, edge arrow). **Force Persuasion** (light-side Force users turn enemies into allies). **Yoda:** Force Lift & Hurl, Ataru bounding, **Will of the Force**, Tutaminis. **Hero Creator v2:** any character — 26 weapons, twins with own cylinders / targets, 2 skills, gear, mobility, armor, headgear, **jetpack flight**, 8 presets, v12 migration. |
| **v14** (`74a5b73`) | **Nexus City:** generated 64 × 64 km region with 55 settlements, interstates and thousands of enterable single-storey buildings with full interiors; 14 universe looks; line-of-sight fog and roofs; **stealth AI** with realistic hearing (walls, doors, suppressors, ricochets, glass), director, street patrols and hunters; **48 detailed enemy rosters** (city and arena); **per-hero vision** (16 senses); minimap, full map, markers & notes, drop zone; drivable cars; supply caches; district threat; 18-test suite. |
| **v14.1 patch** (this update) | **Vehicles:** every vehicle drivable (incl. roadblock army trucks, buses, semis, fire engines, forklifts, garage cars), rigid-body collisions, location-based crumple zones, detachable parts, damage from every source, fire & explosions; **fuel** with themed stations. **Squad riders** shooting from their side, sunroof / hatch gunners, **doctrine convoys** (intervals, sectors, herringbone, cross-load, hold markers). **Visible doors, roofs** (ladders, tap gestures), **tall fences** by hero mobility, **eye-height** vision. **HUD layout manager** (no overlaps, priority / Don't shrink options). Fix: interiors are now repeatable (a random-comparator sort made ~1 % of buildings re-furnish differently after cache evictions). 20-test suite. |

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
| Predator **active cloak** (enemies lose you, "?") | 🟡 v14: enemies really lose you (stealth AI, "?" / "!"), Predator bio-mask vision and a harder-to-spot shimmer; a dedicated cloak button is still open |
| "Get 'Em Space!" Rival crowd deference + show of force | ✅ v12 Rival Showdown |
| DPS telemetry badges on level-up cards + Tactical DPS & Arsenal matrix | ⏳ not built |
| Active-only weapon levelling | ✅ bug-fix pass |
| Custom Character Creator #80 | ✅ **v13 Creator v2**: any build (sabers, blades, guns, wands, tech), Force tiers, skills / gear / mobility / armor budget, jetpack flight, headgear. Still open: house crest, several save slots |
| Twin weapons named "#1 of 2 / #2 of 2", levelled independently | ✅ v12 sabers, ✅ **v13 twin guns** with own cylinders and split targets |
| True temporal rewind | ✅ v10 for every hero (~40 s window; not gated behind Infinity Gauntlet / Chrono-Gauntlet as the spec suggested) |

---

## 5. Future iterations (roadmap)

### 5.1 Next up (v15 candidates)
1. **Civilians & evacuation** (the city is evacuated "for now"): stragglers to escort, convoys, rescue objectives; enemies that take hostages.
2. **Day / night & lighting:** street lamps, flashlights, lit windows; night vision for the heroes who have it; stealth bonus in the dark.
3. **Smarter squads:** enemies that use cover, flank around buildings, breach doors, throw grenades through windows, radio for backup (reinforcement trucks on the roads).
4. **Destructible city:** doors that can be kicked / blown, walls that crumble to rockets (cars that crumple, burn and explode: ✅ v14.1).
5. **Enemy vehicles & traffic (v14.1 follow-up):** enemies that drive — pursuit cars, manned roadblocks, technicals with mounted guns, reinforcement trucks that unload a squad; AI traffic on the interstates; speeder bikes; fast travel between discovered towns.
6. **Vehicle follow-ups:** repair at a garage / fire station bay (re-hang doors and bumpers), mounted weapons (turrets on APCs, the Rhino's storm bolter) crewed by a squad gunner, towing a wreck clear with a truck, two-storey buildings with stairs (roof → upper floor).
7. **Missions on the map:** caches marked by intel, bounties, a Titan lair downtown, capture the city hall.
8. **The v13 list still stands:** dark-side "Fear", ally orders, saber-vs-saber showdowns, Creator part 3, Form-specific Force powers, the rest of the v9.0 roster, DPS telemetry, Memory Purge screen, Proving Ground batch mode.

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
- **v14 city frame:** world px = local px + (CITY.orx, CITY.ory); the drop zone is local (256, 256). Tiles are 16 px (0.5 m), chunks 128 tiles (64 m), render tiles 512 px, macro cells 1 km. Engine hooks patched in `cityplay.js`: `getChunk` / `getNearbyObstacles` (empty in the city), `isPointBlockedByObstacle` (city collision), `isEnemyOnScreen` (adds line of sight), `allocEnemySlot` (walkable spawn + AI reset), `fxOnPlayerShot` (noise), `findInteractTarget` / `triggerWorldInteract` (cars), `threatMult` / `getDistBiome` (districts). `sim.js` asks `stealthEnemyStep` to move city enemies, `cityProjWall` for walls, `cityHoldFire` before firing. `?world=classic|city` overrides the menu toggle (old test suites run with `?world=classic`).
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
- **v14.1 vehicles (`js/vehicles.js`):** `VEH` (`list`, `me`, `camZoom`), `VK` specs, `VSEATS` seat layouts (`d` driver · `w` window · `m` middle · `b` bed · `r` roof gunner — sunroof or hatch · `t` tail, rear-facing), `vehNew(kind, x, y, ang, L, D, o)`, `vehPromoteProp` (key `B.key|pi`) / `vehPromoteFurn` (key `b.uid:f<index>`), `cityRT.used`, `vehQueueRebuild` (rebuilds every chunk a footprint overlaps), `vehDamage(v, lx, ly, dv, type, nx, ny, src)` with types crash / person / bullet / blast / melee / scrape, `vehDetach`, `vehExplode`, `vehEnter` / `vehExit(forced)`, `vehProjHit` (projectiles), `vehNearestStation`. Damage paths in `sim.js` (melee ~L1264, bolts ~L1376) call into it; `cityCircleBlocked` / `cityResolve` are wrapped so live bodies block people.
- **v14.1 convoy (`js/convoy.js`):** `mSeat` / `mBoard` / `mHold` per minion, `convoyMinionStep` (called from `squadMinionsSim`), `convoyHoldPoint`, `convoyOnExit`, `convoyEjectAll`, `CONVOY.vehicles`, `CV_MOUNT_R` = 1400 px.
- **v14.1 access (`js/cityaccess.js`):** `ACC_MOB` (mobility class per hero), `accMob()`, `accEyeHigh()` + `accLOSHigh()` (the `cityLOS` wrapper uses it when the hero's head is above ~2 m obstacles; `cityComputeVis` treats `K_LOWSIGHT` kinds as transparent then), `player.roof`, `accRoofSeen`, ladders `accLadders(b)`, gestures through `executeHeroDash`.
- **v14.1 HUD (`js/hudlayout.js`):** `HUDL_DEF` (id, label, prio, min, hideable), `opts.hud = { auto, scale, order, keep, hide }`, `HUDL.rects`, `HUDL.overlaps`, `HUDL.topH`; fx banners sit below `HUDL.topH`, the stealth pill reads `HUDL.stealthY / stealthS`.
- **Generator determinism rule:** never shuffle with `arr.sort(() => r() - 0.5)` — V8's sort with an inconsistent comparator is not repeatable, which made ~1 % of interiors differ after a block-cache eviction (mismatched chunk seams, invalid furniture keys). Use `cShuffle(r, arr)` (seeded Fisher–Yates) in `citygen.js`.
- **Cache-busting:** every script tag carries `?v=v14.1-2026-10-31`; bump it on each release so GitHub Pages serves fresh files.
- **Testing:**
  - The in-game **Debug All · Proving Ground** covers 14 live actions (v14.1: the squad-regroup and time-rewind checks poll instead of taking a single sample, so they no longer fail on a slow frame).
  - The offline QA suites used for each release (not part of the repo) cover the Form Engine, showdowns, the creator (v12 + v13), Threat Sense, allies and Yoda, all 81 heroes plus the 8 creator presets, and 3-minute soak runs.
