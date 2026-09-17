import type { AIAnalysisInput, AIProvider } from './AIProvider'
import { deriveHeuristics } from '../domain/analysis'
import { buildPreGameAdvice } from '../domain/advisor'
export class LocalRulesProvider implements AIProvider {
  readonly id = 'local-rules.v2'
  readonly label = 'Regras de revisão locais · sem IA externa'
  async analyzePostGame(input: AIAnalysisInput) {
    return deriveHeuristics(input.match, input.facts, input.patterns)
  }
  async recommendPreGame(input: Parameters<typeof buildPreGameAdvice>[0]) { return buildPreGameAdvice(input) }
}
