import { useState } from "react";
import { ImagePlus, Loader2, PencilLine, Plus, Minus, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  useLifestyleHighlights,
  useCreateHighlight,
  useUpdateHighlight,
  useDeleteHighlight,
  type LifestyleHighlight,
} from "@/hooks/use-highlights";
import { uploadImageToCloudinary } from "@/lib/cloudinary";
import { usePropertyTypes } from "@/hooks/use-property-types";
import { useDestinationLinks } from "@/hooks/use-destination-links";
import { propertyTypeLabel } from "@/data/properties";

// ─── Custom Number Input ───────────────────────────────

function CounterInput({
  label,
  value,
  onChange,
  min = 0,
  step = 1,
}: {
  label: string;
  value: number;
  onChange: (val: number) => void;
  min?: number;
  step?: number;
}) {
  const labelClass = "block text-xs uppercase tracking-[0.18em] text-muted-foreground mb-1.5";
  return (
    <div>
      <label className={labelClass}>{label}</label>
      <div className="flex h-10 w-full items-center rounded-sm border border-border bg-background transition-colors focus-within:border-accent">
        <button
          type="button"
          onClick={() => onChange(Math.max(min, value - step))}
          className="flex h-full w-8 shrink-0 items-center justify-center border-r border-border text-foreground hover:bg-secondary/50 active:bg-secondary transition-colors"
        >
          <Minus size={14} />
        </button>
        <div className="flex flex-1 min-w-0 items-center justify-center px-1">
          <input
            type="number"
            value={value ?? 0}
            placeholder="0"
            onChange={(e) => {
              const val = e.target.value === "" ? 0 : Number(e.target.value);
              if (!isNaN(val)) onChange(val);
            }}
            className="w-full bg-transparent text-center text-sm font-semibold text-foreground outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          />
        </div>
        <button
          type="button"
          onClick={() => onChange(value + step)}
          className="flex h-full w-8 shrink-0 items-center justify-center border-l border-border text-foreground hover:bg-secondary/50 active:bg-secondary transition-colors"
        >
          <Plus size={14} />
        </button>
      </div>
    </div>
  );
}

// ─── Form Modal ────────────────────────────────────────

