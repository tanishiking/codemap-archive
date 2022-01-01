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
  constructor(private uri: vscode.Uri) {}

  // public async pathTo(pos: vscode.Position): Promise<vscode.DocumentSymbol[] | null> {
  //   const toplevelSyms = await this.getScopeSymbols()
  //   toplevelSyms?.map ( sym =>  sym.children)

  //   return toplevelSyms
  // }

  public async getScopeSymbols(): Promise<vscode.DocumentSymbol[] | null> {
    let symbols = await this.getSymbols();
    if (!symbols) return null;
    // console.log(`getScopeSymbols ${symbols.length}`);
    return this.filterScopeSymbols(
      this.recurChildren(symbols, this.filterScopeSymbols)
    );
  }

  /**
   * Get scope symbols that contain the given position.
   * 
   * @param pos - position that should be contained
   * @returns symbols sorted by range narrower first, broader latter
   */
  public async locateSymbols(
    pos: vscode.Position
  ): Promise<vscode.DocumentSymbol[]> {
    const syms = await this.getSymbols() || [];

    const containsPos = (syms: vscode.DocumentSymbol[]) =>
      syms.filter((sym) => sym.range.contains(pos));
    const locatedSyms = containsPos(
      this.recurChildren(syms, containsPos)
    )
    return locatedSyms.sort(this.compareByRange)
  }

  private filterScopeSymbols(
    syms: vscode.DocumentSymbol[]
  ): vscode.DocumentSymbol[] {
    return syms.filter(
      (sym: vscode.DocumentSymbol) => ScopeSymbolKind.indexOf(sym.kind) > -1
    );
  }

  /**
   * @returns 1 (a is bigger) if a contains (or equals to) b
   */
  private compareByRange = (a: vscode.DocumentSymbol, b: vscode.DocumentSymbol) => {
    return a.range.contains(b.range) ? 1 : -1
  }
    

  private recurChildren(
    syms: vscode.DocumentSymbol[],
    filter: (syms: vscode.DocumentSymbol[]) => vscode.DocumentSymbol[]
  ): vscode.DocumentSymbol[] {
    if (syms.length > 0)
      return syms.concat(
        this.recurChildren(
          syms.flatMap((sym) => filter(sym.children)),
          filter
        )
      );
    else return [];
  }

  private getSymbols(): Thenable<vscode.DocumentSymbol[] | undefined> {
    // assert.equal(vscode.window.activeTextEditor.document, this.doc);
    return vscode.commands.executeCommand(
      "vscode.executeDocumentSymbolProvider",
      this.uri
    );
  }
}
