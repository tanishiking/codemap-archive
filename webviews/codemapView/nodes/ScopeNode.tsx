import { Resizable } from "re-resizable";
import * as React from "react";
import { useRef, useState } from "react";
import ContentEditable, { ContentEditableEvent } from "react-contenteditable";

import { NodeProps, Handle } from "react-flow-renderer";
import { NodeData } from "../NodeData";

const customNodeStyles: React.CSSProperties = {
  background: "#FCFCF7",
  color: "#000000",
  padding: "1px",
  verticalAlign: "top",
};

export const defaultSize = {
  width: 240,
  height: 72,
};
export const ScopeNodeComponent = (props: NodeProps<NodeData>) => {
  const innerRef = useRef<HTMLElement>(null);
  const handleChange = (event: ContentEditableEvent) => {
    props.data.updateContent(props.id, event.target.value)
  };
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
      <ContentEditable
        innerRef={innerRef}
        html={props.data.label} // TODO: rename label to html or something
        disabled={false} // use true to disable editing
        onChange={handleChange} // handle innerHTML change
        tagName="article"
      />

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
