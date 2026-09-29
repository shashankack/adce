import { cartTotal, type CartItem } from "./cart.js";

/** Checkout entry — no README on purpose for structure / context demos. */
export const checkout = (items: CartItem[]): { total: number; currency: string } => ({
  total: cartTotal(items),
  currency: "USD",
});

export type { CartItem };
