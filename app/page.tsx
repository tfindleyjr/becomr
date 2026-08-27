"use client";

import { useEffect, useMemo, useState } from "react";

type Tab = "command"|"compass"|"archive"|"build";
type Energy = "LOW"|"STEADY"|"HIGH";
type VisualStage = "sealed"|"open"|"inscribed"|"ornamented"|"mastered";

type Quest = {
  id:string; path:string; glyph:string; title:string; proof:string;
  xp:number; boss?:boolean; done?:boolean; evidence?:string;
};

type PathState = {
  id:string;
  name:string;
  glyph:string;
  level:number;
  maxLevel:number;
  progress:number;
  tone:string;
  capability:string;
  region:string;
};

type ArchiveEntry = {
  id:string; date:string; easier:string; resisted:string; next:string;
  proven:number; xp:number;
};

const starter:Quest[] = [
  {id:"north",path:"DEVELOPER",glyph:"⌘",title:"Ship one meaningful BECOMR improvement",proof:"A visible improvement is running in the browser and you can explain what changed.",xp:100,boss:true},
  {id:"dev",path:"DEVELOPER",glyph:"⌘",title:"Build or debug one working feature",proof:"The feature works without a tutorial carrying the implementation.",xp:40},
  {id:"global",path:"GLOBAL",glyph:"↔",title:"Produce 10 original Spanish sentences",proof:"10 original sentences spoken or written from memory.",xp:35},
  {id:"body",path:"ATHLETE",glyph:"△",title:"Accumulate 25 strict pull-ups",proof:"25 honest reps using clean form.",xp:35},
  {id:"music",path:"MUSICIAN",glyph:"♫",title:"Land 5 phrase-aware DJ transitions",proof:"Five transitions enter on the intended musical phrase.",xp:30},
  {id:"truth",path:"TRUTH SEEKER",glyph:"✦",title:"Read Mark 1–3 and build a Jesus case note",proof:"Separate the text, observation, question, counterpoint, and current conclusion.",xp:30}
];

const paths:PathState[] = [
  {id:"developer",glyph:"⌘",name:"Developer",level:3,maxLevel:6,progress:58,tone:"teal",capability:"Build digital products",region:"WEST / STRUCTURE"},
  {id:"musician",glyph:"♫",name:"Musician",level:1,maxLevel:7,progress:24,tone:"amber",capability:"Perform and create music",region:"NORTHWEST / RHYTHM"},
  {id:"creative",glyph:"◇",name:"Creative Direction",level:1,maxLevel:5,progress:18,tone:"violet",capability:"Direct visual experiences",region:"NORTHEAST / VISION"},
  {id:"creator",glyph:"✧",name:"Creator",level:2,maxLevel:5,progress:38,tone:"rose",capability:"Turn ideas into objects",region:"EAST / CRAFT"},
  {id:"global",glyph:"↔",name:"Global Communicator",level:1,maxLevel:5,progress:22,tone:"jade",capability:"Communicate across cultures",region:"SOUTHEAST / CONNECTION"},
  {id:"entrepreneur",glyph:"▦",name:"Entrepreneur",level:1,maxLevel:5,progress:31,tone:"gold",capability:"Turn value into enterprise",region:"SOUTH / EXPANSION"},
  {id:"athlete",glyph:"△",name:"Athlete",level:1,maxLevel:5,progress:46,tone:"terra",capability:"Control and strengthen the body",region:"SOUTHWEST / FORCE"},
  {id:"truth",glyph:"✦",name:"Truth Seeker",level:1,maxLevel:6,progress:15,tone:"ivory",capability:"Interrogate belief and evidence",region:"WEST-SOUTH / WISDOM"}
];

const nodes:Record<string,string[]> = {
  developer:["Responsive Foundations","Interactive Applications","React + TypeScript","Full-Stack Systems","Production Engineering","AI Product Builder"],
  musician:["Rhythm","DJ Foundations","Beatmatching","Phrasing","Piano","Production","Live Performer"],
  creative:["Visual Literacy","Graphic Design","Photography","Videography","Campaign Direction"],
  creator:["Idea Practice","Construction","Patternmaking","Original Garment","Collection"],
  global:["Spanish A1","Spanish A2","Spanish B1","Japanese Kana","Japanese Conversation"],
  entrepreneur:["Money","Customer","Brand","Sales","Operator"],
  athlete:["Foundation","Control","L-Sit","Handstand","Muscle-Up"],
  truth:["Biblical Literacy","New Testament","Qur'anic Literacy","Jesus File","Historical Case","Final Inquiry"]
};

