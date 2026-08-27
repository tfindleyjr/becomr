"use client";

import { useEffect, useMemo, useState } from "react";
import type { AppState, SkillPath } from "@/lib/types";
import { supabase, hasSupabaseConfig } from "@/lib/supabase";
import { loadLocalState, saveLocalState, saveCloudState } from "@/lib/storage";
import { generatedBonusTrial, generatedStretchWeeklyBoss } from "@/lib/progression";

export default function ContinuationUnlock(){
  const [state,setState]=useState<AppState|null>(null);
  const [userId,setUserId]=useState<string|null>(null);
  const [open,setOpen]=useState(false);
  const [ready,setReady]=useState(false);

  useEffect(()=>{
    (async()=>{
      let uid:string|null=null;
      if(hasSupabaseConfig&&supabase){
        const {data:{session}}=await supabase.auth.getSession();
        uid=session?.user?.id||null;
      }
      setUserId(uid);
      setState(loadLocalState(uid));
      setReady(true);
    })();
    const onOpen=()=>{
      const stored=loadLocalState(userId);
      if(stored)setState(stored);
      setOpen(true);
    };
    window.addEventListener("becomr-open-continuation",onOpen);
    return()=>window.removeEventListener("becomr-open-continuation",onOpen);
  },[userId]);

  const status=useMemo(()=>{
    if(!state||state.paths.length===0)return null;
    const openDaily=state.quests.some(q=>(q.kind==="daily"||q.kind==="boss")&&!q.done);
    const weeklies=state.quests.filter(q=>q.kind==="weekly");
    const openWeekly=weeklies.some(q=>!q.done);
    const clearedDaily=!openDaily&&state.quests.some(q=>(q.kind==="daily"||q.kind==="boss")&&q.done);
    const clearedWeekly=weeklies.length>0&&!openWeekly;
    if(!clearedDaily&&!clearedWeekly)return null;
    return {clearedDaily,clearedWeekly};
  },[state]);

  async function persist(next:AppState){
    setState(next);
    saveLocalState(next,userId);
    if(userId)await saveCloudState(userId,next);
    setOpen(false);
    window.dispatchEvent(new CustomEvent("becomr-cycle-updated",{detail:next}));
  }

  async function daily(path:SkillPath){
    if(!state)return;
    const hasOpen=state.quests.some(q=>(q.kind==="daily"||q.kind==="boss")&&q.pathId===path.id&&!q.done);
    if(hasOpen)return;
    await persist({...state,quests:[...state.quests,generatedBonusTrial(state,path)]});
  }

  async function weekly(path:SkillPath){
    if(!state)return;
    const hasOpen=state.quests.some(q=>q.kind==="weekly"&&q.pathId===path.id&&!q.done);
    if(hasOpen)return;
    await persist({...state,quests:[...state.quests,generatedStretchWeeklyBoss(state,path)]});
  }

  if(!ready||!state||!status)return null;

  return <>
    <button className="continue-unlock-launch" onClick={()=>setOpen(true)}>
      <span>✦</span><div><small>BOARD CLEARED</small><strong>KEEP GOING</strong></div>
    </button>
    {open&&<div className="continue-unlock-backdrop" onClick={()=>setOpen(false)}>
      <section className="continue-unlock-sheet" onClick={e=>e.stopPropagation()}>
        <button className="continue-unlock-close" onClick={()=>setOpen(false)}>×</button>
        <p className="kicker">CONTINUATION / OPTIONAL</p>
        <h2>You&apos;re cleared. <em>You&apos;re not capped.</em></h2>
        <p className="continue-unlock-copy">BECOMR will never force endless busywork. Bank the win and recover, or use remaining capacity to open a challenge that advances a real capability.</p>

        {status.clearedDaily&&<div className="continue-unlock-group">
          <div><small>DAY CLEARED</small><strong>OPEN A BONUS TRIAL</strong></div>
          <p>Bonus Trials must improve on previous Proof instead of repeating it.</p>
          <div className="continue-unlock-paths">{state.paths.map(path=><button key={`d-${path.id}`} onClick={()=>daily(path)}><span>{path.glyph}</span><div><strong>{path.name}</strong><small>Push this path further today</small></div><b>→</b></button>)}</div>
        </div>}

        {status.clearedWeekly&&<div className="continue-unlock-group">
          <div><small>WEEK CLEARED</small><strong>OPEN A STRETCH BOSS</strong></div>
          <p>Stretch Bosses escalate toward the next node and award more XP as the path develops.</p>
          <div className="continue-unlock-paths">{state.paths.map(path=><button key={`w-${path.id}`} onClick={()=>weekly(path)}><span>{path.glyph}</span><div><strong>{path.name}</strong><small>Push toward the next capability</small></div><b>◆</b></button>)}</div>
        </div>}

        <button className="continue-unlock-rest" onClick={()=>setOpen(false)}>BANK THE WIN / RECOVER</button>
      </section>
    </div>}
  </>;
}
