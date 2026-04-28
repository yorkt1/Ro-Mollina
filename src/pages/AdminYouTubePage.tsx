import { useState } from "react";
import { ImagePlus, Loader2, PencilLine, Play, Plus, Minus, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  useYouTubeVideos,
  useCreateYouTubeVideo,
  useUpdateYouTubeVideo,
  useDeleteYouTubeVideo,
  type YouTubeVideo,
} from "@/hooks/use-youtube-videos";
import { uploadImageToCloudinary } from "@/lib/cloudinary";

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

function VideoFormModal({
  video,
  currentCount,
  onClose,
}: {
  video?: YouTubeVideo;
  currentCount: number;
  onClose: () => void;
}) {
  const { toast } = useToast();
  const createMutation = useCreateYouTubeVideo();
  const updateMutation = useUpdateYouTubeVideo();
  const isEditing = !!video;

  const [form, setForm] = useState({
    title: video?.title ?? "",
    youtube_id: video?.youtube_id ?? "",
    thumbnail: video?.thumbnail ?? "",
    sort_order: video?.sort_order ?? currentCount + 1,
  });

  const [uploading, setUploading] = useState(false);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const url = await uploadImageToCloudinary(file);
      setForm((prev) => ({ ...prev, thumbnail: url }));
      toast({ title: "Thumbnail enviada!" });
    } catch {
      toast({ title: "Erro no upload", variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (isEditing && video) {
        await updateMutation.mutateAsync({ id: video.id, ...form });
        toast({ title: "Vídeo atualizado!" });
      } else {
        await createMutation.mutateAsync(form);
        toast({ title: "Vídeo adicionado!" });
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
              {isEditing ? "Editar vídeo" : "Novo vídeo"}
            </p>
            <h2 className="mt-1 text-2xl text-foreground">
              {isEditing ? video.title : "Adicionar vídeo do YouTube"}
            </h2>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className={labelClass}>Título do vídeo</label>
            <input className={inputClass} value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} required placeholder='Ex: "Tour Apartamento Alto Padrão"' />
          </div>

          <div>
            <label className={labelClass}>ID do YouTube</label>
            <input className={inputClass} value={form.youtube_id} onChange={(e) => setForm((p) => ({ ...p, youtube_id: e.target.value }))} required placeholder="Ex: dQw4w9WgXcQ (parte após v=)" />
            <p className="mt-1.5 text-xs text-muted-foreground">
              Cole apenas o ID do vídeo. Ex: se o link é youtube.com/watch?v=<strong>abc123</strong>, cole <strong>abc123</strong>
            </p>
          </div>

          <CounterInput
            label="Ordem de exibição"
            value={form.sort_order}
            onChange={(val) => setForm((p) => ({ ...p, sort_order: val }))}
            min={1}
          />

          {/* Thumbnail */}
          <div>
            <label className={labelClass}>Thumbnail</label>
            {form.thumbnail ? (
              <div className="group relative aspect-video overflow-hidden rounded-sm border border-border">
                <img src={form.thumbnail} alt="Preview" className="h-full w-full object-cover" />
                <button
                  type="button"
                  onClick={() => setForm((p) => ({ ...p, thumbnail: "" }))}
                  className="absolute right-2 top-2 rounded-full bg-foreground/70 p-1.5 text-white opacity-0 transition-opacity group-hover:opacity-100"
                >
                  <X size={14} />
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <label className="flex aspect-video cursor-pointer items-center justify-center rounded-sm border-2 border-dashed border-border bg-secondary/30 text-muted-foreground transition-colors hover:border-accent hover:text-accent">
                  {uploading ? <Loader2 size={24} className="animate-spin" /> : (
                    <div className="flex flex-col items-center gap-2">
                      <ImagePlus size={28} />
                      <span className="text-xs">Clique para enviar thumbnail</span>
                    </div>
                  )}
                  <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" disabled={uploading} />
                </label>
                {form.youtube_id && (
                  <button
                    type="button"
                    onClick={() => setForm((p) => ({ ...p, thumbnail: `https://img.youtube.com/vi/${p.youtube_id}/maxresdefault.jpg` }))}
                    className="text-xs text-accent hover:underline"
                  >
                    Ou usar thumbnail automática do YouTube
                  </button>
                )}
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="submit" variant="crm" disabled={isPending || !form.thumbnail} className="flex-1">
              {isPending ? (
                <>
                  <Loader2 size={16} className="animate-spin" /> Salvando...
                </>
              ) : isEditing ? "Salvar" : "Adicionar vídeo"}
            </Button>
            <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Page ──────────────────────────────────────────────

export default function AdminYouTubePage() {
  const { data: videos = [], isLoading, error } = useYouTubeVideos();
  const deleteMutation = useDeleteYouTubeVideo();
  const { toast } = useToast();
  const [modal, setModal] = useState<{ open: boolean; video?: YouTubeVideo }>({ open: false });

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Excluir vídeo "${title}"?`)) return;
    try {
      await deleteMutation.mutateAsync(id);
      toast({ title: "Vídeo excluído", description: title });
    } catch {
      toast({ title: "Erro ao excluir", variant: "destructive" });
    }
  };

  if (error) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center px-6">
        <div className="text-center space-y-3">
          <p className="text-xs uppercase tracking-[0.28em] text-red-500">Erro</p>
          <p className="text-lg text-foreground">Falha ao carregar vídeos</p>
          <p className="text-sm text-muted-foreground">{(error as Error).message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 px-6 py-8 lg:px-10 lg:py-10">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-3">
          <p className="text-xs uppercase tracking-[0.28em] text-accent">Gestão de vídeos</p>
          <h1 className="text-4xl text-foreground">YouTube</h1>
          <p className="max-w-2xl text-base leading-relaxed text-muted-foreground">
            Gerencie os vídeos que aparecem na seção YouTube da homepage.
          </p>
        </div>
        <Button variant="crm" onClick={() => setModal({ open: true })}>
          <Plus size={16} /> Novo vídeo
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-accent" />
        </div>
      ) : videos.length === 0 ? (
        <div className="rounded-sm border border-dashed border-border bg-card px-6 py-16 text-center">
          <p className="text-xl font-serif text-foreground">Nenhum vídeo cadastrado</p>
          <p className="mt-3 text-sm text-muted-foreground">Adicione vídeos do YouTube para exibir na homepage.</p>
          <Button variant="crm" className="mt-4" onClick={() => setModal({ open: true })}>
            <Plus size={16} /> Adicionar primeiro vídeo
          </Button>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-3">
          {videos.map((v) => (
            <div key={v.id} className="overflow-hidden rounded-sm border border-border bg-card">
              <div className="relative aspect-video overflow-hidden">
                {v.thumbnail ? (
                  <img src={v.thumbnail} alt={v.title} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-secondary text-muted-foreground">
                    <ImagePlus size={32} />
                  </div>
                )}
                <div className="absolute inset-0 flex items-center justify-center bg-foreground/20">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent/90 text-primary">
                    <Play size={20} className="ml-0.5" />
                  </div>
                </div>
                <span className="absolute left-3 top-3 rounded-sm bg-accent px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-primary">
                  Ordem {v.sort_order}
                </span>
              </div>
              <div className="p-5 space-y-3">
                <h3 className="font-serif text-lg font-semibold text-foreground">{v.title}</h3>
                <p className="text-xs text-muted-foreground/60">ID: {v.youtube_id}</p>
                <div className="flex gap-2 pt-2">
                  <Button variant="crmSecondary" size="sm" onClick={() => setModal({ open: true, video: v })}>
                    <PencilLine size={14} /> Editar
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleDelete(v.id, v.title)} disabled={deleteMutation.isPending}>
                    <Trash2 size={14} /> Excluir
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {modal.open && (
        <VideoFormModal
          video={modal.video}
          currentCount={videos.length}
          onClose={() => setModal({ open: false })}
        />
      )}
    </div>
  );
}
