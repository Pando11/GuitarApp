'use strict';
// Generates band-source.js — inlines band-engine.js source as window.__bandSrc so
// the file:// band-player.html can load it without a server (no XHR/CORS on file://).
const fs = require('fs');
const p = require('path');
const src = fs.readFileSync(p.join(__dirname, 'band-engine.js'), 'utf8');
// Escape for a JS string literal: backslashes, backticks, ${, and newlines.
const esc = src
  .replace(/\\/g, '\\\\')
  .replace(/`/g, '\\`')
  .replace(/\$\{/g, '\\${')
  .replace(/<\/script>/gi, '<\\/script>');
const out = 'window.__bandSrc = `' + esc + '`;\n';
fs.writeFileSync(p.join(__dirname, 'band-source.js'), out);
console.log('band-source.js written (' + out.length + ' bytes)');
