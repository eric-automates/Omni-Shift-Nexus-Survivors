// FILE: js/savebackup.js
// PART: v15 — portable progress backup
// DETAIL: Explicit user-triggered export/import of existing progress only.
// This is not a full world-state save, an automatic cloud backup, or an
// atomic multi-key transaction. Options and active-run state stay separate.
"use strict";

const BACKUP_FORMAT = "omni-progress-backup-v1";
const BACKUP_RECOVERY_KEY = META_KEY + "_PREIMPORT_V1";
const BACKUP_LIMIT = 8 * 1024 * 1024;
function backupValidate(text) {
  if (typeof text !== "string" || text.length > BACKUP_LIMIT || new Blob([text]).size > BACKUP_LIMIT) return { ok: false, why: "File is too large or unreadable." };
  let box; try { box = JSON.parse(text); } catch (_) { return { ok: false, why: "This is not valid JSON." }; }
  const p = box && box.progress;
  if (!box || box.format !== BACKUP_FORMAT || !p || typeof p !== "object" || Array.isArray(p)) return { ok: false, why: "Not a supported Omni-Shift progress backup." };
  // Old saves can omit fields. Known fields must have usable shapes. Unknown
  // fields are retained unchanged for forwards compatibility.
  for (const k of ["chars", "stages", "cleared", "ranks"]) if (k in p && (!Array.isArray(p[k]) || p[k].some(n => !Number.isSafeInteger(n) || n < 0))) return { ok: false, why: "Invalid progress list: " + k + "." };
  for (const k of ["dmEarned", "dmSpent", "wallet", "selChar", "selStage", "diff"]) if (k in p && (typeof p[k] !== "number" || !Number.isFinite(p[k]) || p[k] < 0)) return { ok: false, why: "Invalid progress value: " + k + "." };
  if (!Array.isArray(p.chars) || !Array.isArray(p.stages) || !Array.isArray(p.ranks) || p.ranks.length < 10) return { ok: false, why: "Missing progress fields." };
  return { ok: true, raw: JSON.stringify(p) };
}
function backupCurrentText() {
  if (SAVE_WARNING.unreadable.has("progress")) return { ok: false, why: "The stored progress could not be read. Use DOWNLOAD UNREADABLE DATA in the warning instead." };
  try {
    const text = JSON.stringify({ format: BACKUP_FORMAT, progress: meta });
    if (text.length > BACKUP_LIMIT || new Blob([text]).size > BACKUP_LIMIT) return { ok: false, why: "Progress exceeds the backup size limit." };
    const checked = backupValidate(text); if (!checked.ok) return checked;
    return { ok: true, text };
  } catch (_) { return { ok: false, why: "Progress could not be exported." }; }
}
function backupInstall(text) {
  if (runActive) return { ok: false, why: "End the current run before replacing progress." };
  const parsed = backupValidate(text); if (!parsed.ok) return parsed;
  try {
    // Fail closed if storage is unreadable or cannot preserve the previous
    // raw value. Do not assume an inaccessible key is absent.
    const previous = localStorage.getItem(META_KEY);
    const recovery = JSON.stringify({ format: "omni-preimport-v1", raw: previous });
    localStorage.setItem(BACKUP_RECOVERY_KEY, recovery);
    if (localStorage.getItem(BACKUP_RECOVERY_KEY) !== recovery || localStorage.getItem(META_KEY) !== previous) return { ok: false, why: "Storage changed; no progress was replaced. Close other game tabs and retry." };
    localStorage.setItem(META_KEY, parsed.raw);
    return { ok: true };
  } catch (_) { return { ok: false, why: "Could not preserve or write the save. Progress was not intentionally replaced; check storage and keep this tab open." }; }
}
function backupRestorePrevious() {
  if (runActive) return { ok: false, why: "End the current run before restoring progress." };
  try {
    const stored = localStorage.getItem(BACKUP_RECOVERY_KEY), r = stored === null ? null : JSON.parse(stored);
    if (!r || r.format !== "omni-preimport-v1" || !(typeof r.raw === "string" || r.raw === null)) return { ok: false, why: "No previous local progress is available." };
    if (r.raw === null) localStorage.removeItem(META_KEY); else localStorage.setItem(META_KEY, r.raw);
    return { ok: true };
  } catch (_) { return { ok: false, why: "Could not restore the previous local progress." }; }
}
function backupMessage(message, bad) {
  const el = document.getElementById("backupStatus"); if (el) { el.textContent = message; el.style.color = bad ? "#ff8a80" : "#b2ebf2"; }
}
function backupDownload() {
  const result = backupCurrentText(); if (!result.ok) { backupMessage(result.why, true); return; }
  try {
    const url = URL.createObjectURL(new Blob([result.text], { type: "application/json" })), link = document.createElement("a");
    link.href = url; link.download = "omni-progress-backup.json"; document.body.appendChild(link); link.click(); link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 3000); backupMessage("Backup download requested. Options and the active run are not included.", false);
  } catch (_) { backupMessage("Download failed. Your progress was not changed.", true); }
}
(function backupWire() {
  const down = document.getElementById("backupExport"), file = document.getElementById("backupFile"), choose = document.getElementById("backupImport"), previous = document.getElementById("backupPrevious");
  if (!(down && file && choose && previous)) return;
  down.onclick = backupDownload;
  choose.onclick = () => { if (runActive) { backupMessage("End the current run before importing.", true); return; } file.value = ""; file.click(); };
  file.onchange = async () => {
    const f = file.files && file.files[0]; if (!f) return;
    if (f.size > BACKUP_LIMIT) { backupMessage("Backup is too large.", true); return; }
    let text; try { text = await f.text(); } catch (_) { backupMessage("Could not read that file.", true); return; }
    const checked = backupValidate(text); if (!checked.ok) { backupMessage(checked.why, true); return; }
    if (!confirm("Replace this browser's progress with the selected backup? Options and any active run are not imported. The current stored progress will be kept as one local pre-import recovery copy, replacing any older recovery copy. Close other game tabs first.")) return;
    const result = backupInstall(text); if (!result.ok) { backupMessage(result.why, true); return; }
    backupMessage("Progress imported. Reloading…", false); location.reload();
  };
  previous.onclick = () => {
    if (!confirm("Replace current progress with the pre-import local recovery copy? Download a current backup first if you want to keep it. Options are unchanged.")) return;
    const result = backupRestorePrevious(); if (!result.ok) { backupMessage(result.why, true); return; }
    backupMessage("Previous progress restored. Reloading…", false); location.reload();
  };
})();
// EOF:js/savebackup.js
