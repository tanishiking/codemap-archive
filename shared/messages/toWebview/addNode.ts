import Ajv, { JSONSchemaType, ValidateFunction } from "ajv";
import addFormats from "ajv-formats";
import { Position, positionSchema } from "../position";

export type AddNode = {
  label: string;
  pos: Position;
};

const schema: JSONSchemaType<AddNode> = {
  type: "object",
  properties: {
    label: { type: "string" },
    pos: positionSchema,
  },
  required: ["label", "pos"],
  additionalProperties: false,
};

export function getAddNodeValidator(): ValidateFunction<AddNode> {
  const ajv = new Ajv();
  return ajv.compile(schema);
}
