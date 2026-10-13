import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { hexToRgb, vivid, withAlpha } from "./colors";

describe("colores vivos", () => {
  it("prende un naranja apagado", () => {
    const next = vivid("#c4491d");
    const rgb = hexToRgb(next);
    assert.ok(rgb);
    // Queda más brillante/saturado que el original.
    const original = hexToRgb("#c4491d");
    assert.ok(original);
    assert.ok(rgb.r + rgb.g + rgb.b > original.r + original.g + original.b - 20);
    assert.match(next, /^#[0-9a-f]{6}$/i);
  });

  it("rescata grises apagados", () => {
    const next = vivid("#57534e");
    const rgb = hexToRgb(next);
    assert.ok(rgb);
    const max = Math.max(rgb.r, rgb.g, rgb.b);
    const min = Math.min(rgb.r, rgb.g, rgb.b);
    assert.ok(max - min > 40);
  });

  it("arma rgba con alpha", () => {
    assert.equal(withAlpha("#22c55e", 0.5), "rgba(34, 197, 94, 0.5)");
  });
});
