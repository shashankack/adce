export type OrderStatus = "pending" | "paid" | "cancelled";

export type Order = {
  id: string;
  customerId: string;
  amountCents: number;
  status: OrderStatus;
};

const store = new Map<string, Order>();

export const createOrder = (
  id: string,
  customerId: string,
  amountCents: number,
): Order => {
  if (store.has(id)) {
    throw new Error(`order ${id} already exists`);
  }
  const order: Order = { id, customerId, amountCents, status: "pending" };
  store.set(id, order);
  return order;
};

export const getOrder = (id: string): Order | undefined => store.get(id);

export const markPaid = (id: string): Order => {
  const order = store.get(id);
  if (!order) throw new Error(`order ${id} not found`);
  order.status = "paid";
  return order;
};
