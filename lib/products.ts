import { all, getDb, one, type Db } from "./db";
import type { Product } from "./types";

interface ProductRow {
  id: string;
  name: string;
  description: string;
  category: string;
  unit: string;
  emoji: string;
  price: number;
  stock: number;
  is_available: number;
}

const COLUMNS = "id, name, description, category, unit, emoji, price, stock, is_available";

function mapProduct(row: ProductRow): Product {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    category: row.category,
    unit: row.unit,
    emoji: row.emoji,
    price: row.price,
    stock: row.stock,
    isAvailable: row.is_available === 1 && row.stock > 0,
  };
}

export async function listProducts(scope?: Db): Promise<Product[]> {
  const db = scope ?? (await getDb());
  const rows = await all<ProductRow>(
    db,
    `SELECT ${COLUMNS} FROM products ORDER BY sort_order ASC, name ASC`,
  );
  return rows.map(mapProduct);
}

export async function getProductById(id: string, scope?: Db): Promise<Product | null> {
  const db = scope ?? (await getDb());
  const row = await one<ProductRow>(db, `SELECT ${COLUMNS} FROM products WHERE id = ?`, [id]);
  return row ? mapProduct(row) : null;
}

export async function listCategories(scope?: Db): Promise<string[]> {
  const db = scope ?? (await getDb());
  const rows = await all<{ category: string }>(
    db,
    "SELECT DISTINCT category FROM products ORDER BY category ASC",
  );
  return rows.map((row) => row.category);
}
