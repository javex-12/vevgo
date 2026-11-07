"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { useCart } from "./CartProvider";
import { ProductThumb } from "./ProductThumb";
import { DELIVERY_FEE, formatNaira } from "@/lib/money";
import { saveOrderReference } from "@/lib/saved-orders";

type FieldName = "name" | "phone" | "address" | "note";

const FIELDS: Array<{
  name: FieldName;
  label: string;
  placeholder: string;
  type?: string;
  autoComplete?: string;
  optional?: boolean;
  textarea?: boolean;
}> = [
  {
    name: "name",
    label: "Full name",
    placeholder: "Michael Adeyemi",
    autoComplete: "name",
  },
  {
    name: "phone",
    label: "Phone number",
    placeholder: "08012345678",
    type: "tel",
    autoComplete: "tel",
  },
  {
    name: "address",
    label: "Delivery address",
    placeholder: "12 Allen Avenue, Ikeja, Lagos",
    autoComplete: "street-address",
    textarea: true,
  },
  {
    name: "note",
    label: "Delivery note",
    placeholder: "Gate code, landmarks, or “call on arrival”",
    optional: true,
    textarea: true,
  },
];

export function CheckoutForm() {
  const router = useRouter();
  const { lines, subtotal, clearCart, hydrated } = useCart();

  const [values, setValues] = useState<Record<FieldName, string>>({
    name: "",
    phone: "",
    address: "",
    note: "",
  });
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<FieldName, string>>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const idempotencyKey = useRef<string>("");

  const cartSignature = useMemo(
    () => lines.map((line) => `${line.productId}:${line.quantity}`).join("|"),
    [lines],
  );

  // A fresh key per cart, so a retried request after a network blip returns the
  // same order instead of creating a duplicate.
  useEffect(() => {
    idempotencyKey.current = crypto.randomUUID();
  }, [cartSignature]);

  const total = subtotal + DELIVERY_FEE;

  function update(name: FieldName, value: string) {
    setValues((current) => ({ ...current, [name]: value }));
    setFieldErrors((current) => ({ ...current, [name]: undefined }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting || lines.length === 0) return;

    if (!idempotencyKey.current) idempotencyKey.current = crypto.randomUUID();

    setSubmitting(true);
    setFormError(null);
    setFieldErrors({});

    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Idempotency-Key": idempotencyKey.current,
        },
        body: JSON.stringify({
          customer: {
            name: values.name,
            phone: values.phone,
            address: values.address,
            note: values.note,
          },
          items: lines.map((line) => ({ productId: line.productId, quantity: line.quantity })),
        }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        const details = (data?.error?.details ?? {}) as Record<string, string>;
        setFieldErrors({
          name: details.name,
          phone: details.phone,
          address: details.address,
          note: undefined,
        });
        setFormError(data?.error?.message ?? "We could not place your order. Please try again.");
        return;
      }

      clearCart();
      // Remember the reference so the customer's order list can show it later.
      saveOrderReference(data.order.reference);
      router.push(`/orders/${data.order.reference}?new=1`);
    } catch {
      setFormError("Network problem — check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (hydrated && lines.length === 0) {
    return (
      <div className="m3-container mx-auto max-w-md px-6 py-14 text-center">
        <p className="text-sm font-extrabold">There is nothing to check out</p>
        <p className="mt-1 text-xs text-muted">Add a few groceries to your cart first.</p>
        <Link href="/" className="btn-primary mt-5 h-11 px-5 text-xs">
          Browse groceries
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-6 lg:grid-cols-[1.35fr_1fr]">
      <section className="m3-card p-5 sm:p-6">
        <h2 className="text-base font-extrabold tracking-tight">Delivery details</h2>
        <p className="mt-0.5 text-xs text-muted">
          We share only these details with the vendor packing your order and the rider.
        </p>

        <div className="mt-5 space-y-4">
          {FIELDS.map((field) => {
            const error = fieldErrors[field.name];
            const shared =
              "w-full rounded-[18px] border-2 border-transparent bg-surface-container px-4 py-3 text-sm font-medium outline-none transition-all duration-300 ease-spring placeholder:text-muted/60 focus:rounded-[24px] focus:border-primary";
            return (
              <div key={field.name}>
                <label htmlFor={field.name} className="mb-1.5 flex items-baseline gap-1.5 text-xs font-medium">
                  {field.label}
                  {field.optional && <span className="font-normal text-muted">(optional)</span>}
                </label>
                {field.textarea ? (
                  <textarea
                    id={field.name}
                    name={field.name}
                    rows={field.name === "address" ? 2 : 2}
                    value={values[field.name]}
                    onChange={(event) => update(field.name, event.target.value)}
                    placeholder={field.placeholder}
                    aria-invalid={Boolean(error)}
                    className={`${shared} resize-none ${error ? "border-error" : ""}`}
                  />
                ) : (
                  <input
                    id={field.name}
                    name={field.name}
                    type={field.type ?? "text"}
                    inputMode={field.name === "phone" ? "tel" : undefined}
                    autoComplete={field.autoComplete}
                    value={values[field.name]}
                    onChange={(event) => update(field.name, event.target.value)}
                    placeholder={field.placeholder}
                    aria-invalid={Boolean(error)}
                    className={`${shared} ${error ? "border-error" : ""}`}
                  />
                )}
                {error && <p className="mt-1 pl-4 text-[11px] font-bold text-error">{error}</p>}
              </div>
            );
          })}
        </div>
      </section>

      <aside className="lg:sticky lg:top-20 lg:self-start">
        <section className="m3-card p-5 sm:p-6">
          <div className="flex items-baseline justify-between">
            <h2 className="text-base font-extrabold tracking-tight">Order summary</h2>
            <span className="text-xs text-muted">
              {lines.reduce((sum, line) => sum + line.quantity, 0)} items
            </span>
          </div>

          <ul className="mt-4 space-y-3">
            {lines.map((line) => (
              <li key={line.productId} className="flex items-center gap-3">
                <ProductThumb
                  productId={line.productId}
                  emoji={line.emoji}
                  name={line.name}
                  className="h-11 w-11 rounded-[14px_14px_14px_5px]"
                  sizes="44px"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm">{line.name}</p>
                  <p className="text-[11px] text-muted">
                    {line.quantity} × {formatNaira(line.unitPrice)}
                  </p>
                </div>
                <span className="text-sm tabular-nums">{formatNaira(line.unitPrice * line.quantity)}</span>
              </li>
            ))}
          </ul>

          <dl className="mt-4 space-y-1.5 border-t border-line pt-4 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted">Subtotal</dt>
              <dd className="tabular-nums">{formatNaira(subtotal)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted">Delivery fee</dt>
              <dd className="tabular-nums">{formatNaira(DELIVERY_FEE)}</dd>
            </div>
            <div className="flex justify-between border-t border-dashed border-line pt-2 text-base font-semibold">
              <dt>Total</dt>
              <dd className="tabular-nums">{formatNaira(total)}</dd>
            </div>
          </dl>

          {formError && (
            <p
              role="alert"
              className="mt-4 rounded-[16px] bg-error-container px-3.5 py-2.5 text-[11px] font-bold text-error"
            >
              {formError}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting || lines.length === 0}
            className="btn-primary mt-4 h-[52px] w-full px-4 text-sm"
          >
            {submitting ? (
              <>
                <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                Placing order…
              </>
            ) : (
              `Place order · ${formatNaira(total)}`
            )}
          </button>

          <Link
            href="/"
            className="mt-2 block text-center text-[11px] font-medium text-muted hover:text-ink"
          >
            Back to shop
          </Link>
        </section>
      </aside>
    </form>
  );
}
