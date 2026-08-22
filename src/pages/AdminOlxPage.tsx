import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Check,
  CheckCircle2,
  Copy,
  ExternalLink,
  Inbox,
  Loader2,
  Megaphone,
  Minus,
  Plus,
  Search,
  Upload,
} from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { formatPropertyPrice, propertyTypeLabel, purposeLabel, type Property } from "@/data/properties";
import { useProperties } from "@/hooks/use-properties";
import { useToggleOlxListing } from "@/hooks/use-olx";
import { useToast } from "@/hooks/use-toast";
import { cloudinaryUrl } from "@/lib/cloudinary";
import { OLX_PLAN_LIMIT, checkOlxReadiness } from "@/lib/olx-feed";

/** Endereço que precisa ser cadastrado no Canal Pro do Grupo OLX. */
const FEED_PATH = "/vrsync.xml";

/** Endpoint que recebe os leads dos anúncios (Canal Pro → Integrações → Leads). */
const LEAD_PATH = "/grupozap/lead";

/**
 * Estado do recebimento de leads dos portais.
 *
 * O próprio endpoint responde no GET se está pronto (chave de gravação
 * configurada) e se exige token. Sem esse aviso, uma variável de ambiente
 * faltando no Vercel só apareceria como "os leads do ZAP pararam de chegar".
 */
