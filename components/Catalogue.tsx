"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ProductCard } from "./ProductCard";
import { ScooterArt } from "./ScooterArt";
import { ArrowRightIcon, BoxIcon, SearchIcon, XIcon } from "./icons";
import type { Product } from "@/lib/types";

interface CatalogueProps {
  products: Product[];
  categories: string[];
}

export function Catalogue({ products, categories }: CatalogueProps) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string>("All");

  const visible = useMemo(() => {
    const term = query.trim().toLowerCase();
    return products.filter((product) => {
      const inCategory = category === "All" || product.category === category;
      const matches =
        term.length === 0 ||
        product.name.toLowerCase().includes(term) ||
        product.description.toLowerCase().includes(term) ||
        product.category.toLowerCase().includes(term);
      return inCategory && matches;
    });
  }, [products, query, category]);

  return (
    <div className="mx-auto max-w-6xl px-4">
      <section className="relative mt-5 overflow-hidden rounded-[40px_40px_40px_14px] bg-[linear-gradient(130deg,#052115_0%,#0a3f26_46%,#0d8a4c_100%)] px-6 py-9 text-white sm:px-10 sm:py-11">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-brand/25 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-0 h-44 bg-[radial-gradient(65%_100%_at_15%_100%,rgba(157,247,182,0.22),transparent_70%)]"
        />
        <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="max-w-md">
            <p className="text-[11px] font-extrabold uppercase tracking-[0.22em] text-primary-container">
              Same-day grocery
            </p>
            <h1 className="mt-2.5 text-[34px] font-extrabold leading-[1.03] tracking-[-0.035em] sm:text-[46px]">
              Groceries at your gate.
            </h1>
            <p className="mt-3 max-w-sm text-sm font-medium text-white/70">
              Fresh produce, packed the moment you check out and brought over by a Vevgo rider.
            </p>
            <div className="mt-7">
              <Link
                href="/orders"
                className="group inline-flex h-12 items-center gap-2 rounded-full bg-white px-5 text-sm font-extrabold text-brand-dark shadow-[0_16px_32px_-18px_rgba(0,0,0,0.75)] transition-transform duration-300 ease-spring active:scale-95 sm:px-6"
              >
                <BoxIcon className="h-4 w-4" />
                My orders
                <ArrowRightIcon className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" />
              </Link>
            </div>
          </div>

          <div className="animate-float w-44 self-end text-white/95 sm:w-56 sm:self-center">
            <ScooterArt className="h-auto w-full drop-shadow-[0_18px_30px_rgba(0,0,0,0.35)]" />
          </div>
        </div>
      </section>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-[22px] font-extrabold tracking-[-0.02em]">
            {query ? "Search results" : "Shop groceries"}
          </h2>
          <p className="mt-0.5 text-xs text-muted">
            {visible.length} {visible.length === 1 ? "product" : "products"}
            {category !== "All" ? ` in ${category}` : ""}
          </p>
        </div>

        <label className="relative flex h-14 w-full items-center gap-2.5 rounded-[28px] bg-surface-container px-5 transition-all duration-300 ease-spring focus-within:rounded-[18px] focus-within:shadow-[inset_0_0_0_2px_var(--color-primary)] sm:max-w-sm">
          <SearchIcon className="h-5 w-5 shrink-0 text-muted" aria-hidden />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search tomatoes, rice, milk"
            aria-label="Search groceries"
            className="h-full w-full min-w-0 bg-transparent text-sm font-medium outline-none placeholder:text-muted/70"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="rounded-full p-1.5 text-muted hover:bg-white hover:text-ink"
              aria-label="Clear search"
            >
              <XIcon className="h-4 w-4" />
            </button>
          )}
        </label>
      </div>

      <div className="-mx-4 mt-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {["All", ...categories].map((item) => {
          const active = category === item;
          return (
            <button
              key={item}
              type="button"
              onClick={() => setCategory(item)}
              aria-pressed={active}
              className="chip-m3"
            >
              {item}
            </button>
          );
        })}
      </div>

      {visible.length === 0 ? (
        <div className="m3-container mt-8 px-6 py-14 text-center">
          <p className="text-4xl" aria-hidden>
            🔍
          </p>
          <p className="mt-3 text-sm font-extrabold">Nothing matches that search</p>
          <p className="mt-1 text-xs text-muted">Try another word, or clear the filters.</p>
          <button
            type="button"
            onClick={() => {
              setQuery("");
              setCategory("All");
            }}
            className="btn-primary mt-5 h-11 px-5 text-xs"
          >
            Show everything
          </button>
        </div>
      ) : (
        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
          {visible.map((product, index) => (
            <ProductCard key={product.id} product={product} index={index} />
          ))}
        </div>
      )}
    </div>
  );
}
