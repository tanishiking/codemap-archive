import {
  CodeLensProvider,
  TextDocument,
  CodeLens,
  Command,
} from "vscode";
import { fromVSCodeRange } from "../shared/messages/position";
import { AddNode } from "../shared/messages/toWebview/addNode";
import { AddToCodeMap } from "./commands";
import { ScopeSymbolsFinder } from "./scope";

export class ScopeSymbolsCodeLensProvider implements CodeLensProvider {
  async provideCodeLenses(document: TextDocument): Promise<CodeLens[]> {
    const finder = new ScopeSymbolsFinder(document)
    const scopeSymbols = await finder.getScopeSymbols()
    const lenses = (scopeSymbols || []).map(sym => {
      const arg: AddNode = {
        label: sym.name,
        // kind: sym.kind,
        range: fromVSCodeRange(sym.range, document.uri)
      }
      const cmd: Command = {
        command: AddToCodeMap,
        title: `Add to CodeMap: ${sym.name}`,
        arguments: [arg],
      };
      return new CodeLens(sym.range, cmd)
    })

    return lenses ? lenses : [];
  }
}
