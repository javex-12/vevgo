/**
 * All money is stored and moved as integer kobo (1 naira = 100 kobo).
 * Floats are never used for money: `0.1 + 0.2` style drift inside an
 * order total is unacceptable, so totals are integers until they are shown.
 */
export const KOBO_PER_NAIRA = 100;

/** Flat, illustrative delivery fee for the prototype: ₦1,000. */
export const DELIVERY_FEE = 1000 * KOBO_PER_NAIRA;

export function formatNaira(kobo: number): string {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 2,
  }).format(kobo / KOBO_PER_NAIRA);
}

export function formatNairaShort(kobo: number): string {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(kobo / KOBO_PER_NAIRA);
}
