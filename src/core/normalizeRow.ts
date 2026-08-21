import type { RawRow } from "./types";

export function normalizeRow(
  row: RawRow,
  correctedValues: ReadonlyMap<string, unknown>,
): RawRow {
  if (correctedValues.size === 0) {
    return row;
  }

  const correctedRow: RawRow = { ...row };

  for (const [column, value] of correctedValues) {
    correctedRow[column] = value;
  }

  return correctedRow;
}
