type DataLayerValue = Record<string, string | number | boolean>;

declare global {
  interface Window {
    dataLayer?: DataLayerValue[];
    gtag?: (...args: any[]) => void;
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

const GOOGLE_ADS_CONVERSION_SEND_TO = "AW-18281666046/nGA7CNH1otocEP6rsI1E";

function triggerGoogleAdsConversion() {
  if (typeof window !== "undefined" && typeof window.gtag === "function") {
    window.gtag("event", "conversion", {
      send_to: GOOGLE_ADS_CONVERSION_SEND_TO,
    });
  }
}

export function trackLeadFormSuccess() {
  pushDataLayerEvent("generate_lead", {
    form_id: "property_listing_form",
    form_name: "Negocie seu imóvel",
    lead_source: "website",
    page_path: `${window.location.pathname}${window.location.search}`,
  });
  triggerGoogleAdsConversion();
}

export function trackWhatsAppClick(linkLocation: string) {
  pushDataLayerEvent("whatsapp_click", {
    link_location: linkLocation,
    page_path: `${window.location.pathname}${window.location.search}`,
  });
  triggerGoogleAdsConversion();
}
