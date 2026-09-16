import { defaultSettings, fixtureFacts, fixtureMatches, fixturePatterns, fixtureRecordings } from '../domain/fixtures'
import type { AppSettings, MatchFact, MatchSummary, MemoryPattern, RecordingCandidate } from '../domain/types'

const KEYS = { settings: 'jax-coach.settings', matches: 'jax-coach.matches', patterns: 'jax-coach.patterns', facts: 'jax-coach.facts', recordings: 'jax-coach.recordings' } as const

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) as T : fallback
  } catch {
    return fallback
  }
}

function write<T>(key: string, value: T) {
  localStorage.setItem(key, JSON.stringify(value))
}

export const storage = {
  settings: () => read<AppSettings>(KEYS.settings, defaultSettings),
  saveSettings: (value: AppSettings) => write(KEYS.settings, value),
  matches: () => read<MatchSummary[]>(KEYS.matches, fixtureMatches),
  facts: () => read<MatchFact[]>(KEYS.facts, fixtureFacts),
  patterns: () => read<MemoryPattern[]>(KEYS.patterns, fixturePatterns),
  recordings: () => read<RecordingCandidate[]>(KEYS.recordings, fixtureRecordings),
  saveMatches: (value: MatchSummary[]) => write(KEYS.matches, value),
  resetFixtures: () => Object.values(KEYS).forEach((key) => localStorage.removeItem(key))
}
