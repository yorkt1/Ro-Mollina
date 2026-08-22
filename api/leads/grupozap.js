/**
 * Função serverless (Vercel) — recebe os leads do Grupo OLX (ZAP Imóveis,
 * VivaReal e OLX Imóveis) e grava direto no CRM.
 *
 * Como a integração funciona: no Canal Pro, em Configurações → Integrações →
 * Leads → "Receber leads no CRM", cadastra-se o nome do CRM e a URL abaixo.
 * A partir daí, cada contato num anúncio nosso vira um POST JSON aqui —
 * não há API para buscar leads, quem chama é o portal.
 *
 * Spec: https://developers.grupozap.com/webhooks/integration_leads.html
 * Roteamento: ver vercel.json — /grupozap/lead → /api/leads/grupozap
 *
 * Regras do portal que este arquivo respeita:
 *   • Sucesso é QUALQUER 2xx. 3xx/4xx/5xx viram até 3 reenvios automáticos, e
 *     o lead fica guardado por 14 dias para redelivery.
 *   • O mesmo lead pode chegar mais de uma vez — a deduplicação por
 *     originLeadId é feita em public.ingest_portal_lead().
 *   • O POST tem timeout de 30s do lado do portal.
 *
 * Variáveis de ambiente (Vercel):
 *   SUPABASE_SERVICE_ROLE_KEY  obrigatória — grava o lead sem depender do anon
 *                              key (que é público e não tem INSERT em leads).
 *   GRUPOZAP_LEAD_SECRET       opcional — se definida, o POST só é aceito com
 *                              o token, via ?token=, header X-API-KEY ou
 *                              Basic Auth (formato usuario:SEGREDO da spec).
 */

import { timingSafeEqual } from "node:crypto";
import { mapPortalLead } from "../_portal-lead.js";

const SUPABASE_URL = (
  process.env.SUPABASE_URL ||
  process.env.VITE_SUPABASE_URL ||
  "https://kujwgpumdggggbnxuhem.supabase.co"
).replace(/\/$/, "");

const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const LEAD_SECRET = process.env.GRUPOZAP_LEAD_SECRET || "";

/** Margem sobre o timeout de 30s do portal: melhor responder 500 do que estourar o tempo dele. */
const DB_TIMEOUT_MS = 20_000;

function safeEquals(a, b) {
  const left = Buffer.from(String(a));
  const right = Buffer.from(String(b));
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

/**
 * Extrai o segredo da requisição. A tela do Canal Pro só aceita uma URL, sem
 * campo de senha, então o token na query string é o caminho realista; o Basic
 * Auth da documentação e o X-API-KEY ficam aceitos para quem cadastrar pelo
 * validador de endpoint do Grupo OLX.
 */
export function extractSecret(req, url) {
  const fromQuery = url.searchParams.get("token") || url.searchParams.get("secret");
  if (fromQuery) return fromQuery;

  const apiKey = req.headers["x-api-key"];
  if (apiKey) return String(apiKey);

  const authorization = String(req.headers.authorization || "");
  if (/^basic /i.test(authorization)) {
    const decoded = Buffer.from(authorization.slice(6).trim(), "base64").toString("utf-8");
    // "usuario:SECRET_KEY" — o segredo é o que vem depois do primeiro ":".
    const separator = decoded.indexOf(":");
    return separator === -1 ? decoded : decoded.slice(separator + 1);
  }
  if (/^bearer /i.test(authorization)) return authorization.slice(7).trim();

  return "";
}

/** O runtime já entrega req.body parseado quando o content-type é JSON; o resto é fallback. */
async function readJsonBody(req) {
  if (req.body && typeof req.body === "object") return req.body;

  let raw = typeof req.body === "string" ? req.body : "";
  if (!raw) {
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    raw = Buffer.concat(chunks).toString("utf-8");
  }

  if (!raw.trim()) return null;
  return JSON.parse(raw);
}

async function ingestLead(args) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), DB_TIMEOUT_MS);

  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/ingest_portal_lead`, {
      method: "POST",
      headers: {
        apikey: SERVICE_ROLE_KEY,
        Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(args),
      signal: controller.signal,
    });

    const text = await response.text();
    if (!response.ok) {
      throw new Error(`Supabase ${response.status}: ${text.slice(0, 300)}`);
    }
    return text ? JSON.parse(text) : {};
  } finally {
    clearTimeout(timer);
  }
}

export default async function handler(req, res) {
  const url = new URL(req.url, `https://${req.headers.host || "localhost"}`);

  // GET serve só para conferir no navegador se a URL cadastrada está de pé.
  if (req.method === "GET" || req.method === "HEAD") {
    return res.status(200).json({
      endpoint: "grupozap-lead",
      method: "POST",
      authenticated: Boolean(LEAD_SECRET),
      configured: Boolean(SERVICE_ROLE_KEY),
    });
  }

  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Use POST" });
  }

  if (LEAD_SECRET && !safeEquals(extractSecret(req, url), LEAD_SECRET)) {
    console.warn("[grupozap-lead] token inválido");
    return res.status(401).json({ error: "Token inválido" });
  }

  let payload;
  try {
    payload = await readJsonBody(req);
  } catch (err) {
    console.error("[grupozap-lead] JSON inválido:", err.message);
    return res.status(400).json({ error: "JSON inválido" });
  }

  const mapped = mapPortalLead(payload);
  if (!mapped.ok) {
    // 400 aqui é o único caso em que vale recusar: reenviar o mesmo corpo
    // quebrado três vezes não muda o resultado.
    console.error("[grupozap-lead] payload recusado:", mapped.error);
    return res.status(400).json({ error: mapped.error });
  }

  if (!SERVICE_ROLE_KEY) {
    // 500 (e não 400) de propósito: o portal reenvia por até 14 dias, então o
    // lead ainda chega depois que a variável de ambiente for configurada.
    console.error("[grupozap-lead] SUPABASE_SERVICE_ROLE_KEY não configurada");
    return res.status(500).json({ error: "Integração não configurada" });
  }

  try {
    const result = await ingestLead(mapped.lead);
    console.log(
      `[grupozap-lead] ${result?.duplicate ? "reenvio" : "novo"} id=${result?.id} ` +
        `anuncio=${mapped.lead.p_client_listing_id ?? "-"} tipo=${mapped.lead.p_lead_type ?? "-"}`,
    );
    return res.status(200).json({
      received: true,
      id: result?.id ?? null,
      duplicate: Boolean(result?.duplicate),
    });
  } catch (err) {
    // Falha de banco → 500 para o portal reenviar. Um lead perdido é venda perdida.
    console.error("[grupozap-lead] falha ao gravar:", err.message);
    return res.status(500).json({ error: "Falha ao gravar o lead" });
  }
}
