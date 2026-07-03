import { beforeEach, describe, expect, it } from "vitest";
import {
  pushDataLayerEvent,
  trackLeadFormSuccess,
  trackWhatsAppClick,
} from "@/lib/analytics";

describe("analytics dataLayer events", () => {
  beforeEach(() => {
    window.dataLayer = [];
    window.history.replaceState({}, "", "/negocie-seu-imovel?utm_source=test");
  });

  it("pushes a lead event without personal data", () => {
    trackLeadFormSuccess();

    expect(window.dataLayer).toEqual([
      {
        event: "generate_lead",
        form_id: "property_listing_form",
        form_name: "Negocie seu imóvel",
        lead_source: "website",
        page_path: "/negocie-seu-imovel?utm_source=test",
      },
    ]);
  });

  it("pushes a WhatsApp click event with its location", () => {
    trackWhatsAppClick("floating_button");

    expect(window.dataLayer).toEqual([
      {
        event: "whatsapp_click",
        link_location: "floating_button",
        page_path: "/negocie-seu-imovel?utm_source=test",
      },
    ]);
  });

  it("preserves events already present in the data layer", () => {
    window.dataLayer = [{ event: "existing_event" }];

    pushDataLayerEvent("new_event");

    expect(window.dataLayer).toHaveLength(2);
  });
});
