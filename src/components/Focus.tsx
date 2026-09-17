import { useEffect, useRef, useState } from 'react'
import { invoke } from '@tauri-apps/api/core'
import { Crosshair, X } from 'lucide-react'
import { desktop } from '../services/library'
import { readLiveSafeSnapshot, type LiveSafeSnapshot } from '../services/liveClient'
import { buildMatchupPlanForOpponent, type MatchupPlan } from '../domain/matchup'
export interface FocusSnapshot { goal: string; notes: string[]; demo: boolean; matchups?: MatchupPlan[]; live?: { connected: boolean; champion?: string; role?: string; opponentChampion?: string; gameMode?: string } }
export function Focus({ snapshot, onClose }: { snapshot?: FocusSnapshot; onClose?: () => void }) {
  const [data, setData] = useState(snapshot)
  const [selectedOpponent, setSelectedOpponent] = useState('')
  const [error, setError] = useState('')
  const [liveMonitoring, setLiveMonitoring] = useState(false)
  const [liveState, setLiveState] = useState<LiveSafeSnapshot>()
  const [liveError, setLiveError] = useState('')
  const liveBusy = useRef(false)
  const closeButton = useRef<HTMLButtonElement>(null)
  useEffect(() => {
    closeButton.current?.focus()
    if (!snapshot && desktop()) void invoke<FocusSnapshot>('focus_snapshot').then(setData).catch(() => setError('Não foi possível carregar seus lembretes. Feche e abra o painel novamente.'))
  }, [snapshot])
  useEffect(() => {
    if (!selectedOpponent && data?.matchups?.length) setSelectedOpponent(data.matchups[0].opponent)
  }, [data, selectedOpponent])
  useEffect(() => {
    function keyboard(event: KeyboardEvent) {
      if (event.key === 'Escape') { if (onClose) onClose(); else void invoke('close_focus').catch(() => setError('Use o X da janela para fechar o painel.')) }
      if (event.key === 'Tab') { event.preventDefault(); closeButton.current?.focus() }
    }
    window.addEventListener('keydown', keyboard)
    return () => window.removeEventListener('keydown', keyboard)
  }, [onClose])
  async function pollLive() {
    if (liveBusy.current) return
    liveBusy.current = true
    try {
      const current = await readLiveSafeSnapshot()
      setLiveState(current)
      setLiveError(current.connected ? '' : 'Nenhuma partida ativa foi encontrada. O acompanhamento continua pronto.')
    } catch (reason) {
      setLiveError(reason instanceof Error ? reason.message : String(reason))
    } finally {
      liveBusy.current = false
    }
  }
  useEffect(() => {
    if (!liveMonitoring) return
    void pollLive()
    const timer = window.setInterval(() => void pollLive(), 10000)
    return () => window.clearInterval(timer)
  }, [liveMonitoring])
  const liveOpponent = liveState?.laneOpponent?.champion ?? data?.live?.opponentChampion
  const selectedMatchup = data?.matchups?.find(item => item.opponent === selectedOpponent) ?? data?.matchups?.[0] ?? (liveOpponent ? buildMatchupPlanForOpponent(liveOpponent, 0, data?.demo ?? false) : undefined)
  return <main className="focus-window">
    <div className="focus-top"><span className="brand-small"><Crosshair size={20} />JAX COACH</span>
      <button ref={closeButton} className="icon-button" aria-label="Fechar painel de foco" onClick={() => onClose ? onClose() : void invoke('close_focus').catch(() => setError('Use o X da janela para fechar o painel.'))}><X size={20} /></button>
    </div>
    <span className="pill">Memória histórica · acompanhamento opcional</span>
    {error && <p role="alert">{error}</p>}
    <p className="eyebrow">SEU FOCO</p><h1>{data?.goal ?? 'Carregando seu foco…'}</h1>
    {data?.live?.connected && <div className="focus-live-context"><span className="focus-live-badge">Contexto inicial identificado</span><strong>{data.live.champion ?? 'Seu campeão'}{data.live.role ? ` · ${data.live.role}` : ''}{data.live.opponentChampion ? ` × ${data.live.opponentChampion}` : ''}</strong><small>Esse contexto organiza a ficha. O acompanhamento seguro abaixo é opcional e não dita ações.</small></div>}
    <section className="focus-live-panel" aria-label="Acompanhamento seguro"><div className="focus-live-panel-heading"><div><p className="eyebrow">MODO FOCO</p><h2>Acompanhamento seguro</h2></div><button className="secondary focus-live-toggle" aria-pressed={liveMonitoring} disabled={!desktop()} onClick={() => { setLiveMonitoring(value => !value); setLiveError('') }}>{liveMonitoring ? 'Desligar' : 'Ativar'}</button></div><p className="focus-live-help">Lê fatos resumidos do League Client a cada 10 segundos enquanto você mantiver ligado. Não lê memória, não acompanha a tela e não executa ações.</p>{liveError && <p className="focus-live-error" role="status">{liveError}</p>}{liveMonitoring && liveState?.connected && <div className="focus-live-facts"><strong>{liveState.gameMode ?? 'Partida'} · {Math.floor((liveState.gameTimeSeconds ?? 0) / 60)}:{String(Math.floor((liveState.gameTimeSeconds ?? 0) % 60)).padStart(2, '0')}</strong><span>Você: {liveState.own?.champion ?? 'campeão não identificado'}{liveState.own?.level ? ` · nível ${liveState.own.level}` : ''}</span><span>Rota: {liveState.own?.role ?? 'não identificada'}{liveState.laneOpponent?.champion ? ` · adversário: ${liveState.laneOpponent.champion}` : ''}</span>{liveState.own?.items.length ? <small>Itens: {liveState.own.items.filter(item => item.name).map(item => item.name).join(', ')}</small> : null}{liveState.own?.scores && <small>Placar: {liveState.own.scores.kills ?? 0}/{liveState.own.scores.deaths ?? 0}/{liveState.own.scores.assists ?? 0} · CS {liveState.own.scores.creepScore ?? 0}</small>}</div>}{liveMonitoring && selectedMatchup && <div className="focus-live-suggestions"><strong>Opções de treino</strong>{selectedMatchup.actions.slice(0, 3).map(action => <p key={action}>· {action}</p>)}<small>São alternativas baseadas na ficha histórica; escolha você o que faz sentido.</small></div>}</section>
    {data?.matchups?.length && <section className="focus-matchup" aria-label="Ficha de matchup">
      <label className="focus-matchup-select">Matchup desta partida<select value={selectedOpponent || data.matchups[0].opponent} onChange={event => setSelectedOpponent(event.target.value)}>{data.matchups.map(item => <option key={item.opponent} value={item.opponent}>Jax × {item.opponent}</option>)}</select></label>
      {(() => { const matchup = data.matchups.find(item => item.opponent === selectedOpponent) ?? data.matchups[0]; return <>
        <div className="focus-matchup-heading"><div><p className="eyebrow">FICHA DA MATCHUP</p><h2>Jax <span>×</span> {matchup.opponent}</h2></div><small>{matchup.sampleSize} jogo(s) na amostra</small></div>
        <p className="focus-matchup-overview">{matchup.overview}</p>
        <div className="focus-matchup-columns"><div><strong>Itens para considerar</strong>{matchup.items.map(item => <p key={item}>· {item}</p>)}</div><div><strong>Ações de treino</strong>{matchup.actions.map(action => <p key={action}>· {action}</p>)}</div></div>
        <div className="focus-matchup-avoid"><strong>Evite repetir</strong>{matchup.avoid.map(item => <p key={item}>· {item}</p>)}</div>
        <small className="focus-matchup-source">{matchup.sourceLabel} · a ficha continua baseada no seu histórico; o resumo ao vivo é separado e opcional.</small>
      </> })()}
    </section>}
    {data?.notes.slice(0, 3).map((note, i) => <article key={i}><span>0{i + 1}</span><p>{note}</p></article>)}
    <footer>{data?.demo ? 'Demonstração · anotações simuladas.' : 'Anotações anteriores à abertura deste painel.'}<br />O acompanhamento é opcional, mostra fatos resumidos e não há assistência automática.</footer>
  </main>
}
