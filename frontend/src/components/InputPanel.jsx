import { useRef } from 'react'

export default function InputPanel({ formData, onChange, onFileChange, fileName, onProcess, onReset, isLoading }) {
  const fileRef = useRef(null)

  function handleField(e) {
    onChange({ ...formData, [e.target.name]: e.target.value })
  }

  function handleFile(e) {
    const file = e.target.files?.[0] || null
    onFileChange(file)
  }

  function handleReset() {
    if (fileRef.current) fileRef.current.value = ''
    onReset()
  }

  const isValid =
    formData.age && formData.wage && formData.inflation && fileName

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-base font-semibold text-gray-900">Inputs</h2>
        <button onClick={handleReset} className="btn-secondary text-xs px-3 py-1.5">
          Reset
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Age */}
        <div>
          <label className="label">Age</label>
          <input
            type="number"
            name="age"
            min="18"
            max="100"
            placeholder="e.g. 30"
            value={formData.age}
            onChange={handleField}
            className="input"
          />
        </div>

        {/* Annual Wage */}
        <div>
          <label className="label">Annual Wage (₹)</label>
          <input
            type="number"
            name="wage"
            min="0"
            placeholder="e.g. 1200000"
            value={formData.wage}
            onChange={handleField}
            className="input"
          />
        </div>

        {/* Inflation Rate */}
        <div>
          <label className="label">Inflation Rate (%)</label>
          <input
            type="number"
            name="inflation"
            min="0"
            max="100"
            step="0.1"
            placeholder="e.g. 6.5"
            value={formData.inflation}
            onChange={handleField}
            className="input"
          />
        </div>

        {/* CSV Upload */}
        <div>
          <label className="label">Transactions CSV</label>
          <label className="flex items-center gap-2 cursor-pointer">
            <div className="input flex items-center gap-2 cursor-pointer hover:bg-gray-50 transition-colors">
              <svg className="h-4 w-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              <span className={`text-sm truncate ${fileName ? 'text-gray-900' : 'text-gray-400'}`}>
                {fileName || 'Choose CSV file'}
              </span>
            </div>
            <input
              ref={fileRef}
              type="file"
              accept=".csv,text/csv"
              onChange={handleFile}
              className="sr-only"
            />
          </label>
        </div>
      </div>

      <div className="mt-5 flex items-center gap-3">
        <button
          onClick={onProcess}
          disabled={!isValid || isLoading}
          className="btn-primary"
        >
          {isLoading ? (
            <>
              <span className="h-4 w-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Process Data
            </>
          )}
        </button>

        {!isValid && !isLoading && (
          <p className="text-xs text-gray-400">
            {!fileName ? 'Upload a CSV file to continue' : 'Fill all fields to continue'}
          </p>
        )}
      </div>

      {/* CSV format hint */}
      <div className="mt-4 rounded-lg bg-gray-50 border border-gray-100 px-3 py-2">
        <p className="text-xs text-gray-500 font-medium mb-1">Expected CSV format:</p>
        <code className="text-xs text-gray-600 font-mono">
          date,amount<br />
          2023-10-12 20:15:30,250<br />
          2023-02-28 15:49:20,375
        </code>
      </div>
    </div>
  )
}
