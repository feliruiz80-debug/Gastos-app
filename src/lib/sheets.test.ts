import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { parseConfig, parseGvizDate, parseMovimientos, type GvizTable } from "./sheets";

describe("hoja", () => {
  it("lee la fecha de Google con mes base cero", () => {
    assert.equal(parseGvizDate("Date(2026,9,1)"), "2026-10-01");
    assert.equal(parseGvizDate("Date(2026,0,15)"), "2026-01-15");
    assert.equal(parseGvizDate("01/10/2026"), null);
  });

  it("conserva el monto en positivo y saltea filas vacías", () => {
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
    assert.equal(rows[0]?.account, "Banco");
    assert.equal(rows[1]?.amount, 2500);
    assert.equal(rows[1]?.account, "");
  });

  it("lee presupuestos y saldos iniciales", () => {
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
});
