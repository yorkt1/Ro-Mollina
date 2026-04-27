import { Loader2 } from "lucide-react";
import LeadsPipeline from "@/components/admin/LeadsPipeline";
import { Button } from "@/components/ui/button";
import { useLeads } from "@/hooks/use-leads";

export default function AdminLeadsPage() {
  const { data: leads = [], isLoading, error } = useLeads();

  if (error) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center px-6">
        <div className="text-center space-y-3">
          <p className="text-xs uppercase tracking-[0.28em] text-red-500">Erro</p>
          <p className="text-lg text-foreground">Falha ao carregar leads</p>
          <p className="text-sm text-muted-foreground">{(error as Error).message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 px-6 py-8 lg:px-10 lg:py-10">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-3">
          <p className="text-xs uppercase tracking-[0.28em] text-accent">CRM comercial</p>
          <h1 className="text-4xl text-foreground">Leads e pipeline</h1>
          <p className="max-w-2xl text-base leading-relaxed text-muted-foreground">
            Gerencie leads vindos do site, WhatsApp, Instagram e indicação em um único fluxo comercial.
          </p>
        </div>
        <Button variant="crm">Novo lead</Button>
      </div>

      <section className="rounded-sm border border-border bg-card p-6 shadow-[0_12px_34px_hsl(var(--foreground)/0.05)]">
        <div className="mb-6 space-y-2">
          <p className="text-xs uppercase tracking-[0.24em] text-accent">Kanban comercial</p>
          <h2 className="text-2xl text-foreground">Pipeline por etapa</h2>
        </div>
        <LeadsPipeline />
      </section>

      <section className="overflow-hidden rounded-sm border border-border bg-card shadow-[0_18px_44px_hsl(var(--foreground)/0.05)]">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-accent" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-secondary/60 text-left text-xs uppercase tracking-[0.18em] text-muted-foreground">
                <tr>
                  <th className="px-6 py-4">Lead</th>
                  <th className="px-6 py-4">Origem</th>
                  <th className="px-6 py-4">Interesse</th>
                  <th className="px-6 py-4">Budget</th>
                  <th className="px-6 py-4">Último contato</th>
                  <th className="px-6 py-4">Responsável</th>
                </tr>
              </thead>
              <tbody>
                {leads.map((lead) => (
                  <tr key={lead.id} className="border-t border-border">
                    <td className="px-6 py-4">
                      <p className="font-medium text-foreground">{lead.name}</p>
                      <p className="mt-1 text-sm text-muted-foreground">{lead.neighborhood}</p>
                    </td>
                    <td className="px-6 py-4 text-sm text-foreground">{lead.source}</td>
                    <td className="px-6 py-4 text-sm text-foreground">{lead.interest}</td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">{lead.budget}</td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">{lead.lastContact}</td>
                    <td className="px-6 py-4 text-sm text-foreground">{lead.owner}</td>
                  </tr>
                ))}
                {leads.length === 0 && !isLoading && (
                  <tr>
                    <td colSpan={6} className="px-6 py-16 text-center text-muted-foreground">
                      Nenhum lead cadastrado ainda.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
