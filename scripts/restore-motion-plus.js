#!/usr/bin/env node
/**
 * Restores the MOTION_PLUS_PLACEHOLDER in package.json and pnpm-lock.yaml
 * after a local install so the real token is never accidentally committed.
 *
 * Run automatically by `just install`. Not needed in CI (runners are ephemeral).
 *
 * Usage:
 *   node scripts/restore-motion-plus.js
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
// Version-agnostic: captures everything up to and including "&token=" so we can
// replace only the token value. Motion tokens are URL-safe (letters, digits, _ and -),
// so [^&\s}'".]+ safely captures the value without over-matching into other parameters.
// The negative lookahead ensures placeholder URLs are never re-processed.
const REAL_TOKEN_PATTERN =
  /(https:\/\/api\.motion\.dev\/registry\.tgz\?[^&'"}\s]+&token=)(?!MOTION_PLUS_PLACEHOLDER)[^&\s}'"]+/g;

try {
  // Restore package.json
  const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));

  if (packageJson.dependencies?.['motion-plus']) {
    const current = packageJson.dependencies['motion-plus'];
    // Replace only the token value, preserving the version and base URL
    const restored = current.replace(
      /(&token=)(?!MOTION_PLUS_PLACEHOLDER)[a-zA-Z0-9_-]+/,
      `$1${PLACEHOLDER}`
    );
    if (restored !== current) {
      packageJson.dependencies['motion-plus'] = restored;
      writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n');
      console.log('✅ Restored placeholder in package.json');
    } else {
      console.log('✅ package.json already has placeholder');
    }
  }

  // Restore pnpm-lock.yaml
  if (existsSync(pnpmLockPath)) {
    const original = readFileSync(pnpmLockPath, 'utf-8');
    const restored = original.replace(REAL_TOKEN_PATTERN, `$1${PLACEHOLDER}`);
    if (restored !== original) {
      writeFileSync(pnpmLockPath, restored);
      console.log('✅ Restored placeholder in pnpm-lock.yaml');
    } else {
      console.log('✅ pnpm-lock.yaml already has placeholder');
    }
  }
} catch (error) {
  console.error('❌ ERROR: Failed to restore placeholder:', error.message);
  process.exit(1);
}
