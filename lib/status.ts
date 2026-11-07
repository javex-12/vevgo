import type { OrderStatus, StatusActor } from "./types";

export const STATUS_LABELS: Record<OrderStatus, string> = {
  pending: "Pending",
  accepted: "Accepted",
  preparing: "Preparing",
  ready: "Ready for pickup",
  assigned: "Rider assigned",
  out_for_delivery: "Out for delivery",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

/** M3 tonal containers for each status pill. */
export const STATUS_STYLES: Record<OrderStatus, string> = {
  pending: "bg-tint-2 text-[#6a4300]",
  accepted: "bg-tint-3 text-[#0b375f]",
  preparing: "bg-[#e7ddff] text-[#3a2463]",
  ready: "bg-primary-container text-on-primary-container",
  assigned: "bg-tint-4 text-[#7a2842]",
  out_for_delivery: "bg-[#cfe4ff] text-[#0b375f]",
  delivered: "bg-surface-container-high text-on-surface-variant",
  cancelled: "bg-error-container text-error",
};

/**
 * The status machine. An order can only move along the edges below, and only
 * the actor who owns that edge may trigger it. The API validates this, so a
 * hand-crafted request cannot jump `pending` straight to `delivered`.
 */
export const TRANSITIONS: Record<StatusActor, Partial<Record<OrderStatus, OrderStatus[]>>> = {
  vendor: {
    pending: ["accepted", "cancelled"],
    accepted: ["preparing", "cancelled"],
    preparing: ["ready", "cancelled"],
  },
  rider: {
    ready: ["assigned"],
    assigned: ["out_for_delivery", "cancelled"],
    out_for_delivery: ["delivered"],
  },
};

export function canTransition(actor: StatusActor, from: OrderStatus, to: OrderStatus): boolean {
  return TRANSITIONS[actor][from]?.includes(to) ?? false;
}

/** The next step shown as the primary action in the vendor dashboard. */
export const VENDOR_NEXT_ACTION: Partial<Record<OrderStatus, { to: OrderStatus; label: string }>> = {
  pending: { to: "accepted", label: "Accept order" },
  accepted: { to: "preparing", label: "Start preparing" },
  preparing: { to: "ready", label: "Mark ready for pickup" },
};

export const RIDER_NEXT_ACTION: Partial<Record<OrderStatus, { to: OrderStatus; label: string }>> = {
  ready: { to: "assigned", label: "Accept delivery" },
  assigned: { to: "out_for_delivery", label: "Start delivery" },
  out_for_delivery: { to: "delivered", label: "Mark delivered" },
};

export function statusLabel(status: OrderStatus): string {
  return STATUS_LABELS[status] ?? status;
}
