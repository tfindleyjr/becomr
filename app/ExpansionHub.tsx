"use client";

import { useEffect,useMemo,useRef,useState } from "react";
import type { AppState,SkillPath } from "@/lib/types";
import { supabase,hasSupabaseConfig } from "@/lib/supabase";
import { loadLocalState,saveLocalState,saveCloudState } from "@/lib/storage";
import { ensureCurrentCycles } from "@/lib/cycles";
import { deriveConstellations,deriveMarks,templateToPath,treeTemplates,type Mark } from "@/lib/expansion";
import { pathProgress } from "@/lib/progression";

type View="marks"|"constellations"|"notifications"|"share"|"market";
const NOTIFY_KEY="becomr-notification-preferences";
const MARK_KEY="becomr-earned-marks-seen";

type NotifyPrefs={enabled:boolean;daily:boolean;weekly:boolean;milestones:boolean};
const defaultPrefs:NotifyPrefs={enabled:false,daily:true,weekly:true,milestones:true};

export default function ExpansionHub(){
  const [state,setState]=useState<AppState|null>(null);
  const [userId,setUserId]=useState<string|null>(null);
  const [open,setOpen]=useState(false);
  const [view,setView]=useState<View>("marks");
  const [ceremony,setCeremony]=useState<Mark|null>(null);
  const [prefs,setPrefs]=useState<NotifyPrefs>(defaultPrefs);
  const initialized=useRef(false);

  useEffect(()=>{
    (async()=>{
      let uid:string|null=null;
      if(hasSupabaseConfig&&supabase){const {data:{session}}=await supabase.auth.getSession();uid=session?.user?.id||null}
      setUserId(uid);setState(loadLocalState(uid));
      try{setPrefs({...defaultPrefs,...JSON.parse(localStorage.getItem(NOTIFY_KEY)||"{}")})}catch{}
      initialized.current=true;
    })();
    const onState=(e:Event)=>{const next=(e as CustomEvent<AppState>).detail;if(next)setState(next)};
    const openView=(e:Event)=>{const next=(e as CustomEvent<View>).detail;if(next)setView(next);setOpen(true)};
    window.addEventListener("becomr-cycle-updated",onState);
    window.addEventListener("becomr-open-expansion",openView);
    return()=>{window.removeEventListener("becomr-cycle-updated",onState);window.removeEventListener("becomr-open-expansion",openView)};
  },[]);

  const marks=useMemo(()=>state?deriveMarks(state):[],[state]);
  const constellations=useMemo(()=>state?deriveConstellations(state):[],[state]);

  useEffect(()=>{
    if(!initialized.current||!state)return;
    const earned=marks.filter(m=>m.earned);
    let seen:string[]=[];try{seen=JSON.parse(localStorage.getItem(MARK_KEY)||"[]")}catch{}
    const fresh=earned.find(m=>!seen.includes(m.id));
    if(fresh){setCeremony(fresh);localStorage.setItem(MARK_KEY,JSON.stringify([...seen,fresh.id]));if(prefs.enabled&&prefs.milestones)notify("BECOMR — Mark Earned",fresh.title)}
  },[marks,state,prefs.enabled,prefs.milestones]);

  useEffect(()=>{
    if(!state||!prefs.enabled||typeof document==="undefined")return;
    const check=()=>{
      if(document.visibilityState!=="visible")return;
      const openDaily=state.quests.filter(q=>(q.kind==="daily"||q.kind==="boss")&&!q.done).length;
      const bosses=state.quests.filter(q=>q.kind==="weekly"&&!q.done).length;
      const today=new Date().toDateString();
      if(prefs.daily&&openDaily&&localStorage.getItem("becomr-notified-day")!==today){notify("Your Compass has open directions",`${openDaily} Trial${openDaily===1?"":"s"} ready for Proof.`);localStorage.setItem("becomr-notified-day",today)}
      if(prefs.weekly&&bosses&&localStorage.getItem("becomr-notified-boss")!==today){notify("A Weekly Boss is open",`${bosses} Boss challenge${bosses===1?" is":"s are"} ready.`);localStorage.setItem("becomr-notified-boss",today)}
    };
    const timer=window.setTimeout(check,1800);document.addEventListener("visibilitychange",check);window.addEventListener("focus",check);
    return()=>{window.clearTimeout(timer);document.removeEventListener("visibilitychange",check);window.removeEventListener("focus",check)};
  },[state,prefs]);

  function notify(title:string,body:string){
    if("Notification" in window&&Notification.permission==="granted"){
      if("serviceWorker" in navigator){
        navigator.serviceWorker.ready.then(reg=>reg.showNotification(title,{body,icon:"/assets/becomr-compass-tree.png",badge:"/assets/becomr-compass-tree.png"})).catch(()=>{new Notification(title,{body})});
      }else new Notification(title,{body});
    }
  }

  async function enableNotifications(){
    if(!("Notification" in window))return;
    const result=await Notification.requestPermission();
    const next={...prefs,enabled:result==="granted"};setPrefs(next);localStorage.setItem(NOTIFY_KEY,JSON.stringify(next));
  }
  function updatePrefs(next:NotifyPrefs){setPrefs(next);localStorage.setItem(NOTIFY_KEY,JSON.stringify(next))}

  async function persist(next:AppState){setState(next);saveLocalState(next,userId);if(userId)await saveCloudState(userId,next);window.dispatchEvent(new CustomEvent("becomr-cycle-updated",{detail:next}))}
  async function installTemplate(id:string){
    if(!state)return;const t=treeTemplates.find(x=>x.id===id);if(!t)return;
    const path=templateToPath(t);const next=ensureCurrentCycles({...state,paths:[...state.paths,path]},new Date());await persist(next);setView("marks");
  }

  function buildSummary(){
    if(!state)return "BECOMR";
    const top=[...state.paths].sort((a,b)=>pathProgress(state,b)-pathProgress(state,a)).slice(0,4);
    return `BECOMR — BECOME CAPABLE\n${state.xp} XP · ${state.quests.filter(q=>q.done).length} Proofs · ${state.paths.length} Paths\n${top.map(p=>`${p.glyph} ${p.name}: ${pathProgress(state,p)}%`).join("\n")}\n\nFind your direction. Grow into it.`;
  }
  async function shareBuild(){const text=buildSummary();if(navigator.share){try{await navigator.share({title:"My BECOMR Build",text});return}catch{}}await navigator.clipboard?.writeText(text)}
  function exportPath(path:SkillPath){
    const payload={format:"becomr-tree-v1",creator:"BECOMR user",title:path.name,glyph:path.glyph,description:path.capability,capability:path.capability,region:path.region,nodes:path.nodes.map(n=>({title:n.title,xpRequired:n.xpRequired,boss:Boolean(n.boss)})),tags:[]};
    const blob=new Blob([JSON.stringify(payload,null,2)],{type:"application/json"});const url=URL.createObjectURL(blob);const a=document.createElement("a");a.href=url;a.download=`${path.name.toLowerCase().replace(/[^a-z0-9]+/g,"-")}-becomr-tree.json`;a.click();URL.revokeObjectURL(url);
  }

  if(!state)return null;
  const earnedCount=marks.filter(m=>m.earned).length;
  const unlockedConstellations=constellations.filter(c=>c.unlocked);

  return <>
    <button className="expansion-launch" onClick={()=>{setView("marks");setOpen(true)}}><span>✥</span><div><small>BUILD LAYER</small><strong>{earnedCount} MARKS · {unlockedConstellations.length} CONSTELLATIONS</strong></div></button>

    {ceremony&&<div className="mark-ceremony" onClick={()=>setCeremony(null)}><section onClick={e=>e.stopPropagation()}><div className="ceremony-rings"><span>{ceremony.glyph}</span></div><p className="kicker">MARK EARNED</p><h2>{ceremony.title}</h2><p>{ceremony.description}</p><button onClick={()=>setCeremony(null)}>INSCRIBE MARK</button></section></div>}

    {open&&<div className="expansion-backdrop" onClick={()=>setOpen(false)}><section className="expansion-sheet" onClick={e=>e.stopPropagation()}>
      <button className="expansion-close" onClick={()=>setOpen(false)}>×</button>
      <header><p className="kicker">BECOMR / EXPANDED BUILD</p><h2>Capability leaves a <em>record.</em></h2></header>
      <nav className="expansion-tabs">{(["marks","constellations","notifications","share","market"] as View[]).map(v=><button key={v} className={view===v?"active":""} onClick={()=>setView(v)}>{v.toUpperCase()}</button>)}</nav>
      {view==="marks"&&<div className="marks-grid">{marks.map(m=><article key={m.id} className={m.earned?"earned":"sealed"}><span>{m.glyph}</span><small>{m.earned?"INSCRIBED":"SEALED"}</small><h3>{m.title}</h3><p>{m.description}</p></article>)}</div>}
      {view==="constellations"&&<div className="constellation-grid">{constellations.map(c=><article key={c.id} className={c.unlocked?"unlocked":"sealed"}><span>{c.glyph}</span><small>{c.unlocked?"CONSTELLATION FOUND":"REQUIRES TWO DEVELOPED PATHS"}</small><h3>{c.title}</h3><p>{c.description}</p>{c.pathIds.length>0&&<div>{c.pathIds.map(id=><b key={id}>{state.paths.find(p=>p.id===id)?.name}</b>)}</div>}</article>)}</div>}
      {view==="notifications"&&<div className="notification-panel"><h3>Reorientation, not nagging.</h3><p>BECOMR can surface open Trials, unlocked Bosses, and new Marks when the app is available. Browser/PWA notifications are opt-in.</p><button className="expansion-primary" onClick={enableNotifications}>{prefs.enabled?"NOTIFICATIONS ENABLED":"ENABLE NOTIFICATIONS"}</button>{prefs.enabled&&<div className="notification-toggles"><label><input type="checkbox" checked={prefs.daily} onChange={e=>updatePrefs({...prefs,daily:e.target.checked})}/>Open Daily Trials</label><label><input type="checkbox" checked={prefs.weekly} onChange={e=>updatePrefs({...prefs,weekly:e.target.checked})}/>Weekly Bosses</label><label><input type="checkbox" checked={prefs.milestones} onChange={e=>updatePrefs({...prefs,milestones:e.target.checked})}/>Marks & Milestones</label></div>}<small>Background scheduled push delivery still requires a production push service; this build notifies on app open/focus and supported PWA sessions.</small></div>}
      {view==="share"&&<div className="share-build"><div className="share-card"><img src="/assets/becomr-compass-tree.png" alt=""/><p>BECOMR / CURRENT BUILD</p><h3>LVL {Math.floor(state.xp/500)+1}</h3><strong>{state.xp} XP · {state.quests.filter(q=>q.done).length} PROVEN</strong>{state.paths.slice(0,5).map(p=><div key={p.id}><span>{p.glyph} {p.name}</span><b>{pathProgress(state,p)}%</b></div>)}</div><button className="expansion-primary" onClick={shareBuild}>SHARE BUILD</button><p className="expansion-note">Uses the device share sheet when available; otherwise copies a concise Build summary.</p></div>}
      {view==="market"&&<div className="market-wrap"><div className="market-intro"><div><small>CREATOR TREES / V1</small><h3>Install a proven direction.</h3></div><p>Templates provide the structure; BECOMR still adapts Trials to the individual after installation.</p></div><div className="market-grid">{treeTemplates.map(t=><article key={t.id}><span>{t.glyph}</span><small>{t.creator} · {t.tags.join(" / ")}</small><h3>{t.title}</h3><p>{t.description}</p><footer><b>{t.nodes.length} NODES</b><button onClick={()=>installTemplate(t.id)}>INSCRIBE TREE</button></footer></article>)}</div>{state.paths.length>0&&<div className="creator-export"><small>CREATOR MODE</small><h3>Turn one of your Paths into a tree blueprint.</h3><div>{state.paths.map(p=><button key={p.id} onClick={()=>exportPath(p)}><span>{p.glyph}</span>{p.name}<b>EXPORT</b></button>)}</div><p>Phase 30 starts with portable creator blueprints and an installable catalog. Public publishing, ratings and paid creator payouts require the production marketplace backend.</p></div>}</div>}
    </section></div>}
  </>;
}
