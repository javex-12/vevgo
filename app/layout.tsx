import type { Metadata, Viewport } from "next";
import Link from "next/link";
import { Plus_Jakarta_Sans } from "next/font/google";
import { CartProvider } from "@/components/CartProvider";
import { CartDrawer } from "@/components/CartDrawer";
import { PageTransition } from "@/components/PageTransition";
import { Preloader } from "@/components/Preloader";
import { SiteHeader } from "@/components/SiteHeader";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "700", "800"],
  variable: "--font-jakarta",
  display: "swap",
});

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "http://localhost:3000");

const description =
  "Order fresh groceries from Vevgo: browse the market, build a basket and follow your order from the vendor all the way to your gate.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Vevgo Grocery — fresh groceries, delivered",
    template: "%s · Vevgo Grocery",
  },
  description,
  applicationName: "Vevgo Grocery",
  keywords: [
    "Vevgo",
    "grocery delivery",
    "online market",
    "same day delivery",
    "Lagos groceries",
  ],
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: "Vevgo Grocery",
    locale: "en_NG",
    url: "/",
    title: "Vevgo Grocery — fresh groceries, delivered",
    description,
    images: [
      {
        url: "/og.png",
        width: 1200,
        height: 630,
        alt: "Vevgo Grocery — fresh groceries, delivered",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Vevgo Grocery — fresh groceries, delivered",
    description,
    images: ["/og.png"],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#ffffff",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${jakarta.variable} h-full`}>
      <body className="flex min-h-full flex-col bg-white">
        <CartProvider>
          <Preloader />
          <SiteHeader />
          <main className="flex-1">
            <PageTransition>{children}</PageTransition>
          </main>
          <footer className="mt-16 border-t border-line bg-white">
            <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-8 pb-24 text-sm text-muted sm:flex-row sm:items-center sm:justify-between sm:pb-8">
              <p>
                <span className="font-bold text-ink">Vevgo Grocery</span> — fresh groceries,
                delivered to your door.
              </p>
              <p className="text-xs">
                <Link className="font-semibold text-brand-dark hover:underline" href="/">
                  Shop
                </Link>{" "}
                ·{" "}
                <Link className="font-semibold text-brand-dark hover:underline" href="/orders">
                  My orders
                </Link>{" "}
                ·{" "}
                <Link className="font-semibold text-brand-dark hover:underline" href="/admin">
                  Vendor dashboard
                </Link>{" "}
                ·{" "}
                <Link className="font-semibold text-brand-dark hover:underline" href="/rider">
                  Rider board
                </Link>
              </p>
            </div>
          </footer>
          <CartDrawer />
        </CartProvider>
      </body>
    </html>
  );
}
