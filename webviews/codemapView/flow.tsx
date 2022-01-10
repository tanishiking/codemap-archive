import * as React from "react";
import {
  useRef,
  useEffect,
  DragEvent,
  MouseEvent,
  useCallback,
  useMemo,
} from "react";
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
  NodeTypesType,
  NodeChange,
  EdgeChange,
  MiniMap,
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

import { NodeData } from "./NodeData";
import { StateType } from "./persistence";
import {
  getNavigateValidator,
  Navigate,
} from "../../shared/messages/toWebview/navigate";
import { Range, IRange } from "../../shared/messages/position";
import { ScopeNodeComponent } from "./nodes/ScopeNode";
import { createRefNode, createScopeNode } from "./nodeCreation";
import { RefNodeComponent } from "./nodes/RefNode";

const CONTEXT_MENU_ID = "react_flow_menu_id";

/**
 * id: node id
 */
interface ItemProps {
  id: string;
}

const findContainingNode = (
  nodes: Node<NodeData>[],
  child: IRange
): Node<NodeData> | null => {
  // console.log(nodes);
  // console.log(child);
  const outers = nodes.filter((node) =>
    Range.fromIRange(node.data.range).contains(child)
  );
  // console.log(outers);
  if (outers.length === 0) return null;
  else
    return outers.sort((a, b) =>
      Range.fromIRange(a.data.range).contains(b.data.range) ? 1 : -1
    )[0];
};

