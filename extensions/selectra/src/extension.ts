import * as vscode from 'vscode';
import { getConfig } from './config';
import { ResultsTreeProvider } from './resultsTree';
import { searchWorkspace } from './searchService';
import { validateSelector } from './selectorValidator';
import type { SearchMatch, SearchReport } from './types';

const LAST_SELECTOR_KEY = 'selectra.lastSelector';

function reportMessage(report: SearchReport): string {
  if (report.cancelled) {
    return `Cancelled — ${report.matches.length} matches collected`;
  }
  const parts = [
    `${report.matches.length} ${report.matches.length === 1 ? 'match' : 'matches'}`,
    `${report.matchedFiles} ${report.matchedFiles === 1 ? 'file' : 'files'}`,
    `${(report.elapsedMs / 1000).toFixed(2)}s`,
  ];
  if (report.truncated) {
    parts.push('result limit reached');
  }
  if (report.skippedFiles > 0) {
    parts.push(`${report.skippedFiles} skipped`);
  }
  return parts.join(' · ');
}

function writeReport(output: vscode.OutputChannel, report: SearchReport): void {
  output.clear();
  output.appendLine(`Selector: ${report.selector}`);
  output.appendLine(
    `Scanned ${report.scannedFiles} files in ${(report.elapsedMs / 1000).toFixed(2)}s; ` +
      `found ${report.matches.length} matches in ${report.matchedFiles} files.`,
  );
  if (report.truncated) {
    output.appendLine('The configured result limit was reached; remaining files were not scanned.');
  }
  if (report.cancelled) {
    output.appendLine('The search was cancelled.');
  }
  if (report.warnings.length > 0) {
    output.appendLine('');
    output.appendLine('Warnings:');
    for (const warning of report.warnings) {
      const location = warning.uri ? `${warning.uri.toString()}: ` : '';
      output.appendLine(`- ${location}${warning.message}`);
    }
  }
}

function positionInDocument(document: vscode.TextDocument, match: SearchMatch): vscode.Position {
  if (document.lineCount === 0) {
    return new vscode.Position(0, 0);
  }
  const line = Math.min(match.start.line, document.lineCount - 1);
  const character = Math.min(match.start.character, document.lineAt(line).text.length);
  return new vscode.Position(line, character);
}

export function activate(context: vscode.ExtensionContext): void {
  const results = new ResultsTreeProvider();
  const view = vscode.window.createTreeView('selectra.results', {
    treeDataProvider: results,
    showCollapseAll: true,
  });
  const output = vscode.window.createOutputChannel('Selectra');
  let currentReport: SearchReport | undefined;
  let searchRunning = false;

  const runSearch = async (promptForSelector: boolean): Promise<void> => {
    if (searchRunning) {
      void vscode.window.showInformationMessage('A Selectra search is already running.');
      return;
    }
    if (!vscode.workspace.workspaceFolders?.length) {
      void vscode.window.showWarningMessage('Open a folder or workspace before running Selectra.');
      return;
    }

    let selector = currentReport?.selector ?? context.workspaceState.get<string>(LAST_SELECTOR_KEY) ?? '';
    if (promptForSelector || !selector) {
      const entered = await vscode.window.showInputBox({
        title: 'Selectra: Find by CSS Selector',
        prompt: 'Enter a structural CSS selector',
        placeHolder: '.people-cards-container .card > .details',
        value: selector,
        ignoreFocusOut: true,
        validateInput: validateSelector,
      });
      if (entered === undefined) {
        return;
      }
      selector = entered.trim();
    }

    const validationError = validateSelector(selector);
    if (validationError) {
      void vscode.window.showErrorMessage(validationError);
      return;
    }

    await context.workspaceState.update(LAST_SELECTOR_KEY, selector);
    searchRunning = true;
    view.message = `Searching for ${selector}…`;
    try {
      const report = await vscode.window.withProgress(
        {
          location: vscode.ProgressLocation.Notification,
          title: `Selectra: ${selector}`,
          cancellable: true,
        },
        async (progress, token) =>
          searchWorkspace(selector, getConfig(), token, (update) => {
            progress.report({
              message: `${update.current}/${update.total} — ${update.relativePath}`,
            });
          }),
      );
      currentReport = report;
      results.setReport(report);
      view.message = reportMessage(report);
      writeReport(output, report);
      await vscode.commands.executeCommand('workbench.view.extension.selectra');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown search error.';
      view.message = 'Search failed';
      output.appendLine(`Search failed: ${message}`);
      output.show(true);
      void vscode.window.showErrorMessage(`Selectra search failed: ${message}`);
    } finally {
      searchRunning = false;
    }
  };

  context.subscriptions.push(
    results,
    view,
    output,
    vscode.commands.registerCommand('selectra.find', () => runSearch(true)),
    vscode.commands.registerCommand('selectra.refresh', () => runSearch(false)),
    vscode.commands.registerCommand('selectra.clear', () => {
      currentReport = undefined;
      results.setReport(undefined);
      view.message = undefined;
      output.clear();
    }),
    vscode.commands.registerCommand('selectra.openSettings', () =>
      vscode.commands.executeCommand('workbench.action.openSettings', `@ext:${context.extension.id}`),
    ),
    vscode.commands.registerCommand('selectra.openMatch', async (match: SearchMatch) => {
      const document = await vscode.workspace.openTextDocument(match.uri);
      const editor = await vscode.window.showTextDocument(document, { preview: true });
      const position = positionInDocument(document, match);
      editor.selection = new vscode.Selection(position, position);
      editor.revealRange(
        new vscode.Range(position, position),
        vscode.TextEditorRevealType.InCenterIfOutsideViewport,
      );
    }),
    vscode.workspace.onDidChangeConfiguration((event) => {
      if (event.affectsConfiguration('selectra') && currentReport) {
        view.message = `${reportMessage(currentReport)} · settings changed; refresh to apply`;
      }
    }),
  );
}

export function deactivate(): void {
  // VS Code disposes all registered resources through the extension context.
}
