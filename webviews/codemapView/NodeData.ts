import * as React from "react";
import { IRange } from "../../shared/messages/position";

export interface NodeData {
  label: string;
  range: IRange;
  size: { // remember the size information in NodeData, in order to calculate the resized size of node
    width: number
    height: number
  };
  innerRef: React.RefObject<HTMLElement>;
  resizeNode: (id: string, size: { width: number; height: number }) => void;
  updateContent: (id: string, newContent: string) => void
}

// export interface UpdatableNodeData extends NodeData {
//   updateNode: (id: string, data: NodeData) => void
// }
