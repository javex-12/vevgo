import { errorResponse } from "@/lib/api-error";
import { findOrder } from "@/lib/orders";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const order = await findOrder(id);
    if (!order) {
      return Response.json(
        { error: { code: "order_not_found", message: "We could not find that order." } },
        { status: 404 },
      );
    }
    return Response.json({ order }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return errorResponse(error);
  }
}
