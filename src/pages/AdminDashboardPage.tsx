import { Activity, Building2, CircleDollarSign, FileSpreadsheet, TrendingUp } from "lucide-react";
import { activities, leadStages, leads } from "@/data/crm";
import { properties } from "@/data/properties";
import CrmStatCard from "@/components/admin/CrmStatCard";
import LeadsPipeline from "@/components/admin/LeadsPipeline";
import { Button } from "@/components/ui/button";

export default function AdminDashboardPage() {
  const saleCount = properties.filter((property) => property.purpose === "venda").length;
  const rentCount = properties.filter((property) => property.purpose === "aluguel").length;

  return (
    <div className="space-y-10 px-6 py-8 lg:px-10 lg:py-10">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-3">
          <p className="text-xs uppercase tracking-[0.28em] text-accent">Painel executivo</p>
          <h1 className="text-4xl text-foreground">Dashboard comercial</h1>
          <p className="max-w-2xl text-base leading-relaxed text-muted-foreground">
            Visão geral do portfólio, funil de atendimento e ritmo comercial em uma interface pronta para integração futura.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button variant="crmSecondary">Exportar relatório</Button>
          <Button variant="crm">Novo imóvel</Button>
        </div>
      </div>

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <CrmStatCard icon={Building2} label="Portfólio total" value={`${properties.length}`} helper={`${saleCount} em venda · ${rentCount} em aluguel`} />
        <CrmStatCard icon={TrendingUp} label="Leads ativos" value={`${leads.length}`} helper="Funil acompanhando captação e fechamento" />
        <CrmStatCard icon={CircleDollarSign} label="Oportunidades quentes" value="R$ 13,7M" helper="Volume estimado em negociação" />
        <CrmStatCard icon={FileSpreadsheet} label="Visitas agendadas" value="07" helper="Próximos 5 dias de agenda comercial" />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
        <section className="space-y-5 rounded-sm border border-border bg-card p-6 shadow-[0_12px_34px_hsl(var(--foreground)/0.05)]">
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.24em] text-accent">Pipeline</p>
            <h2 className="text-2xl text-foreground">Funil visual</h2>
          </div>
          <LeadsPipeline />
        </section>

        <section className="space-y-5 rounded-sm border border-border bg-card p-6 shadow-[0_12px_34px_hsl(var(--foreground)/0.05)]">
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.24em] text-accent">Atividade recente</p>
            <h2 className="text-2xl text-foreground">Movimentações</h2>
          </div>
          <div className="space-y-4">
            {activities.map((activity) => (
              <div key={activity.id} className="rounded-sm border border-border bg-background p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-medium text-foreground">{activity.title}</p>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{activity.detail}</p>
                  </div>
                  <Activity size={16} className="mt-1 text-accent" />
                </div>
                <p className="mt-3 text-xs uppercase tracking-[0.18em] text-muted-foreground">{activity.time}</p>
              </div>
            ))}
          </div>
        </section>
      </div>

      <section className="grid gap-6 xl:grid-cols-2">
        <div className="rounded-sm border border-border bg-card p-6 shadow-[0_12px_34px_hsl(var(--foreground)/0.05)]">
          <p className="text-xs uppercase tracking-[0.24em] text-accent">Mix do portfólio</p>
          <div className="mt-6 space-y-4">
            {[
              { label: "Venda", value: saleCount, width: 68 },
              { label: "Aluguel", value: rentCount, width: 44 },
            ].map((item) => (
              <div key={item.label} className="space-y-2">
                <div className="flex items-center justify-between text-sm text-foreground">
                  <span>{item.label}</span>
                  <span>{item.value} imóveis</span>
                </div>
                <div className="h-2 rounded-full bg-secondary">
                  <div className="h-2 rounded-full bg-accent" style={{ width: `${item.width}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-sm border border-border bg-card p-6 shadow-[0_12px_34px_hsl(var(--foreground)/0.05)]">
          <p className="text-xs uppercase tracking-[0.24em] text-accent">Etapas do funil</p>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {leadStages.map((stage) => (
              <div key={stage.key} className="rounded-sm border border-border bg-background p-4">
                <p className="text-sm font-medium text-foreground">{stage.label}</p>
                <p className="mt-2 font-serif text-3xl text-navy">{leads.filter((lead) => lead.stage === stage.key).length}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
