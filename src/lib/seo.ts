export function resolveSeoImageUrl(image?: string, siteUrl = "https://www.romolinaimoveis.com.br") {
  if (!image) return undefined;

  if (/^https?:\/\//i.test(image)) return image;
  if (image.startsWith("data:")) return image;

  return `${siteUrl.replace(/\/$/, "")}${image.startsWith("/") ? image : `/${image}`}`;
}
