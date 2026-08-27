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

function dayTrial(path:SkillPath,state:AppState,dayKey:string,sequence:number):Quest{
  const idx=currentNodeIndex(state,path);
  const node=path.nodes[Math.min(idx,path.nodes.length-1)];
  const completed=state.quests.filter(q=>q.pathId===path.id&&q.done).length;
  const labels=["PROVE","REFINE","PUSH","APPLY","STRETCH"];
  const label=labels[Math.min(sequence,labels.length-1)];
  return {
    id:`day-${dayKey}-${path.id}-${sequence}-${Date.now()}`,
    pathId:path.id,
    nodeId:node?.id,
    title:`${label} — ${node?.title || path.name}`,
    proof:sequence===0
      ? `Create one measurable result today that demonstrates ${node?.title || path.name}. The result should be visible, countable, reviewable, or otherwise verifiable.`
      : `Create a new measurable result in ${path.name} that improves on your most recent Proof. Make it cleaner, harder, faster, more independent, or more complete than what you already demonstrated.`,
    xp:Math.min(90,30+completed*3+sequence*5),
    kind:"daily",
    cycleType:"day",
    cycleKey:dayKey,
    createdAt:new Date().toISOString()
  };
}

function weeklyTrials(path:SkillPath,state:AppState,weekKey:string):Quest[]{
  const idx=currentNodeIndex(state,path);
  const current=path.nodes[Math.min(idx,path.nodes.length-1)];
  const next=path.nodes[Math.min(idx+1,path.nodes.length-1)] || current;
  const completed=state.quests.filter(q=>q.pathId===path.id&&q.done).length;
  return [
    {
      id:`weekly-trial-1-${weekKey}-${path.id}`,
      pathId:path.id,
      nodeId:current?.id,
      title:`WEEK TRIAL I — Sharpen ${current?.title || path.name}`,
      proof:`Produce one focused, measurable repetition or result that strengthens ${current?.title || path.name}. It should be cleaner or more independent than an earlier Proof.`,
      xp:Math.min(95,45+completed*2),
      kind:"weekly_trial",
      cycleType:"week",
      cycleKey:weekKey,
      dueWeek:weekKey,
      createdAt:new Date().toISOString()
    },
    {
      id:`weekly-trial-2-${weekKey}-${path.id}`,
      pathId:path.id,
      nodeId:next?.id,
      title:`WEEK TRIAL II — Bridge Toward ${next?.title || path.name}`,
      proof:`Complete one measurable challenge that combines your current capability with an element of ${next?.title || "the next capability"}.`,
      xp:Math.min(120,60+completed*2),
      kind:"weekly_trial",
      cycleType:"week",
      cycleKey:weekKey,
      dueWeek:weekKey,
      createdAt:new Date().toISOString()
    }
  ];
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
  return state.quests.filter(q=>(q.kind==="daily"||q.kind==="boss")&&(!q.cycleKey||q.cycleKey===key));
}

export function activeWeekQuests(state:AppState,date=new Date()){
  const key=isoWeekKey(date);
  return state.quests.filter(q=>(q.kind==="weekly_trial"||q.kind==="weekly")&&(!q.cycleKey||q.cycleKey===key));
}

export function ensureCurrentCycles(input:AppState,date=new Date()):AppState{
  const dayKey=localDayKey(date);
  const weekKey=isoWeekKey(date);
  const previousDay=input.cycles?.dayKey;
  const previousWeek=input.cycles?.weekKey;
  let quests=[...input.quests];
  let history=[...(input.cycleHistory||[])];

  quests=quests.map(q=>{
    if(q.cycleKey)return q;
    if(q.kind==="weekly"||q.kind==="weekly_trial")return {...q,cycleType:"week" as const,cycleKey:weekKey,dueWeek:weekKey};
    if(q.kind==="daily"||q.kind==="boss")return {...q,cycleType:"day" as const,cycleKey:dayKey};
    return q;
  });

  if(previousDay&&previousDay!==dayKey){
    if(!history.some(h=>h.type==="day"&&h.cycleKey===previousDay))history=[snapshot("day",previousDay,quests),...history];
    quests=quests.filter(q=>!(q.cycleType==="day"&&q.cycleKey===previousDay&&!q.done));
  }

  if(previousWeek&&previousWeek!==weekKey){
    if(!history.some(h=>h.type==="week"&&h.cycleKey===previousWeek))history=[snapshot("week",previousWeek,quests),...history];
    quests=quests.filter(q=>!(q.cycleType==="week"&&q.cycleKey===previousWeek&&!q.done));
  }

  if(input.paths.length){
    for(const path of input.paths){
      const openDay=quests.some(q=>q.pathId===path.id&&(q.kind==="daily"||q.kind==="boss")&&q.cycleKey===dayKey&&!q.done);
      if(!openDay){
        const completedToday=quests.filter(q=>q.pathId===path.id&&(q.kind==="daily"||q.kind==="boss")&&q.cycleKey===dayKey&&q.done).length;
        quests.push(dayTrial(path,{...input,quests},dayKey,completedToday));
      }

      const hasWeeklyTrials=quests.some(q=>q.pathId===path.id&&q.kind==="weekly_trial"&&q.cycleKey===weekKey);
      if(!hasWeeklyTrials)quests.push(...weeklyTrials(path,{...input,quests},weekKey));

      const hasWeek=quests.some(q=>q.pathId===path.id&&q.kind==="weekly"&&q.cycleKey===weekKey);
      if(!hasWeek)quests.push(weekBoss(path,{...input,quests},weekKey));
    }
  }

  return {...input,quests,cycles:{dayKey,weekKey},cycleHistory:history.slice(0,104)};
}

export function cycleStateChanged(a:AppState,b:AppState){
  return JSON.stringify({quests:a.quests,cycles:a.cycles,cycleHistory:a.cycleHistory})!==JSON.stringify({quests:b.quests,cycles:b.cycles,cycleHistory:b.cycleHistory});
}
