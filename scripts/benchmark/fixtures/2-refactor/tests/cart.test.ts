/**
 * Baseline tests — GREEN before refactor, must stay GREEN after, UNMODIFIED.
 */
import { describe, expect, test } from "bun:test";
import { Cart } from "../src/cart";

describe("Cart pricing", () => {
  test("subtotal sums lines and merges duplicate skus", () => {
    const cart = new Cart();
    cart.add({ sku: "a", unitPriceCents: 1000, quantity: 1, category: "other" });
    cart.add({ sku: "a", unitPriceCents: 1000, quantity: 2, category: "other" });
    cart.add({ sku: "b", unitPriceCents: 500, quantity: 1, category: "food" });
    expect(cart.subtotalCents()).toBe(3500);
  });

  test("percentage discount rounds to nearest cent", () => {
    const cart = new Cart();
    cart.add({ sku: "a", unitPriceCents: 999, quantity: 1, category: "other" });
    cart.applyDiscount({ kind: "percentage", value: 10 });
    expect(cart.discountCents()).toBe(100);
  });

  test("fixed discount is capped at subtotal", () => {
    const cart = new Cart();
    cart.add({ sku: "a", unitPriceCents: 300, quantity: 1, category: "other" });
    cart.applyDiscount({ kind: "fixed", value: 5000 });
    expect(cart.discountCents()).toBe(300);
  });

  test("tax is prorated after discount, per category", () => {
    const cart = new Cart();
    cart.add({ sku: "f", unitPriceCents: 1000, quantity: 1, category: "food" });
    cart.add({ sku: "b", unitPriceCents: 1000, quantity: 1, category: "books" });
    cart.add({ sku: "o", unitPriceCents: 1000, quantity: 1, category: "other" });
    cart.applyDiscount({ kind: "percentage", value: 50 });
    // subtotal 3000, discount 1500, ratio 0.5
    // food: 500 * 5.5% = 27.5 ; books: 500 * 0 = 0 ; other: 500 * 20% = 100 → 127.5 → 128
    expect(cart.taxCents()).toBe(128);
  });

  test("total = subtotal - discount + tax", () => {
    const cart = new Cart();
    cart.add({ sku: "o", unitPriceCents: 2000, quantity: 2, category: "other" });
    cart.applyDiscount({ kind: "fixed", value: 400 });
    expect(cart.totalCents()).toBe(cart.subtotalCents() - 400 + cart.taxCents());
  });

  test("empty cart totals zero", () => {
    const cart = new Cart();
    expect(cart.subtotalCents()).toBe(0);
    expect(cart.discountCents()).toBe(0);
    expect(cart.taxCents()).toBe(0);
    expect(cart.totalCents()).toBe(0);
  });
});
