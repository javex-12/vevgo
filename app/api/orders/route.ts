import { errorResponse } from "@/lib/api-error";
import { createOrder, listOrders } from "@/lib/orders";
import { ORDER_STATUSES, type OrderStatus } from "@/lib/types";

export const dynamic = "force-dynamic";

function parseStatuses(params: URLSearchParams): OrderStatus[] | undefined {
  const raw = params.getAll("status").flatMap((value) => value.split(","));
  const statuses = raw
    .map((value) => value.trim().toLowerCase())
    .filter((value): value is OrderStatus => (ORDER_STATUSES as readonly string[]).includes(value));
  return statuses.length > 0 ? statuses : undefined;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = Number(searchParams.get("limit") ?? 100);
    // The storefront has no accounts, so the customer's order page asks for the
    // references it remembers instead of listing every order in the database.
    const references = searchParams
      .getAll("references")
      .flatMap((value) => value.split(","))
      .map((value) => value.trim())
      .filter(Boolean);
    const orders = await listOrders({
      statuses: parseStatuses(searchParams),
      references,
      limit: Number.isFinite(limit) ? limit : 100,
    });
    return Response.json({ orders }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return Response.json(
        { error: { code: "invalid_json", message: "Request body must be valid JSON." } },
        { status: 400 },
      );
    }

    const idempotencyKey = request.headers.get("Idempotency-Key")?.slice(0, 100) || null;
    const { order, created } = await createOrder(body, idempotencyKey);

    return Response.json({ order }, { status: created ? 201 : 200 });
  } catch (error) {
    return errorResponse(error);
  }
}
