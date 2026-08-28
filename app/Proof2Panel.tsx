"use client";

import { useEffect,useMemo,useState } from "react";
import { createPortal } from "react-dom";
import type { AppState,ProofArtifact,ProofKind } from "@/lib/types";
import { supabase,hasSupabaseConfig } from "@/lib/supabase";
import { loadLocalState,saveLocalState,saveCloudState } from "@/lib/storage";

const kinds:{id:ProofKind;label:string;placeholder:string}[]=[
  {id:"text",label:"NOTE",placeholder:"What happened?"},
  {id:"number",label:"NUMBER",placeholder:"Score, reps, time, makes/attempts…"},
  {id:"link",label:"LINK",placeholder:"https://…"},
  {id:"photo",label:"PHOTO",placeholder:"Paste a photo URL or cloud share link"},
  {id:"video",label:"VIDEO",placeholder:"Paste a video URL or cloud share link"},
  {id:"file",label:"FILE",placeholder:"Paste a file/share URL"}
];

export default function Proof2Panel(){
  const [target,setTarget]=useState<HTMLElement|null>(null);
  const [title,setTitle]=useState("");
  const [kind,setKind]=useState<ProofKind>("text");
  const [value,setValue]=useState("");
  const [artifacts,setArtifacts]=useState<ProofArtifact[]>([]);
  const [userId,setUserId]=useState<string|null>(null);

  useEffect(()=>{(async()=>{if(hasSupabaseConfig&&supabase){const {data:{session}}=await supabase.auth.getSession();setUserId(session?.user?.id||null)}})()},[]);
  useEffect(()=>{
    const scan=()=>{
      const sheet=document.querySelector<HTMLElement>(".proof-sheet");
      const heading=sheet?.querySelector("h2")?.textContent?.trim()||"";
      setTarget(sheet||null);setTitle(heading);
    };
    scan();const observer=new MutationObserver(scan);observer.observe(document.body,{childList:true,subtree:true});return()=>observer.disconnect();
  },[]);

  useEffect(()=>{
    if(!title){setArtifacts([]);return}
    const state=loadLocalState(userId);const q=state?.quests.find(x=>x.title===title&&!x.done);setArtifacts(q?.evidenceArtifacts||[]);
  },[title,userId]);

  const activeKind=useMemo(()=>kinds.find(k=>k.id===kind)!,[kind]);

  async function persist(nextArtifacts:ProofArtifact[]){
    const state=loadLocalState(userId);if(!state||!title)return;
    const next:AppState={...state,quests:state.quests.map(q=>q.title===title&&!q.done?{...q,evidenceArtifacts:nextArtifacts}:q)};
    setArtifacts(nextArtifacts);saveLocalState(next,userId);if(userId)await saveCloudState(userId,next);window.dispatchEvent(new CustomEvent("becomr-cycle-updated",{detail:next}));
  }
  async function add(){if(!value.trim())return;const artifact:ProofArtifact={id:`proof-${Date.now()}`,kind,value:value.trim(),createdAt:new Date().toISOString()};await persist([...artifacts,artifact]);setValue("")}
  async function remove(id:string){await persist(artifacts.filter(a=>a.id!==id))}

  if(!target||!title)return null;
  return createPortal(<div className="proof2-panel">
    <div className="proof2-head"><div><small>PROOF 2.0 / EVIDENCE</small><strong>Attach measurable evidence</strong></div><span>{artifacts.length} ITEM{artifacts.length===1?"":"S"}</span></div>
    <div className="proof2-kinds">{kinds.map(k=><button type="button" className={kind===k.id?"active":""} key={k.id} onClick={()=>setKind(k.id)}>{k.label}</button>)}</div>
    <div className="proof2-entry"><input value={value} onChange={e=>setValue(e.target.value)} placeholder={activeKind.placeholder} onKeyDown={e=>{if(e.key==="Enter"){e.preventDefault();add()}}}/><button type="button" onClick={add}>ADD</button></div>
    {artifacts.length>0&&<div className="proof2-artifacts">{artifacts.map(a=><div key={a.id}><span>{a.kind.toUpperCase()}</span><p>{a.value}</p><button type="button" onClick={()=>remove(a.id)}>×</button></div>)}</div>}
    <p className="proof2-note">Photo, video and file evidence currently stores a shareable reference/link with the Quest. Direct media storage can be added without changing the Proof data model.</p>
  </div>,target);
}
