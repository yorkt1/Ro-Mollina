import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { DbProperty } from "@/lib/database.types";
import type { Property } from "@/data/properties";

// ─── Mappers ───────────────────────────────────────────

function dbToProperty(db: DbProperty): Property {
  return {
    id: db.id,
    title: db.title,
    description: db.description,
    fullDescription: (db as any).full_description ?? undefined,
    price: db.price,
    location: db.location,
    neighborhood: db.neighborhood,
    type: db.type,
    purpose: db.purpose,
    bedrooms: db.bedrooms,
    suites: db.suites,
    bathrooms: db.bathrooms,
    area: db.area,
    parkingSpots: db.parking_spots,
    featured: db.featured,
    exclusive: db.exclusive,
    tag: db.tag ?? undefined,
    images: db.images ?? [],
    // Extended
    refCode: (db as any).ref_code ?? undefined,
    zone: (db as any).zone ?? undefined,
    region: (db as any).region ?? undefined,
    totalArea: (db as any).total_area ?? undefined,
    builtArea: (db as any).built_area ?? undefined,
    landArea: (db as any).land_area ?? undefined,
    landFront: (db as any).land_front ?? undefined,
    landBack: (db as any).land_back ?? undefined,
    landLeft: (db as any).land_left ?? undefined,
    landRight: (db as any).land_right ?? undefined,
    rooms: (db as any).rooms ?? undefined,
    accommodates: (db as any).accommodates ?? undefined,
    furnished: (db as any).furnished ?? false,
    swap: (db as any).swap ?? false,
    acceptsFinancing: (db as any).accepts_financing ?? true,
    contractType: (db as any).contract_type ?? undefined,
    iptuPeriod: (db as any).iptu_period ?? undefined,
    videoUrl: (db as any).video_url ?? undefined,
    mapEmbedUrl: (db as any).map_embed_url ?? undefined,
    nearby: (db as any).nearby ?? [],
    leisure: (db as any).leisure ?? [],
    roomsList: (db as any).rooms_list ?? [],
    cep: (db as any).cep ?? undefined,
    addressNumber: (db as any).address_number ?? undefined,
    street: (db as any).street ?? undefined,
  };
}

// ─── Queries ───────────────────────────────────────────

export function useProperties() {
  return useQuery({
    queryKey: ["properties"],
    queryFn: async (): Promise<Property[]> => {
      const { data, error } = await supabase
        .from("properties")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return (data as DbProperty[]).map(dbToProperty);
    },
    staleTime: 1000 * 60 * 2,
  });
}

export function useProperty(id: string | undefined) {
  return useQuery({
    queryKey: ["properties", id],
    queryFn: async (): Promise<Property | null> => {
      if (!id) return null;
      const { data, error } = await supabase
        .from("properties")
        .select("*")
        .eq("id", id)
        .single();

      if (error) {
        if (error.code === "PGRST116") return null;
        throw error;
      }
      return dbToProperty(data as DbProperty);
    },
    enabled: !!id,
  });
}

// ─── Mutations ─────────────────────────────────────────

export type PropertyFormData = Omit<Property, "id" | "images"> & { images: string[] };

function formToDb(form: PropertyFormData) {
  return {
    title: form.title,
    description: form.description,
    full_description: form.fullDescription || null,
    price: form.price,
    location: form.location,
    neighborhood: form.neighborhood,
    type: form.type,
    purpose: form.purpose,
    bedrooms: form.bedrooms,
    suites: form.suites,
    bathrooms: form.bathrooms,
    area: form.area,
    parking_spots: form.parkingSpots,
    featured: form.featured,
    exclusive: form.exclusive,
    tag: form.tag || null,
    images: form.images,
    // Extended
    ref_code: form.refCode || null,
    zone: form.zone || null,
    region: form.region || null,
    total_area: form.totalArea || null,
    built_area: form.builtArea || null,
    land_area: form.landArea || null,
    land_front: form.landFront || null,
    land_back: form.landBack || null,
    land_left: form.landLeft || null,
    land_right: form.landRight || null,
    rooms: form.rooms || null,
    accommodates: form.accommodates || null,
    furnished: form.furnished ?? false,
    swap: form.swap ?? false,
    accepts_financing: form.acceptsFinancing ?? true,
    contract_type: form.contractType || null,
    iptu_period: form.iptuPeriod || null,
    video_url: form.videoUrl || null,
    map_embed_url: form.mapEmbedUrl || null,
    nearby: form.nearby ?? [],
    leisure: form.leisure ?? [],
    rooms_list: form.roomsList ?? [],
    cep: form.cep || null,
    address_number: form.addressNumber || null,
    street: form.street || null,
  };
}

export function useCreateProperty() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (form: PropertyFormData) => {
      const { data, error } = await supabase
        .from("properties")
        .insert(formToDb(form))
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["properties"] }),
  });
}

export function useUpdateProperty() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...form }: PropertyFormData & { id: string }) => {
      const { data, error } = await supabase
        .from("properties")
        .update(formToDb(form))
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["properties"] }),
  });
}

export function useDeleteProperty() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("properties").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["properties"] }),
  });
}

// ─── Image Upload (Cloudinary) ─────────────────────────

export { uploadImageToCloudinary as uploadPropertyImage } from "@/lib/cloudinary";
