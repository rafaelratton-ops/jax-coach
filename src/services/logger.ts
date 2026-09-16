export type LogLevel = 'info' | 'warn' | 'error'

export interface LogEntry { at: string; level: LogLevel; event: string; detail?: string }

const LOG_KEY = 'jax-coach.logs'

export function log(level: LogLevel, event: string, detail?: string) {
  const entry: LogEntry = { at: new Date().toISOString(), level, event, detail }
  try {
    const existing = JSON.parse(localStorage.getItem(LOG_KEY) ?? '[]') as LogEntry[]
    localStorage.setItem(LOG_KEY, JSON.stringify([...existing.slice(-199), entry]))
  } catch { /* storage may be unavailable in a restricted webview */ }
  if (import.meta.env.DEV) console[level === 'error' ? 'error' : level](event, detail ?? '')
}

export function readLogs(): LogEntry[] {
  try { return JSON.parse(localStorage.getItem(LOG_KEY) ?? '[]') as LogEntry[] } catch { return [] }
}
