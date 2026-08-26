"use client";

import { useEffect, useMemo, useState } from "react";
import { Activity, BookOpen, Brain, BriefcaseBusiness, ChevronRight, Code2, Crown, Dumbbell, Flame, Globe2, LockKeyhole, Music2, Palette, RotateCcw, Sparkles, Trophy, Zap } from "lucide-react";

type Quest = { id:string; title:string; tree:string; xp:number; boss?:boolean; done?:boolean };
type Node = { title:string; subtitle:string; status:"done"|"current"|"locked"; boss?:boolean };
type Tree = { id:string; name:string; icon:string; level:number; progress:number; accent:string; nodes:Node[] };

const starterQuests: Quest[] = [
  { id:"boss", title:"Ship one meaningful BECOMR improvement", tree:"DEVELOPER", xp:100, boss:true },
  { id:"dev", title:"Build or debug one working feature", tree:"DEVELOPER", xp:40 },
  { id:"global", title:"Produce 10 original Spanish sentences", tree:"GLOBAL", xp:35 },
  { id:"body", title:"Accumulate 25 strict pull-ups", tree:"ATHLETE", xp:35 },
  { id:"music", title:"Land 5 clean phrase-aware transitions", tree:"MUSIC", xp:30 },
  { id:"truth", title:"Read Mark 1–3 and log claims about Jesus", tree:"TRUTH", xp:30 }
];

const trees: Tree[] = [
  {id:"dev",name:"DEVELOPER",icon:"code",level:3,progress:58,accent:"#37D7FF",nodes:[
    {title:"Web Builder",subtitle:"Responsive foundations",status:"done"},
    {title:"Interactive Apps",subtitle:"JavaScript + APIs",status:"done"},
    {title:"Front-End Engineer",subtitle:"React + TypeScript",status:"current"},
    {title:"Full-Stack",subtitle:"Auth + DB + persistence",status:"locked"},
    {title:"Production Engineer",subtitle:"Testing + cloud + security",status:"locked",boss:true},
    {title:"AI Product Builder",subtitle:"Intelligent real-world systems",status:"locked"}
  ]},
  {id:"music",name:"MUSICIAN",icon:"music",level:1,progress:24,accent:"#FFB020",nodes:[
    {title:"Rhythm",subtitle:"BPM, bars, phrases",status:"current"},
    {title:"DJ Foundations",subtitle:"Cue, EQ, transitions",status:"locked"},
    {title:"Mixer",subtitle:"Beatmatch + phrasing",status:"locked"},
    {title:"Pianist",subtitle:"Harmony + performance",status:"locked"},
    {title:"Producer",subtitle:"Build complete songs",status:"locked",boss:true},
    {title:"Live Performer",subtitle:"Perform your own identity",status:"locked"}
  ]},
  {id:"creative",name:"CREATIVE DIRECTION",icon:"palette",level:1,progress:18,accent:"#B97AFF",nodes:[
    {title:"Visual Literacy",subtitle:"Composition + hierarchy",status:"current"},
    {title:"Graphic Design",subtitle:"Typography + systems",status:"locked"},
    {title:"Photography",subtitle:"Light + framing",status:"locked"},
    {title:"Videography",subtitle:"Motion + edit + sound",status:"locked"},
    {title:"Campaign Director",subtitle:"Story through launch",status:"locked",boss:true}
  ]},
  {id:"creator",name:"CREATOR",icon:"spark",level:2,progress:38,accent:"#FF6E91",nodes:[
    {title:"Idea Practice",subtitle:"Capture + sketch",status:"done"},
    {title:"Construction",subtitle:"Sewing fundamentals",status:"current"},
    {title:"Patternmaking",subtitle:"Build from zero",status:"locked"},
    {title:"Original Garment",subtitle:"Concept → object",status:"locked",boss:true},
    {title:"Collection",subtitle:"Cohesive body of work",status:"locked"}
  ]},
  {id:"global",name:"GLOBAL COMMUNICATOR",icon:"globe",level:1,progress:22,accent:"#43E3A1",nodes:[
    {title:"Spanish A1",subtitle:"Everyday foundations",status:"current"},
    {title:"Spanish A2",subtitle:"Simple independence",status:"locked"},
    {title:"Spanish B1",subtitle:"Sustained conversation",status:"locked",boss:true},
    {title:"Japanese Kana",subtitle:"Hiragana + Katakana",status:"current"},
    {title:"Japanese Conversation",subtitle:"Independent basics",status:"locked"}
  ]},
  {id:"biz",name:"ENTREPRENEUR",icon:"biz",level:1,progress:31,accent:"#FFD84A",nodes:[
    {title:"Money",subtitle:"Margin + cash flow",status:"current"},
    {title:"Customer",subtitle:"Problems + research",status:"locked"},
    {title:"Brand",subtitle:"Positioning + story",status:"locked"},
    {title:"Sales",subtitle:"Offer + conversion",status:"locked"},
    {title:"Operator",subtitle:"Systems + delegation",status:"locked",boss:true}
  ]},
  {id:"body",name:"ATHLETE",icon:"body",level:1,progress:46,accent:"#FF7247",nodes:[
    {title:"Foundation",subtitle:"Push, pull, core, squat",status:"current"},
    {title:"Control",subtitle:"Form + volume",status:"locked"},
    {title:"L-Sit",subtitle:"Compression strength",status:"locked"},
    {title:"Handstand",subtitle:"Balance + control",status:"locked"},
    {title:"Muscle-Up",subtitle:"Explosive mastery",status:"locked",boss:true}
  ]},
  {id:"truth",name:"TRUTH SEEKER",icon:"truth",level:1,progress:15,accent:"#F1E8CF",nodes:[
    {title:"Biblical Literacy",subtitle:"Story, structure, context",status:"current"},
    {title:"New Testament",subtitle:"Read + interrogate claims",status:"locked"},
    {title:"Qur'anic Literacy",subtitle:"Read on its own terms",status:"locked"},
    {title:"Jesus File",subtitle:"Bible ↔ Qur'an comparison",status:"locked"},
    {title:"Historical Case",subtitle:"Crucifixion + resurrection",status:"locked",boss:true},
    {title:"Final Inquiry",subtitle:"Who is Jesus?",status:"locked"}
  ]}
];

