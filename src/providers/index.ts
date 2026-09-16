import type { AIProvider } from './AIProvider'
import { MockAIProvider } from './MockAIProvider'

const mock = new MockAIProvider()

export function getAIProvider(): AIProvider {
  // External providers can be registered here without coupling the UI to a vendor SDK.
  return mock
}
