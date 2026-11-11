// FILE: js/jobtactical.js
// PART: 15.6.4-LOCKED — playable barricaded-building call, civilian safety, and debrief continuation.
// The full J03 acceptance gate passed for 15.6.4; exposure is controlled by releaseprofile.js.
"use strict";

const JOB_TACTICAL = "tactical_barricade";
const J03_MAX_CALLS = 3;
const J03_RANKS = [
  {name:"Tactical Candidate", calls:0, bonus:0},
  {name:"Tactical Operator", calls:2, bonus:0.05},
  {name:"Senior Operator", calls:5, bonus:0.10},
  {name:"Team Leader", calls:9, bonus:0.15},
  {name:"Tactical Commander", calls:14, bonus:0.20}
];

// Missing is a zeroed old-save baseline. A present malformed record is never
// silently promoted or repaired during a debrief.
function j03CareerRecord(state) {
  const root=state&&state.career;
  if(root==null)return {ok:true,calls:0,missing:true};
  if(typeof root!=="object"||Array.isArray(root))return {ok:false,calls:0,missing:false};
  if(!Object.prototype.hasOwnProperty.call(root,"tactical"))return {ok:true,calls:0,missing:true};
  const r=root.tactical;
  if(!r||typeof r!=="object"||Array.isArray(r)||!Number.isSafeInteger(r.calls)||r.calls<0)
    return {ok:false,calls:0,missing:false};
  return {ok:true,calls:r.calls,missing:false};
}
function j03CareerRank(state) {
  const record=j03CareerRecord(state);
  if(!record.ok)return {ok:false,rank:0,name:"Career record unavailable",bonus:0,calls:null,next:null};
  let i=0;for(let k=0;k<J03_RANKS.length;k++)if(record.calls>=J03_RANKS[k].calls)i=k;
  const next=J03_RANKS[i+1]?J03_RANKS[i+1].calls-record.calls:null;
  return {ok:true,rank:i+1,name:J03_RANKS[i].name,bonus:J03_RANKS[i].bonus,calls:record.calls,next};
}
function j03ValidReceipts(a) {
  const calls=a&&a.data&&a.data.calls;
  if(!Array.isArray(calls)||calls.length<1||calls.length>J03_MAX_CALLS)return [];
  return calls.filter(r=>r&&typeof r==="object"&&!Array.isArray(r)&&
    typeof r.building==="string"&&r.building.length>0&&r.building.length<=80&&
    ["peaceful","forced"].includes(r.resolution)&&r.suspectResolved===true&&r.civiliansSafe===true&&
    Number.isSafeInteger(r.pay)&&r.pay>=0&&r.pay<=500);
}
function j03FinishAllowed(a,outcome) {
  if(!a||a.contract!==JOB_TACTICAL||!a.data)return false;
  if(outcome==="debriefed") {
    const state=jobReadState();if(!state.ok)return false;
    const record=j03CareerRecord(state.state),calls=j03ValidReceipts(a),raw=a.data.calls;
    return a.phase==="debrief"&&record.ok&&Array.isArray(raw)&&calls.length===raw.length&&raw.length>=1&&
      a.data.suspectEscaped!==true&&a.data.civilianHarmed!==true&&a.data.suspectHarmed!==true&&a.data.suspectDamaged!==true&&a.data.forcedEntryFailed!==true&&
      Number.isSafeInteger(record.calls+calls.length);
  }
  const raw=a.data.calls,calls=j03ValidReceipts(a),state=jobReadState();if(!state.ok||!Array.isArray(raw)||calls.length!==raw.length)return false;
  const record=j03CareerRecord(state.state);if(calls.length&&(!record.ok||!Number.isSafeInteger(record.calls+calls.length)))return false;
  if(outcome==="suspect_escaped")return ["perimeter","negotiation","entry","resolution"].includes(a.phase)&&a.data.suspectEscaped===true&&a.data.escapeReached===true;
  if(outcome==="civilian_harmed")return ["entry","resolution"].includes(a.phase)&&a.data.civilianHarmed===true;
  if(outcome==="suspect_harmed")return ["entry","resolution"].includes(a.phase)&&a.data.suspectHarmed===true;
  if(outcome==="forced_entry_failed")return ["entry","resolution"].includes(a.phase)&&a.data.forcedEntryFailed===true;
  return false;
}
function j03History(a,outcome) {
  const calls=j03ValidReceipts(a), last=a.data.calls&&a.data.calls.at(-1);
  return {outcome,callCount:calls.length,resolutions:calls.map(r=>r.resolution),
    lastResolution:last&&["peaceful","forced"].includes(last.resolution)?last.resolution:null,
    civiliansSafe:outcome==="debriefed"&&calls.length===a.data.calls?.length,
    civilianHarmed:a.data.civilianHarmed===true,suspectEscaped:a.data.suspectEscaped===true,suspectHarmed:a.data.suspectHarmed===true,
    forcedEntryFailed:a.data.forcedEntryFailed===true,harm:a.data.harmFacts||null};
}

jobRegister({id:JOB_TACTICAL,role:"tactical_officer",start:"briefing",
  edges:{briefing:["perimeter","resolution"],perimeter:["negotiation","entry","resolution"],negotiation:["entry","resolution"],entry:["resolution"],resolution:["debrief"],debrief:["briefing"]},
  endings:{
    debriefed:{from:["debrief"],pay:0},
    suspect_escaped:{from:["perimeter","negotiation","entry","resolution"],pay:35},
    civilian_harmed:{from:["entry","resolution"],pay:0},
    suspect_harmed:{from:["entry","resolution"],pay:0},
    forced_entry_failed:{from:["entry","resolution"],pay:20}
  },finishGuard:"tactical_atomic",historyHook:"tactical_history"});
