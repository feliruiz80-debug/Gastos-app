import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { hexToRgb, withAlpha } from "./colors";
import { upgradeDefaultColors } from "./defaults";

describe("colores", () => {
  it("arma rgba con alpha", () => {
    assert.equal(withAlpha("#5aad78", 0.5), "rgba(90, 173, 120, 0.5)");
    assert.ok(hexToRgb("#e07a4f"));
  });

  it("pasa colores oscuros o flúor a la paleta clara", () => {
    const upgraded = upgradeDefaultColors(
      [
        { id: "cat-super", color: "#c4491d" },
        { id: "cat-sueldo", color: "#22c55e" },
        { id: "cat-custom", color: "#abcdef" },
      ],
      "category",
    );
    assert.equal(upgraded[0]?.color, "#e07a4f");
    assert.equal(upgraded[1]?.color, "#5aad78");
    assert.equal(upgraded[2]?.color, "#abcdef");
  });
});
