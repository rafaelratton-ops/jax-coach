# Jax Coach · 0.6.0

Coach pessoal para Windows, local-first, inicialmente focado em Jax/top. Revise partidas encerradas, guarde anotações e leve um objetivo histórico para o segundo monitor. Não controla o jogo nem acompanha a partida em segundo plano.

## Usar sem programar

Abra o instalador `outputs/Jax-Coach-0.6.0-x64-setup.exe`. O app abre em **Demonstração** quando não existe histórico pessoal. Não precisa de LoL, Riot API ou IA para explorar o exemplo. O exemplo nunca é salvo como partidas da sua conta.

1. **Histórico:** selecione uma partida, veja eventos, hipóteses e escreva sua própria anotação.
2. **Performance:** veja seus indicadores de Jax/top e comece um bloco de 10 partidas com um único objetivo.
3. **Padrões pessoais:** ajuste o objetivo de treino e consulte a evidência por partida.
4. **Painel de foco:** abre uma janela independente, sempre por cima, para arrastar ao segundo monitor. Ative **Acompanhamento seguro** quando quiser uma leitura resumida a cada 10 segundos do League Client local. Ele mostra fatos disponíveis (modo, tempo, campeão, nível, rota, itens e placar) e opções históricas de treino; desligue quando quiser. Escape fecha o painel.
5. **Configurações:** seu Riot ID inicial é `Pula Nuvem#Hope`. Cole uma chave válida somente no campo Chave Riot para importar 5, 10 ou 20 partidas.
6. **Vídeos:** informe a pasta Outplayed, procure gravações e confira o horário antes de recortar.

O histórico, as revisões e as anotações importados ficam neste PC. A chave fica somente na memória da sessão, não vai para Git nem é salva no banco. Para buscar novas Timelines depois de reabrir, conecte novamente; revisões e Timelines já obtidas continuam offline.

## O que esta versão faz

- Dashboard calculado da amostra importada; remakes não contam nas médias.
- Performance de Jax/top com CS aos 10 minutos, mortes antes dos 10, vitórias e amostra revisada.
- Assessor pré-jogo com três alternativas de runas/itens baseadas na composição informada, explicação e contexto do seu histórico.
- Blocos de treino de 10 partidas com um objetivo por vez e check-in pós-jogo.
- Histórico com busca e filtros; reconhece o campeão real e o adversário da mesma rota quando informado pela Riot.
- Meu Jax considera apenas Jax/top e mostra quantidade de partidas em cada matchup.
- Match Timeline: mortes, abates, assistências, compras, participação em objetivos e CS/ouro aos 10 minutos, quando disponíveis.
- Regras locais criam **pontos para revisar**, não explicações inventadas. Timeline não revela intenção, wave ou timing de habilidade.
- Padrões agregados requerem pelo menos 3 partidas Jax/top revisadas e repetição em 2. São tendências de triagem, não causalidade ou probabilidade estatística.
- Notas e objetivo editáveis; exportação JSON da biblioteca e dos logs.
- Revisão rápida pós-partida com três perguntas: o que aconteceu, qual decisão mudaria e o que testar depois.
- Assessor usa apenas campeões informados antes da partida; não gera ordens a partir de eventos, cooldowns ou dados ocultos do jogo.
- Biblioteca SQLite persistente e cache local das Timelines. Demonstração isolada, temporária.
- Janela de foco com acompanhamento seguro opcional; comandos de sincronização, análise, varredura e recorte bloqueados enquanto estiver aberta. A leitura periódica é resumida e não leva ouro, vida, cooldowns, eventos, runas ou dados brutos para a ficha ou para a IA.

## Outplayed e FFmpeg

A aba Vídeos sugere pastas comuns em `Videos/Outplayed` e `Videos/Overwolf`, permite caminho manual e percorre até 5 níveis/300 vídeos (`mp4`, `mkv`, `webm`, `mov`). Ignora links simbólicos e arquivos modificados nos últimos 90 segundos. Isso reduz leituras de gravações em andamento, mas não garante que um arquivo esteja finalizado.

FFprobe, quando presente no PATH, fornece a duração. O início é **estimado** pela última modificação menos duração; mover/copiar arquivos pode invalidar a estimativa. O score de compatibilidade compara horário/duração e fica limitado a 65% quando o horário é estimado. Não é uma probabilidade calibrada. Confirme manualmente o horário real para habilitar recortes.

FFmpeg gera um novo MP4 de até 45 segundos, com 15 segundos antes do evento quando possível, na pasta `clips` dos dados do app. Não altera nem sobrescreve originais. Há limites de tempo para sondagem e recorte. Uma falha de codificação pode deixar um arquivo de saída incompleto nessa pasta, nunca no original. FFmpeg/FFprobe não são distribuídos junto do app e sua disponibilidade aparece em Diagnóstico.

## Desenvolvimento e testes sem LoL

Node.js 22 LTS ou 24+, npm. Não precisa criar `.env`; veja `.env.example`.

```powershell
npm ci
npm test
npm run build
npm run dev
```

