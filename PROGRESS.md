# PROGRESS

## 2026-09-16 · marco 01

- [x] Projeto inicializado como app React + TypeScript com shell Tauri 2.
- [x] Dashboard, Histórico, Meu Jax, Padrões pessoais, Configurações e Diagnostics.
- [x] Separação de fatos (`MatchFact`), heurísticas, memória histórica e `AIProvider`.
- [x] Mock provider e fixtures para rodar sem chave Riot/IA.
- [x] Matcher de vídeos Outplayed por horário/duração com confidence score.
- [x] Preparação de recorte FFmpeg sem modificar o arquivo original.
- [x] Migração SQLite e comandos Tauri para health check/listagem de partidas.
- [x] Live safe mode com lembretes históricos e guardrails Riot na UI/documentação.
- [x] Testes básicos de matcher e safe mode.
- [x] Logs locais para diagnostics e bridge Tauri para enumerar vídeos Outplayed.
- [x] Rust/MSVC instalados neste ambiente; instaladores Windows `.msi` e `.exe` gerados.
- [x] Riot ID configurável e comando Tauri de sincronização de partidas via Riot API.

## 2026-09-16 · marco 02 · versão 0.2.0

- [x] Interface reformulada: navegação consistente, busca/filtros, estados vazios, carregamento e erros legíveis.
- [x] Dados demonstrativos isolados dos pessoais; removidas métricas fixas e inferências de habilidades sem evidência do fluxo principal.
- [x] Estatísticas calculadas da amostra; Meu Jax filtra Jax/top e mostra a amostra de matchups.
- [x] Biblioteca SQLite com atualização sem duplicatas e cache de Timeline. Migração 002 idempotente.
- [x] Match Timeline real: eventos do participante, CS/ouro aos 10 minutos e adversário da mesma rota quando disponível.
- [x] Heurísticas rastreáveis, padrão histórico com amostra mínima, notas por partida e objetivo editável.
- [x] AIProvider padrão de regras locais, separado do mock e dos prompts versionados. Nenhuma chamada a IA externa.
- [x] Janela independente de foco com snapshot histórico e bloqueio de novos trabalhos pós-jogo enquanto aberta.
- [x] Busca de vídeos em subpastas, FFprobe opcional, horário explicitamente estimado, confirmação manual e recortes FFmpeg sem alterar originais.
- [x] Erros Riot 401/403/404/429/5xx e timeout; chave somente na sessão, redigida nos logs e recusada nas anotações persistidas.
- [x] Dependências de teste atualizadas; `npm audit` retornou zero vulnerabilidades conhecidas em 2026-09-16.
- [x] 15 testes TypeScript + 4 testes Rust passaram; build web e instaladores Windows compilados.
- [x] QA no navegador: dashboard, histórico, nota demonstrativa, painel de foco/Escape e separação de dados pessoais vazios. Sem overflow horizontal detectado no viewport de 1280 px.
- [x] Executável Windows 0.2.0 abriu e carregou a biblioteca via IPC. Automação nativa de cliques não estava operacional neste ambiente; interação completa da janela independente ainda requer teste manual.

### Verificação ainda necessária

- Sincronização com chave Riot válida e uma Timeline real nesta versão: não executada nesta rodada, contratos cobertos por testes offline.
- Varredura e recorte de gravação real: FFmpeg/FFprobe não disponíveis neste ambiente; execução ponta a ponta ainda requer instalação e um vídeo finalizado.
- Aprovação/registro Riot antes de distribuição pública; a implementação não implica aprovação.
- Provider de IA externa e interpretação automática de vídeo: não implementados.
- Troca de conta e migração para tabelas normalizadas: próximos incrementos possíveis.
- Remoto Git: não configurado. Histórico local em commits e cópia Git transportável em `outputs`; instruções no README.

## 2026-09-17 · correção 0.2.1

- [x] Aceita Riot ID colado como `Nome#Tag` ou em campos separados.
- [x] Mensagens mais claras para chave expirada/recusada, Riot ID inválido e conta sem partidas recentes.
- [x] Instalador recompilado como 0.2.1.

## 2026-09-17 · upgrade 0.3.0

- [x] Teste de conexão Riot separado da importação, com confirmação da conta antes de buscar partidas.
- [x] Backup JSON restaurável com validação de formato, limite de tamanho e bloqueio de chaves.
- [x] 16 testes TypeScript + 4 testes Rust passaram após o upgrade.
- [x] Instalador e diagnóstico preparados para a versão 0.3.0.
- [x] Troca de conta segura com confirmação, sem apagar o código ou arquivos de vídeo.
