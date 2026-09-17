import { useState } from 'react'
import { Brain, Check, Shield, Sparkles } from 'lucide-react'
import type { Library } from '../domain/library'
import type { PreGameAdvice } from '../domain/advisor'
import { getAIProvider } from '../providers'
import { Heading } from './ui'

const parseChampions = (text: string) => text.split(/[,\n]/).map(item => item.trim()).filter(Boolean).slice(0, 5)

export function Advisor({ data, demo }: { data: Library; demo: boolean }) {
  const [laneOpponent, setLaneOpponent] = useState('Camille')
  const [enemyTeam, setEnemyTeam] = useState('Camille, Sejuani, Orianna, Jhin, Nautilus')
  const [allyTeam, setAllyTeam] = useState('Jax, Lee Sin, Ahri, Kai\'Sa, Leona')
  const [advice, setAdvice] = useState<PreGameAdvice>()
  const [selected, setSelected] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  async function analyze() {
    if (!laneOpponent.trim() || busy) return
    setBusy(true); setError('')
    try {
      const result = await getAIProvider().recommendPreGame({ laneOpponent, enemyTeam: parseChampions(enemyTeam), allyTeam: parseChampions(allyTeam), library: data })
      setAdvice(result); setSelected('')
    } catch (reason) { setError(reason instanceof Error ? reason.message : String(reason)) } finally { setBusy(false) }
  }
  return <div className="page"><Heading eyebrow="ANTES DA PARTIDA" title="Assessor de matchup"><span className="pill">{demo ? 'Exemplo local' : 'IA local transparente'}</span></Heading>
    <section className="panel advisor-intro"><div className="icon-box"><Brain size={22} /></div><div><h2>Escolha seu plano antes de jogar</h2><p>Informe a rota e, se quiser, os outros campeões. O assessor cria alternativas de runas e itens com o motivo de cada uma. Você escolhe o plano; ele não manda em você durante a partida.</p></div></section>
    <section className="panel advisor-form"><Heading eyebrow="COMPOSIÇÃO VISÍVEL" title="Quem está no jogo?" /><div className="form-grid"><label>Adversário da rota<input value={laneOpponent} onChange={event => setLaneOpponent(event.target.value)} placeholder="Ex.: Camille ou Teemo" /></label><label>Seu time (opcional)<input value={allyTeam} onChange={event => setAllyTeam(event.target.value)} placeholder="Jax, Lee Sin, Ahri…" /></label></div><label>Time adversário (opcional)<textarea value={enemyTeam} onChange={event => setEnemyTeam(event.target.value)} placeholder="Camille, Sejuani, Orianna, Jhin, Nautilus" maxLength={250} /></label><div className="form-actions"><button className="primary" disabled={busy || !laneOpponent.trim()} onClick={() => void analyze()}><Sparkles size={16} />{busy ? 'Analisando composição…' : 'Gerar opções'}</button><small>Use nomes separados por vírgula. A análise acontece neste computador.</small></div>{error && <p className="field-help" role="alert">{error}</p>}</section>
    {advice && <section className="panel advisor-result"><Heading eyebrow="LEITURA DO ASSESSOR" title={`Jax × ${advice.laneOpponent}`}><span className="pill">{advice.enemyTeam.length} inimigo(s) informado(s)</span></Heading><div className="advisor-summary"><p><strong>Composição:</strong> {advice.compositionSummary}</p><p><strong>Seu histórico:</strong> {advice.personalEvidence}</p></div><div className="advisor-options">{advice.options.map(option => <article className={`advisor-option ${selected === option.id ? 'selected' : ''}`} key={option.id}><div className="advisor-option-heading"><div><span className="option-number">{advice.options.indexOf(option) + 1}</span><h3>{option.title}</h3></div><button className="secondary" onClick={() => setSelected(option.id)}>{selected === option.id ? <><Check size={14} /> Plano escolhido</> : 'Escolher plano'}</button></div><div className="advisor-columns"><div><strong>Runas</strong>{option.runes.map(rune => <p key={rune}>· {rune}</p>)}</div><div><strong>Itens</strong>{option.items.map(item => <p key={item}>· {item}</p>)}</div></div><p className="advisor-reason"><Shield size={14} /> <strong>Por quê:</strong> {option.reason}</p><small><strong>Quando considerar:</strong> {option.when}</small><small className="advisor-caution">Cuidado: {option.caution}</small></article>)}</div><p className="field-help"><strong>Fonte:</strong> {advice.dataNote}</p></section>}
  </div>
}
