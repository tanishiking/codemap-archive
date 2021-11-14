import * as React from "react";
import { render } from "react-dom";
import { WebviewApi } from "vscode-webview";

import { FlowComponent } from "./flow";
import { StateType } from "./persistence";

export function main() {
  const vscode: WebviewApi<StateType> = acquireVsCodeApi()
  render(
    <div style={{ height: 400 }}>
      <FlowComponent vscode={vscode}></FlowComponent>
    </div>,
    document.getElementById("app")
  );
}
