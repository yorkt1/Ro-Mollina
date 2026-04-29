import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

export interface DestinationLinkItem {
  id: string;
  name: string;
  path: string;
}

export function useDestinationLinks() {
  return useQuery({
    queryKey: ["destination_links"],
    queryFn: async (): Promise<DestinationLinkItem[]> => {
      const { data, error } = await supabase
        .from("destination_links")
        .select("*")
        .order("name", { ascending: true });

      if (error) {
        console.warn("Destination links table error/empty:", error.message);
        return [];
      }
      
      return data || [];
    },
  });
}

export function useCreateDestinationLink() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { name: string; path: string }) => {
      const { data, error } = await supabase
        .from("destination_links")
        .insert(payload)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["destination_links"] }),
  });
}

export function useDeleteDestinationLink() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("destination_links").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["destination_links"] }),
  });
}
