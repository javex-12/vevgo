/**
 * The schema lives in TypeScript rather than a .sql file so the bundler always
 * ships it with the server code — reading a file from disk works in dev but
 * breaks inside a serverless function, where only traced imports are included.
 */
export const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS products (
  id           TEXT PRIMARY KEY,
  name         TEXT    NOT NULL,
  description  TEXT    NOT NULL DEFAULT '',
  category     TEXT    NOT NULL,
  unit         TEXT    NOT NULL DEFAULT '',
  emoji        TEXT    NOT NULL DEFAULT '🛒',
  price        INTEGER NOT NULL CHECK (price >= 0),
  stock        INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
  is_available INTEGER NOT NULL DEFAULT 1,
  sort_order   INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS orders (
  id               TEXT PRIMARY KEY,
  reference        TEXT NOT NULL UNIQUE,
  customer_name    TEXT NOT NULL,
  customer_phone   TEXT NOT NULL,
  delivery_address TEXT NOT NULL,
  delivery_note    TEXT NOT NULL DEFAULT '',
  subtotal         INTEGER NOT NULL,
  delivery_fee     INTEGER NOT NULL,
  total            INTEGER NOT NULL,
  status           TEXT NOT NULL DEFAULT 'pending',
  rider_name       TEXT,
  idempotency_key  TEXT UNIQUE,
  created_at       TEXT NOT NULL,
  updated_at       TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS order_items (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id      TEXT    NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id    TEXT    NOT NULL,
  product_name  TEXT    NOT NULL,
  product_emoji TEXT    NOT NULL DEFAULT '🛒',
  unit_price    INTEGER NOT NULL,
  quantity      INTEGER NOT NULL CHECK (quantity > 0),
  subtotal      INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS order_events (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id   TEXT    NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  status     TEXT    NOT NULL,
  note       TEXT    NOT NULL DEFAULT '',
  created_at TEXT    NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_orders_status      ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created     ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_order_items_order  ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_events_order ON order_events(order_id);
`;
