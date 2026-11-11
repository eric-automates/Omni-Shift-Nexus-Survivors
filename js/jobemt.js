// FILE: js/jobemt.js
// PART: 15.6.5-part3 — accepted EMT career and complete incident workflow.
// Release switches open after end-to-end acceptance and cross-career checks pass.
"use strict";

const JOB_EMT = "paramedic_incident";
const J05_RANKS = [
  {name:"EMT Trainee",calls:0,bonus:0},
  {name:"Emergency Medical Technician",calls:2,bonus:0.05},
  {name:"Advanced EMT",calls:5,bonus:0.10},
  {name:"Paramedic",calls:9,bonus:0.15},
  {name:"Senior Paramedic",calls:14,bonus:0.20}
];

// A missing career is an old-save baseline at zero. A present malformed
// record fails closed: do not infer promotions or invent completed calls.
function j05CareerRecord(state) {
  const root=state&&state.career;
  if(root==null)return {ok:true,calls:0,missing:true};
  if(typeof root!=="object"||Array.isArray(root))return {ok:false,calls:0,missing:false};
  if(!Object.prototype.hasOwnProperty.call(root,"emt"))return {ok:true,calls:0,missing:true};
  const r=root.emt;
  if(!r||typeof r!=="object"||Array.isArray(r)||!Number.isSafeInteger(r.calls)||r.calls<0)
    return {ok:false,calls:0,missing:false};
  return {ok:true,calls:r.calls,missing:false};
}
function j05CareerRank(state) {
  const record=j05CareerRecord(state);
  if(!record.ok)return {ok:false,rank:0,name:"Career record unavailable",bonus:0,calls:null,next:null};
  let i=0;for(let k=0;k<J05_RANKS.length;k++)if(record.calls>=J05_RANKS[k].calls)i=k;
  const next=J05_RANKS[i+1]?J05_RANKS[i+1].calls-record.calls:null;
  return {ok:true,rank:i+1,name:J05_RANKS[i].name,bonus:J05_RANKS[i].bonus,calls:record.calls,next};
}
function j05CareerSummary(state) {
  const rank=j05CareerRank(state);
  if(!rank.ok)return "EMT CAREER · saved rank data is invalid; no promotion or payout will be inferred.";
  return "EMT CAREER · Stage "+rank.rank+"/5 · "+rank.name+" · "+rank.calls+" completed incident"+(rank.calls===1?"":"s")+
    (rank.next===null?" · top stage reached":" · "+rank.next+" more completed incident"+(rank.next===1?"":"s")+" for the next stage");
}

const J05_MAX_CALLS = 3;
const J05_TRIAGE_ROLES = ["patient0","patient1","patient2"];

jobRegister({id:JOB_EMT,role:"paramedic",start:"response",
  edges:{response:["triage"],triage:["treatment"],treatment:["transport"],transport:["handoff"],handoff:["debrief"],debrief:["response"]},
  endings:{
    debriefed:{from:["debrief"],pay:0},
    casualty_lost:{from:["response","triage","treatment","transport","handoff"],pay:60},
    scene_unsafe:{from:["response","triage","treatment"],pay:20},
    patient_lost_in_transport:{from:["transport"],pay:15}
  },finishGuard:"emt_atomic",historyHook:"emt_history"});
