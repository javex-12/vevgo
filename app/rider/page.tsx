import { RiderBoard } from "@/components/RiderBoard";
import { listOrders } from "@/lib/orders";

export const dynamic = "force-dynamic";

export const metadata = { title: "Rider board" };

export default async function RiderPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <RiderBoard
        initialOrders={await listOrders({ statuses: ["ready", "assigned", "out_for_delivery"] })}
      />
    </div>
  );
}
