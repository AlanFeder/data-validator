import { isBlank } from "../isBlank";
import {
  VALIDATION_CODES,
  type CellValidationResult,
  type ColumnDefinition,
} from "../types";

const VALID_RESULT: CellValidationResult = {
  status: "valid",
  message: "",
};

export function validateTextCase(
  column: ColumnDefinition,
  value: unknown,
): CellValidationResult {
  if (
    column.textCase !== "uppercase" ||
    isBlank(value) ||
    typeof value !== "string"
  ) {
    return VALID_RESULT;
  }

  const uppercaseValue = value.toUpperCase();

  if (uppercaseValue === value) {
    return VALID_RESULT;
  }

  return {
    status: "fix",
    code: VALIDATION_CODES.normalizedCase,
    message: `${column.name} was converted to uppercase.`,
    fixedValue: uppercaseValue,
  };
}
