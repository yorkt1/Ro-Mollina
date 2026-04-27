import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

export interface LifestyleHighlight {
  id: string;
  title: string;
  description: string;
  image: string;
  link: string;
  sort_order: number;
}

export function useLifestyleHighlights() {
  return useQuery({
    queryKey: ["lifestyle_highlights"],
    queryFn: async (): Promise<LifestyleHighlight[]> => {
      const { data, error } = await supabase
        .from("lifestyle_highlights")
        .select("*")
        .order("sort_order", { ascending: true });

      if (error) throw error;
      return data as LifestyleHighlight[];
    },
    staleTime: 1000 * 60 * 5,
    retry: false,
  });
}

export function useCreateHighlight() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (form: Omit<LifestyleHighlight, "id">) => {
      const { data, error } = await supabase
        .from("lifestyle_highlights")
        .insert(form)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["lifestyle_highlights"] }),
  });
}

export function useUpdateHighlight() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...form }: LifestyleHighlight) => {
      const { data, error } = await supabase
        .from("lifestyle_highlights")
        .update(form)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["lifestyle_highlights"] }),
  });
}

export function useDeleteHighlight() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("lifestyle_highlights").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["lifestyle_highlights"] }),
  });
}
