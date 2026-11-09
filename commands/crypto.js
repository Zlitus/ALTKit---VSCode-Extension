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

	const V2_PREFIX = 'v2:';
	const deriveKey = (password, salt) => crypto.scryptSync(String(password), salt, 32);
	const legacyKey = password => crypto.createHash('sha256').update(String(password)).digest('base64').substr(0, 32);

	const encryptText = (text, password) => {
		const salt = crypto.randomBytes(16);
		const iv = crypto.randomBytes(16);
		const cipher = crypto.createCipheriv('aes-256-cbc', deriveKey(password, salt), iv);
		const encrypted = cipher.update(text, 'utf8', 'hex') + cipher.final('hex');
		return `${V2_PREFIX}${salt.toString('hex')}:${iv.toString('hex')}:${encrypted}`;
	};

	const decryptText = (text, password) => {
		const trimmed = text.trim();
		let key, iv, encrypted;
		if (trimmed.startsWith(V2_PREFIX)) {
			const [saltHex, ivHex, dataHex] = trimmed.slice(V2_PREFIX.length).split(':');
			if (!saltHex || !ivHex || !dataHex) throw new Error('Malformed data');
			key = deriveKey(password, Buffer.from(saltHex, 'hex'));
			iv = Buffer.from(ivHex, 'hex');
			encrypted = Buffer.from(dataHex, 'hex');
		} else {
			const parts = trimmed.split(':');
			key = legacyKey(password);
			iv = Buffer.from(parts.shift(), 'hex');
			encrypted = Buffer.from(parts.join(':'), 'hex');
		}
		const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
		return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString('utf8');
	};

	const aesEncrypt = async () => {
		const editor = vscode.window.activeTextEditor;
		if (!editor) return;
		const password = await vscode.window.showInputBox({prompt: 'Enter encryption password', password: true});
		if (!password) return;

		editor.edit(editBuilder => {
			editor.selections.forEach(selection => {
				if (selection.isEmpty) return;
				editBuilder.replace(selection, encryptText(editor.document.getText(selection), password));
			});
		});
	};
	registerCommand(context, 'altkit.aesEncrypt', aesEncrypt, 'Encrypts selection with AES-256-CBC.');

	const aesDecrypt = async () => {
		const editor = vscode.window.activeTextEditor;
		if (!editor) return;
		const password = await vscode.window.showInputBox({prompt: 'Enter decryption password', password: true});
		if (!password) return;

		editor.edit(editBuilder => {
			editor.selections.forEach(selection => {
				if (selection.isEmpty) return;
				try {
					editBuilder.replace(selection, decryptText(editor.document.getText(selection), password));
				} catch (e) {
					vscode.window.showErrorMessage('Decryption failed. Check password or data format.');
				}
			});
		});
	};
	registerCommand(context, 'altkit.aesDecrypt', aesDecrypt, 'Decrypts selection with AES-256-CBC.');
};

module.exports = {register};
