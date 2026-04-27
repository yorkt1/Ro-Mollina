import { createContext, useContext, useState, type ReactNode } from "react";

export type Language = "pt" | "en" | "es";

interface Translations {
  // Nav
  home: string;
  buy: string;
  rent: string;
  about: string;
  contact: string;
  listProperty: string;
  // Hero
  heroTitle: string;
  heroSubtitle: string;
  heroDescription: string;
  creci: string;
  viewProperties: string;
  // Search
  buyTab: string;
  rentTab: string;
  propertyType: string;
  selectType: string;
  minPrice: string;
  maxPrice: string;
  neighborhoods: string;
  allNeighborhoods: string;
  search: string;
  searchByRef: string;
  searchByFilters: string;
  refCode: string;
  refPlaceholder: string;
  // Property types
  apartment: string;
  house: string;
  penthouse: string;
  land: string;
}

const translations: Record<Language, Translations> = {
  pt: {
    home: "Início",
    buy: "Comprar",
    rent: "Alugar",
    about: "Sobre",
    contact: "Contato",
    listProperty: "Negocie seu Imóvel",
    heroTitle: "Rosemarie Macedo Molina",
    heroSubtitle: "Corretora e Avaliadora de Imóveis",
    heroDescription: "Venda, locação e consultoria imobiliária premium em Florianópolis e região.",
    creci: "CRECI/SC 72089F | CNAI 57385",
    viewProperties: "Ver imóveis",
    buyTab: "Comprar",
    rentTab: "Alugar",
    propertyType: "Tipo do Imóvel",
    selectType: "Selecione",
    minPrice: "Valor mínimo",
    maxPrice: "Valor máximo",
    neighborhoods: "Bairros",
    allNeighborhoods: "Todos os bairros",
    search: "Pesquisar",
    searchByRef: "Ou buscar por referência",
    searchByFilters: "Ou buscar com filtros",
    refCode: "Código de referência",
    refPlaceholder: "Ex: RM001",
    apartment: "Apartamento",
    house: "Casa",
    penthouse: "Cobertura",
    land: "Terreno",
  },
  en: {
    home: "Home",
    buy: "Buy",
    rent: "Rent",
    about: "About",
    contact: "Contact",
    listProperty: "List Your Property",
    heroTitle: "Rosemarie Macedo Molina",
    heroSubtitle: "Real Estate Broker & Appraiser",
    heroDescription: "Premium sales, rentals and real estate consulting in Florianópolis and region.",
    creci: "CRECI/SC 72089F | CNAI 57385",
    viewProperties: "View Properties",
    buyTab: "Buy",
    rentTab: "Rent",
    propertyType: "Property Type",
    selectType: "Select",
    minPrice: "Min Price",
    maxPrice: "Max Price",
    neighborhoods: "Neighborhoods",
    allNeighborhoods: "All neighborhoods",
    search: "Search",
    searchByRef: "Or search by reference",
    searchByFilters: "Or search with filters",
    refCode: "Reference code",
    refPlaceholder: "Ex: RM001",
    apartment: "Apartment",
    house: "House",
    penthouse: "Penthouse",
    land: "Land",
  },
  es: {
    home: "Inicio",
    buy: "Comprar",
    rent: "Alquilar",
    about: "Sobre",
    contact: "Contacto",
    listProperty: "Publique su Propiedad",
    heroTitle: "Rosemarie Macedo Molina",
    heroSubtitle: "Corredora y Tasadora de Inmuebles",
    heroDescription: "Venta, alquiler y asesoría inmobiliaria premium en Florianópolis y región.",
    creci: "CRECI/SC 72089F | CNAI 57385",
    viewProperties: "Ver inmuebles",
    buyTab: "Comprar",
    rentTab: "Alquilar",
    propertyType: "Tipo de Inmueble",
    selectType: "Seleccione",
    minPrice: "Valor mínimo",
    maxPrice: "Valor máximo",
    neighborhoods: "Barrios",
    allNeighborhoods: "Todos los barrios",
    search: "Buscar",
    searchByRef: "O buscar por referencia",
    searchByFilters: "O buscar con filtros",
    refCode: "Código de referencia",
    refPlaceholder: "Ej: RM001",
    apartment: "Apartamento",
    house: "Casa",
    penthouse: "Ático",
    land: "Terreno",
  },
};

const languageLabels: Record<Language, { flag: string; label: string }> = {
  pt: { flag: "https://flagcdn.com/w40/br.png", label: "PT" },
  en: { flag: "https://flagcdn.com/w40/us.png", label: "EN" },
  es: { flag: "https://flagcdn.com/w40/es.png", label: "ES" },
};

interface LanguageContextValue {
  lang: Language;
  setLang: (lang: Language) => void;
  t: Translations;
  languageLabels: typeof languageLabels;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Language>("pt");
  return (
    <LanguageContext.Provider value={{ lang, setLang, t: translations[lang], languageLabels }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used within LanguageProvider");
  return ctx;
}
