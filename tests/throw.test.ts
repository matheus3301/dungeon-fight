import test from "node:test";
import assert from "node:assert/strict";
import { simulateShot } from "../src/server/engine";
import { FileStore } from "../src/server/store";
import { RoomService } from "../src/server/service";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
function seeded(seed: number) {
  return () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  };
}
const aim = { direction: 0.5, power: (25 - 3.2) / 49, loft: 0.4 };
test("identical perfect inputs produce varied landings; timing improves odds without guaranteeing center", () => {
  const measure = (release: number, direction = 0.5) => {
    const random = seeded(1234567);
    let center = 0,
      score = 0,
      icons = 0,
      hits = 0;
    const places = new Set<string>();
    for (let i = 0; i < 6000; i++) {
      const s = simulateShot({ ...aim, direction, release }, random);
      center += Number(s.bullseye);
      score += s.value;
      icons += Number(s.icon);
      hits += Number(s.hit);
      places.add(`${s.x.toFixed(2)}:${s.y.toFixed(2)}`);
      const last = s.points.at(-1)!;
      assert.ok(
        Math.abs(last.x - s.x) < 1e-9 &&
          Math.abs(last.y - s.y) < 1e-9 &&
          Math.abs(last.z) < 1e-9,
      );
    }
    return {
      center: center / 6000,
      score: score / 6000,
      icons: icons / 6000,
      hits: hits / 6000,
      places: places.size,
    };
  };
  const perfect = measure(0.62),
    late = measure(0),
    badAim = measure(0.62, 1);
  assert.ok(perfect.places > 5900);
  assert.ok(perfect.center > 0.01 && perfect.center < 0.35);
  assert.ok(perfect.score > late.score + 0.5);
  assert.ok(perfect.hits > badAim.hits + 0.5);
  assert.ok(perfect.hits < 0.995 && perfect.hits > 0.85);
  assert.ok(perfect.icons > 0.3 && perfect.icons < 0.36);
  assert.throws(() => simulateShot({ ...aim, release: NaN }));
  assert.throws(() => simulateShot({ ...aim, release: 2 }));
  console.log(JSON.stringify({ perfect, late, badAim }));
});
test("replayed dice command preserves the original random outcome and consumes no more entropy", async () => {
  const dir = await mkdtemp(join(tmpdir(), "df-entropy-")),
    store = new FileStore(dir);
  await store.init();
  let calls = 0;
  const service = new RoomService(store, () => {
      calls++;
      return 0.5;
    }),
    token = "c".repeat(64);
  try {
    const created = await service.create("Entropy test", token, randomUUID());
    let r = created.room;
    const act = async (type: string, payload = {}) => {
      const cmd = { id: randomUUID(), revision: r.revision, type, payload };
      const result = await service.command(r.code, token, cmd);
      r = result.room;
      return cmd;
    };
    await act("ready", { ready: true });
    await act("start");
    await act("path", { index: 0 });
    const cmd = await act("throw", {
        color: "red",
        input: { ...aim, release: 0.62 },
      }),
      before = calls,
      shot = r.lastShot;
    const replay = await service.command(r.code, token, cmd);
    assert.equal(replay.replayed, true);
    assert.equal(calls, before);
    assert.equal(JSON.stringify(replay.room.lastShot), JSON.stringify(shot));
    assert.ok(before > 0);
    await act("chat", { text: "Pelo caminho de cima!" });
    assert.equal(r.log.at(-1)?.speakerId, created.player.id);
  } finally {
    await store.close();
    await rm(dir, { recursive: true, force: true });
  }
});
