import { useState } from 'react'
import { Activity, Download, FolderSearch, Link2 } from 'lucide-react'
import type { AppSettings } from '../domain/types'
import type { Library } from '../domain/library'
import { downloadJson, desktop } from '../services/library'
import { Heading } from './ui'

export function Settings({ settings, data, busy, onSave, onSync }: { settings: AppSettings; data: Library; busy: boolean; onSave: (value: AppSettings) => void; onSync: (name: string, tag: string, key: string, count: number) => Promise<void> }) {
  const [draft, setDraft] = useState(settings)
  const [key, setKey] = useState('')
  const [count, setCount] = useState(10)
  const [saved, setSaved] = useState(false)
  return <div className="page settings-page"><Heading eyebrow="SEU COACH, DO SEU JEITO" title="Configurações" />
    <section className="panel"><div className="section-icon"><Link2 size={22} /><div><h2>Conectar à Riot</h2><p>Busque suas partidas encerradas no servidor das Américas.</p></div></div>
      <form onSubmit={async e => { e.preventDefault(); try { await onSync(draft.riotGameName, draft.riotTagLine, key, count); setKey('') } catch { /* App renders error */ } }}>
        <div className="form-grid"><label>Nome do jogador<input autoComplete="off" required value={draft.riotGameName} onChange={e => setDraft({ ...draft, riotGameName: e.target.value })} /></label><label>Tag<input autoComplete="off" required value={draft.riotTagLine} onChange={e => setDraft({ ...draft, riotTagLine: e.target.value.replace(/^#/, '') })} /></label></div>
        <label>Chave Riot<input type="password" autoComplete="off" spellCheck={false} value={key} onChange={e => setKey(e.target.value)} required placeholder="Cole sua chave aqui" /></label>
        <div className="form-actions"><label className="count-label">Quantidade<select value={count} onChange={e => setCount(Number(e.target.value))}><option value={5}>5 partidas</option><option value={10}>10 partidas</option><option value={20}>20 partidas</option></select></label><button className="primary" disabled={busy || !desktop()}><Activity size={16} />{busy ? 'Importando…' : 'Sincronizar minhas partidas'}</button></div>
        <p className="field-help">{desktop() ? 'A chave fica disponível até fechar o aplicativo. Chaves de desenvolvimento da Riot costumam expirar em 24 horas; gere outra no portal quando isso acontecer. Histórico e revisões ficam salvos neste computador.' : 'Na prévia do navegador, você pode explorar a demonstração. A conexão Riot funciona no aplicativo Windows.'}</p>
      </form>
      {data.syncedAt && <div className="success-line">Última importação: {new Date(data.syncedAt).toLocaleString('pt-BR')} · {data.matches.length} partidas salvas</div>}
    </section>
    <section className="panel"><div className="section-icon"><FolderSearch size={22} /><div><h2>Outplayed</h2><p>Use a pasta informada nas configurações de armazenamento do Outplayed.</p></div></div><label>Pasta das gravações<input value={draft.outplayedDirectory} onChange={e => { setDraft({ ...draft, outplayedDirectory: e.target.value }); setSaved(false) }} placeholder="C:\Users\SeuNome\Videos\Outplayed" /></label><button className="secondary" disabled={busy} onClick={() => { onSave(draft); setSaved(true) }}>{saved ? 'Preferências salvas' : 'Salvar preferências'}</button><p className="field-help">A aba Vídeos detecta pastas comuns e procura gravações já finalizadas.</p></section>
    <section className="panel"><div className="section-icon"><Download size={22} /><div><h2>Cópia do seu histórico</h2><p>Exporte partidas, revisões, anotações e caminhos dos vídeos em um arquivo.</p></div></div><button className="secondary" disabled={busy || !data.matches.length} onClick={() => downloadJson('jax-coach-historico.json', data)}>Exportar histórico local</button><p className="field-help">Esse arquivo contém seus dados pessoais de treino, sem a chave da Riot.</p></section>
  </div>
}
