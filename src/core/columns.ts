import type { ColumnDefinition } from "./types";

// Temporary mock schema. Replace these placeholders only when the real
// business columns and their rules are supplied.
export const COLUMNS = [
  {
    name: "Name",
    blankPolicy: "required",
  },
  {
    name: "Email",
    blankPolicy: "required",
  },
  {
    name: "Legacy Code",
    blankPolicy: "mustBeBlank",
  },
  {
    name: "Some Code",
    blankPolicy: "allowed",
    textCase: "uppercase",
  },
] as const satisfies readonly ColumnDefinition[];

export const EXPECTED_HEADERS: string[] = COLUMNS.map(
  (column) => column.name,
);
