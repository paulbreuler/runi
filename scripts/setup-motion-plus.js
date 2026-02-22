#!/usr/bin/env node
/**
 * Injects the Motion+ token into package.json and pnpm-lock.yaml before install.
 *
 * Replaces the MOTION_PLUS_PLACEHOLDER string with the real token so that
 * `pnpm install --frozen-lockfile` can resolve the private tarball. The token
 * is NEVER committed to source control — run restore-motion-plus.js after
 * install to revert the placeholder (local dev only; CI runners are ephemeral).
 *
 * Usage:
 *   Local:  source .env && node scripts/setup-motion-plus.js
 *   CI:     MOTION_PLUS_TOKEN=<secret> node scripts/setup-motion-plus.js
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');
const packageJsonPath = join(rootDir, 'package.json');
const pnpmLockPath = join(rootDir, 'pnpm-lock.yaml');

const PLACEHOLDER = 'MOTION_PLUS_PLACEHOLDER';

const token = process.env.MOTION_PLUS_TOKEN;

if (!token) {
  console.error('❌ ERROR: MOTION_PLUS_TOKEN environment variable is not set');
  console.error('');
  console.error('Set it in one of these ways:');
  console.error('');
  console.error('1. Create a .env file (recommended for local dev):');
  console.error('   echo "MOTION_PLUS_TOKEN=your_token" > .env');
  console.error('   source .env && node scripts/setup-motion-plus.js');
  console.error('');
  console.error('2. Export directly:');
  console.error('   export MOTION_PLUS_TOKEN=your_token');
  console.error('');
  process.exit(1);
}

try {
  // Update package.json
  const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));

  if (!packageJson.dependencies?.['motion-plus']) {
    console.error('❌ ERROR: motion-plus dependency not found in package.json');
    process.exit(1);
  }

  const currentValue = packageJson.dependencies['motion-plus'];
  if (currentValue.includes(PLACEHOLDER)) {
    packageJson.dependencies['motion-plus'] = currentValue.replace(PLACEHOLDER, token);
    writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n');
    console.log('✅ Injected motion-plus token into package.json');
  } else if (currentValue.includes(token)) {
    console.log('✅ package.json already has the correct token');
  } else {
    // Has a different real token — replace it
    const updated = currentValue.replace(/token=[^&\s}'"]+/, `token=${token}`);
    packageJson.dependencies['motion-plus'] = updated;
    writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n');
    console.log('✅ Updated motion-plus token in package.json');
  }

  // Update pnpm-lock.yaml — replace PLACEHOLDER with real token
  if (existsSync(pnpmLockPath)) {
    const original = readFileSync(pnpmLockPath, 'utf-8');
    const updated = original.replaceAll(PLACEHOLDER, token);
    if (updated !== original) {
      writeFileSync(pnpmLockPath, updated);
      console.log('✅ Injected motion-plus token into pnpm-lock.yaml');
    } else {
      console.log('✅ pnpm-lock.yaml already has the correct token');
    }
  }
} catch (error) {
  console.error('❌ ERROR: Failed to update package files:', error.message);
  process.exit(1);
}
