/**
 * Função serverless (Vercel) — injeta meta tags Open Graph por imóvel.
 *
 * Por quê: o site é uma SPA (Vite/React). Robôs de preview do WhatsApp,
 * Facebook, X, etc. NÃO executam JavaScript, então as tags geradas pelo
 * react-helmet-async no navegador nunca são vistas por eles. Esta função
 * intercepta /imovel/* no servidor, busca o imóvel no Supabase e injeta
 * og:image / og:title / og:description no HTML antes de entregar — assim o
 * preview do link mostra a foto principal e a descrição (igual ao TECHIMOB).
 *
 * Roteamento: ver vercel.json — /imovel/:id/:rest* → /api/imovel?id=:id
 */

const SUPABASE_URL =
  process.env.VITE_SUPABASE_URL || "https://kujwgpumdggggbnxuhem.supabase.co";
const SUPABASE_ANON_KEY =
  process.env.VITE_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt1andncHVtZGdnZ2dibnh1aGVtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYxNzgyNzIsImV4cCI6MjA5MTc1NDI3Mn0.if2iY21S6reNWF0b3SfJ02jCarorP1DRamW0SI2knTU";

const SITE_URL = (process.env.VITE_SITE_URL || "https://www.romolinaimoveis.com.br").replace(/\/$/, "");
const SITE_NAME = "Ro Molina Imóveis";
const DEFAULT_DESCRIPTION =
  "Imóveis de alto padrão em Florianópolis. Apartamentos, casas e coberturas com atendimento exclusivo. CRECI-SC 72089F.";
const DEFAULT_IMAGE = `${SITE_URL}/og-image.png`;
const UUID_RE = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;
// Só buscamos o shell index.html destes domínios — evita SSRF/cache via Host forjado.
const ALLOWED_HOST_RE = /(^|\.)romolinaimoveis\.com\.br$|\.vercel\.app$/i;

/** Retorna o host da requisição só se for um domínio conhecido; senão, o domínio de produção. */
function safeHost(req) {
  const host = String(req.headers?.host || "").split(":")[0];
  return ALLOWED_HOST_RE.test(host) ? host : new URL(SITE_URL).host;
}

