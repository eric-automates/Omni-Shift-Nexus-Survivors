// FILE: js/jobdispatch.js
// PART: v15 — optional short local dispatch
// DETAIL: Small courier calls and an investigative lead, not full careers.
// Abstract handoffs and responders are not simulated NPCs.
"use strict";

const JOB_DISPATCH = { id: "community_supply", panel: null, wasPaused: false, message: "" };
jobRegister({ id: JOB_DISPATCH.id, role: "courier", start: "pickup",
  edges: { pickup: ["delivery"], delivery: [] }, carriedCaseEndings: ["handoff"],
  endings: { delivered: { from: ["delivery"], pay: 90 }, handoff: { from: ["delivery"], pay: 30 } } });
// A separate contract preserves existing short-delivery save checkpoints.
const JOB_PRIORITY = "priority_supply";
jobRegister({ id: JOB_PRIORITY, role: "courier", start: "pickup",
  edges: { pickup: ["assessment"], assessment: ["delivery", "relay"], relay: ["secured_delivery"], delivery: [], secured_delivery: [] }, carriedCaseEndings: ["handoff"],
  endings: { delivered: { from: ["delivery"], pay: 120 }, secured: { from: ["secured_delivery"], pay: 155 }, handoff: { from: ["assessment", "relay", "delivery", "secured_delivery"], pay: 30 } } });
// A distinct, optional economy-mode call has a real, capped town-stock effect.
// It is still a short mission rather than the complete authored courier career.
const JOB_MEDICAL = "medical_supply";
// Shared predicate: the authored distribution shift uses the same real clinic contact.
const JOB_COURIER_SHIFT = "courier_shift";
function jdHasClinic(a) { return !!a && (a.contract===JOB_MEDICAL || a.contract===JOB_COURIER_SHIFT); }
jobRegister({ id: JOB_MEDICAL, role: "courier", start: "pickup",
  edges: { pickup: ["delivery"], delivery: [] }, carriedCaseEndings: ["handoff"],
  endings: { delivered: { from: ["delivery"], pay: 140 }, handoff: { from: ["delivery"], pay: 35 } }, finishGuard:"medical_atomic", historyHook:"medical_history" });
// Only jdMedicalFinish may award a full medical delivery: it commits stock,
// wallet and history together. Abstract partial handoff keeps the core path.
JOB_CORE.guards.medical_atomic=(a,outcome)=>outcome!=="delivered";
JOB_CORE.historyHooks.medical_history=(a,outcome)=>({recipient:a.data?.recipientLost ? "lost" : a.data?.recipientMode ? "not_met" : "not_simulated"});
// A small investigative lead, not the full Missing Witness career arc.
// Optional search locates a witness; an additional interview is unverified. Support is an unarmed civilian, not police.
const JOB_TRACE = "witness_trace";
jobRegister({id:JOB_TRACE,role:"detective",start:"scene",
  edges:{scene:["clue"],clue:["follow"],follow:["search"],search:["escort"],escort:[]},
  endings:{lead_filed:{from:["follow"],pay:80},contact_filed:{from:["follow"],pay:80},witness_safe:{from:["escort"],pay:180},witness_supported:{from:["escort"],pay:180},trace_handoff:{from:["clue","follow","search","escort"],pay:25}},
  finishGuard:"trace_contact",historyHook:"trace_history"});
