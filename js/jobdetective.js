// FILE: js/jobdetective.js
// PART: 15.6.6-part2 — evidence-based crime-scene and person-of-interest calls.
"use strict";

const JD_MEMORY_MAX_WORLDS=8,JD_MEMORY_MAX_WITNESSES=16,JD_MEMORY_MAX_POI=16,JD_MEMORY_MAX_SCENES=24;
function jdMemoryRecordValid(r,type){
  if(!r||typeof r!=="object"||Array.isArray(r))return false;
  if(type==="witness")return typeof r.id==="string"&&r.id.length>0&&r.id.length<=180&&typeof r.name==="string"&&r.name.length>0&&r.name.length<=80&&Number.isSafeInteger(r.sourceCase)&&r.sourceCase>0&&["witness_safe","witness_supported","witness_protected","trace_handoff","witness_lost"].includes(r.outcome);
  if(type==="scene")return typeof r.poiId==="string"&&r.poiId.length>0&&r.poiId.length<=180&&typeof r.witnessId==="string"&&r.witnessId.length>0&&r.witnessId.length<=180&&Number.isSafeInteger(r.witnessCase)&&r.witnessCase>0&&Number.isSafeInteger(r.sceneCase)&&r.sceneCase>0&&typeof r.vehicleKey==="string"&&r.vehicleKey.length>0&&r.vehicleKey.length<=180&&Number.isSafeInteger(r.model)&&Number.isFinite(r.wx)&&Number.isFinite(r.wy)&&r.evidence==="vehicle_present_at_scene"&&r.ownership==="not_established"&&r.guilt==="not_established";
  return typeof r.id==="string"&&r.id.length>0&&r.id.length<=180&&typeof r.name==="string"&&r.name.length>0&&r.name.length<=80&&Number.isSafeInteger(r.sourceCase)&&r.sourceCase>0&&Number.isSafeInteger(r.interviews)&&r.interviews>0&&r.interviews<=100&&r.statement==="denied"&&(r.status===undefined||["interviewed","escaped","surrendered","arrested"].includes(r.status));
}
function jdMemoryLedger(state,world,create=false){
  if(!state||!world||typeof world!=="string")return null;
  let root=state.detectiveMemory;
  if(root===undefined&&create){root={v:1,worlds:{}};state.detectiveMemory=root;}
  if(!root||typeof root!=="object"||Array.isArray(root)||root.v!==1||!root.worlds||typeof root.worlds!=="object"||Array.isArray(root.worlds)||Object.keys(root.worlds).length>JD_MEMORY_MAX_WORLDS)return null;
  let ledger=root.worlds[world];
  if(ledger===undefined&&create){ledger={witnesses:[],poi:[],scenes:[]};root.worlds[world]=ledger;}
  if(ledger===undefined)return {witnesses:[],poi:[],scenes:[]};
  if(!ledger||typeof ledger!=="object"||Array.isArray(ledger)||!Array.isArray(ledger.witnesses)||ledger.witnesses.length>JD_MEMORY_MAX_WITNESSES||!Array.isArray(ledger.poi)||ledger.poi.length>JD_MEMORY_MAX_POI||
    (ledger.scenes!==undefined&&(!Array.isArray(ledger.scenes)||ledger.scenes.length>JD_MEMORY_MAX_SCENES))||
    !ledger.witnesses.every(r=>jdMemoryRecordValid(r,"witness"))||!ledger.poi.every(r=>jdMemoryRecordValid(r,"poi"))||!(ledger.scenes||[]).every(r=>jdMemoryRecordValid(r,"scene")))return null;
  if(create&&!Array.isArray(ledger.scenes))ledger.scenes=[];
  return ledger;
}
function jdRememberWitness(state,a,outcome){
  if(!a||a.contract!==JOB_TRACE||!["witness_safe","witness_supported","witness_protected"].includes(outcome)||!a.data?.witnessState)return false;
  const person=JD_CONTACT.actor;
  if(!person||JD_CONTACT.role!=="witness"||JD_CONTACT.incident!==a.id||JD_CONTACT.world!==a.world||typeof person.name!=="string")return false;
  const ledger=jdMemoryLedger(state,a.world,true);if(!ledger)return false;
  const id=person.id;if(ledger.witnesses.some(r=>r.id===id))return true;
  if(ledger.witnesses.length>=JD_MEMORY_MAX_WITNESSES)ledger.witnesses.shift();
  const status=outcome==="trace_handoff"?(person.alive?"trace_handoff":"witness_lost"):outcome;
  ledger.witnesses.push({id,name:person.name.slice(0,80),sourceCase:a.id,outcome:status});return true;
}
function jdLatestWitnessMemory(state,world){
  const ledger=jdMemoryLedger(state,world,false);if(!ledger)return null;
  for(let i=ledger.witnesses.length-1;i>=0;i--){
    const w=ledger.witnesses[i],poiId="jd-poi|"+world+"|"+w.sourceCase,priorInterview=ledger.poi.find(r=>r.id===poiId)||null;
    if(priorInterview?.status==="arrested"||priorInterview?.status==="surrendered")continue;
    if(!(typeof tfMem==="function"&&tfMem().dead?.[poiId])){
      const linkedScene=(ledger.scenes||[]).filter(r=>r.poiId===poiId&&r.witnessId===w.id&&r.witnessCase===w.sourceCase).at(-1)||null;
      return {witness:w,poiId,priorInterview:priorInterview?Object.assign({status:priorInterview.status||"interviewed"},priorInterview):null,linkedScene};
    }
  }
  return null;
}
function jdDetectiveMemorySnapshot(latest){
  if(!latest||!jdMemoryRecordValid(latest.witness,"witness"))return null;
  const w=latest.witness,sc=latest.linkedScene;
  return {witness:{id:w.id,name:w.name,sourceCase:w.sourceCase,outcome:w.outcome},poiId:latest.poiId,
    priorInterview:latest.priorInterview?{sourceCase:latest.priorInterview.sourceCase,interviews:latest.priorInterview.interviews,statement:latest.priorInterview.statement,status:latest.priorInterview.status||"interviewed"}:null,
    linkedScene:sc&&jdMemoryRecordValid(sc,"scene")?{sceneCase:sc.sceneCase,witnessId:sc.witnessId,witnessCase:sc.witnessCase,poiId:sc.poiId,vehicleKey:sc.vehicleKey,model:sc.model,wx:sc.wx,wy:sc.wy,evidence:sc.evidence,ownership:sc.ownership,guilt:sc.guilt}:null};
}
function jdRecordSceneEvidence(state,a,outcome){
  if(outcome!=="scene_filed")return true;
  const m=a?.data?.memory;if(m==null)return true;
  if(!m||!jdMemoryRecordValid(m.witness,"witness")||typeof m.poiId!=="string"||m.poiId!=="jd-poi|"+a.world+"|"+m.witness.sourceCase)return false;
  const ledger=jdMemoryLedger(state,a.world,true),e=a.data.evidence,v=a.data.vehicle,w=ledger&&ledger.witnesses.find(r=>r.id===m.witness.id);
  if(!ledger||!e||!v||!w||w.sourceCase!==m.witness.sourceCase||w.outcome!==m.witness.outcome||e.captured!==true||e.vehicleKey!==v.key||e.model!==v.model||e.wx!==v.wx||e.wy!==v.wy)return false;
  const row={poiId:m.poiId,witnessId:w.id,witnessCase:w.sourceCase,sceneCase:a.id,vehicleKey:v.key,model:v.model,wx:v.wx,wy:v.wy,evidence:"vehicle_present_at_scene",ownership:"not_established",guilt:"not_established"};
  ledger.scenes=Array.isArray(ledger.scenes)?ledger.scenes:[];
  const old=ledger.scenes.find(r=>r.sceneCase===a.id);if(old)ledger.scenes[ledger.scenes.indexOf(old)]=row;else{if(ledger.scenes.length>=JD_MEMORY_MAX_SCENES)ledger.scenes.shift();ledger.scenes.push(row);}
  return true;
}
function jdRecordPoiAccountability(state,a,outcome){
  const status={poi_filed:"interviewed",poi_escaped:"escaped",poi_surrendered:"surrendered",poi_arrested:"arrested"}[outcome];
  if(!a||a.contract!==JOB_POI_FOLLOWUP||!status)return false;
  const ledger=jdMemoryLedger(state,a.world,true),d=a.data,m=d?.memory,p=d?.poiState;
  if(!ledger||!m||!p||p.id!==m.poiId||typeof p.name!=="string"||!Number.isSafeInteger(m.witness?.sourceCase))return false;
  const prev=ledger.poi.find(r=>r.id===p.id),count=Math.min(100,(prev?.interviews||0)+1);
  const row={id:p.id,name:p.name.slice(0,80),sourceCase:a.id,interviews:count,statement:"denied",status,
    witnessId:m.witness.id,witnessCase:m.witness.sourceCase,...(m.linkedScene?.sceneCase?{sceneCase:m.linkedScene.sceneCase}:{}),wx:p.wx,wy:p.wy,hp:p.hp};
  if(prev)ledger.poi[ledger.poi.indexOf(prev)]=row;else {if(ledger.poi.length>=JD_MEMORY_MAX_POI)ledger.poi.shift();ledger.poi.push(row);}
  return true;
}

