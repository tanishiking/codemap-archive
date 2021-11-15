import Ajv, { JSONSchemaType, ValidateFunction } from "ajv";
import addFormats from "ajv-formats";
import { Position, positionSchema } from "../../shared/messages/position"

export interface TemporalNode {
  id: string;
  label: string;
  pos: Position;
}

export type NodeData = Pick<TemporalNode, "label" | "pos">


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
    pos: positionSchema,
  },
  required: ["id", "label", "pos"],
  additionalProperties: false,
};
