import { FlowExportObject } from "react-flow-renderer";
import { NodeData } from "./NodeData";
// import { TemporalNode } from "./temporalNode";

export interface StateType {
  // omit resizeNode, since we can't restore a function
  // otherwise, we'll get resizeNode and updateContent is not a function error.
  flow: FlowExportObject<Omit<NodeData, 'resizeNode' | 'updateContent' | 'innerRef'>>;
}
