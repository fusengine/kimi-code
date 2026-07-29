/** Cart domain types — single source of truth for pricing inputs. */
export interface CartLine {
  sku: string;
  unitPriceCents: number;
  quantity: number;
  category: "food" | "books" | "other";
}

export interface Discount {
  kind: "percentage" | "fixed";
  value: number; // percentage 0-100, or fixed cents
}
