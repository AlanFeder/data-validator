export type BlankPolicy = "allowed" | "required" | "mustBeBlank";

export type TextCasePolicy = "uppercase";

export type ColumnDefinition = {
  name: string;
  blankPolicy: BlankPolicy;
  /** Optional deterministic normalization. No current business column uses it yet. */
  textCase?: TextCasePolicy;
};

export type RawRow = Record<string, unknown>;

export type DatasetRow = {
  /** Source row number, retained so adapters can map results back to the workbook. */
  rowNumber: number;
  values: RawRow;
};

export const VALIDATION_CODES = {
  missingHeader: "MISSING_HEADER",
  unexpectedHeader: "UNEXPECTED_HEADER",
  duplicateHeader: "DUPLICATE_HEADER",
  reorderedHeaders: "REORDERED_HEADERS",
  missingRequiredValue: "MISSING_REQUIRED_VALUE",
  clearedForbiddenValue: "CLEARED_FORBIDDEN_VALUE",
  normalizedCase: "NORMALIZED_CASE",
} as const;

export type ValidationCode =
  (typeof VALIDATION_CODES)[keyof typeof VALIDATION_CODES];

export type CellValidationResult =
  | {
      status: "valid";
      message: "";
    }
  | {
      status: "error";
      code: ValidationCode;
      message: string;
    }
  | {
      status: "fix";
      code: ValidationCode;
      message: string;
      fixedValue: unknown;
    };

export type ValidationIssue = {
  row: number;
  column?: string;
  severity: "error" | "warning";
  code: string;
  message: string;
};

export type AppliedFix = {
  row: number;
  /** Omitted for workbook-wide changes such as reordering the header row. */
  column?: string;
  code: string;
  before: unknown;
  after: unknown;
  message: string;
};

export type ValidationSummary = {
  totalRows: number;
  validRows: number;
  errorCount: number;
  warningCount: number;
  fixCount: number;
};

export type ValidationResult = {
  summary: ValidationSummary;
  issues: ValidationIssue[];
  fixes: AppliedFix[];
};

export type RowValidationResult = {
  rowNumber: number;
  valid: boolean;
  issues: ValidationIssue[];
  fixes: AppliedFix[];
  /** A new object only when at least one deterministic fix was applied. */
  correctedRow: RawRow;
};
