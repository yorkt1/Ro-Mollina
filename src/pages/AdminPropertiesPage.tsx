import { useState, useRef } from "react";
import { createPortal } from "react-dom";
import { Loader2, MapPin, PencilLine, Plus, Minus, Star, Trash2, X, ImagePlus, ArrowLeft, ArrowRight, GripVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatPropertyPrice, propertyTypeLabel, purposeLabel, type Property, type PropertyType, type PropertyPurpose } from "@/data/properties";
import { useProperties, useCreateProperty, useUpdateProperty, useDeleteProperty, uploadPropertyImage, type PropertyFormData } from "@/hooks/use-properties";
import { useToast } from "@/hooks/use-toast";
import { usePropertyTypes } from "@/hooks/use-property-types";

const SUPABASE_URL = "https://kujwgpumdggggbnxuhem.supabase.co";
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

/** Calls the Edge Function to resolve any Maps URL (including goo.gl) server-side */
async function resolveMapUrl(url: string): Promise<{ osmEmbed: string | null; lat: number | null; lng: number | null; finalUrl: string }> {
  const res = await fetch(`${SUPABASE_URL}/functions/v1/resolve-url`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    },
    body: JSON.stringify({ url }),
  });
  if (!res.ok) throw new Error("Falha ao resolver o link");
  return res.json();
}

/** Tries to parse lat/lng directly from a long Google Maps URL on the client side */
function parseCoordsLocally(url: string) {
  // Pattern 1: @lat,lng
  const atMatch = url.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
  if (atMatch) return { lat: parseFloat(atMatch[1]), lng: parseFloat(atMatch[2]) };

  // Pattern 2: !3dlat!4dlng (used in long URLs)
  const bangMatch = url.match(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/);
  if (bangMatch) return { lat: parseFloat(bangMatch[1]), lng: parseFloat(bangMatch[2]) };

  // Pattern 3: query params q=lat,lng
  const qMatch = url.match(/[?&]q=(-?\d+\.\d+),(-?\d+\.\d+)/);
  if (qMatch) return { lat: parseFloat(qMatch[1]), lng: parseFloat(qMatch[2]) };

  return null;
}

// ─── Custom Number Input for Mobile/Premium UX ──────────

