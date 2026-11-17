# Direção de jogo retrô

A versão 0.2 usa um mapa visto de cima como palco principal. A guilda chega à vila, o líder escolhe uma rota, a sala escolhida ocupa o cenário e o encontro apresenta o inimigo. O alvo de dados é o controle do combate; os heróis e o adversário executam a sequência de ataque no mapa.

## Referências estudadas em 17/11/2026

| Referência | Material consultado | Aplicação no jogo |
| --- | --- | --- |
| [Tuxemon](https://github.com/Tuxemon/Tuxemon) | Snapshot parcial `4e63c45b436d372daae9f802bb5efa44232fe151`: `combat_state.py`, `combat_animations.py`, `transition_wipe.py` e mapas Tiled | Separar regras, apresentação e duração das ações; entradas dos personagens, HUD do adversário, fala e transição de cena |
| [Decompilação de Pokémon Emerald](https://github.com/pret/pokeemerald/blob/master/src/battle_transition.c) | Consulta da implementação pública de transições, sem importar arquivos para o runtime | Um encontro tem preparação, apresentação e combate; a mudança de estado deve ser percebida visualmente |
| [0x72 Dungeon Tileset II](https://0x72.itch.io/dungeontileset-ii) | Frames idle/run e tiles CC0 já disponíveis na biblioteca local | Cenários, personagens, corrida curta e adversários |

O código do Tuxemon consultado declara GPL-3.0 nos arquivos. A cópia parcial fica em `assets/library/games/tuxemon-study`, fora do Git e da imagem. Ela foi baixada para leitura, sem instalar ou executar o jogo. O acervo anterior de Dungeon Crawl, Flare e Wesnoth continua disponível para estudo e curadoria.

As composições da vila, fonte, espelhos, escadaria, biblioteca, tesouraria e salão final são próprias. Os sprites e sons mantêm os créditos e licenças dos catálogos existentes. Nenhuma ROM, música ou sprite de Pokémon está incluído na distribuição. O material de pesquisa não concede uma licença de redistribuição sobre os assets de Pokémon.

## Arremesso com habilidade e sorte

A mira escolhe a região pretendida. Segurar o botão ou a barra de espaço movimenta o medidor; soltar perto da faixa de 62% melhora a precisão. Há também um botão de lançamento com precisão moderada para quem prefere não segurar.

O servidor valida direção, força, elevação e momento de soltura. Ele sorteia uma dispersão independente nos dois eixos, com 12% de chance de um quique de maior dispersão, e sorteia a face do dado. Mesmo uma entrada perfeita não fixa o destino. O cliente não escolhe o resultado, o dano, a trajetória final ou a face.

Na amostra reproduzível do teste (6.000 tentativas por configuração), entradas perfeitas produziram 9,65% de centros e pontuação média 4,86; soltura no início do medidor produziu 2,43% de centros e média 3,36. Esses números descrevem essa simulação de teste, não uma promessa de resultado a cada jogador. O treino usa a mesma geometria e dispersão, com entropia local, e não revela a próxima jogada do servidor.

O resultado confirmado é persistido antes do broadcast. Repetir o mesmo comando recupera o resultado original e não sorteia outra vez. As animações apresentam esse resultado; elas não alteram vida, inventam resultados ou dependem de um jogador terminar a animação para salvar a ação.

## Áudio e acessibilidade

Música e efeitos começam habilitados. A música tenta tocar ao abrir a página e novamente na primeira interação caso o navegador bloqueie autoplay. As preferências de desligar o áudio ficam salvas neste navegador. A mudança entre trilha de exploração e combate acompanha o estado da partida.

Rotas aceitam mouse e setas para cima/baixo. A mira tem controles de teclado, o lançamento aceita teclado e toque e há uma alternativa sem pressão contínua. As animações respeitam `prefers-reduced-motion`. A política de autoplay segue o [guia de mídia do MDN](https://developer.mozilla.org/en-US/docs/Web/Media/Guides/Autoplay).
