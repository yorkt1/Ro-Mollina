import { useState, type ReactNode } from "react";
import { ArrowRight, ChevronLeft, ChevronRight, Loader2, MessageCircle, Play } from "lucide-react";
import { Link } from "react-router-dom";
// hero background is now a CSS gradient — no image import needed
import aboutImg from "@/assets/about-realtor.png";
import property1 from "@/assets/property-1.jpg";
import property2 from "@/assets/property-2.jpg";
import property3 from "@/assets/property-3.jpg";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import HeroSection from "@/components/HeroSection";
import SearchSection from "@/components/SearchSection";
import LifestyleCard from "@/components/LifestyleCard";
import PropertyCard from "@/components/PropertyCard";
import SectionHeading from "@/components/SectionHeading";
import { Button } from "@/components/ui/button";
import { whatsappLink, type Property } from "@/data/properties";
import { useProperties } from "@/hooks/use-properties";
import { useLifestyleHighlights } from "@/hooks/use-highlights";
import { useYouTubeVideos } from "@/hooks/use-youtube-videos";
import { useScrollReveal } from "@/hooks/use-scroll-reveal";

function RevealSection({ children, className = "", id }: { children: ReactNode; className?: string; id?: string }) {
  const { ref, revealed } = useScrollReveal<HTMLElement>();
  return (
    <section ref={ref} id={id} className={`section-reveal ${revealed ? "revealed" : ""} ${className}`}>
      {children}
    </section>
  );
}

const ITEMS_PER_PAGE = 16;

function PaginatedGrid({ items, sectionKey }: { items: Property[]; sectionKey: string }) {
  const [page, setPage] = useState(1);
  const totalPages = Math.ceil(items.length / ITEMS_PER_PAGE);
  const paginated = items.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  return (
    <>
      <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {paginated.map((property) => (
          <PropertyCard key={property.id} property={property} />
        ))}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-8">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="flex h-10 w-10 items-center justify-center rounded-sm border border-border bg-card text-foreground transition-colors hover:bg-accent hover:text-primary disabled:opacity-40"
          >
            <ChevronLeft size={18} />
          </button>

          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <button
              key={`${sectionKey}-page-${p}`}
              onClick={() => setPage(p)}
              className={`flex h-10 w-10 items-center justify-center rounded-sm border text-sm font-medium transition-colors ${
                p === page
                  ? "border-accent bg-accent text-primary"
                  : "border-border bg-card text-foreground hover:border-accent/50"
              }`}
            >
              {p}
            </button>
          ))}

          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="flex h-10 w-10 items-center justify-center rounded-sm border border-border bg-card text-foreground transition-colors hover:bg-accent hover:text-primary disabled:opacity-40"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      )}
    </>
  );
}

/* ── Fallback data for when Supabase tables are empty ── */

const fallbackHighlights = [
  {
    image: property1,
    title: "Mobiliados",
    description: "Apartamentos mobiliados prontos para morar com conforto e sofisticação.",
    link: "/comprar",
  },
  {
    image: property2,
    title: "Alto Padrão",
    description: "Residências de alto luxo nos melhores bairros de Santa Catarina.",
    link: "/comprar",
  },
  {
    image: property3,
    title: "Coberturas",
    description: "Coberturas com vista panorâmica, terraço privativo e design impecável.",
    link: "/comprar",
  },
];

const fallbackYouTubeVideos = [
  {
    youtube_id: "dQw4w9WgXcQ",
    title: "Tour Apartamento Alto Padrão - Tatuapé",
    thumbnail: property1,
  },
  {
    youtube_id: "dQw4w9WgXcQ",
    title: "Casa Conceito Aberto - Vila Carrão",
    thumbnail: property2,
  },
  {
    youtube_id: "dQw4w9WgXcQ",
    title: "Cobertura Duplex com Piscina - Anália Franco",
    thumbnail: property3,
  },
];

