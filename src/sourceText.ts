import type { SourcePosition } from './types';

export class SourceText {
  private readonly lineStarts: number[] = [0];

  public constructor(public readonly text: string) {
    for (let index = 0; index < text.length; index += 1) {
      if (text.charCodeAt(index) === 10) {
        this.lineStarts.push(index + 1);
      }
    }
  }

  public positionAt(rawOffset: number): SourcePosition {
    const offset = Math.max(0, Math.min(rawOffset, this.text.length));
    let low = 0;
    let high = this.lineStarts.length;
    while (low < high) {
      const middle = Math.floor((low + high) / 2);
      if ((this.lineStarts[middle] ?? 0) > offset) {
        high = middle;
      } else {
        low = middle + 1;
      }
    }
    const line = Math.max(0, low - 1);
    return { line, character: offset - (this.lineStarts[line] ?? 0) };
  }

  public preview(
    startOffset: number,
    endOffset: number,
    contextLines: number,
    maxLines: number,
  ): string {
    const lines = this.text.split(/\r?\n/u);
    const startLine = this.positionAt(startOffset).line;
    const endLine = this.positionAt(Math.max(startOffset, endOffset - 1)).line;
    const first = Math.max(0, startLine - contextLines);
    const last = Math.min(lines.length - 1, endLine + contextLines);
    const selected = lines.slice(first, last + 1);

    if (selected.length <= maxLines) {
      return selected.join('\n');
    }

    const headCount = Math.ceil((maxLines - 1) / 2);
    const tailCount = Math.floor((maxLines - 1) / 2);
    return [
      ...selected.slice(0, headCount),
      '⋯',
      ...selected.slice(selected.length - tailCount),
    ].join('\n');
  }
}
