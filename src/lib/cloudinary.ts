const MAX_IMAGE_BYTES = 8 * 1024 * 1024
const ALLOWED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif'])

export interface UploadedImageAsset {
  url: string
  width?: number
  height?: number
}

export function validateImageFile(file: File) {
  if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
    throw new Error('Use a JPG, PNG, WebP, or GIF image.')
  }
  if (file.size > MAX_IMAGE_BYTES) {
    throw new Error('Images must be smaller than 8 MB.')
  }
}

export function readImageDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const image = new Image()

    image.onload = () => {
      URL.revokeObjectURL(url)
      resolve({ width: image.naturalWidth, height: image.naturalHeight })
    }
    image.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Could not read image dimensions.'))
    }
    image.src = url
  })
}

export async function uploadImageAsset(
  file: File,
): Promise<UploadedImageAsset | null> {
  try {
    validateImageFile(file)
    const dimensions = await readImageDimensions(file)
    const formData = new FormData()
    formData.append('file', file)
    formData.append(
      'upload_preset',
      'mohalla_uploads'
    )

    const cloudName =
      import.meta.env.VITE_CLOUDINARY_CLOUD_NAME
    if (!cloudName) {
      throw new Error('Image uploads are not configured.')
    }

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
      {
        method: 'POST',
        body: formData,
      }
    )

    if (!response.ok) {
      throw new Error('Upload failed')
    }

    const data = await response.json()
    return {
      url: data.secure_url,
      width: typeof data.width === 'number' ? data.width : dimensions.width,
      height: typeof data.height === 'number' ? data.height : dimensions.height,
    }
  } catch (error) {
    console.error('Cloudinary upload error:', error)
    return null
  }
}

export async function uploadImage(
  file: File,
): Promise<string | null> {
  const asset = await uploadImageAsset(file)
  return asset?.url ?? null
}

export async function uploadMultipleImageAssets(
  files: File[],
): Promise<UploadedImageAsset[]> {
  const uploads = await Promise.all(
    files.map(file => uploadImageAsset(file))
  )
  return uploads.filter(
    (image): image is UploadedImageAsset => image !== null
  )
}

export async function uploadMultipleImages(
  files: File[]
): Promise<string[]> {
  const uploads = await uploadMultipleImageAssets(files)
  return uploads.map((image) => image.url)
}
