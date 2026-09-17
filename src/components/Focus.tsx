import { useEffect, useRef, useState } from 'react'
import { invoke } from '@tauri-apps/api/core'
import { Crosshair, X } from 'lucide-react'
import { desktop } from '../services/library'
import type { MatchupPlan } from '../domain/matchup'
export interface FocusSnapshot { goal: string; notes: string[]; demo: boolean; matchup?: MatchupPlan }
export function Focus({ snapshot, onClose }: { snapshot?: FocusSnapshot; onClose?: () => void }) {
  const [data, setData] = useState(snapshot)
  const [error, setError] = useState('')
  const closeButton = useRef<HTMLButtonElement>(null)
  useEffect(() => {
    closeButton.current?.focus()
    if (!snapshot && desktop()) void invoke<FocusSnapshot>('focus_snapshot').then(setData).catch(() => setError('Não foi possível carregar seus lembretes. Feche e abra o painel novamente.'))
  }, [snapshot])
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
    {data?.matchup && <section className="focus-matchup" aria-label={`Ficha da matchup Jax contra ${data.matchup.opponent}`}>
      <div className="focus-matchup-heading"><div><p className="eyebrow">FICHA DA MATCHUP</p><h2>Jax <span>×</span> {data.matchup.opponent}</h2></div><small>{data.matchup.sampleSize} jogo(s) na amostra</small></div>
      <p className="focus-matchup-overview">{data.matchup.overview}</p>
      <div className="focus-matchup-columns"><div><strong>Itens para considerar</strong>{data.matchup.items.map(item => <p key={item}>· {item}</p>)}</div><div><strong>Ações de treino</strong>{data.matchup.actions.map(action => <p key={action}>· {action}</p>)}</div></div>
      <div className="focus-matchup-avoid"><strong>Evite repetir</strong>{data.matchup.avoid.map(item => <p key={item}>· {item}</p>)}</div>
      <small className="focus-matchup-source">{data.matchup.sourceLabel}</small>
    </section>}
    {data?.notes.slice(0, 3).map((note, i) => <article key={i}><span>0{i + 1}</span><p>{note}</p></article>)}
    <footer>{data?.demo ? 'Demonstração · anotações simuladas.' : 'Anotações anteriores à abertura deste painel.'}<br />A ficha é fixa; nenhuma leitura da partida atual.</footer>
  </main>
}
