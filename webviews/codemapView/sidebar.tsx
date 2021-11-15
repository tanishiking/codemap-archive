import * as React from "react";
import { TemporalNode } from "./temporalNode";

export const SidebarComponent = (props: { nodes: TemporalNode[] }) => {
  const onDragStart = (event: React.DragEvent, node: TemporalNode) => {
    const json = JSON.stringify(node);
    event.dataTransfer.setData("data", json);
    event.dataTransfer.effectAllowed = "move";
  };

  return (
    <aside>
      <div className="description">
        You can drag these nodes to the pane on the right.
      </div>
      {props.nodes.map((node) => (
        <div
          className="react-flow__node"
          key={node.id}
          onDragStart={(event) => onDragStart(event, node)}
          draggable
        >
          {node.label}
        </div>
      ))}
    </aside>
  );
};
