import { AdminBoard } from "@/components/AdminBoard";
import { listOrders } from "@/lib/orders";

export const dynamic = "force-dynamic";

export const metadata = { title: "Vendor dashboard" };

export default async function AdminPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <AdminBoard initialOrders={await listOrders({ limit: 100 })} />
    </div>
  );
}
