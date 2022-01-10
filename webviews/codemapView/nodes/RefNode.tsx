import * as React from "react";

import { NodeProps, Handle } from "react-flow-renderer";
import { NodeData } from "../NodeData";

const customNodeStyles: React.CSSProperties = {
  padding: "4px",
};

export const defaultSize = {
  width: 132,
  height: 36,
};
export const RefNodeComponent = (props: NodeProps<NodeData>) => {
  return (
    <div style={customNodeStyles}>
      <Handle type="target" position="left" style={{ borderRadius: 0 }} />
      <div>{props.data.label}</div>
      <Handle
        type="source"
        position="right"
        id="b"
        style={{ top: "50%", borderRadius: 0 }}
      />
    </div>
  );
};
