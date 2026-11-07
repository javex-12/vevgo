"use client";

import Image from "next/image";
import { useState } from "react";
import { productImage } from "@/lib/product-image";

/**
 * Square produce photo for a catalogue product, falling back to the seeded
 * emoji when a product has no photo or the file fails to load.
 */
export function ProductThumb({
  productId,
  emoji,
  name,
  className = "h-12 w-12",
  sizes = "96px",
  eager = false,
}: {
  productId: string;
  emoji: string;
  name: string;
  className?: string;
  sizes?: string;
  eager?: boolean;
}) {
  const src = productImage(productId);
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div
        className={`grid shrink-0 place-items-center bg-canvas text-lg ${className}`}
        aria-hidden
      >
        {emoji}
      </div>
    );
  }

  return (
    <div className={`relative shrink-0 overflow-hidden bg-canvas ${className}`}>
      <Image
        src={src}
        alt={name}
        fill
        unoptimized
        sizes={sizes}
        loading={eager ? "eager" : "lazy"}
        fetchPriority={eager ? "high" : "auto"}
        onError={() => setFailed(true)}
        className="object-cover"
      />
    </div>
  );
}
