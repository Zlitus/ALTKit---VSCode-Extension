const vscode = require('vscode');
const {createCommandHandler, registerCommand} = require('../utils');

const prettifyCSS = (text) => {
	const status = {
		indent: 0,
		inBlockComment: false,
		inString: false,
		quoteType: '',
		inRuleBlock: false,
		inPropertyValue: false,
		inCalc: false,
		inAtRuleParen: false,
	};

	let output = '';
	let i = 0;

	const applyIndent = () => '\t'.repeat(status.indent);

	const isNestedSelectorAhead = (startIndex) => {
		let j = startIndex;
		while (j < text.length) {
			const charAhead = text[j];
			if (charAhead === '{') return true;
			if (charAhead === ';' || charAhead === '}') return false;
			j++;
		}
		return false;
	};

	while (i < text.length) {
		const char = text[i];
		const nextChar = text[i + 1];
		const prevChar = i > 0 ? text[i - 1] : '';

		if (char === '(' && !status.inRuleBlock && !status.inString && !status.inPropertyValue) {
			status.inAtRuleParen = true;
		}
		if (char === ')' && !status.inString) {
			status.inAtRuleParen = false;
		}

		if (status.inBlockComment) {
			if (char === '*' && nextChar === '/') {
				output += '*/';
				status.inBlockComment = false;
				i += 2;
			} else {
				output += char;
				i++;
			}
			continue;
		}

		if (status.inString) {
			output += char;
			if (char === status.quoteType && prevChar !== '\\') {
				status.inString = false;
			}
			i++;
			continue;
		}

		if (char === '/' && nextChar === '*') {
			output = output.trimEnd();
			if (output.length && !output.endsWith('\n')) {
				output += `\n${applyIndent()}`;
			}
			output += '/*';
			status.inBlockComment = true;
			i += 2;
			continue;
		}

		if (char === `'` || char === `"`) {
			if (output.endsWith('\n')) {
				output += applyIndent();
			}
			status.inString = true;
			status.quoteType = char;
			output += char;
			i++;
			continue;
		}

		if (char === '{') {
			output = output.trimEnd();
			output += ' {\n';
			status.indent++;
			status.inRuleBlock = true;
			status.inAtRuleParen = false;
			i++;
			while (/\s/.test(text[i])) i++;
			continue;
		}

		if (char === '}') {
			output = output.trimEnd();
			if (!output.endsWith('\n')) {
				output += '\n';
			}
			status.indent--;
			status.inRuleBlock = false;
			status.inPropertyValue = false;
			status.inCalc = false;
			output += `${applyIndent()}}`;
			i++;
			while (/\s/.test(text[i])) i++;
			if (text[i]) {
				output += '\n';
			}
			continue;
		}

		if (char === ';') {
			output = output.trimEnd();
			if (!output.endsWith(';')) {
				output += ';\n';
			}
			status.inPropertyValue = false;
			status.inCalc = false;
			i++;
			while (/\s/.test(text[i])) i++;
			continue;
		}

		if (char === ',') {
			output = output.trimEnd() + ', ';
			i++;
			while (/\s/.test(text[i])) i++;
			continue;
		}

		if (char === ':') {
			output = output.trimEnd();
			if ((status.inRuleBlock && !isNestedSelectorAhead(i + 1)) || status.inAtRuleParen) {
				output += ': ';
				status.inPropertyValue = true;
			} else {
				output += ':';
			}
			i++;
			while (/\s/.test(text[i])) i++;
			continue;
		}

		if (status.inPropertyValue) {
			if (text.substring(i).toLowerCase().startsWith('calc(')) {
				status.inCalc = true;
			}

			if (char === ')' && status.inCalc) {
				status.inCalc = false;
			}

			if (status.inCalc && '+-*/'.includes(char)) {
				if (char === '-' && nextChar === '-') {
					output += '--';
					i += 2;
					continue;
				}
				output = output.trimEnd();
				output += ` ${char} `;
				i++;
				while (/\s/.test(text[i])) i++;
				continue;
			}
		}

		if (status.inPropertyValue && /\s/.test(char)) {
			if (!output.endsWith('(') && !output.endsWith(' ')) {
				output += ' ';
			}
			i++;
			continue;
		}

		if (status.inPropertyValue && char === ')') {
			output = output.trimEnd();
		}

		if (output.endsWith('\n')) {
			output += applyIndent();
		}

		output += char;
		i++;
	}

	return output.trim() + '\n';
};

