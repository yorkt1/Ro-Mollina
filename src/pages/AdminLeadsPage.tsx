import { useState } from "react";
import { CheckCircle2, Inbox, Loader2, Plus, TrendingUp, Users } from "lucide-react";
import LeadsPipeline from "@/components/admin/LeadsPipeline";
import LeadFormDialog from "@/components/admin/LeadFormDialog";
import CrmStatCard from "@/components/admin/CrmStatCard";
import { Button } from "@/components/ui/button";
import { useLeads } from "@/hooks/use-leads";

export default function AdminLeadsPage() {
  const { data: leads = [], isLoading, error } = useLeads();
  const [createOpen, setCreateOpen] = useState(false);
  const newLeads = leads.filter((lead) => lead.stage === "novo").length;
  const activeLeads = leads.filter((lead) =>
    ["qualificado", "visita", "proposta"].includes(lead.stage),
  ).length;
  const closedLeads = leads.filter((lead) => lead.stage === "fechamento").length;

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
        <Button variant="crm" onClick={() => setCreateOpen(true)}>
          <Plus size={16} />
          Novo lead
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <CrmStatCard
          icon={Users}
          label="Total de leads"
          value={`${leads.length}`}
          helper="Contatos reais cadastrados"
        />
        <CrmStatCard
          icon={Inbox}
          label="Novos"
          value={`${newLeads}`}
          helper="Aguardando primeiro atendimento"
        />
        <CrmStatCard
          icon={TrendingUp}
          label="Em andamento"
          value={`${activeLeads}`}
          helper="Qualificados, visitas e propostas"
        />
        <CrmStatCard
          icon={CheckCircle2}
          label="Fechamento"
          value={`${closedLeads}`}
          helper="Leads na etapa final"
        />
      </div>

      <section className="rounded-sm border border-border bg-card p-6">
        <div className="mb-6 space-y-2">
          <p className="text-xs uppercase tracking-[0.24em] text-accent">Kanban comercial</p>
          <h2 className="text-2xl text-foreground">Pipeline por etapa</h2>
        </div>
        <LeadsPipeline />
      </section>

      <section className="overflow-hidden rounded-sm border border-border bg-card">
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
                  <th className="px-6 py-4">Contato</th>
                  <th className="px-6 py-4">Origem</th>
                  <th className="px-6 py-4">Mensagem / interesse</th>
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
                    <td className="px-6 py-4 text-sm">
                      <p className="text-foreground">{lead.phone || "Não informado"}</p>
                      <p className="mt-1 text-muted-foreground">{lead.email || "Sem e-mail"}</p>
                    </td>
                    <td className="px-6 py-4 text-sm text-foreground">
                      <p>{lead.source}</p>
                      {lead.marketingData?.utm_source && (
                        <p className="mt-1 text-xs text-muted-foreground">
                          {lead.marketingData.utm_source}
                          {lead.marketingData.utm_campaign
                            ? ` · ${lead.marketingData.utm_campaign}`
                            : ""}
                        </p>
                      )}
                    </td>
                    <td className="max-w-xs whitespace-normal px-6 py-4 text-sm text-muted-foreground">
                      {lead.message || `${lead.interest} · ${lead.budget}`}
                    </td>
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

      <LeadFormDialog open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  );
}
