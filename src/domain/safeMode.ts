import type { AppSettings, MemoryPattern } from './types'

export function getSafeModeReminders(settings: AppSettings, patterns: MemoryPattern[], opponent?: string) {
  if (!settings.safeMode.enabled || !settings.safeMode.showOnlyHistoricalReminders) return []
  return patterns.filter((pattern) => !opponent || pattern.opponent === opponent || pattern.opponent === 'Any').map((pattern) => ({ id: pattern.id, title: pattern.title, copy: pattern.safeModeCopy, confidence: pattern.confidence }))
}