function LeadWebhookCard() {
  const [status, setStatus] = useState<
    { configured: boolean; authenticated: boolean } | "loading" | "offline"
  >("loading");
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const leadUrl = `${typeof window === "undefined" ? "" : window.location.origin}${LEAD_PATH}`;

  useEffect(() => {
    let active = true;
    fetch(LEAD_PATH, { headers: { Accept: "application/json" } })
      .then((response) => (response.ok ? response.json() : Promise.reject(response.status)))
      .then((data) => {
        if (active) setStatus({ configured: !!data.configured, authenticated: !!data.authenticated });
      })
      .catch(() => {
        if (active) setStatus("offline");
      });
    return () => {
      active = false;
    };
  }, []);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(leadUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({ title: "Copie manualmente", description: leadUrl });
    }
  };

  return (
    <div className="rounded-sm border border-border bg-card p-6">
      <div className="flex items-start gap-3">
        <Inbox size={18} className="mt-0.5 shrink-0 text-accent" />
        <div className="min-w-0 flex-1 space-y-3">
          <div>
            <p className="font-medium text-foreground">Leads dos anúncios caindo no CRM</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Cadastrado uma única vez em Canal Pro → Configurações → Integrações → Leads →
              "Receber leads no CRM". Quem clica em contato num anúncio do OLX, ZAP ou VivaReal vira
              um lead novo no pipeline na hora, sem ninguém copiar nada.
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <code className="flex-1 truncate rounded-sm border border-border bg-secondary/40 px-3 py-2 text-sm text-foreground">
              {leadUrl}
            </code>
            <div className="flex gap-2">
              <Button variant="crmSecondary" size="sm" onClick={handleCopy}>
                {copied ? <Check size={14} /> : <Copy size={14} />}
                {copied ? "Copiado" : "Copiar"}
              </Button>
              <Button variant="outline" size="sm" asChild>
                <Link to="/admin/leads">
                  <ExternalLink size={14} /> Ver leads
                </Link>
              </Button>
            </div>
          </div>

          {status === "loading" && (
            <p className="text-xs text-muted-foreground">Verificando o recebimento...</p>
          )}
          {status === "offline" && (
            <p className="flex items-center gap-1.5 text-xs font-medium text-amber-700">
              <AlertTriangle size={13} /> Endereço fora do ar — só funciona no site publicado, não no
              ambiente de desenvolvimento.
            </p>
          )}
          {typeof status === "object" && (
            <p
              className={`flex items-center gap-1.5 text-xs font-medium ${
                status.configured ? "text-emerald-700" : "text-amber-700"
              }`}
            >
              {status.configured ? <CheckCircle2 size={13} /> : <AlertTriangle size={13} />}
              {status.configured
                ? `Pronto para receber leads${status.authenticated ? " · protegido por token" : " · sem token de proteção"}`
                : "Falta a chave de gravação (SUPABASE_SERVICE_ROLE_KEY) no Vercel"}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Linha de imóvel ───────────────────────────────────

function PropertyRow({
  property,
  pending,
  selected,
  blocked,
  busy,
  onToggle,
}: {
  property: Property;
  pending: string[];
  selected: boolean;
  blocked: boolean;
  busy: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="flex flex-col gap-4 border-t border-border px-5 py-4 first:border-t-0 sm:flex-row sm:items-center">
      {property.images[0] ? (
        <img
          src={cloudinaryUrl(property.images[0], { width: 160, height: 112 })}
          alt={property.title}
          className="h-14 w-20 shrink-0 rounded-sm object-cover"
        />
      ) : (
        <div className="flex h-14 w-20 shrink-0 items-center justify-center rounded-sm bg-secondary text-muted-foreground">
          <Upload size={18} />
        </div>
      )}

      <div className="min-w-0 flex-1">
        <p className="truncate font-medium text-foreground">{property.title}</p>
        <p className="mt-1 text-sm text-muted-foreground">
          {purposeLabel(property.purpose)} · {propertyTypeLabel(property.type)} · {property.neighborhood} ·{" "}
          <span className="font-medium text-navy">{formatPropertyPrice(property)}</span>
        </p>

        {pending.length > 0 ? (
          <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-amber-700">
            <AlertTriangle size={13} className="shrink-0" />
            <span className="font-medium">
              {selected ? "Não vai ao ar enquanto faltar:" : "Pendências para publicar:"}
            </span>
            <span className="text-amber-700/90">{pending.join(" · ")}</span>
          </div>
        ) : (
          selected && (
            <p className="mt-2 flex items-center gap-1.5 text-xs font-medium text-emerald-700">
              <CheckCircle2 size={13} /> No ar no OLX, ZAP e VivaReal
            </p>
          )
        )}
      </div>

      <Button
        variant={selected ? "outline" : "crm"}
        size="sm"
        disabled={busy || (!selected && blocked)}
        onClick={onToggle}
        className="shrink-0 self-start sm:self-center"
      >
        {selected ? (
          <>
            <Minus size={14} /> Remover
          </>
        ) : (
          <>
            <Plus size={14} /> Publicar
          </>
        )}
      </Button>
    </div>
  );
}

// ─── Página ────────────────────────────────────────────

export default function AdminOlxPage() {
  const { data: properties = [], isLoading, error } = useProperties();
  const toggleMutation = useToggleOlxListing();
  const { toast } = useToast();

  const [search, setSearch] = useState("");
  const [copied, setCopied] = useState(false);

  const feedUrl = `${typeof window === "undefined" ? "" : window.location.origin}${FEED_PATH}`;

  const { selected, available, readiness } = useMemo(() => {
    const readiness = new Map(properties.map((p) => [p.id, checkOlxReadiness(p)]));
    const selected = properties
      .filter((p) => p.olxEnabled)
      .sort((a, b) => (a.olxEnabledAt ?? "").localeCompare(b.olxEnabledAt ?? ""));
    const available = properties.filter((p) => !p.olxEnabled);
    return { selected, available, readiness };
  }, [properties]);

  const filteredAvailable = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return available;
    return available.filter((p) =>
      [p.title, p.neighborhood, p.location, p.type, p.refCode ?? ""]
        .join(" ")
        .toLowerCase()
        .includes(term),
    );
  }, [available, search]);

  const used = selected.length;
  const live = selected.filter((p) => (readiness.get(p.id) ?? []).length === 0).length;
  const blocked = used >= OLX_PLAN_LIMIT;

  const handleToggle = async (property: Property) => {
    const enabled = !property.olxEnabled;
    try {
      await toggleMutation.mutateAsync({ id: property.id, enabled });
      toast({
        title: enabled ? "Imóvel enviado ao OLX" : "Imóvel removido do OLX",
        description: enabled
          ? "Entra no próximo carregamento do portal (a cada 12h)."
          : `${property.title} deixou de ocupar uma vaga do plano.`,
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Erro desconhecido";
      toast({ title: "Não foi possível atualizar", description: message, variant: "destructive" });
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(feedUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({ title: "Copie manualmente", description: feedUrl });
    }
  };

  if (error) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center px-6">
        <div className="space-y-3 text-center">
          <p className="text-xs uppercase tracking-[0.28em] text-red-500">Erro</p>
          <p className="text-lg text-foreground">Falha ao carregar imóveis</p>
          <p className="text-sm text-muted-foreground">{(error as Error).message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 px-6 py-8 lg:px-10 lg:py-10">
      <div className="space-y-3">
        <p className="text-xs uppercase tracking-[0.28em] text-accent">Integração de portais</p>
        <h1 className="text-4xl text-foreground">OLX, ZAP e VivaReal</h1>
        <p className="max-w-2xl text-base leading-relaxed text-muted-foreground">
          Escolha quais imóveis ocupam as {OLX_PLAN_LIMIT} vagas do plano contratado. O portal lê a
          lista sozinho a cada 12 horas — trocar um imóvel aqui já basta, não precisa cadastrar nada
          por lá.
        </p>
      </div>

      {/* Vagas do plano */}
      <div className="grid gap-5 sm:grid-cols-3">
        <div className="rounded-sm border border-border bg-card p-6">
          <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Vagas do plano</p>
          <p className="mt-3 font-serif text-4xl text-foreground">
            {used}
            <span className="text-2xl text-muted-foreground">/{OLX_PLAN_LIMIT}</span>
          </p>
          <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-secondary">
            <div
              className={`h-full transition-all ${blocked ? "bg-accent" : "bg-navy"}`}
              style={{ width: `${Math.min(100, (used / OLX_PLAN_LIMIT) * 100)}%` }}
            />
          </div>
        </div>
        <div className="rounded-sm border border-border bg-card p-6">
          <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Anunciando</p>
          <p className="mt-3 font-serif text-4xl text-emerald-700">{live}</p>
          <p className="mt-2 text-xs text-muted-foreground">Cadastro completo, aceito pelo portal</p>
        </div>
        <div className="rounded-sm border border-border bg-card p-6">
          <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Com pendência</p>
          <p className="mt-3 font-serif text-4xl text-amber-600">{used - live}</p>
          <p className="mt-2 text-xs text-muted-foreground">Ocupa vaga, mas o portal recusa</p>
        </div>
      </div>

      {/* Endereço do feed */}
      <div className="rounded-sm border border-border bg-card p-6">
        <div className="flex items-start gap-3">
          <Megaphone size={18} className="mt-0.5 shrink-0 text-accent" />
          <div className="min-w-0 flex-1 space-y-3">
            <div>
              <p className="font-medium text-foreground">Endereço do feed no Canal Pro</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Cadastre este link uma única vez em Canal Pro → Integração → XML. Depois disso a
                seleção abaixo é a única coisa que precisa ser mexida.
              </p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <code className="flex-1 truncate rounded-sm border border-border bg-secondary/40 px-3 py-2 text-sm text-foreground">
                {feedUrl}
              </code>
              <div className="flex gap-2">
                <Button variant="crmSecondary" size="sm" onClick={handleCopy}>
                  {copied ? <Check size={14} /> : <Copy size={14} />}
                  {copied ? "Copiado" : "Copiar"}
                </Button>
                <Button variant="outline" size="sm" asChild>
                  <a href={`${FEED_PATH}?relatorio=1`} target="_blank" rel="noreferrer">
                    <ExternalLink size={14} /> Conferir
                  </a>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Volta dos anúncios: os leads */}
      <LeadWebhookCard />

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-accent" />
        </div>
      ) : (
        <>
          {/* Selecionados */}
          <div className="space-y-4">
            <div>
              <h2 className="font-serif text-2xl text-foreground">Publicados no OLX</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {used === 0
                  ? "Nenhuma vaga ocupada — nenhum imóvel está sendo enviado ao portal."
                  : `${used} de ${OLX_PLAN_LIMIT} vagas ocupadas.`}
              </p>
            </div>

            <div className="overflow-hidden rounded-sm border border-border bg-card">
              {selected.length === 0 ? (
                <p className="px-6 py-12 text-center text-muted-foreground">
                  Escolha abaixo os imóveis que devem aparecer no OLX, ZAP e VivaReal.
                </p>
              ) : (
                selected.map((property) => (
                  <PropertyRow
                    key={property.id}
                    property={property}
                    pending={readiness.get(property.id) ?? []}
                    selected
                    blocked={blocked}
                    busy={toggleMutation.isPending}
                    onToggle={() => void handleToggle(property)}
                  />
                ))
              )}
            </div>
          </div>

          {/* Disponíveis */}
          <div className="space-y-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="font-serif text-2xl text-foreground">Demais imóveis</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {blocked
                    ? "Plano cheio — remova um imóvel acima para liberar uma vaga."
                    : `${OLX_PLAN_LIMIT - used} vaga(s) livre(s).`}
                </p>
              </div>
              <div className="relative w-full sm:w-72">
                <Search
                  size={15}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Buscar por título, bairro ou código"
                  className="h-10 w-full rounded-sm border border-border bg-background pl-9 pr-3 text-sm outline-none transition-colors focus:border-accent"
                />
              </div>
            </div>

            <div className="overflow-hidden rounded-sm border border-border bg-card">
              {filteredAvailable.length === 0 ? (
                <p className="px-6 py-12 text-center text-muted-foreground">
                  {available.length === 0
                    ? "Todos os imóveis cadastrados já estão no OLX."
                    : "Nenhum imóvel encontrado para essa busca."}
                </p>
              ) : (
                filteredAvailable.map((property) => (
                  <PropertyRow
                    key={property.id}
                    property={property}
                    pending={readiness.get(property.id) ?? []}
                    selected={false}
                    blocked={blocked}
                    busy={toggleMutation.isPending}
                    onToggle={() => void handleToggle(property)}
                  />
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
