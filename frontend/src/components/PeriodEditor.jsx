import { useState } from 'react'

/* ─── helpers ─────────────────────────────────────────────────────────── */

// Convert HTML datetime-local ("2023-10-12T20:15") → backend format ("2023-10-12 20:15:00")
export function toBackendDate(dtLocal) {
  if (!dtLocal) return ''
  return dtLocal.replace('T', ' ') + ':00'
}

const TABS = ['Q Periods', 'P Periods', 'K Periods']

const DESCRIPTIONS = {
  'Q Periods': 'Override remanent with a fixed amount for all transactions in this date range.',
  'P Periods': 'Add an extra bonus amount on top of every remanent within this date range.',
  'K Periods': 'Evaluation windows used to group and calculate returns. If none set, the full date range is used automatically.',
}

/* ─── empty row factories ─────────────────────────────────────────────── */
const emptyQ = () => ({ fixed: '', start: '', end: '' })
const emptyP = () => ({ extra: '', start: '', end: '' })
const emptyK = () => ({ start: '', end: '' })

/* ─── shared field ────────────────────────────────────────────────────── */
function Field({ label, children }) {
  return (
    <div className="flex flex-col gap-1 min-w-0">
      <span className="text-xs font-medium text-gray-500">{label}</span>
      {children}
    </div>
  )
}

function DateInput({ value, onChange, placeholder }) {
  return (
    <input
      type="datetime-local"
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      className="input text-xs py-1.5"
    />
  )
}

function AmountInput({ value, onChange, placeholder }) {
  return (
    <input
      type="number"
      min="0"
      step="0.01"
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      className="input text-xs py-1.5"
    />
  )
}

function RemoveBtn({ onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex-shrink-0 self-end mb-0.5 p-1.5 rounded-md text-gray-400
                 hover:text-red-500 hover:bg-red-50 transition-colors"
      title="Remove"
    >
      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
      </svg>
    </button>
  )
}

/* ─── per-type row renderers ──────────────────────────────────────────── */

function QRow({ item, index, onChange, onRemove }) {
  const upd = (field, val) => onChange(index, { ...item, [field]: val })
  return (
    <div className="grid grid-cols-[1fr_1fr_1fr_auto] gap-3 items-end p-3 rounded-lg bg-gray-50 border border-gray-100">
      <Field label="Fixed Remanent (₹)">
        <AmountInput value={item.fixed} onChange={v => upd('fixed', v)} placeholder="e.g. 500" />
      </Field>
      <Field label="Start Date &amp; Time">
        <DateInput value={item.start} onChange={v => upd('start', v)} />
      </Field>
      <Field label="End Date &amp; Time">
        <DateInput value={item.end} onChange={v => upd('end', v)} />
      </Field>
      <RemoveBtn onClick={() => onRemove(index)} />
    </div>
  )
}

function PRow({ item, index, onChange, onRemove }) {
  const upd = (field, val) => onChange(index, { ...item, [field]: val })
  return (
    <div className="grid grid-cols-[1fr_1fr_1fr_auto] gap-3 items-end p-3 rounded-lg bg-gray-50 border border-gray-100">
      <Field label="Extra Amount (₹)">
        <AmountInput value={item.extra} onChange={v => upd('extra', v)} placeholder="e.g. 200" />
      </Field>
      <Field label="Start Date &amp; Time">
        <DateInput value={item.start} onChange={v => upd('start', v)} />
      </Field>
      <Field label="End Date &amp; Time">
        <DateInput value={item.end} onChange={v => upd('end', v)} />
      </Field>
      <RemoveBtn onClick={() => onRemove(index)} />
    </div>
  )
}

function KRow({ item, index, onChange, onRemove }) {
  const upd = (field, val) => onChange(index, { ...item, [field]: val })
  return (
    <div className="grid grid-cols-[1fr_1fr_auto] gap-3 items-end p-3 rounded-lg bg-gray-50 border border-gray-100">
      <Field label="Start Date &amp; Time">
        <DateInput value={item.start} onChange={v => upd('start', v)} />
      </Field>
      <Field label="End Date &amp; Time">
        <DateInput value={item.end} onChange={v => upd('end', v)} />
      </Field>
      <RemoveBtn onClick={() => onRemove(index)} />
    </div>
  )
}

