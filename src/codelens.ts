import {
  CodeLensProvider,
  TextDocument,
  CodeLens,
  Command,
} from "vscode";
import { ScopeSymbolsFinder } from "./scope";

export class ScopeSymbolsCodeLensProvider implements CodeLensProvider {
  async provideCodeLenses(document: TextDocument): Promise<CodeLens[]> {
    const finder = new ScopeSymbolsFinder(document)
    const scopeSymbols = await finder.getScopeSymbols()
    let cmd: Command = {
      command: "extension.addConsoleLog",
      title: "Add to CodeMap",
    };
    const lenses = scopeSymbols?.map(sym => new CodeLens(sym.range, cmd))

    return lenses ? lenses : [];
  }
}
