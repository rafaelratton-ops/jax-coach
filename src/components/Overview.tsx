import { ArrowRight, BookOpen, Crosshair, Monitor, Swords, TrendingUp } from 'lucide-react'
import type { Library } from '../domain/library'
import { historicalPatterns, stats } from '../domain/library'
import type { MatchSummary } from '../domain/types'
import { Empty, Heading, MatchRow } from './ui'

export function Overview({ data, jaxOnly, demo, onMatch, onSettings, onFocus }: { data: Library; jaxOnly?: boolean; demo: boolean; onMatch: (m: MatchSummary) => void; onSettings: () => void; onFocus: () => void }) {
  const matches = jaxOnly ? data.matches.filter(m => m.champion === 'Jax' && m.role === 'TOP') : data.matches
  const summary = stats(matches)
  const reviewCount = matches.filter(m => data.analyses[m.id]).length
  const patterns = historicalPatterns(data)
  const matchupNames = [...new Set(matches.map(m => m.opponent))]
  return <div className="page">
    <div className="hero"><div><p className="eyebrow">UM JOGO. UM APRENDIZADO.</p><h1>{jaxOnly ? <>Seu Jax,<br /><em>em evolução.</em></> : <>O próximo passo<br />começa no <em>último jogo.</em></>}</h1><p>Revise o que aconteceu. Guarde o que aprendeu.<br />Entre na próxima partida com um foco claro.</p><button className="primary" onClick={() => matches[0] ? onMatch(matches[0]) : onSettings()}>{matches[0] ? 'Revisar última partida' : 'Conectar minha conta'}<ArrowRight size={17} /></button></div><div className="hero-symbol" aria-hidden="true"><div className="orbit" /><Crosshair size={115} strokeWidth={.8} /><Swords size={45} /><span>JAX / TOP</span></div></div>
    <div className="stat-grid">{[
      ['Partidas na amostra', String(summary.count), 'Remakes não entram nas médias'],
      ['Taxa de vitória', summary.winRate === null ? '—' : `${summary.winRate}%`, `${summary.wins} vitória(s) na amostra`],
      ['Tropas por minuto', summary.csPerMin?.toFixed(1) ?? '—', 'Média ponderada pela duração'],
      ['Partidas revisadas', String(reviewCount), 'Revisões disponíveis offline'],
    ].map(([label, value, hint]) => <div className="stat" key={label}><span>{label}</span><strong>{value}</strong><small>{hint}</small></div>)}</div>
    <div className="two-column"><section className="panel"><Heading eyebrow="REVISÃO PÓS-PARTIDA" title={jaxOnly ? 'Seu histórico de Jax' : 'Últimas partidas'} /><div>{matches.slice(0, 5).map(match => <MatchRow key={match.id} match={match} onClick={() => onMatch(match)} />)}{!matches.length && <Empty title="Seu histórico começa aqui" detail={jaxOnly ? 'Nenhuma partida de Jax top nesta amostra. Importe mais jogos em Configurações.' : 'Conecte sua conta Riot para importar suas partidas encerradas.'}><button className="secondary" onClick={onSettings}>Abrir configurações</button></Empty>}</div></section>
    <aside className="panel focus-card"><div className="icon-box"><Monitor size={22} /></div><p className="eyebrow">PARA O SEGUNDO MONITOR</p><h2>Um foco de cada vez.</h2><p>{data.goal}</p><div className="hint"><BookOpen size={16} /><span>Seu objetivo histórico fica fixo. O acompanhamento seguro é opcional e mostra apenas fatos resumidos da API local.</span></div><button className="secondary" onClick={onFocus}>Abrir painel de foco <ArrowRight size={16} /></button></aside></div>
    {jaxOnly ? <section className="panel"><Heading eyebrow="RECORTE DA SUA AMOSTRA" title="Matchups de Jax" /><div className="matchup-grid">{matchupNames.map(name => { const s = stats(matches.filter(m => m.opponent === name)); return <div className="matchup" key={name}><strong>{name}</strong><span>{s.winRate ?? '—'}% vitórias</span><small>{s.count} partida(s) · amostra pessoal</small></div> })}</div>{!matchupNames.length && <p className="muted">Seus matchups aparecerão após a importação.</p>}</section>
    : <div className="bottom-note"><TrendingUp size={19} /><div><strong>{patterns.length ? `${patterns.length} padrão(ões) para acompanhar` : 'Padrões precisam de repetição'}</strong><p>{patterns.length ? 'Confira as partidas que sustentam cada observação em Padrões pessoais.' : 'Depois de revisar pelo menos 3 partidas de Jax top, observações recorrentes podem aparecer aqui.'}</p></div><span className="pill">{demo ? 'Amostra demonstrativa' : 'Seu histórico'}</span></div>}
  </div>
}
