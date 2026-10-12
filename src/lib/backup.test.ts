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

  it("conserva símbolo y cantidad, y completa las inversiones viejas", () => {
    const sanitized = sanitizeData({
      categories: [{ id: "cat-super", name: "Supermercado", type: "expense", color: "#c4491d" }],
      transactions: [],
      investments: [
        { id: "inv-1", name: "Galicia", kind: "acciones", invested: 1000, currentValue: 1200, note: "", symbol: "ggal.ba", units: 10 },
        { id: "inv-2", name: "Plazo", kind: "plazo", invested: 5000, currentValue: 5200, note: "" },
        { id: "inv-3", name: "Apple", kind: "cedear", invested: 2000, currentValue: 2400, note: "", symbol: "aapl.ba", units: 5 },
      ],
    });
    assert.equal(sanitized?.investments[0]?.symbol, "GGAL.BA");
    assert.equal(sanitized?.investments[0]?.units, 10);
    assert.equal(sanitized?.investments[1]?.symbol, "");
    assert.equal(sanitized?.investments[1]?.units, 0);
    assert.equal(sanitized?.investments[2]?.kind, "cedear");
    assert.equal(sanitized?.investments[2]?.symbol, "AAPL.BA");
  });

  it("rechaza archivos que no son un respaldo", () => {
    assert.equal(sanitizeData(null), null);
    assert.equal(sanitizeData({ categories: "no" }), null);
    assert.equal(sanitizeData({ categories: [{ id: 1 }], transactions: [] }), null);
  });
});
