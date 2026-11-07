import { ApiError } from "./api-error";
import type { CreateOrderPayload } from "./types";

const PHONE_DIGITS = /^\+?\d{10,15}$/;

export interface ValidatedOrderInput {
  customer: { name: string; phone: string; address: string; note: string };
  items: Array<{ productId: string; quantity: number }>;
}

/**
 * Validates the checkout request body. Anything that fails here is a client
 * mistake (422) and is reported per-field so the form can highlight it.
 */
export function parseCreateOrderPayload(body: unknown): ValidatedOrderInput {
  const details: Record<string, string> = {};
  const payload = (body ?? {}) as Partial<CreateOrderPayload>;
  const customer = (payload.customer ?? {}) as Partial<CreateOrderPayload["customer"]>;

  const name = typeof customer.name === "string" ? customer.name.trim() : "";
  if (name.length < 2) details.name = "Enter the name the rider should ask for.";
  else if (name.length > 80) details.name = "Name is too long.";

  const phoneRaw = typeof customer.phone === "string" ? customer.phone.replace(/[\s\-()]/g, "") : "";
  if (!PHONE_DIGITS.test(phoneRaw)) details.phone = "Enter a valid phone number, e.g. 08012345678.";

  const address = typeof customer.address === "string" ? customer.address.trim() : "";
  if (address.length < 8) details.address = "Add a full delivery address.";
  else if (address.length > 240) details.address = "Address is too long.";

  const note = typeof customer.note === "string" ? customer.note.trim().slice(0, 240) : "";

  const rawItems = Array.isArray(payload.items) ? payload.items : [];
  if (rawItems.length === 0) details.items = "Your cart is empty.";
  if (rawItems.length > 30) details.items = "Too many products in one order.";

  // Merge duplicate lines so one product cannot bypass the stock check twice.
  const merged = new Map<string, number>();
  for (const item of rawItems) {
    const productId = typeof item?.productId === "string" ? item.productId : "";
    const quantity = Number(item?.quantity);
    if (!productId) {
      details.items = "One of the cart items is invalid.";
      continue;
    }
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 20) {
      details.items = "Quantities must be whole numbers between 1 and 20.";
      continue;
    }
    merged.set(productId, (merged.get(productId) ?? 0) + quantity);
  }

  if (Object.keys(details).length > 0) {
    throw new ApiError(422, "validation_failed", "Please check your details and try again.", details);
  }

  return {
    customer: { name, phone: phoneRaw, address, note },
    items: [...merged.entries()].map(([productId, quantity]) => ({ productId, quantity })),
  };
}
