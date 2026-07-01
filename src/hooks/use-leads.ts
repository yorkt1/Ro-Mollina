import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { DbLead } from "@/lib/database.types";
import type { Lead } from "@/data/crm";

function dbToLead(db: DbLead): Lead {
  return {
    id: db.id,
    name: db.name,
    stage: db.stage,
    source: db.source,
    budget: db.budget,
    interest: db.interest,
    neighborhood: db.neighborhood,
    lastContact: db.last_contact,
    owner: db.owner,
    phone: db.phone ?? undefined,
    email: db.email ?? undefined,
    message: db.message ?? undefined,
    marketingData: db.marketing_data ?? undefined,
  };
}

export interface WebsiteLeadForm {
  name: string;
  phone: string;
  email: string;
  message: string;
  website?: string;
  marketingData?: Record<string, string>;
}

export function useSubmitWebsiteLead() {
  return useMutation({
    mutationFn: async (form: WebsiteLeadForm) => {
      const { data, error } = await supabase.rpc("submit_website_lead", {
        p_name: form.name,
        p_phone: form.phone,
        p_email: form.email,
        p_message: form.message,
        p_marketing_data: form.marketingData ?? {},
        p_website: form.website ?? "",
      });

      if (error) throw error;
      return data as string;
    },
  });
}

export function useLeads() {
  return useQuery({
    queryKey: ["leads"],
    queryFn: async (): Promise<Lead[]> => {
      const { data, error } = await supabase
        .from("leads")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return (data as DbLead[]).map(dbToLead);
    },
    staleTime: 1000 * 60 * 2,
  });
}

export function useCreateLead() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (form: Omit<Lead, "id">) => {
      const { data, error } = await supabase
        .from("leads")
        .insert({
          name: form.name,
          stage: form.stage,
          source: form.source,
          budget: form.budget,
          interest: form.interest,
          neighborhood: form.neighborhood,
          last_contact: form.lastContact,
          owner: form.owner,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["leads"] }),
  });
}

export function useUpdateLeadStage() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, stage }: { id: string; stage: Lead["stage"] }) => {
      const { error } = await supabase.from("leads").update({ stage }).eq("id", id);
      if (error) throw error;
    },
    onMutate: async ({ id, stage }) => {
      await qc.cancelQueries({ queryKey: ["leads"] });
      const previousLeads = qc.getQueryData<Lead[]>(["leads"]);

      qc.setQueryData<Lead[]>(["leads"], (current = []) =>
        current.map((lead) => (lead.id === id ? { ...lead, stage } : lead)),
      );

      return { previousLeads };
    },
    onError: (_error, _variables, context) => {
      if (context?.previousLeads) {
        qc.setQueryData(["leads"], context.previousLeads);
      }
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ["leads"] }),
  });
}

export function useDeleteLead() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("leads").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["leads"] }),
  });
}
