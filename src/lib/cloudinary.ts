const CLOUD_NAME = "ddan59hgh";
const API_KEY = "284476791732246";
const API_SECRET = "ra95uCmEEMOOeodpmLar964OoX8";

const UPLOAD_URL = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`;

/**
 * Generate SHA-1 hash for Cloudinary signed upload.
 */
async function sha1(message: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest("SHA-1", msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Upload an image to Cloudinary using signed upload.
 * Returns the secure URL of the uploaded image.
 */
export async function uploadImageToCloudinary(file: File): Promise<string> {
  const timestamp = Math.round(Date.now() / 1000).toString();
  const folder = "properties";

  // Create signature string (params in alphabetical order)
  const signatureString = `folder=${folder}&timestamp=${timestamp}${API_SECRET}`;
  const signature = await sha1(signatureString);

  const formData = new FormData();
  formData.append("file", file);
  formData.append("api_key", API_KEY);
  formData.append("timestamp", timestamp);
  formData.append("signature", signature);
  formData.append("folder", folder);

  const response = await fetch(UPLOAD_URL, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err?.error?.message || "Falha no upload da imagem");
  }

  const data = await response.json();
  return data.secure_url;
}

/**
 * Generate an optimized Cloudinary URL with transformations.
 * Useful for thumbnails and responsive images.
 */
export function cloudinaryUrl(
  url: string,
  options: { width?: number; height?: number; quality?: string; crop?: string } = {}
): string {
  const { width, height, quality = "auto", crop = "fill" } = options;

  // Only transform Cloudinary URLs
  if (!url.includes("res.cloudinary.com")) return url;

  const transforms: string[] = [`q_${quality}`, "f_auto"];
  if (width) transforms.push(`w_${width}`);
  if (height) transforms.push(`h_${height}`);
  if (crop) transforms.push(`c_${crop}`);

  // Insert transforms into the URL after /upload/
  return url.replace("/upload/", `/upload/${transforms.join(",")}/`);
}
