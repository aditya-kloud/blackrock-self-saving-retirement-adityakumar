import { useState } from 'react'
import ApiStatus from './components/ApiStatus'
import InputPanel from './components/InputPanel'
import PeriodEditor, { toBackendDate } from './components/PeriodEditor'
import SummaryCards from './components/SummaryCards'
import ReturnsComparison from './components/ReturnsComparison'
import RemanentTrend from './components/RemanentTrend'
import KPeriodAggregation from './components/KPeriodAggregation'
import InvalidTransactionsTable from './components/InvalidTransactionsTable'
import LoadingSpinner from './components/LoadingSpinner'
import ErrorBanner from './components/ErrorBanner'
import { parseCSV, getDefaultKPeriod } from './utils/csvParser'
import {
  parseTransactions,
  validateTransactions,
  filterTransactions,
  npsReturns,
  indexReturns,
} from './services/api'

const INITIAL_FORM = { age: '', wage: '', inflation: '' }

const STEPS = [
  'Parsing transactions…',
  'Validating transactions…',
  'Filtering with period rules…',
  'Calculating NPS returns…',
  'Calculating Index returns…',
]

/* Convert UI period arrays (datetime-local strings) → backend format */
function buildQ(list) {
  return list
    .filter(p => p.start && p.end && p.fixed !== '')
    .map(p => ({
      fixed: parseFloat(p.fixed),
      start: toBackendDate(p.start),
      end:   toBackendDate(p.end),
    }))
}

function buildP(list) {
  return list
    .filter(p => p.start && p.end && p.extra !== '')
    .map(p => ({
      extra: parseFloat(p.extra),
      start: toBackendDate(p.start),
      end:   toBackendDate(p.end),
    }))
}

function buildK(list) {
  return list
    .filter(p => p.start && p.end)
    .map(p => ({
      start: toBackendDate(p.start),
      end:   toBackendDate(p.end),
    }))
}

