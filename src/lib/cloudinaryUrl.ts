const CLOUDINARY_UPLOAD_PATH = '/upload/'

function joinTransformations(transformations: string[]) {
  return transformations.filter(Boolean).join(',')
}

export function getOptimizedCloudinaryUrl(
  url?: string | null,
  transformations: string[] = ['f_auto', 'q_auto'],
) {
  if (!url || !url.includes(CLOUDINARY_UPLOAD_PATH)) return url ?? ''

  const insertion = joinTransformations(transformations)
  if (!insertion) return url

  const [base, rest] = url.split(CLOUDINARY_UPLOAD_PATH)
  if (!base || !rest) return url

  return `${base}${CLOUDINARY_UPLOAD_PATH}${insertion}/${rest}`
}

export function getResponsiveImageUrl(url?: string | null, width = 1200) {
  return getOptimizedCloudinaryUrl(url, ['f_auto', 'q_auto', `c_limit,w_${width}`])
}

export function getThumbnailImageUrl(url?: string | null, width = 480) {
  return getOptimizedCloudinaryUrl(url, ['f_auto', 'q_auto', `c_fill,w_${width},h_${width},g_auto`])
}

