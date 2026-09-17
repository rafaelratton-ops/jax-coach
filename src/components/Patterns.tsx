import { useState } from 'react'
import { ArrowUpRight, BookOpen } from 'lucide-react'
import { historicalPatterns, type Library } from '../domain/library'
import type { MatchSummary } from '../domain/types'
import { Empty, Heading } from './ui'
export function Patterns({ data, busy, onGoal, onMatch }: { data: Library; busy: boolean; onGoal: (goal: string) => Promise<void>; onMatch: (m: MatchSummary) => void }) {
  const [goal, setGoal] = useState(data.goal)
  const patterns = historicalPatterns(data)
  return <div className="page"><Heading eyebrow="MEMÓRIA PESSOAL" title="O aprendizado que fica" /><section className="panel goal-editor"><div className="icon-box"><BookOpen size={22} /></div><h2>Seu foco de treino</h2><p>Esse texto aparece no painel do segundo monitor.</p><label>Meu objetivo<textarea maxLength={300} value={goal} onChange={e => setGoal(e.target.value)} /></label><button className="primary" disabled={busy || !goal.trim() || goal === data.goal} onClick={() => void onGoal(goal)}>Salvar objetivo</button></section>
    <Heading eyebrow="RECORRÊNCIAS EM JAX TOP" title="Padrões com evidência" /><p className="muted">Pelo menos 3 partidas revisadas e 2 ocorrências. Frequência na amostra não é certeza sobre a causa.</p>
    {!patterns.length ? <Empty title="Ainda formando sua memória" detail="Analise mais partidas de Jax top. Seus próprios comentários já podem ser usados no painel de foco." /> : <div className="patterns-grid">{patterns.map(pattern => <article className="panel" key={pattern.key}><span className="pill">{pattern.matches.length} de {pattern.total} jogos revisados</span><h2>{pattern.title}</h2><p>{pattern.copy}</p><div className="evidence">{pattern.matches.map(match => <button className="text-link" key={match.id} onClick={() => onMatch(match)}>Jax vs. {match.opponent}<ArrowUpRight size={15} /></button>)}</div></article>)}</div>}
    <Heading eyebrow="ESCRITO POR VOCÊ" title="Anotações de review" /><div className="notes-grid">{Object.entries(data.notes).filter(([, note]) => note.trim()).map(([id, note]) => { const match = data.matches.find(m => m.id === id); return <article className="panel" key={id}><small>{match?.champion} vs. {match?.opponent}</small><p>{note}</p>{match && <button className="text-link" onClick={() => onMatch(match)}>Abrir partida <ArrowUpRight size={14} /></button>}</article> })}</div>
  </div>
}
