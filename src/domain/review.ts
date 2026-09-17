import type { MatchFact, MatchSummary } from './types'

interface Frame { timestamp: number; participantFrames?: Record<string, { minionsKilled?: number; jungleMinionsKilled?: number; totalGold?: number }>; events?: Event[] }
interface Event { type: string; timestamp: number; victimId?: number; killerId?: number; participantId?: number; assistingParticipantIds?: number[]; monsterType?: string; buildingType?: string; itemId?: number }
export interface RiotTimeline { info: { frames: Frame[] } }

export function clockTime(ms: number) { const sec = Math.floor(ms / 1000); return `${String(Math.floor(sec / 60)).padStart(2, '0')}:${String(sec % 60).padStart(2, '0')}` }

export function extractFacts(match: MatchSummary, timeline: RiotTimeline): MatchFact[] {
  if (!match.participantId || !Array.isArray(timeline.info?.frames)) return []
  const playerId = match.participantId
  const facts: MatchFact[] = []
  let eventIndex = 0
  const add = (ms: number, kind: MatchFact['kind'], summary: string, payload: Record<string, unknown>) => {
    facts.push({ id: `${match.id}-${eventIndex++}`, matchId: match.id, occurredAt: clockTime(ms), kind, summary, source: match.source === 'fixture' ? 'fixture' : 'timeline', confidence: 1, payload: { ...payload, timestampMs: ms } })
  }
  for (const frame of timeline.info.frames) {
    for (const event of frame.events ?? []) {
      if (!Number.isFinite(event.timestamp)) continue
      if (event.type === 'CHAMPION_KILL' && event.victimId === playerId) add(event.timestamp, 'death', 'Morte registrada na Timeline.', { type: 'death' })
      else if (event.type === 'CHAMPION_KILL' && event.killerId === playerId) add(event.timestamp, 'trade', 'Abate registrado na Timeline.', { type: 'kill' })
      else if (event.type === 'CHAMPION_KILL' && event.assistingParticipantIds?.includes(playerId)) add(event.timestamp, 'trade', 'Assistência registrada na Timeline.', { type: 'assist' })
      if (['ELITE_MONSTER_KILL', 'BUILDING_KILL'].includes(event.type) && (event.killerId === playerId || event.assistingParticipantIds?.includes(playerId))) add(event.timestamp, 'objective', `Participação registrada: ${event.monsterType ?? event.buildingType ?? 'objetivo'}.`, { type: 'objective' })
      if (event.type === 'ITEM_PURCHASED' && event.participantId === playerId) add(event.timestamp, 'item', `Compra do item #${event.itemId}.`, { type: 'item', itemId: event.itemId })
    }
    if (Math.abs(frame.timestamp - 600000) < 1000) {
      const player = frame.participantFrames?.[String(playerId)]
      const opponent = frame.participantFrames?.[String(match.opponentParticipantId)]
      if (player && typeof player.minionsKilled === 'number') {
        const cs = player.minionsKilled + (player.jungleMinionsKilled ?? 0)
        const goldDiff = typeof player.totalGold === 'number' && typeof opponent?.totalGold === 'number' ? player.totalGold - opponent.totalGold : undefined
        add(frame.timestamp, 'lane-state', `${cs} tropas aos 10 minutos${goldDiff !== undefined ? ` · ${goldDiff >= 0 ? '+' : ''}${goldDiff} de ouro vs. adversário de rota` : ''}.`, { type: 'cs10', cs, goldDiff })
      }
    }
  }
  return facts.sort((a, b) => Number(a.payload.timestampMs) - Number(b.payload.timestampMs))
}
