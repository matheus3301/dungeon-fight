import { mkdir, readFile, open, rename, unlink } from "node:fs/promises";
import { join } from "node:path";
import pg from "pg";
import type { Room } from "../shared/types";
export type Receipt = { fingerprint: string; revision: number };
export type RecordData = { state: Room; commands: Record<string, Receipt> };
export type Change<T> = {
  next?: RecordData;
  result: T;
  event?: {
    type: string;
    actor: string;
    commandId: string;
    fingerprint: string;
  };
};
export interface Store {
  kind: string;
  create(record: RecordData): Promise<void>;
  read(code: string): Promise<RecordData | null>;
  update<T>(code: string, fn: (record: RecordData) => Change<T>): Promise<T>;
  close(): Promise<void>;
}
export class FileStore implements Store {
  kind = "file";
  private lockPath: string;
  constructor(private dir: string) {
    this.lockPath = join(dir, ".writer.lock");
  }
  async init(): Promise<void> {
    await mkdir(this.dir, { recursive: true });
    try {
      const h = await open(this.lockPath, "wx", 0o600);
      await h.writeFile(String(process.pid));
      await h.close();
    } catch (e) {
      if ((e as NodeJS.ErrnoException).code !== "EEXIST") throw e;
      const pid = Number(await readFile(this.lockPath, "utf8"));
      try {
        process.kill(pid, 0);
      } catch (err) {
        if ((err as NodeJS.ErrnoException).code === "ESRCH") {
          await unlink(this.lockPath);
          return this.init();
        }
        throw err;
      }
      throw new Error(
        "This data directory already has an active writer. Use another DATA_DIR or PostgreSQL.",
      );
    }
  }
  private path(code: string) {
    if (!/^[A-Z2-9]{6}$/.test(code))
      throw new Error("Código de sala inválido.");
    return join(this.dir, code + ".json");
  }
  async read(code: string) {
    try {
      return JSON.parse(await readFile(this.path(code), "utf8")) as RecordData;
    } catch (e) {
      if ((e as NodeJS.ErrnoException).code === "ENOENT") return null;
      throw e;
    }
  }
  private async write(record: RecordData) {
    const dest = this.path(record.state.code),
      tmp = dest + "." + process.pid + ".tmp";
    const h = await open(tmp, "w", 0o600);
    try {
      await h.writeFile(JSON.stringify(record));
      await h.sync();
    } finally {
      await h.close();
    }
    await rename(tmp, dest);
  }
  async create(record: RecordData) {
    if (await this.read(record.state.code))
      throw new Error("Esta sala já existe.");
    await this.write(record);
  }
  async update<T>(
    code: string,
    fn: (record: RecordData) => Change<T>,
  ): Promise<T> {
    const record = await this.read(code);
    if (!record) throw new Error("Sala não encontrada.");
    const change = fn(record);
    if (change.next) await this.write(change.next);
    return change.result;
  }
  async close() {
    await unlink(this.lockPath).catch(() => {});
  }
}
export class PostgresStore implements Store {
  kind = "postgres";
  private pool: pg.Pool;
  constructor(url: string) {
    this.pool = new pg.Pool({ connectionString: url, max: 10 });
  }
  async init() {
    await this.pool
      .query(`CREATE TABLE IF NOT EXISTS rooms(code text PRIMARY KEY, record jsonb NOT NULL, revision integer NOT NULL, updated_at timestamptz NOT NULL DEFAULT now());
 CREATE TABLE IF NOT EXISTS room_events(room_code text REFERENCES rooms(code) ON DELETE CASCADE, revision integer NOT NULL, event_type text NOT NULL, actor text NOT NULL, payload jsonb NOT NULL, created_at timestamptz NOT NULL DEFAULT now(), PRIMARY KEY(room_code,revision));
 CREATE TABLE IF NOT EXISTS room_commands(room_code text REFERENCES rooms(code) ON DELETE CASCADE, actor text NOT NULL, command_id text NOT NULL, fingerprint text NOT NULL, revision integer NOT NULL, PRIMARY KEY(room_code,actor,command_id));`);
  }
  async read(code: string) {
    const r = await this.pool.query("SELECT record FROM rooms WHERE code=$1", [
      code,
    ]);
    return (r.rows[0]?.record as RecordData) ?? null;
  }
  async create(record: RecordData) {
    await this.pool.query(
      "INSERT INTO rooms(code,record,revision) VALUES($1,$2,$3)",
      [record.state.code, record, record.state.revision],
    );
  }
  async update<T>(
    code: string,
    fn: (record: RecordData) => Change<T>,
  ): Promise<T> {
    const c = await this.pool.connect();
    try {
      await c.query("BEGIN");
      const row = await c.query(
        "SELECT record FROM rooms WHERE code=$1 FOR UPDATE",
        [code],
      );
      if (!row.rowCount) throw new Error("Sala não encontrada.");
      const change = fn(row.rows[0].record);
      if (change.next) {
        const n = change.next;
        await c.query(
          "UPDATE rooms SET record=$2,revision=$3,updated_at=now() WHERE code=$1",
          [code, n, n.state.revision],
        );
        if (change.event) {
          const e = change.event;
          await c.query(
            "INSERT INTO room_commands(room_code,actor,command_id,fingerprint,revision) VALUES($1,$2,$3,$4,$5)",
            [code, e.actor, e.commandId, e.fingerprint, n.state.revision],
          );
          await c.query(
            "INSERT INTO room_events(room_code,revision,event_type,actor,payload) VALUES($1,$2,$3,$4,$5)",
            [
              code,
              n.state.revision,
              e.type,
              e.actor,
              {
                commandId: e.commandId,
                phase: n.state.phase,
                lastShot: n.state.lastShot,
              },
            ],
          );
        }
      }
      await c.query("COMMIT");
      return change.result;
    } catch (e) {
      await c.query("ROLLBACK");
      throw e;
    } finally {
      c.release();
    }
  }
  async close() {
    await this.pool.end();
  }
}
export async function makeStore() {
  if (process.env.DATABASE_URL) {
    const s = new PostgresStore(process.env.DATABASE_URL);
    await s.init();
    return s;
  }
  if (
    process.env.NODE_ENV === "production" &&
    process.env.ALLOW_FILE_STORE !== "1"
  )
    throw new Error(
      "Production requires DATABASE_URL (or explicit ALLOW_FILE_STORE=1 for a single-process private deployment).",
    );
  const s = new FileStore(process.env.DATA_DIR ?? ".data");
  await s.init();
  return s;
}
