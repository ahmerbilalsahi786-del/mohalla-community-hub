import {
  Bar,
  BarChart,
  Cell,
  CartesianGrid,
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
    <div className="overflow-hidden rounded-2xl border border-border bg-card p-6 shadow-sm">
      <div className="mb-6">
        <h3 className="text-lg font-bold text-card-foreground">Community Overview</h3>
        <p className="text-sm text-muted-foreground">Current data from your mohalla</p>
      </div>

      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
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
              cursor={{ fill: 'hsl(var(--muted))', opacity: 0.35 }}
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
              }}
            />
            <Bar dataKey="total" radius={[6, 6, 0, 0]}>
              {data.map((entry) => (
                <Cell key={entry.name} fill={entry.fill} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
