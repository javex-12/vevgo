import { CheckoutForm } from "@/components/CheckoutForm";

export const metadata = { title: "Checkout" };

export default function CheckoutPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="mb-6">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted">Checkout</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">Almost there</h1>
        <p className="mt-1 text-sm text-muted">
          Tell us where to deliver. The vendor starts packing as soon as you place the order.
        </p>
      </div>
      <CheckoutForm />
    </div>
  );
}
