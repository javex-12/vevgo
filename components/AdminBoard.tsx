"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { StatusBadge } from "./StatusBadge";
import { ChevronIcon, RefreshIcon } from "./icons";
import { formatNaira } from "@/lib/money";
import { formatDateTime, nowMs, timeAgo } from "@/lib/format";
import { VENDOR_NEXT_ACTION, statusLabel } from "@/lib/status";
import type { Order, OrderStatus } from "@/lib/types";

type Bucket = "new" | "in_progress" | "ready" | "on_the_road" | "done" | "cancelled";

const BUCKETS: Array<{ key: Bucket | "all"; label: string }> = [
  { key: "all", label: "All" },
  { key: "new", label: "New" },
  { key: "in_progress", label: "In progress" },
  { key: "ready", label: "Ready" },
  { key: "on_the_road", label: "On the road" },
  { key: "done", label: "Completed" },
  { key: "cancelled", label: "Cancelled" },
];

function bucketOf(status: OrderStatus): Bucket {
  switch (status) {
    case "pending":
      return "new";
    case "accepted":
    case "preparing":
      return "in_progress";
    case "ready":
      return "ready";
    case "assigned":
    case "out_for_delivery":
      return "on_the_road";
    case "delivered":
      return "done";
    case "cancelled":
      return "cancelled";
    default:
      return "new";
  }
}