jobRegister({id:JOB_POI_FOLLOWUP,role:"detective",start:"briefing",
  edges:{briefing:["approach"],approach:["resolve"],resolve:["file","custody"],file:[],custody:[]},
  endings:{poi_filed:{from:["file"],pay:90},poi_escaped:{from:["resolve"],pay:30},poi_surrendered:{from:["custody"],pay:60},poi_arrested:{from:["custody"],pay:120},poi_handoff:{from:["briefing","approach","resolve","file","custody"],pay:25}},
  finishGuard:"detective_poi_finish",historyHook:"detective_poi_history"});
JOB_CORE.guards.detective_poi_finish=(a,outcome)=>{
  if(!a||a.contract!==JOB_POI_FOLLOWUP||!a.data)return false;
  if(outcome==="poi_handoff")return ["briefing","approach","resolve","file","custody"].includes(a.phase);
  if(outcome==="poi_filed")return a.phase==="file"&&a.data.statementRecorded===true&&jdPoiStatementValid(a);
  if(outcome==="poi_escaped")return a.phase==="resolve"&&a.data.statementRecorded===true&&a.data.disposition==="escaped"&&jdPoiStatementValid(a);
  if(outcome==="poi_surrendered")return a.phase==="custody"&&a.data.disposition==="surrendered"&&jdPoiStatementValid(a)&&jdPoiAtStation(a);
  if(outcome==="poi_arrested")return a.phase==="custody"&&a.data.disposition==="arrested"&&jdPoiStatementValid(a)&&jdPoiArrestEligible(a)&&jdPoiAtStation(a);
  return false;
};
JOB_CORE.historyHooks.detective_poi_history=(a,outcome)=>({
  caseType:"person_of_interest_followup",person:a.data?.poiState?.name||"unknown",statement:a.data?.statementRecorded?"denied":"not_recorded",
  priorWitness:a.data?.memory?.witness?.name||"none",priorWitnessOutcome:a.data?.memory?.witness?.outcome||"none",
  accountability:outcome==="poi_filed"?"statement_recorded_not_guilt":outcome==="poi_arrested"?"arrest_for_investigation":outcome==="poi_surrendered"?"voluntary_station_handoff":outcome==="poi_escaped"?"subject_departed_followup_open":"unresolved",
  disposition:a.data?.disposition||"none",priorSceneCase:a.data?.memory?.linkedScene?.sceneCase||null,
  physicalEvidence:a.data?.memory?.linkedScene?.evidence||"none",ownership:"not_established",guilt:"not_established",
  priorInterviewCount:Number.isSafeInteger(a.data?.memory?.priorInterview?.interviews)?a.data.memory.priorInterview.interviews:0
});
jobRegister({id:JOB_SCENE_CASE,role:"detective",start:"scene",
  edges:{scene:["document"],document:["file"],file:[]},
  endings:{scene_filed:{from:["file"],pay:100},scene_handoff:{from:["scene","document","file"],pay:25}},
  finishGuard:"detective_scene_finish",historyHook:"detective_scene_history"});
JOB_CORE.guards.detective_scene_finish=(a,outcome)=>{
  if(!a||a.contract!==JOB_SCENE_CASE||!a.data)return false;
  if(outcome==="scene_handoff")return ["scene","document","file"].includes(a.phase);
  return outcome==="scene_filed"&&a.phase==="file"&&a.data.sceneReviewed===true&&a.data.evidenceCaptured===true&&jdcSceneEvidenceValid(a);
};
JOB_CORE.historyHooks.detective_scene_history=(a,outcome)=>({
  caseType:"vehicle_scene",evidence:outcome==="scene_filed"?"vehicle_documented":"incomplete",
  vehicleKey:a.data?.vehicle?.key||"unknown",vehicleModel:Number.isSafeInteger(a.data?.vehicle?.model)?a.data.vehicle.model:null,
  linkedWitness:a.data?.memory?.witness?.id||null,linkedWitnessCase:a.data?.memory?.witness?.sourceCase||null,linkedPoiId:a.data?.memory?.poiId||null,
  ownership:"not_established",guilt:"not_assessed"
});

