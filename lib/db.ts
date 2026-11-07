import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { createClient, type Client, type InArgs } from "@libsql/client";
import { SCHEMA_SQL } from "./schema";
import { SEED_PRODUCTS } from "./seed-products";

/**
 * SQLite, addressed through libSQL.
 *
 * Locally the client opens a normal `.sqlite` file, so `npm run dev` needs no
 * services. In production the same client talks to a hosted libSQL/Turso
 * database, which is what lets the app run on a serverless host where the file
 * system is read-only and thrown away between requests.
 */
export type Db = Pick<Client, "execute">;

const globalForDb = globalThis as unknown as {
  __vevgoDb?: Client;
  __vevgoReady?: Promise<Client>;
};

/** `true` when a remote database URL is configured. */
export const isRemote = Boolean(process.env.TURSO_DATABASE_URL?.trim());

function connect(): Client {
  const url = process.env.TURSO_DATABASE_URL?.trim();
  if (url) {
    return createClient({ url, authToken: process.env.TURSO_AUTH_TOKEN?.trim() || undefined });
  }

  const file = process.env.VEVGO_DB_PATH ?? path.join(process.cwd(), "data", "vevgo.sqlite");
  fs.mkdirSync(path.dirname(file), { recursive: true });
  return createClient({ url: pathToFileURL(file).href });
}

async function migrate(db: Client): Promise<void> {
  if (!isRemote) {
    // Sensible defaults for a single local file: concurrent dev requests and
    // the dev overlay both hit the same database.
    for (const pragma of [
      "PRAGMA journal_mode = WAL",
      "PRAGMA busy_timeout = 5000",
      "PRAGMA foreign_keys = ON",
    ]) {
      try {
        await db.executeMultiple(`${pragma};`);
      } catch {
        // WAL is unavailable on some file systems; the app still works.
      }
    }
  }

  await db.executeMultiple(SCHEMA_SQL);

  const { rows } = await db.execute("SELECT COUNT(*) AS count FROM products");
  if (Number(rows[0]?.count ?? 0) > 0) return;

  // INSERT OR IGNORE keeps two cold starts from colliding on a fresh database.
  await db.batch(
    SEED_PRODUCTS.map((product, index) => ({
      sql: `INSERT OR IGNORE INTO products
              (id, name, description, category, unit, emoji, price, stock, is_available, sort_order)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, ?)`,
      args: [
        product.id,
        product.name,
        product.description,
        product.category,
        product.unit,
        product.emoji,
        product.price,
        product.stock,
        index,
      ],
    })),
    "write",
  );
}

/**
 * One client per process. Next.js reloads modules in development, so the
 * connection and the finished migration promise are kept on `globalThis`.
 */
export function getDb(): Promise<Client> {
  if (!globalForDb.__vevgoReady) {
    globalForDb.__vevgoDb ??= connect();
    globalForDb.__vevgoReady = migrate(globalForDb.__vevgoDb).then(() => globalForDb.__vevgoDb!);
    globalForDb.__vevgoReady.catch(() => {
      globalForDb.__vevgoReady = undefined;
    });
  }
  return globalForDb.__vevgoReady;
}

/** Resolves the handle to use: the given transaction, or the shared client. */
export async function handle(scope?: Db): Promise<Db> {
  return scope ?? (await getDb());
}

export async function all<T>(scope: Db, sql: string, args: InArgs = []): Promise<T[]> {
  const result = await scope.execute({ sql, args });
  return result.rows as unknown as T[];
}

export async function one<T>(scope: Db, sql: string, args: InArgs = []): Promise<T | null> {
  const rows = await all<T>(scope, sql, args);
  return rows[0] ?? null;
}

export async function run(scope: Db, sql: string, args: InArgs = []): Promise<number> {
  const result = await scope.execute({ sql, args });
  return result.rowsAffected;
}

/**
 * Runs `work` in a write transaction. Everything inside must go through the
 * `tx` handle it receives: on a hosted database a read through the shared
 * client would not see the rows this transaction has not committed yet.
 */
export async function transaction<T>(work: (tx: Db) => Promise<T>): Promise<T> {
  const client = await getDb();
  const tx = await client.transaction("write");
  try {
    const result = await work(tx);
    await tx.commit();
    return result;
  } catch (error) {
    try {
      await tx.rollback();
    } catch {
      // The driver already closed the transaction (timeout, dropped socket).
    }
    throw error;
  } finally {
    tx.close();
  }
}
