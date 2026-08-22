import { describe, expect, it } from "vitest";
// @ts-expect-error — função serverless em JS, sem tipos.
import {
  formatPhone,
  mapInterest,
  mapPortalLead,
  mapSource,
  normalizeTemperature,
} from "../../api/_portal-lead.js";

/** Exemplo publicado na spec do webhook do Grupo OLX, copiado sem alteração. */
const docLead = {
  leadOrigin: "Grupo OLX",
  timestamp: "2017-10-23T15:50:30.619Z",
  originLeadId: "59ee0fc6e4b043e1b2a6d863",
  originListingId: "87027856",
  clientListingId: "a40171",
  name: "Nome Consumidor",
  email: "Nome.Consumidor@Email.com",
  ddd: "11",
  phone: "999999999",
  phoneNumber: "11999999999",
  message: "Olá, tenho interesse neste imóvel...",
  temperature: "Alta",
  transactionType: "SELL",
  extraData: {
    leadCerto: true,
    izi: "Visualize o histórico...",
    feedback: "Sua opinião é muito importante...",
    leadType: "CONTACT_CHAT",
  },
};

/** Exemplo de lead do Minha Casa Minha Vida, também da spec. */
const docMcmvLead = {
  leadOrigin: "MCMV_OLX",
  timestamp: "2026-07-10T10:15:30.000Z",
  originLeadId: "mcmv-1234567890",
  name: "João da Silva",
  email: "joao.silva@example.com",
  ddd: "11",
  phone: "987654321",
  message: "Simulação de financiamento MCMV realizada no portal.",
  temperature: "Média",
  transactionType: "SELL",
  extraData: {
    mcmv: {
      sellerDocument: "12345678000190",
      unitType: "APARTMENT",
      propertyLocation: { state: "SP", city: "São Paulo" },
      propertyValue: 250000,
      subsidyRange: "FAIXA_1",
      urgencyToBuy: "ALTA",
      documentType: "CPF",
      hasMinimumFgtsContribution: true,
      downPayment: 20000,
      estimatedFinancingAmount: 230000,
    },
  },
};

describe("mapPortalLead — lead de anúncio", () => {
  const { ok, lead } = mapPortalLead(docLead);

  it("aceita o payload da documentação", () => {
    expect(ok).toBe(true);
  });

  it("guarda o originLeadId para deduplicar reenvios", () => {
    expect(lead.p_external_id).toBe("59ee0fc6e4b043e1b2a6d863");
  });

  it("separa os dois ids de anúncio", () => {
    expect(lead.p_origin_listing_id).toBe("87027856");
    expect(lead.p_client_listing_id).toBe("a40171");
  });

  it("normaliza contato", () => {
    expect(lead.p_name).toBe("Nome Consumidor");
    expect(lead.p_email).toBe("nome.consumidor@email.com");
    expect(lead.p_phone).toBe("(11) 99999-9999");
  });

  it("mapeia origem, interesse e temperatura", () => {
    expect(lead.p_source).toBe("Grupo OLX");
    expect(lead.p_interest).toBe("venda");
    expect(lead.p_temperature).toBe("Alta");
    expect(lead.p_lead_type).toBe("CONTACT_CHAT");
  });

  it("preserva a mensagem do consumidor", () => {
    expect(lead.p_message).toBe("Olá, tenho interesse neste imóvel...");
  });

  it("leva os extras do portal para marketing_data", () => {
    expect(lead.p_marketing_data).toMatchObject({
      lead_origin: "Grupo OLX",
      lead_type: "CONTACT_CHAT",
      origin_lead_id: "59ee0fc6e4b043e1b2a6d863",
      client_listing_id: "a40171",
      lead_certo: "sim",
      portal_timestamp: "2017-10-23T15:50:30.619Z",
    });
  });
});

