"use client";

import { useEffect, useMemo, useState } from "react";
import { Activity, BookOpen, Brain, BriefcaseBusiness, ChevronLeft, Clock3, Code2, Crown, Dumbbell, Globe2, LockKeyhole, Music2, Palette, Sparkles, X } from "lucide-react";

type Quest = { id:string; title:string; tree:string; xp:number; proof:string; boss?:boolean; done?:boolean };
type Node = { title:string; subtitle:string; status:"done"|"current"|"locked"; boss?:boolean };
type Tree = { id:string; name:string; icon:string; level:number; progress:number; accent:string; nodes:Node[] };
type Energy = "LOW" | "STEADY" | "HIGH";
type CompletionCeremony = { title:string; tree:string; xp:number; boss:boolean; levelUp:boolean } | null;
type ArchiveEntry = {
  id:string;
  date:string;
  title:string;
  path:string;
  note:string;
  resistance:string;
  next:string;
  xp:number;
};

const starterQuests: Quest[] = [
  { id:"boss", title:"Ship one meaningful BECOMR improvement", tree:"DEVELOPER", xp:100, boss:true, proof:"A visible improvement is running in the app and you can explain what changed." },
  { id:"dev", title:"Build or debug one working feature", tree:"DEVELOPER", xp:40, proof:"The feature works in the browser without relying on a tutorial to carry you through it." },
  { id:"global", title:"Produce 10 original Spanish sentences", tree:"GLOBAL", xp:35, proof:"10 sentences spoken or written from memory using today’s vocabulary." },
  { id:"body", title:"Accumulate 25 strict pull-ups", tree:"ATHLETE", xp:35, proof:"25 total reps with clean form, recorded honestly." },
  { id:"music", title:"Land 5 clean phrase-aware transitions", tree:"MUSIC", xp:30, proof:"5 transitions where the new track enters on the intended phrase." },
  { id:"truth", title:"Read Mark 1–3 and log claims about Jesus", tree:"TRUTH", xp:30, proof:"A short case note separating text, observation, question, and current conclusion." }
];

const trees: Tree[] = [
  {id:"dev",name:"DEVELOPER",icon:"code",level:3,progress:58,accent:"#4F9A94",nodes:[
    {title:"Web Builder",subtitle:"Responsive foundations",status:"done"},{title:"Interactive Apps",subtitle:"JavaScript + APIs",status:"done"},{title:"Front-End Engineer",subtitle:"React + TypeScript",status:"current"},{title:"Full-Stack",subtitle:"Auth + DB + persistence",status:"locked"},{title:"Production Engineer",subtitle:"Testing + cloud + security",status:"locked",boss:true},{title:"AI Product Builder",subtitle:"Intelligent real-world systems",status:"locked"}
  ]},
  {id:"music",name:"MUSICIAN",icon:"music",level:1,progress:24,accent:"#D59A46",nodes:[
    {title:"Rhythm",subtitle:"BPM, bars, phrases",status:"current"},{title:"DJ Foundations",subtitle:"Cue, EQ, transitions",status:"locked"},{title:"Mixer",subtitle:"Beatmatch + phrasing",status:"locked"},{title:"Pianist",subtitle:"Harmony + performance",status:"locked"},{title:"Producer",subtitle:"Build complete songs",status:"locked",boss:true},{title:"Live Performer",subtitle:"Perform your own identity",status:"locked"}
  ]},
  {id:"creative",name:"CREATIVE DIRECTION",icon:"palette",level:1,progress:18,accent:"#8E759F",nodes:[
    {title:"Visual Literacy",subtitle:"Composition + hierarchy",status:"current"},{title:"Graphic Design",subtitle:"Typography + systems",status:"locked"},{title:"Photography",subtitle:"Light + framing",status:"locked"},{title:"Videography",subtitle:"Motion + edit + sound",status:"locked"},{title:"Campaign Director",subtitle:"Story through launch",status:"locked",boss:true}
  ]},
  {id:"creator",name:"CREATOR",icon:"spark",level:2,progress:38,accent:"#A96F79",nodes:[
    {title:"Idea Practice",subtitle:"Capture + sketch",status:"done"},{title:"Construction",subtitle:"Sewing fundamentals",status:"current"},{title:"Patternmaking",subtitle:"Build from zero",status:"locked"},{title:"Original Garment",subtitle:"Concept → object",status:"locked",boss:true},{title:"Collection",subtitle:"Cohesive body of work",status:"locked"}
  ]},
  {id:"global",name:"GLOBAL COMMUNICATOR",icon:"globe",level:1,progress:22,accent:"#568A71",nodes:[
    {title:"Spanish A1",subtitle:"Everyday foundations",status:"current"},{title:"Spanish A2",subtitle:"Simple independence",status:"locked"},{title:"Spanish B1",subtitle:"Sustained conversation",status:"locked",boss:true},{title:"Japanese Kana",subtitle:"Hiragana + Katakana",status:"current"},{title:"Japanese Conversation",subtitle:"Independent basics",status:"locked"}
  ]},
  {id:"biz",name:"ENTREPRENEUR",icon:"biz",level:1,progress:31,accent:"#B98B48",nodes:[
    {title:"Money",subtitle:"Margin + cash flow",status:"current"},{title:"Customer",subtitle:"Problems + research",status:"locked"},{title:"Brand",subtitle:"Positioning + story",status:"locked"},{title:"Sales",subtitle:"Offer + conversion",status:"locked"},{title:"Operator",subtitle:"Systems + delegation",status:"locked",boss:true}
  ]},
  {id:"body",name:"ATHLETE",icon:"body",level:1,progress:46,accent:"#A45F43",nodes:[
    {title:"Foundation",subtitle:"Push, pull, core, squat",status:"current"},{title:"Control",subtitle:"Form + volume",status:"locked"},{title:"L-Sit",subtitle:"Compression strength",status:"locked"},{title:"Handstand",subtitle:"Balance + control",status:"locked"},{title:"Muscle-Up",subtitle:"Explosive mastery",status:"locked",boss:true}
  ]},
  {id:"truth",name:"TRUTH SEEKER",icon:"truth",level:1,progress:15,accent:"#D8C9A8",nodes:[
    {title:"Biblical Literacy",subtitle:"Story, structure, context",status:"current"},{title:"New Testament",subtitle:"Read + interrogate claims",status:"locked"},{title:"Qur'anic Literacy",subtitle:"Read on its own terms",status:"locked"},{title:"Jesus File",subtitle:"Bible ↔ Qur'an comparison",status:"locked"},{title:"Historical Case",subtitle:"Crucifixion + resurrection",status:"locked",boss:true},{title:"Final Inquiry",subtitle:"Who is Jesus?",status:"locked"}
  ]}
];

