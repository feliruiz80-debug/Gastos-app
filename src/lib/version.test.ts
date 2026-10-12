import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { hasNewVersion } from "./version";

describe("versión", () => {
  it("avisa solo cuando el código publicado es otro", () => {
    assert.equal(hasNewVersion("abc", "def"), true);
    assert.equal(hasNewVersion("abc", "abc"), false);
    assert.equal(hasNewVersion("local", "abc"), false);
    assert.equal(hasNewVersion("abc", "local"), false);
    assert.equal(hasNewVersion("abc", null), false);
  });
});
