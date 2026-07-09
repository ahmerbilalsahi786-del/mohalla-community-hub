import type { ComponentProps } from 'react'
import { Link } from 'wouter'
import { cn } from '@/lib/utils'

export const MOHALLA_BRAND_MARK_SRC = '/brand/mohalla-brand-mark.png'

type MohallaBrandMarkProps = ComponentProps<'span'> & {
  animated?: boolean
  imageClassName?: string
}

export function MohallaBrandMark({
  animated = false,
  className,
  imageClassName,
  ...props
}: MohallaBrandMarkProps) {
  return (
    <span
      className={cn(
        'mohalla-brand-mark relative inline-flex shrink-0 items-center justify-center overflow-visible rounded-xl',
        animated && 'mohalla-brand-mark-animated',
        className,
      )}
      {...props}
    >
      <img
        src={MOHALLA_BRAND_MARK_SRC}
        alt=""
        draggable={false}
        className={cn('h-full w-full rounded-[inherit] object-contain', imageClassName)}
      />
      {animated && (
        <span className="mohalla-brand-orbit" aria-hidden="true">
          <span className="mohalla-brand-orbit-dot mohalla-brand-orbit-dot-top" />
          <span className="mohalla-brand-orbit-dot mohalla-brand-orbit-dot-left" />
          <span className="mohalla-brand-orbit-dot mohalla-brand-orbit-dot-right" />
        </span>
      )}
    </span>
  )
}

type MohallaBrandLinkProps = {
  className?: string
  markClassName?: string
  labelClassName?: string
  href?: string
  animated?: boolean
}

export function MohallaBrandLink({
  className,
  markClassName,
  labelClassName,
  href = '/',
  animated = true,
}: MohallaBrandLinkProps) {
  return (
    <Link href={href} className={cn('inline-flex items-center gap-2.5', className)}>
      <MohallaBrandMark animated={animated} className={cn('h-11 w-11', markClassName)} />
      <span className={cn('brand-wordmark text-2xl text-foreground', labelClassName)}>Mohalla</span>
    </Link>
  )
}

export function MohallaLoadingScreen() {
  return (
    <div className="mohalla-loading-screen flex min-h-screen items-center justify-center bg-background text-foreground">
      <div className="mohalla-loading-card flex flex-col items-center gap-5">
        <MohallaBrandMark animated className="mohalla-brand-mark-transparent h-28 w-28 sm:h-32 sm:w-32" />
        <div className="text-center">
          <p className="brand-wordmark text-2xl text-foreground">Mohalla</p>
          <p className="sr-only">Loading Mohalla</p>
        </div>
      </div>
    </div>
  )
}
