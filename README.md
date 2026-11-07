# Omni-Shift: Nexus Survivors

> **Project flow map — current through `15.4.4-DEFERRED-LOCK`**  
> Runtime/gameplay code is the `15.4.3-LOCKED` build. `15.4.4` is a documented stopping point, not a new gameplay release.  
> **v15 overall: 71% · T21: 50% · next planned series: 15.5.1 (not started).**

This is the GitHub-ready project overview and Mermaid flowchart. GitHub renders the diagrams below directly. Update this file when a feature ships, changes state, or is deferred.

## Status key

| Color | Meaning |
|---|---|
| <span style="color:#1a7f37">🟩 Green</span> | Implemented and shipped at a locked milestone. |
| <span style="color:#9a6700">🟨 Amber</span> | Partial / bounded / shipped with explicit limits. |
| <span style="color:#cf222e">🟥 Red</span> | Future, incomplete, or not yet verified. |
| <span style="color:#8250df">🟪 Purple</span> | Shelved / parked; preserve for a later restart. |
| <span style="color:#0969da">🟦 Blue</span> | Shared runtime or infrastructure flow. |

The diagrams also use Mermaid classes for color. The prose/table legend is retained for viewers that do not render inline styles.

---

## 1. Whole-game flow

```mermaid
flowchart TD
  classDef system fill:#ddf4ff,stroke:#0969da,color:#1f2328,stroke-width:2px;
  classDef shipped fill:#dafbe1,stroke:#1a7f37,color:#1f2328,stroke-width:2px;
  classDef partial fill:#fff8c5,stroke:#9a6700,color:#1f2328,stroke-width:2px;
  classDef future fill:#ffebe9,stroke:#cf222e,color:#1f2328,stroke-width:2px;
  classDef parked fill:#fbefff,stroke:#8250df,color:#1f2328,stroke-width:2px;

  A["index.html: DOM, canvas, HUD shell"] --> B["Ordered JS modules load"]
  B --> C["Boot diagnostics / dynamic EOF scan"]
  C --> D["Load and sanitize saved meta, options, custom hero, career state"]
  D --> E["Main menu"]
  E --> H["Choose hero / roster"]
  E --> HC["Create or edit custom hero #80"]
  E --> W["Choose world / scenario / sector"]
  E --> P["Proving Ground / system checks"]
  E --> M["Shop, codex, options, help, health"]
  HC --> H
  H --> W
  P --> W
  W --> R["startRun: reset run pools and per-run systems"]
  R --> I["Initialize hero, mode, world, hooks, HUD"]
  I --> L["60 FPS requestAnimationFrame loop"]
  L --> S["updateSim: scaled fixed substeps"]
  S --> F["Feature hooks: combat, squads, city, vehicles, careers, rewind, effects"]
  F --> G{"Run continues?"}
  G -->|yes| V["render world, HUD and overlays"]
  V --> L
  G -->|Titan defeated| SEC["Sector clear: rewards / progression / next route"]
  G -->|death or quit| END["Run summary, payout and save"]
  SEC --> E
  END --> E

  class A,B,C,D,E,L,S,F,V system;
  class H,HC,W,R,I,SEC,END shipped;
  class P,M partial;
```

## 2. Simulation and combat pipeline

