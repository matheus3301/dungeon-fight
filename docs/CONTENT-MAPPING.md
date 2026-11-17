# Conteúdo e direção de arte

A partida usa os personagens expressivos do 0x72. Outras origens ficam disponíveis na biblioteca e podem ser adotadas após uma revisão de escala/paleta. O objetivo é manter a mesa coerente, preservando as opções de 2D e 3D.

| Personagem original | Papel | Sprite 0x72 | Alternativa DCSS | Modelo 3D opcional |
| --- | --- | --- | --- | --- |
| Ferro | Cavaleiro | knight_m | knight | character-human GLB |
| Runa | Guardiã | elf_f | ranger | character-human GLB |
| Brasa | Cozinheiro | goblin | chef | character-orc GLB |
| Torga | Guerreira | dwarf_f | barbarian | character-human GLB |
| Pingo | Ladino | lizard_m | rogue | character-orc GLB |
| Vera | Médica | doc | cleric | character-human GLB |
| Bruma | Batedora | elf_m | bard | character-human GLB |
| Fuligem | Mago | wizzard_m | wizard | character-human GLB |

O papel é uma escolha de adaptação, não a identidade original do sprite. Não se afirma que os GLBs já possuem todas as animações ou equipamentos necessários aos papéis acima.

| Chefão original | Sprite da partida | Alternativa do acervo |
| --- | --- | --- |
| Síndico do abismo | big_demon | DCSS demon |
| Contadora de almas | necromancer | DCSS necromancer |
| Rei dos atrasados | big_zombie | Wesnoth yeti |
| Ogro de condomínio | ogre | DCSS minotaur selecionado ou Wesnoth troll |
| Senhor das pequenas letras | chort | DCSS dragon, mudando também conceito e nome |
| Geleia ancestral | slug | DCSS slime |

Personagens, nomes, baralhos e poderes em `src/shared/content.ts` são conteúdo original de demonstração. A mecânica é inspirada em Dungeon Fighter, mas não reproduz as fichas e cartas oficiais não recuperadas. A probabilidade de ícone do simulador atual é 1/3 por decisão do protótipo; não foi validada contra as faces do jogo físico.

O simulador atual usa trajetória paramétrica, regiões elípticas e dois buracos. Não simula colisões entre cubos, footprint dos cantos, atrito físico ou todas as 26 restrições. Há quatro desafios digitais: livre, mira invertida, memória do alvo e dois quiques. O cliente de treino é determinístico; a partida acrescenta pequena variação no servidor. Balanceamento ainda será testado com grupos reais.

Os dados, alvo e layout são desenhados em código. As imagens e áudios de terceiros mantêm autoria e licença nos manifests e documentos ASSETS. Não existe licença de uso de arte comercial de Diablo ou Capcom neste repositório.
