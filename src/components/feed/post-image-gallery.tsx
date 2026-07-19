import { SmartImageGallery } from '@/components/shared/SmartImageGrid'

interface PostImageGalleryProps {
  urls: string[]
  title?: string
}

export function PostImageGallery({ urls, title = 'Post photo' }: PostImageGalleryProps) {
  return (
    <SmartImageGallery
      images={urls}
      title={title}
      className="mt-3"
    />
  )
}

