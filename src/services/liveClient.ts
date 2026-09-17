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

export interface LiveSafeItem { id?: number; name?: string; count?: number }
export interface LiveSafeScores { kills?: number; deaths?: number; assists?: number; creepScore?: number; wardScore?: number }
export interface LiveSafePlayer { champion?: string; role?: string; team?: string; level?: number; items: LiveSafeItem[]; scores?: LiveSafeScores }
export interface LiveSafeSnapshot {
  capturedAt: string
  connected: boolean
  gameMode?: string
  gameTimeSeconds?: number
  own?: LiveSafePlayer
  laneOpponent?: LiveSafePlayer
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

/** Atualiza fatos resumidos do jogo enquanto o usuário mantém o acompanhamento ligado. */
export async function readLiveSafeSnapshot(): Promise<LiveSafeSnapshot> {
  if (!('__TAURI_INTERNALS__' in window)) {
    throw new Error('O acompanhamento local precisa ser executado no aplicativo desktop.')
  }
  return invoke<LiveSafeSnapshot>('live_safe_snapshot')
}
