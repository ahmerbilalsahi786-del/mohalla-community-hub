import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'

interface UserAvatarProps {
  name?: string | null
  src?: string | null
  className?: string
  fallbackClassName?: string
  alt?: string
}

function initials(name?: string | null) {
  const value = name?.trim() || 'Resident'
  return value
    .split(/\s+/)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

export function UserAvatar({ name, src, className, fallbackClassName, alt }: UserAvatarProps) {
  return (
    <Avatar className={cn('h-10 w-10 bg-muted ring-1 ring-primary/15', className)}>
      {src ? (
        <AvatarImage
          src={src}
          alt={alt ?? `${name?.trim() || 'Resident'} profile picture`}
          className="object-cover"
          referrerPolicy="no-referrer"
        />
      ) : null}
      <AvatarFallback
        delayMs={src ? 200 : 0}
        className={cn('bg-primary/10 text-sm font-bold text-primary', fallbackClassName)}
      >
        {initials(name)}
      </AvatarFallback>
    </Avatar>
  )
}
