import Ajv, { JSONSchemaType, ValidateFunction } from "ajv";
import addFormats from "ajv-formats";
import { Range, positionSchema, rangeSchema } from "../../shared/messages/position"

export interface TemporalNode {
  id: string;
  label: string;
  range: Range;
}

export type NodeData = Pick<TemporalNode, "label" | "range">


export function getValidator(): ValidateFunction<TemporalNode> {
  const ajv = new Ajv();
  // addFormats(ajv);
  return ajv.compile(temporalNodeSchema);
}

const temporalNodeSchema: JSONSchemaType<TemporalNode> = {
  type: "object",
  properties: {
    id: { type: "string" },
    label: { type: "string" },
    range: rangeSchema,
  },
  required: ["id", "label", "range"],
  additionalProperties: false,
};
