const fs = require('fs');
const path = require('path');
const Module = require('module');

process.env.ALTKIT_GEN_MODE = 'true';

const commandsDir = path.join(__dirname, '..', 'commands');
const packageJsonPath = path.join(__dirname, '..', 'package.json');

const originalRequire = Module.prototype.require;
Module.prototype.require = function(request) {
	if (request === 'vscode') {
		return {
			window: {createStatusBarItem: () => ({show: () => {}, hide: () => {}})},
			StatusBarAlignment: {Left: 1},
			Range: function() {},
			Position: function() {},
		};
	}
	return originalRequire.apply(this, arguments);
};

const extractCommands = () => {
	try {
		const files = fs.readdirSync(commandsDir);
		const mockContext = {subscriptions: []};

		for (const file of files) {
			if (path.extname(file) === '.js') {
				const filePath = path.join(commandsDir, file);
				try {
					const commandModule = require(filePath);
					if (commandModule.register) {
						commandModule.register(mockContext);
					}
				} catch (e) {
					console.error(`Error processing file ${file}:`, e);
				}
			}
		}
	} catch (error) {
		console.error('Error reading commands directory:', error);
		process.exit(1);
	}

	Module.prototype.require = originalRequire;
	return global.altkitCommands || [];
};

const updatePackageJson = () => {
	const newCommands = extractCommands();

	if (newCommands.length === 0) {
		console.log('No commands found. Please check that command files use the `registerCommand` helper.');
		return;
	}

	try {
		const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));

		const staticCommands = packageJson.contributes.commands.filter(c =>
			c.command === 'altkit.showAllCommands'
		);

		const commandObjects = newCommands.map(cmd => ({
			command: cmd.command,
			title: `ALTKit: ${cmd.description.replace(/\.$/, '')}`
		}));

		commandObjects.sort((a, b) => a.title.localeCompare(b.title));

		packageJson.contributes.commands = [...staticCommands, ...commandObjects];

		fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, '\t'));

		console.log(`Successfully updated package.json with ${newCommands.length} commands.`);
	} catch (error) {
		console.error('Error updating package.json:', error);
		process.exit(1);
	}
};

updatePackageJson();
