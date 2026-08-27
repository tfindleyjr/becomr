"use client";

import { useEffect, useMemo, useState } from "react";

type Tab = "command"|"compass"|"archive"|"build";
type Energy = "LOW"|"STEADY"|"HIGH";
type Quest = {
  id:string; path:string; glyph:string; title:string; proof:string;
  xp:number; boss?:boolean; done?:boolean; evidence?:string;
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

const paths = [
  {id:"developer",glyph:"⌘",name:"Developer",level:3,pct:58,tone:"teal",cap:"Build digital products"},
  {id:"musician",glyph:"♫",name:"Musician",level:1,pct:24,tone:"amber",cap:"Perform and create music"},
  {id:"creative",glyph:"◇",name:"Creative Direction",level:1,pct:18,tone:"violet",cap:"Direct visual experiences"},
  {id:"creator",glyph:"✧",name:"Creator",level:2,pct:38,tone:"rose",cap:"Turn ideas into objects"},
  {id:"global",glyph:"↔",name:"Global Communicator",level:1,pct:22,tone:"jade",cap:"Communicate across cultures"},
  {id:"entrepreneur",glyph:"▦",name:"Entrepreneur",level:1,pct:31,tone:"gold",cap:"Turn value into enterprise"},
  {id:"athlete",glyph:"△",name:"Athlete",level:1,pct:46,tone:"terra",cap:"Control and strengthen the body"},
  {id:"truth",glyph:"✦",name:"Truth Seeker",level:1,pct:15,tone:"ivory",cap:"Interrogate belief and evidence"}
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

function BrandMark({small=false}:{small?:boolean}) {
  return <div className={`brand-mark ${small?"small":""}`}>
    <div className="brand-tree">♁</div>
    {!small && <div><strong>BECOMR</strong><span>BECOME CAPABLE</span></div>}
  </div>;
}

function ProgressRing({value}:{value:number}) {
  return <div className="progress-ring" style={{"--p":`${value*3.6}deg`} as React.CSSProperties}>
    <div><strong>{value}%</strong><span>DAY</span></div>
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

      <section className="inscription">
        <span>PROOF REQUIRED</span>
        <p>{q.proof}</p>
      </section>

      <div className="trial-meter">
        <div><span>PAR</span><strong>30 MIN</strong></div>
        <i/>
        <div><span>{started?"ELAPSED":"STATE"}</span><strong>{started?time:"READY"}</strong></div>
      </div>

      {!started ? <button className="ritual-button" onClick={()=>setStarted(true)}>BEGIN TRIAL <b>→</b></button> :
        <>
          <label className="evidence">
            <span>WHAT DID YOU PROVE?</span>
            <textarea value={note} onChange={e=>setNote(e.target.value)} placeholder="Result, number, link, observation, or evidence..."/>
          </label>
          <button className="ritual-button prove" onClick={()=>onProve(note)}>INSCRIBE PROOF <b>+{q.xp} XP</b></button>
        </>
      }
      <div className="ritual-line"><span>☀ ACT</span><i/><span>PROVE</span><i/><span>☾ REFLECT</span></div>
    </div>
  </main>
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
    const raw=localStorage.getItem("becomr-v03");
    if(!raw) return;
    try {
      const d=JSON.parse(raw);
      if(d.quests) setQuests(d.quests);
      if(d.xp) setXp(d.xp);
      if(d.momentum) setMomentum(d.momentum);
      if(d.archives) setArchives(d.archives);
    } catch {}
  },[]);
  useEffect(()=>{
    localStorage.setItem("becomr-v03",JSON.stringify({quests,xp,momentum,archives}));
  },[quests,xp,momentum,archives]);

  const activeQuest=quests.find(q=>q.id===active);
  const done=quests.filter(q=>q.done).length;
  const pct=Math.round(done/quests.length*100);
  const level=Math.floor(xp/500)+1;
  const north=quests.find(q=>q.boss)!;
  const selected=paths.find(p=>p.id===selectedPath)!;
  const strongest=[...paths].sort((a,b)=>b.pct-a.pct).slice(0,3);
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
    setCeremony(q.boss?"TODAY'S NORTH PROVEN":"PROOF INSCRIBED");
    setTimeout(()=>setCeremony(null),2200);
  }

  function saveArchive(){
    if(!easier.trim()&&!resisted.trim()&&!next.trim()) return;
    setArchives(list=>[{
      id:String(Date.now()),date:new Date().toLocaleDateString(undefined,{month:"short",day:"numeric",year:"numeric"}),
      easier:easier.trim(),resisted:resisted.trim(),next:next.trim(),proven:done,xp
    },...list]);
    setEasier("");setResisted("");setNext("");
    setMomentum(m=>m+1);
    setCeremony("DAY INSCRIBED");
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
        <div className="energy">
          <span>AVAILABLE CAPACITY</span>
          <div>{(["LOW","STEADY","HIGH"] as Energy[]).map(e=><button className={energy===e?"active":""} key={e} onClick={()=>setEnergy(e)}>{e}</button>)}</div>
        </div>
      </div>

      <div className="command-grid">
        <section className="north-section">
          <div className="section-rule"><span>01</span><b>TODAY'S NORTH</b><i/></div>
          <div className="north-objective">
            <div className="diamond">{north.done?"✓":"◆"}</div>
            <div>
              <p>{north.path} / BOSS QUEST</p>
              <h2>{north.title}</h2>
              <div className="proof-line"><span>PROOF</span><i/>{north.proof}</div>
            </div>
          </div>
          <button className="ritual-button" onClick={()=>north.done?null:setActive(north.id)} disabled={north.done}>
            {north.done?"NORTH PROVEN":"ENTER TRIAL"} <b>{north.done?"✦":"→"}</b>
          </button>
          <div className="rank-line">
            <span className={north.done?"on":""}>BRONZE</span>
            <i className={done>=4?"on":""}/>
            <span className={done>=4?"on":""}>SILVER</span>
            <i className={done===quests.length?"on":""}/>
            <span className={done===quests.length?"on":""}>GOLD</span>
          </div>
        </section>

        <aside className="daily-oracle">
          <div className="section-rule"><span>02</span><b>DAILY COMPASS</b><i/></div>
          <div className="oracle-emblem">
            <img src="/assets/becomr-compass-tree.png" alt="BECOMR celestial Compass Tree"/>
            <div className="oracle-status"><ProgressRing value={pct}/><div><span>PROVEN TODAY</span><strong>{done} / {quests.length}</strong><small>{energy} CAPACITY</small></div></div>
          </div>
        </aside>
      </div>

      <section className="path-ledger">
        <div className="section-rule"><span>03</span><b>OPEN PATHS</b><i/></div>
        <div className="ledger-head"><span>PATH</span><span>TRIAL</span><span>PROOF</span></div>
        {quests.filter(q=>!q.boss).map((q,i)=>
          <button className={`ledger-row ${q.done?"proven":""}`} key={q.id} onClick={()=>q.done?null:setActive(q.id)}>
            <span className="ledger-path"><b>{q.glyph}</b>{q.path}</span>
            <strong>{q.title}</strong>
            <span className="ledger-action">{q.done?"PROVEN":"OPEN"} <b>{q.done?"✦":"→"}</b></span>
          </button>
        )}
      </section>

      <div className={`leisure-line ${north.done?"open":""}`}>
        <span>{north.done?"☀":"◇"}</span><div><small>LEISURE</small><strong>{north.done?"UNLOCKED — REST WITHOUT GUILT":"SEALED UNTIL TODAY'S NORTH IS PROVEN"}</strong></div>
      </div>
    </section>}

    {tab==="compass" && <section className="page compass-page">
      <div className="compass-title">
        <p className="kicker">COMPASS / YOUR CAPABILITY MAP</p>
        <h1>The tree is your <em>biography.</em></h1>
        <p>Every limb grows according to what you actually prove. Direction below. Growth above.</p>
      </div>
      <div className="world-stage">
        <div className="firmament-label left">☀ ACTION</div>
        <div className="firmament-label right">REFLECTION ☾</div>
        <img className="master-emblem" src="/assets/becomr-compass-tree.png" alt="Tree growing from a celestial compass"/>
        {paths.map((p,i)=>{
          const angle=(-155 + i*(310/(paths.length-1)))*Math.PI/180;
          const x=50+Math.cos(angle)*38, y=52+Math.sin(angle)*35;
          return <button key={p.id} className={`path-star ${selectedPath===p.id?"active":""} tone-${p.tone}`} style={{left:`${x}%`,top:`${y}%`}} onClick={()=>setSelectedPath(p.id)}>
            <span>{p.glyph}</span><small>{p.name}</small>
          </button>
        })}
      </div>
      <section className="path-inspector">
        <div className="inspector-intro"><span className={`big-glyph tone-${selected.tone}`}>{selected.glyph}</span><div><p>PATH / LVL {selected.level}</p><h2>{selected.name}</h2><span>{selected.cap}</span></div><strong>{selected.pct}%</strong></div>
        <div className="branch-line">
          {nodes[selected.id].map((n,i)=>{
            const state=i<selected.level?"proven":i===selected.level?"open":"sealed";
            return <div className={`branch-node ${state}`} key={n}><i>{state==="proven"?"✦":state==="open"?"◇":"·"}</i><strong>{n}</strong><span>{state.toUpperCase()}</span></div>
          })}
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
          </article>)
        }
      </div>
    </section>}

    {tab==="build" && <section className="page build-page">
      <div className="build-hero">
        <div className="identity-seal"><img src="/assets/becomr-compass-tree.png" alt="Your BECOMR identity seal"/></div>
        <div>
          <p className="kicker">BUILD / CURRENT SELF</p>
          <h1>LVL {level}</h1>
          <h2>{done<3?"SEEKER":done<6?"BUILDER":"BECOMR"}</h2>
          <p>{xp.toLocaleString()} XP · ☀ MOMENTUM {momentum}</p>
        </div>
      </div>
      <div className="build-columns">
        <section>
          <div className="section-rule"><span>I</span><b>STRONGEST LIMBS</b><i/></div>
          {strongest.map((p,i)=><div className="limb" key={p.id}><span>0{i+1}</span><div><strong>{p.name}</strong><i><b style={{width:`${p.pct}%`}}/></i></div><em>{p.pct}%</em></div>)}
        </section>
        <section>
          <div className="section-rule"><span>II</span><b>MARKS</b><i/></div>
          <div className="marks">{earnedMarks.map(m=><div key={m.name} className={m.ok?"earned":"sealed"}><b>{m.sigil}</b><span>{m.name}</span><small>{m.ok?"INSCRIBED":"SEALED"}</small></div>)}</div>
        </section>
      </div>
      <section className="capabilities">
        <div className="section-rule"><span>III</span><b>PROVEN CAPABILITIES</b><i/></div>
        {quests.filter(q=>q.done).length===0?<div className="empty-state">Prove your first Trial and it will appear here.</div>:
          quests.filter(q=>q.done).map(q=><div className="capability" key={q.id}><span>✦</span><div><small>{q.path}</small><strong>{q.title}</strong><p>{q.evidence||q.proof}</p></div></div>)
        }
      </section>
    </section>}

    <nav className="instrument-nav">
      {[
        ["command","☀","COMMAND"],["compass","✥","COMPASS"],["archive","☾","ARCHIVE"],["build","◉","BUILD"]
      ].map(([id,g,l])=><button key={id} className={tab===id?"active":""} onClick={()=>setTab(id as Tab)}><b>{g}</b><span>{l}</span></button>)}
    </nav>

    {ceremony && <div className="ceremony"><div>✦</div><p>PROGRESSION RECORDED</p><h2>{ceremony}</h2><span>The Compass has changed.</span></div>}
  </main>
}
