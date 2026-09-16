import type { AppSettings } from '../domain/types'
import { readLogs } from './logger'

export interface Diagnostic { id: string; label: string; status: 'ok' | 'warn' | 'blocked'; detail: string }

export function runDiagnostics(settings: AppSettings): Diagnostic[] {
  const logCount = readLogs().length
  return [
    { id: 'storage', label: 'Armazenamento local', status: 'ok', detail: 'Fixture/localStorage disponível; migração SQLite pronta para o shell Tauri.' },
    { id: 'riot', label: 'Riot API', status: settings.riotApiConfigured ? 'ok' : 'warn', detail: settings.riotApiConfigured ? 'Credencial configurada para sincronização manual.' : 'Sem chave: usando fixtures. Nenhuma chamada é feita.' },
    { id: 'ai', label: 'AIProvider', status: settings.aiConfigured ? 'ok' : 'warn', detail: settings.aiConfigured ? 'Provider externo habilitado apenas para pós-jogo.' : 'Mock local ativo; análise continua disponível.' },
    { id: 'outplayed', label: 'Pasta Outplayed', status: settings.outplayedDirectory ? 'ok' : 'warn', detail: settings.outplayedDirectory ? settings.outplayedDirectory : 'Configure uma pasta para associar gravações.' },
    { id: 'ffmpeg', label: 'FFmpeg', status: 'warn', detail: 'Opcional: será detectado pelo shell e usado apenas para cópias/recortes pós-jogo.' },
    { id: 'safe-mode', label: 'Live safe mode', status: settings.safeMode.enabled ? 'ok' : 'blocked', detail: settings.safeMode.enabled ? 'Somente lembretes históricos pessoais; sem leitura do processo.' : 'Ative para usar a camada de segundo monitor com segurança.' },
    { id: 'logs', label: 'Logs locais', status: 'ok', detail: `${logCount} evento(s) retido(s) localmente para diagnóstico.` }
  ]
}
