import * as React from "react";
import { useRef, useEffect, DragEvent, MouseEvent, useCallback } from "react";
import { WebviewApi } from "vscode-webview";
import ReactFlow, {
  ReactFlowInstance,
  ReactFlowProvider,
  Node,
  addEdge,
  Connection,
  Edge,
  useNodesState,
  useEdgesState,
  XYPosition,
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

import { NodeData } from "./temporalNode";
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
  const reactFlowInstanceRef = useRef<ReactFlowInstance | null>(null);
  // the temporal nodes resting on the sidebar
  // const [tempNodes, setTempNodes] = useState<TemporalNode[]>([]);
  const reactFlowWrapper = useRef<HTMLDivElement | null>(null);
  const prevPos = useRef<XYPosition | null>(null);
  const { show } = useContextMenu({
    id: CONTEXT_MENU_ID,
  });

  const displayMenu = useCallback((e: React.MouseEvent, node: Node) => {
    // console.log(`displayMenu ${node.id}`)
    show(e, { props: { id: node.id } });
  }, [])

  const deleteNode = useCallback((nodeId?: string) => {
    // TODO: show confirmation
    if (nodeId === undefined) return;
    setNodes(nodes.filter((node) => nodeId !== node.id));
    setEdges(
      edges.filter((edge) => edge.source !== nodeId && edge.target !== nodeId)
    );
  }, [])

  useEffect(() => {
    const previousState = props.vscode.getState();
    if (previousState) {
      const flow = previousState.flow;
      setNodes(flow.nodes);
      setEdges(flow.edges);
      // TODO: restore the zooming state
      // useZoomPanHelper()
      // const [x = 0, y = 0] = flow.position;
      // transform({ x, y, zoom: flow.zoom || 0 });
      // setTempNodes(previousState.tempNodes);
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
            if (!validateAddNode(data)) {
              console.error(validateAddNode.errors);
              return;
            }
            const reactFlowBounds =
              reactFlowWrapper.current?.getBoundingClientRect();
            const reactFlowInstance = reactFlowInstanceRef.current;
            if (reactFlowInstance && reactFlowBounds) {
              // TODO: more smart position decision algorithm
              const position = !prevPos.current
                ? reactFlowInstance.project({
                    x: (reactFlowBounds.right - reactFlowBounds.left) / 2,
                    y: (reactFlowBounds.bottom - reactFlowBounds.top) / 2,
                  })
                : reactFlowInstance.project({
                    x: prevPos.current.x + Math.random() * 200,
                    y: prevPos.current.y + Math.random() * 200,
                  });

              const newNode: Node<NodeData> = {
                id: uuidv4(),
                position: position,
                data: { label: data.label, range: data.range },
              };
              prevPos.current = position
              setNodes((es) => es.concat(newNode));
              // setTempNodes((nodes) => nodes.filter((n) => n.id !== newNode.id));
            } else {
              // TODO: show error message
            }
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
    if (reactFlowInstanceRef.current) {
      const state: StateType = {
        flow: reactFlowInstanceRef.current.toObject(),
        // tempNodes,
      };
      props.vscode.setState(state);
    }
  }, [nodes]);

  const onDragOver = (event: DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
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
        style={{ height: 800 }}
      >
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onPaneReady={(instance) => (reactFlowInstanceRef.current = instance)}
          // onDrop={onDrop}
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
      <Menu id={CONTEXT_MENU_ID}>
        <Item onClick={() => {}}>Item 1</Item>
        <Separator />
        <Item
          onClick={(params: ItemParams<ItemProps, any>) =>
            deleteNode(params.props?.id)
          }
        >
          🗑️ Delete
        </Item>
      </Menu>
    </ReactFlowProvider>
  );
};