export const FlowComponent = (props: { vscode: WebviewApi<StateType> }) => {
  const [nodes, setNodes, onNodesChangeOrig] = useNodesState([]);
  const [edges, setEdges, onEdgesChangeOrig] = useEdgesState([]);
  const reactFlowInstanceRef = useRef<ReactFlowInstance | null>(null);
  // the temporal nodes resting on the sidebar
  // const [tempNodes, setTempNodes] = useState<TemporalNode[]>([]);
  const reactFlowWrapper = useRef<HTMLDivElement | null>(null);
  const prevPos = useRef<XYPosition | null>(null);
  const { show } = useContextMenu({
    id: CONTEXT_MENU_ID,
  });

  const resizeNode = useCallback(
    (nodeId: string, size: { width: number; height: number }): void => {
      setNodes((nodes) => {
        return nodes.map((node) => {
          if (node.id === nodeId)
            return {
              ...node,
              data: { ...node.data, size },
              ...size,
            };
          else return node;
        });
      });
      onNodesChange([]); // Persist the change
    },
    []
  );

  const displayMenu = useCallback((e: React.MouseEvent, node: Node) => {
    show(e, { props: { id: node.id } });
  }, []);

  const deleteNode = useCallback((nodeId?: string) => {
    // TODO: show confirmation
    if (nodeId === undefined) return;
    setNodes((nodes) =>
      nodes.filter((node) => nodeId !== node.id && nodeId !== node.parentNode)
    );
    setEdges((edges) =>
      edges.filter((edge) => edge.source !== nodeId && edge.target !== nodeId)
    );
  }, []);

  // console.log(nodes);

  useEffect(() => {
    const previousState = props.vscode.getState();
    if (previousState) {
      const flow = previousState.flow;
      const nodes: Node<NodeData>[] = flow.nodes.map((node) => {
        const newData = { ...node.data, resizeNode }; // reassign resizeNode
        return { ...node, data: newData };
      });
      setNodes(nodes);
      setEdges(flow.edges);
      // TODO: restore the zooming state
      // useZoomPanHelper()
      // const [x = 0, y = 0] = flow.position;
      // transform({ x, y, zoom: flow.zoom || 0 });
      // setTempNodes(previousState.tempNodes);
    }
    const validateMessage = getMessageValidator();
    const validateAddNode = getAddNodeValidator();
    const validateNavigate = getNavigateValidator();

    window.addEventListener("message", (event: MessageEvent) => {
      const message = event.data; // The json data that the extension sent
      if (!validateMessage(message)) {
        console.error(validateMessage.errors);
        return;
      } else {
        if (message.command === "add_node") {
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
                  x: (reactFlowBounds.right - reactFlowBounds.left) / 4,
                  y: (reactFlowBounds.bottom - reactFlowBounds.top) / 4,
                })
              : reactFlowInstance.project({
                  x: prevPos.current.x + Math.random() * 50,
                  y: prevPos.current.y + Math.random() * 50,
                });

            const newNode: Node<NodeData> = createScopeNode(position, {
              label: data.label,
              range: Range.fromIRange(data.range),
              resizeNode,
            });
            prevPos.current = position;
            setNodes((es) => es.concat(newNode));
            // setTempNodes((nodes) => nodes.filter((n) => n.id !== newNode.id));
          } else {
            // TODO: show error message
          }
        } else if (message.command === "navigate") {
          const data = message.data;
          if (!validateNavigate(data)) {
            console.error(validateNavigate.errors);
            return;
          }
          addNavigate(data);
        }
      }
    });
  }, []);

  const addNavigate = useCallback((data: Navigate) => {
    const fromId = uuidv4();
    const toId = uuidv4();
    const reactFlowBounds = reactFlowWrapper.current?.getBoundingClientRect();
    if (!reactFlowBounds) return;
    setNodes((nodes: Node[]) => {
      const fromParentNode = findContainingNode(nodes, data.from.range);
      if (!fromParentNode) return nodes;

      const toRange = Range.fromIRange(data.to.range);
      if (toRange.equals(fromParentNode.data.range)) return nodes;

      const reactFlowInstance = reactFlowInstanceRef.current;
      if (!reactFlowInstance) return nodes;
      const from: Node<NodeData> = createRefNode(
        fromParentNode,
        {
          label: data.from.label,
          range: Range.fromIRange(data.from.range),
          resizeNode,
        },
        fromId
      );
      const to: Node<NodeData> = createScopeNode(
        reactFlowInstance.project({
          x: fromParentNode.position.x + Math.random() * 50,
          y: fromParentNode.position.y + Math.random() * 50,
        }),
        { label: data.to.label, range: toRange, resizeNode },
        toId
      );
      return nodes.concat([from, to]);
    });

    const newEdge: Edge = {
      id: uuidv4(),
      source: fromId,
      target: toId,
    };
    setEdges((edges) => edges.concat([newEdge]));
  }, []);

  // Persist the state of webview
  // See:
  // https://code.visualstudio.com/api/extension-guides/webview#lifecycle
  // https://code.visualstudio.com/api/extension-guides/webview#persistence
  const onNodesChange = useCallback((chagnes: NodeChange[]) => {
    onNodesChangeOrig(chagnes);
    if (reactFlowInstanceRef.current) {
      const state: StateType = {
        flow: reactFlowInstanceRef.current.toObject(),
        // tempNodes,
      };
      props.vscode.setState(state);
    }
  }, []);
  const onEdgesChange = useCallback((chagnes: EdgeChange[]) => {
    onEdgesChangeOrig(chagnes);
    if (reactFlowInstanceRef.current) {
      const state: StateType = {
        flow: reactFlowInstanceRef.current.toObject(),
        // tempNodes,
      };
      props.vscode.setState(state);
    }
  }, []);

  const onDragOver = (event: DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  };

  const onNodeDoubleClick = useCallback(
    (event: MouseEvent, node: Node<NodeData | undefined>) => {
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
        props.vscode.postMessage(message);
      } else console.error(`No data available for nodeId: ${node.id}`);
    },
    [props.vscode]
  );

  const onConnect = (params: Connection | Edge) =>
    setEdges((els) => addEdge(params, els));

  const nodeTypes: NodeTypesType = useMemo(
    () => ({
      scope: ScopeNodeComponent,
      ref: RefNodeComponent,
    }),
    []
  );

  // console.log(nodes)

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
          nodeTypes={nodeTypes}
          onDragOver={onDragOver}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeDoubleClick={onNodeDoubleClick}
          onNodeContextMenu={displayMenu}
          onConnect={onConnect}
          zoomOnScroll={false}
          panOnScroll={true}
        >
          <MiniMap />
        </ReactFlow>
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
