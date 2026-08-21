import ExcelJS, {
  type Cell,
  type Workbook as ExcelWorkbook,
  type Worksheet,
} from "exceljs";

import type { DatasetRow, RawRow } from "../core/types";
import { toArrayBuffer } from "./binary";

export type ParsedWorkbook = {
  workbook: ExcelWorkbook;
  worksheet: Worksheet;
  sheetName: string;
  headers: string[];
  rows: DatasetRow[];
};

function readHeader(cell: Cell): string {
  if (typeof cell.value === "string") {
    return cell.value;
  }

  if (cell.value === null || cell.value === undefined) {
    return "";
  }

  return cell.text;
}

export async function readWorkbook(
  input: ArrayBuffer | Uint8Array,
): Promise<ParsedWorkbook> {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(toArrayBuffer(input));

  const worksheet = workbook.worksheets[0];

  if (!worksheet) {
    throw new Error("The workbook does not contain a worksheet");
  }

  const headerRow = worksheet.getRow(1);
  const columnCount = Math.max(
    headerRow.cellCount,
    worksheet.actualColumnCount,
  );
  const headers = Array.from({ length: columnCount }, (_, index) =>
    readHeader(headerRow.getCell(index + 1)),
  );
  const rows: DatasetRow[] = [];

  for (let rowNumber = 2; rowNumber <= worksheet.actualRowCount; rowNumber += 1) {
    const worksheetRow = worksheet.getRow(rowNumber);
    const values: RawRow = {};

    headers.forEach((header, index) => {
      values[header] = worksheetRow.getCell(index + 1).value;
    });

    rows.push({ rowNumber, values });
  }

  return {
    workbook,
    worksheet,
    sheetName: worksheet.name,
    headers,
    rows,
  };
}