global.prettifyCSS = prettifyCSS;

const minifyCSS = text => {
	return text
		.replace(/\/\*[\s\S]*?\*\/|([^:]|^)\/\/.*$/gm, '$1')
		.replace(/\s+/g, ' ')
		.replace(/\s*([;:{},])\s*/g, '$1')
		.replace(/;}/g, '}')
		.trim();
};

const ENTITIES = {'Aacute':'\u00C1','aacute':'\u00E1','Acirc':'\u00C2','acirc':'\u00E2','acute':'\u00B4','AElig':'\u00C6','aelig':'\u00E6','Agrave':'\u00C0','agrave':'\u00E0','amp':'&','apos':"'",'Aring':'\u00C5','aring':'\u00E5','Atilde':'\u00C3','atilde':'\u00E3','Auml':'\u00C4','auml':'\u00E4','brvbar':'\u00A6','Ccedil':'\u00C7','ccedil':'\u00E7','cedil':'\u00B8','cent':'\u00A2','copy':'\u00A9','curren':'\u00A4','deg':'\u00B0','divide':'\u00F7','Eacute':'\u00C9','eacute':'\u00E9','Ecirc':'\u00CA','ecirc':'\u00EA','Egrave':'\u00C8','egrave':'\u00E8','ETH':'\u00D0','eth':'\u00F0','Euml':'\u00CB','euml':'\u00EB','euro':'\u20AC','frac12':'\u00BD','frac14':'\u00BC','frac34':'\u00BE','gt':'>','Iacute':'\u00CD','iacute':'\u00ED','Icirc':'\u00CE','icirc':'\u00EE','iexcl':'\u00A1','Igrave':'\u00CC','igrave':'\u00EC','iquest':'\u00BF','Iuml':'\u00CF','iuml':'\u00EF','laquo':'\u00AB','lt':'<','macr':'\u00AF','micro':'\u00B5','middot':'\u00B7','nbsp':'\u00A0','not':'\u00AC','Ntilde':'\u00D1','ntilde':'\u00F1','Oacute':'\u00D3','oacute':'\u00F3','Ocirc':'\u00D4','ocirc':'\u00F4','Ograve':'\u00D2','ograve':'\u00F2','ordf':'\u00AA','ordm':'\u00BA','Oslash':'\u00D8','oslash':'\u00F8','Otilde':'\u00D5','otilde':'\u00F5','Ouml':'\u00D6','ouml':'\u00F6','para':'\u00B6','plusmn':'\u00B1','pound':'\u00A3','quot':'"','raquo':'\u00BB','reg':'\u00AE','sect':'\u00A7','shy':'\u00AD','sup1':'\u00B9','sup2':'\u00B2','sup3':'\u00B3','szlig':'\u00DF','THORN':'\u00DE','thorn':'\u00FE','times':'\u00D7','Uacute':'\u00DA','uacute':'\u00FA','Ucirc':'\u00DB','ucirc':'\u00DB','Ugrave':'\u00D9','ugrave':'\u00F9','uml':'\u00A8','Uuml':'\u00DC','uuml':'\u00FC','Yacute':'\u00DD','yacute':'\u00FD','yen':'\u00A5','yuml':'\u00FF'};
const decodeHtmlEntities = (text, isAttribute = false) => {
	if (!text) return '';
	return text.replace(/&(#?[\w\d]+);/g, (match, entity) => {
		if (entity === 'amp' || entity === 'lt' || entity === 'gt') {
			return match;
		}
		if (isAttribute && (entity === 'quot' || entity === 'apos')) {
			return match;
		}
		if (entity.charAt(0) === '#') {
			const code = entity.charAt(1).toLowerCase() === 'x' ? parseInt(entity.substring(2), 16) : parseInt(entity.substring(1), 10);
			if (isNaN(code)) return match;
			return String.fromCharCode(code);
		}
		return ENTITIES[entity] || match;
	});
};

