function normalizeFilterValue(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

export function propertyTypeMatchesFilter(propertyType: string, selectedType: string) {
  const type = normalizeFilterValue(propertyType);
  const filter = normalizeFilterValue(selectedType);

  if (!filter || filter === "todos") return true;

  // "Terrenos" is a storefront category that includes its registered subtypes.
  if (filter === "terreno") {
    return type === "terreno" || type.startsWith("terreno ");
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

  if (normalizedTitle === "condominio" || normalizedTitle === "condominios") {
    const route = configuredLink.startsWith("/alugar") ? "/alugar" : "/comprar";
    return `${route}?categoria=condominio`;
  }

  return configuredLink;
}
