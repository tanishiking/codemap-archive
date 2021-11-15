import * as React from "react";
import styled from "styled-components";
import { TemporalNode } from "./temporalNode";

const NodeBlock = styled.div`
  align-items: center;
  border: 1px solid #1a192b;
  color: #1a192b;
  background-color: #fff;
  border-radius: 2px;
  display: flex;
  height: 20px;
  justify-content: center";
  padding: 4px;
`;

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
        <NodeBlock
          key={node.id}
          onDragStart={(event) => onDragStart(event, node)}
          draggable
        >
          {node.label}
        </NodeBlock>
      ))}
    </aside>
  );
};
