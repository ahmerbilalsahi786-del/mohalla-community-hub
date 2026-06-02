
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

const data = [
  { month: 'Jan', members: 120, events: 8, posts: 45 },
  { month: 'Feb', members: 145, events: 12, posts: 62 },
  { month: 'Mar', members: 180, events: 15, posts: 78 },
  { month: 'Apr', members: 220, events: 18, posts: 95 },
  { month: 'May', members: 280, events: 22, posts: 120 },
  { month: 'Jun', members: 350, events: 28, posts: 150 },
]

export function CommunityChart() {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-border bg-card p-6 shadow-sm">
      {/* Decorative blobs */}
      <div className="absolute -right-20 -top-20 h-40 w-40 rounded-full bg-primary/5 blur-3xl" />
      <div className="absolute -bottom-10 -left-10 h-32 w-32 rounded-full bg-accent/5 blur-2xl" />

      {/* Header */}
      <div className="relative mb-6 flex items-start justify-between">
        <div>
          <h3 className="text-lg font-bold text-card-foreground">Community Growth</h3>
          <p className="text-sm text-muted-foreground">Member activity over time</p>
        </div>
        <div className="flex gap-4">
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-primary" />
            <span className="text-xs text-muted-foreground">Members</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-accent" />
            <span className="text-xs text-muted-foreground">Posts</span>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="relative h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="colorMembers" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#1B5E20" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#1B5E20" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorPosts" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#0288D1" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#0288D1" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="currentColor"
              className="text-border"
              vertical={false}
            />
            <XAxis
              dataKey="month"
              stroke="currentColor"
              className="text-muted-foreground"
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              stroke="currentColor"
              className="text-muted-foreground"
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '12px',
                boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)',
              }}
              labelStyle={{ color: 'hsl(var(--card-foreground))', fontWeight: 600 }}
            />
            <Area
              type="monotone"
              dataKey="members"
              stroke="#1B5E20"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorMembers)"
            />
            <Area
              type="monotone"
              dataKey="posts"
              stroke="#0288D1"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorPosts)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