const icons:any = { code:<Code2/>, music:<Music2/>, palette:<Palette/>, spark:<Sparkles/>, globe:<Globe2/>, biz:<BriefcaseBusiness/>, body:<Dumbbell/>, truth:<BookOpen/> };



const treePositions: Record<string,{x:number;y:number;side:"left"|"right";mark:string}> = {
  music:{x:184,y:270,side:"left",mark:"♫"},
  creator:{x:130,y:370,side:"left",mark:"✧"},
  global:{x:190,y:475,side:"left",mark:"↔"},
  body:{x:255,y:565,side:"left",mark:"△"},
  dev:{x:536,y:270,side:"right",mark:"<>"},
  creative:{x:592,y:370,side:"right",mark:"◇"},
  biz:{x:530,y:475,side:"right",mark:"▦"},
  truth:{x:465,y:565,side:"right",mark:"✦"},
};

function CompassTree({selected,onSelect}:{selected:Tree;onSelect:(tree:Tree)=>void}){
  return <div className="compass-tree-world" style={{"--selected-accent":selected.accent} as any}>
    <div className="world-caption"><span>THE LIVING COMPASS</span><i/><small>GROWTH FOLLOWS DIRECTION</small></div>
    <svg className="compass-tree-svg" viewBox="0 0 720 900" role="img" aria-label="BECOMR Compass Tree">
      <defs>
        <radialGradient id="sunHalo"><stop offset="0" stopColor="#FFB020" stopOpacity=".28"/><stop offset=".6" stopColor="#C99742" stopOpacity=".07"/><stop offset="1" stopColor="#C99742" stopOpacity="0"/></radialGradient>
        <radialGradient id="moonHalo"><stop offset="0" stopColor="#EFE4C9" stopOpacity=".18"/><stop offset="1" stopColor="#EFE4C9" stopOpacity="0"/></radialGradient>
        <linearGradient id="trunkMetal" x1="0" x2="1"><stop stopColor="#78603a"/><stop offset=".48" stopColor="#d1ac69"/><stop offset="1" stopColor="#695330"/></linearGradient>
        <filter id="softGlow"><feGaussianBlur stdDeviation="5" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
      </defs>

      <g className="celestial-field">
        <circle cx="128" cy="132" r="82" fill="url(#sunHalo)"/>
        <circle cx="128" cy="132" r="25" className="sun-core"/>
        {Array.from({length:16}).map((_,i)=>{const a=i*Math.PI/8;return <line key={i} x1={128+Math.cos(a)*35} y1={132+Math.sin(a)*35} x2={128+Math.cos(a)*49} y2={132+Math.sin(a)*49} className="sun-ray"/>})}
        <circle cx="590" cy="132" r="82" fill="url(#moonHalo)"/>
        <path d="M604 106c-29 7-38 46-13 63 15 10 34 6 44-6-9 25-41 35-64 16-27-22-20-67 12-80 8-3 15-3 21-1z" className="moon-crescent"/>
        <path d="M79 213 C190 156 530 156 642 213" className="firmament-arc"/>
        <path d="M91 225 C206 179 513 179 630 225" className="firmament-arc faint"/>
        {[ [70,88],[198,102],[251,70],[456,88],[522,76],[653,113],[86,287],[635,286],[330,86],[388,115] ].map(([x,y],i)=><g key={i} className="star"><circle cx={x} cy={y} r={i%3===0?2.2:1.2}/>{i%3===0&&<><line x1={x-6} y1={y} x2={x+6} y2={y}/><line x1={x} y1={y-6} x2={x} y2={y+6}/></>}</g>)}
      </g>

      <g className="tree-art">
        <path className="ghost-canopy" d="M358 585 C330 520 310 470 302 415 C294 354 320 318 337 278 C347 255 350 225 359 196 C368 227 373 254 385 278 C405 316 428 356 418 416 C409 472 389 523 361 585 Z"/>
        <path className="trunk-main" d="M357 665 C344 616 348 578 339 535 C331 493 318 463 321 420 C324 377 343 346 348 305 C352 270 349 232 360 188 C372 231 368 271 376 307 C385 349 403 378 400 422 C396 465 384 497 376 538 C367 580 372 617 362 665 Z" fill="url(#trunkMetal)"/>
        <path className="trunk-line" d="M357 660 C345 589 360 526 348 468 C338 417 350 361 359 312 C366 275 361 235 360 193"/>
        <path className="branch branch-left" d="M348 331 C309 306 265 289 211 279 C185 275 161 277 136 287"/>
        <path className="branch branch-left" d="M339 402 C291 382 250 370 197 369 C168 369 145 375 116 389"/>
        <path className="branch branch-left" d="M342 477 C302 466 271 468 238 482 C219 490 204 503 183 518"/>
        <path className="branch branch-left" d="M350 546 C324 551 295 563 268 586"/>
        <path className="branch branch-right" d="M374 331 C413 306 457 289 511 279 C537 275 561 277 586 287"/>
        <path className="branch branch-right" d="M383 402 C431 382 472 370 525 369 C554 369 577 375 606 389"/>
        <path className="branch branch-right" d="M380 477 C420 466 451 468 484 482 C503 490 518 503 539 518"/>
        <path className="branch branch-right" d="M372 546 C398 551 427 563 454 586"/>
        <path className="branch twig" d="M259 291 C233 263 210 245 176 231"/><path className="branch twig" d="M463 291 C489 263 512 245 546 231"/>
        <path className="branch twig" d="M292 375 C263 347 236 332 208 319"/><path className="branch twig" d="M430 375 C459 347 486 332 514 319"/>
        <path className="branch twig" d="M242 482 C220 463 199 449 173 441"/><path className="branch twig" d="M480 482 C502 463 523 449 549 441"/>
        {[ [175,231],[208,319],[173,441],[136,287],[116,389],[183,518],[268,586],[547,231],[514,319],[549,441],[586,287],[606,389],[539,518],[454,586] ].map(([x,y],i)=><path key={i} className="leaf-detail" d={`M${x} ${y} q ${i%2?10:-10} -14 ${i%2?20:-20} 0 q ${i%2?-10:10} 14 ${i%2?-20:20} 0z`}/>) }
      </g>

      <g className="compass-base">
        <circle cx="360" cy="704" r="116" className="compass-outer"/>
        <circle cx="360" cy="704" r="94" className="compass-mid"/>
        <circle cx="360" cy="704" r="70" className="compass-inner"/>
        {Array.from({length:48}).map((_,i)=>{const a=(i*7.5-90)*Math.PI/180;const r1=i%6===0?79:84;const r2=91;return <line key={i} x1={360+Math.cos(a)*r1} y1={704+Math.sin(a)*r1} x2={360+Math.cos(a)*r2} y2={704+Math.sin(a)*r2} className={i%6===0?"compass-major-tick":"compass-minor-tick"}/>})}
        <path d="M360 604 L381 685 L360 672 L339 685 Z" className="needle-gold"/>
        <path d="M360 804 L339 723 L360 736 L381 723 Z" className="needle-dark"/>
        <path d="M260 704 L341 683 L328 704 L341 725 Z M460 704 L379 725 L392 704 L379 683 Z" className="needle-side"/>
        <circle cx="360" cy="704" r="18" className="compass-heart"/>
        <circle cx="360" cy="704" r="4" className="compass-pin"/>
        <text x="360" y="621" textAnchor="middle" className="direction-letter">N</text><text x="445" y="710" textAnchor="middle" className="direction-letter">E</text><text x="360" y="792" textAnchor="middle" className="direction-letter">S</text><text x="275" y="710" textAnchor="middle" className="direction-letter">W</text>
      </g>

      <g className="roots-art">
        <path d="M356 691 C311 718 290 752 251 777 C218 798 189 804 157 817"/><path d="M359 692 C324 730 322 770 293 807 C275 830 252 843 227 852"/>
        <path d="M364 691 C409 718 430 752 469 777 C502 798 531 804 563 817"/><path d="M361 692 C396 730 398 770 427 807 C445 830 468 843 493 852"/>
        <path d="M359 697 C347 737 348 781 338 839"/><path d="M362 697 C374 737 373 781 383 839"/>
      </g>

      {trees.map((t)=>{ const pos=treePositions[t.id]; const active=selected.id===t.id; return <g key={t.id} className={`path-sigil ${active?"selected":""}`} onClick={()=>onSelect(t)} role="button" tabIndex={0}>
        <circle cx={pos.x} cy={pos.y} r={active?31:27} className="sigil-aura" fill={active?t.accent:"transparent"}/>
        <circle cx={pos.x} cy={pos.y} r="19" className="sigil-ring" style={{stroke:active?t.accent:undefined}}/>
        <text x={pos.x} y={pos.y+4} textAnchor="middle" className="sigil-mark" style={{fill:active?t.accent:undefined}}>{pos.mark}</text>
        <text x={pos.x+(pos.side==="left"?-31:31)} y={pos.y-4} textAnchor={pos.side==="left"?"end":"start"} className="sigil-name">{t.name}</text>
        <text x={pos.x+(pos.side==="left"?-31:31)} y={pos.y+10} textAnchor={pos.side==="left"?"end":"start"} className="sigil-progress">LVL {t.level} • {t.progress}%</text>
      </g>})}
    </svg>
    <div className="tree-legend"><span><i className="legend-open"/>OPEN</span><span><i className="legend-proven"/>PROVEN</span><span><i className="legend-sealed"/>SEALED</span></div>
  </div>
}

