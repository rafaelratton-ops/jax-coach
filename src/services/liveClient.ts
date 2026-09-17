import { invoke } from '@tauri-apps/api/core'

export interface LiveMatchContext {
  capturedAt: string
  connected: boolean
  gameMode?: string
  champion?: string
  role?: string
  opponentChampion?: string
  warnings: string[]
}

export interface LiveDiagnostics {
  capturedAt: string
  connected: boolean
  endpoints: Record<string, unknown>
  warnings: string[]
}

/** Faz uma única leitura local do contexto básico; não inicia monitoramento. */
export async function readLiveMatchContext(): Promise<LiveMatchContext> {
  if (!('__TAURI_INTERNALS__' in window)) {
    throw new Error('A leitura da partida precisa ser executada no aplicativo desktop.')
  }
  return invoke<LiveMatchContext>('live_match_context')
}

/** Consulta manual para diagnóstico. Nunca é enviada para o painel de foco ou para a IA. */
export async function readLiveDiagnostics(): Promise<LiveDiagnostics> {
  if (!('__TAURI_INTERNALS__' in window)) {
    throw new Error('A leitura local precisa ser executada no aplicativo desktop.')
  }
  return invoke<LiveDiagnostics>('live_diagnostics')
}
