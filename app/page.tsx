import { Catalogue } from "@/components/Catalogue";
import { listCategories, listProducts } from "@/lib/products";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [products, categories] = await Promise.all([listProducts(), listCategories()]);
  return (
    <div className="pb-4">
      <Catalogue products={products} categories={categories} />
    </div>
  );
}
