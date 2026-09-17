import { describe, expect, it } from 'vitest'
import { fixtureMatches, fixtureRecordings, fixturePatterns } from '../src/domain/fixtures'
import { demoLibrary } from '../src/domain/demo'
import { matchRecordings } from '../src/domain/recordingMatcher'
import { getSafeModeReminders } from '../src/domain/safeMode'
import { defaultSettings } from '../src/domain/fixtures'
import { buildMatchupPlan, buildMatchupPlanForOpponent } from '../src/domain/matchup'
import { jaxPerformance, trainingBlockProgress } from '../src/domain/performance'
import { buildPreGameAdvice } from '../src/domain/advisor'

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

  it('creates a static plan for a matchup identified only by the local client', () => {
    const plan = buildMatchupPlanForOpponent('Renekton', 0, false)
    expect(plan.opponent).toBe('Renekton')
    expect(plan.sampleSize).toBe(0)
    expect(plan.sourceLabel).toContain('ficha estática')
  })
})

describe('personal performance', () => {
  it('calculates Jax top metrics from reviewed evidence', () => {
    const metrics = jaxPerformance(demoLibrary())
    expect(metrics.games).toBe(3)
    expect(metrics.winRate).toBe(67)
    expect(metrics.csAt10).toBe(60)
    expect(metrics.earlyDeathGames).toBe(3)
  })

  it('counts only Jax top games inside the active ten-game block', () => {
    const data = demoLibrary()
    const progress = trainingBlockProgress(data, { goalId: 'cs-at-10', startedAt: '2026-09-12T00:00:00Z', targetGames: 10, checkIns: { [data.matches[0].id]: { result: 'yes', happened: 'ok', decision: 'ok', nextStep: 'ok', savedAt: '2026-09-16T00:00:00Z' } } })
    expect(progress.games).toHaveLength(3)
    expect(progress.checkedIn).toBe(1)
    expect(progress.complete).toBe(false)
  })
})

describe('pre-game advisor', () => {
  it('offers multiple transparent options from the visible composition', () => {
    const advice = buildPreGameAdvice({ laneOpponent: 'Teemo', enemyTeam: ['Sejuani', 'Orianna', 'Jhin', 'Nautilus'], allyTeam: [], library: demoLibrary() })
    expect(advice.options).toHaveLength(3)
    expect(advice.compositionSummary).toContain('dano mágico')
    expect(advice.options.every(option => option.runes.length > 0 && option.items.length > 0 && option.reason)).toBe(true)
  })
})