const pathColors:Record<string,string> = {
  teal:"#5E9B98", amber:"#D99A39", violet:"#8B78A4", rose:"#A8757D",
  jade:"#648A6D", gold:"#C99742", terra:"#A56549", ivory:"#D8CCAE"
};

function visualStage(level:number,maxLevel:number):VisualStage {
  const r = level / maxLevel;
  if(level <= 0) return "sealed";
  if(r < .22) return "open";
  if(r < .48) return "inscribed";
  if(r < .78) return "ornamented";
  return "mastered";
}

function BrandMark(){
  return <div className="brand-mark">
    <div className="brand-sigil"><span>✥</span></div>
    <div><strong>BECOMR</strong><span>BECOME CAPABLE</span></div>
  </div>;
}

function ProgressRing({value}:{value:number}) {
  return <div className="progress-ring" style={{"--p":`${value*3.6}deg`} as React.CSSProperties}>
    <div><strong>{value}%</strong><span>DAY</span></div>
  </div>;
}

function Leaf({x,y,rotate=0,scale=1,active=true}:{x:number;y:number;rotate?:number;scale?:number;active?:boolean}) {
  return <path className={`leaf ${active?"earned":"ghost"}`} d="M0,-9 C7,-8 11,-2 10,4 C3,7 -4,7 -10,4 C-10,-2 -7,-8 0,-9Z"
    transform={`translate(${x} ${y}) rotate(${rotate}) scale(${scale})`}/>;
}

