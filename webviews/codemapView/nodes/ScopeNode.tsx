import { Resizable } from "re-resizable";
import * as React from "react";

import { NodeProps, Handle } from "react-flow-renderer";
import { NodeData } from "../NodeData";

const customNodeStyles: React.CSSProperties = {
  background: "#9CA8B3",
  color: "#FFF",
  padding: "4px",
  verticalAlign: "top",
};

export const defaultSize = {
  width: 344,
  height: 72,
};
export const ScopeNodeComponent = (props: NodeProps<NodeData>) => {
  return (
    <Resizable
      // DO NOT pass `defaultSize` here, data.size will be received from props when the webview was restored
      defaultSize={props.data.size}
      onResizeStop={(_e, _direction, _ref, d) => {
        props.data.resizeNode(props.id, {
          width: props.data.size.width + d.width,
          height: props.data.size.height + d.height,
        });
      }}
      style={customNodeStyles}
    >
      <Handle type="target" position="left" style={{ borderRadius: 0 }} />

      {/* TODO: maxHeight is not working */}
      <div contentEditable={true} style={{maxHeight: props.data.size.height}}>{props.data.label}</div>

      {/*
      <Editor
        initialValue={props.data.label}
        // previewStyle={"global" as PreviewStyle}
        height={`${props.data.size.height}px`}
        hideModeSwitch={true}
        toolbarItems={[]}
        // useCommandShortcut={true}
        usageStatistics={false}
        viewer={false}
      />
      */}
      <Handle
        type="source"
        position="right"
        id="b"
        style={{ top: "50%", borderRadius: 0 }}
      />
    </Resizable>
  );
};
