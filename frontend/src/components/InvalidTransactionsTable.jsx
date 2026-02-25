import { formatDate, formatCurrency } from '../utils/csvParser'

export default function InvalidTransactionsTable({ validateResult }) {
  const invalid = validateResult?.invalid

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <p className="section-title mb-0">Invalid Transactions</p>
        {invalid?.length > 0 && (
          <span className="inline-flex items-center rounded-full bg-red-50 px-2.5 py-1 text-xs font-medium text-red-600 border border-red-100">
            {invalid.length} {invalid.length === 1 ? 'issue' : 'issues'}
          </span>
        )}
      </div>

      {!invalid || invalid.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 text-center">
          {!invalid ? (
            <>
              <svg className="h-9 w-9 text-gray-200 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <p className="text-sm text-gray-400">No data yet. Process transactions first.</p>
            </>
          ) : (
            <>
              <svg className="h-9 w-9 text-green-200 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm text-gray-500 font-medium">All transactions are valid</p>
              <p className="text-xs text-gray-400 mt-1">No issues found in your uploaded data.</p>
            </>
          )}
        </div>
      ) : (
        <div className="overflow-x-auto -mx-6 px-6">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="pb-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wide">Date</th>
                <th className="pb-3 text-right text-xs font-semibold text-gray-400 uppercase tracking-wide">Amount</th>
                <th className="pb-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wide pl-6">Error</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {invalid.map((txn, i) => (
                <tr key={i} className="hover:bg-red-50/50 transition-colors">
                  <td className="py-3 text-gray-700 font-medium whitespace-nowrap">
                    {formatDate(txn.date)}
                    <span className="block text-xs text-gray-400 font-normal">
                      {txn.date?.split(' ')[1] ?? ''}
                    </span>
                  </td>
                  <td className="py-3 text-right text-gray-800 font-medium tabular-nums whitespace-nowrap">
                    {formatCurrency(txn.amount)}
                  </td>
                  <td className="py-3 pl-6">
                    <div className="flex items-start gap-2">
                      <svg className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      <span className="text-red-600 text-xs leading-relaxed">{txn.message}</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
