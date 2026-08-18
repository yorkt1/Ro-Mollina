import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { Property } from "@/data/properties";
import { OLX_PLAN_LIMIT } from "@/lib/olx-feed";

/**
 * Liga/desliga um imóvel no feed do Grupo OLX (/vrsync.xml).
 *
 * A escrita é otimista porque a tela é de troca rápida — o cliente tira um
 * imóvel e coloca outro na mesma vaga; esperar o round-trip a cada clique
 * deixaria a contagem de vagas piscando.
 */
export function useToggleOlxListing() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, enabled }: { id: string; enabled: boolean }) => {
      if (enabled) {
        const current = qc.getQueryData<Property[]>(["properties"]) ?? [];
        const used = current.filter((property) => property.olxEnabled && property.id !== id).length;
        // Barreira final do lado do cliente: o feed também corta no limite, mas
        // marcar a 11ª vaga só criaria uma seleção que nunca vai ao ar.
        if (used >= OLX_PLAN_LIMIT) {
          throw new Error(`O plano permite ${OLX_PLAN_LIMIT} imóveis no OLX. Remova um antes de adicionar outro.`);
        }
      }

      const { error } = await supabase
        .from("properties")
        .update({
          olx_enabled: enabled,
          olx_enabled_at: enabled ? new Date().toISOString() : null,
        })
        .eq("id", id);

      if (error) throw error;
    },
    onMutate: async ({ id, enabled }) => {
      await qc.cancelQueries({ queryKey: ["properties"] });
      const previousProperties = qc.getQueryData<Property[]>(["properties"]);

      qc.setQueryData<Property[]>(["properties"], (current = []) =>
        current.map((property) =>
          property.id === id
            ? {
                ...property,
                olxEnabled: enabled,
                olxEnabledAt: enabled ? new Date().toISOString() : undefined,
              }
            : property,
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
