import { ReactNode, useMemo, useState } from 'react'
import { Expand } from 'lucide-react'

import { ImageLightbox } from '@/components/shared/ImageLightbox'
import { cn } from '@/lib/utils'
import { getResponsiveImageUrl } from '@/lib/cloudinaryUrl'
import {
  ImageAsset,
  getSingleImageAspectClass,
  imageUrls,
  normalizeImageAssets,
} from '@/lib/imageLayout'

interface SmartImageGridProps {
  images: ImageAsset[]
  onImageClick?: (index: number) => void
  maxVisible?: number
  rounded?: boolean
  gap?: number
  title?: string
  className?: string
  firstImageOverlay?: ReactNode
}

function gapClass(gap: number) {
  if (gap <= 1) return 'gap-1'
  if (gap === 3) return 'gap-3'
  if (gap >= 4) return 'gap-4'
  return 'gap-2'
}

function getImageClass(count: number, index: number, image: ImageAsset) {
  if (count === 1) return cn('col-span-2', getSingleImageAspectClass(image))
  if (count === 2) return 'aspect-square'
  if (count === 3 && index === 0) return 'row-span-2 aspect-auto min-h-64'
  if (count === 3) return 'aspect-square'
  if (count === 5 && index === 0) return 'col-span-2 aspect-video'
  return 'aspect-square'
}

export function SmartImageGrid({
  images,
  onImageClick,
  maxVisible = 4,
  rounded = true,
  gap = 2,
  title = 'Photo',
  className,
  firstImageOverlay,
}: SmartImageGridProps) {
  const visibleImages = normalizeImageAssets(images)
  const count = visibleImages.length
  const visibleCount = count > 4 ? Math.min(Math.max(maxVisible, 4), count) : count
  const displayedImages = visibleImages.slice(0, visibleCount)

  if (!count) return null

  return (
    <div
      className={cn(
        'grid grid-cols-2 overflow-hidden border border-border bg-muted/45',
        gapClass(gap),
        rounded && 'rounded-xl',
        count === 1 && 'grid-cols-1',
        count === 3 && 'auto-rows-fr',
        count >= 5 && 'grid-cols-2',
        className,
      )}
    >
      {displayedImages.map((image, index) => {
        const overflowCount = index === displayedImages.length - 1 && count > displayedImages.length
          ? count - displayedImages.length
          : 0

        return (
          <button
            key={`${image.url}-${index}`}
            type="button"
            onClick={() => onImageClick?.(index)}
            aria-label={`Open photo ${index + 1} of ${count}`}
            className={cn(
              'group relative flex min-w-0 items-center justify-center overflow-hidden bg-black/5 focus-visible:z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset dark:bg-white/5',
              getImageClass(Math.min(count, visibleCount), index, image),
            )}
          >
            <img
              src={getResponsiveImageUrl(image.url)}
              alt={`${title} ${index + 1}`}
              loading="lazy"
              decoding="async"
              className="h-full w-full object-contain transition-transform duration-200 group-hover:scale-[1.01]"
            />
            <span className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-black/55 text-white opacity-90 shadow-sm backdrop-blur-sm sm:opacity-0 sm:transition-opacity sm:group-hover:opacity-100">
              <Expand size={15} />
            </span>
            {index === 0 ? firstImageOverlay : null}
            {overflowCount > 0 ? (
              <span className="absolute inset-0 flex items-center justify-center bg-black/55 text-xl font-black text-white">
                +{overflowCount}
              </span>
            ) : null}
          </button>
        )
      })}
    </div>
  )
}

interface SmartImageGalleryProps extends Omit<SmartImageGridProps, 'onImageClick'> {
  images: Array<string | ImageAsset | null | undefined>
}

export function SmartImageGallery({
  images,
  title = 'Photo',
  ...props
}: SmartImageGalleryProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null)
  const normalizedImages = useMemo(() => normalizeImageAssets(images), [images])
  const urls = useMemo(() => imageUrls(normalizedImages), [normalizedImages])
  const activeImageIndex = activeIndex ?? 0

  return (
    <>
      <SmartImageGrid
        {...props}
        images={normalizedImages}
        title={title}
        onImageClick={setActiveIndex}
      />
      {activeIndex !== null ? (
        <ImageLightbox
          images={urls}
          activeIndex={activeImageIndex}
          title={title}
          onClose={() => setActiveIndex(null)}
          onPrev={() => setActiveIndex((index) => ((index ?? 0) - 1 + urls.length) % urls.length)}
          onNext={() => setActiveIndex((index) => ((index ?? 0) + 1) % urls.length)}
        />
      ) : null}
    </>
  )
}

