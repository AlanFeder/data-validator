import { describe, expect, it } from "vitest";

import {
  makeHeaderResult,
  validateHeaders,
} from "../src/core/index";

describe("validateHeaders", () => {
  const expectedHeaders = ["Name", "Email"];

  it("accepts an exact header match", () => {
    expect(validateHeaders(["Name", "Email"], expectedHeaders)).toEqual({
      valid: true,
      fixable: false,
      message: "Headers are correct",
      missingHeaders: [],
      extraHeaders: [],
      duplicateHeaders: [],
    });
  });

  it("marks the correct unique headers in the wrong order as fixable", () => {
    expect(validateHeaders(["Email", "Name"], expectedHeaders)).toEqual({
      valid: false,
      fixable: true,
      message: "Headers can be reordered to match the expected order",
      missingHeaders: [],
      extraHeaders: [],
      duplicateHeaders: [],
    });
  });

  it("reports a missing header", () => {
    expect(validateHeaders(["Name"], expectedHeaders)).toEqual({
      valid: false,
      fixable: false,
      message: "Headers do not match the expected schema",
      missingHeaders: ["Email"],
      extraHeaders: [],
      duplicateHeaders: [],
    });
  });

  it("reports an extra header when the column count differs", () => {
    expect(
      validateHeaders(["Name", "Email", "Phone"], expectedHeaders),
    ).toEqual({
      valid: false,
      fixable: false,
      message: "Headers do not match the expected schema",
      missingHeaders: [],
      extraHeaders: ["Phone"],
      duplicateHeaders: [],
    });
  });

  it("reports missing and extra headers together", () => {
    expect(validateHeaders(["Name", "Phone"], expectedHeaders)).toEqual({
      valid: false,
      fixable: false,
      message: "Headers do not match the expected schema",
      missingHeaders: ["Email"],
      extraHeaders: ["Phone"],
      duplicateHeaders: [],
    });
  });

  it("compares exact names rather than substrings", () => {
    expect(validateHeaders(["FirstName", "Email"], expectedHeaders)).toEqual({
      valid: false,
      fixable: false,
      message: "Headers do not match the expected schema",
      missingHeaders: ["Name"],
      extraHeaders: ["FirstName"],
      duplicateHeaders: [],
    });
  });

  it("reports duplicate headers before treating the count as the main error", () => {
    expect(
      validateHeaders(["Name", "Email", "Email"], expectedHeaders),
    ).toEqual({
      valid: false,
      fixable: false,
      message: "Duplicate headers are not allowed",
      missingHeaders: [],
      extraHeaders: [],
      duplicateHeaders: ["Email"],
    });
  });

  it("returns each duplicate name only once", () => {
    expect(
      validateHeaders(
        ["Name", "Email", "Email", "Name", "Email"],
        expectedHeaders,
      ).duplicateHeaders,
    ).toEqual(["Email", "Name"]);
  });
});

describe("makeHeaderResult", () => {
  it("provides a complete stable default result", () => {
    expect(makeHeaderResult()).toEqual({
      valid: false,
      fixable: false,
      message: "",
      missingHeaders: [],
      extraHeaders: [],
      duplicateHeaders: [],
    });
  });

  it("rejects contradictory valid and fixable state", () => {
    expect(() => makeHeaderResult({ valid: true, fixable: true })).toThrow(
      "A valid header result cannot also require a fix or contain errors",
    );
  });
});