function BranchGroup({id,stage,selected}:{id:string;stage:VisualStage;selected:boolean}) {
  const cls = `insignia-region region-${id} stage-${stage} ${selected?"selected":""}`;
  const common = {vectorEffect:"non-scaling-stroke" as const};

  if(id==="developer") return <g className={cls}>
    <path {...common} className="branch-main" d="M400 350 C340 330 304 286 274 228 C255 192 230 171 195 157"/>
    <path {...common} className="branch-sub detail-2" d="M300 292 C264 273 237 246 211 211"/>
    <path {...common} className="branch-sub detail-3" d="M272 229 C230 235 197 225 165 201"/>
    <path {...common} className="circuit detail-3" d="M218 191 L197 180 L181 185 L165 173"/>
    <circle className="node detail-2" cx="211" cy="211" r="6"/>
    <circle className="node detail-3" cx="165" cy="201" r="6"/>
    <Leaf x={194} y={158} rotate={-48} active={stage!=="sealed"}/>
    <Leaf x={207} y={210} rotate={-52} scale={.8} active={["ornamented","mastered"].includes(stage)}/>
    <Leaf x={166} y={201} rotate={-68} scale={.72} active={stage==="mastered"}/>
  </g>;

  if(id==="musician") return <g className={cls}>
    <path className="branch-main" d="M408 351 C366 304 352 247 357 184 C359 151 351 122 331 95"/>
    <path className="branch-sub detail-2" d="M360 229 C331 207 306 174 296 141"/>
    <path className="branch-sub detail-3" d="M356 186 C383 165 393 140 395 110"/>
    <path className="rhythm detail-3" d="M292 137 q12 -18 24 0 q12 18 24 0"/>
    <Leaf x={330} y={96} rotate={-15} active={stage!=="sealed"}/>
    <Leaf x={296} y={141} rotate={-42} scale={.82} active={["ornamented","mastered"].includes(stage)}/>
    <Leaf x={395} y={110} rotate={20} scale={.72} active={stage==="mastered"}/>
  </g>;

  if(id==="creative") return <g className={cls}>
    <path className="branch-main" d="M420 349 C449 299 473 246 487 190 C499 145 522 119 558 95"/>
    <path className="branch-sub detail-2" d="M475 242 C505 220 531 192 547 158"/>
    <path className="branch-sub detail-3" d="M488 188 C464 168 454 139 453 112"/>
    <path className="frame detail-3" d="M525 164 l20 -11 l18 13 l-20 13z"/>
    <Leaf x={558} y={96} rotate={42} active={stage!=="sealed"}/>
    <Leaf x={548} y={159} rotate={52} scale={.82} active={["ornamented","mastered"].includes(stage)}/>
    <Leaf x={453} y={112} rotate={-16} scale={.72} active={stage==="mastered"}/>
  </g>;

  if(id==="creator") return <g className={cls}>
    <path className="branch-main" d="M425 358 C485 341 536 309 575 265 C603 234 632 220 672 216"/>
    <path className="branch-sub detail-2" d="M548 292 C583 291 613 278 637 256"/>
    <path className="branch-sub detail-3" d="M575 266 C588 232 590 202 580 172"/>
    <path className="stitch detail-3" d="M607 276 l9 -8 l9 8 l9 -8"/>
    <Leaf x={671} y={216} rotate={82} active={stage!=="sealed"}/>
    <Leaf x={638} y={256} rotate={66} scale={.82} active={["ornamented","mastered"].includes(stage)}/>
    <Leaf x={580} y={172} rotate={18} scale={.72} active={stage==="mastered"}/>
  </g>;

  if(id==="global") return <g className={cls}>
    <path className="branch-main" d="M425 372 C493 382 548 410 594 451 C621 476 649 491 687 493"/>
    <path className="branch-sub detail-2" d="M552 414 C585 414 617 428 643 450"/>
    <path className="branch-sub detail-3" d="M594 451 C602 484 620 509 649 530"/>
    <path className="orbit detail-3" d="M618 432 q18 -18 36 0 q-18 18 -36 0z"/>
    <Leaf x={687} y={493} rotate={100} active={stage!=="sealed"}/>
    <Leaf x={649} y={530} rotate={125} scale={.76} active={["ornamented","mastered"].includes(stage)}/>
  </g>;

  if(id==="entrepreneur") return <g className={cls}>
    <path className="branch-main" d="M414 378 C442 432 456 487 454 541 C452 582 461 616 488 646"/>
    <path className="branch-sub detail-2" d="M452 499 C481 521 500 552 505 585"/>
    <path className="branch-sub detail-3" d="M454 542 C425 558 410 582 403 610"/>
    <path className="ledger detail-3" d="M477 543 h30 M482 552 h24 M487 561 h19"/>
    <Leaf x={488} y={646} rotate={158} active={stage!=="sealed"}/>
    <Leaf x={505} y={585} rotate={140} scale={.8} active={["ornamented","mastered"].includes(stage)}/>
  </g>;

  if(id==="athlete") return <g className={cls}>
    <path className="branch-main" d="M398 379 C365 431 346 481 344 535 C342 578 328 610 302 637"/>
    <path className="branch-sub detail-2" d="M348 497 C320 516 300 544 293 576"/>
    <path className="branch-sub detail-3" d="M344 536 C371 557 382 583 385 611"/>
    <path className="force detail-3" d="M302 544 l-12 18 l12 18 M385 565 l12 18 l-12 18"/>
    <Leaf x={302} y={637} rotate={-152} active={stage!=="sealed"}/>
    <Leaf x={293} y={576} rotate={-135} scale={.8} active={["ornamented","mastered"].includes(stage)}/>
  </g>;

  return <g className={cls}>
    <path className="branch-main" d="M393 367 C331 377 278 399 232 432 C198 457 171 470 133 470"/>
    <path className="branch-sub detail-2" d="M264 409 C231 401 200 405 171 420"/>
    <path className="branch-sub detail-3" d="M231 432 C217 466 195 489 166 507"/>
    <path className="truth-star detail-3" d="M171 415 l5 10 l10 5 l-10 5 l-5 10 l-5 -10 l-10 -5 l10 -5z"/>
    <Leaf x={133} y={470} rotate={-100} active={stage!=="sealed"}/>
    <Leaf x={166} y={507} rotate={-125} scale={.8} active={["ornamented","mastered"].includes(stage)}/>
  </g>;
}

