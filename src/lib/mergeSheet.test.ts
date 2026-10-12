import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { emptyData } from "./defaults";
import { mergeSheet } from "./mergeSheet";
import type { SheetPayload } from "./sheets";

const payload: SheetPayload = {
  fetchedAt: "2026-10-12T12:00:00.000Z",
  config: {
    expenseCategories: [
      { name: "Supermercado", monthlyBudget: 180000 },
      { name: "Mascotas", monthlyBudget: 20000 },
    ],
    incomeCategories: ["Sueldo"],
    accounts: [
      { name: "Banco", openingBalance: 250000 },
      { name: "Caja chica", openingBalance: 5000 },
    ],
  },
  movimientos: [
    {
      id: "M-0001",
      date: "2026-10-01",
      type: "Ingreso",
      category: "Sueldo",
      description: "Sueldo octubre",
      amount: 1500000,
      account: "Banco",
      notes: "",
    },
    {
      id: "M-0002",
      date: "2026-10-03",
      type: "Gasto",
      category: "supermercado",
      description: "Día",
      amount: 22000,
      account: "Mercado Pago",
      notes: "oferta",
    },
  ],
};

describe("importar hoja", () => {
  it("actualiza presupuestos y saldos, y no duplica al traer de nuevo", () => {
    const once = mergeSheet(emptyData(), payload, new Date("2026-10-12T12:00:00.000Z"));
    const twice = mergeSheet(once, payload, new Date("2026-10-13T12:00:00.000Z"));

    const superCategory = twice.categories.find((category) => category.id === "cat-super");
    assert.equal(superCategory?.monthlyBudget, 180000);
    assert.ok(twice.categories.some((category) => category.name === "Mascotas"));
    assert.equal(twice.accounts.find((account) => account.id === "acc-banco")?.openingBalance, 250000);
    assert.ok(twice.accounts.some((account) => account.name === "Caja chica"));
    assert.equal(twice.transactions.length, 2);
    assert.equal(twice.transactions.find((item) => item.id === "M-0001")?.accountId, "acc-banco");
    assert.equal(twice.transactions.find((item) => item.id === "M-0002")?.categoryId, "cat-super");
    assert.equal(twice.transactions.find((item) => item.id === "M-0002")?.note, "Día — oferta");
    assert.equal(
      twice.transactions.find((item) => item.id === "M-0001")?.createdAt,
      "2026-10-12T12:00:00.000Z",
    );
  });
});
