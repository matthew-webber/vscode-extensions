import { compile } from 'css-select';

const UNSUPPORTED_PSEUDOS = new Set([
  'active',
  'contains',
  'focus',
  'focus-visible',
  'focus-within',
  'hover',
  'icontains',
  'target',
  'visited',
]);

interface ScanResult {
  readonly pseudoElements: boolean;
  readonly parentCombinator: boolean;
  readonly pseudos: readonly string[];
}

function scanSelector(selector: string): ScanResult {
  const pseudos: string[] = [];
  let quote: '"' | "'" | undefined;
  let escaped = false;
  let bracketDepth = 0;
  let pseudoElements = false;
  let parentCombinator = false;

  for (let index = 0; index < selector.length; index += 1) {
    const character = selector[index];
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
      continue;
    }
    if (character === '[') {
      bracketDepth += 1;
      continue;
    }
    if (character === ']') {
      bracketDepth = Math.max(0, bracketDepth - 1);
      continue;
    }
    if (bracketDepth > 0) {
      continue;
    }
    if (character === '<') {
      parentCombinator = true;
      continue;
    }
    if (character !== ':') {
      continue;
    }

    if (selector[index + 1] === ':') {
      pseudoElements = true;
      index += 1;
    }

    let name = '';
    while (index + 1 < selector.length && /[\w-]/u.test(selector[index + 1] ?? '')) {
      index += 1;
      name += selector[index];
    }
    if (name) {
      pseudos.push(name.toLowerCase());
    }
  }

  return { pseudoElements, parentCombinator, pseudos };
}

export function validateSelector(selector: string): string | undefined {
  const trimmed = selector.trim();
  if (!trimmed) {
    return 'Enter a CSS selector.';
  }

  const scanned = scanSelector(trimmed);
  if (scanned.pseudoElements) {
    return 'Pseudo-elements are not source nodes and cannot be searched.';
  }
  if (scanned.parentCombinator) {
    return 'The nonstandard parent combinator (<) is not supported.';
  }
  const unsupported = scanned.pseudos.find((name) => UNSUPPORTED_PSEUDOS.has(name));
  if (unsupported) {
    return `The runtime or nonstandard :${unsupported} pseudo-class is not supported.`;
  }
  if (/[>+~,]\s*$/u.test(trimmed)) {
    return 'Invalid CSS selector: a selector cannot end with a combinator or comma.';
  }

  try {
    compile(trimmed);
    return undefined;
  } catch (error) {
    return error instanceof Error ? `Invalid CSS selector: ${error.message}` : 'Invalid CSS selector.';
  }
}
