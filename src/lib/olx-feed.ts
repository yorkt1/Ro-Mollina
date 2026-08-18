/**
 * Espelho, no front-end, das regras que o feed /vrsync.xml aplica para montar
 * cada anúncio do Grupo OLX (OLX Imóveis / ZAP / VivaReal).
 *
 * Por que existe: o painel precisa avisar ANTES que um imóvel marcado vai ser
 * recusado pelo portal — uma vaga do plano parada por falta de CEP ou de fotos
 * é dinheiro parado. A validação de verdade continua sendo a de `api/vrsync.js`;
 * aqui só reproduzimos os mesmos critérios para exibir a pendência.
 *
 * As duas cópias são amarradas por `src/test/olx-feed.test.ts`, que compara este
 * módulo com o `buildListing()` da função serverless — se uma regra mudar de um
 * lado e não do outro, o teste quebra.
 */

import type { Property } from "@/data/properties";
import {
  STATE_ABBREVIATIONS,
  VRSYNC_PROPERTY_TYPE_KEYS,
  normalizeTypeKey,
} from "@/lib/olx-property-types";

/** Anúncios simultâneos contratados no Canal Pro. Igual ao corte do feed. */
export const OLX_PLAN_LIMIT = 10;

/** Mínimos da spec do VRSync. */
const TITLE_MIN = 10;
const DESCRIPTION_MIN = 50;
const MIN_IMAGES = 5;

function stripHtml(value: string | undefined | null) {
  return String(value ?? "")
    .replace(/<[^>]*>/g, " ")
    .replace(/[ \t]+/g, " ")
    .trim();
}

/** Mesma limpeza do feed: markdown vira texto antes de medir o tamanho. */
function plainDescription(value: string | undefined | null) {
  return stripHtml(value)
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/\*\*([^*\n]+)\*\*/g, "$1")
    .replace(/(^|[^*])\*([^*\n]+)\*/g, "$1$2")
    .replace(/\s*\n\s*/g, " ")
    .trim();
}

/** O portal só importa JPG; o resto o feed converte via Cloudinary. */
export function isFeedImage(url: string) {
  const raw = String(url ?? "").trim();
  if (!raw) return false;
  if (raw.includes("res.cloudinary.com") && raw.includes("/image/upload/")) return true;
  return /\.jpe?g(\?|$)/i.test(raw);
}

/** "Cidade/UF" com sigla de estado conhecida. */
export function hasValidCityState(location: string | undefined) {
  const [city = "", uf = ""] = String(location ?? "").split("/");
  return Boolean(city.trim()) && STATE_ABBREVIATIONS.has(uf.trim().toUpperCase());
}

export function hasValidCep(cep: string | undefined) {
  return String(cep ?? "").replace(/\D/g, "").length === 8;
}

/**
 * Lista o que impede o imóvel de virar anúncio. Vazio = pronto para publicar.
 * O texto vai direto para a tela, então é escrito para a corretora, não para log.
 */
export function checkOlxReadiness(property: Property): string[] {
  const pending: string[] = [];

  if (stripHtml(property.title).length < TITLE_MIN) {
    pending.push("Título com menos de 10 caracteres");
  }

  const description = [property.fullDescription, property.description]
    .map(plainDescription)
    .find((text) => text.length >= DESCRIPTION_MIN);
  if (!description) pending.push("Descrição com menos de 50 caracteres");

  if (!(Number(property.price) > 0)) pending.push("Preço não informado");

  if (!VRSYNC_PROPERTY_TYPE_KEYS.has(normalizeTypeKey(property.type))) {
    pending.push(`Tipo "${property.type}" não tem equivalente no OLX`);
  }

  if (!hasValidCityState(property.location)) {
    pending.push('Cidade/UF fora do padrão "Cidade/UF"');
  }
  if (!String(property.neighborhood ?? "").trim()) pending.push("Bairro não informado");
  if (!hasValidCep(property.cep)) pending.push("CEP ausente ou inválido");

  const images = (property.images ?? []).filter(isFeedImage);
  if (images.length < MIN_IMAGES) {
    pending.push(`${images.length} foto(s) válida(s) — o mínimo é 5`);
  }

  const livingArea = Number(property.area) || Number(property.builtArea) || 0;
  const lotArea = Number(property.landArea) || Number(property.totalArea) || 0;
  if (livingArea <= 0 && lotArea <= 0) pending.push("Nenhuma metragem informada");

  return pending;
}