JOB_CORE.guards.emt_atomic=(a,outcome)=>j05FinishAllowed(a,outcome);
JOB_CORE.historyHooks.emt_history=j05History;
JOB_CORE.finishHooks[JOB_EMT]=(state,a,outcome,pay)=>{
  const calls=j05ValidReceipts(a),record=j05CareerRecord(state),rank=j05CareerRank(state);
  if(!record.ok||!rank.ok||!Array.isArray(a.data.calls)||calls.length!==a.data.calls.length)
    throw new Error("invalid EMT career or receipts");
  if(outcome!=="debriefed")return {pay};
  const career=state.career&&typeof state.career==="object"&&!Array.isArray(state.career)?state.career:{};
  state.career=Object.assign({},career,{emt:{calls:record.calls+calls.length}});
  return {pay:Math.round(calls.reduce((n,r)=>n+r.pay,0)*(1+rank.bonus))};
};
function j05ValidReceipts(a){
  const raw=a&&a.data&&a.data.calls;if(!Array.isArray(raw)||raw.length<1||raw.length>J05_MAX_CALLS)return [];
  return raw.filter(r=>r&&typeof r==="object"&&!Array.isArray(r)&&typeof r.scene==="string"&&r.scene.length>0&&r.scene.length<=96&&
    r.vehicleCount===2&&r.casualtyCount===3&&r.triaged===true&&r.treated===true&&r.transported===true&&r.handoff===true&&
    Number.isSafeInteger(r.triageErrors)&&r.triageErrors>=0&&r.triageErrors<=3&&Number.isSafeInteger(r.treatmentErrors)&&r.treatmentErrors>=0&&r.treatmentErrors<=3&&
    Number.isSafeInteger(r.pay)&&r.pay>=0&&r.pay<=500);
}
function j05FinishAllowed(a,outcome){
  if(!a||a.contract!==JOB_EMT||!a.data)return false;
  if(outcome==="debriefed"){
    const read=jobReadState();if(!read.ok)return false;
    const record=j05CareerRecord(read.state),calls=j05ValidReceipts(a),raw=a.data.calls;
    return a.phase==="debrief"&&record.ok&&Array.isArray(raw)&&raw.length>=1&&calls.length===raw.length&&
      a.data.casualtyLost!==true&&a.data.sceneUnsafe!==true&&a.data.patientLostInTransport!==true&&
      Number.isSafeInteger(record.calls+calls.length);
  }
  if(outcome==="casualty_lost")return ["response","triage","treatment","transport","handoff"].includes(a.phase)&&a.data.casualtyLost===true&&
    J05_TRIAGE_ROLES.includes(a.data.lostRole);
  if(outcome==="scene_unsafe")return ["response","triage","treatment"].includes(a.phase)&&a.data.sceneUnsafe===true;
  if(outcome==="patient_lost_in_transport")return a.phase==="transport"&&a.data.patientLostInTransport===true&&J05_TRIAGE_ROLES.includes(a.data.lostRole);
  return false;
}
function j05History(a,outcome){
  return {outcome,callCount:j05ValidReceipts(a).length,triageOrder:Array.isArray(a.data.triageOrder)?a.data.triageOrder.slice(0,3):[],
    treatmentOrder:Array.isArray(a.data.treatmentOrder)?a.data.treatmentOrder.slice(0,3):[],triageErrors:Number.isSafeInteger(a.data.triageErrors)?a.data.triageErrors:0,
    treatmentErrors:Number.isSafeInteger(a.data.treatmentErrors)?a.data.treatmentErrors:0,casualtyLost:a.data.casualtyLost===true,
    sceneUnsafe:a.data.sceneUnsafe===true,patientLostInTransport:a.data.patientLostInTransport===true,
    vehicles:Array.isArray(a.data.vehicles)?a.data.vehicles.map(v=>v.key).slice(0,2):[]};
}
function j05Key(p){return p&&typeof p.key==="string"?p.key:"dyn"+p.x+","+p.y;}
function j05CarPropsNear(sx,sy){
  const tx=Math.floor((sx+CITY.orx)/16),ty=Math.floor((sy+CITY.ory)/16),cx=tx>>7,cy=ty>>7,found=new Map();
  for(let oy=-1;oy<=1;oy++)for(let ox=-1;ox<=1;ox++){
    const C=cityChunk(cx+ox,cy+oy);
    for(const p of C.props){
      if(!p||p.t!=="car"||p.wreck)continue;
      const key=j05Key(p);if(cityRT.used.has(key)||VEH.byKey.has(key))continue;
      const pose=vehPropPose(p),d=Math.hypot(pose.x-sx,pose.y-sy);
      if(d<=1200)found.set(key,{kind:"prop",key,x:p.x,y:p.y,wx:(p.x+p.w/2)*16,wy:(p.y+p.h/2)*16,d});
    }
  }
  return [...found.values()].sort((a,b)=>a.d-b.d||a.key.localeCompare(b.key)).slice(0,100);
}
function j05TrafficCandidates(sx,sy){
  if(typeof TRF==="undefined"||!Array.isArray(TRF.cars))return [];
  return TRF.cars.filter(c=>c&&!c.dead&&!VEH.byKey.has("trf"+c.id)&&Number.isFinite(c.x)&&Number.isFinite(c.y)&&Number.isFinite(c.ang))
    .map(c=>({kind:"traffic",id:c.id,key:"trf"+c.id,wx:c.x*32,wy:c.y*32,ang:c.ang,pv:c.pv|0,h:c.h|0,v:c.v,k:c.k,d:Math.hypot(c.x*32-CITY.orx-sx,c.y*32-CITY.ory-sy)}))
    .filter(v=>v.d<=1100).sort((a,b)=>a.d-b.d||a.key.localeCompare(b.key)).slice(0,24);
}
function j05SceneVehiclesNear(sx,sy){
  const all=[...j05TrafficCandidates(sx,sy),...j05CarPropsNear(sx,sy)],seen=new Set();
  return all.filter(v=>!seen.has(v.key)&&(seen.add(v.key),true));
}
function j05PatientSites(cx,cy,sx,sy,salt){
  const sites=[],used=[];
  for(let i=0;i<36&&sites.length<3;i++){
    const angle=((salt%360)+i*137.507764)%360*Math.PI/180,r=42+(i%4)*13;
    const p=cityFindWalkable(cx+Math.cos(angle)*r,cy+Math.sin(angle)*r,28,true);
    if(!p||Math.hypot(p[0]-cx,p[1]-cy)>132||cityCircleBlocked(p[0],p[1],8,false)||
      (cityFlagsAt(p[0],p[1])&(F_MOVE|F_IN|F_WATER))||used.some(q=>Math.hypot(q[0]-p[0],q[1]-p[1])<28))continue;
    if(!jobRouteValid(sx,sy,p[0],p[1]))continue;
    used.push(p);sites.push({wx:p[0]+CITY.orx,wy:p[1]+CITY.ory});
  }
  return sites.length===3?sites:null;
}
function j05PlanCall(sx=player&&player.x,sy=player&&player.y,salt=CITY.seed,medicalFallback=null){
  if(!CITY.on||!player||![sx,sy,salt].every(Number.isFinite)||typeof vehPropPose!=="function")
    return {ok:false,why:"Medical scene planning requires an active city and an on-foot starting point."};
  const vehicles=j05SceneVehiclesNear(sx,sy),pairs=[],diagnostics={vehicles:vehicles.length,pairs:0,sceneAttempts:0,sceneNoWalkable:0,sceneTooFar:0,sceneBlocked:0,sceneFlags:0,sceneUnrouted:0,scenes:0,patientSets:0,medicalSites:0,ambulanceSites:0};
  for(let i=0;i<vehicles.length;i++)for(let j=i+1;j<vehicles.length;j++){
    const a=vehicles[i],b=vehicles[j],d=Math.hypot(a.wx-b.wx,a.wy-b.wy),mx=(a.wx+b.wx)/2-CITY.orx,my=(a.wy+b.wy)/2-CITY.ory,from=Math.hypot(mx-sx,my-sy);
    if(d<110||d>850||from<180||from>720||Math.max(a.d,b.d)>1100)continue;
    pairs.push({a,b,d,mx,my,from,score:Math.abs(from-430)+Math.abs(d-480)*0.15});
  }
  pairs.sort((a,b)=>a.score-b.score||a.a.key.localeCompare(b.a.key)||a.b.key.localeCompare(b.b.key));diagnostics.pairs=pairs.length;
  for(const pair of pairs.slice(0,48)){
    diagnostics.sceneAttempts++;const scenePoint=cityFindWalkable(pair.mx,pair.my,240,true);
    if(!scenePoint){diagnostics.sceneNoWalkable++;continue;}
    if(Math.hypot(scenePoint[0]-pair.mx,scenePoint[1]-pair.my)>240){diagnostics.sceneTooFar++;continue;}
    if(cityCircleBlocked(scenePoint[0],scenePoint[1],8,false)){diagnostics.sceneBlocked++;continue;}
    if(cityFlagsAt(scenePoint[0],scenePoint[1])&(F_MOVE|F_IN|F_WATER)){diagnostics.sceneFlags++;continue;}
    if(!jobRouteValid(sx,sy,scenePoint[0],scenePoint[1])){diagnostics.sceneUnrouted++;continue;}
    const scene={wx:scenePoint[0]+CITY.orx,wy:scenePoint[1]+CITY.ory};diagnostics.scenes++;
    if([pair.a,pair.b].some(v=>Math.hypot(v.wx-scene.wx,v.wy-scene.wy)>540))continue;
    const sites=j05PatientSites(scenePoint[0],scenePoint[1],sx,sy,(salt+pair.a.key.length*31+pair.b.key.length*17)>>>0);
    if(!sites)continue;diagnostics.patientSets++;
    const clinics=typeof accNearBuildings==="function"?accNearBuildings(7000).filter(b=>["clinic","hospital"].includes(tfKind(b))):[];
    let medical=typeof jdMedicalOfferSite==="function"?jdMedicalOfferSite(scenePoint[0],scenePoint[1],clinics):null;
    if(!medical&&medicalFallback&&medicalFallback.clinic&&medicalFallback.delivery){const dest=jobSiteLocal(medicalFallback.delivery),existing={data:{clinic:medicalFallback.clinic,delivery:medicalFallback.delivery}};
      if(dest&&jdMedicalDestination(existing)&&jobRouteValid(scenePoint[0],scenePoint[1],dest.x,dest.y))medical={clinic:medicalFallback.clinic,site:medicalFallback.delivery};}
    if(!medical)continue;diagnostics.medicalSites++;
    const vx=pair.b.wx-pair.a.wx,vy=pair.b.wy-pair.a.wy,vd=Math.hypot(vx,vy)||1;let ambulance=null;
    for(const side of [1,-1]){const q=cityFindWalkable(scenePoint[0]+vy/vd*190*side,scenePoint[1]-vx/vd*190*side,56,true);
      if(!q||Math.hypot(q[0]-scenePoint[0],q[1]-scenePoint[1])<140||cityCircleBlocked(q[0],q[1],42,false)||
        !jobRouteValid(scenePoint[0],scenePoint[1],q[0],q[1])||sites.some(p=>Math.hypot(q[0]+CITY.orx-p.wx,q[1]+CITY.ory-p.wy)<76))continue;
      ambulance={wx:q[0]+CITY.orx,wy:q[1]+CITY.ory,ang:Math.atan2(vy,vx)};diagnostics.ambulanceSites++;break;
    }
    if(!ambulance)continue;
    return {ok:true,call:{scene,vehicles:[pair.a,pair.b],ambulance,clinic:medical.clinic,delivery:medical.site,casualties:[
      {role:"patient0",wx:sites[0].wx,wy:sites[0].wy,hp:10,initialHp:10,alive:true,triaged:false},
      {role:"patient1",wx:sites[1].wx,wy:sites[1].wy,hp:19,initialHp:19,alive:true,triaged:false},
      {role:"patient2",wx:sites[2].wx,wy:sites[2].wy,hp:27,initialHp:27,alive:true,triaged:false}],
      calls:[],callNo:1,triageOrder:[],triageErrors:0,arrived:false,sceneUnsafe:false,casualtyLost:false,patientLostInTransport:false}};
  }
  return {ok:false,why:"No reachable pair of unused vehicles with three safe casualty sites is nearby. Move through town and try dispatch again.",diagnostics};
}
function j05ContractReady(){return !!(v15ContractEnabled(JOB_EMT)&&runActive&&CITY.on&&player&&!player.inVehicle&&!player.roof&&
  (player.flyAlt||0)<=2&&TF.on&&SCN.mode==="economy");}
