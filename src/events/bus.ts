/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

/**
 * Event bus for loose coupling between components.
 *
 * Provides a publish-subscribe pattern for component communication.
 * Components can emit events and listen to events without direct coupling.
 *
 * This enables:
 * - Loose coupling between components
 * - Plugin/extensions to listen to events
 * - AI integration to react to events
 * - Testability (easy to mock event bus)
 */

/**
 * Event type identifiers.
 *
 * Use dot notation for namespacing (e.g., 'request.send', 'response.received').
 */
export type EventType =
  | 'request.send'
  | 'request.method-changed'
  | 'request.url-changed'
  | 'response.received'
  | 'response.error'
  | 'sidebar.toggled'
  | 'sidebar.visible-changed'
  | 'history.entry-selected'
  | 'ai.suggestion-requested'
  | 'ai.suggestion-available'
  | 'ai.error-analysis'
  | 'command.executed'
  | 'console.debug-emitted'
  | 'console.info-emitted'
  | 'console.warn-emitted'
  | 'console.error-emitted'
  | 'panel.console-requested'
  | 'toast.show';

/**
 * Toast notification type.
 */
export type ToastType = 'error' | 'warning' | 'info' | 'success';

/**
 * Toast event payload for loose coupling.
 * Components emit this event instead of calling the store directly.
 */
export interface ToastEventPayload {
  /** Type of toast (determines styling) */
  type: ToastType;
  /** Toast message */
  message: string;
  /** Optional detailed description */
  details?: string;
  /** Optional correlation ID for error tracing */
  correlationId?: string;
  /** Auto-dismiss duration in milliseconds (default: 5000ms, errors: never) */
  duration?: number;
  /** Optional test ID for testing purposes */
  testId?: string;
}

/**
 * Event payload structure.
 */
export interface Event<T = unknown> {
  /** Event type identifier */
  type: EventType;
  /** Event payload data */
  payload: T;
  /** Timestamp when event was emitted */
  timestamp: number;
  /** Optional source identifier (component/plugin that emitted) */
  source?: string;
}

/**
 * Event handler function type.
 */
export type EventHandler<T = unknown> = (event: Event<T>) => void;

/**
 * Event bus for pub/sub communication.
 *
 * @example
 * ```typescript
 * const bus = new EventBus();
 *
 * // Listen to events
 * const unsubscribe = bus.on('response.received', (event) => {
 *   console.log('Response:', event.payload);
 * });
 *
 * // Emit events
 * bus.emit('request.send', { url: 'https://api.example.com' });
 *
 * // Cleanup
 * unsubscribe();
 * ```
 */
export class EventBus {
  private listeners = new Map<EventType, Set<EventHandler>>();

  /**
   * Emits an event to all registered listeners.
   *
   * @param type - The event type
   * @param payload - The event payload
   * @param source - Optional source identifier
   */
  public emit<T>(type: EventType, payload: T, source?: string): Event<T> {
    const event: Event<T> = {
      type,
      payload,
      timestamp: Date.now(),
      source,
    };

    const handlers = this.listeners.get(type);
    if (handlers !== undefined) {
      handlers.forEach((handler) => {
        try {
          handler(event);
        } catch (error) {
          // Log error but don't break other handlers
          console.error(`Error in event handler for '${type}':`, error);
        }
      });
    }
    return event;
  }

  /**
   * Registers an event listener.
   *
   * @param type - The event type to listen for
   * @param handler - The handler function
   * @returns Unsubscribe function
   */
  public on<T>(type: EventType, handler: EventHandler<T>): () => void {
    let handlers = this.listeners.get(type);
    if (handlers === undefined) {
      handlers = new Set();
      this.listeners.set(type, handlers);
    }
    handlers.add(handler as EventHandler);

    // Return unsubscribe function
    return () => {
      this.off(type, handler);
    };
  }

  /**
   * Unregisters an event listener.
   *
   * @param type - The event type
   * @param handler - The handler function to remove
   */
  public off<T>(type: EventType, handler: EventHandler<T>): void {
    const handlers = this.listeners.get(type);
    if (handlers !== undefined) {
      handlers.delete(handler as EventHandler);
      if (handlers.size === 0) {
        this.listeners.delete(type);
      }
    }
  }

  /**
   * Registers a one-time event listener.
   *
   * Listener is automatically removed after first event.
   *
   * @param type - The event type to listen for
   * @param handler - The handler function
   * @returns Unsubscribe function
   */
  public once<T>(type: EventType, handler: EventHandler<T>): () => void {
    const wrappedHandler: EventHandler<T> = (event) => {
      handler(event);
      this.off(type, wrappedHandler);
    };
    return this.on(type, wrappedHandler);
  }

  /**
   * Removes all listeners for an event type.
   *
   * @param type - The event type (optional, removes all if not provided)
   */
  public removeAllListeners(type?: EventType): void {
    if (type !== undefined) {
      this.listeners.delete(type);
    } else {
      this.listeners.clear();
    }
  }

  /**
   * Gets the number of listeners for an event type.
   *
   * @param type - The event type
   * @returns Number of listeners
   */
  public listenerCount(type: EventType): number {
    return this.listeners.get(type)?.size ?? 0;
  }
}

/**
 * Global event bus instance.
 * Can be used as a singleton or provided via context.
 */
export const globalEventBus = new EventBus();
