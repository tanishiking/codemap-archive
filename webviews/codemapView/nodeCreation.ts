import { Node, XYPosition } from "react-flow-renderer";
import { v4 as uuidv4 } from "uuid";
import { NodeData } from "./NodeData";
import { defaultSize as defaultScopeNodeSize } from "./nodes/ScopeNode";
import { defaultSize as defaultRefNodeSize } from "./nodes/RefNode";

type WithoutSize = Omit<NodeData, "size">;

export function createScopeNode(
  position: XYPosition,
  data: WithoutSize,
  id?: string,
): Node<NodeData> {
  const size = defaultScopeNodeSize
  return {
    id: id || uuidv4(),
    position,
    data: { ...data, size },
    type: "scope",
    ...size,
  };
}

export function createRefNode(
  parent: Node<NodeData>,
  data: WithoutSize,
  id?: string,
): Node<NodeData> {
  const size = defaultRefNodeSize
  return {
    id: id || uuidv4(),
    position: { x: 0, y: 0 },
    data: { ...data, size },
    type: "ref",
    parentNode: parent.id,
    extent: "parent",
    ...size,
  };
}
