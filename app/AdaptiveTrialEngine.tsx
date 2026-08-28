"use client";

import { useEffect, useRef } from "react";
import type { AppState } from "@/lib/types";
import { supabase, hasSupabaseConfig } from "@/lib/supabase";
import { loadLocalState, saveCloudState, saveLocalState } from "@/lib/storage";
import { currentNodeIndex, pathProgress } from "@/lib/progression";

export default function AdaptiveTrialEngine(){
  const running=useRef(new Set<string>());

  useEffect(()=>{
    async function persist(next:AppState,userId:string|null){
      saveLocalState(next,userId);
      if(userId)await saveCloudState(userId,next);
      window.dispatchEvent(new CustomEvent("becomr-cycle-updated",{detail:next}));
    }

    async function adaptState(input?:AppState){
      let userId:string|null=null;
      if(hasSupabaseConfig&&supabase){const {data:{session}}=await supabase.auth.getSession();userId=session?.user?.id||null}
      const current=loadLocalState(userId)||input;if(!current)return;

      for(const path of current.paths){
        if(path.paused||running.current.has(path.id))continue;
        const nextOpen=current.quests.find(q=>q.pathId===path.id&&(q.kind==="daily"||q.kind==="boss")&&!q.done);
        if(!nextOpen||nextOpen.aiGenerated||nextOpen.aiPending)continue;

        const recentProofs=current.quests
          .filter(q=>q.pathId===path.id&&q.done&&q.completedAt)
          .sort((a,b)=>String(b.completedAt).localeCompare(String(a.completedAt)))
          .slice(0,6)
          .map(q=>({title:q.title,evidence:q.evidence||""}));

        running.current.add(path.id);

        // Mark the exact mission as aligning before the API call. This also covers
        // the very first Trial created after installing a Creator Tree.
        const pendingBase=loadLocalState(userId)||current;
        const pending:AppState={...pendingBase,quests:pendingBase.quests.map(q=>q.id===nextOpen.id?{...q,aiPending:true}:q)};
        await persist(pending,userId);
        window.dispatchEvent(new CustomEvent("becomr-adaptive-status",{detail:{pathId:path.id,pathName:path.name,status:"loading"}}));

        try{
          const nodeIndex=currentNodeIndex(pending,path);const node=path.nodes[Math.min(nodeIndex,path.nodes.length-1)];const latestArchive=pending.archive[0]||null;const weekNumber=pending.pathWeeks?.[path.id]?.weekNumber||1;
          const res=await fetch("/api/ai/next-trial",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({path:{name:path.name,capability:path.capability},currentNode:node?.title||path.name,recentProofs,archive:latestArchive,weekNumber,progress:pathProgress(pending,path),capacity:path.capacity||"steady"})});
          const raw=await res.text();if(!raw)throw new Error("Empty adaptive response");let data:any;try{data=JSON.parse(raw)}catch{throw new Error("Invalid adaptive response")}if(!res.ok||!data?.title||!data?.proof)throw new Error(data?.error||"Adaptive Trial unavailable");

          const latest=loadLocalState(userId)||pending;const stillOpen=latest.quests.find(q=>q.id===nextOpen.id&&!q.done);if(!stillOpen)continue;
          const next:AppState={...latest,quests:latest.quests.map(q=>q.id===stillOpen.id?{...q,title:String(data.title),proof:String(data.proof),xp:Math.max(30,Math.min(100,Number(data.xp)||q.xp)),aiGenerated:true,aiPending:false,adaptationReason:String(data.reason||""),difficulty:data.difficulty,prerequisiteNote:String(data.prerequisiteNote||""),proofKinds:q.proofKinds||["text","number","link","photo","video"]}:q)};
          await persist(next,userId);
          window.dispatchEvent(new CustomEvent("becomr-adaptive-trial-ready",{detail:next}));
          window.dispatchEvent(new CustomEvent("becomr-adaptive-status",{detail:{pathId:path.id,pathName:path.name,status:"ready",title:String(data.title)}}));
        }catch(err){
          console.warn("BECOMR adaptive Trial fallback used",err);
          const latest=loadLocalState(userId)||pending;
          const fallback:AppState={...latest,quests:latest.quests.map(q=>q.id===nextOpen.id?{...q,aiPending:false}:q)};
          await persist(fallback,userId);
          window.dispatchEvent(new CustomEvent("becomr-adaptive-status",{detail:{pathId:path.id,pathName:path.name,status:"fallback"}}));
        }finally{running.current.delete(path.id)}
      }
    }

    const onCycle=(event:Event)=>adaptState((event as CustomEvent<AppState>).detail);
    const initial=window.setTimeout(()=>adaptState(),700);
    window.addEventListener("becomr-cycle-updated",onCycle);
    return()=>{window.clearTimeout(initial);window.removeEventListener("becomr-cycle-updated",onCycle)};
  },[]);
  return null;
}
