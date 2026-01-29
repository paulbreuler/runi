#!/usr/bin/env node
/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 *
 * Validation script for startup-timing.json file.
 * Checks that the file exists, has correct structure, and contains valid data.
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';

/**
 * Get the app data directory path based on platform.
 */
function getAppDataDir() {
  const platform = process.platform;
  let appDataDir;

  if (platform === 'darwin') {
    // macOS
    appDataDir = path.join(os.homedir(), 'Library', 'Application Support', 'com.runi');
  } else if (platform === 'win32') {
    // Windows
    appDataDir = path.join(process.env.APPDATA || os.homedir(), 'com.runi');
  } else {
    // Linux
    appDataDir = path.join(
      process.env.XDG_DATA_HOME || path.join(os.homedir(), '.local', 'share'),
      'com.runi'
    );
  }

  return appDataDir;
}

/**
 * Validate the startup timing file.
 */
function validateStartupTiming() {
  const appDataDir = getAppDataDir();
  const timingFile = path.join(appDataDir, 'startup-timing.json');

  console.log(`Checking for startup timing file at: ${timingFile}`);

  // Check if file exists
  if (!fs.existsSync(timingFile)) {
    console.error('❌ ERROR: startup-timing.json file does not exist');
    console.error(`   Expected location: ${timingFile}`);
    console.error('   Make sure you have launched the app at least once.');
    process.exit(1);
  }

  console.log('✅ File exists');

  // Read and parse the file
  let data;
  try {
    const content = fs.readFileSync(timingFile, 'utf8');
    data = JSON.parse(content);
    console.log('✅ File is valid JSON');
  } catch (error) {
    console.error('❌ ERROR: Failed to parse JSON file');
    console.error(`   ${error.message}`);
    process.exit(1);
  }

  // Validate structure
  const errors = [];

  if (!data.latest) {
    errors.push('Missing "latest" field');
  } else {
    if (!data.latest.timestamp) errors.push('Missing "latest.timestamp"');
    if (!data.latest.platform) errors.push('Missing "latest.platform"');
    if (!data.latest.architecture) errors.push('Missing "latest.architecture"');
    if (!data.latest.buildMode) errors.push('Missing "latest.buildMode"');
    if (!data.latest.systemSpecs) errors.push('Missing "latest.systemSpecs"');
    if (!data.latest.timing) errors.push('Missing "latest.timing"');
    if (!data.latest.unit) errors.push('Missing "latest.unit"');

    if (data.latest.systemSpecs) {
      if (!data.latest.systemSpecs.cpuModel) errors.push('Missing "latest.systemSpecs.cpuModel"');
      if (typeof data.latest.systemSpecs.cpuCores !== 'number')
        errors.push('Invalid "latest.systemSpecs.cpuCores" (must be number)');
      if (typeof data.latest.systemSpecs.totalMemoryGb !== 'number')
        errors.push('Invalid "latest.systemSpecs.totalMemoryGb" (must be number)');
      if (typeof data.latest.systemSpecs.bundleSizeMb !== 'number')
        errors.push('Invalid "latest.systemSpecs.bundleSizeMb" (must be number)');
    }

    if (data.latest.timing) {
      if (typeof data.latest.timing.processStartup !== 'number')
        errors.push('Invalid "latest.timing.processStartup" (must be number)');
      if (typeof data.latest.timing.domContentLoaded !== 'number')
        errors.push('Invalid "latest.timing.domContentLoaded" (must be number)');
      if (typeof data.latest.timing.windowLoaded !== 'number')
        errors.push('Invalid "latest.timing.windowLoaded" (must be number)');
      if (typeof data.latest.timing.reactMounted !== 'number')
        errors.push('Invalid "latest.timing.reactMounted" (must be number)');
      if (typeof data.latest.timing.total !== 'number')
        errors.push('Invalid "latest.timing.total" (must be number)');
    }
  }

  if (!data.aggregates) {
    errors.push('Missing "aggregates" field');
  } else {
    if (!Array.isArray(data.aggregates.last3)) {
      errors.push('Missing or invalid "aggregates.last3" (must be array)');
    } else {
      if (data.aggregates.last3.length > 3) {
        errors.push(
          `"aggregates.last3" has ${data.aggregates.last3.length} entries (should be ≤ 3)`
        );
      }
    }

    if (!data.aggregates.average) {
      errors.push('Missing "aggregates.average"');
    } else {
      if (typeof data.aggregates.average.processStartup !== 'number')
        errors.push('Invalid "aggregates.average.processStartup" (must be number)');
      if (typeof data.aggregates.average.domContentLoaded !== 'number')
        errors.push('Invalid "aggregates.average.domContentLoaded" (must be number)');
      if (typeof data.aggregates.average.windowLoaded !== 'number')
        errors.push('Invalid "aggregates.average.windowLoaded" (must be number)');
      if (typeof data.aggregates.average.reactMounted !== 'number')
        errors.push('Invalid "aggregates.average.reactMounted" (must be number)');
      if (typeof data.aggregates.average.total !== 'number')
        errors.push('Invalid "aggregates.average.total" (must be number)');
    }

    if (typeof data.aggregates.count !== 'number') {
      errors.push('Invalid "aggregates.count" (must be number)');
    }
  }

  if (errors.length > 0) {
    console.error('❌ Validation errors:');
    errors.forEach((error) => console.error(`   - ${error}`));
    process.exit(1);
  }

  console.log('✅ File structure is valid');

  // Display summary
  console.log('\n📊 Startup Timing Summary:');
  console.log(`   Latest startup: ${data.latest.timing.total.toFixed(2)}ms (total)`);
  if (data.latest.timing.processStartup > 0) {
    console.log(`     - Process startup: ${data.latest.timing.processStartup.toFixed(2)}ms`);
    console.log(
      `     - Frontend startup: ${(data.latest.timing.total - data.latest.timing.processStartup).toFixed(2)}ms`
    );
  }
  if (data.latest.buildMode) {
    console.log(`   Build mode: ${data.latest.buildMode}`);
  }
  if (data.latest.systemSpecs) {
    console.log(
      `   System: ${data.latest.systemSpecs.cpuModel} (${data.latest.systemSpecs.cpuCores} cores, ${data.latest.systemSpecs.totalMemoryGb.toFixed(1)}GB RAM)`
    );
    console.log(`   Bundle Size: ${data.latest.systemSpecs.bundleSizeMb.toFixed(2)}MB`);
  }
  console.log(`   Average startup: ${data.aggregates.average.total.toFixed(2)}ms (total)`);
  if (data.aggregates.average.processStartup > 0) {
    console.log(`     - Process startup: ${data.aggregates.average.processStartup.toFixed(2)}ms`);
    console.log(
      `     - Frontend startup: ${(data.aggregates.average.total - data.aggregates.average.processStartup).toFixed(2)}ms`
    );
  }
  console.log(`   Total startups: ${data.aggregates.count}`);
  console.log(`   Last 3 startups: ${data.aggregates.last3.length} entries`);

  if (data.aggregates.last3.length > 0) {
    console.log('\n   Last 3 startup times:');
    data.aggregates.last3.forEach((entry, index) => {
      console.log(
        `   ${index + 1}. ${entry.timing.total.toFixed(2)}ms (${new Date(entry.timestamp).toLocaleString()})`
      );
    });
  }

  console.log('\n✅ All validations passed!');
}

// Run validation
try {
  validateStartupTiming();
} catch (error) {
  console.error('❌ Unexpected error:', error);
  process.exit(1);
}
