const http = require('http');
const fs = require('fs');
const path = require('path');
const { handleApi } = require('./api/inventory');

const server = http.createServer((req, res) => {
  // Handle API requests
  if (handleApi(req, res)) return;

  // Resolve requested file path
  let requestedPath = req.url === '/' ? '/index.html' : req.url;
  const filePath = path.join(__dirname, 'public', requestedPath);
  const ext = path.extname(filePath);

  // Only allow .html files
  if (ext !== '.html') {
    res.writeHead(403, { 'Content-Type': 'text/plain' });
    return res.end('403 Forbidden: Only .html files are allowed');
  }

  // Read and serve HTML file or fallback to 404.html
  fs.readFile(filePath, (err, content) => {
    if (err) {
      fs.readFile(path.join(__dirname, 'public', '404.html'), (e, notFound) => {
        res.writeHead(404, { 'Content-Type': 'text/html' });
        res.end(notFound || '404 - Not Found');
      });
    } else {
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(content);
    }
  });
});

const PORT = 3000;
server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
