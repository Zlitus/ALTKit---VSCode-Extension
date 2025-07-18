const vscode = require('vscode');

const commandRegistry = new Map();

const createCommandHandler = (transformation, description) => {
	const handler = () => {
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
	handler.description = description || null;
	return handler;
};

const registerCommand = (context, commandId, handler) => {
	if (handler.description) {
		commandRegistry.set(commandId, handler.description);
	}
	const disposable = vscode.commands.registerCommand(commandId, handler);
	context.subscriptions.push(disposable);
};

const createReplacementHandler = generator => {
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

const createLineCommandHandler = lineTransformation => {
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

const shuffleArray = array => {
	for (let i = array.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[array[i], array[j]] = [array[j], array[i]];
	}
	return array;
};

const generateRandomString = length => {
	const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
	let result = '';
	for (let i = 0; i < length; i++) {
		result += chars.charAt(Math.floor(Math.random() * chars.length));
	}
	return result;
};

module.exports = {
	commandRegistry,
	createCommandHandler,
	registerCommand,
	createReplacementHandler,
	createLineCommandHandler,
	shuffleArray,
	generateRandomString
};
