import type { AppliedFix, ValidationIssue } from "../core/types";
import type { WorkbookValidationOutput } from "../excel/validateWorkbook";
import type {
  ValidationWorkerRequest,
  ValidationWorkerResponse,
} from "../worker/messages";
import "./styles.css";

function getElement<T extends HTMLElement>(id: string): T {
  const element = document.getElementById(id);

  if (!element) {
    throw new Error(`Required UI element #${id} was not found`);
  }

  return element as T;
}

const workbookInput = getElement<HTMLInputElement>("workbook-input");
const fileName = getElement<HTMLSpanElement>("file-name");
const validateButton = getElement<HTMLButtonElement>("validate-button");
const sampleButton = getElement<HTMLButtonElement>("sample-button");
const downloadButton = getElement<HTMLButtonElement>("download-button");
const statusText = getElement<HTMLParagraphElement>("status-text");
const resultsPanel = getElement<HTMLElement>("results");
const resultBanner = getElement<HTMLDivElement>("result-banner");
const issuesBody = getElement<HTMLTableSectionElement>("issues-body");
const fixesBody = getElement<HTMLTableSectionElement>("fixes-body");

let selectedFile: File | undefined;
let correctedWorkbook: ArrayBuffer | undefined;
let correctedFileName = "corrected-workbook.xlsx";

