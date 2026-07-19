import { useEffect, useMemo, useRef } from 'react'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'

import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog'
import { getResponsiveImageUrl } from '@/lib/cloudinaryUrl'

interface ImageLightboxProps {
  images: string[]
  activeIndex: number
  onClose: () => void
  onNext: () => void
  onPrev: () => void
  title?: string
}

export function ImageLightbox({
  images,
  activeIndex,
  onClose,
  onNext,
  onPrev,
  title = 'Image viewer',
}: ImageLightboxProps) {
  const touchStartX = useRef<number | null>(null)
  const visibleImages = useMemo(() => images.filter(Boolean), [images])
  const count = visibleImages.length
  const activeImage = visibleImages[activeIndex] ?? visibleImages[0]

  useEffect(() => {
    if (!count) return

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
      if (event.key === 'ArrowLeft' && count > 1) onPrev()
      if (event.key === 'ArrowRight' && count > 1) onNext()
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [count, onClose, onNext, onPrev])

  if (!count || !activeImage) return null

  return (
    <Dialog open onOpenChange={(open) => { if (!open) onClose() }}>
      <DialogContent
        showCloseButton={false}
        className="h-[100dvh] max-h-[100dvh] w-screen max-w-none gap-0 overflow-hidden rounded-none border-0 bg-black/95 p-0 text-white sm:h-[92dvh] sm:max-h-[92dvh] sm:w-[94vw] sm:max-w-[94vw] sm:rounded-2xl"
      >
        <DialogTitle className="sr-only">{title}</DialogTitle>
        <div
          className="relative flex min-h-0 flex-1 items-center justify-center p-3 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-[calc(3.5rem+env(safe-area-inset-top))] sm:p-6"
          onTouchStart={(event) => {
            touchStartX.current = event.touches[0]?.clientX ?? null
          }}
          onTouchEnd={(event) => {
            if (touchStartX.current === null || count < 2) return
            const endX = event.changedTouches[0]?.clientX ?? touchStartX.current
            const delta = endX - touchStartX.current
            touchStartX.current = null
            if (Math.abs(delta) < 48) return
            if (delta > 0) onPrev()
            else onNext()
          }}
        >
          <img
            src={getResponsiveImageUrl(activeImage, 1800)}
            alt={`${title} ${activeIndex + 1} of ${count}`}
            className="max-h-full max-w-full object-contain"
          />

          <button
            type="button"
            aria-label="Close photo viewer"
            onClick={onClose}
            className="absolute right-3 top-[calc(0.75rem+env(safe-area-inset-top))] flex h-11 w-11 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur-sm transition-colors hover:bg-white/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            <X size={22} />
          </button>

          {count > 1 ? (
            <>
              <button
                type="button"
                aria-label="Previous photo"
                onClick={onPrev}
                className="absolute left-2 top-1/2 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-black/45 text-white backdrop-blur-sm transition-colors hover:bg-black/65 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white sm:left-4"
              >
                <ChevronLeft size={28} />
              </button>
              <button
                type="button"
                aria-label="Next photo"
                onClick={onNext}
                className="absolute right-2 top-1/2 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-black/45 text-white backdrop-blur-sm transition-colors hover:bg-black/65 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white sm:right-4"
              >
                <ChevronRight size={28} />
              </button>
              <span className="absolute bottom-[calc(0.75rem+env(safe-area-inset-bottom))] left-1/2 -translate-x-1/2 rounded-full bg-black/55 px-3 py-1.5 text-xs font-bold text-white backdrop-blur-sm">
                {activeIndex + 1} / {count}
              </span>
            </>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  )
}

