export type Color = "red" | "green" | "blue" | "white";
export type Power = "strike" | "heal" | "dodge" | "gold" | "reroll" | "double";
export type HeroDef = {
  id: string;
  name: string;
  title: string;
  description: string;
  sprite: string;
  powers: Record<"red" | "green" | "blue", Power>;
};
export const powerInfo: Record<Power, { name: string; description: string }> = {
  strike: {
    name: "Golpe certeiro",
    description: "Um acerto causa +3 de dano.",
  },
  heal: {
    name: "Fôlego de equipe",
    description: "Todos os heróis conscientes recuperam 1 de vida.",
  },
  dodge: {
    name: "Passo de sombra",
    description: "Em um erro, evita o contra-ataque e causa 2 de dano.",
  },
  gold: { name: "Mãos ligeiras", description: "Adiciona 1 moeda ao baú." },
  reroll: {
    name: "Outra chance",
    description:
      "Escolha ignorar o resultado e lançar novamente o mesmo dado, uma vez por turno.",
  },
  double: {
    name: "Ataque duplo",
    description:
      "Ao acertar, lança o mesmo dado outra vez sem bônus de arma. Uma vez por turno.",
  },
};
const frame = (name: string) =>
  `/assets/packs/0x72/frames/${name}_idle_anim_f0.png`;
