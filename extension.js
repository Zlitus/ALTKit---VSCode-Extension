const vscode = require('vscode');
const crypto = require('crypto');

const createCommandHandler = (transformation) => {
	return () => {
		const editor = vscode.window.activeTextEditor;
		if (editor) {
			const {document, selections} = editor;
			editor.edit(editBuilder => {
				selections.forEach(selection => {
					if (selection.isEmpty) return;
					const selectedText = document.getText(selection);
					try {
						const result = transformation(selectedText);
						editBuilder.replace(selection, `${result}`);
					} catch (error) {
						vscode.window.showErrorMessage(error.message);
					}
				});
			});
		}
	};
};

const createReplacementHandler = (generator) => {
	return () => {
		const editor = vscode.window.activeTextEditor;
		if (editor) {
			editor.edit(editBuilder => {
				editor.selections.forEach(selection => {
					editBuilder.replace(selection, generator());
				});
			});
		}
	};
};

const createLineCommandHandler = (lineTransformation) => {
	return () => {
		const editor = vscode.window.activeTextEditor;
		if (editor) {
			const {document, selections} = editor;
			editor.edit(editBuilder => {
				selections.forEach(selection => {
					if (selection.isEmpty) return;
					const selectedText = document.getText(selection);
					const lines = selectedText.split(/\r?\n/);
					const result = lineTransformation(lines).join('\n');
					editBuilder.replace(selection, result);
				});
			});
		}
	};
};

const shuffleArray = (array) => {
	for (let i = array.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[array[i], array[j]] = [array[j], array[i]];
	}
	return array;
};

const generateRandomString = (length) => {
	const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
	let result = '';
	for (let i = 0; i < length; i++) {
		result += chars.charAt(Math.floor(Math.random() * chars.length));
	}
	return result;
};

