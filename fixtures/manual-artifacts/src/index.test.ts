import { getOrder, placeAndPay } from "./index.js";

export function testPlaceAndPay(): void {
  const order = placeAndPay("ord_1", "cust_9", 1500);
  if (order.status !== "paid") throw new Error("expected paid");
  if (getOrder("ord_1")?.amountCents !== 1500) {
    throw new Error("order not stored");
  }
}
