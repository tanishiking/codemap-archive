// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import Ajv from "ajv";
import * as vscode from "vscode";
import { fromVSCodeRange } from "../shared/messages/position";
import {
  AddNode,
  getAddNodeValidator,
} from "../shared/messages/toWebview/AddNode";
import { Navigate } from "../shared/messages/toWebview/navigate";
import { ScopeSymbolsCodeLensProvider } from "./codelens";
import { AddToCodeMap } from "./commands";
import { DefinitionProviderTracker } from "./navigationProvider";
import { CodeMapPanel } from "./panel";
import { ScopeSymbolsFinder } from "./scope";

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  // Use the console to output diagnostic information (console.log) and errors (console.error)
  // This line of code will only be executed once when your extension is activated
  console.log('Congratulations, your extension "codemap" is now active!');

  const validateAddNode = getAddNodeValidator();

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

  const disposable2 = vscode.commands.registerCommand(
    AddToCodeMap,
    (...args: any[]) => {
      if (args.length === 0) {
        const editor = vscode.window.activeTextEditor;
        if (!editor) return;
        const selection = editor.selection;
        const text = editor.document.getText(selection);

        const panel = CodeMapPanel.createOrShow(context.extensionUri);
        if (!panel) return;
        const start = selection.start;
        const end = selection.end;
        const payload: AddNode = {
          label: text,
          range: {
            uri: editor.document.uri.toString(),
            start: {
              line: start.line,
              character: start.character,
            },
            end: {
              line: end.line,
              character: end.character,
            },
          },
        };
        return panel.addNode(payload);
      } else {
        const arg = args[0];
        if (!validateAddNode(arg)) {
          console.error(`Invalid argument: ${validateAddNode.errors}`);
          return;
        }
        const panel = CodeMapPanel.createOrShow(context.extensionUri);
        if (!panel) return;
        return panel.addNode(arg);
      }
    }
  );

  const docSelector: vscode.DocumentSelector = {
    scheme: "file",
  };
  const codeLensProviderDisposable = vscode.languages.registerCodeLensProvider(
    docSelector,
    new ScopeSymbolsCodeLensProvider()
  );

  const definitionProvider = new DefinitionProviderTracker();
  const definitionProviderDisposable =
    vscode.languages.registerDefinitionProvider(
      docSelector,
      definitionProvider
    );

  function withinOneLine(
    a: [vscode.Position, string],
    b: [vscode.Position, string]
  ): boolean {
    return (
      a[1] === b[1] && Math.abs(a[0].line - b[0].line) <= 1 // || Math.abs(a.character - b.character) <= 1
    );
  }
  let prevPosition: [vscode.Position, string] = [
    new vscode.Position(Number.MIN_VALUE, Number.MIN_VALUE),
    "",
  ];
  vscode.window.onDidChangeTextEditorSelection(async (e) => {
    if (e.kind !== vscode.TextEditorSelectionChangeKind.Command) return;
    if (e.selections.length < 1) return;

    // const finder = new ScopeSymbolsFinder(document)
    // const scopeSymbols = await finder.getScopeSymbols()
    const selection = e.selections[0];
    if (!selection.isEmpty) return; // if selecting something, skip

    const uri = e.textEditor.document.uri;
    const position = selection.start;
    if (withinOneLine([position, uri.toString()], prevPosition)) return;

    const finder = new ScopeSymbolsFinder(uri)
    const scopeSymbols = await finder.locateSymbols(position)
    if (scopeSymbols.length === 0) return;
    const toSym = scopeSymbols[0]
    const to: AddNode = {
      label: toSym.name,
      range: fromVSCodeRange(toSym.range, uri)
    }

    const origin = definitionProvider.findOrigin(uri, position)
    if (!origin) return

    const from: AddNode = {
      label: toSym.name,
      range: {
        uri: origin.uri,
        start: origin.position,
        end: origin.position,
      }
    }

    const payload: Navigate = {
      from,
      to
    }
    const panel = CodeMapPanel.createOrShow(context.extensionUri);
    if (!panel) return;
    return panel.traceNavigation(payload);
  });

  context.subscriptions.push(
    disposable1,
    disposable2,
    codeLensProviderDisposable,
    definitionProviderDisposable
  );
}

// this method is called when your extension is deactivated
export function deactivate() {}
