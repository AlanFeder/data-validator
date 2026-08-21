import { COLUMNS } from "./columns";
import type {
  ColumnDefinition,
  DatasetRow,
  ValidationIssue,
  ValidationResult,
} from "./types";
import { validateRow } from "./validateRow";

export function validateDataset(
  rows: readonly DatasetRow[],
  columns: readonly ColumnDefinition[] = COLUMNS,
): ValidationResult {
  const issues: ValidationIssue[] = [];
  const fixes: ValidationResult["fixes"] = [];
  let validRows = 0;

  for (const row of rows) {
    const result = validateRow(row, columns);

    if (result.valid) {
      validRows += 1;
    }

    issues.push(...result.issues);
    fixes.push(...result.fixes);
  }

  return {
    summary: {
      totalRows: rows.length,
      validRows,
      errorCount: issues.filter((issue) => issue.severity === "error").length,
      warningCount: issues.filter((issue) => issue.severity === "warning").length,
      fixCount: fixes.length,
    },
    issues,
    fixes,
  };
}
