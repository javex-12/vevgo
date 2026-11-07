import { STATUS_LABELS, STATUS_STYLES } from "@/lib/status";
import type { OrderStatus } from "@/lib/types";

export function StatusBadge({
  status,
  className = "",
}: {
  status: OrderStatus;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-[12px] px-2.5 py-1 text-[11px] font-extrabold ${STATUS_STYLES[status]} ${className}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" aria-hidden />
      {STATUS_LABELS[status]}
    </span>
  );
}
