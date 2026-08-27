"use client";

import { useEffect, useState } from "react";

type PageId="command"|"compass"|"weekly"|"archive"|"build";

const pages:{id:PageId;glyph:string;label:string;hint:string}[]=[
  {id:"command",glyph:"☀",label:"Command",hint:"Today's open Trials"},
  {id:"compass",glyph:"✥",label:"Compass",hint:"Your capability tree"},
  {id:"weekly",glyph:"◆",label:"Weekly",hint:"Trials, Bosses & progress"},
  {id:"archive",glyph:"☾",label:"Archive",hint:"Reflection & Save Points"},
  {id:"build",glyph:"◉",label:"Build",hint:"Level, XP & path development"}
];

export default function MobileAppShell(){
  const [open,setOpen]=useState(false);
  const [page,setPage]=useState<PageId>("command");

  useEffect(()=>{
    function sync(){
      const hash=window.location.hash.replace("#","") as PageId;
      if(pages.some(p=>p.id===hash))setPage(hash);
    }
    sync();
    window.addEventListener("hashchange",sync);
    return()=>window.removeEventListener("hashchange",sync);
  },[]);

  function navigate(id:PageId){
    const desktopButtons=[...document.querySelectorAll<HTMLButtonElement>(".instrument-nav button")];
    const target=desktopButtons.find(button=>button.textContent?.toLowerCase().includes(id));
    if(target)target.click();
    else window.location.hash=id;
    setPage(id);
    setOpen(false);
  }

  function action(name:string){
    window.dispatchEvent(new CustomEvent(name));
    setOpen(false);
  }

  const current=pages.find(p=>p.id===page)||pages[0];

  return <div className="mobile-app-shell" aria-label="BECOMR mobile navigation">
    <div className="mobile-app-bar">
      <div className="mobile-app-current"><span>{current.glyph}</span><div><small>CURRENT</small><strong>{current.label}</strong></div></div>
      <button className="mobile-menu-trigger" onClick={()=>setOpen(true)} aria-expanded={open}><i/><i/><span>MENU</span></button>
    </div>

    {open&&<div className="mobile-drawer-backdrop" onClick={()=>setOpen(false)}>
      <section className="mobile-drawer" onClick={e=>e.stopPropagation()} aria-modal="true" role="dialog">
        <header><div><small>BECOMR / NAVIGATION</small><h2>Where should the Compass point?</h2></div><button onClick={()=>setOpen(false)} aria-label="Close menu">×</button></header>
        <nav className="mobile-drawer-pages">
          {pages.map(item=><button key={item.id} className={page===item.id?"active":""} onClick={()=>navigate(item.id)}>
            <span>{item.glyph}</span><div><strong>{item.label}</strong><small>{item.hint}</small></div><b>→</b>
          </button>)}
        </nav>
        <div className="mobile-drawer-tools">
          <a href="/forge"><span>✦</span><div><strong>AI Forge</strong><small>Create another capability path</small></div><b>→</b></a>
          {page==="weekly"&&<>
            <button onClick={()=>action("becomr-open-weekly-trials")}><span>◇</span><div><strong>Weekly Trials</strong><small>Open this path week's Trials</small></div></button>
            <button onClick={()=>action("becomr-open-weekly-progress")}><span>▦</span><div><strong>Weekly Progress</strong><small>Past weeks, Bosses and Proof</small></div></button>
          </>}
          <button onClick={()=>action("becomr-open-tutorial")}><span>?</span><div><strong>How It Works</strong><small>Open the BECOMR quick tour</small></div></button>
          <button onClick={()=>action("becomr-install-app")}><span>↓</span><div><strong>Install BECOMR</strong><small>Add the app to your Home Screen</small></div></button>
          <button onClick={()=>action("becomr-open-continuation")}><span>✦</span><div><strong>Keep Going</strong><small>Open optional continuation challenges</small></div></button>
        </div>
      </section>
    </div>}
  </div>;
}
