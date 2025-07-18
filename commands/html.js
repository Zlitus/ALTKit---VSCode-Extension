const {JSDOM} = require('jsdom');
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

	registerCommand(context, 'altkit.stripHtml', createCommandHandler((text) => {
		const dom = new JSDOM(text);
		const doc = dom.window.document;

		const blockTags = [
			'address', 'article', 'aside', 'blockquote', 'canvas', 'dd', 'div', 'dl', 'dt',
			'fieldset', 'figcaption', 'figure', 'footer', 'form', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
			'header', 'hr', 'li', 'main', 'nav', 'noscript', 'ol', 'p', 'section', 'table', 'tfoot', 'ul', 'video'
		];
		const toRemoveSelector = ['script', 'style', 'head'];
		toRemoveSelector.forEach((selector) => { doc.querySelectorAll(selector).forEach((el) => el.remove()); })

		const preformattedContent = [];
		doc.querySelectorAll('pre').forEach((pre, index) => {
			preformattedContent.push(pre.textContent);
			pre.replaceWith(`__PRE_PLACEHOLDER_${index}__`);
		});

		doc.querySelectorAll('br').forEach(br => br.replaceWith('\n'));
		doc.querySelectorAll(blockTags.join(',')).forEach(el => el.after('\n'));

		let content = doc.body.textContent || '';

		const cleanedLines = [];
		let consecutiveEmptyLines = 0;
		
		const lines = content.split('\n');

		for (const line of lines) {
			const trimmedLine = line.trim();
			
			if (trimmedLine.startsWith('__PRE_PLACEHOLDER_')) {
				cleanedLines.push(trimmedLine);
				consecutiveEmptyLines = 0;
				continue;
			}

			const processedLine = trimmedLine.replace(/\s+/g, ' ');

			if (processedLine === '') {
				consecutiveEmptyLines++;
				if (consecutiveEmptyLines < 2) {
					cleanedLines.push('');
				}
			} else {
				consecutiveEmptyLines = 0;
				cleanedLines.push(processedLine);
			}
		}
		
		let finalContent = cleanedLines.join('\n');

		preformattedContent.forEach((preContent, index) => {
			finalContent = finalContent.replace(`__PRE_PLACEHOLDER_${index}__`, preContent);
		});

		return finalContent.trim();

	}, 'Removes HTML tags from selection, preserving line breaks and preformatted blocks.'));
};

module.exports = {register};
