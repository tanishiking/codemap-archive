import * as React from "react";

import { NodeProps, Handle } from "react-flow-renderer";
import { NodeData } from "../NodeData";

const customNodeStyles = (size: {
  height: number;
  width: number;
}): React.CSSProperties => {
  return {
    padding: "4px",
    height: size.height,
    width: size.width,
  };
};

export const RefNodeComponent = (props: NodeProps<NodeData>) => {
  return (
    <div style={customNodeStyles(props.data.size)}>
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
