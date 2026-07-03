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
}

// Types that match the Supabase "leads" table
export interface DbLead {
  id: string;
  created_at: string;
  updated_at?: string;
  name: string;
  stage: "novo" | "qualificado" | "visita" | "proposta" | "fechamento";
  source: "WhatsApp" | "Instagram" | "Site" | "Indicação";
  budget: string;
  interest: "venda" | "aluguel";
  neighborhood: string;
  last_contact: string;
  owner: string;
  phone: string | null;
  email: string | null;
  message: string | null;
  marketing_data: Record<string, string> | null;
}
