const vscode = require('vscode');
const {registerCommand} = require('../utils');

let statusBarItem;
let isStatusBarVisible = false;

const updateStatusBar = () => {
	if (!isStatusBarVisible) {
		if (statusBarItem) statusBarItem.hide();
		return;
	}

	const editor = vscode.window.activeTextEditor;
	if (!editor || editor.selections.every(s => s.isEmpty)) {
		if (statusBarItem) statusBarItem.hide();
		return;
	}

	let totalLines = 0;
	let totalWords = 0;
	const allFigures = [];

	editor.selections.forEach(selection => {
		if (selection.isEmpty) return;
		const text = editor.document.getText(selection);
		totalLines += text.split(/\r?\n/).length;
		totalWords += (text.match(/\S+/g) || []).length;
		const figuresInSelection = text.match(/-?\d+(\.\d+)?/g);
		if (figuresInSelection) {
			allFigures.push(...figuresInSelection.map(Number));
		}
	});

	let statsText = `Lines: ${totalLines} | Words: ${totalWords}`;

	if (allFigures.length > 0) {
		const figureCount = allFigures.length;
		const sum = allFigures.reduce((a, b) => a + b, 0);
		const avg = sum / figureCount;
		const min = Math.min(...allFigures);
		const max = Math.max(...allFigures);
		statsText += ` | Figures: ${figureCount} | Sum: ${sum.toFixed(2)} | Avg: ${avg.toFixed(2)} | Min: ${min} | Max: ${max}`;
	}

	statusBarItem.text = `$(symbol-ruler) ${statsText}`;
	statusBarItem.tooltip = 'ALTKit Selection Stats';
	statusBarItem.show();
};

const register = context => {
	statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);

	const toggleStatusBarHandler = () => {
		isStatusBarVisible = !isStatusBarVisible;
		updateStatusBar();
	};

	registerCommand(context, 'altkit.toggleStatusBar', toggleStatusBarHandler, 'Shows/hides selection stats in the status bar.');

	const onSelectionChangeDisposable = vscode.window.onDidChangeTextEditorSelection(updateStatusBar);
	const onEditorChangeDisposable = vscode.window.onDidChangeActiveTextEditor(updateStatusBar);

	context.subscriptions.push(
		statusBarItem,
		onSelectionChangeDisposable,
		onEditorChangeDisposable
	);
};

module.exports = {register};
