# VS Code Extensions

This repository is an npm-workspaces monorepo for independently versioned VS Code extensions.

## Extensions

| Extension | Description | Status |
| --- | --- | --- |
| [Hex2Name](extensions/hex2name) | Convert hex colors to their equivalent or closest HTML color name. | Active |
| [Selectra](extensions/selectra) | Search HTML-like source structurally with CSS selectors. | Active |
| [Comment Formatter for JS/TS](extensions/comment-formatter-js-ts) | Reflow selected JavaScript or TypeScript comment blocks. | Experimental |

The earlier `comment-formatter-js` repository was an unimplemented Hello World scaffold. It is intentionally not included as a workspace; `comment-formatter-js-ts` is its functional successor.

## Development

Install all workspace dependencies from the repository root:

```sh
npm install
```

Common commands run across every extension that provides the corresponding script:

```sh
npm run check
npm run build
npm test
```

Run a command for one extension with npm's workspace flag:

```sh
npm run build --workspace=selectra
npm test --workspace=hex2name
```

Each extension owns its manifest, source, tests, release notes, and publishing configuration under `extensions/<name>`. Dependencies are resolved through the single root `package-lock.json`.
