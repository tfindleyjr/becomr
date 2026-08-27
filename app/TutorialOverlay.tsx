"use client";

import { useEffect, useState } from "react";

type Step = { glyph:string; title:string; text:string };

const steps:Step[]=[
  {glyph:"☀",title:"COMMAND",text:"Your daily starting point. Choose a Trial, do it in real life, then record Proof so BECOMR knows you actually progressed."},
  {glyph:"✥",title:"COMPASS",text:"Your skill map. Each path creates a branch, and that branch develops as your Proven capability grows."},
  {glyph:"◆",title:"WEEKLY",text:"Your bigger challenges. Weekly Bosses push a path forward with a more meaningful result than a normal daily Trial."},
  {glyph:"☾",title:"ARCHIVE",text:"Your reflection log. Save what became easier, what resisted you, and where you want the Compass to point next."},
  {glyph:"◉",title:"BUILD",text:"Your current character sheet. See your level, XP, paths, Proven work, and cloud status in one place."}
];

const KEY="becomr-tutorial-seen";
const READY="becomr-tutorial-ready";

export default function TutorialOverlay(){
  const [open,setOpen]=useState(false);
  const [step,setStep]=useState(0);

  useEffect(()=>{
    const timer=setTimeout(()=>{
      const isAuth=Boolean(document.querySelector(".auth-shell"));
      const isEmpty=Boolean(document.querySelector(".first-bearing"));
      const tutorialReady=localStorage.getItem(READY)==="true";
      if(!isAuth&&!isEmpty&&tutorialReady&&!localStorage.getItem(KEY))setOpen(true);
    },300);
    const onOpen=()=>{setStep(0);setOpen(true)};
    window.addEventListener("becomr-open-tutorial",onOpen);
    return()=>{clearTimeout(timer);window.removeEventListener("becomr-open-tutorial",onOpen)};
  },[]);

  function finish(){
    localStorage.setItem(KEY,"true");
    setOpen(false);
  }

  function restart(){setStep(0);setOpen(true)}
  const current=steps[step];

  return <>
    <button className="tutorial-launch-global" onClick={restart}>HOW IT WORKS</button>
    {open&&<div className="tutorial-backdrop-global">
      <section className="tutorial-card-global" aria-modal="true" role="dialog">
        <div className="tutorial-top-global"><div className="tutorial-sigil-global"><span>{current.glyph}</span></div><button className="tutorial-close-global" onClick={finish} aria-label="Close tutorial">×</button></div>
        <p className="tutorial-eyebrow-global">BECOMR / QUICK TOUR</p>
        <h2>{current.title}</h2>
        <p className="tutorial-copy-global">{current.text}</p>
        <div className="tutorial-dots-global" aria-label={`Step ${step+1} of ${steps.length}`}>{steps.map((item,i)=><button key={item.title} className={i===step?"active":""} onClick={()=>setStep(i)} aria-label={`Go to ${item.title}`}/>)}</div>
        <div className="tutorial-actions-global"><button disabled={step===0} onClick={()=>setStep(s=>Math.max(0,s-1))}>BACK</button><span>{step+1} / {steps.length}</span><button onClick={()=>step===steps.length-1?finish():setStep(s=>s+1)}>{step===steps.length-1?"FINISH":"NEXT"}</button></div>
      </section>
    </div>}
  </>;
}
