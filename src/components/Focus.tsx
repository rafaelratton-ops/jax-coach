import { useEffect, useRef, useState } from 'react'
import { invoke } from '@tauri-apps/api/core'
import { Crosshair, X } from 'lucide-react'
import { desktop } from '../services/library'
export interface FocusSnapshot { goal: string; notes: string[]; demo: boolean }
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
    {data?.notes.slice(0, 3).map((note, i) => <article key={i}><span>0{i + 1}</span><p>{note}</p></article>)}
    <footer>{data?.demo ? 'Demonstração · anotações simuladas.' : 'Anotações anteriores à abertura deste painel.'}<br />Nenhuma leitura da partida atual.</footer>
  </main>
}
