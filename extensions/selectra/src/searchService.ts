import * as path from 'node:path';
import { minimatch } from 'minimatch';
import * as vscode from 'vscode';
import { searchMarkup } from './markupSearch';
import type {
  SearchMatch,
  SearchReport,
  SearchWarning,
  SelectraConfig,
} from './types';

export interface SearchProgress {
  readonly current: number;
  readonly total: number;
  readonly relativePath: string;
}

export type SearchProgressCallback = (progress: SearchProgress) => void;

interface FileSource {
  readonly text: string;
  readonly size: number;
}

function relativePath(folder: vscode.WorkspaceFolder, uri: vscode.Uri): string {
  const relative = path.posix.relative(folder.uri.path, uri.path);
  return relative || path.posix.basename(uri.path);
}

function isExcluded(relative: string, patterns: readonly string[]): boolean {
  return patterns.some((pattern) => minimatch(relative, pattern, { dot: true }));
}

function hasNullByte(bytes: Uint8Array): boolean {
  const sampleSize = Math.min(bytes.byteLength, 8192);
  for (let index = 0; index < sampleSize; index += 1) {
    if (bytes[index] === 0) {
      return true;
    }
  }
  return false;
}

async function readSource(
  uri: vscode.Uri,
  maxBytes: number,
): Promise<FileSource | 'binary' | 'invalid-utf8' | 'too-large'> {
  const openDocument = vscode.workspace.textDocuments.find(
    (document) => document.uri.toString() === uri.toString(),
  );
  if (openDocument) {
    const text = openDocument.getText();
    const size = Buffer.byteLength(text, 'utf8');
    return size > maxBytes ? 'too-large' : { text, size };
  }

  const stat = await vscode.workspace.fs.stat(uri);
  if (stat.size > maxBytes) {
    return 'too-large';
  }
  const bytes = await vscode.workspace.fs.readFile(uri);
  if (hasNullByte(bytes)) {
    return 'binary';
  }
  try {
    return {
      text: new TextDecoder('utf-8', { fatal: true }).decode(bytes),
      size: bytes.byteLength,
    };
  } catch {
    return 'invalid-utf8';
  }
}

async function discoverFiles(
  config: SelectraConfig,
  token: vscode.CancellationToken,
): Promise<Array<{ uri: vscode.Uri; folder: vscode.WorkspaceFolder; relativePath: string }>> {
  const folders = vscode.workspace.workspaceFolders ?? [];
  const found = new Map<
    string,
    { uri: vscode.Uri; folder: vscode.WorkspaceFolder; relativePath: string }
  >();

  for (const folder of folders) {
    for (const include of config.include) {
      if (token.isCancellationRequested) {
        return [];
      }
      const uris = await vscode.workspace.findFiles(
        new vscode.RelativePattern(folder, include),
        undefined,
        undefined,
        token,
      );
      for (const uri of uris) {
        const relative = relativePath(folder, uri);
        if (!isExcluded(relative, config.exclude)) {
          found.set(uri.toString(), { uri, folder, relativePath: relative });
        }
      }
    }
  }

  return [...found.values()].sort((left, right) => {
    const folderOrder = left.folder.name.localeCompare(right.folder.name);
    return folderOrder || left.relativePath.localeCompare(right.relativePath);
  });
}

export async function searchWorkspace(
  selector: string,
  config: SelectraConfig,
  token: vscode.CancellationToken,
  onProgress?: SearchProgressCallback,
): Promise<SearchReport> {
  const started = Date.now();
  const matches: SearchMatch[] = [];
  const warnings: SearchWarning[] = [];
  const matchedUris = new Set<string>();
  let scannedFiles = 0;
  let skippedFiles = 0;
  let truncated = false;
  const files = await discoverFiles(config, token);

  for (let index = 0; index < files.length; index += 1) {
    if (token.isCancellationRequested) {
      break;
    }
    const file = files[index];
    if (!file) {
      continue;
    }
    onProgress?.({ current: index + 1, total: files.length, relativePath: file.relativePath });

    try {
      const source = await readSource(file.uri, config.maxFileSizeKB * 1024);
      if (source === 'binary' || source === 'invalid-utf8' || source === 'too-large') {
        skippedFiles += 1;
        warnings.push({
          uri: file.uri,
          message:
            source === 'binary'
              ? 'Skipped a file that appears to be binary.'
              : source === 'invalid-utf8'
                ? 'Skipped a file that is not valid UTF-8.'
                : `Skipped a file larger than ${config.maxFileSizeKB} KB.`,
        });
        continue;
      }

      scannedFiles += 1;
      const fileMatches = searchMarkup(source.text, selector, config);
      const remaining = config.maxResults - matches.length;
      const accepted = fileMatches.slice(0, Math.max(0, remaining));
      if (accepted.length > 0) {
        matchedUris.add(file.uri.toString());
      }
      for (const match of accepted) {
        matches.push({
          ...match,
          uri: file.uri,
          workspaceName: file.folder.name,
          relativePath: file.relativePath,
        });
      }
      if (fileMatches.length > accepted.length || matches.length >= config.maxResults) {
        truncated = true;
        break;
      }
    } catch (error) {
      skippedFiles += 1;
      warnings.push({
        uri: file.uri,
        message: error instanceof Error ? error.message : 'Unknown error while scanning file.',
      });
    }

    // Give the extension host a chance to process cancellation and UI events.
    await new Promise<void>((resolve) => setImmediate(resolve));
  }

  return {
    selector,
    matches,
    scannedFiles,
    matchedFiles: matchedUris.size,
    skippedFiles,
    warnings,
    truncated,
    cancelled: token.isCancellationRequested,
    elapsedMs: Date.now() - started,
  };
}
