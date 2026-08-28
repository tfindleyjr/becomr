"use client";

import type { AppState } from "@/lib/types";
import { pathProgress, visualStageFromProgress } from "@/lib/progression";

function pointFor(index:number,total:number){
  if(total<=1) return {x:400,y:112,angle:-90};
  const start=-155,end=-25,span=end-start;
  const angle=start+(span*index)/(total-1);
  const rad=(angle*Math.PI)/180;
  const rx=total<=3?265:total<=6?290:310;
  const ry=total<=3?230:245;
  return {x:400+Math.cos(rad)*rx,y:355+Math.sin(rad)*ry,angle};
}

export default function DynamicCompass({state,selected,onSelect,compact=false}:{state:AppState;selected:string;onSelect?:(id:string)=>void;compact?:boolean}){
  const total=state.paths.length;

  if(total===0){
    return <div className={`sig-wrap living-empty ${compact?"compact":""}`}><svg viewBox="0 0 800 720" className="sig-svg" aria-label="Empty BECOMR Compass">
      <g className="sig-compass empty-core"><circle cx="400" cy="525" r="123"/><circle cx="400" cy="525" r="105"/><path d="M400 392 L423 505 L400 525 L377 505Z"/><path d="M400 658 L423 545 L400 525 L377 545Z"/><path d="M267 525 L380 502 L400 525 L380 548Z"/><path d="M533 525 L420 502 L400 525 L420 548Z"/><circle cx="400" cy="525" r="19"/></g>
      <path className="empty-seed" d="M400 525 C392 486 393 449 400 408 C407 449 408 486 400 525Z"/><circle className="empty-seed-dot" cx="400" cy="394" r="7"/><text x="400" y="330" textAnchor="middle" className="empty-compass-label">YOUR FIRST PATH CREATES THE FIRST BRANCH</text>
    </svg></div>;
  }

  return <div className={`sig-wrap living-compass ${compact?"compact":""}`}><img className="future-form" src="/assets/becomr-compass-tree.png" alt="" aria-hidden/><svg viewBox="0 0 800 720" className="sig-svg">
    <g className="sig-compass"><circle cx="400" cy="525" r="123"/><circle cx="400" cy="525" r="105"/><path d="M400 392 L423 505 L400 525 L377 505Z"/><path d="M400 658 L423 545 L400 525 L377 545Z"/><path d="M267 525 L380 502 L400 525 L380 548Z"/><path d="M533 525 L420 502 L400 525 L420 548Z"/><circle cx="400" cy="525" r="19"/></g>
    <g className="sig-roots"><path d="M400 525 C377 555 360 590 330 630"/><path d="M400 525 C423 555 440 590 470 630"/><path d="M400 525 C389 568 384 618 375 664"/><path d="M400 525 C411 568 416 618 425 664"/></g>
    <g className="sig-trunk"><path d="M400 525 C375 470 386 421 394 376 C398 343 398 305 400 270 C402 305 402 343 406 376 C414 421 425 470 400 525Z"/></g>

    {state.paths.map((p,i)=>{
      const progress=pathProgress(state,p),stage=visualStageFromProgress(progress),sel=selected===p.id,end=pointFor(i,total),anchorY=total===1?340:350;
      const midx=(400+end.x)/2,midy=(anchorY+end.y)/2,ghost=stage==="sealed",ornate=["ornamented","mastered"].includes(stage),curve=i%2===0?-24:24;
      const fruits=Math.min(4,Math.floor(progress/20));
      const bossCount=Math.min(3,state.quests.filter(q=>q.pathId===p.id&&q.kind==="weekly"&&q.done).length+(state.cycleHistory||[]).reduce((n,h)=>n+(h.paths?.find(x=>x.pathId===p.id)?.bosses?.length||0),0));
      return <g key={p.id} className={`sig-path stage-${stage} ${sel?"selected":""} ${p.paused?"paused":""}`} onClick={()=>onSelect?.(p.id)}>
        <path d={`M400 ${anchorY} Q${midx+curve} ${midy} ${end.x} ${end.y}`} className="main-branch"/>
        {!ghost&&<><path d={`M${midx} ${midy} q${curve} -20 ${curve*1.65} -48`} className="sub-branch"/>{progress>=20&&<path d={`M${midx+curve*.3} ${midy+22} q${-curve} -5 ${-curve*1.4} -34`} className="sub-branch"/>}</>}
        {ornate&&<><ellipse cx={end.x} cy={end.y} rx="14" ry="6" transform={`rotate(${end.angle+90} ${end.x} ${end.y})`} className="sig-leaf"/><circle cx={midx} cy={midy} r="5" className="sig-node"/></>}
        {Array.from({length:fruits},(_,n)=>{const t=(n+1)/(fruits+1),x=400+(end.x-400)*t,y=anchorY+(end.y-anchorY)*t;return <circle key={`fruit-${n}`} cx={x+(n%2?8:-8)} cy={y-8} r={3+n*.4} className="mastery-fruit"/>})}
        {Array.from({length:bossCount},(_,n)=>{const t=.35+n*.15,x=400+(end.x-400)*t,y=anchorY+(end.y-anchorY)*t;return <circle key={`boss-${n}`} cx={x} cy={y} r="2.4" className="boss-knot"/>})}
        <circle cx={end.x} cy={end.y} r={sel?27:23} className="path-ring"/><text x={end.x} y={end.y+5} textAnchor="middle" className="path-glyph">{p.glyph}</text>
        {!compact&&<><text x={end.x} y={end.y+42} textAnchor="middle" className="path-name">{p.name.toUpperCase()}</text><text x={end.x} y={end.y+55} textAnchor="middle" className="path-stage">{p.paused?"PAUSED":`${stage.toUpperCase()} · ${progress}%`}</text></>}
      </g>;
    })}
    <g className="sun-moon"><circle cx="190" cy="335" r="32"/><path d="M610 300 A44 44 0 1 0 642 366 A36 36 0 1 1 610 300Z"/></g>
  </svg></div>;
}
