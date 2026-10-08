import assert from "node:assert/strict";
import test from "node:test";
import { parseConfig, parseGvizDate, parseMovimientos, type GvizTable } from "./parseSheet";

test("parseGvizDate uses the zero-based month from Google", () => {
  assert.equal(parseGvizDate("Date(2026,9,1)"), "2026-10-01");
  assert.equal(parseGvizDate("Date(2026,0,15)"), "2026-01-15");
  assert.equal(parseGvizDate("01/10/2026"), null);
});

test("parseMovimientos keeps positive amounts and skips blank rows", () => {
  const table: GvizTable = {
    rows: [
      {
        c: [
          { v: "M-0001" },
          { v: "Date(2026,9,1)", f: "01/10/2026" },
          { v: "Ingreso" },
          { v: "Sueldo" },
          { v: "Sueldo octubre" },
          { v: 1500000, f: "$1,500,000.00" },
          { v: "Banco" },
          { v: "nota" },
        ],
      },
      { c: [null, null, null, null, null, null, null, null] },
      {
        c: [
          { v: "M-0002" },
          { v: "Date(2026,9,2)" },
          { v: "Gasto" },
          { v: "Supermercado" },
          { v: "Compra" },
          { v: -2500 },
          null,
          null,
        ],
      },
    ],
  };

  const rows = parseMovimientos(table);
  assert.equal(rows.length, 2);
  assert.equal(rows[0]?.amount, 1500000);
  assert.equal(rows[0]?.date, "2026-10-01");
  assert.equal(rows[1]?.amount, 2500);
  assert.equal(rows[1]?.account, "Sin cuenta");
});

test("parseConfig reads lists, budgets and opening balances", () => {
  const table: GvizTable = {
    rows: [
      {
        c: [
          { v: "Ingreso" },
          null,
          { v: "Supermercado" },
          { v: 0, f: "-" },
          null,
          { v: "Sueldo" },
          null,
          { v: "Efectivo" },
          { v: 10000 },
        ],
      },
      {
        c: [
          { v: "Gasto" },
          null,
          { v: "Vivienda / Alquiler" },
          { v: 400000 },
          null,
          { v: "Ventas" },
          null,
          { v: "Banco" },
          { v: 0, f: "-" },
        ],
      },
      {
        c: [
          { v: "Celdas amarillas: completalas con tus números." },
          null,
          null,
          null,
          null,
          null,
          null,
          null,
          null,
        ],
      },
    ],
  };

  const config = parseConfig(table);
  assert.deepEqual(config.types, ["Ingreso", "Gasto"]);
  assert.deepEqual(config.expenseCategories, [
    { name: "Supermercado", monthlyBudget: 0 },
    { name: "Vivienda / Alquiler", monthlyBudget: 400000 },
  ]);
  assert.deepEqual(config.incomeCategories, ["Sueldo", "Ventas"]);
  assert.deepEqual(config.accounts, [
    { name: "Efectivo", openingBalance: 10000 },
    { name: "Banco", openingBalance: 0 },
  ]);
});
