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
      categoryId: "cat-comida",
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
  });

  it("rechaza archivos que no son un respaldo", () => {
    assert.equal(sanitizeData(null), null);
    assert.equal(sanitizeData({ categories: "no" }), null);
    assert.equal(sanitizeData({ categories: [{ id: 1 }], transactions: [] }), null);
  });
});
