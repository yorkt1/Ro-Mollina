import { useRef, useState, type DragEvent, type ReactNode } from "react";
import {
  CalendarClock,
  Edit3,
  ExternalLink,
  GripVertical,
  Loader2,
  Mail,
  MapPin,
  MessageSquareText,
  Phone,
  Trash2,
  UserRound,
  type LucideIcon,
} from "lucide-react";
import { leadStages, type Lead, type LeadStage } from "@/domain/leads";
import { useDeleteLead, useLeads, useUpdateLeadStage } from "@/hooks/use-leads";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import LeadFormDialog from "@/components/admin/LeadFormDialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

function DetailItem({
  icon: Icon,
  label,
  children,
}: {
  icon: LucideIcon;
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="flex gap-3 rounded-sm border border-border bg-secondary/20 p-3">
      <Icon size={17} className="mt-0.5 shrink-0 text-accent" />
      <div className="min-w-0">
        <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">{label}</p>
        <div className="mt-1 break-words text-sm text-foreground">{children}</div>
      </div>
    </div>
  );
}

export default function LeadsPipeline() {
  const { data: leads = [], isLoading } = useLeads();
  const updateStage = useUpdateLeadStage();
  const deleteLead = useDeleteLead();
  const { toast } = useToast();
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [draggingLeadId, setDraggingLeadId] = useState<string | null>(null);
  const [targetStage, setTargetStage] = useState<LeadStage | null>(null);
  const [expandedStages, setExpandedStages] = useState<Set<LeadStage>>(new Set());
  const draggedRef = useRef(false);
  const selectedLead = leads.find((lead) => lead.id === selectedLeadId) ?? null;
  const landingPage = selectedLead?.marketingData?.landing_page;
  const safeLandingPage =
    landingPage?.startsWith("/") && !landingPage.startsWith("//") ? landingPage : null;

  const moveLead = async (lead: Lead, stage: LeadStage) => {
    if (lead.stage === stage || updateStage.isPending) return;

    const previousStage = lead.stage;
    try {
      await updateStage.mutateAsync({ id: lead.id, stage });
      toast({
        title: "Lead movido",
        description: `${lead.name}: ${leadStages.find((item) => item.key === stage)?.label}`,
      });
    } catch {
      toast({
        title: "Não foi possível mover o lead",
        description: `A etapa continua como ${leadStages.find((item) => item.key === previousStage)?.label}.`,
        variant: "destructive",
      });
    }
  };

  const handleDragStart = (event: DragEvent<HTMLButtonElement>, lead: Lead) => {
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", lead.id);
    draggedRef.current = true;
    setDraggingLeadId(lead.id);
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>, stage: LeadStage) => {
    event.preventDefault();
    const leadId = event.dataTransfer.getData("text/plain") || draggingLeadId;
    const lead = leads.find((item) => item.id === leadId);

    setTargetStage(null);
    setDraggingLeadId(null);
    if (lead) void moveLead(lead, stage);
  };

  const handleDragEnd = () => {
    setDraggingLeadId(null);
    setTargetStage(null);
    window.setTimeout(() => {
      draggedRef.current = false;
    }, 0);
  };

  const handleDelete = async (lead: Lead) => {
    try {
      await deleteLead.mutateAsync(lead.id);
      setSelectedLeadId(null);
      toast({
        title: "Lead excluído",
        description: `${lead.name} foi removido do pipeline.`,
      });
    } catch {
      toast({
        title: "Não foi possível excluir",
        description: "Tente novamente em alguns instantes.",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-accent" />
      </div>
    );
  }

  return (
    <>
      <p className="mb-4 text-xs leading-relaxed text-muted-foreground">
        Arraste os cards entre as etapas ou clique para ver os dados completos e alterar a etapa.
      </p>

      <div className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-4 xl:grid xl:grid-cols-5 xl:overflow-visible xl:pb-0">
        {leadStages.map((stage) => {
          const stageLeads = leads.filter((lead) => lead.stage === stage.key);
          const isExpanded = expandedStages.has(stage.key);
          const visibleStageLeads = isExpanded ? stageLeads : stageLeads.slice(0, 10);
          const isTarget = targetStage === stage.key && draggingLeadId !== null;

          return (
            <div
              key={stage.key}
              onDragOver={(event) => {
                event.preventDefault();
                event.dataTransfer.dropEffect = "move";
                setTargetStage(stage.key);
              }}
              onDragLeave={(event) => {
                if (!event.currentTarget.contains(event.relatedTarget as Node)) {
                  setTargetStage(null);
                }
              }}
              onDrop={(event) => handleDrop(event, stage.key)}
              className={`flex h-[min(64vh,560px)] min-h-[380px] w-[min(84vw,300px)] shrink-0 snap-start flex-col rounded-sm border p-4 transition-colors xl:h-[520px] xl:w-auto xl:min-w-0 ${
                isTarget
                  ? "border-accent bg-accent/10"
                  : "border-border bg-card"
              }`}
            >
              <div className="mb-4 flex items-center justify-between gap-3">
                <p className="text-sm font-medium text-foreground">{stage.label}</p>
                <span className="rounded-full bg-secondary px-2.5 py-1 text-xs text-muted-foreground">
                  {stageLeads.length}
                </span>
              </div>

              <div className="min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain pr-1">
                {visibleStageLeads.map((lead) => (
                  <button
                    key={lead.id}
                    type="button"
                    draggable
                    onDragStart={(event) => handleDragStart(event, lead)}
                    onDragEnd={handleDragEnd}
                    onClick={() => {
                      if (!draggedRef.current) setSelectedLeadId(lead.id);
                    }}
                    className={`group relative w-full cursor-grab rounded-sm border border-border bg-background p-3 pr-8 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:border-accent/50 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent active:cursor-grabbing ${
                      draggingLeadId === lead.id ? "scale-[0.98] opacity-45" : ""
                    }`}
                    aria-label={`Abrir lead ${lead.name}`}
                  >
                    <GripVertical
                      size={16}
                      className="absolute right-2.5 top-3 text-muted-foreground/40 transition-colors group-hover:text-accent"
                      aria-hidden="true"
                    />
                    <p className="font-medium text-foreground">{lead.name}</p>
                    <p className="mt-1 text-xs uppercase tracking-[0.18em] text-accent">
                      {lead.interest}
                    </p>
                    <p className="mt-2 text-sm text-muted-foreground">{lead.neighborhood}</p>
                    <p className="text-sm text-muted-foreground">{lead.budget}</p>
                    <p className="mt-2 text-xs text-muted-foreground">{lead.lastContact}</p>
                  </button>
                ))}

                {stageLeads.length > 10 && (
                  <button
                    type="button"
                    onClick={() =>
                      setExpandedStages((current) => {
                        const next = new Set(current);
                        if (next.has(stage.key)) {
                          next.delete(stage.key);
                        } else {
                          next.add(stage.key);
                        }
                        return next;
                      })
                    }
                    className="w-full rounded-sm border border-dashed border-accent/40 px-3 py-2.5 text-xs font-medium text-accent transition-colors hover:border-accent hover:bg-accent/10"
                  >
                    {isExpanded
                      ? "Ver menos"
                      : `Ver mais (${stageLeads.length - 10})`}
                  </button>
                )}

                {stageLeads.length === 0 && (
                  <div
                    className={`flex min-h-24 items-center justify-center rounded-sm border border-dashed text-xs transition-colors ${
                      isTarget
                        ? "border-accent text-accent"
                        : "border-transparent text-muted-foreground/60"
                    }`}
                  >
                    {isTarget ? "Solte o lead aqui" : "Vazio"}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <Dialog
        open={selectedLead !== null}
        onOpenChange={(open) => {
          if (!open) setSelectedLeadId(null);
        }}
      >
        {selectedLead && (
          <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto p-0">
            <DialogHeader className="border-b border-border px-6 py-5 pr-12">
              <p className="text-xs uppercase tracking-[0.24em] text-accent">Detalhes do lead</p>
              <DialogTitle className="font-serif text-2xl font-medium">{selectedLead.name}</DialogTitle>
              <DialogDescription>
                Origem: {selectedLead.source}
                {selectedLead.marketingData?.utm_source
                  ? ` · ${selectedLead.marketingData.utm_source}`
                  : ""}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-5 px-6 pb-6">
              <div>
                <label htmlFor="lead-stage" className="mb-1.5 block text-xs uppercase tracking-[0.18em] text-muted-foreground">
                  Etapa do pipeline
                </label>
                <select
                  id="lead-stage"
                  value={selectedLead.stage}
                  disabled={updateStage.isPending}
                  onChange={(event) =>
                    void moveLead(selectedLead, event.target.value as LeadStage)
                  }
                  className="h-11 w-full rounded-sm border border-border bg-background px-3 text-sm text-foreground outline-none transition-colors focus:border-accent"
                >
                  {leadStages.map((stage) => (
                    <option key={stage.key} value={stage.key}>
                      {stage.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <DetailItem icon={Phone} label="Telefone">
                  {selectedLead.phone ? (
                    <a href={`tel:${selectedLead.phone.replace(/\D/g, "")}`} className="hover:text-accent">
                      {selectedLead.phone}
                    </a>
                  ) : "Não informado"}
                </DetailItem>
                <DetailItem icon={Mail} label="E-mail">
                  {selectedLead.email ? (
                    <a href={`mailto:${selectedLead.email}`} className="hover:text-accent">
                      {selectedLead.email}
                    </a>
                  ) : "Não informado"}
                </DetailItem>
                <DetailItem icon={MapPin} label="Interesse">
                  {selectedLead.neighborhood} · {selectedLead.interest}
                </DetailItem>
                <DetailItem icon={UserRound} label="Responsável">
                  {selectedLead.owner}
                </DetailItem>
                <DetailItem icon={CalendarClock} label="Último contato">
                  {selectedLead.lastContact}
                </DetailItem>
                <DetailItem icon={MessageSquareText} label="Faixa de valor">
                  {selectedLead.budget}
                </DetailItem>
              </div>

              {selectedLead.message && (
                <div className="rounded-sm border border-border bg-secondary/20 p-4">
                  <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                    Mensagem
                  </p>
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-foreground">
                    {selectedLead.message}
                  </p>
                </div>
              )}

              {selectedLead.marketingData && Object.keys(selectedLead.marketingData).length > 0 && (
                <div className="rounded-sm border border-border p-4">
                  <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                    Dados da campanha
                  </p>
                  <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
                    {Object.entries(selectedLead.marketingData)
                      .filter(([key]) => key !== "referrer" && key !== "landing_page")
                      .map(([key, value]) => (
                        <div key={key} className="min-w-0">
                          <dt className="text-xs text-muted-foreground">{key}</dt>
                          <dd className="truncate text-foreground" title={value}>
                            {value}
                          </dd>
                        </div>
                      ))}
                  </dl>

                  {safeLandingPage && (
                    <a
                      href={safeLandingPage}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-4 inline-flex items-center gap-1.5 text-xs text-accent hover:underline"
                    >
                      Abrir página de origem <ExternalLink size={13} />
                    </a>
                  )}
                </div>
              )}

              <div className="flex flex-col-reverse gap-3 border-t border-border pt-5 sm:flex-row sm:justify-between">
                <Button
                  type="button"
                  variant="crmSecondary"
                  onClick={() => {
                    setEditingLead(selectedLead);
                    setSelectedLeadId(null);
                  }}
                >
                  <Edit3 size={16} />
                  Editar dados
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button type="button" variant="destructive">
                      <Trash2 size={16} />
                      Excluir lead
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Excluir {selectedLead.name}?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Esta ação remove definitivamente o contato e não poderá ser desfeita.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction
                        disabled={deleteLead.isPending}
                        onClick={() => void handleDelete(selectedLead)}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        {deleteLead.isPending ? "Excluindo..." : "Sim, excluir"}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          </DialogContent>
        )}
      </Dialog>

      <LeadFormDialog
        open={editingLead !== null}
        lead={editingLead}
        onOpenChange={(open) => {
          if (!open) setEditingLead(null);
        }}
      />
    </>
  );
}
