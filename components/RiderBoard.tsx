"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { StatusBadge } from "./StatusBadge";
import { BoxIcon, PinIcon, RefreshIcon } from "./icons";
import { formatNaira } from "@/lib/money";
import { timeAgo, nowMs } from "@/lib/format";
import { RIDER_NEXT_ACTION } from "@/lib/status";
import type { Order, OrderStatus } from "@/lib/types";

const RIDER_QUEUE: OrderStatus[] = ["ready", "assigned", "out_for_delivery"];

export function RiderBoard({ initialOrders }: { initialOrders: Order[] }) {
  // Server-rendered first paint, then polling keeps the board current.
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [state, setState] = useState<"loading" | "ready" | "error">("ready");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [riderName, setRiderName] = useState("Tunde Okafor");
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);
  const [now, setNow] = useState(() => nowMs());
  const mounted = useRef(true);
  const nameLoaded = useRef(false);

  useEffect(() => {
    // Read the saved rider name after hydration so server and client markup match.
    const timer = window.setTimeout(() => {
      const stored = window.localStorage.getItem("vevgo.rider.name");
      if (stored) setRiderName(stored);
      nameLoaded.current = true;
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!nameLoaded.current) return;
    window.localStorage.setItem("vevgo.rider.name", riderName);
  }, [riderName]);

  const load = useCallback(async (options?: { silent?: boolean }) => {
    try {
      const response = await fetch(`/api/orders?status=${RIDER_QUEUE.join(",")}`, {
        cache: "no-store",
      });
      if (!response.ok) throw new Error("request failed");
      const data = (await response.json()) as { orders: Order[] };
      if (!mounted.current) return;
      setOrders(data.orders);
      setState("ready");
      setLastUpdated(nowMs());
    } catch {
      if (!mounted.current || options?.silent) return;
      setState("error");
    }
  }, []);

  useEffect(() => {
    mounted.current = true;
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

  async function advance(order: Order, to: OrderStatus) {
    setBusyId(order.id);
    setActionError(null);
    try {
      const response = await fetch(`/api/orders/${order.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: to, actor: "rider", riderName }),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        setActionError(data?.error?.message ?? "Could not update this delivery.");
        return;
      }
      const updated = data.order as Order;
      setOrders((current) =>
        RIDER_QUEUE.includes(updated.status)
          ? current.map((item) => (item.id === updated.id ? updated : item))
          : current.filter((item) => item.id !== updated.id),
      );
      setLastUpdated(nowMs());
    } catch {
      setActionError("Network problem while updating the delivery. Try again.");
    } finally {
      setBusyId(null);
    }
  }

  const available = useMemo(() => orders.filter((order) => order.status === "ready"), [orders]);
  const active = useMemo(() => orders.filter((order) => order.status !== "ready"), [orders]);

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-[28px] font-extrabold tracking-[-0.03em]">My deliveries</h1>
          <p className="mt-1 max-w-lg text-sm text-muted">
            Orders appear here the moment a vendor marks them ready. Accept one, pick it up and
            deliver it.
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
            aria-label="Refresh deliveries"
          >
            <RefreshIcon className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      <div className="m3-container mt-5 flex flex-wrap items-center gap-3 px-4 py-3">
        <div className="grid h-11 w-11 place-items-center rounded-[18px_18px_18px_6px] bg-primary-container text-lg font-extrabold text-on-primary-container">
          {(riderName.trim()[0] ?? "R").toUpperCase()}
        </div>
        <div className="min-w-0">
          <label htmlFor="rider-name" className="text-[11px] font-bold uppercase tracking-wide text-muted">
            Rider profile
          </label>
          <input
            id="rider-name"
            value={riderName}
            onChange={(event) => setRiderName(event.target.value)}
            className="block w-48 rounded-[14px] border-2 border-transparent bg-white px-3 py-1.5 text-sm font-bold outline-none transition-all focus:border-primary"
          />
        </div>
        <span className="text-[11px] text-muted sm:ml-auto">Shown on the orders you accept.</span>
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

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <section>
          <div className="flex items-baseline justify-between">
            <h2 className="text-sm font-semibold">Ready for pickup</h2>
            <span className="text-[11px] text-muted">{available.length}</span>
          </div>

          {state === "loading" && (
            <div className="mt-3 space-y-2">
              {[0, 1].map((index) => (
                <div key={index} className="h-32 animate-pulse rounded-[26px] bg-surface-container" />
              ))}
            </div>
          )}

          {state === "error" && (
            <div className="mt-3 rounded-[26px] bg-error-container px-5 py-8 text-center">
              <p className="text-sm font-bold text-error">Could not load deliveries</p>
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

          {state === "ready" && available.length === 0 && (
            <div className="m3-container mt-3 px-6 py-12 text-center">
              <div className="mx-auto grid h-14 w-14 place-items-center rounded-[22px_22px_22px_7px] bg-primary-container text-on-primary-container">
                <BoxIcon className="h-7 w-7" />
              </div>
              <p className="mt-3 text-sm font-extrabold">No orders awaiting pickup</p>
              <p className="mt-1 text-xs text-muted">New pickups appear here automatically.</p>
            </div>
          )}

          <ul className="mt-3 space-y-2.5">
            {available.map((order) => {
              const next = RIDER_NEXT_ACTION[order.status];
              const busy = busyId === order.id;
              return (
                <li key={order.id} className="m3-card p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs font-semibold">{order.reference}</span>
                    <StatusBadge status={order.status} />
                    <span className="text-[11px] text-muted">{timeAgo(order.createdAt, now)}</span>
                  </div>
                  <p className="mt-2 flex items-start gap-1.5 text-sm">
                    <PinIcon className="mt-0.5 h-4 w-4 shrink-0 text-brand-dark" />
                    <span>{order.deliveryAddress}</span>
                  </p>
                  <p className="mt-1 text-[11px] text-muted">
                    {order.customerName} · {order.customerPhone} ·{" "}
                    {order.items.reduce((sum, item) => sum + item.quantity, 0)} items ·{" "}
                    {formatNaira(order.total)}
                  </p>
                  {next && (
                    <button
                      type="button"
                      onClick={() => advance(order, next.to)}
                      disabled={busy}
                      className="btn-primary mt-3 h-11 w-full text-xs"
                    >
                      {busy ? "Saving…" : next.label}
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        </section>

        <section>
          <div className="flex items-baseline justify-between">
            <h2 className="text-sm font-semibold">Active deliveries</h2>
            <span className="text-[11px] text-muted">{active.length}</span>
          </div>

          {state === "ready" && active.length === 0 && (
            <div className="m3-container mt-3 px-6 py-12 text-center">
              <p className="text-sm font-bold">Nothing on the road</p>
              <p className="mt-1 text-xs text-muted">Accept a delivery to start.</p>
            </div>
          )}

          <ul className="mt-3 space-y-2.5">
            {active.map((order) => {
              const next = RIDER_NEXT_ACTION[order.status];
              const busy = busyId === order.id;
              return (
                <li key={order.id} className="m3-card p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs font-semibold">{order.reference}</span>
                    <StatusBadge status={order.status} />
                    <span className="text-[11px] text-muted">
                      {order.riderName ? `with ${order.riderName}` : ""}
                    </span>
                  </div>
                  <p className="mt-2 flex items-start gap-1.5 text-sm">
                    <PinIcon className="mt-0.5 h-4 w-4 shrink-0 text-brand-dark" />
                    <span>{order.deliveryAddress}</span>
                  </p>
                  <p className="mt-1 text-[11px] text-muted">
                    {order.customerName} · {order.customerPhone} · {formatNaira(order.total)} · pay on
                    delivery
                  </p>
                  {next && (
                    <button
                      type="button"
                      onClick={() => advance(order, next.to)}
                      disabled={busy}
                      className="btn-tonal mt-3 h-11 w-full text-xs"
                    >
                      {busy ? "Saving…" : next.label}
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        </section>
      </div>
    </div>
  );
}
