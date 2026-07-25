import type { Property } from "@/data/properties";

const ACCENT_MAP: Record<string, string> = {
  á: "a", à: "a", â: "a", ã: "a", ä: "a",
  é: "e", è: "e", ê: "e", ë: "e",
  í: "i", ì: "i", î: "i", ï: "i",
  ó: "o", ò: "o", ô: "o", õ: "o", ö: "o",
  ú: "u", ù: "u", û: "u", ü: "u",
  ç: "c", ñ: "n",
};

function normalizeText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\/]+/g, "-")
    .replace(/[^\w\s-]/g, (char) => ACCENT_MAP[char] ?? "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();
}

export function propertySlug(property: Pick<Property, "id" | "title" | "neighborhood">) {
  const titleWords = normalizeText(property.title).split("-").filter(Boolean);
  const compactTitle = titleWords.slice(0, 3).join("-");
  const district = normalizeText(property.neighborhood);

  return [compactTitle, district].filter(Boolean).join("-");
}

export function propertyPath(property: Pick<Property, "id" | "title" | "neighborhood"> & { shortId?: number }, shortId?: number) {
  // Ensure we use the stable UUID (property.id) instead of shifting shortIds.
  return `/imovel/${property.id}/${propertySlug(property)}`;
}
