#!/usr/bin/env node
/**
 * Injects the Motion+ token into package.json and pnpm-lock.yaml before install.
 *
 * Replaces the MOTION_PLUS_PLACEHOLDER string with the real token so that
 * `pnpm install --no-frozen-lockfile` can resolve the private tarball.
 * (--no-frozen-lockfile is required because pnpm's strict YAML pre-validation
 * rejects the URL-based tarball key produced by token injection.)
 * The token is NEVER committed to source control — run restore-motion-plus.js
 * after install to revert the placeholder (local dev only; CI runners are
 * ephemeral).
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
  console.log('⚠️  MOTION_PLUS_TOKEN not set; continuing with Motion+ fallback mode.');
  process.exit(0);
}

try {
  // Update package.json
  const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));

  const dependencyGroup =
    packageJson.dependencies?.['motion-plus'] !== undefined
      ? 'dependencies'
      : packageJson.optionalDependencies?.['motion-plus'] !== undefined
        ? 'optionalDependencies'
        : null;

  if (dependencyGroup === null) {
    console.error('❌ ERROR: motion-plus dependency not found in package.json');
    process.exit(1);
  }

  const currentValue = packageJson[dependencyGroup]['motion-plus'];
  if (currentValue.includes(PLACEHOLDER)) {
    packageJson[dependencyGroup]['motion-plus'] = currentValue.replace(PLACEHOLDER, token);
    writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n');
    console.log('✅ Injected motion-plus token into package.json');
  } else if (currentValue.includes(token)) {
    console.log('✅ package.json already has the correct token');
  } else {
    // Has a different real token — replace it
    // Use the same broad class as restore-motion-plus.js ([^&\s}'"]+) to handle
    // any URL-safe characters (including '.', '+', '%') without partial replacement.
    const updated = currentValue.replace(/token=[^&\s}'"]+/, `token=${token}`);
    packageJson[dependencyGroup]['motion-plus'] = updated;
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
