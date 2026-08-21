import ExcelJS from "exceljs";

import { toArrayBuffer } from "./binary";

export async function createMockWorkbook(): Promise<ArrayBuffer> {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Mock Data", {
    views: [{ state: "frozen", ySplit: 1 }],
  });

  // Deliberately wrong order so the mock exercises the audited header fix.
  worksheet.addRow(["Email", "Name", "Some Code", "Legacy Code"]);
  worksheet.addRow(["alice@example.test", "Alice", "abc123", ""]);
  worksheet.addRow(["", "Bob", "XYZ", "retired"]);
  worksheet.addRow(["charlie@example.test", "Charlie", "", ""]);

  worksheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
  worksheet.getRow(1).fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF17324D" },
  };
  worksheet.columns.forEach((column) => {
    column.width = 24;
  });

  const output = await workbook.xlsx.writeBuffer();
  return toArrayBuffer(new Uint8Array(output));
}
