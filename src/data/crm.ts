export type LeadStage = "novo" | "qualificado" | "visita" | "proposta" | "fechamento";
export type LeadSource = "WhatsApp" | "Instagram" | "Site" | "Indicação";

export interface Lead {
  id: string;
  name: string;
  stage: LeadStage;
  source: LeadSource;
  budget: string;
  interest: "venda" | "aluguel";
  neighborhood: string;
  lastContact: string;
  owner: string;
}

export interface Client {
  id: string;
  name: string;
  profile: string;
  objective: string;
  city: string;
  nextStep: string;
  status: string;
}

export interface Activity {
  id: string;
  title: string;
  time: string;
  detail: string;
}

export const leadStages: { key: LeadStage; label: string }[] = [
  { key: "novo", label: "Novos" },
  { key: "qualificado", label: "Qualificados" },
  { key: "visita", label: "Visitas" },
  { key: "proposta", label: "Propostas" },
  { key: "fechamento", label: "Fechamento" },
];

export const leads: Lead[] = [
  {
    id: "LD-201",
    name: "Marina Dallagnol",
    stage: "novo",
    source: "Instagram",
    budget: "R$ 2,2M a R$ 2,8M",
    interest: "venda",
    neighborhood: "Beira Mar Norte",
    lastContact: "Hoje · 09:14",
    owner: "Ro Molina",
  },
  {
    id: "LD-202",
    name: "Guilherme e Paula Becker",
    stage: "qualificado",
    source: "Site",
    budget: "R$ 12k/mês",
    interest: "aluguel",
    neighborhood: "Jurerê Internacional",
    lastContact: "Hoje · 11:40",
    owner: "Ro Molina",
  },
  {
    id: "LD-203",
    name: "Ricardo Nunes",
    stage: "visita",
    source: "WhatsApp",
    budget: "R$ 4,5M",
    interest: "venda",
    neighborhood: "Cacupé",
    lastContact: "Ontem · 18:05",
    owner: "Ro Molina",
  },
  {
    id: "LD-204",
    name: "Fernanda Moura",
    stage: "proposta",
    source: "Indicação",
    budget: "R$ 8,9k/mês",
    interest: "aluguel",
    neighborhood: "Campeche",
    lastContact: "Ontem · 14:12",
    owner: "Ro Molina",
  },
  {
    id: "LD-205",
    name: "Henrique Volpato",
    stage: "fechamento",
    source: "WhatsApp",
    budget: "R$ 5,6M",
    interest: "venda",
    neighborhood: "Centro",
    lastContact: "Seg · 16:20",
    owner: "Ro Molina",
  },
];

export const clients: Client[] = [
  {
    id: "CL-101",
    name: "Aline Costa",
    profile: "Investidora",
    objective: "Comprar imóvel com vista mar",
    city: "Curitiba",
    nextStep: "Enviar shortlist premium",
    status: "Em aquecimento",
  },
  {
    id: "CL-102",
    name: "Leonardo Freitas",
    profile: "Executivo em transferência",
    objective: "Aluguel mobiliado em Jurerê",
    city: "São Paulo",
    nextStep: "Agendar tour por vídeo",
    status: "Lead quente",
  },
  {
    id: "CL-103",
    name: "Juliana e Marcos",
    profile: "Família com 2 filhos",
    objective: "Casa em condomínio fechado",
    city: "Florianópolis",
    nextStep: "Visita no sábado",
    status: "Visita marcada",
  },
];

export const activities: Activity[] = [
  {
    id: "AT-01",
    title: "Nova proposta recebida",
    time: "10 min atrás",
    detail: "Cobertura Duplex Panorâmica — proposta em revisão.",
  },
  {
    id: "AT-02",
    title: "Lead vindo do site",
    time: "32 min atrás",
    detail: "Formulário de aluguel para Agronômica convertido em lead qualificado.",
  },
  {
    id: "AT-03",
    title: "Visita confirmada",
    time: "1h atrás",
    detail: "Casa Contemporânea com Piscina — visita de amanhã às 15h.",
  },
  {
    id: "AT-04",
    title: "Follow-up pendente",
    time: "2h atrás",
    detail: "Cliente Aline Costa aguardando comparativo de imóveis premium.",
  },
];
