import { selectAll } from 'css-select';
import { parseDocument } from 'htmlparser2';
import type { Element } from 'domhandler';
import { SourceText } from './sourceText';
import type { MarkupMatch } from './types';

export interface MarkupSearchOptions {
  readonly contextLines: number;
  readonly maxPreviewLines: number;
}

function openingTagEnd(source: string, startOffset: number): number {
  let quote: '"' | "'" | undefined;
  let escaped = false;
  for (let index = startOffset; index < source.length; index += 1) {
    const character = source[index];
    if (escaped) {
      escaped = false;
      continue;
    }
    if (character === '\\') {
      escaped = true;
      continue;
    }
    if (quote) {
      if (character === quote) {
        quote = undefined;
      }
      continue;
    }
    if (character === '"' || character === "'") {
      quote = character;
    } else if (character === '>') {
      return index + 1;
    }
  }
  return Math.min(source.length, startOffset + 1);
}

function compactOpeningTag(value: string): string {
  const compact = value.replace(/\s+/gu, ' ').trim();
  return compact.length > 120 ? `${compact.slice(0, 117)}…` : compact;
}

export function searchMarkup(
  source: string,
  selector: string,
  options: MarkupSearchOptions,
): MarkupMatch[] {
  const document = parseDocument(source, {
    withStartIndices: true,
    withEndIndices: true,
    recognizeSelfClosing: true,
  });
  const sourceText = new SourceText(source);
  const elements = selectAll(selector, document.children) as Element[];

  return elements.flatMap((element): MarkupMatch[] => {
    if (element.startIndex === null || element.startIndex === undefined) {
      return [];
    }
    const startOffset = element.startIndex;
    const tagEnd = openingTagEnd(source, startOffset);
    const endOffset =
      element.endIndex === null || element.endIndex === undefined
        ? tagEnd
        : Math.min(source.length, element.endIndex + 1);

    return [{
      startOffset,
      endOffset,
      start: sourceText.positionAt(startOffset),
      end: sourceText.positionAt(endOffset),
      openingTag: compactOpeningTag(source.slice(startOffset, tagEnd)),
      preview: sourceText.preview(
        startOffset,
        endOffset,
        options.contextLines,
        options.maxPreviewLines,
      ),
    }];
  });
}
