import type { Library } from '../domain/library'
import { desktop, downloadJson } from '../services/library'
import { readLogs } from '../services/logger'
import { Heading } from './ui'
export interface Environment { sqlite: boolean; riotSession: boolean; ffmpeg: boolean; ffprobe: boolean; folders: string[] }
export function Diagnostics({ data, environment, refresh }: { data: Library; environment?: Environment; refresh: () => void }) {
  return <div className="page"><Heading eyebrow="TUDO ÀS CLARAS" title="Estado do aplicativo"><button className="secondary" onClick={refresh}>Verificar agora</button></Heading><div className="panel checks">{[
    ['Armazenamento', desktop() ? environment?.sqlite ? 'SQLite disponível' : 'Verificando SQLite' : 'Armazenamento do navegador'],
    ['Riot', environment?.riotSession ? 'Chave disponível nesta sessão' : 'Conecte em Configurações para novas consultas'],
    ['Histórico pessoal', `${data.matches.length} partidas · ${Object.keys(data.analyses).length} revisões salvas`],
    ['FFmpeg', environment?.ffmpeg ? 'Disponível para recortes' : 'Não detectado · recortes indisponíveis'],
    ['FFprobe', environment?.ffprobe ? 'Disponível para medir vídeos' : 'Não detectado · duração indisponível'],
    ['Análise', 'Regras locais v2 · sem IA externa nesta versão'],
  ].map(([label, detail]) => <div key={label}><strong>{label}</strong><span>{detail}</span></div>)}</div>
    <section className="panel"><Heading eyebrow="SUPORTE" title="Registro de atividades" /><button className="secondary" onClick={() => downloadJson('jax-coach-diagnostico.json', { version: '0.3.0', environment, logs: readLogs() })}>Exportar diagnóstico</button><div className="log-list">{readLogs().slice(-12).reverse().map((entry, i) => <p key={i}><time>{new Date(entry.at).toLocaleTimeString('pt-BR')}</time> {entry.event}</p>)}</div></section>
    <p className="legal">Jax Coach is not endorsed by Riot Games and does not reflect the views or opinions of Riot Games or anyone officially involved in producing or managing Riot Games properties. Riot Games and all associated properties are trademarks or registered trademarks of Riot Games, Inc.</p>
  </div>
}
