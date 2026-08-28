"use client";

import { useEffect, useRef } from "react";
import type { AppState, Quest } from "@/lib/types";
import { supabase, hasSupabaseConfig } from "@/lib/supabase";
import { loadLocalState, saveCloudState, saveLocalState } from "@/lib/storage";
import { currentNodeIndex, pathProgress } from "@/lib/progression";

export default function AdaptiveTrialEngine(){
  const running=useRef(new Set<string>());

  useEffect(()=>{
    async function adapt(event:Event){
      const detail=(event as CustomEvent<{quest:Quest;state:AppState}>).detail;
      if(!detail?.quest||!detail?.state)return;
      const completed=detail.quest;
      if(completed.kind!=="daily"&&completed.kind!=="boss")return;
      if(running.current.has(completed.pathId))return;
      running.current.add(completed.pathId);

      try{
        let userId:string|null=null;
        if(hasSupabaseConfig&&supabase){
          const {data:{session}}=await supabase.auth.getSession();
          userId=session?.user?.id||null;
        }

        const current=loadLocalState(userId)||detail.state;
        const path=current.paths.find(p=>p.id===completed.pathId);
        if(!path)return;

        const nextOpen=current.quests.find(q=>q.pathId===path.id&&(q.kind==="daily"||q.kind==="boss")&&!q.done);
        if(!nextOpen)return;

        const nodeIndex=currentNodeIndex(current,path);
        const node=path.nodes[Math.min(nodeIndex,path.nodes.length-1)];
        const recentProofs=current.quests
          .filter(q=>q.pathId===path.id&&q.done&&q.completedAt)
          .sort((a,b)=>String(b.completedAt).localeCompare(String(a.completedAt)))
          .slice(0,6)
          .map(q=>({title:q.title,evidence:q.evidence||""}));
        const latestArchive=current.archive[0]||null;
        const weekNumber=current.pathWeeks?.[path.id]?.weekNumber||1;

        const res=await fetch("/api/ai/next-trial",{
          method:"POST",
          headers:{"Content-Type":"application/json"},
          body:JSON.stringify({
            path:{name:path.name,capability:path.capability},
            currentNode:node?.title||path.name,
            recentProofs,
            archive:latestArchive,
            weekNumber,
            progress:pathProgress(current,path)
          })
        });

        const raw=await res.text();
        if(!raw)return;
        let data:any;
        try{data=JSON.parse(raw)}catch{return}
        if(!res.ok||!data?.title||!data?.proof)return;

        const latest=loadLocalState(userId)||current;
        const stillOpen=latest.quests.find(q=>q.id===nextOpen.id&&!q.done);
        if(!stillOpen)return;

        const next:AppState={
          ...latest,
          quests:latest.quests.map(q=>q.id===stillOpen.id?{
            ...q,
            title:String(data.title),
            proof:String(data.proof),
            xp:Math.max(30,Math.min(100,Number(data.xp)||q.xp)),
            aiGenerated:true,
            adaptationReason:String(data.reason||"")
          }:q)
        };

        saveLocalState(next,userId);
        if(userId)await saveCloudState(userId,next);
        window.dispatchEvent(new CustomEvent("becomr-cycle-updated",{detail:next}));
      }catch(err){
        // Adaptive AI is an enhancement. The deterministic Trial already exists,
        // so failure must never block progression.
        console.warn("BECOMR adaptive Trial fallback used",err);
      }finally{
        running.current.delete(completed.pathId);
      }
    }

    window.addEventListener("becomr-proof-recorded",adapt);
    return()=>window.removeEventListener("becomr-proof-recorded",adapt);
  },[]);

  return null;
}
