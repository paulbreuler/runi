/**
 * Mock implementation of @tauri-apps/api/window for Storybook
 *
 * This module provides mock implementations of Tauri window functions
 * that are not available in the browser environment.
 */

/**
 * Mock window object that implements the Tauri Window interface.
 */
class MockWindow {
  /**
   * Mock minimize function.
   */
  async minimize(): Promise<void> {
    console.log('[Storybook Mock] window.minimize() called');
    return Promise.resolve();
  }

  /**
   * Mock maximize function.
   */
  async maximize(): Promise<void> {
    console.log('[Storybook Mock] window.maximize() called');
    return Promise.resolve();
  }

  /**
   * Mock unmaximize function.
   */
  async unmaximize(): Promise<void> {
    console.log('[Storybook Mock] window.unmaximize() called');
    return Promise.resolve();
  }

  /**
   * Mock close function.
   */
  async close(): Promise<void> {
    console.log('[Storybook Mock] window.close() called');
    return Promise.resolve();
  }

  /**
   * Mock isMaximized function.
   */
  async isMaximized(): Promise<boolean> {
    console.log('[Storybook Mock] window.isMaximized() called');
    return Promise.resolve(false);
  }

  /**
   * Mock listen function for window events.
   */
  async listen<T>(_event: string, _handler: (event: { payload: T }) => void): Promise<() => void> {
    console.log('[Storybook Mock] window.listen() called', { event: _event });
    // Return a no-op unsubscribe function
    return () => {
      console.log('[Storybook Mock] window.listen() unsubscribe called');
    };
  }

  /**
   * Mock setFocus function.
   */
  async setFocus(): Promise<void> {
    console.log('[Storybook Mock] window.setFocus() called');
    return Promise.resolve();
  }

  /**
   * Mock setFullscreen function.
   */
  async setFullscreen(_fullscreen: boolean): Promise<void> {
    console.log('[Storybook Mock] window.setFullscreen() called', { fullscreen: _fullscreen });
    return Promise.resolve();
  }
}

/**
 * Mock getCurrentWindow function.
 * Returns a mock window object that implements the Tauri Window interface.
 */
export function getCurrentWindow(): MockWindow {
  console.log('[Storybook Mock] getCurrentWindow() called');
  return new MockWindow();
}

/**
 * Export the MockWindow type for type compatibility.
 */
export type Window = MockWindow;
