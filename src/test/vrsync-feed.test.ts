import { describe, expect, it } from "vitest";
// @ts-expect-error — função serverless em JS, sem tipos.
import {
  buildFeed,
  buildListing,
  clampTitle,
  formatCep,
  formatDescription,
  parseCityState,
  toJpgUrl,
  truncateFormatted,
} from "../../api/vrsync.js";

/** Imóvel mínimo que atende a todas as exigências do VRSync. */
function validProperty(overrides: Record<string, unknown> = {}) {
  return {
    id: "27ded4ce-ccf2-4299-af6d-8d18bc451f5c",
    short_id: 12,
    ref_code: "RM0001",
    title: "Casa térrea à venda no bairro Monte Verde",
    description: "Casa térrea com três dormitórios, pátio amplo e garagem coberta para dois carros.",
    full_description: null,
    price: 575000,
    purpose: "venda",
    type: "casa",
    location: "Florianópolis/SC",
    neighborhood: "Monte Verde",
    street: "Rua Ibatingui",
    address_number: "130",
    cep: "88032520",
    area: 120,
    land_area: 250,
    bedrooms: 3,
    bathrooms: 2,
    suites: 1,
    parking_spots: 2,
    images: Array.from({ length: 6 }, (_, i) =>
      `https://res.cloudinary.com/ddan59hgh/image/upload/v177713911${i}/properties/foto${i}.jpg`
    ),
    ...overrides,
  };
}

describe("vrsync — helpers", () => {
  it("corta o título em 100 caracteres sem partir palavra", () => {
    const long =
      "Casa em condomínio de alto padrão com 3 dormitórios à venda no Condomínio Ilha das Laranjeiras – Florianópolis";
    const result = clampTitle(long);

    expect(result.length).toBeLessThanOrEqual(100);
    expect(result).toBe(
      "Casa em condomínio de alto padrão com 3 dormitórios à venda no Condomínio Ilha das Laranjeiras"
    );
  });

  it("formata o CEP e rejeita valor incompleto", () => {
    expect(formatCep("88032520")).toBe("88032-520");
    expect(formatCep("88032-520")).toBe("88032-520");
    expect(formatCep("8803")).toBeNull();
    expect(formatCep(null)).toBeNull();
  });

  it("separa cidade e UF do campo location", () => {
    expect(parseCityState("Florianópolis/SC")).toEqual({
      city: "Florianópolis",
      abbreviation: "SC",
      state: "Santa Catarina",
    });
    expect(parseCityState("Florianópolis")).toBeNull();
  });

  it("converte imagens do Cloudinary para JPG e limita a largura", () => {
    expect(toJpgUrl("https://res.cloudinary.com/ddan59hgh/image/upload/v1779807327/properties/foto.heic")).toBe(
      "https://res.cloudinary.com/ddan59hgh/image/upload/q_auto:good,w_1920,c_limit/v1779807327/properties/foto.jpg"
    );
  });

  it("descarta imagem fora do Cloudinary que não seja JPG", () => {
    expect(toJpgUrl("https://exemplo.com/foto.png")).toBeNull();
    expect(toJpgUrl("https://exemplo.com/foto.jpg")).toBe("https://exemplo.com/foto.jpg");
  });

  it("converte o markdown da descrição para as tags aceitas pelo portal", () => {
    expect(formatDescription("**Destaques do imóvel:**\nCasa nova")).toBe(
      "<b>Destaques do imóvel:</b><br>Casa nova"
    );
    expect(formatDescription("## Sobre\nTexto")).toBe("Sobre<br>Texto");
    expect(formatDescription("Imóvel <script>alerta</script> novo")).toBe("Imóvel alerta novo");
  });

  it("fecha a tag quando a descrição estoura o limite", () => {
    expect(truncateFormatted("<b>abcdefghij</b>", 8)).toBe("<b>abcde</b>");
  });
});

describe("vrsync — montagem do anúncio", () => {
  it("gera o Listing completo para um imóvel válido", () => {
    const { xml, skipped } = buildListing(validProperty());

    expect(skipped).toBeUndefined();
    expect(xml).toContain("<ListingID>RM0001</ListingID>");
    expect(xml).toContain("<TransactionType>For Sale</TransactionType>");
    expect(xml).toContain("<PropertyType>Residential / Home</PropertyType>");
    expect(xml).toContain('<ListPrice currency="BRL">575000</ListPrice>');
    expect(xml).toContain('<LivingArea unit="square metres">120</LivingArea>');
    expect(xml).toContain("<PostalCode>88032-520</PostalCode>");
    expect(xml).toContain('<Location displayAddress="All">');
    expect(xml).toContain('primary="true"');
  });

  it("usa RentalPrice mensal quando o imóvel é de aluguel", () => {
    const { xml } = buildListing(validProperty({ purpose: "aluguel", price: 2800 }));
    expect(xml).toContain('<RentalPrice currency="BRL" period="Monthly">2800</RentalPrice>');
  });

  it("envia terreno com LotArea e sem quartos", () => {
    const { xml } = buildListing(
      validProperty({ type: "terreno", area: null, land_area: 297, bedrooms: 0, bathrooms: 0 })
    );

    expect(xml).toContain("<PropertyType>Residential / Land Lot</PropertyType>");
    expect(xml).toContain('<LotArea unit="square metres">297</LotArea>');
    expect(xml).not.toContain("<Bedrooms>");
  });

  it("reduz displayAddress quando falta o número", () => {
    const { xml } = buildListing(validProperty({ address_number: null }));
    expect(xml).toContain('<Location displayAddress="Street">');
  });

  it("lista as pendências em vez de gerar um anúncio inválido", () => {
    const { xml, skipped } = buildListing(
      validProperty({ cep: null, images: [], area: null, land_area: null })
    );

    expect(xml).toBeUndefined();
    expect(skipped).toContain("CEP ausente ou inválido");
    expect(skipped).toContain("0 foto(s) — o mínimo é 5");
    expect(skipped).toContain("nenhuma metragem informada");
  });

  it("aponta tipo de imóvel sem equivalente no VRSync", () => {
    const { skipped } = buildListing(validProperty({ type: "nave espacial" }));
    expect(skipped).toContain('tipo "nave espacial" sem equivalente no VRSync');
  });
});

describe("vrsync — feed", () => {
  it("monta o envelope com Header e só os imóveis válidos", () => {
    const { xml, incluidos, excluidos } = buildFeed([
      validProperty(),
      validProperty({ id: "outro", ref_code: "RM0002", cep: null }),
    ]);

    expect(incluidos).toBe(1);
    expect(excluidos).toHaveLength(1);
    expect(excluidos[0].pendencias).toContain("CEP ausente ou inválido");
    expect(xml).toContain('xmlns="http://www.vivareal.com/schemas/1.0/VRSync"');
    expect(xml).toContain("<Header>");
    expect(xml.match(/<Listing>/g)).toHaveLength(1);
  });

  it("não deixa passar dois anúncios com o mesmo código de referência", () => {
    const { incluidos, excluidos } = buildFeed([
      validProperty(),
      validProperty({ id: "outro", short_id: 13 }),
    ]);

    expect(incluidos).toBe(1);
    expect(excluidos[0].pendencias[0]).toContain("duplicado");
  });
});
