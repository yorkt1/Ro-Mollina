import { describe, expect, it } from "vitest";
import {
  getHighlightStorefrontLink,
  propertyMatchesShowcase,
  propertyTypeMatchesCategory,
  propertyTypeMatchesFilter,
} from "@/lib/storefront-filters";
import { getSiteDestinationOptions } from "@/lib/site-destinations";

describe("storefront property filters", () => {
  it("builds independent showcases from property flags", () => {
    const property = { featured: false, opportunity: true };

    expect(propertyMatchesShowcase(property, "oportunidades")).toBe(true);
    expect(propertyMatchesShowcase(property, "destaques")).toBe(false);
    expect(propertyMatchesShowcase(property, "todos")).toBe(true);
  });

  it("offers showcase destinations without requiring a property category", () => {
    const destinations = getSiteDestinationOptions(["apartamento"]);

    expect(destinations).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          label: "Todas as oportunidades",
          path: "/imoveis?vitrine=oportunidades",
          group: "Vitrines personalizadas",
        }),
        expect.objectContaining({
          label: "Destaques à venda",
          path: "/comprar?vitrine=destaques",
        }),
      ]),
    );
  });

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
    expect(
      getHighlightStorefrontLink(
        "Condomínios",
        "/imoveis?vitrine=oportunidades",
      ),
    ).toBe("/imoveis?vitrine=oportunidades");
  });
});