function j05CallOffer(){
  if(!j05ContractReady())return {ok:false,why:!v15ContractEnabled(JOB_EMT)?"Paramedic calls are unavailable in this revision.":"Stand outside on foot in an active economy town with civilians present."};
  const read=jobReadState();if(!read.ok)return read;if(read.state.active)return {ok:false,why:"Finish or withdraw the current incident first."};
  const career=j05CareerRecord(read.state);if(!career.ok)return {ok:false,why:"EMT career data is invalid; no rank or payout will be inferred."};
  const plan=j05PlanCall(player.x,player.y,(CITY.seed>>>0)+read.state.next*6151);if(!plan.ok)return plan;
  plan.call.ambulance.key="j05amb_"+tfHash(jobWorldKey()+"|"+read.state.next).toString(36);
  const offer=jobOffer(JOB_EMT,plan.call);if(!offer.ok)return offer;
  const accepted=jobAccept(offer.incident);if(!accepted.ok){jobWithdraw(offer.incident);return accepted;}
  const a=jobActive().active,vehicles=j05EnsureSceneVehicles(a),ambulance=j05EnsureAmbulance(a);
  if(!vehicles.ok||!ambulance.ok){jobWithdraw(offer.incident);return {ok:false,why:"The assigned response vehicles could not be established safely; no incident was left active."};}
  if(typeof MAPV!=="undefined")MAPV.lastSig="";
  return {ok:true,incident:offer.incident};
}
function j05Active(){const a=jdActive();return a&&a.contract===JOB_EMT?a:null;}
function j05RefProp(ref){
  if(!ref||ref.kind!=="prop"||typeof ref.key!=="string"||!Number.isFinite(ref.x)||!Number.isFinite(ref.y))return null;
  const tx=Math.floor(ref.x+0.01),ty=Math.floor(ref.y+0.01),C=cityChunk(tx>>7,ty>>7);
  return C.props.find(p=>p&&p.t==="car"&&j05Key(p)===ref.key)||null;
}
function j05EnsureSceneVehicles(source){
  if(!source||source.contract!==JOB_EMT||!Array.isArray(source.data.vehicles)||source.data.vehicles.length!==2||!CITY.on)return {ok:false,why:"saved vehicle scene is unavailable"};
  const read=jobReadState();if(!read.ok)return read;const a=read.state.active;if(!a||a.id!==source.id)return {ok:false,why:"incident is no longer active"};
  const live=[];
  for(const ref of a.data.vehicles){
    let v=VEH.byKey.get(ref.key);
    if(!v&&ref.kind==="traffic"){
      const c=typeof TRF!=="undefined"&&TRF.cars.find(q=>q&&q.id===ref.id);
      if(c)v=trfPromote(c,"medical_incident");
      else v=vehNew(vehKindOf("car",ref.pv,true,ref.h),ref.wx-CITY.orx,ref.wy-CITY.ory,ref.ang,64,144,
        {key:ref.key,h:ref.h,v:ref.pv,themed:true,art:"car",k:Number.isFinite(ref.k)&&ref.k>0?ref.k:1});
    }
    if(!v){const p=j05RefProp(ref);if(p)v=vehPromoteProp(p,"medical_incident");}
    if(!v)return {ok:false,why:"an assigned vehicle is absent or could not be promoted"};
    if(v.j05DamageIncident!==a.id){v.x=ref.wx-CITY.orx;v.y=ref.wy-CITY.ory;v.vx=0;v.vy=0;v.drv=null;v.ai=null;v.w=0;if(Number.isFinite(ref.ang))v.ang=ref.ang;vehDamage(v,0,-v.D*0.42,270,"crash",0,-1,"world");v.j05DamageIncident=a.id;v.why="medical_incident";}
    live.push(v);
  }
  return {ok:true,vehicles:live};
}
function j05EnsureAmbulance(source){
  if(!source||source.contract!==JOB_EMT||!source.data.ambulance||!Number.isFinite(source.data.ambulance.wx)||!Number.isFinite(source.data.ambulance.wy)||typeof source.data.ambulance.key!=="string")return {ok:false,why:"saved ambulance assignment is unavailable"};
  const ref=source.data.ambulance;let v=VEH.byKey.get(ref.key);
  if(!v){v=vehNew("ambulance",ref.wx-CITY.orx,ref.wy-CITY.ory,Number.isFinite(ref.ang)?ref.ang:0,148,246,
    {key:ref.key,h:tfHash(ref.key),v:2,art:"ambulance",from:"job",k:typeof vehWorldK==="function"?vehWorldK():1,fuel:0.85});
    if(v){v.why="medical_response";v.siren=true;v.ai=null;v.drv=null;v.vx=0;v.vy=0;}}
  if(!v||v.kind!=="ambulance")return {ok:false,why:"assigned ambulance could not be established"};
  return {ok:true,vehicle:v};
}
function j05PersonId(a,role){return "j05_"+tfHash(a.world+"|"+a.id+"|"+a.data.callNo+"|"+role).toString(36)+"_"+a.id+"_"+role;}
function j05Snapshot(p,rec){
  if(!p||!p.w||!rec)return false;const W=p.w;
  let changed=false;
  const values={wx:W.x+CITY.orx,wy:W.y+CITY.ory,hp:Number.isFinite(W.hp)?Math.max(0,Number(W.hp.toFixed(2))):0,alive:!!p.alive};
  for(const k of Object.keys(values))if(rec[k]!==values[k]){rec[k]=values[k];changed=true;}
  return changed;
}
function j05EnsureCasualties(source){
  if(!source||source.contract!==JOB_EMT||!TF.on||!CITY.on)return {ok:false,why:"town simulation is unavailable"};
  const read=jobReadState();if(!read.ok)return read;const a=read.state.active;
  if(!a||a.id!==source.id||a.contract!==JOB_EMT||!Array.isArray(a.data.casualties)||a.data.casualties.length!==3)return {ok:false,why:"saved casualty list is unavailable"};
  const b=jobSiteLocal(a.data.scene);if(!b)return {ok:false,why:"saved incident site is invalid"};
  let changed=false;const all=[];
  for(const rec of a.data.casualties){
    if(!rec||!J05_TRIAGE_ROLES.includes(rec.role)||!Number.isFinite(rec.wx)||!Number.isFinite(rec.wy)||!Number.isFinite(rec.hp))return {ok:false,why:"saved casualty record is invalid"};
    if(!rec.id){rec.id=j05PersonId(a,rec.role);changed=true;}
    const dead=tfMem().dead&&tfMem().dead[rec.id];if((dead||TF.npc.get(rec.id)?.alive===false)&&rec.alive){rec.alive=false;rec.hp=0;a.data.casualtyLost=true;a.data.lostRole=rec.role;changed=true;}
    const p=tfPerson(rec.id,tfRng(tfHash(rec.id)),{occ:"unemployed",home:null});
    p.j05Actor={incident:a.id,world:a.world,role:rec.role};
    if(p.alive&&rec.alive&&!rec.loaded&&!rec.handedOff&&!p.w&&Math.hypot(player.x-(rec.wx-CITY.orx),player.y-(rec.wy-CITY.ory))<=TF_LIVE_M*32*.8){
      p.jrec=null;tfJobClaim(p,"j05:"+a.id);const W=tfSpawnWalker(p,rec.wx-CITY.orx,rec.wy-CITY.ory,false,null);
      W.hp=rec.hp;W.jobContact=true;W.idle=1e6;W.tx=W.x;W.ty=W.y;W.flee=0;W.fleeX=0;W.fleeY=0;
    }else if(p.w){tfJobClaim(p,"j05:"+a.id);p.w.jobContact=true;p.w.idle=1e6;}
    if(p.w&&j05Snapshot(p,rec))changed=true;
    all.push(p);
  }
  if(changed&&!jobCommit(read.state,0).ok)return {ok:false,why:"casualty checkpoint was not saved"};
  return {ok:true,people:all};
}
function j05PeopleCheckpoint(source){
  if(!source||source.contract!==JOB_EMT||!source.data.casualties)return false;
  const read=jobReadState();if(!read.ok)return false;const a=read.state.active;if(!a||a.id!==source.id)return false;
  let changed=false;
  for(const rec of a.data.casualties){const p=rec&&TF.npc.get(rec.id);if(!p)continue;
    if(!p.alive||tfMem().dead?.[rec.id]){if(rec.alive!==false||rec.hp!==0){rec.alive=false;rec.hp=0;a.data.casualtyLost=true;a.data.lostRole=rec.role;changed=true;}continue;}
    if(p.w&&j05Snapshot(p,rec))changed=true;
  }
  return !changed||jobCommit(read.state,0).ok;
}
function j05Patient(source,role){const r=source&&source.data&&source.data.casualties&&source.data.casualties.find(p=>p.role===role);return r&&TF.npc.get(r.id)||null;}
function j05PatientSite(rec){return rec?jobSiteLocal({wx:rec.wx,wy:rec.wy}):null;}
function j05Severity(hp){return hp<=12?"IMMEDIATE":hp<=21?"URGENT":"DELAYED";}
function j05PatientNear(p){return !!(p&&p.alive&&p.w&&player&&!player.inVehicle&&!player.roof&&(player.flyAlt||0)<=2&&Math.hypot(player.x-p.w.x,player.y-p.w.y)<56);}
function j05AtScene(a){const q=jobSiteLocal(a&&a.data&&a.data.scene);return !!(q&&player&&!player.inVehicle&&!player.roof&&(player.flyAlt||0)<=2&&Math.hypot(player.x-q.x,player.y-q.y)<72);}
function j05Arrive(id){
  const a=j05Active();if(!a||a.id!==id||a.phase!=="response"||!jdNear(a))return {ok:false,why:"Reach the reachable incident marker on foot before starting triage."};
  const v=j05EnsureSceneVehicles(a);if(!v.ok)return v;
  const r=jobAdvance(id,"response","triage",{arrived:true});if(!r.ok)return r;
  const people=j05EnsureCasualties(j05Active());if(!people.ok)return people;
  jdNotice("SCENE ARRIVAL · Two damaged vehicles and three pinned casualties are on scene. Assess severity and triage on foot.");
  if(typeof MAPV!=="undefined")MAPV.lastSig="";
  return r;
}
function j05Triage(id,role){
  const a=j05Active();if(!a||a.id!==id||a.phase!=="triage"||!a.data.arrived||!J05_TRIAGE_ROLES.includes(role))return {ok:false,why:"Triage is unavailable at this checkpoint."};
  const read=jobReadState();if(!read.ok)return read;const active=read.state.active;if(!active||active.id!==id)return {ok:false,why:"incident is no longer active"};
  const rec=active.data.casualties.find(p=>p.role===role),person=rec&&TF.npc.get(rec.id);
  if(!rec||!rec.alive||rec.triaged||!j05PatientNear(person))return {ok:false,why:"Stand beside a living, untriaged casualty to assess them."};
  const intended=active.data.casualties.filter(p=>p.alive&&!p.triaged).slice().sort((x,y)=>x.hp-y.hp||x.role.localeCompare(y.role)).map(p=>p.role);
  const order=Array.isArray(active.data.triageOrder)?active.data.triageOrder.slice(0,3):[],wrong=role!==intended[0];
  order.push(role);rec.triaged=true;rec.triageSeverity=j05Severity(rec.hp);rec.triageIndex=order.length;
  active.data.triageOrder=order;active.data.triageErrors=(Number.isSafeInteger(active.data.triageErrors)?active.data.triageErrors:0)+(wrong?1:0);
  if(wrong)active.data.triageFaults=[...(Array.isArray(active.data.triageFaults)?active.data.triageFaults:[]),{role,priority:intended[order.length-1]}].slice(0,3);
  const saved=jobCommit(read.state,0);if(saved.ok){jdNotice(wrong?"TRIAGE ORDER WARNING · A more critical casualty was available first; the call outcome will reflect the delay.":"TRIAGE RECORDED · Severity is saved. Continue to each remaining casualty.");if(typeof MAPV!=="undefined")MAPV.lastSig="";}
  return saved.ok?{ok:true,wrong,order}:saved;
}
function j05BeginTreatment(id){
  const a=j05Active();if(!a||a.id!==id||a.phase!=="triage"||!Array.isArray(a.data.triageOrder)||a.data.triageOrder.length!==3||
    !a.data.casualties.every(r=>!r.alive||r.triaged)||a.data.casualtyLost)return {ok:false,why:"Assess all living casualties before starting treatment."};
  return jobAdvance(id,"triage","treatment",{treatmentOrder:[],treatmentErrors:0,treatmentFaults:[]});
}
function j05Treat(id,role){
  const a=j05Active();if(!a||a.id!==id||a.phase!=="treatment"||!J05_TRIAGE_ROLES.includes(role))return {ok:false,why:"Treatment is unavailable at this checkpoint."};
  const read=jobReadState();if(!read.ok)return read;const active=read.state.active;if(!active||active.id!==id||active.phase!=="treatment")return {ok:false,why:"incident is no longer in treatment"};
  const rec=active.data.casualties.find(p=>p.role===role),person=rec&&TF.npc.get(rec.id);
  if(!rec||!rec.alive||!rec.triaged||rec.treated||!j05PatientNear(person))return {ok:false,why:"Stand beside a living, triaged patient who has not yet been stabilized."};
  const intended=active.data.casualties.filter(p=>p.alive&&!p.treated).slice().sort((x,y)=>(x.initialHp??x.hp)-(y.initialHp??y.hp)||x.role.localeCompare(y.role)).map(p=>p.role);
  const order=Array.isArray(active.data.treatmentOrder)?active.data.treatmentOrder.slice(0,3):[],wrong=role!==intended[0];
  person.w.hp=Math.min(100,Math.max(Number(person.w.hp)||0,42));rec.hp=person.w.hp;rec.treated=true;rec.stabilized=true;rec.treatmentIndex=order.length+1;
  order.push(role);active.data.treatmentOrder=order;active.data.treatmentErrors=(Number.isSafeInteger(active.data.treatmentErrors)?active.data.treatmentErrors:0)+(wrong?1:0);
  if(wrong)active.data.treatmentFaults=[...(Array.isArray(active.data.treatmentFaults)?active.data.treatmentFaults:[]),{role,priority:intended[0]}].slice(0,3);
  const saved=jobCommit(read.state,0);if(saved.ok){jdNotice(wrong?"TREATMENT PRIORITY WARNING · A more critical untreated patient was waiting first; the debrief will reflect the delay.":"STABILIZED · The existing patient health record is saved.");if(typeof MAPV!=="undefined")MAPV.lastSig="";}
  return saved.ok?{ok:true,wrong,order}:saved;
}
function j05AmbulanceAtScene(a){
  const v=a&&a.data&&a.data.ambulance&&VEH.byKey.get(a.data.ambulance.key),q=jobSiteLocal(a&&a.data&&a.data.ambulance);
  return !!(v&&q&&Math.hypot(v.x-q.x,v.y-q.y)<40&&Math.hypot(v.x-player.x,v.y-player.y)<420);
}
function j05LoadPatient(id,role){
  const a=j05Active();if(!a||a.id!==id||a.phase!=="treatment"||!J05_TRIAGE_ROLES.includes(role))return {ok:false,why:"Patient loading is unavailable at this checkpoint."};
  const read=jobReadState();if(!read.ok)return read;const active=read.state.active;if(!active||active.id!==id)return {ok:false,why:"incident is no longer active"};
  const rec=active.data.casualties.find(p=>p.role===role),person=rec&&TF.npc.get(rec.id);
  if(!rec||!rec.alive||!rec.treated||rec.loaded||!j05PatientNear(person)||!j05AmbulanceAtScene(a))return {ok:false,why:"Stabilize the patient, then load them beside the assigned ambulance."};
  rec.loaded=true;rec.loadedCall=a.data.callNo;
  if(person.w){person.w.jobContact=false;person.w.jobEscort=false;const i=TF.walk.indexOf(person);if(i>=0)TF.walk.splice(i,1);person.w=null;}tfJobRelease(person);
  const saved=jobCommit(read.state,0);return saved.ok?{ok:true,role}:saved;
}
function j05TreatmentReady(a){return !!(a&&a.data&&Array.isArray(a.data.casualties)&&a.data.casualties.every(r=>!r.alive||(r.triaged&&r.treated&&r.loaded)));}
function j05BeginTransport(id){
  const a=j05Active(),ambulance=a&&j05EnsureAmbulance(a);if(!a||a.id!==id||a.phase!=="treatment"||!j05TreatmentReady(a)||!ambulance?.ok||ambulance.vehicle.fire>0||ambulance.vehicle.dead)return {ok:false,why:"Stabilize and load every living patient before driving the ambulance to the clinic."};
  const r=jobAdvance(id,"treatment","transport",{transportStarted:true,patientLostInTransport:false});if(r.ok)jdNotice("TRANSPORT · Drive the assigned ambulance to the validated medical entrance.");return r;
}
function j05InAmbulance(a){return !!(a&&player&&player.inVehicle===3&&VEH.me&&VEH.me.kind==="ambulance"&&VEH.me.key===a.data.ambulance?.key);}
function j05AmbulanceNearSite(a,limit=130){const v=a&&a.data&&a.data.ambulance&&VEH.byKey.get(a.data.ambulance.key),p=a&&jobSiteLocal(a.data.delivery);return !!(v&&p&&Math.hypot(v.x-p.x,v.y-p.y)<=limit);}
function j05ArriveHospital(id){
  const a=j05Active();if(!a||a.id!==id||a.phase!=="transport"||!j05InAmbulance(a)||!j05TreatmentReady(a)||!jdMedicalDestination(a)||!j05AmbulanceNearSite(a,150))return {ok:false,why:"Drive the assigned ambulance to the validated clinic entrance with all stabilized patients aboard."};
  const r=jobAdvance(id,"transport","handoff",{arrivedHospital:true});if(r.ok)jdNotice("HOSPITAL ARRIVAL · Park beside the medical entrance and transfer the patients on foot.");return r;
}
function j05Receipt(a){
  const errors=(a.data.triageErrors|0)+(a.data.treatmentErrors|0),pay=Math.max(40,100-(a.data.triageErrors|0)*15-(a.data.treatmentErrors|0)*20);
  return {scene:String(a.data.vehicles[0].key),vehicleCount:2,casualtyCount:3,triaged:true,treated:true,transported:true,handoff:true,
    triageErrors:a.data.triageErrors|0,treatmentErrors:a.data.treatmentErrors|0,priorityErrors:errors,ambulance:a.data.ambulance.key,clinic:a.data.clinic.uid,pay};
}
function j05ParkAmbulanceAfterHandoff(a){
  const ref=a&&a.data&&a.data.ambulance,v=ref&&VEH.byKey.get(ref.key),site=a&&jobSiteLocal(a.data.delivery),center=a&&a.data.clinic&&jobSiteLocal(a.data.clinic.center);if(!v||!site||!center)return false;
  const dx=site.x-center.x,dy=site.y-center.y,d=Math.hypot(dx,dy)||1;
  for(const offset of [280,340,420]){const q=cityFindWalkable(site.x+dx/d*offset,site.y+dy/d*offset,56,true);
    if(!q||Math.hypot(q[0]-site.x,q[1]-site.y)<210||cityCircleBlocked(q[0],q[1],64,false)||(cityFlagsAt(q[0],q[1])&(F_MOVE|F_IN|F_WATER)))continue;
    v.x=q[0];v.y=q[1];v.vx=0;v.vy=0;v.drv=null;v.ai=null;v.siren=false;ref.wx=q[0]+CITY.orx;ref.wy=q[1]+CITY.ory;return true;
  }
  return false;
}
function j05Handoff(id){
  const a=j05Active();if(!a||a.id!==id||a.phase!=="handoff"||!a.data.arrivedHospital||!jdNear(a)||!jdMedicalDestination(a)||!j05TreatmentReady(a)||!j05AmbulanceNearSite(a,170))return {ok:false,why:"Stand on foot at the validated medical entrance; the assigned ambulance and all patients must be present."};
  for(const rec of a.data.casualties){rec.handedOff=!!rec.alive;rec.loaded=false;const p=TF.npc.get(rec.id);if(p){if(p.w){p.w.jobContact=false;const i=TF.walk.indexOf(p);if(i>=0)TF.walk.splice(i,1);p.w=null;}tfJobRelease(p);p.j05Actor=null;}}
  const ambulanceParked=j05ParkAmbulanceAfterHandoff(a),calls=Array.isArray(a.data.calls)?a.data.calls:[],receipt=j05Receipt(a);
  const r=jobAdvance(id,"handoff","debrief",{handoff:true,ambulanceParked,calls:calls.concat([receipt])});if(r.ok)jdNotice("PATIENT HANDOFF COMPLETE · Review the call and debrief or continue your shift.");return r;
}
function j05End(id,outcome){const a=j05Active();if(!a||a.id!==id)return {ok:false,why:"This medical call is no longer active."};const r=jobFinish(id,outcome);if(r.ok){j05CleanupActors(a);jdNotice(outcome==="debriefed"?"PARAMEDIC SHIFT DEBRIEFED · "+r.pay+" added to your wallet.":"PARTIAL MEDICAL CALL · "+r.pay+" added; no clean call credit.");if(typeof MAPV!=="undefined")MAPV.lastSig="";}return r;}
function j05Continue(id){
  const a=j05Active(),calls=a&&j05ValidReceipts(a);if(!a||a.id!==id||a.phase!=="debrief"||!Array.isArray(a.data.calls)||a.data.calls.length>=J05_MAX_CALLS||!calls||calls.length!==a.data.calls.length)return {ok:false,why:"No further medical call is available in this shift."};
  const plan=j05PlanCall(player.x,player.y,(CITY.seed>>>0)+a.data.callNo*6151+String(a.id).length*71,{clinic:a.data.clinic,delivery:a.data.delivery});if(!plan.ok)return plan;
  plan.call.ambulance.key="j05amb_"+tfHash(jobWorldKey()+"|"+a.id+"|"+(a.data.callNo+1)).toString(36);
  j05CleanupActors(a);const nextNo=a.data.callNo+1,patch=Object.assign({},plan.call,{calls:a.data.calls.slice(),callNo:nextNo,triageOrder:[],triageErrors:0,triageFaults:[],treatmentOrder:[],treatmentErrors:0,treatmentFaults:[],arrived:false,transportStarted:false,arrivedHospital:false,sceneUnsafe:false,casualtyLost:false,patientLostInTransport:false,lostRole:null});
  const r=jobAdvance(id,"debrief","response",patch);if(!r.ok)return r;const next=j05Active(),v=j05EnsureSceneVehicles(next),amb=j05EnsureAmbulance(next);
  if(!v.ok||!amb.ok)return {ok:false,why:"Next call was saved but its response vehicles are unavailable; withdraw rather than claiming completion."};
  if(typeof MAPV!=="undefined")MAPV.lastSig="";jdNotice("NEXT MEDICAL CALL SAVED · Follow the new incident marker.");return r;
}
function j05SceneUnsafe(a){
  if(!a||!a.data)return false;const vehicles=j05EnsureSceneVehicles(a);if(!vehicles.ok)return true;
  const p=jobSiteLocal(a.data.scene);return !p||!!(cityFlagsAt(p.x,p.y)&(F_MOVE|F_IN|F_WATER))||vehicles.vehicles.some(v=>v.dead||v.wreck||v.fire>0.15);
}
function j05EndUnsafe(id){const a=j05Active();if(!a||a.id!==id||!j05SceneUnsafe(a))return {ok:false,why:"The incident scene is not currently unsafe."};const read=jobReadState();if(!read.ok)return read;read.state.active.data.sceneUnsafe=true;const saved=jobCommit(read.state,0);return saved.ok?j05End(id,"scene_unsafe"):saved;}
function j05EndCasualtyLost(id){const a=j05Active();if(!a||a.id!==id||!a.data.casualtyLost||!J05_TRIAGE_ROLES.includes(a.data.lostRole))return {ok:false,why:"No lost casualty is recorded."};return j05End(id,"casualty_lost");}
function j05TransportFailure(a){
  if(!a||a.phase!=="transport"||a.data.patientLostInTransport)return false;const v=VEH.byKey.get(a.data.ambulance?.key);
  if(!v||v.dead||v.wreck||v.fire>0.15){const role=(a.data.casualties||[]).find(r=>r.loaded&&r.alive)?.role;if(!role)return false;const read=jobReadState();if(!read.ok||!read.state.active||read.state.active.id!==a.id)return false;read.state.active.data.patientLostInTransport=true;read.state.active.data.lostRole=role;jobCommit(read.state,0);return true;}return false;
}
function j05Target(a){
  if(!a||a.contract!==JOB_EMT)return null;
  if(a.phase==="response")return jobSiteLocal(a.data.scene);
  if(a.phase==="triage"){
    const rec=(a.data.casualties||[]).find(p=>p.alive&&!p.triaged)||null;
    return j05PatientSite(rec)||jobSiteLocal(a.data.scene);
  }
  if(a.phase==="treatment"){
    const rec=(a.data.casualties||[]).find(p=>p.alive&&!p.treated)||null;
    return j05PatientSite(rec)||jobSiteLocal(a.data.scene);
  }
  if(a.phase==="transport"||a.phase==="handoff")return jobSiteLocal(a.data.delivery);
  if(a.phase==="debrief")return jobSiteLocal(a.data.delivery);
  return null;
}
const j05PreviousTarget=jdTarget;
jdTarget=function(a){return a&&a.contract===JOB_EMT?j05Target(a):j05PreviousTarget(a);};
function j05Withdraw(id){
  const a=j05Active();if(!a||a.id!==id)return {ok:false,why:"incident is no longer active"};
  j05PeopleCheckpoint(a);const r=jobWithdraw(id);if(r.ok)j05CleanupActors(a);return r;
}
function j05CleanupActors(a){
  for(const rec of a&&a.data&&a.data.casualties||[]){const p=rec&&TF.npc.get(rec.id);if(!p)continue;
    if(p.w){p.w.jobContact=false;p.w.jobEscort=false;}tfJobRelease(p);p.j05Actor=null;
  }
}
function j05Panel(){
  const panel=JOB_DISPATCH.panel,read=jobActive();if(!panel||!read.ok)return;
  let a=read.active;
  const btn=(label,fn)=>{const b=document.createElement("button");b.type="button";b.className="btn";b.textContent=label;b.style.cssText="min-height:46px;min-width:120px;margin:4px 6px 4px 0;white-space:normal";b.onclick=fn;panel.appendChild(b);};
  const text=(tag,value)=>{const e=document.createElement(tag);e.textContent=value;panel.appendChild(e);return e;};
  if(!a){
    if(!v15ContractEnabled(JOB_EMT))return;
    const state=jobReadState();if(!state.ok)return;text("p",j05CareerSummary(state.state));
    btn("MULTI-VEHICLE MEDICAL RESPONSE",()=>{const r=j05CallOffer();jdOpen(r.ok?"Medical response open. Follow the marker to the crash scene.":r.why);});return;
  }
  if(a.contract!==JOB_EMT||!read.inWorld||!v15JobEnabled(a))return;
  panel.innerHTML="";text("h3","PARAMEDIC RESPONSE · CALL "+a.data.callNo+"/"+J05_MAX_CALLS);text("p",j05CareerSummary(read.state));
  const vehicles=j05EnsureSceneVehicles(a),ambulance=j05EnsureAmbulance(a);
  if(!vehicles.ok||!ambulance.ok){text("p","An assigned response vehicle is absent. The call is paused; no triage or completion can be claimed.");btn("WITHDRAW · NO PAY",()=>{const r=j05Withdraw(a.id);jdOpen(r.ok?"Call withdrawn; no pay.":r.why);});return;}
  if(a.phase==="response"){
    text("p","Two existing cars have collision damage at the multi-vehicle scene. Reach the marked on-foot approach before triage; the assigned ambulance is parked nearby.");
    if(jdNear(a))btn("ARRIVE · ASSESS SCENE",()=>{const r=j05Arrive(a.id);jdOpen(r.ok?"Scene assessed. Triage the most critical patient first.":r.why);});
  }else if(a.phase==="triage"||a.phase==="treatment"){
    const people=j05EnsureCasualties(a);if(!people.ok)text("p","Casualty records could not be restored. The call is paused; no patient result is claimed.");a=j05Active()||a;
    if(a.data.casualtyLost)btn("CASUALTY LOST · PARTIAL OUTCOME",()=>{const r=j05EndCasualtyLost(a.id);jdOpen(r.ok?"Casualty lost; partial outcome recorded.":r.why);});
    if(j05SceneUnsafe(a))btn("SCENE UNSAFE · PARTIAL OUTCOME",()=>{const r=j05EndUnsafe(a.id);jdOpen(r.ok?"Unsafe scene recorded; clean credit is blocked.":r.why);});
    if(a.phase==="triage"){
      text("p","Triage uses each living patient's existing health value. Lower HP means higher urgency; completing the order improves the call outcome.");
      for(const rec of a.data.casualties||[]){
        const person=TF.npc.get(rec.id),hp=person&&person.w&&Number.isFinite(person.w.hp)?person.w.hp:rec.hp;
        text("p",rec.role.toUpperCase()+" · "+(rec.alive?"ALIVE":"LOST")+" · "+(rec.triaged?(rec.triageSeverity||j05Severity(hp))+" · triaged #"+rec.triageIndex:"HP "+hp+" · "+j05Severity(hp)+" · "+(person&&person.w&&j05PatientNear(person)?"at your position":"reach patient")));
        if(rec.alive&&!rec.triaged&&person&&j05PatientNear(person))btn("TRIAGE "+rec.role.toUpperCase(),()=>{const r=j05Triage(a.id,rec.role);jdOpen(r.ok?(r.wrong?"Triage saved with a priority delay.":"Triage recorded."):r.why);});
      }
      if((a.data.triageOrder||[]).length===3)btn("BEGIN TREATMENT",()=>{const r=j05BeginTreatment(a.id);jdOpen(r.ok?"Treatment started. Stabilize and load each living patient.":r.why);});
    }else{
      text("p","Stabilize living patients, then load them into the assigned ambulance. Treat the most urgent untreated patient first; out-of-order treatment reduces debrief pay.");
      for(const rec of a.data.casualties||[]){
        const person=TF.npc.get(rec.id),hp=person&&person.w&&Number.isFinite(person.w.hp)?person.w.hp:rec.hp;
        text("p",rec.role.toUpperCase()+" · "+(rec.alive?"ALIVE":"LOST")+" · "+(rec.loaded?"LOADED":rec.treated?"STABILIZED · "+hp+" HP":"NEEDS STABILIZATION · "+hp+" HP"));
        if(rec.alive&&!rec.treated&&person&&j05PatientNear(person))btn("STABILIZE "+rec.role.toUpperCase(),()=>{const r=j05Treat(a.id,rec.role);jdOpen(r.ok?(r.wrong?"Patient stabilized with a priority delay.":"Patient stabilized."):r.why);});
        else if(rec.alive&&rec.treated&&!rec.loaded&&person&&j05PatientNear(person)&&j05AmbulanceAtScene(a))btn("LOAD "+rec.role.toUpperCase()+" INTO AMBULANCE",()=>{const r=j05LoadPatient(a.id,rec.role);jdOpen(r.ok?"Patient loaded; continue to the remaining casualties.":r.why);});
      }
      if(j05TreatmentReady(a))btn("BEGIN AMBULANCE TRANSPORT",()=>{const r=j05BeginTransport(a.id);jdOpen(r.ok?"All living patients loaded. Drive the ambulance to the marked clinic.":r.why);});
    }
  }else if(a.phase==="transport"){
    j05TransportFailure(a);a=j05Active()||a;
    text("p","All stabilized patients are aboard. Drive the assigned ambulance to the validated clinic entrance; arrive in that vehicle.");
    if(a.data.patientLostInTransport)btn("PATIENT LOST IN TRANSPORT · PARTIAL",()=>{const r=j05End(a.id,"patient_lost_in_transport");jdOpen(r.ok?"Patient lost in transport; partial outcome recorded.":r.why);});
    else if(j05InAmbulance(a)&&j05AmbulanceNearSite(a,150)&&jdMedicalDestination(a))btn("ARRIVE AT MEDICAL ENTRANCE",()=>{const r=j05ArriveHospital(a.id);jdOpen(r.ok?"Hospital arrival recorded. Exit the ambulance and hand off the patients.":r.why);});
  }else if(a.phase==="handoff"){
    text("p","Hospital arrival is saved. Exit the ambulance and transfer the stabilized patients at the real clinic entrance.");
    if(!player.inVehicle&&jdNear(a)&&j05AmbulanceNearSite(a,170))btn("HAND OFF PATIENTS",()=>{const r=j05Handoff(a.id);jdOpen(r.ok?"Patients handed off. Debrief or continue the shift.":r.why);});
  }else if(a.phase==="debrief"){
    const receipts=j05ValidReceipts(a),base=receipts.reduce((n,r)=>n+r.pay,0),rank=j05CareerRank(read.state);
    text("p",receipts.length+" completed medical call"+(receipts.length===1?"":"s")+" · base pay "+base+" · current career bonus "+Math.round(rank.bonus*100)+"%.");
    btn("OFF DUTY · DEBRIEF",()=>{const r=j05End(a.id,"debriefed");jdOpen(r.ok?"Paramedic shift complete; "+r.pay+" paid.":r.why);});
    if(a.data.calls.length<J05_MAX_CALLS)btn("CONTINUE TO NEXT MEDICAL CALL",()=>{const r=j05Continue(a.id);jdOpen(r.ok?"Next medical call saved. Follow the new scene marker.":r.why);});
  }
  if(a.phase!=="debrief")btn("WITHDRAW · NO PAY",()=>{const r=j05Withdraw(a.id);jdOpen(r.ok?"Call withdrawn; no pay.":r.why);});
}
(function j05Wire(){
  if(!JD_CONTRACTS.includes(JOB_EMT))JD_CONTRACTS.push(JOB_EMT);
  const previousOpen=window.jdOpen;let checkpointClock=0;
  window.jdOpen=function(message){previousOpen(message);j05Panel();};
  V10.onStep.push((dt)=>{const a=j05Active();if(!a){checkpointClock=0;return;}checkpointClock+=Number.isFinite(dt)&&dt>0?dt:1/60;if(checkpointClock<1)return;checkpointClock=0;j05PeopleCheckpoint(a);if(a.phase==="transport")j05TransportFailure(a);});
  V10.onRunReset.push(()=>{const a=j05Active();if(a){j05PeopleCheckpoint(a);j05CleanupActors(a);}checkpointClock=0;});
})();

// EOF:js/jobemt.js
