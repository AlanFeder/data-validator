import { describe, expect, it } from "vitest";

import { validateBlankPolicy } from "../src/core/rules/validateBlankPolicy";
import type { ColumnDefinition } from "../src/core/types";

describe("validateBlankPolicy", () => {
  it("allows a blank value when blank values are allowed", () => {
    const column: ColumnDefinition = {
      name: "Middle Name",
      blankPolicy: "allowed",
    };

    expect(validateBlankPolicy(column, "  ")).toEqual({
      status: "valid",
      message: "",
    });
  });

  it("reports a required blank as a hard error", () => {
    const column: ColumnDefinition = {
      name: "Employee ID",
      blankPolicy: "required",
    };

    expect(validateBlankPolicy(column, null)).toEqual({
      status: "error",
      code: "MISSING_REQUIRED_VALUE",
      message: "Employee ID cannot be blank",
    });
  });

  it("never treats zero or false as a missing required value", () => {
    const column: ColumnDefinition = {
      name: "Value",
      blankPolicy: "required",
    };

    expect(validateBlankPolicy(column, 0).status).toBe("valid");
    expect(validateBlankPolicy(column, false).status).toBe("valid");
  });

  it("allows an already blank must-be-blank value", () => {
    const column: ColumnDefinition = {
      name: "Legacy Code",
      blankPolicy: "mustBeBlank",
    };

    expect(validateBlankPolicy(column, undefined)).toEqual({
      status: "valid",
      message: "",
    });
  });

  it("returns an audited fix for a populated must-be-blank value", () => {
    const column: ColumnDefinition = {
      name: "Legacy Code",
      blankPolicy: "mustBeBlank",
    };

    expect(validateBlankPolicy(column, "ABC")).toEqual({
      status: "fix",
      code: "CLEARED_FORBIDDEN_VALUE",
      message: "Legacy Code must be blank; the value was removed.",
      fixedValue: "",
    });
  });
});
