#!/usr/bin/env node
/**
 * Setup script for motion-plus package.
 * Reads MOTION_PLUS_TOKEN from environment variable and injects it into
 * package.json and pnpm-lock.yaml so that `pnpm install --frozen-lockfile`
 * can resolve the private tarball in CI.
 *
 * Usage:
 *   Local:  source .env && node scripts/setup-motion-plus.js
 *   CI:     MOTION_PLUS_TOKEN=${{ secrets.MOTION_PLUS_TOKEN }} node scripts/setup-motion-plus.js
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');
const packageJsonPath = join(rootDir, 'package.json');
const pnpmLockPath = join(rootDir, 'pnpm-lock.yaml');

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

const MOTION_PLUS_BASE = 'https://api.motion.dev/registry.tgz?package=motion-plus&version=2.1.0';
const motionPlusUrl = `${MOTION_PLUS_BASE}&token=${token}`;
// Matches any existing motion-plus URL regardless of which token it carries
const motionPlusUrlPattern =
  /https:\/\/api\.motion\.dev\/registry\.tgz\?package=motion-plus&version=2\.1\.0&token=[^'"\s]*/g;

try {
  // Update package.json
  const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));

  if (packageJson.dependencies?.['motion-plus']) {
    const currentValue = packageJson.dependencies['motion-plus'];
    if (currentValue !== motionPlusUrl) {
      packageJson.dependencies['motion-plus'] = motionPlusUrl;
      writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n');
      console.log('✅ Updated package.json with motion-plus token');
    } else {
      console.log('✅ package.json already has correct token');
    }
  } else {
    console.error('❌ ERROR: motion-plus dependency not found in package.json');
    process.exit(1);
  }

  // Update pnpm-lock.yaml — replace every occurrence of the motion-plus URL
  // so that `pnpm install --frozen-lockfile` succeeds in CI with the new token.
  if (existsSync(pnpmLockPath)) {
    const original = readFileSync(pnpmLockPath, 'utf-8');
    const updated = original.replace(motionPlusUrlPattern, motionPlusUrl);
    if (updated !== original) {
      writeFileSync(pnpmLockPath, updated);
      console.log('✅ Updated pnpm-lock.yaml with motion-plus token');
    } else {
      console.log('✅ pnpm-lock.yaml already has correct token');
    }
  }
} catch (error) {
  console.error('❌ ERROR: Failed to update package files:', error.message);
  process.exit(1);
}
