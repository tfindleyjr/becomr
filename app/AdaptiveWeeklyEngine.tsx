"use client";

import { useEffect, useRef } from "react";
import type { AppState } from "@/lib/types";
import { supabase, hasSupabaseConfig } from "@/lib/supabase";
import { loadLocalState, saveCloudState, saveLocalState } from "@/lib/storage";
import { currentNodeIndex, pathProgress } from "@/lib/progression";

export default function AdaptiveWeeklyEngine(){
  const running=useRef(new Set<string>());

  useEffect(()=>{
    async function persist(next:AppState,userId:string|null){
      saveLocalState(next,userId);
      if(userId)await saveCloudState(userId,next);
      window.dispatchEvent(new CustomEvent("becomr-cycle-updated",{detail:next}));
    }

    async function adapt(input?:AppState){
      let userId:string|null=null;
      if(hasSupabaseConfig&&supabase){
        const {data:{session}}=await supabase.auth.getSession();
        userId=session?.user?.id||null;
      }
      const state=loadLocalState(userId)||input;
      if(!state)return;

      for(const path of state.paths){
        if(path.paused||running.current.has(path.id))continue;
        const week=state.pathWeeks?.[path.id];
        if(!week)continue;
        const currentWeekly=state.quests.filter(q=>q.pathId===path.id&&q.cycleKey===week.cycleKey&&(q.kind==="weekly_trial"||q.kind==="weekly"));
        if(currentWeekly.length<3||currentWeekly.every(q=>q.aiGenerated||q.done)||currentWeekly.some(q=>q.aiPending))continue;

        const previous=(state.cycleHistory||[]).find(h=>h.type==="week"&&h.weekNumber===week.weekNumber-1&&h.paths?.some(p=>p.pathId===path.id));
        running.current.add(path.id);

        const pendingBase=loadLocalState(userId)||state;
        const pendingIds=new Set(currentWeekly.filter(q=>!q.done&&!q.aiGenerated).map(q=>q.id));
        const pending:AppState={...pendingBase,quests:pendingBase.quests.map(q=>pendingIds.has(q.id)?{...q,aiPending:true}:q)};
        await persist(pending,userId);

        try{
          const idx=currentNodeIndex(pending,path);
          const currentNode=path.nodes[Math.min(idx,path.nodes.length-1)];
          const nextNode=path.nodes[Math.min(idx+1,path.nodes.length-1)]||currentNode;
          const recentProofs=pending.quests.filter(q=>q.pathId===path.id&&q.done).slice(-6).map(q=>({title:q.title,evidence:q.evidence||""}));
          const archive=pending.archive[0]||null;
          const res=await fetch("/api/ai/weekly",{
            method:"POST",headers:{"Content-Type":"application/json"},
            body:JSON.stringify({
              path:{name:path.name,capability:path.capability},
              currentNode:currentNode?.title||path.name,
              nextNode:nextNode?.title||path.name,
              weekNumber:week.weekNumber,
              progress:pathProgress(pending,path),
              capacity:path.capacity||"steady",
              previousWeek:previous?.quests||[],
              recentProofs,
              archive,
              firstWeek:week.weekNumber===1
            })
          });
          const raw=await res.text();if(!raw)throw new Error("Empty weekly response");
          let data:any;try{data=JSON.parse(raw)}catch{throw new Error("Invalid weekly response")}
          if(!res.ok||!data?.trial1||!data?.trial2||!data?.boss)throw new Error(data?.error||"Weekly adaptation unavailable");

          const latest=loadLocalState(userId)||pending;
          const next:AppState={...latest,quests:latest.quests.map(q=>{
            if(q.pathId!==path.id||q.cycleKey!==week.cycleKey||q.done)return q;
            const patch=q.kind==="weekly_trial"
              ? (q.title.includes("TRIAL II")?data.trial2:data.trial1)
              : q.kind==="weekly"?data.boss:null;
            if(!patch)return q;
            return {...q,title:String(patch.title),proof:String(patch.proof),xp:Math.max(40,Math.min(450,Number(patch.xp)||q.xp)),aiGenerated:true,aiPending:false,difficulty:data.difficulty,adaptationReason:String(data.reason||""),prerequisiteNote:String(data.prerequisiteNote||"")};
          })};
          await persist(next,userId);
        }catch(err){
          console.warn("BECOMR adaptive weekly fallback used",err);
          const latest=loadLocalState(userId)||pending;
          const fallback:AppState={...latest,quests:latest.quests.map(q=>pendingIds.has(q.id)?{...q,aiPending:false}:q)};
          await persist(fallback,userId);
        }finally{running.current.delete(path.id)}
      }
    }

    const initial=window.setTimeout(()=>adapt(),650);
    const onCycle=(e:Event)=>adapt((e as CustomEvent<AppState>).detail);
    window.addEventListener("becomr-cycle-updated",onCycle);
    return()=>{window.clearTimeout(initial);window.removeEventListener("becomr-cycle-updated",onCycle)};
  },[]);

  return null;
}
