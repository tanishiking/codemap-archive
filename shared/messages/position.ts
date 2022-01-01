import * as vscode from "vscode";
import { JSONSchemaType } from "ajv";

export type Position = {
  readonly line: number;
  readonly character: number;
};
export type Range = {
  readonly uri: string;
  readonly start: Position;
  readonly end: Position;
};

function isAfterOrEq(before: Position, after: Position): boolean {
  return (
    before.line < after.line ||
    (before.line === after.line && before.character <= after.character)
  );
}

export function contains(outer: Range, inner: Range): boolean {
  return (
    outer.uri === inner.uri &&
    isAfterOrEq(outer.start, inner.start) &&
    isAfterOrEq(inner.end, outer.end)
  )
}

export function fromVSCodeRange(range: vscode.Range, uri: vscode.Uri): Range {
  return {
    uri: uri.toString(),
    start: {
      line: range.start.line,
      character: range.start.character,
    },
    end: {
      line: range.end.line,
      character: range.end.character,
    },
  };
}

export const positionSchema: JSONSchemaType<Position> = {
  type: "object",
  properties: {
    line: { type: "number" },
    character: { type: "number" },
  },
  required: ["line", "character"],
  additionalProperties: false,
};

export const rangeSchema: JSONSchemaType<Range> = {
  type: "object",
  properties: {
    uri: { type: "string" }, // validate by format
    start: positionSchema,
    end: positionSchema,
  },
  required: ["uri", "start", "end"],
  additionalProperties: false,
};
