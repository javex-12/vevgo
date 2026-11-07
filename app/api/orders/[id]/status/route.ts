import { ApiError, errorResponse } from "@/lib/api-error";
import { updateOrderStatus } from "@/lib/orders";
import { ORDER_STATUSES, type OrderStatus, type StatusActor } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    let body: { status?: string; actor?: string; riderName?: string };
    try {
      body = await request.json();
    } catch {
      throw new ApiError(400, "invalid_json", "Request body must be valid JSON.");
    }

    const status = String(body.status ?? "").toLowerCase() as OrderStatus;
    if (!(ORDER_STATUSES as readonly string[]).includes(status)) {
      throw new ApiError(422, "invalid_status", `"${body.status}" is not a valid order status.`);
    }

    const actor = body.actor as StatusActor;
    if (actor !== "vendor" && actor !== "rider") {
      throw new ApiError(422, "invalid_actor", 'actor must be either "vendor" or "rider".');
    }

    const order = await updateOrderStatus(id, status, actor, body.riderName);
    return Response.json({ order });
  } catch (error) {
    return errorResponse(error);
  }
}
