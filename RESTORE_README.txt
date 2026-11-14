OMNI-SHIFT: NEXUS SURVIVORS — MINIMAL GITHUB PAGES RESTORE

This archive contains the game entry page and all local CSS/JavaScript files
referenced by that page, plus GitHub Pages' .nojekyll marker. There is no build
step or package installation: extract the contents directly into the repository
root and publish that root with GitHub Pages.

This archive deliberately omits map datasets and music files, as requested.
The built-in offline real-map index/packs are not included; real-map lookup or
online map features may need an internet connection and external services. The
20 soundtrack files are not included, so those tracks will not be available.
Generated game worlds and gameplay code are included. This does not include
QA scripts, development tools, roadmap documents, or prior-history reports.

SOURCE NOTE: built from the isolated 16.0 staging copy of the uploaded revision,
not from a clean public release. It includes the staged Coding Progression &
Methodology help panel and other documented local changes. The uploaded 121-entry
SHA256SUMS baseline has eight known staged differences; no claim of exact public
GitHub parity is made. See the Step 20 final regression/release-gate report in
Arena's QA workspace for the eight filenames and release limits.

RESTORE STEPS
1. Extract this ZIP so index.html is at the repository root (not inside an extra
   nested folder).
2. Upload/commit the extracted files to the repository's publishing branch/root.
3. Enable GitHub Pages for that branch/root if it is not already configured.
4. Open the published site over HTTPS. Do not open index.html with file://; the
   game's startup diagnostics and some data fetches require an HTTP origin.

RESTORE_SHA256SUMS.txt checks the runtime files and this README. Re-run hashes
after transfer if you want to verify the extracted copy.