function CounterInput({
  label,
  value,
  onChange,
  min = 0,
  step = 1,
  suffix = "",
}: {
  label: string;
  value: number;
  onChange: (val: number) => void;
  min?: number;
  step?: number;
  suffix?: string;
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
            step={step}
            onChange={(e) => {
              const val = e.target.value === "" ? 0 : Number(e.target.value);
              if (!isNaN(val)) onChange(val);
            }}
            className="w-full bg-transparent text-center text-sm font-semibold text-foreground outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          />
          {suffix && <span className="ml-1 text-[10px] text-muted-foreground whitespace-nowrap">{suffix}</span>}
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

// ─── Property Form Modal ───────────────────────────────

function PropertyFormModal({
  property,
  onClose,
}: {
  property?: Property;
  onClose: () => void;
}) {
  const { toast } = useToast();
  const createMutation = useCreateProperty();
  const updateMutation = useUpdateProperty();
  const { data: propertyTypes = [] } = usePropertyTypes();
  const isEditing = !!property;

  const [form, setForm] = useState({
    title: property?.title ?? "",
    description: property?.description ?? "",
    fullDescription: property?.fullDescription ?? "",
    price: property?.price ?? 0,
    location: property?.location ?? "Florianópolis/SC",
    neighborhood: property?.neighborhood ?? "",
    type: (property?.type ?? (propertyTypes[0]?.name || "apartamento")) as PropertyType,
    purpose: (property?.purpose ?? "venda") as PropertyPurpose,
    bedrooms: property?.bedrooms ?? 1,
    suites: property?.suites ?? 0,
    bathrooms: property?.bathrooms ?? 1,
    area: property?.area ?? 0,
    parkingSpots: property?.parkingSpots ?? 0,
    featured: property?.featured ?? false,
    exclusive: property?.exclusive ?? false,
    tag: property?.tag ?? "",
    images: property?.images ?? [],
    // Extended
    refCode: property?.refCode ?? "",
    zone: property?.zone ?? "",
    region: property?.region ?? "",
    totalArea: property?.totalArea ?? 0,
    builtArea: property?.builtArea ?? 0,
    landArea: property?.landArea ?? 0,
    landFront: property?.landFront ?? 0,
    landBack: property?.landBack ?? 0,
    landLeft: property?.landLeft ?? 0,
    landRight: property?.landRight ?? 0,
    rooms: property?.rooms ?? 0,
    accommodates: property?.accommodates ?? 0,
    furnished: property?.furnished ?? false,
    swap: property?.swap ?? false,
    acceptsFinancing: property?.acceptsFinancing ?? true,
    contractType: property?.contractType ?? "",
    iptuPeriod: property?.iptuPeriod ?? "",
    videoUrl: property?.videoUrl ?? "",
    mapEmbedUrl: property?.mapEmbedUrl ?? "",
    nearby: property?.nearby ?? [],
    leisure: property?.leisure ?? [],
    roomsList: property?.roomsList ?? [],
    cep: property?.cep || (property?.fullDescription?.match(/CEP:\s*([\d]{5}-?[\d]{3})/i)?.[1]?.replace(/\D/g, "") ?? ""),
    addressNumber: property?.addressNumber ?? "",
    street: property?.street ?? "",
  });

  // Local state for comma-separated inputs to avoid "jumping" cursor bug
  const [nearbyText, setNearbyText] = useState(property?.nearby?.join(", ") ?? "");
  const [leisureText, setLeisureText] = useState(property?.leisure?.join(", ") ?? "");

  const [uploading, setUploading] = useState(false);
  const [searchingCep, setSearchingCep] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [resolvingMap, setResolvingMap] = useState(false);
  const [mapPreview, setMapPreview] = useState<string | null>(property?.mapEmbedUrl || null);

  const getFloripaZone = (neighborhood: string) => {
    const n = neighborhood.toLowerCase();
    // Norte
    if (/jurer|canasvieiras|ingleses|cachoeira|ponta das canas|brava|daniela|ratones|vargem|santo ant/i.test(n)) return "Norte";
    // Sul
    if (/campeche|rio tavares|pântano|arma|morro das pedras|ribeir|tapera/i.test(n)) return "Sul";
    // Leste
    if (/lagoa da concei|barra da lagoa|rio vermelho/i.test(n)) return "Leste";
    // Centro
    if (/centro|agron|trindade|itacorubi|santa m|córrego grande|pantanal|carvoeira/i.test(n)) return "Centro";
    // Continente
    if (/coqueiros|estreito|abra|bom abrigo|itagua/i.test(n)) return "Continente";
    return "";
  };

  const handleCepLookup = async (cep: string) => {
    const cleaned = cep.replace(/\D/g, "");
    if (cleaned.length !== 8) return;

    setSearchingCep(true);
    try {
      const res = await fetch(`https://viacep.com.br/ws/${cleaned}/json/`);
      const data = await res.json();
      if (data.erro) {
        toast({ title: "CEP não encontrado", variant: "destructive" });
      } else {
        const newLocation = `${data.localidade}/${data.uf}`;
        const newNeighborhood = data.bairro || "";
        const detectedZone = data.localidade.toLowerCase().includes("florian") ? getFloripaZone(newNeighborhood) : "";
        
        const streetName = data.logradouro || "";
        setForm((p) => ({
          ...p,
          neighborhood: newNeighborhood,
          location: newLocation,
          zone: detectedZone || p.zone,
          region: data.localidade || p.region,
          cep: cleaned,
          street: streetName,
          // Generate an embeddable Google Maps link automatically
          mapEmbedUrl: `https://maps.google.com/maps?q=${encodeURIComponent(
            `${streetName}${p.addressNumber ? ", " + p.addressNumber : ""}, ${newNeighborhood}, ${newLocation}`.trim().replace(/^,/, "").trim()
          )}&output=embed&hl=pt-BR`
        }));
        setMapPreview(`https://maps.google.com/maps?q=${encodeURIComponent(
          `${streetName}${form.addressNumber ? ", " + form.addressNumber : ""}, ${newNeighborhood}, ${newLocation}`.trim().replace(/^,/, "").trim()
        )}&output=embed&hl=pt-BR`);
        toast({ title: "Endereço preenchido!" });
      }
    } catch {
      toast({ title: "Erro na busca do CEP", variant: "destructive" });
    } finally {
      setSearchingCep(false);
    }
  };

  // ── Drag-to-reorder state ──
  const dragSrcIdx = useRef<number | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);

  const handleImgDragStart = (e: React.DragEvent, idx: number) => {
    dragSrcIdx.current = idx;
    e.dataTransfer.effectAllowed = "move";
    // phantom image = none so browser doesn't show default ghost
    const ghost = document.createElement("div");
    ghost.style.position = "absolute";
    ghost.style.top = "-9999px";
    document.body.appendChild(ghost);
    e.dataTransfer.setDragImage(ghost, 0, 0);
    setTimeout(() => document.body.removeChild(ghost), 0);
  };

  const handleImgDragEnter = (idx: number) => setDragOverIdx(idx);

  const handleImgDragEnd = () => {
    if (dragSrcIdx.current !== null && dragOverIdx !== null && dragSrcIdx.current !== dragOverIdx) {
      const src = dragSrcIdx.current;
      const dst = dragOverIdx;
      setForm((prev) => {
        const imgs = [...prev.images];
        const [moved] = imgs.splice(src, 1);
        imgs.splice(dst, 0, moved);
        return { ...prev, images: imgs };
      });
    }
    dragSrcIdx.current = null;
    setDragOverIdx(null);
  };

  // Move image one position left or right
  const moveImage = (idx: number, direction: -1 | 1) => {
    const newIdx = idx + direction;
    if (newIdx < 0 || newIdx >= form.images.length) return;
    setForm((prev) => {
      const imgs = [...prev.images];
      [imgs[idx], imgs[newIdx]] = [imgs[newIdx], imgs[idx]];
      return { ...prev, images: imgs };
    });
    setPreviewIdx(newIdx);
  };

  // Price: store as number internally, display as formatted BR string
  const formatBRPrice = (val: number) =>
    val === 0 ? "" : val.toLocaleString("pt-BR");

  const parseBRPrice = (str: string): number => {
    // remove everything except digits and comma
    const cleaned = str.replace(/\./g, "").replace(",", ".");
    return parseFloat(cleaned) || 0;
  };

  const [priceDisplay, setPriceDisplay] = useState(formatBRPrice(property?.price ?? 0));

  const processFiles = async (files: FileList | null) => {
    if (!files?.length) return;

    setUploading(true);
    try {
      const urls: string[] = [];
      for (const file of Array.from(files)) {
        const url = await uploadPropertyImage(file);
        urls.push(url);
      }
      setForm((prev) => ({ ...prev, images: [...prev.images, ...urls] }));
      toast({ title: "Upload concluído", description: `${urls.length} imagem(ns) enviada(s).` });
    } catch {
      toast({ title: "Erro no upload", description: "Não foi possível enviar a imagem.", variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    processFiles(e.target.files);
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = () => setIsDragging(false);

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    processFiles(e.dataTransfer.files);
  };

  const removeImage = (index: number) => {
    setForm((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
  };

  // Move image to position 0 (cover)
  const setCover = (index: number) => {
    if (index === 0) return;
    setForm((prev) => {
      const imgs = [...prev.images];
      const [picked] = imgs.splice(index, 1);
      return { ...prev, images: [picked, ...imgs] };
    });
  };

  // Preview lightbox
  const [previewIdx, setPreviewIdx] = useState<number | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.cep || form.cep.length < 8) {
      toast({ title: "CEP Obrigatório", description: "Por favor, informe um CEP válido para localizar o imóvel.", variant: "destructive" });
      return;
    }

    if (!form.addressNumber) {
      toast({ title: "Número Obrigatório", description: "Informe o número do imóvel para gerar o link do Google Maps.", variant: "destructive" });
      return;
    }

    const payload: PropertyFormData = {
      ...form,
      tag: form.tag || undefined,
    };

    try {
      if (isEditing && property) {
        await updateMutation.mutateAsync({ id: property.id, ...payload });
        toast({ title: "Imóvel atualizado!" });
      } else {
        await createMutation.mutateAsync(payload);
        toast({ title: "Imóvel cadastrado!" });
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
    <>
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-foreground/50 p-4 pt-16 backdrop-blur-sm">
      <div className="w-full max-w-2xl rounded-sm border border-border bg-card p-6 shadow-xl sm:p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-accent">
              {isEditing ? "Editar imóvel" : "Novo imóvel"}
            </p>
            <h2 className="mt-1 text-2xl text-foreground">
              {isEditing ? property.title : "Cadastrar novo imóvel"}
            </h2>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">


          {/* ── Informações básicas ── */}
          <div>
            <label className={labelClass}>Título</label>
            <input className={inputClass} value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} required />
          </div>

          <div>
            <label className={labelClass}>Descrição curta (card)</label>
            <textarea rows={2} className="w-full rounded-sm border border-border bg-background px-3 py-2 text-sm outline-none transition-colors focus:border-accent resize-none" value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} required />
          </div>

          <div>
            <label className={labelClass}>Descrição completa (página do imóvel)</label>
            <textarea rows={8} className="w-full rounded-sm border border-border bg-background px-3 py-2 text-sm outline-none transition-colors focus:border-accent resize-y" value={form.fullDescription} onChange={(e) => setForm((p) => ({ ...p, fullDescription: e.target.value }))} placeholder="Descrição detalhada, condições de negócio, diferenciais..." />
          </div>

          {/* ── Localização (Reposicionado abaixo da descrição) ── */}
          <div className="space-y-4 rounded-sm border border-accent/20 bg-accent/5 p-4">
            <p className="text-xs uppercase tracking-[0.18em] text-accent font-semibold">Localização do Imóvel</p>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-12">
              <div className="sm:col-span-3">
                <label className={labelClass}>CEP</label>
                <div className="relative">
                  <input
                    className={inputClass}
                    value={form.cep}
                    placeholder="00000-000"
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, "");
                      setForm(p => ({ ...p, cep: val }));
                      if (val.length === 8) {
                        handleCepLookup(val);
                      }
                    }}
                    required
                  />
                  {searchingCep && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <Loader2 size={14} className="animate-spin text-accent" />
                    </div>
                  )}
                </div>
              </div>
              <div className="sm:col-span-7">
                <label className={labelClass}>Rua/Logradouro</label>
                <input className={inputClass} value={form.street} onChange={(e) => setForm((p) => ({ ...p, street: e.target.value }))} required />
              </div>
              <div className="sm:col-span-2">
                <label className={labelClass}>Número</label>
                <input 
                  className={inputClass} 
                  value={form.addressNumber} 
                  onChange={(e) => {
                    const val = e.target.value;
                    setForm(p => {
                      const newUrl = `https://maps.google.com/maps?q=${encodeURIComponent(
                        `${p.street ? p.street + ", " : ""}${val}, ${p.neighborhood}, ${p.location}`.trim().replace(/^,/, "").trim()
                      )}&output=embed&hl=pt-BR`;
                      setMapPreview(newUrl);
                      return { ...p, addressNumber: val, mapEmbedUrl: newUrl };
                    });
                  }} 
                  placeholder="Ex: 150"
                  required 
                />
              </div>
              <div className="sm:col-span-6">
                <label className={labelClass}>Bairro</label>
                <input className={inputClass} value={form.neighborhood} onChange={(e) => setForm((p) => ({ ...p, neighborhood: e.target.value }))} required />
              </div>
              <div className="sm:col-span-6">
                <label className={labelClass}>Cidade/UF</label>
                <input className={inputClass} value={form.location} onChange={(e) => setForm((p) => ({ ...p, location: e.target.value }))} required />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            <div>
              <label className={labelClass}>Preço (R$)</label>
              <input
                type="text"
                className={inputClass}
                value={priceDisplay}
                onChange={(e) => {
                  // allow only digits, dots and commas
                  const raw = e.target.value.replace(/[^0-9.,]/g, "");
                  setPriceDisplay(raw);
                  setForm((p) => ({ ...p, price: parseBRPrice(raw) }));
                }}
                onBlur={() => setPriceDisplay(formatBRPrice(form.price))}
                placeholder="Ex: 850.000"
              />
            </div>
            <div>
              <label className={labelClass}>Finalidade</label>
              <select className={inputClass} value={form.purpose} onChange={(e) => setForm((p) => ({ ...p, purpose: e.target.value as PropertyPurpose }))}>
                <option value="venda">Venda</option>
                <option value="aluguel">Aluguel</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Tipo</label>
              <select className={inputClass} value={form.type} onChange={(e) => setForm((p) => ({ ...p, type: e.target.value as PropertyType }))}>
                {propertyTypes.map((t) => (
                  <option key={t.id} value={t.name}>{propertyTypeLabel(t.name)}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div>
              <label className={labelClass}>Código Ref.</label>
              <input className={inputClass} value={form.refCode} onChange={(e) => setForm((p) => ({ ...p, refCode: e.target.value }))} placeholder="Ex: RM00019" />
            </div>
            <div>
              <label className={labelClass}>Zona</label>
              <input className={inputClass} value={form.zone} onChange={(e) => setForm((p) => ({ ...p, zone: e.target.value }))} placeholder="Norte, Sul..." />
            </div>
            <div>
              <label className={labelClass}>Região</label>
              <input className={inputClass} value={form.region} onChange={(e) => setForm((p) => ({ ...p, region: e.target.value }))} />
            </div>
            <div>
              <label className={labelClass}>Tag</label>
              <input className={inputClass} value={form.tag} onChange={(e) => setForm((p) => ({ ...p, tag: e.target.value }))} placeholder="Ex: Pronto para morar" />
            </div>
          </div>



          {/* Números */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-6">
            <CounterInput label="Quartos" value={form.bedrooms} onChange={(val) => setForm(p => ({ ...p, bedrooms: val }))} />
            <CounterInput label="Suítes" value={form.suites} onChange={(val) => setForm(p => ({ ...p, suites: val }))} />
            <CounterInput label="Banheiros" value={form.bathrooms} onChange={(val) => setForm(p => ({ ...p, bathrooms: val }))} />
            <CounterInput label="Área m²" value={form.area} onChange={(val) => setForm(p => ({ ...p, area: val }))} />
            <CounterInput label="Vagas" value={form.parkingSpots} onChange={(val) => setForm(p => ({ ...p, parkingSpots: val }))} />
            <CounterInput label="Salas" value={form.rooms} onChange={(val) => setForm(p => ({ ...p, rooms: val }))} />
            <CounterInput label="Acomodações" value={form.accommodates} onChange={(val) => setForm(p => ({ ...p, accommodates: val }))} />
          </div>

          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground mb-2">Áreas detalhadas</p>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <CounterInput label="Área Total m²" value={form.totalArea} onChange={(val) => setForm(p => ({ ...p, totalArea: val }))} />
              <CounterInput label="Área Construída m²" value={form.builtArea} onChange={(val) => setForm(p => ({ ...p, builtArea: val }))} />
              <CounterInput label="Área Terreno m²" value={form.landArea} onChange={(val) => setForm(p => ({ ...p, landArea: val }))} />
              <CounterInput label="Terreno Frente (m)" value={form.landFront} onChange={(val) => setForm(p => ({ ...p, landFront: val }))} />
              <CounterInput label="Terreno Fundo (m)" value={form.landBack} onChange={(val) => setForm(p => ({ ...p, landBack: val }))} />
              <CounterInput label="Terreno Esq. (m)" value={form.landLeft} onChange={(val) => setForm(p => ({ ...p, landLeft: val }))} />
              <CounterInput label="Terreno Dir. (m)" value={form.landRight} onChange={(val) => setForm(p => ({ ...p, landRight: val }))} />
            </div>
          </div>

          {/* Condições */}
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground mb-2">Condições de negócio</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>Tipo de Contrato</label>
                <input className={inputClass} value={form.contractType} onChange={(e) => setForm((p) => ({ ...p, contractType: e.target.value }))} placeholder="Ex: Compra e Venda" />
              </div>
              <div>
                <label className={labelClass}>Periodicidade IPTU</label>
                <input className={inputClass} value={form.iptuPeriod} onChange={(e) => setForm((p) => ({ ...p, iptuPeriod: e.target.value }))} placeholder="Ex: Anual" />
              </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-5">
              <label className="inline-flex items-center gap-2 text-sm cursor-pointer"><input type="checkbox" checked={form.featured} onChange={(e) => setForm((p) => ({ ...p, featured: e.target.checked }))} className="accent-accent" />Destaque</label>
              <label className="inline-flex items-center gap-2 text-sm cursor-pointer"><input type="checkbox" checked={form.exclusive} onChange={(e) => setForm((p) => ({ ...p, exclusive: e.target.checked }))} className="accent-accent" />Exclusividade</label>
              <label className="inline-flex items-center gap-2 text-sm cursor-pointer"><input type="checkbox" checked={form.furnished} onChange={(e) => setForm((p) => ({ ...p, furnished: e.target.checked }))} className="accent-accent" />Mobiliado</label>
              <label className="inline-flex items-center gap-2 text-sm cursor-pointer"><input type="checkbox" checked={form.swap} onChange={(e) => setForm((p) => ({ ...p, swap: e.target.checked }))} className="accent-accent" />Aceita Permuta</label>
              <label className="inline-flex items-center gap-2 text-sm cursor-pointer"><input type="checkbox" checked={form.acceptsFinancing} onChange={(e) => setForm((p) => ({ ...p, acceptsFinancing: e.target.checked }))} className="accent-accent" />Aceita Financiamento</label>
            </div>
          </div>

          {/* Mídia */}
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground mb-2">Mídia e Localização</p>
            <div className="space-y-3">
              <div>
                <label className={labelClass}>Link do vídeo (YouTube URL ou ID)</label>
                <input className={inputClass} value={form.videoUrl} onChange={(e) => setForm((p) => ({ ...p, videoUrl: e.target.value }))} placeholder="https://www.youtube.com/watch?v=... ou só o ID" />
              </div>
              <div>
                <label className={labelClass}>Link do Google Maps (qualquer formato)</label>
                <div className="flex gap-2">
                  <input
                    className={inputClass}
                    value={form.mapEmbedUrl}
                    onChange={(e) => {
                      setForm((p) => ({ ...p, mapEmbedUrl: e.target.value }));
                      setMapPreview(null);
                    }}
                    placeholder="Cole aqui qualquer link do Google Maps"
                  />
                </div>
                {mapPreview && (
                  <div className="mt-2 aspect-video w-full overflow-hidden rounded-sm border border-border">
                    <iframe src={mapPreview} className="h-full w-full" loading="lazy" />
                  </div>
                )}
                <p className="mt-1 text-xs text-muted-foreground">
                  O link do mapa é gerado automaticamente ao preencher o CEP e Número.
                </p>
              </div>
            </div>
          </div>

          {/* Proximidades, Lazer, Cômodos */}
          {([
            { key: "nearby" as const, label: "Proximidades", placeholder: "Bares, Escolas...", text: nearbyText, setText: setNearbyText },
            { key: "leisure" as const, label: "Lazer", placeholder: "Piscina, Churrasqueira...", text: leisureText, setText: setLeisureText },
          ]).map(({ key, label, placeholder, text, setText }) => (
            <div key={key}>
              <label className={labelClass}>{label} <span className="normal-case">(separados por vírgula)</span></label>
              <input
                className={inputClass}
                value={text}
                onChange={(e) => {
                  const val = e.target.value;
                  setText(val);
                  setForm((p) => ({ 
                    ...p, 
                    [key]: val.split(",").map((s) => s.trim()).filter(Boolean) 
                  }));
                }}
                placeholder={placeholder}
              />
            </div>
          ))}

          {/* Image upload */}
          <div>
            <label className={labelClass}>Imagens</label>
            
            {/* Drag & Drop Zone */}
            <div
              className={`mb-4 flex flex-col items-center justify-center rounded-sm border-2 border-dashed p-8 text-center transition-colors ${
                isDragging
                  ? "border-accent bg-accent/5"
                  : "border-border bg-secondary/30 hover:bg-secondary/50"
              }`}
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
              onDrop={onDrop}
            >
              {uploading ? (
                <>
                  <Loader2 size={32} className="animate-spin text-muted-foreground mb-3" />
                  <p className="text-sm font-medium text-foreground">Enviando imagens...</p>
                </>
              ) : (
                <>
                  <ImagePlus size={32} className="text-muted-foreground mb-3" />
                  <p className="text-sm font-medium text-foreground mb-1">Arraste imagens aqui ou clique para selecionar</p>
                  <p className="text-xs text-muted-foreground">Suporta múltiplas imagens (JPG, PNG).</p>
                  <label className="mt-4 cursor-pointer rounded-sm bg-background px-4 py-2 text-xs font-semibold uppercase tracking-[0.1em] border border-border hover:border-accent hover:text-accent transition-colors">
                    Selecionar Arquivos
                    <input type="file" accept="image/*" multiple onChange={handleImageUpload} className="hidden" disabled={uploading} />
                  </label>
                </>
              )}
            </div>

            {/* Gallery Grid */}
            {form.images.length > 0 && (
              <>
                <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-3">
                  {form.images.map((url, i) => (
                    <div
                      key={url + i}
                      draggable
                      onDragStart={(e) => handleImgDragStart(e, i)}
                      onDragEnter={() => handleImgDragEnter(i)}
                      onDragOver={(e) => e.preventDefault()}
                      onDragEnd={handleImgDragEnd}
                      className={`group relative aspect-[4/3] cursor-grab active:cursor-grabbing overflow-hidden rounded-sm border-2 transition-all select-none ${
                        dragOverIdx === i && dragSrcIdx.current !== i
                          ? "border-accent scale-105 shadow-lg shadow-accent/20"
                          : dragSrcIdx.current === i
                          ? "opacity-40 border-dashed border-accent/60"
                          : i === 0
                          ? "border-accent"
                          : "border-border hover:border-accent/50"
                      }`}
                      onClick={() => setPreviewIdx(i)}
                    >
                      <img src={url} alt={`Imagem ${i + 1}`} className="h-full w-full object-cover pointer-events-none" />

                      {/* grip handle */}
                      <span className="absolute left-1 top-1 text-white/70 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                        <GripVertical size={12} />
                      </span>

                      {/* delete btn */}
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); removeImage(i); }}
                        className="absolute right-1 top-1 rounded-full bg-foreground/70 p-1 text-white opacity-0 transition-opacity group-hover:opacity-100"
                      >
                        <X size={11} />
                      </button>

                      {/* position badge */}
                      <span className={`absolute bottom-0 left-0 w-full text-[9px] font-bold uppercase tracking-widest text-center py-0.5 ${
                        i === 0 ? "bg-accent text-primary" : "bg-foreground/50 text-white"
                      }`}>
                        {i === 0 ? "Capa" : `#${i + 1}`}
                      </span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="submit" variant="crm" disabled={isPending} className="flex-1">
              {isPending ? (<><Loader2 size={16} className="animate-spin" /> Salvando...</>) : isEditing ? "Salvar alterações" : "Cadastrar imóvel"}
            </Button>
            <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
          </div>
        </form>
      </div>
    </div>

      {/* ── Image Lightbox (portal to body to escape backdrop-filter containing block) ── */}
      {previewIdx !== null && form.images[previewIdx] && createPortal(
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/85 p-4"
          style={{ backdropFilter: "blur(4px)" }}
          onClick={() => setPreviewIdx(null)}
        >
          <div
            className="relative flex max-h-[90vh] max-w-4xl w-full flex-col overflow-hidden rounded-sm bg-card shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border px-5 py-3">
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                Imagem {previewIdx + 1} de {form.images.length}
                {previewIdx === 0 && (
                  <span className="ml-2 rounded-sm bg-accent px-2 py-0.5 text-[9px] font-bold uppercase text-primary">Capa</span>
                )}
              </p>
              <button type="button" onClick={() => setPreviewIdx(null)} className="text-muted-foreground hover:text-foreground">
                <X size={18} />
              </button>
            </div>

            {/* Image */}
            <div className="flex-1 overflow-hidden bg-black/20">
              <img
                src={form.images[previewIdx]}
                alt={`Imagem ${previewIdx + 1}`}
                className="max-h-[70vh] w-full object-contain"
              />
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between gap-3 border-t border-border px-5 py-3">
              {/* Nav */}
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={previewIdx === 0}
                  onClick={() => setPreviewIdx((p) => (p !== null ? p - 1 : 0))}
                  className="rounded-sm border border-border px-3 py-1.5 text-xs text-foreground transition-colors hover:border-accent disabled:opacity-30"
                >
                  ← Anterior
                </button>
                <button
                  type="button"
                  disabled={previewIdx === form.images.length - 1}
                  onClick={() => setPreviewIdx((p) => (p !== null ? p + 1 : 0))}
                  className="rounded-sm border border-border px-3 py-1.5 text-xs text-foreground transition-colors hover:border-accent disabled:opacity-30"
                >
                  Próxima →
                </button>
              </div>
              {/* Actions */}
              <div className="flex flex-wrap gap-2">
                {/* Move left/right */}
                <button
                  type="button"
                  disabled={previewIdx === 0}
                  onClick={() => moveImage(previewIdx, -1)}
                  title="Mover para esquerda"
                  className="flex items-center gap-1 rounded-sm border border-border px-3 py-1.5 text-xs text-foreground transition-colors hover:border-accent disabled:opacity-30"
                >
                  <ArrowLeft size={13} /> Mover ←
                </button>
                <button
                  type="button"
                  disabled={previewIdx === form.images.length - 1}
                  onClick={() => moveImage(previewIdx, 1)}
                  title="Mover para direita"
                  className="flex items-center gap-1 rounded-sm border border-border px-3 py-1.5 text-xs text-foreground transition-colors hover:border-accent disabled:opacity-30"
                >
                  Mover → <ArrowRight size={13} />
                </button>

                {previewIdx !== 0 && (
                  <button
                    type="button"
                    onClick={() => { setCover(previewIdx); setPreviewIdx(0); }}
                    className="flex items-center gap-1.5 rounded-sm bg-accent px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.1em] text-primary transition-opacity hover:opacity-90"
                  >
                    <Star size={13} fill="currentColor" /> Definir como Capa
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => { removeImage(previewIdx); setPreviewIdx(null); }}
                  className="flex items-center gap-1.5 rounded-sm border border-red-400/30 bg-red-500/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.1em] text-red-400 transition-colors hover:bg-red-500/20"
                >
                  <X size={13} /> Remover
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}

// ─── Page ──────────────────────────────────────────────

export default function AdminPropertiesPage() {
  const { data: properties = [], isLoading, error } = useProperties();
  const deleteMutation = useDeleteProperty();
  const { toast } = useToast();
  const [modal, setModal] = useState<{ open: boolean; property?: Property }>({ open: false });

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Tem certeza que deseja excluir "${title}"?`)) return;

    try {
      await deleteMutation.mutateAsync(id);
      toast({ title: "Imóvel excluído", description: title });
    } catch {
      toast({ title: "Erro ao excluir", variant: "destructive" });
    }
  };

  if (error) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center px-6">
        <div className="text-center space-y-3">
          <p className="text-xs uppercase tracking-[0.28em] text-red-500">Erro</p>
          <p className="text-lg text-foreground">Falha ao carregar imóveis</p>
          <p className="text-sm text-muted-foreground">{(error as Error).message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 px-6 py-8 lg:px-10 lg:py-10">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-3">
          <p className="text-xs uppercase tracking-[0.28em] text-accent">Gestão de imóveis</p>
          <h1 className="text-4xl text-foreground">Portfólio administrativo</h1>
          <p className="max-w-2xl text-base leading-relaxed text-muted-foreground">
            Cadastre, edite e exclua imóveis. Dados sincronizados em tempo real com o Supabase.
          </p>
        </div>
        <Button variant="crm" onClick={() => setModal({ open: true })}>
          <Plus size={16} /> Novo imóvel
        </Button>
      </div>

      <div className="grid gap-5 md:grid-cols-3">
        {[
          { label: "Imóveis", value: `${properties.filter((p) => p.purpose === "venda").length}` },
          { label: "Aluguéis", value: `${properties.filter((p) => p.purpose === "aluguel").length}` },
          { label: "Destaques", value: `${properties.filter((p) => p.featured).length}` },
        ].map((item) => (
          <div key={item.label} className="rounded-sm border border-border bg-card p-6">
            <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">{item.label}</p>
            <p className="mt-3 font-serif text-4xl text-foreground">{item.value}</p>
          </div>
        ))}
      </div>

      <div className="overflow-hidden rounded-sm border border-border bg-card">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-accent" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-secondary/60 text-left text-xs uppercase tracking-[0.18em] text-muted-foreground">
                <tr>
                  <th className="px-6 py-4">Imóvel</th>
                  <th className="px-6 py-4">Finalidade</th>
                  <th className="px-6 py-4">Tipo</th>
                  <th className="px-6 py-4">Bairro</th>
                  <th className="px-6 py-4">Preço</th>
                  <th className="px-6 py-4">Ações</th>
                </tr>
              </thead>
              <tbody>
                {properties.map((property) => (
                  <tr key={property.id} className="border-t border-border">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        {property.images[0] ? (
                          <img src={property.images[0]} alt={property.title} className="h-14 w-20 rounded-sm object-cover" />
                        ) : (
                          <div className="flex h-14 w-20 items-center justify-center rounded-sm bg-secondary text-muted-foreground">
                            <Upload size={18} />
                          </div>
                        )}
                        <div>
                          <p className="font-medium text-foreground">{property.title}</p>
                          <p className="mt-1 text-sm text-muted-foreground">ID #{property.id.slice(0, 8)}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-foreground">{purposeLabel(property.purpose)}</td>
                    <td className="px-6 py-4 text-sm text-foreground">{propertyTypeLabel(property.type)}</td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">{property.neighborhood}</td>
                    <td className="px-6 py-4 font-medium text-navy">{formatPropertyPrice(property)}</td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <Button
                          variant="crmSecondary"
                          size="sm"
                          onClick={() => setModal({ open: true, property })}
                        >
                          <PencilLine size={14} /> Editar
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(property.id, property.title)}
                          disabled={deleteMutation.isPending}
                        >
                          <Trash2 size={14} /> Excluir
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {properties.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-16 text-center text-muted-foreground">
                      Nenhum imóvel cadastrado. Clique em &quot;Novo imóvel&quot; para começar.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modal.open && (
        <PropertyFormModal
          property={modal.property}
          onClose={() => setModal({ open: false })}
        />
      )}
    </div>
  );
}
