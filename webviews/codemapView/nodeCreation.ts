import { Node, Position, XYPosition } from "react-flow-renderer";
import { v4 as uuidv4 } from "uuid";
import { NodeData } from "./NodeData";

type WithoutSize = Omit<NodeData, "size">;

export const defaultScopeNodeSize = {
  width: 344,
  height: 72,
};
export function createScopeNode(
  position: XYPosition,
  data: WithoutSize,
  id?: string,
  size?: { height: number; width: number }
): Node<NodeData> {
  const sizeData = size || defaultScopeNodeSize;
  return {
    id: id || uuidv4(),
    position,
    data: { ...data, size: sizeData },
    type: "scope",
    ...sizeData,
  };
}

export const defaultRefNodeSize = {
  width: 132,
  height: 36,
};
export function createRefNode(
  parent: Node<NodeData>,
  position: XYPosition,
  data: WithoutSize,
  id?: string,
  size?: { height: number; width: number }
): Node<NodeData> {
  const sizeData = size || defaultRefNodeSize;
  return {
    id: id || uuidv4(),
    position: {
       x: position.x + 1,
       y: position.y + 1,
    },
    data: { ...data, size: sizeData },
    type: "ref",
    parentNode: parent.id,
    extent: "parent",
    ...sizeData,
  };
}
