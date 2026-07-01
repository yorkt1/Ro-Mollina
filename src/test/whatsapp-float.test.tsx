import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { MemoryRouter } from "react-router-dom";
import WhatsAppFloat from "@/components/WhatsAppFloat";

describe("WhatsAppFloat", () => {
  it("links every public page to Ro Molina's WhatsApp", () => {
    const markup = renderToStaticMarkup(
      <MemoryRouter initialEntries={["/comprar"]}>
        <WhatsAppFloat />
      </MemoryRouter>,
    );

    expect(markup).toContain("wa.me/5548988627634");
    expect(markup).toContain('aria-label="Falar com Ro Molina pelo WhatsApp"');
  });

  it("does not cover the administration panel", () => {
    const markup = renderToStaticMarkup(
      <MemoryRouter initialEntries={["/admin/imoveis"]}>
        <WhatsAppFloat />
      </MemoryRouter>,
    );

    expect(markup).not.toContain("wa.me/5548988627634");
  });
});