function jdcVehicleKey(p){return p&&typeof p.key==="string"?p.key:"dyn"+p.x+","+p.y;}
function jdcSceneVehiclesNear(sx,sy){
  const tx=Math.floor((sx+CITY.orx)/16),ty=Math.floor((sy+CITY.ory)/16),cx=tx>>7,cy=ty>>7,found=[];
  for(let oy=-1;oy<=1;oy++)for(let ox=-1;ox<=1;ox++){
    const C=cityChunk(cx+ox,cy+oy);
    for(const p of C.props){
      if(!p||p.t!=="car"||p.wreck)continue;
      const key=jdcVehicleKey(p);if(cityRT.used.has(key)||VEH.byKey.has(key))continue;
      const pose=vehPropPose(p),d=Math.hypot(pose.x-sx,pose.y-sy);
      if(d<=1100)found.push({p,key,pose,d});
    }
  }
  return found.sort((a,b)=>a.d-b.d||a.key.localeCompare(b.key)).slice(0,80);
}
function jdcSceneApproach(v,sx,sy){
  const dx=v.pose.x-sx,dy=v.pose.y-sy,d=Math.hypot(dx,dy)||1,ux=dx/d,uy=dy/d;
  for(const offset of [92,116,144,176])for(const side of [0,1,-1,2,-2]){
    const along=offset,lat=side*34,x=v.pose.x-ux*along-uy*lat,y=v.pose.y-uy*along+ux*lat;
    const q=cityFindWalkable(x,y,28,true);if(!q||Math.hypot(q[0]-v.pose.x,q[1]-v.pose.y)<45||Math.hypot(q[0]-v.pose.x,q[1]-v.pose.y)>210)continue;
    if(cityCircleBlocked(q[0],q[1],9,false)||(cityFlagsAt(q[0],q[1])&(F_MOVE|F_IN|F_WATER))||!jobRouteValid(sx,sy,q[0],q[1]))continue;
    return q;
  }
  return null;
}
function jdcScenePlan(sx=player&&player.x,sy=player&&player.y,salt=CITY.seed){
  if(!CITY.on||!player||![sx,sy,salt].every(Number.isFinite)||typeof vehPropPose!=="function")return {ok:false,why:"Crime-scene planning requires an active city and an on-foot starting point."};
  const candidates=jdcSceneVehiclesNear(sx,sy);let checked=0;
  for(const v of candidates){
    checked++;const scene=jdcSceneApproach(v,sx,sy);if(!scene)continue;
    const file=jobFindSite(scene[0],scene[1],(salt>>>0)+v.key.length*97+checked*131),filePoint=jobSiteLocal(file);
    if(!filePoint||!jobRouteValid(scene[0],scene[1],filePoint.x,filePoint.y))continue;
    return {ok:true,call:{scene:{wx:scene[0]+CITY.orx,wy:scene[1]+CITY.ory},document:{wx:scene[0]+CITY.orx,wy:scene[1]+CITY.ory},file,
      vehicle:{key:v.key,tx:v.p.x,ty:v.p.y,wx:v.pose.x+CITY.orx,wy:v.pose.y+CITY.ory,kind:v.p.t,model:Number.isFinite(v.p.v)?v.p.v|0:0},
      sceneReviewed:false,evidenceCaptured:false,evidence:null}};
  }
  return {ok:false,why:"No reachable parked vehicle could be used as a scene-evidence lead. Move through town and retry.",diagnostics:{candidates:candidates.length,checked}};
}
function jdcSceneVehicle(a){
  const r=a&&a.data&&a.data.vehicle;if(!r||typeof r.key!=="string"||!Number.isFinite(r.tx)||!Number.isFinite(r.ty))return null;
  if(cityRT.used.has(r.key)||VEH.byKey.has(r.key))return null;
  const C=cityChunk(Math.floor(r.tx)>>7,Math.floor(r.ty)>>7),p=C.props.find(q=>q&&q.t==="car"&&!q.wreck&&jdcVehicleKey(q)===r.key);
  if(!p)return null;const pose=vehPropPose(p);
  if(Math.hypot(pose.x+CITY.orx-r.wx,pose.y+CITY.ory-r.wy)>8)return null;
  return {p,pose};
}
function jdcSceneEvidenceValid(a){
  const live=jdcSceneVehicle(a),e=a&&a.data&&a.data.evidence,r=a&&a.data&&a.data.vehicle;
  return !!(live&&e&&e.captured===true&&e.vehicleKey===r.key&&e.model===r.model&&e.wx===r.wx&&e.wy===r.wy);
}
function jdcSceneOffer(){
  if(!v15ContractEnabled(JOB_SCENE_CASE))return {ok:false,why:"Crime-scene detective calls are unavailable in this revision."};
  if(!runActive||!CITY.on||!player||player.inVehicle||player.roof||(player.flyAlt||0)>2)return {ok:false,why:"Stand on the ground outside a vehicle to request a detective call."};
  const read=jobReadState();if(!read.ok)return read;if(read.state.active)return {ok:false,why:"Finish or withdraw the current job first."};
  const plan=jdcScenePlan(player.x,player.y,(CITY.seed>>>0)+read.state.next*3571);if(!plan.ok)return plan;
  const prior=jdLatestWitnessMemory(read.state,jobWorldKey());if(prior)plan.call.memory=jdDetectiveMemorySnapshot(prior);
  return jobOffer(JOB_SCENE_CASE,plan.call);
}
function jdcSceneDocument(id){
  const read=jobReadState(),a=read.ok&&read.state.active;
  if(!a||a.id!==id||a.contract!==JOB_SCENE_CASE||a.world!==jobWorldKey()||a.phase!=="document"||a.data.sceneReviewed!==true||!jdNear(a))return {ok:false,why:"Return on foot to the documented vehicle at the scene."};
  const live=jdcSceneVehicle(a);if(!live)return {ok:false,why:"The assigned vehicle is no longer at the scene. Record an unresolved handoff instead."};
  const v=a.data.vehicle,evidence={captured:true,vehicleKey:v.key,model:v.model,wx:v.wx,wy:v.wy,observation:"vehicle_present_at_scene"};
  const next=jobAdvance(id,"document","file",{evidenceCaptured:true,evidence});
  if(next.ok&&typeof MAPV!=="undefined")MAPV.lastSig="";return next;
}
function jdcSceneFile(id){
  const a=jdActive();if(!a||a.id!==id||a.contract!==JOB_SCENE_CASE||a.phase!=="file"||!jdNear(a)||!jdcSceneEvidenceValid(a))return {ok:false,why:"Return to the filing point with the saved vehicle observation."};
  return jobFinish(id,"scene_filed");
}
function jdcSceneHandoff(id){
  const a=jdActive();if(!a||a.id!==id||a.contract!==JOB_SCENE_CASE)return {ok:false,why:"This detective case is no longer active."};
  return jobFinish(id,"scene_handoff");
}
function jdDetectiveTarget(a){
  if(!a||!a.data)return null;
  if(a.contract===JOB_POI_FOLLOWUP)return jdPoiTarget(a);
  if(a.contract!==JOB_SCENE_CASE)return null;
  return jobSiteLocal(a.phase==="offer"?a.data.scene:a.data[a.phase]);
}
const JD_POI={actor:null,incident:null,world:null,saveTimer:0};
function jdPoiPlan(sx,sy,salt,memory){
  if(!CITY.on||!player||![sx,sy,salt].every(Number.isFinite)||!memory)return {ok:false,why:"A saved witness lead and active city are required."};
  for(let k=0;k<8;k++){
    const briefing=jobFindSite(sx,sy,(salt>>>0)+k*173+17),b=jobSiteLocal(briefing);if(!b)continue;
    const approach=jobFindSite(b.x,b.y,(salt>>>0)+k*173+83),p=jobSiteLocal(approach);if(!p||!jobRouteValid(b.x,b.y,p.x,p.y))continue;
    const file=jobFindSite(p.x,p.y,(salt>>>0)+k*173+149),f=jobSiteLocal(file);
    if(!f||!jobRouteValid(sx,sy,b.x,b.y)||!jobRouteValid(p.x,p.y,f.x,f.y))continue;
    return {ok:true,call:{briefing,approach,file,memory:jdDetectiveMemorySnapshot(memory),poiState:null,poiLost:false,poiInterviewed:false,statementRecorded:false,disposition:null,station:null}};
  }
  return {ok:false,why:"No fully reachable person-of-interest route was found. Try a different starting point."};
}
function jdPoiOffer(){
  if(!v15ContractEnabled(JOB_POI_FOLLOWUP))return {ok:false,why:"Person-of-interest follow-up calls are unavailable in this revision."};
  if(!runActive||!CITY.on||!player||player.inVehicle||player.roof||(player.flyAlt||0)>2)return {ok:false,why:"Stand on the ground outside a vehicle to request a follow-up."};
  if(!TF?.on)return {ok:false,why:"Person-of-interest interviews require townsfolk in an economy or apocalypse scenario."};
  const read=jobReadState();if(!read.ok)return read;if(read.state.active)return {ok:false,why:"Finish or withdraw the current job first."};
  const latest=jdLatestWitnessMemory(read.state,jobWorldKey());if(!latest)return {ok:false,why:"Complete a witness case first; dispatch has no saved witness to connect to this lead."};
  const plan=jdPoiPlan(player.x,player.y,(CITY.seed>>>0)+read.state.next*4637,latest);if(!plan.ok)return plan;
  return jobOffer(JOB_POI_FOLLOWUP,plan.call);
}
function jdPoiStateValid(a){
  const s=a?.data?.poiState,m=a?.data?.memory;
  return !!(s&&typeof s==="object"&&!Array.isArray(s)&&s.id===m?.poiId&&typeof s.name==="string"&&s.name.length>0&&s.name.length<=80&&
    jdPersonSnapshotValid({wx:s.wx,wy:s.wy,hp:s.hp})&&typeof s.id==="string"&&s.id.length<=180);
}
function jdPoiStatementValid(a){
  if(!(a&&a.contract===JOB_POI_FOLLOWUP&&a.data?.statementRecorded===true&&a.data.poiInterviewed===true&&a.data.statement==="denied"&&
    !a.data.poiLost&&jdPoiStateValid(a)&&a.data.memory?.witness&&jdMemoryRecordValid(a.data.memory.witness,"witness")&&a.data.memory.poiId===a.data.poiState.id&&a.data.memory.poiId==="jd-poi|"+a.world+"|"+a.data.memory.witness.sourceCase))return false;
  const read=jobReadState(),ledger=read.ok&&jdMemoryLedger(read.state,a.world,false),w=ledger&&ledger.witnesses.find(r=>r.id===a.data.memory.witness.id);
  if(!w||w.sourceCase!==a.data.memory.witness.sourceCase||w.name!==a.data.memory.witness.name||w.outcome!==a.data.memory.witness.outcome)return false;
  const prior=ledger.poi.find(r=>r.id===a.data.memory.poiId),snap=a.data.memory.priorInterview;
  if(snap==null?!!prior:!prior||snap.sourceCase!==prior.sourceCase||snap.interviews!==prior.interviews||snap.statement!==prior.statement||(snap.status||"interviewed")!==(prior.status||"interviewed"))return false;
  const scene=a.data.memory.linkedScene;
  if(scene==null)return !(ledger.scenes||[]).some(r=>r.poiId===a.data.memory.poiId&&r.witnessId===w.id&&r.witnessCase===w.sourceCase);
  if(!jdMemoryRecordValid(scene,"scene")||scene.poiId!==a.data.memory.poiId||scene.witnessId!==w.id||scene.witnessCase!==w.sourceCase)return false;
  const saved=(ledger.scenes||[]).find(r=>r.sceneCase===scene.sceneCase);
  return !!saved&&["poiId","witnessId","witnessCase","sceneCase","vehicleKey","model","wx","wy","evidence","ownership","guilt"].every(k=>saved[k]===scene[k]);
}
function jdPoiArrestEligible(a){
  if(!jdPoiStatementValid(a))return false;
  const m=a.data.memory,w=m.witness,s=m.linkedScene;
  return !!(s&&jdMemoryRecordValid(s,"scene")&&["witness_safe","witness_supported","witness_protected"].includes(w.outcome)&&
    s.poiId===m.poiId&&s.witnessId===w.id&&s.witnessCase===w.sourceCase&&s.evidence==="vehicle_present_at_scene"&&
    s.ownership==="not_established"&&s.guilt==="not_established");
}
function jdPoiAtStation(a){
  const p=jdPoiSync(a),W=p?.w||p?.jrec,site=jobSiteLocal(a?.data?.station),inside=p?.w?.inside&&TF.bld.get(p.w.inside);
  const bookedInside=!!(inside&&inside.kind==="police");
  return !!(a&&a.phase==="custody"&&site&&player&&!player.inVehicle&&!player.roof&&(player.flyAlt||0)<=2&&
    typeof pdpStationDoor==="function"&&pdpStationDoor(player.x,player.y,140)&&
    W&&Math.hypot(player.x-site.x,player.y-site.y)<70&&(bookedInside||Math.hypot(W.x-site.x,W.y-site.y)<100));
}
function jdPoiClear(release){
  const p=JD_POI.actor;
  if(p&&typeof TF!=="undefined"){
    tfJobRelease(p);
    if(release&&p.alive&&p.w){p.jdPoi=null;p.w.jobContact=false;try{tfPickGoal(p,"out");}catch(e){p.w.tx=p.w.x;p.w.ty=p.w.y;}}
    else {const i=TF.walk.indexOf(p);if(i>=0)TF.walk.splice(i,1);if(TF.npc.get(p.id)===p)TF.npc.delete(p.id);p.w=null;}
  }
  JD_POI.actor=null;JD_POI.incident=null;JD_POI.world=null;JD_POI.saveTimer=0;
}
function jdPoiSync(a){
  if(!a||a.contract!==JOB_POI_FOLLOWUP||!["approach","resolve","custody"].includes(a.phase)||a.world!==jobWorldKey()||a.data?.poiLost||!TF?.on){
    const release=!!(TF?.on&&runActive&&JD_POI.actor?.alive&&JD_POI.world===jobWorldKey());jdPoiClear(release);return null;
  }
  if(JD_POI.incident!==a.id||JD_POI.world!==a.world)jdPoiClear(false);
  if(JD_POI.actor&&(JD_POI.actor.w||!JD_POI.actor.alive)){
    if(JD_POI.actor.w){const inside=!!JD_POI.actor.w.inside;JD_POI.actor.w.jobContact=!inside;JD_POI.actor.w.jobEscort=a.phase==="custody"&&!inside;}
    return JD_POI.actor;
  }
  if(JD_POI.actor&&!(JD_POI.actor.tfJob&&JD_POI.actor.jrec))jdPoiClear(false);
  const saved=a.data.poiState,target=jobSiteLocal(saved||a.data.approach);
  if(!target||Math.hypot(player.x-target.x,player.y-target.y)>750||cityCircleBlocked(target.x,target.y,7,false)||(cityFlagsAt(target.x,target.y)&(F_MOVE|F_IN|F_WATER)))return null;
  const id=a.data.memory?.poiId;if(typeof id!=="string"||tfMem().dead[id])return null;
  const person=tfPerson(id,tfRng(tfHash(id)),{occ:"unemployed"});person.jdPoi={incident:a.id,world:a.world};
  // Escaped leads can be offered again; reuse a still-streamed person instead of
  // adding the same NPC object to TF.walk a second time or resetting their state.
  const W=person.w||tfSpawnWalker(person,target.x,target.y,false,null);
  W.jobContact=true;W.jobEscort=a.phase==="custody";if(!Number.isFinite(W.idle)||W.idle<1e5)W.idle=1e6;if(saved&&!person.jrec)W.hp=Math.min(W.hp,saved.hp);
  tfJobClaim(person,"jd-poi");
  JD_POI.actor=person;JD_POI.incident=a.id;JD_POI.world=a.world;
  jdPoiCheckpoint(person);return person;
}
function jdPoiCheckpoint(person){
  const W=person?.w;if(!person?.alive||!person.jdPoi||!W||!Number.isFinite(W.hp)||W.hp<=0)return false;
  const read=jobReadState(),a=read.ok&&read.state.active;
  if(!a||a.id!==person.jdPoi.incident||a.world!==person.jdPoi.world||a.world!==jobWorldKey()||a.contract!==JOB_POI_FOLLOWUP||!["approach","resolve","custody"].includes(a.phase)||a.data?.poiLost||W.inside)return false;
  const next={id:person.id,name:String(person.name||"Person of interest").slice(0,80),wx:W.x+CITY.orx,wy:W.y+CITY.ory,hp:W.hp},old=a.data.poiState;
  if(old&&Math.hypot(old.wx-next.wx,old.wy-next.wy)<8&&old.hp===next.hp&&old.name===next.name)return true;
  a.data.poiState=next;const saved=jobCommit(read.state,0);if(!saved.ok)jdNotice("INTERVIEW CHECKPOINT NOT SAVED · Check storage before leaving.");return saved.ok;
}
function jdPoiLost(person){
  const read=jobReadState(),a=read.ok&&read.state.active;
  if(!a||a.id!==person.jdPoi?.incident||a.world!==person.jdPoi.world||a.world!==jobWorldKey()||a.contract!==JOB_POI_FOLLOWUP||!["approach","resolve","custody"].includes(a.phase))return;
  a.data.poiLost=true;const saved=jobCommit(read.state,0);jdNotice(saved.ok?"PERSON OF INTEREST LOST · The witness lead remains unresolved.":"PERSON OF INTEREST LOST · Could not save; check storage before leaving.");
}
function jdPoiTarget(a){
  if(!a||a.contract!==JOB_POI_FOLLOWUP||!a.data)return null;
  if(a.phase==="offer"||a.phase==="briefing")return jobSiteLocal(a.data.briefing);
  if(["approach","resolve"].includes(a.phase)){
    const p=jdPoiSync(a);if(p?.alive&&p.w&&JD_POI.incident===a.id)return {x:p.w.x,y:p.w.y};
    return jobSiteLocal(a.data.poiState||a.data.approach);
  }
  if(a.phase==="custody")return jobSiteLocal(a.data.station);
  return jobSiteLocal(a.data.file);
}
function jdPoiArrive(a){
  if(!a||a.contract!==JOB_POI_FOLLOWUP||!jdNear(a))return false;
  if(a.phase==="briefing"){
    const r=jobAdvance(a.id,"briefing","approach");if(r.ok){jdPoiSync(jdActive());if(typeof MAPV!=="undefined")MAPV.lastSig="";jdOpen("RETURNING WITNESS LEAD REVIEWED · The prior account is a lead, not proof.");}
    else jdNotice("Dispatch: "+r.why+". Check storage and retry.");return !!r.ok;
  }
  if(a.phase==="custody"){
    const r=jdPoiBook(a.id);if(!r.ok)jdNotice(r.why);return !!r.ok;
  }
  jdOpen();return true;
}
function jdPoiInterview(id){
  const read=jobReadState(),a=read.ok&&read.state.active;
  if(!a||a.id!==id||a.contract!==JOB_POI_FOLLOWUP||a.world!==jobWorldKey()||a.phase!=="approach"||a.data?.poiLost)return {ok:false,why:"This interview is no longer available."};
  const person=jdPoiSync(a);if(!jdPersonPresent(person)||!jdPersonNear(person))return {ok:false,why:"Approach the person calmly on foot before asking about the lead."};
  const W=person.w,poiState={id:person.id,name:String(person.name||"Person of interest").slice(0,80),wx:W.x+CITY.orx,wy:W.y+CITY.ory,hp:W.hp};
  const result=jobAdvance(id,"approach","resolve",{poiState,poiInterviewed:true,statementRecorded:true,statement:"denied"});
  if(result.ok&&typeof MAPV!=="undefined")MAPV.lastSig="";
  return result;
}
function jdPoiStartFile(id){
  const a=jdActive(),p=a&&a.id===id&&jdPoiSync(a);
  if(!a||a.contract!==JOB_POI_FOLLOWUP||a.phase!=="resolve"||!jdPoiStatementValid(a)||!jdPersonPresent(p)||!jdPersonNear(p))return {ok:false,why:"Stay with the person and save their statement before filing it."};
  const r=jobAdvance(id,"resolve","file",{poiState:{id:p.id,name:String(p.name||"Person of interest").slice(0,80),wx:p.w.x+CITY.orx,wy:p.w.y+CITY.ory,hp:p.w.hp}});
  if(r.ok){jdPoiClear(true);if(typeof MAPV!=="undefined")MAPV.lastSig="";}return r;
}
function jdPoiEscape(id){
  const read=jobReadState(),a=read.ok&&read.state.active,p=a&&a.id===id&&jdPoiSync(a);
  if(!a||a.contract!==JOB_POI_FOLLOWUP||a.phase!=="resolve"||!jdPoiStatementValid(a)||!jdPersonPresent(p)||!jdPersonNear(p))return {ok:false,why:"Approach the living person before documenting their departure."};
  const W=p.w;W.flee=Math.max(W.flee||0,6);W.fleeX=player.x;W.fleeY=player.y;
  a.data.disposition="escaped";a.data.poiState={id:p.id,name:String(p.name||"Person of interest").slice(0,80),wx:W.x+CITY.orx,wy:W.y+CITY.ory,hp:W.hp};
  const saved=jobCommit(read.state,0);if(!saved.ok)return saved;
  const r=jobFinish(id,"poi_escaped");if(r.ok)jdPoiClear(true);return r;
}
function jdPoiStationFind(x,y){
  if(typeof pdpStationDoorPoint!=="function"||typeof pdpStationDoor!=="function")return null;
  if(typeof tfRegisterNear==="function")tfRegisterNear();
  if(typeof tfNearBuildings==="function"&&typeof tfRegister==="function")for(const b of tfNearBuildings(3400))if(tfKind(b)==="police"&&!TF.bld.has(b.uid))tfRegister(b);
  const q=pdpStationDoorPoint(x,y);if(!q||!pdpStationDoor(q[0],q[1],40))return null;
  // A person already waiting at the doors needs no separate route target; requiring
  // a path back to the same point rejects valid door-side arrivals as a zero-length route.
  if(Math.hypot(q[0]-x,q[1]-y)<70&&pdpStationDoor(x,y,40))return {wx:x+CITY.orx,wy:y+CITY.ory};
  if(!jobRouteValid(x,y,q[0],q[1]))return null;
  return {wx:q[0]+CITY.orx,wy:q[1]+CITY.ory};
}
function jdPoiCustodyStart(id,disposition){
  const a=jdActive(),p=a&&a.id===id&&jdPoiSync(a);
  if(!a||a.contract!==JOB_POI_FOLLOWUP||a.phase!=="resolve"||!jdPoiStatementValid(a)||!jdPersonPresent(p)||!jdPersonNear(p)||p.w.flee>0||p.w.stun>0||player.inVehicle||player.roof||(player.flyAlt||0)>2)
    return {ok:false,why:"Stand calmly with the living person on foot before asking for a station handoff."};
  if(!["surrendered","arrested"].includes(disposition))return {ok:false,why:"Unknown station disposition."};
  if(disposition==="arrested"&&!jdPoiArrestEligible(a))return {ok:false,why:"No linked witness record and filed scene observation support an arrest for investigation."};
  const station=jdPoiStationFind(p.w.x,p.w.y);if(!station)return {ok:false,why:"No reachable police-station door is available. File the statement or leave the lead unresolved."};
  const r=jobAdvance(id,"resolve","custody",{disposition,station,poiState:{id:p.id,name:String(p.name||"Person of interest").slice(0,80),wx:p.w.x+CITY.orx,wy:p.w.y+CITY.ory,hp:p.w.hp}});
  if(r.ok){p.w.jobContact=true;p.w.jobEscort=true;if(typeof MAPV!=="undefined")MAPV.lastSig="";}
  return r;
}
function jdPoiPoliceRecordAt(x,y){
  for(const R of TF.bld.values())if(R?.kind==="police"&&R.b){
    try{for(const e of accEntrances(R.b)){if(e.kind!=="door")continue;const cx=e.x+(e.axis==="x"?e.len/2:.5),cy=e.y+(e.axis==="y"?e.len/2:.5);for(let o=2;o<=5;o++){
      const px=(cx+e.o[0]*o)*16-CITY.orx,py=(cy+e.o[1]*o)*16-CITY.ory;if(Math.hypot(px-x,py-y)<100)return R;
    }}}catch(e){}
  }
  return null;
}
function jdPoiBook(id){
  const a=jdActive(),p=a&&a.id===id&&jdPoiSync(a),W=p?.w||p?.jrec,site=jobSiteLocal(a?.data?.station);
  if(!a||a.contract!==JOB_POI_FOLLOWUP||a.phase!=="custody"||!jdPoiStatementValid(a)||!jdPoiAtStation(a)||!p||!W)return {ok:false,why:"Bring the living person to the saved police-station doors on foot."};
  if(a.data.disposition==="arrested"&&!jdPoiArrestEligible(a))return {ok:false,why:"The saved evidence link is no longer valid; arrest is blocked."};
  const R=jdPoiPoliceRecordAt(site.x,site.y),s2=R&&tfIndoorSpot(R.b,tfRng(tfHash(p.id+"|detective-booking")),["desk","deskpod"]);
  if(s2&&p.w){W.inside=R.uid;W.x=s2[0];W.y=s2[1];W.tx=s2[0];W.ty=s2[1];W.path=null;W.post=true;W.jobEscort=false;W.jobContact=false;W.idle=3;}
  else if(p.w){W.x=site.x;W.y=site.y;W.tx=site.x;W.ty=site.y;W.jobEscort=false;W.jobContact=false;W.post=true;}
  p.jdPoi=null;tfJobRelease(p);
  const outcome=a.data.disposition==="arrested"?"poi_arrested":"poi_surrendered",r=jobFinish(id,outcome);
  if(r.ok){JD_POI.actor=null;JD_POI.incident=null;JD_POI.world=null;JD_POI.saveTimer=0;}
  else{p.jdPoi={incident:a.id,world:a.world};tfJobClaim(p,"jd-poi");}
  return r;
}
function jdPoiFile(id){
  const a=jdActive();if(!a||a.id!==id||a.contract!==JOB_POI_FOLLOWUP||a.phase!=="file"||!jdNear(a)||!jdPoiStatementValid(a))return {ok:false,why:"Return to the filing point with the saved interview note."};
  return jobFinish(id,"poi_filed");
}
function jdPoiHandoff(id){
  const a=jdActive();if(!a||a.id!==id||a.contract!==JOB_POI_FOLLOWUP)return {ok:false,why:"This detective follow-up is no longer active."};
  const r=jobFinish(id,"poi_handoff");if(r.ok)jdPoiClear(true);return r;
}
function jdDetectiveLabel(a){
  if(a?.contract===JOB_POI_FOLLOWUP)return a.phase==="briefing"?"REVIEW WITNESS LEAD":a.phase==="approach"?"INTERVIEW PERSON OF INTEREST":a.phase==="resolve"?"REVIEW INTERVIEW OUTCOME":a.phase==="custody"?"STATION HANDOFF":a.phase==="file"?"FILE INTERVIEW NOTE":"REVIEW WITNESS LEAD";
  if(!a||a.contract!==JOB_SCENE_CASE)return "INVESTIGATE SCENE";
  return a.phase==="scene"?"REVIEW CRIME SCENE":a.phase==="document"?"PHOTOGRAPH VEHICLE":a.phase==="file"?"FILE SCENE CASE":"INVESTIGATE SCENE";
}
function jdDetectiveArrive(a){
  if(a?.contract===JOB_POI_FOLLOWUP)return jdPoiArrive(a);
  if(!a||a.contract!==JOB_SCENE_CASE||!jdNear(a))return false;
  if(a.phase==="scene"){
    const r=jobAdvance(a.id,"scene","document",{sceneReviewed:true});
    if(r.ok){if(typeof MAPV!=="undefined")MAPV.lastSig="";jdOpen("SCENE REVIEWED · Document the vehicle as a lead; no owner or suspect is presumed responsible.");}
    else jdNotice("Dispatch: "+r.why+". Check storage and retry.");return !!r.ok;
  }
  jdOpen();return true;
}
function jdDetectivePanel(a,ui){
  if(a?.contract===JOB_POI_FOLLOWUP){
    const {text,button}=ui,id=a.id,m=a.data.memory?.witness,rank=jdCareerPanelRank(),prior=a.data.memory?.priorInterview,scene=a.data.memory?.linkedScene;
    if(!jdMemoryRecordValid(m,"witness")||a.data.memory.poiId!=="jd-poi|"+a.world+"|"+m.sourceCase||
      (prior&&(!Number.isSafeInteger(prior.interviews)||prior.interviews<1||prior.interviews>100||prior.statement!=="denied"||!(["interviewed","escaped","surrendered","arrested"].includes(prior.status||"interviewed"))))||
      (scene!==null&&scene!==undefined&&!jdMemoryRecordValid(scene,"scene"))){
      text("p","This saved follow-up record is damaged. Dispatch will not treat it as evidence.");button("HAND OFF UNRESOLVED · 25",()=>{const q=jdPoiHandoff(id);jdOpen(q.ok?"Unresolved follow-up handed off; no filed-case credit.":q.why);});button("WITHDRAW · NO PAY",()=>{const q=jobWithdraw(id);if(q.ok)jdPoiClear(true);jdOpen(q.ok?"Follow-up withdrawn; no pay.":q.why);});return;
    }
    const title=text("p","DETECTIVE CAREER · Stage "+rank.rank+"/5 · "+rank.name+(rank.next===null?" · top stage reached":" · "+rank.next+" more completed case"+(rank.next===1?"":"s")));title.style.cssText="font-size:12px;opacity:.8";
    text("p","Person-of-interest follow-up · Interview the same named person linked to a saved witness account. A denial is not proof of guilt or innocence.");
    const witnessStatus=m.outcome==="witness_safe"?"escorted to safety":m.outcome==="witness_supported"?"met unarmed support":m.outcome==="witness_protected"?"handed to unarmed responders":m.outcome==="trace_handoff"?"case handed off unresolved":"lost during the prior case";
    text("p",(m.outcome==="witness_lost"||m.outcome==="trace_handoff"?"SAVED WITNESS MEMORY · ":"RETURNING WITNESS · ")+m.name+" · case #"+m.sourceCase+" · previously "+witnessStatus+". The account remains a lead, not a verdict.");
    if(prior)text("p","ACCOUNTABILITY RECORD · "+prior.interviews+" earlier interview note(s); statement: "+prior.statement+"; status: "+(prior.status||"interviewed")+". No guilt finding.");
    if(scene)text("p","LINKED SCENE RECORD · case #"+scene.sceneCase+" documented vehicle "+scene.vehicleKey+" at the scene. Presence is corroborative context only; ownership and guilt remain unestablished.");
    if(a.phase==="briefing")button("REVIEW WITNESS LEAD",()=>{if(!jdArrive())jdOpen("Reach the briefing marker on foot first.");});
    else if(a.phase==="approach"){
      const p=jdPoiSync(a);
      if(a.data.poiLost||p&&!p.alive)text("p","The person was lost. The earlier witness remains remembered; hand off unresolved.");
      else if(!TF?.on)text("p","The person of interest is unavailable in this scenario. Hand off the unresolved lead or return with townsfolk active.");
      else if(p?.w?.flee>0)text("p","The person is fleeing danger. Move away and wait until they are calm.");
      else if(jdPersonNear(p))button("ASK ABOUT THE WITNESS LEAD",()=>{const r=jdPoiInterview(id);jdOpen(r.ok?"STATEMENT SAVED · The person denied the allegation. Choose how to close or continue this lead; no verdict is implied.":r.why);});
      else text("p","Approach the marked person on foot. If unavailable, record an unresolved handoff.");
    }else if(a.phase==="resolve"){
      const p=jdPoiSync(a);
      text("p","The person denied the allegation. No single statement proves guilt. You can file the account, request a voluntary station handoff, let the person leave with a follow-up lead, or request arrest for investigation only when a linked scene observation is on file.");
      if(jdPersonNear(p)){
        button("FILE STATEMENT",()=>{const r=jdPoiStartFile(id);jdOpen(r.ok?"STATEMENT FILED FOR REVIEW · Follow the marker to complete the case file.":r.why);});
        button("ASK FOR VOLUNTARY STATION HANDOFF",()=>{const r=jdPoiCustodyStart(id,"surrendered");jdOpen(r.ok?"VOLUNTARY HANDOFF ACCEPTED · Escort the person on foot to the police-station marker; no guilt finding.":r.why);});
        if(jdPoiArrestEligible(a))button("ARREST FOR INVESTIGATION",()=>{const r=jdPoiCustodyStart(id,"arrested");jdOpen(r.ok?"EVIDENCE-LINKED ARREST FOR INVESTIGATION · Escort to the station on foot. This is not a finding of guilt.":r.why);});
        else text("p","ARREST UNAVAILABLE · No linked filed scene observation corroborates this witness lead. A denial or vehicle presence alone is not enough.");
        button("LET THEM LEAVE · FOLLOW-UP REMAINS OPEN",()=>{const r=jdPoiEscape(id);jdOpen(r.ok?"PERSON OF INTEREST DEPARTED · Their statement and the witness lead remain saved for a later follow-up; guilt is not established.":r.why);});
      }else text("p","Stay with the person on foot to choose a disposition, or hand off the unresolved lead.");
    }else if(a.phase==="custody"){
      text("p",a.data.disposition==="arrested"?"ARREST FOR INVESTIGATION · The linked witness and scene records are grounds to request a station review, not proof of guilt. Walk with the person to the marked police-station doors.":"VOLUNTARY HANDOFF · The person agreed to speak at the station. Walk with them to the marked police-station doors.");
      const p=jdPoiSync(a);if(jdPoiAtStation(a))button("COMPLETE STATION HANDOFF",()=>{const r=jdPoiBook(id);jdOpen(r.ok?"STATION HANDOFF RECORDED · The case is filed; guilt remains unestablished.":r.why);});
      else if(p?.w?.flee>0)text("p","The person is fleeing danger; the station handoff is not complete. Follow the marker and recover the lead or hand it off unresolved.");
      else text("p","Follow the cyan marker on foot. The person follows; vehicles and flight do not carry them.");
    }else if(a.phase==="file"){
      text("p","Interview note ready. The person denied the allegation. Filing records their statement and links it to the earlier witness account; it does not establish guilt.");
      button("FILE INTERVIEW NOTE · "+jdTracePanelPay("poi_filed",90),()=>{const r=jdPoiFile(id);jdOpen(r.ok?"INTERVIEW NOTE FILED · "+r.pay+" paid. Statement recorded; no guilt finding.":r.why);});
    }
    button("HAND OFF UNRESOLVED · 25",()=>{const r=jdPoiHandoff(id);jdOpen(r.ok?"UNRESOLVED FOLLOW-UP HANDED OFF · "+r.pay+" added; no filed-case credit.":r.why);});
    button("WITHDRAW · NO PAY",()=>{const r=jobWithdraw(id);if(r.ok)jdPoiClear(true);jdOpen(r.ok?"Follow-up withdrawn; no pay.":r.why);});return;
  }
  const {text,button}=ui,id=a.id;
  const rank=jdCareerPanelRank();
  const r=text("p","DETECTIVE CAREER · Stage "+rank.rank+"/5 · "+rank.name+(rank.next===null?" · top stage reached":" · "+rank.next+" more completed case"+(rank.next===1?"":"s")));r.style.cssText="font-size:12px;opacity:.8";
  const line=a.phase==="scene"?"Reach the assigned parked vehicle and review the reported scene.":a.phase==="document"?"Photograph the vehicle physically present at the scene. It is a lead only; ownership and guilt are not established.":"Return to the filing point and file the verified vehicle observation.";
  text("p","Crime-scene case · "+line+" No timer. If the assigned evidence is unavailable, hand off an unresolved lead.");
  if(a.phase==="scene")button("REVIEW CRIME SCENE",()=>{const ok=jdArrive();if(!ok)jdOpen("Reach the scene marker on foot before reviewing the report.");});
  if(a.phase==="document")button("PHOTOGRAPH VEHICLE",()=>{const q=jdcSceneDocument(id);jdOpen(q.ok?"VEHICLE DOCUMENTED · Follow the marker to file the lead.":q.why);});
  if(a.phase==="file")button("FILE VERIFIED SCENE REPORT · "+jdTracePanelPay("scene_filed",100),()=>{const q=jdcSceneFile(id);jdOpen(q.ok?"SCENE CASE FILED · "+q.pay+" added; the vehicle observation is not an accusation.":q.why);});
  button("HAND OFF UNRESOLVED · 25",()=>{const q=jdcSceneHandoff(id);jdOpen(q.ok?"UNRESOLVED CASE HANDED OFF · "+q.pay+" added; no filed-case credit.":q.why);});
  button("WITHDRAW · NO PAY",()=>{const q=jobWithdraw(id);jdOpen(q.ok?"Case withdrawn; no pay.":q.why);});
}
function jdDetectiveReplan(a){
  if(!a||!a.data||!player||player.inVehicle||player.roof||(player.flyAlt||0)>2)return {ok:false,why:"Stand on foot to replan this case."};
  if(a.contract===JOB_POI_FOLLOWUP)return {ok:false,why:"The returning witness and assigned person are fixed to this case. Hand off if the route is blocked."};
  if(a.contract!==JOB_SCENE_CASE)return {ok:false,why:"This case cannot be replanned."};
  const read=jobReadState(),saved=read.ok&&read.state.active;if(!saved||saved.id!==a.id||saved.phase!==a.phase||saved.contract!==JOB_SCENE_CASE)return {ok:false,why:"This case objective is no longer current."};
  if(saved.phase==="scene"||saved.phase==="document")return {ok:false,why:"The evidence site is fixed to the assigned vehicle. Hand off if it cannot be reached."};
  if(saved.phase!=="file")return {ok:false,why:"There is no filing objective to move."};
  const old=jobSiteLocal(saved.data.file);let site=null;
  for(let k=0;k<8&&!site;k++){const q=jobFindSite(player.x,player.y,(CITY.seed>>>0)+saved.id*163+k*59),p=jobSiteLocal(q);if(p&&(!old||Math.hypot(p.x-old.x,p.y-old.y)>64)&&jobRouteValid(player.x,player.y,p.x,p.y))site=q;}
  if(!site)return {ok:false,why:"No replacement filing point with a valid route was found."};
  saved.data.file=site;return jobCommit(read.state,0);
}
// EOF:js/jobdetective.js
