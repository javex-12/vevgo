"use client";

import Link from "next/link";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import { ProductThumb } from "./ProductThumb";
import { StatusBadge } from "./StatusBadge";
import { ArrowRightIcon, BoxIcon, ChevronIcon, PinIcon, RefreshIcon } from "./icons";
import { nowMs, timeAgo } from "@/lib/format";
import { formatNaira } from "@/lib/money";
import { readSavedOrderReferences, saveOrderReference } from "@/lib/saved-orders";
import { statusLabel } from "@/lib/status";
import type { Order, OrderStatus } from "@/lib/types";

const STEPS: OrderStatus[] = [
  "pending",
  "accepted",
  "preparing",
  "ready",
  "assigned",
  "out_for_delivery",
  "delivered",
];

/** One line that answers "so where is it?" without making people read a badge. */
const HEADLINE: Record<OrderStatus, string> = {
  pending: "Waiting for the vendor",
  accepted: "The vendor accepted your order",
  preparing: "Packing your groceries",
  ready: "Ready for a rider",
  assigned: "A rider is picking it up",
  out_for_delivery: "On the way to your door",
  delivered: "Delivered — enjoy",
  cancelled: "This order was cancelled",
};

function isLive(status: OrderStatus) {
  return status !== "delivered" && status !== "cancelled";
}

