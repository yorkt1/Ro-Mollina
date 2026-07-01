import { describe, expect, it } from "vitest";
import {
  getHighlightStorefrontLink,
  propertyTypeMatchesCategory,
  propertyTypeMatchesFilter,
} from "@/lib/storefront-filters";

describe("storefront property filters", () => {
  it("includes every registered land subtype in the Terrenos filter", () => {
    expect(propertyTypeMatchesFilter("terreno", "terreno")).toBe(true);
    expect(propertyTypeMatchesFilter("terreno em condomínio", "terreno")).toBe(true);
    expect(propertyTypeMatchesFilter("terreno loteamento", "terreno")).toBe(true);
    expect(propertyTypeMatchesFilter("casa", "terreno")).toBe(false);
  });

  it("limits the Condomínios category to condominium property types", () => {
    expect(propertyTypeMatchesCategory("casa em condomínio", "condominio")).toBe(true);
    expect(propertyTypeMatchesCategory("terreno em condomínio", "condominio")).toBe(true);
    expect(propertyTypeMatchesCategory("casa", "condominio")).toBe(false);
    expect(propertyTypeMatchesCategory("terreno", "condominio")).toBe(false);
  });

  it("corrects the configured Condomínios highlight only in the storefront", () => {
    expect(getHighlightStorefrontLink("Condomínios", "/comprar")).toBe(
      "/comprar?categoria=condominio",
    );
    expect(getHighlightStorefrontLink("Terrenos", "/comprar?tipo=terreno")).toBe(
      "/comprar?tipo=terreno",
    );
  });
});
