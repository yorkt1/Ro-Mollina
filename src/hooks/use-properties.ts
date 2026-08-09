import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { DbProperty } from "@/lib/database.types";
import type { Property } from "@/data/properties";

// ─── Mappers ───────────────────────────────────────────

function dbToProperty(db: DbProperty): Property {
  return {
    id: db.id,
    shortId: db.short_id ?? undefined,
    title: db.title,
    description: db.description,
    fullDescription: db.full_description ?? undefined,
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
    opportunity: db.opportunity ?? false,
    exclusive: db.exclusive,
    tag: db.tag ?? undefined,
    images: db.images ?? [],
    // Extended
    refCode: db.ref_code ?? undefined,
    zone: db.zone ?? undefined,
    region: db.region ?? undefined,
    totalArea: db.total_area ?? undefined,
    builtArea: db.built_area ?? undefined,
    landArea: db.land_area ?? undefined,
    landFront: db.land_front ?? undefined,
    landBack: db.land_back ?? undefined,
    landLeft: db.land_left ?? undefined,
    landRight: db.land_right ?? undefined,
    rooms: db.rooms ?? undefined,
    accommodates: db.accommodates ?? undefined,
    furnished: db.furnished ?? false,
    swap: db.swap ?? false,
    acceptsFinancing: db.accepts_financing ?? true,
    contractType: db.contract_type ?? undefined,
    iptuPeriod: db.iptu_period ?? undefined,
    videoUrl: db.video_url ?? undefined,
    mapEmbedUrl: db.map_embed_url ?? undefined,
    nearby: db.nearby ?? [],
    leisure: db.leisure ?? [],
    roomsList: db.rooms_list ?? [],
    cep: db.cep ?? undefined,
    addressNumber: db.address_number ?? undefined,
    street: db.street ?? undefined,
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
      // shortId vem do banco (coluna short_id) e é estável. O `index + 1` só
      // sobrevive como fallback para linhas antigas sem a coluna preenchida.
      return (data as DbProperty[]).map((db, index) => ({
        ...dbToProperty(db),
        shortId: db.short_id ?? index + 1,
      }));
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
    opportunity: form.opportunity ?? false,
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

export function useUpdatePropertyShowcase() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      field,
      value,
    }: {
      id: string;
      field: "featured" | "opportunity";
      value: boolean;
    }) => {
      const { error } = await supabase
        .from("properties")
        .update({ [field]: value })
        .eq("id", id);

      if (error) throw error;
    },
    onMutate: async ({ id, field, value }) => {
      await qc.cancelQueries({ queryKey: ["properties"] });
      const previousProperties = qc.getQueryData<Property[]>(["properties"]);

      qc.setQueryData<Property[]>(["properties"], (current = []) =>
        current.map((property) =>
          property.id === id ? { ...property, [field]: value } : property,
        ),
      );

      return { previousProperties };
    },
    onError: (_error, _variables, context) => {
      if (context?.previousProperties) {
        qc.setQueryData(["properties"], context.previousProperties);
      }
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ["properties"] }),
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
