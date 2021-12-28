import * as vscode from "vscode";

const ScopeSymbolKind = [
  vscode.SymbolKind.Method,
  vscode.SymbolKind.Enum,
  vscode.SymbolKind.Function,
  vscode.SymbolKind.Class,
  vscode.SymbolKind.Namespace,
  vscode.SymbolKind.Module,
  vscode.SymbolKind.Constructor,
  vscode.SymbolKind.Package,
];

export class ScopeSymbolsFinder {
  constructor(private doc: vscode.TextDocument) {}

  // public async pathTo(pos: vscode.Position): Promise<vscode.DocumentSymbol[] | null> {
  //   const toplevelSyms = await this.getScopeSymbols()
  //   toplevelSyms?.map ( sym =>  sym.children)

  //   return toplevelSyms
  // }

  public async getScopeSymbols(): Promise<vscode.DocumentSymbol[] | null> {
    let symbols = await this.getSymbols();
    if (!symbols) return null;
    console.log(symbols);
    return this.filterScopeSymbols(this.recurChildren(symbols));
  }

  private filterScopeSymbols(
    syms: vscode.DocumentSymbol[]
  ): vscode.DocumentSymbol[] {
    return syms.filter(
      (sym: vscode.DocumentSymbol) => ScopeSymbolKind.indexOf(sym.kind) > -1
    );
  }

  private recurChildren(
    syms: vscode.DocumentSymbol[]
  ): vscode.DocumentSymbol[] {
    console.log(syms);
    if (syms.length > 0)
      return syms.concat(
        this.recurChildren(
          syms.flatMap((sym) => this.filterScopeSymbols(sym.children))
        )
      );
    else return [];
  }

  private getSymbols(): Thenable<vscode.DocumentSymbol[] | undefined> {
    // assert.equal(vscode.window.activeTextEditor.document, this.doc);
    return vscode.commands.executeCommand(
      "vscode.executeDocumentSymbolProvider",
      this.doc.uri
    );
  }
}
