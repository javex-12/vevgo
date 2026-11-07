"use client";

import Link from "next/link";
import { useCart } from "./CartProvider";
import { ProductThumb } from "./ProductThumb";
import { BoxIcon, MinusIcon, PlusIcon, TrashIcon, XIcon } from "./icons";
import { DELIVERY_FEE, formatNaira } from "@/lib/money";

export function CartDrawer() {
  const { lines, count, subtotal, isOpen, closeCart, setQuantity, removeProduct } = useCart();

  if (!isOpen) return null;

  const total = subtotal + DELIVERY_FEE;

  return (
    <div className="fixed inset-0 z-40" role="dialog" aria-modal="true" aria-label="Shopping cart">
      <button
        type="button"
        aria-label="Close cart"
        onClick={closeCart}
        className="absolute inset-0 h-full w-full cursor-default bg-ink/35 backdrop-blur-[3px]"
      />
      <aside className="animate-slide-in absolute inset-y-0 right-0 flex w-full max-w-md flex-col rounded-l-[32px] bg-white shadow-[0_30px_80px_-40px_rgba(0,40,20,0.5)]">
        <header className="flex items-center justify-between border-b border-outline-variant px-5 py-4">
          <div>
            <h2 className="text-base font-semibold">Your cart</h2>
            <p className="text-xs text-muted">
              {count === 0 ? "Nothing here yet" : `${count} item${count === 1 ? "" : "s"}`}
            </p>
          </div>
          <button
            type="button"
            onClick={closeCart}
            className="rounded-full p-2 text-muted transition-colors hover:bg-canvas hover:text-ink"
            aria-label="Close cart"
          >
            <XIcon className="h-4.5 w-4.5" />
          </button>
        </header>

        {lines.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 px-8 text-center">
            <div className="grid h-16 w-16 place-items-center rounded-[24px_24px_24px_8px] bg-primary-container text-on-primary-container">
              <BoxIcon className="h-8 w-8" />
            </div>
            <p className="text-sm font-medium">Your cart is empty</p>
            <p className="text-xs text-muted">
              Add a few groceries and they will show up here.
            </p>
            <button
              type="button"
              onClick={closeCart}
              className="btn-primary mt-1 h-11 px-5 text-xs"
            >
              Browse groceries
            </button>
          </div>
        ) : (
          <>
            <ul className="flex-1 divide-y divide-line overflow-y-auto px-5">
              {lines.map((line) => (
                <li key={line.productId} className="flex gap-3 py-4">
                  <ProductThumb
                    productId={line.productId}
                    emoji={line.emoji}
                    name={line.name}
                    className="h-14 w-14 rounded-[18px_18px_18px_6px]"
                    sizes="56px"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{line.name}</p>
                        <p className="text-xs text-muted">
                          {line.unit} · {formatNaira(line.unitPrice)}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeProduct(line.productId)}
                        className="rounded-md p-1 text-muted transition-colors hover:bg-rose-50 hover:text-rose-600"
                        aria-label={`Remove ${line.name}`}
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="mt-2 flex items-center justify-between">
                      <div className="flex items-center gap-1 rounded-full border border-line">
                        <button
                          type="button"
                          onClick={() => setQuantity(line.productId, line.quantity - 1)}
                          className="grid h-7 w-7 place-items-center rounded-full text-muted transition-colors hover:bg-canvas hover:text-ink"
                          aria-label={`Decrease ${line.name}`}
                        >
                          <MinusIcon className="h-3.5 w-3.5" />
                        </button>
                        <span className="w-6 text-center text-sm font-semibold tabular-nums">
                          {line.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => setQuantity(line.productId, line.quantity + 1)}
                          disabled={line.quantity >= line.stock}
                          className="grid h-7 w-7 place-items-center rounded-full text-muted transition-colors hover:bg-canvas hover:text-ink disabled:cursor-not-allowed disabled:opacity-35"
                          aria-label={`Increase ${line.name}`}
                        >
                          <PlusIcon className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <span className="text-sm font-semibold tabular-nums">
                        {formatNaira(line.unitPrice * line.quantity)}
                      </span>
                    </div>
                  </div>
                </li>
              ))}
            </ul>

            <footer className="border-t border-line px-5 py-4">
              <dl className="space-y-1.5 text-sm">
                <div className="flex justify-between">
                  <dt className="text-muted">Subtotal</dt>
                  <dd className="tabular-nums">{formatNaira(subtotal)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted">Delivery</dt>
                  <dd className="tabular-nums">{formatNaira(DELIVERY_FEE)}</dd>
                </div>
                <div className="flex justify-between border-t border-dashed border-line pt-2 text-base font-semibold">
                  <dt>Total</dt>
                  <dd className="tabular-nums">{formatNaira(total)}</dd>
                </div>
              </dl>
              <Link
                href="/checkout"
                onClick={closeCart}
                className="btn-primary mt-4 h-[52px] w-full px-4 text-sm"
              >
                Continue to checkout
              </Link>
              <button
                type="button"
                onClick={closeCart}
                className="mt-2 w-full rounded-xl px-4 py-2 text-xs font-medium text-muted hover:text-ink"
              >
                Keep shopping
              </button>
            </footer>
          </>
        )}
      </aside>
    </div>
  );
}
