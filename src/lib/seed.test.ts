import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { defaultAccounts, defaultCategories } from "./defaults";
import { toISODate } from "./dates";
import { buildSeed } from "./seed";

describe("datos de ejemplo", () => {
  it("no crea movimientos futuros y usa categorías y cuentas conocidas", () => {
    const now = new Date(2026, 9, 10);
    const today = toISODate(now);
    const seed = buildSeed(now);
    const categoryIds = new Set(defaultCategories.map((category) => category.id));
    const accountIds = new Set(defaultAccounts.map((account) => account.id));
    assert.ok(seed.length > 10);
    for (const transaction of seed) {
      assert.ok(transaction.date <= today);
      assert.ok(accountIds.has(transaction.accountId));
      assert.ok(transaction.amount > 0);
      if (transaction.type === "transfer") {
        assert.equal(transaction.categoryId, "");
        assert.ok(transaction.toAccountId && accountIds.has(transaction.toAccountId));
      } else {
        assert.ok(categoryIds.has(transaction.categoryId));
      }
    }
    assert.ok(seed.some((transaction) => transaction.date.startsWith("2026-10") && transaction.type === "income"));
    assert.ok(seed.some((transaction) => transaction.type === "transfer"));
    assert.ok(seed.some((transaction) => transaction.date.startsWith("2026-09")));
  });
});
