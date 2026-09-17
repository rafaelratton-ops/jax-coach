import { useEffect, useRef, useState } from 'react'
import { invoke } from '@tauri-apps/api/core'
import { Crosshair, X } from 'lucide-react'
import { desktop } from '../services/library'
import type { MatchupPlan } from '../domain/matchup'
export interface FocusSnapshot { goal: string; notes: string[]; demo: boolean; matchups?: MatchupPlan[]; live?: { connected: boolean; champion?: string; role?: string; opponentChampion?: string; gameMode?: string } }
export function Focus({ snapshot, onClose }: { snapshot?: FocusSnapshot; onClose?: () => void }) {
  const [data, setData] = useState(snapshot)
  const [selectedOpponent, setSelectedOpponent] = useState('')
  const [error, setError] = useState('')
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
  return <main className="focus-window">
    <div className="focus-top"><span className="brand-small"><Crosshair size={20} />JAX COACH</span>
      <button ref={closeButton} className="icon-button" aria-label="Fechar painel de foco" onClick={() => onClose ? onClose() : void invoke('close_focus').catch(() => setError('Use o X da janela para fechar o painel.'))}><X size={20} /></button>
    </div>
    <span className="pill">Memória histórica · painel estático</span>
    {error && <p role="alert">{error}</p>}
    <p className="eyebrow">SEU FOCO</p><h1>{data?.goal ?? 'Carregando seu foco…'}</h1>
    {data?.live?.connected && <div className="focus-live-context"><span className="focus-live-badge">Partida identificada · consulta única</span><strong>{data.live.champion ?? 'Seu campeão'}{data.live.role ? ` · ${data.live.role}` : ''}{data.live.opponentChampion ? ` × ${data.live.opponentChampion}` : ''}</strong><small>Esse contexto só organiza a ficha. O painel não acompanha a partida nem dita ações.</small></div>}
    {data?.matchups?.length && <section className="focus-matchup" aria-label="Ficha de matchup">
      <label className="focus-matchup-select">Matchup desta partida<select value={selectedOpponent || data.matchups[0].opponent} onChange={event => setSelectedOpponent(event.target.value)}>{data.matchups.map(item => <option key={item.opponent} value={item.opponent}>Jax × {item.opponent}</option>)}</select></label>
      {(() => { const matchup = data.matchups.find(item => item.opponent === selectedOpponent) ?? data.matchups[0]; return <>
        <div className="focus-matchup-heading"><div><p className="eyebrow">FICHA DA MATCHUP</p><h2>Jax <span>×</span> {matchup.opponent}</h2></div><small>{matchup.sampleSize} jogo(s) na amostra</small></div>
        <p className="focus-matchup-overview">{matchup.overview}</p>
        <div className="focus-matchup-columns"><div><strong>Itens para considerar</strong>{matchup.items.map(item => <p key={item}>· {item}</p>)}</div><div><strong>Ações de treino</strong>{matchup.actions.map(action => <p key={action}>· {action}</p>)}</div></div>
        <div className="focus-matchup-avoid"><strong>Evite repetir</strong>{matchup.avoid.map(item => <p key={item}>· {item}</p>)}</div>
        <small className="focus-matchup-source">{matchup.sourceLabel} · a partida só foi consultada uma vez para selecionar esta ficha.</small>
      </> })()}
    </section>}
    {data?.notes.slice(0, 3).map((note, i) => <article key={i}><span>0{i + 1}</span><p>{note}</p></article>)}
    <footer>{data?.demo ? 'Demonstração · anotações simuladas.' : 'Anotações anteriores à abertura deste painel.'}<br />A consulta local é única; a ficha é fixa e não há assistência automática.</footer>
  </main>
}