describe("mapPortalLead — lead do MCMV", () => {
  const { ok, lead } = mapPortalLead(docMcmvLead);

  it("aceita o lead mesmo sem clientListingId", () => {
    // A spec é explícita: leads de MCMV não trazem anúncio, e recusar com 4xx
    // faria o portal reenviar três vezes até desistir do contato.
    expect(ok).toBe(true);
    expect(lead.p_client_listing_id).toBeNull();
  });

  it("marca a origem separada dos leads de anúncio", () => {
    expect(lead.p_source).toBe("MCMV");
  });

  it("usa a simulação como faixa de valor", () => {
    expect(lead.p_budget).toContain("250.000");
  });

  it("guarda os dados da simulação", () => {
    expect(lead.p_marketing_data).toMatchObject({
      mcmv_cidade: "São Paulo",
      mcmv_uf: "SP",
      mcmv_faixa: "FAIXA_1",
    });
    expect(lead.p_marketing_data.mcmv_entrada).toContain("20.000");
  });
});

describe("mapPortalLead — casos de borda", () => {
  it("recusa corpo que não é objeto", () => {
    expect(mapPortalLead(null).ok).toBe(false);
    expect(mapPortalLead("texto").ok).toBe(false);
    expect(mapPortalLead([]).ok).toBe(false);
  });

  it("recusa lead sem nenhuma forma de contato", () => {
    expect(mapPortalLead({ leadOrigin: "Grupo OLX", message: "oi" }).ok).toBe(false);
  });

  it("aceita lead com telefone mas sem e-mail", () => {
    const { ok, lead } = mapPortalLead({ name: "Ana", ddd: "48", phone: "988627634" });
    expect(ok).toBe(true);
    expect(lead.p_email).toBeNull();
    expect(lead.p_phone).toBe("(48) 98862-7634");
  });

  it("descreve o contato quando o portal não manda mensagem", () => {
    const { lead } = mapPortalLead({
      name: "Ana",
      ddd: "48",
      phone: "988627634",
      clientListingId: "12",
      extraData: { leadType: "CLICK_WHATSAPP" },
    });
    expect(lead.p_message).toBe("Contato por whatsapp no anúncio 12.");
  });

  it("aluguel vem de transactionType RENT", () => {
    expect(mapInterest("RENT")).toBe("aluguel");
    expect(mapInterest("SELL")).toBe("venda");
    expect(mapInterest(undefined)).toBe("venda");
  });

  it("origem desconhecida cai em Grupo OLX", () => {
    expect(mapSource("MCMV_OLX")).toBe("MCMV");
    expect(mapSource("Grupo OLX")).toBe("Grupo OLX");
    expect(mapSource(undefined)).toBe("Grupo OLX");
  });

  it("temperatura fora da escala vira nulo", () => {
    expect(normalizeTemperature("média")).toBe("Média");
    expect(normalizeTemperature("MORNA")).toBeNull();
    expect(normalizeTemperature(undefined)).toBeNull();
  });
});

describe("formatPhone", () => {
  it("monta celular a partir de ddd + phone", () => {
    expect(formatPhone({ ddd: "48", phone: "988627634" })).toBe("(48) 98862-7634");
  });

  it("monta fixo de 8 dígitos", () => {
    expect(formatPhone({ ddd: "48", phone: "32345678" })).toBe("(48) 3234-5678");
  });

  it("usa o phoneNumber obsoleto quando ddd e phone faltam", () => {
    expect(formatPhone({ phoneNumber: "11999999999" })).toBe("(11) 99999-9999");
  });

  it("descarta o código do país", () => {
    expect(formatPhone({ phoneNumber: "5548988627634" })).toBe("(48) 98862-7634");
  });

  it("limpa máscara que o portal mandar formatada", () => {
    expect(formatPhone({ ddd: "(48)", phone: "98862-7634" })).toBe("(48) 98862-7634");
  });

  it("devolve nulo quando não há telefone", () => {
    expect(formatPhone({})).toBeNull();
    expect(formatPhone()).toBeNull();
  });
});
