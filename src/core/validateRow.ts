import { COLUMNS } from "./columns";
import { normalizeRow } from "./normalizeRow";
import { validateBlankPolicy } from "./rules/validateBlankPolicy";
import { validateTextCase } from "./rules/validateTextCase";
import type {
  AppliedFix,
  CellValidationResult,
  ColumnDefinition,
  DatasetRow,
  RowValidationResult,
  ValidationIssue,
} from "./types";

function recordResult(
  result: CellValidationResult,
  row: DatasetRow,
  column: ColumnDefinition,
  before: unknown,
  issues: ValidationIssue[],
  fixes: AppliedFix[],
  correctedValues: Map<string, unknown>,
): "continue" | "stop" {
  if (result.status === "valid") {
    return "continue";
  }

  if (result.status === "error") {
    issues.push({
      row: row.rowNumber,
      column: column.name,
      severity: "error",
      code: result.code,
      message: result.message,
    });

    return "stop";
  }

  fixes.push({
    row: row.rowNumber,
    column: column.name,
    code: result.code,
    before,
    after: result.fixedValue,
    message: result.message,
  });
  correctedValues.set(column.name, result.fixedValue);

  return "stop";
}

export function validateRow(
  row: DatasetRow,
  columns: readonly ColumnDefinition[] = COLUMNS,
): RowValidationResult {
  const issues: ValidationIssue[] = [];
  const fixes: AppliedFix[] = [];
  const correctedValues = new Map<string, unknown>();

  for (const column of columns) {
    const value = row.values[column.name];
    const blankResult = validateBlankPolicy(column, value);

    if (
      recordResult(
        blankResult,
        row,
        column,
        value,
        issues,
        fixes,
        correctedValues,
      ) === "stop"
    ) {
      continue;
    }

    const textCaseResult = validateTextCase(column, value);
    recordResult(
      textCaseResult,
      row,
      column,
      value,
      issues,
      fixes,
      correctedValues,
    );
  }

  return {
    rowNumber: row.rowNumber,
    valid: !issues.some((issue) => issue.severity === "error"),
    issues,
    fixes,
    correctedRow: normalizeRow(row.values, correctedValues),
  };
}
