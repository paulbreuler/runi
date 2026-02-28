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
// replace only the token value. The inner character class is [^'"}\s]+ (allows &)
// so it spans across multiple query parameters (e.g. package=...&version=...&token=).
// Using [^&'"}\s]+ would stop at the first & and fail to reach &token=.
// The negative lookahead ensures placeholder URLs are never re-processed.
const REAL_TOKEN_PATTERN =
  /(https:\/\/api\.motion\.dev\/registry\.tgz\?[^'"}\s]+&token=)(?!MOTION_PLUS_PLACEHOLDER)[^&\s}'"]+/g;

try {
  // Restore package.json
  const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));

  const dependencyGroup =
    packageJson.dependencies?.['motion-plus'] !== undefined
      ? 'dependencies'
      : packageJson.optionalDependencies?.['motion-plus'] !== undefined
        ? 'optionalDependencies'
        : null;

  if (dependencyGroup !== null) {
    const current = packageJson[dependencyGroup]['motion-plus'];
    // Replace only the token value, preserving the version and base URL
    const restored = current.replace(
      /(&token=)(?!MOTION_PLUS_PLACEHOLDER)[^&\s}'"]+/,
      `$1${PLACEHOLDER}`
    );
    if (restored !== current) {
      packageJson[dependencyGroup]['motion-plus'] = restored;
      writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n');
      console.log('✅ Restored placeholder in package.json');
    } else if (current.includes('api.motion.dev') && !current.includes(PLACEHOLDER)) {
      // The regex failed to match a real token — the URL format may have changed.
      console.error(
        '❌ package.json contains a motion.dev URL but the token could not be replaced. Possible credential leak.'
      );
      process.exit(1);
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
    } else if (original.includes('api.motion.dev') && !original.includes(PLACEHOLDER)) {
      // The regex failed to match a real token — the URL format may have changed.
      console.error(
        '❌ pnpm-lock.yaml contains a motion.dev URL but no placeholder was found or restored. Possible credential leak.'
      );
      process.exit(1);
    } else {
      console.log('✅ pnpm-lock.yaml already has placeholder');
    }
  }
} catch (error) {
  console.error('❌ ERROR: Failed to restore placeholder:', error.message);
  process.exit(1);
}
