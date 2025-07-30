const vscode = require('vscode');
const {createCommandHandler, registerCommand} = require('../utils');

const register = context => {
	registerCommand(context, 'altkit.urlEncode', createCommandHandler(text => {try { return encodeURIComponent(text); } catch (e) { throw new Error('Invalid text selected.'); }}, 'URL Encode.'));
	registerCommand(context, 'altkit.urlDecode', createCommandHandler(text => {try { return decodeURIComponent(text); } catch (e) { throw new Error('Invalid text selected.'); }}, 'URL Decode.'));
};

module.exports = {register};
