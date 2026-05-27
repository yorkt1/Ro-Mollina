import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseAnonKey) {
  // eslint-disable-next-line no-console
  console.error(
    "[supabase] VITE_SUPABASE_URL ou VITE_SUPABASE_ANON_KEY não definidos. " +
      "Crie um arquivo .env na raiz do projeto (veja .env.example).",
  );
}

export const supabase = createClient(supabaseUrl ?? "", supabaseAnonKey ?? "");