```mermaid
flowchart TD
  classDef system fill:#ddf4ff,stroke:#0969da,color:#1f2328;
  classDef shipped fill:#dafbe1,stroke:#1a7f37,color:#1f2328;
  classDef partial fill:#fff8c5,stroke:#9a6700,color:#1f2328;
  classDef future fill:#ffebe9,stroke:#cf222e,color:#1f2328;

  T["Frame time / time scale"] --> U["updateSim substeps"]
  U --> IN["Input, movement, dash, collision, hazards"]
  IN --> AIM["Auto-aim and target selection"]
  AIM --> HAND["Hero hand-slot and weapon loop"]
  HAND --> SABER["Saber Form engine: guard → wind-up → cut → recover; swept collision"]
  HAND --> PROJ["Weapons / spells → projectiles, beams, melee effects"]
  HAND --> SPEC["Skills, signature gear, utilities and mobility"]
  SPEC --> SQ["Fireteams and minions update"]
  SQ --> ENEMY["Enemy / civilian / ally / vehicle AI updates"]
  ENEMY --> HIT["Collision, damage, stagger, status and projectile resolution"]
  SABER --> HIT
  PROJ --> HIT
  HIT --> K{"Entity defeated?"}
  K -->|yes| KILL["killEnemy / actor resolution"]
  KILL --> REWARD["XP / orbs / drops / mission facts / kill hooks"]
  REWARD --> LEVEL{"Level threshold?"}
  LEVEL -->|yes| CARD["Pause for level-up: choose 1 of 3"]
  CARD --> U
  LEVEL -->|no| U
  K -->|Titan| CLEAR["Sector clear and Dark Matter payout"]
  K -->|Rival| RIVAL["Rival Showdown / duel state machine"]
  RIVAL --> U
  CLEAR --> END["End-of-sector summary / next sector"]
  U --> THREAT["Threat Sense clocks: rival / Titan ETA, bands and cues"]
  THREAT --> SPAWN["Spawn director uses threat / mode / distance"]
  SPAWN --> ENEMY
  U --> RENDER["Render scene: world, actors, effects, UI hooks"]
  RENDER --> T
  U --> RW["Rewind path when time scale is negative"]
  RW --> RENDER

  class T,U,IN,AIM,HAND,ENEMY,HIT,RENDER system;
  class SABER,PROJ,SPEC,SQ,KILL,REWARD,CARD,THREAT,SPAWN,CLEAR,RIVAL,END shipped;
  class RW partial;
```

### Combat and encounter details

- **Rival Showdown:** rival arrival → challenge/entrance → duel → rival defeat or bounded timeout → normal combat resumes. Crowd spectators are excluded from ordinary targeting; a Titan or later rival waits while the duel is active.
- **Threat Sense:** clocks advance with distance-based threat scaling; cues rise through bands; rival/Titan spawn uses the engine's spawn path. Showdown suspends the ordinary clocks.
- **Force allies:** eligible hostiles can be persuaded/lifted → temporary ally → hunt, escort, expire, or die. Specials exclude protected encounter types; ally lifetime and rewards are bounded.
- **EXECUTE:** staggered eligible target → ready state → finisher → optional queued chain. It does not execute an unstaggered target.
- **Rewind:** recorded run state is interpolated backward within the keyframe window. Echo kills do not pay out; persistent/meta progress follows its own save rules.

---

## 3. World, map, stealth and traffic flow

```mermaid
flowchart LR
  classDef system fill:#ddf4ff,stroke:#0969da,color:#1f2328;
  classDef shipped fill:#dafbe1,stroke:#1a7f37,color:#1f2328;
  classDef partial fill:#fff8c5,stroke:#9a6700,color:#1f2328;
  classDef future fill:#ffebe9,stroke:#cf222e,color:#1f2328;

  CHOOSE["Select world / mode / seed"] --> MODE{"World source"}
  MODE -->|Nexus / classic| CITY["Procedural city or classic arena generator"]
  MODE -->|Homeworld / region| REGION["Region profiles → macro cells → blocks → sites"]
  MODE -->|Real map| REAL["Real-map adapter: local packs or online map source"]
  REAL -->|available| REALGEN["Roads, water, parks, POIs and footprints"]
  REAL -->|unavailable| FALLBACK["Generated fallback and status banner"]
  CITY --> CELL["Cells, roads, lots, buildings, props and spawn records"]
  REGION --> CELL
  REALGEN --> CELL
  FALLBACK --> CELL
  CELL --> INT["Interiors, doors, windows and furniture"]
  CELL --> CHUNK["Streaming chunks and world queries"]
  INT --> CHUNK
  CHUNK --> COLL["Collision, path/ray checks, LOS, roof/fence/access"]
  COLL --> SENSE["Per-hero perception, sound, stealth and awareness"]
  CELL --> TRAFFIC["Traffic lanes, junction controls and live vehicles"]
  TRAFFIC --> VEH["Player vehicle, patrol traffic and dispatch-unit routes"]
  CHUNK --> BAKE["Theme and baked world rendering"]
  BAKE --> FRAME["Frame: static tiles + live actors, doors, traffic, effects"]
  SENSE --> FRAME
  VEH --> FRAME
  FRAME --> PLAY["Combat, missions, exploration and HUD"]

  class CHOOSE,MODE,CITY,REGION,REAL,REALGEN,CELL,INT,CHUNK,COLL,BAKE,FRAME,PLAY system;
  class TRAFFIC,VEH,SENSE shipped;
  class FALLBACK partial;
```

> **Asset boundary:** this source/history package intentionally excludes map payloads and music/audio files. The project code supports generated worlds and asset-backed/online paths, but an offline real-map or full soundtrack experience requires those assets separately.

