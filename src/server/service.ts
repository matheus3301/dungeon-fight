import { createHash, randomUUID, timingSafeEqual } from "node:crypto";
import { applyCommand, createRoom, view, RuleError, addLog } from "./engine";
import { heroes } from "../shared/content";
import type { Store, RecordData } from "./store";
import type { Command, Player, Room } from "../shared/types";
export const digest = (s: string) =>
  createHash("sha256").update(s).digest("hex");
const validToken = (t: unknown): t is string =>
  typeof t === "string" && /^[a-f0-9]{64}$/.test(t);
export function findPlayer(r: Room, token: string) {
  if (!validToken(token)) return undefined;
  const hashed = digest(token);
  return r.players.find((x) =>
    timingSafeEqual(Buffer.from(x.tokenHash), Buffer.from(hashed)),
  );
}
const cleanName = (n: unknown) => {
  if (typeof n !== "string" || !n.trim() || n.trim().length > 24)
    throw new RuleError("Use um apelido de 1 a 24 caracteres.");
  return n.trim();
};
export class RoomService {
  private queues = new Map<string, Promise<unknown>>();
  constructor(public store: Store) {}
  serialize<T>(key: string, fn: () => Promise<T>): Promise<T> {
    const task = (this.queues.get(key) ?? Promise.resolve())
      .catch(() => {})
      .then(fn);
    this.queues.set(key, task);
    void task
      .finally(() => {
        if (this.queues.get(key) === task) this.queues.delete(key);
      })
      .catch(() => {});
    return task;
  }
  async create(name: unknown, token: unknown, createId: unknown) {
    if (
      !validToken(token) ||
      typeof createId !== "string" ||
      !/^[a-f0-9-]{36}$/.test(createId)
    )
      throw new RuleError("Identidade de entrada inválida.");
    const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789",
      hash = Buffer.from(digest(createId), "hex");
    const code = Array.from(
      hash.subarray(0, 6),
      (x) => alphabet[x % alphabet.length],
    ).join("");
    return this.serialize(code, async () => {
      const old = await this.store.read(code);
      if (old) {
        const p = findPlayer(old.state, token);
        if (!p || old.state.host !== p.id)
          throw new RuleError("Tente criar outra sala.");
        return { room: old.state, player: p };
      }
      const p: Player = {
        id: randomUUID(),
        name: cleanName(name),
        tokenHash: digest(token),
        heroId: heroes[0].id,
        ready: false,
      };
      const room = createRoom(code, p);
      await this.store.create({ state: room, commands: {} });
      return { room, player: p };
    });
  }
  async join(code: string, name: unknown, token: unknown) {
    if (!/^[A-Z2-9]{6}$/.test(code) || !validToken(token))
      throw new RuleError("Código ou identidade inválidos.");
    return this.serialize(code, () =>
      this.store.update(code, (record) => {
        const existing = findPlayer(record.state, token);
        if (existing)
          return { result: { room: record.state, player: existing } };
        if (record.state.phase !== "lobby")
          throw new RuleError(
            "Esta expedição já começou. Use o navegador em que entrou para retomar.",
          );
        if (record.state.players.length >= 6)
          throw new RuleError("A mesa está cheia.");
        const room = structuredClone(record.state),
          player: Player = {
            id: randomUUID(),
            name: cleanName(name),
            tokenHash: digest(token),
            heroId: heroes.find(
              (x) => !room.players.some((p) => p.heroId === x.id),
            )!.id,
            ready: false,
          };
        room.players.push(player);
        room.revision++;
        room.updatedAt = Date.now();
        addLog(room, `${player.name} entrou na mesa.`);
        return {
          next: { ...record, state: room },
          event: {
            type: "join",
            actor: player.id,
            commandId: "join-" + player.id,
            fingerprint: digest(token),
          },
          result: { room, player },
        };
      }),
    );
  }
  async command(code: string, token: string, cmd: Command) {
    return this.serialize(code, () =>
      this.store.update(code, (record) => {
        const actor = findPlayer(record.state, token);
        if (!actor) throw new RuleError("Credencial de retomada inválida.");
        if (
          !cmd ||
          typeof cmd.id !== "string" ||
          !/^[a-zA-Z0-9-]{1,80}$/.test(cmd.id) ||
          typeof cmd.type !== "string" ||
          !Number.isInteger(cmd.revision) ||
          (cmd.payload !== undefined &&
            (!cmd.payload ||
              typeof cmd.payload !== "object" ||
              Array.isArray(cmd.payload)))
        )
          throw new RuleError("Comando inválido.");
        const key = actor.id + ":" + cmd.id,
          fingerprint = digest(
            JSON.stringify({ type: cmd.type, payload: cmd.payload ?? {} }),
          );
        const receipt = record.commands[key];
        if (receipt) {
          if (receipt.fingerprint !== fingerprint)
            throw new RuleError(
              "O identificador foi reutilizado para outra ação.",
            );
          return {
            result: {
              room: record.state,
              replayed: true,
              ackRevision: receipt.revision,
              actor: actor.id,
            },
          };
        }
        if (cmd.revision !== record.state.revision)
          throw new RuleError(
            "A mesa foi atualizada. Aguarde a sincronização e tente novamente.",
          );
        if (Object.keys(record.commands).length > 20000)
          throw new RuleError("Limite de ações da sala atingido.");
        const room = applyCommand(record.state, actor.id, cmd);
        const next: RecordData = {
          state: room,
          commands: {
            ...record.commands,
            [key]: { fingerprint, revision: room.revision },
          },
        };
        return {
          next,
          event: {
            type: cmd.type,
            actor: actor.id,
            commandId: cmd.id,
            fingerprint,
          },
          result: {
            room,
            replayed: false,
            ackRevision: room.revision,
            actor: actor.id,
          },
        };
      }),
    );
  }
}
