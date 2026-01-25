/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useRef } from 'react';
import { useClickOutside } from './useClickOutside';

describe('useClickOutside', () => {
  it('calls handler when clicking outside element', () => {
    const handler: (event: MouseEvent | TouchEvent) => void = vi.fn();
    const { result } = renderHook(() => {
      const ref = useRef<HTMLDivElement>(null);
      useClickOutside(ref, handler);
      return ref;
    });

    const div = document.createElement('div');
    document.body.appendChild(div);
    result.current.current = div;

    const outsideElement = document.createElement('div');
    document.body.appendChild(outsideElement);

    const event = new MouseEvent('mousedown', { bubbles: true });
    outsideElement.dispatchEvent(event);

    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler).toHaveBeenCalledWith(expect.any(MouseEvent));

    document.body.removeChild(div);
    document.body.removeChild(outsideElement);
  });

  it('does not call handler when clicking inside element', () => {
    const handler: (event: MouseEvent | TouchEvent) => void = vi.fn();
    const { result } = renderHook(() => {
      const ref = useRef<HTMLDivElement>(null);
      useClickOutside(ref, handler);
      return ref;
    });

    const div = document.createElement('div');
    const innerDiv = document.createElement('div');
    div.appendChild(innerDiv);
    document.body.appendChild(div);
    result.current.current = div;

    const event = new MouseEvent('mousedown', { bubbles: true });
    innerDiv.dispatchEvent(event);

    expect(handler).not.toHaveBeenCalled();

    document.body.removeChild(div);
  });

  it('does not call handler when disabled', () => {
    const handler: (event: MouseEvent | TouchEvent) => void = vi.fn();
    const { result } = renderHook(() => {
      const ref = useRef<HTMLDivElement>(null);
      useClickOutside(ref, handler, false);
      return ref;
    });

    const div = document.createElement('div');
    document.body.appendChild(div);
    result.current.current = div;

    const outsideElement = document.createElement('div');
    document.body.appendChild(outsideElement);

    const event = new MouseEvent('mousedown', { bubbles: true });
    outsideElement.dispatchEvent(event);

    expect(handler).not.toHaveBeenCalled();

    document.body.removeChild(div);
    document.body.removeChild(outsideElement);
  });

  it('handles touch events', () => {
    const handler: (event: MouseEvent | TouchEvent) => void = vi.fn();
    const { result } = renderHook(() => {
      const ref = useRef<HTMLDivElement>(null);
      useClickOutside(ref, handler);
      return ref;
    });

    const div = document.createElement('div');
    document.body.appendChild(div);
    result.current.current = div;

    const outsideElement = document.createElement('div');
    document.body.appendChild(outsideElement);

    const event = new TouchEvent('touchstart', { bubbles: true });
    outsideElement.dispatchEvent(event);

    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler).toHaveBeenCalledWith(expect.any(TouchEvent));

    document.body.removeChild(div);
    document.body.removeChild(outsideElement);
  });
});
