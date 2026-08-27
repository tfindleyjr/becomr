import { createClient } from "@supabase/supabase-js";
import type { AppState } from "./types";
import type { StateStore } from "./storage";

export class SupabaseStateStore implements StateStore {
  private client = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
  );

  async load():Promise<AppState|null>{
    const { data:{ user } } = await this.client.auth.getUser();
    if(!user) return null;
    const { data,error } = await this.client
      .from("user_state")
      .select("state")
      .eq("user_id",user.id)
      .maybeSingle();
    if(error) throw error;
    return (data?.state as AppState) || null;
  }

  async save(state:AppState){
    const { data:{ user } } = await this.client.auth.getUser();
    if(!user) return;
    const { error } = await this.client
      .from("user_state")
      .upsert({
        user_id:user.id,
        state,
        updated_at:new Date().toISOString()
      },{onConflict:"user_id"});
    if(error) throw error;
  }
}
