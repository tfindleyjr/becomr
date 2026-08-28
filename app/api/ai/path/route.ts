import OpenAI from "openai";
import { NextResponse } from "next/server";
import { cleanText,guardAIRequest } from "@/lib/serverGuard";

const schema={type:"object",properties:{path:{type:"object",properties:{name:{type:"string"},glyph:{type:"string"},capability:{type:"string"},region:{type:"string"},nodes:{type:"array",minItems:5,maxItems:8,items:{type:"object",properties:{title:{type:"string"},xpRequired:{type:"integer"},boss:{type:"boolean"}},required:["title","xpRequired","boss"],additionalProperties:false}}},required:["name","glyph","capability","region","nodes"],additionalProperties:false},firstQuest:{type:"object",properties:{title:{type:"string"},proof:{type:"string"},xp:{type:"integer"}},required:["title","proof","xp"],additionalProperties:false},weeklyBoss:{type:"object",properties:{title:{type:"string"},proof:{type:"string"},xp:{type:"integer"}},required:["title","proof","xp"],additionalProperties:false},rationale:{type:"string"}},required:["path","firstQuest","weeklyBoss","rationale"],additionalProperties:false};

export async function POST(req:Request){
  const blocked=guardAIRequest(req,"forge");if(blocked)return blocked;
  try{
    if(!process.env.OPENAI_API_KEY)return NextResponse.json({error:"BECOMR's AI Forge is temporarily unavailable."},{status:503});
    const body=await req.json();const goal=cleanText(body.goal,500);const level=cleanText(body.level,40)||"beginner";const capacity=cleanText(body.capacity,40)||"steady";const context=cleanText(body.context,1800);
    if(!goal)return NextResponse.json({error:"Tell BECOMR what you want to become capable of."},{status:400});
    const client=new OpenAI({apiKey:process.env.OPENAI_API_KEY});
    const response=await client.responses.create({model:process.env.OPENAI_MODEL||"gpt-5-mini",input:[{role:"system",content:"You are BECOMR's progression architect. Build practical capability trees for real people, not academic syllabi. Every node must be demonstrable in ordinary life. Progress from foundations to independent execution. Proof must be measurable, observable, reviewable, or countable. Avoid vague goals like learn more, research, or practice. Make the first week immediately useful."},{role:"user",content:`Goal: ${goal}\nCurrent level: ${level}\nAvailable capacity: ${capacity}\nContext: ${context||"none"}\n\nCreate one coherent skill path with 5-8 ordered nodes, a first real-world Proof quest, and a useful Weekly Boss. XP thresholds must increase from 0 upward. The first node starts at 0 XP.`}],text:{format:{type:"json_schema",name:"becomr_progression",strict:true,schema}}});
    const output=response.output_text?.trim();if(!output)return NextResponse.json({error:"BECOMR could not align this Path yet. Try again."},{status:502});
    try{return NextResponse.json(JSON.parse(output))}catch{return NextResponse.json({error:"BECOMR received an incomplete progression. Try again."},{status:502})}
  }catch(error:any){const status=Number(error?.status)||500;let message="BECOMR could not align this Path right now.";if(status===429)message="BECOMR is receiving a lot of requests. Try again in a moment.";if(status===401)message="BECOMR's AI connection needs attention.";return NextResponse.json({error:message},{status:status>=400&&status<600?status:500})}
}
