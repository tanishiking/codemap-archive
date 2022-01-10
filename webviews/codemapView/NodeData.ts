import { Range } from "../../shared/messages/position";

export interface NodeData {
  label: string;
  range: Range;
  size: { // remember the size information in NodeData, in order to calculate the resized size of node
    width: number
    height: number
  };
  resizeNode: (id: string, size: { width: number; height: number }) => void;
}

// export interface UpdatableNodeData extends NodeData {
//   updateNode: (id: string, data: NodeData) => void
// }
