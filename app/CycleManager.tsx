"use client";

import { useEffect, useRef } from "react";
import { supabase, hasSupabaseConfig } from "@/lib/supabase";
import { loadLocalState, saveCloudState, saveLocalState } from "@/lib/storage";
import { cycleStateChanged, ensureCurrentCycles } from "@/lib/cycles";

export default function CycleManager(){
  const running=useRef(false);

  useEffect(()=>{
    async function reconcile(){
      if(running.current)return;
      running.current=true;
      try{
        let userId:string|null=null;
        if(hasSupabaseConfig&&supabase){
          const {data:{session}}=await supabase.auth.getSession();
          userId=session?.user?.id||null;
        }

        const current=loadLocalState(userId);
        if(!current)return;
        const next=ensureCurrentCycles(current,new Date());
        if(!cycleStateChanged(current,next))return;

        saveLocalState(next,userId);
        if(userId)await saveCloudState(userId,next);
        window.dispatchEvent(new CustomEvent("becomr-cycle-updated",{detail:next}));
      }catch(err){
        console.warn("BECOMR cycle reconciliation failed",err);
      }finally{
        running.current=false;
      }
    }

    const initial=window.setTimeout(reconcile,900);
    const onVisible=()=>{if(document.visibilityState==="visible")reconcile()};
    const onFocus=()=>reconcile();
    document.addEventListener("visibilitychange",onVisible);
    window.addEventListener("focus",onFocus);

    return()=>{
      window.clearTimeout(initial);
      document.removeEventListener("visibilitychange",onVisible);
      window.removeEventListener("focus",onFocus);
    };
  },[]);

  return null;
}
