import { invoke } from '@tauri-apps/api/core'
import { emptyLibrary, type Library } from '../domain/library'

export const desktop = () => '__TAURI_INTERNALS__' in window
const cacheKey = 'jax-coach.library.v2'

export async function loadLibrary(): Promise<Library> {
  const raw = desktop() ? await invoke<string | null>('load_library') : localStorage.getItem(cacheKey)
  if (!raw) return emptyLibrary()
  const parsed = JSON.parse(raw) as Library
  if (parsed.version !== 2 || !Array.isArray(parsed.matches) || !Array.isArray(parsed.facts) || !parsed.analyses || !parsed.notes || !Array.isArray(parsed.recordings)) throw new Error('O arquivo local tem formato incompatível. Seus dados foram preservados.')
  return { ...emptyLibrary(), ...parsed }
}

let writeQueue = Promise.resolve()
export function saveLibrary(data: Library): Promise<void> {
  const payload = JSON.stringify(data)
  if (payload.includes('RGAPI-')) return Promise.reject(new Error('Uma chave foi inserida em um campo de texto. Remova-a antes de salvar.'))
  const write = async () => {
    if (desktop()) await invoke('save_library', { payload })
    else localStorage.setItem(cacheKey, payload)
  }
  const task = writeQueue.then(write, write)
  writeQueue = task.catch(() => {})
  return task
}

export function downloadJson(name: string, data: unknown) {
  const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }))
  const anchor = document.createElement('a'); anchor.href = url; anchor.download = name; anchor.click()
  window.setTimeout(() => URL.revokeObjectURL(url), 3000)
}
