import type { AppState, SkillPath, Quest, VisualStage } from "./types";

export function provenQuestsForPath(state:AppState,pathId:string){
  return state.quests.filter(q=>q.pathId===pathId && q.done);
}

export function pathEarnedXp(state:AppState,pathId:string){
  return provenQuestsForPath(state,pathId).reduce((sum,q)=>sum+q.xp,0);
}

export function currentNodeIndex(state:AppState,path:SkillPath){
  const earned = pathEarnedXp(state,path.id);
  let idx = 0;
  path.nodes.forEach((node,i)=>{ if(earned >= node.xpRequired) idx=i; });
  return idx;
}

export function pathProgress(state:AppState,path:SkillPath){
  const earned = pathEarnedXp(state,path.id);
  const max = path.nodes[path.nodes.length-1]?.xpRequired || 1;
  return Math.max(0,Math.min(100,Math.round((earned/max)*100)));
}

export function visualStageFromProgress(progress:number):VisualStage{
  if(progress<=0) return "sealed";
  if(progress<20) return "open";
  if(progress<45) return "inscribed";
  if(progress<80) return "ornamented";
  return "mastered";
}

export function isNodeOpen(state:AppState,path:SkillPath,nodeIndex:number){
  return nodeIndex <= currentNodeIndex(state,path)+1;
}

export function weeklyBosses(state:AppState){
  return state.quests.filter(q=>q.kind==="weekly");
}

export function weeklyScore(state:AppState){
  const bosses=weeklyBosses(state);
  if(!bosses.length) return 0;
  return Math.round((bosses.filter(q=>q.done).length/bosses.length)*100);
}

export function generatedWeeklyBoss(path:SkillPath,nodeTitle:string):Quest{
  return {
    id:`week-${path.id}-${Date.now()}`,
    pathId:path.id,
    title:`WEEKLY BOSS — Prove ${nodeTitle}`,
    proof:`Create one measurable result that demonstrates ${nodeTitle} in the real world.`,
    xp:250,
    kind:"weekly"
  };
}

export function generatedBonusTrial(state:AppState,path:SkillPath):Quest{
  const idx=currentNodeIndex(state,path);
  const node=path.nodes[Math.min(idx,path.nodes.length-1)];
  const completed=state.quests.filter(q=>q.pathId===path.id&&q.done).length;
  return {
    id:`bonus-${path.id}-${Date.now()}`,
    pathId:path.id,
    nodeId:node?.id,
    title:`BONUS TRIAL — Push ${node?.title || path.name} Further`,
    proof:`Produce one new measurable result that is harder, cleaner, faster, more independent, or more complete than your previous Proof in ${path.name}. Do not repeat the exact same accomplishment.`,
    xp:Math.min(85,35+completed*5),
    kind:"daily"
  };
}

export function generatedStretchWeeklyBoss(state:AppState,path:SkillPath):Quest{
  const idx=currentNodeIndex(state,path);
  const nextNode=path.nodes[Math.min(idx+1,path.nodes.length-1)] || path.nodes[idx];
  const weeklyWins=state.quests.filter(q=>q.pathId===path.id&&q.kind==="weekly"&&q.done).length;
  return {
    id:`stretch-week-${path.id}-${Date.now()}`,
    pathId:path.id,
    nodeId:nextNode?.id,
    title:`STRETCH BOSS — Advance Toward ${nextNode?.title || path.name}`,
    proof:`Complete a larger real-world result that combines what you have already Proven in ${path.name} and moves you visibly closer to ${nextNode?.title || "the next capability"}. The result must be distinct from your previous Weekly Bosses.`,
    xp:Math.min(450,275+weeklyWins*25),
    kind:"weekly"
  };
}
