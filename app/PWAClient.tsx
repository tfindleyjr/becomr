"use client";

import { useEffect, useState } from "react";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

export default function PWAClient(){
  const [deferred,setDeferred]=useState<BeforeInstallPromptEvent|null>(null);
  const [installed,setInstalled]=useState(false);
  const [ios,setIos]=useState(false);
  const [showIos,setShowIos]=useState(false);

  async function install(){
    if(deferred){
      await deferred.prompt();
      const choice=await deferred.userChoice;
      if(choice.outcome==="accepted") setInstalled(true);
      setDeferred(null);
      return;
    }
    if(ios) setShowIos(true);
  }

  useEffect(()=>{
    if("serviceWorker" in navigator){
      navigator.serviceWorker.register("/sw.js").catch(err=>console.warn("BECOMR service worker registration failed",err));
    }

    const standalone=window.matchMedia("(display-mode: standalone)").matches || (navigator as Navigator & {standalone?:boolean}).standalone===true;
    setInstalled(standalone);
    setIos(/iphone|ipad|ipod/i.test(navigator.userAgent));

    const onPrompt=(event:Event)=>{
      event.preventDefault();
      setDeferred(event as BeforeInstallPromptEvent);
    };
    const onInstalled=()=>{
      setInstalled(true);
      setDeferred(null);
      setShowIos(false);
    };
    const onInstallRequest=()=>{void install()};

    window.addEventListener("beforeinstallprompt",onPrompt);
    window.addEventListener("appinstalled",onInstalled);
    window.addEventListener("becomr-install-app",onInstallRequest);
    return ()=>{
      window.removeEventListener("beforeinstallprompt",onPrompt);
      window.removeEventListener("appinstalled",onInstalled);
      window.removeEventListener("becomr-install-app",onInstallRequest);
    };
  },[deferred,ios]);

  if(installed) return null;

  return <>
    <button className="pwa-install" onClick={install}>{deferred?"INSTALL BECOMR":ios?"ADD TO HOME SCREEN":"INSTALL APP"}</button>
    {showIos&&<div className="pwa-ios-sheet">
      <button className="pwa-ios-close" onClick={()=>setShowIos(false)}>×</button>
      <p className="kicker">INSTALL / IOS</p>
      <h3>Keep BECOMR on your Home Screen.</h3>
      <p>In Safari, tap the <strong>Share</strong> button, then choose <strong>Add to Home Screen</strong>.</p>
      <button onClick={()=>setShowIos(false)}>GOT IT</button>
    </div>}
  </>;
}
