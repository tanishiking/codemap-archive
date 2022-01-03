import Ajv, { JSONSchemaType, ValidateFunction } from "ajv";
import addFormats from "ajv-formats";
import { IRange, rangeSchema } from "../position";

export type OpenInEditor = {
  label: string
  range: IRange
}

const schema: JSONSchemaType<OpenInEditor> = {
  type: "object",
  properties: {
    label: { type: "string" },
    range: rangeSchema,
  },
  required: ["label", "range"],
  additionalProperties: false,
};

export function getOpenInEditorValidator(): ValidateFunction<OpenInEditor> {
  const ajv = new Ajv();
  // addFormats(ajv);
  return ajv.compile(schema);
}
