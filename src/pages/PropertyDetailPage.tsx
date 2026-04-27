import { useMemo, useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft, Bath, BedDouble, CarFront, Loader2, MapPin, Maximize,
  MessageCircle, Share2, CheckCircle2, Sofa, Utensils, Trees,
  Coffee, ShoppingCart, School, PillIcon, Dumbbell, Waves,
  X, ChevronLeft, ChevronRight, Grid3X3,
} from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import PropertyCard from "@/components/PropertyCard";
import { Button } from "@/components/ui/button";
import { formatPropertyPrice, propertyTypeLabel, purposeLabel, whatsappLink } from "@/data/properties";
import { useProperty, useProperties } from "@/hooks/use-properties";

/* ── helpers ─────────────────────────────────── */

function InfoRow({ label, value }: { label: string; value?: string | number | boolean | null }) {
  if (value === undefined || value === null || value === "" || value === false) return null;
  return (
    <div className="flex items-start justify-between gap-4 border-b border-border/60 py-2.5 last:border-0">
      <span className="text-xs uppercase tracking-[0.18em] text-muted-foreground shrink-0">{label}</span>
      <span className="text-sm text-right text-foreground font-medium">
        {typeof value === "boolean" ? (value ? "Sim" : "Não") : String(value)}
      </span>
    </div>
  );
}

/**
 * Extracts {lat, lng} from any full Google Maps URL.
 * Returns null for short URLs (goo.gl) that can't be parsed client-side.
 */
function extractCoords(url: string): { lat: number; lng: number } | null {
  if (!url) return null;

  // @lat,lng,zoom pattern — most common in full Maps URLs
  const atMatch = url.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
  if (atMatch) return { lat: parseFloat(atMatch[1]), lng: parseFloat(atMatch[2]) };

  // q=lat,lng pattern
  const qMatch = url.match(/[?&]q=(-?\d+\.\d+),(-?\d+\.\d+)/);
  if (qMatch) return { lat: parseFloat(qMatch[1]), lng: parseFloat(qMatch[2]) };

  // ll=lat,lng pattern
  const llMatch = url.match(/[?&]ll=(-?\d+\.\d+),(-?\d+\.\d+)/);
  if (llMatch) return { lat: parseFloat(llMatch[1]), lng: parseFloat(llMatch[2]) };

  return null;
}

/**
 * Builds a Google Maps embed URL from coordinates.
 */
function toGoogleEmbed(lat: number, lng: number): string {
  return `https://maps.google.com/maps?q=${lat},${lng}&output=embed&hl=pt-BR`;
}

/**
 * Returns an embeddable map src (Google Maps) or null when not possible.
 */
function toMapEmbedUrl(url: string): string | null {
  if (!url) return null;

  // Already a Google Maps embed URL — use as-is (user pasted the proper embed link)
  if (url.includes("/maps/embed") || url.includes("output=embed")) return url;

  // Already an OSM embed — use as-is (legacy)
  if (url.includes("openstreetmap.org/export/embed")) return url;

  // Try to extract coordinates and use Google
  const coords = extractCoords(url);
  if (coords) return toGoogleEmbed(coords.lat, coords.lng);

  return null; // can't embed (short URL or unrecognised format)
}

/** Returns true for shortened Maps URLs that can't be parsed client-side */
const isShortMapsUrl = (url: string) =>
  url.includes("goo.gl") || url.includes("maps.app.goo.gl");

const SUPABASE_URL = "https://kujwgpumdggggbnxuhem.supabase.co";
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