JOB_CORE.guards.trace_contact=(a,outcome)=>outcome==="lead_filed" ? !a.data?.contactMode : outcome==="contact_filed" ? jdContactReady(a) : outcome==="witness_safe" ? jdWitnessSafe(a) : outcome==="witness_supported" ? jdWitnessSupported(a) : true;
// These are observations, not a finding of guilt or an invented arrest.
JOB_CORE.historyHooks.trace_history=(a,outcome)=>({
  inquiry: a.data?.inquiry?.status === "spoke" ? "denied" : a.data?.inquiry?.status === "lost" ? "lost" :
    a.data?.inquiry?.status === "open" ? "unresolved" : "not_pursued",
  witness: outcome === "witness_safe" || outcome === "witness_supported" ? "escorted" : a.data?.witnessLost ? "lost" : "unknown",
  support: outcome === "witness_supported" ? "met" : a.data?.support?.status === "lost" ? "lost" : a.data?.support ? "not_met" : "not_requested",
  witnessCare: a.data?.witnessAid === true ? "first_aid" : "none"
});
const JD_COURIERS = [JOB_DISPATCH.id, JOB_PRIORITY, JOB_MEDICAL];
const JD_CONTRACTS = [...JD_COURIERS, JOB_TRACE];
function jdActive() {
  const a = meta && meta.jobState && meta.jobState.active;
  if (!a || !JD_CONTRACTS.includes(a.contract) || !v15JobEnabled(a) || a.world !== jobWorldKey() || !a.data) return null;
  return a;
}
function jdCaseDropped(a) { return !!(a && a.data && a.data.caseDrop != null); }
function jdTarget(a) {
  if (!a || !a.data) return null;
  if (a.contract===JOB_TRACE) {
    if (a.phase === "search" && a.data.inquiry?.status === "open") {
      const p = jdInquirySync(a), w = p?.alive && p.w;
      return w ? {x:w.x,y:w.y} : jobSiteLocal(a.data.inquiry.state || a.data.inquiry.site);
    }
    if(a.phase==="escort") {
      const w=JD_CONTACT.actor?.alive && JD_CONTACT.actor.w && JD_CONTACT.role==="witness" ? JD_CONTACT.actor.w : null;
      const saved=jobSiteLocal(a.data.witnessState || a.data.search);
      // If the player leaves the witness behind, guide them back rather than
      // letting a marker-only arrival claim an escort occurred.
      if(w && Math.hypot(player.x-w.x,player.y-w.y)>180)return {x:w.x,y:w.y};
      if(!w && saved)return saved;
      return jobSiteLocal(a.data.safe);
    }
    if(["follow","search"].includes(a.phase) && a.data.contactMode && JD_CONTACT.actor?.alive && JD_CONTACT.actor.w && JD_CONTACT.incident===a.id && JD_CONTACT.world===a.world) return {x:JD_CONTACT.actor.w.x,y:JD_CONTACT.actor.w.y};
    return jobSiteLocal(a.phase==="follow" && a.data.contactMode && a.data.contactState ? a.data.contactState : a.phase==="search" && a.data.witnessState ? a.data.witnessState : a.data[a.phase]);
  }
  if (jdCaseDropped(a)) return jobSiteLocal(a.data.caseDrop);
  if (a.contract===JOB_COURIER_SHIFT && a.data.support?.carrying) {
    const worker=JD_SUPPORT.incident===a.id && JD_SUPPORT.world===a.world && JD_SUPPORT.actor?.alive ? JD_SUPPORT.actor.w : null;
    return worker ? {x:worker.x,y:worker.y} : jobSiteLocal(a.data.support.state || a.data.support.site);
  }
  if (jdHasClinic(a) && a.phase==="delivery" && a.data.recipientMode && JD_CLINIC.actor?.alive && JD_CLINIC.actor.w && JD_CLINIC.incident===a.id && JD_CLINIC.world===a.world) return {x:JD_CLINIC.actor.w.x,y:JD_CLINIC.actor.w.y};
  const site = a.phase === "pickup" ? a.data.pickup : a.phase === "assessment" ? a.data.assessment : a.phase === "relay" ? a.data.relay : (a.phase === "delivery" || a.phase === "secured_delivery") ? a.data.delivery : null;
  return jobSiteLocal(site);
}
function jdNear(a) {
  const p = jdTarget(a);
  if (!p || !player || player.inVehicle || player.roof || (player.flyAlt || 0) > 2) return false;
  return Math.hypot(player.x - p.x, player.y - p.y) < 44 && stClearLine(player.x, player.y, p.x, p.y, 3);
}
function jdNotice(message) {
  JOB_DISPATCH.message = message;
  if (typeof cityTip === "function") cityTip(message, 3);
}
// Resolve a real medical building by its stable uid and world-tile centre;
// never silently turn a missing clinic into a generic anonymous drop point.
function jdMedicalBuilding(a) {
  const c=a && a.data && a.data.clinic, p=c && jobSiteLocal(c.center);
  if(!c || typeof c.uid!=="string" || !p)return null;
  const tx=cityTX(p.x),ty=cityTY(p.y),chunk=cityChunk(tx>>7,ty>>7);
  const b=chunk && chunk.blds.find(q=>q.uid===c.uid);
  return b && ["clinic","hospital"].includes(tfKind(b)) ? b : null;
}
function jdMedicalSite(b,sx,sy,previous) {
  if(!b || !["clinic","hospital"].includes(tfKind(b)))return null;
  for(const e of accEntrances(b)) {
    if(e.kind!=="door")continue;
    const cx=e.x+(e.axis==="x"?e.len/2:0.5),cy=e.y+(e.axis==="y"?e.len/2:0.5);
    for(const offset of [2,3,4,5]) {
      const lx=(cx+e.o[0]*offset)*16-CITY.orx,ly=(cy+e.o[1]*offset)*16-CITY.ory;
      const q=cityFindWalkable(lx,ly,24,true);if(!q || Math.hypot(q[0]-lx,q[1]-ly)>24)continue;
      if(previous && Math.hypot(q[0]-previous.x,q[1]-previous.y)<48)continue;
      if(jobRouteValid(sx,sy,q[0],q[1]))return {wx:q[0]+CITY.orx,wy:q[1]+CITY.ory};
    }
    // If a second outward offset is unavailable, try a small number of
    // lateral exterior sites. Only reroutes use this fallback; preserve the
    // original offer selection. Keep the same real door, 110px delivery
    // radius, unobstructed door frontage and a validated body-clear route.
    if(previous) {
      const doorX=cx*16-CITY.orx,doorY=cy*16-CITY.ory;
      for(const offset of [2,3,4,5,6]) for(const lateral of [-1,1,-2,2,-3,3]) {
        const lx=doorX+(e.o[0]*offset-e.o[1]*lateral)*16,ly=doorY+(e.o[1]*offset+e.o[0]*lateral)*16;
        const q=cityFindWalkable(lx,ly,24,true);
        if(!q || Math.hypot(q[0]-lx,q[1]-ly)>24 || Math.hypot(q[0]-doorX,q[1]-doorY)>110 ||
           Math.hypot(q[0]-previous.x,q[1]-previous.y)<48)continue;
        if(!stClearLine(doorX+e.o[0]*32,doorY+e.o[1]*32,q[0],q[1],3))continue;
        if(jobRouteValid(sx,sy,q[0],q[1]))return {wx:q[0]+CITY.orx,wy:q[1]+CITY.ory};
      }
    }
  }
  return null;
}
function jdMedicalOfferSite(sx,sy,nearby) {
  // Reuse the local building query when trying more than one pickup. Sort a
  // copy because each pickup has a different nearest medical entrance.
  const candidates=(nearby || accNearBuildings(1100).filter(b=>["clinic","hospital"].includes(tfKind(b)))).slice();
  candidates.sort((a,b)=>Math.hypot((a.x+a.w/2)*16-CITY.orx-sx,(a.y+a.h/2)*16-CITY.ory-sy)-Math.hypot((b.x+b.w/2)*16-CITY.orx-sx,(b.y+b.h/2)*16-CITY.ory-sy));
  for(const b of candidates.slice(0,12)) {
    const site=jdMedicalSite(b,sx,sy,null); if(site)return {site,clinic:{uid:b.uid,kind:tfKind(b),name:typeof cityBuildingLabel==="function" ? String(cityBuildingLabel(b)||"Medical clinic").slice(0,100) : "Medical clinic",center:{wx:(b.x+b.w/2)*16,wy:(b.y+b.h/2)*16}}};
  }
  return null;
}
// Verify the exact destination still belongs to the recorded building and is
// near one of its real exterior doors before applying a stock consequence.
function jdMedicalDestination(a) {
  const b=jdMedicalBuilding(a),p=a && a.data && jobSiteLocal(a.data.delivery);if(!b||!p)return false;
  return accEntrances(b).some(e=>{if(e.kind!=="door")return false;const x=(e.x+(e.axis==="x"?e.len/2:0.5))*16-CITY.orx,y=(e.y+(e.axis==="y"?e.len/2:0.5))*16-CITY.ory;return Math.hypot(p.x-x,p.y-y)<=110;});
}
// Complete mission, payment and town stock in one existing meta write. If the
// write fails, roll back the live stock as well as the job and wallet. Old
// incidents/saves have no medical data and are unaffected.
function jdMedicalFinish(a) {
  if(!a || a.contract!==JOB_MEDICAL || a.phase!=="delivery" || jdCaseDropped(a) || !jdNear(a) || !jdMedicalDestination(a))return {ok:false,why:"Return to the medical entrance with the case"};
  if(!ECO.on || SCN.mode!=="economy")return {ok:false,why:"Return in the economy scenario to restock the town"};
  if(a.data?.recipientMode && !jdClinicReady(a))return {ok:false,why:"Meet the calm clinic contact at the entrance, or request a partial handoff"};
  const read=jobReadState();if(!read.ok)return read;
  const active=read.state.active, mem=ecoMem(),stock=ECO.stock;
  if(!active || active.id!==a.id || active.contract!==JOB_MEDICAL || active.phase!=="delivery" || active.world!==jobWorldKey() || !stock || mem.stock!==stock || !Number.isFinite(stock.med) || stock.med<0)
    return {ok:false,why:"Medical stock or incident is unavailable"};
  // A caller can hold a pre-replan snapshot with the same incident ID. Only
  // the current durable checkpoint may authorize a delivery or restock.
  if(jdCaseDropped(active) || !jdNear(active) || !jdMedicalDestination(active) || (active.data.recipientMode && !jdClinicReady(active)))
    return {ok:false,why:"Return to the current medical entrance with the case"};
  const before=stock.med,after=before>=ECO_GOODS.med.ref*4?before:Math.min(ECO_GOODS.med.ref*4,before+6),added=Math.max(0,after-before),end=JOB_CORE.defs[JOB_MEDICAL].endings.delivered;
  read.state.history.push({id:active.id,contract:active.contract,role:active.role,world:active.world,outcome:"delivered",pay:end.pay,restock:added,...(active.data.recipientMode ? {recipient:"met"} : {})});
  if(read.state.history.length>JOB_CORE.historyMax)read.state.history.splice(0,read.state.history.length-JOB_CORE.historyMax);
  read.state.active=null;stock.med=after;
  let result;try{result=jobCommit(read.state,end.pay);}catch(e){result={ok:false,why:"checkpoint was not saved"};}
  if(!result.ok){stock.med=before;return result;}
  try{ecoPrices();}catch(e){}
  result.pay=end.pay;result.restock=added;return result;
}
function jdTraceOffer() {
  if(!v15ContractEnabled(JOB_TRACE)) return {ok:false,why:"Witness jobs are unavailable in this revision."};
  if(!runActive || !CITY.on || !player || player.inVehicle || player.roof || (player.flyAlt || 0)>2)
    return {ok:false,why:"Stand on the ground outside a vehicle to find a call."};
  const read=jobReadState(); if(!read.ok)return read;
  if(read.state.active)return {ok:false,why:"An incident is already active."};
  // Search each leg separately; no offer is saved until every leg is checked.
  const scene=jobFindSite(player.x,player.y,CITY.seed+619),p=jobSiteLocal(scene);
  if(!p)return {ok:false,why:"No reachable report site found. Try another location."};
  const clue=jobFindSite(p.x,p.y,CITY.seed+701),q=jobSiteLocal(clue);
  if(!q)return {ok:false,why:"No reachable clue site found. Try another location."};
  const follow=jobFindSite(q.x,q.y,CITY.seed+809),r=jobSiteLocal(follow);
  if(!r)return {ok:false,why:"No reachable follow-up site found. Try another location."};
  return jobOffer(JOB_TRACE,{scene,clue,follow,contactMode:typeof TF!=="undefined" && TF.on ? 1 : 0});
}
// Absent checkpoints are valid for a person not yet encountered. A present
// checkpoint must contain a complete, live actor snapshot; never manufacture
// full health from an explicitly null or incomplete saved injury. Leave the
// record unchanged so the player can still choose an unresolved handoff.
function jdPersonSnapshotValid(state) {
  if (state === undefined) return true;
  return !!state && typeof state === "object" && !Array.isArray(state) &&
    ["wx","wy","hp"].every(k=>Object.prototype.hasOwnProperty.call(state,k)) &&
    Number.isFinite(state.wx) && Number.isFinite(state.wy) &&
    Number.isFinite(state.hp) && state.hp>0 && state.hp<=30;
}
// Economy/apocalypse calls can encounter an ordinary damageable civilian
// contact, followed optionally by a distinct missing witness and an on-foot
// escort. Existing and survivors-mode calls retain their abstract follow-up.
// Position is periodically checkpointed; injuries are checkpointed immediately.
const JD_CONTACT = { actor:null, incident:null, world:null, role:null, saveTimer:0 };
function jdContactClear() {
  const p=JD_CONTACT.actor;
  if(p && typeof TF!=="undefined") {
    const i=TF.walk.indexOf(p);if(i>=0)TF.walk.splice(i,1);
    if(TF.npc.get(p.id)===p)TF.npc.delete(p.id);
    p.w=null;
  }
  JD_CONTACT.actor=null;JD_CONTACT.incident=null;JD_CONTACT.world=null;JD_CONTACT.role=null;JD_CONTACT.saveTimer=0;
}
// Once interviewed, the first contact returns to ordinary town behavior;
// the second person is separately identified and remains physically present.
function jdContactRelease() {
  const p=JD_CONTACT.actor;
  if(p?.alive && p.w) {p.jdContact=null;p.w.jobContact=false;p.w.jobEscort=false;try{tfPickGoal(p,"out");}catch(e){p.w.tx=p.w.x;p.w.ty=p.w.y;}}
  JD_CONTACT.actor=null;JD_CONTACT.incident=null;JD_CONTACT.world=null;JD_CONTACT.role=null;JD_CONTACT.saveTimer=0;
}
function jdContactRole(a) {
  return a && a.contract===JOB_TRACE && a.data?.contactMode ? a.phase==="follow" ? "contact" : ["search","escort"].includes(a.phase) ? "witness" : null : null;
}
function jdContactSync(a) {
  const role=jdContactRole(a);
  if(!role || a.world!==jobWorldKey()) {jdContactClear();return null;}
  if(JD_CONTACT.incident!==a.id || JD_CONTACT.world!==a.world || (JD_CONTACT.role && JD_CONTACT.role!==role))jdContactClear();
  if(!TF.on)return null;
  const state=a.data[role+"State"],lost=a.data[role+"Lost"];
  // Escort cannot begin without an encountered witness and a checkpoint. An
  // absent checkpoint here must not recreate them with full default health.
  if((role==="witness" && a.phase==="escort" && state===undefined) || !jdPersonSnapshotValid(state))return null;
  if(JD_CONTACT.actor && (JD_CONTACT.actor.w || !JD_CONTACT.actor.alive)) {
    if(JD_CONTACT.actor.w)JD_CONTACT.actor.w.jobEscort=role==="witness" && a.phase==="escort";
    return JD_CONTACT.actor;
  }
  if(JD_CONTACT.actor)jdContactClear();
  const target=jobSiteLocal(state || a.data[role==="contact"?"follow":"search"]);
  if(lost || !target || Math.hypot(player.x-target.x,player.y-target.y)>750 || cityCircleBlocked(target.x,target.y,7,false) || (cityFlagsAt(target.x,target.y)&(F_MOVE|F_IN|F_WATER)))return null;
  const id="jd-"+role+"|"+a.world+"|"+a.id;
  if(tfMem().dead[id])return null;
  const p=tfPerson(id,tfRng(tfHash(id)),{occ:"unemployed"});
  p.jdContact={incident:a.id,world:a.world,role};
  const W=tfSpawnWalker(p,target.x,target.y,false,null);
  W.jobContact=true;W.jobEscort=role==="witness" && a.phase==="escort";W.idle=1e6;if(state)W.hp=state.hp;
  JD_CONTACT.actor=p;JD_CONTACT.incident=a.id;JD_CONTACT.world=a.world;JD_CONTACT.role=role;
  return p;
}
function jdContactReady(a) {
  const p=jdContactSync(a),W=p&&p.w;
  return !!(a && a.data?.contactMode && !a.data.contactLost && p && p.alive && W && W.flee<=0 && !W.stun && jdNear(a));
}
// Save the actual actor position in stable world coordinates and its remaining
// health with the incident. Writes are bounded: on injury or periodically only
// while the person has moved, plus an explicit final snapshot on run reset.
function jdContactCheckpoint(p) {
  const W=p&&p.w;if(!p?.alive || !p.jdContact || !W || !Number.isFinite(W.hp) || W.hp<=0)return false;
  const read=jobReadState(),a=read.ok&&read.state.active;
  if(!a || a.id!==p.jdContact.incident || a.world!==p.jdContact.world || a.world!==jobWorldKey() || jdContactRole(a)!==p.jdContact.role || a.data[p.jdContact.role+"Lost"])return false;
  const key=p.jdContact.role+"State",next={wx:W.x+CITY.orx,wy:W.y+CITY.ory,hp:W.hp},old=a.data[key];
  if(old && Math.hypot(old.wx-next.wx,old.wy-next.wy)<8 && old.hp===next.hp)return true;
  a.data[key]=next;
  const saved=jobCommit(read.state,0);
  if(!saved.ok)jdNotice("CONTACT CHECKPOINT NOT SAVED · Check storage before leaving.");
  return saved.ok;
}
const jdOriginalTfHurt=window.tfHurt;
window.tfHurt=function(p,dmg,how,by,origin,danger) {
  const result=jdOriginalTfHurt.apply(this,arguments);
  if(p?.jdContact && p.alive)jdContactCheckpoint(p);
  if(p?.jdInquiry && p.alive)jdInquiryCheckpoint(p);
  if(p?.jdSupport && p.alive)jdSupportCheckpoint(p);
  if(p?.jdClinic && p.alive)jdClinicCheckpoint(p);
  return result;
};
// Persist fatal loss with the existing townsfolk death memory. If storage
// fails, the actor remains dead in this run and the warning is shown; abrupt
// reload after a failed write cannot be promised to retain the loss.
const jdOriginalTfDie=window.tfDie;
window.tfDie=function(p,how,by,origin) {
  const wasAlive=!!p?.alive,result=jdOriginalTfDie.apply(this,arguments);
  if(wasAlive && p?.jdContact) {
    const read=jobReadState(),a=read.ok&&read.state.active;
    if(a && a.id===p.jdContact.incident && a.world===p.jdContact.world && jdContactRole(a)===p.jdContact.role) {
      a.data[p.jdContact.role+"Lost"]=true;
      const saved=jobCommit(read.state,0);
      jdNotice(saved.ok ? "CONTACT LOST · The lead can still be handed off." : "CONTACT LOST · Could not save; check storage before leaving.");
    }
  }
  if(wasAlive && p?.jdInquiry)jdInquiryLost(p);
  if(wasAlive && p?.jdSupport)jdSupportLost(p);
  if(wasAlive && p?.jdClinic)jdClinicLost(p);
  return result;
};
// Optional second interview. This is a person the witness describes, not a
// proven culprit. They can be injured, flee or die like other townsfolk.
const JD_INQUIRY = { actor:null, incident:null, world:null, saveTimer:0 };
function jdInquiryClear(release) {
  const p=JD_INQUIRY.actor;
  if(p && typeof TF!=="undefined") {
    if(release && p.alive && p.w) {
      p.jdInquiry=null;p.w.jobContact=false;
      try { tfPickGoal(p,"out"); } catch(e) { p.w.tx=p.w.x;p.w.ty=p.w.y; }
    } else {
      const i=TF.walk.indexOf(p);if(i>=0)TF.walk.splice(i,1);
      if(TF.npc.get(p.id)===p)TF.npc.delete(p.id);p.w=null;
    }
  }
  JD_INQUIRY.actor=null;JD_INQUIRY.incident=null;JD_INQUIRY.world=null;JD_INQUIRY.saveTimer=0;
}
function jdInquirySync(a) {
  const q=a?.contract===JOB_TRACE && a.phase==="search" && a.data?.inquiry;
  if(!q || q.status!=="open" || a.world!==jobWorldKey() || !TF.on) {
    // Ending/withdrawing a case must not visibly erase a healthy person.
    const release=!!(TF.on && runActive && JD_INQUIRY.actor?.alive && JD_INQUIRY.world===jobWorldKey());
    jdInquiryClear(release);return null;
  }
  if(JD_INQUIRY.incident!==a.id || JD_INQUIRY.world!==a.world)jdInquiryClear(false);
  const state=q.state;
  if(!jdPersonSnapshotValid(state))return null;
  if(JD_INQUIRY.actor && (JD_INQUIRY.actor.w || !JD_INQUIRY.actor.alive))return JD_INQUIRY.actor;
  if(JD_INQUIRY.actor)jdInquiryClear(false);
  const target=jobSiteLocal(state || q.site);
  if(!target || Math.hypot(player.x-target.x,player.y-target.y)>750 || cityCircleBlocked(target.x,target.y,7,false) || (cityFlagsAt(target.x,target.y)&(F_MOVE|F_IN|F_WATER)))return null;
  const id="jd-inquiry|"+a.world+"|"+a.id;if(tfMem().dead[id])return null;
  const p=tfPerson(id,tfRng(tfHash(id)),{occ:"unemployed"});p.jdInquiry={incident:a.id,world:a.world};
  const W=tfSpawnWalker(p,target.x,target.y,false,null);W.jobContact=true;W.idle=1e6;if(state)W.hp=state.hp;
  JD_INQUIRY.actor=p;JD_INQUIRY.incident=a.id;JD_INQUIRY.world=a.world;return p;
}
function jdInquiryCheckpoint(p) {
  const W=p?.w;if(!p?.alive || !p.jdInquiry || !W || !Number.isFinite(W.hp) || W.hp<=0)return false;
  const read=jobReadState(),a=read.ok&&read.state.active,q=a?.data?.inquiry;
  if(!a || a.id!==p.jdInquiry.incident || a.world!==p.jdInquiry.world || a.world!==jobWorldKey() || a.phase!=="search" || q?.status!=="open")return false;
  const next={wx:W.x+CITY.orx,wy:W.y+CITY.ory,hp:W.hp},old=q.state;
  if(old && Math.hypot(old.wx-next.wx,old.wy-next.wy)<8 && old.hp===next.hp)return true;
  q.state=next;const saved=jobCommit(read.state,0);
  if(!saved.ok)jdNotice("INTERVIEW CHECKPOINT NOT SAVED · Check storage before leaving.");
  return saved.ok;
}
function jdInquiryLost(p) {
  const read=jobReadState(),a=read.ok&&read.state.active,q=a?.data?.inquiry;
  if(!a || a.id!==p.jdInquiry?.incident || a.world!==p.jdInquiry.world || a.world!==jobWorldKey() || a.phase!=="search" || q?.status!=="open")return;
  q.status="lost";const result=jobCommit(read.state,0);
  jdNotice(result.ok ? "PERSON LOST · The account remains unresolved." : "PERSON LOST · Could not save; check storage before leaving.");
}
function jdPersonNear(p) {
  const W=p?.w;
  return !!(p?.alive && W && W.flee<=0 && !W.stun && player && !player.inVehicle && !player.roof && (player.flyAlt||0)<=2 &&
    Math.hypot(player.x-W.x,player.y-W.y)<44 && stClearLine(player.x,player.y,W.x,W.y,3));
}
function jdWitnessNear(a) {
  return !!(a && a.phase==="search" && !a.data.witnessLost && jdPersonNear(jdContactSync(a)));
}
function jdInquiryBegin(id) {
  const read=jobReadState(),a=read.ok&&read.state.active;
  if(!a || a.id!==id || a.contract!==JOB_TRACE || a.world!==jobWorldKey() || a.phase!=="search" || a.data.inquiry || !jdWitnessNear(a))
    return {ok:false,why:"Return to the witness to ask about the person."};
  const w=JD_CONTACT.actor.w;let site=null;
  // A single procedural candidate can be reachable outward but not on the
  // return leg. Try a bounded, deterministic set before offering an exit.
  for(let k=0;k<6&&!site;k++) {
    const candidate=jobFindSite(w.x,w.y,CITY.seed+1399+(id%10000)*17+k*79),p=jobSiteLocal(candidate);
    if(p && jobRouteValid(w.x,w.y,p.x,p.y) && jobRouteValid(p.x,p.y,w.x,w.y))site=candidate;
  }
  if(!site)return {ok:false,why:"No reachable interview site found. Escort the witness or try again."};
  a.data.witnessState={wx:w.x+CITY.orx,wy:w.y+CITY.ory,hp:w.hp};
  a.data.inquiry={status:"open",site};
  const r=jobCommit(read.state,0);if(r.ok && typeof MAPV!=="undefined")MAPV.lastSig="";return r;
}
function jdInquiryChoice(id,action) {
  const read=jobReadState(),a=read.ok&&read.state.active,q=a?.data?.inquiry;
  if(!a || a.id!==id || a.contract!==JOB_TRACE || a.world!==jobWorldKey() || a.phase!=="search" || q?.status!=="open")
    return {ok:false,why:"This interview is no longer available."};
  if(action==="speak") {
    const p=jdInquirySync(a);if(!jdPersonNear(p))return {ok:false,why:"Approach the person calmly on foot."};
    q.status="spoke"; // They deny it; this is a statement, not proof or arrest.
  } else if(action==="leave") q.status=JD_INQUIRY.actor && !JD_INQUIRY.actor.alive ? "lost" : "not_pursued";
  else return {ok:false,why:"This interview is no longer available."};
  const r=jobCommit(read.state,0);
  if(r.ok) {jdInquiryClear(true);if(typeof MAPV!=="undefined")MAPV.lastSig="";}
  return r;
}
// One simple aid action for an injured witness; this does not revive anyone or
// simulate equipment, medical personnel or a complete treatment system.
function jdWitnessAidReady(a) {
  if(!a || a.contract!==JOB_TRACE || !["search","escort"].includes(a.phase) || a.data?.witnessAid || a.data?.witnessLost || a.data?.inquiry?.status==="open")return false;
  const p=jdContactSync(a),w=p?.w;
  return !!(jdPersonNear(p) && Number.isFinite(w.hp) && w.hp>0 && w.hp<30);
}
function jdWitnessAid(id,expected) {
  const read=jobReadState(),a=read.ok&&read.state.active;
  if(!a || a.id!==id || a.contract!==JOB_TRACE || a.world!==jobWorldKey() || a.phase!==expected || !jdWitnessAidReady(a))
    return {ok:false,why:"Approach the injured, calm witness on foot. Aid can be used once."};
  const w=JD_CONTACT.actor.w,hp=Math.min(30,w.hp+12);
  // Commit the once-only flag and new actor health atomically before changing
  // the live actor; a failed save leaves both unchanged.
  a.data.witnessAid=true;a.data.witnessState={wx:w.x+CITY.orx,wy:w.y+CITY.ory,hp};
  const result=jobCommit(read.state,0);if(result.ok)w.hp=hp;return result;
}
// An optional, unarmed community support worker walks to the meeting point.
// They are a damageable civilian, not an armed guard, medic, officer or vehicle.
const JD_SUPPORT = {actor:null,incident:null,world:null,saveTimer:0,view:null};
function jdSupportOffscreen(x,y) {
  const last=JD_SUPPORT.view;let now;
  try {now=typeof camView==="function" ? camView(60) : null;} catch(e) {return false;}
  if(!last || !now || ![x,y,last.left,last.top,last.vw,last.vh,now.left,now.top,now.vw,now.vh].every(Number.isFinite) ||
     last.vw<=0 || last.vh<=0 || now.vw<=0 || now.vh<=0)return false;
  const outside=v=>x+40<v.left || x-40>v.left+v.vw || y+40<v.top || y-40>v.top+v.vh;
  return outside(last) && outside(now);
}
function jdSupportClear(release) {
  const p=JD_SUPPORT.actor;
  if(p && typeof TF!=="undefined") {
    if(release && p.alive && p.w) {
      p.jdSupport=null;p.w.jobContact=false;p.w.jobSupport=false;
      try {tfPickGoal(p,"out");} catch(e) {p.w.tx=p.w.x;p.w.ty=p.w.y;}
    } else {
      const i=TF.walk.indexOf(p);if(i>=0)TF.walk.splice(i,1);
      if(TF.npc.get(p.id)===p)TF.npc.delete(p.id);p.w=null;
    }
  }
  JD_SUPPORT.actor=null;JD_SUPPORT.incident=null;JD_SUPPORT.world=null;JD_SUPPORT.saveTimer=0;
}
function jdHasSupport(a) {
  return !!a && ((a.contract===JOB_TRACE && ["search","escort"].includes(a.phase)) || (a.contract===JOB_COURIER_SHIFT && a.phase==="delivery"));
}
function jdSupportSync(a) {
  const q=jdHasSupport(a) && a.data?.support;
  if(!q || q.status!=="active" || a.world!==jobWorldKey() || !TF.on) {
    const release=!!(TF.on && runActive && JD_SUPPORT.actor?.alive && JD_SUPPORT.world===jobWorldKey());
    jdSupportClear(release);return null;
  }
  if(JD_SUPPORT.incident!==a.id || JD_SUPPORT.world!==a.world)jdSupportClear(false);
  const state=q.state;
  if(!jdPersonSnapshotValid(state))return null;
  if(JD_SUPPORT.actor && (JD_SUPPORT.actor.w || !JD_SUPPORT.actor.alive))return JD_SUPPORT.actor;
  if(JD_SUPPORT.actor)jdSupportClear(false);
  const p=jobSiteLocal(state || q.site);
  // Never materialize a new live support person in either known camera view.
  if(!p || !jdSupportOffscreen(p.x,p.y) || cityCircleBlocked(p.x,p.y,7,false) || (cityFlagsAt(p.x,p.y)&(F_MOVE|F_IN|F_WATER)))return null;
  const id="jd-support|"+a.world+"|"+a.id+(a.contract===JOB_COURIER_SHIFT ? "|stop"+a.data.stop : "");if(tfMem().dead[id])return null;
  const person=tfPerson(id,tfRng(tfHash(id)),{occ:"unemployed"});person.jdSupport={incident:a.id,world:a.world};
  const w=tfSpawnWalker(person,p.x,p.y,false,null);w.jobContact=true;w.jobSupport=true;w.idle=1e6;if(state)w.hp=state.hp;
  JD_SUPPORT.actor=person;JD_SUPPORT.incident=a.id;JD_SUPPORT.world=a.world;return person;
}
function jdSupportTarget(p) {
  const a=jdActive();
  if(!jdHasSupport(a) || a.data?.support?.status!=="active" || p?.jdSupport?.incident!==a.id || p.jdSupport.world!==a.world)return null;
  if(a.contract===JOB_TRACE)return jobSiteLocal(a.data.safe);
  if(a.data.support.carrying){const q=jobSiteLocal(a.data.delivery);return q && {x:q.x,y:q.y,stop:8};}
  return player && !player.inVehicle && !player.roof && (player.flyAlt||0)<=2 ? {x:player.x,y:player.y,stop:30} : null;
}
function jdSupportCheckpoint(p) {
  const w=p?.w;if(!p?.alive || !p.jdSupport || !w || !Number.isFinite(w.hp) || w.hp<=0)return false;
  const read=jobReadState(),a=read.ok&&read.state.active,q=a?.data?.support;
  if(!a || a.id!==p.jdSupport.incident || a.world!==p.jdSupport.world || a.world!==jobWorldKey() || !jdHasSupport(a) || q?.status!=="active")return false;
  const next={wx:w.x+CITY.orx,wy:w.y+CITY.ory,hp:w.hp},old=q.state;
  if(old && Math.hypot(old.wx-next.wx,old.wy-next.wy)<8 && old.hp===next.hp)return true;
  q.state=next;const result=jobCommit(read.state,0);
  if(!result.ok)jdNotice("SUPPORT CHECKPOINT NOT SAVED · Check storage before leaving.");return result.ok;
}
function jdSupportLost(p) {
  const read=jobReadState(),a=read.ok&&read.state.active,q=a?.data?.support;
  if(!a || a.id!==p.jdSupport?.incident || a.world!==p.jdSupport.world || a.world!==jobWorldKey() || !jdHasSupport(a) || q?.status!=="active")return;
  q.status="lost";
  if(a.contract===JOB_COURIER_SHIFT && q.carrying && p.w) {
    // A case drops only where the worker actually fell, never at a fabricated
    // or snapped point. If the location is obstructed, the shift can be ended.
    const w=p.w;
    if(!cityCircleBlocked(w.x,w.y,7,false) && !(cityFlagsAt(w.x,w.y)&(F_MOVE|F_IN|F_WATER))) {
      a.data.caseDrop={wx:w.x+CITY.orx,wy:w.y+CITY.ory};q.carrying=false;
    }
  }
  const result=jobCommit(read.state,0);
  jdNotice(result.ok ? (a.contract===JOB_COURIER_SHIFT ? (a.data.caseDrop ? "COURIER ASSISTANT LOST · Recover the case where they fell." : q.carrying ? "COURIER ASSISTANT LOST · End the shift if the case is inaccessible." : "COURIER ASSISTANT LOST · Continue with the case yourself.") : "SUPPORT CONTACT LOST · The unguarded meeting remains available.") : "SUPPORT CONTACT LOST · Could not save; check storage.");
}
function jdSupportRequest(id,expected) {
  const read=jobReadState(),a=read.ok&&read.state.active;
  if(!a || a.id!==id || a.contract!==JOB_TRACE || a.world!==jobWorldKey() || a.phase!==expected || !["search","escort"].includes(expected) || a.data?.support || a.data?.witnessLost || a.data?.inquiry?.status==="open" || !jdPersonNear(jdContactSync(a)))
    return {ok:false,why:"Approach the calm witness on foot to request support."};
  const goal=jobSiteLocal(a.data.safe);if(!goal)return {ok:false,why:"Meeting point unavailable."};
  let site=null;const turn=((CITY.seed+(id%10000)*31)%360)*Math.PI/180;
  for(const dist of [450,560,660])for(let i=0;i<16&&!site;i++) {
    const angle=turn+i*2.399963229728653;
    const q=cityFindWalkable(goal.x+Math.cos(angle)*dist,goal.y+Math.sin(angle)*dist,24,true);
    if(!q || Math.hypot(q[0]-goal.x,q[1]-goal.y)>JOB_ROUTE.maxDistance || !jdSupportOffscreen(q[0],q[1]) || cityCircleBlocked(q[0],q[1],7,false) || (cityFlagsAt(q[0],q[1])&(F_MOVE|F_IN|F_WATER)) || !jobRouteValid(q[0],q[1],goal.x,goal.y))continue;
    site={wx:q[0]+CITY.orx,wy:q[1]+CITY.ory};
  }
  if(!site)return {ok:false,why:"No safe off-screen approach is available. The unguarded meeting remains available."};
  a.data.support={status:"active",site};const result=jobCommit(read.state,0);
  if(result.ok)jdSupportSync(jdActive());return result;
}
function jdWitnessSupported(a) {
  if(!jdWitnessSafe(a) || a.data?.support?.status!=="active")return false;
  const p=jdSupportSync(a),w=p?.w,witness=JD_CONTACT.actor?.w,safe=jobSiteLocal(a.data.safe);
  return !!(p?.alive && w && w.flee<=0 && !w.stun && witness && !witness.stun && safe &&
    Math.hypot(w.x-safe.x,w.y-safe.y)<65 && Math.hypot(w.x-witness.x,w.y-witness.y)<125 &&
    stClearLine(w.x,w.y,witness.x,witness.y,7));
}
// Optional clinic contact, distinct from a physician or ambulance responder.
// The unchanged medical contract without recipientMode remains abstract.
const JD_CLINIC={actor:null,incident:null,world:null,saveTimer:0,searchAt:0};
function jdClinicClear(release) {
  const p=JD_CLINIC.actor;
  if(p && typeof TF!=="undefined") {
    if(release && p.alive && p.w){p.jdClinic=null;p.w.jobContact=false;p.w.jobClinic=false;try{tfPickGoal(p,"out");}catch(e){p.w.tx=p.w.x;p.w.ty=p.w.y;}}
    else {const i=TF.walk.indexOf(p);if(i>=0)TF.walk.splice(i,1);if(TF.npc.get(p.id)===p)TF.npc.delete(p.id);p.w=null;}
  }
  JD_CLINIC.actor=null;JD_CLINIC.incident=null;JD_CLINIC.world=null;JD_CLINIC.saveTimer=0;JD_CLINIC.searchAt=0;
}
function jdClinicSync(a) {
  if(!jdHasClinic(a) || a.phase!=="delivery" || !a.data?.recipientMode || a.data.recipientLost || a.world!==jobWorldKey() || !TF.on) {
    jdClinicClear(!!(TF.on && runActive && JD_CLINIC.actor?.alive && JD_CLINIC.world===jobWorldKey()));return null;
  }
  if(JD_CLINIC.incident!==a.id || JD_CLINIC.world!==a.world){jdClinicClear(false);JD_CLINIC.incident=a.id;JD_CLINIC.world=a.world;}
  if(JD_CLINIC.actor && (JD_CLINIC.actor.w || !JD_CLINIC.actor.alive))return JD_CLINIC.actor;
  if(JD_CLINIC.actor){jdClinicClear(false);JD_CLINIC.incident=a.id;JD_CLINIC.world=a.world;}
  let state=a.data.recipientState;
  if(state!=null && (!Number.isFinite(state.wx)||!Number.isFinite(state.wy)||!Number.isFinite(state.hp)||state.hp<=0||state.hp>30))return null;
  const goal=jobSiteLocal(a.data.delivery);if(!goal || !jdMedicalDestination(a))return null;
  if(!state) {
    if(!JD_SUPPORT.view || runTime<JD_CLINIC.searchAt)return null;
    JD_CLINIC.searchAt=runTime+3;
    const clear=q=>q && jdSupportOffscreen(q.x,q.y) && !cityCircleBlocked(q.x,q.y,7,false) && !(cityFlagsAt(q.x,q.y)&(F_MOVE|F_IN|F_WATER));
    let origin=clear(goal) ? goal : null;
    // If the entrance is on screen, a real contact can enter from a checked
    // off-screen approach and walk there; no actor materializes in view.
    if(!origin)for(const radius of [300,450,600])for(let i=0;i<12&&!origin;i++) {
      const h=((CITY.seed+(a.id%10000)*31)%360)*Math.PI/180+i*2.399963229728653;
      const q=cityFindWalkable(goal.x+Math.cos(h)*radius,goal.y+Math.sin(h)*radius,24,true),p=q&&{x:q[0],y:q[1]};
      if(clear(p) && jobRouteValid(p.x,p.y,goal.x,goal.y))origin=p;
    }
    if(!origin)return null;
    const read=jobReadState(),live=read.ok&&read.state.active;
    if(!live || live.id!==a.id || live.world!==a.world || live.phase!=="delivery" || live.data.recipientLost || live.data.recipientState)return null;
    live.data.recipientState={wx:origin.x+CITY.orx,wy:origin.y+CITY.ory,hp:30};
    const saved=jobCommit(read.state,0);if(!saved.ok){jdNotice("CLINIC CONTACT NOT SAVED · Check storage or request a partial handoff.");return null;}
    state=live.data.recipientState;
  }
  const point=jobSiteLocal(state);
  if(!point || !jdSupportOffscreen(point.x,point.y) || cityCircleBlocked(point.x,point.y,7,false) || (cityFlagsAt(point.x,point.y)&(F_MOVE|F_IN|F_WATER)))return null;
  const id="jd-clinic|"+a.world+"|"+a.id+(a.contract===JOB_COURIER_SHIFT ? "|stop"+a.data.stop : "");if(tfMem().dead[id])return null;
  const person=tfPerson(id,tfRng(tfHash(id)),{occ:"unemployed"});person.jdClinic={incident:a.id,world:a.world};
  const w=tfSpawnWalker(person,point.x,point.y,false,null);w.jobContact=true;w.jobClinic=true;w.idle=1e6;if(state)w.hp=state.hp;
  JD_CLINIC.actor=person;JD_CLINIC.incident=a.id;JD_CLINIC.world=a.world;return person;
}
function jdClinicTarget(p) {
  const a=jdActive();return jdHasClinic(a) && a.phase==="delivery" && a.data?.recipientMode && !a.data.recipientLost && p?.jdClinic?.incident===a.id && p.jdClinic.world===a.world ? jobSiteLocal(a.data.delivery) : null;
}
function jdClinicReady(a) {
  const p=jdClinicSync(a),site=jobSiteLocal(a?.data?.delivery);
  return !!(site && jdPersonNear(p) && Math.hypot(p.w.x-site.x,p.w.y-site.y)<90 && stClearLine(p.w.x,p.w.y,site.x,site.y,7));
}
function jdClinicCheckpoint(p) {
  const w=p?.w;if(!p?.alive || !p.jdClinic || !w || !Number.isFinite(w.hp) || w.hp<=0)return false;
  const read=jobReadState(),a=read.ok&&read.state.active;
  if(!a || a.id!==p.jdClinic.incident || a.world!==p.jdClinic.world || a.world!==jobWorldKey() || !jdHasClinic(a) || a.phase!=="delivery" || !a.data.recipientMode || a.data.recipientLost)return false;
  const next={wx:w.x+CITY.orx,wy:w.y+CITY.ory,hp:w.hp},old=a.data.recipientState;
  if(old && Math.hypot(old.wx-next.wx,old.wy-next.wy)<8 && old.hp===next.hp)return true;
  a.data.recipientState=next;const result=jobCommit(read.state,0);
  if(!result.ok)jdNotice("CLINIC CONTACT CHECKPOINT NOT SAVED · Check storage.");return result.ok;
}
function jdClinicLost(p) {
  const read=jobReadState(),a=read.ok&&read.state.active;
  if(!a || a.id!==p.jdClinic?.incident || a.world!==p.jdClinic.world || a.world!==jobWorldKey() || !jdHasClinic(a) || a.phase!=="delivery" || !a.data.recipientMode || a.data.recipientLost)return;
  a.data.recipientLost=true;const result=jobCommit(read.state,0);
  jdNotice(result.ok ? "CLINIC CONTACT LOST · Request a partial handoff or withdraw." : "CLINIC CONTACT LOST · Could not save; check storage.");
}
function jdClinicDeliver(id) {
  const a=jdActive();if(!a || a.id!==id || a.contract!==JOB_MEDICAL || a.phase!=="delivery" || !a.data?.recipientMode)return {ok:false,why:"This delivery is no longer available."};
  const result=jdMedicalFinish(a);
  if(result.ok){jdClinicClear(true);if(typeof MAPV!=="undefined")MAPV.lastSig="";}
  return result;
}
// Once the player reaches the rendezvous, let the witness walk the remaining
// short leg to the site rather than stopping on the wrong side of a wall just
// because the player is nearby. Movement still uses the civilian pathfinder.
function jdEscortTarget(p) {
  const a=jdActive(),safe=a && a.phase==="escort" && p?.jdContact?.role==="witness" && p.jdContact.incident===a.id ? jobSiteLocal(a.data.safe) : null;
  return safe && Math.hypot(player.x-safe.x,player.y-safe.y)<70 ? {x:safe.x,y:safe.y,stop:25} : {x:player.x,y:player.y,stop:48};
}
function jdWitnessSafe(a) {
  if(!a || a.phase!=="escort" || a.data?.witnessLost || !player || player.inVehicle || player.roof || (player.flyAlt||0)>2)return false;
  const p=jdContactSync(a),W=p?.w,safe=jobSiteLocal(a.data.safe);
  return !!(p?.alive && W && W.flee<=0 && safe && Math.hypot(player.x-safe.x,player.y-safe.y)<44 && Math.hypot(W.x-safe.x,W.y-safe.y)<90 && stClearLine(W.x,W.y,safe.x,safe.y,7));
}
// All buttons are revalidated at activation, not just when the panel is drawn.
function jdTraceChoice(id, expected, action) {
  const a=jdActive();
  if(!a || a.contract!==JOB_TRACE || a.id!==id || a.phase!==expected || !["clue","follow","search","escort"].includes(expected))
    return {ok:false,why:"This investigation action is no longer available."};
  if(action==="follow" && expected==="clue") {
    if(!jdNear(a))return {ok:false,why:"Return to the clue marker on foot."};
    const result=jobAdvance(id,"clue","follow");
    if(result.ok && typeof MAPV!=="undefined")MAPV.lastSig="";
    return result;
  }
  if(action==="interview" && expected==="follow" && jdContactReady(a)) {const r=jobFinish(id,"contact_filed");if(r.ok)jdContactRelease();return r;}
  if(action==="search" && expected==="follow" && jdContactReady(a)) {
    const person=JD_CONTACT.actor,from=person.w;
    // Find both additional legs before writing anything. Each is the existing
    // body-clear, on-foot route check, not just a random marker.
    const search=jobFindSite(from.x,from.y,CITY.seed+1031),q=jobSiteLocal(search);
    const safe=q && jobFindSite(q.x,q.y,CITY.seed+1201);
    if(!q || !safe)return {ok:false,why:"No reachable search and meeting-point route found. File the statement or try from another location."};
    const result=jobAdvance(id,"follow","search",{search,safe});
    if(result.ok) {jdContactRelease();if(typeof MAPV!=="undefined")MAPV.lastSig="";}
    return result;
  }
  if(action==="escort" && expected==="search" && a.data.inquiry?.status!=="open" && jdWitnessNear(a)) {
    const W=JD_CONTACT.actor.w;
    const result=jobAdvance(id,"search","escort",{witnessState:{wx:W.x+CITY.orx,wy:W.y+CITY.ory,hp:W.hp}});
    if(result.ok) {W.jobEscort=true;if(typeof MAPV!=="undefined")MAPV.lastSig="";}
    return result;
  }
  if(action==="safe" && expected==="escort") {const r=jobFinish(id,"witness_safe");if(r.ok){jdContactRelease();jdSupportClear(true);}return r;}
  if(action==="supported" && expected==="escort") {const r=jobFinish(id,"witness_supported");if(r.ok){jdContactRelease();jdSupportClear(true);}return r;}
  if(action==="handoff") {
    const result=jobFinish(id,"trace_handoff");
    if(result.ok) {if(JD_CONTACT.actor?.alive)jdContactRelease();if(typeof MAPV!=="undefined")MAPV.lastSig="";}
    return result;
  }
  return {ok:false,why:"This investigation action is no longer available."};
}
function jdOffer(kind, recipientMode) {
  const wanted = kind === JOB_PRIORITY ? JOB_PRIORITY : kind === JOB_MEDICAL ? JOB_MEDICAL : (!kind || kind === JOB_DISPATCH.id ? JOB_DISPATCH.id : null);
  if (!wanted || !v15ContractEnabled(wanted)) return {ok:false,why:"This courier call is unavailable in this revision."};
  if (wanted === JOB_MEDICAL && recipientMode && !v15CareerEnabled("J09") && !v15FeatureEnabled("J09.MEDICAL_CONTACT")) return {ok:false,why:"Clinic-contact calls are unavailable in this revision."};
  if (!runActive || !CITY.on || !player || player.inVehicle || player.roof || (player.flyAlt || 0) > 2) return { ok: false, why: "Stand on the ground outside a vehicle to find a call." };
  const read = jobReadState();
  if (!read.ok) return { ok: false, why: read.why };
  if (read.state.active) return { ok: false, why: "An incident is already active." };
  if(kind===JOB_MEDICAL && (!ECO.on || SCN.mode!=="economy"))return {ok:false,why:"Medical stock deliveries require the economy scenario."};
  if(kind===JOB_MEDICAL) {
    if(recipientMode && (typeof TF==="undefined" || !TF.on))return {ok:false,why:"A clinic contact requires active townsfolk in economy mode."};
    const nearby=accNearBuildings(1100).filter(b=>["clinic","hospital"].includes(tfKind(b)));
    if(!nearby.length)return {ok:false,why:"No medical entrance nearby. Move closer to a clinic or hospital and try again."};
    // The first valid pickup may lead away from a reachable clinic. Search a
    // small deterministic set of alternatives before declaring failure. Each
    // leg is checked separately; no offer is written until both pass.
    for(let i=0;i<4;i++) {
      const pickup=jobFindSite(player.x,player.y,CITY.seed+17+i*67),p=jobSiteLocal(pickup);
      if(!p)continue;
      const target=jdMedicalOfferSite(p.x,p.y,nearby);
      if(target)return jobOffer(JOB_MEDICAL,{pickup,delivery:target.site,clinic:target.clinic,...(recipientMode ? {recipientMode:1} : {})});
    }
    return {ok:false,why:"No reachable pickup and medical entrance pair found. Move closer to a clinic or hospital and try again."};
  }
  const a = jobFindSite(player.x, player.y, CITY.seed + 17);
  if (!a) return { ok: false, why: "No reachable pickup nearby. Try another location." };
  const p = jobSiteLocal(a);
  const b = jobFindSite(p.x, p.y, CITY.seed + 109);
  if (!b) return { ok: false, why: "No reachable handoff nearby. Try another location." };
  if (kind !== JOB_PRIORITY) return jobOffer(JOB_DISPATCH.id, { pickup: a, delivery: b });
  // Validate all four legs before saving an offer. The player can take the
  // direct leg, or visit a relay first; neither relies on partial pathfinding.
  const q = jobSiteLocal(b), relay = jobFindSite(q.x, q.y, CITY.seed + 211);
  if (!relay) return { ok: false, why: "No reachable relay nearby. Try another location." };
  const r = jobSiteLocal(relay); let delivery = null;
  for (let k = 0; k < 4 && !delivery; k++) {
    const candidate = jobFindSite(r.x, r.y, CITY.seed + 307 + k * 53), dest = jobSiteLocal(candidate);
    if (dest && jobRouteValid(q.x, q.y, dest.x, dest.y)) delivery = candidate;
  }
  if (!delivery) return { ok: false, why: "No delivery reachable by both routes. Try another location." };
  return jobOffer(JOB_PRIORITY, { pickup: a, assessment: b, relay, delivery });
}
// The case can be set down only after collection, at the player's current
// walkable outdoor position. Store world coordinates in the same atomic job
// checkpoint as the rest of the incident. Older saves (no caseDrop) mean carried.
function jdDropCase() {
  if (!runActive || !CITY.on || !player || player.inVehicle || player.roof || (player.flyAlt || 0) > 2)
    return { ok:false, why:"Stand on open ground outside a vehicle to set down the case." };
  const read=jobReadState(); if(!read.ok)return read;
  const a=read.state.active;
  if (!a || a.world!==jobWorldKey() || !JD_COURIERS.includes(a.contract) || !a.data || ["offer","pickup","dispatch"].includes(a.phase) || jdCaseDropped(a))
    return {ok:false,why:"There is no carried case to set down."};
  if (a.contract===JOB_COURIER_SHIFT && a.data.support?.carrying)return {ok:false,why:"The assistant has the case; take it back before setting it down."};
  if (cityCircleBlocked(player.x,player.y,7,false) || (cityFlagsAt(player.x,player.y) & (F_MOVE|F_IN|F_WATER)))
    return {ok:false,why:"Find an open outdoor spot for the case."};
  a.data.caseDrop={wx:player.x+CITY.orx,wy:player.y+CITY.ory};
  const result=jobCommit(read.state,0);
  if(result.ok && typeof MAPV!=="undefined")MAPV.lastSig="";
  return result;
}
function jdRecoverCase() {
  const read=jobReadState(); if(!read.ok)return read;
  const a=read.state.active;
  if(!a || a.world!==jobWorldKey() || !JD_COURIERS.includes(a.contract) || !jdCaseDropped(a) || !jdNear(a))
    return {ok:false,why:"Return on foot to the case marker."};
  delete a.data.caseDrop;
  const result=jobCommit(read.state,0);
  if(result.ok && typeof MAPV!=="undefined")MAPV.lastSig="";
  return result;
}
// Recovery for a destination that became inaccessible after a call was offered.
// Keep the same incident, phase and fixed payout; only replace the current site.
// Branches still to come must remain reachable from the replacement.
function jdReplan(id, expected) {
  if (!runActive || !CITY.on || !player || player.inVehicle || player.roof || (player.flyAlt || 0) > 2)
    return { ok: false, why: "Stand on the ground outside a vehicle to find a new site." };
  const read = jobReadState(); if (!read.ok) return read;
  const a = read.state.active;
  if (!a || a.id !== id || a.phase !== expected || a.world !== jobWorldKey() ||
      !JD_CONTRACTS.includes(a.contract) || !a.data)
    return { ok: false, why: "This objective is no longer available." };
  if (jdCaseDropped(a)) return { ok:false, why:"Recover your case before moving the objective." };
  if (a.contract===JOB_TRACE && a.phase==="follow" && a.data.contactMode) return {ok:false,why:"The contact cannot be moved. Hand off the unresolved lead or withdraw."};
  const fields = { pickup: "pickup", assessment: "assessment", relay: "relay", delivery: "delivery", secured_delivery: "delivery", scene:"scene", clue:"clue", follow:"follow" };
  const field = Object.prototype.hasOwnProperty.call(fields, a.phase) ? fields[a.phase] : null;
  if (!field || (a.contract===JOB_TRACE && !["scene","clue","follow"].includes(a.phase)) ||
      (a.contract !== JOB_TRACE && ["scene","clue","follow"].includes(a.phase)) ||
      (a.contract === JOB_DISPATCH.id && !["pickup", "delivery"].includes(a.phase)))
    return { ok: false, why: "There is no active objective to move." };
  const next = a.contract===JOB_TRACE ? (a.phase==="scene" ? ["clue"] : a.phase==="clue" ? ["follow"] : []) : a.phase === "pickup" ? [a.contract === JOB_PRIORITY ? "assessment" : "delivery"] :
    a.phase === "assessment" ? ["relay", "delivery"] : a.phase === "relay" ? ["delivery"] : [];
  const future = next.map(k => jobSiteLocal(a.data[k]));
  if (future.some(p => !p)) return { ok: false, why: "The remaining route data is unavailable. You can withdraw the call." };
  const previous = jobSiteLocal(a.data[field]);
  if(a.contract===JOB_MEDICAL && a.phase==="delivery") {
    if(a.data.recipientMode)return {ok:false,why:"The physical clinic contact cannot be moved. Request a partial handoff or withdraw."};
    const building=jdMedicalBuilding(a), site=building && jdMedicalSite(building,player.x,player.y,previous);
    if(!site)return {ok:false,why:"No reachable alternate entrance site. Try closer or request a handoff."};
    a.data.delivery=site;const result=jobCommit(read.state,0);if(result.ok && typeof MAPV!=="undefined")MAPV.lastSig="";return result;
  }
  let replacement = null;
  for (let k = 0; k < 6 && !replacement; k++) {
    const site = jobFindSite(player.x, player.y, (CITY.seed >>> 0) + (id % 100000) * 43 + 401 + k * 67);
    const p = jobSiteLocal(site);
    if (!p || (previous && Math.hypot(previous.x - p.x, previous.y - p.y) < 64) ||
        !jobRouteValid(player.x, player.y, p.x, p.y)) continue;
    if (future.every(q => jobRouteValid(p.x, p.y, q.x, q.y))) replacement = { wx: site.wx, wy: site.wy };
  }
  if (!replacement) return { ok: false, why: "No replacement with reachable remaining routes was found. Try another location or withdraw." };
  a.data[field] = replacement;
  const result = jobCommit(read.state, 0);
  if (result.ok && typeof MAPV !== "undefined") MAPV.lastSig = "";
  return result;
}
// UI callbacks can outlive a panel or the checkpoint they were built from.
// Re-read the durable incident before paying; the core independently rejects
// handoff for a case left on the ground, even through another caller.
function jdHandoff(id, expectedPhase, expectedContract) {
  const read=jobReadState(); if(!read.ok)return read;
  const a=read.state.active;
  if(!a || a.id!==id || a.world!==jobWorldKey() || a.phase!==expectedPhase || a.contract!==expectedContract ||
     !JD_COURIERS.includes(a.contract) || !a.data)
    return {ok:false,why:"This handoff is no longer available"};
  if(jdCaseDropped(a))return {ok:false,why:"Recover your case before requesting a handoff"};
  return jobFinish(id,"handoff");
}
function jdDecide(next) {
  const a = jdActive();
  if (!a || a.contract !== JOB_PRIORITY || a.phase !== "assessment" || jdCaseDropped(a) || !jdNear(a) || !["delivery", "relay"].includes(next)) return { ok: false, why: "Return to the assessment marker." };
  const result = jobAdvance(a.id, "assessment", next);
  if (result.ok) { if (typeof MAPV !== "undefined") MAPV.lastSig = ""; jdClose(); jdNotice(next === "relay" ? "RELAY SELECTED · Follow the cyan marker." : "DIRECT DELIVERY · Follow the cyan marker."); }
  return result;
}
function jdArrive() {
  const a = jdActive(); if (!jdNear(a)) return false;
  if(a.contract===JOB_TRACE) {
    if(a.phase==="clue" || ["search","escort"].includes(a.phase) || (a.phase==="follow" && a.data.contactMode)) { jdOpen();return true; }
    const result=a.phase==="scene" ? jobAdvance(a.id,"scene","clue") : a.phase==="follow" ? jobFinish(a.id,"lead_filed") : {ok:false,why:"Invalid investigation checkpoint"};
    if(!result.ok){jdNotice("Dispatch: "+result.why+". Check storage and retry.");return false;}
    if(typeof MAPV!=="undefined")MAPV.lastSig="";
    if(a.phase==="scene")jdNotice("REPORT REVIEWED · Follow the marker to inspect a lead.");
    else {jdNotice("LEAD FILED · "+result.pay+" added. The missing person remains unlocated.");JOB_DISPATCH.message="Lead filed for "+result.pay+". The missing person remains unlocated; no rescue or responder is simulated.";}
    return true;
  }
  if (jdCaseDropped(a)) { const r=jdRecoverCase(); if(!r.ok) { jdNotice("Dispatch: "+r.why+". Check storage and retry."); return false; } jdNotice("CASE RECOVERED · Follow the cyan objective marker."); return true; }
  if (a.contract === JOB_PRIORITY && a.phase === "assessment") { jdOpen(); return true; }
  if (a.contract === JOB_MEDICAL && a.phase === "delivery" && a.data.recipientMode) { jdOpen(); return true; }
  const next = a.contract === JOB_PRIORITY ? (a.phase === "pickup" ? "assessment" : a.phase === "relay" ? "secured_delivery" : null) : (a.phase === "pickup" ? "delivery" : null);
  const outcome = a.phase === "secured_delivery" ? "secured" : "delivered";
  const result = next ? jobAdvance(a.id, a.phase, next) : a.contract===JOB_MEDICAL ? jdMedicalFinish(a) : jobFinish(a.id, outcome);
  if (!result.ok) { jdNotice("Dispatch: " + result.why + ". Check storage and retry."); return false; }
  if (typeof MAPV !== "undefined") MAPV.lastSig = "";
  if (next) jdNotice(next === "assessment" ? "SUPPLIES COLLECTED · Follow the marker to assess." : next === "secured_delivery" ? "INSULATED TRANSFER COMPLETE · Deliver the case." : "SUPPLIES COLLECTED · Follow the cyan marker to deliver.");
  else { const bonus=a.contract===JOB_MEDICAL ? " · town medicine +"+result.restock : ""; jdNotice("DELIVERED · " + result.pay + " added to your wallet"+bonus+"."); JOB_DISPATCH.message = "Delivered. " + result.pay + " added to your wallet"+bonus+"."; }
  return true;
}
// Only an explicitly chosen creator preference offers this dialog at spawn.
// Never accept/create a call or interrupt a fight, a pause, another panel, an
// old run, or a non-city world. The map shortcut remains available later.
function jdMaybeStartPreferred(p, seed) {
  if (!v15ContractEnabled(JOB_DISPATCH.id) || !runActive || runPaused || !CITY.on || !p || player !== p || runSeed !== seed || p.cid !== CUSTOM_CID || !meta.custom || meta.custom.simJob !== "courier") return false;
  if ((typeof MAPV !== "undefined" && MAPV.open) || (typeof PD !== "undefined" && PD.panel) || (typeof pdActiveFight === "function" && pdActiveFight())) return false;
  if (document.querySelector(".screen.active")) return false;
  jdOpen("Optional supply work — choose a call, or close and find a job later.");
  return !!JOB_DISPATCH.panel;
}
function jdClose() {
  const D = JOB_DISPATCH;
  if (D.panel) { D.panel.remove(); D.panel = null; if (runActive) runPaused = D.wasPaused; }
}
function jdOpen(message) {
  if (!runActive || !CITY.on || !player) return;
  if (typeof MAPV !== "undefined" && MAPV.open) mapClose();
  const D = JOB_DISPATCH;
  if (!D.panel) { D.wasPaused = runPaused; runPaused = true; D.panel = document.createElement("section"); D.panel.id = "jobDispatch"; D.panel.setAttribute("role", "dialog"); D.panel.setAttribute("aria-label", "Local dispatch"); D.panel.setAttribute("aria-modal", "true"); document.body.appendChild(D.panel); }
  const panel = D.panel; panel.innerHTML = "";
  panel.style.cssText = "position:fixed;z-index:99990;left:50%;top:50%;transform:translate(-50%,-50%);width:min(430px,92vw);max-height:86vh;overflow:auto;box-sizing:border-box;padding:18px;background:#081724f7;color:#e5f6ff;border:1px solid #80deea;border-radius:14px;box-shadow:0 10px 36px #000b;font:15px/1.45 system-ui,sans-serif";
  function text(tag, value) { const el = document.createElement(tag); el.textContent = value; panel.appendChild(el); return el; }
  function button(label, fn) { const b = document.createElement("button"); b.type = "button"; b.className = "btn"; b.textContent = label; b.style.cssText = "min-height:48px;min-width:120px;margin:4px 6px 4px 0;white-space:normal"; b.onclick = fn; panel.appendChild(b); return b; }
  text("h2", "LOCAL DISPATCH");
  if (message || D.message) { const m = text("p", message || D.message); m.style.color = "#ffd166"; D.message = ""; }
  const read = jobActive();
  if (read.ok && read.active && !v15JobEnabled(read.active)) {
    text("p", "This saved job is paused for a future revision. Its progress and history have not been changed. When this job returns, return to the same world to resume it.");
    button("CLOSE", jdClose); return;
  }
  if (!read.ok) text("p", "Job data could not be read. Your saved data was not changed.");
  else if (!read.active) {
    text("p", v15AnyCareerAvailable() ? "Choose an available local call. You can decline or end work early." : "Jobs are not available in this revision.");
    if(v15ContractEnabled(JOB_DISPATCH.id)) button("FIND A CALL", () => { const r = jdOffer(); jdOpen(r.ok ? "A call is available." : r.why); });
    if(v15ContractEnabled(JOB_PRIORITY)) button("PRIORITY DELIVERY", () => { const r = jdOffer(JOB_PRIORITY); jdOpen(r.ok ? "A priority call is available." : r.why); });
    if(v15ContractEnabled(JOB_MEDICAL)) button("MEDICAL DELIVERY", () => { const r = jdOffer(JOB_MEDICAL); jdOpen(r.ok ? "A medical delivery is available." : r.why); });
    if(v15ContractEnabled(JOB_MEDICAL) && (v15CareerEnabled("J09") || v15FeatureEnabled("J09.MEDICAL_CONTACT"))) button("MEDICAL DELIVERY + CONTACT", () => { const r = jdOffer(JOB_MEDICAL,true); jdOpen(r.ok ? "A medical delivery with a clinic contact is available." : r.why); });
    if(v15ContractEnabled(JOB_TRACE)) button("WITNESS LEAD", () => { const r=jdTraceOffer(); jdOpen(r.ok ? "An investigative lead is available." : r.why); });
    // A small debrief survives a reload via the existing bounded incident history.
    // Only show facts the incident system recorded; no invented NPC or world effect.
    const history = jobReadState();
    const recent = history.ok ? history.state.history.filter(h => h && JD_CONTRACTS.includes(h.contract)).slice(-3).reverse() : [];
    if (recent.length) {
      const section = document.createElement("section"); section.id = "jobHistory";
      const heading = document.createElement("h3"); heading.textContent = "RECENT CALLS"; section.appendChild(heading);
      const list = document.createElement("ul"); list.style.cssText = "padding-left:1.3em;margin:0 0 10px";
      const outcomes = { delivered: "Delivered", secured: "Secured relay delivered", handoff: "Abstract handoff", lead_filed:"Lead filed; person unlocated", contact_filed:"Contact interviewed; person unlocated", witness_safe:"Missing witness escorted to meeting point", witness_supported:"Witness met unarmed support contact", trace_handoff:"Unresolved lead handed off", completed:"Distribution shift completed", partial:"Distribution shift ended early", declined: "Declined", withdrawn: "Withdrawn" };
      for (const h of recent) {
        const li = document.createElement("li"), label = h.contract === JOB_COURIER_SHIFT ? "Medical distribution shift" : h.contract === JOB_PRIORITY ? "Priority courier" : h.contract === JOB_MEDICAL ? "Medical courier" : h.contract === JOB_TRACE ? "Witness investigation" : "Supply courier";
        const outcome = Object.prototype.hasOwnProperty.call(outcomes, h.outcome) ? outcomes[h.outcome] : "Recorded outcome";
        const pay = Number.isSafeInteger(h.pay) && h.pay >= 0 ? String(h.pay) : "unknown";
        li.textContent = label + " · " + outcome + " · pay " + pay + (h.contract===JOB_MEDICAL && h.outcome==="delivered" && Number.isFinite(h.restock) && h.restock>=0 ? " · town medicine +"+h.restock : "") + (h.world !== jobWorldKey() ? " · another world" : "");
        if(h.contract===JOB_MEDICAL && h.recipient==="met")li.textContent+=" · accepted by clinic contact";
        else if(h.contract===JOB_MEDICAL && h.facts?.recipient==="lost")li.textContent+=" · clinic contact died";
        else if(h.contract===JOB_MEDICAL && h.facts?.recipient==="not_met")li.textContent+=" · clinic contact not met";
        if(h.contract===JOB_TRACE && h.facts) {
          const descriptions={denied:"person denied pressure; unverified",lost:"person died before interview",unresolved:"person's account unresolved",not_pursued:"person's lead not pursued"};
          if(Object.prototype.hasOwnProperty.call(descriptions,h.facts.inquiry))li.textContent+=" · "+descriptions[h.facts.inquiry];
          if(h.facts.witnessCare==="first_aid")li.textContent+=" · witness received first aid";
          if(h.facts.support==="lost")li.textContent+=" · support contact died";
          else if(h.facts.support==="not_met")li.textContent+=" · requested support not met";
        }
        list.appendChild(li);
      }
      section.appendChild(list); panel.appendChild(section);
    }
  } else {
    const a = read.active;
    if (!read.inWorld || !read.supported || !JD_CONTRACTS.includes(a.contract)) {
      text("p", "Your existing job belongs to another world or is unavailable here. Return to its world or withdraw it.");
      button("WITHDRAW JOB", () => { const r=jobWithdraw(a.id); jdOpen(r.ok ? "Job withdrawn; no pay." : r.why); });
    } else if (a.phase === "offer") {
      text("p", a.contract === JOB_TRACE ? "Witness lead · review a report, inspect a possible lead, and choose whether to survey a follow-up for 80 or hand the unresolved lead off for 25. " + (a.data.contactMode ? "A civilian contact is simulated at the follow-up. An optional later tip may lead to a witness, a second unverified interview and an on-foot escort. You can request an unarmed civilian support contact; no arrest or police response is simulated." : "No missing person, contact, suspect, or responder NPC is simulated in this scenario.") + " This is a short investigation, not a full detective career. No timer. Routes were checked on foot when offered." : a.contract === JOB_MEDICAL ? "Medical courier · collect a case and deliver to " + String(a.data.clinic?.name || "the medical entrance") + ". Full delivery pays 140 and adds up to six medicine to shared town stock (capped). Economy scenario only. " + (a.data.recipientMode ? "A damageable civilian clinic contact must meet you at the entrance; not a doctor or responder. " : "No recipient NPC is simulated. ") + "After pickup you can request an abstract handoff for 35, with no stock effect." : a.contract === JOB_PRIORITY ? "Priority courier · collect a temperature-sensitive case and assess its condition. Choose a direct delivery for 120, or a relay transfer and delivery for 155. No timer; all offered routes were checked on foot. Relay and handoff are abstract, not simulated NPCs." : "Supply courier · collect a case, then deliver it. No timer. Complete delivery for 90; after pickup, request an abstract handoff for 30. Local routes were checked on foot when offered.");
      button("ACCEPT", () => { const r=jobAccept(a.id); if (r.ok) { if(typeof MAPV!=="undefined") MAPV.lastSig=""; jdClose(); jdNotice(a.contract===JOB_TRACE ? "CALL ACCEPTED · Follow the cyan marker to review the report." : "CALL ACCEPTED · Follow the cyan marker to collect supplies."); } else jdOpen(r.why); });
      button("DECLINE", () => { const r=jobWithdraw(a.id); jdOpen(r.ok ? "Call declined; no penalty." : r.why); });
    } else if(a.contract===JOB_TRACE) {
      const objective=a.phase==="search" && a.data.inquiry?.status==="open" ? "find the person the witness described" : a.phase==="scene" ? "review the report" : a.phase==="clue" ? "inspect the possible lead" : a.phase==="follow" ? (a.data.contactMode ? "interview the contact" : "survey the follow-up site") : a.phase==="search" ? "search for the missing witness" : a.phase==="escort" ? "escort the witness to the meeting point" : "review the incident";
      text("p","Witness lead: follow the cyan marker on foot to "+objective+". "+(["search","escort"].includes(a.phase)?"A witness is simulated; any allegation is unverified. Optional support is an unarmed civilian, not police.":"The missing person has not been located; no arrest or responder is simulated."));
      if(a.phase==="follow" && a.data.contactMode) {
        const person=jdContactSync(a);
        if(a.data.contactLost || (person && !person.alive)) text("p","The contact has died; no interview can be filed. You can hand off the unresolved lead or withdraw.");
        else if(!TF.on) text("p","The civilian contact is unavailable in this scenario. Return to an economy or apocalypse run, or hand off the unresolved lead.");
        else if(person?.w && person.w.flee>0) text("p","The contact is fleeing danger. Move away from the threat and wait until they are calm. If your carry options always aim weapons, change them in Options.");
        else if(jdContactReady(a)) {
          text("p","The contact reports hearing a disturbance near the site but did not see who was involved or where the person went. This is a lead, not a rescue or identification.");
          button("FILE CONTACT STATEMENT · 80",()=>{const r=jdTraceChoice(a.id,"follow","interview");jdOpen(r.ok ? "Statement filed for 80. The missing person remains unlocated." : r.why);});
          button("FOLLOW ANOTHER TIP",()=>{const r=jdTraceChoice(a.id,"follow","search");if(r.ok){jdClose();jdNotice("SEARCH SITE MARKED · Follow the cyan marker.");}else jdOpen(r.why);});
        } else text("p","Approach the civilian contact at the cyan marker to interview them. If the saved location is blocked or unavailable, hand off the unresolved lead.");
      }
      if(["search","escort"].includes(a.phase)) {
        const person=jdContactSync(a);
        if(a.phase==="search" && a.data.inquiry?.status==="open") {
          const other=jdInquirySync(a);
          text("p","The witness described a person who pressured them. This person is not proven responsible; ask for their account or return to the witness. No arrest is simulated.");
          if(jdPersonNear(other))button("ASK FOR THEIR ACCOUNT",()=>{const r=jdInquiryChoice(a.id,"speak");jdOpen(r.ok ? "The person denies pressuring the witness. Both accounts remain unverified; return to the witness." : r.why);});
          else text("p",other?.w?.flee>0 ? "They are fleeing danger; wait until they are calm." : "Approach the marked person on foot. If unavailable, return to the witness.");
          button("RETURN TO WITNESS · LEAD UNRESOLVED",()=>{const r=jdInquiryChoice(a.id,"leave");jdOpen(r.ok ? "Lead left unresolved. Return to the witness." : r.why);});
        } else if(a.data.witnessLost || (person && !person.alive)) text("p","The witness has died; the case cannot be recorded as a rescue. Hand off unresolved or withdraw.");
        else if(!TF.on) text("p","The witness is unavailable in this scenario. Return to economy or apocalypse, or hand off unresolved.");
        else if(person?.w?.flee>0) text("p","The witness is fleeing danger. Move away from the threat and wait for them to calm down.");
        else if(a.phase==="search" && jdWitnessNear(a)) {
          text("p","You located the missing witness. They ask you to walk with them to a meeting point. They describe someone who pressured them; the claim has not been verified.");
          if(!a.data.inquiry)button("FOLLOW THE PERSON'S LEAD",()=>{const r=jdInquiryBegin(a.id);if(r.ok){jdClose();jdNotice("INTERVIEW SITE MARKED · The account is unverified.");}else jdOpen(r.why);});
          if(a.data.inquiry?.status==="spoke")text("p","The person denied pressuring the witness. Neither account proves responsibility; no arrest was made.");
          else if(a.data.inquiry?.status==="lost")text("p","The person died before an interview; the allegation remains unresolved.");
          else if(a.data.inquiry?.status==="not_pursued")text("p","You left the person's lead unresolved.");
          if(!a.data.support)button("REQUEST UNARMED SUPPORT",()=>{const r=jdSupportRequest(a.id,"search");jdOpen(r.ok ? "Unarmed civilian support was requested. They must reach the unguarded meeting point on foot." : r.why);});
          else text("p",a.data.support.status==="lost" ? "The support contact died; the meeting remains unguarded." : "Unarmed support was requested. They can be hurt or flee. After reloading, they return only from off screen; the unguarded meeting is still available.");
          if(jdWitnessAidReady(a))button("GIVE FIRST AID · ONCE",()=>{const r=jdWitnessAid(a.id,"search");jdOpen(r.ok ? "Basic first aid given. The witness is still vulnerable; no medic is simulated." : r.why);});
          button("ESCORT THE WITNESS",()=>{const r=jdTraceChoice(a.id,"search","escort");if(r.ok){jdClose();jdNotice("ESCORT STARTED · Stay close and walk to the cyan marker.");}else jdOpen(r.why);});
        } else if(a.phase==="escort") {
          text("p","Walk with the witness to the meeting point. The site is not guarded. They follow on foot and can be hurt or flee. If you get too far away the marker leads back to them; wait if they are behind. No responding officer is simulated.");
          if(!a.data.support && jdPersonNear(person))button("REQUEST UNARMED SUPPORT",()=>{const r=jdSupportRequest(a.id,"escort");jdOpen(r.ok ? "Unarmed civilian support was requested. They must reach the unguarded meeting point on foot." : r.why);});
          else if(a.data.support)text("p",a.data.support.status==="lost" ? "The support contact died; the meeting remains unguarded." : "Unarmed support was requested. They can be hurt, flee or be unable to arrive. After reloading, they return only from off screen; the unguarded meeting is still available.");
          if(jdWitnessSupported(a))button("HAND OFF TO SUPPORT · 180",()=>{const r=jdTraceChoice(a.id,"escort","supported");jdOpen(r.ok ? "Witness met the unarmed support contact at the meeting point. No guard, police response or arrest is simulated." : r.why);});
          if(jdWitnessAidReady(a))button("GIVE FIRST AID · ONCE",()=>{const r=jdWitnessAid(a.id,"escort");jdOpen(r.ok ? "Basic first aid given. The witness is still vulnerable; no medic is simulated." : r.why);});
          if(jdWitnessSafe(a))button("COMPLETE ESCORT · 180",()=>{const r=jdTraceChoice(a.id,"escort","safe");jdOpen(r.ok ? "Witness escorted to the unguarded meeting point for 180. No handoff to a support contact was recorded." : r.why);});
        } else text("p","Approach the person at the marked site on foot. If they cannot be reached, hand off the unresolved case.");
      }
      if(a.phase==="clue" && jdNear(a)) {
        text("p","The report points toward a possible follow-up location. It is a lead, not proof of where the person is or who was involved.");
        button(a.data.contactMode ? "MEET CONTACT · 80" : "SURVEY FOLLOW-UP · 80",()=>{const r=jdTraceChoice(a.id,"clue","follow");if(r.ok){jdClose();jdNotice(a.data.contactMode ? "CONTACT SELECTED · Follow the cyan marker." : "FOLLOW-UP SELECTED · Follow the cyan marker.");}else jdOpen(r.why);});
      }
      if(["clue","follow","search","escort"].includes(a.phase)) button("HAND OFF UNRESOLVED · 25",()=>{const r=jdTraceChoice(a.id,a.phase,"handoff");jdOpen(r.ok ? "Unresolved lead handed off for 25. No responder is simulated." : r.why);});
      text("p",(a.phase==="follow" && a.data.contactMode) || ["search","escort"].includes(a.phase) ? "If a person is unreachable, hand off the unresolved lead or withdraw without penalty." : "If the objective is blocked, find a new site or withdraw without penalty.");
      if(!((a.phase==="follow" && a.data.contactMode) || ["search","escort"].includes(a.phase))) button("FIND NEW OBJECTIVE SITE",()=>{const r=jdReplan(a.id,a.phase);jdOpen(r.ok ? "New objective saved. Follow the cyan marker." : r.why);});
      button("WITHDRAW · NO PAY",()=>{const r=jobWithdraw(a.id);if(r.ok && typeof MAPV!=="undefined")MAPV.lastSig="";jdOpen(r.ok ? "Investigation withdrawn; no pay." : r.why);});
    } else {
      const dropped = jdCaseDropped(a);
      const objective = dropped ? "recover your case" : a.phase === "pickup" ? "collect the case" : a.phase === "assessment" ? "assess the case" : a.phase === "relay" ? "transfer to insulated packaging" : "deliver the case";
      text("p", "Current objective: reach the cyan marker on foot and " + objective + ".");
      text("p", "You may leave this call at any time; it does not pause other world activity.");
      if(a.contract===JOB_MEDICAL) {
        text("p", "Medical destination: "+String(a.data.clinic?.name || "medical entrance")+". Completion affects shared town medicine stock only in the economy scenario; "+(a.data.recipientMode ? "the clinic contact is a civilian, not a doctor or responder." : "no recipient NPC is simulated."));
        if(a.data.recipientMode && a.phase==="delivery") {
          const person=jdClinicSync(a);
          text("p",a.data.recipientLost ? "The contact died; use a partial handoff or withdraw." : person?.w?.flee>0 ? "The contact is fleeing. Wait for them to return to the entrance." : "Meet the calm contact at the entrance. They can walk in from off screen, be hurt or flee. After reload, move away from their last saved position if needed so they can reappear off screen.");
          if(jdClinicReady(a) && !jdCaseDropped(a))button("DELIVER TO CONTACT · 140",()=>{const r=jdClinicDeliver(a.id);jdOpen(r.ok ? "The clinic contact accepted the case. Shared town medicine +"+r.restock+"; "+r.pay+" paid. No doctor or responder is simulated." : r.why);});
        }
      }
      if (!dropped && a.contract === JOB_PRIORITY && a.phase === "assessment" && jdNear(a)) {
        text("p", "The case's temperature indicator is uncertain. Deliver directly, or take it to the relay for an insulated transfer. There is no simulated temperature timer.");
        button("DIRECT · 120", () => { const r=jdDecide("delivery"); if(!r.ok)jdOpen(r.why); });
        button("RELAY · 155", () => { const r=jdDecide("relay"); if(!r.ok)jdOpen(r.why); });
      }
      if (!dropped && ((a.contract === JOB_PRIORITY && a.phase !== "pickup") || ([JOB_DISPATCH.id,JOB_MEDICAL].includes(a.contract) && a.phase === "delivery"))) {
        const pay=a.contract===JOB_MEDICAL?35:30;
        button("REQUEST HANDOFF · "+pay, () => { const r=jdHandoff(a.id,a.phase,a.contract); if(r.ok && typeof MAPV!=="undefined") MAPV.lastSig=""; jdOpen(r.ok ? "Supplies reassigned; "+pay+" added to your wallet. No responder or stock effect is simulated." : r.why); });
      }
      if (!dropped && a.phase !== "pickup") button("SET DOWN CASE", () => { const r=jdDropCase(); jdOpen(r.ok ? "Case set down. Recover it at the cyan marker before continuing." : r.why); });
      if (dropped) text("p", "Your case is on the ground at the cyan marker. Recover it before continuing or requesting a handoff. It does not drop automatically.");
      if (!dropped && !(a.contract===JOB_MEDICAL && a.phase==="delivery" && a.data.recipientMode)) text("p", "If the current objective is blocked, dispatch can look for a new site; your stage and payout stay the same.");
      if (!dropped && !(a.contract===JOB_MEDICAL && a.phase==="delivery" && a.data.recipientMode)) button("FIND NEW OBJECTIVE SITE", () => { const r=jdReplan(a.id,a.phase); jdOpen(r.ok ? "New objective saved. Follow the cyan marker." : r.why); });
      button("WITHDRAW · NO PAY", () => { const r=jobWithdraw(a.id); if(typeof MAPV!=="undefined") MAPV.lastSig=""; jdOpen(r.ok ? "Job withdrawn; no pay." : r.why); });
    }
  }
  button("CLOSE", jdClose);
}
function jdDrawMap(g, toS) {
  const a = jdActive(), p = jdTarget(a); if (!p) return;
  const [x,y] = toS((p.x+CITY.orx)/32, (p.y+CITY.ory)/32);
  g.save(); g.fillStyle="#21d4ef"; g.strokeStyle="#071c24"; g.lineWidth=3; g.beginPath(); g.arc(x,y,9,0,Math.PI*2); g.fill(); g.stroke();
  g.font="bold 13px sans-serif";g.textAlign="center";g.textBaseline="middle";g.fillStyle="#071c24";g.fillText("✦",x,y);g.restore();
}
function jdWorld(g) {
  const a = jdActive(), p = jdTarget(a); if (!p) return;
  if (JD_COURIERS.includes(a.contract) && a.phase !== "offer" && a.phase !== "pickup" && a.phase !== "dispatch" && !jdCaseDropped(a)) {
    const carrier=a.contract===JOB_COURIER_SHIFT && a.data.support?.carrying ? JD_SUPPORT.actor?.w : player;
    if(carrier){g.save(); g.translate(carrier.x-19,carrier.y-25); g.fillStyle="#204656";g.strokeStyle="#a6f7ff";g.lineWidth=1.5;g.fillRect(-6,-7,12,9);g.strokeRect(-6,-7,12,9);g.beginPath();g.arc(0,-7,2,Math.PI,0);g.stroke();g.restore();}
  }
  if (Math.hypot(player.x-p.x,player.y-p.y)>800) return;
  g.save(); g.translate(p.x,p.y);g.strokeStyle="#21d4ef";g.lineWidth=2;g.beginPath();g.arc(0,0,14+2*Math.sin(runTime*3),0,7);g.stroke();
  if(!(a.contract===JOB_TRACE && ["follow","search"].includes(a.phase) && a.data.contactMode)) {
    g.fillStyle=a.contract===JOB_TRACE ? "#e9f7ec" : "#204656";g.fillRect(-9,-13,18,13);g.strokeRect(-9,-13,18,13);g.fillStyle=a.contract===JOB_TRACE ? "#215160" : "#a6f7ff";g.fillRect(-5,-10,10,2);
  }g.restore();
}
function jdScreen(g) {
  const a=jdActive(),p=jdTarget(a);if(!p||!runActive||MAPV.open)return;
  if (!(typeof HUDL !== "undefined" && HUDL.enabled && HUDL.miniHidden)) {
    const r=miniRect(),mpp=MAPV.miniSizes[MAPV.mini],[px,py]=mapPlayerM();
    let dx=((p.x+CITY.orx)/32-px)/mpp,dy=((p.y+CITY.ory)/32-py)/mpp;
    const lim=r.S/2-10,k=Math.min(1,lim/Math.max(Math.abs(dx),Math.abs(dy),1));dx*=k;dy*=k;
    g.save();g.fillStyle="#21d4ef";g.strokeStyle="#071c24";g.lineWidth=2;g.beginPath();g.arc(r.x+r.S/2+dx,r.y+r.S/2+dy,5,0,7);g.fill();g.stroke();g.restore();
  }
}
(function jdWire() {
  const fit=window.findInteractTarget,twi=window.triggerWorldInteract;
  window.findInteractTarget=function(){const a=jdActive(),p=jdTarget(a);if(a&&p&&jdNear(a))return {kind:"jobSupply",x:p.x,y:p.y,label:a.contract===JOB_TRACE?(a.phase==="scene"?"REVIEW REPORT":a.phase==="clue"?"INSPECT LEAD":a.phase==="search"?(a.data.inquiry?.status==="open"?"TALK TO PERSON":"TALK TO WITNESS"):a.phase==="escort"?"ESCORT STATUS":a.data.contactMode?"TALK TO CONTACT":"SURVEY SITE"):jdCaseDropped(a)?"RECOVER CASE":a.phase==="pickup"?"COLLECT SUPPLIES":a.phase==="assessment"?"ASSESS SUPPLIES":a.phase==="relay"?"TRANSFER SUPPLIES":"DELIVER SUPPLIES"};if(jdWitnessAidReady(a)){const w=JD_CONTACT.actor.w;return {kind:"jobSupply",x:w.x,y:w.y,label:"HELP WITNESS"};}return fit.apply(this,arguments);};
  window.triggerWorldInteract=function(){const a=jdActive();if(a&&jdNear(a)){jdArrive();return;}if(jdWitnessAidReady(a)){jdOpen();return;}return twi.apply(this,arguments);};
  V10.onStep.push(dt=>{
    if(CITY.on&&runActive&&player) {
      const p=jdContactSync(jdActive());JD_CONTACT.saveTimer+=dt;
      if(p && p.w && p.alive && JD_CONTACT.saveTimer>=3) {JD_CONTACT.saveTimer=0;jdContactCheckpoint(p);}
      const other=jdInquirySync(jdActive());JD_INQUIRY.saveTimer+=dt;
      if(other && other.w && other.alive && JD_INQUIRY.saveTimer>=3) {JD_INQUIRY.saveTimer=0;jdInquiryCheckpoint(other);}
      const support=jdSupportSync(jdActive());JD_SUPPORT.saveTimer+=dt;
      if(support && support.w && support.alive && JD_SUPPORT.saveTimer>=3) {JD_SUPPORT.saveTimer=0;jdSupportCheckpoint(support);}
      const clinic=jdClinicSync(jdActive());JD_CLINIC.saveTimer+=dt;
      if(clinic && clinic.w && clinic.alive && JD_CLINIC.saveTimer>=3) {JD_CLINIC.saveTimer=0;jdClinicCheckpoint(clinic);}
    } else {jdContactClear();jdInquiryClear(false);jdSupportClear(false);jdClinicClear(false);}
  });
  V10.onRenderWorld.push(g=>{if(CITY.on&&runActive&&player){try{JD_SUPPORT.view=camView(0);}catch(e){JD_SUPPORT.view=null;}jdWorld(g);}});
  V10.onRenderScreen.push(g=>{if(CITY.on&&runActive&&player)jdScreen(g);});
  V10.onRunReset.push(()=>{if(JD_CONTACT.actor?.alive)jdContactCheckpoint(JD_CONTACT.actor);if(JD_INQUIRY.actor?.alive)jdInquiryCheckpoint(JD_INQUIRY.actor);if(JD_SUPPORT.actor?.alive)jdSupportCheckpoint(JD_SUPPORT.actor);if(JD_CLINIC.actor?.alive)jdClinicCheckpoint(JD_CLINIC.actor);jdClose();jdContactClear();jdInquiryClear(false);jdSupportClear(false);jdClinicClear(false);JD_SUPPORT.view=null;JOB_DISPATCH.message="";});
  V10.onRunStart.push(p=>{const seed=runSeed; setTimeout(()=>jdMaybeStartPreferred(p,seed),600);});
  window.addEventListener("keydown", e => { if(e.key === "Escape" && JOB_DISPATCH.panel) { e.preventDefault(); e.stopImmediatePropagation(); jdClose(); } }, true);
})();
// EOF:js/jobdispatch.js
