"use client";

import { usePathname } from "next/navigation";

/** Re-runs a soft spring entrance whenever the route changes. */
export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div key={pathname} className="page-enter">
      {children}
    </div>
  );
}
