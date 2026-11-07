import { formatTime } from "@/lib/format";
import { STATUS_LABELS } from "@/lib/status";
import type { Order } from "@/lib/types";

const STEPS = [
  "pending",
  "accepted",
  "preparing",
  "ready",
  "assigned",
  "out_for_delivery",
  "delivered",
] as const;

export function StatusTimeline({ order }: { order: Order }) {
  const reachedIndex = STEPS.indexOf(order.status as (typeof STEPS)[number]);

  if (order.status === "cancelled") {
    const cancelledAt = order.events.find((event) => event.status === "cancelled")?.createdAt;
    return (
      <div className="mt-3 rounded-[20px] bg-error-container px-4 py-3 text-sm text-error">
        <p className="font-bold">This order was cancelled</p>
        <p className="mt-0.5 text-xs">
          {cancelledAt ? `Cancelled at ${formatTime(cancelledAt)}. ` : ""}
          Any reserved stock has been returned to the shelf.
        </p>
      </div>
    );
  }

  return (
    <ol className="mt-4">
      {STEPS.map((step, index) => {
        const reached = index <= reachedIndex;
        const current = index === reachedIndex;
        const eventAt = order.events.find((event) => event.status === step)?.createdAt;
        const last = index === STEPS.length - 1;

        return (
          <li key={step} className="flex gap-3">
            <div className="flex w-4 flex-col items-center">
              <span
                className={`mt-1 grid h-3.5 w-3.5 shrink-0 place-items-center rounded-full ${
                  reached ? "bg-primary" : "border border-outline bg-white"
                } ${current ? "ring-4 ring-primary-container" : ""}`}
              >
                {reached && <span className="h-1.5 w-1.5 rounded-full bg-white" />}
              </span>
              {!last && (
                <span
                  className={`w-px flex-1 ${index < reachedIndex ? "bg-primary/40" : "bg-line"}`}
                  aria-hidden
                />
              )}
            </div>
            <div className={`pb-5 ${last ? "pb-0" : ""}`}>
              <p
                className={`text-sm ${
                  current ? "font-extrabold text-ink" : reached ? "font-bold text-ink" : "font-medium text-muted"
                }`}
              >
                {STATUS_LABELS[step]}
              </p>
              <p className="text-[11px] text-muted">
                {eventAt
                  ? formatTime(eventAt)
                  : current
                    ? "In progress"
                    : index === reachedIndex + 1
                      ? "Next"
                      : "Waiting"}
              </p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
