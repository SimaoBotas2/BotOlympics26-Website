import { defineConfig } from 'vite';
import fs from 'fs';
import path from 'path';

const CONFIG_PATH = path.resolve(process.cwd(), 'config', 'registrations.json');

export default defineConfig({
  plugins: [
    {
      name: 'dev-config-endpoints',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          try {
            // handle gallery listing in dev: GET /_gallery?dir=/assets/previous
            if (req.url && req.url.startsWith('/_gallery') && req.method === 'GET') {
              try {
                const parsed = new URL(req.url, 'http://localhost');
                const dirParam = parsed.searchParams.get('dir');
                if (!dirParam) {
                  res.statusCode = 400;
                  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
                  return res.end('Missing dir');
                }
                const rel = String(dirParam).replace(/^\/+/, '');
                // try common locations where static assets may live in dev
                const candidates = [
                  path.join(process.cwd(), 'public', rel),
                  path.join(process.cwd(), 'dist', rel),
                  path.join(process.cwd(), rel)
                ];
                let found = null;
                for (const c of candidates) {
                  try {
                    const st = fs.statSync(c);
                    if (st.isDirectory()) { found = c; break; }
                  } catch (e) {}
                }
                if (!found) {
                  res.statusCode = 404;
                  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
                  return res.end('Not found');
                }
                const files = fs.readdirSync(found);
                const exts = new Set(['.png', '.jpg', '.jpeg', '.webp', '.gif', '.svg', '.bmp']);
                const urls = files
                  .filter(f => exts.has(path.extname(f).toLowerCase()))
                  .sort()
                  .map(f => '/' + path.posix.join(rel, f).replace(/\\/g, '/'));
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json; charset=utf-8');
                return res.end(JSON.stringify(urls));
              } catch (err) {
                res.statusCode = 500;
                res.setHeader('Content-Type', 'text/plain; charset=utf-8');
                return res.end('Failed to list gallery');
              }
            }
            // GET /_config/registrations.json
            if (req.url === '/_config/registrations.json' && req.method === 'GET') {
              fs.readFile(CONFIG_PATH, 'utf8', (err, data) => {
                if (err) {
                  res.statusCode = 404;
                  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
                  return res.end('Not found');
                }
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json; charset=utf-8');
                return res.end(data);
              });
              return;
            }

            // POST /_admin/registrations
            // Disabled in deployment for safety, just edit the file directly
            //if (req.url === '/_admin/registrations' && req.method === 'POST') {
            //  let body = '';
            //  req.on('data', (chunk) => { body += chunk; });
            //  req.on('end', () => {
            //    try {
            //      const payload = JSON.parse(body);
            //      if (typeof payload !== 'object' || Array.isArray(payload) || payload === null) {
            //        res.statusCode = 400;
            //        res.setHeader('Content-Type', 'text/plain; charset=utf-8');
            //        return res.end('Bad payload');
            //      }
            //      // ensure config dir exists
            //      fs.mkdir(path.dirname(CONFIG_PATH), { recursive: true }, (mkErr) => {
            //        if (mkErr) {
            //          res.statusCode = 500;
            //          res.setHeader('Content-Type', 'text/plain; charset=utf-8');
            //          return res.end('Failed to write config');
            //        }
            //        fs.writeFile(CONFIG_PATH, JSON.stringify(payload, null, 2), 'utf8', (wErr) => {
            //          if (wErr) {
            //            res.statusCode = 500;
            //            res.setHeader('Content-Type', 'text/plain; charset=utf-8');
            //            return res.end('Failed to write config');
            //          }
            //          res.statusCode = 200;
            //          res.setHeader('Content-Type', 'application/json; charset=utf-8');
            //          return res.end(JSON.stringify({ ok: true }));
            //        });
            //      });
            //    } catch (e) {
            //      res.statusCode = 400;
            //      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
            //      return res.end('Invalid JSON');
            //    }
            //  });
            //  return;
            //}
          } catch (e) {
            // fallthrough to next middleware on unexpected errors
          }
          return next();
        });
      }
    }
  ],
  server: { port: 3000 }
});
