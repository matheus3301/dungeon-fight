# Validação da primeira versão jogável

Verificações executadas em 16 de novembro de 2026. A aplicação foi conferida no navegador desktop e no viewport móvel de 390 por 844 pixels. No desktop de 1280 por 720, o botão de arremesso ficou completamente visível, entre y654 e y700. O som de dados foi reproduzido pelo controle nativo de áudio, com duração detectada de 0,535 segundo e sem erro de mídia.

## Código e integração

- Build TypeScript e Vite concluído.
- 11 testes aprovados, sem testes pulados na execução com TEST_SERVER_URL e TEST_DATABASE_URL.
- Dois clientes Socket.IO distintos: sala, lobby, pronto, início, caminhos privados, comando repetido e retomada da mesma vaga.
- PostgreSQL 17 em contêiner descartável: criação, gravação, reabertura do adaptador e deduplicação, com transações usando o mesmo cliente.
- Imagem Docker construída com dependências de produção e usuário sem privilégios.
- Imagem de produção iniciada com PostgreSQL; `/api/health` confirmou `persistence: postgres`.
- Reinício do contêiner de aplicação seguido de nova conexão recuperou exatamente o snapshot e a identidade da vaga salvos no PostgreSQL. O teste aguardou o endpoint de saúde após o reinício.
- Motor: expedição completa até três lojas e vitória final, dados esgotados, cicatrizes, herói com três cicatrizes usando dado branco, região1 inválida por efeito de monstro, poder do dado branco preservado ao manter o resultado, propriedade de herói e revisão concorrente.

A captura `artifacts/mesa-desktop.jpg` documenta a composição durante um combate e fica fora do Git. O preview local é um processo de desenvolvimento usando arquivo durável. O PostgreSQL foi verificado separadamente em ambiente descartável, não apresentado como o armazenamento do preview local.

## Assets

- 11 packs gratuitos baixados e identificados. Oryx está marcado como não adquirido.
- Quatro snapshots concluídos e verificados: Dungeon Crawl tiles, Flare game, Flare art sources e Wesnoth. Arquivos compactados somam aproximadamente3,11GiB, além dos packs e extrações.
- Seleção de jogos:74 arquivos,36,4MiB, com autor, origem, licença e SHA-256.
- Verificador de runtime:172 arquivos referenciados por manifests, frames de heróis/chefões, hashes e referências de textura dos30 modelos GLB.
- Todos os frames de animação idle usados pelos personagens da aplicação foram encontrados.
- Dois modelos Blender do Flare têm payload real; os hashes coincidem com os objetos LFS de origem. Outros arquivos de fonte HD podem continuar sendo ponteiros LFS; a conclusão do archive não significa conversão pronta de todos os modelos.

## Limites que continuam abertos

Não foi executado teste de carga, restauração de backup, teste com vários workers ou auditoria de segurança completa. Balanceamento e controles ainda precisam de sessões com grupos reais. O catálogo e quatro desafios desta versão são originais/adaptados; a fidelidade integral à caixa física continua pendente.

## Implantação de 17 de novembro de 2026

- Repositório público `matheus3301/dungeon-fight`, com link de código-fonte nos créditos da aplicação.
- Imagem reconstruída com `docker build --pull`; execução de produção como usuário `node`, com health check saudável e PostgreSQL 18 descartável.
- Os 11 testes passaram, incluindo as duas integrações reais, sem testes pulados.
- Os 172 assets publicados passaram na verificação de hashes, licenças, frames e texturas.
- Deploy no Coolify via GitHub App e Dockerfile; HTTPS público e HTTPS direto à origem responderam com `persistence: postgres`.
- O login exclusivo do jogo criou e leu dados no próprio banco; conexões aos bancos administrativos `postgres` e `template1` foram recusadas.
- Dois clientes Socket.IO na URL pública confirmaram lobby, início, privacidade de caminhos, ação repetida e reconexão. A criação de uma mesa foi conferida também no navegador.

`npm audit --omit=dev` não apontou vulnerabilidades. A auditoria completa apontou quatro entradas de severidade alta na cadeia de build Vite/fdir/tinyglobby/picomatch, referentes ao mesmo [alerta de ReDoS em picomatch](https://github.com/advisories/GHSA-fc5q-39xc-vjpf). A correção automática sugerida exigia um downgrade incompatível do Vite; ele não foi aplicado. Essas dependências não fazem parte da imagem de runtime. Nenhum scanner de imagem estava disponível neste ambiente, portanto não se afirma que houve varredura de vulnerabilidades do sistema operacional.

Configuração e limites operacionais em [DEPLOYMENT.md](DEPLOYMENT.md).
