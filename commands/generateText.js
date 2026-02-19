const {createReplacementHandler, generateRandomString, registerCommand} = require('../utils');

const register = context => {
	registerCommand(context, 'altkit.randomString15', createReplacementHandler(() => generateRandomString(15), 'Replaces selection with a random 15-character string.'));
	registerCommand(context, 'altkit.randomString30', createReplacementHandler(() => generateRandomString(30), 'Replaces selection with a random 30-character string.'));
	registerCommand(context, 'altkit.randomPort', createReplacementHandler(() => `${Math.floor(Math.random() * (65535 - 1024) + 1024)}`, 'Replaces selection with a random port number (1024-65535).'));
};

module.exports = {register};
