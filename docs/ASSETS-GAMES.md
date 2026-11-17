# Assets de jogos e fontes 3D

Biblioteca de referência para a implementação open source. Todos os arquivos públicos são cópias inalteradas, com origem, autor, licença e SHA-256 em [`assets/catalog-games.json`](../assets/catalog-games.json). A curadoria está separada por estilo; não misturar sprites de 32 e 72 pixels com o pack principal por acidente.

## Estado dos downloads

| Projeto | Revisão fixada | Estado | Arquivo comprimido | Arquivos extraídos |
| --- | --- | --- | --- | --- |
| dcss | `a6ea1655db5c` | complete | 4.6 MiB | 7414 |
| flare | `c641d2ac2801` | complete | 595.9 MiB | 2499 |
| flare-art | `8830c68b420b` | complete | 1912.8 MiB | 2039 |
| wesnoth | `d95858d3638d` | complete | 676.1 MiB | 29071 |

Os originais completos e extrações ficam em `assets/library/games`, ignorados pelo Git. Não executar scripts de renderização vindos dos arquivos. O script local `scripts/assets/download_sources.py` registra conclusão e hashes individuais em `*-source.json` e em `sources.json`; `scripts/assets/finalize_catalog.py` pode ser executado de novo para atualizar este relatório após os downloads. A palavra `downloading` não significa um arquivo íntegro pronto para uso.

## Curadoria pronta

São **74 arquivos**, **36.4 MiB**, em `public/assets/games`. O catálogo passa por verificação de SHA-256 e rejeita ponteiros Git LFS no lugar de arquivos.

- **DCSS:** oito alternativas de heróis (knight, wizard, ranger, rogue, cleric, bard, chef, barbarian); seis chefões (dragon, demon, necromancer, minotaur, ghost, slime); 32 texturas/efeitos. PNGs de base32px. O minotauro usa um corpo de jogador permitido, porque `minotaur.png` consta na lista de licença incerta. Os demais arquivos listados em `TILES_UNDER_UNKNOWN_LICENSE.md` também são excluídos por nome.
- **Wesnoth:** oito heróis de 72px e seis criaturas para chefões; o dragão é160x200px. São alternativas visuais, não versões oficiais dos personagens de Dungeon Fighter. Usamos sprites da versão1.12.6, cujo README licencia explicitamente arte, som e música em GPLv2+. As músicas atuais `battle.ogg` e `underground.ogg` têm autor e licença individual verificados no CSV do projeto, incluindo MD5.
- **Flare:** três efeitos CC0 (porta, impacto em esqueleto e em zumbi); músicas de batalha, chefão e masmorra, de remaxim, CC BY-SA3.0; sheets de minotauro, wyvern e goblin; tileset de masmorra; fontes Blender3D de goblin e minotauro. Os spritesheets permanecem completos, sem recorte; animações exigem usar as coordenadas do projeto de origem.

## Licenças e fonte preferida

- DCSS: CC0-1.0 para a seleção; README, artistas e lista de exclusões estão junto dos PNGs em `public/assets/games/dcss`. O pacote não torna todos os arquivos do jogo CC0.
- Flare: cada arquivo tem licença explícita no catálogo; os créditos por arquivo, créditos gerais e textos CC BY/CC BY-SA acompanham a seleção. O autor do minotauro e do goblin é Clint Bellanger; as texturas do wyvern também creditam Justin Nichol. As músicas selecionadas são de remaxim.
- Wesnoth: COPYING GPLv2, README original da versão1.12.6 e copyright acompanham os PNGs. O README define a forma modificável entregue pelo autor como a fonte preferida para arte, som e música; os PNGs inalterados são distribuídos aqui, com URL fixada do upstream. As músicas incluem registros individuais de autoria em `copyrights-current-audio.csv`.
- O fato de o nosso jogo ser gratuito não substitui essas condições. Nenhum arquivo proprietário de Diablo, Capcom ou pacote pago sem compra foi importado.

## Fontes 3D

Os `.blend` selecionados têm payload real, não os pequenos ponteiros que a API raw retorna para Git LFS. Os dois objetos foram resolvidos via `media.githubusercontent.com` e comparados com o hash SHA-256 e tamanho declarados nos ponteiros. Ficam em `public/assets/games/flare/models`. São fontes de trabalho para Blender, não modelos GLB prontos para carregar no navegador. As dependências de materiais e texturas devem ser abertas com o projeto de origem antes de converter; os fontes completos ficam na biblioteca quando o arquivo HD termina. O snapshot HD pode conter outros ponteiros LFS ainda não resolvidos, portanto não se afirma que todo modelo3D do projeto esteja pronto.

## Mapeamento e integração

O arquivo [`asset-mapping.json`](asset-mapping.json) relaciona oito arquétipos de herói e seis de chefão ao DCSS e propõe alternativas do Wesnoth. Preserva caminho e identidade da origem; um troll do Wesnoth é rotulado como troll, sem fingir que é um minotauro. O mapa é material de adaptação, não correspondência de arte oficial do jogo de tabuleiro.

URLs de integração:

```text
/assets/games/dcss/heroes/{knight,wizard,ranger,rogue,cleric,bard,chef,barbarian}.png
/assets/games/dcss/bosses/{dragon,demon,necromancer,minotaur,ghost,slime}.png
/assets/games/wesnoth/heroes/{knight,wizard,ranger,rogue,cleric,bard,chef,barbarian}.png
/assets/games/wesnoth/bosses/{dragon,yeti,necromancer,troll,fireghost,mudcrawler}.png
/assets/games/flare/audio/{door,skeleton-hit,zombie-hit}.ogg
/assets/games/flare/music/{battle,boss,dungeon}.ogg
/assets/games/flare/models/{goblin,minotaur}.blend
/assets/games/catalog.json
```

O conteúdo3D e as músicas são alternativas para avaliação; não devem ser baixados no carregamento inicial do jogo. Áudio deve usar carregamento sob demanda. A licença dos arquivos públicos permanece independente da licença escolhida para o código.
