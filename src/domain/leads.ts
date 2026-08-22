export type LeadStage =
  | "novo"
  | "qualificado"
  | "visita"
  | "proposta"
  | "fechamento";

export type LeadSource =
  | "WhatsApp"
  | "Instagram"
  | "Site"
  | "Indicação"
  | "Grupo OLX"
  | "MCMV";

export type LeadInterest = "venda" | "aluguel";

/** Escala de interesse que o próprio portal calcula e manda junto com o lead. */
export type LeadTemperature = "Baixa" | "Média" | "Alta";

export interface LeadFormData {
  name: string;
  stage: LeadStage;
  source: LeadSource;
  budget: string;
  interest: LeadInterest;
  neighborhood: string;
  owner: string;
  phone: string;
  email: string;
  message: string;
}

export interface Lead extends LeadFormData {
  id: string;
  createdAt: string;
  updatedAt?: string;
  lastContact: string;
  marketingData?: Record<string, string>;
  /** Campos que só existem em lead vindo do webhook do Grupo OLX. */
  externalId?: string;
  originListingId?: string;
  clientListingId?: string;
  propertyId?: string;
  leadType?: string;
  temperature?: LeadTemperature;
}

export const leadStages: { key: LeadStage; label: string }[] = [
  { key: "novo", label: "Novos" },
  { key: "qualificado", label: "Qualificados" },
  { key: "visita", label: "Visitas" },
  { key: "proposta", label: "Propostas" },
  { key: "fechamento", label: "Fechamento" },
];

/** Origens que a corretora escolhe ao cadastrar um lead à mão. */
export const leadSources: LeadSource[] = [
  "Site",
  "WhatsApp",
  "Instagram",
  "Indicação",
];

/**
 * Origens gravadas pelo webhook do Grupo OLX — não entram no formulário porque
 * ninguém cadastra um lead de portal na mão.
 */
export const portalSources: LeadSource[] = ["Grupo OLX", "MCMV"];

export function isPortalLead(lead: Pick<Lead, "source">) {
  return portalSources.includes(lead.source);
}

/**
 * Canal do contato dentro do anúncio (extraData.leadType do webhook). Saber se
 * a pessoa pediu visita ou só viu o telefone muda a urgência do retorno.
 */
const leadTypeLabels: Record<string, string> = {
  CLICK_SCHEDULE: "Agendamento",
  CLICK_WHATSAPP: "WhatsApp",
  CONTACT_CHAT: "Chat",
  CONTACT_FORM: "Formulário",
  PHONE_VIEW: "Viu o telefone",
  VISIT_REQUEST: "Pediu visita",
};

export function leadTypeLabel(leadType?: string | null) {
  if (!leadType) return null;
  return leadTypeLabels[leadType] ?? leadType;
}

/** Filtro de origem do painel: agrupa os canais manuais e os portais. */
export const leadSourceFilters: { key: string; label: string; sources: LeadSource[] }[] = [
  { key: "todos", label: "Todas as origens", sources: [] },
  { key: "portais", label: "Portais (OLX/ZAP/VivaReal)", sources: portalSources },
  { key: "site", label: "Site", sources: ["Site"] },
  { key: "whatsapp", label: "WhatsApp", sources: ["WhatsApp"] },
  { key: "instagram", label: "Instagram", sources: ["Instagram"] },
  { key: "indicacao", label: "Indicação", sources: ["Indicação"] },
];

export const emptyLeadForm: LeadFormData = {
  name: "",
  stage: "novo",
  source: "Site",
  budget: "Não informado",
  interest: "venda",
  neighborhood: "",
  owner: "Ro Molina",
  phone: "",
  email: "",
  message: "",
};
