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
      <div>{props.data.label}</div>
      <Handle
        type="source"
        position="bottom"
        id="source"
        style={{ top: "50%", borderRadius: "10%" }}
      />
    </div>
  );
};
