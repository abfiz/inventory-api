const fs = require('fs');
const path = require('path');

const dataPath = path.join(__dirname, '../data/items.json');

function readItems() {
  try {
    const data = fs.readFileSync(dataPath);
    return JSON.parse(data);
  } catch {
    return [];
  }
}

function writeItems(items) {
  fs.writeFileSync(dataPath, JSON.stringify(items, null, 2));
}

function sendResponse(res, statusCode, data) {
  res.writeHead(statusCode, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ success: true, data }));
}

function sendError(res, statusCode, message) {
  res.writeHead(statusCode, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ success: false, error: message }));
}

module.exports = {
  handleApi: (req, res) => {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const pathname = url.pathname;
    const method = req.method;

    if (!pathname.startsWith('/api/items')) return false;

    const parts = pathname.split('/');
    const id = parts[3]; // /api/items/:id

    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const items = readItems();

        if (method === 'GET' && pathname === '/api/items') {
          sendResponse(res, 200, items);
        } else if (method === 'GET' && id) {
          const item = items.find(i => i.id === id);
          if (!item) return sendError(res, 404, 'Item not found');
          sendResponse(res, 200, item);
        } else if (method === 'POST' && pathname === '/api/items') {
          const newItem = JSON.parse(body);
          if (!newItem.name || !newItem.price || !['s', 'm', 'l'].includes(newItem.size)) {
            return sendError(res, 400, 'Invalid item data');
          }
          newItem.id = Date.now().toString();
          items.push(newItem);
          writeItems(items);
          sendResponse(res, 201, newItem);
        } else if (method === 'PUT' && id) {
          const index = items.findIndex(i => i.id === id);
          if (index === -1) return sendError(res, 404, 'Item not found');
          const updated = JSON.parse(body);
          items[index] = { ...items[index], ...updated };
          writeItems(items);
          sendResponse(res, 200, items[index]);
        } else if (method === 'DELETE' && id) {
          const index = items.findIndex(i => i.id === id);
          if (index === -1) return sendError(res, 404, 'Item not found');
          const deleted = items.splice(index, 1)[0];
          writeItems(items);
          sendResponse(res, 200, deleted);
        } else {
          sendError(res, 405, 'Method Not Allowed');
        }
      } catch (err) {
        sendError(res, 500, 'Internal Server Error');
      }
    });

    return true;
  }
};
