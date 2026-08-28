import type { AppState, Quest, SkillPath } from "./types";
import { pathProgress } from "./progression";
import { localDayKey } from "./cycles";

export type MarkTier="bronze"|"silver"|"gold";
export type Mark={id:string;glyph:string;title:string;description:string;earned:boolean;tier:MarkTier;progress:number;target:number;category:string};
export type ConstellationTier="forming"|"aligned"|"integrated";
export type Constellation={
  id:string;glyph:string;title:string;description:string;pathIds:string[];unlocked:boolean;
  tier:ConstellationTier;progress:number;requirements:string[];challenge:string;proof:string;
};
export type TreeTemplate={id:string;creator:string;title:string;glyph:string;description:string;capability:string;region:string;nodes:{title:string;xpRequired:number;boss:boolean}[];tags:string[]};
export type JourneyInsight={id:string;glyph:string;label:string;value:string;detail:string;action?:string};

function clamp(n:number,min=0,max=100){return Math.max(min,Math.min(max,n))}

export function deriveMarks(state:AppState):Mark[]{
  const proven=state.quests.filter(q=>q.done).length;
  const weeks=(state.cycleHistory||[]).filter(h=>h.type==="week").length;
  const bosses=state.quests.filter(q=>q.kind==="weekly"&&q.done).length+(state.cycleHistory||[]).reduce((n,h)=>n+(h.paths||[]).reduce((s,p)=>s+(p.bosses?.length||0),0),0);
  const mastered=state.paths.filter(p=>pathProgress(state,p)>=80).length;
  const active=state.paths.filter(p=>!p.paused).length;
  const evidenceRich=state.quests.filter(q=>q.done&&(q.evidenceArtifacts?.length||0)>=2).length;
  const archives=state.archive.length;
  const marks:[string,string,string,string,number,number,MarkTier,string][]=[
    ["first-proof","✦","First Proof","Prove a real-world capability for the first time.",proven,1,"bronze","Proof"],
    ["proof-10","✧","Proofmaker","Record ten real demonstrations of capability.",proven,10,"silver","Proof"],
    ["proof-25","❖","Evidence Trail","Build a record of twenty-five Proven results.",proven,25,"gold","Proof"],
    ["week-cleared","◆","Week Conquered","Clear a complete Path Week of Trials and its Boss.",weeks,1,"bronze","Weekly"],
    ["four-weeks","◈","Month of Becoming","Clear four Path Weeks across your Build.",weeks,4,"silver","Weekly"],
    ["boss-hunter","◇","Boss Hunter","Prove five Weekly Bosses.",bosses,5,"silver","Bosses"],
    ["boss-10","⬙","Boss Lineage","Prove ten Weekly Bosses.",bosses,10,"gold","Bosses"],
    ["thousand","☀","1,000 XP","Accumulate one thousand XP through Proof.",state.xp,1000,"silver","Growth"],
    ["five-thousand","✺","5,000 XP","Build five thousand XP through demonstrated capability.",state.xp,5000,"gold","Growth"],
    ["mastery","❈","Ornamented Branch","Develop any Path to 80% capability progress.",mastered,1,"gold","Mastery"],
    ["polymath","✥","Many Directions","Maintain four active capability Paths.",active,4,"silver","Identity"],
    ["rich-proof","▣","Receipts","Complete five Proofs with multiple evidence artifacts.",evidenceRich,5,"silver","Proof"],
    ["reflector","☾","Self-Witness","Record five Archive reflections that shape future direction.",archives,5,"silver","Reflection"]
  ];
  return marks.map(([id,glyph,title,description,current,target,tier,category])=>({id,glyph,title,description,earned:current>=target,tier,progress:clamp(Math.round((current/target)*100)),target,category}));
}

function text(p:SkillPath){return `${p.name} ${p.capability}`.toLowerCase()}
function find(state:AppState,terms:string[]){return state.paths.filter(p=>terms.some(t=>text(p).includes(t)))}
function best(state:AppState,paths:SkillPath[]){return [...paths].sort((a,b)=>pathProgress(state,b)-pathProgress(state,a))[0]}

