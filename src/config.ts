import * as vscode from 'vscode';
import type { SelectraConfig } from './types';

const DEFAULT_INCLUDE = [
  '**/*.{html,htm,jsx,tsx,vue,svelte,astro,php,erb,ejs,hbs,twig}',
];
const DEFAULT_EXCLUDE = ['**/{node_modules,.git,dist,build,out,coverage}/**'];

function stringArray(value: unknown, fallback: readonly string[]): string[] {
  if (!Array.isArray(value)) {
    return [...fallback];
  }

  const result = value.filter(
    (entry): entry is string => typeof entry === 'string' && entry.trim().length > 0,
  );
  return result.length > 0 ? result : [...fallback];
}

function boundedNumber(
  value: unknown,
  fallback: number,
  minimum: number,
  maximum = Number.MAX_SAFE_INTEGER,
): number {
  return typeof value === 'number' && Number.isFinite(value)
    ? Math.min(maximum, Math.max(minimum, Math.floor(value)))
    : fallback;
}

export function getConfig(): SelectraConfig {
  const config = vscode.workspace.getConfiguration('selectra');
  return {
    include: stringArray(config.get('include'), DEFAULT_INCLUDE),
    exclude: stringArray(config.get('exclude'), DEFAULT_EXCLUDE),
    contextLines: boundedNumber(config.get('contextLines'), 2, 0, 20),
    maxPreviewLines: boundedNumber(config.get('maxPreviewLines'), 15, 3, 100),
    maxFileSizeKB: boundedNumber(config.get('maxFileSizeKB'), 2048, 1),
    maxResults: boundedNumber(config.get('maxResults'), 5000, 1),
  };
}
