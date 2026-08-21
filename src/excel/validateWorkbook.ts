import { COLUMNS, EXPECTED_HEADERS } from "../core/columns";
import type { HeaderValidationResult } from "../core/headerValidationResult";
import {
  VALIDATION_CODES,
  type AppliedFix,
  type ValidationIssue,
  type ValidationResult,
} from "../core/types";
import { validateDataset } from "../core/validateDataset";
import { validateHeaders } from "../core/validateHeaders";
import { readWorkbook } from "./readWorkbook";
import { writeCorrectedWorkbook } from "./writeWorkbook";

export type WorkbookValidationOutput = {
  sheetName: string;
  headerValidation: HeaderValidationResult;
  result: ValidationResult;
  correctedWorkbook?: ArrayBuffer;
};

function makeHeaderIssues(
  headerValidation: HeaderValidationResult,
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  for (const header of headerValidation.missingHeaders) {
    issues.push({
      row: 1,
      column: header,
      severity: "error",
      code: VALIDATION_CODES.missingHeader,
      message: `Required header ${header} is missing`,
    });
  }

  for (const header of headerValidation.extraHeaders) {
    issues.push({
      row: 1,
      column: header,
      severity: "error",
      code: VALIDATION_CODES.unexpectedHeader,
      message: `Header ${header || "(blank)"} is not expected`,
    });
  }

  for (const header of headerValidation.duplicateHeaders) {
    issues.push({
      row: 1,
      column: header,
      severity: "error",
      code: VALIDATION_CODES.duplicateHeader,
      message: `Header ${header || "(blank)"} appears more than once`,
    });
  }

  return issues;
}

function makeHeaderReorderFix(
  actualHeaders: readonly string[],
): AppliedFix {
  return {
    row: 1,
    code: VALIDATION_CODES.reorderedHeaders,
    before: [...actualHeaders],
    after: [...EXPECTED_HEADERS],
    message: "Columns were reordered to match the expected header order.",
  };
}

export async function validateWorkbook(
  input: ArrayBuffer | Uint8Array,
): Promise<WorkbookValidationOutput> {
  const parsed = await readWorkbook(input);
  const headerValidation = validateHeaders(parsed.headers, EXPECTED_HEADERS);

  if (!headerValidation.valid && !headerValidation.fixable) {
    const issues = makeHeaderIssues(headerValidation);

    return {
      sheetName: parsed.sheetName,
      headerValidation,
      result: {
        summary: {
          totalRows: parsed.rows.length,
          validRows: 0,
          errorCount: issues.length,
          warningCount: 0,
          fixCount: 0,
        },
        issues,
        fixes: [],
      },
    };
  }

  const datasetResult = validateDataset(parsed.rows, COLUMNS);
  const fixes = headerValidation.fixable
    ? [makeHeaderReorderFix(parsed.headers), ...datasetResult.fixes]
    : [...datasetResult.fixes];
  const result: ValidationResult = {
    summary: {
      ...datasetResult.summary,
      fixCount: fixes.length,
    },
    issues: datasetResult.issues,
    fixes,
  };

  if (fixes.length === 0) {
    return {
      sheetName: parsed.sheetName,
      headerValidation,
      result,
    };
  }

  const correctedWorkbook = await writeCorrectedWorkbook(
    parsed.workbook,
    parsed.worksheet,
    parsed.headers,
    EXPECTED_HEADERS,
    fixes,
    headerValidation.fixable,
  );

  return {
    sheetName: parsed.sheetName,
    headerValidation,
    result,
    correctedWorkbook,
  };
}
