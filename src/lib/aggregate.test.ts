import assert from "node:assert/strict";
import test from "node:test";
import type { Movement } from "../types";
import { accountBalances, categoryTotals, filterPeriod, monthlySeries, totals } from "./aggregate";

const movements: Movement[] = [
  {
    id: "1",
    date: "2026-10-01",
    type: "Ingreso",
    category: "Sueldo",
    description: "Sueldo",
    amount: 1500000,
    account: "Banco",
    notes: "",
  },
  {
    id: "2",
    date: "2026-10-03",
    type: "Gasto",
    category: "Supermercado",
    description: "Compra",
    amount: 80000,
    account: "Mercado Pago",
    notes: "",
  },
  {
    id: "3",
    date: "2026-09-15",
    type: "Gasto",
    category: "Transporte / Nafta",
    description: "Nafta",
    amount: 40000,
    account: "Efectivo",
    notes: "",
  },
  {
    id: "4",
    date: "2025-12-01",
    type: "Ingreso",
    category: "Ventas",
    description: "Venta",
    amount: 200000,
    account: "Banco",
    notes: "",
  },
];

test("totals subtract expenses from income", () => {
  assert.deepEqual(totals(movements), {
    income: 1700000,
    expense: 120000,
    result: 1580000,
  });
});

test("filterPeriod respects year and month", () => {
  const october = filterPeriod(movements, { year: 2026, month: 10 });
  assert.deepEqual(october.map((row) => row.id), ["1", "2"]);
  const year = filterPeriod(movements, { year: 2026, month: "all" });
  assert.equal(year.length, 3);
});

test("monthlySeries buckets a single year", () => {
  const series = monthlySeries(movements, 2026);
  assert.equal(series[8]?.expense, 40000);
  assert.equal(series[9]?.income, 1500000);
  assert.equal(series[9]?.expense, 80000);
  assert.equal(series[0]?.income, 0);
});

test("categoryTotals keeps catalog rows and extra categories", () => {
  const rows = categoryTotals(
    filterPeriod(movements, { year: 2026, month: 10 }),
    "expense",
    [
      { name: "Supermercado", monthlyBudget: 100000 },
      { name: "Salud", monthlyBudget: 0 },
    ],
  );
  assert.equal(rows[0]?.name, "Supermercado");
  assert.equal(rows[0]?.amount, 80000);
  assert.equal(rows[0]?.budget, 100000);
  assert.equal(rows.find((row) => row.name === "Salud")?.amount, 0);
  assert.equal(rows.find((row) => row.name === "Salud")?.budget, null);
});

test("accountBalances apply the opening balance from Config", () => {
  const balances = accountBalances(movements, [
    { name: "Efectivo", openingBalance: 5000 },
    { name: "Banco", openingBalance: 0 },
  ]);
  const banco = balances.find((row) => row.name === "Banco");
  const efectivo = balances.find((row) => row.name === "Efectivo");
  const mercado = balances.find((row) => row.name === "Mercado Pago");
  assert.equal(banco?.balance, 1700000);
  assert.equal(efectivo?.balance, -35000);
  assert.equal(mercado?.expense, 80000);
  assert.equal(mercado?.balance, -80000);
});
