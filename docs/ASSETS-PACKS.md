# Packs de arte e áudio

Importação local em 16 de novembro de 2026. O inventário de origem é `assets/catalog-packs.json`; o manifest para o navegador é `public/assets/packs/manifest.json`. A seleção inicial publicada é CC0. A licença do código não substitui a licença dos assets.

## Organização

- `assets/library/packs/<id>/`: arquivo original, extração completa e, quando obtida nesta sessão, página de origem. Acervo local de avaliação, aproximadamente 164 MB. Deve ficar ignorado no Git para evitar publicar bibliotecas de terceiros desnecessárias e inflar o repositório.
- `public/assets/packs/0x72/`: frames originais, atlas, lista de tiles e nota de licença. A família principal dos heróis, inimigos e cenário.
- `public/assets/packs/audio/`: seleção pequena de efeitos e duas músicas, copiados sem alteração; nome funcional aponta para o original no manifest.
- `public/assets/packs/kenney-casino-audio/Audio/` e `kenney-rpg-audio/Audio/`: packs completos pequenos de efeitos CC0 para seleção por evento.
- `public/assets/packs/tiny-dungeon/`, `fantasy-ui-borders/` e `ui-pixel-adventure/`: candidatos alternativos CC0 para a galeria.
- `public/assets/packs/mini-dungeon-3d/models/`: 30 modelos GLB e `Textures/colormap.png`, além da licença na pasta pai. Os GLBs usam textura externa relativa; não mover os arquivos sem preservar essa árvore.

A árvore de runtime contém aproximadamente 8,2 MB de arquivos antes da compressão HTTP. Originais não são dependências do cliente. Nenhum executável de jogo foi instalado.

## Conteúdo obtido

| ID | Autor | Material completo local | Licença | Uso inicial |
| --- | --- | --- | --- | --- |
| `0x72-dungeon` | 0x72 | Dungeon Tileset II v1.7, 752 entradas de arquivo na extração, incluindo metadados macOS | CC0 | Frames e atlas em runtime; 8 arquétipos e 6 chefões mapeados |
| `kenney-tiny-dungeon` | Kenney | Tiny Dungeon 1.0 | CC0 | Alternativa visual e galeria |
| `kenney-fantasy-ui-borders` | Kenney | Fantasy UI Borders | CC0 | Painéis e molduras alternativas |
| `kenney-ui-pixel-adventure` | Kenney | UI Pack Pixel Adventure | CC0 | Botões e painéis alternativos |
| `kenney-casino-audio` | Kenney | Casino Audio, incluindo dados, cartas e fichas | CC0 | Lançar, agitar e recolher dados; distribuição de cartas |
| `kenney-rpg-audio` | Kenney | RPG Audio | CC0 | Passos, portas, equipamento e moedas |
| `rubberduck-rpg-sfx` | rubberduck | 80 arquivos OGG | CC0 | Impactos, magia, criaturas e tesouro |
| `subspace-retro-sfx` | Juhani Junkala / SubspaceAudio | 512 efeitos e arquivo de leitura | CC0 | Biblioteca local alternativa de efeitos eletrônicos |
| `three-red-hearts` | Abstraction / Tallbeard Studios | 21 faixas OGG, metadados, licença e leitura | CC0 | Sanctuary para exploração; Rumble at the Gates para batalha |
| `kenney-mini-dungeon` | Kenney | Mini Dungeon, 30 objetos em GLB, OBJ e FBX, texturas e prévias | CC0 | Modelos de humano, orc, cenário e props para a galeria 3D |
| `anokolisa-pixel-crawler` | Anokolisa | Pixel Crawler Free Pack Exterior 0.1, PNGs, Aseprite e Terms.txt | Licença própria | Somente avaliação local nesta etapa |

Oryx 16-Bit Fantasy está registrado como `not-purchased`. Não foi feita compra nem foram baixados arquivos pagos. Diablo e os arcades de D&D não fazem parte deste acervo; não foi identificada permissão para publicar seus assets no projeto.

Os termos incluídos no ZIP Anokolisa permitem uso em jogos e alterações, mas não deixam explícita a republicação de um espelho de arquivos-fonte como biblioteca de assets. Por isso este candidato permanece no acervo local, sem cópia em `public/`. Isso não impede usar a seleção CC0 já disponível.

## Correspondência dos heróis

Todas as URLs começam em `/assets/packs/0x72/frames/`. O manifest lista os quatro quadros de espera de cada arquétipo e suas dimensões; o cliente pode alternar os frames sem recortar atlas.

| Arquétipo de demonstração | Arquivo inicial | Dimensão nativa |
| --- | --- | --- |
| Cavaleiro | `knight_m_idle_anim_f0.png` | 16 × 28 |
| Elfo | `elf_m_idle_anim_f0.png` | 16 × 28 |
| Mago | `wizzard_m_idle_anim_f0.png` | 16 × 28 |
| Lagarto | `lizard_m_idle_anim_f0.png` | 16 × 28 |
| Ladino | `masked_orc_idle_anim_f0.png` | 16 × 23 |
| Anão | `dwarf_m_idle_anim_f0.png` | 16 × 28 |
| Goblin | `goblin_idle_anim_f0.png` | 16 × 16 |
| Clérigo | `angel_idle_anim_f0.png` | 16 × 16 |

