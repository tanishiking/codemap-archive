import { Range } from "../../shared/messages/position"

export interface TemporalNode {
  id: string;
  label: string;
  range: Range;
}

export type NodeData = Pick<TemporalNode, "label" | "range">

