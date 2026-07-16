import type { Uri } from 'vscode';

export interface SelectraConfig {
  readonly include: readonly string[];
  readonly exclude: readonly string[];
  readonly contextLines: number;
  readonly maxPreviewLines: number;
  readonly maxFileSizeKB: number;
  readonly maxResults: number;
}

export interface SourcePosition {
  readonly line: number;
  readonly character: number;
}

export interface MarkupMatch {
  readonly startOffset: number;
  readonly endOffset: number;
  readonly start: SourcePosition;
  readonly end: SourcePosition;
  readonly openingTag: string;
  readonly preview: string;
}

export interface SearchMatch extends MarkupMatch {
  readonly uri: Uri;
  readonly workspaceName: string;
  readonly relativePath: string;
}

export interface SearchWarning {
  readonly uri?: Uri;
  readonly message: string;
}

export interface SearchReport {
  readonly selector: string;
  readonly matches: readonly SearchMatch[];
  readonly scannedFiles: number;
  readonly matchedFiles: number;
  readonly skippedFiles: number;
  readonly warnings: readonly SearchWarning[];
  readonly truncated: boolean;
  readonly cancelled: boolean;
  readonly elapsedMs: number;
}
