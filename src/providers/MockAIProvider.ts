import { deriveHeuristics } from '../domain/analysis'
import type { AIProvider, AIAnalysisInput } from './AIProvider'
import { buildPreGameAdvice } from '../domain/advisor'

export class MockAIProvider implements AIProvider {
  readonly id = 'mock'
  readonly label = 'Mock local (fixtures)'

  async analyzePostGame(input: AIAnalysisInput) {
    await new Promise((resolve) => setTimeout(resolve, 250))
    return deriveHeuristics(input.match, input.facts, input.patterns)
  }
  async recommendPreGame(input: Parameters<typeof buildPreGameAdvice>[0]) {
    await new Promise((resolve) => setTimeout(resolve, 150))
    return buildPreGameAdvice(input)
  }
}
