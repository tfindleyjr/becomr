"use client";

import { useEffect, useMemo, useState } from "react";
import type { AppState, Quest } from "@/lib/types";
import { supabase, hasSupabaseConfig } from "@/lib/supabase";
import { loadLocalState, saveCloudState, saveLocalState } from "@/lib/storage";
import { cycleStateChanged, ensureCurrentCycles } from "@/lib/cycles";

export default function WeeklyTrialDeck(){
  const [state,setState]=useState<AppState|null>(null);
  const [userId,setUserId]=useState<string|null>(null);
  const [visible,setVisible]=useState(false);
  const [expanded,setExpanded]=useState(false);
  const [active,setActive]=useState<Quest|null>(null);
  const [proof,setProof]=useState("");

  useEffect(()=>{
    function syncVisibility(){
      const onWeekly=window.location.hash==="#weekly";
      setVisible(onWeekly);
      if(!onWeekly)setExpanded(false);
    }
    const openFromMobile=()=>setExpanded(true);
    syncVisibility();
    window.addEventListener("hashchange",syncVisibility);
    window.addEventListener("becomr-open-weekly-trials",openFromMobile);
    return()=>{
      window.removeEventListener("hashchange",syncVisibility);
      window.removeEventListener("becomr-open-weekly-trials",openFromMobile);
    };
  },[]);

  useEffect(()=>{
    if(!visible)return;
    let cancelled=false;
    let uid:string|null=null;

    async function syncFromBuild(){
      if(hasSupabaseConfig&&supabase&&uid===null){
        const {data:{session}}=await supabase.auth.getSession();
        uid=session?.user?.id||null;
        if(!cancelled)setUserId(uid);
      }
      const stored=loadLocalState(uid);
      if(!stored)return;
      const reconciled=ensureCurrentCycles(stored,new Date());
      if(cycleStateChanged(stored,reconciled)){
        saveLocalState(reconciled,uid);
        if(uid)saveCloudState(uid,reconciled).catch(console.warn);
        window.dispatchEvent(new CustomEvent("becomr-cycle-updated",{detail:reconciled}));
      }
      if(!cancelled)setState(reconciled);
    }

    syncFromBuild();
    const timer=window.setInterval(syncFromBuild,1800);
    const onCycle=()=>syncFromBuild();
    window.addEventListener("becomr-cycle-updated",onCycle);
    return()=>{
      cancelled=true;
      window.clearInterval(timer);
      window.removeEventListener("becomr-cycle-updated",onCycle);
    };
  },[visible]);

  const groups=useMemo(()=>{
    if(!state)return [];
    return state.paths.map(path=>{
      const week=state.pathWeeks?.[path.id]||{weekNumber:1,cycleKey:`path-${path.id}-week-1`};
      const trials=state.quests.filter(q=>q.kind==="weekly_trial"&&q.pathId===path.id&&q.cycleKey===week.cycleKey);
      const boss=state.quests.find(q=>q.kind==="weekly"&&q.pathId===path.id&&q.cycleKey===week.cycleKey);
      return {path,week,trials,boss};
    });
  },[state]);

  async function prove(){
    if(!state||!active)return;
    const now=new Date().toISOString();
    const updated:AppState={...state,xp:state.xp+(active.done?0:active.xp),quests:state.quests.map(q=>q.id===active.id?{...q,done:true,evidence:proof.trim(),completedAt:now}:q)};
    const next=ensureCurrentCycles(updated,new Date());
    setState(next);
    saveLocalState(next,userId);
    if(userId)await saveCloudState(userId,next);
    window.dispatchEvent(new CustomEvent("becomr-cycle-updated",{detail:next}));
    setActive(null);setProof("");
  }

  if(!visible||!state||groups.length===0)return null;

  const allTrials=groups.flatMap(g=>g.trials);
  const proven=allTrials.filter(q=>q.done).length;
  const weekNumbers=[...new Set(groups.map(g=>g.week.weekNumber))];
  const dockLabel=weekNumbers.length===1?`WEEK ${weekNumbers[0]} TRIALS`:"PATH WEEKS";

  return <>
    <button className="weekly-trial-dock" onClick={()=>setExpanded(true)} aria-expanded={expanded}>
      <span>◇</span>
      <div><small>{dockLabel}</small><strong>{proven}/{allTrials.length} PROVEN</strong></div>
      <b>{groups.every(g=>g.trials.length>=2&&g.trials.every(q=>q.done))?"BOSSES OPEN":"VIEW"}</b>
    </button>

    {expanded&&<div className="weekly-trial-backdrop" onClick={()=>setExpanded(false)}>
      <section className="weekly-trial-deck" onClick={e=>e.stopPropagation()}>
        <button className="weekly-trial-close" onClick={()=>setExpanded(false)}>×</button>
        <div className="weekly-trial-heading">
          <div><p className="kicker">WEEKLY TRIALS / EACH PATH ADVANCES</p><h2>A new Week means <em>new Proof.</em></h2></div>
          <p>Every path owns its own Week. Clear that path&apos;s two Trials and Boss, and only that path advances to a fresh set of Weekly Trials.</p>
        </div>
        <div className="weekly-trial-groups">
          {groups.map(({path,week,trials:pathTrials,boss})=><article className="weekly-trial-path" key={path.id}>
            <header>
              <span>{path.glyph}</span>
              <div><small>{path.name} · WEEK {week.weekNumber}</small><strong>{pathTrials.filter(q=>q.done).length}/{pathTrials.length||2} TRIALS PROVEN</strong></div>
              <em className="path-week-badge">W{String(week.weekNumber).padStart(2,"0")}</em>
            </header>
            {pathTrials.map((q,i)=><button className={`weekly-trial-row ${q.done?"done":""}`} key={q.id} onClick={()=>{if(!q.done){setActive(q);setProof(q.evidence||"")}}}>
              <span>{String(i+1).padStart(2,"0")}</span>
              <div><strong>{q.title}</strong><p>{q.proof}</p></div>
              <em>{q.done?"PROVEN":`+${q.xp} XP`}</em>
            </button>)}
            <footer>{pathTrials.length<2?"◇ PREPARING THIS WEEK'S TRIALS":!pathTrials.every(q=>q.done)?`◇ WEEK ${week.weekNumber} TRIALS IN PROGRESS`:boss?.done?`✦ WEEK ${week.weekNumber} CLEARED — ADVANCING`:`◆ WEEK ${week.weekNumber} BOSS UNLOCKED`}</footer>
          </article>)}
        </div>
      </section>
    </div>}

    {active&&<div className="modal-backdrop"><section className="proof-sheet">
      <button className="close" onClick={()=>setActive(null)}>×</button>
      <p className="kicker">WEEK {active.pathWeekNumber||1} TRIAL / {state.paths.find(p=>p.id===active.pathId)?.name}</p>
      <h2>{active.title}</h2>
      <div className="proof-required"><span>PROOF REQUIRED</span><p>{active.proof}</p></div>
      <textarea value={proof} onChange={e=>setProof(e.target.value)} placeholder="Record the result, number, link, clip, or observation…"/>
      <button className="ritual-button" onClick={prove}>INSCRIBE PROOF <b>+{active.xp} XP</b></button>
    </section></div>}
  </>;
}
