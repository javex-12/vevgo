export const ORDER_STATUSES = [
  "pending",
  "accepted",
  "preparing",
  "ready",
  "assigned",
  "out_for_delivery",
  "delivered",
  "cancelled",
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

export type StatusActor = "vendor" | "rider";

export interface Product {
  id: string;
  name: string;
  description: string;
  category: string;
  unit: string;
  emoji: string;
  /** Price in kobo. 250000 === ₦2,500.00 */
  price: number;
  stock: number;
  isAvailable: boolean;
}

export interface OrderItem {
  productId: string;
  name: string;
  emoji: string;
  unitPrice: number;
  quantity: number;
  subtotal: number;
}

export interface OrderEvent {
  status: OrderStatus;
  note: string;
  createdAt: string;
}

export interface Order {
  id: string;
  reference: string;
  customerName: string;
  customerPhone: string;
  deliveryAddress: string;
  deliveryNote: string;
  subtotal: number;
  deliveryFee: number;
  total: number;
  status: OrderStatus;
  riderName: string | null;
  createdAt: string;
  updatedAt: string;
  items: OrderItem[];
  events: OrderEvent[];
}

/** Shape a client sends to POST /api/orders. Prices are never accepted here. */
export interface CreateOrderPayload {
  customer: {
    name: string;
    phone: string;
    address: string;
    note?: string;
  };
  items: Array<{ productId: string; quantity: number }>;
}