`wizzard` é a grafia original do pack. Os papéis ladino e clérigo são escolhas de adaptação visual para os personagens originais da demonstração, não a identidade oficial dos sprites nem das fichas de Dungeon Fighter. Há variações femininas, de corrida e de dano para vários personagens.

## Correspondência dos chefões

| Arquétipo | Arquivo inicial | Dimensão nativa |
| --- | --- | --- |
| Demônio | `big_demon_idle_anim_f0.png` | 32 × 36 |
| Zumbi gigante | `big_zombie_idle_anim_f0.png` | 32 × 36 |
| Chort | `chort_idle_anim_f0.png` | 16 × 23 |
| Ogro | `ogre_idle_anim_f0.png` | 32 × 36 |
| Necromante | `necromancer_anim_f0.png` | 16 × 23 |
| Lodo | `slug_anim_f0.png` | 16 × 23 |

Usar ampliação inteira e `image-rendering: pixelated`, preservando proporção. Os três inimigos grandes têm arte maior nativa; os demais precisam de encenação e efeitos para transmitir a presença de chefão, não somente escala.

## Correspondência do áudio

| Evento | URL | Arquivo original e autor |
| --- | --- | --- |
| Lançar dado | `/assets/packs/audio/throw.ogg` | `Audio/die-throw-1.ogg`, Kenney Casino Audio |
| Agitar | `/assets/packs/audio/shake.ogg` | `Audio/dice-shake-1.ogg`, Kenney Casino Audio |
| Carta | `/assets/packs/audio/card.ogg` | `Audio/card-place-1.ogg`, Kenney Casino Audio |
| Embaralhar | `/assets/packs/audio/shuffle.ogg` | `Audio/card-shuffle.ogg`, Kenney Casino Audio |
| Tesouro | `/assets/packs/audio/coin.ogg` | `item_coins_01.ogg`, rubberduck |
| Acerto | `/assets/packs/audio/hit.ogg` | `blade_01.ogg`, rubberduck |
| Magia | `/assets/packs/audio/magic.ogg` | `spell_fire_01.ogg`, rubberduck |
| Criatura | `/assets/packs/audio/roar.ogg` | `creature_roar_01.ogg`, rubberduck |
| Queda | `/assets/packs/audio/defeat.ogg` | `creature_die_01.ogg`, rubberduck |
| Interface | `/assets/packs/audio/ui.ogg` | `book_01.ogg`, rubberduck |
| Exploração | `/assets/packs/audio/exploration.ogg` | `Three Red Hearts - Sanctuary.ogg`, Abstraction |
| Batalha | `/assets/packs/audio/battle.ogg` | `Three Red Hearts - Rumble at the Gates.ogg`, Abstraction |

Os arquivos selecionados estão intactos; seus hashes estão no manifest. Habilitar som após interação do jogador e oferecer controle independente de música e efeitos. A mixagem e o loop final devem ser validados jogando, não inferidos do nome do arquivo.

## Procedência e validação

As fontes oficiais, data de consulta e SHA-256 dos arquivos originais estão no catálogo. Os ZIPs passaram por verificação de CRC e proteção contra caminhos que escapam do diretório de extração. Arquivos de runtime foram copiados sem edição visual ou sonora. Os nomes dos frames, a existência de todas as seleções e as texturas relativas dos GLBs foram conferidos.

Os downloads do Kenney usam o botão oficial sem doação, que gera um endereço temporário. Foram usados os cabeçalhos de origem e a sessão do site; o catálogo registra a página pública estável, sem registrar os links assinados efêmeros. Os primeiros três pacotes vieram dos arquivos publicados anteriormente pelos autores no OpenGameArt. As páginas do itch.io de 0x72, Anokolisa e Tallbeard oferecem download gratuito e também foram usadas pelos endpoints normais do próprio site.

## Fontes

- https://0x72.itch.io/dungeontileset-ii
- https://kenney.nl/assets/tiny-dungeon
- https://kenney.nl/assets/fantasy-ui-borders
- https://kenney.nl/assets/ui-pack-pixel-adventure
- https://kenney.nl/assets/casino-audio
- https://kenney.nl/assets/rpg-audio
- https://opengameart.org/content/80-cc0-rpg-sfx
- https://opengameart.org/content/512-sound-effects-8-bit-style
- https://tallbeard.itch.io/three-red-hearts-prepare-to-dev
- https://opengameart.org/content/mini-dungeon
- https://anokolisa.itch.io/free-pixel-art-asset-pack-topdown-tileset-rpg-16x16-sprites
- https://www.oryxdesignlab.com/products/p/16-bit-fantasy-tileset
