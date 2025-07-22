import * as vscode from 'vscode';
import { findHexReplacements } from './color-utils';

export function activate(context: vscode.ExtensionContext) {
	const cmd = 'extension.hexToColorName';
	const disposable = vscode.commands.registerCommand(cmd, async () => {
		const editor = vscode.window.activeTextEditor;
		if (!editor) { return; }

		const { document, selection } = editor;
		const isSelection = !selection.isEmpty;
		const textRange = isSelection ? selection : new vscode.Range(document.positionAt(0), document.positionAt(document.getText().length));
		const text = document.getText(textRange);
		const offset = isSelection ? document.offsetAt(selection.start) : 0;

		const replacements = findHexReplacements(text);

		if (replacements.length === 0) {
			vscode.window.showInformationMessage('No hex codes found.');
			return;
		}

		await editor.edit(editBuilder => {
			for (const r of replacements) {
				const startPos = document.positionAt(offset + r.index);
				const endPos = document.positionAt(offset + r.index + r.originalText.length);
				editBuilder.replace(new vscode.Range(startPos, endPos), r.newText);
			}
		});


		vscode.window.setStatusBarMessage(`🌈Hex2Name: Replaced ${replacements.length} hex code(s)`, 5000);
	});

	context.subscriptions.push(disposable);
}

export function deactivate() { }