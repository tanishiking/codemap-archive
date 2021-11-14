import * as vscode from "vscode";
import { Message } from "../shared/message";

export class CodeMapPanel {
  public static readonly title = "Code Map";
  public static readonly viewType = "codeMap";
  public static currentPanel: CodeMapPanel | null = null;
  private panel: vscode.WebviewPanel;
  private extensionUri: vscode.Uri;
  private disposables: vscode.Disposable[] = [];

  public static createOrShow(extensionUri: vscode.Uri) {
    const column = vscode.window.activeTextEditor?.viewColumn;

    // If we already have a panel, show it.
    if (CodeMapPanel.currentPanel) {
      if (!CodeMapPanel.currentPanel.panel.visible)
        CodeMapPanel.currentPanel.panel.reveal(vscode.ViewColumn.Beside);
      return this.currentPanel;
    } else {
      const panel = vscode.window.createWebviewPanel(
        CodeMapPanel.viewType,
        CodeMapPanel.title,
        column || vscode.ViewColumn.Beside,
        CodeMapPanel.getWebviewOptions(extensionUri)
      );

      CodeMapPanel.currentPanel = new CodeMapPanel(panel, extensionUri);
      return this.currentPanel;
    }
  }

  public addNode(message: Message) {
    console.log(`postMessage: ${message}`);
    this.panel.webview.postMessage(message);
  }

  private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri) {
    this.panel = panel;
    this.extensionUri = extensionUri;

    this.updateWebview();

    this.panel.onDidDispose(
      () => {
        CodeMapPanel.currentPanel = null;
      },
      null,
      this.disposables
    );
  }

  private updateWebview(): void {
    console.log("updateWebview");
    this.panel.title = CodeMapPanel.title;
    this.panel.webview.html = CodeMapPanel.getHtmlForWebview(
      this.panel.webview,
      this.extensionUri
    );
  }

  private static getWebviewOptions(
    extensionUri: vscode.Uri
  ): vscode.WebviewOptions {
    return {
      // Enable javascript in the webview
      enableScripts: true,

      // And restrict the webview to only loading content from our extension's `media` directory.
      localResourceRoots: [vscode.Uri.joinPath(extensionUri, "media")],
    };
  }
  private static getHtmlForWebview(
    webview: vscode.Webview,
    extensionUri: vscode.Uri
  ) {
    // Local path to main script run in the webview
    const scriptPathOnDisk = vscode.Uri.joinPath(
      extensionUri,
      "media",
      "main.js"
    );

    // And the uri we use to load this script in the webview
    const scriptUri = scriptPathOnDisk.with({ scheme: "vscode-resource" });

    // Local path to css styles
    const styleResetPath = vscode.Uri.joinPath(
      extensionUri,
      "media",
      "reset.css"
    );
    const stylesPathMainPath = vscode.Uri.joinPath(
      extensionUri,
      "media",
      "vscode.css"
    );

    // Uri to load styles into webview
    // const stylesResetUri = webview.asWebviewUri(styleResetPath)
    // const stylesMainUri = webview.asWebviewUri(stylesPathMainPath)

    return `<!DOCTYPE html>
			<html lang="en">
			<head>
				<meta charset="UTF-8">
				<title>Code Map</title>
			</head>
			<body>
				<h1 id="lines-of-code-counter">Code Map</h1>
                <div id="app"></div>

				<script src="${scriptUri}"></script>
			</body>
			</html>`;
  }
}