function downloadBytes(bytes: ArrayBuffer, name: string): void {
  const blob = new Blob([bytes], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatValue(value: unknown): string {
  if (value === "") {
    return "(blank)";
  }

  if (value === null) {
    return "null";
  }

  if (value === undefined) {
    return "—";
  }

  if (typeof value === "string") {
    return value;
  }

  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

function appendCell(row: HTMLTableRowElement, value: string): void {
  const cell = document.createElement("td");
  cell.textContent = value;
  row.append(cell);
}

function appendEmptyRow(
  body: HTMLTableSectionElement,
  columns: number,
  message: string,
): void {
  const row = document.createElement("tr");
  const cell = document.createElement("td");
  cell.colSpan = columns;
  cell.className = "empty-table";
  cell.textContent = message;
  row.append(cell);
  body.append(row);
}

function renderIssues(issues: readonly ValidationIssue[]): void {
  issuesBody.replaceChildren();

  if (issues.length === 0) {
    appendEmptyRow(issuesBody, 5, "No errors or warnings were found.");
    return;
  }

  for (const issue of issues) {
    const row = document.createElement("tr");
    const severityCell = document.createElement("td");
    const badge = document.createElement("span");
    badge.className = `severity severity-${issue.severity}`;
    badge.textContent = issue.severity;
    severityCell.append(badge);
    row.append(severityCell);
    appendCell(row, String(issue.row));
    appendCell(row, issue.column ?? "—");
    appendCell(row, issue.code);
    appendCell(row, issue.message);
    issuesBody.append(row);
  }
}

function renderFixes(fixes: readonly AppliedFix[]): void {
  fixesBody.replaceChildren();

  if (fixes.length === 0) {
    appendEmptyRow(fixesBody, 6, "No automatic changes were needed.");
    return;
  }

  for (const fix of fixes) {
    const row = document.createElement("tr");
    appendCell(row, String(fix.row));
    appendCell(row, fix.column ?? "Header row");
    appendCell(row, fix.code);
    appendCell(row, formatValue(fix.before));
    appendCell(row, formatValue(fix.after));
    appendCell(row, fix.message);
    fixesBody.append(row);
  }
}

function setSummaryValue(id: string, value: number): void {
  getElement<HTMLElement>(id).textContent = String(value);
}

function renderResult(output: WorkbookValidationOutput): void {
  const { summary } = output.result;
  getElement<HTMLElement>("sheet-name").textContent =
    `Validated first worksheet: ${output.sheetName}`;
  setSummaryValue("total-rows", summary.totalRows);
  setSummaryValue("valid-rows", summary.validRows);
  setSummaryValue("error-count", summary.errorCount);
  setSummaryValue("warning-count", summary.warningCount);
  setSummaryValue("fix-count", summary.fixCount);
  renderIssues(output.result.issues);
  renderFixes(output.result.fixes);

  resultBanner.className = "result-banner";

  if (summary.errorCount > 0) {
    resultBanner.classList.add("result-error");
    resultBanner.textContent =
      summary.fixCount > 0
        ? "Hard errors still need attention. Safe automatic fixes are available in the corrected copy."
        : "Hard errors were found. The workbook was not changed.";
  } else if (summary.warningCount > 0) {
    resultBanner.classList.add("result-warning");
    resultBanner.textContent = "Validation completed with warnings.";
  } else if (summary.fixCount > 0) {
    resultBanner.classList.add("result-fix");
    resultBanner.textContent =
      "Validation passed after safe automatic fixes. Every change is listed below.";
  } else {
    resultBanner.classList.add("result-success");
    resultBanner.textContent = "Validation passed. No changes were needed.";
  }

  correctedWorkbook = output.correctedWorkbook;
  downloadButton.hidden = correctedWorkbook === undefined;
  resultsPanel.hidden = false;
  resultsPanel.scrollIntoView({ behavior: "smooth", block: "start" });
}

async function runWorker(file: File): Promise<WorkbookValidationOutput> {
  const worker = new Worker(
    new URL("../worker/validator.worker.ts", import.meta.url),
    { type: "module" },
  );
  const workbook = await file.arrayBuffer();

  return new Promise((resolve, reject) => {
    worker.addEventListener(
      "message",
      (event: MessageEvent<ValidationWorkerResponse>) => {
        worker.terminate();

        if (event.data.type === "success") {
          resolve(event.data.output);
        } else if (event.data.type === "error") {
          reject(new Error(event.data.message));
        } else {
          reject(new Error("The validation worker returned an unexpected response"));
        }
      },
      { once: true },
    );
    worker.addEventListener(
      "error",
      (event) => {
        worker.terminate();
        reject(new Error(event.message || "The validation worker failed"));
      },
      { once: true },
    );

    const request: ValidationWorkerRequest = {
      type: "validate",
      workbook,
    };
    worker.postMessage(request, [workbook]);
  });
}

async function createMockInWorker(): Promise<ArrayBuffer> {
  const worker = new Worker(
    new URL("../worker/validator.worker.ts", import.meta.url),
    { type: "module" },
  );

  return new Promise((resolve, reject) => {
    worker.addEventListener(
      "message",
      (event: MessageEvent<ValidationWorkerResponse>) => {
        worker.terminate();

        if (event.data.type === "mockCreated") {
          resolve(event.data.workbook);
        } else if (event.data.type === "error") {
          reject(new Error(event.data.message));
        } else {
          reject(new Error("The validation worker returned an unexpected response"));
        }
      },
      { once: true },
    );
    worker.addEventListener(
      "error",
      (event) => {
        worker.terminate();
        reject(new Error(event.message || "The validation worker failed"));
      },
      { once: true },
    );

    const request: ValidationWorkerRequest = { type: "createMock" };
    worker.postMessage(request);
  });
}

workbookInput.addEventListener("change", () => {
  const file = workbookInput.files?.[0];
  selectedFile = file;
  correctedWorkbook = undefined;
  downloadButton.hidden = true;
  resultsPanel.hidden = true;

  if (!file) {
    fileName.textContent = "No file selected";
    validateButton.disabled = true;
    return;
  }

  fileName.textContent = `${file.name} · ${formatBytes(file.size)}`;
  validateButton.disabled = false;
  statusText.textContent = "Ready to validate.";
});

validateButton.addEventListener("click", async () => {
  if (!selectedFile) {
    return;
  }

  if (!selectedFile.name.toLowerCase().endsWith(".xlsx")) {
    statusText.textContent = "Please select an .xlsx workbook.";
    return;
  }

  validateButton.disabled = true;
  validateButton.textContent = "Validating…";
  statusText.textContent = "Reading and checking the workbook locally…";
  resultsPanel.hidden = true;

  try {
    const output = await runWorker(selectedFile);
    correctedFileName = selectedFile.name.replace(/\.xlsx$/i, ".corrected.xlsx");
    renderResult(output);
    statusText.textContent = "Validation complete.";
  } catch (error: unknown) {
    statusText.textContent =
      error instanceof Error
        ? `Validation failed: ${error.message}`
        : "Validation failed.";
  } finally {
    validateButton.disabled = false;
    validateButton.textContent = "Validate workbook";
  }
});

sampleButton.addEventListener("click", async () => {
  sampleButton.disabled = true;
  sampleButton.textContent = "Creating workbook…";

  try {
    const workbook = await createMockInWorker();
    downloadBytes(workbook, "validation-mock.xlsx");
  } catch (error: unknown) {
    statusText.textContent =
      error instanceof Error
        ? `Mock creation failed: ${error.message}`
        : "Mock creation failed.";
  } finally {
    sampleButton.disabled = false;
    sampleButton.textContent = "Download mock workbook";
  }
});

downloadButton.addEventListener("click", () => {
  if (correctedWorkbook) {
    downloadBytes(correctedWorkbook, correctedFileName);
  }
});