export function AdminBoard({ initialOrders }: { initialOrders: Order[] }) {
  // The first paint comes from the server; polling keeps it live after that.
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [state, setState] = useState<"loading" | "ready" | "error">("ready");
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [filter, setFilter] = useState<Bucket | "all">("all");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);
  const [now, setNow] = useState(() => nowMs());
  const mounted = useRef(true);

  const load = useCallback(async (options?: { silent?: boolean }) => {
    try {
      const response = await fetch("/api/orders?limit=100", { cache: "no-store" });
      if (!response.ok) throw new Error("request failed");
      const data = (await response.json()) as { orders: Order[] };
      if (!mounted.current) return;
      setOrders(data.orders);
      setState("ready");
      setError(null);
      setLastUpdated(nowMs());
    } catch {
      if (!mounted.current || options?.silent) return;
      setState("error");
      setError("We could not load orders. The dashboard will keep retrying.");
    }
  }, []);

  useEffect(() => {
    mounted.current = true;
    // The vendor screen stays live by polling; a production build would use a
    // websocket or Supabase realtime channel instead.
    const poll = window.setInterval(() => {
      if (document.visibilityState === "visible") load({ silent: true });
    }, 5000);
    const clock = window.setInterval(() => setNow(nowMs()), 30_000);
    return () => {
      mounted.current = false;
      window.clearInterval(poll);
      window.clearInterval(clock);
    };
  }, [load]);

  async function changeStatus(order: Order, to: OrderStatus) {
    setBusyId(order.id);
    setActionError(null);
    try {
      const response = await fetch(`/api/orders/${order.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: to, actor: "vendor" }),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        setActionError(data?.error?.message ?? "Could not update this order.");
        return;
      }
      const updated = data.order as Order;
      setOrders((current) => current.map((item) => (item.id === updated.id ? updated : item)));
      setLastUpdated(nowMs());
    } catch {
      setActionError("Network problem while updating the order. Try again.");
    } finally {
      setBusyId(null);
    }
  }

  const counts = useMemo(() => {
    const map = new Map<Bucket | "all", number>([["all", orders.length]]);
    for (const order of orders) {
      const bucket = bucketOf(order.status);
      map.set(bucket, (map.get(bucket) ?? 0) + 1);
    }
    return map;
  }, [orders]);

  const visible = useMemo(
    () => (filter === "all" ? orders : orders.filter((order) => bucketOf(order.status) === filter)),
    [orders, filter],
  );

  const stats = useMemo(() => {
    const inProgress = orders.filter((order) =>
      ["accepted", "preparing", "ready"].includes(order.status),
    ).length;
    const value = orders
      .filter((order) => order.status !== "cancelled")
      .reduce((sum, order) => sum + order.total, 0);
    return {
      newOrders: counts.get("new") ?? 0,
      inProgress,
      ready: counts.get("ready") ?? 0,
      withRider: counts.get("on_the_road") ?? 0,
      value,
    };
  }, [orders, counts]);

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-[28px] font-extrabold tracking-[-0.03em]">Orders</h1>
          <p className="mt-1 text-sm text-muted">
            Accept, pack, then hand off to a rider.
          </p>
        </div>
        <div className="flex items-center gap-2 text-[11px] text-muted">
          <span className="inline-flex items-center gap-1.5 font-medium text-brand-dark">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-brand" />
            Live
          </span>
          <span>{lastUpdated ? `updated ${timeAgo(new Date(lastUpdated).toISOString(), now)}` : "connecting…"}</span>
          <button
            type="button"
            onClick={() => load()}
            className="grid h-7 w-7 place-items-center rounded-full border border-line bg-white text-muted hover:text-ink"
            aria-label="Refresh orders"
          >
            <RefreshIcon className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-5">
        {[
          { label: "New orders", value: stats.newOrders, tone: "text-on-primary-container" },
          { label: "In progress", value: stats.inProgress, tone: "text-ink" },
          { label: "Ready", value: stats.ready, tone: "text-brand-dark" },
          { label: "With rider", value: stats.withRider, tone: "text-ink" },
          { label: "Order value", value: formatNaira(stats.value), tone: "text-ink" },
        ].map((stat) => (
          <div
            key={stat.label}
            className={`px-4 py-3 ${
              stat.label === "New orders"
                ? "rounded-[24px_24px_24px_8px] bg-primary-container text-on-primary-container"
                : "m3-container"
            }`}
          >
            <p className="text-[11px] font-bold">{stat.label}</p>
            <p className={`mt-1 text-lg font-extrabold tabular-nums ${stat.tone}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      {actionError && (
        <div
          role="alert"
          className="mt-4 flex items-center justify-between gap-3 rounded-[18px] bg-error-container px-4 py-3 text-xs font-bold text-error"
        >
          <span>{actionError}</span>
          <button type="button" onClick={() => setActionError(null)} className="font-bold underline">
            Dismiss
          </button>
        </div>
      )}

      <div className="mt-6 flex flex-wrap gap-1.5">
        {BUCKETS.map((bucket) => {
          const active = filter === bucket.key;
          const count = counts.get(bucket.key) ?? 0;
          return (
            <button
              key={bucket.key}
              type="button"
              onClick={() => setFilter(bucket.key)}
              aria-pressed={active}
              className={`chip-m3 h-9 px-3.5 text-xs ${active ? "" : "border border-outline-variant"}`}
            >
              {bucket.label}
              <span className={`ml-1.5 tabular-nums ${active ? "text-white/70" : "text-muted/70"}`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {state === "loading" && (
        <div className="mt-4 space-y-2">
          {[0, 1, 2].map((index) => (
            <div key={index} className="h-20 animate-pulse rounded-[24px] bg-surface-container" />
          ))}
        </div>
      )}

      {state === "error" && (
        <div className="mt-4 rounded-[24px] bg-error-container px-5 py-8 text-center">
          <p className="text-sm font-bold text-error">{error}</p>
          <button
            type="button"
            onClick={() => {
              setState("loading");
              load();
            }}
            className="btn-primary mt-3 h-10 px-4 text-xs"
          >
            Try again
          </button>
        </div>
      )}

      {state === "ready" && orders.length === 0 && (
        <div className="m3-container mt-4 px-6 py-14 text-center">
          <p className="text-4xl" aria-hidden>
            🧺
          </p>
          <p className="mt-2 text-sm font-extrabold">No orders yet</p>
          <p className="mt-1 text-xs text-muted">
            New orders show up here the second someone checks out.
          </p>
        </div>
      )}

      {state === "ready" && orders.length > 0 && visible.length === 0 && (
        <div className="m3-container mt-4 px-6 py-12 text-center">
          <p className="text-sm font-bold">Nothing in this bucket</p>
          <p className="mt-1 text-xs text-muted">Try another filter.</p>
        </div>
      )}

      <ul className="mt-4 space-y-2.5">
        {visible.map((order) => {
          const next = VENDOR_NEXT_ACTION[order.status];
          const cancellable = ["pending", "accepted", "preparing"].includes(order.status);
          const open = expanded === order.id;
          const itemCount = order.items.reduce((sum, item) => sum + item.quantity, 0);
          const busy = busyId === order.id;

          return (
            <li key={order.id} className="overflow-hidden rounded-[26px] bg-white shadow-[0_8px_28px_-22px_rgba(0,40,20,0.35)] ring-1 ring-outline-variant">
              <div className="flex flex-wrap items-center gap-3 px-4 py-3.5">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs font-semibold tracking-tight">
                      {order.reference}
                    </span>
                    <StatusBadge status={order.status} />
                    <span className="text-[11px] text-muted">
                      {timeAgo(order.createdAt, now)}
                    </span>
                  </div>
                  <p className="mt-1 truncate text-sm">
                    {order.customerName}
                    <span className="text-muted"> · {itemCount} item{itemCount === 1 ? "" : "s"} · </span>
                    <span className="tabular-nums">{formatNaira(order.total)}</span>
                  </p>
                </div>

                <div className="flex items-center gap-1.5">
                  {next && (
                    <button
                      type="button"
                      onClick={() => changeStatus(order, next.to)}
                      disabled={busy}
                      className="btn-primary h-9 px-3.5 text-[11px]"
                    >
                      {busy ? "Saving…" : next.label}
                    </button>
                  )}
                  {cancellable && (
                    <button
                      type="button"
                      onClick={() => {
                        if (window.confirm(`Cancel ${order.reference}? Stock will be returned.`)) {
                          changeStatus(order, "cancelled");
                        }
                      }}
                      disabled={busy}
                      className="btn-quiet h-9 rounded-[14px] px-3 text-[11px] font-bold hover:text-error"
                    >
                      Cancel
                    </button>
                  )}
                  {!next && !cancellable && (
                    <span className="rounded-[14px] bg-surface-container px-3 py-2 text-[11px] font-bold text-on-surface-variant">
                      {order.status === "ready"
                        ? "Waiting for a rider"
                        : order.status === "assigned" || order.status === "out_for_delivery"
                          ? `${order.riderName ?? "Rider"} has it`
                          : "Closed"}
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => setExpanded(open ? null : order.id)}
                    className="grid h-7 w-7 place-items-center rounded-full border border-line text-muted transition-colors hover:text-ink"
                    aria-label={open ? "Hide details" : "Show details"}
                    aria-expanded={open}
                  >
                    <ChevronIcon
                      className={`h-3.5 w-3.5 transition-transform ${open ? "rotate-180" : ""}`}
                    />
                  </button>
                </div>
              </div>

              {open && (
                <div className="animate-pop grid gap-4 border-t border-line px-4 py-4 text-xs sm:grid-cols-[1fr_1fr]">
                  <div>
                    <h3 className="text-[11px] font-semibold uppercase tracking-wide text-muted">
                      Delivery
                    </h3>
                    <p className="mt-1.5 text-sm">{order.customerName}</p>
                    <p className="text-muted">{order.customerPhone}</p>
                    <p className="mt-1 leading-relaxed">{order.deliveryAddress}</p>
                    {order.deliveryNote && (
                      <p className="mt-1.5 rounded-lg bg-canvas px-2.5 py-1.5 text-[11px] text-muted">
                        “{order.deliveryNote}”
                      </p>
                    )}

                    <h3 className="mt-4 text-[11px] font-semibold uppercase tracking-wide text-muted">
                      Items
                    </h3>
                    <ul className="mt-1.5 space-y-1">
                      {order.items.map((item) => (
                        <li key={item.productId} className="flex justify-between gap-2">
                          <span>
                            <span aria-hidden className="mr-1">
                              {item.emoji}
                            </span>
                            {item.name} × {item.quantity}
                          </span>
                          <span className="tabular-nums text-muted">{formatNaira(item.subtotal)}</span>
                        </li>
                      ))}
                    </ul>
                    <div className="mt-2 flex justify-between border-t border-line pt-2 font-semibold">
                      <span>Total {order.riderName ? `· ${order.riderName}` : ""}</span>
                      <span className="tabular-nums">{formatNaira(order.total)}</span>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-[11px] font-semibold uppercase tracking-wide text-muted">
                      Activity
                    </h3>
                    <ol className="mt-1.5 space-y-2">
                      {order.events.map((event, index) => (
                        <li key={`${event.status}-${index}`} className="flex gap-2">
                          <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-brand" />
                          <div>
                            <p className="font-medium">{statusLabel(event.status)}</p>
                            <p className="text-[11px] text-muted">
                              {event.note} · {formatDateTime(event.createdAt)}
                            </p>
                          </div>
                        </li>
                      ))}
                    </ol>
                    <p className="mt-4 text-[11px] text-muted">
                      Order id <span className="font-mono">{order.id.slice(0, 8)}…</span>
                    </p>
                  </div>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
