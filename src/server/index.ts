import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { resolve, extname, sep } from "node:path";
import { Server } from "socket.io";
import { makeStore } from "./store";
import { RoomService, findPlayer } from "./service";
import { view, RuleError } from "./engine";
import type { Room, Command } from "../shared/types";
const port = Number(process.env.PORT ?? 4310),
  host = process.env.HOST ?? "127.0.0.1";
const store = await makeStore(),
  service = new RoomService(store);
let ready = false;
const http = createServer(async (req, res) => {
  if (req.url?.split("?")[0] === "/api/health") {
    res.setHeader("Content-Type", "application/json");
    res.end(
      JSON.stringify({ ok: ready, version: "0.2.0", persistence: store.kind }),
    );
    return;
  }
  if (process.env.NODE_ENV !== "production") {
    vite.middlewares(req, res, () => {
      res.statusCode = 404;
      res.end("Not found");
    });
    return;
  }
  try {
    const path = decodeURIComponent(
      new URL(req.url ?? "/", "http://localhost").pathname,
    );
    if (req.method !== "GET" && req.method !== "HEAD") {
      res.statusCode = 405;
      res.end();
      return;
    }
    let f = resolve("dist", "." + path);
    if (!f.startsWith(resolve("dist") + sep)) {
      f = resolve("dist/index.html");
    }
    let data;
    try {
      if ((await stat(f)).isDirectory()) f = resolve(f, "index.html");
      data = await readFile(f);
    } catch {
      if (extname(path)) {
        res.statusCode = 404;
        res.end();
        return;
      }
      f = resolve("dist/index.html");
      data = await readFile(f);
    }
    const mime: Record<string, string> = {
      ".html": "text/html; charset=utf-8",
      ".js": "application/javascript",
      ".css": "text/css",
      ".json": "application/json",
      ".png": "image/png",
      ".gif": "image/gif",
      ".svg": "image/svg+xml",
      ".ogg": "audio/ogg",
      ".mp3": "audio/mpeg",
      ".glb": "model/gltf-binary",
      ".woff2": "font/woff2",
    };
    res.setHeader(
      "Content-Type",
      mime[extname(f)] ?? "application/octet-stream",
    );
    res.setHeader("X-Content-Type-Options", "nosniff");
    if (f.includes("/assets/"))
      res.setHeader("Cache-Control", "public, max-age=3600");
    res.end(data);
  } catch {
    res.statusCode = 400;
    res.end("Bad request");
  }
});
const origins = (
  process.env.ALLOWED_ORIGINS ??
  `http://localhost:${port},http://127.0.0.1:${port}`
).split(",");
const io = new Server(http, {
  maxHttpBufferSize: 16384,
  cors: { origin: origins, methods: ["GET", "POST"] },
  allowRequest: (req, cb) => {
    const origin = req.headers.origin;
    cb(null, !origin || origins.includes(origin));
  },
});
const sessions = new Map<string, string>();
const online = (code: string) =>
  Array.from(io.sockets.sockets.values())
    .filter((s) => s.data.code === code)
    .map((s) => s.data.playerId as string);
const publish = (room: Room) => {
  for (const socket of io.sockets.sockets.values())
    if (socket.data.code === room.code)
      socket.emit("room:state", {
        ...view(room, socket.data.playerId),
        onlineIds: online(room.code),
      });
};
const attach = (
  socket: import("socket.io").Socket,
  room: Room,
  playerId: string,
  token: string,
) => {
  if (socket.data.code) {
    const oldKey = socket.data.code + ":" + socket.data.playerId;
    if (sessions.get(oldKey) === socket.id) sessions.delete(oldKey);
    socket.leave(socket.data.code);
  }
  const key = room.code + ":" + playerId;
  const previous = sessions.get(key);
  if (previous && previous !== socket.id) {
    io.sockets.sockets.get(previous)?.emit("session:replaced");
    io.sockets.sockets.get(previous)?.disconnect(true);
  }
  sessions.set(key, socket.id);
  socket.data = { code: room.code, playerId, token };
  socket.join(room.code);
  publish(room);
};
io.on("connection", (socket) => {
  let budget = 80,
    refilled = Date.now();
  const limit = () => {
    const now = Date.now();
    budget = Math.min(80, budget + (now - refilled) * 0.02);
    refilled = now;
    if (--budget < 0) throw new Error("Muitas ações. Aguarde um momento.");
  };
  socket.on("room:create", async (payload, ack) => {
    if (typeof ack !== "function") return;
    try {
      limit();
      const { room, player } = await service.create(
        payload?.name,
        payload?.token,
        payload?.createId,
      );
      attach(socket, room, player.id, payload.token);
      ack({ ok: true, room: view(room, player.id) });
    } catch (e) {
      ack({ ok: false, error: (e as Error).message });
    }
  });
  socket.on("room:join", async (payload, ack) => {
    if (typeof ack !== "function") return;
    try {
      limit();
      const code = String(payload?.code ?? "").toUpperCase();
      const { room, player } = await service.join(
        code,
        payload?.name,
        payload?.token,
      );
      attach(socket, room, player.id, payload.token);
      ack({ ok: true, room: view(room, player.id) });
    } catch (e) {
      ack({ ok: false, error: (e as Error).message });
    }
  });
  socket.on("room:command", async (cmd: Command, ack) => {
    if (typeof ack !== "function") return;
    try {
      limit();
      if (!socket.data.code) throw new Error("Entre em uma mesa.");
      const result = await service.command(
        socket.data.code,
        socket.data.token,
        cmd,
      );
      publish(result.room);
      ack({
        ok: true,
        revision: result.ackRevision,
        replayed: result.replayed,
      });
    } catch (e) {
      ack({
        ok: false,
        error:
          e instanceof RuleError
            ? e.message
            : "O servidor não confirmou a gravação. Tente confirmar a mesma ação.",
        retryable: !(e instanceof RuleError),
      });
      if (socket.data.code) {
        const current = await store.read(socket.data.code).catch(() => null);
        if (current)
          socket.emit("room:state", {
            ...view(current.state, socket.data.playerId),
            onlineIds: online(current.state.code),
          });
      }
    }
  });
  socket.on("disconnect", async () => {
    const code = socket.data.code;
    if (code) {
      const key = code + ":" + socket.data.playerId;
      if (sessions.get(key) === socket.id) sessions.delete(key);
      const room = await store.read(code).catch(() => null);
      if (room) publish(room.state);
    }
  });
});
let vite: Awaited<ReturnType<(typeof import("vite"))["createServer"]>>;
if (process.env.NODE_ENV !== "production") {
  const { createServer } = await import("vite");
  vite = await createServer({
    server: { middlewareMode: true, hmr: { server: http } },
    appType: "spa",
  });
}
http.listen(port, host, () => {
  ready = true;
  console.log(
    `Guilda dos Improváveis http://localhost:${port} (${store.kind})`,
  );
});
const shutdown = async () => {
  ready = false;
  io.close();
  http.close();
  if (vite) await vite.close();
  await store.close();
  process.exit(0);
};
process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
