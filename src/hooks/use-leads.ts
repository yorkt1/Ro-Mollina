import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { DbLead } from "@/lib/database.types";
import type { Lead, LeadFormData, LeadInterest } from "@/domain/leads";

function currentContactTime() {
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date());
}

function dbToLead(db: DbLead): Lead {
  return {
    id: db.id,
    createdAt: db.created_at,
    updatedAt: db.updated_at,
    name: db.name,
    stage: db.stage,
    source: db.source,
    budget: db.budget,
    interest: db.interest,
    neighborhood: db.neighborhood,
    lastContact: db.last_contact,
    owner: db.owner,
    phone: db.phone ?? "",
    email: db.email ?? "",
    message: db.message ?? "",
    marketingData: db.marketing_data ?? undefined,
  };
}

function formToDb(form: LeadFormData) {
  return {
    name: form.name.trim(),
    stage: form.stage,
    source: form.source,
    budget: form.budget.trim() || "Não informado",
    interest: form.interest,
    neighborhood: form.neighborhood.trim() || "Não informado",
    last_contact: currentContactTime(),
    owner: form.owner.trim() || "Ro Molina",
    phone: form.phone.trim() || null,
    email: form.email.trim().toLowerCase() || null,
    message: form.message.trim() || null,
  };
}

export interface WebsiteLeadForm {
  name: string;
  phone: string;
  email: string;
  message: string;
  interest: LeadInterest;
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
        p_interest: form.interest,
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
    refetchInterval: 30_000,
  });
}

export function useCreateLead() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (form: LeadFormData) => {
      const { data, error } = await supabase
        .from("leads")
        .insert(formToDb(form))
        .select()
        .single();

      if (error) throw error;
      return dbToLead(data as DbLead);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["leads"] }),
  });
}

export function useUpdateLeadStage() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, stage }: { id: string; stage: Lead["stage"] }) => {
      const lastContact = currentContactTime();
      const { error } = await supabase
        .from("leads")
        .update({ stage, last_contact: lastContact })
        .eq("id", id);
      if (error) throw error;
      return { lastContact };
    },
    onMutate: async ({ id, stage }) => {
      await qc.cancelQueries({ queryKey: ["leads"] });
      const previousLeads = qc.getQueryData<Lead[]>(["leads"]);
      const lastContact = currentContactTime();

      qc.setQueryData<Lead[]>(["leads"], (current = []) =>
        current.map((lead) =>
          lead.id === id ? { ...lead, stage, lastContact } : lead,
        ),
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

export function useUpdateLead() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...form }: LeadFormData & { id: string }) => {
      const { data, error } = await supabase
        .from("leads")
        .update(formToDb(form))
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return dbToLead(data as DbLead);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["leads"] }),
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
