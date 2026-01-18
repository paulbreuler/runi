import { describe, expect, it } from 'vitest';
import { type AppError, createFrontendError, fromBackendError, isAppError } from './errors';

describe('errors', () => {
  describe('createFrontendError', () => {
    it('creates error with required fields', () => {
      const error = createFrontendError('TEST_CODE', 'Test message');
      expect(error.code).toBe('TEST_CODE');
      expect(error.message).toBe('Test message');
      expect(error.source).toBe('frontend');
      expect(error.correlationId).toBeDefined();
      expect(typeof error.timestamp).toBe('number');
    });

    it('generates correlation ID if not provided', () => {
      const error1 = createFrontendError('CODE', 'Message');
      const error2 = createFrontendError('CODE', 'Message');
      expect(error1.correlationId).toBeDefined();
      expect(error2.correlationId).toBeDefined();
      expect(error1.correlationId).not.toBe(error2.correlationId);
    });

    it('uses provided correlation ID', () => {
      const correlationId = 'test-correlation-id';
      const error = createFrontendError('CODE', 'Message', correlationId);
      expect(error.correlationId).toBe(correlationId);
    });

    it('includes optional details', () => {
      const details = { url: 'https://example.com', status: 500 };
      const error = createFrontendError('CODE', 'Message', undefined, details);
      expect(error.details).toEqual(details);
    });
  });

  describe('fromBackendError', () => {
    it('converts backend error to frontend error', () => {
      const backendError = {
        correlation_id: 'backend-id',
        code: 'BACKEND_CODE',
        message: 'Backend message',
      };
      const error = fromBackendError(backendError);
      expect(error.correlationId).toBe('backend-id');
      expect(error.code).toBe('BACKEND_CODE');
      expect(error.message).toBe('Backend message');
      expect(error.source).toBe('backend');
      expect(typeof error.timestamp).toBe('number');
    });

    it('includes optional details', () => {
      const backendError = {
        correlation_id: 'id',
        code: 'CODE',
        message: 'Message',
        details: { key: 'value' },
      };
      const error = fromBackendError(backendError);
      expect(error.details).toEqual({ key: 'value' });
    });

    it('converts snake_case to camelCase', () => {
      const backendError = {
        correlation_id: 'test-id',
        code: 'CODE',
        message: 'Message',
      };
      const error = fromBackendError(backendError);
      expect(error.correlationId).toBe('test-id');
    });
  });

  describe('isAppError', () => {
    it('returns true for valid AppError', () => {
      const error: AppError = {
        correlationId: 'id',
        code: 'CODE',
        message: 'Message',
        source: 'frontend',
        timestamp: Date.now(),
      };
      expect(isAppError(error)).toBe(true);
    });

    it('returns true for backend AppError', () => {
      const error: AppError = {
        correlationId: 'id',
        code: 'CODE',
        message: 'Message',
        source: 'backend',
        timestamp: Date.now(),
      };
      expect(isAppError(error)).toBe(true);
    });

    it('returns false for regular Error', () => {
      const error = new Error('Test error');
      expect(isAppError(error)).toBe(false);
    });

    it('returns false for string', () => {
      expect(isAppError('error string')).toBe(false);
    });

    it('returns false for null', () => {
      expect(isAppError(null)).toBe(false);
    });

    it('returns false for undefined', () => {
      expect(isAppError(undefined)).toBe(false);
    });

    it('returns false for object missing required fields', () => {
      const error = { message: 'Missing fields' };
      expect(isAppError(error)).toBe(false);
    });

    it('returns false for object with wrong source', () => {
      const error = {
        correlationId: 'id',
        code: 'CODE',
        message: 'Message',
        source: 'invalid',
        timestamp: Date.now(),
      };
      expect(isAppError(error)).toBe(false);
    });

    it('returns true for Error object with nested appError property', () => {
      const appError: AppError = {
        correlationId: 'id',
        code: 'CODE',
        message: 'Message',
        source: 'frontend',
        timestamp: Date.now(),
      };
      const errorObj = new Error('Test error');
      (errorObj as Error & { appError: AppError }).appError = appError;
      expect(isAppError(errorObj)).toBe(true);
    });

    it('returns false for Error object without appError property', () => {
      const error = new Error('Test error');
      expect(isAppError(error)).toBe(false);
    });
  });
});
