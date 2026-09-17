import type { Heuristic, MatchFact, MatchSummary, MemoryPattern } from './types'

export interface AnalysisResult {
  matchId: string
  generatedAt: string
  model: string
  heuristics: Heuristic[]
  timeline: MatchFact[]
  summary: string
}

// These are review prompts, never claims about intent, cooldowns or wave state.
export function deriveHeuristics(match: MatchSummary, facts: MatchFact[], _patterns: MemoryPattern[] = []): AnalysisResult {
  const timeline = facts.filter(fact => fact.matchId === match.id && (match.source === 'fixture' || fact.source !== 'fixture'))
  const heuristics: Heuristic[] = []
  const add = (key: string, title: string, statement: string, category: Heuristic['category'], evidence: string[]) => {
    heuristics.push({ id: `${match.id}-${key}`, title, statement, category, evidence, confidence: 0.5, occurrences: 1, lastSeen: match.startedAt.slice(0, 10) })
  }
  const earlyDeaths = timeline.filter(fact => fact.kind === 'death' && Number(fact.payload.timestampMs) < 600000)
  if (earlyDeaths.length >= 2) add('early-deaths', 'Revisar as primeiras mortes', `${earlyDeaths.length} mortes antes dos 10 minutos. Veja o vídeo para avaliar wave, visão e recursos disponíveis; a Timeline não explica a causa.`, 'laning', earlyDeaths.map(f => f.id))
  const cs10 = timeline.find(f => f.payload.type === 'cs10')
  if (cs10 && Number(cs10.payload.cs) < 60) add('cs-review', 'Revisar farm no início', `${cs10.payload.cs} tropas aos 10 minutos. O corte de 60 é um critério de triagem desta versão, não uma nota de desempenho. Confira o contexto das waves no vídeo.`, 'wave', [cs10.id])
  if (timeline.some(f => f.kind === 'death') && !earlyDeaths.length) add('late-death', 'Rever uma morte após a lane', 'Abra o lance e anote o que você conseguiria perceber naquele momento.', 'tempo', timeline.filter(f => f.kind === 'death').slice(0, 1).map(f => f.id))
  return { matchId: match.id, generatedAt: new Date().toISOString(), model: 'regras-locais.v2', heuristics, timeline,
    summary: timeline.length ? `${timeline.length} eventos e medidas disponíveis. ${heuristics.length} ponto(s) para revisar. Timing de habilidades e intenção exigem vídeo ou anotação sua.` : 'Sem Timeline disponível para esta partida. Ainda não há evidência suficiente para uma revisão.' }
}
