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

function missionLanguage(path:SkillPath,nodeTitle:string,mode:"baseline"|"bridge"|"boss"){
  const hay=`${path.name} ${path.capability} ${nodeTitle}`.toLowerCase();

  if(/basket|skate|athlet|strength|pull.?up|calisthen|run|sport|football|soccer|tennis|kung|martial/.test(hay)){
    if(mode==="baseline")return `Run a controlled benchmark for ${nodeTitle}: complete 3 rounds of the core movement or skill, record a count/time/success rate for each round, and finish with one clean attempt you would be willing to compare against next week.`;
    if(mode==="bridge")return `Create a 15–25 minute session that starts with ${nodeTitle} and adds one harder game-speed, balance, accuracy, or fatigue constraint. Record at least 10 attempts or 3 timed rounds and keep the result.`;
    return `Complete one continuous performance test that combines ${nodeTitle} with the next capability in ${path.name}. Use a real score, time, make-rate, rep count, distance, or uncut video so the result can be compared later.`;
  }

  if(/code|software|develop|program|react|typescript|api|database|web|app|cloud|engineer/.test(hay)){
    if(mode==="baseline")return `Build one small working feature that proves ${nodeTitle}. It must run, accept real input, and produce a visible result. Save the code plus a screenshot, repository link, or deployed URL as Proof.`;
    if(mode==="bridge")return `Extend that working feature by connecting it to the next capability in the path. Add one real integration, data flow, validation rule, API call, persistence step, or test and demonstrate it end-to-end.`;
    return `Ship a small end-to-end build that combines ${nodeTitle} with the next node. The Boss is only Proven when another person could open/run it and see the feature work without reading your source code.`;
  }

  if(/spanish|japanese|language|conversation|speak|vocab|grammar|communicat/.test(hay)){
    if(mode==="baseline")return `Record a 3–5 minute spoken sample using ${nodeTitle} without reading a full script. Count how many times you pause, switch to English, or correct yourself and save the recording or notes.`;
    if(mode==="bridge")return `Have or simulate a 7–10 minute conversation that starts with ${nodeTitle} and deliberately introduces the next skill. Use at least 10 original sentences and record the conversation or a written transcript.`;
    return `Complete a 10–15 minute real conversation, voice exchange, or spoken scenario that combines this Week's two language skills. Proof should include duration plus a recording, transcript, or partner confirmation.`;
  }

  if(/music|dj|piano|beat|production|song|mix|audio/.test(hay)){
    if(mode==="baseline")return `Create a 5–10 minute recorded performance or session focused on ${nodeTitle}. Keep it continuous, mark at least 3 moments you executed correctly, and identify one mistake to improve.`;
    if(mode==="bridge")return `Record a new 10–15 minute piece/session that combines ${nodeTitle} with the next musical capability. Include at least 3 deliberate transitions, phrases, chords, patterns, or production decisions.`;
    return `Deliver one finished, replayable performance or audio piece that combines both Weekly Trials. It must be recorded from beginning to end and strong enough that you would show it to another person.`;
  }

  if(/sew|fashion|garment|design|photo|video|creative|brand|visual|paint/.test(hay)){
    if(mode==="baseline")return `Produce one finished visual or physical artifact that demonstrates ${nodeTitle}. Photograph or export the result and document 2–3 specific decisions you made rather than only showing setup/practice.`;
    if(mode==="bridge")return `Create a second artifact that preserves ${nodeTitle} while deliberately adding the next capability. Compare it to the first and identify one visible improvement.`;
    return `Complete one presentation-ready piece that combines both Weekly skills in a single outcome. Proof must show the final result clearly enough that someone else could evaluate the workmanship or creative decisions.`;
  }

  if(/business|entrepreneur|sales|marketing|customer|revenue|founder|commerce/.test(hay)){
    if(mode==="baseline")return `Turn ${nodeTitle} into one real market action: create an offer, customer message, pricing test, landing section, outreach batch, or cost calculation and capture the measurable result.`;
    if(mode==="bridge")return `Run a second real-world test that connects ${nodeTitle} to the next business capability. Use at least 5 prospects, 1 live offer, or a concrete revenue/cost/conversion metric.`;
    return `Complete one end-to-end business test this week—from offer or outreach through an observable response. Save the numbers, customer responses, sales result, or decision you can make from the data.`;
  }

  if(mode==="baseline")return `Complete one concrete baseline challenge for ${nodeTitle}. Produce a visible result, use a count/time/score/output where possible, and save evidence that can be compared against a later attempt.`;
  if(mode==="bridge")return `Complete a second challenge that starts with ${nodeTitle} and adds one element of the next capability. Make the result objectively harder or more complete than Trial I and preserve evidence.`;
  return `Create one real-world result that combines both Weekly Trials into a single finished demonstration. The outcome must be observable, reviewable, or measurable enough to judge whether you actually became more capable.`;
}

