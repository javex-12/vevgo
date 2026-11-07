/**
 * This prototype has no accounts, so a customer's order history lives in the
 * browser: checkout saves each reference here and /orders reads it back.
 * With real auth this list would come from a `GET /api/me/orders` call instead.
 */
const STORAGE_KEY = "vevgo.orders.v1";
const MAX_SAVED = 40;

export function readSavedOrderReferences(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((value): value is string => typeof value === "string" && value.length > 0)
      .slice(0, MAX_SAVED);
  } catch {
    return [];
  }
}

export function saveOrderReference(reference: string): void {
  if (typeof window === "undefined") return;
  try {
    const current = readSavedOrderReferences().filter((item) => item !== reference);
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify([reference, ...current].slice(0, MAX_SAVED)),
    );
  } catch {
    // Private-mode storage failures should never block a placed order.
  }
}
