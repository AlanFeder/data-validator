import {
  makeHeaderResult,
  type HeaderValidationResult,
} from "./headerValidationResult";

function findDuplicates(headers: readonly string[]): string[] {
  const seenHeaders = new Set<string>();
  const duplicateHeaders = new Set<string>();

  for (const header of headers) {
    if (seenHeaders.has(header)) {
      duplicateHeaders.add(header);
    }

    seenHeaders.add(header);
  }

  return [...duplicateHeaders];
}

export function validateHeaders(
  actualHeaders: readonly string[],
  expectedHeaders: readonly string[],
): HeaderValidationResult {
  const actualHeaderSet = new Set(actualHeaders);
  const expectedHeaderSet = new Set(expectedHeaders);

  const missingHeaders = expectedHeaders.filter(
    (header) => !actualHeaderSet.has(header),
  );
  const extraHeaders = [
    ...new Set(
      actualHeaders.filter((header) => !expectedHeaderSet.has(header)),
    ),
  ];
  const duplicateHeaders = findDuplicates(actualHeaders);

  if (duplicateHeaders.length > 0) {
    return makeHeaderResult({
      message: "Duplicate headers are not allowed",
      missingHeaders,
      extraHeaders,
      duplicateHeaders,
    });
  }

  if (missingHeaders.length > 0 || extraHeaders.length > 0) {
    return makeHeaderResult({
      message: "Headers do not match the expected schema",
      missingHeaders,
      extraHeaders,
    });
  }

  const exactMatch =
    actualHeaders.length === expectedHeaders.length &&
    actualHeaders.every((header, index) => header === expectedHeaders[index]);

  if (exactMatch) {
    return makeHeaderResult({
      valid: true,
      message: "Headers are correct",
    });
  }

  return makeHeaderResult({
    fixable: true,
    message: "Headers can be reordered to match the expected order",
  });
}
