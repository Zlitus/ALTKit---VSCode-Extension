# 0.0.17
## 2026/11/09

- Fix HTML Prettify with CDATA sections: no more broken indentation, split blocks or collapsed whitespace; `<style><![CDATA[...]]></style>` (SVG) is now formatted correctly
- Fix HTML Prettify indentation after `<?xml ?>` declarations and unclosed `<li>`/`<p>` before their parent closes
- Fix HTML Minify breaking inline scripts (`//` comments) and whitespace in `<pre>`, `<textarea>`, `<script>`, `<style>` and CDATA
- Fix CSS Minify removing protocol-relative URLs (`url(//cdn...)`)
- Fix Strip HTML / HTML to Markdown leaking `<code>` tags and undecoded entities from `<pre>` blocks; code block language is now detected
- Fix Strip HTML gluing `<pre>` content to the preceding text
- AES Encrypt now derives a full 256-bit key with scrypt and a random salt (new `v2:` format); texts encrypted with previous versions can still be decrypted. Password input is now masked
- Random strings and random port now use a cryptographically secure generator
- Much faster CSS Prettify on large files (700KB: ~80s → <0.1s) and faster HTML Prettify
- Faster extension startup: the HTML parser is loaded only when needed

# 0.0.16
## 2026/02/19

- Add new command: Random Port (1024-65535)
- Fix Shuffle command: now properly shuffles words within a line and letters within a single word (not just lines)
- Bundle extension with esbuild for faster load times and smaller package size

# 0.0.14
## 2025/07/31

- Implement new commands HTML Prettify / CSS Prettify
- Small fixes

# 0.0.13
## 2025/07/30

- Fixing issues in URL Encode / URL Decode
- Implement new command JSON Stringify

# 0.0.12
## 2025/07/22

- More detailled package.json categories, keywords, description, homepage, bugs reporting, …

# 0.0.11
## 2025/07/22

- Add Color Conversion commands

# 0.0.10
## 2025/07/19

- Add Filter Lines, PadLeft & PadRight

# 0.0.9
## 2025/07/18

- Remove dependancy to JSDom, was way too big. Using `node-html-parser` instead.

# 0.0.8
## 2025/07/18

- Update StripHTML to use JSDOM to produce the best possible quality to Strip HTML
- New commands: html2markdown, markdown2html

# 0.0.7
## 2025/07/18

- Separate extension code of commands code
- New script to regenerate all commands in package.json
- New commands: generateUUID, aesEncrypt, aesDecrypt, joinLines, stripMarkdown, cleanText, insertDateTime, Enquote, Reverse sort

# 0.0.6
## 2025/07/17

- Adding commands Increment, Slugify, Insert Timestamp

# 0.0.5
## 2025/07/17

- Initial release
