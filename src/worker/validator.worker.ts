/// <reference lib="webworker" />

import { validateWorkbook } from "../excel/validateWorkbook";
import { createMockWorkbook } from "../excel/createMockWorkbook";
import type {
  ValidationWorkerRequest,
  ValidationWorkerResponse,
} from "./messages";

const workerScope = self as DedicatedWorkerGlobalScope;

workerScope.addEventListener(
  "message",
  async (event: MessageEvent<ValidationWorkerRequest>) => {
    try {
      if (event.data.type === "createMock") {
        const workbook = await createMockWorkbook();
        const response: ValidationWorkerResponse = {
          type: "mockCreated",
          workbook,
        };
        workerScope.postMessage(response, [workbook]);
        return;
      }

      const output = await validateWorkbook(event.data.workbook);
      const response: ValidationWorkerResponse = {
        type: "success",
        output,
      };
      const transfer = output.correctedWorkbook
        ? [output.correctedWorkbook]
        : [];

      workerScope.postMessage(response, transfer);
    } catch (error: unknown) {
      const response: ValidationWorkerResponse = {
        type: "error",
        message:
          error instanceof Error
            ? error.message
            : "The workbook could not be validated",
      };
      workerScope.postMessage(response);
    }
  },
);
