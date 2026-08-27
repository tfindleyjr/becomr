"use client";

import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import AIForge from "../AIForge";
import { seedState } from "@/data/seed";
import type { AppState, Quest, SkillPath } from "@/lib/types";
import { supabase, hasSupabaseConfig } from "@/lib/supabase";
import { loadLocalState, saveCloudState, saveLocalState, hydrateStateForUser } from "@/lib/storage";

export default function ForgePage(){
  const [state,setState]=useState<AppState>(seedState);
  const [user,setUser]=useState<User|null>(null);
  const [ready,setReady]=useState(false);
  const [saved,setSaved]=useState(false);

  useEffect(()=>{
    (async()=>{
      if(hasSupabaseConfig && supabase){
        const {data:{session}}=await supabase.auth.getSession();
        const u=session?.user||null;
        setUser(u);
        if(u){
          const hydrated=await hydrateStateForUser(u.id,seedState);
          setState(hydrated.state);
        }else{
          const local=loadLocalState(); if(local)setState(local);
        }
      }else{
        const local=loadLocalState(); if(local)setState(local);
      }
      setReady(true);
    })();
  },[]);

  async function addGenerated(path:SkillPath,quests:Quest[]){
    const exists=state.paths.some(p=>p.id===path.id);
    const next:AppState={
      ...state,
      paths: exists ? state.paths.map(p=>p.id===path.id?path:p) : [...state.paths,path],
      quests:[...state.quests,...quests]
    };
    setState(next);
    saveLocalState(next,user?.id);
    if(user) await saveCloudState(user.id,next);
    if(typeof window!=="undefined"){
      localStorage.setItem("becomr-tutorial-ready","true");
      if(state.paths.length===0)localStorage.removeItem("becomr-tutorial-seen");
    }
    setSaved(true);
  }

  if(!ready) return <main className="forge-page"><p className="forge-loading">ALIGNING THE FORGE…</p></main>;

  return <main className="forge-page">
    <div className="noise"/>
    <header className="forge-header">
      <a href="/" className="forge-brand">BECOMR <span>✥</span></a>
      <div>
        {saved&&<span className="forge-saved">✦ PATH INSCRIBED</span>}
        <a href="/">{saved?"VIEW MY BECOMR":"RETURN TO BECOMR"}</a>
      </div>
    </header>

    <div className="forge-intro">
      <p className="kicker">INTELLIGENCE BEHIND THE COMPASS</p>
      <h1>Describe the person you want to <em>become.</em></h1>
      <p>The Forge creates a practical progression path. Nothing is added until you review it and choose to inscribe it.</p>
    </div>

    <AIForge onAdd={addGenerated}/>

    {saved&&<div className="forge-next-step">
      <p className="kicker">FIRST BRANCH CREATED</p>
      <h2>Your Compass has changed.</h2>
      <p>The new path, first Trial, and Weekly Boss are now part of the same build.</p>
      <a href="/#compass">SEE IT ON MY COMPASS →</a>
    </div>}
  </main>;
}
