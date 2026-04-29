import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

export interface PropertyTypeItem {
  id: string;
  name: string;
}

export function usePropertyTypes() {
  return useQuery({
    queryKey: ["property_types"],
    queryFn: async (): Promise<PropertyTypeItem[]> => {
      const { data, error } = await supabase
        .from("property_types")
        .select("*")
        .order("name", { ascending: true });

      if (error) {
        // Fallback for when the table doesn't exist yet or is empty
        console.warn("Property types table error/empty, using defaults:", error.message);
        return [
          { id: "1", name: "apartamento" },
          { id: "2", name: "casa" },
          { id: "3", name: "cobertura" },
          { id: "4", name: "terreno" }
        ];
      }
      
      if (!data || data.length === 0) {
        return [
          { id: "1", name: "apartamento" },
          { id: "2", name: "casa" },
          { id: "3", name: "cobertura" },
          { id: "4", name: "terreno" }
        ];
      }
      
      return data;
    },
  });
}

export function useCreatePropertyType() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (name: string) => {
      const { data, error } = await supabase
        .from("property_types")
        .insert({ name: name.toLowerCase() })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["property_types"] }),
  });
}

export function useDeletePropertyType() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("property_types").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["property_types"] }),
  });
}
