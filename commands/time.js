const vscode = require('vscode');
const {createCommandHandler, createReplacementHandler} = require('../utils');

const register = context => {
	const disposables = [
		vscode.commands.registerCommand('altkit.insertTimestamp', createReplacementHandler(() => `${Math.floor(Date.now() / 1000)}`)),
		vscode.commands.registerCommand('altkit.insertMilliTimestamp', createReplacementHandler(() => `${Date.now()}`)),
		vscode.commands.registerCommand('altkit.timestampToDate', createCommandHandler(text => {
			const timestamp = parseInt(text, 10);
			if (isNaN(timestamp)) throw new Error('Selection is not a valid timestamp.');
			const date = new Date(timestamp * (timestamp > 1000000000000 ? 1 : 1000));
			return date.toUTCString();
		})),
		vscode.commands.registerCommand('altkit.dateToTimestamp', createCommandHandler(text => {
			const date = new Date(text);
			if (isNaN(date.getTime())) throw new Error('Could not parse the selected text as a valid date.');
			return `${Math.floor(date.getTime() / 1000)}`;
		}))
	];

	context.subscriptions.push(...disposables);
};

module.exports = {register};