export function MyOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const [now, setNow] = useState(() => nowMs());
  const [lookup, setLookup] = useState("");
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [looking, setLooking] = useState(false);

  const load = useCallback(async (options?: { silent?: boolean }) => {
    const references = readSavedOrderReferences();
    if (references.length === 0) {
      setOrders([]);
      setState("ready");
      return;
    }
    try {
      const response = await fetch(
        `/api/orders?references=${encodeURIComponent(references.join(","))}`,
        { cache: "no-store" },
      );
      if (!response.ok) throw new Error("request failed");
      const data = (await response.json()) as { orders: Order[] };
      setOrders(data.orders);
      setState("ready");
    } catch {
      if (!options?.silent) setState("error");
    }
  }, []);

  useEffect(() => {
    // Read the saved references after hydration, then keep the statuses fresh.
    const kickoff = window.setTimeout(() => load(), 0);
    const poll = window.setInterval(() => {
      if (document.visibilityState === "visible") load({ silent: true });
    }, 5000);
    const clock = window.setInterval(() => setNow(nowMs()), 30_000);
    return () => {
      window.clearTimeout(kickoff);
      window.clearInterval(poll);
      window.clearInterval(clock);
    };
  }, [load]);

  /** Orders live in the browser, so a cleared cache would hide them — let people
   *  paste the reference from their receipt to pull one back in. */
  async function trackByReference(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const reference = lookup.trim().toUpperCase();
    if (!reference) return;
    setLooking(true);
    setLookupError(null);
    try {
      const response = await fetch(`/api/orders/${encodeURIComponent(reference)}`, {
        cache: "no-store",
      });
      if (!response.ok) {
        setLookupError("No order matches that reference. Check the six characters after ORD-");
        return;
      }
      saveOrderReference(reference);
      setLookup("");
      await load();
    } catch {
      setLookupError("Could not reach the server — try again in a moment.");
    } finally {
      setLooking(false);
    }
  }

  const active = orders.filter((order) => isLive(order.status));
  const finished = orders.filter((order) => !isLive(order.status));
  const latest = active[0] ?? finished[0];

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[11px] font-extrabold uppercase tracking-[0.2em] text-muted">
            Your orders
          </p>
          <h1 className="mt-1.5 text-[30px] font-extrabold leading-[1.05] tracking-[-0.03em]">
            Where is my order?
          </h1>
          <p className="mt-1.5 text-sm text-muted">
            Follow it from the shelf to your gate — updates every few seconds.
          </p>
        </div>
        <button
          type="button"
          onClick={() => load()}
          className="btn-quiet h-10 px-4 text-[11px] font-bold"
        >
          <RefreshIcon className="h-3.5 w-3.5" />
          Refresh
        </button>
      </header>

      <form onSubmit={trackByReference} className="mt-5 flex items-stretch gap-2">
        <input
          value={lookup}
          onChange={(event) => {
            setLookup(event.target.value);
            setLookupError(null);
          }}
          placeholder="Track an order — ORD-XXXXXX"
          aria-label="Order reference"
          className="h-12 min-w-0 flex-1 rounded-full border border-outline-variant bg-white px-5 text-sm font-medium outline-none transition-colors placeholder:text-muted/70 focus:border-primary"
        />
        <button
          type="submit"
          disabled={looking || lookup.trim().length === 0}
          className="btn-primary h-12 shrink-0 px-5 text-xs font-extrabold disabled:opacity-45"
        >
          {looking ? "Checking" : "Find"}
        </button>
      </form>
      {lookupError && (
        <p className="mt-2 px-2 text-[11px] font-bold text-error">{lookupError}</p>
      )}

      {state === "loading" && (
        <div className="mt-6 space-y-3">
          <div className="h-56 animate-pulse rounded-[28px] bg-surface-container" />
          <div className="h-20 animate-pulse rounded-[24px] bg-surface-container" />
        </div>
      )}

      {state === "error" && (
        <div className="mt-6 rounded-[28px] bg-error-container px-6 py-10 text-center">
          <p className="text-sm font-extrabold text-error">Could not load your orders</p>
          <p className="mt-1 text-xs text-muted">Check your connection and try again.</p>
          <button
            type="button"
            onClick={() => {
              setState("loading");
              load();
            }}
            className="btn-primary mt-4 h-10 px-4 text-xs"
          >
            Try again
          </button>
        </div>
      )}

      {state === "ready" && orders.length === 0 && (
        <div className="m3-container mt-6 px-6 py-14 text-center">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-[26px_26px_26px_8px] bg-primary-container text-on-primary-container">
            <BoxIcon className="h-8 w-8" />
          </div>
          <p className="mt-4 text-base font-extrabold">No orders on this device yet</p>
          <p className="mx-auto mt-1.5 max-w-sm text-xs leading-relaxed text-muted">
            Fill a basket, check out, and this page will track it for you — no account needed.
          </p>
          <Link href="/" className="btn-primary mt-5 h-11 px-5 text-xs">
            Start shopping
          </Link>
        </div>
      )}

      {state === "ready" && latest && (
        <>
          {active.length > 0 && (
            <p className="mt-7 flex items-center gap-2 text-xs font-bold text-muted">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary" />
              {active.length} order{active.length === 1 ? "" : "s"} in progress
            </p>
          )}

          <section className="m3-card animate-pop mt-3 overflow-hidden">
            <div className="flex items-center justify-between gap-3 bg-primary-container px-5 py-3">
              <span className="font-mono text-[11px] font-extrabold tracking-tight text-on-primary-container">
                {latest.reference}
              </span>
              <StatusBadge status={latest.status} />
            </div>

            <div className="p-5">
              <p className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-muted">
                {isLive(latest.status) ? "Latest order" : "Most recent order"}
              </p>
              <h2 className="mt-1 text-[24px] font-extrabold leading-tight tracking-[-0.03em]">
                {HEADLINE[latest.status]}
              </h2>
              <p className="mt-1 text-xs text-muted">
                {timeAgo(latest.createdAt, now)} · {latest.items.reduce((sum, i) => sum + i.quantity, 0)}{" "}
                item{latest.items.reduce((sum, i) => sum + i.quantity, 0) === 1 ? "" : "s"} ·{" "}
                {formatNaira(latest.total)}
              </p>

              {latest.status === "cancelled" ? (
                <p className="mt-4 rounded-[16px] bg-error-container px-4 py-3 text-[11px] font-bold text-error">
                  Nothing was charged, and the items went back on the shelf.
                </p>
              ) : (
                <div className="mt-5">
                  <div className="flex items-center gap-1.5" aria-hidden>
                    {STEPS.map((step, stepIndex) => {
                      const done = stepIndex <= STEPS.indexOf(latest.status);
                      return (
                        <span
                          key={step}
                          className={`h-1.5 flex-1 rounded-full transition-colors duration-500 ${
                            done ? "bg-primary" : "bg-surface-container-high"
                          } ${stepIndex === STEPS.indexOf(latest.status) && isLive(latest.status) ? "animate-pulse" : ""}`}
                        />
                      );
                    })}
                  </div>
                  <div className="mt-2 flex items-baseline justify-between gap-2 text-[11px] font-bold">
                    <span className="text-muted">Placed</span>
                    <span className="truncate text-primary">{statusLabel(latest.status)}</span>
                    <span className="text-muted">Delivered</span>
                  </div>
                </div>
              )}

              <div className="mt-5 flex items-center gap-3">
                <div className="flex -space-x-2.5">
                  {latest.items.slice(0, 3).map((item) => (
                    <ProductThumb
                      key={item.productId}
                      productId={item.productId}
                      emoji={item.emoji}
                      name={item.name}
                      className="h-11 w-11 rounded-[14px] ring-2 ring-white"
                      sizes="44px"
                    />
                  ))}
                </div>
                <p className="min-w-0 flex-1 truncate text-xs font-medium text-muted">
                  {latest.riderName ? (
                    <span className="inline-flex items-center gap-1.5">
                      <PinIcon className="h-3.5 w-3.5" />
                      {latest.riderName} is on it
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5">
                      <PinIcon className="h-3.5 w-3.5" />
                      {latest.deliveryAddress}
                    </span>
                  )}
                </p>
              </div>

              <Link
                href={`/orders/${latest.reference}`}
                className="btn-primary mt-4 h-12 w-full text-sm font-extrabold"
              >
                Track this order
                <ArrowRightIcon className="h-4 w-4" />
              </Link>
            </div>
          </section>

          {orders.length > 1 && (
            <section className="mt-7">
              <h2 className="text-[11px] font-extrabold uppercase tracking-[0.2em] text-muted">
                Earlier orders
              </h2>
              <ul className="mt-3 space-y-2.5">
                {orders
                  .filter((order) => order.id !== latest.id)
                  .map((order) => {
                    const count = order.items.reduce((sum, item) => sum + item.quantity, 0);
                    return (
                      <li key={order.id}>
                        <Link
                          href={`/orders/${order.reference}`}
                          className="m3-card animate-pop flex items-center gap-3 p-3.5 transition-shadow hover:shadow-[0_14px_34px_-20px_rgba(0,40,20,0.4)]"
                        >
                          <div className="flex -space-x-3">
                            {order.items.slice(0, 2).map((item) => (
                              <ProductThumb
                                key={item.productId}
                                productId={item.productId}
                                emoji={item.emoji}
                                name={item.name}
                                className="h-12 w-12 rounded-[16px] ring-2 ring-white"
                                sizes="48px"
                              />
                            ))}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="truncate font-mono text-[11px] font-bold">
                                {order.reference}
                              </span>
                              <StatusBadge status={order.status} className="shrink-0" />
                            </div>
                            <p className="mt-1 truncate text-[11px] text-muted">
                              {timeAgo(order.createdAt, now)} · {count} item
                              {count === 1 ? "" : "s"} · {formatNaira(order.total)}
                            </p>
                          </div>
                          <ChevronIcon className="h-4 w-4 shrink-0 text-muted" />
                        </Link>
                      </li>
                    );
                  })}
              </ul>
            </section>
          )}
        </>
      )}
    </div>
  );
}
