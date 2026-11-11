# Current revision notes

- **Revision:** 15.6.6-LOCKED; series tag `15.6-SERIES-LOCKED`.
- **Source commit:** `aa5f7ee29c4eb71afe58be400be680f7a4ee9d9a`.
- **Series score:** 92% (fixed-weight v15; not a deployment or release-certification score).
- **Committed-tree verification:** 482/482 selected tests passed, with no failures or deferred cases; the served-source manifest matched the tested tree.
- **Performance guard:** each performance assertion used the MI-1 loadavg(1)/CPU-count <= 0.7 precondition. Over-limit attempts were recorded as DEFERRED, neither pass nor failure; process-tree CPU-normalized metrics remain unvalidated and non-gating.
- **J02:** J02A–H passed 8/8; unchanged witness regressions 24/24; detective ladder 6/6; supplemental J02G/H 2/2. `J02.SCENE` and `J02.POI` are on; parent J02 stays off. Observations and allegations are not proof of guilt.
- **J05 EMT:** `js/jobemt.js` is included, with `J05.EMT` enabled in the release profile.
- **Preserved boundaries:** S10/R20 remain intentional omissions, neither pass nor failure. Trunks remains PARTIAL and OPEN. Strike record remains 2/3; T26 70%, T21 50%, T22 24%.
- **Next major:** planning is named 16.0; this snapshot contains no 16.0 implementation.

The QA runner, test packs, archives, and recovery bundle are intentionally not included in this playable-game snapshot. They are development/verification materials, not runtime dependencies.
