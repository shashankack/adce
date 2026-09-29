import { createOrder, getOrder, markPaid } from "./orders.js";

export const placeAndPay = (
  id: string,
  customerId: string,
  amountCents: number,
) => {
  createOrder(id, customerId, amountCents);
  return markPaid(id);
};

export { createOrder, getOrder, markPaid };
