import { describe, expect, it } from 'vitest';
import { SourceText } from './sourceText';

describe('SourceText', () => {
  it('maps offsets to lines and characters', () => {
    const source = new SourceText('zero\none\r\ntwo');
    expect(source.positionAt(0)).toEqual({ line: 0, character: 0 });
    expect(source.positionAt(5)).toEqual({ line: 1, character: 0 });
    expect(source.positionAt(10)).toEqual({ line: 2, character: 0 });
  });

  it('elides the middle of large previews', () => {
    const text = Array.from({ length: 20 }, (_, index) => `line ${index}`).join('\n');
    const source = new SourceText(text);
    const preview = source.preview(0, text.length, 0, 5);
    expect(preview.split('\n')).toHaveLength(5);
    expect(preview).toContain('⋯');
    expect(preview).toContain('line 19');
  });
});
