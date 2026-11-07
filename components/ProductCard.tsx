"use client";

import Link from "next/link";
import { useCart } from "./CartProvider";
import { ProductThumb } from "./ProductThumb";
import { MinusIcon, PlusIcon } from "./icons";
import { formatNaira } from "@/lib/money";
import type { Product } from "@/lib/types";

export function ProductCard({ product, index = 0 }: { product: Product; index?: number }) {
  const { quantityOf, addProduct, setQuantity } = useCart();
  const quantity = quantityOf(product.id);
  const soldOut = !product.isAvailable;

  return (
    <article className="group m3-card flex flex-col overflow-hidden p-2 pb-3 sm:p-2.5 sm:pb-3.5">
      <Link
        href={`/product/${product.id}`}
        className={`tile-m3 relative block aspect-square bg-surface-container ${index % 2 ? "tile-m3-b" : ""}`}
        aria-label={`View ${product.name}`}
      >
        <ProductThumb
          productId={product.id}
          emoji={product.emoji}
          name={product.name}
          className="h-full w-full"
          sizes="(max-width: 640px) 45vw, 260px"
          eager={index < 6}
        />
        {soldOut && (
          <span className="absolute inset-0 grid place-items-center bg-white/75 text-[11px] font-extrabold uppercase tracking-wider text-muted">
            Sold out
          </span>
        )}
        {product.stock > 0 && product.stock <= 5 && (
          <span className="absolute left-2 top-2 rounded-full bg-white/95 px-2.5 py-1 text-[10px] font-extrabold text-amber-700">
            Only {product.stock} left
          </span>
        )}
      </Link>

      <div className="mt-2.5 flex flex-1 flex-col sm:mt-3">
        <Link href={`/product/${product.id}`} className="px-1">
          <h3 className="text-sm font-extrabold leading-snug tracking-[-0.01em] hover:text-brand-dark sm:text-[15px]">
            {product.name}
          </h3>
        </Link>
        <p className="mt-0.5 px-1 text-[11px] text-muted sm:text-xs">{product.unit}</p>

        <div className="mt-auto flex flex-wrap items-center justify-between gap-x-1.5 gap-y-1.5 px-1 pt-2.5 sm:flex-nowrap sm:gap-2 sm:px-1.5 sm:pt-3">
          <span className="min-w-0 truncate text-[13.5px] font-extrabold tabular-nums sm:text-[15px]">
            {formatNaira(product.price)}
          </span>

          {soldOut ? (
            <span className="shrink-0 rounded-full bg-surface-container px-2.5 py-1.5 text-[10px] font-bold text-muted sm:px-3 sm:py-2 sm:text-[11px]">
              Unavailable
            </span>
          ) : quantity > 0 ? (
            <div className="animate-pop flex shrink-0 items-center rounded-[14px] bg-primary-container text-on-primary-container sm:rounded-[18px]">
              <button
                type="button"
                onClick={() => setQuantity(product.id, quantity - 1)}
                className="grid h-8 w-7 place-items-center rounded-l-[14px] transition-transform active:scale-90 sm:h-11 sm:w-9 sm:rounded-l-[18px]"
                aria-label={`Decrease ${product.name}`}
              >
                <MinusIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </button>
              <span className="w-5 text-center text-xs font-extrabold tabular-nums sm:w-6 sm:text-sm">
                {quantity}
              </span>
              <button
                type="button"
                onClick={() => setQuantity(product.id, quantity + 1)}
                disabled={quantity >= product.stock}
                className="grid h-8 w-7 place-items-center rounded-r-[14px] transition-transform active:scale-90 disabled:opacity-40 sm:h-11 sm:w-9 sm:rounded-r-[18px]"
                aria-label={`Increase ${product.name}`}
              >
                <PlusIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => addProduct(product)}
              className="btn-primary h-8 w-8 shrink-0 rounded-[12px] sm:h-11 sm:w-11 sm:rounded-[16px]"
              aria-label={`Add ${product.name}`}
            >
              <PlusIcon className="h-4 w-4 sm:h-5 sm:w-5" />
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
