import { useState } from 'react'
import { invoke } from '@tauri-apps/api/core'
import { Film, FolderOpen, Scissors, Search } from 'lucide-react'
import type { Library } from '../domain/library'
import type { RecordingCandidate } from '../domain/types'
import { matchRecordings } from '../domain/recordingMatcher'
import { desktop } from '../services/library'
import { duration, Empty, Heading } from './ui'
export function Videos({ data, directory, busy, onScan, onSaveRecording, onClip, folders }: { data: Library; directory: string; busy: boolean; folders: string[]; onScan: (folder: string) => Promise<void>; onSaveRecording: (r: RecordingCandidate) => Promise<void>; onClip: (path: string, start: number) => Promise<void> }) {
  const [folder, setFolder] = useState(directory || folders[0] || '')
  const [matchId, setMatchId] = useState(data.matches[0]?.id ?? '')
  const [path, setPath] = useState('')
  const [eventSeconds, setEventSeconds] = useState(60)
  const match = data.matches.find(m => m.id === matchId)
  const candidates = match ? matchRecordings(match, data.recordings) : []
  const recording = data.recordings.find(r => r.path === path)
  const events = data.facts.filter(f => f.matchId === matchId && f.kind === 'death')
  const eventOffset = match && recording ? (Date.parse(match.startedAt) - Date.parse(recording.startedAt)) / 1000 + eventSeconds : -1
  const offset = recording && eventSeconds >= 0 && eventOffset >= 0 && eventOffset < recording.durationSeconds ? Math.max(0, eventOffset - 15) : -1
  return <div className="page"><Heading eyebrow="DO VÍDEO AO APRENDIZADO" title="Gravações e recortes" /><section className="panel"><label>Pasta Outplayed<div className="input-action"><input value={folder} onChange={e => setFolder(e.target.value)} placeholder="Cole o caminho da pasta de gravações" /><button className="primary" disabled={!desktop() || busy || !folder.trim()} onClick={() => void onScan(folder)}><Search size={16} />{busy ? 'Buscando…' : 'Buscar vídeos'}</button></div></label>{folders.length > 0 && <div className="suggestions">{folders.map(f => <button className="text-link" key={f} onClick={() => setFolder(f)}>{f}</button>)}</div>}<p className="field-help">Até 300 vídeos em subpastas. Arquivos alterados nos últimos 90 segundos são ignorados. FFprobe fornece a duração quando instalado.</p></section>
    {!data.recordings.length ? <Empty title="Seus vídeos entram por aqui" detail="Escolha a pasta para procurar gravações. Os vídeos originais são preservados." /> : <>
    <section className="panel"><Heading eyebrow="ASSOCIAÇÃO COM CONFERÊNCIA" title="Escolher partida e vídeo" /><label>Partida<select value={matchId} onChange={e => { setMatchId(e.target.value); setPath('') }}><option value="">Selecione uma partida</option>{data.matches.map(m => <option key={m.id} value={m.id}>{m.champion} vs. {m.opponent} · {new Date(m.startedAt).toLocaleString('pt-BR')}</option>)}</select></label>
      {candidates.length > 0 && <p className="field-help">Sugestão: {candidates[0].path.split(/[\\/]/).pop()} · {Math.round(candidates[0].confidence * 100)}% de compatibilidade (não é certeza).</p>}
      <label>Gravação<select value={path} onChange={e => setPath(e.target.value)}><option value="">Escolha o arquivo para conferir</option>{data.recordings.map(r => <option value={r.path} key={r.path}>{r.path.split(/[\\/]/).pop()} · {r.durationSeconds ? duration(r.durationSeconds) : 'duração desconhecida'}</option>)}</select></label>
      {recording && <RecordingEditor key={recording.path} recording={recording} onSave={onSaveRecording} busy={busy} />}
      {recording && match && <div className="clip-section"><h3>Preparar um recorte pós-jogo</h3><p>Confirme o início real da gravação acima para alinhar o relógio do jogo ao vídeo.</p>{events.length > 0 && <label>Mortes registradas<select onChange={e => setEventSeconds(Number(e.target.value))} value={eventSeconds}><option value={eventSeconds}>{duration(eventSeconds)} · lance selecionado</option>{events.filter(f => Number(f.payload.timestampMs) / 1000 !== eventSeconds).map(f => <option key={f.id} value={Number(f.payload.timestampMs) / 1000}>{f.occurredAt} · morte</option>)}</select></label>}<label>Tempo do evento no jogo (segundos)<input type="number" min={0} max={match.durationSeconds} value={eventSeconds} onChange={e => setEventSeconds(Number(e.target.value))} /></label><p className="field-help">Recorte de até 45 segundos, começando 15 segundos antes do evento.</p><button className="primary" disabled={busy || recording.timeSource !== 'manual' || !Number.isFinite(offset) || offset < 0 || offset >= recording.durationSeconds || eventSeconds > match.durationSeconds} onClick={() => void onClip(path, offset)}><Scissors size={16} />Gerar recorte</button></div>}
    </section><div className="panel"><Heading eyebrow="BIBLIOTECA LOCAL" title={`${data.recordings.length} gravações encontradas`} /><div className="video-list">{data.recordings.slice(0, 15).map(r => <div key={r.path}><Film size={20} /><span>{r.path.split(/[\\/]/).pop()}<small>{r.reason}</small></span></div>)}</div></div></>}
    <button className="secondary" disabled={!desktop()} onClick={() => void invoke('show_clips').catch(() => {})}><FolderOpen size={16} />Abrir pasta dos recortes</button>
  </div>
}
function RecordingEditor({ recording, busy, onSave }: { recording: RecordingCandidate; busy: boolean; onSave: (r: RecordingCandidate) => Promise<void> }) {
  const d = new Date(recording.startedAt)
  const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 19)
  const [start, setStart] = useState(local)
  return <div className="recording-editor"><span className="pill">{recording.timeSource === 'manual' ? 'Horário confirmado por você' : 'Horário estimado · conferir'}</span><p>{recording.reason}</p><label>Início da gravação no seu horário local<input type="datetime-local" step="1" value={start} onChange={e => setStart(e.target.value)} /></label><button className="secondary" disabled={busy || !Number.isFinite(Date.parse(start))} onClick={() => void onSave({ ...recording, startedAt: new Date(start).toISOString(), timeSource: 'manual', reason: 'Início conferido manualmente pelo usuário.' })}>Confirmar horário do vídeo</button></div>
}
