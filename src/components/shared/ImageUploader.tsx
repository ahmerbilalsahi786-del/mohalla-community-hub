import { ChangeEvent, DragEvent, useRef, useState } from 'react'
import { ImagePlus, Loader2, Trash2, UploadCloud } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { SmartImageGrid } from '@/components/shared/SmartImageGrid'
import { useToast } from '@/hooks/use-toast'
import { uploadImageAsset } from '@/lib/cloudinary'
import { ImageAsset, normalizeImageAssets } from '@/lib/imageLayout'
import { cn } from '@/lib/utils'

interface ImageUploaderProps {
  value: ImageAsset[]
  onChange: (images: ImageAsset[]) => void
  maxImages?: number
  label?: string
  primaryBadgeLabel?: string
  onUploadingChange?: (uploading: boolean) => void
  className?: string
}

export function ImageUploader({
  value,
  onChange,
  maxImages = 4,
  label = 'Photos',
  primaryBadgeLabel,
  onUploadingChange,
  className,
}: ImageUploaderProps) {
  const fileRef = useRef<HTMLInputElement | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const { toast } = useToast()
  const images = normalizeImageAssets(value)
  const canAddMore = images.length < maxImages

  const setUploading = (uploading: boolean) => {
    setIsUploading(uploading)
    onUploadingChange?.(uploading)
  }

  const uploadFiles = async (fileList: FileList | File[]) => {
    const files = Array.from(fileList)
    if (!files.length) return

    const remaining = maxImages - images.length
    if (remaining <= 0) {
      toast({ title: `You can add up to ${maxImages} photos.`, variant: 'destructive' })
      return
    }

    const selectedFiles = files.slice(0, remaining)
    if (files.length > remaining) {
      toast({ title: `Only ${remaining} more photo${remaining === 1 ? '' : 's'} can be added.` })
    }

    setUploading(true)
    try {
      const uploaded = await Promise.all(selectedFiles.map((file) => uploadImageAsset(file)))
      const goodImages = uploaded.filter((image): image is ImageAsset => Boolean(image))

      if (goodImages.length !== selectedFiles.length) {
        toast({ title: 'Some photos could not be uploaded.', variant: 'destructive' })
      }

      if (goodImages.length) onChange([...images, ...goodImages])
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  const onInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) void uploadFiles(event.target.files)
  }

  const onDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    setIsDragging(false)
    void uploadFiles(event.dataTransfer.files)
  }

  return (
    <div className={cn('space-y-3', className)}>
      <div className="flex items-center justify-between gap-3">
        <div className="space-y-0.5">
          <p className="text-sm font-semibold text-foreground">{label}</p>
          <p className="text-xs text-muted-foreground">
            {images.length}/{maxImages} selected
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => fileRef.current?.click()}
          disabled={!canAddMore || isUploading}
        >
          {isUploading ? <Loader2 className="animate-spin" /> : <ImagePlus />}
          Add photos
        </Button>
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        multiple={maxImages > 1}
        className="hidden"
        onChange={onInputChange}
      />

      <div
        onDragOver={(event) => {
          event.preventDefault()
          setIsDragging(true)
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={onDrop}
        className={cn(
          'rounded-xl border border-dashed border-border bg-muted/35 p-3 transition-colors',
          isDragging && 'border-primary bg-primary/5',
        )}
      >
        {images.length ? (
          <div className="space-y-2">
            <SmartImageGrid
              images={images}
              title={label}
              onImageClick={() => undefined}
              firstImageOverlay={primaryBadgeLabel ? (
                <span className="absolute left-2 top-2 rounded-full bg-black/60 px-2 py-1 text-[11px] font-bold text-white backdrop-blur-sm">
                  {primaryBadgeLabel}
                </span>
              ) : null}
            />
            <div className="flex flex-wrap gap-2">
              {images.map((image, index) => (
                <Button
                  key={`${image.url}-${index}`}
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => onChange(images.filter((_, itemIndex) => itemIndex !== index))}
                >
                  <Trash2 />
                  Remove {index + 1}
                </Button>
              ))}
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={!canAddMore || isUploading}
            className="flex min-h-32 w-full flex-col items-center justify-center rounded-lg text-center text-muted-foreground transition-colors hover:bg-background/70 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isUploading ? (
              <Loader2 className="mb-2 size-8 animate-spin text-primary" />
            ) : (
              <UploadCloud className="mb-2 size-8 text-primary" />
            )}
            <span className="text-sm font-semibold text-foreground">
              {isUploading ? 'Uploading photos...' : 'Drop photos here or click to upload'}
            </span>
            <span className="mt-1 text-xs">JPG, PNG, WebP, or GIF under 8 MB</span>
          </button>
        )}
      </div>
    </div>
  )
}

