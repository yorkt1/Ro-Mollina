import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

export interface YouTubeVideo {
  id: string;
  title: string;
  youtube_id: string;
  thumbnail: string;
  sort_order: number;
}

export function useYouTubeVideos() {
  return useQuery({
    queryKey: ["youtube_videos"],
    queryFn: async (): Promise<YouTubeVideo[]> => {
      const { data, error } = await supabase
        .from("youtube_videos")
        .select("*")
        .order("sort_order", { ascending: true });

      if (error) throw error;
      return data as YouTubeVideo[];
    },
    staleTime: 1000 * 60 * 5,
    retry: false,
  });
}

export function useCreateYouTubeVideo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (form: Omit<YouTubeVideo, "id">) => {
      const { data, error } = await supabase
        .from("youtube_videos")
        .insert(form)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["youtube_videos"] }),
  });
}

export function useUpdateYouTubeVideo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...form }: YouTubeVideo) => {
      const { data, error } = await supabase
        .from("youtube_videos")
        .update(form)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["youtube_videos"] }),
  });
}

export function useDeleteYouTubeVideo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("youtube_videos").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["youtube_videos"] }),
  });
}