function CompassSeal({completed}:{completed:number}){
  return <div className="daily-compass" aria-label="Daily compass">
    <svg viewBox="0 0 320 320" role="img">
      <defs>
        <radialGradient id="dialGlow"><stop offset="0" stopColor="#C99742" stopOpacity=".17"/><stop offset="1" stopColor="#C99742" stopOpacity="0"/></radialGradient>
      </defs>
      <circle cx="160" cy="160" r="142" className="dial-aura" fill="url(#dialGlow)"/>
      <circle cx="160" cy="160" r="126" className="dial-ring"/>
      <circle cx="160" cy="160" r="106" className="dial-ring dial-ring-inner"/>
      {Array.from({length:32}).map((_,i)=>{
        const a=(i*11.25-90)*Math.PI/180; const r1=i%4===0?91:96; const r2=103;
        return <line key={i} x1={160+Math.cos(a)*r1} y1={160+Math.sin(a)*r1} x2={160+Math.cos(a)*r2} y2={160+Math.sin(a)*r2} className={i%4===0?"major-tick":"minor-tick"}/>;
      })}
      <path d="M160 49 L178 141 L160 127 L142 141 Z" className="north-needle"/>
      <path d="M160 271 L142 179 L160 193 L178 179 Z" className="south-needle"/>
      <path d="M49 160 L141 142 L127 160 L141 178 Z" className="side-needle"/>
      <path d="M271 160 L179 178 L193 160 L179 142 Z" className="side-needle"/>
      <circle cx="160" cy="160" r="15" className="dial-center"/>
      <circle cx="160" cy="160" r="4" className="dial-pin"/>
    </svg>
    <div className="compass-letter n">N</div><div className="compass-letter e">E</div><div className="compass-letter s">S</div><div className="compass-letter w">W</div>
    <div className="sun-mark" aria-hidden>☀</div><div className="moon-mark" aria-hidden>☾</div>
    <div className="compass-center-copy"><small>TODAY</small><strong>{completed}/6</strong><span>PROVEN</span></div>
  </div>
}


