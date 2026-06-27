import { useState } from 'react'
import { AdminLayout } from './AdminLayout'
import { useAdminDeleteMember, useAdminVerifyMember, useAdminSetMemberRole } from '@/lib/generated/api'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
  CheckCircle2, XCircle, Trash2, BadgeCheck, ChevronDown, Clock, Users
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { supabase } from '@/integrations/supabase/client'
import { useCurrentUser } from '@/hooks/use-current-user'
import { useToast } from '@/hooks/use-toast'
import { titleCaseWord } from '@/lib/format-label'

type Member = {
  id: number; userId: string; name: string; unitNumber: string; phone: string;
  status: string; role: string; isVerified: boolean; joinDate: string; communityId: string;
}

const ROLE_OPTIONS = ['user', 'moderator', 'admin']

const ROLE_COLORS: Record<string, string> = {
  admin:     'bg-purple-500/10 text-purple-700',
  moderator: 'bg-blue-500/10 text-blue-700',
  user:      'bg-muted text-muted-foreground',
}

function rowId(value: string) {
  return value as unknown as number
}

function memberName(profile: any) {
  return profile.display_name ?? profile.full_name ?? profile.email?.split('@')[0] ?? 'Resident'
}

function toMember(profile: any): Member {
  return {
    id: rowId(profile.id),
    userId: profile.id,
    name: memberName(profile),
    unitNumber: profile.unit_number ?? '',
    phone: profile.phone ?? profile.whatsapp_number ?? '',
    status: profile.membership_status ?? (profile.is_verified ? 'approved' : 'pending'),
    role: profile.role ?? 'user',
    isVerified: Boolean(profile.is_verified),
    joinDate: profile.created_at ?? new Date().toISOString(),
    communityId: profile.community_id ?? 'default',
  }
}

async function loadAdminMembers(communityId?: string | null) {
  if (!communityId) return []
  const { data, error } = await (supabase as any).rpc('admin_list_members', { requested_status: null })

  if (error) throw error
  return (data ?? []).map(toMember)
}

function timeAgo(d: string) {
  const diff = Math.floor((Date.now() - new Date(d).getTime()) / 86400000)
  if (diff === 0) return 'Today'
  if (diff === 1) return 'Yesterday'
  return `${diff}d ago`
}

