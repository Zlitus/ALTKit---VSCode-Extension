const vscode = require('vscode');
const {createLineCommandHandler, shuffleArray, registerCommand} = require('../utils');

const register = context => {
	registerCommand(context, 'altkit.sortLinesAsc', createLineCommandHandler(lines => lines.sort(), 'Sorts the selected lines alphabetically.'));
	registerCommand(context, 'altkit.sortLinesDesc', createLineCommandHandler(lines => lines.sort().reverse(), 'Sorts the selected lines in reverse alphabetical order.'));
	registerCommand(context, 'altkit.shuffle', createLineCommandHandler(lines => shuffleArray(lines), 'Shuffles selected lines, words, or letters.'));

	const deduplicateLinesHandler = () => {
		const editor = vscode.window.activeTextEditor;
		if (!editor) return;
		const {document, selections} = editor;

		const processRange = (range, editBuilder) => {
			const text = document.getText(range);
			const lines = text.split(/\r?\n/);
			const uniqueLines = [...new Set(lines)];
			editBuilder.replace(range, uniqueLines.join('\n'));
		};

		editor.edit(editBuilder => {
			if (selections.length === 1 && selections[0].isEmpty) {
				const wholeDocumentRange = new vscode.Range(new vscode.Position(0, 0), new vscode.Position(document.lineCount - 1, document.lineAt(document.lineCount - 1).text.length));
				processRange(wholeDocumentRange, editBuilder);
			} else {
				selections.forEach(selection => {
					if (!selection.isEmpty) processRange(selection, editBuilder);
				});
			}
		});
	};
	registerCommand(context, 'altkit.deduplicateLines', deduplicateLinesHandler, 'Removes duplicate lines from the selection or document.');

	const deduplicateLinesTableHandler = () => {
		const editor = vscode.window.activeTextEditor;
		if (!editor) return;
		const {document, selections} = editor;

		const processText = (text, range) => {
			const lines = text.split(/\r?\n/).filter(line => line.trim() !== '' || text.includes(line));
			if (lines.length === 0) {
				vscode.window.showInformationMessage('No lines to process.');
				return;
			}
			const counts = {};
			for (const line of lines) {
				counts[line] = (counts[line] || 0) + 1;
			}
			const distinctEntries = Object.entries(counts).sort(([, a], [, b]) => b - a);
			const resultText = [
				'Count\tLines', '----------------',
				...distinctEntries.map(([line, count]) => `${count}\t${line}`),
				'----------------',
				`${lines.length} TOTAL LINES`,
				`${distinctEntries.length} DISTINCT LINES`
			].join('\n');
			editor.edit(editBuilder => editBuilder.replace(range, resultText));
		};

		if (selections.length === 1 && selections[0].isEmpty) {
			const range = new vscode.Range(new vscode.Position(0, 0), new vscode.Position(document.lineCount - 1, document.lineAt(document.lineCount - 1).text.length));
			processText(document.getText(range), range);
		} else {
			selections.forEach(selection => {
				if (!selection.isEmpty) processText(document.getText(selection), selection);
			});
		}
	};
	registerCommand(context, 'altkit.deduplicateLinesTable', deduplicateLinesTableHandler, 'Counts line occurrences and displays a summary table.');
};

module.exports = {register};
