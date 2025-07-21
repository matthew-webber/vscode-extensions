import * as vscode from 'vscode';
// @ts-ignore
import cssColorNames from 'css-color-names';

interface RGB { r: number; g: number; b: number; }

function hexToRgb(hex: string): RGB {
	const bigint = parseInt(hex.slice(1), 16);
	return {
		r: (bigint >> 16) & 255,
		g: (bigint >> 8) & 255,
		b: bigint & 255
	};
}

function closestColorName(hex: string): string {
	const target = hexToRgb(hex);
	let best = { name: 'black', dist: Infinity };
	for (const [name, val] of Object.entries(cssColorNames)) {
		const c = hexToRgb(val as string);
		const d = (c.r - target.r) ** 2 + (c.g - target.g) ** 2 + (c.b - target.b) ** 2;
		if (d < best.dist) { best = { name, dist: d }; }
	}
	return best.name;
}

export function activate(context: vscode.ExtensionContext) {
	const cmd = 'extension.hexToCssName';
	const disposable = vscode.commands.registerCommand(cmd, async () => {
		const editor = vscode.window.activeTextEditor;
		if (!editor) { return; }
		const doc = editor.document;
		const sel = editor.selection;
		const fullText = sel.isEmpty
			? doc.getText()
			: doc.getText(sel);

		// compute offset of selection start in document
		const offset = sel.isEmpty
			? 0
			: doc.offsetAt(sel.start);

		let regex = /#([0-9A-Fa-f]{6})\b/g;
		// update regex to match 3-digit hex codes as well
		regex = /#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})\b/g;
		const edits: { range: vscode.Range; newText: string }[] = [];

		for (const match of fullText.matchAll(regex)) {
			let hex = match[0];
			const originalLength = hex.length; // Store original length
			console.log('Found hex code:', hex);
			if (hex.length !== 7 && hex.length !== 4) {
				continue; // skip if not a valid hex code
			} else if (hex.length === 4) {
				// convert 3-digit hex to 6-digit hex
				const r = hex[1], g = hex[2], b = hex[3];
				hex = `#${r}${r}${g}${g}${b}${b}`;
			}
			const colorName = closestColorName(hex);
			const startIdx = offset + (match.index ?? 0);
			const startPos = doc.positionAt(startIdx);
			const endPos = doc.positionAt(startIdx + originalLength); // Use original length
			console.log('Replacing hex code:', hex, 'with color name:', colorName);
			edits.push({
				range: new vscode.Range(startPos, endPos),
				newText: colorName
			});
		}

		if (edits.length === 0) {
			vscode.window.showInformationMessage('No hex codes found.');
			return;
		}

		await editor.edit(editBuilder => {
			for (const e of edits) {
				editBuilder.replace(e.range, e.newText);
			}
		});
		vscode.window.showInformationMessage(`Replaced ${edits.length} hex codes.`);
	});

	context.subscriptions.push(disposable);
}

export function deactivate() { }