import type { AppState, CycleSnapshot, Quest, SkillPath } from "./types";
import { currentNodeIndex } from "./progression";

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

function snapshot(type:"day"|"week",cycleKey:string,quests:Quest[]):CycleSnapshot{
  const relevant=quests.filter(q=>q.cycleType===type&&q.cycleKey===cycleKey);
  return {
    id:`${type}-${cycleKey}`,
    type,
    cycleKey,
    closedAt:new Date().toISOString(),
    proven:relevant.filter(q=>q.done).length,
    earnedXp:relevant.filter(q=>q.done).reduce((sum,q)=>sum+q.xp,0),
    quests:relevant.map(q=>({id:q.id,pathId:q.pathId,title:q.title,kind:q.kind,xp:q.xp,done:Boolean(q.done),evidence:q.evidence,completedAt:q.completedAt}))
  };
}

function dayTrial(path:SkillPath,state:AppState,dayKey:string):Quest{
  const idx=currentNodeIndex(state,path);
  const node=path.nodes[Math.min(idx,path.nodes.length-1)];
  const completed=state.quests.filter(q=>q.pathId===path.id&&q.done).length;
  return {
    id:`day-${dayKey}-${path.id}`,
    pathId:path.id,
    nodeId:node?.id,
    title:`TODAY — Prove ${node?.title || path.name}`,
    proof:`Create one measurable result today that demonstrates ${node?.title || path.name}. The result should be visible, countable, reviewable, or otherwise verifiable.`,
    xp:Math.min(75,30+completed*3),
    kind:"daily",
    cycleType:"day",
    cycleKey:dayKey,
    createdAt:new Date().toISOString()
  };
}

function weekBoss(path:SkillPath,state:AppState,weekKey:string):Quest{
  const idx=currentNodeIndex(state,path);
  const next=path.nodes[Math.min(idx+1,path.nodes.length-1)] || path.nodes[idx];
  const weeklyWins=state.quests.filter(q=>q.pathId===path.id&&q.kind==="weekly"&&q.done).length;
  return {
    id:`week-${weekKey}-${path.id}`,
    pathId:path.id,
    nodeId:next?.id,
    title:`WEEKLY BOSS — Advance Toward ${next?.title || path.name}`,
    proof:`Complete one meaningful real-world result this week that combines what you can already do in ${path.name} and moves you closer to ${next?.title || "the next capability"}.`,
    xp:Math.min(400,225+weeklyWins*20),
    kind:"weekly",
    cycleType:"week",
    cycleKey:weekKey,
    dueWeek:weekKey,
    createdAt:new Date().toISOString()
  };
}

export function activeDayQuests(state:AppState,date=new Date()){
  const key=localDayKey(date);
  return state.quests.filter(q=>(q.kind==="daily"||q.kind==="boss")&&(!q.cycleType||q.cycleType==="day")&&(!q.cycleKey||q.cycleKey===key));
}

export function activeWeekQuests(state:AppState,date=new Date()){
  const key=isoWeekKey(date);
  return state.quests.filter(q=>q.kind==="weekly"&&(!q.cycleKey||q.cycleKey===key));
}

export function ensureCurrentCycles(input:AppState,date=new Date()):AppState{
  const dayKey=localDayKey(date);
  const weekKey=isoWeekKey(date);
  const previousDay=input.cycles?.dayKey;
  const previousWeek=input.cycles?.weekKey;
  let quests=[...input.quests];
  let history=[...(input.cycleHistory||[])];

  if(previousDay&&previousDay!==dayKey&&!history.some(h=>h.type==="day"&&h.cycleKey===previousDay)){
    history=[snapshot("day",previousDay,quests),...history];
  }
  if(previousWeek&&previousWeek!==weekKey&&!history.some(h=>h.type==="week"&&h.cycleKey===previousWeek)){
    history=[snapshot("week",previousWeek,quests),...history];
  }

  // Migrate legacy open quests into the current calendar cycle instead of losing them.
  quests=quests.map(q=>{
    if(q.cycleKey)return q;
    if(q.kind==="weekly")return {...q,cycleType:"week" as const,cycleKey:weekKey,dueWeek:weekKey};
    if(q.kind==="daily"||q.kind==="boss")return {...q,cycleType:"day" as const,cycleKey:dayKey};
    return q;
  });

  // A new day/week offers fresh options only when that path does not already have an active quest in that cycle.
  if(input.paths.length){
    for(const path of input.paths){
      const hasDay=quests.some(q=>q.pathId===path.id&&(q.kind==="daily"||q.kind==="boss")&&q.cycleKey===dayKey);
      if(!hasDay)quests.push(dayTrial(path,{...input,quests},dayKey));

      const hasWeek=quests.some(q=>q.pathId===path.id&&q.kind==="weekly"&&q.cycleKey===weekKey);
      if(!hasWeek)quests.push(weekBoss(path,{...input,quests},weekKey));
    }
  }

  return {...input,quests,cycles:{dayKey,weekKey},cycleHistory:history.slice(0,104)};
}
