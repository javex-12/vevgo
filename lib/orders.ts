import { randomUUID } from "node:crypto";
import { ApiError } from "./api-error";
import { all, getDb, handle, one, run, transaction, type Db } from "./db";
import { DELIVERY_FEE } from "./money";
import { STATUS_LABELS, canTransition } from "./status";
import type { Order, OrderEvent, OrderItem, OrderStatus, StatusActor } from "./types";
import { parseCreateOrderPayload } from "./validation";

interface OrderRow {
  id: string;
  reference: string;
  customer_name: string;
  customer_phone: string;
  delivery_address: string;
  delivery_note: string;
  subtotal: number;
  delivery_fee: number;
  total: number;
  status: OrderStatus;
  rider_name: string | null;
  created_at: string;
  updated_at: string;
}

interface ItemRow {
  order_id: string;
  product_id: string;
  product_name: string;
  product_emoji: string;
  unit_price: number;
  quantity: number;
  subtotal: number;
}

interface EventRow {
  order_id: string;
  status: OrderStatus;
  note: string;
  created_at: string;
}

interface ProductRow {
  id: string;
  name: string;
  emoji: string;
  price: number;
  stock: number;
  is_available: number;
}

const ORDER_COLUMNS = `id, reference, customer_name, customer_phone, delivery_address, delivery_note,
  subtotal, delivery_fee, total, status, rider_name, created_at, updated_at`;

const REFERENCE_ALPHABET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";

function newReference(): string {
  let suffix = "";
  for (let i = 0; i < 6; i++) {
    suffix += REFERENCE_ALPHABET[Math.floor(Math.random() * REFERENCE_ALPHABET.length)];
  }
  return `ORD-${suffix}`;
}

async function uniqueReference(db: Db): Promise<string> {
  for (let attempt = 0; attempt < 6; attempt++) {
    const reference = newReference();
    const exists = await one(db, "SELECT 1 AS taken FROM orders WHERE reference = ?", [reference]);
    if (!exists) return reference;
  }
  throw new ApiError(500, "reference_exhausted", "Could not allocate an order reference.");
}

function mapItems(rows: ItemRow[]): OrderItem[] {
  return rows.map((row) => ({
    productId: row.product_id,
    name: row.product_name,
    emoji: row.product_emoji,
    unitPrice: row.unit_price,
    quantity: row.quantity,
    subtotal: row.subtotal,
  }));
}

function mapEvents(rows: EventRow[]): OrderEvent[] {
  return rows.map((row) => ({
    status: row.status,
    note: row.note,
    createdAt: row.created_at,
  }));
}

function mapOrder(row: OrderRow, items: ItemRow[], events: EventRow[]): Order {
  return {
    id: row.id,
    reference: row.reference,
    customerName: row.customer_name,
    customerPhone: row.customer_phone,
    deliveryAddress: row.delivery_address,
    deliveryNote: row.delivery_note,
    subtotal: row.subtotal,
    deliveryFee: row.delivery_fee,
    total: row.total,
    status: row.status,
    riderName: row.rider_name,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    items: mapItems(items),
    events: mapEvents(events),
  };
}

/** Fetch items/events for a batch of orders in two queries, not 2N. */
async function hydrate(db: Db, rows: OrderRow[]): Promise<Order[]> {
  if (rows.length === 0) return [];
  const placeholders = rows.map(() => "?").join(",");
  const ids = rows.map((row) => row.id);

  const items = await all<ItemRow>(
    db,
    `SELECT order_id, product_id, product_name, product_emoji, unit_price, quantity, subtotal
     FROM order_items WHERE order_id IN (${placeholders}) ORDER BY id ASC`,
    ids,
  );

  const events = await all<EventRow>(
    db,
    `SELECT order_id, status, note, created_at
     FROM order_events WHERE order_id IN (${placeholders}) ORDER BY id ASC`,
    ids,
  );

  const itemsByOrder = new Map<string, ItemRow[]>();
  for (const item of items) {
    const list = itemsByOrder.get(item.order_id) ?? [];
    list.push(item);
    itemsByOrder.set(item.order_id, list);
  }

  const eventsByOrder = new Map<string, EventRow[]>();
  for (const event of events) {
    const list = eventsByOrder.get(event.order_id) ?? [];
    list.push(event);
    eventsByOrder.set(event.order_id, list);
  }

  return rows.map((row) =>
    mapOrder(row, itemsByOrder.get(row.id) ?? [], eventsByOrder.get(row.id) ?? []),
  );
}

