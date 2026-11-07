"use client";

import { useRouter } from "next/navigation";
import type { ReactNode } from "react";

/**
 * Goes back to the previous screen (keeping the shopper where they were),
 * and only falls back to a fixed route when the page was opened directly.
 */
export function BackButton({
  children,
  fallback = "/",
  className = "",
}: {
  children: ReactNode;
  fallback?: string;
  className?: string;
}) {
  const router = useRouter();

  function goBack() {
    const cameFromSameSite =
      typeof document !== "undefined" && document.referrer.startsWith(window.location.origin);

    if (cameFromSameSite || window.history.length > 2) {
      router.back();
      return;
    }

    router.push(fallback);
  }

  return (
    <button type="button" onClick={goBack} className={className}>
      {children}
    </button>
  );
}
