import { describe, expect, it } from "vitest";

import { validateTextCase } from "../src/core/rules/validateTextCase";
import type { ColumnDefinition } from "../src/core/types";

describe("validateTextCase", () => {
  const uppercaseColumn: ColumnDefinition = {
    name: "Some Code",
    blankPolicy: "allowed",
    textCase: "uppercase",
  };

  it("returns a deterministic uppercase fix when configured", () => {
    expect(validateTextCase(uppercaseColumn, "abc123")).toEqual({
      status: "fix",
      code: "NORMALIZED_CASE",
      message: "Some Code was converted to uppercase.",
      fixedValue: "ABC123",
    });
  });

  it("does nothing when the value is already uppercase", () => {
    expect(validateTextCase(uppercaseColumn, "ABC123")).toEqual({
      status: "valid",
      message: "",
    });
  });

  it("does not invent string conversion rules for non-string values", () => {
    expect(validateTextCase(uppercaseColumn, 123)).toEqual({
      status: "valid",
      message: "",
    });
  });

  it("does nothing when no case rule is configured", () => {
    expect(
      validateTextCase(
        { name: "Description", blankPolicy: "allowed" },
        "mixed Case",
      ),
    ).toEqual({
      status: "valid",
      message: "",
    });
  });
});
