"use client";

import { useState } from "react";
import { useCart } from "./CartProvider";
import { MinusIcon, PlusIcon } from "./icons";
import { formatNaira } from "@/lib/money";
import type { Product } from "@/lib/types";

export function AddToCart({ product }: { product: Product }) {
  const { addProduct, quantityOf } = useCart();
  const [quantity, setQuantity] = useState(1);
  const inCart = quantityOf(product.id);
  const soldOut = !product.isAvailable;
  const max = Math.max(1, product.stock);

  return (
    <div className="mt-6">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center rounded-[22px] bg-surface-container">
          <button
            type="button"
            onClick={() => setQuantity((value) => Math.max(1, value - 1))}
            disabled={soldOut || quantity <= 1}
            className="grid h-13 w-12 place-items-center rounded-l-[22px] transition-transform active:scale-90 disabled:opacity-40"
            aria-label="Decrease quantity"
          >
            <MinusIcon className="h-4.5 w-4.5" />
          </button>
          <span className="w-8 text-center text-base font-extrabold tabular-nums">{quantity}</span>
          <button
            type="button"
            onClick={() => setQuantity((value) => Math.min(max, value + 1))}
            disabled={soldOut || quantity >= max}
            className="grid h-13 w-12 place-items-center rounded-r-[22px] transition-transform active:scale-90 disabled:opacity-40"
            aria-label="Increase quantity"
          >
            <PlusIcon className="h-4.5 w-4.5" />
          </button>
        </div>

        <button
          type="button"
          onClick={() => addProduct(product, quantity)}
          disabled={soldOut}
          className="btn-primary h-13 flex-1 px-6 text-sm sm:flex-none sm:min-w-[240px]"
        >
          {soldOut ? "Sold out" : `Add ${quantity} · ${formatNaira(product.price * quantity)}`}
        </button>
      </div>

      <p className="mt-3 text-[11px] font-medium text-muted">
        {product.stock === 0
          ? "Back on the shelf soon."
          : `${product.stock} in stock${inCart > 0 ? ` · ${inCart} already in your cart` : ""}`}
      </p>
    </div>
  );
}
