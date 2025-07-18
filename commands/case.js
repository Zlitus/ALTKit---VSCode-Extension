const {createCommandHandler, registerCommand} = require('../utils');

const register = context => {
	registerCommand(context, 'altkit.toUpperCase', createCommandHandler(text => text.toUpperCase(), 'Converts the selection to uppercase.'));
	registerCommand(context, 'altkit.toLowerCase', createCommandHandler(text => text.toLowerCase(), 'Converts the selection to lowercase.'));
	registerCommand(context, 'altkit.capitalize', createCommandHandler(text => text.replace(/\b\w/g, l => l.toUpperCase()), 'Capitalizes each word in the selection.'));
	registerCommand(context, 'altkit.toCamelCase', createCommandHandler(text => {
		return text.replace(/[\s_-]+(.)?/g, (match, chr) => chr ? chr.toUpperCase() : '').replace(/^\w/, c => c.toLowerCase());
	}, 'Converts selection to camelCase.'));
};

module.exports = {register};
