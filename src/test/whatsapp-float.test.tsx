import { act } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { createRoot } from "react-dom/client";
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

  it("tracks clicks on the floating button in the data layer", () => {
    window.dataLayer = [];
    window.history.replaceState({}, "", "/comprar");
    const container = document.createElement("div");
    const root = createRoot(container);

    act(() => {
      root.render(
        <MemoryRouter initialEntries={["/comprar"]}>
          <WhatsAppFloat />
        </MemoryRouter>,
      );
    });

    const link = container.querySelector<HTMLAnchorElement>(
      '[data-gtm-link="whatsapp_float"]',
    );
    act(() => {
      link?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    expect(window.dataLayer).toContainEqual({
      event: "whatsapp_click",
      link_location: "floating_button",
      page_path: "/comprar",
    });

    act(() => root.unmount());
  });
});
