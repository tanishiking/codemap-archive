import Ajv, { JSONSchemaType, ValidateFunction } from "ajv";

export type Command = "addNode" | "deleteNode";
export interface Message {
  command: Command;
  label: string;
  pos: {
    line: number;
    character: number;
  };
}

export const messageSchema: JSONSchemaType<Message> = {
  type: "object",
  properties: {
    label: { type: "string" },
    command: {
      type: "string",
      enum: ["addNode", "deleteNode"],
    },
    pos: {
      type: "object",
      properties: {
        line: { type: "number" },
        character: { type: "number" },
      },
      required: ["line", "character"],
    },
  },
  required: ["label"],
  additionalProperties: false,
};

export function getValidator(): ValidateFunction<Message> {
  const ajv = new Ajv();
  return ajv.compile(messageSchema);
}
