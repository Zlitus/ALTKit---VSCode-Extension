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

	registerCommand(context, 'altkit.html2markdown', createCommandHandler(text => {
		const dom = new JSDOM(text);
		const doc = dom.window.document;
		doc.querySelectorAll('script, style, head').forEach(el => el.remove());

		const blockTagsList = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'hr', 'pre', 'blockquote', 'ul', 'ol', 'li'];
		const isBlock = (node) => {
			if (node.nodeType !== 1) return false;
			return blockTagsList.includes(node.tagName.toLowerCase());
		};

		const nodeToMarkdown = (node, listMeta = {}) => {
			if (node.nodeType === 3) {
				return node.textContent;
			}
			if (node.nodeType !== 1) {
				return '';
			}

			const tagName = node.tagName.toLowerCase();

			let childrenMarkdown = '';
			const childNodes = Array.from(node.childNodes);
			for (let i = 0; i < childNodes.length; i++) {
				const child = childNodes[i];
				const prevChild = i > 0 ? childNodes[i - 1] : null;
				const childMd = nodeToMarkdown(child, listMeta);

				if (prevChild && !isBlock(prevChild) && !isBlock(child)) {
					if (childrenMarkdown.length > 0 && childMd.length > 0 && !/\s$/.test(childrenMarkdown) && !/^\s/.test(childMd)) {
						 childrenMarkdown += ' ';
					}
				}
				childrenMarkdown += childMd;
			}

			switch (tagName) {
				case 'h1': return `\n\n# ${childrenMarkdown.trim()}\n\n`;
				case 'h2': return `\n\n## ${childrenMarkdown.trim()}\n\n`;
				case 'h3': return `\n\n### ${childrenMarkdown.trim()}\n\n`;
				case 'h4': return `\n\n#### ${childrenMarkdown.trim()}\n\n`;
				case 'h5': return `\n\n##### ${childrenMarkdown.trim()}\n\n`;
				case 'h6': return `\n\n###### ${childrenMarkdown.trim()}\n\n`;
				case 'p': return `\n\n${childrenMarkdown.trim()}\n\n`;
				case 'br': return '  \n';
				case 'hr': return '\n\n---\n\n';
				case 'strong': case 'b': return `**${childrenMarkdown.trim()}**`;
				case 'em': case 'i': return `*${childrenMarkdown.trim()}*`;
				case 'del': case 's': return `~~${childrenMarkdown.trim()}~~`;
				case 'a': {
					const linkText = childrenMarkdown.trim();
					if (!linkText) return '';
					const href = node.getAttribute('href') || '';
					return `[${linkText}](<${href}>)`;
				}
				case 'img': {
					const src = node.getAttribute('src') || '';
					return `![${node.getAttribute('alt') || ''}](<${src}>)`;
				}
				case 'code':
					return node.closest('pre') ? childrenMarkdown : `\`${childrenMarkdown}\``;
				case 'pre': {
					const codeNode = node.querySelector('code');
					const lang = (codeNode?.className.match(/language-(\w+)/) || [])[1] || '';
					return `\n\n\`\`\`${lang}\n${node.textContent}\n\`\`\`\n\n`;
				}
				case 'blockquote':
					return `\n\n> ${childrenMarkdown.trim().replace(/\n/g, '\n> ')}\n\n`;
				case 'ul':
				case 'ol': {
					let listContent = '';
					const isOrdered = tagName === 'ol';
					const parentIsLi = node.parentNode?.tagName.toLowerCase() === 'li';
					Array.from(node.children).forEach((li, index) => {
						if (li.tagName.toLowerCase() !== 'li') return;
						const itemPrefix = isOrdered ? `${index + 1}. ` : '* ';
						const itemContent = Array.from(li.childNodes).map(child => nodeToMarkdown(child, {inList: true})).join('').trim();
						const indentation = parentIsLi ? '  ' : '';
						listContent += `${indentation}${itemPrefix}${itemContent.replace(/\n/g, `\n${indentation}  `)}\n`;
					});
					const finalContent = listContent.trimEnd();
					if (!finalContent) return '';
					return parentIsLi ? `\n${finalContent}` : `\n\n${finalContent}\n\n`;
				}
				case 'li':
					return childrenMarkdown;
				default:
					return childrenMarkdown;
			}
		};

		const markdown = nodeToMarkdown(doc.body);
		return markdown.replace(/\n{3,}/g, '\n\n').trim();
	}, 'Converts HTML to Markdown.'));

	registerCommand(context, 'altkit.markdown2html', createCommandHandler(text => {
		const processInline = (markdown) => {
			return markdown
				.replace(/!\[([^\]]*)\]\((<[^>]*>|[^)]*)\)/g, (match, alt, url) => {
					const finalUrl = url.startsWith('<') && url.endsWith('>') ? url.slice(1, -1) : url;
					return `<img src="${finalUrl}" alt="${alt}">`;
				})
				.replace(/\[([^\]]+)\]\((<[^>]*>|[^)]*)\)/g, (match, text, url) => {
					const finalUrl = url.startsWith('<') && url.endsWith('>') ? url.slice(1, -1) : url;
					return `<a href="${finalUrl}">${text}</a>`;
				})
				.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
				.replace(/\*(.*?)\*/g, '<em>$1</em>')
				.replace(/~~(.*?)~~/g, '<del>$1</del>')
				.replace(/`([^`]+)`/g, '<code>$1</code>');
		};

		const blocks = text.split(/\n\s*\n/);

		const htmlBlocks = blocks.map(block => {
			if (!block) return '';
			if (block.startsWith('```')) {
				const lines = block.split('\n');
				const lang = lines[0].substring(3).trim();
				const langClass = lang ? ` class="language-${lang}"` : '';
				const code = lines.slice(1, -1).join('\n');
				return `<pre><code${langClass}>${code.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</code></pre>`;
			}
			if (/^(\*|-|_){3,}$/.test(block)) {
				return '<hr>';
			}
			if (block.startsWith('#')) {
				const level = block.match(/^#+/)[0].length;
				const content = block.substring(level).trim();
				return `<h${level}>${processInline(content)}</h${level}>`;
			}
			if (block.startsWith('>')) {
				const content = block.split('\n').map(l => l.replace(/^>\s?/, '')).join('<br>');
				return `<blockquote>${processInline(content)}</blockquote>`;
			}
			if (/^\s*([\*\-]|\d+\.) /.test(block)) {
				const lines = block.split('\n');
				const tag = /^\s*\d+\./.test(lines[0]) ? 'ol' : 'ul';
				const items = lines.map(line => {
					const content = line.replace(/^\s*([\*\-]|\d+\.) /, '');
					return `\t<li>${processInline(content)}</li>`;
				}).join('\n');
				return `<${tag}>\n${items}\n</${tag}>`;
			}
			return `<p>${processInline(block)}</p>`;
		});

		return htmlBlocks.join('\n\n').trim();
	}, 'Converts Markdown to HTML.'));
};

module.exports = {register};
