#!/usr/bin/env node
// Auto-bumps package.json's patch version on every commit, then stages it so it's included automatically.
import { readFileSync, writeFileSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const pkgPath = fileURLToPath(new URL('../package.json', import.meta.url));
const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'));

const [major, minor, patch] = pkg.version.split('.').map(Number);
pkg.version = `${major}.${minor}.${patch + 1}`;

writeFileSync(pkgPath, `${JSON.stringify(pkg, null, 2)}\n`);
execSync('git add package.json', { cwd: fileURLToPath(new URL('..', import.meta.url)) });

console.log(`Version bumped to ${pkg.version}`);
