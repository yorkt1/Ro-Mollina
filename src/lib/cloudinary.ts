// ⚠️  API_SECRET removido do cliente.
// A assinatura agora é gerada pela Edge Function `sign-cloudinary-upload`,
// que mantém o secret em segurança no servidor Supabase.

const CLOUD_NAME = "ddan59hgh";
const UPLOAD_URL = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`;

/**
 * Solicita à Edge Function do Supabase uma assinatura válida para o upload.
 * O CLOUDINARY_API_SECRET permanece exclusivamente no servidor.
 */
async function getCloudinarySignature(
  timestamp: string,
  folder: string,
): Promise<{ signature: string; api_key: string; cloud_name: string }> {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

  const response = await fetch(
    `${supabaseUrl}/functions/v1/sign-cloudinary-upload`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: supabaseAnonKey,
        Authorization: `Bearer ${supabaseAnonKey}`,
      },
      body: JSON.stringify({ timestamp, folder }),
    },
  );

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(
      (err as { error?: string }).error ?? "Falha ao obter assinatura do servidor",
    );
  }

  return response.json();
}

/**
 * Faz upload de uma imagem para o Cloudinary.
 * A assinatura é obtida de forma segura via Edge Function.
 * Retorna a URL segura (https) da imagem enviada.
 */
export async function uploadImageToCloudinary(file: File): Promise<string> {
  const timestamp = Math.round(Date.now() / 1000).toString();
  const folder = "properties";

  const { signature, api_key } = await getCloudinarySignature(timestamp, folder);

  const formData = new FormData();
  formData.append("file", file);
  formData.append("api_key", api_key);
  formData.append("timestamp", timestamp);
  formData.append("signature", signature);
  formData.append("folder", folder);

  const response = await fetch(UPLOAD_URL, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(
      (err as { error?: { message?: string } }).error?.message ??
        "Falha no upload da imagem",
    );
  }

  const data = await response.json();
  return data.secure_url as string;
}

/**
 * Gera uma URL otimizada do Cloudinary com transformações automáticas.
 * Útil para thumbnails e imagens responsivas.
 */
export function cloudinaryUrl(
  url: string,
  options: {
    width?: number;
    height?: number;
    quality?: string;
    crop?: string;
  } = {},
): string {
  const { width, height, quality = "auto", crop = "fill" } = options;

  if (!url.includes("res.cloudinary.com")) return url;

  const transforms: string[] = [`q_${quality}`, "f_auto"];
  if (width) transforms.push(`w_${width}`);
  if (height) transforms.push(`h_${height}`);
  if (crop) transforms.push(`c_${crop}`);

  return url.replace("/upload/", `/upload/${transforms.join(",")}/`);
}
