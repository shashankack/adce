import { checkout } from "./index.js";
import { lineTotal } from "./cart.js";

export function testLineTotal(): void {
  if (lineTotal({ sku: "a", qty: 2, unitPrice: 3 }) !== 6) {
    throw new Error("lineTotal failed");
  }
}

export function testCheckout(): void {
  const result = checkout([
    { sku: "a", qty: 2, unitPrice: 3 },
    { sku: "b", qty: 1, unitPrice: 4 },
  ]);
  if (result.total !== 10 || result.currency !== "USD") {
    throw new Error("checkout failed");
  }
}
