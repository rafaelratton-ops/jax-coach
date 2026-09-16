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

## Próximos marcos

1. Instalar Rust/MSVC e validar `npm run tauri dev` no Windows.
2. Implementar adaptador Riot API opt-in e ingestão da Timeline.
3. Persistir fixtures e análises diretamente no SQLite via comandos Tauri.
4. Adicionar detector de FFmpeg e pipeline de clips pós-jogo.
5. Adicionar provider externo com consentimento e retenção configurável.
