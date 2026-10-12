import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { cryptoIdFor, normalizeSymbol, positionValue, priceInArs } from "./market";

describe("precios de mercado", () => {
  it("pasa dólares a pesos con el MEP y deja los pesos como están", () => {
    assert.equal(priceInArs(10, "USD", 1500), 15000);
    assert.equal(priceInArs(1800, "ARS", 1500), 1800);
    assert.equal(priceInArs(10, "USD", null), null);
    assert.equal(priceInArs(10, "EUR", 1500), null);
  });

  it("calcula el valor de la tenencia", () => {
    assert.equal(positionValue(2, 1500.126), 3000.25);
    assert.equal(positionValue(0, 10), 0);
  });

  it("reconoce símbolos y cripto", () => {
    assert.equal(normalizeSymbol(" ggal.ba "), "GGAL.BA");
    assert.equal(normalizeSymbol("con espacios"), null);
    assert.equal(cryptoIdFor("BTC"), "bitcoin");
    assert.equal(cryptoIdFor("ETH-USD"), "ethereum");
    assert.equal(cryptoIdFor("GGAL.BA"), null);
  });
});
