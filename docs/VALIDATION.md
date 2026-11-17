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

Não foi executado teste de carga, restauração de backup, implantação pública, teste com vários workers ou auditoria de segurança completa. Balanceamento e controles ainda precisam de sessões com grupos reais. O catálogo e quatro desafios desta versão são originais/adaptados; a fidelidade integral à caixa física continua pendente.