const icons:any = {
  code:<Code2/>, music:<Music2/>, palette:<Palette/>, spark:<Sparkles/>,
  globe:<Globe2/>, biz:<BriefcaseBusiness/>, body:<Dumbbell/>, truth:<BookOpen/>
};

export default function Home(){
  const [tab,setTab]=useState<"today"|"trees"|"profile">("today");
  const [quests,setQuests]=useState<Quest[]>(starterQuests);
  const [selected,setSelected]=useState<Tree>(trees[0]);
  const [xp,setXp]=useState(1840);
  const [streak,setStreak]=useState(6);

  useEffect(()=>{
    const raw=localStorage.getItem("becomr-v01");
    if(raw){ try { const d=JSON.parse(raw); setQuests(d.quests||starterQuests); setXp(d.xp||1840); setStreak(d.streak||6); } catch{} }
  },[]);
  useEffect(()=>{ localStorage.setItem("becomr-v01",JSON.stringify({quests,xp,streak})); },[quests,xp,streak]);

  const done=quests.filter(q=>q.done).length;
  const bossDone=!!quests.find(q=>q.boss)?.done;
  const coreDone=["dev","global","body"].every(id=>quests.find(q=>q.id===id)?.done);
  const sideDone=quests.filter(q=>["music","truth"].includes(q.id)&&q.done).length;
  const rank=bossDone && coreDone && sideDone>=2 ? "GOLD" : bossDone && coreDone ? "SILVER" : bossDone ? "BRONZE" : "LOCKED";
  const level=Math.floor(xp/500)+1;
  const levelPct=(xp%500)/5;

  function toggle(id:string){
    setQuests(qs=>qs.map(q=>{
      if(q.id!==id) return q;
      const next=!q.done;
      setXp(x=>Math.max(0,x+(next?q.xp:-q.xp)));
      return {...q,done:next};
    }));
  }
  function reset(){ setQuests(starterQuests); setXp(1840); }

  return <main className="app-shell">
    <div className="grain"/>
    <header className="topbar">
      <div><div className="wordmark">BECOMR<span>.</span></div><div className="tagline">BECOME CAPABLE</div></div>
      <div className="stat-pill"><Flame size={15}/><b>{streak}</b></div>
    </header>

    {tab==="today" && <section className="screen">
      <div className="hero">
        <div className="eyebrow">YOUR CURRENT BUILD</div>
        <h1>Become more<br/><em>capable.</em></h1>
        <p>Progress is not time spent. It is proof that you can do something today you could not do before.</p>
        <div className="level-row">
          <div><span>LVL {level}</span><strong>{xp.toLocaleString()} XP</strong></div>
          <div className="xp-track"><i style={{width:`${levelPct}%`}}/></div>
          <small>{500-(xp%500)} XP TO NEXT LEVEL</small>
        </div>
      </div>

      <div className="section-label"><Crown size={15}/> MAIN QUEST</div>
      {quests.filter(q=>q.boss).map(q=><button key={q.id} className={`boss-card ${q.done?"complete":""}`} onClick={()=>toggle(q.id)}>
        <div className="boss-rune"><Crown/></div>
        <div className="quest-copy"><small>THE ONE THING THAT MOVES YOU FORWARD</small><h2>{q.title}</h2><span>+{q.xp} XP</span></div>
        <div className="check">{q.done?"✓":<ChevronRight/>}</div>
      </button>)}

      <div className="rank-strip">
        {["BRONZE","SILVER","GOLD"].map(r=><div key={r} className={rank===r || (rank==="GOLD"&&r!=="LOCKED") || (rank==="SILVER"&&r==="BRONZE") ? "lit":""}><Trophy size={16}/><span>{r}</span></div>)}
      </div>

      <div className="section-label"><Zap size={15}/> ACTIVE QUESTS <span>{done}/{quests.length}</span></div>
      <div className="quest-list">
        {quests.filter(q=>!q.boss).map(q=><button key={q.id} className={`quest ${q.done?"complete":""}`} onClick={()=>toggle(q.id)}>
          <div className="quest-dot"/>
          <div><small>{q.tree}</small><strong>{q.title}</strong></div>
          <span>+{q.xp}</span>
        </button>)}
      </div>

      <div className={`leisure ${bossDone?"unlocked":""}`}>
        {bossDone?<Sparkles/>:<LockKeyhole/>}
        <div><small>LEISURE STATUS</small><strong>{bossDone?"UNLOCKED":"DEFEAT THE BOSS"}</strong></div>
      </div>

      <button className="reset" onClick={reset}><RotateCcw size={14}/> Reset demo progress</button>
    </section>}

    {tab==="trees" && <section className="screen tree-screen">
      <div className="eyebrow">YOUR CHARACTER IS THE MAP</div>
      <h1 className="tree-title">Skill Forest</h1>
      <p className="tree-intro">Every branch represents a capability. Complete proof-based quests to ink the next part of your path.</p>
      <div className="tree-tabs">
        {trees.map(t=><button key={t.id} onClick={()=>setSelected(t)} className={selected.id===t.id?"active":""} style={{"--accent":t.accent} as any}>
          {icons[t.icon]}<span>{t.name}</span>
        </button>)}
      </div>
      <div className="tree-map" style={{"--accent":selected.accent} as any}>
        <div className="tree-head">
          <div><small>LVL {selected.level}</small><h2>{selected.name}</h2></div>
          <strong>{selected.progress}%</strong>
        </div>
        <div className="branch">
          {selected.nodes.map((n,i)=><div className={`node-row ${n.status}`} key={n.title}>
            <div className="stem"/>
            <div className={`node ${n.boss?"boss-node":""}`}>
              {n.status==="locked"?<LockKeyhole size={17}/>:n.boss?<Crown size={18}/>:<span>{i+1}</span>}
            </div>
            <div className="node-copy"><small>{n.status.toUpperCase()}{n.boss?" • BOSS":""}</small><strong>{n.title}</strong><p>{n.subtitle}</p></div>
          </div>)}
        </div>
      </div>
    </section>}

    {tab==="profile" && <section className="screen">
      <div className="eyebrow">SAVE GAME</div><h1 className="tree-title">Your Build</h1>
      <div className="profile-card"><Brain/><div><small>PHILOSOPHY</small><h2>Capability over activity.</h2><p>BECOMR rewards demonstrated growth, not merely checking a habit box.</p></div></div>
      <div className="profile-grid">
        <div><small>LEVEL</small><strong>{level}</strong></div><div><small>XP</small><strong>{xp}</strong></div><div><small>STREAK</small><strong>{streak}</strong></div><div><small>TREES</small><strong>8</strong></div>
      </div>
      <div className="save-card"><Activity/><div><small>NIGHTLY SAVE</small><h3>What became easier today?</h3><textarea placeholder="Record the capability you advanced, what challenged you, and the obvious next step…"/></div></div>
    </section>}

    <nav className="bottom-nav">
      <button onClick={()=>setTab("today")} className={tab==="today"?"active":""}><Crown/><span>TODAY</span></button>
      <button onClick={()=>setTab("trees")} className={tab==="trees"?"active":""}><Activity/><span>TREES</span></button>
      <button onClick={()=>setTab("profile")} className={tab==="profile"?"active":""}><Brain/><span>BUILD</span></button>
    </nav>
  </main>
}