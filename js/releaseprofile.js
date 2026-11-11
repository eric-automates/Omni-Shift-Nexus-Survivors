// FILE: js/releaseprofile.js
// PART: Reversible v15 career release profile. IDs match V15_STABLE_TASK_TRACKER.md.
// These switches gate NEW job offers and suspend, rather than erase, in-progress
// saves. They are build-time decisions, not a player option or a security layer.
// Do not enable an ID until its own acceptance and compatibility tests pass.
"use strict";
const V15_CAREER_RELEASE = Object.freeze({
  J01:false, J02:false, J03:false, J04:false, J05:true,
  J06:false, J07:false, J08:false, J09:false, J10:false,
  J11:false, J12:false, J13:false, J14:false, J15:false
});
// Fine-grained release switches preserve partial work without claiming its
// parent career or cross-cutting system is finished. Set a career ID true to
// enable all mapped contracts, or toggle an individual feature here.
const V15_FEATURE_RELEASE = Object.freeze({
  "J09.SUPPLY":true,
  "J09.PRIORITY":true,
  "J09.MEDICAL":true,
  "J09.MEDICAL_CONTACT":true,
  "J09.SHIFT":true,
  "J02.WITNESS":true,
  "J02.SCENE":true,
  "J02.POI":true,
  "J01.PATROL":true,
  "J03.TACTICAL":true,
  "J04.FIRE":false,
  "J05.EMT":true,
  "T22.MULTI_VEHICLE_CONVOY":true
});
// Every authored gameplay contract must be mapped before UI exposure.
const V15_CAREER_CONTRACTS = Object.freeze({
  community_supply:"J09", priority_supply:"J09", medical_supply:"J09",
  courier_shift:"J09", witness_trace:"J02", patrol_traffic:"J01", fire_structure:"J04",
  tactical_barricade:"J03", paramedic_incident:"J05", detective_scene_case:"J02", detective_poi_followup:"J02"
});
const V15_CONTRACT_FEATURES = Object.freeze({
  community_supply:"J09.SUPPLY", priority_supply:"J09.PRIORITY",
  medical_supply:"J09.MEDICAL", courier_shift:"J09.SHIFT",
  witness_trace:"J02.WITNESS", detective_scene_case:"J02.SCENE", detective_poi_followup:"J02.POI", patrol_traffic:"J01.PATROL",
  fire_structure:"J04.FIRE", tactical_barricade:"J03.TACTICAL",
  paramedic_incident:"J05.EMT"
});
function v15FeatureEnabled(id) { return V15_FEATURE_RELEASE[id] === true; }
function v15CareerEnabled(id) { return V15_CAREER_RELEASE[id] === true; }
function v15ContractEnabled(id) {
  // Only explicit mappings expose gameplay contracts. The QA harness may opt
  // into any mapped or synthetic contract for a fixture; this is neither a
  // security boundary nor a player-facing release switch.
  const testMode = typeof window !== "undefined" && window.V15_INTERNAL_TEST_MODE === true;
  if (testMode) return true;
  if (typeof id !== "string" || !Object.prototype.hasOwnProperty.call(V15_CAREER_CONTRACTS, id)) return false;
  const key = V15_CAREER_CONTRACTS[id];
  return v15CareerEnabled(key) || v15FeatureEnabled(V15_CONTRACT_FEATURES[id]);
}
function v15JobEnabled(a) {
  return !a || (v15ContractEnabled(a.contract) &&
    !(a.contract === "medical_supply" && a.data && a.data.recipientMode &&
      !v15CareerEnabled("J09") && !v15FeatureEnabled("J09.MEDICAL_CONTACT")));
}
function v15AnyCareerAvailable() { return Object.keys(V15_CAREER_CONTRACTS).some(v15ContractEnabled); }
function v15HeldJob() {
  const a = typeof meta !== "undefined" && meta && meta.jobState && meta.jobState.active;
  return !!(a && !v15JobEnabled(a));
}
// EOF:js/releaseprofile.js
