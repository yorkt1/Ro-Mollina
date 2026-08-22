/**
 * Tradução do payload de lead do Grupo OLX (ZAP / VivaReal / OLX) para as
 * colunas do CRM.
 *
 * Spec do webhook: https://developers.grupozap.com/webhooks/integration_leads.html
 *
 * Fica separado de api/leads/grupozap.js porque é a parte que erra em silêncio:
 * um telefone montado errado só aparece quando a corretora tenta ligar. Aqui é
 * função pura, coberta por src/test/portal-lead.test.ts com os exemplos da
 * própria documentação.
 */

/** Canais de contato dentro do anúncio (extraData.leadType). */
export const LEAD_TYPE_LABELS = {
  CLICK_SCHEDULE: "Agendamento",
  CLICK_WHATSAPP: "WhatsApp",
  CONTACT_CHAT: "Chat",
  CONTACT_FORM: "Formulário",
  PHONE_VIEW: "Telefone",
  VISIT_REQUEST: "Pedido de visita",
};

const TEMPERATURES = ["Baixa", "Média", "Alta"];

/** leadOrigin do portal → `source` do CRM. */
export function mapSource(leadOrigin) {
  return String(leadOrigin ?? "").toUpperCase() === "MCMV_OLX" ? "MCMV" : "Grupo OLX";
}

/** transactionType do portal → `interest` do CRM. RENT/SELL são os únicos valores da spec. */
export function mapInterest(transactionType) {
  return String(transactionType ?? "").toUpperCase() === "RENT" ? "aluguel" : "venda";
}

/**
 * Monta o telefone no formato usado no resto do CRM: (48) 98862-7634.
 *
 * A spec manda `ddd` e `phone` separados e marca `phoneNumber` como obsoleto,
 * mas leads antigos ainda chegam só com ele — por isso o fallback.
 */
export function formatPhone({ ddd, phone, phoneNumber } = {}) {
  const digitsOf = (value) => String(value ?? "").replace(/\D/g, "");
  let area = digitsOf(ddd);
  let number = digitsOf(phone);

  if (!number) {
    const full = digitsOf(phoneNumber);
    // Descarta o 55 do formato internacional antes de separar o DDD.
    const local = full.length > 11 && full.startsWith("55") ? full.slice(2) : full;
    if (local.length >= 10) {
      area = local.slice(0, 2);
      number = local.slice(2);
    } else {
      number = local;
    }
  }

  if (!number) return null;
  if (!area) return number;

  const middle = number.length > 8 ? number.slice(0, number.length - 4) : number.slice(0, 4);
  const tail = number.slice(-4);
  return number.length >= 8 ? `(${area}) ${middle}-${tail}` : `(${area}) ${number}`;
}

/** "Alta" / "média" / "ALTA" → valor canônico; qualquer outra coisa vira null. */
export function normalizeTemperature(value) {
  const raw = String(value ?? "").trim().toLowerCase();
  return TEMPERATURES.find((item) => item.toLowerCase() === raw) ?? null;
}

function formatBRL(value) {
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount <= 0) return null;
  return amount.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  });
}

/**
 * Faixa de valor do lead. Só o lead de MCMV traz esse dado (o simulador do
 * portal pergunta); nos demais o campo continua "Não informado", como nos leads
 * cadastrados à mão.
 */
function resolveBudget(mcmv) {
  const property = formatBRL(mcmv?.propertyValue);
  if (property) return `Imóvel até ${property}`;

  const financing = formatBRL(mcmv?.estimatedFinancingAmount);
  if (financing) return `Financiamento de ${financing}`;

  return "Não informado";
}

/**
 * Mensagem que aparece no card do lead. O portal manda `message` na maioria dos
 * casos, mas PHONE_VIEW e CLICK_WHATSAPP chegam sem texto — sem esse fallback o
 * card ficaria vazio e a corretora não saberia o que a pessoa fez.
 */
function resolveMessage(payload, listing) {
  const message = String(payload?.message ?? "").trim();
  if (message) return message;

  const label = LEAD_TYPE_LABELS[payload?.extraData?.leadType];
  const action = label ? `Contato por ${label.toLowerCase()}` : "Contato";
  return listing ? `${action} no anúncio ${listing}.` : `${action} pelo portal.`;
}

/** Achata os extras do portal em pares de string para `marketing_data`. */
function buildMarketingData(payload, listing) {
  const extra = payload?.extraData ?? {};
  const mcmv = extra.mcmv ?? {};
  const entries = {
    lead_origin: payload?.leadOrigin,
    lead_type: extra.leadType,
    origin_lead_id: payload?.originLeadId,
    origin_listing_id: payload?.originListingId,
    client_listing_id: listing,
    portal_timestamp: payload?.timestamp,
    lead_certo: extra.leadCerto === true ? "sim" : extra.leadCerto === false ? "não" : undefined,
    izi: extra.izi,
    feedback: extra.feedback,
    mcmv_tipo: mcmv.unitType,
    mcmv_cidade: mcmv.propertyLocation?.city,
    mcmv_uf: mcmv.propertyLocation?.state,
    mcmv_valor_imovel: formatBRL(mcmv.propertyValue),
    mcmv_entrada: formatBRL(mcmv.downPayment),
    mcmv_financiamento: formatBRL(mcmv.estimatedFinancingAmount),
    mcmv_faixa: mcmv.subsidyRange,
    mcmv_urgencia: mcmv.urgencyToBuy,
  };

  const marketingData = {};
  for (const [key, value] of Object.entries(entries)) {
    if (value === undefined || value === null) continue;
    const text = String(value).trim();
    // Corta valores absurdos: `izi` e `feedback` vêm com texto longo do portal.
    if (text) marketingData[key] = text.slice(0, 500);
  }
  return marketingData;
}

/**
 * Payload do portal → argumentos de public.ingest_portal_lead().
 *
 * Devolve `{ ok: false, error }` só quando o corpo não dá para aproveitar de
 * jeito nenhum. Campo faltando isolado (sem e-mail, sem clientListingId) não
 * invalida o lead: perder um contato real é pior do que gravar um cadastro
 * incompleto — a corretora completa depois.
 */
export function mapPortalLead(payload) {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return { ok: false, error: "Corpo da requisição não é um objeto JSON" };
  }

  const name = String(payload.name ?? "").trim();
  const email = String(payload.email ?? "").trim().toLowerCase();
  const phone = formatPhone(payload);

  if (!name && !email && !phone) {
    return { ok: false, error: "Lead sem nome, telefone ou e-mail" };
  }

  const listing = String(payload.clientListingId ?? "").trim() || null;
  const mcmv = payload.extraData?.mcmv;

  return {
    ok: true,
    lead: {
      p_external_id: String(payload.originLeadId ?? "").trim() || null,
      p_name: name || "Contato sem nome",
      p_phone: phone,
      p_email: email || null,
      p_message: resolveMessage(payload, listing),
      p_source: mapSource(payload.leadOrigin),
      p_interest: mapInterest(payload.transactionType),
      p_budget: resolveBudget(mcmv),
      p_temperature: normalizeTemperature(payload.temperature),
      p_lead_type: String(payload.extraData?.leadType ?? "").trim() || null,
      p_origin_listing_id: String(payload.originListingId ?? "").trim() || null,
      p_client_listing_id: listing,
      p_marketing_data: buildMarketingData(payload, listing),
    },
  };
}
