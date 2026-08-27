import type { AppState } from "./types";
import { supabase, hasSupabaseConfig } from "./supabase";

const BASE_KEY="becomr-v08";

export type SyncMode = "local" | "cloud";
export type SyncStatus = "local" | "syncing" | "saved" | "offline" | "error";

function keyFor(userId?:string|null){
  return `${BASE_KEY}:${userId || "guest"}`;
}

export function loadLocalState(userId?:string|null):AppState|null {
  if(typeof window==="undefined") return null;
  const raw=window.localStorage.getItem(keyFor(userId));
  if(!raw) return null;
  try { return JSON.parse(raw) as AppState; } catch { return null; }
}

export function saveLocalState(state:AppState,userId?:string|null){
  if(typeof window!=="undefined"){
    window.localStorage.setItem(keyFor(userId),JSON.stringify(state));
  }
}

export async function loadCloudState(userId:string):Promise<AppState|null>{
  if(!supabase) return null;
  const { data,error }=await supabase
    .from("user_state")
    .select("state")
    .eq("user_id",userId)
    .maybeSingle();
  if(error) throw error;
  return (data?.state as AppState) || null;
}

export async function saveCloudState(userId:string,state:AppState){
  if(!supabase) return;
  const { error }=await supabase
    .from("user_state")
    .upsert({
      user_id:userId,
      state,
      updated_at:new Date().toISOString()
    },{onConflict:"user_id"});
  if(error) throw error;
}

export async function hydrateStateForUser(userId:string,seed:AppState){
  const cloud=await loadCloudState(userId);

  if(cloud){
    saveLocalState(cloud,userId);
    return {state:cloud,migrated:false,source:"cloud" as const};
  }

  const local=loadLocalState(userId);
  const initial=local || seed;
  await saveCloudState(userId,initial);
  saveLocalState(initial,userId);
  return {state:initial,migrated:false,source:local?"local":"seed" as const};
}

export { hasSupabaseConfig };
