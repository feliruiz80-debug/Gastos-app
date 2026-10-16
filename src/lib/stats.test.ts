import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  accountBalances,
  accountFlow,
  activeFixedTotal,
  availableBalance,
  balanceOf,
  categoryBreakdown,
  fixedPaidIds,
  fixedPendingTotal,
  inMonth,
  sumAmount,
} from "./stats";
import type { Account, Category, FixedExpense, Transaction } from "./types";

const categories: Category[] = [
  { id: "comida", name: "Supermercado", type: "expense", color: "#c4491d", monthlyBudget: 200 },
  { id: "sueldo", name: "Sueldo", type: "income", color: "#1b7f4e", monthlyBudget: 0 },
  { id: "ocio", name: "Salidas y ocio", type: "expense", color: "#a16207", monthlyBudget: 100 },
];

const accounts: Account[] = [
  { id: "banco", name: "Banco", color: "#0369a1", openingBalance: 500 },
  { id: "mp", name: "Mercado Pago", color: "#0284c7", openingBalance: 0 },
  { id: "tarjeta", name: "Tarjeta de crédito", color: "#9a3412", openingBalance: 0 },
];

function tx(
  partial: Partial<Transaction> & Pick<Transaction, "type" | "amount" | "date">,
): Transaction {
  return {
    id: partial.id ?? `${partial.date}-${partial.type}-${partial.amount}`,
    categoryId: partial.categoryId ?? "",
    accountId: partial.accountId ?? "banco",
    note: partial.note ?? "",
    createdAt: partial.createdAt ?? "2026-10-01T12:00:00.000Z",
    ...partial,
  };
}

describe("estadísticas", () => {
  const transactions = [
    tx({ type: "income", amount: 1000, categoryId: "sueldo", accountId: "banco", date: "2026-10-01" }),
    tx({ type: "expense", amount: 200, categoryId: "comida", accountId: "mp", date: "2026-10-06" }),
    tx({ type: "expense", amount: 50, categoryId: "comida", accountId: "banco", date: "2026-09-06" }),
    tx({
      type: "transfer",
      amount: 300,
      accountId: "banco",
      toAccountId: "mp",
      date: "2026-10-02",
      note: "Paso a MP",
    }),
    tx({ type: "expense", amount: 80, categoryId: "comida", accountId: "tarjeta", date: "2026-10-08" }),
  ];

  it("calcula saldo e ingresos del mes sin contar transferencias", () => {
    assert.equal(balanceOf(transactions), 670);
    assert.equal(sumAmount(inMonth(transactions, "2026-10"), "expense"), 280);
    assert.equal(sumAmount(inMonth(transactions, "2026-10"), "income"), 1000);
  });

  it("agrupa gastos y muestra el presupuesto del mes", () => {
    const totals = categoryBreakdown(inMonth(transactions, "2026-10"), categories, "expense", "2026-10");
    assert.equal(totals[0]?.category.name, "Supermercado");
    assert.equal(totals[0]?.amount, 280);
    assert.equal(totals[0]?.budget, 200);
    assert.equal(totals.find((item) => item.category.id === "ocio")?.amount, 0);
    assert.equal(totals.find((item) => item.category.id === "ocio")?.budget, 100);
  });

  it("arma el saldo de cada cuenta con saldo inicial y transferencias", () => {
    const balances = accountBalances(accounts, transactions);
    const byName = Object.fromEntries(balances.map((item) => [item.account.name, item.balance]));
    assert.equal(byName.Banco, 500 + 1000 - 50 - 300);
    assert.equal(byName["Mercado Pago"], 0 - 200 + 300);
    assert.equal(byName["Tarjeta de crédito"], -80);
    assert.equal(availableBalance(accounts, transactions), 500 + 670);
  });

  it("suma lo que entró y salió de una cuenta incluyendo pases", () => {
    const october = inMonth(transactions, "2026-10");
    const banco = accountFlow(october, "banco");
    assert.equal(banco.inflow, 1000);
    assert.equal(banco.outflow, 300);
    assert.equal(banco.transactions.length, 2);

    const mp = accountFlow(october, "mp");
    assert.equal(mp.inflow, 300);
    assert.equal(mp.outflow, 200);
    assert.equal(mp.transactions.length, 2);
  });

  it("suma gastos fijos y detecta los ya registrados en el mes", () => {
    const fixed: FixedExpense[] = [
      {
        id: "fix-1",
        name: "Alquiler",
        amount: 200,
        categoryId: "comida",
        accountId: "banco",
        dayOfMonth: 5,
        note: "",
        active: true,
      },
      {
        id: "fix-2",
        name: "Netflix",
        amount: 10,
        categoryId: "ocio",
        accountId: "mp",
        dayOfMonth: 12,
        note: "",
        active: true,
      },
      {
        id: "fix-3",
        name: "Pausado",
        amount: 50,
        categoryId: "ocio",
        accountId: "mp",
        dayOfMonth: 1,
        note: "",
        active: false,
      },
    ];
    const paidTx = [
      tx({
        type: "expense",
        amount: 200,
        categoryId: "comida",
        accountId: "banco",
        date: "2026-10-05",
        fixedExpenseId: "fix-1",
      }),
    ];
    assert.equal(activeFixedTotal(fixed), 210);
    const paid = fixedPaidIds(paidTx, "2026-10");
    assert.equal(paid.has("fix-1"), true);
    assert.equal(fixedPendingTotal(fixed, paid), 10);
  });
});
