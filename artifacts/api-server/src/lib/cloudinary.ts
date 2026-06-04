/**
 * Cloudinary image upload helper.
 * Falls back to a placeholder URL if Cloudinary env vars are not configured.
 */

const CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME;
const API_KEY    = process.env.CLOUDINARY_API_KEY;
const API_SECRET = process.env.CLOUDINARY_API_SECRET;

export const cloudinaryConfigured =
  Boolean(CLOUD_NAME) && Boolean(API_KEY) && Boolean(API_SECRET);

/**
 * Upload a buffer to Cloudinary.
 * Returns the secure URL of the uploaded file.
 * Falls back to a placeholder if Cloudinary is not configured.
 */
export async function uploadImage(
  buffer: Buffer,
  folder = "mohalla",
): Promise<string> {
  if (!cloudinaryConfigured) {
    return `https://placehold.co/800x600/e2e8f0/64748b?text=Image+Unavailable`;
  }

  // Dynamic import so the module loads even if cloudinary package isn't installed
  const { v2: cloudinary } = await import("cloudinary");
  cloudinary.config({
    cloud_name: CLOUD_NAME,
    api_key: API_KEY,
    api_secret: API_SECRET,
  });

  return new Promise((resolve, reject) => {
    cloudinary.uploader
      .upload_stream({ folder, resource_type: "image" }, (err, result) => {
        if (err || !result) return reject(err ?? new Error("Upload failed"));
        resolve(result.secure_url);
      })
      .end(buffer);
  });
}

/**
 * Delete an image from Cloudinary by public ID.
 * No-ops if Cloudinary is not configured.
 */
export async function deleteImage(publicId: string): Promise<void> {
  if (!cloudinaryConfigured) return;
  const { v2: cloudinary } = await import("cloudinary");
  cloudinary.config({
    cloud_name: CLOUD_NAME,
    api_key: API_KEY,
    api_secret: API_SECRET,
  });
  await cloudinary.uploader.destroy(publicId);
}

/**
 * Generate a signed Cloudinary upload URL for direct browser uploads.
 * Returns null if Cloudinary is not configured.
 */
export function getCloudinaryUploadParams(folder = "mohalla"): {
  uploadUrl: string;
  apiKey: string;
  timestamp: number;
  signature: string;
  folder: string;
} | null {
  if (!cloudinaryConfigured) return null;

  // Synchronous cloudinary signing doesn't need async
  // We generate the signature manually to avoid dynamic import in sync context
  const crypto = require("crypto");
  const timestamp = Math.round(Date.now() / 1000);
  const toSign = `folder=${folder}&timestamp=${timestamp}${API_SECRET}`;
  const signature = crypto.createHash("sha1").update(toSign).digest("hex");

  return {
    uploadUrl: `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
    apiKey: API_KEY!,
    timestamp,
    signature,
    folder,
  };
}
