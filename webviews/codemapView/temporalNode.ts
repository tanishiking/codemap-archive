import Ajv, { JSONSchemaType, ValidateFunction } from "ajv";

export interface TemporalNode {
  id: string;
  label: string;
  pos: {
    line: number;
    character: number;
  };
}
export function getValidator(): ValidateFunction<TemporalNode> {
  const ajv = new Ajv();
  return ajv.compile(temporalNodeSchema);
}

const temporalNodeSchema: JSONSchemaType<TemporalNode> = {
  type: "object",
  properties: {
    id: { type: "string" },
    label: { type: "string" },
    pos: {
      type: "object",
      properties: {
        line: { type: "number" },
        character: { type: "number" },
      },
      required: ["line", "character"],
    },
  },
  required: ["id", "label", "pos"],
  additionalProperties: false,
};
