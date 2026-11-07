"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useState,
} from "react";
import type { Product } from "@/lib/types";

export interface CartLine {
  productId: string;
  name: string;
  emoji: string;
  unit: string;
  unitPrice: number;
  stock: number;
  quantity: number;
}

type Action =
  | { type: "hydrate"; lines: CartLine[] }
  | { type: "add"; line: CartLine }
  | { type: "setQuantity"; productId: string; quantity: number }
  | { type: "remove"; productId: string }
  | { type: "clear" };

const STORAGE_KEY = "vevgo.cart.v1";

function clamp(quantity: number, stock: number): number {
  return Math.max(0, Math.min(quantity, stock));
}

function reducer(lines: CartLine[], action: Action): CartLine[] {
  switch (action.type) {
    case "hydrate":
      return action.lines;
    case "add": {
      const existing = lines.find((line) => line.productId === action.line.productId);
      if (!existing) {
        return [...lines, { ...action.line, quantity: clamp(action.line.quantity, action.line.stock) }];
      }
      return lines.map((line) =>
        line.productId === action.line.productId
          ? {
              ...line,
              // Refresh price/stock from the catalogue in case they changed.
              unitPrice: action.line.unitPrice,
              stock: action.line.stock,
              quantity: clamp(line.quantity + action.line.quantity, action.line.stock),
            }
          : line,
      );
    }
    case "setQuantity":
      return lines
        .map((line) =>
          line.productId === action.productId
            ? { ...line, quantity: clamp(action.quantity, line.stock) }
            : line,
        )
        .filter((line) => line.quantity > 0);
    case "remove":
      return lines.filter((line) => line.productId !== action.productId);
    case "clear":
      return [];
    default:
      return lines;
  }
}

interface CartContextValue {
  lines: CartLine[];
  count: number;
  subtotal: number;
  hydrated: boolean;
  isOpen: boolean;
  addProduct: (product: Product, quantity?: number) => void;
  setQuantity: (productId: string, quantity: number) => void;
  removeProduct: (productId: string) => void;
  clearCart: () => void;
  openCart: () => void;
  closeCart: () => void;
  quantityOf: (productId: string) => number;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [lines, dispatch] = useReducer(reducer, []);
  const [hydrated, setHydrated] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  // The cart lives in localStorage so a refresh does not lose the basket. The
  // read is deferred a tick so the server-rendered markup and the first client
  // render agree before the basket appears.
  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        const stored = window.localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored) as CartLine[];
          if (Array.isArray(parsed)) {
            dispatch({ type: "hydrate", lines: parsed.filter((line) => line && line.productId) });
          }
        }
      } catch {
        // Corrupt storage is not worth crashing the shop over; start empty.
      }
      setHydrated(true);
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
    } catch {
      // Storage can be full or disabled; the cart still works for this session.
    }
  }, [lines, hydrated]);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const addProduct = useCallback((product: Product, quantity = 1) => {
    dispatch({
      type: "add",
      line: {
        productId: product.id,
        name: product.name,
        emoji: product.emoji,
        unit: product.unit,
        unitPrice: product.price,
        stock: product.stock,
        quantity,
      },
    });
    setIsOpen(true);
  }, []);

  const setQuantity = useCallback((productId: string, quantity: number) => {
    dispatch({ type: "setQuantity", productId, quantity });
  }, []);

  const removeProduct = useCallback((productId: string) => {
    dispatch({ type: "remove", productId });
  }, []);

  const clearCart = useCallback(() => dispatch({ type: "clear" }), []);

  const value = useMemo<CartContextValue>(() => {
    const count = lines.reduce((sum, line) => sum + line.quantity, 0);
    const subtotal = lines.reduce((sum, line) => sum + line.unitPrice * line.quantity, 0);
    return {
      lines,
      count,
      subtotal,
      hydrated,
      isOpen,
      addProduct,
      setQuantity,
      removeProduct,
      clearCart,
      openCart: () => setIsOpen(true),
      closeCart: () => setIsOpen(false),
      quantityOf: (productId: string) =>
        lines.find((line) => line.productId === productId)?.quantity ?? 0,
    };
  }, [lines, hydrated, isOpen, addProduct, setQuantity, removeProduct, clearCart]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used inside <CartProvider>");
  return context;
}