function constellation(
  state:AppState,id:string,glyph:string,title:string,description:string,a:SkillPath[],b:SkillPath[],challenge:string,proof:string
):Constellation{
  const pa=best(state,a);const pb=best(state,b);
  const ids=[pa?.id,pb?.id].filter(Boolean) as string[];
  const scores=ids.map(id=>pathProgress(state,state.paths.find(p=>p.id===id)!));
  const min=scores.length===2?Math.min(...scores):0;
  const unlocked=ids.length===2&&min>=15;
  const tier:ConstellationTier=min>=60?"integrated":min>=30?"aligned":"forming";
  return {
    id,glyph,title,description,pathIds:ids,unlocked,tier,progress:ids.length===2?clamp(Math.round(min/0.6)):Math.round((ids.length/2)*20),
    requirements:[`Two matching Paths in your Build`,`Both Paths reach at least 15% capability`,`30%+ in both Paths advances this Constellation`,`60%+ in both Paths reaches Integrated tier`],
    challenge,proof
  };
}

export function deriveConstellations(state:AppState):Constellation[]{
  const dev=find(state,["developer","software","code","program","web","app","engineer","data"]);
  const biz=find(state,["entrepreneur","business","founder","sales","commerce","brand","marketing"]);
  const music=find(state,["music","dj","piano","producer","song","audio","artist"]);
  const creative=find(state,["creative","design","photo","video","fashion","sew","creator","film","art"]);
  const language=find(state,["spanish","japanese","language","communicat","french","arabic"]);
  const athletic=find(state,["basketball","athlete","fitness","calisthen","skate","kung fu","martial","run","strength"]);
  const truth=find(state,["truth","bible","quran","theology","faith","religion","philosophy"]);
  const leadership=find(state,["leader","leadership","management","coach","mentor","director"]);
  return [
    constellation(state,"tech-founder","⌘","Tech Founder","Technical capability fused with business execution.",dev,biz,
      "Put one working product feature in front of a real person and ask for a concrete action: use it, join, buy, book, or give structured feedback.",
      "Provide the live/repo link plus the real person's response, metric, or decision."),
    constellation(state,"artist","✺","Artist","Music joined with visual or creative direction.",music,creative,
      "Create one finished piece where sound and visual direction intentionally support the same concept.",
      "Submit the finished audio/performance plus its visual/art-direction artifact and explain the shared concept."),
    constellation(state,"global-builder","↔","Global Builder","Technical creation joined with cross-language communication.",dev,language,
      "Explain, demo, or document one technical thing in the language you are building.",
      "Provide the product/demo and a recording or written explanation in the target language."),
    constellation(state,"performance-creator","△","Performance Creator","Physical mastery joined with creative production.",athletic,creative,
      "Create a polished piece of content that demonstrates a real physical capability rather than merely talking about it.",
      "Submit the performance result and the edited photo/video/design artifact."),
    constellation(state,"creative-founder","◒","Creative Founder","Creative direction fused with market execution.",creative,biz,
      "Turn one creative idea into a real offer and put it in front of a defined audience.",
      "Provide the finished creative, offer/price, and actual response or conversion signal."),
    constellation(state,"disciplined-seeker","✶","Disciplined Seeker","Physical discipline joined with serious truth-seeking.",athletic,truth,
      "Complete one demanding physical commitment and one evidence-based study commitment under a single weekly intention.",
      "Provide the physical benchmark plus a concise written conclusion citing what you studied and what changed in your understanding."),
    constellation(state,"creative-technologist","⌁","Creative Technologist","Software capability fused with visual experience design.",dev,creative,
      "Build one interactive experience whose visual direction is essential to how it works, not decoration added afterward.",
      "Provide a working link plus the design decisions and the user interaction they support."),
    constellation(state,"builder-leader","♜","Builder-Leader","Execution capability joined with leadership.",dev.length?dev:biz,leadership,
      "Lead one small real project from clear outcome to delegation, execution, and review.",
      "Provide the outcome, who owned what, and what changed because of your leadership."),
    constellation(state,"global-artist","☄","Global Artist","Creative expression joined with another language and culture.",creative.length?creative:music,language,
      "Create and publish one piece that intentionally communicates across language or cultural context.",
      "Provide the finished work and evidence that the target-language/cultural element was meaningfully used.")
  ];
}