const prettifyHTML = text => {
	const tokens = [];
	let i = 0;
	const source = text.trim();

	while (i < source.length) {
		const remaining = source.substring(i);
		const specialMatch = remaining.match(/^(<(pre|textarea|script|style)[\s\S]*?<\/\2>|<!--[\s\S]*?-->|<!\[[\s\S]*?\]>)/i);
		
		if (specialMatch) {
			tokens.push(specialMatch[0]);
			i += specialMatch[0].length;
			continue;
		}

		if (remaining[0] === '<') {
			let tagEnd = -1;
			let inQuote = null;
			for (let j = 1; j < remaining.length; j++) {
				const char = remaining[j];
				if (inQuote) {
					if (char === inQuote) inQuote = null;
				} else {
					if (char === '"' || char === "'") {
						inQuote = char;
					} else if (char === '>') {
						tagEnd = j;
						break;
					}
				}
			}
			
			if (tagEnd !== -1) {
				tokens.push(remaining.substring(0, tagEnd + 1));
				i += tagEnd + 1;
			} else {
				tokens.push(remaining);
				i = source.length;
			}
		} else {
			const nextTag = remaining.indexOf('<');
			if (nextTag === -1) {
				tokens.push(remaining);
				i = source.length;
			} else {
				tokens.push(remaining.substring(0, nextTag));
				i += nextTag;
			}
		}
	}

	let indentLevel = 0;
	const openTags = [];
	const tab = '\t';
	const voidElements = new Set(['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'param', 'source', 'track', 'wbr']);
	const collapsibleBlockTags = new Set(['title', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'li', 'figcaption', 'dt', 'dd']);
	const inlineTags = new Set(['span', 'a', 'button', 'label', 'td', 'th', 'strong', 'em', 'b', 'i', 'code', 'samp', 'kbd', 'var', 'sub', 'sup', 'q', 'cite', 'dfn', 'abbr', 'time', 'mark', 'small', 'del', 'ins', 'u']);
	const autoClosingTags = new Set(['p', 'li', 'dt', 'dd', 'option']);
	let result = '';

	for (let i = 0; i < tokens.length; i++) {
		const token = tokens[i];
		const isStyleBlock = /^<style\b/i.test(token.trim());
		const isSpecialBlock = /^<(pre|textarea|script)\b/i.test(token.trim()) || /^<!--/.test(token.trim());
		let trimmedToken = isStyleBlock || isSpecialBlock ? token : token.trim();

		if (!trimmedToken) continue;

		if (trimmedToken.startsWith('<') && !isSpecialBlock && !isStyleBlock) {
			trimmedToken = trimmedToken.replace(/\s+/g, ' ').replace(/\s+>/g, '>');
			const tagParts = trimmedToken.match(/^<(\/?)([^ >\/]+)(.*?)(\/?)>$/);
			if (tagParts) {
				let pre = tagParts[1] || '';
				let tagName = tagParts[2] || '';
				let attributes = tagParts[3] || '';
				let post = tagParts[4] || '';
				attributes = attributes.replace(/(\S+)=(['"])(.*?)\2/g, (match, name, quote, value) => `${name}=${quote}${decodeHtmlEntities(value, true)}${quote}`);
				trimmedToken = `<${pre}${tagName}${attributes}${post}>`;
			}
		}
		
		if (isStyleBlock) {
			const styleMatch = trimmedToken.match(/^<style(.*?)>([\s\S]*)<\/style>$/i);
			if (styleMatch) {
				const attributes = styleMatch[1] || '';
				const content = styleMatch[2] || '';
				const prettifiedContent = prettifyCSS(content);
				result += tab.repeat(indentLevel) + `<style${attributes}>` + '\n';
				result += prettifiedContent.split('\n').map(line => tab.repeat(indentLevel + 1) + line).join('\n') + '\n';
				result += tab.repeat(indentLevel) + `</style>` + '\n';
			} else {
				result += tab.repeat(indentLevel) + trimmedToken + '\n';
			}
			continue;
		}

		if (isSpecialBlock) {
			result += tab.repeat(indentLevel) + trimmedToken + '\n';
			continue;
		}
		
		const isOpeningConditional = /^<!\[if/i.test(trimmedToken);
		const isClosingConditional = /^<!\[endif/i.test(trimmedToken);
		if (isOpeningConditional || isClosingConditional) {
			if (isClosingConditional) indentLevel = Math.max(0, indentLevel - 1);
			result += tab.repeat(indentLevel) + trimmedToken + '\n';
			if (isOpeningConditional) indentLevel++;
			continue;
		}
		
		if (trimmedToken.toLowerCase().startsWith('<!doctype')) {
			result += trimmedToken + '\n';
			continue;
		}

		const isOpeningTag = trimmedToken.startsWith('<') && !trimmedToken.startsWith('</');
		const isClosingTag = trimmedToken.startsWith('</');
		const tagNameMatch = trimmedToken.match(/^<\/?([a-zA-Z0-9]+)/);
		const tagName = tagNameMatch ? tagNameMatch[1].toLowerCase() : null;
		
		if (isOpeningTag && collapsibleBlockTags.has(tagName)) {
			let lookaheadIndex = i + 1;
			let canCollapse = false;
			const content = [token];
			let openInlineCount = 0;
			while (lookaheadIndex < tokens.length) {
				const nextTokenRaw = tokens[lookaheadIndex];
				const nextToken = nextTokenRaw.trim();
				if (!nextToken) { lookaheadIndex++; continue; }
				const nextIsOpening = nextToken.startsWith('<') && !nextToken.startsWith('</');
				const nextIsClosing = nextToken.startsWith('</');
				const nextTagNameMatch = nextToken.match(/^<\/?([a-zA-Z0-9]+)/);
				const nextTagName = nextTagNameMatch ? nextTagNameMatch[1].toLowerCase() : null;
				if (nextIsClosing && nextTagName === tagName && openInlineCount === 0) {
					content.push(nextTokenRaw);
					let line = content.map(t_raw => {
						const t = t_raw.trim();
						if (t.startsWith('<')) {
							return t;
						}
						return decodeHtmlEntities(t_raw, false);
					}).join('');
					line = line.trim().replace(/\s+/g, ' ');
					result += tab.repeat(indentLevel) + line + '\n';
					i = lookaheadIndex;
					canCollapse = true;
					break;
				}
				if (!nextToken.startsWith('<') || inlineTags.has(nextTagName)) {
					content.push(nextTokenRaw);
					if (nextIsOpening && inlineTags.has(nextTagName)) openInlineCount++;
					if (nextIsClosing && inlineTags.has(nextTagName)) openInlineCount--;
				} else { break; }
				lookaheadIndex++;
			}
			if (canCollapse) continue;
		}

		const isVoid = voidElements.has(tagName);
		const isSelfClosing = trimmedToken.endsWith('/>') || isVoid;
		const isNonSelfClosing = isOpeningTag && !isSelfClosing;

		if (isOpeningTag && autoClosingTags.has(tagName)) {
			const lastOpenTag = openTags.length > 0 ? openTags[openTags.length - 1] : null;
			if (tagName === lastOpenTag) {
				const closedTag = openTags.pop();
				indentLevel = Math.max(0, indentLevel - 1);
				result += tab.repeat(indentLevel) + `</${closedTag}>` + '\n';
			}
		}
		
		if (isClosingTag) {
			indentLevel = Math.max(0, indentLevel - 1);
			if (openTags.length > 0 && openTags[openTags.length - 1] === tagName) {
				openTags.pop();
			}
		}
		
		result += tab.repeat(indentLevel) + (!isOpeningTag && !isClosingTag ? decodeHtmlEntities(trimmedToken, false) : trimmedToken) + '\n';

		if (isNonSelfClosing) {
			indentLevel++;
			openTags.push(tagName);
		}
	}
	return result.trim();
};

const minifyHTML = text => {
	return text
		.replace(/<!--[\s\S]*?-->/g, '')
		.replace(/\s+/g, ' ')
		.replace(/>\s+</g, '><')
		.trim();
};

const register = context => {
	registerCommand(context, 'altkit.urlEncode', createCommandHandler(text => {try { return encodeURIComponent(text); } catch (e) { throw new Error('Invalid text selected.'); }}, 'URL Encode.'));
	registerCommand(context, 'altkit.urlDecode', createCommandHandler(text => {try { return decodeURIComponent(text); } catch (e) { throw new Error('Invalid text selected.'); }}, 'URL Decode.'));

	registerCommand(context, 'altkit.cssPrettify', createCommandHandler(text => {try { return prettifyCSS(text); } catch (e) { console.error(e); throw new Error('Invalid CSS selected.'); }}, 'CSS Prettified.'));
	registerCommand(context, 'altkit.cssMinify', createCommandHandler(text => {try { return minifyCSS(text); } catch (e) { console.error(e); throw new Error('Invalid CSS selected.'); }}, 'CSS Minified.'));
	registerCommand(context, 'altkit.htmlPrettify', createCommandHandler(text => {try { return prettifyHTML(text); } catch (e) { console.error(e); throw new Error('Invalid HTML selected.'); }}, 'HTML Prettified.'));
	registerCommand(context, 'altkit.htmlMinify', createCommandHandler(text => {try { return minifyHTML(text); } catch (e) { console.error(e); throw new Error('Invalid HTML selected.'); }}, 'HTML Minified.'));
};

module.exports = {register};
