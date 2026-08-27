"use client";

import { useEffect, useMemo, useState } from "react";
import type { AppState } from "@/lib/types";
import { supabase, hasSupabaseConfig } from "@/lib/supabase";
import { loadLocalState } from "@/lib/storage";
import { pathProgress } from "@/lib/progression";

export default function WeeklyProgressLedger(){
  const [state,setState]=useState<AppState|null>(null);
  const [visible,setVisible]=useState(false);
  const [open,setOpen]=useState(false);
  const [selected,setSelected]=useState<{pathId:string;weekNumber:number}|null>(null);

  useEffect(()=>{
    function sync(){
      const onWeekly=window.location.hash==="#weekly";
      setVisible(onWeekly);
      if(!onWeekly){setOpen(false);setSelected(null)}
    }
    sync();
    window.addEventListener("hashchange",sync);
    return()=>window.removeEventListener("hashchange",sync);
  },[]);

  useEffect(()=>{
    if(!visible)return;
    let cancelled=false;
    async function read(){
      let uid:string|null=null;
      if(hasSupabaseConfig&&supabase){
        const {data:{session}}=await supabase.auth.getSession();
        uid=session?.user?.id||null;
      }
      const next=loadLocalState(uid);
      if(!cancelled)setState(next);
    }
    read();
    const timer=window.setInterval(read,2000);
    const onCycle=()=>read();
    window.addEventListener("becomr-cycle-updated",onCycle);
    return()=>{cancelled=true;window.clearInterval(timer);window.removeEventListener("becomr-cycle-updated",onCycle)};
  },[visible]);

  const maxWeek=useMemo(()=>{
    if(!state)return 1;
    const active=Object.values(state.pathWeeks||{}).map(w=>w.weekNumber);
    const history=(state.cycleHistory||[]).filter(h=>h.type==="week"&&h.weekNumber).map(h=>h.weekNumber||1);
    return Math.max(1,...active,...history);
  },[state]);

  if(!visible||!state||state.paths.length===0)return null;

  function historical(pathId:string,weekNumber:number){
    return (state.cycleHistory||[]).find(h=>h.type==="week"&&h.weekNumber===weekNumber&&h.paths?.some(p=>p.pathId===pathId));
  }

  function currentQuests(pathId:string,weekNumber:number){
    const active=state.pathWeeks?.[pathId];
    if(!active||active.weekNumber!==weekNumber)return [];
    return state.quests.filter(q=>q.pathId===pathId&&q.cycleKey===active.cycleKey&&(q.kind==="weekly_trial"||q.kind==="weekly"));
  }

  const selectedPath=selected?state.paths.find(p=>p.id===selected.pathId):null;
  const selectedHistory=selected?historical(selected.pathId,selected.weekNumber):undefined;
  const selectedQuests=selected?(selectedHistory?.quests||currentQuests(selected.pathId,selected.weekNumber)):[];

  return <>
    <button className="weekly-ledger-dock" onClick={()=>setOpen(true)}>
      <span>▦</span><div><small>WEEKLY PROGRESS</small><strong>{maxWeek} WEEK{maxWeek===1?"":"S"} MAPPED</strong></div><b>VIEW</b>
    </button>

    {open&&<div className="weekly-ledger-backdrop" onClick={()=>setOpen(false)}>
      <section className="weekly-ledger-sheet" onClick={e=>e.stopPropagation()}>
        <button className="weekly-ledger-close" onClick={()=>setOpen(false)}>×</button>
        <header className="weekly-ledger-header">
          <div><p className="kicker">WEEKLY LEDGER / PATH HISTORY</p><h2>Every path keeps every <em>Week.</em></h2></div>
          <div className="week-gate current"><small>INDEPENDENT CAMPAIGNS</small><strong>{state.paths.length} PATH{state.paths.length===1?"":"S"}</strong><span>Each branch advances when its own Trials and Boss are cleared.</span></div>
        </header>

        <div className="ledger-scroll"><div className="ledger-grid" style={{gridTemplateColumns:`minmax(180px,1.15fr) repeat(${maxWeek},minmax(112px,1fr))`}}>
          <div className="ledger-corner">PATH / WEEK RECORD</div>
          {Array.from({length:maxWeek},(_,i)=>i+1).map(n=><div className="ledger-week-head" key={n}><small>WEEK</small><strong>{String(n).padStart(2,"0")}</strong></div>)}
          {state.paths.map(path=>{
            const activeWeek=state.pathWeeks?.[path.id]?.weekNumber||1;
            return <div className="ledger-row" key={path.id} style={{gridColumn:`1 / -1`,display:"grid",gridTemplateColumns:`minmax(180px,1.15fr) repeat(${maxWeek},minmax(112px,1fr))`}}>
              <div className="ledger-path"><span>{path.glyph}</span><div><strong>{path.name}</strong><small>WEEK {activeWeek} · {pathProgress(state,path)}% CURRENT</small></div></div>
              {Array.from({length:maxWeek},(_,i)=>i+1).map(n=>{
                const history=historical(path.id,n);
                const current=n===activeWeek;
                const bosses=history?.paths?.find(p=>p.pathId===path.id)?.bosses||[];
                const qs=current?currentQuests(path.id,n):[];
                const completedBoss=qs.filter(q=>q.kind==="weekly"&&q.done).length;
                const provenBosses=bosses.length+completedBoss;
                return <button key={`${path.id}-${n}`} className={`boss-slot ${history||provenBosses?"proven":current?"active":"empty"}`} onClick={()=>setSelected({pathId:path.id,weekNumber:n})}>
                  <span>{history||provenBosses?"◆":current?"◇":"·"}</span>
                  <small>{history?"WEEK CLEARED":current?`ACTIVE · ${qs.filter(q=>q.done).length}/${qs.length||3}`:"WEEK SLOT"}</small>
                  {history&&<strong>{bosses.length?`${bosses.length} BOSS${bosses.length===1?"":"ES"} PROVEN`:"COMPLETE"}</strong>}
                  {current&&!history&&<strong>Week {n}</strong>}
                </button>;
              })}
            </div>;
          })}
        </div></div>
        <p className="ledger-hint">A path never loses its Week slot. When its Trials and Boss are cleared, that slot becomes history and the next Week opens with a fresh Trial set.</p>
      </section>
    </div>}

    {selected&&selectedPath&&<div className="weekly-history-backdrop" onClick={()=>setSelected(null)}>
      <section className="weekly-history-sheet" onClick={e=>e.stopPropagation()}>
        <button className="weekly-ledger-close" onClick={()=>setSelected(null)}>×</button>
        <p className="kicker">{selectedPath.name} / WEEK {selected.weekNumber}</p>
        <h2>{selectedHistory?"Completed Week":"Active Week"}</h2>
        <div className="history-statline"><span>{selectedHistory?.cycleKey||state.pathWeeks?.[selected.pathId]?.cycleKey}</span><b>{selectedQuests.filter(q=>q.done).length}/{selectedQuests.length} PROVEN</b><b>+{selectedQuests.filter(q=>q.done).reduce((s,q)=>s+q.xp,0)} XP</b></div>
        <div className="history-paths"><article>
          {selectedQuests.map(q=><div className={`history-quest ${q.done?"done":""}`} key={q.id}><span>{q.kind==="weekly_trial"?"◇":"◆"}</span><div><strong>{q.title}</strong>{q.evidence&&<p>Proof: {q.evidence}</p>}</div><b>{q.done?`+${q.xp} XP`:"NOT PROVEN"}</b></div>)}
          {selectedQuests.length===0&&<p className="ledger-hint">This Week has not opened for this path yet.</p>}
        </article></div>
      </section>
    </div>}
  </>;
}
