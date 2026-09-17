import type { ReactNode } from 'react'
import { ArrowUpRight, Sword } from 'lucide-react'
import type { MatchSummary } from '../domain/types'
export const date = (iso: string) => new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
export const duration = (sec: number) => `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}`
export function Empty({ title, detail, children }: { title: string; detail: string; children?: ReactNode }) {
  return <div className="empty"><Sword size={28} /><h3>{title}</h3><p>{detail}</p>{children}</div>
}
export function Heading({ eyebrow, title, children }: { eyebrow: string; title: string; children?: ReactNode }) {
  return <div className="section-heading"><div><p className="eyebrow">{eyebrow}</p><h2>{title}</h2></div>{children}</div>
}
export function Result({ match }: { match: MatchSummary }) {
  return <span className={`result ${match.result}`}>{match.result === 'win' ? 'Vitória' : match.result === 'loss' ? 'Derrota' : 'Remake'}</span>
}
export function Champion({ name }: { name: string }) { return <div className={`champion ${name === 'Jax' ? 'jax' : ''}`} aria-hidden="true">{name.slice(0, 2).toUpperCase()}</div> }
export function MatchRow({ match, onClick }: { match: MatchSummary; onClick: () => void }) {
  return <button className="match-row" onClick={onClick}><Champion name={match.champion} /><div className="match-name"><strong>{match.champion} <span>vs. {match.opponent}</span></strong><small>{match.role || 'Rota não identificada'} · {date(match.startedAt)} · {duration(match.durationSeconds)}</small></div><span className="row-kda">{match.kda}<small>K / D / A</small></span><Result match={match} /><ArrowUpRight size={16} /></button>
}
