import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { formatMoney, parseAmount, parseBudget, parseSignedAmount } from "./money";

describe("parseAmount", () => {
  it("lee enteros y miles con punto", () => {
    assert.equal(parseAmount("12500"), 12500);
    assert.equal(parseAmount("12.500"), 12500);
    assert.equal(parseAmount("1.000.000"), 1_000_000);
    assert.equal(parseAmount("1,250"), 1250);
  });

  it("lee decimales con coma o punto", () => {
    assert.equal(parseAmount("12,50"), 12.5);
    assert.equal(parseAmount("12.5"), 12.5);
    assert.equal(parseAmount("12.500,50"), 12500.5);
    assert.equal(parseAmount("1,250.50"), 1250.5);
    assert.equal(parseAmount("12 500,50"), 12500.5);
  });

  it("rechaza vacíos, cero y texto", () => {
    assert.equal(parseAmount(""), null);
    assert.equal(parseAmount("0"), null);
    assert.equal(parseAmount("-5"), null);
    assert.equal(parseAmount("abc"), null);
    assert.equal(parseAmount("12.500,505"), null);
  });
});

describe("presupuestos y saldos", () => {
  it("acepta cero y negativos solo donde corresponde", () => {
    assert.equal(parseBudget(""), 0);
    assert.equal(parseBudget("0"), 0);
    assert.equal(parseBudget("180.000"), 180000);
    assert.equal(parseSignedAmount("-25.000"), -25000);
    assert.equal(parseSignedAmount("0"), 0);
    assert.equal(parseSignedAmount("abc"), null);
  });
});

describe("formatMoney", () => {
  it("usa el formato de pesos argentinos", () => {
    assert.match(formatMoney(12500.5), /12\.500,50/);
  });
});