---

## 4. Mission, career and dispatch flow

```mermaid
flowchart TD
  classDef system fill:#ddf4ff,stroke:#0969da,color:#1f2328;
  classDef shipped fill:#dafbe1,stroke:#1a7f37,color:#1f2328;
  classDef partial fill:#fff8c5,stroke:#9a6700,color:#1f2328;
  classDef future fill:#ffebe9,stroke:#cf222e,color:#1f2328;
  classDef parked fill:#fbefff,stroke:#8250df,color:#1f2328;

  MENU["Menu / simulated-world map"] --> GATE["Release profile and contract mapping"]
  GATE -->|enabled offer| ACCEPT{"Player accepts?"}
  GATE -->|unknown / disabled| HOLD["No new offer; preserve eligible saved state"]
  ACCEPT -->|no| MENU
  ACCEPT -->|yes| JOB["Create durable active-job state"]
  JOB --> ACTORS["Register durable mission actors / checkpoints"]
  ACTORS --> TASKS["Route, interact, transport, investigate or respond"]
  TASKS -->|save / reload / stream out| RESUME["Sanitize and hydrate saved state; restore same actor identities"]
  RESUME --> TASKS
  TASKS -->|complete| FIN["Single finish transaction: facts, pay, progression, history"]
  TASKS -->|withdraw / invalid state| CLOSE["Safe close or fail-closed path; no false career credit"]
  FIN --> MENU
  CLOSE --> MENU

  JOB --> COURIER["J09 courier: supply / priority / medical / distribution shift"]
  COURIER --> CPROG["Five-stage ladder; road-closure reroute; flagship arc"]
  JOB --> WITNESS["J02 witness lead: interview / optional search / escort"]
  WITNESS --> OBS["Confrontation = saved observation, not proof"]
  OBS --> HANDOFF["Optional two-responder guarded handoff"]
  JOB --> PATROL["Player-operated traffic stop: signal → walk-up → lawful choices"]
  PATROL --> BOOK["If eligible: custody walk → station booking"]
  BOOK --> UNIT["Optional dispatched unit / pinned tow / bounded collector"]
  CPROG --> FIN
  HANDOFF --> FIN
  UNIT --> FIN

  class MENU,GATE,HOLD,RESUME,ACTORS,TASKS,OBS,CLOSE system;
  class COURIER,CPROG,WITNESS,HANDOFF,PATROL,BOOK,UNIT,FIN shipped;
  class ACCEPT,JOB partial;
```

**Shipped partial careers are not claims that their parent careers are complete.** J02 witness work and J09 courier calls are active partials; the full J01 patrol career is not complete, despite player-operated patrol/traffic-stop features shipped under T18. Actor durability shipped in 15.3.1; player patrol workflow in 15.3.2; driven dispatch arrival and unit tow flow in 15.3.3.

---

## 5. Fireteam, vehicle and squad-navigation flow (T21)

```mermaid
flowchart TD
  classDef system fill:#ddf4ff,stroke:#0969da,color:#1f2328;
  classDef shipped fill:#dafbe1,stroke:#1a7f37,color:#1f2328;
  classDef partial fill:#fff8c5,stroke:#9a6700,color:#1f2328;
  classDef future fill:#ffebe9,stroke:#cf222e,color:#1f2328;
  classDef parked fill:#fbefff,stroke:#8250df,color:#1f2328;

  ORDER["Player radial order: Hold / Focus / Advance / Regroup"] --> MEMBER{"Member mode / goal"}
  MEMBER -->|vehicle seat available| RIDE["Ride in player vehicle; retain marker/hold for unseated members"]
  MEMBER -->|on foot| AUDIT["4 Hz formation audit resolves targets and mode"]
  AUDIT --> COMBAT{"Combat/chase order?"}
  COMBAT -->|yes| BYPASS["Curb wait/routing bypass; do not pause firefight"]
  COMBAT -->|no| ALLEY{"Walled alley off road?"}
  ALLEY -->|yes| FILE["Compress squad into file; legal slot/dropout fallback"]
  ALLEY -->|no| ROAD{"Live traffic band on path?"}
  ROAD -->|no| DIRECT["Use ordinary straight/path target"]
  ROAD -->|yes| CURB["15.4.1 curb sense: bounded hold, legal curb target, one bounded pin recovery"]
  CURB --> DIAG{"Long diagonal and route wins?"}
  DIAG -->|at least 35% exposure cut and <=1.45x length| HOP["15.4.3 curb-strip route: walk curb, cross once near leader"]
  DIAG -->|no| DIRECT
  HOP --> SLOT["Curb-shifted formation slot; wall legality/buffer rechecked"]
  FILE --> REFORM["Clear corridor for 2 s → reform; bounded per-member flip pin"]
  SLOT --> MOVE["Move targets only; no teleport; final leg returns to curb sense"]
  DIRECT --> MOVE
  REFORM --> MOVE
  BYPASS --> MOVE
  RIDE --> FOLLOW["Vehicle/foot follow and hold markers"]
  MOVE --> FOLLOW
  FOLLOW --> AUDIT

  class ORDER,MEMBER,AUDIT,COMBAT,ALLEY,ROAD,DIAG system;
  class RIDE,FILE,REFORM,CURB,HOP,SLOT,MOVE,BYPASS,FOLLOW shipped;
```

