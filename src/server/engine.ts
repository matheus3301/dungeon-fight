import { trajectory } from "../shared/trajectory";
import { randomInt, randomUUID } from "node:crypto";
import {
  heroes as definitions,
  dungeons,
  monsters,
  bosses,
  equipment,
  powerInfo,
  contentVersion,
  type Color,
} from "../shared/content";
import type { Room, Hero, Shot, Command, View, Player } from "../shared/types";
export class RuleError extends Error {}
function requireRule(ok: unknown, message: string): asserts ok {
  if (!ok) throw new RuleError(message);
}
export function shuffle<T>(items: T[]): T[] {
  const a = structuredClone(items);
  for (let i = a.length - 1; i > 0; i--) {
    const j = randomInt(i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
export function addLog(
  r: Room,
  text: string,
  kind: "info" | "good" | "bad" = "info",
) {
  r.log.push({ id: (r.log.at(-1)?.id ?? 0) + 1, text, kind, at: Date.now() });
  r.log = r.log.slice(-80);
}
export function createRoom(code: string, player: Player): Room {
  return {
    code,
    host: player.id,
    revision: 0,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    contentVersion,
    players: [player],
    heroes: [],
    phase: "lobby",
    difficulty: "normal",
    leader: 0,
    active: 0,
    gold: 0,
    whiteDice: 2,
    available: ["red", "green", "blue"],
    shopCount: 0,
    progress: 0,
    round: 0,
    room: null,
    candidates: [],
    roomDeck: shuffle([...dungeons, ...dungeons, ...dungeons]),
    monsterDeck: [
      ...shuffle([monsters[0], monsters[0], monsters[1]]),
      ...shuffle([monsters[2], monsters[2], monsters[3]]),
      ...shuffle([monsters[4], monsters[4], monsters[4]]),
      ...Array.from({ length: 12 }, () => structuredClone(monsters[5])),
    ],
    boss: structuredClone(bosses[randomInt(bosses.length)]),
    enemy: null,
    enemyHp: 0,
    enemyMaxHp: 0,
    isBoss: false,
    shopStock: [],
    log: [
      {
        id: 1,
        text: "A mesa está aberta. Uma boa história começa com uma péssima ideia.",
        kind: "info",
        at: Date.now(),
      },
    ],
    lastShot: null,
    shots: [],
    pending: null,
    repeatDie: null,
    extraAttack: false,
    rerolled: false,
    restPending: [],
    endReason: null,
  };
}
export function view(r: Room, you: string): View {
  const { roomDeck, monsterDeck, boss, candidates, players, ...pub } = r;
  return structuredClone({
    ...pub,
    players: players.map(({ tokenHash, ...p }) => p),
    candidates: r.heroes[r.leader]?.owner === you ? candidates : [],
    you,
    canHost: r.host === you,
  });
}
function heroState(id: string, owner: string): Hero {
  return {
    id,
    owner,
    hp: 9,
    maxHp: 9,
    scars: [],
    fainted: false,
    eliminated: false,
    weapon: null,
    armor: false,
    armorUsed: false,
    potions: 0,
  };
}
const conscious = (h: Hero) => !h.fainted && !h.eliminated && h.hp > 0;
function activeHero(r: Room, actor: string): Hero {
  const h = r.heroes[r.active];
  requireRule(h && h.owner === actor, "Agora é o turno de outro aventureiro.");
  requireRule(conscious(h), "Este herói não pode agir neste combate.");
  return h;
}
function nextHero(r: Room, after: number): number {
  for (let i = 1; i <= r.heroes.length; i++) {
    const n = (after + i) % r.heroes.length;
    if (conscious(r.heroes[n])) return n;
  }
  return -1;
}
function preparePath(r: Room) {
  r.phase = "path";
  r.room = null;
  r.enemy = null;
  r.lastShot = null;
  r.candidates = [r.roomDeck.shift()!, r.roomDeck.shift()!];
  requireRule(r.candidates.every(Boolean), "O baralho de salas acabou.");
  addLog(r, "O líder encontrou dois caminhos. A escolha é secreta.");
}
function beginCombat(r: Room, boss = false) {
  r.shots = [];
  r.lastShot = null;
  r.repeatDie = null;
  r.isBoss = boss;
  r.enemy = structuredClone(boss ? r.boss : r.monsterDeck.shift()!);
  requireRule(r.enemy, "O baralho de monstros acabou.");
  r.enemyMaxHp =
    r.enemy.hp +
    (boss ? 0 : (r.room?.hpBonus ?? 0)) +
    { normal: 0, hard: 3, inferno: 5 }[r.difficulty];
  r.enemyHp = r.enemyMaxHp;
  r.available = ["red", "green", "blue"];
  r.phase = "combat";
  r.active = nextHero(r, r.leader);
  r.extraAttack = false;
  r.rerolled = false;
  r.heroes.forEach((h) => (h.armorUsed = false));
  addLog(
    r,
    `${boss ? "CHEFÃO: " : ""}${r.enemy.name} apareceu com ${r.enemyHp} de vida!`,
    boss ? "bad" : "info",
  );
}
function lose(r: Room, reason: string) {
  r.phase = "lost";
  r.endReason = reason;
  addLog(r, reason, "bad");
}
function finishCombat(r: Room, h: Hero, shot: Shot) {
  if (r.isBoss) {
    r.phase = "won";
    r.endReason = "O chefão caiu. A taverna vai ouvir essa história!";
    addLog(r, r.endReason, "good");
    return;
  }
  const bonus = r.enemyHp <= -3 || (shot.icon && shot.bullseye) ? 1 : 0;
  r.gold += r.enemy!.gold + bonus;
  r.progress += r.room!.steps;
  r.round++;
  r.leader = r.heroes.indexOf(h);
  r.phase = "rest";
  r.restPending = [];
  for (const hero of r.heroes) {
    if (hero.fainted && !hero.eliminated) {
      if (hero.scars.length === 3) {
        hero.eliminated = true;
        addLog(
          r,
          `${definitions.find((x) => x.id === hero.id)!.name} deixou a expedição.`,
          "bad",
        );
      } else r.restPending.push(hero.id);
    }
  }
  if (r.heroes.every((x) => x.eliminated)) {
    lose(r, "Nenhum herói conseguiu continuar.");
    return;
  }
  r.whiteDice = Math.min(9, r.whiteDice);
  r.available = ["red", "green", "blue"];
  r.extraAttack = false;
  r.pending = null;
  addLog(
    r,
    `Vitória! +${r.enemy!.gold + bonus} moedas${bonus ? " (inclui um golpe épico)" : ""}.`,
    "good",
  );
}
function takeDamage(h: Hero, n: number, unpreventable = false) {
  let amount = n;
  if (!unpreventable && h.armor && !h.armorUsed) {
    amount = Math.max(0, n - 2);
    h.armorUsed = true;
  }
  h.hp = Math.max(0, h.hp - amount);
  if (h.hp === 0) h.fainted = true;
}
function nextTurn(r: Room) {
  r.repeatDie = null;
  r.active = nextHero(r, r.active);
  r.rerolled = false;
  r.extraAttack = false;
  if (r.active < 0) {
    lose(r, "Todos os heróis desmaiaram. A masmorra venceu desta vez.");
    return;
  }
  if (r.isBoss && r.available.length === 0 && r.whiteDice === 0)
    lose(r, "Os dados acabaram antes de o chefão cair.");
}
export function simulateShot(
  input: Record<string, unknown>,
  random: () => number = Math.random,
): Omit<Shot, "id" | "heroId" | "color" | "damage"> {
  const number = (name: string) => {
    const n = input[name];
    requireRule(
      typeof n === "number" && Number.isFinite(n) && n >= 0 && n <= 1,
      `Valor inválido de ${name}.`,
    );
    return n;
  };
  const direction = number("direction"),
    power = number("power"),
    loft = number("loft");
  const x = 50 + (direction - 0.5) * 105 + (random() - 0.5) * 2.4,
    y = 94 - (26 + power * 49 + loft * 8) + (random() - 0.5) * 2.4;
  const d = Math.hypot((x - 50) / 35, (y - 43) / 30),
    hole = Math.hypot(x - 32, y - 36) < 2.7 || Math.hypot(x - 68, y - 55) < 2.7;
  const hit = d <= 1 && !hole;
  const bullseye = hit && d < 0.095;
  const value = !hit
    ? 0
    : bullseye
      ? 10
      : d < 0.28
        ? 5
        : d < 0.5
          ? 4
          : d < 0.7
            ? 3
            : d < 0.85
              ? 2
              : 1;
  const points = trajectory(x, y, loft);
  return {
    x,
    y,
    icon: random() < 1 / 3,
    hit,
    bullseye,
    value,
    bounces: loft >= 0.65 ? 2 : 1,
    points,
    reason: hole
      ? "O dado caiu em um buraco."
      : !hit
        ? "O dado saiu do alvo."
        : bullseye
          ? "Na mosca!"
          : `Acerto na região ${value}.`,
  };
}
function resolveShot(r: Room, shot: Shot, ability?: "red" | "green" | "blue") {
  const h = r.heroes.find((x) => x.id === shot.heroId)!;
  const def = definitions.find((x) => x.id === h.id)!;
  const color = shot.color === "white" ? (ability ?? "red") : shot.color;
  if (r.enemy?.trait === "tricky" && shot.value === 1) {
    shot.hit = false;
    shot.bullseye = false;
    shot.reason = "O monstro transforma a região 1 em erro.";
  }
  const power =
    shot.icon && !h.scars.includes(color) ? def.powers[color] : null;
  shot.powerName = power ? powerInfo[power].name : undefined;
  if (power === "reroll" && !r.rerolled) {
    r.pending = shot;
    r.phase = "reaction";
    r.lastShot = shot;
    addLog(r, `${def.name} ativou Outra chance. Manter ou relançar?`);
    return;
  }
  r.pending = null;
  r.phase = "combat";
  let damage = shot.hit ? shot.value : 0;
  if (shot.hit) {
    damage += r.extraAttack ? 0 : h.weapon ? 2 : 0;
    if (power === "strike") damage += 3;
    if (r.enemy?.trait === "resistant" && damage % 2 === 1)
      damage = Math.floor(damage / 2);
  }
  if (power === "heal") {
    for (const hero of r.heroes)
      if (conscious(hero)) hero.hp = Math.min(hero.maxHp, hero.hp + 1);
  }
  if (power === "gold") r.gold++;
  if (!shot.hit) {
    if (power === "dodge") damage = 2;
    else {
      const targets =
        r.enemy!.trait === "rabid" ? r.heroes.filter(conscious) : [h];
      for (const target of targets) takeDamage(target, r.enemy!.damage);
    }
    if (r.enemy!.trait === "greedy") r.gold = Math.max(0, r.gold - 1);
  }
  if (shot.hit && shot.bullseye && shot.icon) {
    damage = r.enemyHp + 3;
    r.enemyHp = -3;
  } else r.enemyHp -= damage;
  shot.damage = damage;
  r.lastShot = shot;
  r.shots.push(shot);
  addLog(
    r,
    `${def.name}: ${shot.reason}${damage ? ` ${damage} de dano.` : ""}${power ? ` ${powerInfo[power].name}.` : ""}`,
    damage ? "good" : "bad",
  );
  if (r.heroes.every((x) => !conscious(x))) {
    lose(r, "Todos os heróis desmaiaram. A masmorra venceu desta vez.");
    return;
  }
  if (r.enemyHp <= 0) {
    finishCombat(r, h, shot);
    return;
  }
  if (power === "double" && shot.hit && !r.extraAttack) {
    r.extraAttack = true;
    if (shot.color === "white") r.whiteDice++;
    else r.available.push(shot.color);
    addLog(r, "Ataque adicional: o mesmo dado, sem bônus de arma.");
    return;
  }
  nextTurn(r);
}
export function applyCommand(
  original: Room,
  actor: string,
  cmd: Command,
): Room {
  const r = structuredClone(original);
  const p = cmd.payload ?? {};
  const player = r.players.find((x) => x.id === actor);
  requireRule(player, "Jogador inválido.");
  switch (cmd.type) {
    case "hero": {
      requireRule(r.phase === "lobby", "A aventura já começou.");
      requireRule(
        definitions.some((x) => x.id === p.heroId),
        "Herói desconhecido.",
      );
      requireRule(
        !r.players.some((x) => x.id !== actor && x.heroId === p.heroId),
        "Este herói já foi escolhido.",
      );
      player.heroId = String(p.heroId);
      player.ready = false;
      break;
    }
    case "ready":
      requireRule(r.phase === "lobby", "A aventura já começou.");
      player.ready = Boolean(p.ready);
      break;
    case "difficulty":
      requireRule(
        r.phase === "lobby" && actor === r.host,
        "Só o anfitrião pode configurar a sala.",
      );
      requireRule(
        ["normal", "hard", "inferno"].includes(String(p.difficulty)),
        "Dificuldade inválida.",
      );
      r.difficulty = p.difficulty as Room["difficulty"];
      r.players.forEach((x) => (x.ready = false));
      break;
    case "start": {
      requireRule(
        r.phase === "lobby" && actor === r.host,
        "Só o anfitrião pode iniciar.",
      );
      requireRule(
        r.players.every((x) => x.ready),
        "Todos precisam estar prontos.",
      );
      r.heroes = r.players.map((x) => heroState(x.heroId, x.id));
      if (r.heroes.length === 1)
        r.heroes.push(
          heroState(
            definitions.find((x) => x.id !== r.heroes[0].id)!.id,
            actor,
          ),
        );
      r.gold = r.heroes.length - 2;
      preparePath(r);
      break;
    }
    case "path": {
      requireRule(
        r.phase === "path" && r.heroes[r.leader].owner === actor,
        "Só o líder pode escolher o caminho.",
      );
      requireRule(p.index === 0 || p.index === 1, "Caminho inválido.");
      r.room = r.candidates[p.index];
      r.roomDeck.push(r.candidates[1 - p.index]);
      r.candidates = [];
      if (r.room.effect === "gold") r.gold++;
      if (r.room.effect === "die") r.whiteDice = Math.min(9, r.whiteDice + 1);
      if (r.room.effect === "heal")
        r.heroes
          .filter((x) => !x.eliminated)
          .forEach((x) => (x.hp = Math.min(x.maxHp, x.hp + 2)));
      beginCombat(r);
      break;
    }
    case "throw": {
      requireRule(r.phase === "combat", "Não é hora de lançar.");
      const h = activeHero(r, actor);
      const color = p.color as Color;
      requireRule(
        ["red", "green", "blue", "white"].includes(color),
        "Dado inválido.",
      );
      if (r.extraAttack || r.repeatDie)
        requireRule(
          color === r.lastShot?.color,
          "O ataque adicional usa o mesmo dado.",
        );
      if (color === "white") {
        requireRule(
          r.available.length === 0 || r.extraAttack,
          "Use os dados coloridos antes dos brancos.",
        );
        requireRule(r.whiteDice > 0, "Não há dados brancos.");
        r.whiteDice--;
      } else {
        requireRule(r.available.includes(color), "Este dado já foi usado.");
        r.available.splice(r.available.indexOf(color), 1);
      }
      const raw = p.input;
      requireRule(
        raw && typeof raw === "object",
        "Preparo de lançamento inválido.",
      );
      const input = { ...(raw as Record<string, unknown>) };
      if (r.room?.challenge === "inverted")
        input.direction = 1 - Number(input.direction);
      const shot: Shot = {
        id: cmd.id,
        heroId: h.id,
        color,
        damage: 0,
        ...simulateShot(input, () => randomInt(1000000) / 1000000),
      };
      if (r.room?.challenge === "doubleBounce" && shot.bounces < 2) {
        shot.hit = false;
        shot.value = 0;
        shot.bullseye = false;
        shot.reason = "O desafio exigia dois quiques.";
      }
      const chosen = p.ability ?? "red";
      requireRule(
        ["red", "green", "blue"].includes(String(chosen)),
        "Habilidade inválida.",
      );
      shot.ability = chosen as "red";
      resolveShot(r, shot, shot.ability);
      break;
    }
    case "keep": {
      requireRule(
        r.phase === "reaction" && r.pending,
        "Não há resultado pendente.",
      );
      activeHero(r, actor);
      r.rerolled = true;
      resolveShot(r, r.pending, r.pending.ability);
      break;
    }
    case "reroll": {
      requireRule(
        r.phase === "reaction" && r.pending,
        "Não há relançamento disponível.",
      );
      activeHero(r, actor);
      const old = r.pending;
      r.pending = null;
      r.rerolled = true;
      r.phase = "combat";
      if (old.color === "white") r.whiteDice++;
      else r.available.push(old.color);
      r.repeatDie = old.color;
      r.extraAttack = false;
      r.lastShot = old;
      addLog(
        r,
        "O primeiro resultado foi ignorado. Lance o mesmo dado novamente.",
      );
      break;
    }
    case "recover": {
      requireRule(r.phase === "combat", "Não é hora de recuperar dados.");
      activeHero(r, actor);
      requireRule(!r.isBoss, "Não é possível recuperar dados contra o chefão.");
      requireRule(r.available.length === 0, "Ainda há dados coloridos.");
      for (const h of r.heroes.filter(conscious))
        takeDamage(h, r.enemy!.level, true);
      r.available = ["red", "green", "blue"];
      addLog(
        r,
        `Coloridos recuperados. Todos perderam ${r.enemy!.level} de vida.`,
        "bad",
      );
      if (r.heroes.every((x) => !conscious(x)))
        lose(r, "O custo de recuperar os dados derrubou o grupo.");
      else if (!conscious(r.heroes[r.active])) r.active = nextHero(r, r.active);
      break;
    }
    case "scar": {
      requireRule(
        r.phase === "rest",
        "As cicatrizes são tratadas no descanso.",
      );
      const h = r.heroes.find((x) => x.id === p.heroId);
      requireRule(
        h && h.owner === actor && r.restPending.includes(h.id),
        "Este herói não precisa escolher cicatriz.",
      );
      requireRule(
        ["red", "green", "blue"].includes(String(p.color)) &&
          !h.scars.includes(p.color as "red"),
        "Escolha uma cor sem cicatriz.",
      );
      h.scars.push(p.color as "red");
      h.maxHp = 9 - h.scars.length * 2;
      h.hp = h.maxHp;
      h.fainted = false;
      r.restPending = r.restPending.filter((x) => x !== h.id);
      break;
    }
    case "continue": {
      requireRule(r.phase === "rest", "Só é possível seguir após o combate.");
      requireRule(
        r.restPending.length === 0,
        "Escolham as cicatrizes antes de continuar.",
      );
      requireRule(
        r.heroes[r.leader]?.owner === actor || actor === r.host,
        "O líder precisa continuar.",
      );
      if (r.heroes[r.leader].eliminated)
        r.leader = r.heroes.findIndex((x) => !x.eliminated);
      r.roomDeck.push(r.room!);
      r.available = ["red", "green", "blue"];
      if (r.progress >= 10) {
        r.phase = "shop";
        r.shopStock = equipment.map((x) => x.id);
        addLog(r, `Loja ${r.shopCount + 1}: uma pausa para comprar coragem.`);
      } else preparePath(r);
      break;
    }
    case "purchase": {
      requireRule(
        r.phase === "shop" && r.heroes[r.leader].owner === actor,
        "O líder confirma os gastos do baú.",
      );
      const kind = p.kind;
      if (kind === "heal") {
        requireRule(r.gold >= 1, "Falta ouro.");
        requireRule(
          r.heroes.some((h) => !h.eliminated && h.hp < h.maxHp),
          "Todos estão com a vida cheia.",
        );
        r.gold--;
        r.heroes
          .filter((h) => !h.eliminated)
          .forEach((h) => (h.hp = Math.min(h.maxHp, h.hp + 1)));
        addLog(r, "Uma moeda restaurou 1 de vida a cada herói.", "good");
      } else if (kind === "die") {
        requireRule(
          r.gold >= 2 && r.whiteDice < 9,
          "Precisa de duas moedas e espaço no baú.",
        );
        r.gold -= 2;
        r.whiteDice++;
        addLog(
          r,
          "Um dado branco foi guardado para a próxima encrenca.",
          "good",
        );
      } else {
        const item = equipment.find((x) => x.id === p.itemId);
        const h = r.heroes.find((x) => x.id === p.heroId && !x.eliminated);
        requireRule(
          item && h && r.shopStock.includes(item.id),
          "Item ou destinatário inválido.",
        );
        requireRule(r.gold >= item.cost, "O baú não tem ouro suficiente.");
        requireRule(
          !(item.kind === "weapon" && h.weapon) &&
            !(item.kind === "armor" && h.armor),
          "Este espaço de equipamento já está ocupado.",
        );
        r.gold -= item.cost;
        if (item.kind === "weapon") h.weapon = item.id;
        if (item.kind === "armor") h.armor = true;
        if (item.kind === "potion") h.potions++;
        r.shopStock = r.shopStock.filter((x) => x !== item.id);
        addLog(
          r,
          `${item.name} foi entregue a ${definitions.find((x) => x.id === h.id)!.name}.`,
          "good",
        );
      }
      break;
    }
    case "leaveShop":
      requireRule(
        r.phase === "shop" && r.heroes[r.leader].owner === actor,
        "O líder encerra as compras.",
      );
      r.shopCount++;
      r.progress = 0;
      if (r.shopCount === 3) {
        r.room = null;
        beginCombat(r, true);
      } else preparePath(r);
      break;
    case "chat": {
      requireRule(
        typeof p.text === "string" &&
          p.text.trim().length > 0 &&
          p.text.length <= 280,
        "Mensagem inválida.",
      );
      addLog(r, `${player.name}: ${p.text.trim()}`);
      break;
    }
    case "potion": {
      requireRule(
        ["combat", "rest", "shop", "reaction"].includes(r.phase),
        "Não é hora de usar poção.",
      );
      const h = r.heroes.find((x) => x.id === p.heroId && x.owner === actor);
      requireRule(
        h && conscious(h) && h.potions > 0 && h.hp < h.maxHp,
        "Este herói não pode usar poção.",
      );
      h.potions--;
      h.hp = Math.min(h.maxHp, h.hp + 3);
      addLog(r, "Uma poção restaurou até 3 de vida.", "good");
      break;
    }
    default:
      throw new RuleError("Ação desconhecida.");
  }
  r.revision++;
  r.updatedAt = Date.now();
  return r;
}