function QuestTrial({quest,onClose,onProve,initialNote}:{quest:Quest;onClose:()=>void;onProve:(note:string)=>void;initialNote:string}){
  const [started,setStarted]=useState(false);
  const [note,setNote]=useState(initialNote);
  const [minutes,setMinutes]=useState(30);
  const [elapsed,setElapsed]=useState(0);

  useEffect(()=>{
    if(!started) return;
    const id=window.setInterval(()=>setElapsed(v=>v+1),1000);
    return ()=>window.clearInterval(id);
  },[started]);

  const clock=`${String(Math.floor(elapsed/60)).padStart(2,"0")}:${String(elapsed%60).padStart(2,"0")}`;
  return <div className="trial-shell" role="dialog" aria-modal="true" aria-label={`Quest: ${quest.title}`}>
    <div className="trial-stars"/>
    <header className="trial-header">
      <button onClick={onClose} className="trial-back"><ChevronLeft size={16}/> RETURN</button>
      <div className="trial-path"><small>{quest.tree}</small><span>•</span><b>{quest.boss?"BOSS":"QUEST"}</b></div>
      <button onClick={onClose} className="trial-close" aria-label="Close quest"><X size={17}/></button>
    </header>

    <section className="trial-body">
      <div className="trial-sigil">{quest.boss?"◈":"◇"}</div>
      <div className="trial-kicker">{quest.boss?"TODAY’S NORTH":"ACTIVE TRIAL"}</div>
      <h1>{quest.title}</h1>
      <p className="trial-thesis">Time is only a constraint. Proof is the objective.</p>

      <div className="proof-panel">
        <small>PROOF REQUIRED</small>
        <p>{quest.proof}</p>
      </div>

      <div className="trial-controls">
        <div className="par-time">
          <div><Clock3 size={14}/><span>PAR TIME</span></div>
          <strong>{minutes} MIN</strong>
          <div className="par-buttons"><button onClick={()=>setMinutes(v=>Math.max(5,v-5))}>−</button><button onClick={()=>setMinutes(v=>v+5)}>+</button></div>
        </div>
        <div className={`trial-clock ${started?"running":""}`}><small>{started?"ELAPSED":"READY"}</small><strong>{started?clock:"00:00"}</strong></div>
      </div>

      {!started ? <button className="start-trial" onClick={()=>setStarted(true)}>START TRIAL <span>→</span></button> : <>
        <div className="proof-entry">
          <label>WHAT DID YOU PROVE?</label>
          <textarea value={note} onChange={e=>setNote(e.target.value)} placeholder="Record the result, evidence, link, number, observation, or short reflection that proves the quest was completed…"/>
        </div>
        <button className="prove-trial" onClick={()=>onProve(note)}>PROVE QUEST <span>+{quest.xp} XP</span></button>
      </>}

      <div className="trial-footer"><span>☀ ACT</span><i/><span>PROVE</span><i/><span>☾ REFLECT</span></div>
    </section>
  </div>
}

