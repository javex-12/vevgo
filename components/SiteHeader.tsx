"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCart } from "./CartProvider";
import { CartIcon } from "./icons";

/**
 * Just the brand and the cart. Everything else (shop, my orders, vendor and
 * rider boards) lives in the footer, so the header stays quiet on mobile.
 */
export function SiteHeader() {
  const pathname = usePathname();
  const { count, openCart, hydrated } = useCart();
  const staffView = pathname.startsWith("/admin") || pathname.startsWith("/rider");

  return (
    <header className="sticky top-0 z-30 border-b border-outline-variant bg-white/85 backdrop-blur-xl">
      <div className="mx-auto flex h-[68px] max-w-6xl items-center justify-between gap-3 px-4">
        <Link href="/" className="flex items-center gap-2.5" aria-label="Vevgo Grocery home">
          <Image
            src="/brand/vevgo-wordmark.png"
            alt="Vevgo"
            width={1004}
            height={304}
            priority
            className="h-6 w-auto"
          />
          <span className="text-[10px] font-bold uppercase tracking-[0.22em] text-muted">
            Grocery
          </span>
        </Link>

        {!staffView && (
          <button
            type="button"
            onClick={openCart}
            className="btn-primary h-11 shrink-0 rounded-[18px] px-3.5 text-sm"
          >
            <CartIcon className="h-4.5 w-4.5" aria-hidden />
            <span className="hidden sm:inline">Cart</span>
            <span
              className={`grid h-5 min-w-5 place-items-center rounded-full px-1.5 text-[11px] font-extrabold ${
                hydrated && count > 0
                  ? "bg-primary-container text-on-primary-container"
                  : "bg-white/20 text-white"
              }`}
              aria-label={`${hydrated ? count : 0} items in cart`}
            >
              {hydrated ? count : 0}
            </span>
          </button>
        )}
      </div>
    </header>
  );
}