export function constellationTrial(state:AppState,c:Constellation):Quest|null{
  if(!c.unlocked||c.pathIds.length<2)return null;
  const existing=state.quests.find(q=>!q.done&&q.kind==="boss"&&q.title.startsWith(`CONSTELLATION — ${c.title}`));
  if(existing)return existing;
  return {
    id:`constellation-${c.id}-${Date.now()}`,
    pathId:c.pathIds[0],
    title:`CONSTELLATION — ${c.title}`,
    proof:c.proof,
    xp:c.tier==="integrated"?325:c.tier==="aligned"?250:190,
    kind:"boss",
    cycleType:"day",
    cycleKey:localDayKey(new Date()),
    createdAt:new Date().toISOString(),
    proofKinds:["text","number","link","photo","video","file"],
    adaptationReason:c.challenge
  };
}

export function deriveJourneyInsights(state:AppState):JourneyInsight[]{
  const active=state.paths.filter(p=>!p.paused);
  const sorted=[...active].sort((a,b)=>pathProgress(state,b)-pathProgress(state,a));
  const strongest=sorted[0];const quietest=sorted[sorted.length-1];
  const proven=state.quests.filter(q=>q.done);
  const last7=Date.now()-7*86400000;
  const recent=proven.filter(q=>q.completedAt&&new Date(q.completedAt).getTime()>=last7);
  const weeks=(state.cycleHistory||[]).filter(h=>h.type==="week");
  const bosses=proven.filter(q=>q.kind==="weekly").length;
  const ai=state.quests.filter(q=>q.aiGenerated).length;
  const archived=state.archive[0];
  const open=state.quests.filter(q=>(q.kind==="daily"||q.kind==="boss")&&!q.done).length;
  const avgWeek=weeks.length?Math.round(weeks.reduce((s,w)=>s+w.earnedXp,0)/weeks.length):0;
  return [
    {id:"strongest",glyph:strongest?.glyph||"✥",label:"STRONGEST DIRECTION",value:strongest?`${strongest.name} · ${pathProgress(state,strongest)}%`:"Still forming",detail:strongest?"This branch currently carries the most demonstrated capability.":"Your first completed Proof will start revealing your strongest direction."},
    {id:"quiet",glyph:quietest?.glyph||"◇",label:"QUIETEST ACTIVE PATH",value:quietest?`${quietest.name} · ${pathProgress(state,quietest)}%`:"None yet",detail:quietest&&active.length>1?"This path has the most room for attention if it still matters to you.":"Your active paths are still too new to compare meaningfully.",action:quietest?"Point one Trial here this week.":undefined},
    {id:"cadence",glyph:"☀",label:"7-DAY PROOF CADENCE",value:`${recent.length} Proof${recent.length===1?"":"s"}`,detail:recent.length>=5?"You are producing frequent evidence of capability.":recent.length>=2?"Your rhythm is forming. Consistency matters more than volume.":"A small Proven result is enough to restart momentum."},
    {id:"weeks",glyph:"◆",label:"WEEKLY LINEAGE",value:`${weeks.length} cleared · ${bosses} bosses`,detail:weeks.length?`Your cleared Weeks average about ${avgWeek} XP of demonstrated work.`:"Your first completed Weekly campaign will begin your long-term record."},
    {id:"adaptive",glyph:"✦",label:"ADAPTIVE DEPTH",value:`${ai} tailored challenge${ai===1?"":"s"}`,detail:ai?"BECOMR is increasingly using your actual history rather than generic progression.":"Your first Proof gives the adaptive engine something real to work from."},
    {id:"bearing",glyph:"☾",label:"LATEST BEARING",value:archived?.next||`${open} open direction${open===1?"":"s"}`,detail:archived?.resisted?`Resistance recorded: ${archived.resisted}`:"Your Archive can turn reflection into future progression."}
  ];
}

