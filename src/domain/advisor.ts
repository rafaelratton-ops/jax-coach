import type { Library } from './library'

export interface PreGameAdvisorInput {
  laneOpponent: string
  enemyTeam: string[]
  allyTeam: string[]
  library: Library
}

export interface AdvisorOption {
  id: string
  title: string
  runes: string[]
  items: string[]
  reason: string
  when: string
  caution: string
}

export interface PreGameAdvice {
  laneOpponent: string
  enemyTeam: string[]
  allyTeam: string[]
  compositionSummary: string
  personalEvidence: string
  options: AdvisorOption[]
  dataNote: string
}

interface ChampionSignal {
  damage: 'physical' | 'magic' | 'mixed'
  tags: Array<'poke' | 'cc' | 'healing' | 'tank' | 'ranged' | 'assassin' | 'engage'>
}

const signals: Record<string, ChampionSignal> = {
  aatrox: { damage: 'physical', tags: ['healing'] },
  camille: { damage: 'physical', tags: ['engage', 'cc'] },
  darius: { damage: 'physical', tags: ['healing'] },
  gnar: { damage: 'physical', tags: ['ranged', 'cc'] },
  malphite: { damage: 'magic', tags: ['tank', 'engage', 'cc'] },
  mordekaiser: { damage: 'magic', tags: ['tank'] },
  ornn: { damage: 'physical', tags: ['tank', 'engage', 'cc'] },
  renekton: { damage: 'physical', tags: ['engage'] },
  rumble: { damage: 'magic', tags: ['ranged', 'poke'] },
  sett: { damage: 'physical', tags: ['engage'] },
  teemo: { damage: 'magic', tags: ['ranged', 'poke'] },
  kennen: { damage: 'magic', tags: ['ranged', 'poke', 'cc'] },
  fiora: { damage: 'physical', tags: ['healing'] },
  gwen: { damage: 'magic', tags: ['healing'] },
  illaoi: { damage: 'physical', tags: ['healing'] },
  jhin: { damage: 'physical', tags: ['ranged', 'cc'] },
  jinx: { damage: 'physical', tags: ['ranged'] },
  ashe: { damage: 'physical', tags: ['ranged', 'poke', 'cc'] },
  orianna: { damage: 'magic', tags: ['ranged', 'poke', 'cc'] },
  syndra: { damage: 'magic', tags: ['ranged', 'poke', 'cc'] },
  ahri: { damage: 'magic', tags: ['ranged', 'poke', 'cc'] },
  sejuani: { damage: 'magic', tags: ['tank', 'engage', 'cc'] },
  nautilus: { damage: 'magic', tags: ['tank', 'engage', 'cc'] },
  leona: { damage: 'magic', tags: ['tank', 'engage', 'cc'] },
  thresh: { damage: 'physical', tags: ['cc', 'engage'] },
  'lee sin': { damage: 'physical', tags: ['engage'] },
  evelynn: { damage: 'magic', tags: ['assassin'] },
  khazix: { damage: 'physical', tags: ['assassin'] },
  rengar: { damage: 'physical', tags: ['assassin'] },
}

function clean(value: string) { return value.trim().replace(/\s+/g, ' ') }
function profile(name: string) { return signals[clean(name).toLowerCase()] }
function list(value: string[]) { return value.map(clean).filter(Boolean).slice(0, 5) }

function personalEvidence(library: Library, opponent: string) {
  const matches = library.matches.filter(match => match.champion === 'Jax' && match.role === 'TOP' && match.opponent.toLowerCase() === opponent.toLowerCase() && match.result !== 'remake')
  if (!matches.length) return 'Ainda não há partidas suas suficientes contra este adversário.'
  const wins = matches.filter(match => match.result === 'win').length
  return `${matches.length} partida(s) sua(s) contra ${opponent} · ${Math.round(100 * wins / matches.length)}% de vitórias. Use isso como contexto, não como certeza.`
}

