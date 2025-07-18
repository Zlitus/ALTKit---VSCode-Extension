const crypto = require('crypto');
const {createCommandHandler, registerCommand} = require('../utils');

const register = context => {
	registerCommand(context, 'altkit.base64Encode', createCommandHandler(text => Buffer.from(text).toString('base64'), 'Encodes the selection to Base64.'));
	registerCommand(context, 'altkit.base64Decode', createCommandHandler(text => Buffer.from(text, 'base64').toString('utf8'), 'Decodes the Base64 selection.'));
	registerCommand(context, 'altkit.md5', createCommandHandler(text => crypto.createHash('md5').update(text).digest('hex'), 'Computes the MD5 hash of the selection.'));
	registerCommand(context, 'altkit.sha1', createCommandHandler(text => crypto.createHash('sha1').update(text).digest('hex'), 'Computes the SHA1 hash of the selection.'));
	registerCommand(context, 'altkit.sha256', createCommandHandler(text => crypto.createHash('sha256').update(text).digest('hex'), 'Computes the SHA256 hash of the selection.'));
};

module.exports = {register};
