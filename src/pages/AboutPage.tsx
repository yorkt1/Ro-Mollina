import type { ReactNode } from "react";
import {
  Award,
  BadgeCheck,
  Briefcase,
  GraduationCap,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  Instagram,
  Scale,
  Building2,
  Home,
  TreePine,
  BarChart3,
  FileSearch,
} from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import aboutImg from "@/assets/about-realtor.png";
import { whatsappLink } from "@/data/properties";
import { useScrollReveal } from "@/hooks/use-scroll-reveal";

/* ── Scroll‑reveal wrapper ── */
function Reveal({
  children,
  className = "",
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  const { ref, revealed } = useScrollReveal<HTMLDivElement>();
  return (
    <div
      ref={ref}
      className={`section-reveal ${revealed ? "revealed" : ""} ${className}`}
      style={{ transitionDelay: revealed ? `${delay}ms` : "0ms" }}
    >
      {children}
    </div>
  );
}

/* ── Credential badge ── */
function Badge({ icon: Icon, label }: { icon: React.ElementType; label: string }) {
  return (
    <div className="flex items-center gap-2.5 rounded-sm border border-accent/30 bg-accent/8 px-4 py-2.5">
      <Icon size={15} className="shrink-0 text-accent" />
      <span className="text-sm font-medium text-foreground">{label}</span>
    </div>
  );
}

/* ── Experience card ── */
function ExpCard({
  title,
  subtitle,
  period,
  bullets,
  delay = 0,
}: {
  title: string;
  subtitle: string;
  period: string;
  bullets: string[];
  delay?: number;
}) {
  return (
    <Reveal
      delay={delay}
      className="rounded-sm border border-border bg-card p-6 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md"
    >
      <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="text-base font-semibold text-foreground">{title}</h3>
          <p className="mt-0.5 text-sm text-accent">{subtitle}</p>
        </div>
        <span className="mt-1 shrink-0 rounded-sm bg-secondary px-3 py-1 text-xs text-muted-foreground sm:mt-0">
          {period}
        </span>
      </div>
      <ul className="mt-4 space-y-1.5">
        {bullets.map((b) => (
          <li key={b} className="flex items-start gap-2 text-sm leading-relaxed text-muted-foreground">
            <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-accent" />
            {b}
          </li>
        ))}
      </ul>
    </Reveal>
  );
}

/* ── Area chip ── */
function AreaChip({ icon: Icon, label }: { icon: React.ElementType; label: string }) {
  return (
    <div className="flex items-center gap-2 rounded-sm border border-border bg-card px-4 py-3 text-sm text-foreground transition-colors duration-200 hover:border-accent/50 hover:bg-accent/5">
      <Icon size={15} className="text-accent" />
      {label}
    </div>
  );
}

/* ── Main component ── */
export default function AboutPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* ── Hero banner ── */}
      <section className="relative overflow-hidden bg-background pt-28 pb-20 lg:pt-36 lg:pb-28">
        {/* Subtle dot pattern */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.035]"
          style={{
            backgroundImage:
              "radial-gradient(circle, hsl(var(--foreground)) 1px, transparent 1px)",
            backgroundSize: "32px 32px",
          }}
        />
        {/* Accent gradient blob */}
        <div className="pointer-events-none absolute -top-32 -right-32 h-96 w-96 rounded-full bg-accent/10 blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 -left-20 h-64 w-64 rounded-full bg-accent/8 blur-2xl" />

        <div className="container relative px-6">
          <div className="grid gap-12 lg:grid-cols-[1fr_360px] lg:items-center">
            {/* Text */}
            <div
              className="space-y-6"
              style={{ animation: "heroFadeUp 0.8s cubic-bezier(0.16,1,0.3,1) both" }}
            >
              <p className="text-xs uppercase tracking-[0.3em] text-accent">
                Corretora &amp; Avaliadora · CRECI/SC 72089F
              </p>
              <h1 className="text-4xl leading-[1.08] text-foreground lg:text-5xl xl:text-6xl">
                Rosemarie
                <br />
                <span className="italic text-accent">Macedo Molina</span>
              </h1>
              <p className="max-w-lg text-base leading-relaxed text-muted-foreground">
                Perita e Avaliadora Imobiliária Judicial e Extrajudicial.
                Laudos técnicos, avaliações mercadológicas e consultoria
                especializada na Grande Florianópolis.
              </p>

              {/* Credential badges */}
              <div className="flex flex-wrap gap-3 pt-2">
                <Badge icon={BadgeCheck} label="CRECI/SC 72089F" />
                <Badge icon={Award} label="CNAI 57385" />
                <Badge icon={Scale} label="Perita Judicial" />
              </div>

              {/* CTA buttons */}
              <div className="flex flex-wrap gap-3 pt-2">
                <Button asChild variant="luxury" size="lg">
                  <a href={whatsappLink()} target="_blank" rel="noreferrer">
                    <MessageCircle size={17} /> Falar no WhatsApp
                  </a>
                </Button>
                <Button asChild variant="crmSecondary" size="lg">
                  <a href="mailto:romolinaimoveis@gmail.com">
                    <Mail size={17} /> Enviar e-mail
                  </a>
                </Button>
              </div>
            </div>

            {/* Photo */}
            <div
              className="relative mx-auto w-full max-w-xs lg:max-w-none"
              style={{ animation: "heroFadeUp 0.8s 0.15s cubic-bezier(0.16,1,0.3,1) both" }}
            >
              <div className="absolute -inset-3 rounded-sm bg-accent/15 blur-sm" />
              <img
                src={aboutImg}
                alt="Rosemarie Macedo Molina — Corretora e Avaliadora de Imóveis"
                className="relative rounded-sm object-cover shadow-xl"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ── Objetivo profissional ── */}
      <section className="py-20 lg:py-28">
        <div className="container px-6">
          <Reveal className="mx-auto max-w-3xl text-center space-y-5">
            <p className="text-xs uppercase tracking-[0.28em] text-accent">Objetivo Profissional</p>
            <h2 className="text-3xl text-foreground lg:text-4xl">
              Avaliação com precisão técnica e visão de mercado
            </h2>
            <p className="text-base leading-relaxed text-muted-foreground">
              Atuar como Perita e Avaliadora Imobiliária Judicial e Extrajudicial,
              realizando avaliações mercadológicas, análises técnicas e elaboração de
              pareceres e laudos imobiliários, com foco em imóveis residenciais,
              comerciais, terrenos e empreendimentos na região de Florianópolis e
              Grande Florianópolis.
            </p>
            <div className="gold-divider mx-auto" />
          </Reveal>
        </div>
      </section>

      {/* ── Resumo profissional ── */}
      <section className="py-20 lg:py-28 bg-secondary/45">
        <div className="container px-6">
          <div className="grid gap-12 lg:grid-cols-[1fr_1fr] lg:items-center">
            <Reveal>
              <p className="text-xs uppercase tracking-[0.28em] text-accent">Resumo Profissional</p>
              <h2 className="mt-4 text-3xl text-foreground lg:text-4xl">
                Ampla experiência imobiliária, comercial e técnica
              </h2>
            </Reveal>
            <Reveal delay={100}>
              <p className="text-base leading-relaxed text-muted-foreground">
                Profissional com ampla experiência nas áreas imobiliária, comercial e
                técnica, atuando como corretora e avaliadora de imóveis em
                Florianópolis/SC. Possui vivência em avaliação imobiliária,
                intermediação de imóveis, análise de mercado, documentação imobiliária
                e atendimento consultivo a clientes e investidores.
              </p>
              <p className="mt-4 text-base leading-relaxed text-muted-foreground">
                Conta também com experiência anterior na área de edificações,
                decoração e acompanhamento de projetos para hotelaria e
                empreendimentos, desenvolvendo visão técnica e prática sobre imóveis,
                construções e valorização patrimonial.
              </p>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ── Experiência profissional ── */}
      <section className="py-20 lg:py-28">
        <div className="container px-6 space-y-10">
          <Reveal className="text-center space-y-3">
            <p className="text-xs uppercase tracking-[0.28em] text-accent">Trajetória</p>
            <h2 className="text-3xl text-foreground lg:text-4xl">Experiência Profissional</h2>
          </Reveal>

          <div className="grid gap-6 lg:grid-cols-3">
            <ExpCard
              title="Corretora e Avaliadora de Imóveis"
              subtitle="Autônoma · Florianópolis/SC e Região"
              period="2024 – Atual"
              bullets={[
                "Intermediação de compra, venda e locação de imóveis",
                "Avaliação mercadológica de imóveis urbanos",
                "Estudos comparativos de mercado imobiliário",
                "Atendimento a clientes e investidores",
                "Análise documental imobiliária",
              ]}
              delay={0}
            />
            <ExpCard
              title="Representação Comercial"
              subtitle="Segmento Fitness e Bem-Estar · Brasil"
              period="2004 – Atual"
              bullets={[
                "Atuação comercial e consultiva",
                "Foco em empresas do segmento fitness e saúde",
                "Desenvolvimento de carteira de clientes nationwide",
              ]}
              delay={80}
            />
            <ExpCard
              title="Decoração e Projetos para Hotelaria"
              subtitle="Banco Real / Rede Transamérica · São Paulo/SP"
              period="Anterior"
              bullets={[
                "Projetos ligados à decoração de hotéis e flats",
                "Acompanhamento de aprovações e desenvolvimento de projetos",
                "Visão técnica sobre construções e valorização patrimonial",
              ]}
              delay={160}
            />
          </div>
        </div>
      </section>

      {/* ── Formação & Registros ── */}
      <section className="py-20 lg:py-28 bg-secondary/45">
        <div className="container px-6">
          <div className="grid gap-12 lg:grid-cols-2">
            {/* Formação */}
            <Reveal>
              <p className="text-xs uppercase tracking-[0.28em] text-accent">Formação</p>
              <h2 className="mt-3 text-2xl text-foreground lg:text-3xl">
                <GraduationCap size={22} className="inline mr-2 text-accent" />
                Educação
              </h2>
              <div className="mt-6 space-y-4">
                {[
                  {
                    course: "Curso Técnico em Edificações",
                    school: "Liceu de Artes e Ofícios – São Paulo/SP",
                  },
                  {
                    course: "Curso Técnico em Transações Imobiliárias (TTI)",
                    school: "Formação profissional imobiliária",
                  },
                  {
                    course: "Curso de Avaliação Imobiliária",
                    school: "Especialização técnica em avaliações",
                  },
                ].map((item) => (
                  <div
                    key={item.course}
                    className="flex gap-4 rounded-sm border border-border bg-card px-5 py-4"
                  >
                    <div className="mt-0.5 h-2 w-2 shrink-0 rounded-full bg-accent" />
                    <div>
                      <p className="text-sm font-medium text-foreground">{item.course}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">{item.school}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Reveal>

            {/* Registros */}
            <Reveal delay={100}>
              <p className="text-xs uppercase tracking-[0.28em] text-accent">Registros</p>
              <h2 className="mt-3 text-2xl text-foreground lg:text-3xl">
                <Briefcase size={22} className="inline mr-2 text-accent" />
                Credenciais Oficiais
              </h2>
              <div className="mt-6 space-y-4">
                {[
                  {
                    label: "CRECI/SC 72089F",
                    desc: "Conselho Regional de Corretores de Imóveis de Santa Catarina",
                  },
                  {
                    label: "CNAI 57385",
                    desc: "Cadastro Nacional de Avaliadores Imobiliários — COFECI",
                  },
                  {
                    label: "Perita Judicial e Extrajudicial",
                    desc: "Habilitada para elaboração de laudos periciais e PTAMs",
                  },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="flex gap-4 rounded-sm border border-border bg-card px-5 py-4"
                  >
                    <BadgeCheck size={16} className="mt-0.5 shrink-0 text-accent" />
                    <div>
                      <p className="text-sm font-semibold text-foreground">{item.label}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ── Áreas de atuação ── */}
      <section className="py-20 lg:py-28">
        <div className="container px-6 space-y-10">
          <Reveal className="text-center space-y-3">
            <p className="text-xs uppercase tracking-[0.28em] text-accent">Especialidades</p>
            <h2 className="text-3xl text-foreground lg:text-4xl">Áreas de Atuação</h2>
            <p className="mx-auto max-w-2xl text-base text-muted-foreground">
              Expertise consolidada em avaliações imobiliárias, laudos técnicos e
              intermediações de alto padrão na região metropolitana de Florianópolis.
            </p>
          </Reveal>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <AreaChip icon={Scale}       label="Avaliação judicial e extrajudicial" />
            <AreaChip icon={Home}        label="Imóveis residenciais" />
            <AreaChip icon={Building2}   label="Imóveis comerciais" />
            <AreaChip icon={TreePine}    label="Terrenos urbanos" />
            <AreaChip icon={BarChart3}   label="Estudos de mercado imobiliário" />
            <AreaChip icon={FileSearch}  label="PTAM — Parecer Técnico Mercadológico" />
          </div>
        </div>
      </section>

      {/* ── Região ── */}
      <section className="py-20 lg:py-28 bg-[hsl(var(--navy-deep))]">
        <div className="container px-6">
          <div className="grid gap-10 lg:grid-cols-[1fr_auto] lg:items-center">
            <Reveal className="space-y-4 text-white">
              <p className="text-xs uppercase tracking-[0.3em] text-accent">Cobertura geográfica</p>
              <h2 className="text-3xl text-white lg:text-4xl">Região de Atuação</h2>
              <p className="max-w-xl text-base leading-relaxed text-white/70">
                Florianópolis/SC, São José/SC, Palhoça/SC, Biguaçu/SC e região
                metropolitana — com profundo conhecimento do mercado local para
                avaliações precisas e fundamentadas.
              </p>
              <div className="flex flex-wrap gap-2 pt-2">
                {["Florianópolis", "São José", "Palhoça", "Biguaçu", "Grande Florianópolis"].map(
                  (city) => (
                    <span
                      key={city}
                      className="flex items-center gap-1.5 rounded-sm border border-white/15 bg-white/8 px-3 py-1.5 text-sm text-white/80"
                    >
                      <MapPin size={12} className="text-accent" />
                      {city}
                    </span>
                  )
                )}
              </div>
            </Reveal>

            {/* Contact card */}
            <Reveal
              delay={100}
              className="w-full rounded-sm border border-white/10 bg-white/6 p-6 backdrop-blur-sm lg:w-80"
            >
              <p className="text-xs uppercase tracking-[0.24em] text-accent">Contato direto</p>
              <h3 className="mt-3 text-xl text-white">Fale com Ro Molina</h3>

              <div className="mt-5 space-y-3">
                <a
                  href={whatsappLink()}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-3 text-sm text-white/75 transition-colors hover:text-white"
                >
                  <Phone size={15} className="text-accent" />
                  (48) 98862-7634
                </a>
                <a
                  href="mailto:romolinaimoveis@gmail.com"
                  className="flex items-center gap-3 text-sm text-white/75 transition-colors hover:text-white"
                >
                  <Mail size={15} className="text-accent" />
                  romolinaimoveis@gmail.com
                </a>
                <a
                  href="https://www.instagram.com/romolina.imoveis"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-3 text-sm text-white/75 transition-colors hover:text-white"
                >
                  <Instagram size={15} className="text-accent" />
                  @romolina.imoveis
                </a>
              </div>

              <Button asChild variant="luxury" size="lg" className="mt-6 w-full">
                <a href={whatsappLink()} target="_blank" rel="noreferrer">
                  <MessageCircle size={16} /> WhatsApp
                </a>
              </Button>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ── Back to home ── */}
      <section className="py-12 text-center">
        <Link
          to="/"
          className="text-sm uppercase tracking-[0.2em] text-accent transition-colors hover:text-foreground"
        >
          ← Voltar ao início
        </Link>
      </section>

      <Footer />
    </div>
  );
}
