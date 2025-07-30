const vscode = require('vscode');
const {createCommandHandler, registerCommand} = require('../utils');

const register = context => {
	registerCommand(context, 'altkit.jsonMinify', createCommandHandler(text => {try { return JSON.stringify(JSON.parse(text)); } catch (e) { throw new Error('Invalid JSON selected.'); }}, 'Minifies the selected JSON.'));
	registerCommand(context, 'altkit.jsonPrettify', createCommandHandler(text => {try { return JSON.stringify(JSON.parse(text), null, '\t'); } catch (e) { throw new Error('Invalid JSON selected.'); }}, 'Formats the selected JSON nicely.'));
	registerCommand(context, 'altkit.jsonStringify', createCommandHandler(text => JSON.stringify(text), 'JSON Stringify the selected texts.'));

	const evaluateJsonPath = (data, path) => {
		const evaluateFilter = (item, expr) => {
			const selfFilterMatch = expr.match(/^@\s*([<>=!]=?)\s*(.*)$/);
			if (selfFilterMatch) {
				const [, operator, rawValue] = selfFilterMatch;
				let value;
				try {
					value = JSON.parse(rawValue.replace(/'/g, `"`));
				} catch {
					return false;
				}
				switch (operator) {
					case '>': return item > value;
					case '<': return item < value;
					case '>=': return item >= value;
					case '<=': return item <= value;
					case '==': return item == value;
					case '!=': return item != value;
					default: return false;
				}
			}

			const operatorMatch = expr.match(/^(.*?)\s*([<>=!]=?)\s*(.*)$/);
			if (operatorMatch) {
				const [, pathExpr, operator, rawValue] = operatorMatch;
				if (!pathExpr.startsWith('@')) return false;

				let value;
				try {
					value = JSON.parse(rawValue.replace(/'/g, `"`));
				} catch {
					return false;
				}
				
				const results = evaluateJsonPath(item, pathExpr.replace(/^@/, '$'));
				if (results.length === 0) return false;
				
				return results.some(res => {
					switch (operator) {
						case '>': return res > value;
						case '<': return res < value;
						case '>=': return res >= value;
						case '<=': return res <= value;
						case '==': return res == value;
						case '!=': return res != value;
						default: return false;
					}
				});
			}
			return evaluateJsonPath(item, expr.replace(/^@/, '$')).length > 0;
		};

		const recursiveSearch = (node, key, results) => {
			if (!node || typeof node !== 'object') return;
			if (Array.isArray(node)) {
				node.forEach(item => recursiveSearch(item, key, results));
			} else {
				Object.entries(node).forEach(([k, v]) => {
					if (k === key) {
						results.push(v);
					}
					recursiveSearch(v, key, results);
				});
			}
		};

		if (path === '$') return [data];

		if (path.startsWith('$..')) {
			const key = path.substring(3);
			const results = [];
			recursiveSearch(data, key, results);
			return results;
		}

		const tokens = path.replace(/^\$\.?/, '').replace(/\[/g, '.[').split('.');
		let currentData = [data];

		for (const token of tokens) {
			if (currentData.length === 0) break;
			const nextData = [];
			const prop = token.replace(/\]$/, '').replace(/^\[/, '');

			for (const item of currentData) {
				if (item === null || item === undefined) continue;

				if (token === '[*]') {
					if (Array.isArray(item)) {
						nextData.push(...item);
					}
				} else if (token.startsWith('[?(')) {
					if (Array.isArray(item)) {
						const expr = token.slice(3, -2);
						const filtered = item.filter(subItem => evaluateFilter(subItem, expr));
						if (filtered.length > 0) {
							nextData.push(filtered);
						}
					}
				} else if (token.match(/^\[\d+\]$/)) {
					if (Array.isArray(item)) {
						const index = parseInt(prop, 10);
						if (item[index] !== undefined) {
							nextData.push(item[index]);
						}
					}
				} else {
					if (Array.isArray(item)) {
						for (const subItem of item) {
							if (subItem && typeof subItem === 'object' && subItem[prop] !== undefined) {
								nextData.push(subItem[prop]);
							}
						}
					} else if (typeof item === 'object' && item[prop] !== undefined) {
						nextData.push(item[prop]);
					}
				}
			}
			currentData = nextData;
		}
		return currentData;
	};

	const handleJsonPath = async () => {
		const editor = vscode.window.activeTextEditor;
		if (!editor) { return; }
		const selection = editor.selection;
		const isSelectionEmpty = selection.isEmpty;
		const sourceRange = isSelectionEmpty ? new vscode.Range(editor.document.positionAt(0), editor.document.positionAt(editor.document.getText().length)) : selection;

		const text = editor.document.getText(sourceRange);

		let jsonObject;
		try { jsonObject = JSON.parse(text); } catch (e) { vscode.window.showErrorMessage('Invalid JSON selected.'); return; }

		const path = await vscode.window.showInputBox({
			prompt: 'Enter the JSONPath query (basic support)',
			placeHolder: 'e.g., $.store.book[*].author or $.store.book[0]'
		});
		if (!path) { return; }

		try {
			const result = evaluateJsonPath(jsonObject, path);
			if (!result || result.length === 0) {
				vscode.window.showInformationMessage(`No results found for path: ${path}`);
				return;
			}

			editor.edit(editBuilder => {
				editBuilder.replace(sourceRange, JSON.stringify(result, null, '\t'));
			});
		} catch (e) {
			vscode.window.showErrorMessage(`Error evaluating JSONPath: ${e.message}`);
		}
	};

	registerCommand(context, 'altkit.jsonPath', handleJsonPath, 'Query selected JSON using a JSONPath expression.');
};

module.exports = {register};
