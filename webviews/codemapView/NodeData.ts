import { Range } from "../../shared/messages/position";

export type NodeData = {
  label: string;
  range: Range;
  size: {
    width: number;
    height: number;
  };
};
