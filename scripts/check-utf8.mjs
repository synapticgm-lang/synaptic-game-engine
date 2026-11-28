#!/usr/bin/env node
/**
 * Fails when any file under src/ has a UTF-8 BOM or is not valid UTF-8.
 * Does not judge semantic mojibake — only byte-level encoding.
 */
import fs from 'fs';
import path from 'path';

const ROOT = path.resolve('src');
const failures = [];

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(full);
      continue;
    }
    if (!entry.isFile()) continue;
    const buf = fs.readFileSync(full);
    if (buf.length >= 3 && buf[0] === 0xef && buf[1] === 0xbb && buf[2] === 0xbf) {
      failures.push(`${path.relative(process.cwd(), full)}: UTF-8 BOM`);
      continue;
    }
    try {
      new TextDecoder('utf-8', { fatal: true }).decode(buf);
    } catch {
      failures.push(`${path.relative(process.cwd(), full)}: invalid UTF-8`);
    }
  }
}

if (!fs.existsSync(ROOT)) {
  console.error('check-utf8: src/ not found');
  process.exit(1);
}

walk(ROOT);

if (failures.length) {
  console.error('check-utf8 failed:');
  for (const line of failures) console.error('  ' + line);
  process.exit(1);
}

console.log('check-utf8: src/ is valid UTF-8 with no BOM');
