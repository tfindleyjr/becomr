"use client";

import { useEffect, useState } from "react";
import type { AppState } from "@/lib/types";
import { supabase,hasSupabaseConfig } from "@/lib/supabase";
import { loadLocalState,saveLocalState,saveCloudState } from "@/lib/storage";

export default function PathControlCenter(){
  const [state,setState]=useState<AppState|null>(null);
  const [userId,setUserId]=useState<string|null>(null);
  const [visible,setVisible]=useState(false);
  const [open,setOpen]=useState(false);
  const [editing,setEditing]=useState<string|null>(null);
  const [name,setName]=useState("");
  const [capability,setCapability]=useState("");
  const [capacity,setCapacity]=useState<"low"|"steady"|"high">("steady");

  useEffect(()=>{
    function sync(){setVisible(window.location.hash==="#build")}
    sync();window.addEventListener("hashchange",sync);return()=>window.removeEventListener("hashchange",sync)
  },[]);
  useEffect(()=>{if(!visible)return;(async()=>{let uid:string|null=null;if(hasSupabaseConfig&&supabase){const {data:{session}}=await supabase.auth.getSession();uid=session?.user?.id||null}setUserId(uid);setState(loadLocalState(uid))})()},[visible,open]);

  async function persist(next:AppState){setState(next);saveLocalState(next,userId);if(userId)await saveCloudState(userId,next);window.dispatchEvent(new CustomEvent("becomr-cycle-updated",{detail:next}))}
  function begin(id:string){const p=state?.paths.find(x=>x.id===id);if(!p)return;setEditing(id);setName(p.name);setCapability(p.capability);setCapacity(p.capacity||"steady")}
  async function save(){if(!state||!editing)return;await persist({...state,paths:state.paths.map(p=>p.id===editing?{...p,name:name.trim()||p.name,capability:capability.trim()||p.capability,capacity}:p)});setEditing(null)}
  async function pause(id:string){if(!state)return;await persist({...state,paths:state.paths.map(p=>p.id===id?{...p,paused:!p.paused}:p)})}
  async function move(id:string,dir:-1|1){if(!state)return;const paths=[...state.paths];const i=paths.findIndex(p=>p.id===id);const j=i+dir;if(i<0||j<0||j>=paths.length)return;[paths[i],paths[j]]=[paths[j],paths[i]];await persist({...state,paths})}
  async function remove(id:string){if(!state||!confirm("Delete this path? Its quests and active progression will be removed. Weekly history already archived will remain."))return;const paths=state.paths.filter(p=>p.id!==id);const quests=state.quests.filter(q=>q.pathId!==id);const pathWeeks={...(state.pathWeeks||{})};delete pathWeeks[id];await persist({...state,paths,quests,pathWeeks})}

  if(!visible||!state||state.paths.length===0)return null;
  return <>
    <button className="path-control-launch" onClick={()=>setOpen(true)}>PATH CONTROLS</button>
    {open&&<div className="path-control-backdrop" onClick={()=>setOpen(false)}><section className="path-control-sheet" onClick={e=>e.stopPropagation()}>
      <button className="path-control-close" onClick={()=>setOpen(false)}>×</button>
      <p className="kicker">BUILD / PATH CONTROL</p><h2>Your direction is <em>editable.</em></h2><p className="path-control-copy">Pause what is not active, change how a path is framed, reorder your priorities, or remove a direction entirely. BECOMR adapts around your choices.</p>
      <div className="path-control-list">{state.paths.map((p,i)=><article key={p.id} className={p.paused?"paused":""}>
        <div className="path-control-main"><span>{p.glyph}</span><div><small>{p.paused?"PAUSED":"ACTIVE"} · {p.capacity||"steady"} CAPACITY</small><strong>{p.name}</strong><p>{p.capability}</p></div></div>
        <div className="path-control-actions"><button onClick={()=>move(p.id,-1)} disabled={i===0}>↑</button><button onClick={()=>move(p.id,1)} disabled={i===state.paths.length-1}>↓</button><button onClick={()=>begin(p.id)}>EDIT</button><button onClick={()=>pause(p.id)}>{p.paused?"RESUME":"PAUSE"}</button><button className="danger" onClick={()=>remove(p.id)}>DELETE</button></div>
      </article>)}</div>
    </section></div>}
    {editing&&<div className="path-control-backdrop"><section className="path-edit-sheet"><button className="path-control-close" onClick={()=>setEditing(null)}>×</button><p className="kicker">EDIT PATH</p><h2>Refine the <em>bearing.</em></h2><label>PATH NAME<input value={name} onChange={e=>setName(e.target.value)}/></label><label>CAPABILITY<input value={capability} onChange={e=>setCapability(e.target.value)}/></label><label>CAPACITY<select value={capacity} onChange={e=>setCapacity(e.target.value as any)}><option value="low">Low</option><option value="steady">Steady</option><option value="high">High</option></select></label><button className="ritual-button" onClick={save}>SAVE PATH</button></section></div>}
  </>;
}
