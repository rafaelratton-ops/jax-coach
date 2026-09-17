import { describe, it, expect, vi, afterEach } from 'vitest'
import { deriveHeuristics } from '../src/domain/analysis'
import { extractFacts, type RiotTimeline } from '../src/domain/review'
import { demoLibrary } from '../src/domain/demo'
import { emptyLibrary, historicalPatterns, mergeMatches, stats } from '../src/domain/library'
import { scoreRecording } from '../src/domain/recordingMatcher'
import { fixtureMatches, fixtureRecordings } from '../src/domain/fixtures'
import { loadLibrary, parseLibrary, saveLibrary } from '../src/services/library'
import { storage } from '../src/services/storage'
import { normalizeRiotId } from '../src/services/riotApi'
const match = { ...fixtureMatches[0], participantId: 1, opponentParticipantId: 6, source: 'riot-api' as const }
const timeline: RiotTimeline = { info: { frames: [
  { timestamp: 300000, events: [{ type: 'CHAMPION_KILL', timestamp: 280000, victimId: 1 }, { type: 'CHAMPION_KILL', timestamp: 290000, victimId: 4 }] },
  { timestamp: 600000, events: [{ type: 'CHAMPION_KILL', timestamp: 550000, victimId: 1 }], participantFrames: { '1': { minionsKilled: 52, totalGold: 3000 }, '6': { totalGold: 3400 } } },
] } }
afterEach(() => vi.unstubAllGlobals())
describe('Riot ID input', () => {
  it('accepts the pasted Name#Tag format', () => {
    expect(normalizeRiotId(' Pula Nuvem#Hope ', 'Hope')).toEqual({ gameName: 'Pula Nuvem', tagLine: 'Hope' })
    expect(normalizeRiotId('Pula Nuvem', '#Hope')).toEqual({ gameName: 'Pula Nuvem', tagLine: 'Hope' })
  })
})
describe('review evidence', () => {
  it('extracts only the selected player events and lane metrics', () => {
    const facts = extractFacts(match, timeline)
    expect(facts).toHaveLength(3)
    expect(facts.filter(f => f.kind === 'death')).toHaveLength(2)
    expect(facts.find(f => f.payload.type === 'cs10')?.payload.goldDiff).toBe(-400)
    expect(facts.every(f => f.source === 'timeline')).toBe(true)
  })
  it('does not use demo evidence in real analysis', () => {
    const counterfeit = extractFacts({ ...match, source: 'fixture' }, timeline)
    expect(deriveHeuristics(match, counterfeit).heuristics).toHaveLength(0)
    expect(deriveHeuristics(match, counterfeit).timeline).toHaveLength(0)
  })
  it('preserves evidence ids and never infers ability usage', () => {
    const facts = extractFacts(match, timeline)
    const result = deriveHeuristics(match, facts)
    expect(result.heuristics).toHaveLength(2)
    expect(result.heuristics.every(h => h.evidence.every(id => facts.some(f => f.id === id)))).toBe(true)
    expect(result.heuristics.some(h => h.statement.includes('Counter Strike'))).toBe(false)
  })
  it('requires repeated reviews before a historical pattern', () => {
    const data = demoLibrary()
    expect(historicalPatterns(data)).toHaveLength(1)
    expect(historicalPatterns({ ...data, matches: data.matches.slice(0, 2) })).toHaveLength(0)
  })
})
describe('honest statistics and persistence', () => {
  it('parses and rejects backup files safely', () => {
    const data = demoLibrary()
    expect(parseLibrary(JSON.stringify(data))).toEqual(data)
    expect(() => parseLibrary(JSON.stringify({ ...data, notes: { x: 'RGAPI-secret' } }))).toThrow()
  })
  it('excludes remakes and represents empty data as unavailable', () => {
    expect(stats([]).winRate).toBeNull()
    const s = stats([fixtureMatches[0], { ...fixtureMatches[1], result: 'remake' }])
    expect(s.count).toBe(1); expect(s.winRate).toBe(100)
  })
  it('merges duplicate imports without losing review status or old matches', () => {
    const previous = [{ ...match, analyzed: true }, fixtureMatches[1]]
    const merged = mergeMatches(previous, [{ ...match, analyzed: false }])
    expect(merged).toHaveLength(2)
    expect(merged.find(m => m.id === match.id)?.analyzed).toBe(true)
  })
  it('migrates old settings with missing Riot ID and nested defaults', () => {
    vi.stubGlobal('localStorage', { getItem: () => JSON.stringify({ safeMode: { enabled: false } }) })
    const settings = storage.settings()
    expect(settings.riotGameName).toBe('Pula Nuvem')
    expect(settings.safeMode.hideLiveFacts).toBe(true)
    expect(settings.safeMode.enabled).toBe(false)
  })
  it('keeps notes and reviews through a browser reload', async () => {
    const map = new Map<string, string>()
    vi.stubGlobal('window', {})
    vi.stubGlobal('localStorage', { getItem: (k: string) => map.get(k) ?? null, setItem: (k: string, v: string) => map.set(k, v) })
    const data = demoLibrary()
    await saveLibrary(data)
    expect(await loadLibrary()).toEqual(data)
    expect(map.values().next().value).not.toContain('RGAPI-')
  })
  it('rejects malformed data rather than overwriting it', async () => {
    vi.stubGlobal('window', {})
    vi.stubGlobal('localStorage', { getItem: () => '{broken' })
    await expect(loadLibrary()).rejects.toThrow()
  })
  it('blocks credentials accidentally typed into a note', async () => {
    const data = emptyLibrary(); data.goal = 'RGAPI-not-a-real-key'
    await expect(saveLibrary(data)).rejects.toThrow()
  })
})
describe('video scores', () => {
  it('rejects unknown duration and invalid timestamps', () => {
    expect(scoreRecording(match, { ...fixtureRecordings[0], durationSeconds: 0 }).confidence).toBe(0)
    expect(scoreRecording(match, { ...fixtureRecordings[0], startedAt: 'invalid' }).confidence).toBe(0)
  })
  it('caps scores from estimated file dates', () => {
    const r = { ...fixtureRecordings[0], startedAt: match.startedAt, durationSeconds: match.durationSeconds, timeSource: 'estimated' as const }
    expect(scoreRecording(match, r).confidence).toBe(.65)
  })
})