function SmartMap({ url }: { url: string }) {
  const [resolvedSrc, setResolvedSrc] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!url) return;
    
    const embedSrc = toMapEmbedUrl(url);
    if (embedSrc) {
      setResolvedSrc(embedSrc);
      return;
    }

    if (isShortMapsUrl(url)) {
      setLoading(true);
      fetch(`${SUPABASE_URL}/functions/v1/resolve-url`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${SUPABASE_ANON_KEY}` },
        body: JSON.stringify({ url }),
      })
        .then((r) => r.json())
        .then((data) => {
          if (data.lat !== null && data.lng !== null) {
            setResolvedSrc(`https://maps.google.com/maps?q=${data.lat},${data.lng}&output=embed&hl=pt-BR`);
          } else if (data.osmEmbed) {
            setResolvedSrc(data.osmEmbed);
          } else {
            setError(true);
          }
        })
        .catch(() => setError(true))
        .finally(() => setLoading(false));
    } else {
      setError(true);
    }
  }, [url]);

  if (loading) {
    return (
      <div className="flex h-[300px] w-full flex-col items-center justify-center gap-3 rounded-sm border border-border shadow-sm">
        <Loader2 className="animate-spin text-accent" size={24} />
        <span className="text-xs uppercase tracking-widest text-muted-foreground">Carregando mapa...</span>
      </div>
    );
  }

  if (error || !resolvedSrc) {
    return (
      <a
        href={url}
        target="_blank"
        rel="noreferrer"
        className="flex items-center justify-center gap-3 rounded-sm border border-border bg-card px-6 py-8 text-sm font-medium text-foreground shadow-sm transition-colors hover:border-accent hover:text-accent"
      >
        <MapPin size={20} className="text-accent" />
        Ver localização no Google Maps
      </a>
    );
  }

  return (
    <>
      <div className="relative aspect-[16/9] overflow-hidden rounded-sm border border-border shadow-lg">
        <iframe
          src={resolvedSrc}
          title="Localização do imóvel"
          loading="lazy"
          className="absolute inset-0 h-full w-full"
          referrerPolicy="no-referrer-when-downgrade"
        />
      </div>
      <a
        href={url}
        target="_blank"
        rel="noreferrer"
        className="inline-flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-accent"
      >
        <MapPin size={12} /> Abrir no Google Maps
      </a>
    </>
  );
}


