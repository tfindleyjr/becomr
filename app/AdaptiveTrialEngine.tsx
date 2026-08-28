"use client";

import { useEffect, useRef } from "react";
import type { AppState } from "@/lib/types";
import { supabase, hasSupabaseConfig } from "@/lib/supabase";
import { loadLocalState, saveCloudState, saveLocalState } from "@/lib/storage";
import { currentNodeIndex, pathProgress } from "@/lib/progression";

export default function AdaptiveTrialEngine(){
  const running=useRef(new Set<string>());

  useEffect(()=>{
    async function adaptState(input?:AppState){
      let userId:string|null=null;
      if(hasSupabaseConfig&&supabase){const {data:{session}}=await supabase.auth.getSession();userId=session?.user?.id||null}
      const current=loadLocalState(userId)||input;if(!current)return;

      for(const path of current.paths){
        if(path.paused||running.current.has(path.id))continue;
        const nextOpen=current.quests.find(q=>q.pathId===path.id&&(q.kind==="daily"||q.kind==="boss")&&!q.done);
        if(!nextOpen||nextOpen.aiGenerated)continue;
        const recentProofs=current.quests.filter(q=>q.pathId===path.id&&q.done&&q.completedAt).sort((a,b)=>String(b.completedAt).localeCompare(String(a.completedAt))).slice(0,6).map(q=>({title:q.title,evidence:q.evidence||""}));
        if(recentProofs.length===0)continue;

        running.current.add(path.id);
        try{
          const nodeIndex=currentNodeIndex(current,path);const node=path.nodes[Math.min(nodeIndex,path.nodes.length-1)];const latestArchive=current.archive[0]||null;const weekNumber=current.pathWeeks?.[path.id]?.weekNumber||1;
          const res=await fetch("/api/ai/next-trial",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({path:{name:path.name,capability:path.capability},currentNode:node?.title||path.name,recentProofs,archive:latestArchive,weekNumber,progress:pathProgress(current,path),capacity:path.capacity||"steady"})});
          const raw=await res.text();if(!raw)continue;let data:any;try{data=JSON.parse(raw)}catch{continue}if(!res.ok||!data?.title||!data?.proof)continue;
          const latest=loadLocalState(userId)||current;const stillOpen=latest.quests.find(q=>q.id===nextOpen.id&&!q.done&&!q.aiGenerated);if(!stillOpen)continue;
          const next:AppState={...latest,quests:latest.quests.map(q=>q.id===stillOpen.id?{...q,title:String(data.title),proof:String(data.proof),xp:Math.max(30,Math.min(100,Number(data.xp)||q.xp)),aiGenerated:true,adaptationReason:String(data.reason||""),difficulty:data.difficulty,prerequisiteNote:String(data.prerequisiteNote||""),proofKinds:q.proofKinds||["text","number","link","photo","video"]}:q)};
          saveLocalState(next,userId);if(userId)await saveCloudState(userId,next);window.dispatchEvent(new CustomEvent("becomr-adaptive-trial-ready",{detail:next}));window.dispatchEvent(new CustomEvent("becomr-cycle-updated",{detail:next}));
        }catch(err){console.warn("BECOMR adaptive Trial fallback used",err)}finally{running.current.delete(path.id)}
      }
    }
    const onCycle=(event:Event)=>adaptState((event as CustomEvent<AppState>).detail);const initial=window.setTimeout(()=>adaptState(),1400);window.addEventListener("becomr-cycle-updated",onCycle);return()=>{window.clearTimeout(initial);window.removeEventListener("becomr-cycle-updated",onCycle)};
  },[]);
  return null;
}
