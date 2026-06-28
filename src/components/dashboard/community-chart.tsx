import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { useAdminGetStats, useListAlerts, useListEvents } from '@/lib/generated/api'

export function CommunityChart() {
  const { data: stats } = useAdminGetStats({ communityId: 'default' })
  const { data: eventData } = useListEvents({ communityId: 'default' })
  const { data: alertData = [] } = useListAlerts({ communityId: 'default' })

  const data = [
    { name: 'Members', total: stats?.totalMembers ?? 0, fill: '#0f766e' },
    { name: 'Posts', total: stats?.postsThisMonth ?? 0, fill: '#2563eb' },
    { name: 'Events', total: eventData?.upcoming?.length ?? 0, fill: '#f59e0b' },
    {
      name: 'Alerts',
      total: (alertData as any[]).filter((alert) => !alert.isResolved).length,
      fill: '#ef4444',
    },
  ]

  return (
    <div className="portal-panel overflow-hidden rounded-[1.9rem] p-6">
      <div className="mb-6">
        <h3 className="portal-section-title text-lg text-card-foreground">Community Overview</h3>
        <p className="text-sm text-muted-foreground">A live read of momentum across your mohalla</p>
      </div>

      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-border" vertical={false} />
            <XAxis
              dataKey="name"
              stroke="currentColor"
              className="text-muted-foreground"
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              allowDecimals={false}
              stroke="currentColor"
              className="text-muted-foreground"
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip
              cursor={{ fill: 'var(--muted)', opacity: 0.35 }}
              contentStyle={{
                backgroundColor: 'var(--popover)',
                border: '1px solid var(--border)',
                borderRadius: '16px',
                color: 'var(--foreground)',
                boxShadow: '0 18px 48px rgba(15, 23, 42, 0.08)',
              }}
            />
            <Line
              type="monotone"
              dataKey="total"
              stroke="var(--chart-1)"
              strokeWidth={3}
              dot={{ r: 4, fill: 'var(--chart-1)' }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
