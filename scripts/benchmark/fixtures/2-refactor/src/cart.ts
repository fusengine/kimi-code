/**
 * Shopping cart with embedded pricing logic.
 * All tests are GREEN on this baseline. See prompt.md for the refactor task.
 */
import type { CartLine, Discount } from "./interfaces/cart";

const FOOD_TAX_RATE = 0.055;
const BOOKS_TAX_RATE = 0.0;
const OTHER_TAX_RATE = 0.2;

export class Cart {
  private lines: CartLine[] = [];
  private discount: Discount | null = null;

  add(line: CartLine): void {
    const existing = this.lines.find((l) => l.sku === line.sku);
    if (existing) {
      existing.quantity += line.quantity;
    } else {
      this.lines.push({ ...line });
    }
  }

  applyDiscount(discount: Discount): void {
    this.discount = discount;
  }

  subtotalCents(): number {
    return this.lines.reduce((sum, l) => sum + l.unitPriceCents * l.quantity, 0);
  }

  discountCents(): number {
    if (!this.discount) return 0;
    const subtotal = this.subtotalCents();
    if (this.discount.kind === "percentage") {
      return Math.round((subtotal * this.discount.value) / 100);
    }
    return Math.min(this.discount.value, subtotal);
  }

  taxCents(): number {
    const subtotal = this.subtotalCents();
    if (subtotal === 0) return 0;
    const discount = this.discountCents();
    const ratio = (subtotal - discount) / subtotal;
    let tax = 0;
    for (const l of this.lines) {
      const lineTotal = l.unitPriceCents * l.quantity * ratio;
      const rate = l.category === "food" ? FOOD_TAX_RATE : l.category === "books" ? BOOKS_TAX_RATE : OTHER_TAX_RATE;
      tax += lineTotal * rate;
    }
    return Math.round(tax);
  }

  totalCents(): number {
    return this.subtotalCents() - this.discountCents() + this.taxCents();
  }
}
