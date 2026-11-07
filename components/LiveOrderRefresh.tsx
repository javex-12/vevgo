"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

/**
 * Keeps the customer's tracking page current while the vendor and rider move the
 * order along. In production this would be a Supabase realtime subscription or
 * a web socket; polling is enough for a prototype.
 */
export function LiveOrderRefresh({ active, intervalMs = 6000 }: { active: boolean; intervalMs?: number }) {
  const router = useRouter();

  useEffect(() => {
    if (!active) return;
    const timer = window.setInterval(() => {
      if (document.visibilityState === "visible") router.refresh();
    }, intervalMs);
    return () => window.clearInterval(timer);
  }, [active, intervalMs, router]);

  return null;
}
