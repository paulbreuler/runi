#!/usr/bin/env node
/**
 * Setup script for motion-plus package.
 * Reads MOTION_PLUS_TOKEN from environment variable and injects it into package.json
 *
 * Usage:
 *   Local:  source .env && node scripts/setup-motion-plus.js
 *   CI:     MOTION_PLUS_TOKEN=${{ secrets.MOTION_PLUS_TOKEN }} node scripts/setup-motion-plus.js
 */

import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');
const packageJsonPath = join(rootDir, 'package.json');
const packageLockPath = join(rootDir, 'package-lock.json');

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

const motionPlusUrl = `https://api.motion.dev/registry.tgz?package=motion-plus&version=2.1.0&token=${token}`;

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

  // Update package-lock.json if it exists
  try {
    const packageLock = JSON.parse(readFileSync(packageLockPath, 'utf-8'));
    let updated = false;

    if (packageLock.packages?.['node_modules/motion-plus']) {
      const current = packageLock.packages['node_modules/motion-plus'].resolved;
      if (current !== motionPlusUrl) {
        packageLock.packages['node_modules/motion-plus'].resolved = motionPlusUrl;
        updated = true;
      }
    }

    if (packageLock.packages?.['']) {
      const deps = packageLock.packages[''].dependencies;
      if (deps?.['motion-plus'] && deps['motion-plus'] !== motionPlusUrl) {
        deps['motion-plus'] = motionPlusUrl;
        updated = true;
      }
    }

    if (updated) {
      writeFileSync(packageLockPath, JSON.stringify(packageLock, null, 2) + '\n');
      console.log('✅ Updated package-lock.json with motion-plus token');
    }
  } catch {
    // package-lock.json might not exist yet
  }
} catch (error) {
  console.error('❌ ERROR: Failed to update package files:', error.message);
  process.exit(1);
}
