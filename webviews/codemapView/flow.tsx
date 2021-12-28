import * as React from "react";
import { useState, useRef, useEffect, DragEvent, MouseEvent } from "react";
import { WebviewApi } from "vscode-webview";
import ReactFlow, {
  Elements,
  ReactFlowInstance,
  ReactFlowProvider,
  Node,
  FlowElement,
  addEdge,
  Connection,
  Edge,
  useNodesState,
  useEdgesState,
} from "react-flow-renderer";
import { v4 as uuidv4 } from "uuid";
import {
  useContextMenu,
  Menu,
  Item,
  Separator,
  ItemParams,
} from "react-contexify";
import "react-contexify/dist/ReactContexify.css";

import { getMessageValidator } from "../../shared/messages/toWebview/message";
import { getAddNodeValidator } from "../../shared/messages/toWebview/AddNode";
import { OpenInEditor } from "../../shared/messages/fromWebview/openInEditor";
import { Message } from "../../shared/messages/fromWebview/message";

import { getValidator as getTempNodeValidator, NodeData } from "./temporalNode";
import { SidebarComponent } from "./sidebar";
import { TemporalNode } from "./temporalNode";
import { StateType } from "./persistence";

const CONTEXT_MENU_ID = "react_flow_menu_id";

/**
 * id: node id
 */
interface ItemProps {
  id: string;
}

export const FlowComponent = (props: { vscode: WebviewApi<StateType> }) => {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [reactFlowInstance, setReactFlowInstance] =
    useState<ReactFlowInstance | null>(null);
  // the temporal nodes resting on the sidebar
  const [tempNodes, setTempNodes] = useState<TemporalNode[]>([]);
  const reactFlowWrapper = useRef<HTMLDivElement | null>(null);
  const { show } = useContextMenu({
    id: CONTEXT_MENU_ID,
  });

  function displayMenu(e: React.MouseEvent, node: Node): void {
    // console.log(`displayMenu ${node.id}`)
    show(e, { props: { id: node.id } });
  }

  function deleteNode(
    nodeId?: string,
  ): void {
    // TODO: show confirmation
    if (nodeId === undefined) return
    setNodes(nodes.filter(node => nodeId !== node.id))
    setEdges(edges.filter(edge => edge.source !== nodeId && edge.target !== nodeId))
  }

  useEffect(() => {
    const previousState = props.vscode.getState();
    if (previousState) {
      const flow = previousState.flow;
      setNodes(flow.nodes)
      setEdges(flow.edges)
      // TODO: restore the zooming state
      // useZoomPanHelper()
      // const [x = 0, y = 0] = flow.position;
      // transform({ x, y, zoom: flow.zoom || 0 });
      setTempNodes(previousState.tempNodes);
    }
    const validateMessage = getMessageValidator();
    const validateAddNode = getAddNodeValidator();

    window.addEventListener("message", (event: MessageEvent) => {
      const message = event.data; // The json data that the extension sent
      if (!validateMessage(message)) {
        console.error(validateMessage.errors);
        return;
      } else {
        switch (message.command) {
          case "add_node":
            const data = message.data;
            console.log(message.data);
            if (!validateAddNode(data)) {
              console.error(validateAddNode.errors);
              return;
            }
            const temp: TemporalNode = {
              id: uuidv4(),
              label: data.label,
              range: data.range,
            };
            setTempNodes((nodes) => nodes.concat(temp));
            break;
        }
      }
    });
  }, []);

  // Persist the state of webview
  // See:
  // https://code.visualstudio.com/api/extension-guides/webview#lifecycle
  // https://code.visualstudio.com/api/extension-guides/webview#persistence
  useEffect(() => {
    if (reactFlowInstance) {
      const state: StateType = {
        flow: reactFlowInstance.toObject(),
        tempNodes,
      };
      props.vscode.setState(state);
    }
  }, [nodes, tempNodes]);

  const onDragOver = (event: DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  };

  const onDrop = (event: DragEvent) => {
    event.preventDefault();

    const reactFlowBounds = reactFlowWrapper.current?.getBoundingClientRect();
    const rawData = event.dataTransfer.getData("data");
    let data: TemporalNode | null = null;
    try {
      const parsed = JSON.parse(rawData);
      const tempNodeValidate = getTempNodeValidator();
      if (!tempNodeValidate(parsed)) {
        console.error(tempNodeValidate.errors);
        data = null;
      } else {
        data = parsed;
      }
    } catch (e) {
      if (e instanceof SyntaxError) console.error(`${e.message}\n${rawData}`);
      data = null;
    }

    if (data && reactFlowInstance && reactFlowBounds) {
      const position = reactFlowInstance.project({
        x: event.clientX - reactFlowBounds.left,
        y: event.clientY - reactFlowBounds.top,
      });
      const newNode: FlowElement<NodeData> = {
        id: data.id,
        position: position,
        data: { label: data.label, range: data.range },
      };

      setNodes((es) => es.concat(newNode));
      setTempNodes((nodes) => nodes.filter((n) => n.id !== newNode.id));
    }
  };

  const onNodeDoubleClick = (
    event: MouseEvent,
    node: Node<NodeData | undefined>
  ) => {
    event.preventDefault(); // (need this?)
    const data = node.data;
    if (data) {
      const payload: OpenInEditor = {
        label: data.label,
        range: data.range,
      };
      const message: Message = {
        command: "open_in_editor",
        data: payload,
      };
      console.log(message);
      props.vscode.postMessage(message);
    } else console.error(`No data available for nodeId: ${node.id}`);
  };

  const onConnect = (params: Connection | Edge) =>
    setEdges((els) => addEdge(params, els));

  return (
    <ReactFlowProvider>
      <div
        className="reactflow-wrapper"
        ref={reactFlowWrapper}
        style={{ height: 400 }}
      >
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onPaneReady={setReactFlowInstance}
          onDrop={onDrop}
          onDragOver={onDragOver}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeDoubleClick={onNodeDoubleClick}
          onNodeContextMenu={displayMenu}
          onConnect={onConnect}
          zoomOnScroll={false}
          panOnScroll={true}
        ></ReactFlow>
      </div>
      <SidebarComponent nodes={tempNodes} />
      <Menu id={CONTEXT_MENU_ID}>
        <Item onClick={() => {}}>
          Item 1
        </Item>
        <Separator />
        <Item onClick={(params: ItemParams<ItemProps, any>) => deleteNode(params.props?.id) }>🗑️ Delete</Item>
      </Menu>
    </ReactFlowProvider>
  );
};