export async function listOrders(
  options: { statuses?: OrderStatus[]; references?: string[]; limit?: number } = {},
  scope?: Db,
): Promise<Order[]> {
  const db = await handle(scope);
  const limit = Math.min(Math.max(options.limit ?? 100, 1), 200);
  const statuses = options.statuses?.filter((status): status is OrderStatus => Boolean(status)) ?? [];
  const references = Array.from(
    new Set(
      (options.references ?? [])
        .map((reference) => reference.trim().toUpperCase())
        .filter(Boolean),
    ),
  ).slice(0, 50);

  if (references.length > 0) {
    const rows = await all<OrderRow>(
      db,
      `SELECT ${ORDER_COLUMNS} FROM orders
       WHERE reference IN (${references.map(() => "?").join(",")})
       ORDER BY created_at DESC`,
      references,
    );
    return hydrate(db, rows);
  }

  const rows = statuses.length
    ? await all<OrderRow>(
        db,
        `SELECT ${ORDER_COLUMNS} FROM orders
         WHERE status IN (${statuses.map(() => "?").join(",")})
         ORDER BY created_at DESC LIMIT ?`,
        [...statuses, limit],
      )
    : await all<OrderRow>(
        db,
        `SELECT ${ORDER_COLUMNS} FROM orders ORDER BY created_at DESC LIMIT ?`,
        [limit],
      );

  return hydrate(db, rows);
}

/** Accepts either the internal id or the human-facing ORD-XXXXXX reference. */
export async function findOrder(idOrReference: string, scope?: Db): Promise<Order | null> {
  const db = await handle(scope);
  const row = await one<OrderRow>(
    db,
    `SELECT ${ORDER_COLUMNS} FROM orders WHERE id = ? OR reference = ?`,
    [idOrReference, idOrReference.toUpperCase()],
  );
  if (!row) return null;
  const [order] = await hydrate(db, [row]);
  return order ?? null;
}

async function requireOrder(db: Db, idOrReference: string): Promise<Order> {
  const order = await findOrder(idOrReference, db);
  if (!order) {
    throw new ApiError(404, "order_not_found", "We could not find that order.");
  }
  return order;
}

/**
 * Creates an order. The browser only sends product ids and quantities —
 * prices, fees and totals are all computed here from the database, so a
 * tampered request cannot change what the customer is charged.
 */
