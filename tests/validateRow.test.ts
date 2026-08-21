import { describe, expect, it } from "vitest";

import { validateRow } from "../src/core/validateRow";
import type { ColumnDefinition, RawRow } from "../src/core/types";

describe("validateRow", () => {
  const columns: ColumnDefinition[] = [
    { name: "Employee ID", blankPolicy: "required" },
    { name: "Legacy Code", blankPolicy: "mustBeBlank" },
    {
      name: "Some Code",
      blankPolicy: "allowed",
      textCase: "uppercase",
    },
  ];

  it("keeps errors separate from fixes and retains workbook coordinates", () => {
    const values: RawRow = {
      "Employee ID": "",
      "Legacy Code": "ABC",
      "Some Code": "abc123",
    };

    const result = validateRow({ rowNumber: 27, values }, columns);

    expect(result).toEqual({
      rowNumber: 27,
      valid: false,
      issues: [
        {
          row: 27,
          column: "Employee ID",
          severity: "error",
          code: "MISSING_REQUIRED_VALUE",
          message: "Employee ID cannot be blank",
        },
      ],
      fixes: [
        {
          row: 27,
          column: "Legacy Code",
          code: "CLEARED_FORBIDDEN_VALUE",
          before: "ABC",
          after: "",
          message: "Legacy Code must be blank; the value was removed.",
        },
        {
          row: 27,
          column: "Some Code",
          code: "NORMALIZED_CASE",
          before: "abc123",
          after: "ABC123",
          message: "Some Code was converted to uppercase.",
        },
      ],
      correctedRow: {
        "Employee ID": "",
        "Legacy Code": "",
        "Some Code": "ABC123",
      },
    });

    expect(values).toEqual({
      "Employee ID": "",
      "Legacy Code": "ABC",
      "Some Code": "abc123",
    });
  });

  it("does not copy a row when no fix is needed", () => {
    const values: RawRow = {
      "Employee ID": 0,
      "Legacy Code": null,
      "Some Code": "ABC123",
    };

    const result = validateRow({ rowNumber: 2, values }, columns);

    expect(result.valid).toBe(true);
    expect(result.issues).toEqual([]);
    expect(result.fixes).toEqual([]);
    expect(result.correctedRow).toBe(values);
  });
});
