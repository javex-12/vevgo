import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { AddToCart } from "@/components/AddToCart";
import { BackButton } from "@/components/BackButton";
import { ProductCard } from "@/components/ProductCard";
import { ProductThumb } from "@/components/ProductThumb";
import { ArrowLeftIcon, ClockIcon, PinIcon } from "@/components/icons";
import { DELIVERY_FEE, formatNaira } from "@/lib/money";
import { getProductById, listProducts } from "@/lib/products";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const product = await getProductById(decodeURIComponent(id));
  if (!product) return { title: "Product not found" };

  return {
    title: product.name,
    description: `${product.description} ${product.unit} · ${formatNaira(product.price)}.`,
    openGraph: {
      title: `${product.name} · Vevgo Grocery`,
      description: product.description,
      images: [{ url: `/products/${product.id}.jpg`, alt: product.name }],
    },
  };
}

export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const product = await getProductById(decodeURIComponent(id));
  if (!product) notFound();

  const related = (await listProducts())
    .filter((item) => item.category === product.category && item.id !== product.id)
    .slice(0, 4);

  return (
    <div className="mx-auto max-w-5xl px-4 py-6">
      <div className="flex items-center gap-2 text-xs text-muted">
        <BackButton className="flex h-9 items-center gap-1.5 rounded-full bg-surface-container px-3.5 font-bold text-on-surface-variant transition-colors hover:text-ink">
          <ArrowLeftIcon className="h-3.5 w-3.5" />
          Back
        </BackButton>
        <span aria-hidden>/</span>
        <span className="font-bold">{product.category}</span>
      </div>

      <div className="mt-4 grid gap-6 lg:grid-cols-[1.15fr_1fr] lg:gap-10">
        <div className="tile-m3 relative aspect-[4/3] bg-surface-container lg:aspect-square">
          <ProductThumb
            productId={product.id}
            emoji={product.emoji}
            name={product.name}
            className="h-full w-full"
            sizes="(max-width: 1024px) 92vw, 520px"
          />
          {!product.isAvailable && (
            <span className="absolute inset-0 grid place-items-center bg-white/75 text-sm font-extrabold uppercase tracking-widest text-muted">
              Sold out
            </span>
          )}
        </div>

        <div className="lg:pt-2">
          <span className="inline-flex rounded-full bg-surface-container px-3 py-1.5 text-[11px] font-extrabold uppercase tracking-wide text-on-surface-variant">
            {product.category}
          </span>
          <h1 className="mt-3 text-[32px] font-extrabold leading-[1.05] tracking-[-0.03em]">
            {product.name}
          </h1>
          <p className="mt-1.5 text-sm font-bold text-muted">{product.unit}</p>

          <p className="mt-4 text-3xl font-extrabold tabular-nums">{formatNaira(product.price)}</p>
          <p className="mt-1 text-xs text-muted">
            Delivery {formatNaira(DELIVERY_FEE)} · pay when it arrives
          </p>

          <p className="mt-5 text-sm leading-relaxed text-on-surface-variant">{product.description}</p>

          <AddToCart product={product} />

          <dl className="mt-6 grid gap-2">
            {[
              { icon: ClockIcon, label: "Packed and out the door in about 15 minutes" },
              { icon: PinIcon, label: "Delivered to your address by a Vevgo rider" },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-2.5 text-xs font-medium text-muted">
                <span className="grid h-8 w-8 place-items-center rounded-[12px] bg-surface-container text-on-surface-variant">
                  <Icon className="h-4 w-4" />
                </span>
                {label}
              </div>
            ))}
          </dl>
        </div>
      </div>

      {related.length > 0 && (
        <section className="mt-12">
          <h2 className="text-[22px] font-extrabold tracking-[-0.02em]">
            More {product.category.toLowerCase()}
          </h2>
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
            {related.map((item, index) => (
              <ProductCard key={item.id} product={item} index={index} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
