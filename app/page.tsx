"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { seedState } from "@/data/seed";
import type { AppState, Quest, SkillPath, VisualStage } from "@/lib/types";
import { supabase, hasSupabaseConfig } from "@/lib/supabase";
import { signIn, signOut, signUp } from "@/lib/auth";
import {
  loadLocalState, saveLocalState, hydrateStateForUser, saveCloudState,
  type SyncStatus
} from "@/lib/storage";
import {
  currentNodeIndex, pathEarnedXp, pathProgress, visualStageFromProgress,
  weeklyBosses, weeklyScore, generatedWeeklyBoss
} from "@/lib/progression";

type Tab = "command"|"compass"|"weekly"|"archive"|"build";
type Modal = "quest"|"path"|null;
type AuthMode = "signin"|"signup";

function BrandMark(){
  return <div className="brand-mark"><div className="brand-sigil"><span>✥</span></div><div><strong>BECOMR</strong><span>BECOME CAPABLE</span></div></div>;
}

function SyncBadge({status,user}:{status:SyncStatus;user:User|null}){
  const text =
    !user ? "LOCAL" :
    status==="syncing" ? "SYNCING" :
    status==="saved" ? "CLOUD SAVED" :
    status==="offline" ? "OFFLINE" :
    status==="error" ? "SYNC ERROR" : "CLOUD";
  return <div className={`sync-badge sync-${status}`}><i/><span>{text}</span></div>;
}

function StageBar({stage}:{stage:VisualStage}){
  const order:VisualStage[]=["sealed","open","inscribed","ornamented","mastered"];
  return <div className="stagebar">{order.map(s=><i key={s} className={order.indexOf(stage)>=order.indexOf(s)?"on":""}/>)}</div>;
}

function DynamicInsignia({state,selected,onSelect,compact=false}:{state:AppState;selected:string;onSelect?:(id:string)=>void;compact?:boolean}){
  const points:[[number,number],[number,number],[number,number],[number,number],[number,number],[number,number],[number,number],[number,number]] =
    [[122,265],[268,105],[532,105],[678,265],[655,500],[515,640],[285,640],[145,500]];
  return <div className={`sig-wrap ${compact?"compact":""}`}>
    <img className="future-form" src="/assets/becomr-compass-tree.png" alt="" aria-hidden/>
    <svg viewBox="0 0 800 720" className="sig-svg">
      <g className="sig-compass">
        <circle cx="400" cy="525" r="123"/><circle cx="400" cy="525" r="105"/>
        <path d="M400 392 L423 505 L400 525 L377 505Z"/><path d="M400 658 L423 545 L400 525 L377 545Z"/>
        <path d="M267 525 L380 502 L400 525 L380 548Z"/><path d="M533 525 L420 502 L400 525 L420 548Z"/>
        <circle cx="400" cy="525" r="19"/>
      </g>
      <g className="sig-roots">
        <path d="M400 525 C377 555 360 590 330 630"/><path d="M400 525 C423 555 440 590 470 630"/>
        <path d="M400 525 C389 568 384 618 375 664"/><path d="M400 525 C411 568 416 618 425 664"/>
      </g>
      <g className="sig-trunk"><path d="M400 525 C375 470 386 421 394 376 C398 343 398 305 400 270 C402 305 402 343 406 376 C414 421 425 470 400 525Z"/></g>
      {state.paths.slice(0,8).map((p,i)=>{
        const progress=pathProgress(state,p), stage=visualStageFromProgress(progress), sel=selected===p.id;
        const end=points[i], midx=(400+end[0])/2, midy=(345+end[1])/2;
        const ghost=stage==="sealed", ornate=["ornamented","mastered"].includes(stage);
        return <g key={p.id} className={`sig-path stage-${stage} ${sel?"selected":""}`} onClick={()=>onSelect?.(p.id)}>
          <path d={`M400 345 Q${midx} ${midy} ${end[0]} ${end[1]}`} className="main-branch"/>
          {!ghost && <path d={`M${midx} ${midy} q${i%2?28:-28} -18 ${i%2?45:-45} -45`} className="sub-branch"/>}
          {ornate && <><ellipse cx={end[0]} cy={end[1]} rx="14" ry="6" transform={`rotate(${i*38-120} ${end[0]} ${end[1]})`} className="sig-leaf"/><circle cx={midx} cy={midy} r="5" className="sig-node"/></>}
          <circle cx={end[0]} cy={end[1]} r={sel?27:23} className="path-ring"/>
          <text x={end[0]} y={end[1]+5} textAnchor="middle" className="path-glyph">{p.glyph}</text>
          {!compact && <><text x={end[0]} y={end[1]+42} textAnchor="middle" className="path-name">{p.name.toUpperCase()}</text><text x={end[0]} y={end[1]+55} textAnchor="middle" className="path-stage">{stage.toUpperCase()} · {progress}%</text></>}
        </g>
      })}
      <g className="sun-moon"><circle cx="190" cy="335" r="32"/><path d="M610 300 A44 44 0 1 0 642 366 A36 36 0 1 1 610 300Z"/></g>
    </svg>
  </div>;
}

