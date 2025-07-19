const vscode = require('vscode');
const {createCommandHandler, registerCommand} = require('../utils');

const register = context => {
	registerCommand(context, 'altkit.stripMarkdown', createCommandHandler(text => {
		return text
			.replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1')
			.replace(/(\*\*|__)(.*?)\1/g, '$2')
			.replace(/(\*|_)(.*?)\1/g, '$2')
			.replace(/`{1,3}(.*?)`{1,3}/g, '$1')
			.replace(/^(#+\s*)/gm, '')
			.replace(/^>\s*/gm, '')
			.replace(/^\s*[-*+]\s+/gm, '')
		;
	}, 'Removes Markdown formatting from the selection.'));

	registerCommand(context, 'altkit.cleanText', createCommandHandler(text => {
		return text.replace(/[^\x20-\x7E\n\r\t]/g, '').replace(/\s{2,}/g, ' ').trim();
	}, 'Cleans text by removing non-printable characters and extra whitespace.'));

	registerCommand(context, 'altkit.singleQuote', createCommandHandler(text => `'${text.replace(/'/g, '\\\'')}'`), 'Enquotes the selection in single quotes.');
	registerCommand(context, 'altkit.doubleQuote', createCommandHandler(text => `"${text.replace(/"/g, '\\"')}"`), 'Enquotes the selection in double quotes.');

	const padLines = async ({direction}) => {
		const editor = vscode.window.activeTextEditor;
		if (!editor) { return; }

		const padChar = await vscode.window.showInputBox({prompt: 'Enter the character to pad with (Ex: 0 for numbers)', value: '0'});
		if (!padChar) { return; }

		const lengthStr = await vscode.window.showInputBox({
			prompt: 'Enter the total length of the line after padding',
			value: 4,
			validateInput: text => { return /^\d+$/.test(text) ? null : 'Please enter a valid number.'; }
		});
		if (!lengthStr) { return; }
		const targetLength = parseInt(lengthStr, 10);

		const transformFunction = text => {
			const lines = text.split(/\r?\n/);
			const padMethod = direction === 'left' ? 'padStart' : 'padEnd';
			return lines.map(line => line[padMethod](targetLength, padChar)).join('\n');
		};

		const hasSelection = editor.selections.some(s => !s.isEmpty);

		if (hasSelection) {
			const selectionHandler = createCommandHandler(transformFunction);
			selectionHandler();
		} else {
			const fullRange = new vscode.Range(new vscode.Position(0, 0), editor.document.lineAt(editor.document.lineCount - 1).range.end);
			const fullText = editor.document.getText(fullRange);
			const newText = transformFunction(fullText);
			await editor.edit(editBuilder => {
				editBuilder.replace(fullRange, newText);
			});
		}
	};

	registerCommand(context, 'altkit.padLeft', () => padLines({direction: 'left'}), 'Pad lines to the left');
	registerCommand(context, 'altkit.padRight', () => padLines({direction: 'right'}), 'Pad lines to the right');
};

module.exports = {register};
