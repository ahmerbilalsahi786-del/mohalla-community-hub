import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useToast } from '@/hooks/use-toast'
import { Copy, Link2, MessageCircle, Share2 } from 'lucide-react'

type InviteToolsProps = {
  communityName: string
  communityId?: string | number | null
  area?: string
  city?: string
  editableMessage?: boolean
  title?: string
  description?: string
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function buildDefaultMessage(communityName: string, area?: string, city?: string) {
  const place = [area, city].filter(Boolean).join(', ')
  if (place) {
    return `Join ${communityName} on Mohalla Community Hub. We are organizing our neighborhood in ${place}.`
  }
  return `Join ${communityName} on Mohalla Community Hub and stay connected with the neighborhood.`
}

export function InviteTools({
  communityName,
  communityId,
  area,
  city,
  editableMessage = false,
  title = 'Invite Members',
  description = 'Share the community invite link with neighbors.',
}: InviteToolsProps) {
  const { toast } = useToast()
  const [origin, setOrigin] = useState('')
  const [message, setMessage] = useState(buildDefaultMessage(communityName, area, city))

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setOrigin(window.location.origin)
    }
  }, [])

  useEffect(() => {
    setMessage(buildDefaultMessage(communityName, area, city))
  }, [communityName, area, city])

  const inviteSlug = slugify(communityName || 'mohalla-community')
  const baseUrl = origin || 'http://127.0.0.1:4173'
  const communityParam = encodeURIComponent(communityName || 'Mohalla Community')
  const inviteUrl = communityId
    ? `${baseUrl}/register?join=${encodeURIComponent(String(communityId))}&community=${communityParam}`
    : `${baseUrl}/register?community=${communityParam}&invite=${inviteSlug}`
  const whatsappText = `${message}\n\nJoin here: ${inviteUrl}`
  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(whatsappText)}`

  const copyText = async (value: string, label: string) => {
    try {
      await navigator.clipboard.writeText(value)
      toast({ title: `${label} copied`, description: 'Ready to share with your neighbors.' })
    } catch {
      toast({ title: `Could not copy ${label.toLowerCase()}`, description: 'Please try again.', variant: 'destructive' })
    }
  }

  const shareInvite = async () => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({ title: communityName, text: message, url: inviteUrl })
        return
      } catch {
        return
      }
    }
    await copyText(inviteUrl, 'Invitation link')
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
      <div className="mb-4">
        <h3 className="text-sm font-bold text-foreground">{title}</h3>
        <p className="mt-1 text-xs text-muted-foreground">{description}</p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Community invite link
          </label>
          <div className="flex gap-2">
            <Input value={inviteUrl} readOnly className="rounded-xl bg-muted/30 text-sm" />
            <Button type="button" variant="outline" className="rounded-xl px-3" onClick={() => copyText(inviteUrl, 'Invitation link')}>
              <Copy size={15} />
            </Button>
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            WhatsApp invite
          </label>
          {editableMessage ? (
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
              className="w-full rounded-xl border border-border bg-muted/30 px-4 py-3 text-sm text-foreground focus:outline-none focus:border-primary transition-colors resize-none"
            />
          ) : (
            <div className="rounded-xl border border-border bg-muted/20 px-4 py-3 text-sm text-foreground">
              {message}
            </div>
          )}
        </div>

        <div className="grid gap-2 sm:grid-cols-2">
          <Button type="button" className="gap-2 rounded-xl" onClick={() => window.open(whatsappUrl, '_blank', 'noopener,noreferrer')}>
            <MessageCircle size={16} />
            Open WhatsApp Invite
          </Button>
          <Button type="button" variant="outline" className="gap-2 rounded-xl" onClick={() => copyText(whatsappText, 'WhatsApp message')}>
            <Link2 size={16} />
            Copy WhatsApp Text
          </Button>
          <Button type="button" variant="outline" className="gap-2 rounded-xl" onClick={shareInvite}>
            <Share2 size={16} />
            Share Invite
          </Button>
          <Button type="button" variant="outline" className="gap-2 rounded-xl" onClick={() => copyText(whatsappUrl, 'WhatsApp link')}>
            <Copy size={16} />
            Copy WhatsApp Link
          </Button>
        </div>
      </div>
    </div>
  )
}
