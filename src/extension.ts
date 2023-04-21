import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
	let disposable = vscode.commands.registerCommand('commentFormatterJS.format', async () => {
		const editor = vscode.window.activeTextEditor;
		if (!editor) {
			vscode.window.showInformationMessage('No active editor found.');
			return;
		}

		const selection = editor.selection;
		if (selection.isEmpty) {
			vscode.window.showInformationMessage('No comment block is selected.');
			return;
		}

		const selectedText = editor.document.getText(selection);
		const config = vscode.workspace.getConfiguration('commentFormatterJS');
		const formattingStyle = config.get<string>('formattingStyle') || 'lengthen';
		const printWidthVariance = config.get<number>('printWidthVariance') || 8;

		try {
			const formattedText = formatCommentBlock(selectedText, formattingStyle, printWidthVariance);
			await editor.edit(editBuilder => {
				editBuilder.replace(selection, formattedText);
			});
			vscode.window.showInformationMessage('Comment block formatted successfully.');
		} catch (error: any) {
			vscode.window.showErrorMessage(error.message);
		}
	});

	context.subscriptions.push(disposable);
}

export function deactivate() { }

function formatCommentBlock(text: string, formattingStyle: string, printWidthVariance: number): string {
	const regexSingleLine = /^\/\/(.+)/gm;
	const regexMultiLine = /^\/\*(.|\s)*?\*\/$/;

	if (!regexSingleLine.test(text) && !regexMultiLine.test(text)) {
		throw new Error('Invalid comment block selected.');
	}
	const lines = text.split('\n');

	// Determine the print width
	const printWidth = formattingStyle === 'lengthen'
		? Math.max(...lines.map(line => line.length)) - printWidthVariance
		: Math.min(...lines.map(line => line.length)) + printWidthVariance;

	// Format the comment block
	const formattedLines = [];
	let currentLine = '';
	const prefix = lines[0].startsWith('//') ? '// ' : ' * ';

	for (const line of lines) {
		const words = line.trim().replace(/^\/\/|\/*|*\/|* /, '').trim().split(' ');
	for (const word of words) {
			if ((currentLine.length + word.length + 1) <= printWidth) {
				currentLine += (currentLine ? ' ' : '') + word;
			} else {
				formattedLines.push(prefix + currentLine);
				currentLine = word;
			}
		}
	}

	if (currentLine) {
		formattedLines.push(prefix + currentLine);
	}

	// Add start and end for multiline comments
	if (regexMultiLine.test(text)) {
		formattedLines.unshift('/*');
		formattedLines.push(' */');
	}

	return formattedLines.join('\n');
}

// // The module 'vscode' contains the VS Code extensibility API
// // Import the module and reference it with the alias vscode in your code below
// import * as vscode from 'vscode';

// // This method is called when your extension is activated
// // Your extension is activated the very first time the command is executed
// export function activate(context: vscode.ExtensionContext) {

// 	// Use the console to output diagnostic information (console.log) and errors (console.error)
// 	// This line of code will only be executed once when your extension is activated
// 	console.log('Congratulations, your extension "comment-formatter-js-ts" is now active!');

// 	// The command has been defined in the package.json file
// 	// Now provide the implementation of the command with registerCommand
// 	// The commandId parameter must match the command field in package.json
// 	let disposable = vscode.commands.registerCommand('comment-formatter-js-ts.helloWorld', () => {
// 		// The code you place here will be executed every time your command is executed
// 		// Display a message box to the user
// 		vscode.window.showInformationMessage('Hello World from comment-formatter-js-ts!');
// 	});

// 	context.subscriptions.push(disposable);
// }

// // This method is called when your extension is deactivated
// export function deactivate() {}
