import { useEffect, useState } from 'react'
import { invoke } from '@tauri-apps/api/core'
import { Activity, Archive, ArrowRight, BookOpen, CheckCircle2, Crosshair, Film, LayoutDashboard, Monitor, Settings2, Sword, TrendingUp, X } from 'lucide-react'
import type { AppSettings, CoachTab, MatchSummary, RecordingCandidate } from '../domain/types'
import { emptyLibrary, mergeMatches, type Library } from '../domain/library'
import { demoLibrary } from '../domain/demo'
import { getAIProvider } from '../providers'
import { extractFacts, type RiotTimeline } from '../domain/review'
import { storage } from '../services/storage'
import { desktop, loadLibrary, readLibraryFile, saveLibrary } from '../services/library'
import { readLiveMatchContext, type LiveMatchContext } from '../services/liveClient'
import { normalizeRiotId, syncRiotMatches, testRiotConnection } from '../services/riotApi'
import { log } from '../services/logger'
import { Overview } from '../components/Overview'
import { History } from '../components/History'
import { Patterns } from '../components/Patterns'
import { Settings } from '../components/Settings'
import { Videos } from '../components/Videos'
import { Diagnostics, type Environment } from '../components/Diagnostics'
import { Focus, type FocusSnapshot } from '../components/Focus'
import { Performance } from '../components/Performance'
import { buildMatchupPlanForOpponent, buildMatchupPlans } from '../domain/matchup'
import type { CheckInResult, GoalId } from '../domain/performance'

const navigation = [
  { id: 'dashboard', label: 'Visão geral', icon: LayoutDashboard },
  { id: 'history', label: 'Histórico', icon: Archive },
  { id: 'my-jax', label: 'Meu Jax', icon: Sword },
  { id: 'performance', label: 'Performance', icon: TrendingUp },
  { id: 'patterns', label: 'Padrões pessoais', icon: BookOpen },
  { id: 'videos', label: 'Vídeos', icon: Film },
  { id: 'settings', label: 'Configurações', icon: Settings2 },
  { id: 'diagnostics', label: 'Diagnóstico', icon: Activity },
] as const

