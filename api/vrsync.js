/**
 * Função serverless (Vercel) — gera o feed XML no padrão VRSync do Grupo OLX
 * (ZAP Imóveis / VivaReal / OLX Imóveis).
 *
 * Como funciona a integração: não há push nem API com credenciais. Um robô do
 * Grupo OLX (User-Agent "VivaRealBot/1.0") baixa esta URL a cada 12 horas e
 * importa os anúncios. A URL precisa ser cadastrada no Canal Pro da conta.
 *
 * Spec: https://developers.grupozap.com/feeds/xml-formats/
 * Roteamento: ver vercel.json — /vrsync.xml → /api/vrsync
 *
 * O feed publica apenas os imóveis marcados no painel (/admin/olx), até o
 * limite de anúncios do plano contratado. Imóveis com cadastro incompleto são
 * deixados de fora (o portal rejeitaria o arquivo inteiro ou o anúncio
 * individual). Para ver o que ficou de fora e por quê, acesse
 * /vrsync.xml?relatorio=1 — devolve JSON em vez de XML.
 */

import {
  LOT_AREA_TYPES,
  NO_ROOMS_TYPES,
  STATE_NAMES,
  resolveFeatures,
  resolvePropertyType,
  resolveUsageType,
} from "./_vrsync-maps.js";

const SUPABASE_URL =
  process.env.VITE_SUPABASE_URL || "https://kujwgpumdggggbnxuhem.supabase.co";
const SUPABASE_ANON_KEY =
  process.env.VITE_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt1andncHVtZGdnZ2dibnh1aGVtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYxNzgyNzIsImV4cCI6MjA5MTc1NDI3Mn0.if2iY21S6reNWF0b3SfJ02jCarorP1DRamW0SI2knTU";

const SITE_URL = (process.env.VITE_SITE_URL || "https://www.romolinaimoveis.com.br").replace(/\/$/, "");

/**
 * Anúncios simultâneos do plano contratado no Canal Pro. O corte também é feito
 * aqui, e não só no painel, para que uma marcação a mais no banco nunca vire um
 * anúncio acima do plano (o portal cobraria ou recusaria o excedente).
 */
export const OLX_PLAN_LIMIT = Number(process.env.OLX_PLAN_LIMIT) || 10;

/** Dados da imobiliária que vão em Header e ContactInfo. */
const AGENCY = {
  name: process.env.VRSYNC_AGENCY_NAME || "Ro Molina Imóveis",
  email: process.env.VRSYNC_AGENCY_EMAIL || "romolinaimoveis@gmail.com",
  phone: process.env.VRSYNC_AGENCY_PHONE || "(48) 98862-7634",
  contactName: process.env.VRSYNC_CONTACT_NAME || "Ro Molina",
  website: process.env.VRSYNC_AGENCY_WEBSITE || SITE_URL,
};

/** Limites da spec do VRSync. */
const TITLE_MAX = 100;
const TITLE_MIN = 10;
const DESCRIPTION_MIN = 50;
const DESCRIPTION_MAX = 3000;
const MIN_IMAGES = 5;
const MAX_IMAGES = 30;

const COLUMNS = [
  "id", "short_id", "ref_code", "title", "description", "full_description",
  "price", "purpose", "type", "location", "neighborhood", "zone", "street",
  "address_number", "cep", "area", "built_area", "land_area", "total_area",
  "bedrooms", "bathrooms", "suites", "parking_spots", "images", "video_url",
  "leisure", "nearby", "furnished", "created_at", "olx_enabled", "olx_enabled_at",
].join(",");

/* ------------------------------------------------------------------ *
 * Helpers de texto                                                     *
 * ------------------------------------------------------------------ */

const ACCENT_MAP = {
  á: "a", à: "a", â: "a", ã: "a", ä: "a",
  é: "e", è: "e", ê: "e", ë: "e",
  í: "i", ì: "i", î: "i", ï: "i",
  ó: "o", ò: "o", ô: "o", õ: "o", ö: "o",
  ú: "u", ù: "u", û: "u", ü: "u",
  ç: "c", ñ: "n",
};

