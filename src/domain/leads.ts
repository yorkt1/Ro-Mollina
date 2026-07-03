export type LeadStage =
  | "novo"
  | "qualificado"
  | "visita"
  | "proposta"
  | "fechamento";

export type LeadSource = "WhatsApp" | "Instagram" | "Site" | "Indicação";
export type LeadInterest = "venda" | "aluguel";

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
}

export const leadStages: { key: LeadStage; label: string }[] = [
  { key: "novo", label: "Novos" },
  { key: "qualificado", label: "Qualificados" },
  { key: "visita", label: "Visitas" },
  { key: "proposta", label: "Propostas" },
  { key: "fechamento", label: "Fechamento" },
];

export const leadSources: LeadSource[] = [
  "Site",
  "WhatsApp",
  "Instagram",
  "Indicação",
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
