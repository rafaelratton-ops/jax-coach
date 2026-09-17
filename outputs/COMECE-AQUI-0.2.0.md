# Jax Coach 0.2.0 — comece aqui

## Abrir o programa

Abra **Jax-Coach-0.2.0-x64-setup.exe** e siga o instalador. Feche a versão antiga antes. A versão é experimental e o instalador ainda não possui assinatura digital.

Ao abrir, você verá uma demonstração, claramente identificada. Ela serve para experimentar tudo sem entrar no LoL e sem chave. Não são partidas da sua conta.

## O que experimentar primeiro

1. Entre em **Histórico** e escolha uma partida do exemplo.
2. Veja a linha do tempo e os pontos para revisar. As hipóteses não são tratadas como fatos.
3. Escreva uma anotação em **O que quero lembrar** e salve.
4. Abra **Painel de foco**. No aplicativo Windows, ele é uma janela separada para arrastar ao segundo monitor. Escape fecha.
5. Em **Padrões pessoais**, ajuste seu objetivo de treino.

As mudanças na demonstração são temporárias. Seu histórico real e suas anotações pessoais ficam salvos neste computador.

## Carregar suas partidas

Em **Configurações**, o nome inicial é **Pula Nuvem#Hope**. Cole uma chave válida da Riot somente no campo **Chave Riot**, selecione a quantidade e clique em **Sincronizar minhas partidas**. No Histórico, abra uma partida e peça a revisão.

A chave não fica no código nem no Git. Ela vale na sessão até você fechar o programa; novas buscas depois disso pedem que você conecte de novo. Uma chave expirada precisa ser renovada no portal oficial. Revisões já salvas continuam acessíveis sem chave.

## Vídeos do Outplayed

Na aba **Vídeos**, informe a pasta usada pelo Outplayed e clique em **Buscar vídeos**. O programa sugere associações, mas você precisa confirmar o horário real da gravação para alinhar o recorte. Os vídeos originais não são alterados.

Recortes precisam de **FFmpeg** e a leitura de duração precisa de **FFprobe**. A tela Diagnóstico mostra se foram encontrados. Eles não vêm incluídos neste instalador. Sem eles, você ainda pode usar histórico, revisão e anotações normalmente.

## Levar para casa

Para usar: leve o instalador.

Para continuar desenvolvendo: leve **Jax-Coach-0.2.0-source.bundle**. Esse arquivo contém o código e os commits Git, sem chave, vídeos ou seu histórico pessoal. Em outro computador com Git:

```powershell
git clone Jax-Coach-0.2.0-source.bundle jax-coach
cd jax-coach
npm ci
npm run dev
```

Ainda não está publicado no GitHub/GitLab. O README dentro do projeto explica como conectar a um repositório online depois.

## Limites importantes

Esta versão usa regras locais para sugerir o que revisar. Ela ainda **não assiste aos vídeos automaticamente** nem usa uma IA externa. Use análises e importações depois de terminar a partida. Durante o jogo, o painel mostra somente seu objetivo e anotações antigas, sem acompanhar o que está acontecendo.

Testes desta entrega: 18 testes automáticos passaram, build Windows gerado e interface conferida no navegador. Abertura do executável Windows confirmada. A janela separada precisa de uma conferência manual de interação; conexão Riot e recorte de vídeo real não foram testados nesta rodada.