function DynamicInsignia({selectedPath,onSelect,compact=false}:{selectedPath:string;onSelect?:(id:string)=>void;compact?:boolean}) {
  const masteredCount = paths.filter(p=>visualStage(p.level,p.maxLevel)==="mastered").length;
  const constellationFounder = paths.find(p=>p.id==="developer")!.level>=4 && paths.find(p=>p.id==="entrepreneur")!.level>=3;
  const constellationArtist = paths.find(p=>p.id==="musician")!.level>=3 && paths.find(p=>p.id==="creative")!.level>=3 && paths.find(p=>p.id==="creator")!.level>=3;

  return <div className={`dynamic-insignia ${compact?"compact":""}`}>
    <img className="future-form" src="/assets/becomr-compass-tree.png" alt="" aria-hidden="true"/>
    <svg viewBox="0 0 800 740" className="insignia-svg" role="img" aria-label="Your progressively inscribed BECOMR Compass Tree">
      <defs>
        <radialGradient id="coreGlow"><stop offset="0" stopColor="#FFB020" stopOpacity=".65"/><stop offset="1" stopColor="#C99742" stopOpacity="0"/></radialGradient>
        <filter id="softGlow"><feGaussianBlur stdDeviation="4" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
      </defs>

      <g className="firmament">
        <path d="M100 378 A300 300 0 0 1 700 378" className="arc"/>
        <path d="M126 378 A274 274 0 0 1 674 378" className="arc inner"/>
        {[0,1,2,3,4,5,6,7,8,9,10,11].map(i=>{
          const a=(200+i*140/11)*Math.PI/180, x=400+300*Math.cos(a), y=378+300*Math.sin(a);
          return <circle key={i} cx={x} cy={y} r={i%3===0?3:1.6} className="star-dot"/>;
        })}
      </g>

      <g className="celestial-sun element-emphasis">
        <circle cx="190" cy="330" r="35" className="celestial-body"/>
        {[0,1,2,3,4,5,6,7,8,9,10,11].map(i=>{
          const a=i*30*Math.PI/180;
          return <line key={i} x1={190+45*Math.cos(a)} y1={330+45*Math.sin(a)} x2={190+59*Math.cos(a)} y2={330+59*Math.sin(a)} className="ray"/>;
        })}
        <circle cx="190" cy="330" r="12" className="sun-core"/>
      </g>

      <g className="celestial-moon element-emphasis">
        <path d="M612 292 A47 47 0 1 0 647 365 A39 39 0 1 1 612 292Z" className="moon-shape"/>
        <circle cx="640" cy="303" r="2" className="star-dot"/>
        <circle cx="662" cy="337" r="2.4" className="star-dot"/>
      </g>

      <g className="compass-base element-emphasis">
        <circle cx="400" cy="545" r="120" className="compass-ring ghost-ring"/>
        <circle cx="400" cy="545" r="103" className="compass-ring"/>
        {[0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15].map(i=>{
          const a=i*22.5*Math.PI/180;
          const r1=i%4===0?86:91, r2=100;
          return <line key={i} x1={400+r1*Math.cos(a)} y1={545+r1*Math.sin(a)} x2={400+r2*Math.cos(a)} y2={545+r2*Math.sin(a)} className="tick"/>;
        })}
        <path d="M400 410 L420 525 L400 545 L380 525 Z" className="needle north"/>
        <path d="M400 680 L420 565 L400 545 L380 565 Z" className="needle south"/>
        <path d="M265 545 L380 525 L400 545 L380 565 Z" className="needle west"/>
        <path d="M535 545 L420 525 L400 545 L420 565 Z" className="needle east"/>
        <circle cx="400" cy="545" r="22" className="core-ring"/>
        <circle cx="400" cy="545" r="8" className="core-dot"/>
        <text x="400" y="427" className="direction" textAnchor="middle">N</text>
        <text x="400" y="674" className="direction" textAnchor="middle">S</text>
        <text x="286" y="551" className="direction" textAnchor="middle">W</text>
        <text x="515" y="551" className="direction" textAnchor="middle">E</text>
      </g>

      <g className="root-system element-emphasis">
        <path d="M400 545 C384 568 370 594 363 623 C355 650 342 666 320 683" className="root"/>
        <path d="M400 545 C416 570 430 596 438 624 C447 650 460 670 485 688" className="root"/>
        <path d="M400 545 C391 578 388 614 390 652 C390 676 386 695 374 711" className="root thin"/>
        <path d="M400 545 C410 578 415 615 411 653 C410 676 416 695 430 712" className="root thin"/>
        <path d="M364 623 C344 620 329 625 315 637" className="root thin"/>
        <path d="M438 624 C458 619 474 625 491 640" className="root thin"/>
      </g>

      <g className="trunk-core element-emphasis">
        <path d="M400 548 C378 504 377 463 389 422 C396 397 396 370 395 348 C394 327 397 304 401 278 C405 307 408 329 407 351 C407 378 407 401 414 424 C426 465 423 506 400 548Z" className="trunk"/>
        <path d="M393 533 C391 491 396 452 400 421 C403 387 402 348 401 305" className="bark"/>
        <path d="M407 533 C411 492 407 454 403 422 C399 391 400 348 401 305" className="bark"/>
      </g>

      {paths.map(p=><BranchGroup key={p.id} id={p.id} stage={visualStage(p.level,p.maxLevel)} selected={selectedPath===p.id}/>)}

      {constellationFounder && <g className="constellation founder">
        <path d="M188 200 Q315 505 489 646" className="constellation-line"/>
        <circle cx="338" cy="432" r="5" className="constellation-star"/>
        <path d="M338 418 l4 10 l10 4 l-10 4 l-4 10 l-4-10 l-10-4 l10-4z" className="constellation-star"/>
      </g>}
      {constellationArtist && <g className="constellation artist">
        <path d="M330 96 Q410 72 558 96" className="constellation-line"/>
        <path d="M445 71 l5 12 l12 5 l-12 5 l-5 12 l-5-12 l-12-5 l12-5z" className="constellation-star"/>
      </g>}

      <g className="mastery-crown" opacity={masteredCount===paths.length?1:.12}>
        <path d="M380 52 l20 -28 l20 28 l-20 14z" className="crown"/>
        <text x="400" y="82" textAnchor="middle" className="mastery-label">FULL FORM</text>
      </g>

      {!compact && paths.map((p,i)=>{
        const pos:[[number,number],[number,number],[number,number],[number,number],[number,number],[number,number],[number,number],[number,number]] = [[102,250],[265,80],[535,80],[700,245],[690,500],[525,690],[275,690],[105,490]];
        const [x,y]=pos[i];
        const stage=visualStage(p.level,p.maxLevel);
        return <g key={p.id} className={`path-marker ${selectedPath===p.id?"selected":""}`} onClick={()=>onSelect?.(p.id)} role="button">
          <circle cx={x} cy={y} r="26" className="marker-ring"/>
          <text x={x} y={y+6} textAnchor="middle" className="marker-glyph">{p.glyph}</text>
          <text x={x} y={y+43} textAnchor="middle" className="marker-label">{p.name.toUpperCase()}</text>
          <text x={x} y={y+57} textAnchor="middle" className="marker-stage">{stage.toUpperCase()}</text>
        </g>
      })}
    </svg>

    {!compact && <div className="insignia-legend">
      <span><i className="legend sealed"/>SEALED</span>
      <span><i className="legend open"/>OPEN</span>
      <span><i className="legend inscribed"/>INSCRIBED</span>
      <span><i className="legend ornamented"/>ORNAMENTED</span>
      <span><i className="legend mastered"/>MASTERED</span>
    </div>}
  </div>;
}

