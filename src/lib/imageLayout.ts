export interface ImageAsset {
  url: string
  width?: number | null
  height?: number | null
}

export function normalizeImageAssets(
  images?: Array<string | ImageAsset | null | undefined> | null,
) {
  return (images ?? [])
    .map((image) => {
      if (!image) return null
      if (typeof image === 'string') return image.trim() ? { url: image.trim() } : null
      return image.url?.trim() ? { ...image, url: image.url.trim() } : null
    })
    .filter((image): image is ImageAsset => Boolean(image))
}

export function imageAspectRatio(image?: ImageAsset | null) {
  if (!image?.width || !image.height || image.width <= 0 || image.height <= 0) {
    return null
  }
  return image.width / image.height
}

export function getSingleImageAspectClass(image?: ImageAsset | null) {
  const ratio = imageAspectRatio(image)

  if (!ratio) return 'aspect-[4/3]'
  if (ratio >= 1.45) return 'aspect-video'
  if (ratio <= 0.8) return 'aspect-[4/5]'
  return 'aspect-square'
}

export function imageUrls(images?: ImageAsset[] | null) {
  return normalizeImageAssets(images).map((image) => image.url)
}

