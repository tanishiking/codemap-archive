import * as vscode from "vscode";

const ScopeSymbolKind = [
    vscode.SymbolKind.Method,
    vscode.SymbolKind.Function,
    vscode.SymbolKind.Class,
    vscode.SymbolKind.Namespace,
    vscode.SymbolKind.Module,
    vscode.SymbolKind.Constructor,
    vscode.SymbolKind.Package
];

class ScopeFinder {
  constructor(private _doc: vscode.TextDocument) {}

  getSymbols(): Thenable<vscode.DocumentSymbol[] | undefined> {
    // assert.equal(vscode.window.activeTextEditor.document, this._doc);
    return vscode.commands.executeCommand(
      "vscode.executeDocumentSymbolProvider",
      this._doc.uri
    );
    // hogehoge


  }
}