export const heroes: HeroDef[] = [
  {
    id: "ferro",
    name: "Ferro",
    title: "O cavaleiro improvável",
    description: "Escudo amassado, coragem intacta.",
    sprite: frame("knight_m"),
    powers: { red: "strike", green: "dodge", blue: "double" },
  },
  {
    id: "runa",
    name: "Runa",
    title: "A guardiã da floresta",
    description: "Uma flecha, duas possibilidades.",
    sprite: frame("elf_f"),
    powers: { red: "strike", green: "heal", blue: "reroll" },
  },
  {
    id: "brasa",
    name: "Brasa",
    title: "O cozinheiro de batalha",
    description: "Nenhum monstro resiste ao tempero.",
    sprite: frame("goblin"),
    powers: { red: "strike", green: "gold", blue: "heal" },
  },
  {
    id: "torga",
    name: "Torga",
    title: "A última a cair",
    description: "Pequena estatura. Grande problema.",
    sprite: frame("dwarf_f"),
    powers: { red: "strike", green: "dodge", blue: "double" },
  },
  {
    id: "pingo",
    name: "Pingo",
    title: "O colecionador de azar",
    description: "As moedas simplesmente o encontram.",
    sprite: frame("lizard_m"),
    powers: { red: "gold", green: "dodge", blue: "reroll" },
  },
  {
    id: "vera",
    name: "Vera",
    title: "A médica sem fronteiras",
    description: "Um curativo entre cada encrenca.",
    sprite: frame("doc"),
    powers: { red: "heal", green: "dodge", blue: "reroll" },
  },
  {
    id: "bruma",
    name: "Bruma",
    title: "A batedora de ruínas",
    description: "Vê uma saída onde todos veem parede.",
    sprite: frame("elf_m"),
    powers: { red: "strike", green: "gold", blue: "reroll" },
  },
  {
    id: "fuligem",
    name: "Fuligem",
    title: "O mago de segunda viagem",
    description: "Desta vez ele leu o feitiço inteiro.",
    sprite: frame("wizzard_m"),
    powers: { red: "strike", green: "heal", blue: "double" },
  },
];
export type Enemy = {
  id: string;
  name: string;
  sprite: string;
  hp: number;
  damage: number;
  level: number;
  gold: number;
  trait: "none" | "rabid" | "tricky" | "resistant" | "greedy";
  description: string;
};
export const monsters: Enemy[] = [
  {
    id: "rat",
    name: "O cobrador das catacumbas",
    sprite: "/assets/packs/0x72/frames/imp_idle_anim_f0.png",
    hp: 7,
    damage: 1,
    level: 1,
    gold: 2,
    trait: "greedy",
    description: "Erros custam também uma moeda ao grupo.",
  },
  {
    id: "orc",
    name: "Guarda do turno da noite",
    sprite: frame("orc_warrior"),
    hp: 10,
    damage: 2,
    level: 1,
    gold: 2,
    trait: "none",
    description: "Só queria terminar o expediente.",
  },
  {
    id: "skull",
    name: "Esqueleto de respeito",
    sprite: frame("skelet"),
    hp: 13,
    damage: 2,
    level: 2,
    gold: 3,
    trait: "tricky",
    description: "A região de valor 1 conta como erro.",
  },
  {
    id: "ogre",
    name: "Fiscal de masmorra",
    sprite: frame("ogre"),
    hp: 16,
    damage: 3,
    level: 2,
    gold: 3,
    trait: "rabid",
    description: "Em um erro, todo o grupo recebe o contra-ataque.",
  },
  {
    id: "chort",
    name: "Diabrete do mau conselho",
    sprite: frame("chort"),
    hp: 20,
    damage: 3,
    level: 3,
    gold: 4,
    trait: "resistant",
    description:
      "Dano ímpar de um acerto é dividido por dois, arredondado para baixo.",
  },
  {
    id: "zombie",
    name: "O funcionário do mês",
    sprite: frame("big_zombie"),
    hp: 25,
    damage: 4,
    level: 4,
    gold: 5,
    trait: "none",
    description: "Não descansa nem depois de morrer.",
  },
];
export const bosses: Enemy[] = [
  {
    id: "demon",
    name: "O síndico do abismo",
    sprite: frame("big_demon"),
    hp: 38,
    damage: 4,
    level: 4,
    gold: 0,
    trait: "rabid",
    description: "Quando um erra, todo mundo paga.",
  },
  {
    id: "lich",
    name: "A contadora de almas",
    sprite: "/assets/packs/0x72/frames/necromancer_anim_f0.png",
    hp: 35,
    damage: 4,
    level: 4,
    gold: 0,
    trait: "tricky",
    description: "O anel exterior não perdoa.",
  },
  {
    id: "king",
    name: "Rei dos atrasados",
    sprite: frame("big_zombie"),
    hp: 42,
    damage: 4,
    level: 4,
    gold: 0,
    trait: "resistant",
    description: "Dano ímpar perde metade de sua força.",
  },
  {
    id: "overlord",
    name: "O ogro de condomínio",
    sprite: frame("ogre"),
    hp: 40,
    damage: 5,
    level: 4,
    gold: 0,
    trait: "none",
    description: "O aluguel do covil está atrasado.",
  },
  {
    id: "fiend",
    name: "Senhor das pequenas letras",
    sprite: frame("chort"),
    hp: 36,
    damage: 4,
    level: 4,
    gold: 0,
    trait: "greedy",
    description: "Erros também esvaziam o baú.",
  },
  {
    id: "slime",
    name: "A geleia ancestral",
    sprite: "/assets/packs/0x72/frames/slug_anim_f0.png",
    hp: 33,
    damage: 4,
    level: 4,
    gold: 0,
    trait: "none",
    description: "Maior que sua coragem, mais pegajosa que seu destino.",
  },
];
export type Dungeon = {
  id: string;
  name: string;
  description: string;
  steps: number;
  effect: "gold" | "heal" | "die" | "none";
  challenge: "none" | "blind" | "inverted" | "doubleBounce";
  hpBonus: number;
};
export const dungeons: Dungeon[] = [
  {
    id: "torches",
    name: "Galeria das últimas tochas",
    description: "A luz é pouca. O azar, abundante.",
    steps: 3,
    effect: "none",
    challenge: "none",
    hpBonus: 0,
  },
  {
    id: "mirror",
    name: "Salão do espelho torto",
    description: "Aqui até a mira muda de lado.",
    steps: 4,
    effect: "gold",
    challenge: "inverted",
    hpBonus: 1,
  },
  {
    id: "fountain",
    name: "Fonte da boa desculpa",
    description: "Um pequeno alívio antes da encrenca.",
    steps: 2,
    effect: "heal",
    challenge: "none",
    hpBonus: 0,
  },
  {
    id: "dark",
    name: "Biblioteca das luzes apagadas",
    description: "Memorize o alvo: ele some durante a mira.",
    steps: 4,
    effect: "die",
    challenge: "blind",
    hpBonus: 1,
  },
  {
    id: "stairs",
    name: "Escadaria de dois tombos",
    description: "A força precisa garantir dois quiques.",
    steps: 3,
    effect: "gold",
    challenge: "doubleBounce",
    hpBonus: 0,
  },
  {
    id: "treasury",
    name: "Tesouraria pouco vigiada",
    description: "Uma moeda antes do próximo perigo.",
    steps: 2,
    effect: "gold",
    challenge: "none",
    hpBonus: 2,
  },
];
export type Equipment = {
  id: string;
  name: string;
  kind: "weapon" | "armor" | "potion";
  cost: number;
  description: string;
  sprite: string;
};
export const equipment: Equipment[] = [
  {
    id: "blade",
    name: "Espada quase lendária",
    kind: "weapon",
    cost: 3,
    description: "+2 de dano em acertos.",
    sprite: "/assets/packs/0x72/frames/weapon_regular_sword.png",
  },
  {
    id: "axe",
    name: "Machado de expediente",
    kind: "weapon",
    cost: 4,
    description: "+2 de dano em acertos.",
    sprite: "/assets/packs/0x72/frames/weapon_axe.png",
  },
  {
    id: "armor",
    name: "Escudo de segunda mão",
    kind: "armor",
    cost: 3,
    description: "Evita 2 de dano de um erro, uma vez por combate.",
    sprite: "/assets/packs/0x72/frames/flask_blue.png",
  },
  {
    id: "potion",
    name: "Poção de continuar tentando",
    kind: "potion",
    cost: 2,
    description: "Recupera 3 de vida de um herói consciente.",
    sprite: "/assets/packs/0x72/frames/flask_red.png",
  },
];
export const challengeInfo: Record<
  Dungeon["challenge"],
  { name: string; description: string }
> = {
  none: {
    name: "Arremesso livre",
    description: "Mire e ajuste a força. O dado precisa quicar antes do alvo.",
  },
  blind: {
    name: "Às cegas",
    description: "O alvo fica oculto enquanto você prepara a mira.",
  },
  inverted: {
    name: "Mira invertida",
    description: "A direção horizontal do arremesso é invertida.",
  },
  doubleBounce: {
    name: "Dois quiques",
    description: "Use elevação de pelo menos 65% para garantir dois quiques.",
  },
};
export const contentVersion = "original-demo-1";