JOB_CORE.guards.tactical_atomic=(a,outcome)=>j03FinishAllowed(a,outcome);
JOB_CORE.historyHooks.tactical_history=j03History;
JOB_CORE.finishHooks[JOB_TACTICAL]=(state,a,outcome,pay)=>{
  const calls=j03ValidReceipts(a),base=calls.reduce((n,r)=>n+r.pay,0);
  if(!Array.isArray(a.data.calls)||calls.length!==a.data.calls.length)throw new Error("invalid tactical receipts");
  const record=j03CareerRecord(state),rank=j03CareerRank(state);
  if(calls.length&&(!record.ok||!rank.ok||!Number.isSafeInteger(record.calls+calls.length)))throw new Error("invalid tactical career");
  if(calls.length){
    const career=state.career&&typeof state.career==="object"&&!Array.isArray(state.career)?state.career:{};
    state.career=Object.assign({},career,{tactical:{calls:record.calls+calls.length}});
  }
  if(outcome!=="debriefed")return {pay:pay+Math.round(base*(1+(rank.ok?rank.bonus:0)))};
  if(!record.ok||!rank.ok||calls.length<1)throw new Error("invalid tactical debrief");
  return {pay:Math.round(base*(1+rank.bonus))};
};
// J03 part2 — planner for a real, reachable building and one exterior perimeter.
// Candidate interior roles are validated floor cells, not world-position guesses.
function j03WorldPoint(x,y){return {wx:x+CITY.orx,wy:y+CITY.ory};}
function j03BuildingRef(b){return b&&typeof b.uid==="string"?{uid:b.uid,wx:(b.x+b.w/2)*16,wy:(b.y+b.h/2)*16}:null;}
function j03BuildingFrom(ref){
  if(!ref||typeof ref.uid!=="string"||!Number.isFinite(ref.wx)||!Number.isFinite(ref.wy))return null;
  const tx=Math.floor(ref.wx/16),ty=Math.floor(ref.wy/16),C=cityChunk(tx>>7,ty>>7);
  return C&&C.blds.find(b=>b.uid===ref.uid)||null;
}
function j03Building(a){return j03BuildingFrom(a&&a.data&&a.data.building);}
function j03Residential(b){const kind=b&&tfKind(b);return !!(kind&&TF_HOMES[kind]);}
function j03RoleTiles(b,salt){
  if(!b)return null;const G=cityInterior(b),floors=[];
  for(let y=1;y<G.h-1;y++)for(let x=1;x<G.w-1;x++){
    if(G.c[y*G.w+x]!==IC_FLOOR)continue;
    const tx=b.x+x,ty=b.y+y,flags=cityFlagsT(tx,ty),lx=tx*16+8-CITY.orx,ly=ty*16+8-CITY.ory;
    if(!(flags&F_IN)||(flags&(F_MOVE|F_WATER))||cityCircleBlocked(lx,ly,7,false))continue;
    floors.push({tx,ty,x:tx*16+8,y:ty*16+8});
  }
  if(floors.length<3)return null;
  const hash=s=>{let h=(CITY.seed>>>0)^((salt|0)>>>0);for(let i=0;i<s.length;i++)h=Math.imul(h^s.charCodeAt(i),16777619)>>>0;return h>>>0;};
  floors.sort((a,c)=>hash(a.tx+","+a.ty)-hash(c.tx+","+c.ty)||a.ty-c.ty||a.tx-c.tx);
  const suspect=floors[0],rest=floors.slice(1).sort((a,c)=>Math.abs(c.tx-suspect.tx)+Math.abs(c.ty-suspect.ty)-Math.abs(a.tx-suspect.tx)-Math.abs(a.ty-suspect.ty)||a.ty-c.ty||a.tx-c.tx);
  const civilianA=rest[0];
  const civilianB=rest.slice(1).sort((a,c)=>Math.abs(c.tx-civilianA.tx)+Math.abs(c.ty-civilianA.ty)-Math.abs(a.tx-civilianA.tx)-Math.abs(a.ty-civilianA.ty)||a.ty-c.ty||a.tx-c.tx)[0];
  if(!civilianA||!civilianB)return null;
  return {suspect:{wx:suspect.x,wy:suspect.y},civilians:[{wx:civilianA.x,wy:civilianA.y},{wx:civilianB.x,wy:civilianB.y}]};
}
function j03ExteriorApproach(b,sx,sy){
  for(const e of accEntrances(b)){
    if(e.kind!=="door")continue;
    const cx=e.x+(e.axis==="x"?e.len/2:0.5),cy=e.y+(e.axis==="y"?e.len/2:0.5);
    for(const off of [2,3,4,5]){
      const lx=(cx+e.o[0]*off)*16+8-CITY.orx,ly=(cy+e.o[1]*off)*16+8-CITY.ory;
      const q=cityFindWalkable(lx,ly,24,true);
      if(!q||Math.hypot(q[0]-lx,q[1]-ly)>24||cityCircleBlocked(q[0],q[1],7,false)||(cityFlagsAt(q[0],q[1])&(F_MOVE|F_IN|F_WATER)))continue;
      if(jobRouteValid(sx,sy,q[0],q[1]))return {site:j03WorldPoint(q[0],q[1]),door:{id:e.id,x:e.x,y:e.y,len:e.len,axis:e.axis}};
    }
  }
  return null;
}
function j03PlanCall(sx=player&&player.x,sy=player&&player.y,salt=CITY.seed){
  if(!CITY.on||!player||![sx,sy,salt].every(Number.isFinite))return {ok:false,why:"Tactical planning requires an active city and an on-foot starting point."};
  const buildings=accNearBuildings(6500).filter(j03Residential).slice();
  buildings.sort((a,b)=>Math.hypot((a.x+a.w/2)*16-CITY.orx-sx,(a.y+a.h/2)*16-CITY.ory-sy)-Math.hypot((b.x+b.w/2)*16-CITY.orx-sx,(b.y+b.h/2)*16-CITY.ory-sy));
  for(const b of buildings.slice(0,40)){
    const roles=j03RoleTiles(b,salt);if(!roles)continue;
    const perimeter=j03ExteriorApproach(b,sx,sy);if(!perimeter)continue;
    const building=j03BuildingRef(b);if(!building)continue;
    return {ok:true,call:{building,door:perimeter.door,perimeter:perimeter.site,suspectSite:roles.suspect,civilianSites:roles.civilians,
      civilianCount:roles.civilians.length,calls:[],callNo:1,negotiation:"unstarted",resolution:null,civilianHarmed:false,suspectEscaped:false,forcedEntryFailed:false}};
  }
  return {ok:false,why:"No reachable residential interior with an exterior door and three valid floor sites was found. Move closer and retry."};
}
function j03ContractReady(){return !!(v15ContractEnabled(JOB_TACTICAL)&&runActive&&CITY.on&&player&&!player.inVehicle&&!player.roof&&(player.flyAlt||0)<=2&&TF.on&&SCN.mode==="economy");}
function j03CallOffer(){
  if(!j03ContractReady())return {ok:false,why:!v15ContractEnabled(JOB_TACTICAL)?"Tactical calls are unavailable in this revision.":"Stand outside on foot in an active economy town."};
  const read=jobReadState();if(!read.ok)return read;
  if(read.state.active)return {ok:false,why:"Finish or withdraw the current incident first."};
  const career=j03CareerRecord(read.state);if(!career.ok)return {ok:false,why:"Tactical career data is invalid; no rank or payout will be inferred."};
  const plan=j03PlanCall(player.x,player.y,(CITY.seed>>>0)+read.state.next*4099);if(!plan.ok)return plan;
  const offer=jobOffer(JOB_TACTICAL,plan.call);if(!offer.ok)return offer;
  const accepted=jobAccept(offer.incident);if(!accepted.ok){jobWithdraw(offer.incident);return accepted;}
  const actors=j03EnsureActors(j03Active());
  if(!actors.ok){jobWithdraw(offer.incident);return {ok:false,why:"The assigned residents could not be safely pinned; no call was left active."};}
  if(typeof MAPV!=="undefined")MAPV.lastSig="";
  return {ok:true,incident:offer.incident};
}
function j03Active(){const a=jdActive();return a&&a.contract===JOB_TACTICAL?a:null;}
function j03RoleSite(a,role){return role==="suspect"?a.data.suspectSite:role==="civilian0"?a.data.civilianSites?.[0]:a.data.civilianSites?.[1];}
function j03ActorTag(a,role,id){return {incident:a.id,world:a.world,callNo:a.data.callNo,role,id};}
function j03Snapshot(p,role){
  const W=p&&p.w;if(!p||!W)return null;
  return {id:p.id,wx:W.x+CITY.orx,wy:W.y+CITY.ory,hp:Number.isFinite(W.hp)?Math.max(0,Number(W.hp.toFixed(2))):0,alive:!!p.alive,inside:W.inside||null,role,
    flee:Number.isFinite(W.flee)?W.flee:0,fleeWX:Number.isFinite(W.fleeX)?W.fleeX+CITY.orx:null,fleeWY:Number.isFinite(W.fleeY)?W.fleeY+CITY.ory:null,
    txw:Number.isFinite(W.tx)?W.tx+CITY.orx:null,tyw:Number.isFinite(W.ty)?W.ty+CITY.ory:null,idle:Number.isFinite(W.idle)?W.idle:0,stun:Number.isFinite(W.stun)?W.stun:0};
}
function j03SnapshotChanged(s,r){
  if(!s||!r)return true;
  return Math.abs(s.wx-r.wx)>=12||Math.abs(s.wy-r.wy)>=12||s.hp!==r.hp||s.alive!==r.alive||s.inside!==r.inside||
    Math.abs((s.flee||0)-(r.flee||0))>=.2||s.fleeWX!==r.fleeWX||s.fleeWY!==r.fleeWY||s.txw!==r.txw||s.tyw!==r.tyw||
    Math.abs((s.idle||0)-(r.idle||0))>=1||Math.abs((s.stun||0)-(r.stun||0))>=.2;
}
function j03ActorId(a,role){return "j03_"+tfHash(a.world+"|"+a.id+"|"+a.data.callNo+"|"+role).toString(36)+"_"+a.id+"_"+a.data.callNo+"_"+role;}
function j03EnsureActors(source){
  if(!source||source.contract!==JOB_TACTICAL||!TF.on||!CITY.on)return {ok:false,why:"town simulation is unavailable"};
  const read=jobReadState();if(!read.ok)return read;
  const a=read.state.active;if(!a||a.id!==source.id||a.contract!==JOB_TACTICAL)return {ok:false,why:"call is no longer active"};
  const b=j03Building(a);if(!b)return {ok:false,why:"assigned building is absent"};
  const roles=["suspect","civilian0","civilian1"],people=Object.assign({},a.data.people||{});let changed=false;
  for(const role of roles){
    const site=j03RoleSite(a,role),local=jobSiteLocal(site);if(!site||!local)return {ok:false,why:"assigned interior role is missing"};
    if(role==="suspect"&&a.data.suspectEscaped===true)continue;
    let rec=people[role];if(!rec){rec={id:j03ActorId(a,role),wx:site.wx,wy:site.wy,hp:30,alive:true,inside:b.uid,role};people[role]=rec;changed=true;}
    let p=TF.npc.get(rec.id);
    if(!p)p=tfPerson(rec.id,tfRng(tfHash(rec.id)),{occ:"unemployed",home:b.uid});
    const dead=tfMem().dead&&tfMem().dead[rec.id];
    if(dead||!p.alive||rec.alive===false){if(rec.alive!==false){rec.alive=false;rec.hp=0;changed=true;}if(role!=="suspect"&&a.data.civilianHarmed!==true){a.data.civilianHarmed=true;a.data.harmFacts={role,how:"death_recorded",by:"world",died:true,callNo:a.data.callNo};if(["briefing","perimeter","negotiation","entry"].includes(a.phase))a.phase="resolution";changed=true;}continue;}
    p.j03Actor=j03ActorTag(a,role,rec.id);
    if(!p.w){
      if(Math.hypot(player.x-local.x,player.y-local.y)>TF_LIVE_M*32*.8)continue;
      p.jrec=null;tfJobClaim(p,"j03:"+a.id+":"+a.data.callNo);
      const W=tfSpawnWalker(p,local.x,local.y,rec.inside!==null,b);W.hp=Number.isFinite(rec.hp)?Math.max(1,rec.hp):30;W.jobContact=true;W.idle=Number.isFinite(rec.idle)?rec.idle:1e6;W.tx=Number.isFinite(rec.txw)?rec.txw-CITY.orx:W.x;W.ty=Number.isFinite(rec.tyw)?rec.tyw-CITY.ory:W.y;W.flee=Number.isFinite(rec.flee)?rec.flee:0;W.fleeX=Number.isFinite(rec.fleeWX)?rec.fleeWX-CITY.orx:0;W.fleeY=Number.isFinite(rec.fleeWY)?rec.fleeWY-CITY.ory:0;W.stun=Number.isFinite(rec.stun)?rec.stun:0;
    }else{tfJobClaim(p,"j03:"+a.id+":"+a.data.callNo);p.w.jobContact=true;}
    const snap=j03Snapshot(p,role);if(j03SnapshotChanged(snap,rec)){people[role]=snap;changed=true;}
  }
  if(changed){a.data.people=people;const saved=jobCommit(read.state,0);if(!saved.ok)return saved;}
  return {ok:true,people};
}
function j03PeopleCheckpoint(a){
  if(!a||a.contract!==JOB_TACTICAL||!a.data.people)return false;
  const read=jobReadState();if(!read.ok)return false;const live=read.state.active;if(!live||live.id!==a.id)return false;
  const people=Object.assign({},live.data.people||{});let changed=false;
  for(const role of ["suspect","civilian0","civilian1"]){const rec=people[role],p=rec&&TF.npc.get(rec.id);if(!p)continue;
    if(!p.alive){if(rec.alive!==false){rec.alive=false;rec.hp=0;changed=true;}continue;}
    if(!p.w)continue;
    const snap=j03Snapshot(p,role);if(j03SnapshotChanged(snap,rec)){people[role]=snap;changed=true;}
  }
  if(!changed)return true;live.data.people=people;return jobCommit(read.state,0).ok;
}
function j03CiviliansSafe(a){
  const people=a&&a.data&&a.data.people;if(!people||a.data.civilianHarmed===true)return false;
  for(const role of ["civilian0","civilian1"]){const r=people[role],p=r&&TF.npc.get(r.id);if(!r||r.alive!==true||r.hp!==30||!p||!p.alive)return false;}
  return true;
}
function j03Actor(a,role){const r=a&&a.data&&a.data.people&&a.data.people[role];return r&&TF.npc.get(r.id)||null;}
function j03CleanupActors(a){
  const people=a&&a.data&&a.data.people;if(!people)return;
  for(const role of ["suspect","civilian0","civilian1"]){const rec=people[role],p=rec&&TF.npc.get(rec.id);if(!p)continue;
    if(p.w){p.w.jobContact=false;p.w.jobEscort=false;}tfJobRelease(p);p.j03Actor=null;
  }
}
function j03Target(a){
  if(!a||a.contract!==JOB_TACTICAL)return null;
  if(["briefing","perimeter","negotiation","debrief"].includes(a.phase)||a.data.suspectEscaped===true)return jobSiteLocal(a.data.perimeter);
  if(["entry","resolution"].includes(a.phase)&&a.data.suspectResolved!==true)return jobSiteLocal(a.data.suspectSite);
  return null;
}
const j03OriginalTarget=jdTarget;
jdTarget=function(a){return a&&a.contract===JOB_TACTICAL?j03Target(a):j03OriginalTarget(a);};
function j03SetPerimeter(id){
  const a=j03Active();if(!a||a.id!==id||a.phase!=="briefing"||!j03Building(a)||!jdNear(a))return {ok:false,why:"Reach the marked exterior entrance before establishing the perimeter."};
  const r=jobAdvance(id,"briefing","perimeter",{perimeterSet:true});
  if(r.ok){j03EnsureActors(j03Active());if(typeof MAPV!=="undefined")MAPV.lastSig="";jdNotice("PERIMETER SET · The marked door, interior roles and civilian positions are checkpointed.");}
  return r;
}
function j03StartNegotiation(id){
  const a=j03Active();if(!a||a.id!==id||a.phase!=="perimeter"||!a.data.perimeterSet||!jdNear(a))return {ok:false,why:"Return to the saved exterior perimeter to open negotiations."};
  const r=jobAdvance(id,"perimeter","negotiation",{negotiation:"in_progress",delayCount:0});if(r.ok)jdNotice("NEGOTIATION OPEN · Choose a peaceful surrender, a final warning, or risk losing the suspect by delaying.");return r;
}
function j03Negotiate(id,choice){
  const a=j03Active();if(!a||a.id!==id||a.phase!=="negotiation"||!jdNear(a))return {ok:false,why:"Return to the perimeter before changing the negotiation plan."};
  if(choice==="peaceful")return jobAdvance(id,"negotiation","entry",{negotiation:"peaceful",suspectSurrendered:false,entryStarted:false});
  if(choice==="forced")return jobAdvance(id,"negotiation","entry",{negotiation:"forced",suspectSurrendered:false,entryStarted:false});
  if(choice==="delay"){
    const count=(Number.isSafeInteger(a.data.delayCount)?a.data.delayCount:0)+1;
    if(count<2){const read=jobReadState();if(!read.ok)return read;const active=read.state.active;if(!active||active.id!==id||active.phase!=="negotiation")return {ok:false,why:"Negotiation checkpoint changed; reopen the call."};active.data=Object.assign({},active.data,{delayCount:count});const r=jobCommit(read.state,0);if(r.ok)jdNotice("Negotiation continues; the gap is narrowing. One more delay lets the suspect escape.");return r;}
    const r=jobAdvance(id,"negotiation","resolution",{delayCount:count,suspectEscaped:true,escapeStarted:true,escapeReached:false,resolution:"escaped"});
    if(r.ok)jdNotice("SUSPECT FLEEING · Follow the marked real exit; the escape is recorded only after the suspect reaches the street.");return r;
  }
  return {ok:false,why:"Unknown negotiation choice."};
}
function j03SquadCounts(b){
  let total=0,inside=0;
  if(typeof mAct==="undefined"||typeof mTeam==="undefined")return {total,inside};
  for(let i=0;i<MAX_MINION;i++)if(mAct[i]&&mTeam[i]===1&&mHP[i]>0){total++;const bb=cityBuildingAt(mX[i],mY[i]);if(bb&&bb.uid===b.uid)inside++;}
  return {total,inside};
}
function j03EntryReady(a){
  const b=j03Building(a),p=jobSiteLocal(a&&a.data.suspectSite),suspect=j03Actor(a,"suspect");
  if(!b||!p||!player||player.inVehicle||player.roof||(player.flyAlt||0)>2)return false;
  const inside=cityBuildingAt(player.x,player.y);if(!inside||inside.uid!==b.uid)return false;
  const target=suspect&&suspect.w?{x:suspect.w.x,y:suspect.w.y}:p;
  return Math.hypot(player.x-target.x,player.y-target.y)<62&&stClearLine(player.x,player.y,target.x,target.y,3);
}
function j03Resolve(id){
  const a=j03Active();if(!a||a.id!==id||a.phase!=="entry"||!j03EntryReady(a))return {ok:false,why:"Enter through the real door and reach the suspect's interior position on foot."};
  if(a.data.civilianHarmed||!j03CiviliansSafe(a))return {ok:false,why:"A civilian is harmed, missing, or not verified safe. Clean resolution is blocked."};
  const suspect=j03Actor(a,"suspect");if(!suspect||!suspect.alive||!suspect.w)return {ok:false,why:"The suspect is no longer available for a clean custody resolution."};
  if(a.data.negotiation==="forced"){
    const group=j03SquadCounts(j03Building(a));if(group.inside<1)return {ok:false,why:"No existing fireteam member is inside yet. Move on foot through the marked door and let the current squad movement catch up."};
  }else if(a.data.negotiation!=="peaceful")return {ok:false,why:"No valid negotiation path was recorded."};
  const patch={suspectResolved:true,resolution:a.data.negotiation,suspectSurrendered:true,entryStarted:true};
  return jobAdvance(id,"entry","resolution",patch);
}
function j03RecordCall(id){
  const a=j03Active();if(!a||a.id!==id||a.phase!=="resolution"||a.data.suspectResolved!==true)return {ok:false,why:"Resolve the suspect before recording a call."};
  if(!j03CiviliansSafe(a)||a.data.suspectEscaped||a.data.suspectHarmed||a.data.suspectDamaged||a.data.forcedEntryFailed)return {ok:false,why:"This call is not eligible for clean success."};
  const b=j03Building(a),old=Array.isArray(a.data.calls)?a.data.calls:[];
  if(!b||old.length>=J03_MAX_CALLS)return {ok:false,why:"No valid building or shift slot is available."};
  const receipt={building:b.uid,resolution:a.data.resolution,suspectResolved:true,civiliansSafe:true,pay:100};
  const r=jobAdvance(id,"resolution","debrief",{calls:old.concat([receipt]),lastCall:{building:b.uid,resolution:a.data.resolution},civilianHarmed:false});
  if(r.ok)j03CleanupActors(a);return r;
}
function j03EscapeStep(a,dt){
  if(!a||a.data.suspectEscaped!==true||a.data.escapeReached===true)return;
  const p=j03Actor(a,"suspect"),exit=jobSiteLocal(a.data.perimeter);if(!p||!p.alive||!exit)return;
  if(!p.w&&p.tfJob)tfJobHydrate(p);const W=p.w;if(!W)return;
  W.flee=0;W.sleep=false;W.jobContact=true;
  if(Math.hypot(W.x-exit.x,W.y-exit.y)>16){tfMove(W,exit.x,exit.y,150,Math.max(0,Math.min(.1,Number.isFinite(dt)?dt:.016)));return;}
  if(cityBuildingAt(W.x,W.y))return;
  W.inside=null;W.jobContact=false;W.vx=W.vy=0;W.tx=W.x;W.ty=W.y;tfJobRelease(p);p.j03Actor=null;
  const read=jobReadState();if(!read.ok)return;const live=read.state.active;if(!live||live.id!==a.id||live.phase!=="resolution")return;
  live.data.escapeReached=true;const people=Object.assign({},live.data.people||{}),snap=j03Snapshot(p,"suspect");if(snap)people.suspect=snap;live.data.people=people;
  const saved=jobCommit(read.state,0);if(saved.ok)jdNotice("SUSPECT ESCAPED · The person reached the street through the assigned door. Record the partial outcome at the perimeter.");
}
function j03FailEntry(id){
  const a=j03Active();if(!a||a.id!==id||a.phase!=="entry"||a.data.negotiation!=="forced"||j03SquadCounts(j03Building(a)).total>0)
    return {ok:false,why:"This partial ending is available only when a forced entry has no active fireteam deployed."};
  const r=jobAdvance(id,"entry","resolution",{forcedEntryFailed:true,resolution:"forced_entry_failed"});if(!r.ok)return r;
  const end=jobFinish(id,"forced_entry_failed");if(end.ok)jdNotice("FORCED ENTRY FAILED · No fireteam was deployed. Partial pay only; no clean-call credit.");return end;
}
function j03GoOffDuty(id){const r=jobFinish(id,"debriefed");if(r.ok){if(typeof MAPV!=="undefined")MAPV.lastSig="";jdNotice("SHIFT DEBRIEFED · "+r.pay+" added. Tactical call history and career credit were saved once.");}return r;}
function j03Continue(id){
  const a=j03Active();if(!a||a.id!==id||a.phase!=="debrief"||!jdNear(a))return {ok:false,why:"Exit to the marked perimeter before continuing the shift."};
  const calls=j03ValidReceipts(a),no=Number.isSafeInteger(a.data.callNo)?a.data.callNo:1;if(calls.length!==no||no>=J03_MAX_CALLS)return {ok:false,why:"No remaining clean call is available in this shift."};
  const plan=j03PlanCall(player.x,player.y,(CITY.seed>>>0)+a.id*4099+(no+1)*131);if(!plan.ok)return plan;
  const patch=Object.assign({},plan.call,{calls,callNo:no+1,people:{},perimeterSet:false,suspectResolved:false,suspectSurrendered:false,suspectDamaged:false,suspectHarmed:false,entryStarted:false,harmFacts:null,lastCall:null});
  const r=jobAdvance(id,"debrief","briefing",patch);if(!r.ok)return r;
  j03CleanupActors(a);const spawned=j03EnsureActors(j03Active());if(!spawned.ok)return {ok:false,why:"The next incident was saved but its resident actors are not ready: "+spawned.why};
  if(typeof MAPV!=="undefined")MAPV.lastSig="";jdNotice("NEXT CALL "+(no+1)+"/"+J03_MAX_CALLS+" · Follow the new marker. No pay posts until the final shift debrief.");return r;
}
function j03Panel(){
  const panel=JOB_DISPATCH.panel,read=jobActive();if(!panel||!read.ok)return;
  const a=read.active;
  const btn=(label,fn)=>{const b=document.createElement("button");b.type="button";b.className="btn";b.textContent=label;b.style.cssText="min-height:46px;min-width:120px;margin:4px 6px 4px 0;white-space:normal";b.onclick=fn;panel.appendChild(b);};
  const text=(tag,value)=>{const e=document.createElement(tag);e.textContent=value;panel.appendChild(e);return e;};
  if(!a){
    if(!v15ContractEnabled(JOB_TACTICAL))return;
    const state=jobReadState();if(!state.ok)return;
    text("p",j03CareerSummary(state.state));
    btn("TACTICAL RESPONSE · BARRICADE",()=>{const r=j03CallOffer();jdOpen(r.ok?"Barricade call open. Follow the marker to the exterior perimeter.":r.why);});
    return;
  }
  if(a.contract!==JOB_TACTICAL||!read.inWorld||!v15JobEnabled(a))return;
  panel.innerHTML="";text("h3","TACTICAL RESPONSE · CALL "+a.data.callNo+"/"+J03_MAX_CALLS);
  text("p",j03CareerSummary(read.state));
  const building=j03Building(a);
  if(!building){text("p","The assigned building is absent. The call is paused; no resolution can be claimed.");btn("WITHDRAW · NO PAY",()=>{const r=jobWithdraw(a.id);jdOpen(r.ok?"Call withdrawn; no pay.":r.why);});btn("CLOSE",jdClose);return;}
  if(a.phase!=="debrief")j03EnsureActors(a);
  const harm=a.data.civilianHarmed===true, squad=j03SquadCounts(building);
  if(a.phase==="briefing"){
    text("p","Reach the marked exterior entrance. The perimeter is not established until you arrive on foot.");
    if(jdNear(a))btn("ESTABLISH PERIMETER",()=>{const r=j03SetPerimeter(a.id);jdOpen(r.ok?"Perimeter established. Begin negotiation at the marker.":r.why);});
  }else if(a.phase==="perimeter"){
    text("p","Perimeter checkpoint saved. Civilians and the barricaded suspect are live townsfolk. Existing civilian warnings and damage attribution remain active.");
    if(jdNear(a))btn("START NEGOTIATION",()=>{const r=j03StartNegotiation(a.id);jdOpen(r.ok?"Negotiation opened.":r.why);});
  }else if(a.phase==="negotiation"){
    text("p","Choose a peaceful surrender or issue a final warning to begin forced entry. Two deliberate delays let the suspect escape; escape cannot count as a clean call.");
    if(jdNear(a)){
      btn("OFFER PEACEFUL SURRENDER",()=>{const r=j03Negotiate(a.id,"peaceful");jdOpen(r.ok?"Surrender accepted. Enter through the marked door and reach the suspect.":r.why);});
      btn("FINAL WARNING · FORCED ENTRY",()=>{const r=j03Negotiate(a.id,"forced");jdOpen(r.ok?"Forced-entry route opened. Existing fireteam movement is reused; walk through the real door.":r.why);});
      btn("DELAY / KEEP TALKING",()=>{const r=j03Negotiate(a.id,"delay");jdOpen(r.ok?"Negotiation updated.":r.why);});
    }
  }else if(a.phase==="entry"){
    text("p",a.data.negotiation==="peaceful"?"Peaceful surrender recorded. Enter through the marked exterior door, approach the suspect, then secure the scene.":"Final warning issued. Enter through the marked door on foot; existing squad members use their current follow and door movement.");
    text("p","Safety check: harm to either civilian blocks clean success. Visibility warnings are not an all-clear.");
    if(a.data.negotiation==="forced")text("p","Existing fireteam: "+squad.inside+" inside / "+squad.total+" active. Forced resolution requires a fireteam member to reach the same real building.");
    if(j03EntryReady(a))btn(a.data.negotiation==="peaceful"?"SECURE PEACEFUL CUSTODY":"SECURE FORCED ENTRY",()=>{const r=j03Resolve(a.id);jdOpen(r.ok?"Suspect secured. Record the scene before debrief.":r.why);});
    if(a.data.negotiation==="forced"&&squad.total===0)btn("ABORT · FORCED ENTRY FAILED",()=>{const r=j03FailEntry(a.id);jdOpen(r.ok?"Forced entry failure recorded; no clean credit.":r.why);});
    if(harm)btn("RECORD CIVILIAN-HARM ENDING",()=>{const r=jobFinish(a.id,"civilian_harmed");jdOpen(r.ok?"Civilian-harmed outcome recorded. No clean-call credit.":r.why);});
  }else if(a.phase==="resolution"){
    if(harm)text("p","CIVILIAN HARM RECORDED · This call cannot receive clean success.");
    else if(a.data.suspectEscaped)text("p",a.data.escapeReached?"SUSPECT ESCAPED · The person reached the street through the assigned door. Partial outcome only.":"SUSPECT FLEEING · Follow the marked exterior exit; the outcome is not recorded until the suspect reaches it.");
    else if(a.data.forcedEntryFailed)text("p","FORCED ENTRY FAILED · Partial outcome only.");
    else if(a.data.suspectHarmed)text("p","SUSPECT HARMED · Clean resolution is blocked.");
    else if(a.data.suspectResolved){text("p","Suspect secured. Civilian records remain checked against live townsfolk health.");if(j03CiviliansSafe(a))btn("RECORD CLEAN CALL · CONTINUE TO DEBRIEF",()=>{const r=j03RecordCall(a.id);jdOpen(r.ok?"Clean call recorded. Debrief or continue the shift.":r.why);});}
    else text("p","No valid resolution has been recorded.");
    if(harm)btn("RECORD CIVILIAN-HARM ENDING",()=>{const r=jobFinish(a.id,"civilian_harmed");jdOpen(r.ok?"Civilian-harmed outcome recorded.":r.why);});
    else if(a.data.suspectEscaped&&a.data.escapeReached)btn("RECORD ESCAPE · PARTIAL",()=>{const r=jobFinish(a.id,"suspect_escaped");jdOpen(r.ok?"Escape recorded; no clean credit.":r.why);});
    else if(a.data.forcedEntryFailed)btn("RECORD FORCED-ENTRY FAILURE",()=>{const r=jobFinish(a.id,"forced_entry_failed");jdOpen(r.ok?"Failure recorded; no clean credit.":r.why);});
    else if(a.data.suspectHarmed)btn("RECORD SUSPECT-HARMED ENDING",()=>{const r=jobFinish(a.id,"suspect_harmed");jdOpen(r.ok?"Suspect harm recorded; no clean credit.":r.why);});
  }else if(a.phase==="debrief"){
    const calls=j03ValidReceipts(a);text("p","Clean calls saved: "+calls.length+"/"+J03_MAX_CALLS+". No payout posts until you go off duty.");
    text("p","Last call: "+(a.data.lastCall?.resolution||"recorded")+" · "+(a.data.lastCall?.building||"building"));
    if(jdNear(a)&&calls.length<J03_MAX_CALLS)btn("CONTINUE TO NEXT CALL",()=>{const r=j03Continue(a.id);jdOpen(r.ok?"Next call accepted.":r.why);});
    btn("OFF DUTY · DEBRIEF",()=>{const r=j03GoOffDuty(a.id);jdOpen(r.ok?"Shift completed and saved.":r.why);});
  }
  if(a.phase!=="debrief")btn("WITHDRAW SHIFT · NO PAY",()=>{const r=jobWithdraw(a.id);jdOpen(r.ok?"Call withdrawn; no pay.":r.why);});
  else btn("WITHDRAW · FORFEIT SHIFT PAY",()=>{const r=jobWithdraw(a.id);jdOpen(r.ok?"Shift forfeited; no pay.":r.why);});
  btn("CLOSE",jdClose);
}
(function j03DamageWire(){
  const oldHurt=window.tfHurt,oldDie=window.tfDie;
  function record(p,how,by,origin,died){
    const tag=p&&p.j03Actor,a=tag&&j03Active();if(!a||a.id!==tag.incident||a.world!==tag.world||a.data.callNo!==tag.callNo)return;
    const role=tag.role,read=jobReadState();if(!read.ok)return;const live=read.state.active;if(!live||live.id!==a.id)return;
    const people=Object.assign({},live.data.people||{}),rec=people[role];if(!rec)return;
    const snap=j03Snapshot(p,role);if(snap)people[role]=snap;
    const damageFact={role,how:String(how||"unknown").slice(0,32),by:String(by||"unknown").slice(0,32),died:!!died,callNo:live.data.callNo,
      origin:origin&&Number.isFinite(origin.x)&&Number.isFinite(origin.y)?{wx:origin.x+CITY.orx,wy:origin.y+CITY.ory}:null};
    if(role==="suspect"){
      live.data.suspectDamaged=true;
      if(live.data.negotiation==="forced")live.data.forcedEntryFailed=true;
      else live.data.suspectHarmed=true;
    }else{
      live.data.civilianHarmed=true;live.data.harmFacts=damageFact;
    }
    if(["briefing","perimeter","negotiation","entry"].includes(live.phase))live.phase="resolution";
    live.data.people=people;
    const saved=jobCommit(read.state,0);if(saved.ok)jdNotice(role==="suspect"?"SUSPECT INJURED · clean custody is blocked.":"CIVILIAN HARMED · clean success is blocked and the event is recorded.");
  }
  if(typeof oldHurt==="function")window.tfHurt=function(p,dmg,how,by,origin,danger){const r=oldHurt.apply(this,arguments);if(p&&p.j03Actor&&p.alive)record(p,how,by,origin,false);return r;};
  if(typeof oldDie==="function")window.tfDie=function(p,how,by,origin){const r=oldDie.apply(this,arguments);if(p&&p.j03Actor)record(p,how,by,origin,true);return r;};
})();
(function j03FinishWire(){
  const oldFinish=window.jobFinish,oldWithdraw=window.jobWithdraw;
  if(typeof oldFinish==="function")window.jobFinish=function(id,outcome){const a=jobReadState().state?.active,r=oldFinish.apply(this,arguments);if(r.ok&&a&&a.contract===JOB_TACTICAL)j03CleanupActors(a);return r;};
  if(typeof oldWithdraw==="function")window.jobWithdraw=function(id){const a=jobReadState().state?.active,r=oldWithdraw.apply(this,arguments);if(r.ok&&a&&a.contract===JOB_TACTICAL)j03CleanupActors(a);return r;};
})();
let j03ActorSaveT=0;
(function j03DispatchWire(){
  if(!JD_CONTRACTS.includes(JOB_TACTICAL))JD_CONTRACTS.push(JOB_TACTICAL);
  const prevOpen=window.jdOpen,prevArrive=window.jdArrive,prevFind=window.findInteractTarget,prevTrigger=window.triggerWorldInteract;
  window.jdOpen=function(message){prevOpen(message);j03Panel();};
  window.jdArrive=function(){
    const a=j03Active();if(!a)return prevArrive.apply(this,arguments);
    if(a.phase==="briefing"&&jdNear(a)){const r=j03SetPerimeter(a.id);if(r.ok){jdOpen("Perimeter established. Begin negotiation at the marker.");return true;}jdOpen(r.why);return false;}
    if(jdNear(a)){jdOpen();return true;}return false;
  };
  window.findInteractTarget=function(){
    const a=j03Active(),p=a&&j03Target(a);
    if(a&&p&&jdNear(a))return {kind:"jobTactical",x:p.x,y:p.y,label:"TACTICAL CALL · "+a.phase.toUpperCase()};
    return prevFind.apply(this,arguments);
  };
  window.triggerWorldInteract=function(){
    const t=typeof findInteractTarget==="function"?findInteractTarget():null;
    if(t&&t.kind==="jobTactical"){jdOpen();return true;}
    return prevTrigger.apply(this,arguments);
  };
  V10.onStep.push(dt=>{
    const a=j03Active();if(!a||!a.data.people)return;
    if(a.data.suspectEscaped===true)j03EscapeStep(a,dt);
    j03ActorSaveT+=Number.isFinite(dt)?dt:0;
    if(j03ActorSaveT>=1){j03ActorSaveT=0;if(a.data.suspectEscaped!==true)j03EnsureActors(a);j03PeopleCheckpoint(j03Active());}
  });
})();

function j03CareerSummary(state) {
  const rank=j03CareerRank(state);
  if(!rank.ok)return "TACTICAL CAREER · saved rank data is invalid; no promotion or payout will be inferred.";
  return "TACTICAL CAREER · Stage "+rank.rank+"/5 · "+rank.name+" · "+rank.calls+" completed call"+(rank.calls===1?"":"s")+
    (rank.next===null?" · top stage reached":" · "+rank.next+" more completed call"+(rank.next===1?"":"s")+" for the next stage");
}
// EOF:js/jobtactical.js
