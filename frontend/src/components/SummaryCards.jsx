import { formatCurrency } from '../utils/csvParser'

function KpiCard({ label, value, sub, color = 'blue' }) {
  const colorMap = {
    blue:   'bg-blue-50 text-blue-600',
    green:  'bg-green-50 text-green-600',
    red:    'bg-red-50 text-red-600',
    purple: 'bg-purple-50 text-purple-600',
  }

  return (
    <div className="card flex flex-col gap-2">
      <div className={`self-start rounded-lg p-2 ${colorMap[color]}`}>
        {color === 'blue' && (
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )}
        {color === 'green' && (
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )}
        {color === 'red' && (
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )}
        {color === 'purple' && (
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
          </svg>
        )}
      </div>
      <p className="text-2xl font-bold text-gray-900 tabular-nums">{value}</p>
      <div>
        <p className="text-sm font-medium text-gray-700">{label}</p>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  )
}

export default function SummaryCards({ npsResult, validateResult, filterResult }) {
  const totalInvested = npsResult?.totalTransactionAmount ?? null
  const validCount = validateResult?.valid?.length ?? null
  const invalidCount = validateResult?.invalid?.length ?? null

  const totalRemanent = filterResult?.valid
    ? filterResult.valid.reduce((sum, t) => sum + (t.remanent || 0), 0)
    : null

  return (
    <div>
      <p className="section-title">Summary</p>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="Total Invested"
          value={totalInvested !== null ? formatCurrency(totalInvested) : '—'}
          sub="Sum of all transaction amounts"
          color="blue"
        />
        <KpiCard
          label="Valid Transactions"
          value={validCount !== null ? validCount.toLocaleString() : '—'}
          sub="Passed all validation rules"
          color="green"
        />
        <KpiCard
          label="Invalid Transactions"
          value={invalidCount !== null ? invalidCount.toLocaleString() : '—'}
          sub="Failed one or more rules"
          color="red"
        />
        <KpiCard
          label="Total Remanent Invested"
          value={totalRemanent !== null ? formatCurrency(totalRemanent) : '—'}
          sub="Micro-savings (ceiling - amount) sum"
          color="purple"
        />
      </div>
    </div>
  )
}
