import * as vscode from "vscode";
import {
  AddNode,
  getAddNodeValidator,
} from "../shared/messages/toWebview/AddNode";
import { Navigate } from "../shared/messages/toWebview/navigate";
import { Range } from "../shared/messages/position"
import { ScopeSymbolsCodeLensProvider } from "./codelens";
import { AddToCodeMap } from "./commands";
import { DefinitionProviderTracker } from "./navigationProvider";
import { CodeMapPanel } from "./panel";
import { ScopeSymbolsFinder } from "./scope";

export function activate(context: vscode.ExtensionContext) {

  const validateAddNode = getAddNodeValidator();

  const commandNew = vscode.commands.registerCommand(
    "codemap.new",
    async () => {
      await CodeMapPanel.createNewMap(context.extensionUri);
    }
  );

  const addDisposable = vscode.commands.registerCommand(
    AddToCodeMap,
    async (...args: any[]) => {
      if (args.length === 0) {
        const editor = vscode.window.activeTextEditor;
        if (!editor) return;
        const selection = editor.selection;
        const text = editor.document.getText(selection);

        const panel = await CodeMapPanel.showOrNew(context.extensionUri);
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
        // TODO: wait for the webview to listen the message, currently unvisible webview can't receive the message.
        const panel = await CodeMapPanel.showOrNew(context.extensionUri);
        if (!panel) return;
        const result = await panel.addNode(arg);
        return result
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

    // If the cursor move in one line, it had probably not came from code navigation.
    if (withinOneLine([position, uri.toString()], prevPosition)) return;

    const finder = new ScopeSymbolsFinder(uri)
    const scopeSymbols = await finder.locateSymbols(position)
    if (scopeSymbols.length === 0) return;
    const toSym = scopeSymbols[0]
    const to: AddNode = {
      label: toSym.name,
      range: Range.fromVSCode(toSym.range, uri)
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
    // If there's a panel instance, add to the map. Otherwise, just ignore.
    // We need to show the map, otherwise JS in the webview doesn't work (of cource) and the messages will be ignored.
    const panel = CodeMapPanel.showCurrentPanel();
    if (!panel) return;
    return panel.traceNavigation(payload);
  });

  context.subscriptions.push(
    commandNew,
    addDisposable,
    codeLensProviderDisposable,
    definitionProviderDisposable
  );
}

// this method is called when your extension is deactivated
export function deactivate() {}
