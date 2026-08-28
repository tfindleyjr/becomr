import OpenAI from "openai";
import { NextResponse } from "next/server";

const schema={
  type:"object",
  properties:{
    difficulty:{type:"string",enum:["recover","steady","stretch"]},
    prerequisiteNote:{type:"string"},
    trial1:{type:"object",properties:{title:{type:"string"},proof:{type:"string"},xp:{type:"integer"}},required:["title","proof","xp"],additionalProperties:false},
    trial2:{type:"object",properties:{title:{type:"string"},proof:{type:"string"},xp:{type:"integer"}},required:["title","proof","xp"],additionalProperties:false},
    boss:{type:"object",properties:{title:{type:"string"},proof:{type:"string"},xp:{type:"integer"}},required:["title","proof","xp"],additionalProperties:false},
    reason:{type:"string"}
  },
  required:["difficulty","prerequisiteNote","trial1","trial2","boss","reason"],
  additionalProperties:false
};

export async function POST(req:Request){
  try{
    if(!process.env.OPENAI_API_KEY)return NextResponse.json({error:"OPENAI_API_KEY is not configured."},{status:503});
    const body=await req.json();
    const firstWeek=Boolean(body.firstWeek||Number(body.weekNumber)===1);
    const client=new OpenAI({apiKey:process.env.OPENAI_API_KEY});
    const response=await client.responses.create({
      model:process.env.OPENAI_MODEL||"gpt-5-mini",
      input:[
        {role:"system",content:"You are BECOMR's adaptive weekly progression architect. Build real-world capability challenges that a person can actually perform this week. Never write template filler such as 'create one measurable result', 'practice the skill', 'work on this capability', or 'demonstrate progress' without naming a concrete action and success condition. Every mission must specify WHAT the user does, HOW MUCH/how long/how many when reasonable, and WHAT evidence proves completion. Use domain-appropriate Proof: scores/reps/times for physical skills, working features/deployments for software, recordings/conversation duration for languages/music, finished artifacts for creative work, and real customer/revenue/outreach evidence for business. Use prior Proof and reflection when available. If foundations are missing, narrow the challenge and clearly name the prerequisite."},
        {role:"user",content:`Path: ${body.path?.name}\nCapability: ${body.path?.capability}\nCurrent node: ${body.currentNode}\nNext node: ${body.nextNode}\nWeek: ${body.weekNumber}\nPath progress: ${body.progress}%\nCapacity: ${body.capacity||"steady"}\nThis is the first Week: ${firstWeek}\nPrevious weekly results: ${JSON.stringify(body.previousWeek||[])}\nRecent Proof: ${JSON.stringify(body.recentProofs||[])}\nLatest Archive reflection: ${JSON.stringify(body.archive||null)}\n\nGenerate two ordered Weekly Trials and one Boss. ${firstWeek?"Because this is Week 1, Trial I must be a useful baseline/diagnostic that produces an objective starting result; Trial II must immediately build on that baseline rather than assuming history exists.":"Trial I should respond to the user's current performance and Trial II should bridge toward the next node."} The Boss must combine both Trials into one meaningful real-world result. Give each mission a concrete quantity, duration, attempt count, output, deliverable, or success threshold whenever the domain allows it. Do not use vague placeholder language. Choose recover if recent evidence shows repeated difficulty, steady for normal progress, stretch if evidence shows strong success. prerequisiteNote should be empty unless there is a specific missing foundation.`}
      ],
      text:{format:{type:"json_schema",name:"becomr_weekly_adaptation",strict:true,schema}}
    });
    const output=response.output_text?.trim();
    if(!output)return NextResponse.json({error:"OpenAI returned no weekly progression."},{status:502});
    return NextResponse.json(JSON.parse(output));
  }catch(error:any){
    console.error("BECOMR weekly AI error",error);
    const status=Number(error?.status)||500;
    return NextResponse.json({error:error?.message||"Weekly adaptation failed."},{status:status>=400&&status<600?status:500});
  }
}
