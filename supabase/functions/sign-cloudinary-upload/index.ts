import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const CLOUD_NAME = "ddan59hgh";
const API_KEY = "284476791732246";

async function sha1(message: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest("SHA-1", msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // API_SECRET fica APENAS no servidor, nunca no cliente
    const API_SECRET = Deno.env.get("CLOUDINARY_API_SECRET");
    if (!API_SECRET) {
      return new Response(
        JSON.stringify({ error: "CLOUDINARY_API_SECRET não configurado no servidor" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const body = await req.json();
    const { timestamp, folder } = body as { timestamp: string; folder: string };

    if (!timestamp || !folder) {
      return new Response(
        JSON.stringify({ error: "timestamp e folder são obrigatórios" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Gera a assinatura igual ao Cloudinary espera (params em ordem alfabética + secret)
    const signatureString = `folder=${folder}&timestamp=${timestamp}${API_SECRET}`;
    const signature = await sha1(signatureString);

    return new Response(
      JSON.stringify({ signature, api_key: API_KEY, cloud_name: CLOUD_NAME, timestamp }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
