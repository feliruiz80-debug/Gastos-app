import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { sanitizeData, toBackup } from "./backup";
import { emptyData } from "./defaults";

describe("respaldo", () => {
  it("acepta un archivo válido y descarta basura", () => {
    const backup = toBackup(emptyData(), new Date("2026-10-10T12:00:00.000Z"));
    backup.transactions.push({
      id: "1",
      type: "expense",
      amount: 10,
      categoryId: "cat-super",
      accountId: "acc-efectivo",
      note: "Café",
      date: "2026-10-10",
      createdAt: "2026-10-10T12:00:00.000Z",
    });
    const sanitized = sanitizeData({
      ...backup,
      transactions: [...backup.transactions, { id: "mal" }, backup.transactions[0]],
    });
    assert.ok(sanitized);
    assert.equal(sanitized?.transactions.length, 1);
    assert.equal(sanitized?.transactions[0]?.note, "Café");
    assert.equal(sanitized?.accounts.length, backup.accounts.length);
  });

  it("completa cuentas cuando el respaldo anterior no las tenía", () => {
    const sanitized = sanitizeData({
      categories: [{ id: "cat-super", name: "Supermercado", type: "expense", color: "#c4491d" }],
      transactions: [
        {
          id: "1",
          type: "expense",
          amount: 10,
          categoryId: "cat-super",
          note: "Café",
          date: "2026-10-10",
          createdAt: "2026-10-10T12:00:00.000Z",
        },
      ],
    });
    assert.ok(sanitized);
    assert.equal(sanitized?.categories[0]?.monthlyBudget, 0);
    assert.ok((sanitized?.accounts.length ?? 0) > 0);
    assert.equal(sanitized?.transactions[0]?.accountId, sanitized?.accounts[0]?.id);
  });

  it("rechaza archivos que no son un respaldo", () => {
    assert.equal(sanitizeData(null), null);
    assert.equal(sanitizeData({ categories: "no" }), null);
    assert.equal(sanitizeData({ categories: [{ id: 1 }], transactions: [] }), null);
  });
});
