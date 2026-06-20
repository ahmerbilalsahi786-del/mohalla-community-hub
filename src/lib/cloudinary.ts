export async function uploadImage(
  file: File
): Promise<string | null> {
  try {
    const formData = new FormData()
    formData.append('file', file)
    formData.append(
      'upload_preset',
      'mohalla_uploads'
    )

    const cloudName =
      import.meta.env.VITE_CLOUDINARY_CLOUD_NAME

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
    return data.secure_url
  } catch (error) {
    console.error('Cloudinary upload error:', error)
    return null
  }
}

export async function uploadMultipleImages(
  files: File[]
): Promise<string[]> {
  const uploads = await Promise.all(
    files.map(file => uploadImage(file))
  )
  return uploads.filter(
    (url): url is string => url !== null
  )
}
