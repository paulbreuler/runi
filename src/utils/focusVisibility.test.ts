/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { focusWithVisibility, isEditableElement } from './focusVisibility';

describe('focusWithVisibility', () => {
  let element: HTMLButtonElement;

  beforeEach(() => {
    element = document.createElement('button');
    element.setAttribute('data-testid', 'test-button');
    document.body.appendChild(element);
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('focuses the element', () => {
    focusWithVisibility(element);
    expect(document.activeElement).toBe(element);
  });

  it('adds data-focus-visible-added attribute', () => {
    focusWithVisibility(element);
    expect(element.hasAttribute('data-focus-visible-added')).toBe(true);
  });

  it('removes attribute from previously focused element', () => {
    const element2 = document.createElement('button');
    element2.setAttribute('data-testid', 'test-button-2');
    document.body.appendChild(element2);

    focusWithVisibility(element);
    expect(element.hasAttribute('data-focus-visible-added')).toBe(true);

    focusWithVisibility(element2);
    expect(element.hasAttribute('data-focus-visible-added')).toBe(false);
    expect(element2.hasAttribute('data-focus-visible-added')).toBe(true);
  });

  it('removes attribute when element loses focus via blur', () => {
    const element2 = document.createElement('button');
    element2.setAttribute('data-testid', 'test-button-2');
    document.body.appendChild(element2);

    focusWithVisibility(element);
    expect(element.hasAttribute('data-focus-visible-added')).toBe(true);

    // Simulate blur by focusing another element natively
    element2.focus();
    expect(element.hasAttribute('data-focus-visible-added')).toBe(false);
  });

  it('handles null element gracefully', () => {
    expect(() => {
      focusWithVisibility(null);
    }).not.toThrow();
  });

  it('does not remove attribute when focusing same element', () => {
    focusWithVisibility(element);
    expect(element.hasAttribute('data-focus-visible-added')).toBe(true);

    // Focus same element again
    focusWithVisibility(element);
    expect(element.hasAttribute('data-focus-visible-added')).toBe(true);
  });

  it('passes focus options to element.focus()', () => {
    const focusSpy = vi.spyOn(element, 'focus');
    const options: FocusOptions = { preventScroll: true };

    focusWithVisibility(element, options);

    expect(focusSpy).toHaveBeenCalledWith(options);
  });

  it('cleans up blur event listener after blur', () => {
    const element2 = document.createElement('button');
    document.body.appendChild(element2);

    const removeEventListenerSpy = vi.spyOn(element, 'removeEventListener');

    focusWithVisibility(element);
    element2.focus(); // Trigger blur

    // Verify cleanup was called
    expect(removeEventListenerSpy).toHaveBeenCalledWith('blur', expect.any(Function));
  });
});

describe('isEditableElement', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('returns true for INPUT element', () => {
    const input = document.createElement('input');
    document.body.appendChild(input);
    expect(isEditableElement(input)).toBe(true);
  });

  it('returns true for TEXTAREA element', () => {
    const textarea = document.createElement('textarea');
    document.body.appendChild(textarea);
    expect(isEditableElement(textarea)).toBe(true);
  });

  it('returns true for contenteditable element', () => {
    const div = document.createElement('div');
    div.contentEditable = 'true';
    document.body.appendChild(div);
    expect(isEditableElement(div)).toBe(true);
  });

  it('returns false for button element', () => {
    const button = document.createElement('button');
    document.body.appendChild(button);
    expect(isEditableElement(button)).toBe(false);
  });

  it('returns false for div element', () => {
    const div = document.createElement('div');
    document.body.appendChild(div);
    expect(isEditableElement(div)).toBe(false);
  });

  it('returns false for null', () => {
    expect(isEditableElement(null)).toBe(false);
  });

  it('returns false for anchor element', () => {
    const anchor = document.createElement('a');
    anchor.href = '#';
    document.body.appendChild(anchor);
    expect(isEditableElement(anchor)).toBe(false);
  });

  it('returns true for input type="text"', () => {
    const input = document.createElement('input');
    input.type = 'text';
    document.body.appendChild(input);
    expect(isEditableElement(input)).toBe(true);
  });

  it('returns true for input type="password"', () => {
    const input = document.createElement('input');
    input.type = 'password';
    document.body.appendChild(input);
    expect(isEditableElement(input)).toBe(true);
  });

  it('returns true for input type="email"', () => {
    const input = document.createElement('input');
    input.type = 'email';
    document.body.appendChild(input);
    expect(isEditableElement(input)).toBe(true);
  });
});
