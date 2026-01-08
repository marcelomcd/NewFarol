import { ResponsiveContainer, ComposedChart, Bar, Area, XAxis, YAxis, Tooltip, Legend } from 'recharts'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

const COLORS = {
  primary: '#0078d4',
  warning: '#ffaa44',
}

interface BurndownChartProps {
  data: Array<{
    date: string
    remaining: number
    completed: number
    total_scope: number
  }>
  dates?: string[]
  completed_percent?: number
  stories_remaining?: number
  average_burndown?: number
  total_scope_change?: number
}

export default function BurndownChart({
  data,
  dates,
  completed_percent = 0,
  stories_remaining = 0,
  average_burndown = 0,
  total_scope_change = 0,
}: BurndownChartProps) {
  const dateRange =
    dates && dates.length > 0
      ? `${format(new Date(dates[0]), 'dd/MM/yyyy')} - ${format(new Date(dates[dates.length - 1]), 'dd/MM/yyyy')}`
      : ''

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Burndown {dateRange}
        </h3>
        <div className="flex gap-4 text-sm flex-wrap">
          <div className="text-gray-600 dark:text-gray-400">
            <span className="font-semibold">Completed:</span> {completed_percent}%
          </div>
          <div className="text-gray-600 dark:text-gray-400">
            <span className="font-semibold">Stories Remaining:</span> {stories_remaining}
          </div>
          <div className="text-gray-600 dark:text-gray-400">
            <span className="font-semibold">Average burndown:</span>{' '}
            {average_burndown > 0 ? '+' : ''}
            {average_burndown}
          </div>
          <div className="text-gray-600 dark:text-gray-400">
            <span className="font-semibold">Total Scope:</span> {total_scope_change > 0 ? '+' : ''}
            {total_scope_change} Increase
          </div>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={400}>
        <ComposedChart data={data}>
          <XAxis
            dataKey="date"
            tick={{ fontSize: 10 }}
            angle={-45}
            textAnchor="end"
            height={80}
            tickFormatter={(value) => {
              try {
                return format(new Date(value), 'dd/MM', { locale: ptBR })
              } catch {
                return value
              }
            }}
          />
          <YAxis yAxisId="left" />
          <YAxis yAxisId="right" orientation="right" />
          <Tooltip
            labelFormatter={(value) => {
              try {
                return format(new Date(value), 'dd/MM/yyyy', { locale: ptBR })
              } catch {
                return value
              }
            }}
          />
          <Legend />
          <Bar yAxisId="right" dataKey="remaining" fill={COLORS.primary} name="Remaining - Burndown" />
          <Area
            yAxisId="left"
            type="monotone"
            dataKey="total_scope"
            fill={COLORS.warning}
            fillOpacity={0.3}
            stroke={COLORS.warning}
            strokeWidth={2}
            name="Total Scope"
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}

