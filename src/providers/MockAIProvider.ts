import { deriveHeuristics } from '../domain/analysis'
import type { AIProvider, AIAnalysisInput } from './AIProvider'

export class MockAIProvider implements AIProvider {
  readonly id = 'mock'
  readonly label = 'Mock local (fixtures)'

  async analyzePostGame(input: AIAnalysisInput) {
    await new Promise((resolve) => setTimeout(resolve, 250))
    return deriveHeuristics(input.match, input.facts, input.patterns)
  }
}
