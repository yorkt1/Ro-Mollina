import { describe, expect, it } from "vitest";
// @ts-expect-error — função serverless em JS, sem tipos.
import { OLX_PLAN_LIMIT as FEED_PLAN_LIMIT, buildListing } from "../../api/vrsync.js";
// @ts-expect-error — tabelas de conversão em JS, sem tipos.
import { PROPERTY_TYPE_MAP, STATE_NAMES } from "../../api/_vrsync-maps.js";
import type { Property } from "@/data/properties";
import { OLX_PLAN_LIMIT, checkOlxReadiness } from "@/lib/olx-feed";
import { STATE_ABBREVIATIONS, VRSYNC_PROPERTY_TYPE_KEYS } from "@/lib/olx-property-types";

/**
 * O painel (/admin/olx) valida o imóvel com uma cópia das regras do feed, para
 * avisar sobre pendências sem ir ao servidor. Estes testes amarram as duas
 * implementações: mudar uma regra só de um lado quebra aqui.
 */

/** Imóvel do painel que atende a todas as exigências do VRSync. */
function validProperty(overrides: Partial<Property> = {}): Property {
  return {
    id: "27ded4ce-ccf2-4299-af6d-8d18bc451f5c",
    shortId: 12,
    refCode: "RM0001",
    title: "Casa térrea à venda no bairro Monte Verde",
    description:
      "Casa térrea com três dormitórios, pátio amplo e garagem coberta para dois carros.",
    price: 575000,
    purpose: "venda",
    type: "casa",
    location: "Florianópolis/SC",
    neighborhood: "Monte Verde",
    street: "Rua Ibatingui",
    addressNumber: "130",
    cep: "88032520",
    area: 120,
    landArea: 250,
    bedrooms: 3,
    bathrooms: 2,
    suites: 1,
    parkingSpots: 2,
    featured: false,
    exclusive: false,
    images: Array.from(
      { length: 6 },
      (_, i) =>
        `https://res.cloudinary.com/ddan59hgh/image/upload/v177713911${i}/properties/foto${i}.jpg`,
    ),
    ...overrides,
  };
}

/** Mesma linha, no formato do banco que a função serverless recebe. */
function toDbShape(property: Property) {
  return {
    id: property.id,
    short_id: property.shortId,
    ref_code: property.refCode,
    title: property.title,
    description: property.description,
    full_description: property.fullDescription ?? null,
    price: property.price,
    purpose: property.purpose,
    type: property.type,
    location: property.location,
    neighborhood: property.neighborhood,
    street: property.street,
    address_number: property.addressNumber,
    cep: property.cep,
    area: property.area,
    built_area: property.builtArea,
    land_area: property.landArea,
    total_area: property.totalArea,
    bedrooms: property.bedrooms,
    bathrooms: property.bathrooms,
    suites: property.suites,
    parking_spots: property.parkingSpots,
    images: property.images,
  };
}

describe("olx — espelho das regras do feed", () => {
  it("usa o mesmo limite de anúncios do plano", () => {
    expect(OLX_PLAN_LIMIT).toBe(FEED_PLAN_LIMIT);
  });

  it("conhece exatamente os mesmos tipos de imóvel do de-para do VRSync", () => {
    expect([...VRSYNC_PROPERTY_TYPE_KEYS].sort()).toEqual(Object.keys(PROPERTY_TYPE_MAP).sort());
  });

  it("conhece exatamente as mesmas siglas de estado", () => {
    expect([...STATE_ABBREVIATIONS].sort()).toEqual(Object.keys(STATE_NAMES).sort());
  });

  const cases: Array<[string, Partial<Property>]> = [
    ["cadastro completo", {}],
    ["título curto", { title: "Casa" }],
    ["descrição curta", { description: "Casa boa", fullDescription: "" }],
    ["sem preço", { price: 0 }],
    ["tipo sem equivalente", { type: "iate" }],
    ["cidade sem UF", { location: "Florianópolis" }],
    ["sem bairro", { neighborhood: "" }],
    ["CEP inválido", { cep: "8803" }],
    ["poucas fotos", { images: ["https://exemplo.com/foto.jpg"] }],
    ["fotos em formato recusado", { images: Array.from({ length: 6 }, () => "https://exemplo.com/foto.png") }],
    ["sem metragem", { area: 0, landArea: 0, builtArea: 0, totalArea: 0 }],
  ];

  it.each(cases)("chega ao mesmo veredito do feed: %s", (_label, overrides) => {
    const property = validProperty(overrides);
    const pending = checkOlxReadiness(property);
    const listing = buildListing(toDbShape(property));

    expect(pending.length === 0).toBe(Boolean(listing.xml));
  });

  it("descreve a pendência para a corretora, não em código", () => {
    expect(checkOlxReadiness(validProperty({ cep: "8803" }))).toContain("CEP ausente ou inválido");
    expect(checkOlxReadiness(validProperty({ images: [] }))).toContain(
      "0 foto(s) válida(s) — o mínimo é 5",
    );
  });

  it("aceita descrição longa no campo detalhado quando o resumo é curto", () => {
    const property = validProperty({
      description: "Casa boa",
      fullDescription:
        "**Casa térrea** reformada, com três dormitórios, sendo uma suíte, cozinha integrada e pátio nos fundos.",
    });
    expect(checkOlxReadiness(property)).toEqual([]);
  });
});
