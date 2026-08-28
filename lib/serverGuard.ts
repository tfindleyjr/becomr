import { NextResponse } from "next/server";

const buckets=new Map<string,{count:number;resetAt:number}>();
const WINDOW_MS=60_000;
const MAX_REQUESTS=18;
const MAX_BODY_BYTES=32_000;

function clientKey(req:Request,route:string){
  const forwarded=req.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const real=req.headers.get("x-real-ip")?.trim();
  return `${route}:${forwarded||real||"anonymous"}`;
}

export function guardAIRequest(req:Request,route:string){
  const length=Number(req.headers.get("content-length")||0);
  if(length>MAX_BODY_BYTES)return NextResponse.json({error:"This request is too large. Shorten the supplied context and try again."},{status:413});
  const now=Date.now();const key=clientKey(req,route);const current=buckets.get(key);
  if(!current||current.resetAt<=now){buckets.set(key,{count:1,resetAt:now+WINDOW_MS});return null}
  if(current.count>=MAX_REQUESTS){
    const retry=Math.max(1,Math.ceil((current.resetAt-now)/1000));
    return NextResponse.json({error:"BECOMR is aligning too many AI requests at once. Try again in a moment."},{status:429,headers:{"Retry-After":String(retry)}});
  }
  current.count+=1;buckets.set(key,current);return null;
}

export function cleanText(value:unknown,max=1200){return String(value??"").replace(/\0/g,"").trim().slice(0,max)}
export function cleanNumber(value:unknown,min:number,max:number,fallback:number){const n=Number(value);return Number.isFinite(n)?Math.max(min,Math.min(max,n)):fallback}
export function cleanArray<T>(value:unknown,max=8):T[]{return Array.isArray(value)?value.slice(0,max) as T[]:[]}
