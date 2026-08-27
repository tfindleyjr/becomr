"use client";

import { useEffect, useMemo, useState } from "react";
import type { AppState, Quest } from "@/lib/types";
import { supabase, hasSupabaseConfig } from "@/lib/supabase";
import { loadLocalState, saveCloudState, saveLocalState } from "@/lib/storage";

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
    syncVisibility();
    window.addEventListener("hashchange",syncVisibility);
    return()=>window.removeEventListener("hashchange",syncVisibility);
  },[]);

  useEffect(()=>{
    (async()=>{
      let uid:string|null=null;
      if(hasSupabaseConfig&&supabase){
        const {data:{session}}=await supabase.auth.getSession();
        uid=session?.user?.id||null;
      }
      setUserId(uid);
      setState(loadLocalState(uid));
    })();
  },[visible]);

  const trials=useMemo(()=>{
    if(!state)return [];
    const week=state.cycles?.weekKey;
    return state.quests.filter(q=>q.kind==="weekly_trial"&&(!week||q.cycleKey===week));
  },[state]);

  async function prove(){
    if(!state||!active)return;
    const now=new Date().toISOString();
    const next:AppState={...state,xp:state.xp+(active.done?0:active.xp),quests:state.quests.map(q=>q.id===active.id?{...q,done:true,evidence:proof.trim(),completedAt:now}:q)};
    setState(next);
    saveLocalState(next,userId);
    if(userId)await saveCloudState(userId,next);
    setActive(null);setProof("");
    window.location.reload();
  }

  if(!visible||!state||trials.length===0)return null;

  const proven=trials.filter(q=>q.done).length;
  const weekNumber=state.cycles?.weekNumber||1;
  const calendarWaiting=Boolean(state.cycles?.calendarWeekKey&&state.cycles?.weekKey!==state.cycles?.calendarWeekKey);
  const grouped=state.paths.map(path=>({path,trials:trials.filter(q=>q.pathId===path.id)})).filter(group=>group.trials.length>0);

  return <>
    <button className="weekly-trial-dock" onClick={()=>setExpanded(true)} aria-expanded={expanded}>
      <span>◇</span>
      <div><small>WEEK {weekNumber} TRIALS</small><strong>{proven}/{trials.length} PROVEN</strong></div>
      <b>{calendarWaiting?"WEEK LOCKED":proven===trials.length?"BOSSES OPEN":"VIEW"}</b>
    </button>

    {expanded&&<div className="weekly-trial-backdrop" onClick={()=>setExpanded(false)}>
      <section className="weekly-trial-deck" onClick={e=>e.stopPropagation()}>
        <button className="weekly-trial-close" onClick={()=>setExpanded(false)}>×</button>
        <div className="weekly-trial-heading">
          <div><p className="kicker">WEEK {weekNumber} / BUILD TOWARD THE BOSS</p><h2>Earn the right to face the <em>Boss.</em></h2></div>
          <p>{calendarWaiting?"The calendar has moved forward, but BECOMR will not skip this campaign. Finish this week's required Trials and Bosses before the next week unlocks.":"These Trials belong to this campaign week. A new set is generated only when the next calendar week begins and this one has been cleared."}</p>
        </div>
        <div className="weekly-trial-groups">
          {grouped.map(({path,trials:pathTrials})=><article className="weekly-trial-path" key={path.id}>
            <header><span>{path.glyph}</span><div><small>{path.name}</small><strong>{pathTrials.filter(q=>q.done).length}/{pathTrials.length} PROVEN</strong></div></header>
            {pathTrials.map((q,i)=><button className={`weekly-trial-row ${q.done?"done":""}`} key={q.id} onClick={()=>{if(!q.done){setActive(q);setProof(q.evidence||"")}}}>
              <span>{String(i+1).padStart(2,"0")}</span>
              <div><strong>{q.title}</strong><p>{q.proof}</p></div>
              <em>{q.done?"PROVEN":`+${q.xp} XP`}</em>
            </button>)}
            <footer>{pathTrials.every(q=>q.done)?"◆ WEEKLY BOSS UNLOCKED":"◇ COMPLETE TRIALS TO UNLOCK BOSS"}</footer>
          </article>)}
        </div>
      </section>
    </div>}

    {active&&<div className="modal-backdrop"><section className="proof-sheet">
      <button className="close" onClick={()=>setActive(null)}>×</button>
      <p className="kicker">WEEK {weekNumber} TRIAL / {state.paths.find(p=>p.id===active.pathId)?.name}</p>
      <h2>{active.title}</h2>
      <div className="proof-required"><span>PROOF REQUIRED</span><p>{active.proof}</p></div>
      <textarea value={proof} onChange={e=>setProof(e.target.value)} placeholder="Record the result, number, link, clip, or observation…"/>
      <button className="ritual-button" onClick={prove}>INSCRIBE PROOF <b>+{active.xp} XP</b></button>
    </section></div>}
  </>;
}