/* ─── main component ──────────────────────────────────────────────────── */

export default function PeriodEditor({
  qPeriods, pPeriods, kPeriods,
  onChangeQ, onChangeP, onChangeK,
}) {
  const [open, setOpen]       = useState(false)
  const [activeTab, setActive] = useState('Q Periods')

  /* generic list helpers */
  function makeHandlers(list, setList) {
    return {
      add:    (empty) => setList([...list, empty]),
      remove: (i)     => setList(list.filter((_, idx) => idx !== i)),
      update: (i, val) => {
        const next = [...list]; next[i] = val; setList(next)
      },
    }
  }

  const q = makeHandlers(qPeriods, onChangeQ)
  const p = makeHandlers(pPeriods, onChangeP)
  const k = makeHandlers(kPeriods, onChangeK)

  const totalCount = qPeriods.length + pPeriods.length + kPeriods.length

  return (
    <div className="card">
      {/* Toggle header */}
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between group"
      >
        <div className="flex items-center gap-2">
          <h2 className="text-base font-semibold text-gray-900">Period Rules</h2>
          {totalCount > 0 && (
            <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-600 border border-blue-100">
              {totalCount} rule{totalCount !== 1 ? 's' : ''}
            </span>
          )}
          <span className="text-xs text-gray-400">Q · P · K overrides</span>
        </div>
        <svg
          className={`h-4 w-4 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`}
          fill="none" stroke="currentColor" viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="mt-5">
          {/* Tab bar */}
          <div className="flex gap-1 rounded-lg bg-gray-100 p-1 mb-4">
            {TABS.map(tab => (
              <button
                key={tab}
                type="button"
                onClick={() => setActive(tab)}
                className={`flex-1 rounded-md px-3 py-1.5 text-xs font-semibold transition-colors
                  ${activeTab === tab
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'}`}
              >
                {tab}
                {tab === 'Q Periods' && qPeriods.length > 0 && (
                  <span className="ml-1.5 inline-flex h-4 w-4 items-center justify-center rounded-full bg-blue-100 text-blue-600 text-[10px]">
                    {qPeriods.length}
                  </span>
                )}
                {tab === 'P Periods' && pPeriods.length > 0 && (
                  <span className="ml-1.5 inline-flex h-4 w-4 items-center justify-center rounded-full bg-purple-100 text-purple-600 text-[10px]">
                    {pPeriods.length}
                  </span>
                )}
                {tab === 'K Periods' && kPeriods.length > 0 && (
                  <span className="ml-1.5 inline-flex h-4 w-4 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 text-[10px]">
                    {kPeriods.length}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Description */}
          <p className="text-xs text-gray-400 mb-4">{DESCRIPTIONS[activeTab]}</p>

          {/* Q tab */}
          {activeTab === 'Q Periods' && (
            <div className="space-y-2">
              {qPeriods.map((item, i) => (
                <QRow key={i} item={item} index={i} onChange={q.update} onRemove={q.remove} />
              ))}
              <button
                type="button"
                onClick={() => q.add(emptyQ())}
                className="btn-secondary w-full justify-center text-xs py-2"
              >
                <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Q Period
              </button>
            </div>
          )}

          {/* P tab */}
          {activeTab === 'P Periods' && (
            <div className="space-y-2">
              {pPeriods.map((item, i) => (
                <PRow key={i} item={item} index={i} onChange={p.update} onRemove={p.remove} />
              ))}
              <button
                type="button"
                onClick={() => p.add(emptyP())}
                className="btn-secondary w-full justify-center text-xs py-2"
              >
                <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add P Period
              </button>
            </div>
          )}

          {/* K tab */}
          {activeTab === 'K Periods' && (
            <div className="space-y-2">
              {kPeriods.map((item, i) => (
                <KRow key={i} item={item} index={i} onChange={k.update} onRemove={k.remove} />
              ))}
              <button
                type="button"
                onClick={() => k.add(emptyK())}
                className="btn-secondary w-full justify-center text-xs py-2"
              >
                <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add K Period
              </button>
              {kPeriods.length === 0 && (
                <p className="text-center text-xs text-gray-400 pt-1">
                  No K periods → full date range used automatically.
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
