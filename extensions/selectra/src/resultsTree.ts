import * as vscode from 'vscode';
import type { SearchMatch, SearchReport } from './types';

type ResultNode = WorkspaceNode | FileNode | MatchNode;

interface WorkspaceNode {
  readonly kind: 'workspace';
  readonly name: string;
  readonly files: readonly FileNode[];
  readonly matchCount: number;
}

interface FileNode {
  readonly kind: 'file';
  readonly workspaceName: string;
  readonly relativePath: string;
  readonly uri: vscode.Uri;
  readonly matches: readonly MatchNode[];
}

interface MatchNode {
  readonly kind: 'match';
  readonly match: SearchMatch;
}

function plural(count: number, singular: string): string {
  return `${count} ${singular}${count === 1 ? '' : 'es'}`;
}

export class ResultsTreeProvider implements vscode.TreeDataProvider<ResultNode> {
  private readonly changed = new vscode.EventEmitter<ResultNode | undefined>();
  private roots: readonly WorkspaceNode[] = [];

  public readonly onDidChangeTreeData = this.changed.event;

  public setReport(report: SearchReport | undefined): void {
    if (!report) {
      this.roots = [];
      this.changed.fire(undefined);
      return;
    }

    const workspaces = new Map<string, Map<string, SearchMatch[]>>();
    for (const match of report.matches) {
      let files = workspaces.get(match.workspaceName);
      if (!files) {
        files = new Map();
        workspaces.set(match.workspaceName, files);
      }
      const fileMatches = files.get(match.relativePath) ?? [];
      fileMatches.push(match);
      files.set(match.relativePath, fileMatches);
    }

    this.roots = [...workspaces.entries()].map(([name, files]): WorkspaceNode => {
      const fileNodes = [...files.entries()].map(([relativePath, matches]): FileNode => ({
        kind: 'file',
        workspaceName: name,
        relativePath,
        uri: matches[0]?.uri ?? vscode.Uri.file(relativePath),
        matches: matches.map((match): MatchNode => ({ kind: 'match', match })),
      }));
      return {
        kind: 'workspace',
        name,
        files: fileNodes,
        matchCount: fileNodes.reduce((count, file) => count + file.matches.length, 0),
      };
    });
    this.changed.fire(undefined);
  }

  public getChildren(element?: ResultNode): ResultNode[] {
    if (!element) {
      return [...this.roots];
    }
    if (element.kind === 'workspace') {
      return [...element.files];
    }
    if (element.kind === 'file') {
      return [...element.matches];
    }
    return [];
  }

  public getTreeItem(element: ResultNode): vscode.TreeItem {
    if (element.kind === 'workspace') {
      const item = new vscode.TreeItem(element.name, vscode.TreeItemCollapsibleState.Expanded);
      item.description = plural(element.matchCount, 'match');
      item.contextValue = 'selectraWorkspace';
      item.iconPath = new vscode.ThemeIcon('root-folder');
      return item;
    }
    if (element.kind === 'file') {
      const item = new vscode.TreeItem(
        element.relativePath,
        vscode.TreeItemCollapsibleState.Expanded,
      );
      item.description = plural(element.matches.length, 'match');
      item.resourceUri = element.uri;
      item.contextValue = 'selectraFile';
      return item;
    }

    const { match } = element;
    const item = new vscode.TreeItem(match.openingTag, vscode.TreeItemCollapsibleState.None);
    item.description = `${match.start.line + 1}:${match.start.character + 1}`;
    item.contextValue = 'selectraMatch';
    item.iconPath = new vscode.ThemeIcon('symbol-key');
    const tooltip = new vscode.MarkdownString(undefined, true);
    tooltip.appendMarkdown(
      `**${match.relativePath}:${match.start.line + 1}:${match.start.character + 1}**\n\n`,
    );
    tooltip.appendCodeblock(match.preview, 'html');
    item.tooltip = tooltip;
    item.command = {
      command: 'selectra.openMatch',
      title: 'Open Match',
      arguments: [match],
    };
    return item;
  }

  public dispose(): void {
    this.changed.dispose();
  }
}
