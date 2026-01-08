import { useQuery } from '@tanstack/react-query'
import { featuresApi } from '../../services/api'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { format, subDays } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export default function Dashboard() {
  const { data: featuresData } = useQuery({
    queryKey: ['features', 'all'],
    queryFn: () => featuresApi.list({ limit: 1000 }),
  })

  if (!featuresData) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg">Carregando...</div>
      </div>
    )
  }

  const items = featuresData.items || []

  // Contagem por estado
  const stateCounts = items.reduce((acc: Record<string, number>, item) => {
    const state = item.state || 'Sem Estado'
    acc[state] = (acc[state] || 0) + 1
    return acc
  }, {})

  // Ordenar estados por quantidade (decrescente) para exibição consistente
  const sortedStateCounts = Object.entries(stateCounts)
    .sort((a, b) => b[1] - a[1])
    .reduce((acc, [name, value]) => {
      acc[name] = value
      return acc
    }, {} as Record<string, number>)

  // Itens fechados por dia (últimos 30 dias)
  const closedByDay = items
    .filter((item) => ['Closed', 'Resolved', 'Done', 'Fechado', 'Concluído'].includes(item.state))
    .reduce((acc: Record<string, number>, item) => {
      const date = format(new Date(item.changed_date), 'yyyy-MM-dd')
      acc[date] = (acc[date] || 0) + 1
      return acc
    }, {})

  const last30Days = Array.from({ length: 30 }, (_, i) => {
    const date = subDays(new Date(), 29 - i)
    return format(date, 'yyyy-MM-dd')
  })

  const closedByDayData = last30Days.map((date) => ({
    date: format(new Date(date), 'dd/MM', { locale: ptBR }),
    closed: closedByDay[date] || 0,
  }))

  // Contagem por cliente
  const clientCounts = items.reduce((acc: Record<string, number>, item) => {
    const client = item.client || 'Sem Cliente'
    acc[client] = (acc[client] || 0) + 1
    return acc
  }, {})

  const clientData = Object.entries(clientCounts)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 10)

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Dashboard</h1>

      {/* Cards de métricas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="glass dark:glass-dark p-6 rounded-lg">
          <div className="text-sm text-gray-600 dark:text-gray-400">Total de Features</div>
          <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">{items.length}</div>
        </div>
        <div className="glass dark:glass-dark p-6 rounded-lg">
          <div className="text-sm text-gray-600 dark:text-gray-400">Em Aberto</div>
          <div className="text-3xl font-bold text-green-600 dark:text-green-400">
            {items.filter((item) => !['Closed', 'Resolved', 'Done', 'Fechado', 'Concluído'].includes(item.state))
              .length}
          </div>
        </div>
        <div className="glass dark:glass-dark p-6 rounded-lg">
          <div className="text-sm text-gray-600 dark:text-gray-400">Fechadas</div>
          <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">
            {items.filter((item) => ['Closed', 'Resolved', 'Done', 'Fechado', 'Concluído'].includes(item.state))
              .length}
          </div>
        </div>
        <div className="glass dark:glass-dark p-6 rounded-lg">
          <div className="text-sm text-gray-600 dark:text-gray-400">Clientes</div>
          <div className="text-3xl font-bold text-orange-600 dark:text-orange-400">
            {Object.keys(clientCounts).length}
          </div>
        </div>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Trend line: closed per day */}
        <div className="glass dark:glass-dark p-6 rounded-lg">
          <h2 className="text-xl font-bold mb-4 text-gray-800 dark:text-white">
            Features Fechadas por Dia (últimos 30 dias)
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={closedByDayData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="closed" stroke="#3b82f6" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Counts by state */}
        <div className="glass dark:glass-dark p-6 rounded-lg">
          <h2 className="text-xl font-bold mb-4 text-gray-800 dark:text-white">Contagem por Estado</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart 
              data={Object.entries(sortedStateCounts)
                .map(([name, value]) => ({ name, value }))}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Counts by client */}
        <div className="glass dark:glass-dark p-6 rounded-lg lg:col-span-2">
          <h2 className="text-xl font-bold mb-4 text-gray-800 dark:text-white">Top 10 Clientes</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={clientData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}

