import OpenAI from "openai";
import { NextResponse } from "next/server";

const schema={
  type:"object",
  properties:{
    title:{type:"string"},
    proof:{type:"string"},
    xp:{type:"integer"},
    reason:{type:"string"}
  },
  required:["title","proof","xp","reason"],
  additionalProperties:false
};

export async function POST(req:Request){
  try{
    if(!process.env.OPENAI_API_KEY){
      return NextResponse.json({error:"OPENAI_API_KEY is not configured."},{status:503});
    }

    const body=await req.json();
    const path=body.path;
    const currentNode=String(body.currentNode||"").trim();
    const recentProofs=Array.isArray(body.recentProofs)?body.recentProofs.slice(0,6):[];
    const archive=body.archive||null;
    const weekNumber=Number(body.weekNumber||1);
    const progress=Number(body.progress||0);

    if(!path?.name||!currentNode){
      return NextResponse.json({error:"Path and current node are required."},{status:400});
    }

    const client=new OpenAI({apiKey:process.env.OPENAI_API_KEY});
    const response=await client.responses.create({
      model:process.env.OPENAI_MODEL||"gpt-5-mini",
      input:[
        {
          role:"system",
          content:"You are BECOMR's adaptive progression engine. Generate the single best next real-world Trial for a person based on what they have already Proven. Do not repeat the same accomplishment. Favor concrete, measurable capability. Increase difficulty only enough to create progress, not frustration. If the user reported resistance, isolate and strengthen that weakness. If they reported something became easier, advance beyond it. Trials must be executable in ordinary real life and must have verifiable Proof. Never create vague tasks like study, learn, research, practice more, or improve."
        },
        {
          role:"user",
          content:`PATH: ${path.name}\nCAPABILITY: ${path.capability||path.name}\nCURRENT NODE: ${currentNode}\nPATH PROGRESS: ${progress}%\nPATH WEEK: ${weekNumber}\n\nRECENT PROOF:\n${recentProofs.length?recentProofs.map((p:any,i:number)=>`${i+1}. ${p.title} — ${p.evidence||"completed"}`).join("\n"):"No prior Proof supplied."}\n\nLATEST REFLECTION:\nEasier: ${archive?.easier||"none"}\nResisted: ${archive?.resisted||"none"}\nNext bearing: ${archive?.next||"none"}\n\nCreate ONE next Daily Trial. It must be meaningfully different from recent Proof, achievable now, measurable, and aligned with the current node. XP must be 30-100. Explain in one short sentence why this is the right next challenge.`
        }
      ],
      text:{format:{type:"json_schema",name:"becomr_next_trial",strict:true,schema}}
    });

    const output=response.output_text?.trim();
    if(!output)return NextResponse.json({error:"OpenAI returned no adaptive Trial."},{status:502});
    return NextResponse.json(JSON.parse(output));
  }catch(error:any){
    console.error("BECOMR adaptive Trial error",error);
    const status=Number(error?.status)||500;
    let message=error?.message||"Adaptive Trial generation failed.";
    if(status===401)message="OpenAI rejected the API key.";
    if(status===429)message="OpenAI rate limit or quota reached.";
    return NextResponse.json({error:message},{status:status>=400&&status<600?status:500});
  }
}
