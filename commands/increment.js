const vscode = require('vscode');
const {registerCommand} = require('../utils');

const incrementHandler = () => {
	const editor = vscode.window.activeTextEditor;
	if (!editor) {
		return;
	}

	const {document, selections} = editor;
	let items;
	let isMultiLineSelection = false;
	let rangeToReplace;

	if (selections.length === 1 && !selections[0].isEmpty) {
		const selection = selections[0];
		const text = document.getText(selection);
		const lines = text.split(/\r?\n/);
		if (lines.filter(l => l.length > 0).length > 1) {
			items = lines;
			isMultiLineSelection = true;
			rangeToReplace = selection;
		}
	}

	if (!isMultiLineSelection && selections.length > 1) {
		items = selections.map(s => document.getText(s));
	}

	if (!items) {
		vscode.window.showInformationMessage('Please make at least two selections or a multi-line selection to use increment.');
		return;
	}

	const letterToNumber = str => {
		let num = 0;
		for (let i = 0; i < str.length; i++) {
			num = num * 26 + (str.charCodeAt(i) - 'a'.charCodeAt(0) + 1);
		}
		return num - 1;
	};
	const numberToLetter = num => {
		let str = '';
		let t;
		while (num >= 0) {
			t = num % 26;
			str = String.fromCharCode(t + 'a'.charCodeAt(0)) + str;
			num = Math.floor(num / 26) - 1;
		}
		return str;
	};

	const firstItem = items[0];

	editor.edit(editBuilder => {
		const asNumber = parseInt(firstItem, 10);
		if (!isNaN(asNumber) && asNumber.toString() === firstItem) {
			const results = items.map((_, i) => `${asNumber + i}`);
			if (isMultiLineSelection) {
				editBuilder.replace(rangeToReplace, results.join('\n'));
			} else {
				selections.forEach((selection, i) => editBuilder.replace(selection, results[i]));
			}
			return;
		}

		if (/^[a-zA-Z]+$/.test(firstItem)) {
			const isUpperCase = firstItem.toUpperCase() === firstItem;
			const startNumber = letterToNumber(firstItem.toLowerCase());
			const results = items.map((_, i) => {
				let result = numberToLetter(startNumber + i);
				return isUpperCase ? result.toUpperCase() : result;
			});

			if (isMultiLineSelection) {
				editBuilder.replace(rangeToReplace, results.join('\n'));
			} else {
				selections.forEach((selection, i) => editBuilder.replace(selection, results[i]));
			}
			return;
		}

		vscode.window.showErrorMessage('Increment requires the first selection/line to be an integer or letters (a-z, A-Z).');
	});
};

const register = context => {
	registerCommand(context, 'altkit.incrementSelection', incrementHandler, 'Increments numbers or letters based on the first selection.');
};

module.exports = {register};
