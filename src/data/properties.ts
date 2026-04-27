import property1 from "@/assets/property-1.jpg";
import property2 from "@/assets/property-2.jpg";
import property3 from "@/assets/property-3.jpg";
import property4 from "@/assets/property-4.jpg";

export type PropertyType = "apartamento" | "casa" | "cobertura" | "terreno";
export type PropertyPurpose = "venda" | "aluguel";

export interface Property {
  id: string;
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
  exclusive: boolean;
  tag?: string;
  images: string[];
  // Extended fields
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
}

export const properties: Property[] = [
  // ─── VENDA ───
  {
    id: "1",
    title: "Apartamento 4 suítes com vista mar na Barra da Lagoa",
    description: "Apartamento de alto padrão com 4 suítes, acabamentos nobres e vista panorâmica para o mar na Barra da Lagoa.",
    price: 5000000,
    location: "Florianópolis/SC",
    neighborhood: "Barra da Lagoa",
    type: "apartamento",
    purpose: "venda",
    bedrooms: 4,
    suites: 4,
    bathrooms: 5,
    area: 280,
    parkingSpots: 4,
    featured: true,
    exclusive: false,
    tag: "Pronto para morar",
    images: [property1, property3, property2],
  },
  {
    id: "2",
    title: "Apartamento mobiliado 115 m², 3 suítes, 2 vagas - Jurerê",
    description: "Apartamento mobiliado com 3 suítes e localização privilegiada em Jurerê Internacional.",
    price: 2100000,
    location: "Florianópolis/SC",
    neighborhood: "Jurerê Internacional",
    type: "apartamento",
    purpose: "venda",
    bedrooms: 3,
    suites: 3,
    bathrooms: 2,
    area: 115,
    parkingSpots: 2,
    featured: true,
    exclusive: false,
    tag: "Pronto para morar",
    images: [property2, property4, property1],
  },
  {
    id: "3",
    title: "Apartamento Alto Padrão no Campeche",
    description: "Apartamento alto padrão no Campeche com 4 suítes e ampla área social.",
    price: 4450000,
    location: "Florianópolis/SC",
    neighborhood: "Campeche",
    type: "apartamento",
    purpose: "venda",
    bedrooms: 4,
    suites: 4,
    bathrooms: 4,
    area: 242,
    parkingSpots: 4,
    featured: true,
    exclusive: false,
    tag: "Pronto para morar",
    images: [property3, property1, property2],
  },
  {
    id: "4",
    title: "Cobertura duplex com piscina na Lagoa da Conceição",
    description: "Cobertura duplex mobiliada com piscina privativa, terraço gourmet e vista para a Lagoa.",
    price: 2800000,
    location: "Florianópolis/SC",
    neighborhood: "Lagoa da Conceição",
    type: "cobertura",
    purpose: "venda",
    bedrooms: 3,
    suites: 3,
    bathrooms: 3,
    area: 320,
    parkingSpots: 3,
    featured: true,
    exclusive: false,
    tag: "Novo",
    images: [property4, property2, property1],
  },
  {
    id: "5",
    title: "Casa em condomínio fechado no Cacupé",
    description: "Casa de luxo decorada com projeto de interiores exclusivo no Cacupé, vista para o mar.",
    price: 8500000,
    location: "Florianópolis/SC",
    neighborhood: "Cacupé",
    type: "casa",
    purpose: "venda",
    bedrooms: 4,
    suites: 4,
    bathrooms: 5,
    area: 385,
    parkingSpots: 4,
    featured: true,
    exclusive: false,
    tag: "Pronto para morar",
    images: [property1, property4, property2],
  },
  {
    id: "6",
    title: "Cobertura Duplex no Centro de Florianópolis - 301 m²",
    description: "Cobertura duplex mobiliada no Centro com 4 suítes, 6 banheiros e acabamentos de alto padrão.",
    price: 7000000,
    location: "Florianópolis/SC",
    neighborhood: "Centro",
    type: "cobertura",
    purpose: "venda",
    bedrooms: 4,
    suites: 4,
    bathrooms: 6,
    area: 333,
    parkingSpots: 4,
    featured: true,
    exclusive: false,
    tag: "Pronto para morar",
    images: [property2, property3, property4],
  },
  {
    id: "7",
    title: "Apartamento 171 m² com 3 suítes no Itacorubi",
    description: "Apartamento em condomínio clube no Itacorubi com lazer completo e 3 suítes.",
    price: 2590000,
    location: "Florianópolis/SC",
    neighborhood: "Itacorubi",
    type: "apartamento",
    purpose: "venda",
    bedrooms: 3,
    suites: 3,
    bathrooms: 3,
    area: 171,
    parkingSpots: 3,
    featured: true,
    exclusive: false,
    tag: "Pronto para morar",
    images: [property3, property4, property1],
  },
  {
    id: "8",
    title: "Apartamento à Venda na Trindade",
    description: "Apartamento com 3 quartos e 2 suítes na Trindade, próximo à UFSC.",
    price: 1600000,
    location: "Florianópolis/SC",
    neighborhood: "Trindade",
    type: "apartamento",
    purpose: "venda",
    bedrooms: 3,
    suites: 2,
    bathrooms: 3,
    area: 136,
    parkingSpots: 2,
    featured: true,
    exclusive: false,
    images: [property4, property1, property3],
  },

  // ─── ALUGUEL ───
  {
    id: "9",
    title: "Apartamento 1 dorm com vaga na Barra da Lagoa",
    description: "Apartamento compacto e funcional com 1 dormitório e vaga de garagem na Barra da Lagoa.",
    price: 4000,
    location: "Florianópolis/SC",
    neighborhood: "Barra da Lagoa",
    type: "apartamento",
    purpose: "aluguel",
    bedrooms: 1,
    suites: 0,
    bathrooms: 1,
    area: 50,
    parkingSpots: 1,
    featured: true,
    exclusive: false,
    tag: "Pronto para morar",
    images: [property1, property4, property2],
  },
  {
    id: "10",
    title: "Apartamento Alto Padrão para Alugar em Jurerê",
    description: "Apartamento alto padrão em Jurerê Internacional com 4 suítes e lazer completo.",
    price: 20000,
    location: "Florianópolis/SC",
    neighborhood: "Jurerê Internacional",
    type: "apartamento",
    purpose: "aluguel",
    bedrooms: 4,
    suites: 4,
    bathrooms: 4,
    area: 242,
    parkingSpots: 4,
    featured: true,
    exclusive: false,
    tag: "Pronto para morar",
    images: [property2, property1, property3],
  },
  {
    id: "11",
    title: "Apartamento 3 suítes na Lagoa da Conceição",
    description: "Apartamento premium com vista para a Lagoa, condomínio exclusivo.",
    price: 18000,
    location: "Florianópolis/SC",
    neighborhood: "Lagoa da Conceição",
    type: "apartamento",
    purpose: "aluguel",
    bedrooms: 3,
    suites: 3,
    bathrooms: 5,
    area: 227,
    parkingSpots: 3,
    featured: true,
    exclusive: false,
    tag: "Pronto para morar",
    images: [property3, property2, property4],
  },
  {
    id: "12",
    title: "Apartamento Alto Padrão para Alugar no Campeche",
    description: "Locação premium com 3 suítes e acabamentos sofisticados no Campeche.",
    price: 15900,
    location: "Florianópolis/SC",
    neighborhood: "Campeche",
    type: "apartamento",
    purpose: "aluguel",
    bedrooms: 3,
    suites: 3,
    bathrooms: 4,
    area: 264,
    parkingSpots: 3,
    featured: true,
    exclusive: false,
    tag: "Pronto para morar",
    images: [property4, property3, property1],
  },
  {
    id: "13",
    title: "Apartamento para Locação no Córrego Grande",
    description: "Apartamento em condomínio clube com infraestrutura completa no Córrego Grande.",
    price: 7500,
    location: "Florianópolis/SC",
    neighborhood: "Córrego Grande",
    type: "apartamento",
    purpose: "aluguel",
    bedrooms: 3,
    suites: 1,
    bathrooms: 2,
    area: 105,
    parkingSpots: 2,
    featured: true,
    exclusive: false,
    tag: "Pronto para morar",
    images: [property1, property2, property4],
  },
  {
    id: "14",
    title: "Apartamento Mobiliado para Locação no Itacorubi",
    description: "Apartamento mobiliado com 4 suítes, ideal para famílias que buscam praticidade.",
    price: 12000,
    location: "Florianópolis/SC",
    neighborhood: "Itacorubi",
    type: "apartamento",
    purpose: "aluguel",
    bedrooms: 4,
    suites: 4,
    bathrooms: 3,
    area: 180,
    parkingSpots: 3,
    featured: true,
    exclusive: false,
    tag: "Pronto para morar",
    images: [property2, property3, property1],
  },
  {
    id: "15",
    title: "Apartamento Alto Padrão em Coqueiros para Alugar",
    description: "Apartamento alto padrão em Coqueiros com 4 suítes e vista para a baía.",
    price: 17500,
    location: "Florianópolis/SC",
    neighborhood: "Coqueiros",
    type: "apartamento",
    purpose: "aluguel",
    bedrooms: 4,
    suites: 4,
    bathrooms: 4,
    area: 233,
    parkingSpots: 4,
    featured: true,
    exclusive: false,
    tag: "Pronto para morar",
    images: [property3, property4, property2],
  },
  {
    id: "16",
    title: "Apartamento Locação Centro - 76 m² - 2 vagas",
    description: "Apartamento compacto e moderno no Centro de Florianópolis com 2 quartos.",
    price: 5500,
    location: "Florianópolis/SC",
    neighborhood: "Centro",
    type: "apartamento",
    purpose: "aluguel",
    bedrooms: 2,
    suites: 1,
    bathrooms: 2,
    area: 76,
    parkingSpots: 2,
    featured: true,
    exclusive: false,
    tag: "Pronto para morar",
    images: [property4, property1, property3],
  },

  // ─── EXCLUSIVIDADES ───
  {
    id: "17",
    title: "Apartamento 392 m² com vista mar na Beira-Mar Norte",
    description: "Apartamento exclusivo com vista panorâmica para o mar, 3 suítes e 7 banheiros na Beira-Mar Norte.",
    price: 10990000,
    location: "Florianópolis/SC",
    neighborhood: "Beira-Mar Norte",
    type: "apartamento",
    purpose: "venda",
    bedrooms: 3,
    suites: 3,
    bathrooms: 7,
    area: 392,
    parkingSpots: 5,
    featured: false,
    exclusive: true,
    tag: "Semi-novo",
    images: [property1, property2, property3],
  },
  {
    id: "18",
    title: "Apartamento de luxo em Jurerê Internacional",
    description: "O mais exclusivo apartamento de Jurerê com 4 suítes e acabamentos importados.",
    price: 12000000,
    location: "Florianópolis/SC",
    neighborhood: "Jurerê Internacional",
    type: "apartamento",
    purpose: "venda",
    bedrooms: 4,
    suites: 4,
    bathrooms: 6,
    area: 374,
    parkingSpots: 6,
    featured: false,
    exclusive: true,
    tag: "Pronto para morar",
    images: [property2, property4, property1],
  },
  {
    id: "19",
    title: "Apartamento Alto Padrão na Lagoa da Conceição",
    description: "Apartamento alto padrão com 3 suítes pronto para mobiliar com vista para a Lagoa.",
    price: 3300000,
    location: "Florianópolis/SC",
    neighborhood: "Lagoa da Conceição",
    type: "apartamento",
    purpose: "venda",
    bedrooms: 3,
    suites: 3,
    bathrooms: 4,
    area: 171,
    parkingSpots: 4,
    featured: false,
    exclusive: true,
    tag: "Pronto para Mobiliar",
    images: [property3, property1, property4],
  },
  {
    id: "20",
    title: "Apartamento Alto Padrão no Cacupé",
    description: "Localização privilegiada no Cacupé com vista para o mar continental.",
    price: 1750000,
    location: "Florianópolis/SC",
    neighborhood: "Cacupé",
    type: "apartamento",
    purpose: "venda",
    bedrooms: 3,
    suites: 3,
    bathrooms: 6,
    area: 192,
    parkingSpots: 3,
    featured: false,
    exclusive: true,
    images: [property4, property2, property3],
  },
  {
    id: "21",
    title: "Apartamento 425 m², 4 suítes, 7 vagas - Beira-Mar Norte",
    description: "Imponente apartamento na Beira-Mar Norte com 5 quartos e 7 vagas de garagem.",
    price: 11600000,
    location: "Florianópolis/SC",
    neighborhood: "Beira-Mar Norte",
    type: "apartamento",
    purpose: "venda",
    bedrooms: 5,
    suites: 5,
    bathrooms: 7,
    area: 425,
    parkingSpots: 7,
    featured: false,
    exclusive: true,
    images: [property1, property3, property4],
  },
  {
    id: "22",
    title: "Casa Conceito Aberto em Condomínio no Cacupé - 4 Suítes - Mobiliada",
    description: "Casa excepcional com conceito aberto, adega climatizada e acabamento impecável no Cacupé.",
    price: 0,
    location: "Florianópolis/SC",
    neighborhood: "Cacupé",
    type: "casa",
    purpose: "venda",
    bedrooms: 4,
    suites: 4,
    bathrooms: 8,
    area: 850,
    parkingSpots: 6,
    featured: false,
    exclusive: true,
    tag: "EXCLUSIVIDADE",
    images: [property2, property1, property4],
  },
];

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

export const propertyTypeLabel = (type: PropertyType) =>
  ({
    apartamento: "Apartamento",
    casa: "Casa",
    cobertura: "Cobertura",
    terreno: "Terreno",
  })[type];

export const publicLocations = Array.from(new Set(properties.map((p) => p.neighborhood)));

export const WHATSAPP_NUMBER = "5548988627634";
export const WHATSAPP_MESSAGE =
  "Olá! Vi seu site e gostaria de falar sobre imóveis para compra ou aluguel em Florianópolis.";

export const whatsappLink = (message = WHATSAPP_MESSAGE) =>
  `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
