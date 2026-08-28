"use client";

import { useEffect,useRef } from "react";
import type { AppState,Quest } from "@/lib/types";

function label(q:Quest){
  if(q.kind==="weekly_trial")return "AI ALIGNING WEEKLY TRIAL…";
  if(q.kind==="weekly")return "AI ALIGNING WEEKLY BOSS…";
  return "AI ALIGNING NEXT TRIAL…";
}

export default function TaskAlignmentLayer(){
  const latest=useRef<AppState|null>(null);
  const timer=useRef<ReturnType<typeof setTimeout>|null>(null);

  useEffect(()=>{
    function clear(){
      document.querySelectorAll(".task-inline-aligning").forEach(el=>el.remove());
      document.querySelectorAll("[data-ai-aligning='true']").forEach(el=>el.removeAttribute("data-ai-aligning"));
    }

    function findCard(q:Quest,state:AppState){
      const pathName=state.paths.find(p=>p.id===q.pathId)?.name||"";
      const direct=[...document.querySelectorAll<HTMLElement>(".trial-row,.weekly-trial-row,.weekly-card")]
        .find(el=>el.textContent?.includes(q.title));
      if(direct)return direct;

      if(q.kind==="weekly"){
        const pathBoss=[...document.querySelectorAll<HTMLElement>(".generate-row,.weekly-trial-path")]
          .find(el=>pathName&&el.textContent?.includes(pathName));
        if(pathBoss)return pathBoss;
      }

      if(q.kind==="weekly_trial"){
        const pathGroup=[...document.querySelectorAll<HTMLElement>(".weekly-trial-path")]
          .find(el=>pathName&&el.textContent?.includes(pathName));
        if(pathGroup)return pathGroup;
      }
      return null;
    }

    function paint(){
      clear();
      const state=latest.current;if(!state)return;
      const pending=state.quests.filter(q=>q.aiPending&&!q.done);
      let weeklyUnplaced=false;

      for(const q of pending){
        const card=findCard(q,state);
        if(!card){if(q.kind==="weekly"||q.kind==="weekly_trial")weeklyUnplaced=true;continue}
        card.setAttribute("data-ai-aligning","true");
        const note=document.createElement("span");
        note.className="task-inline-aligning";
        note.innerHTML=`<i></i><b>${label(q)}</b><small>BECOMR is tailoring this mission to your current capability.</small>`;
        card.appendChild(note);
      }

      if(weeklyUnplaced){
        const dock=document.querySelector<HTMLElement>(".weekly-trial-dock");
        if(dock&&!dock.querySelector(".task-inline-aligning")){
          dock.setAttribute("data-ai-aligning","true");
          const note=document.createElement("span");
          note.className="task-inline-aligning task-inline-dock";
          note.innerHTML="<i></i><b>AI ALIGNING WEEKLY MISSIONS…</b>";
          dock.appendChild(note);
        }
      }
    }

    function schedule(){if(timer.current)clearTimeout(timer.current);timer.current=setTimeout(paint,60)}
    function onState(event:Event){const state=(event as CustomEvent<AppState>).detail;if(!state)return;latest.current=state;schedule()}

    const observer=new MutationObserver(()=>{if(latest.current?.quests.some(q=>q.aiPending&&!q.done))schedule()});
    observer.observe(document.body,{childList:true,subtree:true});
    window.addEventListener("becomr-cycle-updated",onState);
    return()=>{observer.disconnect();window.removeEventListener("becomr-cycle-updated",onState);if(timer.current)clearTimeout(timer.current);clear()};
  },[]);

  return null;
}
