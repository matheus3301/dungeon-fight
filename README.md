# Guilda dos Improváveis

Uma mesa cooperativa de fantasia para jogar no navegador: convide amigos, escolha heróis e enfrente uma expedição com arremessos de dados em um alvo compartilhado. Projeto gratuito e aberto, inspirado em Dungeon Fighter. Não é uma edição digital oficial.

[Jogar online](https://dungeon-fight.mmonteiro.dev) · [Código-fonte](https://github.com/matheus3301/dungeon-fight)

## Novidades da versão 0.2

Vila e salas vistas de cima, chegada dos heróis, balões de chat, apresentação dos inimigos e ataques no cenário. O arremesso agora combina mira, segurar/soltar e sorte no servidor. Música e efeitos vêm ligados; o navegador pode aguardar a primeira interação para liberar o som.

[Referências e mecânica](docs/RETRO-REFERENCE.md) · [Roadmap](docs/ROADMAP.md)

## O que já funciona

- Sala privada por link, até seis jogadores, lobby e heróis exclusivos. Solo controla dois heróis.
- Servidor autoritativo, poderes por cor de dado, relançamento, ataque adicional, dano, cicatrizes, equipamentos e chat.
- Escolhas de sala privadas ao líder, três paradas em lojas e chefão final.
- Mira/força/elevação, animação canônica do arremesso, áudio opcional e biblioteca de assets com amostras.
- Retomada da vaga neste navegador, credenciais opacas guardadas só como hash no servidor, revisão e deduplicação de comandos.
- PostgreSQL para produção; arquivo JSON durável com um único escritor para desenvolvimento.
- Catálogo original de demonstração com 8 heróis e 6 chefões. Regras adaptadas e limitações em [CONTENT-MAPPING.md](docs/CONTENT-MAPPING.md).

## Executar localmente

Requer Node.js 22 ou superior.

```sh
npm ci
npm run dev
```

Abra http://localhost:4310. O modo local guarda salas em `.data/`, ignorado pelo Git. Não exige PostgreSQL ou Redis. Não execute dois processos com o mesmo DATA_DIR.

Para usar PostgreSQL no processo local, exporte `DATABASE_URL` antes de iniciar. Não use o banco de produção nos testes.

```sh
export DATABASE_URL=postgres://USER:PASSWORD@HOST:5432/DATABASE
npm run dev
```

## Contêiner com PostgreSQL

```sh
cp .env.example .env
# Edite POSTGRES_PASSWORD para um valor longo e aleatório.
docker compose up --build -d
```

A porta fica restrita ao loopback do servidor por padrão. Para acesso pela internet, coloque um proxy TLS na frente e configure ALLOWED_ORIGINS com o domínio exato. Não exponha a porta do PostgreSQL. Dados ficam no volume `game-data`. Reiniciar os contêineres preserva ações confirmadas.

O código é AGPL: ao disponibilizar uma versão modificada pela rede, forneça acesso ao código correspondente. Os assets têm licenças próprias; preserve os notices. Não publique `assets/library` ou `.data` por acidente.

## Verificação

```sh
npm run build
npm run assets:check
npm test
```

Para executar também integrações reais:

```sh
TEST_SERVER_URL=http://localhost:4310 TEST_DATABASE_URL=postgres://USER:PASSWORD@HOST:5432/DISPOSABLE_TEST_DATABASE npm test
```

Os testes de integração criam registros no banco informado; escolha banco descartável. Sem as variáveis, esses dois testes são pulados explicitamente. Casos incluem duas conexões reais, privacidade da escolha, reconexão, transações PostgreSQL, ação repetida, revisão antiga, cicatrizes e uma expedição completa.

## Arquitetura

Cliente React/Vite → Socket.IO → serviço de salas e motor puro → PostgreSQL. Um processo escreve cada sala; os comandos entram em uma fila por sala. Persistir vem antes do broadcast. O cliente recebe apenas o estado permitido e ignora snapshots regressivos.

Redis não é necessário para essa implantação. Em múltiplas instâncias, será necessário definir propriedade/fencing das salas e roteamento antes de adicionar um adapter. Redis Pub/Sub não será usado como único lugar onde a partida existe.

[System design detalhado](docs/ARCHITECTURE.md), [curadoria de packs](docs/ASSETS-PACKS.md), [curadoria de jogos](docs/ASSETS-GAMES.md), [mapas de assets](docs/asset-mapping.json).

## Arte, áudio e licenças

- `public/assets/packs`: arquivos CC0 usados na mesa, seleções de áudio e modelos GLB.
- `public/assets/games`: alternativas curadas de Dungeon Crawl Stone Soup, Flare e Wesnoth, com licenças próprias.
- `assets/catalog-*.json`: autoria, fonte, hashes e status de cada origem.
- `assets/library`: downloads e extrações locais grandes; ignorados no Git. Fontes preferidas necessárias dos assets curados ficam também na árvore pública quando aplicável.
- A biblioteca acessível pelo navegador permite inspecionar a direção e ouvir os sons sem abrir arquivos de código.

Oryx não foi adquirido. Anokolisa foi baixado para avaliação local e fica fora da distribuição pública porque seus termos não deixam clara a redistribuição do pacote bruto. Arte de Diablo e D&D comerciais não foi importada.

## Biblioteca completa de origem

Os catálogos fixam revisões e hashes. Para baixar/revalidar os snapshots de jogos, use `uv run scripts/assets/download_sources.py`. Downloads completos já existentes são reutilizados quando o hash confere. É uma operação de vários GB; a biblioteca fica fora do Git e da imagem Docker. Os scripts de curadoria em `scripts/assets` documentam a seleção. Eles não executam programas nem projetos Blender baixados.

## Limites desta versão

É uma primeira versão jogável, não o catálogo completo do tabuleiro. Há quatro desafios digitais; faltam as demais restrições, física detalhada, polimento do balanceamento, espectador, transferência de controle, acessibilidade de todos os desafios, expiração de salas e testes de carga. Não há matchmaking, pagamentos, anúncios, rastreamento ou dependência de Redis.

A implementação grava o snapshot atual e histórico diagnóstico; não há reconstrução completa por replay de todos os eventos. A configuração suporta uma instância de aplicação; não a escale horizontalmente sem implementar a posse exclusiva descrita no system design.
