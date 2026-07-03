import { propertyTypeLabel } from "@/data/properties";

export interface SiteDestinationOption {
  label: string;
  path: string;
  group:
    | "Páginas do site"
    | "Vitrines personalizadas"
    | "Imóveis à venda"
    | "Imóveis para locação";
}

export function getSiteDestinationOptions(propertyTypes: string[]): SiteDestinationOption[] {
  const uniqueTypes = Array.from(new Set(propertyTypes)).sort((a, b) =>
    propertyTypeLabel(a).localeCompare(propertyTypeLabel(b), "pt-BR"),
  );

  return [
    { label: "Página inicial", path: "/", group: "Páginas do site" },
    { label: "Portfólio completo", path: "/imoveis", group: "Páginas do site" },
    { label: "Sobre", path: "/sobre", group: "Páginas do site" },
    { label: "Negocie seu imóvel", path: "/negocie-seu-imovel", group: "Páginas do site" },
    { label: "Contato", path: "/#contato", group: "Páginas do site" },
    {
      label: "Todos os destaques",
      path: "/imoveis?vitrine=destaques",
      group: "Vitrines personalizadas",
    },
    {
      label: "Todas as oportunidades",
      path: "/imoveis?vitrine=oportunidades",
      group: "Vitrines personalizadas",
    },
    {
      label: "Destaques à venda",
      path: "/comprar?vitrine=destaques",
      group: "Vitrines personalizadas",
    },
    {
      label: "Oportunidades à venda",
      path: "/comprar?vitrine=oportunidades",
      group: "Vitrines personalizadas",
    },
    {
      label: "Destaques para locação",
      path: "/alugar?vitrine=destaques",
      group: "Vitrines personalizadas",
    },
    {
      label: "Oportunidades para locação",
      path: "/alugar?vitrine=oportunidades",
      group: "Vitrines personalizadas",
    },
    { label: "Todos à venda", path: "/comprar", group: "Imóveis à venda" },
    {
      label: "Condomínios à venda",
      path: "/comprar?categoria=condominio",
      group: "Imóveis à venda",
    },
    ...uniqueTypes.map((type) => ({
      label: `${propertyTypeLabel(type)} à venda`,
      path: `/comprar?tipo=${encodeURIComponent(type)}`,
      group: "Imóveis à venda" as const,
    })),
    { label: "Todos para locação", path: "/alugar", group: "Imóveis para locação" },
    ...uniqueTypes.map((type) => ({
      label: `${propertyTypeLabel(type)} para locação`,
      path: `/alugar?tipo=${encodeURIComponent(type)}`,
      group: "Imóveis para locação" as const,
    })),
  ];
}
