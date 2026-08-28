"use client";

import { useEffect } from "react";

export default function ErrorBoundary({error,reset}:{error:Error&{digest?:string};reset:()=>void}){
  useEffect(()=>{console.error("BECOMR recovered from an application error",error)},[error]);
  return <main className="audience-error"><section><p className="kicker">BECOMR / REORIENT</p><h2>Your Build is still here.</h2><p>Something interrupted this screen, but your saved progression has not been intentionally cleared. Reopen this view and BECOMR will try to align it again.</p><button onClick={reset}>RETURN TO MY BUILD</button></section></main>;
}
