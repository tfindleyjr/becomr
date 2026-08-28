import type { AppState, CycleSnapshot, Quest, SkillPath } from "./types";
import { currentNodeIndex, pathEarnedXp, pathProgress } from "./progression";

function pad(n:number){return String(n).padStart(2,"0")}

export function localDayKey(date=new Date()){
  return `${date.getFullYear()}-${pad(date.getMonth()+1)}-${pad(date.getDate())}`;
}

export function isoWeekKey(date=new Date()){
  const d=new Date(date.getFullYear(),date.getMonth(),date.getDate());
  const day=(d.getDay()+6)%7;
  d.setDate(d.getDate()-day+3);
  const firstThursday=new Date(d.getFullYear(),0,4);
  const firstDay=(firstThursday.getDay()+6)%7;
  firstThursday.setDate(firstThursday.getDate()-firstDay+3);
  const week=1+Math.round((d.getTime()-firstThursday.getTime())/604800000);
  return `${d.getFullYear()}-W${pad(week)}`;
}

function pathWeekKey(pathId:string,weekNumber:number){return `path-${pathId}-week-${weekNumber}`}
function isPathWeekKey(q:Quest){return Boolean(q.cycleKey?.startsWith(`path-${q.pathId}-week-`))}

function snapshotPathWeek(state:AppState,path:SkillPath,cycleKey:string,weekNumber:number):CycleSnapshot{
  const relevant=state.quests.filter(q=>q.pathId===path.id&&q.cycleType==="week"&&q.cycleKey===cycleKey);
  const idx=currentNodeIndex(state,path);
  const bosses=relevant.filter(q=>q.kind==="weekly"&&q.done).map(q=>({title:q.title,xp:q.xp}));
  return {
    id:`week-${path.id}-${weekNumber}`,type:"week",cycleKey,weekNumber,closedAt:new Date().toISOString(),
    proven:relevant.filter(q=>q.done).length,
    earnedXp:relevant.filter(q=>q.done).reduce((sum,q)=>sum+q.xp,0),
    quests:relevant.map(q=>({id:q.id,pathId:q.pathId,title:q.title,kind:q.kind,xp:q.xp,done:Boolean(q.done),pathWeekNumber:q.pathWeekNumber,evidence:q.evidence,evidenceArtifacts:q.evidenceArtifacts,completedAt:q.completedAt})),
    paths:[{pathId:path.id,pathName:path.name,glyph:path.glyph,weekNumber,earnedXp:pathEarnedXp(state,path.id),progress:pathProgress(state,path),nodeTitle:path.nodes[Math.min(idx,path.nodes.length-1)]?.title||path.name,bosses}]
  };
}

function dayTrial(path:SkillPath,state:AppState,dayKey:string,sequence:number):Quest{
  const idx=currentNodeIndex(state,path);const node=path.nodes[Math.min(idx,path.nodes.length-1)];const completed=state.quests.filter(q=>q.pathId===path.id&&q.done).length;
  const labels=["PROVE","REFINE","PUSH","APPLY","STRETCH"];const label=labels[Math.min(sequence,labels.length-1)];
  return {id:`day-${dayKey}-${path.id}-${sequence}-${Date.now()}`,pathId:path.id,nodeId:node?.id,title:`${label} — ${node?.title||path.name}`,proof:sequence===0?`Create one measurable result today that demonstrates ${node?.title||path.name}. The result should be visible, countable, reviewable, or otherwise verifiable.`:`Create a new measurable result in ${path.name} that improves on your most recent Proof. Make it cleaner, harder, faster, more independent, or more complete than what you already demonstrated.`,xp:Math.min(90,30+completed*3+sequence*5),kind:"daily",cycleType:"day",cycleKey:dayKey,createdAt:new Date().toISOString(),proofKinds:["text","number","link","photo","video"]};
}

function weeklyTrials(path:SkillPath,state:AppState,weekNumber:number):Quest[]{
  const cycleKey=pathWeekKey(path.id,weekNumber);const idx=currentNodeIndex(state,path);const current=path.nodes[Math.min(idx,path.nodes.length-1)];const next=path.nodes[Math.min(idx+1,path.nodes.length-1)]||current;const completed=state.quests.filter(q=>q.pathId===path.id&&q.done).length;
  return [
    {id:`weekly-trial-1-${path.id}-${weekNumber}`,pathId:path.id,nodeId:current?.id,title:`WEEK ${weekNumber} / TRIAL I — Sharpen ${current?.title||path.name}`,proof:`Produce one focused, measurable result that strengthens ${current?.title||path.name}. It should be cleaner or more independent than an earlier Proof.`,xp:Math.min(95,45+completed*2),kind:"weekly_trial",cycleType:"week",cycleKey,pathWeekNumber:weekNumber,dueWeek:String(weekNumber),createdAt:new Date().toISOString(),proofKinds:["text","number","link","photo","video"]},
    {id:`weekly-trial-2-${path.id}-${weekNumber}`,pathId:path.id,nodeId:next?.id,title:`WEEK ${weekNumber} / TRIAL II — Bridge Toward ${next?.title||path.name}`,proof:`Complete one measurable challenge that combines your current capability with an element of ${next?.title||"the next capability"}.`,xp:Math.min(120,60+completed*2),kind:"weekly_trial",cycleType:"week",cycleKey,pathWeekNumber:weekNumber,dueWeek:String(weekNumber),createdAt:new Date().toISOString(),proofKinds:["text","number","link","photo","video"]}
  ];
}

