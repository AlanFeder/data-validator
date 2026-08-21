import ExcelJS from "exceljs";
import { describe, expect, it } from "vitest";

import { EXPECTED_HEADERS } from "../src/core/columns";
import { createMockWorkbook } from "../src/excel/createMockWorkbook";
import { readWorkbook } from "../src/excel/readWorkbook";
import { validateWorkbook } from "../src/excel/validateWorkbook";

async function workbookBytes(rows: unknown[][]): Promise<ArrayBuffer> {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Data");

  rows.forEach((row) => worksheet.addRow(row));

  const output = await workbook.xlsx.writeBuffer();
  const bytes = new Uint8Array(output);
  const copy = new Uint8Array(bytes.byteLength);
  copy.set(bytes);
  return copy.buffer;
}

describe("validateWorkbook", () => {
  it("validates a compliant workbook without generating a copy", async () => {
    const input = await workbookBytes([
      EXPECTED_HEADERS,
      ["Alice", "alice@example.test", "", "ABC123"],
    ]);

    const output = await validateWorkbook(input);

    expect(output.headerValidation).toEqual({
      valid: true,
      fixable: false,
      message: "Headers are correct",
      missingHeaders: [],
      extraHeaders: [],
      duplicateHeaders: [],
    });
    expect(output.result).toEqual({
      summary: {
        totalRows: 1,
        validRows: 1,
        errorCount: 0,
        warningCount: 0,
        fixCount: 0,
      },
      issues: [],
      fixes: [],
    });
    expect(output.correctedWorkbook).toBeUndefined();
  });

  it("audits and writes every safe correction in the mock workbook", async () => {
    const output = await validateWorkbook(await createMockWorkbook());

    expect(output.headerValidation.fixable).toBe(true);
    expect(output.result.summary).toEqual({
      totalRows: 3,
      validRows: 2,
      errorCount: 1,
      warningCount: 0,
      fixCount: 3,
    });
    expect(output.result.issues).toEqual([
      {
        row: 3,
        column: "Email",
        severity: "error",
        code: "MISSING_REQUIRED_VALUE",
        message: "Email cannot be blank",
      },
    ]);
    expect(output.result.fixes.map((fix) => fix.code)).toEqual([
      "REORDERED_HEADERS",
      "NORMALIZED_CASE",
      "CLEARED_FORBIDDEN_VALUE",
    ]);
    expect(output.correctedWorkbook).toBeInstanceOf(ArrayBuffer);

    const corrected = await readWorkbook(output.correctedWorkbook!);
    expect(corrected.headers).toEqual(EXPECTED_HEADERS);
    expect(corrected.rows[0]?.values).toEqual({
      Name: "Alice",
      Email: "alice@example.test",
      "Legacy Code": "",
      "Some Code": "ABC123",
    });
    expect(corrected.rows[1]?.values).toEqual({
      Name: "Bob",
      Email: "",
      "Legacy Code": "",
      "Some Code": "XYZ",
    });
  });

  it("reports missing and unexpected headers without guessing a row mapping", async () => {
    const input = await workbookBytes([
      ["Name", "Phone", "Legacy Code", "Some Code"],
      ["Alice", "555-0100", "remove", "abc"],
    ]);

    const output = await validateWorkbook(input);

    expect(output.result.summary).toEqual({
      totalRows: 1,
      validRows: 0,
      errorCount: 2,
      warningCount: 0,
      fixCount: 0,
    });
    expect(output.result.issues.map((issue) => issue.code)).toEqual([
      "MISSING_HEADER",
      "UNEXPECTED_HEADER",
    ]);
    expect(output.correctedWorkbook).toBeUndefined();
  });

  it("surfaces duplicate headers as a hard error", async () => {
    const input = await workbookBytes([
      ["Name", "Email", "Email", "Some Code"],
      ["Alice", "first@example.test", "second@example.test", "ABC"],
    ]);

    const output = await validateWorkbook(input);

    expect(output.headerValidation).toMatchObject({
      valid: false,
      fixable: false,
      missingHeaders: ["Legacy Code"],
      duplicateHeaders: ["Email"],
    });
    expect(output.result.issues.map((issue) => issue.code)).toEqual([
      "MISSING_HEADER",
      "DUPLICATE_HEADER",
    ]);
    expect(output.correctedWorkbook).toBeUndefined();
  });
});
