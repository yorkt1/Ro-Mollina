import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://kujwgpumdggggbnxuhem.supabase.co";
const supabaseAnonKey = "sb_publishable_x_9bzq472lb9rXVqV1cmZw_Y-aHu3Px";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
