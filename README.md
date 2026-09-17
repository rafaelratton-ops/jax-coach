# Jax Coach · 0.2.1

Coach pessoal para Windows, local-first, inicialmente focado em Jax/top. Revise partidas encerradas, guarde anotações e leve um objetivo histórico para o segundo monitor. Não controla o jogo nem acompanha a partida ao vivo.

## Usar sem programar

Abra o instalador `outputs/Jax-Coach-0.2.1-x64-setup.exe`. O app abre em **Demonstração** quando não existe histórico pessoal. Não precisa de LoL, Riot API ou IA para explorar o exemplo. O exemplo nunca é salvo como partidas da sua conta.

1. **Histórico:** selecione uma partida, veja eventos, hipóteses e escreva sua própria anotação.
2. **Padrões pessoais:** ajuste o objetivo de treino e consulte a evidência por partida.
3. **Painel de foco:** abre uma janela independente, sempre por cima, para arrastar ao segundo monitor. O conteúdo fica congelado até fechar/reabrir. Escape fecha o painel.
4. **Configurações:** seu Riot ID inicial é `Pula Nuvem#Hope`. Cole uma chave válida somente no campo Chave Riot para importar 5, 10 ou 20 partidas.
5. **Vídeos:** informe a pasta Outplayed, procure gravações e confira o horário antes de recortar.

O histórico, as revisões e as anotações importados ficam neste PC. A chave fica somente na memória da sessão, não vai para Git nem é salva no banco. Para buscar novas Timelines depois de reabrir, conecte novamente; revisões e Timelines já obtidas continuam offline.

## O que esta versão faz

- Dashboard calculado da amostra importada; remakes não contam nas médias.
- Histórico com busca e filtros; reconhece o campeão real e o adversário da mesma rota quando informado pela Riot.
- Meu Jax considera apenas Jax/top e mostra quantidade de partidas em cada matchup.
- Match Timeline: mortes, abates, assistências, compras, participação em objetivos e CS/ouro aos 10 minutos, quando disponíveis.
- Regras locais criam **pontos para revisar**, não explicações inventadas. Timeline não revela intenção, wave ou timing de habilidade.
- Padrões agregados requerem pelo menos 3 partidas Jax/top revisadas e repetição em 2. São tendências de triagem, não causalidade ou probabilidade estatística.
- Notas e objetivo editáveis; exportação JSON da biblioteca e dos logs.
- Biblioteca SQLite persistente e cache local das Timelines. Demonstração isolada, temporária.
- Janela de foco estática; comandos de sincronização, análise, varredura e recorte bloqueados enquanto estiver aberta.

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
- `src/providers/`: contrato AIProvider, regras locais como padrão, mock preservado para testes.
- `src/prompts/`: prompts versionados para futura integração de IA; não há chamada a modelo externo nesta versão.
- `src-tauri/src/riot.rs`: Account-v1 e Match-v5, chamadas oficiais com timeout e mensagens de erro sem credenciais.
- `src-tauri/src/persistence.rs`: biblioteca JSON em registro SQLite e cache das Timelines; migrações idempotentes 001 e 002. As tabelas normalizadas da primeira migração são preservadas, mas a biblioteca v2 usa o snapshot como fonte de verdade.
- `src-tauri/src/media.rs`: descoberta, metadados e recortes locais.
- `src/services/logger.ts`: últimos 200 registros locais, com ocultação de chaves.

O banco fica na pasta de dados Tauri do identificador `com.jaxcoach.desktop` (normalmente `%APPDATA%/com.jaxcoach.desktop/jax-coach.sqlite3`). Preferências e logs usam o armazenamento local do WebView. A exportação JSON não inclui vídeos, chave ou cache bruto de Timeline; ainda não há importação JSON na interface. Para cópia completa, feche o app e copie sua pasta de dados. Arquivos de treino não são criptografados: use apenas um PC confiável.

## Credenciais e limitações

A API Riot exige chave autorizada. Chaves de desenvolvimento expiram; o app informa a recusa, mas não renova a chave automaticamente. Veja o [portal oficial](https://developer.riotgames.com/). Antes de distribuir uma integração além do uso pessoal, registre o produto e verifique as exigências atuais de aprovação/chave; não distribua uma chave de produção no executável.

IA externa e interpretação automática de vídeo **não estão implementadas**. As revisões atuais usam regras locais. Não há detecção automática de partida em andamento: use sincronização/revisão somente depois do jogo e abra o painel estático antes de jogar. Uma biblioteca comporta uma conta; troca de dono é bloqueada para preservar seu histórico. Não há download automático de FFmpeg nem leitura de arquivos internos do LoL.

Compliance e fontes: [docs/COMPLIANCE.md](docs/COMPLIANCE.md). Não é um produto aprovado ou endossado pela Riot.

## Git e outro computador

O repositório é local e os marcos estão em commits. **Não há remoto configurado** nesta entrega. Instaladores, banco, vídeos e credenciais não entram no Git.

Crie um repositório vazio privado no GitHub/GitLab e substitua a URL abaixo pela dele:

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
