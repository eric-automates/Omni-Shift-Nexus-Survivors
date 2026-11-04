// FILE: js/jobvehicle.js — optional run-local physical courier work vehicle.
// Job checkpoint records one issuance per shift, but existing vehicles are
// run-local: a reload never silently recreates an intact vehicle.
"use strict";
const JC_LOAN={incident:null,world:null,key:null};
// No improvised military aircraft, tanks or unverified animal teams as courier
// vehicles. Unsupported settings retain the normal on-foot/other-car option.
const JC_LOAN_KINDS={modern:"pickup",neon:"spinner",galactic:"speeder",coruscant:"hover",starship:"hover",frontier:"mule",wasteland:"rusted",wizard:"anglia"};
function jcLoanLive(a) {
  if(!a || a.contract!==JOB_COURIER_SHIFT || !a.data?.loan || JC_LOAN.incident!==a.id || JC_LOAN.world!==a.world || JC_LOAN.key!==a.data.loan.key)return null;
  return VEH.byKey.get(JC_LOAN.key)||null;
}
function jcLoanMarker() {
  return JC_LOAN.key && JC_LOAN.world===jobWorldKey() ? VEH.byKey.get(JC_LOAN.key)||null : null;
}
function jcLoanOutside(x,y,L,D) {
  const prev=JD_SUPPORT.view;let now;try{now=camView(0)}catch(e){return false;}
  if(!prev||!now||![x,y,L,D,prev.left,prev.top,prev.vw,prev.vh,now.left,now.top,now.vw,now.vh].every(Number.isFinite)||prev.vw<=0||now.vw<=0)return false;
  const m=Math.hypot(L,D)*.5+48,out=v=>x+m<v.left||x-m>v.left+v.vw||y+m<v.top||y-m>v.top+v.vh;
  return out(prev)&&out(now);
}
function jcLoanClear(x,y,h,L,D) {
  const c=Math.cos(h),s=Math.sin(h),half=Math.hypot(L,D)*.5;
  // Dense footprint sampling and a conservative margin reject static blockers.
  for(let f=-D/2-8;f<=D/2+8;f+=8)for(let w=-L/2-8;w<=L/2+8;w+=8){
    const px=x+c*f-s*w,py=y+s*f+c*w;
    if(cityFlagsAt(px,py)&(F_MOVE|F_IN|F_WATER))return false;
  }
  if(Math.hypot(player.x-x,player.y-y)<half+35)return false;
  for(const v of VEH.list)if(Math.hypot(v.x-x,v.y-y)<half+Math.hypot(v.L,v.D)*.5+25)return false;
  if(typeof TRF!=="undefined")for(const v of TRF.cars)if(Math.hypot(v.x*32-CITY.orx-x,v.y*32-CITY.ory-y)<half+Math.hypot(v.lpx||144,v.wpx||64)*.5+35)return false;
  if(typeof TF!=="undefined")for(const p of TF.walk)if(p.alive&&p.w&&!p.w.inside&&Math.hypot(p.w.x-x,p.w.y-y)<half+25)return false;
  if(typeof eAct!=="undefined")for(let i=0;i<MAX_E;i++)if(eAct[i]&&Math.hypot(eX[i]-x,eY[i]-y)<half+50)return false;
  if(typeof mAct!=="undefined")for(let i=0;i<MAX_MINION;i++)if(mAct[i]&&!(typeof mSeatOf==="function"&&mSeatOf(i))&&Math.hypot(mX[i]-x,mY[i]-y)<half+25)return false;
  // Include undriven parked props/furniture, not just the live vehicle list.
  if(vehNearby(x,y,half+40).length)return false;
  return true;
}
// A road can be farther away than the short delivery waypoints in generated
// regions. Validate one bounded complete path rather than a snapped/partial path.
function jcLoanRouteValid(sx,sy,tx,ty) {
  const dist=Math.hypot(tx-sx,ty-sy);if(dist<16||dist>2200||cityCircleBlocked(tx,ty,7,false)||(cityFlagsAt(tx,ty)&(F_MOVE|F_IN|F_WATER)))return false;
  const path=stFindPath(sx,sy,tx,ty),pts=path?.pts;if(!path?.found||!pts?.length||Math.hypot(pts.at(-1)[0]-tx,pts.at(-1)[1]-ty)>12)return false;
  let x=sx,y=sy;for(const p of pts){if(!p||!Number.isFinite(p[0])||!Number.isFinite(p[1])||cityCircleBlocked(p[0],p[1],7,false)||!stClearLine(x,y,p[0],p[1],7))return false;x=p[0];y=p[1];}
  return stClearLine(x,y,tx,ty,7);
}
function jcLoanFind() {
  const N=typeof TRF!=="undefined"&&TRF.net;if(!N || !Array.isArray(N.links) || !N.links.length)return null;
  const k=vehWorldK(),L=64*k,D=144*k,[pmx,pmy]=trfM(player.x,player.y),sites=[];
  let visited=0;
  for(const road of N.links) {
    if(visited>=600)break;
    const pts=road.pts;if(!pts || road.L<8*k)continue;
    for(let i=0;i+3<pts.length && visited<600;i+=2){
      visited++;const ax=pts[i],ay=pts[i+1],dx=pts[i+2]-ax,dy=pts[i+3]-ay,len=Math.hypot(dx,dy);if(len<5*k)continue;
      const ux=dx/len,uy=dy/len,t=Math.max(0,Math.min(len,(pmx-ax)*ux+(pmy-ay)*uy)),h=Math.atan2(uy,ux);
      for(const off of [-20*k,-16*k,-8*k,0,8*k,16*k,20*k])for(const side of [-1,1]) {
        const along=Math.max(Math.min(len-3*k,t+off),Math.min(3*k,len/2));
        // Outside the road edge, not in a travel lane; require full world clearance.
        const lateral=side*(road.w/2+L/64+0.5*k);
        const x=(ax+ux*along-uy*lateral)*32-CITY.orx,y=(ay+uy*along+ux*lateral)*32-CITY.ory,dist=Math.hypot(x-player.x,y-player.y);
        if(dist<200||dist>2200||!jcLoanOutside(x,y,L,D))continue;
        sites.push({x,y,h,L,D,dist});
      }
    }
  }
  sites.sort((a,b)=>a.dist-b.dist);
  let examined=0,routes=0;
  for(const q of sites){
    if(++examined>80)break;
    if(!jcLoanClear(q.x,q.y,q.h,q.L,q.D))continue;
    // A clear parked footprint is not enough: check a short straight pull-out
    // in either road direction before selecting a heading. Normal physics and
    // moving traffic still apply after issuance; this is not a driving promise.
    let heading=null;
    for(const h of [q.h,q.h+Math.PI]) {
      let clear=true;for(let d=40;d<=200;d+=40)if(!jcLoanClear(q.x+Math.cos(h)*d,q.y+Math.sin(h)*d,h,q.L,q.D)){clear=false;break;}
      if(clear){heading=h;break;}
    }
    if(heading===null)continue;q.h=heading;
    for(const sign of [-1,1]) {
      const s=Math.sin(q.h),c=Math.cos(q.h),px=q.x-s*sign*(q.L/2+30),py=q.y+c*sign*(q.L/2+30);
      const walk=cityFindWalkable(px,py,24,true);if(!walk || Math.hypot(walk[0]-q.x,walk[1]-q.y)>q.L/2+52 || !stClearLine(walk[0],walk[1],q.x,q.y,3))continue;
      if(++routes>12)return null;
      if(jcLoanRouteValid(player.x,player.y,walk[0],walk[1])){q.approach={x:walk[0],y:walk[1]};return q;}
    }
  }
  return null;
}
function jcLoanRequest(id) {
  const read=jobReadState();if(!read.ok)return read;const a=read.state.active;
  if(!jcCanWork()||!a||a.id!==id||a.contract!==JOB_COURIER_SHIFT||a.world!==jobWorldKey()||a.phase==="offer"||a.data.loan)return {ok:false,why:"A work vehicle is unavailable for this shift."};
  if(JC_LOAN.key && VEH.byKey.has(JC_LOAN.key))return {ok:false,why:"A work vehicle was already issued this run. Use it or another vehicle, or continue on foot."};
  const kind=JC_LOAN_KINDS[CITY.themeKey||"modern"];
  if(!kind)return {ok:false,why:"No appropriate work vehicle is available for this setting. Continue on foot or use another vehicle."};
  const site=jcLoanFind();if(!site)return {ok:false,why:"No safe off-screen road space was found. Walk or use another vehicle, and retry from a different location."};
  const key="jc-loan|"+a.world+"|"+a.id;
  if(!VK[kind]||VEH.byKey.has(key))return {ok:false,why:"A suitable work vehicle is not available here."};
  a.data.loan={key,kind};const saved=jobCommit(read.state,0);if(!saved.ok)return saved;
  try {
    const v=vehNew(kind,site.x,site.y,site.h,64,144,{key,k:vehWorldK(),fuel:.65});
    JC_LOAN.incident=a.id;JC_LOAN.world=a.world;JC_LOAN.key=key;
    v.awake=false;v.sleep=2;
    return {ok:true,kind,site:{x:site.x,y:site.y},vehicle:key};
  } catch(e) {
    // The issuance was already persisted, so do not make another offer while a
    // partially registered vehicle might exist. A fully registered vehicle is
    // safe to recover as the same issued vehicle, with no second spawn.
    const registered=VEH.byKey.get(key), matches=VEH.list.filter(v=>v && v.key===key);
    if(registered && matches.length===1 && matches[0]===registered) {
      JC_LOAN.incident=a.id;JC_LOAN.world=a.world;JC_LOAN.key=key;
      return {ok:true,kind,site:{x:registered.x,y:registered.y},vehicle:key};
    }
    // If construction produced no vehicle at all, undo the durable request so
    // the player may retry. A failed rollback keeps the request and fails closed.
    if(!registered && matches.length===0) {
      const current=jobReadState(), active=current.ok && current.state.active;
      if(active && active.id===id && active.contract===JOB_COURIER_SHIFT &&
         active.world===a.world && active.data?.loan?.key===key) {
        delete active.data.loan;
        const cancelled=jobCommit(current.state,0);
        if(cancelled.ok)return {ok:false,why:"Vehicle deployment failed; no vehicle was issued. You can try again."};
      }
    }
    return {ok:false,why:"Vehicle deployment could not be confirmed. The request remains saved for safety; continue on foot or use another vehicle."};
  }
}
(function(){
  const previousOpen=window.jdOpen;
  window.jdOpen=function(message){
    previousOpen(message);const panel=JOB_DISPATCH.panel,a=jdActive();
    if(!panel||!a||a.contract!==JOB_COURIER_SHIFT||a.world!==jobWorldKey()||a.phase==="offer")return;
    const box=document.createElement("p"),v=jcLoanLive(a);box.style.color="#ffd58b";
    if(!a.data.loan){
      box.textContent="Optional work vehicle: dispatch can place a real, driveable vehicle beside a checked road in supported settings. Only one is issued per run. It lasts only for this run; after a restart it is not recreated. The assistant stays on foot.";
      const b=document.createElement("button");b.type="button";b.className="btn";b.textContent="REQUEST WORK VEHICLE";b.style.cssText="min-height:48px;min-width:120px;margin:4px 6px 4px 0;white-space:normal";b.onclick=()=>{const r=jcLoanRequest(a.id);jdOpen(r.ok?"Work vehicle assigned. Follow the amber square on the minimap.":r.why);};box.appendChild(b);
    }else box.textContent=v?((v.dead||v.burnt||v.wreck)?"Your work vehicle is disabled; continue on foot or use another vehicle.":"Work vehicle is the amber square on the minimap. It lasts only for this run; the assistant cannot board."):"The work vehicle was issued in a previous run or could not be deployed. It is not recreated; continue on foot or use another vehicle.";
    const close=Array.from(panel.querySelectorAll("button")).find(b=>b.textContent==="CLOSE");panel.insertBefore(box,close||null);
  };
  V10.onRunStart.push(()=>{JC_LOAN.incident=JC_LOAN.world=JC_LOAN.key=null;});
  V10.onRenderWorld.push(g=>{if(!JC_LOAN.key)return;const v=jcLoanMarker();if(!v||!runActive||player.inVehicle||Math.hypot(player.x-v.x,player.y-v.y)>900)return;g.save();g.textAlign="center";g.font="bold 14px sans-serif";g.fillStyle="#ffcf70";g.strokeStyle="#12202a";g.lineWidth=4;g.strokeText("WORK VEHICLE",v.x,v.y-v.D/2-14);g.fillText("WORK VEHICLE",v.x,v.y-v.D/2-14);g.restore();});
  V10.onRenderScreen.push(g=>{if(!JC_LOAN.key)return;const v=jcLoanMarker();if(!v||!runActive||MAPV.open||player.inVehicle||(typeof HUDL!=="undefined"&&HUDL.enabled&&HUDL.miniHidden))return;const r=miniRect(),mpp=MAPV.miniSizes[MAPV.mini],[px,py]=mapPlayerM();let dx=((v.x+CITY.orx)/32-px)/mpp,dy=((v.y+CITY.ory)/32-py)/mpp;const lim=r.S/2-10,k=Math.min(1,lim/Math.max(Math.abs(dx),Math.abs(dy),1));dx*=k;dy*=k;g.save();g.fillStyle="#ffd166";g.strokeStyle="#172027";g.lineWidth=2;g.fillRect(r.x+r.S/2+dx-5,r.y+r.S/2+dy-5,10,10);g.strokeRect(r.x+r.S/2+dx-5,r.y+r.S/2+dy-5,10,10);g.restore();});
})();
// EOF:js/jobvehicle.js
