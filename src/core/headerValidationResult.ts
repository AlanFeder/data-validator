export type HeaderValidationResult = {
  valid: boolean;
  fixable: boolean;
  message: string;
  missingHeaders: string[];
  extraHeaders: string[];
  duplicateHeaders: string[];
};

const DEFAULT_HEADER_RESULT: HeaderValidationResult = {
  valid: false,
  fixable: false,
  message: "",
  missingHeaders: [],
  extraHeaders: [],
  duplicateHeaders: [],
};

export function makeHeaderResult(
  overrides: Partial<HeaderValidationResult> = {},
): HeaderValidationResult {
  const result: HeaderValidationResult = {
    ...DEFAULT_HEADER_RESULT,
    ...overrides,
    missingHeaders: [...(overrides.missingHeaders ?? [])],
    extraHeaders: [...(overrides.extraHeaders ?? [])],
    duplicateHeaders: [...(overrides.duplicateHeaders ?? [])],
  };

  const hasStructuralErrors =
    result.missingHeaders.length > 0 ||
    result.extraHeaders.length > 0 ||
    result.duplicateHeaders.length > 0;

  if (result.valid && (result.fixable || hasStructuralErrors)) {
    throw new Error("A valid header result cannot also require a fix or contain errors");
  }

  if (result.fixable && hasStructuralErrors) {
    throw new Error("A fixable header result cannot contain structural errors");
  }

  return result;
}
