import test from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { PostgresStore } from "../src/server/store";
import { RoomService } from "../src/server/service";
const url = process.env.TEST_DATABASE_URL;
test(
  "PostgreSQL persists bootstrap/commands and recovers ack after reopening adapter",
  { skip: !url },
  async () => {
    const store = new PostgresStore(url!);
    await store.init();
    const service = new RoomService(store),
      token = "d".repeat(64);
    const { room } = await service.create("Postgres test", token, randomUUID());
    const cmd = {
      id: randomUUID(),
      revision: room.revision,
      type: "ready",
      payload: { ready: true },
    };
    const first = await service.command(room.code, token, cmd);
    await store.close();
    const again = new PostgresStore(url!);
    await again.init();
    try {
      const resumed = new RoomService(again);
      const result = await resumed.command(room.code, token, cmd);
      assert.equal(result.replayed, true);
      assert.equal(result.room.players[0].ready, true);
      assert.equal(result.ackRevision, first.ackRevision);
      await assert.rejects(
        () =>
          resumed
            .command(room.code, token, {
              id: randomUUID(),
              revision: result.room.revision,
              type: "start",
              payload: {},
            })
            .then(async (x) => {
              await resumed.command(room.code, token, {
                id: randomUUID(),
                revision: x.room.revision,
                type: "path",
                payload: { index: 9 },
              });
            }),
        /Caminho inválido/,
      );
      const state = await again.read(room.code);
      assert.equal(state!.state.phase, "path");
    } finally {
      await again.close();
    }
  },
);
