# Current project flowchart — 15.6.6

These diagrams describe the current static game architecture at `15.6.6-LOCKED`. The map and music data payloads are intentionally external to this snapshot; their loaders/runtime code remain in `js/`.

## Browser boot and play loop

```mermaid
flowchart TD
  A[Open index.html] --> B[Load inline shell and CSS]
  B --> C[Load ordered JavaScript modules from js/]
  C --> D{Required scripts loaded?}
  D -- no --> E[Show loader/debug error; check path and cache key]
  D -- yes --> F[Initialize saved profile and hero roster]
  F --> G[Main menu]
  G --> H[Select world / scenario / optional job]
  H --> I[Start run and initialize world]
  I --> J[60 FPS simulation and rendering loop]
  J --> K[Input, movement, combat, vehicles, NPCs, mission hooks]
  K --> J
  J --> L[Run end, save/history updates, return to menu]
```

## Optional job / incident lifecycle

```mermaid
flowchart TD
  A[Player is in an eligible world and state] --> B[Check release profile and per-job feature gate]
  B -->|off / unavailable| C[Do not offer job; preserve any saved job]
  B -->|enabled| D[Offer a mapped contract]
  D --> E{Accept?}
  E -->|decline| F[Return to play; no forced assignment]
  E -->|accept| G[Validate route, site, actors and fallback]
  G -->|invalid| H[Pause/refuse honestly or choose validated fallback]
  G -->|valid| I[Create/recover durable incident checkpoint]
  I --> J[Career-specific module and existing world systems]
  J --> K[Outcome: clean, partial, escaped, withdrawn, etc.]
  K --> L[Save-safe debrief / one-time payout / eligible career credit]
  L --> M[Continue, go off duty, or return to play]
  I --> N[Save/reload restores the same incident and actors]
  N --> J
```

Current career modules include patrol, detective, firefighter, tactical response, EMT, courier, and shared dispatch/routing systems. In 15.6.6, scene/POI detective features are enabled while parent J02 remains off; J05 EMT is enabled.

## World and content paths

```mermaid
flowchart LR
  A[World selection] --> B{World mode}
  B -->|generated city| C[citygen / cityworld / cityplay]
  B -->|real map| D[realui / realdata / realgen]
  D --> E[Existing local map packs, if present]
  D --> F[Online map source when available]
  B -->|classic / campaign| G[world and scenario modules]
  C --> H[Shared simulation, NPCs, jobs and rendering]
  E --> H
  F --> H
  G --> H
  H --> I[Audio player loads existing music assets]
```
