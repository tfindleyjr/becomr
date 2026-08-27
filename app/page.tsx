"use client";

import { useEffect, useRef, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { seedState } from "@/data/seed";
import type { AppState, Quest, SkillPath, VisualStage } from "@/lib/types";
import { supabase, hasSupabaseConfig } from "@/lib/supabase";
import { signIn, signOut, signUp } from "@/lib/auth";
import {
  loadLocalState,
  saveLocalState,
  hydrateStateForUser,
  saveCloudState,
  type SyncStatus
} from "@/lib/storage";
import {
  currentNodeIndex,
  pathEarnedXp,
  pathProgress,
  visualStageFromProgress,
  weeklyBosses,
  weeklyScore,
  generatedWeeklyBoss
} from "@/lib/progression";
import DynamicCompass from "./DynamicCompass";

type Tab = "command"|"compass"|"weekly"|"archive"|"build";
type AuthMode = "signin"|"signup";

function BrandMark(){
  return <div className="brand-mark">
    <div className="brand-sigil"><span>✥</span></div>
    <div><strong>BECOMR</strong><span>BECOME CAPABLE</span></div>
  </div>;
}

function SyncBadge({status,user}:{status:SyncStatus;user:User|null}){
  const text=!user?"LOCAL":status==="syncing"?"SYNCING":status==="saved"?"CLOUD SAVED":status==="offline"?"OFFLINE":status==="error"?"SYNC ERROR":"CLOUD";
  return <div className={`sync-badge sync-${status}`}><i/><span>{text}</span></div>;
}

function StageBar({stage}:{stage:VisualStage}){
  const order:VisualStage[]=["sealed","open","inscribed","ornamented","mastered"];
  return <div className="stagebar">{order.map(s=><i key={s} className={order.indexOf(stage)>=order.indexOf(s)?"on":""}/>)}</div>;
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
    setBusy(true);setMessage(null);
    try{
      if(mode==="signup"){
        const {data,error}=await signUp(email.trim(),password);
        if(error)throw error;
        if(data.user&&data.session)onReady(data.user);
        else setMessage("Account created. Confirm your email if required, then sign in.");
      }else{
        const {data,error}=await signIn(email.trim(),password);
        if(error)throw error;
        if(data.user)onReady(data.user);
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
      <div>
        <p className="kicker">YOUR BUILD STARTS EMPTY</p>
        <h1>Become capable on <em>purpose.</em></h1>
        <p>BECOMR turns the person you want to become into paths, real-world Trials, Proof, and a Compass that only grows when you do.</p>
      </div>
    </section>
    <section className="auth-panel">
      <p className="kicker">BECOMR ACCOUNT</p>
      <h2>{mode==="signin"?"Return to your build.":"Begin your build."}</h2>
      <label>EMAIL<input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com"/></label>
      <label>PASSWORD<input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="6+ characters" onKeyDown={e=>{if(e.key==="Enter")submit()}}/></label>
      {message&&<div className="auth-message">{message}</div>}
      <button className="auth-primary" onClick={submit} disabled={busy}>{busy?"ALIGNING…":mode==="signin"?"ENTER BECOMR":"CREATE ACCOUNT"}</button>
      <button className="auth-switch" onClick={()=>{setMode(mode==="signin"?"signup":"signin");setMessage(null)}}>{mode==="signin"?"Need an account? Create one":"Already have an account? Sign in"}</button>
    </section>
  </main>;
}

function EmptyStart(){
  return <section className="first-bearing">
    <div className="first-bearing-copy">
      <p className="kicker">FIRST BEARING / 01</p>
      <h1>Your Compass begins with <em>nothing.</em></h1>
      <p>That is intentional. BECOMR does not decide who you are. Tell it what you want to become capable of and your first branch will be built around that goal.</p>
      <a className="first-bearing-cta" href="/forge">CREATE MY FIRST PATH <span>→</span></a>
      <div className="first-bearing-steps">
        <span><b>01</b> Choose a capability</span>
        <span><b>02</b> Review the path</span>
        <span><b>03</b> Prove the first Trial</span>
      </div>
    </div>
    <div className="first-bearing-compass"><DynamicCompass state={seedState} selected="" compact/></div>
  </section>;
}

export default function Home(){
  const [state,setState]=useState<AppState>(seedState);
  const [user,setUser]=useState<User|null>(null);
  const [ready,setReady]=useState(false);
  const [syncStatus,setSyncStatus]=useState<SyncStatus>("local");
  const [tab,setTab]=useState<Tab>("command");
  const [selectedPath,setSelectedPath]=useState("");
  const [activeQuest,setActiveQuest]=useState<Quest|null>(null);
  const [proof,setProof]=useState("");
  const [easier,setEasier]=useState("");
  const [resisted,setResisted]=useState("");
  const [next,setNext]=useState("");
  const [resetConfirm,setResetConfirm]=useState(false);
  const saveTimer=useRef<ReturnType<typeof setTimeout>|null>(null);
  const hydrating=useRef(true);

  async function hydrateFor(userObj:User|null){
    hydrating.current=true;
    try{
      if(userObj){
        setSyncStatus("syncing");
        const result=await hydrateStateForUser(userObj.id,seedState);
        setState(result.state);
        setSyncStatus("saved");
      }else{
        const local=loadLocalState();
        setState(local||seedState);
        setSyncStatus("local");
      }
    }catch(err){
      console.error(err);
      setSyncStatus("error");
      const local=loadLocalState(userObj?.id);
      setState(local||seedState);
    }finally{hydrating.current=false}
  }

  useEffect(()=>{
    (async()=>{
      if(!hasSupabaseConfig||!supabase){
        await hydrateFor(null);
        setReady(true);
        return;
      }
      const {data:{session}}=await supabase.auth.getSession();
      const current=session?.user||null;
      setUser(current);
      await hydrateFor(current);
      setReady(true);

      supabase.auth.onAuthStateChange(async(_event,session2)=>{
        const nextUser=session2?.user||null;
        setUser(nextUser);
        await hydrateFor(nextUser);
      });
    })();
  },[]);

  useEffect(()=>{
    if(typeof window==="undefined")return;
    const fromHash=window.location.hash.replace("#","") as Tab;
    if(["command","compass","weekly","archive","build"].includes(fromHash))setTab(fromHash);
  },[ready]);

  useEffect(()=>{
    if(state.paths.length===0){setSelectedPath("");return}
    if(!state.paths.some(p=>p.id===selectedPath))setSelectedPath(state.paths[0].id);
  },[state.paths,selectedPath]);

  useEffect(()=>{
    if(!ready||hydrating.current)return;
    saveLocalState(state,user?.id);
    if(!user){setSyncStatus("local");return}
    if(saveTimer.current)clearTimeout(saveTimer.current);
    setSyncStatus("syncing");
    saveTimer.current=setTimeout(async()=>{
      try{
        if(typeof navigator!=="undefined"&&!navigator.onLine){setSyncStatus("offline");return}
        await saveCloudState(user.id,state);
        setSyncStatus("saved");
      }catch(err){console.error(err);setSyncStatus("error")}
    },650);
    return()=>{if(saveTimer.current)clearTimeout(saveTimer.current)};
  },[state,user,ready]);

  const selected=state.paths.find(p=>p.id===selectedPath)||state.paths[0];
  const openTrials=state.quests.filter(q=>(q.kind==="daily"||q.kind==="boss")&&!q.done);
  const completedTrials=state.quests.filter(q=>q.done);
  const weeks=weeklyBosses(state);
  const wScore=weeklyScore(state);
  const level=Math.floor(state.xp/500)+1;

  function prove(q:Quest){
    const now=new Date().toISOString();
    setState(s=>({...s,xp:s.xp+(q.done?0:q.xp),quests:s.quests.map(x=>x.id===q.id?{...x,done:true,evidence:proof.trim(),completedAt:now}:x)}));
    setActiveQuest(null);setProof("");
  }

  function addWeeklyFor(path:SkillPath){
    const already=state.quests.some(q=>q.kind==="weekly"&&q.pathId===path.id&&!q.done);
    if(already)return;
    const idx=currentNodeIndex(state,path);
    const node=path.nodes[Math.min(idx+1,path.nodes.length-1)];
    setState(s=>({...s,quests:[...s.quests,generatedWeeklyBoss(path,node.title)]}));
  }

  function saveArchive(){
    if(!easier&&!resisted&&!next)return;
    setState(s=>({...s,momentum:s.momentum+1,archive:[{id:String(Date.now()),date:new Date().toLocaleDateString(),easier,resisted,next,proven:s.quests.filter(q=>q.done).length,xp:s.xp},...s.archive]}));
    setEasier("");setResisted("");setNext("");
  }

  async function resetBuild(){
    setState(seedState);
    setSelectedPath("");
    setTab("command");
    saveLocalState(seedState,user?.id);
    if(user)await saveCloudState(user.id,seedState);
    if(typeof window!=="undefined"){
      localStorage.removeItem("becomr-tutorial-seen");
      window.location.hash="";
    }
    setResetConfirm(false);
  }

  if(!ready)return <main className="loading"><BrandMark/><p>ALIGNING THE COMPASS…</p></main>;
  if(hasSupabaseConfig&&!user)return <AuthGate onReady={setUser}/>;

  return <main className="shell">
    <div className="noise"/>
    <header className="masthead">
      <BrandMark/>
      <div className="account-strip">
        <a className="forge-mini" href="/forge">AI FORGE</a>
        <SyncBadge status={syncStatus} user={user}/>
        {user&&<div className="user-chip"><span>{user.email}</span><button onClick={()=>signOut()}>SIGN OUT</button></div>}
        <div className="mast-meta"><span>LVL {level}</span><i/><span>{state.xp.toLocaleString()} XP</span><i/><span>☀ {state.momentum}</span></div>
      </div>
    </header>

    {tab==="command"&&<section className="page">
      {state.paths.length===0?<EmptyStart/>:<>
        <div className="command-heading">
          <div><p className="kicker">COMMAND / TODAY</p><h1>Proof changes the <em>tree.</em></h1></div>
          <a className="command-forge" href="/forge">+ NEW PATH</a>
        </div>
        <div className="command-grid">
          <section>
            <div className="section-rule"><span>01</span><b>OPEN TRIALS</b><i/></div>
            {openTrials.length===0&&<div className="journey-empty"><strong>No open Trials.</strong><p>Create another path or wait until your next challenge is generated.</p></div>}
            {openTrials.map(q=>{const p=state.paths.find(x=>x.id===q.pathId);return <button key={q.id} className="trial-row" onClick={()=>{setActiveQuest(q);setProof(q.evidence||"")}}><span className="trial-glyph-sm">{p?.glyph||"✦"}</span><div><small>{p?.name.toUpperCase()} · {q.kind.toUpperCase()}</small><strong>{q.title}</strong><p>{q.proof}</p></div><em>+{q.xp} XP</em></button>})}
          </section>
          <aside><div className="section-rule"><span>02</span><b>YOUR LIVE COMPASS</b><i/></div><DynamicCompass state={state} selected={selectedPath} onSelect={setSelectedPath} compact/></aside>
        </div>
      </>}
    </section>}

    {tab==="compass"&&<section className="page">
      <div className="compass-title">
        <div><p className="kicker">COMPASS / YOUR CAPABILITY MAP</p><h1>No two builds should look <em>the same.</em></h1></div>
        <p>Each path adds a branch. Proof develops it. Your Compass is generated from the actual directions you choose for your life.</p>
      </div>
      <DynamicCompass state={state} selected={selectedPath} onSelect={setSelectedPath}/>
      {state.paths.length===0&&<div className="compass-zero"><p>Your Compass is waiting for its first direction.</p><a href="/forge">CREATE FIRST PATH →</a></div>}
      {selected&&<section className="path-inspector">
        <div className="inspector-intro">
          <span className="big-glyph">{selected.glyph}</span>
          <div><p>{selected.region}</p><h2>{selected.name}</h2><span>{selected.capability}</span></div>
          <div className="stage-readout"><small>EARNED XP</small><strong>{pathEarnedXp(state,selected.id)}</strong><em>{pathProgress(state,selected)}%</em></div>
        </div>
        <StageBar stage={visualStageFromProgress(pathProgress(state,selected))}/>
        <div className="branch-line">{selected.nodes.map((n,i)=>{const current=currentNodeIndex(state,selected);const status=i<current?"proven":i===current?"open":"sealed";return <div className={`branch-node ${status}`} key={n.id}><i>{status==="proven"?"✦":status==="open"?"◇":"·"}</i><strong>{n.title}</strong><span>{n.xpRequired} PATH XP</span></div>})}</div>
      </section>}
    </section>}

    {tab==="weekly"&&<section className="page">
      <div className="compass-title"><div><p className="kicker">WEEKLY / BOSS BOARD</p><h1>Weeks need a <em>boss.</em></h1></div><div className="weekly-score"><strong>{wScore}%</strong><span>WEEK CLEARED</span></div></div>
      {state.paths.length===0?<div className="journey-full-empty"><h2>No paths. No bosses.</h2><p>Your Weekly board becomes meaningful after your first capability path exists.</p><a href="/forge">CREATE FIRST PATH →</a></div>:<div className="weekly-grid">
        <section><div className="section-rule"><span>I</span><b>ACTIVE WEEKLY BOSSES</b><i/></div>{weeks.map(q=>{const p=state.paths.find(x=>x.id===q.pathId);return <article className={`weekly-card ${q.done?"done":""}`} key={q.id}><div><span>{p?.glyph}</span><small>{p?.name}</small></div><h3>{q.title}</h3><p>{q.proof}</p><footer><b>+{q.xp} XP</b><button onClick={()=>{if(!q.done){setActiveQuest(q);setProof(q.evidence||"")}}}>{q.done?"PROVEN":"ENTER BOSS"}</button></footer></article>})}</section>
        <aside><div className="section-rule"><span>II</span><b>PATH BOSSES</b><i/></div>{state.paths.map(p=>{const active=state.quests.some(q=>q.kind==="weekly"&&q.pathId===p.id&&!q.done);return <button className="generate-row" key={p.id} onClick={()=>addWeeklyFor(p)} disabled={active}><span>{p.glyph}</span><div><strong>{p.name}</strong><small>{active?"Weekly Boss already active":"Generate next Weekly Boss"}</small></div><b>{active?"✓":"+"}</b></button>})}</aside>
      </div>}
    </section>}

    {tab==="archive"&&<section className="page">
      <div className="archive-heading"><p className="kicker">ARCHIVE / SAVE POINT</p><h1>Reflection feeds the <em>next bearing.</em></h1></div>
      <div className="save-sheet"><label><span>WHAT BECAME EASIER?</span><textarea value={easier} onChange={e=>setEasier(e.target.value)}/></label><label><span>WHAT RESISTED?</span><textarea value={resisted} onChange={e=>setResisted(e.target.value)}/></label><label><span>WHERE SHOULD THE COMPASS POINT NEXT?</span><textarea value={next} onChange={e=>setNext(e.target.value)}/></label><button className="ritual-button" onClick={saveArchive}>INSCRIBE SAVE</button></div>
      {state.archive.length===0&&<div className="journey-empty"><strong>Your Archive is empty.</strong><p>It will become the history of how your capability changed over time.</p></div>}
      {state.archive.map(a=><article className="archive-entry" key={a.id}><time>{a.date}</time><section><small>EASIER</small><p>{a.easier}</p></section><section><small>RESISTED</small><p>{a.resisted}</p></section><section><small>NEXT</small><p>{a.next}</p></section></article>)}
    </section>}

    {tab==="build"&&<section className="page">
      <div className="build-hero"><DynamicCompass state={state} selected={selectedPath} compact/><div><p className="kicker">BUILD / CURRENT SELF</p><h1>LVL {level}</h1><h2>{state.paths.length===0?"UNMAPPED":completedTrials.length<4?"SEEKER":"BUILDER"}</h2><p>{state.xp.toLocaleString()} XP · {state.paths.length} PATH{state.paths.length===1?"":"S"} · {completedTrials.length} PROVEN</p><div className="account-status"><SyncBadge status={syncStatus} user={user}/><span>{user?.email||"Local profile"}</span></div></div></div>
      <div className="build-columns">
        <section><div className="section-rule"><span>I</span><b>PATH DEVELOPMENT</b><i/></div>{state.paths.length===0?<div className="journey-empty"><strong>No identity has been assigned.</strong><p>Your Build only reflects paths you actually chose.</p><a href="/forge">CREATE FIRST PATH →</a></div>:state.paths.map(p=><button className="path-progress-row" key={p.id} onClick={()=>{setSelectedPath(p.id);setTab("compass")}}><span>{p.glyph}</span><div><strong>{p.name}</strong><i><b style={{width:`${pathProgress(state,p)}%`}}/></i></div><em>{pathProgress(state,p)}%</em></button>)}</section>
        <section><div className="section-rule"><span>II</span><b>ACCOUNT + TESTING</b><i/></div><div className="storage-card"><strong>{user?"SUPABASE CONNECTED":"LOCAL-FIRST"}</strong><p>Your paths, Proof, XP, Weekly Bosses, and Archive move together as one build.</p>{resetConfirm?<div className="reset-confirm"><p>This clears this account's BECOMR progression so you can experience onboarding like a brand-new customer.</p><div><button onClick={()=>setResetConfirm(false)}>CANCEL</button><button onClick={resetBuild}>YES, START EMPTY</button></div></div>:<button className="reset-build" onClick={()=>setResetConfirm(true)}>TEST AS A NEW USER</button>}</div></section>
      </div>
    </section>}

    <nav className="instrument-nav">{[["command","☀","COMMAND"],["compass","✥","COMPASS"],["weekly","◆","WEEKLY"],["archive","☾","ARCHIVE"],["build","◉","BUILD"]].map(([id,g,l])=><button key={id} className={tab===id?"active":""} onClick={()=>{setTab(id as Tab);if(typeof window!=="undefined")window.location.hash=id}}><b>{g}</b><span>{l}</span></button>)}</nav>

    {activeQuest&&<div className="modal-backdrop"><section className="proof-sheet"><button className="close" onClick={()=>setActiveQuest(null)}>×</button><p className="kicker">PROVE / {state.paths.find(p=>p.id===activeQuest.pathId)?.name}</p><h2>{activeQuest.title}</h2><div className="proof-required"><span>PROOF REQUIRED</span><p>{activeQuest.proof}</p></div><textarea value={proof} onChange={e=>setProof(e.target.value)} placeholder="Record the result, number, link, or observation…"/><button className="ritual-button" onClick={()=>prove(activeQuest)}>INSCRIBE PROOF <b>+{activeQuest.xp} XP</b></button></section></div>}
  </main>;
}
