import * as React from "react";
import {
  useRef,
  useEffect,
  DragEvent,
  MouseEvent,
  useCallback,
  useMemo,
} from "react";
import { AsyncActionHandlers, useReducerAsync } from "use-reducer-async";
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
  applyNodeChanges,
  applyEdgeChanges,
  OnNodesChange,
  MarkerType,
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
import {
  AddNode,
  getAddNodeValidator,
} from "../../shared/messages/toWebview/AddNode";
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
import { getLayoutedPositions } from "./layout";

const CONTEXT_MENU_ID = "react_flow_menu_id";
const INEDITABLE_CLASS = "ineditable";
const DATA_REFNODE_ID_ATTR = "data-refnode-id";

import "./flow.css";

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
  const outers = nodes.filter((node) =>
    Range.fromIRange(node.data.range).contains(child)
  );
  if (outers.length === 0) return null;
  else
    return outers.sort((a, b) =>
      Range.fromIRange(a.data.range).contains(b.data.range) ? 1 : -1
    )[0];
};

interface FlowState {
  nodes: Node<NodeData>[];
  edges: Edge[];
}
type ActionType =
  | { type: "update"; nodes: Node<NodeData>[]; edges: Edge[] }
  | { type: "deleteNode"; id: string }
  | { type: "restore" }
  | { type: "nodeChange"; changes: NodeChange[] }
  | { type: "edgeChange"; changes: EdgeChange[] }
  | { type: "connect"; params: Connection | Edge }
  | { type: "resize"; id: string; width: number; height: number }
  | { type: "updateContent"; id: string; newContent: string }
  | { type: "formatRefNodes"; parentId: string };
type AsyncActionType =
  | { type: "addNode"; param: AddNode }
  | { type: "addNavigation"; param: Navigate };

const initialState: FlowState = {
  nodes: [],
  edges: [],
};

