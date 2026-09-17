import type { MatchSummary, RecordingCandidate } from './types'

const seconds = (iso: string) => new Date(iso).getTime() / 1000

export function scoreRecording(match: MatchSummary, recording: RecordingCandidate): RecordingCandidate {
  if (!Number.isFinite(seconds(recording.startedAt)) || !Number.isFinite(seconds(match.startedAt)) || recording.durationSeconds <= 0) {
    return { ...recording, confidence: 0, reason: 'Horário ou duração indisponível; confirme o vínculo manualmente.' }
  }
  const startDelta = Math.abs(seconds(match.startedAt) - seconds(recording.startedAt))
  const durationDelta = Math.abs(match.durationSeconds - recording.durationSeconds)
  // A small clock drift is common between Riot's match start and the recorder.
  // Keep the windows forgiving while still making the score meaningful.
  const startScore = Math.max(0, 1 - startDelta / 120)
  const durationScore = Math.max(0, 1 - durationDelta / 60)
  const confidence = Math.min(recording.timeSource === 'estimated' ? 0.65 : 1, Math.round((startScore * 0.65 + durationScore * 0.35) * 100) / 100)
  return { ...recording, confidence, reason: `início Δ${Math.round(startDelta)}s · duração Δ${Math.round(durationDelta)}s` }
}

export function matchRecordings(match: MatchSummary, recordings: RecordingCandidate[], minimum = 0.6) {
  return recordings.map((recording) => scoreRecording(match, recording)).filter((recording) => recording.confidence >= minimum).sort((a, b) => b.confidence - a.confidence)
}
