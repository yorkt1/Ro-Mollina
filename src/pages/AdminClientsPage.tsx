import { clients } from "@/data/crm";

export default function AdminClientsPage() {
  return (
    <div className="space-y-8 px-6 py-8 lg:px-10 lg:py-10">
      <div className="space-y-3">
        <p className="text-xs uppercase tracking-[0.28em] text-accent">Relacionamento</p>
        <h1 className="text-4xl text-foreground">Clientes e próximos passos</h1>
        <p className="max-w-2xl text-base leading-relaxed text-muted-foreground">
          Uma camada de CRM focada em contexto, perfil e continuidade do atendimento para cada cliente.
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        {clients.map((client) => (
          <article key={client.id} className="rounded-sm border border-border bg-card p-6 shadow-[0_12px_34px_hsl(var(--foreground)/0.05)]">
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-[0.24em] text-accent">{client.status}</p>
              <h2 className="text-2xl text-foreground">{client.name}</h2>
              <p className="text-sm text-muted-foreground">{client.profile} · {client.city}</p>
            </div>
            <div className="mt-6 space-y-4 text-sm leading-relaxed text-muted-foreground">
              <p><span className="font-medium text-foreground">Objetivo:</span> {client.objective}</p>
              <p><span className="font-medium text-foreground">Próximo passo:</span> {client.nextStep}</p>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