export const FlowComponent = (props: { vscode: WebviewApi<StateType> }) => {
  const reducer: React.Reducer<FlowState, ActionType> = useCallback(
    (prevState, action) => {
      switch (action.type) {
        case "update":
          return {
            ...prevState,
            nodes: action.nodes,
            edges: action.edges,
          };
        case "deleteNode":
          const nodeId = action.id;
          return {
            ...prevState,
            nodes: prevState.nodes.filter(
              (node) => nodeId !== node.id && nodeId !== node.parentNode
            ),
            edges: prevState.edges.filter(
              (edge) => edge.source !== nodeId && edge.target !== nodeId
            ),
          };
        case "nodeChange":
          return {
            ...prevState,
            nodes: applyNodeChanges(action.changes, prevState.nodes),
          };
        case "edgeChange":
          return {
            ...prevState,
            edges: applyEdgeChanges(action.changes, prevState.edges),
          };
        case "connect":
          return {
            ...prevState,
            edges: addEdge(action.params, prevState.edges),
          };
        case "resize":
          const size = { width: action.width, height: action.height };
          const nodes = prevState.nodes.map((node) => {
            if (node.id === action.id)
              return {
                ...node,
                data: { ...node.data, size },
                ...size,
              };
            else return node;
          });
          return {
            ...prevState,
            nodes,
          };
        case "updateContent": {
          const nodes = prevState.nodes.map((node) => {
            if (node.id === action.id) {
              return {
                ...node,
                data: { ...node.data, label: action.newContent },
              };
            } else return node;
          });
          const updated = {
            ...prevState,
            nodes,
          };
          return reducer(updated, {
            type: "formatRefNodes",
            parentId: action.id,
          });
        }

        case "formatRefNodes": {
          // parentNode should be former than child node
          let outerBlock: HTMLElement | null = null;
          let blocks: Map<string, Element> = new Map();
          const nodes = prevState.nodes.map((node) => {
            if (node.id === action.parentId) {
              outerBlock = node.data.innerRef.current;
              if (outerBlock) {
                blocks = new Map(
                  Array.from(
                    outerBlock.getElementsByClassName(INEDITABLE_CLASS)
                  ).map((b) => [b.getAttribute(DATA_REFNODE_ID_ATTR) || "", b])
                );
              }
              return node;
            } else if (outerBlock && node.parentNode!! && blocks.has(node.id)) {
              const innerRect = blocks.get(node.id)!.getBoundingClientRect();
              const x =
                innerRect.right - outerBlock.getBoundingClientRect().left;
              const y = Math.max(
                innerRect.top - outerBlock.getBoundingClientRect().top,
                0
              );
              // adjust refNode's position
              return {
                ...node,
                position: { x, y },
              };
            } else return node;
          });
          return {
            ...prevState,
            nodes,
          };
        }
        case "restore":
          const restored = props.vscode.getState();
          if (restored) {
            const flow = restored.flow;
            const nodes: Node<NodeData>[] = flow.nodes.map((node) => {
              const newData = {
                ...node.data,
                resizeNode,
                updateContent,
                innerRef: React.createRef<HTMLElement>(),
              }; // reassign resizeNode
              return { ...node, data: newData };
            });
            return {
              ...prevState,
              nodes: nodes,
              edges: flow.edges,
            };
          } else {
            return prevState;
          }
        default:
          return prevState;
      }
    },
    []
  );
  const asyncActionHandlers: AsyncActionHandlers<
    React.Reducer<FlowState, ActionType>,
    AsyncActionType
  > = {
    addNode:
      ({ dispatch, getState, signal }) =>
      async (action) => {
        // await new Promise(r => setTimeout(r, action.ms));
        const prevState = getState();
        const reactFlowBounds =
          reactFlowWrapper.current?.getBoundingClientRect();
        const reactFlowInstance = reactFlowInstanceRef.current;
        if (reactFlowInstance && reactFlowBounds) {
          const position = {
            x: (reactFlowBounds.right - reactFlowBounds.left) / 4,
            y: (reactFlowBounds.bottom - reactFlowBounds.top) / 4,
          };

          const newNode: Node<NodeData> = createScopeNode(position, {
            label: action.param.label,
            range: Range.fromIRange(action.param.range),
            resizeNode,
            updateContent,
            innerRef: React.createRef<HTMLElement>(),
          });
          if (prevNodeId.current) {
            const dummyEdge: Edge = {
              id: uuidv4(),
              source: prevNodeId.current,
              target: newNode.id,
            };
            const newPos = (
              await getLayoutedPositions(
                [newNode],
                prevState.nodes,
                prevState.edges.concat(dummyEdge)
              )
            ).get(newNode.id);
            if (newPos) newNode.position = newPos;
          }
          prevNodeId.current = newNode.id;
          const nodes = prevState.nodes.concat(newNode);
          dispatch({ type: "update", nodes: nodes, edges: prevState.edges });
        } else {
          console.error("reactFlowInstance not yet ready");
          return;
        }
        // dispatch({ type: 'END_SLEEP' });
      },
    addNavigation:
      ({ dispatch, getState, signal }) =>
      async (action) => {
        const prevState = getState();
        const fromId = uuidv4();
        const toId = uuidv4();
        const reactFlowBounds =
          reactFlowWrapper.current?.getBoundingClientRect();
        const reactFlowInstance = reactFlowInstanceRef.current;
        if (reactFlowBounds && reactFlowInstance) {
          const fromParentNode = findContainingNode(
            prevState.nodes,
            action.param.from.range
          );
          if (!fromParentNode) return;

          const toRange = Range.fromIRange(action.param.to.range);
          if (toRange.equals(fromParentNode.data.range)) return;

          const from: Node<NodeData> = createRefNode(
            fromParentNode,
            {
              label: "",
              range: Range.fromIRange(action.param.from.range),
              resizeNode,
              updateContent,
              innerRef: React.createRef<HTMLElement>(),
            },
            fromId
          );

          const to: Node<NodeData> = createScopeNode(
            reactFlowInstance.project({
              x: fromParentNode.position.x + Math.random() * 50,
              y: fromParentNode.position.y + Math.random() * 50,
            }),
            {
              label: action.param.to.label,
              range: toRange,
              resizeNode,
              updateContent,
              innerRef: React.createRef<HTMLElement>(),
            },
            toId
          );
          const newEdge: Edge = {
            id: uuidv4(),
            source: fromId,
            target: toId,
            markerEnd: { type: MarkerType.ArrowClosed, color: "#32a1ce" },
            label: "reference",
            labelShowBg: false,
            // By default all edges are below the nodes. In order to be able to render edges on top of a group (or just a normal node) we introduced the new z-index option for edges. By default all nodes have z-index: 0. When you pass z-index:1, the edge is on top.
            // https://github.com/wbkd/react-flow/pull/1555
            zIndex: 1,
            style: { stroke: "#32a1ce", strokeWidth: "2px" }
          };

          const nodes = prevState.nodes
            .map((node) => {
              if (node.id === fromParentNode.id)
                return {
                  ...node,
                  data: {
                    ...node.data,
                    label:
                      node.data.label +
                      `<span class="${INEDITABLE_CLASS}" ${DATA_REFNODE_ID_ATTR}="${fromId}" contentEditable="false">${action.param.from.label}</span>`,
                  },
                };
              else return node;
            })
            .concat([from, to]);
          // const nodes = prevState.nodes.concat([from, to]);
          const edges = prevState.edges.concat(newEdge);
          const updated = {
            ...prevState,
            nodes,
            edges,
          };
          const newState = reducer(updated, {
            type: "formatRefNodes",
            parentId: fromParentNode.id,
          });
          dispatch({
            type: "update",
            nodes: newState.nodes,
            edges: newState.edges,
          });
        } else {
          return;
        }
      },
  };
  const [state, innerDispatch] = useReducerAsync(
    reducer,
    initialState,
    asyncActionHandlers
  );

  // Persist the state of webview
  // See:
  // https://code.visualstudio.com/api/extension-guides/webview#lifecycle
  // https://code.visualstudio.com/api/extension-guides/webview#persistence
  const persist = useCallback(() => {
    if (reactFlowInstanceRef.current) {
      // TODO: ref object を JSON stringify しようとして死ぬので、なんとかしてそれは object 化するの避けたい
      //  const state: StateType = {
      //    flow: reactFlowInstanceRef.current.toObject(),
      //  };
      // props.vscode.setState(state);
    }
  }, [props]);
  const dispatch = useCallback((action: ActionType | AsyncActionType) => {
    innerDispatch(action);
    persist(); // TODO: deleteNode した後に persist する状態が古い気がする
  }, []);

  const onNodesChange = useCallback((changes) => {
    dispatch({ type: "nodeChange", changes });
  }, []);
  const onEdgesChange = useCallback((changes) => {
    dispatch({ type: "edgeChange", changes });
  }, []);

  const reactFlowInstanceRef = useRef<ReactFlowInstance | null>(null);
  const reactFlowWrapper = useRef<HTMLDivElement | null>(null);
  const prevNodeId = useRef<string | null>(null);
  const { show } = useContextMenu({
    id: CONTEXT_MENU_ID,
  });

  const resizeNode = useCallback(
    (nodeId: string, size: { width: number; height: number }): void => {
      dispatch({ type: "resize", id: nodeId, ...size });
      onNodesChange([]); // Persist the change
    },
    []
  );
  const updateContent = useCallback(
    (nodeId: string, newContent: string): void => {
      dispatch({ type: "updateContent", id: nodeId, newContent });
      onNodesChange([]); // Persist the change
    },
    []
  );

  const displayMenu = useCallback((e: React.MouseEvent, node: Node) => {
    show(e, { props: { id: node.id } });
  }, []);

  useEffect(() => {
    dispatch({ type: "restore" });

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
          dispatch({ type: "addNode", param: data });
        } else if (message.command === "navigate") {
          const data = message.data;
          if (!validateNavigate(data)) {
            console.error(validateNavigate.errors);
            return;
          }
          dispatch({ type: "addNavigation", param: data });
        }
      }
    });
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

  const onConnect = useCallback(
    (params: Connection | Edge) => dispatch({ type: "connect", params }),
    []
  );

  const nodeTypes: NodeTypesType = useMemo(
    () => ({
      scope: ScopeNodeComponent,
      ref: RefNodeComponent,
    }),
    []
  );

  return (
    <ReactFlowProvider>
      <div
        className="reactflow-wrapper"
        ref={reactFlowWrapper}
        style={{ height: 800 }}
      >
        <ReactFlow
          nodes={state.nodes}
          edges={state.edges}
          onPaneReady={(instance) => (reactFlowInstanceRef.current = instance)}
          nodeTypes={nodeTypes}
          onDragOver={onDragOver}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeDoubleClick={onNodeDoubleClick}
          onNodeContextMenu={displayMenu}
          onConnect={onConnect}
          zoomOnScroll={false}
          panOnScroll={true}
          style={{
            backgroundColor: "#f6f8fa",
          }}
        >
          <MiniMap />
        </ReactFlow>
      </div>
      <Menu id={CONTEXT_MENU_ID}>
        <Item onClick={() => {}}>Item 1</Item>
        <Separator />
        <Item
          onClick={(params: ItemParams<ItemProps, any>) => {
            const target = params.props?.id;
            if (target) dispatch({ type: "deleteNode", id: target });
            // TODO: error handling
          }}
        >
          🗑️ Delete
        </Item>
      </Menu>
    </ReactFlowProvider>
  );
};
