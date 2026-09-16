import type { MatchFact, MatchSummary, MemoryPattern } from '../domain/types'
import type { AnalysisResult } from '../domain/analysis'

export interface AIAnalysisInput {
  match: MatchSummary
  facts: MatchFact[]
  patterns: MemoryPattern[]
}

export interface AIProvider {
  readonly id: string
  readonly label: string
  analyzePostGame(input: AIAnalysisInput): Promise<AnalysisResult>
}
