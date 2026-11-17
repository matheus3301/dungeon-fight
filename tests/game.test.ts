import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import { FileStore } from "../src/server/store";
import { RoomService } from "../src/server/service";
import { applyCommand, simulateShot, view } from "../src/server/engine";
import type { Room, Command } from "../src/shared/types";
const token = "a".repeat(64),
  other = "b".repeat(64);
async function setup() {
  const dir = await mkdtemp(join(tmpdir(), "dungeon-test-"));
  const store = new FileStore(dir);
  await store.init();
  const service = new RoomService(store);
  const { room, player } = await service.create("Alice", token, randomUUID());
  return {
    room,
    player,
    store,
    service,
    dir,
    close: async () => {
      await store.close();
      await rm(dir, { recursive: true, force: true });
    },
  };
}
function command(
  r: Room,
  type: string,
  payload: Record<string, unknown> = {},
): Command {
  return { id: randomUUID(), revision: r.revision, type, payload };
}
async function start(s: Awaited<ReturnType<typeof setup>>) {
  let r = s.room;
  r = (
    await s.service.command(r.code, token, command(r, "ready", { ready: true }))
  ).room;
  return (await s.service.command(r.code, token, command(r, "start"))).room;
}
test("solo setup, filtered secrets and durable reconnect", async () => {
  const s = await setup();
  try {
    const r = await start(s);
    assert.equal(r.heroes.length, 2);
    assert.equal(r.gold, 0);
    assert.equal(r.whiteDice, 2);
    const pub = view(r, s.player.id);
    assert.equal(pub.candidates.length, 2);
    assert.ok(!("boss" in pub));
    assert.ok(!("roomDeck" in pub));
    assert.ok(!("tokenHash" in pub.players[0]));
    const guest = view(r, "not-the-leader");
    assert.equal(guest.candidates.length, 0);
    const restored = await s.service.join(r.code, "different-name", token);
    assert.equal(restored.player.id, s.player.id);
    assert.deepEqual(restored.room, r);
    const reopened = new RoomService(s.store);
    assert.deepEqual((await reopened.join(r.code, "Alice", token)).room, r);
  } finally {
    await s.close();
  }
});
test("dedupe precedes stale revision and does not consume twice", async () => {
  const s = await setup();
  try {
    const cmd = command(s.room, "ready", { ready: true });
    const one = await s.service.command(s.room.code, token, cmd);
    const replay = await s.service.command(s.room.code, token, cmd);
    assert.equal(replay.replayed, true);
    assert.equal(replay.ackRevision, one.room.revision);
    assert.equal(replay.room.revision, one.room.revision);
    await assert.rejects(
      () =>
        s.service.command(s.room.code, token, {
          ...cmd,
          payload: { ready: false },
        }),
      /reutilizado/,
    );
    await assert.rejects(
      () => s.service.command(s.room.code, other, cmd),
      /Credencial/,
    );
  } finally {
    await s.close();
  }
});
test("concurrent commands serialize, reject stale write and keep state intact", async () => {
  const s = await setup();
  try {
    const results = await Promise.allSettled([
      s.service.command(
        s.room.code,
        token,
        command(s.room, "ready", { ready: true }),
      ),
      s.service.command(
        s.room.code,
        token,
        command(s.room, "hero", { heroId: "runa" }),
      ),
    ]);
    assert.equal(results.filter((x) => x.status === "fulfilled").length, 1);
    assert.equal(results.filter((x) => x.status === "rejected").length, 1);
    const before = (await s.store.read(s.room.code))!;
    await assert.rejects(() =>
      s.service.command(
        s.room.code,
        token,
        command(before.state, "throw", {
          color: "red",
          input: { direction: NaN, power: 0, loft: 0 },
        }),
      ),
    );
    assert.deepEqual(await s.store.read(s.room.code), before);
  } finally {
    await s.close();
  }
});
test("target simulator rejects client result, bad controls, holes and out of bounds", () => {
  assert.throws(() =>
    simulateShot({ direction: Infinity, power: 0.5, loft: 0.5 }),
  );
  assert.throws(() => simulateShot({ direction: 0.5, power: -0.1, loft: 0.5 }));
  const center = simulateShot(
    { direction: 0.5, power: (25 - 3.2) / 49, loft: 0.4 },
    () => 0.5,
  );
  assert.equal(center.bullseye, true);
  assert.equal(center.value, 10);
  assert.equal(center.icon, false);
  const outside = simulateShot({ direction: 1, power: 1, loft: 1 }, () => 0.5);
  assert.equal(outside.hit, false);
  assert.equal(outside.bounces, 2);
});
test("ownership, fainting, scars and all-scar white dice", async () => {
  const s = await setup();
  try {
    let r = await start(s);
    r = applyCommand(r, s.player.id, command(r, "path", { index: 0 }));
    assert.throws(
      () => applyCommand(r, "outsider", command(r, "throw", { color: "red" })),
      /Jogador/,
    );
    r.available = [];
    r.heroes[r.active].scars = ["red", "green", "blue"];
    r.heroes[r.active].hp = 3;
    r.heroes[r.active].maxHp = 3;
    const whiteBefore = r.whiteDice;
    const result = applyCommand(
      r,
      s.player.id,
      command(r, "throw", {
        color: "white",
        input: { direction: 0.5, power: 0.44, loft: 0.4 },
      }),
    );
    assert.equal(result.whiteDice, whiteBefore - 1);
    r.phase = "rest";
    r.heroes[0].fainted = true;
    r.heroes[0].scars = [];
    r.restPending = [r.heroes[0].id];
    const scar = applyCommand(
      r,
      s.player.id,
      command(r, "scar", { heroId: r.heroes[0].id, color: "red" }),
    );
    assert.equal(scar.heroes[0].hp, 7);
    assert.equal(scar.heroes[0].maxHp, 7);
    assert.ok(scar.heroes[0].scars.includes("red"));
    assert.equal(scar.restPending.length, 0);
  } finally {
    await s.close();
  }
});
test("boss forbids paid recovery, rejects empty dice before mutation", async () => {
  const s = await setup();
  try {
    let r = await start(s);
    r.phase = "combat";
    r.enemy = r.boss;
    r.enemyHp = 40;
    r.enemyMaxHp = 40;
    r.isBoss = true;
    r.available = [];
    r.active = 0;
    r.whiteDice = 0;
    assert.throws(
      () => applyCommand(r, s.player.id, command(r, "recover")),
      /chefão/,
    );
    assert.throws(
      () =>
        applyCommand(
          r,
          s.player.id,
          command(r, "throw", {
            color: "white",
            input: { direction: 0.5, power: 0.5, loft: 0.5 },
          }),
        ),
      /brancos/,
    );
    assert.equal(r.whiteDice, 0);
  } finally {
    await s.close();
  }
});
test("original demo expedition reaches all three shops and a final outcome", async () => {
  const s = await setup();
  try {
    let r = await start(s),
      iterations = 0;
    while (!["won", "lost"].includes(r.phase) && iterations++ < 400) {
      let c: Command;
      if (r.phase === "path") c = command(r, "path", { index: 0 });
      else if (r.phase === "reaction") c = command(r, "keep");
      else if (r.phase === "rest") {
        assert.equal(r.restPending.length, 0);
        c = command(r, "continue");
      } else if (r.phase === "shop") {
        if (r.gold >= 2 && r.whiteDice < 8)
          c = command(r, "purchase", { kind: "die" });
        else c = command(r, "leaveShop");
      } else {
        const color = r.available.at(0) ?? "white";
        if (color === "white" && r.whiteDice === 0) c = command(r, "recover");
        else {
          const loft = r.room?.challenge === "doubleBounce" ? 0.8 : 0.4;
          c = command(r, "throw", {
            color,
            ability: "red",
            input: { direction: 0.5, power: (25 - loft * 8) / 49, loft },
          });
        }
      }
      r = (await s.service.command(r.code, token, c)).room;
    }
    assert.equal(r.shopCount, 3);
    assert.equal(r.phase, "won");
    assert.ok(iterations < 400);
    assert.ok(r.round >= 9);
  } finally {
    await s.close();
  }
});
test("tricky enemy turns region 1 into a miss before applying hit-only powers", async () => {
  const s = await setup();
  try {
    let r = await start(s);
    r = applyCommand(r, s.player.id, command(r, "path", { index: 0 }));
    r.active = 0;
    r.room!.challenge = "none";
    r.enemy!.trait = "tricky";
    r.enemy!.damage = 1;
    r.enemyHp = 100;
    r.enemyMaxHp = 100;
    const before = r.heroes[0].hp;
    const n = applyCommand(
      r,
      s.player.id,
      command(r, "throw", {
        color: "red",
        input: { direction: 0.5 + 32 / 105, power: (25 - 3.2) / 49, loft: 0.4 },
      }),
    );
    assert.equal(n.lastShot!.hit, false);
    assert.equal(n.lastShot!.damage, 0);
    assert.equal(n.heroes[0].hp, before - 1);
  } finally {
    await s.close();
  }
});
test("pending white reroll keeps its chosen ability and cannot switch on keep", async () => {
  const s = await setup();
  try {
    let r = await start(s);
    r = applyCommand(r, s.player.id, command(r, "path", { index: 0 }));
    r.active = 1;
    r.enemy!.trait = "none";
    r.enemyHp = 100;
    r.enemyMaxHp = 100;
    r.phase = "reaction";
    r.pending = {
      id: randomUUID(),
      heroId: r.heroes[1].id,
      color: "white",
      ability: "blue",
      x: 50,
      y: 40,
      icon: true,
      hit: true,
      bullseye: false,
      value: 5,
      bounces: 1,
      points: [],
      reason: "Acerto",
      damage: 0,
    };
    const n = applyCommand(
      r,
      s.player.id,
      command(r, "keep", { ability: "red" }),
    );
    assert.equal(n.enemyHp, 95);
    assert.equal(n.lastShot!.powerName, "Outra chance");
  } finally {
    await s.close();
  }
});
