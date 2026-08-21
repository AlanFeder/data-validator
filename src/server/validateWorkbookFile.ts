import { readFile, writeFile } from "node:fs/promises";
import { basename, dirname, extname, join, resolve } from "node:path";

import { validateWorkbook } from "../excel/validateWorkbook";

function correctedPath(inputPath: string): string {
  const extension = extname(inputPath);
  const base = basename(inputPath, extension);
  return join(dirname(inputPath), `${base}.corrected.xlsx`);
}

const inputArgument = process.argv[2];

if (!inputArgument) {
  console.error(
    "Usage: npm run validate:workbook -- <input.xlsx> [corrected-output.xlsx]",
  );
  process.exitCode = 1;
} else {
  try {
    const inputPath = resolve(inputArgument);
    const output = await validateWorkbook(await readFile(inputPath));
    const { correctedWorkbook, ...report } = output;

    console.log(JSON.stringify(report, null, 2));

    if (correctedWorkbook) {
      const outputPath = resolve(
        process.argv[3] ?? correctedPath(inputPath),
      );
      await writeFile(outputPath, new Uint8Array(correctedWorkbook));
      console.error(`Corrected workbook written to ${outputPath}`);
    }

    if (output.result.summary.errorCount > 0) {
      process.exitCode = 2;
    }
  } catch (error: unknown) {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  }
}
