const vscode = require('vscode');
const crypto = require('crypto');
const {createCommandHandler, createReplacementHandler, registerCommand} = require('../utils');

const register = context => {
	registerCommand(context, 'altkit.base64Encode', createCommandHandler(text => Buffer.from(text).toString('base64'), 'Encodes the selection to Base64.'));
	registerCommand(context, 'altkit.base64Decode', createCommandHandler(text => Buffer.from(text, 'base64').toString('utf8'), 'Decodes the Base64 selection.'));
	registerCommand(context, 'altkit.md5', createCommandHandler(text => crypto.createHash('md5').update(text).digest('hex'), 'Computes the MD5 hash of the selection.'));
	registerCommand(context, 'altkit.sha1', createCommandHandler(text => crypto.createHash('sha1').update(text).digest('hex'), 'Computes the SHA1 hash of the selection.'));
	registerCommand(context, 'altkit.sha256', createCommandHandler(text => crypto.createHash('sha256').update(text).digest('hex'), 'Computes the SHA256 hash of the selection.'));
	registerCommand(context, 'altkit.generateUUID', createReplacementHandler(() => crypto.randomUUID(), 'Replaces selection with a new UUID.'));

	const aesEncrypt = async () => {
		const editor = vscode.window.activeTextEditor;
		if (!editor) return;
		const password = await vscode.window.showInputBox({prompt: 'Enter encryption password'});
		if (!password) return;

		editor.edit(editBuilder => {
			editor.selections.forEach(selection => {
				if (selection.isEmpty) return;
				const text = editor.document.getText(selection);
				const iv = crypto.randomBytes(16);
				const key = crypto.createHash('sha256').update(String(password)).digest('base64').substr(0, 32);
				const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
				let encrypted = cipher.update(text, 'utf8', 'hex');
				encrypted += cipher.final('hex');
				editBuilder.replace(selection, `${iv.toString('hex')}:${encrypted}`);
			});
		});
	};
	registerCommand(context, 'altkit.aesEncrypt', aesEncrypt, 'Encrypts selection with AES-256-CBC.');

	const aesDecrypt = async () => {
		const editor = vscode.window.activeTextEditor;
		if (!editor) return;
		const password = await vscode.window.showInputBox({prompt: 'Enter decryption password'});
		if (!password) return;

		editor.edit(editBuilder => {
			editor.selections.forEach(selection => {
				if (selection.isEmpty) return;
				const text = editor.document.getText(selection);
				try {
					const textParts = text.split(':');
					const iv = Buffer.from(textParts.shift(), 'hex');
					const encryptedText = Buffer.from(textParts.join(':'), 'hex');
					const key = crypto.createHash('sha256').update(String(password)).digest('base64').substr(0, 32);
					const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
					let decrypted = decipher.update(encryptedText);
					decrypted = Buffer.concat([decrypted, decipher.final()]);
					editBuilder.replace(selection, decrypted.toString());
				} catch (e) {
					vscode.window.showErrorMessage('Decryption failed. Check password or data format.');
				}
			});
		});
	};
	registerCommand(context, 'altkit.aesDecrypt', aesDecrypt, 'Decrypts selection with AES-256-CBC.');
};

module.exports = {register};