export default function App() {
  return new URLSearchParams(window.location.search).has('focus') ? <Focus /> : <Coach />
}
function Coach() {
  const [tab, setTab] = useState<CoachTab>('dashboard')
  const [settings, setSettings] = useState<AppSettings>(() => storage.settings())
  const [personal, setPersonal] = useState<Library>(emptyLibrary)
  const [demoData, setDemoData] = useState<Library>(demoLibrary)
  const [demo, setDemo] = useState(true)
  const [loaded, setLoaded] = useState(false)
  const [loadError, setLoadError] = useState('')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [selectedId, setSelectedId] = useState<string>()
  const [environment, setEnvironment] = useState<Environment>()
  const [focus, setFocus] = useState<FocusSnapshot>()
  const data = demo ? demoData : personal
  useEffect(() => {
    let alive = true
    loadLibrary().then(value => { if (alive) { setPersonal(value); setDemo(!value.matches.length); setLoaded(true) } })
      .catch(() => { if (alive) setLoadError('Não consegui abrir seu histórico salvo. Feche e reabra o aplicativo para tentar de novo. Seus dados foram preservados.') })
    return () => { alive = false }
  }, [])
  useEffect(() => { void refresh() }, [])
  async function refresh() {
    if (desktop()) {
      try { setEnvironment(await invoke<Environment>('detect_environment')) } catch { setError('Não foi possível verificar os componentes locais.') }
    }
  }
  function tell(text: string) { setMessage(text); setError(''); log('info', text) }
  function fail(reason: unknown) { const text = reason instanceof Error ? reason.message : String(reason); setError(text); setMessage(''); log('error', text) }
  async function persist(next: Library) {
    if (!loaded) throw new Error('Histórico ainda indisponível.')
    if (demo) setDemoData(next)
    else { await saveLibrary(next); setPersonal(next) }
  }
  async function work(action: () => Promise<void>) {
    if (busy) return
    setBusy(true); setError(''); setMessage('')
    try { await action() } catch (reason) { fail(reason); throw reason } finally { setBusy(false) }
  }
  function saveSettings(next: AppSettings) {
    try { storage.saveSettings(next); setSettings(next); tell('Preferências salvas.') } catch { fail('Não foi possível salvar as preferências.') }
  }
  async function sync(name: string, tag: string, key: string, count: number) {
    await work(async () => {
      const riotId = normalizeRiotId(name, tag)
      const result = await syncRiotMatches(riotId.gameName, riotId.tagLine, key, count)
      if (!result.matches.length) throw new Error('A Riot reconheceu a conta, mas não devolveu partidas nesse período. Confira se este é o Riot ID usado no LoL e se há partidas recentes.')
      if (personal.owner && personal.owner !== result.account.puuid) throw new Error('Esta biblioteca pertence a outra conta. A troca de conta ainda não é suportada; seu histórico foi preservado.')
      const base = personal
      const next: Library = { ...base, owner: result.account.puuid, matches: mergeMatches(base.matches, result.matches), syncedAt: result.syncedAt }
      await saveLibrary(next); setPersonal(next); setDemo(false)
      const preferences = { ...settings, riotGameName: result.account.gameName, riotTagLine: result.account.tagLine }
      storage.saveSettings(preferences); setSettings(preferences)
      tell(`${result.matches.length} partidas consultadas para ${result.account.gameName}#${result.account.tagLine}. Seu histórico foi salvo neste computador.`)
      void refresh()
    })
  }
  async function testConnection(name: string, tag: string, key: string) {
    await work(async () => {
      const riotId = normalizeRiotId(name, tag)
      const account = await testRiotConnection(riotId.gameName, riotId.tagLine, key)
      const preferences = { ...settings, riotGameName: account.gameName, riotTagLine: account.tagLine }
      storage.saveSettings(preferences); setSettings(preferences)
      tell(`Conexão confirmada para ${account.gameName}#${account.tagLine}. Agora você pode sincronizar as partidas.`)
      void refresh()
    })
  }
  async function analyze(match: MatchSummary) {
    await work(async () => {
      const facts = demo ? data.facts.filter(f => f.matchId === match.id) : extractFacts(match, await invoke<RiotTimeline>('riot_timeline', { matchId: match.id }))
      const review = await getAIProvider().analyzePostGame({ match, facts, patterns: [] })
      const next = { ...data, facts: [...data.facts.filter(f => f.matchId !== match.id), ...facts],
        analyses: { ...data.analyses, [match.id]: review }, matches: data.matches.map(m => m.id === match.id ? { ...m, analyzed: true } : m) }
      await persist(next)
      tell(`Revisão pronta: ${facts.length} eventos e ${review.heuristics.length} pontos para conferir.`)
    })
  }
  function openMatch(match: MatchSummary) { setSelectedId(match.id); setTab('history') }
  async function note(id: string, text: string) {
    await work(async () => {
      if (text.includes('RGAPI-')) throw new Error('Esse campo é para aprendizados; use o campo Chave Riot em Configurações.')
      await persist({ ...data, notes: { ...data.notes, [id]: text } }); tell('Anotação salva.')
    })
  }
  async function goal(text: string) {
    await work(async () => { await persist({ ...data, goal: text.trim() }); tell('Objetivo de treino salvo.') })
  }
  async function startTrainingBlock(goalId: GoalId) {
    await work(async () => {
      const next = { ...data, activeBlock: { goalId, startedAt: new Date().toISOString(), targetGames: 10, checkIns: {} } }
      await persist(next)
      tell('Bloco de 10 partidas iniciado. Concentre-se em um objetivo por vez.')
    })
  }
  async function clearTrainingBlock() {
    await work(async () => { const next = { ...data }; delete next.activeBlock; await persist(next); tell('Bloco encerrado. Seu histórico foi preservado.') })
  }
  async function guidedReview(id: string, input: { result: CheckInResult; happened: string; decision: string; nextStep: string }) {
    await work(async () => {
      const currentNote = data.notes[id]?.trim()
      const guided = `Revisão rápida\nObjetivo: ${input.result === 'yes' ? 'consegui' : input.result === 'partial' ? 'parcialmente' : 'não consegui'}\nO que aconteceu: ${input.happened.trim()}\nPrimeira decisão que mudaria: ${input.decision.trim()}\nPróximo teste: ${input.nextStep.trim()}`
      const noteText = [currentNote, guided].filter(Boolean).join('\n\n')
      const next = { ...data, notes: { ...data.notes, [id]: noteText }, activeBlock: data.activeBlock ? { ...data.activeBlock, checkIns: { ...(data.activeBlock.checkIns ?? {}), [id]: { ...input, savedAt: new Date().toISOString() } } } : data.activeBlock }
      await persist(next)
      tell('Revisão rápida salva. Use o próximo jogo para testar uma mudança.')
    })
  }
  async function scan(folder: string) {
    await work(async () => {
      const recordings = await invoke<RecordingCandidate[]>('scan_outplayed_directory', { directory: folder })
      const existing = new Map(personal.recordings.map(r => [r.path, r]))
      for (const r of recordings) existing.set(r.path, existing.get(r.path)?.timeSource === 'manual' ? existing.get(r.path)! : r)
      const next = { ...personal, recordings: [...existing.values()] }
      await saveLibrary(next); setPersonal(next); setDemo(false)
      saveSettings({ ...settings, outplayedDirectory: folder })
      tell(`${recordings.length} vídeos encontrados. Originais preservados.`)
    })
  }
  async function updateRecording(recording: RecordingCandidate) {
    await work(async () => { await persist({ ...data, recordings: data.recordings.map(r => r.path === recording.path ? recording : r) }); tell('Horário da gravação confirmado.') })
  }
  async function clip(path: string, start: number) {
    await work(async () => {
      await invoke<string>('create_clip', { sourcePath: path, startSeconds: start, durationSeconds: 45 })
      tell('Recorte criado. Use “Abrir pasta dos recortes” para assistir.')
    })
  }
  async function importBackup(file: File) {
    await work(async () => {
      const imported = await readLibraryFile(file)
      if (personal.matches.length && !window.confirm('Isso substituirá o histórico pessoal deste computador pelo backup escolhido. Continuar?')) return
      await saveLibrary(imported)
      setPersonal(imported); setDemo(false)
      const saved = { ...settings, riotGameName: storage.settings().riotGameName, riotTagLine: storage.settings().riotTagLine }
      setSettings(saved)
      tell(`${imported.matches.length} partidas restauradas do backup.`)
    })
  }
  async function switchAccount() {
    await work(async () => {
      if (!personal.matches.length) { tell('Não há histórico pessoal para trocar.'); return }
      if (!window.confirm('Antes de trocar de conta, exporte seu histórico se quiser guardá-lo. Limpar agora?')) return
      const blank = emptyLibrary()
      await saveLibrary(blank)
      setPersonal(blank); setDemo(false); setSelectedId(undefined)
      tell('Histórico pessoal limpo. Você pode conectar outra conta em Configurações.')
    })
  }
  async function openFocus() {
    if (busy) return
    let live: LiveMatchContext | undefined
    let matchups = buildMatchupPlans(data.matches, demo)
    if (desktop()) {
      try {
        const context = await readLiveMatchContext()
        if (context.connected) {
          live = context
          const opponent = context.opponentChampion?.trim()
          if (opponent) {
            const historical = matchups.find(item => item.opponent.toLowerCase() === opponent.toLowerCase())
            const currentPlan = buildMatchupPlanForOpponent(opponent, historical?.sampleSize ?? 0, demo)
            matchups = [currentPlan, ...matchups.filter(item => item.opponent.toLowerCase() !== opponent.toLowerCase())]
          }
        }
      } catch {
        // Sem League Client disponível, o painel continua com a seleção manual histórica.
      }
    }
    const snapshot: FocusSnapshot = { goal: data.goal, demo, notes: data.matches.filter(m => m.champion === 'Jax' && data.notes[m.id]?.trim()).slice(0, 3).map(m => `${m.champion} vs. ${m.opponent}: ${data.notes[m.id]}`), matchups, live }
    try { if (desktop()) await invoke('open_focus', { snapshot }); else setFocus(snapshot) } catch (reason) { fail(reason) }
  }
  if (loadError) return <div className="startup"><h1>Seu histórico está protegido.</h1><p>{loadError}</p><button onClick={() => window.location.reload()}>Tentar novamente</button></div>
  if (!loaded) return <div className="startup"><Crosshair size={38} /><h1>Abrindo seu coach…</h1></div>
  return <div className="app-shell">
    <aside className="sidebar"><div className="brand"><span><Crosshair size={23} /></span><div>JAX<strong>COACH</strong><small>MEMÓRIA DE JOGO</small></div></div>
      <div className="profile"><div className="avatar">{settings.riotGameName.slice(0, 1)}</div><div><strong>{settings.riotGameName}</strong><small>#{settings.riotTagLine} · Brasil</small></div></div>
      <p className="nav-label">SEU TREINO</p><nav>{navigation.map(({ id, icon: Icon, label }, i) => <button className={`nav-item ${tab === id ? 'active' : ''} ${i === 6 ? 'nav-gap' : ''}`} key={id} onClick={() => setTab(id)}><Icon size={18} /><span>{label}</span></button>)}</nav>
      <div className="sidebar-foot"><button className="focus-button" disabled={busy} onClick={() => void openFocus()}><Monitor size={18} /><span>Painel de foco<small>Acompanhamento opcional</small></span><ArrowRight size={15} /></button><small>v0.5.0 · seus dados neste computador</small></div>
    </aside>
    <main className="main-content"><header className="topbar"><span>{navigation.find(n => n.id === tab)?.label}</span><div className="top-actions"><span className={`connection-dot ${demo ? 'demo' : ''}`} />{demo ? 'Demonstração' : 'Histórico pessoal'}<button className="text-link" disabled={busy} onClick={() => { setDemo(!demo); setSelectedId(undefined) }}>{demo ? 'Ver meus dados' : 'Explorar exemplo'}</button></div></header>
      <div className="content">{demo && <div className="demo-banner"><BookOpen size={18} /><span><strong>Você está explorando um exemplo.</strong> Estes dados não são da sua conta.</span><button onClick={() => setTab('settings')}>Conectar minha conta <ArrowRight size={15} /></button></div>}
      {(message || error) && <div className={`notice ${error ? 'error' : ''}`} role={error ? 'alert' : 'status'}>{!error && <CheckCircle2 size={18} />}<span>{error || message}</span><button aria-label="Fechar mensagem" onClick={() => { setError(''); setMessage('') }}><X size={17} /></button></div>}
      {tab === 'dashboard' && <Overview data={data} demo={demo} onMatch={openMatch} onSettings={() => setTab('settings')} onFocus={() => void openFocus()} />}
      {tab === 'my-jax' && <Overview data={data} demo={demo} jaxOnly onMatch={openMatch} onSettings={() => setTab('settings')} onFocus={() => void openFocus()} />}
      {tab === 'history' && <History key={`${demo}-${selectedId}`} data={data} initialId={selectedId} busy={busy} onAnalyze={m => void analyze(m).catch(() => {})} onNote={note} onGuidedReview={guidedReview} />}
      {tab === 'performance' && <Performance data={data} demo={demo} busy={busy} onStartBlock={startTrainingBlock} onClearBlock={clearTrainingBlock} />}
      {tab === 'patterns' && <Patterns key={String(demo)} data={data} busy={busy} onGoal={text => goal(text).catch(() => {})} onMatch={openMatch} />}
      {tab === 'settings' && <Settings data={personal} settings={settings} busy={busy} onSave={saveSettings} onSync={sync} onTest={testConnection} onImport={importBackup} onSwitchAccount={switchAccount} />}
      {tab === 'videos' && <Videos key={String(demo)} data={data} directory={settings.outplayedDirectory} busy={busy} folders={environment?.folders ?? []} onScan={f => scan(f).catch(() => {})} onSaveRecording={r => updateRecording(r).catch(() => {})} onClip={(p, s) => clip(p, s).catch(() => {})} />}
      {tab === 'diagnostics' && <Diagnostics data={personal} environment={environment} refresh={() => void refresh()} />}
      </div>
    </main>{focus && <div className="focus-backdrop" role="dialog" aria-label="Painel de foco" aria-modal="true"><Focus snapshot={focus} onClose={() => setFocus(undefined)} /></div>}
  </div>
}
