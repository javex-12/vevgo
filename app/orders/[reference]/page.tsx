import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { LiveOrderRefresh } from "@/components/LiveOrderRefresh";
import { ProductThumb } from "@/components/ProductThumb";
import { StatusBadge } from "@/components/StatusBadge";
import { StatusTimeline } from "@/components/StatusTimeline";
import { CheckIcon, ClockIcon, PinIcon } from "@/components/icons";
import { formatDateTime } from "@/lib/format";
import { formatNaira } from "@/lib/money";
import { findOrder } from "@/lib/orders";

export const dynamic = "force-dynamic";

/** Every reference is a private, one-off receipt — keep them out of search. */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ reference: string }>;
}): Promise<Metadata> {
  const { reference } = await params;
  return { title: `Order ${reference.toUpperCase()}`, robots: { index: false, follow: false } };
}

export default async function OrderTrackingPage({
  params,
  searchParams,
}: {
  params: Promise<{ reference: string }>;
  searchParams: Promise<{ new?: string }>;
}) {
  const [{ reference }, query] = await Promise.all([params, searchParams]);
  const order = await findOrder(reference);

  if (!order) notFound();

  const justPlaced = query.new === "1";
  const live = order.status !== "delivered" && order.status !== "cancelled";
  const itemCount = order.items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <LiveOrderRefresh active={live} />

      {justPlaced && (
        <div className="animate-pop mb-6 flex items-start gap-3 rounded-2xl bg-brand-soft px-4 py-3.5 ring-1 ring-brand/25">
          <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-brand text-white">
            <CheckIcon className="h-3.5 w-3.5" />
          </span>
          <div>
            <p className="text-sm font-semibold text-brand-dark">Order received — thank you!</p>
            <p className="mt-0.5 text-xs text-brand-dark/80">
              The vendor has been notified and will start packing shortly. Save your reference{" "}
              <span className="font-semibold">{order.reference}</span>.
            </p>
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted">Order</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">{order.reference}</h1>
          <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
            <span className="inline-flex items-center gap-1">
              <ClockIcon className="h-3.5 w-3.5" />
              {formatDateTime(order.createdAt)}
            </span>
            <span>
              {itemCount} item{itemCount === 1 ? "" : "s"}
            </span>
            {live && (
              <span className="inline-flex items-center gap-1.5 font-medium text-brand-dark">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-brand" />
                Live
              </span>
            )}
          </p>
        </div>
        <StatusBadge status={order.status} className="mt-1 text-xs" />
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-[1.3fr_1fr]">
        <div className="space-y-5">
          <section className="m3-card p-5">
            <h2 className="text-sm font-extrabold">Items</h2>
            <ul className="mt-3 divide-y divide-line">
              {order.items.map((item) => (
                <li key={item.productId} className="flex items-center gap-3 py-3">
                  <ProductThumb
                    productId={item.productId}
                    emoji={item.emoji}
                    name={item.name}
                    className="h-11 w-11 rounded-[14px_14px_14px_5px]"
                    sizes="44px"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm">{item.name}</p>
                    <p className="text-[11px] text-muted">
                      {item.quantity} × {formatNaira(item.unitPrice)}
                    </p>
                  </div>
                  <span className="text-sm tabular-nums">{formatNaira(item.subtotal)}</span>
                </li>
              ))}
            </ul>

            <dl className="mt-3 space-y-1.5 border-t border-line pt-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted">Subtotal</dt>
                <dd className="tabular-nums">{formatNaira(order.subtotal)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted">Delivery fee</dt>
                <dd className="tabular-nums">{formatNaira(order.deliveryFee)}</dd>
              </div>
              <div className="flex justify-between text-base font-semibold">
                <dt>Total</dt>
                <dd className="tabular-nums">{formatNaira(order.total)}</dd>
              </div>
            </dl>
            <p className="mt-3 rounded-[14px] bg-surface-container px-3 py-2 text-[11px] font-medium text-muted">
              Pay the rider on delivery — cash or transfer.
            </p>
          </section>

          <section className="m3-card p-5">
            <h2 className="flex items-center gap-2 text-sm font-extrabold">
              <PinIcon className="h-4 w-4 text-brand-dark" />
              Delivering to
            </h2>
            <p className="mt-2 text-sm">{order.customerName}</p>
            <p className="text-xs text-muted">{order.customerPhone}</p>
            <p className="mt-2 text-sm leading-relaxed">{order.deliveryAddress}</p>
            {order.deliveryNote && (
              <p className="mt-2 rounded-lg bg-canvas px-3 py-2 text-[11px] text-muted">
                “{order.deliveryNote}”
              </p>
            )}
            {order.riderName && (
              <p className="mt-3 border-t border-line pt-3 text-xs text-muted">
                Rider: <span className="font-bold text-ink">{order.riderName}</span>
              </p>
            )}
          </section>
        </div>

        <section className="m3-card p-5 lg:sticky lg:top-24 lg:self-start">
          <h2 className="text-sm font-extrabold">Order progress</h2>
          <p className="mt-0.5 text-[11px] text-muted">
            {live ? "Updates automatically as the vendor works." : "This order is complete."}
          </p>
          <StatusTimeline order={order} />
          <Link href="/orders" className="btn-quiet mt-5 h-11 w-full text-xs">
            All my orders
          </Link>
          <Link href="/" className="btn-primary mt-2 h-11 w-full text-xs">
            Order something else
          </Link>
        </section>
      </div>
    </div>
  );
}
