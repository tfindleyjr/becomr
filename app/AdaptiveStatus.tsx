"use client";

import { useEffect,useRef,useState } from "react";

type Status={pathName:string;status:"loading"|"ready"|"fallback";title?:string};

export default function AdaptiveStatus(){
  const [items,setItems]=useState<Record<string,Status>>({});
  const timers=useRef<Record<string,ReturnType<typeof setTimeout>>>({});

  useEffect(()=>{
    function onStatus(event:Event){
      const detail=(event as CustomEvent<{pathId:string;pathName:string;status:Status["status"];title?:string}>).detail;
      if(!detail?.pathId)return;
      const {pathId,...status}=detail;
      setItems(prev=>({...prev,[pathId]:status}));
      if(timers.current[pathId])clearTimeout(timers.current[pathId]);
      if(detail.status!=="loading"){
        timers.current[pathId]=setTimeout(()=>setItems(prev=>{const next={...prev};delete next[pathId];return next}),2600);
      }
    }
    window.addEventListener("becomr-adaptive-status",onStatus);
    return()=>{
      window.removeEventListener("becomr-adaptive-status",onStatus);
      Object.values(timers.current).forEach(clearTimeout);
    };
  },[]);

  const values=Object.entries(items);
  if(values.length===0)return null;

  return <div className="adaptive-status-stack" aria-live="polite">
    {values.map(([id,item])=><div key={id} className={`adaptive-status adaptive-${item.status}`}>
      <span className="adaptive-orbit" aria-hidden>{item.status==="loading"?"✦":item.status==="ready"?"◆":"◇"}</span>
      <div>
        <small>{item.status==="loading"?"BECOMR / ADAPTING":item.status==="ready"?"NEXT TRIAL ALIGNED":"FALLBACK ACTIVE"}</small>
        <strong>{item.status==="loading"?`Aligning ${item.pathName}…`:item.status==="ready"?(item.title||`${item.pathName} updated`):`${item.pathName} remains available`}</strong>
        <p>{item.status==="loading"?"Reading your Proof, current node, recent resistance, and path progress.":item.status==="ready"?"Your next challenge has been tailored to your current progression.":"AI could not adapt this one, so BECOMR kept the valid progression Trial instead."}</p>
      </div>
      {item.status==="loading"&&<i className="adaptive-progress"/>}
    </div>)}
  </div>;
}
