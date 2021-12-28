import Ajv, { JSONSchemaType, ValidateFunction } from "ajv";
import addFormats from "ajv-formats";
import { Range, rangeSchema } from "../position";

export type AddNode = {
  label: string;
  range: Range;
};

const schema: JSONSchemaType<AddNode> = {
  type: "object",
  properties: {
    label: { type: "string" },
    range: rangeSchema,
  },
  required: ["label", "range"],
  additionalProperties: false,
};

export function getAddNodeValidator(): ValidateFunction<AddNode> {
  const ajv = new Ajv();
  return ajv.compile(schema);
}
