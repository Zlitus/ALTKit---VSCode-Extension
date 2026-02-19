const vscode = require('vscode');

const commandModules = [
	require('./commands/case'),
	require('./commands/colors'),
	require('./commands/crypto'),
	require('./commands/eval'),
	require('./commands/filters'),
	require('./commands/generateText'),
	require('./commands/html'),
	require('./commands/increment'),
	require('./commands/json'),
	require('./commands/lines'),
	require('./commands/slugify'),
	require('./commands/statusbar'),
	require('./commands/text'),
	require('./commands/time'),
	require('./commands/web'),
];

const registerCommands = context => {
	commandModules.forEach(mod => {
		if (mod.register) {
			mod.register(context);
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
				detail: cmd.command,
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
