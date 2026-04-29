import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X, ChevronDown, Home, Building2, Waves, TreePine } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage, type Language } from "@/hooks/use-language";
import { whatsappLink, propertyTypeLabel } from "@/data/properties";
import { usePropertyTypes } from "@/hooks/use-property-types";
import { useDestinationLinks } from "@/hooks/use-destination-links";

/* ── Dropdown config ─────────────────────────── */
const buyItems = [
  { label: "Apartamentos", to: "/comprar?tipo=apartamento", icon: Building2 },
  { label: "Casas",        to: "/comprar?tipo=casa",        icon: Home       },
  { label: "Coberturas",   to: "/comprar?tipo=cobertura",   icon: Waves      },
  { label: "Terrenos",     to: "/comprar?tipo=terreno",     icon: TreePine   },
];

const rentItems = [
  { label: "Apartamentos", to: "/alugar?tipo=apartamento",  icon: Building2 },
  { label: "Casas",        to: "/alugar?tipo=casa",         icon: Home       },
  { label: "Coberturas",   to: "/alugar?tipo=cobertura",    icon: Waves      },
];

/* ── NavDropdown ─────────────────────────────── */
function NavDropdown({
  label,
  to,
  items,
  isActive,
}: {
  label: string;
  to: string;
  items: { label: string; to: string; icon: React.ElementType }[];
  isActive: boolean;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div
      ref={ref}
      className="relative"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`nav-link flex items-center gap-1 text-[13px] uppercase tracking-[0.2em] ${
          isActive ? "active text-foreground" : ""
        }`}
      >
        {label}
        <ChevronDown
          size={11}
          className={`transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>

      {/* Dropdown panel */}
      <div
        className={`absolute left-0 top-full z-50 min-w-[200px] overflow-hidden rounded-md border border-border bg-card shadow-xl shadow-slate-200/60 transition-all duration-200 ${
          open
            ? "pointer-events-auto translate-y-1 opacity-100"
            : "pointer-events-none translate-y-0 opacity-0"
        }`}
      >
        {/* Link to full page */}
        <Link
          to={to}
          className="flex items-center gap-2 border-b border-border px-4 py-3 text-[12px] uppercase tracking-[0.18em] text-accent transition-colors hover:bg-accent/10"
          onClick={() => setOpen(false)}
        >
          Ver todos
          <ChevronDown size={11} className="-rotate-90" />
        </Link>

        {items.map((item) => (
          <Link
            key={item.to}
            to={item.to}
            className="flex items-center gap-3 px-4 py-3 text-[13px] text-foreground/75 transition-colors hover:bg-accent/10 hover:text-foreground"
            onClick={() => setOpen(false)}
          >
            <item.icon size={14} className="text-accent/70 shrink-0" />
            {item.label}
          </Link>
        ))}
      </div>
    </div>
  );
}

/* ── Main Header ─────────────────────────────── */
export default function Header() {
  const [open, setOpen]       = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const location = useLocation();
  const { lang, setLang, t, languageLabels } = useLanguage();
  const langRef = useRef<HTMLDivElement>(null);
  const { data: propertyTypes = [] } = usePropertyTypes();
  const { data: destLinks = [] } = useDestinationLinks();

  // Helper to map links to icons
  const getLinkIcon = (name: string) => {
    const n = name.toLowerCase();
    if (n.includes("apartamento")) return Building2;
    if (n.includes("casa")) return Home;
    if (n.includes("cobertura")) return Waves;
    if (n.includes("terreno")) return TreePine;
    return Building2; // Default
  };

  // Derive menu items directly from Property Types
  const autoBuyItems = [
    { label: "Ver todos", to: "/comprar", icon: Home },
    ...propertyTypes.map(t => ({
      label: propertyTypeLabel(t.name),
      to: `/comprar/${t.name}`,
      icon: getLinkIcon(t.name)
    }))
  ];

  const autoRentItems = [
    { label: "Ver todos", to: "/alugar", icon: Building2 },
    ...propertyTypes.map(t => ({
      label: propertyTypeLabel(t.name),
      to: `/alugar/${t.name}`,
      icon: getLinkIcon(t.name)
    }))
  ];

  // Add custom links from database to dropdowns or main menu
  const customBuyItems = destLinks
    .filter(d => 
      d.path.startsWith("/comprar") && 
      !d.name.toLowerCase().includes("condominio") &&
      !d.name.toLowerCase().includes("condomínio")
    )
    .map(d => ({ label: d.name, to: d.path, icon: getLinkIcon(d.name) }));

  const customRentItems = destLinks
    .filter(d => 
      d.path.startsWith("/alugar") && 
      !d.name.toLowerCase().includes("condominio") &&
      !d.name.toLowerCase().includes("condomínio")
    )
    .map(d => ({ label: d.name, to: d.path, icon: getLinkIcon(d.name) }));

  const otherCustomLinks = destLinks.filter(d => 
    !d.path.startsWith("/comprar") && 
    !d.path.startsWith("/alugar") &&
    !d.name.toLowerCase().includes("condominio") &&
    !d.name.toLowerCase().includes("condomínio")
  );

  const finalBuyItems = [...autoBuyItems, ...customBuyItems];
  const finalRentItems = [...autoRentItems, ...customRentItems];

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 36);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => setOpen(false), [location.pathname]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (langRef.current && !langRef.current.contains(e.target as Node)) {
        setLangOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const isActive = (path: string) => location.pathname === path;

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-500 ${
        scrolled
          ? "bg-white/95 backdrop-blur-md shadow-[0_4px_20px_rgba(0,0,0,0.08)] border-b border-border"
          : "bg-white/70 backdrop-blur-sm"
      }`}
    >
      <nav className="container flex items-center justify-between px-6 py-4 lg:py-5">
        {/* Logo */}
        <Link
          to="/"
          className="font-serif text-xl tracking-wide text-foreground lg:text-2xl"
        >
          Ro Molina
        </Link>

        {/* ── Desktop nav ── */}
        <div className="hidden items-center gap-6 lg:flex">
          <ul className="flex items-center gap-6">
            {/* Início */}
            <li>
              <a
                href="/"
                className={`nav-link text-[13px] uppercase tracking-[0.2em] ${
                  isActive("/") ? "active text-foreground" : ""
                }`}
              >
                Início
              </a>
            </li>

            {/* Comprar — with dropdown */}
            <li>
              <NavDropdown
                label={t.buy}
                to="/comprar"
                items={finalBuyItems}
                isActive={isActive("/comprar")}
              />
            </li>

            {/* Alugar — with dropdown */}
            <li>
              <NavDropdown
                label={t.rent}
                to="/alugar"
                items={finalRentItems}
                isActive={isActive("/alugar")}
              />
            </li>

            {/* Sobre */}
            <li>
              <a
                href="/#sobre"
                className="nav-link text-[13px] uppercase tracking-[0.2em]"
              >
                Sobre
              </a>
            </li>

            {/* Contato */}
            <li>
              <a
                href="/#contato"
                className="nav-link text-[13px] uppercase tracking-[0.2em]"
              >
                Contato
              </a>
            </li>



            {/* Custom Links from Settings */}
            {otherCustomLinks.map((link) => (
              <li key={link.id}>
                <Link
                  to={link.path}
                  className={`nav-link text-[13px] uppercase tracking-[0.2em] ${
                    isActive(link.path) ? "active text-foreground" : ""
                  }`}
                >
                  {link.name}
                </Link>
              </li>
            ))}


          </ul>

          <div className="h-5 w-px bg-foreground/15" />

          <div className="flex items-center gap-4">
            <a
              href={whatsappLink("Olá! Gostaria de negociar meu imóvel com a Ro Molina.")}
              target="_blank"
              rel="noreferrer"
              className="text-[13px] uppercase tracking-[0.18em] text-accent transition-colors hover:text-gold-light"
            >
              {t.listProperty}
            </a>

            {/* Language Selector */}
            <div ref={langRef} className="relative">
              <button
                type="button"
                onClick={() => setLangOpen((v) => !v)}
                id="lang-selector-btn"
                className="flex items-center gap-1.5 rounded-sm border border-border bg-background px-3 py-1.5 text-[12px] uppercase tracking-[0.18em] text-foreground/70 transition-all hover:border-accent/60 hover:text-foreground"
              >
                <img src={languageLabels[lang].flag} alt={languageLabels[lang].label} className="h-4 w-5 rounded-[2px] object-cover" />
                <span>{languageLabels[lang].label}</span>
                <ChevronDown
                  size={12}
                  className={`transition-transform duration-200 ${langOpen ? "rotate-180" : ""}`}
                />
              </button>

              {langOpen && (
                <div className="absolute right-0 top-full mt-2 min-w-[140px] overflow-hidden rounded-sm border border-border bg-card shadow-xl">
                  {(["pt", "en", "es"] as Language[]).map((l) => (
                    <button
                      key={l}
                      type="button"
                      onClick={() => { setLang(l); setLangOpen(false); }}
                      className={`flex w-full items-center gap-2 px-4 py-2.5 text-left text-[12px] uppercase tracking-[0.15em] transition-colors hover:bg-accent/10 ${
                        lang === l
                          ? "text-accent"
                          : "text-foreground/70 hover:text-foreground"
                      }`}
                    >
                      <img src={languageLabels[l].flag} alt={languageLabels[l].label} className="h-4 w-5 rounded-[2px] object-cover" />
                      <span>{languageLabels[l].label}</span>
                      {lang === l && (
                        <span className="ml-auto h-1.5 w-1.5 rounded-full bg-accent" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>


          </div>
        </div>

        {/* Mobile hamburger */}
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="text-foreground lg:hidden"
          aria-label="Abrir menu"
        >
          {open ? <X size={24} /> : <Menu size={24} />}
        </button>
      </nav>

      {/* ── Mobile drawer ── */}
      {open && (
        <div className="border-t border-border bg-white/98 px-6 py-6 backdrop-blur-md lg:hidden">
          <div className="flex flex-col gap-1">
            <Link
              to="/"
              className="py-2.5 text-sm uppercase tracking-[0.2em] text-foreground/70 transition-colors hover:text-foreground"
              onClick={() => setOpen(false)}
            >
              Início
            </Link>

            {/* Comprar expandable */}
            <details className="group">
              <summary className="flex cursor-pointer list-none items-center justify-between py-2.5 text-sm uppercase tracking-[0.2em] text-foreground/70">
                {t.buy}
                <ChevronDown size={14} className="transition-transform group-open:rotate-180" />
              </summary>
              <div className="mt-1 flex flex-col gap-0.5 pl-4">
                {finalBuyItems.map((item) => (
                  <Link
                    key={item.to}
                    to={item.to}
                    className="py-2 text-[13px] text-foreground/55 hover:text-foreground"
                    onClick={() => setOpen(false)}
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </details>

            {/* Alugar expandable */}
            <details className="group">
              <summary className="flex cursor-pointer list-none items-center justify-between py-2.5 text-sm uppercase tracking-[0.2em] text-foreground/70">
                {t.rent}
                <ChevronDown size={14} className="transition-transform group-open:rotate-180" />
              </summary>
              <div className="mt-1 flex flex-col gap-0.5 pl-4">
                {finalRentItems.map((item) => (
                  <Link
                    key={item.to}
                    to={item.to}
                    className="py-2 text-[13px] text-foreground/55 hover:text-foreground"
                    onClick={() => setOpen(false)}
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </details>

            {/* Custom Mobile Links */}
            {otherCustomLinks.map((link) => (
              <Link
                key={link.id}
                to={link.path}
                className="py-2.5 text-sm uppercase tracking-[0.2em] text-foreground/70 transition-colors hover:text-foreground"
                onClick={() => setOpen(false)}
              >
                {link.name}
              </Link>
            ))}

            <a
              href="/#sobre"
              className="py-2.5 text-sm uppercase tracking-[0.2em] text-foreground/70 transition-colors hover:text-foreground"
              onClick={() => setOpen(false)}
            >
              Sobre
            </a>

            <a
              href="/#contato"
              className="py-2.5 text-sm uppercase tracking-[0.2em] text-foreground/70 transition-colors hover:text-foreground"
              onClick={() => setOpen(false)}
            >
              Contato
            </a>



            <a
              href={whatsappLink("Olá! Gostaria de negociar meu imóvel com a Ro Molina.")}
              target="_blank"
              rel="noreferrer"
              className="py-2.5 text-sm uppercase tracking-[0.2em] text-accent transition-colors hover:text-gold-light"
            >
              {t.listProperty}
            </a>

            {/* Mobile lang */}
            <div className="flex gap-2 pt-3">
              {(["pt", "en", "es"] as Language[]).map((l) => (
                <button
                  key={l}
                  type="button"
                  onClick={() => setLang(l)}
                  className={`flex items-center gap-1 rounded-sm border px-3 py-1.5 text-[11px] uppercase tracking-[0.15em] transition-colors ${
                    lang === l
                      ? "border-accent text-accent"
                      : "border-border text-foreground/60 hover:border-accent/40 hover:text-foreground"
                  }`}
                >
                  <img src={languageLabels[l].flag} alt={languageLabels[l].label} className="h-4 w-5 rounded-[2px] object-cover" />
                  <span>{languageLabels[l].label}</span>
                </button>
              ))}
            </div>


          </div>
        </div>
      )}
    </header>
  );
}
