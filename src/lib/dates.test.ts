import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  currentMonth,
  dateInMonth,
  formatGroupDate,
  formatMonth,
  isValidISODate,
  lastMonths,
  shiftMonth,
  toISODate,
} from "./dates";

describe("fechas", () => {
  it("arma el mes y lo desplaza", () => {
    const now = new Date(2026, 9, 10);
    assert.equal(toISODate(now), "2026-10-10");
    assert.equal(currentMonth(now), "2026-10");
    assert.equal(shiftMonth("2026-10", -1), "2026-09");
    assert.equal(shiftMonth("2026-01", -1), "2025-12");
    assert.equal(shiftMonth("2026-12", 1), "2027-01");
  });

  it("valida días reales", () => {
    assert.equal(isValidISODate("2026-10-10"), true);
    assert.equal(isValidISODate("2026-02-31"), false);
    assert.equal(isValidISODate("10/10/2026"), false);
  });

  it("lista los últimos meses y nombra hoy y ayer", () => {
    assert.deepEqual(lastMonths("2026-10", 3), ["2026-08", "2026-09", "2026-10"]);
    assert.equal(formatGroupDate("2026-10-10", "2026-10-10"), "Hoy");
    assert.equal(formatGroupDate("2026-10-09", "2026-10-10"), "Ayer");
    assert.match(formatMonth("2026-10").toLowerCase(), /oct/);
    assert.match(formatMonth("2026-10"), /2026/);
  });

  it("arma la fecha de un gasto fijo dentro del mes", () => {
    assert.equal(dateInMonth("2026-10", 5), "2026-10-05");
    assert.equal(dateInMonth("2026-02", 28), "2026-02-28");
    assert.equal(dateInMonth("2026-02", 31), "2026-02-28");
  });
});