const activate = (context) => {
	let statusBarItem;
	let isStatusBarVisible = false;

	const updateStatusBar = () => {
		if (!isStatusBarVisible) {
			statusBarItem.hide();
			return;
		}

		const editor = vscode.window.activeTextEditor;
		if (!editor || editor.selections.every(s => s.isEmpty)) {
			statusBarItem.hide();
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

		let statsText = `NbLines: ${totalLines} | NbWords: ${totalWords}`;

		if (allFigures.length > 0) {
			const figureCount = allFigures.length;
			const sum = allFigures.reduce((a, b) => a + b, 0);
			const avg = sum / figureCount;
			const min = Math.min(...allFigures);
			const max = Math.max(...allFigures);
			statsText += ` | NbFigures: ${figureCount} | Sum: ${sum.toFixed(2)} | Avg: ${avg.toFixed(2)} | Min: ${min} | Max: ${max}`;
		}

		statusBarItem.text = `$(symbol-ruler) ${statsText}`;
		statusBarItem.tooltip = 'ALTKit Selection Stats';
		statusBarItem.show();
	};

	const timestampToDateDisposable = vscode.commands.registerCommand('altkit.timestampToDate', createCommandHandler(text => {
		const timestamp = parseInt(text, 10);
		if (isNaN(timestamp)) throw new Error('Selection is not a valid timestamp.');
		const date = new Date(timestamp * (timestamp > 1000000000000 ? 1 : 1000));
		return date.toUTCString();
	}));

	const dateToTimestampDisposable = vscode.commands.registerCommand('altkit.dateToTimestamp', createCommandHandler(text => {
		const date = new Date(text);
		if (isNaN(date.getTime())) throw new Error('Could not parse the selected text as a valid date.');
		return Math.floor(date.getTime() / 1000);
	}));

	const deduplicateLinesDisposable = vscode.commands.registerCommand('altkit.deduplicateLines', () => {
		const editor = vscode.window.activeTextEditor;
		if (editor) {
			const {document, selections} = editor;
			if (selections.length === 1 && selections[0].isEmpty) {
				const wholeDocumentRange = new vscode.Range(new vscode.Position(0, 0), new vscode.Position(document.lineCount - 1, document.lineAt(document.lineCount - 1).text.length));
				const text = document.getText(wholeDocumentRange);
				const lines = text.split(/\r?\n/);
				const uniqueLines = [...new Set(lines)];
				const resultText = uniqueLines.join('\n');
				editor.edit(editBuilder => {
					editBuilder.replace(wholeDocumentRange, resultText);
				});
				return;
			}
			editor.edit(editBuilder => {
				selections.forEach(selection => {
					if (selection.isEmpty) return;
					const text = document.getText(selection);
					const lines = text.split(/\r?\n/);
					const uniqueLines = [...new Set(lines)];
					const resultText = uniqueLines.join('\n');
					editBuilder.replace(selection, resultText);
				});
			});
		}
	});

	const deduplicateLinesTableDisposable = vscode.commands.registerCommand('altkit.deduplicateLinesTable', () => {
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
	});
	
	const shuffleDisposable = vscode.commands.registerCommand('altkit.shuffle', createCommandHandler(text => {
		if (text.includes('\n')) {
			return shuffleArray(text.split(/\r?\n/)).join('\n');
		}
		if (text.includes(' ')) {
			return shuffleArray(text.split(' ')).join(' ');
		}
		return shuffleArray(text.split('')).join('');
	}));

	const toCamelCaseDisposable = vscode.commands.registerCommand('altkit.toCamelCase', createCommandHandler(text => {
		return text.replace(/[\s_-]+(.)?/g, (match, chr) => chr ? chr.toUpperCase() : '').replace(/^\w/, c => c.toLowerCase());
	}));

	const htmlDeentitiesDisposable = vscode.commands.registerCommand('altkit.htmlDeentities', createCommandHandler(text => {
		return text.replace(/&lt;/g, '<')
			.replace(/&gt;/g, '>')
			.replace(/&amp;/g, '&')
			.replace(/&quot;/g, '"')
			.replace(/&apos;/g, "'")
			.replace(/&#(\d+);/g, (match, dec) => String.fromCharCode(dec));
	}));

	const stripHtmlDisposable = vscode.commands.registerCommand('altkit.stripHtml', createCommandHandler(text => text.replace(/<[^>]*>/g, '')));
	const randomString15Disposable = vscode.commands.registerCommand('altkit.randomString15', createReplacementHandler(() => generateRandomString(15)));
	const randomString30Disposable = vscode.commands.registerCommand('altkit.randomString30', createReplacementHandler(() => generateRandomString(30)));
	const evalDisposable = vscode.commands.registerCommand('altkit.eval', createCommandHandler(text => eval(text)));
	const base64EncodeDisposable = vscode.commands.registerCommand('altkit.base64Encode', createCommandHandler(text => Buffer.from(text).toString('base64')));
	const base64DecodeDisposable = vscode.commands.registerCommand('altkit.base64Decode', createCommandHandler(text => Buffer.from(text, 'base64').toString('utf8')));
	const md5Disposable = vscode.commands.registerCommand('altkit.md5', createCommandHandler(text => crypto.createHash('md5').update(text).digest('hex')));
	const sha1Disposable = vscode.commands.registerCommand('altkit.sha1', createCommandHandler(text => crypto.createHash('sha1').update(text).digest('hex')));
	const sha256Disposable = vscode.commands.registerCommand('altkit.sha256', createCommandHandler(text => crypto.createHash('sha256').update(text).digest('hex')));
	const toUpperCaseDisposable = vscode.commands.registerCommand('altkit.toUpperCase', createCommandHandler(text => text.toUpperCase()));
	const toLowerCaseDisposable = vscode.commands.registerCommand('altkit.toLowerCase', createCommandHandler(text => text.toLowerCase()));
	const capitalizeDisposable = vscode.commands.registerCommand('altkit.capitalize', createCommandHandler(text => text.replace(/\b\w/g, l => l.toUpperCase())));
	const sortLinesAscDisposable = vscode.commands.registerCommand('altkit.sortLinesAsc', createLineCommandHandler(lines => lines.sort()));
	const sortLinesDescDisposable = vscode.commands.registerCommand('altkit.sortLinesDesc', createLineCommandHandler(lines => lines.sort().reverse()));
	const urlEncodeDisposable = vscode.commands.registerCommand('altkit.urlEncode', createCommandHandler(text => encodeURIComponent(text)));
	const urlDecodeDisposable = vscode.commands.registerCommand('altkit.urlDecode', createCommandHandler(text => decodeURIComponent(text)));
	const jsonMinifyDisposable = vscode.commands.registerCommand('altkit.jsonMinify', createCommandHandler(text => JSON.stringify(JSON.parse(text))));
	const jsonPrettyDisposable = vscode.commands.registerCommand('altkit.jsonPretty', createCommandHandler(text => JSON.stringify(JSON.parse(text), null, '\t')));

	statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
	const toggleStatusBarDisposable = vscode.commands.registerCommand('altkit.toggleStatusBar', () => {
		isStatusBarVisible = !isStatusBarVisible;
		updateStatusBar();
	});

	const onSelectionChangeDisposable = vscode.window.onDidChangeTextEditorSelection(updateStatusBar);
	const onEditorChangeDisposable = vscode.window.onDidChangeActiveTextEditor(updateStatusBar);

	const showAllCommandsDisposable = vscode.commands.registerCommand('altkit.showAllCommands', async () => {
		const commands = [
			{label: 'Toggle Selection Stats in Status Bar', detail: 'Shows/hides selection stats in the status bar.', commandId: 'altkit.toggleStatusBar'},
			{label: 'Shuffle', detail: 'Shuffles selected lines, words, or letters.', commandId: 'altkit.shuffle'},
			{label: 'Eval JavaScript', detail: 'Evaluates the selected JavaScript code.', commandId: 'altkit.eval'},
			{label: 'JSON Minify', detail: 'Minifies the selected JSON.', commandId: 'altkit.jsonMinify'},
			{label: 'JSON Prettify', detail: 'Formats the selected JSON nicely.', commandId: 'altkit.jsonPretty'},
			{label: 'To Camel Case', detail: 'Converts selection to camelCase.', commandId: 'altkit.toCamelCase'},
			{label: 'HTML De-entities', detail: 'Converts HTML entities to characters.', commandId: 'altkit.htmlDeentities'},
			{label: 'Strip HTML', detail: 'Removes HTML tags from selection.', commandId: 'altkit.stripHtml'},
			{label: 'Random String (15 chars)', detail: 'Replaces selection with a random 15-character string.', commandId: 'altkit.randomString15'},
			{label: 'Random String (30 chars)', detail: 'Replaces selection with a random 30-character string.', commandId: 'altkit.randomString30'},
			{label: 'Convert Timestamp to Date', detail: 'Converts a selected Unix timestamp to a UTC date string.', commandId: 'altkit.timestampToDate'},
			{label: 'Convert Date to Timestamp', detail: 'Converts a selected date string to a Unix timestamp.', commandId: 'altkit.dateToTimestamp'},
			{label: 'Base64 Encode', detail: 'Encodes the selection to Base64.', commandId: 'altkit.base64Encode'},
			{label: 'Base64 Decode', detail: 'Decodes the Base64 selection.', commandId: 'altkit.base64Decode'},
			{label: 'URL Encode', detail: 'URL-encodes the selection.', commandId: 'altkit.urlEncode'},
			{label: 'URL Decode', detail: 'URL-decodes the selection.', commandId: 'altkit.urlDecode'},
			{label: 'MD5 Hash', detail: 'Computes the MD5 hash of the selection.', commandId: 'altkit.md5'},
			{label: 'SHA1 Hash', detail: 'Computes the SHA1 hash of the selection.', commandId: 'altkit.sha1'},
			{label: 'SHA256 Hash', detail: 'Computes the SHA256 hash of the selection.', commandId: 'altkit.sha256'},
			{label: 'To Upper Case', detail: 'Converts the selection to uppercase.', commandId: 'altkit.toUpperCase'},
			{label: 'To Lower Case', detail: 'Converts the selection to lowercase.', commandId: 'altkit.toLowerCase'},
			{label: 'Capitalize', detail: 'Capitalizes each word in the selection.', commandId: 'altkit.capitalize'},
			{label: 'Sort Lines (Ascending)', detail: 'Sorts the selected lines alphabetically.', commandId: 'altkit.sortLinesAsc'},
			{label: 'Sort Lines (Descending)', detail: 'Sorts the selected lines in reverse alphabetical order.', commandId: 'altkit.sortLinesDesc'},
			{label: 'De-duplicate uniq Lines', detail: 'Removes duplicate lines from the selection or document.', commandId: 'altkit.deduplicateLines'},
			{label: 'De-duplicate uniq Lines (Table view)', detail: 'Counts line occurrences and displays a summary table.', commandId: 'altkit.deduplicateLinesTable'}
		];

		const selectedCommand = await vscode.window.showQuickPick(commands, {
			placeHolder: 'Select an ALTKit command to run',
			matchOnDetail: true
		});

		if (selectedCommand) {
			vscode.commands.executeCommand(selectedCommand.commandId);
		}
	});

	context.subscriptions.push(
		timestampToDateDisposable, dateToTimestampDisposable, deduplicateLinesDisposable,
		deduplicateLinesTableDisposable, evalDisposable, base64EncodeDisposable,
		base64DecodeDisposable, md5Disposable, sha1Disposable, sha256Disposable,
		toUpperCaseDisposable, toLowerCaseDisposable, capitalizeDisposable,
		sortLinesAscDisposable, sortLinesDescDisposable, urlEncodeDisposable,
		urlDecodeDisposable, jsonMinifyDisposable, jsonPrettyDisposable,
		showAllCommandsDisposable, toggleStatusBarDisposable, statusBarItem,
		onSelectionChangeDisposable, onEditorChangeDisposable, shuffleDisposable,
		toCamelCaseDisposable, htmlDeentitiesDisposable, stripHtmlDisposable,
		randomString15Disposable, randomString30Disposable
	);
};

const deactivate = () => {};

module.exports = {
	activate,
	deactivate
};
