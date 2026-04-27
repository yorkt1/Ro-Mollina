import { Link } from "react-router-dom";
import { MessageCircle, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import SocialIcons from "@/components/SocialIcons";
import { whatsappLink } from "@/data/properties";
import { useLanguage } from "@/hooks/use-language";

const REALTOR_IMAGE =
  "https://res.cloudinary.com/dqewxdbfx/image/upload/v1776179725/48_98862-7634_80_x_80_cm_80_x_60_cm_mdjzw2.png";

export default function HeroSection() {
  const { t } = useLanguage();

  return (
    <section id="hero" className="relative overflow-hidden">

      {/* ─── MOBILE & TABLET: full background image ─── */}
      <div className="absolute inset-0 lg:hidden">
        <img
          src={REALTOR_IMAGE}
          alt=""
          aria-hidden="true"
          className="h-full w-full object-cover"
          style={{ objectPosition: "center 10%" }}
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(to bottom, rgba(15,23,42,0.72) 0%, rgba(15,23,42,0.82) 50%, rgba(15,23,42,0.92) 100%)",
          }}
        />
      </div>

      {/* ─── DESKTOP: light gradient background ─── */}
      <div
        className="absolute inset-0 hidden lg:block"
        style={{
          background:
            "linear-gradient(135deg, #ffffff 0%, #f7f8fc 35%, #eef1f8 65%, #e7ebf5 100%)",
        }}
      />

      {/* Subtle gold radial glow (desktop only) */}
      <div
        className="pointer-events-none absolute inset-0 z-0 hidden lg:block"
        style={{
          background:
            "radial-gradient(ellipse at 15% 70%, rgba(212,168,75,0.04) 0%, transparent 55%)",
        }}
      />

      {/* ─── CONTENT GRID ─── */}
      <div className="container relative z-10 mx-auto grid min-h-screen items-center gap-8 px-6 pt-24 pb-12 lg:grid-cols-2 lg:gap-12 lg:pt-28 lg:pb-16 xl:gap-20 xl:px-12">

        {/* ─── LEFT: text content ─── */}
        <div className="flex flex-col justify-center space-y-5 sm:space-y-6">

          {/* Name */}
          <div style={{ animation: "heroFadeUp 0.7s ease-out 0.18s both" }}>
            <h1
              className="font-serif leading-[0.92] tracking-tight text-white lg:text-slate-900"
              style={{ fontSize: "clamp(2.2rem, 4.5vw, 4.2rem)" }}
            >
              {t.heroTitle}
            </h1>
          </div>

          {/* Subtitle */}
          <div style={{ animation: "heroFadeUp 0.7s ease-out 0.28s both" }}>
            <h2 className="text-base font-light tracking-[0.08em] text-white/80 sm:text-lg md:text-xl lg:text-xl lg:text-slate-600">
              {t.heroSubtitle}
            </h2>
          </div>

          {/* CRECI badge */}
          <div
            className="inline-flex items-center gap-3"
            style={{ animation: "heroFadeUp 0.6s ease-out 0.36s both" }}
          >
            <span className="h-px w-8" style={{ background: "#d4a84b" }} />
            <span
              className="text-[10px] font-semibold uppercase tracking-[0.42em]"
              style={{ color: "#d4a84b" }}
            >
              {t.creci}
            </span>
          </div>

          {/* Gold divider */}
          <div
            className="h-px w-10"
            style={{
              background: "linear-gradient(to right, #d4a84b, transparent)",
              animation: "heroFadeUp 0.6s ease-out 0.42s both",
            }}
          />

          {/* Description */}
          <div style={{ animation: "heroFadeUp 0.7s ease-out 0.46s both" }}>
            <p className="max-w-sm text-[14px] leading-relaxed text-white/70 sm:text-[15px] lg:text-base lg:text-slate-500">
              {t.heroDescription}
            </p>
          </div>

          {/* CTAs */}
          <div
            className="flex flex-wrap items-center gap-3 pt-1"
            style={{ animation: "heroFadeUp 0.7s ease-out 0.52s both" }}
          >
            <Button
              asChild
              variant="luxury"
              size="lg"
              className="gap-2 shadow-[0_8px_28px_rgba(212,168,75,0.26)] hover:shadow-[0_12px_36px_rgba(212,168,75,0.36)]"
            >
              <Link to="/comprar">
                {t.viewProperties}
                <ArrowRight size={16} />
              </Link>
            </Button>

            <a
              href={whatsappLink()}
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-11 items-center gap-2 rounded border border-white/30 bg-white/10 px-5 text-sm font-medium text-white shadow-sm backdrop-blur-sm transition-all hover:border-[#d4a84b]/70 hover:text-[#d4a84b] lg:border-slate-300 lg:bg-white/80 lg:text-slate-700"
            >
              <MessageCircle size={16} />
              WhatsApp
            </a>
          </div>

          {/* Social icons */}
          <div style={{ animation: "heroFadeUp 0.7s ease-out 0.60s both" }}>
            <SocialIcons variant="light" />
          </div>
        </div>

        {/* ─── RIGHT: framed portrait (desktop only) ─── */}
        <div
          className="hidden lg:flex items-center justify-center"
          style={{ animation: "heroFadeUp 0.9s ease-out 0.3s both" }}
        >
          <div className="relative">
            {/* Outer decorative ring */}
            <div
              className="absolute -inset-4 rounded-3xl opacity-40"
              style={{
                background:
                  "linear-gradient(135deg, rgba(212,168,75,0.15), rgba(231,235,245,0.6))",
              }}
            />

            {/* Portrait frame */}
            <div
              className="relative overflow-hidden rounded-2xl border border-slate-200/70 bg-white shadow-2xl shadow-slate-300/40"
              style={{ width: "380px", height: "540px" }}
            >
              <img
                src={REALTOR_IMAGE}
                alt="Rosemarie Macedo Molina, corretora de imóveis"
                className="h-full w-full"
                style={{
                  objectFit: "cover",
                  objectPosition: "center 15%",
                }}
              />
              <div
                className="absolute bottom-0 left-0 right-0 h-24"
                style={{
                  background:
                    "linear-gradient(to top, rgba(255,255,255,0.25), transparent)",
                }}
              />
            </div>

            {/* Gold corner accents */}
            <div
              className="absolute -top-3 -left-3 h-6 w-6 rounded-tl-lg border-l-2 border-t-2"
              style={{ borderColor: "#d4a84b" }}
            />
            <div
              className="absolute -bottom-3 -right-3 h-6 w-6 rounded-br-lg border-b-2 border-r-2"
              style={{ borderColor: "#d4a84b" }}
            />
          </div>
        </div>
      </div>

      {/* Bottom gold accent line */}
      <div
        className="absolute bottom-0 left-0 right-0 z-10 h-px"
        style={{
          background:
            "linear-gradient(to right, transparent 0%, #d4a84b 35%, #d4a84b 65%, transparent 100%)",
          opacity: 0.22,
        }}
      />
    </section>
  );
}
