// Types that match the Supabase "properties" table
export interface DbProperty {
  id: string;
  created_at: string;
  title: string;
  description: string;
  price: number;
  location: string;
  neighborhood: string;
  type: string;
  purpose: "venda" | "aluguel";
  bedrooms: number;
  suites: number;
  bathrooms: number;
  area: number;
  parking_spots: number;
  featured: boolean;
  exclusive: boolean;
  tag: string | null;
  images: string[];
}

// Types that match the Supabase "leads" table
export interface DbLead {
  id: string;
  created_at: string;
  name: string;
  stage: "novo" | "qualificado" | "visita" | "proposta" | "fechamento";
  source: "WhatsApp" | "Instagram" | "Site" | "Indicação";
  budget: string;
  interest: "venda" | "aluguel";
  neighborhood: string;
  last_contact: string;
  owner: string;
}
