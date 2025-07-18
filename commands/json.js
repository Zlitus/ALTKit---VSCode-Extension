const {createCommandHandler, registerCommand} = require('../utils');

const register = context => {
	registerCommand(context, 'altkit.jsonMinify', createCommandHandler(text => {
		try {
			return JSON.stringify(JSON.parse(text));
		} catch (e) {
			throw new Error('Invalid JSON selected.');
		}
	}, 'Minifies the selected JSON.'));

	registerCommand(context, 'altkit.jsonPrettify', createCommandHandler(text => {
		try {
			return JSON.stringify(JSON.parse(text), null, '\t');
		} catch (e) {
			throw new Error('Invalid JSON selected.');
		}
	}, 'Formats the selected JSON nicely.'));
};

module.exports = {register};
