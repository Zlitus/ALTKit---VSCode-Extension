const {createCommandHandler, registerCommand} = require('../utils');

const register = context => {
	registerCommand(context, 'altkit.htmlDeentities', createCommandHandler(text => {
		return text.replace(/&lt;/g, '<')
			.replace(/&gt;/g, '>')
			.replace(/&amp;/g, '&')
			.replace(/&quot;/g, '"')
			.replace(/&apos;/g, "'")
			.replace(/&#(\d+);/g, (match, dec) => String.fromCharCode(dec))
		;
	}, 'Converts HTML entities to characters.'));

	registerCommand(context, 'altkit.stripHtml', createCommandHandler(text => text.replace(/<[^>]*>/g, ''), 'Removes HTML tags from selection.'));
};

module.exports = {register};