export async function createOrder(
  body: unknown,
  idempotencyKey: string | null,
): Promise<{ order: Order; created: boolean }> {
  const input = parseCreateOrderPayload(body);
  const db = await getDb();

  // A retried checkout with the same key returns the original order instead of
  // charging the customer twice.
  if (idempotencyKey) {
    const existing = await one<{ id: string }>(
      db,
      "SELECT id FROM orders WHERE idempotency_key = ?",
      [idempotencyKey],
    );
    if (existing) {
      return { order: await requireOrder(db, existing.id), created: false };
    }
  }

  return transaction(async (tx) => {
    const lines: Array<{ product: ProductRow; quantity: number; subtotal: number }> = [];

    for (const item of input.items) {
      const product = await one<ProductRow>(
        tx,
        "SELECT id, name, emoji, price, stock, is_available FROM products WHERE id = ?",
        [item.productId],
      );
      if (!product) {
        throw new ApiError(422, "product_not_found", "A product in your cart is no longer sold.", {
          items: "Remove the unavailable product and try again.",
        });
      }
      if (product.is_available !== 1) {
        throw new ApiError(409, "product_unavailable", `${product.name} is out of stock right now.`, {
          items: `Remove ${product.name} from your cart.`,
        });
      }
      if (product.stock < item.quantity) {
        throw new ApiError(
          409,
          "insufficient_stock",
          product.stock === 0
            ? `${product.name} just sold out.`
            : `Only ${product.stock} × ${product.name} left in stock.`,
          { items: `Reduce ${product.name} to ${product.stock} or remove it.` },
        );
      }
      lines.push({
        product,
        quantity: item.quantity,
        subtotal: product.price * item.quantity,
      });
    }

    for (const line of lines) {
      const changes = await run(
        tx,
        "UPDATE products SET stock = stock - ? WHERE id = ? AND stock >= ?",
        [line.quantity, line.product.id, line.quantity],
      );
      if (changes === 0) {
        // Someone else bought the last unit between the check and the write.
        throw new ApiError(409, "insufficient_stock", `${line.product.name} just sold out.`);
      }
    }

    const subtotal = lines.reduce((sum, line) => sum + line.subtotal, 0);
    const total = subtotal + DELIVERY_FEE;
    const id = randomUUID();
    const reference = await uniqueReference(tx);
    const now = new Date().toISOString();

    await run(
      tx,
      `INSERT INTO orders (id, reference, customer_name, customer_phone, delivery_address,
         delivery_note, subtotal, delivery_fee, total, status, idempotency_key, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?, ?)`,
      [
        id,
        reference,
        input.customer.name,
        input.customer.phone,
        input.customer.address,
        input.customer.note,
        subtotal,
        DELIVERY_FEE,
        total,
        idempotencyKey,
        now,
        now,
      ],
    );

    for (const line of lines) {
      await run(
        tx,
        `INSERT INTO order_items
           (order_id, product_id, product_name, product_emoji, unit_price, quantity, subtotal)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          id,
          line.product.id,
          line.product.name,
          line.product.emoji,
          line.product.price,
          line.quantity,
          line.subtotal,
        ],
      );
    }

    await run(
      tx,
      "INSERT INTO order_events (order_id, status, note, created_at) VALUES (?, 'pending', ?, ?)",
      [id, "Order placed by customer", now],
    );

    return { order: await requireOrder(tx, id), created: true };
  });
}

/**
 * Applies a status change after checking the transition is legal for the actor.
 * Cancelling a vendor-side order returns the reserved stock to the shelf.
 */
export async function updateOrderStatus(
  idOrReference: string,
  nextStatus: OrderStatus,
  actor: StatusActor,
  riderName?: string | null,
): Promise<Order> {
  return transaction(async (tx) => {
    const order = await requireOrder(tx, idOrReference);

    if (order.status === nextStatus) {
      return order; // idempotent no-op
    }
    if (!canTransition(actor, order.status, nextStatus)) {
      throw new ApiError(
        409,
        "invalid_transition",
        `A ${actor} cannot move an order from "${STATUS_LABELS[order.status]}" to "${STATUS_LABELS[nextStatus]}".`,
      );
    }

    const now = new Date().toISOString();

    if (nextStatus === "cancelled") {
      for (const item of order.items) {
        await run(tx, "UPDATE products SET stock = stock + ? WHERE id = ?", [
          item.quantity,
          item.productId,
        ]);
      }
    }

    const assignedRider =
      nextStatus === "assigned" ? riderName?.trim() || "Rider" : riderName?.trim() ?? null;

    await run(
      tx,
      `UPDATE orders
       SET status = ?, updated_at = ?, rider_name = COALESCE(?, rider_name)
       WHERE id = ?`,
      [nextStatus, now, assignedRider, order.id],
    );

    const note =
      nextStatus === "cancelled"
        ? `Cancelled by ${actor === "vendor" ? "vendor" : "rider"} · stock returned`
        : nextStatus === "assigned"
          ? `Picked up by ${assignedRider}`
          : `Marked "${STATUS_LABELS[nextStatus]}" by ${actor}`;

    await run(tx, "INSERT INTO order_events (order_id, status, note, created_at) VALUES (?, ?, ?, ?)", [
      order.id,
      nextStatus,
      note,
      now,
    ]);

    return requireOrder(tx, order.id);
  });
}
