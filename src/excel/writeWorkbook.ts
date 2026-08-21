import type {
  CellValue,
  Comment,
  DataValidation,
  Style,
  Workbook,
  Worksheet,
} from "exceljs";

import type { AppliedFix } from "../core/types";
import { toArrayBuffer } from "./binary";

type CellSnapshot = {
  value: CellValue;
  style: Partial<Style>;
  note: string | Comment;
  dataValidation: DataValidation;
};

type ColumnSnapshot = {
  width?: number;
  hidden: boolean;
  outlineLevel: number;
  style: Partial<Style>;
};

function applyCellFixes(
  worksheet: Worksheet,
  headers: readonly string[],
  fixes: readonly AppliedFix[],
): void {
  const columnIndexes = new Map(
    headers.map((header, index) => [header, index + 1]),
  );

  for (const fix of fixes) {
    if (fix.row === 1 || fix.column === undefined) {
      continue;
    }

    const columnIndex = columnIndexes.get(fix.column);

    if (columnIndex !== undefined) {
      worksheet.getCell(fix.row, columnIndex).value = fix.after as CellValue;
    }
  }
}

function reorderColumns(
  worksheet: Worksheet,
  actualHeaders: readonly string[],
  expectedHeaders: readonly string[],
): void {
  const rowCount = Math.max(worksheet.actualRowCount, 1);
  const cellSnapshots = expectedHeaders.map((header) => {
    const sourceColumn = actualHeaders.indexOf(header) + 1;

    return Array.from({ length: rowCount }, (_, rowIndex): CellSnapshot => {
      const cell = worksheet.getCell(rowIndex + 1, sourceColumn);

      return {
        value: cell.value,
        style: cell.style,
        note: cell.note,
        dataValidation: cell.dataValidation,
      };
    });
  });
  const columnSnapshots = expectedHeaders.map((header): ColumnSnapshot => {
    const sourceColumn = worksheet.getColumn(actualHeaders.indexOf(header) + 1);

    return {
      ...(sourceColumn.width === undefined ? {} : { width: sourceColumn.width }),
      hidden: sourceColumn.hidden,
      outlineLevel: sourceColumn.outlineLevel,
      style: sourceColumn.style,
    };
  });

  cellSnapshots.forEach((columnCells, targetColumnIndex) => {
    columnCells.forEach((snapshot, rowIndex) => {
      const targetCell = worksheet.getCell(rowIndex + 1, targetColumnIndex + 1);
      targetCell.value = snapshot.value;
      targetCell.style = snapshot.style;
      targetCell.note = snapshot.note;
      targetCell.dataValidation = snapshot.dataValidation;
    });

    const targetColumn = worksheet.getColumn(targetColumnIndex + 1);
    const columnSnapshot = columnSnapshots[targetColumnIndex];

    if (columnSnapshot) {
      if (columnSnapshot.width === undefined) {
        delete targetColumn.width;
      } else {
        targetColumn.width = columnSnapshot.width;
      }
      targetColumn.hidden = columnSnapshot.hidden;
      targetColumn.outlineLevel = columnSnapshot.outlineLevel;
      targetColumn.style = columnSnapshot.style;
    }
  });
}

export async function writeCorrectedWorkbook(
  workbook: Workbook,
  worksheet: Worksheet,
  actualHeaders: readonly string[],
  expectedHeaders: readonly string[],
  fixes: readonly AppliedFix[],
  shouldReorderHeaders: boolean,
): Promise<ArrayBuffer> {
  applyCellFixes(worksheet, actualHeaders, fixes);

  if (shouldReorderHeaders) {
    reorderColumns(worksheet, actualHeaders, expectedHeaders);
  }

  const output = await workbook.xlsx.writeBuffer();
  return toArrayBuffer(new Uint8Array(output));
}
