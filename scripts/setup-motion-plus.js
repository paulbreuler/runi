#!/usr/bin/env node
/**
 * Setup script for motion-plus package.
 * Reads MOTION_PLUS_TOKEN from .npmrc or environment variable and injects it into package.json and package-lock.json
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');
const packageJsonPath = join(rootDir, 'package.json');
const packageLockPath = join(rootDir, 'package-lock.json');
const npmrcPath = join(rootDir, '.npmrc');

// Try to read token from .npmrc first, then fall back to environment variable
let token = process.env.MOTION_PLUS_TOKEN;

if (!token && existsSync(npmrcPath)) {
  try {
    const npmrcContent = readFileSync(npmrcPath, 'utf-8');
    // Look for MOTION_PLUS_TOKEN=token or motion-plus-token=token
    const tokenMatch = npmrcContent.match(/MOTION_PLUS_TOKEN\s*=\s*([^\s\n]+)/);
    if (tokenMatch) {
      token = tokenMatch[1];
    }
  } catch (error) {
    // If we can't read .npmrc, continue to check env var
  }
}

if (!token) {
  console.error('❌ ERROR: MOTION_PLUS_TOKEN not found');
  console.error('');
  console.error('Please set it in one of these ways:');
  console.error('');
  console.error('1. Add to .npmrc (recommended):');
  console.error('   echo "MOTION_PLUS_TOKEN=your_token_here" >> .npmrc');
  console.error('');
  console.error('2. Set as environment variable:');
  console.error('   export MOTION_PLUS_TOKEN=your_token_here');
  console.error('');
  console.error('3. Create a .env file:');
  console.error('   echo "MOTION_PLUS_TOKEN=your_token_here" > .env');
  console.error('');
  process.exit(1);
}

const motionPlusUrl = `https://api.motion.dev/registry.tgz?package=motion-plus&version=2.1.0&token=${token}`;

try {
  // Update package.json
  const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));

  if (packageJson.dependencies && packageJson.dependencies['motion-plus']) {
    const currentValue = packageJson.dependencies['motion-plus'];
    if (currentValue !== motionPlusUrl && currentValue !== 'PLACEHOLDER_MOTION_PLUS_TOKEN') {
      // Only update if it's the placeholder or different
      packageJson.dependencies['motion-plus'] = motionPlusUrl;
      writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n');
      console.log('✅ Updated package.json with motion-plus token');
    }
  } else {
    console.error('❌ ERROR: motion-plus dependency not found in package.json');
    process.exit(1);
  }

  // Update package-lock.json if it exists
  try {
    const packageLock = JSON.parse(readFileSync(packageLockPath, 'utf-8'));
    let updated = false;

    // Update in dependencies section
    if (packageLock.dependencies && packageLock.dependencies['motion-plus']) {
      const current = packageLock.dependencies['motion-plus'].resolved;
      if (current && (current === 'PLACEHOLDER_MOTION_PLUS_TOKEN' || !current.includes('token='))) {
        packageLock.dependencies['motion-plus'].resolved = motionPlusUrl;
        updated = true;
      }
    }

    // Update in node_modules section
    if (packageLock.packages && packageLock.packages['node_modules/motion-plus']) {
      const current = packageLock.packages['node_modules/motion-plus'].resolved;
      if (current && (current === 'PLACEHOLDER_MOTION_PLUS_TOKEN' || !current.includes('token='))) {
        packageLock.packages['node_modules/motion-plus'].resolved = motionPlusUrl;
        updated = true;
      }
    }

    if (updated) {
      writeFileSync(packageLockPath, JSON.stringify(packageLock, null, 2) + '\n');
      console.log('✅ Updated package-lock.json with motion-plus token');
    }
  } catch (error) {
    // package-lock.json might not exist yet, that's okay
    if (error.code !== 'ENOENT') {
      console.warn('⚠️  Warning: Could not update package-lock.json:', error.message);
    }
  }
} catch (error) {
  console.error('❌ ERROR: Failed to update package files:', error.message);
  process.exit(1);
}
