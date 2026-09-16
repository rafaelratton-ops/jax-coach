import { matchRecordings } from '../domain/recordingMatcher'
import type { MatchSummary, RecordingCandidate } from '../domain/types'

export interface ClipRequest { sourcePath: string; outputPath: string; startSeconds: number; durationSeconds: number }

export function findRecordingsForMatch(match: MatchSummary, recordings: RecordingCandidate[]) {
  return matchRecordings(match, recordings)
}

export function buildClipRequest(recording: RecordingCandidate, eventSeconds: number, destinationDirectory: string): ClipRequest {
  const safeName = recording.path.split(/[\\/]/).pop()?.replace(/\.[^.]+$/, '') ?? 'jax-match'
  const outputPath = `${destinationDirectory}/${safeName}-event-${Math.round(eventSeconds)}s.mp4`
  return { sourcePath: recording.path, outputPath, startSeconds: Math.max(0, eventSeconds - 15), durationSeconds: 45 }
}

export function ffmpegCommand(request: ClipRequest) {
  return `ffmpeg -ss ${request.startSeconds} -i "${request.sourcePath}" -t ${request.durationSeconds} -c copy "${request.outputPath}"`
}
