const vscode = require('vscode');
const {createCommandHandler, registerCommand} = require('../utils');

const createFilterHandler = ({isRegex, isInclusive, promptMessage, placeHolder}) => {
	return async () => {
		const editor = vscode.window.activeTextEditor;
		if (!editor) {
			vscode.window.showInformationMessage('No active editor to perform filtering on.');
			return;
		}

		const pattern = await vscode.window.showInputBox({
			prompt: promptMessage,
			placeHolder: placeHolder
		});

		if (!pattern) { vscode.window.showInformationMessage('Pattern cannot be empty'); return; }

		let linePredicate;
		if (isRegex) {
			try {
				const regex = new RegExp(pattern);
				linePredicate = line => {
					const match = regex.test(line);
					return isInclusive ? match : !match;
				};
			} catch (e) {
				vscode.window.showErrorMessage(`Invalid regular expression: ${e.message}`);
				return;
			}
		} else {
			linePredicate = line => {
				const match = line.includes(pattern);
				return isInclusive ? match : !match;
			};
		}

		const transformFunction = text => {
			const lines = text.split(/\r?\n/);
			const newText = lines.filter(linePredicate).join('\n');
			return newText;
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
};

const register = context => {
	registerCommand(
		context,
		'altkit.filterLines',
		createFilterHandler({
			isRegex: false,
			isInclusive: true,
			promptMessage: 'Keep lines containing text',
			placeHolder: 'Enter text to match lines'
		}),
		'Filter Lines (Keep matches)'
	);

	registerCommand(
		context,
		'altkit.filterLinesRegex',
		createFilterHandler({
			isRegex: true,
			isInclusive: true,
			promptMessage: 'Keep lines matching regex',
			placeHolder: 'Enter regular expression'
		}),
		'Filter Lines (Keep matches, Regex)'
	);

	registerCommand(
		context,
		'altkit.filterOutLines',
		createFilterHandler({
			isRegex: false,
			isInclusive: false,
			promptMessage: 'Remove lines containing text',
			placeHolder: 'Enter text to match lines'
		}),
		'Filter Out Lines (Remove matches)'
	);

	registerCommand(
		context,
		'altkit.filterOutLinesRegex',
		createFilterHandler({
			isRegex: true,
			isInclusive: false,
			promptMessage: 'Remove lines matching regex',
			placeHolder: 'Enter regular expression'
		}),
		'Filter Out Lines (Remove matches, Regex)'
	);
};

module.exports = {register};
