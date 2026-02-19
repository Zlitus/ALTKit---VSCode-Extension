# 🔧 ALTKit – A Versatile Text Toolkit for VSCode

**ALTKit** is a powerful and lightweight Visual Studio Code extension designed to help your workflow with a rich set of **text manipulation utilities** — all accessible via a convenient command palette or keybinding.

*This extension was partially written with the help of AI (Gemini).*

---

## 🚀 Features

### 🔤 Text Transformations
- `To Camel Case` – Convert to `camelCase`.
- `To Upper Case` / `To Lower Case`
- `Capitalize` – Capitalize each word.
- `Join lines` — Join multiple lines using comma separator.
- `Clean text` — Remove double spaces, trim, ….
- `Slugify` — Converts text into a URL-friendly slug: lowercase, hyphens for spaces, and removes special characters.
- `Pad left / right` — Add spaces or characters to the left or right to reach a desired length. Ex: 1 can become 001.

### 🧠 Utilities
- `Eval JavaScript` – Evaluate selected JavaScript.
- `Shuffle` – Shuffle characters, words, or lines.
- `Reverse` — Reverse order of characters, words, or lines.
- `Enquote` — Enquote strings in simpleQuotes or doubleQuotes taking care of escaping. Ideal for use with `Join Lines`.
- `Toggle Selection Stats in Status Bar` – View stats like word count, line count, and numeric figures (sum, avg, min, max).
- `Increment Selection` – Increment numbers or letters in the selection. E.g. `1, 1, 1` becomes `1, 2, 3`, or `B, X, Z` becomes `B, C, D`.
- `Generate UUID` – Instantly create a universally unique identifier.
- `Color Conversion` — Conversion between RGB(A) <-> HEX <-> HSL, and a `Toggle color format` to "switch" between formats.
- `CSS Prettify` - Beautify CSS code to ensure proper indentation and line breaks.
- `Strip Markdown` — Remove all Markdown tags.
- `Strip HTML` – Remove all HTML tags and keep only the text. DOM-Level operation, ignore script & style.
- `HTML Prettify` - Formats HTML code by adding proper indentation, line breaks, and organizing elements.
- `HTML De-entities` – Convert HTML entities to readable characters.
- `HTML to Markdown` / `Markdown to HTML` Convert HTML to Markdown & Markdown to HTML.

### 🔁 Encoding & Decoding
- `Base64 Encode` / `Base64 Decode`
- `URL Encode` / `URL Decode`

### 🔐 Hashing / Crypto
- `MD5`, `SHA1`, `SHA256` – Compute secure hashes of selected text.
- `AESEncrypt` / `AESDecrypt` — Encrypt or decrypt a text using AES-256-CBC.

### 📅 Time Tools
- `Insert current date/time` — Insert current ISO date/time.
- `Insert Current Timestamp` / `Insert Current Milli Timestamp`
- `Convert Timestamp to Date` / `Convert Date to Timestamp`

### 📄 JSON Helpers
- `JSON Prettify` – Format JSON nicely.
- `JSON Minify` – Minify selected JSON.
- `JSON Stringify` — Stringify the selection to a JSON.

### 🔠 Line Operations
- `Sort Lines (Ascending / Descending)`
- `De-duplicate uniq Lines` – Remove duplicates.
- `De-duplicate uniq Lines (Table view)` – Display frequency stats per line.
- `Filter` / `Filter out` — Filter lines using simple text match or regex.

### ✨ Generate Random Text
- `Random String (15 chars)`
- `Random String (30 chars)`
- `Random Port` — Generate a random port number (1024-65535).

---

## ⌨️ Usage

Open the Command Palette (`Ctrl+Shift+P` or `Cmd+Shift+P` on Mac) and type `ALTKit` to see a list of available commands.
Or use the default keybinding to access all commands quickly:

- **Windows/Linux:** `Ctrl + Shift + 9`
- **Mac:** `Cmd + Shift + 9`

---

## 📸 Status Bar Stats

Toggle selection statistics in the status bar to get quick insights into:
- Number of lines and words
- Stats over the numeric values selected: count, sum, average, min, max

---

## ✨ Inspiration

This extension was inspired by the excellent [Swissknife](https://marketplace.visualstudio.com/items?itemName=luisfontes19.vscode-swissknife) by Luis Fontes. I had the pleasure of contributing to Swissknife by writing a few scripts for it.

## Support

[![Buy me a coffee](https://img.buymeacoffee.com/button-api/?text=Buy%20me%20a%20coffee&emoji=&slug=zlitus&button_colour=FFDD00&font_colour=000000&font_family=Cookie&outline_colour=000000&coffee_colour=ffffff)](https://www.buymeacoffee.com/zlitus)