/** Mesmo slug usado em /sitemap.xml e nas URLs públicas do site. */
function propertySlug(property) {
  const normalize = (value) =>
    String(value || "")
      .normalize("NFD")
      .replace(/[\/]+/g, "-")
      .replace(/[^\w\s-]/g, (char) => ACCENT_MAP[char] ?? "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "")
      .toLowerCase();

  const compactTitle = normalize(property.title).split("-").filter(Boolean).slice(0, 3).join("-");
  return [compactTitle, normalize(property.neighborhood)].filter(Boolean).join("-");
}

export function xmlEsc(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/**
 * A spec recomenda CDATA nos campos de texto livre para não quebrar a
 * importação com caracteres especiais. O único conteúdo proibido dentro de
 * CDATA é o próprio terminador.
 */
export function cdata(value) {
  return `<![CDATA[${String(value ?? "").replace(/]]>/g, "]] >")}]]>`;
}

/** Remove tags HTML e normaliza espaços — Title não aceita HTML. */
export function stripHtml(value) {
  return String(value ?? "")
    .replace(/<[^>]*>/g, " ")
    .replace(/[ \t]+/g, " ")
    .trim();
}

/** Corta o título em 100 caracteres sem partir palavra no meio. */
export function clampTitle(value) {
  const clean = stripHtml(value).replace(/\s*\n\s*/g, " ");
  if (clean.length <= TITLE_MAX) return clean;

  const cut = clean.slice(0, TITLE_MAX);
  const lastSpace = cut.lastIndexOf(" ");
  const trimmed = (lastSpace > TITLE_MIN ? cut.slice(0, lastSpace) : cut).trim();
  // Não deixa o título terminar em pontuação solta depois do corte.
  return trimmed.replace(/[\s\-–—|,;:.]+$/, "");
}

/**
 * A descrição não aceita HTML, com exceção de <br>, <b> e <i>, liberados na
 * seção "Formatação" da spec. Nossas descrições são escritas com markdown
 * leve, então convertemos para o que o portal entende — sem isso os
 * asteriscos apareceriam crus no anúncio.
 */
export function formatDescription(value) {
  return stripHtml(value)
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/\*\*([^*\n]+)\*\*/g, "<b>$1</b>")
    .replace(/(^|[^*])\*([^*\n]+)\*/g, "$1<i>$2</i>")
    .replace(/\s*\n\s*/g, "<br>")
    .trim();
}

/** Corta no limite da spec sem deixar tag pela metade. */
export function truncateFormatted(value, max = DESCRIPTION_MAX) {
  if (value.length <= max) return value;

  let cut = value.slice(0, max).replace(/<[^>]*$/, "");
  for (const tag of ["b", "i"]) {
    const open = (cut.match(new RegExp(`<${tag}>`, "g")) ?? []).length;
    const close = (cut.match(new RegExp(`</${tag}>`, "g")) ?? []).length;
    if (open > close) cut += `</${tag}>`;
  }
  return cut;
}

export function buildDescription(property) {
  const source = [property.full_description, property.description]
    .map(formatDescription)
    .find((value) => value.length >= DESCRIPTION_MIN);

  return source ? truncateFormatted(source) : null;
}

/* ------------------------------------------------------------------ *
 * Helpers de dados                                                     *
 * ------------------------------------------------------------------ */

/** Valores monetários e de área vão inteiros, sem separador. */
export function toInt(value) {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? Math.round(number) : null;
}

/** O campo `location` do banco guarda "Cidade/UF". */
export function parseCityState(location) {
  const [city = "", uf = ""] = String(location ?? "").split("/");
  const abbreviation = uf.trim().toUpperCase();
  if (!city.trim() || !STATE_NAMES[abbreviation]) return null;
  return { city: city.trim(), abbreviation, state: STATE_NAMES[abbreviation] };
}

/** PostalCode obrigatório em todos os anúncios, no formato 00000-000. */
export function formatCep(cep) {
  const digits = String(cep ?? "").replace(/\D/g, "");
  return digits.length === 8 ? `${digits.slice(0, 5)}-${digits.slice(5)}` : null;
}

/**
 * O portal só importa JPG de até 7MB. Nossas fotos estão no Cloudinary, então
 * trocar a extensão por .jpg e limitar a largura resolve .heic/.png e o peso
 * na própria entrega, sem precisar reenviar nada no cadastro.
 */
export function toJpgUrl(url) {
  const raw = String(url ?? "").trim();
  if (!raw) return null;

  if (!raw.includes("res.cloudinary.com") || !raw.includes("/image/upload/")) {
    // Fora do Cloudinary não dá para converter: só passa se já for JPG.
    return /\.jpe?g(\?|$)/i.test(raw) ? raw : null;
  }

  const [prefix, rest] = raw.split("/image/upload/");
  const withoutExtension = rest.replace(/\.[a-z0-9]+(\?.*)?$/i, "");
  return `${prefix}/image/upload/q_auto:good,w_1920,c_limit/${withoutExtension}.jpg`;
}

/** Vídeo só é aceito se estiver no YouTube, e apenas um por imóvel. */
export function youtubeUrl(url) {
  const raw = String(url ?? "").trim();
  return /^https?:\/\/(www\.)?(youtube\.com|youtu\.be)\//i.test(raw) ? raw : null;
}

/* ------------------------------------------------------------------ *
 * Montagem do anúncio                                                  *
 * ------------------------------------------------------------------ */

/**
 * Converte um imóvel do banco em um bloco <Listing>.
 * Devolve { xml } quando o cadastro atende à spec, ou { skipped: [motivos] }
 * quando falta algo que o portal exige.
 */
export function buildListing(property) {
  const missing = [];

  const title = clampTitle(property.title);
  if (title.length < TITLE_MIN) missing.push("título com menos de 10 caracteres");

  const description = buildDescription(property);
  if (!description) missing.push("descrição com menos de 50 caracteres");

  const price = toInt(property.price);
  if (!price) missing.push("preço não informado");

  const propertyType = resolvePropertyType(property.type, { title: property.title });
  if (!propertyType) missing.push(`tipo "${property.type}" sem equivalente no VRSync`);

  const place = parseCityState(property.location);
  if (!place) missing.push("cidade/UF ausente ou fora do padrão \"Cidade/UF\"");
  if (!String(property.neighborhood ?? "").trim()) missing.push("bairro não informado");

  const postalCode = formatCep(property.cep);
  if (!postalCode) missing.push("CEP ausente ou inválido");

  const images = (Array.isArray(property.images) ? property.images : [])
    .map(toJpgUrl)
    .filter(Boolean)
    .slice(0, MAX_IMAGES);
  if (images.length < MIN_IMAGES) missing.push(`${images.length} foto(s) — o mínimo é 5`);

  const usesLotArea = propertyType && LOT_AREA_TYPES.has(propertyType);
  const livingArea = toInt(property.area) ?? toInt(property.built_area);
  const lotArea = toInt(property.land_area) ?? toInt(property.total_area);
  if (!livingArea && !lotArea) missing.push("nenhuma metragem informada");

  if (missing.length) return { skipped: missing };

  /* --- Details --- */
  const details = [
    `<UsageType>${resolveUsageType(propertyType)}</UsageType>`,
    `<PropertyType>${xmlEsc(propertyType)}</PropertyType>`,
    `<Description>${cdata(description)}</Description>`,
    property.purpose === "aluguel"
      ? `<RentalPrice currency="BRL" period="Monthly">${price}</RentalPrice>`
      : `<ListPrice currency="BRL">${price}</ListPrice>`,
  ];

  // Terreno, sítio e galpão informam a área total em LotArea; os demais, a
  // área útil em LivingArea. O portal recusa o anúncio sem nenhuma das duas.
  if (usesLotArea) {
    details.push(`<LotArea unit="square metres">${lotArea ?? livingArea}</LotArea>`);
  } else {
    if (livingArea) details.push(`<LivingArea unit="square metres">${livingArea}</LivingArea>`);
    if (lotArea) details.push(`<LotArea unit="square metres">${lotArea}</LotArea>`);
    if (!livingArea) details.push(`<LivingArea unit="square metres">${lotArea}</LivingArea>`);
  }

  if (!NO_ROOMS_TYPES.has(propertyType)) {
    const bedrooms = toInt(property.bedrooms);
    const bathrooms = toInt(property.bathrooms);
    const suites = toInt(property.suites);
    if (bedrooms) details.push(`<Bedrooms>${bedrooms}</Bedrooms>`);
    if (bathrooms) details.push(`<Bathrooms>${bathrooms}</Bathrooms>`);
    if (suites) details.push(`<Suites>${suites}</Suites>`);
  }

  const garage = toInt(property.parking_spots);
  if (garage) details.push(`<Garage>${garage}</Garage>`);

  const features = resolveFeatures([property.leisure ?? [], property.nearby ?? []], {
    furnished: property.furnished === true,
  });
  if (features.length) {
    details.push(
      `<Features>${features.map((f) => `<Feature>${xmlEsc(f)}</Feature>`).join("")}</Features>`
    );
  }

  /* --- Location --- */
  const street = String(property.street ?? "").trim();
  const streetNumber = String(property.address_number ?? "").trim();
  const displayAddress = street && streetNumber ? "All" : street ? "Street" : "Neighborhood";

  const location = [
    `<Country abbreviation="BR">Brasil</Country>`,
    `<State abbreviation="${xmlEsc(place.abbreviation)}">${xmlEsc(place.state)}</State>`,
    `<City>${cdata(place.city)}</City>`,
  ];
  if (property.zone) location.push(`<Zone>${cdata(property.zone)}</Zone>`);
  location.push(`<Neighborhood>${cdata(property.neighborhood)}</Neighborhood>`);
  if (street) location.push(`<Address>${cdata(street)}</Address>`);
  if (streetNumber) location.push(`<StreetNumber>${cdata(streetNumber)}</StreetNumber>`);
  location.push(`<PostalCode>${postalCode}</PostalCode>`);

  /* --- Media --- */
  const video = youtubeUrl(property.video_url);
  const media = [
    ...(video ? [`<Item medium="video">${xmlEsc(video)}</Item>`] : []),
    ...images.map(
      (url, index) =>
        `<Item medium="image" caption="foto${index + 1}"${index === 0 ? ' primary="true"' : ""}>${xmlEsc(url)}</Item>`
    ),
  ];

  const detailViewUrl = `${SITE_URL}/imovel/${property.short_id ?? property.id}/${propertySlug(property)}`;

  const xml = `    <Listing>
      <ListingID>${xmlEsc(listingId(property))}</ListingID>
      <Title>${cdata(title)}</Title>
      <TransactionType>${property.purpose === "aluguel" ? "For Rent" : "For Sale"}</TransactionType>
      <PublicationType>STANDARD</PublicationType>
      <DetailViewUrl>${xmlEsc(detailViewUrl)}</DetailViewUrl>
      <Media>
        ${media.join("\n        ")}
      </Media>
      <Details>
        ${details.join("\n        ")}
      </Details>
      <Location displayAddress="${displayAddress}">
        ${location.join("\n        ")}
      </Location>
      <ContactInfo>
        <Name>${cdata(AGENCY.name)}</Name>
        <Email>${xmlEsc(AGENCY.email)}</Email>
        <Website>${xmlEsc(AGENCY.website)}</Website>
        <Telephone>${xmlEsc(AGENCY.phone)}</Telephone>
      </ContactInfo>
    </Listing>`;

  return { xml };
}

/** Código do anúncio: o de referência da imobiliária, com fallback estável. */
export function listingId(property) {
  const ref = String(property.ref_code ?? "").trim();
  if (ref) return ref.slice(0, 50);
  return String(property.short_id ?? property.id).slice(0, 50);
}

/** Data no formato exigido pelo Header (sem timezone). */
function publishDate(now = new Date()) {
  return now.toISOString().slice(0, 19);
}

/**
 * Monta o feed completo e devolve também o diagnóstico dos imóveis
 * descartados, usado pelo ?relatorio=1.
 */
export function buildFeed(properties, { now } = {}) {
  const listings = [];
  const skipped = [];
  const seenIds = new Set();

  for (const property of properties) {
    const result = buildListing(property);
    if (result.skipped) {
      skipped.push({ titulo: property.title, tipo: property.type, pendencias: result.skipped });
      continue;
    }

    // ListingID duplicado faz o portal processar só um dos anúncios.
    const id = listingId(property);
    if (seenIds.has(id)) {
      skipped.push({ titulo: property.title, tipo: property.type, pendencias: [`código de referência "${id}" duplicado`] });
      continue;
    }
    seenIds.add(id);
    listings.push(result.xml);
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<ListingDataFeed xmlns="http://www.vivareal.com/schemas/1.0/VRSync"
                 xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
                 xsi:schemaLocation="http://www.vivareal.com/schemas/1.0/VRSync http://xml.vivareal.com/vrsync.xsd">
  <Header>
    <Provider>${cdata(AGENCY.name)}</Provider>
    <Email>${xmlEsc(AGENCY.email)}</Email>
    <ContactName>${cdata(AGENCY.contactName)}</ContactName>
    <PublishDate>${publishDate(now)}</PublishDate>
    <Telephone>${xmlEsc(AGENCY.phone)}</Telephone>
  </Header>
  <Listings>
${listings.join("\n")}
  </Listings>
</ListingDataFeed>`;

  return { xml, incluidos: listings.length, excluidos: skipped };
}

export default async function handler(req, res) {
  let properties = [];
  try {
    // Ordem por olx_enabled_at: se houver mais marcados que o plano, quem ocupou
    // a vaga primeiro continua no ar em vez de sair na troca de um terceiro.
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/properties?select=${COLUMNS}` +
        `&olx_enabled=eq.true&order=olx_enabled_at.asc.nullslast,created_at.desc&limit=${OLX_PLAN_LIMIT}`,
      {
        headers: {
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        },
      }
    );
    if (!response.ok) throw new Error(`Supabase respondeu ${response.status}`);
    properties = await response.json();
  } catch (error) {
    // Entregar um feed vazio faria o portal despublicar tudo. Melhor falhar:
    // a sonda tenta de novo na próxima janela de 12h.
    res.status(503).json({ erro: "Não foi possível ler os imóveis", detalhe: String(error) });
    return;
  }

  const { xml, incluidos, excluidos } = buildFeed(properties);

  if (req.query?.relatorio || req.query?.report) {
    res.setHeader("Cache-Control", "no-store");
    res.status(200).json({
      plano: OLX_PLAN_LIMIT,
      selecionados: properties.length,
      incluidos,
      excluidos: excluidos.length,
      pendencias: excluidos,
    });
    return;
  }

  res.setHeader("Content-Type", "application/xml; charset=utf-8");
  // A sonda do Grupo OLX passa a cada 12h; 1h de cache no CDN é folgado.
  res.setHeader("Cache-Control", "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400");
  res.status(200).send(xml);
}
