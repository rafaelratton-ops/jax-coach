import { useState } from 'react'
import type { Library } from '../domain/library'
import { desktop, downloadJson } from '../services/library'
import { readLogs } from '../services/logger'
import { readLiveDiagnostics, type LiveDiagnostics } from '../services/liveClient'
import { Heading } from './ui'
export interface Environment { sqlite: boolean; riotSession: boolean; ffmpeg: boolean; ffprobe: boolean; folders: string[] }
export function Diagnostics({ data, environment, refresh }: { data: Library; environment?: Environment; refresh: () => void }) {
  const [live, setLive] = useState<LiveDiagnostics>()
  const [liveBusy, setLiveBusy] = useState(false)
  const [liveError, setLiveError] = useState('')
  async function inspectLive() {
    if (liveBusy) return
    setLiveBusy(true); setLiveError('')
    try { setLive(await readLiveDiagnostics()) } catch (reason) { setLiveError(reason instanceof Error ? reason.message : String(reason)) } finally { setLiveBusy(false) }
  }
  return <div className="page"><Heading eyebrow="TUDO ÀS CLARAS" title="Estado do aplicativo"><button className="secondary" onClick={refresh}>Verificar agora</button></Heading><div className="panel checks">{[
    ['Armazenamento', desktop() ? environment?.sqlite ? 'SQLite disponível' : 'Verificando SQLite' : 'Armazenamento do navegador'],
    ['Riot', environment?.riotSession ? 'Chave disponível nesta sessão' : 'Conecte em Configurações para novas consultas'],
    ['Histórico pessoal', `${data.matches.length} partidas · ${Object.keys(data.analyses).length} revisões salvas`],
    ['FFmpeg', environment?.ffmpeg ? 'Disponível para recortes' : 'Não detectado · recortes indisponíveis'],
    ['FFprobe', environment?.ffprobe ? 'Disponível para medir vídeos' : 'Não detectado · duração indisponível'],
    ['Análise', 'Regras locais v2 · sem IA externa nesta versão'],
  ].map(([label, detail]) => <div key={label}><strong>{label}</strong><span>{detail}</span></div>)}</div>
    <section className="panel"><Heading eyebrow="LEAGUE CLIENT" title="Dados locais da partida" /><p>Consulta manual para conferir os dados que o League Client oferece. Nada é monitorado em segundo plano e este conteúdo não alimenta recomendações durante a partida.</p><div className="form-actions"><button className="secondary" disabled={liveBusy} onClick={() => void inspectLive()}>{liveBusy ? 'Consultando…' : 'Consultar dados locais agora'}</button>{live && <button className="secondary" onClick={() => downloadJson('jax-coach-dados-locais.json', live)}>Exportar consulta</button>}</div>{liveError && <p className="field-help" role="alert">{liveError}</p>}{live && <div className="live-result"><strong>{live.connected ? `Consulta concluída · ${Object.keys(live.endpoints).length} endpoint(s)` : 'League Client não respondeu'}</strong><small>{new Date(live.capturedAt).toLocaleString('pt-BR')}</small>{live.warnings.length > 0 && <p className="field-help">Alguns itens não responderam: {live.warnings.join(' ')}</p>}<details><summary>Ver dados completos da consulta</summary><pre className="live-json">{JSON.stringify(live.endpoints, null, 2)}</pre></details></div>}</section>
    <section className="panel"><Heading eyebrow="SUPORTE" title="Registro de atividades" /><button className="secondary" onClick={() => downloadJson('jax-coach-diagnostico.json', { version: '0.6.0', environment, logs: readLogs() })}>Exportar diagnóstico</button><div className="log-list">{readLogs().slice(-12).reverse().map((entry, i) => <p key={i}><time>{new Date(entry.at).toLocaleTimeString('pt-BR')}</time> {entry.event}</p>)}</div></section>
    <p className="legal">Jax Coach is not endorsed by Riot Games and does not reflect the views or opinions of Riot Games or anyone officially involved in producing or managing Riot Games properties. Riot Games and all associated properties are trademarks or registered trademarks of Riot Games, Inc.</p>
  </div>
}
