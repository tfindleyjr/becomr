import OpenAI from "openai";
import { NextResponse } from "next/server";

const schema={
  type:"object",
  properties:{
    title:{type:"string"},proof:{type:"string"},xp:{type:"integer"},reason:{type:"string"},
    difficulty:{type:"string",enum:["recover","steady","stretch"]},
    prerequisiteNote:{type:"string"}
  },
  required:["title","proof","xp","reason","difficulty","prerequisiteNote"],additionalProperties:false
};

export async function POST(req:Request){
  try{
    if(!process.env.OPENAI_API_KEY)return NextResponse.json({error:"OPENAI_API_KEY is not configured."},{status:503});
    const body=await req.json();const path=body.path;const currentNode=String(body.currentNode||"").trim();const recentProofs=Array.isArray(body.recentProofs)?body.recentProofs.slice(0,6):[];const archive=body.archive||null;const weekNumber=Number(body.weekNumber||1);const progress=Number(body.progress||0);const capacity=String(body.capacity||"steady");
    if(!path?.name||!currentNode)return NextResponse.json({error:"Path and current node are required."},{status:400});
    const client=new OpenAI({apiKey:process.env.OPENAI_API_KEY});
    const response=await client.responses.create({
      model:process.env.OPENAI_MODEL||"gpt-5-mini",
      input:[
        {role:"system",content:"You are BECOMR's adaptive progression engine. Generate the single best next real-world Trial based on demonstrated capability. Never repeat the same accomplishment. Use recover when evidence shows repeated struggle or limited capacity, steady for normal progress, and stretch only when recent evidence shows strong success. If the requested/current progression assumes a missing foundation, do not push forward blindly: create a prerequisite-strengthening Trial and name that missing foundation in prerequisiteNote. Every Trial must have measurable or reviewable Proof. Never create vague tasks like study, learn, research, practice more, or improve."},
        {role:"user",content:`PATH: ${path.name}\nCAPABILITY: ${path.capability||path.name}\nCURRENT NODE: ${currentNode}\nPATH PROGRESS: ${progress}%\nPATH WEEK: ${weekNumber}\nCAPACITY: ${capacity}\n\nRECENT PROOF:\n${recentProofs.length?recentProofs.map((p:any,i:number)=>`${i+1}. ${p.title} — ${p.evidence||"completed"}`).join("\n"):"No prior Proof supplied."}\n\nLATEST REFLECTION:\nEasier: ${archive?.easier||"none"}\nResisted: ${archive?.resisted||"none"}\nNext bearing: ${archive?.next||"none"}\n\nCreate ONE next Daily Trial. It must be meaningfully different from recent Proof, achievable now, measurable, and aligned with the person's demonstrated ability. XP 30-100.`}
      ],
      text:{format:{type:"json_schema",name:"becomr_next_trial",strict:true,schema}}
    });
    const output=response.output_text?.trim();if(!output)return NextResponse.json({error:"OpenAI returned no adaptive Trial."},{status:502});return NextResponse.json(JSON.parse(output));
  }catch(error:any){console.error("BECOMR adaptive Trial error",error);const status=Number(error?.status)||500;let message=error?.message||"Adaptive Trial generation failed.";if(status===401)message="OpenAI rejected the API key.";if(status===429)message="OpenAI rate limit or quota reached.";return NextResponse.json({error:message},{status:status>=400&&status<600?status:500})}
}
