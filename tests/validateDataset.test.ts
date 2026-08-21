import { describe, expect, it } from "vitest";

import { validateDataset } from "../src/core/validateDataset";
import type { ColumnDefinition, DatasetRow } from "../src/core/types";

describe("validateDataset", () => {
  const columns: ColumnDefinition[] = [
    { name: "Employee ID", blankPolicy: "required" },
    { name: "Legacy Code", blankPolicy: "mustBeBlank" },
    {
      name: "Some Code",
      blankPolicy: "allowed",
      textCase: "uppercase",
    },
  ];

  it("returns a frontend- and API-ready summary, issues, and fix audit", () => {
    const rows: DatasetRow[] = [
      {
        rowNumber: 2,
        values: {
          "Employee ID": "123",
          "Legacy Code": "",
          "Some Code": "ABC",
        },
      },
      {
        rowNumber: 3,
        values: {
          "Employee ID": " ",
          "Legacy Code": "legacy",
          "Some Code": "abc",
        },
      },
      {
        rowNumber: 4,
        values: {
          "Employee ID": 0,
          "Legacy Code": null,
          "Some Code": false,
        },
      },
    ];

    expect(validateDataset(rows, columns)).toEqual({
      summary: {
        totalRows: 3,
        validRows: 2,
        errorCount: 1,
        warningCount: 0,
        fixCount: 2,
      },
      issues: [
        {
          row: 3,
          column: "Employee ID",
          severity: "error",
          code: "MISSING_REQUIRED_VALUE",
          message: "Employee ID cannot be blank",
        },
      ],
      fixes: [
        {
          row: 3,
          column: "Legacy Code",
          code: "CLEARED_FORBIDDEN_VALUE",
          before: "legacy",
          after: "",
          message: "Legacy Code must be blank; the value was removed.",
        },
        {
          row: 3,
          column: "Some Code",
          code: "NORMALIZED_CASE",
          before: "abc",
          after: "ABC",
          message: "Some Code was converted to uppercase.",
        },
      ],
    });
  });

  it("handles an empty dataset", () => {
    expect(validateDataset([], columns)).toEqual({
      summary: {
        totalRows: 0,
        validRows: 0,
        errorCount: 0,
        warningCount: 0,
        fixCount: 0,
      },
      issues: [],
      fixes: [],
    });
  });
});
