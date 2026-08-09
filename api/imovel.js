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
 *
 * Trata URLs que já possuem transformações existentes, evitando duplo-transform.
 * Ex: /upload/c_fill,w_800/v123/foto.jpg  →  /upload/c_fill,w_1200,h_630,q_auto,f_jpg/v123/foto.jpg
 */
function ogImageUrl(raw) {
  if (!raw) return { url: DEFAULT_IMAGE, sized: false };
  const abs = /^https?:\/\//i.test(raw) ? raw : `${SITE_URL}/${raw.replace(/^\//, "")}`;
  // Detecta URL do Cloudinary: captura a base até /upload/ e o restante
  const cloudinary = abs.match(/^(https:\/\/res\.cloudinary\.com\/[^/]+\/image\/upload\/)(.+)$/i);
  if (cloudinary) {
    const afterUpload = cloudinary[2];
    // Remove transformações existentes (segmentos que NÃO começam com 'v' seguido de dígitos
    // e que NÃO são o public_id — ou seja, segmentos de transform como c_fill,w_800,...)
    // Segmentos de transform: começam com letra(s) seguidas de _ (ex: c_, w_, h_, q_, f_, l_, ...)
    // Segmentos de versão: v seguido de dígitos (ex: v1234567890)
    // Public ID: tudo depois da versão ou diretamente o caminho do arquivo
    const segments = afterUpload.split("/");
    // Pula segmentos de transformação (ex: "c_fill,w_800" ou "q_auto") até encontrar versão ou public_id
    const nonTransformIdx = segments.findIndex(
      (seg) => /^v\d+$/.test(seg) || // versão (v1234567890)
               !/^[a-z_]+[a-z0-9]*_/.test(seg.split(",")[0]) // não parece um transform
    );
    const publicPart = nonTransformIdx >= 0 ? segments.slice(nonTransformIdx).join("/") : afterUpload;
    return {
      url: `${cloudinary[1]}c_fill,w_1200,h_630,q_auto,f_jpg/${publicPart}`,
      sized: true,
    };
  }
  return { url: abs, sized: false };
}

/**
 * Busca por short_id (coluna estável no banco).
 * `supported: false` significa que a coluna ainda não existe — só acontece
 * antes da migração 20260809120000_stable_property_short_id.sql.
 */
async function fetchByShortId(shortId) {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/properties?short_id=eq.${shortId}&select=*`,
    { headers: supabaseHeaders },
  );
  if (!res.ok) return { supported: false, row: null };
  const rows = await res.json();
  return { supported: true, row: rows[0] ?? null };
}

/**
 * Resolve o imóvel a partir do segmento da URL.
 * Aceita: UUID (direto), short_id numérico ou slug legado com UUID no final.
 *
 * Ordem de prioridade:
 * 1. UUID direto → busca exata por id
 * 2. short_id → busca exata pela coluna estável
 * 3. Slug da URL → match exato (resgata links antigos, de quando o número
 *    era posicional e mudava a cada imóvel novo)
 *
 * O índice posicional NÃO é mais usado como fallback: era ele que fazia
 * /imovel/11/... apontar para um imóvel diferente a cada cadastro novo.
 */
async function fetchProperty(rawId, rawSlug) {
  const id = String(rawId ?? "").trim();
  if (!id) return null;

  // 1. UUID direto
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
    // 2. short_id
    const { supported, row } = await fetchByShortId(id);
    if (row) return row;

    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/properties?select=*&order=created_at.desc`,
      { headers: supabaseHeaders },
    );
    if (!res.ok) return null;
    const rows = await res.json();

    // 3. Slug — resgata URLs cujo número ficou defasado
    if (rawSlug) {
      const slugStr = String(rawSlug).trim();
      const matched = rows.find((item) => propertySlug(item) === slugStr);
      if (matched) return matched;
    }

    // Só enquanto a coluna short_id não existir: o número ainda é posicional.
    return supported ? null : (rows[Number(id) - 1] ?? null);
  }

  return null;
}

/**
 * Caminho canônico do imóvel — derivado SEMPRE do registro, nunca da URL pedida.
 *
 * Antes o canonical espelhava o que veio na requisição, então /imovel/{uuid},
 * /imovel/{uuid}/{slug} e /imovel/{short_id}/{slug} serviam o mesmo conteúdo
 * apontando cada um para si mesmo. O Google chamava isso de "cópia sem página
 * canônica selecionada pelo usuário".
 */
function canonicalPath(property) {
  const slug = propertySlug(property);
  const routeId = property.short_id ?? property.id;
  return slug ? `/imovel/${routeId}/${slug}` : `/imovel/${routeId}`;
}

/** Meta de "imóvel não encontrado" — acompanha um HTTP 404 de verdade. */
function notFoundMeta() {
  return {
    title: `Imóvel não encontrado | ${SITE_NAME}`,
    description: "Este imóvel não está mais disponível no portfólio da Ro Molina Imóveis.",
    image: DEFAULT_IMAGE,
    imageSized: false,
    url: `${SITE_URL}/imoveis`,
    noIndex: true,
  };
}

/** Monta título, descrição e imagem do preview a partir do imóvel. */
function buildMeta(property) {
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
    // Uma única URL canônica por imóvel, sempre derivada do registro.
    url: `${SITE_URL}${canonicalPath(property)}`,
    noIndex: false,
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
    meta.noIndex ? `<meta name="robots" content="noindex,follow" />` : null,
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
    meta.noIndex ? null : `<script type="application/ld+json">${jsonLd}</script>`,
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
    .replace(/\s*<meta\s+name="robots"[^>]*>/gi, "")
    .replace(/\s*<script\s+type="application\/ld\+json">[\s\S]*?<\/script>/gi, "")
    .replace(/<\/head>/i, `    ${tags}\n  </head>`);
}

/** Entrega o shell da SPA com as meta tags injetadas, no status pedido. */
async function sendShell(res, host, meta, status) {
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
  res.status(status).send(html);
}

export default async function handler(req, res) {
  const id = String(req.query?.id ?? "");
  const slug = String(req.query?.slug ?? "");
  const host = safeHost(req);

  let property = null;
  try {
    property = await fetchProperty(id, slug);
  } catch {
    property = null;
  }

  // Imóvel removido ou id inválido: 404 de verdade. Antes respondíamos 200 com
  // o preview padrão do site, e o Google registrava isso como soft 404.
  if (!property) {
    return sendShell(res, host, notFoundMeta(), 404);
  }

  // Uma URL só por imóvel: qualquer variante (UUID, número defasado, sem slug)
  // vira 301 para a canônica, em vez de servir conteúdo duplicado.
  const target = canonicalPath(property);
  const requested = slug ? `/imovel/${id}/${slug}` : `/imovel/${id}`;
  if (requested !== target) {
    res.setHeader("Location", `https://${host}${target}`);
    res.setHeader("Cache-Control", "public, max-age=0, s-maxage=600, stale-while-revalidate=86400");
    return res.status(301).end();
  }

  return sendShell(res, host, buildMeta(property), 200);
}
