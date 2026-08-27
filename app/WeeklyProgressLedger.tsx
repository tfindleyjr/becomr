"use client";

import { useEffect, useMemo, useState } from "react";
import type { AppState, CycleSnapshot, PathWeekSnapshot, Quest } from "@/lib/types";
import { supabase, hasSupabaseConfig } from "@/lib/supabase";
import { loadLocalState } from "@/lib/storage";
import { currentNodeIndex, pathEarnedXp, pathProgress } from "@/lib/progression";

type WeekView={
  weekNumber:number;
  cycleKey:string;
  current:boolean;
  closed:boolean;
  quests:Quest[]|CycleSnapshot["quests"];
  paths:PathWeekSnapshot[];
};

export default function WeeklyProgressLedger(){
  const [state,setState]=useState<AppState|null>(null);
  const [visible,setVisible]=useState(false);
  const [open,setOpen]=useState(false);
  const [selectedWeek,setSelectedWeek]=useState<number|null>(null);

  useEffect(()=>{
    function sync(){
      const onWeekly=window.location.hash==="#weekly";
      setVisible(onWeekly);
      if(!onWeekly){setOpen(false);setSelectedWeek(null)}
    }
    sync();
    window.addEventListener("hashchange",sync);
    return()=>window.removeEventListener("hashchange",sync);
  },[]);

  useEffect(()=>{
    if(!visible)return;
    (async()=>{
      let uid:string|null=null;
      if(hasSupabaseConfig&&supabase){
        const {data:{session}}=await supabase.auth.getSession();
        uid=session?.user?.id||null;
      }
      setState(loadLocalState(uid));
    })();
  },[visible,open]);

  const weeks=useMemo<WeekView[]>(()=>{
    if(!state)return [];
    const history=(state.cycleHistory||[])
      .filter(h=>h.type==="week"&&h.weekNumber)
      .map(h=>({weekNumber:h.weekNumber!,cycleKey:h.cycleKey,current:false,closed:true,quests:h.quests,paths:h.paths||[]}));
    const currentNumber=state.cycles?.weekNumber||1;
    const currentKey=state.cycles?.weekKey||"";
    const currentQuests=state.quests.filter(q=>q.cycleType==="week"&&q.cycleKey===currentKey);
    const currentPaths=state.paths.map(path=>{
      const idx=currentNodeIndex(state,path);
      const bosses=currentQuests.filter(q=>q.pathId===path.id&&q.kind==="weekly"&&q.done).map(q=>({title:q.title,xp:q.xp}));
      return {
        pathId:path.id,pathName:path.name,glyph:path.glyph,
        earnedXp:pathEarnedXp(state,path.id),progress:pathProgress(state,path),
        nodeTitle:path.nodes[Math.min(idx,path.nodes.length-1)]?.title||path.name,
        bosses
      };
    });
    const current:WeekView={weekNumber:currentNumber,cycleKey:currentKey,current:true,closed:false,quests:currentQuests,paths:currentPaths};
    return [...history.filter(w=>w.weekNumber!==currentNumber),current].sort((a,b)=>a.weekNumber-b.weekNumber);
  },[state]);

  if(!visible||!state||state.paths.length===0)return null;

  const maxWeek=Math.max(state.cycles?.weekNumber||1,...weeks.map(w=>w.weekNumber));
  const selected=weeks.find(w=>w.weekNumber===selectedWeek)||null;
  const calendarWaiting=Boolean(state.cycles?.calendarWeekKey&&state.cycles?.weekKey!==state.cycles?.calendarWeekKey);

  function bossesFor(pathId:string,weekNumber:number){
    const week=weeks.find(w=>w.weekNumber===weekNumber);
    return week?.paths.find(p=>p.pathId===pathId)?.bosses||[];
  }

  return <>
    <button className="weekly-ledger-dock" onClick={()=>setOpen(true)}>
      <span>▦</span><div><small>WEEKLY PROGRESS</small><strong>{maxWeek} WEEK{maxWeek===1?"":"S"} RECORDED</strong></div><b>VIEW</b>
    </button>

    {open&&<div className="weekly-ledger-backdrop" onClick={()=>setOpen(false)}>
      <section className="weekly-ledger-sheet" onClick={e=>e.stopPropagation()}>
        <button className="weekly-ledger-close" onClick={()=>setOpen(false)}>×</button>
        <header className="weekly-ledger-header">
          <div><p className="kicker">WEEKLY LEDGER / CAMPAIGN HISTORY</p><h2>Every week keeps its <em>place.</em></h2></div>
          <div className={`week-gate ${calendarWaiting?"locked":"current"}`}>
            <small>{calendarWaiting?"NEXT CALENDAR WEEK LOCKED":"ACTIVE CAMPAIGN"}</small>
            <strong>WEEK {state.cycles?.weekNumber||1}</strong>
            <span>{calendarWaiting?"Clear the current Trials and Bosses to advance.":state.cycles?.weekKey}</span>
          </div>
        </header>

        <div className="ledger-scroll">
          <div className="ledger-grid" style={{gridTemplateColumns:`minmax(180px,1.15fr) repeat(${maxWeek},minmax(112px,1fr))`}}>
            <div className="ledger-corner">PATH / BOSS RECORD</div>
            {Array.from({length:maxWeek},(_,i)=>i+1).map(n=><button className={`ledger-week-head ${n===(state.cycles?.weekNumber||1)?"current":""}`} key={n} onClick={()=>setSelectedWeek(n)}><small>WEEK</small><strong>{String(n).padStart(2,"0")}</strong></button>)}
            {state.paths.map(path=><div className="ledger-row" key={path.id} style={{gridColumn:`1 / -1`,display:"grid",gridTemplateColumns:`minmax(180px,1.15fr) repeat(${maxWeek},minmax(112px,1fr))`}}>
              <div className="ledger-path"><span>{path.glyph}</span><div><strong>{path.name}</strong><small>{pathProgress(state,path)}% CURRENT</small></div></div>
              {Array.from({length:maxWeek},(_,i)=>i+1).map(n=>{
                const bosses=bossesFor(path.id,n);
                const isCurrent=n===(state.cycles?.weekNumber||1);
                return <button key={`${path.id}-${n}`} className={`boss-slot ${bosses.length?"proven":isCurrent?"active":"empty"}`} onClick={()=>setSelectedWeek(n)}>
                  <span>{bosses.length?"◆":isCurrent?"◇":"·"}</span>
                  <small>{bosses.length?`${bosses.length} BOSS${bosses.length===1?"":"ES"} PROVEN`:isCurrent?"RESERVED":"WEEK SLOT"}</small>
                  {bosses.slice(0,2).map((boss,i)=><strong key={i}>{boss.title.replace(/^WEEK \d+ BOSS — /,"").replace(/^STRETCH BOSS — /,"Stretch: ")}</strong>)}
                  {bosses.length>2&&<em>+{bosses.length-2} MORE</em>}
                </button>;
              })}
            </div>)}
          </div>
        </div>

        <p className="ledger-hint">Each column is permanently reserved for that campaign week. Select a week to inspect every Trial, every Boss, XP earned, and the path level snapshot from that week.</p>
      </section>
    </div>}

    {selected&&<div className="weekly-history-backdrop" onClick={()=>setSelectedWeek(null)}>
      <section className="weekly-history-sheet" onClick={e=>e.stopPropagation()}>
        <button className="weekly-ledger-close" onClick={()=>setSelectedWeek(null)}>×</button>
        <p className="kicker">WEEK {selected.weekNumber} / RECORD</p>
        <h2>{selected.current?"Current campaign":"Completed campaign"}</h2>
        <div className="history-statline"><span>{selected.cycleKey}</span><b>{selected.quests.filter(q=>q.done).length}/{selected.quests.length} PROVEN</b><b>+{selected.quests.filter(q=>q.done).reduce((s,q)=>s+q.xp,0)} XP</b></div>
        <div className="history-paths">{selected.paths.map(path=>{
          const pathQuests=selected.quests.filter(q=>q.pathId===path.pathId);
          return <article key={path.pathId}>
            <header><span>{path.glyph}</span><div><small>{path.pathName}</small><strong>{path.nodeTitle}</strong></div><em>{path.progress}%</em></header>
            {pathQuests.map(q=><div className={`history-quest ${q.done?"done":""}`} key={q.id}><span>{q.kind==="weekly_trial"?"◇":"◆"}</span><div><strong>{q.title}</strong>{q.evidence&&<p>Proof: {q.evidence}</p>}</div><b>{q.done?`+${q.xp} XP`:"NOT PROVEN"}</b></div>)}
          </article>;
        })}</div>
      </section>
    </div>}
  </>;
}
