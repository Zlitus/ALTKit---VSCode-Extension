const vscode = require('vscode');
const fs = require('fs');
const path = require('path');
const {commandRegistry} = require('./utils');

const registerCommands = context => {
	const commandsPath = path.join(__dirname, 'commands');

	if (!fs.existsSync(commandsPath)) {
		console.warn(`The 'commands' directory does not exist. No commands will be loaded.`);
		return;
	}

	fs.readdirSync(commandsPath).forEach(file => {
		if (file.endsWith('.js')) {
			try {
				const commandModule = require(path.join(commandsPath, file));
				if (commandModule.register) {
					commandModule.register(context);
				} else {
					 console.warn(`Command file ${file} does not have a 'register' export.`);
				}
			} catch (error) {
				console.error(`Failed to load or register command from ${file}:`, error);
				vscode.window.showErrorMessage(`Failed to load command from ${file}. See debug console for details.`);
			}
		}
	});
};

const activate = context => {
	registerCommands(context);

	const showAllCommandsDisposable = vscode.commands.registerCommand('altkit.showAllCommands', async () => {
		const allCommands = vscode.extensions.getExtension('ArnaudLefort.altkit').packageJSON.contributes.commands;

		const quickPickItems = allCommands
			.filter(cmd => cmd.command !== 'altkit.showAllCommands')
			.map(cmd => ({
				label: cmd.title.replace('ALTKit: ', ''),
				detail: commandRegistry.get(cmd.command) || `Command: ${cmd.command}`,
				commandId: cmd.command
			}))
		;

		const selectedCommand = await vscode.window.showQuickPick(quickPickItems, {
			placeHolder: `Select one of the ${quickPickItems.length} ALTKit commands to run`,
			matchOnDetail: true
		});

		if (selectedCommand) {
			vscode.commands.executeCommand(selectedCommand.commandId);
		}
	});

	context.subscriptions.push(showAllCommandsDisposable);
};

const deactivate = () => {};

module.exports = {
	activate,
	deactivate
};
