import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { properties, propertyTypeLabel, publicLocations, type PropertyPurpose, type PropertyType } from "@/data/properties";

interface HeroSearchFormProps {
  variant?: "dark" | "light";
}

export default function HeroSearchForm({ variant = "light" }: HeroSearchFormProps) {
  const navigate = useNavigate();
  const [purpose, setPurpose] = useState<PropertyPurpose>("venda");
  const [type, setType] = useState<string>("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [location, setLocation] = useState("");
  const [reference, setReference] = useState(false);
  const [refCode, setRefCode] = useState("");

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (type) params.set("tipo", type);
    if (location) params.set("bairro", location);
    if (minPrice) params.set("min", minPrice.replace(/\D/g, ""));
    if (maxPrice) params.set("max", maxPrice.replace(/\D/g, ""));
    const route = purpose === "venda" ? "/comprar" : "/alugar";
    navigate(`${route}${params.toString() ? `?${params}` : ""}`);
  };

  const handleRefSearch = () => {
    if (!refCode.trim()) return;
    const found = properties.find(
      (p) => p.id === refCode.trim() || p.title.toLowerCase().includes(refCode.trim().toLowerCase())
    );
    if (found) {
      navigate(`/imoveis/${found.id}`);
    } else {
      navigate(`/imoveis?search=${encodeURIComponent(refCode.trim())}`);
    }
  };

  // Light theme (for white/light backgrounds)
  const lightTheme = {
    container: "bg-white/90 border border-slate-200/40 shadow-lg",
    toggle: {
      base: "text-slate-700",
      active: "bg-accent text-white",
      inactive: "bg-slate-100/50 text-slate-600 hover:text-slate-700",
    },
    select: "h-11 w-full rounded-sm border border-slate-300/60 bg-white px-4 text-sm text-slate-700 outline-none transition-colors focus:border-accent appearance-none cursor-pointer [&>option]:bg-white [&>option]:text-slate-700",
    input: "h-11 w-full rounded-sm border border-slate-300/60 bg-white px-4 text-sm text-slate-700 placeholder:text-slate-400 outline-none transition-colors focus:border-accent focus:bg-white/95",
    label: "text-xs uppercase tracking-[0.2em] text-accent font-semibold",
    link: "text-slate-500 hover:text-accent",
    linkHover: "text-accent",
  };

  // Dark theme (original - for dark backgrounds)
  const darkTheme = {
    container: "bg-navy-deep/88 border border-primary-foreground/20",
    toggle: {
      base: "text-primary-foreground",
      active: "bg-accent text-primary",
      inactive: "bg-transparent text-primary-foreground/70 hover:text-primary-foreground",
    },
    select: "h-11 w-full rounded-sm border border-primary-foreground/20 bg-transparent px-4 text-sm text-primary-foreground outline-none transition-colors focus:border-accent appearance-none cursor-pointer [&>option]:bg-navy-deep [&>option]:text-primary-foreground",
    input: "h-11 w-full rounded-sm border border-primary-foreground/20 bg-transparent px-4 text-sm text-primary-foreground placeholder:text-primary-foreground/40 outline-none transition-colors focus:border-accent",
    label: "text-xs uppercase tracking-[0.2em] text-accent font-medium",
    link: "text-primary-foreground/50 hover:text-accent",
    linkHover: "text-accent",
  };

  const theme = variant === "light" ? lightTheme : darkTheme;

  return (
    <div className={`w-full max-w-md space-y-5 rounded-sm p-6 backdrop-blur-lg lg:p-8 ${theme.container}`}>
      {/* Comprar / Alugar toggle */}
      <div className={`flex overflow-hidden rounded-sm border ${variant === "light" ? "border-slate-300/60 bg-slate-50" : "border-primary-foreground/20"}`}>
        <button
          type="button"
          onClick={() => setPurpose("venda")}
          className={`flex-1 py-2.5 text-sm font-medium uppercase tracking-[0.18em] transition-colors ${
            purpose === "venda"
              ? theme.toggle.active
              : theme.toggle.inactive
          }`}
        >
          Comprar
        </button>
        <button
          type="button"
          onClick={() => setPurpose("aluguel")}
          className={`flex-1 py-2.5 text-sm font-medium uppercase tracking-[0.18em] transition-colors ${
            purpose === "aluguel"
              ? theme.toggle.active
              : theme.toggle.inactive
          }`}
        >
          Alugar
        </button>
      </div>

      {!reference ? (
        <>
          <div className="space-y-1.5">
            <label className={theme.label}>Tipo do Imóvel</label>
            <select value={type} onChange={(e) => setType(e.target.value)} className={theme.select}>
              <option value="">Selecione</option>
              {(["apartamento", "casa", "cobertura", "terreno"] as PropertyType[]).map((t) => (
                <option key={t} value={t}>
                  {propertyTypeLabel(t)}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className={theme.label}>Valor mínimo</label>
              <input
                type="text"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
                placeholder="R$ 0,00"
                className={theme.input}
              />
            </div>
            <div className="space-y-1.5">
              <label className={theme.label}>Valor máximo</label>
              <input
                type="text"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                placeholder="R$ 0,00"
                className={theme.input}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className={theme.label}>Bairros</label>
            <select value={location} onChange={(e) => setLocation(e.target.value)} className={theme.select}>
              <option value="">Todos os bairros</option>
              {publicLocations.map((loc) => (
                <option key={loc} value={loc}>
                  {loc}
                </option>
              ))}
            </select>
          </div>

          <Button onClick={handleSearch} variant="luxury" className="w-full" size="lg">
            <Search size={16} /> Pesquisar
          </Button>

          <button
            type="button"
            onClick={() => setReference(true)}
            className={`block w-full text-center text-xs transition-colors ${theme.link} hover:${theme.linkHover}`}
          >
            Ou <span className="underline">buscar por referência</span>
          </button>
        </>
      ) : (
        <>
          <div className="space-y-1.5">
            <label className={theme.label}>Código de referência</label>
            <input
              type="text"
              value={refCode}
              onChange={(e) => setRefCode(e.target.value)}
              placeholder="Ex: RM001"
              className={theme.input}
            />
          </div>

          <Button onClick={handleRefSearch} variant="luxury" className="w-full" size="lg">
            <Search size={16} /> Buscar
          </Button>

          <button
            type="button"
            onClick={() => setReference(false)}
            className={`block w-full text-center text-xs transition-colors ${theme.link} hover:${theme.linkHover}`}
          >
            Ou <span className="underline">buscar com filtros</span>
          </button>
        </>
      )}
    </div>
  );
}
