import test from "node:test";
import assert from "node:assert/strict";
import { io, type Socket } from "socket.io-client";
import { randomUUID } from "node:crypto";
const url = process.env.TEST_SERVER_URL;
const emit = (s: Socket, event: string, payload: unknown) =>
  new Promise<any>((resolve, reject) =>
    s
      .timeout(4000)
      .emit(event, payload, (err: Error | null, data: any) =>
        err ? reject(err) : resolve(data),
      ),
  );
const connect = () =>
  new Promise<Socket>((resolve, reject) => {
    const s = io(url!, {
      transports: ["websocket"],
      forceNew: true,
      reconnection: false,
    });
    s.once("connect", () => resolve(s));
    s.once("connect_error", reject);
  });
test(
  "two Socket.IO clients share commands, hide leader choices, and reconnect without duplication",
  { skip: !url },
  async () => {
    let a = await connect(),
      b = await connect();
    const tokenA = "e".repeat(64),
      tokenB = "f".repeat(64);
    try {
      let ra: any, rb: any;
      a.on("room:state", (r) => (ra = r));
      b.on("room:state", (r) => (rb = r));
      const created = await emit(a, "room:create", {
        name: "Socket Alice",
        token: tokenA,
        createId: randomUUID(),
      });
      assert.equal(created.ok, true);
      const code = created.room.code;
      const joined = await emit(b, "room:join", {
        name: "Socket Bob",
        token: tokenB,
        code,
      });
      assert.equal(joined.ok, true);
      let revision = joined.room.revision;
      const synced = (s: Socket, get: () => any) =>
        new Promise<void>((resolve, reject) => {
          if (get()?.revision >= revision) {
            resolve();
            return;
          }
          const timer = setTimeout(() => {
            s.off("room:state", check);
            reject(new Error("Snapshot timeout"));
          }, 4000);
          const check = () => {
            if (get()?.revision >= revision) {
              clearTimeout(timer);
              s.off("room:state", check);
              resolve();
            }
          };
          s.on("room:state", check);
        });
      const act = async (s: Socket, state: any, type: string, payload = {}) => {
        await synced(s, () => (s === a ? ra : rb));
        const cmd = { id: randomUUID(), revision, type, payload };
        const answer = await emit(s, "room:command", cmd);
        assert.equal(answer.ok, true, answer.error);
        revision = answer.revision;
        await Promise.all([synced(a, () => ra), synced(b, () => rb)]);
        return cmd;
      };
      await act(a, ra, "ready", { ready: true });
      await act(b, rb, "ready", { ready: true });
      await act(a, ra, "start");
      assert.equal(ra.heroes.length, 2);
      assert.equal(ra.candidates.length, 2);
      assert.equal(rb.candidates.length, 0);
      assert.ok(!JSON.stringify(rb).includes("tokenHash"));
      assert.ok(!("boss" in rb));
      assert.equal(ra.revision, rb.revision);
      const cmd = await act(a, ra, "path", { index: 0 });
      assert.equal(ra.enemy.id, rb.enemy.id);
      const originalRevision = ra.revision;
      const replay = await emit(a, "room:command", cmd);
      assert.equal(replay.replayed, true);
      assert.equal(ra.revision, originalRevision);
      const wrong = await emit(a, "room:command", {
        id: randomUUID(),
        revision: ra.revision,
        type: "throw",
        payload: {
          color: "red",
          input: { direction: 0.5, power: 0.44, loft: 0.4 },
        },
      });
      assert.equal(wrong.ok, false);
      assert.match(wrong.error, /turno/);
      a.disconnect();
      a = await connect();
      a.on("room:state", (r) => (ra = r));
      const reconnect = await emit(a, "room:join", {
        code,
        name: "Ignored",
        token: tokenA,
      });
      assert.equal(reconnect.ok, true);
      assert.equal(reconnect.room.revision, originalRevision);
      assert.equal(reconnect.room.you, created.room.you);
      const body = JSON.stringify(reconnect.room);
      assert.ok(!body.includes(tokenA));
      assert.ok(!body.includes(tokenB));
    } finally {
      a.disconnect();
      b.disconnect();
    }
  },
);
