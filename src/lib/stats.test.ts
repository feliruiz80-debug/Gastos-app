import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { balanceOf, inMonth, sumAmount, totalsByCategory } from "./stats";
import type { Category, Transaction } from "./types";

const categories: Category[] = [
  { id: "comida", name: "Comida", type: "expense", color: "#c4491d" },
  { id: "sueldo", name: "Salario", type: "income", color: "#1b7f4e" },
];

function tx(partial: Partial<Transaction> & Pick<Transaction, "type" | "amount" | "categoryId" | "date">): Transaction {
  return {
    id: partial.id ?? `${partial.date}-${partial.categoryId}`,
    note: partial.note ?? "",
    createdAt: partial.createdAt ?? "2026-10-01T12:00:00.000Z",
    ...partial,
  };
}

describe("estadísticas", () => {
  const transactions = [
    tx({ type: "income", amount: 1000, categoryId: "sueldo", date: "2026-10-01" }),
    tx({ type: "expense", amount: 200, categoryId: "comida", date: "2026-10-06" }),
    tx({ type: "expense", amount: 50, categoryId: "comida", date: "2026-09-06" }),
  ];

  it("calcula saldo e ingresos del mes", () => {
    assert.equal(balanceOf(transactions), 750);
    assert.equal(sumAmount(inMonth(transactions, "2026-10"), "expense"), 200);
    assert.equal(sumAmount(inMonth(transactions, "2026-10"), "income"), 1000);
  });

  it("agrupa gastos por categoría", () => {
    const totals = totalsByCategory(transactions, categories, "expense");
    assert.equal(totals.length, 1);
    assert.equal(totals[0]?.category.name, "Comida");
    assert.equal(totals[0]?.amount, 250);
  });
});
