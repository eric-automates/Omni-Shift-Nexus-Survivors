// FILE: js/jobfire.js
// PART: 15.6.3-part2 — playable fire-call loop on the part1 career/debrief foundation.
// The feature switch stays OFF until the full structure-fire call and its tests pass.
"use strict";

const JOB_FIRE = "fire_structure";
const J04_MAX_CALLS = 3;
const J04_RANKS = [
  {name:"Probationary Firefighter", calls:0, bonus:0},
  {name:"Firefighter", calls:2, bonus:0.05},
  {name:"Senior Firefighter", calls:5, bonus:0.10},
  {name:"Lieutenant", calls:9, bonus:0.15},
  {name:"Captain", calls:14, bonus:0.20}
];

// Missing is an old-save baseline (zero). A present malformed value is not
// silently repaired or promoted; finish is blocked until its record is valid.
function j04CareerRecord(state) {
  const root=state&&state.career;
  if(root==null)return {ok:true,calls:0,missing:true};
  if(typeof root!=="object"||Array.isArray(root))return {ok:false,calls:0,missing:false};
  if(!Object.prototype.hasOwnProperty.call(root,"firefighter"))return {ok:true,calls:0,missing:true};
  const r=root.firefighter;
  if(!r||typeof r!=="object"||Array.isArray(r)||!Number.isSafeInteger(r.calls)||r.calls<0)
    return {ok:false,calls:0,missing:false};
  return {ok:true,calls:r.calls,missing:false};
}
function j04CareerRank(state) {
  const record=j04CareerRecord(state);
  if(!record.ok)return {ok:false,rank:0,name:"Career record unavailable",bonus:0,calls:null,next:null};
  let i=0;for(let k=0;k<J04_RANKS.length;k++)if(record.calls>=J04_RANKS[k].calls)i=k;
  const next=J04_RANKS[i+1]?J04_RANKS[i+1].calls-record.calls:null;
  return {ok:true,rank:i+1,name:J04_RANKS[i].name,bonus:J04_RANKS[i].bonus,calls:record.calls,next};
}
function j04ValidReceipts(a) {
  const calls=a&&a.data&&a.data.calls;
  if(!Array.isArray(calls)||calls.length<1||calls.length>J04_MAX_CALLS)return [];
  return calls.filter(r=>r&&typeof r==="object"&&!Array.isArray(r)&&
    typeof r.building==="string"&&r.building.length>0&&r.building.length<=80&&
    r.rescued===true&&r.extinguished===true&&r.handoff===true&&
    Number.isSafeInteger(r.pay)&&r.pay>=0&&r.pay<=500);
}
function j04FinishAllowed(a,outcome) {
  if(!a||a.contract!==JOB_FIRE||!a.data)return false;
  if(outcome==="debriefed") {
    const record=j04CareerRecord(jobReadState().state);
    const calls=j04ValidReceipts(a);
    return a.phase==="debrief"&&record.ok&&calls.length===a.data.calls.length&&
      Number.isSafeInteger(record.calls+calls.length);
  }
  if(outcome==="civilian_lost")return ["rescue","escort","extinguish","handoff"].includes(a.phase)&&a.data.witnessLost===true;
  if(outcome==="building_lost")return ["assessment","rescue","escort","extinguish","handoff"].includes(a.phase)&&a.data.buildingTooFar===true;
  if(outcome==="player_defeated")return ["equipment","arrival","assessment","rescue","escort","extinguish","handoff","debrief"].includes(a.phase)&&a.data.playerDefeated===true;
  return false;
}

jobRegister({id:JOB_FIRE,role:"firefighter",start:"equipment",
  edges:{equipment:["arrival"],arrival:["assessment"],assessment:["rescue","extinguish"],rescue:["escort","extinguish"],escort:["extinguish"],extinguish:["handoff"],handoff:["debrief"],debrief:["equipment"]},
  endings:{
    debriefed:{from:["debrief"],pay:0},
    civilian_lost:{from:["rescue","escort","extinguish","handoff"],pay:85},
    building_lost:{from:["assessment","rescue","escort","extinguish","handoff"],pay:110},
    player_defeated:{from:["equipment","arrival","assessment","rescue","escort","extinguish","handoff","debrief"],pay:25}
  },finishGuard:"fire_shift_atomic"});
JOB_CORE.guards.fire_shift_atomic=(a,outcome)=>j04FinishAllowed(a,outcome);
JOB_CORE.finishHooks[JOB_FIRE]=(state,a,outcome,pay)=>{
  if(outcome!=="debriefed")return {pay};
  const calls=j04ValidReceipts(a),record=j04CareerRecord(state),rank=j04CareerRank(state);
  if(!record.ok||!rank.ok||calls.length!==a.data.calls.length)throw new Error("invalid firefighter debrief");
  const base=calls.reduce((n,r)=>n+r.pay,0),career=state.career&&typeof state.career==="object"&&!Array.isArray(state.career)?state.career:{};
  state.career=Object.assign({},career,{firefighter:{calls:record.calls+calls.length}});
  return {pay:Math.round(base*(1+rank.bonus))};
};

