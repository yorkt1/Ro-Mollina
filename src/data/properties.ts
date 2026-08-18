export type PropertyType = string;
export type PropertyPurpose = "venda" | "aluguel";

export interface Property {
  id: string;
  shortId?: number;
  title: string;
  description: string;
  fullDescription?: string;
  price: number;
  location: string;
  neighborhood: string;
  type: PropertyType;
  purpose: PropertyPurpose;
  bedrooms: number;
  suites: number;
  bathrooms: number;
  area: number;
  parkingSpots: number;
  featured: boolean;
  opportunity?: boolean;
  exclusive: boolean;
  tag?: string;
  images: string[];
  refCode?: string;
  zone?: string;
  region?: string;
  totalArea?: number;
  builtArea?: number;
  landArea?: number;
  landFront?: number;
  landBack?: number;
  landLeft?: number;
  landRight?: number;
  rooms?: number;
  accommodates?: number;
  furnished?: boolean;
  swap?: boolean;
  acceptsFinancing?: boolean;
  contractType?: string;
  iptuPeriod?: string;
  videoUrl?: string;
  mapEmbedUrl?: string;
  nearby?: string[];
  leisure?: string[];
  roomsList?: string[];
  cep?: string;
  addressNumber?: string;
  street?: string;
  /** Publicado no Grupo OLX (OLX Imóveis / ZAP / VivaReal) via /vrsync.xml. */
  olxEnabled?: boolean;
  olxEnabledAt?: string;
}

export const formatCurrency = (value: number) =>
  value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 0,
  });

export const formatPropertyPrice = (property: Pick<Property, "price" | "purpose">) => {
  if (property.price === 0) return "Consulte";
  return property.purpose === "aluguel"
    ? `${formatCurrency(property.price)}/mês`
    : formatCurrency(property.price);
};

export const purposeLabel = (purpose: PropertyPurpose) =>
  purpose === "venda" ? "Venda" : "Aluguel";

export const propertyTypeLabel = (type: PropertyType) => {
  const labels: Record<string, string> = {
    apartamento: "Apartamento",
    casa: "Casa",
    cobertura: "Cobertura",
    terreno: "Terreno",
  };
  return labels[type] || (type ? type.charAt(0).toUpperCase() + type.slice(1) : "");
};

export const LOCATION_GROUPS = [
  {
    city: "Florianópolis",
    neighborhoods: [
      "Centro", "Agronômica", "Trindade", "Itacorubi", "Santa Mônica",
      "Córrego Grande", "João Paulo", "Pantanal", "Monte Verde", "Saco Grande",
      "Cacupé", "Santo Antônio de Lisboa", "Sambaqui", "Jurerê",
      "Jurerê Internacional", "Canasvieiras", "Cachoeira do Bom Jesus",
      "Ponta das Canas", "Praia Brava", "Ingleses", "Santinho",
      "Rio Vermelho", "São João do Rio Vermelho", "Vargem Grande",
      "Vargem Pequena", "Ratones", "Lagoa da Conceição", "Barra da Lagoa",
      "Fortaleza da Barra da Lagoa", "Costa da Lagoa", "Rio Tavares",
      "Joaquina", "Moçambique", "Campeche", "Novo Campeche", "Morro das Pedras",
      "Armação", "Pântano do Sul", "Ribeirão da Ilha", "Tapera", "Carianos",
      "Coqueiros", "Estreito", "Beira-Mar Norte",
    ],
  },
  {
    city: "São José",
    neighborhoods: [
      "Kobrasol", "Campinas", "Barreiros", "Areias", "Forquilhinhas",
      "Serraria", "Ipiranga", "Bela Vista",
    ],
  },
  {
    city: "Palhoça",
    neighborhoods: [
      "Pedra Branca", "Pagani", "Passa Vinte", "Praia da Pinheira",
      "Guarda do Embaú", "Ponte do Imaruim", "Bela Vista", "Caminho Novo",
    ],
  },
  {
    city: "Biguaçu",
    neighborhoods: [
      "Centro", "Praia João Rosa", "Bom Viver", "Deltaville", "Fundos",
      "Jardim Janaina",
    ],
  },
];

export const WHATSAPP_NUMBER = "5548988627634";
export const WHATSAPP_MESSAGE =
  "Olá! Vi seu site e gostaria de falar sobre imóveis para compra ou aluguel em Florianópolis.";

export const whatsappLink = (message = WHATSAPP_MESSAGE) =>
  `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
