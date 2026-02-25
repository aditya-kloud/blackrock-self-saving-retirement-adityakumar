import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts'
import { formatDate, formatCurrency } from '../utils/csvParser'

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border border-gray-100 bg-white shadow-md px-3 py-2 text-sm">
      <p className="font-semibold text-gray-700 mb-1 text-xs">{label}</p>
      {payload.map(p => (
        <div key={p.dataKey} className="flex items-center gap-2">
          <span className="text-gray-600">{p.name}:</span>
          <span className="font-medium text-gray-900">{formatCurrency(p.value)}</span>
        </div>
      ))}
    </div>
  )
}

export default function KPeriodAggregation({ npsResult }) {
  const periods = npsResult?.savingsByDates

  if (!periods?.length) {
    return (
      <div className="card">
        <p className="section-title">K Period Aggregation</p>
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <svg className="h-10 w-10 text-gray-200 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
          </svg>
          <p className="text-sm text-gray-500">No K-period data yet.</p>
          <p className="text-xs text-gray-400 mt-1">Process transactions to see aggregated savings per period.</p>
        </div>
      </div>
    )
  }

  const data = periods.map((p, i) => ({
    period: `K${i + 1}: ${formatDate(p.start)}`,
    amount: p.amount,
    profit: p.profit,
  }))

  const PALETTE = ['#3b82f6', '#6366f1', '#8b5cf6', '#06b6d4', '#0ea5e9', '#14b8a6']

  return (
    <div className="card">
      <p className="section-title">K Period Aggregation</p>
      <p className="text-xs text-gray-400 mb-4">Total remanent invested per evaluation window</p>
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={data} barCategoryGap="35%">
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
          <XAxis
            dataKey="period"
            tick={{ fontSize: 11, fill: '#6b7280' }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tickFormatter={v => `₹${(v / 1000).toFixed(0)}k`}
            tick={{ fontSize: 11, fill: '#9ca3af' }}
            axisLine={false}
            tickLine={false}
            width={60}
          />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="amount" name="Remanent Amount" radius={[4, 4, 0, 0]}>
            {data.map((_, i) => (
              <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {/* Period table */}
      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="py-2 text-left text-gray-400 font-medium">Period</th>
              <th className="py-2 text-right text-gray-400 font-medium">From</th>
              <th className="py-2 text-right text-gray-400 font-medium">To</th>
              <th className="py-2 text-right text-gray-400 font-medium">Remanent</th>
              <th className="py-2 text-right text-gray-400 font-medium">NPS Profit</th>
            </tr>
          </thead>
          <tbody>
            {periods.map((p, i) => (
              <tr key={i} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                <td className="py-2 text-gray-600 font-medium">K{i + 1}</td>
                <td className="py-2 text-right text-gray-500">{formatDate(p.start)}</td>
                <td className="py-2 text-right text-gray-500">{formatDate(p.end)}</td>
                <td className="py-2 text-right text-gray-800 font-medium">{formatCurrency(p.amount)}</td>
                <td className="py-2 text-right text-blue-600 font-medium">{formatCurrency(p.profit)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
