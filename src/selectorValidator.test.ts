import { describe, expect, it } from 'vitest';
import { validateSelector } from './selectorValidator';

describe('validateSelector', () => {
  it.each([
    '.people .card > .details',
    'article[data-kind="person"]:first-child',
    ':is(section, article) > :not(.hidden)',
    '.card:has(> .details)',
  ])('accepts structural selector %s', (selector) => {
    expect(validateSelector(selector)).toBeUndefined();
  });

  it('rejects empty and malformed selectors', () => {
    expect(validateSelector('')).toBeTruthy();
    expect(validateSelector('.card >')).toMatch(/^Invalid CSS selector:/u);
  });

  it.each(['div::before', 'div:hover', 'div:contains("text")', 'section < .item'])(
    'rejects unsupported selector %s',
    (selector) => {
      expect(validateSelector(selector)).toBeTruthy();
    },
  );

  it('does not confuse an attribute value containing < with the parent combinator', () => {
    expect(validateSelector('[data-expression="a < b"]')).toBeUndefined();
  });
});
