/**
 * Parses a CSV string into an array of expense objects.
 * Expected format:
 *   date,amount
 *   2023-10-12 20:15:30,250
 */
export function parseCSV(text) {
  const lines = text.trim().split('\n').filter(Boolean)
  if (lines.length < 2) throw new Error('CSV must have a header row and at least one data row.')

  const header = lines[0].split(',').map(h => h.trim().toLowerCase())
  const dateIdx = header.indexOf('date')
  const amountIdx = header.indexOf('amount')

  if (dateIdx === -1 || amountIdx === -1) {
    throw new Error('CSV must contain "date" and "amount" columns.')
  }

  const expenses = []
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(',')
    const date = cols[dateIdx]?.trim()
    const amount = parseFloat(cols[amountIdx]?.trim())

    if (!date || isNaN(amount)) continue
    expenses.push({ date, amount })
  }

  if (expenses.length === 0) {
    throw new Error('No valid rows found in CSV.')
  }

  return expenses
}

/**
 * Returns a default k-period spanning the full date range of expenses.
 * This ensures returns and filter endpoints return meaningful data.
 */
export function getDefaultKPeriod(expenses) {
  if (!expenses || expenses.length === 0) return []
  const sorted = [...expenses].sort((a, b) => a.date.localeCompare(b.date))
  return [{ start: sorted[0].date, end: sorted[sorted.length - 1].date }]
}

/** Format a date string for display (strip time portion). */
export function formatDate(dateStr) {
  if (!dateStr) return ''
  return dateStr.split(' ')[0]
}

/** Format a number as Indian Rupees. */
export function formatCurrency(val) {
  if (val === null || val === undefined || isNaN(val)) return '—'
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(val)
}
