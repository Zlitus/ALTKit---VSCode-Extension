const {createCommandHandler, registerCommand} = require('../utils');

const componentToHex = c => {
	const hex = c.toString(16);
	return hex.length === 1 ? `0${hex}` : hex;
};

const handleRgbToHex = text => {
	const match = text.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
	if (!match) {
		throw new Error('Invalid RGB(A) color format. Expected "rgb(r, g, b)" or "rgba(r, g, b, a)".');
	}
	const [, r, g, b, a] = match;
	const hexR = componentToHex(parseInt(r, 10));
	const hexG = componentToHex(parseInt(g, 10));
	const hexB = componentToHex(parseInt(b, 10));

	let hexA = '';
	if (a !== undefined) {
		const alphaValue = Math.round(parseFloat(a) * 255);
		hexA = componentToHex(alphaValue);
	}

	return `#${hexR}${hexG}${hexB}${hexA}`;
};

const handleHexToRgb = text => {
	let hex = text.startsWith('#') ? text.slice(1) : text;

	if (!/^([0-9a-fA-F]{3,4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/.test(hex)) {
		throw new Error('Invalid HEX color format.');
	}

	if (hex.length === 3 || hex.length === 4) {
		hex = hex.split('').map(char => char + char).join('');
	}

	const r = parseInt(hex.substring(0, 2), 16);
	const g = parseInt(hex.substring(2, 4), 16);
	const b = parseInt(hex.substring(4, 6), 16);

	if (hex.length === 8) {
		const a = (parseInt(hex.substring(6, 8), 16) / 255).toFixed(2).replace(/\.?0+$/, '');
		return `rgba(${r}, ${g}, ${b}, ${a})`;
	}

	return `rgb(${r}, ${g}, ${b})`;
};

const handleRgbToHsl = text => {
	const match = text.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
	if (!match) {
		throw new Error('Invalid RGB(A) color format.');
	}
	let [, r, g, b, a] = match;
	r /= 255;
	g /= 255;
	b /= 255;

	const max = Math.max(r, g, b);
	const min = Math.min(r, g, b);
	let h, s, l = (max + min) / 2;

	if (max === min) {
		h = s = 0;
	} else {
		const d = max - min;
		s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
		switch (max) {
			case r: h = (g - b) / d + (g < b ? 6 : 0); break;
			case g: h = (b - r) / d + 2; break;
			case b: h = (r - g) / d + 4; break;
		}
		h /= 6;
	}

	h = Math.round(h * 360);
	s = Math.round(s * 100);
	l = Math.round(l * 100);
	
	a = a !== undefined ? `, ${a.replace(/\.?0+$/, '')}` : '';

	return `hsl${a ? 'a' : ''}(${h}, ${s}%, ${l}%${a})`;
};

const handleHslToRgb = text => {
	const match = text.match(/hsla?\((\d+),\s*(\d+)%?,\s*(\d+)%?(?:,\s*([\d.]+))?\)/);
	if (!match) {
		throw new Error('Invalid HSL(A) color format.');
	}
	let [, h, s, l, a] = match;
	h = parseInt(h, 10);
	s = parseInt(s, 10) / 100;
	l = parseInt(l, 10) / 100;

	let r, g, b;

	if (s === 0) {
		r = g = b = l;
	} else {
		const hue2rgb = (p, q, t) => {
			if (t < 0) t += 1;
			if (t > 1) t -= 1;
			if (t < 1 / 6) return p + (q - p) * 6 * t;
			if (t < 1 / 2) return q;
			if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
			return p;
		};

		const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
		const p = 2 * l - q;
		r = hue2rgb(p, q, h / 360 + 1 / 3);
		g = hue2rgb(p, q, h / 360);
		b = hue2rgb(p, q, h / 360 - 1 / 3);
	}

	r = Math.round(r * 255);
	g = Math.round(g * 255);
	b = Math.round(b * 255);
	
	a = a !== undefined ? `, ${a.replace(/\.?0+$/, '')}` : '';

	return `rgb${a ? 'a' : ''}(${r}, ${g}, ${b}${a})`;
};

const handleColorToggle = text => {
	const trimmedText = text.trim();
	if (trimmedText.startsWith('hsl')) { const rgb = handleHslToRgb(trimmedText); return handleRgbToHex(rgb); }
	if (trimmedText.startsWith('rgb')) { return handleRgbToHsl(trimmedText); }
	if (trimmedText.startsWith('#')) { return handleHexToRgb(trimmedText); }
	throw new Error('Selection is not a valid RGB, HEX, or HSL color.');
};

const register = context => {
	registerCommand(context, 'altkit.colorRgbToHex', createCommandHandler(handleRgbToHex, 'Converts the selected RGB(A) color to HEX format.'));
	registerCommand(context, 'altkit.colorHexToRgb', createCommandHandler(handleHexToRgb, 'Converts the selected HEX color to RGB(A) format.'));
	registerCommand(context, 'altkit.colorRgbToHsl', createCommandHandler(handleRgbToHsl, 'Converts the selected RGB(A) color to HSL(A) format.'));
	registerCommand(context, 'altkit.colorHslToRgb', createCommandHandler(handleHslToRgb, 'Converts the selected HSL(A) color to RGB(A) format.'));
	registerCommand(context, 'altkit.colorToggleFormat', createCommandHandler(handleColorToggle, 'Toggles color format (HEX -> RGB -> HSL -> HEX).'));
};

module.exports = {register};
