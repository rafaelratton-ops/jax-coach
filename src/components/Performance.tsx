import { CheckCircle2, Target, TrendingUp } from 'lucide-react'
import type { Library } from '../domain/library'
import { goalDefinition, goalDefinitions, jaxPerformance, performanceBeforeBlock, trainingBlockProgress, type GoalId } from '../domain/performance'
import { Empty, Heading } from './ui'

export function Performance({ data, demo, busy, onStartBlock, onClearBlock }: { data: Library; demo: boolean; busy: boolean; onStartBlock: (goalId: GoalId) => Promise<void>; onClearBlock: () => Promise<void> }) {
  const metrics = jaxPerformance(data)
  const block = data.activeBlock
  const progress = trainingBlockProgress(data, block)
  const activeGoal = goalDefinition(block?.goalId)
  const blockMetrics = progress.games.length ? jaxPerformance({ ...data, matches: progress.games }) : undefined
  const baseline = performanceBeforeBlock(data, block)
  return <div className="page"><Heading eyebrow="MELHORIA CONTÍNUA" title="Performance de Jax"><span className="pill">{demo ? 'Amostra demonstrativa' : 'Sua amostra pessoal'}</span></Heading>
    <section className="panel performance-intro"><div className="icon-box"><TrendingUp size={22} /></div><div><h2>Medir para subir</h2><p>Vitória é o resultado. Estas medidas mostram quais decisões você consegue repetir e melhorar, mesmo quando a partida é perdida.</p></div></section>
    {!metrics.games ? <Empty title="Ainda não há partidas de Jax top" detail="Importe suas partidas em Configurações para começar a acompanhar sua evolução." /> : <>
      <div className="stat-grid performance-stats">
        <div className="stat"><span>Partidas Jax/top</span><strong>{metrics.games}</strong><small>{metrics.analyzedGames} revisada(s)</small></div>
        <div className="stat"><span>Vitórias</span><strong>{metrics.winRate === null ? '—' : `${metrics.winRate}%`}</strong><small>{metrics.wins} de {metrics.games} partidas</small></div>
        <div className="stat"><span>CS aos 10 min</span><strong>{metrics.csAt10 ?? '—'}</strong><small>{metrics.csAt10Sample ? `${metrics.csAt10Sample} medição(ões)` : 'Analise uma Timeline'}</small></div>
        <div className="stat"><span>Mortes antes de 10</span><strong>{metrics.averageEarlyDeaths ?? '—'}</strong><small>{metrics.earlyDeathSample ? `${metrics.earlyDeathGames} partida(s) com morte cedo` : 'Analise uma Timeline'}</small></div>
      </div>
      <section className="panel"><Heading eyebrow="BLOCO DE TREINO" title="Uma mudança por vez"><span className="pill">10 partidas</span></Heading>
        {!block ? <><p>Escolha um objetivo para as próximas 10 partidas. O app vai contar seus jogos, guardar seu check-in pós-partida e comparar o resultado com seu próprio histórico.</p><div className="goal-options">{goalDefinitions.map(goal => <article key={goal.id} className="goal-option"><Target size={18} /><h3>{goal.title}</h3><p>{goal.description}</p><small>{goal.target}</small><button className="secondary" disabled={busy} onClick={() => void onStartBlock(goal.id)}>Começar este bloco</button></article>)}</div></> : <div className="active-block"><div className="active-block-heading"><div><p className="eyebrow">OBJETIVO ATUAL</p><h2>{activeGoal.title}</h2></div><button className="text-link" disabled={busy} onClick={() => void onClearBlock()}>Encerrar bloco</button></div><p>{activeGoal.description} <strong>{activeGoal.target}</strong></p><div className="progress-label"><span>{progress.games.length} de {progress.targetGames} partidas</span><span>{progress.checkedIn} check-in(s)</span></div><div className="progress-track"><span style={{ width: `${Math.min(100, 100 * progress.games.length / progress.targetGames)}%` }} /></div>{progress.games.length > 0 && <div className="block-compare"><strong>Comparação com antes do bloco</strong><span>CS aos 10: {baseline.csAt10 ?? '—'} → {blockMetrics?.csAt10 ?? '—'}</span><span>Mortes antes de 10: {baseline.averageEarlyDeaths ?? '—'} → {blockMetrics?.averageEarlyDeaths ?? '—'}</span><span>Vitórias: {baseline.winRate === null ? '—' : `${baseline.winRate}%`} → {blockMetrics?.winRate === null || blockMetrics?.winRate === undefined ? '—' : `${blockMetrics.winRate}%`}</span></div>}{progress.complete && <p className="success-line"><CheckCircle2 size={15} /> Bloco concluído. Revise as partidas e comece outro objetivo.</p>}{!progress.games.length && <p className="muted">A próxima partida de Jax/top entra neste bloco.</p>}{progress.games.length > 0 && <div className="block-games">{progress.games.map(match => <div key={match.id}><span className={`result ${match.result}`}>{match.result === 'win' ? 'Vitória' : 'Derrota'}</span><strong>vs. {match.opponent}</strong><small>{new Date(match.startedAt).toLocaleDateString('pt-BR')} · {block.checkIns?.[match.id] ? `check-in: ${block.checkIns[match.id].result === 'yes' ? 'sim' : block.checkIns[match.id].result === 'partial' ? 'parcial' : 'não'}` : 'aguardando revisão'}</small></div>)}</div>}</div>}
      </section>
    </>}
  </div>
}