/* ── Gallery Modal ───────────────────────────── */
function GalleryModal({
  images,
  title,
  initialIndex,
  onClose,
}: {
  images: string[];
  title: string;
  initialIndex: number;
  onClose: () => void;
}) {
  const [current, setCurrent] = useState(initialIndex);
  const [view, setView] = useState<"grid" | "lightbox">("lightbox");

  const prev = useCallback(() => setCurrent((c) => (c - 1 + images.length) % images.length), [images.length]);
  const next = useCallback(() => setCurrent((c) => (c + 1) % images.length), [images.length]);

  // Keyboard navigation
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    };
    document.addEventListener("keydown", handler);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handler);
      document.body.style.overflow = "";
    };
  }, [onClose, prev, next]);

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex flex-col bg-black/95 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      {/* Top bar */}
      <div className="flex shrink-0 items-center justify-between px-5 py-4">
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-white/80">{title}</span>
          <span className="text-xs text-white/40">{current + 1} / {images.length}</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setView(view === "grid" ? "lightbox" : "grid")}
            className="flex items-center gap-1.5 rounded-sm border border-white/20 px-3 py-1.5 text-xs text-white/70 transition-colors hover:border-white/50 hover:text-white"
          >
            <Grid3X3 size={13} />
            {view === "grid" ? "Ver foto" : "Ver todas"}
          </button>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-sm border border-white/20 text-white/70 transition-colors hover:border-white/50 hover:text-white"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Grid view */}
      {view === "grid" ? (
        <div className="flex-1 overflow-y-auto px-4 py-2">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
            {images.map((img, i) => (
              <button
                key={i}
                onClick={() => { setCurrent(i); setView("lightbox"); }}
                className={`group relative overflow-hidden rounded-sm transition-transform hover:scale-[1.02] ${
                  i === current ? "ring-2 ring-amber-400" : ""
                }`}
              >
                <img
                  src={img}
                  alt={`${title} ${i + 1}`}
                  className="aspect-[4/3] w-full object-cover"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-black/0 transition-colors group-hover:bg-black/20" />
                <span className="absolute bottom-1.5 right-2 text-[10px] text-white/60">{i + 1}</span>
              </button>
            ))}
          </div>
        </div>
      ) : (
        /* Lightbox view */
        <div className="relative flex flex-1 items-center justify-center overflow-hidden px-4">
          <img
            key={current}
            src={images[current]}
            alt={`${title} ${current + 1}`}
            className="max-h-full max-w-full rounded-sm object-contain shadow-2xl"
            style={{ animation: "fadeIn 0.18s ease" }}
          />
          {images.length > 1 && (
            <>
              <button
                onClick={prev}
                className="absolute left-4 flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-black/50 text-white backdrop-blur transition-colors hover:bg-white/20"
              >
                <ChevronLeft size={20} />
              </button>
              <button
                onClick={next}
                className="absolute right-4 flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-black/50 text-white backdrop-blur transition-colors hover:bg-white/20"
              >
                <ChevronRight size={20} />
              </button>
            </>
          )}
        </div>
      )}

      {/* Thumbnail strip (lightbox mode only) */}
      {view === "lightbox" && images.length > 1 && (
        <div className="shrink-0 px-4 py-3">
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {images.map((img, i) => (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                className={`shrink-0 overflow-hidden rounded-sm border-2 transition-all ${
                  i === current ? "border-amber-400 opacity-100" : "border-transparent opacity-50 hover:opacity-80"
                }`}
              >
                <img src={img} alt="" className="h-14 w-20 object-cover" />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>,
    document.body,
  );
}

/* ── Gallery Thumbnails ──────────────────────── */
const MAX_VISIBLE = 5;
function GalleryThumbnails({
  images,
  title,
  selectedImage,
  setSelectedImage,
  onOpenModal,
}: {
  images: string[];
  title: string;
  selectedImage: number;
  setSelectedImage: (i: number) => void;
  onOpenModal: (i: number) => void;
}) {
  const visible = images.slice(0, MAX_VISIBLE);
  const remaining = images.length - MAX_VISIBLE;

  return (
    <div className="grid grid-cols-5 gap-2">
      {visible.map((image, index) => {
        const isLast = index === MAX_VISIBLE - 1 && remaining > 0;
        return (
          <button
            key={`thumb-${index}`}
            type="button"
            onClick={() =>
              isLast ? onOpenModal(index) : setSelectedImage(index)
            }
            className={`relative overflow-hidden rounded-sm border-2 transition-colors ${
              selectedImage === index && !isLast
                ? "border-accent"
                : "border-transparent"
            }`}
          >
            <img
              src={image}
              alt={`${title} ${index + 1}`}
              className="aspect-[4/3] w-full object-cover"
            />
            {isLast && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-0.5 bg-black/60 backdrop-blur-[1px]">
                <span className="text-lg font-bold text-white">+{remaining}</span>
                <span className="text-[9px] uppercase tracking-widest text-white/80">fotos</span>
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}

const NEARBY_ICONS: Record<string, React.ElementType> = {
  "Bares e Restaurantes": Coffee,
  "Escola": School,
  "Farmácia": PillIcon,
  "Supermercado": ShoppingCart,
  "Academia": Dumbbell,
  "Praia": Waves,
  "Parque": Trees,
};

const LEISURE_ICONS: Record<string, React.ElementType> = {
  "Churrasqueira": Utensils,
  "Piscina": Waves,
  "Salão de Festas": Sofa,
  "Academia": Dumbbell,
  "Playground": Trees,
};

export default function PropertyDetailPage() {
  const { id } = useParams();
  const { data: property, isLoading } = useProperty(id);
  const { data: allProperties = [] } = useProperties();
  const [selectedImage, setSelectedImage] = useState(0);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [galleryIndex, setGalleryIndex] = useState(0);

  const related = useMemo(
    () => allProperties.filter((item) => item.id !== id && item.purpose === property?.purpose).slice(0, 3),
    [id, property?.purpose, allProperties],
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex min-h-[70vh] items-center justify-center">
          <Loader2 className="h-10 w-10 animate-spin text-accent" />
        </div>
        <Footer />
      </div>
    );
  }

  if (!property) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex min-h-[70vh] items-center justify-center px-6 pt-24">
          <div className="space-y-4 text-center">
            <p className="text-xs uppercase tracking-[0.28em] text-accent">Imóvel não encontrado</p>
            <h1 className="text-4xl text-foreground">Este detalhe ainda não está disponível.</h1>
            <Button asChild variant="crm">
              <Link to="/imoveis">Voltar ao portfólio</Link>
            </Button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const message = `Olá Ro! Tenho interesse no imóvel ${property.title} (${formatPropertyPrice(property)}). Podemos conversar?`;
  const shareUrl = typeof window !== "undefined" ? window.location.href : "";

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({ title: property.title, url: shareUrl });
    } else {
      navigator.clipboard.writeText(shareUrl);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* ─── Back + Breadcrumb ─── */}
      <section className="pt-24 pb-6">
        <div className="container px-6">
          <Link to="/imoveis" className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground">
            <ArrowLeft size={16} /> Voltar ao portfólio
          </Link>
          {property.refCode && (
            <p className="mt-1 text-xs text-muted-foreground/60">Ref: {property.refCode}</p>
          )}
        </div>
      </section>

      {/* ─── Main content ─── */}
      <section className="pb-14">
        <div className="container grid gap-10 px-6 xl:grid-cols-[1.3fr_0.7fr]">

          {/* ── LEFT COL ── */}
          <div className="space-y-6">

            {/* Image gallery */}
            <div className="space-y-3">
              <div
                className="relative overflow-hidden rounded-sm bg-card shadow-[0_18px_46px_hsl(var(--foreground)/0.08)] cursor-zoom-in"
                onClick={() => { setGalleryIndex(selectedImage); setGalleryOpen(true); }}
              >
                {property.images[selectedImage] ? (
                  <img
                    src={property.images[selectedImage]}
                    alt={property.title}
                    className="aspect-[16/10] w-full object-cover"
                  />
                ) : (
                  <div className="flex aspect-[16/10] w-full items-center justify-center bg-secondary text-muted-foreground">
                    Sem imagem
                  </div>
                )}
                {property.images.length > 1 && (
                  <div className="absolute bottom-3 right-3 flex items-center gap-1.5 rounded-full border border-white/20 bg-black/50 px-3 py-1 text-xs text-white backdrop-blur-sm">
                    <Grid3X3 size={11} />
                    {property.images.length} fotos
                  </div>
                )}
              </div>
              {property.images.length > 1 && (
                <GalleryThumbnails
                  images={property.images}
                  title={property.title}
                  selectedImage={selectedImage}
                  setSelectedImage={setSelectedImage}
                  onOpenModal={(i) => { setGalleryIndex(i); setGalleryOpen(true); }}
                />
              )}
            </div>

            {galleryOpen && (
              <GalleryModal
                images={property.images}
                title={property.title}
                initialIndex={galleryIndex}
                onClose={() => setGalleryOpen(false)}
              />
            )}

            {/* YouTube video */}
            {property.videoUrl && (
              <div className="space-y-3">
                <p className="text-xs uppercase tracking-[0.28em] text-accent">Vídeo do imóvel</p>
                <div className="relative aspect-video overflow-hidden rounded-sm bg-card shadow-lg">
                  <iframe
                    src={`https://www.youtube.com/embed/${property.videoUrl.replace(/.*(?:v=|youtu\.be\/)([^&]+).*/, "$1")}`}
                    title={property.title}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="absolute inset-0 h-full w-full"
                  />
                </div>
              </div>
            )}

            {/* Full description */}
            {(property.fullDescription || property.description) && (
              <div className="space-y-4 rounded-sm border border-border bg-card p-6">
                <p className="text-xs uppercase tracking-[0.28em] text-accent">Descrição do Imóvel</p>
                <div className="prose prose-sm max-w-none text-muted-foreground leading-relaxed whitespace-pre-line">
                  {property.fullDescription || property.description}
                </div>
              </div>
            )}

            {/* Proximidades */}
            {property.nearby && property.nearby.length > 0 && (
              <div className="space-y-3 rounded-sm border border-border bg-card p-6">
                <p className="text-xs uppercase tracking-[0.28em] text-accent">Proximidades</p>
                <div className="flex flex-wrap gap-3">
                  {property.nearby.map((item) => {
                    const Icon = NEARBY_ICONS[item] ?? CheckCircle2;
                    return (
                      <span key={item} className="flex items-center gap-1.5 rounded-full border border-border bg-secondary/30 px-3 py-1.5 text-sm text-foreground">
                        <Icon size={13} className="text-accent shrink-0" /> {item}
                      </span>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Lazer */}
            {property.leisure && property.leisure.length > 0 && (
              <div className="space-y-3 rounded-sm border border-border bg-card p-6">
                <p className="text-xs uppercase tracking-[0.28em] text-accent">Lazer</p>
                <div className="flex flex-wrap gap-3">
                  {property.leisure.map((item) => {
                    const Icon = LEISURE_ICONS[item] ?? CheckCircle2;
                    return (
                      <span key={item} className="flex items-center gap-1.5 rounded-full border border-border bg-secondary/30 px-3 py-1.5 text-sm text-foreground">
                        <Icon size={13} className="text-accent shrink-0" /> {item}
                      </span>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Cômodos */}
            {property.roomsList && property.roomsList.length > 0 && (
              <div className="space-y-3 rounded-sm border border-border bg-card p-6">
                <p className="text-xs uppercase tracking-[0.28em] text-accent">Cômodos</p>
                <div className="flex flex-wrap gap-3">
                  {property.roomsList.map((item) => (
                    <span key={item} className="flex items-center gap-1.5 rounded-full border border-border bg-secondary/30 px-3 py-1.5 text-sm text-foreground">
                      <CheckCircle2 size={13} className="text-accent shrink-0" /> {item}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Map */}
            {property.mapEmbedUrl && (
              <div className="space-y-3">
                <p className="text-xs uppercase tracking-[0.28em] text-accent">Localização</p>
                <SmartMap url={property.mapEmbedUrl} />
              </div>
            )}
          </div>

          {/* ── RIGHT COL ── */}
          <div className="space-y-6">

            {/* Header info */}
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <span className="rounded-sm bg-accent px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
                  {purposeLabel(property.purpose)}
                </span>
                <span className="rounded-sm bg-secondary px-3 py-1 text-[11px] font-medium uppercase tracking-[0.18em] text-foreground">
                  {propertyTypeLabel(property.type)}
                </span>
                {property.tag && (
                  <span className="rounded-sm bg-navy-deep/10 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.18em] text-navy">
                    {property.tag}
                  </span>
                )}
              </div>
              <h1 className="text-3xl leading-tight text-foreground md:text-4xl">{property.title}</h1>
              <div className="flex items-center gap-2 text-muted-foreground">
                <MapPin size={15} />
                <span className="text-sm">{property.neighborhood} · {property.location}</span>
              </div>
              <p className="font-serif text-3xl text-navy">{formatPropertyPrice(property)}</p>
              {property.area > 0 && property.price > 0 && (
                <p className="text-xs text-muted-foreground">
                  Valor por m²: R$ {(property.price / property.area).toLocaleString("pt-BR", { maximumFractionDigits: 0 })}
                </p>
              )}
            </div>

            {/* Key specs */}
            <div className="grid grid-cols-2 gap-3 rounded-sm border border-border bg-card p-4 shadow-[0_12px_34px_hsl(var(--foreground)/0.05)]">
              {property.type !== "terreno" && (
                <>
                  <div className="space-y-1">
                    <BedDouble size={16} className="text-accent" />
                    <p className="font-serif text-xl text-foreground">{property.bedrooms}</p>
                    <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Dormitórios</p>
                  </div>
                  {property.suites > 0 && (
                    <div className="space-y-1">
                      <BedDouble size={16} className="text-accent/60" />
                      <p className="font-serif text-xl text-foreground">{property.suites}</p>
                      <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Suítes</p>
                    </div>
                  )}
                  <div className="space-y-1">
                    <Bath size={16} className="text-accent" />
                    <p className="font-serif text-xl text-foreground">{property.bathrooms}</p>
                    <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Banheiros</p>
                  </div>
                  <div className="space-y-1">
                    <CarFront size={16} className="text-accent" />
                    <p className="font-serif text-xl text-foreground">{property.parkingSpots}</p>
                    <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Vagas</p>
                  </div>
                  {property.rooms != null && property.rooms > 0 && (
                    <div className="space-y-1">
                      <Sofa size={16} className="text-accent" />
                      <p className="font-serif text-xl text-foreground">{property.rooms}</p>
                      <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Salas</p>
                    </div>
                  )}
                  {property.accommodates != null && property.accommodates > 0 && (
                    <div className="space-y-1">
                      <Maximize size={16} className="text-accent" />
                      <p className="font-serif text-xl text-foreground">{property.accommodates}</p>
                      <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Acomodações</p>
                    </div>
                  )}
                </>
              )}
              <div className="space-y-1">
                <Maximize size={16} className="text-accent" />
                <p className="font-serif text-xl text-foreground">{property.area} m²</p>
                <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Área</p>
              </div>
            </div>

            {/* Detailed info table */}
            <div className="rounded-sm border border-border bg-card p-5 shadow-[0_12px_34px_hsl(var(--foreground)/0.05)]">
              <p className="mb-3 text-xs uppercase tracking-[0.28em] text-accent">Ficha técnica</p>
              <InfoRow label="Código" value={property.refCode} />
              <InfoRow label="Zona" value={property.zone} />
              <InfoRow label="Região" value={property.region} />
              <InfoRow label="Bairro" value={property.neighborhood} />
              <InfoRow label="Área Total" value={property.totalArea ? `${property.totalArea} m²` : undefined} />
              <InfoRow label="Área Construída" value={property.builtArea ? `${property.builtArea} m²` : undefined} />
              <InfoRow label="Área Terreno" value={property.landArea ? `${property.landArea} m²` : undefined} />
              <InfoRow label="Terreno Frente" value={property.landFront ? `${property.landFront} m` : undefined} />
              <InfoRow label="Terreno Fundo" value={property.landBack ? `${property.landBack} m` : undefined} />
              <InfoRow label="Terreno Esquerda" value={property.landLeft ? `${property.landLeft} m` : undefined} />
              <InfoRow label="Terreno Direita" value={property.landRight ? `${property.landRight} m` : undefined} />
              <InfoRow label="Mobiliado" value={property.furnished} />
              <InfoRow label="Permuta" value={property.swap} />
              <InfoRow label="Aceita Financiamento" value={property.acceptsFinancing} />
              <InfoRow label="Tipo de Contrato" value={property.contractType} />
              <InfoRow label="IPTU (periodicidade)" value={property.iptuPeriod} />
            </div>

            {/* Share */}
            <button
              onClick={handleShare}
              className="flex w-full items-center justify-center gap-2 rounded-sm border border-border bg-secondary/30 py-2.5 text-xs uppercase tracking-[0.18em] text-muted-foreground transition-colors hover:border-accent/40 hover:text-foreground"
            >
              <Share2 size={14} /> Compartilhar imóvel
            </button>

            {/* CTA */}
            <div className="rounded-sm border border-border bg-navy-deep p-7 text-primary-foreground shadow-[0_18px_42px_hsl(var(--navy-deep)/0.2)]">
              <p className="text-xs uppercase tracking-[0.28em] text-accent">Atendimento</p>
              <h2 className="mt-3 text-2xl leading-tight">Fale com a Ro sobre este imóvel.</h2>
              <p className="mt-3 text-sm text-primary-foreground/66">
                Mensagem pré-preenchida para agilizar o atendimento.
              </p>
              <Button asChild variant="luxury" size="lg" className="mt-5 w-full">
                <a href={whatsappLink(message)} target="_blank" rel="noreferrer">
                  <MessageCircle size={18} /> Tenho interesse
                </a>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Related ─── */}
      {related.length > 0 && (
        <section className="py-16 lg:py-20 bg-secondary/45">
          <div className="container space-y-8 px-6">
            <div className="space-y-3">
              <p className="text-xs uppercase tracking-[0.28em] text-accent">Relacionados</p>
              <h2 className="text-3xl text-foreground">Outras opções em {purposeLabel(property.purpose).toLowerCase()}</h2>
            </div>
            <div className="grid gap-8 md:grid-cols-2 xl:grid-cols-3">
              {related.map((item) => (
                <PropertyCard key={item.id} property={item} />
              ))}
            </div>
          </div>
        </section>
      )}

      <Footer />
    </div>
  );
}
