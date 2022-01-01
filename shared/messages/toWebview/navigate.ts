import Ajv, { JSONSchemaType, ValidateFunction } from "ajv";
import { AddNode, addNodeSchema } from "./addNode";

export type Navigate = {
  from: AddNode;
  to: AddNode;
};

const schema: JSONSchemaType<Navigate> = {
  type: "object",
  properties: {
    from: addNodeSchema,
    to: addNodeSchema,
  },
  required: ["from", "to"],
  additionalProperties: false,
};

export function getNavigateValidator(): ValidateFunction<Navigate> {
  const ajv = new Ajv();
  return ajv.compile(schema);
}
