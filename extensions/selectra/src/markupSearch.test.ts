import { describe, expect, it } from 'vitest';
import { searchMarkup } from './markupSearch';

const options = { contextLines: 1, maxPreviewLines: 9 };

describe('searchMarkup', () => {
  it('uses CSS descendant semantics instead of text matching', () => {
    const source = `
      <section class="people-cards-container">
        <article class="card"><div class="details">Ada</div></article>
        <div class="details">Not inside a card</div>
      </section>
      <p>.people-cards-container .card .details</p>
    `;

    const matches = searchMarkup(source, '.people-cards-container .card .details', options);

    expect(matches).toHaveLength(1);
    expect(matches[0]?.openingTag).toBe('<div class="details">');
    expect(source.slice(matches[0]?.startOffset, matches[0]?.endOffset)).toContain('Ada');
  });

  it('distinguishes direct children from deeper descendants', () => {
    const source = `
      <div class="card">
        <span class="details">direct</span>
        <section><span class="details">nested</span></section>
      </div>
    `;

    expect(searchMarkup(source, '.card > .details', options)).toHaveLength(1);
    expect(searchMarkup(source, '.card .details', options)).toHaveLength(2);
  });

  it('supports sibling, attribute, list, and structural selectors', () => {
    const source = `
      <ul><li data-kind="person">A</li><li>B</li><li class="last">C</li></ul>
    `;

    expect(searchMarkup(source, 'li[data-kind="person"] + li, li:last-child', options)).toHaveLength(2);
  });

  it('uses literal HTML attributes and does not alias JSX className', () => {
    const source = '<div className="person"><span>JSX-like</span></div><div class="person">HTML</div>';

    const matches = searchMarkup(source, '.person', options);

    expect(matches).toHaveLength(1);
    expect(source.slice(matches[0]?.startOffset, matches[0]?.endOffset)).toContain('HTML');
  });

  it('returns exact one-based-displayable source positions and bounded context', () => {
    const source = '<main>\n  <div>\n    <strong class="target">Yes</strong>\n  </div>\n</main>';

    const [match] = searchMarkup(source, 'strong.target', options);

    expect(match?.start).toEqual({ line: 2, character: 4 });
    expect(match?.openingTag).toBe('<strong class="target">');
    expect(match?.preview).toContain('<div>');
    expect(match?.preview).toContain('</div>');
  });

  it('tolerates incomplete markup fragments', () => {
    const source = 'const view = <section class="wrap"><div class="item">unfinished';

    expect(searchMarkup(source, '.wrap .item', options)).toHaveLength(1);
  });
});
