const {createCommandHandler, registerCommand} = require('../utils');

const register = context => {
	registerCommand(context, 'altkit.eval', createCommandHandler(text => {
		let vm;
		try { vm = require('vm'); } catch (err) { return `Error: ${err.message}`; }

		try {
			const result = vm.runInNewContext(text, {}, {timeout: 5000});
			return result;
		} catch (err) {
			return `Error: ${err.message}`;
		}
	}, 'Evaluates the selected JavaScript code.'));
};

module.exports = {register};
