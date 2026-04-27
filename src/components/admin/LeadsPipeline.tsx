import { leadStages } from "@/data/crm";
import { useLeads } from "@/hooks/use-leads";
import { Loader2 } from "lucide-react";

export default function LeadsPipeline() {
  const { data: leads = [], isLoading } = useLeads();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-accent" />
      </div>
    );
  }

  return (
    <div className="grid gap-4 xl:grid-cols-5">
      {leadStages.map((stage) => {
        const stageLeads = leads.filter((lead) => lead.stage === stage.key);

        return (
          <div key={stage.key} className="rounded-sm border border-border bg-card p-4">
            <div className="mb-4 flex items-center justify-between gap-3">
              <p className="text-sm font-medium text-foreground">{stage.label}</p>
              <span className="rounded-full bg-secondary px-2.5 py-1 text-xs text-muted-foreground">
                {stageLeads.length}
              </span>
            </div>

            <div className="space-y-3">
              {stageLeads.map((lead) => (
                <div key={lead.id} className="rounded-sm border border-border bg-background p-3">
                  <p className="font-medium text-foreground">{lead.name}</p>
                  <p className="mt-1 text-xs uppercase tracking-[0.18em] text-accent">{lead.interest}</p>
                  <p className="mt-2 text-sm text-muted-foreground">{lead.neighborhood}</p>
                  <p className="text-sm text-muted-foreground">{lead.budget}</p>
                  <p className="mt-2 text-xs text-muted-foreground">{lead.lastContact}</p>
                </div>
              ))}
              {stageLeads.length === 0 && (
                <p className="text-xs text-muted-foreground/60 text-center py-4">Vazio</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
