import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
import { formatDate, formatCurrency } from '../utils/csvParser'

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border border-gray-100 bg-white shadow-md px-3 py-2 text-sm">
      <p className="font-semibold text-gray-800 mb-1">{label}</p>
      {payload.map(p => (
        <div key={p.dataKey} className="flex items-center gap-2">
          <span className="inline-block h-2 w-2 rounded-full" style={{ background: p.stroke }} />
          <span className="text-gray-600">{p.name}:</span>
          <span className="font-medium text-gray-900">{formatCurrency(p.value)}</span>
        </div>
      ))}
    </div>
  )
}

export default function RemanentTrend({ parseResult, filterResult }) {
  if (!parseResult?.length) {
    return (
      <div className="card">
        <p className="section-title">Remanent Trend Over Time</p>
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <svg className="h-10 w-10 text-gray-200 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
          </svg>
          <p className="text-sm text-gray-500">No trend data yet.</p>
          <p className="text-xs text-gray-400 mt-1">Upload and process transactions to see the remanent trend.</p>
        </div>
      </div>
    )
  }

  // Build a lookup from date → adjusted remanent from filter result
  const filterMap = {}
  filterResult?.valid?.forEach(t => {
    filterMap[t.date] = t.remanent
  })

  // Merge parse and filter data, sorted by date
  const trendData = [...parseResult]
    .sort((a, b) => a.date.localeCompare(b.date))
    .map(t => ({
      date: formatDate(t.date),
      baseRemanent: t.remanent,
      adjustedRemanent: filterMap[t.date] !== undefined ? filterMap[t.date] : null,
    }))

  // Tick formatter: show every Nth label to avoid clutter
  const step = Math.max(1, Math.floor(trendData.length / 8))
  const ticks = trendData
    .filter((_, i) => i % step === 0)
    .map(d => d.date)

  return (
    <div className="card">
      <p className="section-title">Remanent Trend Over Time</p>
      <div className="flex items-center gap-5 mb-4">
        <div className="flex items-center gap-1.5">
          <span className="inline-block h-2 w-2 rounded-full bg-indigo-500" />
          <span className="text-xs text-gray-600">Base Remanent</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="inline-block h-2 w-2 rounded-full bg-amber-400" />
          <span className="text-xs text-gray-600">After Q/P Adjustments</span>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={280}>
        <LineChart data={trendData} margin={{ right: 8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
          <XAxis
            dataKey="date"
            ticks={ticks}
            tick={{ fontSize: 11, fill: '#9ca3af' }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tickFormatter={v => `₹${v}`}
            tick={{ fontSize: 11, fill: '#9ca3af' }}
            axisLine={false}
            tickLine={false}
            width={64}
          />
          <Tooltip content={<CustomTooltip />} />
          <Line
            type="monotone"
            dataKey="baseRemanent"
            name="Base Remanent"
            stroke="#6366f1"
            strokeWidth={2}
            dot={trendData.length < 30}
            activeDot={{ r: 4 }}
            connectNulls
          />
          <Line
            type="monotone"
            dataKey="adjustedRemanent"
            name="After Q/P Adjustments"
            stroke="#f59e0b"
            strokeWidth={2}
            dot={trendData.length < 30}
            activeDot={{ r: 4 }}
            strokeDasharray={filterResult ? undefined : '4 4'}
            connectNulls
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