function dayTrial(path:SkillPath,state:AppState,dayKey:string,sequence:number):Quest{
  const idx=currentNodeIndex(state,path);const node=path.nodes[Math.min(idx,path.nodes.length-1)];const completed=state.quests.filter(q=>q.pathId===path.id&&q.done).length;
  const labels=["PROVE","REFINE","PUSH","APPLY","STRETCH"];const label=labels[Math.min(sequence,labels.length-1)];
  return {id:`day-${dayKey}-${path.id}-${sequence}-${Date.now()}`,pathId:path.id,nodeId:node?.id,title:`${label} — ${node?.title||path.name}`,proof:sequence===0?missionLanguage(path,node?.title||path.name,"baseline"):`Improve on your most recent ${path.name} Proof with a distinct result today. Raise one measurable dimension—quality, difficulty, speed, independence, consistency, or completeness—and preserve evidence of the new result.`,xp:Math.min(90,30+completed*3+sequence*5),kind:"daily",cycleType:"day",cycleKey:dayKey,createdAt:new Date().toISOString(),proofKinds:["text","number","link","photo","video"]};
}

function weeklyTrials(path:SkillPath,state:AppState,weekNumber:number):Quest[]{
  const cycleKey=pathWeekKey(path.id,weekNumber);const idx=currentNodeIndex(state,path);const current=path.nodes[Math.min(idx,path.nodes.length-1)];const next=path.nodes[Math.min(idx+1,path.nodes.length-1)]||current;const completed=state.quests.filter(q=>q.pathId===path.id&&q.done).length;
  return [
    {id:`weekly-trial-1-${path.id}-${weekNumber}`,pathId:path.id,nodeId:current?.id,title:`WEEK ${weekNumber} / TRIAL I — ${current?.title||path.name} Baseline`,proof:missionLanguage(path,current?.title||path.name,"baseline"),xp:Math.min(95,45+completed*2),kind:"weekly_trial",cycleType:"week",cycleKey,pathWeekNumber:weekNumber,dueWeek:String(weekNumber),createdAt:new Date().toISOString(),proofKinds:["text","number","link","photo","video"]},
    {id:`weekly-trial-2-${path.id}-${weekNumber}`,pathId:path.id,nodeId:next?.id,title:`WEEK ${weekNumber} / TRIAL II — Bridge to ${next?.title||path.name}`,proof:missionLanguage(path,next?.title||path.name,"bridge"),xp:Math.min(120,60+completed*2),kind:"weekly_trial",cycleType:"week",cycleKey,pathWeekNumber:weekNumber,dueWeek:String(weekNumber),createdAt:new Date().toISOString(),proofKinds:["text","number","link","photo","video"]}
  ];
}

function weekBoss(path:SkillPath,state:AppState,weekNumber:number):Quest{
  const cycleKey=pathWeekKey(path.id,weekNumber);const idx=currentNodeIndex(state,path);const next=path.nodes[Math.min(idx+1,path.nodes.length-1)]||path.nodes[idx];const weeklyWins=state.quests.filter(q=>q.pathId===path.id&&q.kind==="weekly"&&q.done).length;
  return {id:`week-boss-${path.id}-${weekNumber}`,pathId:path.id,nodeId:next?.id,title:`WEEK ${weekNumber} BOSS — Demonstrate ${next?.title||path.name}`,proof:missionLanguage(path,next?.title||path.name,"boss"),xp:Math.min(400,225+weeklyWins*20),kind:"weekly",cycleType:"week",cycleKey,pathWeekNumber:weekNumber,dueWeek:String(weekNumber),createdAt:new Date().toISOString(),proofKinds:["text","number","link","photo","video","file"]};
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
