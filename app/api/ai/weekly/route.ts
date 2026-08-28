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
    const client=new OpenAI({apiKey:process.env.OPENAI_API_KEY});
    const response=await client.responses.create({
      model:process.env.OPENAI_MODEL||"gpt-5-mini",
      input:[
        {role:"system",content:"You are BECOMR's adaptive weekly progression architect. Build real-world capability challenges. Use prior Proof and reflection to calibrate difficulty. If foundations are missing, narrow the challenge and clearly name the prerequisite. Never generate vague practice tasks. Every Proof must be measurable, observable, reviewable, or countable."},
        {role:"user",content:`Path: ${body.path?.name}\nCapability: ${body.path?.capability}\nCurrent node: ${body.currentNode}\nNext node: ${body.nextNode}\nWeek: ${body.weekNumber}\nPath progress: ${body.progress}%\nCapacity: ${body.capacity||"steady"}\nPrevious weekly results: ${JSON.stringify(body.previousWeek||[])}\nRecent Proof: ${JSON.stringify(body.recentProofs||[])}\nLatest Archive reflection: ${JSON.stringify(body.archive||null)}\n\nGenerate two ordered Weekly Trials and one Boss. Trial I should strengthen the current ability. Trial II should bridge toward the next node. The Boss should combine them into a meaningful real-world result. Choose recover if recent evidence shows repeated difficulty, steady for normal progress, stretch if evidence shows strong success. prerequisiteNote should be empty unless there is a specific missing foundation.`}
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
