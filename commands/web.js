const vscode = require('vscode');
const {createCommandHandler} = require('../utils');

const register = context => {
	const disposables = [
		vscode.commands.registerCommand('altkit.urlEncode', createCommandHandler(text => encodeURIComponent(text))),
		vscode.commands.registerCommand('altkit.urlDecode', createCommandHandler(text => decodeURIComponent(text))),
	];

	context.subscriptions.push(...disposables);
};

module.exports = {register};