export const treeTemplates:TreeTemplate[]=[
  {id:"dj-club",creator:"BECOMR Studio",title:"Club-Ready DJ",glyph:"♫",description:"From phrasing and beatmatching to a clean live set.",capability:"Perform a confident 45–60 minute DJ set in a real venue.",region:"NORTHWEST / RHYTHM",tags:["music","performance"],nodes:[
    {title:"Count Bars, Phrases & BPM",xpRequired:0,boss:false},{title:"Cueing, Transitions & EQ",xpRequired:180,boss:false},{title:"Beatmatch Without Visual Dependence",xpRequired:420,boss:true},{title:"Build Energy Across a Set",xpRequired:760,boss:false},{title:"Record a Clean 30-Minute Mix",xpRequired:1150,boss:true},{title:"Perform a Live 45–60 Minute Set",xpRequired:1700,boss:true}]},
  {id:"fullstack",creator:"BECOMR Studio",title:"Full-Stack Product Builder",glyph:"⌘",description:"Build, ship and operate a real web product.",capability:"Independently ship a production full-stack application with users.",region:"WEST / SYSTEMS",tags:["development","software"],nodes:[
    {title:"HTML, CSS & JavaScript Product UI",xpRequired:0,boss:false},{title:"APIs & Persistent Data",xpRequired:220,boss:false},{title:"React + TypeScript Application",xpRequired:520,boss:true},{title:"Auth + Database + CRUD",xpRequired:900,boss:true},{title:"Testing, Security & Cloud Deploy",xpRequired:1400,boss:false},{title:"Ship to Real Users",xpRequired:2000,boss:true}]},
  {id:"spanish",creator:"BECOMR Studio",title:"Conversational Spanish",glyph:"↔",description:"Capability-first Spanish built around speaking and comprehension.",capability:"Hold an independent 30-minute conversation in Spanish.",region:"EAST / LANGUAGE",tags:["language","spanish"],nodes:[
    {title:"Survival Phrases & Pronunciation",xpRequired:0,boss:false},{title:"Present-Tense Conversation",xpRequired:180,boss:false},{title:"Describe Past & Future Events",xpRequired:430,boss:true},{title:"Sustain a 10-Minute Conversation",xpRequired:760,boss:false},{title:"Understand Native-Speed Everyday Speech",xpRequired:1200,boss:true},{title:"30-Minute Independent Conversation",xpRequired:1700,boss:true}]},
  {id:"sewing",creator:"BECOMR Studio",title:"Garment Maker",glyph:"✂",description:"From machine control to an original wearable capsule.",capability:"Design, construct and finish original garments independently.",region:"NORTHEAST / CRAFT",tags:["fashion","sewing","creator"],nodes:[
    {title:"Machine Control & Clean Seams",xpRequired:0,boss:false},{title:"Alter Existing Garments",xpRequired:200,boss:false},{title:"Read & Modify Patterns",xpRequired:480,boss:true},{title:"Draft an Original Garment",xpRequired:820,boss:false},{title:"Construct a Finished Outfit",xpRequired:1300,boss:true},{title:"Release a Small Capsule",xpRequired:1900,boss:true}]},
  {id:"calisthenics",creator:"BECOMR Studio",title:"Bodyweight Strength",glyph:"△",description:"Build control from clean basics to advanced calisthenics.",capability:"Perform a controlled intermediate calisthenics routine with strength, balance and mobility.",region:"SOUTH / BODY",tags:["fitness","calisthenics"],nodes:[
    {title:"Push, Pull, Squat & Brace",xpRequired:0,boss:false},{title:"Volume With Clean Form",xpRequired:180,boss:false},{title:"10 Strict Pull-Ups",xpRequired:420,boss:true},{title:"L-Sit + Handstand Foundations",xpRequired:760,boss:false},{title:"Explosive Pulling + Dips",xpRequired:1150,boss:true},{title:"Integrated Advanced Routine",xpRequired:1750,boss:true}]},
  {id:"photo-video",creator:"BECOMR Studio",title:"Visual Storyteller",glyph:"◒",description:"Move from clean images to directed visual campaigns.",capability:"Plan, shoot, edit and deliver a cohesive visual story for a real subject or brand.",region:"NORTHEAST / VISION",tags:["creative","photo","video"],nodes:[
    {title:"Composition, Exposure & Intent",xpRequired:0,boss:false},{title:"Controlled Portrait / Product Shoot",xpRequired:190,boss:false},{title:"Edit a Cohesive Photo Set",xpRequired:450,boss:true},{title:"Shoot + Cut a Short Narrative",xpRequired:800,boss:false},{title:"Direct a Multi-Asset Campaign",xpRequired:1250,boss:true},{title:"Deliver a Client-Ready Visual Story",xpRequired:1850,boss:true}]}
];

export function templateToPath(t:TreeTemplate):SkillPath{
  const id=`market-${t.id}-${Date.now()}`;
  return {id,name:t.title,glyph:t.glyph,tone:"antique-gold",region:t.region,capability:t.capability,capacity:"steady",nodes:t.nodes.map((n,i)=>({id:`${id}-node-${i+1}`,title:n.title,order:i,xpRequired:n.xpRequired,boss:n.boss}))};
}
