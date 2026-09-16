# Jax Coach

Coach pessoal local-first para League of Legends, inicialmente focado em Jax na top lane. O produto transforma partidas encerradas em fatos, heurísticas revisáveis e memória histórica pessoal. Durante uma partida, o modo seguro pode mostrar somente lembretes derivados do seu histórico — nunca informação oculta ou uma ordem do que fazer.

## Estado atual

Esta primeira entrega já é demonstrável sem League of Legends, chave Riot ou chave de IA. O dashboard usa fixtures realistas, o histórico simula fatos de Timeline, e a associação de gravações mostra como o Outplayed pode ser relacionado a uma partida por horário/duração.

### Arquitetura

```text
React + TypeScript (UI)
        │
        ├── facts            fatos observados da Riot Timeline/vídeo
        ├── heuristics       inferências com confiança e evidências
        ├── memory           padrões pessoais persistidos
        ├── AIProvider       contrato desacoplado; mock local por padrão
        ├── recordings       matcher Outplayed + pedidos de recorte
        └── Tauri 2 / SQLite persistência local no shell Windows
```

O front-end possui fallback em `localStorage` para desenvolvimento web. O shell Tauri cria `jax-coach.sqlite3` na pasta de dados da aplicação e aplica `migrations/001_initial.sql` na inicialização.

## Rodar sem credenciais

Pré-requisitos: Node.js 20+ e npm.

```powershell
npm install
npm run dev
```

Abra `http://localhost:1420`. A faixa “Modo fixture” confirma que nenhuma integração externa está sendo chamada.

Verificações disponíveis:

```powershell
npm run build
npm test
```

Para o desktop Tauri no Windows, instale Rust via `rustup`, Visual Studio Build Tools com “Desktop development with C++” e WebView2. Depois:

```powershell
npm run tauri dev
```

## Riot API e IA

As credenciais são opcionais e não são necessárias para o fluxo fixture. Copie `.env.example` para `.env` apenas quando decidir ativar uma integração. A implementação deve continuar opt-in e com análise pesada somente depois do jogo.

- Riot API: sincronização manual de partidas e Timeline, sem scraping de OP.GG/Mobalytics.
- AIProvider: o contrato está em `src/providers/AIProvider.ts`; `MockAIProvider` é o provider padrão. Prompts versionados ficam em `src/prompts/`.
- Nenhuma credencial deve ser commitada. O app deve armazenar segredos no cofre apropriado do sistema quando a integração for adicionada.

## Outplayed, FFmpeg e privacidade

Em Configurações, informe a pasta de gravações. O matcher compara início e duração e exibe um score; o fixture demonstra scores de 92–96%. Recortes são pedidos de saída novos (por exemplo, `*-event-420s.mp4`) e nunca sobrescrevem vídeos originais. Quando FFmpeg estiver no PATH, o shell poderá executar o comando gerado por `src/services/recordings.ts`.

## Compliance e limites do produto

O design segue estes limites:

- não lê memória do processo do jogo, não usa DLL injection e não automatiza input;
- não faz scraping de sites de terceiros nem exibe informação que o jogador não teria;
- não analisa a sessão atual para emitir callouts ou ditar decisões;
- o segundo monitor só exibe lembretes históricos pessoais e pode ser desligado;
- fatos, inferências e memória são apresentados separadamente, com confiança e evidências;
- qualquer IA pesada é pós-partida e pode rodar inteiramente localmente com o mock.

Consulte sempre os termos atuais da Riot antes de publicar ou distribuir integrações. Este README descreve guardrails de produto, não substitui revisão jurídica ou os termos oficiais.

## Git e trabalho em outro PC

O repositório local foi inicializado e os marcos são registrados em commits. Para conectar ao GitHub/GitLab, crie um repositório vazio e rode:

```powershell
git remote add origin https://github.com/SEU_USUARIO/jax-coach.git
git branch -M main
git push -u origin main
```

Se preferir SSH:

```powershell
git remote add origin git@github.com:SEU_USUARIO/jax-coach.git
git branch -M main
git push -u origin main
```

Não havia credencial/autorização de GitHub/GitLab disponível no ambiente desta execução, então o remoto não foi criado automaticamente. O diretório está pronto para receber o `origin` acima.

## Estrutura útil

- `src/app/App.tsx` — telas e fluxo principal.
- `src/domain/` — tipos, fixtures, análise, safe mode e matcher.
- `src/services/` — storage, diagnostics e pipeline de gravações.
- `src-tauri/` — shell desktop Windows e comandos SQLite iniciais.
- `migrations/` — schema SQLite versionado.
- `tests/` — testes básicos executáveis com Vitest.
- `PROGRESS.md` — marcos e próximos passos.
