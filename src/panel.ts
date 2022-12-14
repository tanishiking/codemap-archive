import * as vscode from "vscode";
import { ViewColumn } from "vscode";
import { AddNode } from "../shared/messages/toWebview/addNode";
import { Message } from "../shared/messages/toWebview/message";
import { getMessageValidator } from "../shared/messages/fromWebview/message";
import { getOpenInEditorValidator } from "../shared/messages/fromWebview/openInEditor";
import { IRange } from "../shared/messages/position";
import { Navigate } from "../shared/messages/toWebview/navigate";

export class CodeMapPanel {
  // public static readonly title = "Code Map";
  public static readonly viewType = "codeMap";
  public static currentPanel: CodeMapPanel | null = null;
  private panel: vscode.WebviewPanel;
  private extensionUri: vscode.Uri;
  private disposables: vscode.Disposable[] = [];

  public static lastOpenedTitle: string | null = null;

  public static async createNewMap(
    extensionUri: vscode.Uri
  ): Promise<CodeMapPanel | null> {
    const column = vscode.window.activeTextEditor?.viewColumn;

    const input = await vscode.window.showInputBox({
      title: "Map title",
      validateInput: (input: string) => {
        if (input.length === 0) return "Title cannot be empty.";
        else return ""; // valid
      },
    });
    if (!input) return null;
    const panel = vscode.window.createWebviewPanel(
      CodeMapPanel.viewType,
      input,
      column || vscode.ViewColumn.Beside,
      CodeMapPanel.getWebviewOptions(extensionUri)
    );

    CodeMapPanel.lastOpenedTitle = input;
    CodeMapPanel.currentPanel = new CodeMapPanel(panel, extensionUri);
    return this.currentPanel;
  }

  public static showCurrentPanel() {
    if (CodeMapPanel.currentPanel) {
      if (!CodeMapPanel.currentPanel.panel.visible)
        CodeMapPanel.currentPanel.panel.reveal(vscode.ViewColumn.Beside);
      return this.currentPanel;
    } else return null
  }

  /**
   * If there's already an opened map, just show it.
   * If any maps had opened in this instance, show it.
   * Otherwise, propt to create a new map.
   */
  public static async showOrNew(extensionUri: vscode.Uri): Promise<CodeMapPanel | null> {
    // If we already have a panel, show it.
    if (CodeMapPanel.currentPanel) {
      if (!CodeMapPanel.currentPanel.panel.visible)
        CodeMapPanel.currentPanel.panel.reveal(vscode.ViewColumn.Beside);
      return this.currentPanel;
    } else {
      if (CodeMapPanel.lastOpenedTitle) {
        return this.show(extensionUri, CodeMapPanel.lastOpenedTitle)
      } else {
        return this.createNewMap(extensionUri)
      }
    }

  }

  public static async show(
    extensionUri: vscode.Uri,
    title: string,
  ): Promise<CodeMapPanel | null> {
    const column = vscode.window.activeTextEditor?.viewColumn;

    const panel = vscode.window.createWebviewPanel(
      CodeMapPanel.viewType,
      title,
      column || vscode.ViewColumn.Beside,
      CodeMapPanel.getWebviewOptions(extensionUri)
    );

      // CodeMapPanel.lastOpenedTitle = input
    CodeMapPanel.currentPanel = new CodeMapPanel(panel, extensionUri);
    return this.currentPanel;
  }

  public async addNode(payload: AddNode): Promise<boolean> {
    const message: Message = {
      command: "add_node",
      data: payload,
    };
    return this.panel.webview.postMessage(message);
  }

  public async traceNavigation(payload: Navigate): Promise<boolean> {
    const message: Message = {
      command: "navigate",
      data: payload,
    };
    return this.panel.webview.postMessage(message);
  }

  private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri) {
    this.panel = panel;
    this.extensionUri = extensionUri;

    this.updateWebview();

    const validateMessage = getMessageValidator();
    const validateOpenIneditor = getOpenInEditorValidator();

    this.panel.webview.onDidReceiveMessage(async (message) => {
      if (!validateMessage(message)) {
        console.error(validateMessage.errors);
        return;
      }
      switch (message.command) {
        case "open_in_editor":
          const data = message.data;
          if (!validateOpenIneditor(data)) {
            console.error(validateOpenIneditor.errors);
            return;
          }
          await this.openInEditor(data.range);
          break;
      }
    });

    this.panel.onDidDispose(
      () => {
        CodeMapPanel.currentPanel = null;
      },
      null,
      this.disposables
    );
  }

  private updateWebview(): void {
    // this.panel.title = ;
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
        <div id="app"></div>
				<script src="${scriptUri}"></script>
			</body>
			</html>`;
  }

  private async openInEditor(range: IRange): Promise<void> {
    const uri = vscode.Uri.parse(range.uri, true);
    const start = new vscode.Position(range.start.line, range.start.character);
    const selection = new vscode.Selection(start, start);

    let viewColumn = ViewColumn.Beside;
    if (this.panel.viewColumn === undefined) viewColumn = ViewColumn.Beside;
    else {
      switch (this.panel.viewColumn) {
        case ViewColumn.One:
          viewColumn = ViewColumn.Beside;
          break;
        default:
          viewColumn = this.panel.viewColumn - 1;
          break;
      }
    }

    await vscode.window.showTextDocument(uri, {
      viewColumn,
      selection,
    });
    return;
  }
}
