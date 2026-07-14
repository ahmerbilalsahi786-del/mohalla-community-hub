import { useEffect, useState } from 'react'
import { ChevronLeft, ChevronRight, Expand, X } from 'lucide-react'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'

interface PostImageGalleryProps {
  urls: string[]
  title?: string
}

export function PostImageGallery({ urls, title = 'Post photo' }: PostImageGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0)
  const [open, setOpen] = useState(false)
  const visibleUrls = urls.filter(Boolean)
  const count = visibleUrls.length

  useEffect(() => {
    if (!open || count < 2) return

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'ArrowLeft') {
        setActiveIndex((index) => (index - 1 + count) % count)
      } else if (event.key === 'ArrowRight') {
        setActiveIndex((index) => (index + 1) % count)
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [count, open])

  if (count === 0) return null

  const openImage = (index: number) => {
    setActiveIndex(index)
    setOpen(true)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <div
        className={cn(
          'mt-3 grid gap-1.5 overflow-hidden rounded-xl border border-border bg-muted/45',
          count === 1 ? 'grid-cols-1' : 'grid-cols-2',
        )}
      >
        {visibleUrls.slice(0, 4).map((url, index) => (
          <button
            key={`${url}-${index}`}
            type="button"
            onClick={() => openImage(index)}
            aria-label={`Open photo ${index + 1} of ${count}`}
            className={cn(
              'group relative flex min-w-0 items-center justify-center overflow-hidden bg-black/5 focus-visible:z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset dark:bg-white/5',
              count === 1 ? 'min-h-48 max-h-[32rem]' : 'aspect-square',
              count === 3 && index === 0 ? 'row-span-2' : '',
            )}
          >
            <img
              src={url}
              alt={`${title} ${index + 1}`}
              loading="lazy"
              decoding="async"
              className={cn(
                'object-contain transition-transform duration-200 group-hover:scale-[1.01]',
                count === 1 ? 'max-h-[32rem] w-full' : 'h-full w-full',
              )}
            />
            <span className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-black/55 text-white opacity-90 shadow-sm backdrop-blur-sm sm:opacity-0 sm:transition-opacity sm:group-hover:opacity-100">
              <Expand size={15} />
            </span>
            {index === 3 && count > 4 ? (
              <span className="absolute inset-0 flex items-center justify-center bg-black/55 text-xl font-black text-white">
                +{count - 4}
              </span>
            ) : null}
          </button>
        ))}
      </div>

      <DialogContent
        showCloseButton={false}
        className="h-[100dvh] max-h-[100dvh] w-screen max-w-none gap-0 overflow-hidden rounded-none border-0 bg-black/95 p-0 text-white sm:h-[92dvh] sm:max-h-[92dvh] sm:w-[94vw] sm:max-w-[94vw] sm:rounded-2xl"
      >
        <DialogTitle className="sr-only">{title}</DialogTitle>
        <div className="relative flex min-h-0 flex-1 items-center justify-center p-3 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-[calc(3.5rem+env(safe-area-inset-top))] sm:p-6">
          <img
            src={visibleUrls[activeIndex]}
            alt={`${title} ${activeIndex + 1} of ${count}`}
            className="max-h-full max-w-full object-contain"
          />

          <DialogClose asChild>
            <button
              type="button"
              aria-label="Close photo viewer"
              className="absolute right-3 top-[calc(0.75rem+env(safe-area-inset-top))] flex h-11 w-11 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur-sm transition-colors hover:bg-white/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              <X size={22} />
            </button>
          </DialogClose>

          {count > 1 ? (
            <>
              <button
                type="button"
                aria-label="Previous photo"
                onClick={() => setActiveIndex((index) => (index - 1 + count) % count)}
                className="absolute left-2 top-1/2 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-black/45 text-white backdrop-blur-sm transition-colors hover:bg-black/65 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white sm:left-4"
              >
                <ChevronLeft size={28} />
              </button>
              <button
                type="button"
                aria-label="Next photo"
                onClick={() => setActiveIndex((index) => (index + 1) % count)}
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
