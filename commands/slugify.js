const {createCommandHandler, registerCommand} = require('../utils');

const slugifyFunction = text => {
	const a = 'àáâäæãåāăąçćčđďèéêëēėęěğǵḧîïíīįìłḿñńǹňôöòóœøōõőṕŕřßśšşșťțûüùúūǘůűųẃẍÿýžźż·/_,:;';
	const b = 'aaaaaaaaaacccddeeeeeeeegghiiiiiilmnnnnoooooooooprrsssssttuuuuuuuuuwxyyzzz------';
	const p = new RegExp(a.split('').join('|'), 'g');

	return text.toString().toLowerCase()
		.replace(/\s+/g, '-')
		.replace(p, c => b.charAt(a.indexOf(c)))
		.replace(/&/g, '-and-')
		.replace(/[^\w\-]+/g, '')
		.replace(/\-\-+/g, '-')
		.replace(/^-+/, '')
		.replace(/-+$/, '')
	;
};

const register = context => {
	registerCommand(context, 'altkit.slugify', createCommandHandler(slugifyFunction, 'Converts selection to a URL-friendly slug.'));
};

module.exports = {register};