function HighlightFormModal({
  highlight,
  currentCount,
  onClose,
}: {
  highlight?: LifestyleHighlight;
  currentCount: number;
  onClose: () => void;
}) {
  const { toast } = useToast();
  const createMutation = useCreateHighlight();
  const updateMutation = useUpdateHighlight();
  const isEditing = !!highlight;

  const { data: propertyTypes = [] } = usePropertyTypes();
  const { data: destLinks = [] } = useDestinationLinks();

  // Mode: 'auto' (purpose+type) or 'custom' (manual path)
  const [mode, setMode] = useState<"auto" | "custom">(() => {
    const link = highlight?.link ?? "";
    if (link && !link.includes("tipo=")) return "custom";
    return "auto";
  });

  // Helper to parse existing link into purpose and type
  const getInitialValues = () => {
    const link = highlight?.link ?? "/comprar";
    const isRent = link.startsWith("/alugar");
    const typeMatch = link.match(/tipo=([^&]+)/);
    return {
      purpose: isRent ? "aluguel" : "venda",
      type: typeMatch ? typeMatch[1] : ""
    };
  };

  const initialValues = getInitialValues();

  const [form, setForm] = useState({
    title: highlight?.title ?? "",
    description: highlight?.description ?? "",
    image: highlight?.image ?? "",
    purpose: initialValues.purpose,
    propertyType: initialValues.type,
    customLink: highlight?.link ?? "",
    sort_order: highlight?.sort_order ?? currentCount + 1,
  });

  const [uploading, setUploading] = useState(false);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const url = await uploadImageToCloudinary(file);
      setForm((prev) => ({ ...prev, image: url }));
      toast({ title: "Imagem enviada!" });
    } catch {
      toast({ title: "Erro no upload", variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Build the final link based on mode
      let finalLink = "";
      if (mode === "auto") {
        const route = form.purpose === "venda" ? "/comprar" : "/alugar";
        finalLink = form.propertyType ? `${route}?tipo=${form.propertyType}` : route;
      } else {
        finalLink = form.customLink;
      }

      const payload = {
        title: form.title,
        description: form.description,
        image: form.image,
        link: finalLink,
        sort_order: form.sort_order
      };

      if (isEditing && highlight) {
        await updateMutation.mutateAsync({ id: highlight.id, ...payload });
        toast({ title: "Destaque atualizado!" });
      } else {
        await createMutation.mutateAsync(payload);
        toast({ title: "Destaque criado!" });
      }
      onClose();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Erro desconhecido";
      toast({ title: "Erro", description: message, variant: "destructive" });
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;
  const inputClass = "h-10 w-full rounded-sm border border-border bg-background px-3 text-sm outline-none transition-colors focus:border-accent";
  const labelClass = "block text-xs uppercase tracking-[0.18em] text-muted-foreground mb-1.5";

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-foreground/50 p-4 pt-16 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-sm border border-border bg-card p-6 shadow-xl sm:p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-accent">
              {isEditing ? "Editar destaque" : "Novo destaque"}
            </p>
            <h2 className="mt-1 text-2xl text-foreground">
              {isEditing ? highlight.title : "Card de estilo de vida"}
            </h2>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className={labelClass}>Título</label>
            <input className={inputClass} value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} required placeholder='Ex: "Mobiliados"' />
          </div>

          <div>
            <label className={labelClass}>Descrição</label>
            <textarea
              rows={2}
              className="w-full rounded-sm border border-border bg-background px-3 py-2 text-sm outline-none transition-colors focus:border-accent resize-none"
              value={form.description}
              onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
              required
              placeholder="Breve descrição do card"
            />
          </div>

          <div className="space-y-4 rounded-sm border border-border bg-secondary/5 p-4">
            <div className="flex items-center gap-4 border-b border-border/50 pb-3">
              <button
                type="button"
                onClick={() => setMode("auto")}
                className={`text-[11px] uppercase tracking-wider transition-colors ${mode === "auto" ? "text-accent font-bold" : "text-muted-foreground hover:text-foreground"}`}
              >
                TIPO
              </button>
              <div className="h-3 w-px bg-border" />
              <button
                type="button"
                onClick={() => setMode("custom")}
                className={`text-[11px] uppercase tracking-wider transition-colors ${mode === "custom" ? "text-accent font-bold" : "text-muted-foreground hover:text-foreground"}`}
              >
                LINK
              </button>
            </div>

            {mode === "auto" ? (
              <div className="grid grid-cols-2 gap-4 pt-1">
                <div>
                  <label className={labelClass}>Finalidade</label>
                  <select
                    className={inputClass}
                    value={form.purpose}
                    onChange={(e) => setForm((p) => ({ ...p, purpose: e.target.value }))}
                  >
                    <option value="venda">Venda</option>
                    <option value="aluguel">Aluguel</option>
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Tipo de Imóvel</label>
                  <select
                    className={inputClass}
                    value={form.propertyType}
                    onChange={(e) => {
                      const val = e.target.value;
                      setForm((p) => ({ 
                        ...p, 
                        propertyType: val,
                        title: (!p.title || propertyTypes.some(t => propertyTypeLabel(t.name) === p.title)) 
                          ? propertyTypeLabel(val) 
                          : p.title
                      }));
                    }}
                  >
                    <option value="">Todos os tipos</option>
                    {propertyTypes.map((t) => (
                      <option key={t.id} value={t.name}>
                        {propertyTypeLabel(t.name)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            ) : (
              <div className="pt-1">
                <label className={labelClass}>Selecione o Destino</label>
                <select
                  className={inputClass}
                  value={form.customLink}
                  onChange={(e) => {
                    const selected = destLinks.find(d => d.path === e.target.value);
                    setForm((p) => ({ 
                      ...p, 
                      customLink: e.target.value,
                      title: (!p.title && selected) ? selected.name : p.title
                    }));
                  }}
                >
                  <option value="">Escolha um link das configurações...</option>
                  {destLinks.map((d) => (
                    <option key={d.id} value={d.path}>
                      {d.name} ({d.path})
                    </option>
                  ))}
                </select>
                <p className="mt-1.5 text-[10px] text-muted-foreground italic">
                  * Você pode cadastrar mais links em Configurações.
                </p>
              </div>
            )}
          </div>

          <CounterInput
            label="Ordem"
            value={form.sort_order}
            onChange={(val) => setForm((p) => ({ ...p, sort_order: val }))}
            min={1}
          />

          {/* Image */}
          <div>
            <label className={labelClass}>Imagem</label>
            {form.image ? (
              <div className="group relative aspect-video overflow-hidden rounded-sm border border-border">
                <img src={form.image} alt="Preview" className="h-full w-full object-cover" />
                <button
                  type="button"
                  onClick={() => setForm((p) => ({ ...p, image: "" }))}
                  className="absolute right-2 top-2 rounded-full bg-foreground/70 p-1.5 text-white opacity-0 transition-opacity group-hover:opacity-100"
                >
                  <X size={14} />
                </button>
              </div>
            ) : (
              <label className="flex aspect-video cursor-pointer items-center justify-center rounded-sm border-2 border-dashed border-border bg-secondary/30 text-muted-foreground transition-colors hover:border-accent hover:text-accent">
                {uploading ? <Loader2 size={24} className="animate-spin" /> : (
                  <div className="flex flex-col items-center gap-2">
                    <ImagePlus size={28} />
                    <span className="text-xs">Clique para enviar</span>
                  </div>
                )}
                <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" disabled={uploading} />
              </label>
            )}
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="submit" variant="crm" disabled={isPending || !form.image} className="flex-1">
              {isPending ? (
                <>
                  <Loader2 size={16} className="animate-spin" /> Salvando...
                </>
              ) : isEditing ? "Salvar" : "Criar destaque"}
            </Button>
            <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Page ──────────────────────────────────────────────

export default function AdminHighlightsPage() {
  const { data: highlights = [], isLoading, error } = useLifestyleHighlights();
  const deleteMutation = useDeleteHighlight();
  const { toast } = useToast();
  const [modal, setModal] = useState<{ open: boolean; highlight?: LifestyleHighlight }>({ open: false });

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Excluir destaque "${title}"?`)) return;
    try {
      await deleteMutation.mutateAsync(id);
      toast({ title: "Destaque excluído", description: title });
    } catch {
      toast({ title: "Erro ao excluir", variant: "destructive" });
    }
  };

  if (error) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center px-6">
        <div className="text-center space-y-3">
          <p className="text-xs uppercase tracking-[0.28em] text-red-500">Erro</p>
          <p className="text-lg text-foreground">Falha ao carregar destaques</p>
          <p className="text-sm text-muted-foreground">{(error as Error).message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 px-6 py-8 lg:px-10 lg:py-10">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-3">
          <p className="text-xs uppercase tracking-[0.28em] text-accent">Gestão de destaques</p>
          <h1 className="text-4xl text-foreground">Cards de estilo de vida</h1>
          <p className="max-w-2xl text-base leading-relaxed text-muted-foreground">
            Gerencie os 3 cards de destaque que aparecem na homepage: Mobiliados, Alto Padrão e Coberturas.
          </p>
        </div>
        <Button variant="crm" onClick={() => setModal({ open: true })}>
          <Plus size={16} /> Novo destaque
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-accent" />
        </div>
      ) : highlights.length === 0 ? (
        <div className="rounded-sm border border-dashed border-border bg-card px-6 py-16 text-center">
          <p className="text-xl font-serif text-foreground">Nenhum destaque cadastrado</p>
          <p className="mt-3 text-sm text-muted-foreground">Crie 3 cards para aparecerem na seção &quot;Explore&quot; da homepage.</p>
          <Button variant="crm" className="mt-4" onClick={() => setModal({ open: true })}>
            <Plus size={16} /> Criar primeiro destaque
          </Button>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-3">
          {highlights.map((h) => (
            <div key={h.id} className="overflow-hidden rounded-sm border border-border bg-card">
              <div className="relative aspect-video overflow-hidden">
                {h.image ? (
                  <img src={h.image} alt={h.title} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-secondary text-muted-foreground">
                    <ImagePlus size={32} />
                  </div>
                )}
                <span className="absolute left-3 top-3 rounded-sm bg-accent px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-primary">
                  Ordem {h.sort_order}
                </span>
              </div>
              <div className="p-5 space-y-3">
                <h3 className="font-serif text-lg font-semibold text-foreground">{h.title}</h3>
                <p className="text-sm text-muted-foreground line-clamp-2">{h.description}</p>
                <p className="text-xs text-muted-foreground/60">Link: {h.link}</p>
                <div className="flex gap-2 pt-2">
                  <Button variant="crmSecondary" size="sm" onClick={() => setModal({ open: true, highlight: h })}>
                    <PencilLine size={14} /> Editar
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleDelete(h.id, h.title)} disabled={deleteMutation.isPending}>
                    <Trash2 size={14} /> Excluir
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {modal.open && (
        <HighlightFormModal
          highlight={modal.highlight}
          currentCount={highlights.length}
          onClose={() => setModal({ open: false })}
        />
      )}
    </div>
  );
}
