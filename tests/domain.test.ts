import { describe, expect, it } from 'vitest'
import { fixtureMatches, fixtureRecordings, fixturePatterns } from '../src/domain/fixtures'
import { matchRecordings } from '../src/domain/recordingMatcher'
import { getSafeModeReminders } from '../src/domain/safeMode'
import { defaultSettings } from '../src/domain/fixtures'
import { buildMatchupPlan } from '../src/domain/matchup'

describe('recording matcher', () => {
  it('ranks a recording that matches time and duration', () => {
    const matches = matchRecordings(fixtureMatches[0], fixtureRecordings)
    expect(matches[0].confidence).toBeGreaterThan(0.9)
  })
})

describe('safe mode', () => {
  it('only returns historical reminders for the selected opponent', () => {
    const reminders = getSafeModeReminders(defaultSettings, fixturePatterns, 'Camille')
    expect(reminders).toHaveLength(1)
    expect(reminders[0].copy).toContain('histórico')
  })
})

describe('focus matchup plan', () => {
  it('uses the latest Jax matchup and marks it as static', () => {
    const plan = buildMatchupPlan(fixtureMatches, true)
    expect(plan?.opponent).toBe('Camille')
    expect(plan?.sampleSize).toBe(1)
    expect(plan?.sourceLabel).toContain('ficha estática')
    expect(plan?.actions.join(' ')).toContain('Counter Strike')
  })
})
