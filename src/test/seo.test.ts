import { describe, expect, it } from "vitest";

import { resolveSeoImageUrl } from "../lib/seo";

describe("resolveSeoImageUrl", () => {
  it("converte imagem relativa em URL absoluta para preview do compartilhamento", () => {
    expect(resolveSeoImageUrl("/assets/imovel.jpg", "https://www.romolinaimoveis.com.br")).toBe(
      "https://www.romolinaimoveis.com.br/assets/imovel.jpg",
    );
  });

  it("mantém a URL absoluta quando já vem completa", () => {
    expect(resolveSeoImageUrl("https://cdn.exemplo.com/foto.jpg", "https://www.romolinaimoveis.com.br")).toBe(
      "https://cdn.exemplo.com/foto.jpg",
    );
  });
});