function AuthGate({onReady}:{onReady:(user:User)=>void}){
  const [mode,setMode]=useState<AuthMode>("signin");
  const [email,setEmail]=useState("");
  const [password,setPassword]=useState("");
  const [busy,setBusy]=useState(false);
  const [message,setMessage]=useState<string|null>(null);

  async function submit(){
    if(!email.trim()||password.length<6){
      setMessage("Use a valid email and a password of at least 6 characters.");
      return;
    }
    setBusy(true); setMessage(null);
    try{
      if(mode==="signup"){
        const {data,error}=await signUp(email.trim(),password);
        if(error) throw error;
        if(data.user && data.session) onReady(data.user);
        else setMessage("Account created. Check your email if confirmation is required, then sign in.");
      }else{
        const {data,error}=await signIn(email.trim(),password);
        if(error) throw error;
        if(data.user) onReady(data.user);
      }
    }catch(err){
      setMessage(err instanceof Error?err.message:"Authentication failed.");
    }finally{setBusy(false)}
  }

  return <main className="auth-shell">
    <div className="noise"/>
    <section className="auth-art">
      <BrandMark/>
      <div className="auth-emblem"><img src="/assets/becomr-compass-tree.png" alt="BECOMR Compass Tree"/></div>
      <div><p className="kicker">THE COMPASS REMEMBERS</p><h1>Your progression should follow <em>you.</em></h1><p>Sign in to carry your paths, proofs, Archive, Weekly Bosses, XP, and evolving insignia across devices.</p></div>
    </section>
    <section className="auth-panel">
      <p className="kicker">BECOMR ACCOUNT</p>
      <h2>{mode==="signin"?"Return to your build.":"Begin your record."}</h2>
      <label>EMAIL<input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com"/></label>
      <label>PASSWORD<input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="6+ characters" onKeyDown={e=>{if(e.key==="Enter")submit()}}/></label>
      {message&&<div className="auth-message">{message}</div>}
      <button className="auth-primary" onClick={submit} disabled={busy}>{busy?"ALIGNING…":mode==="signin"?"ENTER BECOMR":"CREATE ACCOUNT"}</button>
      <button className="auth-switch" onClick={()=>{setMode(mode==="signin"?"signup":"signin");setMessage(null)}}>{mode==="signin"?"Need an account? Create one":"Already have an account? Sign in"}</button>
      <div className="auth-note"><span>✦</span><p>Your local progress is preserved. On your first successful sign-in, BECOMR will migrate it to your private cloud state if no cloud record exists yet.</p></div>
    </section>
  </main>;
}

