const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = process.env.APP_PORT ? Number(process.env.APP_PORT) : 3000;
const HOST = '0.0.0.0';
const ROOT = path.join(__dirname, 'dist');
const LOCALES = path.join(__dirname, 'locales');
const CONFIG_DIR = path.join(__dirname, 'config');
const CONFIG_FILE = path.join(CONFIG_DIR, 'registrations.json');

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.pdf': 'application/pdf',
  '.txt': 'text/plain; charset=utf-8',
  '.webp': 'image/webp',
  '.wasm': 'application/wasm'
};

const server = http.createServer((req, res) => {
  try {
    const parsedUrl = url.parse(req.url, true);
    const decoded = decodeURI(parsedUrl.pathname.split('?')[0]);
    let safe = decoded.replace(/^\/+/, ''); // remove leading slashes
    console.log(`[req] ${req.method} ${req.url} -> safe="${safe}"`);
    // Prevent path traversal
    if (safe.includes('..')) {
      console.warn('[warn] path traversal attempt:', safe);
      res.writeHead(400);
      return res.end('Bad Request');
    }

    // Gallery listing endpoint: GET /_gallery?dir=/assets/previous
    if (safe === '_gallery' && req.method === 'GET') {
      const dirParam = parsedUrl.query && parsedUrl.query.dir;
      if (!dirParam) { res.writeHead(400); return res.end('Missing dir'); }
      const rel = String(dirParam).replace(/^\/+/, '');
      const abs = path.join(ROOT, rel);
      console.log(`[gallery] listing ${rel} -> ${abs}`);
      // ensure the requested directory is inside the ROOT
      if (!abs.startsWith(ROOT)) { res.writeHead(400); return res.end('Bad Request'); }
      fs.stat(abs, (err, stats) => {
        if (err || !stats.isDirectory()) {
          console.warn('[gallery] not found or not dir:', abs, err && err.code);
          res.writeHead(404); return res.end('Not found');
        }
        fs.readdir(abs, (err2, files) => {
          if (err2) { console.error('[gallery] readdir error', err2); res.writeHead(500); return res.end('Failed to read dir'); }
          const exts = new Set(['.png', '.jpg', '.jpeg', '.webp', '.gif', '.svg', '.bmp']);
          const urls = files
            .filter(f => exts.has(path.extname(f).toLowerCase()))
            .sort()
            .map(f => '/' + path.posix.join(rel, f).replace(/\\/g, '/'));
          res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
          return res.end(JSON.stringify(urls));
        });
      });
      return;
    }

    // Serve locale JSON files from LOCALES dir if requested (live-editable)
    if (safe.startsWith('locales/')) {
      const rel = safe.replace(/^locales\//, '');
      const filePath = path.join(LOCALES, rel);
      console.log('[locales] request', filePath);
      if (!filePath.startsWith(LOCALES)) { res.writeHead(400); return res.end('Bad Request'); }
      fs.stat(filePath, (err, stats) => {
        if (!err && stats.isFile()) return sendFile(res, filePath);
        console.warn('[locales] not found', filePath, err && err.code);
        res.writeHead(404); return res.end('Not found');
      });
      return;
    }

    // Serve config file (readable by the client)
    if (safe === '_config/registrations.json') {
      fs.stat(CONFIG_FILE, (err, stats) => {
        if (!err && stats.isFile()) return sendFile(res, CONFIG_FILE);
        console.warn('[config] registrations.json not found', err && err.code);
        res.writeHead(404); return res.end('Not found');
      });
      return;
    }

    // Admin endpoint to update registrations (POST JSON)
    if (safe === '_admin/registrations' && req.method === 'POST') {
      let body = '';
      req.on('data', chunk => { body += chunk.toString(); });
      req.on('end', () => {
        try {
          const payload = JSON.parse(body);
          if (typeof payload !== 'object' || Array.isArray(payload) || payload === null) {
            res.writeHead(400); return res.end('Bad payload');
          }
          fs.writeFile(CONFIG_FILE, JSON.stringify(payload, null, 2), (err) => {
            if (err) { console.error('[admin] write failed', err); res.writeHead(500); return res.end('Failed to write config'); }
            res.writeHead(200, { 'Content-Type': 'application/json' });
            return res.end(JSON.stringify({ ok: true }));
          });
        } catch (e) {
          console.warn('[admin] invalid JSON', e && e.message);
          res.writeHead(400); return res.end('Invalid JSON');
        }
      });
      return;
    }

    let filePath = path.join(ROOT, safe);
    fs.stat(filePath, (err, stats) => {
      if (!err && stats.isDirectory()) {
        const idx = path.join(filePath, 'index.html');
        fs.access(idx, fs.constants.R_OK, (ie) => {
          if (!ie) return sendFile(res, idx);
          // if directory has no index.html, fall through to root index
          return serveIndex(res);
        });
        return;
      }
      if (!err && stats.isFile()) {
        return sendFile(res, filePath);
      }

      // if the requested path has an extension and wasn't found, log and respond 404
      if (path.extname(filePath)) {
        console.warn('[static] file not found:', filePath);
        // helpful: list top-level dist files for diagnostics
        fs.readdir(ROOT, (reErr, list) => {
          if (!reErr) console.info('[static] dist root listing:', list.slice(0, 50));
          res.writeHead(404);
          return res.end('Not found');
        });
        return;
      }

      // fallback to index.html (SPA)
      return serveIndex(res);
    });
  } catch (e) {
    console.error('[server] unexpected error', e && e.stack);
    res.writeHead(500);
    res.end('Internal Server Error');
  }
});

// improved sendFile with logging and no-cache for HTML
function sendFile(res, filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const type = MIME[ext] || 'application/octet-stream';
  fs.readFile(filePath, (err, data) => {
    if (err) {
      console.error('[sendFile] read error', filePath, err && err.code);
      res.writeHead(500);
      return res.end('Internal Server Error');
    }
    const headers = { 'Content-Type': type };
    // avoid aggressive caching during debugging
    if (ext === '.html' || ext === '.js' || ext === '.css' || ext === '.json') {
      headers['Cache-Control'] = 'no-store';
    } else {
      headers['Cache-Control'] = 'public, max-age=0';
    }
    res.writeHead(200, headers);
    res.end(data);
  });
}

function serveIndex(res) {
  const indexPath = path.join(ROOT, 'index.html');
  fs.access(indexPath, fs.constants.R_OK, (err) => {
    if (err) {
      console.error('[serveIndex] index.html missing at', indexPath, err && err.code);
      // helpful HTML response so browser shows something and you can inspect
      fs.readdir(ROOT, (reErr, files) => {
        const list = (!reErr && Array.isArray(files)) ? files.map(f => `<li>${f}</li>`).join('') : '';
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        return res.end(`<html><body>
          <h1>Index missing</h1>
          <p>index.html was not found at ${ROOT}/index.html</p>
          <p>Top-level files:</p><ul>${list}</ul>
          <p>Check build step and mounted volumes.</p>
        </body></html>`);
      });
      return;
    }
    sendFile(res, indexPath);
  });
}

// startup diagnostics
try {
  const exists = fs.existsSync(ROOT);
  console.log(`[startup] ROOT=${ROOT} exists=${exists}`);
  if (exists) {
    const files = fs.readdirSync(ROOT);
    console.log('[startup] dist contents (top-level):', files.slice(0, 80));
  } else {
    console.warn('[startup] dist directory not found; did "npm run build" run in the builder stage?');
  }
} catch (e) {
  console.error('[startup] error while inspecting dist', e && e.stack);
}

server.listen(PORT, HOST, () => {
  console.log(`Static server running at http://${HOST}:${PORT} serving ${ROOT}, locales ${LOCALES}, config ${CONFIG_FILE}`);
});
