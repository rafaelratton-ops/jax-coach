import type { Heuristic, MatchFact, MatchSummary, MemoryPattern } from './types'

export interface AnalysisResult {
  matchId: string
  generatedAt: string
  model: string
  heuristics: Heuristic[]
  timeline: MatchFact[]
  summary: string
}

export function deriveHeuristics(match: MatchSummary, facts: MatchFact[], knownPatterns: MemoryPattern[]): AnalysisResult {
  const matchFacts = facts.filter((fact) => fact.matchId === match.id)
  const heuristics: Heuristic[] = []
  const earlyE = matchFacts.some((fact) => fact.payload.ability === 'E' && fact.kind === 'death')
  if (earlyE) {
    heuristics.push({ id: `derived-${match.id}-e`, title: 'Revisar timing do Counter Strike', category: 'trades', statement: 'A ativação do E apareceu antes do compromisso adversário neste lance.', evidence: matchFacts.filter((fact) => fact.payload.ability === 'E').map((fact) => `${fact.occurredAt} · ${fact.summary}`), confidence: 0.78, occurrences: 1, lastSeen: match.startedAt.slice(0, 10) })
  }
  const waveFact = matchFacts.find((fact) => fact.kind === 'lane-state' || fact.kind === 'wave')
  if (waveFact) {
    heuristics.push({ id: `derived-${match.id}-wave`, title: 'Estado de wave para revisar', category: 'wave', statement: waveFact.summary, evidence: [waveFact.occurredAt], confidence: waveFact.confidence, occurrences: 1, lastSeen: match.startedAt.slice(0, 10) })
  }
  const historyHint = knownPatterns.find((pattern) => pattern.opponent === match.opponent)
  const summary = historyHint ? `Este jogo conversa com o padrão “${historyHint.title}”: compare o lance com seu histórico pessoal.` : 'Primeira leitura gerada a partir dos fatos disponíveis; aumente a amostra para formar memória pessoal.'
  return { matchId: match.id, generatedAt: new Date().toISOString(), model: 'mock-coach-v1', heuristics, timeline: matchFacts, summary }
}
