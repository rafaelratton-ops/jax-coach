import type { MatchSummary } from '../domain/types'
import { invoke } from '@tauri-apps/api/core'

export interface RiotAccount { puuid: string; gameName: string; tagLine: string }
export interface RiotSyncResult { account: RiotAccount; matches: MatchSummary[]; syncedAt: string }

/**
 * The renderer passes the key from the temporary input to the Rust session.
 * Only Rust makes HTTPS requests. The key is not persisted to disk.
 */
export async function syncRiotMatches(gameName: string, tagLine: string, apiKey: string, count = 5): Promise<RiotSyncResult> {
  if (!('__TAURI_INTERNALS__' in window)) {
    throw new Error('A sincronização Riot precisa ser executada no aplicativo desktop Tauri.')
  }
  return invoke<RiotSyncResult>('riot_sync_matches', { gameName, tagLine, apiKey, count })
}
