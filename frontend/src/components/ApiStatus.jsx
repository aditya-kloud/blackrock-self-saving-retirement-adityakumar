import { useEffect, useState } from 'react'
import { checkHealth } from '../services/api'

export default function ApiStatus() {
  const [status, setStatus] = useState('checking') // 'checking' | 'online' | 'offline'
  const [info, setInfo] = useState(null)

  useEffect(() => {
    async function ping() {
      try {
        const data = await checkHealth()
        setInfo(data)
        setStatus('online')
      } catch {
        setStatus('offline')
      }
    }
    ping()
  }, [])

  const dotColor =
    status === 'online' ? 'bg-green-500' :
    status === 'offline' ? 'bg-red-500' :
    'bg-yellow-400'

  const label =
    status === 'online' ? 'API Online' :
    status === 'offline' ? 'API Offline' :
    'Checking...'

  return (
    <div className="flex items-center gap-2 text-sm">
      <span className={`inline-block h-2 w-2 rounded-full ${dotColor} ${status === 'checking' ? 'animate-pulse' : ''}`} />
      <span className="text-gray-600 font-medium">{label}</span>
      {status === 'online' && info && (
        <span className="text-gray-400 text-xs hidden sm:inline">
          · {info.memory} · {info.threads} threads
        </span>
      )}
    </div>
  )
}