function Trial({q,onBack,onProve}:{q:Quest;onBack:()=>void;onProve:(text:string)=>void}) {
  const [started,setStarted]=useState(false);
  const [elapsed,setElapsed]=useState(0);
  const [note,setNote]=useState(q.evidence||"");
  useEffect(()=>{
    if(!started) return;
    const t=setInterval(()=>setElapsed(x=>x+1),1000);
    return ()=>clearInterval(t);
  },[started]);
  const time=`${String(Math.floor(elapsed/60)).padStart(2,"0")}:${String(elapsed%60).padStart(2,"0")}`;

  return <main className="trial-view">
    <div className="cosmos"/>
    <button className="text-button back" onClick={onBack}>← RETURN TO COMMAND</button>
    <div className="trial-column">
      <div className="trial-glyph">{q.boss?"◆":q.glyph}</div>
      <p className="kicker">{q.boss?"TODAY'S NORTH":"ACTIVE TRIAL"} / {q.path}</p>
      <h1>{q.title}</h1>
      <p className="trial-axiom">Time is a constraint. <em>Proof is the objective.</em></p>
      <section className="inscription"><span>PROOF REQUIRED</span><p>{q.proof}</p></section>
      <div className="trial-meter">
        <div><span>PAR</span><strong>30 MIN</strong></div><i/>
        <div><span>{started?"ELAPSED":"STATE"}</span><strong>{started?time:"READY"}</strong></div>
      </div>
      {!started ? <button className="ritual-button" onClick={()=>setStarted(true)}>BEGIN TRIAL <b>→</b></button> :
      <>
        <label className="evidence"><span>WHAT DID YOU PROVE?</span><textarea value={note} onChange={e=>setNote(e.target.value)} placeholder="Result, number, link, observation, or evidence..."/></label>
        <button className="ritual-button prove" onClick={()=>onProve(note)}>INSCRIBE PROOF <b>+{q.xp} XP</b></button>
      </>}
      <div className="ritual-line"><span>☀ ACT</span><i/><span>PROVE</span><i/><span>☾ REFLECT</span></div>
    </div>
  </main>;
}

