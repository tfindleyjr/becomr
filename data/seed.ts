import type { AppState, SkillPath, Quest } from "@/lib/types";

export const seedPaths: SkillPath[] = [
  {
    id:"developer", name:"Developer", glyph:"⌘", tone:"teal", region:"WEST / STRUCTURE",
    capability:"Build digital products",
    nodes:[
      {id:"dev-1",title:"Responsive Foundations",order:1,xpRequired:0},
      {id:"dev-2",title:"Interactive Applications",order:2,xpRequired:120},
      {id:"dev-3",title:"React + TypeScript",order:3,xpRequired:260},
      {id:"dev-4",title:"Full-Stack Systems",order:4,xpRequired:450},
      {id:"dev-5",title:"Production Engineering",order:5,xpRequired:700,boss:true},
      {id:"dev-6",title:"AI Product Builder",order:6,xpRequired:1000,boss:true}
    ]
  },
  {
    id:"musician", name:"Musician", glyph:"♫", tone:"amber", region:"NORTHWEST / RHYTHM",
    capability:"Perform and create music",
    nodes:[
      {id:"music-1",title:"Rhythm",order:1,xpRequired:0},
      {id:"music-2",title:"DJ Foundations",order:2,xpRequired:120},
      {id:"music-3",title:"Beatmatching",order:3,xpRequired:250},
      {id:"music-4",title:"Phrasing",order:4,xpRequired:400},
      {id:"music-5",title:"Piano",order:5,xpRequired:600},
      {id:"music-6",title:"Production",order:6,xpRequired:820,boss:true},
      {id:"music-7",title:"Live Performer",order:7,xpRequired:1100,boss:true}
    ]
  },
  {
    id:"creative", name:"Creative Direction", glyph:"◇", tone:"violet", region:"NORTHEAST / VISION",
    capability:"Direct visual experiences",
    nodes:[
      {id:"creative-1",title:"Visual Literacy",order:1,xpRequired:0},
      {id:"creative-2",title:"Graphic Design",order:2,xpRequired:140},
      {id:"creative-3",title:"Photography",order:3,xpRequired:300},
      {id:"creative-4",title:"Videography",order:4,xpRequired:520},
      {id:"creative-5",title:"Campaign Direction",order:5,xpRequired:800,boss:true}
    ]
  },
  {
    id:"creator", name:"Creator", glyph:"✧", tone:"rose", region:"EAST / CRAFT",
    capability:"Turn ideas into objects",
    nodes:[
      {id:"creator-1",title:"Idea Practice",order:1,xpRequired:0},
      {id:"creator-2",title:"Construction",order:2,xpRequired:130},
      {id:"creator-3",title:"Patternmaking",order:3,xpRequired:310},
      {id:"creator-4",title:"Original Garment",order:4,xpRequired:550,boss:true},
      {id:"creator-5",title:"Collection",order:5,xpRequired:850,boss:true}
    ]
  },
  {
    id:"global", name:"Global Communicator", glyph:"↔", tone:"jade", region:"SOUTHEAST / CONNECTION",
    capability:"Communicate across cultures",
    nodes:[
      {id:"global-1",title:"Spanish A1",order:1,xpRequired:0},
      {id:"global-2",title:"Spanish A2",order:2,xpRequired:180},
      {id:"global-3",title:"Spanish B1",order:3,xpRequired:450,boss:true},
      {id:"global-4",title:"Japanese Kana",order:4,xpRequired:650},
      {id:"global-5",title:"Japanese Conversation",order:5,xpRequired:900,boss:true}
    ]
  },
  {
    id:"entrepreneur", name:"Entrepreneur", glyph:"▦", tone:"gold", region:"SOUTH / EXPANSION",
    capability:"Turn value into enterprise",
    nodes:[
      {id:"biz-1",title:"Money",order:1,xpRequired:0},
      {id:"biz-2",title:"Customer",order:2,xpRequired:150},
      {id:"biz-3",title:"Brand",order:3,xpRequired:320},
      {id:"biz-4",title:"Sales",order:4,xpRequired:550},
      {id:"biz-5",title:"Operator",order:5,xpRequired:850,boss:true}
    ]
  },
  {
    id:"athlete", name:"Athlete", glyph:"△", tone:"terra", region:"SOUTHWEST / FORCE",
    capability:"Control and strengthen the body",
    nodes:[
      {id:"athlete-1",title:"Foundation",order:1,xpRequired:0},
      {id:"athlete-2",title:"Control",order:2,xpRequired:160},
      {id:"athlete-3",title:"L-Sit",order:3,xpRequired:350},
      {id:"athlete-4",title:"Handstand",order:4,xpRequired:600},
      {id:"athlete-5",title:"Muscle-Up",order:5,xpRequired:900,boss:true}
    ]
  },
  {
    id:"truth", name:"Truth Seeker", glyph:"✦", tone:"ivory", region:"WEST-SOUTH / WISDOM",
    capability:"Interrogate belief and evidence",
    nodes:[
      {id:"truth-1",title:"Biblical Literacy",order:1,xpRequired:0},
      {id:"truth-2",title:"New Testament",order:2,xpRequired:180},
      {id:"truth-3",title:"Qur'anic Literacy",order:3,xpRequired:400},
      {id:"truth-4",title:"Jesus File",order:4,xpRequired:600},
      {id:"truth-5",title:"Historical Case",order:5,xpRequired:820,boss:true},
      {id:"truth-6",title:"Final Inquiry",order:6,xpRequired:1100,boss:true}
    ]
  }
];

export const seedQuests: Quest[] = [
  {id:"north",pathId:"developer",title:"Ship one meaningful BECOMR improvement",proof:"A visible improvement is running and you can explain what changed.",xp:100,kind:"boss",nodeId:"dev-3"},
  {id:"dev",pathId:"developer",title:"Build or debug one working feature",proof:"The feature works without a tutorial carrying the implementation.",xp:40,kind:"daily",nodeId:"dev-3"},
  {id:"global",pathId:"global",title:"Produce 10 original Spanish sentences",proof:"10 original sentences spoken or written from memory.",xp:35,kind:"daily",nodeId:"global-1"},
  {id:"body",pathId:"athlete",title:"Accumulate 25 strict pull-ups",proof:"25 honest reps using clean form.",xp:35,kind:"daily",nodeId:"athlete-1"},
  {id:"music",pathId:"musician",title:"Land 5 phrase-aware DJ transitions",proof:"Five transitions enter on the intended musical phrase.",xp:30,kind:"daily",nodeId:"music-2"},
  {id:"truth",pathId:"truth",title:"Read Mark 1–3 and build a Jesus case note",proof:"Separate text, observation, question, counterpoint, and current conclusion.",xp:30,kind:"daily",nodeId:"truth-1"},
  {id:"week-dev",pathId:"developer",title:"WEEKLY BOSS — Complete one production-ready feature",proof:"A complete user-facing feature works, is tested manually, and is committed.",xp:250,kind:"weekly",nodeId:"dev-4"},
  {id:"week-music",pathId:"musician",title:"WEEKLY BOSS — Record a clean 15-minute DJ set",proof:"One uninterrupted recorded set with intentional phrase transitions.",xp:250,kind:"weekly",nodeId:"music-4"},
  {id:"week-body",pathId:"athlete",title:"WEEKLY BOSS — Accumulate 75 strict pull-ups",proof:"75 strict reps logged across the week.",xp:200,kind:"weekly",nodeId:"athlete-2"}
];

export const seedState: AppState = {
  xp:1840,
  momentum:6,
  paths:seedPaths,
  quests:seedQuests,
  archive:[]
};