const supabaseHeaders = { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` };

/** Escapa texto para uso seguro dentro de atributos/HTML. */
function esc(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function capitalize(value) {
  const text = String(value ?? "").trim();
  return text ? text.charAt(0).toUpperCase() + text.slice(1) : text;
}

/** Colapsa quebras de linha e espaços repetidos numa única linha limpa. */
function clean(value) {
  return String(value ?? "").replace(/\s+/g, " ").trim();
}

/** Corta por caractere (não quebra emojis/acentos multibyte) e adiciona reticências. */
function truncate(value, max) {
  const chars = Array.from(value);
  if (chars.length <= max) return value;
  return chars.slice(0, max - 1).join("").trimEnd() + "…";
}

function formatPrice(price) {
  return price > 0
    ? price.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 })
    : "Sob consulta";
}

const ACCENT_MAP = {
  á: "a", à: "a", â: "a", ã: "a", ä: "a",
  é: "e", è: "e", ê: "e", ë: "e",
  í: "i", ì: "i", î: "i", ï: "i",
  ó: "o", ò: "o", ô: "o", õ: "o", ö: "o",
  ú: "u", ù: "u", û: "u", ü: "u",
  ç: "c", ñ: "n",
};

function normalizeText(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\/]+/g, "-")
    .replace(/[^\w\s-]/g, (char) => ACCENT_MAP[char] ?? "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();
}

function propertySlug(property) {
  const titleWords = normalizeText(property.title).split("-").filter(Boolean);
  const compactTitle = titleWords.slice(0, 3).join("-");
  const district = normalizeText(property.neighborhood);
  return [compactTitle, district].filter(Boolean).join("-");
}

/**
 * Normaliza a URL da imagem para o preview.
 * Em imagens do Cloudinary, injeta uma transformação que entrega exatamente
 * 1200x630 (proporção ideal de card OG) — assim podemos declarar width/height
 * corretos e todo preview fica no mesmo formato. Outras URLs ficam como estão.
 */
function ogImageUrl(raw) {
  if (!raw) return { url: DEFAULT_IMAGE, sized: false };
  const abs = /^https?:\/\//i.test(raw) ? raw : `${SITE_URL}/${raw.replace(/^\//, "")}`;
  const cloudinary = abs.match(/^(https:\/\/res\.cloudinary\.com\/[^/]+\/image\/upload\/)(.+)$/i);
  if (cloudinary) {
    return { url: `${cloudinary[1]}c_fill,w_1200,h_630,q_auto,f_jpg/${cloudinary[2]}`, sized: true };
  }
  return { url: abs, sized: false };
}

/**
 * Resolve o imóvel a partir do segmento da URL.
 * Aceita: UUID (direto), número (shortId = posição em created_at desc) ou
 * slug legado que contenha um UUID no final.
 */
async function fetchProperty(rawId, rawSlug) {
  const id = String(rawId ?? "").trim();
  if (!id) return null;

  const uuid = id.match(UUID_RE);
  if (uuid) {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/properties?id=eq.${uuid[0]}&select=*`,
      { headers: supabaseHeaders },
    );
    if (!res.ok) return null;
    const rows = await res.json();
    return rows[0] ?? null;
  }

  if (/^\d+$/.test(id)) {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/properties?select=*&order=created_at.desc`,
      { headers: supabaseHeaders },
    );
    if (!res.ok) return null;
    const rows = await res.json();
    
    if (rawSlug) {
      const slugStr = String(rawSlug).trim();
      const matched = rows.find(item => propertySlug(item) === slugStr);
      if (matched) return matched;
    }

    return rows[Number(id) - 1] ?? null;
  }

  return null;
}

/** Monta título, descrição e imagem do preview a partir do imóvel. */
function buildMeta(property, host) {
  if (!property) {
    return {
      title: `${SITE_NAME} — Imóveis de Alto Padrão em Florianópolis`,
      description: DEFAULT_DESCRIPTION,
      image: DEFAULT_IMAGE,
      imageSized: false,
      url: `https://${host}`,
    };
  }

  const purposeLabel = property.purpose === "aluguel" ? "Aluguel" : "Venda";
  const specs = [
    property.bedrooms ? `${property.bedrooms} dorm.` : null,
    property.bathrooms ? `${property.bathrooms} banh.` : null,
    property.area ? `${property.area} m²` : null,
  ].filter(Boolean);

  const summary = [
    `${capitalize(property.type)} para ${purposeLabel}`,
    `${clean(property.neighborhood)}, Florianópolis/SC`,
    ...specs,
    formatPrice(property.price),
  ].join(" · ");

  const marketing = clean(property.description);
  const description = truncate(marketing ? `${marketing} — ${summary}` : summary, 180);

  const firstImage = Array.isArray(property.images) ? property.images[0] : null;
  const { url: image, sized: imageSized } = ogImageUrl(firstImage);

  return {
    title: `${clean(property.title)} | ${SITE_NAME}`,
    description,
    image,
    imageSized,
    url: `${SITE_URL}/imovel/${property.id}`,
  };
}

/** Bloco de meta tags Open Graph / Twitter / JSON-LD. */
function metaTagsHtml(meta) {
  const t = esc(meta.title);
  const d = esc(meta.description);
  const img = esc(meta.image);
  const url = esc(meta.url);

  const jsonLd = esc(
    JSON.stringify({
      "@context": "https://schema.org",
      "@type": "RealEstateListing",
      name: meta.title,
      description: meta.description,
      image: meta.image,
      url: meta.url,
    }),
  );

  return [
    `<meta property="og:type" content="website" />`,
    `<meta property="og:site_name" content="${esc(SITE_NAME)}" />`,
    `<meta property="og:locale" content="pt_BR" />`,
    `<meta property="og:title" content="${t}" />`,
    `<meta property="og:description" content="${d}" />`,
    `<meta property="og:url" content="${url}" />`,
    `<meta property="og:image" content="${img}" />`,
    `<meta property="og:image:secure_url" content="${img}" />`,
    // Só declaramos dimensões quando temos certeza (imagem 1200x630 do Cloudinary).
    meta.imageSized ? `<meta property="og:image:width" content="1200" />` : null,
    meta.imageSized ? `<meta property="og:image:height" content="630" />` : null,
    `<meta property="og:image:alt" content="${t}" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${t}" />`,
    `<meta name="twitter:description" content="${d}" />`,
    `<meta name="twitter:image" content="${img}" />`,
    `<link rel="canonical" href="${url}" />`,
    `<script type="application/ld+json">${jsonLd}</script>`,
  ].filter(Boolean).join("\n    ");
}

/** Aplica os meta tags ao shell index.html da SPA. */
function injectMeta(html, meta) {
  const tags = metaTagsHtml(meta);
  return html
    .replace(/<title>[\s\S]*?<\/title>/i, `<title>${esc(meta.title)}</title>`)
    .replace(
      /<meta\s+name="description"[^>]*>/i,
      `<meta name="description" content="${esc(meta.description)}" />`,
    )
    // Remove as tags OG/Twitter/canonical/JSON-LD estáticas do index.html
    // para não duplicar — as do imóvel (abaixo) são a fonte da verdade.
    .replace(/\s*<meta\s+property="og:[^"]*"[^>]*>/gi, "")
    .replace(/\s*<meta\s+name="twitter:[^"]*"[^>]*>/gi, "")
    .replace(/\s*<link\s+rel="canonical"[^>]*>/gi, "")
    .replace(/\s*<script\s+type="application\/ld\+json">[\s\S]*?<\/script>/gi, "")
    .replace(/<\/head>/i, `    ${tags}\n  </head>`);
}

export default async function handler(req, res) {
  const id = req.query?.id ?? "";
  const slug = req.query?.slug ?? "";
  const host = safeHost(req);

  let meta;
  try {
    const property = await fetchProperty(id, slug);
    meta = buildMeta(property, host);
  } catch {
    meta = buildMeta(null, host);
  }

  // Busca o shell estático da SPA e injeta as meta tags.
  let html;
  try {
    const shell = await fetch(`https://${host}/index.html`);
    html = injectMeta(await shell.text(), meta);
  } catch {
    // Fallback: documento mínimo só com o preview (caso raro de falha no fetch).
    html = `<!doctype html><html lang="pt-BR"><head><meta charset="UTF-8" />\n    ${metaTagsHtml(meta)}\n</head><body><a href="${esc(meta.url)}">${esc(meta.title)}</a></body></html>`;
  }

  res.setHeader("Content-Type", "text/html; charset=utf-8");
  // Cache no CDN da Vercel: respostas rápidas pro robô, revalida a cada 10 min.
  res.setHeader("Cache-Control", "public, max-age=0, s-maxage=600, stale-while-revalidate=86400");
  res.status(200).send(html);
}
