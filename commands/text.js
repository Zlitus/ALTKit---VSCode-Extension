const {createCommandHandler, registerCommand} = require('../utils');

const register = context => {
	registerCommand(context, 'altkit.stripMarkdown', createCommandHandler(text => {
		return text
			.replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1')
			.replace(/(\*\*|__)(.*?)\1/g, '$2')
			.replace(/(\*|_)(.*?)\1/g, '$2')
			.replace(/`{1,3}(.*?)`{1,3}/g, '$1')
			.replace(/^(#+\s*)/gm, '')
			.replace(/^>\s*/gm, '')
			.replace(/^\s*[-*+]\s+/gm, '')
		;
	}, 'Removes Markdown formatting from the selection.'));

	registerCommand(context, 'altkit.cleanText', createCommandHandler(text => {
		return text.replace(/[^\x20-\x7E\n\r\t]/g, '').replace(/\s{2,}/g, ' ').trim();
	}, 'Cleans text by removing non-printable characters and extra whitespace.'));

	registerCommand(context, 'altkit.singleQuote', createCommandHandler(text => `'${text.replace(/'/g, '\\\'')}'`), 'Enquotes the selection in single quotes.');
	registerCommand(context, 'altkit.doubleQuote', createCommandHandler(text => `"${text.replace(/"/g, '\\"')}"`), 'Enquotes the selection in double quotes.');
};

module.exports = {register};
