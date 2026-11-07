export interface SeedProduct {
  id: string;
  name: string;
  description: string;
  category: string;
  unit: string;
  emoji: string;
  /** Price in kobo. */
  price: number;
  stock: number;
}

/** Demo catalogue. Prices are illustrative and stored in kobo. */
export const SEED_PRODUCTS: SeedProduct[] = [
  {
    id: "tomato-1kg",
    name: "Fresh Tomatoes",
    description: "Vine-ripened and firm, hand-picked this morning.",
    category: "Vegetables",
    unit: "1 kg",
    emoji: "🍅",
    price: 250_000,
    stock: 40,
  },
  {
    id: "banana-bunch",
    name: "Cavendish Bananas",
    description: "Naturally sweet bunch of six, ready to eat.",
    category: "Fruits",
    unit: "bunch of 6",
    emoji: "🍌",
    price: 180_000,
    stock: 25,
  },
  {
    id: "rice-5kg",
    name: "Long Grain Rice",
    description: "Clean, stone-free parboiled rice for everyday meals.",
    category: "Grains",
    unit: "5 kg bag",
    emoji: "🍚",
    price: 1_200_000,
    stock: 18,
  },
  {
    id: "milk-1l",
    name: "Whole Milk",
    description: "Fresh full-cream milk, pasteurised and chilled.",
    category: "Dairy",
    unit: "1 L",
    emoji: "🥛",
    price: 95_000,
    stock: 30,
  },
  {
    id: "onion-1kg",
    name: "Red Onions",
    description: "Crisp, full-flavoured onions from the north.",
    category: "Vegetables",
    unit: "1 kg",
    emoji: "🧅",
    price: 130_000,
    stock: 35,
  },
  {
    id: "avocado-3pk",
    name: "Hass Avocados",
    description: "Buttery and ripe, perfect for toast and salads.",
    category: "Fruits",
    unit: "pack of 3",
    emoji: "🥑",
    price: 320_000,
    stock: 12,
  },
  {
    id: "eggs-12",
    name: "Farm Eggs",
    description: "Free-range eggs, graded and carefully packed.",
    category: "Dairy",
    unit: "crate of 12",
    emoji: "🥚",
    price: 420_000,
    stock: 22,
  },
  {
    id: "bread-sourdough",
    name: "Sourdough Loaf",
    description: "Baked daily with a crackling crust and soft crumb.",
    category: "Bakery",
    unit: "600 g loaf",
    emoji: "🍞",
    price: 280_000,
    stock: 9,
  },
  {
    id: "juice-orange",
    name: "Orange Juice",
    description: "Cold-pressed, no added sugar, no concentrate.",
    category: "Drinks",
    unit: "1 L",
    emoji: "🧃",
    price: 150_000,
    stock: 16,
  },
  {
    id: "chicken-breast",
    name: "Chicken Breast",
    description: "Boneless skinless fillets, trimmed by the butcher.",
    category: "Meat",
    unit: "1 kg",
    emoji: "🍗",
    price: 550_000,
    stock: 10,
  },
  {
    id: "spinach-500g",
    name: "Fresh Spinach",
    description: "Tender green leaves, washed and ready to cook.",
    category: "Vegetables",
    unit: "500 g",
    emoji: "🥬",
    price: 110_000,
    stock: 14,
  },
  {
    id: "corn-2cobs",
    name: "Sweet Corn",
    description: "Plump golden cobs, sweet and crunchy.",
    category: "Vegetables",
    unit: "2 cobs",
    emoji: "🌽",
    price: 90_000,
    stock: 20,
  },
];
