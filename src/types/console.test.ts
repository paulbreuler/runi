/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

import { describe, expect, it } from 'vitest';
import { isUpdatingLog, type ConsoleLog } from './console';

describe('console types', () => {
  describe('isUpdatingLog', () => {
    it('returns true when log has isUpdating set to true', () => {
      const log: ConsoleLog = {
        id: 'test-id',
        level: 'info',
        message: 'Test message',
        args: [],
        timestamp: Date.now(),
        isUpdating: true,
      };
      expect(isUpdatingLog(log)).toBe(true);
    });

    it('returns false when log has isUpdating set to false', () => {
      const log: ConsoleLog = {
        id: 'test-id',
        level: 'info',
        message: 'Test message',
        args: [],
        timestamp: Date.now(),
        isUpdating: false,
      };
      expect(isUpdatingLog(log)).toBe(false);
    });

    it('returns false when log does not have isUpdating property', () => {
      const log: ConsoleLog = {
        id: 'test-id',
        level: 'info',
        message: 'Test message',
        args: [],
        timestamp: Date.now(),
      };
      expect(isUpdatingLog(log)).toBe(false);
    });

    it('returns false when isUpdating is undefined', () => {
      const log: ConsoleLog = {
        id: 'test-id',
        level: 'info',
        message: 'Test message',
        args: [],
        timestamp: Date.now(),
        isUpdating: undefined,
      };
      expect(isUpdatingLog(log)).toBe(false);
    });
  });
});
