import { useMemo, useState, useEffect } from "react";
import { useSearchParams, useParams } from "react-router-dom";
import SEO from "@/components/SEO";
import { BadgePercent, Loader2, Search, Star, X } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import PropertyCard from "@/components/PropertyCard";
import { Button } from "@/components/ui/button";
import {
  type PropertyPurpose,
  type PropertyType,
  propertyTypeLabel,
  LOCATION_GROUPS,
} from "@/data/properties";
import { useProperties } from "@/hooks/use-properties";
import { usePropertyTypes } from "@/hooks/use-property-types";
import {
  propertyMatchesShowcase,
  propertyTypeMatchesCategory,
  propertyTypeMatchesFilter,
  typeSlug,
  type PropertyShowcase,
} from "@/lib/storefront-filters";

export default function PropertiesPage({
  defaultPurpose = "todos",
  pageTitle = "Portfólio completo",
  pageSubtitle = "Explore imóveis para compra e aluguel com filtros rápidos e visual premium.",
}: {
  defaultPurpose?: PropertyPurpose | "todos";
  pageTitle?: string;
  pageSubtitle?: string;
}) {
  const { data: properties = [], isLoading } = useProperties();
  const { data: propertyTypes = [] } = usePropertyTypes();
  const [searchParams, setSearchParams] = useSearchParams();
  const { type: urlType } = useParams();

  // A rota traz o tipo em forma de slug (/alugar/casa-em-condominio). O <Select>
  // e os rótulos precisam do nome real cadastrado ("Casa em Condomínio"), então
  // convertemos de volta assim que a lista de tipos chega.
  const resolvedUrlType = useMemo(() => {
    if (!urlType) return undefined;
    const wanted = typeSlug(urlType);
    return propertyTypes.find((t) => typeSlug(t.name) === wanted)?.name ?? urlType;
  }, [urlType, propertyTypes]);

  const initialType = resolvedUrlType || searchParams.get("tipo") || "todos";
  const initialLocation = searchParams.get("bairro") || "todos";
  const initialMinPrice = searchParams.get("min") || "";
  const initialMaxPrice = searchParams.get("max") || "";
  const initialBedrooms = searchParams.get("quartos") || "todos";
  const category = searchParams.get("categoria") || "todos";
  const requestedShowcase = searchParams.get("vitrine") || "todos";
  const showcase: PropertyShowcase =
    requestedShowcase === "destaques" || requestedShowcase === "oportunidades"
      ? requestedShowcase
      : "todos";

  const [search, setSearch] = useState("");
  const [purpose, setPurpose] = useState<PropertyPurpose | "todos">(defaultPurpose);
  const [type, setType] = useState<string>(initialType);
  const [location, setLocation] = useState<string>(initialLocation);
  const [minPrice, setMinPrice] = useState(initialMinPrice);
  const [maxPrice, setMaxPrice] = useState(initialMaxPrice);
  const [bedrooms, setBedrooms] = useState(initialBedrooms);

  // Sync state with URL when searchParams or defaultPurpose changes
  useEffect(() => {
    setPurpose(defaultPurpose);
    setType(resolvedUrlType || searchParams.get("tipo") || "todos");
    setLocation(searchParams.get("bairro") || "todos");
    setMinPrice(searchParams.get("min") || "");
    setMaxPrice(searchParams.get("max") || "");
    setBedrooms(searchParams.get("quartos") || "todos");
  }, [searchParams, defaultPurpose, resolvedUrlType]);

  // Derive locations from Supabase data
  const publicLocations = useMemo(
    () => Array.from(new Set(properties.map((p) => p.neighborhood))),
    [properties]
  );

  const allGroupedLocations = useMemo(() => LOCATION_GROUPS.flatMap(g => g.neighborhoods), []);
  const otherLocations = useMemo(() => publicLocations.filter(loc => !allGroupedLocations.includes(loc)), [publicLocations, allGroupedLocations]);

  // Sync filters to URL
  const updateParams = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams);
    if (!value || value === "todos") {
      params.delete(key);
    } else {
      params.set(key, value);
    }
    setSearchParams(params, { replace: true });
  };

  const handleTypeChange = (v: string) => {
    setType(v);
    updateParams("tipo", v);
  };
  const handleLocationChange = (v: string) => {
    setLocation(v);
    updateParams("bairro", v);
  };
  const handleMinPriceChange = (v: string) => {
    setMinPrice(v);
    updateParams("min", v);
  };
  const handleMaxPriceChange = (v: string) => {
    setMaxPrice(v);
    updateParams("max", v);
  };
  const handleBedroomsChange = (v: string) => {
    setBedrooms(v);
    updateParams("quartos", v);
  };

  const clearFilters = () => {
    setSearch("");
    setPurpose(defaultPurpose);
    setType("todos");
    setLocation("todos");
    setMinPrice("");
    setMaxPrice("");
    setBedrooms("todos");
    setSearchParams({}, { replace: true });
  };

  const hasActiveFilters =
    category !== "todos" ||
    showcase !== "todos" ||
    type !== "todos" ||
    location !== "todos" ||
    minPrice !== "" ||
    maxPrice !== "" ||
    bedrooms !== "todos" ||
    search !== "";

  const filtered = useMemo(() => {
    const minP = minPrice ? Number(minPrice.replace(/\D/g, "")) : 0;
    const maxP = maxPrice ? Number(maxPrice.replace(/\D/g, "")) : Infinity;
    const minBeds = bedrooms !== "todos" ? Number(bedrooms) : 0;

    return properties.filter((property) => {
      const matchesPurpose = purpose === "todos" || property.purpose === purpose;
      const matchesType = propertyTypeMatchesFilter(property.type, type);
      const matchesCategory = propertyTypeMatchesCategory(property.type, category);
      const matchesShowcase = propertyMatchesShowcase(property, showcase);
      const matchesLocation = location === "todos" || property.neighborhood === location;
      const matchesMinPrice = property.price >= minP;
      const matchesMaxPrice = property.price <= maxP || property.price === 0;
      const matchesBedrooms = minBeds === 0 || property.bedrooms >= minBeds;
      const haystack = `${property.title} ${property.neighborhood} ${property.location}`.toLowerCase();
      const matchesSearch = !search || haystack.includes(search.toLowerCase());

      return matchesPurpose && matchesType && matchesCategory && matchesShowcase && matchesLocation && matchesMinPrice && matchesMaxPrice && matchesBedrooms && matchesSearch;
    });
  }, [location, purpose, search, type, category, showcase, minPrice, maxPrice, bedrooms, properties]);

  // Dynamic title based on active type filter
  const purposeWord = defaultPurpose === "venda" ? "à Venda" : defaultPurpose === "aluguel" ? "para Alugar" : "";
  const dynamicTitle = showcase === "oportunidades"
    ? `Oportunidades ${purposeWord}`.trim()
    : showcase === "destaques"
      ? `Imóveis em destaque ${purposeWord}`.trim()
      : category === "condominio" && type === "todos"
        ? `Condomínios ${purposeWord}`.trim()
        : type !== "todos"
          ? `${propertyTypeLabel(type)} ${purposeWord}`.trim()
          : pageTitle;
  const dynamicSubtitle = showcase === "oportunidades"
    ? "Uma seleção especial de imóveis com condições e potencial diferenciados."
    : showcase === "destaques"
      ? "Imóveis escolhidos para ganhar maior visibilidade em nossa curadoria."
      : category === "condominio" && type === "todos"
        ? "Veja os imóveis disponíveis em condomínios."
        : type !== "todos"
          ? `Veja todos os imóveis do tipo ${propertyTypeLabel(type).toLowerCase()} disponíveis.`
          : pageSubtitle;

  const seoTitle =
    showcase === "oportunidades"
      ? `Oportunidades de Imóveis ${purposeWord}`.trim()
      : showcase === "destaques"
        ? `Imóveis em Destaque ${purposeWord}`.trim()
        : defaultPurpose === "venda"
          ? "Imóveis à Venda em Florianópolis"
          : defaultPurpose === "aluguel"
            ? "Imóveis para Alugar em Florianópolis"
            : "Portfólio de Imóveis em Florianópolis";

  const seoDescription =
    showcase === "oportunidades"
      ? "Confira oportunidades imobiliárias selecionadas por Ro Molina em Florianópolis e região."
      : showcase === "destaques"
        ? "Confira os imóveis em destaque selecionados por Ro Molina em Florianópolis e região."
        : defaultPurpose === "venda"
          ? "Apartamentos, casas e coberturas à venda em Florianópolis. Curadoria exclusiva por Ro Molina. CRECI-SC 72089F."
          : defaultPurpose === "aluguel"
            ? "Apartamentos e coberturas para locação em Florianópolis com atendimento personalizado por Ro Molina. CRECI-SC 72089F."
            : "Portfólio completo de imóveis para compra e aluguel em Florianópolis, curado por Ro Molina. CRECI-SC 72089F.";

  const baseSeoUrl =
    defaultPurpose === "venda" ? "/comprar" : defaultPurpose === "aluguel" ? "/alugar" : "/imoveis";
  const seoUrl =
    showcase === "todos"
      ? baseSeoUrl
      : `${baseSeoUrl}?vitrine=${showcase}`;

  return (
    <div className="min-h-screen bg-background">
      <SEO title={seoTitle} description={seoDescription} url={seoUrl} />
      <Header />

      <section className="bg-muted pt-28 pb-16 border-b border-border">
        <div className="container space-y-4 px-6 text-center">
          <p className="text-xs uppercase tracking-[0.28em] font-semibold text-accent">Portfólio</p>
          <h1 className="text-3xl text-foreground sm:text-4xl md:text-5xl">{dynamicTitle}</h1>
          <p className="mx-auto max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">{dynamicSubtitle}</p>
        </div>
      </section>

      {/* Sticky filter bar */}
      <section className="sticky top-0 z-40 border-b border-border bg-card/95 py-3 backdrop-blur-md sm:py-4">
        <div className="container px-4 sm:px-6">
          {/* Search + Purpose row */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1 min-w-0">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por bairro, título ou cidade"
                className="h-10 w-full rounded-sm border border-border bg-background pl-10 pr-4 text-sm text-foreground outline-none transition-colors focus:border-accent sm:h-11"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              {[
                { label: "Todos", value: "todos" },
                { label: "Venda", value: "venda" },
                { label: "Aluguel", value: "aluguel" },
              ].map((option) => (
                <Button
                  key={option.value}
                  type="button"
                  variant={purpose === option.value ? "crm" : "crmSecondary"}
                  size="sm"
                  onClick={() => setPurpose(option.value as PropertyPurpose | "todos")}
                >
                  {option.label}
                </Button>
              ))}
              <Button
                type="button"
                variant={showcase === "destaques" ? "crm" : "crmSecondary"}
                size="sm"
                onClick={() =>
                  updateParams(
                    "vitrine",
                    showcase === "destaques" ? "todos" : "destaques",
                  )
                }
              >
                <Star size={14} />
                Destaques
              </Button>
              <Button
                type="button"
                variant={showcase === "oportunidades" ? "crm" : "crmSecondary"}
                size="sm"
                onClick={() =>
                  updateParams(
                    "vitrine",
                    showcase === "oportunidades" ? "todos" : "oportunidades",
                  )
                }
              >
                <BadgePercent size={14} />
                Oportunidades
              </Button>
            </div>
          </div>

          {/* Filter selects row */}
          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5 lg:gap-3">
            <select
              value={type}
              onChange={(e) => handleTypeChange(e.target.value)}
              className="h-10 rounded-sm border border-border bg-background px-3 text-sm text-foreground outline-none transition-colors focus:border-accent sm:h-11 sm:px-4"
            >
              <option value="todos">Todos os tipos</option>
              {propertyTypes.map((t) => (
                <option key={t.id} value={t.name}>{propertyTypeLabel(t.name)}</option>
              ))}
            </select>

            <select
              value={location}
              onChange={(e) => handleLocationChange(e.target.value)}
              className="h-10 rounded-sm border border-border bg-background px-3 text-sm text-foreground outline-none transition-colors focus:border-accent sm:h-11 sm:px-4"
            >
              <option value="todos">Todos os bairros</option>
              {LOCATION_GROUPS.map((group) => (
                <optgroup key={group.city} label={group.city}>
                  {group.neighborhoods.map((loc) => (
                    <option key={`${group.city}-${loc}`} value={loc}>{loc}</option>
                  ))}
                </optgroup>
              ))}
              {otherLocations.length > 0 && (
                <optgroup label="Outras Regiões">
                  {otherLocations.map((loc) => (
                    <option key={`other-${loc}`} value={loc}>{loc}</option>
                  ))}
                </optgroup>
              )}
            </select>

            <select
              value={bedrooms}
              onChange={(e) => handleBedroomsChange(e.target.value)}
              className="h-10 rounded-sm border border-border bg-background px-3 text-sm text-foreground outline-none transition-colors focus:border-accent sm:h-11 sm:px-4"
            >
              <option value="todos">Quartos</option>
              <option value="1">1+ quarto</option>
              <option value="2">2+ quartos</option>
              <option value="3">3+ quartos</option>
              <option value="4">4+ quartos</option>
              <option value="5">5+ quartos</option>
            </select>

            <input
              type="text"
              value={minPrice}
              onChange={(e) => handleMinPriceChange(e.target.value)}
              placeholder="Valor mínimo"
              className="h-10 rounded-sm border border-border bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground outline-none transition-colors focus:border-accent sm:h-11 sm:px-4"
            />

            <input
              type="text"
              value={maxPrice}
              onChange={(e) => handleMaxPriceChange(e.target.value)}
              placeholder="Valor máximo"
              className="h-10 rounded-sm border border-border bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground outline-none transition-colors focus:border-accent sm:h-11 sm:px-4"
            />
          </div>

          {hasActiveFilters && (
            <div className="mt-2 flex justify-end">
              <button
                onClick={clearFilters}
                className="inline-flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-accent"
              >
                <X size={12} /> Limpar filtros
              </button>
            </div>
          )}
        </div>
      </section>

      <section className="py-12 sm:py-16 lg:py-20">
        <div className="container space-y-8 px-4 sm:px-6">
          <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Resultado</p>
              <p className="mt-2 text-xl font-serif text-foreground sm:text-2xl">
                {isLoading ? "Carregando..." : `${filtered.length} imóveis encontrados`}
              </p>
            </div>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-accent" />
            </div>
          ) : filtered.length ? (
            <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filtered.map((property) => (
                <PropertyCard key={property.id} property={property} />
              ))}
            </div>
          ) : (
            <div className="rounded-sm border border-dashed border-border bg-card px-6 py-16 text-center sm:py-20">
              <p className="text-xl font-serif text-foreground sm:text-2xl">Nenhum imóvel encontrado</p>
              <p className="mt-3 text-sm text-muted-foreground sm:text-base">Ajuste os filtros para encontrar outras opções.</p>
              <Button variant="crmSecondary" size="sm" className="mt-4" onClick={clearFilters}>
                Limpar filtros
              </Button>
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
}
