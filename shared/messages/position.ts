import * as vscode from "vscode";
import { JSONSchemaType } from "ajv";

export interface IPosition {
  line: number;
  character: number;
}

export class Position implements IPosition {
  readonly line: number;
  readonly character: number;
  constructor(line: number, character: number) {
    this.line = line;
    this.character = character;
  }

  public static fromVSCode(pos: vscode.Position): Position {
    return new Position(pos.line, pos.character);
  }

  public static fromIPosition(pos: IPosition): Position {
    return new Position(pos.line, pos.character);
  }

  public isAfterOrEq(before: IPosition): boolean {
    return (
      before.line < this.line ||
      (before.line === this.line && before.character <= this.character)
    );
  }

  public isBeforeOrEq(after: IPosition): boolean {
    return (
      this.line < after.line ||
      (this.line === after.line && this.character <= after.character)
    );
  }
}

export interface IRange {
  uri: string;
  start: IPosition;
  end: IPosition;
}
export class Range implements IRange {
  readonly uri: string;
  readonly start: Position;
  readonly end: Position;
  constructor(uri: string, start: Position, end: Position) {
    this.uri = uri;
    this.start = start;
    this.end = end;
  }

  public static fromVSCode(range: vscode.Range, uri: vscode.Uri): Range {
    return new Range(
      uri.toString(),
      Position.fromVSCode(range.start),
      Position.fromVSCode(range.end)
    );
  }

  public static fromIRange(range: IRange): Range {
    return new Range(
      range.uri,
      Position.fromIPosition(range.start),
      Position.fromIPosition(range.end)
    );
  }

  public contains(inner: IRange): boolean {
    return (
      this.uri === inner.uri &&
      this.start.isBeforeOrEq(inner.start) &&
      this.start.isAfterOrEq(inner.end)
    );
  }
}

export const positionSchema: JSONSchemaType<IPosition> = {
  type: "object",
  properties: {
    line: { type: "number" },
    character: { type: "number" },
  },
  required: ["line", "character"],
  additionalProperties: false,
};

export const rangeSchema: JSONSchemaType<IRange> = {
  type: "object",
  properties: {
    uri: { type: "string" }, // validate by format
    start: positionSchema,
    end: positionSchema,
  },
  required: ["uri", "start", "end"],
  additionalProperties: false,
};