function QuestEditor({state,setState,onClose}:{state:AppState;setState:(s:AppState)=>void;onClose:()=>void}){
  const [pathId,setPathId]=useState(state.paths[0]?.id||"developer");
  const [title,setTitle]=useState(""); const [proof,setProof]=useState(""); const [xp,setXp]=useState(40);
  const [kind,setKind]=useState<Quest["kind"]>("daily");
  function add(){
    if(!title.trim()) return;
    setState({...state,quests:[...state.quests,{id:`q-${Date.now()}`,pathId,title:title.trim(),proof:proof.trim()||"Define a measurable result.",xp,kind}]});
    onClose();
  }
  return <div className="modal-backdrop"><section className="editor-sheet">
    <p className="kicker">QUEST EDITOR</p><h2>Create a new Trial.</h2>
    <label>PATH<select value={pathId} onChange={e=>setPathId(e.target.value)}>{state.paths.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select></label>
    <label>TITLE<input value={title} onChange={e=>setTitle(e.target.value)}/></label>
    <label>PROOF REQUIRED<textarea value={proof} onChange={e=>setProof(e.target.value)}/></label>
    <div className="editor-grid"><label>XP<input type="number" min="5" step="5" value={xp} onChange={e=>setXp(Number(e.target.value))}/></label><label>TYPE<select value={kind} onChange={e=>setKind(e.target.value as Quest["kind"])}><option value="daily">Daily</option><option value="weekly">Weekly</option><option value="boss">Boss</option></select></label></div>
    <div className="modal-actions"><button onClick={onClose}>CANCEL</button><button onClick={add}>INSCRIBE QUEST</button></div>
  </section></div>;
}

function PathEditor({state,setState,onClose}:{state:AppState;setState:(s:AppState)=>void;onClose:()=>void}){
  const [name,setName]=useState(""); const [glyph,setGlyph]=useState("✦"); const [cap,setCap]=useState("");
  function add(){
    if(!name.trim()) return;
    const id=name.toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/(^-|-$)/g,"")||`path-${Date.now()}`;
    const p:SkillPath={id,name:name.trim(),glyph:glyph||"✦",tone:"gold",region:"UNMAPPED / NEW PATH",capability:cap.trim()||`Become capable in ${name.trim()}`,nodes:[{id:`${id}-1`,title:"Foundation",order:1,xpRequired:0}]};
    setState({...state,paths:[...state.paths,p]}); onClose();
  }
  return <div className="modal-backdrop"><section className="editor-sheet"><p className="kicker">PATH EDITOR</p><h2>Open a new path.</h2>
    <label>PATH NAME<input value={name} onChange={e=>setName(e.target.value)}/></label><label>GLYPH<input value={glyph} onChange={e=>setGlyph(e.target.value)} maxLength={2}/></label><label>CAPABILITY<input value={cap} onChange={e=>setCap(e.target.value)}/></label>
    <div className="modal-actions"><button onClick={onClose}>CANCEL</button><button onClick={add}>OPEN PATH</button></div>
  </section></div>;
}

