function normalizeFilterValue(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

/**
 * Forma canônica de um tipo de imóvel para uso em URL.
 * "Casa & Apartamento" → "casa-apartamento", "Sítio" → "sitio".
 *
 * Os nomes dos tipos são digitados no admin e contêm acento, espaço e "&".
 * Jogá-los crus na URL gerava caminhos como `/alugar/casa & apartamento`, que
 * o Google rastreia e descarta. Esta função é a única fonte da verdade tanto
 * para montar o link quanto para casar a rota de volta com o tipo do banco.
 */
export function typeSlug(value: string) {
  return normalizeFilterValue(value)
    .replace(/&/g, " ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export type PropertyShowcase = "todos" | "destaques" | "oportunidades";

export function propertyMatchesShowcase(
  property: { featured: boolean; opportunity?: boolean },
  showcase: string,
) {
  const normalizedShowcase = normalizeFilterValue(showcase);

  if (!normalizedShowcase || normalizedShowcase === "todos") return true;
  if (normalizedShowcase === "destaques") return property.featured;
  if (normalizedShowcase === "oportunidades") return property.opportunity === true;

  return true;
}

export function propertyTypeMatchesFilter(propertyType: string, selectedType: string) {
  // Compara pela forma de URL, então tanto "Casa & Apartamento" (nome do banco)
  // quanto "casa-apartamento" (segmento da rota) casam com o mesmo imóvel.
  const type = typeSlug(propertyType);
  const filter = typeSlug(selectedType);

  if (!filter || filter === "todos") return true;

  // "Terrenos" is a storefront category that includes its registered subtypes.
  if (filter === "terreno") {
    return type === "terreno" || type.startsWith("terreno-");
  }

  return type === filter;
}

export function propertyTypeMatchesCategory(propertyType: string, category: string) {
  const type = normalizeFilterValue(propertyType);
  const normalizedCategory = normalizeFilterValue(category);

  if (!normalizedCategory || normalizedCategory === "todos") return true;

  if (normalizedCategory === "condominio") {
    return type.includes("condominio");
  }

  return true;
}

export function getHighlightStorefrontLink(title: string, configuredLink: string) {
  const normalizedTitle = normalizeFilterValue(title);

  if (
    (normalizedTitle === "condominio" || normalizedTitle === "condominios") &&
    !configuredLink.includes("vitrine=")
  ) {
    const route = configuredLink.startsWith("/alugar") ? "/alugar" : "/comprar";
    return `${route}?categoria=condominio`;
  }

  return configuredLink;
}
