/**
 * SEO — componente centralizado para meta tags, Open Graph, Twitter Cards e JSON-LD.
 *
 * Uso básico:
 *   <SEO title="Imóveis à Venda" description="..." url="/comprar" />
 *
 * Com JSON-LD:
 *   <SEO title="..." jsonLd={{ "@type": "RealEstateListing", ... }} />
 */

import { Helmet } from "react-helmet-async";

import { resolveSeoImageUrl } from "@/lib/seo";

const SITE_URL = (import.meta.env.VITE_SITE_URL as string | undefined) ?? "https://www.romolinaimoveis.com.br";
const SITE_NAME = "Ro Molina Imóveis";
const DEFAULT_DESCRIPTION =
  "Imóveis de alto padrão em Florianópolis. Apartamentos, casas e coberturas com atendimento exclusivo. CRECI-SC 72089F.";
const DEFAULT_IMAGE = `${SITE_URL}/og-image.png`;

interface SEOProps {
  /** Título da página — será sufixado com " | Ro Molina Imóveis" */
  title?: string;
  description?: string;
  /** URL relativa da página, ex: "/comprar" */
  url?: string;
  /** URL absoluta de uma imagem para og:image */
  image?: string;
  type?: "website" | "article";
  /** Adiciona noindex,nofollow (painel admin, etc.) */
  noIndex?: boolean;
  /** Dados estruturados JSON-LD (objeto ou array de objetos) */
  jsonLd?: object | object[];
}

export default function SEO({
  title,
  description = DEFAULT_DESCRIPTION,
  url,
  image = DEFAULT_IMAGE,
  type = "website",
  noIndex = false,
  jsonLd,
}: SEOProps) {
  const fullTitle = title
    ? `${title} | ${SITE_NAME}`
    : `${SITE_NAME} — Imóveis de Alto Padrão em Florianópolis`;

  const canonical = url ? `${SITE_URL}${url}` : undefined;
  const ogImage = resolveSeoImageUrl(image, SITE_URL);

  const schemas = jsonLd
    ? (Array.isArray(jsonLd) ? jsonLd : [jsonLd]).map((schema) => ({
        "@context": "https://schema.org",
        ...schema,
      }))
    : null;

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      {noIndex && <meta name="robots" content="noindex,nofollow" />}
      {canonical && <link rel="canonical" href={canonical} />}

      {/* Open Graph */}
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:type" content={type} />
      {ogImage && <meta property="og:image" content={ogImage} />}
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:locale" content="pt_BR" />
      {canonical && <meta property="og:url" content={canonical} />}

      {/* Twitter / X */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      {ogImage && <meta name="twitter:image" content={ogImage} />}

      {/* JSON-LD */}
      {schemas && (
        <script type="application/ld+json">
          {JSON.stringify(schemas.length === 1 ? schemas[0] : schemas)}
        </script>
      )}
    </Helmet>
  );
}
