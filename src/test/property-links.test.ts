import { describe, expect, it } from "vitest";
import { propertyPath, propertySlug } from "@/lib/property-links";

describe("property links", () => {
  it("creates a compact slug for the property URL", () => {
    expect(propertySlug({
      id: "27ded4ce-ccf2-4299-af6d-8d18bc451f5c",
      title: "Prédio Comercial à Venda",
      neighborhood: "Centro",
    })).toBe("predio-comercial-a-centro");
  });

  it("builds a shorter property path using the id and compact slug", () => {
    expect(propertyPath({
      id: "27ded4ce-ccf2-4299-af6d-8d18bc451f5c",
      title: "Prédio Comercial à Venda",
      neighborhood: "Centro",
    })).toBe("/imovel/27ded4ce-ccf2-4299-af6d-8d18bc451f5c/predio-comercial-a-centro");
  });
});
