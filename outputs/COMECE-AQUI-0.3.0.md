# Jax Coach 0.3.0 — comece aqui

Esta versão adiciona três recursos importantes: **Testar conexão** verifica seu Riot ID e chave antes da importação, **Importar backup** restaura seu histórico em outro computador, e o Modo Foco pode identificar uma vez o contexto local da partida sem virar assistência automática.

Baixe e abra **Jax-Coach-0.3.0-x64-setup.exe**. Feche uma versão antiga antes de instalar.

Para puxar partidas:

1. Abra **Configurações**.
2. Coloque `Pula Nuvem` no Nome e `Hope` na Tag — ou cole `Pula Nuvem#Hope` no campo Nome.
3. Gere uma chave nova no portal da Riot. Chaves de desenvolvimento costumam expirar em 24 horas.
4. Cole a chave somente no aplicativo e clique em **Testar conexão**.
5. Se aparecer “Conexão confirmada”, clique em **Sincronizar minhas partidas**.

Não envie sua chave pelo chat. Ela não é salva no código, no Git ou no banco.

Para levar seu histórico, use **Configurações → Exportar histórico**. No outro computador, use **Importar backup**. O app pede confirmação antes de substituir um histórico existente.

Se ainda aparecer erro, envie somente o texto do erro, sem a chave. Demonstração, histórico de exemplo, anotações, padrões e painel de foco continuam funcionando sem Riot. Ao abrir o painel de foco, ele tenta uma única consulta local para identificar Jax/rota/adversário e então mostra a ficha estática com itens, plano de treino e pontos a evitar. Se o League Client não responder, escolha a matchup manualmente. Em **Diagnóstico → Dados locais da partida**, o botão **Consultar dados locais agora** permite ver/exportar os dados completos do League Client; essa consulta nunca fica rodando em segundo plano e não gera ordens durante o jogo.
