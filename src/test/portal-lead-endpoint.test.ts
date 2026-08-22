import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Contrato do endpoint que o Canal Pro chama (/api/leads/grupozap).
 *
 * O que está sendo travado aqui é o código HTTP de cada situação, porque é ele
 * que decide o destino do lead: 2xx encerra a entrega, e qualquer outra coisa
 * faz o portal reenviar (3 tentativas, guardando o lead por 14 dias). Devolver
 * 400 numa falha temporária jogaria fora um contato real.
 */

const SECRET = "segredo-de-teste";

interface MockResponse {
  statusCode: number;
  body: unknown;
  headers: Record<string, string>;
}

function mockRes() {
  const res: MockResponse & {
    status: (code: number) => typeof res;
    json: (body: unknown) => typeof res;
    setHeader: (key: string, value: string) => void;
  } = {
    statusCode: 0,
    body: null,
    headers: {},
    status(code) {
      res.statusCode = code;
      return res;
    },
    json(body) {
      res.body = body;
      return res;
    },
    setHeader(key, value) {
      res.headers[key] = value;
    },
  };
  return res;
}

function mockReq(overrides: Record<string, unknown> = {}) {
  return {
    method: "POST",
    url: "/api/leads/grupozap",
    headers: { host: "romolinaimoveis.com.br" },
    body: {
      leadOrigin: "Grupo OLX",
      originLeadId: "59ee0fc6e4b043e1b2a6d863",
      clientListingId: "12",
      name: "Nome Consumidor",
      email: "nome@email.com",
      ddd: "48",
      phone: "988627634",
      message: "Tenho interesse neste imóvel",
      temperature: "Alta",
      transactionType: "SELL",
      extraData: { leadType: "CONTACT_FORM" },
    },
    ...overrides,
  };
}

async function loadHandler() {
  vi.resetModules();
  // @ts-expect-error — função serverless em JS, sem tipos.
  const mod = await import("../../api/leads/grupozap.js");
  return mod.default;
}

function stubSupabaseOk(payload: Record<string, unknown> = { id: "lead-1", duplicate: false }) {
  const fetchMock = vi.fn().mockResolvedValue({
    ok: true,
    status: 200,
    text: async () => JSON.stringify(payload),
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

beforeEach(() => {
  vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "service-role-de-teste");
  vi.stubEnv("GRUPOZAP_LEAD_SECRET", SECRET);
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("POST /api/leads/grupozap", () => {
  it("grava o lead e responde 200", async () => {
    const fetchMock = stubSupabaseOk();
    const handler = await loadHandler();
    const res = mockRes();

    await handler(mockReq({ url: `/api/leads/grupozap?token=${SECRET}` }), res);

    expect(res.statusCode).toBe(200);
    expect(res.body).toMatchObject({ received: true, id: "lead-1", duplicate: false });

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toContain("/rest/v1/rpc/ingest_portal_lead");
    expect(JSON.parse(init.body)).toMatchObject({
      p_external_id: "59ee0fc6e4b043e1b2a6d863",
      p_client_listing_id: "12",
      p_phone: "(48) 98862-7634",
      p_source: "Grupo OLX",
      p_interest: "venda",
    });
  });

  it("responde 200 também no reenvio já conhecido", async () => {
    stubSupabaseOk({ id: "lead-1", duplicate: true });
    const handler = await loadHandler();
    const res = mockRes();

    await handler(mockReq({ url: `/api/leads/grupozap?token=${SECRET}` }), res);

    expect(res.statusCode).toBe(200);
    expect(res.body).toMatchObject({ duplicate: true });
  });

  it("aceita o token por Basic Auth, como na documentação", async () => {
    stubSupabaseOk();
    const handler = await loadHandler();
    const res = mockRes();
    const basic = Buffer.from(`grupozap:${SECRET}`).toString("base64");

    await handler(
      mockReq({ headers: { host: "romolinaimoveis.com.br", authorization: `Basic ${basic}` } }),
      res,
    );

    expect(res.statusCode).toBe(200);
  });

  it("aceita o token pelo header X-API-KEY", async () => {
    stubSupabaseOk();
    const handler = await loadHandler();
    const res = mockRes();

    await handler(
      mockReq({ headers: { host: "romolinaimoveis.com.br", "x-api-key": SECRET } }),
      res,
    );

    expect(res.statusCode).toBe(200);
  });

  it("recusa token errado com 401 e não toca no banco", async () => {
    const fetchMock = stubSupabaseOk();
    const handler = await loadHandler();
    const res = mockRes();

    await handler(mockReq({ url: "/api/leads/grupozap?token=errado" }), res);

    expect(res.statusCode).toBe(401);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("aceita sem token quando nenhum segredo está configurado", async () => {
    vi.stubEnv("GRUPOZAP_LEAD_SECRET", "");
    stubSupabaseOk();
    const handler = await loadHandler();
    const res = mockRes();

    await handler(mockReq(), res);

    expect(res.statusCode).toBe(200);
  });

  it("recusa com 400 o corpo que não dá para aproveitar", async () => {
    const fetchMock = stubSupabaseOk();
    const handler = await loadHandler();
    const res = mockRes();

    await handler(
      mockReq({ url: `/api/leads/grupozap?token=${SECRET}`, body: { message: "sem contato" } }),
      res,
    );

    expect(res.statusCode).toBe(400);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("devolve 500 quando o banco falha, para o portal reenviar", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: false, status: 503, text: async () => "indisponível" }),
    );
    const handler = await loadHandler();
    const res = mockRes();

    await handler(mockReq({ url: `/api/leads/grupozap?token=${SECRET}` }), res);

    expect(res.statusCode).toBe(500);
  });

  it("devolve 500 — e não 400 — quando falta a chave de gravação", async () => {
    // 400 faria o portal desistir; 500 mantém o reenvio até a variável existir.
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "");
    stubSupabaseOk();
    const handler = await loadHandler();
    const res = mockRes();

    await handler(mockReq({ url: `/api/leads/grupozap?token=${SECRET}` }), res);

    expect(res.statusCode).toBe(500);
  });
});

describe("outros métodos", () => {
  it("GET mostra o estado da integração sem exigir token", async () => {
    const handler = await loadHandler();
    const res = mockRes();

    await handler(mockReq({ method: "GET" }), res);

    expect(res.statusCode).toBe(200);
    expect(res.body).toMatchObject({ configured: true, authenticated: true });
  });

  it("PUT responde 405", async () => {
    const handler = await loadHandler();
    const res = mockRes();

    await handler(mockReq({ method: "PUT" }), res);

    expect(res.statusCode).toBe(405);
    expect(res.headers.Allow).toBe("POST");
  });
});