**T21 ledger:** curb sense locked at 15.4.1; alley file-compressed formations locked at 15.4.2; sidewalk-sense long-march routing locked at 15.4.3. T21 is 50% overall: faction-specific pace/interval, cover routing, doors and mount/dismount safety remain future work.

---

## 6. Persistence, save and recovery flow

```mermaid
flowchart LR
  classDef system fill:#ddf4ff,stroke:#0969da,color:#1f2328;
  classDef shipped fill:#dafbe1,stroke:#1a7f37,color:#1f2328;
  classDef partial fill:#fff8c5,stroke:#9a6700,color:#1f2328;
  classDef future fill:#ffebe9,stroke:#cf222e,color:#1f2328;

  BOOT["Boot / load local state"] --> SAN["Validate, sanitize, migrate supported records"]
  SAN --> META["Meta progression, settings, custom hero"]
  SAN --> CAREER["Career/job records and durable actor checkpoints"]
  META --> RUN["Start run: transient pools reset"]
  CAREER --> RUN
  RUN --> CHECK["Checkpoint active mission / actor identity / run state as supported"]
  CHECK --> WRITE{"Storage write succeeds?"}
  WRITE -->|yes| SAVED["Continue; reload can restore checkpoint"]
  WRITE -->|no| WARN["Report save failure; preserve last known valid data where possible"]
  SAVED --> LOAD["Reload / stream actor out and back in"]
  LOAD --> SAN
  WARN --> RETRY["Retry / export backup / restore prior data"]
  RETRY --> SAN
  SAVED --> PAY["Completion transaction: facts + reward + progression"]
  PAY --> META
  BACKUP["Manual JSON backup / restore controls"] -.-> META
  CLOUD["Cloud sync / guaranteed multi-device recovery"]:::future

  class BOOT,SAN,RUN,CHECK,WRITE,LOAD,WARN,RETRY system;
  class META,CAREER,SAVED,PAY,BACKUP shipped;
  class CLOUD future;
```

Persistence is browser-local and fail-closed in tested paths; this diagram does **not** claim cloud backup, guaranteed recovery from device/browser loss, or physical-device coverage.

---

## 7. Roadmap and deferred scope

### Career reservations J01–J15

```mermaid
flowchart LR
  classDef partial fill:#fff8c5,stroke:#9a6700,color:#1f2328;
  classDef future fill:#ffebe9,stroke:#cf222e,color:#1f2328;
  classDef shipped fill:#dafbe1,stroke:#1a7f37,color:#1f2328;

  J01["J01 Patrol career"]:::future
  J02["J02 Detective: witness partial shipped; broader career future"]:::partial
  J03["J03 Tactical response"]:::future
  J04["J04 Firefighter"]:::future
  J05["J05 Paramedic"]:::future
  J06["J06 Search and rescue"]:::future
  J07["J07 Rescue pilot"]:::future
  J08["J08 Mechanic / tow career"]:::future
  J09["J09 Courier: calls and five-stage path partial shipped"]:::partial
  J10["J10 Bounty hunter"]:::future
  J11["J11 Security"]:::future
  J12["J12 Criminal crew"]:::future
  J13["J13 Smuggler"]:::future
  J14["J14 Mercenary"]:::future
  J15["J15 Universe-specific career profiles"]:::future
```

### Shared systems T16–T31

