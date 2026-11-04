# Omni-Shift Nexus Survivors — v11 "Lightsaber Forms & Soundtrack"

Base: `bac8b41` (v10, live). Branch: `v11`.
Deliverables:
- `omni-shift-v11.zip`: the code, laid out like the repo.
- `omni-shift-v11-music.zip`: the 17 new tracks plus credits.
- `v11.patch`: the code changes.

---

## 0. "Did we add anything, and is anything left?"

### Added in v10 (already live)
- **v9.01 fixes a–h:**
  - Close-range blade immunity.
  - The 85 px defensive blade arc. v11 replaces it — see §1.
  - Missile fire/smoke trails.
  - Mandalorian Whistling Birds.
  - Temporal ladder and rewind.
  - Seed-locked corpse faces/helmets.
  - Relic drops.
  - The music button no longer covers the HUD.
- **Roadmap A–E:**
  - A. Debug-All Proving Ground.
  - B. Squad radial wheel.
  - C. Adaptive biomes and hazards.
  - D. Glory kills.
  - E. Galactic Expedition map.
- **Polish:** kill streaks, brass casings, explosion smoke/shake, hit-stop and boss cinematics.

### Added in v11 (this update)
- The Lightsaber Form Engine (§1).
- 17 new soundtrack tracks (§2).
- Stowed saber hilts and ignite/retract. This item was on the v10 "left to add" list.

### Still left to add (nothing below is broken; these are open ideas)
- **The rest of the info.md v9.0 roster wish-list:** Die Hard, Hitman, Léon, Heat, SWAT/Tank, Waters #34 rework, Ninja, Sam Fisher, Avengers, Thanos, TimeShift, and the custom hero slot #80.
- **Not built yet:**
  - The `#scrPurge` screen.
  - Predator active cloak.
  - Independent twin-gun tracking.
  - A DPS matrix screen.
- **Limits of existing features:**
  - Rewind covers about the last 39–40 s.
  - The squad co-gunner is generic rather than hero-specific.
  - The Gotham theme went to John Wick #51 (Batman has no dedicated theme).
  - The Proving Ground tests only the selected hero.
- **New ideas this update suggests:**
  - Saber-vs-saber duels against rival Sith bosses (blade locks and clashes).
  - Form-specific Force powers (Soresu "Circle of Shelter" bubble, Niman "Force Push" wave).
  - Showing the MUSIC_CREDITS on a credits screen.

---

## 1. Lightsaber Form Engine (`js/saberforms.js`, new, ~1,060 lines)

### Why the blades "spun crazily"
v9.01/v10 drove every blade with a sine-wave flourish. On top of that, three things made it spin:
- **The 85 px trigger:** as soon as any enemy came within 85 px, a blend (`player.defSweep`) spun the blade a full 360° at 14.5 rad/s. In a horde that was all the time.
- **Continuous wrist spin:** patterns 3 (Ataru) and 7 (saberstaff) also added a wrist spin that never stopped.
- **Yoda:** he hopped and orbited constantly.

The blade never aimed at anyone. It simply rotated through whatever was nearby.

### What replaces it
Each blade now runs a **state machine**:

