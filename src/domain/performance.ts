import type { Library } from './library'
import type { MatchFact, MatchSummary } from './types'

export type GoalId = 'deaths-before-10' | 'cs-at-10' | 'first-decision' | 'side-pressure'
export type CheckInResult = 'yes' | 'partial' | 'no'

export interface GoalDefinition {
  id: GoalId
  title: string
  description: string
  target: string
}

export interface TrainingCheckIn {
  result: CheckInResult
  happened: string
  decision: string
  nextStep: string
  savedAt: string
}

export interface TrainingBlock {
  goalId: GoalId
  startedAt: string
  targetGames: number
  checkIns: Record<string, TrainingCheckIn>
}

export interface JaxMetrics {
  games: number
  wins: number
  winRate: number | null
  analyzedGames: number
  csAt10: number | null
  csAt10Sample: number
  averageEarlyDeaths: number | null
  earlyDeathGames: number
  earlyDeathSample: number
  averageGoldDiffAt10: number | null
  goldDiffSample: number
}

export const goalDefinitions: GoalDefinition[] = [
  { id: 'deaths-before-10', title: 'Sobreviver aos primeiros 10 minutos', description: 'Reduzir mortes cedo e chegar ao primeiro recall com mais recursos.', target: 'No máximo 1 morte antes dos 10 minutos.' },
  { id: 'cs-at-10', title: 'Melhorar o farm da lane', description: 'Tratar as primeiras waves como um exercício de consistência.', target: 'Acompanhar e melhorar seu próprio CS aos 10 minutos.' },
  { id: 'first-decision', title: 'Rever a primeira decisão ruim', description: 'Encontrar o primeiro momento que mudou o rumo da lane.', target: 'Registrar uma decisão concreta para testar na próxima partida.' },
  { id: 'side-pressure', title: 'Converter vantagem em pressão lateral', description: 'Usar prioridade para criar tempo antes de objetivos.', target: 'Anotar uma conversão de wave, visão ou objetivo após ganhar espaço.' },
]

export function goalDefinition(id?: GoalId) {
  return goalDefinitions.find(goal => goal.id === id) ?? goalDefinitions[0]
}

function jaxTopMatches(library: Library): MatchSummary[] {
  return library.matches.filter(match => match.champion === 'Jax' && match.role === 'TOP' && match.result !== 'remake')
}

function factsFor(library: Library, match: MatchSummary): MatchFact[] {
  return library.analyses[match.id]?.timeline ?? library.facts.filter(fact => fact.matchId === match.id)
}

function numericFact(facts: MatchFact[], type: string, field: string) {
  const fact = facts.find(item => item.payload.type === type)
  const value = fact?.payload[field]
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined
}

export function jaxPerformance(library: Library): JaxMetrics {
  const matches = jaxTopMatches(library)
  const analyzed = matches.filter(match => factsFor(library, match).length > 0)
  const cs = analyzed.map(match => numericFact(factsFor(library, match), 'cs10', 'cs')).filter((value): value is number => value !== undefined)
  const gold = analyzed.map(match => numericFact(factsFor(library, match), 'cs10', 'goldDiff')).filter((value): value is number => value !== undefined)
  const earlyDeaths = analyzed.map(match => factsFor(library, match).filter(fact => fact.kind === 'death' && Number(fact.payload.timestampMs) < 600000).length)
  return {
    games: matches.length,
    wins: matches.filter(match => match.result === 'win').length,
    winRate: matches.length ? Math.round(100 * matches.filter(match => match.result === 'win').length / matches.length) : null,
    analyzedGames: analyzed.length,
    csAt10: cs.length ? Math.round(cs.reduce((sum, value) => sum + value, 0) / cs.length) : null,
    csAt10Sample: cs.length,
    averageEarlyDeaths: earlyDeaths.length ? Number((earlyDeaths.reduce((sum, value) => sum + value, 0) / earlyDeaths.length).toFixed(1)) : null,
    earlyDeathGames: earlyDeaths.filter(value => value > 0).length,
    earlyDeathSample: earlyDeaths.length,
    averageGoldDiffAt10: gold.length ? Math.round(gold.reduce((sum, value) => sum + value, 0) / gold.length) : null,
    goldDiffSample: gold.length,
  }
}

export function trainingBlockProgress(library: Library, block?: TrainingBlock) {
  if (!block) return { games: [], checkedIn: 0, targetGames: 10, complete: false }
  const start = Date.parse(block.startedAt)
  const games = jaxTopMatches(library)
    .filter(match => Number.isFinite(start) && Date.parse(match.startedAt) >= start)
    .sort((a, b) => Date.parse(a.startedAt) - Date.parse(b.startedAt))
    .slice(0, block.targetGames || 10)
  return {
    games,
    checkedIn: games.filter(match => Boolean(block.checkIns?.[match.id])).length,
    targetGames: block.targetGames || 10,
    complete: games.length >= (block.targetGames || 10),
  }
}

export function performanceBeforeBlock(library: Library, block?: TrainingBlock): JaxMetrics {
  if (!block) return jaxPerformance({ ...library, matches: [] })
  const start = Date.parse(block.startedAt)
  return jaxPerformance({ ...library, matches: library.matches.filter(match => Date.parse(match.startedAt) < start) })
}