export default function App() {
  const [formData, setFormData]   = useState(INITIAL_FORM)
  const [csvFile, setCsvFile]     = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [step, setStep]           = useState('')
  const [error, setError]         = useState(null)

  // Period rule state (stored as UI datetime-local strings)
  const [qPeriods, setQPeriods] = useState([
    { fixed: '0',  start: '2023-07-01T00:00', end: '2023-07-31T23:59' },
    { fixed: '10', start: '2024-06-01T00:00', end: '2024-06-30T23:59' },
    { fixed: '5',  start: '2025-01-01T00:00', end: '2025-01-15T23:59' },
  ])
  const [pPeriods, setPPeriods] = useState([
    { extra: '25', start: '2023-10-01T08:00', end: '2023-12-31T19:59' },
    { extra: '30', start: '2024-11-01T00:00', end: '2024-12-31T23:59' },
    { extra: '40', start: '2025-12-01T00:00', end: '2025-12-31T23:59' },
  ])
  const [kPeriods, setKPeriods] = useState([
    { start: '2023-01-01T00:00', end: '2023-12-31T23:59' },
    { start: '2024-01-01T00:00', end: '2024-12-31T23:59' },
    { start: '2025-01-01T00:00', end: '2025-12-31T23:59' },
    { start: '2023-01-01T00:00', end: '2025-12-31T23:59' },
  ])

  // API results
  const [parseResult,    setParseResult]    = useState(null)
  const [validateResult, setValidateResult] = useState(null)
  const [filterResult,   setFilterResult]   = useState(null)
  const [npsResult,      setNpsResult]      = useState(null)
  const [indexResult,    setIndexResult]    = useState(null)

  const hasResults = parseResult !== null

  async function handleProcess() {
    setError(null)
    setIsLoading(true)

    try {
      const text     = await csvFile.text()
      const expenses = parseCSV(text)

      const age       = parseInt(formData.age, 10)
      const wage      = parseFloat(formData.wage)
      const inflation = parseFloat(formData.inflation)

      // Convert UI periods to backend format
      const q = buildQ(qPeriods)
      const p = buildP(pPeriods)
      // If user defined K periods use those; otherwise auto-span the full CSV date range
      const kBuilt = buildK(kPeriods)
      const k = kBuilt.length > 0 ? kBuilt : getDefaultKPeriod(expenses)

      // Step 1: Parse
      setStep(STEPS[0])
      const parsed = await parseTransactions(expenses)
      setParseResult(parsed)

      // Step 2: Validate
      setStep(STEPS[1])
      const validated = await validateTransactions(wage, parsed)
      setValidateResult(validated)

      // Step 3: Filter
      setStep(STEPS[2])
      const filtered = await filterTransactions(wage, expenses, q, p, k)
      setFilterResult(filtered)

      // Step 4: NPS returns
      setStep(STEPS[3])
      const nps = await npsReturns(age, wage, inflation, expenses, q, p, k)
      setNpsResult(nps)

      // Step 5: Index returns
      setStep(STEPS[4])
      const idx = await indexReturns(age, wage, inflation, expenses, q, p, k)
      setIndexResult(idx)

    } catch (err) {
      setError(err)
    } finally {
      setIsLoading(false)
      setStep('')
    }
  }

  function handleReset() {
    setFormData(INITIAL_FORM)
    setCsvFile(null)
    setError(null)
    setQPeriods([
      { fixed: '0',  start: '2023-07-01T00:00', end: '2023-07-31T23:59' },
      { fixed: '10', start: '2024-06-01T00:00', end: '2024-06-30T23:59' },
      { fixed: '5',  start: '2025-01-01T00:00', end: '2025-01-15T23:59' },
    ])
    setPPeriods([
      { extra: '25', start: '2023-10-01T08:00', end: '2023-12-31T19:59' },
      { extra: '30', start: '2024-11-01T00:00', end: '2024-12-31T23:59' },
      { extra: '40', start: '2025-12-01T00:00', end: '2025-12-31T23:59' },
    ])
    setKPeriods([
      { start: '2023-01-01T00:00', end: '2023-12-31T23:59' },
      { start: '2024-01-01T00:00', end: '2024-12-31T23:59' },
      { start: '2025-01-01T00:00', end: '2025-12-31T23:59' },
      { start: '2023-01-01T00:00', end: '2025-12-31T23:59' },
    ])
    setParseResult(null)
    setValidateResult(null)
    setFilterResult(null)
    setNpsResult(null)
    setIndexResult(null)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-gray-100 bg-white/90 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-14 items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600">
                <svg className="h-4 w-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <div>
                <h1 className="text-sm font-bold text-gray-900 leading-none">BlackRock Auto-Saving</h1>
                <p className="text-xs text-gray-400 leading-none mt-0.5">Retirement Dashboard</p>
              </div>
            </div>
            <ApiStatus />
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-6">

        {/* Section 1: Input Panel */}
        <InputPanel
          formData={formData}
          onChange={setFormData}
          onFileChange={setCsvFile}
          fileName={csvFile?.name || null}
          onProcess={handleProcess}
          onReset={handleReset}
          isLoading={isLoading}
        />

        {/* Section 1b: Period Rules (collapsible) */}
        <PeriodEditor
          qPeriods={qPeriods}
          pPeriods={pPeriods}
          kPeriods={kPeriods}
          onChangeQ={setQPeriods}
          onChangeP={setPPeriods}
          onChangeK={setKPeriods}
        />

        {/* Error */}
        {error && (
          <ErrorBanner error={error} onDismiss={() => setError(null)} />
        )}

        {/* Loading */}
        {isLoading && <LoadingSpinner message={step || 'Processing...'} />}

        {/* Results */}
        {!isLoading && hasResults && (
          <>
            <SummaryCards
              npsResult={npsResult}
              validateResult={validateResult}
              filterResult={filterResult}
            />

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              <ReturnsComparison npsResult={npsResult} indexResult={indexResult} />
              <KPeriodAggregation npsResult={npsResult} />
            </div>

            <RemanentTrend parseResult={parseResult} filterResult={filterResult} />

            <InvalidTransactionsTable validateResult={validateResult} />
          </>
        )}

        {/* Empty state */}
        {!isLoading && !hasResults && !error && (
          <div className="card flex flex-col items-center justify-center py-20 text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50">
              <svg className="h-7 w-7 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h2 className="text-base font-semibold text-gray-800">Ready to analyse</h2>
            <p className="mt-1 max-w-sm text-sm text-gray-400 leading-relaxed">
              Fill in your financial details above, upload a CSV of transactions, and press{' '}
              <strong className="text-gray-600">Process Data</strong> to see your retirement savings analysis.
            </p>
          </div>
        )}
      </main>

      <footer className="border-t border-gray-100 mt-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4">
          <p className="text-xs text-gray-400 text-center">
            BlackRock Auto-Saving Challenge · API at{' '}
            <code className="font-mono text-gray-500">localhost:5477</code>
          </p>
        </div>
      </footer>
    </div>
  )
}
