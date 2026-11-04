// FILE: js/jobcareer.js
// v15 optional multi-stop medical distribution shift. Existing single calls remain unchanged.
// Only a physical clinic contact receives deliveries. Relay packaging is an abstract handoff.
"use strict";
const JC_STOPS = [
  {name:"Opening delivery", story:"The clinic needs its first shipment. Collect the case and check your route.",pay:120,stock:4},
  {name:"Second delivery", story:"Dispatch has another request. At the route check, you may add an insulated relay stop or go directly.",pay:140,stock:6},
  {name:"Final delivery", story:"The final shipment closes the distribution shift. The clinic contact must accept it in person.",pay:160,stock:8}
];
jobRegister({id:JOB_COURIER_SHIFT,role:"courier",start:"pickup",
  edges:{pickup:["assessment"],assessment:["delivery","relay"],relay:["delivery"],delivery:["dispatch"],dispatch:["pickup"]},
  endings:{completed:{from:["delivery"],pay:0},partial:{from:["assessment","relay","delivery","dispatch"],pay:0}},
  finishGuard:"courier_shift_atomic"});
// Payout, stock and progress must use jcDeliver/jcEnd, never the generic finish path.
JOB_CORE.guards.courier_shift_atomic=()=>false;
JD_CONTRACTS.push(JOB_COURIER_SHIFT);JD_COURIERS.push(JOB_COURIER_SHIFT);
function jcQuantity(n) { return Number.isFinite(n) ? String(Math.round(n*100)/100) : "unknown"; }
function jcCanWork() {
  return !!(runActive && CITY.on && player && !player.inVehicle && !player.roof && (player.flyAlt||0)<=2 && ECO.on && SCN.mode==="economy" && TF.on);
}
function jcPlan(stop,id,avoidUid) {
  if(!jcCanWork())return {ok:false,why:"Stand outside on the ground in an economy town with townsfolk active."};
  const nearby=accNearBuildings(1100).filter(b=>["clinic","hospital"].includes(tfKind(b)));
  if(!nearby.length)return {ok:false,why:"Move closer to a clinic or hospital, then ask dispatch again."};
  // Validate each segment; no partial/snapped path is accepted. A detour is optional
  // if the bounded search cannot find one, rather than blocking the whole shift.
  for(let i=0;i<5;i++) {
    const seed=(CITY.seed>>>0)+(id%10000)*11+stop*733+i*79;
    const pickup=jobFindSite(player.x,player.y,seed+17),p=jobSiteLocal(pickup);if(!p)continue;
    const assessment=jobFindSite(p.x,p.y,seed+109),q=jobSiteLocal(assessment);if(!q)continue;
    // Prefer a different clinic from the last successful stop when one is
    // reachable; fall back to the same service if local geography offers no alternative.
    const different=avoidUid ? nearby.filter(b=>b.uid!==avoidUid) : nearby;
    const med=jdMedicalOfferSite(q.x,q.y,different) || (avoidUid ? jdMedicalOfferSite(q.x,q.y,nearby) : null);if(!med)continue;
    const d=jobSiteLocal(med.site);let relay=null;
    for(let j=0;j<3&&!relay;j++) {
      const r=jobFindSite(q.x,q.y,seed+211+j*53),v=jobSiteLocal(r);
      if(v && jobRouteValid(v.x,v.y,d.x,d.y))relay=r;
    }
    return {ok:true,route:{pickup,assessment,relay,delivery:med.site,clinic:med.clinic,recipientMode:1}};
  }
  return {ok:false,why:"No complete on-foot route to a medical entrance was found. Move closer to a clinic and retry."};
}
function jcOffer() {
  if(!v15ContractEnabled(JOB_COURIER_SHIFT)) return {ok:false,why:"This shift is unavailable in this revision."};
  const read=jobReadState();if(!read.ok)return read;
  if(read.state.active)return {ok:false,why:"Finish or withdraw the current job first."};
  const plan=jcPlan(0,read.state.next);if(!plan.ok)return plan;
  return jobOffer(JOB_COURIER_SHIFT,Object.assign({stop:0,receipts:[]},plan.route));
}
function jcNext(id) {
  const read=jobReadState(),a=read.ok&&read.state.active;
  if(!read.ok)return read;
  if(!a || a.id!==id || a.contract!==JOB_COURIER_SHIFT || a.world!==jobWorldKey() || a.phase!=="dispatch" || !Number.isInteger(a.data.stop) || a.data.stop<1 || a.data.stop>=JC_STOPS.length)return {ok:false,why:"The next shipment is unavailable."};
  const plan=jcPlan(a.data.stop,id,a.data.receipts?.at(-1)?.clinicUid);if(!plan.ok)return plan;
  a.data=Object.assign({stop:a.data.stop,receipts:a.data.receipts,fuelUsed:!!a.data.fuelUsed,...(a.data.loan?{loan:a.data.loan}:{})},plan.route);a.phase="pickup";
  const r=jobCommit(read.state,0);if(r.ok && typeof MAPV!=="undefined")MAPV.lastSig="";return r;
}
function jcRoute(id,next) {
  const a=jdActive();
  if(!a || a.id!==id || a.contract!==JOB_COURIER_SHIFT || a.phase!=="assessment" || jdCaseDropped(a) || !jdNear(a) || !["delivery","relay"].includes(next) || (next==="relay"&&!a.data.relay))return {ok:false,why:"Return with the case to the route-check marker."};
  return jobAdvance(id,"assessment",next,{route:next==="relay"?"relay":"direct"});
}
// A changed world can invalidate an earlier path. Relocate only a future
// waypoint, preserving the clinic, stage, receipts, branch and payout.
// The physical recipient and delivery entrance are never moved by this tool.
function jcReplan(id) {
  const read=jobReadState();if(!read.ok)return read;
  const a=read.state.active;
  if(!jcCanWork() || !a || a.id!==id || a.contract!==JOB_COURIER_SHIFT || a.world!==jobWorldKey() || !["pickup","assessment","relay"].includes(a.phase) || jdCaseDropped(a))return {ok:false,why:"Stand on open ground with your case to request a replacement waypoint."};
  const old=jobSiteLocal(a.data[a.phase]),future=a.phase==="pickup"?["assessment"]:a.phase==="assessment"?["delivery"].concat(a.data.relay?["relay"]:[]):["delivery"];
  const targets=future.map(k=>jobSiteLocal(a.data[k]));if(targets.some(p=>!p))return {ok:false,why:"The remaining route data is unavailable; end the shift early."};
  for(let i=0;i<8;i++){
    const site=jobFindSite(player.x,player.y,(CITY.seed>>>0)+(id%10000)*43+a.data.stop*313+i*67+1401),q=jobSiteLocal(site);
    if(!q || old && Math.hypot(q.x-old.x,q.y-old.y)<64 || !jobRouteValid(player.x,player.y,q.x,q.y) || !targets.every(p=>jobRouteValid(q.x,q.y,p.x,p.y)))continue;
    a.data[a.phase]=site;const r=jobCommit(read.state,0);if(r.ok && typeof MAPV!=="undefined")MAPV.lastSig="";return r;
  }
  return {ok:false,why:"No replacement with all remaining routes reachable was found. Try from another position or end the shift early."};
}
// A single emergency fuel canister for the vehicle the player actually drove.
// The existing vehicle simulation is run-local: the canister use is durable,
// but a vehicle's changed fuel is not recreated after starting a new run.
function jcFuelTarget(a) {
  const v=typeof VEH!=="undefined" && VEH.lastMine;
  if(!a || a.contract!==JOB_COURIER_SHIFT || a.phase==="offer" || a.data?.fuelUsed || !jcCanWork() || !v || VEH.byKey.get(v.key)!==v || v.dead || v.burnt || v.fire>0 || v.S.horse || v.drv || v.flyAir || Math.hypot(v.vx,v.vy)>16 || !Number.isFinite(v.fuel) || v.fuel>=0.25)return null;
  const distance=Math.hypot(player.x-v.x,player.y-v.y);
  return distance<=vehReach(v,player.x,player.y)+50 && stClearLine(player.x,player.y,v.x,v.y,3) ? v : null;
}
function jcRefuel(id) {
  const read=jobReadState();if(!read.ok)return read;
  const a=read.state.active,v=a?.id===id && a.world===jobWorldKey() && jcFuelTarget(a);
  if(!v)return {ok:false,why:"Bring the last vehicle you drove to a safe stop nearby; it must be low on fuel and undamaged by fire."};
  a.data.fuelUsed=true;const r=jobCommit(read.state,0);
  if(!r.ok)return r;
  v.fuel=Math.max(v.fuel,0.30);v.awake=true;v.sleep=0;return {ok:true,fuel:v.fuel};
}
// Optional unarmed civilian assistant. They walk in from a checked off-screen
// origin, carry the physical case on foot, can flee or be hurt, and do not board
// vehicles. No handoff or stock effect occurs until both people actually meet.
function jcRequestSupport(id) {
  const read=jobReadState();if(!read.ok)return read;
  const a=read.state.active;
  if(!jcCanWork() || !a || a.id!==id || a.contract!==JOB_COURIER_SHIFT || a.world!==jobWorldKey() || a.phase!=="delivery" || jdCaseDropped(a) || a.data.support)return {ok:false,why:"An assistant is unavailable for this shipment."};
  let site=null;const turn=((CITY.seed+(id%10000)*31+a.data.stop*67)%360)*Math.PI/180;
  for(const dist of [450,560,660])for(let i=0;i<16&&!site;i++){
    const h=turn+i*2.399963229728653,q=cityFindWalkable(player.x+Math.cos(h)*dist,player.y+Math.sin(h)*dist,24,true);
    if(!q || Math.hypot(q[0]-player.x,q[1]-player.y)>JOB_ROUTE.maxDistance || !jdSupportOffscreen(q[0],q[1]) || cityCircleBlocked(q[0],q[1],7,false) || (cityFlagsAt(q[0],q[1])&(F_MOVE|F_IN|F_WATER)) || !jobRouteValid(q[0],q[1],player.x,player.y))continue;
    site={wx:q[0]+CITY.orx,wy:q[1]+CITY.ory};
  }
  if(!site)return {ok:false,why:"No safe off-screen approach for an assistant was found. You can deliver the case yourself."};
  a.data.support={status:"active",site,carrying:false};const r=jobCommit(read.state,0);if(r.ok)jdSupportSync(jdActive());return r;
}
function jcTransferSupport(id,carrying) {
  const read=jobReadState();if(!read.ok)return read;
  const a=read.state.active,q=a?.data?.support,p=a&&jdSupportSync(a),w=p?.w;
  if(!a || a.id!==id || a.contract!==JOB_COURIER_SHIFT || a.world!==jobWorldKey() || a.phase!=="delivery" || q?.status!=="active" || !!q.carrying===carrying || jdCaseDropped(a) || !jdPersonNear(p))return {ok:false,why:"Meet your calm assistant on foot to transfer the case."};
  q.carrying=carrying;q.state={wx:w.x+CITY.orx,wy:w.y+CITY.ory,hp:w.hp};const r=jobCommit(read.state,0);if(r.ok && typeof MAPV!=="undefined")MAPV.lastSig="";return r;
}
function jcSupportReady(a) {
  if(!a?.data?.support?.carrying)return true;
  const p=jdSupportSync(a),w=p?.w,goal=jobSiteLocal(a.data.delivery),recipient=JD_CLINIC.actor?.w;
  return !!(a.data.support.status==="active" && jdPersonNear(p) && w && goal && recipient && Math.hypot(w.x-goal.x,w.y-goal.y)<90 && Math.hypot(w.x-recipient.x,w.y-recipient.y)<125 && stClearLine(w.x,w.y,goal.x,goal.y,7));
}
function jcDeliver(id) {
  const read=jobReadState();if(!read.ok)return read;
  const a=read.state.active,stop=a?.data?.stop,chapter=JC_STOPS[stop];
  if(!a || a.id!==id || a.contract!==JOB_COURIER_SHIFT || a.world!==jobWorldKey() || a.phase!=="delivery" || !chapter || !Array.isArray(a.data.receipts) || a.data.receipts.length!==stop || jdCaseDropped(a) || !jdNear(a) || !jdMedicalDestination(a) || !jdClinicReady(a) || !jcSupportReady(a))return {ok:false,why:"Bring the case and its carrier to the calm clinic contact at the medical entrance."};
  if(!jcCanWork())return {ok:false,why:"Return in the economy scenario with townsfolk active."};
  const stock=ECO.stock,mem=ecoMem();
  if(!stock || mem.stock!==stock || !Number.isFinite(stock.med) || stock.med<0)return {ok:false,why:"Town medicine stock is unavailable."};
  const before=stock.med,after=before>=ECO_GOODS.med.ref*4?before:Math.min(ECO_GOODS.med.ref*4,before+chapter.stock),added=Math.max(0,after-before);
  const pay=chapter.pay+(a.data.route==="relay"?25:0), receipts=a.data.receipts.concat([{stop:stop+1,clinic:String(a.data.clinic.name||"Medical clinic").slice(0,100),clinicUid:a.data.clinic.uid,route:a.data.route==="relay"?"relay":"direct",pay,restock:added,recipient:"met",...(a.data.support?.carrying?{carrier:"assistant"}:{})}]);
  const done=stop===JC_STOPS.length-1;
  if(done) {
    read.state.history.push({id:a.id,contract:a.contract,role:a.role,world:a.world,outcome:"completed",pay:receipts.reduce((n,r)=>n+r.pay,0),receipts});
    if(read.state.history.length>JOB_CORE.historyMax)read.state.history.splice(0,read.state.history.length-JOB_CORE.historyMax);
    read.state.active=null;
  } else {a.phase="dispatch";a.data={stop:stop+1,receipts,fuelUsed:!!a.data.fuelUsed,...(a.data.loan?{loan:a.data.loan}:{})};}
  stock.med=after;
  let r;try{r=jobCommit(read.state,pay);}catch(e){r={ok:false,why:"checkpoint was not saved"};}
  if(!r.ok){stock.med=before;return r;}
  jdClinicClear(true);jdSupportClear(true);try{ecoPrices();}catch(e){}if(typeof MAPV!=="undefined")MAPV.lastSig="";
  r.pay=pay;r.restock=added;r.done=done;return r;
}
// A calm, physically met contact who cannot get to the entrance can take a
// partial off-site handoff. It closes the shift with modest pay, and deliberately
// does NOT claim clinic stock changed or that the contact completed the delivery.
function jcPartialContact(id) {
  const read=jobReadState();if(!read.ok)return read;
  const a=read.state.active,chapter=JC_STOPS[a?.data?.stop],p=a&&jdClinicSync(a);
  if(!a || a.id!==id || a.contract!==JOB_COURIER_SHIFT || a.world!==jobWorldKey() || a.phase!=="delivery" || !chapter || !Array.isArray(a.data.receipts) || a.data.receipts.length!==a.data.stop || !jcCanWork() || jdCaseDropped(a) || a.data.support?.carrying || !jdMedicalDestination(a) || !jdPersonNear(p) || jdClinicReady(a))return {ok:false,why:"Meet the calm clinic contact on foot away from the clinic entrance with the case."};
  const receipts=a.data.receipts,pay=Math.floor(chapter.pay/4);
  read.state.history.push({id:a.id,contract:a.contract,role:a.role,world:a.world,outcome:"partial",pay:receipts.reduce((n,r)=>n+r.pay,0)+pay,receipts,
    reason:"contact_met_away",partialHandoff:{stop:a.data.stop+1,pay,recipient:"met_away",restock:0}});
  if(read.state.history.length>JOB_CORE.historyMax)read.state.history.splice(0,read.state.history.length-JOB_CORE.historyMax);
  read.state.active=null;const r=jobCommit(read.state,pay);
  if(r.ok){jdClinicClear(true);jdSupportClear(true);if(typeof MAPV!=="undefined")MAPV.lastSig="";r.pay=pay;}return r;
}
function jcEnd(id) {
  const read=jobReadState();if(!read.ok)return read;
  const a=read.state.active;
  if(!a || a.id!==id || a.contract!==JOB_COURIER_SHIFT || a.world!==jobWorldKey() || a.phase==="offer")return {ok:false,why:"The shift is no longer active."};
  const receipts=Array.isArray(a.data.receipts)?a.data.receipts:[];
  read.state.history.push({id:a.id,contract:a.contract,role:a.role,world:a.world,outcome:"partial",pay:receipts.reduce((n,r)=>n+(Number.isSafeInteger(r.pay)?r.pay:0),0),receipts,
    reason:a.data.recipientLost?"contact_lost":jdCaseDropped(a)?"case_left":a.data.support?.status==="lost"&&a.data.support.carrying?"case_inaccessible":"ended_early"});
  if(read.state.history.length>JOB_CORE.historyMax)read.state.history.splice(0,read.state.history.length-JOB_CORE.historyMax);
  read.state.active=null;const r=jobCommit(read.state,0);if(r.ok){jdClinicClear(true);jdSupportClear(true);}return r;
}
// The ordinary dispatch UI and objective routing remain the source of truth for
// legacy calls. The shift adds one panel and routes its own stage transitions.
(function jcWire(){
  const previousOpen=window.jdOpen,previousArrive=window.jdArrive,previousFind=window.findInteractTarget;
  window.jdOpen=function(message) {
    previousOpen(message);const panel=JOB_DISPATCH.panel,read=jobActive();if(!panel || !read.ok)return;
    const a=read.active;
    if(a && !v15JobEnabled(a))return;
    if(!a) {
      if(!v15ContractEnabled(JOB_COURIER_SHIFT))return;
      const close=Array.from(panel.querySelectorAll("button")).find(b=>b.textContent==="CLOSE");
      const b=document.createElement("button");b.type="button";b.className="btn";b.textContent="MEDICAL DISTRIBUTION SHIFT";b.style.cssText="min-height:48px;min-width:120px;margin:4px 6px 4px 0;white-space:normal";
      b.onclick=()=>{const r=jcOffer();jdOpen(r.ok?"Distribution shift offered.":r.why);};panel.insertBefore(b,close||null);
      const last=read.ok&&jobReadState().state.history.filter(h=>h.contract===JOB_COURIER_SHIFT).slice(-1)[0];
      if(last){const p=document.createElement("p");const detail=Array.isArray(last.receipts)?last.receipts.map(r=>"Stop "+r.stop+": "+r.clinic+", "+r.route+", paid "+r.pay+", medicine +"+jcQuantity(r.restock)).join(" · "):"";p.textContent="LAST DISTRIBUTION SHIFT · "+(last.outcome==="completed"?"completed":"ended early")+" · "+(last.receipts?.length||0)+" of 3 delivered · total pay "+last.pay+". "+detail+(last.reason==="contact_met_away"?" · off-site partial handoff: no medicine added to stock":last.reason==="case_inaccessible"?" · case inaccessible after assistant loss":"");panel.insertBefore(p,b);}
      return;
    }
    if(a.contract!==JOB_COURIER_SHIFT || !read.inWorld)return;
    panel.innerHTML="";
    const text=(tag,value)=>{const e=document.createElement(tag);e.textContent=value;panel.appendChild(e);return e;};
    const button=(label,fn)=>{const b=document.createElement("button");b.type="button";b.className="btn";b.textContent=label;b.style.cssText="min-height:48px;min-width:120px;margin:4px 6px 4px 0;white-space:normal";b.onclick=fn;panel.appendChild(b);return b;};
    text("h2","MEDICAL DISTRIBUTION SHIFT");if(message){const p=text("p",message);p.style.color="#ffd166";}
    const stop=a.data?.stop,chapter=JC_STOPS[stop];
    if(!chapter || !Array.isArray(a.data.receipts)){text("p","This shift's saved data is not supported. Withdraw it without changing other jobs.");button("WITHDRAW",()=>{const r=jobWithdraw(a.id);jdOpen(r.ok?"Shift withdrawn.":r.why);});button("CLOSE",jdClose);return;}
    text("p","DELIVERY "+(stop+1)+" / 3 · "+chapter.name+" · completed "+a.data.receipts.length+" / 3");
    if(a.phase!=="offer") {
      text("p","WORK VEHICLE & FUEL · The optional work vehicle and changes to vehicle fuel last only for this run. After restarting, the work vehicle is not restored. If used, the one-time emergency canister remains used after a restart. The assistant travels on foot.");
    }
    if(a.phase==="offer") {
      text("p","Three connected clinic deliveries with a route check at each stop. "+chapter.story+" A real civilian clinic contact accepts each case. Relay packaging is an abstract handoff. You may request a real work vehicle while this shift is active; it lasts only for this run and is not restored after restart. You can also use another vehicle or travel on foot. You may request an unarmed civilian assistant to carry the case on foot; they can flee, be injured or die and cannot board vehicles. One emergency canister can refill the last vehicle you drove to 30%, if stopped nearby and low on fuel. Vehicle fuel is run-local. Economy mode only. No timer.");
      button("ACCEPT SHIFT",()=>{const r=jobAccept(a.id);if(r.ok){jdClose();jdNotice("SHIFT ACCEPTED · Collect the first case.");}else jdOpen(r.why);});
      button("DECLINE",()=>{const r=jobWithdraw(a.id);jdOpen(r.ok?"Shift declined.":r.why);});
    } else if(a.phase==="dispatch") {
      text("p","The previous delivery was saved and paid. Request the next route from your present location. If planning fails, move closer to a clinic and retry. Ending early retains earned pay and stock.");
      button("FIND NEXT SHIPMENT",()=>{const r=jcNext(a.id);if(r.ok){jdClose();jdNotice("NEXT SHIPMENT · Collect the case.");}else jdOpen(r.why);});
    } else {
      const dropped=jdCaseDropped(a);
      const objective=dropped?"Recover the case":a.phase==="pickup"?"Collect the case":a.phase==="assessment"?"Check the route":a.phase==="relay"?"Visit the relay":a.phase==="delivery"?"Meet the clinic contact":"Review the shift";
      text("p",objective+" · follow the cyan marker. "+chapter.story);
      if(dropped)text("p","Your case is on the ground. Recover it before continuing.");
      if(!dropped && a.phase==="assessment" && jdNear(a)) {
        text("p","Direct: "+chapter.pay+". Relay: +25 for the extra stop. The relay packaging handoff is abstract; no relay worker is simulated.");
        button("DIRECT TO CLINIC",()=>{const r=jcRoute(a.id,"delivery");if(r.ok){jdClose();jdNotice("DIRECT ROUTE · Meet the clinic contact.");}else jdOpen(r.why);});
        if(a.data.relay)button("VIA INSULATED RELAY · +25",()=>{const r=jcRoute(a.id,"relay");if(r.ok){jdClose();jdNotice("RELAY ROUTE · Follow the cyan marker.");}else jdOpen(r.why);});
        else text("p","No validated relay was found for this shipment; the direct route is available.");
      }
      if(!dropped && a.phase==="delivery") {
        const support=a.data.support,worker=jdSupportSync(a),carrying=!!support?.carrying;
        if(!support)button("REQUEST COURIER ASSISTANT",()=>{const r=jcRequestSupport(a.id);jdOpen(r.ok?"Assistant requested. They walk to you on foot; wait for them to arrive.":r.why);});
        else if(support.status==="lost")text("p",carrying?"The assistant was lost with the case in an inaccessible place. End the shift early.":"The assistant was lost. Continue on your own after recovering any dropped case.");
        else {
          text("p",carrying?"Your assistant has the case and walks toward the clinic. Follow on foot; they can flee or be hurt and do not board vehicles. If they get stuck, meet them and take the case back.":"Your unarmed assistant walks toward you on foot. They can flee or be hurt and do not board vehicles.");
          if(jdPersonNear(worker))button(carrying?"TAKE CASE FROM ASSISTANT":"GIVE CASE TO ASSISTANT",()=>{const r=jcTransferSupport(a.id,!carrying);jdOpen(r.ok?(carrying?"You have the case again.":"The assistant has the case and will walk to the clinic."):r.why);});
        }
        text("p",a.data.recipientLost?"The contact died. End the shift early; completed stops keep their pay and stock.":"The contact must be alive, calm, nearby, and at the clinic entrance. If they cannot approach, move away so an off-screen approach can be found.");
        if(jdClinicReady(a) && jcSupportReady(a))button("DELIVER TO CONTACT",()=>{const r=jcDeliver(a.id);jdOpen(r.ok?(r.done?"SHIFT COMPLETE":"DELIVERY COMPLETE")+" · paid "+r.pay+" · town medicine +"+jcQuantity(r.restock)+".":r.why);});
        else if(!carrying && jdPersonNear(jdClinicSync(a))) {text("p","The contact is away from the clinic. You may wait for them to reach it, or end the shift with a partial handoff here. This adds no medicine to town stock.");button("PARTIAL OFF-SITE HANDOFF · "+Math.floor(chapter.pay/4),()=>{const r=jcPartialContact(a.id);jdOpen(r.ok?"PARTIAL HANDOFF · paid "+r.pay+". The clinic stock was not changed; the shift ended.":r.why);});}
      }
      if(!dropped && ["pickup","assessment","relay"].includes(a.phase))button("FIND NEW WAYPOINT",()=>{const r=jcReplan(a.id);jdOpen(r.ok?"Replacement waypoint saved; follow the cyan marker.":r.why);});
      if(!dropped && !a.data.support?.carrying && !["pickup","offer"].includes(a.phase))button("SET DOWN CASE",()=>{const r=jdDropCase();jdOpen(r.ok?"Case set down; recover it at the marker.":r.why);});
    }
    if(a.phase!=="offer" && jcFuelTarget(a))button("USE EMERGENCY FUEL CANISTER",()=>{const r=jcRefuel(a.id);jdOpen(r.ok?"Emergency canister used; vehicle fuel is now 30%. This vehicle state lasts only for this run.":r.why);});
    if(a.phase!=="offer")button("END SHIFT EARLY",()=>{const r=jcEnd(a.id);jdOpen(r.ok?"Shift ended early. Previously completed deliveries keep their pay and stock.":r.why);});
    if(a.data.receipts.length){const p=text("p","RECEIPTS · "+a.data.receipts.map(r=>"stop "+r.stop+": "+r.route+", paid "+r.pay+", medicine +"+jcQuantity(r.restock)).join(" · "));p.style.color="#a6f7ff";}
    button("CLOSE",jdClose);
  };
  window.jdArrive=function(){
    const a=jdActive();if(!a || a.contract!==JOB_COURIER_SHIFT)return previousArrive.apply(this,arguments);
    if(!jdNear(a))return false;
    if(jdCaseDropped(a)){const r=jdRecoverCase();jdNotice(r.ok?"CASE RECOVERED · Follow the objective marker.":r.why);return r.ok;}
    if(a.phase==="assessment" || a.phase==="delivery"){jdOpen();return true;}
    const next=a.phase==="pickup"?"assessment":a.phase==="relay"?"delivery":null;
    if(!next)return false;
    const r=jobAdvance(a.id,a.phase,next);if(r.ok){if(typeof MAPV!=="undefined")MAPV.lastSig="";jdNotice(next==="assessment"?"CASE COLLECTED · Check the route.":"RELAY COMPLETE · Meet the clinic contact.");}else jdNotice("Dispatch: "+r.why);return r.ok;
  };
  window.findInteractTarget=function(){
    const a=jdActive(),p=a?.contract===JOB_COURIER_SHIFT&&jdTarget(a);
    if(a && p && jdNear(a))return {kind:"jobSupply",x:p.x,y:p.y,label:jdCaseDropped(a)?"RECOVER CASE":a.phase==="pickup"?"COLLECT SUPPLIES":a.phase==="assessment"?"CHECK ROUTE":a.phase==="relay"?"TRANSFER SUPPLIES":"DELIVER SUPPLIES"};
    return previousFind.apply(this,arguments);
  };
})();
// EOF:js/jobcareer.js
