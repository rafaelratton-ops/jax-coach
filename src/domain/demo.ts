import { fixtureMatches } from './fixtures'
import { emptyLibrary } from './library'
import { extractFacts, type RiotTimeline } from './review'
import { deriveHeuristics } from './analysis'

export function demoLibrary() {
  const data = emptyLibrary()
  data.matches = fixtureMatches.map(m => ({ ...m, participantId: 1, opponentParticipantId: 6, analyzed: true }))
  for (const [i, match] of data.matches.entries()) {
    const timeline: RiotTimeline = { info: { frames: [
      { timestamp: 300000, events: [{ type: 'CHAMPION_KILL', timestamp: 282000, victimId: 1 }] },
      { timestamp: 540000, events: [{ type: 'CHAMPION_KILL', timestamp: 497000, victimId: 1 }] },
      { timestamp: 600000, participantFrames: { '1': { minionsKilled: 52 + i * 8, totalGold: 3100 + i * 200 }, '6': { totalGold: 3300 } } },
      { timestamp: 900000, events: [{ type: 'CHAMPION_KILL', timestamp: 860000, killerId: 1 }, { type: 'ELITE_MONSTER_KILL', timestamp: 887000, monsterType: 'RIFTHERALD', assistingParticipantIds: [1] }] },
    ] } }
    const facts = extractFacts(match, timeline)
    data.facts.push(...facts)
    data.analyses[match.id] = deriveHeuristics(match, facts)
  }
  data.notes[data.matches[0].id] = 'Exemplo de anotação: revisar o caminho que fiz antes da primeira morte.'
  return data
}
