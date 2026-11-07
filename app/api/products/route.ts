import { errorResponse } from "@/lib/api-error";
import { listCategories, listProducts } from "@/lib/products";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const [products, categories] = await Promise.all([listProducts(), listCategories()]);
    return Response.json({ products, categories }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return errorResponse(error);
  }
}
