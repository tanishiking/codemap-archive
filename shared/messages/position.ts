import { JSONSchemaType } from "ajv";

export type Position = {
  uri: string;
  line: number;
  character: number;
};

export const positionSchema: JSONSchemaType<Position> = {
  type: "object",
  properties: {
    uri: { type: "string" }, // validate by format
    line: { type: "number" },
    character: { type: "number" },
  },
  required: ["uri", "line", "character"],
};