```mermaid
flowchart TD
  classDef partial fill:#fff8c5,stroke:#9a6700,color:#1f2328;
  classDef future fill:#ffebe9,stroke:#cf222e,color:#1f2328;
  classDef parked fill:#fbefff,stroke:#8250df,color:#1f2328;
  classDef shipped fill:#dafbe1,stroke:#1a7f37,color:#1f2328;

  T16["T16 Job selection / dispatch / save-safe incidents: shared pieces shipped; full scope open"]:::partial
  T17["T17 Career progression / living-world consequences: partial"]:::partial
  T18["T18 Police / logistics: patrol stop, actor call unit and unit tow shipped; pursuit / multi-unit work future"]:::partial
  T19["T19 Actor identity: durable in-session records shipped; long-term memory future"]:::partial
  T20["T20 Shot awareness / civilian safety: partial shared systems"]:::partial
  T21["T21 Squad navigation: 15.4.1–15.4.3 shipped; 50%; remaining tactics future"]:::partial
  T22["T22 Convoy safety/recovery: partial; overflow/parking/recovery limits remain"]:::partial
  T23["T23 Material-aware destruction and repair"]:::future
  T24["T24 Generated-world scale and migration"]:::future
  T25["T25 Flight and character-specific abilities: existing flight; broader scope partial"]:::partial
  T26["T26 Touch driving, cruise and tire behavior: partial"]:::partial
  T27["T27 Saves, backup and older-feature compatibility: partial"]:::partial
  T28["T28 Accessibility and browser/device coverage: partial"]:::partial
  T29["T29 Performance and intermittent vehicle travel: partial"]:::partial
  T30["T30 Full regression / acceptance gates: open"]:::future
  T31["T31 Assets, merged-site verification and final v15 release: open"]:::future
  NOW["Current stop: 15.4.4-DEFERRED-LOCK; v15=71%, T21=50%"]:::parked
  NEXT["15.4.4 hardening and 15.4.5 integration are shelved; 15.5.1 not started"]:::parked
  NOW --> NEXT
```

### Current ratchet stop

```mermaid
flowchart LR
  classDef shipped fill:#dafbe1,stroke:#1a7f37,color:#1f2328;
  classDef parked fill:#fbefff,stroke:#8250df,color:#1f2328;
  classDef future fill:#ffebe9,stroke:#cf222e,color:#1f2328;

  A["15.4.1-LOCKED: curb sense"]:::shipped --> B["15.4.2-LOCKED: alley file formation"]:::shipped
  B --> C["15.4.3-LOCKED: sidewalk-sense march routes"]:::shipped
  C --> D["15.4.4-DEFERRED-LOCK: hardening shelved"]:::parked
  D --> E["15.4.5 integration ceremony: shelved; v15 stays 71%"]:::parked
  E -. "resume only with explicit approval" .-> F["15.5.1 next series; not started"]:::future
```

## Current lock facts

- **HEAD/tag:** `15.4.4-DEFERRED-LOCK` (`aba6f94`). This README is a new uncommitted documentation file, ready to add at the repository root.
- **Runtime:** gameplay source remains `15.4.3-LOCKED`; the 15.4.4 stop commit is documentation/ledger state, not a new gameplay feature release.
- **Metrics:** v15 overall **71%**; T21 **50%**. Do not raise the v15 figure until the deferred 15.4.5 integration lock is explicitly resumed and completed.
- **Recent shipped QA:** 15.4.3 sidewalk-march fixture 6/6 ×2; 15.4.2 formation fixture 7/7; 15.4.1 curb fixture 6/6; pack 240/240; gauntlet 19/19. These are historical lock results, not a new test run caused by this README.
- **Shelved queue:** rerun run1541/42/43, pack and gauntlet on resume; consolidate SQSIDE counters into a smoke assertion; then the 15.4.5 integration ceremony.
- **Release constraints:** no new mechanics in 15.4 without renewed approval; do not mark deferred items green or equate an estimate with test coverage.

## Source-of-truth files

- `js/` — runtime modules; `index.html` — ordered script entry point.
- `CHANGELOG_v15.md` — lock-by-lock implementation and QA history.
- `RELEASE_SCOPE_v15.md` — shipped behavior and boundaries.
- `DEFERRED_FEATURES_v15.md` — J/T backlog and current deferrals.
- `CHRONO_LATTICE_RATCHET_LEDGER_v15.md` — ratchet operating/decision ledger.
- `qa/NEXT_STATE.md` — exact shelved resume queue and current stop.
- `flowchart.md` and `info.md` are older v14.2 design references; this README is the current high-level flow map. Update it together with the ledgers when state changes.
