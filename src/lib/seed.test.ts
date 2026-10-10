import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { defaultCategories } from "./defaults";
import { toISODate } from "./dates";
import { buildSeed } from "./seed";

describe("datos de ejemplo", () => {
  it("no crea movimientos futuros y usa categorías conocidas", () => {
    const now = new Date(2026, 9, 10);
    const today = toISODate(now);
    const seed = buildSeed(now);
    const ids = new Set(defaultCategories.map((category) => category.id));
    assert.ok(seed.length > 10);
    for (const transaction of seed) {
      assert.ok(transaction.date <= today);
      assert.ok(ids.has(transaction.categoryId));
      assert.ok(transaction.amount > 0);
    }
    assert.ok(seed.some((transaction) => transaction.date.startsWith("2026-10")));
    assert.ok(seed.some((transaction) => transaction.date.startsWith("2026-09")));
  });
});
