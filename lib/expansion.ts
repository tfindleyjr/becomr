import type { AppState, SkillPath } from "./types";
import { pathProgress } from "./progression";

export type Mark={id:string;glyph:string;title:string;description:string;earned:boolean};
export type Constellation={id:string;glyph:string;title:string;description:string;pathIds:string[];unlocked:boolean};
export type TreeTemplate={id:string;creator:string;title:string;glyph:string;description:string;capability:string;region:string;nodes:{title:string;xpRequired:number;boss:boolean}[];tags:string[]};

export function deriveMarks(state:AppState):Mark[]{
  const proven=state.quests.filter(q=>q.done).length;
  const weeks=(state.cycleHistory||[]).filter(h=>h.type==="week").length;
  const bosses=state.quests.filter(q=>q.kind==="weekly"&&q.done).length+(state.cycleHistory||[]).reduce((n,h)=>n+(h.paths||[]).reduce((s,p)=>s+(p.bosses?.length||0),0),0);
  const mastered=state.paths.filter(p=>pathProgress(state,p)>=80).length;
  return [
    {id:"first-proof",glyph:"✦",title:"First Proof",description:"Prove a real-world capability for the first time.",earned:proven>=1},
    {id:"week-cleared",glyph:"◆",title:"Week Conquered",description:"Clear a complete Path Week of Trials and its Boss.",earned:weeks>=1},
    {id:"boss-hunter",glyph:"◇",title:"Boss Hunter",description:"Prove five Weekly Bosses.",earned:bosses>=5},
    {id:"thousand",glyph:"☀",title:"1,000 XP",description:"Accumulate one thousand XP through Proof.",earned:state.xp>=1000},
    {id:"mastery",glyph:"❈",title:"Ornamented Branch",description:"Develop any Path to 80% capability progress.",earned:mastered>=1},
    {id:"polymath",glyph:"✥",title:"Many Directions",description:"Maintain four active capability Paths.",earned:state.paths.filter(p=>!p.paused).length>=4}
  ];
}

function text(p:SkillPath){return `${p.name} ${p.capability}`.toLowerCase()}
function find(state:AppState,terms:string[]){return state.paths.filter(p=>terms.some(t=>text(p).includes(t)))}

export function deriveConstellations(state:AppState):Constellation[]{
  const dev=find(state,["developer","software","code","program","web","app","engineer"]);
  const biz=find(state,["entrepreneur","business","founder","sales","commerce","brand"]);
  const music=find(state,["music","dj","piano","producer","artist"]);
  const creative=find(state,["creative","design","photo","video","fashion","sew","creator"]);
  const language=find(state,["spanish","japanese","language","communicat"]);
  const athletic=find(state,["basketball","athlete","fitness","calisthen","skate","kung fu","martial"]);
  const make=(id:string,glyph:string,title:string,description:string,a:SkillPath[],b:SkillPath[]):Constellation=>{
    const ids=[a[0]?.id,b[0]?.id].filter(Boolean) as string[];
    return {id,glyph,title,description,pathIds:ids,unlocked:ids.length===2&&ids.every(x=>pathProgress(state,state.paths.find(p=>p.id===x)!)>=10)};
  };
  return [
    make("tech-founder","⌘","Tech Founder","Development capability joined with business execution.",dev,biz),
    make("artist","✺","Artist","Music joined with visual or creative direction.",music,creative),
    make("global-builder","↔","Global Builder","Technical creation joined with cross-language communication.",dev,language),
    make("performance-creator","△","Performance Creator","Physical mastery joined with creative production.",athletic,creative)
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
    {title:"Machine Control & Clean Seams",xpRequired:0,boss:false},{title:"Alter Existing Garments",xpRequired:200,boss:false},{title:"Read & Modify Patterns",xpRequired:480,boss:true},{title:"Draft an Original Garment",xpRequired:820,boss:false},{title:"Construct a Finished Outfit",xpRequired:1300,boss:true},{title:"Release a Small Capsule",xpRequired:1900,boss:true}]}
];

export function templateToPath(t:TreeTemplate):SkillPath{
  const id=`market-${t.id}-${Date.now()}`;
  return {id,name:t.title,glyph:t.glyph,tone:"antique-gold",region:t.region,capability:t.capability,capacity:"steady",nodes:t.nodes.map((n,i)=>({id:`${id}-node-${i+1}`,title:n.title,order:i,xpRequired:n.xpRequired,boss:n.boss}))};
}
