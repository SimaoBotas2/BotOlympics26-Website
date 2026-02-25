const fs = require('fs');
const path = require('path');

const root = process.cwd();
const src = path.join(root, 'assets');
const dist = path.join(root, 'dist');
const dest = path.join(dist, 'assets');

function log(msg) {
  process.stdout.write(`[copy-assets] ${msg}\n`);
}

function copyDirSync(from, to) {
  // Node 16+ supports cpSync; keep a fallback for older Node just in case.
  if (fs.cpSync) {
    fs.mkdirSync(to, { recursive: true });
    fs.cpSync(from, to, { recursive: true, force: true });
    return;
  }

  fs.mkdirSync(to, { recursive: true });
  for (const entry of fs.readdirSync(from, { withFileTypes: true })) {
    const fromPath = path.join(from, entry.name);
    const toPath = path.join(to, entry.name);
    if (entry.isDirectory()) {
      copyDirSync(fromPath, toPath);
    } else if (entry.isFile()) {
      fs.copyFileSync(fromPath, toPath);
    }
  }
}

try {
  if (!fs.existsSync(dist)) {
    log('dist/ not found; run `vite build` first.');
    process.exit(1);
  }
  if (!fs.existsSync(src)) {
    log('assets/ not found; nothing to copy.');
    process.exit(0);
  }

  copyDirSync(src, dest);
  log(`Copied ${path.relative(root, src)} -> ${path.relative(root, dest)}`);
} catch (err) {
  log(`Failed: ${err && err.message ? err.message : String(err)}`);
  process.exit(1);
}
