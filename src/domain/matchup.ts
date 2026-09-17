import type { MatchSummary } from './types'

export interface MatchupPlan {
  opponent: string
  sampleSize: number
  sourceLabel: string
  overview: string
  items: string[]
  actions: string[]
  avoid: string[]
}

const plans: Record<string, Omit<MatchupPlan, 'opponent' | 'sampleSize' | 'sourceLabel'>> = {
  Camille: {
    overview: 'Jogue para absorver o engage da Camille e escolha trocas que terminem antes do segundo ciclo dela.',
    items: ['Trinity Force como opção de pressão', 'Plated Steelcaps se o dano físico estiver pesando'],
    actions: ['Guarde o Counter Strike para o compromisso da Camille.', 'Use a vantagem do terceiro golpe para sair da troca, não para prolongá-la sem visão.', 'Procure a wave sob controle antes de disputar o rio.'],
    avoid: ['Ativar o E cedo demais só para iniciar a troca.', 'Perseguir a Camille sem saber onde está o jungler.'],
  },
  Aatrox: {
    overview: 'Respeite os Qs e procure janelas curtas depois que Aatrox errar a ponta da habilidade.',
    items: ['Trinity Force como opção de pressão', 'Mercury\'s Treads se o controle de grupo ou a composição exigir'],
    actions: ['Entre depois de uma habilidade importante do Aatrox sair.', 'Mantenha a wave em uma posição que reduza o espaço para os Qs.', 'Use o salto para reposicionar, não apenas para começar a luta.'],
    avoid: ['Trocar parado no centro dos Qs.', 'Forçar all-in sem sua ultimate ou sem a wave favorável.'],
  },
  Gnar: {
    overview: 'Aproxime-se quando o Gnar estiver pequeno e mantenha espaço durante a transformação.',
    items: ['Trinity Force como opção de pressão', 'Plated Steelcaps contra uma lane com muito dano físico'],
    actions: ['Espere o retorno do Gnar para buscar uma troca mais longa.', 'Use o Counter Strike para atravessar o momento de maior pressão.', 'Converta prioridade em visão ou wave, não em perseguição sem saída.'],
    avoid: ['Lutar perto da parede quando ele estiver prestes a transformar.', 'Gastar o salto antes de saber se precisa escapar.'],
  },
  default: {
    overview: 'Use este plano como lembrete geral e ajuste a execução conforme a matchup que você conhece no jogo.',
    items: ['Trinity Force como opção padrão de pressão', 'Escolha a bota defensiva de acordo com o tipo de dano da lane'],
    actions: ['Priorize trocas curtas até identificar as janelas do adversário.', 'Mantenha o Counter Strike disponível para a habilidade mais importante da lane.', 'Transforme uma vantagem de wave em recall, visão ou pressão lateral.'],
    avoid: ['Copiar uma build sem considerar o tipo de dano da partida.', 'Tomar uma troca longa sem saber qual é a condição de saída.'],
  },
}

export function buildMatchupPlan(matches: MatchSummary[], demo: boolean): MatchupPlan | undefined {
  const jaxMatches = matches
    .filter(match => match.champion === 'Jax' && match.role === 'TOP' && match.opponent.trim())
    .sort((a, b) => Date.parse(b.startedAt) - Date.parse(a.startedAt))
  const latest = jaxMatches[0]
  if (!latest) return undefined
  const opponent = latest.opponent.trim()
  const base = plans[opponent] ?? plans.default
  const sampleSize = jaxMatches.filter(match => match.opponent.trim().toLowerCase() === opponent.toLowerCase()).length
  return {
    opponent,
    sampleSize,
    sourceLabel: demo ? 'Exemplo fixo · não é a partida atual' : 'Último matchup no seu histórico · não é leitura ao vivo',
    ...base,
  }
}
