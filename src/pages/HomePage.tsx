import { useState, type ReactNode } from "react";
import { ArrowRight, ChevronLeft, ChevronRight, Loader2, MessageCircle, Play } from "lucide-react";
import { Link } from "react-router-dom";
// hero background is now a CSS gradient — no image import needed
import aboutImg from "@/assets/about-realtor.webp";
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
import { getHighlightStorefrontLink } from "@/lib/storefront-filters";
import { cloudinaryUrl } from "@/lib/cloudinary";
import SEO from "@/components/SEO";

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

// Sem fallback de vídeos — se o Supabase estiver vazio, a seção fica oculta.
// Cadastre os vídeos reais pelo painel admin (/admin/youtube).
const fallbackYouTubeVideos: { youtube_id: string; title: string; thumbnail: string }[] = [];

export default function HomePage() {
  const { data: properties = [], isLoading } = useProperties();
  const { data: highlights = [] } = useLifestyleHighlights();
  const { data: youtubeVideos = [], error: youtubeError } = useYouTubeVideos();

  const opportunities = properties.filter((p) => p.opportunity);
  const saleProperties = properties.filter(
    (p) => p.purpose === "venda" && p.featured && !p.exclusive,
  );
  const rentProperties = properties.filter(
    (p) => p.purpose === "aluguel" && p.featured,
  );
  const exclusives = properties.filter((p) => p.exclusive);

  const displayHighlights = highlights.map((h) => ({
    image: h.image,
    title: h.title,
    description: h.description,
    link: getHighlightStorefrontLink(h.title, h.link),
  }));

  const displayVideos = (!youtubeError && youtubeVideos.length > 0)
    ? youtubeVideos.map((v) => ({ youtube_id: v.youtube_id, title: v.title, thumbnail: v.thumbnail }))
    : fallbackYouTubeVideos;

  const homeJsonLd = [
    {
      "@type": "RealEstateAgent",
      name: "Ro Molina Imóveis",
      url: "https://romolinaimoveis.com.br",
      logo: "https://romolinaimoveis.com.br/og-image.png",
      description:
        "Corretora de imóveis de alto padrão na Grande Florianópolis — compra, venda e locação com atendimento personalizado.",
      areaServed: "Florianópolis, SC, Brasil",
      address: {
        "@type": "PostalAddress",
        addressLocality: "Florianópolis",
        addressRegion: "SC",
        addressCountry: "BR",
      },
      contactPoint: {
        "@type": "ContactPoint",
        telephone: "+55-48-98862-7634",
        contactType: "customer service",
        availableLanguage: "Portuguese",
      },
      sameAs: ["https://www.instagram.com/ro.molina.imoveis", "https://www.youtube.com/@RoMolinaImoveis"],
    },
    {
      "@type": "Person",
      name: "Ro Molina",
      jobTitle: "Corretora de Imóveis",
      worksFor: { "@type": "Organization", name: "Ro Molina Imóveis" },
      hasCredential: "CRECI-SC 72089F",
      address: {
        "@type": "PostalAddress",
        addressLocality: "Florianópolis",
        addressRegion: "SC",
        addressCountry: "BR",
      },
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <SEO url="/" jsonLd={homeJsonLd} />
      <Header />

      {/* ─── Hero Section ─── */}
      <HeroSection />

      {/* ─── Search Section ─── */}
      <SearchSection />

      {/* ─── Lifestyle Categories ─── */}
      {displayHighlights.length > 0 && (
        <RevealSection className="py-20 lg:py-28">
          <div className="container space-y-8 px-6">
            <SectionHeading
              eyebrow="Categorias"
              title="Encontre o imóvel certo para você"
              description="Apartamentos, casas, coberturas e terrenos — cada categoria com curadoria exclusiva para o seu perfil."
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
      )}

      {/* Property lead capture CTA */}
      <RevealSection className="bg-[hsl(var(--navy-deep))] py-14 text-white lg:py-16">
        <div className="container px-6">
          <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
            <div className="space-y-4">
              <p className="text-xs uppercase tracking-[0.28em] text-accent">
                Negocie seu imóvel
              </p>
              <h2 className="max-w-3xl text-3xl leading-tight text-white md:text-4xl">
                Quer vender ou alugar seu imóvel com estratégia?
              </h2>
              <p className="max-w-2xl text-base leading-relaxed text-white/70">
                Envie seus dados e conte um pouco sobre o imóvel. Ro Molina entrará em
                contato para entender seu objetivo e orientar os próximos passos.
              </p>
            </div>

            <Button asChild variant="luxury" size="lg">
              <Link to="/negocie-seu-imovel">
                Quero anunciar meu imóvel <ArrowRight size={17} />
              </Link>
            </Button>
          </div>
        </div>
      </RevealSection>

      {/* ─── Loading State ─── */}
      {isLoading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-10 w-10 animate-spin text-accent" />
        </div>
      )}

      {/* Vitrine de oportunidades */}
      {!isLoading && opportunities.length > 0 && (
        <RevealSection className="bg-[hsl(var(--navy-deep))] py-20 lg:py-28">
          <div className="container space-y-10 px-6">
            <SectionHeading
              eyebrow="Oportunidades"
              title="Imóveis com condições e potencial diferenciados."
              description="Uma vitrine atualizada diretamente pelo painel, reunindo oportunidades de venda e locação sem depender de categoria."
              isDark={true}
              action={
                <Button asChild variant="luxury">
                  <Link to="/imoveis?vitrine=oportunidades">
                    Ver oportunidades <ArrowRight size={14} />
                  </Link>
                </Button>
              }
            />

            <PaginatedGrid items={opportunities} sectionKey="opportunities" />
          </div>
        </RevealSection>
      )}

      {/* Imóveis em destaque para venda */}
      {!isLoading && saleProperties.length > 0 && (
        <RevealSection className="py-20 lg:py-28 bg-secondary/45">
          <div className="container space-y-10 px-6">
            <SectionHeading
              eyebrow="Imóveis à Venda"
              title="Imóveis selecionados para viver e investir bem."
              description="Imóveis selecionados com foco em moradia, patrimônio e oportunidades reais de valorização."
              action={
                <Button asChild variant="crmSecondary">
                  <Link to="/comprar?vitrine=destaques">
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
              title="Locações selecionadas com atendimento personalizado."
              description="Atendimento próximo e locações selecionadas para quem busca praticidade, segurança e boa experiência."
              action={
                <Button asChild variant="crmSecondary">
                  <Link to="/alugar?vitrine=destaques">
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
        <RevealSection className="py-20 lg:py-28 bg-[hsl(var(--navy-deep))]">
          <div className="container space-y-10 px-6">
            <SectionHeading
              eyebrow="Exclusividades"
              title="Imóveis selecionados e oportunidades diferenciadas."
              description="Imóveis com potencial, exclusividade e atendimento consultivo."
              isDark={true}
            />

            <PaginatedGrid items={exclusives} sectionKey="exclusive" />
          </div>
        </RevealSection>
      )}

      {/* ─── YouTube Section — só aparece quando há vídeos cadastrados no Supabase ─── */}
      {displayVideos.length > 0 && <RevealSection className="py-20 lg:py-28 bg-secondary/45">
        <div className="container space-y-10 px-6">
          <SectionHeading
            eyebrow="Molina no YouTube"
            title="Imóveis, oportunidades e experiências em Florianópolis."
            description="Acompanhe tours exclusivos, dicas de mercado e as melhores oportunidades em vídeo."
            align="center"
          />

          <div className="grid gap-6 md:grid-cols-3">
            {displayVideos.map((video, index) => {
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
                  className="group relative block overflow-hidden rounded-sm bg-card transition-all duration-300 hover:shadow-lg"
                >
                  <div className="relative aspect-video overflow-hidden">
                    <img
                      src={cloudinaryUrl(video.thumbnail, { width: 800, crop: "limit" })}
                      alt={video.title}
                      className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                      loading="lazy"
                      decoding="async"
                      onError={(e) => {
                        const img = e.currentTarget;
                        if (img.src.includes("maxresdefault")) {
                          img.src = img.src.replace("maxresdefault", "hqdefault");
                        }
                      }}
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-foreground/10 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent/90 text-primary shadow-xl backdrop-blur-sm transition-transform duration-300 group-hover:scale-110">
                        <Play size={20} className="ml-1" fill="currentColor" />
                      </div>
                    </div>
                  </div>
                  <div className="p-4 border-t border-border/50">
                    <p className="font-serif text-sm font-medium leading-snug text-foreground line-clamp-2 transition-colors group-hover:text-accent">
                      {video.title}
                    </p>
                  </div>
                </a>
              );
            })}
          </div>

          <div className="flex justify-center pt-4">
            <Button asChild variant="minimal" className="px-8">
              <a href="https://www.youtube.com/@RoMolinaImoveis" target="_blank" rel="noreferrer">
                Ver canal no YouTube
              </a>
            </Button>
          </div>
        </div>
      </RevealSection>}

      {/* ─── About ─── */}
      <RevealSection className="py-20 lg:py-28" id="sobre">
        <div className="container grid gap-12 px-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div className="relative mx-auto w-full max-w-sm">
            <div className="absolute -inset-4 rounded-sm bg-accent/10" />
            <img
              src={aboutImg}
              alt="Ro Molina, corretora de imóveis"
              className="relative mx-auto w-full max-w-sm rounded-sm shadow-xl"
              loading="lazy"
              decoding="async"
            />
          </div>

          <div className="space-y-6">
            <SectionHeading
              eyebrow="Sobre a corretora"
              title="Mais do que vender imóveis, conectar pessoas às escolhas certas."
              description="Ro Molina atua na Grande Florianópolis com foco em imóveis, patrimônio, avaliação imobiliária e atendimento personalizado para compra, venda e locação."
            />
            <p className="max-w-2xl text-base leading-relaxed text-muted-foreground">
              Com atuação voltada à estratégia patrimonial, experiência do cliente e apresentação cuidadosa dos imóveis, Ro Molina oferece um atendimento próximo, consultivo e profissional.
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
          <div className="grid gap-8 rounded-sm border border-border bg-card p-8 lg:grid-cols-[1fr_auto] lg:items-center lg:p-12">
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
