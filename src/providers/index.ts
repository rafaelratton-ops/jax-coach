import type { AIProvider } from './AIProvider'
import { LocalRulesProvider } from './LocalRulesProvider'

const local = new LocalRulesProvider()

export function getAIProvider(): AIProvider {
  // External providers can be registered here without coupling the UI to a vendor SDK.
  return local
}
