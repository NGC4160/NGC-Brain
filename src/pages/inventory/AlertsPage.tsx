import { useEffect, useState } from 'react'
import { Bell, Mail, MessageSquare, Send } from 'lucide-react'
import { api, type AlertSetting, type AlertLog } from '@/lib/api'
import { formatDate } from '@/lib/utils'

export function AlertsPage() {
  const [settings, setSettings] = useState<AlertSetting[]>([])
  const [logs, setLogs] = useState<AlertLog[]>([])
  const [channel, setChannel] = useState<'EMAIL' | 'SMS'>('EMAIL')
  const [recipient, setRecipient] = useState('')
  const [triggering, setTriggering] = useState(false)

  const load = () => {
    api.alerts.settings().then(setSettings)
    api.alerts.logs().then(setLogs)
  }

  useEffect(() => { load() }, [])

  const add = async () => {
    if (!recipient) return
    await api.alerts.addSetting({ channel, recipient })
    setRecipient('')
    load()
  }

  const remove = async (id: string) => {
    await api.alerts.removeSetting(id)
    load()
  }

  const trigger = async () => {
    setTriggering(true)
    try {
      const result = await api.alerts.trigger()
      alert(`Alerts sent: ${result.sent} notifications for ${result.parts} low-stock parts`)
      load()
    } finally {
      setTriggering(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Low-Stock Alerts</h1>
        <p className="text-slate-500">Email & SMS notifications when parts hit reorder point</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="card space-y-4">
          <h2 className="flex items-center gap-2 font-semibold">
            <Bell className="h-5 w-5" /> Alert Recipients
          </h2>

          <div className="flex gap-2">
            <select value={channel} onChange={(e) => setChannel(e.target.value as 'EMAIL' | 'SMS')} className="input-field w-28">
              <option value="EMAIL">Email</option>
              <option value="SMS">SMS</option>
            </select>
            <input
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              placeholder={channel === 'EMAIL' ? 'email@shop.com' : '+17065550100'}
              className="input-field flex-1"
            />
            <button type="button" onClick={add} className="btn-primary">Add</button>
          </div>

          <ul className="space-y-2">
            {settings.map((s) => (
              <li key={s.id} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-sm dark:bg-slate-800">
                <div className="flex items-center gap-2">
                  {s.channel === 'EMAIL' ? <Mail className="h-4 w-4" /> : <MessageSquare className="h-4 w-4" />}
                  <span>{s.recipient}</span>
                </div>
                <button type="button" onClick={() => remove(s.id)} className="text-red-500 text-xs hover:underline">Remove</button>
              </li>
            ))}
          </ul>

          <button type="button" onClick={trigger} disabled={triggering} className="btn-secondary w-full">
            <Send className="h-4 w-4" /> Send Test Alert Now
          </button>
          <p className="text-xs text-slate-400">Alerts also run automatically every hour. Without SMTP/Twilio configured, alerts log to console.</p>
        </div>

        <div className="card">
          <h2 className="mb-4 font-semibold">Alert History</h2>
          <ul className="max-h-96 space-y-2 overflow-y-auto text-sm">
            {logs.length === 0 ? (
              <li className="text-slate-500">No alerts sent yet</li>
            ) : logs.map((log) => (
              <li key={log.id} className="border-b border-slate-100 pb-2 dark:border-slate-800">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{log.channel} → {log.recipient}</span>
                  <span className={log.sent ? 'text-emerald-600' : 'text-red-600'}>{log.sent ? 'Sent' : 'Failed'}</span>
                </div>
                <p className="text-xs text-slate-500">{formatDate(log.createdAt)}</p>
                {log.error && <p className="text-xs text-red-500">{log.error}</p>}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}
