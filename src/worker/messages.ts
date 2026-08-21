import type { WorkbookValidationOutput } from "../excel/validateWorkbook";

export type ValidationWorkerRequest =
  | {
      type: "validate";
      workbook: ArrayBuffer;
    }
  | {
      type: "createMock";
    };

export type ValidationWorkerResponse =
  | {
      type: "success";
      output: WorkbookValidationOutput;
    }
  | {
      type: "error";
      message: string;
    }
  | {
      type: "mockCreated";
      workbook: ArrayBuffer;
    };
