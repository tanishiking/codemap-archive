// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";
import { Message } from "../shared/message";
import { CodeMapPanel } from "./panel";

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  // Use the console to output diagnostic information (console.log) and errors (console.error)
  // This line of code will only be executed once when your extension is activated
  console.log('Congratulations, your extension "codemap" is now active!');

  // The command has been defined in the package.json file
  // Now provide the implementation of the command with registerCommand
  // The commandId parameter must match the command field in package.json
  let disposable1 = vscode.commands.registerCommand(
    "codemap.helloWorld",
    () => {
      // The code you place here will be executed every time your command is executed
      // Display a message box to the user
      // vscode.window.showInformationMessage('Hello World from codemap!');
      CodeMapPanel.createOrShow(context.extensionUri);
    }
  );

  const disposable2 = vscode.commands.registerCommand("codemap.add", () => {
    const editor = vscode.window.activeTextEditor;
    if (!editor) return
    const selection = editor.selection;
    const text = editor.document.getText(selection);

    const panel = CodeMapPanel.createOrShow(context.extensionUri);
    if (!panel) return
    const start = selection.start
    const message: Message = {
      command: 'addNode',
      label: text,
      pos: {
        line: start.line,
        character: start.character
      },
    }
    panel.addNode(message)
  });

  context.subscriptions.push(disposable1, disposable2);
}

// this method is called when your extension is deactivated
export function deactivate() {}
