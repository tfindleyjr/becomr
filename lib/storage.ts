import type { AppState } from "./types";

const KEY="becomr-v05";

export interface StateStore {
  load():Promise<AppState|null>;
  save(state:AppState):Promise<void>;
}

export class LocalStateStore implements StateStore {
  async load(){
    if(typeof window==="undefined") return null;
    const raw=window.localStorage.getItem(KEY);
    if(!raw) return null;
    try { return JSON.parse(raw) as AppState; } catch { return null; }
  }
  async save(state:AppState){
    if(typeof window!=="undefined") window.localStorage.setItem(KEY,JSON.stringify(state));
  }
}

export async function createStore():Promise<StateStore>{
  // Phase 15 seam: local-first remains the default.
  // When NEXT_PUBLIC_SUPABASE_URL + NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY exist,
  // this dynamically imports the cloud store.
  if(
    typeof window!=="undefined" &&
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  ){
    const mod=await import("./supabase-store");
    return new mod.SupabaseStateStore();
  }
  return new LocalStateStore();
}
