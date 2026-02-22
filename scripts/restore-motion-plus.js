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
const MOTION_PLUS_BASE = 'https://api.motion.dev/registry.tgz?package=motion-plus&version=2.1.0';
const PLACEHOLDER_URL = `${MOTION_PLUS_BASE}&token=${PLACEHOLDER}`;
// Matches any real token in a motion-plus URL (excludes the placeholder itself)
const REAL_TOKEN_PATTERN =
  /https:\/\/api\.motion\.dev\/registry\.tgz\?package=motion-plus&version=2\.1\.0&token=(?!MOTION_PLUS_PLACEHOLDER)[^}\s'"]+/g;

try {
  // Restore package.json
  const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));

  if (packageJson.dependencies?.['motion-plus']) {
    const current = packageJson.dependencies['motion-plus'];
    if (current !== PLACEHOLDER_URL) {
      packageJson.dependencies['motion-plus'] = PLACEHOLDER_URL;
      writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n');
      console.log('✅ Restored placeholder in package.json');
    } else {
      console.log('✅ package.json already has placeholder');
    }
  }

  // Restore pnpm-lock.yaml
  if (existsSync(pnpmLockPath)) {
    const original = readFileSync(pnpmLockPath, 'utf-8');
    const restored = original.replace(REAL_TOKEN_PATTERN, PLACEHOLDER_URL);
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
