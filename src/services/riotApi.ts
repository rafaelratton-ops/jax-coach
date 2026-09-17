import type { MatchSummary } from '../domain/types'
import { invoke } from '@tauri-apps/api/core'

export interface RiotAccount { puuid: string; gameName: string; tagLine: string }
export interface RiotSyncResult { account: RiotAccount; matches: MatchSummary[]; syncedAt: string }

/** Accepts either separate fields or the familiar Riot ID format: Name#Tag. */
export function normalizeRiotId(gameName: string, tagLine: string) {
  const name = gameName.trim()
  const tag = tagLine.trim().replace(/^#/, '')
  const separator = name.lastIndexOf('#')
  if (separator > 0 && separator < name.length - 1) {
    return { gameName: name.slice(0, separator).trim(), tagLine: name.slice(separator + 1).trim() }
  }
  return { gameName: name, tagLine: tag }
}

/**
 * The renderer passes the key from the temporary input to the Rust session.
 * Only Rust makes HTTPS requests. The key is not persisted to disk.
 */
export async function syncRiotMatches(gameName: string, tagLine: string, apiKey: string, count = 5): Promise<RiotSyncResult> {
  if (!('__TAURI_INTERNALS__' in window)) {
    throw new Error('A sincronização Riot precisa ser executada no aplicativo desktop Tauri.')
  }
  const id = normalizeRiotId(gameName, tagLine)
  return invoke<RiotSyncResult>('riot_sync_matches', { ...id, apiKey, count })
}
