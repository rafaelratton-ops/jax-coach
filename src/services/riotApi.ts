import type { MatchSummary } from '../domain/types'

export interface RiotAccount { puuid: string; gameName: string; tagLine: string }
export interface RiotSyncResult { account: RiotAccount; matches: MatchSummary[]; syncedAt: string }

/**
 * The browser never receives a Riot key in production. Tauri calls this service
 * through the local command bridge; the key is passed only for the duration of
 * the request and is not persisted.
 */
export async function syncRiotMatches(gameName: string, tagLine: string, apiKey: string, count = 5): Promise<RiotSyncResult> {
  if (!('__TAURI_INTERNALS__' in window)) {
    throw new Error('A sincronização Riot precisa ser executada no aplicativo desktop Tauri.')
  }
  const { invoke } = await import('@tauri-apps/api/core')
  return invoke<RiotSyncResult>('riot_sync_matches', { gameName, tagLine, apiKey, count })
}
