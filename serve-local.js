#!/usr/bin/env node
// Simple HTTP server for testing the app locally
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 8000;
const APP_DIR = path.join(__dirname, '07-app');

const server = http.createServer((req, res) => {
  let filePath = path.join(APP_DIR, req.url === '/' ? 'index.html' : req.url);

  // Security: prevent directory traversal
  if (!filePath.startsWith(APP_DIR)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404);
      res.end('Not Found');
      return;
    }

    // Set content type
    const ext = path.extname(filePath);
    const types = {
      '.html': 'text/html',
      '.js': 'application/javascript',
      '.css': 'text/css',
      '.json': 'application/json',
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.wav': 'audio/wav',
      '.m4a': 'audio/mp4',
      '.ogv': 'video/ogg',
      '.mp4': 'video/mp4'
    };

    const contentType = types[ext] || 'text/plain';
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(data);
  });
});

server.listen(PORT, () => {
  console.log(`\n✅ Local server running at http://localhost:${PORT}`);
  console.log(`   Open in browser to test the app\n`);
});
