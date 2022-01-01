import * as vscode from "vscode";
import {
  TextDocument,
  DefinitionProvider,
  Position,
  CancellationToken,
  Definition,
  ProviderResult,
  LocationLink,
} from "vscode";
import { ScopeSymbolsFinder } from "./scope";
import * as hash from "object-hash";
import * as NodeCache from "node-cache";
import { ValueSetItem } from "node-cache";

type CacheKey = {
  uri: string;
  start: vscode.Position;
};
export type Origin = {
  uri: string;
  position: vscode.Position;
};

export class DefinitionProviderTracker implements DefinitionProvider {
  private lock = new Set<string>();
  private cache = new NodeCache({ stdTTL: 60 });

  public findOrigin(uri: string, pos: Position): Origin | undefined {
    const key: CacheKey = {
      uri,
      start: pos,
    };
    const hashedKey = hash(key);
    const origin = this.cache.get<Origin>(hashedKey);
    if (origin) this.cache.del(hashedKey);
    return origin;
  }

  async provideDefinition(
    document: TextDocument,
    position: Position,
    _token: CancellationToken
  ): Promise<Definition | LocationLink[]> {
    const key = hash({
      uri: document.uri.toString(),
      position,
    });
    if (this.lock.has(key)) {
      this.lock.delete(key);
      return [];
    }
    this.lock.add(key);

    const symFinder = new ScopeSymbolsFinder(document);
    const sym = await symFinder.locateSymbol(position);
    console.log(`definitionProvider ${sym?.name || ""}`);
    if (sym) {
      console.log(sym.name);
    }

    const locationLinks = (await this.executeCommand(document.uri, position)) || [];
    const items: ValueSetItem<Origin>[] = locationLinks.map((loc) => {
      const key: CacheKey = {
        uri: loc.targetUri.toString(),
        start: loc.targetSelectionRange?.start || loc.targetRange.start,
      };
      console.log(`definition: ${JSON.stringify(key)}`);
      const value: Origin = {
        uri: document.uri.toString(),
        position: position,
      };
      return {
        key: hash(key),
        val: value,
      };
    });
    this.cache.mset(items);
    return []; // dummy, never return the result
  }

  private executeCommand(uri: vscode.Uri, pos: vscode.Position) {
    return vscode.commands.executeCommand<vscode.LocationLink[]>(
      "vscode.executeDefinitionProvider",
      uri,
      pos
    );
  }
}