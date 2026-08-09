/**
 * Função serverless (Vercel) — gera o sitemap.xml dinâmico.
 *
 * Por quê: o sitemap.xml estático em /public só lista páginas fixas.
 * Os imóveis individuais (/imovel/:shortId/:slug) precisam estar no sitemap
 * para que o Google e outros crawlers os indexem diretamente.
 *
 * Esta função busca todos os imóveis publicados no Supabase e gera um XML
 * completo com todas as URLs — estáticas + individuais de imóveis.
 *
 * Roteamento: ver vercel.json — /sitemap.xml → /api/sitemap
 */

const SUPABASE_URL =
  process.env.VITE_SUPABASE_URL || "https://kujwgpumdggggbnxuhem.supabase.co";
const SUPABASE_ANON_KEY =
  process.env.VITE_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt1andncHVtZGdnZ2dibnh1aGVtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYxNzgyNzIsImV4cCI6MjA5MTc1NDI3Mn0.if2iY21S6reNWF0b3SfJ02jCarorP1DRamW0SI2knTU";

const SITE_URL = (process.env.VITE_SITE_URL || "https://www.romolinaimoveis.com.br").replace(/\/$/, "");

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

/** Escapa texto para uso seguro dentro de tags XML. */
function xmlEsc(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/** Formata uma data para o padrão W3C Date (YYYY-MM-DD). */
function w3cDate(dateStr) {
  if (!dateStr) return new Date().toISOString().slice(0, 10);
  return new Date(dateStr).toISOString().slice(0, 10);
}

/** URLs estáticas do site — sempre incluídas no sitemap. */
const STATIC_URLS = [
  { loc: `${SITE_URL}/`,                         changefreq: "weekly",  priority: "1.0" },
  { loc: `${SITE_URL}/imoveis`,                  changefreq: "daily",   priority: "0.9" },
  { loc: `${SITE_URL}/comprar`,                  changefreq: "daily",   priority: "0.9" },
  { loc: `${SITE_URL}/alugar`,                   changefreq: "daily",   priority: "0.9" },
  { loc: `${SITE_URL}/sobre`,                    changefreq: "monthly", priority: "0.7" },
  { loc: `${SITE_URL}/negocie-seu-imovel`,       changefreq: "monthly", priority: "0.8" },
];

/** Gera um bloco <url> para o sitemap. */
function urlEntry({ loc, lastmod, changefreq, priority, images = [] }) {
  const imgTags = images.slice(0, 10).map((img) => `
    <image:image>
      <image:loc>${xmlEsc(img.url)}</image:loc>
      ${img.caption ? `<image:caption>${xmlEsc(img.caption)}</image:caption>` : ""}
    </image:image>`).join("");

  return `
  <url>
    <loc>${xmlEsc(loc)}</loc>
    ${lastmod ? `<lastmod>${lastmod}</lastmod>` : ""}
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>${imgTags}
  </url>`;
}

export default async function handler(req, res) {
  // Busca todos os imóveis ordenados por created_at desc (mesmo order do front-end)
  let properties = [];
  try {
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/properties?select=id,short_id,title,neighborhood,images,created_at&order=created_at.desc`,
      {
        headers: {
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        },
      }
    );
    if (response.ok) {
      properties = await response.json();
    }
  } catch {
    // Se falhar a busca, ainda entrega o sitemap estático — melhor que nada
    properties = [];
  }

  // Monta as entradas das páginas estáticas
  const staticEntries = STATIC_URLS.map((u) => urlEntry({ ...u }));

  // Monta as entradas dos imóveis individuais.
  // O id da URL vem da coluna short_id — estável e igual à canônica que a
  // /api/imovel declara. O `index + 1` só cobre o intervalo antes da migração
  // 20260809120000_stable_property_short_id.sql, onde o número era posicional.
  const propertyEntries = properties.map((property, index) => {
    const shortId = property.short_id ?? index + 1;
    const slug = propertySlug(property);
    const loc = `${SITE_URL}/imovel/${shortId}/${slug}`;
    const lastmod = w3cDate(property.created_at);

    // Inclui até 10 imagens por imóvel para indexação de imagens no Google
    const images = Array.isArray(property.images)
      ? property.images.slice(0, 10).map((url) => ({
          url,
          caption: `${property.title} — ${property.neighborhood}`,
        }))
      : [];

    return urlEntry({
      loc,
      lastmod,
      changefreq: "weekly",
      priority: "0.8",
      images,
    });
  });

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset
  xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
  xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"
>
${staticEntries.join("")}
${propertyEntries.join("")}
</urlset>`;

  res.setHeader("Content-Type", "application/xml; charset=utf-8");
  // Cache: 1h no CDN, revalida em background. Imóveis não mudam a cada minuto.
  res.setHeader("Cache-Control", "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400");
  res.status(200).send(xml);
}