export default function Home(){
  const [state,setState]=useState<AppState>(seedState);
  const [user,setUser]=useState<User|null>(null);
  const [authChecked,setAuthChecked]=useState(false);
  const [syncStatus,setSyncStatus]=useState<SyncStatus>("local");
  const [migrationNotice,setMigrationNotice]=useState<string|null>(null);
  const [tab,setTab]=useState<Tab>("command");
  const [selectedPath,setSelectedPath]=useState("developer");
  const [activeQuest,setActiveQuest]=useState<Quest|null>(null);
  const [modal,setModal]=useState<Modal>(null);
  const [proof,setProof]=useState("");
  const [easier,setEasier]=useState(""); const [resisted,setResisted]=useState(""); const [next,setNext]=useState("");
  const saveTimer=useRef<ReturnType<typeof setTimeout>|null>(null);
  const hydrating=useRef(true);

  async function hydrateFor(userObj:User|null){
    hydrating.current=true;
    try{
      if(userObj){
        setSyncStatus("syncing");
        const result=await hydrateStateForUser(userObj.id,seedState);
        setState(result.state);
        if(result.migrated) setMigrationNotice("LOCAL PROGRESS MIGRATED TO CLOUD");
        setSyncStatus("saved");
      }else{
        const local=loadLocalState();
        if(local) setState(local);
        setSyncStatus("local");
      }
    }catch(err){
      console.error(err); setSyncStatus("error");
      const local=loadLocalState(); if(local)setState(local);
    }finally{
      hydrating.current=false;
    }
  }

  useEffect(()=>{
    (async()=>{
      if(!hasSupabaseConfig || !supabase){
        const local=loadLocalState(); if(local)setState(local);
        setAuthChecked(true); hydrating.current=false; return;
      }
      const {data:{session}}=await supabase.auth.getSession();
      setUser(session?.user||null);
      await hydrateFor(session?.user||null);
      setAuthChecked(true);

      const {data:{subscription}}=supabase.auth.onAuthStateChange(async(_event,session)=>{
        setUser(session?.user||null);
        await hydrateFor(session?.user||null);
      });
      return ()=>subscription.unsubscribe();
    })();
  },[]);

  useEffect(()=>{
    if(!authChecked || hydrating.current) return;
    saveLocalState(state);
    if(!user){
      setSyncStatus("local");
      return;
    }
    if(saveTimer.current) clearTimeout(saveTimer.current);
    setSyncStatus("syncing");
    saveTimer.current=setTimeout(async()=>{
      try{
        if(typeof navigator!=="undefined"&&!navigator.onLine){setSyncStatus("offline");return}
        await saveCloudState(user.id,state);
        setSyncStatus("saved");
      }catch(err){console.error(err);setSyncStatus("error")}
    },650);
    return ()=>{if(saveTimer.current)clearTimeout(saveTimer.current)};
  },[state,user,authChecked]);

  useEffect(()=>{
    const online=()=>{if(user){setSyncStatus("syncing");saveCloudState(user.id,state).then(()=>setSyncStatus("saved")).catch(()=>setSyncStatus("error"))}};
    const offline=()=>{if(user)setSyncStatus("offline")};
    window.addEventListener("online",online); window.addEventListener("offline",offline);
    return ()=>{window.removeEventListener("online",online);window.removeEventListener("offline",offline)};
  },[user,state]);

  const selected=state.paths.find(p=>p.id===selectedPath)||state.paths[0];
  const dailies=state.quests.filter(q=>q.kind==="daily"||q.kind==="boss");
  const weeks=weeklyBosses(state), wScore=weeklyScore(state), level=Math.floor(state.xp/500)+1;

  function prove(q:Quest){
    const now=new Date().toISOString();
    setState({...state,xp:state.xp+(q.done?0:q.xp),quests:state.quests.map(x=>x.id===q.id?{...x,done:true,evidence:proof.trim(),completedAt:now}:x)});
    setActiveQuest(null);setProof("");
  }
  function addWeeklyFor(path:SkillPath){
    const idx=currentNodeIndex(state,path), node=path.nodes[Math.min(idx+1,path.nodes.length-1)];
    setState({...state,quests:[...state.quests,generatedWeeklyBoss(path,node.title)]});
  }
  function saveArchive(){
    if(!easier&&!resisted&&!next)return;
    setState({...state,momentum:state.momentum+1,archive:[{id:String(Date.now()),date:new Date().toLocaleDateString(),easier,resisted,next,proven:state.quests.filter(q=>q.done).length,xp:state.xp},...state.archive]});
    setEasier("");setResisted("");setNext("");
  }

  if(!authChecked) return <main className="loading"><BrandMark/><p>ALIGNING THE COMPASS…</p></main>;
  if(hasSupabaseConfig && !user) return <AuthGate onReady={setUser}/>;

  return <main className="shell">
    <div className="noise"/>
    <header className="masthead">
      <BrandMark/>
      <div className="account-strip">
        <SyncBadge status={syncStatus} user={user}/>
        {user&&<div className="user-chip"><span>{user.email}</span><button onClick={()=>signOut()}>SIGN OUT</button></div>}
        <div className="mast-meta"><span>LVL {level}</span><i/><span>{state.xp.toLocaleString()} XP</span><i/><span>☀ {state.momentum}</span></div>
      </div>
    </header>

    {migrationNotice&&<button className="migration-toast" onClick={()=>setMigrationNotice(null)}>✦ {migrationNotice}<span>×</span></button>}

    {tab==="command"&&<section className="page">
      <div className="command-heading"><div><p className="kicker">COMMAND / CLOUD-BACKED BUILD</p><h1>Proof changes the <em>tree.</em></h1></div><div className="command-actions"><button onClick={()=>setModal("quest")}>+ QUEST</button><button onClick={()=>setModal("path")}>+ PATH</button></div></div>
      <div className="command-grid"><section><div className="section-rule"><span>01</span><b>OPEN TRIALS</b><i/></div>
        {dailies.map(q=>{const p=state.paths.find(x=>x.id===q.pathId);return <button key={q.id} className={`trial-row ${q.done?"done":""}`} onClick={()=>{if(!q.done){setActiveQuest(q);setProof(q.evidence||"")}}}><span className="trial-glyph-sm">{p?.glyph||"✦"}</span><div><small>{p?.name.toUpperCase()} · {q.kind.toUpperCase()}</small><strong>{q.title}</strong><p>{q.proof}</p></div><em>{q.done?"PROVEN":`+${q.xp} XP`}</em></button>})}
      </section><aside><div className="section-rule"><span>02</span><b>LIVE INSIGNIA</b><i/></div><DynamicInsignia state={state} selected={selectedPath} compact/></aside></div>
    </section>}

    {tab==="compass"&&<section className="page">
      <div className="compass-title"><div><p className="kicker">COMPASS / PROOF-DRIVEN INSIGNIA</p><h1>Your account carries your <em>becoming.</em></h1></div><p>Every Proven quest changes the same state that now follows you between sessions and devices.</p></div>
      <DynamicInsignia state={state} selected={selectedPath} onSelect={setSelectedPath}/>
      {selected&&<section className="path-inspector"><div className="inspector-intro"><span className="big-glyph">{selected.glyph}</span><div><p>{selected.region}</p><h2>{selected.name}</h2><span>{selected.capability}</span></div><div className="stage-readout"><small>EARNED XP</small><strong>{pathEarnedXp(state,selected.id)}</strong><em>{pathProgress(state,selected)}%</em></div></div><StageBar stage={visualStageFromProgress(pathProgress(state,selected))}/><div className="branch-line">{selected.nodes.map((n,i)=>{const current=currentNodeIndex(state,selected);const status=i<current?"proven":i===current?"open":"sealed";return <div className={`branch-node ${status}`} key={n.id}><i>{status==="proven"?"✦":status==="open"?"◇":"·"}</i><strong>{n.title}</strong><span>{n.xpRequired} PATH XP</span></div>})}</div></section>}
    </section>}

    {tab==="weekly"&&<section className="page">
      <div className="compass-title"><div><p className="kicker">WEEKLY / BOSS BOARD</p><h1>Weeks need a <em>boss.</em></h1></div><div className="weekly-score"><strong>{wScore}%</strong><span>WEEK CLEARED</span></div></div>
      <div className="weekly-grid"><section><div className="section-rule"><span>I</span><b>ACTIVE WEEKLY BOSSES</b><i/></div>{weeks.map(q=>{const p=state.paths.find(x=>x.id===q.pathId);return <article className={`weekly-card ${q.done?"done":""}`} key={q.id}><div><span>{p?.glyph}</span><small>{p?.name}</small></div><h3>{q.title}</h3><p>{q.proof}</p><footer><b>+{q.xp} XP</b><button onClick={()=>{if(!q.done){setActiveQuest(q);setProof(q.evidence||"")}}}>{q.done?"PROVEN":"ENTER BOSS"}</button></footer></article>})}</section>
      <aside><div className="section-rule"><span>II</span><b>GENERATE FROM PATH</b><i/></div>{state.paths.slice(0,8).map(p=><button className="generate-row" key={p.id} onClick={()=>addWeeklyFor(p)}><span>{p.glyph}</span><div><strong>{p.name}</strong><small>Generate next weekly boss</small></div><b>+</b></button>)}</aside></div>
    </section>}

    {tab==="archive"&&<section className="page"><div className="archive-heading"><p className="kicker">ARCHIVE / NIGHTLY SAVE</p><h1>Reflection feeds the <em>next bearing.</em></h1></div><div className="save-sheet"><label><span>WHAT BECAME EASIER?</span><textarea value={easier} onChange={e=>setEasier(e.target.value)}/></label><label><span>WHAT RESISTED?</span><textarea value={resisted} onChange={e=>setResisted(e.target.value)}/></label><label><span>WHERE NEXT?</span><textarea value={next} onChange={e=>setNext(e.target.value)}/></label><button className="ritual-button" onClick={saveArchive}>INSCRIBE SAVE</button></div>{state.archive.map(a=><article className="archive-entry" key={a.id}><time>{a.date}</time><section><small>EASIER</small><p>{a.easier}</p></section><section><small>RESISTED</small><p>{a.resisted}</p></section><section><small>NEXT</small><p>{a.next}</p></section></article>)}</section>}

    {tab==="build"&&<section className="page"><div className="build-hero"><DynamicInsignia state={state} selected={selectedPath} compact/><div><p className="kicker">BUILD / CURRENT SELF</p><h1>LVL {level}</h1><h2>{state.quests.filter(q=>q.done).length<4?"SEEKER":"BUILDER"}</h2><p>{state.xp.toLocaleString()} XP · MOMENTUM {state.momentum}</p><div className="account-status"><SyncBadge status={syncStatus} user={user}/><span>{user?.email||"Local profile"}</span></div></div></div>
      <div className="build-columns"><section><div className="section-rule"><span>I</span><b>PATH DEVELOPMENT</b><i/></div>{state.paths.map(p=><button className="path-progress-row" key={p.id} onClick={()=>{setSelectedPath(p.id);setTab("compass")}}><span>{p.glyph}</span><div><strong>{p.name}</strong><i><b style={{width:`${pathProgress(state,p)}%`}}/></i></div><em>{pathProgress(state,p)}%</em></button>)}</section>
      <section><div className="section-rule"><span>II</span><b>CLOUD RECORD</b><i/></div><div className="storage-card"><strong>{user?"SUPABASE CONNECTED":"LOCAL-FIRST"}</strong><p>{user?"Your BECOMR state is attached to your authenticated account. Changes save locally immediately and sync to Supabase after a short debounce.":"This build can still run locally without cloud configuration."}</p>{user&&<><small>ACCOUNT</small><p>{user.email}</p><button className="signout-wide" onClick={()=>signOut()}>SIGN OUT OF BECOMR</button></>}</div></section></div>
    </section>}

    <nav className="instrument-nav">{[["command","☀","COMMAND"],["compass","✥","COMPASS"],["weekly","◆","WEEKLY"],["archive","☾","ARCHIVE"],["build","◉","BUILD"]].map(([id,g,l])=><button key={id} className={tab===id?"active":""} onClick={()=>setTab(id as Tab)}><b>{g}</b><span>{l}</span></button>)}</nav>

    {activeQuest&&<div className="modal-backdrop"><section className="proof-sheet"><button className="close" onClick={()=>setActiveQuest(null)}>×</button><p className="kicker">PROVE / {state.paths.find(p=>p.id===activeQuest.pathId)?.name}</p><h2>{activeQuest.title}</h2><div className="proof-required"><span>PROOF REQUIRED</span><p>{activeQuest.proof}</p></div><textarea value={proof} onChange={e=>setProof(e.target.value)} placeholder="Record the result, number, link, or observation…"/><button className="ritual-button" onClick={()=>prove(activeQuest)}>INSCRIBE PROOF <b>+{activeQuest.xp} XP</b></button></section></div>}
    {modal==="quest"&&<QuestEditor state={state} setState={setState} onClose={()=>setModal(null)}/>}
    {modal==="path"&&<PathEditor state={state} setState={setState} onClose={()=>setModal(null)}/>}
  </main>;
}
