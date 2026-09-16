import type { RecordingCandidate } from '../domain/types'

export interface TauriRecordingCandidate extends RecordingCandidate { extension: string }

/** Optional bridge: the web fixture path remains the default when not running in Tauri. */
export async function scanOutplayedDirectory(directory: string): Promise<TauriRecordingCandidate[]> {
  if (!('__TAURI_INTERNALS__' in window)) return []
  const { invoke } = await import('@tauri-apps/api/core')
  return invoke<TauriRecordingCandidate[]>('scan_outplayed_directory', { directory })
}
