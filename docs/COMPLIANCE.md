# Limites de produto e Riot · revisão 2026-09-16

Este documento descreve decisões de implementação, não garante aprovação, ausência de sanções ou conformidade jurídica. Revalidar políticas e registrar o produto antes de distribuição pública.

## Fontes oficiais consultadas

- [Políticas gerais e chaves do Developer Portal](https://developer.riotgames.com/docs/portal)
- [Políticas e APIs de League of Legends](https://developer.riotgames.com/docs/lol)
- [FAQ sobre APIs locais e League Client](https://developer.riotgames.com/docs/faqs)
- [Referência Match-v5](https://developer.riotgames.com/apis#match-v5)

## Implementado

1. Consultas opt-in a Account-v1/Match-v5 por HTTPS, com chave em cabeçalho, nunca em URL ou banco. Nenhum scraping de OP.GG/Mobalytics.
2. Partidas encerradas e suas Timelines são a fonte da análise. O League Client API local é consultado somente por ação explícita do usuário: uma leitura curta de contexto, acompanhamento seguro opt-in enquanto o foco estiver aberto e uma consulta completa separada na tela Diagnóstico. Sem leitura de memória, DLL injection, automação de input ou captura de tela.
3. Painel para segundo monitor contém snapshot de objetivo e notas históricas. O acompanhamento periódico leva apenas fatos resumidos disponibilizados pela API local — modo/tempo, campeão, nível, rota, itens e placar — e nunca eventos, cooldowns, vida, ouro, runas ou resposta bruta. As sugestões são alternativas históricas de treino, não recomendações situacionais obrigatórias.
4. Enquanto o painel estiver aberto, o backend recusa novas importações, análise de Timeline, varreduras e recortes. A interface impede abri-lo durante operações iniciadas nela.
5. Fatos de API e exemplos são identificados; heurísticas são rotuladas como hipóteses e ligadas à evidência. Causa de morte ou uso incorreto de habilidade não são inferidos da Timeline.
6. Originais de vídeo são lidos apenas para metadados/recortes e preservados. Nenhum vídeo é enviado a serviços externos.
7. Credenciais não são distribuídas no binário nem no código. Banco e exportações contêm dados pessoais de treino e precisam ser protegidos pelo usuário.
8. Indicadores de performance e blocos de treino usam partidas encerradas, Timelines já obtidas e check-ins escritos pelo jogador. O objetivo é medir evolução, não dar nota automática ou alterar a partida atual.

## Limitações e responsabilidade

O League Client API é uma interface local documentada, mas a própria Riot informa que ela não é oficialmente suportada e pede que o uso seja comunicado quando combinado com a Riot API. Por isso, o acompanhamento fica desligado por padrão, exige ativação manual, é limitado a um resumo a cada 10 segundos e não é usado para automatizar decisões. A consulta completa continua atrás de um botão em Diagnóstico e pode ser exportada pelo usuário. O bloqueio do painel não é um detector contínuo de jogo nem garantia de compliance. O score de vídeos é somente compatibilidade heurística. Não há IA pesada ou visão automática nesta versão; futuras integrações exigem consentimento sobre envio, retenção e custo e devem continuar restritas ao pós-jogo.

O uso de chave pessoal/de desenvolvimento e a distribuição pública têm exigências diferentes. Antes de lançar, confirmar registro, aprovação e mecanismo de chave adequado no portal; nunca incorporar chave de produção no cliente. Respeitar limites e mensagens 429/Retry-After. A versão atual espaça consultas e informa o tempo de espera; não implementa um escalonador global baseado em todos os headers de rate limit.

Identidade visual original, sem assets extraídos do cliente ou marcas oficiais usadas como endosso. O aviso de não afiliação consta na tela Diagnóstico. Jax Coach não foi revisado ou aprovado pela Riot Games.
