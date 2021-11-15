import Ajv, { JSONSchemaType, ValidateFunction } from "ajv";

export type Command = "open_in_editor";
export type Message = {
  command: Command;
  data: object;
};

const schema: JSONSchemaType<Message> = {
  type: "object",
  properties: {
    command: { type: "string", enum: ["open_in_editor"] },
    data: { type: "object" },
  },
  required: ["command", "data"],
  additionalProperties: false,
};

export function getMessageValidator(): ValidateFunction<Message> {
  const ajv = new Ajv();
  return ajv.compile(schema);
}
