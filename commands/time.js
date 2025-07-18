const {createCommandHandler, createReplacementHandler, registerCommand} = require('../utils');

const register = context => {
	registerCommand(context, 'altkit.insertTimestamp', createReplacementHandler(() => `${Math.floor(Date.now() / 1000)}`, 'Insert current Unix timestamp.'));
	registerCommand(context, 'altkit.insertMilliTimestamp', createReplacementHandler(() => `${Date.now()}`, 'Insert current Unix milli timestamp.'));
	registerCommand(context, 'altkit.insertDateTime', createReplacementHandler(() => new Date().toISOString(), 'Insert current ISO date/time.'));
	registerCommand(context, 'altkit.timestampToDate', createCommandHandler(text => {
		const timestamp = parseInt(text, 10);
		if (isNaN(timestamp)) throw new Error('Selection is not a valid timestamp.');
		const date = new Date(timestamp * (timestamp > 1000000000000 ? 1 : 1000));
		return date.toUTCString();
	}, 'Converts a selected Unix timestamp to a UTC date string.'));
	registerCommand(context, 'altkit.dateToTimestamp', createCommandHandler(text => {
		const date = new Date(text);
		if (isNaN(date.getTime())) throw new Error('Could not parse the selected text as a valid date.');
		return `${Math.floor(date.getTime() / 1000)}`;
	}, 'Converts a selected date string to a Unix timestamp.'));
};

module.exports = {register};
