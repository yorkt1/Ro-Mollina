// Types that match the Supabase "properties" table
export interface DbProperty {
  id: string;
  /** Número curto e estável usado na URL pública (/imovel/{short_id}/{slug}). */
  short_id?: number | null;
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
  opportunity?: boolean;
  exclusive: boolean;
  tag: string | null;
  images: string[];
  full_description?: string | null;
  ref_code?: string | null;
  zone?: string | null;
  region?: string | null;
  total_area?: number | null;
  built_area?: number | null;
  land_area?: number | null;
  land_front?: number | null;
  land_back?: number | null;
  land_left?: number | null;
  land_right?: number | null;
  rooms?: number | null;
  accommodates?: number | null;
  furnished?: boolean | null;
  swap?: boolean | null;
  accepts_financing?: boolean | null;
  contract_type?: string | null;
  iptu_period?: string | null;
  video_url?: string | null;
  map_embed_url?: string | null;
  nearby?: string[] | null;
  leisure?: string[] | null;
  rooms_list?: string[] | null;
  cep?: string | null;
  address_number?: string | null;
  street?: string | null;
  /** Ocupa uma das vagas do plano no Grupo OLX (feed /vrsync.xml). */
  olx_enabled?: boolean | null;
  /** Quando a vaga foi ocupada — desempate quando há mais marcados que o plano. */
  olx_enabled_at?: string | null;
}

// Types that match the Supabase "leads" table
export interface DbLead {
  id: string;
  created_at: string;
  updated_at?: string;
  name: string;
  stage: "novo" | "qualificado" | "visita" | "proposta" | "fechamento";
  source: "WhatsApp" | "Instagram" | "Site" | "Indicação" | "Grupo OLX" | "MCMV";
  budget: string;
  interest: "venda" | "aluguel";
  neighborhood: string;
  last_contact: string;
  owner: string;
  phone: string | null;
  email: string | null;
  message: string | null;
  marketing_data: Record<string, string> | null;
  /** Colunas preenchidas pelo webhook do Grupo OLX (/api/leads/grupozap). */
  external_id?: string | null;
  origin_listing_id?: string | null;
  client_listing_id?: string | null;
  property_id?: string | null;
  lead_type?: string | null;
  temperature?: string | null;
}
