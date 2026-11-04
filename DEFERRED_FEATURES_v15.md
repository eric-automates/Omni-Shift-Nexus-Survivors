# CHRONO-LATTICE RATCHET LEDGER — stable deferred-item index

The IDs below preserve the original larger v15 scope under the CHRONO-LATTICE RATCHET LEDGER. The former 31-item / ten-pass execution loop is terminated: stabilize 15.0.1–15.0.8, evaluate `v15.0.99-OMEGA`, then develop shelved items in 15.1+. These are roadmap targets, not completion claims. Estimated percentages are engineering judgments for that original full item, not test coverage or release-readiness scores. Disabling a feature does not mean it is complete. Current full-scope estimates are tracked in `/home/user/V15_STABLE_TASK_TRACKER.md`. See `RELEASE_SCOPE_v15.md` for exact current profile, saved-job behavior, restore steps, known shared defects and asset limits. Update this index in each future revision; never reuse IDs.

J01–J15 are controlled as build-time career ID reservations in `js/releaseprofile.js`; only J02/J09 currently map to implemented new dispatch entry points. The optional `J02.WITNESS`, `J09.SUPPLY`, `J09.PRIORITY`, `J09.MEDICAL`, `J09.MEDICAL_CONTACT` and `J09.SHIFT` are enabled independently; `T22.MULTI_VEHICLE_CONVOY` is temporarily disabled by a separate reversible switch. Other T16–T31 shared features are NOT switched off wholesale. Shared older features, safety behavior and bug fixes stay live. A plan item being incomplete does not mean every bit of its older functionality is absent.

| ID | Original item | Reduced-profile state | Historical report 33 estimate |
|---|---|---|---:|
| J01 | Patrol officer: stop and search | Not implemented / not exposed | 10% |
| J02 | Detective: missing witness | Witness investigation enabled as a limited call; full detective career deferred | 24% |
| J03 | Tactical response: barricade | Not implemented / not exposed | 0% |
| J04 | Firefighter: structure fire and rescue | Not implemented / not exposed | 0% |
| J05 | Paramedic: multi-vehicle incident | Not implemented / not exposed | 0% |
| J06 | Search and rescue: storm search | Not implemented / not exposed | 0% |
| J07 | Rescue pilot: emergency airlift | Not implemented / not exposed | 0% |
| J08 | Mechanic/tow: road rescue | Not implemented / not exposed | 0% |
| J09 | Courier: important delivery | Supply, priority, medical calls and distribution shift enabled as candidates; full career and other calls deferred | 59% |
| J10 | Lawful bounty hunter: bring them in | Not implemented / not exposed | 0% |
| J11 | Security: protect the transfer | Not implemented / not exposed | 0% |
| J12 | Criminal crew: planned heist | Not implemented / not exposed | 0% |
| J13 | Smuggler: hot cargo | Not implemented / not exposed | 0% |
| J14 | Mercenary: contract with a twist | Not implemented / not exposed | 0% |
| J15 | Universe-specific career profiles | Not implemented / not exposed | 0% |
| T16 | Job selection, dispatch and save-safe incident engine | Shared functionality remains enabled; original full scope deferred | 52% |
| T17 | Career progression and living-world consequences | Shared functionality remains enabled; original full scope deferred | 11% |
| T18 | Police escalation, player patrol and logistics | Shared functionality remains enabled; original full scope deferred | 28% |
| T19 | Actor identity, witnesses and accountability | Shared functionality remains enabled; original full scope deferred | 32% |
| T20 | Shot awareness, civilian safety and uncertainty | Shared functionality remains enabled; original full scope deferred | 57% |
| T21 | Squad and faction-specific tactics/navigation | Shared functionality remains enabled; original full scope deferred | 25% |
| T22 | Convoy safety and recovery | Overflow AI vehicles disabled; player-car riders and marked holds remain | 24% |
| T23 | Material-aware destruction and repair | Shared functionality remains enabled; original full scope deferred | 5% |
| T24 | Generated-world scale and migration | Shared functionality remains enabled; original full scope deferred | 17% |
| T25 | Flight and character-specific abilities | Shared functionality remains enabled; original full scope deferred | 67% |
| T26 | Touch driving, cruise and tire behavior | Shared functionality remains enabled; original full scope deferred | 70% |
| T27 | Saves, backup and older-feature compatibility | Shared functionality remains enabled; original full scope deferred | 71% |
| T28 | Touch, accessibility and browser/device coverage | Shared functionality remains enabled; original full scope deferred | 62% |
| T29 | Performance and intermittent vehicle travel | Shared functionality remains enabled; original full scope deferred | 35% |
| T30 | Current whole-game regression and acceptance gates | Testing/release work remains open | 21% |
| T31 | Assets, merged-site verification and final v15 release | Testing/release work remains open | 38% |