function weekBoss(path:SkillPath,state:AppState,weekNumber:number):Quest{
  const cycleKey=pathWeekKey(path.id,weekNumber);const idx=currentNodeIndex(state,path);const next=path.nodes[Math.min(idx+1,path.nodes.length-1)]||path.nodes[idx];const weeklyWins=state.quests.filter(q=>q.pathId===path.id&&q.kind==="weekly"&&q.done).length;
  return {id:`week-boss-${path.id}-${weekNumber}`,pathId:path.id,nodeId:next?.id,title:`WEEK ${weekNumber} BOSS — Advance Toward ${next?.title||path.name}`,proof:`Complete one meaningful real-world result that combines what you can already do in ${path.name} and moves you closer to ${next?.title||"the next capability"}.`,xp:Math.min(400,225+weeklyWins*20),kind:"weekly",cycleType:"week",cycleKey,pathWeekNumber:weekNumber,dueWeek:String(weekNumber),createdAt:new Date().toISOString(),proofKinds:["text","number","link","photo","video","file"]};
}

export function pathWeekCleared(state:AppState,pathId:string,cycleKey:string){const trials=state.quests.filter(q=>q.pathId===pathId&&q.kind==="weekly_trial"&&q.cycleKey===cycleKey);const bosses=state.quests.filter(q=>q.pathId===pathId&&q.kind==="weekly"&&q.cycleKey===cycleKey);return trials.length>=2&&trials.every(q=>q.done)&&bosses.some(q=>q.done)}
export function activeDayQuests(state:AppState,date=new Date()){const key=localDayKey(date);return state.quests.filter(q=>(q.kind==="daily"||q.kind==="boss")&&(!q.cycleKey||q.cycleKey===key))}

export function ensureCurrentCycles(input:AppState,date=new Date()):AppState{
  const dayKey=localDayKey(date);const calendarWeekKey=isoWeekKey(date);let quests=[...input.quests];let history=[...(input.cycleHistory||[])];const pathWeeks={...(input.pathWeeks||{})};
  for(const path of input.paths){if(!pathWeeks[path.id])pathWeeks[path.id]={weekNumber:1,cycleKey:pathWeekKey(path.id,1)}}
  quests=quests.map(q=>{if(q.kind==="weekly"||q.kind==="weekly_trial"){if(isPathWeekKey(q))return q;if(q.done)return {...q,cycleType:"week" as const,cycleKey:`legacy-${q.completedAt||q.id}`};const active=pathWeeks[q.pathId]||{weekNumber:1,cycleKey:pathWeekKey(q.pathId,1)};return {...q,cycleType:"week" as const,cycleKey:active.cycleKey,pathWeekNumber:active.weekNumber,dueWeek:String(active.weekNumber)}}if((q.kind==="daily"||q.kind==="boss")&&!q.cycleKey)return {...q,cycleType:"day" as const,cycleKey:dayKey};return q});

  for(const path of input.paths.filter(p=>!p.paused)){
    let week=pathWeeks[path.id];let workingState={...input,quests,pathWeeks:{...pathWeeks,[path.id]:week}};
    while(pathWeekCleared(workingState,path.id,week.cycleKey)){
      if(!history.some(h=>h.id===`week-${path.id}-${week.weekNumber}`))history=[snapshotPathWeek(workingState,path,week.cycleKey,week.weekNumber),...history];
      week={weekNumber:week.weekNumber+1,cycleKey:pathWeekKey(path.id,week.weekNumber+1)};pathWeeks[path.id]=week;workingState={...workingState,quests,pathWeeks:{...pathWeeks}};
    }
    pathWeeks[path.id]=week;
    const openDay=quests.some(q=>q.pathId===path.id&&(q.kind==="daily"||q.kind==="boss")&&q.cycleKey===dayKey&&!q.done);
    if(!openDay){const completedToday=quests.filter(q=>q.pathId===path.id&&(q.kind==="daily"||q.kind==="boss")&&q.cycleKey===dayKey&&q.done).length;quests.push(dayTrial(path,{...input,quests,pathWeeks},dayKey,completedToday))}
    const weekTrialsForPath=quests.filter(q=>q.pathId===path.id&&q.kind==="weekly_trial"&&q.cycleKey===week.cycleKey);
    if(weekTrialsForPath.length<2){const generated=weeklyTrials(path,{...input,quests,pathWeeks},week.weekNumber);quests.push(...generated.filter(q=>!quests.some(existing=>existing.id===q.id)))}
    const hasWeekBoss=quests.some(q=>q.pathId===path.id&&q.kind==="weekly"&&q.cycleKey===week.cycleKey);if(!hasWeekBoss)quests.push(weekBoss(path,{...input,quests,pathWeeks},week.weekNumber));
  }
  const activeNumbers=Object.entries(pathWeeks).filter(([id])=>!input.paths.find(p=>p.id===id)?.paused).map(([,w])=>w.weekNumber);const displayWeek=activeNumbers.length?Math.min(...activeNumbers):1;
  return {...input,quests,pathWeeks,cycles:{dayKey,weekKey:`campaign-week-${displayWeek}`,calendarWeekKey,weekNumber:displayWeek},cycleHistory:history.slice(0,260)};
}

export function cycleStateChanged(a:AppState,b:AppState){return JSON.stringify({quests:a.quests,cycles:a.cycles,pathWeeks:a.pathWeeks,cycleHistory:a.cycleHistory})!==JSON.stringify({quests:b.quests,cycles:b.cycles,pathWeeks:b.pathWeeks,cycleHistory:b.cycleHistory})}
