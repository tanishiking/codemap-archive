import Ajv, { JSONSchemaType, ValidateFunction } from "ajv";
import addFormats from "ajv-formats";
import { Position, positionSchema } from "../position";

export type OpenInEditor = {
  label: string
  pos: Position
}

const schema: JSONSchemaType<OpenInEditor> = {
  type: "object",
  properties: {
    label: { type: "string" },
    pos: positionSchema,
  },
  required: ["label", "pos"],
  additionalProperties: false,
};

export function getOpenInEditorValidator(): ValidateFunction<OpenInEditor> {
  const ajv = new Ajv();
  // addFormats(ajv);
  return ajv.compile(schema);
}
