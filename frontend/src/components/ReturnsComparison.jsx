import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell,
} from 'recharts'
import { formatCurrency } from '../utils/csvParser'

const COLORS = {
  profit:     '#3b82f6',
  taxBenefit: '#93c5fd',
  indexProfit: '#10b981',
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border border-gray-100 bg-white shadow-md px-3 py-2 text-sm">
      <p className="font-semibold text-gray-800 mb-1">{label}</p>
      {payload.map(p => (
        <div key={p.dataKey} className="flex items-center gap-2">
          <span className="inline-block h-2 w-2 rounded-full" style={{ background: p.fill }} />
          <span className="text-gray-600">{p.name}:</span>
          <span className="font-medium text-gray-900">{formatCurrency(p.value)}</span>
        </div>
      ))}
    </div>
  )
}

export default function ReturnsComparison({ npsResult, indexResult }) {
  const hasData = npsResult?.savingsByDates?.length > 0 || indexResult?.savingsByDates?.length > 0

  if (!hasData) {
    return (
      <div className="card">
        <p className="section-title">Returns Comparison</p>
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <svg className="h-10 w-10 text-gray-200 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <p className="text-sm text-gray-500">No returns data yet.</p>
          <p className="text-xs text-gray-400 mt-1">Process your transactions to see NPS vs Index returns.</p>
        </div>
      </div>
    )
  }

  const npsProfit = npsResult.savingsByDates.reduce((sum, s) => sum + s.profit, 0)
  const npsTax   = npsResult.savingsByDates.reduce((sum, s) => sum + s.taxBenefit, 0)
  const idxProfit = indexResult.savingsByDates.reduce((sum, s) => sum + s.profit, 0)

  const data = [
    { name: 'NPS',   profit: npsProfit,  taxBenefit: npsTax,   indexProfit: 0 },
    { name: 'Index', profit: 0,          taxBenefit: 0,         indexProfit: idxProfit },
  ]

  return (
    <div className="card">
      <p className="section-title">Returns Comparison</p>
      <div className="flex flex-wrap gap-4 mb-4">
        <Stat label="NPS Real Profit" value={formatCurrency(npsProfit)} color="text-blue-600" />
        <Stat label="NPS Tax Benefit" value={formatCurrency(npsTax)} color="text-blue-400" />
        <Stat label="Index Real Profit" value={formatCurrency(idxProfit)} color="text-emerald-600" />
      </div>
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={data} barCategoryGap="40%" barGap={4}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
          <XAxis
            dataKey="name"
            tick={{ fontSize: 13, fill: '#6b7280' }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tickFormatter={v => `₹${(v / 1000).toFixed(0)}k`}
            tick={{ fontSize: 11, fill: '#9ca3af' }}
            axisLine={false}
            tickLine={false}
            width={64}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            formatter={v => <span className="text-xs text-gray-600">{v}</span>}
            iconType="circle"
            iconSize={8}
          />
          <Bar dataKey="profit"      name="NPS Profit"      fill={COLORS.profit}      radius={[4, 4, 0, 0]} />
          <Bar dataKey="taxBenefit"  name="NPS Tax Benefit" fill={COLORS.taxBenefit}  radius={[4, 4, 0, 0]} />
          <Bar dataKey="indexProfit" name="Index Profit"    fill={COLORS.indexProfit} radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

function Stat({ label, value, color }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className={`text-base font-bold tabular-nums ${color}`}>{value}</span>
      <span className="text-xs text-gray-400">{label}</span>
    </div>
  )
}
