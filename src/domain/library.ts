import type { AnalysisResult } from './analysis'
import type { MatchFact, MatchSummary, RecordingCandidate } from './types'
import type { TrainingBlock } from './performance'

export interface Library {
  version: 2
  owner?: string
  matches: MatchSummary[]
  facts: MatchFact[]
  analyses: Record<string, AnalysisResult>
  notes: Record<string, string>
  recordings: RecordingCandidate[]
  syncedAt?: string
  goal: string
  activeBlock?: TrainingBlock
}

export function emptyLibrary(): Library {
  return { version: 2, matches: [], facts: [], analyses: {}, notes: {}, recordings: [], goal: 'Revisar minhas primeiras mortes depois de cada partida.' }
}

export function mergeMatches(previous: MatchSummary[], incoming: MatchSummary[]) {
  const map = new Map(previous.map(match => [match.id, match]))
  for (const match of incoming) map.set(match.id, { ...match, analyzed: map.get(match.id)?.analyzed ?? false })
  return [...map.values()].sort((a, b) => Date.parse(b.startedAt) - Date.parse(a.startedAt))
}

export function stats(matches: MatchSummary[]) {
  const played = matches.filter(m => m.result !== 'remake')
  const minutes = played.reduce((n, m) => n + m.durationSeconds / 60, 0)
  const totals = played.reduce((n, m) => {
    const [k, d, a] = m.kda.split('/').map(Number)
    return { k: n.k + (k || 0), d: n.d + (d || 0), a: n.a + (a || 0), cs: n.cs + m.cs }
  }, { k: 0, d: 0, a: 0, cs: 0 })
  return { count: played.length, wins: played.filter(m => m.result === 'win').length,
    winRate: played.length ? Math.round(100 * played.filter(m => m.result === 'win').length / played.length) : null,
    csPerMin: minutes > 0 ? totals.cs / minutes : null,
    kda: played.length ? (totals.k + totals.a) / Math.max(totals.d, 1) : null }
}

export function historicalPatterns(library: Library) {
  const eligible = library.matches.filter(m => m.champion === 'Jax' && m.role === 'TOP' && m.result !== 'remake' && library.analyses[m.id]?.timeline.length)
  if (eligible.length < 3) return []
  const categories = [
    { key: 'early-deaths', title: 'Mortes no começo da lane', copy: 'No próximo review, observar o contexto das mortes antes dos 10 minutos.' },
    { key: 'cs-review', title: 'Farm aos 10 minutos', copy: 'No próximo review, acompanhar as waves perdidas antes dos 10 minutos.' },
  ]
  return categories.flatMap(category => {
    const evidence = eligible.filter(m => library.analyses[m.id].heuristics.some(h => h.id.endsWith(category.key)))
    return evidence.length >= 2 ? [{ ...category, matches: evidence, total: eligible.length }] : []
  })
}
