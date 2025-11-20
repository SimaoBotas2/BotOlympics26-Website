const fs = require('fs');
const path = require('path');

function loadJson(p) {
  try {
    return JSON.parse(fs.readFileSync(p, 'utf8'));
  } catch (err) {
    console.error(`Failed to load JSON from ${p}: ${err.message}`);
    process.exit(2);
  }
}

function typeOf(v) {
  if (v === null) return 'null';
  if (Array.isArray(v)) return 'array';
  return typeof v;
}

function compare(a, b, p = '') {
  const errors = [];

  const ta = typeOf(a);
  const tb = typeOf(b);
  if (ta !== tb) {
    errors.push(`${p || 'root'}: type mismatch -> ${ta} !== ${tb}`);
    return errors;
  }

  if (ta === 'object') {
    const keysA = Object.keys(a).sort();
    const keysB = Object.keys(b).sort();
    const onlyA = keysA.filter(k => !keysB.includes(k));
    const onlyB = keysB.filter(k => !keysA.includes(k));
    if (onlyA.length) errors.push(`${p || 'root'}: keys missing in target: ${onlyA.join(', ')}`);
    if (onlyB.length) errors.push(`${p || 'root'}: extra keys in target: ${onlyB.join(', ')}`);
    const common = keysA.filter(k => keysB.includes(k));
    for (const k of common) {
      errors.push(...compare(a[k], b[k], p ? `${p}.${k}` : k));
    }
    return errors;
  }

  if (ta === 'array') {
    if (a.length !== b.length) {
      errors.push(`${p || 'root'}: array length mismatch -> ${a.length} !== ${b.length}`);
      // still attempt to compare up to min length for helpful hints
    }
    const n = Math.min(a.length, b.length);
    for (let i = 0; i < n; i++) {
      errors.push(...compare(a[i], b[i], `${p || 'root'}[${i}]`));
    }
    return errors;
  }

  // primitive: only check type (already same), nothing else required
  return errors;
}

function main() {
  const root = path.resolve(__dirname, '..', 'src', 'locales');
  const enPath = path.join(root, 'en.json');
  const ptPath = path.join(root, 'pt.json');

  if (!fs.existsSync(enPath) || !fs.existsSync(ptPath)) {
    console.error('Locale files not found at src/locales/en.json and src/locales/pt.json');
    process.exit(2);
  }

  const en = loadJson(enPath);
  const pt = loadJson(ptPath);

  const errors = compare(en, pt);

  if (errors.length) {
    console.error('\ni18n structure mismatch detected:\n');
    errors.forEach((e) => console.error(' -', e));
    console.error('\nFix the keys/structure so both locales have the same shape (keys and array lengths/types).\n');
    process.exit(1);
  }

  console.log('i18n structure check passed: en.json and pt.json shapes match.');
  process.exit(0);
}

main();
