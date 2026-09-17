import type { AppSettings, Heuristic, MatchFact, MatchSummary, MemoryPattern, RecordingCandidate } from './types'

export const fixtureMatches: MatchSummary[] = [
  {
    id: 'BR1_987654321', startedAt: '2026-09-15T23:18:00Z', durationSeconds: 1842, queue: 'Ranked Solo', champion: 'Jax', role: 'TOP', opponent: 'Camille', result: 'win', kda: '8 / 3 / 6', cs: 214, source: 'fixture', analyzed: true
  },
  {
    id: 'BR1_987600142', startedAt: '2026-09-14T21:04:00Z', durationSeconds: 1610, queue: 'Ranked Solo', champion: 'Jax', role: 'TOP', opponent: 'Aatrox', result: 'loss', kda: '2 / 7 / 4', cs: 167, source: 'fixture', analyzed: true
  },
  {
    id: 'BR1_987544200', startedAt: '2026-09-13T00:42:00Z', durationSeconds: 2054, queue: 'Ranked Solo', champion: 'Jax', role: 'TOP', opponent: 'Gnar', result: 'win', kda: '6 / 2 / 8', cs: 238, source: 'fixture', analyzed: false
  }
]

export const fixtureFacts: MatchFact[] = [
  { id: 'fact-001', matchId: 'BR1_987654321', occurredAt: '00:06:42', kind: 'trade', summary: 'Counter Strike absorveu o primeiro stun da Camille antes do engage.', source: 'timeline', confidence: 0.92, payload: { ability: 'E', outcome: 'positive' } },
  { id: 'fact-002', matchId: 'BR1_987654321', occurredAt: '00:08:17', kind: 'wave', summary: 'A terceira wave foi resetada antes do recall.', source: 'timeline', confidence: 0.81, payload: { wave: 3 } },
  { id: 'fact-003', matchId: 'BR1_987600142', occurredAt: '00:04:51', kind: 'death', summary: 'Morte em troca longa sem o segundo W disponível.', source: 'timeline', confidence: 0.88, payload: { cooldown: 'W' } },
  { id: 'fact-004', matchId: 'BR1_987600142', occurredAt: '00:10:13', kind: 'lane-state', summary: 'Aatrox encontrou a wave congelada no lado dele.', source: 'timeline', confidence: 0.73, payload: { state: 'freeze' } }
]

export const fixturePatterns: MemoryPattern[] = [
  {
    id: 'pattern-jax-e-early', title: 'E cedo demais no engage', category: 'trades', champion: 'Jax', opponent: 'Camille', action: 'reminder', occurrences: 4, confidence: 0.82, lastSeen: '2026-09-15', evidence: ['4 de 7 mortes/trocas revisadas', 'E usado antes do E2 da Camille'], statement: 'Você tende a ativar Counter Strike antes de Camille comprometer a entrada.', safeModeCopy: 'Lembrete histórico: espere o compromisso da Camille antes de gastar Counter Strike.',
  },
  {
    id: 'pattern-jax-wave-3', title: 'Recall após a terceira wave', category: 'wave', champion: 'Jax', opponent: 'Aatrox', action: 'review', occurrences: 5, confidence: 0.76, lastSeen: '2026-09-14', evidence: ['5 de 8 jogos com compra de Sheen', 'reset preservou 2 waves'], statement: 'Seu melhor reset de lane acontece quando a terceira wave bate na torre.', safeModeCopy: 'Contexto histórico: seus resets mais consistentes vieram após a terceira wave.',
  },
  {
    id: 'pattern-jax-side', title: 'Tempo lateral antes do Arauto', category: 'tempo', champion: 'Jax', opponent: 'Gnar', action: 'reminder', occurrences: 3, confidence: 0.68, lastSeen: '2026-09-12', evidence: ['3 rotações registradas', 'pressão lateral gerou prioridade'], statement: 'Você converte vantagem melhor quando cria pressão lateral antes do Arauto.', safeModeCopy: 'Lembrete histórico: reveja seu padrão de pressão lateral pré-Arauto.',
  }
]

export const fixtureRecordings: RecordingCandidate[] = [
  { path: 'C:/Users/Player/Videos/Outplayed/2026-09-15_20-18-00_Jax.mp4', startedAt: '2026-09-15T23:17:52Z', durationSeconds: 1846, sizeBytes: 734003200, confidence: 0.96, reason: 'início ±8s e duração ±4s do match BR1_987654321' },
  { path: 'C:/Users/Player/Videos/Outplayed/2026-09-14_18-04-00_Jax.mp4', startedAt: '2026-09-14T21:03:48Z', durationSeconds: 1614, sizeBytes: 501219328, confidence: 0.92, reason: 'início ±12s e duração ±4s do match BR1_987600142' }
]

export const defaultSettings: AppSettings = {
  riotGameName: 'Pula Nuvem', riotTagLine: 'Hope',
  outplayedDirectory: '', riotRegion: 'br1', riotApiConfigured: false, aiConfigured: false, theme: 'dark',
  safeMode: { enabled: true, secondMonitor: false, showOnlyHistoricalReminders: true, hideLiveFacts: true }
}
