# Selectra

Selectra searches source markup structurally. Give it a CSS selector and it finds nodes that actually match that selector across the files selected by your workspace globs.

Unlike text or regular-expression search, a query such as:

```css
.people-cards-container .card .details
```

only matches `.details` elements that are descendants of `.card` elements inside `.people-cards-container`.

## Use

1. Open the **Selectra** icon in the Activity Bar.
2. Choose **Find by CSS Selector**, or run `Selectra: Find by CSS Selector` from the Command Palette.
3. Enter a selector.
4. Expand the workspace and file groups. Hover a match for surrounding markup or click it to open the source location.

Use the refresh button to rerun the last selector. Searches are cancellable and use unsaved content from open editors.

## File globs

Configure files through normal VS Code workspace settings:

```json
{
  "selectra.include": [
    "src/**/*.{html,tsx,vue}",
    "templates/**/*.php"
  ],
  "selectra.exclude": [
    "**/{node_modules,dist,vendor}/**",
    "**/*.generated.*"
  ]
}
```

The parser does not filter by VS Code language ID. Any UTF-8 text file can be included, regardless of its extension.

## Settings

| Setting | Default | Purpose |
| --- | --- | --- |
| `selectra.include` | Common HTML/template extensions | Workspace-relative files to scan |
| `selectra.exclude` | Dependency and build directories | Workspace-relative files to omit |
| `selectra.contextLines` | `2` | Context before and after the matched node |
| `selectra.maxPreviewLines` | `15` | Maximum hover-preview length |
| `selectra.maxFileSizeKB` | `2048` | Skip larger files |
| `selectra.maxResults` | `5000` | Stop after this many results |

## Selector semantics

Selectra supports CSS structural selectors implemented by `css-select`, including:

- Type, universal, class, ID, and attribute selectors
- Descendant (` `), child (`>`), adjacent sibling (`+`), and general sibling (`~`) combinators
- Selector lists
- Structural pseudo-classes such as `:not()`, `:is()`, `:has()`, `:first-child`, and `:nth-child()`

Pseudo-elements, browser runtime states such as `:hover`, and nonstandard selectors such as `:contains()` are rejected.

Attributes use literal HTML semantics. For example, `.person` matches `class="person"`, but it does not treat JSX `className="person"` as an alias. Template expressions are never executed or inferred.

## Best-effort parsing

Every included file is parsed as a forgiving HTML-like fragment. This works well for HTML and for many markup regions embedded in JSX, Vue, Svelte, Astro, PHP, ERB, and similar files. It is deliberately framework-agnostic, so language-specific constructs can occasionally change the inferred tree or produce false positives/negatives.

Binary files, invalid UTF-8 files, and files over the configured size limit are skipped. Details are written to the **Selectra** output channel.

## Development

```sh
npm install
npm run check
npm test
npm run build
```

Press `F5` in VS Code to launch an Extension Development Host, or create a local VSIX with `npm run package`.

## License

MIT