export default function Home(){
  const [tab,setTab]=useState<"command"|"compass"|"archive"|"build">("command");
  const [quests,setQuests]=useState<Quest[]>(starterQuests);
  const [selected,setSelected]=useState<Tree>(trees[0]);
  const [xp,setXp]=useState(1840);
  const [streak,setStreak]=useState(6);
  const [energy,setEnergy]=useState<Energy>("STEADY");
  const [saveText,setSaveText]=useState("");
  const [saveResistance,setSaveResistance]=useState("");
  const [saveNext,setSaveNext]=useState("");
  const [archiveEntries,setArchiveEntries]=useState<ArchiveEntry[]>([]);
  const [activeQuestId,setActiveQuestId]=useState<string|null>(null);
  const [proofNotes,setProofNotes]=useState<Record<string,string>>({});
  const [ceremony,setCeremony]=useState<CompletionCeremony>(null);

  useEffect(()=>{
    const raw=localStorage.getItem("becomr-v01");
    if(raw){ try { const d=JSON.parse(raw); setQuests(d.quests||starterQuests); setXp(d.xp||1840); setStreak(d.streak||6); setEnergy(d.energy||"STEADY"); setSaveText(d.saveText||""); setSaveResistance(d.saveResistance||""); setSaveNext(d.saveNext||""); setArchiveEntries(d.archiveEntries||[]); setProofNotes(d.proofNotes||{}); } catch{} }
  },[]);
  useEffect(()=>{ localStorage.setItem("becomr-v01",JSON.stringify({quests,xp,streak,energy,saveText,saveResistance,saveNext,archiveEntries,proofNotes})); },[quests,xp,streak,energy,saveText,saveResistance,saveNext,archiveEntries,proofNotes]);

  const done=quests.filter(q=>q.done).length;
  const boss=quests.find(q=>q.boss)!;
  const bossDone=!!boss.done;
  const coreDone=["dev","global","body"].every(id=>quests.find(q=>q.id===id)?.done);
  const sideDone=quests.filter(q=>["music","truth"].includes(q.id)&&q.done).length;
  const rank=bossDone && coreDone && sideDone>=2 ? "GOLD" : bossDone && coreDone ? "SILVER" : bossDone ? "BRONZE" : "UNPROVEN";
  const level=Math.floor(xp/500)+1;
  const levelPct=(xp%500)/5;
  const dateLabel=useMemo(()=>new Intl.DateTimeFormat(undefined,{weekday:"long",month:"long",day:"numeric"}).format(new Date()).toUpperCase(),[]);
  const provenQuests=quests.filter(q=>q.done);
  const provenCapabilities=provenQuests.map(q=>({title:q.title,path:q.tree,note:proofNotes[q.id]||q.proof,xp:q.xp}));
  const strongestPaths=[...trees].sort((a,b)=>b.progress-a.progress).slice(0,3);
  const marks=[
    {symbol:"✦",title:"FIRST PROOF",earned:provenQuests.length>=1,detail:"Prove your first real-world quest."},
    {symbol:"☀",title:"MOMENTUM VII",earned:streak>=7,detail:"Carry meaningful momentum for seven days."},
    {symbol:"❧",title:"FIVE PROOFS",earned:provenQuests.length>=5,detail:"Collect five pieces of demonstrated capability."},
    {symbol:"◈",title:"BOSS PROVEN",earned:bossDone,detail:"Defeat Today’s North."}
  ];

  function toggle(id:string){
    setQuests(qs=>qs.map(q=>{
      if(q.id!==id) return q;
      const next=!q.done;
      setXp(x=>Math.max(0,x+(next?q.xp:-q.xp)));
      return {...q,done:next};
    }));
  }

  function proveQuest(id:string,note:string){
    const quest=quests.find(q=>q.id===id);
    if(!quest) return;
    const nextXp=quest.done ? xp : xp+quest.xp;
    const levelUp=Math.floor(nextXp/500)>Math.floor(xp/500);
    if(!quest.done){
      setQuests(qs=>qs.map(q=>q.id===id?{...q,done:true}:q));
      setXp(nextXp);
    }
    setProofNotes(notes=>({...notes,[id]:note.trim()}));
    setActiveQuestId(null);
    setCeremony({title:quest.title,tree:quest.tree,xp:quest.xp,boss:!!quest.boss,levelUp});
    window.setTimeout(()=>setCeremony(null),2800);
  }

  function saveArchive(){
    if(!saveText.trim() && !saveResistance.trim() && !saveNext.trim()) return;
    const entry:ArchiveEntry={
      id:`save-${Date.now()}`,
      date:new Intl.DateTimeFormat(undefined,{month:"short",day:"numeric",year:"numeric"}).format(new Date()),
      title: provenQuests.length ? `${provenQuests.length} PROOF${provenQuests.length===1?"":"S"} RECORDED` : "DAILY SAVE",
      path: provenQuests.length ? provenQuests.map(q=>q.tree).filter((v,i,a)=>a.indexOf(v)===i).slice(0,3).join(" • ") : "REFLECTION",
      note:saveText.trim(),
      resistance:saveResistance.trim(),
      next:saveNext.trim(),
      xp:provenQuests.reduce((sum,q)=>sum+q.xp,0)
    };
    setArchiveEntries(entries=>[entry,...entries].slice(0,60));
    setSaveText(""); setSaveResistance(""); setSaveNext("");
  }

  const activeQuest=activeQuestId ? quests.find(q=>q.id===activeQuestId) : undefined;

  return <main className="app-shell">
    <div className="grain"/><div className="topographic"/>
    <header className="topbar">
      <button className="brand-lockup" onClick={()=>setTab("command")} aria-label="Open command">
        <span className="brand-star">✦</span><div><div className="wordmark">BECOMR</div><div className="tagline">BECOME CAPABLE</div></div>
      </button>
      <div className="momentum"><span>☀</span><div><small>MOMENTUM</small><strong>{streak}</strong></div></div>
    </header>

    {tab==="command" && <section className="screen command-screen page-enter">
      <div className="command-intro">
        <div className="command-meta"><span>{dateLabel}</span><i/><span>LVL {level}</span><i/><span>{xp.toLocaleString()} XP</span></div>
        <h1>Where should the<br/><em>compass point?</em></h1>
        <p>Your day is not measured by how long you stay busy. It is measured by what you can prove when the day is over.</p>
      </div>

      <div className="orientation-grid">
        <CompassSeal completed={done}/>
        <div className="capacity-panel">
          <div className="ornament-title"><span>☀</span><b>CAPACITY</b><span>☾</span></div>
          <p>Set the weight of today. Your path stays the same; only the size of the next move changes.</p>
          <div className="energy-control">
            {(["LOW","STEADY","HIGH"] as Energy[]).map(v=><button key={v} className={energy===v?"active":""} onClick={()=>setEnergy(v)}><span>{v==="LOW"?"◔":v==="STEADY"?"◑":"●"}</span>{v}</button>)}
          </div>
          <div className="rank-insignia"><small>DAY MARK</small><strong>{rank}</strong><span>{rank==="UNPROVEN"?"Prove Today’s North to earn Bronze.":"Your day has been marked."}</span></div>
        </div>
      </div>

      <div className="north-rule"><span>✦</span><b>TODAY&apos;S NORTH</b><span>✦</span></div>
      <div className={`north-objective ${bossDone?"proven":""}`}>
        <div className="north-index"><span>N</span><b>01</b></div>
        <div className="north-copy">
          <div className="quest-kicker"><span>◈ BOSS QUEST</span><b>+{boss.xp} XP</b></div>
          <h2>{boss.title}</h2>
          <div className="proof-line"><small>PROOF REQUIRED</small><p>{boss.proof}</p></div>
          <button className="prove-button" onClick={()=>bossDone?toggle(boss.id):setActiveQuestId(boss.id)}>{bossDone?"PROVEN — REOPEN":"BEGIN TODAY’S NORTH"}<span>→</span></button>
        </div>
      </div>

      <div className="path-heading"><div><span>ACTIVE PATHS</span><small>{quests.filter(q=>!q.boss&&q.done).length}/{quests.length-1} PROVEN</small></div><div className="path-line"/></div>
      <div className="open-quests">
        {quests.filter(q=>!q.boss).map((q,i)=><button key={q.id} className={`open-quest ${q.done?"proven":""}`} onClick={()=>q.done?toggle(q.id):setActiveQuestId(q.id)}>
          <span className="quest-number">0{i+2}</span>
          <span className="quest-glyph">{q.done?"✦":"◇"}</span>
          <span className="open-quest-copy"><small>{q.tree}</small><strong>{q.title}</strong><em>{q.proof}</em></span>
          <span className="quest-xp">+{q.xp}<small>XP</small></span>
        </button>)}
      </div>

      <div className={`leisure-gate ${bossDone?"open":""}`}>
        <div className="celestial-line"><span>☀</span><i/><b>{bossDone?"LEISURE OPEN":"LEISURE SEALED"}</b><i/><span>☾</span></div>
        <p>{bossDone?"You moved your life forward first. Rest without bargaining with yourself.":"Prove Today’s North. Then the rest of the day belongs to you."}</p>
      </div>

      <div className="xp-engraving"><span>LVL {level}</span><div><i style={{width:`${levelPct}%`}}/></div><span>{500-(xp%500)} XP TO {level+1}</span></div>
    </section>}

    {tab==="compass" && <section className="screen tree-screen page-enter">
      <div className="eyebrow">YOUR CHARACTER IS THE MAP</div>
      <div className="compass-title-row"><div><h1 className="tree-title">The Compass Tree</h1><p className="tree-intro">Direction becomes growth. Your strongest paths physically shape the tree you are becoming.</p></div><div className="tree-level-stamp"><span>{level}</span><small>BECOMR LVL</small></div></div>
      <CompassTree selected={selected} onSelect={setSelected}/>
      <div key={selected.id} className="path-inspector inspector-enter" style={{"--accent":selected.accent} as any}>
        <div className="inspector-head"><div><small>SELECTED PATH</small><h2>{selected.name}</h2><p>LVL {selected.level} • {selected.progress}% GROWN</p></div><div className="growth-ring" style={{"--growth":`${selected.progress*3.6}deg`} as any}><span>{selected.progress}%</span></div></div>
        <div className="inspector-line"/>
        <div className="path-nodes">{selected.nodes.map((n,i)=><div className={`path-node ${n.status} ${n.boss?"boss":""}`} key={n.title}><div className="path-node-marker">{n.status==="locked"?<LockKeyhole size={13}/>:n.boss?<Crown size={14}/>:<span>{i+1}</span>}</div><div><small>{n.status==="done"?"PROVEN":n.status==="current"?"OPEN":"SEALED"}{n.boss?" • BOSS":""}</small><strong>{n.title}</strong><p>{n.subtitle}</p></div></div>)}</div>
      </div>
    </section>}

    {tab==="archive" && <section className="screen archive-screen page-enter">
      <div className="moon-header"><span>☾</span><small>THE ARCHIVE</small></div>
      <div className="archive-hero">
        <h1 className="tree-title">Remember what<br/><em>changed you.</em></h1>
        <p className="tree-intro">The Archive is not a task log. It is evidence of the person you are becoming—what opened, what resisted you, and where the Compass points next.</p>
      </div>

      <div className="archive-summary">
        <div><small>PROOFS</small><strong>{provenQuests.length}</strong></div>
        <div><small>SAVES</small><strong>{archiveEntries.length}</strong></div>
        <div><small>XP PROVEN</small><strong>{provenQuests.reduce((sum,q)=>sum+q.xp,0)}</strong></div>
      </div>

      <div className="save-chapter">
        <div className="chapter-heading"><span>☾</span><div><small>NIGHTLY RITUAL</small><strong>SAVE THE DAY</strong></div><i/></div>
        <label>WHAT BECAME EASIER TODAY?</label>
        <textarea value={saveText} onChange={e=>setSaveText(e.target.value)} placeholder="Name the capability, realization, or movement you can feel becoming more natural…"/>
        <label>WHAT RESISTED YOU?</label>
        <textarea value={saveResistance} onChange={e=>setSaveResistance(e.target.value)} placeholder="Where did you stall, avoid, misunderstand, or lose momentum?"/>
        <label>WHERE SHOULD THE COMPASS POINT NEXT?</label>
        <textarea value={saveNext} onChange={e=>setSaveNext(e.target.value)} placeholder="Write the next obvious challenge, not an entire new plan…"/>
        <button className="archive-save-button" onClick={saveArchive}>INSCRIBE SAVE <span>☾</span></button>
      </div>

      <div className="archive-divider"><span>RECENT INSCRIPTIONS</span><i/></div>
      <div className="archive-timeline">
        {archiveEntries.length===0 && <div className="empty-inscription"><span>✦</span><p>Your first Save will appear here. Over time, this becomes a biography written in proof rather than memory.</p></div>}
        {archiveEntries.map((entry,i)=><article className="archive-entry" key={entry.id}>
          <div className="timeline-mark"><span>{i===0?"☾":"✦"}</span><i/></div>
          <div className="entry-copy">
            <div className="entry-meta"><span>{entry.date.toUpperCase()}</span><b>{entry.path}</b>{entry.xp>0&&<em>+{entry.xp} XP</em>}</div>
            <h3>{entry.title}</h3>
            {entry.note&&<p><small>BECAME EASIER</small>{entry.note}</p>}
            {entry.resistance&&<p><small>RESISTED</small>{entry.resistance}</p>}
            {entry.next&&<p className="entry-next"><small>NEXT BEARING</small>{entry.next}</p>}
          </div>
        </article>)}
      </div>

      <div className="archive-divider"><span>PROVEN CAPABILITIES</span><i/></div>
      <div className="capability-ledger">
        {provenCapabilities.length===0 ? <p className="ledger-empty">Prove a quest and its evidence will be entered into this ledger.</p> :
          provenCapabilities.map((cap,i)=><div className="ledger-line" key={`${cap.title}-${i}`}><span>0{i+1}</span><div><small>{cap.path}</small><strong>{cap.title}</strong><p>{cap.note}</p></div><b>PROVEN</b></div>)}
      </div>
    </section>}

    {tab==="build" && <section className="screen build-screen page-enter">
      <div className="eyebrow">WHO YOU ARE BECOMING</div>
      <div className="build-hero">
        <div><h1 className="tree-title">Your Build</h1><p className="tree-intro">Your character sheet is not an avatar. It is the visible shape of what you can actually do.</p></div>
        <div className="build-level-medallion"><span>{level}</span><small>BECOMR</small></div>
      </div>

      <div className="identity-seal">
        <svg viewBox="0 0 220 220" aria-label="Personal Compass Tree seal">
          <circle cx="110" cy="110" r="95" className="identity-ring"/>
          <circle cx="110" cy="110" r="79" className="identity-ring inner"/>
          {Array.from({length:24}).map((_,i)=>{const a=(i*15-90)*Math.PI/180;return <line key={i} x1={110+Math.cos(a)*69} y1={110+Math.sin(a)*69} x2={110+Math.cos(a)*(i%3===0?77:73)} y2={110+Math.sin(a)*(i%3===0?77:73)} className="identity-tick"/>})}
          <path d="M110 113 C104 94,102 77,110 61 C116 48,128 42,139 35 M111 79 C92 69,82 54,76 40 M111 88 C131 78,146 65,154 49 M109 98 C88 92,68 83,58 68" className="identity-tree"/>
          <path d="M110 113 C101 129,88 141,74 151 M110 113 C119 130,133 141,148 151 M110 115 C107 137,106 153,110 172" className="identity-root"/>
          <path d="M110 22 L116 103 L110 96 L104 103 Z" className="identity-needle"/>
          <circle cx="110" cy="110" r="6" className="identity-pin"/>
          <text x="40" y="65" className="identity-sun">☀</text><text x="168" y="65" className="identity-moon">☾</text>
        </svg>
        <div className="identity-copy"><small>CURRENT DOCTRINE</small><h2>Capability over activity.</h2><p>You are not collecting checked boxes. You are expanding the range of situations you can meet with competence.</p></div>
      </div>

      <div className="build-stats refined"><div><small>TOTAL XP</small><strong>{xp}</strong></div><div><small>MOMENTUM</small><strong>{streak}</strong></div><div><small>PROVEN</small><strong>{provenQuests.length}</strong></div><div><small>PATHS</small><strong>{trees.length}</strong></div></div>

      <div className="build-section-heading"><span>STRONGEST LIMBS</span><i/></div>
      <div className="path-strengths">
        {strongestPaths.map((path,i)=><div className="strength-line" key={path.id} style={{"--accent":path.accent} as any}><span>0{i+1}</span><div><small>{path.name}</small><div className="strength-track"><i style={{width:`${path.progress}%`}}/></div></div><b>{path.progress}%</b></div>)}
      </div>

      <div className="build-section-heading"><span>CAPABILITIES</span><i/></div>
      <div className="build-capabilities">
        {provenCapabilities.length===0?<p>No capability has been Proven yet. Your first completed Trial will appear here.</p>:
          provenCapabilities.slice(0,6).map((cap,i)=><div key={`${cap.title}-${i}`}><span>✦</span><div><small>{cap.path}</small><strong>{cap.title}</strong></div></div>)}
      </div>

      <div className="build-section-heading"><span>MARKS</span><i/></div>
      <div className="marks-grid">
        {marks.map(mark=><div key={mark.title} className={`mark ${mark.earned?"earned":"sealed"}`}><span>{mark.symbol}</span><div><small>{mark.earned?"INSCRIBED":"SEALED"}</small><strong>{mark.title}</strong><p>{mark.detail}</p></div></div>)}
      </div>

      <div className="build-creed"><span>✦</span><p>Direction becomes growth. Proof becomes identity. Your Compass Tree is the record.</p><span>✦</span></div>
    </section>}

    {activeQuest && <QuestTrial quest={activeQuest} initialNote={proofNotes[activeQuest.id]||""} onClose={()=>setActiveQuestId(null)} onProve={(note)=>proveQuest(activeQuest.id,note)}/>}

    {ceremony && <div className={`completion-ceremony ${ceremony.boss?"boss":""}`} role="status" aria-live="polite">
      <div className="ceremony-sky"><span className="ceremony-sun">☀</span><span className="ceremony-moon">☾</span></div>
      <div className="ceremony-compass"><i/><b>✦</b><i/></div>
      <small>{ceremony.boss?"TODAY’S NORTH PROVEN":"PROOF ACCEPTED"}</small>
      <h2>{ceremony.title}</h2>
      <p>{ceremony.tree} • +{ceremony.xp} XP</p>
      {ceremony.levelUp && <strong>LEVEL ASCENDED</strong>}
      <div className="ceremony-line"/>
      <em>A new mark has been added to your path.</em>
    </div>}

    <nav className="instrument-nav" aria-label="Primary">
      <button onClick={()=>setTab("command")} className={tab==="command"?"active":""}><span>☀</span><b>COMMAND</b></button>
      <button onClick={()=>setTab("compass")} className={tab==="compass"?"active":""}><span>✥</span><b>COMPASS</b></button>
      <button onClick={()=>setTab("archive")} className={tab==="archive"?"active":""}><span>☾</span><b>ARCHIVE</b></button>
      <button onClick={()=>setTab("build")} className={tab==="build"?"active":""}><span>◉</span><b>BUILD</b></button>
    </nav>
  </main>
}
