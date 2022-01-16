import ELK, { ElkEdge, ElkNode } from "elkjs/lib/elk.bundled.js";
import { Edge, Node, XYPosition } from "react-flow-renderer";
import { NodeData } from "./NodeData";

export const getLayoutedPositions = async (
  newNodes: Node<NodeData>[],
  nodes: Node<NodeData>[],
  edges: Edge[]
): Promise<Map<string, XYPosition>> => {
  const elkNode = toElkNodes(nodes.concat(newNodes), edges);
  console.log(JSON.stringify(elkNode));
  const elk = new ELK();
  const formatted = await elk.layout(elkNode);

  const idToPos: Map<string, XYPosition> = new Map();

  function registerNodes(nodes: ElkNode[]): void {
    nodes.forEach((node) => {
      if (node.children && node.children.length > 0)
        registerNodes(node.children);
      idToPos.set(node.id, { x: node.x || 0, y: node.y || 0 });
    });
  }
  registerNodes(formatted.children || []);

  return idToPos;
};

function toElkNodes(nodes: Node<NodeData>[], edges: Edge[]): ElkNode {
  const elkEdges: ElkEdge[] = edges.map((edge) => {
    return {
      id: edge.id,
      sources: [edge.source],
      targets: [edge.target],
    };
  });
  // TODO: 本当は多重ネストしたnodeにも対応したほうがいい
  const childMap: Map<string, ElkNode[]> = new Map()
  nodes
    .forEach((node) => {
      if (node.parentNode) {
        const childNode: ElkNode = {
          id: node.id,
          width: node.data.size.width,
          height: node.data.size.height,
          x: node.position.x,
          y: node.position.y,
        };
        const prev = childMap.get(node.parentNode)
        const children = (prev && prev.length > 0) ? prev.concat([childNode]) : [childNode]
        childMap.set(node.parentNode, children)
      }
    });
  const elkNodes: ElkNode[] = nodes.filter((node) => !node.parentNode).map((node) => {
    return {
      id: node.id,
      width: node.data.size.width,
      height: node.data.size.height,
      x: node.position.x,
      y: node.position.y,
      children: childMap.get(node.id)
    };
  });
  return {
    id: "root",
    layoutOptions: { "elk.algorithm": "force" },
    children: elkNodes,
    edges: elkEdges,
  };
}
