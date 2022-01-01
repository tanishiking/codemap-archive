import Ajv, { JSONSchemaType, ValidateFunction } from "ajv";

export type Command = "add_node" | "navigate";
export type Message = {
  command: Command;
  data: object;
};

const schema: JSONSchemaType<Message> = {
  type: "object",
  properties: {
    command: { type: "string", enum: ["add_node", "navigate"] },
    data: { type: "object" },
  },
  required: ["command", "data"],
  additionalProperties: false,
};

export function getMessageValidator(): ValidateFunction<Message> {
  const ajv = new Ajv();
  return ajv.compile(schema);
}