export function buildPreGameAdvice(input: PreGameAdvisorInput): PreGameAdvice {
  const laneOpponent = clean(input.laneOpponent) || 'Adversário não informado'
  const enemyTeam = list([laneOpponent, ...input.enemyTeam.filter(item => item.toLowerCase() !== laneOpponent.toLowerCase())])
  const allyTeam = list(input.allyTeam)
  const enemyProfiles = enemyTeam.map(profile).filter((item): item is ChampionSignal => Boolean(item))
  const magic = enemyProfiles.filter(item => item.damage === 'magic').length
  const physical = enemyProfiles.filter(item => item.damage === 'physical').length
  const poke = enemyProfiles.filter(item => item.tags.includes('poke')).length
  const crowdControl = enemyProfiles.filter(item => item.tags.includes('cc')).length
  const tanks = enemyProfiles.filter(item => item.tags.includes('tank')).length
  const ranged = enemyProfiles.filter(item => item.tags.includes('ranged')).length
  const summaryParts = [
    magic > physical ? 'composição com mais dano mágico' : physical > magic ? 'composição com mais dano físico' : 'dano misto ou ainda não identificado',
    crowdControl ? `${crowdControl} ameaça(s) com controle de grupo` : 'pouco controle identificado',
    poke ? `${poke} ameaça(s) de poke` : 'pouco poke identificado',
  ]
  const options: AdvisorOption[] = [
    {
      id: 'balanced', title: 'Plano equilibrado de trocas',
      runes: ['Runa de trocas prolongadas (ex.: Conquistador)', 'Secundária de resistência para a lane'],
      items: ['Trinity Force como opção de pressão', 'Bota defensiva conforme o tipo de dano da lane'],
      reason: `Plano padrão para criar janelas de troca sem comprometer a adaptação. ${tanks ? 'Ajuda a manter dano útil contra linhas de frente.' : ''}`,
      when: 'Quando você ainda não sabe se a partida será de pressão lateral ou lutas agrupadas.',
      caution: 'Não copie a opção sem considerar seu ouro e o tipo de dano que está realmente recebendo.',
    },
    {
      id: 'survive', title: 'Plano para sobreviver à lane',
      runes: [poke || ranged ? 'Runa de sustain contra poke e alcance' : 'Runa de resistência para absorver o primeiro engage', 'Secundária defensiva como alternativa'],
      items: [magic > physical ? 'Bota de resistência mágica contra dano mágico/controle' : 'Bota de armadura contra dano físico', 'Item inicial defensivo se a lane exigir'],
      reason: 'Prioriza chegar ao meio do jogo com recursos, em vez de forçar todas as trocas.',
      when: `Quando a lane tem ${poke || ranged ? 'poke/alcance' : 'engage forte'} ou quando seu histórico mostra muitas mortes cedo.`,
      caution: 'Defesa é uma opção para criar tempo; não significa abandonar todo o dano.',
    },
    {
      id: 'teamfight', title: 'Plano para a composição inimiga',
      runes: [crowdControl ? 'Runa com resistência a controle como alternativa' : 'Runa de dano consistente em lutas', 'Fragmentos defensivos conforme a maior ameaça'],
      items: [crowdControl ? 'Mercury\'s Treads como opção contra controle/dano mágico' : 'Plated Steelcaps como opção contra dano físico', tanks ? 'Item de dano sustentado para atravessar a linha de frente' : 'Item de pressão lateral para puxar respostas'],
      reason: `Considera o time inteiro: ${summaryParts.join(', ')}.`,
      when: `Quando ${tanks ? 'há linha de frente para atravessar' : 'o time precisa de uma ameaça lateral clara'} depois da fase de rotas.`,
      caution: 'A composição aliada também importa; confirme se seu time precisa de pressão lateral ou de presença em luta.',
    },
  ]
  return {
    laneOpponent,
    enemyTeam,
    allyTeam,
    compositionSummary: summaryParts.join(' · '),
    personalEvidence: personalEvidence(input.library, laneOpponent),
    options,
    dataNote: 'Assessor local transparente: usa os campeões informados, seu histórico e regras de treino. Confirme nomes e patch antes de usar em uma partida ranqueada.',
  }
}
