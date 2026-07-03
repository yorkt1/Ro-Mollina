type DataLayerValue = Record<string, string | number | boolean>;

declare global {
  interface Window {
    dataLayer?: DataLayerValue[];
  }
}

export function pushDataLayerEvent(
  event: string,
  parameters: DataLayerValue = {},
) {
  if (typeof window === "undefined") return;

  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({
    event,
    ...parameters,
  });
}

export function trackLeadFormSuccess() {
  pushDataLayerEvent("generate_lead", {
    form_id: "property_listing_form",
    form_name: "Negocie seu imóvel",
    lead_source: "website",
    page_path: `${window.location.pathname}${window.location.search}`,
  });
}

export function trackWhatsAppClick(linkLocation: string) {
  pushDataLayerEvent("whatsapp_click", {
    link_location: linkLocation,
    page_path: `${window.location.pathname}${window.location.search}`,
  });
}