Abra `http://localhost:1420`. No navegador, a demonstração funciona; comandos Riot, SQLite, pasta de vídeos e janela independente só funcionam no desktop. A prévia usa localStorage separado do banco desktop.

Para desktop: Rust estável, Visual Studio Build Tools com C++/Windows SDK e WebView2.

```powershell
npm run tauri dev
cargo test --manifest-path src-tauri/Cargo.toml --lib --release
npm run tauri build -- --ci
```

Instaladores são gerados em `src-tauri/target/release/bundle/`. Para testar o fluxo sem credenciais: navegue na demonstração, filtre Histórico, atualize revisão, salve uma nota e abra o painel de foco. Alterações do exemplo são descartadas ao reabrir.

## Arquitetura e armazenamento

React + TypeScript/Vite, Tauri 2/Rust, SQLite/rusqlite. Não há servidor intermediário nem telemetria.

- `src/domain/review.ts`: fatos observados de Timeline.
- `src/domain/analysis.ts`: heurísticas rastreáveis por IDs de fatos.
- `src/domain/library.ts`: métricas, agregação histórica e biblioteca versionada.
- `src/domain/performance.ts` e `src/components/Performance.tsx`: indicadores de Jax/top, objetivos e blocos de treino de 10 partidas.
- `src/domain/advisor.ts` e `src/components/Advisor.tsx`: assessor pré-jogo local, explicável e desacoplado do contrato `AIProvider`.
- `src/providers/`: contrato AIProvider, regras locais como padrão, mock preservado para testes.
- `src/prompts/`: prompts versionados para futura integração de IA; não há chamada a modelo externo nesta versão.
- `src/providers/AIProvider.ts`: contrato desacoplado para revisão pós-jogo e assessor pré-jogo; a implementação atual é local e explicável.
- `src-tauri/src/riot.rs`: Account-v1 e Match-v5, chamadas oficiais com timeout e mensagens de erro sem credenciais.
- `src-tauri/src/live.rs` e `src/services/liveClient.ts`: leitura local opt-in do contexto, acompanhamento seguro resumido e consulta manual dos endpoints do League Client; nenhum dado bruto chega ao foco ou à IA.
- `src-tauri/src/persistence.rs`: biblioteca JSON em registro SQLite e cache das Timelines; migrações idempotentes 001 e 002. As tabelas normalizadas da primeira migração são preservadas, mas a biblioteca v2 usa o snapshot como fonte de verdade.
- `src-tauri/src/media.rs`: descoberta, metadados e recortes locais.
- `src/services/logger.ts`: últimos 200 registros locais, com ocultação de chaves.

O banco fica na pasta de dados Tauri do identificador `com.jaxcoach.desktop` (normalmente `%APPDATA%/com.jaxcoach.desktop/jax-coach.sqlite3`). Preferências e logs usam o armazenamento local do WebView. A exportação/importação JSON não inclui vídeos, chave ou cache bruto de Timeline. Para cópia completa, feche o app e copie sua pasta de dados. Arquivos de treino não são criptografados: use apenas um PC confiável.

## Credenciais e limitações

A API Riot exige chave autorizada. Chaves de desenvolvimento expiram; o app informa a recusa, mas não renova a chave automaticamente. Veja o [portal oficial](https://developer.riotgames.com/). O League Client também oferece uma API local para dados da partida, mas ela é uma integração separada e não substitui o registro/aprovação exigidos para distribuição pública.

IA externa e interpretação automática de vídeo **não estão implementadas**. As revisões atuais usam regras locais. O acompanhamento do Modo Foco é opcional, iniciado e interrompido por você, faz apenas polling resumido a cada 10 segundos e oferece alternativas históricas — não ordens nem decisões automáticas. Não há leitura de memória, leitura de DLL, captura de tela, automação de input ou informação oculta. Em **Diagnóstico → Dados locais da partida**, você pode consultar e exportar manualmente os endpoints oferecidos pelo League Client; dados brutos continuam fora do foco e do provedor de IA. Uma biblioteca comporta uma conta; troca de dono é bloqueada para preservar seu histórico. Não há download automático de FFmpeg nem leitura de arquivos internos do LoL.

Compliance e fontes: [docs/COMPLIANCE.md](docs/COMPLIANCE.md). Não é um produto aprovado ou endossado pela Riot.

## Git e outro computador

O repositório está conectado ao GitHub em `https://github.com/rafaelratton-ops/jax-coach`. Os marcos estão em commits. Instaladores, banco, vídeos e credenciais não entram no Git.

Para continuar em outro computador, clone o repositório acima. Se preferir outro GitHub/GitLab, substitua a URL nos comandos abaixo:

```powershell
git remote add origin https://github.com/SEU_USUARIO/jax-coach.git
git push -u origin main
```

Em casa:

```powershell
git clone https://github.com/SEU_USUARIO/jax-coach.git
cd jax-coach
npm ci
npm run dev
```

O Git transporta o código, não suas partidas/anotações locais nem a chave. Para apenas usar o programa, basta levar o instalador atualizado; para levar seu histórico, faça também a cópia local descrita acima.
