export type CartItem = {
  sku: string;
  qty: number;
  unitPrice: number;
};

export const lineTotal = (item: CartItem): number => item.qty * item.unitPrice;

export const cartTotal = (items: CartItem[]): number =>
  items.reduce((sum, item) => sum + lineTotal(item), 0);
