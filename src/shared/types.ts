import type { Color, Dungeon, Enemy } from "./content";
export type Phase =
  | "lobby"
  | "path"
  | "combat"
  | "reaction"
  | "rest"
  | "shop"
  | "won"
  | "lost";
export type Player = {
  id: string;
  name: string;
  tokenHash: string;
  heroId: string;
  ready: boolean;
};
export type Hero = {
  id: string;
  owner: string;
  hp: number;
  maxHp: number;
  scars: ("red" | "green" | "blue")[];
  fainted: boolean;
  eliminated: boolean;
  weapon: string | null;
  armor: boolean;
  armorUsed: boolean;
  potions: number;
};
export type Shot = {
  id: string;
  heroId: string;
  color: Color;
  x: number;
  y: number;
  icon: boolean;
  hit: boolean;
  bullseye: boolean;
  value: number;
  bounces: number;
  points: { x: number; y: number; z: number }[];
  reason: string;
  damage: number;
  ability?: "red" | "green" | "blue";
  powerName?: string;
  precision?: number;
  at?: number;
  counterTargets?: string[];
};
export type LogEntry = {
  speakerId?: string;
  id: number;
  text: string;
  kind: "info" | "good" | "bad";
  at: number;
};
export type Room = {
  code: string;
  host: string;
  revision: number;
  createdAt: number;
  updatedAt: number;
  contentVersion: string;
  players: Player[];
  heroes: Hero[];
  phase: Phase;
  difficulty: "normal" | "hard" | "inferno";
  leader: number;
  active: number;
  gold: number;
  whiteDice: number;
  available: ("red" | "green" | "blue")[];
  shopCount: number;
  progress: number;
  round: number;
  room: Dungeon | null;
  candidates: Dungeon[];
  roomDeck: Dungeon[];
  monsterDeck: Enemy[];
  boss: Enemy;
  enemy: Enemy | null;
  enemyHp: number;
  enemyMaxHp: number;
  isBoss: boolean;
  shopStock: string[];
  log: LogEntry[];
  lastShot: Shot | null;
  shots: Shot[];
  pending: Shot | null;
  repeatDie: Color | null;
  extraAttack: boolean;
  rerolled: boolean;
  restPending: string[];
  endReason: string | null;
};
export type View = Omit<
  Room,
  "players" | "candidates" | "roomDeck" | "monsterDeck" | "boss"
> & {
  players: Omit<Player, "tokenHash">[];
  candidates: Dungeon[];
  you: string;
  canHost: boolean;
};
export type Command = {
  id: string;
  revision: number;
  type: string;
  payload?: Record<string, unknown>;
};
export type CommandResult = {
  ok: boolean;
  error?: string;
  revision?: number;
  room?: View;
  replayed?: boolean;
};
