import { createClient } from "@supabase/supabase-js";

// VITE_* vars são substituídas em build-time pelo Vite.
// Os fallbacks abaixo garantem que o build no Vercel/Netlify funcione
// mesmo sem variáveis de ambiente configuradas na plataforma.
// O anon key do Supabase é uma credencial PÚBLICA (client-side) —
// o acesso aos dados é controlado pelas políticas de Row Level Security.
const supabaseUrl =
  (import.meta.env.VITE_SUPABASE_URL as string | undefined) ||
  "https://kujwgpumdggggbnxuhem.supabase.co";

const supabaseAnonKey =
  (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined) ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt1andncHVtZGdnZ2dibnh1aGVtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYxNzgyNzIsImV4cCI6MjA5MTc1NDI3Mn0.if2iY21S6reNWF0b3SfJ02jCarorP1DRamW0SI2knTU";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
