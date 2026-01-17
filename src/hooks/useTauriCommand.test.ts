import { renderHook, waitFor, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useTauriCommand } from './useTauriCommand';
import { invoke } from '@tauri-apps/api/core';

vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn(),
}));

describe('useTauriCommand', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('initializes with null data, null error, and false loading', () => {
    const { result } = renderHook(() => useTauriCommand<string>('test_command'));

    expect(result.current.data).toBeNull();
    expect(result.current.error).toBeNull();
    expect(result.current.isLoading).toBe(false);
    expect(typeof result.current.execute).toBe('function');
  });

  it('sets loading to true when execute is called', async () => {
    // Use a promise that doesn't resolve immediately to test loading state
    let resolvePromise: (value: string) => void;
    const delayedPromise = new Promise<string>((resolve) => {
      resolvePromise = resolve;
    });
    vi.mocked(invoke).mockReturnValue(delayedPromise);

    const { result } = renderHook(() => useTauriCommand<string>('test_command'));

    // Start execute and wait for loading to be true
    let executePromise: Promise<string | null>;
    await act(async () => {
      executePromise = result.current.execute();
    });

    // Loading should be true while promise is pending
    await waitFor(() => {
      expect(result.current.isLoading).toBe(true);
    });

    // Resolve the promise
    await act(async () => {
      resolvePromise!('test result');
      await executePromise!;
    });

    // Loading should be false after promise resolves
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
  });

  it('sets loading to false after execute completes', async () => {
    vi.mocked(invoke).mockResolvedValue('test result');
    const { result } = renderHook(() => useTauriCommand<string>('test_command'));

    await act(async () => {
      await result.current.execute();
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
  });

  it('sets data when command succeeds', async () => {
    const testData = { message: 'success' };
    vi.mocked(invoke).mockResolvedValue(testData);
    const { result } = renderHook(() => useTauriCommand<typeof testData>('test_command'));

    await act(async () => {
      await result.current.execute();
    });

    await waitFor(() => {
      expect(result.current.data).toEqual(testData);
      expect(result.current.error).toBeNull();
    });
  });

  it('returns data when command succeeds', async () => {
    const testData = { message: 'success' };
    vi.mocked(invoke).mockResolvedValue(testData);
    const { result } = renderHook(() => useTauriCommand<typeof testData>('test_command'));

    let returnedData: typeof testData | null = null;
    await act(async () => {
      returnedData = await result.current.execute();
    });

    expect(returnedData).toEqual(testData);
  });

  it('sets error when command fails', async () => {
    const testError = new Error('Command failed');
    vi.mocked(invoke).mockRejectedValue(testError);
    const { result } = renderHook(() => useTauriCommand<string>('test_command'));

    await act(async () => {
      await result.current.execute();
    });

    await waitFor(() => {
      expect(result.current.error).toBe('Command failed');
      expect(result.current.data).toBeNull();
    });
  });

  it('returns null when command fails', async () => {
    const testError = new Error('Command failed');
    vi.mocked(invoke).mockRejectedValue(testError);
    const { result } = renderHook(() => useTauriCommand<string>('test_command'));

    let returnedData: string | null = null;
    await act(async () => {
      returnedData = await result.current.execute();
    });

    expect(returnedData).toBeNull();
  });

  it('handles non-Error exceptions', async () => {
    vi.mocked(invoke).mockRejectedValue('String error');
    const { result } = renderHook(() => useTauriCommand<string>('test_command'));

    await act(async () => {
      await result.current.execute();
    });

    await waitFor(() => {
      expect(result.current.error).toBe('String error');
    });
  });

  it('passes arguments to invoke', async () => {
    vi.mocked(invoke).mockResolvedValue('result');
    const { result } = renderHook(() => useTauriCommand<string>('test_command'));

    await act(async () => {
      await result.current.execute({ arg1: 'value1', arg2: 'value2' });
    });

    expect(invoke).toHaveBeenCalledWith('test_command', { arg1: 'value1', arg2: 'value2' });
  });

  it('passes undefined when no arguments provided', async () => {
    vi.mocked(invoke).mockResolvedValue('result');
    const { result } = renderHook(() => useTauriCommand<string>('test_command'));

    await act(async () => {
      await result.current.execute();
    });

    expect(invoke).toHaveBeenCalledWith('test_command', undefined);
  });

  it('clears previous error on new execute', async () => {
    vi.mocked(invoke)
      .mockRejectedValueOnce(new Error('First error'))
      .mockResolvedValueOnce('success');
    const { result } = renderHook(() => useTauriCommand<string>('test_command'));

    // First call fails
    await act(async () => {
      await result.current.execute();
    });
    await waitFor(() => {
      expect(result.current.error).toBe('First error');
    });

    // Second call succeeds
    await act(async () => {
      await result.current.execute();
    });
    await waitFor(() => {
      expect(result.current.error).toBeNull();
      expect(result.current.data).toBe('success');
    });
  });
});