function MemberRow({ member, refetch }: { member: Member; refetch: () => void }) {
  const qc = useQueryClient()
  const { toast } = useToast()
  const inv = () => {
    qc.invalidateQueries({ queryKey: ['admin-members'] })
    qc.invalidateQueries({ queryKey: ['admin-members-pending-count'] })
    refetch()
  }

  const del     = useAdminDeleteMember({ mutation: { onSuccess: inv } })
  const verify  = useAdminVerifyMember({ mutation: { onSuccess: inv } })
  const setRole = useAdminSetMemberRole({ mutation: { onSuccess: inv } })

  const updateMembership = async (status: 'approved' | 'rejected') => {
    qc.setQueriesData<Member[]>({ queryKey: ['admin-members'] }, (current) =>
      current?.map((item) =>
        item.userId === member.userId
          ? { ...item, status, isVerified: status === 'approved' }
          : item
      )
    )

    const { error } = await (supabase as any).rpc('admin_manage_member', {
      target_user: member.userId,
      requested_action: status === 'approved' ? 'approve' : 'reject',
      requested_role: null,
    })

    if (error) {
      await refetch()
      toast({ title: error.message || `Could not ${status === 'approved' ? 'approve' : 'reject'} member.`, variant: 'destructive' })
      return
    }

    if (status === 'approved') {
      toast({ title: 'Member approved' })
    } else {
      toast({ title: 'Member rejected' })
    }
    inv()
  }

  return (
    <tr className="border-b border-border hover:bg-muted/30 transition-colors">
      <td className="px-4 py-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary/60 to-accent/60 text-xs font-bold text-white">
            {member.name.split(' ').map(n => n[0]).join('').slice(0,2).toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-medium text-foreground">{member.name}</span>
              {member.isVerified && <BadgeCheck size={13} className="text-blue-500" />}
            </div>
            <span className="text-xs text-muted-foreground">{member.userId}</span>
          </div>
        </div>
      </td>
      <td className="px-4 py-3 text-sm text-muted-foreground">{member.unitNumber}</td>
      <td className="px-4 py-3 text-sm text-muted-foreground">{member.phone || '—'}</td>
      <td className="px-4 py-3 text-sm text-muted-foreground">{timeAgo(member.joinDate)}</td>
      <td className="px-4 py-3">
        <span className={cn('rounded-full px-2 py-0.5 text-xs font-semibold', ROLE_COLORS[member.role] || ROLE_COLORS.user)}>
          {titleCaseWord(member.role)}
        </span>
      </td>
      <td className="px-4 py-3">
        {member.status === 'pending' ? (
          <span className="flex items-center gap-1 text-xs font-medium text-amber-600">
            <Clock size={12} /> Pending
          </span>
        ) : member.status === 'approved' ? (
          <span className="flex items-center gap-1 text-xs font-medium text-green-600">
            <CheckCircle2 size={12} /> Approved
          </span>
        ) : (
          <span className="flex items-center gap-1 text-xs font-medium text-red-500">
            <XCircle size={12} /> Rejected
          </span>
        )}
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-1">
          {member.status === 'pending' && (
            <>
              <button
                onClick={() => updateMembership('approved')}
                className="flex items-center gap-1 rounded-lg bg-green-500/10 px-2 py-1 text-xs font-medium text-green-700 hover:bg-green-500/20 transition-colors"
              >
                <CheckCircle2 size={12} /> Approve
              </button>
              <button
                onClick={() => updateMembership('rejected')}
                className="flex items-center gap-1 rounded-lg bg-red-500/10 px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-500/20 transition-colors"
              >
                <XCircle size={12} /> Reject
              </button>
            </>
          )}
          {member.status === 'approved' && (
            <>
              <button
                onClick={() => verify.mutate({ memberId: member.id })}
                title={member.isVerified ? 'Remove verified badge' : 'Mark as verified'}
                className={cn(
                  'flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium transition-colors',
                  member.isVerified
                    ? 'bg-blue-500/10 text-blue-700 hover:bg-blue-500/20'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                )}
              >
                <BadgeCheck size={12} />
                {member.isVerified ? 'Verified' : 'Verify'}
              </button>
              <div className="relative">
                <select
                  value={member.role}
                  onChange={e => setRole.mutate({ memberId: member.id, data: { role: e.target.value } })}
                  className="appearance-none rounded-lg border border-border bg-background px-2 py-1 pr-6 text-xs text-foreground focus:outline-none focus:border-primary cursor-pointer"
                >
                  {ROLE_OPTIONS.map(r => <option key={r} value={r}>{titleCaseWord(r)}</option>)}
                </select>
                <ChevronDown size={10} className="pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              </div>
            </>
          )}
          <button
            onClick={() => { if (confirm(`Remove ${member.name}?`)) del.mutate({ memberId: member.id }) }}
            className="flex h-6 w-6 items-center justify-center rounded-lg text-muted-foreground hover:bg-red-500/10 hover:text-red-500 transition-colors"
          >
            <Trash2 size={13} />
          </button>
        </div>
      </td>
    </tr>
  )
}

export default function AdminMembers() {
  const [tab, setTab] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all')
  const { data: user } = useCurrentUser()
  const communityId = user?.community?.id

  const { data: allMembers = [], isLoading, refetch, error } = useQuery<Member[], Error>({
    queryKey: ['admin-members', communityId],
    queryFn: () => loadAdminMembers(communityId),
    enabled: Boolean(communityId),
  })
  const members = tab === 'all' ? allMembers : allMembers.filter((member: Member) => member.status === tab)

  const counts = {
    all:      allMembers.length,
    pending:  allMembers.filter((m: Member) => m.status === 'pending').length,
    approved: allMembers.filter((m: Member) => m.status === 'approved').length,
    rejected: allMembers.filter((m: Member) => m.status === 'rejected').length,
  }

  const TAB_LABELS: Record<string, string> = { all: 'All', pending: 'Pending', approved: 'Approved', rejected: 'Rejected' }

  return (
    <AdminLayout>
      <div className="max-w-5xl">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-foreground">Members</h2>
            <p className="text-sm text-muted-foreground mt-0.5">Manage community membership and roles</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-4 flex gap-1 border-b border-border">
          {(['all', 'pending', 'approved', 'rejected'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cn(
                'flex items-center gap-1.5 border-b-2 px-4 py-2.5 text-sm font-medium transition-colors',
                tab === t ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
              )}
            >
              {TAB_LABELS[t]}
              {t === 'pending' && counts.pending > 0 && (
                <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                  {counts.pending}
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
          {isLoading ? (
            <div className="space-y-3 p-6">
              {[1,2,3,4].map(i => <div key={i} className="h-12 rounded-xl bg-muted animate-pulse" />)}
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-500/10 mb-3">
                <XCircle size={24} className="text-red-500" />
              </div>
              <p className="font-medium text-foreground">Could not load members</p>
              <p className="max-w-md text-sm text-muted-foreground mt-1">
                {error instanceof Error ? error.message : 'Please refresh and try again.'}
              </p>
            </div>
          ) : members.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-muted mb-3">
                <Users size={24} className="text-muted-foreground" />
              </div>
              <p className="font-medium text-foreground">No members here</p>
              <p className="text-sm text-muted-foreground mt-1">
                {tab === 'pending' ? 'No pending join requests.' : 'No members match this filter.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Name</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Unit</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Phone</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Joined</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Role</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {members.map((m: Member) => (
                    <MemberRow key={m.id} member={m} refetch={refetch} />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  )
}