export default function Home(){
  const [tab,setTab]=useState<Tab>("command");
  const [quests,setQuests]=useState<Quest[]>(starter);
  const [xp,setXp]=useState(1840);
  const [momentum,setMomentum]=useState(6);
  const [energy,setEnergy]=useState<Energy>("STEADY");
  const [active,setActive]=useState<string|null>(null);
  const [selectedPath,setSelectedPath]=useState("developer");
  const [archives,setArchives]=useState<ArchiveEntry[]>([]);
  const [easier,setEasier]=useState("");
  const [resisted,setResisted]=useState("");
  const [next,setNext]=useState("");
  const [ceremony,setCeremony]=useState<string|null>(null);

  useEffect(()=>{
    const raw=localStorage.getItem("becomr-v04");
    if(!raw) return;
    try {
      const d=JSON.parse(raw);
      if(d.quests) setQuests(d.quests);
      if(d.xp) setXp(d.xp);
      if(d.momentum) setMomentum(d.momentum);
      if(d.archives) setArchives(d.archives);
    } catch {}
  },[]);
  useEffect(()=>{localStorage.setItem("becomr-v04",JSON.stringify({quests,xp,momentum,archives}));},[quests,xp,momentum,archives]);

  const activeQuest=quests.find(q=>q.id===active);
  const done=quests.filter(q=>q.done).length;
  const pct=Math.round(done/quests.length*100);
  const level=Math.floor(xp/500)+1;
  const north=quests.find(q=>q.boss)!;
  const selected=paths.find(p=>p.id===selectedPath)!;
  const selectedStage=visualStage(selected.level,selected.maxLevel);
  const strongest=[...paths].sort((a,b)=>b.progress-a.progress).slice(0,3);

  const earnedMarks=[
    {name:"FIRST PROOF",sigil:"✦",ok:done>=1},
    {name:"MOMENTUM VII",sigil:"☀",ok:momentum>=7},
    {name:"FIVE PROOFS",sigil:"❧",ok:done>=5},
    {name:"NORTH PROVEN",sigil:"◆",ok:!!north.done}
  ];

  function prove(q:Quest,note:string) {
    if(!q.done) setXp(v=>v+q.xp);
    setQuests(list=>list.map(x=>x.id===q.id?{...x,done:true,evidence:note.trim()}:x));
    setActive(null);
    setCeremony(q.boss?"TODAY'S NORTH PROVEN":"NEW INSCRIPTION EARNED");
    setTimeout(()=>setCeremony(null),2400);
  }

  function saveArchive(){
    if(!easier.trim()&&!resisted.trim()&&!next.trim()) return;
    setArchives(list=>[{id:String(Date.now()),date:new Date().toLocaleDateString(undefined,{month:"short",day:"numeric",year:"numeric"}),
      easier:easier.trim(),resisted:resisted.trim(),next:next.trim(),proven:done,xp},...list]);
    setEasier("");setResisted("");setNext("");setMomentum(m=>m+1);setCeremony("DAY INSCRIBED");
    setTimeout(()=>setCeremony(null),2200);
  }

  if(activeQuest) return <Trial q={activeQuest} onBack={()=>setActive(null)} onProve={(note)=>prove(activeQuest,note)}/>;

  return <main className="shell">
    <div className="noise"/>
    <header className="masthead">
      <BrandMark/>
      <div className="mast-meta"><span>LVL {level}</span><i/><span>{xp.toLocaleString()} XP</span><i/><span>☀ {momentum}</span></div>
    </header>

    {tab==="command" && <section className="page command-page">
      <div className="command-heading">
        <div>
          <p className="kicker">COMMAND / {new Date().toLocaleDateString(undefined,{weekday:"long"}).toUpperCase()}</p>
          <h1>Find your direction.<br/><em>Grow into it.</em></h1>
        </div>
        <div className="energy"><span>AVAILABLE CAPACITY</span><div>{(["LOW","STEADY","HIGH"] as Energy[]).map(e=><button className={energy===e?"active":""} key={e} onClick={()=>setEnergy(e)}>{e}</button>)}</div></div>
      </div>

      <div className="command-grid">
        <section className="north-section">
          <div className="section-rule"><span>01</span><b>TODAY'S NORTH</b><i/></div>
          <div className="north-objective">
            <div className="diamond">{north.done?"✓":"◆"}</div>
            <div><p>{north.path} / BOSS QUEST</p><h2>{north.title}</h2><div className="proof-line"><span>PROOF</span><i/>{north.proof}</div></div>
          </div>
          <button className="ritual-button" onClick={()=>north.done?null:setActive(north.id)} disabled={north.done}>{north.done?"NORTH PROVEN":"ENTER TRIAL"} <b>{north.done?"✦":"→"}</b></button>
          <div className="rank-line">
            <span className={north.done?"on":""}>BRONZE</span><i className={done>=4?"on":""}/><span className={done>=4?"on":""}>SILVER</span><i className={done===quests.length?"on":""}/><span className={done===quests.length?"on":""}>GOLD</span>
          </div>
        </section>

        <aside className="daily-oracle">
          <div className="section-rule"><span>02</span><b>DAILY INSIGNIA</b><i/></div>
          <div className="oracle-emblem">
            <DynamicInsignia selectedPath={selectedPath} compact/>
            <div className="oracle-status"><ProgressRing value={pct}/><div><span>PROVEN TODAY</span><strong>{done} / {quests.length}</strong><small>{energy} CAPACITY</small></div></div>
          </div>
        </aside>
      </div>

      <section className="path-ledger">
        <div className="section-rule"><span>03</span><b>OPEN PATHS</b><i/></div>
        <div className="ledger-head"><span>PATH</span><span>TRIAL</span><span>PROOF</span></div>
        {quests.filter(q=>!q.boss).map(q=><button className={`ledger-row ${q.done?"proven":""}`} key={q.id} onClick={()=>q.done?null:setActive(q.id)}>
          <span className="ledger-path"><b>{q.glyph}</b>{q.path}</span><strong>{q.title}</strong><span className="ledger-action">{q.done?"PROVEN":"OPEN"} <b>{q.done?"✦":"→"}</b></span>
        </button>)}
      </section>

      <div className={`leisure-line ${north.done?"open":""}`}><span>{north.done?"☀":"◇"}</span><div><small>LEISURE</small><strong>{north.done?"UNLOCKED — REST WITHOUT GUILT":"SEALED UNTIL TODAY'S NORTH IS PROVEN"}</strong></div></div>
    </section>}

    {tab==="compass" && <section className="page compass-page">
      <div className="compass-title">
        <div><p className="kicker">COMPASS / LIVING INSIGNIA</p><h1>You do not receive the symbol.<br/><em>You earn it.</em></h1></div>
        <p>Every proven level permanently inscribes a new piece of your Compass Tree. The finished emblem is the destination, not the starting point.</p>
      </div>

      <div className="insignia-shell">
        <div className="insignia-caption left"><span>☀</span><b>ACTION</b><small>OUTWARD / EXECUTION</small></div>
        <div className="insignia-caption right"><span>☾</span><b>REFLECTION</b><small>INWARD / INTEGRATION</small></div>
        <DynamicInsignia selectedPath={selectedPath} onSelect={setSelectedPath}/>
      </div>

      <section className="path-inspector">
        <div className="inspector-intro">
          <span className={`big-glyph tone-${selected.tone}`}>{selected.glyph}</span>
          <div><p>{selected.region} / LVL {selected.level} OF {selected.maxLevel}</p><h2>{selected.name}</h2><span>{selected.capability}</span></div>
          <div className="stage-readout"><small>VISUAL STATE</small><strong>{selectedStage.toUpperCase()}</strong><em>{selected.progress}%</em></div>
        </div>

        <div className="stage-progression">
          {(["sealed","open","inscribed","ornamented","mastered"] as VisualStage[]).map((s,i)=>{
            const order=["sealed","open","inscribed","ornamented","mastered"];
            const on=order.indexOf(selectedStage)>=i;
            return <div className={on?"active":""} key={s}><span>{i+1}</span><b>{s}</b><small>{
              s==="sealed"?"Future structure only":
              s==="open"?"Primary branch appears":
              s==="inscribed"?"Secondary geometry is carved":
              s==="ornamented"?"Leaves, symbols, and detail emerge":"Region reaches full ceremonial form"
            }</small></div>
          })}
        </div>

        <div className="branch-line">
          {nodes[selected.id].map((n,i)=>{
            const state=i<selected.level?"proven":i===selected.level?"open":"sealed";
            return <div className={`branch-node ${state}`} key={n}><i>{state==="proven"?"✦":state==="open"?"◇":"·"}</i><strong>{n}</strong><span>{state.toUpperCase()}</span></div>
          })}
        </div>

        <div className="next-inscription">
          <span>↳ NEXT INSCRIPTION</span>
          <div><strong>{nodes[selected.id][Math.min(selected.level,nodes[selected.id].length-1)]}</strong><p>Prove the open node to permanently add the next visual fragment to this region of your insignia.</p></div>
        </div>
      </section>
    </section>}

    {tab==="archive" && <section className="page archive-page">
      <div className="archive-heading"><p className="kicker">☾ ARCHIVE / NIGHTLY SAVE</p><h1>Remember how you <em>changed.</em></h1></div>
      <div className="save-sheet">
        <label><span>WHAT BECAME EASIER TODAY?</span><textarea value={easier} onChange={e=>setEasier(e.target.value)} placeholder="What moved from friction toward capability?"/></label>
        <label><span>WHAT RESISTED YOU?</span><textarea value={resisted} onChange={e=>setResisted(e.target.value)} placeholder="Where did you get stuck, avoid, or lose clarity?"/></label>
        <label><span>WHERE SHOULD THE COMPASS POINT NEXT?</span><textarea value={next} onChange={e=>setNext(e.target.value)} placeholder="The next obvious challenge..."/></label>
        <button className="ritual-button" onClick={saveArchive}>INSCRIBE SAVE <b>☾</b></button>
      </div>
      <div className="archive-history">
        <div className="section-rule"><span>∞</span><b>TRANSFORMATION RECORD</b><i/></div>
        {archives.length===0 ? <div className="empty-state">Your Archive is empty. Tonight's first Save will begin your record.</div> :
        archives.map(a=><article className="archive-entry" key={a.id}>
          <div><time>{a.date}</time><strong>{a.proven} PROOFS</strong></div>
          <section><small>BECAME EASIER</small><p>{a.easier||"—"}</p></section>
          <section><small>RESISTED</small><p>{a.resisted||"—"}</p></section>
          <section><small>NEXT BEARING</small><p>{a.next||"—"}</p></section>
        </article>)}
      </div>
    </section>}

    {tab==="build" && <section className="page build-page">
      <div className="build-hero">
        <div className="identity-seal"><DynamicInsignia selectedPath={selectedPath} compact/></div>
        <div><p className="kicker">BUILD / CURRENT SELF</p><h1>LVL {level}</h1><h2>{done<3?"SEEKER":done<6?"BUILDER":"BECOMR"}</h2><p>{xp.toLocaleString()} XP · ☀ MOMENTUM {momentum}</p></div>
      </div>
      <div className="build-columns">
        <section><div className="section-rule"><span>I</span><b>STRONGEST LIMBS</b><i/></div>
          {strongest.map((p,i)=><div className="limb" key={p.id}><span>0{i+1}</span><div><strong>{p.name}</strong><i><b style={{width:`${p.progress}%`}}/></i></div><em>{p.progress}%</em></div>)}
        </section>
        <section><div className="section-rule"><span>II</span><b>MARKS</b><i/></div><div className="marks">{earnedMarks.map(m=><div key={m.name} className={m.ok?"earned":"sealed"}><b>{m.sigil}</b><span>{m.name}</span><small>{m.ok?"INSCRIBED":"SEALED"}</small></div>)}</div></section>
      </div>
      <section className="capabilities"><div className="section-rule"><span>III</span><b>PROVEN CAPABILITIES</b><i/></div>
        {quests.filter(q=>q.done).length===0?<div className="empty-state">Prove your first Trial and it will appear here.</div>:
        quests.filter(q=>q.done).map(q=><div className="capability" key={q.id}><span>✦</span><div><small>{q.path}</small><strong>{q.title}</strong><p>{q.evidence||q.proof}</p></div></div>)}
      </section>
    </section>}

    <nav className="instrument-nav">
      {[["command","☀","COMMAND"],["compass","✥","COMPASS"],["archive","☾","ARCHIVE"],["build","◉","BUILD"]].map(([id,g,l])=><button key={id} className={tab===id?"active":""} onClick={()=>setTab(id as Tab)}><b>{g}</b><span>{l}</span></button>)}
    </nav>

    {ceremony && <div className="ceremony"><div>✦</div><p>PROGRESSION RECORDED</p><h2>{ceremony}</h2><span>Your insignia has changed.</span></div>}
  </main>;
}
