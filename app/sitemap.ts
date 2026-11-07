import type { MetadataRoute } from "next";
import { listProducts } from "@/lib/products";

const base =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "http://localhost:3000");

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const products = await listProducts().catch(() => []);

  return [
    { url: base, changeFrequency: "daily", priority: 1 },
    { url: `${base}/orders`, changeFrequency: "monthly", priority: 0.3 },
    ...products.map((product) => ({
      url: `${base}/product/${product.id}`,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
  ];
}
