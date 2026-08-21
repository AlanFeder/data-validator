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

export function validateBlankPolicy(
  column: ColumnDefinition,
  value: unknown,
): CellValidationResult {
  const blank = isBlank(value);

  if (column.blankPolicy === "required" && blank) {
    return {
      status: "error",
      code: VALIDATION_CODES.missingRequiredValue,
      message: `${column.name} cannot be blank`,
    };
  }

  if (column.blankPolicy === "mustBeBlank" && !blank) {
    return {
      status: "fix",
      code: VALIDATION_CODES.clearedForbiddenValue,
      message: `${column.name} must be blank; the value was removed.`,
      fixedValue: "",
    };
  }

  return VALID_RESULT;
}
