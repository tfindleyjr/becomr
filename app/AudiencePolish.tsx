"use client";

import { useEffect } from "react";

export default function AudiencePolish(){
  useEffect(()=>{
    function stripPhaseLanguage(root:ParentNode=document){
      const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);
      const nodes:Text[]=[];
      while(walker.nextNode())nodes.push(walker.currentNode as Text);
      nodes.forEach(node=>{
        const value=node.nodeValue||"";
        if(/\bphase\s+\d+[a-z]?\b/i.test(value)){
          node.nodeValue=value.replace(/\bphase\s+\d+[a-z]?\b\s*[—–:\-]?\s*/gi,"").replace(/\s{2,}/g," ");
        }
      });
    }

    function polish(){
      document.querySelectorAll<HTMLElement>(".section-rule b").forEach(el=>{
        if(el.textContent?.trim()==="ACCOUNT + TESTING")el.textContent="ACCOUNT + CONTINUITY";
      });
      document.querySelectorAll<HTMLElement>(".storage-card strong").forEach(el=>{
        if(el.textContent?.includes("SUPABASE"))el.textContent="YOUR BUILD IS SAVED";
        if(el.textContent?.includes("LOCAL-FIRST"))el.textContent="YOUR BUILD STAYS WITH YOU";
      });
      document.querySelectorAll<HTMLElement>(".storage-card p").forEach(el=>{
        if(el.textContent?.includes("Your paths, Proof"))el.textContent="Your Paths, Proof, Weekly history, Archive, and Compass move together as one continuous Build.";
      });
      document.querySelectorAll<HTMLElement>(".reset-build,.reset-confirm").forEach(el=>el.remove());
      stripPhaseLanguage();
    }

    polish();
    const observer=new MutationObserver(polish);
    observer.observe(document.body,{childList:true,subtree:true});
    return()=>observer.disconnect();
  },[]);
  return null;
}
