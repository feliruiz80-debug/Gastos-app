import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { hexToRgb, withAlpha } from "./colors";
import { upgradeDefaultColors } from "./defaults";

describe("colores", () => {
  it("arma rgba con alpha", () => {
    assert.equal(withAlpha("#5aad78", 0.5), "rgba(90, 173, 120, 0.5)");
    assert.ok(hexToRgb("#e07a4f"));
  });

  it("pasa colores viejos a la paleta brillante", () => {
    const upgraded = upgradeDefaultColors(
      [
        { id: "cat-super", color: "#e07a4f" },
        { id: "cat-transporte", color: "#f0e08a" },
        { id: "cat-custom", color: "#abcdef" },
      ],
      "category",
    );
    assert.equal(upgraded[0]?.color, "#ff5c39");
    assert.equal(upgraded[1]?.color, "#ffe566");
    assert.equal(upgraded[2]?.color, "#abcdef");
  });
});
