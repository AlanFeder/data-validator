import { describe, expect, it } from "vitest";

import { isBlank } from "../src/core/isBlank";

describe("isBlank", () => {
  it.each([
    ["null", null],
    ["undefined", undefined],
    ["an empty string", ""],
    ["spaces only", "   "],
    ["tabs and newlines only", "\t\n  \r"],
  ])("treats %s as blank", (_description, value) => {
    expect(isBlank(value)).toBe(true);
  });

  it.each([
    ["zero", 0],
    ["false", false],
    ["the string zero", "0"],
    ["a populated string", "value"],
  ])("does not treat %s as blank", (_description, value) => {
    expect(isBlank(value)).toBe(false);
  });
});
