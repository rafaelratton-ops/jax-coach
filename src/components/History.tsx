import { useState } from 'react'
import { BookOpen, Check, Search, Sparkles } from 'lucide-react'
import type { Library } from '../domain/library'
import type { MatchSummary } from '../domain/types'
import { Champion, duration, Empty, Heading, Result } from './ui'
export function History({ data, initialId, busy, onAnalyze, onNote }: { data: Library; initialId?: string; busy: boolean; onAnalyze: (m: MatchSummary) => void; onNote: (id: string, text: string) => Promise<void> }) {
  const [selectedId, setSelectedId] = useState(initialId ?? data.matches[0]?.id)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')
  const matches = data.matches.filter(m => `${m.champion} ${m.opponent} ${m.id}`.toLowerCase().includes(search.toLowerCase()) && (filter === 'all' || filter === 'jax' && m.champion === 'Jax' && m.role === 'TOP' || m.result === filter))
  const selected = matches.find(m => m.id === selectedId) ?? matches[0]
  return <div className="page"><Heading eyebrow="DO RESULTADO AO APRENDIZADO" title="Histórico de partidas"><span className="pill">{data.matches.length} importadas</span></Heading>
    <div className="toolbar"><label className="search"><Search size={17} /><input aria-label="Buscar partida" placeholder="Buscar campeão, adversário ou partida…" value={search} onChange={e => setSearch(e.target.value)} /></label><select aria-label="Filtrar partidas" value={filter} onChange={e => setFilter(e.target.value)}><option value="all">Todas as partidas</option><option value="jax">Jax · top lane</option><option value="win">Vitórias</option><option value="loss">Derrotas</option></select></div>
    {!selected ? <Empty title="Nenhuma partida encontrada" detail="Ajuste a busca ou importe partidas em Configurações." /> :
    <div className="history-layout"><div className="history-list">{matches.map(match => <button key={match.id} className={`history-row ${match.id === selected.id ? 'selected' : ''}`} onClick={() => setSelectedId(match.id)}><Champion name={match.champion} /><div><strong>{match.champion}<small>vs. {match.opponent}</small></strong><span>{duration(match.durationSeconds)} · {match.role || 'Sem rota'}</span></div><Result match={match} /></button>)}</div>
    <Review key={selected.id} data={data} match={selected} busy={busy} onAnalyze={onAnalyze} onNote={onNote} /></div>}
  </div>
}
function Review({ data, match, busy, onAnalyze, onNote }: { data: Library; match: MatchSummary; busy: boolean; onAnalyze: (m: MatchSummary) => void; onNote: (id: string, text: string) => Promise<void> }) {
  const [note, setNote] = useState(data.notes[match.id] ?? '')
  const [saved, setSaved] = useState(false)
  const [eventFilter, setEventFilter] = useState('important')
  const review = data.analyses[match.id]
  const facts = (review?.timeline ?? []).filter(f => eventFilter === 'all' || f.kind !== 'item')
  return <section className="panel review"><div className="review-heading"><div><p className="eyebrow">{match.queue} · {match.role || 'Rota não identificada'}</p><h2>{match.champion} <span>vs.</span> {match.opponent}</h2><small>{new Date(match.startedAt).toLocaleString('pt-BR')} · {match.id}</small></div><Result match={match} /></div>
    <div className="review-stats"><div><small>K / D / A</small><strong>{match.kda}</strong></div><div><small>Tropas por minuto</small><strong>{match.durationSeconds ? (match.cs / (match.durationSeconds / 60)).toFixed(1) : '—'}</strong></div><div><small>Duração</small><strong>{duration(match.durationSeconds)}</strong></div></div>
    <button className="primary" disabled={busy} onClick={() => onAnalyze(match)}><Sparkles size={16} />{busy ? 'Preparando revisão…' : review ? 'Atualizar revisão' : 'Analisar esta partida'}</button>
    <div className="review-section"><Heading eyebrow="FATOS OBSERVADOS" title="Linha do tempo" /><p className="muted">{review ? review.summary : 'Clique em analisar para buscar os eventos desta partida encerrada.'}</p>{review && <select aria-label="Eventos da Timeline" value={eventFilter} onChange={e => setEventFilter(e.target.value)}><option value="important">Eventos principais</option><option value="all">Todos, incluindo compras</option></select>}<div className="events">{facts.map(f => <div className={`event ${f.kind}`} key={f.id}><time>{f.occurredAt}</time><span className="event-dot" /><p>{f.summary}<small>{f.source === 'fixture' ? 'Exemplo simulado' : 'Riot Match Timeline'}</small></p></div>)}</div></div>
    {review && <div className="review-section"><Heading eyebrow="HIPÓTESES PARA REVISAR" title="Onde olhar de novo" />{review.heuristics.length ? review.heuristics.map(h => <article className="insight" key={h.id}><BookOpen size={18} /><div><strong>{h.title}</strong><p>{h.statement}</p><small>Evidência: {h.evidence.map(id => review.timeline.find(f => f.id === id)?.occurredAt).filter(Boolean).join(' · ')}</small></div></article>) : <p className="muted">Nenhum alerta pelas regras atuais. Isso não significa uma partida sem erros.</p>}</div>}
    <div className="review-section"><Heading eyebrow="SUA LEITURA DO JOGO" title="O que quero lembrar" /><textarea aria-label="Anotação da partida" value={note} onChange={e => { setNote(e.target.value); setSaved(false) }} placeholder="O que você percebeu no vídeo? Escreva um aprendizado para o próximo review." maxLength={1500} /><button className="secondary" disabled={busy || note === (data.notes[match.id] ?? '')} onClick={async () => { try { await onNote(match.id, note); setSaved(true) } catch { setSaved(false) } }}><Check size={16} />{saved ? 'Anotação salva' : 'Salvar anotação'}</button></div>
  </section>
}