> **guard** (the Form's stance) → **wind-up** (tracks a real target) → **strike** (committed cut, eased like a real swing) → **follow-through / recover** → chain into the next cut, or settle back into guard.

- **Targets:** the blade picks an actual enemy in reach and cuts **toward it**. Combos flow forehand → backhand, so the blade moves back and forth instead of round and round. With several blades, each one claims a different target.
- **Lunge:** the body steps into each strike (5–22 px, depending on the move) and springs back.
- **Collision:** hits are swept along the actual drawn arc, so the hitbox is exactly what you see. Overheads split enemies vertically, thrusts run them through (the corpse stays intact), and side cuts sever limbs.
- **Weight:**
  - Falling Avalanche overheads add an impact ring, knockback, a brief hit-stop and screen shake.
  - Every hit throws sparks and a sizzle.
  - Each swing makes a whoosh whose pitch follows the blade speed, and the saber hums continuously.
- **Grazes:** a lit blade that brushes an enemy between strikes burns them a little. A graze has its own timer, so it can never use up the hit window of the real cut that follows.
- **Spins are earned:** a twirl (Sarlacc Sweep, Ataru aerial spin, saberstaff twirl) only happens when you are genuinely surrounded, and is on a cooldown. Otherwise the combo plays a diagonal cut instead.
- **Ignition:**
  - The saber ignites with a snap-hiss when enemies close in (within 260 px, or a bolt within 200 px).
  - After 3 s with nothing near, it retracts and the hilt clips back onto the belt.
  - The first ignition of each run shows a Form banner.
- **Visuals:**
  - Motion trail drawn on strikes.
  - Two-handed grip for Djem So, Shii-Cho and Ataru.
  - The free hand matches the Form: extended for Soresu, raised behind for Makashi, a clenched fist for Vader.
  - The blade length matches its hitbox.
  - Non-orbit melee weapons (whip, beam and cone blades) used to be drawn as guns; they are now drawn as blades.

### The seven Forms (researched from canon and Legends sources)

| Form | How it fights in-game | Film reference |
|---|---|---|
| **I Shii-Cho** (Way of the Sarlacc) | Wide two-handed sweeps; a *Sarlacc Sweep* spin only when 4+ foes surround you | Luke in A New Hope |
| **II Makashi** (Ysalamiri) | One-handed garde, lunging thrusts and quick cuts; riposte after a parry | Dooku; Grievous (taught by Dooku) |
| **III Soresu** (Mynock) | Tight near-body guard, quick economical cuts, the strongest deflect, riposte | Obi-Wan; early Mace and Yoda |
| **IV Ataru** (Hawk-Bat) | *Hawk-Bat Swoop* leap at foes just out of reach (hop + flip), *Saber Swarm* three-cut flurries | Yoda vs. Dooku; Qui-Gon; Padawan Anakin |
| **V Shien / Djem So** (Krayt Dragon) | Shien redirects bolts **at the shooter**. Djem So adds heavy cuts, the *Falling Avalanche* overhead and *Fluid Riposte* | Luke in ROTJ; Anakin/Vader; Mace on Geonosis |
| **VI Niman** (Rancor) | Balanced cuts, *Pushing Slash* (Force shove), *Draw Closer* (Force-pull a foe onto the blade). Jar'Kai is the multi-blade version | Palpatine as Chancellor; Grievous |
| **VII Juyo / Vaapad** (Vornskr) | Erratic staccato bursts of 3–5 unconnected-looking cuts, plus the *Assured Strike* thrust on elites. Vaapad also redirects bolts | Maul, Sidious, Mace (ROTS) |

### Film-accurate progression (the Form changes as the saber levels up)

| Hero | Early → … → Prime |
|---|---|
| **Luke** | Lv1 Shii-Cho (*A New Hope*) → Lv3 Ataru (*ESB*, Dagobah) → Lv5 raw Djem So (*ESB*, Cloud City) → **Lv7 Djem So (*Return of the Jedi*)** |
| **Anakin / Vader** | Lv1 Ataru (*AOTC* Padawan) → Lv3 Djem So (*ROTS*) → Lv5 Dark Lord Djem So (*ESB*) → **Lv7 Hallway (*Rogue One*)** |
| **Darth Maul** | Lv1 Juyo with one blade lit (*TPM*, Tatooine) → Lv3 saberstaff Ataru; the second blade ignites at the Duel of the Fates → **Lv6 saberstaff Juyo (*TCW*, Mandalore)** |
| **Mace Windu** | Lv1 Soresu (*TPM*) → Lv4 Shien (*AOTC*, Geonosis) → **Lv7 Vaapad (*ROTS*)** |
| **Yoda** | Lv1 Soresu (*TPM*) → Lv4 Ataru (*AOTC* vs. Dooku) → **Lv7 Grand Master Ataru (*ROTS*, Senate duel)** |
| **Darth Sidious** | Lv1 Niman (*AOTC* Chancellor) → Lv4 Sith Ataru (*ROTS* office ambush) → **Lv7 Juyo** |
| **General Grievous** | Lv1 twin-blade Makashi (*TCW*, 2 sabers) → Lv4 Jar'Kai (4 sabers, one per free hand) → **Lv7 Utapau buzzsaw** (arms spin up when crowded) |

How progression is shown in-game:
- A **"FORM IV · ATARU"** banner appears whenever the saber levels into a new Form. A prime Form gets a big banner.
- The HUD stance line shows the current Form and film.
- The level-up card previews the next Form ("FORM EVOLUTION: …").

Other sword heroes use the same engine with their own stance names: Geralt, River, Worf, Master Chief, the Doom Slayer, the Astartes, Gandalf, Paul, the Sardaukar and others. Each is mapped onto the matching Form, gets faster with each career tier, and uses steel blades with steel sounds where appropriate.

### Deflection, finishers and the fail-safe
- **Deflection:**
  - Every blocked bolt plays a parry pose, sparks and a clash sound.
  - Shien, Djem So and Vaapad send the bolt **straight back at a shooter**: speed ×1.08, damage ×1.15, measured aim error 0.00 rad.
  - Soresu, Makashi and Djem So follow a parry with a riposte.
  - Each Form changes the deflect chance (Soresu +15 %, Shien +12 %, Ataru −4 %, and so on).
- **Glory kills:** a saber glory kill now plays the Form's own finisher instead of a generic whirlwind:
  - Djem So / Ataru: Falling Avalanche overhead, split vertically.
  - Makashi: running thrust, intact corpse.
  - Juyo / Jar'Kai: spin cut at the waist.
  - Shii-Cho / Soresu / Shien / Niman: diagonal cut.
- **Fail-safe:** if the engine ever throws an error, it switches itself off for the session and the old flourish takes over, without the spin. The game never breaks.

### Balance (measured against the v10 build, same seeds)
- **Damage to a stationary boss over 6 s:** ×0.73–1.63 of v10 across 33 hero/level combinations, mostly ×1.0–1.4. Prime Forms come out between ×1.05 and ×1.63.
- **Horde kills in 8 s:** the same as v10 or slightly better.
- **Per-Form tuning:** each Form has its own damage multiplier, so the power Forms (Djem So, Jar'Kai, Niman) hit bosses harder and the acrobatic Forms rely on speed instead.

---

## 2. Soundtrack (17 new tracks → 20 in total)

### Your tracks, evaluated
- **The originals:**
  - `track_1_Electronic_Star_Birth.mp3` (Pecan Pie, 2:13)
  - `track_2_Synthwave_Hello_World.mp3` (Moire, 2:48)
  - `track_3_Beats_Darkstar.mp3` (Danijel Zambo, 2:20)
- **Format:** all three are 320 kbps / 44.1 kHz stereo. Loudness is −9.1, −10.5 and −13.7 LUFS respectively.
- **Style:** energetic electronic, synthwave and beat-driven tracks.
- **Naming standard:** `track_<Number>_<Genre>_<Song_Name>.mp3`. The player reads the number, genre and title from the file name, and the genre filter chips are built from the genre token.

### The 17 new tracks
All come from OpenGameArt.org and are royalty-free for any use: 14 are CC0 and 3 are CC-BY.

| # | File | Artist | License |
|---|---|---|---|
| 4 | `track_4_Synthwave_Midnight_Drive.mp3` | congusbongus | CC0 |
| 5 | `track_5_Electro_Orbital_Colossus.mp3` | Matthew Pablo | **CC-BY 3.0** |
| 6 | `track_6_DnB_Black_Diamond.mp3` | Joth | CC0 |
| 7 | `track_7_Retrowave_Brave_Space_Explorers.mp3` | Alexandr Zhelanov | **CC-BY 4.0** |
| 8 | `track_8_Cyberpunk_System_Overload.mp3` | Tricks & Traps | CC0 |
| 9 | `track_9_Orchestral_Battle_Theme_A.mp3` | cynicmusic | CC0 |
| 10 | `track_10_Dubstep_The_9th_Circle.mp3` | Joth | CC0 |
| 11 | `track_11_Darksynth_Mist_City.mp3` | Section7 | **CC-BY 4.0** |
| 12 | `track_12_Techno_Tower_Defense_Theme.mp3` | DST | CC0 |
| 13 | `track_13_Electronic_Cyberpunk_Moonlight_Sonata.mp3` | Joth | CC0 |
| 14 | `track_14_Beats_Space_Bass.mp3` | Fupi | CC0 |
| 15 | `track_15_Cinematic_Epic_Boss_Battle.mp3` | Juhani Junkala | CC0 |
| 16 | `track_16_Synthwave_Space_City.mp3` | MintoDog | CC0 |
| 17 | `track_17_Breakbeat_Lucid_Trigger.mp3` | Liq_mmry | CC0 |
| 18 | `track_18_Metal_Megasong.mp3` | Emma_MA | CC0 |
| 19 | `track_19_Jungle_Final_Hour.mp3` | isaiah658 | CC0 |
| 20 | `track_20_Electronic_The_Rush.mp3` | tebruno99 | CC0 |

- **Processing:**
  - Encoded as MP3 128 kbps, 44.1 kHz stereo.
  - Loudness-matched to about −12 LUFS (≤ −1 dBTP) so the volume sits evenly next to your tracks.
  - A 4 s fade-out was added, because many of the sources are seamless game loops that would otherwise stop dead.
  - Each file has clean ID3 tags.
- **`CUSTOM_TRACK_LIST`** in `js/chaos.js` lists all 20 files **exactly** as they are named in `music/`. The test suite checks this file by file.
- **Credits:**
  - `music/MUSIC_CREDITS.md` gives title, artist, license and source link for every track.
  - The now-playing pop-up shows "by Artist · License".
  - Hovering a track in the 🎵 player list shows its full credit.
  - The three CC-BY tracks need this credit kept with the game; it is already in place.

---

## 3. Files changed
- `js/saberforms.js` (new): the Form engine, Form data, progression paths, collision, trails, audio and finishers.
- `js/sim.js`:
  - `bladeHitEnemy` has hit kinds (graze / cut / heavy / thrust / flurry).
  - The engine hooks into the blade loop.
  - The 360° defensive spin is removed.
  - The Yoda hop/orbit is skipped while the engine runs.
  - Form deflect bonus plus the `saberOnDeflect` hook.
- `js/combat.js`: engine-owned melee weapons skip the old swing/hop.
- `js/render.js`:
  - Exact blade length, retracted hilt and plasma glow in `drawWeaponModel`.
  - `drawSaberFormSlot` / `drawSaberBladePose`: trails, grips, off-hand poses, belt hilts and Grievous' extra blades.
  - The player sprite follows the lunge.
- `js/glory.js`: Form finishers and cut angles.
- `js/rewind.js`: rewinds the lunge offset (`sfLX` / `sfLY`) instead of the removed spin variables (`defSweep` / `defSpin`).
- `js/proving.js`: the "Close-Quarters Blade" test.
- `js/ui.js`:
  - The level-up card previews the next Form.
  - The new script is included in the integrity checks.
- `js/chaos.js`: `CUSTOM_TRACK_LIST` now has 20 tracks; adds `TRACK_CREDITS` and the credit line in the toast and track list.
- `index.html`: v11 cache-busting, the new script tag and the "NEW IN v11" help box.
- `music/MUSIC_CREDITS.md` (new) and `music/track_4 … track_20` (new; in the music zip).

## 4. Tests
- **`qa/verify_v11.py`: 10/10.** It checks:
  - Form progression for all 7 saber heroes.
  - Each prime Form's repertoire with no blind spinning.
  - Parry and redirect to the shooter.
  - Ignite/retract.
  - The Form banner.
  - The saber glory finisher.
  - Grievous' 2/4 blades and the hand limit.
  - A render smoke test over 12 heroes.
  - The engine fail-safe.
  - The soundtrack: names, discovery, decoding, genres and credits.
- **`verify_v10.py`: 14/14.**
  - V02 is rewritten for v11: foes behind, below and above you are cut down by deliberate strikes, there are 0 legacy spin variables, and the blade settles back to guard.
  - V09 (the real-time Proving Ground) failed one action on one run and passed 36/36 on rerun. The v10 build behaves the same, so this is timing sensitivity, not a regression.
- **`verify_fixes.py`: 20/20.**
- **Sweep and soak:** see the bottom of this file.

## 5. Uploading (GitHub web UI)
1. **Code:** unzip `omni-shift-v11.zip`. In the repo, use **Add file → Upload files** and drag in `index.html`, the `js/` folder and the `music/` folder (which holds `MUSIC_CREDITS.md`). Commit.
2. **Music:** unzip `omni-shift-v11-music.zip`. Open the repo's `music/` folder, choose **Add file → Upload files**, drag in all 17 `track_*.mp3` files (about 43 MB in total, the largest 3.6 MB) and commit.
3. **Alternative:** run `git apply v11.patch` on `main`, then copy the MP3s into `music/`.

If the music upload is skipped, the game still works. The player simply skips files that are listed but missing.

### Sweep and soak results (run on the final v11 build)
- **`sweep_v10.py`, all 80 heroes × 40 s:** 0 heroes with problems. No errors, no page errors, every boss reached. Average sim step 0.2–0.4 ms.
- **`soak_v10.py` (Luke, Grievous, Maul, Yoda; about 3 game-minutes each):**
  - Levels 11–18, with 678–930 kills each.
  - Nothing got stuck.
  - Rewind worked (38.5 s rewound).
  - Pools stayed bounded.
  - Heap stayed around 36–38 MB.
  - No errors.
