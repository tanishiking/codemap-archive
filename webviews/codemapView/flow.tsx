import * as React from "react";
import { useState, useRef, useEffect, DragEvent } from "react";
import { WebviewApi } from "vscode-webview";
import ReactFlow, {
  Elements,
  OnLoadParams,
  ReactFlowProvider,
  MiniMap,
} from "react-flow-renderer";
import { v4 as uuidv4 } from "uuid";

import { getValidator } from "../../shared/message";
import { getValidator as getTempNodeValidator } from "./temporalNode";
import { SidebarComponent } from "./sidebar";
import { TemporalNode } from "./temporalNode";
import { StateType } from "./persistence";

const initialElements = [
  {
    id: "1",
    type: "input", // input node
    data: { label: "Input Node" },
    position: { x: 250, y: 25 },
  },
  // default node
  {
    id: "2",
    // you can also pass a React component as a label
    data: { label: "Default Node" },
    position: { x: 250, y: 30 },
  },
  {
    id: "3",
    type: "output", // output node
    data: { label: "Output Node" },
    position: { x: 250, y: 250 },
  },
  // animated edge
  { id: "e1-2", source: "1", target: "2", animated: true },
  { id: "e2-3", source: "2", target: "3" },
];

export const FlowComponent = (props: {vscode: WebviewApi<StateType>}) => {
  const [elements, setElements] = useState<Elements>(initialElements);
  const [reactFlowInstance, setReactFlowInstance] =
    useState<OnLoadParams | null>(null);
  // the temporal nodes resting on the sidebar
  const [tempNodes, setTempNodes] = useState<TemporalNode[]>([]);
  const reactFlowWrapper = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const previousState = props.vscode.getState()
    if (previousState) {
      const flow = previousState.flow
      setElements(flow.elements || []);
      // TODO: restore the zooming state
      // useZoomPanHelper()
      // const [x = 0, y = 0] = flow.position;
      // transform({ x, y, zoom: flow.zoom || 0 });
      setTempNodes(previousState.tempNodes)
    }
    const validateMessage = getValidator();
    console.log("useEffect in flow")

    window.addEventListener("message", (event: MessageEvent) => {
      console.log(`message received: ${event.data}`)
      const message = event.data; // The json data that the extension sent
      if (!validateMessage(message)) {
        console.error(validateMessage.errors);
        return;
      } else {
        switch (message.command) {
          case "addNode":
            const temp: TemporalNode = {
              id: uuidv4(),
              label: message.label,
              pos: message.pos,
            };
            setTempNodes((nodes) => nodes.concat(temp));
            break;
          default:
            console.error(`Unsupported message.command ${message.command}`);
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
      }
      props.vscode.setState(state)
    }
  }, [elements, tempNodes])


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
      const newNode = {
        id: data.id,
        position: position,
        data: { label: data.label, pos: data.pos },
      };

      setElements((es) => es.concat(newNode));
    }
  };

  return (
    <ReactFlowProvider>
      <div
        className="reactflow-wrapper"
        ref={reactFlowWrapper}
        style={{ height: 300 }}
      >
        <ReactFlow
          elements={elements}
          onLoad={setReactFlowInstance}
          onDrop={onDrop}
          onDragOver={onDragOver}
        >
        </ReactFlow>
      </div>
      <SidebarComponent nodes={tempNodes} />
    </ReactFlowProvider>
  );
};