export default function HomePage() {
  const { data: properties = [], isLoading } = useProperties();
  const { data: highlights = [], error: highlightsError } = useLifestyleHighlights();
  const { data: youtubeVideos = [], error: youtubeError } = useYouTubeVideos();

  const saleProperties = properties.filter((p) => p.purpose === "venda" && !p.exclusive);
  const rentProperties = properties.filter((p) => p.purpose === "aluguel");
  const exclusives = properties.filter((p) => p.exclusive);

  // Use Supabase data if available (no error + has items), otherwise fallback to hardcoded
  const displayHighlights = (!highlightsError && highlights.length > 0)
    ? highlights.map((h) => ({ image: h.image, title: h.title, description: h.description, link: h.link }))
    : fallbackHighlights;

  const displayVideos = (!youtubeError && youtubeVideos.length > 0)
    ? youtubeVideos.map((v) => ({ youtube_id: v.youtube_id, title: v.title, thumbnail: v.thumbnail }))
    : fallbackYouTubeVideos;

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* ─── Hero Section ─── */}
      <HeroSection />

      {/* ─── Search Section ─── */}
      <SearchSection />

      {/* ─── Lifestyle Categories ─── */}
      <RevealSection className="py-20 lg:py-28">
        <div className="container space-y-8 px-6">
          <SectionHeading
            eyebrow="Explore"
            title="Imóveis para seu estilo de vida"
            description="Encontre o que combina com você: imóveis mobiliados, alto padrão e coberturas exclusivas."
            align="center"
          />

          <div className="grid gap-6 md:grid-cols-3">
            {displayHighlights.map((item, index) => (
              <LifestyleCard
                key={index}
                image={item.image}
                title={item.title}
                description={item.description}
                to={item.link}
              />
            ))}
          </div>
        </div>
      </RevealSection>

      {/* ─── Loading State ─── */}
      {isLoading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-10 w-10 animate-spin text-accent" />
        </div>
      )}

      {/* ─── Sale Highlights ─── */}
      {!isLoading && saleProperties.length > 0 && (
        <RevealSection className="py-20 lg:py-28 bg-secondary/45">
          <div className="container space-y-10 px-6">
            <SectionHeading
              eyebrow="Imóveis à Venda"
              title="Curadoria para quem busca comprar bem"
              description="Seleção orientada para patrimônio, moradia e investimento com alto valor percebido."
              action={
                <Button asChild variant="crmSecondary">
                  <Link to="/comprar">
                    Ver todos <ArrowRight size={14} />
                  </Link>
                </Button>
              }
            />

            <PaginatedGrid items={saleProperties} sectionKey="sale" />
          </div>
        </RevealSection>
      )}

      {/* ─── Rental Highlights ─── */}
      {!isLoading && rentProperties.length > 0 && (
        <RevealSection className="py-20 lg:py-28">
          <div className="container space-y-10 px-6">
            <SectionHeading
              eyebrow="Imóveis para Locação"
              title="Locações premium com resposta rápida"
              description="Experiência fluida para clientes executivos, famílias e perfis que precisam de agilidade com padrão elevado."
              action={
                <Button asChild variant="crmSecondary">
                  <Link to="/alugar">
                    Explorar aluguéis <ArrowRight size={14} />
                  </Link>
                </Button>
              }
            />

            <PaginatedGrid items={rentProperties} sectionKey="rent" />
          </div>
        </RevealSection>
      )}

      {/* ─── Exclusividades ─── */}
      {!isLoading && exclusives.length > 0 && (
        <RevealSection className="py-20 lg:py-28 bg-navy-deep">
          <div className="container space-y-10 px-6">
            <SectionHeading
              eyebrow="Exclusividades"
              title="Imóveis com selo de exclusividade"
              description="Oportunidades únicas negociadas diretamente, com condições especiais e atendimento diferenciado."
              isDark={true}
            />

            <PaginatedGrid items={exclusives} sectionKey="exclusive" />
          </div>
        </RevealSection>
      )}

      {/* ─── YouTube Section ─── */}
      <RevealSection className="py-20 lg:py-28 bg-secondary/45">
        <div className="container space-y-10 px-6">
          <SectionHeading
            eyebrow="Molina no YouTube"
            title="Os Melhores Imóveis de Santa Catarina"
            description="Acompanhe tours exclusivos, dicas de mercado e as melhores oportunidades em vídeo."
            align="center"
          />

          <div className="grid gap-6 md:grid-cols-3">
            {displayVideos.map((video, index) => {
              // Extract just the video ID in case the field contains a full URL
              const ytIdMatch = video.youtube_id.match(
                /(?:v=|youtu\.be\/|embed\/)([A-Za-z0-9_-]{11})/,
              );
              const ytId = ytIdMatch ? ytIdMatch[1] : video.youtube_id;
              return (
              <a
                key={index}
                href={`https://www.youtube.com/watch?v=${ytId}`}
                target="_blank"
                rel="noreferrer"
                className="group relative block overflow-hidden rounded-sm bg-card card-hover"
              >
                <div className="relative aspect-video overflow-hidden">
                  <img
                    src={video.thumbnail}
                    alt={video.title}
                    className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-foreground/30 transition-colors group-hover:bg-foreground/40">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-accent text-primary shadow-lg transition-transform group-hover:scale-110">
                      <Play size={28} className="ml-1" />
                    </div>
                  </div>
                </div>
                <div className="p-4">
                  <p className="font-serif text-sm font-semibold text-foreground line-clamp-2">{video.title}</p>
                </div>
              </a>
              );
            })}
          </div>
        </div>
      </RevealSection>

      {/* ─── About ─── */}
      <RevealSection className="py-20 lg:py-28">
        <div className="container grid gap-12 px-6 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
          <div className="relative mx-auto w-full max-w-md">
            <div className="absolute -inset-4 rounded-sm bg-accent/10" />
            <img
              src={aboutImg}
              alt="Ro Molina, corretora de imóveis"
              className="relative mx-auto w-full max-w-md rounded-sm shadow-[0_20px_50px_hsl(var(--foreground)/0.1)]"
              loading="lazy"
            />
          </div>

          <div className="space-y-6">
            <SectionHeading
              eyebrow="Sobre a corretora"
              title="Presença sofisticada, atendimento próximo e posicionamento forte."
              description="Ro Molina atua com imóveis de alto padrão em Santa Catarina, unindo atendimento humano, apresentação cuidadosa e inteligência comercial para venda e locação."
            />
            <p className="max-w-2xl text-base leading-relaxed text-muted-foreground">
              Com experiência consolidada no mercado imobiliário de Florianópolis, Ro Molina é referência em consultoria para compra, venda e locação de imóveis premium na ilha.
            </p>
            <Button asChild variant="luxury" size="lg">
              <a href={whatsappLink()} target="_blank" rel="noreferrer">
                <MessageCircle size={18} /> Falar com Ro Molina
              </a>
            </Button>
          </div>
        </div>
      </RevealSection>

      {/* ─── Contact CTA ─── */}
      <RevealSection className="py-20 lg:py-28 bg-secondary/45" id="contato">
        <div className="container px-6">
          <div className="grid gap-8 rounded-sm border border-border bg-card p-8 shadow-[0_18px_44px_hsl(var(--foreground)/0.06)] lg:grid-cols-[1fr_auto] lg:items-center lg:p-12">
            <div className="space-y-4">
              <p className="text-xs uppercase tracking-[0.28em] text-accent">Contato</p>
              <h2 className="text-3xl leading-tight text-foreground md:text-4xl">Encontrou o imóvel ideal?</h2>
              <p className="max-w-2xl text-base leading-relaxed text-muted-foreground">
                Fale diretamente no WhatsApp para agendar visitas, tirar dúvidas ou receber uma curadoria personalizada.
              </p>
            </div>

            <Button asChild variant="luxury" size="lg">
              <a href={whatsappLink()} target="_blank" rel="noreferrer">
                <MessageCircle size={18} /> Falar no WhatsApp
              </a>
            </Button>
          </div>
        </div>
      </RevealSection>

      <Footer />
    </div>
  );
}
