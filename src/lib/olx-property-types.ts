/**
 * Cópia, no front-end, das listas fechadas que o VRSync aceita — tipos de
 * imóvel e siglas de estado. O de-para completo (com o valor final enviado ao
 * portal) vive em `api/_vrsync-maps.js`, que roda na função serverless e não
 * pode ser importado pelo bundle do site.
 *
 * `src/test/olx-feed.test.ts` compara as duas listas: acrescentar um tipo lá e
 * esquecer aqui quebra o teste.
 */

/** Mesma normalização de `api/_vrsync-maps.js`: minúsculo, sem acento e sem pontuação. */
export function normalizeTypeKey(value: string | undefined | null) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

/** Tipos do nosso cadastro que têm equivalente em PropertyType. */
export const VRSYNC_PROPERTY_TYPE_KEYS = new Set([
  // Residencial
  "casa",
  "casa em condominio",
  "casa de condominio",
  "casa em loteamento",
  "casa terrea",
  "casa de vila",
  "casa loft",
  "loft",
  "apartamento",
  "apartamento garden",
  "cobertura",
  "sobrado",
  "flat",
  "kitnet",
  "studio",
  "sitio",
  "fazenda",
  "chacara",
  // Terrenos
  "terreno",
  "lote",
  "terreno em condominio",
  "terreno em loteamento",
  // Comercial
  "ponto comercial",
  "loja",
  "salao",
  "sala",
  "sala comercial",
  "conjunto comercial",
  "predio comercial",
  "predio inteiro",
  "galpao",
  "deposito",
  "armazem",
  "consultorio",
  "garagem",
  "hotel",
  "pousada",
  "motel",
]);

/** Siglas aceitas no elemento State. */
export const STATE_ABBREVIATIONS = new Set([
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS",
  "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC",
  "SP", "SE", "TO",
]);
