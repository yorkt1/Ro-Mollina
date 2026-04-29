import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, SlidersHorizontal, Hash } from "lucide-react";
import { Button } from "@/components/ui/button";
import { properties, propertyTypeLabel, publicLocations, type PropertyPurpose, type PropertyType } from "@/data/properties";
import { usePropertyTypes } from "@/hooks/use-property-types";

export default function SearchSection() {
  const navigate = useNavigate();
  const [purpose, setPurpose] = useState<PropertyPurpose>("venda");
  const [type, setType] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [location, setLocation] = useState("");
  const [mode, setMode] = useState<"filters" | "reference">("filters");
  const [refCode, setRefCode] = useState("");
  const { data: propertyTypes = [] } = usePropertyTypes();

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
    navigate(found ? `/imoveis/${found.id}` : `/imoveis?search=${encodeURIComponent(refCode.trim())}`);
  };

  const selectClass =
    "h-11 w-full rounded-sm border border-border bg-background px-4 text-sm text-foreground outline-none transition-colors focus:border-accent appearance-none cursor-pointer";
  const inputClass =
    "h-11 w-full rounded-sm border border-border bg-background px-4 text-sm text-foreground placeholder:text-muted-foreground outline-none transition-colors focus:border-accent";
  const labelClass =
    "block text-xs uppercase tracking-[0.2em] text-accent font-semibold mb-1.5";

  return (
    <section className="relative z-20 -mt-8 pb-8 overflow-hidden">
      <div className="container px-4 sm:px-6">
        <div className="mx-auto max-w-4xl rounded-sm border border-border bg-card backdrop-blur-xl overflow-hidden">

          {/* Header tabs */}
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-4 sm:px-6 pt-4 sm:pt-5 pb-0 overflow-hidden">
            <div className="flex gap-1 min-w-0">
              <button
                type="button"
                onClick={() => { setPurpose("venda"); setMode("filters"); }}
                className={`flex items-center gap-1.5 rounded-t-sm border-b-2 px-3 sm:px-4 py-2.5 sm:py-3 text-[11px] sm:text-xs font-semibold uppercase tracking-[0.15em] sm:tracking-[0.18em] transition-colors whitespace-nowrap ${
                  purpose === "venda" && mode === "filters"
                    ? "border-accent text-accent"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                Comprar
              </button>
              <button
                type="button"
                onClick={() => { setPurpose("aluguel"); setMode("filters"); }}
                className={`flex items-center gap-1.5 rounded-t-sm border-b-2 px-3 sm:px-4 py-2.5 sm:py-3 text-[11px] sm:text-xs font-semibold uppercase tracking-[0.15em] sm:tracking-[0.18em] transition-colors whitespace-nowrap ${
                  purpose === "aluguel" && mode === "filters"
                    ? "border-accent text-accent"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                Alugar
              </button>
            </div>

            <div className="flex gap-1 pb-1 min-w-0">
              <button
                type="button"
                onClick={() => setMode("filters")}
                className={`flex items-center gap-1 rounded-sm px-2 sm:px-3 py-1.5 text-[10px] sm:text-[11px] uppercase tracking-[0.12em] sm:tracking-[0.15em] transition-colors whitespace-nowrap ${
                  mode === "filters"
                    ? "bg-accent/10 text-accent"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <SlidersHorizontal size={12} /> Filtros
              </button>
              <button
                type="button"
                onClick={() => setMode("reference")}
                className={`flex items-center gap-1 rounded-sm px-2 sm:px-3 py-1.5 text-[10px] sm:text-[11px] uppercase tracking-[0.12em] sm:tracking-[0.15em] transition-colors whitespace-nowrap ${
                  mode === "reference"
                    ? "bg-accent/10 text-accent"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Hash size={12} /> Ref.
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="p-4 sm:p-6">
            {mode === "filters" ? (
              <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:flex-wrap lg:flex-nowrap">
                {/* Tipo */}
                <div className="flex-1 min-w-0 sm:min-w-[160px]">
                  <label className={labelClass}>Tipo do Imóvel</label>
                  <select value={type} onChange={(e) => setType(e.target.value)} className={selectClass}>
                    <option value="">Selecione</option>
                    {propertyTypes.map((t) => (
                      <option key={t.id} value={t.name}>{propertyTypeLabel(t.name)}</option>
                    ))}
                  </select>
                </div>

                {/* Valor mínimo */}
                <div className="flex-1 min-w-0 sm:min-w-[130px]">
                  <label className={labelClass}>Valor mínimo</label>
                  <input
                    type="text"
                    value={minPrice}
                    onChange={(e) => setMinPrice(e.target.value)}
                    placeholder="R$ 0,00"
                    className={inputClass}
                  />
                </div>

                {/* Valor máximo */}
                <div className="flex-1 min-w-0 sm:min-w-[130px]">
                  <label className={labelClass}>Valor máximo</label>
                  <input
                    type="text"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(e.target.value)}
                    placeholder="R$ 0,00"
                    className={inputClass}
                  />
                </div>

                {/* Bairros */}
                <div className="flex-1 min-w-0 sm:min-w-[160px]">
                  <label className={labelClass}>Bairros</label>
                  <select value={location} onChange={(e) => setLocation(e.target.value)} className={selectClass}>
                    <option value="">Todos os bairros</option>
                    {publicLocations.map((loc) => (
                      <option key={loc} value={loc}>{loc}</option>
                    ))}
                  </select>
                </div>

                {/* Search button */}
                <div className="shrink-0 pt-[1.625rem] sm:pt-0 lg:pt-[1.625rem]">
                  <Button onClick={handleSearch} variant="luxury" size="lg" className="w-full sm:w-auto gap-2 whitespace-nowrap">
                    <Search size={16} /> Pesquisar
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
                <div className="flex-1">
                  <label className={labelClass}>Código de referência</label>
                  <input
                    type="text"
                    value={refCode}
                    onChange={(e) => setRefCode(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleRefSearch()}
                    placeholder="Ex: RM001 ou parte do título"
                    className={inputClass}
                  />
                </div>
                <div className="shrink-0 pt-[1.625rem] sm:pt-0">
                  <Button onClick={handleRefSearch} variant="luxury" size="lg" className="w-full sm:w-auto gap-2">
                    <Search size={16} /> Buscar
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
