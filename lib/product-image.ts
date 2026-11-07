/**
 * Real produce photos live in /public/products. They are keyed by the seeded
 * product id, so order lines can show the same photo without storing it.
 * Photos: Wikimedia Commons (freely licensed); see README for attribution.
 */
const PRODUCT_IMAGES: Record<string, string> = {
  "tomato-1kg": "/products/tomato-1kg.jpg",
  "banana-bunch": "/products/banana-bunch.jpg",
  "rice-5kg": "/products/rice-5kg.jpg",
  "milk-1l": "/products/milk-1l.jpg",
  "onion-1kg": "/products/onion-1kg.jpg",
  "avocado-3pk": "/products/avocado-3pk.jpg",
  "eggs-12": "/products/eggs-12.jpg",
  "bread-sourdough": "/products/bread-sourdough.jpg",
  "juice-orange": "/products/juice-orange.jpg",
  "chicken-breast": "/products/chicken-breast.jpg",
  "spinach-500g": "/products/spinach-500g.jpg",
  "corn-2cobs": "/products/corn-2cobs.jpg",
};

export function productImage(productId: string): string | null {
  return PRODUCT_IMAGES[productId] ?? null;
}