function j04ContractReady() {
  return !!(v15ContractEnabled(JOB_FIRE)&&runActive&&CITY.on&&player&&!player.inVehicle&&!player.roof&&(player.flyAlt||0)<=2&&TF.on&&SCN.mode==="economy");
}
function j04CareerSummary(state) {
  const rank=j04CareerRank(state);
  if(!rank.ok)return "FIREFIGHTER CAREER · saved rank data is invalid; no promotion or payout will be inferred.";
  return "FIREFIGHTER CAREER · Stage "+rank.rank+"/5 · "+rank.name+" · "+rank.calls+" completed call"+(rank.calls===1?"":"s")+
    (rank.next===null?" · top stage reached":" · "+rank.next+" more completed call"+(rank.next===1?"":"s")+" for the next stage");
}
// The call is offered only when a real fire station has the existing fire-engine
// furniture, a reachable engine-bay approach, and a reachable residential structure.
function j04Px(wx,wy){return {x:wx-CITY.orx,y:wy-CITY.ory};}
function j04WorldPx(x,y){return {wx:x+CITY.orx,wy:y+CITY.ory};}
function j04Ref(b){return b&&typeof b.uid==="string"?{uid:b.uid,wx:(b.x+b.w/2)*16,wy:(b.y+b.h/2)*16}:null;}
function j04BuildingFrom(ref){
  if(!ref||typeof ref.uid!=="string"||!Number.isFinite(ref.wx)||!Number.isFinite(ref.wy))return null;
  const tx=Math.floor(ref.wx/16),ty=Math.floor(ref.wy/16),C=cityChunk(tx>>7,ty>>7);
  return C&&C.blds.find(b=>b.uid===ref.uid)||null;
}
function j04Building(a){return j04BuildingFrom(a&&a.data&&a.data.structure);}
function j04EngineBuilding(a){return j04BuildingFrom(a&&a.data&&a.data.engine);}
function j04InteriorFloorNear(b,thing){
  if(!b||!thing)return null;
  const G0=cityInterior(b),cx=thing.x+thing.w/2,cy=thing.y+thing.h/2,candidates=[];
  for(let r=1;r<=4;r++)for(let y=Math.floor(cy-r);y<=Math.ceil(cy+r);y++)for(let x=Math.floor(cx-r);x<=Math.ceil(cx+r);x++){
    if(Math.max(Math.abs(x-cx),Math.abs(y-cy))>r||x<0||y<0||x>=G0.w||y>=G0.h||G0.c[y*G0.w+x]!==IC_FLOOR)continue;
    const tx=b.x+x,ty=b.y+y,flags=cityFlagsT(tx,ty);
    if((flags&F_IN)&&!(flags&F_MOVE)&&cityDamageMaterial(tx,ty)?.floor)candidates.push({x,y,tx,ty,d:Math.hypot(x-cx,y-cy)});
  }
  candidates.sort((a,c)=>a.d-c.d||a.y-c.y||a.x-c.x);
  const q=candidates[0];return q?{wx:q.tx*16+8,wy:q.ty*16+8}:null;
}
function j04StructureKind(b){return !!(b&&["house","farmhouse","commercial","shoprow","motel","apartment","warehouse"].includes(b.type));}
// J04 reuses the same body-clear city route validator but permits a longer
// engine-to-incident response leg than ordinary local dispatch (still bounded).
function j04RouteValid(sx,sy,tx,ty){
  const old=JOB_ROUTE.maxDistance;JOB_ROUTE.maxDistance=5000;
  try{return jobRouteValid(sx,sy,tx,ty);}finally{JOB_ROUTE.maxDistance=old;}
}
function j04DoorApproaches(b,sx,sy){
  if(!b)return [];
  const out=[];
  for(const e of accEntrances(b)){
    if(e.kind!=="door")continue;
    const cx=e.x+(e.axis==="x"?e.len/2:0.5),cy=e.y+(e.axis==="y"?e.len/2:0.5);
    for(const off of [2,3,4,5]){
      const lx=(cx+e.o[0]*off)*16+8-CITY.orx,ly=(cy+e.o[1]*off)*16+8-CITY.ory,q=cityFindWalkable(lx,ly,24,true);
      if(!q||Math.hypot(q[0]-lx,q[1]-ly)>24||cityCircleBlocked(q[0],q[1],7,false)||(cityFlagsAt(q[0],q[1])&(F_MOVE|F_IN|F_WATER)))continue;
      if(!j04RouteValid(sx,sy,q[0],q[1]))continue;
      out.push(j04WorldPx(q[0],q[1]));break;
    }
  }
  return out;
}
function j04PlanCall(sx=player&&player.x,sy=player&&player.y,salt=CITY.seed){
  if(!CITY.on||!player||!Number.isFinite(sx)||!Number.isFinite(sy)||!VK?.firetruck)return {ok:false,why:"Fire dispatch is unavailable in this world."};
  const nearby=accNearBuildings(7000),stations=nearby.filter(b=>(tfKind(b)==="fire"||b.type==="fire")&&cityInterior(b).furn.some(f=>f.t==="firetruck"));
  stations.sort((a,b)=>Math.hypot((a.x+a.w/2)*16-CITY.orx-sx,(a.y+a.h/2)*16-CITY.ory-sy)-Math.hypot((b.x+b.w/2)*16-CITY.orx-sx,(b.y+b.h/2)*16-CITY.ory-sy));
  for(const station of stations.slice(0,12)){
    const Gs=cityInterior(station),truck=Gs.furn.find(f=>f.t==="firetruck"),engineSite=j04InteriorFloorNear(station,truck);
    if(!engineSite)continue;
    const engineApproaches=j04DoorApproaches(station,sx,sy);if(!engineApproaches.length)continue;
    const engineLocal=j04Px(engineSite.wx,engineSite.wy),stationApproach=j04Px(engineApproaches[0].wx,engineApproaches[0].wy);
    const houses=nearby.filter(b=>j04StructureKind(b)&&b.uid!==station.uid&&
      Math.hypot((b.x+b.w/2)*16-CITY.orx-stationApproach.x,(b.y+b.h/2)*16-CITY.ory-stationApproach.y)<5000);
    houses.sort((a,b)=>Math.hypot((a.x+a.w/2)*16-CITY.orx-stationApproach.x,(a.y+a.h/2)*16-CITY.ory-stationApproach.y)-Math.hypot((b.x+b.w/2)*16-CITY.orx-stationApproach.x,(b.y+b.h/2)*16-CITY.ory-stationApproach.y));
    for(const house of houses.slice(0,30)){
      const approaches=j04DoorApproaches(house,stationApproach.x,stationApproach.y);if(!approaches.length)continue;
      const H=cityInterior(house),floors=[];
      for(let y=1;y<H.h-1;y++)for(let x=1;x<H.w-1;x++)if(H.c[y*H.w+x]===IC_FLOOR){
        const tx=house.x+x,ty=house.y+y;cityChunk(tx>>7,ty>>7);
        if(cityFireFloor(tx,ty,house.uid)&&!cityRT.fires.has(cityKeyT(tx,ty)))floors.push({tx,ty});
      }
      if(!floors.length)continue;
      const h0=(Math.imul((CITY.seed>>>0)^salt^house.uid.length*2654435761,2246822519)>>>0)%floors.length;
      const fire=floors[h0],occupant=floors.filter(q=>q!==fire&&Math.abs(q.tx-fire.tx)+Math.abs(q.ty-fire.ty)<=3).sort((q,r)=>Math.abs(q.tx-fire.tx)+Math.abs(q.ty-fire.ty)-Math.abs(r.tx-fire.tx)-Math.abs(r.ty-fire.ty)||q.ty-r.ty||q.tx-r.tx)[0]||fire;
      const fireSite={wx:fire.tx*16+8,wy:fire.ty*16+8},search={wx:occupant.tx*16+8,wy:occupant.ty*16+8},structure=j04Ref(house),engine=j04Ref(station);
      if(!fireSite||!search||!structure||!engine)continue;
      const sceneApproach=approaches[0],safe=sceneApproach;
      return {ok:true,call:{engine,engineSite,engineApproach:engineApproaches[0],structure,scene:sceneApproach,sceneApproach,fire:fireSite,search,safe,civilianMode:1,hoseReady:false,buildingTooFar:false,witnessLost:false,civilianRescued:false}};
    }
  }
  return {ok:false,why:"No reachable fire engine and occupiable structure pair is nearby. Move closer to a fire station and try again."};
}
function j04CallOffer(){
  if(!j04ContractReady())return {ok:false,why:!v15ContractEnabled(JOB_FIRE)?"Firefighter shifts are unavailable in this revision.":"Stand outside on foot in an active economy town with civilians present."};
  const read=jobReadState();if(!read.ok)return read;
  if(read.state.active)return {ok:false,why:"Finish or withdraw the current incident first."};
  const career=j04CareerRecord(read.state);if(!career.ok)return {ok:false,why:"Firefighter career data is invalid; no rank or payout will be inferred."};
  const plan=j04PlanCall(player.x,player.y,(CITY.seed>>>0)+read.state.next*313);if(!plan.ok)return plan;
  const offer=jobOffer(JOB_FIRE,Object.assign({calls:[],callNo:1},plan.call));if(!offer.ok)return offer;
  const accepted=jobAccept(offer.incident);if(!accepted.ok){jobWithdraw(offer.incident);return accepted;}
  if(typeof MAPV!=="undefined")MAPV.lastSig="";
  return {ok:true,incident:offer.incident};
}
function j04Active(){const a=jdActive();return a&&a.contract===JOB_FIRE?a:null;}
function j04FireEntries(a){
  const b=j04Building(a);if(!b||!cityRT)return [];
  return [...cityRT.fires].filter(([,f])=>f&&f.uid===b.uid).map(([key,f])=>{const [tx,ty]=cityDamageKeyParts(key);return {key,f,tx,ty,x:tx*16+8-CITY.orx,y:ty*16+8-CITY.ory};});
}
function j04FireCount(a){return j04FireEntries(a).length;}
function j04BuildingTooFar(a){
  const b=j04Building(a);if(!b)return false;
  let breaches=0;for(const r of cityRT.damage.values())if(r&&r.uid===b.uid&&r.breached)breaches++;
  return j04FireCount(a)>=5||breaches>=6;
}
function j04NearestFire(a){
  if(!a||!player)return null;let best=null,d0=44;
  for(const f of j04FireEntries(a)){const d=Math.hypot(player.x-f.x,player.y-f.y);if(d<d0&&cityLOS(player.x,player.y,f.x,f.y)){best=f;d0=d;}}
  return best;
}
function j04AtEngine(a){
  const b=j04EngineBuilding(a),site=jobSiteLocal(a&&a.data&&a.data.engineSite);
  return !!(b&&site&&player&&!player.inVehicle&&!player.roof&&(player.flyAlt||0)<=2&&
    cityBuildingAt(player.x,player.y)?.uid===b.uid&&Math.hypot(player.x-site.x,player.y-site.y)<52&&stClearLine(player.x,player.y,site.x,site.y,4));
}
function j04Target(a){
  if(!a||a.contract!==JOB_FIRE)return null;
  if(a.phase==="equipment")return jobSiteLocal(a.data.engineApproach);
  if(["arrival","assessment","handoff","debrief"].includes(a.phase))return jobSiteLocal(a.data.sceneApproach);
  if(a.phase==="rescue"){
    const p=jdContactSync(a);if(p&&p.w&&p.alive)return {x:p.w.x,y:p.w.y};
    return jobSiteLocal(a.data.witnessState||a.data.search||a.data.fire);
  }
  if(a.phase==="escort"){
    const p=JD_CONTACT.actor?.alive&&JD_CONTACT.actor.w?JD_CONTACT.actor.w:null;
    if(p&&Math.hypot(player.x-p.x,player.y-p.y)>160)return {x:p.x,y:p.y};
    return jobSiteLocal(a.data.safe);
  }
  if(a.phase==="extinguish"){
    const f=j04FireEntries(a).sort((q,r)=>Math.hypot(player.x-q.x,player.y-q.y)-Math.hypot(player.x-r.x,player.y-r.y))[0];
    return f?{x:f.x,y:f.y}:jobSiteLocal(a.data.fire);
  }
  return null;
}
const j04OriginalTarget=jdTarget;
jdTarget=function(a){return a&&a.contract===JOB_FIRE?j04Target(a):j04OriginalTarget(a);};
function j04Advance(id,expected,next,patch){
  const a=j04Active();if(!a||a.id!==id||a.phase!==expected)return {ok:false,why:"This fire-call action is stale."};
  return jobAdvance(id,expected,next,patch||{});
}
function j04TakeHose(id){
  const a=j04Active();if(!a||a.id!==id||a.phase!=="equipment"||!j04AtEngine(a))return {ok:false,why:"Enter the station and stand beside its existing fire engine to take the hose."};
  const b=j04Building(a);if(!b)return {ok:false,why:"The assigned structure is no longer present. No hose call can be started."};
  const fp=jobSiteLocal(a.data.fire);if(!fp)return {ok:false,why:"The saved fire location is invalid; no call was started."};
  const tx=cityTX(fp.x),ty=cityTY(fp.y),key=cityKeyT(tx,ty),existing=cityRT.fires.get(key);
  if(!existing){if(!cityFireIgnite(tx,ty,key,true))return {ok:false,why:"The assigned interior fire could not be started. The shift remains at the engine."};}
  else if(existing.uid!==b.uid)return {ok:false,why:"The saved fire tile no longer belongs to this structure."};
  const r=j04Advance(id,"equipment","arrival",{hoseReady:true});
  if(r.ok){jdNotice("HOSE READY · Respond to the marked structure. The fire engine remains a world vehicle; no new driving physics were added.");if(typeof MAPV!=="undefined")MAPV.lastSig="";}
  return r;
}
function j04Assess(id){
  const a=j04Active();if(!a||a.id!==id||a.phase!=="arrival"||!jdNear(a))return {ok:false,why:"Arrive at the assigned structure on foot before assessing."};
  if(!j04Building(a))return {ok:false,why:"The assigned building is absent. This call is paused; no rescue or payout can be claimed."};
  return j04Advance(id,"arrival","assessment");
}
function j04BeginRescue(id){
  const a=j04Active();if(!a||a.id!==id||a.phase!=="assessment"||!jdNear(a)||!a.data.hoseReady)return {ok:false,why:"Return to the scene with the engine hose ready before entering."};
  if(!j04Building(a))return {ok:false,why:"The assigned building is absent. No rescue can be claimed."};
  if(j04BuildingTooFar(a)){const read=jobReadState();if(!read.ok)return read;read.state.active.data.buildingTooFar=true;const r=jobCommit(read.state,0);return {ok:false,why:r.ok?"The building is too far gone; use the partial debrief.":"Could not save the structure assessment."};}
  return j04Advance(id,"assessment","rescue",{civilianMode:1});
}
function j04StartEscort(id){
  const a=j04Active(),p=a&&jdContactSync(a);
  if(!a||a.id!==id||a.phase!=="rescue"||!p||!jdPersonNear(p)||a.data.witnessLost)return {ok:false,why:"Find and approach the living civilian inside the structure on foot."};
  const w=p.w,safe=a.data.safe;
  const r=j04Advance(id,"rescue","escort",{witnessState:{wx:w.x+CITY.orx,wy:w.y+CITY.ory,hp:w.hp},safe});
  if(r.ok){w.jobEscort=true;if(typeof MAPV!=="undefined")MAPV.lastSig="";}
  return r;
}
function j04CompleteEvacuation(id){
  const a=j04Active();if(!a||a.id!==id||a.phase!=="escort"||!jdWitnessSafe(a))return {ok:false,why:"Walk the civilian outside to the marked safe area; the escort must physically reach it."};
  const p=JD_CONTACT.actor,w=p&&p.w;
  const r=j04Advance(id,"escort","extinguish",{civilianRescued:true,witnessState:w?{wx:w.x+CITY.orx,wy:w.y+CITY.ory,hp:w.hp}:a.data.witnessState});
  if(r.ok){jdContactRelease();if(typeof MAPV!=="undefined")MAPV.lastSig="";}
  return r;
}
function j04UseHose(id){
  const a=j04Active();if(!a||a.id!==id||a.phase!=="extinguish")return {ok:false,why:"The hose action is unavailable at this stage."};
  const b=j04Building(a),fire=j04NearestFire(a);if(!b)return {ok:false,why:"The assigned building is absent; the hose cannot be used against another site."};
  if(!fire)return {ok:false,why:"Move beside an active fire in the assigned structure."};
  const ok=cityDamageInteract({kind:"cityDamage",mode:"extinguish",key:fire.key,tx:fire.tx,ty:fire.ty,x:fire.x,y:fire.y});
  if(!ok)return {ok:false,why:"The engine hose action was not saved. Try again; the fire remains active."};
  const left=j04FireCount(a);jdNotice(left?"FIRE SECTION EXTINGUISHED · "+left+" active section"+(left===1?" remains.":"s remain."):"FIRE OUT · Confirm the civilian evacuation and hand off the scene.");
  return {ok:true,left};
}
function j04Handoff(id){
  const a=j04Active();if(!a||a.id!==id||a.phase!=="extinguish"||!jdNear(a)||!j04Building(a))return {ok:false,why:"Return to the scene marker; the assigned building must still exist."};
  if(j04FireCount(a)>0)return {ok:false,why:"Active fire remains in the assigned structure. Use the engine hose first."};
  if(a.data.witnessLost)return {ok:false,why:"The civilian was lost. Record the partial outcome instead of a clean handoff."};
  if(!a.data.civilianRescued)return {ok:false,why:"The civilian has not been physically escorted to safety."};
  return j04Advance(id,"extinguish","handoff",{handoff:"fire_controlled"});
}
function j04Debrief(id){
  const a=j04Active();if(!a||a.id!==id||a.phase!=="handoff"||a.data.handoff!=="fire_controlled"||!j04Building(a))return {ok:false,why:"The structure and fire-control handoff are no longer valid."};
  const calls=Array.isArray(a.data.calls)?a.data.calls:[];if(calls.length>=J04_MAX_CALLS)return {ok:false,why:"The shift call limit has been reached; finish the debrief."};
  const receipt={building:a.data.structure.uid,rescued:true,extinguished:true,handoff:true,pay:100};
  return j04Advance(id,"handoff","debrief",{calls:calls.concat([receipt])});
}
function j04Continue(id){
  const a=j04Active();if(!a||a.id!==id||a.phase!=="debrief"||!Array.isArray(a.data.calls)||a.data.calls.length>=J04_MAX_CALLS||j04ValidReceipts(a).length!==a.data.calls.length)return {ok:false,why:"No further call is available in this shift."};
  const plan=j04PlanCall(player.x,player.y,(CITY.seed>>>0)+id*971+a.data.callNo*67);if(!plan.ok)return plan;
  const patch=Object.assign({},plan.call,{callNo:a.data.callNo+1,hoseReady:false,witnessLost:false,witnessState:null,civilianRescued:false,buildingTooFar:false,handoff:null});
  const r=j04Advance(id,"debrief","equipment",patch);if(r.ok)jdNotice("NEXT FIRE CALL SAVED · Go to the marked fire engine and take the hose.");return r;
}
function j04End(id,outcome){
  const a=j04Active();if(!a||a.id!==id)return {ok:false,why:"This fire shift is no longer active."};
  const result=jobFinish(id,outcome);if(result.ok){jdContactRelease();jdNotice(outcome==="debriefed"?"SHIFT DEBRIEFED · "+result.pay+" added to your wallet.":"PARTIAL FIRE CALL · "+result.pay+" added; no clean-call promotion was recorded.");if(typeof MAPV!=="undefined")MAPV.lastSig="";}
  return result;
}
function j04RecordPlayerDefeat(id){
  const a=j04Active();if(!a||a.id!==id)return {ok:false,why:"No active fire call to close."};
  const read=jobReadState();if(!read.ok||read.state.active?.id!==id)return {ok:false,why:"The incident checkpoint could not be read."};
  read.state.active.data.playerDefeated=true;const marked=jobCommit(read.state,0);
  if(!marked){jdNotice("PLAYER DEFEATED · The incident checkpoint could not be saved; no reward was added.");return {ok:false,why:"The defeat checkpoint could not be saved."};}
  const result=j04End(id,"player_defeated");if(!result.ok)jdNotice("PLAYER DEFEATED · The partial outcome could not be saved; check storage.");return result;
}
function j04RecordBuildingLoss(){
  const a=j04Active();if(!a||a.data.buildingTooFar||!j04BuildingTooFar(a))return false;
  const read=jobReadState();if(!read.ok||!read.state.active||read.state.active.id!==a.id)return false;
  read.state.active.data.buildingTooFar=true;const r=jobCommit(read.state,0);
  if(r.ok)jdNotice("BUILDING TOO FAR GONE · A partial outcome is available; no clean handoff is possible.");
  return !!r.ok;
}
function j04Panel(){
  const panel=JOB_DISPATCH.panel,read=jobActive();if(!panel||!read.ok)return;
  const a=read.active;
  const btn=(label,fn)=>{const b=document.createElement("button");b.type="button";b.className="btn";b.textContent=label;b.style.cssText="min-height:46px;min-width:120px;margin:4px 6px 4px 0;white-space:normal";b.onclick=fn;panel.appendChild(b);};
  const text=(tag,value)=>{const e=document.createElement(tag);e.textContent=value;panel.appendChild(e);return e;};
  if(!a){
    if(!v15ContractEnabled(JOB_FIRE))return;
    const state=jobReadState();if(!state.ok)return;
    text("p",j04CareerSummary(state.state));
    btn("FIRE & RESCUE SHIFT",()=>{const r=j04CallOffer();jdOpen(r.ok?"Fire shift open. Reach the marked station and use its fire engine.":r.why);});
    return;
  }
  if(a.contract!==JOB_FIRE||!read.inWorld)return;
  panel.innerHTML="";text("h3","FIRE & RESCUE · CALL "+a.data.callNo+"/"+J04_MAX_CALLS);
  text("p",j04CareerSummary(read.state));
  const structure=j04Building(a),engine=j04EngineBuilding(a);
  if((a.phase!=="equipment"&&!structure)||(a.phase==="equipment"&&!engine)){
    text("p","The assigned "+(a.phase==="equipment"?"fire station / engine":"structure")+" is absent from this world. The call is paused; no rescue, handoff or completion payout can be claimed.");
    btn("WITHDRAW · NO PAY",()=>{const r=jobWithdraw(a.id);jdOpen(r.ok?"Call withdrawn; no pay.":r.why);});return;
  }
  const fireCount=j04FireCount(a),near=jdNear(a);
  if(a.phase==="equipment"){
    text("p","Reach the station by the validated outdoor route, enter on foot, then stand beside the existing fire engine to take its hose. No new vehicle physics are used.");
    if(j04AtEngine(a))btn("TAKE HOSE FROM FIRE ENGINE",()=>{const r=j04TakeHose(a.id);jdOpen(r.ok?"Hose ready. Respond to the structure.":r.why);});
  }else if(a.phase==="arrival"){
    text("p","Structure-fire call: arrive at the assigned exterior entrance. Assess the building before entering.");
    if(near)btn("ASSESS STRUCTURE",()=>{const r=j04Assess(a.id);jdOpen(r.ok?"Assessment complete. Locate and rescue the occupant.":r.why);});
  }else if(a.phase==="assessment"){
    text("p","The structure is still present. Use the normal entrance and move on foot; the occupant is inside the active fire area.");
    if(a.data.buildingTooFar||j04BuildingTooFar(a))btn("BUILDING TOO FAR GONE · "+JOB_CORE.defs[JOB_FIRE].endings.building_lost.pay,()=>{if(!a.data.buildingTooFar)j04RecordBuildingLoss();const r=j04End(a.id,"building_lost");jdOpen(r.ok?"Building lost; partial payout recorded.":r.why);});
    else if(near)btn("BEGIN CIVILIAN RESCUE",()=>{const r=j04BeginRescue(a.id);jdOpen(r.ok?"Enter the building. Follow the marker to the occupant.":r.why);});
  }else if(a.phase==="rescue"){
    const person=jdContactSync(a);
    text("p",a.data.witnessLost?"The civilian was lost in the fire. This is a partial ending; it cannot count as a clean call.":person&&jdPersonNear(person)?"The living civilian is beside you. Start the existing on-foot escort to the safe outdoor point.":"The occupant is inside the assigned structure. Reach them on foot; the fire remains a real hazard.");
    if(a.data.witnessLost)btn("CIVILIAN LOST · PARTIAL "+JOB_CORE.defs[JOB_FIRE].endings.civilian_lost.pay,()=>{const r=j04End(a.id,"civilian_lost");jdOpen(r.ok?"Civilian lost; partial payout recorded.":r.why);});
    else if(person&&jdPersonNear(person))btn("ESCORT CIVILIAN OUT",()=>{const r=j04StartEscort(a.id);jdOpen(r.ok?"Escort started. Walk outside together to the safe point.":r.why);});
    if(a.data.buildingTooFar||j04BuildingTooFar(a))btn("BUILDING TOO FAR GONE · "+JOB_CORE.defs[JOB_FIRE].endings.building_lost.pay,()=>{if(!a.data.buildingTooFar)j04RecordBuildingLoss();const r=j04End(a.id,"building_lost");jdOpen(r.ok?"Building lost; partial payout recorded.":r.why);});
  }else if(a.phase==="escort"){
    text("p","The rescued civilian walks using J02's existing escort machinery. Stay on foot and lead them to the marked safe point.");
    if(jdWitnessSafe(a))btn("CONFIRM CIVILIAN HANDOFF",()=>{const r=j04CompleteEvacuation(a.id);jdOpen(r.ok?"Civilian handed off safely. Now extinguish the remaining fire.":r.why);});
    if(a.data.witnessLost)btn("CIVILIAN LOST · PARTIAL "+JOB_CORE.defs[JOB_FIRE].endings.civilian_lost.pay,()=>{const r=j04End(a.id,"civilian_lost");jdOpen(r.ok?"Civilian lost; partial payout recorded.":r.why);});
    if(a.data.buildingTooFar||j04BuildingTooFar(a))btn("BUILDING TOO FAR GONE · "+JOB_CORE.defs[JOB_FIRE].endings.building_lost.pay,()=>{if(!a.data.buildingTooFar)j04RecordBuildingLoss();const r=j04End(a.id,"building_lost");jdOpen(r.ok?"Building lost; partial payout recorded.":r.why);});
  }else if(a.phase==="extinguish"){
    text("p","Civilian status: "+(a.data.civilianRescued?"safe and handed off":"not rescued")+". Active fire sections in this structure: "+fireCount+".");
    if(j04NearestFire(a))btn("USE FIRE ENGINE HOSE",()=>{const r=j04UseHose(a.id);jdOpen(r.ok?"Hose used. "+r.left+" active sections remain.":r.why);});
    if(a.data.witnessLost)btn("CIVILIAN LOST · PARTIAL "+JOB_CORE.defs[JOB_FIRE].endings.civilian_lost.pay,()=>{const r=j04End(a.id,"civilian_lost");jdOpen(r.ok?"Civilian lost; partial payout recorded.":r.why);});
    if(a.data.buildingTooFar||j04BuildingTooFar(a))btn("BUILDING TOO FAR GONE · "+JOB_CORE.defs[JOB_FIRE].endings.building_lost.pay,()=>{if(!a.data.buildingTooFar)j04RecordBuildingLoss();const r=j04End(a.id,"building_lost");jdOpen(r.ok?"Building lost; partial payout recorded.":r.why);});
    else if(fireCount===0&&near&&a.data.civilianRescued)btn("REQUEST FIRE-CONTROL HANDOFF",()=>{const r=j04Handoff(a.id);jdOpen(r.ok?"Fire is out. Complete the scene handoff.":r.why);});
  }else if(a.phase==="handoff"){
    text("p","The civilian is safe and the assigned building has no active fire. Transfer the controlled scene and record the call.");
    if(near)btn("COMPLETE SCENE HANDOFF",()=>{const r=j04Debrief(a.id);jdOpen(r.ok?"Scene handed off. Debrief or continue the shift.":r.why);});
  }else if(a.phase==="debrief"){
    const sum=a.data.calls.reduce((n,r)=>n+(r&&Number.isSafeInteger(r.pay)?r.pay:0),0);
    text("p",a.data.calls.length+" completed call"+(a.data.calls.length===1?"":"s")+" recorded · base shift pay "+sum+". Career progress and payment commit together when you go off duty.");
    btn("OFF DUTY · DEBRIEF",()=>{const r=j04End(a.id,"debriefed");jdOpen(r.ok?"Shift complete; "+r.pay+" paid.":r.why);});
    if(a.data.calls.length<J04_MAX_CALLS)btn("CONTINUE TO NEXT CALL",()=>{const r=j04Continue(a.id);jdOpen(r.ok?"Next call saved. Return to the existing fire engine.":r.why);});
  }
  if(a.phase!=="debrief"&&a.phase!=="offer")btn("WITHDRAW · NO PAY",()=>{const r=jobWithdraw(a.id);if(r.ok)jdContactRelease();jdOpen(r.ok?"Call withdrawn; no pay.":r.why);});
}
(function j04Wire(){
  JD_CONTRACTS.push(JOB_FIRE);
  const previousOpen=window.jdOpen,previousArrive=window.jdArrive,previousFind=window.findInteractTarget,previousTrigger=window.triggerWorldInteract;
  window.jdOpen=function(message){previousOpen(message);j04Panel();};
  window.jdArrive=function(){
    const a=j04Active();if(!a)return previousArrive.apply(this,arguments);
    if(!j04Building(a)&&a.phase!=="equipment"){jdOpen("The assigned structure is absent. The call is paused; no payout can be claimed.");return false;}
    if(a.phase==="arrival"&&jdNear(a)){const r=j04Assess(a.id);if(r.ok){if(typeof MAPV!=="undefined")MAPV.lastSig="";jdOpen("Assessment recorded. Locate and rescue the occupant.");return true;}jdOpen(r.why);return false;}
    if(jdNear(a)){jdOpen();return true;}return false;
  };
  window.findInteractTarget=function(){
    const a=j04Active();if(a){
      if(a.phase==="equipment"&&j04AtEngine(a))return {kind:"jobFire",action:"engine",x:player.x,y:player.y,label:"TAKE HOSE FROM FIRE ENGINE"};
      if(a.phase==="rescue"){const p=jdContactSync(a);if(p&&jdPersonNear(p))return {kind:"jobFire",action:"rescue",x:p.w.x,y:p.w.y,label:"RESCUE CIVILIAN"};}
      if(a.phase==="extinguish"){const f=j04NearestFire(a);if(f)return {kind:"jobFire",action:"hose",x:f.x,y:f.y,label:"USE FIRE ENGINE HOSE"};}
      const p=jdTarget(a);if(p&&jdNear(a))return {kind:"jobSupply",x:p.x,y:p.y,label:"FIRE CALL · "+a.phase.toUpperCase()};
    }
    return previousFind.apply(this,arguments);
  };
  window.triggerWorldInteract=function(){
    const t=typeof findInteractTarget==="function"?findInteractTarget():null;
    if(t&&t.kind==="jobFire"){jdOpen();return true;}
    const a=j04Active();if(a&&t&&t.kind==="jobSupply"){jdArrive();return true;}
    return previousTrigger.apply(this,arguments);
  };
  V10.onStep.push(()=>{
    const a=j04Active();if(!a)return;
    if(!j04Building(a)&&a.phase!=="equipment")return;
    if(!a.data.buildingTooFar&&j04BuildingTooFar(a))j04RecordBuildingLoss();
    if(["rescue","escort"].includes(a.phase))jdContactSync(a);
  });
  const oldEndRun=window.endRun;
  window.endRun=function(reason){
    const a=j04Active();if(a&&reason==="death")j04RecordPlayerDefeat(a.id);
    return oldEndRun.apply(this,arguments);
  };
})();
// EOF:js/jobfire.js
