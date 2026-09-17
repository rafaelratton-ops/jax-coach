export type FactSource = 'riot-api' | 'timeline' | 'outplayed' | 'manual' | 'fixture'

export interface MatchFact {
  id: string
  matchId: string
  occurredAt: string
  kind: 'death' | 'objective' | 'trade' | 'recall' | 'item' | 'wave' | 'lane-state'
  summary: string
  source: FactSource
  confidence: number
  payload: Record<string, unknown>
}

export interface Heuristic {
  id: string
  title: string
  category: 'laning' | 'trades' | 'wave' | 'tempo' | 'teamfight'
  statement: string
  evidence: string[]
  confidence: number
  occurrences: number
  lastSeen: string
}

export interface MemoryPattern extends Heuristic {
  champion: string
  opponent: string
  action: 'reminder' | 'review'
  safeModeCopy: string
}

export interface MatchSummary {
  participantId?: number
  opponentParticipantId?: number
  id: string
  startedAt: string
  durationSeconds: number
  queue: string
  champion: string
  role: string
  opponent: string
  result: 'win' | 'loss' | 'remake'
  kda: string
  cs: number
  source: FactSource
  analyzed: boolean
}

export interface RecordingCandidate {
  timeSource?: 'metadata' | 'estimated' | 'manual' | 'fixture'
  path: string
  startedAt: string
  durationSeconds: number
  sizeBytes: number
  confidence: number
  reason: string
}

export interface SafeModeSettings {
  enabled: boolean
  secondMonitor: boolean
  showOnlyHistoricalReminders: boolean
  hideLiveFacts: boolean
}

export interface AppSettings {
  riotGameName: string
  riotTagLine: string
  outplayedDirectory: string
  riotRegion: string
  riotApiConfigured: boolean
  aiConfigured: boolean
  theme: 'dark' | 'light'
  safeMode: SafeModeSettings
}

export type CoachTab = 'dashboard' | 'history' | 'my-jax' | 'performance' | 'patterns' | 'videos' | 'settings' | 'diagnostics'
